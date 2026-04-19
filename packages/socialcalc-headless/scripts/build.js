const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, '../node_modules/socialcalc/dist/SocialCalc.js');
const output = path.join(__dirname, '../src/socialcalc.bundled.ts'); // Save as TS so it resolves correctly in vitest

let src = fs.readFileSync(input, 'utf8');

// Fix sloppy mode syntax for ESBuild
src = src.replace(/delete (context|sheet|ele|div|SocialCalc\.Formula\.SheetCache\.sheets\[sheet\]);/g, '$1 = undefined;');
src = src.replace(/\beval\b/g, '_eval_');

// Replicate the exact transformSource from index.ts
src = src.replace(/document\.createElement\(/g, 'SocialCalc.document.createElement(');
src = src.replace(/alert\(/g, '(function(){})(');
src = src.replace(/factory\.call\(root,\s*this\)/g, 'factory.call(root, root)');
src = src.replace(/factory\.bind\(root,\s*this\)/g, 'factory.bind(root, root)');

// Declare all implicit globals found by TS to prevent strict mode ReferenceErrors
const implicitGlobals = [
  '$', 'ampstr', 'cell', 'cellcr', 'clipele', 'cmdline', 'col', 'colHide', 'colpane', 'colWidth', 'coord', 'coord1', 'coord2', 'coord3', 'copyCellRange', 'cr', 'criterianum', 'ctrl', 'delta', 'editor', 'element', 'epsilon', 'fulltext', 'i', 'img', 'j', 'k', 'line', 'maxcol', 'maxrow', 'maxrowspan', 'mspos', 'n_options', 'newtext', 'o', 'oldpos', 'oldtext', 'op', 'parseinfo', 'parts', 'pnum', 'pos', 'quadrant', 'quashedCell', 'quashedCellCoord', 'rangeinfo', 'result', 'ro', 'row', 'rowHide', 'rownum', 'rowpane', 'scc', 'sectioninfo', 'sele', 'sheetobj', 'slast', 'sourceColname', 'sourceRow', 'tb', 'thisformat', 'unhide', 'v1', 'value', 'valueinputwidget', 'vname', 'which', 'wsend'
];

// Wrap in a function to avoid polluting the global scope and return SocialCalc
const wrapped = `// @ts-nocheck
import { ShimNode } from './dom-shim';

export function createSocialCalcFactory() {
  const host = {
    setTimeout: function(cb) { cb(); return 0; },
    clearTimeout: function() {}
  };
  
  let SocialCalc;
  
  (function() {
    var window = this;
    var navigator = { language: "", userAgent: "" };
    var module = undefined;
    var exports = undefined;
    var define = undefined;
    
    // Declare all implicit globals found by TS to prevent strict mode ReferenceErrors
    var ${implicitGlobals.join(', ')};
    
    ${src}
    
    SocialCalc = this.SocialCalc;
  }).call(host);

  SocialCalc.document = SocialCalc.document || {};
  SocialCalc.document.createElement = function (tag) { return new ShimNode(tag); };
  
  return SocialCalc;
}
`;

fs.writeFileSync(output, wrapped);
console.log('Generated socialcalc.bundled.ts');
