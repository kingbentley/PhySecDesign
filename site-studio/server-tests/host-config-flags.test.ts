import { describe, expect, it } from "vitest";
import wranglerText from "../deploy/cloudflare/wrangler.jsonc?raw";
import selfhostText from "../deploy/selfhost/config.capnp?raw";

// Both hosts enable the same compatibility flags, including `nodejs_compat`, which scrypt
// password hashing needs (K19, AD-12). Same behaviour on both hosts (AD-16).

function uncommented(text: string, marker: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith(marker))
    .join("\n");
}

describe("compatibility flags", () => {
  it("enable nodejs_compat and enable_request_signal, and only the same flags, on Cloudflare and self-hosted", () => {
    const cloudflare = (JSON.parse(uncommented(wranglerText, "//")) as { compatibility_flags?: string[] }).compatibility_flags;
    const selfhostList = uncommented(selfhostText, "#").match(/compatibilityFlags = \[([^\]]*)\]/)?.[1];
    const selfhost = selfhostList === undefined ? undefined : [...selfhostList.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    expect(cloudflare).toContain("nodejs_compat");
    // A client that disconnects leaves the hash queue (D-5 amended): the default only from 2026-11-17.
    expect(cloudflare).toContain("enable_request_signal");
    expect(selfhost).toEqual(cloudflare);
  });

  it("gives the running server Node-compatible scrypt", async () => {
    const { scryptSync } = await import("node:crypto");
    expect(typeof scryptSync).toBe("function");
  });
});
