//
// The main SocialCalc code module of the SocialCalc package
//
/*
// (c) Copyright 2010 Socialtext, Inc.
// All Rights Reserved.
//
// The contents of this file are subject to the Artistic License 2.0; you may not
// use this file except in compliance with the License. You may obtain a copy of 
// the License at http://socialcalc.org/licenses/al-20/.
//
// Some of the other files in the SocialCalc package are licensed under
// different licenses. Please note the licenses of the modules you use.
//
// Code History:
//
// Initially coded by Dan Bricklin of Software Garden, Inc., for Socialtext, Inc.
// Based in part on the SocialCalc 1.1.0 code written in Perl.
// The SocialCalc 1.1.0 code was:
//    Portions (c) Copyright 2005, 2006, 2007 Software Garden, Inc.
//    All Rights Reserved.
//    Portions (c) Copyright 2007 Socialtext, Inc.
//    All Rights Reserved.
// The Perl SocialCalc started as modifications to the wikiCalc(R) program, version 1.0.
// wikiCalc 1.0 was written by Software Garden, Inc.
// Unless otherwise specified, referring to "SocialCalc" in comments refers to this
// JavaScript version of the code, not the SocialCalc Perl code.
//
*/

/*

**** Overview ****

This is the beginning of a library of routines for displaying and editing spreadsheet
data in a browser. The HTML that includes this does not need to have anything
specific to the spreadsheet or editor already present -- everything is dynamically
added to the DOM by this code, including the rendered sheet and any editing controls.

The library has a few parts. This is the main SocialCalc code module.
Other parts are the Table Editor module, the Formula module, and the Format Number module.
Note: The Table Editor module is licensed under a different license than this module.

The class/object style is derived from O'Reilly's JavaScript by Flanagan, 5th Edition,
section 9.3, page 157.

All of the data, object definitions, functions, etc., are stored as properties of the SocialCalc
object so as not to clutter up the global variables nor conflict with other names.

A design goal (not tested yet for success) is to make it possible to have more than one
spreadsheet active on a page, perhaps even open for editing. It is assumed, though, that
there is only one mouse and one keyboard (a good assumption on most PCs today but not in the
new "touch and surface world" Apple and Microsoft are working towards).

The testing has been on Windows Firefox (2 and 3),
Internet Explorer (6 and 7), Opera (9.23 and mainly later), Mac Safari (3.1), and Mac Firefox (2.0.0.6).
There are small issues with Firefox before 2.0 (cosmetic with drag handles) and larger ones
with Opera before 9.5 (the Delete key isn't recognized in some cases -- the 9.5 version was still
in beta and this bug affects other products like GMail, I believe).

The data is stored in a SocialCalc.Sheet object. The data is organized in a form similar to that
used by SocialCalc 1.1.0. There is a function for converting a normal SocialCalc spreadsheet
save data string (the spreadsheet part of a SocialCalc data file) into this internal form.

The SocialCalc.RenderContext class provides methods for rendering a table into the DOM representing
part of the spreadsheet. It is assumed that the spreadsheet could possibly be very large
and that rendering the whole thing at once could be too time consuming. It is also set up so
that it might be possible to have some of the sheet data only be loaded on demand (such as by Ajax).
The rendering can render cells to the right and below the already active area of the spreadsheet
so that you can scroll to that "clean" area without explicitly doing "add row/column". The class also
does simple operations such as "scrolling" within that table. The table may optionally include
row and column headers and may be split into panes. Most of the code assumes any number of panes,
but only the rightmost pane has scrolling code. In normal operation there would be one or two
panes horizontally and vertically. The panes may start on any row/column, though a given row/column
should only appear in one pane at a time (not all code enforces this, yet).

The RenderContext is designed to be rendered as part of a SocialCalc.TableEditor. The TableEditor
includes the spreadsheet grid as well as scrollbars, pane sliders, and (eventually) editing controls.
The layout is dynamic and may be recomputed on the fly, such as in response to resizing the browser
window.

The scrollbars and pane sliders are created using SocialCalc.TableControl objects. These in turn
make use of Dragging, ToolTip, Button, and MouseWheel functions.

The keyboard input is handled by keyboard code.

There are also some helper routines.

More comments yet to come...

*/


var SocialCalc;
if (!SocialCalc) SocialCalc = {};

// *************************************
//
// Shared values
//
// These are "global" values shared by the classes, including default settings
//
// *************************************

// Callbacks

SocialCalc.Callbacks = {

   // The next two are used by SocialCalc.format_text_for_display

   // The function to expand wiki text - should be set if you want wikitext expansion
   // The form is: expand_wiki(displayvalue, sheetobj, linkstyle, valueformat)
   //    valueformat is text-wiki followed by optional sub-formats, e.g., text-wikipagelink

   expand_wiki: null,

   expand_markup: function(displayvalue, sheetobj, linkstyle) // the old function to expand wiki text - may be replaced
                   {return SocialCalc.default_expand_markup(displayvalue, sheetobj, linkstyle);},

   // MakePageLink is used to create the href for a link to another "page"
   // The form is: MakePageLink(pagename, workspacename, linktyle, valueformat), returns string

   MakePageLink: null,

   // NormalizeSheetName is used to make different variations of sheetnames use the same cache slot

   NormalizeSheetName: null // use default - lowercase

   };

// Shared flags

   // none at present


// *************************************
//
// Cell class:
//
// *************************************

//
// Class SocialCalc.Cell
//
// Usage: var s = new SocialCalc.Cell(coord);
//
// Cell attributes include:
//
//    coord: the column/row as a string, e.g., "A1"
//    datavalue: the value to be used for computation and formatting for display,
//               string or numeric (tolerant of numbers stored as strings)
//    datatype: if present, v=numeric value, t=text value, f=formula,
//              or c=constant that is not a simple number (like "$1.20")
//    formula: if present, the formula (without leading "=") for computation or the constant
//    valuetype: first char is main type, the following are sub-types.
//               Main types are b=blank cell, n=numeric, t=text, e=error
//               Examples of using sub-types would be "nt" for a numeric time value, "n$" for currency, "nl" for logical
//    readonly: if present, whether the current cell is read-only of writable
//    displayvalue: if present, rendered version of datavalue with formatting attributes applied
//    parseinfo: if present, cached parsed version of formula
//
//    The following optional values, if present, are mainly used in rendering, overriding defaults:
//
//    bt, br, bb, bl: number of border's definition
//    layout: layout (vertical alignment, padding) definition number
//    font: font definition number
//    color: text color definition number
//    bgcolor: background color definition number
//    cellformat: cell format (horizontal alignment) definition number
//    nontextvalueformat: custom format definition number for non-text values, e.g., numbers
//    textvalueformat: custom format definition number for text values
//    colspan, rowspan: number of cells to span for merged cells (only on main cell)
//    cssc: custom css classname for cell, as text (no special chars)
//    csss: custom css style definition
//    mod: modification allowed flag "y" if present
//    comment: cell comment string
//

SocialCalc.Cell = function(coord) {

   this.coord = coord;
   this.datavalue = "";
   this.datatype = null;
   this.formula = "";
   this.valuetype = "b";
   this.readonly = false;

   }

// The types of cell properties
//
// Type 1: Base, Type 2: Attribute, Type 3: Special (e.g., displaystring, parseinfo)

SocialCalc.CellProperties = {
   coord: 1, datavalue: 1, datatype: 1, formula: 1, valuetype: 1, errors: 1, comment: 1, readonly: 1,
   bt: 2, br: 2, bb: 2, bl: 2, layout: 2, font: 2, color: 2, bgcolor: 2,
   cellformat: 2, nontextvalueformat: 2, textvalueformat: 2, colspan: 2, rowspan: 2,
   cssc: 2, csss: 2, mod: 2,
   displaystring: 3, // used to cache rendered HTML of cell contents
   parseinfo: 3, // used to cache parsed formulas
   hcolspan: 3, hrowspan: 3 // spans taking hidden cols/rows into account (!!! NOT YET !!!)
   };

SocialCalc.CellPropertiesTable = {
   bt: "borderstyle", br: "borderstyle", bb: "borderstyle", bl: "borderstyle",
   layout: "layout", font: "font", color: "color", bgcolor: "color",
   cellformat: "cellformat", nontextvalueformat: "valueformat", textvalueformat: "valueformat"
   };

// *************************************
//
// Sheet class:
//
// *************************************

//
// Class SocialCalc.Sheet
//
// Usage: var s = new SocialCalc.Sheet();
//

SocialCalc.Sheet = function() {

   SocialCalc.ResetSheet(this);

   // Set other values:
   //
   // sheet.statuscallback(data, status, arg, this.statuscallbackparams) is called
   // during recalc and commands.
   //
   // During recalc, data is the current recalcdata.
   // The values for status and the corresponding arg are:
   //
   //    calcorder, {coord: coord, total: celllist length, count: count} [0 or more times per recalc]
   //    calccheckdone, calclist length [once per recalc]
   //    calcstep, {coord: coord, total: calclist length, count: count} [0 or more times per recalc]
   //    calcloading, {sheetname: name-of-sheet}
   //    calcserverfunc, {funcname: name-of-function, coord: coord, total: calclist length, count: count}
   //    calcfinished, time in milliseconds [once per recalc]
   //
   // During commands, data is SocialCalc.SheetCommandInfo.
   // These values for status and arg are:
   //
   //    cmdstart, cmdstr
   //    cmdend
   //

   this.statuscallback = null; // routine called with cmdstart, calcstart, etc., status and args:
                                // sheet.statuscallback(data, status, arg, params)
   this.statuscallbackparams = null; // parameters passed to that routine

   }

//
// SocialCalc.ResetSheet(sheet)
//
// Resets (and/or initializes) sheet data values.
// 

SocialCalc.ResetSheet = function(sheet, reload) {

   // properties:

   sheet.cells = {}; // at least one for each non-blank cell: coord: cell-object
   sheet.attribs = // sheet attributes
      {
         lastcol: 1,
         lastrow: 1,
         defaultlayout: 0,
         usermaxcol: 0,
         usermaxrow: 0

      };
   sheet.rowattribs =
      {
         hide: {}, // access by row number
         height: {}
      };
   sheet.colattribs =
      {
         width: {}, // access by col name
         hide: {}
      };
   sheet.names={}; // Each is: {desc: "optional description", definition: "B5, A1:B7, or =formula"}
   sheet.layouts=[];
   sheet.layouthash={};
   sheet.fonts=[];
   sheet.fonthash={};
   sheet.colors=[];
   sheet.colorhash={};
   sheet.borderstyles=[];
   sheet.borderstylehash={};
   sheet.cellformats=[];
   sheet.cellformathash={};
   sheet.valueformats=[];
   sheet.valueformathash={};

   sheet.copiedfrom = ""; // if a range, then this was loaded from a saved range as clipboard content

   sheet.changes = new SocialCalc.UndoStack();

   sheet.renderneeded = false;

   sheet.changedrendervalues = true; // if true, spans and/or fonts have changed (set by ExecuteSheetCommand & GetStyle)

   sheet.recalcchangedavalue = false; // true if a recalc resulted in a change to a cell's calculated value

   sheet.hiddencolrow = ""; // "col" or "row" if it was hidden

   sheet.sci = new SocialCalc.SheetCommandInfo(sheet);

   }

// Methods:

SocialCalc.Sheet.prototype.ResetSheet = function() {SocialCalc.ResetSheet(this);};
SocialCalc.Sheet.prototype.AddCell = function(newcell) {return this.cells[newcell.coord]=newcell;};
SocialCalc.Sheet.prototype.GetAssuredCell = function(coord) {
   return this.cells[coord] || this.AddCell(new SocialCalc.Cell(coord));
   };
SocialCalc.Sheet.prototype.ParseSheetSave = function(savedsheet) {SocialCalc.ParseSheetSave(savedsheet,this);};
SocialCalc.Sheet.prototype.CellFromStringParts = function(cell, parts, j) {return SocialCalc.CellFromStringParts(this, cell, parts, j);};
SocialCalc.Sheet.prototype.CreateSheetSave = function(range, canonicalize) {return SocialCalc.CreateSheetSave(this, range, canonicalize);};
SocialCalc.Sheet.prototype.CellToString = function(cell) {return SocialCalc.CellToString(this, cell);};
SocialCalc.Sheet.prototype.CanonicalizeSheet = function(full) {return SocialCalc.CanonicalizeSheet(this, full);};
SocialCalc.Sheet.prototype.EncodeCellAttributes = function(coord) {return SocialCalc.EncodeCellAttributes(this, coord);};
SocialCalc.Sheet.prototype.EncodeSheetAttributes = function() {return SocialCalc.EncodeSheetAttributes(this);};
SocialCalc.Sheet.prototype.DecodeCellAttributes = function(coord, attribs, range) {return SocialCalc.DecodeCellAttributes(this, coord, attribs, range);};
SocialCalc.Sheet.prototype.DecodeSheetAttributes = function(attribs) {return SocialCalc.DecodeSheetAttributes(this, attribs);};

SocialCalc.Sheet.prototype.ScheduleSheetCommands = function(cmd, saveundo) {return SocialCalc.ScheduleSheetCommands(this, cmd, saveundo);};
SocialCalc.Sheet.prototype.SheetUndo = function() {return SocialCalc.SheetUndo(this);};
SocialCalc.Sheet.prototype.SheetRedo = function() {return SocialCalc.SheetRedo(this);};
SocialCalc.Sheet.prototype.CreateAuditString = function() {return SocialCalc.CreateAuditString(this);};
SocialCalc.Sheet.prototype.GetStyleNum = function(atype, style) {return SocialCalc.GetStyleNum(this, atype, style);};
SocialCalc.Sheet.prototype.GetStyleString = function(atype, num) {return SocialCalc.GetStyleString(this, atype, num);};
SocialCalc.Sheet.prototype.RecalcSheet = function() {return SocialCalc.RecalcSheet(this);};

//
// Sheet save format:
//
// linetype:param1:param2:...
//
// Linetypes are:
//
//    version:versionname - version of this format. Currently 1.4.
//
//    cell:coord:type:value...:type:value... - Types are as follows:
//
//       v:value - straight numeric value
//       t:value - straight text/wiki-text in cell, encoded to handle \, :, newlines
//       vt:fulltype:value - value with value type/subtype
//       vtf:fulltype:value:formulatext - formula resulting in value with value type/subtype, value and text encoded
//       vtc:fulltype:value:valuetext - formatted text constant resulting in value with value type/subtype, value and text encoded
//       vf:fvalue:formulatext - formula resulting in value, value and text encoded (obsolete: only pre format version 1.1)
//          fvalue - first char is "N" for numeric value, "T" for text value, "H" for HTML value, rest is the value
//       e:errortext - Error text. Non-blank means formula parsing/calculation results in error.
//       b:topborder#:rightborder#:bottomborder#:leftborder# - border# in sheet border list or blank if none
//       l:layout# - number in cell layout list
//       f:font# - number in sheet fonts list
//       c:color# - sheet color list index for text
//       bg:color# - sheet color list index for background color
//       cf:format# - sheet cell format number for explicit format (align:left, etc.)
//       cvf:valueformat# - sheet cell value format number (obsolete: only pre format v1.2)
//       tvf:valueformat# - sheet cell text value format number
//       ntvf:valueformat# - sheet cell non-text value format number
//       colspan:numcols - number of columns spanned in merged cell
//       rowspan:numrows - number of rows spanned in merged cell
//       cssc:classname - name of CSS class to be used for cell when published instead of one calculated here
//       csss:styletext - explicit CSS style information, encoded to handle :, etc.
//       mod:allow - if "y" allow modification of cell for live "view" recalc
//       comment:value - encoded text of comment for this cell (added in v1.5)
//
//    col:
//       w:widthval - number, "auto" (no width in <col> tag), number%, or blank (use default)
//       hide: - yes/no, no is assumed if missing
//    row:
//       hide - yes/no, no is assumed if missing
//
//    sheet:
//       c:lastcol - number
//       r:lastrow - number
//       w:defaultcolwidth - number, "auto", number%, or blank (default->80)
//       h:defaultrowheight - not used
//       tf:format# - cell format number for sheet default for text values
//       ntf:format# - cell format number for sheet default for non-text values (i.e., numbers)
//       layout:layout# - default cell layout number in cell layout list
//       font:font# - default font number in sheet font list
//       vf:valueformat# - default number value format number in sheet valueformat list (obsolete: only pre format version 1.2)
//       ntvf:valueformat# - default non-text (number) value format number in sheet valueformat list
//       tvf:valueformat# - default text value format number in sheet valueformat list
//       color:color# - default number for text color in sheet color list
//       bgcolor:color# - default number for background color in sheet color list
//       circularreferencecell:coord - cell coord with a circular reference
//       recalc:value - on/off (on is default). If not "off", appropriate changes to the sheet cause a recalc
//       needsrecalc:value - yes/no (no is default). If "yes", formula values are not up to date
//       usermaxcol:value - maximum column to display, 0 for unlimited (default=0)
//       usermaxrow:value - maximum row to display, 0 for unlimited (default=0)
//
//    name:name:description:value - name definition, name in uppercase, with value being "B5", "A1:B7", or "=formula";
//                                  description and value are encoded.
//    font:fontnum:value - text of font definition (style weight size family) for font fontnum
//                         "*" for "style weight", size, or family, means use default (first look to sheet, then builtin)
//    color:colornum:rgbvalue - text of color definition (e.g., rgb(255,255,255)) for color colornum
//    border:bordernum:value - text of border definition (thickness style color) for border bordernum
//    layout:layoutnum:value - text of vertical alignment and padding style for cell layout layoutnum (* for default):
//                             vertical-alignment:vavalue;padding:topval rightval bottomval leftval;
//    cellformat:cformatnum:value - text of cell alignment (left/center/right) for cellformat cformatnum
//    valueformat:vformatnum:value - text of number format (see FormatValueForDisplay) for valueformat vformatnum (changed in v1.2)
//    clipboardrange:upperleftcoord:bottomrightcoord - ignored -- from wikiCalc
//    clipboard:coord:type:value:... - ignored -- from wikiCalc
//
// If this is clipboard contents, then there is also information to facilitate pasting:
//
//    copiedfrom:upperleftcoord:bottomrightcoord - range from which this was copied
//

// Functions:

SocialCalc.ParseSheetSave = function(savedsheet,sheetobj) {

   var lines=savedsheet.split(/\r\n|\n/);
   var parts=[];
   var line;
   var i, j, t, v, coord, cell, attribs, name;
   var scc = SocialCalc.Constants;

   for (i=0;i<lines.length;i++) {
      line=lines[i];
      parts = line.split(":");
      switch (parts[0]) {
         case "cell":
            cell=sheetobj.GetAssuredCell(parts[1]);
            j=2;
            sheetobj.CellFromStringParts(cell, parts, j);
            break;

         case "col":
            coord=parts[1];
            j=2;
            while (t=parts[j++]) {
               switch (t) {
                  case "w":
                     sheetobj.colattribs.width[coord]=parts[j++]; // must be text - could be auto or %, etc.
                     break;
                  case "hide":
                     sheetobj.colattribs.hide[coord]=parts[j++];
                     break;
                  default:
                     throw scc.s_pssUnknownColType+" '"+t+"'";
                     break;
                  }
               }
            break;

         case "row":
            coord=parts[1]-0;
            j=2;
            while (t=parts[j++]) {
               switch (t) {
                  case "h":
                     sheetobj.rowattribs.height[coord]=parts[j++]-0;
                     break;
                  case "hide":
                     sheetobj.rowattribs.hide[coord]=parts[j++];
                     break;
                  default:
                     throw scc.s_pssUnknownRowType+" '"+t+"'";
                     break;
                  }
               }
            break;

         case "sheet":
            attribs=sheetobj.attribs;
            j=1;
            while (t=parts[j++]) {
               switch (t) {
                  case "c":
                     attribs.lastcol=parts[j++]-0;
                     break;
                  case "r":
                     attribs.lastrow=parts[j++]-0;
                     break;
                  case "w":
                     attribs.defaultcolwidth=parts[j++]+"";
                     break;
                  case "h":
                     attribs.defaultrowheight=parts[j++]-0;
                     break;
                  case "tf":
                     attribs.defaulttextformat=parts[j++]-0;
                     break;
                  case "ntf":
                     attribs.defaultnontextformat=parts[j++]-0;
                     break;
                  case "layout":
                     attribs.defaultlayout=parts[j++]-0;
                     break;
                  case "font":
                     attribs.defaultfont=parts[j++]-0;
                     break;
                  case "tvf":
                     attribs.defaulttextvalueformat=parts[j++]-0;
                     break;
                  case "ntvf":
                     attribs.defaultnontextvalueformat=parts[j++]-0;
                     break;
                  case "color":
                     attribs.defaultcolor=parts[j++]-0;
                     break;
                  case "bgcolor":
                     attribs.defaultbgcolor=parts[j++]-0;
                     break;
                  case "circularreferencecell":
                     attribs.circularreferencecell=parts[j++];
                     break;
                  case "recalc":
                     attribs.recalc=parts[j++];
                     break;
                  case "needsrecalc":
                     attribs.needsrecalc=parts[j++];
                     break;
                  case "usermaxcol":
                     attribs.usermaxcol=parts[j++]-0;
                     break;
                  case "usermaxrow":
                     attribs.usermaxrow=parts[j++]-0;
                     break;
                  default:
                     j+=1;
                     break;
                  }
               }
            break;

         case "name":
            name = SocialCalc.decodeFromSave(parts[1]).toUpperCase();
            sheetobj.names[name] = {desc: SocialCalc.decodeFromSave(parts[2])};
            sheetobj.names[name].definition = SocialCalc.decodeFromSave(parts[3]);
            break;

         case "layout":
            parts=lines[i].match(/^layout\:(\d+)\:(.+)$/); // layouts can have ":" in them
            sheetobj.layouts[parts[1]-0]=parts[2];
            sheetobj.layouthash[parts[2]]=parts[1]-0;
            break;

         case "font":
            sheetobj.fonts[parts[1]-0]=parts[2];
            sheetobj.fonthash[parts[2]]=parts[1]-0;
            break;

         case "color":
            sheetobj.colors[parts[1]-0]=parts[2];
            sheetobj.colorhash[parts[2]]=parts[1]-0;
            break;

         case "border":
            sheetobj.borderstyles[parts[1]-0]=parts[2];
            sheetobj.borderstylehash[parts[2]]=parts[1]-0;
            break;

         case "cellformat":
            v=SocialCalc.decodeFromSave(parts[2]);
            sheetobj.cellformats[parts[1]-0]=v;
            sheetobj.cellformathash[v]=parts[1]-0;
            break;

         case "valueformat":
            v=SocialCalc.decodeFromSave(parts[2]);
            sheetobj.valueformats[parts[1]-0]=v;
            sheetobj.valueformathash[v]=parts[1]-0;
            break;

         case "version":
            break;

         case "copiedfrom":
            sheetobj.copiedfrom = parts[1]+":"+parts[2];
            break;

         case "clipboardrange": // in save versions up to 1.3. Ignored.
         case "clipboard":
            break;

         case "":
            break;

         default:
alert(scc.s_pssUnknownLineType+" '"+parts[0]+"'");
            throw scc.s_pssUnknownLineType+" '"+parts[0]+"'";
            break;
         }
      parts = null;
      }

   }

//
// SocialCalc.CellFromStringParts(sheet, cell, parts, j)
//
// Takes string that has been split by ":" in parts, starting at item j,
// and fills in cell assuming save format.
//

SocialCalc.CellFromStringParts = function(sheet, cell, parts, j) {

   var cell, t, v;

   while (t=parts[j++]) {
      switch (t) {
         case "v":
            cell.datavalue=SocialCalc.decodeFromSave(parts[j++])-0;
            cell.datatype="v";
            cell.valuetype="n";
            break;
         case "t":
            cell.datavalue=SocialCalc.decodeFromSave(parts[j++]);
            cell.datatype="t";
            cell.valuetype=SocialCalc.Constants.textdatadefaulttype; 
            break;
         case "vt":
            v=parts[j++];
            cell.valuetype=v;
            if (v.charAt(0)=="n") {
               cell.datatype="v";
               cell.datavalue=SocialCalc.decodeFromSave(parts[j++])-0;
               }
            else {
               cell.datatype="t";
               cell.datavalue=SocialCalc.decodeFromSave(parts[j++]);
               }
            break;
         case "vtf":
            v=parts[j++];
            cell.valuetype=v;
            if (v.charAt(0)=="n") {
               cell.datavalue=SocialCalc.decodeFromSave(parts[j++])-0;
               }
            else {
               cell.datavalue=SocialCalc.decodeFromSave(parts[j++]);
               }
            cell.formula=SocialCalc.decodeFromSave(parts[j++]);
            cell.datatype="f";
            break;
         case "vtc":
            v=parts[j++];
            cell.valuetype=v;
            if (v.charAt(0)=="n") {
               cell.datavalue=SocialCalc.decodeFromSave(parts[j++])-0;
               }
            else {
               cell.datavalue=SocialCalc.decodeFromSave(parts[j++]);
               }
            cell.formula=SocialCalc.decodeFromSave(parts[j++]);
            cell.datatype="c";
            break;
         case "ro":
            ro=SocialCalc.decodeFromSave(parts[j++]);
            cell.readonly=ro.toLowerCase()=="yes";
            break;
         case "e":
            cell.errors=SocialCalc.decodeFromSave(parts[j++]);
            break;
         case "b":
            cell.bt=parts[j++]-0;
            cell.br=parts[j++]-0;
            cell.bb=parts[j++]-0;
            cell.bl=parts[j++]-0;
            break;
         case "l":
            cell.layout=parts[j++]-0;
            break;
         case "f":
            cell.font=parts[j++]-0;
            break;
         case "c":
            cell.color=parts[j++]-0;
            break;
         case "bg":
            cell.bgcolor=parts[j++]-0;
            break;
         case "cf":
            cell.cellformat=parts[j++]-0;
            break;
         case "ntvf":
            cell.nontextvalueformat=parts[j++]-0;
            break;
         case "tvf":
            cell.textvalueformat=parts[j++]-0;
            break;
         case "colspan":
            cell.colspan=parts[j++]-0;
            break;
         case "rowspan":
            cell.rowspan=parts[j++]-0;
            break;
         case "cssc":
            cell.cssc=parts[j++];
            break;
         case "csss":
            cell.csss=SocialCalc.decodeFromSave(parts[j++]);
            break;
         case "mod":
            j+=1;
            break;
         case "comment":
            cell.comment=SocialCalc.decodeFromSave(parts[j++]);
            break;
         default:
            throw SocialCalc.Constants.s_cfspUnknownCellType+" '"+t+"'";
            break;
         }
      }

   }


