import { describe, it, expect } from 'vitest';

import {
  FORMDATA_SUFFIX,
  formdataSiblingRoom,
  isPublicRoomIndexEntry,
} from '../src/lib/formdata-sibling.ts';

describe('formdataSiblingRoom', () => {
  it('appends the legacy suffix to a normal room', () => {
    expect(formdataSiblingRoom('mysheet')).toBe(`mysheet${FORMDATA_SUFFIX}`);
  });

  it('returns null when the room is already a form-data sibling', () => {
    expect(formdataSiblingRoom(`x${FORMDATA_SUFFIX}`)).toBeNull();
  });
});

describe('isPublicRoomIndexEntry', () => {
  it('accepts normal room names', () => {
    expect(isPublicRoomIndexEntry('alpha')).toBe(true);
  });

  it('rejects form-data sibling rooms', () => {
    expect(isPublicRoomIndexEntry(`alpha${FORMDATA_SUFFIX}`)).toBe(false);
  });
});