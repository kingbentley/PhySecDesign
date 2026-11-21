import { describe, expect, it } from "vitest";
import { importHmacKey, makeMarker, markerCookieLine, markerCookieName, readMarker } from "../server/auth/marker";
import {
  clearSessionCookieLine,
  COOKIE_PREFIX,
  fromBase64Url,
  isWellFormedToken,
  MAX_PASSED_COOKIES,
  newSessionToken,
  prefixedCookies,
  sessionCookieLine,
  sessionCookieName,
  sessionTokenHash,
  toBase64Url,
} from "../server/auth/session";
import { MARKER_MAX_AGE_MS } from "../shared/signin";

// Session tokens, their hash and the cookie lines (D-1, D-4, E-15), and the marker (D-3, A-5,
// D-2 amended, V-1).

const ID = "0123456789abcdef0123456789abcdef";
const ACCOUNT = "6f1c2d3e-4a5b-4c6d-8e7f-0123456789ab";
const MARKER_ID = "fedcba9876543210fedcba9876543210";
const T0 = Date.UTC(2026, 10, 20, 12, 0, 0);

function key(fill: number) {
  return importHmacKey(new Uint8Array(32).fill(fill));
}

describe("session tokens", () => {
  it("are at least 32 random bytes, base64url, and differ each time", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => newSessionToken()));
    expect(tokens.size).toBe(50);
    for (const token of tokens) {
      expect(isWellFormedToken(token)).toBe(true);
      expect(fromBase64Url(token).byteLength).toBeGreaterThanOrEqual(32);
    }
  });

  it("are stored as SHA-256, 64 hex digits, never the token", async () => {
    const token = newSessionToken();
    const hash = await sessionTokenHash(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(await sessionTokenHash(token)).toBe(hash);
    // SHA-256 of "abc", as a known answer.
    expect(await sessionTokenHash("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("are recognised only in their own shape", () => {
    for (const bad of ["", "short", "a".repeat(42), "a".repeat(44), "+".repeat(43), `${"a".repeat(42)}=`]) {
      expect(isWellFormedToken(bad), bad).toBe(false);
    }
  });

  it("round-trip base64url", () => {
    const bytes = new Uint8Array([0, 251, 255, 62, 63, 1, 2]);
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
    expect(toBase64Url(bytes)).not.toMatch(/[+/=]/);
  });
});

describe("the session cookie", () => {
  it("is __Host- named with the identifier, HttpOnly, Secure, SameSite=Lax, Path=/, 30 days, with no Domain", () => {
    const token = newSessionToken();
    const line = sessionCookieLine(ID, token);
    expect(sessionCookieName(ID)).toBe(`__Host-ssd-${ID}`);
    expect(line).toBe(`__Host-ssd-${ID}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`);
    expect(line).not.toMatch(/domain/i);
  });

  it("is cleared with the full attributes", () => {
    expect(clearSessionCookieLine(ID)).toBe(`__Host-ssd-${ID}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`);
  });

  it("is found among a request's cookies by its prefix and an identifier; others and overlong values are dropped", () => {
    const other = "1".repeat(32);
    const header = `theme=dark; __Host-ssd-${ID}=tok; __Host-ssd-m-${ID}=mark; __Host-ssd-${other}=other; __Host-ssd-${"2".repeat(32)}=${"v".repeat(600)}`;
    expect(prefixedCookies(header)).toEqual({
      [`__Host-ssd-${ID}`]: "tok",
      [`__Host-ssd-m-${ID}`]: "mark",
      [`__Host-ssd-${other}`]: "other",
    });
    expect(prefixedCookies(null)).toEqual({});
    // A repeated name keeps its first value.
    expect(prefixedCookies(`__Host-ssd-${ID}=1; __Host-ssd-${ID}=2`)).toEqual({ [`__Host-ssd-${ID}`]: "1" });
  });

  it("drops a prefixed name that is long or malformed", () => {
    const bad = [
      `__Host-ssd-${ID}${"0".repeat(200)}`,
      `__Host-ssd-${"0".repeat(31)}`,
      `__Host-ssd-${ID.toUpperCase()}`,
      `__Host-ssd-x-${ID}`,
      `__Host-ssd-m-m-${ID}`,
      `${COOKIE_PREFIX}a`,
      COOKIE_PREFIX,
    ];
    expect(prefixedCookies(bad.map((name) => `${name}=v`).join("; "))).toEqual({});
  });

  it("keeps the last 64, so stale cookies sent before the live ones cannot push them out", () => {
    expect(MAX_PASSED_COOKIES).toBe(64);
    const stale = Array.from({ length: 80 }, (_, index) => `${COOKIE_PREFIX}${index.toString(16).padStart(32, "0")}=stale`);
    const passed = prefixedCookies([...stale, `__Host-ssd-${ID}=live`, `__Host-ssd-m-${ID}=mark`].join("; "));
    expect(Object.keys(passed)).toHaveLength(MAX_PASSED_COOKIES);
    expect(passed[`__Host-ssd-${ID}`]).toBe("live");
    expect(passed[`__Host-ssd-m-${ID}`]).toBe("mark");
  });
});

describe("the marker", () => {
  it("is __Host-ssd-m-<identifier>, HttpOnly, Secure, SameSite=Lax, Path=/, 1 year, with no Domain", () => {
    expect(markerCookieName(ID)).toBe(`__Host-ssd-m-${ID}`);
    const line = markerCookieLine(ID, "value");
    expect(line).toBe(`__Host-ssd-m-${ID}=value; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`);
    expect(line).not.toMatch(/domain/i);
  });

  it("holds the account, a marker identifier and an expiry 1 year on, signed with HMAC-SHA-256", async () => {
    const signing = await key(1);
    const value = await makeMarker(signing, ACCOUNT, MARKER_ID, T0);
    expect(value).toMatch(/^v1\.[0-9a-f-]{36}\.[0-9a-f]{32}\.\d+\.[A-Za-z0-9_-]{43}$/);
    expect(await readMarker(signing, value, T0 + 1000)).toEqual({ accountId: ACCOUNT, markerId: MARKER_ID, expiresAt: T0 + MARKER_MAX_AGE_MS });
    // Renewed at a later sign-in: a later expiry.
    const later = await makeMarker(signing, ACCOUNT, MARKER_ID, T0 + 5000);
    expect((await readMarker(signing, later, T0 + 6000))!.expiresAt).toBeGreaterThan(T0 + MARKER_MAX_AGE_MS);
  });

  it("counts as no marker when expired, badly signed, signed with another key or malformed", async () => {
    const signing = await key(1);
    const value = await makeMarker(signing, ACCOUNT, MARKER_ID, T0);
    expect(await readMarker(signing, value, T0 + MARKER_MAX_AGE_MS - 1)).not.toBeNull();
    expect(await readMarker(signing, value, T0 + MARKER_MAX_AGE_MS)).toBeNull();
    expect(await readMarker(await key(2), value, T0)).toBeNull();

    const parts = value.split(".");
    const otherAccount = [parts[0], "00000000-0000-4000-8000-000000000000", ...parts.slice(2)].join(".");
    const longerExpiry = [...parts.slice(0, 3), String(Number(parts[3]) + 1), parts[4]].join(".");
    // The signature's first character: all six of its bits are significant.
    const at = value.lastIndexOf(".") + 1;
    const tampered = value.slice(0, at) + (value[at] === "A" ? "B" : "A") + value.slice(at + 1);
    for (const bad of [otherAccount, longerExpiry, tampered,"", "v1", "v2." + value.slice(3), value + ".x", "garbage"]) {
      expect(await readMarker(signing, bad, T0), bad).toBeNull();
    }
  });
});
