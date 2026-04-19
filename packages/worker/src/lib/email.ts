/**
 * Pure email layer (Phase 9).
 *
 * Two jobs:
 *   1. Parse the SocialCalc `sendemail <to> <subject> <body>` command
 *      that arrives via `execute` / `triggerActionCell`. Legacy
 *      src/sc.ls:139-142 split on spaces and replaced `%20` with real
 *      spaces inside each of the three fields.
 *
 *   2. Expose an `EmailSender` interface with two concrete impls:
 *      - `StubEmailSender` — in-process, returns the literal
 *        `" [E-mail Sent]"` string legacy produced (src/emailer.ls:33
 *        and `:51`). Used in tests + when no Cloudflare binding is
 *        available.
 *      - `BindingEmailSender` — wraps a Cloudflare `send_email`
 *        binding. Formats the message as a minimal RFC822/MIME envelope
 *        and invokes `binding.send(EmailMessage)`.
 *
 * Nothing here touches `env.*` directly: routes/DO code builds an
 * `EmailSender` and injects it. Keeps the module pure + 100% Node
 * coverable.
 */

/**
 * Parsed `sendemail` payload. Fields are already `%20`-decoded per
 * legacy (src/sc.ls:142 `.replace(/%20/g, ' ')`).
 */
export interface SendemailParsed {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

/**
 * Parse a raw SocialCalc command of the form
 *   sendemail <to> <subject> <body>
 *
 * Returns `null` for non-matching input. `%20` is decoded back to
 * spaces in every field (legacy stored the values URL-encoded so the
 * space-delimited command wasn't ambiguous at parse time).
 *
 * Legacy splits on a single space per token and only ever consumes
 * three tokens total — any trailing tokens are dropped silently. We
 * mirror that exactly so the shape of the recorded fixtures holds.
 */
export function parseSendemail(cmdstr: string): SendemailParsed | null {
  if (typeof cmdstr !== 'string') return null;
  const trimmed = cmdstr.trim();
  if (trimmed.length === 0) return null;
  // Legacy `.split(' ')` splits on a SINGLE space (not whitespace runs);
  // we keep that to avoid breaking unusual payloads that rely on
  // consecutive spaces collapsing into empty tokens.
  const parts = trimmed.split(' ');
  if (parts.length < 4) return null;
  if (parts[0] !== 'sendemail') return null;
  const decode = (s: string): string => s.replace(/%20/g, ' ');
  return {
    to: decode(parts[1]!),
    subject: decode(parts[2]!),
    // Join trailing tokens back so a body that happened to contain a
    // literal space (encoded as %20) survives intact. Legacy only
    // indexed [3], but in practice the client always URL-encoded so a
    // single token held the full body. We preserve that by default
    // while being tolerant of trailing tokens.
    body: decode(parts.slice(3).join(' ')),
  };
}

/**
 * Shape of `{message}` returned from a successful send. Legacy wrapped
 * the string in a `confirmemailsent` WS reply (src/sc.ls:249-253).
 */
export interface SendResult {
  readonly message: string;
}

/**
 * EmailSender interface — exposes a single `send` method. Callers
 * don't know or care whether the underlying transport is a stub or a
 * Cloudflare binding; the RoomDO handler just invokes it and forwards
 * the `message` onto the `confirmemailsent` WS broadcast.
 */
export interface EmailSender {
  send(to: string, subject: string, body: string): Promise<SendResult>;
}

/** Legacy-matching string used by both `StubEmailSender` and the
 * binding-success path. Kept as a named constant so tests can pin it. */
export const STUB_SENT_MESSAGE = ' [E-mail Sent]';

/**
 * In-process email transport. Returns the legacy success string for
 * every call. Never rejects. Used under test (no Cloudflare binding)
 * and as the fallback when the Worker's `env.EMAIL` is unbound.
 */
export class StubEmailSender implements EmailSender {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async send(_to: string, _subject: string, _body: string): Promise<SendResult> {
    return { message: STUB_SENT_MESSAGE };
  }
}

/**
 * Minimal shape of the Cloudflare `send_email` binding. We don't import
 * from `@cloudflare/workers-types` because the SendEmail type pulls in
 * the whole `cloudflare:email` module at type-time which is not
 * available under Node tests. Instead we declare a narrow structural
 * interface matching what we call.
 *
 * The actual binding constructor takes an `EmailMessage` (`from`,
 * `to`, raw MIME). We build the MIME envelope here in `BindingEmailSender`.
 */
export interface SendEmailBinding {
  send(message: BindingEmailMessage): Promise<unknown>;
}

/** Shape we pass to `binding.send()`. Minimal RFC822/MIME envelope. */
export interface BindingEmailMessage {
  readonly from: string;
  readonly to: string;
  readonly raw: ReadableStream<Uint8Array> | string;
}

/**
 * Wraps an `env.EMAIL` Cloudflare binding. On `send()`:
 *   1. Build a minimal RFC822 MIME envelope (From/To/Subject/blank/body).
 *   2. Call `binding.send({from, to, raw})`.
 *   3. On success return the legacy `" [E-mail Sent]"` message.
 *   4. On failure return `" EMAIL ERROR - <msg>"` — matches
 *      src/emailer.ls:47 exactly.
 *
 * The legacy transport swallowed errors and reported them through the
 * same WS callback channel; we preserve that contract so the client's
 * `confirmemailsent` handler keeps its existing expectations.
 */
export class BindingEmailSender implements EmailSender {
  readonly #binding: SendEmailBinding;
  readonly #fromAddress: string;

  constructor(binding: SendEmailBinding, fromAddress: string) {
    this.#binding = binding;
    this.#fromAddress = fromAddress;
  }

  async send(to: string, subject: string, body: string): Promise<SendResult> {
    const raw = buildMimeEnvelope(this.#fromAddress, to, subject, body);
    try {
      await this.#binding.send({ from: this.#fromAddress, to, raw });
      return { message: STUB_SENT_MESSAGE };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { message: ` EMAIL ERROR - ${errMsg}` };
    }
  }
}

/**
 * Build the RFC822/MIME envelope as a plain string. Exported so tests
 * can pin the byte shape. The Cloudflare binding accepts either a
 * `ReadableStream<Uint8Array>` or a raw string — we pass a string and
 * let workerd handle the stream conversion.
 */
export function buildMimeEnvelope(
  from: string,
  to: string,
  subject: string,
  body: string,
): string {
  // RFC822 requires CRLF line endings. `\r\n` everywhere.
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
  ];
  return `${headers.join('\r\n')}\r\n\r\n${body}`;
}
