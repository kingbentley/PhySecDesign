import { DurableObject } from "cloudflare:workers";
import { RELEASE, RELEASE_HEADER, DATA_FORMAT_VERSION } from "../../shared/release";
import { isRefusalCode, refusalBody } from "../../shared/refusal";
import { jsonResponse, refusalBodyResponse, refusalResponse } from "../http";
import { AlarmSchedule } from "./alarmSchedule";
import { applyConversions, CONVERSIONS, type Conversion, type ConversionResult } from "./conversions";
import { decideRelease, formatRefusal, VERSION_STOP_REASON } from "./versionGuard";

// The shared base of the two Durable Object classes (AD-2, AD-20). It records the data-format
// version when the object is first created, guards every call with the release and format
// checks before anything is written, and owns the object's one alarm.

export interface ObjectOp {
  run(input: unknown): unknown | Promise<unknown>;
  /** Answered whatever the caller's release. No operation is so marked yet. */
  versionIndependent?: boolean;
}

export interface ObjectMeta {
  formatVersion: number;
  /** UTC, ISO 8601. */
  createdAt: string;
  /** Milliseconds since the epoch of the last version stop, or null. */
  lastStopAt: number | null;
}

/** A refusal raised inside an operation; the base turns it into a refusal reply. */
export class OperationRefusal extends Error {
  constructor(
    readonly code: string,
    readonly field?: string,
    /** Whole seconds the caller must wait, for refusals that impose a wait. */
    readonly retryAfterSeconds?: number,
  ) {
    super(code);
  }
}

export const META_TABLE = "_meta";

/** How long to wait before looking again at work that could not run (format mismatch, no handler). */
export const ALARM_RETRY_MS = 60_000;

export abstract class ObjectBase<E = unknown> extends DurableObject<E> {
  /** Changes every time the object starts; used to observe restarts. */
  readonly startId: string = crypto.randomUUID();
  /** The operations other code may call on this object, by name. */
  readonly ops = new Map<string, ObjectOp>();
  /** Work run when the object's alarm fires, by schedule kind. */
  protected readonly alarmHandlers = new Map<string, () => void | Promise<void>>();
  protected readonly schedule: AlarmSchedule;
  /** Name used in runtime log lines. */
  protected abstract readonly objectKind: string;

  constructor(ctx: DurableObjectState, env: E) {
    super(ctx, env);
    // Format bookkeeping: written once at first creation, then only by the conversion runner
    // (format version) and the version guard (stop time). No conversion touches this table.
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS ${META_TABLE} (
         id INTEGER PRIMARY KEY CHECK (id = 1),
         format_version INTEGER NOT NULL,
         created_at TEXT NOT NULL,
         last_stop_at INTEGER
       )`,
    );
    ctx.storage.sql.exec(
      `INSERT OR IGNORE INTO ${META_TABLE} (id, format_version, created_at) VALUES (1, ?, ?)`,
      DATA_FORMAT_VERSION,
      new Date().toISOString(),
    );
    this.schedule = new AlarmSchedule(ctx.storage);
  }

  readMeta(): ObjectMeta {
    const row = this.ctx.storage.sql
      .exec<{ format_version: number; created_at: string; last_stop_at: number | null }>(
        `SELECT format_version, created_at, last_stop_at FROM ${META_TABLE} WHERE id = 1`,
      )
      .one();
    return { formatVersion: row.format_version, createdAt: row.created_at, lastStopAt: row.last_stop_at };
  }

  /**
   * Applies conversions from the recorded data-format version up to `target`. Called only by the
   * update steps (Epic 9), never when the object starts.
   */
  runConversions(list: readonly Conversion[] = CONVERSIONS, target: number = DATA_FORMAT_VERSION): ConversionResult {
    return applyConversions(
      this.ctx.storage,
      list,
      () => this.readMeta().formatVersion,
      (version) => this.ctx.storage.sql.exec(`UPDATE ${META_TABLE} SET format_version = ? WHERE id = 1`, version),
      target,
    );
  }

  /** Every call to an object arrives here: `POST /<operation>` with the caller's release header. */
  override async fetch(request: Request): Promise<Response> {
    const name = new URL(request.url).pathname.replace(/^\/+/, "");
    const op = this.ops.get(name);

    // Both checks come before any write, so a refused call cannot leave partial data. The release
    // check also comes before the lookup: an operation unknown here may be one a newer release has.
    if (!op?.versionIndependent) {
      const refused = await this.guardRelease(request.headers.get(RELEASE_HEADER));
      if (refused) return refused;
    }
    if (!op) return refusalResponse("not_found");
    const format = formatRefusal(this.readMeta().formatVersion);
    if (format) return refusalResponse(format);

    const text = await request.text();
    const input: unknown = text ? JSON.parse(text) : null;
    try {
      const value = await op.run(input);
      return jsonResponse({ value: value ?? null });
    } catch (error) {
      if (error instanceof OperationRefusal && isRefusalCode(error.code)) {
        return refusalBodyResponse(refusalBody(error.code, { field: error.field, retryAfterSeconds: error.retryAfterSeconds }));
      }
      throw error;
    }
  }

  /**
   * Runs the work that is due. A kind leaves the schedule only after its handler succeeded; if a
   * handler throws, the error reaches the runtime, which retries the alarm with the rest kept.
   * Nothing runs while the data format does not match this build (rows are kept for later).
   */
  override async alarm(): Promise<void> {
    await this.runDueWork(Date.now());
  }

  protected async runDueWork(now: number): Promise<void> {
    const format = formatRefusal(this.readMeta().formatVersion);
    if (format) {
      // The fired alarm is used up, so keep a wake-up: check again later, rows untouched.
      this.log("alarm_skipped", { reason: format });
      await this.ctx.storage.setAlarm(now + ALARM_RETRY_MS);
      return;
    }
    for (const { kind, dueAt } of this.schedule.due(now)) {
      // An earlier handler may have moved or removed this kind; run only what is still due.
      if (!this.schedule.isStillDue(kind, dueAt, now)) continue;
      const handler = this.alarmHandlers.get(kind);
      if (!handler) {
        // Keep the work for a build that has the handler, and look again later.
        this.log("alarm_without_handler", { kind });
        this.schedule.postpone(kind, now + ALARM_RETRY_MS);
        continue;
      }
      await handler();
      this.schedule.complete(kind, dueAt);
    }
    await this.schedule.rearm();
  }

  /**
   * The one-version-at-a-time rule. A call from another release is refused and the object stops
   * itself so that it starts again on the deployed code; at most once in 30 s, with the stop
   * time written to storage first so the limit holds across the restart.
   */
  private async guardRelease(caller: string | null): Promise<Response | null> {
    const now = Date.now();
    const decision = decideRelease({ own: RELEASE, caller, lastStopAt: this.readMeta().lastStopAt, now });
    if (decision === "accept") return null;
    if (decision === "refuse") {
      this.log("version_refused", { ownRelease: RELEASE, callerRelease: caller });
      return refusalResponse("updating");
    }
    this.ctx.storage.sql.exec(`UPDATE ${META_TABLE} SET last_stop_at = ? WHERE id = 1`, now);
    await this.ctx.storage.sync();
    this.log("version_stop", { ownRelease: RELEASE, callerRelease: caller });
    this.ctx.abort(`${VERSION_STOP_REASON}: release ${RELEASE} called by ${caller}`);
    // ctx.abort() throws; this line is reached only where abort is not supported.
    return refusalResponse("updating");
  }

  protected log(event: string, details: Record<string, unknown>): void {
    console.log(JSON.stringify({ event, object: this.objectKind, startId: this.startId, ...details }));
  }
}
