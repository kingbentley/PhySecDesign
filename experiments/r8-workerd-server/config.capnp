# R8: one Worker with a SQLite-backed Durable Object stored on local disk, plus a writable
# disk service for files. Run from this directory:  npx workerd serve config.capnp
using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "main", worker = .mainWorker),
    (name = "do-storage", disk = (path = "data/do", writable = true)),
    (name = "files", disk = (path = "data/files", writable = true)),
  ],
  sockets = [
    (name = "http", address = "127.0.0.1:8787", http = (), service = "main"),
  ],
);

const mainWorker :Workerd.Worker = (
  modules = [(name = "worker.js", esModule = embed "worker.js")],
  compatibilityDate = "2026-11-01",
  bindings = [
    (name = "PROJECT", durableObjectNamespace = "Project"),
    (name = "FILES", service = "files"),
  ],
  durableObjectNamespaces = [
    (className = "Project", uniqueKey = "r8-project", enableSql = true),
  ],
  durableObjectStorage = (localDisk = "do-storage"),
);
