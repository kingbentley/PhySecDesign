# R8 test 3: config.capnp plus workerd's bundled cron-trigger Worker ("/workerd/cron.js").
# Requires:  npx workerd serve config-cron.capnp --experimental
using Workerd = import "/workerd/workerd.capnp";
using Base = import "config.capnp";

const config :Workerd.Config = (
  services = [
    (name = "main", worker = Base.mainWorker),
    (name = "do-storage", disk = (path = "data/do", writable = true)),
    (name = "files", disk = (path = "data/files", writable = true)),
    (name = "cron", worker = .cronWorker),
  ],
  sockets = [
    (name = "http", address = "127.0.0.1:8787", http = (), service = "main"),
  ],
);

const cronWorker :Workerd.Worker = (
  modules = [(name = "cron.js", bundled = "/workerd/cron.js")],
  compatibilityDate = "2026-11-01",
  compatibilityFlags = ["service_binding_extra_handlers"],
  bindings = [
    (name = "SCHEDULE", durableObjectNamespace = "Schedule"),
    (name = "CRONS", json = "{\"MAIN\": [\"* * * * *\"]}"),
    (name = "MAIN", service = "main"),
  ],
  durableObjectNamespaces = [
    (className = "Schedule", uniqueKey = "r8-cron-schedule", enableSql = true),
  ],
  durableObjectStorage = (localDisk = "do-storage"),
);
