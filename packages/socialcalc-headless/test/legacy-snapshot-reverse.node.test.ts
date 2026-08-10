import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  transformSocialCalcSource,
  wrapSocialCalcSource,
} from '../scripts/build.js';
import { createSpreadsheet } from '../src/index.js';

/**
 * Genuine pre-3.1.0 oracle save (same bytes as MINIMAL_SCSAVE /
 * tests/oracle/recorded/exports/get-snapshot.json).
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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../../..');
const DOM_SHIM_SRC = path.resolve(HERE, '../src/dom-shim.ts');

type CellView = {
  datavalue?: unknown;
  datatype?: unknown;
  valuetype?: unknown;
  formula?: string;
};

type SpreadsheetControl = {
  sheet: {
    cells: Record<string, CellView>;
    attribs: Record<string, unknown>;
    valueformats?: unknown[];
    ResetSheet(): void;
  };
  DecodeSpreadsheetSave(snapshot: string): { sheet?: { start: number; end: number } } | null;
  ParseSheetSave(str: string): void;
  CreateSheetSave(): string;
  CreateSpreadsheetSave(): string;
};

type SocialCalcNs = {
  SpreadsheetControl: new () => SpreadsheetControl;
  ConvertSaveToOtherFormat: (savestr: string, format: string) => string;
  EscapeUntrustedHtml?: unknown;
};

type Factory = () => SocialCalcNs;

/**
 * Locate the on-disk SocialCalc 3.0.8 UMD. Bun keeps versioned stores under
 * `node_modules/.bun/socialcalc@3.0.8/…` even when the workspace resolves
 * `socialcalc` to 3.1.0 — that is the genuine pre-upgrade runtime.
 */
function resolveSocialCalc308Source(): string {
  const candidates = [
    path.join(
      REPO_ROOT,
      'node_modules/.bun/socialcalc@3.0.8/node_modules/socialcalc/dist/SocialCalc.js',
    ),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    'socialcalc@3.0.8 dist/SocialCalc.js not found under node_modules/.bun; ' +
      'cannot prove reverse snapshot compatibility without the old runtime',
  );
}

function hydrate(factory: Factory, snapshot: string): {
  err: string | null;
  cells: Record<string, CellView>;
  csv: string;
  hasEscape: boolean;
  valueformats: unknown[] | null;
  save: string;
} {
  const SC = factory();
  const ss = new SC.SpreadsheetControl();
  let err: string | null = null;
  try {
    const parts = ss.DecodeSpreadsheetSave(snapshot);
    if (!parts?.sheet) throw new Error('DecodeSpreadsheetSave returned no sheet part');
    ss.sheet.ResetSheet();
    ss.ParseSheetSave(snapshot.substring(parts.sheet.start, parts.sheet.end));
  } catch (e) {
    err = e instanceof Error ? (e.stack ?? e.message) : String(e);
  }
  const cells: Record<string, CellView> = {};
  for (const [k, v] of Object.entries(ss.sheet.cells ?? {})) {
    cells[k] = {
      datavalue: v.datavalue,
      datatype: v.datatype,
      valuetype: v.valuetype,
      formula: v.formula ?? '',
    };
  }
  let csv = '';
  try {
    csv = SC.ConvertSaveToOtherFormat(ss.CreateSheetSave(), 'csv');
  } catch (e) {
    csv = `CSV_ERR:${e instanceof Error ? e.message : String(e)}`;
  }
  return {
    err,
    cells,
    csv,
    hasEscape: typeof SC.EscapeUntrustedHtml === 'function',
    valueformats: ss.sheet.valueformats ? [...ss.sheet.valueformats] : null,
    save: ss.CreateSpreadsheetSave(),
  };
}

