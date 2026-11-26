import { z } from "zod";
import { acceptInput, INVITATION_ROLES, invitationSecretField, inviteInput } from "./invitation";
import { SETUP_STATES, setupInput } from "./setup";
import { signInInput } from "./signin";
import { RECOVERY_CODE_COUNT, secondStepInput, twoStepConfirmInput, twoStepPasswordInput, twoStepRecoveryCodesInput } from "./twoStep";

// Route declarations (AD-22). Every server address other than the app's own pages and files is
// declared here with its method, path, input schema and reply schema. Only three address spaces
// are allowed: /api/v1/, the MCP endpoint at /mcp and discovery addresses under /.well-known/.
// Route classes (public, read, draft change, ...) are added by story 1.8.

export const API_PREFIX = "/api/v1/";
export const MCP_PATH = "/mcp";
export const WELL_KNOWN_PREFIX = "/.well-known/";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RouteDeclaration<Input extends z.ZodType = z.ZodType, Reply extends z.ZodType = z.ZodType> {
  /** Stable identifier, also the name a later MCP tool takes. */
  id: string;
  method: HttpMethod;
  /** Exact path; no path parameters yet. */
  path: string;
  /** Schema for the input: the query string for GET and DELETE, the JSON body otherwise. */
  input: Input;
  reply: Reply;
  summary: string;
  /**
   * Refuses the request unless it comes from the app's own origin and carries the app's header
   * (standing rule 13): requests made before a session exists that create one or an account.
   */
  appOriginOnly?: boolean;
  /**
   * The route reads the session cookie (story 1.3, V-12): the router passes it the request's session
   * and marker cookies, and no other route gets them. A route so flagged that is not a GET must also
   * be `appOriginOnly` (standing rule 13); `server-tests/signin-declarations.test.ts` sweeps for it.
   */
  readsSessionCookie?: boolean;
}

/** The header the app's own page adds to requests that must come from it (standing rule 13). */
export const APP_HEADER = "x-site-survey-design";
export const APP_HEADER_VALUE = "1";

/** True when a path lies in one of the address spaces the server answers itself. */
export function isServerPath(path: string): boolean {
  return path.startsWith(API_PREFIX) || path === MCP_PATH || path.startsWith(WELL_KNOWN_PREFIX);
}

function declareRoute<Input extends z.ZodType, Reply extends z.ZodType>(
  route: RouteDeclaration<Input, Reply>,
): RouteDeclaration<Input, Reply> {
  if (!isServerPath(route.path)) throw new Error(`Route ${route.id} is outside the allowed address spaces.`);
  return route;
}

export const statusReply = z
  .object({
    release: z.string(),
    installation: z
      .object({
        dataFormat: z.number().int().positive(),
        /** UTC time, ISO 8601, recorded when the installation object was first created. */
        createdAt: z.iso.datetime(),
      })
      .strict(),
  })
  .strict();

export type StatusReply = z.infer<typeof statusReply>;

/** Whether set-up is open, and nothing else (CA-52). */
export const setupStateReply = z.object({ state: z.enum(SETUP_STATES) }).strict();

/** What a completed set-up confirms: the installation's name and the administrator's email. */
export const setupReply = z.object({ installationName: z.string(), email: z.string() }).strict();

/**
 * The public session read (story 1.3, CAP-1, E-11): whether the caller is signed in, the account's
 * name, random identifier and installation role if so (story 1.4, D-5), and the installation's
 * name, `null` while set-up is open. Never the token.
 */
export const sessionReply = z.discriminatedUnion("signedIn", [
  z.object({ signedIn: z.literal(false), installationName: z.string().nullable() }).strict(),
  z
    .object({
      signedIn: z.literal(true),
      name: z.string(),
      accountId: z.string(),
      role: z.enum(INVITATION_ROLES),
      installationName: z.string().nullable(),
    })
    .strict(),
]);

export type SessionReply = z.infer<typeof sessionReply>;

/**
 * What a sign-in confirms (story 1.5, D-12): the account's name, or, for an account with two-step
 * verification on, that a second step is needed. The token, the marker and the pending token
 * travel only as cookies.
 */
export const signInReply = z.union([z.object({ name: z.string() }).strict(), z.object({ secondStep: z.literal(true) }).strict()]);

/** What a completed second step confirms: the account's name. The token and marker travel only as cookies. */
export const secondStepReply = z.object({ name: z.string() }).strict();

/** The signed-in account's two-step state (story 1.5, D-12). Never the secret or a code. */
export const twoStepStateReply = z
  .object({
    enabled: z.boolean(),
    recoveryCodesRemaining: z.number().int().min(0).max(RECOVERY_CODE_COUNT),
    availability: z.enum(["available", "no_key", "key_mismatch"]),
    email: z.string(),
  })
  .strict();

