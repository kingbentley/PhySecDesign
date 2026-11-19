# Runs the same worker.js under the open-source runtime, to compare with Cloudflare. Usage: see run-local.sh
using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (
  services = [(name = "main", worker = .mainWorker)],
  sockets = [(name = "http", address = "127.0.0.1:8794", http = (), service = "main")],
);
const mainWorker :Workerd.Worker = (
  modules = [(name = "worker.js", esModule = embed "worker.js")],
  compatibilityDate = "2026-11-01",
  compatibilityFlags = ["nodejs_compat"],
);
