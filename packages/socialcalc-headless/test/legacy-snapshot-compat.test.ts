import { describe, it, expect } from 'vite-plus/test';
import {
  createSpreadsheet,
  HeadlessSpreadsheet,
  loadSocialCalc,
} from '../src/index.js';
import { createSocialCalcFactory } from '../src/socialcalc.bundled.js';

/**
 * Genuine pre-3.1.0 SocialCalc save string captured against the legacy
 * EtherCalc oracle (pinned SHA `042b731d…`, SocialCalc 3.0.x era).
 *
 * Source of truth in-repo:
 *   - `packages/oracle-harness/src/scenarios/fixtures.ts` (`MINIMAL_SCSAVE`)
 *   - `tests/oracle/recorded/exports/get-snapshot.json` (base64 body of the
 *     same string, recorded from the legacy server)
 *
 * Production rooms store this multipart envelope under the DO `snapshot`
 * key; RoomDO rehydrates via `createSpreadsheet({ snapshot })`, which is
 * the public path through `createSocialCalcFactory()`.
 */
const LEGACY_ORACLE_SCSAVE = [
  'socialcalc:version:1.5',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave',
  '--SocialCalcSpreadsheetControlSave',
  'Content-type: text/plain; charset=UTF-8',
  '',
  '# SocialCalc Spreadsheet Control Save',
  'version:1.0',
  'part:sheet',
  '--SocialCalcSpreadsheetControlSave',
  'Content-type: text/plain; charset=UTF-8',
  '',
  'version:1.5',
  'cell:A1:t:oracle',
  'sheet:c:1:r:1:tvf:1',
  '--SocialCalcSpreadsheetControlSave--',
  '',
].join('\n');

describe('legacy pre-3.1.0 snapshot → createSocialCalcFactory()', () => {
  it('exposes the 3.1.0 factory used by production loadSocialCalc()', () => {
    const factoryNs = createSocialCalcFactory() as unknown as Record<string, unknown>;
    expect(typeof factoryNs).toBe('object');
    expect(typeof factoryNs.SpreadsheetControl).toBe('function');
    // Marker that the bundled runtime is the 3.1.0 security model, not 3.0.x.
    expect(typeof factoryNs.EscapeUntrustedHtml).toBe('function');

    const viaLoader = loadSocialCalc();
    expect(typeof viaLoader.SpreadsheetControl).toBe('function');
    expect(typeof viaLoader.EscapeUntrustedHtml).toBe('function');
  });

  it('parses a genuine oracle 3.0.x save without throwing and exposes cell values', () => {
    let ss: HeadlessSpreadsheet | undefined;
    expect(() => {
      ss = createSpreadsheet({ snapshot: LEGACY_ORACLE_SCSAVE });
    }).not.toThrow();

    // Cell data from the fixture — not merely "no error".
    const cell = ss!.exportCell('A1') as {
      datavalue?: unknown;
      datatype?: unknown;
      valuetype?: unknown;
    } | null;
    expect(cell).not.toBeNull();
    expect(cell?.datavalue).toBe('oracle');
    expect(cell?.datatype).toBe('t');
    expect(cell?.valuetype).toBe('t');
    expect(ss!.exportCSV()).toBe('oracle\n');

    const cells = ss!.exportCells() as Record<string, { datavalue?: unknown }>;
    expect(Object.keys(cells)).toEqual(['A1']);
    expect(cells.A1?.datavalue).toBe('oracle');
  });

  it('round-trips cell data through createSpreadsheetSave() (semantic, not byte-identical)', () => {
    const loaded = createSpreadsheet({ snapshot: LEGACY_ORACLE_SCSAVE });
    const reserialised = loaded.createSpreadsheetSave();

    // Documented finding: first save under 3.1.0 rewrites the envelope.
    // Observed deltas vs the legacy oracle string:
    //   - socialcalc:version:1.5 → 1.0
    //   - adds part:edit + part:audit MIME sections
    //   - sheet line tvf:1 may become tvf:undefined + valueformat:1:undefined
    // So byte-identity MUST NOT be required; cell semantics must hold.
    expect(reserialised).not.toBe(LEGACY_ORACLE_SCSAVE);
    expect(reserialised).toContain('cell:A1:t:oracle');
    expect(reserialised).toContain('SocialCalcSpreadsheetControlSave');
    expect(reserialised).toContain('version:1.5');

    const reloaded = createSpreadsheet({ snapshot: reserialised });
    const cell = reloaded.exportCell('A1') as { datavalue?: unknown } | null;
    expect(cell?.datavalue).toBe('oracle');
    expect(reloaded.exportCSV()).toBe('oracle\n');
  });
});
