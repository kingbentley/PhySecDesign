// The file-store interface (AD-16, AD-17). Host-specific code lives only here and in
// server/update/: R2 on Cloudflare, a writable disk service self-hosted. Routes never touch a
// platform binding directly. Implementations arrive with the first stored file (Epic 2).
// Nothing in file storage is overwritten: a key is written once.

export interface StoredFileInfo {
  key: string;
  size: number;
  contentType: string;
  /** SHA-256 of the content, lowercase hex. */
  sha256: string;
  /** UTC, ISO 8601. */
  storedAt: string;
}

export interface FileRange {
  offset: number;
  length?: number;
}

export interface FileStore {
  /** Stores new content under a key that has never been used. Refuses an existing key. */
  put(
    key: string,
    body: ReadableStream<Uint8Array> | ArrayBuffer,
    options: { contentType: string; sha256: string; size: number },
  ): Promise<StoredFileInfo>;
  /** Returns the content, or a part of it, or null when the key is unknown. */
  get(key: string, range?: FileRange): Promise<{ info: StoredFileInfo; body: ReadableStream<Uint8Array> } | null>;
  head(key: string): Promise<StoredFileInfo | null>;
  /** Removes a file; used only by retention and the deletion of a whole project. */
  delete(key: string): Promise<void>;
  /** Lists keys under a prefix, a page at a time. */
  list(prefix: string, cursor?: string): Promise<{ keys: string[]; cursor?: string }>;
}
