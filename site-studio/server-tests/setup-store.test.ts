import { env } from "cloudflare:workers";
import { evictDurableObject, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { hashPassword } from "../server/auth/password";
import { setupCodeFingerprint } from "../server/auth/setupCode";
import { Installation } from "../server/installation/Installation";
import {
  ADDRESS_CLEAR_MS,
  addressClearsAt,
  addressWaitMs,
  CAP_WINDOW_MS,
  INSTALLATION_CAP,
  MAX_WAIT_MS,
  SETTINGS_TABLE,
  createFirstAdministratorInput,
  TICKET_TTL_MS,
  USERS_TABLE,
  type CreateFirstAdministratorInput,
} from "../server/installation/setupStore";
import { toBase64 } from "../server/auth/password";
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

/** Makes one counted attempt through the object and answers its one-time ticket. */
async function ticketFor(name: string, address: string, fingerprint: string): Promise<string> {
  const result = await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address, fingerprint });
  if (!result.ok) throw new Error(`attempt refused: ${result.body.error.code}`);
  const { ticket } = result.value as { counted: true; ticket: string };
  return ticket;
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

async function adminInput(
  fingerprint: string,
  ticket: string,
  overrides: Partial<CreateFirstAdministratorInput> = {},
): Promise<CreateFirstAdministratorInput> {
  return {
    fingerprint,
    ticket,
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
    const ticket = await ticketFor(name, "198.51.100.1", fingerprint);
    const created = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, ticket));
    expect(created).toEqual({
      ok: true,
      value: { userId: expect.any(String), installationName: "Acme Security", email: "dana@acme.test" },
    });
    expect(await callObject(env.INSTALLATION, idFor(name), "setupState")).toEqual({ ok: true, value: { state: "closed" } });

    // Once a user exists, the code no longer works: attempts and creates are refused as closed.
    const attempt = await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "198.51.100.1", fingerprint });
    expect(attempt.ok ? null : attempt.body.error.code).toBe("setup_closed");
    const again = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, ticket, { email: "other@acme.test" }));
    expect(again.ok ? null : again.body.error.code).toBe("setup_closed");
  });
});

describe("the first administrator's stored row", () => {
  it("holds a salted scrypt hash with its parameters and never the password", async () => {
    const name = "stored-row";
    const password = "correct horse battery";
    const [fingerprint] = await codeFingerprints();
    const ticket = await ticketFor(name, "198.51.100.2", fingerprint);
    const passwordHash = await hashPassword(password);
    const created = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, ticket, { passwordHash }));
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
    const ticket = await ticketFor(name, "198.51.100.3", fingerprint);
    const cases: [Partial<CreateFirstAdministratorInput>, string][] = [
      [{ installationName: "x".repeat(81) }, "installationName"],
      [{ name: "" }, "name"],
      [{ email: "not-an-email" }, "email"],
      [{ publicAddress: "https://survey.acme.test/setup?x=1" }, "publicAddress"],
    ];
    for (const [overrides, field] of cases) {
      const result = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, ticket, overrides));
      expect(result.ok, field).toBe(false);
      if (!result.ok) {
        expect(result.body.error).toMatchObject({ code: "invalid_input", field });
        const entered = String(Object.values(overrides)[0]);
        if (entered.length > 0) expect(JSON.stringify(result.body)).not.toContain(entered);
      }
    }
    const badHash = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", {
      ...(await adminInput(fingerprint, ticket)),
      passwordHash: { algorithm: "plain", value: "correct horse battery" },
    });
    expect(badHash.ok ? null : badHash.body.error.code).toBe("invalid_input");
    expect(JSON.stringify(badHash)).not.toContain("correct horse battery");
    expect(await callObject(env.INSTALLATION, idFor(name), "setupState")).toEqual({ ok: true, value: { state: "open" } });
  });

  it("is refused when the code's fingerprint changed after the attempt, or no attempt was made", async () => {
    const [first, second] = await codeFingerprints();
    const never = await callObject(env.INSTALLATION, idFor("create-no-attempt"), "createFirstAdministrator", await adminInput(first, "a".repeat(64)));
    expect(never.ok ? null : never.body.error.code).toBe("setup_code_wrong");

    const name = "create-stale-fingerprint";
    const ticket = await ticketFor(name, "198.51.100.4", first);
    // A redeploy issued a new code, seen by another attempt in the meantime: the earlier code's
    // fingerprint is now a replaced one (D-7).
    await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "198.51.100.5", fingerprint: second });
    const stale = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(first, ticket));
    expect(stale.ok ? null : stale.body.error.code).toBe("setup_code_replaced");
    expect(await callObject(env.INSTALLATION, idFor(name), "setupState")).toEqual({ ok: true, value: { state: "open" } });
  });
});

