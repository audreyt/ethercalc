//
// SocialCalcTableEditor
//
/*
// The code module of the SocialCalc package that displays a scrolling grid with panes
// and handles keyboard and mouse I/O.
//
// (c) Copyright 2008, 2009, 2010 Socialtext, Inc.
// All Rights Reserved.
//
*/

/*

LEGAL NOTICES REQUIRED BY THE COMMON PUBLIC ATTRIBUTION LICENSE:

EXHIBIT A. Common Public Attribution License Version 1.0.

The contents of this file are subject to the Common Public Attribution License Version 1.0 (the 
"License"); you may not use this file except in compliance with the License. You may obtain a copy 
of the License at http://socialcalc.org. The License is based on the Mozilla Public License Version 1.1 but 
Sections 14 and 15 have been added to cover use of software over a computer network and provide for 
limited attribution for the Original Developer. In addition, Exhibit A has been modified to be 
consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY 
KIND, either express or implied. See the License for the specific language governing rights and 
limitations under the License.

The Original Code is SocialCalc JavaScript TableEditor.

The Original Developer is the Initial Developer.

The Initial Developer of the Original Code is Socialtext, Inc. All portions of the code written by 
Socialtext, Inc., are Copyright (c) Socialtext, Inc. All Rights Reserved.

Contributor: Dan Bricklin.


EXHIBIT B. Attribution Information

When the TableEditor is producing and/or controlling the display the Graphic Image must be
displayed on the screen visible to the user in a manner comparable to that in the 
Original Code. The Attribution Phrase must be displayed as a "tooltip" or "hover-text" for
that image. The image must be linked to the Attribution URL so as to access that page
when clicked. If the user interface includes a prominent "about" display which includes
factual prominent attribution in a form similar to that in the "about" display included
with the Original Code, including Socialtext copyright notices and URLs, then the image
need not be linked to the Attribution URL but the "tool-tip" is still required.

Attribution Copyright Notice:

 Copyright (C) 2010 Socialtext, Inc.
 All Rights Reserved.

Attribution Phrase (not exceeding 10 words): SocialCalc

Attribution URL: http://www.socialcalc.org/xoattrib

Graphic Image: The contents of the sc-logo.gif file in the Original Code or
a suitable replacement from http://www.socialcalc.org/licenses specified as
being for SocialCalc.

Display of Attribution Information is required in Larger Works which are defined 
in the CPAL as a work which combines Covered Code or portions thereof with code 
not governed by the terms of the CPAL.

*/

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

/*

See the comments in the main SocialCalc code module file of the SocialCalc package.

*/

   var SocialCalc;
   if (!SocialCalc) { // created here, too, in case load order is wrong, but main routines are required
      SocialCalc = {};
      }

// *************************************
//
// Table Editor class:
//
// *************************************

// Constructor:

SocialCalc.TableEditor = function(context) {

   var scc = SocialCalc.Constants;

   // Properties:

   this.context = context; // editing context
   this.toplevel = null; // top level HTML element for this table editor
   this.fullgrid = null; // rendered editing context

   this.noEdit = false; // if true, disable all edit UI and make read-only

   this.width = null;
   this.tablewidth = null;
   this.height = null;
   this.tableheight = null;

   this.inputBox = null;
   this.inputEcho = null;
   this.verticaltablecontrol = null;
   this.horizontaltablecontrol = null;

   this.logo = null;

   this.cellhandles = null;

   // Dynamic properties:

   this.timeout = null; // if non-null, timer id for position calculations
   this.busy = false; // true when executing command, calculating, etc.
   this.ensureecell = false; // if true, ensure ecell is visible after timeout
   this.deferredCommands = []; // commands to execute after busy, in form: {cmdstr: "cmds", saveundo: t/f}

   this.gridposition = null; // screen coords of full grid
   this.headposition = null; // screen coords of upper left of grid within header rows
   this.firstscrollingrow = null; // row number of top row in last (the scrolling) pane
   this.firstscrollingrowtop = null;  // position of top row in last (the scrolling) pane
   this.lastnonscrollingrow = null; // row number of last displayed row in last non-scrolling
                                    // pane, or zero (for thumb position calculations)
   this.lastvisiblerow = null; // used for paging down
   this.firstscrollingcol = null; // column number of top col in last (the scrolling) pane
   this.firstscrollingcolleft = null;  // position of top col in last (the scrolling) pane
   this.lastnonscrollingcol = null; // col number of last displayed column in last non-scrolling
                                    // pane, or zero (for thumb position calculations)
   this.lastvisiblecol = null; // used for paging right

   this.rowpositions = []; // screen positions of the top of some rows
   this.colpositions = []; // screen positions of the left side of some rows
   this.rowheight = []; // size in pixels of each row when last checked, or null/undefined, for page up
   this.colwidth = []; // size in pixels of each column when last checked, or null/undefined, for page left

   this.ecell = null; // either null or {coord: c, row: r, col: c}
   this.state = "start"; // the keyboard states: see EditorProcessKey

   this.workingvalues = {}; // values used during keyboard editing, etc.

   // Constants:

   this.imageprefix = scc.defaultImagePrefix; // URL prefix for images (e.g., "/images/sc")
   this.idPrefix = scc.defaultTableEditorIDPrefix;
   this.pageUpDnAmount = scc.defaultPageUpDnAmount; // number of rows to move cursor on PgUp/PgDn keys (numeric)

   // Callbacks

   // recalcFunction: if present, function(editor) {...}, called to do a recalc
   // Default (sheet.RecalcSheet) does all the right stuff.

   this.recalcFunction = function(editor) {
      if (editor.context.sheetobj.RecalcSheet) {
         editor.context.sheetobj.RecalcSheet(SocialCalc.EditorSheetStatusCallback, editor);
         }
      else return null;
      };

   // ctrlkeyFunction: if present, function(editor, charname) {...}, called to handle ctrl-V, etc., at top level
   // Returns true (pass through for continued processing) or false (stop processing this key).

   this.ctrlkeyFunction = function(editor, charname) {

      var ta, cell, position, cmd, sel, cliptext;

      switch (charname) {
         case "[ctrl-c]":
         case "[ctrl-x]":
            ta = editor.pasteTextarea;
            ta.value = "";
            cell=SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
            if (cell) {
               position = SocialCalc.GetElementPosition(cell.element);
               ta.style.left = (position.left-1)+"px";
               ta.style.top = (position.top-1)+"px";
               }
            if (editor.range.hasrange) {
               sel = SocialCalc.crToCoord(editor.range.left, editor.range.top)+
                  ":"+SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
               }
            else {
               sel = editor.ecell.coord;
               }

            // get what to copy to clipboard
            cliptext = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.CreateSheetSave(editor.context.sheetobj, sel), "tab");

            if (charname == "[ctrl-c]" || editor.noEdit || editor.ECellReadonly()) { // if copy or cut but in no edit
               cmd = "copy "+sel+" formulas";
               }
            else { // [ctrl-x]
               cmd = "cut "+sel+" formulas";
               }
            editor.EditorScheduleSheetCommands(cmd, true, false); // queue up command to put on SocialCalc clipboard

            ta.style.display = "block";
            ta.value = cliptext; // must follow "block" setting for Webkit
            ta.focus();
            ta.select();
            window.setTimeout(function() {
               var ta = editor.pasteTextarea;
               ta.blur();
               ta.style.display = "none";
               SocialCalc.KeyboardFocus();
               }, 200);

            return true;

         case "[ctrl-v]":
            if (editor.noEdit || editor.ECellReadonly()) return true; // not if no edit
            ta = editor.pasteTextarea;
            ta.value = "";
            cell=SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
            if (cell) {
               position = SocialCalc.GetElementPosition(cell.element);
               ta.style.left = (position.left-1)+"px";
               ta.style.top = (position.top-1)+"px";
               }
            ta.style.display = "block";
            ta.value = "";  // must follow "block" setting for Webkit
            ta.focus();
            window.setTimeout(function() {
               var ta = editor.pasteTextarea;
               var value = ta.value;
               ta.blur();
               ta.style.display = "none";
               var cmd = "";
               var clipstr = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "tab");
               value = value.replace(/\r\n/g, "\n");
               // pastes SocialCalc clipboard if did a Ctrl-C and contents still the same
               // Webkit adds an extra blank line, so need to allow for that
               if (value != clipstr && (value.length-clipstr.length!=1 || value.substring(0,value.length-1)!=clipstr)) {
                  cmd = "loadclipboard "+
                  SocialCalc.encodeForSave(SocialCalc.ConvertOtherFormatToSave(value, "tab")) + "\n";
                  }
               var cr;
               if (editor.range.hasrange) {
                  var clipsheet = new SocialCalc.Sheet();
                  clipsheet.ParseSheetSave(SocialCalc.Clipboard.clipboard);
                  var matches = clipsheet.copiedfrom.match(/(.+):(.+)/);
                  if (matches !== null && matches[1] === matches[2]) {
                    // copy one cell to selected range
                    cr = SocialCalc.crToCoord(editor.range.left, editor.range.top) +
                      ':' + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
                  } else {
                    cr = SocialCalc.crToCoord(editor.range.left, editor.range.top);
                  }
                  }
               else {
                  cr = editor.ecell.coord;
                  }
               cmd += "paste "+cr+" formulas";
               editor.EditorScheduleSheetCommands(cmd, true, false);
               SocialCalc.KeyboardFocus();
               }, 200);
            return true;

         case "[ctrl-z]":
            editor.EditorScheduleSheetCommands("undo", true, false);
            return false;

         case "[ctrl-s]": // !!!! temporary hack
            if (!SocialCalc.Constants.AllowCtrlS) break;
            window.setTimeout(
               function() {
                  var sheet = editor.context.sheetobj;
                  var cell = sheet.GetAssuredCell(editor.ecell.coord);
                  var ntvf = cell.nontextvalueformat ? sheet.valueformats[cell.nontextvalueformat-0] || "" : "";
                  var newntvf = window.prompt("Advanced Feature:\n\nCustom Numeric Format or Command", ntvf);
                  if (newntvf != null) { // not cancelled
                     if (newntvf.match(/^cmd:/)) {
                        cmd = newntvf.substring(4); // execute as command
                        }
                     else if (newntvf.match(/^edit:/)) {
                        cmd = newntvf.substring(5); // execute as command
                        if (SocialCalc.CtrlSEditor) {
                           SocialCalc.CtrlSEditor(cmd);
                           }
                        return;
                        }
                     else {
                        if (editor.range.hasrange) {
                           sel = SocialCalc.crToCoord(editor.range.left, editor.range.top)+
                              ":"+SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
                           }
                        else {
                          sel = editor.ecell.coord;
                           }
                        cmd = "set "+sel+" nontextvalueformat "+newntvf;
                        }
                     editor.EditorScheduleSheetCommands(cmd, true, false);
                     }
                  },
               200);
            return false;

         default:
            break;
            }
      return true;
      };

   // Set sheet's status callback:

   context.sheetobj.statuscallback = SocialCalc.EditorSheetStatusCallback;
   context.sheetobj.statuscallbackparams = this; // this object: the table editor object


   // StatusCallback: all values are called at appropriate times, add with unique name, delete when done
   //
   // Each value must be an object in the form of:
   //
   //    func: function(editor, status, arg, params) {...},
   //    params: params value to call func with
   //
   // The values for status and arg are:
   //
   //    all the SocialCalc RecalcSheet statuscallbacks, including:
   //
   //       calccheckdone, calclist length
   //       calcorder, {coord: coord, total: celllist length, count: count}
   //       calcstep, {coord: coord, total: calclist length, count: count}
   //       calcfinished, time in milliseconds
   //
   //    the command callbacks, like cmdstart and cmdend
   //    cmdendnorender
   //
   //    calcstart, null
   //    moveecell, new ecell coord
   //    rangechange, "coord:coord" or "coord" or ""
   //    specialkey, keyname ("[esc]")
   //

   this.StatusCallback = {};


   this.MoveECellCallback = {}; // all values are called with editor as arg; add with unique name, delete when done
   this.RangeChangeCallback = {}; // all values are called with editor as arg; add with unique name, delete when done
   this.SettingsCallbacks = {}; // See SocialCalc.SaveEditorSettings

   // Set initial cursor

   this.ecell = {coord: "A1", row: 1, col: 1};
   context.highlights[this.ecell.coord] = "cursor";

   // Initialize range data
   // Range has at least hasrange (true/false).
   // It may also have: anchorcoord, anchorrow, anchorcol, top, bottom, left, and right.

   this.range = {hasrange: false};

   // Initialize range2 data (used to show selections, such as for move)
   // Range2 has at least hasrange (true/false).
   // It may also have: top, bottom, left, and right.

   this.range2 = {hasrange: false};

   }

// Methods:

SocialCalc.TableEditor.prototype.CreateTableEditor = function(width, height) {return SocialCalc.CreateTableEditor(this, width, height);};
SocialCalc.TableEditor.prototype.ResizeTableEditor = function(width, height) {return SocialCalc.ResizeTableEditor(this, width, height);};

SocialCalc.TableEditor.prototype.SaveEditorSettings = function() {return SocialCalc.SaveEditorSettings(this);};
SocialCalc.TableEditor.prototype.LoadEditorSettings = function(str, flags) {return SocialCalc.LoadEditorSettings(this, str, flags);};

SocialCalc.TableEditor.prototype.EditorRenderSheet = function() {SocialCalc.EditorRenderSheet(this);};
SocialCalc.TableEditor.prototype.EditorScheduleSheetCommands = function(cmdstr, saveundo, ignorebusy) {SocialCalc.EditorScheduleSheetCommands(this, cmdstr, saveundo, ignorebusy);};
SocialCalc.TableEditor.prototype.ScheduleSheetCommands = function(cmdstr, saveundo) {
   this.context.sheetobj.ScheduleSheetCommands(cmdstr, saveundo);
   };
SocialCalc.TableEditor.prototype.SheetUndo = function() {
   this.context.sheetobj.SheetUndo();
   };
SocialCalc.TableEditor.prototype.SheetRedo = function() {
   this.context.sheetobj.SheetRedo();
   };
SocialCalc.TableEditor.prototype.EditorStepSet = function(status, arg) {SocialCalc.EditorStepSet(this, status, arg);};
SocialCalc.TableEditor.prototype.GetStatuslineString = function(status, arg, params) {return SocialCalc.EditorGetStatuslineString(this, status, arg, params);};

SocialCalc.TableEditor.prototype.EditorMouseRegister = function() {return SocialCalc.EditorMouseRegister(this);};
SocialCalc.TableEditor.prototype.EditorMouseUnregister = function() {return SocialCalc.EditorMouseUnregister(this);};
SocialCalc.TableEditor.prototype.EditorMouseRange = function(coord) {return SocialCalc.EditorMouseRange(this, coord);};

SocialCalc.TableEditor.prototype.EditorProcessKey = function(ch, e) {return SocialCalc.EditorProcessKey(this, ch, e);};
SocialCalc.TableEditor.prototype.EditorAddToInput = function(str, prefix) {return SocialCalc.EditorAddToInput(this, str, prefix);};
SocialCalc.TableEditor.prototype.DisplayCellContents = function() {return SocialCalc.EditorDisplayCellContents(this);};
SocialCalc.TableEditor.prototype.EditorSaveEdit = function(text) {return SocialCalc.EditorSaveEdit(this, text);};
SocialCalc.TableEditor.prototype.EditorApplySetCommandsToRange = function(cmdline, type) {return SocialCalc.EditorApplySetCommandsToRange(this, cmdline, type);};

SocialCalc.TableEditor.prototype.MoveECellWithKey = function(ch) {return SocialCalc.MoveECellWithKey(this, ch);};
SocialCalc.TableEditor.prototype.MoveECell = function(newcell) {return SocialCalc.MoveECell(this, newcell);};
SocialCalc.TableEditor.prototype.ReplaceCell = function(cell, row, col) {SocialCalc.ReplaceCell(this, cell, row, col);};
SocialCalc.TableEditor.prototype.UpdateCellCSS = function(cell, row, col) {SocialCalc.UpdateCellCSS(this, cell, row, col);};
SocialCalc.TableEditor.prototype.SetECellHeaders = function(selected) {SocialCalc.SetECellHeaders(this, selected);};
SocialCalc.TableEditor.prototype.EnsureECellVisible = function() {SocialCalc.EnsureECellVisible(this);};
SocialCalc.TableEditor.prototype.ECellReadonly = function(coord) {return SocialCalc.ECellReadonly(this, coord);};
SocialCalc.TableEditor.prototype.RangeAnchor = function(coord) {SocialCalc.RangeAnchor(this, coord);};
SocialCalc.TableEditor.prototype.RangeExtend = function(coord) {SocialCalc.RangeExtend(this, coord);};
SocialCalc.TableEditor.prototype.RangeRemove = function() {SocialCalc.RangeRemove(this);};
SocialCalc.TableEditor.prototype.Range2Remove = function() {SocialCalc.Range2Remove(this);};

SocialCalc.TableEditor.prototype.FitToEditTable = function() {SocialCalc.FitToEditTable(this);};
SocialCalc.TableEditor.prototype.CalculateEditorPositions = function() {SocialCalc.CalculateEditorPositions(this);};
SocialCalc.TableEditor.prototype.ScheduleRender = function() {SocialCalc.ScheduleRender(this);};
SocialCalc.TableEditor.prototype.DoRenderStep = function() {SocialCalc.DoRenderStep(this);};
SocialCalc.TableEditor.prototype.SchedulePositionCalculations = function() {SocialCalc.SchedulePositionCalculations(this);};
SocialCalc.TableEditor.prototype.DoPositionCalculations = function() {SocialCalc.DoPositionCalculations(this);};
SocialCalc.TableEditor.prototype.CalculateRowPositions = function(panenum, positions, sizes) {return SocialCalc.CalculateRowPositions(this,  panenum, positions, sizes);};
SocialCalc.TableEditor.prototype.CalculateColPositions = function(panenum, positions, sizes) {return SocialCalc.CalculateColPositions(this,  panenum, positions, sizes);};

SocialCalc.TableEditor.prototype.ScrollRelative = function(vertical, amount) {SocialCalc.ScrollRelative(this, vertical, amount);};
SocialCalc.TableEditor.prototype.ScrollRelativeBoth = function(vamount, hamount) {SocialCalc.ScrollRelativeBoth(this, vamount, hamount);};
SocialCalc.TableEditor.prototype.PageRelative = function(vertical, direction) {SocialCalc.PageRelative(this, vertical, direction);};
SocialCalc.TableEditor.prototype.LimitLastPanes = function() {SocialCalc.LimitLastPanes(this);};

SocialCalc.TableEditor.prototype.ScrollTableUpOneRow = function() {return SocialCalc.ScrollTableUpOneRow(this);};
SocialCalc.TableEditor.prototype.ScrollTableDownOneRow = function() {return SocialCalc.ScrollTableDownOneRow(this);};
SocialCalc.TableEditor.prototype.ScrollTableLeftOneCol = function() {return SocialCalc.ScrollTableLeftOneCol(this);};
SocialCalc.TableEditor.prototype.ScrollTableRightOneCol = function() {return SocialCalc.ScrollTableRightOneCol(this);};

// Functions:

