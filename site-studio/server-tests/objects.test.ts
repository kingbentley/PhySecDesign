import { env } from "cloudflare:workers";
import { evictDurableObject, runInDurableObject } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import { DATA_FORMAT_VERSION, RELEASE } from "../shared/release";
import { Installation } from "../server/installation/Installation";
import { ProjectRoom } from "../server/project-room/ProjectRoom";
import { CONVERSIONS, type Conversion } from "../server/objects/conversions";
import { callObject } from "../server/objects/call";
import type { ObjectBase } from "../server/objects/ObjectBase";
import { decideRelease, formatRefusal, isVersionStop, STOP_LIMIT_MS, VERSION_STOP_REASON } from "../server/objects/versionGuard";
import { rawObjectCall, tableExists } from "./helpers";

const OTHER_RELEASE = RELEASE + "-other";

function installationStub(name: string) {
  return env.INSTALLATION.get(env.INSTALLATION.idFromName(name));
}

function roomStub(name: string) {
  return env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName(name));
}

function loggedEvents(spy: { mock: { calls: unknown[][] } }): Record<string, unknown>[] {
  return spy.mock.calls.flatMap(([line]) => {
    try {
      return typeof line === "string" ? [JSON.parse(line) as Record<string, unknown>] : [];
    } catch {
      return [];
    }
  });
}

const startIdOf = (stub: DurableObjectStub<Installation> | DurableObjectStub<ProjectRoom>) =>
  runInDurableObject(stub as DurableObjectStub<Installation>, (instance: ObjectBase) => instance.startId);

describe("data-format version", () => {
  it("is recorded when each object is first created and read back after a restart", async () => {
    for (const stub of [installationStub("format-restart"), roomStub("format-restart")]) {
      const before = await runInDurableObject(stub as DurableObjectStub<Installation>, (instance: ObjectBase) => ({
        meta: instance.readMeta(),
        startId: instance.startId,
      }));
      expect(before.meta.formatVersion).toBe(DATA_FORMAT_VERSION);
      expect(Number.isNaN(Date.parse(before.meta.createdAt))).toBe(false);

      await evictDurableObject(stub);
      const after = await runInDurableObject(stub as DurableObjectStub<Installation>, (instance: ObjectBase) => ({
        meta: instance.readMeta(),
        startId: instance.startId,
      }));
      expect(after.startId).not.toBe(before.startId);
      expect(after.meta.formatVersion).toBe(DATA_FORMAT_VERSION);
      expect(after.meta.createdAt).toBe(before.meta.createdAt);
    }
  });

  it("refuses requests when the recorded version is newer or older than the build's", async () => {
    const id = env.INSTALLATION.idFromName("format-guard");
    const stub = env.INSTALLATION.get(id);
    const setVersion = (version: number) =>
      runInDurableObject(stub, (_instance, state) => {
        state.storage.sql.exec("UPDATE _meta SET format_version = ? WHERE id = 1", version);
      });

    await setVersion(DATA_FORMAT_VERSION + 1);
    const newer = await callObject(env.INSTALLATION, id, "status");
    expect(newer.ok).toBe(false);
    if (!newer.ok) {
      expect(newer.body.error.code).toBe("data_newer_than_build");
      expect(newer.body.error.message).toMatch(/newer release/);
    }

    await setVersion(DATA_FORMAT_VERSION - 1);
    const older = await callObject(env.INSTALLATION, id, "status");
    expect(older.ok).toBe(false);
    if (!older.ok) {
      expect(older.body.error.code).toBe("update_not_completed");
      expect(older.body.error.message).toMatch(/update was not completed/);
    }

    await setVersion(DATA_FORMAT_VERSION);
    expect((await callObject(env.INSTALLATION, id, "status")).ok).toBe(true);
  });

  it("maps recorded versions to refusals", () => {
    expect(formatRefusal(2, 1)).toBe("data_newer_than_build");
    expect(formatRefusal(0, 1)).toBe("update_not_completed");
    expect(formatRefusal(1, 1)).toBeNull();
  });
});

