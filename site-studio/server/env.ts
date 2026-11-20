import type { Installation } from "./installation/Installation";
import type { ProjectRoom } from "./project-room/ProjectRoom";

/**
 * The bindings the Worker receives on both hosts. Routes never use them directly for storage:
 * storage goes through the project room, the installation object or the file store (AD-16).
 */
export interface Env {
  /** The app's built files: Cloudflare's assets on Cloudflare, a disk service self-hosted. */
  ASSETS: Fetcher;
  PROJECT_ROOM: DurableObjectNamespace<ProjectRoom>;
  INSTALLATION: DurableObjectNamespace<Installation>;
  /**
   * The set-up code (story 1.2): a Worker secret set by the Cloudflare deploy command while no user
   * exists. Absent self-hosted until story 2.21, so set-up is refused there. Never logged.
   */
  SETUP_CODE?: string;
}

/** The installation object always has this name (AD-2). */
export const INSTALLATION_NAME = "installation";