SocialCalc.sheetfields = ["defaultrowheight", "defaultcolwidth", "circularreferencecell", "recalc", "needsrecalc", "usermaxcol", "usermaxrow"];
SocialCalc.sheetfieldsshort = ["h", "w", "circularreferencecell", "recalc", "needsrecalc", "usermaxcol", "usermaxrow"];

SocialCalc.sheetfieldsxlat = ["defaulttextformat", "defaultnontextformat",
                              "defaulttextvalueformat", "defaultnontextvalueformat",
                              "defaultcolor", "defaultbgcolor", "defaultfont", "defaultlayout"];
SocialCalc.sheetfieldsxlatshort = ["tf", "ntf", "tvf", "ntvf", "color", "bgcolor", "font", "layout"];
SocialCalc.sheetfieldsxlatxlt = ["cellformat", "cellformat", "valueformat", "valueformat",
                                  "color", "color", "font", "layout"];

//
// sheetstr = SocialCalc.CreateSheetSave(sheetobj, range, canonicalize)
//
// Creates a text representation of the sheetobj data.
// If the range is present then only those cells are saved
// (as clipboard data with "copiedfrom" set).
//

SocialCalc.CreateSheetSave = function(sheetobj, range, canonicalize) {

   var cell, cr1, cr2, row, col, coord, attrib, line, value, formula, i, t, r, b, l, name, blanklen;
   var result=[];

   var prange;

   sheetobj.CanonicalizeSheet(canonicalize || SocialCalc.Constants.doCanonicalizeSheet);
   var xlt = sheetobj.xlt;

   if (range) {
      prange = SocialCalc.ParseRange(range);
      }
   else {
      prange = {cr1: {row: 1, col:1},
                cr2: {row: xlt.maxrow, col: xlt.maxcol}};
      }
   cr1 = prange.cr1;
   cr2 = prange.cr2;

   result.push("version:1.5");

   for (row=cr1.row; row <= cr2.row; row++) {
      for (col=cr1.col; col <= cr2.col; col++) {
         coord = SocialCalc.crToCoord(col, row);
         cell=sheetobj.cells[coord];
         if (!cell) continue;
         line=sheetobj.CellToString(cell);
         if (line.length==0) continue; // ignore completely empty cells
         line="cell:"+coord+line;
         result.push(line);
         }
      }

   for (col=1; col <= xlt.maxcol; col++) {
      coord = SocialCalc.rcColname(col);
      if (sheetobj.colattribs.width[coord])
         result.push("col:"+coord+":w:"+sheetobj.colattribs.width[coord]);
      if (sheetobj.colattribs.hide[coord])
         result.push("col:"+coord+":hide:"+sheetobj.colattribs.hide[coord]);
      }

   for (row=1; row <= xlt.maxrow; row++) {
      if (sheetobj.rowattribs.height[row])
         result.push("row:"+row+":h:"+sheetobj.rowattribs.height[row]);
      if (sheetobj.rowattribs.hide[row])
         result.push("row:"+row+":hide:"+sheetobj.rowattribs.hide[row]);
      }

   line="sheet:c:"+xlt.maxcol+":r:"+xlt.maxrow;

   for (i=0; i<SocialCalc.sheetfields.length; i++) { // non-xlated values
      value = SocialCalc.encodeForSave(sheetobj.attribs[SocialCalc.sheetfields[i]]);
      if (value) line+=":"+SocialCalc.sheetfieldsshort[i]+":"+value;
      }
   for (i=0; i<SocialCalc.sheetfieldsxlat.length; i++) { // xlated values
      value = sheetobj.attribs[SocialCalc.sheetfieldsxlat[i]];
      if (value) line+=":"+SocialCalc.sheetfieldsxlatshort[i]+":"+xlt[SocialCalc.sheetfieldsxlatxlt[i]+"sxlat"][value];
      }

   result.push(line);

   for (i=1;i<xlt.newborderstyles.length;i++) {
      result.push("border:"+i+":"+xlt.newborderstyles[i]);
      }

   for (i=1;i<xlt.newcellformats.length;i++) {
      result.push("cellformat:"+i+":"+SocialCalc.encodeForSave(xlt.newcellformats[i]));
      }

   for (i=1;i<xlt.newcolors.length;i++) {
      result.push("color:"+i+":"+xlt.newcolors[i]);
      }

   for (i=1;i<xlt.newfonts.length;i++) {
      result.push("font:"+i+":"+xlt.newfonts[i]);
      }

   for (i=1;i<xlt.newlayouts.length;i++) {
      result.push("layout:"+i+":"+xlt.newlayouts[i]);
      }

   for (i=1;i<xlt.newvalueformats.length;i++) {
      result.push("valueformat:"+i+":"+SocialCalc.encodeForSave(xlt.newvalueformats[i]));
      }

   for (i=0; i<xlt.namesorder.length; i++) {
      name = xlt.namesorder[i];
      result.push("name:"+SocialCalc.encodeForSave(name).toUpperCase()+":"+
                   SocialCalc.encodeForSave(sheetobj.names[name].desc)+":"+
                   SocialCalc.encodeForSave(sheetobj.names[name].definition));
      }

   if (range) {
      result.push("copiedfrom:"+SocialCalc.crToCoord(cr1.col, cr1.row)+":"+
                  SocialCalc.crToCoord(cr2.col, cr2.row));
      }

   result.push(""); // one extra to get extra \n

   delete sheetobj.xlt; // clean up

   return result.join("\n");
   }

//
// line = SocialCalc.CellToString(sheet, cell)
//

SocialCalc.CellToString = function(sheet, cell) {

   var cell, line, value, formula, t, r, b, l, xlt;

   line = "";

   if (!cell) return line;

   value = SocialCalc.encodeForSave(cell.datavalue);
   if (cell.datatype=="v") {
      if (cell.valuetype=="n") line += ":v:"+value;
      else line += ":vt:"+cell.valuetype+":"+value;
      }
   else if (cell.datatype=="t") {
      if (cell.valuetype==SocialCalc.Constants.textdatadefaulttype)
         line += ":t:"+value;
      else line += ":vt:"+cell.valuetype+":"+value;
      }
   else {
      formula = SocialCalc.encodeForSave(cell.formula);
      if (cell.datatype=="f") {
         line += ":vtf:"+cell.valuetype+":"+value+":"+formula;
         }
      else if (cell.datatype=="c") {
         line += ":vtc:"+cell.valuetype+":"+value+":"+formula;
         }
      }
   if (cell.readonly) {
      line += ":ro:yes";
      }
   if (cell.errors) {
      line += ":e:"+SocialCalc.encodeForSave(cell.errors);
      }
   t = cell.bt || "";
   r = cell.br || "";
   b = cell.bb || "";
   l = cell.bl || "";

   if (sheet.xlt) { // if have canonical save info
      xlt = sheet.xlt;
      if (t || r || b || l)
      line += ":b:"+xlt.borderstylesxlat[t||0]+":"+xlt.borderstylesxlat[r||0]+":"+xlt.borderstylesxlat[b||0]+":"+xlt.borderstylesxlat[l||0];
      if (cell.layout) line += ":l:"+xlt.layoutsxlat[cell.layout];
      if (cell.font) line += ":f:"+xlt.fontsxlat[cell.font];
      if (cell.color) line += ":c:"+xlt.colorsxlat[cell.color];
      if (cell.bgcolor) line += ":bg:"+xlt.colorsxlat[cell.bgcolor];
      if (cell.cellformat) line += ":cf:"+xlt.cellformatsxlat[cell.cellformat];
      if (cell.textvalueformat) line += ":tvf:"+xlt.valueformatsxlat[cell.textvalueformat];
      if (cell.nontextvalueformat) line += ":ntvf:"+xlt.valueformatsxlat[cell.nontextvalueformat];
      }
   else {
      if (t || r || b || l)
      line += ":b:"+t+":"+r+":"+b+":"+l;
      if (cell.layout) line += ":l:"+cell.layout;
      if (cell.font) line += ":f:"+cell.font;
      if (cell.color) line += ":c:"+cell.color;
      if (cell.bgcolor) line += ":bg:"+cell.bgcolor;
      if (cell.cellformat) line += ":cf:"+cell.cellformat;
      if (cell.textvalueformat) line += ":tvf:"+cell.textvalueformat;
      if (cell.nontextvalueformat) line += ":ntvf:"+cell.nontextvalueformat;
      }
   if (cell.colspan) line += ":colspan:"+cell.colspan;
   if (cell.rowspan) line += ":rowspan:"+cell.rowspan;
   if (cell.cssc) line += ":cssc:"+cell.cssc;
   if (cell.csss) line += ":csss:"+SocialCalc.encodeForSave(cell.csss);
   if (cell.mod) line += ":mod:"+cell.mod;
   if (cell.comment) line += ":comment:"+SocialCalc.encodeForSave(cell.comment);

   return line;

   }

//
// SocialCalc.CanonicalizeSheet(sheetobj, full)
//
// Goes through the sheet and fills in sheetobj.xlt with the following:
//
//   .maxrow, .maxcol - lastrow and lastcol are as small as possible
//   .newlayouts - new version of sheetobj.layouts without unused ones and all in ascending order
//   .layoutsxlat - maps old layouts index to new one
//   same ".new" and ".xlat" for fonts, colors, borderstyles, cell and value formats
//   .namesorder - array with names sorted
//
// If full or SocialCalc.Constants.doCanonicalizeSheet are not true, then the values will leave things unchanged (to save time, etc.)
//
// sheetobj.xlt should be deleted when you are finished using it
//

SocialCalc.CanonicalizeSheet = function(sheetobj, full) {

   var l, coord, cr, cell, filled, an, a, newa, newxlat, used, ahash, i, v;
   var maxrow = 0;
   var maxcol = 0;
   var alist = ["borderstyle", "cellformat", "color", "font", "layout", "valueformat"];

   var xlt = {};

   xlt.namesorder = []; // always return a sorted list
   for (a in sheetobj.names) {
      xlt.namesorder.push(a);
      }
   xlt.namesorder.sort();

   if (!SocialCalc.Constants.doCanonicalizeSheet || !full) { // return make-no-changes values if not wanted
      for (an=0; an<alist.length; an++) {
         a = alist[an];
         xlt["new"+a+"s"] = sheetobj[a+"s"];
         l = sheetobj[a+"s"].length;
         newxlat = new Array(l);
         newxlat[0] = "";
         for (i=1; i<l; i++) {
            newxlat[i] = i;
            }
         xlt[a+"sxlat"] = newxlat;
         }

      xlt.maxrow = sheetobj.attribs.lastrow;
      xlt.maxcol = sheetobj.attribs.lastcol;

      sheetobj.xlt = xlt;

      return;
      }

   for (an=0; an<alist.length; an++) {
      a = alist[an];
      xlt[a+"sUsed"] = {};
      }

   var colorsUsed = xlt.colorsUsed;
   var borderstylesUsed = xlt.borderstylesUsed;
   var fontsUsed = xlt.fontsUsed;
   var layoutsUsed = xlt.layoutsUsed;
   var cellformatsUsed = xlt.cellformatsUsed;
   var valueformatsUsed = xlt.valueformatsUsed;

   for (coord in sheetobj.cells) { // check all cells to see which values are used
      cr = SocialCalc.coordToCr(coord);
      cell = sheetobj.cells[coord];
      filled = false;

      if (cell.valuetype && cell.valuetype!="b") filled = true;

      if (cell.color) {
         colorsUsed[cell.color] = 1;
         filled = true;
         }

      if (cell.bgcolor) {
         colorsUsed[cell.bgcolor] = 1;
         filled = true;
         }

      if (cell.bt) {
         borderstylesUsed[cell.bt] = 1;
         filled = true;
         }
      if (cell.br) {
         borderstylesUsed[cell.br] = 1;
         filled = true;
         }
      if (cell.bb) {
         borderstylesUsed[cell.bb] = 1;
         filled = true;
         }
      if (cell.bl) {
         borderstylesUsed[cell.bl] = 1;
         filled = true;
         }

      if (cell.layout) {
         layoutsUsed[cell.layout] = 1;
         filled = true;
         }

      if (cell.font) {
         fontsUsed[cell.font] = 1;
         filled = true;
         }

      if (cell.cellformat) {
         cellformatsUsed[cell.cellformat] = 1;
         filled = true;
         }

      if (cell.textvalueformat) {
         valueformatsUsed[cell.textvalueformat] = 1;
         filled = true;
         }

      if (cell.nontextvalueformat) {
         valueformatsUsed[cell.nontextvalueformat] = 1;
         filled = true;
         }

      if (filled) {
         if (cr.row > maxrow) maxrow = cr.row;
         if (cr.col > maxcol) maxcol = cr.col;
         }
      }

   for (i=0; i<SocialCalc.sheetfieldsxlat.length; i++) { // do sheet values, too
      v = sheetobj.attribs[SocialCalc.sheetfieldsxlat[i]];
      if (v) {
         xlt[SocialCalc.sheetfieldsxlatxlt[i]+"sUsed"][v] = 1;
         }
      }

   a = {"height": 1, "hide": 1}; // look at explicit row settings
   for (v in a) {
      for (cr in sheetobj.rowattribs[v]) {
         if (cr > maxrow) maxrow = cr;
         }
      }
   a = {"hide": 1, "width": 1}; // look at explicit col settings
   for (v in a) {
      for (coord in sheetobj.colattribs[v]) {
         cr = SocialCalc.coordToCr(coord+"1");
         if (cr.col > maxcol) maxcol = cr.col;
         }
      }

   for (an=0; an<alist.length; an++) { // go through the attribs we want
      a = alist[an];

      newa = [];
      used = xlt[a+"sUsed"];
      for (v in used) {
         newa.push(sheetobj[a+"s"][v]);
         }
      newa.sort();
      newa.unshift("");

      newxlat = [""];
      ahash = sheetobj[a+"hash"];

      for (i=1; i<newa.length; i++) {
         newxlat[ahash[newa[i]]] = i;
         }

      xlt[a+"sxlat"] = newxlat;
      xlt["new"+a+"s"] = newa;

      }

   xlt.maxrow = maxrow || 1;
   xlt.maxcol = maxcol || 1;

   sheetobj.xlt = xlt; // leave for use by caller

   }

//
// result = SocialCalc.EncodeCellAttributes(sheet, coord)
//
// Returns the cell's attributes in an object, each in the following form:
//
//    attribname: {def: true/false, val: full-value}
//

SocialCalc.EncodeCellAttributes = function(sheet, coord) {

   var value, i, b, bb;
   var result = {};

   var InitAttrib = function(name) {
      result[name] = {def: true, val: ""};
      }

   var InitAttribs = function(namelist) {
      for (var i=0; i<namelist.length; i++) {
         InitAttrib(namelist[i]);
         }
      }

   var SetAttrib = function(name, v) {
      result[name].def = false;
      result[name].val = v || "";
      }

   var SetAttribStar = function(name, v) {
      if (v=="*") return;
      result[name].def = false;
      result[name].val = v;
      }

   var cell = sheet.GetAssuredCell(coord);

   // cellformat: alignhoriz

   InitAttrib("alignhoriz");
   if (cell.cellformat) {
      SetAttrib("alignhoriz", sheet.cellformats[cell.cellformat]);
      }

   // layout: alignvert, padtop, padright, padbottom, padleft

   InitAttribs(["alignvert", "padtop", "padright", "padbottom", "padleft"]);
   if (cell.layout) {
      parts = sheet.layouts[cell.layout].match(/^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/);
      SetAttribStar("padtop", parts[1]);
      SetAttribStar("padright", parts[2]);
      SetAttribStar("padbottom", parts[3]);
      SetAttribStar("padleft", parts[4]);
      SetAttribStar("alignvert", parts[5]);
      }

   // font: fontfamily, fontlook, fontsize

   InitAttribs(["fontfamily", "fontlook", "fontsize"]);
   if (cell.font) {
      parts = sheet.fonts[cell.font].match(/^(\*|\S+? \S+?) (\S+?) (\S.*)$/);
      SetAttribStar("fontfamily", parts[3]);
      SetAttribStar("fontsize", parts[2]);
      SetAttribStar("fontlook", parts[1]);
      }

   // color: textcolor

   InitAttrib("textcolor");
   if (cell.color) {
      SetAttrib("textcolor", sheet.colors[cell.color]);
      }

   // bgcolor: bgcolor

   InitAttrib("bgcolor");
   if (cell.bgcolor) {
      SetAttrib("bgcolor", sheet.colors[cell.bgcolor]);
      }

   // formatting: numberformat, textformat

   InitAttribs(["numberformat", "textformat"]);
   if (cell.nontextvalueformat) {
      SetAttrib("numberformat", sheet.valueformats[cell.nontextvalueformat]);
      }
   if (cell.textvalueformat) {
      SetAttrib("textformat", sheet.valueformats[cell.textvalueformat]);
      }

   // merges: colspan, rowspan

   InitAttribs(["colspan", "rowspan"]);
   SetAttrib("colspan", cell.colspan || 1);
   SetAttrib("rowspan", cell.rowspan || 1);

   // borders: bXthickness, bXstyle, bXcolor for X = t, r, b, and l

   for (i=0; i<4; i++) {
      b = "trbl".charAt(i);
      bb = "b"+b;
      InitAttrib(bb);
      SetAttrib(bb, cell[bb] ? sheet.borderstyles[cell[bb]] : "");
      InitAttrib(bb+"thickness");
      InitAttrib(bb+"style");
      InitAttrib(bb+"color");
      if (cell[bb]) {
         parts = sheet.borderstyles[cell[bb]].match(/(\S+)\s+(\S+)\s+(\S.+)/);
         SetAttrib(bb+"thickness", parts[1]);
         SetAttrib(bb+"style", parts[2]);
         SetAttrib(bb+"color", parts[3]);
         }
      }
 
   // misc: cssc, csss, mod

   InitAttribs(["cssc", "csss", "mod"]);
   SetAttrib("cssc", cell.cssc || ""); 
   SetAttrib("csss", cell.csss || "");
   SetAttrib("mod", cell.mod || "n");

   return result;

   }

//
// result = SocialCalc.EncodeSheetAttributes(sheet)
//
// Returns the sheet's attributes in an object, each in the following form:
//
//    attribname: {def: true/false, val: full-value}
//

SocialCalc.EncodeSheetAttributes = function(sheet) {

   var value;
   var attribs = sheet.attribs;
   var result = {};

   var InitAttrib = function(name) {
      result[name] = {def: true, val: ""};
      }

   var InitAttribs = function(namelist) {
      for (var i=0; i<namelist.length; i++) {
         InitAttrib(namelist[i]);
         }
      }

   var SetAttrib = function(name, v) {
      result[name].def = false;
      result[name].val = v || value;
      }

   var SetAttribStar = function(name, v) {
      if (v=="*") return;
      result[name].def = false;
      result[name].val = v;
      }

   // sizes: colwidth, rowheight

   InitAttrib("colwidth");
   if (attribs.defaultcolwidth) {
      SetAttrib("colwidth", attribs.defaultcolwidth);
      }

   InitAttrib("rowheight");
   if (attribs.rowheight) {
      SetAttrib("rowheight", attribs.defaultrowheight);
      }

   // cellformat: textalignhoriz, numberalignhoriz

   InitAttrib("textalignhoriz");
   if (attribs.defaulttextformat) {
      SetAttrib("textalignhoriz", sheet.cellformats[attribs.defaulttextformat]);
      }

   InitAttrib("numberalignhoriz");
   if (attribs.defaultnontextformat) {
      SetAttrib("numberalignhoriz", sheet.cellformats[attribs.defaultnontextformat]);
      }

   // layout: alignvert, padtop, padright, padbottom, padleft

   InitAttribs(["alignvert", "padtop", "padright", "padbottom", "padleft"]);
   if (attribs.defaultlayout) {
      parts = sheet.layouts[attribs.defaultlayout].match(/^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/);
      SetAttribStar("padtop", parts[1]);
      SetAttribStar("padright", parts[2]);
      SetAttribStar("padbottom", parts[3]);
      SetAttribStar("padleft", parts[4]);
      SetAttribStar("alignvert", parts[5]);
      }

   // font: fontfamily, fontlook, fontsize

   InitAttribs(["fontfamily", "fontlook", "fontsize"]);
   if (attribs.defaultfont) {
      parts = sheet.fonts[attribs.defaultfont].match(/^(\*|\S+? \S+?) (\S+?) (\S.*)$/);
      SetAttribStar("fontfamily", parts[3]);
      SetAttribStar("fontsize", parts[2]);
      SetAttribStar("fontlook", parts[1]);
      }

   // color: textcolor

   InitAttrib("textcolor");
   if (attribs.defaultcolor) {
      SetAttrib("textcolor", sheet.colors[attribs.defaultcolor]);
      }

   // bgcolor: bgcolor

   InitAttrib("bgcolor");
   if (attribs.defaultbgcolor) {
      SetAttrib("bgcolor", sheet.colors[attribs.defaultbgcolor]);
      }

   // formatting: numberformat, textformat

   InitAttribs(["numberformat", "textformat"]);
   if (attribs.defaultnontextvalueformat) {
      SetAttrib("numberformat", sheet.valueformats[attribs.defaultnontextvalueformat]);
      }
   if (attribs.defaulttextvalueformat) {
      SetAttrib("textformat", sheet.valueformats[attribs.defaulttextvalueformat]);
      }

   // recalc: recalc

   InitAttrib("recalc");
   if (attribs.recalc) {
      SetAttrib("recalc", attribs.recalc);
      }

   // usermaxcol, usermaxrow
   InitAttrib("usermaxcol");
   if (attribs.usermaxcol) {
      SetAttrib("usermaxcol", attribs.usermaxcol);
      }
   InitAttrib("usermaxrow");
   if (attribs.usermaxrow) {
      SetAttrib("usermaxrow", attribs.usermaxrow);
      }

   return result;

   }

//
// cmdstr = SocialCalc.DecodeCellAttributes(sheet, coord, attribs, range)
//
// Takes cell attributes in an object, each in the following form:
//
//    attribname: {def: true/false, val: full-value}
//
// and returns the sheet commands to make the actual attributes correspond.
// Returns a non-null string if any commands are to be executed, null otherwise.
//
// If range is provided, the commands are executed on the whole range.
//

SocialCalc.DecodeCellAttributes = function(sheet, coord, newattribs, range) {

   var value, b, bb;

   var cell = sheet.GetAssuredCell(coord);

   var changed = false;

   var CheckChanges = function(attribname, oldval, cmdname) {
      var val;
      if (newattribs[attribname]) {
         if (newattribs[attribname].def) {
            val = "";
            }
         else {
            val = newattribs[attribname].val;
            }
         if (val != (oldval || "")) {
            DoCmd(cmdname+" "+val);
            }
         }
      }

   var cmdstr = "";

   var DoCmd = function(str) {
      if (cmdstr) cmdstr += "\n";
      cmdstr += "set "+(range || coord)+" "+str;
      changed = true;
      }

   // cellformat: alignhoriz

   CheckChanges("alignhoriz", sheet.cellformats[cell.cellformat], "cellformat");

   // layout: alignvert, padtop, padright, padbottom, padleft

   if (!newattribs.alignvert.def || !newattribs.padtop.def || !newattribs.padright.def ||
       !newattribs.padbottom.def || !newattribs.padleft.def) {
      value = "padding:" +
         (newattribs.padtop.def ? "* " : newattribs.padtop.val + " ") +
         (newattribs.padright.def ? "* " : newattribs.padright.val + " ") +
         (newattribs.padbottom.def ? "* " : newattribs.padbottom.val + " ") +
         (newattribs.padleft.def ? "*" : newattribs.padleft.val) +
         ";vertical-align:" +
         (newattribs.alignvert.def ? "*;" : newattribs.alignvert.val+";");
      }
   else {
      value = "";
      }

   if (value != (sheet.layouts[cell.layout] || "")) {
      DoCmd("layout "+value);
      }

   // font: fontfamily, fontlook, fontsize

   if (!newattribs.fontlook.def || !newattribs.fontsize.def || !newattribs.fontfamily.def) {
      value =
         (newattribs.fontlook.def ? "* " : newattribs.fontlook.val + " ") +
         (newattribs.fontsize.def ? "* " : newattribs.fontsize.val + " ") +
         (newattribs.fontfamily.def ? "*" : newattribs.fontfamily.val);
      }
   else {
      value = "";
      }

   if (value != (sheet.fonts[cell.font] || "")) {
      DoCmd("font "+value);
      }

   // color: textcolor

   CheckChanges("textcolor", sheet.colors[cell.color], "color");

   // bgcolor: bgcolor

   CheckChanges("bgcolor", sheet.colors[cell.bgcolor], "bgcolor");

   // formatting: numberformat, textformat

   CheckChanges("numberformat", sheet.valueformats[cell.nontextvalueformat], "nontextvalueformat");

   CheckChanges("textformat", sheet.valueformats[cell.textvalueformat], "textvalueformat");

   // merges: colspan, rowspan - NOT HANDLED: IGNORED!

   // borders: bX for X = t, r, b, and l; bXthickness, bXstyle, bXcolor ignored

   for (i=0; i<4; i++) {
      b = "trbl".charAt(i);
      bb = "b"+b;
      CheckChanges(bb, sheet.borderstyles[cell[bb]], bb);
      }

   // misc: cssc, csss, mod

   CheckChanges("cssc", cell.cssc, "cssc");

   CheckChanges("csss", cell.csss, "csss");

   if (newattribs.mod) {
      if (newattribs.mod.def) {
         value = "n";
         }
      else {
         value = newattribs.mod.val;
         }
      if (value != (cell.mod || "n")) {
         if (value=="n") value = ""; // restrict to "y" and "" normally
         DoCmd("mod "+value);
         }
      }

   // if any changes return command(s)

   if (changed) {
       return cmdstr;
      }
   else {
      return null;
      }

   }


//
// changed = SocialCalc.DecodeSheetAttributes(sheet, newattribs)
//
// Takes sheet attributes in an object, each in the following form:
//
//    attribname: {def: true/false, val: full-value}
//
// and returns the sheet commands to make the actual attributes correspond.
// Returns a non-null string if any commands were executed, null otherwise.
//

