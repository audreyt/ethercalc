/**
 * Pure translation between socket.io v0.9 event frames and EtherCalc's
 * native WS message types.
 *
 * Scope: we only bridge `type:5` (Event) frames — that's the single event
 * channel the legacy server ever used (`@on data` in the LiveScript). Other
 * packet types (connect/disconnect/heartbeat) are managed elsewhere and are
 * not user-data-bearing.
 *
 * Legacy wire shape for events:
 *   Frame:  `5::<endpoint>:{"name":"data","args":[{…payload}]}`
 *   Meaning: emit event named "data" with one argument = the EtherCalc
 *           message object.
 *
 * Direction:
 *   client → server: unwrap `args[0]` and validate it matches the
 *                    ClientMessage discriminated union.
 *   server → client: wrap the ServerMessage into an `args[0]` slot.
 */
import {
  CLIENT_MESSAGE_TYPES,
  type ClientMessage,
  type ServerMessage,
} from '@ethercalc/shared/messages';
import { encodeFrame, PacketType, type Packet } from './framing.ts';

interface SocketIoEventPayload {
  name?: unknown;
  args?: unknown;
}

/**
 * Translate an inbound socket.io event packet to a native ClientMessage.
 *
 * Returns `null` (never throws) when:
 *   - packet is not of type Event (5)
 *   - data is missing or malformed JSON
 *   - `name` is not "data"
 *   - `args` is missing, empty, or the first arg isn't a ClientMessage
 *
 * We deliberately don't validate payload shape beyond the `type` field —
 * the native WS layer owes deeper validation for *its* input, and the
 * shim's job is to be a thin translator. Duplicating type checks here
 * would drift from the canonical parser in shared/messages.ts.
 */
export function socketIoEventToNative(packet: Packet): ClientMessage | null {
  if (packet.type !== PacketType.Event) return null;
  if (packet.data === undefined || packet.data === '') return null;

  let parsed: SocketIoEventPayload;
  try {
    parsed = JSON.parse(packet.data) as SocketIoEventPayload;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.name !== 'data') return null;

  if (!Array.isArray(parsed.args) || parsed.args.length === 0) return null;

  const first = parsed.args[0];
  if (!first || typeof first !== 'object') return null;

  const type = (first as { type?: unknown }).type;
  if (typeof type !== 'string') return null;
  if (!(CLIENT_MESSAGE_TYPES as readonly string[]).includes(type)) return null;

  return first as ClientMessage;
}

/**
 * Wrap an outbound ServerMessage as a socket.io event frame string ready
 * to hand to a WebSocket client's `send()` call.
 *
 * Produces `5::/:{"name":"data","args":[{…msg}]}` — the event name is
 * fixed to `"data"` to match the legacy server's single broadcast channel.
 * Endpoint is empty (root namespace) which the v0.9 client expects.
 */
export function nativeToSocketIoEvent(msg: ServerMessage): string {
  const payload: SocketIoEventPayload = {
    name: 'data',
    args: [msg],
  };
  return encodeFrame({
    type: PacketType.Event,
    endpoint: '',
    data: JSON.stringify(payload),
  });
}
