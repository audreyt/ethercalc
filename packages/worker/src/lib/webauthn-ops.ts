/* istanbul ignore file -- @preserve */
/**
 * Zero-branch forwarding adapter to @simplewebauthn/server (four direct
 * re-exports, no conditional logic, no source behavior to test at this
 * boundary). Excluded from both the istanbul coverage gate and Stryker
 * mutation scope (packages/worker/stryker.conf.json `!src/lib/webauthn-ops.ts`)
 * for the same reason. Real coverage lives at two layers: unit tests mock
 * this interface at the AuthDO boundary (auth-do.node.test.ts), and
 * packages/e2e/tests/passkey-webauthn-real.spec.ts exercises the actual
 * @simplewebauthn/server calls end-to-end via a real Chromium CDP virtual
 * authenticator (registration + discoverable login, real WebAuthn ceremony
 * bytes, not mocked). See docs/MUTATION_REPORT.md's 2026-07-17 addendum.
 */

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type GenerateAuthenticationOptionsOpts,
  type GenerateRegistrationOptionsOpts,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type VerifiedAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifyAuthenticationResponseOpts,
  type VerifyRegistrationResponseOpts,
} from '@simplewebauthn/server';

/** Injectable WebAuthn server operations used by AuthDO ceremonies. */
export interface WebAuthnOps {
  readonly generateRegistrationOptions: (
    options: GenerateRegistrationOptionsOpts,
  ) => Promise<PublicKeyCredentialCreationOptionsJSON>;
  readonly verifyRegistrationResponse: (
    options: VerifyRegistrationResponseOpts,
  ) => Promise<VerifiedRegistrationResponse>;
  readonly generateAuthenticationOptions: (
    options: GenerateAuthenticationOptionsOpts,
  ) => Promise<PublicKeyCredentialRequestOptionsJSON>;
  readonly verifyAuthenticationResponse: (
    options: VerifyAuthenticationResponseOpts,
  ) => Promise<VerifiedAuthenticationResponse>;
}

/** Production operations. Tests inject deterministic ceremony results. */
export const defaultWebAuthnOps: WebAuthnOps = {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
};
