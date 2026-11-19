import { DurableObject } from 'cloudflare:workers';

// One SQLite-backed Durable Object per project: the shape the architecture plans (AD-2).
export class ProjectRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS item (id TEXT PRIMARY KEY, version INTEGER NOT NULL, data TEXT NOT NULL)');
  }
  save(id, baseVersion, data) {
    return this.ctx.storage.transactionSync(() => {
      const row = this.ctx.storage.sql.exec('SELECT version FROM item WHERE id = ?', id).toArray()[0];
      const current = row ? row.version : 0;
      if (current !== baseVersion) return { ok: false, conflict: true, version: current };
      this.ctx.storage.sql.exec('INSERT INTO item (id, version, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET version = excluded.version, data = excluded.data', id, current + 1, JSON.stringify(data));
      return { ok: true, version: current + 1 };
    });
  }
  read(id) {
    const row = this.ctx.storage.sql.exec('SELECT version, data FROM item WHERE id = ?', id).toArray()[0];
    return row ? { version: row.version, data: JSON.parse(row.data) } : null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/ping') {
      const room = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName(url.searchParams.get('project') ?? 'demo'));
      const before = await room.read('counter');
      const saved = await room.save('counter', before?.version ?? 0, { hits: (before?.data.hits ?? 0) + 1 });
      return Response.json({ saved, now: await room.read('counter') });
    }
    return env.ASSETS.fetch(request);
  },
};
