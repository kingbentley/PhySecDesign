import type { z } from "zod";
import { RELEASE } from "../../shared/release";
import { refusalBody, type RefusalBody, type RefusalCode, REFUSALS } from "../../shared/refusal";
import { ROUTES } from "../../shared/routes";
import { normaliseSetupCode, type SetupState } from "../../shared/setup";
import { hashPassword } from "../auth/password";
import { setupCodeFingerprint, setupCodesMatch } from "../auth/setupCode";
import { INSTALLATION_NAME, type Env } from "../env";
import type { InstallationStatus } from "../installation/Installation";
import type { FirstAdministratorCreated, SetupAttemptCounted } from "../installation/setupStore";
import { callObject } from "../objects/call";
import { clientAddressKey } from "./clientAddress";

// One handler per declared route. The mapped type makes a declared route without a handler, or a
// handler without a declaration, a type error.

export type HandlerResult<T> = { ok: true; value: T } | { ok: false; status: number; body: RefusalBody };

/** What a handler knows about the request beyond its checked input. */
export interface RequestContext {
  request: Request;
  url: URL;
}

type Routes = typeof ROUTES;
export type RouteHandlers = {
  [K in keyof Routes]: (
    input: z.infer<Routes[K]["input"]>,
    env: Env,
    context: RequestContext,
  ) => Promise<HandlerResult<z.infer<Routes[K]["reply"]>>>;
};

function refused(code: RefusalCode): { ok: false; status: number; body: RefusalBody } {
  return { ok: false, status: REFUSALS[code].status, body: refusalBody(code) };
}

function installation(env: Env) {
  return { namespace: env.INSTALLATION, id: env.INSTALLATION.idFromName(INSTALLATION_NAME) };
}

export const HANDLERS: RouteHandlers = {
  async status(_input, env) {
    const { namespace, id } = installation(env);
    const result = await callObject<InstallationStatus>(namespace, id, "status", null, { idempotent: true });
    if (!result.ok) return result;
    return { ok: true, value: { release: RELEASE, installation: result.value } };
  },

  async setupState(_input, env) {
    const { namespace, id } = installation(env);
    const result = await callObject<{ state: SetupState }>(namespace, id, "setupState", null, { idempotent: true });
    if (!result.ok) return result;
    return { ok: true, value: { state: result.value.state } };
  },

  // The set-up request (story 1.2). The router has already checked the origin and the app's header
  // (standing rule 13) and the input. Order: the configured code must exist; the installation
  // object raises the wrong-code counts (or refuses: closed, or a wait); the entered code is
  // compared with the configured one here, in constant time; only an accepted code costs a
  // password hash; then the object creates the administrator in one synchronous step.
  async setup(input, env, context) {
    const { namespace, id } = installation(env);
    const configured = env.SETUP_CODE ?? "";
    if (normaliseSetupCode(configured).length === 0) {
      // Without a code nobody can complete set-up; say "closed" rather than "not issued" once a user exists.
      const state = await callObject<{ state: SetupState }>(namespace, id, "setupState", null, { idempotent: true });
      if (!state.ok) return state;
      return refused(state.value.state === "closed" ? "setup_closed" : "setup_code_not_configured");
    }

    // The fingerprint of the CONFIGURED code, never of the entered one (server/auth/setupCode.ts).
    const fingerprint = await setupCodeFingerprint(configured);
    const attempt = await callObject<SetupAttemptCounted>(namespace, id, "setupAttempt", {
      address: clientAddressKey(context.request),
      fingerprint,
    });
    if (!attempt.ok) return attempt;

    // Both codes are normalised first: spaces and dashes removed, upper case (setupCodesMatch).
    if (!(await setupCodesMatch(input.code, configured))) return refused("setup_code_wrong");

    // The schema has already normalised the password to NFKC (D-9, shared/setup.ts).
    const passwordHash = await hashPassword(input.password);
    const created = await callObject<FirstAdministratorCreated>(namespace, id, "createFirstAdministrator", {
      fingerprint,
      ticket: attempt.value.ticket,
      installationName: input.installationName,
      // The address the set-up page was opened on (CA-57): the router accepted this request only
      // because its Origin equals this origin.
      publicAddress: context.url.origin,
      name: input.name,
      email: input.email,
      passwordHash,
    });
    if (!created.ok) return created;
    return { ok: true, value: { installationName: created.value.installationName, email: created.value.email } };
  },
};