describe('reverse snapshot compat: 3.1.0-written save → genuine SocialCalc 3.0.8', () => {
  let tmpDir = '';
  let factory308: Factory;

  beforeAll(async () => {
    const src308 = resolveSocialCalc308Source();
    const raw = fs.readFileSync(src308, 'utf8');
    // Confirm this really is 3.0.8 before transforming.
    expect(raw.includes('EscapeUntrustedHtml')).toBe(false);

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc308-factory-'));
    // Generated bundle imports `./dom-shim` — place a real shim beside it.
    fs.copyFileSync(DOM_SHIM_SRC, path.join(tmpDir, 'dom-shim.ts'));
    // Also copy .js-less resolution helpers if the runtime wants extensionless.
    fs.writeFileSync(
      path.join(tmpDir, 'dom-shim.js'),
      // Re-export the TS shim via a tiny relative re-export that bun/vitest can load.
      `export { ShimNode } from ${JSON.stringify(pathToFileURL(DOM_SHIM_SRC).href)};\n`,
    );

    let moduleText = wrapSocialCalcSource(transformSocialCalcSource(raw));
    // Point the relative import at our local shim file with explicit extension.
    moduleText = moduleText.replace(
      "import { ShimNode } from './dom-shim';",
      "import { ShimNode } from './dom-shim.js';",
    );
    const factoryPath = path.join(tmpDir, 'socialcalc.bundled.308.ts');
    fs.writeFileSync(factoryPath, moduleText);

    const mod = (await import(pathToFileURL(factoryPath).href)) as {
      createSocialCalcFactory: Factory;
    };
    factory308 = mod.createSocialCalcFactory;
  });

  afterAll(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('loads a real socialcalc@3.0.8 runtime without EscapeUntrustedHtml', () => {
    const SC = factory308();
    expect(typeof SC.SpreadsheetControl).toBe('function');
    // Marker that this is genuinely 3.0.8, not the 3.1.0 security model.
    expect(typeof SC.EscapeUntrustedHtml).toBe('undefined');
  });

  it('parses a 3.1.0 reserialised oracle save (edit/audit parts + optional tvf:undefined)', () => {
    const rewritten = createSpreadsheet({ snapshot: LEGACY_ORACLE_SCSAVE }).createSpreadsheetSave();
    // Sanity: 3.1.0 rewrite still carries the cell and the expanded envelope.
    expect(rewritten).toContain('part:edit');
    expect(rewritten).toContain('part:audit');
    expect(rewritten).toContain('cell:A1:t:oracle');

    const loaded = hydrate(factory308, rewritten);
    expect(loaded.err).toBeNull();
    expect(loaded.cells.A1?.datavalue).toBe('oracle');
    expect(loaded.cells.A1?.datatype).toBe('t');
    expect(loaded.csv).toBe('oracle\n');
  });

  it('parses a realistic multi-cell 3.1.0 save with formulas', () => {
    const ss = createSpreadsheet();
    ss.executeCommand(
      [
        'set A1 text t hello',
        'set B1 value n 42',
        'set B2 value n 3.5',
        'set B3 formula B1*B2',
        'set C1 text t world',
        'set B1 nontextvalueformat #,##0.00',
        'recalc',
      ].join('\n'),
    );
    const save310 = ss.createSpreadsheetSave();
    expect(save310).toContain('part:edit');
    expect(save310).toContain('cell:B3:vtf:n:147:B1*B2');
    // Realistic sheets must not emit the literal token "undefined".
    expect(save310.includes('undefined')).toBe(false);

    const loaded = hydrate(factory308, save310);
    expect(loaded.err).toBeNull();
    expect(loaded.cells.A1?.datavalue).toBe('hello');
    expect(loaded.cells.B1?.datavalue).toBe(42);
    expect(loaded.cells.B2?.datavalue).toBe(3.5);
    expect(loaded.cells.B3?.datavalue).toBe(147);
    expect(loaded.cells.B3?.formula).toBe('B1*B2');
    expect(loaded.cells.C1?.datavalue).toBe('world');
    // B1 carries nontextvalueformat #,##0.00 — CSV export applies it (42.00).
    // That is format preservation under 3.0.8, not cell-value loss.
    expect(loaded.csv).toBe('hello,42.00,world\n,3.5,\n,147,\n');
  });
});

describe('tvf:undefined serialisation characterisation', () => {
  let tmpDir = '';
  let factory308: Factory;

  beforeAll(async () => {
    const src308 = resolveSocialCalc308Source();
    const raw = fs.readFileSync(src308, 'utf8');
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc308-tvf-'));
    fs.writeFileSync(
      path.join(tmpDir, 'dom-shim.js'),
      `export { ShimNode } from ${JSON.stringify(pathToFileURL(DOM_SHIM_SRC).href)};\n`,
    );
    let moduleText = wrapSocialCalcSource(transformSocialCalcSource(raw));
    moduleText = moduleText.replace(
      "import { ShimNode } from './dom-shim';",
      "import { ShimNode } from './dom-shim.js';",
    );
    const factoryPath = path.join(tmpDir, 'socialcalc.bundled.308.ts');
    fs.writeFileSync(factoryPath, moduleText);
    const mod = (await import(pathToFileURL(factoryPath).href)) as {
      createSocialCalcFactory: Factory;
    };
    factory308 = mod.createSocialCalcFactory;
  });

  afterAll(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('is a dangling-index artifact of the oracle fixture, not a general 3.1.0 write bug', () => {
    // (a) Loading the oracle fixture (sheet:…:tvf:1 with NO valueformat:1:… line)
    // leaves defaulttextvalueformat=1 while valueformats[1] is missing.
    // Both 3.0.8 and 3.1.0 then stringify that hole as the literal "undefined".
    const afterLegacy = createSpreadsheet({ snapshot: LEGACY_ORACLE_SCSAVE }).createSpreadsheetSave();
    expect(afterLegacy).toContain('tvf:undefined');
    expect(afterLegacy).toContain('valueformat:1:undefined');

    // Same artifact from genuine 3.0.8 resave of the same fixture.
    const from308 = hydrate(factory308, LEGACY_ORACLE_SCSAVE);
    expect(from308.err).toBeNull();
    expect(from308.save).toContain('tvf:undefined');
    expect(from308.save).toContain('valueformat:1:undefined');

    // (b) Native 3.1.0 creates (no pre-seeded dangling tvf index) do not emit it.
    const native = createSpreadsheet();
    native.executeCommand('set A1 text t oracle\nrecalc');
    const nativeSave = native.createSpreadsheetSave();
    expect(nativeSave.includes('undefined')).toBe(false);
    expect(nativeSave).toContain('cell:A1:t:oracle');

    // (c) Realistic multi-cell sheet with a real nontext value format does not emit it.
    const real = createSpreadsheet();
    real.executeCommand(
      [
        'set A1 text t hello',
        'set B1 value n 42',
        'set B1 nontextvalueformat #,##0.00',
        'recalc',
      ].join('\n'),
    );
    const realSave = real.createSpreadsheetSave();
    expect(realSave.includes('undefined')).toBe(false);
    expect(realSave).toContain('valueformat:1:#,##0.00');
    expect(realSave).toContain('ntvf:1');
  });
});