SocialCalc.CreateTableEditor = function(editor, width, height) {

   var scc = SocialCalc.Constants;
   var AssignID = SocialCalc.AssignID;

   editor.toplevel = document.createElement("div");
   editor.toplevel.style.position = "relative";
   AssignID(editor, editor.toplevel, "toplevel");
   editor.width = width;
   editor.height = height;

   editor.griddiv = document.createElement("div");
   editor.tablewidth = Math.max(0, width - scc.defaultTableControlThickness);
   editor.tableheight = Math.max(0, height - scc.defaultTableControlThickness);
   editor.griddiv.style.width = editor.tablewidth+"px";
   editor.griddiv.style.height = editor.tableheight+"px";
   editor.griddiv.style.overflow = "hidden";
   editor.griddiv.style.cursor = "default";
   if (scc.cteGriddivClass) editor.griddiv.className = scc.cteGriddivClass;
   AssignID(editor, editor.griddiv, "griddiv");

   editor.FitToEditTable();

   editor.EditorRenderSheet();

   editor.griddiv.appendChild(editor.fullgrid);

   editor.verticaltablecontrol = new SocialCalc.TableControl(editor, true, editor.tableheight);
   editor.verticaltablecontrol.CreateTableControl();
   AssignID(editor, editor.verticaltablecontrol.main, "tablecontrolv");

   editor.horizontaltablecontrol = new SocialCalc.TableControl(editor, false, editor.tablewidth);
   editor.horizontaltablecontrol.CreateTableControl();
   AssignID(editor, editor.horizontaltablecontrol.main, "tablecontrolh");

   var table, tbody, tr, td, img, anchor, ta;

   table = document.createElement("table");
   editor.layouttable = table;
   table.cellSpacing = 0;
   table.cellPadding = 0;
   AssignID(editor, table, "layouttable");

   tbody = document.createElement("tbody");
   table.appendChild(tbody);

   tr = document.createElement("tr");
   tbody.appendChild(tr);
   td = document.createElement("td");
   td.appendChild(editor.griddiv);
   tr.appendChild(td);
   td = document.createElement("td");
   td.appendChild(editor.verticaltablecontrol.main);
   tr.appendChild(td);

   tr = document.createElement("tr");
   tbody.appendChild(tr);
   td = document.createElement("td");
   td.appendChild(editor.horizontaltablecontrol.main);
   tr.appendChild(td);

   td = document.createElement("td"); // logo display: Required by CPAL License for this code!
   td.style.background="url("+editor.imageprefix+"logo.gif) no-repeat center center";
   td.innerHTML = "<div style='cursor:pointer;font-size:1px;'><img src='"+editor.imageprefix+"1x1.gif' border='0' width='18' height='18'></div>";
   tr.appendChild(td);
   editor.logo = td;
   AssignID(editor, editor.logo, "logo");
   SocialCalc.TooltipRegister(td.firstChild.firstChild, "SocialCalc", null, editor.toplevel);

   editor.toplevel.appendChild(editor.layouttable);

   if (!editor.noEdit) {
      editor.inputEcho = new SocialCalc.InputEcho(editor);
      AssignID(editor, editor.inputEcho.main, "inputecho");
      }

   editor.cellhandles = new SocialCalc.CellHandles(editor);

   ta = document.createElement("textarea"); // used for ctrl-c/ctrl-v where an invisible text area is needed
   SocialCalc.setStyles(ta, "display:none;position:absolute;height:1px;width:1px;opacity:0;filter:alpha(opacity=0);");
   ta.value = "";
   editor.pasteTextarea = ta;
   AssignID(editor, editor.pasteTextarea, "pastetextarea");

   if (navigator.userAgent.match(/Safari\//) &&!navigator.userAgent.match(/Chrome\//)) { // special code for Safari 5 change
      window.removeEventListener('beforepaste', SocialCalc.SafariPasteFunction, false);
      window.addEventListener('beforepaste', SocialCalc.SafariPasteFunction, false);
      window.removeEventListener('beforecopy', SocialCalc.SafariPasteFunction, false);
      window.addEventListener('beforecopy', SocialCalc.SafariPasteFunction, false);
      window.removeEventListener('beforecut', SocialCalc.SafariPasteFunction, false);
      window.addEventListener('beforecut', SocialCalc.SafariPasteFunction, false);
      }

   editor.toplevel.appendChild(editor.pasteTextarea);

   SocialCalc.MouseWheelRegister(editor.toplevel, {WheelMove: SocialCalc.EditorProcessMouseWheel, editor: editor});

   SocialCalc.KeyboardSetFocus(editor);

   // do status reporting things

   SocialCalc.EditorSheetStatusCallback(null, "startup", null, editor);

   // done

   return editor.toplevel;

   }

// Special code needed for change that occurred with Safari 5 that made paste not work for some reason

SocialCalc.SafariPasteFunction = function(e) {
   e.preventDefault();
   }

//
// SocialCalc.ResizeTableEditor(editor, width, height)
//
// Move things around as appropriate and resize
//

SocialCalc.ResizeTableEditor = function(editor, width, height) {

   var scc = SocialCalc.Constants;

   editor.width = width;
   editor.height = height;

   editor.toplevel.style.width = width+"px";
   editor.toplevel.style.height = height+"px";

   editor.tablewidth = Math.max(0, width - scc.defaultTableControlThickness);
   editor.tableheight = Math.max(0, height - scc.defaultTableControlThickness);
   editor.griddiv.style.width=editor.tablewidth+"px";
   editor.griddiv.style.height=editor.tableheight+"px";

   editor.verticaltablecontrol.main.style.height = editor.tableheight + "px";
   editor.horizontaltablecontrol.main.style.width = editor.tablewidth + "px";

   editor.FitToEditTable();

   editor.ScheduleRender();

   return;

   }

//
// str = SaveEditorSettings(editor)
//
// Returns a string representation of the pane settings, etc.
//
// The format is:
//
//    version:1.0
//    rowpane:panenumber:firstnum:lastnum
//    colpane:panenumber:firstnum:lastnum
//    ecell:coord -- if set
//    range:anchorcoord:top:bottom:left:right -- if set
//
// You can add additional values to be saved by using editor.SettingsCallbacks:
//
//   editor.SettingsCallbacks["item-name"] = {save: savefunction, load: loadfunction}
//
// where savefunction(editor, "item-name") returns a string with the new lines to be added to the saved settings
// which include the trailing newlines, and loadfunction(editor, "item-name", line, flags) is given the line to process
// without the trailing newlines.
//

SocialCalc.SaveEditorSettings = function(editor) {

   var i, setting;
   var context = editor.context;
   var range = editor.range;
   var result = "";

   result += "version:1.0\n";

   for (i=0; i<context.rowpanes.length; i++) {
      result += "rowpane:"+i+":"+context.rowpanes[i].first+":"+context.rowpanes[i].last+"\n";
      }
   for (i=0; i<context.colpanes.length; i++) {
      result += "colpane:"+i+":"+context.colpanes[i].first+":"+context.colpanes[i].last+"\n";
      }

   if (editor.ecell) {
      result += "ecell:"+editor.ecell.coord+"\n";
      }

   if (range.hasrange) {
      result += "range:"+range.anchorcoord+":"+range.top+":"+range.bottom+":"+range.left+":"+range.right+"\n";
      }

   for (setting in editor.SettingsCallbacks) {
      result += editor.SettingsCallbacks[setting].save(editor, setting);
      }

   return result;

   }

//
// LoadEditorSettings(editor, str, flags)
//
// Sets the editor settings based on str. See SocialCalc.SaveEditorSettings for more details.
// Unrecognized lines are ignored.
//

SocialCalc.LoadEditorSettings = function(editor, str, flags) {

   var lines=str.split(/\r\n|\n/);
   var parts=[];
   var line, i, cr, row, col, coord, setting;
   var context = editor.context;
   var highlights, range;

   context.rowpanes = [{first: 1, last: 1}]; // reset to start
   context.colpanes = [{first: 1, last: 1}];
   editor.ecell = null;
   editor.range = {hasrange: false};
   editor.range2 = {hasrange: false};
   range = editor.range;
   context.highlights = {};
   highlights = context.highlights;

   for (i=0; i<lines.length; i++) {
      line=lines[i];
      parts = line.split(":");
      setting = parts[0];
      switch (setting) {
         case "version":
            break;

         case "rowpane":
            context.rowpanes[parts[1]-0] = {first: parts[2]-0, last: parts[3]-0};
            break;

         case "colpane":
            context.colpanes[parts[1]-0] = {first: parts[2]-0, last: parts[3]-0};
            break;

         case "ecell":
            editor.ecell = SocialCalc.coordToCr(parts[1]);
            editor.ecell.coord = parts[1];
            highlights[parts[1]] = "cursor";
            break;

         case "range":
            range.hasrange = true;
            range.anchorcoord = parts[1];
            cr = SocialCalc.coordToCr(range.anchorcoord);
            range.anchorrow = cr.row;
            range.anchorcol = cr.col;
            range.top = parts[2]-0;
            range.bottom = parts[3]-0;
            range.left = parts[4]-0;
            range.right = parts[5]-0;
            for (row=range.top; row<=range.bottom; row++) {
               for (col=range.left; col<=range.right; col++) {
                  coord = SocialCalc.crToCoord(col, row);
                  if (highlights[coord]!="cursor") {
                     highlights[coord] = "range";
                     }
                  }
               }
            break;

         default:
            if (editor.SettingsCallbacks[setting]) {
               editor.SettingsCallbacks[setting].load(editor, setting, line, flags);
               }
            break;
         }
      }

   return;

   }

//
// EditorRenderSheet(editor)
//
// Renders the sheet and updates editor.fullgrid.
// Sets event handlers.
//

SocialCalc.EditorRenderSheet = function(editor) {

   editor.EditorMouseUnregister();

   editor.fullgrid = editor.context.RenderSheet(editor.fullgrid);

   if (editor.ecell) editor.SetECellHeaders("selected");

   SocialCalc.AssignID(editor, editor.fullgrid, "fullgrid"); // give it an id

   editor.EditorMouseRegister();

   }

//
// EditorScheduleSheetCommands(editor, cmdstr, saveundo, ignorebusy)
//

SocialCalc.EditorScheduleSheetCommands = function(editor, cmdstr, saveundo, ignorebusy) {

   if (editor.state!="start" && !ignorebusy) { // ignore commands if editing a cell
      return;
      }

   if (editor.busy && !ignorebusy) { // hold off on commands if doing one
      editor.deferredCommands.push({cmdstr: cmdstr, saveundo: saveundo});
      return;
      }

   switch (cmdstr) {
      case "recalc":
      case "redisplay":
         editor.context.sheetobj.ScheduleSheetCommands(cmdstr, false);
         break;

      case "undo":
         editor.SheetUndo();
         break;

      case "redo":
         editor.SheetRedo();
         break;

      default:
         editor.context.sheetobj.ScheduleSheetCommands(cmdstr, saveundo);
         break;
      }
   }


//
// EditorSheetStatusCallback(recalcdata, status, arg, editor)
//
// Called during recalc, executing commands, etc.
//

SocialCalc.EditorSheetStatusCallback = function(recalcdata, status, arg, editor) {

   var f, cell, dcmd;
   var sheetobj = editor.context.sheetobj;

   var signalstatus = function(s) {
      for (f in editor.StatusCallback) {
         if (editor.StatusCallback[f].func) {
            editor.StatusCallback[f].func(editor, s, arg, editor.StatusCallback[f].params);
            }
         }
      }

   switch (status) {

      case "startup":
         break;

      case "cmdstart":
         editor.busy = true;
         sheetobj.celldisplayneeded = "";
         break;

      case "cmdextension":
         break;

      case "cmdend":
         signalstatus(status);

         if (sheetobj.changedrendervalues) {
            editor.context.PrecomputeSheetFontsAndLayouts();
            editor.context.CalculateCellSkipData();
            sheetobj.changedrendervalues = false;
            }

         if (sheetobj.celldisplayneeded && !sheetobj.renderneeded) {
            cr = SocialCalc.coordToCr(sheetobj.celldisplayneeded);
            cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
            editor.ReplaceCell(cell, cr.row, cr.col);
            }

         if (editor.deferredCommands.length) {
            dcmd = editor.deferredCommands.shift();
            editor.EditorScheduleSheetCommands(dcmd.cmdstr, dcmd.saveundo, true);
            return;
            }

         if (sheetobj.attribs.needsrecalc &&
               (sheetobj.attribs.recalc!="off" || sheetobj.recalconce)
               && editor.recalcFunction) {
            editor.FitToEditTable();
            sheetobj.renderneeded = false; // recalc will force a render
            if (sheetobj.recalconce) delete sheetobj.recalconce; // only do once
            editor.recalcFunction(editor);
            }
         else {
            if (sheetobj.renderneeded) {
               editor.FitToEditTable();
               sheetobj.renderneeded = false;
               editor.ScheduleRender();
               }
            else {
               editor.SchedulePositionCalculations(); // just in case command changed positions
//               editor.busy = false;
//               signalstatus("cmdendnorender");
               }
            }

         // Handle hidden column.
         if (sheetobj.hiddencolrow == "col") {
            var col = editor.ecell.col;
            while (sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == "yes") {
               col++;
               }
            var coord = SocialCalc.crToCoord(col, editor.ecell.row);
            editor.MoveECell(coord);
            sheetobj.hiddencolrow = "";
            }

         // Handle hidden row.
         if (sheetobj.hiddencolrow == "row") {
            var row = editor.ecell.row;
            while (sheetobj.rowattribs.hide[row] == "yes") {
               row++;
               }
            var coord = SocialCalc.crToCoord(editor.ecell.col, row);
            editor.MoveECell(coord);
            sheetobj.hiddencolrow = "";
            }

         return;

      case "calcstart":
         editor.busy = true;
         break;

      case "calccheckdone":
      case "calcorder":
      case "calcstep":
      case "calcloading":
      case "calcserverfunc":
         break;

      case "calcfinished":
         signalstatus(status);
         editor.ScheduleRender();
         return;

      case "schedrender":
         editor.busy = true; // in case got here without cmd or recalc
         break;

      case "renderdone":
         break;

      case "schedposcalc":
         editor.busy = true; // in case got here without cmd or recalc
         break;

      case "doneposcalc":
         if (editor.deferredCommands.length) {
            signalstatus(status);
            dcmd = editor.deferredCommands.shift();
            editor.EditorScheduleSheetCommands(dcmd.cmdstr, dcmd.saveundo, true);
            }
         else {
            editor.busy = false;
            signalstatus(status);
            if (editor.state=="start") editor.DisplayCellContents(); // make sure up to date
            }
         return;

      default:
addmsg("Unknown status: "+status);
         break;

      }

   signalstatus(status);

   return;

   }

//
// str = SocialCalc.EditorGetStatuslineString(editor, status, arg, params)
//
// Assumes params is an object where it can use "calculating" and "command"
// to keep track of state.
// Returns string for status line.
//

SocialCalc.EditorGetStatuslineString = function(editor, status, arg, params) {

   var scc = SocialCalc.Constants;

   var sstr, progress, coord, circ, r, c, cell, sum, ele;

   progress = "";

   switch (status) {
      case "moveecell":
      case "rangechange":
      case "startup":
         break;
      case "cmdstart":
         params.command = true;
         document.body.style.cursor = "progress";
         editor.griddiv.style.cursor = "progress";
         progress = scc.s_statusline_executing;
         break;
      case "cmdextension":
         progress = "Command Extension: "+arg;
         break;
      case "cmdend":
         params.command = false;
         break;
      case "schedrender":
         progress = scc.s_statusline_displaying;
         break;
      case "renderdone":
         progress = " ";
         break;
      case "schedposcalc":
         progress = scc.s_statusline_displaying;
         break;
      case "cmdendnorender":
      case "doneposcalc":
         document.body.style.cursor = "default";
         editor.griddiv.style.cursor = "default";
         break;
      case "calcorder":
         progress = scc.s_statusline_ordering+Math.floor(100*arg.count/(arg.total||1))+"%";
         break;
      case "calcstep":
         progress = scc.s_statusline_calculating+Math.floor(100*arg.count/(arg.total||1))+"%";
         break;
      case "calcloading":
         progress = scc.s_statusline_calculatingls+": "+arg.sheetname;
         break;
      case "calcserverfunc":
         progress = scc.s_statusline_calculating+Math.floor(100*arg.count/(arg.total||1))+"%, "+scc.s_statusline_doingserverfunc+arg.funcname+scc.s_statusline_incell+arg.coord;
         break;
      case "calcstart":
         params.calculating = true;
         document.body.style.cursor = "progress";
         editor.griddiv.style.cursor = "progress"; // griddiv has an explicit cursor style
         progress = scc.s_statusline_calcstart;
         break;
      case "calccheckdone":
         break;
      case "calcfinished":
         params.calculating = false;
         break;
      default:
         progress = status;
         break;
      }

   if (!progress && params.calculating) {
      progress = scc.s_statusline_calculating;
      }

   // if there is a range, calculate sum (not during busy times)
   if (!params.calculating && !params.command && !progress && editor.range.hasrange 
       && (editor.range.left!=editor.range.right || editor.range.top!=editor.range.bottom)) {
      sum = 0;
      for (r=editor.range.top; r <= editor.range.bottom; r++) {
         for (c=editor.range.left; c <= editor.range.right; c++) {
            cell = editor.context.sheetobj.cells[SocialCalc.crToCoord(c, r)];
            if (!cell) continue;
            if (cell.valuetype && cell.valuetype.charAt(0)=="n") {
               sum += cell.datavalue-0;
               }
            }
         }

      sum = SocialCalc.FormatNumber.formatNumberWithFormat(sum, "[,]General", "");

      coord = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" +
         SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
      progress = coord + " (" + (editor.range.right-editor.range.left+1) + "x" + (editor.range.bottom-editor.range.top+1) +
                 ") "+scc.s_statusline_sum+"=" + sum + " " + progress;
      }
   sstr = editor.ecell.coord+" &nbsp; "+progress;

   if (!params.calculating && editor.context.sheetobj.attribs.needsrecalc=="yes") {
      sstr += ' &nbsp; '+scc.s_statusline_recalcneeded;
      }

   circ = editor.context.sheetobj.attribs.circularreferencecell;
   if (circ) {
      circ = circ.replace(/\|/, " referenced by ");
      sstr += ' &nbsp; '+scc.s_statusline_circref + circ + '</span>';
      }

   return sstr;

   }


//
// Mouse stuff
//

SocialCalc.EditorMouseInfo = {

   // The registeredElements array is used to identify editor grid in which the mouse is doing things.

   // One item for each active editor, each an object with:
   //    .element, .editor

   registeredElements: [],

   editor: null, // editor being processed (between mousedown and mouseup)
   element: null, // element being processed

   ignore: false, // if true, mousedowns are ignored

   mousedowncoord: "", // coord where mouse went down for drag range
   mouselastcoord: "", // coord where mouse last was during drag
   mouseresizecol: "", // col being resized
   mouseresizeclientx: null, // where resize started
   mouseresizedisplay: null // element tracking new size
   }

//
// EditorMouseRegister(editor)
//

SocialCalc.EditorMouseRegister = function(editor) {

   var mouseinfo = SocialCalc.EditorMouseInfo;
   var element = editor.fullgrid;
   var i;

   for (i=0; i<mouseinfo.registeredElements.length; i++) {
      if (mouseinfo.registeredElements[i].editor == editor) {
         if (mouseinfo.registeredElements[i].element == element) {
            return; // already set - don't do it again
            }
         break;
         }
      }

   if (i<mouseinfo.registeredElements.length) {
      mouseinfo.registeredElements[i].element = element;
      }
   else {
      mouseinfo.registeredElements.push({element: element, editor: editor});
      }

   if (element.addEventListener) { // DOM Level 2 -- Firefox, et al
      element.addEventListener("mousedown", SocialCalc.ProcessEditorMouseDown, false);
      element.addEventListener("dblclick", SocialCalc.ProcessEditorDblClick, false);
      }
   else if (element.attachEvent) { // IE 5+
      element.attachEvent("onmousedown", SocialCalc.ProcessEditorMouseDown);
      element.attachEvent("ondblclick", SocialCalc.ProcessEditorDblClick);
      }
   else { // don't handle this
      throw "Browser not supported";
      }

   mouseinfo.ignore = false; // just in case

   return;

   }

//
// EditorMouseUnregister(editor)
//

SocialCalc.EditorMouseUnregister = function(editor) {

   var mouseinfo = SocialCalc.EditorMouseInfo;
   var element = editor.fullgrid;
   var i, oldelement;

   for (i=0; i<mouseinfo.registeredElements.length; i++) {
      if (mouseinfo.registeredElements[i].editor == editor) {
         break;
         }
      }

   if (i<mouseinfo.registeredElements.length) {
      oldelement = mouseinfo.registeredElements[i].element; // remove old handlers
      if (oldelement.removeEventListener) { // DOM Level 2
         oldelement.removeEventListener("mousedown", SocialCalc.ProcessEditorMouseDown, false);
         oldelement.removeEventListener("dblclick", SocialCalc.ProcessEditorDblClick, false);
         }
      else if (oldelement.detachEvent) { // IE
         oldelement.detachEvent("onmousedown", SocialCalc.ProcessEditorMouseDown);
         oldelement.detachEvent("ondblclick", SocialCalc.ProcessEditorDblClick);
         }
      mouseinfo.registeredElements.splice(i, 1);
      }

   return;

   }

SocialCalc.ProcessEditorMouseDown = function(e) {

   var editor, result, coord, textarea, wval, range;

   var event = e || window.event;

   var mouseinfo = SocialCalc.EditorMouseInfo;
   var ele = event.target || event.srcElement; // source object is often within what we want
   var mobj;

   if (mouseinfo.ignore) return; // ignore this

   for (mobj=null; !mobj && ele; ele=ele.parentNode) { // go up tree looking for one of our elements
      mobj = SocialCalc.LookupElement(ele, mouseinfo.registeredElements);
      }
   if (!mobj) {
      mouseinfo.editor = null;
      return; // not one of our elements
      }

   editor = mobj.editor;
   mouseinfo.element = ele;
   range = editor.range;

   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;
   var clientY = event.clientY - pos.top;
   result = SocialCalc.GridMousePosition(editor, clientX, clientY);

   if (!result) return; // not on a cell or col header
   mouseinfo.editor = editor; // remember for later

   if (result.rowheader && result.rowtounhide) {
      SocialCalc.ProcessEditorRowsizeMouseDown(e, ele, result); 
      return;
      }

   if (result.colheader && result.coltoresize) { // col header - do drag resize
      SocialCalc.ProcessEditorColsizeMouseDown(e, ele, result);
      return;
      }

   if (!result.coord) return; // not us

   if (!range.hasrange) {
      if (e.shiftKey)
         editor.RangeAnchor();
      }

   coord = editor.MoveECell(result.coord);

   if (range.hasrange) {
      if (e.shiftKey)
         editor.RangeExtend();
      else
         editor.RangeRemove();
      }

   mouseinfo.mousedowncoord = coord; // remember if starting drag range select
   mouseinfo.mouselastcoord = coord;

   editor.EditorMouseRange(coord);

   SocialCalc.KeyboardSetFocus(editor);
   if (editor.state!="start" && editor.inputBox) editor.inputBox.element.focus();

   // Event code from JavaScript, Flanagan, 5th Edition, pg. 422
   if (document.addEventListener) { // DOM Level 2 -- Firefox, et al
      document.addEventListener("mousemove", SocialCalc.ProcessEditorMouseMove, true); // capture everywhere
      document.addEventListener("mouseup", SocialCalc.ProcessEditorMouseUp, true); // capture everywhere
      }
   else if (ele.attachEvent) { // IE 5+
      ele.setCapture();
      ele.attachEvent("onmousemove", SocialCalc.ProcessEditorMouseMove);
      ele.attachEvent("onmouseup", SocialCalc.ProcessEditorMouseUp);
      ele.attachEvent("onlosecapture", SocialCalc.ProcessEditorMouseUp);
      }
   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   return;

   }

SocialCalc.EditorMouseRange = function(editor, coord) {

   var inputtext, wval;
   var range = editor.range;

   switch (editor.state) { // editing a cell - shouldn't get here if no inputBox
      case "input":
         inputtext = editor.inputBox.GetText();
         wval = editor.workingvalues;
         if (("(+-*/,:!&<>=^".indexOf(inputtext.slice(-1))>=0 && inputtext.slice(0,1)=="=") ||
             (inputtext == "=")) {
            wval.partialexpr = inputtext;
            }

         if (wval.partialexpr) { // if in pointing operation
            if (coord) {
               if (range.hasrange) {
                  editor.inputBox.SetText(wval.partialexpr + SocialCalc.crToCoord(range.left, range.top) + ":" +
                     SocialCalc.crToCoord(range.right, range.bottom));
                  }
               else {
                  editor.inputBox.SetText(wval.partialexpr + coord);
                  }
               }
            }
         else { // not in point -- done editing
            editor.inputBox.Blur();
            editor.inputBox.ShowInputBox(false);
            editor.state = "start";
            editor.cellhandles.ShowCellHandles(true);
            editor.EditorSaveEdit();
            editor.inputBox.DisplayCellContents(null);
            }
         break;

      case "inputboxdirect":
         editor.inputBox.Blur();
         editor.inputBox.ShowInputBox(false);
         editor.state = "start";
         editor.cellhandles.ShowCellHandles(true);
         editor.EditorSaveEdit();
         editor.inputBox.DisplayCellContents(null);
         break;
      }
   }

SocialCalc.ProcessEditorMouseMove = function(e) {

   var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval;

   var event = e || window.event;

   var mouseinfo = SocialCalc.EditorMouseInfo;
   editor = mouseinfo.editor;
   if (!editor) return; // not us, ignore
   if (mouseinfo.ignore) return; // ignore this
   element = mouseinfo.element;

   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;
   var clientY = event.clientY - pos.top;
   result = SocialCalc.GridMousePosition(editor, clientX, clientY); // get cell with move

   if (!result) return;

   if (result && !result.coord) {
      SocialCalc.SetDragAutoRepeat(editor, result);
      return;
      }

   SocialCalc.SetDragAutoRepeat(editor, null); // stop repeating if it was

   if (!result.coord) return;

   if (result.coord!=mouseinfo.mouselastcoord) {
      if (!e.shiftKey && !editor.range.hasrange) {
         editor.RangeAnchor(mouseinfo.mousedowncoord);
         }
      editor.MoveECell(result.coord);
      editor.RangeExtend();
      }
   mouseinfo.mouselastcoord = result.coord;

   editor.EditorMouseRange(result.coord);

   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   return;

   }


SocialCalc.ProcessEditorMouseUp = function(e) {

   var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval;

   var event = e || window.event;

   var mouseinfo = SocialCalc.EditorMouseInfo;
   editor = mouseinfo.editor;
   if (!editor) return; // not us, ignore
   if (mouseinfo.ignore) return; // ignore this
   element = mouseinfo.element;

   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;
   var clientY = event.clientY - pos.top;
   result = SocialCalc.GridMousePosition(editor, clientX, clientY); // get cell with up

   SocialCalc.SetDragAutoRepeat(editor, null); // stop repeating if it was

   if (!result) return;

   if (!result.coord) result.coord = editor.ecell.coord;

   if (editor.range.hasrange) {
      editor.MoveECell(result.coord);
      editor.RangeExtend();
      }
   else if (result.coord && result.coord!=mouseinfo.mousedowncoord) {
      editor.RangeAnchor(mouseinfo.mousedowncoord);
      editor.MoveECell(result.coord);
      editor.RangeExtend();
      }

   editor.EditorMouseRange(result.coord);

   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   if (document.removeEventListener) { // DOM Level 2
      document.removeEventListener("mousemove", SocialCalc.ProcessEditorMouseMove, true);
      document.removeEventListener("mouseup", SocialCalc.ProcessEditorMouseUp, true);
      }
   else if (element.detachEvent) { // IE
      element.detachEvent("onlosecapture", SocialCalc.ProcessEditorMouseUp);
      element.detachEvent("onmouseup", SocialCalc.ProcessEditorMouseUp);
      element.detachEvent("onmousemove", SocialCalc.ProcessEditorMouseMove);
      element.releaseCapture();
      }

   mouseinfo.editor = null;

   return false;

   }


SocialCalc.ProcessEditorColsizeMouseDown = function(e, ele, result) {

   var event = e || window.event;
   var mouseinfo = SocialCalc.EditorMouseInfo;
   var editor = mouseinfo.editor;
   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;

   mouseinfo.mouseresizecolnum = result.coltoresize; // remember col being resized
   mouseinfo.mouseresizecol = SocialCalc.rcColname(result.coltoresize);
   mouseinfo.mousedownclientx = clientX;
   mouseinfo.mousecoltounhide = result.coltounhide;
   
   if (!mouseinfo.mousecoltounhide) {
      var sizedisplay = document.createElement("div");
      mouseinfo.mouseresizedisplay = sizedisplay;
      sizedisplay.style.width = "auto";
      sizedisplay.style.position = "absolute";
      sizedisplay.style.zIndex = 100;
      sizedisplay.style.top = editor.headposition.top+"px";
      sizedisplay.style.left = editor.colpositions[result.coltoresize]+"px";
      sizedisplay.innerHTML = '<table cellpadding="0" cellspacing="0"><tr><td style="height:100px;'+
        'border:1px dashed black;background-color:white;width:' +
        (editor.context.colwidth[mouseinfo.mouseresizecolnum]-2) + 'px;">&nbsp;</td>'+
        '<td><div style="font-size:small;color:white;background-color:gray;padding:4px;">'+
        editor.context.colwidth[mouseinfo.mouseresizecolnum] + '</div></td></tr></table>';
      SocialCalc.setStyles(sizedisplay.firstChild.lastChild.firstChild.childNodes[0], "filter:alpha(opacity=85);opacity:.85;"); // so no warning msg with Firefox about filter

      editor.toplevel.appendChild(sizedisplay);
      }

   // Event code from JavaScript, Flanagan, 5th Edition, pg. 422
   if (document.addEventListener) { // DOM Level 2 -- Firefox, et al
      document.addEventListener("mousemove", SocialCalc.ProcessEditorColsizeMouseMove, true); // capture everywhere
      document.addEventListener("mouseup", SocialCalc.ProcessEditorColsizeMouseUp, true); // capture everywhere
      }
   else if (editor.toplevel.attachEvent) { // IE 5+
      editor.toplevel.setCapture();
      editor.toplevel.attachEvent("onmousemove", SocialCalc.ProcessEditorColsizeMouseMove);
      editor.toplevel.attachEvent("onmouseup", SocialCalc.ProcessEditorColsizeMouseUp);
      editor.toplevel.attachEvent("onlosecapture", SocialCalc.ProcessEditorColsizeMouseUp);
      }
   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   return;
   }


SocialCalc.ProcessEditorColsizeMouseMove = function(e) {

   var event = e || window.event;
   var mouseinfo = SocialCalc.EditorMouseInfo;
   var editor = mouseinfo.editor;
   if (!editor) return; // not us, ignore

   if (!mouseinfo.mousecoltounhide) {
      var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
      var clientX = event.clientX - pos.left;

      var newsize = (editor.context.colwidth[mouseinfo.mouseresizecolnum]-0) + (clientX - mouseinfo.mousedownclientx);
      if (newsize < SocialCalc.Constants.defaultMinimumColWidth) newsize = SocialCalc.Constants.defaultMinimumColWidth;

      var sizedisplay = mouseinfo.mouseresizedisplay;
//      sizedisplay.firstChild.lastChild.firstChild.childNodes[1].firstChild.innerHTML = newsize+"";
//      sizedisplay.firstChild.lastChild.firstChild.childNodes[0].firstChild.style.width = (newsize-2)+"px";
      sizedisplay.innerHTML = '<table cellpadding="0" cellspacing="0"><tr><td style="height:100px;'+
          'border:1px dashed black;background-color:white;width:' + (newsize-2) + 'px;">&nbsp;</td>'+
          '<td><div style="font-size:small;color:white;background-color:gray;padding:4px;">'+
          newsize + '</div></td></tr></table>';
      SocialCalc.setStyles(sizedisplay.firstChild.lastChild.firstChild.childNodes[0], "filter:alpha(opacity=85);opacity:.85;"); // so no warning msg with Firefox about filter
      }

   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   return;

   }


SocialCalc.ProcessEditorColsizeMouseUp = function(e) {

   var event = e || window.event;
   var mouseinfo = SocialCalc.EditorMouseInfo;
   var editor = mouseinfo.editor;
   if (!editor) return; // not us, ignore
   element = mouseinfo.element;
   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;

   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   if (document.removeEventListener) { // DOM Level 2
      document.removeEventListener("mousemove", SocialCalc.ProcessEditorColsizeMouseMove, true);
      document.removeEventListener("mouseup", SocialCalc.ProcessEditorColsizeMouseUp, true);
      }
   else if (editor.toplevel.detachEvent) { // IE
      editor.toplevel.detachEvent("onlosecapture", SocialCalc.ProcessEditorColsizeMouseUp);
      editor.toplevel.detachEvent("onmouseup", SocialCalc.ProcessEditorColsizeMouseUp);
      editor.toplevel.detachEvent("onmousemove", SocialCalc.ProcessEditorColsizeMouseMove);
      editor.toplevel.releaseCapture();
      }

   if (mouseinfo.mousecoltounhide) {
      editor.EditorScheduleSheetCommands("set "+SocialCalc.rcColname(mouseinfo.mousecoltounhide)+" hide", true, false);
      /*
      if (editor.ecell && editor.ecell.col == mouseinfo.mousecoltounhide+1) {
         editor.MoveECell(SocialCalc.crToCoord(mouseinfo.mousecoltounhide, editor.ecell.row));
         }*/
      }
   else {
      var newsize = (editor.context.colwidth[mouseinfo.mouseresizecolnum]-0) + (clientX - mouseinfo.mousedownclientx);
      if (newsize < SocialCalc.Constants.defaultMinimumColWidth) newsize = SocialCalc.Constants.defaultMinimumColWidth;

      editor.EditorScheduleSheetCommands("set "+mouseinfo.mouseresizecol+" width "+newsize, true, false);

      if (editor.timeout) window.clearTimeout(editor.timeout);
      editor.timeout = window.setTimeout(SocialCalc.FinishColsize, 1); // wait - Firefox 2 has a bug otherwise with next mousedown
      }

   return false;

   }


SocialCalc.FinishColsize = function() {

   var mouseinfo = SocialCalc.EditorMouseInfo;
   var editor = mouseinfo.editor;
   if (!editor) return;

   editor.toplevel.removeChild(mouseinfo.mouseresizedisplay);
   mouseinfo.mouseresizedisplay = null;

//   editor.FitToEditTable();
//   editor.EditorRenderSheet();
//   editor.SchedulePositionCalculations();

   mouseinfo.editor = null;

   return;

   }


SocialCalc.ProcessEditorRowsizeMouseDown = function(e, ele, result) {

   var event = e || window.event;
   var mouseinfo = SocialCalc.EditorMouseInfo;
   var editor = mouseinfo.editor;
   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;

   mouseinfo.mouserowtounhide = result.rowtounhide;
   
   // Event code from JavaScript, Flanagan, 5th Edition, pg. 422
   if (document.addEventListener) { // DOM Level 2 -- Firefox, et al
      document.addEventListener("mousemove", SocialCalc.ProcessEditorRowsizeMouseMove, true); // capture everywhere
      document.addEventListener("mouseup", SocialCalc.ProcessEditorRowsizeMouseUp, true); // capture everywhere
      }
   else if (editor.toplevel.attachEvent) { // IE 5+
      editor.toplevel.setCapture();
      editor.toplevel.attachEvent("onmousemove", SocialCalc.ProcessEditorRowsizeMouseMove);
      editor.toplevel.attachEvent("onmouseup", SocialCalc.ProcessEditorRowsizeMouseUp);
      editor.toplevel.attachEvent("onlosecapture", SocialCalc.ProcessEditorRowsizeMouseUp);
      }
   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   return;
   }


SocialCalc.ProcessEditorRowsizeMouseMove = function(e) {

   var event = e || window.event;
   var mouseinfo = SocialCalc.EditorMouseInfo;
   var editor = mouseinfo.editor;
   if (!editor) return; // not us, ignore

   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   return;

   }


SocialCalc.ProcessEditorRowsizeMouseUp = function(e) {

   var event = e || window.event;
   var mouseinfo = SocialCalc.EditorMouseInfo;
   var editor = mouseinfo.editor;
   if (!editor) return; // not us, ignore
   element = mouseinfo.element;
   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;

   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   if (document.removeEventListener) { // DOM Level 2
      document.removeEventListener("mousemove", SocialCalc.ProcessEditorRowsizeMouseMove, true);
      document.removeEventListener("mouseup", SocialCalc.ProcessEditorRowsizeMouseUp, true);
      }
   else if (editor.toplevel.detachEvent) { // IE
      editor.toplevel.detachEvent("onlosecapture", SocialCalc.ProcessEditorRowsizeMouseUp);
      editor.toplevel.detachEvent("onmouseup", SocialCalc.ProcessEditorRowsizeMouseUp);
      editor.toplevel.detachEvent("onmousemove", SocialCalc.ProcessEditorRowsizeMouseMove);
      editor.toplevel.releaseCapture();
      }

   if (mouseinfo.mouserowtounhide) {
      editor.EditorScheduleSheetCommands("set "+mouseinfo.mouserowtounhide+" hide", true, false);
      }

   return false;

   }


//
// Handle auto-repeat of dragging the cursor into the borders of the sheet
//

SocialCalc.AutoRepeatInfo = {

   timer: null, // timer object for repeating
   mouseinfo: null, // result from SocialCalc.GridMousePosition
   repeatinterval: 1000, // milliseconds to wait between repeats
   editor: null, // editor object to use when it repeats
   repeatcallback: null // used instead of default when repeating (e.g., for cellhandles)
                        // called as: repeatcallback(newcoord, direction)

};

// Control auto-repeat. If mouseinfo==null, cancel.

SocialCalc.SetDragAutoRepeat = function(editor, mouseinfo, callback) {

   var repeatinfo = SocialCalc.AutoRepeatInfo;
   var coord, direction;

   repeatinfo.repeatcallback = callback; // null in regular case

   if (!mouseinfo) { // cancel
      if (repeatinfo.timer) { // If was repeating, stop
         window.clearTimeout(repeatinfo.timer); // cancel timer
         repeatinfo.timer = null;
         }
      repeatinfo.mouseinfo = null;
      return; // done
      }

   repeatinfo.editor = editor;

   if (repeatinfo.mouseinfo) { // check for change while repeating
      if (mouseinfo.rowheader || mouseinfo.rowfooter) {
         if (mouseinfo.row != repeatinfo.mouseinfo.row) { // changed row while dragging sidewards
            coord = SocialCalc.crToCoord(editor.ecell.col, mouseinfo.row); // change to it
            if (repeatinfo.repeatcallback) {
               if (mouseinfo.row < repeatinfo.mouseinfo.row) {
                  direction = "left";
                  }
               else if (mouseinfo.row > repeatinfo.mouseinfo.row) {
                  direction = "right";
                  }
               else {
                  direction = "";
                  }
               repeatinfo.repeatcallback(coord, direction);
               }
            else {
               editor.MoveECell(coord);
               editor.MoveECell(coord);
               editor.RangeExtend();
               editor.EditorMouseRange(coord);
               }
            }            
         }
      else if (mouseinfo.colheader || mouseinfo.colfooter) {
         if (mouseinfo.col != repeatinfo.mouseinfo.col) { // changed col while dragging vertically
            coord = SocialCalc.crToCoord(mouseinfo.col, editor.ecell.row); // change to it
            if (repeatinfo.repeatcallback) {
               if (mouseinfo.row < repeatinfo.mouseinfo.row) {
                  direction = "left";
                  }
               else if (mouseinfo.row > repeatinfo.mouseinfo.row) {
                  direction = "right";
                  }
               else {
                  direction = "";
                  }
               repeatinfo.repeatcallback(coord, direction);
               }
            else {
               editor.MoveECell(coord);
               editor.RangeExtend();
               editor.EditorMouseRange(coord);
               }
            }            
         }
      }

   repeatinfo.mouseinfo = mouseinfo;

   if (mouseinfo.distance < 5) repeatinfo.repeatinterval = 333;
   else if (mouseinfo.distance < 10) repeatinfo.repeatinterval = 250;
   else if (mouseinfo.distance < 25) repeatinfo.repeatinterval = 100;
   else if (mouseinfo.distance < 35) repeatinfo.repeatinterval = 75;
   else { // too far - stop repeating
      if (repeatinfo.timer) { // if repeating, cancel it
         window.clearTimeout(repeatinfo.timer); // cancel timer
         repeatinfo.timer = null;
         }
      return;
      }

   if (!repeatinfo.timer) { // start if not already running
      repeatinfo.timer = window.setTimeout(SocialCalc.DragAutoRepeat, repeatinfo.repeatinterval);
      }

   return;

   }

//
// DragAutoRepeat()
//

SocialCalc.DragAutoRepeat = function() {

   var repeatinfo = SocialCalc.AutoRepeatInfo;
   var mouseinfo = repeatinfo.mouseinfo;

   var direction, coord, cr;

   if (mouseinfo.rowheader) direction = "left";
   else if (mouseinfo.rowfooter) direction = "right";
   else if (mouseinfo.colheader) direction = "up";
   else if (mouseinfo.colfooter) direction = "down";

   if (repeatinfo.repeatcallback) {
      cr = SocialCalc.coordToCr(repeatinfo.editor.ecell.coord);
      if (direction == "left" && cr.col > 1) cr.col--;
      else if (direction == "right") cr.col++;
      else if (direction == "up" && cr.row > 1) cr.row--;
      else if (direction == "down") cr.row++;
      coord = SocialCalc.crToCoord(cr.col, cr.row);
      repeatinfo.repeatcallback(coord, direction);
      }
   else {
      coord = repeatinfo.editor.MoveECellWithKey("[a"+direction+"]shifted");
      if (coord) repeatinfo.editor.EditorMouseRange(coord);
      }

   repeatinfo.timer = window.setTimeout(SocialCalc.DragAutoRepeat, repeatinfo.repeatinterval);

   }

//
// Handling Clicking
//

SocialCalc.ProcessEditorDblClick = function(e) {

   var editor, result, coord, textarea, wval, range;

   var event = e || window.event;

   var mouseinfo = SocialCalc.EditorMouseInfo;
   var ele = event.target || event.srcElement; // source object is often within what we want
   var mobj;

   if (mouseinfo.ignore) return; // ignore this

   for (mobj=null; !mobj && ele; ele=ele.parentNode) { // go up tree looking for one of our elements
      mobj = SocialCalc.LookupElement(ele, mouseinfo.registeredElements);
      }
   if (!mobj) {
      mouseinfo.editor = null;
      return; // not one of our elements
      }

   editor = mobj.editor;

   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;
   var clientY = event.clientY - pos.top;
   result = SocialCalc.GridMousePosition(editor, clientX, clientY);
   if (!result || !result.coord) return; // not within cell area - ignore

   mouseinfo.editor = editor; // remember for later
   mouseinfo.element = ele;
   range = editor.range;

   sheetobj = editor.context.sheetobj;

   switch (editor.state) {
      case "start":
         SocialCalc.EditorOpenCellEdit(editor);
         break;

      case "input":
         break;

      default:
         break;
      }

   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   return;

   }


SocialCalc.EditorOpenCellEdit = function(editor) {

   var wval;

   if (!editor.ecell) return true; // no ecell
   if (!editor.inputBox) return true; // no input box, so no editing (happens on noEdit)
   if (editor.inputBox.element.disabled) return true; // multi-line: ignore
   editor.inputBox.ShowInputBox(true);
   editor.inputBox.Focus();
   editor.state = "inputboxdirect";
   editor.inputBox.SetText("");
   editor.inputBox.DisplayCellContents();
   editor.inputBox.Select("end");
   wval = editor.workingvalues;
   wval.partialexpr = "";
   wval.ecoord = editor.ecell.coord;
   wval.erow = editor.ecell.row;
   wval.ecol = editor.ecell.col;

   return;

   }


SocialCalc.EditorProcessKey = function(editor, ch, e) {

   var result, cell, cellobj, valueinfo, fch, coord, inputtext, f;

   var sheetobj = editor.context.sheetobj;
   var wval = editor.workingvalues;
   var range = editor.range;

   if (typeof ch != "string") ch = "";

   switch (editor.state) {
      case "start":
         if (e.shiftKey && ch.substr(0,2)=="[a") {
            ch = ch + "shifted";
            }
         if (ch=="[enter]") ch = "[adown]";
         if (ch=="[tab]") ch = e.shiftKey ? "[aleft]" : "[aright]";
         if (ch.substr(0,2)=="[a" || ch.substr(0,3)=="[pg" || ch=="[home]") {
            result = editor.MoveECellWithKey(ch);
            return !result;
            }
         if (ch=="[del]" || ch=="[backspace]") {
            if (!editor.noEdit && !editor.ECellReadonly()) {
               editor.EditorApplySetCommandsToRange("empty", "");
               }
            break;
            }
         if (ch=="[esc]") {
            if (range.hasrange) {
               editor.RangeRemove();
               editor.MoveECell(range.anchorcoord);
               for (f in editor.StatusCallback) {
                  editor.StatusCallback[f].func(editor, "specialkey", ch, editor.StatusCallback[f].params);
                  }
               }
            return false;
            }

         if (ch=="[f2]") {
            if (editor.noEdit || editor.ECellReadonly()) return true;
            SocialCalc.EditorOpenCellEdit(editor);
            return false;
            }

         if ((ch.length>1 && ch.substr(0,1)=="[") || ch.length==0) { // some control key
            if (editor.ctrlkeyFunction && ch.length>0) {
               return editor.ctrlkeyFunction(editor, ch);
               }
            else {
               return true;
               }
            }
         if (!editor.ecell) return true; // no ecell
         if (!editor.inputBox) return true; // no inputBox so no editing
         if (editor.ECellReadonly()) return true;
         editor.inputBox.element.disabled = false; // make sure editable
         editor.state = "input";
         editor.inputBox.ShowInputBox(true);
         editor.inputBox.Focus();
         editor.inputBox.SetText(ch);
         editor.inputBox.Select("end");
         wval.partialexpr = "";
         wval.ecoord = editor.ecell.coord;
         wval.erow = editor.ecell.row;
         wval.ecol = editor.ecell.col;
         editor.RangeRemove();
         break;

      case "input":
         inputtext = editor.inputBox.GetText(); // should not get here if no inputBox
         if (editor.inputBox.skipOne) return false; // ignore a key already handled
         if (ch=="[esc]" || ch=="[enter]" || ch=="[tab]" || (ch && ch.substr(0,2)=="[a")) {
            if (("(+-*/,:!&<>=^".indexOf(inputtext.slice(-1))>=0 && inputtext.slice(0,1)=="=") ||
                (inputtext == "=")) {
               wval.partialexpr = inputtext;
               }
            if (wval.partialexpr) { // if in pointing operation
               if (e.shiftKey && ch.substr(0,2)=="[a") {
                  ch = ch + "shifted";
                  }
               coord = editor.MoveECellWithKey(ch);
               if (coord) {
                  if (range.hasrange) {
                     editor.inputBox.SetText(wval.partialexpr + SocialCalc.crToCoord(range.left, range.top) + ":" +
                        SocialCalc.crToCoord(range.right, range.bottom));
                     }
                  else {
                     editor.inputBox.SetText(wval.partialexpr + coord);
                     }
                  return false;
                  }
               }
            editor.inputBox.Blur();
            editor.inputBox.ShowInputBox(false);
            editor.state = "start";
            editor.cellhandles.ShowCellHandles(true);
            if (ch != "[esc]") {
               editor.EditorSaveEdit();
               if (editor.ecell.coord != wval.ecoord) {
                  editor.MoveECell(wval.ecoord);
                  }
               if (ch=="[enter]") ch = "[adown]";
               if (ch=="[tab]") ch = e.shiftKey ? "[aleft]" : "[aright]";
               if (ch.substr(0,2)=="[a") {
                  editor.MoveECellWithKey(ch);
                  }
               }
            else {
               editor.inputBox.DisplayCellContents();
               editor.RangeRemove();
               editor.MoveECell(wval.ecoord);
               }
            break;
            }
         if (wval.partialexpr && ch=="[backspace]") {
            editor.inputBox.SetText(wval.partialexpr);
            wval.partialexpr = "";
            editor.RangeRemove();
            editor.MoveECell(wval.ecoord);
            editor.inputBox.ShowInputBox(true); // make sure it's moved back if necessary
            return false;
            }
         if (ch=="[f2]") return false;
         if (range.hasrange) {
            editor.RangeRemove();
            }
         editor.MoveECell(wval.ecoord);
         if (wval.partialexpr) {
            editor.inputBox.ShowInputBox(true); // make sure it's moved back if necessary
            wval.partialexpr = ""; // not pointing
            }
         return true;

      case "inputboxdirect":
         inputtext = editor.inputBox.GetText(); // should not get here if no inputBox
         if (ch=="[esc]" || ch=="[enter]" || ch=="[tab]") {
            editor.inputBox.Blur();
            editor.inputBox.ShowInputBox(false);
            editor.state = "start";
            editor.cellhandles.ShowCellHandles(true);
            if (ch == "[esc]") {
               editor.inputBox.DisplayCellContents();
               }
            else {
               editor.EditorSaveEdit();
               if (editor.ecell.coord != wval.ecoord) {
                  editor.MoveECell(wval.ecoord);
                  }
               if (ch=="[enter]") ch = "[adown]";
               if (ch=="[tab]") ch = e.shiftKey ? "[aleft]" : "[aright]";
               if (ch.substr(0,2)=="[a") {
                  editor.MoveECellWithKey(ch);
                  }
               }
            break;
            }
         if (ch=="[f2]") return false;
         return true;

      case "skip-and-start":
         editor.state = "start";
         editor.cellhandles.ShowCellHandles(true);
         return false;

      default:
         return true;
      }

   return false;

   }

SocialCalc.EditorAddToInput = function(editor, str, prefix) {

   var wval = editor.workingvalues;

   if (editor.noEdit || editor.ECellReadonly()) return;

   switch (editor.state) {
      case "start":
         editor.state = "input";
         editor.inputBox.ShowInputBox(true);
         editor.inputBox.element.disabled = false; // make sure editable and overwrite old
         editor.inputBox.Focus();
         editor.inputBox.SetText((prefix||"")+str);
         editor.inputBox.Select("end");
         wval.partialexpr = "";
         wval.ecoord = editor.ecell.coord;
         wval.erow = editor.ecell.row;
         wval.ecol = editor.ecell.col;
         editor.RangeRemove();
         break;

      case "input":
      case "inputboxdirect":
         editor.inputBox.element.focus();
         if (wval.partialexpr) {
            editor.inputBox.SetText(wval.partialexpr);
            wval.partialexpr = "";
            editor.RangeRemove();
            editor.MoveECell(wval.ecoord);
            }
         editor.inputBox.SetText(editor.inputBox.GetText()+str);
         break;

      default:
         break;
      }

   }


SocialCalc.EditorDisplayCellContents = function(editor) {

   if (editor.inputBox) editor.inputBox.DisplayCellContents();

   }

SocialCalc.EditorSaveEdit = function(editor, text) {

   var result, cell, valueinfo, fch, type, value, oldvalue, cmdline;

   var sheetobj = editor.context.sheetobj;
   var wval = editor.workingvalues;

   type = "text t";
   value = typeof text == "string" ? text : editor.inputBox.GetText(); // either explicit or from input box

   oldvalue = SocialCalc.GetCellContents(sheetobj, wval.ecoord)+"";
   if (value == oldvalue) { // no change
      return;
      }
   fch = value.charAt(0);
   if (fch=="=" && value.indexOf("\n")==-1) {
      type = "formula";
      value = value.substring(1);
      }
   else if (fch=="'") {
      type = "text t";
      value = value.substring(1);
      valueinfo = SocialCalc.DetermineValueType(value); // determine type again
      if (valueinfo.type.charAt(0)=="t") {
         type = "text "+valueinfo.type;
         }
      }
   else if (value.length==0) {
      type = "empty";
      }
   else {
      valueinfo = SocialCalc.DetermineValueType(value);
      if (valueinfo.type=="n" && value==(valueinfo.value+"")) { // see if don't need "constant"
         type = "value n";
         }
      else if (valueinfo.type.charAt(0)=="t") {
         type = "text "+valueinfo.type;
         }
      else if (valueinfo.type=="") {
         type = "text t";
         }
      else {
         type = "constant "+valueinfo.type+" "+valueinfo.value;
         }
      }

   if (type.charAt(0)=="t") { // text
      value = SocialCalc.encodeForSave(value); // newlines, :, and \ are escaped
      }

   cmdline = "set "+wval.ecoord+" "+type+" "+value;
   editor.EditorScheduleSheetCommands(cmdline, true, false);

   return;

   }

//
// SocialCalc.EditorApplySetCommandsToRange(editor, cmd)
//
// Takes ecell or range and does a "set" command with cmd.
//

SocialCalc.EditorApplySetCommandsToRange = function(editor, cmd) {

   var cell, row, col, line, errortext;

   var sheetobj = editor.context.sheetobj;
   var ecell = editor.ecell;
   var range = editor.range;

   if (range.hasrange) {
      coord = SocialCalc.crToCoord(range.left, range.top)+":"+SocialCalc.crToCoord(range.right, range.bottom);
      line = "set "+coord+" "+cmd;
      errortext = editor.EditorScheduleSheetCommands(line, true, false);
      }
   else {
      line = "set "+ecell.coord+" "+cmd;
      errortext = editor.EditorScheduleSheetCommands(line, true, false);
      }

   editor.DisplayCellContents();

   }

SocialCalc.EditorProcessMouseWheel = function(event, delta, mousewheelinfo, wobj) {

   if (wobj.functionobj.editor.busy) return; // ignore if busy

   if (delta > 0) {
      wobj.functionobj.editor.ScrollRelative(true, Math.floor(-delta * 1.5));
      }
   if (delta < 0) {
      wobj.functionobj.editor.ScrollRelative(true, Math.ceil(-delta * 1.5));
      }

   }

//
// GridMousePosition(editor, clientX, clientY)
//
// Returns an object with row and col numbers and coord (spans handled for coords),
// and rowheader/colheader true if in header (where coord will be undefined).
// If in colheader, will return coltoresize if on appropriate place in col header.
// Also, there is rowfooter (on right) and colfooter (on bottom).
// In row/col header/footer, returns "distance" as pixels over the edge.
//

SocialCalc.GridMousePosition = function(editor, clientX, clientY) { 

   var row, col, colpane;
   var result = {};

   for (row=1; row<editor.rowpositions.length; row++) {
      if (!editor.rowheight[row]) continue; // not rendered yet -- may be above or below us
      if (editor.rowpositions[row]+editor.rowheight[row]>clientY) {
         break;
         }
      }
   for (col=1; col<editor.colpositions.length; col++) {
      if (!editor.colwidth[col]) continue;
      if (editor.colpositions[col]+editor.colwidth[col]>clientX) {
         break;
         }
      }

   result.row = row;
   result.col = col;

   if (editor.headposition) {
      if (clientX < editor.headposition.left && clientX >= editor.gridposition.left) {
         result.rowheader = true;
         result.distance = editor.headposition.left - clientX;
         result.rowtounhide = "";

         // Handle unhide row.
         if (unhide = editor.context.rowunhidetop[row]) {
            pos = SocialCalc.GetElementPosition(unhide);
            if (clientX >= pos.left && clientX < pos.left+unhide.offsetWidth && clientY >= pos.top  && clientY < pos.top+unhide.offsetHeight) {
               result.rowtounhide = row+1;
               }
            }
         if (unhide = editor.context.rowunhidebottom[row]) {
            pos = SocialCalc.GetElementPosition(unhide);
            if (clientX >= pos.left && clientX < pos.left+unhide.offsetWidth && clientY >= pos.top  && clientY < pos.top+unhide.offsetHeight) {
               result.rowtounhide = row-1;
               }
            }

         return result;
         }
      else if (clientY < editor.headposition.top && clientY > editor.gridposition.top) { // > because of sizing row
         result.colheader = true;
         result.distance = editor.headposition.top - clientY;
         result.coltoresize = col-(editor.colpositions[col]+editor.colwidth[col]/2>clientX?1:0) || 1;

         // Handle unhide column.
         if (unhide = editor.context.colunhideleft[col]) {
            pos = SocialCalc.GetElementPosition(unhide);
            if (clientX >= pos.left && clientX < pos.left+unhide.offsetWidth && clientY >= pos.top  && clientY < pos.top+unhide.offsetHeight) {
               result.coltounhide = col+1;
               }
            }
         if (unhide = editor.context.colunhideright[col]) {
            pos = SocialCalc.GetElementPosition(unhide);
            if (clientX >= pos.left && clientX < pos.left+unhide.offsetWidth && clientY >= pos.top  && clientY < pos.top+unhide.offsetHeight) {
               result.coltounhide = col-1;
               }
            }

         for (colpane=0; colpane<editor.context.colpanes.length; colpane++) {
            if (result.coltoresize >= editor.context.colpanes[colpane].first &&
                result.coltoresize <= editor.context.colpanes[colpane].last) { // visible column
               return result;
               }
            }
         delete result.coltoresize;
         return result;
         }
      else if (clientX >= editor.verticaltablecontrol.controlborder) {
         result.rowfooter = true;
         result.distance = clientX - editor.verticaltablecontrol.controlborder;
         return result;
         }
      else if (clientY >= editor.horizontaltablecontrol.controlborder) {
         result.colfooter = true;
         result.distance = clientY - editor.horizontaltablecontrol.controlborder;
         return result;
         }
      else if (clientX < editor.gridposition.left) {
         result.rowheader = true;
         result.distance = editor.headposition.left - clientX;
         return result;
         }
      else if (clientY <= editor.gridposition.top) {
         result.colheader = true;
         result.distance = editor.headposition.top - clientY;
         return result;
         }
      else {
         result.coord = SocialCalc.crToCoord(result.col, result.row);
         if (editor.context.cellskip[result.coord]) { // handle skipped cells
            result.coord = editor.context.cellskip[result.coord];
            }
         return result;
         }
      }

   return null;

   }

//
// GetEditorCellElement(editor, row, col)
//
// Returns an object with element, the table cell element in the DOM that corresponds to row and column,
// as well as rowpane and colpane, the panes with the cell.
// If no such element, then returns null;
//

SocialCalc.GetEditorCellElement = function(editor, row, col) {

   var rowpane, colpane, c, coord;
   var rowindex = 0;
   var colindex = 0;

   for (rowpane=0; rowpane<editor.context.rowpanes.length; rowpane++) {
      if (row >= editor.context.rowpanes[rowpane].first && row <= editor.context.rowpanes[rowpane].last) {
         for (colpane=0; colpane<editor.context.colpanes.length; colpane++) {
            if (col >= editor.context.colpanes[colpane].first && col <= editor.context.colpanes[colpane].last) {
               rowindex += row - editor.context.rowpanes[rowpane].first + 2;
               for (c=editor.context.colpanes[colpane].first; c<=col; c++) {
                  coord=editor.context.cellskip[SocialCalc.crToCoord(c,row)];
                  if (!coord || !editor.context.CoordInPane(coord, rowpane, colpane)) // don't count col-spanned cells
                     colindex++;
                  }
               return {
                  element: editor.griddiv.firstChild.lastChild.childNodes[rowindex].childNodes[colindex],
                  rowpane: rowpane, colpane: colpane};
               }
            for (c=editor.context.colpanes[colpane].first; c<=editor.context.colpanes[colpane].last; c++) {
               coord=editor.context.cellskip[SocialCalc.crToCoord(c,row)];
               if (!coord || !editor.context.CoordInPane(coord, rowpane, colpane)) // don't count col-spanned cells
                  colindex++;
               }
            colindex += 1;
            }
         }
      rowindex += editor.context.rowpanes[rowpane].last - editor.context.rowpanes[rowpane].first + 1 + 1;
      }

   return null;
}

//
// cellcoord = MoveECellWithKey(editor, ch)
//
// Processes an arrow key, etc., moving the edit cell.
// If not a movement key, returns null.
//

SocialCalc.MoveECellWithKey = function(editor, ch) {

   var coord, row, col, cell;
   var shifted = false;
   var delta = 1;

   if (!editor.ecell) {
      return null;
      }

   if (ch.slice(-7)=="shifted") {
      ch = ch.slice(0,-7);
      shifted = true;
      }

   row = editor.ecell.row;
   col = editor.ecell.col;
   cell = editor.context.sheetobj.cells[editor.ecell.coord];

   switch (ch) {
      case "[adown]":
         row += (cell && cell.rowspan) || 1;
         break;
      case "[aup]":
         row--;
         delta = -1;
         break;
      case "[pgdn]":
         row += editor.pageUpDnAmount - 1 + ((cell && cell.rowspan) || 1);
         break;
      case "[pgup]":
         row -= editor.pageUpDnAmount;
         delta = -1;
         break;
      case "[aright]":
         col += (cell && cell.colspan) || 1;
         break;
      case "[aleft]":
         col--;
         delta = -1;
         break;
      case "[home]":
         row = 1;
         col = 1;
         break;
      default:
         return null;
      }

   // Adjust against usermax col and row.
   if (editor.context.sheetobj.attribs.usermaxcol) col = Math.min(editor.context.sheetobj.attribs.usermaxcol, col);
   if (editor.context.sheetobj.attribs.usermaxrow) row = Math.min(editor.context.sheetobj.attribs.usermaxrow, row);

   // Handle hidden column.
   while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == "yes") {
      col += delta;
      if (col < 1) {
         delta = -delta;
         col = 1;
         }
      }
   
   // Handle hidden row.
   while (editor.context.sheetobj.rowattribs.hide[row] == "yes") {
      row += delta;
      if (row < 1) {
         delta = -delta;
         row = 1;
         }
      }
   
   if (!editor.range.hasrange) {
      if (shifted)
         editor.RangeAnchor();
      }

   coord = editor.MoveECell(SocialCalc.crToCoord(col, row));

   if (editor.range.hasrange) {
      if (shifted)
         editor.RangeExtend();
      else
         editor.RangeRemove();
      }

   return coord;

   }