describe("conversion runner", () => {
  it("ships an empty list and is never run by an object starting", async () => {
    expect(CONVERSIONS).toEqual([]);
    const stub = roomStub("conversions-start");
    const startMeta = await runInDurableObject(stub as DurableObjectStub<Installation>, (instance: ObjectBase) => instance.readMeta());
    expect(startMeta.formatVersion).toBe(DATA_FORMAT_VERSION);
  });

  it("applies a sample conversion once, in order, and raises the recorded version", async () => {
    const stub = roomStub("conversions-sample");
    const sample: Conversion = {
      from: 1,
      to: 2,
      description: "add sample table",
      run(sql) {
        sql.exec("CREATE TABLE IF NOT EXISTS sample (id INTEGER PRIMARY KEY, note TEXT)");
        sql.exec("INSERT INTO sample (note) VALUES ('converted')");
      },
    };
    const result = await runInDurableObject(stub as DurableObjectStub<Installation>, (instance: ObjectBase, state) => {
      const first = instance.runConversions([sample], 2);
      const second = instance.runConversions([sample], 2);
      const rows = state.storage.sql.exec("SELECT COUNT(*) AS n FROM sample").one().n;
      return { first, second, rows, meta: instance.readMeta() };
    });
    expect(result.first).toEqual({ from: 1, to: 2, applied: ["add sample table"] });
    expect(result.second).toEqual({ from: 2, to: 2, applied: [] });
    expect(result.rows).toBe(1);
    expect(result.meta.formatVersion).toBe(2);

    // A restart does not run anything again.
    await evictDurableObject(stub);
    const afterRestart = await runInDurableObject(stub as DurableObjectStub<Installation>, (instance: ObjectBase, state) => ({
      rows: state.storage.sql.exec("SELECT COUNT(*) AS n FROM sample").one().n,
      meta: instance.readMeta(),
    }));
    expect(afterRestart.rows).toBe(1);
    expect(afterRestart.meta.formatVersion).toBe(2);
  });

  it("keeps the data at the last completed step when a conversion fails", async () => {
    const stub = roomStub("conversions-failure");
    const broken: Conversion[] = [
      { from: 1, to: 2, description: "first", run: (sql) => void sql.exec("CREATE TABLE one (id INTEGER)") },
      {
        from: 2,
        to: 3,
        description: "second",
        run: (sql) => {
          sql.exec("CREATE TABLE two (id INTEGER)");
          throw new Error("conversion failed");
        },
      },
    ];
    const outcome = await runInDurableObject(stub as DurableObjectStub<Installation>, (instance: ObjectBase, state) => {
      let failed = false;
      try {
        instance.runConversions(broken, 3);
      } catch {
        failed = true;
      }
      return {
        failed,
        version: instance.readMeta().formatVersion,
        one: tableExists(state.storage.sql, "one"),
        two: tableExists(state.storage.sql, "two"),
      };
    });
    expect(outcome).toEqual({ failed: true, version: 2, one: true, two: false });
  });
});

