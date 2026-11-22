import { env } from "cloudflare:workers";
import { evictDurableObject, runInDurableObject } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptValue,
  deploymentKeyFingerprint,
  deriveEncryptionKey,
  encryptValue,
  parseDeploymentKey,
} from "../server/auth/deploymentKey";
import { toBase64Url, toHex } from "../server/auth/session";
import { Installation } from "../server/installation/Installation";
import { DEPLOYMENT_KEY_TABLE, type DeploymentKeyState, type KeyStatus } from "../server/installation/keyGuard";
import { callObject } from "../server/objects/call";

// The deployment key, the cipher and the fingerprint guard (story 1.5, spec 1: CAP-10's guard,
// D-14, D-15, D-18 as ruled, D-22; criterion 23). Every key is generated at run time.

const encoder = new TextEncoder();

function newKey(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

function stubFor(name: string) {
  return env.INSTALLATION.get(env.INSTALLATION.idFromName(name));
}

function contains(haystack: Uint8Array, needle: Uint8Array): boolean {
  outer: for (let start = 0; start + needle.length <= haystack.length; start += 1) {
    for (let index = 0; index < needle.length; index += 1) if (haystack[start + index] !== needle[index]) continue outer;
    return true;
  }
  return false;
}

function fromBase64UrlText(text: string): Uint8Array {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/** Every console line written while a test runs, so a test can show no key reached one. */
const CONSOLE_METHODS = ["log", "info", "warn", "error", "debug"] as const;
let lines: string[] = [];
let saved: ((...args: unknown[]) => void)[] = [];
beforeEach(() => {
  lines = [];
  saved = CONSOLE_METHODS.map((method) => console[method]);
  for (const method of CONSOLE_METHODS) {
    console[method] = (...args: unknown[]) => {
      lines.push(args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))).join(" "));
    };
  }
});
afterEach(() => {
  CONSOLE_METHODS.forEach((method, index) => (console[method] = saved[index]!));
});

/** The forms a key could take in a log: as given, its bytes in hex and in standard base64. */
function keyForms(key: string): string[] {
  const bytes = parseDeploymentKey(key)!;
  return [key, toHex(bytes), btoa(String.fromCharCode(...bytes))];
}

function expectNoKeyLogged(...keys: string[]): void {
  for (const line of lines) for (const key of keys) for (const form of keyForms(key)) expect(line.includes(form)).toBe(false);
}

const loggedEvents = () =>
  lines.flatMap((line) => {
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      return typeof parsed.event === "string" && parsed.event.startsWith("deployment_key") ? [parsed] : [];
    } catch {
      return [];
    }
  });

const storedRows = (name: string) =>
  runInDurableObject(stubFor(name), (_instance: Installation, state) => state.storage.sql.exec(`SELECT * FROM ${DEPLOYMENT_KEY_TABLE}`).toArray());

/** Encrypts one value through the guard and stores its fingerprint, as a first encrypted value does. */
async function storeFirstValue(name: string, key: string): Promise<string> {
  return runInDurableObject(stubFor(name), async (instance: Installation, state) => {
    const pending = await instance.keyGuard.encrypt(key, encoder.encode("a value"), "test:first");
    state.storage.transactionSync(() => pending.commit());
    return pending.value;
  });
}

/** Runs a guard action and answers the refusal code it raised, or "ok". */
async function outcome(action: () => Promise<unknown>): Promise<string> {
  try {
    await action();
    return "ok";
  } catch (error) {
    return (error as { code?: string }).code ?? String(error);
  }
}

