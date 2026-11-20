import { env } from "cloudflare:workers";
import { evictDurableObject, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { hashPassword } from "../server/auth/password";
import { setupCodeFingerprint } from "../server/auth/setupCode";
import { Installation } from "../server/installation/Installation";
import {
  ADDRESS_CLEAR_MS,
  addressWaitMs,
  CAP_WINDOW_MS,
  INSTALLATION_CAP,
  SETTINGS_TABLE,
  USERS_TABLE,
  type CreateFirstAdministratorInput,
} from "../server/installation/setupStore";
import { callObject } from "../server/objects/call";
import type { ObjectBase } from "../server/objects/ObjectBase";
import { tableExists } from "./helpers";

// The installation object's set-up storage: users, settings and wrong-code counts (CAP-4's
// storage, CAP-6, the storage half of CAP-7, CAP-11).

const MINUTE = 60_000;
const T0 = Date.UTC(2026, 10, 20, 12, 0, 0);

function idFor(name: string) {
  return env.INSTALLATION.idFromName(name);
}

function stubFor(name: string) {
  return env.INSTALLATION.get(idFor(name));
}

let fingerprints: Promise<[string, string]> | null = null;
function codeFingerprints(): Promise<[string, string]> {
  fingerprints ??= Promise.all([setupCodeFingerprint("first-code-abcdefghijk"), setupCodeFingerprint("second-code-abcdefghij")]);
  return fingerprints;
}

/** Runs one attempt directly on the store at a chosen time; answers "counted" or the refusal. */
async function attemptAt(name: string, address: string, fingerprint: string, now: number) {
  return runInDurableObject(stubFor(name), (instance: Installation) => {
    try {
      instance.setup.attempt(address, fingerprint, now);
      return { outcome: "counted" as const };
    } catch (error) {
      const refusal = error as { code?: string; retryAfterSeconds?: number };
      return { outcome: refusal.code ?? "error", retryAfterSeconds: refusal.retryAfterSeconds };
    }
  });
}

function countsOf(name: string) {
  return runInDurableObject(stubFor(name), (instance: Installation) => instance.setup.counts());
}

async function adminInput(fingerprint: string, overrides: Partial<CreateFirstAdministratorInput> = {}): Promise<CreateFirstAdministratorInput> {
  return {
    fingerprint,
    installationName: "Acme Security",
    publicAddress: "https://survey.acme.test",
    name: "Dana Admin",
    email: "Dana@Acme.test",
    passwordHash: await hashPassword("correct horse battery"),
    ...overrides,
  };
}

describe("set-up state", () => {
  it("is open with no users and closed once the first administrator exists", async () => {
    const name = "state";
    const [fingerprint] = await codeFingerprints();
    expect(await callObject(env.INSTALLATION, idFor(name), "setupState")).toEqual({ ok: true, value: { state: "open" } });
    expect((await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "198.51.100.1", fingerprint })).ok).toBe(true);
    const created = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint));
    expect(created).toEqual({
      ok: true,
      value: { userId: expect.any(String), installationName: "Acme Security", email: "dana@acme.test" },
    });
    expect(await callObject(env.INSTALLATION, idFor(name), "setupState")).toEqual({ ok: true, value: { state: "closed" } });

    // Once a user exists, the code no longer works: attempts and creates are refused as closed.
    const attempt = await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "198.51.100.1", fingerprint });
    expect(attempt.ok ? null : attempt.body.error.code).toBe("setup_closed");
    const again = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, { email: "other@acme.test" }));
    expect(again.ok ? null : again.body.error.code).toBe("setup_closed");
  });
});

