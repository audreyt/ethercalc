/**
 * AuthDO — singleton Durable Object for WebAuthn passkey authentication.
 *
 * Stores credentials, challenges, and the session-signing secret. The
 * Worker is its own WebAuthn relying party — no third-party auth.
 *
 * Design constraints (from advisory rounds):
 *   - Credentials keyed by credential ID: `cred:<base64url-id>` →
 *     `{uid, publicKey, counter, transports, deviceType, backedUp}`.
 *     No `uid → creds` index (usernameless login derives uid from
 *     `response.id`).
 *   - Registration: server-generated uid, `residentKey: 'required'`,
 *     `userVerification: 'required'`. No caller-chosen uids.
 *   - Login: usernameless — `generateAuthenticationOptions` with no
 *     `allowCredentials`. `loginComplete` loads `cred:<id>` to derive uid.
 *   - Counter updated atomically after successful authentication.
 *   - `origin` and `rpID` are trust anchors read from env, never from
 *     client bodies.
 *   - Session = HMAC(secret) over `uid|iat|exp`, ~30-day.
 *
 * Storage keys:
 *   - `session-secret` — 256-bit random, generated once
 *   - `cred:<base64url-id>` — credential record
 *   - `challenge:<random>` — {purpose, uid?, exp}
 *   - `uid:<uid>` — counter for uid generation (ensures uniqueness)
 */
import {
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
  type WebAuthnCredential,
} from '@simplewebauthn/server';
import {
  defaultWebAuthnOps,
  type WebAuthnOps,
} from './lib/webauthn-ops.ts';

/**
 * Environment for the AuthDO. The Worker passes `ETHERCALC_RP_ID`,
 * `ETHERCALC_RP_NAME`, and `ETHERCALC_ORIGIN` from trusted config —
 * never from client bodies. Standalone workerd delivers unset env vars
 * as `null`, so every field is optional-nullable and `fetch` fails
 * closed when the trust anchors are missing.
 */
export interface AuthEnv {
  readonly ETHERCALC_RP_ID?: string | null;
  readonly ETHERCALC_RP_NAME?: string | null;
  readonly ETHERCALC_ORIGIN?: string | null;
}

/** Validated relying-party trust anchors, derived once per request. */
interface AuthConfig {
  readonly rpID: string;
  readonly rpName: string;
  readonly origin: string;
}

/** Stored credential record, keyed by `cred:<base64url-id>`. */
interface StoredCredential {
  readonly uid: string;
  readonly publicKey: Uint8Array<ArrayBuffer>;
  counter: number;
  readonly transports: NonNullable<WebAuthnCredential['transports']>;
  deviceType: string;
  backedUp: boolean;
}

/** Stored challenge, keyed by `challenge:<random>`. */
interface StoredChallenge {
  readonly purpose: 'register' | 'login';
  readonly uid?: string;
  readonly exp: number;
}

/** Session token payload: HMAC(secret) over `uid|iat|exp`. */
interface SessionPayload {
  readonly uid: string;
  readonly iat: number;
  readonly exp: number;
}

const CHALLENGE_TTL_MS = 120_000; // 2 minutes
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ALARM_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function plainResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}


function bytesToBase64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bytesToHex(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += (b < 0x10 ? '0' : '') + b.toString(16);
  return s;
}

/** HMAC-SHA256 over `message` using `secret` (hex string). Returns hex. */
async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return bytesToHex(new Uint8Array(sig));
}

/** Timing-safe string comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Encode a session payload as `base64url(payload).hmac`. */
function encodeSession(payload: SessionPayload, mac: string): string {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = bytesToBase64url(new TextEncoder().encode(payloadJson));
  return `${payloadB64}.${mac}`;
}

/** Decode and verify a session token. Returns the payload or null. */
async function decodeSession(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const payloadB64 = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  // Recompute MAC over the payload bytes
  let payloadBytes: Uint8Array;
  try {
    const bin = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    payloadBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) payloadBytes[i] = bin.charCodeAt(i);
  } catch {
    return null;
  }
  const expectedMac = await hmacHex(secret, new TextDecoder().decode(payloadBytes));
  if (!timingSafeEqual(expectedMac, mac)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return null;
  }
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    !('uid' in parsed) ||
    typeof parsed.uid !== 'string' ||
    !('iat' in parsed) ||
    typeof parsed.iat !== 'number' ||
    !('exp' in parsed) ||
    typeof parsed.exp !== 'number'
  ) {
    return null;
  }
  if (Date.now() >= parsed.exp) return null;
  return { uid: parsed.uid, iat: parsed.iat, exp: parsed.exp };
}

export class AuthDO implements DurableObject {
  readonly #state: DurableObjectState;
  readonly #env: AuthEnv;
  readonly #ops: WebAuthnOps;
  #sessionSecret: string | null = null;

