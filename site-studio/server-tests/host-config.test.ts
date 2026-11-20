import { describe, expect, it } from "vitest";
import wranglerText from "../deploy/cloudflare/wrangler.jsonc?raw";
import selfhostText from "../deploy/selfhost/config.capnp?raw";

// Allowed platform features only (AD-16): Durable Objects with SQLite, their alarms and
// web-standard APIs. Neither host configuration may declare D1, Workflows, Queues, scheduled
// triggers or KV.

function parseJsonc(text: string): Record<string, unknown> {
  // Only whole-line comments are used in the file; string values may contain "/*".
  const withoutComments = text
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  return JSON.parse(withoutComments) as Record<string, unknown>;
}

describe("host configurations", () => {
  it("Cloudflare: declares only the two SQLite object classes and no banned binding", () => {
    const config = parseJsonc(wranglerText);
    for (const banned of ["d1_databases", "workflows", "queues", "triggers", "kv_namespaces"]) {
      expect(config, banned).not.toHaveProperty(banned);
    }
    expect(wranglerText).not.toMatch(/"crons"/);
    expect(config.workers_dev).toBe(true);
    const objects = config.durable_objects as { bindings: { name: string; class_name: string }[] };
    expect(objects.bindings).toEqual([
      { name: "PROJECT_ROOM", class_name: "ProjectRoom" },
      { name: "INSTALLATION", class_name: "Installation" },
    ]);
    expect(config.migrations).toEqual([{ tag: "v1", new_sqlite_classes: ["ProjectRoom", "Installation"] }]);
  });

  it("self-hosted: declares only the two SQLite object classes and no banned binding", () => {
    const code = selfhostText
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");
    for (const banned of [/kvNamespace/i, /queue/i, /\bd1\b/i, /workflow/i, /cron/i, /\/workerd\/[a-z0-9]+\.js/i]) {
      expect(code).not.toMatch(banned);
    }
    const classes = [...code.matchAll(/className = "([A-Za-z]+)", uniqueKey = "[^"]+", enableSql = true/g)].map(
      (match) => match[1],
    );
    expect(classes).toEqual(["ProjectRoom", "Installation"]);
    expect(code.match(/className = /g)).toHaveLength(2);
    expect(code).toMatch(/durableObjectStorage = \(localDisk = "do-storage"\)/);
    expect(code).toMatch(/embed "\.\.\/\.\.\/dist\/worker\/index\.js"/);
  });

  it("uses the same compatibility date on both hosts", () => {
    const cloudflareDate = parseJsonc(wranglerText).compatibility_date;
    const selfhostDate = selfhostText.match(/compatibilityDate = "([0-9-]+)"/)?.[1];
    expect(typeof cloudflareDate).toBe("string");
    expect(selfhostDate).toBe(cloudflareDate);
  });
});