describe("the first administrator's stored row", () => {
  it("holds a salted scrypt hash with its parameters and never the password", async () => {
    const name = "stored-row";
    const password = "correct horse battery";
    const [fingerprint] = await codeFingerprints();
    await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "198.51.100.2", fingerprint });
    const passwordHash = await hashPassword(password);
    const created = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, { passwordHash }));
    expect(created.ok).toBe(true);

    const stored = await runInDurableObject(stubFor(name), (_instance, state) => ({
      users: state.storage.sql.exec(`SELECT * FROM ${USERS_TABLE}`).toArray(),
      settings: state.storage.sql.exec(`SELECT * FROM ${SETTINGS_TABLE}`).toArray(),
    }));
    expect(stored.users).toHaveLength(1);
    const row = stored.users[0]!;
    expect(row).toMatchObject({
      email: "dana@acme.test",
      name: "Dana Admin",
      role: "administrator",
      active: 1,
      password_algorithm: "scrypt",
      password_n: 131_072,
      password_r: 8,
      password_p: 1,
      password_key_length: 32,
      password_salt: passwordHash.salt,
      password_hash: passwordHash.hash,
    });
    expect(Object.keys(row).some((column) => /^password$/i.test(column))).toBe(false);
    const everything = JSON.stringify(stored);
    expect(everything).not.toContain(password);
    expect(everything).not.toContain(btoa(password));
    expect(stored.settings).toEqual([
      { id: 1, installation_name: "Acme Security", public_address: "https://survey.acme.test", set_up_at: expect.any(String) },
    ]);
  });

  it("refuses input that breaks the rules, naming the field and never the value", async () => {
    const name = "create-invalid";
    const [fingerprint] = await codeFingerprints();
    await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "198.51.100.3", fingerprint });
    const cases: [Partial<CreateFirstAdministratorInput>, string][] = [
      [{ installationName: "x".repeat(81) }, "installationName"],
      [{ name: "" }, "name"],
      [{ email: "not-an-email" }, "email"],
      [{ publicAddress: "https://survey.acme.test/setup?x=1" }, "publicAddress"],
    ];
    for (const [overrides, field] of cases) {
      const result = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, overrides));
      expect(result.ok, field).toBe(false);
      if (!result.ok) {
        expect(result.body.error).toMatchObject({ code: "invalid_input", field });
        const entered = String(Object.values(overrides)[0]);
        if (entered.length > 0) expect(JSON.stringify(result.body)).not.toContain(entered);
      }
    }
    const badHash = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", {
      ...(await adminInput(fingerprint)),
      passwordHash: { algorithm: "plain", value: "correct horse battery" },
    });
    expect(badHash.ok ? null : badHash.body.error.code).toBe("invalid_input");
    expect(JSON.stringify(badHash)).not.toContain("correct horse battery");
    expect(await callObject(env.INSTALLATION, idFor(name), "setupState")).toEqual({ ok: true, value: { state: "open" } });
  });

  it("is refused when the code's fingerprint changed after the attempt, or no attempt was made", async () => {
    const [first, second] = await codeFingerprints();
    const never = await callObject(env.INSTALLATION, idFor("create-no-attempt"), "createFirstAdministrator", await adminInput(first));
    expect(never.ok ? null : never.body.error.code).toBe("setup_code_wrong");

    const name = "create-stale-fingerprint";
    await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "198.51.100.4", fingerprint: first });
    // A redeploy issued a new code, seen by another attempt in the meantime.
    await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "198.51.100.5", fingerprint: second });
    const stale = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(first));
    expect(stale.ok ? null : stale.body.error.code).toBe("setup_code_wrong");
    expect(await callObject(env.INSTALLATION, idFor(name), "setupState")).toEqual({ ok: true, value: { state: "open" } });
  });
});

describe("two set-up requests at the same moment", () => {
  it("leave exactly one administrator; the others are refused as closed", async () => {
    const name = "concurrent-create";
    const [fingerprint] = await codeFingerprints();
    await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "198.51.100.6", fingerprint });
    const passwordHash = await hashPassword("correct horse battery");
    const inputs = ["first@acme.test", "second@acme.test", "third@acme.test"].map((email) => ({
      fingerprint,
      installationName: `Installation of ${email}`,
      publicAddress: "https://survey.acme.test",
      name: email,
      email,
      passwordHash,
    }));
    const results = await Promise.all(inputs.map((input) => callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", input)));
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok).map((result) => (result.ok ? null : result.body.error.code))).toEqual([
      "setup_closed",
      "setup_closed",
    ]);
    const stored = await runInDurableObject(stubFor(name), (_instance, state) => ({
      users: state.storage.sql.exec<{ email: string; role: string }>(`SELECT email, role FROM ${USERS_TABLE}`).toArray(),
      settings: state.storage.sql.exec<{ installation_name: string }>(`SELECT installation_name FROM ${SETTINGS_TABLE}`).toArray(),
    }));
    expect(stored.users).toHaveLength(1);
    expect(stored.users[0]!.role).toBe("administrator");
    expect(stored.settings).toEqual([{ installation_name: `Installation of ${stored.users[0]!.email}` }]);
  });
});

