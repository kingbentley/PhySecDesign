import { DATA_FORMAT_VERSION } from "../../shared/release";
import type { RefusalCode } from "../../shared/refusal";

// The two checks every object call passes before anything is written (AD-20).

/** An object stops itself at most once in this many milliseconds (CA-41). */
export const STOP_LIMIT_MS = 30_000;

/** Text placed in the abort reason so that callers can recognise a version stop. */
export const VERSION_STOP_REASON = "site-studio:version-stop";

export type ReleaseDecision = "accept" | "stop" | "refuse";

/**
 * Decides what an object does with a call that carries `caller` as its release.
 * - Same release: accept.
 * - No release at all: refuse without stopping (only our own code calls objects).
 * - Another release: stop, unless the object stopped less than 30 s ago; then refuse.
 */
export function decideRelease(input: {
  own: string;
  caller: string | null;
  lastStopAt: number | null;
  now: number;
}): ReleaseDecision {
  if (input.caller === input.own) return "accept";
  if (!input.caller) return "refuse";
  if (input.lastStopAt !== null && Math.abs(input.now - input.lastStopAt) < STOP_LIMIT_MS) return "refuse";
  return "stop";
}

/** Returns the refusal for a recorded data-format version this build cannot serve, if any. */
export function formatRefusal(recorded: number, build: number = DATA_FORMAT_VERSION): RefusalCode | null {
  if (recorded > build) return "data_newer_than_build";
  if (recorded < build) return "update_not_completed";
  return null;
}

/**
 * True when an error thrown by an object call may mean the object stopped for a version change:
 * the error names the version-stop reason, or the runtime reports a reset of the object, which a
 * stop is one cause of among others. Use `isVersionStopShown` to tell a stop apart from a reset.
 */
export function isVersionStop(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if ((error as { durableObjectReset?: unknown }).durableObjectReset === true) return true;
  return error.message.includes(VERSION_STOP_REASON);
}

/**
 * True only when the error carries the version-stop reason itself, so the stop is known to have
 * happened before anything was written (D-2). A bare reset may follow a committed write.
 */
export function isVersionStopShown(error: unknown): boolean {
  return error instanceof Error && error.message.includes(VERSION_STOP_REASON);
}
