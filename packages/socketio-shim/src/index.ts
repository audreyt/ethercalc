/**
 * Barrel re-exports for @ethercalc/socketio-shim. Runtime lives in
 * sibling modules; this file is deliberately branch-free and excluded
 * from the istanbul coverage gate (see vitest.config.ts).
 *
 * Additional submodules (handshake, sid, adapter, client/legacy-io) are
 * added in follow-up commits.
 */
export {
  encodeFrame,
  decodeFrame,
  PacketType,
  type Packet,
  type PacketTypeCode,
} from './framing.ts';
export { socketIoEventToNative, nativeToSocketIoEvent } from './translate.ts';
