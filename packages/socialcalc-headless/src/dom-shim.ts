/**
 * Minimal DOM shim for running SocialCalc headless.
 *
 * Legacy EtherCalc (`src/sc.ls`) provided this inline as a LiveScript class so
 * `SocialCalc.document.createElement` could build element trees for HTML
 * export without a real DOM. We keep the exact same contract here: property
 * getters/setters for the half-dozen attribute names SocialCalc actually
 * sets, plus `innerHTML`/`outerHTML` serialization.
 */
export class ShimNode {
  tag: string;
  attrs: Record<string, string> = {};
  style: Record<string, string> & { cssText?: string } = {};
  elems: ShimNode[] = [];
  raw = '';

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
    if (this.raw) return this.raw;
    return this.elems.map((e) => e.outerHTML).join('\n');
  }
  set innerHTML(v: string) {
    this.raw = v;
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
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');
    return `<${this.tag}${attrStr}>${this.innerHTML}</${this.tag}>`;
  }

  appendChild(n: ShimNode): ShimNode {
    this.elems.push(n);
    return n;
  }
}
