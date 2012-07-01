//
// SocialCalcViewer
//
/*
// The code module of the SocialCalc package that lets you embed a spreadsheet viewer
// with an optional simple toolbar into a web page.
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

The Original Code is SocialCalc JavaScript SpreadsheetViewer.

The Original Developer is the Initial Developer.

The Initial Developer of the Original Code is Socialtext, Inc. All portions of the code written by 
Socialtext, Inc., are Copyright (c) Socialtext, Inc. All Rights Reserved.

Contributor: Dan Bricklin.


EXHIBIT B. Attribution Information

When the SpreadsheetViewer is producing and/or controlling the display the Graphic Image must be
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

Attribution URL: http://www.socialcalc.org/

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
// Unless otherwise specified, referring to "SocialCalc" in comments refers to this
// JavaScript version of the code, not the SocialCalc Perl code.
//

/*

See the comments in the main SocialCalc code module file of the SocialCalc package.

*/

   var SocialCalc;
   if (!SocialCalc) {
      alert("Main SocialCalc code module needed");
      SocialCalc = {};
      }
   if (!SocialCalc.TableEditor) {
      alert("SocialCalc TableEditor code module needed");
      }

// *************************************
//
// SpreadsheetViewer class:
//
// *************************************

// Global constants:

   SocialCalc.CurrentSpreadsheetViewerObject = null; // right now there can only be one active at a time


// Constructor:

SocialCalc.SpreadsheetViewer = function(idPrefix) {

   var scc = SocialCalc.Constants;

   // Properties:

   this.parentNode = null;
   this.spreadsheetDiv = null;
   this.requestedHeight = 0;
   this.requestedWidth = 0;
   this.requestedSpaceBelow = 0;
   this.height = 0;
   this.width = 0;
   this.viewheight = 0; // calculated amount for views below toolbar, etc.

   // Dynamic properties:

   this.sheet = null;
   this.context = null;
   this.editor = null;

   this.spreadsheetDiv = null;
   this.editorDiv = null;

   this.sortrange = ""; // remembered range for sort tab

   // Constants:

   this.idPrefix = idPrefix || "SocialCalc-"; // prefix added to element ids used here, should end in "-"
   this.imagePrefix = scc.defaultImagePrefix; // prefix added to img src

   this.statuslineheight = scc.SVStatuslineheight; // in pixels
   this.statuslineCSS = scc.SVStatuslineCSS;

   // Callbacks:

   // Initialization Code:

   this.sheet = new SocialCalc.Sheet();
   this.context = new SocialCalc.RenderContext(this.sheet);
   this.context.showGrid=true;
   this.context.showRCHeaders=true;
   this.editor = new SocialCalc.TableEditor(this.context);
   this.editor.noEdit = true;
   this.editor.StatusCallback.statusline =
      {func: SocialCalc.SpreadsheetViewerStatuslineCallback,
       params: {}};
   this.hasStatusLine = true; // default
//   this.statuslineHTML = '<table cellspacing="0" cellpadding="0"><tr><td width="100%" style="overflow:hidden;">{status}</td><td><a href="">Will&nbsp;be&nbsp;link</a></td></tr></table>';
   this.statuslineHTML = '<table cellspacing="0" cellpadding="0"><tr><td width="100%" style="overflow:hidden;">{status}</td><td>&nbsp;</td></tr></table>';
   this.statuslineFull = true;
   this.noRecalc = true; // don't do a recalc when loaded, so no need for external sheet routines

   // Repeating macro info

   this.repeatingMacroTimer = null;
   this.repeatingMacroInterval = 60; // default to 60 seconds
   this.repeatingMacroCommands = ""; // what to execute


   SocialCalc.CurrentSpreadsheetViewerObject = this; // remember this for rendezvousing on events

   return;

   }

// Methods:

SocialCalc.SpreadsheetViewer.prototype.InitializeSpreadsheetViewer =
   function(node, height, width, spacebelow) {return SocialCalc.InitializeSpreadsheetViewer(this, node, height, width, spacebelow);};
SocialCalc.SpreadsheetViewer.prototype.LoadSave = function(str) {return SocialCalc.SpreadsheetViewerLoadSave(this, str);};
SocialCalc.SpreadsheetViewer.prototype.DoOnResize = function() {return SocialCalc.DoOnResize(this);};
SocialCalc.SpreadsheetViewer.prototype.SizeSSDiv = function() {return SocialCalc.SizeSSDiv(this);};
SocialCalc.SpreadsheetViewer.prototype.DecodeSpreadsheetSave = 
   function(str) {return SocialCalc.SpreadsheetViewerDecodeSpreadsheetSave(this, str);};

