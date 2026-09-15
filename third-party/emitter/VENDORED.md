# Vendored: emitter@1.0.1

Verbatim copy of https://github.com/component/emitter/archive/1.0.1.tar.gz
(downloaded 2026-09-15; sha512 matches the integrity hash bun.lock recorded
for the remote tarball, so these bytes are identical to what CI used to fetch).

Only the distributable files are kept (`index.js`, `package.json`,
`component.json`, `History.md`, `Readme.md`); upstream's `Makefile`,
`.gitignore`, and `test/` are omitted (`test/` needs mocha/should, which
aren't installed, and the pack-manifest guard in
`scripts/build-assets.test.ts` forbids `/test/` paths in the published
tarball). Nothing else is modified.

Why vendored: `socket.io-parser@2.2.0` (via `socket.io-client@1.0.6`, used by
`packages/oracle-harness` for legacy-oracle replay) depends on this tarball.
GitHub serves it over plain HTTP in the upstream manifest, and the 2026-09-15
nightly failed when the runner refused the port-80 fetch (`ConnectionRefused`).
An `overrides` entry in the root `package.json` redirects that dependency to
this directory (`file:./third-party/emitter`), so installs never touch the
network for it — even if upstream deletes the tarball.

License: MIT (declared in upstream `component.json`; no LICENSE file ships
in the archive).