describe("password hash parameters at create", () => {
  it("are pinned to scrypt N = 131,072, r = 8, p = 1, a 16-byte salt and a 32-byte hash; others are refused and nothing is written", async () => {
    const name = "create-pinned-parameters";
    const [fingerprint] = await codeFingerprints();
    const ticket = await ticketFor(name, "198.51.100.7", fingerprint);
    const good = await hashPassword("correct horse battery");
    const cases: [Record<string, unknown>, string][] = [
      [{ n: 16_384 }, "passwordHash.n"],
      [{ n: 262_144 }, "passwordHash.n"],
      [{ r: 1 }, "passwordHash.r"],
      [{ p: 2 }, "passwordHash.p"],
      [{ keyLength: 64 }, "passwordHash.keyLength"],
      [{ salt: toBase64(new Uint8Array(8)) }, "passwordHash.salt"],
      [{ salt: toBase64(new Uint8Array(17)) }, "passwordHash.salt"],
      [{ hash: toBase64(new Uint8Array(16)) }, "passwordHash.hash"],
      [{ hash: toBase64(new Uint8Array(64)) }, "passwordHash.hash"],
      [{ hash: "A" }, "passwordHash.hash"],
    ];
    for (const [change, field] of cases) {
      const input = await adminInput(fingerprint, ticket, { passwordHash: { ...good, ...change } as typeof good });
      const result = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", input);
      expect(result.ok, JSON.stringify(change)).toBe(false);
      if (!result.ok) {
        expect(result.body.error).toMatchObject({ code: "invalid_input", field });
        expect(JSON.stringify(result.body)).not.toContain(ticket);
      }
    }
    const stored = await runInDurableObject(stubFor(name), (_instance, state) => ({
      users: state.storage.sql.exec(`SELECT * FROM ${USERS_TABLE}`).toArray(),
      settings: state.storage.sql.exec(`SELECT * FROM ${SETTINGS_TABLE}`).toArray(),
    }));
    expect(stored).toEqual({ users: [], settings: [] });
    // The ticket was not spent by the refused creates: the right parameters still succeed.
    expect((await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, ticket))).ok).toBe(true);
  });
});

