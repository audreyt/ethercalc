import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vite-plus/test';

/**
 * `static/index-bootstrap.js` is the classic script that picks the room
 * before `player.js` runs. The server authorizes `GET /:room` (and the
 * passkey badge probes access) for the room in the PATH; a fragment never
 * reaches the server, so it must not be able to select a different room.
 */
const source = readFileSync(new URL('../../../static/index-bootstrap.js', import.meta.url), 'utf8');

interface BootWindow {
  window?: BootWindow;
  location: unknown;
  document: { title: string };
  EtherCalc?: { _room: string };
  SocialCalc?: { _room: string };
  addEventListener(): void;
}

function boot(href: string): BootWindow {
  const url = new URL(href);
  const win: BootWindow = {
    location: { href: url.href, pathname: url.pathname, hash: url.hash },
    document: { title: '' },
    addEventListener: () => {},
  };
  win.window = win;
  runInNewContext(source, win);
  return win;
}

describe('index-bootstrap room selection', () => {
  it('takes the room from the path', () => {
    const win = boot('https://calc.example/room1?auth=room1');
    expect(win.EtherCalc?._room).toBe('room1');
    expect(win.SocialCalc).toBe(win.EtherCalc);
    expect(win.document.title).toBe('room1 – EtherCalc');
    expect(boot('https://calc.example/base/room1').EtherCalc?._room).toBe('room1');
  });

  it('never lets a fragment override the room in the path', () => {
    expect(boot('https://calc.example/private#private/').EtherCalc?._room).toBe('private');
    expect(boot('https://calc.example/private?auth=private#other').EtherCalc?._room).toBe('private');
    // An empty fragment is not part of the name either.
    expect(boot('https://calc.example/private#').EtherCalc?._room).toBe('private');
  });

  it('leaves the legacy `/#room` fragment to the client when the path names no room', () => {
    const win = boot('https://calc.example/#legacy');
    expect(win.EtherCalc).toBeUndefined();
    expect(win.location).not.toBe('./_start');
  });

  it('sends a page with neither to the start page', () => {
    expect(boot('https://calc.example/').location).toBe('./_start');
    expect(boot('https://calc.example/_new').location).toBe('./_start');
  });
});
