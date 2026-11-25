import { pendingCookieName } from "../server/auth/session";
import { stepAt, totpAt } from "../server/auth/totp";
import type { ObjectCallResult } from "../server/objects/call";
import { base32Decode } from "../shared/twoStep";

// Fixture inputs for the two-step operations (story 1.5, spec 2), shared by the three sweeps that
// run every registered operation of the installation object (setup, sign-in and invitation stores'
// pinned lists, and the two-step tables' own sweep). Each fixture prepares what its operation needs
// through the object's own operations on the live clock. The order is required: a sweep must run
// them in TWO_STEP_OPERATIONS order (twoStepState, accountCheck, startTwoStep, confirmTwoStep,
// renewRecoveryCodes, secondStep, turnOffTwoStep), after the operations that make the session and before
// endSession, because each fixture builds on the state the earlier ones left. A fixture whose
// preparation is refused still answers a well-formed input, which its operation then refuses, so
// a sweep must check each operation's result, or a refused operation passes unseen; the secondStep
// fixture's reset (off, start, confirm) instead throws when any of it is refused. Codes are
// computed at run time from the secret the start answered; nothing is written to a file.

export const TWO_STEP_OPERATIONS = [
  "twoStepState",
  "accountCheck",
  "startTwoStep",
  "confirmTwoStep",
  "renewRecoveryCodes",
  "secondStep",
  "turnOffTwoStep",
] as const;
export type TwoStepOperation = (typeof TWO_STEP_OPERATIONS)[number];

type Call = (operation: string, input: unknown) => Promise<ObjectCallResult<unknown>>;

const NO_TICKET = "0".repeat(64);

/** A new deployment key for one test: 32 random bytes, base64url without padding. */
export function newDeploymentKey(): string {
  let binary = "";
  for (const byte of crypto.getRandomValues(new Uint8Array(32))) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function twoStepFixtures(call: Call, cookies: () => Record<string, string>, deploymentKey: string): Record<TwoStepOperation, () => Promise<unknown>> {
  let secret: Uint8Array | null = null;
  const ticketFor = async (purpose: "turn_on" | "turn_off" | "fresh_codes") => {
    const result = await call("accountCheck", { cookies: cookies(), address: "unknown", purpose, deploymentKey });
    return result.ok ? (result.value as { ticket: string }).ticket : NO_TICKET;
  };
  return {
    twoStepState: async () => ({ cookies: cookies(), deploymentKey }),
    accountCheck: async () => ({ cookies: cookies(), address: "unknown", purpose: "turn_on", deploymentKey }),
    startTwoStep: async () => ({ cookies: cookies(), ticket: await ticketFor("turn_on"), outcome: "success", deploymentKey }),
    confirmTwoStep: async () => {
      const started = await call("startTwoStep", { cookies: cookies(), ticket: await ticketFor("turn_on"), outcome: "success", deploymentKey });
      if (!started.ok) return { cookies: cookies(), setupId: "0".repeat(32), code: "000000", deploymentKey };
      const value = started.value as { setupId: string; secret: string };
      secret = base32Decode(value.secret);
      return { cookies: cookies(), setupId: value.setupId, code: await totpAt(secret!, stepAt(Date.now())), deploymentKey };
    },
    renewRecoveryCodes: async () => {
      const ticket = await ticketFor("fresh_codes");
      // A step later than the one the confirm accepted (D-6), still within the window.
      const code = secret ? await totpAt(secret, stepAt(Date.now()) + 1) : "000000";
      return { cookies: cookies(), ticket, outcome: "success", code, deploymentKey };
    },
    secondStep: async () => {
      // A code later than the last accepted step must be in the window, and renewRecoveryCodes has
      // just taken the next step's: turn two-step verification off and on again so the last
      // accepted step is the current one. Each reset operation must succeed, and the new secret is
      // used only once its confirm has, so a failed reset fails the sweep here instead of leaving
      // the old secret to make a measured second step pass.
      const required = async (operation: string, input: unknown) => {
        const result = await call(operation, input);
        if (!result.ok) throw new Error(`secondStep fixture: ${operation} refused ${result.body.error.code}`);
        return result.value;
      };
      const state = (await required("twoStepState", { cookies: cookies(), deploymentKey })) as { email: string };
      await required("turnOffTwoStep", { cookies: cookies(), ticket: await ticketFor("turn_off"), outcome: "success" });
      const started = (await required("startTwoStep", { cookies: cookies(), ticket: await ticketFor("turn_on"), outcome: "success", deploymentKey })) as {
        setupId: string;
        secret: string;
      };
      const fresh = base32Decode(started.secret)!;
      await required("confirmTwoStep", { cookies: cookies(), setupId: started.setupId, code: await totpAt(fresh, stepAt(Date.now())), deploymentKey });
      secret = fresh;
      // The password step with no session cookie, so the sweep's own session is not ended by the second step.
      const email = state.email;
      const attempt = await call("signInAttempt", { email, address: "unknown", cookies: {} });
      const completed = attempt.ok ? await call("completeSignIn", { ticket: (attempt.value as { ticket: string }).ticket, outcome: "success" }) : null;
      const pending = completed?.ok ? (completed.value as { kind?: string; identifier: string; pendingToken?: string }) : null;
      const pendingCookies = pending?.kind === "pending" ? { [pendingCookieName(pending.identifier)]: pending.pendingToken! } : {};
      const code = secret ? await totpAt(secret, stepAt(Date.now()) + 1) : "000000";
      return { cookies: pendingCookies, address: "unknown", method: "code", code, deploymentKey };
    },
    turnOffTwoStep: async () => ({ cookies: cookies(), ticket: await ticketFor("turn_off"), outcome: "success" }),
  };
}
