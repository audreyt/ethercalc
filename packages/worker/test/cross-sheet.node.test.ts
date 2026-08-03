import { describe, it, expect, vi } from 'vite-plus/test';

import {
  MAX_CROSS_SHEET_NAME_CHARS,
  MAX_CROSS_SHEET_REFS,
  MAX_CROSS_SHEET_SAVE_BYTES,
  MAX_CROSS_SHEET_TOTAL_CHARS,
  extractSheetSave,
  hydrateCrossSheetRefs,
  readBoundedResponseText,
  type CrossSheetSpreadsheet,
} from '../src/lib/cross-sheet.ts';

describe('extractSheetSave', () => {
  it('extracts the sheet body from a full multipart SocialCalc save', () => {
    const full =
      'socialcalc:version:1.0\n' +
      'MIME-Version: 1.0\n' +
      'Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave\n' +
      '--SocialCalcSpreadsheetControlSave\n' +
      'Content-type: text/plain; charset=UTF-8\n' +
      '\n' +
      '# SocialCalc Spreadsheet Control Save\n' +
      'version:1.0\n' +
      'part:sheet\n' +
      '--SocialCalcSpreadsheetControlSave\n' +
      'Content-type: text/plain; charset=UTF-8\n' +
      '\n' +
      'version:1.5\n' +
      'cell:A1:v:1\n' +
      'sheet:c:1:r:1:needsrecalc:no\n' +
      '--SocialCalcSpreadsheetControlSave\n' +
      'more:stuff';
    const extracted = extractSheetSave(full);
    expect(extracted).toContain('version:1.5');
    expect(extracted).toContain('cell:A1:v:1');
    expect(extracted).toContain('sheet:c:1:r:1:needsrecalc:no');
    expect(extracted).not.toContain('more:stuff');
    expect(extracted).not.toContain('# SocialCalc');
  });

  it('passes through a bare sheet save (no MIME envelope)', () => {
    const bare = 'version:1.5\ncell:A1:v:1\nsheet:c:1:r:1:needsrecalc:no\n';
    expect(extractSheetSave(bare)).toBe(bare);
  });

  it('returns input unchanged when no sheet body is present', () => {
    const garbage = 'not a SocialCalc save at all';
    expect(extractSheetSave(garbage)).toBe(garbage);
  });

  // These three pin the line-anchoring details of the match regex at
  // cross-sheet.ts:23. Each input is crafted so that the ORIGINAL
  // regex doesn't match (→ returns input unchanged), but a specific
  // mutation would match and return a substring.

  it('requires `version:1.5` to start a line (`^` anchor)', () => {
    // Mutant without leading `^`: matches `version:1.5` embedded in
    // `xversion:1.5`. Original returns input; mutant returns a slice.
    const embedded =
      'xversion:1.5\n' +
      'cell:A1:v:1\n' +
      '--SocialCalcSpreadsheetControlSave\n';
    expect(extractSheetSave(embedded)).toBe(embedded);
  });

  it('requires `version:1.5` to end a line (`$` anchor)', () => {
    // Mutant without trailing `$`: matches `version:1.5extra`.
    const trailing =
      'version:1.5extra\n' +
      'cell:A1:v:1\n' +
      '--SocialCalcSpreadsheetControlSave\n';
    expect(extractSheetSave(trailing)).toBe(trailing);
  });

  it('requires boundary lookahead to start a line (inner `^`)', () => {
    // Mutant without `^` in the lookahead: matches an inline boundary
    // substring inside a cell value, truncating the sheet body early.
    // The original refuses because the boundary is mid-line, so the
    // regex falls through to EOF and captures the full tail.
    const inlineBoundary =
      'version:1.5\n' +
      'cell:A1:t:has--SocialCalcSpreadsheetControlSave-inside\n' +
      'sheet:c:1:r:1:needsrecalc:no\n';
    const out = extractSheetSave(inlineBoundary);
    // Original regex (with `^` anchor in the lookahead) walks to EOF,
    // since no real boundary line exists. The mutant truncates at the
    // mid-line `--SocialCalc…` substring, dropping the `sheet:` line.
    expect(out).toContain('sheet:c:1:r:1:needsrecalc:no');
  });
});

