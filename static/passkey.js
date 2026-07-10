/**
 * EtherCalc passkey client (Phase A) — framework-free WebAuthn glue for
 * the landing page (start.html) and the single-sheet page (index.html).
 *
 * Talks to the Worker's `/_auth/*` ceremony routes; the session lives in
 * an HttpOnly `ec_sess` cookie so no token ever touches page JS. When
 * the deployment reports `enabled: false` (no ETHERCALC_AUTH config)
 * this module renders nothing at all.
 */

const enc = {
  toBuffer(base64url) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  },
  fromBuffer(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
};

async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
}

export async function whoami() {
  try {
    const res = await fetch('/_auth/whoami');
    if (!res.ok) return { uid: null, enabled: false };
    return await res.json();
  } catch {
    return { uid: null, enabled: false };
  }
}

/** Usernameless login via a discoverable credential. */
export async function login() {
  const initRes = await postJson('/_auth/login-init', {});
  if (!initRes.ok) throw new Error('login unavailable');
  const { options } = await initRes.json();
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: enc.toBuffer(options.challenge),
      rpId: options.rpId,
      timeout: options.timeout,
      userVerification: options.userVerification,
    },
  });
  const response = {
    id: assertion.id,
    rawId: enc.fromBuffer(assertion.rawId),
    type: assertion.type,
    clientExtensionResults: assertion.getClientExtensionResults(),
    response: {
      clientDataJSON: enc.fromBuffer(assertion.response.clientDataJSON),
      authenticatorData: enc.fromBuffer(assertion.response.authenticatorData),
      signature: enc.fromBuffer(assertion.response.signature),
      userHandle: assertion.response.userHandle
        ? enc.fromBuffer(assertion.response.userHandle)
        : undefined,
    },
  };
  const completeRes = await postJson('/_auth/login-complete', {
    response,
    challenge: options.challenge,
  });
  if (!completeRes.ok) throw new Error('login failed');
  return (await completeRes.json()).uid;
}

/** Create a brand-new passkey identity on this device. */
export async function register() {
  const initRes = await postJson('/_auth/register-init', {});
  if (!initRes.ok) throw new Error('registration unavailable');
  const { options, uid } = await initRes.json();
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: enc.toBuffer(options.challenge),
      rp: options.rp,
      user: {
        id: enc.toBuffer(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName || 'EtherCalc user',
      },
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout,
      attestation: options.attestation,
      authenticatorSelection: options.authenticatorSelection,
      excludeCredentials: (options.excludeCredentials || []).map((c) => ({
        id: enc.toBuffer(c.id),
        type: 'public-key',
        transports: c.transports,
      })),
    },
  });
  const response = {
    id: credential.id,
    rawId: enc.fromBuffer(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
    response: {
      clientDataJSON: enc.fromBuffer(credential.response.clientDataJSON),
      attestationObject: enc.fromBuffer(credential.response.attestationObject),
      transports: credential.response.getTransports
        ? credential.response.getTransports()
        : undefined,
    },
  };
  const completeRes = await postJson('/_auth/register-complete', {
    response,
    uid,
    challenge: options.challenge,
  });
  if (!completeRes.ok) throw new Error('registration failed');
  return (await completeRes.json()).uid;
}

/** Login first; if no credential exists on this device, offer to create one. */
export async function signIn() {
  try {
    return await login();
  } catch {
    if (
      window.confirm(
        'No passkey signed in. Create a new passkey on this device?',
      )
    ) {
      return register();
    }
    throw new Error('sign-in cancelled');
  }
}

export async function logout() {
  await postJson('/_auth/logout', {});
}

function roomEditLocation(room) {
  return `/${encodeURIComponent(room)}/edit`;
}

