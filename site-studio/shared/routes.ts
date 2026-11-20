import { z } from "zod";
import { SETUP_STATES, setupInput } from "./setup";
import { signInInput } from "./signin";

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
 * name if so, and the installation's name, `null` while set-up is open. Never the token.
 */
export const sessionReply = z.discriminatedUnion("signedIn", [
  z.object({ signedIn: z.literal(false), installationName: z.string().nullable() }).strict(),
  z.object({ signedIn: z.literal(true), name: z.string(), installationName: z.string().nullable() }).strict(),
]);

export type SessionReply = z.infer<typeof sessionReply>;

/** What a sign-in confirms: the account's name. The token and the marker travel only as cookies. */
export const signInReply = z.object({ name: z.string() }).strict();

/** What a sign-out confirms: the caller is no longer signed in (D-13). */
export const signOutReply = z.object({ signedIn: z.literal(false) }).strict();

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
    summary: "Signs in with an email and password, setting the session cookie and the browser marker.",
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
