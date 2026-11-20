import type { z } from "zod";
import { RELEASE } from "../../shared/release";
import type { RefusalBody } from "../../shared/refusal";
import { ROUTES } from "../../shared/routes";
import { INSTALLATION_NAME, type Env } from "../env";
import type { InstallationStatus } from "../installation/Installation";
import { callObject } from "../objects/call";

// One handler per declared route. The mapped type makes a declared route without a handler, or a
// handler without a declaration, a type error.

export type HandlerResult<T> = { ok: true; value: T } | { ok: false; status: number; body: RefusalBody };

type Routes = typeof ROUTES;
export type RouteHandlers = {
  [K in keyof Routes]: (input: z.infer<Routes[K]["input"]>, env: Env) => Promise<HandlerResult<z.infer<Routes[K]["reply"]>>>;
};

export const HANDLERS: RouteHandlers = {
  async status(_input, env) {
    const id = env.INSTALLATION.idFromName(INSTALLATION_NAME);
    const result = await callObject<InstallationStatus>(env.INSTALLATION, id, "status");
    if (!result.ok) return result;
    return { ok: true, value: { release: RELEASE, installation: result.value } };
  },
};
