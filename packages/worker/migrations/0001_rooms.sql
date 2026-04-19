-- Phase 5.1 — D1 rooms index.
--
-- The DO holds the authoritative room state (snapshot/log/audit/chat/ecell
-- under state.storage). This table is the *cross-room* mirror used by
--
--   GET /_rooms       → list of room names (ordered by name)
--   GET /_roomlinks   → HTML `<a>` list of the above
--   GET /_roomtimes   → {room: updated_at} hash, sorted desc by value
--
-- See CLAUDE.md §3.3 (data model) and §10.2 (Redis → DO/D1/KV mapping).
-- Every RoomDO snapshot write (POST/PUT /_/:room, POST /_do/commands)
-- upserts this row via `mirrorRoomToD1`; DELETE /_do/all removes it via
-- `deleteRoomFromD1`.
--
-- `cors_public` is pre-wired for the `?cors=1` flag (Phase 9+ — CORS
-- toggle on /_rooms etc). Defaults to 0; no Phase 5.1 code sets it yet.
CREATE TABLE rooms (
  room        TEXT PRIMARY KEY,
  updated_at  INTEGER NOT NULL,
  cors_public INTEGER NOT NULL DEFAULT 0
);
-- Descending index — /_roomtimes reads most-recent-first.
CREATE INDEX rooms_updated_at ON rooms(updated_at DESC);
