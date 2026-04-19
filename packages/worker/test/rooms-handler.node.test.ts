import { describe, it, expect, vi } from 'vitest';

vi.mock('@ethercalc/socialcalc-headless', () => ({
  // Return a recognisable shape so we can assert it flows through.
  csvToSave: (csv: string) => `SC:${csv}`,
}));

import { classifyRequestBody } from '../src/handlers/rooms.ts';

function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe('classifyRequestBody', () => {
  it('parses JSON body with snapshot string', () => {
    const out = classifyRequestBody(
      'application/json',
      enc('{"snapshot":"save-text"}'),
    );
    expect(out).toEqual({ kind: 'save', snapshot: 'save-text' });
  });

  it('parses JSON with charset param', () => {
    const out = classifyRequestBody(
      'application/json; charset=utf-8',
      enc('{"snapshot":"x"}'),
    );
    expect(out).toEqual({ kind: 'save', snapshot: 'x' });
  });

  it('treats malformed JSON as empty', () => {
    const out = classifyRequestBody('application/json', enc('{not json'));
    expect(out).toEqual({ kind: 'empty' });
  });

  it('treats JSON missing snapshot as empty', () => {
    const out = classifyRequestBody('application/json', enc('{"room":"r"}'));
    expect(out).toEqual({ kind: 'empty' });
  });

  it('treats JSON with non-string snapshot as empty', () => {
    const out = classifyRequestBody(
      'application/json',
      enc('{"snapshot":42}'),
    );
    expect(out).toEqual({ kind: 'empty' });
  });

  it('treats JSON with null payload as empty', () => {
    const out = classifyRequestBody('application/json', enc('null'));
    expect(out).toEqual({ kind: 'empty' });
  });

  it('passes text/x-socialcalc body through as snapshot', () => {
    const out = classifyRequestBody('text/x-socialcalc', enc('sheet:…'));
    expect(out).toEqual({ kind: 'save', snapshot: 'sheet:…' });
  });

  it('passes text/plain body through as snapshot', () => {
    const out = classifyRequestBody('text/plain; charset=utf-8', enc('x'));
    expect(out).toEqual({ kind: 'save', snapshot: 'x' });
  });

  it('empty body on unknown content-type becomes empty', () => {
    const out = classifyRequestBody('text/plain', enc(''));
    expect(out).toEqual({ kind: 'empty' });
  });

  it('converts text/csv to save via csvToSave', () => {
    const out = classifyRequestBody('text/csv', enc('a,b\n1,2'));
    expect(out).toEqual({ kind: 'save', snapshot: 'SC:a,b\n1,2' });
  });

  it('handles text/x-ethercalc-csv-double-encoded', () => {
    // Simple ASCII CSV survives the UTF-8 → Latin-1 → UTF-8 round-trip.
    const out = classifyRequestBody(
      'text/x-ethercalc-csv-double-encoded',
      enc('a,b\n1,2'),
    );
    expect(out).toEqual({ kind: 'save', snapshot: 'SC:a,b\n1,2' });
  });

  it('flags XLSX content types as xlsx-deferred', () => {
    const out1 = classifyRequestBody(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      enc('PK\x03\x04…'),
    );
    const out2 = classifyRequestBody(
      'application/vnd.oasis.opendocument.spreadsheet',
      enc('PK\x03\x04…'),
    );
    expect(out1).toEqual({ kind: 'xlsx-deferred' });
    expect(out2).toEqual({ kind: 'xlsx-deferred' });
  });
});
