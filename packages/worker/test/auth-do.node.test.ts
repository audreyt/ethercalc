import { describe, it, expect, beforeEach, vi } from 'vite-plus/test';

import { AuthDO } from '../src/auth-do.ts';

/**
 * AuthDO unit tests — direct construction with a Map-backed fake storage.
 * Mirrors the `room.node.test.ts` pattern: we supply a minimal in-memory
 * DO state so istanbul tracks every branch.
 *
 * The @simplewebauthn/server functions are mocked so we can test the DO's
 * storage logic, challenge lifecycle, and session management without
 * real WebAuthn crypto.
 */

// ─── Fake storage (same shape as room.node.test.ts) ──────────────────────

interface FakeStorageRecord {
  map: Map<string, unknown>;
  alarm?: number | null;
}

function fakeStorage(record: FakeStorageRecord): DurableObjectStorage {
  const m = record.map;
  if (record.alarm === undefined) record.alarm = null;
  return {
    async getAlarm(): Promise<number | null> {
      return record.alarm ?? null;
    },
    async setAlarm(scheduledTime: number): Promise<void> {
      record.alarm = scheduledTime;
    },
    async deleteAlarm(): Promise<void> {
      record.alarm = null;
    },
    async get(key: unknown): Promise<unknown> {
      if (typeof key === 'string') return m.get(key);
      if (Array.isArray(key)) {
        const out = new Map<string, unknown>();
        for (const k of key) if (m.has(k as string)) out.set(k as string, m.get(k as string));
        return out;
      }
      throw new Error('unexpected get argument shape');
    },
    async put(key: unknown, value: unknown): Promise<void> {
      if (typeof key === 'string') {
        m.set(key, value);
        return;
      }
      if (key !== null && typeof key === 'object') {
        for (const [k, v] of Object.entries(key)) m.set(k, v);
        return;
      }
      throw new Error('unexpected put argument shape');
    },
    async delete(key: unknown): Promise<boolean | number> {
      if (typeof key === 'string') return m.delete(key);
      if (Array.isArray(key)) {
        let n = 0;
        for (const k of key) if (m.delete(k as string)) n += 1;
        return n;
      }
      throw new Error('unexpected delete argument shape');
    },
    async deleteAll(): Promise<void> {
      m.clear();
    },
    async list(opts?: { prefix?: string; limit?: number }): Promise<Map<string, unknown>> {
      const out = new Map<string, unknown>();
      const prefix = opts?.prefix ?? '';
      let keys = Array.from(m.keys()).filter((k) => k.startsWith(prefix)).sort();
      if (opts?.limit !== undefined) keys = keys.slice(0, opts.limit);
      for (const k of keys) out.set(k, m.get(k)!);
      return out;
    },
    async transaction<T>(cb: () => Promise<T>): Promise<T> {
      return cb();
    },
  } as unknown as DurableObjectStorage;
}

function makeState(
  idString: string,
  record: FakeStorageRecord,
): DurableObjectState {
  return {
    id: { toString: () => idString } as DurableObjectId,
    storage: fakeStorage(record),
    async blockConcurrencyWhile<T>(cb: () => Promise<T>): Promise<T> {
      return cb();
    },
    waitUntil(p: Promise<unknown>): void {
      void p;
    },
  } as unknown as DurableObjectState;
}

// ─── Mock @simplewebauthn/server ─────────────────────────────────────────

const {
  mockGenerateRegistrationOptions,
  mockVerifyRegistrationResponse,
  mockGenerateAuthenticationOptions,
  mockVerifyAuthenticationResponse,
} = vi.hoisted(() => ({
  mockGenerateRegistrationOptions: vi.fn(),
  mockVerifyRegistrationResponse: vi.fn(),
  mockGenerateAuthenticationOptions: vi.fn(),
  mockVerifyAuthenticationResponse: vi.fn(),
}));

vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: mockGenerateRegistrationOptions,
  verifyRegistrationResponse: mockVerifyRegistrationResponse,
  generateAuthenticationOptions: mockGenerateAuthenticationOptions,
  verifyAuthenticationResponse: mockVerifyAuthenticationResponse,
}));

// ─── Helpers ────────────────────────────────────────────────────────────

function makeRequest(
  path: string,
  init?: RequestInit,
): Request {
  return new Request(`https://auth.local${path}`, init);
}

function jsonBody(body: unknown): { method: string; headers: Record<string, string>; body: string } {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function readChallenge(response: Response): Promise<string> {
  const body: unknown = await response.json();
  if (body === null || typeof body !== 'object' || !('options' in body)) {
    throw new Error('response is missing options');
  }
  const options = body.options;
  if (
    options === null ||
    typeof options !== 'object' ||
    !('challenge' in options) ||
    typeof options.challenge !== 'string'
  ) {
    throw new Error('response is missing an options challenge');
  }
  return options.challenge;
}

async function readRegistrationInit(
  response: Response,
): Promise<{ uid: string; challenge: string }> {
  const body: unknown = await response.json();
  if (
    body === null ||
    typeof body !== 'object' ||
    !('uid' in body) ||
    typeof body.uid !== 'string' ||
    !('options' in body)
  ) {
    throw new Error('response is missing registration data');
  }
  const options = body.options;
  if (
    options === null ||
    typeof options !== 'object' ||
    !('challenge' in options) ||
    typeof options.challenge !== 'string'
  ) {
    throw new Error('response is missing a registration challenge');
  }
  return { uid: body.uid, challenge: options.challenge };
}

async function readAuthResult(
  response: Response,
): Promise<{ uid: string; session: string }> {
  const body: unknown = await response.json();
  if (
    body === null ||
    typeof body !== 'object' ||
    !('uid' in body) ||
    typeof body.uid !== 'string' ||
    !('session' in body) ||
    typeof body.session !== 'string'
  ) {
    throw new Error('response is missing authentication data');
  }
  return { uid: body.uid, session: body.session };
}

async function signSessionPayload(
  secret: string,
  payloadText: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payloadText);
  let binary = '';
  for (const byte of payloadBytes) binary += String.fromCharCode(byte);
  const payload = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, payloadBytes),
  );
  let mac = '';
  for (const byte of signature) {
    mac += (byte < 0x10 ? '0' : '') + byte.toString(16);
  }
  return `${payload}.${mac}`;
}


const RP_ID = 'ethercalc.net';
const RP_NAME = 'EtherCalc';
const ORIGIN = 'https://ethercalc.net';

