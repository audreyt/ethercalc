function replaceOnce(source, original, replacement, label) {
  const first = source.indexOf(original);
  if (first < 0 || source.indexOf(original, first + original.length) >= 0) {
    throw new Error(`SocialCalc ${label} transform expected one match`);
  }
  return source.slice(0, first) + replacement + source.slice(first + original.length);
}

function replaceInSection(source, startMarker, endMarker, original, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || source.indexOf(startMarker, start + startMarker.length) >= 0) {
    throw new Error(`SocialCalc ${label} section changed`);
  }
  const section = source.slice(start, end);
  return source.slice(0, start) + replaceOnce(section, original, replacement, label) + source.slice(end);
}

function replaceEvery(source, pattern, replacement, expected, label) {
  if (typeof pattern === 'string') {
    const pieces = source.split(pattern);
    if (pieces.length !== expected + 1) {
      throw new Error(`SocialCalc ${label} transform expected ${expected} matches`);
    }
    return pieces.join(replacement);
  }
  if ((source.match(pattern) ?? []).length !== expected) {
    throw new Error(`SocialCalc ${label} transform expected ${expected} matches`);
  }
  return source.replace(pattern, replacement);
}

// Characters of number-format text whose parsed forms are kept at once, and the
// share each cached format is charged for its own records.
const MAX_PARSED_FORMAT_TEXT = 32768;
const PARSED_FORMAT_OVERHEAD = 32;

// Rows above and columns left of a pane split are frozen: every render builds
// all of them, while the scrolling pane after the split is cut to the window.
const MAX_FROZEN_ROWS = 200;
const MAX_FROZEN_COLUMNS = 50;

