import { candidateSteps, stepAt, totpAt } from "../server/auth/totp";

// Authenticator codes chosen so a two-step test cannot pass or fail by a code collision (story 1.5,
// D-6). The server accepts the codes of the previous, current and next step and answers the latest
// matching step, so a "wrong" value must differ from the code of every step that can be in the
// window when the server checks it, and a "right" value must not also be the code of another step
// the test relies on being refused or accepted. Codes are computed at run time from secrets the
// tests receive; nothing is written to a file.

const STEP_MS = 30_000;

/** The codes of `secret` for each of `steps`, in order. */
export function codesFor(secret: Uint8Array, steps: number[]): Promise<string[]> {
  return Promise.all(steps.map((step) => totpAt(secret, step)));
}

/** True when the codes of `secret` for `steps` are pairwise different. */
export async function distinctCodes(secret: Uint8Array, steps: number[]): Promise<boolean> {
  return new Set(await codesFor(secret, steps)).size === steps.length;
}

/**
 * The first six-digit value, counting up from 000000, that is none of the codes of `secret` for
 * `steps`. At most `steps.length` values are skipped, so it always ends.
 */
export async function codeOutside(secret: Uint8Array, steps: number[]): Promise<string> {
  const taken = new Set(await codesFor(secret, steps));
  for (let value = 0; ; value += 1) {
    const code = String(value).padStart(6, "0");
    if (!taken.has(code)) return code;
  }
}

/** A value that is none of the codes accepted at the fixed moment `now`, whatever the last accepted step. */
export function wrongCodeAt(secret: Uint8Array, now: number): Promise<string> {
  return codeOutside(secret, candidateSteps(now));
}

/**
 * The steps that can be in the window when a request sent on the live clock is checked: from two
 * steps before the current one to three steps ahead (the window at this moment, previous to next,
 * widened by one step back and two ahead), so a check made up to a minute after this call (two step
 * boundaries crossed) still meets only excluded codes.
 */
export function liveSteps(now = Date.now()): number[] {
  const current = stepAt(now);
  return [current - 2, current - 1, current, current + 1, current + 2, current + 3];
}

/** A value that is none of the codes any step in the window can have while a live request is checked. */
export function wrongCodeLive(secret: Uint8Array): Promise<string> {
  return codeOutside(secret, liveSteps());
}

/**
 * The first step start `from + k * 30 s` (k = 0 to `maxSteps`) at which `ok` holds, for fixed-clock
 * tests that need a moment where particular codes differ; throws when none does.
 */
export async function firstMomentWhere(from: number, ok: (moment: number) => Promise<boolean>, maxSteps = 18): Promise<number> {
  for (let k = 0; k <= maxSteps; k += 1) {
    const moment = from + k * STEP_MS;
    if (await ok(moment)) return moment;
  }
  throw new Error("No moment in range has the codes the test needs.");
}
