import { RELEASE_HEADER } from "../shared/release";

/** Sends a call straight to an object, as another release's code would. */
export function rawObjectCall(
  stub: { fetch(input: string, init?: RequestInit): Promise<Response> },
  operation: string,
  release: string | null,
  input: unknown = null,
): Promise<Response> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (release !== null) headers[RELEASE_HEADER] = release;
  return stub.fetch(`https://object.internal/${operation}`, { method: "POST", headers, body: JSON.stringify(input) });
}

export function tableExists(sql: SqlStorage, name: string): boolean {
  return sql.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", name).toArray().length > 0;
}
