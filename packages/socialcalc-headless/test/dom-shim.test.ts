import { describe, it, expect } from 'vite-plus/test';
import { ShimNode } from '../src/dom-shim.js';

describe('ShimNode attribute API', () => {
  it('setAttribute stores a stringified value readable via getAttribute', () => {
    const el = new ShimNode('td');
    el.setAttribute('role', 'gridcell');
    el.setAttribute('aria-rowindex', 3 as unknown as string);
    expect(el.getAttribute('role')).toBe('gridcell');
    expect(el.getAttribute('aria-rowindex')).toBe('3');
  });

  it('setAttribute overwrites a previously set value', () => {
    const el = new ShimNode('td');
    el.setAttribute('aria-selected', 'false');
    el.setAttribute('aria-selected', 'true');
    expect(el.getAttribute('aria-selected')).toBe('true');
  });

  it('getAttribute returns null for an attribute that was never set', () => {
    const el = new ShimNode('td');
    expect(el.getAttribute('aria-invalid')).toBeNull();
  });

  it('removeAttribute deletes a set attribute and getAttribute reports null afterward', () => {
    const el = new ShimNode('td');
    el.setAttribute('aria-invalid', 'true');
    el.removeAttribute('aria-invalid');
    expect(el.getAttribute('aria-invalid')).toBeNull();
    expect(el.outerHTML).not.toContain('aria-invalid');
  });

  it('removeAttribute on an attribute that was never set is a no-op', () => {
    const el = new ShimNode('td');
    expect(() => el.removeAttribute('aria-invalid')).not.toThrow();
    expect(el.getAttribute('aria-invalid')).toBeNull();
  });

  it('setAttribute("class", …) and className stay in sync (single attrs source of truth)', () => {
    const el = new ShimNode('td');
    el.setAttribute('class', 'sc-cell');
    expect(el.className).toBe('sc-cell');
    el.className = 'sc-cell sc-selected';
    expect(el.getAttribute('class')).toBe('sc-cell sc-selected');
  });

  it('setAttribute("id", …) and the id property stay in sync', () => {
    const el = new ShimNode('td');
    el.setAttribute('id', 'cell_A1');
    expect(el.id).toBe('cell_A1');
    el.id = 'cell_B2';
    expect(el.getAttribute('id')).toBe('cell_B2');
  });

  it('setAttribute("colspan", …) and colSpan stay in sync', () => {
    const el = new ShimNode('td');
    el.setAttribute('colspan', '2');
    expect(el.colSpan).toBe('2');
    el.colSpan = '3';
    expect(el.getAttribute('colspan')).toBe('3');
  });

  it('outerHTML serializes role/aria attributes set via setAttribute, in insertion order', () => {
    const el = new ShimNode('table');
    el.setAttribute('role', 'grid');
    el.setAttribute('aria-rowcount', '5');
    el.setAttribute('aria-colcount', '3');
    expect(el.outerHTML).toBe('<table role="grid" aria-rowcount="5" aria-colcount="3"></table>');
  });

  it('outerHTML escapes ampersands and double quotes in attribute values', () => {
    const el = new ShimNode('td');
    el.setAttribute('aria-label', 'A1: Tom & "Jerry"');
    expect(el.outerHTML).toBe('<td aria-label="A1: Tom &amp; &quot;Jerry&quot;"></td>');
  });

  it('outerHTML escapes angle brackets in attribute values so they cannot reopen a tag', () => {
    const el = new ShimNode('td');
    el.setAttribute('aria-label', '<script>alert(1)</script>');
    const html = el.outerHTML;
    expect(html).toBe(
      '<td aria-label="&lt;script&gt;alert(1)&lt;/script&gt;"></td>',
    );
    expect(html).not.toContain('<script>');
  });

  it('does not escape innerHTML/raw content — only attribute values are escaped', () => {
    const el = new ShimNode('td');
    el.setAttribute('aria-label', 'A & B');
    el.innerHTML = 'A & B <b>bold</b>';
    expect(el.outerHTML).toBe('<td aria-label="A &amp; B">A & B <b>bold</b></td>');
  });
});

