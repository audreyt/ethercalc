<html>
<head>
<title>MeetingCalc - Share the URL to your friends and edit together!</title>

<script type="text/javascript" src="socialcalcconstants.js"></script>
<script type="text/javascript" src="socialcalc-3.js"></script>
<script type="text/javascript" src="socialcalctableeditor.js"></script>
<script type="text/javascript" src="formatnumber2.js"></script>
<script type="text/javascript" src="formula1.js"></script>
<script type="text/javascript" src="socialcalcpopup.js"></script>
<script type="text/javascript" src="socialcalcspreadsheetcontrol.js"></script>
<script type="text/javascript" src="third-party/class-js/lib/Class.js"></script>
<script type="text/javascript" src="third-party/wikiwyg/lib/Document/Emitter.js"></script>
<script type="text/javascript" src="third-party/wikiwyg/lib/Document/Emitter/HTML.js"></script>
<script type="text/javascript" src="third-party/wikiwyg/lib/Document/Parser.js"></script>
<script type="text/javascript" src="third-party/wikiwyg/lib/Document/Parser/Wikitext.js"></script>
<script src="/socket.io/socket.io.js"></script>
<script src="/zappa/jquery.js"></script>
<script src="/zappa/zappa.js"></script>
<script src="player.js"></script>

<link rel="stylesheet" type="text/css" href="socialcalc.css">
<link rel="stylesheet" type="text/css" href="index.css">
<style>
body
 {font-family:verdana,helvetica,sans-serif;font-size:small;}
.testclass {border:2px dotted red;}
.testclass2 {background-image:url(images/sc-logo.gif);}
.smaller {font-size:smaller;}
.hide {display:none;}
</style>
</head>
<body onresize="if (typeof doresize != 'undefined') doresize();" onload="
/*
    if (typeof localStorage != 'undefined') {
        var saved = localStorage.getItem(location.href);
        if (saved) {
            savestr.value = saved;
            doreload();
        }
    }
    */
">
<form name="f0" action="" method="POST">
<div style="padding:6px;background-color:#80A9F3;">
<span style="font-weight:bold;color:white;">ssctrltest1.html</span>
<input type="button" name="savespreadsheet" value="Save" onclick="dosave();" class="smaller">
<input type="submit" name="newcolors" value="New Colors" onclick="document.f0.action='?4C808';" class="smaller">
<input class="hide" type="button" value="Recalc" onclick="spreadsheet.ExecuteCommand('recalc', '');" class="smaller">
<input class="hide" type="button" value="Redisplay" onclick="spreadsheet.editor.ScheduleRender();" class="smaller">
<input class="hide" type="button" value="Settings" onclick="alert(sv=spreadsheet.editor.SaveEditorSettings());" class="smaller">
<input type="button" value="Reload" onclick="doreload();" class="smaller">
<input class="hide" type="button" value="CellHTMLSave" onclick="alert(spreadsheet.CreateCellHTMLSave(null));" class="smaller">
<input class="hide" type="button" value="CellHTML A1" onclick="alert(spreadsheet.CreateCellHTML('A1'));" class="smaller">
<input class="hide" type="button" value="SheetHTML" onclick="alert(spreadsheet.CreateSheetHTML());" class="smaller">
<input class="hide" type="button" value="SheetSave" onclick="alert(spreadsheet.CreateSheetSave());" class="smaller">
<input class="hide" type="button" value="Attribs" onclick="doattribs();" class="smaller">
<input class="hide" type="button" value="New Copy" onclick="newcopy();" class="smaller">
<input class="hide" type="button" value="Sum" onclick="dosum();" class="smaller">
<input class="hide" type="button" value="Sum2" onclick="dosum2();" class="smaller">
<input type="button" value="Loc Constants" onclick="doLocConstants();" class="smaller">
<input type="button" value="Canonicalize" onclick="var t=new Date();var i;for(i=0;i<1;i++){spreadsheet.sheet.CanonicalizeSheet(true);}addmsg(((new Date()-t)/1000));" class="smaller">
<input type="button" value="Canonical Save" onclick="alert(spreadsheet.sheet.CreateSheetSave(null,true));" class="smaller">
<input type="button" value="Time Canonicalize" onclick="var t=new Date();var i;for(i=0;i<100;i++){spreadsheet.sheet.CanonicalizeSheet(true);}addmsg(((new Date()-t)/1000));" class="smaller">
<input type="button" value="Time Save" onclick="var t=new Date();var i;for(i=0;i<100;i++){spreadsheet.CreateSpreadsheetSave();}addmsg(((new Date()-t)/1000));" class="smaller">
<input type="button" value="Time C-Save" onclick="var t=new Date();var i;for(i=0;i<100;i++){spreadsheet.sheet.CreateSheetSave(null,true);}addmsg(((new Date()-t)/1000));" class="smaller">
<input type="button" value="Time Encode" onclick="var t=new Date();var i;for(i=0;i<100;i++){spreadsheet.sheet.EncodeCellAttributes(spreadsheet.editor.ecell.coord);}addmsg(((new Date()-t)/1000));" class="smaller">
<textarea id="savestr" style="display:none;"></textarea>
<input type="hidden" name="newstr" id="newdata" value="">
<input type="hidden" name="pagename" value="$pagename">
<input type="hidden" name="sheetname" value="$sheetname">
</div>
</form>
<div id="msg" style="position:absolute;right:15px;top: 8px; bottom: 80px">
<textarea id="msgtext" style="margin-top:10px;width:110px;height:100%;"></textarea><br>
<form id="msgform">
<input type="text" id="msgout" name="msgout" style="width: 110px">
<br>
<input type="submit" style="font-size:x-small;" value="Add a line" onclick="val = document.getElementById('msgout').value; if (/\S/.test(val)) {SocialCalc.Callbacks.broadcast('chat', {msg: val}); addmsg(val, false); document.getElementById('msgout').value = ''}; return false"><br>
</form>
</div>
<div id="tableeditor" style="margin:8px 140px 10px 0px;">&nbsp;</div>
<script>

