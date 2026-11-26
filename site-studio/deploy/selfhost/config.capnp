# Site Survey Design self-hosted (AD-1, AD-16): the same Worker bundle that runs on Cloudflare, served
# by workerd, Cloudflare's open-source runtime, with Durable Object storage on local disk.
#
# Build first (`npm run build`), then from site-studio/:
#   npx workerd serve deploy/selfhost/config.capnp \
#     --directory-path do-storage=/var/lib/site-studio/do \
#     --directory-path assets=dist/client \
#     --socket-addr http=127.0.0.1:8787
# Set the DEPLOYMENT_KEY environment variable first (32 random bytes, base64url); without it
# two-step verification is unavailable.
# The --directory-path and --socket-addr flags override the defaults below. Disk paths are resolved
# from the working directory (run from site-studio/); `embed` paths from this file's folder. HTTPS is provided in
# front of workerd by the Docker set-up (story 2.21). Allowed platform features only: no D1,
# Workflows, Queues, cron triggers or KV (server-tests/host-config.test.ts checks).
using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "main", worker = .siteStudio),
    (name = "do-storage", disk = (path = "data/do", writable = true)),
    (name = "assets", disk = (path = "dist/client", writable = false)),
  ],
  sockets = [
    (name = "http", address = "127.0.0.1:8787", http = (), service = "main"),
  ],
);

const siteStudio :Workerd.Worker = (
  modules = [(name = "index.js", esModule = embed "../../dist/worker/index.js")],
  compatibilityDate = "2026-11-01",
  # Node.js-compatible APIs, for scrypt password hashing (K19); enable_request_signal aborts a
  # request's signal when the client disconnects (D-5 amended). Keep equal to the Cloudflare flags.
  compatibilityFlags = ["nodejs_compat", "enable_request_signal"],
  bindings = [
    (name = "ASSETS", service = "assets"),
    (name = "PROJECT_ROOM", durableObjectNamespace = "ProjectRoom"),
    (name = "INSTALLATION", durableObjectNamespace = "Installation"),
    # The deployment key (story 1.5, D-16): read from the environment variable of the same name,
    # `null` when it is unset, which counts as no key. Never write a key in this file. Story 2.23
    # replaces this binding with the self-hosted key file.
    (name = "DEPLOYMENT_KEY", fromEnvironment = "DEPLOYMENT_KEY"),
  ],
  durableObjectNamespaces = [
    (className = "ProjectRoom", uniqueKey = "site-studio-project-room", enableSql = true),
    (className = "Installation", uniqueKey = "site-studio-installation", enableSql = true),
  ],
  durableObjectStorage = (localDisk = "do-storage"),
);