SocialCalc.DecodeSheetAttributes = function(sheet, newattribs) {

   var value;
   var attribs = sheet.attribs;
   var changed = false;

   var CheckChanges = function(attribname, oldval, cmdname) {
      var val;
      if (newattribs[attribname]) {
         if (newattribs[attribname].def) {
            val = "";
            }
         else {
            val = newattribs[attribname].val;
            }
         if (val != (oldval || "")) {
            DoCmd(cmdname+" "+val);
            }
         }
      }

   var cmdstr = "";

   var DoCmd = function(str) {
      if (cmdstr) cmdstr += "\n";
      cmdstr += "set sheet "+str;
      changed = true;
      }

   // sizes: colwidth, rowheight

   CheckChanges("colwidth", attribs.defaultcolwidth, "defaultcolwidth");

   CheckChanges("rowheight", attribs.defaultrowheight, "defaultrowheight");

   // cellformat: textalignhoriz, numberalignhoriz

   CheckChanges("textalignhoriz", sheet.cellformats[attribs.defaulttextformat], "defaulttextformat");

   CheckChanges("numberalignhoriz", sheet.cellformats[attribs.defaultnontextformat], "defaultnontextformat");

   // layout: alignvert, padtop, padright, padbottom, padleft

   if (!newattribs.alignvert.def || !newattribs.padtop.def || !newattribs.padright.def ||
       !newattribs.padbottom.def || !newattribs.padleft.def) {
      value = "padding:" +
         (newattribs.padtop.def ? "* " : newattribs.padtop.val + " ") +
         (newattribs.padright.def ? "* " : newattribs.padright.val + " ") +
         (newattribs.padbottom.def ? "* " : newattribs.padbottom.val + " ") +
         (newattribs.padleft.def ? "*" : newattribs.padleft.val) +
         ";vertical-align:" +
         (newattribs.alignvert.def ? "*;" : newattribs.alignvert.val+";");
      }
   else {
      value = "";
      }

   if (value != (sheet.layouts[attribs.defaultlayout] || "")) {
      DoCmd("defaultlayout "+value);
      }

   // font: fontfamily, fontlook, fontsize

   if (!newattribs.fontlook.def || !newattribs.fontsize.def || !newattribs.fontfamily.def) {
      value =
         (newattribs.fontlook.def ? "* " : newattribs.fontlook.val + " ") +
         (newattribs.fontsize.def ? "* " : newattribs.fontsize.val + " ") +
         (newattribs.fontfamily.def ? "*" : newattribs.fontfamily.val);
      }
   else {
      value = "";
      }

   if (value != (sheet.fonts[attribs.defaultfont] || "")) {
      DoCmd("defaultfont "+value);
      }

   // color: textcolor

   CheckChanges("textcolor", sheet.colors[attribs.defaultcolor], "defaultcolor");

   // bgcolor: bgcolor

   CheckChanges("bgcolor", sheet.colors[attribs.defaultbgcolor], "defaultbgcolor");

   // formatting: numberformat, textformat

   CheckChanges("numberformat", sheet.valueformats[attribs.defaultnontextvalueformat], "defaultnontextvalueformat");

   CheckChanges("textformat", sheet.valueformats[attribs.defaulttextvalueformat], "defaulttextvalueformat");

   // recalc: recalc

   CheckChanges("recalc", sheet.attribs.recalc, "recalc");

   // usermaxcol, usermaxrow

   CheckChanges("usermaxcol", sheet.attribs.usermaxcol, "usermaxcol");
   CheckChanges("usermaxrow", sheet.attribs.usermaxrow, "usermaxrow");

   // if any changes return command(s)

   if (changed) {
       return cmdstr;
      }
   else {
      return null;
      }

   }

// *************************************
//
// Sheet command routines
//
// *************************************

//
// SocialCalc.SheetCommandInfo - object with information used during command execution
//

SocialCalc.SheetCommandInfo = function(sheetobj) {

   this.sheetobj = sheetobj; // sheet being operated on
   this.parseobj = null; // SocialCalc.Parse object with the command string, etc.
   this.timerobj = null; // used for timeslicing
   this.firsttimerdelay = 50; // wait before starting cmds (for Chrome - to give time to update)
   this.timerdelay = 1; // wait between slices
   this.maxtimeslice = 100; // do another slice after this many milliseconds
   this.saveundo = false; // arg for ExecuteSheetCommand

   this.CmdExtensionCallbacks = {}; // for startcmdextension, in form: cmdname, {func:function(cmdname, data, sheet, SocialCalc.Parse object, saveundo), data:whatever}
   this.cmdextensionbusy = ""; // if length>0, command loop waits for SocialCalc.ResumeFromCmdExtension()

//   statuscallback: null, // called during execution - obsolete: use sheet obj's
//   statuscallbackparams: null

   };

//
// SocialCalc.ScheduleSheetCommands
//
// statuscallback is called at the beginning (cmdstart) and end (cmdend).
//

SocialCalc.ScheduleSheetCommands = function(sheet, cmdstr, saveundo) {

   var sci = sheet.sci;

   sci.parseobj = new SocialCalc.Parse(cmdstr);
   sci.saveundo = saveundo;

   if (sci.sheetobj.statuscallback) { // notify others if requested
      sheet.statuscallback(sci, "cmdstart", "", sci.sheetobj.statuscallbackparams);
      }

   if (sci.saveundo) {
      sci.sheetobj.changes.PushChange(""); // add a step to undo stack
      }

   sci.timerobj = window.setTimeout(function() { SocialCalc.SheetCommandsTimerRoutine(sci); }, sci.firsttimerdelay);

   }

SocialCalc.SheetCommandsTimerRoutine = function(sci) {

   var errortext;
   var starttime = new Date();

   sci.timerobj = null;

   while (!sci.parseobj.EOF()) { // go through all commands (separated by newlines)

      errortext = SocialCalc.ExecuteSheetCommand(sci.sheetobj, sci.parseobj, sci.saveundo);
      if (errortext) alert(errortext);

      sci.parseobj.NextLine();

      if (sci.cmdextensionbusy.length > 0) { // forced wait
         if (sci.sheetobj.statuscallback) { // notify others if requested
            sci.sheetobj.statuscallback(sci, "cmdextension", sci.cmdextensionbusy, sci.sheetobj.statuscallbackparams);
            }
         return;
         }

      if (((new Date()) - starttime) >= sci.maxtimeslice) { // if taking too long, give up CPU for a while
         sci.timerobj = window.setTimeout(function() { SocialCalc.SheetCommandsTimerRoutine(sci); }, sci.timerdelay);
         return;
         }
      }

   if (sci.sheetobj.statuscallback) { // notify others if requested
      sci.sheetobj.statuscallback(sci, "cmdend", "", sci.sheetobj.statuscallbackparams);
      }

   }

SocialCalc.ResumeFromCmdExtension = function(sci) {

   sci.cmdextensionbusy = "";

   SocialCalc.SheetCommandsTimerRoutine(sci);

}

//
// errortext = SocialCalc.ExecuteSheetCommand(sheet, cmd, saveundo)
//
// cmd is a SocialCalc.Parse object.
//
// Executes commands that modify the sheet data.
// Sets sheet "needsrecalc" as needed.
// Sets sheet "changedrendervalues" as needed.
//
// The cmd string may be multiple commands, separated by newlines. In that case
// only one "step" is put on the undo stack representing all the commands.
// Note that because of this, in "set A1 text ..." and "set A1 comment ..." text is
// treated as encoded (newline => \n, \ => \b, : => \c).
//
// The commands are in the forms:
//
//    set sheet attributename value (plus lastcol and lastrow)
//    set 22 attributename value
//    set B attributename value
//    set A1 attributename value1 value2... (see each attribute in code for details)
//    set A1:B5 attributename value1 value2...
//    erase/copy/cut/paste/fillright/filldown A1:B5 all/formulas/format
//    loadclipboard save-encoded-clipboard-data
//    clearclipboard
//    merge C3:F3
//    unmerge C3
//    insertcol/insertrow C5
//    deletecol/deleterow C5:E7
//    movepaste/moveinsert A1:B5 A8 all/formulas/format (if insert, destination must be in same rows or columns or else paste done)
//    sort cr1:cr2 col1 up/down col2 up/down col3 up/down
//    name define NAME definition
//    name desc NAME description
//    name delete NAME
//    recalc
//    redisplay
//    changedrendervalues
//    startcmdextension extension rest-of-command
//
// If saveundo is true, then undo information is saved in sheet.changes.
//