// rcColname() clamps every column number above ZZ (702) back to ZZ, so a scan
// that steps past hidden columns must stop there or it never ends once ZZ is hidden.
const HIDDEN_COLUMN_SCAN =
  /while \(\s*([\w.]+\.colattribs\.hide)\[\s*(\w+\.rcColname)\(([^()]+)\)\s*\]\s*==\s*'yes'\s*\) \{/g;

// A form widget's HTML is filled in a single pass so placeholder-like values
// are not rescanned and replacement patterns (`$&`, `` $` ``, `$'`) are verbatim.
const WIDGET_TEMPLATE_FILL = `        var checkedValue = html_display_value == 0 ? '' : 'checked';
        cell_html = cell_html.replace(/<%=checked%>/g, checkedValue);
        cell_html = cell_html.replace(/<%=formated_value%>/g, html_formated_value);
        cell_html = cell_html.replace(/<%=display_value%>/g, html_display_value);
        var parameterValue;
        if (parameters) {
          for (var index = 0; index < parameters.length; index++) {
            if (parameters[index].type == 'coord') {
              parameterValue = sheetobj.GetAssuredCell(parameters[index].value).datavalue;
            } else {
              parameterValue = parameters[index].value;
            }
            var paramRegExp = new RegExp('<%=parameter' + index + '_value%>', 'g');
            cell_html = cell_html.replace(paramRegExp, parameterValue);
          }
          if (parameters.html) {
            for (var htmlIndex = 0; htmlIndex < parameters.html.length; htmlIndex++) {
              var paramRegExp = new RegExp('<%=html' + htmlIndex + '_value%>', 'g');
              cell_html = cell_html.replace(paramRegExp, parameters.html[htmlIndex]);
            }
          }
          if (parameters.css) {
            cell_html = cell_html.replace(/^(<\\w+)(\\W)/, "$1 style='" + parameters.css + "'$2");
          }
        }
        return cell_html.replace(/<%=cell_reference%>/g, cr);
`;
const WIDGET_TEMPLATE_FILL_ONCE = `        var widgetValues = {
          checked: html_display_value == 0 ? '' : 'checked',
          formated_value: html_formated_value,
          display_value: html_display_value,
          cell_reference: cr,
        };
        var parameterValue;
        if (parameters) {
          for (var index = 0; index < parameters.length; index++) {
            if (parameters[index].type == 'coord') {
              parameterValue = sheetobj.GetAssuredCell(parameters[index].value).datavalue;
            } else {
              parameterValue = parameters[index].value;
            }
            widgetValues['parameter' + index + '_value'] = parameterValue;
          }
          if (parameters.html) {
            for (var htmlIndex = 0; htmlIndex < parameters.html.length; htmlIndex++) {
              widgetValues['html' + htmlIndex + '_value'] = parameters.html[htmlIndex];
            }
          }
          if (parameters.css) {
            widgetValues.css = parameters.css;
            cell_html = cell_html.replace(/^(<\\w+)(\\W)/, "$1 style='<%=css%>'$2");
          }
        }
        return cell_html.replace(/<%=(\\w+)%>/g, function (placeholder, name) {
          return Object.prototype.hasOwnProperty.call(widgetValues, name)
            ? widgetValues[name]
            : placeholder;
        });
`;

export function patchSocialCalc(source) {
  let result = replaceOnce(
    source,
    '    sheet.cells = {};',
    '    sheet.cells = Object.create(null);',
    'cell storage',
  );
  // Missing save fields (`cell:A1:t`, `font:1`) split as `undefined`; normalize to ''.
  result = replaceInSection(
    result,
    'SC.decodeFromSave = function',
    'SC.decodeFromAjax = function',
    "    if (typeof s != 'string') return s;",
    "    if (s === undefined) return '';\n    if (typeof s != 'string') return s;",
    'missing saved field',
  );
  result = replaceInSection(
    result,
    'SC.ParseSheetSave = function',
    'SC.CellFromStringParts = function',
    '          sheetobj.fonts[parts[1] - 0] = parts[2];\n          sheetobj.fonthash[parts[2]] = parts[1] - 0;',
    "          sheetobj.fonts[parts[1] - 0] = parts[2] || '';\n          sheetobj.fonthash[parts[2] || ''] = parts[1] - 0;",
    'missing saved font',
  );
  // SocialCalc writes each style table as records 1..N in order: reject gaps.
  for (const [record, table] of [
    ['layout', 'layouts'],
    ['font', 'fonts'],
    ['color', 'colors'],
    ['border', 'borderstyles'],
    ['cellformat', 'cellformats'],
    ['valueformat', 'valueformats'],
  ]) {
    result = replaceInSection(
      result,
      'SC.ParseSheetSave = function',
      'SC.CellFromStringParts = function',
      `\n        case '${record}':\n`,
      `\n        case '${record}':\n          if (parts[1] - 0 > (sheetobj.${table}.length || 1)) break;\n`,
      `saved ${record} index`,
    );
  }
  result = replaceOnce(
    result,
    "        case 'cell':\n          cell = sheetobj.GetAssuredCell(parts[1]);",
    "        case 'cell':\n          if (!/^[A-Za-z]+[1-9][0-9]*$/.test(parts[1] || '')) break;\n          cell = sheetobj.GetAssuredCell(parts[1]);",
    'saved cell parsing',
  );
  result = replaceOnce(
    result,
    "        case 'ecell':\n          editor.ecell = TableEditorSC.coordToCr(parts[1]);",
    "        case 'ecell':\n          if (!/^[A-Za-z]+[1-9][0-9]*$/.test(parts[1] || '')) parts[1] = 'A1';\n          editor.ecell = TableEditorSC.coordToCr(parts[1]);",
    'saved cursor parsing',
  );
  result = replaceOnce(
    result,
    '    return this.cells[coord] || this.AddCell(new SocialCalc.Cell(coord));',
    "    if (!/^[A-Za-z]+[1-9][0-9]*$/.test(coord)) throw new Error('Invalid cell coordinate');\n    return Object.prototype.hasOwnProperty.call(this.cells, coord)\n      ? this.cells[coord]\n      : this.AddCell(new SocialCalc.Cell(coord));",
    'cell lookup',
  );
  // Action formulas file themselves under their trigger cell: keep ioEventTree
  // prototype-free and coordinate-keyed, and guard PlainCoord against numbers.
  result = replaceOnce(
    result,
    '    sheet.ioEventTree = {};',
    '    sheet.ioEventTree = Object.create(null);',
    'trigger cell storage',
  );
  for (const [original, replacement, label] of [
    [
      "    if (typeof sheet.ioEventTree === 'undefined') sheet.ioEventTree = {};",
      "    if (typeof sheet.ioEventTree === 'undefined') sheet.ioEventTree = Object.create(null);",
      'trigger cell storage fallback',
    ],
    [
      "        if (typeof list[index] === 'undefined') list[index] = {};",
      "        if (typeof list[index] === 'undefined') list[index] = Object.create(null);",
      'trigger cell actions',
    ],
    [
      '      var triggerTimeCellId = SocialCalc.Formula.PlainCoord(operand[0].value);',
      "      var triggerTimeCellId =\n        operand[0].type == 'coord' || operand[0].type == 'range'\n          ? SocialCalc.Formula.PlainCoord(operand[0].value)\n          : '';",
      'time trigger coordinate',
    ],
    [
      '        PushTriggerCord(sheet.ioEventTree, triggerCellId, coord);',
      '        if (/^[A-Za-z]+[1-9][0-9]*$/.test(triggerCellId))\n          PushTriggerCord(sheet.ioEventTree, triggerCellId, coord);',
      'trigger cell coordinate',
    ],
  ]) {
    result = replaceInSection(
      result,
      'FormulaMut.StoreIoEventFormula = function',
      'FormulaMut.Clone = function',
      original,
      replacement,
      label,
    );
  }
  // A cell's value type must never be an evaluator operand kind or contain
  // record/line separators (`:`, CR, LF).
  result = replaceOnce(
    result,
    '  SC.CellFromStringParts = function (sheet, cell, parts, j) {',
    `  SC.SafeValueType = function (type) {
    if (!type) return '';
    return /^(?:coord|range|name|start)$/.test(type) || /[:\\r\\n]/.test(type)
      ? 'e#VALUE!'
      : type;
  };
  SC.CellFromStringParts = function (sheet, cell, parts, j) {`,
    'value type policy',
  );
  for (const tag of ['vt', 'vtf', 'vtc']) {
    result = replaceOnce(
      result,
      `        case '${tag}':\n          v = parts[j++];`,
      `        case '${tag}':\n          v = SocialCalc.SafeValueType(parts[j++] || '');`,
      'saved cell value type',
    );
  }
  for (const [start, end] of [
    ["} else if (attrib == 'text') {", "} else if (attrib == 'formula') {"],
    ["} else if (attrib == 'constant') {", "} else if (attrib == 'empty') {"],
  ]) {
    result = replaceInSection(
      result,
      start,
      end,
      '                cell.valuetype = rest.substring(0, pos);',
      '                cell.valuetype = SocialCalc.SafeValueType(rest.substring(0, pos));',
      'set cell value type',
    );
  }
  result = replaceOnce(
    result,
    '          if (cols[i]) lastsortcol = i;',
    "          if (cols[i] && !/^[A-Za-z]{1,2}$/.test(cols[i])) throw new Error('Invalid sort column');\n          if (cols[i]) lastsortcol = i;",
    'sort key column',
  );
  result = replaceOnce(
    result,
    '          for (; value > 0; value--) {\n            f *= value;',
    '          for (; value > 0 && isFinite(f); value--) {\n            f *= value;',
    'factorial loop',
  );
  result = replaceOnce(
    result,
    "        /(.+)\\*(.+)/,\n        '$1' + SocialCalc.Constants.defaultCellFontSize + '$2',",
    "        /^(.+)\\*(.+)/,\n        '$1' + SocialCalc.Constants.defaultCellFontSize + '$2',",
    'default font size',
  );
  result = replaceOnce(
    result,
    "      s = s.replace(/(.+)\\*(.+)/, '$1' + context.defaultfontsize + '$2');",
    "      s = s.replace(/^(.+)\\*(.+)/, '$1' + context.defaultfontsize + '$2');",
    'font size',
  );
  result = replaceOnce(
    result,
    '              var matches = clipsheet.copiedfrom.match(/(.+):(.+)/);',
    '              var matches = clipsheet.copiedfrom.match(/^(.+):(.+)/);',
    'clipboard range',
  );
  result = replaceOnce(
    result,
    '    return SocialCalc.format_number_for_display(cell.datavalue, valuetype, valueformat);',
    `    SocialCalc.FormatNumber.plain_text = true;
    try {
      return SocialCalc.format_number_for_display(cell.datavalue, valuetype, valueformat);
    } finally {
      SocialCalc.FormatNumber.plain_text = false;
    }`,
    'plain text number export',
  );
  // RFC 4180: a field containing CR must be quoted. Upstream quotes on LF but
  // not CR, so a CR-bearing cell would leave the CSV export as a bare CR that
  // the Worker's parseCSV reads as a record terminator — one row per CR.
  result = replaceOnce(
    result,
    '          if (/[, \\n"]/.test(str)) {',
    '          if (/[, \\r\\n"]/.test(str)) {',
    'CSV export quoting',
  );
  result = replaceInSection(
    result,
    'SC.FormatValueForDisplay = function',
    'SC.format_text_for_display = function',
    "      return displayvalue;\n    }\n    if (valuetype == 't')",
    "      return SocialCalc.special_chars(String(displayvalue));\n    }\n    if (valuetype == 't')",
    'error display',
  );
  result = replaceInSection(
    result,
    'SC.FormatValueForDisplay = function',
    'SC.format_text_for_display = function',
    WIDGET_TEMPLATE_FILL,
    WIDGET_TEMPLATE_FILL_ONCE,
    'widget template',
  );
  result = replaceInSection(
    result,
    'TableEditorSC.EditorGetStatuslineString = function',
    'TableEditorSC.EditorMouseInfo = {',
    "      sstr += ' &nbsp; ' + scc.s_statusline_circref + circ + '</span>';",
    "      sstr += ' &nbsp; ' + scc.s_statusline_circref + SocialCalc.special_chars(circ) + '</span>';",
    'status display',
  );
  result = replaceInSection(
    result,
    'TableEditorSC.EditorGetStatuslineString = function',
    'TableEditorSC.EditorMouseInfo = {',
    "    sstr = (editor.ecell || {}).coord + ' &nbsp; ' + progress;",
    "    sstr = SocialCalc.special_chars(String((editor.ecell || {}).coord)) + ' &nbsp; ' + progress;",
    'status cursor display',
  );
  result = replaceOnce(
    result,
    '  SC.Lookup = function (value, list) {',
    `  SC.SafeFormatStyle = function (style) {
    var declarations = style.split(';').filter(Boolean);
    if (declarations.length === 0 || declarations.length > 4) return '';
    var safe = [];
    for (var i = 0; i < declarations.length; i++) {
      var match = /^([a-z-]+)\\s*:\\s*(\\S[^;]*)$/.exec(declarations[i].trim());
      if (!match) return '';
      var property = match[1].toLowerCase();
      var value = match[2].toLowerCase();
      var color = /^(?:#[0-9a-f]{3,8}|black|white|red|green|blue|yellow|gray|grey|silver|maroon|purple|fuchsia|lime|olive|navy|teal|aqua|transparent|rgb\\(\\s*[0-9]{1,3}\\s*,\\s*[0-9]{1,3}\\s*,\\s*[0-9]{1,3}\\s*\\))$/.test(value);
      if (!(
        ((property === 'color' || property === 'background-color') && color) ||
        (property === 'font-weight' && /^(?:normal|bold|[1-9]00)$/.test(value)) ||
        (property === 'font-style' && /^(?:normal|italic|oblique)$/.test(value)) ||
        (property === 'text-decoration' && /^(?:none|underline|line-through)$/.test(value)) ||
        (property === 'text-align' && /^(?:left|right|center|justify)$/.test(value))
      )) return '';
      safe.push(property + ':' + value);
    }
    return safe.join(';');
  };
  SC.Lookup = function (value, list) {`,
    'format style policy',
  );
  result = replaceOnce(
    result,
    '  SC.CoordInPane = function (',
    `  SC.SafeCellStyle = function (style) {
    var declarations = style.split(';');
    var safe = '';
    for (var i = 0; i < declarations.length; i++) {
      if (/^\\s*(?:padding|vertical-align|font-(?:style|weight|size|family)|color|background-color|text-align|border-(?:top|right|bottom|left))\\s*:[^{}\\\\]*$/i.test(declarations[i])) {
        safe += declarations[i] + ';';
      }
    }
    return safe;
  };
  SC.CoordInPane = function (`,
    'cell style policy',
  );
  result = replaceInSection(
    result,
    'SC.RenderCell = function',
    'SC.SafeCellStyle = function',
    '    if (cell.comment) {\n      result.title = cell.comment;',
    '    stylestr = SocialCalc.SafeCellStyle(stylestr);\n    if (cell.comment) {\n      result.title = cell.comment;',
    'cell style',
  );
  result = replaceInSection(
    result,
    'FormatNumberMut.formatNumberWithFormat = function',
    'FormatNumberMut.formatTextWithFormat = function',
    '        result += operandstr;',
    "        result += scfn.plain_text || operandstr === '&nbsp;' ? operandstr : SocialCalc.special_chars(operandstr);",
    'number format literal',
  );
  result = replaceInSection(
    result,
    'FormatNumberMut.formatNumberWithFormat = function',
    'FormatNumberMut.formatTextWithFormat = function',
    "        result += (operandstr === '$' ? currency_char : operandstr) || operandstr;",
    "        operandstr = String((operandstr === '$' ? currency_char : operandstr) || operandstr);\n        result += scfn.plain_text ? operandstr : SocialCalc.special_chars(operandstr);",
    'currency format',
  );
  for (const [start, end] of [
    ['FormatNumberMut.formatNumberWithFormat = function', 'FormatNumberMut.formatTextWithFormat = function'],
    ['FormatNumberMut.formatTextWithFormat = function', 'FormatNumberMut.parse_format_string = function'],
  ]) {
    result = replaceInSection(
      result,
      start,
      end,
      "      result = '<span style=\"' + textstyle + ';\">' + result + '</span>';",
      "      var safeStyle = SocialCalc.SafeFormatStyle(textstyle);\n      if (safeStyle) result = '<span style=\"' + safeStyle + ';\">' + result + '</span>';",
      'format style',
    );
  }
  result = replaceInSection(
    result,
    'FormatNumberMut.formatTextWithFormat = function',
    'FormatNumberMut.parse_format_string = function',
    '      return value;',
    '      return scfn.plain_text ? value : SocialCalc.special_chars(value);',
    'text format fallback',
  );
  result = replaceInSection(
    result,
    'FormatNumberMut.formatTextWithFormat = function',
    'FormatNumberMut.parse_format_string = function',
    '          result += value;',
    '          result += scfn.plain_text ? value : SocialCalc.special_chars(value);',
    'text format value',
  );
  result = replaceInSection(
    result,
    'FormatNumberMut.formatTextWithFormat = function',
    'FormatNumberMut.parse_format_string = function',
    "          result += operandstr.replace(/ /g, '&nbsp;');",
    "          result += operandstr === '&nbsp;' ? '&nbsp;' : (scfn.plain_text ? operandstr : SocialCalc.special_chars(operandstr)).replace(/ /g, '&nbsp;');",
    'text format literal',
  );
  // Stop hidden-column scans at ZZ (702) and prevent negative-column pane loops.
  result = replaceEvery(
    result,
    HIDDEN_COLUMN_SCAN,
    "while ($3 < 702 && $1[$2($3)] == 'yes') {",
    9,
    'hidden column scan',
  );
  result = replaceInSection(
    result,
    "      case 'pane':",
    "      case 'startcmdextension':",
    "while (col < 702 && editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == 'yes') {",
    "while (col > 0 && col < 702 && editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == 'yes') {",
    'pane hidden column lower bound',
  );
  for (const [axis, limit] of [
    ['row', MAX_FROZEN_ROWS],
    ['col', MAX_FROZEN_COLUMNS],
  ]) {
    result = replaceOnce(
      result,
      `          if (\n            (!${axis} || ${axis} <= editor.context.${axis}panes[0].first) &&`,
      `          ${axis} = Math.min(${axis}, editor.context.${axis}panes[0].first + ${limit});\n          if (\n            (!${axis} || ${axis} <= editor.context.${axis}panes[0].first) &&`,
      `${axis} pane command`,
    );
  }
  result = replaceOnce(
    result,
    '  TableEditorSC.LoadEditorSettings = function (editor, str, flags) {',
    `  TableEditorSC.SavedEditorSpan = function (first, last, maximum) {
    if (!/^[1-9][0-9]{0,6}$/.test(first || '') || !/^[1-9][0-9]{0,6}$/.test(last || '')) {
      return 0;
    }
    first = first - 0;
    last = last - 0;
    if (first < 1 || first > last || last > maximum) return 0;
    return last - first + 1;
  };
  TableEditorSC.IsSavedEditorPane = function (parts, maximum) {
    return (
      parts.length === 4 &&
      (parts[1] === '0' || parts[1] === '1') &&
      TableEditorSC.SavedEditorSpan(parts[2], parts[3], maximum) >= 1
    );
  };
  TableEditorSC.IsSavedEditorRange = function (parts) {
    if (parts.length !== 6 || !/^[A-Za-z]+[1-9][0-9]*$/.test(parts[1] || '')) return false;
    var cells =
      TableEditorSC.SavedEditorSpan(parts[2], parts[3], 1048576) *
      TableEditorSC.SavedEditorSpan(parts[4], parts[5], 702);
    return cells >= 1 && cells <= 200000;
  };
  TableEditorSC.LoadEditorSettings = function (editor, str, flags) {`,
    'saved editor settings policy',
  );
  for (const [setting, maximum, limit] of [
    ['rowpane', 1048576, MAX_FROZEN_ROWS],
    ['colpane', 702, MAX_FROZEN_COLUMNS],
  ]) {
    result = replaceInSection(
      result,
      'TableEditorSC.LoadEditorSettings = function',
      'TableEditorSC.EditorRenderSheet = function',
      `        case '${setting}':\n          context.${setting}s[parts[1] - 0] = {\n            first: parts[2] - 0,\n            last: parts[3] - 0,\n          };`,
      `        case '${setting}':\n          if (!TableEditorSC.IsSavedEditorPane(parts, ${maximum})) break;\n          context.${setting}s[parts[1] - 0] = {\n            first: parts[2] - 0,\n            last: Math.min(parts[3] - 0, parts[2] - 0 + ${limit - 1}),\n          };`,
      `saved ${setting}`,
    );
  }
  result = replaceInSection(
    result,
    'TableEditorSC.LoadEditorSettings = function',
    'TableEditorSC.EditorRenderSheet = function',
    "        case 'range':\n          range.hasrange = true;",
    "        case 'range':\n          if (range.hasrange || !TableEditorSC.IsSavedEditorRange(parts)) break;\n          range.hasrange = true;",
    'saved range',
  );
  // Write all line breaks in save fields as \\n and match MIME part boundaries only at LF line starts.
  result = replaceInSection(
    result,
    'SC.encodeForSave = function',
    'SC.SafeUrlForRender = function',
    "    if (s.indexOf('\\n') != -1) s = s.replace(/\\n/g, '\\\\n');",
    "    if (/[\\n\\r\\u2028\\u2029]/.test(s)) s = s.replace(/\\r\\n?|[\\n\\u2028\\u2029]/g, '\\\\n');",
    'save line break escaping',
  );
  result = replaceOnce(
    result,
    '  SC.SafeUrlForRender = function (',
    `  SC.ExecAtSaveLineStart = function (regex, str) {
    var match;
    do {
      match = regex.exec(str);
    } while (match && match.index > 0 && str.charAt(match.index - 1) != '\\n');
    return match;
  };
  SC.SafeUrlForRender = function (`,
    'save line start',
  );
  result = replaceEvery(
    result,
    'searchinfo = boundaryregex.exec(str);',
    'searchinfo = SocialCalc.ExecAtSaveLineStart(boundaryregex, str);',
    6,
    'save part boundary',
  );
  // Bound FormatNumber.format_definitions cache size.
  result = replaceOnce(
    result,
    'FormatNumberMut.format_definitions = {};',
    'FormatNumberMut.format_definitions = {};\n  FormatNumberMut.format_definitions_size = 0;',
    'number format cache',
  );
  result = replaceOnce(
    result,
    '    if (format_defs[format_string]) return;\n',
    `    if (format_defs[format_string]) return;
    scfn.format_definitions_size += format_string.length + ${PARSED_FORMAT_OVERHEAD};
    if (scfn.format_definitions_size > ${MAX_PARSED_FORMAT_TEXT}) {
      for (var cached in format_defs) delete format_defs[cached];
      scfn.format_definitions_size = format_string.length + ${PARSED_FORMAT_OVERHEAD};
    }
`,
    'number format cache limit',
  );
  // Leave untokenizable formulas untouched in coordinate rewriters.
  for (const name of ['OffsetFormulaCoords', 'AdjustFormulaCoords', 'ReplaceFormulaCoords']) {
    result = replaceInSection(
      result,
      `FormulaRefRoot.${name} = function`,
      '    return updatedformula;',
      '    const parseinfo = scf.ParseFormulaIntoTokens(formula);\n',
      '    const parseinfo = scf.ParseFormulaIntoTokens(formula);\n    if (parseinfo.some((token) => token.type === tokentype.error)) return formula;\n',
      'formula coordinate rewrite',
    );
  }
  // Drop unbounded coordToCol / coordToRow lookup cache.
  result = replaceOnce(
    result,
    `  FormulaRefRoot.coordToCol = {};
  FormulaRefRoot.coordToRow = {};
  FormulaRefRoot.coordToCr = function (cr) {
    const cachedRow = FormulaRefRoot.coordToRow[cr];
    if (cachedRow) {
      return {
        row: cachedRow,
        col: FormulaRefRoot.coordToCol[cr],
      };
    }
`,
    '  FormulaRefRoot.coordToCr = function (cr) {\n',
    'coordinate cache lookup',
  );
  result = replaceOnce(
    result,
    '    FormulaRefRoot.coordToCol[cr] = c;\n    FormulaRefRoot.coordToRow[cr] = r;\n',
    '',
    'coordinate cache store',
  );
  // Fold each distinct sort key once per sort.
  result = replaceOnce(
    result,
    '        sorttypes = [];\n',
    '        sorttypes = [];\n        var sortkeys = new Map();\n',
    'sort key cache',
  );
  result = replaceOnce(
    result,
    "            if (valtype == 't') val = val.toLowerCase();",
    `            if (valtype == 't') {
              if (!sortkeys.has(val)) sortkeys.set(val, val.toLowerCase());
              val = sortkeys.get(val);
            }`,
    'sort key',
  );
  // Linear special-value tokenization and TRIM whitespace stripping.
  result = replaceOnce(
    result,
    "          str.charAt(str.length - 1) == '!' ||\n          (scf.SpecialConstants && scf.SpecialConstants[str.toUpperCase()])",
    "          line.charAt(i - 1) == '!' ||\n          (str.length <= 7 && scf.SpecialConstants && scf.SpecialConstants[str.toUpperCase()])",
    'special value scan',
  );
  result = replaceOnce(
    result,
    "        result = result.replace(/^ */, '');\n        result = result.replace(/ *$/, '');\n        result = result.replace(/ +/g, ' ');",
    "        result = result.replace(/ +/g, ' ');\n        result = result.replace(/^ /, '');\n        result = result.replace(/ $/, '');",
    'linear TRIM',
  );
  // Hook RecalcCheckCell's range walk into headless formula limits.
  result = replaceInSection(
    result,
    'SC.RecalcCheckCell = function',
    'SC.Parse = function',
    '            coordvals.inrangestart = false;\n',
    `            coordvals.inrangestart = false;
            if (SocialCalc.RecalcRangeAllowed && !SocialCalc.RecalcRangeAllowed(coordvals, parseinfo)) {
              coordvals.inrange = false;
              continue;
            }
`,
    'recalc range walk',
  );
  // Linear DetermineValueType classification + HTML probe.
  for (const [original, replacement] of [
    [
      String.raw`tvalue = value.replace(/^\s+/, '');
    tvalue = tvalue.replace(/\s+$/, '');`,
      'tvalue = value.trim();',
    ],
    [
      String.raw`tvalue.match(/^[-+]?\d*(?:\.)?\d*(?:[eE][-+]?\d+)?$/)`,
      String.raw`tvalue.match(/^[-+]?\d*(?:\.\d*)?(?:[eE][-+]?\d+)?$/)`,
    ],
    [
      String.raw`tvalue.match(/^[-+]?\d*(?:\.)?\d*\s*%$/)`,
      String.raw`tvalue.match(/^[-+]?\d*(?:\.\d*)?\s*%$/)`,
    ],
    [
      String.raw`tvalue.match(/^[-+]?\$\s*\d*(?:\.)?\d*\s*$/)`,
      String.raw`tvalue.match(/^[-+]?\$\s*\d*(?:\.\d*)?$/)`,
    ],
    [
      String.raw`tvalue.match(/^[-+]?(\d*,\d*)+(?:\.)?\d*$/)`,
      String.raw`tvalue.match(/^[-+]?\d*(?:,\d*)+(?:\.\d*)?$/)`,
    ],
    [
      String.raw`tvalue.match(/^[-+]?(\d*,\d*)+(?:\.)?\d*\s*%$/)`,
      String.raw`tvalue.match(/^[-+]?\d*(?:,\d*)+(?:\.\d*)?\s*%$/)`,
    ],
    [
      String.raw`tvalue.match(/^[-+]?\$\s*(\d*,\d*)+(?:\.)?\d*$/)`,
      String.raw`tvalue.match(/^[-+]?\$\s*\d*(?:,\d*)+(?:\.\d*)?$/)`,
    ],
    [
      String.raw`tvalue.match(/<([A-Z][A-Z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/i)`,
      'SocialCalc.ContainsHtmlElement(tvalue)',
    ],
  ]) {
    result = replaceInSection(
      result,
      'SC.DetermineValueType = function',
      'SC.InputConstants = {',
      original,
      replacement,
      'value type pattern',
    );
  }
  result = replaceOnce(
    result,
    '  SC.DetermineValueType = function (rawvalue) {',
    String.raw`  SC.ContainsHtmlElement = function (text) {
    var closeTag = /<\/([A-Z][A-Z0-9]*)>/gi;
    var openTag = /<([A-Z][A-Z0-9]*)\b/gi;
    var lastClose = Object.create(null);
    var tagEnd = -1;
    var match;
    while ((match = closeTag.exec(text))) {
      lastClose[match[1].toLowerCase()] = match.index;
    }
    while ((match = openTag.exec(text))) {
      if (tagEnd < openTag.lastIndex) {
        tagEnd = text.indexOf('>', openTag.lastIndex);
        if (tagEnd < 0) break;
      }
      if (lastClose[match[1].toLowerCase()] > tagEnd) return true;
    }
    return false;
  };
  SC.DetermineValueType = function (rawvalue) {`,
    'html value type',
  );
  // Reuse parsed clipboard across pastes in the same command batch.
  result = replaceOnce(
    result,
    '        clipsheet = new SocialCalc.Sheet();\n        clipsheet.ParseSheetSave(SocialCalc.Clipboard.clipboard);',
    `        if (SocialCalc.Clipboard.parsedText !== SocialCalc.Clipboard.clipboard) {
          SocialCalc.Clipboard.parsedText = SocialCalc.Clipboard.clipboard;
          SocialCalc.Clipboard.parsedSheet = null;
          clipsheet = new SocialCalc.Sheet();
          clipsheet.ParseSheetSave(SocialCalc.Clipboard.clipboard);
          SocialCalc.Clipboard.parsedSheet = clipsheet;
        }
        clipsheet = SocialCalc.Clipboard.parsedSheet;
        if (!clipsheet) break;`,
    'clipboard parsing',
  );
  // Merge span budget on CalculateCellSkipData and RenderCell.
  result = replaceInSection(
    result,
    'SC.CalculateCellSkipData = function',
    'SC.CalculateColWidthData = function',
    '    context.cellskip = {};\n',
    '    context.cellskip = {};\n    context.coordToCR = {};\n    var spancells;\n    var skipbudget = 400000;\n',
    'merge skip budget',
  );
  result = replaceInSection(
    result,
    'SC.CalculateCellSkipData = function',
    'SC.CalculateColWidthData = function',
    '        if (colspan > 1 || rowspan > 1) {\n',
    '        if (colspan > 1 || rowspan > 1) {\n          spancells = Math.max(colspan, 1) * Math.max(rowspan, 1);\n          if (!(spancells <= skipbudget)) continue;\n          skipbudget -= spancells;\n',
    'merge skip data',
  );
  for (const span of ['colspan', 'rowspan']) {
    result = replaceInSection(
      result,
      'SC.RenderCell = function',
      'SC.CoordInPane = function',
      `    if (cell.${span} > 1) {\n      span = 1;`,
      `    if (cell.${span} > 1 && context.coordToCR[coord]) {\n      span = 1;`,
      `merged cell ${span}`,
    );
  }
  // HTML-escape UI sinks: resize indicators, custom color input, Ctrl+S editor.
  for (const [axis, size] of [
    ['Col', 'editor.context.colwidth[mouseinfo.mouseresizecolnum]'],
    ['Row', 'editor.context.rowheight[mouseinfo.mouseresizerownum]'],
  ]) {
    result = replaceInSection(
      result,
      `TableEditorSC.ProcessEditor${axis}sizeMouseDown = function`,
      `TableEditorSC.ProcessEditor${axis}sizeMouseMove = function`,
      `        ${size} +\n`,
      `        SocialCalc.special_chars(String(${size})) +\n`,
      'resize indicator',
    );
  }
  result = replaceInSection(
    result,
    'SocialCalc.Popup.Types.ColorChooser.MakeCustom = function',
    'SocialCalc.Popup.Types.ColorChooser.ItemClicked = function',
    "      spcdata.value +\n      '\"><br><br>' +",
    "      SocialCalc.special_chars(spcdata.value) +\n      '\"><br><br>' +",
    'custom color value',
  );
  result = replaceInSection(
    result,
    'SpreadsheetControlSC.CtrlSEditor = function',
    'SpreadsheetControlSC.CtrlSEditorDone = function',
    '    editbox.innerHTML =\n      whichpart +',
    '    editbox.innerHTML =\n      SocialCalc.special_chars(whichpart) +',
    'part editor title',
  );
  result = replaceInSection(
    result,
    'SpreadsheetControlSC.CtrlSEditor = function',
    'SpreadsheetControlSC.CtrlSEditorDone = function',
    `'</textarea><br><br><input type=button ' +
      "onclick=\\"SocialCalc.CtrlSEditorDone ('socialcalc-editbox', '" +
      whichpart +
      '\\');" value="OK">';`,
    `'</textarea><br><br><input type=button value="OK">';
    editbox.lastChild.onclick = function () {
      SocialCalc.CtrlSEditorDone('socialcalc-editbox', whichpart);
    };`,
    'part editor button',
  );
  // Replace RegExp sinks in TestCriteria, SELECT, and save boundary decoding.
  result = replaceInSection(
    result,
    'FormulaMut.TestCriteria = function',
    'const FormulaParseMut = SocialCalc.Formula;',
    `          try {
            cond = value.search(new RegExp(basevalue.value)) != -1;
          } catch {
            cond = false;
          }`,
    '          cond = SocialCalc.Formula.WildcardMatch(value, criteria.toLowerCase());',
    'criteria wildcard match',
  );
  result = replaceOnce(
    result,
    '  FormulaMut.TestCriteria = function (value, type, criteria) {',
    `  FormulaMut.WildcardMatch = function (text, pattern) {
    var end, reached, next, swap, i, p, ch, code, wild;
    var tokens = [];
    var reach = function (positions, position) {
      while (positions[position] === 0) {
        positions[position] = 1;
        if (position == end || tokens[position] >= 0) return;
        position++;
      }
    };
    if (pattern == '*') return /^.+$/.test(text);
    for (i = 0; i < pattern.length; i++) {
      ch = pattern.charAt(i);
      if (ch == '~' && /^[*?]$/.test(pattern.charAt(i + 1))) {
        tokens.push(pattern.charCodeAt(++i));
      } else {
        tokens.push(ch == '*' ? -1 : ch == '?' ? -2 : pattern.charCodeAt(i));
      }
    }
    end = tokens.length;
    reached = new Uint8Array(end + 1);
    next = new Uint8Array(end + 1);
    reach(reached, 0);
    for (i = 0; i < text.length; i++) {
      code = text.charCodeAt(i);
      wild = code != 10 && code != 13 && code != 8232 && code != 8233;
      next.fill(0);
      for (p = 0; p < end; p++) {
        if (reached[p] === 0) continue;
        if (tokens[p] == -1) {
          if (wild) reach(next, p);
        } else if (tokens[p] == -2 ? wild : tokens[p] == code) {
          reach(next, p + 1);
        }
      }
      swap = reached;
      reached = next;
      next = swap;
    }
    return reached[end] === 1;
  };
  FormulaMut.TestCriteria = function (value, type, criteria) {`,
    'criteria wildcard matcher',
  );
  for (const [start, end] of [
    ['SpreadsheetControlSC.SpreadsheetControlDecodeSpreadsheetSave = function', 'SpreadsheetControlSC.SettingsControls = {'],
    ['SocialCalc.SpreadsheetViewerDecodeSpreadsheetSave = function', '// Closing half of a UMD IIFE.'],
  ]) {
    result = replaceInSection(
      result,
      start,
      end,
      '    boundary = searchinfo[1];',
      "    boundary = searchinfo[1].replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');",
      'save boundary',
    );
  }
  result = replaceOnce(
    result,
    `          var optionRegExp = new RegExp('<option>' + operand_value[1], '');
          parameters.html[2] = options.replace(
            optionRegExp,
            '<option selected>' + operand_value[1],
          );`,
    `          var selectedOption = options.indexOf('<option>' + operand_value[1]);
          parameters.html[2] =
            selectedOption < 0
              ? options
              : options.slice(0, selectedOption) +
                '<option selected>' +
                options.slice(selectedOption + '<option>'.length);`,
    'select option match',
  );
  // Handle missing/malformed default fonts and layouts, plus sparse style tables.
  const precomputeSection = [
    'SC.PrecomputeSheetFontsAndLayouts = function',
    'SC.CalculateCellSkipData = function',
  ];
  result = replaceInSection(
    result,
    ...precomputeSection,
    '      defaultfont = sheetobj.fonts[attribs.defaultfont];',
    "      defaultfont = sheetobj.fonts[attribs.defaultfont] || '';",
    'default font lookup',
  );
  result = replaceInSection(
    result,
    ...precomputeSection,
    `      context.defaultfontstyle = parts[1];
      context.defaultfontsize = parts[2];
      context.defaultfontfamily = parts[3];`,
    `      if (parts) {
        context.defaultfontstyle = parts[1];
        context.defaultfontsize = parts[2];
        context.defaultfontfamily = parts[3];
      }`,
    'default font parts',
  );
  result = replaceInSection(
    result,
    ...precomputeSection,
    '    for (num = 1; num < sheetobj.fonts.length; num++) {\n      s = sheetobj.fonts[num];',
    "    for (num in sheetobj.fonts) {\n      if (!Object.prototype.hasOwnProperty.call(sheetobj.fonts, num) || !(num >= 1)) continue;\n      s = sheetobj.fonts[num];\n      if (!s) continue;",
    'sparse fonts loop',
  );
  result = replaceInSection(
    result,
    ...precomputeSection,
    '      sparts = sheetobj.layouts[attribs.defaultlayout].match(layoutre);\n    } else {',
    "      sparts = (sheetobj.layouts[attribs.defaultlayout] || '').match(layoutre);\n    }\n    if (!sparts) {",
    'default layout parts',
  );
  result = replaceInSection(
    result,
    ...precomputeSection,
    '    for (num = 1; num < sheetobj.layouts.length; num++) {\n      s = sheetobj.layouts[num];',
    "    for (num in sheetobj.layouts) {\n      if (!Object.prototype.hasOwnProperty.call(sheetobj.layouts, num) || !(num >= 1)) continue;\n      s = sheetobj.layouts[num];\n      if (!s) continue;",
    'sparse layouts loop',
  );
  for (const [start, end, layout, font] of [
    ['SC.EncodeCellAttributes = function', 'SC.EncodeSheetAttributes = function', 'cell.layout', 'cell.font'],
    ['SC.EncodeSheetAttributes = function', 'SC.DecodeCellAttributes = function', 'attribs.defaultlayout', 'attribs.defaultfont'],
  ]) {
    for (const [style, firstPart, unset] of [
      [`sheet.layouts[${layout}]`, "SetAttribStar('padtop', parts[1]);", "['', '*', '*', '*', '*', '*']"],
      [`sheet.fonts[${font}]`, "SetAttribStar('fontfamily', parts[3]);", "['', '*', '*', '*']"],
    ]) {
      result = replaceInSection(
        result,
        start,
        end,
        `      parts = ${style}.match(`,
        `      parts = (${style} || '').match(`,
        'settings style lookup',
      );
      result = replaceInSection(
        result,
        start,
        end,
        `      ${firstPart}`,
        `      if (!parts) parts = ${unset};\n      ${firstPart}`,
        'settings style parts',
      );
    }
  }
  // Contain per-cell recalculation exceptions and harden upstream evaluator edge cases.
  result = replaceInSection(
    result,
    'SC.RecalcTimerRoutine = function',
    'SC.RecalcCheckCell = function',
    '        SocialCalc.RecalcCheckCell(sheet, coord);',
    `        try {
          SocialCalc.RecalcCheckCell(sheet, coord);
        } catch (e) {
          delete sheet.checknamecirc;
        }`,
    'recalc check cell error',
  );
  result = replaceInSection(
    result,
    'SC.RecalcTimerRoutine = function',
    'SC.RecalcCheckCell = function',
    '      eresult = scf.evaluate_parsed_formula(cell.parseinfo, sheet, false);',
    `      try {
        eresult = scf.evaluate_parsed_formula(cell.parseinfo, sheet, false);
      } catch (e) {
        delete sheet.checknamecirc;
        eresult = { value: 0, type: 'e#VALUE!', error: 'Formula failed' };
      }`,
    'recalc eval error',
  );
  result = replaceInSection(
    result,
    'FormulaMut.EvaluatePolish = function',
    'FormulaMut.StoreIoEventFormula = function',
    '            value1.value = value1.value.toLowerCase();\n            value2.value = value2.value.toLowerCase();',
    '            value1.value = String(value1.value).toLowerCase();\n            value2.value = String(value2.value).toLowerCase();',
    'eval text comparison',
  );
  result = replaceInSection(
    result,
    'FormulaParseMut.LookupResultType = function',
    "return 'e#VALUE!';",
    '    var table1 = typelookup[type1];',
    '    var table1 = Object.prototype.hasOwnProperty.call(typelookup, type1)\n      ? typelookup[type1]\n      : undefined;',
    'lookup result type',
  );
  result = replaceInSection(
    result,
    'FormulaMut.LookupFunctions = function',
    'FormulaMut.IndexFunction = function',
    '      offsetvalue = Math.floor(offsetvalue.value);\n',
    `      offsetvalue = Math.floor(offsetvalue.value);
      if (!isFinite(offsetvalue)) {
        PushOperand(offsetvalue > 0 ? 'e#REF!' : 'e#VALUE!', 0);
        return;
      }
`,
    'lookup finite offset',
  );
  return result;
}
