# Standalone workerd config for self-hosted deployments that can't run
# `wrangler dev` — notably Sandstorm grains, whose sandbox blocks outbound
# network and breaks wrangler/miniflare's `setupCf` Cloudflare-metadata fetch.
#
# This config pins:
#   - The pre-bundled worker at `./worker/index.js` (produced by
#     `wrangler deploy --dry-run --outdir=workerd/worker/`).
#   - `assets/` served as a DiskDirectory at a side-service, wrapped into
#     the worker's `env.ASSETS` binding.
#   - `RoomDO` storage on localDisk (grain-local `/var/do-storage`).
#   - All env-var bindings that the worker reads at runtime.
#
# Launched via:
#   workerd serve config.capnp
#
# Override paths at runtime with `workerd serve ... -dassets=<path> \
# -ddo=<path>` to point the disk services at grain-local directories.

using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    # Main worker. Exports RoomDO + default fetch handler.
    (name = "main", worker = .mainWorker),

    # Curated static-asset tree — the output of scripts/build-assets.sh.
    # Default points at the sibling `assets/` dir; override with
    # `workerd serve config.capnp -dassets=/path/to/assets` at runtime.
    (name = "assets", disk = (path = "assets", writable = false)),

    # Durable Object on-disk storage. One subdirectory per DO namespace
    # (keyed by uniqueKey), SQLite files per object. Default is grain-
    # local `do-storage/`; override with `-ddo=/var/do-storage`.
    (name = "do", disk = (path = "do-storage", writable = true)),

    # Internet service — left unbound. The worker never makes outbound
    # fetches (it's all local DO + D1 + assets), so no outbound HTTP
    # egress is needed.
  ],

  sockets = [
    (
      name = "http",
      address = "*:33411",
      http = (),
      service = "main",
    ),
  ],
);

const mainWorker :Workerd.Worker = (
  modules = [
    # Main entry. Wrangler bundles into a single .js with all imports
    # inlined; we embed it as an ES module.
    (name = "worker.js", esModule = embed "worker/index.js"),
  ],

  # Pinned to the same compat date wrangler deployed with. Bumping this
  # without also rebuilding the worker bundle can introduce semantic
  # drift in the runtime APIs.
  compatibilityDate = "2025-04-01",
  compatibilityFlags = ["nodejs_compat"],

  bindings = [
    # Per-room Durable Object. The wrangler.toml uniqueKey and class
    # name must match; we use the same `RoomDO` / empty-uniqueKey
    # pair so grains upgraded from an earlier capnp-based deploy keep
    # the same storage addressing.
    (name = "ROOM", durableObjectNamespace = "RoomDO"),

    # Static asset proxy. The worker calls `env.ASSETS.fetch(request)`
    # with pathnames like `/index.html`; workerd's DiskDirectory
    # service responds by reading files out of the mapped directory.
    # Content-Type is omitted by DiskDirectory — the worker's asset
    # routes set it explicitly where needed (see src/routes/assets.ts).
    (name = "ASSETS", service = "assets"),

    # Env-var bindings. Text values are baked into the capnp at startup.
    (name = "BASEPATH", text = ""),

    # `fromEnvironment` pulls the value from the workerd process env at
    # startup. The grain's run_grain.sh exports this before exec'ing
    # workerd; for non-Sandstorm self-host, the Dockerfile's CMD does.
    (name = "ETHERCALC_MIGRATE_TOKEN", fromEnvironment = "ETHERCALC_MIGRATE_TOKEN"),

    # Optional env vars, read from the process env. Missing values
    # arrive as empty strings — the worker code checks for that.
    (name = "ETHERCALC_KEY", fromEnvironment = "ETHERCALC_KEY"),
    (name = "ETHERCALC_CORS", fromEnvironment = "ETHERCALC_CORS"),
    (name = "ETHERCALC_EXPIRE", fromEnvironment = "ETHERCALC_EXPIRE"),
    (name = "DEVMODE", fromEnvironment = "DEVMODE"),

    # Single-grain default room. Sandstorm grains set this to `sheet1`
    # (the room name the legacy LiveScript EtherCalc initialized
    # on-grain-creation) so `GET /` lands in the live spreadsheet
    # instead of the ethercalc.net "create new" landing page.
    (name = "ETHERCALC_DEFAULT_ROOM", fromEnvironment = "ETHERCALC_DEFAULT_ROOM"),
  ],

  durableObjectNamespaces = [
    (
      className = "RoomDO",
      # Must match wrangler.toml's uniqueKey or legacy grains lose
      # their existing DO storage on upgrade. EtherCalc's wrangler.toml
      # doesn't explicitly set one, so workerd defaults to the class
      # name hashed into a random-looking bytestring. We pin it so the
      # value is stable across rebuilds.
      uniqueKey = "ethercalc-roomdo-v1",
    ),
  ],

  # On-disk storage for DO state. Points at the `do` service above;
  # workerd creates `<uniqueKey>/<objectId>.sqlite` under it.
  durableObjectStorage = (localDisk = "do"),
);