describe("one version at a time", () => {
  it("decides by release and the 30-second stop limit", () => {
    const now = 1_000_000;
    expect(decideRelease({ own: "1.0.0", caller: "1.0.0", lastStopAt: null, now })).toBe("accept");
    expect(decideRelease({ own: "1.0.0", caller: "1.1.0", lastStopAt: null, now })).toBe("stop");
    expect(decideRelease({ own: "1.0.0", caller: "1.1.0", lastStopAt: now - STOP_LIMIT_MS + 1, now })).toBe("refuse");
    expect(decideRelease({ own: "1.0.0", caller: "1.1.0", lastStopAt: now - STOP_LIMIT_MS, now })).toBe("stop");
    expect(decideRelease({ own: "1.0.0", caller: null, lastStopAt: null, now })).toBe("refuse");
  });

  it("refuses a busy object's call from another release, keeps nothing and restarts it", async () => {
    const stub = installationStub("version-mismatch");
    // The object is running and in use; a probe operation would write if it ran.
    const before = await runInDurableObject(stub, (instance: ObjectBase, state) => {
      instance.ops.set("probe-write", {
        run: () => {
          state.storage.sql.exec("CREATE TABLE IF NOT EXISTS probe (id INTEGER PRIMARY KEY)");
          state.storage.sql.exec("INSERT INTO probe DEFAULT VALUES");
          return "written";
        },
      });
      return instance.startId;
    });

    const log = vi.spyOn(console, "log");
    let thrown: unknown = null;
    let response: Response | null = null;
    try {
      response = await rawObjectCall(stub, "probe-write", OTHER_RELEASE);
    } catch (error) {
      thrown = error;
    }
    expect(loggedEvents(log)).toContainEqual(
      expect.objectContaining({ event: "version_stop", ownRelease: RELEASE, callerRelease: OTHER_RELEASE }),
    );
    log.mockRestore();
    // ctx.abort() surfaces in the caller as an error recognised as a version stop.
    expect(response).toBeNull();
    expect(isVersionStop(thrown)).toBe(true);

    const fresh = installationStub("version-mismatch");
    const after = await runInDurableObject(fresh, (instance: ObjectBase, state) => ({
      startId: instance.startId,
      probeTable: tableExists(state.storage.sql, "probe"),
      hasProbeOp: instance.ops.has("probe-write"),
      lastStopAt: instance.readMeta().lastStopAt,
    }));
    expect(after.startId).not.toBe(before);
    expect(after.probeTable).toBe(false);
    expect(after.hasProbeOp).toBe(false);
    expect(after.lastStopAt).not.toBeNull();
  });

  it("refuses without stopping again within 30 seconds, across the restart", async () => {
    const name = "version-limit";
    const first = installationStub(name);
    const startBeforeStop = await startIdOf(first);
    await expect(rawObjectCall(first, "status", OTHER_RELEASE)).rejects.toSatisfy(isVersionStop);
    const restarted = installationStub(name);
    const startAfterStop = await startIdOf(restarted);
    expect(startAfterStop).not.toBe(startBeforeStop);
    const stopTime = await runInDurableObject(restarted, (instance: ObjectBase) => instance.readMeta().lastStopAt);
    expect(stopTime).not.toBeNull();

    const log = vi.spyOn(console, "log");
    const second = await rawObjectCall(restarted, "status", OTHER_RELEASE);
    expect(loggedEvents(log)).toContainEqual(
      expect.objectContaining({ event: "version_refused", ownRelease: RELEASE, callerRelease: OTHER_RELEASE }),
    );
    expect(loggedEvents(log).some((entry) => entry.event === "version_stop")).toBe(false);
    log.mockRestore();
    expect(second.status).toBe(503);
    expect(second.headers.get("retry-after")).not.toBeNull();
    const body = (await second.json()) as { error: { code: string } };
    expect(body.error.code).toBe("updating");
    expect(await startIdOf(restarted)).toBe(startAfterStop);
    expect(await runInDurableObject(restarted, (instance: ObjectBase) => instance.readMeta().lastStopAt)).toBe(stopTime);

    // The object still answers its own release.
    const ok = await callObject(env.INSTALLATION, env.INSTALLATION.idFromName(name), "status");
    expect(ok.ok).toBe(true);
  });

  it("stops for a call from another release to an operation it does not know, not not_found", async () => {
    const name = "version-unknown-op";
    const stub = installationStub(name);
    const before = await startIdOf(stub);
    await expect(rawObjectCall(stub, "operation-from-a-newer-release", OTHER_RELEASE)).rejects.toSatisfy(isVersionStop);
    const restarted = installationStub(name);
    expect(await startIdOf(restarted)).not.toBe(before);

    // Within 30 s it is refused as updating, still not not_found.
    const again = await rawObjectCall(restarted, "operation-from-a-newer-release", OTHER_RELEASE);
    expect(again.status).toBe(503);
    expect(((await again.json()) as { error: { code: string } }).error.code).toBe("updating");

    // Its own release still gets not_found for an unknown operation.
    const own = await rawObjectCall(restarted, "operation-from-a-newer-release", RELEASE);
    expect(own.status).toBe(404);
  });

  it("answers a call marked version-independent whatever the caller's release", async () => {
    const stub = installationStub("version-independent");
    const before = await runInDurableObject(stub, (instance: ObjectBase) => {
      instance.ops.set("independent", { versionIndependent: true, run: () => "answered" });
      return instance.startId;
    });
    const response = await rawObjectCall(stub, "independent", OTHER_RELEASE);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ value: "answered" });
    expect(await startIdOf(stub)).toBe(before);
  });

  it("marks no operation of either class as version-independent yet", async () => {
    for (const stub of [installationStub("marking"), roomStub("marking")]) {
      const marked = await runInDurableObject(stub as DurableObjectStub<Installation>, (instance: ObjectBase) =>
        [...instance.ops.entries()].filter(([, op]) => op.versionIndependent).map(([name]) => name),
      );
      expect(marked).toEqual([]);
    }
  });

  it("refuses a call that carries no release without stopping", async () => {
    const stub = installationStub("no-release");
    const before = await startIdOf(stub);
    const response = await rawObjectCall(stub, "status", null);
    expect(response.status).toBe(503);
    expect(await startIdOf(stub)).toBe(before);
  });
});