//
// cellcoord = MoveECell(editor, newecell)
//
// Takes a coordinate and returns the new edit cell coordinate (which may be
// different if newecell is covered by a span).
//

SocialCalc.MoveECell = function(editor, newcell) {

   var cell, f;

   var highlights = editor.context.highlights;
   
   // adjust against user max col/row
   var ecell = SocialCalc.coordToCr(newcell);
   if (editor.context.sheetobj.attribs.usermaxcol && ecell.col > editor.context.sheetobj.attribs.usermaxcol)
      ecell.col = editor.context.sheetobj.attribs.usermaxcol;
   if (editor.context.sheetobj.attribs.usermaxrow && ecell.row > editor.context.sheetobj.attribs.usermaxrow)
      ecell.row = editor.context.sheetobj.attribs.usermaxrow;
   newcell = SocialCalc.crToCoord(ecell.col, ecell.row);

   if (editor.ecell) {
      if (editor.ecell.coord==newcell) return newcell; // already there - don't do anything and don't tell anybody
      cell=SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
      delete highlights[editor.ecell.coord];
      if (editor.range2.hasrange &&
        editor.ecell.row>=editor.range2.top && editor.ecell.row<=editor.range2.bottom &&
        editor.ecell.col>=editor.range2.left && editor.ecell.col<=editor.range2.right) {
         highlights[editor.ecell.coord] = "range2";
         }
      editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);
      editor.SetECellHeaders(""); // set to regular col/rowname styles
      editor.cellhandles.ShowCellHandles(false);
      }
   newcell = editor.context.cellskip[newcell] || newcell;
   editor.ecell = SocialCalc.coordToCr(newcell);
   editor.ecell.coord = newcell;
   cell=SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
   highlights[newcell] = "cursor";

   for (f in editor.MoveECellCallback) { // let others know
      editor.MoveECellCallback[f](editor);
      }

   editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);
   editor.SetECellHeaders("selected");

   for (f in editor.StatusCallback) { // let status line, etc., know
      editor.StatusCallback[f].func(editor, "moveecell", newcell, editor.StatusCallback[f].params);
      }

   if (editor.busy) {
      editor.ensureecell = true; // wait for when not busy
      }
   else {
      editor.ensureecell = false;
      editor.EnsureECellVisible();
      }

   return newcell;

   }

