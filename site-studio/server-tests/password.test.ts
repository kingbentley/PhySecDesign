import { scrypt, scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  fromBase64,
  hashPassword,
  SCRYPT_KEY_LENGTH,
  SCRYPT_MAXMEM,
  SCRYPT_N,
  SCRYPT_P,
  SCRYPT_R,
  SCRYPT_SALT_BYTES,
  toBase64,
  verifyPassword,
} from "../server/auth/password";
import { setupCodeFingerprint, setupCodesMatch } from "../server/auth/setupCode";

// Password hashing (CAP-6, K19) and the set-up code helpers, in Cloudflare's runtime with
// `nodejs_compat`.

describe("password hashing", () => {
  it("uses salted scrypt N = 131,072, r = 8, p = 1 with a 32-byte result and carries its parameters", async () => {
    const password = "correct horse battery";
    const stored = await hashPassword(password);
    expect(stored).toMatchObject({ algorithm: "scrypt", n: 131_072, r: 8, p: 1, keyLength: 32 });
    expect([SCRYPT_N, SCRYPT_R, SCRYPT_P, SCRYPT_KEY_LENGTH]).toEqual([131_072, 8, 1, 32]);
    expect(fromBase64(stored.hash)).toHaveLength(32);
    expect(fromBase64(stored.salt)).toHaveLength(SCRYPT_SALT_BYTES);
    expect(JSON.stringify(stored)).not.toContain(password);

    // The same result as an independent scrypt call with the stored salt and parameters.
    const independent = scryptSync(new TextEncoder().encode(password), fromBase64(stored.salt), 32, {
      N: 131_072,
      r: 8,
      p: 1,
      maxmem: SCRYPT_MAXMEM,
    });
    expect(toBase64(new Uint8Array(independent))).toBe(stored.hash);
  });

  it("salts every hash, and verifies only the right password", async () => {
    const first = await hashPassword("same password here");
    const second = await hashPassword("same password here");
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    expect(await verifyPassword("same password here", first)).toBe(true);
    expect(await verifyPassword("same password herE", first)).toBe(false);
    expect(await verifyPassword("same password here", { ...first, algorithm: "other" as "scrypt" })).toBe(false);
  });

  it("verifies with the parameters stored beside the hash, so they can be strengthened later", async () => {
    const salt = new Uint8Array(16).fill(7);
    const weaker = scryptSync(new TextEncoder().encode("older password"), salt, 32, { N: 1024, r: 8, p: 1 });
    const stored = { algorithm: "scrypt" as const, n: 1024, r: 8, p: 1, keyLength: 32, salt: toBase64(salt), hash: toBase64(new Uint8Array(weaker)) };
    expect(await verifyPassword("older password", stored)).toBe(true);
    expect(await verifyPassword("other password", stored)).toBe(false);
  });

  it("matches RFC 7914's known-answer vector, through the code's derive path and through node:crypto.scrypt", async () => {
    // RFC 7914 section 12: P = "pleaseletmein", S = "SodiumChloride", N = 16384, r = 8, p = 1, dkLen = 64.
    const expectedHex =
      "7023bdcb3afd7348461c06cd81fd38ebfda8fbba904f8e3ea9b543f6545da1f2" +
      "d5432955613f0fcf62d49705242a9af9e61e85dc0d651e40dfcf017b45575887";
    const expected = new Uint8Array(expectedHex.match(/../g)!.map((pair) => parseInt(pair, 16)));
    const salt = new TextEncoder().encode("SodiumChloride");
    const stored = { algorithm: "scrypt" as const, n: 16_384, r: 8, p: 1, keyLength: 64, salt: toBase64(salt), hash: toBase64(expected) };
    expect(await verifyPassword("pleaseletmein", stored)).toBe(true);
    expect(await verifyPassword("pleaseletmeim", stored)).toBe(false);

    // The same call the code makes: async scrypt over UTF-8 bytes with maxmem raised.
    const key = await new Promise<Uint8Array>((resolve, reject) =>
      scrypt(new TextEncoder().encode("pleaseletmein"), salt, 64, { N: 16_384, r: 8, p: 1, maxmem: SCRYPT_MAXMEM }, (error, derived) =>
        error ? reject(error) : resolve(new Uint8Array(derived)),
      ),
    );
    expect([...key].map((byte) => byte.toString(16).padStart(2, "0")).join("")).toBe(expectedHex);
  });

  it("round-trips base64", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255, 128]);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
  });
});

describe("set-up code helpers", () => {
  it("fingerprints a code as 64 hex digits of SHA-256, never the code itself", async () => {
    const fingerprint = await setupCodeFingerprint("abc");
    expect(fingerprint).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await setupCodeFingerprint("abd")).not.toBe(fingerprint);
  });

  it("matches only the configured code, and never an empty configured code", async () => {
    expect(await setupCodesMatch("k7Qm-2xVb-9TsR-4nLp-Wz", "k7Qm-2xVb-9TsR-4nLp-Wz")).toBe(true);
    expect(await setupCodesMatch("k7Qm-2xVb-9TsR-4nLp-Wy", "k7Qm-2xVb-9TsR-4nLp-Wz")).toBe(false);
    expect(await setupCodesMatch("k7Qm", "k7Qm-2xVb-9TsR-4nLp-Wz")).toBe(false);
    expect(await setupCodesMatch("", "")).toBe(false);
  });
});
