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

export function patchSocialCalc(source) {
  let result = replaceOnce(
    source,
    '    sheet.cells = {};',
    '    sheet.cells = Object.create(null);',
    'cell storage',
  );
  result = replaceOnce(
    result,
    "        case 'cell':\n          cell = sheetobj.GetAssuredCell(parts[1]);",
    "        case 'cell':\n          if (!/^[A-Za-z]+[1-9][0-9]*$/.test(parts[1] || '')) break;\n          cell = sheetobj.GetAssuredCell(parts[1]);",
    'saved cell parsing',
  );
  result = replaceOnce(
    result,
    '    return this.cells[coord] || this.AddCell(new SocialCalc.Cell(coord));',
    "    if (!/^[A-Za-z]+[1-9][0-9]*$/.test(coord)) throw new Error('Invalid cell coordinate');\n    return Object.prototype.hasOwnProperty.call(this.cells, coord)\n      ? this.cells[coord]\n      : this.AddCell(new SocialCalc.Cell(coord));",
    'cell lookup',
  );
  result = replaceOnce(
    result,
    '    return SocialCalc.format_number_for_display(cell.datavalue, valuetype, valueformat);',
    `    return SocialCalc.format_number_for_display(cell.datavalue, valuetype, valueformat)
      .replace(/&(amp|lt|gt|quot);/g, function (_match, entity) {
        return { amp: '&', lt: '<', gt: '>', quot: '"' }[entity];
      });`,
    'plain text number export',
  );
  result = replaceInSection(
    result,
    'SC.FormatValueForDisplay = function',
    'SC.format_text_for_display = function',
    '      return displayvalue;\n    }\n    if (valuetype == \'t\')',
    '      return SocialCalc.special_chars(String(displayvalue));\n    }\n    if (valuetype == \'t\')',
    'error display',
  );
  result = replaceInSection(
    result,
    'TableEditorSC.EditorGetStatuslineString = function',
    'TableEditorSC.EditorMouseInfo = {',
    "      sstr += ' &nbsp; ' + scc.s_statusline_circref + circ + '</span>';",
    "      sstr += ' &nbsp; ' + scc.s_statusline_circref + SocialCalc.special_chars(circ) + '</span>';",
    'status display',
  );
  result = replaceOnce(
    result,
    '  SC.Lookup = function (value, list) {',
    `  SC.SafeFormatStyle = function (style) {
    var declarations = style.split(';').filter(Boolean);
    if (declarations.length === 0 || declarations.length > 4) return '';
    var safe = [];
    for (var i = 0; i < declarations.length; i++) {
      var match = /^\\s*([a-z-]+)\\s*:\\s*([^;]+?)\\s*$/.exec(declarations[i]);
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
  result = replaceInSection(
    result,
    'FormatNumberMut.formatNumberWithFormat = function',
    'FormatNumberMut.formatTextWithFormat = function',
    '        result += operandstr;',
    "        result += operandstr === '&nbsp;' ? '&nbsp;' : SocialCalc.special_chars(operandstr);",
    'number format literal',
  );
  result = replaceInSection(
    result,
    'FormatNumberMut.formatNumberWithFormat = function',
    'FormatNumberMut.formatTextWithFormat = function',
    "        result += (operandstr === '$' ? currency_char : operandstr) || operandstr;",
    "        result += SocialCalc.special_chars(String((operandstr === '$' ? currency_char : operandstr) || operandstr));",
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
    '      return SocialCalc.special_chars(value);',
    'text format fallback',
  );
  result = replaceInSection(
    result,
    'FormatNumberMut.formatTextWithFormat = function',
    'FormatNumberMut.parse_format_string = function',
    '          result += value;',
    '          result += SocialCalc.special_chars(value);',
    'text format value',
  );
  result = replaceInSection(
    result,
    'FormatNumberMut.formatTextWithFormat = function',
    'FormatNumberMut.parse_format_string = function',
    "          result += operandstr.replace(/ /g, '&nbsp;');",
    "          result += operandstr === '&nbsp;' ? '&nbsp;' : SocialCalc.special_chars(operandstr).replace(/ /g, '&nbsp;');",
    'text format literal',
  );
  return result;
}