SocialCalc.EnsureECellVisible = function(editor) {

   var vamount = 0;
   var hamount = 0;

   if (editor.ecell.row > editor.lastnonscrollingrow) {
      if (editor.ecell.row < editor.firstscrollingrow) {
         vamount = editor.ecell.row - editor.firstscrollingrow;
         }
      else if (editor.ecell.row > editor.lastvisiblerow) {
         vamount = editor.ecell.row - editor.lastvisiblerow;
         }
      }   
   if (editor.ecell.col > editor.lastnonscrollingcol) {
      if (editor.ecell.col < editor.firstscrollingcol) {
         hamount = editor.ecell.col - editor.firstscrollingcol;
         }
      else if (editor.ecell.col > editor.lastvisiblecol) {
        hamount = editor.ecell.col- editor.lastvisiblecol;
         }
      }

   if (vamount!=0 || hamount!=0) {
      editor.ScrollRelativeBoth(vamount, hamount);
      }
   else {
      editor.cellhandles.ShowCellHandles(true);
      }

   }

SocialCalc.ReplaceCell = function(editor, cell, row, col) {

   var newelement, a;
   if (!cell) return;
   newelement = editor.context.RenderCell(row, col, cell.rowpane, cell.colpane, true, null);
   if (newelement) {
      // Don't use a real element and replaceChild, which seems to have focus issues with IE, Firefox, and speed issues
      cell.element.innerHTML = newelement.innerHTML;
      cell.element.style.cssText = "";
      cell.element.className = newelement.className;
      for (a in newelement.style) {
         if (newelement.style[a]!="cssText")
            cell.element.style[a] = newelement.style[a];
         }
      }
   }


SocialCalc.UpdateCellCSS = function(editor, cell, row, col) {

   var newelement, a;
   if (!cell) return;
   newelement = editor.context.RenderCell(row, col, cell.rowpane, cell.colpane, true, null);
   if (newelement) {
      cell.element.style.cssText = "";
      cell.element.className = newelement.className;
      for (a in newelement.style) {
         if (newelement.style[a]!="cssText")
            cell.element.style[a] = newelement.style[a];
         }
      }
   }


SocialCalc.SetECellHeaders = function(editor, selected) {

   var ecell = editor.ecell;
   var context = editor.context;

   var rowpane, colpane, first, last;
   var rowindex = 0;
   var colindex = 0;
   var headercell;

   if (!ecell) return;

   // Handle ecell on a hidden column/row.
   while (context.sheetobj.colattribs.hide[SocialCalc.rcColname(ecell.col)] == "yes") {
      ecell.col++;
      }
   while (context.sheetobj.rowattribs.hide[ecell.row] == "yes") {
      ecell.row++;
      }

   ecell.coord = SocialCalc.crToCoord(ecell.col, ecell.row);

   for (rowpane=0; rowpane<context.rowpanes.length; rowpane++) {
      first = context.rowpanes[rowpane].first;
      last = context.rowpanes[rowpane].last;
      if (ecell.row >= first && ecell.row <= last) {
         headercell = editor.fullgrid.childNodes[1].childNodes[2+rowindex+ecell.row-first].childNodes[0];
         if (headercell) {
            if (context.classnames) headercell.className=context.classnames[selected+"rowname"];
            if (context.explicitStyles) headercell.style.cssText=context.explicitStyles[selected+"rowname"];
            headercell.style.verticalAlign="top"; // to get around Safari making top of centered row number be
                                                  // considered top of row (and can't get <row> position in Safari)
            }
         }
      rowindex += last - first + 1 + 1;
      }

   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      first = context.colpanes[colpane].first;
      last = context.colpanes[colpane].last;
      if (ecell.col >= first && ecell.col <= last) {
         headercell = editor.fullgrid.childNodes[1].childNodes[1].childNodes[1+colindex+ecell.col-first];
         if (headercell) {
            if (context.classnames) headercell.className=context.classnames[selected+"colname"];
            if (context.explicitStyles) headercell.style.cssText=context.explicitStyles[selected+"colname"];
            }
         }
      colindex += last - first + 1 + 1;
      }
   }

//
// ECellReadonly(editor, ecoord)
//
// Returns true if ecoord is readonly (or ecell if missing).
//

SocialCalc.ECellReadonly = function(editor, ecoord) {
   
   if (!ecoord && editor.ecell) {
      ecoord = editor.ecell.coord; 
      }

   if (!ecoord) return false;

   var cell = editor.context.sheetobj.cells[ecoord];
   return cell && cell.readonly;

   }

//
// RangeAnchor(editor, ecoord)
//
// Sets the anchor of a range to ecoord (or ecell if missing).
//

SocialCalc.RangeAnchor = function(editor, ecoord) {

   if (editor.range.hasrange) {
      editor.RangeRemove();
      }

   editor.RangeExtend(ecoord);

   }

//
// RangeExtend(editor, ecoord)
//
// Sets the other corner of the range to ecoord or, if missing, ecell.
//

SocialCalc.RangeExtend = function(editor, ecoord) {

   var a, cell, cr, coord, row, col, f;

   var highlights = editor.context.highlights;
   var range = editor.range;
   var range2 = editor.range2;

   var ecell;
   if (ecoord) {
      ecell = SocialCalc.coordToCr(ecoord);
      ecell.coord = ecoord;
      }
   else ecell = editor.ecell;

   if (!ecell) return; // just in case

   if (!range.hasrange) { // called without RangeAnchor...
      range.anchorcoord = ecell.coord;
      range.anchorrow = ecell.row;
      range.top = ecell.row;
      range.bottom = ecell.row;
      range.anchorcol = ecell.col;
      range.left = ecell.col;
      range.right = ecell.col;
      range.hasrange = true;
      }

   if (range.anchorrow < ecell.row) {
      range.top = range.anchorrow;
      range.bottom = ecell.row;
      }
   else {
      range.top = ecell.row;
      range.bottom = range.anchorrow;
      }
   if (range.anchorcol < ecell.col) {
      range.left = range.anchorcol;
      range.right = ecell.col;
      }
   else {
      range.left = ecell.col;
      range.right = range.anchorcol;
      }

   for (coord in highlights) {
      switch (highlights[coord]) {
         case "range":
            highlights[coord] = "unrange";
            break;
         case "range2":
            highlights[coord] = "unrange2";
            break;
         }
      }

   for (row=range.top; row<=range.bottom; row++) {
      for (col=range.left; col<=range.right; col++) {
         coord = SocialCalc.crToCoord(col, row);
         switch (highlights[coord]) {
            case "unrange":
               highlights[coord] = "range";
               break;
            case "cursor":
               break;
            case "unrange2":
            default:
               highlights[coord] = "newrange";
               break;
            }
         }
      }

   for (row=range2.top; range2.hasrange && row<=range2.bottom; row++) {
      for (col=range2.left; col<=range2.right; col++) {
         coord = SocialCalc.crToCoord(col, row);
         switch (highlights[coord]) {
            case "unrange2":
               highlights[coord] = "range2";
               break;
            case "range":
            case "newrange":
            case "cursor":
               break;
            default:
               highlights[coord] = "newrange2";
               break;
            }
         }
      }

   for (coord in highlights) {

      switch (highlights[coord]) {
         case "unrange":
            delete highlights[coord];
            break;
         case "newrange":
            highlights[coord] = "range";
            break;
         case "newrange2":
            highlights[coord] = "range2";
            break;
         case "range":
         case "range2":
         case "cursor":
            continue;
         }

      cr = SocialCalc.coordToCr(coord);
      cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
      editor.UpdateCellCSS(cell, cr.row, cr.col);

      }

   for (f in editor.RangeChangeCallback) { // let others know
      editor.RangeChangeCallback[f](editor);
      }

   // create range/coord string and do status callback

   coord = SocialCalc.crToCoord(editor.range.left, editor.range.top);
   if (editor.range.left!=editor.range.right || editor.range.top!=editor.range.bottom) { // more than one cell
      coord += ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
      }
   for (f in editor.StatusCallback) {
      editor.StatusCallback[f].func(editor, "rangechange", coord, editor.StatusCallback[f].params);
      }

   return;

   }

//
// RangeRemove(editor)
//
// Turns off the range.
//

SocialCalc.RangeRemove = function(editor) {

   var cell, cr, coord, row, col, f;

   var highlights = editor.context.highlights;
   var range = editor.range;
   var range2 = editor.range2;

   if (!range.hasrange && !range2.hasrange) return;

   for (row=range2.top; range2.hasrange && row<=range2.bottom; row++) {
      for (col=range2.left; col<=range2.right; col++) {
         coord = SocialCalc.crToCoord(col, row);
         switch (highlights[coord]) {
            case "range":
               highlights[coord] = "newrange2";
               break;
            case "range2":
            case "cursor":
               break;
            default:
               highlights[coord] = "newrange2";
               break;
            }
         }
      }

   for (coord in highlights) {
      switch (highlights[coord]) {
         case "range":
            delete highlights[coord];
            break;
         case "newrange2":
            highlights[coord] = "range2";
            break;
         case "cursor":
            continue;
         }
      cr = SocialCalc.coordToCr(coord);
      cell=SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
      editor.UpdateCellCSS(cell, cr.row, cr.col);
      }

   range.hasrange = false;

   for (f in editor.RangeChangeCallback) { // let others know
      editor.RangeChangeCallback[f](editor);
      }

   for (f in editor.StatusCallback) {
      editor.StatusCallback[f].func(editor, "rangechange", "", editor.StatusCallback[f].params);
      }

   return;

   }

//
// Range2Remove(editor)
//
// Turns off the range2.
//

SocialCalc.Range2Remove = function(editor) {

   var cell, cr, coord, row, col, f;

   var highlights = editor.context.highlights;
   var range2 = editor.range2;

   if (!range2.hasrange) return;

   for (coord in highlights) {
      switch (highlights[coord]) {
         case "range2":
            delete highlights[coord];
            break;
         case "range":
         case "cursor":
            continue;
         }
      cr = SocialCalc.coordToCr(coord);
      cell=SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
      editor.UpdateCellCSS(cell, cr.row, cr.col);
      }

   range2.hasrange = false;

   return;

   }

//
// FitToEditTable(editor)
//
// Figure out (through column width declarations and approximation of pixels per row)
// how many rendered rows and columns you need to be at least a little larger than
// the editor's editing area.
//

SocialCalc.FitToEditTable = function(editor) {

   var colnum, colname, colwidth, totalwidth, totalrows, rownum, rowpane, needed;

   var context=editor.context;
   var sheetobj=context.sheetobj;
   var sheetcolattribs=sheetobj.colattribs;

   // Calculate column width data

   totalwidth=context.showRCHeaders ? context.rownamewidth-0 : 0;
   for (colpane=0; colpane<context.colpanes.length-1; colpane++) { // Get width of all but last pane
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         colname=SocialCalc.rcColname(colnum);
         if (sheetobj.colattribs.hide[colname] != "yes") {
            colwidth = sheetobj.colattribs.width[colname] || sheetobj.attribs.defaultcolwidth || SocialCalc.Constants.defaultColWidth;
            if (colwidth=="blank" || colwidth=="auto") colwidth="";
            totalwidth+=(colwidth && ((colwidth-0)>0)) ? (colwidth-0) : 10;
            }
         }
      }

   for (colnum=context.colpanes[colpane].first; colnum<=10000; colnum++) { //!!! max for safety, but makes that col max!!!
      colname=SocialCalc.rcColname(colnum);
      if (sheetobj.colattribs.hide[colname] != "yes") {
         colwidth = sheetobj.colattribs.width[colname] || sheetobj.attribs.defaultcolwidth || SocialCalc.Constants.defaultColWidth;
         if (colwidth=="blank" || colwidth=="auto") colwidth="";
         totalwidth+=(colwidth && ((colwidth-0)>0)) ? (colwidth-0) : 10;
         }
      if (totalwidth > editor.tablewidth) break;
      }

   context.colpanes[colpane].last = context.sheetobj.attribs.usermaxcol || colnum;

   // Calculate row height data

   totalrows=context.showRCHeaders ? 1 : 0;
   for (rowpane=0; rowpane<context.rowpanes.length-1; rowpane++) { // count all panes but last one
      totalrows += context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 1;
      for (rownum=context.rowpanes[rowpane].first; rownum<=context.rowpanes[rowpane].last; rownum++) {
         if (sheetobj.rowattribs.hide[rownum] == "yes") {
            totalrows--;
            }
         }
      }

   needed = editor.tableheight - totalrows * context.pixelsPerRow; // estimate amount needed

   context.rowpanes[rowpane].last = context.sheetobj.attribs.usermaxrow || context.rowpanes[rowpane].first + Math.floor(needed / context.pixelsPerRow) + 1;

   }

//
// CalculateEditorPositions(editor)
//
// Calculate the screen positions and other values of various editing elements
// These values change and need to be recomputed when the pane first/last or cell contents change,
// as well as new column widths, etc.
//
// Note: Only call this after the grid has been rendered! You may have to wait for a timeout...
//

SocialCalc.CalculateEditorPositions = function(editor) {

   var rowpane, colpane, i;

   editor.gridposition = SocialCalc.GetElementPosition(editor.griddiv);
   
   var element = editor.griddiv.firstChild.lastChild.childNodes[1].childNodes[0]; // 2nd tr 1st td
   editor.headposition = SocialCalc.GetElementPosition(element);
   editor.headposition.left += element.offsetWidth;
   editor.headposition.top += element.offsetHeight;

   editor.rowpositions = [];
   for (rowpane=0; rowpane<editor.context.rowpanes.length; rowpane++) {
      editor.CalculateRowPositions(rowpane, editor.rowpositions, editor.rowheight);
      }
   for (i=0; i<editor.rowpositions.length; i++) {
      if (editor.rowpositions[i]>editor.gridposition.top+editor.tableheight) break;
      }
   editor.lastvisiblerow = i-1;

   editor.colpositions = [];
   for (colpane=0; colpane<editor.context.colpanes.length; colpane++) {
      editor.CalculateColPositions(colpane, editor.colpositions, editor.colwidth);
      }
   for (i=0; i<editor.colpositions.length; i++) {
      if (editor.colpositions[i]>editor.gridposition.left+editor.tablewidth) break;
      }
   editor.lastvisiblecol = i-1;

   editor.firstscrollingrow = editor.context.rowpanes[editor.context.rowpanes.length-1].first;
   while (editor.context.sheetobj.rowattribs.hide[editor.firstscrollingrow] == "yes") {
      editor.firstscrollingrow++;
      }
   editor.firstscrollingrowtop = editor.rowpositions[editor.firstscrollingrow] || editor.headposition.top;
   editor.lastnonscrollingrow = editor.context.rowpanes.length-1 > 0 ?
         editor.context.rowpanes[editor.context.rowpanes.length-2].last : 0;
   editor.firstscrollingcol = editor.context.colpanes[editor.context.colpanes.length-1].first;
   while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(editor.firstscrollingcol)] == "yes") {
      editor.firstscrollingcol++;
      }
   editor.firstscrollingcolleft = editor.colpositions[editor.firstscrollingcol] || editor.headposition.left;
   editor.lastnonscrollingcol = editor.context.colpanes.length-1 > 0 ?
         editor.context.colpanes[editor.context.colpanes.length-2].last : 0;

   // Now do the table controls

   editor.verticaltablecontrol.ComputeTableControlPositions();
   editor.horizontaltablecontrol.ComputeTableControlPositions();
   }

//
// ScheduleRender(editor)
//
// Do a series of timeouts to render the sheet, wait for background layout and
// rendering by the browser, and then update editor visuals, sliders, etc.
//

SocialCalc.ScheduleRender = function(editor) {

   if (editor.timeout) window.clearTimeout(editor.timeout); // in case called more than once, just use latest

   SocialCalc.EditorSheetStatusCallback(null, "schedrender", null, editor);
   editor.timeout = window.setTimeout(function() { SocialCalc.DoRenderStep(editor); }, 1);

   }

// DoRenderStep(editor)
//

SocialCalc.DoRenderStep = function(editor) {

   editor.timeout = null;

   editor.EditorRenderSheet();

   SocialCalc.EditorSheetStatusCallback(null, "renderdone", null, editor);

   SocialCalc.EditorSheetStatusCallback(null, "schedposcalc", null, editor);

   editor.timeout = window.setTimeout(function() { SocialCalc.DoPositionCalculations(editor); }, 1);

   }

//
// SocialCalc.SchedulePositionCalculations(editor)
//

SocialCalc.SchedulePositionCalculations = function(editor) {

   SocialCalc.EditorSheetStatusCallback(null, "schedposcalc", null, editor);

   editor.timeout = window.setTimeout(function() { SocialCalc.DoPositionCalculations(editor); }, 1);

   }

// DoPositionCalculations(editor)
//
// Update editor visuals, sliders, etc.
//
// Note: Only call this after the DOM objects have been modified and rendered!
//

SocialCalc.DoPositionCalculations = function(editor) {

   editor.timeout = null;

   editor.CalculateEditorPositions();
   editor.verticaltablecontrol.PositionTableControlElements();
   editor.horizontaltablecontrol.PositionTableControlElements();

   SocialCalc.EditorSheetStatusCallback(null, "doneposcalc", null, editor);

   if (editor.ensureecell && editor.ecell && !editor.deferredCommands.length) { // don't do if deferred cmd to execute
      editor.ensureecell = false;
      editor.EnsureECellVisible(); // this could cause another redisplay
      }

   editor.cellhandles.ShowCellHandles(true);


//!!! Need to now check to see if this positioned controls out of the editing area
//!!! (such as when there is a large wrapped cell and it pushes the pane boundary too far down).

   }

SocialCalc.CalculateRowPositions = function(editor, panenum, positions, sizes) {

   var toprow, rowpane, rownum, offset, trowobj, cellposition;

   var context=editor.context;
   var sheetobj=context.sheetobj;

   var tbodyobj;

   if (!context.showRCHeaders) throw("Needs showRCHeaders=true");

   tbodyobj=editor.fullgrid.lastChild;

   // Calculate start of this pane as row in this table:

   toprow = 2;
   for (rowpane=0; rowpane<panenum; rowpane++) {
      toprow += context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 2; // skip pane and spacing row
      }

   offset = 0;
   for (rownum=context.rowpanes[rowpane].first; rownum<=context.rowpanes[rowpane].last; rownum++) {
      trowobj = tbodyobj.childNodes[toprow+offset];
      offset++;
      cellposition = SocialCalc.GetElementPosition(trowobj.firstChild);

// Safari has problem: If a cell in the row is high, cell 1 is centered and it returns top of centered part 
// but if you get position of row element, it always returns the same value (not the row's)
// So we require row number to be vertical aligned to top

      if (!positions[rownum]) {
         positions[rownum] = cellposition.top; // first one takes precedence
         sizes[rownum] = trowobj.firstChild.offsetHeight;
         }
      }

   return;

   }

SocialCalc.CalculateColPositions = function(editor, panenum, positions, sizes) {

   var leftcol, colpane, colnum, offset, trowobj, cellposition;

   var context=editor.context;
   var sheetobj=context.sheetobj;

   var tbodyobj;

   if (!context.showRCHeaders) throw("Needs showRCHeaders=true");

   tbodyobj=editor.fullgrid.lastChild;

   // Calculate start of this pane as column in this table:

   leftcol = 1;
   for (colpane=0; colpane<panenum; colpane++) {
      leftcol += context.colpanes[colpane].last - context.colpanes[colpane].first + 2; // skip pane and spacing col
      }

   trowobj = tbodyobj.childNodes[1]; // get heading row, which has all columns
   offset = 0;
   for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
      cellposition = SocialCalc.GetElementPosition(trowobj.childNodes[leftcol+offset]);
      if (!positions[colnum]) {
         positions[colnum] = cellposition.left; // first one takes precedence
         if (trowobj.childNodes[leftcol+offset]) {
            sizes[colnum] = trowobj.childNodes[leftcol+offset].offsetWidth;
            }
         }
      offset++;
      }

   return;

   }


// ScrollRelative(editor, vertical, amount)
//
// If vertical true, scrolls up(-)/down(+), else left(-)/right(+)

SocialCalc.ScrollRelative = function(editor, vertical, amount) {

   if (vertical) {
      editor.ScrollRelativeBoth(amount, 0);
      }
   else {
      editor.ScrollRelativeBoth(0, amount);
      }
   return;

   }

// ScrollRelativeBoth(editor, vamount, hamount)
//
// Does both with one render

SocialCalc.ScrollRelativeBoth = function(editor, vamount, hamount) {

   var context=editor.context;
   var dv = vamount > 0 ? 1 : -1, dh = hamount > 0 ? 1 : -1;

   var vplen=context.rowpanes.length;
   var vlimit = vplen>1 ? context.rowpanes[vplen-2].last+1 : 1; // don't scroll past here
   if (context.rowpanes[vplen-1].first+vamount < vlimit) { // limit amount
      vamount = (-context.rowpanes[vplen-1].first) + vlimit;
      }

   var hplen=context.colpanes.length;
   var hlimit = hplen>1 ? context.colpanes[hplen-2].last+1 : 1; // don't scroll past here
   if (context.colpanes[hplen-1].first+hamount < hlimit) { // limit amount
      hamount = (-context.colpanes[hplen-1].first) + hlimit;
      }

   // Handle hidden column by finding a next one that's not hidden.
   while (context.sheetobj.colattribs.hide[SocialCalc.rcColname(context.colpanes[hplen-1].first+hamount)] == "yes") {
      hamount += dh;
      if (hamount < 1) {
         hamount = 0;
         break;
         }
      }

   // Handle hidden row by finding a next one that's not hidden.
   while (context.sheetobj.rowattribs.hide[context.rowpanes[vplen-1].first+vamount] == "yes") {
      vamount += dv;
      if (vamount < 1) {
         vamount = 0;
         break;
         }
      }

   if ((vamount==1 || vamount==-1) && hamount==0) { // special case quick scrolls
      if (vamount==1) {
         editor.ScrollTableUpOneRow();
         }
      else {
         editor.ScrollTableDownOneRow();
         }
      if (editor.ecell) editor.SetECellHeaders("selected");
      editor.SchedulePositionCalculations();
      return;
      }

   // Do a gross move and render

   if (vamount!=0 || hamount!=0) {
      context.rowpanes[vplen-1].first += vamount;
      context.rowpanes[vplen-1].last += vamount;
      context.colpanes[hplen-1].first += hamount;
      context.colpanes[hplen-1].last += hamount;
      editor.LimitLastPanes();
      editor.FitToEditTable();
      editor.ScheduleRender();
      }

   }


// PageRelative(editor, vertical, direction)
//
// If vertical true, pages up(direction is -)/down(+), else left(-)/right(+)

SocialCalc.PageRelative = function(editor, vertical, direction) {

   var context=editor.context;
   var panes=vertical ? "rowpanes" : "colpanes";
   var lastpane=context[panes][context[panes].length-1];
   var lastvisible=vertical ? "lastvisiblerow" : "lastvisiblecol";
   var sizearray=vertical ? editor.rowheight : editor.colwidth;
   var defaultsize=vertical ? SocialCalc.Constants.defaultAssumedRowHeight : SocialCalc.Constants.defaultColWidth;
   var size, newfirst, totalsize, current;

   if (direction > 0) { // down/right
      newfirst = editor[lastvisible];
      if (newfirst == lastpane.first) newfirst += 1; // move at least one
      }
   else {
      if (vertical) { // calculate amount to scroll
         totalsize = editor.tableheight - (editor.firstscrollingrowtop - editor.gridposition.top);
         }
      else {
         totalsize = editor.tablewidth - (editor.firstscrollingcolleft - editor.gridposition.left);
         }
      totalsize -= sizearray[editor[lastvisible]] > 0 ? sizearray[editor[lastvisible]] : defaultsize;

      for (newfirst=lastpane.first-1; newfirst>0; newfirst--) {
         size = sizearray[newfirst] > 0 ? sizearray[newfirst] : defaultsize;
         if (totalsize < size) break;
         totalsize -= size;
         }

      current = lastpane.first;
      if (newfirst >= current) newfirst = current-1; // move at least 1
      if (newfirst < 1) newfirst = 1;
      }

   lastpane.first = newfirst;
   lastpane.last = newfirst+1;
   editor.LimitLastPanes();
   editor.FitToEditTable();
   editor.ScheduleRender();

   }

// LimitLastPanes(editor)
//
// Makes sure that the "first" of the last panes isn't before the last of the previous pane
//

SocialCalc.LimitLastPanes = function(editor) {

   var context=editor.context;
   var plen;

   plen = context.rowpanes.length;
   if (plen>1 && context.rowpanes[plen-1].first <= context.rowpanes[plen-2].last)
       context.rowpanes[plen-1].first = context.rowpanes[plen-2].last+1;
   if (context.sheetobj.attribs.usermaxrow && context.rowpanes[plen-1].first > context.sheetobj.attribs.usermaxrow)
       context.rowpanes[plen-1].first = context.sheetobj.attribs.usermaxrow;

   plen = context.colpanes.length;
   if (plen>1 && context.colpanes[plen-1].first <= context.colpanes[plen-2].last)
       context.colpanes[plen-1].first = context.colpanes[plen-2].last+1;
   if (context.sheetobj.attribs.usermaxcol && context.colpanes[plen-1].first > context.sheetobj.attribs.usermaxcol)
       context.colpanes[plen-1].first = context.sheetobj.attribs.usermaxcol;

   }