describe("the one-time ticket from a counted attempt", () => {
  async function storedRows(name: string) {
    return runInDurableObject(stubFor(name), (_instance, state) => ({
      users: state.storage.sql.exec(`SELECT * FROM ${USERS_TABLE}`).toArray().length,
      settings: state.storage.sql.exec(`SELECT * FROM ${SETTINGS_TABLE}`).toArray().length,
    }));
  }

  /** Creates directly on the store at a chosen time; answers "created" or the refusal code. */
  async function createAt(name: string, input: CreateFirstAdministratorInput, now: number) {
    const parsed = createFirstAdministratorInput.parse(input);
    return runInDurableObject(stubFor(name), (instance: Installation) => {
      try {
        instance.setup.createFirstAdministrator(parsed, now);
        return "created";
      } catch (error) {
        return (error as { code?: string }).code ?? "error";
      }
    });
  }

  it("is required: a create without one is refused, naming only the field, and writes nothing", async () => {
    const name = "ticket-missing";
    const [fingerprint] = await codeFingerprints();
    await ticketFor(name, "198.51.100.8", fingerprint);
    const { ticket: _omitted, ...withoutTicket } = await adminInput(fingerprint, "unused");
    const missing = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", withoutTicket);
    expect(missing.ok ? null : missing.body.error).toMatchObject({ code: "invalid_input", field: "ticket" });
    const made = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, "f".repeat(64)));
    expect(made.ok ? null : made.body.error.code).toBe("setup_code_wrong");
    expect(JSON.stringify(made)).not.toContain("f".repeat(64));
    expect(await storedRows(name)).toEqual({ users: 0, settings: 0 });
  });

  it("is single-use: once consumed it is gone, and reusing it is refused", async () => {
    const name = "ticket-reused";
    const [fingerprint] = await codeFingerprints();
    const ticket = await ticketFor(name, "198.51.100.9", fingerprint);
    expect((await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, ticket))).ok).toBe(true);
    const reused = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, ticket, { email: "other@acme.test" }));
    expect(reused.ok ? null : reused.body.error.code).toBe("setup_closed");

    // Even with the users and settings gone, the spent ticket does not work again.
    const tickets = await runInDurableObject(stubFor(name), (_instance, state) => {
      state.storage.sql.exec(`DELETE FROM ${USERS_TABLE}`);
      state.storage.sql.exec(`DELETE FROM ${SETTINGS_TABLE}`);
      return state.storage.sql.exec("SELECT * FROM setup_tickets").toArray().length;
    });
    expect(tickets).toBe(0);
    const again = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, ticket));
    expect(again.ok ? null : again.body.error.code).toBe("setup_code_wrong");
    expect(await storedRows(name)).toEqual({ users: 0, settings: 0 });
  });

  it("expires 5 minutes after its attempt", async () => {
    const [fingerprint] = await codeFingerprints();
    const issue = (name: string) =>
      runInDurableObject(stubFor(name), (instance: Installation) => instance.setup.attempt("198.51.100.10", fingerprint, T0).ticket);

    const lateName = "ticket-expired";
    const late = await issue(lateName);
    expect(await createAt(lateName, await adminInput(fingerprint, late), T0 + TICKET_TTL_MS)).toBe("setup_code_wrong");
    expect(await storedRows(lateName)).toEqual({ users: 0, settings: 0 });

    const inTimeName = "ticket-in-time";
    const inTime = await issue(inTimeName);
    expect(await createAt(inTimeName, await adminInput(fingerprint, inTime), T0 + TICKET_TTL_MS - 1)).toBe("created");
  });

  it("lapses when a new code's fingerprint arrives, even if the create names the new fingerprint", async () => {
    const name = "ticket-earlier-fingerprint";
    const [first, second] = await codeFingerprints();
    const old = await ticketFor(name, "198.51.100.11", first);
    await ticketFor(name, "198.51.100.12", second);
    const withOld = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(second, old));
    expect(withOld.ok ? null : withOld.body.error.code).toBe("setup_code_wrong");
    // The create from the copy that accepted the old code: its ticket was dropped by the newer
    // fingerprint, so it gets the replaced-code refusal, not "wrong code" (D-7).
    const staleBoth = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(first, old));
    expect(staleBoth.ok ? null : staleBoth.body.error.code).toBe("setup_code_replaced");

    // The old code's fingerprint coming back (copies alternating during a deploy) is refused and
    // does not revive the ticket.
    const back = await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "198.51.100.13", fingerprint: first });
    expect(back.ok ? null : back.body.error.code).toBe("setup_code_replaced");
    const revived = await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(first, old));
    expect(revived.ok ? null : revived.body.error.code).toBe("setup_code_replaced");
    expect(await storedRows(name)).toEqual({ users: 0, settings: 0 });
  });
});

