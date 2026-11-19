// R14 experiment worker: a SQLite-backed Durable Object that can fill itself and report a digest.
import { DurableObject } from "cloudflare:workers";
const json = (v, status = 200) =>
  new Response(JSON.stringify(v) + "\n", { status, headers: { "content-type": "application/json" } });
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export class Project extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, tag TEXT NOT NULL, body TEXT NOT NULL, n REAL, blob BLOB)");
    this.sql.exec("CREATE INDEX IF NOT EXISTS items_tag ON items (tag)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, kind TEXT, at INTEGER)");
  }
  async fetch(req) {
    const url = new URL(req.url), q = url.searchParams;
    switch (url.pathname.split("/")[3]) {
      case "fill": {
        const tag = q.get("tag"), count = Number(q.get("count") ?? 1000);
        this.ctx.storage.transactionSync(() => {
          for (let i = 0; i < count; i++) {
            const blob = new Uint8Array(64).map((_, j) => (i * 31 + j * 7) & 255);
            this.sql.exec("INSERT INTO items (tag, body, n, blob) VALUES (?, ?, ?, ?)",
              tag, `row ${i} of ${tag} — ünïcödé ✓ ${"x".repeat(i % 200)}`, i / 7, blob);
          }
        });
        await this.ctx.storage.put("kv:" + tag, { tag, count, at: 1 });   // key-value API beside SQL
        return json({ ok: true, tag, count });
      }
      case "digest": {
        // Order-stable digest of every row, plus counts per tag and the key-value entries.
        let text = "";
        for (const r of this.sql.exec("SELECT id, tag, body, n, hex(blob) AS b FROM items ORDER BY id"))
          text += `${r.id}|${r.tag}|${r.body}|${r.n}|${r.b}\n`;
        const kv = [...(await this.ctx.storage.list({ prefix: "kv:" })).entries()];
        return json({
          rows: this.sql.exec("SELECT count(*) AS n FROM items").one().n,
          byTag: this.sql.exec("SELECT tag, count(*) AS n FROM items GROUP BY tag ORDER BY tag").toArray(),
          sha256: hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text + JSON.stringify(kv)))),
          kvKeys: kv.map(([k]) => k),
          integrity: this.sql.exec("PRAGMA quick_check").toArray(),
          pendingAlarm: await this.ctx.storage.getAlarm(),
          events: this.sql.exec("SELECT kind FROM events ORDER BY id").toArray().map((r) => r.kind),
          dbSize: this.sql.databaseSize,
        });
      }
      case "alarm":
        await this.ctx.storage.setAlarm(Number(q.get("at")));
        return json({ alarmSetFor: await this.ctx.storage.getAlarm() });
    }
    return json({ error: "unknown" }, 404);
  }
  alarm() { this.sql.exec("INSERT INTO events (kind, at) VALUES ('alarm', ?)", Date.now()); }
}

export default {
  async fetch(req, env) {
    const parts = new URL(req.url).pathname.split("/");
    if (parts[1] === "o") return env.PROJECT.get(env.PROJECT.idFromName(parts[2])).fetch(req);
    return json({ error: "not found" }, 404);
  },
};
