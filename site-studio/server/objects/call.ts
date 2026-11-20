import { RELEASE, RELEASE_HEADER } from "../../shared/release";
import { isRefusalCode, refusalBody, type RefusalBody } from "../../shared/refusal";
import { isVersionStop, isVersionStopShown } from "./versionGuard";

// The one way code calls an object, used by the entry and by objects calling other objects.
// It attaches this build's release, retries once when the object refused or stopped for a
// version change, and otherwise answers "updating, try again shortly" (AD-20).
//
// Retrying (D-2): an `updating` refusal is always retried, because the object refuses before it
// writes anything. A thrown error is retried when it carries the version-stop reason, which the
// object raises before any write. A bare reset of the object (`durableObjectReset` without that
// reason) may come after a write committed, so it is retried only for a call marked idempotent
// (a read); for any other call it reaches the caller. Whether Cloudflare passes the reason to the
// caller is checked on a deployed installation (story 1.2, spec 4).

export type ObjectCallResult<T> = { ok: true; value: T } | { ok: false; status: number; body: RefusalBody };

const OBJECT_ORIGIN = "https://object.internal/";

export interface CallOptions {
  /** True for an operation that changes nothing, so running it twice is harmless. */
  idempotent?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any object class; calls go through fetch.
type AnyNamespace = DurableObjectNamespace<any>;

export async function callObject<T = unknown>(
  namespace: AnyNamespace,
  id: DurableObjectId,
  operation: string,
  input: unknown = null,
  options: CallOptions = {},
): Promise<ObjectCallResult<T>> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    // A stopped object breaks its stub, so every attempt takes a fresh one.
    const stub = (namespace as unknown as DurableObjectNamespace).get(id);
    let response: Response;
    try {
      response = await stub.fetch(OBJECT_ORIGIN + operation, {
        method: "POST",
        headers: { [RELEASE_HEADER]: RELEASE, "content-type": "application/json" },
        body: JSON.stringify(input),
      });
    } catch (error) {
      if (isVersionStopShown(error)) continue;
      if (options.idempotent && isVersionStop(error)) continue;
      throw error;
    }
    const body = (await response.json()) as { value?: T; error?: { code?: unknown } };
    if (response.ok) return { ok: true, value: body.value as T };
    const code = body.error?.code;
    if (code === "updating") continue;
    if (isRefusalCode(code)) return { ok: false, status: response.status, body: body as RefusalBody };
    throw new Error(`Object operation ${operation} answered ${response.status} without a refusal code.`);
  }
  return { ok: false, status: 503, body: refusalBody("updating") };
}