document.getElementById("msgtext").value = "";

function setmsg(msg) {document.getElementById("msg").innerHTML = msg;}
function addmsg(msg, clear) {
   var msgtextid = document.getElementById("msgtext");
   if (!msgtextid) {
      document.getElementById("msg").innerHTML = '<textarea id="msgtext" cols="60" rows="5"></textarea>';
      msgtextid = document.getElementById("msgtext");
      }
   if (clear) msgtextid.value = "";
   if (msgtextid.value.length>0) msgtextid.value += "\n";
   msgtextid.value += msg;
   }

//
// Setup code starts here:
//

//   SocialCalc.ConstantsSetClasses("");

   var scc = SocialCalc.Constants;

   var b1 = window.location.search.charAt(1) || "4";
   var b2 = window.location.search.charAt(2) || "C";
   var b3 = window.location.search.charAt(3) || "8";
   var b4 = window.location.search.charAt(4) || "9";
   var b5 = window.location.search.charAt(5) || "8";

   scc.SCToolbarbackground = "background-color:#4040"+b1+"0;";
   scc.SCTabbackground = "background-color:#CC"+b2+";";
   scc.SCTabselectedCSS = "font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#4040"+b1+"0;cursor:default;border-right:1px solid #CC"+b2+";";
   scc.SCTabplainCSS = "font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#8080"+b3+"0;cursor:default;border-right:1px solid #CC"+b2+";";
   scc.SCToolbartext = "font-size:x-small;font-weight:bold;color:#FFF;padding-bottom:4px;";
   scc.ISCButtonBorderNormal = "#4040"+b1+"0";
   scc.ISCButtonBorderHover = "#99"+b4+"";
   scc.ISCButtonBorderDown = "#FFF";
   scc.ISCButtonDownBackground = "#88"+b5+"";

   SocialCalc.Popup.LocalizeString = SocialCalc.LocalizeString; // needed for localization

   var spreadsheet = new SocialCalc.SpreadsheetControl();
   var savestr = document.getElementById("savestr");

   spreadsheet.InitializeSpreadsheetControl("tableeditor", 0, 0, 0);
   spreadsheet.ExecuteCommand('redisplay', '');
   spreadsheet.ExecuteCommand('set sheet defaulttextvalueformat text-wiki');

   spreadsheet.ExportCallback = function(s) {
      alert(SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "csv"));
      }

// Dummy loadsheet for testing:
SocialCalc.Formula.SheetCache.LoadSheet = function(sheetname) {
   var sfscc = SocialCalc.Formula.SheetCache.constants;
   var doload = confirm("Loadsheet: "+sheetname+"?");
   if (true) {
      return {status: doload?sfscc.ok:sfscc.loading, str: "cell:A1:v:4\ncell:A2:t:Sheet\\c "+sheetname+"\ncell:A3:vtf:ndt:0:NOW()\ncell:B1:v:5\ncell:B2:v:6\nname:AONE::A1\nname:ATWO::A2\nname:RANGE::B1\\cB2\nname:TEST::A3",
              recalc: true};
      }
   return null;
   }

// ExpandWiki code for testing

SocialCalc.Callbacks.expand_wiki = function(val) {
    return(
        '<div class="wiki">' +
        ( (new Document.Parser.Wikitext()).parse(val, new Document.Emitter.HTML()) ) +
        '</div>'
    );
   }

function dosave() {
   savestr.value = spreadsheet.CreateSpreadsheetSave();
   if (typeof localStorage != 'undefined') {
    try { localStorage.setItem(location.href, savestr.value) } catch (e) {};
   }
   else {
    alert(savestr.value);
   }
   }

function doreload(saved) {

   var parts = spreadsheet.DecodeSpreadsheetSave(saved || savestr.value);
   if (parts) {
      if (parts.sheet) {
         spreadsheet.sheet.ResetSheet();
         spreadsheet.ParseSheetSave(savestr.value.substring(parts.sheet.start, parts.sheet.end));
         }
      if (parts.edit) {
         spreadsheet.editor.LoadEditorSettings(savestr.value.substring(parts.edit.start, parts.edit.end));
         }
      }
   if (spreadsheet.editor.context.sheetobj.attribs.recalc=="off") {
      spreadsheet.ExecuteCommand('redisplay', '');
      }
   else {
      spreadsheet.ExecuteCommand('recalc', '');
      }
   }