describe("deployment key", () => {
  it("is given to this test run's Worker as a generated binding", () => {
    expect(parseDeploymentKey(env.DEPLOYMENT_KEY)).toHaveLength(32);
  });

  it("parses only 43 base64url characters that decode to 32 bytes; anything else is no key", () => {
    const key = newKey();
    expect(parseDeploymentKey(key)).toHaveLength(32);
    const thirtyOne = toBase64Url(crypto.getRandomValues(new Uint8Array(31)));
    // A last character whose spare bits are set decodes to the same 32 bytes, but is not the one spelling.
    const lastValue = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".indexOf(key.at(-1)!);
    const nonCanonical = key.slice(0, -1) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[lastValue | 1];
    for (const value of [key.slice(0, 42), key + "A", key.slice(0, 42) + "+", thirtyOne, nonCanonical, "", null, undefined, 42]) {
      expect(parseDeploymentKey(value), String(value)).toBeNull();
    }
  });

  it("derives a 64-hex fingerprint that differs between keys and is not the key", async () => {
    const [a, b] = [parseDeploymentKey(newKey())!, parseDeploymentKey(newKey())!];
    const fingerprint = await deploymentKeyFingerprint(a);
    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(await deploymentKeyFingerprint(a)).toBe(fingerprint);
    expect(await deploymentKeyFingerprint(b)).not.toBe(fingerprint);
    expect(fingerprint).not.toBe(toHex(a));
  });

  it("encrypts as v1.<IV>.<ciphertext> and decrypts only with the same key and associated data", async () => {
    const bytes = parseDeploymentKey(newKey())!;
    const key = await deriveEncryptionKey(bytes);
    const other = await deriveEncryptionKey(parseDeploymentKey(newKey())!);
    const plaintext = crypto.getRandomValues(new Uint8Array(20));
    const value = await encryptValue(key, plaintext, "two-step:u1");
    expect(value).toMatch(/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/);
    const [, iv, ciphertext] = value.split(".") as [string, string, string];
    expect(fromBase64UrlText(iv)).toHaveLength(12);
    expect(contains(fromBase64UrlText(ciphertext), plaintext)).toBe(false);
    expect(value).not.toContain(toHex(plaintext));
    expect(value).not.toContain(toBase64Url(plaintext));
    expect(await decryptValue(key, value, "two-step:u1")).toEqual(plaintext);
    // A fresh IV each time.
    expect(await encryptValue(key, plaintext, "two-step:u1")).not.toBe(value);

    expect(await decryptValue(key, value, "two-step:u2")).toBeNull();
    expect(await decryptValue(other, value, "two-step:u1")).toBeNull();
    expect(await decryptValue(key, value.replace(/^v1\./, "v2."), "two-step:u1")).toBeNull();
    expect(await decryptValue(key, `${value}.x`, "two-step:u1")).toBeNull();
    const flipped = ciphertext.slice(0, -2) + (ciphertext.at(-2) === "A" ? "B" : "A") + ciphertext.at(-1);
    expect(await decryptValue(key, `v1.${iv}.${flipped}`, "two-step:u1")).toBeNull();
  });
});

