/**
 * `GET /static/form<part>.js` — literal-colon param route (§7 item 26).
 *
 * Legacy (src/main.ls:87-90):
 *
 * ```livescript
 * @get "#BASEPATH/static/form:part.js": ->
 *   part = @params.part
 *   @response.type \application/javascript
 *   @response.sendfile "#RealBin/form#part.js"
 * ```
 *
 * Zappa/Express interprets the literal colon inside the segment as a
 * param; Hono's router splits on `/` and only treats a leading `:` as a
 * param marker. The route layer substitutes a constrained segment match
 * (`:file{form.+\.js}`) and peels off the `form` prefix and `.js`
 * suffix to recover `part`. This module turns that `part` into the
 * ASSETS pathname.
 *
 * Mapping: legacy served `form<part>.js` FROM THE REPO ROOT (not
 * `static/`). The curated `assets/` dir does not yet contain any such
 * files — the form-builder packages would land there if/when ported
 * from `src/`. Until then the binding 404s for any specific `:part`.
 * The builder returns the ASSETS-relative path where such a file
 * *would* live, and the route layer forwards.
 */

export interface BuildFormPartPathOpts {
  /** The captured `:part` from the URL. */
  readonly part: string;
}

/**
 * Legacy served files like `formbuilder.js`, `formviewer.js` out of the
 * repo root. In the curated asset dir they'd live at the top level,
 * so we return `/form<part>.js` directly. Tests assert the shape; the
 * ASSETS binding itself returns 404 when no matching file exists.
 */
export function buildFormPartPath(part: string): string {
  return `/form${part}.js`;
}