  constructor(
    state: DurableObjectState,
    env: AuthEnv,
    ops: WebAuthnOps = defaultWebAuthnOps,
  ) {
    this.#state = state;
    this.#env = env;
    this.#ops = ops;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    // Trust anchors come from deploy config, never from clients. A
    // deployment without them cannot verify ceremonies — fail closed
    // before touching any storage.
    const rpID = this.#env.ETHERCALC_RP_ID;
    const origin = this.#env.ETHERCALC_ORIGIN;
    if (!rpID || !origin) {
      return plainResponse('Auth is not configured', 503);
    }
    const config: AuthConfig = {
      rpID,
      origin,
      rpName: this.#env.ETHERCALC_RP_NAME || 'EtherCalc',
    };

    if (path === '/_auth/register-init' && request.method === 'POST') {
      return this.#registerInit(config);
    }
    if (path === '/_auth/register-complete' && request.method === 'POST') {
      return this.#registerComplete(request, config);
    }
    if (path === '/_auth/login-init' && request.method === 'POST') {
      return this.#loginInit(config);
    }
    if (path === '/_auth/login-complete' && request.method === 'POST') {
      return this.#loginComplete(request, config);
    }
    if (path === '/_auth/verify-session' && request.method === 'POST') {
      return this.#verifySession(request);
    }
    return plainResponse('Not Found', 404);
  }

  /** Get or generate the session-signing secret (256-bit hex). */
  async #getSecret(): Promise<string> {
    if (this.#sessionSecret) return this.#sessionSecret;
    const stored = await this.#state.storage.get<string>('session-secret');
    if (typeof stored === 'string' && stored.length > 0) {
      this.#sessionSecret = stored;
      return stored;
    }
    const raw = new Uint8Array(32);
    crypto.getRandomValues(raw);
    const secret = bytesToHex(raw);
    await this.#state.storage.put('session-secret', secret);
    this.#sessionSecret = secret;
    return secret;
  }