// Sheet Methods to make things a little easier:

SocialCalc.SpreadsheetViewer.prototype.ParseSheetSave = function(str) {return this.sheet.ParseSheetSave(str);};


// Functions:

//
// InitializeSpreadsheetViewer(spreadsheet, node, height, width, spacebelow)
//
// Creates the control elements and makes them the child of node (string or element).
// If present, height and width specify size.
// If either is 0 or null (missing), the maximum that fits on the screen
// (taking spacebelow into account) is used.
//
// You should do a redisplay or recalc (which redisplays) after running this.
//

SocialCalc.InitializeSpreadsheetViewer = function(spreadsheet, node, height, width, spacebelow) {

   var scc = SocialCalc.Constants;
   var SCLoc = SocialCalc.LocalizeString;
   var SCLocSS = SocialCalc.LocalizeSubstrings;

   var html, child, i, vname, v, style, button, bele;
   var tabs = spreadsheet.tabs;
   var views = spreadsheet.views;

   spreadsheet.requestedHeight = height;
   spreadsheet.requestedWidth = width;
   spreadsheet.requestedSpaceBelow = spacebelow;

   if (typeof node == "string") node = document.getElementById(node);

   if (node == null) {
      alert("SocialCalc.SpreadsheetControl not given parent node.");
      }

   spreadsheet.parentNode = node;

   // create node to hold spreadsheet view

   spreadsheet.spreadsheetDiv = document.createElement("div");

   spreadsheet.SizeSSDiv(); // calculate and fill in the size values

   for (child=node.firstChild; child!=null; child=node.firstChild) {
      node.removeChild(child);
      }

   node.appendChild(spreadsheet.spreadsheetDiv);

   // create sheet div

   spreadsheet.nonviewheight = spreadsheet.hasStatusLine ? spreadsheet.statuslineheight : 0;
   spreadsheet.viewheight = spreadsheet.height-spreadsheet.nonviewheight;
   spreadsheet.editorDiv=spreadsheet.editor.CreateTableEditor(spreadsheet.width, spreadsheet.viewheight);

   spreadsheet.spreadsheetDiv.appendChild(spreadsheet.editorDiv);

   // create statusline

   if (spreadsheet.hasStatusLine) {
      spreadsheet.statuslineDiv = document.createElement("div");
      spreadsheet.statuslineDiv.style.cssText = spreadsheet.statuslineCSS;
      spreadsheet.statuslineDiv.style.height = spreadsheet.statuslineheight -
         (spreadsheet.statuslineDiv.style.paddingTop.slice(0,-2)-0) -
         (spreadsheet.statuslineDiv.style.paddingBottom.slice(0,-2)-0) + "px";
      spreadsheet.statuslineDiv.id = spreadsheet.idPrefix+"statusline";
      spreadsheet.spreadsheetDiv.appendChild(spreadsheet.statuslineDiv);
      spreadsheet.editor.StatusCallback.statusline =
         {func: SocialCalc.SpreadsheetViewerStatuslineCallback,
          params: {spreadsheetobj:spreadsheet}};
      }

   // done - refresh screen needed

   return;

   }

SocialCalc.SpreadsheetViewerLoadSave = function(spreadsheet, savestr) {

   var rmstr, pos, t, t2;

   var parts = spreadsheet.DecodeSpreadsheetSave(savestr);
   if (parts) {
      if (parts.sheet) {
         spreadsheet.sheet.ResetSheet();
         spreadsheet.sheet.ParseSheetSave(savestr.substring(parts.sheet.start, parts.sheet.end));
         }
      if (parts.edit) {
         spreadsheet.editor.LoadEditorSettings(savestr.substring(parts.edit.start, parts.edit.end));
         }
      if (parts.startupmacro) { // executed now
         spreadsheet.editor.EditorScheduleSheetCommands(savestr.substring(parts.startupmacro.start, parts.startupmacro.end), false, true);
         }
      if (parts.repeatingmacro) { // first line tells how many seconds before first execution. Last cmd must be "cmdextension repeatmacro delay" to continue repeating.
         rmstr = savestr.substring(parts.repeatingmacro.start, parts.repeatingmacro.end);
         rmstr = rmstr.replace("\r", ""); // make sure no CR, only LF
         pos = rmstr.indexOf("\n");
         if (pos > 0) {
            t = rmstr.substring(0, pos)-0; // get number
            t2 = t;
//            if (!(t > 0)) t = 60; // handles NAN, too
            spreadsheet.repeatingMacroInterval = t;
            spreadsheet.repeatingMacroCommands = rmstr.substring(pos+1);
            if (t2 > 0) { // zero means don't start yet
               spreadsheet.repeatingMacroTimer = window.setTimeout(SocialCalc.SpreadsheetViewerDoRepeatingMacro, spreadsheet.repeatingMacroInterval * 1000);
               }	
            }
         }
      }
   if (spreadsheet.editor.context.sheetobj.attribs.recalc=="off" || spreadsheet.noRecalc) {
      spreadsheet.editor.ScheduleRender();
      }
   else {
      spreadsheet.editor.EditorScheduleSheetCommands("recalc");
      }
   }