describe("the object-call helper", () => {
  function fakeNamespace(answer: () => Promise<Response>) {
    let calls = 0;
    const namespace = {
      get: () => ({
        fetch: async () => {
          calls += 1;
          return answer();
        },
      }),
    } as unknown as DurableObjectNamespace;
    return { namespace, calls: () => calls };
  }
  const id = {} as DurableObjectId;

  it("retries once after a version stop, then answers updating", async () => {
    const fake = fakeNamespace(async () => {
      throw new Error(`${VERSION_STOP_REASON}: test`);
    });
    const result = await callObject(fake.namespace, id, "status");
    expect(fake.calls()).toBe(2);
    expect(result).toEqual({ ok: false, status: 503, body: { error: expect.objectContaining({ code: "updating" }) } });
  });

  it("retries once after an updating refusal and returns the second answer", async () => {
    let attempt = 0;
    const fake = fakeNamespace(async () => {
      attempt += 1;
      return attempt === 1
        ? Response.json({ error: { code: "updating", message: "x" } }, { status: 503 })
        : Response.json({ value: { fine: true } });
    });
    const result = await callObject(fake.namespace, id, "status");
    expect(fake.calls()).toBe(2);
    expect(result).toEqual({ ok: true, value: { fine: true } });
  });

  it("does not retry other errors", async () => {
    const fake = fakeNamespace(async () => {
      throw new Error("something else");
    });
    await expect(callObject(fake.namespace, id, "status")).rejects.toThrow("something else");
    expect(fake.calls()).toBe(1);
  });

  it("is what the entry uses, so the release reaches the object", async () => {
    const result = await callObject(env.INSTALLATION, env.INSTALLATION.idFromName("helper-real"), "status");
    expect(result.ok).toBe(true);
  });
});

describe("exactly two object classes", () => {
  it("exports ProjectRoom and Installation from the entry", async () => {
    const entry = await import("../server/index");
    const classes = Object.entries(entry)
      .filter(([, value]) => typeof value === "function" && /^class\s/.test(Function.prototype.toString.call(value)))
      .map(([name]) => name)
      .sort();
    expect(classes).toEqual(["Installation", "ProjectRoom"]);
    expect(entry.Installation).toBe(Installation);
    expect(entry.ProjectRoom).toBe(ProjectRoom);
  });
});
