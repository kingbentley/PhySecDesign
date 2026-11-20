import { z } from "zod";

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
}

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

export const ROUTES = {
  status: declareRoute({
    id: "status",
    method: "GET",
    path: "/api/v1/status",
    input: z.object({}).strict(),
    reply: statusReply,
    summary: "The running release and the installation's data format and creation time.",
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
