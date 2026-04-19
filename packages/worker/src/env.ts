/**
 * Environment bindings available to the Worker at runtime. Kept in one place
 * so Hono's generic type argument stays in sync with `wrangler.toml`.
 */
export interface Env {
  /** One Durable Object per spreadsheet room. */
  ROOM: DurableObjectNamespace;
}
