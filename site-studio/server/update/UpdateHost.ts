// The update interface (AD-20, AD-21). Host-specific code lives only here and in server/files/:
// the Cloudflare implementation drives the update workflow and Cloudflare's rollback; the
// self-hosted one talks to the updater container. Implementations, the update record and the
// Update control arrive in Epic 9. The version rule itself is in server/objects/.

export interface ReleaseInfo {
  /** Release version, for example "1.4.0". */
  version: string;
  /** Highest data-format version the release reads and writes. */
  dataFormat: number;
  notesUrl?: string;
  /** True when the release changes a Durable Object class and cannot return automatically. */
  changesObjectClasses: boolean;
}

export type UpdateHostState =
  | { kind: "idle" }
  | { kind: "installing"; target: string; startedAt: string }
  | { kind: "returning"; target: string; startedAt: string }
  | { kind: "failed"; target: string; reason: string };

export interface UpdateHost {
  /** Which host this is; shown on the Update control. */
  readonly host: "cloudflare" | "selfhost";
  /** The release running now. */
  currentRelease(): Promise<string>;
  /** The newest published release this installation may move to, if any. */
  availableRelease(): Promise<ReleaseInfo | null>;
  /** Starts installing a release after the backup has been taken. */
  install(target: ReleaseInfo): Promise<void>;
  /** Returns to the release that ran before the last update. */
  returnToPrevious(): Promise<void>;
  state(): Promise<UpdateHostState>;
}
