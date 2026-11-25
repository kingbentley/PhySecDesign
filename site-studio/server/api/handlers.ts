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
import {
  clearPendingCookieLine,
  clearSessionCookieLine,
  COOKIE_PREFIX,
  pendingCookieLine,
  pendingCookieName,
  sessionCookieLine,
} from "../auth/session";
import { setupCodeFingerprint, setupCodesMatch } from "../auth/setupCode";
import { INSTALLATION_NAME, type Env } from "../env";
import type { InstallationStatus } from "../installation/Installation";
import type { DeploymentKeyState } from "../installation/keyGuard";
import type {
  AccountCheckCounted,
  AccountCheckPurpose,
  RecoveryCodesMade,
  TwoStepStarted,
  TwoStepState,
  TwoStepTurnedOff,
} from "../installation/twoStepStore";
import {
  invitationSecretHash,
  type InvitationAccepted,
  type InvitationCreated,
  type InvitationInfo,
} from "../installation/invitationStore";
import type { FirstAdministratorCreated, SetupAttemptCounted } from "../installation/setupStore";
import type { SessionEnded, SessionInfo, SignInAttemptCounted, SignInCompleted, SignInCompletion } from "../installation/signInStore";
import { callObject, type ObjectCallResult } from "../objects/call";
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

type Refusal = { ok: false; status: number; body: RefusalBody };

/**
 * The Worker's deployment key for an operation's input (story 1.5, D-22): `{ deploymentKey }` only
 * when `DEPLOYMENT_KEY` is a non-empty string, otherwise nothing, so an unset or `null` key is never
 * passed on. The key is never logged.
 */
export function deploymentKeyInput(env: Env): { deploymentKey?: string } {
  const key = env.DEPLOYMENT_KEY;
  return typeof key === "string" && key.length > 0 ? { deploymentKey: key } : {};
}

/** The prefix of every pending sign-in cookie's name, whatever the installation (D-2). */
const PENDING_COOKIE_PREFIX = `${COOKIE_PREFIX}p-`;

/**
 * The line clearing this installation's pending sign-in cookie, when the request presented it
 * (story 1.5, D-3, finding 23). A cookie named with another installation's identifier is never
 * cleared (story 1.3, criterion 17). `identifier` is the one a call already answered; without it,
 * and only when the request presented some pending cookie, the identifier is read with the
 * read-only session read (retried once). If that read is refused, no line is added.
 */
async function pendingClearLines(env: Env, context: RequestContext, identifier?: string): Promise<string[]> {
  if (!Object.keys(context.cookies).some((name) => name.startsWith(PENDING_COOKIE_PREFIX))) return [];
  let own = identifier;
  if (own === undefined) {
    const { namespace, id } = installation(env);
    const info = await callObject<SessionInfo>(namespace, id, "sessionInfo", { cookies: {} }, { idempotent: true });
    if (!info.ok) return [];
    own = info.value.identifier;
  }
  return context.cookies[pendingCookieName(own)] !== undefined ? [clearPendingCookieLine(own)] : [];
}

/**
 * For a sign-in refused as busy before it is counted: discards the pending sign-in the request
 * presents, as every new sign-in attempt does (D-3; CodeRabbit review of pull request 13), and
 * answers the line clearing this installation's pending cookie. Only when the request presented some
 * pending cookie; the discard's answer gives the identifier, so no session read is needed. A write,
 * never retried after a bare reset. If it is refused or its call fails (a bare reset reaches the
 * caller of a write), the busy reply stands and the cookie is still cleared through the read-only
 * session read, as every sign-in refusal clears it (spec 4, finding 23); the row then expires.
 */