/** A started set-up (D-10, D-12): the only reply that holds the authenticator secret (CAP-9). */
export const twoStepStartReply = z
  .object({
    setupId: z.string(),
    secret: z.string(),
    otpauthUri: z.string(),
    installationName: z.string(),
    email: z.string(),
  })
  .strict();

/** A new set of recovery codes, answered once: confirm and fresh codes only (CAP-9). */
export const recoveryCodesReply = z.object({ recoveryCodes: z.array(z.string()).length(RECOVERY_CODE_COUNT) }).strict();

/** What turning off confirms. */
export const twoStepTurnOffReply = z.object({ enabled: z.literal(false) }).strict();

/**
 * The public key-state read (story 1.5, D-18 as ruled): whether a fingerprint is stored and whether
 * the Worker's key is absent, present or matches it. Never the fingerprint or anything derived from the key.
 */
export const deploymentKeyStateReply = z
  .object({
    fingerprint: z.enum(["none", "stored"]),
    key: z.enum(["none", "present", "matches", "mismatch"]),
  })
  .strict();

/** What a sign-out confirms: the caller is no longer signed in (D-13). */
export const signOutReply = z.object({ signedIn: z.literal(false) }).strict();

/**
 * What an invitation answers the administrator, once (story 1.4, D-1, D-9): the link, built on the
 * installation's recorded public address as `<address>/invite#<secret>`, and its expiry, UTC,
 * ISO 8601. The only reply that holds the secret.
 */
export const inviteReply = z.object({ link: z.string(), expiresAt: z.iso.datetime() }).strict();

/** The invitation read's input: the secret, only ever in a JSON body (D-1). */
export const invitationReadInput = z.object({ secret: invitationSecretField }).strict();

/** What the invitation page shows (D-10): who invited, to which installation, the email, name and role. */
export const invitationReadReply = z
  .object({
    inviterName: z.string(),
    installationName: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.enum(INVITATION_ROLES),
  })
  .strict();

/** What an accepted invitation confirms: the new account's name. The token and marker travel only as cookies. */
export const acceptInviteReply = z.object({ name: z.string() }).strict();

