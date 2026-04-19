import { describe, expect, it } from 'vitest';

import { HELP_TEXT } from '../src/help.ts';

describe('HELP_TEXT', () => {
  it('documents every legacy flag by name', () => {
    // This list is the §13 Q6 preservation contract. If a flag is dropped
    // from help.ts without a release note, this test breaks.
    const requiredFlags = [
      '--key',
      '--cors',
      '--port',
      '--host',
      '--expire',
      '--basepath',
      '--keyfile',
      '--certfile',
      '--help',
    ];
    for (const flag of requiredFlags) {
      expect(HELP_TEXT).toContain(flag);
    }
  });

  it('flags the TLS flags as deferred', () => {
    expect(HELP_TEXT).toContain('DEFERRED');
  });

  it('mentions the env-var translations so users can skip the CLI', () => {
    expect(HELP_TEXT).toContain('ETHERCALC_KEY');
    expect(HELP_TEXT).toContain('ETHERCALC_CORS');
    expect(HELP_TEXT).toContain('ETHERCALC_BASEPATH');
    expect(HELP_TEXT).toContain('ETHERCALC_EXPIRE');
  });

  it('starts with the "ethercalc" program banner', () => {
    expect(HELP_TEXT.split('\n')[0]).toMatch(/^ethercalc/);
  });
});