async function discardPendingLines(env: Env, context: RequestContext): Promise<string[]> {
  if (!Object.keys(context.cookies).some((name) => name.startsWith(PENDING_COOKIE_PREFIX))) return [];
  const { namespace, id } = installation(env);
  let discarded: ObjectCallResult<{ identifier: string }>;
  try {
    discarded = await callObject<{ identifier: string }>(namespace, id, "discardPending", { cookies: context.cookies });
  } catch (error) {
    // Only the error's own text, which names the operation and never a cookie value.
    console.error(`discardPending failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return pendingClearLines(env, context);
  }
  if (!discarded.ok) return pendingClearLines(env, context);
  return pendingClearLines(env, context, discarded.value.identifier);
}

/**
 * The counted password check of a two-step account action (story 1.5, D-5): a full hash queue is
 * refused as busy before anything is counted; the installation object refuses before counting when
 * the action cannot apply, or counts it and answers the stored hash and a ticket; the password is
 * checked here through the queue. The key is passed only for turning on and fresh codes (finding
 * 14). Never retried after a bare reset.
 */
async function checkAccountPassword(
  env: Env,
  context: RequestContext,
  password: string,
  purpose: AccountCheckPurpose,
): Promise<{ ok: true; ticket: string; outcome: "success" | "failure" } | Refusal> {
  if (!hashQueue.hasRoom()) return refused("signin_busy");
  const { namespace, id } = installation(env);
  const check = await callObject<AccountCheckCounted>(namespace, id, "accountCheck", {
    cookies: context.cookies,
    address: clientAddressKey(context.request),
    purpose,
    ...(purpose === "turn_off" ? {} : deploymentKeyInput(env)),
  });
  if (!check.ok) return check;
  let correct: boolean;
  try {
    // The schema has already normalised the password to NFKC (story 1.2's D-9).
    correct = await verifyPassword(password, check.value.passwordHash, context.request.signal);
  } catch (error) {
    // The count stays raised and the ticket expires unused, as at sign-in (E-17).
    if (error instanceof HashQueueBusy || context.request.signal.aborted) return busyOrGone();
    throw error;
  }
  return { ok: true, ticket: check.value.ticket, outcome: correct ? "success" : "failure" };
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
  //
  // Story 1.5 (D-3, D-12, finding 23): for an account with two-step verification on, a correct
  // password answers `{ secondStep: true }` and sets only the pending sign-in cookie. Every other
  // reply, refusals included, clears this installation's pending cookie when the request presented it;
  // a busy refusal before counting also discards that pending sign-in, as the attempt would (D-3).
  async signIn(input, env, context) {
    if (!hashQueue.hasRoom()) return { ...refused("signin_busy"), cookies: await discardPendingLines(env, context) };
    const { namespace, id } = installation(env);
    const attempt = await callObject<SignInAttemptCounted>(namespace, id, "signInAttempt", {
      email: input.email,
      address: clientAddressKey(context.request),
      cookies: context.cookies,
    });
    if (!attempt.ok) return { ...attempt, cookies: await pendingClearLines(env, context) };
    const identifier = attempt.value.identifier;

    const stored = attempt.value.standIn || attempt.value.passwordHash === null ? standInPasswordHash() : attempt.value.passwordHash;
    let correct: boolean;
    try {
      // The schema has already normalised the password to NFKC (story 1.2's D-9).
      correct = await verifyPassword(input.password, stored, context.request.signal);
    } catch (error) {
      // A race filled the queue after counting, or the client went away while waiting: the count
      // stays raised and the ticket expires unused (D-5 amended, E-17).
      if (error instanceof HashQueueBusy || context.request.signal.aborted) {
        return { ...busyOrGone(), cookies: await pendingClearLines(env, context, identifier) };
      }
      throw error;
    }

    const completed = await callObject<SignInCompletion>(namespace, id, "completeSignIn", {
      ticket: attempt.value.ticket,
      outcome: correct ? "success" : "failure",
    });
    if (!completed.ok) return { ...completed, cookies: await pendingClearLines(env, context, identifier) };
    const done = completed.value;
    if (done.kind === "pending") {
      // Only the pending cookie: no session, no marker (criterion 3).
      return { ok: true, value: { secondStep: true }, cookies: [pendingCookieLine(done.identifier, done.pendingToken)] };
    }
    return {
      ok: true,
      value: { name: done.account.name },
      cookies: [
        sessionCookieLine(done.identifier, done.sessionToken),
        markerCookieLine(done.identifier, done.marker),
        ...(await pendingClearLines(env, context, done.identifier)),
      ],
    };
  },

  // The second sign-in step (story 1.5, CAP-3, CAP-4, CAP-6). The router has already checked the
  // origin and the app's header, then the input: a code that does not normalise for its method is
  // `invalid_input` and nothing is counted. The installation object checks the code for the pending
  // sign-in of the presented pending cookie, counted at the request's address (finding 4). A write:
  // never retried after a bare reset. Success sets a new session and the marker and clears the
  // pending cookie; `second_step_expired` and `signin_wait` clear it too; a wrong code, a wrong
  // recovery code and a key mismatch keep it, so the person can try again.
  async secondStep(input, env, context) {
    const { namespace, id } = installation(env);
    const result = await callObject<SignInCompleted>(namespace, id, "secondStep", {
      cookies: context.cookies,
      address: clientAddressKey(context.request),
      method: input.method,
      code: input.code,
      ...deploymentKeyInput(env),
    });
    if (!result.ok) {
      const code = result.body.error.code;
      if (code === "second_step_expired" || code === "signin_wait") return { ...result, cookies: await pendingClearLines(env, context) };
      return result;
    }
    const done = result.value;
    return {
      ok: true,
      value: { name: done.account.name },
      cookies: [
        sessionCookieLine(done.identifier, done.sessionToken),
        markerCookieLine(done.identifier, done.marker),
        clearPendingCookieLine(done.identifier),
      ],
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

  // Two-step verification for the signed-in account (story 1.5, CAP-1, CAP-2, CAP-7, D-12). The
  // installation object identifies the account from this installation's session cookie; with no
  // live session every one is `not_signed_in`. The Worker's key goes only in the input (D-22).

  // The state read: writes nothing, so retried once after a bare reset.
  async twoStepState(_input, env, context) {
    const { namespace, id } = installation(env);
    const result = await callObject<TwoStepState>(
      namespace,
      id,
      "twoStepState",
      { cookies: context.cookies, ...deploymentKeyInput(env) },
      { idempotent: true },
    );
    if (!result.ok) return result;
    const { enabled, recoveryCodesRemaining, availability, email } = result.value;
    return { ok: true, value: { enabled, recoveryCodesRemaining, availability, email } };
  },

  // Turning on, first part: the password (D-5, D-10), then a new set-up. The only reply holding the
  // authenticator secret (CAP-9). Never retried.
  async twoStepStart(input, env, context) {
    const checked = await checkAccountPassword(env, context, input.password, "turn_on");
    if (!checked.ok) return checked;
    const { namespace, id } = installation(env);
    const started = await callObject<TwoStepStarted>(namespace, id, "startTwoStep", {
      cookies: context.cookies,
      ticket: checked.ticket,
      outcome: checked.outcome,
      ...deploymentKeyInput(env),
    });
    if (!started.ok) return started;
    const { setupId, secret, otpauthUri, installationName, email } = started.value;
    return { ok: true, value: { setupId, secret, otpauthUri, installationName, email } };
  },

  // Turning on, second part: the set-up's identifier and a current code (not counted, D-5). Answers
  // the recovery codes once. Never retried.
  async twoStepConfirm(input, env, context) {
    const { namespace, id } = installation(env);
    const made = await callObject<RecoveryCodesMade>(namespace, id, "confirmTwoStep", {
      cookies: context.cookies,
      setupId: input.setupId,
      code: input.code,
      ...deploymentKeyInput(env),
    });
    if (!made.ok) return made;
    return { ok: true, value: { recoveryCodes: made.value.recoveryCodes } };
  },

  // Turning off: the password, then the secret and every recovery code deleted. Needs no key, so
  // none is passed (D-15). Never retried.
  async twoStepTurnOff(input, env, context) {
    const checked = await checkAccountPassword(env, context, input.password, "turn_off");
    if (!checked.ok) return checked;
    const { namespace, id } = installation(env);
    const done = await callObject<TwoStepTurnedOff>(namespace, id, "turnOffTwoStep", {
      cookies: context.cookies,
      ticket: checked.ticket,
      outcome: checked.outcome,
    });
    if (!done.ok) return done;
    return { ok: true, value: { enabled: false } };
  },

  // Fresh recovery codes: the password and a current code (CA-13). Answers the new codes once.
  // Never retried.
  async twoStepRecoveryCodes(input, env, context) {
    const checked = await checkAccountPassword(env, context, input.password, "fresh_codes");
    if (!checked.ok) return checked;
    const { namespace, id } = installation(env);
    const made = await callObject<RecoveryCodesMade>(namespace, id, "renewRecoveryCodes", {
      cookies: context.cookies,
      ticket: checked.ticket,
      outcome: checked.outcome,
      code: input.code,
      ...deploymentKeyInput(env),
    });
    if (!made.ok) return made;
    return { ok: true, value: { recoveryCodes: made.value.recoveryCodes } };
  },

  // The public key-state read (D-18 as ruled): read-only, so retried once after a bare reset.
  async deploymentKeyState(_input, env) {
    const { namespace, id } = installation(env);
    const result = await callObject<DeploymentKeyState>(namespace, id, "deploymentKeyState", deploymentKeyInput(env), { idempotent: true });
    if (!result.ok) return result;
    return { ok: true, value: { fingerprint: result.value.fingerprint, key: result.value.key } };
  },
};
