import { runInDurableObject } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { ROUTES } from "../shared/routes";
import { normalisePassword } from "../shared/setup";
import { markerCookieName } from "../server/auth/marker";
import { hashPassword, type PasswordHash } from "../server/auth/password";
import { sessionCookieName } from "../server/auth/session";
import type { Installation } from "../server/installation/Installation";
import { INVITATIONS_TABLE } from "../server/installation/invitationStore";
import { USERS_TABLE } from "../server/installation/setupStore";
import { installationFor, post, refusalOf, seedAccount, signedIn, signIn, type Installed, type Wrap } from "./signin-helpers";

// Retrying the invitation routes' object calls (story 1.2's D-2 as amended; story 1.4, spec 2).
// The invitation read writes nothing, so after a bare reset (`durableObjectReset` without the
// version-stop reason) it is sent once more. Creating and accepting an invitation write, so neither
// is sent again and the error reaches the client.

const ADMIN_EMAIL = "dana@acme.test";
const ADMIN_PASSWORD = "correct horse battery staple";
const INVITEE = "robin.new@acme.test";
const NEW_PASSWORD = "a brand new long password";
let hash: PasswordHash;

beforeAll(async () => {
  hash = await hashPassword(normalisePassword(ADMIN_PASSWORD));
});

const bareReset = () => Object.assign(new Error("Durable Object reset because its code was updated."), { durableObjectReset: true });

/** Fails the first call to `operation` as a bare reset would, after the object answered (a committed write). */
function resetOnce(operation: string): Wrap {
  let done = false;
  return async (name, _init, send) => {
    const response = await send();
    if (name !== operation || done) return response;
    done = true;
    await response.arrayBuffer();
    throw bareReset();
  };
}

async function quietly<T>(work: () => Promise<T>): Promise<T> {
  const log = console.error;
  console.error = () => {};
  try {
    return await work();
  } finally {
    console.error = log;
  }
}

async function adminFor(name: string, operation: string): Promise<{ installed: Installed; cookies: Record<string, string> }> {
  const installed = installationFor(`inv-retry-${name}`, resetOnce(operation));
  await seedAccount(installed.stub, { email: ADMIN_EMAIL, hash });
  return { installed, cookies: await signedIn(installed.env, ADMIN_EMAIL, ADMIN_PASSWORD) };
}

async function invite(installed: Installed, cookies: Record<string, string>): Promise<string> {
  const response = await post(installed.env, ROUTES.invite.path, { email: INVITEE, name: "Robin New", role: "standard" }, { cookies });
  expect(response.status, await response.clone().text()).toBe(200);
  const { link } = (await response.json()) as { link: string };
  return link.slice(link.indexOf("#") + 1);
}

function count(installed: Installed, table: string): Promise<number> {
  return runInDurableObject(installed.stub, (_i, state) => state.storage.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`).one().n);
}

describe("a bare reset", { timeout: 60_000 }, () => {
  it("on the invitation read is retried once and the read answers", async () => {
    const { installed, cookies } = await adminFor("read", "invitationInfo");
    const secret = await invite(installed, cookies);
    const response = await post(installed.env, ROUTES.invitationRead.path, { secret });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ email: INVITEE });
    expect(installed.calls.get("invitationInfo")).toBe(2);
  });

  it("on createInvitation is not retried: one call, and the error reaches the client", async () => {
    const { installed, cookies } = await adminFor("create", "createInvitation");
    const response = await quietly(() => post(installed.env, ROUTES.invite.path, { email: INVITEE, name: "Robin New", role: "standard" }, { cookies }));
    expect(response.status).toBe(500);
    expect((await refusalOf(response, [INVITEE])).code).toBe("internal_error");
    expect(installed.calls.get("createInvitation")).toBe(1);
    // The write had committed before the reset; it is not repeated.
    expect(await count(installed, INVITATIONS_TABLE)).toBe(1);
  });

  it("on acceptInvitation is not retried: one call, the error reaches the client and no cookie is set", async () => {
    const { installed, cookies } = await adminFor("accept", "acceptInvitation");
    const secret = await invite(installed, cookies);
    const response = await quietly(() =>
      post(installed.env, ROUTES.acceptInvite.path, { secret, name: "Robin New", password: NEW_PASSWORD }),
    );
    expect(response.status).toBe(500);
    expect((await refusalOf(response, [secret, NEW_PASSWORD])).code).toBe("internal_error");
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(installed.calls.get("acceptInvitation")).toBe(1);
    expect(installed.calls.get("invitationInfo")).toBe(1);
    // The write had committed before the reset: one account, the invitation consumed.
    expect(await count(installed, USERS_TABLE)).toBe(2);
    expect(await count(installed, INVITATIONS_TABLE)).toBe(0);
    // The person can still recover: the password set on acceptance signs in.
    expect((await signIn(installed.env, INVITEE, NEW_PASSWORD)).status).toBe(200);
  });

  it("on the accept's invitation read is retried once and the accept completes", async () => {
    // The invite step does not call invitationInfo, so the reset lands on the accept's read.
    const { installed, cookies } = await adminFor("accept-read", "invitationInfo");
    const secret = await invite(installed, cookies);
    const response = await post(installed.env, ROUTES.acceptInvite.path, { secret, name: "Robin New", password: NEW_PASSWORD });
    expect(response.status, await response.clone().text()).toBe(200);
    const identifier = await runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.identifier());
    const names = response.headers.getSetCookie().map((line) => line.slice(0, line.indexOf("=")));
    expect(names.sort()).toEqual([markerCookieName(identifier), sessionCookieName(identifier)].sort());
    expect(installed.calls.get("invitationInfo")).toBe(2);
    expect(installed.calls.get("acceptInvitation")).toBe(1);
  });
});