SocialCalc.ScrollTableUpOneRow = function(editor) {

   var toprow, rowpane, rownum, colnum, colpane, cell, oldrownum, maxspan, newbottomrow, newrow, oldchild, bottomrownum;
   var rowneedsrefresh={};

   var context=editor.context;
   var sheetobj=context.sheetobj;
   var tableobj=editor.fullgrid;

   var tbodyobj;

   tbodyobj=tableobj.lastChild;

   toprow = context.showRCHeaders ? 2 : 1;
   for (rowpane=0; rowpane<context.rowpanes.length-1; rowpane++) {
      toprow += context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 2; // skip pane and spacing row
      }

   // abort if scrolling beyond user max row
   if (context.sheetobj.attribs.usermaxrow && (context.sheetobj.attribs.usermaxrow - context.rowpanes[rowpane].first < 1)) {
      return tableobj;
      }
  
   tbodyobj.removeChild(tbodyobj.childNodes[toprow]);

   context.rowpanes[rowpane].first++;
   context.rowpanes[rowpane].last++;
   editor.FitToEditTable();
   context.CalculateColWidthData(); // Just in case, since normally done in RenderSheet

   if (!context.sheetobj.attribs.usermaxrow || context.rowpanes[rowpane].last != context.sheetobj.attribs.usermaxrow) {
      newbottomrow = context.RenderRow(context.rowpanes[rowpane].last, rowpane);
      tbodyobj.appendChild(newbottomrow);
      }

   // if scrolled off a row with starting rowspans, replace rows for the largest rowspan

   maxrowspan = 1;
   oldrownum=context.rowpanes[rowpane].first - 1;

   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         coord=SocialCalc.crToCoord(colnum, oldrownum);
         if (context.cellskip[coord]) continue;
         cell=sheetobj.cells[coord];
         if (cell && cell.rowspan>maxrowspan) maxrowspan=cell.rowspan;
         }
      }

   if (maxrowspan>1) {
      for (rownum=1; rownum<maxrowspan; rownum++) {
         if (rownum+oldrownum >= context.rowpanes[rowpane].last) break;
         newrow=context.RenderRow(rownum+oldrownum, rowpane);
         oldchild=tbodyobj.childNodes[toprow+rownum-1];
         tbodyobj.replaceChild(newrow,oldchild);
         }
      }

   // if added a row that includes rowspans from above, update the size of those to include new row

   bottomrownum=context.rowpanes[rowpane].last;

   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         coord=context.cellskip[SocialCalc.crToCoord(colnum, bottomrownum)];
         if (!coord) continue; // only look at spanned cells
         rownum=context.coordToCR[coord].row-0;
         if (rownum==context.rowpanes[rowpane].last ||
             rownum<context.rowpanes[rowpane].first) continue; // this row (colspan) or starts above pane
         cell=sheetobj.cells[coord];
         if (cell && cell.rowspan>1) rowneedsrefresh[rownum]=true; // remember row num to update
         }
      }

   for (rownum in rowneedsrefresh) {
      newrow=context.RenderRow(rownum, rowpane);
      oldchild=tbodyobj.childNodes[(toprow+(rownum-context.rowpanes[rowpane].first))];
      tbodyobj.replaceChild(newrow,oldchild);
      }

   return tableobj;
   }

SocialCalc.ScrollTableDownOneRow = function(editor) {

   var toprow, rowpane, rownum, colnum, colpane, cell, newrownum, maxspan, newbottomrow, newrow, oldchild, bottomrownum;
   var rowneedsrefresh={};

   var context=editor.context;
   var sheetobj=context.sheetobj;
   var tableobj=editor.fullgrid;

   var tbodyobj;

   tbodyobj=tableobj.lastChild;

   toprow = context.showRCHeaders ? 2 : 1;
   for (rowpane=0; rowpane<context.rowpanes.length-1; rowpane++) {
      toprow += context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 2; // skip pane and spacing row
      }

   if (!context.sheetobj.attribs.usermaxrow) {
      tbodyobj.removeChild(tbodyobj.childNodes[toprow+(context.rowpanes[rowpane].last-context.rowpanes[rowpane].first)]);
      }

   context.rowpanes[rowpane].first--;
   context.rowpanes[rowpane].last--;
   editor.FitToEditTable();
   context.CalculateColWidthData(); // Just in case, since normally done in RenderSheet

   newrow = context.RenderRow(context.rowpanes[rowpane].first, rowpane);
   tbodyobj.insertBefore(newrow, tbodyobj.childNodes[toprow]);

   // if inserted a row with starting rowspans, replace rows for the largest rowspan

   maxrowspan = 1;
   newrownum=context.rowpanes[rowpane].first;

   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         coord=SocialCalc.crToCoord(colnum, newrownum);
         if (context.cellskip[coord]) continue;
         cell=sheetobj.cells[coord];
         if (cell && cell.rowspan>maxrowspan) maxrowspan=cell.rowspan;
         }
      }

   if (maxrowspan>1) {
      for (rownum=1; rownum<maxrowspan; rownum++) {
         if (rownum+newrownum > context.rowpanes[rowpane].last) break;
         newrow=context.RenderRow(rownum+newrownum, rowpane);
         oldchild=tbodyobj.childNodes[toprow+rownum];
         tbodyobj.replaceChild(newrow,oldchild);
         }
      }

   // if last row now includes rowspans or rowspans from above, update the size of those to remove deleted row

   bottomrownum=context.rowpanes[rowpane].last;

   for (colpane=0; colpane<context.colpanes.length; colpane++) {
      for (colnum=context.colpanes[colpane].first; colnum<=context.colpanes[colpane].last; colnum++) {
         coord=SocialCalc.crToCoord(colnum, bottomrownum);
         cell=sheetobj.cells[coord];
         if (cell && cell.rowspan>1) {
            rowneedsrefresh[bottomrownum]=true; // need to update this row
            continue;
            }
         coord=context.cellskip[SocialCalc.crToCoord(colnum, bottomrownum)];
         if (!coord) continue; // only look at spanned cells
         rownum=context.coordToCR[coord].row-0;
         if (rownum==bottomrownum ||
             rownum<context.rowpanes[rowpane].first) continue; // this row (colspan) or starts above pane
         cell=sheetobj.cells[coord];
         if (cell && cell.rowspan>1) rowneedsrefresh[rownum]=true; // remember row num to update
         }
      }

   for (rownum in rowneedsrefresh) {
      newrow=context.RenderRow(rownum, rowpane);
      oldchild=tbodyobj.childNodes[(toprow+(rownum-context.rowpanes[rowpane].first))];
      tbodyobj.replaceChild(newrow,oldchild);
      }

   return tableobj;
   }


// *************************************
//
// InputBox class:
//
// This class deals with the text box for editing cell contents.
// It mainly controls a user input box for typed content and is used to interact with
// the keyboard code, etc.
//
// You can use this inside a formula bar control of some sort.
// You create this after you have created a table editor object (but not necessarily 
// done the CreateTableEditor method).
//
// When the user starts typing text, or double-clicks on a cell, this object
// comes into play.
//
// The element given when this is first constructed should be an input HTMLElement or
// something that acts like one. Check the code here to see what is done to it.
//
// *************************************

SocialCalc.InputBox = function(element, editor) {

   if (!element) return; // invoked without enough data to work

   this.element = element; // the input element associated with this InputBox
   this.editor = editor; // the TableEditor this belongs to
   this.inputEcho = null;

   editor.inputBox = this;

   element.onmousedown = SocialCalc.InputBoxOnMouseDown;

   editor.MoveECellCallback.formulabar = function(e){
      if (e.state!="start") return; // if not in normal keyboard mode don't replace formula bar
      editor.inputBox.DisplayCellContents(e.ecell.coord);
      };
   }


// Methods:

SocialCalc.InputBox.prototype.DisplayCellContents = function(coord) {SocialCalc.InputBoxDisplayCellContents(this, coord);};
SocialCalc.InputBox.prototype.ShowInputBox = function(show) {this.editor.inputEcho.ShowInputEcho(show);};
SocialCalc.InputBox.prototype.GetText = function() {return this.element.value;};
SocialCalc.InputBox.prototype.SetText = function(newtext) {
   if (!this.element) return;
   this.element.value=newtext;
   this.editor.inputEcho.SetText(newtext+"_");
   };
SocialCalc.InputBox.prototype.Focus = function() {SocialCalc.InputBoxFocus(this);};
SocialCalc.InputBox.prototype.Blur = function() {return this.element.blur();};
SocialCalc.InputBox.prototype.Select = function(t) {
   if (!this.element) return;
   switch (t) {
      case "end":
         if (document.selection && document.selection.createRange) {
            /* IE 4+ - Safer than setting .selectionEnd as it also works for Textareas. */
            try {
               var range = document.selection.createRange().duplicate();
               range.moveToElementText(this.element);
               range.collapse(false);
               range.select();
            }
            catch (e) {
               if (this.element.selectionStart!=undefined) {
                  this.element.selectionStart=this.element.value.length;
                  this.element.selectionEnd=this.element.value.length;
               }
            }
         } else if (this.element.selectionStart!=undefined) {
            this.element.selectionStart=this.element.value.length;
            this.element.selectionEnd=this.element.value.length;
         }
         break;
      }
   };

// Functions:

//
// SocialCalc.InputBoxDisplayCellContents(inputbox, coord)
//
// Sets input box to the contents of the specified cell (or ecell if null).
//

SocialCalc.InputBoxDisplayCellContents = function(inputbox, coord) {

   var scc = SocialCalc.Constants;

   if (!inputbox) return;
   if (!coord) coord = inputbox.editor.ecell.coord;
   var text = SocialCalc.GetCellContents(inputbox.editor.context.sheetobj, coord);
   if (text.indexOf("\n")!=-1) {
      text = scc.s_inputboxdisplaymultilinetext;
      inputbox.element.disabled = true;
      }
   else if (inputbox.editor.ECellReadonly()) {
      inputbox.element.disabled = true;
      }
   else {
      inputbox.element.disabled = false;
      }
   inputbox.SetText(text);

   }

//
// SocialCalc.InputBoxFocus(inputbox)
//
// Call this to have the input box get the focus and respond to keystrokes
// but still pass them off to SocialCalc.ProcessKey.
//

SocialCalc.InputBoxFocus = function(inputbox) {

   if (!inputbox) return;
   inputbox.element.focus();
   var editor = inputbox.editor;
   editor.state = "input";
   var wval = editor.workingvalues;
   wval.partialexpr = "";
   wval.ecoord = editor.ecell.coord;
   wval.erow = editor.ecell.row;
   wval.ecol = editor.ecell.col;

   };

//
// SocialCalc.InputBoxOnMouseDown(e)
//
// This is called when the input box gets the focus. It then responds to keystrokes
// and pass them off to SocialCalc.ProcessKey, but in a different editing state.
//

SocialCalc.InputBoxOnMouseDown = function(e) {

   var editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
   if (!editor) return true; // we're not handling it -- let browser do default
   var wval = editor.workingvalues;

   switch (editor.state) {
      case "start":
         editor.state="inputboxdirect";
         wval.partialexpr = "";
         wval.ecoord = editor.ecell.coord;
         wval.erow = editor.ecell.row;
         wval.ecol = editor.ecell.col;
         editor.inputEcho.ShowInputEcho(true);
         break;

      case "input":
         wval.partialexpr = ""; // make sure not pointing
         editor.MoveECell(wval.ecoord);
         editor.state="inputboxdirect";
         SocialCalc.KeyboardFocus(); // may have come here from outside of grid
         break;

      case "inputboxdirect":
         break;
      }
   }


// *************************************
//
// InputEcho class:
//
// This object creates and controls an element that echos what's in the InputBox during editing
// It is draggable.
//
// *************************************

SocialCalc.InputEcho = function(editor) {

   var scc = SocialCalc.Constants;

   this.editor = editor; // the TableEditor this belongs to
   this.text = ""; // current value of what is displayed
   this.interval = null; // timer handle

   this.container = null; // element containing main echo as well as prompt line
   this.main = null; // main echo area
   this.prompt = null;

   this.functionbox = null; // function chooser dialog

   this.container = document.createElement("div");
   SocialCalc.setStyles(this.container, "display:none;position:absolute;zIndex:10;");

   this.main = document.createElement("div");
   if (scc.defaultInputEchoClass) this.main.className = scc.defaultInputEchoClass;
   if (scc.defaultInputEchoStyle) SocialCalc.setStyles(this.main, scc.defaultInputEchoStyle);
   this.main.innerHTML = "&nbsp;";

   this.container.appendChild(this.main);

   this.prompt = document.createElement("div");
   if (scc.defaultInputEchoPromptClass) this.prompt.className = scc.defaultInputEchoPromptClass;
   if (scc.defaultInputEchoPromptStyle) SocialCalc.setStyles(this.prompt, scc.defaultInputEchoPromptStyle);
   this.prompt.innerHTML = "";

   this.container.appendChild(this.prompt);

   SocialCalc.DragRegister(this.main, true, true, 
                 {MouseDown: SocialCalc.DragFunctionStart, 
                  MouseMove: SocialCalc.DragFunctionPosition,
                  MouseUp: SocialCalc.DragFunctionPosition,
                  Disabled: null, positionobj: this.container},
                  this.editor.toplevel);

   editor.toplevel.appendChild(this.container);

   }

// Methods:

SocialCalc.InputEcho.prototype.ShowInputEcho = function(show) {return SocialCalc.ShowInputEcho(this, show);};
SocialCalc.InputEcho.prototype.SetText = function(str) {return SocialCalc.SetInputEchoText(this, str);};

// Functions:

SocialCalc.ShowInputEcho = function(inputecho, show) {

   var cell, position;
   var editor = inputecho.editor;

   if (!editor) return;

   if (show) {
      editor.cellhandles.ShowCellHandles(false);
      cell=SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
      if (cell) {
         position = SocialCalc.GetElementPosition(cell.element);
         inputecho.container.style.left = (position.left-1)+"px";
         inputecho.container.style.top = (position.top-1)+"px";
         }
      inputecho.container.style.display = "block";
      if (inputecho.interval) window.clearInterval(inputecho.interval); // just in case
      inputecho.interval = window.setInterval(SocialCalc.InputEchoHeartbeat, 50);
      }
   else {
      if (inputecho.interval) window.clearInterval(inputecho.interval);
      inputecho.container.style.display = "none";
      }

   }

SocialCalc.SetInputEchoText = function(inputecho, str) {

   var scc = SocialCalc.Constants;
   var fname, fstr;
   var newstr = SocialCalc.special_chars(str);
   newstr = newstr.replace(/\n/g,"<br>");

   if (inputecho.text != newstr) {
      inputecho.main.innerHTML = newstr;
      inputecho.text = newstr;
      }

   var parts = str.match(/.*[\+\-\*\/\&\^\<\>\=\,\(]([A-Za-z][A-Za-z][\w\.]*?)\([^\)]*$/);
   if (str.charAt(0)=="=" && parts) {
      fname = parts[1].toUpperCase();
      if (SocialCalc.Formula.FunctionList[fname]) {
         SocialCalc.Formula.FillFunctionInfo(); //  make sure filled
         fstr = SocialCalc.special_chars(fname+"("+SocialCalc.Formula.FunctionArgString(fname)+")");
         }
      else {
         fstr = scc.ietUnknownFunction+fname;
         }
      if (inputecho.prompt.innerHTML != fstr) {
         inputecho.prompt.innerHTML = fstr;
         inputecho.prompt.style.display = "block";
         }
      }
   else if (inputecho.prompt.style.display != "none") {
      inputecho.prompt.innerHTML = "";
      inputecho.prompt.style.display = "none";
      }

   }

SocialCalc.InputEchoHeartbeat = function() {

   var editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
   if (!editor) return true; // we're not handling it -- let browser do default

   editor.inputEcho.SetText(editor.inputBox.GetText()+"_");

   }

SocialCalc.InputEchoMouseDown = function(e) {
      var event = e || window.event;

      var editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
      if (!editor) return true; // we're not handling it -- let browser do default

//      if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
//      else event.cancelBubble = true; // IE 5+
//      if (event.preventDefault) event.preventDefault(); // DOM Level 2
//      else event.returnValue = false; // IE 5+

      editor.inputBox.element.focus();

//      return false;
      };


// *************************************
//
// CellHandles class:
//
// This object creates and controls the elements around the cursor cell for dragging, etc.
//
// *************************************

SocialCalc.CellHandles = function(editor) {

   var scc = SocialCalc.Constants;
   var functions;

   if (editor.noEdit) return; // leave us with nothing

   this.editor = editor; // the TableEditor this belongs to

   this.noCursorSuffix = false;

   this.movedmouse = false; // used to detect no-op

   this.draghandle = document.createElement("div");
   SocialCalc.setStyles(this.draghandle, "display:none;position:absolute;zIndex:8;border:1px solid white;width:4px;height:4px;fontSize:1px;backgroundColor:#0E93D8;cursor:default;");
   this.draghandle.innerHTML = '&nbsp;';
   editor.toplevel.appendChild(this.draghandle);
   SocialCalc.AssignID(editor, this.draghandle, "draghandle");

   var imagetype = "png";
   if (navigator.userAgent.match(/MSIE 6\.0/)) {
      imagetype = "gif";
      }

   this.dragpalette = document.createElement("div");
   SocialCalc.setStyles(this.dragpalette, "display:none;position:absolute;zIndex:8;width:90px;height:90px;fontSize:1px;textAlign:center;cursor:default;"+
      "backgroundImage:url("+SocialCalc.Constants.defaultImagePrefix+"drag-handles."+imagetype+");");
   this.dragpalette.innerHTML = '&nbsp;';
   editor.toplevel.appendChild(this.dragpalette);
   SocialCalc.AssignID(editor, this.dragpalette, "dragpalette");

   this.dragtooltip = document.createElement("div");
   SocialCalc.setStyles(this.dragtooltip, "display:none;position:absolute;zIndex:9;border:1px solid black;width:100px;height:auto;fontSize:10px;backgroundColor:#FFFFFF;");
   this.dragtooltip.innerHTML = '&nbsp;';
   editor.toplevel.appendChild(this.dragtooltip);
   SocialCalc.AssignID(editor, this.dragtooltip, "dragtooltip");

   this.fillinghandle = document.createElement("div");
   SocialCalc.setStyles(this.fillinghandle, "display:none;position:absolute;zIndex:9;border:1px solid black;width:auto;height:14px;fontSize:10px;backgroundColor:#FFFFFF;");
   this.fillinghandle.innerHTML = '&nbsp;';
   editor.toplevel.appendChild(this.fillinghandle);
   SocialCalc.AssignID(editor, this.fillinghandle, "fillinghandle");

   if (this.draghandle.addEventListener) { // DOM Level 2 -- Firefox, et al
      this.draghandle.addEventListener("mousemove", SocialCalc.CellHandlesMouseMoveOnHandle, false);
      this.dragpalette.addEventListener("mousedown", SocialCalc.CellHandlesMouseDown, false);
      this.dragpalette.addEventListener("mousemove", SocialCalc.CellHandlesMouseMoveOnHandle, false);
      }
   else if (this.draghandle.attachEvent) { // IE 5+
      this.draghandle.attachEvent("onmousemove", SocialCalc.CellHandlesMouseMoveOnHandle);
      this.dragpalette.attachEvent("onmousedown", SocialCalc.CellHandlesMouseDown);
      this.dragpalette.attachEvent("onmousemove", SocialCalc.CellHandlesMouseMoveOnHandle);
      }
   else { // don't handle this
      throw "Browser not supported";
      }

   }

// Methods:

SocialCalc.CellHandles.prototype.ShowCellHandles = function(show, moveshow) {return SocialCalc.ShowCellHandles(this, show, moveshow);};

// Functions:

SocialCalc.ShowCellHandles = function(cellhandles, show, moveshow) {

   var cell, cell2, position, position2;
   var editor = cellhandles.editor;
   var doshow = false;
   var row, col;
   var colinc = 1, rowinc = 1;

   if (!editor) return;

   do { // a block that can you can "break" out of easily

      if (!show) break;

      row = editor.ecell.row;
      col = editor.ecell.col;

      if (editor.state != "start") break;
      if (row >= editor.lastvisiblerow) break;
      if (col >= editor.lastvisiblecol) break;
      if (row < editor.firstscrollingrow) break;
      if (col < editor.firstscrollingcol) break;

      // Go beyond one column if hidden.
      while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col+colinc)] == "yes") {
         colinc++; 
         }     

      // Go beyond one row if hidden.
      while (editor.context.sheetobj.rowattribs.hide[row+rowinc] == "yes") {
         rowinc++; 
         }     

      // Check colspan and rowspan.
      cell = editor.context.sheetobj.cells[SocialCalc.crToCoord(col+colinc-1, row+rowinc-1)];
      if (typeof cell != "undefined") {
         colinc += (cell.colspan || 1) - 1;
         rowinc += (cell.rowspan || 1) - 1;
         }

      if (editor.rowpositions[row+rowinc]+20>editor.horizontaltablecontrol.controlborder) {
         break;
         }
      if (editor.rowpositions[row+rowinc]-10<editor.headposition.top) {
         break;
         }
      if (editor.colpositions[col+colinc]+20>editor.verticaltablecontrol.controlborder) {
         break;
         }
      if (editor.colpositions[col+colinc]-30<editor.headposition.left) {
         break;
         }

      cellhandles.draghandle.style.left = (editor.colpositions[col+colinc]-1)+"px";
      cellhandles.draghandle.style.top = (editor.rowpositions[row+rowinc]-1)+"px";
      cellhandles.draghandle.style.display = "block";

      if (moveshow) {
         cellhandles.draghandle.style.display = "none";
         cellhandles.dragpalette.style.left = (editor.colpositions[col+colinc]-45)+"px";
         cellhandles.dragpalette.style.top = (editor.rowpositions[row+rowinc]-45)+"px";
         cellhandles.dragpalette.style.display = "block";
         cellhandles.dragtooltip.style.left = (editor.colpositions[col+colinc]-45)+"px";
         cellhandles.dragtooltip.style.top = (editor.rowpositions[row+rowinc]+45)+"px";
         cellhandles.dragtooltip.style.display = "none";
         }

      doshow = true;

      }
   while (false); // only do once

   if (!doshow) {
      cellhandles.draghandle.style.display = "none";
      }
   if (!moveshow) {
      cellhandles.dragpalette.style.display = "none";
      cellhandles.dragtooltip.style.display = "none";
      }

   }

SocialCalc.CellHandlesMouseMoveOnHandle = function(e) {

   var scc = SocialCalc.Constants;

   var event = e || window.event;
   var target = event.target || event.srcElement

   var editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
   if (!editor) return true; // we're not handling it -- let browser do default
   var cellhandles = editor.cellhandles;
   if (!cellhandles.editor) return true; // no handles

   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;
   var clientY = event.clientY - pos.top;

   if (!editor.cellhandles.mouseDown) {
      editor.cellhandles.ShowCellHandles(true, true); // show move handles, too

      if (target == cellhandles.dragpalette) {
         var whichhandle = SocialCalc.SegmentDivHit([scc.CH_radius1, scc.CH_radius2], editor.cellhandles.dragpalette, clientX, clientY);
         if (whichhandle==0) { // off of active part of palette
            SocialCalc.CellHandlesHoverTimeout();
            return;
            }
         if (cellhandles.tooltipstimer) {
            window.clearTimeout(cellhandles.tooltipstimer);
            cellhandles.tooltipstimer = null;
            }
         cellhandles.tooltipswhichhandle = whichhandle;
         cellhandles.tooltipstimer = window.setTimeout(SocialCalc.CellHandlesTooltipsTimeout, 700);
         }

      if (cellhandles.timer) {
         window.clearTimeout(cellhandles.timer);
         cellhandles.timer = null;
         }
      cellhandles.timer = window.setTimeout(SocialCalc.CellHandlesHoverTimeout, 3000);
   }

   return;

   }

//
// whichsegment = SocialCalc.SegmentDivHit(segtable, divWithMouseHit, x, y)
//
// Takes segtable = [upperleft quadrant, upperright, bottomright, bottomleft]
//  where each quadrant is either:
//      0 = ignore hits here
//      number = return this value
//      array = a new segtable for this subquadrant
//
// Alternatively, segtable can be:
//  [radius 1, radius 2] and it returns 0 if no hit,
//  -1, -2, -3, -4 for inner quadrants, and +1...+4 for outer quadrants
//

SocialCalc.SegmentDivHit = function(segtable, divWithMouseHit, x, y) {

   var width = divWithMouseHit.offsetWidth;
   var height = divWithMouseHit.offsetHeight;
   var left = divWithMouseHit.offsetLeft;
   var top = divWithMouseHit.offsetTop;
   var v = 0;
   var table = segtable;
   var len = Math.sqrt(Math.pow(x-left-(width/2.0-.5), 2)+Math.pow(y-top-(height/2.0-.5), 2));

   if (table.length==2) { // type 2 segtable
      if (x >= left && x < left+width/2 && y >= top && y < top+height/2) { // upper left
         if (len <= segtable[0]) v = -1;
         else if (len <= segtable[1]) v = 1;
         }
      if (x >= left+width/2 && x < left+width && y >= top && y < top+height/2) { // upper right
         if (len <= segtable[0]) v = -2;
         else if (len <= segtable[1]) v = 2;
         }
      if (x >= left+width/2 && x < left+width && y >= top+height/2 && y < top+height) { // bottom right
         if (len <= segtable[0]) v = -3;
         else if (len <= segtable[1]) v = 3;
         }
      if (x >= left && x < left+width/2 && y >= top+height/2 && y < top+height) { // bottom right
         if (len <= segtable[0]) v = -4;
         else if (len <= segtable[1]) v = 4;
         }
      return v;
      }

   while (true) {
      if (x >= left && x < left+width/2 && y >= top && y < top+height/2) { // upper left
         quadrant += "1";
         v = table[0];
         if (typeof v == "number") {
            break;
            }
         table = v;
         width = width/2;
         height = height/2;
         continue;
         }
      if (x >= left+width/2 && x < left+width && y >= top && y < top+height/2) { // upper right
         quadrant += "2";
         v = table[1];
         if (typeof v == "number") {
            break;
            }
         table = v;
         width = width/2;
         left = left+width;
         height = height/2;
         continue;
         }
      if (x >= left+width/2 && x < left+width && y >= top+height/2 && y < top+height) { // bottom right
         quadrant += "3";
         v = table[2];
         if (typeof v == "number") {
            break;
            }
         table = v;
         width = width/2;
         left = left + width;
         height = height/2;
         top = top + height;
         continue;
         }
      if (x >= left && x < left+width/2 && y >= top+height/2 && y < top+height) { // bottom right
         quadrant += "4";
         v = table[3];
         if (typeof v == "number") {
            break;
            }
         table = v;
         width = width/2;
         height = height/2;
         top = top + height;
         continue;
         }
      return 0; // didn't match
      }

//addmsg((x-divWithMouseHit.offsetLeft)+","+(y-divWithMouseHit.offsetTop)+"="+quadrant+" "+v);
   return v;

}

SocialCalc.CellHandlesHoverTimeout = function() {

   editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
   if (!editor) return true; // we're not handling it -- let browser do default
   var cellhandles = editor.cellhandles;
   if (cellhandles.timer) {
      window.clearTimeout(cellhandles.timer);
      cellhandles.timer = null;
      }
   if (cellhandles.tooltipstimer) {
      window.clearTimeout(cellhandles.tooltipstimer);
      cellhandles.tooltipstimer = null;
      }
   editor.cellhandles.ShowCellHandles(true, false); // hide move handles

}

SocialCalc.CellHandlesTooltipsTimeout = function() {

   editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
   if (!editor) return true; // we're not handling it -- let browser do default
   var cellhandles = editor.cellhandles;
   if (cellhandles.tooltipstimer) {
      window.clearTimeout(cellhandles.tooltipstimer);
      cellhandles.tooltipstimer = null;
      }

   var whichhandle = cellhandles.tooltipswhichhandle;
   if (whichhandle==0) { // off of active part of palette
      SocialCalc.CellHandlesHoverTimeout();
      return;
      }
   if (whichhandle==-3) {
      cellhandles.dragtooltip.innerHTML = scc.s_CHfillAllTooltip;
      }
   else if (whichhandle==3) {
      cellhandles.dragtooltip.innerHTML = scc.s_CHfillContentsTooltip;
      }
   else if (whichhandle==-2) {
      cellhandles.dragtooltip.innerHTML = scc.s_CHmovePasteAllTooltip;
      }
   else if (whichhandle==-4) {
      cellhandles.dragtooltip.innerHTML = scc.s_CHmoveInsertAllTooltip;
      }
   else if (whichhandle==2) {
      cellhandles.dragtooltip.innerHTML = scc.s_CHmovePasteContentsTooltip;
      }
   else if (whichhandle==4) {
      cellhandles.dragtooltip.innerHTML = scc.s_CHmoveInsertContentsTooltip;
      }
   else {
      cellhandles.dragtooltip.innerHTML = "&nbsp;";
      cellhandles.dragtooltip.style.display = "none";
      return;
      }

   cellhandles.dragtooltip.style.display = "block";

}

