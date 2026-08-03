/** Cloudflare's asynchronous Durable Object storage multi-key ceiling. */
export const DO_STORAGE_BATCH_KEYS = 128;

type BatchReader = Pick<DurableObjectStorage, 'get'>;
type BatchWriter = Pick<DurableObjectTransaction, 'put' | 'delete'>;

/** Fetch any number of keys without crossing the platform's 128-key limit. */
export async function getStorageValuesBatched<T>(
  storage: BatchReader,
  keys: readonly string[],
): Promise<Map<string, T>> {
  const values = new Map<string, T>();
  for (let index = 0; index < keys.length; index += DO_STORAGE_BATCH_KEYS) {
    const batch = await storage.get<T>(
      keys.slice(index, index + DO_STORAGE_BATCH_KEYS),
    );
    for (const [key, value] of batch) values.set(key, value);
  }
  return values;
}

/** Store any number of entries in platform-sized batches. */
export async function putStorageEntriesBatched(
  storage: BatchWriter,
  entries: Readonly<Record<string, unknown>>,
): Promise<void> {
  const pairs = Object.entries(entries);
  for (let index = 0; index < pairs.length; index += DO_STORAGE_BATCH_KEYS) {
    await storage.put(
      Object.fromEntries(pairs.slice(index, index + DO_STORAGE_BATCH_KEYS)),
    );
  }
}

/** Delete any number of keys in platform-sized batches. */
export async function deleteStorageKeysBatched(
  storage: BatchWriter,
  keys: readonly string[],
): Promise<void> {
  for (let index = 0; index < keys.length; index += DO_STORAGE_BATCH_KEYS) {
    await storage.delete(keys.slice(index, index + DO_STORAGE_BATCH_KEYS));
  }
}

/**
 * Atomically replace a Durable Object's complete key-value state.
 *
 * `deleteAll()` followed by batched writes can expose data loss if a later
 * batch fails. Listing and deleting inside one explicit transaction keeps the
 * old room intact unless every replacement batch commits.
 */
export async function replaceStorageEntriesBatched(
  storage: DurableObjectStorage,
  entries: Readonly<Record<string, unknown>>,
): Promise<void> {
  await storage.transaction(async (txn) => {
    const oldKeys = [...(await txn.list()).keys()];
    await deleteStorageKeysBatched(txn, oldKeys);
    await putStorageEntriesBatched(txn, entries);
  });
}