//
// SocialCalc.SpreadsheetViewerDoRepeatingMacro
//
// Called by a timer. Executes repeatingMacroCommands once.
// Use the "startcmdextension repeatmacro delay" command last to schedule this again.
//

SocialCalc.SpreadsheetViewerDoRepeatingMacro = function() {

   var spreadsheet = SocialCalc.GetSpreadsheetViewerObject();
   var editor = spreadsheet.editor;

   spreadsheet.repeatingMacroTimer = null;

   SocialCalc.SheetCommandInfo.CmdExtensionCallbacks.repeatmacro = {func:SocialCalc.SpreadsheetViewerRepeatMacroCommand, data:null};

   editor.EditorScheduleSheetCommands(spreadsheet.repeatingMacroCommands);

}

SocialCalc.SpreadsheetViewerRepeatMacroCommand = function(name, data, sheet, cmd, saveundo) {

   var spreadsheet = SocialCalc.GetSpreadsheetViewerObject();

   var rest = cmd.RestOfString();
   var t = rest-0; // get number
   if (!(t > 0)) t = spreadsheet.repeatingMacroInterval; // handles NAN, too, using last value
   spreadsheet.repeatingMacroInterval = t;

   spreadsheet.repeatingMacroTimer = window.setTimeout(SocialCalc.SpreadsheetViewerDoRepeatingMacro, spreadsheet.repeatingMacroInterval * 1000);

}

SocialCalc.SpreadsheetViewerStopRepeatingMacro = function() {

   var spreadsheet = SocialCalc.GetSpreadsheetViewerObject();

   if (spreadsheet.repeatingMacroTimer) {
      window.clearTimeout(spreadsheet.repeatingMacroTimer);
      spreadsheet.repeatingMacroTimer = null;
      }
}

//
// SocialCalc.SpreadsheetViewerDoButtonCmd(e, buttoninfo, bobj)
//
// xxx
//

SocialCalc.SpreadsheetViewerDoButtonCmd = function(e, buttoninfo, bobj) {

   var obj = bobj.element;
   var which = bobj.functionobj.command;

   var spreadsheet = SocialCalc.GetSpreadsheetViewerObject();
   var editor = spreadsheet.editor;

   switch (which) {
      case "recalc":
         editor.EditorScheduleSheetCommands("recalc");
         break;

      default:
         break;
      }

   if (obj && obj.blur) obj.blur();
   SocialCalc.KeyboardFocus();   

   }


//
// outstr = SocialCalc.LocalizeString(str)
//
// SocialCalc function to make localization easier.
// If str is "Text to localize", it returns
// SocialCalc.Constants.s_loc_text_to_localize if
// it exists, or else with just "Text to localize".
// Note that spaces are replaced with "_" and other special
// chars with "X" in the name of the constant (e.g., "A & B"
// would look for SocialCalc.Constants.s_loc_a_X_b.
//

SocialCalc.LocalizeString = function(str) {
   var cstr = SocialCalc.LocalizeStringList[str]; // found already this session?
   if (!cstr) { // no - look up
      cstr = SocialCalc.Constants["s_loc_"+str.toLowerCase().replace(/\s/g, "_").replace(/\W/g, "X")] || str;
      SocialCalc.LocalizeStringList[str] = cstr;
      }
   return cstr;
   }

SocialCalc.LocalizeStringList = {}; // a list of strings to localize accumulated by the routine

