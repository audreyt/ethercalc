/**
 * Minimal DOM shim for running SocialCalc headless.
 *
 * Legacy EtherCalc (`src/sc.ls`) provided this inline as a LiveScript class so
 * `SocialCalc.document.createElement` could build element trees for HTML
 * export without a real DOM. We keep the exact same contract here: property
 * getters/setters for the half-dozen attribute names SocialCalc actually
 * sets, plus `innerHTML`/`outerHTML` serialization.
 *
 * `attrs` is the single source of truth for every named attribute — the
 * typed property accessors below (id/className/colSpan/…) and
 * `setAttribute`/`getAttribute`/`removeAttribute` all read and write the
 * same `attrs` map, so `el.setAttribute('class', 'x')` and `el.className`
 * always agree. Attribute values are HTML-escaped on serialization
 * (`outerHTML`); `innerHTML`/`raw` content is not, matching the legacy
 * contract where callers set already-escaped markup or plain text.
 */
function escapeAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * `classList.add` facade backing `RenderCell`'s `result.classList.add(cell.cssc)`
 * call. Tokens live in `node.attrs.class` (same single source of truth as
 * `className`/`setAttribute('class', …)`) — this wrapper never stores its
 * own copy, it just dedupes against whatever is current on every call.
 */
class ShimClassList {
  constructor(private readonly node: ShimNode) {}

  add(...tokens: string[]): void {
    const current = new Set((this.node.attrs.class ?? '').split(/\s+/).filter(Boolean));
    for (const t of tokens) if (t) current.add(t);
    this.node.attrs.class = Array.from(current).join(' ');
  }

  contains(token: string): boolean {
    return (this.node.attrs.class ?? '').split(/\s+/).filter(Boolean).includes(token);
  }
}

export class ShimNode {
  tag: string;
  attrs: Record<string, string> = {};
  style: Record<string, string> & { cssText?: string } = {};
  elems: ShimNode[] = [];
  raw = '';
  text: string | undefined;
  #classList: ShimClassList | undefined;

  constructor(tag = 'div') {
    this.tag = tag;
  }

  get id(): string | undefined { return this.attrs.id; }
  set id(v: string) { this.attrs.id = v; }

  get width(): string | undefined { return this.attrs.width; }
  set width(v: string) { this.attrs.width = v; }

  get height(): string | undefined { return this.attrs.height; }
  set height(v: string) { this.attrs.height = v; }

  get className(): string | undefined { return this.attrs.class; }
  set className(v: string) { this.attrs.class = v; }

  get colSpan(): string | undefined { return this.attrs.colspan; }
  set colSpan(v: string) { this.attrs.colspan = v; }

  get rowSpan(): string | undefined { return this.attrs.rowspan; }
  set rowSpan(v: string) { this.attrs.rowspan = v; }

  get title(): string | undefined { return this.attrs.title; }
  set title(v: string) { this.attrs.title = v; }

  get innerHTML(): string {
    if (this.text !== undefined) return escapeText(this.text);
    if (this.raw) return this.raw;
    return this.elems.map((e) => e.outerHTML).join('\n');
  }
  set innerHTML(v: string) {
    this.raw = v;
    this.text = undefined;
  }

  get textContent(): string {
    return this.text ?? '';
  }
  set textContent(v: string) {
    this.text = v;
    this.raw = '';
    this.elems = [];
  }

  get classList(): ShimClassList {
    if (!this.#classList) this.#classList = new ShimClassList(this);
    return this.#classList;
  }

  get outerHTML(): string {
    const css =
      this.style.cssText ??
      Object.entries(this.style)
        .filter(([k]) => k !== 'cssText')
        .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}:${v}`)
        .join(';');
    if (css) this.attrs.style = css;
    else delete this.attrs.style;
    const attrStr = Object.entries(this.attrs)
      .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
      .join('');
    return `<${this.tag}${attrStr}>${this.innerHTML}</${this.tag}>`;
  }

  appendChild(n: ShimNode): ShimNode {
    this.text = undefined;
    this.elems.push(n);
    return n;
  }

  setAttribute(name: string, value: string): void {
    this.attrs[name] = String(value);
  }

  getAttribute(name: string): string | null {
    return name in this.attrs ? this.attrs[name]! : null;
  }

  removeAttribute(name: string): void {
    delete this.attrs[name];
  }
}
