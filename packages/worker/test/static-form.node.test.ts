import { describe, it, expect } from 'vitest';

import { buildFormPartPath } from '../src/handlers/static-form.ts';

describe('buildFormPartPath', () => {
  it('prefixes with /form and suffixes with .js', () => {
    expect(buildFormPartPath('builder')).toBe('/formbuilder.js');
  });

  it('handles an empty part (legacy would 404 at serve time)', () => {
    expect(buildFormPartPath('')).toBe('/form.js');
  });

  it('passes numeric/unicode bytes through (encoding is caller concern)', () => {
    expect(buildFormPartPath('2')).toBe('/form2.js');
    expect(buildFormPartPath('-viewer')).toBe('/form-viewer.js');
  });
});