describe("two set-up requests at the same moment", () => {
  it("leave exactly one administrator; the others are refused as closed", async () => {
    const name = "concurrent-create";
    const [fingerprint] = await codeFingerprints();
    const passwordHash = await hashPassword("correct horse battery");
    const emails = ["first@acme.test", "second@acme.test", "third@acme.test"];
    // Each request made its own counted attempt and carries its own ticket.
    const tickets = await Promise.all(emails.map((_email, index) => ticketFor(name, `198.51.100.${60 + index}`, fingerprint)));
    const inputs = emails.map((email, index) => ({
      fingerprint,
      ticket: tickets[index]!,
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
      expect(result).toEqual({ ok: true, value: { counted: true, ticket: expect.stringMatching(/^[0-9a-f]{64}$/) } });
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

  it("clear an address's count 15 minutes after its wait has ended (D-3 as amended)", async () => {
    expect(addressClearsAt(T0, 4)).toBe(T0 + ADDRESS_CLEAR_MS);
    expect(addressClearsAt(T0, 5)).toBe(T0 + MINUTE + ADDRESS_CLEAR_MS);
    expect(addressClearsAt(T0, 9)).toBe(T0 + MAX_WAIT_MS + ADDRESS_CLEAR_MS);

    const name = "counts-clearing";
    const [fingerprint] = await codeFingerprints();
    const address = "203.0.113.13";
    for (let attempt = 0; attempt < 4; attempt += 1) await attemptAt(name, address, fingerprint, T0);
    // Four failures carry no wait: just before 15 minutes the count is kept.
    expect((await attemptAt(name, address, fingerprint, T0 + ADDRESS_CLEAR_MS - 1)).outcome).toBe("counted");
    expect((await countsOf(name)).byAddress[0]!.failures).toBe(5);
    const last = T0 + ADDRESS_CLEAR_MS - 1;
    // Five failures wait 1 minute, so 15 minutes after the last failure the count is still held:
    // the next attempt is counted as the sixth, not as a fresh first.
    const sixthAt = last + ADDRESS_CLEAR_MS;
    expect((await attemptAt(name, address, fingerprint, sixthAt)).outcome).toBe("counted");
    expect((await countsOf(name)).byAddress).toEqual([{ address, failures: 6, lastFailureAt: sixthAt }]);
    // Six failures wait 2 minutes: the count clears 2 + 15 minutes after the sixth, not before.
    expect((await attemptAt(name, address, fingerprint, sixthAt + 2 * MINUTE + ADDRESS_CLEAR_MS - 1)).outcome).toBe("counted");
    expect((await countsOf(name)).byAddress[0]!.failures).toBe(7);
    const seventhAt = sixthAt + 2 * MINUTE + ADDRESS_CLEAR_MS - 1;
    const clearedAt = seventhAt + 4 * MINUTE + ADDRESS_CLEAR_MS;
    expect((await attemptAt(name, address, fingerprint, clearedAt)).outcome).toBe("counted");
    expect((await countsOf(name)).byAddress).toEqual([{ address, failures: 1, lastFailureAt: clearedAt }]);
  });

  it("keep a 15-minute wait from the 9th failure on, so an address gets one attempt per 15 minutes", async () => {
    const name = "counts-capped-wait";
    const [fingerprint] = await codeFingerprints();
    const address = "203.0.113.18";
    let now = T0;
    for (let attempt = 0; attempt < 5; attempt += 1) await attemptAt(name, address, fingerprint, now);
    for (const waitMinutes of [1, 2, 4, 8]) {
      now += waitMinutes * MINUTE;
      expect((await attemptAt(name, address, fingerprint, now)).outcome).toBe("counted");
    }
    expect((await countsOf(name)).byAddress[0]!.failures).toBe(9);

    // Boundary: exactly 900 s after the 9th failure the wait has ended but the count has not
    // cleared, so this attempt counts as the 10th and the next wait is 15 minutes again.
    now += MAX_WAIT_MS;
    expect((await attemptAt(name, address, fingerprint, now)).outcome).toBe("counted");
    expect((await countsOf(name)).byAddress).toEqual([{ address, failures: 10, lastFailureAt: now }]);
    expect(await attemptAt(name, address, fingerprint, now + 1000)).toEqual({ outcome: "setup_wait", retryAfterSeconds: 15 * 60 - 1 });

    // 11th and 12th, each 15 minutes after the one before: still counted, the wait never resets.
    for (const failures of [11, 12]) {
      now += MAX_WAIT_MS;
      expect((await attemptAt(name, address, fingerprint, now)).outcome).toBe("counted");
      expect((await countsOf(name)).byAddress[0]!.failures).toBe(failures);
      expect(await attemptAt(name, address, fingerprint, now + MAX_WAIT_MS - 1)).toEqual({ outcome: "setup_wait", retryAfterSeconds: 1 });
    }

    // Just before wait end + 15 minutes the count is held; at that moment it has cleared.
    expect((await attemptAt(name, address, fingerprint, now + MAX_WAIT_MS + ADDRESS_CLEAR_MS - 1)).outcome).toBe("counted");
    expect((await countsOf(name)).byAddress[0]!.failures).toBe(13);
    const last = now + MAX_WAIT_MS + ADDRESS_CLEAR_MS - 1;
    expect((await attemptAt(name, address, fingerprint, last + MAX_WAIT_MS + ADDRESS_CLEAR_MS)).outcome).toBe("counted");
    expect((await countsOf(name)).byAddress).toEqual([{ address, failures: 1, lastFailureAt: last + MAX_WAIT_MS + ADDRESS_CLEAR_MS }]);
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

  it("survive an A to B to A flip of fingerprints: the replaced A is refused and changes nothing (D-7)", async () => {
    const name = "counts-flip";
    const [first, second] = await codeFingerprints();
    const address = "203.0.113.17";
    for (let attempt = 0; attempt < 3; attempt += 1) expect((await attemptAt(name, address, first, T0)).outcome).toBe("counted");
    // B is new: it replaces A and resets counts and tickets.
    expect((await attemptAt(name, address, second, T0 + 1000)).outcome).toBe("counted");
    expect((await attemptAt(name, address, second, T0 + 2000)).outcome).toBe("counted");
    const before = await countsOf(name);
    expect(before.byAddress).toEqual([{ address, failures: 2, lastFailureAt: T0 + 2000 }]);
    const tickets = () => runInDurableObject(stubFor(name), (_instance, state) => state.storage.sql.exec("SELECT * FROM setup_tickets").toArray().length);
    const ticketsBefore = await tickets();
    expect(ticketsBefore).toBe(2);

    // A again, from a copy still running with the earlier secret: refused, nothing counted or reset.
    for (const at of [T0 + 3000, T0 + 4000]) {
      const replaced = await attemptAt(name, address, first, at);
      expect(replaced).toEqual({ outcome: "setup_code_replaced", retryAfterSeconds: undefined });
    }
    // And B again still counts on top of the earlier two.
    expect((await attemptAt(name, address, second, T0 + 5000)).outcome).toBe("counted");
    const after = await countsOf(name);
    expect(after.fingerprint).toBe(second);
    expect(after.byAddress).toEqual([{ address, failures: 3, lastFailureAt: T0 + 5000 }]);
    expect(after.recent).toEqual([T0 + 1000, T0 + 2000, T0 + 5000]);
    expect(await tickets()).toBe(3);
    expect(await runInDurableObject(stubFor(name), (instance: Installation) => instance.setup.replacedFingerprints())).toEqual([first]);
  });

  it("refuse a replaced fingerprint with the new refusal, leaving counts, tickets and the current fingerprint untouched (D-7)", async () => {
    const name = "counts-replaced-untouched";
    const [first, second] = await codeFingerprints();
    await ticketFor(name, "203.0.113.18", first);
    await ticketFor(name, "203.0.113.19", second);
    const snapshot = await countsOf(name);
    const result = await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "203.0.113.20", fingerprint: first });
    expect(result.ok ? null : result.body).toEqual({
      error: { code: "setup_code_replaced", message: "A new set-up code was issued. Try again in a minute." },
    });
    expect(result.ok ? null : result.status).toBe(409);
    expect(await countsOf(name)).toEqual(snapshot);
    // A third, never-seen code replaces B in turn; both earlier ones stay refused.
    const third = await setupCodeFingerprint("third-code-abcdefghijk");
    await ticketFor(name, "203.0.113.21", third);
    for (const replaced of [first, second]) {
      const again = await callObject(env.INSTALLATION, idFor(name), "setupAttempt", { address: "203.0.113.21", fingerprint: replaced });
      expect(again.ok ? null : again.body.error.code).toBe("setup_code_replaced");
    }
    expect((await countsOf(name)).byAddress).toEqual([expect.objectContaining({ address: "203.0.113.21", failures: 1 })]);
  });

  it("are cleared when set-up completes", async () => {
    const name = "counts-cleared-on-success";
    const [fingerprint] = await codeFingerprints();
    let ticket = "";
    for (let attempt = 0; attempt < 3; attempt += 1) ticket = await ticketFor(name, "203.0.113.15", fingerprint);
    expect((await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, ticket))).ok).toBe(true);
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
    const ticket = await ticketFor(name, "203.0.113.17", fingerprint);
    expect((await callObject(env.INSTALLATION, idFor(name), "createFirstAdministrator", await adminInput(fingerprint, ticket))).ok).toBe(true);
    const snapshot = () =>
      runInDurableObject(stubFor(name), (_instance, state) => ({
        users: state.storage.sql.exec(`SELECT * FROM ${USERS_TABLE}`).toArray(),
        settings: state.storage.sql.exec(`SELECT * FROM ${SETTINGS_TABLE}`).toArray(),
      }));
    const before = await snapshot();

    // The installation object's operations are exactly these; none restores a revision.
    const operations = await runInDurableObject(stubFor(name), (instance: Installation) => [...instance.ops.keys()].sort());
    expect(operations).toEqual([
      "acceptInvitation",
      "completeSignIn",
      "createFirstAdministrator",
      "createInvitation",
      "endSession",
      "invitationInfo",
      "sessionInfo",
      "setupAttempt",
      "setupState",
      "signInAttempt",
      "status",
    ]);
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