SocialCalc.ExecuteSheetCommand = function(sheet, cmd, saveundo) {

   var cmdstr, cmd1, rest, what, attrib, num, pos, pos2, errortext, undostart, val;
   var cr1, cr2, col, row, cr, cell, newcell;
   var fillright, rowstart, colstart, crbase, rowoffset, coloffset, basecell;
   var clipsheet, cliprange, numcols, numrows, attribtable;
   var colend, rowend, newcolstart, newrowstart, newcolend, newrowend, rownext, colnext, colthis, cellnext;
   var lastrow, lastcol, rowbefore, colbefore, oldformula, oldcr;
   var cols, dirs, lastsortcol, i, sortlist, sortcells, sortvalues, sorttypes;
   var sortfunction, slen, valtype, originalrow, sortedcr;
   var name, v1, v2;
   var cmdextension;

   var attribs = sheet.attribs;
   var changes = sheet.changes;
   var cellProperties = SocialCalc.CellProperties;
   var scc = SocialCalc.Constants;

   var ParseRange =
      function() {
         var prange = SocialCalc.ParseRange(what);
         cr1 = prange.cr1;
         cr2 = prange.cr2;
         if (cr2.col > attribs.lastcol) attribs.lastcol = cr2.col;
         if (cr2.row > attribs.lastrow) attribs.lastrow = cr2.row;
         };

   errortext = "";

   cmdstr = cmd.RestOfStringNoMove();
   if (saveundo) {
      sheet.changes.AddDo(cmdstr);
      }

   cmd1 = cmd.NextToken();

   switch (cmd1) {

      case "set":
         what = cmd.NextToken();
         attrib = cmd.NextToken();
         rest = cmd.RestOfString();
         undostart = "set "+what+" "+attrib;

         if (what=="sheet") {
            sheet.renderneeded = true;
            switch (attrib) {
               case "defaultcolwidth":
                  if (saveundo) changes.AddUndo(undostart, attribs[attrib]);
                  attribs[attrib] = rest;
                  break;
               case "defaultcolor":
               case "defaultbgcolor":
                  if (saveundo) changes.AddUndo(undostart, sheet.GetStyleString("color", attribs[attrib]));
                  attribs[attrib] = sheet.GetStyleNum("color", rest);
                  break;
               case "defaultlayout":
                  if (saveundo) changes.AddUndo(undostart, sheet.GetStyleString("layout", attribs[attrib]));
                  attribs[attrib] = sheet.GetStyleNum("layout", rest);
                  break;
               case "defaultfont":
                  if (saveundo) changes.AddUndo(undostart, sheet.GetStyleString("font", attribs[attrib]));
                  if (rest=="* * *") rest = ""; // all default
                  attribs[attrib] = sheet.GetStyleNum("font", rest);
                  break;
               case "defaulttextformat":
               case "defaultnontextformat":
                  if (saveundo) changes.AddUndo(undostart, sheet.GetStyleString("cellformat", attribs[attrib]));
                  attribs[attrib] = sheet.GetStyleNum("cellformat", rest);
                  break;
               case "defaulttextvalueformat":
               case "defaultnontextvalueformat":
                  if (saveundo) changes.AddUndo(undostart, sheet.GetStyleString("valueformat", attribs[attrib]));
                  attribs[attrib] = sheet.GetStyleNum("valueformat", rest);
                  for (cr in sheet.cells) { // forget all cached display strings
                     delete sheet.cells[cr].displaystring;
                     }
                  break;
               case "lastcol":
               case "lastrow":
                  if (saveundo) changes.AddUndo(undostart, attribs[attrib]-0);
                  num = rest-0;
                  if (typeof num == "number") attribs[attrib] = num > 0 ? num : 1;
                  break;
               case "recalc":
                  if (saveundo) changes.AddUndo(undostart, attribs[attrib]);
                  if (rest == "off") {
                     attribs.recalc = rest; // manual recalc, not auto
                     }
                  else { // all values other than "off" mean "on"
                     delete attribs.recalc;
                     }
                  break;
               case "usermaxcol":
               case "usermaxrow":
                  if (saveundo) changes.AddUndo(undostart, attribs[attrib]-0);
                  num = rest-0;
                  if (typeof num == "number") attribs[attrib] = num > 0 ? num : 0;
                  break;
               default:
                  errortext = scc.s_escUnknownSheetCmd+cmdstr;
                  break;
               }
            }

         else if (/^[a-z]{1,2}(:[a-z]{1,2})?$/i.test(what)) { // col attributes
            sheet.renderneeded = true;
            what = what.toUpperCase();
            pos = what.indexOf(":");
            if (pos>=0) {
               cr1 = SocialCalc.coordToCr(what.substring(0,pos)+"1");
               cr2 = SocialCalc.coordToCr(what.substring(pos+1)+"1");
               }
            else {
               cr1 = SocialCalc.coordToCr(what+"1");
               cr2 = cr1;
               }
            for (col=cr1.col; col <= cr2.col; col++) {
               if (attrib=="width") {
                  cr = SocialCalc.rcColname(col);
                  if (saveundo) changes.AddUndo("set "+cr+" width", sheet.colattribs.width[cr]);
                  if (rest.length > 0 ) {
                     sheet.colattribs.width[cr] = rest;
                     }
                  else {
                     delete sheet.colattribs.width[cr];
                     }
                  }
               else if (attrib=="hide") {
                  sheet.hiddencolrow = "col";
                  cr = SocialCalc.rcColname(col);
                  if (saveundo) changes.AddUndo("set "+cr+" hide", sheet.colattribs.hide[cr]);
                  if (rest.length > 0) {
                     sheet.colattribs.hide[cr] = rest; 
                     }
                  else {
                     delete sheet.colattribs.hide[cr];
                     }
                  }
               }
            }

         else if (/^\d+(:\d+)?$/i.test(what)) { // row attributes
            sheet.renderneeded = true;
            what = what.toUpperCase();
            pos = what.indexOf(":");
            if (pos>=0) {
               cr1 = SocialCalc.coordToCr("A"+what.substring(0,pos));
               cr2 = SocialCalc.coordToCr("A"+what.substring(pos+1));
               }
            else {
               cr1 = SocialCalc.coordToCr("A"+what);
               cr2 = cr1;
               }
            for (row=cr1.row; row <= cr2.row; row++) {
               if (attrib=="height") {
                  if (saveundo) changes.AddUndo("set "+row+" height", sheet.rowattribs.height[row]);
                  if (rest.length > 0 ) {
                     sheet.rowattribs.height[row] = rest;
                     }
                  else {
                     delete sheet.rowattribs.height[row];
                     }
                  }
               else if (attrib=="hide") {
                  sheet.hiddencolrow = "row";
                  if (saveundo) changes.AddUndo("set "+row+" hide", sheet.rowattribs.hide[row]);
                  if (rest.length > 0) {
                     sheet.rowattribs.hide[row] = rest; 
                     }
                  else {
                     delete sheet.rowattribs.hide[row];
                     }
                  }
               }
            }

         else if (/^[a-z]{1,2}\d+(:[a-z]{1,2}\d+)?$/i.test(what)) { // cell attributes
            ParseRange();
            if (cr1.row!=cr2.row || cr1.col!=cr2.col || sheet.celldisplayneeded || sheet.renderneeded) { // not one cell
               sheet.renderneeded = true;
               sheet.celldisplayneeded = "";
               }
            else {
               sheet.celldisplayneeded = SocialCalc.crToCoord(cr1.col, cr1.row);
               }
            for (row=cr1.row; row <= cr2.row; row++) {
               for (col=cr1.col; col <= cr2.col; col++) {
                  cr = SocialCalc.crToCoord(col, row);
                  cell=sheet.GetAssuredCell(cr);
                  if (cell.readonly && attrib!="readonly") continue;
                  if (saveundo) changes.AddUndo("set "+cr+" all", sheet.CellToString(cell));
                  if (attrib=="value") { // set coord value type numeric-value
                     pos = rest.indexOf(" ");
                     cell.datavalue = rest.substring(pos+1)-0;
                     delete cell.errors;
                     cell.datatype = "v";
                     cell.valuetype = rest.substring(0,pos);
                     delete cell.displaystring;
                     delete cell.parseinfo;
                     attribs.needsrecalc = "yes";
                     }
                  else if (attrib=="text") { // set coord text type text-value
                     pos = rest.indexOf(" ");
                     cell.datavalue = SocialCalc.decodeFromSave(rest.substring(pos+1));
                     delete cell.errors;
                     cell.datatype = "t";
                     cell.valuetype = rest.substring(0,pos);
                     delete cell.displaystring;
                     delete cell.parseinfo;
                     attribs.needsrecalc = "yes";
                     }
                  else if (attrib=="formula") { // set coord formula formula-body-less-initial-=
                     cell.datavalue = 0; // until recalc
                     delete cell.errors;
                     cell.datatype = "f";
                     cell.valuetype = "e#N/A"; // until recalc
                     cell.formula = rest;
                     delete cell.displaystring;
                     delete cell.parseinfo;
                     attribs.needsrecalc = "yes";
                     }
                  else if (attrib=="constant") { // set coord constant type numeric-value source-text
                     pos = rest.indexOf(" ");
                     pos2 = rest.substring(pos+1).indexOf(" ");
                     cell.datavalue = rest.substring(pos+1,pos+1+pos2)-0;
                     cell.valuetype = rest.substring(0,pos);
                     if (cell.valuetype.charAt(0)=="e") { // error
                        cell.errors = cell.valuetype.substring(1);
                        }
                     else {
                        delete cell.errors;
                        }
                     cell.datatype = "c";
                     cell.formula = rest.substring(pos+pos2+2);
                     delete cell.displaystring;
                     delete cell.parseinfo;
                     attribs.needsrecalc = "yes";
                     }
                  else if (attrib=="empty") { // erase value
                     cell.datavalue = "";
                     delete cell.errors;
                     cell.datatype = null;
                     cell.formula = "";
                     cell.valuetype = "b";
                     delete cell.displaystring;
                     delete cell.parseinfo;
                     attribs.needsrecalc = "yes";
                     }
                  else if (attrib=="all") { // set coord all :this:val1:that:val2...
                     if (rest.length>0) {
                        cell = new SocialCalc.Cell(cr);
                        sheet.CellFromStringParts(cell, rest.split(":"), 1);
                        sheet.cells[cr] = cell;
                        }
                     else {
                        delete sheet.cells[cr];
                        }
                     attribs.needsrecalc = "yes";
                     }
                  else if (/^b[trbl]$/.test(attrib)) { // set coord bt 1px solid black
                     cell[attrib] = sheet.GetStyleNum("borderstyle", rest);
                     sheet.renderneeded = true; // affects more than just one cell
                     }
                  else if (attrib=="color" || attrib=="bgcolor") {
                     cell[attrib] = sheet.GetStyleNum("color", rest);
                     }
                  else if (attrib=="layout" || attrib=="cellformat") {
                     cell[attrib] = sheet.GetStyleNum(attrib, rest);
                     }
                  else if (attrib=="font") { // set coord font style weight size family
                     if (rest=="* * *") rest = "";
                     cell[attrib] = sheet.GetStyleNum("font", rest);
                     }
                  else if (attrib=="textvalueformat" || attrib=="nontextvalueformat") {
                     cell[attrib] = sheet.GetStyleNum("valueformat", rest);
                     delete cell.displaystring;
                     }
                  else if (attrib=="cssc") {
                     rest = rest.replace(/[^a-zA-Z0-9\-]/g, "");
                     cell.cssc = rest;
                     }
                  else if (attrib=="csss") {
                     rest = rest.replace(/\n/g, "");
                     cell.csss = rest;
                     }
                  else if (attrib=="mod") {
                     rest = rest.replace(/[^yY]/g, "").toLowerCase();
                     cell.mod = rest;
                     }
                  else if (attrib=="comment") {
                     cell.comment = SocialCalc.decodeFromSave(rest);
                     }
                  else if (attrib=="readonly") {
                     cell.readonly = rest.toLowerCase()=="yes";
                     }
                  else {
                     errortext = scc.s_escUnknownSetCoordCmd+cmdstr;
                     }
                  }
               }

            }
         break;

      case "merge":
         sheet.renderneeded = true;
         what = cmd.NextToken();
         rest = cmd.RestOfString();
         ParseRange();
         cell=sheet.GetAssuredCell(cr1.coord);
         if (cell.readonly) break;
         if (saveundo) changes.AddUndo("unmerge "+cr1.coord);

         if (cr2.col > cr1.col) cell.colspan = cr2.col - cr1.col + 1;
         else delete cell.colspan;
         if (cr2.row > cr1.row) cell.rowspan = cr2.row - cr1.row + 1;
         else delete cell.rowspan;

         sheet.changedrendervalues = true;

         break;

      case "unmerge":
         sheet.renderneeded = true;
         what = cmd.NextToken();
         rest = cmd.RestOfString();
         ParseRange();
         cell=sheet.GetAssuredCell(cr1.coord);
         if (cell.readonly) break;
         if (saveundo) changes.AddUndo("merge "+cr1.coord+":"+SocialCalc.crToCoord(cr1.col+(cell.colspan||1)-1, cr1.row+(cell.rowspan||1)-1));

         delete cell.colspan;
         delete cell.rowspan;

         sheet.changedrendervalues = true;

         break;

      case "erase":
      case "cut":
         sheet.renderneeded = true;
         sheet.changedrendervalues = true;
         what = cmd.NextToken();
         rest = cmd.RestOfString();
         ParseRange();

         if (saveundo) changes.AddUndo("changedrendervalues"); // to take care of undone pasted spans
         if (cmd1=="cut") { // save copy of whole thing before erasing
            if (saveundo) changes.AddUndo("loadclipboard", SocialCalc.encodeForSave(SocialCalc.Clipboard.clipboard));
            SocialCalc.Clipboard.clipboard = SocialCalc.CreateSheetSave(sheet, what);
            }

         for (row = cr1.row; row <= cr2.row; row++) {
            for (col = cr1.col; col <= cr2.col; col++) {
               cr = SocialCalc.crToCoord(col, row);
               cell=sheet.GetAssuredCell(cr);
               if (cell.readonly) continue;
               if (saveundo) changes.AddUndo("set "+cr+" all", sheet.CellToString(cell));
               if (rest=="all") {
                  delete sheet.cells[cr];
                  }
               else if (rest == "formulas") {
                  cell.datavalue = "";
                  cell.datatype = null;
                  cell.formula = "";
                  cell.valuetype = "b";
                  delete cell.errors;
                  delete cell.displaystring;
                  delete cell.parseinfo;
                  if (cell.comment) { // comments are considered content for erasing
                     delete cell.comment;
                     }
                  }
               else if (rest == "formats") {
                  newcell = new SocialCalc.Cell(cr); // create a new cell without attributes
                  newcell.datavalue = cell.datavalue; // copy existing values
                  newcell.datatype = cell.datatype;
                  newcell.formula = cell.formula;
                  newcell.valuetype = cell.valuetype;
                  if (cell.comment) {
                     newcell.comment = cell.comment;
                     }
                  sheet.cells[cr] = newcell; // replace
                  }
               }
            }
         attribs.needsrecalc = "yes";
         break;

      case "fillright":
      case "filldown":
         sheet.renderneeded = true;
         sheet.changedrendervalues = true;
         if (saveundo) changes.AddUndo("changedrendervalues"); // to take care of undone pasted spans
         what = cmd.NextToken();
         rest = cmd.RestOfString();
         ParseRange();
         if (cmd1 == "fillright") {
            fillright = true;
            rowstart = cr1.row;
            colstart = cr1.col + 1;
            }
         else {
            fillright = false;
            rowstart = cr1.row + 1;
            colstart = cr1.col;
            }
         for (row = rowstart; row <= cr2.row; row++) {
            for (col = colstart; col <= cr2.col; col++) {
               cr = SocialCalc.crToCoord(col, row);
               cell=sheet.GetAssuredCell(cr);
               if (cell.readonly) continue;
               if (saveundo) changes.AddUndo("set "+cr+" all", sheet.CellToString(cell));
               if (fillright) {
                  crbase = SocialCalc.crToCoord(cr1.col, row);
                  coloffset = col - colstart + 1;
                  rowoffset = 0;
                  }
               else {
                  crbase = SocialCalc.crToCoord(col, cr1.row);
                  coloffset = 0;
                  rowoffset = row - rowstart + 1;
                  }
               basecell = sheet.GetAssuredCell(crbase);
               if (rest == "all" || rest == "formats") {
                  for (attrib in cellProperties) {
                     if (cellProperties[attrib] == 1) continue; // copy only format attributes
                     if (typeof basecell[attrib] === undefined || cellProperties[attrib] == 3) {
                        delete cell[attrib];
                        }
                     else {
                        cell[attrib] = basecell[attrib];
                        }
                     }
                  }
               if (rest == "all" || rest == "formulas") {
                  cell.datavalue = basecell.datavalue;
                  cell.datatype = basecell.datatype;            
                  cell.valuetype = basecell.valuetype;
                  if (cell.datatype == "f") { // offset relative coords, even in sheet references
                     cell.formula = SocialCalc.OffsetFormulaCoords(basecell.formula, coloffset, rowoffset);
                     }
                  else {
                     cell.formula = basecell.formula;
                     }
                  delete cell.parseinfo;
                  cell.errors = basecell.errors;
                  }
               delete cell.displaystring;
               }
            }

         attribs.needsrecalc = "yes";
         break;

      case "copy":
         what = cmd.NextToken();
         rest = cmd.RestOfString();
         if (saveundo) changes.AddUndo("loadclipboard", SocialCalc.encodeForSave(SocialCalc.Clipboard.clipboard));
         SocialCalc.Clipboard.clipboard = SocialCalc.CreateSheetSave(sheet, what);
         break;

      case "loadclipboard":
         rest = cmd.RestOfString();
         if (saveundo) changes.AddUndo("loadclipboard", SocialCalc.encodeForSave(SocialCalc.Clipboard.clipboard));
         SocialCalc.Clipboard.clipboard = SocialCalc.decodeFromSave(rest);
         break;

      case "clearclipboard":
         if (saveundo) changes.AddUndo("loadclipboard", SocialCalc.encodeForSave(SocialCalc.Clipboard.clipboard));
         SocialCalc.Clipboard.clipboard = "";
         break;

      case "paste":
         sheet.renderneeded = true;
         sheet.changedrendervalues = true;
         if (saveundo) changes.AddUndo("changedrendervalues"); // to take care of undone pasted spans
         what = cmd.NextToken();
         rest = cmd.RestOfString();
         ParseRange();
         if (!SocialCalc.Clipboard.clipboard) {
            break;
            }
         clipsheet = new SocialCalc.Sheet(); // load clipboard contents as another sheet
         clipsheet.ParseSheetSave(SocialCalc.Clipboard.clipboard);
         cliprange = SocialCalc.ParseRange(clipsheet.copiedfrom);
         coloffset = cr1.col - cliprange.cr1.col; // get sizes, etc.
         rowoffset = cr1.row - cliprange.cr1.row;
         numcols = Math.max(cr2.col - cr1.col + 1, cliprange.cr2.col - cliprange.cr1.col + 1);
         numrows = Math.max(cr2.row - cr1.row + 1, cliprange.cr2.row - cliprange.cr1.row + 1);
         if (cr1.col+numcols-1 > attribs.lastcol) attribs.lastcol = cr1.col+numcols-1;
         if (cr1.row+numrows-1 > attribs.lastrow) attribs.lastrow = cr1.row+numrows-1;

         for (row = cr1.row; row < cr1.row+numrows; row++) {
            for (col = cr1.col; col < cr1.col+numcols; col++) {
               cr = SocialCalc.crToCoord(col, row);
               cell=sheet.GetAssuredCell(cr);
               if (cell.readonly) continue;
               if (saveundo) changes.AddUndo("set "+cr+" all", sheet.CellToString(cell));
               crbase = SocialCalc.crToCoord(
                  cliprange.cr1.col + ((col-cr1.col) % (cliprange.cr2.col - cliprange.cr1.col + 1)), 
                  cliprange.cr1.row + ((row-cr1.row) % (cliprange.cr2.row - cliprange.cr1.row + 1)));
               basecell = clipsheet.GetAssuredCell(crbase);
               if (rest == "all" || rest == "formats") {
                  for (attrib in cellProperties) {
                     if (cellProperties[attrib] == 1) continue; // copy only format attributes
                     if (typeof basecell[attrib] === undefined || cellProperties[attrib] == 3) {
                        delete cell[attrib];
                        }
                     else {
                        attribtable = SocialCalc.CellPropertiesTable[attrib];
                        if (attribtable && basecell[attrib]) { // table indexes to expand to strings since other sheet may have diff indexes
                           cell[attrib] = sheet.GetStyleNum(attribtable, clipsheet.GetStyleString(attribtable, basecell[attrib]));
                           }
                        else { // these are not table indexes
                           cell[attrib] = basecell[attrib];
                           }
                        }
                     }
                  }
               if (rest == "all" || rest == "formulas") {
                  cell.datavalue = basecell.datavalue;
                  cell.datatype = basecell.datatype;            
                  cell.valuetype = basecell.valuetype;
                  if (cell.datatype == "f") { // offset relative coords, even in sheet references
                     cell.formula = SocialCalc.OffsetFormulaCoords(basecell.formula, coloffset, rowoffset);
                     }
                  else {
                     cell.formula = basecell.formula;
                     }
                  delete cell.parseinfo;
                  cell.errors = basecell.errors;
                  if (basecell.comment) { // comments are pasted as part of content, though not filled, etc.
                     cell.comment = basecell.comment;
                     }
                  else if (cell.comment) {
                     delete cell.comment;
                     }
                  }
               delete cell.displaystring;
               }
            }

         attribs.needsrecalc = "yes";
         break;

      case "sort": // sort cr1:cr2 col1 up/down col2 up/down col3 up/down
         sheet.renderneeded = true;
         sheet.changedrendervalues = true;
         if (saveundo) changes.AddUndo("changedrendervalues"); // to take care of undone pasted spans
         what = cmd.NextToken();
         ParseRange();
         cols = []; // get columns and sort directions (or "")
         dirs = [];
         lastsortcol = 0;
         for (i=0; i<=3; i++) {
            cols[i] = cmd.NextToken();
            dirs[i] = cmd.NextToken();
            if (cols[i]) lastsortcol = i;
            }

         sortcells = {}; // a copy of the data which will replace the original, but in the new order
         sortlist = []; // an array of 0, 1, ..., nrows-1 needed for sorting
         sortvalues = []; // values to be sorted corresponding to sortlist
         sorttypes = []; // basic types of the values

         for (row = cr1.row; row <= cr2.row; row++) { // fill in the sort info
            for (col = cr1.col; col <= cr2.col; col++) {
               cr = SocialCalc.crToCoord(col, row);
               cell=sheet.cells[cr];
               if (cell) { // only copy non-empty cells
                  sortcells[cr] = sheet.CellToString(cell);
                  if (saveundo) changes.AddUndo("set "+cr+" all", sortcells[cr]);
                  }
               else {
                  if (saveundo) changes.AddUndo("set "+cr+" all");
                  }
               }
            sortlist.push(sortlist.length);
            sortvalues.push([]);
            sorttypes.push([]);
            slast = sorttypes.length-1;
            for (i = 0; i <= lastsortcol; i++) {
               cr = cols[i] + row; // get cr on this row in sort col
               cell = sheet.GetAssuredCell(cr);
               val = cell.datavalue;
               valtype = cell.valuetype.charAt(0) || "b";
               if (valtype == "t") val = val.toLowerCase();
               sortvalues[slast].push(val);
               sorttypes[slast].push(valtype);
               }
            }

         sortfunction = function(a, b) { // a comparison function that can handle all the type variations
            var i, a1, b1, ta, cresult;
            for (i=0; i<=lastsortcol; i++) {
               if (dirs[i] == "up") { // handle sort direction
                  a1 = a; b1 = b;
                  }
               else {
                  a1 = b; b1 = a;
                  }
               ta = sorttypes[a1][i];
               tb = sorttypes[b1][i];
               if (ta == "t") { // numbers < text < errors, blank always last no matter what dir
                  if (tb == "t") {
                     a1 = sortvalues[a1][i];
                     b1 = sortvalues[b1][i];
                     cresult = a1 > b1 ? 1 : (a1 < b1 ? -1 : 0);
                     }
                  else if (tb == "n") {
                     cresult = 1;
                     }
                  else if (tb == "b") {
                     cresult = dirs[i] == "up" ? -1 : 1;
                     }
                  else if (tb == "e") {
                     cresult = -1;
                     }
                  }
               else if (ta == "n") {
                  if (tb == "t") {
                     cresult = -1;
                     }
                  else if (tb == "n") {
                     a1 = sortvalues[a1][i]-0; // force to numeric, just in case
                     b1 = sortvalues[b1][i]-0;
                     cresult = a1 > b1 ? 1 : (a1 < b1 ? -1 : 0);
                     }
                  else if (tb == "b") {
                     cresult = dirs[i] == "up" ? -1 : 1;
                     }
                  else if (tb == "e") {
                     cresult = -1;
                     }
                  }
               else if (ta == "e") {
                  if (tb == "e") {
                     a1 = sortvalues[a1][i];
                     b1 = sortvalues[b1][i];
                     cresult = a1 > b1 ? 1 : (a1 < b1 ? -1 : 0);
                     }
                  else if (tb == "b") {
                     cresult = dirs[i] == "up" ? -1 : 1;
                     }
                  else {
                     cresult = 1;
                     }
                  }
               else if (ta == "b") {
                  if (tb == "b") {
                     cresult = 0;
                     }
                  else {
                     cresult = dirs[i] == "up" ? 1 : -1;
                     }
                  }
               if (cresult) { // return if tested not equal, otherwise do next column
                  return cresult;
                  }
               }
            cresult = a > b ? 1 : (a < b ? -1 : 0); // equal - return position in original to maintain it
            return cresult;
            }

         sortlist.sort(sortfunction);

         for (row = cr1.row; row <= cr2.row; row++) { // copy original rows into sorted positions
            originalrow = sortlist[row-cr1.row]; // relative position where it was in original
            for (col = cr1.col; col <= cr2.col; col++) {
               cr = SocialCalc.crToCoord(col, row);
               sortedcr = SocialCalc.crToCoord(col, originalrow+cr1.row); // original cell to be put in new place
               if (sortcells[sortedcr]) {
                  cell = new SocialCalc.Cell(cr);
                  sheet.CellFromStringParts(cell, sortcells[sortedcr].split(":"), 1);
                  if (cell.datatype == "f") { // offset coord refs, even to ***relative*** coords in other sheets
                     cell.formula = SocialCalc.OffsetFormulaCoords(cell.formula, 0, (row-cr1.row)-originalrow);
                     }
                  sheet.cells[cr] = cell;
                  }
               else {
                  delete sheet.cells[cr];
                  }
               }
            }

         attribs.needsrecalc = "yes";
         break;

      case "insertcol":
      case "insertrow":
         sheet.renderneeded = true;
         sheet.changedrendervalues = true;
         what = cmd.NextToken();
         rest = cmd.RestOfString();
         ParseRange();

         if (cmd1 == "insertcol") {
            coloffset = 1;
            colend = cr1.col;
            rowoffset = 0;
            rowend = 1;
            newcolstart = cr1.col;
            newcolend = cr1.col;
            newrowstart = 1;
            newrowend = attribs.lastrow;
            if (saveundo) changes.AddUndo("deletecol "+cr1.coord);
            }
         else {
            coloffset = 0;
            colend = 1;
            rowoffset = 1;
            rowend = cr1.row;
            newcolstart = 1;
            newcolend = attribs.lastcol;
            newrowstart = cr1.row;
            newrowend = cr1.row;
            if (saveundo) changes.AddUndo("deleterow "+cr1.coord);
            }

         for (row=attribs.lastrow; row >= rowend; row--) { // copy the cells forward
            for (col=attribs.lastcol; col >= colend; col--) {
               crbase = SocialCalc.crToCoord(col, row);
               cr = SocialCalc.crToCoord(col+coloffset, row+rowoffset);
               if (!sheet.cells[crbase]) { // copying empty cell
                  delete sheet.cells[cr]; // delete anything that may have been there
                  }
               else { // overwrite existing cell with moved contents
                  sheet.cells[cr] = sheet.cells[crbase];
                  }
               }
            }

         for (row=newrowstart; row <= newrowend; row++) { // fill the "new" empty cells
            for (col=newcolstart; col <= newcolend; col++) {
               cr = SocialCalc.crToCoord(col, row);
               cell = new SocialCalc.Cell(cr);
               sheet.cells[cr] = cell;
               crbase = SocialCalc.crToCoord(col-coloffset, row-rowoffset); // copy attribs of the one before (0 gives you A or 1)
               basecell = sheet.GetAssuredCell(crbase);
               for (attrib in cellProperties) {
                  if (cellProperties[attrib] == 2) { // copy only format attributes
                     cell[attrib] = basecell[attrib];
                     }
                  }
               }
            }

         for (cr in sheet.cells) { // update cell references to moved cells in calculated formulas
             cell = sheet.cells[cr];
             if (cell && cell.datatype == "f") {
                cell.formula = SocialCalc.AdjustFormulaCoords(cell.formula, cr1.col, coloffset, cr1.row, rowoffset);
                }
             if (cell) {
                delete cell.parseinfo;
                }
             }

         for (name in sheet.names) { // update cell references to moved cells in names
            if (sheet.names[name]) { // works with "A1", "A1:A20", and "=formula" forms
               v1 = sheet.names[name].definition;
               v2 = "";
               if (v1.charAt(0) == "=") {
                  v2 = "=";
                  v1 = v1.substring(1);
                  }
               sheet.names[name].definition = v2 +
                  SocialCalc.AdjustFormulaCoords(v1, cr1.col, coloffset, cr1.row, rowoffset);
               }
            }

         for (row = attribs.lastrow; row >= rowend && cmd1 == "insertrow"; row--) { // copy the row attributes forward
            rownext = row + rowoffset;
            for (attrib in sheet.rowattribs) {
               val = sheet.rowattribs[attrib][row];
               if (sheet.rowattribs[attrib][rownext] != val) { // make assignment only if different
                  if (val) {
                     sheet.rowattribs[attrib][rownext] = val;
                     }
                  else {
                     delete sheet.rowattribs[attrib][rownext];
                     }
                  }
               }
            }

         for (col = attribs.lastcol; col >= colend && cmd1 == "insertcol"; col--) { // copy the column attributes forward
            colthis = SocialCalc.rcColname(col);
            colnext = SocialCalc.rcColname(col + coloffset);
            for (attrib in sheet.colattribs) {
               val = sheet.colattribs[attrib][colthis];
               if (sheet.colattribs[attrib][colnext] != val) { // make assignment only if different
                  if (val) {
                     sheet.colattribs[attrib][colnext] = val;
                     }
                  else {
                     delete sheet.colattribs[attrib][colnext];
                     }
                  }
               }
            }

         attribs.lastcol += coloffset;
         attribs.lastrow += rowoffset;
         attribs.needsrecalc = "yes";
         break;

      case "deletecol":
      case "deleterow":
         sheet.renderneeded = true;
         sheet.changedrendervalues = true;
         what = cmd.NextToken();
         rest = cmd.RestOfString();
         lastcol = attribs.lastcol; // save old values since ParseRange sets...
         lastrow = attribs.lastrow;
         ParseRange();

         if (cmd1 == "deletecol") {
            coloffset = cr1.col - cr2.col - 1;
            rowoffset = 0;
            colstart = cr2.col + 1;
            rowstart = 1;
            }
         else {
            coloffset = 0;
            rowoffset = cr1.row - cr2.row - 1;
            colstart = 1;
            rowstart = cr2.row + 1;
            }

         for (row=rowstart; row <= lastrow - rowoffset; row++) { // check for readonly cells
            for (col=colstart; col <= lastcol - coloffset; col++) {
               cr = SocialCalc.crToCoord(col+coloffset, row+rowoffset);
               cell = sheet.cells[cr];
               if (cell && cell.readonly) return errortext; 
               }
            }

         for (row=rowstart; row <= lastrow - rowoffset; row++) { // copy the cells backwards - extra so no dup of last set
            for (col=colstart; col <= lastcol - coloffset; col++) {
               cr = SocialCalc.crToCoord(col+coloffset, row+rowoffset);
               if (saveundo && (row<rowstart-rowoffset || col<colstart	-coloffset)) { // save cells that are overwritten as undo info
                  cell = sheet.cells[cr];
                  if (!cell) { // empty cell
                     changes.AddUndo("erase "+cr+" all");
                     }
                  else {
                     changes.AddUndo("set "+cr+" all", sheet.CellToString(cell));
                     }
                  }
               crbase = SocialCalc.crToCoord(col, row);
               cell = sheet.cells[crbase];
               if (!cell) { // copying empty cell
                  delete sheet.cells[cr]; // delete anything that may have been there
                  }
               else { // overwrite existing cell with moved contents
                  sheet.cells[cr] = cell;
                  }
               }
            }

//!!! multiple deletes isn't setting #REF!; need to fix up #REF!'s on undo but only those!

         for (cr in sheet.cells) { // update cell references to moved cells in calculated formulas
             cell = sheet.cells[cr];
             if (cell) {
                if (cell.datatype == "f") {
                   oldformula = cell.formula;
                   cell.formula = SocialCalc.AdjustFormulaCoords(oldformula, cr1.col, coloffset, cr1.row, rowoffset);
                   if (cell.formula != oldformula) {
                      delete cell.parseinfo;
                      if (saveundo && cell.formula.indexOf("#REF!")!=-1) { // save old version only if removed coord
                         oldcr = SocialCalc.coordToCr(cr);
                         changes.AddUndo("set "+SocialCalc.rcColname(oldcr.col-coloffset)+(oldcr.row-rowoffset)+
                                         " formula "+oldformula);
                         }
                      }
                   }
                else {
                   delete cell.parseinfo;
                   }
                }
             }

         for (name in sheet.names) { // update cell references to moved cells in names
            if (sheet.names[name]) { // works with "A1", "A1:A20", and "=formula" forms
               v1 = sheet.names[name].definition;
               v2 = "";
               if (v1.charAt(0) == "=") {
                  v2 = "=";
                  v1 = v1.substring(1);
                  }
               sheet.names[name].definition = v2 +
                  SocialCalc.AdjustFormulaCoords(v1, cr1.col, coloffset, cr1.row, rowoffset);
               }
            }

         for (row = rowstart; row <= lastrow - rowoffset && cmd1 == "deleterow"; row++) { // copy the row attributes backwards
            rowbefore = row + rowoffset;
            for (attrib in sheet.rowattribs) {
               val = sheet.rowattribs[attrib][row];
               if (sheet.rowattribs[attrib][rowbefore] != val) { // make assignment only if different
                  if (saveundo) changes.AddUndo("set "+rowbefore+" "+attrib, sheet.rowattribs[attrib][rowbefore]);
                  if (val) {
                     sheet.rowattribs[attrib][rowbefore] = val;
                     }
                  else {
                     delete sheet.rowattribs[attrib][rowbefore];
                     }
                  }
               }
            }

         for (col = colstart; col <= lastcol - coloffset && cmd1 == "deletecol"; col++) { // copy the column attributes backwards
            colthis = SocialCalc.rcColname(col);
            colbefore = SocialCalc.rcColname(col + coloffset);
            for (attrib in sheet.colattribs) {
               val = sheet.colattribs[attrib][colthis];
               if (sheet.colattribs[attrib][colbefore] != val) { // make assignment only if different
                  if (saveundo) changes.AddUndo("set "+colbefore+" "+attrib, sheet.colattribs[attrib][colbefore]);
                  if (val) {
                     sheet.colattribs[attrib][colbefore] = val;
                     }
                  else {
                     delete sheet.colattribs[attrib][colbefore];
                     }
                  }
               }
            }

         if (saveundo) {
            if (cmd1 == "deletecol") {
               for (col=cr1.col; col<=cr2.col; col++) {
                  changes.AddUndo("insertcol "+SocialCalc.rcColname(col));
                  }
               }
            else {
               for (row=cr1.row; row<=cr2.row; row++) {
                  changes.AddUndo("insertrow "+row);
                  }
               }
            }

         if (cmd1 == "deletecol") {
            if (cr1.col <= lastcol) { // shrink sheet unless deleted phantom cols off the end
               if (cr2.col <= lastcol) {
                  attribs.lastcol += coloffset;
                  }
               else {
                  attribs.lastcol = cr1.col - 1;
                  }
               }
            }
         else {
            if (cr1.row <= lastrow) { // shrink sheet unless deleted phantom rows off the end
               if (cr2.row <= lastrow) {
                  attribs.lastrow += rowoffset;
                  }
               else {
                  attribs.lastrow = cr1.row - 1;
                  }
               }
            }
         attribs.needsrecalc = "yes";
         break;


      case "movepaste":
      case "moveinsert":

         var movingcells, dest, destcr, inserthoriz, insertvert, pushamount, movedto;

         sheet.renderneeded = true;
         sheet.changedrendervalues = true;
         if (saveundo) changes.AddUndo("changedrendervalues"); // to take care of undone pasted spans
         what = cmd.NextToken();
         dest = cmd.NextToken();
         rest = cmd.RestOfString(); // rest is all/formulas/formats
         if (rest=="") rest = "all";

         ParseRange();

         destcr = SocialCalc.coordToCr(dest);

         coloffset = destcr.col - cr1.col;
         rowoffset = destcr.row - cr1.row;
         numcols = cr2.col - cr1.col + 1;
         numrows = cr2.row - cr1.row + 1;

         // get a copy of moving cells and erase from where they were

         movingcells = {};

         for (row = cr1.row; row <= cr2.row; row++) {
            for (col = cr1.col; col <= cr2.col; col++) {
               cr = SocialCalc.crToCoord(col, row);
               cell=sheet.GetAssuredCell(cr);
               if (cell.readonly) continue;
               if (saveundo) changes.AddUndo("set "+cr+" all", sheet.CellToString(cell));

               if (!sheet.cells[cr]) { // if had nothing
                  continue; // don't save anything
                  }
               movingcells[cr] = new SocialCalc.Cell(cr); // create new cell to copy

               for (attrib in cellProperties) { // go through each property
                  if (typeof cell[attrib] === undefined) { // don't copy undefined things and no need to delete
                     continue;
                     }
                  else {
                     movingcells[cr][attrib] = cell[attrib]; // copy for potential moving
                     }
                  if (rest == "all") {
                     delete cell[attrib];
                     }
                  if (rest == "formulas") {
                     if (cellProperties[attrib] == 1 || cellProperties[attrib] == 3) {
                        delete cell[attrib];
                        }
                     }
                  if (rest == "formats") {
                     if (cellProperties[attrib] == 2) {
                        delete cell[attrib];
                        }
                     }
                  }
               if (rest == "formulas") { // leave pristene deleted cell
                  cell.datavalue = "";
                  cell.datatype = null;
                  cell.formula = "";
                  cell.valuetype = "b";
                  }
               if (rest == "all") { // leave nothing for move all
                  delete sheet.cells[cr];
                  }
               }
            }

         // if moveinsert, check destination OK, and calculate pushing parameters

         if (cmd1 == "moveinsert") {
            inserthoriz = false;
            insertvert = false;
            if (rowoffset==0 && (destcr.col < cr1.col || destcr.col > cr2.col)) {
               if (destcr.col < cr1.col) { // moving left
                  pushamount = cr1.col - destcr.col;
                  inserthoriz = -1;
                  }
               else {
                  destcr.col -= 1;
                  coloffset = destcr.col - cr2.col;
                  pushamount = destcr.col - cr2.col;
                  inserthoriz = 1;
                  }
               }
            else if (coloffset==0 && (destcr.row < cr1.row || destcr.row > cr2.row)) {
               if (destcr.row < cr1.row) { // moving up
                  pushamount = cr1.row - destcr.row;
                  insertvert = -1;
                  }
               else {
                  destcr.row -= 1;
                  rowoffset = destcr.row - cr2.row;
                  pushamount = destcr.row - cr2.row;
                  insertvert = 1;
                  }
               }
            else {
               cmd1 = "movepaste"; // not allowed right now - ignore
               }                
            }

         // push any cells that need pushing

         movedto = {}; // remember what was moved where

         if (insertvert) {
            for (row = 0; row < pushamount; row++) {
               for (col = cr1.col; col <= cr2.col; col++) {
                  if (insertvert < 0) {
                     crbase = SocialCalc.crToCoord(col, destcr.row+pushamount-row-1); // from cell
                     cr = SocialCalc.crToCoord(col, cr2.row-row); // to cell
                     }
                  else {
                     crbase = SocialCalc.crToCoord(col, destcr.row-pushamount+row+1); // from cell
                     cr = SocialCalc.crToCoord(col, cr1.row+row); // to cell
                     }

                  basecell = sheet.GetAssuredCell(crbase);
                  if (saveundo) changes.AddUndo("set "+crbase+" all", sheet.CellToString(basecell));

                  cell = sheet.GetAssuredCell(cr);
                  if (rest == "all" || rest == "formats") {
                     for (attrib in cellProperties) {
                        if (cellProperties[attrib] == 1) continue; // copy only format attributes
                        if (typeof basecell[attrib] === undefined || cellProperties[attrib] == 3) {
                           delete cell[attrib];
                           }
                        else {
                           cell[attrib] = basecell[attrib];
                           }
                        }
                     }
                  if (rest == "all" || rest == "formulas") {
                     cell.datavalue = basecell.datavalue;
                     cell.datatype = basecell.datatype;            
                     cell.valuetype = basecell.valuetype;
                     cell.formula = basecell.formula;
                     delete cell.parseinfo;
                     cell.errors = basecell.errors;
                     }
                  delete cell.displaystring;

                  movedto[crbase] = cr; // old crbase is now at cr
                  }
               }
            }
         if (inserthoriz) {
            for (col = 0; col < pushamount; col++) {
               for (row = cr1.row; row <= cr2.row; row++) {
                  if (inserthoriz < 0) {
                     crbase = SocialCalc.crToCoord(destcr.col+pushamount-col-1, row);
                     cr = SocialCalc.crToCoord(cr2.col-col, row);
                     }
                  else {
                     crbase = SocialCalc.crToCoord(destcr.col-pushamount+col+1, row);
                     cr = SocialCalc.crToCoord(cr1.col+col, row);
                     }

                  basecell = sheet.GetAssuredCell(crbase);
                  if (saveundo) changes.AddUndo("set "+crbase+" all", sheet.CellToString(basecell));

                  cell = sheet.GetAssuredCell(cr);
                  if (rest == "all" || rest == "formats") {
                     for (attrib in cellProperties) {
                        if (cellProperties[attrib] == 1) continue; // copy only format attributes
                        if (typeof basecell[attrib] === undefined || cellProperties[attrib] == 3) {
                           delete cell[attrib];
                           }
                        else {
                           cell[attrib] = basecell[attrib];
                           }
                        }
                     }
                  if (rest == "all" || rest == "formulas") {
                     cell.datavalue = basecell.datavalue;
                     cell.datatype = basecell.datatype;            
                     cell.valuetype = basecell.valuetype;
                     cell.formula = basecell.formula;
                     delete cell.parseinfo;
                     cell.errors = basecell.errors;
                     }
                  delete cell.displaystring;

                  movedto[crbase] = cr; // old crbase is now at cr
                  }
               }
            }

         // paste moved cells into new place

         if (destcr.col+numcols-1 > attribs.lastcol) attribs.lastcol = destcr.col+numcols-1;
         if (destcr.row+numrows-1 > attribs.lastrow) attribs.lastrow = destcr.row+numrows-1;

         for (row = cr1.row; row < cr1.row+numrows; row++) {
            for (col = cr1.col; col < cr1.col+numcols; col++) {
               cr = SocialCalc.crToCoord(col+coloffset, row+rowoffset);
               cell=sheet.GetAssuredCell(cr);
               if (cell.readonly) continue;
               if (saveundo) changes.AddUndo("set "+cr+" all", sheet.CellToString(cell));

               crbase = SocialCalc.crToCoord(col, row); // get old cell to move

               movedto[crbase] = cr; // old crbase (moved cell) will now be at cr (destination)

               if (rest == "all" && !movingcells[crbase]) { // moving an empty cell
                  delete sheet.cells[cr]; // make the cell empty
                  continue;
                  }

               basecell = movingcells[crbase];
               if (!basecell) basecell = sheet.GetAssuredCell(crbase);

               if (rest == "all" || rest == "formats") {
                  for (attrib in cellProperties) {
                     if (cellProperties[attrib] == 1) continue; // copy only format attributes
                     if (typeof basecell[attrib] === undefined || cellProperties[attrib] == 3) {
                        delete cell[attrib];
                        }
                     else {
                        cell[attrib] = basecell[attrib];
                        }
                     }
                  }
               if (rest == "all" || rest == "formulas") {
                  cell.datavalue = basecell.datavalue;
                  cell.datatype = basecell.datatype;            
                  cell.valuetype = basecell.valuetype;
                  cell.formula = basecell.formula;
                  delete cell.parseinfo;
                  cell.errors = basecell.errors;
                  if (basecell.comment) { // comments are pasted as part of content, though not filled, etc.
                     cell.comment = basecell.comment;
                     }
                  else if (cell.comment) {
                     delete cell.comment;
                     }
                  }
               delete cell.displaystring;
               }
            }

         // do fixups

         for (cr in sheet.cells) { // update cell references to moved cells in calculated formulas
             cell = sheet.cells[cr];
             if (cell) {
                if (cell.datatype == "f") {
                   oldformula = cell.formula;
                   cell.formula = SocialCalc.ReplaceFormulaCoords(oldformula, movedto);
                   if (cell.formula != oldformula) {
                      delete cell.parseinfo;
                      if (saveundo && !movedto[cr]) { // moved cells are already saved for undo
                         changes.AddUndo("set "+cr+" formula "+oldformula);
                         }
                      }
                   }
                else {
                   delete cell.parseinfo;
                   }
                }
             }

         for (name in sheet.names) { // update cell references to moved cells in names
            if (sheet.names[name]) { // works with "A1", "A1:A20", and "=formula" forms
               v1 = sheet.names[name].definition;
               oldformula = v1;
               v2 = "";
               if (v1.charAt(0) == "=") {
                  v2 = "=";
                  v1 = v1.substring(1);
                  }
               sheet.names[name].definition = v2 +
                  SocialCalc.ReplaceFormulaCoords(v1, movedto);
               if (saveundo && sheet.names[name].definition != oldformula) { // save changes
                  changes.AddUndo("name define "+name+" "+oldformula);
                  }
               }
            }

         attribs.needsrecalc = "yes";
         break;

      case "name":
         what = cmd.NextToken();
         name = cmd.NextToken();
         rest = cmd.RestOfString();

         name = name.toUpperCase().replace(/[^A-Z0-9_\.]/g, "");
         if (name == "") break; // must have something

         if (what == "define") {
            if (rest == "") break; // must have something
            if (sheet.names[name]) { // already exists
               if (saveundo) changes.AddUndo("name define "+name+" "+sheet.names[name].definition);
               sheet.names[name].definition = rest;
               }
            else { // new
               if (saveundo) changes.AddUndo("name delete "+name);
               sheet.names[name] = {definition: rest, desc: ""};
               }
            }
         else if (what == "desc") {
            if (sheet.names[name]) { // must already exist
               if (saveundo) changes.AddUndo("name desc "+name+" "+sheet.names[name].desc);
               sheet.names[name].desc = rest;
               }
            }
         else if (what == "delete") {
            if (saveundo) {
               if (sheet.names[name].desc) changes.AddUndo("name desc "+name+" "+sheet.names[name].desc);
               changes.AddUndo("name define "+name+" "+sheet.names[name].definition);
               }
            delete sheet.names[name];
            }
         attribs.needsrecalc = "yes";

         break;

      case "recalc":
         attribs.needsrecalc = "yes"; // request recalc
         sheet.recalconce = true; // even if turned off
         break;

      case "redisplay":
         sheet.renderneeded = true;
         break;

      case "changedrendervalues": // needed for undo sometimes
         sheet.changedrendervalues = true;
         break;

      case "startcmdextension": // startcmdextension extension rest-of-command
         name = cmd.NextToken();
         cmdextension = sheet.sci.CmdExtensionCallbacks[name];
         if (cmdextension) {
            cmdextension.func(name, cmdextension.data, sheet, cmd, saveundo);
            }
         break;

      default:
         errortext = scc.s_escUnknownCmd+cmdstr;
         break;
      }

/* For Debugging:
var ustack="";
for (var i=0;i<sheet.changes.stack.length;i++) {
   ustack+=(i-0)+":"+sheet.changes.stack[i].command[0]+" of "+sheet.changes.stack[i].command.length+"/"+sheet.changes.stack[i].undo[0]+" of "+sheet.changes.stack[i].undo.length+",";
   }
alert(cmdstr+"|"+sheet.changes.stack.length+"--"+ustack);
*/

   return errortext;

   }

