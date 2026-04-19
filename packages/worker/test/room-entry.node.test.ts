import { describe, it, expect } from 'vitest';

import {
  buildRoomEntry,
  buildTemplateFormRedirect,
  TEMPLATE_FORM_STUB_STATUS,
} from '../src/handlers/room-entry.ts';

describe('buildRoomEntry', () => {
  it('serves /index.html when no KEY (single-sheet room)', () => {
    const d = buildRoomEntry({ room: 'abc123' });
    expect(d).toEqual({ kind: 'serve', path: '/index.html' });
  });

  it('serves /multi/index.html for =-prefixed rooms (no KEY)', () => {
    const d = buildRoomEntry({ room: '=workbook' });
    expect(d).toEqual({ kind: 'serve', path: '/multi/index.html' });
  });

  it('serves /index.html when KEY set but ?auth is non-empty', () => {
    const d = buildRoomEntry({ room: 'r', authQuery: 'someauth', key: 'secret' });
    expect(d.kind).toBe('serve');
    if (d.kind === 'serve') expect(d.path).toBe('/index.html');
  });

  it('serves /multi/index.html when KEY set + auth present + = prefix', () => {
    const d = buildRoomEntry({ room: '=x', authQuery: 'a', key: 'k' });
    expect(d).toEqual({ kind: 'serve', path: '/multi/index.html' });
  });

  it('redirects to ?auth=0 when KEY set and auth query is missing', () => {
    const d = buildRoomEntry({ room: 'abc', key: 'secret' });
    expect(d.kind).toBe('redirect');
    if (d.kind === 'redirect') {
      expect(d.status).toBe(302);
      expect(d.headers.Location).toBe('/abc?auth=0');
      expect(d.headers['Content-Type']).toBe('text/plain; charset=UTF-8');
      expect(d.headers['Content-Length']).toBe(String(d.body.length));
      expect(d.body).toBe('Found. Redirecting to /abc?auth=0');
      expect(d.headers.Vary).toBe('Accept');
    }
  });

  it('redirects to ?auth=0 when KEY set and auth query is empty string', () => {
    const d = buildRoomEntry({ room: 'x', authQuery: '', key: 'k' });
    expect(d.kind).toBe('redirect');
    if (d.kind === 'redirect') expect(d.headers.Location).toBe('/x?auth=0');
  });

  it('treats empty-string KEY as unset (serves index)', () => {
    const d = buildRoomEntry({ room: 'x', key: '' });
    expect(d.kind).toBe('serve');
  });

  it('honors basepath on both serve and redirect', () => {
    // serve: path is always the raw asset path, never includes basepath.
    const s = buildRoomEntry({ basepath: '/ec', room: 'x' });
    expect(s.kind).toBe('serve');
    // redirect: Location prefixes basepath.
    const r = buildRoomEntry({ basepath: '/ec', room: 'x', key: 'k' });
    if (r.kind === 'redirect') {
      expect(r.headers.Location).toBe('/ec/x?auth=0');
    }
  });

  it('URL-encodes non-ASCII room names on the redirect Location', () => {
    const r = buildRoomEntry({ room: '試', key: 'k' });
    if (r.kind === 'redirect') {
      expect(r.headers.Location).toBe('/%E8%A9%A6?auth=0');
    } else {
      throw new Error('expected redirect');
    }
  });

  it('encoded = prefix still routes to multi/index.html (encodeURI leaves = alone)', () => {
    const d = buildRoomEntry({ room: '=x' });
    expect(d.kind).toBe('serve');
    if (d.kind === 'serve') expect(d.path).toBe('/multi/index.html');
  });

  it('basepath defaults to empty when omitted', () => {
    const r = buildRoomEntry({ room: 'a', key: 'k' });
    if (r.kind === 'redirect') expect(r.headers.Location).toBe('/a?auth=0');
  });
});

describe('buildTemplateFormRedirect', () => {
  const fixedId = () => 'b2wgtc1rmuqu';

  it('returns a 503 stub when phase5Ready is false (default)', () => {
    const r = buildTemplateFormRedirect({ template: 'tpl', idGen: fixedId });
    expect(r.status).toBe(TEMPLATE_FORM_STUB_STATUS);
    expect(r.body).toContain('Phase 5');
    expect(r.body).toContain('/tpl_b2wgtc1rmuqu/app');
    expect(r.headers['Content-Type']).toBe('text/plain; charset=UTF-8');
    expect(r.headers['Content-Length']).toBe(String(r.body.length));
  });

  it('returns a 302 redirect when phase5Ready is true', () => {
    const r = buildTemplateFormRedirect({
      template: 'tpl',
      idGen: fixedId,
      phase5Ready: true,
    });
    expect(r.status).toBe(302);
    expect(r.headers.Location).toBe('/tpl_b2wgtc1rmuqu/app');
    expect(r.body).toBe('Found. Redirecting to /tpl_b2wgtc1rmuqu/app');
    expect(r.headers['Content-Length']).toBe(String(r.body.length));
    expect(r.headers.Vary).toBe('Accept');
  });

  it('encodes non-ASCII template names before joining with the new id', () => {
    const r = buildTemplateFormRedirect({
      template: '試',
      idGen: fixedId,
      phase5Ready: true,
    });
    expect(r.status).toBe(302);
    if (r.status === 302) expect(r.headers.Location).toBe('/%E8%A9%A6_b2wgtc1rmuqu/app');
  });

  it('honors basepath on the 302', () => {
    const r = buildTemplateFormRedirect({
      basepath: '/ec',
      template: 'tpl',
      idGen: fixedId,
      phase5Ready: true,
    });
    if (r.status === 302) expect(r.headers.Location).toBe('/ec/tpl_b2wgtc1rmuqu/app');
  });

  it('uses generateRoomId when idGen is not injected (stub branch)', () => {
    const r = buildTemplateFormRedirect({ template: 't' });
    expect(r.status).toBe(TEMPLATE_FORM_STUB_STATUS);
    // Body embeds the generated id; must match the 12-char hex shape.
    expect(r.body).toMatch(/\/t_[0-9a-f]{12}\/app/);
  });

  it('uses generateRoomId when idGen is not injected (redirect branch)', () => {
    const r = buildTemplateFormRedirect({ template: 't', phase5Ready: true });
    expect(r.status).toBe(302);
    if (r.status === 302) {
      expect(r.headers.Location).toMatch(/^\/t_[0-9a-f]{12}\/app$/);
    }
  });

  it('defaults basepath to empty string', () => {
    const r = buildTemplateFormRedirect({
      template: 't',
      idGen: fixedId,
      phase5Ready: true,
    });
    if (r.status === 302) expect(r.headers.Location.startsWith('/t_')).toBe(true);
  });
});