export async function newPrivateSheet() {
  const res = await postJson('/_/private', {});
  if (res.status === 401) throw new Error('sign in first');
  if (!res.ok) throw new Error('could not create a private sheet');
  const { room } = await res.json();
  window.location.assign(roomEditLocation(room));
}
export async function copyToPrivate(room) {
  const res = await fetch(`/_from/${encodeURIComponent(room)}/private`, {
    method: 'POST',
  });
  if (res.status === 401) throw new Error('sign in first');
  if (res.redirected) {
    window.location.assign(res.url);
    return;
  }
  if (!res.ok) throw new Error('could not copy to a private sheet');
}

/** Room name from the URL, or null on non-sheet pages. */
export function currentRoom(pathname) {
  const match = /^\/(?:_\/)?([^_/][^/]*?)(?:\/(?:edit|view|app))?\/?$/.exec(
    pathname,
  );
  if (!match) return null;
  const room = decodeURIComponent(match[1]);
  return room === '_start' || room === '_new' ? null : room;
}

// ─── Minimal floating UI ────────────────────────────────────────────────

const UI_STYLE =
  'position:fixed;right:12px;bottom:12px;z-index:10000;display:flex;gap:6px;' +
  'align-items:center;font:12px verdana,helvetica,sans-serif;';
const BUTTON_STYLE =
  'padding:4px 10px;border:1px solid #0c3159;border-radius:4px;' +
  'background:#fff;color:#0c3159;cursor:pointer;font:inherit;';

function button(label, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = label;
  el.setAttribute('style', BUTTON_STYLE);
  el.addEventListener('click', () => {
    onClick().catch((err) => window.alert(err.message || String(err)));
  });
  return el;
}

async function mount() {
  const state = await whoami();
  if (!state.enabled) return;
  const bar = document.createElement('div');
  bar.id = 'ec-passkey-bar';
  bar.setAttribute('style', UI_STYLE);
  const room = currentRoom(window.location.pathname);

  if (state.uid) {
    const chip = document.createElement('span');
    chip.textContent = `\u{1F511} ${state.uid.slice(0, 8)}`;
    chip.title = 'Signed in with a passkey';
    bar.appendChild(chip);
    bar.appendChild(
      button('New Private Sheet', async () => {
        await newPrivateSheet();
      }),
    );
    if (room) {
      bar.appendChild(
        button('Copy to Private', async () => {
          await copyToPrivate(room);
        }),
      );
    }
    bar.appendChild(
      button('Sign out', async () => {
        await logout();
        window.location.reload();
      }),
    );
  } else {
    bar.appendChild(
      button('Sign in with Passkey', async () => {
        await signIn();
        if (room) {
          window.location.assign(roomEditLocation(room));
          return;
        }
        window.location.reload();
      }),
    );
  }
  document.body.appendChild(bar);

  // Private-sheet gate: when the sheet itself is unreadable, tell the
  // visitor why the grid stays empty instead of silently spinning.
  if (room) {
    try {
      const probe = await fetch(`/_/${encodeURIComponent(room)}`);
      if (probe.status === 403) {
        const note = document.createElement('div');
        note.setAttribute(
          'style',
          'position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);' +
            'z-index:10001;background:#fff;border:2px solid #0c3159;' +
            'border-radius:8px;padding:24px;text-align:center;' +
            'font:14px verdana,helvetica,sans-serif;max-width:320px;',
        );
        note.textContent = state.uid
          ? 'This is a private sheet. Your passkey does not have access.'
          : 'This is a private sheet. Sign in with your passkey to open it.';
        if (!state.uid) {
          note.appendChild(document.createElement('br'));
          note.appendChild(
            button('Sign in with Passkey', async () => {
              await signIn();
              window.location.assign(roomEditLocation(room));
            }),
          );
        }
        document.body.appendChild(note);
      }
    } catch {
      // Probe is best-effort; the sheet UI handles its own errors.
    }
  }
}

if (typeof document !== 'undefined' && typeof navigator !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mount().catch(() => {});
    });
  } else {
    mount().catch(() => {});
  }
}
