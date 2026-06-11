-- Storage-growth fold follow-up — durable audit_log + chat_log tables.
--
-- The DO's `state.storage` keeps only a bounded recent tail of `audit:` and
-- `chat:` (the command log is a ring buffer; the alarm trims chat/audit), so
-- per-room DO storage stops growing without limit. The COMPLETE record is
-- mirrored here in D1 at append time so the trims don't lose data:
--   - every command mirrors its audit entry (src/room.ts #applyCommandAndMirror)
--   - every chat message mirrors here (src/room.ts appendChat)
-- and the alarm only drops DO entries that have already been mirrored.
--
-- Both tables share the shape (room, seq, ts, body) with a (room, seq)
-- primary key so re-mirroring an already-durable entry is an idempotent
-- `ON CONFLICT(room, seq) DO NOTHING` no-op (safe under seed re-runs).
--
-- NOTE: src/lib/d1-schema.ts also creates these lazily (CREATE TABLE IF NOT
-- EXISTS on first "no such table" error), so the code self-heals even before
-- this migration runs — there is no deploy-ordering hazard. This file is the
-- explicit, reviewable schema of record.
--
-- The secondary index on `room` keeps the per-room delete (on DELETE
-- /_do/all) and any future per-room history read cheap.
CREATE TABLE audit_log (
  room  TEXT NOT NULL,
  seq   INTEGER NOT NULL,
  ts    INTEGER NOT NULL,
  body  TEXT NOT NULL,
  PRIMARY KEY (room, seq)
);
CREATE INDEX audit_log_room ON audit_log(room);

CREATE TABLE chat_log (
  room  TEXT NOT NULL,
  seq   INTEGER NOT NULL,
  ts    INTEGER NOT NULL,
  body  TEXT NOT NULL,
  PRIMARY KEY (room, seq)
);
CREATE INDEX chat_log_room ON chat_log(room);
