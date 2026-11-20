import type { Env as SiteStudioEnv } from "../server/env";

declare global {
  namespace Cloudflare {
    interface Env extends SiteStudioEnv {}
  }
}
