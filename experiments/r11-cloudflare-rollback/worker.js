// R11 probe: what happens to running code and stored data when a new version is deployed, and on rollback.
// The same file is deployed several times with a different VERSION value, so every row records which
// version of the Worker made the call and which version of the Durable Object wrote it.
import { DurableObject } from "cloudflare:workers";

const ISOLATE = Math.random().toString(36).slice(2, 8);   // new for every fresh copy of the Worker code

export class Probe extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.instance = Math.random().toString(36).slice(2, 8); // new each time the object is started
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS rows (id INTEGER PRIMARY KEY, at INTEGER, source TEXT, caller TEXT, object TEXT, instance TEXT)");
  }
  write(source, caller) {
    this.ctx.storage.sql.exec("INSERT INTO rows (at, source, caller, object, instance) VALUES (?, ?, ?, ?, ?)",
      Date.now(), source, caller, this.env.VERSION, this.instance);
  }
  async fetch(req) {
    const url = new URL(req.url), q = url.searchParams, op = url.pathname.split("/")[3];
    const caller = q.get("caller") ?? "?";
    if (op === "write") { this.write("request", caller); return Response.json({ object: this.env.VERSION, instance: this.instance }); }
    if (op === "alarms") {   // write a row every `every` ms from alarms, until `until`
      await this.ctx.storage.put("alarm", { every: Number(q.get("every") ?? 1000), until: Date.now() + Number(q.get("seconds") ?? 60) * 1000 });
      await this.ctx.storage.setAlarm(Date.now() + 100);
      return Response.json({ started: true });
    }
    if (op === "slow") {     // one long request that keeps writing while it is held open
      const until = Date.now() + Number(q.get("seconds") ?? 60) * 1000; let n = 0;
      while (Date.now() < until) { this.write("long request", caller); n++; await scheduler.wait(Number(q.get("every") ?? 500)); }
      return Response.json({ finished: true, wrote: n, object: this.env.VERSION, instance: this.instance });
    }
    if (op === "abort") {    // ask the runtime to stop this copy of the object; the next call starts a fresh one
      this.write("abort requested", caller);
      this.ctx.abort("restart requested by the probe");
    }
    if (op === "rows") return Response.json(this.ctx.storage.sql.exec("SELECT at, source, caller, object, instance FROM rows ORDER BY id").toArray());
    if (op === "clear") { this.ctx.storage.sql.exec("DELETE FROM rows"); await this.ctx.storage.deleteAlarm(); return Response.json({ cleared: true }); }
    return Response.json({ error: "unknown" }, { status: 404 });
  }
  async alarm() {
    const a = await this.ctx.storage.get("alarm");
    this.write("alarm", "-");
    if (a && Date.now() < a.until) await this.ctx.storage.setAlarm(Date.now() + a.every);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), parts = url.pathname.split("/");
    if (parts[1] === "o") {
      url.searchParams.set("caller", env.VERSION);
      return env.PROBE.get(env.PROBE.idFromName(parts[2])).fetch(new Request(url, req));
    }
    return Response.json({ worker: env.VERSION, isolate: ISOLATE, at: Date.now() });
  },
};
