# One-shot Sandstorm legacy migration runtime. This is intentionally
# separate from config.capnp:
#   - it listens on 127.0.0.1:33412, not the sandstorm-http-bridge port;
#   - it binds the grain's /var volume read-only as LEGACY;
#   - run_grain.sh stops it before starting the normal app runtime.

using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "main", worker = .mainWorker),
    (name = "assets", disk = (path = "assets", writable = false)),
    (name = "do", disk = (path = "do-storage", writable = true)),
    (name = "legacy", disk = (path = "legacy", writable = false)),
  ],

  sockets = [
    (
      name = "http",
      address = "127.0.0.1:33412",
      http = (),
      service = "main",
    ),
  ],
);

const mainWorker :Workerd.Worker = (
  modules = [
    (name = "migrate.js", esModule = embed "worker/migrate.js"),
  ],

  compatibilityDate = "2025-04-01",
  compatibilityFlags = ["nodejs_compat"],

  bindings = [
    (name = "ROOM", durableObjectNamespace = "RoomDO"),
    (name = "ASSETS", service = "assets"),
    (name = "LEGACY", service = "legacy"),
    (name = "BASEPATH", text = ""),
    (name = "ETHERCALC_MIGRATE_TOKEN", fromEnvironment = "ETHERCALC_MIGRATE_TOKEN"),
    (name = "ETHERCALC_KEY", fromEnvironment = "ETHERCALC_KEY"),
    (name = "ETHERCALC_CORS", fromEnvironment = "ETHERCALC_CORS"),
    (name = "ETHERCALC_EXPIRE", fromEnvironment = "ETHERCALC_EXPIRE"),
    (name = "DEVMODE", fromEnvironment = "DEVMODE"),
    (name = "ETHERCALC_DEFAULT_ROOM", fromEnvironment = "ETHERCALC_DEFAULT_ROOM"),
  ],

  durableObjectNamespaces = [
    (
      className = "RoomDO",
      uniqueKey = "ethercalc-roomdo-v1",
    ),
  ],

  durableObjectStorage = (localDisk = "do"),
);

