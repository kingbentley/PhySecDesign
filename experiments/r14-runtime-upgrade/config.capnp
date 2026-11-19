# R14: the R8 arrangement, with a compatibility date old enough for every runtime version tried.
using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "main", worker = .mainWorker),
    (name = "do-storage", disk = (path = "data/do", writable = true)),
  ],
  sockets = [(name = "http", address = "127.0.0.1:8791", http = (), service = "main")],
);

const mainWorker :Workerd.Worker = (
  modules = [(name = "worker.js", esModule = embed "worker.js")],
  compatibilityDate = "2025-01-01",
  bindings = [(name = "PROJECT", durableObjectNamespace = "Project")],
  durableObjectNamespaces = [(className = "Project", uniqueKey = "r14-project", enableSql = true)],
  durableObjectStorage = (localDisk = "do-storage"),
);
