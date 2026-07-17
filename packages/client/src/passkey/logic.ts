/**
 * Pure, DOM-free passkey/room-access logic (Phase A → M3E rewrite).
 *
 * No `document`/`window`/`navigator` ambient global access anywhere in this
 * file — every browser capability comes through the injected `host`, so
 * this module is fully testable under Vitest's Node environment (see
 * `vitest.config.ts`: `environment: 'node'`) and never imports `@m3e/web/*`.
 * `src/passkey/ui.ts` is the only place that constructs a real `host` from
 * `window`/`navigator` and the only place that touches the DOM or M3E.
 *
 * Passkeys authenticate an account. RoomDO remains the authorization
 * boundary; the browser consumes only the same-origin capability verdict to
 * choose safe public/private chrome.
 */

/** Browser capabilities this module needs, injected rather than global. */
export interface PasskeyLogicHost {
  readonly fetch: typeof fetch;
  readonly navigator: { readonly credentials: CredentialsContainer };
  readonly location: { readonly pathname: string; readonly assign: (url: string) => void };
}

export interface WhoamiState {
  readonly enabled: boolean;
  readonly uid: string | null;
}

export interface RoomAccessVerdict {
  readonly isPrivate: boolean;
  readonly canRead: boolean;
  readonly canWrite: boolean;
}

const enc = {
  toBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  },
  fromBuffer(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
};

