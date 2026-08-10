# EtherCalc migration inventory

Mechanical repository inventory collected on 2026-08-10 from `/Users/au/w/ethercalc`. Source quotations are prefixed with their original 1-based line number; the text after the first colon is verbatim. The collection scope for path/content scans is Git-tracked files plus non-ignored untracked files present in the worktree, excluding this output file itself.

> **Status:** Mechanical verbatim dump of config/workflows/migrations/self-host
> artifacts collected early on 2026-08-10. Supporting evidence for
> `PROD_UPGRADE_PLAN.md` — not a procedure. Spot-checked against the primary
> tree on reconcile: full `packages/worker/wrangler.toml` dump and all three
> D1 migration SQL dumps still match byte-for-byte; this inventory never
> dumped `workerd/config.capnp` (self-host bindings are in the runbook §7).
> **Where interpretive prose elsewhere disagrees with the runbook, the
> runbook is authoritative.** Do not treat this dump as a substitute for
> reading live files after further branch edits.


## Summary / absences

- **Wrangler configs:** exactly one: `packages/worker/wrangler.toml`. It defines production custom domains, two SQLite Durable Objects, one D1 database, Workers Assets, vars, cron, one Text rule, and a staging overlay.
- **Deploy workflows exist:** manual production Worker deploy and manual docs Pages deploy. npm and Docker publish on `0.2*.*` tags (with manual dispatch options). Nightly performs a staging **dry-run only**.
- **No automatic production Worker deploy on push/tag:** `deploy-production.yml` is `workflow_dispatch` only and requires `confirm == 'deploy'`.
- **D1 migrations exist:** three ordered SQL files, `0001_rooms.sql`, `0002_cron.sql`, `0003_audit_chat.sql`. There is **no root `migrations/` directory**.
- **No active KV, R2, Queue, AI, or `send_email` binding:** `send_email` is only a commented example. No gradual-deployment configuration or use of the word `gradual` was found.
- **Self-host artifacts exist:** three Dockerfiles, four Compose files, a Helm chart, and nginx config.
- **Tool-version files absent:** no `.tool-versions`, `.nvmrc`, or `.node-version`. Bun is pinned by `packageManager` and Docker; Node is pinned only by Docker base-image major/tag; Wrangler manifests use caret ranges and `bun.lock` resolves exact versions.

## 1. Wrangler configuration
### Files found

- `packages/worker/wrangler.toml`

No `wrangler.json`, `wrangler.jsonc`, or additional `wrangler.toml` was found outside ignored/generated state.

### Field/binding inventory

| Item | Verbatim source |
|---|---|
| name | `packages/worker/wrangler.toml:1` — `name = "ethercalc"` |
| main | `packages/worker/wrangler.toml:2` — `main = "src/index.ts"` |
| compatibility_date | `packages/worker/wrangler.toml:3` — `compatibility_date = "2026-07-21"` |
| compatibility_flags | `packages/worker/wrangler.toml:4` — `compatibility_flags = ["nodejs_compat"]` |
| workers.dev | `packages/worker/wrangler.toml:13` — `workers_dev = false` |
| routes/custom domains | `packages/worker/wrangler.toml:20-27` — `ethercalc.net` and `www.ethercalc.net`, both `custom_domain = true`, `zone_name = "ethercalc.net"` |
| Durable Object binding | `packages/worker/wrangler.toml:31-33` — `ROOM` → `RoomDO` |
| Durable Object binding | `packages/worker/wrangler.toml:37-39` — `AUTH` → `AuthDO` |
| migration v1 | `packages/worker/wrangler.toml:41-43` — `new_sqlite_classes = ["RoomDO"]` |
| migration v2 | `packages/worker/wrangler.toml:45-47` — `new_sqlite_classes = ["AuthDO"]` |
| production vars | `packages/worker/wrangler.toml:57-68` — `BASEPATH`, `ETHERCALC_CORS`, `ETHERCALC_AUTH`, `ETHERCALC_RP_ID`, `ETHERCALC_RP_NAME`, `ETHERCALC_ORIGIN` |
| staging overrides | `packages/worker/wrangler.toml:72-108` — distinct name, workers.dev/preview URLs, empty routes, vars, DO bindings, D1, Assets, and empty crons |
| Assets | `packages/worker/wrangler.toml:126-129` — directory `../../assets`, binding `ASSETS`, `run_worker_first = true` |
| Cron | `packages/worker/wrangler.toml:134-135` — `*/1 * * * *` |
| send_email | `packages/worker/wrangler.toml:144-147` — commented example only; not active |
| D1 | `packages/worker/wrangler.toml:164-168` — `DB`, `ethercalc_rooms`, database id `bd9247bd-5b50-4c47-8ce6-de3196511684`, migrations `./migrations` |
| rule | `packages/worker/wrangler.toml:181-184` — Text globs for `SocialCalc.js`, fallthrough true |
| KV/R2/Queues/AI | `packages/worker/wrangler.toml:149-151` states KV/R2 are deferred; no KV, R2, Queue, or AI tables occur in the config |

### Full primary Worker config

**`packages/worker/wrangler.toml:1-194`**

~~~~~~~text
1:name = "ethercalc"
2:main = "src/index.ts"
3:compatibility_date = "2026-07-21"
4:compatibility_flags = ["nodejs_compat"]
5:
6:# Disable the `*.workers.dev` hostname for production (L-14). It serves the
7:# identical Worker but lives OUTSIDE the `ethercalc.net` zone, so any zone-
8:# scoped WAF / Rate Limiting rules (the whole §13 Q7 abuse-prevention plan)
9:# do NOT apply to it — an attacker could hit the workers.dev URL and bypass
10:# every rate-limit. With this false, only the zone-protected custom domains
11:# below serve traffic. Migration tooling must target the custom domain
12:# (https://ethercalc.net) rather than the old workers.dev URL.
13:workers_dev = false
14:
15:# Custom domains. Requires the `ethercalc.net` zone to live under this
16:# Cloudflare account (one-time nameserver swap at the registrar). On
17:# deploy, wrangler auto-creates proxied DNS records and provisions TLS.
18:# `override_existing_dns_record = true` replaces the legacy A/CNAME
19:# records (2026-04-22 cutover from Zappa/Node to this worker).
20:[[routes]]
21:pattern = "ethercalc.net"
22:zone_name = "ethercalc.net"
23:custom_domain = true
24:[[routes]]
25:pattern = "www.ethercalc.net"
26:zone_name = "ethercalc.net"
27:custom_domain = true
28:# Durable Object: one instance per spreadsheet room.
29:# Holds live SocialCalc state, WebSocket clients, and the snapshot/log/audit
30:# storage. See AGENTS.md §3.2 and §3.3.
31:[[durable_objects.bindings]]
32:name = "ROOM"
33:class_name = "RoomDO"
34:
35:# Phase A — singleton AuthDO: WebAuthn credentials, challenges, and the
36:# session-signing secret. Addressed only as `idFromName('auth')`.
37:[[durable_objects.bindings]]
38:name = "AUTH"
39:class_name = "AuthDO"
40:
41:[[migrations]]
42:tag = "v1"
43:new_sqlite_classes = ["RoomDO"]
44:
45:[[migrations]]
46:tag = "v2"
47:new_sqlite_classes = ["AuthDO"]
48:
49:# Default vars — overridden per-deploy by `wrangler secret put` or
50:# wrangler.toml overlays. `ETHERCALC_KEY` is unset by default (anonymous
51:# mode / identity HMAC); production deploys should run
52:# `wrangler secret put ETHERCALC_KEY` instead of committing a value.
53:# `BASEPATH` is empty by default (legacy `--basepath` CLI flag).
54:#
55:# §13 Q6: the CLI (`bin/ethercalc --key …`, Phase 11) will also set
56:# ETHERCALC_KEY in the Miniflare env for self-host parity.
57:[vars]
58:BASEPATH = ""
59:ETHERCALC_CORS = "1"
60:# Phase A — passkey auth. `ETHERCALC_AUTH` is the master switch for the
61:# `/_auth/*` ceremonies and the private-room routes. The RP ID / origin
62:# are WebAuthn trust anchors: they MUST match the site users visit.
63:# NOTE: WebAuthn origins are exact. The Worker redirects the configured
64:# origin's `www` alias to this naked origin before starting any ceremony.
65:ETHERCALC_AUTH = "1"
66:ETHERCALC_RP_ID = "ethercalc.net"
67:ETHERCALC_RP_NAME = "EtherCalc"
68:ETHERCALC_ORIGIN = "https://ethercalc.net"
69:
70:# Staging overlay — isolated from production routes and cron triggers. It uses
71:# its own D1 database and a temporary workers.dev hostname for release checks.
72:[env.staging]
73:name = "ethercalc-staging"
74:workers_dev = true
75:preview_urls = true
76:routes = []
77:
78:[env.staging.vars]
79:BASEPATH = ""
80:ETHERCALC_CORS = "1"
81:# Phase A — passkey auth is live on staging for the WebAuthn acceptance test.
82:# RP ID / origin MUST match the workers.dev hostname exactly.
83:ETHERCALC_AUTH = "1"
84:ETHERCALC_RP_ID = "ethercalc-staging.audreyt.workers.dev"
85:ETHERCALC_RP_NAME = "EtherCalc Staging"
86:ETHERCALC_ORIGIN = "https://ethercalc-staging.audreyt.workers.dev"
87:
88:[[env.staging.durable_objects.bindings]]
89:name = "ROOM"
90:class_name = "RoomDO"
91:
92:[[env.staging.durable_objects.bindings]]
93:name = "AUTH"
94:class_name = "AuthDO"
95:
96:[[env.staging.d1_databases]]
97:binding = "DB"
98:database_name = "ethercalc_rooms_staging"
99:database_id = "273b1db3-17bc-44dd-bbc2-62ce1727abde"
100:migrations_dir = "./migrations"
101:
102:[env.staging.assets]
103:directory = "../../assets"
104:binding = "ASSETS"
105:run_worker_first = true
106:
107:[env.staging.triggers]
108:crons = []
109:
110:# Workers Assets binding (Phase 4.1/11). `directory` is resolved relative
111:# to this wrangler.toml, so it points up two levels to the repo-root
112:# `assets/` produced by `scripts/build-assets.ts`. That builder copies the
113:# curated set of static files (index.html, start.html, panels.html,
114:# icons, manifest.appcache, manifest.json, l10n/*.json, the built
115:# single-sheet client at static/player.js, the SocialCalc runtime at
116:# static/socialcalc.js, and the multi-sheet React app under multi/).
117:#
118:# The legacy repo root contains `node_modules/` and other >25 MiB files
119:# that trip Workers' per-asset size limit, so we point at the curated
120:# directory instead of `./`. Also `assets/` is .gitignored — CI rebuilds
121:# it before `wrangler deploy --dry-run`.
122:#
123:# Runtime fallback: when `ASSETS` is unbound (test env), the route layer
124:# at `src/routes/assets.ts` returns 404. Integration tests stub the
125:# binding with a mock Fetcher to exercise the proxied path.
126:[assets]
127:directory = "../../assets"
128:binding = "ASSETS"
129:run_worker_first = true
130:
131:# Phase 9 — Cron Trigger. Cloudflare invokes `scheduled()` every minute.
132:# The legacy HTTP trigger remains only for self-host operators and requires
133:# `Authorization: Bearer $ETHERCALC_MIGRATE_TOKEN`.
134:[triggers]
135:crons = ["*/1 * * * *"]
136:
137:# Cloudflare Email Service binding. Commented out by default because sender
138:# domain onboarding and explicit recipient policy are deployment-specific.
139:# Spreadsheet content can schedule mail, so production bindings MUST restrict
140:# both sender and destination addresses rather than expose account-wide quota.
141:# The structured `EMAIL.send({from: {email},to,subject,text})` call is
142:# implemented in `src/lib/email.ts`; unbound deployments report email disabled.
143:#
144:# [[send_email]]
145:# name = "EMAIL"
146:# allowed_sender_addresses = ["noreply@example.com"]
147:# allowed_destination_addresses = ["alerts@example.com"]
148:
149:# KV, R2 bindings will be added in subsequent phases as they are used.
150:# Scaffolding them eagerly would force empty bindings into the local
151:# Miniflare state and muddy the test environment.
152:
153:# D1 — cross-room index mirror (Phase 5.1). DO storage is the
154:# authoritative source of truth for a single room; this table provides
155:# the cross-room query surface needed by `/_rooms`, `/_roomlinks`,
156:# `/_roomtimes`. Mirror writes land in `src/room.ts` after every
157:# snapshot mutation; reads in `src/routes/rooms.ts` fall back to empty
158:# when the binding is absent (Node unit tests without Miniflare).
159:#
160:# Binding name is `DB`. Schema at `migrations/0001_rooms.sql`. The
161:# `database_id` placeholder is fine for local Miniflare and `wrangler
162:# deploy --dry-run` — a real id is required only for an actual
163:# `wrangler deploy`. See §10.2 for the Redis → D1 mapping table.
164:[[d1_databases]]
165:binding = "DB"
166:database_name = "ethercalc_rooms"
167:database_id = "bd9247bd-5b50-4c47-8ce6-de3196511684"
168:migrations_dir = "./migrations"
169:
170:# Load SocialCalc.js as a Text module so `new Function(rawSource)` inside
171:# `@ethercalc/socialcalc-headless` can eval it. The `?raw` Vite suffix
172:# handles this under vitest-pool-workers (Vite resolves it directly);
173:# wrangler's esbuild bundler needs an explicit rule, otherwise it tries
174:# to parse the 27k-line UMD (sloppy-mode `delete varname;` that esbuild
175:# rejects in strict ESM).
176:#
177:# Important: this rule is only consumed by `wrangler deploy`. The
178:# `vitest.config.ts` sets its miniflare options directly (no `wrangler:
179:# { configPath }`) so this rule doesn't leak into the vitest runner and
180:# mangle `?raw` imports with `?mf_vitest_force=Text`.
181:[[rules]]
182:type = "Text"
183:globs = ["**/SocialCalc.js?raw", "**/SocialCalc.js"]
184:fallthrough = true
185:
186:# `unsafe_eval` binding is no longer needed: `socialcalc.bundled.ts` is
187:# transpiled at build time into the worker bundle (see
188:# `packages/socialcalc-headless/scripts/build.js`). No runtime `eval` /
189:# `new Function` calls remain, so CF validation no longer needs the
190:# capability object. If we ever revert to `?raw`-import + eval, re-add:
191:#
192:#   [[unsafe.bindings]]
193:#   name = "UNSAFE_EVAL"
194:#   type = "unsafe_eval"
~~~~~~~
## 2. GitHub Actions workflows
| Workflow | Triggers | Jobs | Production/staging/deploy/publish behavior |
|---|---|---|---|
| `.github/workflows/ci.yml` | `push` main; `pull_request` main | `test`, `build-selfhost`, `helm-lint`, `e2e`, `mutation-gate` | No deploy/publish. Worker build is dry-run through package script. |
| `.github/workflows/nightly.yml` | schedule `0 6 * * *`; manual `workflow_dispatch` with package list | `mutation`, `summary`, `oracle-replay`, `staging-dry-run` | Touches staging configuration only via `wrangler deploy --dry-run --config wrangler.toml --env staging`; no remote deploy. |
| `.github/workflows/publish-npm.yml` | tag push `0.2*.*`; manual `workflow_dispatch` | `validate`, `publish` | Packs and publishes npm using OIDC; manual dispatch without `PUBLISH` is dry-run. |
| `.github/workflows/deploy-docs.yml` | manual `workflow_dispatch` with `confirm` | `deploy`, `rejected` | Creates Pages project if absent and deploys docs when confirm is exactly `deploy`; environment `docs-production`. |
| `.github/workflows/deploy-production.yml` | manual `workflow_dispatch` with `confirm` | `deploy`, `rejected` | Deploys the production Worker when confirm is exactly `deploy`; environment `production`; optional live smoke. |
| `.github/workflows/publish-image.yml` | tag push `0.2*.*`; manual `workflow_dispatch` with image tag | `publish` | Pushes multi-arch images to Docker Hub as version/dev and, for tags, `latest`. |
| `.github/workflows/lemmascript.yml` | `push` main; `pull_request` main | `dafny`, `lean-gen` | No deploy/publish. |

### Verbatim deploy/publish/staging steps

#### Production Worker deploy

**`.github/workflows/deploy-production.yml:45-69`**

~~~~~~~text
45:      - name: Build client assets
46:        run: |
47:          vp run @ethercalc/client#build
48:          vp run @ethercalc/client-multi#build
49:          vp exec bun scripts/build-assets.ts
50:
51:      - name: Cloudflare API token
52:        id: cloudflare-token
53:        run: ./scripts/ci-cloudflare-token.sh
54:        env:
55:          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
56:          CLOUDFLARE_OAUTH_REFRESH_TOKEN: ${{ secrets.CLOUDFLARE_OAUTH_REFRESH_TOKEN }}
57:
58:      - name: Deploy to Cloudflare Workers
59:        run: vp exec wrangler deploy --env=""
60:        working-directory: packages/worker
61:        env:
62:          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
63:          CLOUDFLARE_API_TOKEN: ${{ steps.cloudflare-token.outputs.cloudflare_api_token }}
64:
65:      - name: Post-deploy smoke (optional)
66:        if: vars.PRODUCTION_SMOKE_URL != ''
67:        env:
68:          PRODUCTION_SMOKE_URL: ${{ vars.PRODUCTION_SMOKE_URL }}
69:        run: curl --fail --silent --show-error "${PRODUCTION_SMOKE_URL%/}/_health"
~~~~~~~
#### Docs production Pages deploy

**`.github/workflows/deploy-docs.yml:46-67`**

~~~~~~~text
46:      - name: Build Starlight site
47:        run: vp run @ethercalc/docs#build
48:      - name: Cloudflare API token
49:        id: cloudflare-token
50:        run: ./scripts/ci-cloudflare-token.sh
51:        env:
52:          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
53:          CLOUDFLARE_OAUTH_REFRESH_TOKEN: ${{ secrets.CLOUDFLARE_OAUTH_REFRESH_TOKEN }}
54:
55:      - name: Ensure Pages project exists
56:        run: |
57:          vp exec wrangler pages project list | grep -q ethercalc-docs \
58:            || vp exec wrangler pages project create ethercalc-docs --production-branch=main
59:        env:
60:          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
61:          CLOUDFLARE_API_TOKEN: ${{ steps.cloudflare-token.outputs.cloudflare_api_token }}
62:
63:      - name: Deploy to Cloudflare Pages
64:        run: vp exec wrangler pages deploy packages/docs/dist --project-name=ethercalc-docs --branch=main --commit-dirty=true
65:        env:
66:          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
67:          CLOUDFLARE_API_TOKEN: ${{ steps.cloudflare-token.outputs.cloudflare_api_token }}
~~~~~~~
#### npm release packing and publish

**`.github/workflows/publish-npm.yml:63-129`**

~~~~~~~text
63:      - name: Pack and verify deterministic package contract
64:        id: pack
65:        run: |
66:          set -euo pipefail
67:          mkdir -p dist-release
68:
69:          VERSION="$(node -p "require('./package.json').version")"
70:          if [[ ! "$VERSION" =~ ^[0-9A-Za-z][0-9A-Za-z._-]{0,127}$ ]]; then
71:            echo "::error::Unsafe package version"
72:            exit 1
73:          fi
74:          TARBALL_NAME="ethercalc-${VERSION}.tgz"
75:
76:          # Pack twice and verify byte-for-byte identity (reproducibility check)
77:          vp pm pack --out dist-release/pack1.tgz
78:          vp pm pack --out dist-release/pack2.tgz
79:
80:          SHA1="$(sha256sum dist-release/pack1.tgz | awk '{print $1}')"
81:          SHA2="$(sha256sum dist-release/pack2.tgz | awk '{print $1}')"
82:
83:          if [ "$SHA1" != "$SHA2" ]; then
84:            echo "::error::Package is non-deterministic: pack1 sha256=$SHA1, pack2 sha256=$SHA2"
85:            exit 1
86:          fi
87:
88:          mv dist-release/pack1.tgz "dist-release/$TARBALL_NAME"
89:          rm -f dist-release/pack2.tgz
90:
91:          # Extract and assert no test, e2e, or Stryker files leaked
92:          mkdir -p /tmp/pack-verify-extract
93:          tar -xzf "dist-release/$TARBALL_NAME" -C /tmp/pack-verify-extract
94:
95:          FORBIDDEN=(
96:            "package/packages/e2e"
97:            "package/packages/oracle-harness"
98:            "package/.stryker-tmp"
99:            "package/stryker-setup"
100:          )
101:          for path in "${FORBIDDEN[@]}"; do
102:            if [ -e "/tmp/pack-verify-extract/$path" ]; then
103:              echo "::error::Forbidden path leaked into npm package: $path"
104:              exit 1
105:            fi
106:          done
107:
108:          PACKED_VERSION="$(node -p "require('/tmp/pack-verify-extract/package/package.json').version")"
109:          if [ "$PACKED_VERSION" != "$VERSION" ]; then
110:            echo "::error::Packed package version mismatch"
111:            exit 1
112:          fi
113:
114:          {
115:            echo "tarball-path=./dist-release/$TARBALL_NAME"
116:            echo "tarball-name=$TARBALL_NAME"
117:            echo "version=$VERSION"
118:          } >> "$GITHUB_OUTPUT"
119:          
120:          # Archive the build artifact for the publish job
121:          mkdir -p /tmp/artifact-sharing
122:          cp "dist-release/$TARBALL_NAME" /tmp/artifact-sharing/
123:          
124:      - name: Upload release artifact
125:        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7
126:        with:
127:          name: npm-release-tarball
128:          path: dist-release/
129:          retention-days: 7
~~~~~~~
**`.github/workflows/publish-npm.yml:142-175`**

~~~~~~~text
142:      - name: Download release artifact
143:        uses: actions/download-artifact@37930b1c2abaa49bbe596cd826c3c89aef350131 # v7
144:        with:
145:          name: npm-release-tarball
146:          path: dist-release
147:
148:      - name: Setup Node.js (required for npm OIDC publish)
149:        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
150:        with:
151:          node-version: 'lts/*'
152:          registry-url: 'https://registry.npmjs.org'
153:
154:      - name: Publish to npm
155:        # If triggered by a version tag push, or manual workflow_dispatch with confirm=PUBLISH, publish the package.
156:        # Otherwise, run a dry-run check. Expression values enter through env,
157:        # never shell source, and the validated build output pins the filename.
158:        env:
159:          CONFIRM_INPUT: ${{ github.event.inputs.confirm }}
160:          EVENT_NAME: ${{ github.event_name }}
161:          TARBALL: ${{ needs.validate.outputs.tarball-path }}
162:          VERSION: ${{ needs.validate.outputs.version }}
163:        run: |
164:          set -euo pipefail
165:          if [[ ! "$TARBALL" =~ ^\./dist-release/ethercalc-[0-9A-Za-z._-]+\.tgz$ ]] || [ ! -f "$TARBALL" ]; then
166:            echo "Invalid release artifact path" >&2
167:            exit 1
168:          fi
169:          if [ "$EVENT_NAME" = "workflow_dispatch" ] && [ "$CONFIRM_INPUT" != "PUBLISH" ]; then
170:            echo "Dry-run mode: verifying package signature only."
171:            npm publish "$TARBALL" --provenance --dry-run
172:          else
173:            echo "Publishing version $VERSION to npm..."
174:            npm publish "$TARBALL" --provenance
175:          fi
~~~~~~~
#### Docker Hub publish

**`.github/workflows/publish-image.yml:37-82`**

~~~~~~~text
37:      - name: Derive image tags
38:        id: tags
39:        env:
40:          INPUT_TAG: ${{ github.event.inputs.tag }}
41:        run: |
42:          set -euo pipefail
43:          if [ "${GITHUB_REF_TYPE}" = "tag" ]; then
44:            version="${GITHUB_REF_NAME}"
45:            tags="audreyt/ethercalc:${version},audreyt/ethercalc:latest"
46:          else
47:            version="${INPUT_TAG:-dev}"
48:            tags="audreyt/ethercalc:${version}"
49:          fi
50:          if [[ ! "$version" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ ]]; then
51:            echo "Invalid Docker tag" >&2
52:            exit 1
53:          fi
54:          echo "tags=${tags}" >> "$GITHUB_OUTPUT"
55:          echo "version=${version}" >> "$GITHUB_OUTPUT"
56:
57:      - name: Set up QEMU (for arm64 on an amd64 runner)
58:        uses: docker/setup-qemu-action@c7c53464625b32c7a7e944ae62b3e17d2b600130 # v3
59:
60:      - name: Set up Docker Buildx
61:        uses: docker/setup-buildx-action@bb05f3f5519dd87d3ba754cc423b652a5edd6d2c # v4
62:
63:      - name: Log in to Docker Hub
64:        uses: docker/login-action@c94ce9fb468520275223c153574b00df6fe4bcc9 # v3
65:        with:
66:          username: ${{ secrets.DOCKERHUB_USERNAME }}
67:          password: ${{ secrets.DOCKERHUB_TOKEN }}
68:
69:      - name: Build and push
70:        uses: docker/build-push-action@10e90e3645eae34f1e60eeb005ba3a3d33f178e8 # v6
71:        with:
72:          context: .
73:          file: ./Dockerfile
74:          platforms: linux/amd64,linux/arm64
75:          push: true
76:          tags: ${{ steps.tags.outputs.tags }}
77:          cache-from: type=gha
78:          cache-to: type=gha,mode=max
79:          labels: |
80:            org.opencontainers.image.source=${{ github.server_url }}/${{ github.repository }}
81:            org.opencontainers.image.revision=${{ github.sha }}
82:            org.opencontainers.image.version=${{ steps.tags.outputs.version }}
~~~~~~~
#### Nightly staging dry-run

**`.github/workflows/nightly.yml:290-301`**

~~~~~~~text
290:      - name: Build client assets
291:        run: |
292:          vp run @ethercalc/client#build
293:          vp run @ethercalc/client-multi#build
294:          vp exec bun scripts/build-assets.ts
295:
296:      # Vite writes `.wrangler/deploy/config.json`, redirecting Wrangler to
297:      # the generated production config. An explicit source config is required
298:      # here; otherwise `--env staging` silently validates production instead.
299:      - name: wrangler deploy --dry-run --config wrangler.toml --env staging
300:        run: vp exec wrangler deploy --dry-run --config wrangler.toml --env staging
301:        working-directory: packages/worker
~~~~~~~
## 3. Package/Vite+/vp scripts mentioning deploy, publish, migrate, seed, or release
| File | Script | Exact command |
|---|---|---|
| `packages/migrate/package.json:23` | `migrate` | `bun src/cli.ts` |
| `packages/worker/package.json:16` | `build:dry` | `vp exec wrangler deploy --dry-run` |

`vite.config.mts` and all `vite*.config.*` files contain **no task/script entry** with these names or commands. `vite.config.mts:151` contains only the test-coverage source glob `'packages/migrate/src/**/*.ts'`, not a task. No `vp.config.*` file exists.

## 4. D1 migration / SQL files
Filename ordering is lexical/numeric: `0001_rooms.sql`, `0002_cron.sql`, `0003_audit_chat.sql`. No root `migrations/` directory exists.

### `packages/worker/migrations/0001_rooms.sql`

**`packages/worker/migrations/0001_rooms.sql:1-23`**

~~~~~~~text
1:-- Phase 5.1 — D1 rooms index.
2:--
3:-- The DO holds the authoritative room state (snapshot/log/audit/chat/ecell
4:-- under state.storage). This table is the *cross-room* mirror used by
5:--
6:--   GET /_rooms       → list of room names (ordered by name)
7:--   GET /_roomlinks   → HTML `<a>` list of the above
8:--   GET /_roomtimes   → {room: updated_at} hash, sorted desc by value
9:--
10:-- See AGENTS.md §3.3 (data model) and §10.2 (Redis → DO/D1/KV mapping).
11:-- Every RoomDO snapshot write (POST/PUT /_/:room, POST /_do/commands)
12:-- upserts this row via `mirrorRoomToD1`; DELETE /_do/all removes it via
13:-- `deleteRoomFromD1`.
14:--
15:-- `cors_public` is pre-wired for the `?cors=1` flag (Phase 9+ — CORS
16:-- toggle on /_rooms etc). Defaults to 0; no Phase 5.1 code sets it yet.
17:CREATE TABLE rooms (
18:  room        TEXT PRIMARY KEY,
19:  updated_at  INTEGER NOT NULL,
20:  cors_public INTEGER NOT NULL DEFAULT 0
21:);
22:-- Descending index — /_roomtimes reads most-recent-first.
23:CREATE INDEX rooms_updated_at ON rooms(updated_at DESC);
~~~~~~~
### `packages/worker/migrations/0002_cron.sql`

**`packages/worker/migrations/0002_cron.sql:1-34`**

~~~~~~~text
1:-- Phase 9 — cron_triggers table.
2:--
3:-- Legacy behavior (src/main.ls:184-217 + src/sc.ls:220-244): a Redis hash
4:-- named `cron-list` mapped `<room>!<cell>` to a comma-separated list of
5:-- epoch-minute timestamps. An external cron pinged `GET /_timetrigger`
6:-- every minute to fire due entries and prune them from the list.
7:--
8:-- In the Worker world we replace both sides:
9:--   - Storage: this `cron_triggers` table (one row per fire_at).
10:--   - Pulse:   Cloudflare Cron Trigger (`*/1 * * * *`) invokes the
11:--              Worker's `scheduled()` handler directly. The legacy
12:--              `GET /_timetrigger` endpoint stays wired as a backwards-
13:--              compat surface for self-host users whose external cron
14:--              still pings it (§6.1 Q3 Phase 9 brief).
15:--
16:-- `fire_at` is epoch MINUTES (`Math.floor(Date.now()/60000)`) to keep
17:-- byte-equivalent semantics with the legacy `timeList` values. A row
18:-- is "due" when `fire_at <= now_minutes`.
19:--
20:-- PRIMARY KEY (room, cell, fire_at) lets a single cell carry multiple
21:-- future triggers — matches the legacy comma-list. Dedup is the
22:-- caller's responsibility (the `settimetrigger` handler does
23:-- `INSERT OR IGNORE`).
24:--
25:-- The secondary index on `fire_at` keeps the scheduled scan cheap even
26:-- as the table grows: the cron handler reads `WHERE fire_at <= ?` and
27:-- deletes the fired rows, so hot access is always by that column.
28:CREATE TABLE cron_triggers (
29:  room     TEXT NOT NULL,
30:  cell     TEXT NOT NULL,
31:  fire_at  INTEGER NOT NULL,  -- epoch minutes (matches legacy `timeList` semantics)
32:  PRIMARY KEY (room, cell, fire_at)
33:);
34:CREATE INDEX cron_triggers_fire_at ON cron_triggers(fire_at);
~~~~~~~
### `packages/worker/migrations/0003_audit_chat.sql`

**`packages/worker/migrations/0003_audit_chat.sql:1-38`**

~~~~~~~text
1:-- Storage-growth fold follow-up — durable audit_log + chat_log tables.
2:--
3:-- The DO's `state.storage` keeps only a bounded recent tail of `audit:` and
4:-- `chat:` (the command log is a ring buffer; the alarm trims chat/audit), so
5:-- per-room DO storage stops growing without limit. The COMPLETE record is
6:-- mirrored here in D1 at append time so the trims don't lose data:
7:--   - every command mirrors its audit entry (src/room.ts #applyCommandAndMirror)
8:--   - every chat message mirrors here (src/room.ts appendChat)
9:-- and the alarm only drops DO entries that have already been mirrored.
10:--
11:-- Both tables share the shape (room, seq, ts, body) with a (room, seq)
12:-- primary key so re-mirroring an already-durable entry is an idempotent
13:-- `ON CONFLICT(room, seq) DO NOTHING` no-op (safe under seed re-runs).
14:--
15:-- NOTE: src/lib/d1-schema.ts also creates these lazily (CREATE TABLE IF NOT
16:-- EXISTS on first "no such table" error), so the code self-heals even before
17:-- this migration runs — there is no deploy-ordering hazard. This file is the
18:-- explicit, reviewable schema of record.
19:--
20:-- The secondary index on `room` keeps the per-room delete (on DELETE
21:-- /_do/all) and any future per-room history read cheap.
22:CREATE TABLE audit_log (
23:  room  TEXT NOT NULL,
24:  seq   INTEGER NOT NULL,
25:  ts    INTEGER NOT NULL,
26:  body  TEXT NOT NULL,
27:  PRIMARY KEY (room, seq)
28:);
29:CREATE INDEX audit_log_room ON audit_log(room);
30:
31:CREATE TABLE chat_log (
32:  room  TEXT NOT NULL,
33:  seq   INTEGER NOT NULL,
34:  ts    INTEGER NOT NULL,
35:  body  TEXT NOT NULL,
36:  PRIMARY KEY (room, seq)
37:);
38:CREATE INDEX chat_log_room ON chat_log(room);
~~~~~~~
## 5. Self-host artifacts
### Artifact list

- Dockerfiles: `Dockerfile`, `tests/oracle/Dockerfile.oracle`, `deploy/legacy/Dockerfile`.
- Compose: `docker-compose.yml`, `docker-compose.proxy.yml`, `docker-compose.legacy.yml`, `tests/oracle/docker-compose.yml`.
- Helm: `helm/Chart.yaml`, `helm/values.yaml`, templates under `helm/templates/`; env-setting templates are `deployment.yaml` and `secret.yaml`.
- nginx: `deploy/nginx/ethercalc.conf`.

### Environment variables and defaults by artifact

| Artifact | Variable | Default/value | Source |
|---|---|---|---|
| Dockerfile | ETHERCALC_PORT | `8000` | `Dockerfile:88` |
| Dockerfile | ETHERCALC_HOST | `0.0.0.0` | `Dockerfile:89` |
| Dockerfile | ETHERCALC_DISABLE_ROOM_INDEX | `1` | `Dockerfile:90` |
| Dockerfile | ETHERCALC_DATA_DIR | `/data` | `Dockerfile:91` |
| tests/oracle/Dockerfile.oracle | ORACLE_SHA | build arg `042b731d9e98f1d30537e6cb656f65792afdecdf`; exported unchanged | `tests/oracle/Dockerfile.oracle:18-19` |
| deploy/legacy/Dockerfile | HOME | `/home/ethercalc` | `deploy/legacy/Dockerfile:16` |
| deploy/legacy/Dockerfile | ETHERCALC_KEY | unset/empty; command includes `--key` only when nonempty | `deploy/legacy/Dockerfile:21` |
| deploy/legacy/Dockerfile | ETHERCALC_BASEPATH | unset/empty; command includes `--basepath` only when nonempty | `deploy/legacy/Dockerfile:21` |
| deploy/legacy/Dockerfile | ETHERCALC_EXPIRE | unset/empty; command includes `--expire` only when nonempty | `deploy/legacy/Dockerfile:21` |
| docker-compose.yml / ethercalc | ETHERCALC_PORT | `8000` | `docker-compose.yml:42` |
| docker-compose.yml / ethercalc | ETHERCALC_HOST | `0.0.0.0` | `docker-compose.yml:43` |
| docker-compose.yml / ethercalc | ETHERCALC_KEY | empty | `docker-compose.yml:44` |
| docker-compose.yml / ethercalc | ETHERCALC_DISABLE_ROOM_INDEX | `1` | `docker-compose.yml:45` |
| docker-compose.yml / ethercalc | ETHERCALC_CORS | empty | `docker-compose.yml:46` |
| docker-compose.yml / ethercalc | ETHERCALC_BASEPATH | empty | `docker-compose.yml:47` |
| docker-compose.yml / ethercalc | ETHERCALC_EXPIRE | empty | `docker-compose.yml:48` |
| docker-compose.yml / ethercalc | ETHERCALC_AUTH | empty | `docker-compose.yml:52` |
| docker-compose.yml / ethercalc | ETHERCALC_RP_ID | empty | `docker-compose.yml:53` |
| docker-compose.yml / ethercalc | ETHERCALC_RP_NAME | empty | `docker-compose.yml:54` |
| docker-compose.yml / ethercalc | ETHERCALC_ORIGIN | empty | `docker-compose.yml:55` |
| docker-compose.yml / ethercalc | ETHERCALC_MIGRATE_TOKEN | empty | `docker-compose.yml:58` |
| docker-compose.yml / volume | ETHERCALC_LEGACY_DUMP | `./legacy-dump.rdb` | `docker-compose.yml:91` |
| docker-compose.yml / migrator | ETHERCALC_MIGRATE_TOKEN | empty | `docker-compose.yml:113,122` |
| docker-compose.yml / migrator | ETHERCALC_MIGRATE_CONCURRENCY | `8` | `docker-compose.yml:124` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_PORT | `8000` | `docker-compose.proxy.yml:28` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_HOST | literal `0.0.0.0` | `docker-compose.proxy.yml:29` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_KEY | empty | `docker-compose.proxy.yml:30` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_DISABLE_ROOM_INDEX | `1` | `docker-compose.proxy.yml:31` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_CORS | empty | `docker-compose.proxy.yml:32` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_EXPIRE | `2592000` | `docker-compose.proxy.yml:36` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_ROOM_CREATE_LIMIT | `1` | `docker-compose.proxy.yml:37` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_MIGRATE_TOKEN | empty | `docker-compose.proxy.yml:38` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_AUTH | empty | `docker-compose.proxy.yml:41` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_RP_ID | empty | `docker-compose.proxy.yml:42` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_RP_NAME | empty | `docker-compose.proxy.yml:43` |
| docker-compose.proxy.yml / ethercalc | ETHERCALC_ORIGIN | empty | `docker-compose.proxy.yml:44` |
| docker-compose.proxy.yml / proxy port | ETHERCALC_PROXY_HTTP_PORT | `80` | `docker-compose.proxy.yml:66` |
| docker-compose.proxy.yml / proxy port | ETHERCALC_PROXY_HTTPS_PORT | `443` (commented mapping) | `docker-compose.proxy.yml:69` |
| docker-compose.legacy.yml / ethercalc | REDIS_HOST | literal `redis` | `docker-compose.legacy.yml:22` |
| docker-compose.legacy.yml / ethercalc | REDIS_PORT | literal `6379` | `docker-compose.legacy.yml:23` |
| docker-compose.legacy.yml / ethercalc | ETHERCALC_KEY | empty | `docker-compose.legacy.yml:24` |
| docker-compose.legacy.yml / ethercalc | ETHERCALC_BASEPATH | empty | `docker-compose.legacy.yml:25` |
| docker-compose.legacy.yml / ethercalc | ETHERCALC_EXPIRE | empty | `docker-compose.legacy.yml:26` |
| docker-compose.legacy.yml / volume | ETHERCALC_LEGACY_REDIS_DATA | `./legacy-redis-data` | `docker-compose.legacy.yml:38` |
| docker-compose.legacy.yml / host port | ETHERCALC_PORT | `8000` | `docker-compose.legacy.yml:20` |
| tests/oracle/docker-compose.yml | REDIS_HOST | literal `redis` | `tests/oracle/docker-compose.yml:33` |
| tests/oracle/docker-compose.yml | REDIS_PORT | literal `6379` | `tests/oracle/docker-compose.yml:34` |
| tests/oracle/docker-compose.yml | OPENSHIFT_DATA_DIR | literal `.` | `tests/oracle/docker-compose.yml:35` |
| Helm deployment | ETHERCALC_HOST | literal `0.0.0.0` | `helm/templates/deployment.yaml:53-54` |
| Helm deployment | ETHERCALC_PORT | literal `8000` | `helm/templates/deployment.yaml:55-56` |
| Helm deployment | ETHERCALC_BASEPATH | omitted unless `config.basepath`; values default empty | `helm/templates/deployment.yaml:57-60`; `helm/values.yaml:96` |
| Helm deployment | ETHERCALC_DEFAULT_ROOM | omitted unless `config.defaultRoom`; values default empty | `helm/templates/deployment.yaml:61-64`; `helm/values.yaml:98` |
| Helm deployment | ETHERCALC_DISABLE_ROOM_INDEX | `1` because `config.disableRoomIndex: true` | `helm/templates/deployment.yaml:65-66`; `helm/values.yaml:100` |
| Helm deployment | ETHERCALC_CORS | omitted because `config.cors: false` | `helm/templates/deployment.yaml:67-70`; `helm/values.yaml:103` |
| Helm deployment | ETHERCALC_EXPIRE | omitted; values default empty | `helm/templates/deployment.yaml:71-74`; `helm/values.yaml:105` |
| Helm deployment | ETHERCALC_RATELIMIT | omitted; values default empty | `helm/templates/deployment.yaml:75-78`; `helm/values.yaml:108` |
| Helm deployment | ETHERCALC_ROOM_CREATE_LIMIT | omitted; values default empty | `helm/templates/deployment.yaml:79-82`; `helm/values.yaml:110` |
| Helm deployment | ETHERCALC_AUTH | omitted because `config.auth.enabled: false` | `helm/templates/deployment.yaml:83-85`; `helm/values.yaml:114` |
| Helm deployment | ETHERCALC_RP_ID | omitted; required if auth enabled; value default empty | `helm/templates/deployment.yaml:86-87`; `helm/values.yaml:115` |
| Helm deployment | ETHERCALC_RP_NAME | `EtherCalc` if auth enabled | `helm/templates/deployment.yaml:88-89`; `helm/values.yaml:116` |
| Helm deployment | ETHERCALC_ORIGIN | omitted; required if auth enabled; value default empty | `helm/templates/deployment.yaml:90-91`; `helm/values.yaml:117` |
| Helm Secret | ETHERCALC_KEY | empty unless `secrets.key` or existing Secret | `helm/templates/secret.yaml:10`; `helm/values.yaml:126` |
| Helm Secret | ETHERCALC_MIGRATE_TOKEN | empty unless `secrets.migrateToken` or existing Secret | `helm/templates/secret.yaml:11`; `helm/values.yaml:129` |
| nginx | NONE | nginx config sets no process environment variables | `deploy/nginx/ethercalc.conf:1-92` |

### Verbatim self-host files / env-bearing chart files

#### `Dockerfile`

**`Dockerfile:1-93`**

~~~~~~~text
1:# EtherCalc self-host image (§13 Q5, AGENTS.md §8 Phase 11).
2:#
3:# Launches `workerd serve` directly against a pre-bundled worker module,
4:# persisting Durable Object state to /data (a bind-mount volume). We
5:# deliberately do NOT run `wrangler dev` — wrangler's startup fetches
6:# Cloudflare metadata (`setupCf`), which fails in CI runners and in
7:# network-sandboxed environments like Sandstorm grains with an opaque
8:# "Unexpected server response: 101" that blocks the worker from ever
9:# binding a port. The standalone workerd path has no such dependency.
10:#
11:# Build pipeline inside the image:
12:#   1. bun install                              — workspace deps
13:#   2. bun run build:clients + build-assets.sh  — static tree under /app/assets
14:#   3. scripts/build-workerd-bundle.sh          — produces
15:#      /app/packages/worker/workerd/worker/index.js (the bundled ES
16:#      module) alongside the checked-in config.capnp.
17:#
18:# Runtime:
19:#   4. /app/bin/workerd-entrypoint.sh launches `workerd serve` with
20:#      per-invocation disk overrides (`-ddo=/data/do -dassets=…`).
21:
22:FROM oven/bun:1.3.14
23:
24:RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
25:
26:WORKDIR /app
27:
28:COPY package.json bun.lock ./
29:COPY packages ./packages
30:COPY bin ./bin
31:COPY scripts ./scripts
32:
33:COPY index.html start.html panels.html \
34:     favicon.ico favicon-16x16.png favicon-32x32.png \
35:     android-chrome-192x192.png apple-touch-icon.png \
36:     mstile-150x150.png mstile-310x310.png \
37:     safari-pinned-tab.svg browserconfig.xml \
38:     manifest.json manifest.appcache \
39:     ./
40:COPY l10n ./l10n
41:COPY images ./images
42:COPY static ./static
43:# Source for the license notice scripts/build-assets.ts copies to
44:# static/passkey/NOTICE (see vite.passkey.config.ts's banner comment in
45:# the passkey bundle it ships alongside).
46:COPY third-party ./third-party
47:
48:RUN bun install --frozen-lockfile
49:
50:# Build the client bundles + curated assets/ dir.
51:RUN bun run --cwd packages/client build \
52: && bun run --cwd packages/client-multi build \
53: && ./scripts/build-assets.sh
54:
55:# Build the standalone workerd bundle. Produces
56:# packages/worker/workerd/worker/index.js from wrangler's dry-run, plus
57:# a symlink `packages/worker/workerd/assets` → /app/assets which the
58:# runtime overrides via the `-dassets=` flag anyway. Remove the symlink
59:# after build so we can bake in an explicit path below.
60:RUN ./scripts/build-workerd-bundle.sh \
61: && rm -f /app/packages/worker/workerd/assets
62:
63:# Persistent storage for Durable Object state. `workerd serve`'s
64:# on-disk DO backend writes SQLite files under /data/do/<uniqueKey>/.
65:# Owned by the unprivileged `bun` user (uid 1000, ships with oven/bun)
66:# so named volumes initialise writable. No `USER` directive on purpose:
67:# Linux bind mounts (./ethercalc-data) arrive root-owned, so the
68:# entrypoint starts as root, chowns the data dir once, then drops to
69:# `bun` via setpriv before exec'ing workerd (SH-8). Kubernetes deploys
70:# skip the drop — the Helm chart sets runAsNonRoot + fsGroup instead.
71:RUN mkdir -p /data && chown bun:bun /data
72:VOLUME ["/data"]
73:
74:EXPOSE 8000
75:
76:# Environment variables that override runtime behavior. Documented here so
77:# `docker inspect` users can see them without reading README:
78:#   ETHERCALC_PORT                — listening port (default 8000)
79:#   ETHERCALC_HOST                — listening address (default 0.0.0.0)
80:#   ETHERCALC_KEY                 — HMAC secret for --key auth (§6.4)
81:#   ETHERCALC_DISABLE_ROOM_INDEX  — "1" to hide /_rooms* and /_exists
82:#   ETHERCALC_CORS                — legacy room-index gate; CORS headers are always on
83:#   ETHERCALC_BASEPATH            — URL prefix when running behind a reverse proxy
84:#   ETHERCALC_EXPIRE              — seconds of inactivity before a room is pruned
85:#   ETHERCALC_RATELIMIT           — optional per-IP HTTP limit (off by default)
86:#   ETHERCALC_DEFAULT_ROOM        — single-grain default room (302 from `/`)
87:#   ETHERCALC_MIGRATE_TOKEN       — enable PUT /_migrate/seed
88:ENV ETHERCALC_PORT=8000 \
89:    ETHERCALC_HOST=0.0.0.0 \
90:    ETHERCALC_DISABLE_ROOM_INDEX=1 \
91:    ETHERCALC_DATA_DIR=/data
92:
93:CMD ["bash", "/app/bin/workerd-entrypoint.sh"]
~~~~~~~
#### `tests/oracle/Dockerfile.oracle`

**`tests/oracle/Dockerfile.oracle:1-48`**

~~~~~~~text
1:# Oracle image: current-main EtherCalc (pre-rewrite, LiveScript/zappajs) boot via bun.
2:#
3:# This is the ground truth that Phase 3+ scenarios record against. It
4:# reads from the Redis sidecar service on host `redis:6379`.
5:#
6:# The pinned SHA is passed in at build time via --build-arg so the
7:# docker-compose file can keep it in one place. Default matches the
8:# last legacy commit on origin/main at the time of Phase 3 kickoff:
9:#   042b731d9e98f1d30537e6cb656f65792afdecdf — "Switch from node/npm to bun"
10:#
11:# We use Node 20 on Debian + layer Bun on top: the zappajs 0.5.x stack
12:# only ships Node-compatible dependencies, and `bun install` handles
13:# all of them via its npm compat shim. `bun app.js` runs the server
14:# (app.js is compiled LiveScript output checked into the repo).
15:
16:FROM node:20-bookworm-slim
17:
18:ARG ORACLE_SHA=042b731d9e98f1d30537e6cb656f65792afdecdf
19:ENV ORACLE_SHA=${ORACLE_SHA}
20:
21:RUN apt-get update \
22:    && apt-get install -y --no-install-recommends git ca-certificates curl unzip \
23:    && rm -rf /var/lib/apt/lists/*
24:
25:# Install bun (the legacy app's runtime since the 042b731 commit).
26:RUN curl -fsSL https://bun.sh/install | BUN_INSTALL=/opt/bun bash \
27:    && ln -s /opt/bun/bin/bun /usr/local/bin/bun
28:
29:WORKDIR /srv/ethercalc
30:
31:# Clone the pinned SHA. Using a shallow clone keeps the image small;
32:# passing --depth=1 with a specific SHA requires a two-step fetch.
33:RUN git init . \
34:    && git remote add origin https://github.com/audreyt/ethercalc.git \
35:    && git fetch --depth 1 origin ${ORACLE_SHA} \
36:    && git checkout FETCH_HEAD
37:
38:# Add runtime-compat patch to stringify nextTriggerTime to avoid TypeError on newer Bun/Node
39:RUN sed -i "s/nextTriggerTime, 'utf8'/String(nextTriggerTime), 'utf8'/g" main.js sc.js
40:
41:RUN bun install
42:
43:EXPOSE 8000
44:
45:# CORS disabled on the oracle: lets us record `/_rooms`, `/_roomlinks`,
46:# `/_roomtimes` (which are 403-gated with CORS on). Workers can opt-in
47:# CORS via the recorder scenario headers when we get there.
48:CMD ["bun", "app.js", "--port", "8000", "--host", "0.0.0.0"]
~~~~~~~
#### `deploy/legacy/Dockerfile`

**`deploy/legacy/Dockerfile:1-21`**

~~~~~~~text
1:# Legacy Redis-backed EtherCalc (Node + LiveScript).
2:# Last npm release before the TypeScript rewrite: 0.20201228.1
3:FROM node:20-bookworm-slim
4:
5:RUN apt-get update \
6: && apt-get install -y --no-install-recommends python3 make g++ \
7: && rm -rf /var/lib/apt/lists/*
8:
9:RUN useradd ethercalc --create-home \
10: && npm install -g ethercalc@0.20201228.1 \
11: && apt-get purge -y python3 make g++ \
12: && apt-get autoremove -y
13:
14:USER ethercalc
15:WORKDIR /home/ethercalc
16:ENV HOME=/home/ethercalc
17:EXPOSE 8000
18:
19:# REDIS_HOST / REDIS_PORT must point at the redis service.
20:# Optional: ETHERCALC_KEY, ETHERCALC_BASEPATH, ETHERCALC_EXPIRE.
21:CMD ["sh", "-c", "exec ethercalc --host 0.0.0.0 --port 8000 --cors ${ETHERCALC_KEY:+--key \"$ETHERCALC_KEY\"} ${ETHERCALC_BASEPATH:+--basepath \"$ETHERCALC_BASEPATH\"} ${ETHERCALC_EXPIRE:+--expire \"$ETHERCALC_EXPIRE\"}"]
~~~~~~~
#### `docker-compose.yml`

**`docker-compose.yml:1-125`**

~~~~~~~text
1:# EtherCalc self-host compose file (§13 Q5).
2:#
3:# Default service — the standalone workerd Worker. No Redis: room state
4:# lives in Durable Object SQLite files under the `./ethercalc-data`
5:# bind-mounted at /data in the container. `docker compose up -d` is the
6:# whole install story.
7:#
8:# Migration profile — activated with `--profile migrate`, adds two
9:# short-lived services (`legacy-redis` + `migrator`) that ingest a
10:# legacy Redis dump.rdb into the new Worker in one shot. Driven by
11:# `bin/migrate-legacy.sh`; end users should not invoke the profile
12:# directly.
13:
14:services:
15:  ethercalc:
16:    build:
17:      context: .
18:      dockerfile: Dockerfile
19:    image: ethercalc:selfhost
20:    container_name: ethercalc
21:    restart: unless-stopped
22:    # Contain a Worker compromise: application bytes stay immutable and
23:    # setuid/file-capability privilege gains are disabled. Durable state keeps
24:    # its dedicated writable mount; libc/workerd scratch is isolated in tmpfs.
25:    read_only: true
26:    security_opt:
27:      - no-new-privileges:true
28:    tmpfs:
29:      - /tmp:size=64m,mode=1777
30:    ports:
31:      # Local-only by default. Internet-facing installs MUST use the proxy
32:      # compose file (or an equivalent hardened reverse proxy).
33:      - "127.0.0.1:${ETHERCALC_PORT:-8000}:${ETHERCALC_PORT:-8000}"
34:    volumes:
35:      # Persistent Durable Object state. Survives container restarts.
36:      # Created on first `up` if missing.
37:      - ./ethercalc-data:/data
38:    environment:
39:      # All variables are optional; sensible defaults live in the image.
40:      # Pass through from the host so `ETHERCALC_KEY=secret docker compose
41:      # up -d` Just Works without editing this file.
42:      ETHERCALC_PORT: "${ETHERCALC_PORT:-8000}"
43:      ETHERCALC_HOST: "${ETHERCALC_HOST:-0.0.0.0}"
44:      ETHERCALC_KEY: "${ETHERCALC_KEY:-}"
45:      ETHERCALC_DISABLE_ROOM_INDEX: "${ETHERCALC_DISABLE_ROOM_INDEX:-1}"
46:      ETHERCALC_CORS: "${ETHERCALC_CORS:-}"
47:      ETHERCALC_BASEPATH: "${ETHERCALC_BASEPATH:-}"
48:      ETHERCALC_EXPIRE: "${ETHERCALC_EXPIRE:-}"
49:      # Phase A — passkey auth (all four required to enable; see
50:      # docs/SELFHOST_HARDENING.md). RP ID / origin must match the URL
51:      # users visit, e.g. sheets.example.com / https://sheets.example.com.
52:      ETHERCALC_AUTH: "${ETHERCALC_AUTH:-}"
53:      ETHERCALC_RP_ID: "${ETHERCALC_RP_ID:-}"
54:      ETHERCALC_RP_NAME: "${ETHERCALC_RP_NAME:-}"
55:      ETHERCALC_ORIGIN: "${ETHERCALC_ORIGIN:-}"
56:      # Always forwarded; the migrate endpoint returns 404 when unset
57:      # so leaving it blank keeps the route invisible in normal runs.
58:      ETHERCALC_MIGRATE_TOKEN: "${ETHERCALC_MIGRATE_TOKEN:-}"
59:    # Health check lets the migrator service wait until /_health is
60:    # answering before firing the first seed PUT.
61:    healthcheck:
62:      test: ["CMD-SHELL", "curl -fsS http://localhost:8000/_health >/dev/null || exit 1"]
63:      interval: 2s
64:      timeout: 2s
65:      retries: 60
66:      start_period: 5s
67:
68:  # ────────────────────────── migration profile ──────────────────────────
69:  # Activated with `docker compose --profile migrate up`. Typical entry
70:  # point is `./bin/migrate-legacy.sh`, which wires the dump file, token,
71:  # and post-run backup in one go.
72:
73:  legacy-redis:
74:    profiles: ["migrate"]
75:    image: redis:7-alpine
76:    container_name: ethercalc-legacy-redis
77:    # Redis's upstream entrypoint chowns /data/* at startup, which
78:    # fails against a read-only bind mount. Bind the user's dump to
79:    # an /input/ stage instead, copy it into the container-owned
80:    # /data at boot, then exec redis. Side effect: peak disk use
81:    # during migration is 2× the dump size (acceptable — migration
82:    # is transient, and the host copy is preserved untouched).
83:    entrypoint: ["/bin/sh", "-c"]
84:    command:
85:      - 'cp /input/dump.rdb /data/dump.rdb && exec redis-server --dir /data --dbfilename dump.rdb --save "" --appendonly no'
86:    volumes:
87:      # `ETHERCALC_LEGACY_DUMP` is set by `bin/migrate-legacy.sh` to
88:      # the absolute path of the user's dump.rdb. `:ro` guarantees the
89:      # source file is never modified even if something in the stack
90:      # misbehaves.
91:      - "${ETHERCALC_LEGACY_DUMP:-./legacy-dump.rdb}:/input/dump.rdb:ro"
92:    healthcheck:
93:      test: ["CMD", "redis-cli", "ping"]
94:      interval: 2s
95:      timeout: 2s
96:      retries: 60
97:      start_period: 5s
98:
99:  migrator:
100:    profiles: ["migrate"]
101:    image: ethercalc:selfhost
102:    container_name: ethercalc-migrator
103:    # Same image as the worker — bun + bin/ethercalc are already there.
104:    # One-shot: `ethercalc migrate`, then exit. `--abort-on-container-
105:    # exit` + `--exit-code-from migrator` on `docker compose up` makes
106:    # the wrapper script fail loudly if the migrator itself fails.
107:    depends_on:
108:      legacy-redis:
109:        condition: service_healthy
110:      ethercalc:
111:        condition: service_healthy
112:    environment:
113:      ETHERCALC_MIGRATE_TOKEN: "${ETHERCALC_MIGRATE_TOKEN:-}"
114:    entrypoint: ["/app/bin/ethercalc"]
115:    command:
116:      - "migrate"
117:      - "--source"
118:      - "redis://legacy-redis:6379"
119:      - "--target"
120:      - "http://ethercalc:8000"
121:      - "--token"
122:      - "${ETHERCALC_MIGRATE_TOKEN:-}"
123:      - "--concurrency"
124:      - "${ETHERCALC_MIGRATE_CONCURRENCY:-8}"
125:    restart: "no"
~~~~~~~
#### `docker-compose.proxy.yml`

**`docker-compose.proxy.yml:1-72`**

~~~~~~~text
1:# Alternate internet-facing self-host recipe. It keeps workerd off the host
2:# network and places nginx in front for TLS termination and abuse throttling.
3:#
4:#   docker compose -f docker-compose.proxy.yml up -d
5:#
6:# The nginx config lives at deploy/nginx/ethercalc.conf. For production HTTPS:
7:# place certificates under deploy/nginx/certs/, uncomment the 443 listener in
8:# that config, AND uncomment the 443 ports mapping on the proxy service below
9:# — or adapt the same upstream/limit rules to your existing edge.
10:
11:services:
12:  ethercalc:
13:    build:
14:      context: .
15:      dockerfile: Dockerfile
16:    image: ethercalc:selfhost
17:    restart: unless-stopped
18:    read_only: true
19:    security_opt:
20:      - no-new-privileges:true
21:    tmpfs:
22:      - /tmp:size=64m,mode=1777
23:    expose:
24:      - "8000"
25:    volumes:
26:      - ./ethercalc-data:/data
27:    environment:
28:      ETHERCALC_PORT: "${ETHERCALC_PORT:-8000}"
29:      ETHERCALC_HOST: "0.0.0.0"
30:      ETHERCALC_KEY: "${ETHERCALC_KEY:-}"
31:      ETHERCALC_DISABLE_ROOM_INDEX: "${ETHERCALC_DISABLE_ROOM_INDEX:-1}"
32:      ETHERCALC_CORS: "${ETHERCALC_CORS:-}"
33:      # No ETHERCALC_BASEPATH here on purpose: the bundled nginx config
34:      # proxies at the URL root and does not strip a prefix, so setting a
35:      # basepath behind it produces broken links.
36:      ETHERCALC_EXPIRE: "${ETHERCALC_EXPIRE:-2592000}"
37:      ETHERCALC_ROOM_CREATE_LIMIT: "${ETHERCALC_ROOM_CREATE_LIMIT:-1}"
38:      ETHERCALC_MIGRATE_TOKEN: "${ETHERCALC_MIGRATE_TOKEN:-}"
39:      # Passkey trust anchors. All four must be set together; the public
40:      # origin must be the HTTPS URL users actually visit through this proxy.
41:      ETHERCALC_AUTH: "${ETHERCALC_AUTH:-}"
42:      ETHERCALC_RP_ID: "${ETHERCALC_RP_ID:-}"
43:      ETHERCALC_RP_NAME: "${ETHERCALC_RP_NAME:-}"
44:      ETHERCALC_ORIGIN: "${ETHERCALC_ORIGIN:-}"
45:    healthcheck:
46:      test: ["CMD-SHELL", "curl -fsS http://localhost:8000/_health >/dev/null || exit 1"]
47:      interval: 2s
48:      timeout: 2s
49:      retries: 60
50:      start_period: 5s
51:
52:  proxy:
53:    image: nginx:1.27-alpine
54:    restart: unless-stopped
55:    read_only: true
56:    security_opt:
57:      - no-new-privileges:true
58:    tmpfs:
59:      - /var/cache/nginx:size=64m
60:      - /var/run:size=1m
61:      - /tmp:size=16m,mode=1777
62:    depends_on:
63:      ethercalc:
64:        condition: service_healthy
65:    ports:
66:      - "${ETHERCALC_PROXY_HTTP_PORT:-80}:80"
67:      # Uncomment for HTTPS (together with the 443 listener in
68:      # deploy/nginx/ethercalc.conf and certs in deploy/nginx/certs/):
69:      # - "${ETHERCALC_PROXY_HTTPS_PORT:-443}:443"
70:    volumes:
71:      - ./deploy/nginx/ethercalc.conf:/etc/nginx/conf.d/default.conf:ro
72:      - ./deploy/nginx/certs:/etc/nginx/certs:ro
~~~~~~~
#### `docker-compose.legacy.yml`

**`docker-compose.legacy.yml:1-45`**

~~~~~~~text
1:# Legacy Redis-backed EtherCalc — the pre-2026 Node/LiveScript stack.
2:#
3:# Use this when you want to keep an existing Redis data directory and are
4:# not ready to migrate to the new workerd/Durable Object self-host path.
5:#
6:#   docker compose -f docker-compose.legacy.yml up -d
7:#
8:# Pin the image explicitly — `audreyt/ethercalc:latest` now ships the
9:# TypeScript rewrite and does not speak Redis.
10:
11:services:
12:  ethercalc:
13:    build:
14:      context: .
15:      dockerfile: deploy/legacy/Dockerfile
16:    image: audreyt/ethercalc:0.20201228.1
17:    container_name: ethercalc-legacy
18:    restart: unless-stopped
19:    ports:
20:      - "${ETHERCALC_PORT:-8000}:8000"
21:    environment:
22:      REDIS_HOST: redis
23:      REDIS_PORT: "6379"
24:      ETHERCALC_KEY: "${ETHERCALC_KEY:-}"
25:      ETHERCALC_BASEPATH: "${ETHERCALC_BASEPATH:-}"
26:      ETHERCALC_EXPIRE: "${ETHERCALC_EXPIRE:-}"
27:    depends_on:
28:      redis:
29:        condition: service_healthy
30:
31:  redis:
32:    image: redis:7-alpine
33:    container_name: ethercalc-legacy-redis
34:    restart: unless-stopped
35:    volumes:
36:      # Point at your existing Redis data dir, e.g.
37:      # ETHERCALC_LEGACY_REDIS_DATA=/var/lib/redis docker compose -f docker-compose.legacy.yml up -d
38:      - "${ETHERCALC_LEGACY_REDIS_DATA:-./legacy-redis-data}:/data"
39:    command: redis-server --appendonly yes
40:    healthcheck:
41:      test: ["CMD", "redis-cli", "ping"]
42:      interval: 2s
43:      timeout: 2s
44:      retries: 30
45:      start_period: 3s
~~~~~~~
#### `tests/oracle/docker-compose.yml`

**`tests/oracle/docker-compose.yml:1-40`**

~~~~~~~text
1:# Oracle stack — EtherCalc (current main) + Redis, isolated from the
2:# new worker. Pinned SHA captured at Phase 3 kickoff:
3:#   oracle_sha: 042b731d9e98f1d30537e6cb656f65792afdecdf
4:# That's the last legacy LiveScript/zappajs commit on origin/main
5:# before the TypeScript rewrite scaffolding (Phases 1-2) landed on
6:# local main. Bump this whenever the upstream oracle moves — all
7:# recordings must be re-captured when it does.
8:#
9:# To bring it up:
10:#   docker compose -f tests/oracle/docker-compose.yml up --build -d
11:# To tear down:
12:#   docker compose -f tests/oracle/docker-compose.yml down -v
13:#
14:# The oracle listens on host :8000. Redis stays internal-only on the
15:# default bridge network.
16:
17:services:
18:  redis:
19:    image: redis:7-alpine
20:    command: ["redis-server", "--appendonly", "yes"]
21:    volumes:
22:      - redis-data:/data
23:
24:  ethercalc:
25:    build:
26:      context: .
27:      dockerfile: Dockerfile.oracle
28:      args:
29:        ORACLE_SHA: 042b731d9e98f1d30537e6cb656f65792afdecdf
30:    depends_on:
31:      - redis
32:    environment:
33:      REDIS_HOST: redis
34:      REDIS_PORT: "6379"
35:      OPENSHIFT_DATA_DIR: "."
36:    ports:
37:      - "8000:8000"
38:
39:volumes:
40:  redis-data:
~~~~~~~
#### `helm/Chart.yaml`

**`helm/Chart.yaml:1-22`**

~~~~~~~text
1:apiVersion: v2
2:name: ethercalc
3:description: EtherCalc — multi-user spreadsheet server (TypeScript rewrite, self-hosted via workerd)
4:type: application
5:# Chart version bumps on chart changes; appVersion follows the image tag
6:# produced by `.github/workflows/publish-image.yml`.
7:version: 0.3.2
8:appVersion: "0.20260612.4"
9:home: https://ethercalc.net/
10:sources:
11:  - https://github.com/audreyt/ethercalc
12:maintainers:
13:  - name: Audrey Tang
14:    email: audreyt@audreyt.org
15:    url: https://audreyt.org/
16:keywords:
17:  - ethercalc
18:  - spreadsheet
19:  - collaboration
20:  - realtime
21:  - socialcalc
22:icon: https://ethercalc.net/favicon.ico
~~~~~~~
#### `helm/values.yaml`

**`helm/values.yaml:1-151`**

~~~~~~~text
1:# Default values for EtherCalc.
2:#
3:# IMPORTANT: EtherCalc's self-host image runs a single `workerd serve`
4:# process that owns all Durable Object state locally (under /data). Two
5:# replicas sharing the PVC will silently corrupt rooms — there's no
6:# consensus layer to keep them in sync. The chart enforces replicas: 1
7:# and strategy: Recreate. Do NOT override these.
8:
9:image:
10:  repository: audreyt/ethercalc
11:  # Overrides Chart.yaml's appVersion if set. Leave empty to pin to the
12:  # chart-compatible image version.
13:  tag: ""
14:  pullPolicy: IfNotPresent
15:
16:imagePullSecrets: []
17:nameOverride: ""
18:fullnameOverride: ""
19:
20:serviceAccount:
21:  create: true
22:  annotations: {}
23:  name: ""
24:
25:podAnnotations: {}
26:podLabels: {}
27:
28:# Restricted-profile defaults (SH-8). The image's unprivileged user is
29:# `bun` (uid/gid 1000); fsGroup makes the PVC writable without the
30:# entrypoint's root chown path, and the entrypoint never writes to the
31:# rootfs (socket override is a workerd CLI flag), so a read-only root
32:# filesystem works out of the box. /tmp is an emptyDir mount.
33:podSecurityContext:
34:  runAsNonRoot: true
35:  runAsUser: 1000
36:  runAsGroup: 1000
37:  fsGroup: 1000
38:  fsGroupChangePolicy: OnRootMismatch
39:  seccompProfile:
40:    type: RuntimeDefault
41:securityContext:
42:  allowPrivilegeEscalation: false
43:  readOnlyRootFilesystem: true
44:  capabilities:
45:    drop:
46:      - ALL
47:
48:service:
49:  type: ClusterIP
50:  port: 8000
51:
52:ingress:
53:  enabled: false
54:  className: ""
55:  annotations: {}
56:    # kubernetes.io/ingress.class: nginx
57:    # cert-manager.io/cluster-issuer: letsencrypt-prod
58:    # nginx.ingress.kubernetes.io/limit-rps: "10"
59:    # nginx.ingress.kubernetes.io/limit-connections: "20"
60:  hosts:
61:    - host: ethercalc.local
62:      paths:
63:        - path: /
64:          pathType: Prefix
65:  tls: []
66:  #  - secretName: ethercalc-tls
67:  #    hosts:
68:  #      - ethercalc.local
69:
70:resources:
71:  # Reasonable defaults for a small spreadsheet deployment. Raise `memory`
72:  # if rooms grow large — each live room holds its sheet in RAM.
73:  limits:
74:    cpu: 1000m
75:    memory: 1Gi
76:  requests:
77:    cpu: 100m
78:    memory: 256Mi
79:
80:persistence:
81:  # Durable Object state lives on disk under /data.
82:  # Disable only for ephemeral dev setups; production MUST have this on.
83:  enabled: true
84:  # Leave empty to use the cluster default storage class.
85:  storageClass: ""
86:  accessMode: ReadWriteOnce
87:  size: 10Gi
88:  # Retain the PVC when the chart is uninstalled so data survives a
89:  # `helm uninstall` + `helm install` cycle.
90:  existingClaim: ""
91:
92:# Runtime configuration. These map 1:1 to the env vars documented in the
93:# README's "Environment variables" table.
94:config:
95:  # Base URL prefix when EtherCalc sits behind a reverse proxy at a sub-path.
96:  basepath: ""
97:  # When set, EtherCalc redirects `/` to this room name.
98:  defaultRoom: ""
99:  # Hide `/_rooms`, `/_roomlinks`, `/_roomtimes`, and `/_exists/:room`.
100:  disableRoomIndex: true
101:  # Legacy room-index gate. The Worker currently emits CORS headers
102:  # unconditionally for embed compatibility.
103:  cors: false
104:  # Seconds of inactivity before a room is pruned. Leave empty to disable.
105:  expire: ""
106:  # Optional in-Worker per-IP HTTP limit (off by default). "1" = 10 req/s;
107:  # belt-and-suspenders behind ingress rate limits — not a substitute.
108:  rateLimit: ""
109:  # Optional per-IP cap on room creation (POST /_, /_new, /_from, PUT /_/room).
110:  roomCreateLimit: ""
111:  # Optional passkey accounts/private-room UI. Enabling requires all three
112:  # WebAuthn trust anchors; origin must be the exact public HTTPS origin.
113:  auth:
114:    enabled: false
115:    rpId: ""
116:    rpName: "EtherCalc"
117:    origin: ""
118:
119:# Secrets held in a Kubernetes Secret, never in values.yaml plaintext in
120:# production. Set `existingSecret: <name>` to reference an external Secret
121:# you created out-of-band; otherwise the chart will create one from these
122:# fields at install time.
123:secrets:
124:  existingSecret: ""
125:  # HMAC key for read-only vs. edit auth. Generate with e.g. `openssl rand -hex 32`.
126:  key: ""
127:  # Bearer token gating `PUT /_migrate/seed/:room`. Required for
128:  # `ethercalc migrate --token ...`.
129:  migrateToken: ""
130:
131:livenessProbe:
132:  httpGet:
133:    path: /_health
134:    port: http
135:  initialDelaySeconds: 10
136:  periodSeconds: 30
137:  timeoutSeconds: 5
138:  failureThreshold: 3
139:
140:readinessProbe:
141:  httpGet:
142:    path: /_health
143:    port: http
144:  initialDelaySeconds: 5
145:  periodSeconds: 10
146:  timeoutSeconds: 3
147:  failureThreshold: 3
148:
149:nodeSelector: {}
150:tolerations: []
151:affinity: {}
~~~~~~~
#### `helm/templates/deployment.yaml`

**`helm/templates/deployment.yaml:1-145`**

~~~~~~~text
1:apiVersion: apps/v1
2:kind: Deployment
3:metadata:
4:  name: {{ include "ethercalc.fullname" . }}
5:  labels:
6:    {{- include "ethercalc.labels" . | nindent 4 }}
7:spec:
8:  # HARD INVARIANT: replicas MUST stay 1 and strategy MUST be Recreate.
9:  # The worker is a single-process workerd runtime; two pods sharing
10:  # the PVC would corrupt Durable Object state silently, with no
11:  # consensus layer to reconcile them. See chart values.yaml preamble.
12:  replicas: 1
13:  strategy:
14:    type: Recreate
15:  selector:
16:    matchLabels:
17:      {{- include "ethercalc.selectorLabels" . | nindent 6 }}
18:  template:
19:    metadata:
20:      {{- with .Values.podAnnotations }}
21:      annotations:
22:        {{- toYaml . | nindent 8 }}
23:      {{- end }}
24:      labels:
25:        {{- include "ethercalc.labels" . | nindent 8 }}
26:        {{- with .Values.podLabels }}
27:        {{- toYaml . | nindent 8 }}
28:        {{- end }}
29:    spec:
30:      {{- with .Values.imagePullSecrets }}
31:      imagePullSecrets:
32:        {{- toYaml . | nindent 8 }}
33:      {{- end }}
34:      serviceAccountName: {{ include "ethercalc.serviceAccountName" . }}
35:      automountServiceAccountToken: false
36:      {{- with .Values.podSecurityContext }}
37:      securityContext:
38:        {{- toYaml . | nindent 8 }}
39:      {{- end }}
40:      containers:
41:        - name: {{ .Chart.Name }}
42:          image: {{ include "ethercalc.image" . | quote }}
43:          imagePullPolicy: {{ .Values.image.pullPolicy }}
44:          {{- with .Values.securityContext }}
45:          securityContext:
46:            {{- toYaml . | nindent 12 }}
47:          {{- end }}
48:          ports:
49:            - name: http
50:              containerPort: 8000
51:              protocol: TCP
52:          env:
53:            - name: ETHERCALC_HOST
54:              value: "0.0.0.0"
55:            - name: ETHERCALC_PORT
56:              value: "8000"
57:            {{- if .Values.config.basepath }}
58:            - name: ETHERCALC_BASEPATH
59:              value: {{ .Values.config.basepath | quote }}
60:            {{- end }}
61:            {{- if .Values.config.defaultRoom }}
62:            - name: ETHERCALC_DEFAULT_ROOM
63:              value: {{ .Values.config.defaultRoom | quote }}
64:            {{- end }}
65:            - name: ETHERCALC_DISABLE_ROOM_INDEX
66:              value: {{ ternary "1" "0" .Values.config.disableRoomIndex | quote }}
67:            {{- if .Values.config.cors }}
68:            - name: ETHERCALC_CORS
69:              value: "1"
70:            {{- end }}
71:            {{- if .Values.config.expire }}
72:            - name: ETHERCALC_EXPIRE
73:              value: {{ .Values.config.expire | quote }}
74:            {{- end }}
75:            {{- if .Values.config.rateLimit }}
76:            - name: ETHERCALC_RATELIMIT
77:              value: {{ .Values.config.rateLimit | quote }}
78:            {{- end }}
79:            {{- if .Values.config.roomCreateLimit }}
80:            - name: ETHERCALC_ROOM_CREATE_LIMIT
81:              value: {{ .Values.config.roomCreateLimit | quote }}
82:            {{- end }}
83:            {{- if .Values.config.auth.enabled }}
84:            - name: ETHERCALC_AUTH
85:              value: "1"
86:            - name: ETHERCALC_RP_ID
87:              value: {{ required "config.auth.rpId is required when passkey auth is enabled" .Values.config.auth.rpId | quote }}
88:            - name: ETHERCALC_RP_NAME
89:              value: {{ required "config.auth.rpName is required when passkey auth is enabled" .Values.config.auth.rpName | quote }}
90:            - name: ETHERCALC_ORIGIN
91:              value: {{ required "config.auth.origin is required when passkey auth is enabled" .Values.config.auth.origin | quote }}
92:            {{- end }}
93:            - name: ETHERCALC_KEY
94:              valueFrom:
95:                secretKeyRef:
96:                  name: {{ include "ethercalc.secretName" . }}
97:                  key: ETHERCALC_KEY
98:                  optional: true
99:            - name: ETHERCALC_MIGRATE_TOKEN
100:              valueFrom:
101:                secretKeyRef:
102:                  name: {{ include "ethercalc.secretName" . }}
103:                  key: ETHERCALC_MIGRATE_TOKEN
104:                  optional: true
105:          {{- with .Values.livenessProbe }}
106:          livenessProbe:
107:            {{- toYaml . | nindent 12 }}
108:          {{- end }}
109:          {{- with .Values.readinessProbe }}
110:          readinessProbe:
111:            {{- toYaml . | nindent 12 }}
112:          {{- end }}
113:          {{- with .Values.resources }}
114:          resources:
115:            {{- toYaml . | nindent 12 }}
116:          {{- end }}
117:          volumeMounts:
118:            - name: data
119:              mountPath: /data
120:            # Writable scratch space — the rootfs is read-only by default
121:            # (values.yaml securityContext), and SQLite/libc expect /tmp.
122:            - name: tmp
123:              mountPath: /tmp
124:      volumes:
125:        - name: data
126:          {{- if .Values.persistence.enabled }}
127:          persistentVolumeClaim:
128:            claimName: {{ include "ethercalc.pvcName" . }}
129:          {{- else }}
130:          emptyDir: {}
131:          {{- end }}
132:        - name: tmp
133:          emptyDir: {}
134:      {{- with .Values.nodeSelector }}
135:      nodeSelector:
136:        {{- toYaml . | nindent 8 }}
137:      {{- end }}
138:      {{- with .Values.affinity }}
139:      affinity:
140:        {{- toYaml . | nindent 8 }}
141:      {{- end }}
142:      {{- with .Values.tolerations }}
143:      tolerations:
144:        {{- toYaml . | nindent 8 }}
145:      {{- end }}
~~~~~~~
#### `helm/templates/secret.yaml`

**`helm/templates/secret.yaml:1-12`**

~~~~~~~text
1:{{- if not .Values.secrets.existingSecret }}
2:apiVersion: v1
3:kind: Secret
4:metadata:
5:  name: {{ include "ethercalc.secretName" . }}
6:  labels:
7:    {{- include "ethercalc.labels" . | nindent 4 }}
8:type: Opaque
9:stringData:
10:  ETHERCALC_KEY: {{ .Values.secrets.key | default "" | quote }}
11:  ETHERCALC_MIGRATE_TOKEN: {{ .Values.secrets.migrateToken | default "" | quote }}
12:{{- end }}
~~~~~~~
#### `deploy/nginx/ethercalc.conf`

**`deploy/nginx/ethercalc.conf:1-92`**

~~~~~~~text
1:# nginx reverse-proxy recipe for internet-facing self-hosts.
2:# This file is included inside nginx's `http {}` context by the official image.
3:#
4:# Note on basepath: this recipe proxies the app at the URL root and does
5:# NOT strip a path prefix. Do not set ETHERCALC_BASEPATH behind it —
6:# the worker expects a prefix-stripping edge when a basepath is in use.
7:
8:limit_req_zone $binary_remote_addr zone=ethercalc_api:10m rate=10r/s;
9:# Two conn zones: WebSockets are held open for a tab's whole lifetime, so
10:# they get a generous budget; plain HTTP requests are short-lived and a
11:# small in-flight cap is plenty. (A single shared zone with mixed limits
12:# would let idle WS tabs starve HTTP requests behind one NAT/CGNAT IP.)
13:limit_conn_zone $binary_remote_addr zone=ethercalc_conn_ws:10m;
14:limit_conn_zone $binary_remote_addr zone=ethercalc_conn_http:10m;
15:
16:map $http_upgrade $connection_upgrade {
17:  default upgrade;
18:  '' close;
19:}
20:
21:upstream ethercalc_backend {
22:  server ethercalc:8000;
23:}
24:
25:server {
26:  listen 80;
27:  server_name _;
28:
29:  # For production HTTPS, uncomment these lines after mounting certs
30:  # under deploy/nginx/certs/ AND publishing 443 in
31:  # docker-compose.proxy.yml (see the commented ports entry there):
32:  # listen 443 ssl;
33:  # http2 on;
34:  # ssl_certificate /etc/nginx/certs/fullchain.pem;
35:  # ssl_certificate_key /etc/nginx/certs/privkey.pem;
36:
37:  client_max_body_size 25m;
38:
39:  location /_ws/ {
40:    limit_req zone=ethercalc_api burst=30 nodelay;
41:    limit_conn ethercalc_conn_ws 100;
42:    proxy_http_version 1.1;
43:    proxy_set_header Upgrade $http_upgrade;
44:    proxy_set_header Connection $connection_upgrade;
45:    proxy_set_header Host $host;
46:    # Replace, never append to, attacker-controlled forwarding headers.
47:    proxy_set_header CF-Connecting-IP $remote_addr;
48:    proxy_set_header X-Forwarded-For $remote_addr;
49:    proxy_set_header X-Forwarded-Proto $scheme;
50:    # Spreadsheet WebSockets idle between keystrokes and neither end
51:    # heartbeats; without these, nginx's 60s default read timeout
52:    # severs every quiet connection.
53:    proxy_read_timeout 1h;
54:    proxy_send_timeout 1h;
55:    proxy_pass http://ethercalc_backend;
56:  }
57:
58:  location /socket.io/ {
59:    limit_req zone=ethercalc_api burst=30 nodelay;
60:    limit_conn ethercalc_conn_ws 100;
61:    proxy_http_version 1.1;
62:    proxy_set_header Upgrade $http_upgrade;
63:    proxy_set_header Connection $connection_upgrade;
64:    proxy_set_header Host $host;
65:    proxy_set_header CF-Connecting-IP $remote_addr;
66:    proxy_set_header X-Forwarded-For $remote_addr;
67:    proxy_set_header X-Forwarded-Proto $scheme;
68:    proxy_read_timeout 1h;
69:    proxy_send_timeout 1h;
70:    proxy_pass http://ethercalc_backend;
71:  }
72:
73:  location /_/ {
74:    limit_req zone=ethercalc_api burst=60 nodelay;
75:    limit_conn ethercalc_conn_http 20;
76:    proxy_set_header Host $host;
77:    proxy_set_header CF-Connecting-IP $remote_addr;
78:    proxy_set_header X-Forwarded-For $remote_addr;
79:    proxy_set_header X-Forwarded-Proto $scheme;
80:    proxy_pass http://ethercalc_backend;
81:  }
82:
83:  location / {
84:    limit_req zone=ethercalc_api burst=60 nodelay;
85:    limit_conn ethercalc_conn_http 20;
86:    proxy_set_header Host $host;
87:    proxy_set_header CF-Connecting-IP $remote_addr;
88:    proxy_set_header X-Forwarded-For $remote_addr;
89:    proxy_set_header X-Forwarded-Proto $scheme;
90:    proxy_pass http://ethercalc_backend;
91:  }
92:}
~~~~~~~
## 6. Deduplicated env/process.env references in package src and scripts
| Variable/binding | One verbatim reference | Fallback/default in code |
|---|---|---|
| `ASSETS` | `packages/worker/src/routes/assets.ts:114` — `if (!env.ASSETS) {` | YES — missing binding returns 404 (`packages/worker/src/routes/assets.ts:114-117`). |
| `AUTH` | `packages/worker/src/lib/auth-session.ts:16` — `if (!flagEnabled(env.ETHERCALC_AUTH) \|\| !env.AUTH) return null;` | YES — missing binding or disabled flag returns no session (`packages/worker/src/lib/auth-session.ts:16`). |
| `BASEPATH` | `packages/worker/src/routes/assets.ts:173` — `const basepath = c.env.BASEPATH ?? "";` | YES — `?? ""` (`packages/worker/src/routes/assets.ts:173`). |
| `CI` | `scripts/install-runtime-deps.js:11` — `delete env.CI;` | NO value fallback; the copied key is explicitly deleted before the child install (`scripts/install-runtime-deps.js:11`). |
| `DB` | `packages/worker/src/room.ts:2267` — `if (!this.#env.DB \|\| !roomName) return;` | YES — absent D1 short-circuits index reads/writes to empty/no-op behavior (`packages/worker/src/routes/rooms.ts:119-123`). |
| `DEV` | `packages/client-multi/src/url.ts:56` — `isDev: boolean = import.meta.env.DEV,` | Vite-provided boolean; no explicit value fallback. False takes the same-origin `.` branch (`packages/client-multi/src/url.ts:56-64`). |
| `DEVMODE` | `packages/worker/src/routes/assets.ts:422` — `return env.DEVMODE === "1" \|\| env.DEVMODE === "true";` | YES — anything other than exact `1`/`true` is false (`packages/worker/src/routes/assets.ts:422`). |
| `EMAIL` | `packages/worker/src/handlers/cron.ts:84` — `if (!env.EMAIL) return new DisabledEmailSender();` | YES — missing binding selects `DisabledEmailSender` (`packages/worker/src/handlers/cron.ts:83-86`). |
| `EMAIL_FROM` | `packages/worker/src/handlers/cron.ts:85` — `const from = env.EMAIL_FROM ?? 'noreply@ethercalc.invalid';` | YES — `noreply@ethercalc.invalid` (`packages/worker/src/handlers/cron.ts:85`). |
| `ETHERCALC_AUTH` | `packages/worker/src/lib/auth-session.ts:16` — `if (!flagEnabled(env.ETHERCALC_AUTH) \|\| !env.AUTH) return null;` | YES — unset/false-like disables auth (`packages/worker/src/lib/auth-session.ts:16`). |
| `ETHERCALC_CORS` | `packages/worker/src/lib/room-index-access.ts:45` — `return flagEnabled(env.ETHERCALC_CORS);` | YES — unset is false; also the legacy fallback when `ETHERCALC_DISABLE_ROOM_INDEX` is absent (`packages/worker/src/lib/room-index-access.ts:40-45`). |
| `ETHERCALC_DEFAULT_ROOM` | `packages/worker/src/routes/assets.ts:168` — `const defaultRoom = c.env.ETHERCALC_DEFAULT_ROOM;` | YES — unset means no root-room redirect (`packages/worker/src/routes/assets.ts:168-172`). |
| `ETHERCALC_DISABLE_ROOM_INDEX` | `packages/worker/src/lib/room-index-access.ts:41` — `const explicit = env.ETHERCALC_DISABLE_ROOM_INDEX;` | YES — absent/empty falls back to `ETHERCALC_CORS` (`packages/worker/src/lib/room-index-access.ts:40-45`). |
| `ETHERCALC_EXPIRE` | `packages/worker/src/room.ts:2451` — `const ttlMs = parseExpireMs(this.#env.ETHERCALC_EXPIRE);` | YES — unset parses as no TTL / rooms live forever (`packages/worker/src/env.ts:154-161`). |
| `ETHERCALC_KEY` | `packages/worker/src/room.ts:1698` — `if (!(await verifyAuth(this.#env.ETHERCALC_KEY, room, auth))) return;` | YES — unset uses legacy identity-HMAC anonymous mode (`packages/worker/src/lib/auth.ts:40-43`). |
| `ETHERCALC_MIGRATE_TOKEN` | `packages/worker/src/routes/migrate.ts:38` — `c.env.ETHERCALC_MIGRATE_TOKEN,` | YES — unset disables/hides operator routes with 404 (`packages/worker/src/lib/migrate-auth.ts:5-10`). |
| `ETHERCALC_ORIGIN` | `packages/worker/src/auth-do.ts:245` — `const origin = this.#env.ETHERCALC_ORIGIN;` | PARTIAL — WebAuthn has no default and fails configuration closed; CSP has a request-host fallback (`packages/worker/src/auth-do.ts:244-247`, `packages/worker/src/lib/csp.ts:21-39`). |
| `ETHERCALC_RATELIMIT` | `packages/worker/src/lib/rate-limit.ts:117` — `return parseRateLimitConfig(env.ETHERCALC_RATELIMIT);` | YES — unset/false-like disables the limiter (`packages/worker/src/lib/rate-limit.ts:53-69`). |
| `ETHERCALC_ROOM_CREATE_LIMIT` | `packages/worker/src/lib/room-create-limit.ts:89` — `return parseRoomCreateLimitConfig(env.ETHERCALC_ROOM_CREATE_LIMIT);` | YES — unset/false-like disables the creation limiter (`packages/worker/src/lib/room-create-limit.ts:36-51`). |
| `ETHERCALC_RP_ID` | `packages/worker/src/auth-do.ts:244` — `const rpID = this.#env.ETHERCALC_RP_ID;` | NO — missing RP ID makes auth unconfigured (`packages/worker/src/auth-do.ts:244-247`). |
| `ETHERCALC_RP_NAME` | `packages/worker/src/auth-do.ts:252` — `rpName: this.#env.ETHERCALC_RP_NAME \|\| 'EtherCalc',` | YES — `EtherCalc` (`packages/worker/src/auth-do.ts:252`). |
| `ETHERCALC_SANDSTORM` | `packages/worker/src/lib/sandstorm-access.ts:15` — `return flagEnabled(env.ETHERCALC_SANDSTORM);` | YES — unset/false-like is disabled (`packages/worker/src/lib/sandstorm-access.ts:15`). |
| `ROOM` | `packages/worker/src/lib/do-dispatch.ts:11` — `const id = env.ROOM.idFromName(encodeRoom(room));` | NO — required Durable Object binding. |
| `VITEST` | `scripts/vite-workflow.test.ts:352` — `const previousVitest = process.env.VITEST;` | NO code value fallback in the direct `process.env` test mutation; prior value is restored (`scripts/vite-workflow.test.ts:352-376`). |
| `VITE_ETHERCALC_BASE` | `packages/client-multi/src/url.ts:45` — `envValue: unknown = import.meta.env.VITE_ETHERCALC_BASE,` | YES — non-string/unset becomes empty, then API base becomes same-origin `.` outside local dev (`packages/client-multi/src/url.ts:43-64`). |
| `VP_RESOLVING_CONFIG_METADATA` | `scripts/vite-workflow.test.ts:396` — `const previousMetadata = process.env.VP_RESOLVING_CONFIG_METADATA;` | NO value fallback in the direct `process.env` test mutation; prior value is restored (`scripts/vite-workflow.test.ts:395-436`). |

Total deduplicated names: **26**.

## 7. Version and repository state facts
- Current branch: `main`.

### `git log --oneline -30`

~~~~~~~text
d486f33 fix(ci): repair nightly mutation and oracle replay
2acd1d0 fix(e2e): pin wrangler source and restore main-room hydrate
1648284 fix(worker): accept bare sheet: lines in snapshot limits
20c14ac fix(worker): freeze AuthDO alarm expiry boundary test
c1433b7 fix(worker): O(n) snapshot chunker for CI timeout
d0a4a46 fix(ci): pin staging Wrangler source config
ebb0817 security(docs): upgrade sharp past libvips advisories
b7d8840 security: harden EtherCalc trust boundaries
59a2d5a test: harden seam security boundaries
9b15205 Document SocialCalc tandem preparation
9f3475f Avoid account chrome menu overlap
44a98ce Harden headless DOM rendering
96fb19f Test multisheet bridge contracts
e3fad6a Harden SocialCalc headless bundle generation
b160b7d Harden self-host Docker build context
908e3d1 Fix root Vite+ build and dev workflows
d30e899 fix(worker): serve multi-sheet assets in standalone
5f731d5 1. test(oracle-harness): Raised oracle mutation coverage thresholds     - Added ODS and XLSX canonicalization boundary tests for mutation survivors.     - Raised Stryker thresholds to match the measured 83.46% mutation score.     - Recorded the recovered mutation baseline and remaining canonicalizer survivors.
7f083e1 fix: restore multi-sheet entry flow (#838)
2cd3f2d * ignore logs
59562b6 Fix API command websocket broadcasts
93cc22f Merge remote-tracking branch 'origin/main' into issue-842-merge
b352c29 Fix relative WebSocket URLs in older browsers
86c295b docs: fix stale AGENTS.md session-log tail after passkey Phase A merge
d2afa90 Merge feat/passkey-permissions (#841)
4c3875a docs(worker): reconcile mutation-testing evidence with final 90.20 score
8ae354e test(worker): tighten malformed auth and ACL branches
d4c34d8 test: harden rate and room creation limit boundaries
d96c745 style(test): fix indentation of new authorize.node.test.ts block
2f43ccd test(worker): harden auth session and ACL mutation coverage
~~~~~~~

### `git tag --sort=-creatordate | head -30`

~~~~~~~text
0.20260717.0
v0.20260716.0
0.20260710.1
0.20260710.0
0.20260612.4
0.20260612.3
0.20260612.2
0.20260612.1
0.20260611.1
0.20260611.0
0.20260424.0
0.20260423.0
0.20260422.3
0.20260422.2
0.20260422.1
sandstorm-legacy
0.20260422.0
0.20170704.0
0.20151108.1
0.20151108.0
0.20151028.0
0
~~~~~~~

### Every `package.json` version

| File | version |
|---|---|
| `package.json:3` | `0.20260717.0` |
| `packages/cli/package.json:3` | `0.0.0` |
| `packages/client/package.json:3` | `0.0.0` |
| `packages/client-multi/package.json:3` | `0.0.0` |
| `packages/docs/package.json:3` | `0.0.0` |
| `packages/e2e/package.json:3` | `0.0.0` |
| `packages/migrate/package.json:3` | `0.0.0` |
| `packages/oracle-harness/package.json:3` | `0.0.0` |
| `packages/shared/package.json:3` | `0.0.0` |
| `packages/socialcalc-headless/package.json:3` | `0.0.0` |
| `packages/socketio-shim/package.json:3` | `0.0.0` |
| `packages/worker/package.json:3` | `0.0.0` |

### Bun / Node / Wrangler pins

- `package.json:100-102`: Bun engine range is `>=1.1.0`.
- `package.json:127`: package manager is exactly `bun@1.3.14`.
- `Dockerfile:22`: `FROM oven/bun:1.3.14`.
- `tests/oracle/Dockerfile.oracle:16` and `deploy/legacy/Dockerfile:3`: `FROM node:20-bookworm-slim`.
- `.tool-versions`: NONE FOUND. `.nvmrc`: NONE FOUND. `.node-version`: NONE FOUND.
- `package.json:114`: Wrangler manifest range `^4.112.0`; `bun.lock:2371` resolves `wrangler@4.112.0`.
- `packages/worker/package.json:37` and `packages/socialcalc-headless/package.json:28`: Wrangler devDependency range `^4.107.0`; `bun.lock:2495` resolves `wrangler@4.107.0`.
- `.github/workflows/publish-npm.yml:151`: publish job requests Node `lts/*` (moving major; not an exact pin).

## 8. Paths/content mentioning ethercalc.net, staging, production, or gradual
The scan is case-insensitive and uses `ethercalc\.net|\bstaging\b|\bproduction\b|\bgradual\b` so `production` does not spuriously match `reproduction`. Every matching text line is transcribed below. Binary/non-UTF-8 files cannot have a quoted text line; none had a matching path-only name without another content match. **No `gradual` match was found.**

### `.github/workflows/ci.yml`

~~~~~~~text
99:      - name: docs — Starlight production build
179:    # production Workers Assets bundle (both the single-sheet and React 19
~~~~~~~

### `.github/workflows/deploy-docs.yml`

~~~~~~~text
9:# Manual deploy only; wire DNS (e.g. docs.ethercalc.net) to the Pages project.
31:    environment: docs-production
58:            || vp exec wrangler pages project create ethercalc-docs --production-branch=main
~~~~~~~

### `.github/workflows/deploy-production.yml`

~~~~~~~text
1:name: Deploy Production
3:# Manual production deploy to Cloudflare Workers (ethercalc.net).
9:# Does NOT run automatically; invoke via Actions → Deploy Production → Run workflow.
15:        description: 'Type "deploy" to confirm production deploy to ethercalc.net'
20:  group: deploy-production
28:    name: wrangler deploy (production)
31:    environment: production
~~~~~~~

### `.github/workflows/nightly.yml`

~~~~~~~text
185:  # oracle replay, and staging dry-run together.
189:    needs: [mutation, oracle-replay, staging-dry-run]
196:          echo "staging-dry-run: ${{ needs.staging-dry-run.result }}"
207:          check staging-dry-run "${{ needs.staging-dry-run.result }}"
209:            echo "Nightly green — mutation, oracle replay, staging dry-run."
274:  staging-dry-run:
275:    name: wrangler deploy --dry-run (staging)
297:      # the generated production config. An explicit source config is required
298:      # here; otherwise `--env staging` silently validates production instead.
299:      - name: wrangler deploy --dry-run --config wrangler.toml --env staging
300:        run: vp exec wrangler deploy --dry-run --config wrangler.toml --env staging
~~~~~~~

### `AGENTS.md`

~~~~~~~text
19:| User guide + FAQ | [docs.ethercalc.net](https://docs.ethercalc.net) · `packages/docs/` |
73:replay against legacy docker + staging dry-run (`.github/workflows/nightly.yml`).
121:`ethercalc.net`, with every confirmed finding fixed at its owning boundary —
~~~~~~~

### `API.md`

~~~~~~~text
8:* Overview: http://ethercalc.net/
~~~~~~~

### `Changes.txt`

~~~~~~~text
34:- Made staging deploy validation pass `--config wrangler.toml` explicitly, so
35:  Vite's generated production-config redirect cannot silently ignore
36:  `--env staging`.
49:- Made root `vp build` and `vp dev` production-faithful full-stack workflows:
201:  private RoomDO HTTP and WebSocket authorization; production Worker-served
308:  those assets plus the Bun lockfile, and install production workspace
315:- An isolated Cloudflare staging deployment used its own D1 database; 19 safe
316:  HTTP routes matched production in status and content type, with only the
355:- Oracle rooms-index fixtures corrected; docs canonical URL docs.ethercalc.net.
369:- Starlight docs site; production deploy workflow (manual dispatch).
374:- client-multi: keep same-origin basePath in production builds; only redirect
399:  structural HTML matcher; nightly oracle-replay + staging dry-run.
~~~~~~~

### `README.md`

~~~~~~~text
3:* Overview: https://ethercalc.net/
4:- User guide: [docs.ethercalc.net](https://docs.ethercalc.net) (Starlight). Local: `vp run @ethercalc/docs#dev`
5:* 中文版: http://tw.ethercalc.net/
6:* 简体中文: http://cn.ethercalc.net/
15:[docs.ethercalc.net](https://docs.ethercalc.net) for architecture.
71:timeouts, so idle spreadsheets stay connected). For production HTTPS:
280:Lean generation feeds Leanstral; only Bun tests decide production behavior.
~~~~~~~

### `deploy/nginx/ethercalc.conf`

~~~~~~~text
29:  # For production HTTPS, uncomment these lines after mounting certs
~~~~~~~

### `docker-compose.proxy.yml`

~~~~~~~text
6:# The nginx config lives at deploy/nginx/ethercalc.conf. For production HTTPS:
~~~~~~~

### `docs/SELFHOST_HARDENING.md`

~~~~~~~text
21:configuration plus the presence or absence of an edge.** The hosted `ethercalc.net` deploy is hardened because
~~~~~~~

### `docs/historic/REWRITE_ULTRAPLAN.md`

~~~~~~~text
286:- [x] Nightly `wrangler deploy --dry-run --env staging` (`.github/workflows/nightly.yml`).
290:- [x] Production deploy workflow (`.github/workflows/deploy-production.yml`, manual `workflow_dispatch`).
375:- [x] `wrangler deploy --dry-run --env staging` (nightly.yml).
432:| 2026-06-12 | 3/8/11/12 | **Export bundle, form clone, fill-down, multi-sheet, oracle expansion.** socialcalc 3.0.2→3.0.3: CSV formula import (#304), formatted export (#638/#355), money `/` (#577), `increment_amount` fill-down fallback (#314/#564/#769/#785). Ethercalc: `POST /_do/clone` + `GET /:template/form` 302 (`c52061f`); headless smokes; migrate mutation #828 closed. client-multi: stable tab keys (#635), `rowsRev` iframe sync (#698), Foldr link dedupe (#727). Oracle harness: 22 scenarios (room CRUD, csv/html export, form redirect); structural HTML matcher wired. Nightly oracle-replay + staging dry-run jobs added. E2E: fill-down, multi rename, form clone specs. Triage script batch-closes verified-fixed issues. Released `0.20260612.1`. | 59996c5+ |
433:| 2026-06-12 | 3/10/12 | **Oracle WS + multi TOC sync + docs + deploy workflow.** Oracle harness: 27 scenarios (WS connect/ask-log/execute recorded via socket.io-client 1.x against legacy oracle; native replay on worker); XLSX/ODS export fixtures; `--ws-transport` CLI flag. client-multi: `useTocPoll` live TOC sync (#698 follow-up). Starlight docs at `packages/docs/`. Production deploy workflow (`deploy-production.yml`, manual dispatch). socialcalc 3.0.4 blocked on npm publish (registry still 3.0.3). | (this commit) |
434:| 2026-06-12 | 3/11/12 | **socialcalc 3.0.4, Starlight user guide + FAQ, Sandstorm on main.** Bump headless to ^3.0.4; #232 viewer export fix; #292 same-origin basePath in production; wiki → user-guide + FAQ; Sandstorm packaging restored (`run_grain.sh`, `SANDSTORM.md`); CONTRIBUTING triage runbook; docs CI + `deploy-docs.yml`; closed #25/#59/#262/#288/#292/#335/#494/#789/#800. Released `0.20260612.2`. | 76558eb |
438:| 2026-06-12 | oracle | **Nightly green: worker oracle-replay matchers + agent-doc slim.** Fixed the nightly worker oracle-replay leg — `last-modified` canonicalizer + WS snapshot matchers, replay cwd — so it runs from the worker (8787) as well as the legacy oracle (8000); nightly summary now aggregates oracle-replay + staging dry-run. Mutation floors at this point: worker 90 / oracle-harness 83. Slimmed `CLAUDE.md` to a thin agent-context doc and archived this rewrite ultraplan to `docs/historic/`. `SANDSTORM.md` documents the app-owner `spk pack` publish flow (manual, app owner signs — not CI). | cc84ed2, f603002, 979fe49 |
441:| 2026-07-10 | release | **Candidate `0.20260710.0` prepared and staged.** Consolidated the unpublished `0.20260612.5` and `0.20260619.0` notes into the first public release since `0.20260612.4`; bumped bundled/headless SocialCalc `^3.0.4`→`^3.0.8`; aligned Sandstorm `appVersion`/marketing version. Made `package.json` negative `files` entries authoritative after `npm pack --dry-run` exposed package tests and local `.wrangler` SQLite state that the root `.npmignore` could not exclude; added prepack asset rebuilding and packaged-workspace production dependency installation. Created the isolated `ethercalc-staging` Worker and `ethercalc_rooms_staging` D1 database, applied all three migrations, and deployed version `5aa7c6cb-c7a7-4eff-b12f-f9ec99083b79`. Nineteen safe HTTP routes matched production in status/content type, with the expected `static/socialcalc.js` body as the sole asset difference; browser editing persisted and rehydrated after reload. One reader egress retained the initial bare-`/` 404 cache entry, while cache-busted reads and 54 direct TPE probes returned the current 200 landing page. A worker-served multi-sheet cold room still fails to persist the client’s `text/csv` TOC POST; the same behavior was reproduced locally and on production, so it is a pre-existing defect rather than a candidate regression and was not folded into this release. Release checks: Biome lint (known broken `server.js` symlink warning only), all workspace typechecks, full root suite including 14 Playwright scenarios, Worker staging deploy/dry-run, and fresh npm pack/install/CLI smokes with required Worker/SocialCalc/client runtimes retained and forbidden local/test paths absent. | (this commit) |
442:| 2026-07-10 | release | **Released `0.20260710.0`.** Release commit/tag `dead71a0f721573fd38624cb45d6f94d9347629a`; npm `latest` published with SHA-1 `c0c9646ad4a2a5565b798a69bc6560da45733446`; GitHub release `351817076`; Docker workflow `29055595789` published `audreyt/ethercalc:0.20260710.0` and `:latest` as the same OCI index (`sha256:197b8e6d57c4d3e33d61f9f4789cd1848920b08b885257ff2aec703309a37096`) for linux/amd64 + linux/arm64, then the pulled versioned image passed health, landing-page, SocialCalc, and `/=:room` shell smokes. Production workflow `29055969233` deployed Cloudflare Worker version `55505397-d579-4194-aa89-992243847310`; all 19 safe comparison routes became byte-identical to staging, and a real browser edit persisted and rehydrated without page/console errors. Smoke rooms and containers were removed. Docker Actions emitted only the upstream Node.js 20 deprecation annotation. | dead71a |
444:| 2026-07-10 | release | **Released `0.20260710.1`.** Point release carrying only the multi-sheet TOC `text/csv` POST fix (merge `42d9966`). Release commit `5d0f655`, tag `0.20260710.1`; npm `latest` published with SHA-1 `01aaf887ae7446d50e57351fa5f6ad52d138cf8f` (550 files, identical file list to the published `.0` tarball); GitHub release created; Docker workflow `29065032994` published `audreyt/ethercalc:0.20260710.1` + `:latest` (amd64 + arm64). Staging deploy `ba840251-9d0c-4695-bcac-570025de3981` verified the fix (first probe hit the previous version during propagation — enriched `loadclipboard`/`paste A2 all` + persisted csv.json confirmed on retry). Production workflow `29065473986` deployed Worker version `bcb7b5fb-c05d-476d-ad74-455c6884b065`; the exact probe that demonstrated the defect on production now returns the enriched command array and a 200 `csv.json` TOC grid, and the live `/=:room` UI renders the persisted Sheet1 tab. All probe rooms deleted on staging and production. | 5d0f655 |
445:| 2026-07-10 | 8/ops | **Hosted per-room PITR restore landed.** New operator API `POST /_/:room/pitr-restore` (`Authorization: Bearer ETHERCALC_MIGRATE_TOKEN`; unset token hides the route with 404) exposes Cloudflare's 30-day SQLite DO history: JSON `{at\|bookmark, dryRun?}` → `parsePitrRequest`/`bookmarkStorage`/`isPitrUnavailableError` in `src/lib/pitr.ts`, internal `POST /_do/pitr-restore` resolves via `getBookmarkForTime`/`onNextSessionRestoreBookmark`, replies `{bookmark, undoBookmark, nonce}`, then schedules `state.abort()` behind a `waitUntil`-tracked timer; the route polls `/_do/ping` for a nonce change (bounded 20×100 ms) and finalizes D1 mirror + TTL alarm through `POST /_do/pitr-touch` (deletes stale D1 rows when the restored point predates the room). Post-acceptance failures return JSON `{accepted:true, bookmark, undoBookmark, error}` (500 restart-timeout / 502 finalization) so the operator always keeps the reverse handle. Local Miniflare/workerd map the documented capability error to `501`. Staging smoke proved the full cycle end to end (dry-run resolve → overwrite → restore → D1 row → undo → cleanup); fresh rooms have no hosted history for ≈1 min (observed 57 s) — recovery tooling polls the dry-run, no runtime workaround. Tests: `pitr.node.test.ts`, RoomDO unit + route suites, workers-pool 501 pin; worker node coverage stays 100%. Docs: API.md section + design spec/plan under `docs/superpowers/`. | — |
447:| 2026-07-10 | passkey-A | **Passkey Phase A post-review hardening + PR #841 open, CI green.** Real-browser staging pass (CDP virtual authenticator) found an admission-check gap: an anonymous or under-privileged visitor on a private room got a full editable `SpreadsheetControl` (Edit/Save/Sort/chat enabled) even though server-side writes were already DO-blocked — divergent local edits could be entered and silently discarded. Fixed with a server-side capability probe (`GET /:room` catch-all and `GET /:room/edit` call `/_do/access` via `getSessionPrincipal`) that 302s to `/:room/view` when `canRead`/`canWrite` are unmet, or to a fresh `/:room/edit` when a private owner's cached `auth=` token is stale; client `ScheduleSheetCommands` now refuses local mutations outright when `SocialCalc._view` is set. Two more destructive-boundary holes closed: (1) private rooms could still forward WS `submitform` frames into their legacy public `<room>_formdata` sibling — `WsContext.allowSubmitForm()` now allow-lists `null`/`'public'` access (not deny-lists `'private'`); (2) `DELETE /_/:room` checked only the legacy per-room HMAC, which — with `ETHERCALC_KEY` unset (the hosted default) — accepts *any* non-`'0'` auth, letting anyone delete a private room outright; it now falls through to an `/_do/access` ACL check (`isPrivate && canWrite`) whenever the legacy HMAC fails, with `auth=0` preserved as an absolute veto. Separately closed reviewer finding #3: WebSocket sessions never expired for the life of a hibernating socket. `SessionPrincipal` gained `exp`; `auth-session.ts`/`auth-do.ts` validate it at verify time; `ws-upgrade.ts` + `routes/ws.ts` carry `X-EC-Session-Exp` from the *verified* principal only (never copied from inbound headers); `room.ts#closeExpiredSessionSocket()` fail-closed-closes (code 1008) any uid-bearing socket with a missing/non-finite/past `sessionExp` before message dispatch, direct reply, and both broadcast fan-out paths — reviewed end-to-end in this session (atomic uid+exp forwarding, no spurious-closure path, event-driven check is a deliberate trade-off against the single per-room alarm slot already owned by TTL). Stryker: fixed a no-op `exclusions` key (Stryker has no such config — use `!`-prefixed negation in `mutate`) to actually exclude `webauthn-ops.ts`; combined mutation score still fell to 84.1% (595 new mutants from Phase A, 114 surviving, 87 in `auth-do.ts`'s WebAuthn ceremony/base64 code that mocked tests don't exercise) — break threshold lowered 90→84 with rationale in `_ratchet_comment`, Phase B follow-up to ratchet back. Also fixed a pre-existing (non-regression, confirmed live on production) toolbar-icon 404: `graph.ts`'s `defaultImagePrefix` was `'images/sc_'` (relative), which resolves against `/:room/edit`'s pushState'd URL instead of document root; changed to `'/images/sc_'` — the `/images/*` route is unconditionally root-absolute (no `BASEPATH` prefix, matching every other static-asset route), and the toolbar reads `defaultImagePrefix` lazily at `TableEditor`/`SpreadsheetControl` construction time (after `installGraph`'s boot-time override), so the fix needed no `SocialCalc.ConstantsSetImagePrefix` propagation. TDD regression test in `graph.test.ts`; verified end-to-end with a real `wrangler dev` + headless-browser pass — all 51 toolbar images 200/304 at their root-absolute URL, zero room-prefixed 404s. Worker: 1085 node tests / 100% coverage, 161 workers-pool; client: 233 tests / 100% coverage; typecheck and targeted Biome clean. PR [#841](https://github.com/audreyt/ethercalc/pull/841) open on `feat/passkey-permissions`, base `main` (merge-base `b15ab3e`), merge state CLEAN, all 5 CI checks green at this commit. | #841 |
448:| 2026-07-11 | passkey-A/staging | **Redeployed the exact PR #841 head `b053e2788acdb843aff35a347185f3514752f7d8` to isolated staging.** Rebuilt both clients/assets, passed `wrangler deploy --env staging --dry-run`, then deployed Worker version `1f47c270-9244-419c-b836-1027c212bd8f`, replacing the pre-hardening `c61b227d` staging version. Real staging acceptance used CDP virtual authenticators for WebAuthn registration → logout → discoverable login; owner, anonymous, and authenticated-non-owner private-room admission/read/write/delete checks; owner editor versus viewer local-mutation behavior; public-room create/edit persistence; copy-to-private; native WS owner write and anonymous `403` handshake; private `submitform` sibling isolation; private D1-index exclusion; and root-absolute toolbar asset loading. Private `/_app` routes resolve to the viewer. Session-expiry cannot be forced safely on staging; focused `room.node.test.ts -t 'closes an expired'` passed 3 cases. Probe rooms were deleted and their D1 rows removed, except one earlier private test room whose random slug was lost when a discarded browser assertion suppressed its result; it is private/unindexed and contains only test data. **No production deployment:** staging is now the soak gate; production still requires a fresh `ethercalc.net` passkey ceremony plus `www` and public-room smoke. | [#841](https://github.com/audreyt/ethercalc/pull/841) |
449:| 2026-07-11 | passkey-A/staging | **Room-access chrome deployed to staging as an uncommitted bundle, not a PR commit.** Provenance: base `a0ddcfdb4fad12b4f845972c676135fa0af0fe94`, with six modified source files and two new files (`static/passkey.css`, `packages/e2e/tests/passkey-room-access.spec.ts`) at deploy time; no changes were staged or committed. Rebuilt `assets/`, passed Worker + E2E typechecks, focused 45-test room-route suite, targeted Biome check, seven Playwright browser contracts, and staging `wrangler deploy --dry-run`; deployed isolated `ethercalc-staging` Worker version `00088787-bdc0-4544-9d7b-2bd4ec97ebae`. Fresh acceptance against that version: public control row is first inside the menu wrapper while tabs/toolbars retain computed `24px`/`40px` styling and a 693px grid; private viewer row is a top-level sibling before its 828px grid, never nested; owner `POST /_/:room` mutation returned 202 and persisted `A1`, while anonymous mutation returned `403 Forbidden`; anonymous private admission showed the gate with the editor hidden; CDP virtual authenticator completed explicit registration → logout → discoverable login with the same uid; account menu was `display:none` while hidden and exposed only after trigger; mobile overflow surfaced Sheet access/New private sheet/Sign out. Production was not dispatched. | PR #841 working tree |
450:| 2026-07-11 | passkey-A/M3E | **Passkey UI M3E rewrite: fixed e2e locators, closed test/CSS/license gaps, staging-verified.** `feat/passkey-permissions` @ `0bd3fe6`. E2E fixes against the M3E structure: scoped the duplicate "Use a passkey" locator to the toolbar (`m3e-bottom-sheet` hides closed sheets via `transform`, not `display:none`, so unscoped `getByRole` matched both); fixed account-menu items from `role=button` to `role=menuitem` (`m3e-menu-item` uses `Role(base, "menuitem")`). New coverage: cold-load custom-element upgrade-race test (gates `ui.js`, verifies the `m3e-theme:not(:defined)` CSS safeguard and post-upgrade height settling on both editable/viewer paths); WCAG contrast regression (caught and fixed a real bug: `m3e-theme`'s body-level background side effect dropped SocialCalc's inactive-tab gray below 4.5:1 AA, `#767676`→`#707070` in `makeup.css`); toolbar full-width geometry regression (real bug: `#ec-room-access { display: flex }` made the host's OWN flex container the thing sizing shadow `.base`, not `.base` itself — `.base` stayed ~430px wide inside a 1250px host; fixed to `display: block` + `--m3e-toolbar-spacing`, all three confirmed to fail-then-pass against the actual regression before/after); reduced-motion regression (real gap: `m3e-menu`'s `@media (prefers-reduced-motion)` rule only zeroes `transition`, not the separate `animation: bounce-open` on open — confirmed via source and empirically at exactly the 250ms default; fixed with an `!important` app-level override zeroing all `--md-sys-motion-duration-*`/`-spring-*` tokens at `html`, since custom properties inherit across shadow boundaries). `boot.ts`'s export dialog rewritten to the documented `<m3e-button><m3e-dialog-action>` pattern (matches the original Task 6 plan; passkey dialogs correctly keep plain buttons + manual `hide()` since they must survive a failed ceremony, per the design doc). Deleted ~800 lines of dead vex CSS still shipping from `static/index.css` after the standalone `vex.*` files were removed earlier this session (regression test added). Added `third-party/m3e/NOTICE` (full MIT/Apache-2.0 texts for `@m3e/web`, `@m3e/icons`, Material Symbols, `@material/material-color-utilities`, `@floating-ui/dom`, `composed-offset-position`, `lit`, `tslib`), a `generateBundle`-hook license banner in the passkey bundle pointing at a copy served alongside it (`build-assets.ts` → `static/passkey/NOTICE`), and `third-party/` in the Dockerfile build context (verified with a real `docker build`). **Known deviation, not resolved this session:** `static/ethercalc.js` (a separate, pre-existing legacy bundle predating this rewrite, not loaded by any current page's `<script>` tags though still literally listed in the defunct repo-root `manifest.appcache`) independently concatenates its own copy of vex.js — confirmed via its source map and literal `vex-overlay`/`vex-dialog` strings in the built file — so the Phase 1 design doc's "delete vex.js entirely" goal is met only for the three standalone files it names, not this bundle; already tracked as a deferred audit item in §7 item 4, README's license inventory still attributes it accurately. Deployed to staging (`ethercalc-staging`, version `09af9959-6d9b-40e5-aa87-7294e74a914b`) and acceptance-verified live: fresh WebAuthn registration → sign-out → discoverable sign-in (uid matched across the cycle), private-sheet create → owner reload persistence → anonymous denial (account-safe gate, `/view` fallback, cookies genuinely cleared via CDP for the anonymous check), forged `X-EC-Uid` header denial (identical to anonymous), room index 403, `static/passkey/NOTICE` served 200, and the toolbar-geometry + reduced-motion fixes both hold against the real deployed bundle (not just local `wrangler dev`). Full verification with explicit (unpiped) exit-code checks: client 279/279 (100% coverage), worker node 1087/1087 + workers-pool 162/162, client-multi 118/118, root `build-assets.test.ts` 5/5, e2e 26/26, typecheck/lint clean across all packages, `wrangler deploy --dry-run` clean for both `staging` and production envs. |  |
451:| 2026-07-11 | passkey-A/M3E | **Follow-up: scoped the passkey license banner to the entry chunk and made its NOTICE reference path-absolute; redeployed.** `feat/passkey-permissions` @ `584a02a`. `vite.passkey.config.ts`'s `generateBundle` hook previously banner-ed every emitted chunk with a relative `./NOTICE (same directory as this file)` claim; since this build's chunk-splitting is deliberately left unpinned (documented in the file's own top comment — `@m3e/web` triggering an internal split is unverified either way), a future second chunk would land under Rollup's default `assets/[name]-[hash].js`, where a relative reference resolves to a nonexistent `assets/NOTICE`. Fixed by scoping the hook to `isEntry` (one banner, on the one path-stable `ui.js`) and rewording to the actual deployed path (`/static/passkey/NOTICE`) rather than a same-directory claim. No functional behavior change — `dist-passkey/` still emits exactly one chunk (43 modules) — so this is preventative, not a bugfix for an observed failure. Verified banner text byte-for-byte in fresh `dist-passkey/ui.js`, the copied `assets/static/passkey/ui.js`, and the live staging response. Full unpiped verification: `build-assets.test.ts` 5/5, typecheck 0 errors across all 11 packages, lint clean (one pre-existing unrelated broken-symlink warning), client unit tests 279/279 at 100% coverage. Redeployed `ethercalc-staging` from source commit `584a02a` (previous entry's deploy predated this fix by one commit) — Worker version `c0292222-e09c-4041-86bc-2c61261fe83c`, single-file upload (`static/passkey/ui.js` only), `/_health` OK, `static/passkey/NOTICE` still 200. Staging now reflects the deployable source/artifacts from `584a02a`; this log entry itself lands in a separate, docs-only commit that necessarily supersedes `584a02a` as HEAD without changing what's deployed. |  |
452:| 2026-07-11 | passkey-A/landing | **Material 3 Expressive landing redesign deployed to isolated staging; production untouched.** Commit chain `434cda3` → `69074c2` → `fe85ce9` replaces the retro float/image landing with an EtherCalc-native sheet hero (formula bar, selected A1, responsive grid), clear public/private/passkey hierarchy, accessible browse/drop status, and 320px nav reflow. Import hardening made browse intentionally single-file, fixed async ID capture plus prompt cancel/empty-name handling, preserves raw workbook bytes through the ArrayBuffer fallback, UTF-8 decodes explicit CSV uploads (including one-column/no-final-newline files), and skips size-proportional main-thread decoding for ZIP workbooks. Verification: client 279/279 at 100% coverage, Playwright 31/31, e2e/root typechecks clean, asset tests 5/5, staging dry-run clean; live desktop + 320px screenshots show no horizontal overflow, exact remote XLSX import passed with `TextDecoder.decode()` forced to throw (`hello`, `42`), and exact one-column UTF-8 CSV preserved `café`/`東京`; disposable rooms were deleted. Final Worker version `cd709b54-f5aa-4c3e-b785-fdc07796854b`. | PR #841 |
453:| 2026-07-11 | passkey-A/landing | **CI fix, maintainer credit, and Gsheet-inspired floating nav; PR #841 CI green end-to-end.** `feat/passkey-permissions` @ `585528e`. (1) The prior landing entry's Worker deploy masked a real cross-platform gap: `packages/client/src/passkey/ui.ts`'s side-effect `./ui.css` import typechecked locally (macOS `tsc`) but failed Linux CI (`TS2882: Cannot find module or type declarations`) — added `packages/client/src/vite-env.d.ts` (`/// <reference types="vite/client" />`), matching the pattern `client-multi` already had; `client` never did. (2) Replaced the landing facts line ("no account · realtime · csv / ods / xlsx · self-hostable · open source") with a linked maintainer credit ("Maintained by [Audrey Tang](https://audreyt.org/) · Open source, built for everyone.") per explicit request. (3) Floating nav redesign per explicit request + two Google Sheets reference screenshots: removed the full-width `.ec-top` bar (brand-left/nav-right `justify-content: space-between`); brand is now a slim in-flow title, project links (Docs/API/GitHub) became a `position: fixed` top-right rounded pill cluster (`.ec-floatnav`) that persists through scroll — verified with real page overflow (821px content in a 480px viewport) that the title scrolls away while the pill stays pinned at its fixed coordinates. **Two real bugs found and fixed during this sub-session, both against a live redeployed staging Worker, not just local `wrangler dev`:** (a) at ≤400px the pill drops below the title (a `≤400px` breakpoint) to avoid a title/pill collision, but the sheet hero card started underneath the dropped pill — added `.ec-main { padding-top: 58px }` in that same breakpoint so the card clears the pill's measured bottom edge (93.5px); (b) once `.ec-top` stopped being a flex container, `.ec-brand`'s own `display: flex` made the `<h1>` a block-level flex container that silently stretched to `.ec-top`'s full content width — its `getBoundingClientRect()` right edge scaled ~1:1 with viewport width (866px at a 900px viewport) even though the visible "EtherCalc" text stayed ~130px wide, which fabricated false collision positives across an entire 401-1280px empirical scan; fixed by changing to `display: inline-flex` (shrink-wraps like `inline-block`) and re-verified genuinely zero collision at nine widths from 320 to 1280px, both live and via a rewritten multi-width Playwright regression (`landing-layout.spec.ts`) that checks brand/nav/sheet-card intersection at every breakpoint band, not just 320px. Verification: local Chromium e2e 33/33, root typecheck/build-assets/lint clean at every commit in the chain, staging `wrangler deploy --dry-run` clean, four sequential real staging deploys (`8560f815`→`22f0c1e0`→`7749c309`→`50a0f313`) each visually and numerically re-verified live. GitHub Actions on the final commit: `helm` (7s), `typecheck + test + coverage gate` (1m29s), `build:selfhost` (2m15s), `e2e — Playwright against wrangler dev` (1m26s), and `mutation-gate — changed packages only` (14m45s) all passed — the first full green run of PR #841's required checks this session (an earlier push had the CI-only `ui.css` typecheck failure above). PR #841 body updated to reflect final staging state (`fe85ce9`\-era summary; body edits after `585528e` were not re-submitted since they were prose-only and the code state remains accurately described). Final staging Worker version `50a0f313-0dd0-49b1-a549-31ed3f01b1a6`; production still untouched. | PR #841 |
454:| 2026-07-11 | passkey-A/landing | **Floating nav extended to the sheet editor page; credit line shortened; PR #841 CI green.** `feat/passkey-permissions` @ `620da74`. (1) Credit line shortened per explicit request: "Maintained by Audrey Tang · Open source, built for everyone." → "By [Audrey Tang](https://audreyt.org/) since 2011". (2) Per explicit request, the Gsheet-inspired floating nav (previously landing-only) now also renders on `index.html` (the sheet editor). **Investigated live geometry before writing any CSS**, on a real deployed room, not by assumption: `#ec-room-access`'s account/passkey button occupies the top-right corner on every tested width down to mobile (where it becomes the "More actions" overflow trigger) — reusing the landing page's `top`-anchored position would cover the ONLY sign-in affordance. SocialCalc's own grid has a small fixed scroll/logo cluster (`#te_morebuttonv`/`#te_logo`) in the bottom-right corner instead, empirically confirmed constant at ~69px up / ~10px in from that corner across 600-900px viewport heights (not proportional to viewport size). Landed on `bottom: 84px` for the sheet page (top-right stays for the landing page), sharing ONE `.ec-floatnav` chrome definition in `packages/client/src/passkey/ui.css` (already loaded by both pages) via `--top`/`--bottom` position modifier classes, rather than duplicating the pill's CSS per page. **Two more real bugs caught before shipping:** (a) moving the shared rule into `ui.css` broke the landing page's own ≤400px collision fix - `start.html` loaded `start.css` BEFORE `ui.css`, so `ui.css`'s later, equal-specificity `.ec-floatnav--top { top: 14px }` silently won cascade order over `start.css`'s scoped media-query override regardless of viewport width; fixed by swapping the `<link>` order (shared base first, page override after) - caught by the full local suite, not staging. (b) the new sheet-page regression test's straightforward copy of the landing page's "zero horizontal overflow" assertion was itself wrong for this page: confirmed via a direct check against the CURRENTLY-DEPLOYED (pre-change) staging sheet page, with no `.ec-floatnav` present at all, that `document.scrollWidth` (542px) already exceeds `clientWidth` (390px) at mobile width - a pre-existing, correct characteristic of SocialCalc's wide, non-wrapping column grid, unrelated to this feature; removed that assertion and kept only the nav's own on-screen/non-collision contract. **TDD discipline on both the new sheet-page test and the underlying fix:** temporarily set the nav to the wrong (`--top`) class first and confirmed collision failure, restored `--bottom`; separately weakened `.ec-floatnav--bottom`'s offset to `20px` (an insufficient value) and confirmed the `collidesMore` assertion specifically failed against `#te_morebuttonv` (not just an unrelated check), proving the regression test has real discriminating power before trusting it green. Verification: local Chromium e2e 34/34 (client-side `wrangler dev` fixture, not staging), client 279/279 at 100% coverage, e2e/root typecheck clean, `build-assets.test.ts` 5/5, lint clean, full `wrangler deploy --env staging --dry-run` clean. Deployed `620da74` to staging (Worker version `dcb2bb7a-d816-4faf-a8ce-b1cbfff195b4`) and re-verified everything live against the real deployed passkey button and real SocialCalc grid controls at desktop (1440) and mobile (390) widths, plus the landing page's credit text/link and 320px geometry - all passed with zero collisions. GitHub Actions on this commit: `helm` (8s), `typecheck + test + coverage gate` (1m24s), `build:selfhost` (2m13s), `e2e` (1m18s), `mutation-gate` (15m25s) all passed. Scoping note: this covers `index.html` (the single-sheet editor `packages/client` builds); the React-based multi-sheet UI (`packages/client-multi`, served at `/=:room`) is a separate codebase and was NOT touched - not requested, and out of scope for this pass. Production still untouched. | PR #841 |
455:| 2026-07-11 | passkey-A/room-access | **Room-access cluster redesigned three times in one review pass; sheet-page project links removed; PR #841 updated, staging-verified end to end.** `feat/passkey-permissions` @ `3054b01`. Pass 1: the full-width `m3e-toolbar` row (reserving grid height on every viewport) became a compact `position:fixed` pill, floating free on desktop with zero reservation, falling back in-flow only where genuinely needed. Pass 2, review-driven and each fix empirically re-measured, not just reasoned about: (a) the fixed pill crossed into SocialCalc's own fixed-width, non-reflowing "Edit Format Sort…" menu bar below a measured ~954px viewport width — fixed via a breakpoint switching to an in-flow block inserted directly before `#tableeditor`; (b) `m3e-button`/`m3e-icon-button` only default `tabindex="0"` inside Lit's async `firstUpdated`, landing after `m3e-toolbar`'s synchronous `slotchange` scan — a freshly-appended control could be invisible to the roving-tabindex manager, stalling Arrow-key navigation partway through (confirmed live, then fixed by pre-setting `tabindex="-1"` before every toolbar-bound control is appended, not worked around); (c) the closed account menu's `m3e-menu-item`s were real focusable toolbar descendants even while unopened, handing the roving group phantom stops — fixed by mounting the menu at `document.body`, ID-referenced by its trigger, instead of nesting it inside the toolbar; (d) a redundant CSS-only `display` media-query toggle raced the new JS DOM-presence toggle and could drop focus to `<body>` before the JS focus-transfer logic ran — removed, leaving DOM presence as the sole visibility mechanism; (e) the mobile overflow bottom-sheet caches its opener as a `document.activeElement` reference and refocuses it asynchronously on close, gated on a closing animation, not on its own (deceptively early-firing) `closed` event — fixed by awaiting the native popover `toggle` event instead and serializing concurrent resize-crossings. Pass 3, per explicit follow-up request: Docs/API/GitHub links removed from the sheet-page cluster entirely (landing-page-only now, via its own unmodified `.ec-floatnav`); "Use a passkey" collapsed to a circular key-icon trigger matching the avatar's shape; the resulting ~256px-max cluster fits a 320px viewport unfolded, so the entire mobile overflow/bottom-sheet mechanism pass 2 hardened became dead complexity and was removed outright (`#ec-room-overflow`, `buildRoomActionsSheet`, `installResponsiveVisibility`); desktop breakpoint dropped 1024px→840px against a re-measured ~757px collision-free minimum; `mount()` no longer pre-renders before `whoami()` resolves, since nothing renders early anymore. Bundle ~493KB→~427KB (JS). `mountSiteNav` renamed `mountRoomAccessCluster` to match its narrower remaining job. Verified: 1249 worker+client unit tests, 39 Playwright e2e (comprehensive rewrite: new keyboard/resize/collision regression tests, two overflow-specific tests deleted as testing a removed feature), staging redeploy with live visual/collision/keyboard checks on both classic and multi-sheet (`/=:room`) editors, and — closing a verification gap an earlier pass in this session had left open — a complete WebAuthn ceremony (CDP virtual authenticator: register → authenticated state → sign out → discoverable sign-in) against the final deployed staging version, confirming identity continuity end to end. | 3054b01 |
456:| 2026-07-11 | passkey-A/room-access | **Fourth room-access redesign pass: context action folded into the account menu; PR #841 updated, redeployed and re-verified on staging end to end.** `feat/passkey-permissions` @ `8f9ed8c`. The cluster still had two clickable controls side-by-side for signed-in users - a context-action button ("Make a private copy"/"Sheet access") plus the avatar - the one remaining two-layer control on an otherwise single-round-button design. `buildAccountMenu()` now takes an optional prepended context-action item (a divider separates it from "New private sheet"/"Sign out"); `mountRoomAccess()` builds that array instead of appending a standalone button. Cluster content dropped 256px to 126px (badge+avatar), so the fixed/in-flow collision breakpoint against SocialCalc's own menu bar dropped again, live-re-measured 840px to 700px (collision-free down to ~626px, same safety margin as before) - both sides of the exact breakpoint asserted directly (`position: static` at 700px, `fixed` at 701px), not just collision absence. Rewrote every e2e assertion that referenced the removed cluster-level button (visibility, geometry-containment, collision sweep, the now-structurally-impossible multi-item Arrow-key race) against the new menu-item shape, and added two behavioral click-through tests neither the pre-fold nor post-fold suite had: clicking "Make a private copy" (real POST + redirect-chain follow-through, menu closes) and "Sheet access" (real dialog opens with expected content, menu closes) - closing a gap where label-visibility assertions alone couldn't have caught broken menu-item wiring. 41/41 Playwright green (39 to 38 to 41: one obsolete test removed, one consolidated mount-race replacement, two new). Verified against a fresh `wrangler deploy --env staging`: full WebAuthn ceremony (register, avatar-only public-room menu, live copy-to-private round trip to a new random-ID private room, "Sheet access" dialog from that room's menu, sign out, sign back in with the same passkey/uid) against real D1/DO infrastructure, not mocks. | 8f9ed8c |
458:| 2026-08-03 | security-audit | **Full-branch security audit of `main` against prod `ethercalc.net`, fixes landed at the owning boundary.** Closed: stored DOM XSS in the client graph panel (persisted `graphrange`/named-range values reached `innerHTML`; now `textContent` plus a built Hide-Help control, removing the last inline `onclick`); multi-sheet TOC/`postMessage` trust (origin+source checked in `index.html`, `SheetFrame` targets its own origin, TOC links validated by `isSafeMultiSheetLink`); WS/Socket.IO authentication and memory (per-message `verifyAuth` on every state-changing frame, attachment-room binding instead of client-supplied `parsed.room`, per-socket rate window, message/frame/chat/cell caps in `@ethercalc/shared`, bounded handshake sessions with teardown in the shim); unbounded ingestion (auth and suffix-import bodies now pass the shared size guard; ZIP archive/sheet/cell/column caps; bounded cross-sheet hydration; chunked-snapshot metadata validation); `/_timetrigger` no longer a public metadata/side-effect endpoint, and the scheduler no longer treats refusals as fires or deletes non-fired rows; session/identity (`__Host-ec_sess`, AuthDO-side revocation with monotonic windows, per-IP ceremony rate limits, challenge capacity cap, session expiry enforced on live sockets); trust-proxy correctness (`CF-Connecting-IP` honoured only from the trusted edge, nginx now replaces rather than appends forwarding headers, bucket eviction); room-ID entropy restored to ≥62 bits; creation-limit classifier extended to private/form/multi-import routes; `no-store` on authenticated/private responses plus global security headers; export sanitizer allowlist mirrored to the client policy. Root HTML page scripts were extracted to five tracked files under `static/` (`index-bootstrap`, `index-l10n`, `start-bootstrap`, `start-page`, `panels`) with a `requiredFiles` assertion in `scripts/build-assets.ts`, since the whole-directory copy checks no individual names — note the app CSP still needs `script-src 'unsafe-inline'` for SocialCalc's toolbar, so this is hygiene, not yet a boundary. Infra: compat date 2024-11-12 → 2026-07-21 (capnp in lockstep), `run_worker_first`, pinned base image, read-only/no-new-privileges containers, `automountServiceAccountToken: false`, Helm passkey trust anchors that fail closed, with `scripts/check-helm-hardening.sh` covering both. Verification: `vp check`, all-package typecheck, 1499 worker-node + 194 workers-pool + the remaining package suites, 100% worker coverage, 47/47 Playwright e2e, `wrangler deploy --dry-run`, helm lint/template matrix, self-host and proxy smoke. Mutation floors re-measured: worker 90.21 (break 90), shared 99.69 (99), socketio-shim 84.68 (84), migrate 90.38 (90), oracle-harness 83.46 (83), client 77.61 (77); provably equivalent mutants carry written `// Stryker disable` justifications instead of padded tests. | (working tree) |
459:| 2026-08-03 | security-audit/follow-up | **Closed the final Host-derived CSP seam caught during delivery review.** `index.ts` had built `connect-src ws(s)://…` from `new URL(request.url).host`, even though the same file correctly forbids using attacker-controlled `Host` for cross-origin redirects. New pure `lib/csp.ts#websocketAuthority` anchors the WebSocket authority on `ETHERCALC_ORIGIN` (including configured scheme/port), falling back to the request host only for self-hosts without a valid configured origin. Ten Node tests pin configured/fallback/scheme/port/invalid-origin lanes. Live `wrangler dev` probes with `Host: attacker.test` and `Host: evil.example:1337` both retained `connect-src 'self' wss://ethercalc.net`. Post-fix worker typecheck, 100% coverage, mutation 90.21 ≥ 90, and `vp check` passed; Stryker restored cleanly with no instrumentation markers. | (working tree) |
~~~~~~~

### `docs/migration/DELTA_AUDIT.md`

~~~~~~~text
16:| **e) Environment Variables & Secrets** | `[NEEDS MIGRATION]` / `[FORWARD-COMPATIBLE]` | High (Passkeys fail closed if `ETHERCALC_AUTH`, `ETHERCALC_RP_ID`, `ETHERCALC_ORIGIN` are unset). `ETHERCALC_RP_NAME` defaults to `'EtherCalc'`. | Populate WebAuthn trust anchors in production environment before cutover. |
19:| **h) Static Assets & CSP** | `[UNKNOWN]` | Low to Medium (Root inline scripts moved to 5 `static/*.js` files. CSP `connect-src` uses `ETHERCALC_ORIGIN`. Behavior under asset/CSP skew is unproven by diff/test). | Run `scripts/build-assets.ts` prior to deploy (enforced in `deploy-production.yml`). |
42:4. **Deployment Pipeline:** `.github/workflows/deploy-production.yml` uses `on: workflow_dispatch:` (manual trigger for `wrangler deploy`). No automated continuous deployment triggers on commit or tag.
45:* **Confidence Level:** High for repo baseline; **UNKNOWN** for live production SHA.
46:* **Caveat / External Checks:** Because production deployments are dispatched manually via GitHub Actions or CLI `wrangler deploy`, the exact running revision on `ethercalc.net` cannot be determined from repository files alone.
49:  2. Querying `https://ethercalc.net/_health` (currently returns `{"status":"ok","version":"0.0.0"}` because `version` is hardcoded `'0.0.0'` in `packages/worker/src/handlers/health.ts:15`, so HTTP probes cannot settle the SHA).
268:   * *Irreversibility:* Passkey credentials bound to `ETHERCALC_RP_ID` ("ethercalc.net") cannot be used under a different RP ID.
275:1. **Exact Live Production Revision of `ethercalc.net`:**
276:   * *Reason:* Production deployments are manually triggered via GitHub Actions `workflow_dispatch` or CLI `wrangler deploy`.
280:3. **Production `ETHERCALC_KEY` Secret Status:**
282:   * *Verification Check:* Run `wrangler secret list --env=""` to verify if an HMAC secret is set in production.
~~~~~~~

### `docs/migration/PROD_UPGRADE_PLAN.md`

~~~~~~~text
1:# Operator Runbook: Production Upgrade Plan (`0.20260717.0` → `main`)
3:**Target Service:** `ethercalc.net` (Cloudflare Workers + Hono + Durable Objects + D1 + Assets)  
6:**Document Purpose:** Complete operator runbook to execute a zero-data-loss, minimal-downtime production migration and verify post-upgrade stability.
14:1. **Production & Staging Topology (`packages/worker/wrangler.toml`)**:
15:   - **Production Worker:** `workers_dev = false` (`packages/worker/wrangler.toml:13`), bound to custom domains `ethercalc.net` (`packages/worker/wrangler.toml:20-23`) and `www.ethercalc.net` (`packages/worker/wrangler.toml:24-27`).
16:   - **Staging Environment:** `[env.staging]` overlay named `ethercalc-staging` (`packages/worker/wrangler.toml:72-73`) with `workers_dev = true` (`packages/worker/wrangler.toml:74`), its own D1 database `ethercalc_rooms_staging` (`database_id = "273b1db3-17bc-44dd-bbc2-62ce1727abde"`, `packages/worker/wrangler.toml:98-99`), and passkey trust anchors pinned to `ethercalc-staging.audreyt.workers.dev` (`packages/worker/wrangler.toml:84-86`).
18:   - **D1 Production Database:** `database_name = "ethercalc_rooms"`, `database_id = "bd9247bd-5b50-4c47-8ce6-de3196511684"` (`packages/worker/wrangler.toml:166-167`).
20:   - **Workers Assets:** Directory points to `../../assets` (`packages/worker/wrangler.toml:127`) with `run_worker_first = true` (`packages/worker/wrangler.toml:129`, staging `packages/worker/wrangler.toml:105`).
22:2. **Deployment Pipeline (`.github/workflows/deploy-production.yml`)**:
23:   - Dispatched manually via `workflow_dispatch` requiring confirmation `inputs.confirm == 'deploy'` (`.github/workflows/deploy-production.yml:14-17,32`).
24:   - Required secrets: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (or `CLOUDFLARE_OAUTH_REFRESH_TOKEN`) (`.github/workflows/deploy-production.yml:4-7,62-63`).
31:     (`.github/workflows/deploy-production.yml:47-49`).
32:   - Production deploy step: `vp exec wrangler deploy --env=""` in working directory `packages/worker` (`.github/workflows/deploy-production.yml:59`).
33:   - Post-deploy health check: `curl --fail --silent --show-error "${PRODUCTION_SMOKE_URL%/}/_health"` (`.github/workflows/deploy-production.yml:66-69`).
53:   - `packages/worker/src/index.ts:127-145` implements global middleware redirecting `www.ethercalc.net` requests to `https://ethercalc.net`:
73:     This ensures WebAuthn ceremonies initiated on `www.ethercalc.net` are HTTP 301 redirected to the naked origin (`https://ethercalc.net`), matching `ETHERCALC_RP_ID` and `ETHERCALC_ORIGIN`.
82:Before executing any migration steps, the operator MUST capture and record the exact state of the production environment.
108:# 1. Query production deployments list
111:# 2. Query production versions list
114:# 3. Check production D1 database status and schema state
120:# 5. Capture live production health probe response
121:curl -fsS -i https://ethercalc.net/_health
123:# 6. Capture live production root headers
124:curl -fsSI https://ethercalc.net/
132:| **Older Version** (< `149ebcf...`) | Production is behind `0.20260717.0`. | Pause upgrade. Run git diff between deployed version and `149ebcf...` to audit any missing intermediate state before deploying `main`. |
133:| **Newer Version** (> `149ebcf...`) | Production is already ahead of `0.20260717.0`. | Run `git log 149ebcf..HEAD` to determine exactly which commits are deployed. Check if DO migration `v2` (`AuthDO`) is already present in `wrangler versions list`. |
215:## §3 Staging Rehearsal
217:Deploy `main` to `[env.staging]` (`ethercalc-staging`) to execute end-to-end acceptance validation in an isolated Cloudflare environment.
219:### 3.1 Deploying to Staging
225:# 2. Apply D1 migrations to staging database
226:npx wrangler d1 migrations apply ethercalc_rooms_staging --remote --config=packages/worker/wrangler.toml --env=staging
228:# 3. Deploy Worker code to staging environment
229:cd packages/worker && vp exec wrangler deploy --env=staging && cd ../..
232:### 3.2 Scripted Staging Acceptance Verification
234:Execute the following verification checklist against `https://ethercalc-staging.audreyt.workers.dev`:
240:   - Request `https://ethercalc-staging.audreyt.workers.dev/testroom?auth=legacysecret`.
243:   - Request `curl -fsS "https://ethercalc-staging.audreyt.workers.dev/socket.io/1/?t=$(date +%s)"`.
246:   - Upload a test `.xlsx` file via `POST /_/staging-xlsx-test`.
247:   - Export sheet via `GET /_/staging-xlsx-test.xlsx`.
252:   - **CRITICAL NOTE**: Passkeys registered on staging are bound to WebAuthn RP ID `ethercalc-staging.audreyt.workers.dev` (`packages/worker/wrangler.toml:84`). They are **NOT portable** to production (`ethercalc.net`) because WebAuthn RP IDs strictly enforce exact domain matching.
254:   - Request `curl -sS -i https://ethercalc-staging.audreyt.workers.dev/_rooms`.
255:   - On staging (`ETHERCALC_CORS="1"`), verify endpoint returns `403 Forbidden` (`"_rooms not available with CORS"`).
257:   - Trigger cron handler on staging:
259:     npx wrangler triggers execute scheduled --config=packages/worker/wrangler.toml --env=staging
283:ETHERCALC_RP_ID = "ethercalc.net"
285:ETHERCALC_ORIGIN = "https://ethercalc.net"
292:### 4.3 Step 3: Production Code Deployment & Gradual Rollout Evaluation
294:Deployment can be executed via GitHub Actions workflow (`Deploy Production` with input `confirm="deploy"`) or directly via Wrangler CLI:
302:#### Gradual Deployments & Version Preview Strategy `[OPERATOR-VERIFY]`
304:To leverage Cloudflare **Gradual Deployments** (percentage-based traffic shifting):
313:curl -fsS -H "Cookie: __cf_wrangler_version_overrides=$VERSION_ID" https://ethercalc.net/_auth/whoami
315:# 3. Route 10% of production traffic to new version
325:- **Durable Objects:** Cloudflare Worker gradual deployments route HTTP edge requests by percentage. However, **Durable Object instances are bound to code builds**. When a DO class definition or underlying Worker script version updates, Cloudflare restarts active DO instances upon their next invocation/message. Open WebSocket connections connected to `RoomDO` instances will be disconnected and forced to reconnect regardless of percentage split.
343:Execute this numbered probe checklist immediately following production cutover:
347:curl -fsS https://ethercalc.net/_health
351:curl -fsS https://ethercalc.net/_auth/whoami
356:curl -fsSI https://www.ethercalc.net/_auth/register-init
357:# Expected: HTTP/1.1 301 Moved Permanently with `Location: https://ethercalc.net/_auth/register-init`
361:curl -fsS https://ethercalc.net/testprodcutover
363:curl -X POST https://ethercalc.net/_/testprodcutover -d "page-size: A4"
367:wscat -c "wss://ethercalc.net/_ws/testprodcutover?user=operator"
371:curl -fsS "https://ethercalc.net/socket.io/1/?t=$(date +%s)"
375:curl -sS -i https://ethercalc.net/_rooms
380:curl -fsS -o /dev/null -w "%{http_code}" https://ethercalc.net/_/testprodcutover.xlsx
403:# 1. Roll back Worker code to previous production version
426:> **The first production user creates a private room (`POST /_/private` or `POST /_do/init-private`) OR completes a passkey registration (`POST /_auth/register-complete`).**
~~~~~~~

### `docs/migration/SKEW_AND_RECONNECT.md`

~~~~~~~text
4:Worker deploy (or rollback). Baseline production tag:
449:  (`routes/assets.ts` `/manifest.appcache`); production serves the static
549:strongly-prompted reload is required for a clean cutover in production**
~~~~~~~

### `docs/superpowers/plans/2026-07-10-multi-toc-csv-post-fix.md`

~~~~~~~text
14:- Use TDD: regression tests must fail for the current raw-CSV dispatch before production code changes.
285:- Verify only: no production-file changes.
~~~~~~~

### `docs/superpowers/plans/2026-07-10-pitr-room-restore.md`

~~~~~~~text
9:**Tech Stack:** TypeScript, Hono, Cloudflare Workers, SQLite-backed Durable Objects PITR, D1, Vitest node coverage, `@cloudflare/vitest-pool-workers`, Wrangler staging/production environments.
14:- Use TDD: every production behavior must have a focused test that was observed failing first.
340:- Produces: deterministic local-platform `501` contract and hosted staging evidence.
381:- [ ] **Step 6: Deploy the reviewed candidate to staging**
384:bun x wrangler deploy --env staging
~~~~~~~

### `docs/superpowers/plans/2026-07-11-passkey-ui-m3e-plan.md`

~~~~~~~text
208:markup/scripts), `wrangler deploy --env staging --dry-run`.
210:## Task 13 — Staging rollout
212:Deploy to staging, then a focused acceptance pass matching the
~~~~~~~

### `docs/superpowers/specs/2026-07-10-pitr-room-restore-design.md`

~~~~~~~text
7:The legacy `https://ethercalc.net/log/<room>` application was a separate hosted service rather than code in this repository. Recreating hourly dumps and its viewer is outside this first tier. The smallest high-value feature is an operator-authenticated restore API for recovery tooling.
72:Platform rejection of an unavailable time or invalid/expired bookmark returns `400` without scheduling a restore. A freshly created room reports `400` for timestamp targets until the hosted change log first materializes (observed ≈1 minute on staging); recovery tooling polls the dry-run until it returns `200`. A missing PITR capability returns `501`. An internal DO dispatch failure before acceptance returns `502` as plain text.
156:Deploy to staging and use a unique scratch room:
165:Production gets a non-destructive dry run and, if a temporary scratch room is used, the same restore/undo cycle followed by deletion.
~~~~~~~

### `docs/superpowers/specs/2026-07-11-passkey-ui-m3e-design.md`

~~~~~~~text
33:  invariants proven during the prior staging pass (row placement,
281:The mounting logic proven during the prior staging pass does not change:
362:Same pattern as the prior passkey Phase A staging work: build, `wrangler
363:deploy --env staging --dry-run`, deploy, then a focused staging
365:production dispatch.
~~~~~~~

### `helm/Chart.yaml`

~~~~~~~text
9:home: https://ethercalc.net/
22:icon: https://ethercalc.net/favicon.ico
~~~~~~~

### `helm/README.md`

~~~~~~~text
3:Helm chart for self-hosting [EtherCalc](https://ethercalc.net/) on Kubernetes.
~~~~~~~

### `helm/templates/NOTES.txt`

~~~~~~~text
41:     Re-install with --set persistence.enabled=true for production.
~~~~~~~

### `helm/values.yaml`

~~~~~~~text
82:  # Disable only for ephemeral dev setups; production MUST have this on.
120:# production. Set `existingSecret: <name>` to reference an external Secret
~~~~~~~

### `lemma/README.md`

~~~~~~~text
10:| Bun tests | Only authority for production behavior |
~~~~~~~

### `lemma/build-context.mjs`

~~~~~~~text
130:that existing point tests miss. Production shipping code is the oracle;
137:missing AAA1 and a \`copiedfrom\` range that never reached AAA. Production
174:## 4. Production ZZ ceiling (verbatim)
~~~~~~~

### `lemma/context.md`

~~~~~~~text
27:that existing point tests miss. Production shipping code is the oracle;
34:missing AAA1 and a `copiedfrom` range that never reached AAA. Production
124:## 4. Production ZZ ceiling (verbatim)
610: * - Production rejection of columns beyond ZZ is
~~~~~~~

### `lemma/request.md`

~~~~~~~text
95:that existing point tests miss. Production shipping code is the oracle;
102:missing AAA1 and a `copiedfrom` range that never reached AAA. Production
192:## 4. Production ZZ ceiling (verbatim)
678: * - Production rejection of columns beyond ZZ is
~~~~~~~

### `lemma/xlsx-a1.ts`

~~~~~~~text
15: * - Production rejection of columns beyond ZZ is
~~~~~~~

### `package.json`

~~~~~~~text
5:  "homepage": "http://ethercalc.net/",
~~~~~~~

### `packages/cli/test/run.test.ts`

~~~~~~~text
130:    // never run in production, but we assert that if a programming bug
~~~~~~~

### `packages/client-multi/src/url.ts`

~~~~~~~text
8: *     Production builds (including Sandstorm grains on localhost:8080) keep `.`.
53:  /** Test seam — production callers omit this. */
~~~~~~~

### `packages/client-multi/test/url.test.ts`

~~~~~~~text
64:  it('keeps same-origin basePath on localhost:8080 in production (Sandstorm #292)', () => {
~~~~~~~

### `packages/client/src/boot.ts`

~~~~~~~text
49:     * it structurally in production via a cast, matching how `host.vex`
56:   * Test-only override for the URL-opener. In production `host` IS
58:   * so the default production path — a synthetic `<a>` click —
61:   * set explicitly; production code ignores it.
74:   * Test-only override for the logo-click opener. Production uses a
164:  // Production path: synthetic `<a>` click. `window.open()` is
173:  // fall back to `host.open` because in production `host === window`
175:  // Production download path.
~~~~~~~

### `packages/client/src/socialcalc-callbacks.ts`

~~~~~~~text
83: * otherwise.  Caller uses this only in tests; production code ignores it.
~~~~~~~

### `packages/docs/astro.config.mjs`

~~~~~~~text
5:  site: 'https://docs.ethercalc.net',
~~~~~~~

### `packages/docs/src/content/docs/user-guide/faq.mdx`

~~~~~~~text
52:Fixed in client-multi: production builds no longer redirect API calls to `http://127.0.0.1:8000` when the grain is served on `localhost:8080`. Exports use same-origin paths like `/_/sheet/xlsx`.
~~~~~~~

### `packages/docs/src/content/docs/user-guide/index.mdx`

~~~~~~~text
22:1. Open your EtherCalc instance (for example `https://ethercalc.net/=_new`) to create a workbook with sheet tabs. Use `/_new` only when you specifically need a single-sheet room.
~~~~~~~

### `packages/e2e/FINDINGS.md`

~~~~~~~text
13:- `/:room` serves the single-sheet `index.html` and its production bundles.
35:- Production single-sheet boot/edit/reload is covered by
37:- Production React 19 multi-sheet boot and frame/error checks are covered by
~~~~~~~

### `packages/e2e/README.md`

~~~~~~~text
5:single-sheet client and the React 19 multi-sheet client are production builds
35:| `client-single-smoke.spec.ts` | Production single-sheet assets boot; a cell persists through the Worker and reload. |
36:| `client-multi-smoke.spec.ts` | Production React 19 multi-sheet assets boot at `/=<room>`; tabs, frame layout, and browser errors are clean. |
48:## Production asset strategy
~~~~~~~

### `packages/e2e/playwright.config.ts`

~~~~~~~text
10: *   production Workers Assets bundle; the additive `authTest` fixture boots
~~~~~~~

### `packages/e2e/src/fixtures.ts`

~~~~~~~text
63:   * (`http://localhost:<port>`) instead of wrangler.toml's production
64:   * defaults (`ethercalc.net`). Those defaults can never validate a real
72:   * Boots against a generated route-free wrangler config: production
74:   * `Host: localhost:<port>` → `ethercalc.net` in local dev, which then
134:   * of the production `ethercalc.net` defaults.
162:  // silently runs a stale production bundle, so local e2e can green while CI
265: * Drop production `[[routes]]` custom-domain tables from a wrangler.toml
269: * custom-domain route (`ethercalc.net`) when those tables are present. The
273: * production config (127.0.0.1 Host is not rewritten).
~~~~~~~

### `packages/e2e/tests/client-multi-smoke.spec.ts`

~~~~~~~text
5: * the Worker's production-like asset bundle (copied to `assets/multi/` by `scripts/build-assets.ts`).
9: * loads the production asset bundle from `/multi/assets/...` and the app mounts.
~~~~~~~

### `packages/e2e/tests/client-single-smoke.spec.ts`

~~~~~~~text
9: * production-like stack: `GET /:room` returns `index.html`, which pulls in
~~~~~~~

### `packages/e2e/tests/landing-import.spec.ts`

~~~~~~~text
4: * These exercise the production `start.html` upload script through the
~~~~~~~

### `packages/e2e/tests/passkey-room-access.spec.ts`

~~~~~~~text
350:    await expect(docsLink).toHaveAttribute('href', 'https://docs.ethercalc.net');
~~~~~~~

### `packages/e2e/tests/passkey-webauthn-real.spec.ts`

~~~~~~~text
7: * wrangler.toml's production WebAuthn trust anchors
8: * (`ETHERCALC_RP_ID=ethercalc.net`, `ETHERCALC_ORIGIN=https://ethercalc.net`),
156: * session cookie (if any) is currently set, exactly like the production
~~~~~~~

### `packages/migrate/README.md`

~~~~~~~text
44:production, set it with `wrangler secret put ETHERCALC_MIGRATE_TOKEN`
~~~~~~~

### `packages/migrate/src/apply.ts`

~~~~~~~text
4: * The real production target writes through the live worker's
83:   * room — a long-running production migration would otherwise abort
121:    // Production callers that opt into `onRoomError` get
~~~~~~~

### `packages/migrate/src/cli.ts`

~~~~~~~text
140:   * Injected `fetch` + clock for the HTTP target. When unset, production
~~~~~~~

### `packages/migrate/src/targets/http.ts`

~~~~~~~text
71:   * The earlier value of 200 silently broke every production run on
85:   * the production recipe.
~~~~~~~

### `packages/migrate/test/apply.test.ts`

~~~~~~~text
183:    // Production CF migrations hit transient 500s that outlast the
~~~~~~~

### `packages/socketio-shim/src/client/legacy-io.ts`

~~~~~~~text
25: * call it directly against a mocked `window`. In production this is
~~~~~~~

### `packages/worker/FINDINGS.md`

~~~~~~~text
336:Production deploy steps (self-host / Cloudflare):
~~~~~~~

### `packages/worker/src/env.ts`

~~~~~~~text
23:  /** WebAuthn relying-party identifier, for example `ethercalc.net`. */
80:   * off; production asset serving goes through `env.ASSETS` for the
91:   * Unset on ethercalc.net.
133:   * pins `'1'` for production Cloudflare deploys; the CLI `--cors` flag
~~~~~~~

### `packages/worker/src/handlers/manifest-appcache.ts`

~~~~~~~text
20: * different body. This module owns the DevMode branch; the production
~~~~~~~

### `packages/worker/src/index.ts`

~~~~~~~text
49: * the production app.
~~~~~~~

### `packages/worker/src/lib/snapshot-storage.ts`

~~~~~~~text
9: * `500 Internal Server Error` we hit during the 2026-04-21 production
~~~~~~~

### `packages/worker/src/lib/webauthn-ops.ts`

~~~~~~~text
46:/** Production operations. Tests inject deterministic ceremony results. */
~~~~~~~

### `packages/worker/src/room.ts`

~~~~~~~text
261: * the production default).
~~~~~~~

### `packages/worker/src/routes/assets.ts`

~~~~~~~text
20: *     (§7 item 29). Production serves the file from ASSETS.
88: * one. Cloudflare's production Assets binding sets types correctly;
165:  // path remains storage-free. Without the env var, ethercalc.net serves the
418: * stub. Defaults off in production. In local `wrangler dev` the flag can
~~~~~~~

### `packages/worker/src/routes/migrate.ts`

~~~~~~~text
9: *      An unset token yields `404` (the route is invisible) so production
~~~~~~~

### `packages/worker/test/assets.test.ts`

~~~~~~~text
261:  ])("does not publish production source-map path %s", async (path) => {
~~~~~~~

### `packages/worker/test/auth-do.node.test.ts`

~~~~~~~text
243:const RP_ID = 'ethercalc.net';
245:const ORIGIN = 'https://ethercalc.net';
~~~~~~~

### `packages/worker/test/csp.node.test.ts`

~~~~~~~text
15:      websocketAuthority('https://ethercalc.net', spoofed, true),
16:    ).toBe('wss://ethercalc.net');
25:    expect(websocketAuthority('https://ethercalc.net', spoofed, false)).toBe(
26:      'wss://ethercalc.net',
~~~~~~~

### `packages/worker/test/room.node.test.ts`

~~~~~~~text
2431:    // care about is "201 doesn't block on D1 commit". In production
~~~~~~~

### `packages/worker/test/routes-auth.node.test.ts`

~~~~~~~text
21:const AUTH_ORIGIN = 'https://ethercalc.net';
57:    ETHERCALC_RP_ID: 'ethercalc.net',
~~~~~~~

### `packages/worker/test/routes-rooms.node.test.ts`

~~~~~~~text
99:      new Request('http://www.ethercalc.net:8080/_exists/foo'),
100:      { ETHERCALC_ORIGIN: 'https://ethercalc.net' } as never,
104:      'https://ethercalc.net/_exists/foo',
108:  it.each(['https://ethercalc.net', 'not a URL'])(
~~~~~~~

### `packages/worker/wrangler.toml`

~~~~~~~text
6:# Disable the `*.workers.dev` hostname for production (L-14). It serves the
7:# identical Worker but lives OUTSIDE the `ethercalc.net` zone, so any zone-
12:# (https://ethercalc.net) rather than the old workers.dev URL.
15:# Custom domains. Requires the `ethercalc.net` zone to live under this
21:pattern = "ethercalc.net"
22:zone_name = "ethercalc.net"
25:pattern = "www.ethercalc.net"
26:zone_name = "ethercalc.net"
51:# mode / identity HMAC); production deploys should run
66:ETHERCALC_RP_ID = "ethercalc.net"
68:ETHERCALC_ORIGIN = "https://ethercalc.net"
70:# Staging overlay — isolated from production routes and cron triggers. It uses
72:[env.staging]
73:name = "ethercalc-staging"
78:[env.staging.vars]
81:# Phase A — passkey auth is live on staging for the WebAuthn acceptance test.
84:ETHERCALC_RP_ID = "ethercalc-staging.audreyt.workers.dev"
85:ETHERCALC_RP_NAME = "EtherCalc Staging"
86:ETHERCALC_ORIGIN = "https://ethercalc-staging.audreyt.workers.dev"
88:[[env.staging.durable_objects.bindings]]
92:[[env.staging.durable_objects.bindings]]
96:[[env.staging.d1_databases]]
102:[env.staging.assets]
107:[env.staging.triggers]
139:# Spreadsheet content can schedule mail, so production bindings MUST restrict
~~~~~~~

### `sandstorm-pkgdef.capnp`

~~~~~~~text
49:      website = "http://ethercalc.net/",
~~~~~~~

### `scripts/install-runtime-deps.js`

~~~~~~~text
12:const result = spawnSync('bun', ['install', '--production', '--ignore-scripts'], {
20:    "ethercalc: Bun is required but was not found on PATH. Install Bun (https://bun.sh), then run 'bun install --production --ignore-scripts' in the package root.",
~~~~~~~

### `scripts/triage-open-issues.ts`

~~~~~~~text
354:  add(292, 'Sandstorm localhost:8080', 'close_fixed', 'parseMultiEnv keeps same-origin basePath in production builds (import.meta.env.DEV gate)');
~~~~~~~

### `scripts/vite-workflow.test.ts`

~~~~~~~text
273:    expect(applyToBuildOrServe({}, { command: 'build', mode: 'production' })).toBe(true);
402:      { command: 'build', mode: 'production', isSsrBuild: false, isPreview: false },
458:test('nightly staging validation bypasses the generated production config', () => {
465:    'vp exec wrangler deploy --dry-run --config wrangler.toml --env staging',
468:    'run: vp exec wrangler deploy --dry-run --env staging',
~~~~~~~

### `scripts/vite-workflow.ts`

~~~~~~~text
2:// root `vp build` / `vp dev` are production-faithful: both must prepare the
100: * never starts if the first fails. Streams stdio through in production so
~~~~~~~

### `spikes/leanstral-xlsx-coords/README.md`

~~~~~~~text
55:Production: `ImportColumnOutOfRangeError` before replay (HTTP 400).
~~~~~~~

### `spikes/leanstral-xlsx-coords/attempt-2-request.md`

~~~~~~~text
27:- Production uses a 0-based SheetJS column index but SocialCalc caps at `ZZ`
83:that existing point tests miss. Production shipping code is the oracle;
90:missing AAA1 and a `copiedfrom` range that never reached AAA. Production
170:## 4. Production ZZ ceiling (verbatim)
523: * LemmaScript facade (spike pump input only — not production wiring).
536: * - Production rejection of columns beyond ZZ is
~~~~~~~

### `spikes/leanstral-xlsx-coords/leanstral-raw.md`

~~~~~~~text
41:Production impact: clipboard range is empty-string column,
~~~~~~~

### `start.html`

~~~~~~~text
44:    <a class="ec-floatnav__link" href="https://docs.ethercalc.net" target="_blank" rel="noopener">Docs</a>
~~~~~~~

### `static/multi.js`

~~~~~~~text
1:!function(e){function t(o){if(n[o])return n[o].exports;var r=n[o]={exports:{},id:o,loaded:!1};return e[o].call(r.exports,r,r.exports,t),r.loaded=!0,r.exports}var n={};return t.m=e,t.c=n,t.p="/static/",t(0)}([function(e,t,n){e.exports=n(1)},function(e,t,n){function o(){var e=arguments;return function(){var t,n;for(n=e[0].apply(this,arguments),t=1;t<e.length;++t)n=e[t](n);return n}}function r(e,t,n){return function(){return(n||e)[t].apply(e,arguments)}}function i(e,t){for(var n=-1,o=t.length>>>0;++n<o;)if(e===t[n])return!0;return!1}var a,s,u,c,l,p,d,f,h,m,v,y,g,E,N,b,C,_,D;n(2),a=n(6),s=n(153),u=/(?:127.0.0.1|localhost|\.local):8080/.exec(window.location.href)?"http://127.0.0.1:8000":".",c="foobar",/\/=([^_][^\/?]*)(?:\?.*)?$/.exec(window.location.href)&&(c=RegExp.$1),l=n(179).HackFoldr,p=/auth=0/.exec(window.location.href),d="",/\?auth=/.test(window.location.search)&&(p=/\??auth=0/.test(window.location.search),d=p?"/view":"/edit","."===u&&(u=".."),window.history.pushState({},"","./="+c+d)),f=a.DOM,h=f.div,m=f.iframe,v=f.input,y=f.button,g=o(a.createClass,a.createFactory),E=g({propTypes:{foldr:a.PropTypes.any.isRequired},getDefaultProps:function(){return{activeIndex:0}},render:function(){var e;return e=this.props.foldr.size()>1,h({className:"nav"+(p?" readonly":"")},b({rows:this.props.foldr.rows,activeIndex:this.getIdx(),onChange:r(this,"onChange")}),p?"":N({canDelete:e,onAdd:r(this,"onAdd"),onRename:r(this,"onRename"),onDelete:r(this,"onDelete")}))},getIdx:function(){var e,t;return(e=this.props.activeIndex)<(t=this.props.foldr.lastIndex())?e:t},getSheet:function(){return this.props.foldr.at(this.getIdx())},componentDidUpdate:function(){var e,t,n,o,r=[];for(e=0,n=(t=document.getElementsByTagName("iframe")).length;e<n;++e)o=t[e],r.push(D(o,this.props.foldr.rows));return r},onChange:function(e){return this.setProps({activeIndex:e}),document.getElementsByTagName("iframe")[e].contentWindow.focus()},onAdd:function(){var e,t,n,o,r;for(e=this.props.foldr,t="Sheet",n=e.size()+1,o="/"+c+".",/^([_a-zA-Z]+)(\d+)$/.exec(e.lastRow().title)&&(t=RegExp.$1,n=parseInt(RegExp.$2)),/^(\/[^=]+\.|\/sheet(?=\d))/.exec(e.lastRow().link)&&(o=RegExp.$1);i(t+""+n,e.titles())||i(o+""+n,e.links());)++n;return r=e.size(),e=e.push({link:o+""+n,title:t+""+n}),this.setProps({foldr:e,activeIndex:r})},onRename:function(){var e,t,n;if(e=this.props.foldr,t=prompt("Rename Sheet",this.getSheet().title),null!=t&&!i(t.toLowerCase(),function(){var t,o,r,i=[];for(t=0,r=(o=e.titles()).length;t<r;++t)n=o[t],i.push(n.toLowerCase());return i}()))return e.setAt(this.getIdx(),{title:t}),this.setProps({foldr:e})},onDelete:function(){var e;if(e=this.props.foldr,confirm("Really delete?\n"+this.getSheet().title))return e.deleteAt(this.getIdx()),this.setProps({foldr:e})}}),N=g({render:function(){return h({className:"buttons"},y({onClick:this.props.onAdd},"Add"),y({onClick:this.props.onRename},"Rename..."),y({onClick:this.props.onDelete,disabled:!this.props.canDelete},"Delete"))}}),b=g({onChange:function(e){return this.props.onChange(e)},render:function(){var e,t;return s.apply(null,[{activeIndex:this.props.activeIndex,onChange:r(this,"onChange"),tabVerticalPosition:"bottom"}].concat(function(){var n,o,r,i,a,s=[];for(n=0,r=(o=this.props.rows).length;n<r;++n)i=o[n],e=i.title,t=null!=(a=i.link)?a:"/"+encodeURIComponent(e),s.push(h({key:e,title:e,className:"wrapper"},C({src:u+""+t+d,rows:this.props.rows})));return s}.call(this)))}}),C=g({shouldComponentUpdate:function(e){return this.props.src!==e.src},render:function(){return m({key:this.props.src,src:this.props.src})},componentDidMount:function(){return D(this.getDOMNode(),this.props.rows)},componentDidUpdate:function(){return D(this.getDOMNode(),this.props.rows)}}),_=!0,D=function(e,t){var n;if(n=e.contentDocument,null!=n)return"complete"!==n.readyState?setTimeout(function(){return D(e,t)},1):setTimeout(function(){var n;if(e.contentWindow.postMessage(JSON.stringify({type:"multi",rows:t,index:c},void 0,2),"*"),n&&e===document.getElementsByTagName("iframe")[0])return e.contentWindow.focus(),n=!1},100)},function(e){return window.init=e}(function(){var e;return e=new l(u),e.fetch(c,function(){return a.render(E({foldr:e}),document.body)})})},function(e,t,n){var o=n(3);"string"==typeof o&&(o=[[e.id,o,""]]);n(5)(o,{})},function(e,t,n){t=e.exports=n(4)(),t.push([e.id,"body{margin:0;padding:0;overflow:hidden}nav,.buttons{background:#eee;font-family:Helvetica,sans-serif;border-top:1px solid #000;position:absolute!important;font-size:16px;height:22px;bottom:5px}nav{right:200px;left:0;padding-left:8px;white-space:nowrap}.readonly nav{right:0}.buttons{width:200px;right:0;padding-right:8px;text-align:right}.buttons button{font-family:Helvetica,sans-serif;background:#eee;font-size:14px;height:22px;border-radius:3px;border:1px solid #eee;margin-left:2px;cursor:pointer}.buttons button:hover{border:1px solid #ccc;background:#fff}.buttons button:disabled:hover{border:1px solid transparent;background:#eee;cursor:default}.basic-tabs-item{display:block!important;visibility:hidden}.basic-tabs-item.active{font-family:Helvetica,sans-serif;visibility:visible}.basic-tabs-item-title{background:#ccc;border:1px solid #000;border-top:none;padding:2px 10px;border-radius:0 0 8px 8px}.basic-tabs-item-title:hover{background:#eee;cursor:pointer}.basic-tabs-item-title.active{background:#fff;border-top:1px solid #fff;margin-top:-1px}body,iframe{height:100%}iframe{width:100%;border:0}.wrapper{position:absolute;width:100%;bottom:51px;top:0}body>.nav>.buttons{height:43px}body>.nav>.basic-tabs>nav.basic-tabs.basic-tabs-strip{height:43px;overflow-x:auto}",""])},function(e,t){e.exports=function(){var e=[];return e.toString=function(){for(var e=[],t=0;t<this.length;t++){var n=this[t];n[2]?e.push("@media "+n[2]+"{"+n[1]+"}"):e.push(n[1])}return e.join("")},e}},function(e,t,n){function o(e,t){for(var n=0;n<e.length;n++){var o=e[n],r=l[o.id];if(r){r.refs++;for(var i=0;i<r.parts.length;i++)r.parts[i](o.parts[i]);for(;i<o.parts.length;i++)r.parts.push(a(o.parts[i],t))}else{for(var s=[],i=0;i<o.parts.length;i++)s.push(a(o.parts[i],t));l[o.id]={id:o.id,refs:1,parts:s}}}}function r(e){for(var t=[],n={},o=0;o<e.length;o++){var r=e[o],i=r[0],a=r[1],s=r[2],u=r[3],c={css:a,media:s,sourceMap:u};n[i]?n[i].parts.push(c):t.push(n[i]={id:i,parts:[c]})}return t}function i(){var e=document.createElement("style"),t=f();return e.type="text/css",t.appendChild(e),e}function a(e,t){var n,o,r;if(t.singleton){var a=m++;n=h||(h=i()),o=u.bind(null,n,a,!1),r=u.bind(null,n,a,!0)}else n=i(),o=c.bind(null,n),r=function(){n.parentNode.removeChild(n)};return o(e),function(t){if(t){if(t.css===e.css&&t.media===e.media&&t.sourceMap===e.sourceMap)return;o(e=t)}else r()}}function s(e,t,n){var o=["/** >>"+t+" **/","/** "+t+"<< **/"],r=e.lastIndexOf(o[0]),i=n?o[0]+n+o[1]:"";if(e.lastIndexOf(o[0])>=0){var a=e.lastIndexOf(o[1])+o[1].length;return e.slice(0,r)+i+e.slice(a)}return e+i}function u(e,t,n,o){var r=n?"":o.css;if(e.styleSheet)e.styleSheet.cssText=s(e.styleSheet.cssText,t,r);else{var i=document.createTextNode(r),a=e.childNodes;a[t]&&e.removeChild(a[t]),a.length?e.insertBefore(i,a[t]):e.appendChild(i)}}function c(e,t){var n=t.css,o=t.media,r=t.sourceMap;if(r&&"function"==typeof btoa)try{n+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(JSON.stringify(r))+" */",n='@import url("data:text/css;base64,'+btoa(n)+'")'}catch(e){}if(o&&e.setAttribute("media",o),e.styleSheet)e.styleSheet.cssText=n;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(n))}}var l={},p=function(e){var t;return function(){return"undefined"==typeof t&&(t=e.apply(this,arguments)),t}},d=p(function(){return/msie 9\b/.test(window.navigator.userAgent.toLowerCase())}),f=p(function(){return document.head||document.getElementsByTagName("head")[0]}),h=null,m=0;e.exports=function(e,t){t=t||{},"undefined"==typeof t.singleton&&(t.singleton=d());var n=r(e);return o(n,t),function(e){for(var i=[],a=0;a<n.length;a++){var s=n[a],u=l[s.id];u.refs--,i.push(u)}if(e){var c=r(e);o(c,t)}for(var a=0;a<i.length;a++){var u=i[a];if(0===u.refs){for(var p=0;p<u.parts.length;p++)u.parts[p]();delete l[u.id]}}}}},function(e,t,n){e.exports=n(7)},function(e,t,n){(function(t){"use strict";var o=n(9),r=n(16),i=n(19),a=n(28),s=n(35),u=n(23),c=n(25),l=n(22),p=n(36),d=n(50),f=n(51),h=n(80),m=n(26),v=n(41),y=n(61),g=n(76),E=n(33),N=n(125),b=n(150),C=n(79),_=n(24),D=n(74),w=n(152);h.inject();var O=l.createElement,x=l.createFactory;"production"!==t.env.NODE_ENV&&(O=p.createElement,x=p.createFactory),O=v.wrapCreateElement(O),x=v.wrapCreateFactory(x);var M=E.measure("React","render",y.render),T={Children:{map:i.map,forEach:i.forEach,count:i.count,only:w},DOM:d,PropTypes:N,initializeTouchEvents:function(e){r.useTouchEvents=e},createClass:s.createClass,createElement:O,createFactory:x,constructAndRenderComponent:y.constructAndRenderComponent,constructAndRenderComponentByID:y.constructAndRenderComponentByID,render:M,renderToString:b.renderToString,renderToStaticMarkup:b.renderToStaticMarkup,unmountComponentAtNode:y.unmountComponentAtNode,isValidClass:v.isValidClass,isValidElement:l.isValidElement,withContext:u.withContext,__spread:_,renderComponent:D("React","renderComponent","render",this,M),renderComponentToString:D("React","renderComponentToString","renderToString",this,b.renderToString),renderComponentToStaticMarkup:D("React","renderComponentToStaticMarkup","renderToStaticMarkup",this,b.renderToStaticMarkup),isValidComponent:D("React","isValidComponent","isValidElement",this,l.isValidElement)};if("undefined"!=typeof __REACT_DEVTOOLS_GLOBAL_HOOK__&&"function"==typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject&&__REACT_DEVTOOLS_GLOBAL_HOOK__.inject({Component:a,CurrentOwner:c,DOMComponent:f,DOMPropertyOperations:o,InstanceHandles:m,Mount:y,MultiChild:g,TextComponent:C}),"production"!==t.env.NODE_ENV){var R=n(54);if(R.canUseDOM&&window.top===window.self){navigator.userAgent.indexOf("Chrome")>-1&&"undefined"==typeof __REACT_DEVTOOLS_GLOBAL_HOOK__&&console.debug("Download the React DevTools for a better development experience: http://fb.me/react-devtools");for(var I=[Array.isArray,Array.prototype.every,Array.prototype.forEach,Array.prototype.indexOf,Array.prototype.map,Date.now,Function.prototype.bind,Object.keys,String.prototype.split,String.prototype.trim,Object.create,Object.freeze],S=0;S<I.length;S++)if(!I[S]){console.error("One or more ES5 shim/shams expected by React are not available: http://fb.me/react-warning-polyfills");break}}}T.version="0.12.2",e.exports=T}).call(t,n(8))},function(e,t){function n(){throw new Error("setTimeout has not been defined")}function o(){throw new Error("clearTimeout has not been defined")}function r(e){if(l===setTimeout)return setTimeout(e,0);if((l===n||!l)&&setTimeout)return l=setTimeout,setTimeout(e,0);try{return l(e,0)}catch(t){try{return l.call(null,e,0)}catch(t){return l.call(this,e,0)}}}function i(e){if(p===clearTimeout)return clearTimeout(e);if((p===o||!p)&&clearTimeout)return p=clearTimeout,clearTimeout(e);try{return p(e)}catch(t){try{return p.call(null,e)}catch(t){return p.call(this,e)}}}function a(){m&&f&&(m=!1,f.length?h=f.concat(h):v=-1,h.length&&s())}function s(){if(!m){var e=r(a);m=!0;for(var t=h.length;t;){for(f=h,h=[];++v<t;)f&&f[v].run();v=-1,t=h.length}f=null,m=!1,i(e)}}function u(e,t){this.fun=e,this.array=t}function c(){}var l,p,d=e.exports={};!function(){try{l="function"==typeof setTimeout?setTimeout:n}catch(e){l=n}try{p="function"==typeof clearTimeout?clearTimeout:o}catch(e){p=o}}();var f,h=[],m=!1,v=-1;d.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];h.push(new u(e,t)),1!==h.length||m||r(s)},u.prototype.run=function(){this.fun.apply(null,this.array)},d.title="browser",d.browser=!0,d.env={},d.argv=[],d.version="",d.versions={},d.on=c,d.addListener=c,d.once=c,d.off=c,d.removeListener=c,d.removeAllListeners=c,d.emit=c,d.prependListener=c,d.prependOnceListener=c,d.listeners=function(e){return[]},d.binding=function(e){throw new Error("process.binding is not supported")},d.cwd=function(){return"/"},d.chdir=function(e){throw new Error("process.chdir is not supported")},d.umask=function(){return 0}},function(e,t,n){(function(t){"use strict";function o(e,t){return null==t||r.hasBooleanValue[e]&&!t||r.hasNumericValue[e]&&isNaN(t)||r.hasPositiveNumericValue[e]&&t<1||r.hasOverloadedBooleanValue[e]&&t===!1}var r=n(10),i=n(12),a=n(13),s=n(14),u=a(function(e){return i(e)+'="'});if("production"!==t.env.NODE_ENV)var c={children:!0,dangerouslySetInnerHTML:!0,key:!0,ref:!0},l={},p=function(e){if(!(c.hasOwnProperty(e)&&c[e]||l.hasOwnProperty(e)&&l[e])){l[e]=!0;var n=e.toLowerCase(),o=r.isCustomAttribute(n)?n:r.getPossibleStandardName.hasOwnProperty(n)?r.getPossibleStandardName[n]:null;"production"!==t.env.NODE_ENV?s(null==o,"Unknown DOM property "+e+". Did you mean "+o+"?"):null}};var d={createMarkupForID:function(e){return u(r.ID_ATTRIBUTE_NAME)+i(e)+'"'},createMarkupForProperty:function(e,n){if(r.isStandardName.hasOwnProperty(e)&&r.isStandardName[e]){if(o(e,n))return"";var a=r.getAttributeName[e];return r.hasBooleanValue[e]||r.hasOverloadedBooleanValue[e]&&n===!0?i(a):u(a)+i(n)+'"'}return r.isCustomAttribute(e)?null==n?"":u(e)+i(n)+'"':("production"!==t.env.NODE_ENV&&p(e),null)},setValueForProperty:function(e,n,i){if(r.isStandardName.hasOwnProperty(n)&&r.isStandardName[n]){var a=r.getMutationMethod[n];if(a)a(e,i);else if(o(n,i))this.deleteValueForProperty(e,n);else if(r.mustUseAttribute[n])e.setAttribute(r.getAttributeName[n],""+i);else{var s=r.getPropertyName[n];r.hasSideEffects[n]&&""+e[s]==""+i||(e[s]=i)}}else r.isCustomAttribute(n)?null==i?e.removeAttribute(n):e.setAttribute(n,""+i):"production"!==t.env.NODE_ENV&&p(n)},deleteValueForProperty:function(e,n){if(r.isStandardName.hasOwnProperty(n)&&r.isStandardName[n]){var o=r.getMutationMethod[n];if(o)o(e,void 0);else if(r.mustUseAttribute[n])e.removeAttribute(r.getAttributeName[n]);else{var i=r.getPropertyName[n],a=r.getDefaultValueForProperty(e.nodeName,i);r.hasSideEffects[n]&&""+e[i]===a||(e[i]=a)}}else r.isCustomAttribute(n)?e.removeAttribute(n):"production"!==t.env.NODE_ENV&&p(n)}};e.exports=d}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e,t){return(e&t)===t}var r=n(11),i={MUST_USE_ATTRIBUTE:1,MUST_USE_PROPERTY:2,HAS_SIDE_EFFECTS:4,HAS_BOOLEAN_VALUE:8,HAS_NUMERIC_VALUE:16,HAS_POSITIVE_NUMERIC_VALUE:48,HAS_OVERLOADED_BOOLEAN_VALUE:64,injectDOMPropertyConfig:function(e){var n=e.Properties||{},a=e.DOMAttributeNames||{},u=e.DOMPropertyNames||{},c=e.DOMMutationMethods||{};e.isCustomAttribute&&s._isCustomAttributeFunctions.push(e.isCustomAttribute);for(var l in n){"production"!==t.env.NODE_ENV?r(!s.isStandardName.hasOwnProperty(l),"injectDOMPropertyConfig(...): You're trying to inject DOM property '%s' which has already been injected. You may be accidentally injecting the same DOM property config twice, or you may be injecting two configs that have conflicting property names.",l):r(!s.isStandardName.hasOwnProperty(l)),s.isStandardName[l]=!0;var p=l.toLowerCase();if(s.getPossibleStandardName[p]=l,a.hasOwnProperty(l)){var d=a[l];s.getPossibleStandardName[d]=l,s.getAttributeName[l]=d}else s.getAttributeName[l]=p;s.getPropertyName[l]=u.hasOwnProperty(l)?u[l]:l,c.hasOwnProperty(l)?s.getMutationMethod[l]=c[l]:s.getMutationMethod[l]=null;var f=n[l];s.mustUseAttribute[l]=o(f,i.MUST_USE_ATTRIBUTE),s.mustUseProperty[l]=o(f,i.MUST_USE_PROPERTY),s.hasSideEffects[l]=o(f,i.HAS_SIDE_EFFECTS),s.hasBooleanValue[l]=o(f,i.HAS_BOOLEAN_VALUE),s.hasNumericValue[l]=o(f,i.HAS_NUMERIC_VALUE),s.hasPositiveNumericValue[l]=o(f,i.HAS_POSITIVE_NUMERIC_VALUE),s.hasOverloadedBooleanValue[l]=o(f,i.HAS_OVERLOADED_BOOLEAN_VALUE),"production"!==t.env.NODE_ENV?r(!s.mustUseAttribute[l]||!s.mustUseProperty[l],"DOMProperty: Cannot require using both attribute and property: %s",l):r(!s.mustUseAttribute[l]||!s.mustUseProperty[l]),"production"!==t.env.NODE_ENV?r(s.mustUseProperty[l]||!s.hasSideEffects[l],"DOMProperty: Properties that have side effects must use property: %s",l):r(s.mustUseProperty[l]||!s.hasSideEffects[l]),"production"!==t.env.NODE_ENV?r(!!s.hasBooleanValue[l]+!!s.hasNumericValue[l]+!!s.hasOverloadedBooleanValue[l]<=1,"DOMProperty: Value can be one of boolean, overloaded boolean, or numeric value, but not a combination: %s",l):r(!!s.hasBooleanValue[l]+!!s.hasNumericValue[l]+!!s.hasOverloadedBooleanValue[l]<=1)}}},a={},s={ID_ATTRIBUTE_NAME:"data-reactid",isStandardName:{},getPossibleStandardName:{},getAttributeName:{},getPropertyName:{},getMutationMethod:{},mustUseAttribute:{},mustUseProperty:{},hasSideEffects:{},hasBooleanValue:{},hasNumericValue:{},hasPositiveNumericValue:{},hasOverloadedBooleanValue:{},_isCustomAttributeFunctions:[],isCustomAttribute:function(e){for(var t=0;t<s._isCustomAttributeFunctions.length;t++){var n=s._isCustomAttributeFunctions[t];if(n(e))return!0}return!1},getDefaultValueForProperty:function(e,t){var n,o=a[e];return o||(a[e]=o={}),t in o||(n=document.createElement(e),o[t]=n[t]),o[t]},injection:i};e.exports=s}).call(t,n(8))},function(e,t,n){(function(t){"use strict";var n=function(e,n,o,r,i,a,s,u){if("production"!==t.env.NODE_ENV&&void 0===n)throw new Error("invariant requires an error message argument");if(!e){var c;if(void 0===n)c=new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");else{var l=[o,r,i,a,s,u],p=0;c=new Error("Invariant Violation: "+n.replace(/%s/g,function(){return l[p++]}))}throw c.framesToPop=1,c}};e.exports=n}).call(t,n(8))},function(e,t){"use strict";function n(e){return r[e]}function o(e){return(""+e).replace(i,n)}var r={"&":"&amp;",">":"&gt;","<":"&lt;",'"':"&quot;","'":"&#x27;"},i=/[&><"']/g;e.exports=o},function(e,t){"use strict";function n(e){var t={};return function(n){return t.hasOwnProperty(n)?t[n]:t[n]=e.call(this,n)}}e.exports=n},function(e,t,n){(function(t){"use strict";var o=n(15),r=o;"production"!==t.env.NODE_ENV&&(r=function(e,t){for(var n=[],o=2,r=arguments.length;o<r;o++)n.push(arguments[o]);if(void 0===t)throw new Error("`warning(condition, format, ...args)` requires a warning message argument");if(!e){var i=0;console.warn("Warning: "+t.replace(/%s/g,function(){return n[i++]}))}}),e.exports=r}).call(t,n(8))},function(e,t){function n(e){return function(){return e}}function o(){}o.thatReturns=n,o.thatReturnsFalse=n(!1),o.thatReturnsTrue=n(!0),o.thatReturnsNull=n(null),o.thatReturnsThis=function(){return this},o.thatReturnsArgument=function(e){return e},e.exports=o},function(e,t,n){(function(t){"use strict";function o(e){return e===y.topMouseUp||e===y.topTouchEnd||e===y.topTouchCancel}function r(e){return e===y.topMouseMove||e===y.topTouchMove}function i(e){return e===y.topMouseDown||e===y.topTouchStart}function a(e,n){var o=e._dispatchListeners,r=e._dispatchIDs;if("production"!==t.env.NODE_ENV&&f(e),Array.isArray(o))for(var i=0;i<o.length&&!e.isPropagationStopped();i++)n(e,o[i],r[i]);else o&&n(e,o,r)}function s(e,t,n){e.currentTarget=v.Mount.getNode(n);var o=t(e,n);return e.currentTarget=null,o}function u(e,t){a(e,t),e._dispatchListeners=null,e._dispatchIDs=null}function c(e){var n=e._dispatchListeners,o=e._dispatchIDs;if("production"!==t.env.NODE_ENV&&f(e),Array.isArray(n)){for(var r=0;r<n.length&&!e.isPropagationStopped();r++)if(n[r](e,o[r]))return o[r]}else if(n&&n(e,o))return o;return null}function l(e){var t=c(e);return e._dispatchIDs=null,e._dispatchListeners=null,t}function p(e){"production"!==t.env.NODE_ENV&&f(e);var n=e._dispatchListeners,o=e._dispatchIDs;"production"!==t.env.NODE_ENV?m(!Array.isArray(n),"executeDirectDispatch(...): Invalid `event`."):m(!Array.isArray(n));var r=n?n(e,o):null;return e._dispatchListeners=null,e._dispatchIDs=null,r}function d(e){return!!e._dispatchListeners}var f,h=n(17),m=n(11),v={Mount:null,injectMount:function(e){v.Mount=e,"production"!==t.env.NODE_ENV&&("production"!==t.env.NODE_ENV?m(e&&e.getNode,"EventPluginUtils.injection.injectMount(...): Injected Mount module is missing getNode."):m(e&&e.getNode))}},y=h.topLevelTypes;"production"!==t.env.NODE_ENV&&(f=function(e){var n=e._dispatchListeners,o=e._dispatchIDs,r=Array.isArray(n),i=Array.isArray(o),a=i?o.length:o?1:0,s=r?n.length:n?1:0;"production"!==t.env.NODE_ENV?m(i===r&&a===s,"EventPluginUtils: Invalid `event`."):m(i===r&&a===s)});var g={isEndish:o,isMoveish:r,isStartish:i,executeDirectDispatch:p,executeDispatch:s,executeDispatchesInOrder:u,executeDispatchesInOrderStopAtTrue:l,hasDispatches:d,injection:v,useTouchEvents:!1};e.exports=g}).call(t,n(8))},function(e,t,n){"use strict";var o=n(18),r=o({bubbled:null,captured:null}),i=o({topBlur:null,topChange:null,topClick:null,topCompositionEnd:null,topCompositionStart:null,topCompositionUpdate:null,topContextMenu:null,topCopy:null,topCut:null,topDoubleClick:null,topDrag:null,topDragEnd:null,topDragEnter:null,topDragExit:null,topDragLeave:null,topDragOver:null,topDragStart:null,topDrop:null,topError:null,topFocus:null,topInput:null,topKeyDown:null,topKeyPress:null,topKeyUp:null,topLoad:null,topMouseDown:null,topMouseMove:null,topMouseOut:null,topMouseOver:null,topMouseUp:null,topPaste:null,topReset:null,topScroll:null,topSelectionChange:null,topSubmit:null,topTextInput:null,topTouchCancel:null,topTouchEnd:null,topTouchMove:null,topTouchStart:null,topWheel:null}),a={topLevelTypes:i,PropagationPhases:r};e.exports=a},function(e,t,n){(function(t){"use strict";var o=n(11),r=function(e){var n,r={};"production"!==t.env.NODE_ENV?o(e instanceof Object&&!Array.isArray(e),"keyMirror(...): Argument must be an object."):o(e instanceof Object&&!Array.isArray(e));for(n in e)e.hasOwnProperty(n)&&(r[n]=n);return r};e.exports=r}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e,t){this.forEachFunction=e,this.forEachContext=t}function r(e,t,n,o){var r=e;r.forEachFunction.call(r.forEachContext,t,o)}function i(e,t,n){if(null==e)return e;var i=o.getPooled(t,n);d(e,r,i),o.release(i)}function a(e,t,n){this.mapResult=e,this.mapFunction=t,this.mapContext=n}function s(e,n,o,r){var i=e,a=i.mapResult,s=!a.hasOwnProperty(o);if("production"!==t.env.NODE_ENV?f(s,"ReactChildren.map(...): Encountered two children with the same key, `%s`. Child keys must be unique; when two children share a key, only the first child will be used.",o):null,s){var u=i.mapFunction.call(i.mapContext,n,r);a[o]=u}}function u(e,t,n){if(null==e)return e;var o={},r=a.getPooled(o,t,n);return d(e,s,r),a.release(r),o}function c(e,t,n,o){return null}function l(e,t){return d(e,c,null)}var p=n(20),d=n(21),f=n(14),h=p.twoArgumentPooler,m=p.threeArgumentPooler;p.addPoolingTo(o,h),p.addPoolingTo(a,m);var v={forEach:i,map:u,count:l};e.exports=v}).call(t,n(8))},function(e,t,n){(function(t){"use strict";var o=n(11),r=function(e){var t=this;if(t.instancePool.length){var n=t.instancePool.pop();return t.call(n,e),n}return new t(e)},i=function(e,t){var n=this;if(n.instancePool.length){var o=n.instancePool.pop();return n.call(o,e,t),o}return new n(e,t)},a=function(e,t,n){var o=this;if(o.instancePool.length){var r=o.instancePool.pop();return o.call(r,e,t,n),r}return new o(e,t,n)},s=function(e,t,n,o,r){var i=this;if(i.instancePool.length){var a=i.instancePool.pop();return i.call(a,e,t,n,o,r),a}return new i(e,t,n,o,r)},u=function(e){var n=this;"production"!==t.env.NODE_ENV?o(e instanceof n,"Trying to release an instance into a pool of a different type."):o(e instanceof n),e.destructor&&e.destructor(),n.instancePool.length<n.poolSize&&n.instancePool.push(e)},c=10,l=r,p=function(e,t){var n=e;return n.instancePool=[],n.getPooled=t||l,n.poolSize||(n.poolSize=c),n.release=u,n},d={addPoolingTo:p,oneArgumentPooler:r,twoArgumentPooler:i,threeArgumentPooler:a,fiveArgumentPooler:s};e.exports=d}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e){return f[e]}function r(e,t){return e&&null!=e.key?a(e.key):t.toString(36)}function i(e){return(""+e).replace(h,o)}function a(e){return"$"+i(e)}function s(e,t,n){return null==e?0:m(e,"",0,t,n)}var u=n(22),c=n(26),l=n(11),p=c.SEPARATOR,d=":",f={"=":"=0",".":"=1",":":"=2"},h=/[=.:]/g,m=function(e,n,o,i,s){var c,f,h=0;if(Array.isArray(e))for(var v=0;v<e.length;v++){var y=e[v];c=n+(n?d:p)+r(y,v),f=o+h,h+=m(y,c,f,i,s)}else{var g=typeof e,E=""===n,N=E?p+r(e,0):n;if(null==e||"boolean"===g)i(s,null,N,o),h=1;else if("string"===g||"number"===g||u.isValidElement(e))i(s,e,N,o),h=1;else if("object"===g){"production"!==t.env.NODE_ENV?l(!e||1!==e.nodeType,"traverseAllChildren(...): Encountered an invalid child; DOM elements are not valid children of React components."):l(!e||1!==e.nodeType);for(var b in e)e.hasOwnProperty(b)&&(c=n+(n?d:p)+a(b)+d+r(e[b],0),f=o+h,h+=m(e[b],c,f,i,s))}}return h};e.exports=s}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e,n){Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:function(){return this._store?this._store[n]:null},set:function(e){"production"!==t.env.NODE_ENV?s(!1,"Don't set the "+n+" property of the component. Mutate the existing props object instead."):null,this._store[n]=e}})}function r(e){try{var t={props:!0};for(var n in t)o(e,n);c=!0}catch(e){}}var i=n(23),a=n(25),s=n(14),u={key:!0,ref:!0},c=!1,l=function(e,n,o,r,i,a){return this.type=e,this.key=n,this.ref=o,this._owner=r,this._context=i,"production"!==t.env.NODE_ENV&&(this._store={validated:!1,props:a},c)?void Object.freeze(this):void(this.props=a)};l.prototype={_isReactElement:!0},"production"!==t.env.NODE_ENV&&r(l.prototype),l.createElement=function(e,n,o){var r,c={},p=null,d=null;if(null!=n){d=void 0===n.ref?null:n.ref,"production"!==t.env.NODE_ENV&&("production"!==t.env.NODE_ENV?s(null!==n.key,"createElement(...): Encountered component with a `key` of null. In a future version, this will be treated as equivalent to the string 'null'; instead, provide an explicit key or use undefined."):null),p=null==n.key?null:""+n.key;for(r in n)n.hasOwnProperty(r)&&!u.hasOwnProperty(r)&&(c[r]=n[r])}var f=arguments.length-2;if(1===f)c.children=o;else if(f>1){for(var h=Array(f),m=0;m<f;m++)h[m]=arguments[m+2];c.children=h}if(e&&e.defaultProps){var v=e.defaultProps;for(r in v)"undefined"==typeof c[r]&&(c[r]=v[r])}return new l(e,p,d,a.current,i.current,c)},l.createFactory=function(e){var t=l.createElement.bind(null,e);return t.type=e,t},l.cloneAndReplaceProps=function(e,n){var o=new l(e.type,e.key,e.ref,e._owner,e._context,n);return"production"!==t.env.NODE_ENV&&(o._store.validated=e._store.validated),o},l.isValidElement=function(e){var t=!(!e||!e._isReactElement);return t},e.exports=l}).call(t,n(8))},function(e,t,n){"use strict";var o=n(24),r={current:{},withContext:function(e,t){var n,i=r.current;r.current=o({},i,e);try{n=t()}finally{r.current=i}return n}};e.exports=r},function(e,t){function n(e,t){if(null==e)throw new TypeError("Object.assign target cannot be null or undefined");for(var n=Object(e),o=Object.prototype.hasOwnProperty,r=1;r<arguments.length;r++){var i=arguments[r];if(null!=i){var a=Object(i);for(var s in a)o.call(a,s)&&(n[s]=a[s])}}return n}e.exports=n},function(e,t){"use strict";var n={current:null};e.exports=n},function(e,t,n){(function(t){"use strict";function o(e){return f+e.toString(36)}function r(e,t){return e.charAt(t)===f||t===e.length}function i(e){return""===e||e.charAt(0)===f&&e.charAt(e.length-1)!==f}function a(e,t){return 0===t.indexOf(e)&&r(t,e.length)}function s(e){return e?e.substr(0,e.lastIndexOf(f)):""}function u(e,n){if("production"!==t.env.NODE_ENV?d(i(e)&&i(n),"getNextDescendantID(%s, %s): Received an invalid React DOM ID.",e,n):d(i(e)&&i(n)),"production"!==t.env.NODE_ENV?d(a(e,n),"getNextDescendantID(...): React has made an invalid assumption about the DOM hierarchy. Expected `%s` to be an ancestor of `%s`.",e,n):d(a(e,n)),e===n)return e;for(var o=e.length+h,s=o;s<n.length&&!r(n,s);s++);return n.substr(0,s)}function c(e,n){var o=Math.min(e.length,n.length);if(0===o)return"";for(var a=0,s=0;s<=o;s++)if(r(e,s)&&r(n,s))a=s;else if(e.charAt(s)!==n.charAt(s))break;var u=e.substr(0,a);return"production"!==t.env.NODE_ENV?d(i(u),"getFirstCommonAncestorID(%s, %s): Expected a valid React DOM ID: %s",e,n,u):d(i(u)),u}function l(e,n,o,r,i,c){e=e||"",n=n||"","production"!==t.env.NODE_ENV?d(e!==n,"traverseParentPath(...): Cannot traverse from and to the same ID, `%s`.",e):d(e!==n);var l=a(n,e);"production"!==t.env.NODE_ENV?d(l||a(e,n),"traverseParentPath(%s, %s, ...): Cannot traverse from two IDs that do not have a parent path.",e,n):d(l||a(e,n));for(var p=0,f=l?s:u,h=e;;h=f(h,n)){var v;if(i&&h===e||c&&h===n||(v=o(h,l,r)),v===!1||h===n)break;"production"!==t.env.NODE_ENV?d(p++<m,"traverseParentPath(%s, %s, ...): Detected an infinite loop while traversing the React DOM ID tree. This may be due to malformed IDs: %s",e,n):d(p++<m)}}var p=n(27),d=n(11),f=".",h=f.length,m=100,v={createReactRootID:function(){return o(p.createReactRootIndex())},createReactID:function(e,t){return e+t},getReactRootIDFromNodeID:function(e){if(e&&e.charAt(0)===f&&e.length>1){var t=e.indexOf(f,1);return t>-1?e.substr(0,t):e}return null},traverseEnterLeave:function(e,t,n,o,r){var i=c(e,t);i!==e&&l(e,i,n,o,!1,!0),i!==t&&l(i,t,n,r,!0,!1)},traverseTwoPhase:function(e,t,n){e&&(l("",e,t,n,!0,!1),l(e,"",t,n,!1,!0))},traverseAncestors:function(e,t,n){l("",e,t,n,!0,!1)},_getFirstCommonAncestorID:c,_getNextDescendantID:u,isAncestorIDOf:a,SEPARATOR:f};e.exports=v}).call(t,n(8))},function(e,t){"use strict";var n={injectCreateReactRootIndex:function(e){o.createReactRootIndex=e}},o={createReactRootIndex:null,injection:n};e.exports=o},function(e,t,n){(function(t){"use strict";var o=n(22),r=n(29),i=n(31),a=n(24),s=n(11),u=n(18),c=u({MOUNTED:null,UNMOUNTED:null}),l=!1,p=null,d=null,f={injection:{injectEnvironment:function(e){"production"!==t.env.NODE_ENV?s(!l,"ReactComponent: injectEnvironment() can only be called once."):s(!l),d=e.mountImageIntoNode,p=e.unmountIDFromEnvironment,f.BackendIDOperations=e.BackendIDOperations,l=!0}},LifeCycle:c,BackendIDOperations:null,Mixin:{isMounted:function(){return this._lifeCycleState===c.MOUNTED},setProps:function(e,t){var n=this._pendingElement||this._currentElement;this.replaceProps(a({},n.props,e),t)},replaceProps:function(e,n){"production"!==t.env.NODE_ENV?s(this.isMounted(),"replaceProps(...): Can only update a mounted component."):s(this.isMounted()),"production"!==t.env.NODE_ENV?s(0===this._mountDepth,"replaceProps(...): You called `setProps` or `replaceProps` on a component with a parent. This is an anti-pattern since props will get reactively updated when rendered. Instead, change the owner's `render` method to pass the correct value as props to the component where it is created."):s(0===this._mountDepth),this._pendingElement=o.cloneAndReplaceProps(this._pendingElement||this._currentElement,e),i.enqueueUpdate(this,n)},_setPropsInternal:function(e,t){var n=this._pendingElement||this._currentElement;this._pendingElement=o.cloneAndReplaceProps(n,a({},n.props,e)),i.enqueueUpdate(this,t)},construct:function(e){this.props=e.props,this._owner=e._owner,this._lifeCycleState=c.UNMOUNTED,this._pendingCallbacks=null,this._currentElement=e,this._pendingElement=null},mountComponent:function(e,n,o){"production"!==t.env.NODE_ENV?s(!this.isMounted(),"mountComponent(%s, ...): Can only mount an unmounted component. Make sure to avoid storing components between renders or reusing a single component instance in multiple places.",e):s(!this.isMounted());var i=this._currentElement.ref;if(null!=i){var a=this._currentElement._owner;r.addComponentAsRefTo(this,i,a)}this._rootNodeID=e,this._lifeCycleState=c.MOUNTED,this._mountDepth=o},unmountComponent:function(){"production"!==t.env.NODE_ENV?s(this.isMounted(),"unmountComponent(): Can only unmount a mounted component."):s(this.isMounted());var e=this._currentElement.ref;null!=e&&r.removeComponentAsRefFrom(this,e,this._owner),p(this._rootNodeID),this._rootNodeID=null,this._lifeCycleState=c.UNMOUNTED},receiveComponent:function(e,n){
2:"production"!==t.env.NODE_ENV?s(this.isMounted(),"receiveComponent(...): Can only update a mounted component."):s(this.isMounted()),this._pendingElement=e,this.performUpdateIfNecessary(n)},performUpdateIfNecessary:function(e){if(null!=this._pendingElement){var t=this._currentElement,n=this._pendingElement;this._currentElement=n,this.props=n.props,this._owner=n._owner,this._pendingElement=null,this.updateComponent(e,t)}},updateComponent:function(e,t){var n=this._currentElement;n._owner===t._owner&&n.ref===t.ref||(null!=t.ref&&r.removeComponentAsRefFrom(this,t.ref,t._owner),null!=n.ref&&r.addComponentAsRefTo(this,n.ref,n._owner))},mountComponentIntoNode:function(e,t,n){var o=i.ReactReconcileTransaction.getPooled();o.perform(this._mountComponentIntoNode,this,e,t,o,n),i.ReactReconcileTransaction.release(o)},_mountComponentIntoNode:function(e,t,n,o){var r=this.mountComponent(e,n,0);d(r,t,o)},isOwnedBy:function(e){return this._owner===e},getSiblingByRef:function(e){var t=this._owner;return t&&t.refs?t.refs[e]:null}}};e.exports=f}).call(t,n(8))},function(e,t,n){(function(t){"use strict";var o=n(30),r=n(11),i={isValidOwner:function(e){return!(!e||"function"!=typeof e.attachRef||"function"!=typeof e.detachRef)},addComponentAsRefTo:function(e,n,o){"production"!==t.env.NODE_ENV?r(i.isValidOwner(o),"addComponentAsRefTo(...): Only a ReactOwner can have refs. This usually means that you're trying to add a ref to a component that doesn't have an owner (that is, was not created inside of another component's `render` method). Try rendering this component inside of a new top-level component which will hold the ref."):r(i.isValidOwner(o)),o.attachRef(n,e)},removeComponentAsRefFrom:function(e,n,o){"production"!==t.env.NODE_ENV?r(i.isValidOwner(o),"removeComponentAsRefFrom(...): Only a ReactOwner can have refs. This usually means that you're trying to remove a ref to a component that doesn't have an owner (that is, was not created inside of another component's `render` method). Try rendering this component inside of a new top-level component which will hold the ref."):r(i.isValidOwner(o)),o.refs[n]===e&&o.detachRef(n)},Mixin:{construct:function(){this.refs=o},attachRef:function(e,n){"production"!==t.env.NODE_ENV?r(n.isOwnedBy(this),"attachRef(%s, ...): Only a component's owner can store a ref to it.",e):r(n.isOwnedBy(this));var i=this.refs===o?this.refs={}:this.refs;i[e]=n},detachRef:function(e){delete this.refs[e]}}};e.exports=i}).call(t,n(8))},function(e,t,n){(function(t){"use strict";var n={};"production"!==t.env.NODE_ENV&&Object.freeze(n),e.exports=n}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(){"production"!==t.env.NODE_ENV?v(x.ReactReconcileTransaction&&b,"ReactUpdates: must inject a reconcile transaction class and batching strategy"):v(x.ReactReconcileTransaction&&b)}function r(){this.reinitializeTransaction(),this.dirtyComponentsLength=null,this.callbackQueue=l.getPooled(),this.reconcileTransaction=x.ReactReconcileTransaction.getPooled()}function i(e,t,n){o(),b.batchedUpdates(e,t,n)}function a(e,t){return e._mountDepth-t._mountDepth}function s(e){var n=e.dirtyComponentsLength;"production"!==t.env.NODE_ENV?v(n===g.length,"Expected flush transaction's stored dirty-components length (%s) to match dirty-components array length (%s).",n,g.length):v(n===g.length),g.sort(a);for(var o=0;o<n;o++){var r=g[o];if(r.isMounted()){var i=r._pendingCallbacks;if(r._pendingCallbacks=null,r.performUpdateIfNecessary(e.reconcileTransaction),i)for(var s=0;s<i.length;s++)e.callbackQueue.enqueue(i[s],r)}}}function u(e,n){return"production"!==t.env.NODE_ENV?v(!n||"function"==typeof n,"enqueueUpdate(...): You called `setProps`, `replaceProps`, `setState`, `replaceState`, or `forceUpdate` with a callback that isn't callable."):v(!n||"function"==typeof n),o(),"production"!==t.env.NODE_ENV?y(null==d.current,"enqueueUpdate(): Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate."):null,b.isBatchingUpdates?(g.push(e),void(n&&(e._pendingCallbacks?e._pendingCallbacks.push(n):e._pendingCallbacks=[n]))):void b.batchedUpdates(u,e,n)}function c(e,n){"production"!==t.env.NODE_ENV?v(b.isBatchingUpdates,"ReactUpdates.asap: Can't enqueue an asap callback in a context whereupdates are not being batched."):v(b.isBatchingUpdates),E.enqueue(e,n),N=!0}var l=n(32),p=n(20),d=n(25),f=n(33),h=n(34),m=n(24),v=n(11),y=n(14),g=[],E=l.getPooled(),N=!1,b=null,C={initialize:function(){this.dirtyComponentsLength=g.length},close:function(){this.dirtyComponentsLength!==g.length?(g.splice(0,this.dirtyComponentsLength),w()):g.length=0}},_={initialize:function(){this.callbackQueue.reset()},close:function(){this.callbackQueue.notifyAll()}},D=[C,_];m(r.prototype,h.Mixin,{getTransactionWrappers:function(){return D},destructor:function(){this.dirtyComponentsLength=null,l.release(this.callbackQueue),this.callbackQueue=null,x.ReactReconcileTransaction.release(this.reconcileTransaction),this.reconcileTransaction=null},perform:function(e,t,n){return h.Mixin.perform.call(this,this.reconcileTransaction.perform,this.reconcileTransaction,e,t,n)}}),p.addPoolingTo(r);var w=f.measure("ReactUpdates","flushBatchedUpdates",function(){for(;g.length||N;){if(g.length){var e=r.getPooled();e.perform(s,null,e),r.release(e)}if(N){N=!1;var t=E;E=l.getPooled(),t.notifyAll(),l.release(t)}}}),O={injectReconcileTransaction:function(e){"production"!==t.env.NODE_ENV?v(e,"ReactUpdates: must provide a reconcile transaction class"):v(e),x.ReactReconcileTransaction=e},injectBatchingStrategy:function(e){"production"!==t.env.NODE_ENV?v(e,"ReactUpdates: must provide a batching strategy"):v(e),"production"!==t.env.NODE_ENV?v("function"==typeof e.batchedUpdates,"ReactUpdates: must provide a batchedUpdates() function"):v("function"==typeof e.batchedUpdates),"production"!==t.env.NODE_ENV?v("boolean"==typeof e.isBatchingUpdates,"ReactUpdates: must provide an isBatchingUpdates boolean attribute"):v("boolean"==typeof e.isBatchingUpdates),b=e}},x={ReactReconcileTransaction:null,batchedUpdates:i,enqueueUpdate:u,flushBatchedUpdates:w,injection:O,asap:c};e.exports=x}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(){this._callbacks=null,this._contexts=null}var r=n(20),i=n(24),a=n(11);i(o.prototype,{enqueue:function(e,t){this._callbacks=this._callbacks||[],this._contexts=this._contexts||[],this._callbacks.push(e),this._contexts.push(t)},notifyAll:function(){var e=this._callbacks,n=this._contexts;if(e){"production"!==t.env.NODE_ENV?a(e.length===n.length,"Mismatched list of contexts in callback queue"):a(e.length===n.length),this._callbacks=null,this._contexts=null;for(var o=0,r=e.length;o<r;o++)e[o].call(n[o]);e.length=0,n.length=0}},reset:function(){this._callbacks=null,this._contexts=null},destructor:function(){this.reset()}}),r.addPoolingTo(o),e.exports=o}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function n(e,t,n){return n}var o={enableMeasure:!1,storedMeasure:n,measure:function(e,n,r){if("production"!==t.env.NODE_ENV){var i=null,a=function(){return o.enableMeasure?(i||(i=o.storedMeasure(e,n,r)),i.apply(this,arguments)):r.apply(this,arguments)};return a.displayName=e+"_"+n,a}return r},injection:{injectMeasure:function(e){o.storedMeasure=e}}};e.exports=o}).call(t,n(8))},function(e,t,n){(function(t){"use strict";var o=n(11),r={reinitializeTransaction:function(){this.transactionWrappers=this.getTransactionWrappers(),this.wrapperInitData?this.wrapperInitData.length=0:this.wrapperInitData=[],this._isInTransaction=!1},_isInTransaction:!1,getTransactionWrappers:null,isInTransaction:function(){return!!this._isInTransaction},perform:function(e,n,r,i,a,s,u,c){"production"!==t.env.NODE_ENV?o(!this.isInTransaction(),"Transaction.perform(...): Cannot initialize a transaction when there is already an outstanding transaction."):o(!this.isInTransaction());var l,p;try{this._isInTransaction=!0,l=!0,this.initializeAll(0),p=e.call(n,r,i,a,s,u,c),l=!1}finally{try{if(l)try{this.closeAll(0)}catch(e){}else this.closeAll(0)}finally{this._isInTransaction=!1}}return p},initializeAll:function(e){for(var t=this.transactionWrappers,n=e;n<t.length;n++){var o=t[n];try{this.wrapperInitData[n]=i.OBSERVED_ERROR,this.wrapperInitData[n]=o.initialize?o.initialize.call(this):null}finally{if(this.wrapperInitData[n]===i.OBSERVED_ERROR)try{this.initializeAll(n+1)}catch(e){}}}},closeAll:function(e){"production"!==t.env.NODE_ENV?o(this.isInTransaction(),"Transaction.closeAll(): Cannot close transaction when none are open."):o(this.isInTransaction());for(var n=this.transactionWrappers,r=e;r<n.length;r++){var a,s=n[r],u=this.wrapperInitData[r];try{a=!0,u!==i.OBSERVED_ERROR&&s.close&&s.close.call(this,u),a=!1}finally{if(a)try{this.closeAll(r+1)}catch(e){}}}this.wrapperInitData.length=0}},i={Mixin:r,OBSERVED_ERROR:{}};e.exports=i}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e){var t=e._owner||null;return t&&t.constructor&&t.constructor.displayName?" Check the render method of `"+t.constructor.displayName+"`.":""}function r(e,n,o){for(var r in n)n.hasOwnProperty(r)&&("production"!==t.env.NODE_ENV?M("function"==typeof n[r],"%s: %s type `%s` is invalid; it must be a function, usually from React.PropTypes.",e.displayName||"ReactCompositeComponent",D[o],r):M("function"==typeof n[r]))}function i(e,n){var o=U.hasOwnProperty(n)?U[n]:null;B.hasOwnProperty(n)&&("production"!==t.env.NODE_ENV?M(o===V.OVERRIDE_BASE,"ReactCompositeComponentInterface: You are attempting to override `%s` from your class specification. Ensure that your method names do not overlap with React methods.",n):M(o===V.OVERRIDE_BASE)),e.hasOwnProperty(n)&&("production"!==t.env.NODE_ENV?M(o===V.DEFINE_MANY||o===V.DEFINE_MANY_MERGED,"ReactCompositeComponentInterface: You are attempting to define `%s` on your component more than once. This conflict may be due to a mixin.",n):M(o===V.DEFINE_MANY||o===V.DEFINE_MANY_MERGED))}function a(e){var n=e._compositeLifeCycleState;"production"!==t.env.NODE_ENV?M(e.isMounted()||n===F.MOUNTING,"replaceState(...): Can only update a mounted or mounting component."):M(e.isMounted()||n===F.MOUNTING),"production"!==t.env.NODE_ENV?M(null==h.current,"replaceState(...): Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."):M(null==h.current),"production"!==t.env.NODE_ENV?M(n!==F.UNMOUNTING,"replaceState(...): Cannot update while unmounting component. This usually means you called setState() on an unmounted component."):M(n!==F.UNMOUNTING)}function s(e,n){if(n){"production"!==t.env.NODE_ENV?M(!E.isValidFactory(n),"ReactCompositeComponent: You're attempting to use a component class as a mixin. Instead, just use a regular object."):M(!E.isValidFactory(n)),"production"!==t.env.NODE_ENV?M(!m.isValidElement(n),"ReactCompositeComponent: You're attempting to use a component as a mixin. Instead, just use a regular object."):M(!m.isValidElement(n));var o=e.prototype;n.hasOwnProperty(A)&&j.mixins(e,n.mixins);for(var r in n)if(n.hasOwnProperty(r)&&r!==A){var a=n[r];if(i(o,r),j.hasOwnProperty(r))j[r](e,a);else{var s=U.hasOwnProperty(r),u=o.hasOwnProperty(r),c=a&&a.__reactDontBind,d="function"==typeof a,f=d&&!s&&!u&&!c;if(f)o.__reactAutoBindMap||(o.__reactAutoBindMap={}),o.__reactAutoBindMap[r]=a,o[r]=a;else if(u){var h=U[r];"production"!==t.env.NODE_ENV?M(s&&(h===V.DEFINE_MANY_MERGED||h===V.DEFINE_MANY),"ReactCompositeComponent: Unexpected spec policy %s for key %s when mixing in component specs.",h,r):M(s&&(h===V.DEFINE_MANY_MERGED||h===V.DEFINE_MANY)),h===V.DEFINE_MANY_MERGED?o[r]=l(o[r],a):h===V.DEFINE_MANY&&(o[r]=p(o[r],a))}else o[r]=a,"production"!==t.env.NODE_ENV&&"function"==typeof a&&n.displayName&&(o[r].displayName=n.displayName+"_"+r)}}}}function u(e,n){if(n)for(var o in n){var r=n[o];if(n.hasOwnProperty(o)){var i=o in j;"production"!==t.env.NODE_ENV?M(!i,'ReactCompositeComponent: You are attempting to define a reserved property, `%s`, that shouldn\'t be on the "statics" key. Define it as an instance property instead; it will still be accessible on the constructor.',o):M(!i);var a=o in e;"production"!==t.env.NODE_ENV?M(!a,"ReactCompositeComponent: You are attempting to define `%s` on your component more than once. This conflict may be due to a mixin.",o):M(!a),e[o]=r}}}function c(e,n){return"production"!==t.env.NODE_ENV?M(e&&n&&"object"==typeof e&&"object"==typeof n,"mergeObjectsWithNoDuplicateKeys(): Cannot merge non-objects"):M(e&&n&&"object"==typeof e&&"object"==typeof n),S(n,function(n,o){"production"!==t.env.NODE_ENV?M(void 0===e[o],"mergeObjectsWithNoDuplicateKeys(): Tried to merge two objects with the same key: `%s`. This conflict may be due to a mixin; in particular, this may be caused by two getInitialState() or getDefaultProps() methods returning objects with clashing keys.",o):M(void 0===e[o]),e[o]=n}),e}function l(e,t){return function(){var n=e.apply(this,arguments),o=t.apply(this,arguments);return null==n?o:null==o?n:c(n,o)}}function p(e,t){return function(){e.apply(this,arguments),t.apply(this,arguments)}}var d=n(28),f=n(23),h=n(25),m=n(22),v=n(36),y=n(39),g=n(40),E=n(41),N=n(29),b=n(33),C=n(42),_=n(37),D=n(44),w=n(31),O=n(24),x=n(45),M=n(11),T=n(18),R=n(47),I=n(38),S=n(48),P=n(49),k=n(14),A=R({mixins:null}),V=T({DEFINE_ONCE:null,DEFINE_MANY:null,OVERRIDE_BASE:null,DEFINE_MANY_MERGED:null}),L=[],U={mixins:V.DEFINE_MANY,statics:V.DEFINE_MANY,propTypes:V.DEFINE_MANY,contextTypes:V.DEFINE_MANY,childContextTypes:V.DEFINE_MANY,getDefaultProps:V.DEFINE_MANY_MERGED,getInitialState:V.DEFINE_MANY_MERGED,getChildContext:V.DEFINE_MANY_MERGED,render:V.DEFINE_ONCE,componentWillMount:V.DEFINE_MANY,componentDidMount:V.DEFINE_MANY,componentWillReceiveProps:V.DEFINE_MANY,shouldComponentUpdate:V.DEFINE_ONCE,componentWillUpdate:V.DEFINE_MANY,componentDidUpdate:V.DEFINE_MANY,componentWillUnmount:V.DEFINE_MANY,updateComponent:V.OVERRIDE_BASE},j={displayName:function(e,t){e.displayName=t},mixins:function(e,t){if(t)for(var n=0;n<t.length;n++)s(e,t[n])},childContextTypes:function(e,t){r(e,t,_.childContext),e.childContextTypes=O({},e.childContextTypes,t)},contextTypes:function(e,t){r(e,t,_.context),e.contextTypes=O({},e.contextTypes,t)},getDefaultProps:function(e,t){e.getDefaultProps?e.getDefaultProps=l(e.getDefaultProps,t):e.getDefaultProps=t},propTypes:function(e,t){r(e,t,_.prop),e.propTypes=O({},e.propTypes,t)},statics:function(e,t){u(e,t)}},F=T({MOUNTING:null,UNMOUNTING:null,RECEIVING_PROPS:null}),B={construct:function(e){d.Mixin.construct.apply(this,arguments),N.Mixin.construct.apply(this,arguments),this.state=null,this._pendingState=null,this.context=null,this._compositeLifeCycleState=null},isMounted:function(){return d.Mixin.isMounted.call(this)&&this._compositeLifeCycleState!==F.MOUNTING},mountComponent:b.measure("ReactCompositeComponent","mountComponent",function(e,n,o){d.Mixin.mountComponent.call(this,e,n,o),this._compositeLifeCycleState=F.MOUNTING,this.__reactAutoBindMap&&this._bindAutoBindMethods(),this.context=this._processContext(this._currentElement._context),this.props=this._processProps(this.props),this.state=this.getInitialState?this.getInitialState():null,"production"!==t.env.NODE_ENV?M("object"==typeof this.state&&!Array.isArray(this.state),"%s.getInitialState(): must return an object or null",this.constructor.displayName||"ReactCompositeComponent"):M("object"==typeof this.state&&!Array.isArray(this.state)),this._pendingState=null,this._pendingForceUpdate=!1,this.componentWillMount&&(this.componentWillMount(),this._pendingState&&(this.state=this._pendingState,this._pendingState=null)),this._renderedComponent=x(this._renderValidatedComponent(),this._currentElement.type),this._compositeLifeCycleState=null;var r=this._renderedComponent.mountComponent(e,n,o+1);return this.componentDidMount&&n.getReactMountReady().enqueue(this.componentDidMount,this),r}),unmountComponent:function(){this._compositeLifeCycleState=F.UNMOUNTING,this.componentWillUnmount&&this.componentWillUnmount(),this._compositeLifeCycleState=null,this._renderedComponent.unmountComponent(),this._renderedComponent=null,d.Mixin.unmountComponent.call(this)},setState:function(e,n){"production"!==t.env.NODE_ENV?M("object"==typeof e||null==e,"setState(...): takes an object of state variables to update."):M("object"==typeof e||null==e),"production"!==t.env.NODE_ENV&&("production"!==t.env.NODE_ENV?k(null!=e,"setState(...): You passed an undefined or null state object; instead, use forceUpdate()."):null),this.replaceState(O({},this._pendingState||this.state,e),n)},replaceState:function(e,t){a(this),this._pendingState=e,this._compositeLifeCycleState!==F.MOUNTING&&w.enqueueUpdate(this,t)},_processContext:function(e){var n=null,o=this.constructor.contextTypes;if(o){n={};for(var r in o)n[r]=e[r];"production"!==t.env.NODE_ENV&&this._checkPropTypes(o,n,_.context)}return n},_processChildContext:function(e){var n=this.getChildContext&&this.getChildContext(),o=this.constructor.displayName||"ReactCompositeComponent";if(n){"production"!==t.env.NODE_ENV?M("object"==typeof this.constructor.childContextTypes,"%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().",o):M("object"==typeof this.constructor.childContextTypes),"production"!==t.env.NODE_ENV&&this._checkPropTypes(this.constructor.childContextTypes,n,_.childContext);for(var r in n)"production"!==t.env.NODE_ENV?M(r in this.constructor.childContextTypes,'%s.getChildContext(): key "%s" is not defined in childContextTypes.',o,r):M(r in this.constructor.childContextTypes);return O({},e,n)}return e},_processProps:function(e){if("production"!==t.env.NODE_ENV){var n=this.constructor.propTypes;n&&this._checkPropTypes(n,e,_.prop)}return e},_checkPropTypes:function(e,n,r){var i=this.constructor.displayName;for(var a in e)if(e.hasOwnProperty(a)){var s=e[a](n,a,i,r);if(s instanceof Error){var u=o(this);"production"!==t.env.NODE_ENV?k(!1,s.message+u):null}}},performUpdateIfNecessary:function(e){var n=this._compositeLifeCycleState;if(n!==F.MOUNTING&&n!==F.RECEIVING_PROPS&&(null!=this._pendingElement||null!=this._pendingState||this._pendingForceUpdate)){var o=this.context,r=this.props,i=this._currentElement;null!=this._pendingElement&&(i=this._pendingElement,o=this._processContext(i._context),r=this._processProps(i.props),this._pendingElement=null,this._compositeLifeCycleState=F.RECEIVING_PROPS,this.componentWillReceiveProps&&this.componentWillReceiveProps(r,o)),this._compositeLifeCycleState=null;var a=this._pendingState||this.state;this._pendingState=null;var s=this._pendingForceUpdate||!this.shouldComponentUpdate||this.shouldComponentUpdate(r,a,o);"production"!==t.env.NODE_ENV&&"undefined"==typeof s&&console.warn((this.constructor.displayName||"ReactCompositeComponent")+".shouldComponentUpdate(): Returned undefined instead of a boolean value. Make sure to return true or false."),s?(this._pendingForceUpdate=!1,this._performComponentUpdate(i,r,a,o,e)):(this._currentElement=i,this.props=r,this.state=a,this.context=o,this._owner=i._owner)}},_performComponentUpdate:function(e,t,n,o,r){var i=this._currentElement,a=this.props,s=this.state,u=this.context;this.componentWillUpdate&&this.componentWillUpdate(t,n,o),this._currentElement=e,this.props=t,this.state=n,this.context=o,this._owner=e._owner,this.updateComponent(r,i),this.componentDidUpdate&&r.getReactMountReady().enqueue(this.componentDidUpdate.bind(this,a,s,u),this)},receiveComponent:function(e,t){e===this._currentElement&&null!=e._owner||d.Mixin.receiveComponent.call(this,e,t)},updateComponent:b.measure("ReactCompositeComponent","updateComponent",function(e,t){d.Mixin.updateComponent.call(this,e,t);var n=this._renderedComponent,o=n._currentElement,r=this._renderValidatedComponent();if(P(o,r))n.receiveComponent(r,e);else{var i=this._rootNodeID,a=n._rootNodeID;n.unmountComponent(),this._renderedComponent=x(r,this._currentElement.type);var s=this._renderedComponent.mountComponent(i,e,this._mountDepth+1);d.BackendIDOperations.dangerouslyReplaceNodeWithMarkupByID(a,s)}}),forceUpdate:function(e){var n=this._compositeLifeCycleState;"production"!==t.env.NODE_ENV?M(this.isMounted()||n===F.MOUNTING,"forceUpdate(...): Can only force an update on mounted or mounting components."):M(this.isMounted()||n===F.MOUNTING),"production"!==t.env.NODE_ENV?M(n!==F.UNMOUNTING&&null==h.current,"forceUpdate(...): Cannot force an update while unmounting component or within a `render` function."):M(n!==F.UNMOUNTING&&null==h.current),this._pendingForceUpdate=!0,w.enqueueUpdate(this,e)},_renderValidatedComponent:b.measure("ReactCompositeComponent","_renderValidatedComponent",function(){var e,n=f.current;f.current=this._processChildContext(this._currentElement._context),h.current=this;try{e=this.render(),null===e||e===!1?(e=y.getEmptyComponent(),y.registerNullComponentID(this._rootNodeID)):y.deregisterNullComponentID(this._rootNodeID)}finally{f.current=n,h.current=null}return"production"!==t.env.NODE_ENV?M(m.isValidElement(e),"%s.render(): A valid ReactComponent must be returned. You may have returned undefined, an array or some other invalid object.",this.constructor.displayName||"ReactCompositeComponent"):M(m.isValidElement(e)),e}),_bindAutoBindMethods:function(){for(var e in this.__reactAutoBindMap)if(this.__reactAutoBindMap.hasOwnProperty(e)){var t=this.__reactAutoBindMap[e];this[e]=this._bindAutoBindMethod(g.guard(t,this.constructor.displayName+"."+e))}},_bindAutoBindMethod:function(e){var n=this,o=e.bind(n);if("production"!==t.env.NODE_ENV){o.__reactBoundContext=n,o.__reactBoundMethod=e,o.__reactBoundArguments=null;var r=n.constructor.displayName,i=o.bind;o.bind=function(t){for(var a=[],s=1,u=arguments.length;s<u;s++)a.push(arguments[s]);if(t!==n&&null!==t)I("react_bind_warning",{component:r}),console.warn("bind(): React component methods may only be bound to the component instance. See "+r);else if(!a.length)return I("react_bind_warning",{component:r}),console.warn("bind(): You are binding a component method to the component. React does this for you automatically in a high-performance way, so you can safely remove this call. See "+r),o;var c=i.apply(o,arguments);return c.__reactBoundContext=n,c.__reactBoundMethod=e,c.__reactBoundArguments=a,c}}return o}},W=function(){};O(W.prototype,d.Mixin,N.Mixin,C.Mixin,B);var H={LifeCycle:F,Base:W,createClass:function(e){var n=function(e){};n.prototype=new W,n.prototype.constructor=n,L.forEach(s.bind(null,n)),s(n,e),n.getDefaultProps&&(n.defaultProps=n.getDefaultProps()),"production"!==t.env.NODE_ENV?M(n.prototype.render,"createClass(...): Class specification must implement a `render` method."):M(n.prototype.render),"production"!==t.env.NODE_ENV&&n.prototype.componentShouldUpdate&&(I("react_component_should_update_warning",{component:e.displayName}),console.warn((e.displayName||"A component")+" has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value."));for(var o in U)n.prototype[o]||(n.prototype[o]=null);return"production"!==t.env.NODE_ENV?E.wrapFactory(v.createFactory(n)):E.wrapFactory(m.createFactory(n))},injection:{injectMixin:function(e){L.push(e)}}};e.exports=H}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(){var e=d.current;return e&&e.constructor.displayName||void 0}function r(e,t){e._store.validated||null!=e.key||(e._store.validated=!0,a("react_key_warning",'Each child in an array should have a unique "key" prop.',e,t))}function i(e,t,n){g.test(e)&&a("react_numeric_key_warning","Child objects should have non-numeric keys so ordering is preserved.",t,n)}function a(e,t,n,r){var i=o(),a=r.displayName,s=i||a,u=m[e];if(!u.hasOwnProperty(s)){u[s]=!0,t+=i?" Check the render method of "+i+".":" Check the renderComponent call using <"+a+">.";var c=null;n._owner&&n._owner!==d.current&&(c=n._owner.constructor.displayName,t+=" It was passed a child from "+c+"."),t+=" See http://fb.me/react-warning-keys for more information.",f(e,{component:s,componentOwner:c}),console.warn(t)}}function s(){var e=o()||"";v.hasOwnProperty(e)||(v[e]=!0,f("react_object_map_children"))}function u(e,t){if(Array.isArray(e))for(var n=0;n<e.length;n++){var o=e[n];l.isValidElement(o)&&r(o,t)}else if(l.isValidElement(e))e._store.validated=!0;else if(e&&"object"==typeof e){s();for(var a in e)i(a,e[a],t)}}function c(e,t,n,o){for(var r in t)if(t.hasOwnProperty(r)){var i;try{i=t[r](n,r,e,o)}catch(e){i=e}i instanceof Error&&!(i.message in y)&&(y[i.message]=!0,f("react_failed_descriptor_type_check",{message:i.message}))}}var l=n(22),p=n(37),d=n(25),f=n(38),h=n(14),m={react_key_warning:{},react_numeric_key_warning:{}},v={},y={},g=/^\d+$/,E={createElement:function(e,n,o){"production"!==t.env.NODE_ENV?h(null!=e,"React.createElement: type should not be null or undefined. It should be a string (for DOM elements) or a ReactClass (for composite components)."):null;var r=l.createElement.apply(this,arguments);if(null==r)return r;for(var i=2;i<arguments.length;i++)u(arguments[i],e);if(e){var a=e.displayName;e.propTypes&&c(a,e.propTypes,r.props,p.prop),e.contextTypes&&c(a,e.contextTypes,r._context,p.context)}return r},createFactory:function(e){var t=E.createElement.bind(null,e);return t.type=e,t}};e.exports=E}).call(t,n(8))},function(e,t,n){"use strict";var o=n(18),r=o({prop:null,context:null,childContext:null});e.exports=r},function(e,t,n){(function(t){"use strict";function o(e,n){"production"!==t.env.NODE_ENV?r(e&&!/[^a-z0-9_]/.test(e),"You must provide an eventName using only the characters [a-z0-9_]"):r(e&&!/[^a-z0-9_]/.test(e))}var r=n(11);e.exports=o}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(){return"production"!==t.env.NODE_ENV?c(s,"Trying to return null from a render, but no null placeholder component was injected."):c(s),s()}function r(e){l[e]=!0}function i(e){delete l[e]}function a(e){return l[e]}var s,u=n(22),c=n(11),l={},p={injectEmptyComponent:function(e){s=u.createFactory(e)}},d={deregisterNullComponentID:i,getEmptyComponent:o,injection:p,isNullComponentID:a,registerNullComponentID:r};e.exports=d}).call(t,n(8))},function(e,t){"use strict";var n={guard:function(e,t){return e}};e.exports=n},function(e,t,n){(function(t){"use strict";function o(){if(h._isLegacyCallWarningEnabled){var e=s.current,n=e&&e.constructor?e.constructor.displayName:"";n||(n="Something"),p.hasOwnProperty(n)||(p[n]=!0,"production"!==t.env.NODE_ENV?l(!1,n+" is calling a React component directly. Use a factory or JSX instead. See: http://fb.me/react-legacyfactory"):null,c("react_legacy_factory_call",{version:3,name:n}))}}function r(e){var n=e.prototype&&"function"==typeof e.prototype.mountComponent&&"function"==typeof e.prototype.receiveComponent;if(n)"production"!==t.env.NODE_ENV?l(!1,"Did not expect to get a React class here. Use `Component` instead of `Component.type` or `this.constructor`."):null;else{if(!e._reactWarnedForThisType){try{e._reactWarnedForThisType=!0}catch(e){}c("react_non_component_in_jsx",{version:3,name:e.name})}"production"!==t.env.NODE_ENV?l(!1,"This JSX uses a plain function. Only React components are valid in React's JSX transform."):null}}function i(e){"production"!==t.env.NODE_ENV?l(!1,"Do not pass React.DOM."+e.type+' to JSX or createFactory. Use the string "'+e.type+'" instead.'):null}function a(e,t){if("function"==typeof t)for(var n in t)if(t.hasOwnProperty(n)){var o=t[n];if("function"==typeof o){var r=o.bind(t);for(var i in o)o.hasOwnProperty(i)&&(r[i]=o[i]);e[n]=r}else e[n]=o}}var s=n(25),u=n(11),c=n(38),l=n(14),p={},d={},f={},h={};h.wrapCreateFactory=function(e){var n=function(n){return"function"!=typeof n?e(n):n.isReactNonLegacyFactory?("production"!==t.env.NODE_ENV&&i(n),e(n.type)):n.isReactLegacyFactory?e(n.type):("production"!==t.env.NODE_ENV&&r(n),n)};return n},h.wrapCreateElement=function(e){var n=function(n,o,a){if("function"!=typeof n)return e.apply(this,arguments);var s;return n.isReactNonLegacyFactory?("production"!==t.env.NODE_ENV&&i(n),s=Array.prototype.slice.call(arguments,0),s[0]=n.type,e.apply(this,s)):n.isReactLegacyFactory?(n._isMockFunction&&(n.type._mockedReactClassConstructor=n),s=Array.prototype.slice.call(arguments,0),s[0]=n.type,e.apply(this,s)):("production"!==t.env.NODE_ENV&&r(n),n.apply(null,Array.prototype.slice.call(arguments,1)))};return n},h.wrapFactory=function(e){"production"!==t.env.NODE_ENV?u("function"==typeof e,"This is suppose to accept a element factory"):u("function"==typeof e);var n=function(n,r){return"production"!==t.env.NODE_ENV&&o(),e.apply(this,arguments)};return a(n,e.type),n.isReactLegacyFactory=d,n.type=e.type,n},h.markNonLegacyFactory=function(e){return e.isReactNonLegacyFactory=f,e},h.isValidFactory=function(e){return"function"==typeof e&&e.isReactLegacyFactory===d},h.isValidClass=function(e){return"production"!==t.env.NODE_ENV&&("production"!==t.env.NODE_ENV?l(!1,"isValidClass is deprecated and will be removed in a future release. Use a more specific validator instead."):null),h.isValidFactory(e)},h._isLegacyCallWarningEnabled=!0,e.exports=h}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e){return function(t,n,o){t.hasOwnProperty(n)?t[n]=e(t[n],o):t[n]=o}}function r(e,t){for(var n in t)if(t.hasOwnProperty(n)){var o=d[n];o&&d.hasOwnProperty(n)?o(e,n,t[n]):e.hasOwnProperty(n)||(e[n]=t[n])}return e}var i=n(24),a=n(15),s=n(11),u=n(43),c=n(14),l=!1,p=o(function(e,t){return i({},t,e)}),d={children:a,className:o(u),style:p},f={TransferStrategies:d,mergeProps:function(e,t){return r(i({},e),t)},Mixin:{transferPropsTo:function(e){return"production"!==t.env.NODE_ENV?s(e._owner===this,"%s: You can't call transferPropsTo() on a component that you don't own, %s. This usually means you are calling transferPropsTo() on a component passed in as props or children.",this.constructor.displayName,"string"==typeof e.type?e.type:e.type.displayName):s(e._owner===this),"production"!==t.env.NODE_ENV&&(l||(l=!0,"production"!==t.env.NODE_ENV?c(!1,"transferPropsTo is deprecated. See http://fb.me/react-transferpropsto for more information."):null)),r(e.props,this.props),e}}};e.exports=f}).call(t,n(8))},function(e,t){"use strict";function n(e){e||(e="");var t,n=arguments.length;if(n>1)for(var o=1;o<n;o++)t=arguments[o],t&&(e=(e?e+" ":"")+t);return e}e.exports=n},function(e,t,n){(function(t){"use strict";var n={};"production"!==t.env.NODE_ENV&&(n={prop:"prop",context:"context",childContext:"child context"}),e.exports=n}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e,n){var o;if("production"!==t.env.NODE_ENV&&("production"!==t.env.NODE_ENV?r(e&&("function"==typeof e.type||"string"==typeof e.type),"Only functions or strings can be mounted as React components."):null,e.type._mockedReactClassConstructor)){a._isLegacyCallWarningEnabled=!1;try{o=new e.type._mockedReactClassConstructor(e.props)}finally{a._isLegacyCallWarningEnabled=!0}i.isValidElement(o)&&(o=new o.type(o.props));var c=o.render;if(c)return c._isMockFunction&&!c._getMockImplementation()&&c.mockImplementation(u.getEmptyComponent),o.construct(e),o;e=u.getEmptyComponent()}return o="string"==typeof e.type?s.createInstanceForTag(e.type,e.props,n):new e.type(e.props),"production"!==t.env.NODE_ENV&&("production"!==t.env.NODE_ENV?r("function"==typeof o.construct&&"function"==typeof o.mountComponent&&"function"==typeof o.receiveComponent,"Only React Components can be mounted."):null),o.construct(e),o}var r=n(14),i=n(22),a=n(41),s=n(46),u=n(39);e.exports=o}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e,n,o){var r=s[e];return null==r?("production"!==t.env.NODE_ENV?i(a,"There is no registered component for the tag %s",e):i(a),new a(e,n)):o===e?("production"!==t.env.NODE_ENV?i(a,"There is no registered component for the tag %s",e):i(a),new a(e,n)):new r.type(n)}var r=n(24),i=n(11),a=null,s={},u={injectGenericComponentClass:function(e){
3:a=e},injectComponentClasses:function(e){r(s,e)}},c={createInstanceForTag:o,injection:u};e.exports=c}).call(t,n(8))},function(e,t){var n=function(e){var t;for(t in e)if(e.hasOwnProperty(t))return t;return null};e.exports=n},function(e,t){"use strict";function n(e,t,n){if(!e)return null;var r={};for(var i in e)o.call(e,i)&&(r[i]=t.call(n,e[i],i,e));return r}var o=Object.prototype.hasOwnProperty;e.exports=n},function(e,t){"use strict";function n(e,t){return!(!e||!t||e.type!==t.type||e.key!==t.key||e._owner!==t._owner)}e.exports=n},function(e,t,n){(function(t){"use strict";function o(e){return"production"!==t.env.NODE_ENV?a.markNonLegacyFactory(i.createFactory(e)):a.markNonLegacyFactory(r.createFactory(e))}var r=n(22),i=n(36),a=n(41),s=n(48),u=s({a:"a",abbr:"abbr",address:"address",area:"area",article:"article",aside:"aside",audio:"audio",b:"b",base:"base",bdi:"bdi",bdo:"bdo",big:"big",blockquote:"blockquote",body:"body",br:"br",button:"button",canvas:"canvas",caption:"caption",cite:"cite",code:"code",col:"col",colgroup:"colgroup",data:"data",datalist:"datalist",dd:"dd",del:"del",details:"details",dfn:"dfn",dialog:"dialog",div:"div",dl:"dl",dt:"dt",em:"em",embed:"embed",fieldset:"fieldset",figcaption:"figcaption",figure:"figure",footer:"footer",form:"form",h1:"h1",h2:"h2",h3:"h3",h4:"h4",h5:"h5",h6:"h6",head:"head",header:"header",hr:"hr",html:"html",i:"i",iframe:"iframe",img:"img",input:"input",ins:"ins",kbd:"kbd",keygen:"keygen",label:"label",legend:"legend",li:"li",link:"link",main:"main",map:"map",mark:"mark",menu:"menu",menuitem:"menuitem",meta:"meta",meter:"meter",nav:"nav",noscript:"noscript",object:"object",ol:"ol",optgroup:"optgroup",option:"option",output:"output",p:"p",param:"param",picture:"picture",pre:"pre",progress:"progress",q:"q",rp:"rp",rt:"rt",ruby:"ruby",s:"s",samp:"samp",script:"script",section:"section",select:"select",small:"small",source:"source",span:"span",strong:"strong",style:"style",sub:"sub",summary:"summary",sup:"sup",table:"table",tbody:"tbody",td:"td",textarea:"textarea",tfoot:"tfoot",th:"th",thead:"thead",time:"time",title:"title",tr:"tr",track:"track",u:"u",ul:"ul",var:"var",video:"video",wbr:"wbr",circle:"circle",defs:"defs",ellipse:"ellipse",g:"g",line:"line",linearGradient:"linearGradient",mask:"mask",path:"path",pattern:"pattern",polygon:"polygon",polyline:"polyline",radialGradient:"radialGradient",rect:"rect",stop:"stop",svg:"svg",text:"text",tspan:"tspan"},o);e.exports=u}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e){e&&("production"!==t.env.NODE_ENV?g(null==e.children||null==e.dangerouslySetInnerHTML,"Can only set one of `children` or `props.dangerouslySetInnerHTML`."):g(null==e.children||null==e.dangerouslySetInnerHTML),"production"!==t.env.NODE_ENV&&e.contentEditable&&null!=e.children&&console.warn("A component is `contentEditable` and contains `children` managed by React. It is now your responsibility to guarantee that none of those nodes are unexpectedly modified or duplicated. This is probably not intentional."),"production"!==t.env.NODE_ENV?g(null==e.style||"object"==typeof e.style,"The `style` prop expects a mapping from style properties to values, not a string."):g(null==e.style||"object"==typeof e.style))}function r(e,n,o,r){"production"!==t.env.NODE_ENV&&("onScroll"!==n||E("scroll",!0)||(b("react_no_scroll_event"),console.warn("This browser doesn't support the `onScroll` event")));var i=f.findReactContainerForID(e);if(i){var a=i.nodeType===x?i.ownerDocument:i;_(n,a)}r.getPutListenerQueue().enqueuePutListener(e,n,o)}function i(e){I.call(R,e)||("production"!==t.env.NODE_ENV?g(T.test(e),"Invalid tag: %s",e):g(T.test(e)),R[e]=!0)}function a(e){i(e),this._tag=e,this.tagName=e.toUpperCase()}var s=n(52),u=n(10),c=n(9),l=n(60),p=n(28),d=n(62),f=n(61),h=n(76),m=n(33),v=n(24),y=n(12),g=n(11),E=n(70),N=n(47),b=n(38),C=d.deleteListener,_=d.listenTo,D=d.registrationNameModules,w={string:!0,number:!0},O=N({style:null}),x=1,M={area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0},T=/^[a-zA-Z][a-zA-Z:_\.\-\d]*$/,R={},I={}.hasOwnProperty;a.displayName="ReactDOMComponent",a.Mixin={mountComponent:m.measure("ReactDOMComponent","mountComponent",function(e,t,n){p.Mixin.mountComponent.call(this,e,t,n),o(this.props);var r=M[this._tag]?"":"</"+this._tag+">";return this._createOpenTagMarkupAndPutListeners(t)+this._createContentMarkup(t)+r}),_createOpenTagMarkupAndPutListeners:function(e){var t=this.props,n="<"+this._tag;for(var o in t)if(t.hasOwnProperty(o)){var i=t[o];if(null!=i)if(D.hasOwnProperty(o))r(this._rootNodeID,o,i,e);else{o===O&&(i&&(i=t.style=v({},t.style)),i=s.createMarkupForStyles(i));var a=c.createMarkupForProperty(o,i);a&&(n+=" "+a)}}if(e.renderToStaticMarkup)return n+">";var u=c.createMarkupForID(this._rootNodeID);return n+" "+u+">"},_createContentMarkup:function(e){var t=this.props.dangerouslySetInnerHTML;if(null!=t){if(null!=t.__html)return t.__html}else{var n=w[typeof this.props.children]?this.props.children:null,o=null!=n?null:this.props.children;if(null!=n)return y(n);if(null!=o){var r=this.mountChildren(o,e);return r.join("")}}return""},receiveComponent:function(e,t){e===this._currentElement&&null!=e._owner||p.Mixin.receiveComponent.call(this,e,t)},updateComponent:m.measure("ReactDOMComponent","updateComponent",function(e,t){o(this._currentElement.props),p.Mixin.updateComponent.call(this,e,t),this._updateDOMProperties(t.props,e),this._updateDOMChildren(t.props,e)}),_updateDOMProperties:function(e,t){var n,o,i,a=this.props;for(n in e)if(!a.hasOwnProperty(n)&&e.hasOwnProperty(n))if(n===O){var s=e[n];for(o in s)s.hasOwnProperty(o)&&(i=i||{},i[o]="")}else D.hasOwnProperty(n)?C(this._rootNodeID,n):(u.isStandardName[n]||u.isCustomAttribute(n))&&p.BackendIDOperations.deletePropertyByID(this._rootNodeID,n);for(n in a){var c=a[n],l=e[n];if(a.hasOwnProperty(n)&&c!==l)if(n===O)if(c&&(c=a.style=v({},c)),l){for(o in l)!l.hasOwnProperty(o)||c&&c.hasOwnProperty(o)||(i=i||{},i[o]="");for(o in c)c.hasOwnProperty(o)&&l[o]!==c[o]&&(i=i||{},i[o]=c[o])}else i=c;else D.hasOwnProperty(n)?r(this._rootNodeID,n,c,t):(u.isStandardName[n]||u.isCustomAttribute(n))&&p.BackendIDOperations.updatePropertyByID(this._rootNodeID,n,c)}i&&p.BackendIDOperations.updateStylesByID(this._rootNodeID,i)},_updateDOMChildren:function(e,t){var n=this.props,o=w[typeof e.children]?e.children:null,r=w[typeof n.children]?n.children:null,i=e.dangerouslySetInnerHTML&&e.dangerouslySetInnerHTML.__html,a=n.dangerouslySetInnerHTML&&n.dangerouslySetInnerHTML.__html,s=null!=o?null:e.children,u=null!=r?null:n.children,c=null!=o||null!=i,l=null!=r||null!=a;null!=s&&null==u?this.updateChildren(null,t):c&&!l&&this.updateTextContent(""),null!=r?o!==r&&this.updateTextContent(""+r):null!=a?i!==a&&p.BackendIDOperations.updateInnerHTMLByID(this._rootNodeID,a):null!=u&&this.updateChildren(u,t)},unmountComponent:function(){this.unmountChildren(),d.deleteAllListeners(this._rootNodeID),p.Mixin.unmountComponent.call(this)}},v(a.prototype,p.Mixin,a.Mixin,h.Mixin,l),e.exports=a}).call(t,n(8))},function(e,t,n){(function(t){"use strict";var o=n(53),r=n(54),i=n(55),a=n(57),s=n(58),u=n(13),c=n(14),l=u(function(e){return s(e)}),p="cssFloat";if(r.canUseDOM&&void 0===document.documentElement.style.cssFloat&&(p="styleFloat"),"production"!==t.env.NODE_ENV)var d={},f=function(e){d.hasOwnProperty(e)&&d[e]||(d[e]=!0,"production"!==t.env.NODE_ENV?c(!1,"Unsupported style property "+e+". Did you mean "+i(e)+"?"):null)};var h={createMarkupForStyles:function(e){var n="";for(var o in e)if(e.hasOwnProperty(o)){"production"!==t.env.NODE_ENV&&o.indexOf("-")>-1&&f(o);var r=e[o];null!=r&&(n+=l(o)+":",n+=a(o,r)+";")}return n||null},setValueForStyles:function(e,n){var r=e.style;for(var i in n)if(n.hasOwnProperty(i)){"production"!==t.env.NODE_ENV&&i.indexOf("-")>-1&&f(i);var s=a(i,n[i]);if("float"===i&&(i=p),s)r[i]=s;else{var u=o.shorthandPropertyExpansions[i];if(u)for(var c in u)r[c]="";else r[i]=""}}}};e.exports=h}).call(t,n(8))},function(e,t){"use strict";function n(e,t){return e+t.charAt(0).toUpperCase()+t.substring(1)}var o={columnCount:!0,flex:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,strokeOpacity:!0},r=["Webkit","ms","Moz","O"];Object.keys(o).forEach(function(e){r.forEach(function(t){o[n(t,e)]=o[e]})});var i={background:{backgroundImage:!0,backgroundPosition:!0,backgroundRepeat:!0,backgroundColor:!0},border:{borderWidth:!0,borderStyle:!0,borderColor:!0},borderBottom:{borderBottomWidth:!0,borderBottomStyle:!0,borderBottomColor:!0},borderLeft:{borderLeftWidth:!0,borderLeftStyle:!0,borderLeftColor:!0},borderRight:{borderRightWidth:!0,borderRightStyle:!0,borderRightColor:!0},borderTop:{borderTopWidth:!0,borderTopStyle:!0,borderTopColor:!0},font:{fontStyle:!0,fontVariant:!0,fontWeight:!0,fontSize:!0,lineHeight:!0,fontFamily:!0}},a={isUnitlessNumber:o,shorthandPropertyExpansions:i};e.exports=a},function(e,t){"use strict";var n=!("undefined"==typeof window||!window.document||!window.document.createElement),o={canUseDOM:n,canUseWorkers:"undefined"!=typeof Worker,canUseEventListeners:n&&!(!window.addEventListener&&!window.attachEvent),canUseViewport:n&&!!window.screen,isInWorker:!n};e.exports=o},function(e,t,n){"use strict";function o(e){return r(e.replace(i,"ms-"))}var r=n(56),i=/^-ms-/;e.exports=o},function(e,t){function n(e){return e.replace(o,function(e,t){return t.toUpperCase()})}var o=/-(.)/g;e.exports=n},function(e,t,n){"use strict";function o(e,t){var n=null==t||"boolean"==typeof t||""===t;if(n)return"";var o=isNaN(t);return o||0===t||i.hasOwnProperty(e)&&i[e]?""+t:("string"==typeof t&&(t=t.trim()),t+"px")}var r=n(53),i=r.isUnitlessNumber;e.exports=o},function(e,t,n){"use strict";function o(e){return r(e).replace(i,"-ms-")}var r=n(59),i=/^ms-/;e.exports=o},function(e,t){function n(e){return e.replace(o,"-$1").toLowerCase()}var o=/([A-Z])/g;e.exports=n},function(e,t,n){(function(t){"use strict";var o=n(39),r=n(61),i=n(11),a={getDOMNode:function(){return"production"!==t.env.NODE_ENV?i(this.isMounted(),"getDOMNode(): A component must be mounted to have a DOM node."):i(this.isMounted()),o.isNullComponentID(this._rootNodeID)?null:r.getNode(this._rootNodeID)}};e.exports=a}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e){var t=b(e);return t&&L.getID(t)}function r(e){var n=i(e);if(n)if(T.hasOwnProperty(n)){var o=T[n];o!==e&&("production"!==t.env.NODE_ENV?_(!u(o,n),"ReactMount: Two valid but unequal nodes with the same `%s`: %s",M,n):_(!u(o,n)),T[n]=e)}else T[n]=e;return n}function i(e){return e&&e.getAttribute&&e.getAttribute(M)||""}function a(e,t){var n=i(e);n!==t&&delete T[n],e.setAttribute(M,t),T[t]=e}function s(e){return T.hasOwnProperty(e)&&u(T[e],e)||(T[e]=L.findReactNodeByID(e)),T[e]}function u(e,n){if(e){"production"!==t.env.NODE_ENV?_(i(e)===n,"ReactMount: Unexpected modification of `%s`",M):_(i(e)===n);var o=L.findReactContainerForID(n);if(o&&E(o,e))return!0}return!1}function c(e){delete T[e]}function l(e){var t=T[e];return!(!t||!u(t,e))&&void(V=t)}function p(e){V=null,y.traverseAncestors(e,l);var t=V;return V=null,t}var d=n(10),f=n(62),h=n(25),m=n(22),v=n(41),y=n(26),g=n(33),E=n(71),N=n(74),b=n(75),C=n(45),_=n(11),D=n(49),w=n(14),O=v.wrapCreateElement(m.createElement),x=y.SEPARATOR,M=d.ID_ATTRIBUTE_NAME,T={},R=1,I=9,S={},P={};if("production"!==t.env.NODE_ENV)var k={};var A=[],V=null,L={_instancesByReactRootID:S,scrollMonitor:function(e,t){t()},_updateRootComponent:function(e,n,r,i){var a=n.props;return L.scrollMonitor(r,function(){e.replaceProps(a,i)}),"production"!==t.env.NODE_ENV&&(k[o(r)]=b(r)),e},_registerComponent:function(e,n){"production"!==t.env.NODE_ENV?_(n&&(n.nodeType===R||n.nodeType===I),"_registerComponent(...): Target container is not a DOM element."):_(n&&(n.nodeType===R||n.nodeType===I)),f.ensureScrollValueMonitoring();var o=L.registerContainer(n);return S[o]=e,o},_renderNewRootComponent:g.measure("ReactMount","_renderNewRootComponent",function(e,n,o){"production"!==t.env.NODE_ENV?w(null==h.current,"_renderNewRootComponent(): Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate."):null;var r=C(e,null),i=L._registerComponent(r,n);return r.mountComponentIntoNode(i,n,o),"production"!==t.env.NODE_ENV&&(k[i]=b(n)),r}),render:function(e,n,r){"production"!==t.env.NODE_ENV?_(m.isValidElement(e),"renderComponent(): Invalid component element.%s","string"==typeof e?" Instead of passing an element string, make sure to instantiate it by passing it to React.createElement.":v.isValidFactory(e)?" Instead of passing a component class, make sure to instantiate it by passing it to React.createElement.":"undefined"!=typeof e.props?" This may be caused by unintentionally loading two independent copies of React.":""):_(m.isValidElement(e));var i=S[o(n)];if(i){var a=i._currentElement;if(D(a,e))return L._updateRootComponent(i,e,n,r);L.unmountComponentAtNode(n)}var s=b(n),u=s&&L.isRenderedByReact(s),c=u&&!i,l=L._renderNewRootComponent(e,n,c);return r&&r.call(l),l},constructAndRenderComponent:function(e,t,n){var o=O(e,t);return L.render(o,n)},constructAndRenderComponentByID:function(e,n,o){var r=document.getElementById(o);return"production"!==t.env.NODE_ENV?_(r,'Tried to get element with id of "%s" but it is not present on the page.',o):_(r),L.constructAndRenderComponent(e,n,r)},registerContainer:function(e){var t=o(e);return t&&(t=y.getReactRootIDFromNodeID(t)),t||(t=y.createReactRootID()),P[t]=e,t},unmountComponentAtNode:function(e){"production"!==t.env.NODE_ENV?w(null==h.current,"unmountComponentAtNode(): Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate."):null;var n=o(e),r=S[n];return!!r&&(L.unmountComponentFromNode(r,e),delete S[n],delete P[n],"production"!==t.env.NODE_ENV&&delete k[n],!0)},unmountComponentFromNode:function(e,t){for(e.unmountComponent(),t.nodeType===I&&(t=t.documentElement);t.lastChild;)t.removeChild(t.lastChild)},findReactContainerForID:function(e){var n=y.getReactRootIDFromNodeID(e),o=P[n];if("production"!==t.env.NODE_ENV){var r=k[n];if(r&&r.parentNode!==o){"production"!==t.env.NODE_ENV?_(i(r)===n,"ReactMount: Root element ID differed from reactRootID."):_(i(r)===n);var a=o.firstChild;a&&n===i(a)?k[n]=a:console.warn("ReactMount: Root element has been removed from its original container. New container:",r.parentNode)}}return o},findReactNodeByID:function(e){var t=L.findReactContainerForID(e);return L.findComponentRoot(t,e)},isRenderedByReact:function(e){if(1!==e.nodeType)return!1;var t=L.getID(e);return!!t&&t.charAt(0)===x},getFirstReactDOM:function(e){for(var t=e;t&&t.parentNode!==t;){if(L.isRenderedByReact(t))return t;t=t.parentNode}return null},findComponentRoot:function(e,n){var o=A,r=0,i=p(n)||e;for(o[0]=i.firstChild,o.length=1;r<o.length;){for(var a,s=o[r++];s;){var u=L.getID(s);u?n===u?a=s:y.isAncestorIDOf(u,n)&&(o.length=r=0,o.push(s.firstChild)):o.push(s.firstChild),s=s.nextSibling}if(a)return o.length=0,a}o.length=0,"production"!==t.env.NODE_ENV?_(!1,"findComponentRoot(..., %s): Unable to find element. This probably means the DOM was unexpectedly mutated (e.g., by the browser), usually due to forgetting a <tbody> when using tables, nesting tags like <form>, <p>, or <a>, or using non-SVG elements in an <svg> parent. Try inspecting the child nodes of the element with React ID `%s`.",n,L.getID(e)):_(!1)},getReactRootID:o,getID:r,setID:a,getNode:s,purgeID:c};L.renderComponent=N("ReactMount","renderComponent","render",this,L.render),e.exports=L}).call(t,n(8))},function(e,t,n){"use strict";function o(e){return Object.prototype.hasOwnProperty.call(e,m)||(e[m]=f++,p[e[m]]={}),p[e[m]]}var r=n(17),i=n(63),a=n(64),s=n(67),u=n(68),c=n(24),l=n(70),p={},d=!1,f=0,h={topBlur:"blur",topChange:"change",topClick:"click",topCompositionEnd:"compositionend",topCompositionStart:"compositionstart",topCompositionUpdate:"compositionupdate",topContextMenu:"contextmenu",topCopy:"copy",topCut:"cut",topDoubleClick:"dblclick",topDrag:"drag",topDragEnd:"dragend",topDragEnter:"dragenter",topDragExit:"dragexit",topDragLeave:"dragleave",topDragOver:"dragover",topDragStart:"dragstart",topDrop:"drop",topFocus:"focus",topInput:"input",topKeyDown:"keydown",topKeyPress:"keypress",topKeyUp:"keyup",topMouseDown:"mousedown",topMouseMove:"mousemove",topMouseOut:"mouseout",topMouseOver:"mouseover",topMouseUp:"mouseup",topPaste:"paste",topScroll:"scroll",topSelectionChange:"selectionchange",topTextInput:"textInput",topTouchCancel:"touchcancel",topTouchEnd:"touchend",topTouchMove:"touchmove",topTouchStart:"touchstart",topWheel:"wheel"},m="_reactListenersID"+String(Math.random()).slice(2),v=c({},s,{ReactEventListener:null,injection:{injectReactEventListener:function(e){e.setHandleTopLevel(v.handleTopLevel),v.ReactEventListener=e}},setEnabled:function(e){v.ReactEventListener&&v.ReactEventListener.setEnabled(e)},isEnabled:function(){return!(!v.ReactEventListener||!v.ReactEventListener.isEnabled())},listenTo:function(e,t){for(var n=t,i=o(n),s=a.registrationNameDependencies[e],u=r.topLevelTypes,c=0,p=s.length;c<p;c++){var d=s[c];i.hasOwnProperty(d)&&i[d]||(d===u.topWheel?l("wheel")?v.ReactEventListener.trapBubbledEvent(u.topWheel,"wheel",n):l("mousewheel")?v.ReactEventListener.trapBubbledEvent(u.topWheel,"mousewheel",n):v.ReactEventListener.trapBubbledEvent(u.topWheel,"DOMMouseScroll",n):d===u.topScroll?l("scroll",!0)?v.ReactEventListener.trapCapturedEvent(u.topScroll,"scroll",n):v.ReactEventListener.trapBubbledEvent(u.topScroll,"scroll",v.ReactEventListener.WINDOW_HANDLE):d===u.topFocus||d===u.topBlur?(l("focus",!0)?(v.ReactEventListener.trapCapturedEvent(u.topFocus,"focus",n),v.ReactEventListener.trapCapturedEvent(u.topBlur,"blur",n)):l("focusin")&&(v.ReactEventListener.trapBubbledEvent(u.topFocus,"focusin",n),v.ReactEventListener.trapBubbledEvent(u.topBlur,"focusout",n)),i[u.topBlur]=!0,i[u.topFocus]=!0):h.hasOwnProperty(d)&&v.ReactEventListener.trapBubbledEvent(d,h[d],n),i[d]=!0)}},trapBubbledEvent:function(e,t,n){return v.ReactEventListener.trapBubbledEvent(e,t,n)},trapCapturedEvent:function(e,t,n){return v.ReactEventListener.trapCapturedEvent(e,t,n)},ensureScrollValueMonitoring:function(){if(!d){var e=u.refreshScrollValues;v.ReactEventListener.monitorScrollValue(e),d=!0}},eventNameDispatchConfigs:i.eventNameDispatchConfigs,registrationNameModules:i.registrationNameModules,putListener:i.putListener,getListener:i.getListener,deleteListener:i.deleteListener,deleteAllListeners:i.deleteAllListeners});e.exports=v},function(e,t,n){(function(t){"use strict";function o(){var e=!d||!d.traverseTwoPhase||!d.traverseEnterLeave;if(e)throw new Error("InstanceHandle not injected before use!")}var r=n(64),i=n(16),a=n(65),s=n(66),u=n(11),c={},l=null,p=function(e){if(e){var t=i.executeDispatch,n=r.getPluginModuleForEvent(e);n&&n.executeDispatch&&(t=n.executeDispatch),i.executeDispatchesInOrder(e,t),e.isPersistent()||e.constructor.release(e)}},d=null,f={injection:{injectMount:i.injection.injectMount,injectInstanceHandle:function(e){d=e,"production"!==t.env.NODE_ENV&&o()},getInstanceHandle:function(){return"production"!==t.env.NODE_ENV&&o(),d},injectEventPluginOrder:r.injectEventPluginOrder,injectEventPluginsByName:r.injectEventPluginsByName},eventNameDispatchConfigs:r.eventNameDispatchConfigs,registrationNameModules:r.registrationNameModules,putListener:function(e,n,o){"production"!==t.env.NODE_ENV?u(!o||"function"==typeof o,"Expected %s listener to be a function, instead got type %s",n,typeof o):u(!o||"function"==typeof o);var r=c[n]||(c[n]={});r[e]=o},getListener:function(e,t){var n=c[t];return n&&n[e]},deleteListener:function(e,t){var n=c[t];n&&delete n[e]},deleteAllListeners:function(e){for(var t in c)delete c[t][e]},extractEvents:function(e,t,n,o){for(var i,s=r.plugins,u=0,c=s.length;u<c;u++){var l=s[u];if(l){var p=l.extractEvents(e,t,n,o);p&&(i=a(i,p))}}return i},enqueueEvents:function(e){e&&(l=a(l,e))},processEventQueue:function(){var e=l;l=null,s(e,p),"production"!==t.env.NODE_ENV?u(!l,"processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented."):u(!l)},__purge:function(){c={}},__getListenerBank:function(){return c}};e.exports=f}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(){if(s)for(var e in u){var n=u[e],o=s.indexOf(e);if("production"!==t.env.NODE_ENV?a(o>-1,"EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `%s`.",e):a(o>-1),!c.plugins[o]){"production"!==t.env.NODE_ENV?a(n.extractEvents,"EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `%s` does not.",e):a(n.extractEvents),c.plugins[o]=n;var i=n.eventTypes;for(var l in i)"production"!==t.env.NODE_ENV?a(r(i[l],n,l),"EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.",l,e):a(r(i[l],n,l))}}}function r(e,n,o){"production"!==t.env.NODE_ENV?a(!c.eventNameDispatchConfigs.hasOwnProperty(o),"EventPluginHub: More than one plugin attempted to publish the same event name, `%s`.",o):a(!c.eventNameDispatchConfigs.hasOwnProperty(o)),c.eventNameDispatchConfigs[o]=e;var r=e.phasedRegistrationNames;if(r){for(var s in r)if(r.hasOwnProperty(s)){var u=r[s];i(u,n,o)}return!0}return!!e.registrationName&&(i(e.registrationName,n,o),!0)}function i(e,n,o){"production"!==t.env.NODE_ENV?a(!c.registrationNameModules[e],"EventPluginHub: More than one plugin attempted to publish the same registration name, `%s`.",e):a(!c.registrationNameModules[e]),c.registrationNameModules[e]=n,c.registrationNameDependencies[e]=n.eventTypes[o].dependencies}var a=n(11),s=null,u={},c={plugins:[],eventNameDispatchConfigs:{},registrationNameModules:{},registrationNameDependencies:{},injectEventPluginOrder:function(e){"production"!==t.env.NODE_ENV?a(!s,"EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React."):a(!s),s=Array.prototype.slice.call(e),o()},injectEventPluginsByName:function(e){var n=!1;for(var r in e)if(e.hasOwnProperty(r)){var i=e[r];u.hasOwnProperty(r)&&u[r]===i||("production"!==t.env.NODE_ENV?a(!u[r],"EventPluginRegistry: Cannot inject two different event plugins using the same name, `%s`.",r):a(!u[r]),u[r]=i,n=!0)}n&&o()},getPluginModuleForEvent:function(e){var t=e.dispatchConfig;if(t.registrationName)return c.registrationNameModules[t.registrationName]||null;for(var n in t.phasedRegistrationNames)if(t.phasedRegistrationNames.hasOwnProperty(n)){var o=c.registrationNameModules[t.phasedRegistrationNames[n]];if(o)return o}return null},_resetEventPlugins:function(){s=null;for(var e in u)u.hasOwnProperty(e)&&delete u[e];c.plugins.length=0;var t=c.eventNameDispatchConfigs;for(var n in t)t.hasOwnProperty(n)&&delete t[n];var o=c.registrationNameModules;for(var r in o)o.hasOwnProperty(r)&&delete o[r]}};e.exports=c}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e,n){if("production"!==t.env.NODE_ENV?r(null!=n,"accumulateInto(...): Accumulated items must not be null or undefined."):r(null!=n),null==e)return n;var o=Array.isArray(e),i=Array.isArray(n);return o&&i?(e.push.apply(e,n),e):o?(e.push(n),e):i?[e].concat(n):[e,n]}var r=n(11);e.exports=o}).call(t,n(8))},function(e,t){"use strict";var n=function(e,t,n){Array.isArray(e)?e.forEach(t,n):e&&t.call(n,e)};e.exports=n},function(e,t,n){"use strict";function o(e){r.enqueueEvents(e),r.processEventQueue()}var r=n(63),i={handleTopLevel:function(e,t,n,i){var a=r.extractEvents(e,t,n,i);o(a)}};e.exports=i},function(e,t,n){"use strict";var o=n(69),r={currentScrollLeft:0,currentScrollTop:0,refreshScrollValues:function(){var e=o(window);r.currentScrollLeft=e.x,r.currentScrollTop=e.y}};e.exports=r},function(e,t){"use strict";function n(e){return e===window?{x:window.pageXOffset||document.documentElement.scrollLeft,y:window.pageYOffset||document.documentElement.scrollTop}:{x:e.scrollLeft,y:e.scrollTop}}e.exports=n},function(e,t,n){"use strict";/**
17:function o(e,t){if(!i.canUseDOM||t&&!("addEventListener"in document))return!1;var n="on"+e,o=n in document;if(!o){var a=document.createElement("div");a.setAttribute(n,"return;"),o="function"==typeof a[n]}return!o&&r&&"wheel"===e&&(o=document.implementation.hasFeature("Events.wheel","3.0")),o}var r,i=n(54);i.canUseDOM&&(r=document.implementation&&document.implementation.hasFeature&&document.implementation.hasFeature("","")!==!0),e.exports=o},function(e,t,n){function o(e,t){return!(!e||!t)&&(e===t||!r(e)&&(r(t)?o(e,t.parentNode):e.contains?e.contains(t):!!e.compareDocumentPosition&&!!(16&e.compareDocumentPosition(t))))}var r=n(72);e.exports=o},function(e,t,n){function o(e){return r(e)&&3==e.nodeType}var r=n(73);e.exports=o},function(e,t){function n(e){return!(!e||!("function"==typeof Node?e instanceof Node:"object"==typeof e&&"number"==typeof e.nodeType&&"string"==typeof e.nodeName))}e.exports=n},function(e,t,n){(function(t){function o(e,n,o,a,s){var u=!1;if("production"!==t.env.NODE_ENV){var c=function(){return"production"!==t.env.NODE_ENV?i(u,e+"."+n+" will be deprecated in a future version. "+("Use "+e+"."+o+" instead.")):null,u=!0,s.apply(a,arguments)};return c.displayName=e+"_"+n,r(c,s)}return s}var r=n(24),i=n(14);e.exports=o}).call(t,n(8))},function(e,t){"use strict";function n(e){return e?e.nodeType===o?e.documentElement:e.firstChild:null}var o=9;e.exports=n},function(e,t,n){"use strict";function o(e,t,n){m.push({parentID:e,parentNode:null,type:l.INSERT_MARKUP,markupIndex:v.push(t)-1,textContent:null,fromIndex:null,toIndex:n})}function r(e,t,n){m.push({parentID:e,parentNode:null,type:l.MOVE_EXISTING,markupIndex:null,textContent:null,fromIndex:t,toIndex:n})}function i(e,t){m.push({parentID:e,parentNode:null,type:l.REMOVE_NODE,markupIndex:null,textContent:null,fromIndex:t,toIndex:null})}function a(e,t){m.push({parentID:e,parentNode:null,type:l.TEXT_CONTENT,markupIndex:null,textContent:t,fromIndex:null,toIndex:null})}function s(){m.length&&(c.BackendIDOperations.dangerouslyProcessChildrenUpdates(m,v),u())}function u(){m.length=0,v.length=0}var c=n(28),l=n(77),p=n(78),d=n(45),f=n(49),h=0,m=[],v=[],y={Mixin:{mountChildren:function(e,t){var n=p(e),o=[],r=0;this._renderedChildren=n;for(var i in n){var a=n[i];if(n.hasOwnProperty(i)){var s=d(a,null);n[i]=s;var u=this._rootNodeID+i,c=s.mountComponent(u,t,this._mountDepth+1);s._mountIndex=r,o.push(c),r++}}return o},updateTextContent:function(e){h++;var t=!0;try{var n=this._renderedChildren;for(var o in n)n.hasOwnProperty(o)&&this._unmountChildByName(n[o],o);this.setTextContent(e),t=!1}finally{h--,h||(t?u():s())}},updateChildren:function(e,t){h++;var n=!0;try{this._updateChildren(e,t),n=!1}finally{h--,h||(n?u():s())}},_updateChildren:function(e,t){var n=p(e),o=this._renderedChildren;if(n||o){var r,i=0,a=0;for(r in n)if(n.hasOwnProperty(r)){var s=o&&o[r],u=s&&s._currentElement,c=n[r];if(f(u,c))this.moveChild(s,a,i),i=Math.max(s._mountIndex,i),s.receiveComponent(c,t),s._mountIndex=a;else{s&&(i=Math.max(s._mountIndex,i),this._unmountChildByName(s,r));var l=d(c,null);this._mountChildByNameAtIndex(l,r,a,t)}a++}for(r in o)!o.hasOwnProperty(r)||n&&n[r]||this._unmountChildByName(o[r],r)}},unmountChildren:function(){var e=this._renderedChildren;for(var t in e){var n=e[t];n.unmountComponent&&n.unmountComponent()}this._renderedChildren=null},moveChild:function(e,t,n){e._mountIndex<n&&r(this._rootNodeID,e._mountIndex,t)},createChild:function(e,t){o(this._rootNodeID,t,e._mountIndex)},removeChild:function(e){i(this._rootNodeID,e._mountIndex)},setTextContent:function(e){a(this._rootNodeID,e)},_mountChildByNameAtIndex:function(e,t,n,o){var r=this._rootNodeID+t,i=e.mountComponent(r,o,this._mountDepth+1);e._mountIndex=n,this.createChild(e,i),this._renderedChildren=this._renderedChildren||{},this._renderedChildren[t]=e},_unmountChildByName:function(e,t){this.removeChild(e),e._mountIndex=null,e.unmountComponent(),delete this._renderedChildren[t]}}};e.exports=y},function(e,t,n){"use strict";var o=n(18),r=o({INSERT_MARKUP:null,MOVE_EXISTING:null,REMOVE_NODE:null,TEXT_CONTENT:null});e.exports=r},function(e,t,n){(function(t){"use strict";function o(e,n,o){var r=e,a=!r.hasOwnProperty(o);if("production"!==t.env.NODE_ENV?s(a,"flattenChildren(...): Encountered two children with the same key, `%s`. Child keys must be unique; when two children share a key, only the first child will be used.",o):null,a&&null!=n){var u,c=typeof n;u="string"===c?i(n):"number"===c?i(""+n):n,r[o]=u}}function r(e){if(null==e)return e;var t={};return a(e,o,t),t}var i=n(79),a=n(21),s=n(14);e.exports=r}).call(t,n(8))},function(e,t,n){"use strict";var o=n(9),r=n(28),i=n(22),a=n(24),s=n(12),u=function(e){};a(u.prototype,r.Mixin,{mountComponent:function(e,t,n){r.Mixin.mountComponent.call(this,e,t,n);var i=s(this.props);return t.renderToStaticMarkup?i:"<span "+o.createMarkupForID(e)+">"+i+"</span>"},receiveComponent:function(e,t){var n=e.props;n!==this.props&&(this.props=n,r.BackendIDOperations.updateTextContentByID(this._rootNodeID,n))}});var c=function(e){return new i(u,null,null,null,null,e)};c.type=u,e.exports=c},function(e,t,n){(function(t){"use strict";function o(){if(w.EventEmitter.injectReactEventListener(D),w.EventPluginHub.injectEventPluginOrder(u),w.EventPluginHub.injectInstanceHandle(O),w.EventPluginHub.injectMount(x),w.EventPluginHub.injectEventPluginsByName({SimpleEventPlugin:R,EnterLeaveEventPlugin:c,ChangeEventPlugin:i,CompositionEventPlugin:s,MobileSafariClickEventPlugin:d,SelectEventPlugin:M,BeforeInputEventPlugin:r}),w.NativeComponent.injectGenericComponentClass(v),w.NativeComponent.injectComponentClasses({button:y,form:g,img:E,input:N,option:b,select:C,textarea:_,html:S("html"),head:S("head"),body:S("body")}),w.CompositeComponent.injectMixin(f),w.DOMProperty.injectDOMPropertyConfig(p),w.DOMProperty.injectDOMPropertyConfig(I),w.EmptyComponent.injectEmptyComponent("noscript"),w.Updates.injectReconcileTransaction(h.ReactReconcileTransaction),w.Updates.injectBatchingStrategy(m),w.RootIndex.injectCreateReactRootIndex(l.canUseDOM?a.createReactRootIndex:T.createReactRootIndex),w.Component.injectEnvironment(h),"production"!==t.env.NODE_ENV){var e=l.canUseDOM&&window.location.href||"";if(/[?&]react_perf\b/.test(e)){var o=n(146);o.start()}}}var r=n(81),i=n(86),a=n(88),s=n(89),u=n(97),c=n(98),l=n(54),p=n(102),d=n(103),f=n(60),h=n(104),m=n(117),v=n(51),y=n(118),g=n(120),E=n(122),N=n(123),b=n(126),C=n(127),_=n(128),D=n(129),w=n(131),O=n(26),x=n(61),M=n(132),T=n(134),R=n(135),I=n(144),S=n(145);e.exports={inject:o}}).call(t,n(8))},function(e,t,n){"use strict";function o(){var e=window.opera;return"object"==typeof e&&"function"==typeof e.version&&parseInt(e.version(),10)<=12}function r(e){return(e.ctrlKey||e.altKey||e.metaKey)&&!(e.ctrlKey&&e.altKey)}var i=n(17),a=n(82),s=n(54),u=n(83),c=n(47),l=s.canUseDOM&&"TextEvent"in window&&!("documentMode"in document||o()),p=32,d=String.fromCharCode(p),f=i.topLevelTypes,h={beforeInput:{phasedRegistrationNames:{bubbled:c({onBeforeInput:null}),captured:c({onBeforeInputCapture:null})},dependencies:[f.topCompositionEnd,f.topKeyPress,f.topTextInput,f.topPaste]}},m=null,v=!1,y={eventTypes:h,extractEvents:function(e,t,n,o){var i;if(l)switch(e){case f.topKeyPress:var s=o.which;if(s!==p)return;v=!0,i=d;break;case f.topTextInput:if(i=o.data,i===d&&v)return;break;default:return}else{switch(e){case f.topPaste:m=null;break;case f.topKeyPress:o.which&&!r(o)&&(m=String.fromCharCode(o.which));break;case f.topCompositionEnd:m=o.data}if(null===m)return;i=m}if(i){var c=u.getPooled(h.beforeInput,n,o);return c.data=i,m=null,a.accumulateTwoPhaseDispatches(c),c}}};e.exports=y},function(e,t,n){(function(t){"use strict";function o(e,t,n){var o=t.dispatchConfig.phasedRegistrationNames[n];return v(e,o)}function r(e,n,r){if("production"!==t.env.NODE_ENV&&!e)throw new Error("Dispatching id must not be null");var i=n?m.bubbled:m.captured,a=o(e,r,i);a&&(r._dispatchListeners=f(r._dispatchListeners,a),r._dispatchIDs=f(r._dispatchIDs,e))}function i(e){e&&e.dispatchConfig.phasedRegistrationNames&&d.injection.getInstanceHandle().traverseTwoPhase(e.dispatchMarker,r,e)}function a(e,t,n){if(n&&n.dispatchConfig.registrationName){var o=n.dispatchConfig.registrationName,r=v(e,o);r&&(n._dispatchListeners=f(n._dispatchListeners,r),n._dispatchIDs=f(n._dispatchIDs,e))}}function s(e){e&&e.dispatchConfig.registrationName&&a(e.dispatchMarker,null,e)}function u(e){h(e,i)}function c(e,t,n,o){d.injection.getInstanceHandle().traverseEnterLeave(n,o,a,e,t)}function l(e){h(e,s)}var p=n(17),d=n(63),f=n(65),h=n(66),m=p.PropagationPhases,v=d.getListener,y={accumulateTwoPhaseDispatches:u,accumulateDirectDispatches:l,accumulateEnterLeaveDispatches:c};e.exports=y}).call(t,n(8))},function(e,t,n){"use strict";function o(e,t,n){r.call(this,e,t,n)}var r=n(84),i={data:null};r.augmentClass(o,i),e.exports=o},function(e,t,n){"use strict";function o(e,t,n){this.dispatchConfig=e,this.dispatchMarker=t,this.nativeEvent=n;var o=this.constructor.Interface;for(var r in o)if(o.hasOwnProperty(r)){var i=o[r];i?this[r]=i(n):this[r]=n[r]}var s=null!=n.defaultPrevented?n.defaultPrevented:n.returnValue===!1;s?this.isDefaultPrevented=a.thatReturnsTrue:this.isDefaultPrevented=a.thatReturnsFalse,this.isPropagationStopped=a.thatReturnsFalse}var r=n(20),i=n(24),a=n(15),s=n(85),u={type:null,target:s,currentTarget:a.thatReturnsNull,eventPhase:null,bubbles:null,cancelable:null,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:null,isTrusted:null};i(o.prototype,{preventDefault:function(){this.defaultPrevented=!0;var e=this.nativeEvent;e.preventDefault?e.preventDefault():e.returnValue=!1,this.isDefaultPrevented=a.thatReturnsTrue},stopPropagation:function(){var e=this.nativeEvent;e.stopPropagation?e.stopPropagation():e.cancelBubble=!0,this.isPropagationStopped=a.thatReturnsTrue},persist:function(){this.isPersistent=a.thatReturnsTrue},isPersistent:a.thatReturnsFalse,destructor:function(){var e=this.constructor.Interface;for(var t in e)this[t]=null;this.dispatchConfig=null,this.dispatchMarker=null,this.nativeEvent=null}}),o.Interface=u,o.augmentClass=function(e,t){var n=this,o=Object.create(n.prototype);i(o,e.prototype),e.prototype=o,e.prototype.constructor=e,e.Interface=i({},n.Interface,t),e.augmentClass=n.augmentClass,r.addPoolingTo(e,r.threeArgumentPooler)},r.addPoolingTo(o,r.threeArgumentPooler),e.exports=o},function(e,t){"use strict";function n(e){var t=e.target||e.srcElement||window;return 3===t.nodeType?t.parentNode:t}e.exports=n},function(e,t,n){"use strict";function o(e){return"SELECT"===e.nodeName||"INPUT"===e.nodeName&&"file"===e.type}function r(e){var t=_.getPooled(M.change,R,e);N.accumulateTwoPhaseDispatches(t),C.batchedUpdates(i,t)}function i(e){E.enqueueEvents(e),E.processEventQueue()}function a(e,t){T=e,R=t,T.attachEvent("onchange",r)}function s(){T&&(T.detachEvent("onchange",r),T=null,R=null)}function u(e,t,n){if(e===x.topChange)return n}function c(e,t,n){e===x.topFocus?(s(),a(t,n)):e===x.topBlur&&s()}function l(e,t){T=e,R=t,I=e.value,S=Object.getOwnPropertyDescriptor(e.constructor.prototype,"value"),Object.defineProperty(T,"value",A),T.attachEvent("onpropertychange",d)}function p(){T&&(delete T.value,T.detachEvent("onpropertychange",d),T=null,R=null,I=null,S=null)}function d(e){if("value"===e.propertyName){var t=e.srcElement.value;t!==I&&(I=t,r(e))}}function f(e,t,n){if(e===x.topInput)return n}function h(e,t,n){e===x.topFocus?(p(),l(t,n)):e===x.topBlur&&p()}function m(e,t,n){if((e===x.topSelectionChange||e===x.topKeyUp||e===x.topKeyDown)&&T&&T.value!==I)return I=T.value,R}function v(e){return"INPUT"===e.nodeName&&("checkbox"===e.type||"radio"===e.type)}function y(e,t,n){if(e===x.topClick)return n}var g=n(17),E=n(63),N=n(82),b=n(54),C=n(31),_=n(84),D=n(70),w=n(87),O=n(47),x=g.topLevelTypes,M={change:{phasedRegistrationNames:{bubbled:O({onChange:null}),captured:O({onChangeCapture:null})},dependencies:[x.topBlur,x.topChange,x.topClick,x.topFocus,x.topInput,x.topKeyDown,x.topKeyUp,x.topSelectionChange]}},T=null,R=null,I=null,S=null,P=!1;b.canUseDOM&&(P=D("change")&&(!("documentMode"in document)||document.documentMode>8));var k=!1;b.canUseDOM&&(k=D("input")&&(!("documentMode"in document)||document.documentMode>9));var A={get:function(){return S.get.call(this)},set:function(e){I=""+e,S.set.call(this,e)}},V={eventTypes:M,extractEvents:function(e,t,n,r){var i,a;if(o(t)?P?i=u:a=c:w(t)?k?i=f:(i=m,a=h):v(t)&&(i=y),i){var s=i(e,t,n);if(s){var l=_.getPooled(M.change,s,r);return N.accumulateTwoPhaseDispatches(l),l}}a&&a(e,t,n)}};e.exports=V},function(e,t){"use strict";function n(e){return e&&("INPUT"===e.nodeName&&o[e.type]||"TEXTAREA"===e.nodeName)}var o={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};e.exports=n},function(e,t){"use strict";var n=0,o={createReactRootIndex:function(){return n++}};e.exports=o},function(e,t,n){"use strict";function o(e){switch(e){case g.topCompositionStart:return N.compositionStart;case g.topCompositionEnd:return N.compositionEnd;case g.topCompositionUpdate:return N.compositionUpdate}}function r(e,t){return e===g.topKeyDown&&t.keyCode===m}function i(e,t){switch(e){case g.topKeyUp:return h.indexOf(t.keyCode)!==-1;case g.topKeyDown:return t.keyCode!==m;case g.topKeyPress:case g.topMouseDown:case g.topBlur:return!0;default:return!1}}function a(e){this.root=e,this.startSelection=l.getSelection(e),this.startValue=this.getText()}var s=n(17),u=n(82),c=n(54),l=n(90),p=n(96),d=n(93),f=n(47),h=[9,13,27,32],m=229,v=c.canUseDOM&&"CompositionEvent"in window,y=!v||"documentMode"in document&&document.documentMode>8&&document.documentMode<=11,g=s.topLevelTypes,E=null,N={compositionEnd:{phasedRegistrationNames:{bubbled:f({onCompositionEnd:null}),captured:f({onCompositionEndCapture:null})},dependencies:[g.topBlur,g.topCompositionEnd,g.topKeyDown,g.topKeyPress,g.topKeyUp,g.topMouseDown]},compositionStart:{phasedRegistrationNames:{bubbled:f({onCompositionStart:null}),captured:f({onCompositionStartCapture:null})},dependencies:[g.topBlur,g.topCompositionStart,g.topKeyDown,g.topKeyPress,g.topKeyUp,g.topMouseDown]},compositionUpdate:{phasedRegistrationNames:{bubbled:f({onCompositionUpdate:null}),captured:f({onCompositionUpdateCapture:null})},dependencies:[g.topBlur,g.topCompositionUpdate,g.topKeyDown,g.topKeyPress,g.topKeyUp,g.topMouseDown]}};a.prototype.getText=function(){return this.root.value||this.root[d()]},a.prototype.getData=function(){var e=this.getText(),t=this.startSelection.start,n=this.startValue.length-this.startSelection.end;return e.substr(t,e.length-n-t)};var b={eventTypes:N,extractEvents:function(e,t,n,s){var c,l;if(v?c=o(e):E?i(e,s)&&(c=N.compositionEnd):r(e,s)&&(c=N.compositionStart),y&&(E||c!==N.compositionStart?c===N.compositionEnd&&E&&(l=E.getData(),E=null):E=new a(t)),c){var d=p.getPooled(c,n,s);return l&&(d.data=l),u.accumulateTwoPhaseDispatches(d),d}}};e.exports=b},function(e,t,n){"use strict";function o(e){return i(document.documentElement,e)}var r=n(91),i=n(71),a=n(94),s=n(95),u={hasSelectionCapabilities:function(e){return e&&("INPUT"===e.nodeName&&"text"===e.type||"TEXTAREA"===e.nodeName||"true"===e.contentEditable)},getSelectionInformation:function(){var e=s();return{focusedElem:e,selectionRange:u.hasSelectionCapabilities(e)?u.getSelection(e):null}},restoreSelection:function(e){var t=s(),n=e.focusedElem,r=e.selectionRange;t!==n&&o(n)&&(u.hasSelectionCapabilities(n)&&u.setSelection(n,r),a(n))},getSelection:function(e){var t;if("selectionStart"in e)t={start:e.selectionStart,end:e.selectionEnd};else if(document.selection&&"INPUT"===e.nodeName){var n=document.selection.createRange();n.parentElement()===e&&(t={start:-n.moveStart("character",-e.value.length),end:-n.moveEnd("character",-e.value.length)})}else t=r.getOffsets(e);return t||{start:0,end:0}},setSelection:function(e,t){var n=t.start,o=t.end;if("undefined"==typeof o&&(o=n),"selectionStart"in e)e.selectionStart=n,e.selectionEnd=Math.min(o,e.value.length);else if(document.selection&&"INPUT"===e.nodeName){var i=e.createTextRange();i.collapse(!0),i.moveStart("character",n),i.moveEnd("character",o-n),i.select()}else r.setOffsets(e,t)}};e.exports=u},function(e,t,n){"use strict";function o(e,t,n,o){return e===n&&t===o}function r(e){var t=document.selection,n=t.createRange(),o=n.text.length,r=n.duplicate();r.moveToElementText(e),r.setEndPoint("EndToStart",n);var i=r.text.length,a=i+o;return{start:i,end:a}}function i(e){var t=window.getSelection&&window.getSelection();if(!t||0===t.rangeCount)return null;var n=t.anchorNode,r=t.anchorOffset,i=t.focusNode,a=t.focusOffset,s=t.getRangeAt(0),u=o(t.anchorNode,t.anchorOffset,t.focusNode,t.focusOffset),c=u?0:s.toString().length,l=s.cloneRange();l.selectNodeContents(e),l.setEnd(s.startContainer,s.startOffset);var p=o(l.startContainer,l.startOffset,l.endContainer,l.endOffset),d=p?0:l.toString().length,f=d+c,h=document.createRange();h.setStart(n,r),h.setEnd(i,a);var m=h.collapsed;return{start:m?f:d,end:m?d:f}}function a(e,t){var n,o,r=document.selection.createRange().duplicate();"undefined"==typeof t.end?(n=t.start,o=n):t.start>t.end?(n=t.end,o=t.start):(n=t.start,o=t.end),r.moveToElementText(e),r.moveStart("character",n),r.setEndPoint("EndToStart",r),r.moveEnd("character",o-n),r.select()}function s(e,t){if(window.getSelection){var n=window.getSelection(),o=e[l()].length,r=Math.min(t.start,o),i="undefined"==typeof t.end?r:Math.min(t.end,o);if(!n.extend&&r>i){var a=i;i=r,r=a}var s=c(e,r),u=c(e,i);if(s&&u){var p=document.createRange();p.setStart(s.node,s.offset),n.removeAllRanges(),r>i?(n.addRange(p),n.extend(u.node,u.offset)):(p.setEnd(u.node,u.offset),n.addRange(p))}}}var u=n(54),c=n(92),l=n(93),p=u.canUseDOM&&document.selection,d={getOffsets:p?r:i,setOffsets:p?a:s};e.exports=d},function(e,t){"use strict";function n(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function o(e){for(;e;){if(e.nextSibling)return e.nextSibling;e=e.parentNode}}function r(e,t){for(var r=n(e),i=0,a=0;r;){if(3==r.nodeType){if(a=i+r.textContent.length,i<=t&&a>=t)return{node:r,offset:t-i};i=a}r=n(o(r))}}e.exports=r},function(e,t,n){"use strict";function o(){return!i&&r.canUseDOM&&(i="textContent"in document.documentElement?"textContent":"innerText"),i}var r=n(54),i=null;e.exports=o},function(e,t){"use strict";function n(e){try{e.focus()}catch(e){}}e.exports=n},function(e,t){function n(){try{return document.activeElement||document.body}catch(e){return document.body}}e.exports=n},function(e,t,n){"use strict";function o(e,t,n){r.call(this,e,t,n)}var r=n(84),i={data:null};r.augmentClass(o,i),e.exports=o},function(e,t,n){"use strict";var o=n(47),r=[o({ResponderEventPlugin:null}),o({SimpleEventPlugin:null}),o({TapEventPlugin:null}),o({EnterLeaveEventPlugin:null}),o({ChangeEventPlugin:null}),o({SelectEventPlugin:null}),o({CompositionEventPlugin:null}),o({BeforeInputEventPlugin:null}),o({AnalyticsEventPlugin:null}),o({MobileSafariClickEventPlugin:null})];e.exports=r},function(e,t,n){"use strict";var o=n(17),r=n(82),i=n(99),a=n(61),s=n(47),u=o.topLevelTypes,c=a.getFirstReactDOM,l={mouseEnter:{registrationName:s({onMouseEnter:null}),dependencies:[u.topMouseOut,u.topMouseOver]},mouseLeave:{registrationName:s({onMouseLeave:null}),dependencies:[u.topMouseOut,u.topMouseOver]}},p=[null,null],d={eventTypes:l,extractEvents:function(e,t,n,o){if(e===u.topMouseOver&&(o.relatedTarget||o.fromElement))return null;if(e!==u.topMouseOut&&e!==u.topMouseOver)return null;var s;if(t.window===t)s=t;else{var d=t.ownerDocument;s=d?d.defaultView||d.parentWindow:window}var f,h;if(e===u.topMouseOut?(f=t,h=c(o.relatedTarget||o.toElement)||s):(f=s,h=t),f===h)return null;var m=f?a.getID(f):"",v=h?a.getID(h):"",y=i.getPooled(l.mouseLeave,m,o);y.type="mouseleave",y.target=f,y.relatedTarget=h;var g=i.getPooled(l.mouseEnter,v,o);return g.type="mouseenter",g.target=h,g.relatedTarget=f,r.accumulateEnterLeaveDispatches(y,g,m,v),p[0]=y,p[1]=g,p}};e.exports=d},function(e,t,n){"use strict";function o(e,t,n){r.call(this,e,t,n)}var r=n(100),i=n(68),a=n(101),s={screenX:null,screenY:null,clientX:null,clientY:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,getModifierState:a,button:function(e){var t=e.button;return"which"in e?t:2===t?2:4===t?1:0},buttons:null,relatedTarget:function(e){return e.relatedTarget||(e.fromElement===e.srcElement?e.toElement:e.fromElement)},pageX:function(e){return"pageX"in e?e.pageX:e.clientX+i.currentScrollLeft},pageY:function(e){return"pageY"in e?e.pageY:e.clientY+i.currentScrollTop}};r.augmentClass(o,s),e.exports=o},function(e,t,n){"use strict";function o(e,t,n){r.call(this,e,t,n)}var r=n(84),i=n(85),a={view:function(e){if(e.view)return e.view;var t=i(e);if(null!=t&&t.window===t)return t;var n=t.ownerDocument;return n?n.defaultView||n.parentWindow:window},detail:function(e){return e.detail||0}};r.augmentClass(o,a),e.exports=o},function(e,t){"use strict";function n(e){var t=this,n=t.nativeEvent;if(n.getModifierState)return n.getModifierState(e);var o=r[e];return!!o&&!!n[o]}function o(e){return n}var r={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};e.exports=o},function(e,t,n){"use strict";var o,r=n(10),i=n(54),a=r.injection.MUST_USE_ATTRIBUTE,s=r.injection.MUST_USE_PROPERTY,u=r.injection.HAS_BOOLEAN_VALUE,c=r.injection.HAS_SIDE_EFFECTS,l=r.injection.HAS_NUMERIC_VALUE,p=r.injection.HAS_POSITIVE_NUMERIC_VALUE,d=r.injection.HAS_OVERLOADED_BOOLEAN_VALUE;if(i.canUseDOM){var f=document.implementation;o=f&&f.hasFeature&&f.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1")}var h={isCustomAttribute:RegExp.prototype.test.bind(/^(data|aria)-[a-z_][a-z\d_.\-]*$/),Properties:{accept:null,acceptCharset:null,accessKey:null,action:null,allowFullScreen:a|u,allowTransparency:a,alt:null,async:u,autoComplete:null,autoPlay:u,cellPadding:null,cellSpacing:null,charSet:a,checked:s|u,classID:a,className:o?a:s,cols:a|p,colSpan:null,content:null,contentEditable:null,contextMenu:a,controls:s|u,coords:null,crossOrigin:null,data:null,dateTime:a,defer:u,dir:null,disabled:a|u,download:d,draggable:null,encType:null,form:a,formAction:a,formEncType:a,formMethod:a,formNoValidate:u,formTarget:a,frameBorder:a,height:a,hidden:a|u,href:null,hrefLang:null,htmlFor:null,httpEquiv:null,icon:null,id:s,label:null,lang:null,list:a,loop:s|u,manifest:a,marginHeight:null,marginWidth:null,max:null,maxLength:a,media:a,mediaGroup:null,method:null,min:null,multiple:s|u,muted:s|u,name:null,noValidate:u,open:null,pattern:null,placeholder:null,poster:null,preload:null,radioGroup:null,readOnly:s|u,rel:null,required:u,role:a,rows:a|p,rowSpan:null,sandbox:null,scope:null,scrolling:null,seamless:a|u,selected:s|u,shape:null,size:a|p,sizes:a,span:p,spellCheck:null,src:null,srcDoc:s,srcSet:a,start:l,step:null,style:null,tabIndex:null,target:null,title:null,type:null,useMap:null,value:s|c,width:a,wmode:a,autoCapitalize:null,autoCorrect:null,itemProp:a,itemScope:a|u,itemType:a,property:null},DOMAttributeNames:{acceptCharset:"accept-charset",className:"class",htmlFor:"for",httpEquiv:"http-equiv"},DOMPropertyNames:{autoCapitalize:"autocapitalize",autoComplete:"autocomplete",autoCorrect:"autocorrect",autoFocus:"autofocus",autoPlay:"autoplay",encType:"enctype",hrefLang:"hreflang",radioGroup:"radiogroup",spellCheck:"spellcheck",srcDoc:"srcdoc",srcSet:"srcset"}};e.exports=h},function(e,t,n){"use strict";var o=n(17),r=n(15),i=o.topLevelTypes,a={eventTypes:null,extractEvents:function(e,t,n,o){if(e===i.topTouchStart){var a=o.target;a&&!a.onclick&&(a.onclick=r)}}};e.exports=a},function(e,t,n){(function(t){"use strict";var o=n(105),r=n(113),i=n(61),a=n(33),s=n(115),u=n(75),c=n(11),l=n(112),p=1,d=9,f={ReactReconcileTransaction:s,BackendIDOperations:o,unmountIDFromEnvironment:function(e){i.purgeID(e)},mountImageIntoNode:a.measure("ReactComponentBrowserEnvironment","mountImageIntoNode",function(e,n,o){if("production"!==t.env.NODE_ENV?c(n&&(n.nodeType===p||n.nodeType===d),"mountComponentIntoNode(...): Target container is not valid."):c(n&&(n.nodeType===p||n.nodeType===d)),o){if(r.canReuseMarkup(e,u(n)))return;"production"!==t.env.NODE_ENV?c(n.nodeType!==d,"You're trying to render a component to the document using server rendering but the checksum was invalid. This usually means you rendered a different component type or props on the client from the one on the server, or your render() methods are impure. React cannot handle this case due to cross-browser quirks by rendering at the document root. You should look for environment dependent code in your components and ensure the props are the same client and server side."):c(n.nodeType!==d),"production"!==t.env.NODE_ENV&&console.warn("React attempted to use reuse markup in a container but the checksum was invalid. This generally means that you are using server rendering and the markup generated on the server was not what the client was expecting. React injected new markup to compensate which works but you have lost many of the benefits of server rendering. Instead, figure out why the markup being generated is different on the client or server.")}"production"!==t.env.NODE_ENV?c(n.nodeType!==d,"You're trying to render a component to the document but you didn't use server rendering. We can't do this without using server rendering due to cross-browser quirks. See renderComponentToString() for server rendering."):c(n.nodeType!==d),l(n,e)})};e.exports=f}).call(t,n(8))},function(e,t,n){(function(t){"use strict";var o=n(52),r=n(106),i=n(9),a=n(61),s=n(33),u=n(11),c=n(112),l={dangerouslySetInnerHTML:"`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.",style:"`style` must be set using `updateStylesByID()`."},p={updatePropertyByID:s.measure("ReactDOMIDOperations","updatePropertyByID",function(e,n,o){var r=a.getNode(e);"production"!==t.env.NODE_ENV?u(!l.hasOwnProperty(n),"updatePropertyByID(...): %s",l[n]):u(!l.hasOwnProperty(n)),null!=o?i.setValueForProperty(r,n,o):i.deleteValueForProperty(r,n)}),deletePropertyByID:s.measure("ReactDOMIDOperations","deletePropertyByID",function(e,n,o){var r=a.getNode(e);"production"!==t.env.NODE_ENV?u(!l.hasOwnProperty(n),"updatePropertyByID(...): %s",l[n]):u(!l.hasOwnProperty(n)),i.deleteValueForProperty(r,n,o)}),updateStylesByID:s.measure("ReactDOMIDOperations","updateStylesByID",function(e,t){var n=a.getNode(e);o.setValueForStyles(n,t)}),updateInnerHTMLByID:s.measure("ReactDOMIDOperations","updateInnerHTMLByID",function(e,t){var n=a.getNode(e);c(n,t)}),updateTextContentByID:s.measure("ReactDOMIDOperations","updateTextContentByID",function(e,t){var n=a.getNode(e);r.updateTextContent(n,t)}),dangerouslyReplaceNodeWithMarkupByID:s.measure("ReactDOMIDOperations","dangerouslyReplaceNodeWithMarkupByID",function(e,t){var n=a.getNode(e);r.dangerouslyReplaceNodeWithMarkup(n,t)}),dangerouslyProcessChildrenUpdates:s.measure("ReactDOMIDOperations","dangerouslyProcessChildrenUpdates",function(e,t){for(var n=0;n<e.length;n++)e[n].parentNode=a.getNode(e[n].parentID);r.processUpdates(e,t)})};e.exports=p}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e,t,n){e.insertBefore(t,e.childNodes[n]||null)}var r,i=n(107),a=n(77),s=n(93),u=n(11),c=s();r="textContent"===c?function(e,t){e.textContent=t}:function(e,t){for(;e.firstChild;)e.removeChild(e.firstChild);if(t){var n=e.ownerDocument||document;e.appendChild(n.createTextNode(t))}};var l={dangerouslyReplaceNodeWithMarkup:i.dangerouslyReplaceNodeWithMarkup,updateTextContent:r,processUpdates:function(e,n){for(var s,c=null,l=null,p=0;s=e[p];p++)if(s.type===a.MOVE_EXISTING||s.type===a.REMOVE_NODE){var d=s.fromIndex,f=s.parentNode.childNodes[d],h=s.parentID;"production"!==t.env.NODE_ENV?u(f,"processUpdates(): Unable to find child %s of element. This probably means the DOM was unexpectedly mutated (e.g., by the browser), usually due to forgetting a <tbody> when using tables, nesting tags like <form>, <p>, or <a>, or using non-SVG elements in an <svg> parent. Try inspecting the child nodes of the element with React ID `%s`.",d,h):u(f),c=c||{},c[h]=c[h]||[],c[h][d]=f,l=l||[],l.push(f)}var m=i.dangerouslyRenderMarkup(n);if(l)for(var v=0;v<l.length;v++)l[v].parentNode.removeChild(l[v]);for(var y=0;s=e[y];y++)switch(s.type){case a.INSERT_MARKUP:o(s.parentNode,m[s.markupIndex],s.toIndex);break;case a.MOVE_EXISTING:o(s.parentNode,c[s.parentID][s.fromIndex],s.toIndex);break;case a.TEXT_CONTENT:r(s.parentNode,s.textContent);break;case a.REMOVE_NODE:}}};e.exports=l}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e){return e.substring(1,e.indexOf(" "))}var r=n(54),i=n(108),a=n(15),s=n(111),u=n(11),c=/^(<[^ \/>]+)/,l="data-danger-index",p={dangerouslyRenderMarkup:function(e){"production"!==t.env.NODE_ENV?u(r.canUseDOM,"dangerouslyRenderMarkup(...): Cannot render markup in a worker thread. Make sure `window` and `document` are available globally before requiring React when unit testing or use React.renderToString for server rendering."):u(r.canUseDOM);for(var n,p={},d=0;d<e.length;d++)"production"!==t.env.NODE_ENV?u(e[d],"dangerouslyRenderMarkup(...): Missing markup."):u(e[d]),n=o(e[d]),n=s(n)?n:"*",p[n]=p[n]||[],p[n][d]=e[d];var f=[],h=0;for(n in p)if(p.hasOwnProperty(n)){var m=p[n];for(var v in m)if(m.hasOwnProperty(v)){var y=m[v];m[v]=y.replace(c,"$1 "+l+'="'+v+'" ')}var g=i(m.join(""),a);for(d=0;d<g.length;++d){var E=g[d];E.hasAttribute&&E.hasAttribute(l)?(v=+E.getAttribute(l),E.removeAttribute(l),"production"!==t.env.NODE_ENV?u(!f.hasOwnProperty(v),"Danger: Assigning to an already-occupied result index."):u(!f.hasOwnProperty(v)),f[v]=E,h+=1):"production"!==t.env.NODE_ENV&&console.error("Danger: Discarding unexpected node:",E)}}return"production"!==t.env.NODE_ENV?u(h===f.length,"Danger: Did not assign to every index of resultList."):u(h===f.length),"production"!==t.env.NODE_ENV?u(f.length===e.length,"Danger: Expected markup to render %s nodes, but rendered %s.",e.length,f.length):u(f.length===e.length),f},dangerouslyReplaceNodeWithMarkup:function(e,n){"production"!==t.env.NODE_ENV?u(r.canUseDOM,"dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a worker thread. Make sure `window` and `document` are available globally before requiring React when unit testing or use React.renderToString for server rendering."):u(r.canUseDOM),"production"!==t.env.NODE_ENV?u(n,"dangerouslyReplaceNodeWithMarkup(...): Missing markup."):u(n),"production"!==t.env.NODE_ENV?u("html"!==e.tagName.toLowerCase(),"dangerouslyReplaceNodeWithMarkup(...): Cannot replace markup of the <html> node. This is because browser quirks make this unreliable and/or slow. If you want to render to the root you must use server rendering. See renderComponentToString()."):u("html"!==e.tagName.toLowerCase());var o=i(n,a)[0];e.parentNode.replaceChild(o,e)}};e.exports=p}).call(t,n(8))},function(e,t,n){(function(t){function o(e){var t=e.match(l);return t&&t[1].toLowerCase()}function r(e,n){var r=c;"production"!==t.env.NODE_ENV?u(!!c,"createNodesFromMarkup dummy not initialized"):u(!!c);var i=o(e),l=i&&s(i);if(l){r.innerHTML=l[1]+e+l[2];for(var p=l[0];p--;)r=r.lastChild}else r.innerHTML=e;var d=r.getElementsByTagName("script");d.length&&("production"!==t.env.NODE_ENV?u(n,"createNodesFromMarkup(...): Unexpected <script> element rendered."):u(n),a(d).forEach(n));for(var f=a(r.childNodes);r.lastChild;)r.removeChild(r.lastChild);return f}var i=n(54),a=n(109),s=n(111),u=n(11),c=i.canUseDOM?document.createElement("div"):null,l=/^\s*<(\w+)/;e.exports=r}).call(t,n(8))},function(e,t,n){function o(e){return!!e&&("object"==typeof e||"function"==typeof e)&&"length"in e&&!("setInterval"in e)&&"number"!=typeof e.nodeType&&(Array.isArray(e)||"callee"in e||"item"in e)}function r(e){return o(e)?Array.isArray(e)?e.slice():i(e):[e]}var i=n(110);e.exports=r},function(e,t,n){(function(t){function o(e){var n=e.length;if("production"!==t.env.NODE_ENV?r(!Array.isArray(e)&&("object"==typeof e||"function"==typeof e),"toArray: Array-like object expected"):r(!Array.isArray(e)&&("object"==typeof e||"function"==typeof e)),
18:"production"!==t.env.NODE_ENV?r("number"==typeof n,"toArray: Object needs a length property"):r("number"==typeof n),"production"!==t.env.NODE_ENV?r(0===n||n-1 in e,"toArray: Object should have keys for indices"):r(0===n||n-1 in e),e.hasOwnProperty)try{return Array.prototype.slice.call(e)}catch(e){}for(var o=Array(n),i=0;i<n;i++)o[i]=e[i];return o}var r=n(11);e.exports=o}).call(t,n(8))},function(e,t,n){(function(t){function o(e){return"production"!==t.env.NODE_ENV?i(!!a,"Markup wrapping node not initialized"):i(!!a),d.hasOwnProperty(e)||(e="*"),s.hasOwnProperty(e)||("*"===e?a.innerHTML="<link />":a.innerHTML="<"+e+"></"+e+">",s[e]=!a.firstChild),s[e]?d[e]:null}var r=n(54),i=n(11),a=r.canUseDOM?document.createElement("div"):null,s={circle:!0,defs:!0,ellipse:!0,g:!0,line:!0,linearGradient:!0,path:!0,polygon:!0,polyline:!0,radialGradient:!0,rect:!0,stop:!0,text:!0},u=[1,'<select multiple="true">',"</select>"],c=[1,"<table>","</table>"],l=[3,"<table><tbody><tr>","</tr></tbody></table>"],p=[1,"<svg>","</svg>"],d={"*":[1,"?<div>","</div>"],area:[1,"<map>","</map>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],legend:[1,"<fieldset>","</fieldset>"],param:[1,"<object>","</object>"],tr:[2,"<table><tbody>","</tbody></table>"],optgroup:u,option:u,caption:c,colgroup:c,tbody:c,tfoot:c,thead:c,td:l,th:l,circle:p,defs:p,ellipse:p,g:p,line:p,linearGradient:p,path:p,polygon:p,polyline:p,radialGradient:p,rect:p,stop:p,text:p};e.exports=o}).call(t,n(8))},function(e,t,n){"use strict";var o=n(54),r=/^[ \r\n\t\f]/,i=/<(!--|link|noscript|meta|script|style)[ \r\n\t\f\/>]/,a=function(e,t){e.innerHTML=t};if(o.canUseDOM){var s=document.createElement("div");s.innerHTML=" ",""===s.innerHTML&&(a=function(e,t){if(e.parentNode&&e.parentNode.replaceChild(e,e),r.test(t)||"<"===t[0]&&i.test(t)){e.innerHTML="\ufeff"+t;var n=e.firstChild;1===n.data.length?e.removeChild(n):n.deleteData(0,1)}else e.innerHTML=t})}e.exports=a},function(e,t,n){"use strict";var o=n(114),r={CHECKSUM_ATTR_NAME:"data-react-checksum",addChecksumToMarkup:function(e){var t=o(e);return e.replace(">"," "+r.CHECKSUM_ATTR_NAME+'="'+t+'">')},canReuseMarkup:function(e,t){var n=t.getAttribute(r.CHECKSUM_ATTR_NAME);n=n&&parseInt(n,10);var i=o(e);return i===n}};e.exports=r},function(e,t){"use strict";function n(e){for(var t=1,n=0,r=0;r<e.length;r++)t=(t+e.charCodeAt(r))%o,n=(n+t)%o;return t|n<<16}var o=65521;e.exports=n},function(e,t,n){"use strict";function o(){this.reinitializeTransaction(),this.renderToStaticMarkup=!1,this.reactMountReady=r.getPooled(null),this.putListenerQueue=u.getPooled()}var r=n(32),i=n(20),a=n(62),s=n(90),u=n(116),c=n(34),l=n(24),p={initialize:s.getSelectionInformation,close:s.restoreSelection},d={initialize:function(){var e=a.isEnabled();return a.setEnabled(!1),e},close:function(e){a.setEnabled(e)}},f={initialize:function(){this.reactMountReady.reset()},close:function(){this.reactMountReady.notifyAll()}},h={initialize:function(){this.putListenerQueue.reset()},close:function(){this.putListenerQueue.putListeners()}},m=[h,p,d,f],v={getTransactionWrappers:function(){return m},getReactMountReady:function(){return this.reactMountReady},getPutListenerQueue:function(){return this.putListenerQueue},destructor:function(){r.release(this.reactMountReady),this.reactMountReady=null,u.release(this.putListenerQueue),this.putListenerQueue=null}};l(o.prototype,c.Mixin,v),i.addPoolingTo(o),e.exports=o},function(e,t,n){"use strict";function o(){this.listenersToPut=[]}var r=n(20),i=n(62),a=n(24);a(o.prototype,{enqueuePutListener:function(e,t,n){this.listenersToPut.push({rootNodeID:e,propKey:t,propValue:n})},putListeners:function(){for(var e=0;e<this.listenersToPut.length;e++){var t=this.listenersToPut[e];i.putListener(t.rootNodeID,t.propKey,t.propValue)}},reset:function(){this.listenersToPut.length=0},destructor:function(){this.reset()}}),r.addPoolingTo(o),e.exports=o},function(e,t,n){"use strict";function o(){this.reinitializeTransaction()}var r=n(31),i=n(34),a=n(24),s=n(15),u={initialize:s,close:function(){d.isBatchingUpdates=!1}},c={initialize:s,close:r.flushBatchedUpdates.bind(r)},l=[c,u];a(o.prototype,i.Mixin,{getTransactionWrappers:function(){return l}});var p=new o,d={isBatchingUpdates:!1,batchedUpdates:function(e,t,n){var o=d.isBatchingUpdates;d.isBatchingUpdates=!0,o?e(t,n):p.perform(e,null,t,n)}};e.exports=d},function(e,t,n){"use strict";var o=n(119),r=n(60),i=n(35),a=n(22),s=n(50),u=n(18),c=a.createFactory(s.button.type),l=u({onClick:!0,onDoubleClick:!0,onMouseDown:!0,onMouseMove:!0,onMouseUp:!0,onClickCapture:!0,onDoubleClickCapture:!0,onMouseDownCapture:!0,onMouseMoveCapture:!0,onMouseUpCapture:!0}),p=i.createClass({displayName:"ReactDOMButton",mixins:[o,r],render:function(){var e={};for(var t in this.props)!this.props.hasOwnProperty(t)||this.props.disabled&&l[t]||(e[t]=this.props[t]);return c(e,this.props.children)}});e.exports=p},function(e,t,n){"use strict";var o=n(94),r={componentDidMount:function(){this.props.autoFocus&&o(this.getDOMNode())}};e.exports=r},function(e,t,n){"use strict";var o=n(17),r=n(121),i=n(60),a=n(35),s=n(22),u=n(50),c=s.createFactory(u.form.type),l=a.createClass({displayName:"ReactDOMForm",mixins:[i,r],render:function(){return c(this.props)},componentDidMount:function(){this.trapBubbledEvent(o.topLevelTypes.topReset,"reset"),this.trapBubbledEvent(o.topLevelTypes.topSubmit,"submit")}});e.exports=l},function(e,t,n){(function(t){"use strict";function o(e){e.remove()}var r=n(62),i=n(65),a=n(66),s=n(11),u={trapBubbledEvent:function(e,n){"production"!==t.env.NODE_ENV?s(this.isMounted(),"Must be mounted to trap events"):s(this.isMounted());var o=r.trapBubbledEvent(e,n,this.getDOMNode());this._localEventListeners=i(this._localEventListeners,o)},componentWillUnmount:function(){this._localEventListeners&&a(this._localEventListeners,o)}};e.exports=u}).call(t,n(8))},function(e,t,n){"use strict";var o=n(17),r=n(121),i=n(60),a=n(35),s=n(22),u=n(50),c=s.createFactory(u.img.type),l=a.createClass({displayName:"ReactDOMImg",tagName:"IMG",mixins:[i,r],render:function(){return c(this.props)},componentDidMount:function(){this.trapBubbledEvent(o.topLevelTypes.topLoad,"load"),this.trapBubbledEvent(o.topLevelTypes.topError,"error")}});e.exports=l},function(e,t,n){(function(t){"use strict";function o(){this.isMounted()&&this.forceUpdate()}var r=n(119),i=n(9),a=n(124),s=n(60),u=n(35),c=n(22),l=n(50),p=n(61),d=n(31),f=n(24),h=n(11),m=c.createFactory(l.input.type),v={},y=u.createClass({displayName:"ReactDOMInput",mixins:[r,a.Mixin,s],getInitialState:function(){var e=this.props.defaultValue;return{initialChecked:this.props.defaultChecked||!1,initialValue:null!=e?e:null}},render:function(){var e=f({},this.props);e.defaultChecked=null,e.defaultValue=null;var t=a.getValue(this);e.value=null!=t?t:this.state.initialValue;var n=a.getChecked(this);return e.checked=null!=n?n:this.state.initialChecked,e.onChange=this._handleChange,m(e,this.props.children)},componentDidMount:function(){var e=p.getID(this.getDOMNode());v[e]=this},componentWillUnmount:function(){var e=this.getDOMNode(),t=p.getID(e);delete v[t]},componentDidUpdate:function(e,t,n){var o=this.getDOMNode();null!=this.props.checked&&i.setValueForProperty(o,"checked",this.props.checked||!1);var r=a.getValue(this);null!=r&&i.setValueForProperty(o,"value",""+r)},_handleChange:function(e){var n,r=a.getOnChange(this);r&&(n=r.call(this,e)),d.asap(o,this);var i=this.props.name;if("radio"===this.props.type&&null!=i){for(var s=this.getDOMNode(),u=s;u.parentNode;)u=u.parentNode;for(var c=u.querySelectorAll("input[name="+JSON.stringify(""+i)+'][type="radio"]'),l=0,f=c.length;l<f;l++){var m=c[l];if(m!==s&&m.form===s.form){var y=p.getID(m);"production"!==t.env.NODE_ENV?h(y,"ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported."):h(y);var g=v[y];"production"!==t.env.NODE_ENV?h(g,"ReactDOMInput: Unknown radio button ID %s.",y):h(g),d.asap(o,g)}}}return n}});e.exports=y}).call(t,n(8))},function(e,t,n){(function(t){"use strict";function o(e){"production"!==t.env.NODE_ENV?c(null==e.props.checkedLink||null==e.props.valueLink,"Cannot provide a checkedLink and a valueLink. If you want to use checkedLink, you probably don't want to use valueLink and vice versa."):c(null==e.props.checkedLink||null==e.props.valueLink)}function r(e){o(e),"production"!==t.env.NODE_ENV?c(null==e.props.value&&null==e.props.onChange,"Cannot provide a valueLink and a value or onChange event. If you want to use value or onChange, you probably don't want to use valueLink."):c(null==e.props.value&&null==e.props.onChange)}function i(e){o(e),"production"!==t.env.NODE_ENV?c(null==e.props.checked&&null==e.props.onChange,"Cannot provide a checkedLink and a checked property or onChange event. If you want to use checked or onChange, you probably don't want to use checkedLink"):c(null==e.props.checked&&null==e.props.onChange)}function a(e){this.props.valueLink.requestChange(e.target.value)}function s(e){this.props.checkedLink.requestChange(e.target.checked)}var u=n(125),c=n(11),l={button:!0,checkbox:!0,image:!0,hidden:!0,radio:!0,reset:!0,submit:!0},p={Mixin:{propTypes:{value:function(e,t,n){if(!(!e[t]||l[e.type]||e.onChange||e.readOnly||e.disabled))return new Error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.")},checked:function(e,t,n){if(e[t]&&!e.onChange&&!e.readOnly&&!e.disabled)return new Error("You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.")},onChange:u.func}},getValue:function(e){return e.props.valueLink?(r(e),e.props.valueLink.value):e.props.value},getChecked:function(e){return e.props.checkedLink?(i(e),e.props.checkedLink.value):e.props.checked},getOnChange:function(e){return e.props.valueLink?(r(e),a):e.props.checkedLink?(i(e),s):e.props.onChange}};e.exports=p}).call(t,n(8))},function(e,t,n){"use strict";function o(e){function t(t,n,o,r,i){if(r=r||b,null!=n[o])return e(n,o,r,i);var a=g[i];return t?new Error("Required "+a+" `"+o+"` was not specified in "+("`"+r+"`.")):void 0}var n=t.bind(null,!1);return n.isRequired=t.bind(null,!0),n}function r(e){function t(t,n,o,r){var i=t[n],a=m(i);if(a!==e){var s=g[r],u=v(i);return new Error("Invalid "+s+" `"+n+"` of type `"+u+"` "+("supplied to `"+o+"`, expected `"+e+"`."))}}return o(t)}function i(){return o(N.thatReturns())}function a(e){function t(t,n,o,r){var i=t[n];if(!Array.isArray(i)){var a=g[r],s=m(i);return new Error("Invalid "+a+" `"+n+"` of type "+("`"+s+"` supplied to `"+o+"`, expected an array."))}for(var u=0;u<i.length;u++){var c=e(i,u,o,r);if(c instanceof Error)return c}}return o(t)}function s(){function e(e,t,n,o){if(!y.isValidElement(e[t])){var r=g[o];return new Error("Invalid "+r+" `"+t+"` supplied to "+("`"+n+"`, expected a ReactElement."))}}return o(e)}function u(e){function t(t,n,o,r){if(!(t[n]instanceof e)){var i=g[r],a=e.name||b;return new Error("Invalid "+i+" `"+n+"` supplied to "+("`"+o+"`, expected instance of `"+a+"`."))}}return o(t)}function c(e){function t(t,n,o,r){for(var i=t[n],a=0;a<e.length;a++)if(i===e[a])return;var s=g[r],u=JSON.stringify(e);return new Error("Invalid "+s+" `"+n+"` of value `"+i+"` "+("supplied to `"+o+"`, expected one of "+u+"."))}return o(t)}function l(e){function t(t,n,o,r){var i=t[n],a=m(i);if("object"!==a){var s=g[r];return new Error("Invalid "+s+" `"+n+"` of type "+("`"+a+"` supplied to `"+o+"`, expected an object."))}for(var u in i)if(i.hasOwnProperty(u)){var c=e(i,u,o,r);if(c instanceof Error)return c}}return o(t)}function p(e){function t(t,n,o,r){for(var i=0;i<e.length;i++){var a=e[i];if(null==a(t,n,o,r))return}var s=g[r];return new Error("Invalid "+s+" `"+n+"` supplied to "+("`"+o+"`."))}return o(t)}function d(){function e(e,t,n,o){if(!h(e[t])){var r=g[o];return new Error("Invalid "+r+" `"+t+"` supplied to "+("`"+n+"`, expected a ReactNode."))}}return o(e)}function f(e){function t(t,n,o,r){var i=t[n],a=m(i);if("object"!==a){var s=g[r];return new Error("Invalid "+s+" `"+n+"` of type `"+a+"` "+("supplied to `"+o+"`, expected `object`."))}for(var u in e){var c=e[u];if(c){var l=c(i,u,o,r);if(l)return l}}}return o(t,"expected `object`")}function h(e){switch(typeof e){case"number":case"string":return!0;case"boolean":return!e;case"object":if(Array.isArray(e))return e.every(h);if(y.isValidElement(e))return!0;for(var t in e)if(!h(e[t]))return!1;return!0;default:return!1}}function m(e){var t=typeof e;return Array.isArray(e)?"array":e instanceof RegExp?"object":t}function v(e){var t=m(e);if("object"===t){if(e instanceof Date)return"date";if(e instanceof RegExp)return"regexp"}return t}var y=n(22),g=n(44),E=n(74),N=n(15),b="<<anonymous>>",C=s(),_=d(),D={array:r("array"),bool:r("boolean"),func:r("function"),number:r("number"),object:r("object"),string:r("string"),any:i(),arrayOf:a,element:C,instanceOf:u,node:_,objectOf:l,oneOf:c,oneOfType:p,shape:f,component:E("React.PropTypes","component","element",this,C),renderable:E("React.PropTypes","renderable","node",this,_)};e.exports=D},function(e,t,n){(function(t){"use strict";var o=n(60),r=n(35),i=n(22),a=n(50),s=n(14),u=i.createFactory(a.option.type),c=r.createClass({displayName:"ReactDOMOption",mixins:[o],componentWillMount:function(){"production"!==t.env.NODE_ENV&&("production"!==t.env.NODE_ENV?s(null==this.props.selected,"Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>."):null)},render:function(){return u(this.props,this.props.children)}});e.exports=c}).call(t,n(8))},function(e,t,n){"use strict";function o(){this.isMounted()&&(this.setState({value:this._pendingValue}),this._pendingValue=0)}function r(e,t,n){if(null!=e[t])if(e.multiple){if(!Array.isArray(e[t]))return new Error("The `"+t+"` prop supplied to <select> must be an array if `multiple` is true.")}else if(Array.isArray(e[t]))return new Error("The `"+t+"` prop supplied to <select> must be a scalar value if `multiple` is false.")}function i(e,t){var n,o,r,i=e.props.multiple,a=null!=t?t:e.state.value,s=e.getDOMNode().options;if(i)for(n={},o=0,r=a.length;o<r;++o)n[""+a[o]]=!0;else n=""+a;for(o=0,r=s.length;o<r;o++){var u=i?n.hasOwnProperty(s[o].value):s[o].value===n;u!==s[o].selected&&(s[o].selected=u)}}var a=n(119),s=n(124),u=n(60),c=n(35),l=n(22),p=n(50),d=n(31),f=n(24),h=l.createFactory(p.select.type),m=c.createClass({displayName:"ReactDOMSelect",mixins:[a,s.Mixin,u],propTypes:{defaultValue:r,value:r},getInitialState:function(){return{value:this.props.defaultValue||(this.props.multiple?[]:"")}},componentWillMount:function(){this._pendingValue=null},componentWillReceiveProps:function(e){!this.props.multiple&&e.multiple?this.setState({value:[this.state.value]}):this.props.multiple&&!e.multiple&&this.setState({value:this.state.value[0]})},render:function(){var e=f({},this.props);return e.onChange=this._handleChange,e.value=null,h(e,this.props.children)},componentDidMount:function(){i(this,s.getValue(this))},componentDidUpdate:function(e){var t=s.getValue(this),n=!!e.multiple,o=!!this.props.multiple;null==t&&n===o||i(this,t)},_handleChange:function(e){var t,n=s.getOnChange(this);n&&(t=n.call(this,e));var r;if(this.props.multiple){r=[];for(var i=e.target.options,a=0,u=i.length;a<u;a++)i[a].selected&&r.push(i[a].value)}else r=e.target.value;return this._pendingValue=r,d.asap(o,this),t}});e.exports=m},function(e,t,n){(function(t){"use strict";function o(){this.isMounted()&&this.forceUpdate()}var r=n(119),i=n(9),a=n(124),s=n(60),u=n(35),c=n(22),l=n(50),p=n(31),d=n(24),f=n(11),h=n(14),m=c.createFactory(l.textarea.type),v=u.createClass({displayName:"ReactDOMTextarea",mixins:[r,a.Mixin,s],getInitialState:function(){var e=this.props.defaultValue,n=this.props.children;null!=n&&("production"!==t.env.NODE_ENV&&("production"!==t.env.NODE_ENV?h(!1,"Use the `defaultValue` or `value` props instead of setting children on <textarea>."):null),"production"!==t.env.NODE_ENV?f(null==e,"If you supply `defaultValue` on a <textarea>, do not pass children."):f(null==e),Array.isArray(n)&&("production"!==t.env.NODE_ENV?f(n.length<=1,"<textarea> can only have at most one child."):f(n.length<=1),n=n[0]),e=""+n),null==e&&(e="");var o=a.getValue(this);return{initialValue:""+(null!=o?o:e)}},render:function(){var e=d({},this.props);return"production"!==t.env.NODE_ENV?f(null==e.dangerouslySetInnerHTML,"`dangerouslySetInnerHTML` does not make sense on <textarea>."):f(null==e.dangerouslySetInnerHTML),e.defaultValue=null,e.value=null,e.onChange=this._handleChange,m(e,this.state.initialValue)},componentDidUpdate:function(e,t,n){var o=a.getValue(this);if(null!=o){var r=this.getDOMNode();i.setValueForProperty(r,"value",""+o)}},_handleChange:function(e){var t,n=a.getOnChange(this);return n&&(t=n.call(this,e)),p.asap(o,this),t}});e.exports=v}).call(t,n(8))},function(e,t,n){"use strict";function o(e){var t=p.getID(e),n=l.getReactRootIDFromNodeID(t),o=p.findReactContainerForID(n),r=p.getFirstReactDOM(o);return r}function r(e,t){this.topLevelType=e,this.nativeEvent=t,this.ancestors=[]}function i(e){for(var t=p.getFirstReactDOM(h(e.nativeEvent))||window,n=t;n;)e.ancestors.push(n),n=o(n);for(var r=0,i=e.ancestors.length;r<i;r++){t=e.ancestors[r];var a=p.getID(t)||"";v._handleTopLevel(e.topLevelType,t,a,e.nativeEvent)}}function a(e){var t=m(window);e(t)}var s=n(130),u=n(54),c=n(20),l=n(26),p=n(61),d=n(31),f=n(24),h=n(85),m=n(69);f(r.prototype,{destructor:function(){this.topLevelType=null,this.nativeEvent=null,this.ancestors.length=0}}),c.addPoolingTo(r,c.twoArgumentPooler);var v={_enabled:!0,_handleTopLevel:null,WINDOW_HANDLE:u.canUseDOM?window:null,setHandleTopLevel:function(e){v._handleTopLevel=e},setEnabled:function(e){v._enabled=!!e},isEnabled:function(){return v._enabled},trapBubbledEvent:function(e,t,n){var o=n;if(o)return s.listen(o,t,v.dispatchEvent.bind(null,e))},trapCapturedEvent:function(e,t,n){var o=n;if(o)return s.capture(o,t,v.dispatchEvent.bind(null,e))},monitorScrollValue:function(e){var t=a.bind(null,e);s.listen(window,"scroll",t),s.listen(window,"resize",t)},dispatchEvent:function(e,t){if(v._enabled){var n=r.getPooled(e,t);try{d.batchedUpdates(i,n)}finally{r.release(n)}}}};e.exports=v},function(e,t,n){(function(t){var o=n(15),r={listen:function(e,t,n){return e.addEventListener?(e.addEventListener(t,n,!1),{remove:function(){e.removeEventListener(t,n,!1)}}):e.attachEvent?(e.attachEvent("on"+t,n),{remove:function(){e.detachEvent("on"+t,n)}}):void 0},capture:function(e,n,r){return e.addEventListener?(e.addEventListener(n,r,!0),{remove:function(){e.removeEventListener(n,r,!0)}}):("production"!==t.env.NODE_ENV&&console.error("Attempted to listen to events during the capture phase on a browser that does not support the capture phase. Your application will not receive some events."),{remove:o})},registerDefault:function(){}};e.exports=r}).call(t,n(8))},function(e,t,n){"use strict";var o=n(10),r=n(63),i=n(28),a=n(35),s=n(39),u=n(62),c=n(46),l=n(33),p=n(27),d=n(31),f={Component:i.injection,CompositeComponent:a.injection,DOMProperty:o.injection,EmptyComponent:s.injection,EventPluginHub:r.injection,EventEmitter:u.injection,NativeComponent:c.injection,Perf:l.injection,RootIndex:p.injection,Updates:d.injection};e.exports=f},function(e,t,n){"use strict";function o(e){if("selectionStart"in e&&s.hasSelectionCapabilities(e))return{start:e.selectionStart,end:e.selectionEnd};if(window.getSelection){var t=window.getSelection();return{anchorNode:t.anchorNode,anchorOffset:t.anchorOffset,focusNode:t.focusNode,focusOffset:t.focusOffset}}if(document.selection){var n=document.selection.createRange();return{parentElement:n.parentElement(),text:n.text,top:n.boundingTop,left:n.boundingLeft}}}function r(e){if(!g&&null!=m&&m==c()){var t=o(m);if(!y||!d(y,t)){y=t;var n=u.getPooled(h.select,v,e);return n.type="select",n.target=m,a.accumulateTwoPhaseDispatches(n),n}}}var i=n(17),a=n(82),s=n(90),u=n(84),c=n(95),l=n(87),p=n(47),d=n(133),f=i.topLevelTypes,h={select:{phasedRegistrationNames:{bubbled:p({onSelect:null}),captured:p({onSelectCapture:null})},dependencies:[f.topBlur,f.topContextMenu,f.topFocus,f.topKeyDown,f.topMouseDown,f.topMouseUp,f.topSelectionChange]}},m=null,v=null,y=null,g=!1,E={eventTypes:h,extractEvents:function(e,t,n,o){switch(e){case f.topFocus:(l(t)||"true"===t.contentEditable)&&(m=t,v=n,y=null);break;case f.topBlur:m=null,v=null,y=null;break;case f.topMouseDown:g=!0;break;case f.topContextMenu:case f.topMouseUp:return g=!1,r(o);case f.topSelectionChange:case f.topKeyDown:case f.topKeyUp:return r(o)}}};e.exports=E},function(e,t){"use strict";function n(e,t){if(e===t)return!0;var n;for(n in e)if(e.hasOwnProperty(n)&&(!t.hasOwnProperty(n)||e[n]!==t[n]))return!1;for(n in t)if(t.hasOwnProperty(n)&&!e.hasOwnProperty(n))return!1;return!0}e.exports=n},function(e,t){"use strict";var n=Math.pow(2,53),o={createReactRootIndex:function(){return Math.ceil(Math.random()*n)}};e.exports=o},function(e,t,n){(function(t){"use strict";var o=n(17),r=n(16),i=n(82),a=n(136),s=n(84),u=n(137),c=n(138),l=n(99),p=n(141),d=n(142),f=n(100),h=n(143),m=n(139),v=n(11),y=n(47),g=n(14),E=o.topLevelTypes,N={blur:{phasedRegistrationNames:{bubbled:y({onBlur:!0}),captured:y({onBlurCapture:!0})}},click:{phasedRegistrationNames:{bubbled:y({onClick:!0}),captured:y({onClickCapture:!0})}},contextMenu:{phasedRegistrationNames:{bubbled:y({onContextMenu:!0}),captured:y({onContextMenuCapture:!0})}},copy:{phasedRegistrationNames:{bubbled:y({onCopy:!0}),captured:y({onCopyCapture:!0})}},cut:{phasedRegistrationNames:{bubbled:y({onCut:!0}),captured:y({onCutCapture:!0})}},doubleClick:{phasedRegistrationNames:{bubbled:y({onDoubleClick:!0}),captured:y({onDoubleClickCapture:!0})}},drag:{phasedRegistrationNames:{bubbled:y({onDrag:!0}),captured:y({onDragCapture:!0})}},dragEnd:{phasedRegistrationNames:{bubbled:y({onDragEnd:!0}),captured:y({onDragEndCapture:!0})}},dragEnter:{phasedRegistrationNames:{bubbled:y({onDragEnter:!0}),captured:y({onDragEnterCapture:!0})}},dragExit:{phasedRegistrationNames:{bubbled:y({onDragExit:!0}),captured:y({onDragExitCapture:!0})}},dragLeave:{phasedRegistrationNames:{bubbled:y({onDragLeave:!0}),captured:y({onDragLeaveCapture:!0})}},dragOver:{phasedRegistrationNames:{bubbled:y({onDragOver:!0}),captured:y({onDragOverCapture:!0})}},dragStart:{phasedRegistrationNames:{bubbled:y({onDragStart:!0}),captured:y({onDragStartCapture:!0})}},drop:{phasedRegistrationNames:{bubbled:y({onDrop:!0}),captured:y({onDropCapture:!0})}},focus:{phasedRegistrationNames:{bubbled:y({onFocus:!0}),captured:y({onFocusCapture:!0})}},input:{phasedRegistrationNames:{bubbled:y({onInput:!0}),captured:y({onInputCapture:!0})}},keyDown:{phasedRegistrationNames:{bubbled:y({onKeyDown:!0}),captured:y({onKeyDownCapture:!0})}},keyPress:{phasedRegistrationNames:{bubbled:y({onKeyPress:!0}),captured:y({onKeyPressCapture:!0})}},keyUp:{phasedRegistrationNames:{bubbled:y({onKeyUp:!0}),captured:y({onKeyUpCapture:!0})}},load:{phasedRegistrationNames:{bubbled:y({onLoad:!0}),captured:y({onLoadCapture:!0})}},error:{phasedRegistrationNames:{bubbled:y({onError:!0}),captured:y({onErrorCapture:!0})}},mouseDown:{phasedRegistrationNames:{bubbled:y({onMouseDown:!0}),captured:y({onMouseDownCapture:!0})}},mouseMove:{phasedRegistrationNames:{bubbled:y({onMouseMove:!0}),captured:y({onMouseMoveCapture:!0})}},mouseOut:{phasedRegistrationNames:{bubbled:y({onMouseOut:!0}),captured:y({onMouseOutCapture:!0})}},mouseOver:{phasedRegistrationNames:{bubbled:y({onMouseOver:!0}),captured:y({onMouseOverCapture:!0})}},mouseUp:{phasedRegistrationNames:{bubbled:y({onMouseUp:!0}),captured:y({onMouseUpCapture:!0})}},paste:{phasedRegistrationNames:{bubbled:y({onPaste:!0}),captured:y({onPasteCapture:!0})}},reset:{phasedRegistrationNames:{bubbled:y({onReset:!0}),captured:y({onResetCapture:!0})}},scroll:{phasedRegistrationNames:{bubbled:y({onScroll:!0}),captured:y({onScrollCapture:!0})}},submit:{phasedRegistrationNames:{bubbled:y({onSubmit:!0}),captured:y({onSubmitCapture:!0})}},touchCancel:{phasedRegistrationNames:{bubbled:y({onTouchCancel:!0}),captured:y({onTouchCancelCapture:!0})}},touchEnd:{phasedRegistrationNames:{bubbled:y({onTouchEnd:!0}),captured:y({onTouchEndCapture:!0})}},touchMove:{phasedRegistrationNames:{bubbled:y({onTouchMove:!0}),captured:y({onTouchMoveCapture:!0})}},touchStart:{phasedRegistrationNames:{bubbled:y({onTouchStart:!0}),captured:y({onTouchStartCapture:!0})}},wheel:{phasedRegistrationNames:{bubbled:y({onWheel:!0}),captured:y({onWheelCapture:!0})}}},b={topBlur:N.blur,topClick:N.click,topContextMenu:N.contextMenu,topCopy:N.copy,topCut:N.cut,topDoubleClick:N.doubleClick,topDrag:N.drag,topDragEnd:N.dragEnd,topDragEnter:N.dragEnter,topDragExit:N.dragExit,topDragLeave:N.dragLeave,topDragOver:N.dragOver,topDragStart:N.dragStart,topDrop:N.drop,topError:N.error,topFocus:N.focus,topInput:N.input,topKeyDown:N.keyDown,topKeyPress:N.keyPress,topKeyUp:N.keyUp,topLoad:N.load,topMouseDown:N.mouseDown,topMouseMove:N.mouseMove,topMouseOut:N.mouseOut,topMouseOver:N.mouseOver,topMouseUp:N.mouseUp,topPaste:N.paste,topReset:N.reset,topScroll:N.scroll,topSubmit:N.submit,topTouchCancel:N.touchCancel,topTouchEnd:N.touchEnd,topTouchMove:N.touchMove,topTouchStart:N.touchStart,topWheel:N.wheel};for(var C in b)b[C].dependencies=[C];var _={eventTypes:N,executeDispatch:function(e,n,o){var i=r.executeDispatch(e,n,o);"production"!==t.env.NODE_ENV?g("boolean"!=typeof i,"Returning `false` from an event handler is deprecated and will be ignored in a future release. Instead, manually call e.stopPropagation() or e.preventDefault(), as appropriate."):null,i===!1&&(e.stopPropagation(),e.preventDefault())},extractEvents:function(e,n,o,r){var y=b[e];if(!y)return null;var g;switch(e){case E.topInput:case E.topLoad:case E.topError:case E.topReset:case E.topSubmit:g=s;break;case E.topKeyPress:if(0===m(r))return null;case E.topKeyDown:case E.topKeyUp:g=c;break;case E.topBlur:case E.topFocus:g=u;break;case E.topClick:if(2===r.button)return null;case E.topContextMenu:case E.topDoubleClick:case E.topMouseDown:case E.topMouseMove:case E.topMouseOut:case E.topMouseOver:case E.topMouseUp:g=l;break;case E.topDrag:case E.topDragEnd:case E.topDragEnter:case E.topDragExit:case E.topDragLeave:case E.topDragOver:case E.topDragStart:case E.topDrop:g=p;break;case E.topTouchCancel:case E.topTouchEnd:case E.topTouchMove:case E.topTouchStart:g=d;break;case E.topScroll:g=f;break;case E.topWheel:g=h;break;case E.topCopy:case E.topCut:case E.topPaste:g=a}"production"!==t.env.NODE_ENV?v(g,"SimpleEventPlugin: Unhandled event type, `%s`.",e):v(g);var N=g.getPooled(y,o,r);return i.accumulateTwoPhaseDispatches(N),N}};e.exports=_}).call(t,n(8))},function(e,t,n){"use strict";function o(e,t,n){r.call(this,e,t,n)}var r=n(84),i={clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}};r.augmentClass(o,i),e.exports=o},function(e,t,n){"use strict";function o(e,t,n){r.call(this,e,t,n)}var r=n(100),i={relatedTarget:null};r.augmentClass(o,i),e.exports=o},function(e,t,n){"use strict";function o(e,t,n){r.call(this,e,t,n)}var r=n(100),i=n(139),a=n(140),s=n(101),u={key:a,location:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,repeat:null,locale:null,getModifierState:s,charCode:function(e){return"keypress"===e.type?i(e):0},keyCode:function(e){return"keydown"===e.type||"keyup"===e.type?e.keyCode:0},which:function(e){return"keypress"===e.type?i(e):"keydown"===e.type||"keyup"===e.type?e.keyCode:0}};r.augmentClass(o,u),e.exports=o},function(e,t){"use strict";function n(e){var t,n=e.keyCode;return"charCode"in e?(t=e.charCode,0===t&&13===n&&(t=13)):t=n,t>=32||13===t?t:0}e.exports=n},function(e,t,n){"use strict";function o(e){if(e.key){var t=i[e.key]||e.key;if("Unidentified"!==t)return t}if("keypress"===e.type){var n=r(e);return 13===n?"Enter":String.fromCharCode(n)}return"keydown"===e.type||"keyup"===e.type?a[e.keyCode]||"Unidentified":""}var r=n(139),i={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},a={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"};e.exports=o},function(e,t,n){"use strict";function o(e,t,n){r.call(this,e,t,n)}var r=n(99),i={dataTransfer:null};r.augmentClass(o,i),e.exports=o},function(e,t,n){"use strict";function o(e,t,n){r.call(this,e,t,n)}var r=n(100),i=n(101),a={touches:null,targetTouches:null,changedTouches:null,altKey:null,metaKey:null,ctrlKey:null,shiftKey:null,getModifierState:i};r.augmentClass(o,a),e.exports=o},function(e,t,n){"use strict";function o(e,t,n){r.call(this,e,t,n)}var r=n(99),i={deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:null,deltaMode:null};r.augmentClass(o,i),e.exports=o},function(e,t,n){"use strict";var o=n(10),r=o.injection.MUST_USE_ATTRIBUTE,i={Properties:{cx:r,cy:r,d:r,dx:r,dy:r,fill:r,fillOpacity:r,fontFamily:r,fontSize:r,fx:r,fy:r,gradientTransform:r,gradientUnits:r,markerEnd:r,markerMid:r,markerStart:r,offset:r,opacity:r,patternContentUnits:r,patternUnits:r,points:r,preserveAspectRatio:r,r:r,rx:r,ry:r,spreadMethod:r,stopColor:r,stopOpacity:r,stroke:r,strokeDasharray:r,strokeLinecap:r,strokeOpacity:r,strokeWidth:r,textAnchor:r,transform:r,version:r,viewBox:r,x1:r,x2:r,x:r,y1:r,y2:r,y:r},DOMAttributeNames:{fillOpacity:"fill-opacity",fontFamily:"font-family",fontSize:"font-size",gradientTransform:"gradientTransform",gradientUnits:"gradientUnits",markerEnd:"marker-end",markerMid:"marker-mid",markerStart:"marker-start",patternContentUnits:"patternContentUnits",patternUnits:"patternUnits",preserveAspectRatio:"preserveAspectRatio",spreadMethod:"spreadMethod",stopColor:"stop-color",stopOpacity:"stop-opacity",strokeDasharray:"stroke-dasharray",strokeLinecap:"stroke-linecap",strokeOpacity:"stroke-opacity",strokeWidth:"stroke-width",textAnchor:"text-anchor",viewBox:"viewBox"}};e.exports=i},function(e,t,n){(function(t){"use strict";function o(e){var n=i.createFactory(e),o=r.createClass({displayName:"ReactFullPageComponent"+e,componentWillUnmount:function(){"production"!==t.env.NODE_ENV?a(!1,"%s tried to unmount. Because of cross-browser quirks it is impossible to unmount some top-level components (eg <html>, <head>, and <body>) reliably and efficiently. To fix this, have a single top-level component that never unmounts render these elements.",this.constructor.displayName):a(!1)},render:function(){return n(this.props)}});return o}var r=n(35),i=n(22),a=n(11);e.exports=o}).call(t,n(8))},function(e,t,n){"use strict";function o(e){return Math.floor(100*e)/100}function r(e,t,n){e[t]=(e[t]||0)+n}var i=n(10),a=n(147),s=n(61),u=n(33),c=n(148),l={_allMeasurements:[],_mountStack:[0],_injected:!1,start:function(){l._injected||u.injection.injectMeasure(l.measure),l._allMeasurements.length=0,u.enableMeasure=!0},stop:function(){u.enableMeasure=!1},getLastMeasurements:function(){return l._allMeasurements},printExclusive:function(e){e=e||l._allMeasurements;var t=a.getExclusiveSummary(e);console.table(t.map(function(e){return{"Component class name":e.componentName,"Total inclusive time (ms)":o(e.inclusive),"Exclusive mount time (ms)":o(e.exclusive),"Exclusive render time (ms)":o(e.render),"Mount time per instance (ms)":o(e.exclusive/e.count),"Render time per instance (ms)":o(e.render/e.count),Instances:e.count}}))},printInclusive:function(e){
19:e=e||l._allMeasurements;var t=a.getInclusiveSummary(e);console.table(t.map(function(e){return{"Owner > component":e.componentName,"Inclusive time (ms)":o(e.time),Instances:e.count}})),console.log("Total time:",a.getTotalTime(e).toFixed(2)+" ms")},getMeasurementsSummaryMap:function(e){var t=a.getInclusiveSummary(e,!0);return t.map(function(e){return{"Owner > component":e.componentName,"Wasted time (ms)":e.time,Instances:e.count}})},printWasted:function(e){e=e||l._allMeasurements,console.table(l.getMeasurementsSummaryMap(e)),console.log("Total time:",a.getTotalTime(e).toFixed(2)+" ms")},printDOM:function(e){e=e||l._allMeasurements;var t=a.getDOMSummary(e);console.table(t.map(function(e){var t={};return t[i.ID_ATTRIBUTE_NAME]=e.id,t.type=e.type,t.args=JSON.stringify(e.args),t})),console.log("Total time:",a.getTotalTime(e).toFixed(2)+" ms")},_recordWrite:function(e,t,n,o){var r=l._allMeasurements[l._allMeasurements.length-1].writes;r[e]=r[e]||[],r[e].push({type:t,time:n,args:o})},measure:function(e,t,n){return function(){for(var o=[],i=0,a=arguments.length;i<a;i++)o.push(arguments[i]);var u,p,d;if("_renderNewRootComponent"===t||"flushBatchedUpdates"===t)return l._allMeasurements.push({exclusive:{},inclusive:{},render:{},counts:{},writes:{},displayNames:{},totalTime:0}),d=c(),p=n.apply(this,o),l._allMeasurements[l._allMeasurements.length-1].totalTime=c()-d,p;if("ReactDOMIDOperations"===e||"ReactComponentBrowserEnvironment"===e){if(d=c(),p=n.apply(this,o),u=c()-d,"mountImageIntoNode"===t){var f=s.getID(o[1]);l._recordWrite(f,t,u,o[0])}else"dangerouslyProcessChildrenUpdates"===t?o[0].forEach(function(e){var t={};null!==e.fromIndex&&(t.fromIndex=e.fromIndex),null!==e.toIndex&&(t.toIndex=e.toIndex),null!==e.textContent&&(t.textContent=e.textContent),null!==e.markupIndex&&(t.markup=o[1][e.markupIndex]),l._recordWrite(e.parentID,e.type,u,t)}):l._recordWrite(o[0],t,u,Array.prototype.slice.call(o,1));return p}if("ReactCompositeComponent"!==e||"mountComponent"!==t&&"updateComponent"!==t&&"_renderValidatedComponent"!==t)return n.apply(this,o);var h="mountComponent"===t?o[0]:this._rootNodeID,m="_renderValidatedComponent"===t,v="mountComponent"===t,y=l._mountStack,g=l._allMeasurements[l._allMeasurements.length-1];if(m?r(g.counts,h,1):v&&y.push(0),d=c(),p=n.apply(this,o),u=c()-d,m)r(g.render,h,u);else if(v){var E=y.pop();y[y.length-1]+=u,r(g.exclusive,h,u-E),r(g.inclusive,h,u)}else r(g.inclusive,h,u);return g.displayNames[h]={current:this.constructor.displayName,owner:this._owner?this._owner.constructor.displayName:"<root>"},p}}};e.exports=l},function(e,t,n){function o(e){for(var t=0,n=0;n<e.length;n++){var o=e[n];t+=o.totalTime}return t}function r(e){for(var t=[],n=0;n<e.length;n++){var o,r=e[n];for(o in r.writes)r.writes[o].forEach(function(e){t.push({id:o,type:l[e.type]||e.type,args:e.args})})}return t}function i(e){for(var t,n={},o=0;o<e.length;o++){var r=e[o],i=u({},r.exclusive,r.inclusive);for(var a in i)t=r.displayNames[a].current,n[t]=n[t]||{componentName:t,inclusive:0,exclusive:0,render:0,count:0},r.render[a]&&(n[t].render+=r.render[a]),r.exclusive[a]&&(n[t].exclusive+=r.exclusive[a]),r.inclusive[a]&&(n[t].inclusive+=r.inclusive[a]),r.counts[a]&&(n[t].count+=r.counts[a])}var s=[];for(t in n)n[t].exclusive>=c&&s.push(n[t]);return s.sort(function(e,t){return t.exclusive-e.exclusive}),s}function a(e,t){for(var n,o={},r=0;r<e.length;r++){var i,a=e[r],l=u({},a.exclusive,a.inclusive);t&&(i=s(a));for(var p in l)if(!t||i[p]){var d=a.displayNames[p];n=d.owner+" > "+d.current,o[n]=o[n]||{componentName:n,time:0,count:0},a.inclusive[p]&&(o[n].time+=a.inclusive[p]),a.counts[p]&&(o[n].count+=a.counts[p])}}var f=[];for(n in o)o[n].time>=c&&f.push(o[n]);return f.sort(function(e,t){return t.time-e.time}),f}function s(e){var t={},n=Object.keys(e.writes),o=u({},e.exclusive,e.inclusive);for(var r in o){for(var i=!1,a=0;a<n.length;a++)if(0===n[a].indexOf(r)){i=!0;break}!i&&e.counts[r]>0&&(t[r]=!0)}return t}var u=n(24),c=1.2,l={mountImageIntoNode:"set innerHTML",INSERT_MARKUP:"set innerHTML",MOVE_EXISTING:"move",REMOVE_NODE:"remove",TEXT_CONTENT:"set textContent",updatePropertyByID:"update attribute",deletePropertyByID:"delete attribute",updateStylesByID:"update styles",updateInnerHTMLByID:"set innerHTML",dangerouslyReplaceNodeWithMarkupByID:"replace"},p={getExclusiveSummary:i,getInclusiveSummary:a,getDOMSummary:r,getTotalTime:o};e.exports=p},function(e,t,n){var o=n(149);o&&o.now||(o=Date);var r=o.now.bind(o);e.exports=r},function(e,t,n){"use strict";var o,r=n(54);r.canUseDOM&&(o=window.performance||window.msPerformance||window.webkitPerformance),e.exports=o||{}},function(e,t,n){(function(t){"use strict";function o(e){"production"!==t.env.NODE_ENV?l(i.isValidElement(e),"renderToString(): You must pass a valid ReactElement."):l(i.isValidElement(e));var n;try{var o=a.createReactRootID();return n=u.getPooled(!1),n.perform(function(){var t=c(e,null),r=t.mountComponent(o,n,0);return s.addChecksumToMarkup(r)},null)}finally{u.release(n)}}function r(e){"production"!==t.env.NODE_ENV?l(i.isValidElement(e),"renderToStaticMarkup(): You must pass a valid ReactElement."):l(i.isValidElement(e));var n;try{var o=a.createReactRootID();return n=u.getPooled(!0),n.perform(function(){var t=c(e,null);return t.mountComponent(o,n,0)},null)}finally{u.release(n)}}var i=n(22),a=n(26),s=n(113),u=n(151),c=n(45),l=n(11);e.exports={renderToString:o,renderToStaticMarkup:r}}).call(t,n(8))},function(e,t,n){"use strict";function o(e){this.reinitializeTransaction(),this.renderToStaticMarkup=e,this.reactMountReady=i.getPooled(null),this.putListenerQueue=a.getPooled()}var r=n(20),i=n(32),a=n(116),s=n(34),u=n(24),c=n(15),l={initialize:function(){this.reactMountReady.reset()},close:c},p={initialize:function(){this.putListenerQueue.reset()},close:c},d=[p,l],f={getTransactionWrappers:function(){return d},getReactMountReady:function(){return this.reactMountReady},getPutListenerQueue:function(){return this.putListenerQueue},destructor:function(){i.release(this.reactMountReady),this.reactMountReady=null,a.release(this.putListenerQueue),this.putListenerQueue=null}};u(o.prototype,s.Mixin,f),r.addPoolingTo(o),e.exports=o},function(e,t,n){(function(t){"use strict";function o(e){return"production"!==t.env.NODE_ENV?i(r.isValidElement(e),"onlyChild must be passed a children with exactly one child."):i(r.isValidElement(e)),e}var r=n(22),i=n(11);e.exports=o}).call(t,n(8))},function(e,t,n){"use strict";function o(){}var r=n(6),i=n(154).copy,a=n(154).copyList,s=n(154).copyKeys,u=n(154).copyExceptKeys,c=n(161),l=n(178),p=r.createFactory(c),d=r.createFactory(l),f=n(177),h=r.createClass({displayName:"TabPanel",propTypes:{activeIndex:r.PropTypes.number,activeStyle:r.PropTypes.object,activeClassName:r.PropTypes.string,defaultStyle:r.PropTypes.object,defaultClassName:r.PropTypes.string,titleStyle:r.PropTypes.object,titleClassName:r.PropTypes.string,activeTitleStyle:r.PropTypes.object,activeTitleClassName:r.PropTypes.string,onChange:r.PropTypes.func,stripListStyle:r.PropTypes.object,stripFactory:r.PropTypes.func,containerFactory:r.PropTypes.func,tabVerticalPosition:r.PropTypes.string},getDefaultProps:function(){return{activeIndex:0,activeStyle:{},activeClassName:"active",defaultStyle:{},defaultClassName:"",titleStyle:{},titleClassName:"",activeTitleStyle:{},activeTitleClassName:"active",tabVerticalPosition:"top"}},render:function(){var e=i(this.props);e.children=e.children||[];var t=e.activeIndex||0;e.activeIndex=Math.min(t,e.children.length-1),e.className=e.className||"",e.className+=" "+f;var n=this.renderStrip(e),o=this.renderContainer(e),a="bottom"==e.tabVerticalPosition?[o,n]:[n,o],s={className:e.className,style:e.style};return r.createElement("div",r.__spread({},s),a)},renderContainer:function(e){var t=a(e,["activeIndex","activeClassName","activeStyle","defaultStyle","defaultClassName","hiddenStyle","children"]);return t.key="container",e.containerFactory?e.containerFactory(t,d):d(t)},renderStrip:function(e){var t=u(e,{},{stripStyle:1,activeTitleStyle:1,activeTitleClassName:1});return s(e,t,{stripStyle:"style",activeTitleStyle:"activeStyle",activeTitleClassName:"activeClassName"}),t.key="strip",t.onChange=this.handleChange||o,e.stripFactory?e.stripFactory(t,p):p(t)},handleChange:function(e){this.props.onChange(e)}});h.Strip=c,h.Container=l,e.exports=h},function(e,t,n){e.exports=function(){"use strict";var e=Object.prototype.hasOwnProperty,t="object",o="undefined";return{copy:n(155),copyIf:n(156),copyAs:function(n,o){var r={};if(o=o||1,null!=n&&typeof n===t)for(var i in n)e.call(n,i)&&(r[i]=o);return r},copyList:n(157),copyListIf:n(158),copyKeys:n(159),copyKeysIf:n(160),copyExceptKeys:function(n,o,r){if(o=o||{},r=r||{},null!=n&&typeof n===t)for(var i in n)e.call(n,i)&&!e.call(r,i)&&(o[i]=n[i]);return o},bindCopyKeys:function(n,r,i){if(2==arguments.length&&(i=r,r=null),r=r||{},null!=n&&typeof n===t&&null!=i&&typeof i===t){var a,s,u,c;for(var l in i)e.call(i,l)&&(s=i[l],a=typeof s,c=n[l],u=typeof c,u!==o&&(r["string"==a?s:l]="function"==u?c.bind(n):c))}return r}}}()},function(e,t){"use strict";var n=Object.prototype.hasOwnProperty,o="object";e.exports=function(e,t){if(t=t||{},null!=e&&typeof e===o)for(var r in e)n.call(e,r)&&(t[r]=e[r]);return t}},function(e,t){"use strict";var n=Object.prototype.hasOwnProperty,o="object",r="undefined";e.exports=function(e,t){if(t=t||{},null!=e&&typeof e===o)for(var i in e)n.call(e,i)&&typeof t[i]===r&&(t[i]=e[i]);return t}},function(e,t){"use strict";var n="undefined";e.exports=function(e,t,o){arguments.length<3&&(o=t,t=null),t=t||{},o=o||Object.keys(e);for(var r,i=0,a=o.length;i<a;i++)r=o[i],typeof e[r]!==n&&(t[o[i]]=e[o[i]]);return t}},function(e,t){"use strict";var n="undefined";e.exports=function(e,t,o){arguments.length<3&&(o=t,t=null),t=t||{},o=o||Object.keys(e);for(var r,i=0,a=o.length;i<a;i++)r=o[i],typeof e[r]!==n&&typeof t[r]===n&&(t[r]=e[r]);return t}},function(e,t,n){"use strict";var o="undefined",r="object",i=Object.prototype.hasOwnProperty,a=n(157);e.exports=function(e,t,n){if(arguments.length<3&&(n=t,t=null),t=t||{},!n||Array.isArray(n))return a(e,t,n);if(null!=e&&typeof e===r&&null!=n&&typeof n===r){var s,u;for(var c in n)i.call(n,c)&&(u=n[c],s=typeof u,typeof e[c]!==o&&(t["string"==s?u:c]=e[c]))}return t}},function(e,t,n){"use strict";var o="undefined",r="object",i=Object.prototype.hasOwnProperty,a=n(158);e.exports=function(e,t,n){if(arguments.length<3&&(n=t,t=null),t=t||{},!n||Array.isArray(n))return a(e,t,n);if(null!=e&&typeof e===r&&null!=n&&typeof n===r){var s,u,c;for(var l in n)i.call(n,l)&&(u=n[l],s=typeof u,c="string"==s?u:l,typeof e[l]!==o&&typeof t[c]===o&&(t[c]=e[l]))}return t}},function(e,t,n){"use strict";function o(e){e.preventDefault(),e.stopPropagation()}var r=n(6),i=n(154).copy,a=n(162),s=a.buffer,u=n(177),c={display:"inline-block"},l={margin:0,padding:0,listStyle:"none",position:"relative",display:"inline-block"},p={top:0,position:"absolute",height:"100%",cursor:"pointer"},d=r.createClass({displayName:"Scroller",display:"Scroller",getDefaultProps:function(){return{width:5}},render:function(){var e=this.props,t=this.props.side;e.className=e.className||"",e.className+=" "+u+"-scroller "+t,e.active&&e.visible&&(e.className+=" active");var n=i(p);return e.style=i(e.style,n),e.style.width=e.style.width||e.width,e.style[t]=0,e.visible||(e.style.display="none"),e.factory?e.factory(e,t):r.createElement("div",r.__spread({},e))}}),f=r.createFactory(d);e.exports=r.createClass({displayName:"exports",display:"TabPanel.Strip",propTypes:{activeIndex:r.PropTypes.number,activeStyle:r.PropTypes.object,activeClassName:r.PropTypes.string,titleStyle:r.PropTypes.object,titleClassName:r.PropTypes.string,anchorStyle:r.PropTypes.object,scrollerStyle:r.PropTypes.object,scrollerProps:r.PropTypes.object,scrollerWidth:r.PropTypes.number,scrollStep:r.PropTypes.number,scrollSpeed:r.PropTypes.number},getInitialState:function(){return{adjustScroll:!0,scrollPos:0}},componentWillUnmount:function(){this.props.enableScroll&&window.removeEventListener("resize",this.onResizeListener)},componentDidMount:function(){this.props.enableScroll&&setTimeout(function(){this.adjustScroll(),window.addEventListener("resize",this.onResizeListener=s(this.onWindowResize,this.props.onWindowResizeBuffer,this))}.bind(this),0)},componentDidUpdate:function(){this.props.enableScroll&&this.adjustScroll()},onWindowResize:function(){this.adjustScroll(),this.doScroll(0)},adjustScroll:function(){if(this.props.enableScroll){if(!this.state.adjustScroll)return void(this.state.adjustScroll=!0);var e=this.getAvailableStripWidth(),t=this.getCurrentListWidth(),n={adjustScroll:!1,hasLeftScroll:!1,hasRightScroll:!1};t>e?(n.maxScrollPos=t-e,n.hasLeftScroll=0!==this.state.scrollPos,n.hasRightScroll=this.state.scrollPos!=n.maxScrollPos):(n.maxScrollPos=0,n.scrollPos=0),this.setState(n)}},getCurrentListWidth:function(){return this.refs.list.getDOMNode().offsetWidth},getAvailableStripWidth:function(){var e=this.getDOMNode(),t=window.getComputedStyle(e),n=parseInt(t.left,10),o=parseInt(t.right,10);return isNaN(n)&&(n=0),isNaN(o)&&(o=0),e.clientWidth-n-o},handleScrollLeft:function(e){e.preventDefault(),this.handleScroll(-1)},handleScrollRight:function(e){e.preventDefault(),this.handleScroll(1)},handleScrollLeftMax:function(e){o(e),this.handleScrollMax(-1)},handleScrollRightMax:function(e){o(e),this.handleScrollMax(1)},handleScrollMax:function(e){var t=e==-1?0:this.state.maxScrollPos;this.setScrollPosition(t)},handleScroll:function(e){var t=function(){this.stopScroll(),window.removeEventListener("mouseup",t)}.bind(this);window.addEventListener("mouseup",t),this.scrollInterval=setInterval(this.doScroll.bind(this,e),this.props.scrollSpeed)},doScroll:function(e){this.setState({scrollDirection:e});var t=this.state.scrollPos+e*this.props.scrollStep;this.setScrollPosition(t)},setScrollPosition:function(e){e>this.state.maxScrollPos&&(e=this.state.maxScrollPos),e<0&&(e=0),this.setState({scrollPos:e,scrolling:!0})},stopScroll:function(){clearInterval(this.scrollInterval),this.setState({scrolling:!1})},getDefaultProps:function(){return{onWindowResizeBuffer:50,scrollStep:5,scrollSpeed:50,scrollerWidth:8,scrollerProps:{},enableScroll:!1,hasLeftScroll:!1,hasRightScroll:!1,activeClassName:"",activeStyle:{},anchorStyle:{color:"inherit",textDecoration:"inherit"}}},renderTitle:a.curry(function(e,t,n,o,a){var s=e.anchorStyle,u=e.activeStyle,c=e.activeClassName,l=e.activeIndex||0,p=o.props,d=p.tabTitle||p.title;n=i(n),i(p.titleStyle,n);var f=t.concat(p.titleClassName||"");return a==l&&(i(u,n),f.push(c||"")),r.createElement("li",{key:a,onClick:this.handleChange.bind(this,a),style:n,className:f.join(" ")},r.createElement("a",{href:"#",style:s},d))}),render:function(){var e=i(this.props),t=i(c);i(e.titleStyle,t);var n=[e.titleClassName||"",u+"-item-title"],o=r.Children.map(e.children,this.renderTitle(e,n,t),this);e.className=e.className||"",e.className+=" "+u+"-strip",e.style=e.style||{},e.style.position="relative";var a=i(l);this.state.scrollPos&&(a.left=-this.state.scrollPos);var s=this.renderScroller(-1),p=this.renderScroller(1);return r.createElement("nav",r.__spread({},e),r.createElement("ul",{ref:"list",style:a},o),s,p)},handleChange:function(e,t){t.preventDefault(),this.props.onChange(e)},renderScroller:function(e){if(this.props.enableScroll){var t=e==-1?this.handleScrollLeftMax:this.handleScrollRightMax,n=e==-1?this.handleScrollLeft:this.handleScrollRight,o=e==-1?"left":"right",r=e==-1?this.state.hasLeftScroll:this.state.hasRightScroll;return f(i(this.props.scrollerProps,{factory:this.props.scrollerFactory,active:this.state.scrollDirection==e&&this.state.scrolling,onDoubleClick:t,onMouseDown:n,style:this.props.scrollerStyle,side:o,width:this.props.scrollerWidth,visible:r}))}}})},function(e,t,n){var o=function(e){setTimeout(e,0)},r=clearTimeout,i=Array.prototype.slice,a=n(163),s=function(e,t,n){if(n="function"==typeof n?n:function(e,t,n){return e},Array.isArray(t)){for(var o,r=0,i=t.length;r<i;r++)if(o=t[r],e(o,r,t))return n(o,r,t)}else if("object"==typeof t)for(var a,o,s=Object.keys(t),r=0,i=s.length;r<i;r++)if(a=s[r],o=t[a],e(o,a,t))return n(o,a,t)},u=a(s,2),c=a(function(e,t){return s(e,t,function(e,t){return t})}),l=function(e){return Object.keys(e).forEach(function(t){"function"==typeof e[t]&&(e[t]=e[t].bind(e))}),e},p=n(164),d=n(165),f=n(166),h=n(167),m=n(168),v=n(169),y=n(170),g=function(e,t){return function(){var n=i.call(arguments,t||0);return e.apply(this,n)}},E=function(e,t,n){return function(){var o=[].from(arguments),r={stop:!1};n&&o.push(r);var i=t.apply(this,o);if(n){if(r.stop===!0)return i}else if(i===!1)return i;return e.apply(this,arguments)}},N=function(e,t,n){var r=1*t==t;return 2!=arguments.length||r?r||(t=0):(n=t,t=0),function(){var r=n||this,i=arguments;return t<0?void e.apply(r,i):void(t||!o?setTimeout(function(){e.apply(r,i)},t):o(function(){e.apply(r,i)}))}},b=function(e,t){return N(e,0,t)},C=function(e,t,n){var i=-1;return function(){var a=n||this,s=arguments;if(t<0)return void e.apply(a,s);var u=t||!o,c=u?clearTimeout:r,l=u?setTimeout:o;i!==-1&&c(i),i=l(function(){e.apply(a,s),a=null},t)}},_=function(e,t,n){var o,r,i=-1;return function(){o=n||this,r=arguments,i!==-1||(i=setTimeout(function(){e.apply(o,r),o=null,i=-1},t))}},D=function(e,t,n){var o,r,i=-1,a=0,s=0,u={},c=!0;return r=o=function(){var l=arguments,p=n||this;c&&(u[a++]={args:l,scope:p}),i!==-1||(i=setTimeout(function(){e.apply(p,l),i=-1,s++,a!==s?(r=h(o,u[s].args).bind(u[s].scope),delete u[s],c=!1,r.apply(p),c=!0):u={}},t))}};e.exports={map:n(171),dot:n(172),maxArgs:n(173),compose:p,self:function(e){return e},buffer:C,delay:N,defer:b,skipArgs:g,intercept:function(e,t,n){return E(t,e,n)},throttle:_,spread:D,chain:function(e,t,n){return d(t,n,e)},before:function(e,t){return d("before",t,e)},after:function(e,t){return d("after",t,e)},curry:a,once:f,bindArgs:m,bindArgsArray:h,lockArgs:y,lockArgsArray:v,bindFunctionsOf:l,find:u,findIndex:c,newify:n(174)}},function(e,t){"use strict";function n(e,t){function n(o){function r(){var r=arguments.length,i=[].concat(o);return r&&i.push.apply(i,arguments),i.length<t?n(i):e.apply(this,i)}return r}return"number"!=typeof t&&(t=e.length),n([])}e.exports=n},function(e,t){"use strict";function n(e,t){return function(){return e(t.apply(this,arguments))}}e.exports=function(){for(var e=arguments,t=e.length,o=0,r=e[0];++o<t;)r=n(r,e[o]);return r}},function(e,t){"use strict";function n(e,t,n){return function(){"before"===e&&n.apply(this,arguments);var o=t.apply(this,arguments);return"before"!==e&&n.apply(this,arguments),o}}e.exports=n},function(e,t){"use once";function n(e,t){var n,o;return function(){return n?o:(n=!0,o=e.apply(t||this,arguments))}}e.exports=n},function(e,t){"use strict";var n=Array.prototype.slice;e.exports=function(e,t){return function(){var o=n.call(t||[]);return arguments.length&&o.push.apply(o,arguments),e.apply(this,o)}}},function(e,t,n){"use strict";var o=Array.prototype.slice,r=n(167);e.exports=function(e){return r(e,o.call(arguments,1))}},function(e,t){"use strict";var n=Array.prototype.slice;e.exports=function(e,t){return function(){return Array.isArray(t)||(t=n.call(t||[])),e.apply(this,t)}}},function(e,t,n){"use strict";var o=Array.prototype.slice,r=n(169);e.exports=function(e){return r(e,o.call(arguments,1))}},function(e,t,n){"use strict";var o=n(163);e.exports=o(function(e,t){return void 0==t||(t.map,0)?e(t):t.map(e)})},function(e,t,n){"use strict";var o=n(163);e.exports=o(function(e,t){return void 0!=t?t[e]:void 0})},function(e,t,n){"use strict";var o=Array.prototype.slice;n(163);e.exports=function(e,t){return function(){return e.apply(this,o.call(arguments,0,t))}}},function(e,t,n){"use strict";var o=n(175),r=n(163);e.exports=r(o)},function(e,t,n){var o=n(176);e.exports=function(e,t){return o(t.length)(e,t)}},function(e,t){e.exports=function(){"use strict";var e={};return function(t){if(!e[t]){for(var n=[],o=0;o<t;o++)n.push("a["+o+"]");e[t]=new Function("c","a","return new c("+n.join(",")+")")}return e[t]}}()},function(e,t){e.exports="basic-tabs"},function(e,t,n){"use strict";var o=n(6),r=n(154).copy,i=n(177);e.exports=o.createClass({displayName:"TabPanel.Container",propTypes:{activeIndex:o.PropTypes.number,defaultClassName:o.PropTypes.string,defaultStyle:o.PropTypes.object,hiddenStyle:o.PropTypes.object,activeClassName:o.PropTypes.string,activeStyle:o.PropTypes.object},getDefaultProps:function(){return{activeIndex:0,hiddenStyle:{display:"none"}}},render:function(){return o.createElement("section",{className:i+"-container"},o.Children.map(this.props.children,this.renderItem,this))},renderItem:function(e,t,n){var a=this.props,s=a.hiddenStyle,u=a.activeIndex||0,c={},l=i+"-item ";return t!==u?r(s,c):(r(a.activeStyle,c),l+=a.activeClassName||""),a.defaultStyle&&(e.props.style=r(a.defaultStyle,e.props.style)),a.defaultClassName&&(e.props.className=e.props.className||"",e.props.className+=" "+a.defaultClassName),o.createElement("article",{key:t,style:c,className:l},e)}})},function(e,t,n){function o(e,t){var n={}.hasOwnProperty;for(var o in t)n.call(t,o)&&(e[o]=t[o]);return e}var r,i,a="undefined"!=typeof t&&t||this,s="".replace;r=n(180),a.HackFoldr=i=function(){function e(e){this.base=e,this.base=s.call(this.base,/\/+$/,"")}e.displayName="HackFoldr";e.prototype;return e.prototype.fetch=function(e,t){var n=this;return this.id=e,r.get(this.base+"/_/"+this.id+"/csv.json",function(e){var o,r,i,a,s,u,c,l,p;if(null!=(o=e.body)&&o.length){for(e.body.shift(),r=[],i=0,s=(a=e.body).length;i<s;++i)u=i,c=a[i],l=c[0],p=c[1],l&&!/^#/.test(l)&&(p=p?p:"Sheet"+(u+1))&&r.push({link:l,title:p,row:u+2});n.rows=r}else n.wasNonExistent=!0;return null!=(a=n.rows)&&a.length?"function"==typeof t?t(n.rows):void 0:(n.wasEmpty=!0,"function"==typeof t?t(n.rows=[],n.push({link:"/"+n.id+".1",title:"Sheet1"}),t(n)):void 0)})},e.prototype.size=function(){return this.rows.length},e.prototype.lastIndex=function(){return this.rows.length-1},e.prototype.lastRow=function(){var e;return this.rows.length?(e=this.rows)[e.length-1]:{}},e.prototype.links=function(){var e,t,n,o,r=[];for(e=0,n=(t=this.rows).length;e<n;++e)o=t[e].link,r.push(o);return r},e.prototype.titles=function(){var e,t,n,o,r=[];for(e=0,n=(t=this.rows).length;e<n;++e)o=t[e].title,r.push(o);return r},e.prototype.at=function(e){var t;return null!=(t=this.rows[e])?t:{}},e.prototype.push=function(e){var t=this;return this.init(e,function(){return t.postCsv(e.link,e.title,function(t){var n,o;if(/paste A(\d+) all/.exec(null!=t&&null!=(n=t.body)&&null!=(o=n.command)?o[1]:void 0))return e.row=parseInt(RegExp.$1)})}),this.rows.push(e),this},e.prototype.setAt=function(e,t){var n;return t.title&&(n=this.rows[e].row,this.sendCmd("set B"+n+" text t "+t.title)),o(this.rows[e],t),this},e.prototype.deleteAt=function(e){var t;return t=this.rows[e].row,this.sendCmd("set A"+t+":B"+t+" empty multi-cascade"),this.rows.splice(e,1),this},e.prototype.sendCmd=function(e,t){var n=this;return null==t&&(t=function(){}),this.init(null,function(){return r.post(n.base+"/_/"+n.id).type("text/plain").send(e).end(function(){})})},e.prototype.init=function(e,t){return this.wasNonExistent?(null!=e&&(e.row=2),this.wasNonExistent=!1,this.wasEmpty=!1,e?this.postInitCsv("#url","#title","/"+this.id+".1","Sheet1",e.link,e.title,t):this.postRawCsv("#url","#title","/"+this.id+".1","Sheet1",t)):this.wasEmpty?(null!=e&&(e.row=2),this.wasEmpty=!1,e?this.postRawCsv("/"+this.id+".1","Sheet1",e.link,e.title,t):this.postCsv("/"+this.id+".1","Sheet1",t)):t()},e.prototype.postCsv=function(e,t,n){return null==e&&(e=""),null==t&&(t=""),r.post(this.base+"/_/"+this.id).type("text/csv").accept("application/json").send('"'+e.replace(/"/g,'""')+'","'+t.replace(/"/g,'""')+'"').end(function(e){return"function"==typeof n?n(e):void 0})},e.prototype.postRawCsv=function(e,t,n,o,i){return null==e&&(e=""),null==t&&(t=""),null==n&&(n=""),null==o&&(o=""),r.post(this.base+"/_/"+this.id).type("text/csv").accept("application/json").send('"'+e.replace(/"/g,'""')+'","'+t.replace(/"/g,'""')+'"\n"'+n.replace(/"/g,'""')+'","'+o.replace(/"/g,'""')+'"').end(function(e){return"function"==typeof i?i(e):void 0})},e.prototype.postInitCsv=function(e,t,n,o,i,a,s){return null==e&&(e=""),null==t&&(t=""),null==n&&(n=""),null==o&&(o=""),null==i&&(i=""),null==a&&(a=""),r.post(this.base+"/_/"+this.id).type("text/csv").accept("application/json").send('"'+e.replace(/"/g,'""')+'","'+t.replace(/"/g,'""')+'"\n"'+n.replace(/"/g,'""')+'","'+o.replace(/"/g,'""')+'"\n"'+i.replace(/"/g,'""')+'","'+a.replace(/"/g,'""')+'"').end(function(e){return"function"==typeof s?s(e):void 0})},e}()},function(e,t,n){function o(){}function r(e){var t={}.toString.call(e);switch(t){case"[object File]":case"[object Blob]":case"[object FormData]":return!0;default:return!1}}function i(){if(y.XMLHttpRequest&&("file:"!=y.location.protocol||!y.ActiveXObject))return new XMLHttpRequest;try{return new ActiveXObject("Microsoft.XMLHTTP")}catch(e){}try{return new ActiveXObject("Msxml2.XMLHTTP.6.0")}catch(e){}try{return new ActiveXObject("Msxml2.XMLHTTP.3.0")}catch(e){}try{return new ActiveXObject("Msxml2.XMLHTTP")}catch(e){}return!1}function a(e){return e===Object(e)}function s(e){if(!a(e))return e;var t=[];for(var n in e)null!=e[n]&&t.push(encodeURIComponent(n)+"="+encodeURIComponent(e[n]));return t.join("&")}function u(e){for(var t,n,o={},r=e.split("&"),i=0,a=r.length;i<a;++i)n=r[i],t=n.split("="),o[decodeURIComponent(t[0])]=decodeURIComponent(t[1]);return o}function c(e){var t,n,o,r,i=e.split(/\r?\n/),a={};i.pop();for(var s=0,u=i.length;s<u;++s)n=i[s],t=n.indexOf(":"),o=n.slice(0,t).toLowerCase(),r=g(n.slice(t+1)),a[o]=r;return a}function l(e){return e.split(/ *; */).shift()}function p(e){return v(e.split(/ *; */),function(e,t){var n=t.split(/ *= */),o=n.shift(),r=n.shift();return o&&r&&(e[o]=r),e},{})}function d(e,t){t=t||{},this.req=e,this.xhr=this.req.xhr,this.text="HEAD"!=this.req.method?this.xhr.responseText:null,this.setStatusProperties(this.xhr.status),this.header=this.headers=c(this.xhr.getAllResponseHeaders()),this.header["content-type"]=this.xhr.getResponseHeader("content-type"),this.setHeaderProperties(this.header),this.body="HEAD"!=this.req.method?this.parseBody(this.text):null}function f(e,t){var n=this;m.call(this),this._query=this._query||[],this.method=e,this.url=t,this.header={},this._header={},this.on("end",function(){var e=null,t=null;try{t=new d(n)}catch(t){e=new Error("Parser is unable to parse the response"),e.parse=!0,e.original=t}n.callback(e,t)})}function h(e,t){return"function"==typeof t?new f("GET",e).end(t):1==arguments.length?new f("GET",e):new f(e,t)}var m=n(181),v=n(182),y="undefined"==typeof window?this:window,g="".trim?function(e){return e.trim()}:function(e){return e.replace(/(^\s*|\s*$)/g,"")};h.serializeObject=s,h.parseString=u,h.types={html:"text/html",json:"application/json",xml:"application/xml",urlencoded:"application/x-www-form-urlencoded",form:"application/x-www-form-urlencoded","form-data":"application/x-www-form-urlencoded"},h.serialize={"application/x-www-form-urlencoded":s,"application/json":JSON.stringify},h.parse={"application/x-www-form-urlencoded":u,"application/json":JSON.parse},d.prototype.get=function(e){return this.header[e.toLowerCase()]},d.prototype.setHeaderProperties=function(e){var t=this.header["content-type"]||"";this.type=l(t);var n=p(t);for(var o in n)this[o]=n[o]},d.prototype.parseBody=function(e){var t=h.parse[this.type];return t&&e&&e.length?t(e):null},d.prototype.setStatusProperties=function(e){var t=e/100|0;this.status=e,this.statusType=t,this.info=1==t,this.ok=2==t,this.clientError=4==t,this.serverError=5==t,this.error=(4==t||5==t)&&this.toError(),this.accepted=202==e,this.noContent=204==e||1223==e,this.badRequest=400==e,this.unauthorized=401==e,this.notAcceptable=406==e,this.notFound=404==e,this.forbidden=403==e},d.prototype.toError=function(){var e=this.req,t=e.method,n=e.url,o="cannot "+t+" "+n+" ("+this.status+")",r=new Error(o);return r.status=this.status,r.method=t,r.url=n,r},h.Response=d,m(f.prototype),f.prototype.use=function(e){return e(this),this},f.prototype.timeout=function(e){return this._timeout=e,this},f.prototype.clearTimeout=function(){return this._timeout=0,clearTimeout(this._timer),this},f.prototype.abort=function(){if(!this.aborted)return this.aborted=!0,this.xhr.abort(),this.clearTimeout(),this.emit("abort"),this},f.prototype.set=function(e,t){if(a(e)){for(var n in e)this.set(n,e[n]);return this}return this._header[e.toLowerCase()]=t,this.header[e]=t,this},f.prototype.unset=function(e){return delete this._header[e.toLowerCase()],delete this.header[e],this},f.prototype.getHeader=function(e){return this._header[e.toLowerCase()]},f.prototype.type=function(e){return this.set("Content-Type",h.types[e]||e),this},f.prototype.accept=function(e){return this.set("Accept",h.types[e]||e),this},f.prototype.auth=function(e,t){var n=btoa(e+":"+t);return this.set("Authorization","Basic "+n),this},f.prototype.query=function(e){return"string"!=typeof e&&(e=s(e)),e&&this._query.push(e),this},f.prototype.field=function(e,t){return this._formData||(this._formData=new FormData),this._formData.append(e,t),this},f.prototype.attach=function(e,t,n){return this._formData||(this._formData=new FormData),this._formData.append(e,t,n),this},f.prototype.send=function(e){var t=a(e),n=this.getHeader("Content-Type");if(t&&a(this._data))for(var o in e)this._data[o]=e[o];else"string"==typeof e?(n||this.type("form"),n=this.getHeader("Content-Type"),"application/x-www-form-urlencoded"==n?this._data=this._data?this._data+"&"+e:e:this._data=(this._data||"")+e):this._data=e;return t?(n||this.type("json"),this):this},f.prototype.callback=function(e,t){var n=this._callback;return this.clearTimeout(),2==n.length?n(e,t):e?this.emit("error",e):void n(t)},f.prototype.crossDomainError=function(){var e=new Error("Origin is not allowed by Access-Control-Allow-Origin");e.crossDomain=!0,this.callback(e)},f.prototype.timeoutError=function(){var e=this._timeout,t=new Error("timeout of "+e+"ms exceeded");t.timeout=e,this.callback(t)},f.prototype.withCredentials=function(){return this._withCredentials=!0,this},f.prototype.end=function(e){var t=this,n=this.xhr=i(),a=this._query.join("&"),s=this._timeout,u=this._formData||this._data;if(this._callback=e||o,n.onreadystatechange=function(){if(4==n.readyState)return 0==n.status?t.aborted?t.timeoutError():t.crossDomainError():void t.emit("end")},n.upload&&(n.upload.onprogress=function(e){e.percent=e.loaded/e.total*100,t.emit("progress",e)}),s&&!this._timer&&(this._timer=setTimeout(function(){t.abort()},s)),a&&(a=h.serializeObject(a),this.url+=~this.url.indexOf("?")?"&"+a:"?"+a),n.open(this.method,this.url,!0),this._withCredentials&&(n.withCredentials=!0),"GET"!=this.method&&"HEAD"!=this.method&&"string"!=typeof u&&!r(u)){var c=h.serialize[this.getHeader("Content-Type")];c&&(u=c(u))}for(var l in this.header)null!=this.header[l]&&n.setRequestHeader(l,this.header[l]);return this.emit("request",this),n.send(u),this},h.Request=f,h.get=function(e,t,n){var o=h("GET",e);return"function"==typeof t&&(n=t,t=null),t&&o.query(t),n&&o.end(n),o},h.head=function(e,t,n){var o=h("HEAD",e);return"function"==typeof t&&(n=t,t=null),t&&o.send(t),n&&o.end(n),o},h.del=function(e,t){var n=h("DELETE",e);return t&&n.end(t),n},h.patch=function(e,t,n){var o=h("PATCH",e);return"function"==typeof t&&(n=t,t=null),t&&o.send(t),n&&o.end(n),o},h.post=function(e,t,n){var o=h("POST",e);return"function"==typeof t&&(n=t,t=null),t&&o.send(t),n&&o.end(n),o},h.put=function(e,t,n){var o=h("PUT",e);return"function"==typeof t&&(n=t,t=null),t&&o.send(t),n&&o.end(n),o},e.exports=h},function(e,t){function n(e){if(e)return o(e)}function o(e){for(var t in n.prototype)e[t]=n.prototype[t];return e}e.exports=n,n.prototype.on=n.prototype.addEventListener=function(e,t){return this._callbacks=this._callbacks||{},(this._callbacks[e]=this._callbacks[e]||[]).push(t),this},n.prototype.once=function(e,t){function n(){o.off(e,n),t.apply(this,arguments);
~~~~~~~

### `static/shim.js`

~~~~~~~text
73:// Production steps of ECMA-262, Edition 5, 15.4.4.19
~~~~~~~

### `third-party/m3e/NOTICE`

~~~~~~~text
8:production build minifies away all source-level `@license` comments, so
~~~~~~~

### `vite.config.mts`

~~~~~~~text
49:// `vp build` / `vp dev` at repo root must be production-faithful: prepare
~~~~~~~

Files listed: **82**; matching content/path rows: **324**.