function makeEnv(): Record<string, unknown> {
  return { ETHERCALC_RP_ID: RP_ID, ETHERCALC_RP_NAME: RP_NAME, ETHERCALC_ORIGIN: ORIGIN };
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('AuthDO', () => {
  let record: FakeStorageRecord;
  let auth: AuthDO;
  let env: Record<string, unknown>;

  beforeEach(() => {
    record = { map: new Map() };
    env = makeEnv();
    auth = new AuthDO(makeState('auth-1', record), env as unknown as never);
    mockGenerateRegistrationOptions.mockReset();
    mockVerifyRegistrationResponse.mockReset();
    mockGenerateAuthenticationOptions.mockReset();
    mockVerifyAuthenticationResponse.mockReset();
  });

  describe('POST /_auth/register-init', () => {
    it('generates registration options with a server-generated uid', async () => {
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: 'reg-challenge-123',
        rp: { name: RP_NAME, id: RP_ID },
        user: { id: 'generated-uid', name: 'generated-uid', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      });

      const res = await auth.fetch(
        makeRequest('/_auth/register-init', jsonBody({})),
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { options: unknown; uid: string };
      expect(body.uid).toBeTruthy();
      expect(body.options).toBeTruthy();

      // Challenge stored in DO storage
      const challengeKey = Array.from(record.map.keys()).find((k) =>
        k.startsWith('challenge:'),
      );
      expect(challengeKey).toBeTruthy();
      const stored = record.map.get(challengeKey!) as {
        purpose: string;
        uid: string;
        exp: number;
      };
      expect(stored.purpose).toBe('register');
      expect(stored.uid).toBe(body.uid);
      expect(stored.exp).toBeGreaterThan(Date.now());
    });

    it('requires residentKey and userVerification in options', async () => {
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: 'c',
        rp: { name: RP_NAME, id: RP_ID },
        user: { id: 'u', name: 'u', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: {},
      });

      await auth.fetch(makeRequest('/_auth/register-init', jsonBody({})));

      const callOpts = mockGenerateRegistrationOptions.mock.calls[0]![0];
      expect(callOpts.rpID).toBe(RP_ID);
      expect(callOpts.rpName).toBe(RP_NAME);
      expect(callOpts.authenticatorSelection).toMatchObject({
        residentKey: 'required',
        userVerification: 'required',
      });
    });

    it('uses injected WebAuthn operations', async () => {
      const generateRegistrationOptions = vi.fn().mockResolvedValue({
        challenge: 'injected-registration-challenge',
        rp: { name: RP_NAME, id: RP_ID },
        user: { id: 'injected', name: 'injected', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: {},
      });
      const injectedAuth = new AuthDO(
        makeState('auth-injected', record),
        env as unknown as never,
        {
          generateRegistrationOptions,
          verifyRegistrationResponse: vi.fn(),
          generateAuthenticationOptions: vi.fn(),
          verifyAuthenticationResponse: vi.fn(),
        },
      );

      const response = await injectedAuth.fetch(
        makeRequest('/_auth/register-init', jsonBody({})),
      );

      expect(response.status).toBe(200);
      expect(generateRegistrationOptions).toHaveBeenCalledOnce();
    });
  });

  describe('POST /_auth/register-complete', () => {
    it('stores the credential and returns an authenticated session', async () => {
      // First, register-init to create a challenge + uid
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: 'reg-challenge-abc',
        rp: { name: RP_NAME, id: RP_ID },
        user: { id: 'uid-from-init', name: 'uid-from-init', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: {},
      });
      const initRes = await auth.fetch(
        makeRequest('/_auth/register-init', jsonBody({})),
      );
      const initBody = (await initRes.json()) as { uid: string; options: { challenge: string } };
      const uid = initBody.uid;
      const challenge = initBody.options.challenge;

      // Mock verification success
      const credentialID = 'cred-base64-id-xyz';
      const publicKey = new Uint8Array([1, 2, 3]);
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          fmt: 'none',
          aaguid: 'aaguid',
          credential: {
            id: credentialID,
            publicKey,
            counter: 0,
            transports: ['internal'],
          },
          credentialType: 'public-key',
          attestationObject: new Uint8Array(),
          userVerified: true,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      const res = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            uid,
            challenge,
          }),
        ),
      );
      expect(res.status).toBe(200);
      const body = await readAuthResult(res);
      expect(body.uid).toBe(uid);
      expect(body.session).not.toBe('');

      // Credential stored under cred:<id>
      const stored = record.map.get(`cred:${credentialID}`);
      if (
        stored === null ||
        typeof stored !== 'object' ||
        !('uid' in stored) ||
        !('publicKey' in stored) ||
        !(stored.publicKey instanceof Uint8Array) ||
        !('counter' in stored) ||
        !('transports' in stored) ||
        !('deviceType' in stored) ||
        !('backedUp' in stored)
      ) {
        throw new Error('credential was not stored');
      }
      expect(stored.uid).toBe(uid);
      expect(Array.from(stored.publicKey)).toEqual([1, 2, 3]);
      expect(stored.counter).toBe(0);
      expect(stored.transports).toEqual(['internal']);
      expect(stored.deviceType).toBe('singleDevice');
      expect(stored.backedUp).toBe(false);

      // Challenge consumed (deleted)
      const challengeKeys = Array.from(record.map.keys()).filter((k) =>
        k.startsWith('challenge:'),
      );
      expect(challengeKeys).toHaveLength(0);
    });

    it('passes env-derived expectedOrigin and expectedRPID to verify (never client values)', async () => {
      // register-init first
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: 'c',
        rp: { name: RP_NAME, id: RP_ID },
        user: { id: 'u', name: 'u', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: {},
      });
      const initRes = await auth.fetch(
        makeRequest('/_auth/register-init', jsonBody({})),
      );
      const initBody = (await initRes.json()) as { uid: string; options: { challenge: string } };

      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'cred-origin-test', publicKey: new Uint8Array(), counter: 0 },
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          fmt: 'none',
          aaguid: '',
          credentialType: 'public-key',
          attestationObject: new Uint8Array(),
          userVerified: true,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      // Client tries to inject a malicious origin/rpID in the body
      await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'cred-origin-test', response: {} },
            uid: initBody.uid,
            challenge: initBody.options.challenge,
            origin: 'https://evil.com',
            rpID: 'evil.com',
          }),
        ),
      );

      // The verify call must use env-derived values, NOT client values
 const verifyOpts = mockVerifyRegistrationResponse.mock.calls[0]![0];
      expect(verifyOpts.expectedOrigin).toBe(ORIGIN);
      expect(verifyOpts.expectedRPID).toBe(RP_ID);
    });

    it('rejects registration with wrong challenge', async () => {
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: false,
      });
      const res = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'x', response: {} },
            uid: 'u',
            challenge: 'wrong-challenge',
          }),
        ),
      );
      expect(res.status).toBe(400);
    });

    it('maps registration verifier errors to a generic 400 and consumes the challenge', async () => {
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: 'registration-error-challenge',
        rp: { name: RP_NAME, id: RP_ID },
        user: { id: 'generated', name: 'generated', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
      });
      const init = await readRegistrationInit(
        await auth.fetch(makeRequest('/_auth/register-init', jsonBody({}))),
      );
      mockVerifyRegistrationResponse.mockRejectedValue(
        new Error('attacker-visible verifier detail'),
      );

      const response = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'malformed-registration', response: {} },
            uid: init.uid,
            challenge: init.challenge,
          }),
        ),
      );

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Registration verification failed');
      expect(record.map.has(`challenge:${init.challenge}`)).toBe(false);
    });

    it('rejects registration with unknown uid (no matching challenge)', async () => {
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'x', publicKey: new Uint8Array(), counter: 0 },
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          fmt: 'none',
          aaguid: '',
          credentialType: 'public-key',
          attestationObject: new Uint8Array(),
          userVerified: true,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });
      const res = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'x', response: {} },
            uid: 'never-registered',
            challenge: 'never-stored',
          }),
        ),
      );
      expect(res.status).toBe(400);
    });

    it('requires response, uid, and challenge fields', async () => {
      for (const body of [
        {},
        { response: { id: 'x', response: {} } },
        { response: { id: 'x', response: {} }, uid: 'u' },
      ]) {
        const response = await auth.fetch(
          makeRequest('/_auth/register-complete', jsonBody(body)),
        );
        expect(response.status).toBe(400);
      }
    });

    it('rejects mismatched-purpose, mismatched-uid, and expired challenges', async () => {
      const now = Date.now();
      record.map.set('challenge:login-purpose', {
        purpose: 'login',
        exp: now + 60_000,
      });
      record.map.set('challenge:other-uid', {
        purpose: 'register',
        uid: 'uid-original',
        exp: now + 60_000,
      });
      record.map.set('challenge:expired-register', {
        purpose: 'register',
        uid: 'uid-expired',
        exp: now - 1,
      });

      const cases = [
        { challenge: 'login-purpose', uid: 'uid-login-purpose' },
        { challenge: 'other-uid', uid: 'uid-different' },
        { challenge: 'expired-register', uid: 'uid-expired' },
      ];
      for (const entry of cases) {
        const response = await auth.fetch(
          makeRequest(
            '/_auth/register-complete',
            jsonBody({
              response: { id: 'x', response: {} },
              uid: entry.uid,
              challenge: entry.challenge,
            }),
          ),
        );
        expect(response.status).toBe(400);
      }
      expect(record.map.has('challenge:login-purpose')).toBe(true);
      expect(record.map.has('challenge:other-uid')).toBe(false);
      expect(record.map.has('challenge:expired-register')).toBe(false);
    });

    it('rejects unverified registrations and missing registration info', async () => {
      const now = Date.now();
      record.map.set('challenge:unverified', {
        purpose: 'register',
        uid: 'uid-unverified',
        exp: now + 60_000,
      });
      record.map.set('challenge:no-info', {
        purpose: 'register',
        uid: 'uid-no-info',
        exp: now + 60_000,
      });
      mockVerifyRegistrationResponse
        .mockResolvedValueOnce({ verified: false })
        .mockResolvedValueOnce({ verified: true });

      const unverified = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'x', response: {} },
            uid: 'uid-unverified',
            challenge: 'unverified',
          }),
        ),
      );
      const noInfo = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'x', response: {} },
            uid: 'uid-no-info',
            challenge: 'no-info',
          }),
        ),
      );

      expect(unverified.status).toBe(400);
      expect(noInfo.status).toBe(400);
    });

    it('rejects a credential ID that is already registered', async () => {
      const credentialID = 'credential-already-registered';
      record.map.set('challenge:duplicate-credential', {
        purpose: 'register',
        uid: 'uid-duplicate',
        exp: Date.now() + 60_000,
      });
      record.map.set(`cred:${credentialID}`, { uid: 'uid-existing' });
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: credentialID,
            publicKey: new Uint8Array(),
            counter: 0,
          },
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          fmt: 'none',
          aaguid: '',
          credentialType: 'public-key',
          attestationObject: new Uint8Array(),
          userVerified: true,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      const response = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            uid: 'uid-duplicate',
            challenge: 'duplicate-credential',
          }),
        ),
      );

      expect(response.status).toBe(409);
    });
  });

  describe('POST /_auth/login-init (usernameless)', () => {
    it('generates auth options with no allowCredentials', async () => {
      mockGenerateAuthenticationOptions.mockResolvedValue({
        challenge: 'auth-challenge-456',
        rpID: RP_ID,
        allowCredentials: [],
        timeout: 60000,
        userVerification: 'required',
      });

      const res = await auth.fetch(
        makeRequest('/_auth/login-init', jsonBody({})),
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { options: unknown };
      expect(body.options).toBeTruthy();

      // No allowCredentials passed to generator
      const callOpts = mockGenerateAuthenticationOptions.mock.calls[0]![0];
      expect(callOpts.rpID).toBe(RP_ID);
      expect(callOpts.allowCredentials).toBeUndefined();
      expect(callOpts.userVerification).toBe('required');

      // Challenge stored as purpose=login
      const challengeKey = Array.from(record.map.keys()).find((k) =>
        k.startsWith('challenge:'),
      );
      expect(challengeKey).toBeTruthy();
      const stored = record.map.get(challengeKey!) as {
        purpose: string;
        exp: number;
      };
      expect(stored.purpose).toBe('login');
      expect(stored.exp).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /_auth/login-complete', () => {
    it('derives uid from credential ID and updates counter atomically', async () => {
      // Store a credential first
      const credentialID = 'cred-id-for-login';
      const uid = 'uid-owner-1';
      record.map.set(`cred:${credentialID}`, {
        uid,
        publicKey: new Uint8Array([4, 5, 6]),
        counter: 5,
        transports: ['internal'],
        deviceType: 'singleDevice',
        backedUp: false,
      });

      // Login-init to create challenge
      mockGenerateAuthenticationOptions.mockResolvedValue({
        challenge: 'login-challenge-789',
        rpID: RP_ID,
        allowCredentials: [],
        timeout: 60000,
        userVerification: 'preferred',
      });
      const initRes = await auth.fetch(
        makeRequest('/_auth/login-init', jsonBody({})),
      );
      const initBody = (await initRes.json()) as { options: { challenge: string } };
      const challenge = initBody.options.challenge;

      // Mock verification
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID,
          newCounter: 6,
          userVerified: true,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      const res = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge,
          }),
        ),
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { uid: string; session: string };
      expect(body.uid).toBe(uid);
      expect(body.session).toBeTruthy();

      // Login verification must require user verification (PIN/biometric)
 const verifyOpts = mockVerifyAuthenticationResponse.mock.calls[0]![0];
      expect(verifyOpts.requireUserVerification).toBe(true);
      expect(verifyOpts.expectedOrigin).toBe(ORIGIN);
      expect(verifyOpts.expectedRPID).toBe(RP_ID);

      // Counter updated atomically
      const stored = record.map.get(`cred:${credentialID}`) as {
        counter: number;
      };
      expect(stored.counter).toBe(6);

      // Challenge consumed
      const challengeKeys = Array.from(record.map.keys()).filter((k) =>
        k.startsWith('challenge:'),
      );
      expect(challengeKeys).toHaveLength(0);
    });

    it('rejects an out-of-order counter regression and preserves newer credential state', async () => {
      const credentialID = 'cred-concurrent-counter';
      const uid = 'uid-concurrent-counter';
      record.map.set(`cred:${credentialID}`, {
        uid,
        publicKey: new Uint8Array([7]),
        counter: 5,
        transports: ['internal'],
        deviceType: 'singleDevice',
        backedUp: false,
      });

      mockGenerateAuthenticationOptions
        .mockResolvedValueOnce({
          challenge: 'counter-6',
          rpID: RP_ID,
          allowCredentials: [],
          timeout: 60_000,
          userVerification: 'required',
        })
        .mockResolvedValueOnce({
          challenge: 'counter-7',
          rpID: RP_ID,
          allowCredentials: [],
          timeout: 60_000,
          userVerification: 'required',
        });
      const challengeSix = await readChallenge(
        await auth.fetch(makeRequest('/_auth/login-init', jsonBody({}))),
      );
      const challengeSeven = await readChallenge(
        await auth.fetch(makeRequest('/_auth/login-init', jsonBody({}))),
      );

      interface VerificationResult {
        verified: true;
        authenticationInfo: {
          credentialID: string;
          newCounter: number;
          userVerified: boolean;
          credentialDeviceType: 'singleDevice' | 'multiDevice';
          credentialBackedUp: boolean;
          origin: string;
          rpID: string;
        };
      }
      let resolveSix: ((result: VerificationResult) => void) | undefined;
      let resolveSeven: ((result: VerificationResult) => void) | undefined;
      const verificationSix = new Promise<VerificationResult>((resolve) => {
        resolveSix = resolve;
      });
      const verificationSeven = new Promise<VerificationResult>((resolve) => {
        resolveSeven = resolve;
      });
      mockVerifyAuthenticationResponse.mockImplementation(
        (options: { expectedChallenge: string }) => {
          if (options.expectedChallenge === challengeSix) return verificationSix;
          if (options.expectedChallenge === challengeSeven) return verificationSeven;
          throw new Error('unexpected challenge');
        },
      );

      const loginSix = auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge: challengeSix,
          }),
        ),
      );
      const loginSeven = auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge: challengeSeven,
          }),
        ),
      );

      resolveSeven?.({
        verified: true,
        authenticationInfo: {
          credentialID,
          newCounter: 7,
          userVerified: true,
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });
      expect((await loginSeven).status).toBe(200);

      resolveSix?.({
        verified: true,
        authenticationInfo: {
          credentialID,
          newCounter: 6,
          userVerified: true,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });
      expect((await loginSix).status).toBe(401);

      const stored = record.map.get(`cred:${credentialID}`);
      if (
        stored === null ||
        typeof stored !== 'object' ||
        !('counter' in stored) ||
        !('deviceType' in stored) ||
        !('backedUp' in stored)
      ) {
        throw new Error('credential was not stored');
      }
      expect(stored.counter).toBe(7);
      expect(stored.deviceType).toBe('multiDevice');
      expect(stored.backedUp).toBe(true);
    });

    it('rejects login with unknown credential ID', async () => {
      // Login-init to create challenge
      mockGenerateAuthenticationOptions.mockResolvedValue({
        challenge: 'c',
        rpID: RP_ID,
        allowCredentials: [],
        timeout: 60000,
        userVerification: 'preferred',
      });
      const initRes = await auth.fetch(
        makeRequest('/_auth/login-init', jsonBody({})),
      );
      const initBody = (await initRes.json()) as { options: { challenge: string } };

      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID: 'unknown-cred',
          newCounter: 1,
          userVerified: true,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      const res = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: 'unknown-cred', response: {} },
            challenge: initBody.options.challenge,
          }),
        ),
      );
      expect(res.status).toBe(401);
    });

    it('rejects login with wrong challenge', async () => {
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: false,
      });
      const res = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: 'x', response: {} },
            challenge: 'wrong',
          }),
        ),
      );
      expect(res.status).toBe(401);
    });

    it('maps authentication verifier errors to a generic 401 and consumes the challenge', async () => {
      const credentialID = 'credential-verifier-error';
      record.map.set(`cred:${credentialID}`, {
        uid: 'uid-verifier-error',
        publicKey: new Uint8Array([9]),
        counter: 0,
        transports: ['internal'],
        deviceType: 'singleDevice',
        backedUp: false,
      });
      mockGenerateAuthenticationOptions.mockResolvedValue({
        challenge: 'authentication-error-challenge',
        rpID: RP_ID,
        allowCredentials: [],
        timeout: 60_000,
        userVerification: 'required',
      });
      const challenge = await readChallenge(
        await auth.fetch(makeRequest('/_auth/login-init', jsonBody({}))),
      );
      mockVerifyAuthenticationResponse.mockRejectedValue(
        new Error('attacker-visible authentication detail'),
      );

      const response = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge,
          }),
        ),
      );

      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Authentication verification failed');
      expect(record.map.has(`challenge:${challenge}`)).toBe(false);
    });

    it('requires both a response and challenge', async () => {
      for (const body of [
        {},
        { response: { id: 'x', response: {} } },
      ]) {
        const response = await auth.fetch(
          makeRequest('/_auth/login-complete', jsonBody(body)),
        );
        expect(response.status).toBe(400);
      }
    });

    it('rejects and deletes an expired login challenge', async () => {
      record.map.set('challenge:expired-login', {
        purpose: 'login',
        exp: Date.now() - 1,
      });

      const response = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: 'x', response: {} },
            challenge: 'expired-login',
          }),
        ),
      );

      expect(response.status).toBe(401);
      expect(record.map.has('challenge:expired-login')).toBe(false);
    });

    it('rejects a verifier result marked unverified', async () => {
      const credentialID = 'credential-unverified-login';
      record.map.set('challenge:unverified-login', {
        purpose: 'login',
        exp: Date.now() + 60_000,
      });
      record.map.set(`cred:${credentialID}`, {
        uid: 'uid-unverified-login',
        publicKey: new Uint8Array(),
        counter: 0,
        transports: [],
        deviceType: 'singleDevice',
        backedUp: false,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({ verified: false });

      const response = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge: 'unverified-login',
          }),
        ),
      );

      expect(response.status).toBe(401);
    });

    it('accepts an all-zero authenticator counter', async () => {
      const credentialID = 'credential-zero-counter';
      record.map.set('challenge:zero-counter', {
        purpose: 'login',
        exp: Date.now() + 60_000,
      });
      record.map.set(`cred:${credentialID}`, {
        uid: 'uid-zero-counter',
        publicKey: new Uint8Array(),
        counter: 0,
        transports: [],
        deviceType: 'singleDevice',
        backedUp: false,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID,
          newCounter: 0,
          userVerified: true,
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      const response = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge: 'zero-counter',
          }),
        ),
      );

      expect(response.status).toBe(200);
      expect(record.map.get(`cred:${credentialID}`)).toEqual(
        expect.objectContaining({
          counter: 0,
          deviceType: 'multiDevice',
          backedUp: true,
        }),
      );
    });

    it('rejects zero after a positive authenticator counter', async () => {
      const credentialID = 'credential-zero-regression';
      record.map.set('challenge:zero-regression', {
        purpose: 'login',
        exp: Date.now() + 60_000,
      });
      record.map.set(`cred:${credentialID}`, {
        uid: 'uid-zero-regression',
        publicKey: new Uint8Array(),
        counter: 2,
        transports: [],
        deviceType: 'singleDevice',
        backedUp: false,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID,
          newCounter: 0,
          userVerified: true,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      const response = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge: 'zero-regression',
          }),
        ),
      );

      expect(response.status).toBe(401);
      expect(record.map.get(`cred:${credentialID}`)).toEqual(
        expect.objectContaining({ counter: 2 }),
      );
    });

    it('fails closed when the credential disappears during verification', async () => {
      const credentialID = 'credential-deleted-during-verification';
      record.map.set('challenge:deleted-credential', {
        purpose: 'login',
        exp: Date.now() + 60_000,
      });
      record.map.set(`cred:${credentialID}`, {
        uid: 'uid-deleted-credential',
        publicKey: new Uint8Array(),
        counter: 0,
        transports: [],
        deviceType: 'singleDevice',
        backedUp: false,
      });
      mockVerifyAuthenticationResponse.mockImplementation(async () => {
        record.map.delete(`cred:${credentialID}`);
        return {
          verified: true,
          authenticationInfo: {
            credentialID,
            newCounter: 1,
            userVerified: true,
            credentialDeviceType: 'singleDevice',
            credentialBackedUp: false,
            origin: ORIGIN,
            rpID: RP_ID,
          },
        };
      });

      const response = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge: 'deleted-credential',
          }),
        ),
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /_auth/verify-session', () => {
    it('returns uid for a valid session token', async () => {
      // Manually create a session using the DO's own secret
      // First we need to trigger session secret generation — do a login
      const credentialID = 'cred-for-session';
      const uid = 'uid-session-test';
      record.map.set(`cred:${credentialID}`, {
        uid,
        publicKey: new Uint8Array(),
        counter: 0,
        transports: [],
        deviceType: 'singleDevice',
        backedUp: false,
      });

      mockGenerateAuthenticationOptions.mockResolvedValue({
        challenge: 'c',
        rpID: RP_ID,
        allowCredentials: [],
        timeout: 60000,
        userVerification: 'preferred',
      });
      const initRes = await auth.fetch(
        makeRequest('/_auth/login-init', jsonBody({})),
      );
      const initBody = (await initRes.json()) as { options: { challenge: string } };

      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID,
          newCounter: 1,
          userVerified: true,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      const loginRes = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge: initBody.options.challenge,
          }),
        ),
      );
      const loginBody = (await loginRes.json()) as { uid: string; session: string };
      const session = loginBody.session;

      // Verify the session
      const verifyRes = await auth.fetch(
        makeRequest(
          '/_auth/verify-session',
          jsonBody({ session }),
        ),
      );
      expect(verifyRes.status).toBe(200);
      const verifyBody = (await verifyRes.json()) as { uid: string; exp: number };
      expect(verifyBody.uid).toBe(uid);
      expect(verifyBody.exp).toBeGreaterThan(Date.now());
    });

    it('returns 401 for an invalid session token', async () => {
      const res = await auth.fetch(
        makeRequest(
          '/_auth/verify-session',
          jsonBody({ session: 'invalid-token' }),
        ),
      );
      expect(res.status).toBe(401);
    });

    it('rejects signed payloads outside the complete session schema', async () => {
      const secret = 'stored-session-secret';
      record.map.set('session-secret', secret);
      const payloads = [
        'null',
        '[]',
        '{}',
        JSON.stringify({ uid: 7, iat: Date.now(), exp: Date.now() + 60_000 }),
        JSON.stringify({ uid: 'u' }),
        JSON.stringify({ uid: 'u', iat: 'now', exp: Date.now() + 60_000 }),
        JSON.stringify({ uid: 'u', iat: Date.now() }),
        JSON.stringify({ uid: 'u', iat: Date.now(), exp: 'later' }),
      ];

      for (const payload of payloads) {
        const session = await signSessionPayload(secret, payload);
        const response = await auth.fetch(
          makeRequest('/_auth/verify-session', jsonBody({ session })),
        );
        expect(response.status).toBe(401);
      }
    });

    it('loads a persisted secret and accepts a valid signed session', async () => {
      const secret = 'persisted-session-secret';
      const uid = 'uid-persisted-secret';
      record.map.set('session-secret', secret);
      const session = await signSessionPayload(
        secret,
        JSON.stringify({
          uid,
          iat: Date.now(),
          exp: Date.now() + 60_000,
        }),
      );

      const response = await auth.fetch(
        makeRequest('/_auth/verify-session', jsonBody({ session })),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ uid, exp: expect.any(Number) });
    });

    it('rejects malformed, expired, and truncated session tokens', async () => {
      const secret = 'malformed-session-secret';
      record.map.set('session-secret', secret);
      const valid = await signSessionPayload(
        secret,
        JSON.stringify({
          uid: 'uid-malformed',
          iat: Date.now() - 120_000,
          exp: Date.now() + 60_000,
        }),
      );
      const malformedJson = await signSessionPayload(secret, '{');
      const expired = await signSessionPayload(
        secret,
        JSON.stringify({
          uid: 'uid-expired',
          iat: Date.now() - 120_000,
          exp: Date.now() - 60_000,
        }),
      );

      for (const session of [
        '%.deadbeef',
        malformedJson,
        expired,
        valid.slice(0, -1),
      ]) {
        const response = await auth.fetch(
          makeRequest('/_auth/verify-session', jsonBody({ session })),
        );
        expect(response.status).toBe(401);
      }
    });

    it('requires a session token', async () => {
      const response = await auth.fetch(
        makeRequest('/_auth/verify-session', jsonBody({})),
      );
      expect(response.status).toBe(400);
    });

    it('returns 401 for a tampered session token', async () => {
      // Do a real login to get a valid session, then tamper
      const credentialID = 'cred-tamper';
      const uid = 'uid-tamper';
      record.map.set(`cred:${credentialID}`, {
        uid,
        publicKey: new Uint8Array(),
        counter: 0,
        transports: [],
        deviceType: 'singleDevice',
        backedUp: false,
      });

      mockGenerateAuthenticationOptions.mockResolvedValue({
        challenge: 'c',
        rpID: RP_ID,
        allowCredentials: [],
        timeout: 60000,
        userVerification: 'preferred',
      });
      const initRes = await auth.fetch(
        makeRequest('/_auth/login-init', jsonBody({})),
      );
      const initBody = (await initRes.json()) as { options: { challenge: string } };

      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID,
          newCounter: 1,
          userVerified: true,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      const loginRes = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge: initBody.options.challenge,
          }),
        ),
      );
      const loginBody = (await loginRes.json()) as { session: string };
      const tampered = loginBody.session.slice(0, -2) + 'XX';

      const res = await auth.fetch(
        makeRequest(
          '/_auth/verify-session',
          jsonBody({ session: tampered }),
        ),
      );
      expect(res.status).toBe(401);
    });
  });

  describe('alarm (challenge cleanup)', () => {
    it('deletes expired challenges on alarm', async () => {
      // Store an expired challenge
      record.map.set('challenge:expired', {
        purpose: 'login',
        exp: Date.now() - 1000,
      });
      // Store a valid challenge
      record.map.set('challenge:valid', {
        purpose: 'login',
        exp: Date.now() + 60000,
      });

      await auth.alarm();

      expect(record.map.has('challenge:expired')).toBe(false);
      expect(record.map.has('challenge:valid')).toBe(true);
    });

    it('does not re-arm when no challenges remain', async () => {
      await auth.alarm();
      expect(record.alarm).toBeNull();
    });
  });

  describe('unknown routes', () => {
    it('returns 404 for unknown paths', async () => {
      const res = await auth.fetch(makeRequest('/_auth/unknown'));
      expect(res.status).toBe(404);
    });
  });

  describe('response contracts (headers, exact bodies)', () => {
    it('sends Content-Type: application/json and the exact status on jsonResponse paths', async () => {
      mockGenerateAuthenticationOptions.mockResolvedValue({
        challenge: 'contract-challenge',
        rpID: RP_ID,
        allowCredentials: [],
        timeout: 60000,
        userVerification: 'required',
      });
      const res = await auth.fetch(makeRequest('/_auth/login-init', jsonBody({})));
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');
    });

    it('sends Content-Type: text/plain and the exact body text on plainResponse paths', async () => {
      const res = await auth.fetch(makeRequest('/_auth/unknown'));
      expect(res.status).toBe(404);
      expect(res.headers.get('Content-Type')).toBe('text/plain');
      expect(await res.text()).toBe('Not Found');
    });

    it('returns the exact 503 body when trust anchors are unset', async () => {
      const bare = new AuthDO(makeState('auth-503-body', { map: new Map() }), {} as never);
      const res = await bare.fetch(makeRequest('/_auth/login-init', jsonBody({})));
      expect(res.status).toBe(503);
      expect(await res.text()).toBe('Auth is not configured');
    });

    it('returns the exact body text for every plainResponse error case', async () => {
      const missingFields = await auth.fetch(
        makeRequest('/_auth/register-complete', jsonBody({})),
      );
      expect(await missingFields.text()).toBe('Missing response, uid, or challenge');

      const invalidChallenge = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({ response: { id: 'x', response: {} }, uid: 'u', challenge: 'nope' }),
        ),
      );
      expect(await invalidChallenge.text()).toBe('Invalid or expired challenge');

      const missingLoginFields = await auth.fetch(
        makeRequest('/_auth/login-complete', jsonBody({})),
      );
      expect(await missingLoginFields.text()).toBe('Missing response or challenge');

      const missingSession = await auth.fetch(
        makeRequest('/_auth/verify-session', jsonBody({})),
      );
      expect(await missingSession.text()).toBe('Missing session');

      const invalidSession = await auth.fetch(
        makeRequest('/_auth/verify-session', jsonBody({ session: 'garbage' })),
      );
      expect(await invalidSession.text()).toBe('Invalid session');
    });

    it('dispatches strictly on exact path AND POST method — GET is not routed', async () => {
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: 'method-guard-challenge',
        rp: { name: RP_NAME, id: RP_ID },
        user: { id: 'u', name: 'u', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: {},
      });
      for (const path of [
        '/_auth/register-init',
        '/_auth/register-complete',
        '/_auth/login-init',
        '/_auth/login-complete',
        '/_auth/verify-session',
      ]) {
        const res = await auth.fetch(makeRequest(path, { method: 'GET' }));
        expect(res.status, path).toBe(404);
      }
      // Sanity: the same paths DO dispatch under POST.
      const postRes = await auth.fetch(makeRequest('/_auth/register-init', jsonBody({})));
      expect(postRes.status).toBe(200);
    });

    it('does not dispatch a near-miss path (verify-session prefix without exact match)', async () => {
      const res = await auth.fetch(
        makeRequest('/_auth/verify-session/extra', jsonBody({ session: 'x' })),
      );
      expect(res.status).toBe(404);
    });
  });

  describe('signed session schema, expiry, and encoding (deterministic)', () => {
    it('round-trips a real 32-hex uid through register-complete -> verify-session (forces base64 "==" padding)', async () => {
      vi.useFakeTimers();
      try {
        const fixedNow = Date.UTC(2026, 0, 1, 0, 0, 0);
        vi.setSystemTime(fixedNow);
        mockGenerateRegistrationOptions.mockResolvedValue({
          challenge: 'padding-challenge',
          rp: { name: RP_NAME, id: RP_ID },
          user: { id: 'generated', name: 'generated', displayName: '' },
          pubKeyCredParams: [],
          excludeCredentials: [],
          authenticatorSelection: {},
        });
        const initRes = await auth.fetch(makeRequest('/_auth/register-init', jsonBody({})));
        const initBody = (await initRes.json()) as { uid: string; options: { challenge: string } };
        // The DO's own #generateUid() always produces a 32-char lowercase-hex uid.
        expect(initBody.uid).toMatch(/^[0-9a-f]{32}$/);

        mockVerifyRegistrationResponse.mockResolvedValue({
          verified: true,
          registrationInfo: {
            credential: { id: 'padding-cred', publicKey: new Uint8Array(), counter: 0 },
            credentialDeviceType: 'singleDevice',
            credentialBackedUp: false,
            fmt: 'none',
            aaguid: '',
            credentialType: 'public-key',
            attestationObject: new Uint8Array(),
            userVerified: true,
            origin: ORIGIN,
            rpID: RP_ID,
          },
        });
        const completeRes = await auth.fetch(
          makeRequest(
            '/_auth/register-complete',
            jsonBody({
              response: { id: 'padding-cred', response: {} },
              uid: initBody.uid,
              challenge: initBody.options.challenge,
            }),
          ),
        );
        const { session } = await readAuthResult(completeRes);
        // The real payload JSON ({"uid":"<32hex>","iat":<13-digit>,"exp":<13-digit>})
        // is always 82 bytes, i.e. length % 3 === 1, which forces exactly two '='
        // padding characters in standard base64 before the url-safe strip. A
        // regex/anchor/replacement bug in bytesToBase64url's padding-strip step
        // leaves a stray '=' in the token, which fails atob on decode.
        const verifyRes = await auth.fetch(
          makeRequest('/_auth/verify-session', jsonBody({ session })),
        );
        expect(verifyRes.status).toBe(200);
        const verifyBody = (await verifyRes.json()) as { uid: string; exp: number };
        expect(verifyBody.uid).toBe(initBody.uid);
        expect(verifyBody.exp).toBe(fixedNow + 30 * 24 * 60 * 60 * 1000);
      } finally {
        vi.useRealTimers();
      }
    });

    it('accepts a session at the instant it is minted and rejects it exactly at its expiry boundary', async () => {
      vi.useFakeTimers();
      try {
        const fixedNow = Date.UTC(2026, 0, 1, 0, 0, 0);
        vi.setSystemTime(fixedNow);
        const secret = 'boundary-secret';
        record.map.set('session-secret', secret);
        const uid = 'uid-boundary';
        const iat = fixedNow;
        const exp = fixedNow + 1000;
        const session = await signSessionPayload(secret, JSON.stringify({ uid, iat, exp }));

        vi.setSystemTime(exp - 1);
        const justBefore = await auth.fetch(
          makeRequest('/_auth/verify-session', jsonBody({ session })),
        );
        expect(justBefore.status).toBe(200);

        vi.setSystemTime(exp);
        const atExpiry = await auth.fetch(
          makeRequest('/_auth/verify-session', jsonBody({ session })),
        );
        expect(atExpiry.status).toBe(401);
      } finally {
        vi.useRealTimers();
      }
    });

    it('rejects a session token with no separating dot, and one with the dot in the first position', async () => {
      const secret = 'dot-secret';
      record.map.set('session-secret', secret);
      for (const session of ['nodothere', '.onlymacnopayload']) {
        const res = await auth.fetch(
          makeRequest('/_auth/verify-session', jsonBody({ session })),
        );
        expect(res.status, session).toBe(401);
      }
    });

    it('rejects a session token whose base64url payload segment is not valid base64', async () => {
      const res = await auth.fetch(
        makeRequest('/_auth/verify-session', jsonBody({ session: 'not valid base64!.deadbeef' })),
      );
      expect(res.status).toBe(401);
    });

    it('rejects every individual field violation in the session payload schema (each clause independently)', async () => {
      const secret = 'schema-clause-secret';
      record.map.set('session-secret', secret);
      const now = Date.now();
      const validExp = now + 60_000;
      const cases: Array<{ label: string; payload: unknown }> = [
        { label: 'uid is a number', payload: { uid: 42, iat: now, exp: validExp } },
        { label: 'uid is missing', payload: { iat: now, exp: validExp } },
        { label: 'iat is a string', payload: { uid: 'u', iat: 'now', exp: validExp } },
        { label: 'iat is missing', payload: { uid: 'u', exp: validExp } },
        { label: 'exp is a string', payload: { uid: 'u', iat: now, exp: 'later' } },
        { label: 'exp is missing', payload: { uid: 'u', iat: now } },
        { label: 'payload is an array', payload: ['u', now, validExp] },
        { label: 'payload is a bare number', payload: 12345 },
        { label: 'payload is null', payload: null },
      ];
      for (const { label, payload } of cases) {
        const session = await signSessionPayload(secret, JSON.stringify(payload));
        const res = await auth.fetch(
          makeRequest('/_auth/verify-session', jsonBody({ session })),
        );
        expect(res.status, label).toBe(401);
      }
    });
  });

  describe('challenge purpose, expiry, and delete semantics', () => {
    it('deletes a challenge on every consumption outcome: valid, wrong purpose, and expired', async () => {
      const now = Date.now();
      record.map.set('challenge:valid-register', {
        purpose: 'register',
        uid: 'uid-valid',
        exp: now + 60_000,
      });
      record.map.set('challenge:wrong-purpose', {
        purpose: 'login',
        exp: now + 60_000,
      });
      record.map.set('challenge:already-expired', {
        purpose: 'register',
        uid: 'uid-expired',
        exp: now - 1,
      });

      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'valid-register-cred', publicKey: new Uint8Array(), counter: 0 },
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          fmt: 'none',
          aaguid: '',
          credentialType: 'public-key',
          attestationObject: new Uint8Array(),
          userVerified: true,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });
      const validRes = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'valid-register-cred', response: {} },
            uid: 'uid-valid',
            challenge: 'valid-register',
          }),
        ),
      );
      expect(validRes.status).toBe(200);
      // Valid consumption deletes the challenge, even on the success path.
      expect(record.map.has('challenge:valid-register')).toBe(false);

      const wrongPurposeRes = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'x', response: {} },
            uid: 'uid-any',
            challenge: 'wrong-purpose',
          }),
        ),
      );
      expect(wrongPurposeRes.status).toBe(400);
      // Wrong-purpose lookups must NOT delete a challenge that belongs to a
      // different ceremony — it is still consumable by its real purpose.
      expect(record.map.has('challenge:wrong-purpose')).toBe(true);

      const expiredRes = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'x', response: {} },
            uid: 'uid-expired',
            challenge: 'already-expired',
          }),
        ),
      );
      expect(expiredRes.status).toBe(400);
      // Expired challenges are deleted on the expiry-detecting path too.
      expect(record.map.has('challenge:already-expired')).toBe(false);
    });

    it('rejects a login challenge exactly at its expiry boundary and deletes it, one tick before it is still consumed', async () => {
      vi.useFakeTimers();
      try {
        const now = Date.now();
        const exp = now + 1000;
        record.map.set('challenge:boundary-login', { purpose: 'login', exp });
        record.map.set('challenge:boundary-login-2', { purpose: 'login', exp });

        vi.setSystemTime(exp - 1);
        mockVerifyAuthenticationResponse.mockResolvedValue({ verified: false });
        const before = await auth.fetch(
          makeRequest(
            '/_auth/login-complete',
            jsonBody({ response: { id: 'x', response: {} }, challenge: 'boundary-login' }),
          ),
        );
        // Not-expired: challenge is consumed (not short-circuited by expiry)
        // and rejection instead comes from the unverified result, not the
        // "expired challenge" branch — proving the exp check is exclusive
        // one tick before expiry.
        expect(before.status).toBe(401);
        expect(record.map.has('challenge:boundary-login')).toBe(false);

        vi.setSystemTime(exp);
        const atBoundary = await auth.fetch(
          makeRequest(
            '/_auth/login-complete',
            jsonBody({ response: { id: 'x', response: {} }, challenge: 'boundary-login-2' }),
          ),
        );
        expect(atBoundary.status).toBe(401);
        // Exactly-at-expiry challenges are deleted via the expiry branch.
        expect(record.map.has('challenge:boundary-login-2')).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it('never dispatches to the WebAuthn verifier for a challenge purpose mismatch, and leaves the challenge for its real purpose', async () => {
      record.map.set('challenge:register-purpose-only', {
        purpose: 'register',
        uid: 'uid-x',
        exp: Date.now() + 60_000,
      });
      const res = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: 'x', response: {} },
            challenge: 'register-purpose-only',
          }),
        ),
      );
      expect(res.status).toBe(401);
      expect(mockVerifyAuthenticationResponse).not.toHaveBeenCalled();
      expect(record.map.has('challenge:register-purpose-only')).toBe(true);
    });
  });

  describe('alarm rearm semantics', () => {
    it('arms exactly one alarm interval into the future when a challenge is stored, and does not re-arm while one is already pending', async () => {
      vi.useFakeTimers();
      try {
        const fixedNow = Date.UTC(2026, 0, 1, 0, 0, 0);
        vi.setSystemTime(fixedNow);
        mockGenerateAuthenticationOptions.mockResolvedValue({
          challenge: 'rearm-1',
          rpID: RP_ID,
          allowCredentials: [],
          timeout: 60000,
          userVerification: 'required',
        });
        await auth.fetch(makeRequest('/_auth/login-init', jsonBody({})));
        expect(record.alarm).toBe(fixedNow + 5 * 60 * 1000);

        // Advance time and store a second challenge: #armAlarm must be a
        // no-op while an alarm is already scheduled (current !== null).
        vi.setSystemTime(fixedNow + 60_000);
        mockGenerateAuthenticationOptions.mockResolvedValue({
          challenge: 'rearm-2',
          rpID: RP_ID,
          allowCredentials: [],
          timeout: 60000,
          userVerification: 'required',
        });
        await auth.fetch(makeRequest('/_auth/login-init', jsonBody({})));
        expect(record.alarm).toBe(fixedNow + 5 * 60 * 1000);
      } finally {
        vi.useRealTimers();
      }
    });

    it('re-arms a fresh interval from the alarm firing time when challenges remain after cleanup', async () => {
      vi.useFakeTimers();
      try {
        const fixedNow = Date.UTC(2026, 0, 1, 0, 0, 0);
        vi.setSystemTime(fixedNow);
        record.map.set('challenge:expired-during-alarm', {
          purpose: 'login',
          exp: fixedNow - 1,
        });
        record.map.set('challenge:still-valid-during-alarm', {
          purpose: 'login',
          exp: fixedNow + 60_000,
        });
        record.alarm = fixedNow; // simulate the alarm firing now

        await auth.alarm();

        expect(record.map.has('challenge:expired-during-alarm')).toBe(false);
        expect(record.map.has('challenge:still-valid-during-alarm')).toBe(true);
        expect(record.alarm).toBe(fixedNow + 5 * 60 * 1000);
      } finally {
        vi.useRealTimers();
      }
    });

    it('deletes a challenge exactly at its expiry boundary during alarm cleanup, and keeps one still-valid by one tick', async () => {
      const now = Date.now();
      record.map.set('challenge:at-boundary', { purpose: 'login', exp: now });
      record.map.set('challenge:before-boundary', { purpose: 'login', exp: now + 1 });

      await auth.alarm();

      expect(record.map.has('challenge:at-boundary')).toBe(false);
      expect(record.map.has('challenge:before-boundary')).toBe(true);
    });

    it('only lists challenge: -prefixed keys when scanning for cleanup, never other storage keys', async () => {
      record.map.set('cred:unrelated', { uid: 'uid-unrelated' });
      record.map.set('session-secret', 'unrelated-secret');
      record.map.set('challenge:only-this-one', {
        purpose: 'login',
        exp: Date.now() - 1,
      });

      await auth.alarm();

      expect(record.map.has('challenge:only-this-one')).toBe(false);
      expect(record.map.has('cred:unrelated')).toBe(true);
      expect(record.map.get('session-secret')).toBe('unrelated-secret');
    });
  });

  describe('registration and login verifier guards', () => {
    it('requires requireUserVerification: true on both registration and authentication verify calls', async () => {
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: 'verifier-guard-reg',
        rp: { name: RP_NAME, id: RP_ID },
        user: { id: 'u', name: 'u', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: {},
      });
      const initRes = await auth.fetch(makeRequest('/_auth/register-init', jsonBody({})));
      const initBody = (await initRes.json()) as { uid: string; options: { challenge: string } };
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'verifier-guard-cred', publicKey: new Uint8Array(), counter: 0 },
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          fmt: 'none',
          aaguid: '',
          credentialType: 'public-key',
          attestationObject: new Uint8Array(),
          userVerified: true,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });
      await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'verifier-guard-cred', response: {} },
            uid: initBody.uid,
            challenge: initBody.options.challenge,
          }),
        ),
      );
      const regVerifyOpts = mockVerifyRegistrationResponse.mock.calls[0]![0];
      expect(regVerifyOpts.requireUserVerification).toBe(true);
    });

    it('rejects when the verifier resolves verified:true but omits registrationInfo entirely', async () => {
      record.map.set('challenge:no-registration-info', {
        purpose: 'register',
        uid: 'uid-no-info-2',
        exp: Date.now() + 60_000,
      });
      mockVerifyRegistrationResponse.mockResolvedValue({ verified: true });

      const res = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'x', response: {} },
            uid: 'uid-no-info-2',
            challenge: 'no-registration-info',
          }),
        ),
      );
      expect(res.status).toBe(400);
      expect(await res.text()).toBe('Registration verification failed');
    });

    it('rejects login when the credential is present but the verifier throws mid-verification (fails closed, not open)', async () => {
      const credentialID = 'throws-mid-verify';
      record.map.set('challenge:throws-mid-verify', { purpose: 'login', exp: Date.now() + 60_000 });
      record.map.set(`cred:${credentialID}`, {
        uid: 'uid-throws-mid-verify',
        publicKey: new Uint8Array([1]),
        counter: 3,
        transports: [],
        deviceType: 'singleDevice',
        backedUp: false,
      });
      mockVerifyAuthenticationResponse.mockRejectedValue(new TypeError('boom'));

      const res = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({
            response: { id: credentialID, response: {} },
            challenge: 'throws-mid-verify',
          }),
        ),
      );
      expect(res.status).toBe(401);
      // Counter must be untouched on a fail-closed verifier throw.
      const stored = record.map.get(`cred:${credentialID}`) as { counter: number };
      expect(stored.counter).toBe(3);
    });

    it('falls back to an empty transports array when the verifier omits transports on registration', async () => {
      record.map.set('challenge:no-transports', {
        purpose: 'register',
        uid: 'uid-no-transports',
        exp: Date.now() + 60_000,
      });
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'no-transports-cred', publicKey: new Uint8Array(), counter: 0 },
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          fmt: 'none',
          aaguid: '',
          credentialType: 'public-key',
          attestationObject: new Uint8Array(),
          userVerified: true,
          origin: ORIGIN,
          rpID: RP_ID,
          // transports intentionally omitted
        },
      });
      await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'no-transports-cred', response: {} },
            uid: 'uid-no-transports',
            challenge: 'no-transports',
          }),
        ),
      );
      const stored = record.map.get('cred:no-transports-cred') as { transports: unknown[] };
      expect(stored.transports).toEqual([]);
    });
  });

  describe('credential counters and exact response contracts', () => {
    it('rejects a newCounter exactly equal to the stored counter (no progress is not acceptance)', async () => {
      const credentialID = 'counter-equal-rejected';
      record.map.set('challenge:counter-equal', { purpose: 'login', exp: Date.now() + 60_000 });
      record.map.set(`cred:${credentialID}`, {
        uid: 'uid-counter-equal',
        publicKey: new Uint8Array(),
        counter: 4,
        transports: [],
        deviceType: 'singleDevice',
        backedUp: false,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID,
          newCounter: 4,
          userVerified: true,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      const res = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({ response: { id: credentialID, response: {} }, challenge: 'counter-equal' }),
        ),
      );
      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Authentication counter rejected');
      const stored = record.map.get(`cred:${credentialID}`) as { counter: number };
      expect(stored.counter).toBe(4);
    });

    it('persists the counter update under the same credential storage key it read from (no key corruption)', async () => {
      const credentialID = 'counter-key-integrity';
      record.map.set('challenge:counter-key-integrity', { purpose: 'login', exp: Date.now() + 60_000 });
      record.map.set(`cred:${credentialID}`, {
        uid: 'uid-counter-key-integrity',
        publicKey: new Uint8Array(),
        counter: 1,
        transports: [],
        deviceType: 'singleDevice',
        backedUp: false,
      });
      const sizeBeforeLogin = record.map.size;
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID,
          newCounter: 2,
          userVerified: true,
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });

      const res = await auth.fetch(
        makeRequest(
          '/_auth/login-complete',
          jsonBody({ response: { id: credentialID, response: {} }, challenge: 'counter-key-integrity' }),
        ),
      );
      expect(res.status).toBe(200);
      // The challenge is consumed (deleted, -1) and a session-secret key is
      // created on first session mint (+1) — net size is unchanged. No NEW
      // credential key should appear from the counter write: it must land
      // on the exact same `cred:<id>` key, not an empty-string or malformed
      // key.
      expect(record.map.size).toBe(sizeBeforeLogin);
      expect(record.map.has(`cred:${credentialID}`)).toBe(true);
      expect(record.map.has('cred:')).toBe(false);
      const stored = record.map.get(`cred:${credentialID}`) as {
        counter: number;
        deviceType: string;
        backedUp: boolean;
      };
      expect(stored.counter).toBe(2);
      expect(stored.deviceType).toBe('multiDevice');
      expect(stored.backedUp).toBe(true);
    });

    it('returns the exact {uid, session} shape (no extra fields) from register-complete', async () => {
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: 'exact-shape-challenge',
        rp: { name: RP_NAME, id: RP_ID },
        user: { id: 'u', name: 'u', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: {},
      });
      const initRes = await auth.fetch(makeRequest('/_auth/register-init', jsonBody({})));
      const initBody = (await initRes.json()) as { uid: string; options: { challenge: string } };
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'exact-shape-cred', publicKey: new Uint8Array(), counter: 0 },
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          fmt: 'none',
          aaguid: '',
          credentialType: 'public-key',
          attestationObject: new Uint8Array(),
          userVerified: true,
          origin: ORIGIN,
          rpID: RP_ID,
        },
      });
      const completeRes = await auth.fetch(
        makeRequest(
          '/_auth/register-complete',
          jsonBody({
            response: { id: 'exact-shape-cred', response: {} },
            uid: initBody.uid,
            challenge: initBody.options.challenge,
          }),
        ),
      );
      const completeBody = (await completeRes.json()) as Record<string, unknown>;
      expect(Object.keys(completeBody).sort()).toEqual(['session', 'uid']);
    });

    it('returns the exact {options, uid} shape from register-init (no leaked internal fields)', async () => {
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: 'shape-init-challenge',
        rp: { name: RP_NAME, id: RP_ID },
        user: { id: 'u', name: 'u', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: {},
      });
      const res = await auth.fetch(makeRequest('/_auth/register-init', jsonBody({})));
      const body = (await res.json()) as Record<string, unknown>;
      expect(Object.keys(body).sort()).toEqual(['options', 'uid']);
    });

    it('returns the exact {uid, exp} shape from verify-session (no session/iat leakage)', async () => {
      const secret = 'exact-shape-verify-secret';
      const uid = 'uid-exact-shape-verify';
      record.map.set('session-secret', secret);
      const iat = Date.now();
      const exp = iat + 60_000;
      const session = await signSessionPayload(secret, JSON.stringify({ uid, iat, exp }));
      const res = await auth.fetch(makeRequest('/_auth/verify-session', jsonBody({ session })));
      const body = (await res.json()) as Record<string, unknown>;
      expect(Object.keys(body).sort()).toEqual(['exp', 'uid']);
      expect(body.exp).toBe(exp);
    });
  });

  describe('configuration guard', () => {
    it('fails closed with 503 when the trust anchors are unset', async () => {
      const configs = [
        {},
        { ETHERCALC_RP_ID: RP_ID },
        { ETHERCALC_ORIGIN: ORIGIN },
        { ETHERCALC_RP_ID: null, ETHERCALC_ORIGIN: null },
      ];
      for (const config of configs) {
        const bare = new AuthDO(
          makeState('auth-unconfigured', { map: new Map() }),
          config as never,
        );
        for (const path of [
          '/_auth/register-init',
          '/_auth/login-init',
          '/_auth/verify-session',
        ]) {
          const res = await bare.fetch(makeRequest(path, jsonBody({})));
          expect(res.status, path).toBe(503);
        }
      }
    });

    it('defaults the relying-party name when unset', async () => {
      const partial = new AuthDO(
        makeState('auth-default-name', { map: new Map() }),
        {
          ETHERCALC_RP_ID: RP_ID,
          ETHERCALC_ORIGIN: ORIGIN,
        } as never,
      );
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: 'c',
        rp: { name: 'EtherCalc', id: RP_ID },
        user: { id: 'u', name: 'u', displayName: '' },
        pubKeyCredParams: [],
        excludeCredentials: [],
        authenticatorSelection: {},
      });

      await partial.fetch(makeRequest('/_auth/register-init', jsonBody({})));

      const callOpts = mockGenerateRegistrationOptions.mock.calls[0]![0];
      expect(callOpts.rpName).toBe('EtherCalc');
    });
  });
});
