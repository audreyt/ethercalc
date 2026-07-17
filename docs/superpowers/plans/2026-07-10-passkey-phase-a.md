# Passkey Permissions — Phase A: Private Create/Copy Slice

> Branch: `feat/passkey-permissions`  
> Target: smallest end-to-end private create/copy — auth, gating, creation, client.

## Advisory constraints (binding)

1. **Atomic init**: `POST /_do/init-private` writes snapshot + `meta:access=private` + `meta:acl` + `meta:group` in one `blockConcurrencyWhile` + `storage.transaction()`. Verifies truly-uninitialized state (`hasSnapshot() === false && get(meta:access) === undefined`). Fails 409 on any existing state. Copy reads source first, then initializes a random target id.
2. **All read paths gated before any `private` flag ships**: HTTP `/_do/*` reads, WS upgrade, room index, asset entry, exports. No `private` UI until every read path enforces.
3. **RoomDO is sole authz boundary**: Worker middleware is UX only (cookie → uid header). Every `/_do/*` handler calls `authorize(purpose, principal, meta)`.
4. **No third-party auth**: Worker is its own WebAuthn relying party via `@simplewebauthn/server` v13.
5. **Oracle replay stays byte-identical** for all public-room paths.
6. **100% node test coverage** on `packages/worker`; Stryker passes.

## Implementation phases

### P1: Storage keys + types (TDD)
- Add `meta:access`, `meta:acl`, `meta:group` to `STORAGE_KEYS` in `packages/shared/src/storage-keys.ts`
- Add `AccessMode = 'public' | 'private'` type
- Add `RoomAcl` interface: `{ owner: string; writers: string[]; readers: string[] }`
- Add `meta:access` default: absent = public (oracle-safe)
- Tests: `storage-keys` tests confirm new keys exist and old keys unchanged

### P2: AuthDO (TDD)
- New file `packages/worker/src/auth-do.ts`
- Singleton: `idFromName('auth')`, SQLite storage
- Stores: credentials (`cred:<id>` → `{credentialID, publicKey, transports}`), challenges (`challenge:<id>` → bytes, TTL via alarm), session secret (random 256-bit, generated once)
- Methods: `registerInit`, `registerComplete`, `loginInit`, `loginComplete`, `verifySession`
- Session = HMAC(secret) over `uid|iat|exp`, ~30-day
- Config: `ETHERCALC_AUTH` (on/off), `ETHERCALC_RP_ID` (RP ID for WebAuthn)
- Tests: `auth-do.node.test.ts` — full ceremony lifecycle, session verify, expiry

### P3: Session middleware (TDD)
- New file `packages/worker/src/lib/session.ts`
- `parseSession(cookie, secret)` → `{uid} | null`
- `sessionCookie(uid, secret)` → `Set-Cookie` string
- Worker middleware in `index.ts`: strip `X-EC-*` headers at ingress, verify `ec_sess` cookie, set internal `X-EC-Uid` header
- Tests: `session.node.test.ts` — cookie parse, expiry, tamper rejection

### P4: Authorize primitive (TDD)
- New file `packages/worker/src/lib/authorize.ts`
- `authorize(purpose, principal, access, acl)`:
  - public → always allow
  - private → `principal.uid === acl.owner || acl.readers.includes(principal.uid)` for read; `principal.uid === acl.owner || acl.writers.includes(principal.uid)` for write
  - No principal → deny (private rooms)
- Tests: `authorize.node.test.ts` — all mode×purpose×principal combinations

### P5: RoomDO `authorize()` gate (TDD)
- Add `#getAccessMeta()` → reads `meta:access` + `meta:acl` from storage
- Add `#authorize(purpose, request)` → reads access meta, resolves principal from `X-EC-Uid` header, calls `authorize()`
- Gate EVERY `/_do/*` handler:
  - Read: snapshot, log, cells, cells/:cell, html, csv, csv.json, md, xlsx, ods, fods, sheet-data, exists
  - Write: snapshot PUT, commands, all DELETE, rename, install, clone, seed, snapshot-chunk, fire-trigger
  - WS: ws upgrade
- Public rooms: no behavioral change (authorize returns true, existing path runs)
- Private rooms: non-owner gets 403 on read, 403 on write
- Tests: `room.node.test.ts` — private room read denied for non-owner, allowed for owner; public room unchanged

### P6: Atomic init-private primitive (TDD)
- `POST /_do/init-private` on RoomDO
- Body: `{snapshot, acl, group?}`
- In `blockConcurrencyWhile` + `storage.transaction()`:
  1. Verify `hasSnapshot() === false && get(meta:access) === undefined`
  2. If existing state → 409 Conflict
  3. Write: snapshot, meta:access=private, meta:acl, meta:group (if provided), meta:updated_at
  4. Arm alarm
- Tests: `room.node.test.ts` — init on empty DO succeeds, init on occupied DO fails 409, atomicity (no partial state)

### P7: Worker routes for private create/copy (TDD)
- `POST /_/private` — create new private room
  - Requires authenticated session (uid from middleware)
  - Generates random room id
  - Dispatches `POST /_do/init-private` with empty snapshot + `{owner: uid, writers: [uid], readers: [uid]}`
  - Returns 201 with `/_/{room}` Location
- `POST /_from/:template/private` — copy public template to private
  - Requires authenticated session
  - Reads source snapshot via `GET /_do/snapshot` (public rooms allow read)
  - Generates random target id
  - Dispatches `POST /_do/init-private` with source snapshot + ACL
  - Returns 302 to `/{room}/edit`
- Tests: `routes-rooms.node.test.ts` — create private, copy to private, unauthenticated 401

### P8: Room index exclusion (TDD)
- Private rooms excluded from `/_rooms`, `/_roomlinks`, `/_roomtimes`
- D1 mirror: add `access` column to `rooms` table, filter `WHERE access != 'private'`
- `/_exists/:room` returns 403 for private rooms when unauthenticated (not boolean false — that leaks existence)
- Tests: `rooms-index.node.test.ts` — private rooms excluded from listing

### P9: WS read gating (TDD)
- `#acceptWebSocket`: call `#authorize('read', request)` before upgrade
- Private room + no valid session → 403 (not 101)
- WS attachment carries uid (from session, not from query param)
- `verifyAuth` closure: AND-composes existing HMAC check with new ACL check
- Tests: `room.node.test.ts` — WS upgrade denied for non-owner

### P10: Client UI
- Login button (passkey registration + authentication)
- "New Private Sheet" button
- "Copy to Private" button on public sheets
- Session state in client (cookie-based, no localStorage token)
- Unlock indicator for private rooms

### P11: Config plumbing
- `wrangler.toml`: add AuthDO binding + migration, `ETHERCALC_AUTH`, `ETHERCALC_RP_ID` vars
- `config.capnp`: add AuthDO binding for self-host workerd
- `env.ts`: add `AUTH?: DurableObjectNamespace`, `ETHERCALC_AUTH?`, `ETHERCALC_RP_ID?`

### P12: Verification
- 100% node test coverage
- Typecheck + lint
- Oracle replay unchanged for public rooms
- Workers-pool integration tests