  /** Generate a server-unique uid. */
  async #generateUid(): Promise<string> {
    const raw = new Uint8Array(16);
    crypto.getRandomValues(raw);
    return bytesToHex(raw);
  }

  /** Store a challenge and arm the cleanup alarm. */
  async #storeChallenge(
    challenge: string,
    record: StoredChallenge,
  ): Promise<void> {
    await this.#state.storage.put(`challenge:${challenge}`, record);
    await this.#armAlarm();
  }

  /** Find and consume a challenge. Returns the stored record or null. */
  async #consumeChallenge(
    challenge: string,
    purpose: 'register' | 'login',
  ): Promise<StoredChallenge | null> {
    const key = `challenge:${challenge}`;
    const stored = await this.#state.storage.get<StoredChallenge>(key);
    if (stored === undefined || stored === null) return null;
    if (stored.purpose !== purpose) return null;
    if (Date.now() >= stored.exp) {
      await this.#state.storage.delete(key);
      return null;
    }
    await this.#state.storage.delete(key);
    return stored;
  }

  async #armAlarm(): Promise<void> {
    const current = await this.#state.storage.getAlarm();
    if (current !== null) return;
    await this.#state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
  }

  async alarm(): Promise<void> {
    const map = await this.#state.storage.list<StoredChallenge>({
      prefix: 'challenge:',
    });
    const now = Date.now();
    const expired: string[] = [];
    for (const [key, val] of map) {
      if (val.exp <= now) expired.push(key);
    }
    if (expired.length > 0) await this.#state.storage.delete(expired);
    // Re-arm if there are remaining challenges
    const remaining = await this.#state.storage.list({ prefix: 'challenge:', limit: 1 });
    if (remaining.size > 0) {
      await this.#state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
    }
  }

  // ─── Registration ──────────────────────────────────────────────────────

  async #registerInit(config: AuthConfig): Promise<Response> {
    const uid = await this.#generateUid();
    const options = await this.#ops.generateRegistrationOptions({
      rpName: config.rpName,
      rpID: config.rpID,
      userName: uid,
      userID: new TextEncoder().encode(uid),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    });
    await this.#storeChallenge(options.challenge, {
      purpose: 'register',
      uid,
      exp: Date.now() + CHALLENGE_TTL_MS,
    });
    return jsonResponse({ options, uid });
  }

  async #registerComplete(
    request: Request,
    config: AuthConfig,
  ): Promise<Response> {
    const body = (await request.json()) as {
      response?: RegistrationResponseJSON;
      uid?: unknown;
      challenge?: unknown;
    };
    if (!body.response || typeof body.uid !== 'string' || typeof body.challenge !== 'string') {
      return plainResponse('Missing response, uid, or challenge', 400);
    }
    const challengeRecord = await this.#consumeChallenge(body.challenge, 'register');
    if (challengeRecord === null || challengeRecord.uid !== body.uid) {
      return plainResponse('Invalid or expired challenge', 400);
    }
    let verified: VerifiedRegistrationResponse;
    try {
      verified = await this.#ops.verifyRegistrationResponse({
        response: body.response,
        expectedChallenge: body.challenge,
        expectedOrigin: config.origin,
        expectedRPID: config.rpID,
        requireUserVerification: true,
      });
    } catch {
      return plainResponse('Registration verification failed', 400);
    }
    if (!verified.verified || !verified.registrationInfo) {
      return plainResponse('Registration verification failed', 400);
    }
    const info = verified.registrationInfo;
    const credentialID = info.credential.id;
    const existing = await this.#state.storage.get(`cred:${credentialID}`);
    if (existing !== undefined) {
      return plainResponse('Credential already registered', 409);
    }
    const cred: StoredCredential = {
      uid: body.uid,
      publicKey: info.credential.publicKey,
      counter: info.credential.counter,
      transports: info.credential.transports ?? [],
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
    };
    await this.#state.storage.put(`cred:${credentialID}`, cred);
    const session = await this.#createSession(body.uid);
    return jsonResponse({ uid: body.uid, session });
  }

  // ─── Authentication (usernameless) ──────────────────────────────────────

  async #loginInit(config: AuthConfig): Promise<Response> {
    const options = await this.#ops.generateAuthenticationOptions({
      rpID: config.rpID,
      // No allowCredentials — discoverable/usernameless login
      userVerification: 'required',
    });
    await this.#storeChallenge(options.challenge, {
      purpose: 'login',
      exp: Date.now() + CHALLENGE_TTL_MS,
    });
    return jsonResponse({ options });
  }

  async #loginComplete(
    request: Request,
    config: AuthConfig,
  ): Promise<Response> {
    const body = (await request.json()) as {
      response?: AuthenticationResponseJSON;
      challenge?: unknown;
    };
    if (!body.response || typeof body.challenge !== 'string') {
      return plainResponse('Missing response or challenge', 400);
    }
    const challengeRecord = await this.#consumeChallenge(body.challenge, 'login');
    if (challengeRecord === null) {
      return plainResponse('Invalid or expired challenge', 401);
    }
    const credentialID = body.response.id;
    const cred = await this.#state.storage.get<StoredCredential>(`cred:${credentialID}`);
    if (cred === undefined || cred === null) {
      return plainResponse('Unknown credential', 401);
    }
    const webAuthnCred: WebAuthnCredential = {
      id: credentialID,
      publicKey: cred.publicKey,
      counter: cred.counter,
      transports: cred.transports,
    };
    let verified: VerifiedAuthenticationResponse;
    try {
      verified = await this.#ops.verifyAuthenticationResponse({
        response: body.response,
        expectedChallenge: body.challenge,
        expectedOrigin: config.origin,
        expectedRPID: config.rpID,
        credential: webAuthnCred,
        requireUserVerification: true,
      });
    } catch {
      return plainResponse('Authentication verification failed', 401);
    }
    if (!verified.verified) {
      return plainResponse('Authentication verification failed', 401);
    }
    // Replay-safe counter update: reject a newCounter that would regress
    // below the stored value (two concurrent logins can both verify
    // against counter 5, then write 7 followed by 6). The WebAuthn
    // all-zero counter case (authenticator doesn't track usage) is
    // allowed through. Also refresh deviceType/backedUp from the
    // verification result.
    const authInfo = verified.authenticationInfo;
    const counterAccepted = await this.#state.blockConcurrencyWhile(async () => {
      const fresh = await this.#state.storage.get<StoredCredential>(`cred:${credentialID}`);
      if (!fresh) return false;
      const validCounter =
        (fresh.counter === 0 && authInfo.newCounter === 0) ||
        authInfo.newCounter > fresh.counter;
      if (!validCounter) return false;
      fresh.counter = authInfo.newCounter;
      fresh.deviceType = authInfo.credentialDeviceType;
      fresh.backedUp = authInfo.credentialBackedUp;
      await this.#state.storage.put(`cred:${credentialID}`, fresh);
      return true;
    });
    if (!counterAccepted) {
      return plainResponse('Authentication counter rejected', 401);
    }
    const session = await this.#createSession(cred.uid);
    return jsonResponse({ uid: cred.uid, session });
  }

  async #createSession(uid: string): Promise<string> {
    const secret = await this.#getSecret();
    const now = Date.now();
    const payload: SessionPayload = {
      uid,
      iat: now,
      exp: now + SESSION_TTL_MS,
    };
    const mac = await hmacHex(secret, JSON.stringify(payload));
    return encodeSession(payload, mac);
  }

  // ─── Session verification ──────────────────────────────────────────────

  async #verifySession(request: Request): Promise<Response> {
    const body = (await request.json()) as { session?: unknown };
    if (typeof body.session !== 'string') {
      return plainResponse('Missing session', 400);
    }
    const secret = await this.#getSecret();
    const payload = await decodeSession(body.session, secret);
    if (payload === null) {
      return plainResponse('Invalid session', 401);
    }
    return jsonResponse({ uid: payload.uid, exp: payload.exp });
  }
}
