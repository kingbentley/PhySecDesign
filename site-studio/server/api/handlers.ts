import type { z } from "zod";
import { RELEASE } from "../../shared/release";
import { refusalBody, type RefusalBody, type RefusalCode, REFUSALS } from "../../shared/refusal";
import { ROUTES } from "../../shared/routes";
import { isWellFormedInvitationSecret } from "../../shared/invitation";
import { normaliseSetupCode, passwordEqualsEmail, type SetupState } from "../../shared/setup";
import { markerCookieLine } from "../auth/marker";
import {
  hashPassword,
  HashQueueBusy,
  hashQueue,
  standInPasswordHash,
  verifyPassword,
  type CurrentPasswordHash,
} from "../auth/password";
import { clearSessionCookieLine, sessionCookieLine } from "../auth/session";
import { setupCodeFingerprint, setupCodesMatch } from "../auth/setupCode";
import { INSTALLATION_NAME, type Env } from "../env";
import type { InstallationStatus } from "../installation/Installation";
import {
  invitationSecretHash,
  type InvitationAccepted,
  type InvitationCreated,
  type InvitationInfo,
} from "../installation/invitationStore";
import type { FirstAdministratorCreated, SetupAttemptCounted } from "../installation/setupStore";
import type { SessionEnded, SessionInfo, SignInAttemptCounted, SignInCompletion } from "../installation/signInStore";
import { callObject } from "../objects/call";
import { clientAddressKey } from "./clientAddress";

// One handler per declared route. The mapped type makes a declared route without a handler, or a
// handler without a declaration, a type error.

/**
 * A handler's answer: a value or a refusal, with any cookies it sets or clears as whole
 * `Set-Cookie` lines, which the router appends one by one (story 1.3, A-9).
 */
export type HandlerResult<T> = ({ ok: true; value: T } | { ok: false; status: number; body: RefusalBody }) & {
  cookies?: readonly string[];
};

