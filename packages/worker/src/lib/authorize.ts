
/**
 * Authorizes a request to access or modify a room based on the room's access mode
 * and access control list (ACL).
 *
 * - Public rooms (access !== 'private') always allow all actions.
 * - Private rooms gate read and write operations:
 *   - The owner is implicitly allowed both read and write access.
 *   - Users listed in `readers` are allowed read access.
 *   - Users listed in `writers` are allowed write access.
 *   - Anonymous users and any users not explicitly authorized are denied access.
 *   - Invalid or missing ACL structures on private rooms fail closed.
 */
export function authorize(
  purpose: 'read' | 'write',
  principal: { readonly uid: string } | null,
  access: unknown,
  acl: unknown,
): boolean {
  if (access == null || access === 'public') return true;
  if (access !== 'private') return false;
  if (
    !principal ||
    typeof principal.uid !== 'string' ||
    principal.uid.length === 0
  ) {
    return false;
  }
  if (
    acl === null ||
    typeof acl !== 'object' ||
    !('owner' in acl) ||
    typeof acl.owner !== 'string' ||
    acl.owner.length === 0 ||
    !('readers' in acl) ||
    !Array.isArray(acl.readers) ||
    !acl.readers.every(
      (reader) => typeof reader === 'string' && reader.length > 0,
    ) ||
    !('writers' in acl) ||
    !Array.isArray(acl.writers) ||
    !acl.writers.every(
      (writer) => typeof writer === 'string' && writer.length > 0,
    )
  ) {
    return false;
  }
  if (purpose !== 'read' && purpose !== 'write') return false;
  if (principal.uid === acl.owner) return true;
  return purpose === 'read'
    ? acl.readers.includes(principal.uid)
    : acl.writers.includes(principal.uid);
}
