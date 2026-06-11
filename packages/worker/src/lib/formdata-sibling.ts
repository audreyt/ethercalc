/** Legacy suffix for submitform sibling rooms (src/main.ls:522-531). */
export const FORMDATA_SUFFIX = '_formdata';

/**
 * Sibling room that stores submitform row data, or `null` when `room` is
 * already the form-data sibling (idempotent re-submit path).
 */
export function formdataSiblingRoom(room: string): string | null {
  if (room.endsWith(FORMDATA_SUFFIX)) return null;
  return `${room}${FORMDATA_SUFFIX}`;
}

/**
 * Whether a room should appear in public cross-room listings (`/_rooms`,
 * `/_roomlinks`, `/_roomtimes`). Form-data siblings are internal storage
 * for submitform and are hidden from discovery (issue #533).
 */
export function isPublicRoomIndexEntry(room: string): boolean {
  return !room.endsWith(FORMDATA_SUFFIX);
}