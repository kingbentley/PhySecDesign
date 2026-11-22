import { stepAt, totpAt } from "../server/auth/totp";
import type { ObjectCallResult } from "../server/objects/call";
import { base32Decode } from "../shared/twoStep";

// Fixture inputs for the two-step operations (story 1.5, spec 2), shared by the three sweeps that
// run every registered operation of the installation object (setup, sign-in and invitation stores'
// pinned lists, and the two-step tables' own sweep). Each fixture prepares what its operation needs
// through the object's own operations on the live clock. The order is required: a sweep must run
// them in TWO_STEP_OPERATIONS order (twoStepState, accountCheck, startTwoStep, confirmTwoStep,
// renewRecoveryCodes, turnOffTwoStep), after the operations that make the session and before
// endSession, because each fixture builds on the state the earlier ones left. A fixture whose
// preparation is refused still answers a well-formed input, which its operation then refuses, so
// a sweep must check each operation's result, or a refused operation passes unseen. Codes are
// computed at run time from the secret the start answered; nothing is written to a file.

export const TWO_STEP_OPERATIONS = [
  "twoStepState",
  "accountCheck",
  "startTwoStep",
  "confirmTwoStep",
  "renewRecoveryCodes",
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
    turnOffTwoStep: async () => ({ cookies: cookies(), ticket: await ticketFor("turn_off"), outcome: "success" }),
  };
}
