import { describe, it, expect, vi } from 'vitest';

import {
  BindingEmailSender,
  STUB_SENT_MESSAGE,
  StubEmailSender,
  buildMimeEnvelope,
  parseSendemail,
  type SendEmailBinding,
} from '../src/lib/email.ts';

/**
 * Pure-logic tests for `src/lib/email.ts`. 100% istanbul gate.
 */

describe('parseSendemail', () => {
  it('parses canonical sendemail <to> <subject> <body>', () => {
    expect(parseSendemail('sendemail a@b.com Subject Body')).toEqual({
      to: 'a@b.com',
      subject: 'Subject',
      body: 'Body',
    });
  });

  it('decodes %20 into spaces in every field', () => {
    expect(
      parseSendemail('sendemail a%20b@c.com my%20subject the%20body%20text'),
    ).toEqual({
      to: 'a b@c.com',
      subject: 'my subject',
      body: 'the body text',
    });
  });

  it('joins trailing tokens into body with single spaces', () => {
    // Legacy used `parts[3]` only, but real payloads URL-encode spaces;
    // we tolerate raw space-separated bodies by joining with a single
    // space so bytes round-trip.
    expect(parseSendemail('sendemail t s word1 word2 word3')).toEqual({
      to: 't',
      subject: 's',
      body: 'word1 word2 word3',
    });
  });

  it('returns null on non-string input', () => {
    expect(parseSendemail(null as unknown as string)).toBeNull();
    expect(parseSendemail(undefined as unknown as string)).toBeNull();
    expect(parseSendemail(42 as unknown as string)).toBeNull();
  });

  it('returns null on empty / whitespace-only input', () => {
    expect(parseSendemail('')).toBeNull();
    expect(parseSendemail('   ')).toBeNull();
  });

  it('returns null when fewer than 4 tokens', () => {
    expect(parseSendemail('sendemail')).toBeNull();
    expect(parseSendemail('sendemail a@b.com')).toBeNull();
    expect(parseSendemail('sendemail a@b.com subj')).toBeNull();
  });

  it('returns null on a different verb (4+ tokens so length check passes)', () => {
    // Four tokens, non-'sendemail' verb — hits the verb check only.
    expect(parseSendemail('settimetrigger A1 1 2')).toBeNull();
  });
});

describe('StubEmailSender', () => {
  it('returns the legacy success message', async () => {
    const sender = new StubEmailSender();
    const res = await sender.send('a@b.com', 'subj', 'body');
    expect(res).toEqual({ message: STUB_SENT_MESSAGE });
  });

  it('exposes the legacy " [E-mail Sent]" literal', () => {
    expect(STUB_SENT_MESSAGE).toBe(' [E-mail Sent]');
  });
});

describe('buildMimeEnvelope', () => {
  it('builds an RFC822-style envelope with CRLF line endings', () => {
    const raw = buildMimeEnvelope(
      'noreply@example.com',
      'u@example.com',
      'hi',
      'hello',
    );
    expect(raw).toBe(
      [
        'From: noreply@example.com',
        'To: u@example.com',
        'Subject: hi',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'hello',
      ].join('\r\n'),
    );
  });
});

describe('BindingEmailSender', () => {
  it('calls binding.send with from/to/raw and returns success string', async () => {
    const send = vi.fn(async (_msg: unknown) => undefined);
    const binding: SendEmailBinding = { send };
    const sender = new BindingEmailSender(binding, 'noreply@ex.com');
    const res = await sender.send('u@ex.com', 'hi', 'body');
    expect(res).toEqual({ message: STUB_SENT_MESSAGE });
    expect(send).toHaveBeenCalledTimes(1);
    const arg = send.mock.calls[0]![0] as {
      from: string;
      to: string;
      raw: string;
    };
    expect(arg.from).toBe('noreply@ex.com');
    expect(arg.to).toBe('u@ex.com');
    expect(arg.raw).toBe(
      buildMimeEnvelope('noreply@ex.com', 'u@ex.com', 'hi', 'body'),
    );
  });

  it('returns " EMAIL ERROR - <msg>" on binding rejection (Error instance)', async () => {
    const binding: SendEmailBinding = {
      send: vi.fn(async () => {
        throw new Error('boom');
      }),
    };
    const sender = new BindingEmailSender(binding, 'f@ex.com');
    const res = await sender.send('t@ex.com', 's', 'b');
    expect(res).toEqual({ message: ' EMAIL ERROR - boom' });
  });

  it('returns " EMAIL ERROR - <String(err)>" on non-Error rejection', async () => {
    const binding: SendEmailBinding = {
      send: vi.fn(async () => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'nope';
      }),
    };
    const sender = new BindingEmailSender(binding, 'f@ex.com');
    const res = await sender.send('t@ex.com', 's', 'b');
    expect(res).toEqual({ message: ' EMAIL ERROR - nope' });
  });
});