describe('ShimNode classList', () => {
  it('add() sets the class on an element with no prior class', () => {
    const el = new ShimNode('td');
    el.classList.add('sc-highlight');
    expect(el.className).toBe('sc-highlight');
  });

  it('add() appends to an existing className set via the className property', () => {
    const el = new ShimNode('td');
    el.className = 'sc-cell';
    el.classList.add('sc-highlight');
    expect(el.className).toBe('sc-cell sc-highlight');
  });

  it('add() dedupes a token already present, matching DOM classList semantics', () => {
    const el = new ShimNode('td');
    el.className = 'sc-cell';
    el.classList.add('sc-cell');
    expect(el.className).toBe('sc-cell');
  });

  it('add() stays in sync with setAttribute("class", …) — attrs.class is the only store', () => {
    const el = new ShimNode('td');
    el.setAttribute('class', 'sc-cell');
    el.classList.add('sc-selected');
    expect(el.getAttribute('class')).toBe('sc-cell sc-selected');
  });

  it('contains() reflects tokens added via classList.add', () => {
    const el = new ShimNode('td');
    el.classList.add('sc-cell');
    expect(el.classList.contains('sc-cell')).toBe(true);
    expect(el.classList.contains('sc-missing')).toBe(false);
  });

  it('outerHTML serializes classes added via classList.add through the class attribute', () => {
    const el = new ShimNode('td');
    el.classList.add('sc-cell');
    expect(el.outerHTML).toBe('<td class="sc-cell"></td>');
  });
});

describe('ShimNode textContent', () => {
  it('setting textContent makes it readable back verbatim (unescaped)', () => {
    const el = new ShimNode('span');
    el.textContent = '▼';
    expect(el.textContent).toBe('▼');
  });

  it('outerHTML escapes textContent — the autofilter arrow glyph round-trips through escaping untouched', () => {
    const el = new ShimNode('span');
    el.textContent = '▼';
    expect(el.outerHTML).toBe('<span>▼</span>');
  });

  it('outerHTML escapes &, <, > in textContent so it cannot inject markup', () => {
    const el = new ShimNode('span');
    el.textContent = '<b>A & B</b>';
    expect(el.outerHTML).toBe('<span>&lt;b&gt;A &amp; B&lt;/b&gt;</span>');
  });

  it('textContent does not escape double quotes (text-node position needs no quote escaping)', () => {
    const el = new ShimNode('span');
    el.textContent = 'say "hi"';
    expect(el.outerHTML).toBe('<span>say "hi"</span>');
  });

  it('setting textContent replaces prior raw innerHTML content', () => {
    const el = new ShimNode('span');
    el.innerHTML = '<b>old</b>';
    el.textContent = 'new';
    expect(el.outerHTML).toBe('<span>new</span>');
  });

  it('setting textContent replaces prior appended children', () => {
    const el = new ShimNode('span');
    el.appendChild(new ShimNode('b'));
    el.textContent = 'new';
    expect(el.outerHTML).toBe('<span>new</span>');
  });

  it('setting innerHTML (raw) after textContent overrides the text, matching legacy raw semantics', () => {
    const el = new ShimNode('span');
    el.textContent = 'old text';
    el.innerHTML = '<b>raw</b>';
    expect(el.outerHTML).toBe('<span><b>raw</b></span>');
  });

  it('appendChild after textContent overrides the text and renders the child tree', () => {
    const el = new ShimNode('span');
    el.textContent = 'old text';
    const child = new ShimNode('b');
    child.textContent = 'child';
    el.appendChild(child);
    expect(el.outerHTML).toBe('<span><b>child</b></span>');
  });

  it('empty-string textContent renders as an empty element, distinct from unset (no innerHTML fallback)', () => {
    const el = new ShimNode('span');
    el.textContent = '';
    expect(el.outerHTML).toBe('<span></span>');
  });
});
