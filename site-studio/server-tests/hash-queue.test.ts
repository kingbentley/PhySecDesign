import { describe, expect, it } from "vitest";
import {
  fromBase64,
  HASH_QUEUE_MAX_WAITING,
  HashQueue,
  HashQueueBusy,
  hashPassword,
  hashQueue,
  hashQueueStats,
  SCRYPT_KEY_LENGTH,
  SCRYPT_N,
  SCRYPT_P,
  SCRYPT_R,
  SCRYPT_SALT_BYTES,
  standInPasswordHash,
  verifyPassword,
} from "../server/auth/password";

// The one-at-a-time hash queue (D-5 as amended, A-12, V-7, E-9) and the stand-in hash (CAP-6,
// A-1, E-4).

/** A task that runs until released, recording when it started. */
function gate() {
  let release!: () => void;
  const done = new Promise<void>((resolve) => (release = resolve));
  return { done, release };
}

describe("the hash queue", () => {
  it("runs two verifies and a set-up hash one at a time; the set-up hash waits its turn", async () => {
    const stored = await hashPassword("correct horse battery");
    hashQueue.resetPeak();
    const order: string[] = [];
    const [first, second, setupHash] = await Promise.all([
      verifyPassword("correct horse battery", stored).then((ok) => (order.push("verify 1"), ok)),
      verifyPassword("wrong horse battery", stored).then((ok) => (order.push("verify 2"), ok)),
      hashPassword("a new set-up password").then((hash) => (order.push("set-up hash"), hash)),
    ]);
    expect([first, second]).toEqual([true, false]);
    expect(setupHash.n).toBe(SCRYPT_N);
    expect(hashQueueStats()).toEqual({ active: 0, waiting: 0, peakActive: 1 });
    expect(order).toEqual(["verify 1", "verify 2", "set-up hash"]);
  });

  it("lets 20 wait behind the running hash and refuses the next as busy, the same for every request", async () => {
    const queue = new HashQueue();
    const running = gate();
    const tasks = [queue.run(() => running.done)];
    for (let index = 0; index < HASH_QUEUE_MAX_WAITING; index += 1) tasks.push(queue.run(async () => undefined));
    expect(queue.stats()).toEqual({ active: 1, waiting: 20, peakActive: 1 });
    expect(queue.hasRoom()).toBe(false);
    const refused = await queue.run(async () => "ran").catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(HashQueueBusy);
    expect((refused as Error).message).toBe("hash_queue_busy");
    running.release();
    await Promise.all(tasks);
    expect(queue.stats()).toEqual({ active: 0, waiting: 0, peakActive: 1 });
    expect(queue.hasRoom()).toBe(true);
  });

  it("the isolate's queue refuses a 21st waiting request too", async () => {
    const running = gate();
    const tasks = [hashQueue.run(() => running.done)];
    for (let index = 0; index < HASH_QUEUE_MAX_WAITING; index += 1) tasks.push(hashQueue.run(async () => undefined));
    await expect(verifyPassword("anything at all", standInPasswordHash())).rejects.toBeInstanceOf(HashQueueBusy);
    running.release();
    await Promise.all(tasks);
  });

  it("releases a waiting request's slot when its caller goes away, and runs the next", async () => {
    const queue = new HashQueue(2);
    const running = gate();
    const first = queue.run(() => running.done);
    const controller = new AbortController();
    const cancelled = queue.run(async () => "should not run", controller.signal).catch((error: unknown) => error);
    const ran: string[] = [];
    const next = queue.run(async () => void ran.push("next"));
    expect(queue.stats().waiting).toBe(2);
    expect(queue.hasRoom()).toBe(false);

    controller.abort(new Error("caller went away"));
    expect(((await cancelled) as Error).message).toBe("caller went away");
    expect(queue.stats().waiting).toBe(1);
    expect(queue.hasRoom()).toBe(true);

    running.release();
    await Promise.all([first, next]);
    expect(ran).toEqual(["next"]);
    expect(queue.stats()).toEqual({ active: 0, waiting: 0, peakActive: 1 });
  });

  it("releases the slot when a hash fails", async () => {
    const queue = new HashQueue();
    await expect(queue.run(async () => Promise.reject(new Error("scrypt failed")))).rejects.toThrow("scrypt failed");
    expect(await queue.run(async () => "after")).toBe("after");
    expect(queue.stats()).toEqual({ active: 0, waiting: 0, peakActive: 1 });
  });

  it("does not let a request arriving as the slot passes on run beside the next waiter", async () => {
    const queue = new HashQueue();
    const running = gate();
    let concurrent = 0;
    let most = 0;
    const tracked = async () => {
      concurrent += 1;
      most = Math.max(most, concurrent);
      await Promise.resolve();
      concurrent -= 1;
    };
    const first = queue.run(async () => {
      await running.done;
    });
    const waiting = queue.run(tracked);
    running.release();
    await first;
    // Arrives after the first finished but before the waiter resumed.
    const late = queue.run(tracked);
    await Promise.all([waiting, late]);
    expect(most).toBe(1);
    expect(queue.stats().peakActive).toBe(1);
  });
});

describe("the stand-in hash", () => {
  it("is a random 16-byte salt and a random 32-byte value with the current parameters, kept for the isolate", () => {
    const standIn = standInPasswordHash();
    expect(standIn).toMatchObject({ algorithm: "scrypt", n: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, keyLength: SCRYPT_KEY_LENGTH });
    expect(fromBase64(standIn.salt)).toHaveLength(SCRYPT_SALT_BYTES);
    expect(fromBase64(standIn.hash)).toHaveLength(SCRYPT_KEY_LENGTH);
    expect(fromBase64(standIn.hash).some((byte) => byte !== 0)).toBe(true);
    expect(standInPasswordHash()).toBe(standIn);
  });

  it("costs a real check through the queue and verifies no password", async () => {
    hashQueue.resetPeak();
    const results = await Promise.all(["", "correct horse battery", "password1234"].map((password) => verifyPassword(password, standInPasswordHash())));
    expect(results).toEqual([false, false, false]);
    expect(hashQueueStats().peakActive).toBe(1);
  });
});