SocialCalc.SheetUndo = function(sheet) {

   var i;
   var tos = sheet.changes.TOS();
   var lastone = tos ? tos.undo.length-1 : -1;
   var cmdstr = "";

   for (i=lastone; i>=0; i--) { // do them backwards
      if (cmdstr) cmdstr += "\n"; // concatenate with separate lines
      cmdstr += tos.undo[i];
      }
   sheet.changes.Undo();
   sheet.ScheduleSheetCommands(cmdstr, false); // do undo operations

   }

SocialCalc.SheetRedo = function(sheet) {

   var tos, i;
   var didredo = sheet.changes.Redo();
   if (!didredo) {
      sheet.ScheduleSheetCommands("", false); // schedule doing nothing
      return;
      }
   tos = sheet.changes.TOS();
   var cmdstr = "";

   for (i=0; tos && i<tos.command.length; i++) {
      if (cmdstr) cmdstr += "\n"; // concatenate with separate lines
      cmdstr += tos.command[i];
      }
   sheet.ScheduleSheetCommands(cmdstr, false); // do undo operations

   }

SocialCalc.CreateAuditString = function(sheet) {

   var i, j;
   var result = "";
   var stack = sheet.changes.stack;
   var tos = sheet.changes.tos;
   for (i=0; i<=tos; i++) {
      for (j=0; j<stack[i].command.length; j++) {
         result += stack[i].command[j] + "\n";
         }
      }

   return result;

   }

SocialCalc.GetStyleNum = function(sheet, atype, style) {

   var num;

   if (style.length==0) return 0; // null means use zero, which means default or global default

   num = sheet[atype+"hash"][style];
   if (!num) {
      if (sheet[atype+"s"].length<1) sheet[atype+"s"].push("");
      num = sheet[atype+"s"].push(style) - 1;
      sheet[atype+"hash"][style] = num;
      sheet.changedrendervalues = true;
      }
   return num;

   }

SocialCalc.GetStyleString = function(sheet, atype, num) {

   if (!num) return null; // zero, null, and undefined return null

   return sheet[atype+"s"][num];

   }

//
// updatedformula = SocialCalc.OffsetFormulaCoords(formula, coloffset, rowoffset)
//
// Change relative cell references by offsets (even those to other worksheets so fill, paste, sort work as expected).
// If not what you want, use absolute references.
//

