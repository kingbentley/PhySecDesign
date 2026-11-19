# R13: one Worker whose outbound connections may reach a mail server on this machine or a private network,
# trusting the test certificate authority. A real installation would list the organisation's own authority,
# or rely on the public ones, in the same place.
using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "main", worker = .mainWorker),
    (name = "outbound", network = (
      allow = ["public", "private"],
      tlsOptions = (trustBrowserCas = true),
    )),
  ],
  sockets = [(name = "http", address = "127.0.0.1:8793", http = (), service = "main")],
);

const mainWorker :Workerd.Worker = (
  modules = [(name = "worker.js", esModule = embed "worker.js")],
  compatibilityDate = "2026-11-01",
  globalOutbound = "outbound",
);
