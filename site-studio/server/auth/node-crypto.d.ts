// The part of the runtime's Node.js-compatible crypto module the server uses (enabled by the
// `nodejs_compat` flag on both hosts). Declared here rather than adding @types/node, whose
// globals would clash with the Workers types.
declare module "node:crypto" {
  export interface ScryptOptions {
    N?: number;
    r?: number;
    p?: number;
    maxmem?: number;
  }
  export function scrypt(
    password: string | Uint8Array,
    salt: string | Uint8Array,
    keylen: number,
    options: ScryptOptions,
    callback: (error: Error | null, derivedKey: Uint8Array) => void,
  ): void;
  export function scryptSync(
    password: string | Uint8Array,
    salt: string | Uint8Array,
    keylen: number,
    options?: ScryptOptions,
  ): Uint8Array;
}