SocialCalc.OffsetFormulaCoords = function(formula, coloffset, rowoffset) {

   var parseinfo, ttext, ttype, i, cr, newcr;
   var updatedformula = "";
   var scf = SocialCalc.Formula;
   if (!scf) {
      return "Need SocialCalc.Formula";
      }
   var tokentype = scf.TokenType;
   var token_op = tokentype.op;
   var token_string = tokentype.string;
   var token_coord = tokentype.coord;
   var tokenOpExpansion = scf.TokenOpExpansion;

   parseinfo = scf.ParseFormulaIntoTokens(formula);

   for (i=0; i<parseinfo.length; i++) {
      ttype = parseinfo[i].type;
      ttext = parseinfo[i].text;
      if (ttype == token_coord) {
         newcr = "";
         cr = SocialCalc.coordToCr(ttext);
         if (ttext.charAt(0)!="$") { // add col offset unless absolute column
            cr.col += coloffset;
            }
         else {
            newcr += "$";
            }
         newcr += SocialCalc.rcColname(cr.col);
         if (ttext.indexOf("$", 1)==-1) { // add row offset unless absolute row
            cr.row += rowoffset;
            }
         else {
            newcr += "$";
            }
         newcr += cr.row;
         if (cr.row < 1 || cr.col < 1) {
            newcr = "#REF!";
            }
         updatedformula += newcr;
         }
      else if (ttype == token_string) {
         if (ttext.indexOf('"') >= 0) { // quotes to double
            updatedformula += '"' + ttext.replace(/"/, '""') + '"';
            }
         else updatedformula += '"' + ttext + '"';
         }
      else if (ttype == token_op) {
         updatedformula += tokenOpExpansion[ttext] || ttext; // make sure short tokens (e.g., "G") go back full (">=")
         }
      else { // leave everything else alone
         updatedformula += ttext;
         }
      }

   return updatedformula;

   }

//
// updatedformula = SocialCalc.AdjustFormulaCoords(formula, col, coloffset, row, rowoffset)
//
// Change all cell references to cells starting with col/row by offsets
//

SocialCalc.AdjustFormulaCoords = function(formula, col, coloffset, row, rowoffset) {

   var ttype, ttext, i, newcr;
   var updatedformula = "";
   var sheetref = false;
   var scf = SocialCalc.Formula;
   if (!scf) {
      return "Need SocialCalc.Formula";
      }
   var tokentype = scf.TokenType;
   var token_op = tokentype.op;
   var token_string = tokentype.string;
   var token_coord = tokentype.coord;
   var tokenOpExpansion = scf.TokenOpExpansion;

   parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(formula);

   for (i=0; i<parseinfo.length; i++) {
      ttype = parseinfo[i].type;
      ttext = parseinfo[i].text;
      if (ttype == token_op) { // references with sheet specifier are not offset
         if (ttext == "!") {
            sheetref = true; // found a sheet reference
            }
         else if (ttext != ":") { // for everything but a range, reset
            sheetref = false;
            }
         ttext = tokenOpExpansion[ttext] || ttext; // make sure short tokens (e.g., "G") go back full (">=")
         }
      if (ttype == token_coord) {
         cr = SocialCalc.coordToCr(ttext);
         if ((coloffset < 0 && cr.col >= col && cr.col < col-coloffset) ||
             (rowoffset < 0 && cr.row >= row && cr.row < row-rowoffset)) { // refs to deleted cells become invalid
            if (!sheetref) {
               cr.col = 0;
               cr.row = 0;
               }
            }
         if (!sheetref) {
            if (cr.col >= col) {
               cr.col += coloffset;
               }
            if (cr.row >= row) {
               cr.row += rowoffset;
               }
            }
         if (ttext.charAt(0)=="$") {
            newcr = "$"+SocialCalc.rcColname(cr.col);
            }
         else {
            newcr = SocialCalc.rcColname(cr.col);
            }
         if (ttext.indexOf("$", 1)!=-1) {
            newcr += "$" + cr.row;
            }
         else {
            newcr += cr.row;
            }
         if (cr.row < 1 || cr.col < 1) {
            newcr = "#REF!";
            }
         ttext = newcr;
         }
      else if (ttype == token_string) {
         if (ttext.indexOf('"') >= 0) { // quotes to double
            ttext = '"' + ttext.replace(/"/, '""') + '"';
            }
         else ttext = '"' + ttext + '"';
         }
      updatedformula += ttext;
      }

   return updatedformula;

   }

//
// updatedformula = SocialCalc.ReplaceFormulaCoords(formula, movedto)
//
// Change all cell references to cells that are keys in moveto to be to moveto[coord].
// Don't change references to other sheets.
// Handle range extents specially.
//

SocialCalc.ReplaceFormulaCoords = function(formula, movedto) {

   var ttype, ttext, i, newcr, coord;
   var updatedformula = "";
   var sheetref = false;
   var scf = SocialCalc.Formula;
   if (!scf) {
      return "Need SocialCalc.Formula";
      }
   var tokentype = scf.TokenType;
   var token_op = tokentype.op;
   var token_string = tokentype.string;
   var token_coord = tokentype.coord;
   var tokenOpExpansion = scf.TokenOpExpansion;

   parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(formula);

   for (i=0; i<parseinfo.length; i++) {
      ttype = parseinfo[i].type;
      ttext = parseinfo[i].text;
      if (ttype == token_op) { // references with sheet specifier are not change
         if (ttext == "!") {
            sheetref = true; // found a sheet reference
            }
         else if (ttext != ":") { // for everything but a range, reset
            sheetref = false;
            }

//!!!! HANDLE RANGE EXTENT MOVES

         ttext = tokenOpExpansion[ttext] || ttext; // make sure short tokens (e.g., "G") go back full (">=")
         }
      if (ttype == token_coord) {
         cr = SocialCalc.coordToCr(ttext); // get parts
         coord = SocialCalc.crToCoord(cr.col, cr.row); // get "clean" reference
         if (movedto[coord] && !sheetref) { // this is a reference to a moved cell
            cr = SocialCalc.coordToCr(movedto[coord]); // get new row and col
            if (ttext.charAt(0)=="$") { // copy absolute ref marks if present
               newcr = "$"+SocialCalc.rcColname(cr.col);
               }
            else {
               newcr = SocialCalc.rcColname(cr.col);
               }
            if (ttext.indexOf("$", 1)!=-1) {
               newcr += "$" + cr.row;
               }
            else {
               newcr += cr.row;
               }
            ttext = newcr;
            }
         }
      else if (ttype == token_string) {
         if (ttext.indexOf('"') >= 0) { // quotes to double
            ttext = '"' + ttext.replace(/"/, '""') + '"';
            }
         else ttext = '"' + ttext + '"';
         }
      updatedformula += ttext;
      }

   return updatedformula;

   }


// ************************
//
// Recalc Loop Code
//
// ************************

//
// How recalc works:
//
// !!!!!!!!!!!!!!
//

// SocialCalc.RecalcInfo - object with global recalc info

SocialCalc.RecalcInfo = {

   sheet: null, // which sheet is being recalced

   currentState: 0, // current state
   state: {idle: 0, start_calc: 1, order: 2, calc: 3, start_wait: 4, done_wait: 5}, // allowed state values

   recalctimer: null, // value to cancel timer
   maxtimeslice: 100, // maximum milliseconds per slice of recalc time before a wait
   timeslicedelay: 1, // milliseconds to wait between recalc time slices
   starttime: 0, // when recalc started

   queue: [], // queue of sheet waiting to be recalced

   // LoadSheet: a function that returns true if started a load or false if not.
   //

   LoadSheet: function(sheetname) {return false;} // default returns not found

   }

// SocialCalc.RecalcData - object with recalc info while determining recalc order and afterward

SocialCalc.RecalcData = function() { // initialize a RecalcData object

   this.inrecalc = true; // if true, doing a recalc
   this.celllist = []; // list with all potential cells to calculate
   this.celllistitem = 0; // cell to check next when ordering
   this.calclist = null; // object which is the chained list of cells to calculate
                         // each in the form of "coord: nextcoord"
                         // e.g., if B8 is calculated right after A8, then calclist.A8=="B8"
                         // if null, need to create the list
   this.calclistlength = 0; // number of items in calclist

   this.firstcalc = null; // start of the calc list - a string or null
   this.lastcalc = null; // last one on chain (used to add more to the end)

   this.nextcalc = null; // used to keep track during background recalc to make it restartable
   this.count = 0; // number calculated

   // checkinfo is used when determining calc order:

   this.checkinfo = {}; // attributes are coords; if no attrib for a coord, it wasn't checked or doesn't need it
                        // values are RecalcCheckInfo objects while checking or TRUE when complete

   }

// SocialCalc.RecalcCheckInfo - object that stores checking info while determining recalc order

SocialCalc.RecalcCheckInfo = function() { // initialize a RecalcCheckInfo object

   this.oldcoord = null; // chain back up of cells referring to cells
   this.parsepos = 0; // which token we are up to

   // range info

   this.inrange = false; // if true, in the process of checking a range of coords
   this.inrangestart = false; // if true, have not yet filled in range loop values
   this.cr1 = null; // range first coord as a cr object
   this.cr2 = null; // range second coord as a cr object
   this.c1 = null; // range extents
   this.c2 = null;
   this.r1 = null;
   this.r2 = null;
   this.c = null; // looping values
   this.r = null;
   
   }

// Recalc the entire sheet

SocialCalc.RecalcSheet = function(sheet) {

   var coord, err, recalcdata;
   var scri = SocialCalc.RecalcInfo;

   if (scri.currentState != scri.state.idle) {
      scri.queue.push(sheet);
      return;
      }

   delete sheet.attribs.circularreferencecell; // reset recalc-wide things
   SocialCalc.Formula.FreshnessInfoReset();

   SocialCalc.RecalcClearTimeout();

   scri.sheet = sheet; // set values needed by background recalc
   scri.currentState = scri.state.start_calc;

   scri.starttime = new Date();

   if (sheet.statuscallback) {
      sheet.statuscallback(scri, "calcstart", null, sheet.statuscallbackparams);
      }

   SocialCalc.RecalcSetTimeout();

   }

//
// SocialCalc.RecalcSetTimeout - set a timer for next recalc step
//

SocialCalc.RecalcSetTimeout = function() {

   var scri = SocialCalc.RecalcInfo;

   scri.recalctimer = window.setTimeout(SocialCalc.RecalcTimerRoutine, scri.timeslicedelay);

   }

//
// SocialCalc.RecalcClearTimeout - cancel any timeouts
//

SocialCalc.RecalcClearTimeout = function() {

   var scri = SocialCalc.RecalcInfo;

   if (scri.recalctimer) {
      window.clearTimeout(scri.recalctimer);
      scri.recalctimer = null;
      }

   }


//
// SocialCalc.RecalcLoadedSheet(sheetname, str, recalcneeded, live)
//
// Called when a sheet finishes loading with name, string, and t/f whether it should be recalced.
// If loaded sheet has sheet.attribs.recalc=="off", then no recalc done.
// If sheetname is null, then the sheetname waiting for will be used.
//

SocialCalc.RecalcLoadedSheet = function(sheetname, str, recalcneeded, live) {

   var sheet;
   var scri = SocialCalc.RecalcInfo;
   var scf = SocialCalc.Formula;

   sheet = SocialCalc.Formula.AddSheetToCache(sheetname || scf.SheetCache.waitingForLoading, str, live);

   if (recalcneeded && sheet && sheet.attribs.recalc!="off") { // if recalcneeded, and not manual sheet, chain in this new sheet to recalc loop
      sheet.previousrecalcsheet = scri.sheet;
      scri.sheet = sheet;
      scri.currentState = scri.state.start_calc;
      }
   scf.SheetCache.waitingForLoading = null;

   SocialCalc.RecalcSetTimeout();

   }


//
// SocialCalc.RecalcTimerRoutine - handles the actual order determination and cell-by-cell recalculation in the background
//

SocialCalc.RecalcTimerRoutine = function() {

   var eresult, cell, coord, err, status;
   var starttime = new Date();
   var count = 0;
   var scf = SocialCalc.Formula;
   if (!scf) {
      return "Need SocialCalc.Formula";
      }
   var scri = SocialCalc.RecalcInfo;
   var sheet = scri.sheet;
   if (!sheet) {
      return;
      }
   var recalcdata = sheet.recalcdata;

   var do_statuscallback = function(status, arg) { // routine to do callback if required
      if (sheet.statuscallback) {
         sheet.statuscallback(recalcdata, status, arg, sheet.statuscallbackparams);
         }
      }

   SocialCalc.RecalcClearTimeout();

   if (scri.currentState == scri.state.start_calc) {

      recalcdata = new SocialCalc.RecalcData();
      sheet.recalcdata = recalcdata;

      for (coord in sheet.cells) { // get list of cells to check for order
         if (!coord) continue;
         recalcdata.celllist.push(coord);
         }

      recalcdata.calclist = {}; // start with empty list
      scri.currentState = scri.state.order; // drop through to determining recalc order
      }

   if (scri.currentState == scri.state.order) {
      while (recalcdata.celllistitem < recalcdata.celllist.length) { // check all the cells to see if they should be on the list
         coord = recalcdata.celllist[recalcdata.celllistitem++];
         err = SocialCalc.RecalcCheckCell(sheet, coord);
         if (((new Date()) - starttime) >= scri.maxtimeslice) { // if taking too long, give up CPU for a while
            do_statuscallback("calcorder", {coord: coord, total: recalcdata.celllist.length, count: recalcdata.celllistitem});
            SocialCalc.RecalcSetTimeout();
            return;
            }
         }

      do_statuscallback("calccheckdone", recalcdata.calclistlength);

      recalcdata.nextcalc = recalcdata.firstcalc; // start at the beginning of the recalc chain
      scri.currentState = scri.state.calc; // loop through cells on next timer call
      SocialCalc.RecalcSetTimeout();
      return;
      }

   if (scri.currentState == scri.state.start_wait) { // starting to wait for something
      scri.currentState = scri.state.done_wait; // finished on next timer call
      if (scri.LoadSheet) {
         status = scri.LoadSheet(scf.SheetCache.waitingForLoading);
         if (status) { // started a load operation
            return;
            }
         }
      SocialCalc.RecalcLoadedSheet(null, "", false);
      return;
      }

   if (scri.currentState == scri.state.done_wait) {
      scri.currentState = scri.state.calc; // loop through cells on next timer call
      SocialCalc.RecalcSetTimeout();
      return;
      }

   // otherwise should be scri.state.calc

   if (scri.currentState != scri.state.calc) {
      alert("Recalc state error: "+scri.currentState+". Error in SocialCalc code.");
      }

   coord = sheet.recalcdata.nextcalc;
   while (coord) {
      cell = sheet.cells[coord];
      eresult = scf.evaluate_parsed_formula(cell.parseinfo, sheet, false);
      if (scf.SheetCache.waitingForLoading) { // wait until restarted
         recalcdata.nextcalc = coord; // start with this cell again
         recalcdata.count += count;
         do_statuscallback("calcloading", {sheetname: scf.SheetCache.waitingForLoading});
         scri.currentState = scri.state.start_wait; // start load on next timer call
         SocialCalc.RecalcSetTimeout();
         return;
         }

      if (scf.RemoteFunctionInfo.waitingForServer) { // wait until restarted
         recalcdata.nextcalc = coord; // start with this cell again
         recalcdata.count += count;
         do_statuscallback("calcserverfunc",
            {funcname: scf.RemoteFunctionInfo.waitingForServer, coord: coord, total: recalcdata.calclistlength, count: recalcdata.count});
         scri.currentState = scri.state.done_wait; // start load on next timer call
         return; // return and wait for next recalc timer event
         }

      if (cell.datavalue != eresult.value ||
       cell.valuetype != eresult.type) { // only update if changed from last time
         cell.datavalue = eresult.value;
         cell.valuetype = eresult.type;
         delete cell.displaystring;
         sheet.recalcchangedavalue = true; // remember something changed in case other code wants to know
         }
      if (eresult.error) {
         cell.errors = eresult.error;
         }
      count++;
      coord = sheet.recalcdata.calclist[coord];

      if (((new Date()) - starttime) >= scri.maxtimeslice) { // if taking too long, give up CPU for a while
         recalcdata.nextcalc = coord; // start with next cell on chain
         recalcdata.count += count;
         do_statuscallback("calcstep", {coord: coord, total: recalcdata.calclistlength, count: recalcdata.count});
         SocialCalc.RecalcSetTimeout();
         return;
         }
      }

   recalcdata.inrecalc = false;

   delete sheet.recalcdata; // save memory and clear out for name lookup formula evaluation

   delete sheet.attribs.needsrecalc; // remember recalc done

   scri.sheet = sheet.previousrecalcsheet || null; // chain back if doing recalc of loaded sheets
   if (scri.sheet) {
      scri.currentState = scri.state.calc; // start where we left off
      SocialCalc.RecalcSetTimeout();
      return;
      }

   scf.FreshnessInfo.recalc_completed = true; // say freshness info is complete
   scri.currentState = scri.state.idle; // we are idle

   do_statuscallback("calcfinished", (new Date()) - scri.starttime);

   // Check queue for more sheets.
   if (scri.queue.length > 0) {
      sheet = scri.queue.shift();
      sheet.RecalcSheet();
      }
   }


//
// circref = SocialCalc.RecalcCheckCell(sheet, coord)
//
// Checks cell to put on calclist, looking at parsed tokens.
// Also checks cells this cell is dependent upon
// if it contains a formula with cell references.
// If circular reference, returns non-null.
//

SocialCalc.RecalcCheckCell = function(sheet, startcoord) {

   var parseinfo, ttext, ttype, i, rangecoord, circref, value, pos, pos2, cell, coordvals;
   var scf = SocialCalc.Formula;
   if (!scf) {
      return "Need SocialCalc.Formula";
      }
   var tokentype = scf.TokenType;
   var token_op = tokentype.op;
   var token_name = tokentype.name;
   var token_coord = tokentype.coord;

   var recalcdata = sheet.recalcdata;
   var checkinfo = recalcdata.checkinfo;

   var sheetref = false; // if true, a sheet reference is in effect, so don't check that
   var oldcoord = null; // coord of formula that referred to this one when checking down the tree
   var coord = startcoord; // the coord of the cell we are checking

   // Start with requested cell, and then continue down or up the dependency tree
   // oldcoord (and checkinfo[coord].oldcoord) maintains the reference stack during the tree walk
   // checkinfo[coord] maintains the stack of checking looping values, e.g., token number being checked

mainloop:
   while (coord) {
      cell = sheet.cells[coord];
      coordvals = checkinfo[coord];

      if (!cell || cell.datatype != "f" || // Don't calculate if not a formula
          (coordvals && typeof coordvals != "object")) { // Don't calc if already calculated
         coord = oldcoord; // go back up dependency tree to coord that referred to us
         if (checkinfo[coord]) oldcoord = checkinfo[coord].oldcoord;
         continue;
         }

      if (!coordvals) { // do we have checking information about this cell?
         coordvals = new SocialCalc.RecalcCheckInfo(); // no - make a place to hold it
         checkinfo[coord] = coordvals;
         }

      if (cell.errors) { // delete errors from previous recalcs
         delete cell.errors;
         }

      if (!cell.parseinfo) { // cache parsed formula
         cell.parseinfo = scf.ParseFormulaIntoTokens(cell.formula);
         }
      parseinfo = cell.parseinfo;

      for (i=coordvals.parsepos; i<parseinfo.length; i++) { // go through each token in formula

         if (coordvals.inrange) { // processing a range of coords
            if (coordvals.inrangestart) { // first time - fill in other values
               if (coordvals.cr1.col > coordvals.cr2.col) { coordvals.c1 = coordvals.cr2.col; coordvals.c2 = coordvals.cr1.col; }
               else { coordvals.c1 = coordvals.cr1.col; coordvals.c2 = coordvals.cr2.col; }
               coordvals.c = coordvals.c1 - 1; // start one before

               if (coordvals.cr1.row > coordvals.cr2.row) { coordvals.r1 = coordvals.cr2.row; coordvals.r2 = coordvals.cr1.row; }
               else { coordvals.r1 = coordvals.cr1.row; coordvals.r2 = coordvals.cr2.row; }
               coordvals.r = coordvals.r1; // start on this row
               coordvals.inrangestart = false;
               }
            else { // not first time
               }
            coordvals.c += 1; // increment column
            if (coordvals.c > coordvals.c2) { // finished the columns of this row
               coordvals.r += 1; // increment row
               if (coordvals.r > coordvals.r2) { // finished checking the entire range
                  coordvals.inrange = false;
                  continue;
                  }
               coordvals.c = coordvals.c1; // start at the beginning of next row
               }
            rangecoord = SocialCalc.crToCoord(coordvals.c, coordvals.r);

            // now check that one

            coordvals.parsepos = i; // remember our position
            coordvals.oldcoord = oldcoord; // remember back up chain
            oldcoord = coord; // come back to us
            coord = rangecoord;
            if (checkinfo[coord] && typeof checkinfo[coord] == "object") { // Circular reference
               cell.errors = SocialCalc.Constants.s_caccCircRef+startcoord; // set on original cell making the ref
               checkinfo[startcoord] = true; // this one should be calculated once at this point
               if (!recalcdata.firstcalc) {
                  recalcdata.firstcalc = startcoord;
                  }
               else {
                  recalcdata.calclist[recalcdata.lastcalc] = startcoord;
                  }
               recalcdata.lastcalc = startcoord;
               recalcdata.calclistlength++; // count number on list
               sheet.attribs.circularreferencecell = coord+"|"+oldcoord; // remember at least one circ ref
               return cell.errors;
               }
            continue mainloop;
            }

         ttype = parseinfo[i].type; // get token details
         ttext = parseinfo[i].text;
         if (ttype == token_op) { // references with sheet specifier are not checked
            if (ttext == "!") {
               sheetref = true; // found a sheet reference
               }
            else if (ttext != ":") { // for everything but a range, reset
               sheetref = false;
               }
            }

         if (ttype == token_name) { // look for named range
            value = scf.LookupName(sheet, ttext);
            if (value.type == "range") { // only need to recurse here for range, which may be just one cell
               pos = value.value.indexOf("|");
               if (pos != -1) { // range - check each cell
                  coordvals.cr1 = SocialCalc.coordToCr(value.value.substring(0,pos));
                  pos2 = value.value.indexOf("|", pos+1);
                  coordvals.cr2 = SocialCalc.coordToCr(value.value.substring(pos+1,pos2));
                  coordvals.inrange = true;
                  coordvals.inrangestart = true;
                  i = i-1; // back up so will start up again here
                  continue;
                  }
               }
            else if (value.type == "coord") { // just a coord
               ttype = token_coord; // treat as a coord inline
               ttext = value.value; // and then drop through to next test which should succeed
               }
            else { // not a defined name - probably a function
               }
            }

         if (ttype == token_coord) { // token is a coord

            if (i >= 2 // look for a range
             && parseinfo[i-1].type == token_op && parseinfo[i-1].text == ':'
             && parseinfo[i-2].type == token_coord
             && !sheetref) { // Range -- check each cell
               coordvals.cr1 = SocialCalc.coordToCr(parseinfo[i-2].text); // remember range extents
               coordvals.cr2 = SocialCalc.coordToCr(ttext);
               coordvals.inrange = true; // next time use the range looping code
               coordvals.inrangestart = true;
               i = i-1; // back up so will start up again here
               continue;
               }

            else if (!sheetref) { // Single cell reference
               if (ttext.indexOf("$") != -1) ttext = ttext.replace(/\$/g, ""); // remove any $'s
               coordvals.parsepos = i+1; // remember our position - come back on next token
               coordvals.oldcoord = oldcoord; // remember back up chain
               oldcoord = coord; // come back to us
               coord = ttext;
               if (checkinfo[coord] && typeof checkinfo[coord] == "object") { // Circular reference
                  cell.errors = SocialCalc.Constants.s_caccCircRef+startcoord; // set on original cell making the ref
                  checkinfo[startcoord] = true; // this one should be calculated once at this point
                  if (!recalcdata.firstcalc) { // add to calclist
                     recalcdata.firstcalc = startcoord;
                     }
                  else {
                     recalcdata.calclist[recalcdata.lastcalc] = startcoord;
                     }
                  recalcdata.lastcalc = startcoord;
                  recalcdata.calclistlength++; // count number on list
                  sheet.attribs.circularreferencecell = coord+"|"+oldcoord; // remember at least one circ ref
                  return cell.errors;
                  }
               continue mainloop;
               }
            }
         }

      sheetref = false; // make sure off when bump back up

      checkinfo[coord] = true; // this one is finished
      if (!recalcdata.firstcalc) { // add to calclist
         recalcdata.firstcalc = coord;
         }
      else {
         recalcdata.calclist[recalcdata.lastcalc] = coord;
         }
      recalcdata.lastcalc = coord;
      recalcdata.calclistlength++; // count number on list

      coord = oldcoord; // go back to the formula that referred to us and continue
      oldcoord = checkinfo[coord] ? checkinfo[coord].oldcoord : null;

      }

   return "";

   }


// *************************************
//
// Parse class:
//
// Used by ExecuteSheetCommand to get elements of commands to execute.
// The string it works with consists of one or more lines each
// made up of one or more tokens separated by a delimiter.
//
// *************************************

// Initialize: set string to work with

SocialCalc.Parse = function(str) {

   // properties:

   this.str = str;
   this.pos = 0;
   this.delimiter = " ";
   this.lineEnd = str.indexOf("\n");
   if (this.lineEnd < 0) {
      this.lineEnd = str.length;
      }

   }

// Return next token as a string

SocialCalc.Parse.prototype.NextToken = function() {
   if (this.pos < 0) return "";
   var pos2 = this.str.indexOf(this.delimiter, this.pos);
   var pos1 = this.pos;
   if (pos2 > this.lineEnd) { // don't go past end of line
      pos2 = this.lineEnd;
      }
   if (pos2 >= 0) {
      this.pos = pos2 + 1;
      return this.str.substring(pos1, pos2);
      }
   else {
      this.pos = this.lineEnd;
      return this.str.substring(pos1, this.lineEnd);
      }
   }

// Return everything from current point until end of line

SocialCalc.Parse.prototype.RestOfString = function() {
   var oldpos = this.pos;
   if (this.pos < 0 || this.pos >= this.lineEnd) return "";
   this.pos = this.lineEnd;
   return this.str.substring(oldpos, this.lineEnd);
   }

SocialCalc.Parse.prototype.RestOfStringNoMove = function() {
   if (this.pos < 0 || this.pos >= this.lineEnd) return "";
   return this.str.substring(this.pos, this.lineEnd);
   }

// Move current point to next line

SocialCalc.Parse.prototype.NextLine = function() {
   this.pos = this.lineEnd + 1;
   this.lineEnd = this.str.indexOf("\n", this.pos);
   if (this.lineEnd < 0) {
      this.lineEnd = this.str.length;
      }
   }

// Check to see if at end of string with no more to process

SocialCalc.Parse.prototype.EOF = function() {
   if (this.pos < 0 || this.pos >= this.str.length) return true;
   return false;
   }


// *************************************
//
// UndoStack class:
//
// Implements the behavior needed for a normal application's undo/redo stack.
// You add a new change sequence with PushChange.
// The type argument is a string that can be used to lookup some general string 
// like "typing" or "setting attribute" for the menu prompts for undo/redo.
//
// You add the "do" steps with AddDo. The non-null, non-undefined arguments are
// joined together with " " to make a command string to be saved.
//
// You add the undo steps as commands for the most recent change with AddUndo.
// The non-null, non-undefined arguments are joined together with " " to make
// a command string to be saved.
//
// The Undo and Redo functions move the Top Of Stack pointer through the changes stack
// so you can undo and redo. Doing a new PushChange removes all undone items
// after TOS.
//
// You can push more things than you can undo if you want.
// There is a maximum to remember as the "did" stack for an audit trail (and as redo). This may be unlimited.
// There is a separate maximum to remember that can be undone. This may be smaller than maxRedo.
//
// *************************************

SocialCalc.UndoStack = function() {

   // properties:

   this.stack = []; // {command: [], type: type, undo: []} -- multiple dos and undos allowed
   this.tos = -1; // top of stack position, used for undo/redo
   this.maxRedo = 0; // Maximum size of redo stack (and audit trail which is this.stack[n].command) or zero if no limit
   this.maxUndo = 50; // Maximum number of steps kept for undo (usually the memory intensive part) or zero if no limit

   }

SocialCalc.UndoStack.prototype.PushChange = function(type) { // adding a new thing to the stack
   while (this.stack.length > 0 && this.stack.length-1 > this.tos) { // pop off things not redone
      this.stack.pop();
      }
   this.stack.push({command: [], type: type, undo: []});
   if (this.maxRedo && this.stack.length > this.maxRedo) { // limit number kept as audit trail
      this.stack.shift(); // remove the extra one
      }
   if (this.maxUndo && this.stack.length > this.maxUndo) { // need to trim excess undo info
      this.stack[this.stack.length - this.maxUndo - 1].undo = []; // only need to remove one
      }
   this.tos = this.stack.length - 1;
   }

SocialCalc.UndoStack.prototype.AddDo = function() {
   if (!this.stack[this.stack.length-1]) { return; }
   var args = [];
   for (var i=0; i<arguments.length; i++) {
      if (arguments[i]!=null) args.push(arguments[i]); // ignore null or undefined
      }
   var cmd = args.join(" ");
   this.stack[this.stack.length-1].command.push(cmd);
   }

SocialCalc.UndoStack.prototype.AddUndo = function() {
   if (!this.stack[this.stack.length-1]) { return; }
   var args = [];
   for (var i=0; i<arguments.length; i++) {
      if (arguments[i]!=null) args.push(arguments[i]); // ignore null or undefined
      }
   var cmd = args.join(" ");
   this.stack[this.stack.length-1].undo.push(cmd);
   }

SocialCalc.UndoStack.prototype.TOS = function() {
   if (this.tos >= 0) return this.stack[this.tos];
   else return null;
   }

SocialCalc.UndoStack.prototype.Undo = function() {
   if (this.tos >= 0 && (!this.maxUndo || this.tos > this.stack.length - this.maxUndo - 1)) {
      this.tos -= 1;
      return true;
      }
   else {
      return false;
      }
   }

SocialCalc.UndoStack.prototype.Redo = function() {
   if (this.tos < this.stack.length-1) {
      this.tos += 1;
      return true;
      }
   else {
      return false;
      }
   }

// *************************************
//
// Clipboard Object:
//
// This is a single object.
// Stores the clipboard, which is shared by all active sheets.
// Like the undo stack, it does not persist from one editing session to another.
//
// *************************************

SocialCalc.Clipboard = {

   // properties:

   clipboard:  "" // empty or string in save format with "copiedfrom:" set to a range

   }


// *************************************
//
// RenderContext class:
//
// *************************************

SocialCalc.RenderContext = function(sheetobj) {

   var parts, num, s;
   var attribs = sheetobj.attribs;
   var scc = SocialCalc.Constants;

   // properties:

   this.sheetobj = sheetobj;
   this.hideRowsCols = false; // Rendering with panes only works with "false"
                              // !!!! Note: not implemented yet in rendering, just saved as an attribute
   this.showGrid = false;
   this.showRCHeaders = false;
   this.rownamewidth = scc.defaultRowNameWidth;
   this.pixelsPerRow = scc.defaultAssumedRowHeight;

   this.cellskip = {}; // if present, coord of cell covering this cell
   this.coordToCR = {}; // for cells starting spans, coordToCR[coord]={row:row, col:col}
   this.colwidth = []; // precomputed column widths, taking into account defaults
   this.totalwidth = 0; // precomputed total table width

   this.rowpanes = []; // for each pane, {first: firstrow, last: lastrow}
   this.colpanes = []; // for each pane, {first: firstrow, last: lastrow}
   this.colunhideleft = [];
   this.colunhideright = [];
   this.rowunhidetop = [];
   this.rowunhidebottom = [];
   this.maxcol=0; // max col and row to display, adding long spans, etc.
   this.maxrow=0;

   this.highlights = {}; // for each cell with special display: coord:highlightType (see this.highlightTypes)
   this.cursorsuffix = ""; // added to highlights[cr]=="cursor" to get type to lookup

   this.highlightTypes = // attributes to change when highlit
      {
         cursor: {style: scc.defaultHighlightTypeCursorStyle, className: scc.defaultHighlightTypeCursorClass},
         range: {style: scc.defaultHighlightTypeRangeStyle, className: scc.defaultHighlightTypeRangeClass},
         cursorinsertup: {style: "color:#FFF;backgroundColor:#A6A6A6;backgroundRepeat:repeat-x;backgroundPosition:top left;backgroundImage:url("+scc.defaultImagePrefix+"cursorinsertup.gif);", className: scc.defaultHighlightTypeCursorClass},
         cursorinsertleft: {style: "color:#FFF;backgroundColor:#A6A6A6;backgroundRepeat:repeat-y;backgroundPosition:top left;backgroundImage:url("+scc.defaultImagePrefix+"cursorinsertleft.gif);", className: scc.defaultHighlightTypeCursorClass},
         range2: {style: "color:#000;backgroundColor:#FFF;backgroundImage:url("+scc.defaultImagePrefix+"range2.gif);", className: ""}
      }

   this.cellIDprefix = scc.defaultCellIDPrefix; // if non-null, each cell will render with an ID

   this.defaultlinkstyle = null; // default linkstyle object (allows you to pass values to link renderer)
   this.defaultHTMLlinkstyle = {type: "html"}; // default linkstyle for standalone HTML

   // constants:

   this.defaultfontstyle = scc.defaultCellFontStyle;
   this.defaultfontsize = scc.defaultCellFontSize;
   this.defaultfontfamily = scc.defaultCellFontFamily;

   this.defaultlayout = scc.defaultCellLayout;

   this.defaultpanedividerwidth = scc.defaultPaneDividerWidth;
   this.defaultpanedividerheight = scc.defaultPaneDividerHeight;

   this.gridCSS = scc.defaultGridCSS;

   this.commentClassName = scc.defaultCommentClass; // for cells with non-blank comments when this.showGrid is true
   this.commentCSS = scc.defaultCommentStyle; // any combination of classnames and styles may be used
   this.commentNoGridClassName = scc.defaultCommentNoGridClass; // for cells when this.showGrid is false
   this.commentNoGridCSS = scc.defaultCommentNoGridStyle; // any combination of classnames and styles may be used

   this.readonlyClassName = scc.defaultReadonlyClass; // for readonly cells with non-blank comments when this.showGrid is true
   this.readonlyCSS = scc.defaultReadonlyStyle; // any combination of classnames and styles may be used
   this.readonlyNoGridClassName = scc.defaultReadonlyNoGridClass; // for readonly cells when this.showGrid is false
   this.readonlyNoGridCSS = scc.defaultReadonlyNoGridStyle; // any combination of classnames and styles may be used
   this.readonlyComment = scc.defaultReadonlyComment;

   this.classnames = // any combination of classnames and explicitStyles can be used
      {
         colname: scc.defaultColnameClass,
         rowname: scc.defaultRownameClass,
         selectedcolname: scc.defaultSelectedColnameClass,
         selectedrowname: scc.defaultSelectedRownameClass,
         upperleft: scc.defaultUpperLeftClass,
         skippedcell: scc.defaultSkippedCellClass,
         panedivider: scc.defaultPaneDividerClass,
         unhideleft: scc.defaultUnhideLeftClass,
         unhideright: scc.defaultUnhideRightClass,
         unhidetop: scc.defaultUnhideTopClass,
         unhidebottom: scc.defaultUnhideBottomClass
      };

   this.explicitStyles = // these may be used so you won't need a stylesheet with the classnames
      {
         colname: scc.defaultColnameStyle,
         rowname: scc.defaultRownameStyle,
         selectedcolname: scc.defaultSelectedColnameStyle,
         selectedrowname: scc.defaultSelectedRownameStyle,
         upperleft: scc.defaultUpperLeftStyle,
         skippedcell: scc.defaultSkippedCellStyle,
         panedivider: scc.defaultPaneDividerStyle,
         unhideleft: scc.defaultUnhideLeftStyle,
         unhideright: scc.defaultUnhideRightStyle,
         unhidetop: scc.defaultUnhideTopStyle,
         unhidebottom: scc.defaultUnhideBottomStyle
      };

   // processed info about cell skipping

   this.cellskip = null;
   this.needcellskip = true;

   // precomputed values, filling in defaults indicated by "*"

   this.fonts=[]; // for each fontnum, {style: fs, weight: fw, size: fs, family: ff}
   this.layouts=[]; // for each layout, "padding:Tpx Rpx Bpx Lpx;vertical-align:va;"

   this.needprecompute = true; // need to call PrecomputeSheetFontsAndLayouts

   // if have a sheet object, initialize constants and precomputed values

   if (attribs) {
      this.rowpanes[0] = {first: 1, last: attribs.lastrow};
      this.colpanes[0] = {first: 1, last: attribs.lastcol};
      this.usermaxcol = attribs.usermaxcol;
      this.usermaxrow = attribs.usermaxrow;

      }
   else throw scc.s_rcMissingSheet;

   }

// Methods:

SocialCalc.RenderContext.prototype.PrecomputeSheetFontsAndLayouts = function() {SocialCalc.PrecomputeSheetFontsAndLayouts(this);};
SocialCalc.RenderContext.prototype.CalculateCellSkipData = function() {SocialCalc.CalculateCellSkipData(this);};
SocialCalc.RenderContext.prototype.CalculateColWidthData = function() {SocialCalc.CalculateColWidthData(this);};
SocialCalc.RenderContext.prototype.SetRowPaneFirstLast = function(panenum, first, last) {this.rowpanes[panenum]={first:first, last:last};};
SocialCalc.RenderContext.prototype.SetColPaneFirstLast = function(panenum, first, last) {this.colpanes[panenum]={first:first, last:last};};
SocialCalc.RenderContext.prototype.CoordInPane = function(coord, rowpane, colpane) {return SocialCalc.CoordInPane(this, coord, rowpane, colpane);};
SocialCalc.RenderContext.prototype.CellInPane = function(row, col, rowpane, colpane) {return SocialCalc.CellInPane(this, row, col, rowpane, colpane);};
SocialCalc.RenderContext.prototype.InitializeTable = function(tableobj) {SocialCalc.InitializeTable(this, tableobj);};
SocialCalc.RenderContext.prototype.RenderSheet = function(oldtable, linkstyle) {return SocialCalc.RenderSheet(this, oldtable, linkstyle);};
SocialCalc.RenderContext.prototype.RenderColGroup = function() {return SocialCalc.RenderColGroup(this);};
SocialCalc.RenderContext.prototype.RenderColHeaders = function() {return SocialCalc.RenderColHeaders(this);};
SocialCalc.RenderContext.prototype.RenderSizingRow = function() {return SocialCalc.RenderSizingRow(this);};
SocialCalc.RenderContext.prototype.RenderRow = function(rownum, rowpane, linkstyle) {return SocialCalc.RenderRow(this, rownum, rowpane, linkstyle);};
SocialCalc.RenderContext.prototype.RenderSpacingRow = function() {return SocialCalc.RenderSpacingRow(this);};
SocialCalc.RenderContext.prototype.RenderCell = function(rownum, colnum, rowpane, colpane, noElement, linkstyle)
      {return SocialCalc.RenderCell(this, rownum, colnum, rowpane, colpane, noElement, linkstyle);};

// Functions:

SocialCalc.PrecomputeSheetFontsAndLayouts = function(context) {

   var defaultfont, parts, layoutre, dparts, sparts, num, s, i;
   var sheetobj = context.sheetobj;
   var attribs =  sheetobj.attribs;

   if (attribs.defaultfont) {
      defaultfont = sheetobj.fonts[attribs.defaultfont];
      defaultfont = defaultfont.replace(/^\*/,SocialCalc.Constants.defaultCellFontStyle);
      defaultfont = defaultfont.replace(/(.+)\*(.+)/,"$1"+SocialCalc.Constants.defaultCellFontSize+"$2");
      defaultfont = defaultfont.replace(/\*$/,SocialCalc.Constants.defaultCellFontFamily);
      parts=defaultfont.match(/^(\S+? \S+?) (\S+?) (\S.*)$/);
      context.defaultfontstyle = parts[1];
      context.defaultfontsize = parts[2];
      context.defaultfontfamily = parts[3];
      }

   for (num=1; num<sheetobj.fonts.length; num++) { // precompute fonts by filling in the *'s
      s=sheetobj.fonts[num];
      s=s.replace(/^\*/,context.defaultfontstyle);
      s=s.replace(/(.+)\*(.+)/,"$1"+context.defaultfontsize+"$2");
      s=s.replace(/\*$/,context.defaultfontfamily);
      parts=s.match(/^(\S+?) (\S+?) (\S+?) (\S.*)$/);
      context.fonts[num] = {style: parts[1], weight: parts[2], size: parts[3], family: parts[4]};

      }

   layoutre = /^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/;
   dparts = SocialCalc.Constants.defaultCellLayout.match(layoutre); // get built-in defaults

   if (attribs.defaultlayout) {
      sparts = sheetobj.layouts[attribs.defaultlayout].match(layoutre); // get sheet defaults, if set
      }
   else {
      sparts = ["", "*", "*", "*", "*", "*"];
      }

   for (num=1; num<sheetobj.layouts.length; num++) { // precompute layouts by filling in the *'s
      s=sheetobj.layouts[num];
      parts = s.match(layoutre);
      for (i=1; i<=5; i++) {
         if (parts[i]=="*") {
            parts[i] = (sparts[i] != "*" ? sparts[i] : dparts[i]); // if *, sheet default or built-in
            }
         }
      context.layouts[num] = "padding:"+parts[1]+" "+parts[2]+" "+parts[3]+" "+parts[4]+
         ";vertical-align:"+parts[5]+";";
      }

   context.needprecompute = false;

   }

SocialCalc.CalculateCellSkipData = function(context) {

   var row, col, coord, cell, contextcell, colspan, rowspan, skiprow, skipcol, skipcoord;

   var sheetobj=context.sheetobj;
   var sheetrowattribs=sheetobj.rowattribs;
   var sheetcolattribs=sheetobj.colattribs;
   context.maxrow=0;
   context.maxcol=0;
   context.cellskip = {}; // reset

   // Calculate cellskip data

   for (row=1; row<=sheetobj.attribs.lastrow; row++) {
      for (col=1; col<=sheetobj.attribs.lastcol; col++) { // look for spans and set cellskip for skipped cells
         coord=SocialCalc.crToCoord(col, row);
         cell=sheetobj.cells[coord];
         // don't look at undefined cells (they have no spans) or skipped cells
         if (cell===undefined || context.cellskip[coord]) continue;
         colspan=cell.colspan || 1;
         rowspan=cell.rowspan || 1;
         if (colspan>1 || rowspan>1) {
            for (skiprow=row; skiprow<row+rowspan; skiprow++) {
               for (skipcol=col; skipcol<col+colspan; skipcol++) { // do the setting on individual cells
                  skipcoord=SocialCalc.crToCoord(skipcol,skiprow);
                  if (skipcoord==coord) { // for coord, remember row and col
                     context.coordToCR[coord]={row: row, col: col};
                     }
                  else { // for other cells, flag with coord of here
                     context.cellskip[skipcoord]=coord;
                     }
                  if (skiprow>context.maxrow) maxrow=skiprow;
                  if (skipcol>context.maxcol) maxcol=skipcol;
                  }
               }
            }
         }
      }

   context.needcellskip = false;

   }

SocialCalc.CalculateColWidthData = function(context) {

   var colnum, colname, colwidth, totalwidth;

   var sheetobj=context.sheetobj;
   var sheetcolattribs=sheetobj.colattribs;

   // Calculate column width data

   totalwidth=context.showRCHeaders ? context.rownamewidth-0 : 0;
   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         colname=SocialCalc.rcColname(colnum);
         if (sheetobj.colattribs.hide[colname] == "yes") {
            context.colwidth[colnum] = 0;
            }
         else {
            colwidth = sheetobj.colattribs.width[colname] || sheetobj.attribs.defaultcolwidth || SocialCalc.Constants.defaultColWidth;
            if (colwidth=="blank" || colwidth=="auto") colwidth="";
            context.colwidth[colnum]=colwidth+"";
            totalwidth+=(colwidth && ((colwidth-0)>0)) ? (colwidth-0) : 10;
            }
         }
      }
   context.totalwidth = totalwidth;

   }

SocialCalc.InitializeTable = function(context, tableobj) {

/*

Uses border-collapse so corners don't have holes
Note: IE and Firefox handle <col> differently (IE adds borders and padding)
under border-collapse and Safari has problems with <col> and wide text
Tablelayout "fixed" also leads to problems

*/

/*

*** Discussion ***

The rendering assumes fixed column widths, even though SocialCalc allows "auto".
There may be issues with "auto" and it is hard to make it work cross-browser
with border-collapse, etc.

This and the RenderSheet routine are where in the code the specifics of
table attributes and column size definitions are set. As the browsers settle down
and when we decide if we don't need auto width, we may want to revisit the way the
code does this (e.g., use table-layout:fixed).

*/
   tableobj.style.borderCollapse="collapse";
   tableobj.cellSpacing="0";
   tableobj.cellPadding="0";

   tableobj.style.width=context.totalwidth+"px";

   }

//
// tableobj = SocialCalc.RenderSheet(context, oldtable, linkstyle)
//
// Renders a render context returning a DOM table object.
// If there is an oldtable object, it replaces it in the parent node.
// If oldtable is null, it just returns the new one.
// The linkstyle is "" or null for editing rendering
// and optionally an object passed on to formatting code.
//

SocialCalc.RenderSheet = function(context, oldtable, linkstyle) {

   var newrow, rowpane;
   var tableobj, colgroupobj, tbodyobj, parentnode;

   // do precompute stuff if necessary

   if (context.sheetobj.changedrendervalues) {
      context.needcellskip = true;
      context.needprecompute = true;
      context.sheetobj.changedrendervalues = false;
      }
   if (context.needcellskip) {
      context.CalculateCellSkipData();
      }
   if (context.needprecompute) {
      context.PrecomputeSheetFontsAndLayouts();
      }

   context.CalculateColWidthData(); // always make sure col width values are up to date

   // make the table element and fill it in

   tableobj=document.createElement("table");
   context.InitializeTable(tableobj);

   colgroupobj=context.RenderColGroup();
   tableobj.appendChild(colgroupobj);

   tbodyobj=document.createElement("tbody");

   tbodyobj.appendChild(context.RenderSizingRow());

   if (context.showRCHeaders) {
      newrow=context.RenderColHeaders();
      if (newrow) tbodyobj.appendChild(newrow);
      }

   for (rowpane=0; rowpane<context.rowpanes.length; rowpane++) {
      for (rownum=context.rowpanes[rowpane].first;rownum<=context.rowpanes[rowpane].last;rownum++) {
         newrow=context.RenderRow(rownum, rowpane, linkstyle);
         tbodyobj.appendChild(newrow);
         }
      if (rowpane<context.rowpanes.length-1) {
         newrow=context.RenderSpacingRow();
         tbodyobj.appendChild(newrow);
         }
      }

   tableobj.appendChild(tbodyobj);

   if (oldtable) {
      parentnode = oldtable.parentNode;
      if (parentnode) parentnode.replaceChild(tableobj, oldtable);
      }

   return tableobj;

   }

SocialCalc.RenderRow = function(context, rownum, rowpane, linkstyle) {

   var sheetobj=context.sheetobj;

   var result=document.createElement("tr");
   var colnum, newcol, colpane, newdiv;

   if (context.showRCHeaders) {
      newcol=document.createElement("td");
      if (context.classnames) newcol.className=context.classnames.rowname;
      if (context.explicitStyles) newcol.style.cssText=context.explicitStyles.rowname;
      newcol.width=context.rownamewidth;
      newcol.style.verticalAlign="top"; // to get around Safari making top of centered row number be
                                        // considered top of row (and can't get <row> position in Safari)
      newcol.innerHTML=rownum+"";

      // If neighbour is hidden, show an icon in this column.
      if (rownum < context.rowpanes[context.rowpanes.length-1].last && sheetobj.rowattribs.hide[rownum+1] == "yes") {
         // HACK: Because we likely want the icon floating at the bottom of the cell, we create an enclosing div 
         // with position relative and the icon's div will be placed inside it with position: absolute and bottom: 0.
         var container = document.createElement("div");
         container.style.position = "relative";
         var unhide = document.createElement("div");
         if (context.classnames) unhide.className=context.classnames.unhidetop;
         if (context.explicitStyles) unhide.style.cssText=context.explicitStyles.unhidetop;
         context.rowunhidetop[rownum] = unhide;
         container.appendChild(unhide);
         newcol.appendChild(container);
         }
      if (rownum > 1 && sheetobj.rowattribs.hide[rownum-1] == "yes") {
         var unhide = document.createElement("div");
         if (context.classnames) unhide.className=context.classnames.unhidebottom;
         if (context.explicitStyles) unhide.style.cssText=context.explicitStyles.unhidebottom;
         context.rowunhidebottom[rownum] = unhide;
         newcol.appendChild(unhide);
         }

      result.appendChild(newcol);
      }

   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         newcol=context.RenderCell(rownum, colnum, rowpane, colpane, null, linkstyle);
         if (newcol) result.appendChild(newcol);
         }
      if (colpane<context.colpanes.length-1) {
         newcol=document.createElement("td");
         newcol.width=context.defaultpanedividerwidth;
         if (context.classnames.panedivider) newcol.className=context.classnames.panedivider;
         if (context.explicitStyles.panedivider) newcol.style.cssText=context.explicitStyles.panedivider;
         newdiv=document.createElement("div"); // for Firefox to avoid squishing
         newdiv.style.width=context.defaultpanedividerwidth+"px";
         newdiv.style.overflow="hidden";
         newcol.appendChild(newdiv);
         result.appendChild(newcol);
         }
      }

   // If hidden row, display: none.
   if (sheetobj.rowattribs.hide[rownum] == "yes") {
      result.style.cssText += ";display:none";
      }

   return result;
   }