describe('readBoundedResponseText', () => {
  it('rejects declared and streamed bodies over the byte limit', async () => {
    const declared = new Response('x', {
      headers: { 'Content-Length': '6' },
    });
    expect(await readBoundedResponseText(declared, 5)).toBeNull();
    expect(await readBoundedResponseText(new Response('123456'), 5)).toBeNull();
  });

  it('decodes bounded UTF-8 and handles a bodyless response', async () => {
    expect(await readBoundedResponseText(new Response('éé'), 4)).toBe('éé');
    expect(
      await readBoundedResponseText(new Response(null, { status: 204 }), 4),
    ).toBe('');
  });
});

describe('hydrateCrossSheetRefs', () => {
  function makeSS(
    refs: string[],
  ): CrossSheetSpreadsheet & {
    added: string[];
    recalced: number;
  } {
    const added: string[] = [];
    let recalced = 0;
    return {
      findCrossSheetRefs: (limit = Number.POSITIVE_INFINITY) =>
        refs.slice(0, limit),
      addSiblingSheet: (name: string) => {
        added.push(name);
      },
      recalc: () => {
        recalced++;
      },
      get added() {
        return added;
      },
      get recalced() {
        return recalced;
      },
    };
  }

  it('returns 0 when no refs are present', async () => {
    const ss = makeSS([]);
    const fetchSibling = vi.fn();
    const added = await hydrateCrossSheetRefs(ss, fetchSibling);
    expect(added).toBe(0);
    expect(fetchSibling).not.toHaveBeenCalled();
    expect(ss.recalced).toBe(0);
  });

  it('fetches each ref, adds to sibling cache, and recalcs once', async () => {
    const ss = makeSS(['alpha', 'beta']);
    const fetchSibling = vi.fn(async (name: string) => `version:1.5\ncell:A1:v:${name.length}\n`);
    const added = await hydrateCrossSheetRefs(ss, fetchSibling);
    expect(added).toBe(2);
    expect(ss.added).toEqual(['alpha', 'beta']);
    expect(ss.recalced).toBe(1);
  });

  it('caps sibling subrequests even when a spreadsheet advertises more refs', async () => {
    const refs = Array.from({ length: MAX_CROSS_SHEET_REFS + 5 }, (_, i) => `r${i}`);
    const ss = makeSS(refs);
    ss.findCrossSheetRefs = () => refs;
    const fetchSibling = vi.fn(async () => 'version:1.5\n');
    expect(await hydrateCrossSheetRefs(ss, fetchSibling)).toBe(
      MAX_CROSS_SHEET_REFS,
    );
    expect(fetchSibling).toHaveBeenCalledTimes(MAX_CROSS_SHEET_REFS);
  });

  it('skips oversized siblings and enforces an aggregate cache budget', async () => {
    const oversized = 'x'.repeat(MAX_CROSS_SHEET_SAVE_BYTES + 1);
    const oversizedSheet = makeSS(['huge']);
    expect(
      await hydrateCrossSheetRefs(oversizedSheet, async () => oversized),
    ).toBe(0);

    const bounded = 'x'.repeat(MAX_CROSS_SHEET_SAVE_BYTES);
    const count = Math.floor(
      MAX_CROSS_SHEET_TOTAL_CHARS / MAX_CROSS_SHEET_SAVE_BYTES,
    );
    const aggregateSheet = makeSS(
      Array.from({ length: count + 1 }, (_, i) => `r${i}`),
    );
    expect(
      await hydrateCrossSheetRefs(aggregateSheet, async () => bounded),
    ).toBe(count);
  });

  it('rejects an oversized sibling name before DO dispatch', async () => {
    const ss = makeSS(['x'.repeat(MAX_CROSS_SHEET_NAME_CHARS + 1), 'ok']);
    const fetchSibling = vi.fn(async () => 'version:1.5\n');
    expect(await hydrateCrossSheetRefs(ss, fetchSibling)).toBe(1);
    expect(fetchSibling).toHaveBeenCalledExactlyOnceWith('ok');
  });

  it('skips self-references', async () => {
    const ss = makeSS(['self', 'other']);
    const fetchSibling = vi.fn(async () => 'version:1.5\ncell:A1:v:1\n');
    const added = await hydrateCrossSheetRefs(ss, fetchSibling, 'self');
    expect(added).toBe(1);
    expect(ss.added).toEqual(['other']);
    expect(fetchSibling).toHaveBeenCalledTimes(1);
    expect(fetchSibling).toHaveBeenCalledWith('other');
  });

  it('skips refs whose fetch returns null', async () => {
    const ss = makeSS(['one', 'two']);
    const fetchSibling = vi.fn(async (name: string) =>
      name === 'one' ? null : 'version:1.5\ncell:A1:v:1\n',
    );
    const added = await hydrateCrossSheetRefs(ss, fetchSibling);
    expect(added).toBe(1);
    expect(ss.added).toEqual(['two']);
  });

  it('swallows fetch errors and continues', async () => {
    const ss = makeSS(['throws', 'ok']);
    const fetchSibling = vi.fn(async (name: string) => {
      if (name === 'throws') throw new Error('recursion limit');
      return 'version:1.5\ncell:A1:v:1\n';
    });
    const added = await hydrateCrossSheetRefs(ss, fetchSibling);
    expect(added).toBe(1);
    expect(ss.added).toEqual(['ok']);
  });

  it('does NOT recalc when no siblings were added', async () => {
    const ss = makeSS(['all-missing']);
    const fetchSibling = vi.fn(async () => null);
    const added = await hydrateCrossSheetRefs(ss, fetchSibling);
    expect(added).toBe(0);
    expect(ss.recalced).toBe(0);
  });
});