export const ROUTES = {
  status: declareRoute({
    id: "status",
    method: "GET",
    path: "/api/v1/status",
    input: z.object({}).strict(),
    reply: statusReply,
    summary: "The running release and the installation's data format and creation time.",
  }),
  setupState: declareRoute({
    id: "setupState",
    method: "GET",
    path: "/api/v1/setup/state",
    input: z.object({}).strict(),
    reply: setupStateReply,
    summary: "Whether set-up is open (no user exists yet) or closed. Public and read-only.",
  }),
  setup: declareRoute({
    id: "setup",
    method: "POST",
    path: "/api/v1/setup",
    input: setupInput,
    reply: setupReply,
    summary: "Creates the first administrator and names the installation, given the set-up code.",
    appOriginOnly: true,
  }),
  // Sign-in and sign-out (story 1.3).
  session: declareRoute({
    id: "session",
    method: "GET",
    path: "/api/v1/session",
    input: z.object({}).strict(),
    reply: sessionReply,
    summary:
      "Whether the caller is signed in, the account's name if so, and the installation's name. Public and read-only; " +
      "clears this installation's session cookie when it names no live session.",
    readsSessionCookie: true,
  }),
  signIn: declareRoute({
    id: "signIn",
    method: "POST",
    path: "/api/v1/session/sign-in",
    input: signInInput,
    reply: signInReply,
    summary:
      "Signs in with an email and password, setting the session cookie and the browser marker; for an account with " +
      "two-step verification on, answers that a second step is needed and sets only the pending sign-in cookie.",
    appOriginOnly: true,
    readsSessionCookie: true,
  }),
  // The second sign-in step (story 1.5). Route class (story 1.8): person only.
  secondStep: declareRoute({
    id: "secondStep",
    method: "POST",
    path: "/api/v1/session/second-step",
    input: secondStepInput,
    reply: secondStepReply,
    summary:
      "Completes a pending sign-in with a code from the authenticator app or a recovery code, setting a new session cookie " +
      "and the browser marker and clearing the pending sign-in cookie.",
    appOriginOnly: true,
    readsSessionCookie: true,
  }),
  signOut: declareRoute({
    id: "signOut",
    method: "POST",
    path: "/api/v1/session/sign-out",
    input: z.object({}).strict(),
    reply: signOutReply,
    summary: "Ends the presented session, if any, and clears the session cookie. Always succeeds; keeps the marker.",
    appOriginOnly: true,
    readsSessionCookie: true,
  }),
  // Invitations (story 1.4). The secret travels only in a JSON body, never a path or query (D-1).
  invite: declareRoute({
    id: "invite",
    method: "POST",
    path: "/api/v1/invitations",
    input: inviteInput,
    reply: inviteReply,
    summary:
      "Invites a person by email, name and role, for a signed-in administrator; answers the link once, with its expiry. " +
      "Replaces any earlier invitation for the email.",
    appOriginOnly: true,
    readsSessionCookie: true,
  }),
  invitationRead: declareRoute({
    id: "invitationRead",
    method: "POST",
    path: "/api/v1/invitations/read",
    input: invitationReadInput,
    reply: invitationReadReply,
    summary: "Reads a live invitation by its secret: the inviter's name, the installation's name, the email, name and role.",
    appOriginOnly: true,
  }),
  acceptInvite: declareRoute({
    id: "acceptInvite",
    method: "POST",
    path: "/api/v1/invitations/accept",
    input: acceptInput,
    reply: acceptInviteReply,
    summary:
      "Accepts an invitation with a name and password: creates the account, ends any presented session and signs the person in, " +
      "setting the session cookie and the browser marker.",
    appOriginOnly: true,
    readsSessionCookie: true,
  }),
  // Two-step verification for the signed-in account (story 1.5).
  // Route class (story 1.8): person only.
  twoStepState: declareRoute({
    id: "twoStepState",
    method: "GET",
    path: "/api/v1/account/two-step",
    input: z.object({}).strict(),
    reply: twoStepStateReply,
    summary:
      "The signed-in account's two-step verification: whether it is on, the recovery codes left, whether it is available " +
      "on this installation, and the account's email.",
    readsSessionCookie: true,
  }),
  // Route class (story 1.8): person only.
  twoStepStart: declareRoute({
    id: "twoStepStart",
    method: "POST",
    path: "/api/v1/account/two-step/start",
    input: twoStepPasswordInput,
    reply: twoStepStartReply,
    summary:
      "Starts turning on two-step verification after the password: answers a new authenticator secret once, with its " +
      "set-up identifier and authenticator address. Replaces any earlier set-up.",
    appOriginOnly: true,
    readsSessionCookie: true,
  }),
  // Route class (story 1.8): person only.
  twoStepConfirm: declareRoute({
    id: "twoStepConfirm",
    method: "POST",
    path: "/api/v1/account/two-step/confirm",
    input: twoStepConfirmInput,
    reply: recoveryCodesReply,
    summary: "Turns two-step verification on with the set-up's identifier and a current code; answers 10 recovery codes once.",
    appOriginOnly: true,
    readsSessionCookie: true,
  }),
  // Route class (story 1.8): person only.
  twoStepTurnOff: declareRoute({
    id: "twoStepTurnOff",
    method: "POST",
    path: "/api/v1/account/two-step/turn-off",
    input: twoStepPasswordInput,
    reply: twoStepTurnOffReply,
    summary: "Turns two-step verification off after the password, deleting the secret and every recovery code.",
    appOriginOnly: true,
    readsSessionCookie: true,
  }),
  // Route class (story 1.8): person only.
  twoStepRecoveryCodes: declareRoute({
    id: "twoStepRecoveryCodes",
    method: "POST",
    path: "/api/v1/account/two-step/recovery-codes",
    input: twoStepRecoveryCodesInput,
    reply: recoveryCodesReply,
    summary: "Replaces the recovery codes after the password and a current code; answers the 10 new codes once.",
    appOriginOnly: true,
    readsSessionCookie: true,
  }),
  // The deployment key's state (story 1.5, D-18 as ruled). Route class (story 1.8): public.
  deploymentKeyState: declareRoute({
    id: "deploymentKeyState",
    method: "GET",
    path: "/api/v1/deployment-key/state",
    input: z.object({}).strict(),
    reply: deploymentKeyStateReply,
    summary:
      "Whether this installation stores a deployment-key fingerprint and whether the Worker's key is absent, present or " +
      "matches it. Public and read-only; never the fingerprint or anything derived from the key.",
  }),
} as const;

export const ROUTE_LIST: readonly RouteDeclaration[] = Object.values(ROUTES);

/** Finds the declarations for a path, whatever their method. */
export function routesForPath(path: string): RouteDeclaration[] {
  return ROUTE_LIST.filter((route) => route.path === path);
}

export type InputCheck<T> = { ok: true; value: T } | { ok: false; field?: string };

/**
 * Checks input against a route's schema. A failure names the first declared field at fault and
 * never carries the value that was sent. An unknown key is itself entered text, so it is never
 * named: the reply names its parent field, or no field at the top level.
 */
export function checkInput<T>(schema: z.ZodType<T>, raw: unknown): InputCheck<T> {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, value: result.data };
  const issue = result.error.issues[0];
  if (!issue) return { ok: false };
  const path = issue.path.map(String);
  return path.length > 0 ? { ok: false, field: path.join(".") } : { ok: false };
}