SocialCalc.CellHandlesMouseDown = function(e) {

   var scc = SocialCalc.Constants;
   var editor, result, coord, textarea, wval, range;

   var event = e || window.event;

   var mouseinfo = SocialCalc.EditorMouseInfo;

   editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
   if (!editor) return true; // we're not handling it -- let browser do default

   if (editor.busy) return; // don't do anything when busy (is this correct?)

   var cellhandles = editor.cellhandles;

   cellhandles.movedmouse = false; // detect no-op

   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;
   var clientY = event.clientY - pos.top;

   if (cellhandles.timer) { // cancel timer
      window.clearTimeout(cellhandles.timer);
      cellhandles.timer = null;
      }
   if (cellhandles.tooltipstimer) {
      window.clearTimeout(cellhandles.tooltipstimer);
      cellhandles.tooltipstimer = null;
      }
   cellhandles.dragtooltip.innerHTML = "&nbsp;";
   cellhandles.dragtooltip.style.display = "none";

   range = editor.range;
 
   var whichhandle = SocialCalc.SegmentDivHit([scc.CH_radius1, scc.CH_radius2], editor.cellhandles.dragpalette, clientX, clientY);
   if (whichhandle==1 || whichhandle==-1 || whichhandle==0) {
      cellhandles.ShowCellHandles(true, false); // hide move handles
      return;
      }

   mouseinfo.ignore = true; // stop other code from looking at the mouse

   if (whichhandle==-3) {
      cellhandles.dragtype = "Fill";
//      mouseinfo.element = editor.cellhandles.fillhandle;
      cellhandles.noCursorSuffix = false;
      }
   else if (whichhandle==3) {
      cellhandles.dragtype = "FillC";
//      mouseinfo.element = editor.cellhandles.fillhandle;
      cellhandles.noCursorSuffix = false;
      }
   else if (whichhandle==-2) {
      cellhandles.dragtype = "Move";
//      mouseinfo.element = editor.cellhandles.movehandle1;
      cellhandles.noCursorSuffix = true;
      }
   else if (whichhandle==-4) {
      cellhandles.dragtype = "MoveI";
//      mouseinfo.element = editor.cellhandles.movehandle2;
      cellhandles.noCursorSuffix = false;
      }
   else if (whichhandle==2) {
      cellhandles.dragtype = "MoveC";
//      mouseinfo.element = editor.cellhandles.movehandle1;
      cellhandles.noCursorSuffix = true;
      }
   else if (whichhandle==4) {
      cellhandles.dragtype = "MoveIC";
//      mouseinfo.element = editor.cellhandles.movehandle2;
      cellhandles.noCursorSuffix = false;
      }

   cellhandles.filltype = null;

   switch (cellhandles.dragtype) {
      case "Fill":
      case "FillC":
         if (!range.hasrange) {
            editor.RangeAnchor();
            }
         break;

      case "Move":
      case "MoveI":
      case "MoveC":
      case "MoveIC":
         if (!range.hasrange) {
            editor.RangeAnchor();
            }
         editor.range2.top = editor.range.top;
         editor.range2.right = editor.range.right;
         editor.range2.bottom = editor.range.bottom;
         editor.range2.left = editor.range.left;
         editor.range2.hasrange = true;
         editor.RangeRemove();
         break;

      default:
         return; // not for us
      }

   cellhandles.fillinghandle.style.left = (clientX)+"px";
   cellhandles.fillinghandle.style.top = (clientY - 17)+"px";
   cellhandles.fillinghandle.innerHTML = scc.s_CHindicatorOperationLookup[cellhandles.dragtype]+
                                         (scc.s_CHindicatorDirectionLookup[editor.cellhandles.filltype] || "");
   cellhandles.fillinghandle.style.display = "block";

   cellhandles.ShowCellHandles(true, false); // hide move handles
   cellhandles.mouseDown = true;

   mouseinfo.editor = editor; // remember for later

   coord = editor.ecell.coord; // start with cell with handles

   cellhandles.startingcoord = coord;
   cellhandles.startingX = clientX;
   cellhandles.startingY = clientY;

   mouseinfo.mouselastcoord = coord;

   SocialCalc.KeyboardSetFocus(editor);

   if (document.addEventListener) { // DOM Level 2 -- Firefox, et al
      document.addEventListener("mousemove", SocialCalc.CellHandlesMouseMove, true); // capture everywhere
      document.addEventListener("mouseup", SocialCalc.CellHandlesMouseUp, true); // capture everywhere
      }
   else if (cellhandles.draghandle.attachEvent) { // IE 5+
      cellhandles.draghandle.setCapture();
      cellhandles.draghandle.attachEvent("onmousemove", SocialCalc.CellHandlesMouseMove);
      cellhandles.draghandle.attachEvent("onmouseup", SocialCalc.CellHandlesMouseUp);
      cellhandles.draghandle.attachEvent("onlosecapture", SocialCalc.CellHandlesMouseUp);
      }
   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   return;

   }

SocialCalc.CellHandlesMouseMove = function(e) {

   var scc = SocialCalc.Constants;
   var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval;
   var crstart, crend, cr, c, r;

   var event = e || window.event;

   var mouseinfo = SocialCalc.EditorMouseInfo;
   editor = mouseinfo.editor;
   if (!editor) return; // not us, ignore
   var cellhandles = editor.cellhandles;

   element = mouseinfo.element;

   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;
   var clientY = event.clientY - pos.top;
   result = SocialCalc.GridMousePosition(editor, clientX, clientY); // get cell with move

   if (!result) return;

   if (result && !result.coord) {
      SocialCalc.SetDragAutoRepeat(editor, result, SocialCalc.CellHandlesDragAutoRepeat);
      return;
      }

   SocialCalc.SetDragAutoRepeat(editor, null); // stop repeating if it was

   if (!result.coord) return;

   crstart = SocialCalc.coordToCr(editor.cellhandles.startingcoord);
   crend = SocialCalc.coordToCr(result.coord);


   cellhandles.movedmouse = true; // did move, so not no-op

   switch (cellhandles.dragtype) {
      case "Fill":
      case "FillC":

         if (result.coord == cellhandles.startingcoord) { // reset when come back
            cellhandles.filltype = null;
            cellhandles.startingX = clientX;
            cellhandles.startingY = clientY;
            }
         else {
            if (cellhandles.filltype) { // moving and have already determined filltype
               if (cellhandles.filltype=="Down") { // coerse to that
                  crend.col = crstart.col;
                  if (crend.row < crstart.row) crend.row = crstart.row;
                  }
               else {
                  crend.row = crstart.row;
                  if (crend.col < crstart.col) crend.col = crstart.col;
                  }
               }
            else {
               if (Math.abs(clientY - cellhandles.startingY) > 10) {
                  cellhandles.filltype = "Down";
                  }
               else if (Math.abs(clientX - cellhandles.startingX) > 10) {
                  cellhandles.filltype = "Right";
                  }
               crend.col = crstart.col; // until decide, leave it at start
               crend.row = crstart.row;
               }
            }
         result.coord = SocialCalc.crToCoord(crend.col, crend.row);
         if (result.coord!=mouseinfo.mouselastcoord) {
            editor.MoveECell(result.coord);
            editor.RangeExtend();
            }
         break;

      case "Move":
      case "MoveC":
         if (result.coord!=mouseinfo.mouselastcoord) {
            editor.MoveECell(result.coord);
            c = editor.range2.right - editor.range2.left + result.col;
            r = editor.range2.bottom - editor.range2.top + result.row;
            editor.RangeAnchor(SocialCalc.crToCoord(c, r));
            editor.RangeExtend();
            }
         break;

      case "MoveI":
      case "MoveIC":
         if (result.coord == cellhandles.startingcoord) { // reset when come back
            cellhandles.filltype = null;
            cellhandles.startingX = clientX;
            cellhandles.startingY = clientY;
            }
         else {
            if (cellhandles.filltype) { // moving and have already determined filltype
               if (cellhandles.filltype=="Vertical") { // coerse to that
                  crend.col = editor.range2.left;
                  if (crend.row>=editor.range2.top && crend.row<=editor.range2.bottom+1) crend.row = editor.range2.bottom+2;
                  }
               else {
                  crend.row = editor.range2.top;
                  if (crend.col>=editor.range2.left && crend.col<=editor.range2.right+1) crend.col = editor.range2.right+2;
                  }
               }
            else {
               if (Math.abs(clientY - cellhandles.startingY) > 10) {
                  cellhandles.filltype = "Vertical";
                  }
               else if (Math.abs(clientX - cellhandles.startingX) > 10) {
                  cellhandles.filltype = "Horizontal";
                  }
               crend.col = crstart.col; // until decide, leave it at start
               crend.row = crstart.row;
               }
            }
         result.coord = SocialCalc.crToCoord(crend.col, crend.row);
         if (result.coord!=mouseinfo.mouselastcoord) {
            editor.MoveECell(result.coord);
            if (!cellhandles.filltype) { // no fill type
               editor.RangeRemove();
               }
            else {
               c = editor.range2.right - editor.range2.left + crend.col;
               r = editor.range2.bottom - editor.range2.top + crend.row;
               editor.RangeAnchor(SocialCalc.crToCoord(c, r));
               editor.RangeExtend();
               }
            }
         break;

      }


   cellhandles.fillinghandle.style.left = clientX+"px";
   cellhandles.fillinghandle.style.top = (clientY - 17)+"px";
   cellhandles.fillinghandle.innerHTML = scc.s_CHindicatorOperationLookup[cellhandles.dragtype]+
                                         (scc.s_CHindicatorDirectionLookup[editor.cellhandles.filltype] || "");
   cellhandles.fillinghandle.style.display = "block";

   mouseinfo.mouselastcoord = result.coord;

   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   return;

   }

SocialCalc.CellHandlesDragAutoRepeat = function(coord, direction) {

   var mouseinfo = SocialCalc.EditorMouseInfo;
   var editor = mouseinfo.editor;
   if (!editor) return; // not us, ignore
   var cellhandles = editor.cellhandles;

   var crstart = SocialCalc.coordToCr(editor.cellhandles.startingcoord);
   var crend = SocialCalc.coordToCr(coord);

   var newcoord, c, r;

   var vscroll = 0;
   var hscroll = 0;

   if (direction == "left") hscroll = -1;
   else if (direction == "right") hscroll = 1;
   else if (direction == "up") vscroll = -1;
   else if (direction == "down") vscroll = 1;
   editor.ScrollRelativeBoth(vscroll, hscroll);


   switch (cellhandles.dragtype) {
      case "Fill":
      case "FillC":
         if (cellhandles.filltype) { // moving and have already determined filltype
            if (cellhandles.filltype=="Down") { // coerse to that
               crend.col = crstart.col;
               if (crend.row < crstart.row) crend.row = crstart.row;
               }
            else {
               crend.row = crstart.row;
               if (crend.col < crstart.col) crend.col = crstart.col;
               }
            }
         else {
            crend.col = crstart.col; // until decide, leave it at start
            crend.row = crstart.row;
            }

         newcoord = SocialCalc.crToCoord(crend.col, crend.row);
         if (newcoord!=mouseinfo.mouselastcoord) {
            editor.MoveECell(coord);
            editor.RangeExtend();
            }
         break;

      case "Move":
      case "MoveC":
         if (coord!=mouseinfo.mouselastcoord) {
            editor.MoveECell(coord);
            c = editor.range2.right - editor.range2.left + editor.ecell.col;
            r = editor.range2.bottom - editor.range2.top + editor.ecell.row;
            editor.RangeAnchor(SocialCalc.crToCoord(c, r));
            editor.RangeExtend();
            }
         break;

      case "MoveI":
      case "MoveIC":
         if (cellhandles.filltype) { // moving and have already determined filltype
            if (cellhandles.filltype=="Vertical") { // coerse to that
               crend.col = editor.range2.left;
               if (crend.row>=editor.range2.top && crend.row<=editor.range2.bottom+1) crend.row = editor.range2.bottom+2;
               }
            else {
               crend.row = editor.range2.top;
               if (crend.col>=editor.range2.left && crend.col<=editor.range2.right+1) crend.col = editor.range2.right+2;
               }
            }
         else {
            crend.col = crstart.col; // until decide, leave it at start
            crend.row = crstart.row;
            }

         newcoord = SocialCalc.crToCoord(crend.col, crend.row);
         if (newcoord!=mouseinfo.mouselastcoord) {
            editor.MoveECell(newcoord);
            c = editor.range2.right - editor.range2.left + crend.col;
            r = editor.range2.bottom - editor.range2.top + crend.row;
            editor.RangeAnchor(SocialCalc.crToCoord(c, r));
            editor.RangeExtend();
            }
         break;

      }

   mouseinfo.mouselastcoord = newcoord;

   }

SocialCalc.CellHandlesMouseUp = function(e) {

   var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval, cstr, cmdtype, cmdtype2;
   var crstart, crend;
   var sizec, sizer, deltac, deltar;

   var event = e || window.event;

   var mouseinfo = SocialCalc.EditorMouseInfo;
   editor = mouseinfo.editor;
   if (!editor) return; // not us, ignore
   var cellhandles = editor.cellhandles;

   element = mouseinfo.element;

   mouseinfo.ignore = false;

   var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
   var clientX = event.clientX - pos.left;
   var clientY = event.clientY - pos.top;
   result = SocialCalc.GridMousePosition(editor, clientX, clientY); // get cell with up

   SocialCalc.SetDragAutoRepeat(editor, null); // stop repeating if it was

   cellhandles.mouseDown = false;
   cellhandles.noCursorSuffix = false;

   cellhandles.fillinghandle.style.display = "none";

   if (!result) result = {};
   if (!result.coord) result.coord = editor.ecell.coord;

   switch (cellhandles.dragtype) {
      case "Fill":
      case "Move":
      case "MoveI":
         cmdtype2 = " all";
            break;
      case "FillC":
      case "MoveC":
      case "MoveIC":
         cmdtype2 = " formulas";
         break;
      }

   if (!cellhandles.movedmouse) { // didn't move: just leave one cell selected
      cellhandles.dragtype = "Nothing";
      }

   switch (cellhandles.dragtype) {
      case "Nothing":
         editor.Range2Remove();
         editor.RangeRemove();
         break;

      case "Fill":
      case "FillC":

         crstart = SocialCalc.coordToCr(cellhandles.startingcoord);
         crend = SocialCalc.coordToCr(result.coord);
         if (cellhandles.filltype) {
            if (cellhandles.filltype=="Down") {
               crend.col = crstart.col;
               }
            else {
               crend.row = crstart.row;
               }
            }
         result.coord = SocialCalc.crToCoord(crend.col, crend.row);

         editor.MoveECell(result.coord);
         editor.RangeExtend();

         if (editor.cellhandles.filltype=="Right") {
            cmdtype = "right";
            }
         else {
            cmdtype = "down";
            }
         cstr = "fill"+cmdtype+" "+SocialCalc.crToCoord(editor.range.left, editor.range.top)+
                   ":"+SocialCalc.crToCoord(editor.range.right, editor.range.bottom)+cmdtype2;
         editor.EditorScheduleSheetCommands(cstr, true, false);
         break;

      case "Move":
      case "MoveC":
         editor.context.cursorsuffix = "";
         cstr = "movepaste "+
                     SocialCalc.crToCoord(editor.range2.left, editor.range2.top) + ":" +
                     SocialCalc.crToCoord(editor.range2.right, editor.range2.bottom)
                     +" "+editor.ecell.coord+cmdtype2;
         editor.EditorScheduleSheetCommands(cstr, true, false);
         editor.Range2Remove();

         break;

      case "MoveI":
      case "MoveIC":
         editor.context.cursorsuffix = "";
         sizec = editor.range2.right - editor.range2.left;
         sizer = editor.range2.bottom - editor.range2.top;
         deltac = editor.ecell.col - editor.range2.left;
         deltar = editor.ecell.row - editor.range2.top;
         cstr = "moveinsert "+
                     SocialCalc.crToCoord(editor.range2.left, editor.range2.top) + ":" +
                     SocialCalc.crToCoord(editor.range2.right, editor.range2.bottom)
                     +" "+editor.ecell.coord+cmdtype2;
         editor.EditorScheduleSheetCommands(cstr, true, false);
         editor.Range2Remove();
         editor.RangeRemove();
         if (editor.cellhandles.filltype==" Horizontal" && deltac > 0) {
            editor.MoveECell(SocialCalc.crToCoord(editor.ecell.col-sizec-1, editor.ecell.row));
            }
         else if (editor.cellhandles.filltype==" Vertical" && deltar > 0) {
            editor.MoveECell(SocialCalc.crToCoord(editor.ecell.col, editor.ecell.row-sizer-1));
            }
         editor.RangeAnchor(SocialCalc.crToCoord(editor.ecell.col+sizec, editor.ecell.row+sizer));
         editor.RangeExtend();

         break;

      }

   if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
   else event.cancelBubble = true; // IE 5+
   if (event.preventDefault) event.preventDefault(); // DOM Level 2
   else event.returnValue = false; // IE 5+

   if (document.removeEventListener) { // DOM Level 2
      document.removeEventListener("mousemove", SocialCalc.CellHandlesMouseMove, true);
      document.removeEventListener("mouseup", SocialCalc.CellHandlesMouseUp, true);
      }
   else if (cellhandles.draghandle.detachEvent) { // IE
      cellhandles.draghandle.detachEvent("onlosecapture", SocialCalc.CellHandlesMouseUp);
      cellhandles.draghandle.detachEvent("onmouseup", SocialCalc.CellHandlesMouseUp);
      cellhandles.draghandle.detachEvent("onmousemove", SocialCalc.CellHandlesMouseMove);
      cellhandles.draghandle.releaseCapture();
      }

   mouseinfo.editor = null;

   return false;

   }

// *************************************
//
// TableControl class:
//
// This class deals with the horizontal and verical scrollbars and pane sliders.
//
// +--------------+
// | Endcap       |
// +- - - - - - - +
// |              |
// +--------------+
// | Pane Slider  |
// +--------------+
// |              |
// | Less Button  |
// |              |
// +--------------+
// | Scroll Area  |
// |              |
// |              |
// +--------------+
// | Thumb        |
// +--------------+
// |              |
// +--------------+
// |              |
// | More Button  |
// |              |
// +--------------+
//
// *************************************

SocialCalc.TableControl = function(editor, vertical, size) {

   var scc = SocialCalc.Constants;

   this.editor = editor; // the TableEditor this belongs to

   this.vertical = vertical; // true if vertical control, false if horizontal
   this.size = size; // length in pixels

   this.main = null; // main element containing all the others
   this.endcap = null; // the area at the top/left between the end and the pane slider
   this.paneslider = null; // the slider to adjust the pane split
   this.lessbutton = null; // the top/left scroll button
   this.morebutton = null; // the bottom/right scroll button
   this.scrollarea = null; // the area between the scroll buttons
   this.thumb = null; // the sliding thing in the scrollarea

   // computed position values:

   this.controlborder = null; // left or top screen position for vertical or horizontal control
   this.endcapstart = null; // top or left screen position for vertical or horizontal control
   this.panesliderstart = null;
   this.lessbuttonstart = null;
   this.morebuttonstart = null;
   this.scrollareastart = null;
   this.scrollareaend = null;
   this.scrollareasize = null;
   this.thumbpos = null;

   // constants:

   this.controlthickness = scc.defaultTableControlThickness; // other dimension of complete control in pixels
   this.sliderthickness = scc.defaultTCSliderThickness;
   this.buttonthickness = scc.defaultTCButtonThickness;
   this.thumbthickness = scc.defaultTCThumbThickness;
   this.minscrollingpanesize = this.buttonthickness+this.buttonthickness+this.thumbthickness+20; // the 20 is to leave a little space

   }

// Methods:

SocialCalc.TableControl.prototype.CreateTableControl = function() {return SocialCalc.CreateTableControl(this);};
SocialCalc.TableControl.prototype.PositionTableControlElements = function() {SocialCalc.PositionTableControlElements(this);};
SocialCalc.TableControl.prototype.ComputeTableControlPositions = function() {SocialCalc.ComputeTableControlPositions(this);};

// Functions:

SocialCalc.CreateTableControl = function(control) {

   var s, functions, params;
   var AssignID = SocialCalc.AssignID;
   var setStyles = SocialCalc.setStyles;
   var scc = SocialCalc.Constants;
   var TooltipRegister = function(element, etype, vh) {
      if (scc["s_"+etype+"Tooltip"+vh]) {
         SocialCalc.TooltipRegister(element, scc["s_"+etype+"Tooltip"+vh], null, control.editor.toplevel);
         }
      }

   var imageprefix = control.editor.imageprefix;
   var vh = control.vertical ? "v" : "h";

   control.main = document.createElement("div");
   s = control.main.style;
   s.height = (control.vertical ? control.size : control.controlthickness)+"px";
   s.width = (control.vertical ? control.controlthickness : control.size)+"px";
   s.zIndex = 0;
   setStyles(control.main, scc.TCmainStyle);
   s.backgroundImage="url("+imageprefix+"main-"+vh+".gif)";
   if (scc.TCmainClass) control.main.className = scc.TCmainClass;

   control.main.style.display="none"; // wait for layout

   control.endcap = document.createElement("div");
   s = control.endcap.style;
   s.height = control.controlthickness+"px";
   s.width = control.controlthickness+"px";
   s.zIndex = 1;
   s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
   s.position = "absolute";
   setStyles(control.endcap, scc.TCendcapStyle);
   s.backgroundImage="url("+imageprefix+"endcap-"+vh+".gif)";
   if (scc.TCendcapClass) control.endcap.className = scc.TCendcapClass;
   AssignID(control.editor, control.endcap, "endcap"+vh);

   control.main.appendChild(control.endcap);

   control.paneslider = document.createElement("div");
   s = control.paneslider.style;
   s.height = (control.vertical ? control.sliderthickness : control.controlthickness)+"px";
   s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
   s.width = (control.vertical ? control.controlthickness : control.sliderthickness)+"px";
   s.position = "absolute";
   s[control.vertical?"top":"left"] = "4px";
   s.zIndex = 3;
   setStyles(control.paneslider, scc.TCpanesliderStyle);
   s.backgroundImage="url("+imageprefix+"paneslider-"+vh+".gif)";
   if (scc.TCpanesliderClass) control.paneslider.className = scc.TCpanesliderClass;
   AssignID(control.editor, control.paneslider, "paneslider"+vh);
   TooltipRegister(control.paneslider, "paneslider", vh);

   functions = {MouseDown:SocialCalc.TCPSDragFunctionStart,
                    MouseMove: SocialCalc.TCPSDragFunctionMove,
                    MouseUp: SocialCalc.TCPSDragFunctionStop,
                    Disabled: function() {return control.editor.busy;}};

   functions.control = control; // make sure this is there

   SocialCalc.DragRegister(control.paneslider, control.vertical, !control.vertical, functions, control.editor.toplevel);

   control.main.appendChild(control.paneslider);

   control.lessbutton = document.createElement("div");
   s = control.lessbutton.style;
   s.height = (control.vertical ? control.buttonthickness : control.controlthickness)+"px";
   s.width = (control.vertical ? control.controlthickness : control.buttonthickness)+"px";
   s.zIndex = 2;
   s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
   s.position = "absolute";
   setStyles(control.lessbutton, scc.TClessbuttonStyle);
   s.backgroundImage="url("+imageprefix+"less-"+vh+"n.gif)"
   if (scc.TClessbuttonClass) control.lessbutton.className = scc.TClessbuttonClass;
   AssignID(control.editor, control.lessbutton, "lessbutton"+vh);

   params = {repeatwait:scc.TClessbuttonRepeatWait, repeatinterval:scc.TClessbuttonRepeatInterval,
             normalstyle: "backgroundImage:url("+imageprefix+"less-"+vh+"n.gif);",
             downstyle: "backgroundImage:url("+imageprefix+"less-"+vh+"d.gif);",
             hoverstyle: "backgroundImage:url("+imageprefix+"less-"+vh+"h.gif);"};
   functions = {MouseDown:function(){if(!control.editor.busy) control.editor.ScrollRelative(control.vertical, -1);},
                Repeat:function(){if(!control.editor.busy) control.editor.ScrollRelative(control.vertical, -1);},
                Disabled: function() {return control.editor.busy;}};

   SocialCalc.ButtonRegister(control.editor, control.lessbutton, params, functions);

   control.main.appendChild(control.lessbutton);

   control.morebutton = document.createElement("div");
   s = control.morebutton.style;
   s.height = (control.vertical ? control.buttonthickness : control.controlthickness)+"px";
   s.width = (control.vertical ? control.controlthickness : control.buttonthickness)+"px";
   s.zIndex = 2;
   s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
   s.position = "absolute";
   setStyles(control.morebutton, scc.TCmorebuttonStyle);
   s.backgroundImage="url("+imageprefix+"more-"+vh+"n.gif)"
   if (scc.TCmorebuttonClass) control.morebutton.className = scc.TCmorebuttonClass;
   AssignID(control.editor, control.morebutton, "morebutton"+vh);

   params = {repeatwait:scc.TCmorebuttonRepeatWait, repeatinterval:scc.TCmorebuttonRepeatInterval,
             normalstyle: "backgroundImage:url("+imageprefix+"more-"+vh+"n.gif);",
             downstyle: "backgroundImage:url("+imageprefix+"more-"+vh+"d.gif);",
             hoverstyle: "backgroundImage:url("+imageprefix+"more-"+vh+"h.gif);"};
   functions = {MouseDown:function(){if(!control.editor.busy) control.editor.ScrollRelative(control.vertical, +1);},
                Repeat:function(){if(!control.editor.busy) control.editor.ScrollRelative(control.vertical, +1);},
                Disabled: function() {return control.editor.busy;}};

   SocialCalc.ButtonRegister(control.editor, control.morebutton, params, functions);

   control.main.appendChild(control.morebutton);

   control.scrollarea = document.createElement("div");
   s = control.scrollarea.style;
   s.height = control.controlthickness+"px";
   s.width = control.controlthickness+"px";
   s.zIndex = 1;
   s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
   s.position = "absolute";
   setStyles(control.scrollarea, scc.TCscrollareaStyle);
   s.backgroundImage="url("+imageprefix+"scrollarea-"+vh+".gif)";
   if (scc.TCscrollareaClass) control.scrollarea.className = scc.TCscrollareaClass;
   AssignID(control.editor, control.scrollarea, "scrollarea"+vh);

   params = {repeatwait:scc.TCscrollareaRepeatWait, repeatinterval:scc.TCscrollareaRepeatWait};
   functions = {MouseDown:SocialCalc.ScrollAreaClick, Repeat:SocialCalc.ScrollAreaClick,
                Disabled: function() {return control.editor.busy;}};
   functions.control = control;

   SocialCalc.ButtonRegister(control.editor, control.scrollarea, params, functions);

   control.main.appendChild(control.scrollarea);

   control.thumb = document.createElement("div");
   s = control.thumb.style;
   s.height =  (control.vertical ? control.thumbthickness : control.controlthickness)+"px";
   s.width = (control.vertical ? control.controlthickness : control.thumbthickness)+"px";
   s.zIndex = 2;
   s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
   s.position = "absolute";
   setStyles(control.thumb, scc.TCthumbStyle);
   control.thumb.style.backgroundImage="url("+imageprefix+"thumb-"+vh+"n.gif)";
   if (scc.TCthumbClass) control.thumb.className = scc.TCthumbClass;
   AssignID(control.editor, control.thumb, "thumb"+vh);

   functions = {MouseDown:SocialCalc.TCTDragFunctionStart,
                MouseMove: SocialCalc.TCTDragFunctionMove,
                MouseUp: SocialCalc.TCTDragFunctionStop,
                Disabled: function() {return control.editor.busy;}};
   functions.control = control; // make sure this is there
   SocialCalc.DragRegister(control.thumb, control.vertical, !control.vertical, functions, control.editor.toplevel);

   params = {normalstyle: "backgroundImage:url("+imageprefix+"thumb-"+vh+"n.gif)", name:"Thumb",
             downstyle:  "backgroundImage:url("+imageprefix+"thumb-"+vh+"d.gif)",
             hoverstyle:  "backgroundImage:url("+imageprefix+"thumb-"+vh+"h.gif)"};
   SocialCalc.ButtonRegister(control.editor, control.thumb, params, null); // give it button-like visual behavior

   control.main.appendChild(control.thumb);

   return control.main;

}