describe('readBoundedResponseText — cancel failure', () => {
  it('still refuses an oversized body when cancelling the stream rejects', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(8));
      },
      cancel() {
        // A stalled sibling can reject here; the read must still fail closed.
        return Promise.reject(new Error('cancel failed'));
      },
    });
    const response = new Response(stream);
    await expect(readBoundedResponseText(response, 4)).resolves.toBeNull();
  });
});

describe('cross-sheet fetch guards', () => {
  function makeSS(refs: string[]): CrossSheetSpreadsheet & { added: string[] } {
    const added: string[] = [];
    return {
      findCrossSheetRefs: () => refs,
      addSiblingSheet: (name: string) => void added.push(name),
      recalc: () => {},
      get added() {
        return added;
      },
    };
  }

  it('honours a declared Content-Length above the cap without reading the body', async () => {
    const response = new Response('short', {
      headers: { 'Content-Length': String(MAX_CROSS_SHEET_SAVE_BYTES + 1) },
    });
    await expect(readBoundedResponseText(response)).resolves.toBeNull();
  });

  it('ignores an absent or non-numeric Content-Length and streams instead', async () => {
    const noHeader = new Response('body');
    await expect(readBoundedResponseText(noHeader)).resolves.toBe('body');
    const bogus = new Response('body', {
      headers: { 'Content-Length': 'not-a-number' },
    });
    await expect(readBoundedResponseText(bogus)).resolves.toBe('body');
    const atCap = new Response('body', {
      headers: { 'Content-Length': String(MAX_CROSS_SHEET_SAVE_BYTES) },
    });
    await expect(readBoundedResponseText(atCap)).resolves.toBe('body');
  });

  it('decodes multi-byte characters split across stream chunks', async () => {
    const euro = new TextEncoder().encode('€');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(euro.subarray(0, 1));
        controller.enqueue(euro.subarray(1));
        controller.close();
      },
    });
    await expect(readBoundedResponseText(new Response(stream))).resolves.toBe('€');
  });

  it('skips refs that are empty or longer than the name cap', async () => {
    const ss = makeSS(['', 'x'.repeat(MAX_CROSS_SHEET_NAME_CHARS + 1), 'ok']);
    const seen: string[] = [];
    const added = await hydrateCrossSheetRefs(ss, async (name) => {
      seen.push(name);
      return 'version:1.5\n';
    });
    expect(seen).toEqual(['ok']);
    expect(added).toBe(1);
    // A name exactly at the cap is still fetched.
    const atCap = 'y'.repeat(MAX_CROSS_SHEET_NAME_CHARS);
    const ssAtCap = makeSS([atCap]);
    await hydrateCrossSheetRefs(ssAtCap, async () => 'version:1.5\n');
    expect(ssAtCap.added).toEqual([atCap]);
  });

  it('skips a sibling whose fetch rejects and keeps hydrating the rest', async () => {
    const ss = makeSS(['broken', 'fine']);
    const added = await hydrateCrossSheetRefs(ss, async (name) => {
      if (name === 'broken') throw new Error('recursion limit');
      return 'version:1.5\n';
    });
    expect(added).toBe(1);
    expect(ss.added).toEqual(['fine']);
  });
});
