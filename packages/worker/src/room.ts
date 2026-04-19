/**
 * RoomDO — one Durable Object per spreadsheet room.
 *
 * Skeleton only at this phase. Storage layout, WebSocket handlers, and
 * command execution will be added in Phases 5/6/7 (see CLAUDE.md §8).
 */
import type { Env } from './env.ts';

export class RoomDO implements DurableObject {
  readonly #state: DurableObjectState;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  readonly #env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.#state = state;
    this.#env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/_do/ping') {
      return new Response(
        JSON.stringify({ id: this.#state.id.toString(), name: url.searchParams.get('name') }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response('Not implemented', { status: 501 });
  }
}