//
// ScrollAreaClick - Button function to process pageup/down clicks
//

SocialCalc.ScrollAreaClick = function(e, buttoninfo, bobj) {

   var control = bobj.functionobj.control;
   var pos = SocialCalc.GetElementPositionWithScroll(control.editor.toplevel);
   var clickpos = control.vertical ? buttoninfo.clientY-pos.top : buttoninfo.clientX-pos.left;
   if (control.editor.busy) { // ignore if busy - wait for next repeat
      return;
      }
   control.editor.PageRelative(control.vertical, clickpos > control.thumbpos ? 1 : -1);

   return;

}

//
// PositionTableControlElements
//

SocialCalc.PositionTableControlElements = function(control) {

   var border, realend, thumbpos;

   var editor = control.editor;

   if (control.vertical) {
      border = control.controlborder+"px";
      control.endcap.style.top = control.endcapstart+"px";
      control.endcap.style.left = border;
      control.paneslider.style.top = control.panesliderstart+"px";
      control.paneslider.style.left = border
      control.lessbutton.style.top = control.lessbuttonstart+"px";
      control.lessbutton.style.left = border;
      control.morebutton.style.top = control.morebuttonstart+"px";
      control.morebutton.style.left = border;
      control.scrollarea.style.top = control.scrollareastart+"px";
      control.scrollarea.style.left = border;
      control.scrollarea.style.height = control.scrollareasize+"px";
      realend = Math.max(editor.context.sheetobj.attribs.lastrow, editor.firstscrollingrow+1);
      thumbpos = ((editor.firstscrollingrow-(editor.lastnonscrollingrow+1))*(control.scrollareasize-3*control.thumbthickness))/
         (realend-(editor.lastnonscrollingrow+1))+control.scrollareastart-1;
      thumbpos = Math.floor(thumbpos);
      control.thumb.style.top = thumbpos+"px";
      control.thumb.style.left = border;
      }
   else {
      border = control.controlborder+"px";
      control.endcap.style.left = control.endcapstart+"px";
      control.endcap.style.top = border;
      control.paneslider.style.left = control.panesliderstart+"px";
      control.paneslider.style.top = border
      control.lessbutton.style.left = control.lessbuttonstart+"px";
      control.lessbutton.style.top = border;
      control.morebutton.style.left = control.morebuttonstart+"px";
      control.morebutton.style.top = border;
      control.scrollarea.style.left = control.scrollareastart+"px";
      control.scrollarea.style.top = border;
      control.scrollarea.style.width = control.scrollareasize+"px";
      realend = Math.max(editor.context.sheetobj.attribs.lastcol, editor.firstscrollingcol+1);
      thumbpos = ((editor.firstscrollingcol-(editor.lastnonscrollingcol+1))*(control.scrollareasize-control.thumbthickness))/
         (realend-editor.lastnonscrollingcol)+control.scrollareastart-1;
      thumbpos = Math.floor(thumbpos);
      control.thumb.style.left = thumbpos+"px";
      control.thumb.style.top = border;
      }
   control.thumbpos = thumbpos;
   control.main.style.display="block";

   }

//
// ComputeTableControlPositions
//
// This routine computes the screen positions and other values needed for laying out
// the table control elements.
//

SocialCalc.ComputeTableControlPositions = function(control) {

   var editor = control.editor;

   if (!editor.gridposition || !editor.headposition) throw("Can't compute table control positions before editor positions");

   if (control.vertical) {
      control.controlborder = editor.gridposition.left+editor.tablewidth; // border=left position
      control.endcapstart = editor.gridposition.top; // start=top position
      control.panesliderstart = editor.firstscrollingrowtop-control.sliderthickness;
      control.lessbuttonstart = editor.firstscrollingrowtop-1;
      control.morebuttonstart = editor.gridposition.top+editor.tableheight-control.buttonthickness;
      control.scrollareastart = editor.firstscrollingrowtop-1+control.buttonthickness;
      control.scrollareaend = control.morebuttonstart-1;
      control.scrollareasize = control.scrollareaend-control.scrollareastart+1;
      }
   else {
      control.controlborder = editor.gridposition.top+editor.tableheight; // border=top position
      control.endcapstart = editor.gridposition.left; // start=left position
      control.panesliderstart = editor.firstscrollingcolleft-control.sliderthickness;
      control.lessbuttonstart = editor.firstscrollingcolleft-1;
      control.morebuttonstart = editor.gridposition.left+editor.tablewidth-control.buttonthickness;
      control.scrollareastart = editor.firstscrollingcolleft-1+control.buttonthickness;
      control.scrollareaend = control.morebuttonstart-1;
      control.scrollareasize = control.scrollareaend-control.scrollareastart+1;
      }
   }

////// TCPS - TableControl Pan Slider methods

//
// TCPSDragFunctionStart(event, draginfo, dobj)
//
// TableControlPaneSlider function for starting drag
//

SocialCalc.TCPSDragFunctionStart = function(event, draginfo, dobj) {

   var editor = dobj.functionobj.control.editor;
   var scc = SocialCalc.Constants;

   SocialCalc.DragFunctionStart(event, draginfo, dobj);

   draginfo.trackingline = document.createElement("div");
   draginfo.trackingline.style.height = dobj.vertical ? scc.TCPStrackinglineThickness :
      (editor.tableheight-(editor.headposition.top-editor.gridposition.top))+"px";
   draginfo.trackingline.style.width = dobj.vertical ? 
      (editor.tablewidth-(editor.headposition.left-editor.gridposition.left))+"px" : scc.TCPStrackinglineThickness;
   draginfo.trackingline.style.backgroundImage="url("+editor.imageprefix+"trackingline-"+(dobj.vertical?"v":"h")+".gif)";;
   if (scc.TCPStrackinglineClass) {
     draginfo.trackingline.className = 'trackingline ' + scc.TCPStrackinglineClass;
   } else {
     draginfo.trackingline.className = 'trackingline';
   }
   SocialCalc.setStyles(draginfo.trackingline, scc.TCPStrackinglineStyle);

   if (dobj.vertical) {
      row = SocialCalc.Lookup(draginfo.clientY+dobj.functionobj.control.sliderthickness, editor.rowpositions);
      draginfo.trackingline.style.top = (editor.rowpositions[row] || editor.headposition.top)+"px";
      draginfo.trackingline.style.left = editor.headposition.left+"px";
      if (editor.context.rowpanes.length-1) { // has 2 already
         editor.context.SetRowPaneFirstLast(1, editor.context.rowpanes[0].last+1, editor.context.rowpanes[0].last+1);
         editor.FitToEditTable();
         editor.ScheduleRender();
         }
      }
   else {
      col = SocialCalc.Lookup(draginfo.clientX+dobj.functionobj.control.sliderthickness, editor.colpositions);
      draginfo.trackingline.style.top = editor.headposition.top+"px";
      draginfo.trackingline.style.left = (editor.colpositions[col] || editor.headposition.left)+"px";
      if (editor.context.colpanes.length-1) { // has 2 already
         editor.context.SetColPaneFirstLast(1, editor.context.colpanes[0].last+1, editor.context.colpanes[0].last+1);
         editor.FitToEditTable();
         editor.ScheduleRender();
         }
      }

   editor.griddiv.appendChild(draginfo.trackingline);

   }

//
// TCPSDragFunctionMove(event, draginfo, dobj)
//

SocialCalc.TCPSDragFunctionMove = function(event, draginfo, dobj) {

   var row, col, max, min;
   var control = dobj.functionobj.control;
   var sliderthickness = control.sliderthickness;
   var editor = control.editor;

   if (dobj.vertical) {
      max = control.morebuttonstart - control.minscrollingpanesize - draginfo.offsetY; // restrict movement
      if (draginfo.clientY > max) draginfo.clientY = max;
      min = editor.headposition.top - sliderthickness - draginfo.offsetY;
      if (draginfo.clientY < min) draginfo.clientY = min;

      row = SocialCalc.Lookup(draginfo.clientY+sliderthickness, editor.rowpositions);

      // Handle hidden row.
      while (editor.context.sheetobj.rowattribs.hide[row] == "yes") {
         row++;
         }

      draginfo.trackingline.style.top = (editor.rowpositions[row] || editor.headposition.top)+"px";
      }
   else {
      max = control.morebuttonstart - control.minscrollingpanesize - draginfo.offsetX;
      if (draginfo.clientX > max) draginfo.clientX = max;
      min = editor.headposition.left - sliderthickness - draginfo.offsetX;
      if (draginfo.clientX < min) draginfo.clientX = min;

      col = SocialCalc.Lookup(draginfo.clientX+sliderthickness, editor.colpositions);

      // Handle hidden column.
      while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == "yes") {
         col++;
         }

      draginfo.trackingline.style.left = (editor.colpositions[col] || editor.headposition.left)+"px";
      }

   SocialCalc.DragFunctionPosition(event, draginfo, dobj);

   }

//
// TCPSDragFunctionStop(event, draginfo, dobj)
//

SocialCalc.TCPSDragFunctionStop = function(event, draginfo, dobj) {

   var row, col, max, min, dc;
   var control = dobj.functionobj.control;
   var sliderthickness = control.sliderthickness;
   var editor = control.editor;

   if (dobj.vertical) {
     max = control.morebuttonstart - control.minscrollingpanesize - draginfo.offsetY; // restrict movement
     if (draginfo.clientY > max) draginfo.clientY = max;
     min = editor.headposition.top - sliderthickness - draginfo.offsetY;
     if (draginfo.clientY < min) draginfo.clientY = min;

     row = SocialCalc.Lookup(draginfo.clientY+sliderthickness, editor.rowpositions);
     if (row>editor.context.sheetobj.attribs.lastrow) row=editor.context.sheetobj.attribs.lastrow; // can't extend sheet here

     // Handle hidden row.
     while (editor.context.sheetobj.rowattribs.hide[row] == "yes") {
       row++;
     }


     editor.EditorScheduleSheetCommands('pane row ' + row, true, false);
   }
   else {
     max = control.morebuttonstart - control.minscrollingpanesize - draginfo.offsetX;
     if (draginfo.clientX > max) draginfo.clientX = max;
     min = editor.headposition.left - sliderthickness - draginfo.offsetX;
     if (draginfo.clientX < min) draginfo.clientX = min;

     col = SocialCalc.Lookup(draginfo.clientX+sliderthickness, editor.colpositions);
     if (col>editor.context.sheetobj.attribs.lastcol) col=editor.context.sheetobj.attribs.lastcol; // can't extend sheet here

     // Handle hidden column.
     while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == "yes") {
       col++;
     }

     editor.EditorScheduleSheetCommands('pane col ' + col, true, false);
   }

   }

////// TCT - TableControl Thumb methods

//!!!! Note: Need to make start use same code as move/stop for determining row/col, since stop will set that
//!!!! Note: Need to make start/move/stop use positioning code that corresponds closer to
//!!!!       ComputeTableControlPositions calculations.

//
// TCTDragFunctionStart(event, draginfo, dobj)
//
// TableControlThumb function for starting drag
//

SocialCalc.TCTDragFunctionStart = function(event, draginfo, dobj) {

   var rowpane, colpane, row, col;

   var control = dobj.functionobj.control;
   var editor = control.editor;
   var scc = SocialCalc.Constants;

   SocialCalc.DragFunctionStart(event, draginfo, dobj);

   if (draginfo.thumbstatus) { // get rid of old one if mouseup was out of window
      if (draginfo.thumbstatus.rowmsgele) draginfo.thumbstatus.rowmsgele = null;
      if (draginfo.thumbstatus.rowpreviewele) draginfo.thumbstatus.rowpreviewele = null;
      editor.toplevel.removeChild(draginfo.thumbstatus);
      draginfo.thumbstatus = null;
      }

   draginfo.thumbstatus = document.createElement("div");

   if (dobj.vertical) {
      if (scc.TCTDFSthumbstatusvClass) draginfo.thumbstatus.className = scc.TCTDFSthumbstatusvClass;
      SocialCalc.setStyles(draginfo.thumbstatus, scc.TCTDFSthumbstatusvStyle);
      draginfo.thumbstatus.style.top = (draginfo.clientY+scc.TCTDFStopOffsetv)+"px";
      draginfo.thumbstatus.style.left = (control.controlborder-10-(editor.tablewidth/2))+"px";
      draginfo.thumbstatus.style.width = (editor.tablewidth/2)+"px";

      draginfo.thumbcontext = new SocialCalc.RenderContext(editor.context.sheetobj);
      draginfo.thumbcontext.showGrid = true;
      draginfo.thumbcontext.rowpanes = [{first: 1, last: 1}];
      var pane = editor.context.colpanes[editor.context.colpanes.length-1];
      draginfo.thumbcontext.colpanes = [{first: pane.first, last: pane.last}];
      draginfo.thumbstatus.innerHTML = '<table cellspacing="0" cellpadding="0"><tr><td valign="top" style="'+
        scc.TCTDFSthumbstatusrownumStyle+'" class="'+scc.TCTDFSthumbstatusrownumClass+
        '"><div>msg</div></td><td valign="top"><div style="overflow:hidden;">preview</div></td></tr></table>';
      draginfo.thumbstatus.rowmsgele = draginfo.thumbstatus.firstChild.firstChild.firstChild.firstChild.firstChild;
      draginfo.thumbstatus.rowpreviewele = draginfo.thumbstatus.firstChild.firstChild.firstChild.childNodes[1].firstChild;
      editor.toplevel.appendChild(draginfo.thumbstatus);
      SocialCalc.TCTDragFunctionRowSetStatus(draginfo, editor, editor.firstscrollingrow || 1);
      }
   else {
      if (scc.TCTDFSthumbstatushClass) draginfo.thumbstatus.className = scc.TCTDFSthumbstatushClass;
      SocialCalc.setStyles(draginfo.thumbstatus, scc.TCTDFSthumbstatushStyle);
      draginfo.thumbstatus.style.top = (control.controlborder+scc.TCTDFStopOffseth)+"px";
      draginfo.thumbstatus.style.left = (draginfo.clientX+scc.TCTDFSleftOffseth)+"px";
      editor.toplevel.appendChild(draginfo.thumbstatus);
      draginfo.thumbstatus.innerHTML = scc.s_TCTDFthumbstatusPrefixh+SocialCalc.rcColname(editor.firstscrollingcol);
      }

   }


//
// SocialCalc.TCTDragFunctionRowSetStatus(draginfo, editor, row)
//
// Render partial row
//

SocialCalc.TCTDragFunctionRowSetStatus = function(draginfo, editor, row) {

   var scc = SocialCalc.Constants;
   var msg = scc.s_TCTDFthumbstatusPrefixv+row+" ";

   draginfo.thumbstatus.rowmsgele.innerHTML = msg;

   draginfo.thumbcontext.rowpanes = [{first: row, last: row}];
   draginfo.thumbrowshown = row;

   var ele = draginfo.thumbcontext.RenderSheet(draginfo.thumbstatus.rowpreviewele.firstChild, {type: "html"});

   }


//
// TCTDragFunctionMove(event, draginfo, dobj)
//

SocialCalc.TCTDragFunctionMove = function(event, draginfo, dobj) {

   var first, msg;
   var control = dobj.functionobj.control;
   var thumbthickness = control.thumbthickness;
   var editor = control.editor;
   var scc = SocialCalc.Constants;

   if (dobj.vertical) {
      if (draginfo.clientY > control.scrollareaend - draginfo.offsetY - control.thumbthickness + 2)
         draginfo.clientY = control.scrollareaend - draginfo.offsetY - control.thumbthickness + 2;
      if (draginfo.clientY < control.scrollareastart - draginfo.offsetY - 1)
         draginfo.clientY = control.scrollareastart - draginfo.offsetY - 1;
      draginfo.thumbstatus.style.top = draginfo.clientY+"px";

      first =
         ((draginfo.clientY+draginfo.offsetY-control.scrollareastart+1)/(control.scrollareasize-control.thumbthickness))
         * (editor.context.sheetobj.attribs.lastrow-editor.lastnonscrollingrow)
         + editor.lastnonscrollingrow + 1;
      first = Math.floor(first);
      if (first <= editor.lastnonscrollingrow) first = editor.lastnonscrollingrow + 1;
      if (first > editor.context.sheetobj.attribs.lastrow) first = editor.context.sheetobj.attribs.lastrow;
//      msg = scc.s_TCTDFthumbstatusPrefixv+first;
      if (first != draginfo.thumbrowshown) {
         SocialCalc.TCTDragFunctionRowSetStatus(draginfo, editor, first);
         }
      }
   else {
      if (draginfo.clientX > control.scrollareaend - draginfo.offsetX - control.thumbthickness + 2)
         draginfo.clientX = control.scrollareaend - draginfo.offsetX - control.thumbthickness + 2;
      if (draginfo.clientX < control.scrollareastart - draginfo.offsetX - 1)
         draginfo.clientX = control.scrollareastart - draginfo.offsetX - 1;
      draginfo.thumbstatus.style.left = draginfo.clientX+"px";

      first =
         ((draginfo.clientX+draginfo.offsetX-control.scrollareastart+1)/(control.scrollareasize-control.thumbthickness))
         * (editor.context.sheetobj.attribs.lastcol-editor.lastnonscrollingcol)
         + editor.lastnonscrollingcol + 1;
      first = Math.floor(first);
      if (first <= editor.lastnonscrollingcol) first = editor.lastnonscrollingcol + 1;
      if (first > editor.context.sheetobj.attribs.lastcol) first = editor.context.sheetobj.attribs.lastcol;
      msg = scc.s_TCTDFthumbstatusPrefixh+SocialCalc.rcColname(first);
      draginfo.thumbstatus.innerHTML = msg;
      }

   SocialCalc.DragFunctionPosition(event, draginfo, dobj);

   }

//
// TCTDragFunctionStop(event, draginfo, dobj)
//

SocialCalc.TCTDragFunctionStop = function(event, draginfo, dobj) {

   var first;
   var control = dobj.functionobj.control;
   var editor = control.editor;

   if (dobj.vertical) {
      first =
         ((draginfo.clientY+draginfo.offsetY-control.scrollareastart+1)/(control.scrollareasize-control.thumbthickness))
         * (editor.context.sheetobj.attribs.lastrow-editor.lastnonscrollingrow)
         + editor.lastnonscrollingrow + 1;
      first = Math.floor(first);
      if (first <= editor.lastnonscrollingrow) first = editor.lastnonscrollingrow + 1;
      if (first > editor.context.sheetobj.attribs.lastrow) first = editor.context.sheetobj.attribs.lastrow;

      editor.context.SetRowPaneFirstLast(editor.context.rowpanes.length-1, first, first+1);
      }
   else {
      first =
         ((draginfo.clientX+draginfo.offsetX-control.scrollareastart+1)/(control.scrollareasize-control.thumbthickness))
         * (editor.context.sheetobj.attribs.lastcol-editor.lastnonscrollingcol)
         + editor.lastnonscrollingcol + 1;
      first = Math.floor(first);
      if (first <= editor.lastnonscrollingcol) first = editor.lastnonscrollingcol + 1;
      if (first > editor.context.sheetobj.attribs.lastcol) first = editor.context.sheetobj.attribs.lastcol;

      editor.context.SetColPaneFirstLast(editor.context.colpanes.length-1, first, first+1);
      }

   editor.FitToEditTable();

   if (draginfo.thumbstatus.rowmsgele) draginfo.thumbstatus.rowmsgele = null;
   if (draginfo.thumbstatus.rowpreviewele) draginfo.thumbstatus.rowpreviewele = null;
   editor.toplevel.removeChild(draginfo.thumbstatus);
   draginfo.thumbstatus = null;

   editor.ScheduleRender();

   }

// *************************************
//
// Dragging functions:
//
// *************************************

SocialCalc.DragInfo = {

   // There is only one of these -- no "new" is done.
   // Only one dragging operation can be active at a time.
   // The registeredElements array is used to decide which item to drag.
 
   // One item for each draggable thing, each an object with:
   //    .element, .vertical, .horizontal, .functionobj, .parent

   registeredElements: [],

   // Items used during a drag

   draggingElement: null, // item being processed (.element is the actual element)
   startX: 0,
   startY: 0,
   startZ: 0,
   clientX: 0, // modifyable version to restrict movement
   clientY: 0,
   offsetX: 0,
   offsetY: 0,
   relativeOffset: {left:0,top:0} // retrieved at drag start

   }

//
// DragRegister(element, vertical, horizontal, functionobj, parent) - make element draggable
//
// The functionobj defaults to moving the element contrained only by vertical and horizontal settings.
//

SocialCalc.DragRegister = function(element, vertical, horizontal, functionobj, parent) {

   var draginfo = SocialCalc.DragInfo;

   if (!functionobj) {
      functionobj = {MouseDown: SocialCalc.DragFunctionStart, MouseMove: SocialCalc.DragFunctionPosition,
                     MouseUp: SocialCalc.DragFunctionPosition,
                     Disabled: null};
      }

   draginfo.registeredElements.push(
      {element: element, vertical: vertical, horizontal: horizontal, functionobj: functionobj, parent: parent}
      );

   if (element.addEventListener) { // DOM Level 2 -- Firefox, et al
      element.addEventListener("mousedown", SocialCalc.DragMouseDown, false);
      }
   else if (element.attachEvent) { // IE 5+
      element.attachEvent("onmousedown", SocialCalc.DragMouseDown);
      }
   else { // don't handle this
      throw SocialCalc.Constants.s_BrowserNotSupported;
      }

   }

//
// DragUnregister(element) - remove object from list
//

SocialCalc.DragUnregister = function(element) {

   var draginfo = SocialCalc.DragInfo;

   var i;

   if (!element) return;

   for (i=0; i<draginfo.registeredElements.length; i++) {
      if (draginfo.registeredElements[i].element == element) {
         draginfo.registeredElements.splice(i,1);
         if (element.removeEventListener) { // DOM Level 2 -- Firefox, et al
            element.removeEventListener("mousedown", SocialCalc.DragMouseDown, false);
            }
         else { // IE 5+
            element.detachEvent("onmousedown", SocialCalc.DragMouseDown);
            }
         return;
         }
      }

   return; // ignore if not in list

   }

//
// DragMouseDown(event)
//

SocialCalc.DragMouseDown = function(event) {

   var e = event || window.event;

   var draginfo = SocialCalc.DragInfo;

   var dobj = SocialCalc.LookupElement(e.target || e.srcElement, draginfo.registeredElements);
   if (!dobj) return;

   if (dobj && dobj.functionobj && dobj.functionobj.Disabled) {
      if (dobj.functionobj.Disabled(e, draginfo, dobj)) {
         return;
         }
      }

   draginfo.draggingElement = dobj;
   if (dobj.parent) {
      draginfo.relativeOffset = SocialCalc.GetElementPositionWithScroll(dobj.parent);
      }
   draginfo.clientX = e.clientX - draginfo.relativeOffset.left;
   draginfo.clientY = e.clientY - draginfo.relativeOffset.top;
   draginfo.startX = draginfo.clientX;
   draginfo.startY = draginfo.clientY;
   draginfo.startZ = dobj.element.style.zIndex;
   draginfo.offsetX = 0;
   draginfo.offsetY = 0;

   dobj.element.style.zIndex = "100";

   // Event code from JavaScript, Flanagan, 5th Edition, pg. 422
   if (document.addEventListener) { // DOM Level 2 -- Firefox, et al
      document.addEventListener("mousemove", SocialCalc.DragMouseMove, true); // capture everywhere
      document.addEventListener("mouseup", SocialCalc.DragMouseUp, true);
      }
   else if (dobj.element.attachEvent) { // IE 5+
      dobj.element.setCapture();
      dobj.element.attachEvent("onmousemove", SocialCalc.DragMouseMove);
      dobj.element.attachEvent("onmouseup", SocialCalc.DragMouseUp);
      dobj.element.attachEvent("onlosecapture", SocialCalc.DragMouseUp);
      }
   if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
   else e.cancelBubble = true; // IE 5+
   if (e.preventDefault) e.preventDefault(); // DOM Level 2
   else e.returnValue = false; // IE 5+

   if (dobj && dobj.functionobj && dobj.functionobj.MouseDown) dobj.functionobj.MouseDown(e, draginfo, dobj);

   return false;

   }

//
// DragMouseMove(event)
//

SocialCalc.DragMouseMove = function(event) {

   var e = event || window.event;

   var draginfo = SocialCalc.DragInfo;
   var dobj = draginfo.draggingElement;

   draginfo.clientX = e.clientX - draginfo.relativeOffset.left;
   draginfo.clientY = e.clientY - draginfo.relativeOffset.top;

   if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
   else e.cancelBubble = true; // IE 5+

   if (dobj && dobj.functionobj && dobj.functionobj.MouseMove) dobj.functionobj.MouseMove(e, draginfo, dobj);

   return false;

   }

//
// DragMouseUp(event)
//

SocialCalc.DragMouseUp = function(event) {

   var e = event || window.event;

   var draginfo = SocialCalc.DragInfo;
   var dobj = draginfo.draggingElement;

   draginfo.clientX = e.clientX - draginfo.relativeOffset.left;
   draginfo.clientY = e.clientY - draginfo.relativeOffset.top;

   dobj.element.style.zIndex = draginfo.startZ;

   if (dobj && dobj.functionobj && dobj.functionobj.MouseUp) dobj.functionobj.MouseUp(e, draginfo, dobj);

   if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
   else e.cancelBubble = true; // IE 5+

   if (document.removeEventListener) { // DOM Level 2
      document.removeEventListener("mousemove", SocialCalc.DragMouseMove, true);
      document.removeEventListener("mouseup", SocialCalc.DragMouseUp, true);
      // Note: In old (1.5?) versions of Firefox, this causes the browser to skip the MouseUp for
      // the button code. https://bugzilla.mozilla.org/show_bug.cgi?id=174320
      // Firefox 1.5 is <1% share (http://marketshare.hitslink.com/report.aspx?qprid=7)
      }
   else if (dobj.element.detachEvent) { // IE
      dobj.element.detachEvent("onlosecapture", SocialCalc.DragMouseUp);
      dobj.element.detachEvent("onmouseup", SocialCalc.DragMouseUp);
      dobj.element.detachEvent("onmousemove", SocialCalc.DragMouseMove);
      dobj.element.releaseCapture();
      }

   draginfo.draggingElement = null;

   return false;

   }

//
// DragFunctionStart(event, draginfo, dobj)
//

SocialCalc.DragFunctionStart = function(event, draginfo, dobj) {

   var element = dobj.functionobj.positionobj || dobj.element;

   draginfo.offsetY = parseInt(element.style.top) - draginfo.clientY;
   draginfo.offsetX = parseInt(element.style.left) - draginfo.clientX;

   }