describe("wrong-code counts", () => {
  it("are raised before the check and hold across an object restart", async () => {
    const name = "counts-restart";
    const [fingerprint] = await codeFingerprints();
    const address = "203.0.113.10";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address, fingerprint });
      expect(result).toEqual({ ok: true, value: { counted: true } });
    }
    const before = await countsOf(name);
    expect(before.byAddress).toEqual([{ address, failures: 5, lastFailureAt: expect.any(Number) }]);
    expect(before.recent).toHaveLength(5);
    expect(before.fingerprint).toBe(fingerprint);

    const startBefore = await runInDurableObject(stubFor(name), (instance: ObjectBase) => instance.startId);
    await evictDurableObject(stubFor(name));
    const startAfter = await runInDurableObject(stubFor(name), (instance: ObjectBase) => instance.startId);
    expect(startAfter).not.toBe(startBefore);
    expect(await countsOf(name)).toEqual(before);

    // The wait still applies after the restart, and the refused attempt is not counted.
    const refused = await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address, fingerprint });
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.status).toBe(429);
      expect(refused.body.error.code).toBe("setup_wait");
      expect(refused.body.error.retryAfterSeconds).toBeGreaterThan(0);
      expect(refused.body.error.retryAfterSeconds).toBeLessThanOrEqual(60);
      expect(refused.body.error.message).toMatch(/deploy again/i);
    }
    expect((await countsOf(name)).byAddress[0]!.failures).toBe(5);
  });

  it("count every one of several attempts sent at once", async () => {
    const name = "counts-concurrent";
    const [fingerprint] = await codeFingerprints();
    const address = "203.0.113.11";
    const results = await Promise.all(
      Array.from({ length: 5 }, () => callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address, fingerprint })),
    );
    expect(results.every((result) => result.ok)).toBe(true);
    expect((await countsOf(name)).byAddress[0]!.failures).toBe(5);
    const sixth = await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address, fingerprint });
    expect(sixth.ok ? null : sixth.body.error.code).toBe("setup_wait");
  });

  it("make an address wait 1 minute after 5, doubling with each further failure up to 15 minutes", async () => {
    expect([4, 5, 6, 7, 8, 9, 10, 40].map(addressWaitMs)).toEqual([0, 1, 2, 4, 8, 15, 15, 15].map((m) => m * MINUTE));

    const name = "counts-doubling";
    const [fingerprint] = await codeFingerprints();
    const address = "203.0.113.12";
    let now = T0;
    for (let attempt = 0; attempt < 5; attempt += 1) expect((await attemptAt(name, address, fingerprint, now)).outcome).toBe("counted");

    // Expected wait after each count from the fifth on: 1, 2, 4, 8 minutes.
    for (const waitMinutes of [1, 2, 4, 8]) {
      const during = await attemptAt(name, address, fingerprint, now + waitMinutes * MINUTE - 1);
      expect(during).toEqual({ outcome: "setup_wait", retryAfterSeconds: 1 });
      const early = await attemptAt(name, address, fingerprint, now + 1000);
      expect(early).toEqual({ outcome: "setup_wait", retryAfterSeconds: waitMinutes * 60 - 1 });
      now += waitMinutes * MINUTE;
      expect((await attemptAt(name, address, fingerprint, now)).outcome).toBe("counted");
    }
    // Nine counted: the wait is capped at 15 minutes. Refused attempts were not counted.
    expect((await countsOf(name)).byAddress[0]!.failures).toBe(9);
    expect(await attemptAt(name, address, fingerprint, now + 1000)).toEqual({ outcome: "setup_wait", retryAfterSeconds: 15 * 60 - 1 });

    // Another address is not held by this one's wait.
    expect((await attemptAt(name, "203.0.113.99", fingerprint, now + 1000)).outcome).toBe("counted");
  });

  it("clear an address's count 15 minutes after its last failure", async () => {
    const name = "counts-clearing";
    const [fingerprint] = await codeFingerprints();
    const address = "203.0.113.13";
    for (let attempt = 0; attempt < 4; attempt += 1) await attemptAt(name, address, fingerprint, T0);
    // Just before 15 minutes the count is kept; at 15 minutes it has cleared.
    expect((await attemptAt(name, address, fingerprint, T0 + ADDRESS_CLEAR_MS - 1)).outcome).toBe("counted");
    expect((await countsOf(name)).byAddress[0]!.failures).toBe(5);
    const last = T0 + ADDRESS_CLEAR_MS - 1;
    expect((await attemptAt(name, address, fingerprint, last + ADDRESS_CLEAR_MS)).outcome).toBe("counted");
    expect((await countsOf(name)).byAddress).toEqual([{ address, failures: 1, lastFailureAt: last + ADDRESS_CLEAR_MS }]);
  });

  it("refuse every address after 100 within a rolling hour, until the oldest leaves the hour", async () => {
    const name = "counts-cap";
    const [fingerprint] = await codeFingerprints();
    // 100 attempts from 50 addresses, two each, one second apart.
    for (let index = 0; index < INSTALLATION_CAP; index += 1) {
      const result = await attemptAt(name, `192.0.2.${index % 50}`, fingerprint, T0 + index * 1000);
      expect(result.outcome, String(index)).toBe("counted");
    }
    const last = T0 + (INSTALLATION_CAP - 1) * 1000;
    const fresh = await attemptAt(name, "198.18.0.1", fingerprint, last + 1000);
    expect(fresh).toEqual({ outcome: "setup_wait", retryAfterSeconds: 3500 });
    expect((await countsOf(name)).recent).toHaveLength(INSTALLATION_CAP);

    // Rolling: just before the oldest is an hour old, still refused; at an hour, one is let through.
    expect((await attemptAt(name, "198.18.0.1", fingerprint, T0 + CAP_WINDOW_MS - 1)).outcome).toBe("setup_wait");
    expect((await attemptAt(name, "198.18.0.1", fingerprint, T0 + CAP_WINDOW_MS)).outcome).toBe("counted");
    expect((await attemptAt(name, "198.18.0.2", fingerprint, T0 + CAP_WINDOW_MS)).outcome).toBe("setup_wait");
    expect((await attemptAt(name, "198.18.0.2", fingerprint, T0 + CAP_WINDOW_MS + 1000)).outcome).toBe("counted");
  });

  it("start again when a new code's fingerprint arrives", async () => {
    const name = "counts-new-code";
    const [first, second] = await codeFingerprints();
    const address = "203.0.113.14";
    for (let attempt = 0; attempt < 5; attempt += 1) await attemptAt(name, address, first, T0);
    expect((await attemptAt(name, address, first, T0 + 1000)).outcome).toBe("setup_wait");
    expect((await attemptAt(name, address, second, T0 + 2000)).outcome).toBe("counted");
    const counts = await countsOf(name);
    expect(counts.fingerprint).toBe(second);
    expect(counts.byAddress).toEqual([{ address, failures: 1, lastFailureAt: T0 + 2000 }]);
    expect(counts.recent).toEqual([T0 + 2000]);
  });

  it("are cleared when set-up completes", async () => {
    const name = "counts-cleared-on-success";
    const [fingerprint] = await codeFingerprints();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "203.0.113.15", fingerprint });
    }
    expect((await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint))).ok).toBe(true);
    const counts = await countsOf(name);
    expect(counts.byAddress).toEqual([]);
    expect(counts.recent).toEqual([]);
  });

  it("refuse malformed attempt input without counting it", async () => {
    const name = "counts-invalid";
    const [fingerprint] = await codeFingerprints();
    for (const input of [{ address: "", fingerprint }, { address: "203.0.113.16", fingerprint: "the-code-itself" }, { address: "203.0.113.16" }]) {
      const result = await callObject(env.INSTALLATION, idFor(name), "setupAttempt", input);
      expect(result.ok ? null : result.body.error.code).toBe("invalid_input");
      expect(JSON.stringify(result)).not.toContain("the-code-itself");
    }
    expect((await countsOf(name)).recent).toEqual([]);
  });
});