SocialCalc.RenderSpacingRow = function(context) {

   var colnum, newcol, colpane, w;

   var sheetobj=context.sheetobj;

   var result=document.createElement("tr");

   if (context.showRCHeaders) {
      newcol=document.createElement("td");
      newcol.width=context.rownamewidth;
      newcol.height=context.defaultpanedividerheight;
      if (context.classnames.panedivider) newcol.className=context.classnames.panedivider;
      if (context.explicitStyles.panedivider) newcol.style.cssText=context.explicitStyles.panedivider;
      result.appendChild(newcol);
      }

   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         newcol=document.createElement("td");
         w = context.colwidth[colnum];
         if (w) newcol.width=w;
         newcol.height=context.defaultpanedividerheight;
         if (context.classnames.panedivider) newcol.className=context.classnames.panedivider;
         if (context.explicitStyles.panedivider) newcol.style.cssText=context.explicitStyles.panedivider;
         if (newcol) result.appendChild(newcol);
         }
      if (colpane<context.colpanes.length-1) {
         newcol=document.createElement("td");
         newcol.width=context.defaultpanedividerwidth;
         newcol.height=context.defaultpanedividerheight;
         if (context.classnames.panedivider) newcol.className=context.classnames.panedivider;
         if (context.explicitStyles.panedivider) newcol.style.cssText=context.explicitStyles.panedivider;
         result.appendChild(newcol);
         }
      }
   return result;
   }

SocialCalc.RenderColHeaders = function(context) {

   var sheetobj=context.sheetobj;

   var result=document.createElement("tr");
   var colnum, newcol;

   if (!context.showRCHeaders) return null;

   newcol=document.createElement("td");
   if (context.classnames) newcol.className=context.classnames.upperleft;
   if (context.explicitStyles) newcol.style.cssText=context.explicitStyles.upperleft;
   newcol.width=context.rownamewidth;
   result.appendChild(newcol);

   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         newcol=document.createElement("td");
         if (context.classnames) newcol.className=context.classnames.colname;
         if (context.explicitStyles) newcol.style.cssText=context.explicitStyles.colname;

         // If hidden column, display: none.
         if (sheetobj.colattribs.hide[SocialCalc.rcColname(colnum)] == "yes") {
            newcol.style.cssText += ";display:none";
            }

         newcol.innerHTML=SocialCalc.rcColname(colnum);

         // If neighbour is hidden, show an icon in this column.
         if (colnum < context.colpanes[context.colpanes.length-1].last && sheetobj.colattribs.hide[SocialCalc.rcColname(colnum+1)] == "yes") {
            var unhide = document.createElement("div");
            if (context.classnames) unhide.className=context.classnames.unhideleft;
            if (context.explicitStyles) unhide.style.cssText=context.explicitStyles.unhideleft;
            context.colunhideleft[colnum] = unhide;
            newcol.appendChild(unhide);
            }
         if (colnum > 1 && sheetobj.colattribs.hide[SocialCalc.rcColname(colnum-1)] == "yes") {
            unhide = document.createElement("div");
            if (context.classnames) unhide.className=context.classnames.unhideright;
            if (context.explicitStyles) unhide.style.cssText=context.explicitStyles.unhideright;
            context.colunhideright[colnum] = unhide;
            newcol.appendChild(unhide);
            }

         result.appendChild(newcol);
         }
      if (colpane<context.colpanes.length-1) {
         newcol=document.createElement("td");
         newcol.width=context.defaultpanedividerwidth;
         if (context.classnames.panedivider) newcol.className=context.classnames.panedivider;
         if (context.explicitStyles.panedivider) newcol.style.cssText=context.explicitStyles.panedivider;
         result.appendChild(newcol);
         }
      }
   return result;
   }

SocialCalc.RenderColGroup = function(context) {

   var colpane, colnum, newcol, t;
   var sheetobj=context.sheetobj;

   var result=document.createElement("colgroup");

   if (context.showRCHeaders) {
      newcol=document.createElement("col");
      newcol.width=context.rownamewidth;
      result.appendChild(newcol);
      }

   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         newcol=document.createElement("col");
         if (sheetobj.colattribs.hide[SocialCalc.rcColname(colnum)] == "yes") {
            newcol.width="1";
            }
         else {
            t = context.colwidth[colnum];
            if (t) newcol.width=t;
            result.appendChild(newcol);
            }
         }
      if (colpane<context.colpanes.length-1) {
         newcol=document.createElement("col");
         newcol.width=context.defaultpanedividerwidth;
         result.appendChild(newcol);
         }
      }
   return result;
   }

SocialCalc.RenderSizingRow = function(context) {

   var colpane, colnum, newcell, t;
   var sheetobj=context.sheetobj;

   var result=document.createElement("tr");

   if (context.showRCHeaders) {
      newcell=document.createElement("td");
      newcell.style.width=context.rownamewidth+"px";
      newcell.height="1";
      result.appendChild(newcell);
      }

   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         newcell=document.createElement("td");
         if (sheetobj.colattribs.hide[SocialCalc.rcColname(colnum)] == "yes") {
            newcell.width="1";
            }
         else {
            t = context.colwidth[colnum];
            if (t) newcell.width=t;
            }
         newcell.height="1";
         result.appendChild(newcell);
         }
      if (colpane<context.colpanes.length-1) {
         newcell=document.createElement("td");
         newcell.width=context.defaultpanedividerwidth;
         newcell.height="1";
         result.appendChild(newcell);
         }
      }
   return result;
   }

SocialCalc.RenderCell = function(context, rownum, colnum, rowpane, colpane, noElement, linkstyle) {

   var sheetobj=context.sheetobj;

   var num, t, result, span, stylename, cell, endcell, sheetattribs, scdefaults;
   var stylestr="";

   rownum = rownum-0; // make sure a number
   colnum = colnum-0;

   var coord=SocialCalc.crToCoord(colnum, rownum);

   if (context.cellskip[coord]) { // skip if within a span
      if (context.CoordInPane(context.cellskip[coord], rowpane, colpane)) {
         return null; // span starts in this pane -- so just skip
         }
      result=noElement ? SocialCalc.CreatePseudoElement() : document.createElement("td"); // span start is scrolled away, so make a special cell
      if (context.classnames.skippedcell) result.className=context.classnames.skippedcell;
      if (context.explicitStyles.skippedcell) result.style.cssText=context.explicitStyles.skippedcell;
      result.innerHTML="&nbsp;"; // put something there so height is OK
      // !!! Really need to add borders in case there isn't anything else shown in the pane to get height
      return result;
      }

   result=noElement ? SocialCalc.CreatePseudoElement() : document.createElement("td");

   if (context.cellIDprefix) {
      result.id = context.cellIDprefix+coord;
      }

   cell=sheetobj.cells[coord];

   if (!cell) {
      cell=new SocialCalc.Cell(coord);
      }

   sheetattribs=sheetobj.attribs;
   scc=SocialCalc.Constants;

   if (cell.colspan>1) {
      span=1;
      for (num=1; num<cell.colspan; num++) {
          if (sheetobj.colattribs.hide[SocialCalc.rcColname(colnum+num)]!="yes" &&
                context.CellInPane(rownum, colnum+num, rowpane, colpane)) {
             span++;
             }
          }
      result.colSpan=span;
      }

   if (cell.rowspan>1) {
      span=1;
      for (num=1; num<cell.rowspan; num++) {
          if (sheetobj.rowattribs.hide[(rownum+num)+""]!="yes" &&
                context.CellInPane(rownum+num, colnum, rowpane, colpane))
             span++;
         }
      result.rowSpan=span;
      }

   if (cell.displaystring==undefined) { // cache the display value
      cell.displaystring = SocialCalc.FormatValueForDisplay(sheetobj, cell.datavalue, coord, (linkstyle || context.defaultlinkstyle));
      }
   result.innerHTML = cell.displaystring;

   num=cell.layout || sheetattribs.defaultlayout;
   if (num && typeof(context.layouts[num]) !== "undefined") {
      stylestr+=context.layouts[num]; // use precomputed layout with "*"'s filled in
      }
   else {
      stylestr+=scc.defaultCellLayout;
      }

   num=cell.font || sheetattribs.defaultfont;
   if (num && typeof(context.fonts[num]) !== "undefined") { // get expanded font strings in context
      t = context.fonts[num]; // do each - plain "font:" style sets all sorts of other values, too (Safari font-stretch problem on cssText)
      stylestr+="font-style:"+t.style+";font-weight:"+t.weight+";font-size:"+t.size+";font-family:"+t.family+";";
      }
   else {
      if (scc.defaultCellFontSize) {
         stylestr+="font-size:"+scc.defaultCellFontSize+";";
         }
      if (scc.defaultCellFontFamily) {
         stylestr+="font-family:"+scc.defaultCellFontFamily+";";
         }
      }

   num=cell.color || sheetattribs.defaultcolor;
   if (num && typeof(sheetobj.colors[num]) !== "undefined") stylestr+="color:"+sheetobj.colors[num]+";";

   num=cell.bgcolor || sheetattribs.defaultbgcolor;
   if (num && typeof(sheetobj.colors[num]) !== "undefined") stylestr+="background-color:"+sheetobj.colors[num]+";";

   num=cell.cellformat;
   if (num && typeof(sheetobj.cellformats[num]) !== "undefined") {
      stylestr+="text-align:"+sheetobj.cellformats[num]+";";
      }
   else {
      t=cell.valuetype.charAt(0);
      if (t=="t") {
         num=sheetattribs.defaulttextformat;
         if (num && typeof(sheetobj.cellformats[num]) !== "undefined") stylestr+="text-align:"+sheetobj.cellformats[num]+";";
         }
      else if (t=="n") {
         num=sheetattribs.defaultnontextformat;
         if (num && typeof(sheetobj.cellformats[num]) !== "undefined") {
            stylestr+="text-align:"+sheetobj.cellformats[num]+";";
            }
         else {
            stylestr+="text-align:right;";
            }
         }
      else stylestr+="text-align:left;";
      }

   // get the end cell for border styling
   if (cell.colspan > 1 || cell.rowspan > 1) {
      endcell = sheetobj.cells[SocialCalc.crToCoord(colnum+(cell.colspan || 1)-1, rownum+(cell.rowspan || 1)-1)];
      }

   num=cell.bt;
   if (num && typeof(sheetobj.borderstyles[num]) !== "undefined") stylestr+="border-top:"+sheetobj.borderstyles[num]+";";

   num=typeof(endcell) != "undefined" ? endcell.br : cell.br;
   if (num && typeof(sheetobj.borderstyles[num]) !== "undefined") stylestr+="border-right:"+sheetobj.borderstyles[num]+";";
   else if (context.showGrid) {
      if (context.CellInPane(rownum, colnum+(cell.colspan || 1), rowpane, colpane))
         t=SocialCalc.crToCoord(colnum+(cell.colspan || 1), rownum);
      else t="nomatch";
      if (context.cellskip[t]) t=context.cellskip[t];
      if (!sheetobj.cells[t] || !sheetobj.cells[t].bl)
         stylestr+="border-right:"+context.gridCSS;
      }

   num=typeof(endcell) != "undefined" ? endcell.bb : cell.bb;
   if (num && typeof(sheetobj.borderstyles[num]) !== "undefined") stylestr+="border-bottom:"+sheetobj.borderstyles[num]+";";
   else if (context.showGrid) {
      if (context.CellInPane(rownum+(cell.rowspan || 1), colnum, rowpane, colpane))
         t=SocialCalc.crToCoord(colnum, rownum+(cell.rowspan || 1));
      else t="nomatch";
      if (context.cellskip[t]) t=context.cellskip[t];
      if (!sheetobj.cells[t] || !sheetobj.cells[t].bt)
         stylestr+="border-bottom:"+context.gridCSS;
      }

   num=cell.bl;
   if (num && typeof(sheetobj.borderstyles[num]) !== "undefined") stylestr+="border-left:"+sheetobj.borderstyles[num]+";";

   if (cell.comment) {
      result.title = cell.comment;
      if (context.showGrid) {
         if (context.commentClassName) {
            result.className = (result.className ? result.className+" " : "") + context.commentClassName;
            }
         stylestr+=context.commentCSS;
         }
      else {
         if (context.commentNoGridClassName) {
            result.className = (result.className ? result.className+" " : "") + context.commentNoGridClassName;
            }
         stylestr+=context.commentNoGridCSS;
         }
      }

   if (cell.readonly) {
      if (!cell.comment) {
         result.title = context.readonlyComment;
         }
      if (context.showGrid) {
         if (context.readonlyClassName) {
            result.className = (result.className ? result.className+" " : "") + context.readonlyClassName;
            }
         stylestr+=context.readonlyCSS;
         }
      else {
         if (context.readonlyNoGridClassName) {
            result.className = (result.className ? result.className+" " : "") + context.readonlyNoGridClassName;
            }
         stylestr+=context.readonlyNoGridCSS;
         }
      }

   result.style.cssText=stylestr;

   //!!!!!!!!!
   // NOTE: csss and cssc are not supported yet.
   // csss needs to be parsed into pieces to override just the attributes specified, not all with assignment to cssText.
   // cssc just needs to set the className.

   t = context.highlights[coord];
   if (t) { // this is a highlit cell: Override style appropriately
      if (t=="cursor") t += context.cursorsuffix; // cursor can take alternative forms
      if (context.highlightTypes[t].className) {
         result.className = (result.className ? result.className+" " : "") + context.highlightTypes[t].className;
         }
      SocialCalc.setStyles(result, context.highlightTypes[t].style);
      }

   // If hidden column, display: none.
   if (sheetobj.colattribs.hide[SocialCalc.rcColname(colnum)] == "yes") {
      result.style.cssText+=";display:none";
      }

   // If hidden row, display: none.
   if (sheetobj.rowattribs.hide[rownum] == "yes") {
      result.style.cssText+=";display:none";
      }

   return result;
   }

SocialCalc.CoordInPane = function(context, coord, rowpane, colpane) {
   var coordToCR = context.coordToCR[coord];
   if (!coordToCR || !coordToCR.row || !coordToCR.col) throw "Bad coordToCR for "+coord;
   return context.CellInPane(coordToCR.row, coordToCR.col, rowpane, colpane);
   }


SocialCalc.CellInPane = function(context, row, col, rowpane, colpane) {
   var panerowlimits = context.rowpanes[rowpane];
   var panecollimits = context.colpanes[colpane];
   if (!panerowlimits || !panecollimits) throw "CellInPane called with unknown panes "+rowpane+"/"+colpane;
   if (row < panerowlimits.first || row > panerowlimits.last) return false;
   if (col < panecollimits.first || col > panecollimits.last) return false;
   return true;
   }

SocialCalc.CreatePseudoElement = function() {
   return {style:{cssText:""}, innerHTML: "", className: ""};
   }


// *************************************
//
// Misc. functions:
//
// *************************************

SocialCalc.rcColname = function(c) {
   if (c > 702) c = 702; // maximum number of columns - ZZ
   if (c < 1) c = 1;
   var collow = (c - 1) % 26 + 65;
   var colhigh = Math.floor((c - 1) / 26);
   if (colhigh)
      return String.fromCharCode(colhigh + 64) + String.fromCharCode(collow);
   else
      return String.fromCharCode(collow);
   }