describe("deployment-key guard", () => {
  it("stores the fingerprint of the key with the first encrypted value", async () => {
    const name = "key-guard-first-value";
    const key = newKey();
    expect(await storedRows(name)).toEqual([]);
    const value = await storeFirstValue(name, key);
    const rows = await storedRows(name);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.fingerprint).toBe(await deploymentKeyFingerprint(parseDeploymentKey(key)!));
    const status = await runInDurableObject(stubFor(name), async (instance: Installation) => ({
      status: await instance.keyGuard.keyStatus(key),
      plaintext: await instance.keyGuard.decrypt(key, value, "test:first"),
    }));
    expect(status).toEqual({ status: "ready", plaintext: encoder.encode("a value") });
    expect(loggedEvents()).toEqual([]);
    expectNoKeyLogged(key);
  });

  it("refuses the second of two first encryptions under different keys", async () => {
    const name = "key-guard-interleaved";
    const [first, second] = [newKey(), newKey()];
    const result = await runInDurableObject(stubFor(name), async (instance: Installation, state) => {
      // Both find no fingerprint before their synchronous step.
      const a = await instance.keyGuard.encrypt(first, encoder.encode("one"), "test:a");
      const b = await instance.keyGuard.encrypt(second, encoder.encode("two"), "test:b");
      state.storage.transactionSync(() => a.commit());
      let refusal = "ok";
      try {
        state.storage.transactionSync(() => b.commit());
      } catch (error) {
        refusal = (error as { code?: string }).code ?? String(error);
      }
      return { refusal, stored: instance.keyGuard.storedFingerprint() };
    });
    expect(result).toEqual({ refusal: "deployment_key_mismatch", stored: await deploymentKeyFingerprint(parseDeploymentKey(first)!) });
    expect(await storedRows(name)).toHaveLength(1);
    expect(loggedEvents()).toEqual([{ event: "deployment_key_mismatch", object: "installation" }]);
    expectNoKeyLogged(first, second);
  });

  it("commits a second value under the stored key without changing the fingerprint", async () => {
    const name = "key-guard-second-value";
    const key = newKey();
    const first = await storeFirstValue(name, key);
    const before = await storedRows(name);
    const result = await runInDurableObject(stubFor(name), async (instance: Installation, state) => {
      const pending = await instance.keyGuard.encrypt(key, encoder.encode("second value"), "test:second");
      state.storage.transactionSync(() => pending.commit());
      return {
        first: await instance.keyGuard.decrypt(key, first, "test:first"),
        second: await instance.keyGuard.decrypt(key, pending.value, "test:second"),
      };
    });
    expect(result).toEqual({ first: encoder.encode("a value"), second: encoder.encode("second value") });
    const after = await storedRows(name);
    expect(after).toHaveLength(1);
    expect(after[0]!.fingerprint).toBe(before[0]!.fingerprint);
    expect(loggedEvents()).toEqual([]);
  });

  it("refuses every encrypt and decrypt given another key once a fingerprint is stored, and logs one line without key material", async () => {
    const name = "key-guard-other-key";
    const [original, other] = [newKey(), newKey()];
    const value = await storeFirstValue(name, original);
    const before = await storedRows(name);
    const result = await runInDurableObject(stubFor(name), async (instance: Installation) => ({
      status: await instance.keyGuard.keyStatus(other),
      encrypt: await outcome(() => instance.keyGuard.encrypt(other, encoder.encode("x"), "test:x")),
      decrypt: await outcome(() => instance.keyGuard.decrypt(other, value, "test:first")),
      again: await outcome(() => instance.keyGuard.decrypt(other, value, "test:first")),
    }));
    expect(result).toEqual<Record<string, KeyStatus | string>>({
      status: "mismatch",
      encrypt: "deployment_key_mismatch",
      decrypt: "deployment_key_mismatch",
      again: "deployment_key_mismatch",
    });
    expect(loggedEvents()).toEqual([{ event: "deployment_key_mismatch", object: "installation" }]);
    expect(await storedRows(name)).toEqual(before);
    expectNoKeyLogged(original, other);
  });

  it("refuses every encrypt and decrypt given no key once a fingerprint is stored, and logs one line", async () => {
    const name = "key-guard-no-key";
    const original = newKey();
    const value = await storeFirstValue(name, original);
    const result = await runInDurableObject(stubFor(name), async (instance: Installation) => ({
      statuses: [await instance.keyGuard.keyStatus(undefined), await instance.keyGuard.keyStatus(null), await instance.keyGuard.keyStatus("")],
      encrypt: await outcome(() => instance.keyGuard.encrypt(undefined, encoder.encode("x"), "test:x")),
      decrypt: await outcome(() => instance.keyGuard.decrypt(null, value, "test:first")),
    }));
    expect(result).toEqual({
      statuses: ["missing", "missing", "missing"],
      encrypt: "deployment_key_mismatch",
      decrypt: "deployment_key_mismatch",
    });
    expect(loggedEvents()).toEqual([{ event: "deployment_key_missing", object: "installation" }]);
    expectNoKeyLogged(original);
  });

  it("counts a malformed key as no key and says so in the log line", async () => {
    const name = "key-guard-malformed";
    const original = newKey();
    await storeFirstValue(name, original);
    const malformed = original.slice(0, 42);
    const status = await runInDurableObject(stubFor(name), (instance: Installation) => instance.keyGuard.keyStatus(malformed));
    expect(status).toBe("missing");
    expect(loggedEvents()).toEqual([{ event: "deployment_key_missing", object: "installation", reason: "malformed" }]);
    for (const line of lines) expect(line.includes(malformed)).toBe(false);
    expectNoKeyLogged(original);
  });

  it("logs once per object start", async () => {
    const name = "key-guard-log-once";
    const [original, other] = [newKey(), newKey()];
    await storeFirstValue(name, original);
    const statusTwice = () =>
      runInDurableObject(stubFor(name), async (instance: Installation) => [await instance.keyGuard.keyStatus(other), await instance.keyGuard.keyStatus(undefined)]);
    expect(await statusTwice()).toEqual(["mismatch", "missing"]);
    expect(await statusTwice()).toEqual(["mismatch", "missing"]);
    expect(loggedEvents()).toHaveLength(1);
    await evictDurableObject(stubFor(name));
    expect(await statusTwice()).toEqual(["mismatch", "missing"]);
    expect(loggedEvents()).toEqual([
      { event: "deployment_key_mismatch", object: "installation" },
      { event: "deployment_key_mismatch", object: "installation" },
    ]);
  });

  it("refuses to encrypt with no key and nothing stored, and stores nothing", async () => {
    const name = "key-guard-none";
    const result = await runInDurableObject(stubFor(name), async (instance: Installation) => ({
      status: await instance.keyGuard.keyStatus(undefined),
      malformed: await instance.keyGuard.keyStatus("not-a-key"),
      encrypt: await outcome(() => instance.keyGuard.encrypt(undefined, encoder.encode("x"), "test:x")),
      encryptMalformed: await outcome(() => instance.keyGuard.encrypt("", encoder.encode("x"), "test:x")),
    }));
    expect(result).toEqual({ status: "none", malformed: "none", encrypt: "deployment_key_missing", encryptMalformed: "deployment_key_missing" });
    expect(await storedRows(name)).toEqual([]);
    expect(loggedEvents()).toEqual([]);
  });
});