describe("accounts and the installation's name are outside project revisions (CAP-11)", () => {
  it("live only in the installation object, which offers no restore, so a restore leaves them unchanged", async () => {
    const name = "outside-revisions";
    const [fingerprint] = await codeFingerprints();
    await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "203.0.113.17", fingerprint });
    expect((await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint))).ok).toBe(true);
    const snapshot = () =>
      runInDurableObject(stubFor(name), (_instance, state) => ({
        users: state.storage.sql.exec(`SELECT * FROM ${USERS_TABLE}`).toArray(),
        settings: state.storage.sql.exec(`SELECT * FROM ${SETTINGS_TABLE}`).toArray(),
      }));
    const before = await snapshot();

    // The installation object's operations are exactly these; none restores a revision.
    const operations = await runInDurableObject(stubFor(name), (instance: Installation) => [...instance.ops.keys()].sort());
    expect(operations).toEqual(["createFirstAdministrator", "setupAttempt", "setupState", "status"]);
    expect(operations.some((operation) => /restore|revision/i.test(operation))).toBe(false);

    // Revisions belong to project rooms, which hold no account or settings table and no operation.
    const room = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName(name));
    const roomState = await runInDurableObject(room as unknown as DurableObjectStub<Installation>, (instance: ObjectBase, state) => ({
      operations: [...instance.ops.keys()],
      users: tableExists(state.storage.sql, USERS_TABLE),
      settings: tableExists(state.storage.sql, SETTINGS_TABLE),
    }));
    expect(roomState).toEqual({ operations: [], users: false, settings: false });

    // Nothing else changes them: reading the status and state, and a restart, leave them as they were.
    await callObject(env.INSTALLATION, idFor(name), "status");
    await callObject(env.INSTALLATION, idFor(name), "setupState");
    await evictDurableObject(stubFor(name));
    expect(await snapshot()).toEqual(before);
  });
});