//
// outstr = SocialCalc.LocalizeSubstrings(str)
//
// SocialCalc function to make localization easier using %loc and %scc.
//
// Replaces sections of str with:
//    %loc!Text to localize!
// with SocialCalc.Constants.s_loc_text_to_localize if
// it exists, or else with just "Text to localize".
// Note that spaces are replaced with "_" and other special
// chars with "X" in the name of the constant (e.g., %loc!A & B!
// would look for SocialCalc.Constants.s_loc_a_X_b.
// Uses SocialCalc.LocalizeString for this.
//
// Replaces sections of str with:
//    %ssc!constant-name!
// with SocialCalc.Constants.constant-name.
// If the constant doesn't exist, throws and alert.
//

SocialCalc.LocalizeSubstrings = function(str) {

   var SCLoc = SocialCalc.LocalizeString;

   return str.replace(/%(loc|ssc)!(.*?)!/g, function(a, t, c) {
      if (t=="ssc") {
         return SocialCalc.Constants[c] || alert("Missing constant: "+c);
         }
      else {
         return SCLoc(c);
         }
      });

   }

//
// obj = GetSpreadsheetViewerObject()
//
// Returns the current spreadsheet view object
//

SocialCalc.GetSpreadsheetViewerObject = function() {

   var csvo = SocialCalc.CurrentSpreadsheetViewerObject;
   if (csvo) return csvo;

   throw ("No current SpreadsheetViewer object.");

   }


//
// SocialCalc.DoOnResize(spreadsheet)
//
// Processes an onResize event, setting the different views.
//

SocialCalc.DoOnResize = function(spreadsheet) {

   var v;
   var views = spreadsheet.views;

   var needresize = spreadsheet.SizeSSDiv();
   if (!needresize) return;

   for (vname in views) {
      v = views[vname].element;
      v.style.width = spreadsheet.width + "px";
      v.style.height = (spreadsheet.height-spreadsheet.nonviewheight) + "px";
      }

   spreadsheet.editor.ResizeTableEditor(spreadsheet.width, spreadsheet.height-spreadsheet.nonviewheight);

   }


//
// resized = SocialCalc.SizeSSDiv(spreadsheet)
//
// Figures out a reasonable size for the spreadsheet, given any requested values and viewport.
// Sets ssdiv to that.
// Return true if different than existing values.
//

SocialCalc.SizeSSDiv = function(spreadsheet) {

   var sizes, pos, resized, nodestyle, newval;
   var fudgefactorX = 10; // for IE
   var fudgefactorY = 10;

   resized = false;

   sizes = SocialCalc.GetViewportInfo();
   pos = SocialCalc.GetElementPosition(spreadsheet.parentNode);
   pos.bottom = 0;
   pos.right = 0;

   nodestyle = spreadsheet.parentNode.style;

   if (nodestyle.marginTop) {
      pos.top += nodestyle.marginTop.slice(0,-2)-0;
      }
   if (nodestyle.marginBottom) {
      pos.bottom += nodestyle.marginBottom.slice(0,-2)-0;
      }
   if (nodestyle.marginLeft) {
      pos.left += nodestyle.marginLeft.slice(0,-2)-0;
      }
   if (nodestyle.marginRight) {
      pos.right += nodestyle.marginRight.slice(0,-2)-0;
      }

   newval = spreadsheet.requestedHeight ||
            sizes.height - (pos.top + pos.bottom + fudgefactorY) -
               (spreadsheet.requestedSpaceBelow || 0);
   if (spreadsheet.height != newval) {
      spreadsheet.height = newval;
      spreadsheet.spreadsheetDiv.style.height = newval + "px";
      resized = true;
      }
   newval = spreadsheet.requestedWidth ||
            sizes.width - (pos.left + pos.right + fudgefactorX) || 700;
   if (spreadsheet.width != newval) {
      spreadsheet.width = newval;
      spreadsheet.spreadsheetDiv.style.width = newval + "px";
      resized = true;
      }

   spreadsheet.spreadsheetDiv.style.position = "relative";

   return resized;

   }


//
// SocialCalc.SpreadsheetViewerStatuslineCallback
//

