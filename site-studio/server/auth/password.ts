import { scrypt } from "node:crypto";

// Password hashing (AD-12, K19, NFR-5): salted scrypt with N = 131,072, r = 8, p = 1 and a 32-byte
// result, through the runtime's Node.js-compatible crypto (`nodejs_compat` on both hosts). The
// parameters are stored beside the hash so that they can be strengthened later.
//
// Memory: scrypt needs 128 · N · r bytes, 128 MiB here, above Node's default limit of 32 MiB, so
// `maxmem` is raised. 256 MiB is a ceiling, not an allocation; it is the value experiment R9 used
// on both hosts. A Worker has 128 MB of memory, so the set-up flow hashes only after the set-up
// code is accepted (at most one hash per accepted attempt), and from story 1.3 every hash and
// check runs through the one-at-a-time queue below (D-5). Whether hashes at once would exceed the
// limit stays unproven; the queue is kept as a safeguard (D-5 amended).

export const PASSWORD_HASH_ALGORITHM = "scrypt";
export const SCRYPT_N = 131_072;
export const SCRYPT_R = 8;
export const SCRYPT_P = 1;
export const SCRYPT_KEY_LENGTH = 32;
export const SCRYPT_SALT_BYTES = 16;
export const SCRYPT_MAXMEM = 256 * 1024 * 1024;

/** A stored password hash with its parameters. `salt` and `hash` are base64. */
export interface PasswordHash {
  algorithm: typeof PASSWORD_HASH_ALGORITHM;
  n: number;
  r: number;
  p: number;
  keyLength: number;
  salt: string;
  hash: string;
}

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function derive(password: string, salt: Uint8Array, n: number, r: number, p: number, keyLength: number): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  return new Promise((resolve, reject) => {
    scrypt(passwordBytes, salt, keyLength, { N: n, r, p, maxmem: SCRYPT_MAXMEM }, (error, key) => {
      if (error) reject(error);
      else resolve(new Uint8Array(key));
    });
  });
}

/** A hash made with the current parameters: what the installation object accepts at set-up. */
export interface CurrentPasswordHash extends PasswordHash {
  n: typeof SCRYPT_N;
  r: typeof SCRYPT_R;
  p: typeof SCRYPT_P;
  keyLength: typeof SCRYPT_KEY_LENGTH;
}

// The hash queue (story 1.3, D-5 as amended, A-12, E-9, V-7): one scrypt hash at a time per Worker
// isolate, for real sign-in checks, stand-in checks and set-up hashing alike. At most 20 requests
// wait behind the running hash; another is refused with `HashQueueBusy`, which the sign-in route
// answers as `signin_busy`, the same for every email. A slot is released in `finally`, so a hash
// that fails frees it, and a waiting request whose caller goes away (its signal aborts) leaves the
// queue. The slot passes straight to the next waiter, so a request arriving in between cannot run
// beside it.

export const HASH_QUEUE_MAX_WAITING = 20;

/** Raised when the hash queue already has 20 waiting. Carries nothing about the request. */
export class HashQueueBusy extends Error {
  constructor() {
    super("hash_queue_busy");
  }
}

export interface HashQueueStats {
  /** Hashes running now. */
  active: number;
  /** Requests waiting behind the running hash. */
  waiting: number;
  /** The most hashes seen running at once since the last reset. */
  peakActive: number;
}

interface Waiter {
  start(): void;
}

export class HashQueue {
  private running = 0;
  private held = false;
  private peak = 0;
  private readonly waiters: Waiter[] = [];

  constructor(private readonly maxWaiting: number = HASH_QUEUE_MAX_WAITING) {}

  /** True when a new request would be queued rather than refused as busy. */
  hasRoom(): boolean {
    return !this.held || this.waiters.length < this.maxWaiting;
  }

  stats(): HashQueueStats {
    return { active: this.running, waiting: this.waiters.length, peakActive: this.peak };
  }

  resetPeak(): void {
    this.peak = this.running;
  }

  /** Runs `task` when the slot is free; refuses with `HashQueueBusy` when 20 already wait. */
  async run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) throw signal.reason ?? new Error("aborted");
    if (this.held) {
      if (this.waiters.length >= this.maxWaiting) throw new HashQueueBusy();
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          const index = this.waiters.indexOf(waiter);
          if (index === -1) return;
          this.waiters.splice(index, 1);
          reject(signal?.reason ?? new Error("aborted"));
        };
        const waiter: Waiter = {
          start: () => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
          },
        };
        signal?.addEventListener("abort", onAbort, { once: true });
        this.waiters.push(waiter);
      });
      // The slot was handed over by the request before: `held` stayed true.
    } else {
      this.held = true;
    }
    this.running += 1;
    this.peak = Math.max(this.peak, this.running);
    try {
      return await task();
    } finally {
      this.running -= 1;
      const next = this.waiters.shift();
      if (next) next.start();
      else this.held = false;
    }
  }
}

/** The isolate's one hash queue. */
export const hashQueue = new HashQueue();

/** The hash queue's counts, for tests (V-7). */
export function hashQueueStats(): HashQueueStats {
  return hashQueue.stats();
}

/** Hashes a password with a fresh random salt and the current parameters, through the hash queue. */
export async function hashPassword(password: string, signal?: AbortSignal): Promise<CurrentPasswordHash> {
  const salt = crypto.getRandomValues(new Uint8Array(SCRYPT_SALT_BYTES));
  const key = await hashQueue.run(() => derive(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P, SCRYPT_KEY_LENGTH), signal);
  return {
    algorithm: PASSWORD_HASH_ALGORITHM,
    n: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    keyLength: SCRYPT_KEY_LENGTH,
    salt: toBase64(salt),
    hash: toBase64(key),
  };
}

/** Constant-time equality of two byte strings; unequal lengths are simply unequal. */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  return crypto.subtle.timingSafeEqual(a, b);
}

/** Checks a password against a stored hash, using the parameters stored with it, through the hash queue. */
export async function verifyPassword(password: string, stored: PasswordHash, signal?: AbortSignal): Promise<boolean> {
  if (stored.algorithm !== PASSWORD_HASH_ALGORITHM) return false;
  const expected = fromBase64(stored.hash);
  const key = await hashQueue.run(() => derive(password, fromBase64(stored.salt), stored.n, stored.r, stored.p, stored.keyLength), signal);
  return bytesEqual(key, expected);
}

// The stand-in hash (CAP-6, D-5, A-1, E-4): for an email with no account, or an inactive account,
// the password is checked against this, through the same queue and with the current parameters, so
// the refusal takes as long as a real one. It is a random 16-byte salt and a random 32-byte value,
// made from no password (so no password is known to verify against it) and never the known-answer
// fixture. A stand-in check that happens to verify is still a failure: the sign-in ticket says it
// was a stand-in. Made on first use, since a Worker may not draw random values at global scope.

let standIn: CurrentPasswordHash | null = null;

/** This isolate's stand-in hash. */
export function standInPasswordHash(): CurrentPasswordHash {
  standIn ??= {
    algorithm: PASSWORD_HASH_ALGORITHM,
    n: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    keyLength: SCRYPT_KEY_LENGTH,
    salt: toBase64(crypto.getRandomValues(new Uint8Array(SCRYPT_SALT_BYTES))),
    hash: toBase64(crypto.getRandomValues(new Uint8Array(SCRYPT_KEY_LENGTH))),
  };
  return standIn;
}
