# workerd config for Sandstorm grains, launched by run_grain.sh:
#
#   workerd serve sandstorm.capnp -ddo=/var/do-storage -dassets=<app>/assets
#
# Same services and sockets as config.capnp, plus V8 flags for Sandstorm's
# sandbox. Sandstorm's default seccomp filter allows pkey_alloc but answers
# pkey_mprotect with ENOSYS. On CPUs with memory protection keys (PKU), V8
# allocates a key for JIT write protection, then fails a release CHECK when
# pkey_mprotect is refused, and workerd dies with SIGTRAP ("Trace/breakpoint
# trap", exit 133) before it serves anything. Turning off V8's PKU-based
# protection keeps the grain off that syscall.

using Workerd = import "/workerd/workerd.capnp";
using Base = import "config.capnp";

const config :Workerd.Config = (
  services = Base.services,
  sockets = Base.sockets,
  v8Flags = ["--no-memory-protection-keys"],
);