SocialCalc.SpreadsheetViewerStatuslineCallback = function(editor, status, arg, params) {

   var spreadsheet = params.spreadsheetobj;
   var slstr = "";

   if (spreadsheet && spreadsheet.statuslineDiv) {
      if (spreadsheet.statuslineFull) {
         slstr = editor.GetStatuslineString(status, arg, params);
         }
      else {
         slstr = editor.ecell.coord;
         }
      slstr = spreadsheet.statuslineHTML.replace(/\{status\}/, slstr);
      spreadsheet.statuslineDiv.innerHTML = slstr;
      }

   switch (status) {
      case "cmdendnorender":
      case "calcfinished":
      case "doneposcalc":
         break; // not updating Recalc button since no toolbar

      default:
         break;
      }

   }


//
// SocialCalc.CmdGotFocus(obj)
//
// Sets SocialCalc.Keyboard.passThru: obj should be element with focus or "true"
//

SocialCalc.CmdGotFocus = function(obj) {

   SocialCalc.Keyboard.passThru = obj;

   }


//
// result = SocialCalc.SpreadsheetViewerCreateSheetHTML(spreadsheet)
//
// Returns the HTML representation of the whole spreadsheet
//

SocialCalc.SpreadsheetViewerCreateSheetHTML = function(spreadsheet) {

   var context, div, ele;

   var result = "";

   context = new SocialCalc.RenderContext(spreadsheet.sheet);
   div = document.createElement("div");
   ele = context.RenderSheet(null, {type: "html"});
   div.appendChild(ele);
   delete context;
   result = div.innerHTML;
   delete ele;
   delete div;
   return result;

   }


///////////////////////
//
// LOAD ROUTINE
//
///////////////////////

//
// parts = SocialCalc.SpreadsheetViewerDecodeSpreadsheetSave(spreadsheet, str)
//
// Separates the parts from a spreadsheet save string, returning an object with the sub-strings.
//
//    {type1: {start: startpos, end: endpos}, type2:...}
//

SocialCalc.SpreadsheetViewerDecodeSpreadsheetSave = function(spreadsheet, str) {

   var pos1, mpregex, searchinfo, boundary, boundaryregex, blanklineregex, start, ending, lines, i, lines, p, pnun;
   var parts = {};
   var partlist = [];

var hasreturnonly = /[^\n]\r[^\n]/;
if (hasreturnonly.test(str)) {
str = str.replace(/([^\n])\r([^\n])/g, "$1\r\n$2");
}
   pos1 = str.search(/^MIME-Version:\s1\.0/mi);
   if (pos1 < 0) return parts;

   mpregex = /^Content-Type:\s*multipart\/mixed;\s*boundary=(\S+)/mig;
   mpregex.lastIndex = pos1;

   searchinfo = mpregex.exec(str);
   if (mpregex.lastIndex <= 0) return parts;
   boundary = searchinfo[1];

   boundaryregex = new RegExp("^--"+boundary+"(?:\r\n|\n)", "mg");
   boundaryregex.lastIndex = mpregex.lastIndex;

   searchinfo = boundaryregex.exec(str); // find header top boundary
   blanklineregex = /(?:\r\n|\n)(?:\r\n|\n)/gm;
   blanklineregex.lastIndex = boundaryregex.lastIndex;
   searchinfo = blanklineregex.exec(str); // skip to after blank line
   if (!searchinfo) return parts;
   start = blanklineregex.lastIndex;
   boundaryregex.lastIndex = start;
   searchinfo = boundaryregex.exec(str); // find end of header
   if (!searchinfo) return parts;
   ending = searchinfo.index;

   lines = str.substring(start, ending).split(/\r\n|\n/); // get header as lines
   for (i=0;i<lines.length;i++) {
      line=lines[i];
      p = line.split(":");
      switch (p[0]) {
         case "version":
            break;
         case "part":
            partlist.push(p[1]);
            break;
         }
      }

   for (pnum=0; pnum<partlist.length; pnum++) { // get each part
      blanklineregex.lastIndex = ending;
      searchinfo = blanklineregex.exec(str); // find blank line ending mime-part header
      if (!searchinfo) return parts;
      start = blanklineregex.lastIndex;
      if (pnum==partlist.length-1) { // last one has different boundary
         boundaryregex = new RegExp("^--"+boundary+"--$", "mg");
         }
      boundaryregex.lastIndex = start;
      searchinfo = boundaryregex.exec(str); // find ending boundary
      if (!searchinfo) return parts;
      ending = searchinfo.index;
      parts[partlist[pnum]] = {start: start, end: ending}; // return position within full string
      }

   return parts;

   }


// END OF FILE

