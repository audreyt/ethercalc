import { encodeBase64 } from '../matchers.ts';

/**
 * Stable room names for Phase 3 mutation/export scenarios. Recorded
 * in order after the empty room-index batch so Redis starts clean.
 */
export const ORACLE_PHASE3_TEMPLATE_ROOM = 'oracle-phase3-template';
export const ORACLE_PHASE3_EXPORT_ROOM = 'oracle-phase3-export';

/**
 * Minimal SocialCalc save with a single text cell — enough to exercise
 * snapshot round-trip, csv/html exports, and POST commands.
 */
export const MINIMAL_SCSAVE = [
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

/** UTF-8 string → base64 for `HttpRequestDef.bodyBase64`. */
export function requestBodyBase64(text: string): string {
  return encodeBase64(new TextEncoder().encode(text));
}