//
// DragFunctionPosition(event, draginfo, dobj)
//

SocialCalc.DragFunctionPosition = function(event, draginfo, dobj) {

   var element = dobj.functionobj.positionobj || dobj.element;

   if (dobj.vertical) element.style.top = (draginfo.clientY + draginfo.offsetY)+"px";
   if (dobj.horizontal) element.style.left = (draginfo.clientX + draginfo.offsetX)+"px";

   }

// *************************************
//
// Tooltip functions:
//
// *************************************

SocialCalc.TooltipInfo = {

   // There is only one of these -- no "new" is done.
   // Only one tooltip operation can be active at a time.
   // The registeredElements array is used to identify items.

   // One item for each element with a tooltip, each an object with:
   //    .element, .tiptext, .functionobj, .parent
   // Currently .functionobj can only contain .offsetx and .offsety.
   // If present they are used instead of the default ones.

   registeredElements: [],

   registered: false, // if true, an event handler has been registered for this functionality

   // Items used during hover over an element

   tooltipElement: null, // item being processed (.element is the actual element)
   timer: null, // timer object waiting to see if holding over element
   popupElement: null, // tooltip element being displayed
   clientX: 0, // modifyable version to restrict movement
   clientY: 0,
   offsetX: SocialCalc.Constants.TooltipOffsetX, // modifyable version to allow positioning
   offsetY: SocialCalc.Constants.TooltipOffsetY

   }

//
// TooltipRegister(element, tiptext, functionobj, parent) - make element have a tooltip
//

SocialCalc.TooltipRegister = function(element, tiptext, functionobj, parent) {

   var tooltipinfo = SocialCalc.TooltipInfo;
   tooltipinfo.registeredElements.push(
      {element: element, tiptext: tiptext, functionobj: functionobj, parent: parent}
      );

   if (tooltipinfo.registered) return; // only need to add event listener once

   if (document.addEventListener) { // DOM Level 2 -- Firefox, et al
      document.addEventListener("mousemove", SocialCalc.TooltipMouseMove, false);
      }
   else if (document.attachEvent) { // IE 5+
      document.attachEvent("onmousemove", SocialCalc.TooltipMouseMove);
      }
   else { // don't handle this
      throw SocialCalc.Constants.s_BrowserNotSupported;
      }

   tooltipinfo.registered = true; // remember

   return;

   }

//
// TooltipMouseMove(event)
//

SocialCalc.TooltipMouseMove = function(event) {

   var e = event || window.event;

   var tooltipinfo = SocialCalc.TooltipInfo;

   tooltipinfo.clientX = e.clientX;
   tooltipinfo.clientY = e.clientY;

   var tobj = SocialCalc.LookupElement(e.target || e.srcElement, tooltipinfo.registeredElements);

   if (tooltipinfo.timer) { // waiting to see if holding still: didn't hold still
      window.clearTimeout(tooltipinfo.timer); // cancel timer
      tooltipinfo.timer = null;
      }

   if (tooltipinfo.popupElement) { // currently displaying a tip: hide it
      SocialCalc.TooltipHide();
      }

   tooltipinfo.tooltipElement = tobj || null;

   if (!tobj || SocialCalc.ButtonInfo.buttonDown) return; // if not an object with a tip or a "button" is down, ignore

   tooltipinfo.timer = window.setTimeout(SocialCalc.TooltipWaitDone, 700);

   if (tooltipinfo.tooltipElement.element.addEventListener) { // Register event for mouse down which cancels tooltip stuff
      tooltipinfo.tooltipElement.element.addEventListener("mousedown", SocialCalc.TooltipMouseDown, false);
      }
   else if (tooltipinfo.tooltipElement.element.attachEvent) { // IE
      tooltipinfo.tooltipElement.element.attachEvent("onmousedown", SocialCalc.TooltipMouseDown);
      }

   return;

   }

//
// TooltipMouseDown(event)
//

SocialCalc.TooltipMouseDown = function(event) {

   var e = event || window.event;

   var tooltipinfo = SocialCalc.TooltipInfo;

   if (tooltipinfo.timer) {
      window.clearTimeout(tooltipinfo.timer); // cancel timer
      tooltipinfo.timer = null;
      }

   if (tooltipinfo.popupElement) { // currently displaying a tip: hide it
      SocialCalc.TooltipHide();
      }

   if (tooltipinfo.tooltipElement) {
      if (tooltipinfo.tooltipElement.element.removeEventListener) { // DOM Level 2 -- Firefox, et al
         tooltipinfo.tooltipElement.element.removeEventListener("mousedown", SocialCalc.TooltipMouseDown, false);
         }
      else if (tooltipinfo.tooltipElement.element.attachEvent) { // IE 5+
         tooltipinfo.tooltipElement.element.detachEvent("onmousedown", SocialCalc.TooltipMouseDown);
         }
      tooltipinfo.tooltipElement = null;
      }

   return;

   }

//
// TooltipDisplay(tobj)
//

SocialCalc.TooltipDisplay = function(tobj) {

   var tooltipinfo = SocialCalc.TooltipInfo;
   var scc = SocialCalc.Constants;
   var offsetX = (tobj.functionobj && ((typeof tobj.functionobj.offsetx) == "number")) ? 
      tobj.functionobj.offsetx : tooltipinfo.offsetX;
   var offsetY = (tobj.functionobj && ((typeof tobj.functionobj.offsety) == "number")) ? 
      tobj.functionobj.offsety : tooltipinfo.offsetY;
   var viewport = SocialCalc.GetViewportInfo();
   var pos = SocialCalc.GetElementPositionWithScroll(tobj.parent);

   tooltipinfo.popupElement = document.createElement("div");
   if (scc.TDpopupElementClass) tooltipinfo.popupElement.className = scc.TDpopupElementClass;
   SocialCalc.setStyles(tooltipinfo.popupElement, scc.TDpopupElementStyle);

   tooltipinfo.popupElement.innerHTML = tobj.tiptext;

   if (tooltipinfo.clientX > viewport.width/2) { // on right side of screen
      tooltipinfo.popupElement.style.bottom = (pos.height - tooltipinfo.clientY + offsetY + pos.top)+"px";
      tooltipinfo.popupElement.style.right = (pos.width - tooltipinfo.clientX + offsetX + pos.left)+"px";
      }
   else { // on left side of screen
      tooltipinfo.popupElement.style.bottom = (pos.height - tooltipinfo.clientY + offsetY + pos.top)+"px";
      tooltipinfo.popupElement.style.left = (tooltipinfo.clientX + offsetX - pos.left)+"px";
      }

   if (tooltipinfo.clientY < 50) { // make sure fits on screen if nothing above grid
      tooltipinfo.popupElement.style.bottom = (pos.height - tooltipinfo.clientY + offsetY - 50 + pos.top)+"px";
      }

   tobj.parent.appendChild(tooltipinfo.popupElement);

   }

//
// TooltipHide()
//

SocialCalc.TooltipHide = function() {

   var tooltipinfo = SocialCalc.TooltipInfo;

   if (tooltipinfo.popupElement) {
      tooltipinfo.popupElement.parentNode.removeChild(tooltipinfo.popupElement);
      tooltipinfo.popupElement = null;
      }

   }

//
// TooltipWaitDone()
//

SocialCalc.TooltipWaitDone = function() {

   var tooltipinfo = SocialCalc.TooltipInfo;

   tooltipinfo.timer = null;

   SocialCalc.TooltipDisplay(tooltipinfo.tooltipElement);

   }


// *************************************
//
// Button functions:
//
// *************************************

SocialCalc.ButtonInfo = {

   // There is only one of these -- no "new" is done.
   // Only one button operation can be active at a time.
   // The registeredElements array is used to identify items.

   // One item for each clickable element, each an object with:
   //    .element, .normalstyle, .hoverstyle, .downstyle, .repeatinterval, .functionobj, .editor
   //
   // .functionobj is an object with optional function objects for:
   //    mouseover, mouseout, mousedown, repeatinterval, mouseup, disabled

   registeredElements: [],

   // Items used during hover over an element, clicking, repeating, etc.

   buttonElement: null, // item being processed, hover or down (.element is the actual element)
   doingHover: false, // true if mouse is over one of our elements
   buttonDown: false, // true if button down and buttonElement not null
   timer: null, // timer object for repeating

   // Used while processing an event

   relativeOffset: null,
   clientX: 0,
   clientY: 0

   }

//
// ButtonRegister(editor, element, paramobj, functionobj) - make element clickable
//
// The arguments (other than editor and element) may be null (meaning no change for style and no repeat)
// The paramobj has the optional normalstyle, hoverstyle, downstyle, repeatwait, repeatinterval settings

SocialCalc.ButtonRegister = function(editor, element, paramobj, functionobj) {

   var buttoninfo = SocialCalc.ButtonInfo;

   if (!paramobj) paramobj = {};

   buttoninfo.registeredElements.push(
      {name: paramobj.name, element: element, editor: editor,
       normalstyle: paramobj.normalstyle, hoverstyle: paramobj.hoverstyle, downstyle: paramobj.downstyle,
       repeatwait: paramobj.repeatwait, repeatinterval: paramobj.repeatinterval, functionobj: functionobj}
      );

   if (element.addEventListener) { // DOM Level 2 -- Firefox, et al
      element.addEventListener("mousedown", SocialCalc.ButtonMouseDown, false);
      element.addEventListener("mouseover", SocialCalc.ButtonMouseOver, false);
      element.addEventListener("mouseout", SocialCalc.ButtonMouseOut, false);
      }
   else if (element.attachEvent) { // IE 5+
      element.attachEvent("onmousedown", SocialCalc.ButtonMouseDown);
      element.attachEvent("onmouseover", SocialCalc.ButtonMouseOver);
      element.attachEvent("onmouseout", SocialCalc.ButtonMouseOut);
      }
   else { // don't handle this
      throw SocialCalc.Constants.s_BrowserNotSupported;
      }

   return;

   }

//
// ButtonMouseOver(event)
//

SocialCalc.ButtonMouseOver = function(event) {

   var e = event || window.event;

   var buttoninfo = SocialCalc.ButtonInfo;

   var bobj = SocialCalc.LookupElement(e.target || e.srcElement, buttoninfo.registeredElements);

   if (!bobj) return;

   if (buttoninfo.buttonDown) {
      if (buttoninfo.buttonElement==bobj) {
         buttoninfo.doingHover = true; // keep track whether we are on the pressed button or not
         }
      return;
      }

   if (buttoninfo.buttonElement &&
          buttoninfo.buttonElement!=bobj && buttoninfo.doingHover) { // moved to a new one, undo hover there
      SocialCalc.setStyles(buttoninfo.buttonElement.element, buttoninfo.buttonElement.normalstyle);
      }

   buttoninfo.buttonElement = bobj; // remember this one is hovering
   buttoninfo.doingHover = true;

   SocialCalc.setStyles(bobj.element, bobj.hoverstyle); // set style (if provided)

   if (bobj && bobj.functionobj && bobj.functionobj.MouseOver) bobj.functionobj.MouseOver(e, buttoninfo, bobj);

   return;

   }

//
// ButtonMouseOut(event)
//

SocialCalc.ButtonMouseOut = function(event) {

   var e = event || window.event;

   var buttoninfo = SocialCalc.ButtonInfo;

   if (buttoninfo.buttonDown) {
      buttoninfo.doingHover = false; // keep track of overs and outs
      return;
      }

   var bobj = SocialCalc.LookupElement(e.target || e.srcElement, buttoninfo.registeredElements);

   if (buttoninfo.doingHover) { // if there was a hover, undo it
      if (buttoninfo.buttonElement)
         SocialCalc.setStyles(buttoninfo.buttonElement.element, buttoninfo.buttonElement.normalstyle);
      buttoninfo.buttonElement = null;
      buttoninfo.doingHover = false;
      }

   if (bobj && bobj.functionobj && bobj.functionobj.MouseOut) bobj.functionobj.MouseOut(e, buttoninfo, bobj);

   return;

   }

//
// ButtonMouseDown(event)
//

SocialCalc.ButtonMouseDown = function(event) {

   var e = event || window.event;

   var buttoninfo = SocialCalc.ButtonInfo;

   var viewportinfo = SocialCalc.GetViewportInfo();

   var bobj = SocialCalc.LookupElement(e.target || e.srcElement, buttoninfo.registeredElements);

   if (!bobj) return; // not one of our elements

   if (bobj && bobj.functionobj && bobj.functionobj.Disabled) {
      if (bobj.functionobj.Disabled(e, buttoninfo, bobj)) {
         return;
         }
      }

   buttoninfo.buttonElement = bobj;
   buttoninfo.buttonDown = true;

   SocialCalc.setStyles(bobj.element, buttoninfo.buttonElement.downstyle);

   // Register event handler for mouse up

   // Event code from JavaScript, Flanagan, 5th Edition, pg. 422
   if (document.addEventListener) { // DOM Level 2 -- Firefox, et al
      document.addEventListener("mouseup", SocialCalc.ButtonMouseUp, true); // capture everywhere
      }
   else if (bobj.element.attachEvent) { // IE 5+
      bobj.element.setCapture();
      bobj.element.attachEvent("onmouseup", SocialCalc.ButtonMouseUp);
      bobj.element.attachEvent("onlosecapture", SocialCalc.ButtonMouseUp);
      }
   if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
   else e.cancelBubble = true; // IE 5+
   if (e.preventDefault) e.preventDefault(); // DOM Level 2
   else e.returnValue = false; // IE 5+

   buttoninfo.relativeOffset = SocialCalc.GetElementPositionWithScroll(bobj.editor.toplevel);
   buttoninfo.clientX = e.clientX - buttoninfo.relativeOffset.left;
   buttoninfo.clientY = e.clientY - buttoninfo.relativeOffset.top;

   if (bobj && bobj.functionobj && bobj.functionobj.MouseDown) bobj.functionobj.MouseDown(e, buttoninfo, bobj);

   if (bobj.repeatwait) { // if a repeat wait is set, then starting waiting for first repetition
      buttoninfo.timer = window.setTimeout(SocialCalc.ButtonRepeat, bobj.repeatwait);
      }

   return;

   }

//
// ButtonMouseUp(event)
//

SocialCalc.ButtonMouseUp = function(event) {

   var e = event || window.event;

   var buttoninfo = SocialCalc.ButtonInfo;
   var bobj = buttoninfo.buttonElement;

   if (buttoninfo.timer) { // if repeating, cancel it
      window.clearTimeout(buttoninfo.timer); // cancel timer
      buttoninfo.timer = null;
      }

   if (!buttoninfo.buttonDown) return; // already did this (e.g., in IE, releaseCapture fires losecapture)

   if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
   else e.cancelBubble = true; // IE 5+
   if (e.preventDefault) e.preventDefault(); // DOM Level 2
   else e.returnValue = false; // IE 5+

   if (document.removeEventListener) { // DOM Level 2
      document.removeEventListener("mouseup", SocialCalc.ButtonMouseUp, true);
      }
   else if (document.detachEvent) { // IE
      bobj.element.detachEvent("onlosecapture", SocialCalc.ButtonMouseUp);
      bobj.element.detachEvent("onmouseup", SocialCalc.ButtonMouseUp);
      bobj.element.releaseCapture();
      }

   if (buttoninfo.buttonElement.downstyle) {
      if (buttoninfo.doingHover)
         SocialCalc.setStyles(bobj.element, buttoninfo.buttonElement.hoverstyle);
      else
         SocialCalc.setStyles(bobj.element, buttoninfo.buttonElement.normalstyle);
      }

   buttoninfo.buttonDown = false;

   if (bobj && bobj.functionobj && bobj.functionobj.MouseUp) bobj.functionobj.MouseUp(e, buttoninfo, bobj);

   }

//
// ButtonRepeat()
//

SocialCalc.ButtonRepeat = function() {

   var buttoninfo = SocialCalc.ButtonInfo;
   var bobj = buttoninfo.buttonElement;

   if (!bobj) return;

   if (bobj && bobj.functionobj && bobj.functionobj.Repeat) bobj.functionobj.Repeat(null, buttoninfo, bobj);

   buttoninfo.timer = window.setTimeout(SocialCalc.ButtonRepeat, bobj.repeatinterval || 100);

   }

// *************************************
//
// MouseWheel functions:
//
// *************************************

SocialCalc.MouseWheelInfo = {

   // There is only one of these -- no "new" is done.
   // The mousewheel only affects the one area the mouse pointer is over
   // The registeredElements array is used to identify items.

   // One item for each element to respond to the mousewheel, each an object with:
   //    .element, .functionobj

   registeredElements: []

   }

//
// MouseWheelRegister(element, functionobj) - make element respond to mousewheel
//

SocialCalc.MouseWheelRegister = function(element, functionobj) {

   var mousewheelinfo = SocialCalc.MouseWheelInfo;

   mousewheelinfo.registeredElements.push(
      {element: element, functionobj: functionobj}
      );

   if (element.addEventListener) { // DOM Level 2 -- Firefox, et al
      element.addEventListener("DOMMouseScroll", SocialCalc.ProcessMouseWheel, false);
      element.addEventListener("mousewheel", SocialCalc.ProcessMouseWheel, false); // Opera needs this
      }
   else if (element.attachEvent) { // IE 5+
      element.attachEvent("onmousewheel", SocialCalc.ProcessMouseWheel);
      }
   else { // don't handle this
      throw SocialCalc.Constants.s_BrowserNotSupported;
      }

   return;

   }

SocialCalc.ProcessMouseWheel = function(e) {

   var event = e || window.event;
   var delta;

   if (SocialCalc.Keyboard.passThru) return; // ignore

   var mousewheelinfo = SocialCalc.MouseWheelInfo;
   var ele = event.target || event.srcElement; // source object is often within what we want
   var wobj;

   for (wobj=null; !wobj && ele; ele=ele.parentNode) { // go up tree looking for one of our elements
      wobj = SocialCalc.LookupElement(ele, mousewheelinfo.registeredElements);
      }
   if (!wobj) return; // not one of our elements

   if (event.wheelDelta) {
      delta = event.wheelDelta/120;
      }
   else delta = -event.detail/3;
   if (!delta) delta = 0;

   if (wobj.functionobj && wobj.functionobj.WheelMove) wobj.functionobj.WheelMove(event, delta, mousewheelinfo, wobj);

   if (event.preventDefault) event.preventDefault();
   event.returnValue = false;

   }

// *************************************
//
// Keyboard functions:
//
// For more information about keyboard handling, see: http://unixpapa.com/js/key.html
//
// *************************************

SocialCalc.keyboardTables = {

   specialKeysCommon: {
      8: "[backspace]", 9: "[tab]", 13: "[enter]", 25: "[tab]", 27: "[esc]", 33: "[pgup]", 34: "[pgdn]",
      35: "[end]", 36: "[home]", 37: "[aleft]", 38: "[aup]", 39: "[aright]", 40: "[adown]", 45: "[ins]",
      46: "[del]", 113: "[f2]"
      },

   specialKeysIE: {
      8: "[backspace]", 9: "[tab]", 13: "[enter]", 25: "[tab]", 27: "[esc]", 33: "[pgup]", 34: "[pgdn]",
      35: "[end]", 36: "[home]", 37: "[aleft]", 38: "[aup]", 39: "[aright]", 40: "[adown]", 45: "[ins]",
      46: "[del]", 113: "[f2]"
      },

   controlKeysIE: {
      67: "[ctrl-c]",
      83: "[ctrl-s]",
      86: "[ctrl-v]",
      88: "[ctrl-x]",
      90: "[ctrl-z]"
      },

   specialKeysOpera: {
      8: "[backspace]", 9: "[tab]", 13: "[enter]", 25: "[tab]", 27: "[esc]", 33: "[pgup]", 34: "[pgdn]",
      35: "[end]", 36: "[home]", 37: "[aleft]", 38: "[aup]", 39: "[aright]", 40: "[adown]",
      45: "[ins]", // issues with releases before 9.5 - same as "-" ("-" changed in 9.5)
      46: "[del]", // issues with releases before 9.5 - same as "." ("." changed in 9.5)
      113: "[f2]"
      },

   controlKeysOpera: {
      67: "[ctrl-c]",
      83: "[ctrl-s]",
      86: "[ctrl-v]",
      88: "[ctrl-x]",
      90: "[ctrl-z]"
      },

   specialKeysSafari: {
      8: "[backspace]", 9: "[tab]", 13: "[enter]", 25: "[tab]", 27: "[esc]", 63232: "[aup]", 63233: "[adown]",
      63234: "[aleft]", 63235: "[aright]", 63272: "[del]", 63273: "[home]", 63275: "[end]", 63276: "[pgup]",
      63277: "[pgdn]", 63237: "[f2]"
      },

   controlKeysSafari: {
      99: "[ctrl-c]",
      115: "[ctrl-s]",
      118: "[ctrl-v]",
      120: "[ctrl-x]",
      122: "[ctrl-z]"
      },

   ignoreKeysSafari: {
      63236: "[f1]", 63238: "[f3]", 63239: "[f4]", 63240: "[f5]", 63241: "[f6]", 63242: "[f7]",
      63243: "[f8]", 63244: "[f9]", 63245: "[f10]", 63246: "[f11]", 63247: "[f12]", 63289: "[numlock]"
      },

   specialKeysFirefox: {
      8: "[backspace]", 9: "[tab]", 13: "[enter]", 25: "[tab]", 27: "[esc]", 33: "[pgup]", 34: "[pgdn]",
      35: "[end]", 36: "[home]", 37: "[aleft]", 38: "[aup]", 39: "[aright]", 40: "[adown]", 45: "[ins]",
      46: "[del]", 113: "[f2]"
      },

   controlKeysFirefox: {
      99: "[ctrl-c]",
      115: "[ctrl-s]",
      118: "[ctrl-v]",
      120: "[ctrl-x]",
      122: "[ctrl-z]"
      },

   ignoreKeysFirefox: {
      16: "[shift]", 17: "[ctrl]", 18: "[alt]", 20: "[capslock]", 19: "[pause]", 44: "[printscreen]",
      91: "[windows]", 92: "[windows]", 112: "[f1]", 114: "[f3]", 115: "[f4]", 116: "[f5]",
      117: "[f6]", 118: "[f7]", 119: "[f8]", 120: "[f9]", 121: "[f10]", 122: "[f11]", 123: "[f12]",
      144: "[numlock]", 145: "[scrolllock]", 224: "[cmd]"
      }
   }

SocialCalc.Keyboard = {
   areListener: false, // if true, we have been installed as a listener for keyboard events
   focusTable: null, // the table editor object that gets keystrokes or null
   passThru: null, // if not null, control element with focus to pass keyboard events to (has blur method), or "true"
   didProcessKey: false, // did SocialCalc.ProcessKey in keydown
   statusFromProcessKey: false, // the status from the keydown SocialCalc.ProcessKey
   repeatingKeyPress: false, // some browsers (Opera, Gecko Mac) repeat special keys as KeyPress not KeyDown
   chForProcessKey: "" // remember so can do repeat in those cases
   };

SocialCalc.KeyboardSetFocus = function(editor) {

   SocialCalc.Keyboard.focusTable = editor;

   if (!SocialCalc.Keyboard.areListener) {
      document.onkeydown = SocialCalc.ProcessKeyDown;
      document.onkeypress = SocialCalc.ProcessKeyPress;
      SocialCalc.Keyboard.areListener = true;
      }
   if (SocialCalc.Keyboard.passThru) {
      if (SocialCalc.Keyboard.passThru.blur) {
         SocialCalc.Keyboard.passThru.blur();
         }
      SocialCalc.Keyboard.passThru = null;
      }
   window.focus();
   }

SocialCalc.KeyboardFocus = function() {

   SocialCalc.Keyboard.passThru = null;
   window.focus();

   }

SocialCalc.ProcessKeyDown = function(e) {

   var kt = SocialCalc.keyboardTables;
   kt.didProcessKey = false; // always start false
   kt.statusFromProcessKey = false;
   kt.repeatingKeyPress = false;

   var ch="";
   var status=true;

   if (SocialCalc.Keyboard.passThru) return; // ignore

   e = e || window.event;

   if (e.which==undefined) { // IE
      ch = kt.specialKeysCommon[e.keyCode];
      if (!ch) {
         if (e.ctrlKey) {
            ch=kt.controlKeysIE[e.keyCode];
            }
         if (!ch)
            return true;
         }
      status = SocialCalc.ProcessKey(ch, e);

      if (!status) {
         if (e.preventDefault) e.preventDefault();
            e.returnValue = false;
         }
      }

   else { 
      ch = kt.specialKeysCommon[e.keyCode];
      if (!ch) {
//         return true;
         if (e.ctrlKey || e.metaKey) {
            ch=kt.controlKeysIE[e.keyCode]; // this works here
            }
         if (!ch)
            return true;
         }

      status = SocialCalc.ProcessKey(ch, e); // process the key
      kt.didProcessKey = true; // remember what happened
      kt.statusFromProcessKey = status;
      kt.chForProcessKey = ch;
      }

   return status;

   }

SocialCalc.ProcessKeyPress = function(e) {

   var kt = SocialCalc.keyboardTables;

   var ch="";

   e = e || window.event;

   if (SocialCalc.Keyboard.passThru) return; // ignore
   if (kt.didProcessKey) { // already processed this key
      if (kt.repeatingKeyPress) {
         return SocialCalc.ProcessKey(kt.chForProcessKey, e); // process the same key as on KeyDown
         }
      else {
         kt.repeatingKeyPress = true; // see if get another KeyPress before KeyDown
         return kt.statusFromProcessKey; // do what it said to do
         }
      }

   if (e.which==undefined) { // IE
      // Note: Esc and Enter will come through here, too, if not stopped at KeyDown
      ch=String.fromCharCode(e.keyCode); // convert to a character (special chars handled at ev1)
      }

   else { // not IE
      if (!e.which)
         return false; // ignore - special key
      if (e.charCode==undefined) { // Opera
         if (e.which!=0) { // character
            if (e.which<32 || e.which==144) { // special char (144 is numlock)
               ch = kt.specialKeysOpera[e.which];
               if (ch) {
                  return true;
                  }
               }
            else {
               if (e.ctrlKey) {
                  ch=kt.controlKeysOpera[e.keyCode];
                  }
               else {
                  ch = String.fromCharCode(e.which);
                  }
               }
            }
         else { // special char
            return true;
            }
         }

      else if (e.keyCode==0 && e.charCode==0) { // OLPC Fn key or something
         return; // ignore
         }

      else if (e.keyCode==e.charCode) { // Safari
         ch = kt.specialKeysSafari[e.keyCode];
         if (!ch) {
            if (kt.ignoreKeysSafari[e.keyCode]) // pass this through
               return true;
            if (e.metaKey) {
               ch=kt.controlKeysSafari[e.keyCode];
               }
            else {
               ch = String.fromCharCode(e.which);
               }
            }
         }

      else { // Firefox
         if (kt.specialKeysFirefox[e.keyCode]) {
            return true;
            }
         ch = String.fromCharCode(e.which);
         if (e.ctrlKey || e.metaKey) {
            ch = kt.controlKeysFirefox[e.which];
            }
         }
      }

   var status = SocialCalc.ProcessKey(ch, e);

   if (!status) {
      if (e.preventDefault) e.preventDefault();
      e.returnValue = false;
      }

   return status;

   }

//
// status = SocialCalc.ProcessKey(ch, e)
//
// Take a key representation as a character string and dispatch to appropriate routine
//

SocialCalc.ProcessKey = function (ch, e) {

   var ft = SocialCalc.Keyboard.focusTable;

   if (!ft) return true; // we're not handling it -- let browser do default

   return ft.EditorProcessKey(ch, e);

   }