SocialCalc.letters = ["A","B","C","D","E","F","G","H","I","J","K","L","M",
                      "N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];

SocialCalc.crToCoord = function(c, r) {
   var result;
   if (c < 1) c = 1;
   if (c > 702) c = 702; // maximum number of columns - ZZ
   if (r < 1) r = 1;
   var collow = (c - 1) % 26;
   var colhigh = Math.floor((c - 1) / 26);
   if (colhigh)
      result = SocialCalc.letters[colhigh-1] + SocialCalc.letters[collow] + r;
   else
      result = SocialCalc.letters[collow] + r;
   return result;
   }

SocialCalc.coordToCol = {}; // too expensive to set in crToCoord since that is called so many times
SocialCalc.coordToRow = {};

SocialCalc.coordToCr = function(cr) {
   var c, i, ch;
   var r = SocialCalc.coordToRow[cr];
   if (r) return {row: r, col: SocialCalc.coordToCol[cr]};
   c=0;r=0;
   for (i=0; i<cr.length; i++) { // this was faster than using regexes; assumes well-formed
      ch = cr.charCodeAt(i);
      if (ch==36) ; // skip $'s
      else if (ch<=57) r = 10*r + ch-48;
      else if (ch>=97) c = 26*c + ch-96;
      else if (ch>=65) c = 26*c + ch-64;
      }
   SocialCalc.coordToCol[cr] = c;
   SocialCalc.coordToRow[cr] = r;
   return {row: r, col: c};

   }

SocialCalc.ParseRange = function(range) {
   var pos, cr, cr1, cr2;
   if (!range) range = "A1:A1"; // error return, hopefully benign
   range = range.toUpperCase();
   pos = range.indexOf(":");
   if (pos>=0) {
      cr = range.substring(0,pos);
      cr1 = SocialCalc.coordToCr(cr);
      cr1.coord = cr;
      cr = range.substring(pos+1);
      cr2 = SocialCalc.coordToCr(cr);
      cr2.coord = cr;
      }
   else {
      cr1 = SocialCalc.coordToCr(range);
      cr1.coord = range;
      cr2 = SocialCalc.coordToCr(range);
      cr2.coord = range;
      }
   return {cr1: cr1, cr2: cr2};
   }

SocialCalc.decodeFromSave = function(s) {
   if (typeof s != "string") return s;
   if (s.indexOf("\\")==-1) return s; // for performace reasons: replace nothing takes up time
   var r=s.replace(/\\c/g,":");
   r=r.replace(/\\n/g,"\n");
   return r.replace(/\\b/g,"\\");
   }

SocialCalc.decodeFromAjax = function(s) {
   if (typeof s != "string") return s;
   if (s.indexOf("\\")==-1) return s; // for performace reasons: replace nothing takes up time
   var r=s.replace(/\\c/g,":");
   r=r.replace(/\\n/g,"\n");
   r=r.replace(/\\e/g,"]]");
   return r.replace(/\\b/g,"\\");
   }

SocialCalc.encodeForSave = function(s) {
   if (typeof s != "string") return s;
   if (s.indexOf("\\")!=-1) // for performace reasons: replace nothing takes up time
      s=s.replace(/\\/g,"\\b");
   if (s.indexOf(":")!=-1)
      s=s.replace(/:/g,"\\c");
   if (s.indexOf("\n")!=-1)
      s=s.replace(/\n/g,"\\n");
   return s;
   }

//
// Returns estring where &, <, >, " are HTML escaped
// 
SocialCalc.special_chars = function(string) {

   if (/[&<>"]/.test(string)) { // only do "slow" replaces if something to replace
      string = string.replace(/&/g, "&amp;");
      string = string.replace(/</g, "&lt;");
      string = string.replace(/>/g, "&gt;");
      string = string.replace(/"/g, "&quot;");
      }
   return string;

   }

SocialCalc.Lookup = function(value, list) {

   for (i=0; i<list.length; i++) {
      if (list[i] > value) {
         if (i>0) return i-1;
         else return null;
         }
      }
   return list.length-1; // if all smaller, matches last

   }

//
// setStyles(element, cssText)
//
// Takes a pseudo style string (e.g., text-align must be textAlign) and sets
// the element's style value for each style name listed (leaving others unchanged).
// OK to call with null cssText.
//

SocialCalc.setStyles = function (element, cssText) {

   var parts, part, pos, name, value;

   if (!cssText) return;

   parts = cssText.split(";");
   for (part=0; part<parts.length; part++) {
      pos = parts[part].indexOf(":"); // find first colon (could be one in url)
      if (pos != -1) {
         name = parts[part].substring(0, pos);
         value = parts[part].substring(pos+1);
         if (name && value) { // if non-null name and value, set style
            element.style[name] = value;
            }
         }
//      namevalue = parts[part].split(":");
//      if (namevalue[0]) element.style[namevalue[0]] = namevalue[1];
      }

   }

//
// GetViewportInfo() - returns object with viewport width and height, and scroll offsets
//
// Flanagan, JavaScript, 5th Edition, page 276
//

SocialCalc.GetViewportInfo = function () {

   var result = {};

   if (window.innerWidth) { // all but IE
      result.width = window.innerWidth;
      result.height = window.innerHeight;
      result.horizontalScroll = window.pageXOffset;
      result.verticalScroll = window.pageYOffset;
      }
   else {
      if (document.documentElement && document.documentElement.clientWidth) {
         result.width = document.documentElement.clientWidth;
         result.height = document.documentElement.clientHeight;
         result.horizontalScroll = document.documentElement.scrollLeft;
         result.verticalScroll = document.documentElement.scrollTop;
         }
      else if (document.body.clientWidth) {
         result.width = document.body.clientWidth;
         result.height = document.body.clientHeight;
         result.horizontalScroll = document.body.scrollLeft;
         result.verticalScroll = document.body.scrollTop;
         }
      }

   return result;
   }

//
// GetElementPosition(element) - returns object with left and top position of the element in the document
//
// Goodman's JavaScript & DHTML Cookbook, 2nd Edition, page 415
//

SocialCalc.GetElementPosition = function (element) {

   var offsetLeft = 0;
   var offsetTop = 0;
   while (element) {
      if (SocialCalc.GetComputedStyle(element,'position')=='relative') break;
      offsetLeft+=element.offsetLeft;
      offsetTop+=element.offsetTop;
      element=element.offsetParent;
      }
   return {left:offsetLeft, top:offsetTop};

   }

//
// GetElementPositionWithScroll(element) - returns object with left and top position of the element in the document
//

SocialCalc.GetElementPositionWithScroll = function (element) {
  
   var rect = element.getBoundingClientRect();
   return {
      left:rect.left,
      right:rect.right,
      top:rect.top,
      bottom:rect.bottom,
      width:rect.width?rect.width:rect.right-rect.left,
      height:rect.height?rect.height:rect.bottom-rect.top
      };

   }

//
// GetElementFixedParent(element) - checks whether element has a parent with position:fixed
//

SocialCalc.GetElementFixedParent = function(element) {

   while (element) {
      if (element.tagName=="HTML") break;
      if (SocialCalc.GetComputedStyle(element,'position')=='fixed') return element;
      element=element.parentNode;
      }
      return false;

   }

//
// GetComputedStyle(element, style) - returns computed style value
//
// http://blog.stchur.com/2006/06/21/css-computed-style/
//

SocialCalc.GetComputedStyle = function (element, style) {

   var computedStyle;
   if (typeof element.currentStyle != 'undefined') { // IE
      computedStyle = element.currentStyle;
      }
   else {
      computedStyle = document.defaultView.getComputedStyle(element, null);
      }
   return computedStyle[style];

   }

//
// LookupElement(element, array) - returns array element which is an object with "element" of element
//

SocialCalc.LookupElement = function (element, array) {

   var i;
   for (i=0; i<array.length; i++) {
      if (array[i].element == element) return array[i];
      }
   return null;

   }

//
// AssignID(obj, element, id) - Optionally assigns an ID with a prefix to the element
//

SocialCalc.AssignID = function (obj, element, id) {

   if (obj.idPrefix) { // Object must have a non-empty idPrefix attribute
      element.id = obj.idPrefix + id;
      }

   }

//
// SocialCalc.GetCellContents(sheetobj, coord)
//
// Returns the contents (value, formula, constant, etc.) of a cell
// with appropriate prefix ("'", "=", etc.)
//

SocialCalc.GetCellContents = function(sheetobj, coord) {

   var result = "";
   var cellobj = sheetobj.cells[coord];
   if (cellobj) {
      switch (cellobj.datatype) {
         case "v":
            result = cellobj.datavalue+"";
            break;
         case "t":
            result = "'"+cellobj.datavalue;
            break;
         case "f":
            result = "="+cellobj.formula;
            break;
         case "c":
            result = cellobj.formula;
            break;
         default:
            break;
         }
      }

   return result;

   }

//
// Routines translated from the SocialCalc 1.1.0 Perl code:
//
// (Makes use of the FormatNumber JavaScript code translated from the Perl.)
//

//
// displayvalue = FormatValueForDisplay(sheetobj, value, cr, linkstyle)
//
// Returns a string, in HTML, for the contents of a cell.
//
// The value is a either numeric or text, the cr is the coord of the cell
// (its cell properties are used to determine formatting), and linkstyle
// is a value passed to wiki-text expansion routines specifying the
// purpose of the rendering so, for example, links can be rendered differently
// during edit than with plain HTML.
//

SocialCalc.FormatValueForDisplay = function(sheetobj, value, cr, linkstyle) {

   var valueformat, has_parens, has_commas, valuetype, valuesubtype;
   var displayvalue;

   var sheetattribs=sheetobj.attribs;
   var scc=SocialCalc.Constants;

   var cell=sheetobj.cells[cr];

   if (!cell) { // get an empty cell if not there
      cell=new SocialCalc.Cell(cr);
      }

   displayvalue = value;

   valuetype = cell.valuetype || ""; // get type of value to determine formatting
   valuesubtype = valuetype.substring(1);
   valuetype = valuetype.charAt(0);

   if (cell.errors || valuetype=="e") {
      displayvalue = cell.errors || valuesubtype || "Error in cell";
      return displayvalue;
      }

   if (valuetype=="t") {
      valueformat = sheetobj.valueformats[cell.textvalueformat-0] || sheetobj.valueformats[sheetattribs.defaulttextvalueformat-0] || "";
      if (valueformat=="formula") {
         if (cell.datatype=="f") {
            displayvalue = SocialCalc.special_chars("="+cell.formula) || "&nbsp;";
            }
         else if (cell.datatype=="c") {
            displayvalue = SocialCalc.special_chars("'"+cell.formula) || "&nbsp;";
            }
         else {
            displayvalue = SocialCalc.special_chars("'"+displayvalue) || "&nbsp;";
            }
         return displayvalue;
         }
      displayvalue = SocialCalc.format_text_for_display(displayvalue, cell.valuetype, valueformat, sheetobj, linkstyle, cell.nontextvalueformat);
      }

   else if (valuetype=="n") {
      valueformat = cell.nontextvalueformat;
      if (valueformat==null || valueformat=="") { //
         valueformat = sheetattribs.defaultnontextvalueformat;
         }
      valueformat = sheetobj.valueformats[valueformat-0];
      if (valueformat==null || valueformat=="none") {
         valueformat = "";
         }
      if (valueformat=="formula") {
         if (cell.datatype=="f") {
            displayvalue = SocialCalc.special_chars("="+cell.formula) || "&nbsp;";
            }
         else if (cell.datatype=="c") {
            displayvalue = SocialCalc.special_chars("'"+cell.formula) || "&nbsp;";
            }
         else {
            displayvalue = SocialCalc.special_chars("'"+displayvalue) || "&nbsp;";
            }
         return displayvalue;
         }
      else if (valueformat=="forcetext") {
         if (cell.datatype=="f") {
            displayvalue = SocialCalc.special_chars("="+cell.formula) || "&nbsp;";
            }
         else if (cell.datatype=="c") {
            displayvalue = SocialCalc.special_chars(cell.formula) || "&nbsp;";
            }
         else {
            displayvalue = SocialCalc.special_chars(displayvalue) || "&nbsp;";
            }
         return displayvalue;
         }

      displayvalue = SocialCalc.format_number_for_display(displayvalue, cell.valuetype, valueformat);

      }
   else { // unknown type - probably blank
      displayvalue = "&nbsp;";
      }

   return displayvalue;

   }


//
// displayvalue = format_text_for_display(rawvalue, valuetype, valueformat, sheetobj, linkstyle, nontextvalueformat)
//

SocialCalc.format_text_for_display = function(rawvalue, valuetype, valueformat, sheetobj, linkstyle, nontextvalueformat) {

   var valueformat, valuesubtype, dvsc, dvue, textval;
   var displayvalue;

   valuesubtype = valuetype.substring(1);

   displayvalue = rawvalue;

   if (valueformat=="none" || valueformat==null) valueformat="";
   if (!/^(text-|custom|hidden)/.test(valueformat)) valueformat="";
   if (valueformat=="" || valueformat=="General") { // determine format from type
      if (valuesubtype=="h") valueformat="text-html";
      if (valuesubtype=="w" || valuesubtype=="r") valueformat="text-wiki";
      if (valuesubtype=="l") valueformat="text-link";
      if (!valuesubtype) valueformat="text-plain";
      }
   if (valueformat=="text-html") { // HTML - output as it as is
      ;
      }
   else if (SocialCalc.Callbacks.expand_wiki && /^text-wiki/.test(valueformat)) { // do general wiki markup
      displayvalue = SocialCalc.Callbacks.expand_wiki(displayvalue, sheetobj, linkstyle, valueformat);
      }
   else if (valueformat=="text-wiki") { // wiki text
      displayvalue = (SocialCalc.Callbacks.expand_markup
                      && SocialCalc.Callbacks.expand_markup(displayvalue, sheetobj, linkstyle)) || // do old wiki markup
                     SocialCalc.special_chars("wiki-text:"+displayvalue);
      }
   else if (valueformat=="text-url") { // text is a URL for a link
      dvsc = SocialCalc.special_chars(displayvalue);
      dvue = encodeURI(displayvalue);
      displayvalue = '<a href="'+dvue+'">'+dvsc+'</a>';
      }
   else if (valueformat=="text-link") { // more extensive link capabilities for regular web links
      displayvalue = SocialCalc.expand_text_link(displayvalue, sheetobj, linkstyle, valueformat);
      }
   else if (valueformat=="text-image") { // text is a URL for an image
      dvue = encodeURI(displayvalue);
      displayvalue = '<img src="'+dvue+'">';
      }
   else if (valueformat.substring(0,12)=="text-custom:") { // construct a custom text format: @r = text raw, @s = special chars, @u = url encoded
      dvsc = SocialCalc.special_chars(displayvalue); // do special chars
      dvsc = dvsc.replace(/  /g, "&nbsp; "); // keep multiple spaces
      dvsc = dvsc.replace(/\n/g, "<br>");  // keep line breaks
      dvue = encodeURI(displayvalue);
      textval={};
      textval.r = displayvalue;
      textval.s = dvsc;
      textval.u = dvue;
      displayvalue = valueformat.substring(12); // remove "text-custom:"
      displayvalue = displayvalue.replace(/@(r|s|u)/g, function(a,c){return textval[c];}); // replace placeholders
      }
   else if (valueformat.substring(0,6)=="custom") { // custom
      displayvalue = SocialCalc.special_chars(displayvalue); // do special chars
      displayvalue = displayvalue.replace(/  /g, "&nbsp; "); // keep multiple spaces
      displayvalue = displayvalue.replace(/\n/g, "<br>"); // keep line breaks
      displayvalue += " (custom format)";
      }
   else if (valueformat=="hidden") {
      displayvalue = "&nbsp;";
      }
   else if (nontextvalueformat != null && nontextvalueformat != "" && sheetobj.valueformats[nontextvalueformat-0] != "none" && sheetobj.valueformats[nontextvalueformat-0] != "" ) {
      valueformat = sheetobj.valueformats[nontextvalueformat];
      displayvalue = SocialCalc.format_number_for_display(rawvalue, valuetype, valueformat);
      }
   else { // plain text
      displayvalue = SocialCalc.special_chars(displayvalue); // do special chars
      displayvalue = displayvalue.replace(/  /g, "&nbsp; "); // keep multiple spaces
      displayvalue = displayvalue.replace(/\n/g, "<br>"); // keep line breaks
      }

   return displayvalue;

   }


//
// displayvalue = format_number_for_display(rawvalue, valuetype, valueformat)
//

SocialCalc.format_number_for_display = function(rawvalue, valuetype, valueformat) {

   var value, valuesubtype;
   var scc = SocialCalc.Constants;

   value = rawvalue-0;

   valuesubtype = valuetype.substring(1);

   if (valueformat=="Auto" || valueformat=="") { // cases with default format
      if (valuesubtype=="%") { // will display a % character
         valueformat = scc.defaultFormatp;
         }
      else if (valuesubtype=='$') {
         valueformat = scc.defaultFormatc;
         }
      else if (valuesubtype=='dt') {
         valueformat = scc.defaultFormatdt;
         }
      else if (valuesubtype=='d') {
         valueformat = scc.defaultFormatd;
         }
      else if (valuesubtype=='t') {
         valueformat = scc.defaultFormatt;
         }
      else if (valuesubtype=='l') {
         valueformat = 'logical';
         }
      else {
         valueformat = "General";
         }
      }

   if (valueformat=="logical") { // do logical format
      return value ? scc.defaultDisplayTRUE : scc.defaultDisplayFALSE;
      }

   if (valueformat=="hidden") { // do hidden format
      return "&nbsp;";
      }

   // Use format

   return SocialCalc.FormatNumber.formatNumberWithFormat(rawvalue, valueformat, "");

   }

//
// valueinfo = DetermineValueType(rawvalue)
//
// Takes a value and looks for special formatting like $, %, numbers, etc.
// Returns the value as a number or string and the type as {value: value, type: type}.
// Tries to follow the spec for spreadsheet function VALUE(v).
//

SocialCalc.DetermineValueType = function(rawvalue) {

   var value = rawvalue + "";
   var type = "t";
   var tvalue, matches, year, hour, minute, second, denom, num, intgr, constr;

   tvalue = value.replace(/^\s+/, ""); // remove leading and trailing blanks
   tvalue = tvalue.replace(/\s+$/, "");

   if (value.length==0) {
      type = "";
      }
   else if (value.match(/^\s+$/)) { // just blanks
      ; // leave type "t"
      }
   else if (tvalue.match(/^[-+]?\d*(?:\.)?\d*(?:[eE][-+]?\d+)?$/)) { // general number, including E
      value = tvalue - 0; // try converting to number
      if (isNaN(value)) { // leave alone - catches things like plain "-"
         value = rawvalue + "";
         }
      else {
         type = "n";
         }
      }
   else if (tvalue.match(/^[-+]?\d*(?:\.)?\d*\s*%$/)) { // percent form: 15.1%
      value = (tvalue.slice(0, -1) - 0) / 100; // convert and scale
      type = "n%";
      }
   else if (tvalue.match(/^[-+]?\$\s*\d*(?:\.)?\d*\s*$/) && tvalue.match(/\d/)) { // $ format: $1.49
      value = tvalue.replace(/\$/, "") - 0;
      type = "n$";
      }
   else if (tvalue.match(/^[-+]?(\d*,\d*)+(?:\.)?\d*$/)) { // number format ignoring commas: 1,234.49
      value = tvalue.replace(/,/g, "") - 0;
      type = "n";
      }
   else if (tvalue.match(/^[-+]?(\d*,\d*)+(?:\.)?\d*\s*%$/)) { // % with commas: 1,234.49%
      value = (tvalue.replace(/[%,]/g, "") - 0) / 100;
      type = "n%";
      }
   else if (tvalue.match(/^[-+]?\$\s*(\d*,\d*)+(?:\.)?\d*$/) && tvalue.match(/\d/)) { // $ and commas: $1,234.49
      value = tvalue.replace(/[\$,]/g, "") - 0;
      type = "n$";
      }
   else if (matches=value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{1,4})\s*$/)) { // MM/DD/YYYY, MM/DD/YYYY
      year = matches[3] - 0;
      year = year < 1000 ? year + 2000 : year;
      value = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(year, matches[1]-0, matches[2]-0)-2415019;
      type = "nd";
      }
   else if (matches=value.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s*$/)) { // YYYY-MM-DD, YYYY/MM/DD
      year = matches[1]-0;
      year = year < 1000 ? year + 2000 : year;
      value = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(year, matches[2]-0, matches[3]-0)-2415019;
      type = "nd";
      }
   else if (matches=value.match(/^(\d{1,2}):(\d{1,2})\s*$/)) { // HH:MM
      hour = matches[1]-0;
      minute = matches[2]-0;
      if (hour < 24 && minute < 60) {
         value = hour/24 + minute/(24*60);
         type = "nt";
         }
      }
   else if (matches=value.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s*$/)) { // HH:MM:SS
      hour = matches[1]-0;
      minute = matches[2]-0;
      second = matches[3]-0;
      if (hour < 24 && minute < 60 && second < 60) {
         value = hour/24 + minute/(24*60) + second/(24*60*60);
         type = "nt";
         }
      }
   else if (matches=value.match(/^\s*([-+]?\d+) (\d+)\/(\d+)\s*$/)) { // 1 1/2
      intgr = matches[1]-0;
      num = matches[2]-0;
      denom = matches[3]-0;
      if (denom && denom > 0) {
         value = intgr + (intgr < 0 ? -num/denom : num/denom);
         type = "n";
         }
      }
   else if (constr=SocialCalc.InputConstants[value.toUpperCase()]) { // special constants, like "false" and #N/A
      num = constr.indexOf(",");
      value = constr.substring(0,num)-0;
      type = constr.substring(num+1);
      }
   else if (tvalue.length > 7 && tvalue.substring(0,7).toLowerCase()=="http://") { // URL
      value = tvalue;
      type = "tl";
      }
   else if (tvalue.match(/<([A-Z][A-Z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/i)) { // HTML
      value = tvalue;
      type = "th";
      }

   return {value: value, type: type};

   }

SocialCalc.InputConstants = { // strings that turn into constants for SocialCalc.DetermineValueType
      "TRUE": "1,nl", "FALSE": "0,nl", "#N/A": "0,e#N/A", "#NULL!": "0,e#NULL!", "#NUM!": "0,e#NUM!",
      "#DIV/0!": "0,e#DIV/0!", "#VALUE!": "0,e#VALUE!", "#REF!": "0,e#REF!", "#NAME?": "0,e#NAME?"};

//
// result = default_expand_markup(displayvalue, sheetobj, linkstyle)
//
// Processes wiki-text -- this is a placeholder.
// Reference to here in SocialCalc.expand_markup should be replaced by application-specific routine.
//

SocialCalc.default_expand_markup = function(displayvalue, sheetobj, linkstyle) {

   var result = displayvalue;

   result = SocialCalc.special_chars(result); // do special chars
   result = result.replace(/  /g, "&nbsp; "); // keep multiple spaces
   result = result.replace(/\n/g, "<br>"); // keep line breaks

   return result; // do very little by default

   result = result.replace(/('*)'''(.*?)'''/g, "$1<b>$2<\/b>"); // Wiki-style bold/italics
   result = result.replace(/''(.*?)''/g, "<i>$1<\/i>");

   return result;

   }


//
// result = SocialCalc.expand_text_link(displayvalue, sheetobj, linkstyle, valueformat)
//
// Parses link text (URL, descriptions, pagenames, workspace names) and returns HTML
//

SocialCalc.expand_text_link = function(displayvalue, sheetobj, linkstyle, valueformat) {

   var desc, tb, str;

   var scc = SocialCalc.Constants;

   var url = "";
   var parts = SocialCalc.ParseCellLinkText(displayvalue+"");

   if (parts.desc) {
      desc = SocialCalc.special_chars(parts.desc);
      }
   else {
      desc = parts.pagename ? scc.defaultPageLinkFormatString : scc.defaultLinkFormatString;
      }

   if (displayvalue.length > 7 && displayvalue.substring(0,7).toLowerCase()=="http://" 
      && displayvalue.charAt(displayvalue.length-1)!=">") {
      desc = desc.substring(7); // remove http:// unless explicit
      }

   tb = (parts.newwin || !linkstyle) ? ' target="_blank"' : "";

   if (parts.pagename) {
      if (SocialCalc.Callbacks.MakePageLink) {
         url = SocialCalc.Callbacks.MakePageLink(parts.pagename, parts.workspacename, linkstyle, valueformat);
         }
//      else if (parts.workspace) {
//         url = "/" + encodeURI(parts.workspace) + "/" + encodeURI(parts.pagename);
//         }
//      else {
//         url = parts.pagename;
//         }
      }
   else {
      url = encodeURI(parts.url);
      }
   str = '<a href="' + url + '"' + tb + '>' + desc + '</a>';

   return str;

   }


//
// result = SocialCalc.ParseCellLinkText(str)
//
// Given: url = http://www.someurl.com/more, desc = Some descriptive text
//
// Takes the following:
//
//    url
//    <url>
//    desc<url>
//    "desc"<url>
//    <<>> instead of <> => target="_blank" (new window)
//
//    [page name]
//    "desc"[page name]
//    desc[page name]
//    {workspace name [page name]}
//    "desc"{workspace name [page name]}
//    [[]] instead of [] => target="_blank" (new window)
//
//
// Returns: {url: url, desc: desc, newwin: t/f, pagename: pagename, workspace: workspace}
//

SocialCalc.ParseCellLinkText = function(str) {

   var result = {url: "", desc: "", newwin: false, pagename: "", workspace: ""};

   var pageform = false;
   var urlend = str.length - 1;
   var descstart = 0;
   var lastlt = str.lastIndexOf("<");
   var lastbrkt = str.lastIndexOf("[");
   var lastbrace = str.lastIndexOf("{");
   var descend = -1;

   if ((str.charAt(urlend) != ">" || lastlt == -1)
         && (str.charAt(urlend) != "]" || lastbrkt == -1)
         && (str.charAt(urlend) != "}" || str.charAt(urlend-1) != "]" || 
             lastbrace == -1 || lastbrkt == -1 || lastbrkt < lastbrace)) { // plain url
      urlend++;
      descend = urlend;
      }
   else { // some markup
      if (str.charAt(urlend)==">") { // url form
         descend = lastlt - 1;
         if (lastlt > 0 && str.charAt(descend) == "<" && str.charAt(urlend-1) == ">") {
            descend--;
            urlend--;
            result.newwin = true;
            }
         }

      else if (str.charAt(urlend)=="]") { // plain page form
         descend = lastbrkt - 1;
         pageform = true;
         if (lastbrkt > 0 && str.charAt(descend) == "[" && str.charAt(urlend-1) == "]") {
            descend--;
            urlend--;
            result.newwin = true;
            }
         }

      else if (str.charAt(urlend)=="}") { // page and workspace form
         descend = lastbrace - 1;
         pageform = true;
         wsend = lastbrkt;
         urlend--;
         if (lastbrkt > 0 && str.charAt(lastbrkt-1) == "[" && str.charAt(urlend-1) == "]") {
            wsend = lastbrkt-1;
            urlend--;
            result.newwin = true;
            }
         if (str.charAt(wsend-1)==" ") { // trim trailing space in workspace name
            wsend--;
            }
         result.workspace = str.substring(lastbrace+1, wsend) || "";
         }

      if (str.charAt(descend)==" ") { // trim trailing space on desc
         descend--;
         }

      if (str.charAt(descstart) == '"' && str.charAt(descend) == '"') {
         descstart++;
         descend--;
         }
      }

   if (pageform) {
      result.pagename = str.substring(lastbrkt+1, urlend) || "";
      }
   else {
      result.url = str.substring(lastlt+1, urlend) || "";
      }

   if (descend >= descstart) {
      result.desc = str.substring(descstart, descend+1);
      }

   return result;

   }


//
// result = SocialCalc.ConvertSaveToOtherFormat(savestr, outputformat, dorecalc)
//
// Returns a string in the specificed format: "scsave", "html", "csv", "tab" (tab delimited)
// If dorecalc is true, performs a recalc after loading (NO: obsolete!).
//

SocialCalc.ConvertSaveToOtherFormat = function(savestr, outputformat, dorecalc) {

   var sheet, context, clipextents, div, ele, row, col, cr, cell, str;

   var result = "";

   if (outputformat == "scsave") {
      return savestr;
      }

   if (savestr == "") {
      return "";
      }

   sheet = new SocialCalc.Sheet();
   sheet.ParseSheetSave(savestr);

   if (dorecalc) {
      // no longer supported as of 9/10/08
      // Recalc is now async, so can't do it this way
      throw("SocialCalc.ConvertSaveToOtherFormat: Not doing recalc.");
      }

   if (sheet.copiedfrom) {
      clipextents = SocialCalc.ParseRange(sheet.copiedfrom);
      }
   else {
      clipextents = {cr1: {row: 1, col: 1}, cr2: {row: sheet.attribs.lastrow, col: sheet.attribs.lastcol}};
      }

   if (outputformat == "html") {
      context=new SocialCalc.RenderContext(sheet);
      if (sheet.copiedfrom) {
         context.rowpanes[0] = {first: clipextents.cr1.row, last: clipextents.cr2.row};
         context.colpanes[0] = {first: clipextents.cr1.col, last: clipextents.cr2.col};
         }
      div = document.createElement("div");
      ele = context.RenderSheet(null, context.defaultHTMLlinkstyle);
      div.appendChild(ele);
      delete context;
      delete sheet;
      result = div.innerHTML;
      delete ele;
      delete div;
      return result;
      }

   for (row = clipextents.cr1.row; row <= clipextents.cr2.row; row++) {
      for (col = clipextents.cr1.col; col <= clipextents.cr2.col; col++) {
         cr = SocialCalc.crToCoord(col, row);
         cell = sheet.GetAssuredCell(cr);

         if (cell.errors) {
            str = cell.errors;
            }
         else {
            str = cell.datavalue+""; // get value as text
            }

         if (outputformat == "csv") {
            if (str.indexOf('"')!=-1) {
               str = str.replace(/"/g, '""'); // double quotes
               }
            if (/[, \n"]/.test(str)) {
               str = '"' + str + '"'; // add quotes
               }
            if (col>clipextents.cr1.col) {
               str = "," + str; // add commas
               }
            }
         else if (outputformat == "tab") {
            if (str.indexOf('\n')!=-1) { // if multiple lines
               if (str.indexOf('"')!=-1) {
                  str = str.replace(/"/g, '""'); // double quotes
                  }
               str = '"' + str + '"'; // add quotes
               }
            if (col>clipextents.cr1.col) {
               str = "\t" + str; // add tabs
               }
            }
         result += str;
         }
      result += "\n";
      }

   return result;

   }


//
// result = SocialCalc.ConvertOtherFormatToSave(inputstr, inputformat)
//
// Returns a string converted from the specified format: "scsave", "csv", "tab" (tab delimited)
//

SocialCalc.ConvertOtherFormatToSave = function(inputstr, inputformat) {

   var sheet, context, lines, i, line, value, inquote, j, ch, values, row, col, cr, maxc;

   var result = "";

   var AddCell = function() {
      col++;
      if (col>maxc) maxc = col;
      cr = SocialCalc.crToCoord(col, row);
      SocialCalc.SetConvertedCell(sheet, cr, value);
      value = "";
      }

   if (inputformat == "scsave") {
      return inputstr;
      }

   sheet = new SocialCalc.Sheet();

   lines = inputstr.split(/\r\n|\n/);

   maxc = 0;
   if (inputformat == "csv") {
      row = 0;
      inquote = false;
      for (i=0; i<lines.length; i++) {
         if (i==lines.length-1 && lines[i]=="") { // extra null line - ignore
            break;
            }
         if (inquote) { // if inquote, just continue from where left off
            value += "\n";
            }
         else { // otherwise next row
            value = "";
            row++;
            col = 0;
            }
         line = lines[i];
         for (j=0; j<line.length; j++) {
            ch = line.charAt(j);
            if (ch == '"') {
               if (inquote) {
                  if (j<line.length-1 && line.charAt(j+1) == '"') { // double quotes
                     j++; // skip the second one
                     value += '"'; // add one quote
                     }
                  else {
                     inquote = false;
                     if (j==line.length-1) { // at end of line
                        AddCell();
                        }
                     }
                  }
               else {
                  inquote = true;
                  }
               continue;
               }
            if (ch == "," && !inquote) {
               AddCell();
               }
            else {
               value += ch;
               }
            if (j==line.length-1 && !inquote) {
               AddCell();
               }
            }
         }
      if (maxc>0) {
         sheet.attribs.lastrow = row;
         sheet.attribs.lastcol = maxc;
         result = sheet.CreateSheetSave("A1:"+SocialCalc.crToCoord(maxc, row));
         }
      }

   if (inputformat == "tab") {
      row = 0;
      inquote = false;
      for (i=0; i<lines.length; i++) {
         if (i==lines.length-1 && lines[i]=="") { // extra null line - ignore
            break;
            }
         if (inquote) { // if inquote, just continue from where left off
            value += "\n";
            }
         else { // otherwise next row
            value = "";
            row++;
            col = 0;
            }
         line = lines[i];
         for (j=0; j<line.length; j++) {
            ch = line.charAt(j);
            if (ch == '"') {
               if (inquote) {
                  if (j<line.length-1) {
                     if (line.charAt(j+1) == '"') { // double quotes
                        j++; // skip the second one
                        value += '"'; // add one quote
                        }
                     else if (line.charAt(j+1) == '\t') { // end of quoted item
                        j++;
                        inquote = false;
                        AddCell();
                        }
                     }
                  else { // at end of line
                     inquote = false;
                     AddCell();
                     }
                  continue;
                  }
               if (value=="") { // quote at start of item
                  inquote = true;
                  continue;
                  }
               }
            if (ch == "\t" && !inquote) {
               AddCell();
               }
            else {
               value += ch;
               }
            if (j==line.length-1 && !inquote) {
               AddCell();
               }
            }
         }
      if (maxc>0) {
         sheet.attribs.lastrow = row;
         sheet.attribs.lastcol = maxc;
         result = sheet.CreateSheetSave("A1:"+SocialCalc.crToCoord(maxc, row));
         }
      }

   return result;

   }

//
// SocialCalc.SetConvertedCell(sheet, cr, rawvalue)
//
// Sets the cell cr with a value and type determined from rawvalue
//

SocialCalc.SetConvertedCell = function(sheet, cr, rawvalue) {

   var cell, value;

   cell = sheet.GetAssuredCell(cr);

   value = SocialCalc.DetermineValueType(rawvalue);

   if (value.type == 'n' && value.value == rawvalue) { // check that we don't need "constant" to remember original value
      cell.datatype = "v";
      cell.valuetype = "n";
      cell.datavalue = value.value;
      }
   else if (value.type.charAt(0) == 't') { // text of some sort but left unchanged
      cell.datatype = "t";
      cell.valuetype = value.type;
      cell.datavalue = value.value;
      }
   else { // special number types
      cell.datatype = "c";
      cell.valuetype = value.type;
      cell.datavalue = value.value;
      cell.formula = rawvalue;
      }

   }