async function postJson(host: PasskeyLogicHost, path: string, body: unknown): Promise<Response> {
  return host.fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function whoami(host: PasskeyLogicHost): Promise<WhoamiState> {
  try {
    const res = await host.fetch('/_auth/whoami');
    if (!res.ok) return { uid: null, enabled: false };
    const state = (await res.json()) as { enabled?: unknown; uid?: unknown };
    return {
      enabled: state?.enabled === true,
      uid: typeof state?.uid === 'string' ? state.uid : null,
    };
  } catch {
    return { uid: null, enabled: false };
  }
}

interface PublicKeyCredentialRequestOptionsJson {
  readonly challenge: string;
  readonly rpId: string;
  readonly timeout: number;
  readonly userVerification: UserVerificationRequirement;
}

interface AuthenticationResponseJson {
  readonly id: string;
  readonly rawId: string;
  readonly type: string;
  readonly clientExtensionResults: AuthenticationExtensionsClientOutputs;
  readonly response: {
    readonly clientDataJSON: string;
    readonly authenticatorData: string;
    readonly signature: string;
    readonly userHandle: string | undefined;
  };
}

/** Usernameless login via a discoverable credential. */
export async function login(host: PasskeyLogicHost): Promise<string> {
  const initRes = await postJson(host, '/_auth/login-init', {});
  if (!initRes.ok) throw new Error('login unavailable');
  const { options } = (await initRes.json()) as { options: PublicKeyCredentialRequestOptionsJson };
  const assertion = (await host.navigator.credentials.get({
    publicKey: {
      challenge: enc.toBuffer(options.challenge),
      rpId: options.rpId,
      timeout: options.timeout,
      userVerification: options.userVerification,
    },
  })) as PublicKeyCredential;
  const authResponse = assertion.response as AuthenticatorAssertionResponse;
  const response: AuthenticationResponseJson = {
    id: assertion.id,
    rawId: enc.fromBuffer(assertion.rawId),
    type: assertion.type,
    clientExtensionResults: assertion.getClientExtensionResults(),
    response: {
      clientDataJSON: enc.fromBuffer(authResponse.clientDataJSON),
      authenticatorData: enc.fromBuffer(authResponse.authenticatorData),
      signature: enc.fromBuffer(authResponse.signature),
      userHandle: authResponse.userHandle ? enc.fromBuffer(authResponse.userHandle) : undefined,
    },
  };
  const completeRes = await postJson(host, '/_auth/login-complete', {
    response,
    challenge: options.challenge,
  });
  if (!completeRes.ok) throw new Error('login failed');
  return ((await completeRes.json()) as { uid: string }).uid;
}

interface PublicKeyCredentialCreationOptionsJson {
  readonly challenge: string;
  readonly rp: { readonly id?: string; readonly name: string };
  readonly user: { readonly id: string; readonly name: string; readonly displayName: string };
  readonly pubKeyCredParams: readonly PublicKeyCredentialParameters[];
  readonly timeout: number;
  readonly attestation: AttestationConveyancePreference;
  readonly authenticatorSelection: AuthenticatorSelectionCriteria;
  readonly excludeCredentials?: readonly { readonly id: string; readonly transports?: readonly AuthenticatorTransport[] }[];
}

interface RegistrationResponseJson {
  readonly id: string;
  readonly rawId: string;
  readonly type: string;
  readonly clientExtensionResults: AuthenticationExtensionsClientOutputs;
  readonly response: {
    readonly clientDataJSON: string;
    readonly attestationObject: string;
    readonly transports: readonly AuthenticatorTransport[] | undefined;
  };
}

/** Create a deliberate, brand-new EtherCalc identity. */
export async function register(host: PasskeyLogicHost): Promise<string> {
  const initRes = await postJson(host, '/_auth/register-init', {});
  if (!initRes.ok) throw new Error('registration unavailable');
  const { options, uid } = (await initRes.json()) as {
    options: PublicKeyCredentialCreationOptionsJson;
    uid: string;
  };
  const credential = (await host.navigator.credentials.create({
    publicKey: {
      challenge: enc.toBuffer(options.challenge),
      rp: options.rp,
      user: {
        id: enc.toBuffer(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName || 'EtherCalc user',
      },
      pubKeyCredParams: [...options.pubKeyCredParams],
      timeout: options.timeout,
      attestation: options.attestation,
      authenticatorSelection: options.authenticatorSelection,
      excludeCredentials: (options.excludeCredentials ?? []).map((credentialInfo) => {
        const transports = credentialInfo.transports as AuthenticatorTransport[] | undefined;
        return {
          id: enc.toBuffer(credentialInfo.id),
          type: 'public-key' as const,
          ...(transports ? { transports } : {}),
        };
      }),
    },
  })) as PublicKeyCredential;
  const attResponse = credential.response as AuthenticatorAttestationResponse;
  const response: RegistrationResponseJson = {
    id: credential.id,
    rawId: enc.fromBuffer(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
    response: {
      clientDataJSON: enc.fromBuffer(attResponse.clientDataJSON),
      attestationObject: enc.fromBuffer(attResponse.attestationObject),
      transports: attResponse.getTransports ? (attResponse.getTransports() as AuthenticatorTransport[]) : undefined,
    },
  };
  const completeRes = await postJson(host, '/_auth/register-complete', {
    response,
    uid,
    challenge: options.challenge,
  });
  if (!completeRes.ok) throw new Error('registration failed');
  return ((await completeRes.json()) as { uid: string }).uid;
}

/** Discoverable sign-in only. Registration is always an explicit choice. */
export async function signIn(host: PasskeyLogicHost): Promise<string> {
  return login(host);
}

export async function logout(host: PasskeyLogicHost): Promise<void> {
  await postJson(host, '/_auth/logout', {});
}

export function roomEditLocation(room: string): string {
  return `/${encodeURIComponent(room)}/edit`;
}

export async function newPrivateSheet(host: PasskeyLogicHost): Promise<void> {
  const res = await postJson(host, '/_/private', {});
  if (res.status === 401) throw new Error('sign in first');
  if (!res.ok) throw new Error('could not create a private sheet');
  const { room } = (await res.json()) as { room: string };
  host.location.assign(roomEditLocation(room));
}

export async function copyToPrivate(host: PasskeyLogicHost, room: string): Promise<void> {
  const res = await host.fetch(`/_from/${encodeURIComponent(room)}/private`, {
    method: 'POST',
  });
  if (res.status === 401) throw new Error('sign in first');
  if (res.redirected) {
    host.location.assign(res.url);
    return;
  }
  if (!res.ok) throw new Error('could not copy to a private sheet');
}

/** Room name from the URL, or null on a non-sheet page. */
export function currentRoom(pathname: string): string | null {
  const match = /^\/(?:_\/)?([^_/][^/]*?)(?:\/(?:edit|view|app))?\/?$/.exec(pathname);
  if (!match?.[1]) return null;
  const room = decodeURIComponent(match[1]);
  return room === '_start' || room === '_new' ? null : room;
}

export async function roomAccess(host: PasskeyLogicHost, room: string): Promise<RoomAccessVerdict | null> {
  try {
    const res = await host.fetch(`/_/${encodeURIComponent(room)}/access`);
    if (!res.ok) return null;
    const verdict = (await res.json()) as unknown;
    if (
      !verdict ||
      typeof verdict !== 'object' ||
      typeof (verdict as RoomAccessVerdict).isPrivate !== 'boolean' ||
      typeof (verdict as RoomAccessVerdict).canRead !== 'boolean' ||
      typeof (verdict as RoomAccessVerdict).canWrite !== 'boolean'
    ) {
      return null;
    }
    return verdict as RoomAccessVerdict;
  } catch {
    return null;
  }
}

/**
 * What to render for a given room capability verdict — the pure decision
 * routing `ui.ts`'s `mount()` follows. `room` is `null` on the landing
 * page (no room in the URL); `verdict` is `null` only when the room
 * exists but the `/access` probe itself failed (network error, non-ok
 * response, or a malformed body) — never a guessed access mode.
 */
export type MountDecision =
  | { readonly kind: 'landing' }
  | { readonly kind: 'private-denied' }
  | { readonly kind: 'public' }
  | { readonly kind: 'private-owner-writable' }
  | { readonly kind: 'private-readable-viewonly' };

export function decideMount(room: string | null, verdict: RoomAccessVerdict | null): MountDecision | null {
  if (!room) return { kind: 'landing' };
  if (!verdict) return null;
  if (!verdict.isPrivate) return { kind: 'public' };
  if (!verdict.canRead) return { kind: 'private-denied' };
  return { kind: verdict.canWrite ? 'private-owner-writable' : 'private-readable-viewonly' };
}
