import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('ProjectRoom in the Workers runtime', () => {
  it('saves, rejects a stale save, and keeps projects separate', async () => {
    const a = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName('a'));
    const b = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName('b'));
    expect(await a.save('cam-1', 0, { bearing: 90 })).toEqual({ ok: true, version: 1 });
    expect(await a.save('cam-1', 0, { bearing: 120 })).toEqual({ ok: false, conflict: true, version: 1 });
    expect(await a.read('cam-1')).toEqual({ version: 1, data: { bearing: 90 } });
    expect(await b.read('cam-1')).toBeNull();
  });
});