function doresize() {
   spreadsheet.DoOnResize();
   }

function doattribs() {
   var attribs = spreadsheet.sheet.EncodeCellAttributes(spreadsheet.editor.ecell.coord);
   var str = "";
   for (var attrib in attribs) {
      str += attrib + ":" + " def="+attribs[attrib].def+", val='"+attribs[attrib].val+"'\n";
      }
   str+="=====\n";
   attribs = spreadsheet.sheet.EncodeSheetAttributes();
   for (var attrib in attribs) {
      str += attrib + ":" + " def="+attribs[attrib].def+", val='"+attribs[attrib].val+"'\n";
      }
   alert(str);
   }

var fromrange = "A1:A1";

function newcopy() {

   var ta, cell, position, sel, parseobj;

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;

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

   parseobj = new SocialCalc.Parse("copy "+sel+" all");
   SocialCalc.ExecuteSheetCommand(editor.context.sheetobj, parseobj, true); // note: not queued!!!??!!
   SocialCalc.Clipboard.clipboard.loadedByCtrlC = true; // remember this clipboard data was from ctrl-c
   ta.value = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "tab");
   ta.style.display = "block";
   ta.focus();
   ta.select();
//   var range = document.selection.createRange();
var range = window.getSelection().getRangeAt(0);

   range.execCommand("copy");
   window.setTimeout(function() {
      var s = SocialCalc.GetSpreadsheetControlObject();
      var editor = s.editor;
      var ta = editor.pasteTextarea;
      ta.style.display = "none";
      }, 200);
   return;
  }

function dosum() {

   var cmd, cell, row, col, sel, cr, foundvalue;

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;
   var sheet = editor.context.sheetobj;

   if (editor.range.hasrange) {
      sel = SocialCalc.crToCoord(editor.range.left, editor.range.top)+
         ":"+SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
      cmd = "set "+SocialCalc.crToCoord(editor.range.right, editor.range.bottom+1)+
         " formula sum("+sel+")";
      }
   else {
      row = editor.ecell.row - 1;
      col = editor.ecell.col;
      if (row<=1) {
         cmd = "set "+editor.ecell.coord+" constant e#REF! 0 #REF!";
         }
      else {
         foundvalue = false;
         while (row>0) {
            cr = SocialCalc.crToCoord(col, row);
            cell = sheet.GetAssuredCell(cr);
            if (!cell.datatype || cell.datatype=="t") {
               if (foundvalue) {
                  row++;
                  break;
                  }
               }
            else {
               foundvalue = true;
               }
            row--;
            }
         cmd = "set "+editor.ecell.coord+" formula sum("+
            SocialCalc.crToCoord(col,row)+":"+SocialCalc.crToCoord(col, editor.ecell.row-1)+")";
         }
      }

   editor.EditorScheduleSheetCommands(cmd);

  }

function dosum2() {

   var cmd, cell, row, col, sel, cr, foundvalue;

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;
   var sheet = editor.context.sheetobj;

   if (editor.range.hasrange) {
      sel = SocialCalc.crToCoord(editor.range.left, editor.range.top)+
         ":"+SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
      cmd = "sum("+sel+")";
      }
   else {
      row = editor.ecell.row - 1;
      col = editor.ecell.col;
      if (row<=1) {
         cmd = "sum()";
         }
      else {
         foundvalue = false;
         while (row>0) {
            cr = SocialCalc.crToCoord(col, row);
            cell = sheet.GetAssuredCell(cr);
            if (!cell.datatype || cell.datatype=="t") {
               if (foundvalue) {
                  row++;
                  break;
                  }
               }
            else {
               foundvalue = true;
               }
            row--;
            }
         cmd = "sum("+
            SocialCalc.crToCoord(col,row)+":"+SocialCalc.crToCoord(col, editor.ecell.row-1)+")";
         }
      }

   editor.EditorAddToInput(cmd, "=");

  }

function doLocConstants() {

   var str = "";
   var cname, i, ctname, cval;
   var cnames = [];
   for (cname in SocialCalc.LocalizeStringList) {
      cnames.push(cname);
      }
   cnames.sort();
   for (i=0; i<cnames.length; i++) {
      cname = cnames[i];
      ctname = "s_loc_"+cname.toLowerCase().replace(/\s/g, "_").replace(/\W/g, "X");
      cval = SocialCalc.Constants[ctname];
//      str += ctname + ": ";
//      str += '"' + SocialCalc.LocalizeStringList[cname] + '",\n';
      if (!cval) {
         str += ctname + ': "' + cname + '",\n';
         }
      }
   if (!str) str = "All constants were pre-defined.";
   addmsg(str);
   alert(str);
   }

</script>
</body>
</html>