/** What a handler knows about the request beyond its checked input. */
export interface RequestContext {
  request: Request;
  url: URL;
  /**
   * The request's cookies whose names have the session prefix, by name; empty unless the route is
   * declared `readsSessionCookie`. The installation object uses the ones named with its identifier.
   */
  cookies: Record<string, string>;
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

/**
 * A hash that did not run: the queue was full (`HashQueueBusy`), or the client went away while it
 * waited and its request signal aborted (`enable_request_signal`). Both answer the busy refusal,
 * the same for every email; after a disconnect nobody reads it, but no internal error is raised
 * or logged for it.
 */
function busyOrGone(): { ok: false; status: number; body: RefusalBody } {
  return refused("signin_busy");
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

    // A full hash queue is refused as busy before the attempt is counted, as at sign-in (D-5 amended).
    if (!hashQueue.hasRoom()) return refused("signin_busy");

    // The fingerprint of the CONFIGURED code, never of the entered one (server/auth/setupCode.ts).
    const fingerprint = await setupCodeFingerprint(configured);
    const attempt = await callObject<SetupAttemptCounted>(namespace, id, "setupAttempt", {
      address: clientAddressKey(context.request),
      fingerprint,
    });
    if (!attempt.ok) return attempt;

    // Both codes are normalised first: spaces and dashes removed, upper case (setupCodesMatch).
    if (!(await setupCodesMatch(input.code, configured))) return refused("setup_code_wrong");

    // The schema has already normalised the password to NFKC (D-9, shared/setup.ts). The hash goes
    // through the isolate's hash queue; a full queue is the busy refusal, as at sign-in (D-5
    // amended). The counted attempt stays counted, as for any failure after counting (E-17).
    let passwordHash: CurrentPasswordHash;
    try {
      passwordHash = await hashPassword(input.password, context.request.signal);
    } catch (error) {
      if (error instanceof HashQueueBusy || context.request.signal.aborted) return busyOrGone();
      throw error;
    }
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

  // The public session read (story 1.3, CAP-1, CAP-3). Read-only (D-4 amended), so the object call
  // is retried once after a bare reset (E-6). A dead cookie under this installation's own name is
  // "not signed in" and cleared (D-7 amended); a cookie named with another installation's
  // identifier is ignored and never cleared (criterion 17, CAP-10).
  async session(_input, env, context) {
    const { namespace, id } = installation(env);
    const result = await callObject<SessionInfo>(namespace, id, "sessionInfo", { cookies: context.cookies }, { idempotent: true });
    if (!result.ok) return result;
    const info = result.value;
    if (info.signedIn) {
      // The account's random identifier and its role (story 1.4, D-5), never the token.
      return {
        ok: true,
        value: {
          signedIn: true,
          name: info.account.name,
          accountId: info.account.id,
          role: info.role,
          installationName: info.installationName,
        },
      };
    }
    return {
      ok: true,
      value: { signedIn: false, installationName: info.installationName },
      cookies: info.clearSession ? [clearSessionCookieLine(info.identifier)] : [],
    };
  },

  // The sign-in request (story 1.3, CAP-2, CAP-6, CAP-7). The router has already checked the origin
  // and the app's header, then the input. Order: a full hash queue is refused as busy before
  // anything is counted (D-5 amended); the installation object counts the attempt, or refuses it
  // with a wait, and answers the stored hash or the stand-in signal with a ticket; the password is
  // checked here, through the queue, against the stored hash or the stand-in, so both take the same
  // steps (CAP-6); the object completes with the ticket and the outcome only, refusing a stand-in
  // ticket whatever the outcome. Neither call is retried after a bare reset (V-16).
  async signIn(input, env, context) {
    if (!hashQueue.hasRoom()) return refused("signin_busy");
    const { namespace, id } = installation(env);
    const attempt = await callObject<SignInAttemptCounted>(namespace, id, "signInAttempt", {
      email: input.email,
      address: clientAddressKey(context.request),
      cookies: context.cookies,
    });
    if (!attempt.ok) return attempt;

    const stored = attempt.value.standIn || attempt.value.passwordHash === null ? standInPasswordHash() : attempt.value.passwordHash;
    let correct: boolean;
    try {
      // The schema has already normalised the password to NFKC (story 1.2's D-9).
      correct = await verifyPassword(input.password, stored, context.request.signal);
    } catch (error) {
      // A race filled the queue after counting, or the client went away while waiting: the count
      // stays raised and the ticket expires unused (D-5 amended, E-17).
      if (error instanceof HashQueueBusy || context.request.signal.aborted) return busyOrGone();
      throw error;
    }

    const completed = await callObject<SignInCompletion>(namespace, id, "completeSignIn", {
      ticket: attempt.value.ticket,
      outcome: correct ? "success" : "failure",
    });
    if (!completed.ok) return completed;
    const done = completed.value;
    // Until the second-step route and its cookie arrive (story 1.5, spec 4), an account with
    // two-step verification on cannot sign in with the password alone.
    if (done.kind !== "signedIn") return refused("signin_failed");
    return {
      ok: true,
      value: { name: done.account.name },
      cookies: [sessionCookieLine(done.identifier, done.sessionToken), markerCookieLine(done.identifier, done.marker)],
    };
  },

  // The sign-out request (story 1.3, CAP-5, D-13). After the origin check it always succeeds and
  // clears this installation's session cookie, whether the session was live, already ended,
  // unknown or absent. Ending a session is safe to repeat, so the call is retried once after a bare
  // reset (E-6). The marker is kept: no marker cookie is sent (D-3).
  async signOut(_input, env, context) {
    const { namespace, id } = installation(env);
    const result = await callObject<SessionEnded>(namespace, id, "endSession", { cookies: context.cookies }, { idempotent: true });
    if (!result.ok) return result;
    return { ok: true, value: { signedIn: false }, cookies: [clearSessionCookieLine(result.value.identifier)] };
  },

  // The invite request (story 1.4, CAP-1, CAP-6, CAP-7). The router has already checked the origin
  // and the app's header, then the input. The installation object decides from the presented session
  // whether the caller may invite, in the same step as the write (D-6), and answers the secret once
  // with the recorded public address, on which the link is built, never on a request header (CA-57,
  // AD-12, D-1). A write: never retried after a bare reset.
  async invite(input, env, context) {
    const { namespace, id } = installation(env);
    const created = await callObject<InvitationCreated>(namespace, id, "createInvitation", {
      email: input.email,
      name: input.name,
      role: input.role,
      cookies: context.cookies,
    });
    if (!created.ok) return created;
    const address = created.value.publicAddress.replace(/\/+$/, "");
    return { ok: true, value: { link: `${address}/invite#${created.value.secret}`, expiresAt: created.value.expiresAt } };
  },

  // The invitation read (story 1.4, CAP-3, CAP-5). A secret not shaped as the server issues them is
  // unusable without asking the object (D-3); otherwise only its SHA-256 is passed on. Read-only, so
  // retried once after a bare reset.
  async invitationRead(input, env) {
    if (!isWellFormedInvitationSecret(input.secret)) return refused("invitation_unusable");
    const { namespace, id } = installation(env);
    const secretHash = await invitationSecretHash(input.secret);
    const info = await callObject<InvitationInfo>(namespace, id, "invitationInfo", { secretHash }, { idempotent: true });
    if (!info.ok) return info;
    const { inviterName, installationName, email, name, role } = info.value;
    return { ok: true, value: { inviterName, installationName, email, name, role } };
  },

  // Accepting an invitation (story 1.4, CAP-3, CAP-4, D-4). The router has already checked the
  // origin and the app's header, then the input (the password is NFKC-normalised by its schema).
  // Order: a full hash queue is refused as busy before anything else; the invitation is read
  // (retried once after a bare reset); the password must not equal its email; the password is hashed
  // through the one queue; the object creates the account, consumes the invitation and starts the
  // session in one step, never retried after a bare reset. The reply sets the session cookie and the
  // marker, as a sign-in does.
  async acceptInvite(input, env, context) {
    if (!hashQueue.hasRoom()) return refused("signin_busy");
    if (!isWellFormedInvitationSecret(input.secret)) return refused("invitation_unusable");
    const { namespace, id } = installation(env);
    const secretHash = await invitationSecretHash(input.secret);
    const info = await callObject<InvitationInfo>(namespace, id, "invitationInfo", { secretHash }, { idempotent: true });
    if (!info.ok) return info;
    if (passwordEqualsEmail(input.password, info.value.email)) {
      return { ok: false, status: REFUSALS.invalid_input.status, body: refusalBody("invalid_input", { field: "password" }) };
    }

    let passwordHash: CurrentPasswordHash;
    try {
      passwordHash = await hashPassword(input.password, context.request.signal);
    } catch (error) {
      if (error instanceof HashQueueBusy || context.request.signal.aborted) return busyOrGone();
      throw error;
    }

    const accepted = await callObject<InvitationAccepted>(namespace, id, "acceptInvitation", {
      secretHash,
      name: input.name,
      passwordHash,
      cookies: context.cookies,
    });
    if (!accepted.ok) return accepted;
    const done = accepted.value;
    return {
      ok: true,
      value: { name: done.account.name },
      cookies: [sessionCookieLine(done.identifier, done.sessionToken), markerCookieLine(done.identifier, done.marker)],
    };
  },
};
