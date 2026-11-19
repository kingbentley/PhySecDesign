// R8 experiment worker: SQLite-backed Durable Object + disk service + WebCrypto probes.
import { DurableObject } from "cloudflare:workers";

const json = (v, status = 200) =>
  new Response(JSON.stringify(v) + "\n", { status, headers: { "content-type": "application/json" } });

export class Project extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, kind TEXT, at INTEGER)");
  }

  async fetch(req) {
    const url = new URL(req.url);
    const q = url.searchParams;
    switch (url.pathname.split("/")[3]) {
      case "put":
        this.sql.exec("INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)", q.get("k"), q.get("v"));
        return json({ ok: true, k: q.get("k") });
      case "get":
        return json(this.sql.exec("SELECT k, v FROM kv WHERE k = ?", q.get("k")).toArray());
      case "count":
        return json(this.sql.exec("SELECT count(*) AS n FROM kv").one());
      case "keys":
        return json(this.sql.exec("SELECT k FROM kv ORDER BY k").toArray().map((r) => r.k));
      case "tx":
        try {
          this.ctx.storage.transactionSync(() => {
            this.sql.exec("INSERT INTO kv (k, v) VALUES ('tx-a', '1')");
            this.sql.exec("INSERT INTO kv (k, v) VALUES ('tx-b', '2')");
            if (q.get("fail")) throw new Error("boom midway");
            this.sql.exec("INSERT INTO kv (k, v) VALUES ('tx-c', '3')");
          });
          return json({ committed: true });
        } catch (e) {
          return json({ committed: false, error: String(e) });
        }
      case "alarm":
        await this.ctx.storage.setAlarm(Date.now() + Number(q.get("ms") ?? 2000));
        return json({ alarmSetFor: await this.ctx.storage.getAlarm(), now: Date.now() });
      case "events":
        return json({
          now: Date.now(),
          pendingAlarm: await this.ctx.storage.getAlarm(),
          events: this.sql.exec("SELECT kind, at FROM events ORDER BY id").toArray(),
          dbSize: this.sql.databaseSize,
        });
      case "event":
        this.sql.exec("INSERT INTO events (kind, at) VALUES (?, ?)", q.get("kind"), Date.now());
        return json({ ok: true });
    }
    return json({ error: "unknown" }, 404);
  }

  alarm() {
    this.sql.exec("INSERT INTO events (kind, at) VALUES ('alarm', ?)", Date.now());
  }
}

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    if (parts[1] === "o") {
      // /o/<object name>/<op>
      return env.PROJECT.get(env.PROJECT.idFromName(parts[2])).fetch(req);
    }
    if (parts[1] === "id") return json({ name: parts[2], id: env.PROJECT.idFromName(parts[2]).toString() });
    if (parts[1] === "files") {
      // Pass-through to the writable disk service (PUT / GET / HEAD / DELETE, Range forwarded).
      const headers = new Headers();
      if (req.headers.get("range")) headers.set("range", req.headers.get("range"));
      return env.FILES.fetch("http://disk/" + parts.slice(2).join("/"), {
        method: req.method,
        headers,
        body: req.body,
      });
    }
    if (parts[1] === "crypto") {
      const enc = new TextEncoder();
      const sha = hex(await crypto.subtle.digest("SHA-256", enc.encode("abc")));
      const key = await crypto.subtle.importKey("raw", enc.encode("password"), "PBKDF2", false, ["deriveBits"]);
      const iterations = Number(url.searchParams.get("iter") ?? 600000);
      const t0 = performance.now(), d0 = Date.now();
      let bits, error;
      try {
        bits = await crypto.subtle.deriveBits(
          { name: "PBKDF2", hash: "SHA-256", salt: enc.encode("salt"), iterations }, key, 256);
      } catch (e) { error = String(e); }
      return json({
        sha256_abc: sha, iterations, pbkdf2: bits && hex(bits), error,
        insideMs: { performanceNow: performance.now() - t0, dateNow: Date.now() - d0 },
      });
    }
    return json({ error: "not found" }, 404);
  },

  async scheduled(event, env) {
    const stub = env.PROJECT.get(env.PROJECT.idFromName("cron"));
    await stub.fetch("http://do/o/cron/event?kind=scheduled:" + encodeURIComponent(event.cron ?? ""));
  },
};
