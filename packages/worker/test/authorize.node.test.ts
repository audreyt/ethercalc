import { describe, it, expect } from 'vite-plus/test';
import type { AccessMode, RoomAcl } from '@ethercalc/shared/storage-keys';
import { authorize } from '../src/lib/authorize.ts';

describe('authorize', () => {
  const acl: RoomAcl = {
    owner: 'user-owner',
    writers: ['user-writer', 'user-both'],
    readers: ['user-reader', 'user-both'],
  };

  const principalOwner = { uid: 'user-owner' };
  const principalWriter = { uid: 'user-writer' };
  const principalReader = { uid: 'user-reader' };
  const principalBoth = { uid: 'user-both' };
  const principalUnrelated = { uid: 'user-unrelated' };
  const principalAnon = null;

  describe('public access (or undefined/null)', () => {
    const modes: (AccessMode | null | undefined)[] = ['public', null, undefined];

    for (const mode of modes) {
      describe(`mode: ${mode}`, () => {
        it('allows read for all principals', () => {
          expect(authorize('read', principalAnon, mode, acl)).toBe(true);
          expect(authorize('read', principalOwner, mode, acl)).toBe(true);
          expect(authorize('read', principalReader, mode, acl)).toBe(true);
          expect(authorize('read', principalWriter, mode, acl)).toBe(true);
          expect(authorize('read', principalBoth, mode, acl)).toBe(true);
          expect(authorize('read', principalUnrelated, mode, acl)).toBe(true);
        });

        it('allows write for all principals', () => {
          expect(authorize('write', principalAnon, mode, acl)).toBe(true);
          expect(authorize('write', principalOwner, mode, acl)).toBe(true);
          expect(authorize('write', principalReader, mode, acl)).toBe(true);
          expect(authorize('write', principalWriter, mode, acl)).toBe(true);
          expect(authorize('write', principalBoth, mode, acl)).toBe(true);
          expect(authorize('write', principalUnrelated, mode, acl)).toBe(true);
        });

        it('allows access even if ACL is missing or invalid', () => {
          expect(authorize('read', principalAnon, mode, null)).toBe(true);
          expect(authorize('write', principalAnon, mode, null)).toBe(true);
          expect(authorize('read', principalAnon, mode, {})).toBe(true);
          expect(authorize('write', principalAnon, mode, { owner: 123 })).toBe(true);
        });
      });
    }
  });

  describe('private access', () => {
    const mode: AccessMode = 'private';

    describe('with valid ACL', () => {
      it('handles owner access', () => {
        expect(authorize('read', principalOwner, mode, acl)).toBe(true);
        expect(authorize('write', principalOwner, mode, acl)).toBe(true);
      });

      it('handles reader only access', () => {
        expect(authorize('read', principalReader, mode, acl)).toBe(true);
        expect(authorize('write', principalReader, mode, acl)).toBe(false);
      });

      it('handles writer only access', () => {
        expect(authorize('read', principalWriter, mode, acl)).toBe(false);
        expect(authorize('write', principalWriter, mode, acl)).toBe(true);
      });

      it('handles user in both readers and writers access', () => {
        expect(authorize('read', principalBoth, mode, acl)).toBe(true);
        expect(authorize('write', principalBoth, mode, acl)).toBe(true);
      });

      it('denies unrelated user access', () => {
        expect(authorize('read', principalUnrelated, mode, acl)).toBe(false);
        expect(authorize('write', principalUnrelated, mode, acl)).toBe(false);
      });

      it('denies anonymous (null principal) access', () => {
        expect(authorize('read', principalAnon, mode, acl)).toBe(false);
        expect(authorize('write', principalAnon, mode, acl)).toBe(false);
      });
    });

    describe('with missing or invalid ACL (fail-closed)', () => {
      it('denies all when ACL is null', () => {
        expect(authorize('read', principalOwner, mode, null)).toBe(false);
        expect(authorize('write', principalOwner, mode, null)).toBe(false);
      });

      it('denies all when ACL is undefined', () => {
        expect(authorize('read', principalOwner, mode, undefined)).toBe(false);
        expect(authorize('write', principalOwner, mode, undefined)).toBe(false);
      });

      it('denies all when owner is not a string', () => {
        expect(authorize('read', principalOwner, mode, { owner: 123, writers: [], readers: [] })).toBe(false);
        expect(authorize('write', principalOwner, mode, { writers: [], readers: [] })).toBe(false);
      });

      it('denies all when writers is not an array', () => {
        expect(authorize('read', principalOwner, mode, { owner: 'user-owner', writers: 'not-an-array', readers: [] })).toBe(false);
      });

      it('denies all when readers is not an array', () => {
        expect(authorize('read', principalOwner, mode, { owner: 'user-owner', writers: [], readers: 'not-an-array' })).toBe(false);
      });

      it('denies empty identities and non-string ACL members', () => {
        expect(
          authorize('read', { uid: '' }, mode, {
            owner: '',
            writers: [],
            readers: [],
          }),
        ).toBe(false);
        expect(
          authorize('write', principalOwner, mode, {
            owner: 'user-owner',
            writers: [7],
            readers: [],
          }),
        ).toBe(false);
        expect(
          authorize('read', principalOwner, mode, {
            owner: 'user-owner',
            writers: [],
            readers: [7],
          }),
        ).toBe(false);
      });

      it('fails closed for unknown access modes and purposes', () => {
        expect(authorize('read', principalOwner, 'corrupt', acl)).toBe(false);
        // @ts-expect-error - testing unexpected runtime purpose
        expect(authorize('admin', principalOwner, mode, acl)).toBe(false);
      });
    });
    it('rejects ACL lists containing an empty or mixed-type member', () => {
      const malformed = [
        { owner: 'user-owner', readers: ['user-reader', ''], writers: [] },
        { owner: 'user-owner', readers: [], writers: ['user-writer', 7] },
        { owner: 'user-owner', readers: [null], writers: [] },
      ];
      for (const candidate of malformed) {
        expect(authorize('read', principalReader, mode, candidate)).toBe(false);
        expect(authorize('write', principalWriter, mode, candidate)).toBe(false);
      }
    });
  });
});