describe("deployment-key state read", () => {
  it("answers each key state, never the fingerprint, and changes nothing", async () => {
    const name = "key-state-read";
    const [original, other] = [newKey(), newKey()];
    const read = async (deploymentKey?: string) => {
      const before = await storedRows(name);
      const result = await callObject<DeploymentKeyState>(
        env.INSTALLATION,
        env.INSTALLATION.idFromName(name),
        "deploymentKeyState",
        deploymentKey === undefined ? {} : { deploymentKey },
        { idempotent: true },
      );
      expect(await storedRows(name)).toEqual(before);
      if (!result.ok) throw new Error(result.body.error.code);
      return result.value;
    };

    expect(await read()).toEqual({ fingerprint: "none", key: "none" });
    expect(await read(original)).toEqual({ fingerprint: "none", key: "present" });
    expect(await storedRows(name)).toEqual([]);
    await storeFirstValue(name, original);
    const matches = await read(original);
    expect(matches).toEqual({ fingerprint: "stored", key: "matches" });
    expect(await read(other)).toEqual({ fingerprint: "stored", key: "mismatch" });
    expect(await read()).toEqual({ fingerprint: "stored", key: "none" });
    expect(await read("")).toEqual({ fingerprint: "stored", key: "none" });

    const fingerprint = String((await storedRows(name))[0]!.fingerprint);
    expect(JSON.stringify(matches)).not.toContain(fingerprint);
    expectNoKeyLogged(original, other);

    // Anything that does not parse counts as no key, never as invalid input.
    const stateOf = async (deploymentKey: unknown) => {
      const result = await callObject<DeploymentKeyState>(env.INSTALLATION, env.INSTALLATION.idFromName(name), "deploymentKeyState", { deploymentKey });
      if (!result.ok) throw new Error(result.body.error.code);
      return result.value;
    };
    for (const value of [null, original + "A", original + "A".repeat(21), original + "A".repeat(22), "x".repeat(500)]) {
      expect(await stateOf(value), String(value).length.toString()).toEqual({ fingerprint: "stored", key: "none" });
    }
  });
});
