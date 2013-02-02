//
/*
// The module of the SocialCalc package with customizable constants, strings, etc.
// This is where most of the common localizations are done.
//
// (c) Copyright 2008, 2009, 2010 Socialtext, Inc.
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

var SocialCalc;
if (!SocialCalc) SocialCalc = {};

// *************************************
//
// TO LEARN HOW TO LOCALIZE OR CUSTOMIZE SOCIALCALC, PLEASE READ THIS:
//
// The constants are all properties of the SocialCalc.Constants object.
// They are grouped here by what they are for, which module uses them, etc.
//
// Properties whose names start with "s_" are strings, or arrays of strings,
// that are good candidates for translation from the English.
//
// Other properties relate to visual settings, localization parameters, etc.
//
// These values are not used when SocialCalc modules are first loaded.
// They may be modified before the first use of the routines that use them,
// e.g., before creating SocialCalc objects.
//
// The exceptions are:
//    TooltipOffsetX and TooltipOffsetY, as described with their definitions.
//
// SocialCalc IS NOT DESIGNED FOR USE WITH A TRANSLATION FUNCTION each time a string
// is used. Instead, language translations may be done by modifying this object.
//
// To customize SocialCalc, you may either replace this file with a modified version
// or you can overwrite the values before use. An example would be to
// iterate over all the properties looking for names that start with "s_" and
// use some other mechanism to obtain a localized string and replace the values
// here with those translated values.
//
// There is also a function, SocialCalc.ConstantsSetClasses, that may be used
// to easily switch SocialCalc from using explicit CSS styles for many things
// to using CSS classes. See the function, below, for more information.
//
// *************************************

SocialCalc.Constants = {

//
// Main SocialCalc module, socialcalc-3.js:
//

   //*** Common Constants

   textdatadefaulttype: "t", // This sets the default type for text on reading source file
                             // It should normally be "t"

   //*** Common error messages

   s_BrowserNotSupported: "Browser not supported.", // error thrown if browser can't handle events like IE or Firefox.
   s_InternalError: "Internal SocialCalc error (probably an internal bug): ", // hopefully unlikely, but a test failed

   //*** SocialCalc.ParseSheetSave

   // Errors thrown on unexpected value in save file:

   s_pssUnknownColType: "Unknown col type item",
   s_pssUnknownRowType: "Unknown row type item",
   s_pssUnknownLineType: "Unknown line type",

   //*** SocialCalc.CellFromStringParts

   // Error thrown on unexpected value in save file:

   s_cfspUnknownCellType: "Unknown cell type item",

   //*** SocialCalc.CanonicalizeSheet

   doCanonicalizeSheet: true, // if true, do the canonicalization calculations

   //*** ExecuteSheetCommand

   s_escUnknownSheetCmd: "Unknown sheet command: ",
   s_escUnknownSetCoordCmd: "Unknown set coord command: ",
   s_escUnknownCmd: "Unknown command: ",

   //*** SocialCalc.CheckAndCalcCell

   s_caccCircRef: "Circular reference to ", // circular reference found during recalc

   //*** SocialCalc.RenderContext

   defaultRowNameWidth: "30", // used to set minimum width of the row header column - a string in pixels
   defaultAssumedRowHeight: 15, // used when guessing row heights - number
   defaultCellIDPrefix: "cell_", // if non-null, each cell will render with an ID starting with this

   // Default sheet display values

   defaultCellLayout: "padding:2px 2px 1px 2px;vertical-align:top;",
   defaultCellFontStyle: "normal normal",
   defaultCellFontSize: "small",
   defaultCellFontFamily: "Verdana,Arial,Helvetica,sans-serif",

   defaultPaneDividerWidth: "2", // a string
   defaultPaneDividerHeight: "3", // a string

   defaultGridCSS: "1px solid #C0C0C0;", // used as style to set each border when grid enabled (was #ECECEC)

   defaultCommentClass: "", // class added to cells with non-null comments when grid enabled
   defaultCommentStyle: "background-repeat:no-repeat;background-position:top right;background-image:url(images/sc-commentbg.gif);", // style added to cells with non-null comments when grid enabled
   defaultCommentNoGridClass: "", // class added to cells with non-null comments when grid not enabled
   defaultCommentNoGridStyle: "", // style added to cells with non-null comments when grid not enabled

   defaultReadonlyClass: "", // class added to readonly cells when grid enabled
   defaultReadonlyStyle: "background-repeat:no-repeat;background-position:top right;background-image:url(images/sc-lockbg.gif);", // style added to readonly cells when grid enabled
   defaultReadonlyNoGridClass: "", // class added to readonly cells when grid not enabled
   defaultReadonlyNoGridStyle: "", // style added to readonly cells when grid not enabled
   defaultReadonlyComment: "Locked cell",

   defaultColWidth: "80", // text
   defaultMinimumColWidth: 10, // numeric

   // For each of the following default sheet display values at least one of class and/or style are needed

   defaultHighlightTypeCursorClass: "",
   defaultHighlightTypeCursorStyle: "color:#FFF;backgroundColor:#A6A6A6;",
   defaultHighlightTypeRangeClass: "",
   defaultHighlightTypeRangeStyle: "color:#000;backgroundColor:#E5E5E5;",

   defaultColnameClass: "", // regular column heading letters, needs a cursor property 
   defaultColnameStyle: "font-size:small;text-align:center;color:#FFFFFF;background-color:#808080;cursor:e-resize;",
   defaultSelectedColnameClass: "", // column with selected cell, needs a cursor property 
   defaultSelectedColnameStyle: "font-size:small;text-align:center;color:#FFFFFF;background-color:#404040;cursor:e-resize;",
   defaultRownameClass: "", // regular row heading numbers
   defaultRownameStyle: "font-size:small;text-align:right;color:#FFFFFF;background-color:#808080;",
   defaultSelectedRownameClass: "", // column with selected cell, needs a cursor property 
   defaultSelectedRownameStyle: "font-size:small;text-align:right;color:#FFFFFF;background-color:#404040;",
   defaultUpperLeftClass: "", // Corner cell in upper left
   defaultUpperLeftStyle: "font-size:small;",
   defaultSkippedCellClass: "", // used if present for spanned cells peeking into a pane (at least one of class/style needed)
   defaultSkippedCellStyle: "font-size:small;background-color:#CCC", // used if present
   defaultPaneDividerClass: "", // used if present for the look of the space between panes (at least one of class/style needed)
   defaultPaneDividerStyle: "font-size:small;background-color:#C0C0C0;padding:0px;", // used if present
   defaultUnhideLeftClass: "",
   defaultUnhideLeftStyle: "float:right;width:9px;height:12px;cursor:pointer;background-image:url(images/sc-unhideleft.gif);padding:0;", // used if present
   defaultUnhideRightClass: "",
   defaultUnhideRightStyle: "float:left;width:9px;height:12px;cursor:pointer;background-image:url(images/sc-unhideright.gif);padding:0;", // used if present
   defaultUnhideTopClass: "",
   defaultUnhideTopStyle: "float:left;position:absolute;bottom:-4px;width:12px;height:9px;cursor:pointer;background-image:url(images/sc-unhidetop.gif);padding:0;",
   defaultUnhideBottomClass: "",
   defaultUnhideBottomStyle: "float:left;width:12px;height:9px;cursor:pointer;background-image:url(images/sc-unhidebottom.gif);padding:0;",

   s_rcMissingSheet: "Render Context must have a sheet object", // unlikely thrown error

   //*** SocialCalc.format_text_for_display

   defaultLinkFormatString: '<span style="font-size:smaller;text-decoration:none !important;background-color:#66B;color:#FFF;">Link</span>', // used for format "text-link"; you could make this an img tag if desired
//   defaultLinkFormatString: '<img src="images/sc-linkout.gif" border="0" alt="Link out" title="Link out">',
   defaultPageLinkFormatString: '<span style="font-size:smaller;text-decoration:none !important;background-color:#66B;color:#FFF;">Page</span>', // used for format "text-link"; you could make this an img tag if desired

   //*** SocialCalc.format_number_for_display

   defaultFormatp: '#,##0.0%',
   defaultFormatc: '[$$]#,##0.00',
   defaultFormatdt: 'd-mmm-yyyy h:mm:ss',
   defaultFormatd: 'd-mmm-yyyy',
   defaultFormatt: '[h]:mm:ss',
   defaultDisplayTRUE: 'TRUE', // how TRUE shows when rendered
   defaultDisplayFALSE: 'FALSE',

//
// SocialCalc Table Editor module, socialcalctableeditor.js:
//

   //*** SocialCalc.TableEditor

   defaultImagePrefix: "images/sc-", // URL prefix for images (e.g., "/images/sc")
   defaultTableEditorIDPrefix: "te_", // if present, many TableEditor elements are assigned IDs with this prefix
   defaultPageUpDnAmount: 15, // number of rows to move cursor on PgUp/PgDn keys (numeric)

   AllowCtrlS: true, // turns on Ctrl-S trapdoor for setting custom numeric formats and commands if true

   //*** SocialCalc.CreateTableEditor

   defaultTableControlThickness: 20, // the short size for the scrollbars, etc. (numeric in pixels)
   cteGriddivClass: "", // if present, the class for the TableEditor griddiv element

   //** SocialCalc.EditorGetStatuslineString -- strings shown on status line

   s_statusline_executing: "Executing...",
   s_statusline_displaying: "Displaying...",
   s_statusline_ordering: "Ordering...",
   s_statusline_calculating: "Calculating...",
   s_statusline_calculatingls: "Calculating... Loading Sheet...",
   s_statusline_doingserverfunc: "doing server function ",
   s_statusline_incell: " in cell ",
   s_statusline_calcstart: "Calculation start...",
   s_statusline_sum: "SUM",
   s_statusline_recalcneeded: '<span style="color:#999;">(Recalc needed)</span>',
   s_statusline_circref: '<span style="color:red;">Circular reference: ',

   //** SocialCalc.InputBoxDisplayCellContents

   s_inputboxdisplaymultilinetext: "[Multi-line text: Click icon on right to edit]",

   //** SocialCalc.InputEcho

   defaultInputEchoClass: "", // if present, the class of the popup inputEcho div
   defaultInputEchoStyle: "filter:alpha(opacity=90);opacity:.9;backgroundColor:#FFD;border:1px solid #884;"+
      "fontSize:small;padding:2px 10px 1px 2px;cursor:default;", // if present, pseudo style
   defaultInputEchoPromptClass: "", // if present, the class of the popup inputEcho div
   defaultInputEchoPromptStyle: "filter:alpha(opacity=90);opacity:.9;backgroundColor:#FFD;"+
      "borderLeft:1px solid #884;borderRight:1px solid #884;borderBottom:1px solid #884;"+
      "fontSize:small;fontStyle:italic;padding:2px 10px 1px 2px;cursor:default;", // if present, pseudo style

   //** SocialCalc.InputEchoText

   ietUnknownFunction: "Unknown function ", // displayed when typing "=unknown("

   //** SocialCalc.CellHandles

   CH_radius1: 29.0, // extent of inner circle within 90px image
   CH_radius2: 41.0, // extent of outer circle within 90px image
   s_CHfillAllTooltip: "Fill Contents and Formats Down/Right", // tooltip for fill all handle
   s_CHfillContentsTooltip: "Fill Contents Only Down/Right", // tooltip for fill formulas handle
   s_CHmovePasteAllTooltip: "Move Contents and Formats", // etc.
   s_CHmovePasteContentsTooltip: "Move Contents Only",
   s_CHmoveInsertAllTooltip: "Slide Contents and Formats within Row/Col",
   s_CHmoveInsertContentsTooltip: "Slide Contents within Row/Col",
   s_CHindicatorOperationLookup: {"Fill": "Fill", "FillC": "Fill Contents",
                                  "Move": "Move", "MoveI": "Slide", 
                                  "MoveC": "Move Contents", "MoveIC": "Slide Contents"}, // short form of operation to follow drag
   s_CHindicatorDirectionLookup: {"Down": " Down", "Right": " Right",
                                  "Horizontal": " Horizontal", "Vertical": " Vertical"}, // direction that modifies operation during drag

   //*** SocialCalc.TableControl

   defaultTCSliderThickness: 9, // length of pane slider (numeric in pixels)
   defaultTCButtonThickness: 20, // length of scroll +/- buttons (numeric in pixels)
   defaultTCThumbThickness: 15, // length of thumb (numeric in pixels)

   //*** SocialCalc.CreateTableControl

   TCmainStyle: "backgroundColor:#EEE;", // if present, pseudo style (text-align is textAlign) for main div of a table control
   TCmainClass: "", // if present, the CSS class of the main div for a table control
   TCendcapStyle: "backgroundColor:#FFF;", // backgroundColor may be used while waiting for image that may not come
   TCendcapClass: "",
   TCpanesliderStyle: "backgroundColor:#CCC;",
   TCpanesliderClass: "",
   s_panesliderTooltiph: "Drag to lock pane vertically", // tooltip for horizontal table control pane slider
   s_panesliderTooltipv: "Drag to lock pane horizontally",
   TClessbuttonStyle: "backgroundColor:#AAA;",
   TClessbuttonClass: "",
   TClessbuttonRepeatWait: 300, // in milliseconds
   TClessbuttonRepeatInterval: 20,//100, // in milliseconds
   TCmorebuttonStyle: "backgroundColor:#AAA;",
   TCmorebuttonClass: "",
   TCmorebuttonRepeatWait: 300, // in milliseconds
   TCmorebuttonRepeatInterval: 20,//100, // in milliseconds
   TCscrollareaStyle: "backgroundColor:#DDD;",
   TCscrollareaClass: "",
   TCscrollareaRepeatWait: 500, // in milliseconds
   TCscrollareaRepeatInterval: 100, // in milliseconds
   TCthumbClass: "",
   TCthumbStyle: "backgroundColor:#CCC;",

   //*** SocialCalc.TCPSDragFunctionStart

   TCPStrackinglineClass: "", // at least one of class/style for pane slider tracking line display in table control
   TCPStrackinglineStyle: "overflow:hidden;position:absolute;zIndex:100;",
                           // if present, pseudo style (text-align is textAlign)
   TCPStrackinglineThickness: "2px", // narrow dimension of trackling line (string with units)


   //*** SocialCalc.TCTDragFunctionStart

   TCTDFSthumbstatusvClass: "", // at least one of class/style for vertical thumb dragging status display in table control
   TCTDFSthumbstatusvStyle: "height:20px;width:auto;border:3px solid #808080;overflow:hidden;"+
                           "backgroundColor:#FFF;fontSize:small;position:absolute;zIndex:100;",
                           // if present, pseudo style (text-align is textAlign)
   TCTDFSthumbstatushClass: "", // at least one of class/style for horizontal thumb dragging status display in table control
   TCTDFSthumbstatushStyle: "height:20px;width:auto;border:1px solid black;padding:2px;"+
                           "backgroundColor:#FFF;fontSize:small;position:absolute;zIndex:100;",
                           // if present, pseudo style (text-align is textAlign)
   TCTDFSthumbstatusrownumClass: "", // at least one of class/style for thumb dragging status display in table control
   TCTDFSthumbstatusrownumStyle: "color:#FFF;background-color:#808080;font-size:small;white-space:nowrap;padding:3px;", // if present, real style
   TCTDFStopOffsetv: 0, // offsets for thumbstatus display while dragging
   TCTDFSleftOffsetv: -80,
   s_TCTDFthumbstatusPrefixv: "Row ", // Text Control Drag Function text before row number
   TCTDFStopOffseth: -30,
   TCTDFSleftOffseth: 0,
   s_TCTDFthumbstatusPrefixh: "Col ", // Text Control Drag Function text before col number

   //*** SocialCalc.TooltipInfo

   // Note: These two values are used to set the TooltipInfo initial values when the code is first read in.
   // Modifying them here after loading has no effect -- you need to modify SocialCalc.TooltipInfo directly
   // to dynamically set them. This is different than most other constants which may be modified until use.

   TooltipOffsetX: 2, // offset in pixels from mouse position (to right on left side of screen, to left on right)
   TooltipOffsetY: 10, // offset in pixels above mouse position for lower edge

   //*** SocialCalc.TooltipDisplay

   TDpopupElementClass: "", // at least one of class/style for tooltip display
   TDpopupElementStyle: "border:1px solid black;padding:1px 2px 2px 2px;textAlign:center;backgroundColor:#FFF;"+
                        "fontSize:7pt;fontFamily:Verdana,Arial,Helvetica,sans-serif;"+
                        "position:absolute;width:auto;zIndex:110;",
                        // if present, pseudo style (text-align is textAlign)


//
// SocialCalc Spreadsheet Control module, socialcalcspreadsheetcontrol.js:
//

   //*** SocialCalc.SpreadsheetControl

   SCToolbarbackground: "background-color:#404040;",
   SCTabbackground: "background-color:#CCC;",
   SCTabselectedCSS: "font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#404040;cursor:default;border-right:1px solid #CCC;",
   SCTabplainCSS: "font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#808080;cursor:default;border-right:1px solid #CCC;",
   SCToolbartext: "font-size:x-small;font-weight:bold;color:#FFF;padding-bottom:4px;",

   SCFormulabarheight: 30, // in pixels, will contain a text input box

   SCStatuslineheight: 20, // in pixels
   SCStatuslineCSS: "font-size:10px;padding:3px 0px;",

   // Constants for default Format tab (settings)
   //
   // *** EVEN THOUGH THESE DON'T START WITH s_: ***
   //
   // These should be carefully checked for localization. Make sure you understand what they do and how they work!
   // The first part of "first:second|first:second|..." is what is displayed and the second is the value to be used.
   // The value is normally not translated -- only the displayed part. The [cancel], [break], etc., are not translated --
   // they are commands to SocialCalc.SettingsControls.PopupListInitialize 

   SCFormatNumberFormats: "[cancel]:|[break]:|%loc!Default!:|[custom]:|%loc!Automatic!:general|%loc!Auto w/ commas!:[,]General|[break]:|"+
            "00:00|000:000|0000:0000|00000:00000|[break]:|%loc!Formula!:formula|%loc!Hidden!:hidden|[newcol]:"+
            "1234:0|1,234:#,##0|1,234.5:#,##0.0|1,234.56:#,##0.00|1,234.567:#,##0.000|1,234.5678:#,##0.0000|"+
            "[break]:|1,234%:#,##0%|1,234.5%:#,##0.0%|1,234.56%:#,##0.00%|"+
            "[newcol]:|$1,234:$#,##0|$1,234.5:$#,##0.0|$1,234.56:$#,##0.00|[break]:|"+
            "(1,234):#,##0_);(#,##0)|(1,234.5):#,##0.0_);(#,##0.0)|(1,234.56):#,##0.00_);(#,##0.00)|[break]:|"+
            "($1,234):#,##0_);($#,##0)|($1,234.5):$#,##0.0_);($#,##0.0)|($1,234.56):$#,##0.00_);($#,##0.00)|"+
            "[newcol]:|1/4/06:m/d/yy|01/04/2006:mm/dd/yyyy|2006-01-04:yyyy-mm-dd|4-Jan-06:d-mmm-yy|04-Jan-2006:dd-mmm-yyyy|January 4, 2006:mmmm d, yyyy|"+
            "[break]:|1\\c23:h:mm|1\\c23 PM:h:mm AM/PM|1\\c23\\c45:h:mm:ss|01\\c23\\c45:hh:mm:ss|26\\c23 (h\\cm):[hh]:mm|69\\c45 (m\\cs):[mm]:ss|69 (s):[ss]|"+
            "[newcol]:|2006-01-04 01\\c23\\c45:yyyy-mm-dd hh:mm:ss|January 4, 2006:mmmm d, yyyy hh:mm:ss|Wed:ddd|Wednesday:dddd|",
   SCFormatTextFormats: "[cancel]:|[break]:|%loc!Default!:|[custom]:|%loc!Automatic!:general|%loc!Plain Text!:text-plain|"+
            "HTML:text-html|%loc!Wikitext!:text-wiki|%loc!Link!:text-link|%loc!Formula!:formula|%loc!Hidden!:hidden|",
   SCFormatPadsizes: "[cancel]:|[break]:|%loc!Default!:|[custom]:|%loc!No padding!:0px|"+
            "[newcol]:|1 pixel:1px|2 pixels:2px|3 pixels:3px|4 pixels:4px|5 pixels:5px|"+
            "6 pixels:6px|7 pixels:7px|8 pixels:8px|[newcol]:|9 pixels:9px|10 pixels:10px|11 pixels:11px|"+
            "12 pixels:12px|13 pixels:13px|14 pixels:14px|16 pixels:16px|"+
            "18 pixels:18px|[newcol]:|20 pixels:20px|22 pixels:22px|24 pixels:24px|28 pixels:28px|36 pixels:36px|",
   SCFormatFontsizes: "[cancel]:|[break]:|%loc!Default!:|[custom]:|X-Small:x-small|Small:small|Medium:medium|Large:large|X-Large:x-large|"+
                  "[newcol]:|6pt:6pt|7pt:7pt|8pt:8pt|9pt:9pt|10pt:10pt|11pt:11pt|12pt:12pt|14pt:14pt|16pt:16pt|"+
                  "[newcol]:|18pt:18pt|20pt:20pt|22pt:22pt|24pt:24pt|28pt:28pt|36pt:36pt|48pt:48pt|72pt:72pt|"+
                  "[newcol]:|8 pixels:8px|9 pixels:9px|10 pixels:10px|11 pixels:11px|"+
                  "12 pixels:12px|13 pixels:13px|14 pixels:14px|[newcol]:|16 pixels:16px|"+
                  "18 pixels:18px|20 pixels:20px|22 pixels:22px|24 pixels:24px|28 pixels:28px|36 pixels:36px|",
   SCFormatFontfamilies: "[cancel]:|[break]:|%loc!Default!:|[custom]:|Verdana:Verdana,Arial,Helvetica,sans-serif|"+
                  "Arial:arial,helvetica,sans-serif|Courier:'Courier New',Courier,monospace|",
   SCFormatFontlook: "[cancel]:|[break]:|%loc!Default!:|%loc!Normal!:normal normal|%loc!Bold!:normal bold|%loc!Italic!:italic normal|"+
                  "%loc!Bold Italic!:italic bold",
   SCFormatTextAlignhoriz:  "[cancel]:|[break]:|%loc!Default!:|%loc!Left!:left|%loc!Center!:center|%loc!Right!:right|",
   SCFormatNumberAlignhoriz:  "[cancel]:|[break]:|%loc!Default!:|%loc!Left!:left|%loc!Center!:center|%loc!Right!:right|",
   SCFormatAlignVertical: "[cancel]:|[break]:|%loc!Default!:|%loc!Top!:top|%loc!Middle!:middle|%loc!Bottom!:bottom|",
   SCFormatColwidth: "[cancel]:|[break]:|%loc!Default!:|[custom]:|[newcol]:|"+
                  "20 pixels:20|40:40|60:60|80:80|100:100|120:120|140:140|160:160|"+
                  "[newcol]:|180 pixels:180|200:200|220:220|240:240|260:260|280:280|300:300|",
   SCFormatRecalc: "[cancel]:|[break]:|%loc!Auto!:|%loc!Manual!:off|",
   SCFormatUserMaxCol: "[cancel]:|[break]:|%loc!Default!:|[custom]:|[newcol]:|"+
                  "Unlimited:0|10:10|20:20|30:30|40:40|50:50|60:60|80:80|100:100|",
   SCFormatUserMaxRow: "[cancel]:|[break]:|%loc!Default!:|[custom]:|[newcol]:|"+
                  "Unlimited:0|10:10|20:20|30:30|40:40|50:50|60:60|80:80|100:100|",

   //*** SocialCalc.InitializeSpreadsheetControl

   ISCButtonBorderNormal: "#404040",
   ISCButtonBorderHover: "#999",
   ISCButtonBorderDown: "#FFF",
   ISCButtonDownBackground: "#888",

   //*** SocialCalc.SettingsControls.PopupListInitialize

   s_PopupListCancel: "[Cancel]",
   s_PopupListCustom: "Custom",

   // ***
   //
   // s_loc_ constants accessed by SocialCalc.LocalizeString and SocialCalc.LocalizeSubstrings
   //
   // Used extensively by socialcalcspreadsheetcontrol.js
   //
   // ***

   s_loc_align_center: "Align Center",
   s_loc_align_left: "Align Left",
   s_loc_align_right: "Align Right",
   s_loc_alignment: "Alignment",
   s_loc_audit: "Audit",
   s_loc_audit_trail_this_session: "Audit Trail This Session",
   s_loc_auto: "Auto",
   s_loc_auto_sum: "Auto Sum",
   s_loc_auto_wX_commas: "Auto w/ commas",
   s_loc_automatic: "Automatic",
   s_loc_background: "Background",
   s_loc_bold: "Bold",
   s_loc_bold_XampX_italics: "Bold &amp; Italics",
   s_loc_bold_italic: "Bold Italic",
   s_loc_borders: "Borders",
   s_loc_borders_off: "Borders Off",
   s_loc_borders_on: "Borders On",
   s_loc_bottom: "Bottom",
   s_loc_bottom_border: "Bottom Border",
   s_loc_cell_settings: "CELL SETTINGS",
   s_loc_csv_format: "CSV format",
   s_loc_cancel: "Cancel",
   s_loc_category: "Category",
   s_loc_center: "Center",
   s_loc_clear: "Clear",
   s_loc_clear_socialcalc_clipboard: "Clear SocialCalc Clipboard",
   s_loc_clipboard: "Clipboard",
   s_loc_color: "Color",
   s_loc_column_: "Column ",
   s_loc_comment: "Comment",
   s_loc_copy: "Copy",
   s_loc_custom: "Custom",
   s_loc_cut: "Cut",
   s_loc_default: "Default",
   s_loc_default_alignment: "Default Alignment",
   s_loc_default_column_width: "Default Column Width",
   s_loc_default_font: "Default Font",
   s_loc_default_format: "Default Format",
   s_loc_default_padding: "Default Padding",
   s_loc_delete: "Delete",
   s_loc_delete_column: "Delete Column",
   s_loc_delete_contents: "Delete Contents",
   s_loc_delete_row: "Delete Row",
   s_loc_description: "Description",
   s_loc_display_clipboard_in: "Display Clipboard in",
   s_loc_down: "Down",
   s_loc_edit: "Edit",
   s_loc_existing_names: "Existing Names",
   s_loc_family: "Family",
   s_loc_fill_down: "Fill Down",
   s_loc_fill_right: "Fill Right",
   s_loc_font: "Font",
   s_loc_format: "Format",
   s_loc_formula: "Formula",
   s_loc_function_list: "Function List",
   s_loc_functions: "Functions",
   s_loc_grid: "Grid",
   s_loc_hidden: "Hidden",
   s_loc_horizontal: "Horizontal",
   s_loc_insert_column: "Insert Column",
   s_loc_insert_row: "Insert Row",
   s_loc_italic: "Italic",
   s_loc_last_sort: "Last Sort",
   s_loc_left: "Left",
   s_loc_left_border: "Left Border",
   s_loc_link: "Link",
   s_loc_link_input_box: "Link Input Box",
   s_loc_list: "List",
   s_loc_load_socialcalc_clipboard_with_this: "Load SocialCalc Clipboard With This",
   s_loc_major_sort: "Major Sort",
   s_loc_manual: "Manual",
   s_loc_merge_cells: "Merge Cells",
   s_loc_middle: "Middle",
   s_loc_minor_sort: "Minor Sort",
   s_loc_move_insert: "Move Insert",
   s_loc_move_paste: "Move Paste",
   s_loc_multiXline_input_box: "Multi-line Input Box",
   s_loc_name: "Name",
   s_loc_names: "Names",
   s_loc_no_padding: "No padding",
   s_loc_normal: "Normal",
   s_loc_number: "Number",
   s_loc_number_horizontal: "Number Horizontal",
   s_loc_ok: "OK",
   s_loc_padding: "Padding",
   s_loc_page_name: "Page Name",
   s_loc_paste: "Paste",
   s_loc_paste_formats: "Paste Formats",
   s_loc_plain_text: "Plain Text",
   s_loc_recalc: "Recalc",
   s_loc_recalculation: "Recalculation",
   s_loc_redo: "Redo",
   s_loc_right: "Right",
   s_loc_right_border: "Right Border",
   s_loc_sheet_settings: "SHEET SETTINGS",
   s_loc_save: "Save",
   s_loc_save_to: "Save to",
   s_loc_set_cell_contents: "Set Cell Contents",
   s_loc_set_cells_to_sort: "Set Cells To Sort",
   s_loc_set_value_to: "Set Value To",
   s_loc_set_to_link_format: "Set to Link format",
   s_loc_setXclear_move_from: "Set/Clear Move From",
   s_loc_show_cell_settings: "Show Cell Settings",
   s_loc_show_sheet_settings: "Show Sheet Settings",
   s_loc_show_in_new_browser_window: "Show in new browser window",
   s_loc_size: "Size",
   s_loc_socialcalcXsave_format: "SocialCalc-save format",
   s_loc_sort: "Sort",
   s_loc_sort_: "Sort ",
   s_loc_sort_cells: "Sort Cells",
   s_loc_swap_colors: "Swap Colors",
   s_loc_tabXdelimited_format: "Tab-delimited format",
   s_loc_text: "Text",
   s_loc_text_horizontal: "Text Horizontal",
   s_loc_this_is_aXbrXsample: "This is a<br>sample",
   s_loc_top: "Top",
   s_loc_top_border: "Top Border",
   s_loc_undone_steps: "UNDONE STEPS",
   s_loc_url: "URL",
   s_loc_undo: "Undo",
   s_loc_unmerge_cells: "Unmerge Cells",
   s_loc_up: "Up",
   s_loc_value: "Value",
   s_loc_vertical: "Vertical",
   s_loc_wikitext: "Wikitext",
   s_loc_workspace: "Workspace",
   s_loc_XnewX: "[New]",
   s_loc_XnoneX: "[None]",
   s_loc_Xselect_rangeX: "[select range]",

//
// SocialCalc Spreadsheet Viewer module, socialcalcviewer.js:
//

   //*** SocialCalc.SpreadsheetViewer

   SVStatuslineheight: 20, // in pixels
   SVStatuslineCSS: "font-size:10px;padding:3px 0px;",

//
// SocialCalc Format Number module, formatnumber2.js:
//

   FormatNumber_separatorchar: ",", // the thousands separator character when formatting numbers for display
   FormatNumber_decimalchar: ".", // the decimal separator character when formatting numbers for display
   FormatNumber_defaultCurrency: "$", // the currency string used if none specified

   // The following constants are arrays of strings with the short (3 character) and full names of days and months

   s_FormatNumber_daynames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
   s_FormatNumber_daynames3: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
   s_FormatNumber_monthnames: ["January", "February", "March", "April", "May", "June", "July", "August", "September",
                                      "October", "November", "December"],
   s_FormatNumber_monthnames3: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
   s_FormatNumber_am: "AM",
   s_FormatNumber_am1: "A",
   s_FormatNumber_pm: "PM",
   s_FormatNumber_pm1: "P",

//
// SocialCalc Spreadsheet Formula module, formula1.js:
//

   s_parseerrexponent: "Improperly formed number exponent",
   s_parseerrchar: "Unexpected character in formula",
   s_parseerrstring: "Improperly formed string",
   s_parseerrspecialvalue: "Improperly formed special value",
   s_parseerrtwoops: "Error in formula (two operators inappropriately in a row)",
   s_parseerrmissingopenparen: "Missing open parenthesis in list with comma(s). ",
   s_parseerrcloseparennoopen: "Closing parenthesis without open parenthesis. ",
   s_parseerrmissingcloseparen: "Missing close parenthesis. ",
   s_parseerrmissingoperand: "Missing operand. ",
   s_parseerrerrorinformula: "Error in formula.",
   s_calcerrerrorvalueinformula: "Error value in formula",
   s_parseerrerrorinformulabadval: "Error in formula resulting in bad value",
   s_formularangeresult: "Formula results in range value:",
   s_calcerrnumericnan: "Formula results in an bad numeric value",
   s_calcerrnumericoverflow: "Numeric overflow",
   s_sheetunavailable: "Sheet unavailable:", // when FindSheetInCache returns null
   s_calcerrcellrefmissing: "Cell reference missing when expected.",
   s_calcerrsheetnamemissing: "Sheet name missing when expected.",
   s_circularnameref: "Circular name reference to name",
   s_calcerrunknownname: "Unknown name",
   s_calcerrincorrectargstofunction: "Incorrect arguments to function",
   s_sheetfuncunknownfunction: "Unknown function",
   s_sheetfunclnarg: "LN argument must be greater than 0",
   s_sheetfunclog10arg: "LOG10 argument must be greater than 0",
   s_sheetfunclogsecondarg: "LOG second argument must be numeric greater than 0",
   s_sheetfunclogfirstarg: "LOG first argument must be greater than 0",
   s_sheetfuncroundsecondarg: "ROUND second argument must be numeric",
   s_sheetfuncddblife: "DDB life must be greater than 1",
   s_sheetfuncslnlife: "SLN life must be greater than 1",

   // Function definition text

   s_fdef_ABS: 'Absolute value function. ',
   s_fdef_ACOS: 'Trigonometric arccosine function. ',
   s_fdef_AND: 'True if all arguments are true. ',
   s_fdef_ASIN: 'Trigonometric arcsine function. ',
   s_fdef_ATAN: 'Trigonometric arctan function. ',
   s_fdef_ATAN2: 'Trigonometric arc tangent function (result is in radians). ',
   s_fdef_AVERAGE: 'Averages the values. ',
   s_fdef_CHOOSE: 'Returns the value specified by the index. The values may be ranges of cells. ',
   s_fdef_COLUMNS: 'Returns the number of columns in the range. ',
   s_fdef_COS: 'Trigonometric cosine function (value is in radians). ',
   s_fdef_COUNT: 'Counts the number of numeric values, not blank, text, or error. ',
   s_fdef_COUNTA: 'Counts the number of non-blank values. ',
   s_fdef_COUNTBLANK: 'Counts the number of blank values. (Note: "" is not blank.) ',
   s_fdef_COUNTIF: 'Counts the number of number of cells in the range that meet the criteria. The criteria may be a value ("x", 15, 1+3) or a test (>25). ',
   s_fdef_DATE: 'Returns the appropriate date value given numbers for year, month, and day. For example: DATE(2006,2,1) for February 1, 2006. Note: In this program, day "1" is December 31, 1899 and the year 1900 is not a leap year. Some programs use January 1, 1900, as day "1" and treat 1900 as a leap year. In both cases, though, dates on or after March 1, 1900, are the same. ',
   s_fdef_DAVERAGE: 'Averages the values in the specified field in records that meet the criteria. ',
   s_fdef_DAY: 'Returns the day of month for a date value. ',
   s_fdef_DCOUNT: 'Counts the number of numeric values, not blank, text, or error, in the specified field in records that meet the criteria. ',
   s_fdef_DCOUNTA: 'Counts the number of non-blank values in the specified field in records that meet the criteria. ',
   s_fdef_DDB: 'Returns the amount of depreciation at the given period of time (the default factor is 2 for double-declining balance).   ',
   s_fdef_DEGREES: 'Converts value in radians into degrees. ',
   s_fdef_DGET: 'Returns the value of the specified field in the single record that meets the criteria. ',
   s_fdef_DMAX: 'Returns the maximum of the numeric values in the specified field in records that meet the criteria. ',
   s_fdef_DMIN: 'Returns the maximum of the numeric values in the specified field in records that meet the criteria. ',
   s_fdef_DPRODUCT: 'Returns the result of multiplying the numeric values in the specified field in records that meet the criteria. ',
   s_fdef_DSTDEV: 'Returns the sample standard deviation of the numeric values in the specified field in records that meet the criteria. ',
   s_fdef_DSTDEVP: 'Returns the standard deviation of the numeric values in the specified field in records that meet the criteria. ',
   s_fdef_DSUM: 'Returns the sum of the numeric values in the specified field in records that meet the criteria. ',
   s_fdef_DVAR: 'Returns the sample variance of the numeric values in the specified field in records that meet the criteria. ',
   s_fdef_DVARP: 'Returns the variance of the numeric values in the specified field in records that meet the criteria. ',
   s_fdef_EVEN: 'Rounds the value up in magnitude to the nearest even integer. ',
   s_fdef_EXACT: 'Returns "true" if the values are exactly the same, including case, type, etc. ',
   s_fdef_EXP: 'Returns e raised to the value power. ',
   s_fdef_FACT: 'Returns factorial of the value. ',
   s_fdef_FALSE: 'Returns the logical value "false". ',
   s_fdef_FIND: 'Returns the starting position within string2 of the first occurrence of string1 at or after "start". If start is omitted, 1 is assumed. ',
   s_fdef_FV: 'Returns the future value of repeated payments of money invested at the given rate for the specified number of periods, with optional present value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). ',
   s_fdef_HLOOKUP: 'Look for the matching value for the given value in the range and return the corresponding value in the cell specified by the row offset. If rangelookup is 1 (the default) and not 0, match if within numeric brackets (match<=value) instead of exact match. ',
   s_fdef_HOUR: 'Returns the hour portion of a time or date/time value. ',
   s_fdef_IF: 'Results in true-value if logical-expression is TRUE or non-zero, otherwise results in false-value. ',
   s_fdef_INDEX: 'Returns a cell or range reference for the specified row and column in the range. If range is 1-dimensional, then only one of rownum or colnum are needed. If range is 2-dimensional and rownum or colnum are zero, a reference to the range of just the specified column or row is returned. You can use the returned reference value in a range, e.g., sum(A1:INDEX(A2:A10,4)). ',
   s_fdef_INT: 'Returns the value rounded down to the nearest integer (towards -infinity). ',
   s_fdef_IRR: 'Returns the interest rate at which the cash flows in the range have a net present value of zero. Uses an iterative process that will return #NUM! error if it does not converge. There may be more than one possible solution. Providing the optional guess value may help in certain situations where it does not converge or finds an inappropriate solution (the default guess is 10%). ',
   s_fdef_ISBLANK: 'Returns "true" if the value is a reference to a blank cell. ',
   s_fdef_ISERR: 'Returns "true" if the value is of type "Error" but not "NA". ',
   s_fdef_ISERROR: 'Returns "true" if the value is of type "Error". ',
   s_fdef_ISLOGICAL: 'Returns "true" if the value is of type "Logical" (true/false). ',
   s_fdef_ISNA: 'Returns "true" if the value is the error type "NA". ',
   s_fdef_ISNONTEXT: 'Returns "true" if the value is not of type "Text". ',
   s_fdef_ISNUMBER: 'Returns "true" if the value is of type "Number" (including logical values). ',
   s_fdef_ISTEXT: 'Returns "true" if the value is of type "Text". ',
   s_fdef_LEFT: 'Returns the specified number of characters from the text value. If count is omitted, 1 is assumed. ',
   s_fdef_LEN: 'Returns the number of characters in the text value. ',
   s_fdef_LN: 'Returns the natural logarithm of the value. ',
   s_fdef_LOG: 'Returns the logarithm of the value using the specified base. ',
   s_fdef_LOG10: 'Returns the base 10 logarithm of the value. ',
   s_fdef_LOWER: 'Returns the text value with all uppercase characters converted to lowercase. ',
   s_fdef_MATCH: 'Look for the matching value for the given value in the range and return position (the first is 1) in that range. If rangelookup is 1 (the default) and not 0, match if within numeric brackets (match<=value) instead of exact match. If rangelookup is -1, act like 1 but the bracket is match>=value. ',
   s_fdef_MAX: 'Returns the maximum of the numeric values. ',
   s_fdef_MID: 'Returns the specified number of characters from the text value starting from the specified position. ',
   s_fdef_MIN: 'Returns the minimum of the numeric values. ',
   s_fdef_MINUTE: 'Returns the minute portion of a time or date/time value. ',
   s_fdef_MOD: 'Returns the remainder of the first value divided by the second. ',
   s_fdef_MONTH: 'Returns the month part of a date value. ',
   s_fdef_N: 'Returns the value if it is a numeric value otherwise an error. ',
   s_fdef_NA: 'Returns the #N/A error value which propagates through most operations. ',
   s_fdef_NOT: 'Returns FALSE if value is true, and TRUE if it is false. ',
   s_fdef_NOW: 'Returns the current date/time. ',
   s_fdef_NPER: 'Returns the number of periods at which payments invested each period at the given rate with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period) has the given present value. ',
   s_fdef_NPV: 'Returns the net present value of cash flows (which may be individual values and/or ranges) at the given rate. The flows are positive if income, negative if paid out, and are assumed at the end of each period. ',
   s_fdef_ODD: 'Rounds the value up in magnitude to the nearest odd integer. ',
   s_fdef_OR: 'True if any argument is true ',
   s_fdef_PI: 'The value 3.1415926... ',
   s_fdef_PMT: 'Returns the amount of each payment that must be invested at the given rate for the specified number of periods to have the specified present value, with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). ',
   s_fdef_POWER: 'Returns the first value raised to the second value power. ',
   s_fdef_PRODUCT: 'Returns the result of multiplying the numeric values. ',
   s_fdef_PROPER: 'Returns the text value with the first letter of each word converted to uppercase and the others to lowercase. ',
   s_fdef_PV: 'Returns the present value of the given number of payments each invested at the given rate, with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). ',
   s_fdef_RADIANS: 'Converts value in degrees into radians. ',
   s_fdef_RATE: 'Returns the rate at which the given number of payments each invested at the given rate has the specified present value, with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). Uses an iterative process that will return #NUM! error if it does not converge. There may be more than one possible solution. Providing the optional guess value may help in certain situations where it does not converge or finds an inappropriate solution (the default guess is 10%). ',
   s_fdef_REPLACE: 'Returns text1 with the specified number of characters starting from the specified position replaced by text2. ',
   s_fdef_REPT: 'Returns the text repeated the specified number of times. ',
   s_fdef_RIGHT: 'Returns the specified number of characters from the text value starting from the end. If count is omitted, 1 is assumed. ',
   s_fdef_ROUND: 'Rounds the value to the specified number of decimal places. If precision is negative, then round to powers of 10. The default precision is 0 (round to integer). ',
   s_fdef_ROWS: 'Returns the number of rows in the range. ',
   s_fdef_SECOND: 'Returns the second portion of a time or date/time value (truncated to an integer). ',
   s_fdef_SIN: 'Trigonometric sine function (value is in radians) ',
   s_fdef_SLN: 'Returns the amount of depreciation at each period of time using the straight-line method. ',
   s_fdef_SQRT: 'Square root of the value ',
   s_fdef_STDEV: 'Returns the sample standard deviation of the numeric values. ',
   s_fdef_STDEVP: 'Returns the standard deviation of the numeric values. ',
   s_fdef_SUBSTITUTE: 'Returns text1 with the all occurrences of oldtext replaced by newtext. If "occurrence" is present, then only that occurrence is replaced. ',
   s_fdef_SUM: 'Adds the numeric values. The values to the sum function may be ranges in the form similar to A1:B5. ',
   s_fdef_SUMIF: 'Sums the numeric values of cells in the range that meet the criteria. The criteria may be a value ("x", 15, 1+3) or a test (>25). If range2 is present, then range1 is tested and the corresponding range2 value is summed. ',
   s_fdef_SYD: 'Depreciation by Sum of Year\'s Digits method. ',
   s_fdef_T: 'Returns the text value or else a null string. ',
   s_fdef_TAN: 'Trigonometric tangent function (value is in radians) ',
   s_fdef_TIME: 'Returns the time value given the specified hour, minute, and second. ',
   s_fdef_TODAY: 'Returns the current date (an integer). Note: In this program, day "1" is December 31, 1899 and the year 1900 is not a leap year. Some programs use January 1, 1900, as day "1" and treat 1900 as a leap year. In both cases, though, dates on or after March 1, 1900, are the same. ',
   s_fdef_TRIM: 'Returns the text value with leading, trailing, and repeated spaces removed. ',
   s_fdef_TRUE: 'Returns the logical value "true". ',
   s_fdef_TRUNC: 'Truncates the value to the specified number of decimal places. If precision is negative, truncate to powers of 10. ',
   s_fdef_UPPER: 'Returns the text value with all lowercase characters converted to uppercase. ',
   s_fdef_VALUE: 'Converts the specified text value into a numeric value. Various forms that look like numbers (including digits followed by %, forms that look like dates, etc.) are handled. This may not handle all of the forms accepted by other spreadsheets and may be locale dependent. ',
   s_fdef_VAR: 'Returns the sample variance of the numeric values. ',
   s_fdef_VARP: 'Returns the variance of the numeric values. ',
   s_fdef_VLOOKUP: 'Look for the matching value for the given value in the range and return the corresponding value in the cell specified by the column offset. If rangelookup is 1 (the default) and not 0, match if within numeric brackets (match>=value) instead of exact match. ',
   s_fdef_WEEKDAY: 'Returns the day of week specified by the date value. If type is 1 (the default), Sunday is day and Saturday is day 7. If type is 2, Monday is day 1 and Sunday is day 7. If type is 3, Monday is day 0 and Sunday is day 6. ',
   s_fdef_YEAR: 'Returns the year part of a date value. ',
   s_fdef_SUMPRODUCT: 'Sums the pairwise products of 2 or more ranges. The ranges must be of equal length.',
   s_fdef_CEILING: 'Rounds the given number up to the nearest integer or multiple of significance. Significance is the value to whose multiple of ten the value is to be rounded up (.01, .1, 1, 10, etc.)',
   s_fdef_FLOOR: 'Rounds the given number down to the nearest multiple of significance. Significance is the value to whose multiple of ten the number is to be rounded down (.01, .1, 1, 10, etc.)',

   s_farg_v: "value",
   s_farg_vn: "value1, value2, ...",
   s_farg_xy: "valueX, valueY",
   s_farg_choose: "index, value1, value2, ...",
   s_farg_range: "range",
   s_farg_rangec: "range, criteria",
   s_farg_date: "year, month, day",
   s_farg_dfunc: "databaserange, fieldname, criteriarange",
   s_farg_ddb: "cost, salvage, lifetime, period, [factor]",
   s_farg_find: "string1, string2, [start]",
   s_farg_fv: "rate, n, payment, [pv, [paytype]]",
   s_farg_hlookup: "value, range, row, [rangelookup]",
   s_farg_iffunc: "logical-expression, true-value, [false-value]",
   s_farg_index: "range, rownum, colnum",
   s_farg_irr: "range, [guess]",
   s_farg_tc: "text, count",
   s_farg_log: "value, base",
   s_farg_match: "value, range, [rangelookup]",
   s_farg_mid: "text, start, length",
   s_farg_nper: "rate, payment, pv, [fv, [paytype]]",
   s_farg_npv: "rate, value1, value2, ...",
   s_farg_pmt: "rate, n, pv, [fv, [paytype]]",
   s_farg_pv: "rate, n, payment, [fv, [paytype]]",
   s_farg_rate: "n, payment, pv, [fv, [paytype, [guess]]]",
   s_farg_replace: "text1, start, length, text2",
   s_farg_vp: "value, [precision]",
   s_farg_valpre: "value, precision",
   s_farg_csl: "cost, salvage, lifetime",
   s_farg_cslp: "cost, salvage, lifetime, period",
   s_farg_subs: "text1, oldtext, newtext, [occurrence]",
   s_farg_sumif: "range1, criteria, [range2]",
   s_farg_hms: "hour, minute, second",
   s_farg_txt: "text",
   s_farg_vlookup: "value, range, col, [rangelookup]",
   s_farg_weekday: "date, [type]",
   s_farg_dt: "date",
   s_farg_rangen: "range1, range2, ...",
   s_farg_vsig: 'value, [significance]',

   function_classlist: ["all", "stat", "lookup", "datetime", "financial", "test", "math", "text"], // order of function classes

   s_fclass_all: "All",
   s_fclass_stat: "Statistics",
   s_fclass_lookup: "Lookup",
   s_fclass_datetime: "Date & Time",
   s_fclass_financial: "Financial",
   s_fclass_test: "Test",
   s_fclass_math: "Math",
   s_fclass_text: "Text",

   lastone: null

   };

// Default classnames for use with SocialCalc.ConstantsSetClasses:

SocialCalc.ConstantsDefaultClasses = {
   defaultComment: "",
   defaultCommentNoGrid: "",
   defaultHighlightTypeCursor: "",
   defaultHighlightTypeRange: "",
   defaultColname: "",
   defaultSelectedColname: "",
   defaultRowname: "",
   defaultSelectedRowname: "", 
   defaultUpperLeft: "",
   defaultSkippedCell: "",
   defaultPaneDivider: "",
   cteGriddiv: "", // this one has no Style version with it
   defaultInputEcho: {classname: "", style: "filter:alpha(opacity=90);opacity:.9;"}, // so FireFox won't show warning
   TCmain: "",
   TCendcap: "",
   TCpaneslider: "",
   TClessbutton: "",
   TCmorebutton: "",
   TCscrollarea: "",
   TCthumb: "",
   TCPStrackingline: "",
   TCTDFSthumbstatus: "",
   TDpopupElement: ""
   };

//
// SocialCalc.ConstantsSetClasses(prefix)
//
// This routine goes through all of the xyzClass/xyzStyle pairs and sets the Class to a default and
// turns off the Style, if present. The prefix is put before each default.
// The list of items to set is in SocialCalc.ConstantsDefaultClasses. The names there
// correspond to the "xyz" parts. If there is a value, it is the default to set. If the
// default is a null, no change is made. If the default is the null string (""), the
// name of the item is used (e.g., "defaultComment" would use the classname "defaultComment").
// If the default is an object, then it expects {classname: classname, style: stylestring} - this
// lets you combine both.
//

SocialCalc.ConstantsSetClasses = function(prefix) {

   var defaults = SocialCalc.ConstantsDefaultClasses;
   var scc = SocialCalc.Constants;
   var item;

   prefix = prefix || "";

   for (item in defaults) {
      if (typeof defaults[item] == "string") {
         scc[item+"Class"] = prefix + (defaults[item] || item);
         if (scc[item+"Style"] !== undefined) {
            scc[item+"Style"] = "";
            }
         }
      else if (typeof defaults[item] == "object") {
         scc[item+"Class"] = prefix + (defaults[item].classname || item);
         scc[item+"Style"] = defaults[item].style;
         }
      }
   }

// Set the image prefix on all images.

SocialCalc.ConstantsSetImagePrefix = function(imagePrefix) {

   var scc = SocialCalc.Constants;

   for (var item in scc) {
      if (typeof scc[item] == "string") {
         scc[item] = scc[item].replace(scc.defaultImagePrefix, imagePrefix);
         }
      }
   scc.defaultImagePrefix = imagePrefix;

   }

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
   var args = [];
   for (var i=0; i<arguments.length; i++) {
      if (arguments[i]!=null) args.push(arguments[i]); // ignore null or undefined
      }
   var cmd = args.join(" ");
   this.stack[this.stack.length-1].command.push(cmd);
   }

SocialCalc.UndoStack.prototype.AddUndo = function() {
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
                  cr = SocialCalc.crToCoord(editor.range.left, editor.range.top);
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
      wobj.functionobj.editor.ScrollRelative(true, -1);
      }
   if (delta < 0) {
      wobj.functionobj.editor.ScrollRelative(true, +1);
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
   if (scc.TCPStrackinglineClass) draginfo.trackingline.className = scc.TCPStrackinglineClass;
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

      if (!row || row<=editor.context.rowpanes[0].first) { // set to no panes, leaving first pane settings
         if (editor.context.rowpanes.length>1) editor.context.rowpanes.length = 1;
         }
      else if (editor.context.rowpanes.length-1) { // has 2 already
         if (!editor.timeout) { // not waiting for position calc (so positions could be wrong)
            editor.context.SetRowPaneFirstLast(0, editor.context.rowpanes[0].first, row-1);
            editor.context.SetRowPaneFirstLast(1, row, row);
            }
         }
      else {
         editor.context.SetRowPaneFirstLast(0, editor.context.rowpanes[0].first, row-1);
         editor.context.SetRowPaneFirstLast(1, row, row);
         }
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

      if (!col || col<=editor.context.colpanes[0].first) { // set to no panes, leaving first pane settings
         if (editor.context.colpanes.length>1) editor.context.colpanes.length = 1;
         }
      else if (editor.context.colpanes.length-1) { // has 2 already
         if (!editor.timeout) { // not waiting for position calc (so positions could be wrong)
            editor.context.SetColPaneFirstLast(0, editor.context.colpanes[0].first, col-1);
            editor.context.SetColPaneFirstLast(1, col, col);
            }
         }
      else {
         editor.context.SetColPaneFirstLast(0, editor.context.colpanes[0].first, col-1);
         editor.context.SetColPaneFirstLast(1, col, col);
         }
      }

   editor.FitToEditTable();

   editor.griddiv.removeChild(draginfo.trackingline);

   editor.ScheduleRender();

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


//
/*
// SocialCalc Number Formatting Library
//
// Part of the SocialCalc package.
//
// (c) Copyright 2008 Socialtext, Inc.
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

   var SocialCalc;
   if (!SocialCalc) SocialCalc = {}; // May be used with other SocialCalc libraries or standalone

SocialCalc.FormatNumber = {};

SocialCalc.FormatNumber.format_definitions = {}; // Parsed formats are stored here globally

// Most constants that are often customized for localization are in the SocialCalc.Constants module.
// If you use this module standalone, provide at least the "FormatNumber" values.
//

// The following values may be customized externally for further localization of the format definitions themselves,
// but that would make them incompatible with other uses and is discouraged.
//

SocialCalc.FormatNumber.separatorchar = ",";
SocialCalc.FormatNumber.decimalchar = ".";
SocialCalc.FormatNumber.daynames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
SocialCalc.FormatNumber.daynames3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
SocialCalc.FormatNumber.monthnames3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
SocialCalc.FormatNumber.monthnames = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
                                      "October", "November", "December"];

SocialCalc.FormatNumber.allowedcolors =
   {BLACK: "#000000", BLUE: "#0000FF", CYAN: "#00FFFF", GREEN: "#00FF00", MAGENTA: "#FF00FF",
    RED: "#FF0000", WHITE: "#FFFFFF", YELLOW: "#FFFF00"};

SocialCalc.FormatNumber.alloweddates =
   {H: "h]", M: "m]", MM: "mm]", S: "s]", SS: "ss]"};

// Other constants

SocialCalc.FormatNumber.commands =
   {copy: 1, color: 2, integer_placeholder: 3, fraction_placeholder: 4, decimal: 5,
    currency: 6, general:7, separator: 8, date: 9, comparison: 10, section: 11, style: 12};

SocialCalc.FormatNumber.datevalues = {julian_offset: 2415019, seconds_in_a_day: 24 * 60 * 60, seconds_in_an_hour: 60 * 60};

/* *******************

 result = SocialCalc.FormatNumber.formatNumberWithFormat = function(rawvalue, format_string, currency_char)

************************* */

SocialCalc.FormatNumber.formatNumberWithFormat = function(rawvalue, format_string, currency_char) {

   var scc = SocialCalc.Constants;
   var scfn = SocialCalc.FormatNumber;

   var op, operandstr, fromend, cval, operandstrlc;
   var startval, estartval;
   var hrs, mins, secs, ehrs, emins, esecs, ampmstr, ymd;
   var minOK, mpos;
   var result="";
   var thisformat;
   var section, gotcomparison, compop, compval, cpos, oppos;
   var sectioninfo;
   var i, decimalscale, scaledvalue, strvalue, strparts, integervalue, fractionvalue;
   var integerdigits2, integerpos, fractionpos, textcolor, textstyle, separatorchar, decimalchar;
   var value; // working copy to change sign, etc.

   if (typeof(rawvalue) == "string" && !rawvalue.length) return "";

   value = rawvalue-0; // make sure a number
   if (!isFinite(value)) {
      if (typeof(rawvalue) == "string") { // if original was a string, try to format it
         return scfn.formatTextWithFormat(rawvalue, format_string);
         }
      else {
         return "NaN";
         }
      }
   rawvalue = value;

   var negativevalue = value < 0 ? 1 : 0; // determine sign, etc.
   if (negativevalue) value = -value;
   var zerovalue = value == 0 ? 1 : 0;

   currency_char = currency_char || scc.FormatNumber_DefaultCurrency;

   scfn.parse_format_string(scfn.format_definitions, format_string); // make sure format is parsed
   thisformat = scfn.format_definitions[format_string]; // Get format structure

   if (!thisformat) throw "Format not parsed error!";

   section = thisformat.sectioninfo.length - 1; // get number of sections - 1

   if (thisformat.hascomparison) { // has comparisons - determine which section
      section = 0; // set to which section we will use
      gotcomparison = 0; // this section has no comparison
      for (cpos=0; ;cpos++) { // scan for comparisons
         op = thisformat.operators[cpos];
         operandstr = thisformat.operands[cpos]; // get next operator and operand
         if (!op) { // at end with no match
            if (gotcomparison) { // if comparison but no match
               format_string = "General"; // use default of General
               scfn.parse_format_string(scfn.format_definitions, format_string);
               thisformat = scfn.format_definitions[format_string];
               section = 0;
               }
            break; // if no comparision, matches on this section
            }
         if (op == scfn.commands.section) { // end of section
            if (!gotcomparison) { // no comparison, so it's a match
               break;
               }
            gotcomparison = 0;
            section++; // check out next one
            continue;
            }
         if (op == scfn.commands.comparison) { // found a comparison - do we meet it?
            i=operandstr.indexOf(":");
            compop=operandstr.substring(0,i);
            compval=operandstr.substring(i+1)-0;
            if ((compop == "<" && rawvalue < compval) ||
                (compop == "<=" && rawvalue <= compval) ||
                (compop == "=" && rawvalue == compval) ||
                (compop == "<>" && rawvalue != compval) ||
                (compop == ">=" && rawvalue >= compval) ||
                (compop == ">" && rawvalue > compval)) { // a match
               break;
               }
            gotcomparison = 1;
            }
         }
      }
   else if (section > 0) { // more than one section (separated by ";")
      if (section == 1) { // two sections
         if (negativevalue) {
            negativevalue = 0; // sign will provided by section, not automatically
            section = 1; // use second section for negative values
            }
         else {
            section = 0; // use first for all others
            }
         }
      else if (section == 2 || section == 3) { // three or four sections
         if (negativevalue) {
            negativevalue = 0; // sign will provided by section, not automatically
            section = 1; // use second section for negative values
            }
         else if (zerovalue) {
            section = 2; // use third section for zero values
            }
         else {
            section = 0; // use first for positive
            }
         }
      }

   sectioninfo = thisformat.sectioninfo[section]; // look at values for our section

   if (sectioninfo.commas > 0) { // scale by thousands
      for (i=0; i<sectioninfo.commas; i++) {
         value /= 1000;
         }
      }
   if (sectioninfo.percent > 0) { // do percent scaling
      for (i=0; i<sectioninfo.percent; i++) {
         value *= 100;
         }
      }

   decimalscale = 1; // cut down to required number of decimal digits
   for (i=0; i<sectioninfo.fractiondigits; i++) {
      decimalscale *= 10;
      }
   scaledvalue = Math.floor(value * decimalscale + 0.5);
   scaledvalue = scaledvalue / decimalscale;

   if (typeof scaledvalue != "number") return "NaN";
   if (!isFinite(scaledvalue)) return "NaN";

   strvalue = scaledvalue+""; // convert to string (Number.toFixed doesn't do all we need)

//   strvalue = value.toFixed(sectioninfo.fractiondigits); // cut down to required number of decimal digits
                                                         // and convert to string

   if (scaledvalue == 0 && (sectioninfo.fractiondigits || sectioninfo.integerdigits)) {
      negativevalue = 0; // no "-0" unless using multiple sections or General
      }

   if (strvalue.indexOf("e")>=0) { // converted to scientific notation
      return rawvalue+""; // Just return plain converted raw value
      }

   strparts=strvalue.match(/^\+{0,1}(\d*)(?:\.(\d*)){0,1}$/); // get integer and fraction parts
   if (!strparts) return "NaN"; // if not a number
   integervalue = strparts[1];
   if (!integervalue || integervalue=="0") integervalue="";
   fractionvalue = strparts[2];
   if (!fractionvalue) fractionvalue = "";

   if (sectioninfo.hasdate) { // there are date placeholders
      if (rawvalue < 0) { // bad date
         return "??-???-??&nbsp;??:??:??";
         }
      startval = (rawvalue-Math.floor(rawvalue)) * scfn.datevalues.seconds_in_a_day; // get date/time parts
      estartval = rawvalue * scfn.datevalues.seconds_in_a_day; // do elapsed time version, too
      hrs = Math.floor(startval / scfn.datevalues.seconds_in_an_hour);
      ehrs = Math.floor(estartval / scfn.datevalues.seconds_in_an_hour);
      startval = startval - hrs * scfn.datevalues.seconds_in_an_hour;
      mins = Math.floor(startval / 60);
      emins = Math.floor(estartval / 60);
      secs = startval - mins * 60;
      decimalscale = 1; // round appropriately depending if there is ss.0
      for (i=0; i<sectioninfo.fractiondigits; i++) {
         decimalscale *= 10;
         }
      secs = Math.floor(secs * decimalscale + 0.5);
      secs = secs / decimalscale;
      esecs = Math.floor(estartval * decimalscale + 0.5);
      esecs = esecs / decimalscale;
      if (secs >= 60) { // handle round up into next second, minute, etc.
         secs = 0;
         mins++; emins++;
         if (mins >= 60) {
            mins = 0;
            hrs++; ehrs++;
            if (hrs >= 24) {
               hrs = 0;
               rawvalue++;
               }
            }
         }
      fractionvalue = (secs-Math.floor(secs))+""; // for "hh:mm:ss.000"
      fractionvalue = fractionvalue.substring(2); // skip "0."

      ymd = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(Math.floor(rawvalue+scfn.datevalues.julian_offset));

      minOK = 0; // says "m" can be minutes if true
      mspos = sectioninfo.sectionstart; // m scan position in ops
      for ( ; ; mspos++) { // scan for "m" and "mm" to see if any minutes fields, and am/pm
         op = thisformat.operators[mspos];
         operandstr = thisformat.operands[mspos]; // get next operator and operand
         if (!op) break; // don't go past end
         if (op==scfn.commands.section) break;
         if (op==scfn.commands.date) {
            if ((operandstr.toLowerCase()=="am/pm" || operandstr.toLowerCase()=="a/p") && !ampmstr) {
               if (hrs >= 12) {
                  hrs -= 12;
                  ampmstr = operandstr.toLowerCase()=="a/p" ? scc.s_FormatNumber_pm1 : scc.s_FormatNumber_pm; // "P" : "PM";
                  }
               else {
                  ampmstr = operandstr.toLowerCase()=="a/p" ? scc.s_FormatNumber_am1 : scc.s_FormatNumber_am; // "A" : "AM";
                  }
               if (operandstr.indexOf(ampmstr)<0)
                  ampmstr = ampmstr.toLowerCase(); // have case match case in format
               }
            if (minOK && (operandstr=="m" || operandstr=="mm")) {
               thisformat.operands[mspos] += "in"; // turn into "min" or "mmin"
               }
            if (operandstr.charAt(0)=="h") {
               minOK = 1; // m following h or hh or [h] is minutes not months
               }
            else {
               minOK = 0;
               }
            }
         else if (op!=scfn.commands.copy) { // copying chars can be between h and m
            minOK = 0;
            }
         }
      minOK = 0;
      for (--mspos; ; mspos--) { // scan other way for s after m
         op = thisformat.operators[mspos];
         operandstr = thisformat.operands[mspos]; // get next operator and operand
         if (!op) break; // don't go past end
         if (op==scfn.commands.section) break;
         if (op==scfn.commands.date) {
            if (minOK && (operandstr=="m" || operandstr=="mm")) {
               thisformat.operands[mspos] += "in"; // turn into "min" or "mmin"
               }
            if (operandstr=="ss") {
               minOK = 1; // m before ss is minutes not months
               }
            else {
               minOK = 0;
               }
            }
         else if (op!=scfn.commands.copy) { // copying chars can be between ss and m
            minOK = 0;
            }
         }
      }

   integerdigits2 = 0; // init counters, etc.
   integerpos = 0;
   fractionpos = 0;
   textcolor = "";
   textstyle = "";
   separatorchar = scc.FormatNumber_separatorchar;
   if (separatorchar.indexOf(" ")>=0) separatorchar = separatorchar.replace(/ /g, "&nbsp;");
   decimalchar = scc.FormatNumber_decimalchar;
   if (decimalchar.indexOf(" ")>=0) decimalchar = decimalchar.replace(/ /g, "&nbsp;");

   oppos = sectioninfo.sectionstart;

   while (op = thisformat.operators[oppos]) { // execute format
      operandstr = thisformat.operands[oppos++]; // get next operator and operand

      if (op == scfn.commands.copy) { // put char in result
         result += operandstr;
         }

      else if (op == scfn.commands.color) { // set color
         textcolor = operandstr;
         }

      else if (op == scfn.commands.style) { // set style
         textstyle = operandstr;
         }

      else if (op == scfn.commands.integer_placeholder) { // insert number part
         if (negativevalue) {
            result += "-";
            negativevalue = 0;
            }
         integerdigits2++;
         if (integerdigits2 == 1) { // first one
            if (integervalue.length > sectioninfo.integerdigits) { // see if integer wider than field
               for (;integerpos < (integervalue.length - sectioninfo.integerdigits); integerpos++) {
                  result += integervalue.charAt(integerpos);
                  if (sectioninfo.thousandssep) { // see if this is a separator position
                     fromend = integervalue.length - integerpos - 1;
                     if (fromend > 2 && fromend % 3 == 0) {
                        result += separatorchar;
                        }
                     }
                  }
               }
            }
         if (integervalue.length < sectioninfo.integerdigits
             && integerdigits2 <= sectioninfo.integerdigits - integervalue.length) { // field is wider than value
            if (operandstr == "0" || operandstr == "?") { // fill with appropriate characters
               result += operandstr == "0" ? "0" : "&nbsp;";
               if (sectioninfo.thousandssep) { // see if this is a separator position
                  fromend = sectioninfo.integerdigits - integerdigits2;
                  if (fromend > 2 && fromend % 3 == 0) {
                     result += separatorchar;
                     }
                  }
               }
            }
         else { // normal integer digit - add it
            result += integervalue.charAt(integerpos);
            if (sectioninfo.thousandssep) { // see if this is a separator position
               fromend = integervalue.length - integerpos - 1;
               if (fromend > 2 && fromend % 3 == 0) {
                  result += separatorchar;
                  }
               }
            integerpos++;
            }
         }
      else if (op == scfn.commands.fraction_placeholder) { // add fraction part of number
         if (fractionpos >= fractionvalue.length) {
            if (operandstr == "0" || operandstr == "?") {
               result += operandstr == "0" ? "0" : "&nbsp;";
               }
            }
         else {
            result += fractionvalue.charAt(fractionpos);
            }
         fractionpos++;
         }

      else if (op == scfn.commands.decimal) { // decimal point
         if (negativevalue) {
            result += "-";
            negativevalue = 0;
            }
         result += decimalchar;
         }

      else if (op == scfn.commands.currency) { // currency symbol
         if (negativevalue) {
            result += "-";
            negativevalue = 0;
            }
         result += operandstr;
         }

      else if (op == scfn.commands.general) { // insert "General" conversion

         // *** Cut down number of significant digits to avoid floating point artifacts:

         if (value!=0) { // only if non-zero
            var factor = Math.floor(Math.LOG10E * Math.log(value)); // get integer magnitude as a power of 10
            factor = Math.pow(10, 13-factor); // turn into scaling factor
            value = Math.floor(factor * value + 0.5)/factor; // scale positive value, round, undo scaling
            if (!isFinite(value)) return "NaN";
            }
         if (negativevalue) {
            result += "-";
            }
         strvalue = value+""; // convert original value to string
         if (strvalue.indexOf("e")>=0) { // converted to scientific notation
            result += strvalue;
            continue;
            }
         strparts=strvalue.match(/^\+{0,1}(\d*)(?:\.(\d*)){0,1}$/); // get integer and fraction parts
         integervalue = strparts[1];
         if (!integervalue || integervalue=="0") integervalue="";
         fractionvalue = strparts[2];
         if (!fractionvalue) fractionvalue = "";
         integerpos = 0;
         fractionpos = 0;
         if (integervalue.length) {
            for (;integerpos < integervalue.length; integerpos++) {
               result += integervalue.charAt(integerpos);
               if (sectioninfo.thousandssep) { // see if this is a separator position
                  fromend = integervalue.length - integerpos - 1;
                  if (fromend > 2 && fromend % 3 == 0) {
                     result += separatorchar;
                     }
                  }
               }
             }
         else {
            result += "0";
            }
         if (fractionvalue.length) {
            result += decimalchar;
            for (;fractionpos < fractionvalue.length; fractionpos++) {
               result += fractionvalue.charAt(fractionpos);
               }
            }
         }
      else if (op==scfn.commands.date) { // date placeholder
         operandstrlc = operandstr.toLowerCase();
         if (operandstrlc=="y" || operandstrlc=="yy") {
            result += (ymd.year+"").substring(2);
            }
         else if (operandstrlc=="yyyy") {
            result += ymd.year+"";
            }
         else if (operandstrlc=="d") {
            result += ymd.day+"";
            }
         else if (operandstrlc=="dd") {
            cval = 1000 + ymd.day;
            result += (cval+"").substr(2);
            }
         else if (operandstrlc=="ddd") {
            cval = Math.floor(rawvalue+6) % 7;
            result += scc.s_FormatNumber_daynames3[cval];
            }
         else if (operandstrlc=="dddd") {
            cval = Math.floor(rawvalue+6) % 7;
            result += scc.s_FormatNumber_daynames[cval];
            }
         else if (operandstrlc=="m") {
            result += ymd.month+"";
            }
         else if (operandstrlc=="mm") {
            cval = 1000 + ymd.month;
            result += (cval+"").substr(2);
            }
         else if (operandstrlc=="mmm") {
            result += scc.s_FormatNumber_monthnames3[ymd.month-1];
            }
         else if (operandstrlc=="mmmm") {
            result += scc.s_FormatNumber_monthnames[ymd.month-1];
            }
         else if (operandstrlc=="mmmmm") {
            result += scc.s_FormatNumber_monthnames[ymd.month-1].charAt(0);
            }
         else if (operandstrlc=="h") {
            result += hrs+"";
            }
         else if (operandstrlc=="h]") {
            result += ehrs+"";
            }
         else if (operandstrlc=="mmin") {
            cval = (1000 + mins)+"";
            result += cval.substr(2);
            }
         else if (operandstrlc=="mm]") {
            if (emins < 100) {
               cval = (1000 + emins)+"";
               result += cval.substr(2);
               }
            else {
               result += emins+"";
               }
            }
         else if (operandstrlc=="min") {
            result += mins+"";
            }
         else if (operandstrlc=="m]") {
            result += emins+"";
            }
         else if (operandstrlc=="hh") {
            cval = (1000 + hrs)+"";
            result += cval.substr(2);
            }
         else if (operandstrlc=="s") {
            cval = Math.floor(secs);
            result += cval+"";
            }
         else if (operandstrlc=="ss") {
            cval = (1000 + Math.floor(secs))+"";
            result += cval.substr(2);
            }
         else if (operandstrlc=="am/pm" || operandstrlc=="a/p") {
            result += ampmstr;
            }
         else if (operandstrlc=="ss]") {
            if (esecs < 100) {
               cval = (1000 + Math.floor(esecs))+"";
               result += cval.substr(2);
               }
            else {
               cval = Math.floor(esecs);
               result += cval+"";
               }
            }
         }
      else if (op == scfn.commands.section) { // end of section
         break;
         }

      else if (op == scfn.commands.comparison) { // ignore
         continue;
         }

      else {
         result += "!! Parse error !!";
         }
      }

   if (textcolor) {
      result = '<span style="color:'+textcolor+';">'+result+'</span>';
      }
   if (textstyle) {
      result = '<span style="'+textstyle+';">'+result+'</span>';
      }

   return result;

   };

/* *******************

 result = SocialCalc.FormatNumber.formatTextWithFormat = function(rawvalue, format_string)

************************* */

SocialCalc.FormatNumber.formatTextWithFormat = function(rawvalue, format_string) {

   var scc = SocialCalc.Constants;
   var scfn = SocialCalc.FormatNumber;
   var value = rawvalue+"";
   var result = "";
   var section;
   var sectioninfo;
   var oppos;
   var operandstr;
   var textcolor = "";
   var textstyle = "";

   scfn.parse_format_string(scfn.format_definitions, format_string); // make sure format is parsed
   thisformat = scfn.format_definitions[format_string]; // Get format structure

   if (!thisformat) throw "Format not parsed error!";

   section = thisformat.sectioninfo.length - 1; // get number of sections - 1
   if (section == 0) {
      section = 0;
      }
   else if (section == 3) {
      section = 3;
      }
   else {
      return value;
      }

   sectioninfo = thisformat.sectioninfo[section]; // look at values for our section
   oppos = sectioninfo.sectionstart;

   while (op = thisformat.operators[oppos]) { // execute format
      operandstr = thisformat.operands[oppos++]; // get next operator and operand

      if (op == scfn.commands.copy) { // put char in result
         if (operandstr == "@") {
            result += value;
            }
         else {
            result += operandstr.replace(/ /g, "&nbsp;");
            }
         }

      else if (op == scfn.commands.color) { // set color
         textcolor = operandstr;
         }

      else if (op == scfn.commands.style) { // set style
         textstyle = operandstr;
         }
      }

   if (textcolor) {
      result = '<span style="color:'+textcolor+';">'+result+'</span>';
      }
   if (textstyle) {
      result = '<span style="'+textstyle+';">'+result+'</span>';
      }

   return result;

   };

/* *******************

 SocialCalc.FormatNumber.parse_format_string(format_defs, format_string)

 Takes a format string (e.g., "#,##0.00_);(#,##0.00)") and fills in format_defs with the parsed info

 format_defs
    ["#,##0.0"]->{} - elements in the hash are one hash for each format
       .operators->[] - array of operators from parsing the format string (each a number)
       .operands->[] - array of corresponding operators (each usually a string)
       .sectioninfo->[] - one hash for each section of the format
          .start
          .integerdigits
          .fractiondigits
          .commas
          .percent
          .thousandssep
          .hasdates
       .hascomparison - true if any section has [<100], etc.

************************* */

SocialCalc.FormatNumber.parse_format_string = function(format_defs, format_string) {

   var scfn = SocialCalc.FormatNumber;

   var thisformat, section, sectionfinfo;
   var integerpart = 1; // start out in integer part
   var lastwasinteger; // last char was an integer placeholder
   var lastwasslash; // last char was a backslash - escaping following character
   var lastwasasterisk; // repeat next char
   var lastwasunderscore; // last char was _ which picks up following char for width
   var inquote, quotestr; // processing a quoted string
   var inbracket, bracketstr, bracketdata; // processing a bracketed string
   var ingeneral, gpos; // checks for characters "General"
   var ampmstr, part; // checks for characters "A/P" and "AM/PM"
   var indate; // keeps track of date/time placeholders
   var chpos; // character position being looked at
   var ch; // character being looked at

   if (format_defs[format_string]) return; // already defined - nothing to do

   thisformat = {operators: [], operands: [], sectioninfo: [{}]}; // create info structure for this format
   format_defs[format_string] = thisformat; // add to other format definitions

   section = 0; // start with section 0
   sectioninfo = thisformat.sectioninfo[section]; // get reference to info for current section
   sectioninfo.sectionstart = 0; // position in operands that starts this section
   sectioninfo.integerdigits = 0; // number of integer-part placeholders
   sectioninfo.fractiondigits = 0; // fraction placeholders
   sectioninfo.commas = 0; // commas encountered, to handle scaling
   sectioninfo.percent = 0; // times to scale by 100

   for (chpos=0; chpos<format_string.length; chpos++) { // parse
      ch = format_string.charAt(chpos); // get next char to examine
      if (inquote) {
         if (ch == '"') {
            inquote = 0;
            thisformat.operators.push(scfn.commands.copy);
            thisformat.operands.push(quotestr);
            continue;
            }
         quotestr += ch;
         continue;
         }
      if (inbracket) {
         if (ch==']') {
            inbracket = 0;
            bracketdata=SocialCalc.FormatNumber.parse_format_bracket(bracketstr);
            if (bracketdata.operator==scfn.commands.separator) {
               sectioninfo.thousandssep = 1; // explicit [,]
               continue;
               }
            if (bracketdata.operator==scfn.commands.date) {
               sectioninfo.hasdate = 1;
               }
            if (bracketdata.operator==scfn.commands.comparison) {
               thisformat.hascomparison = 1;
               }
            thisformat.operators.push(bracketdata.operator);
            thisformat.operands.push(bracketdata.operand);
            continue;
            }
         bracketstr += ch;
         continue;
         }
      if (lastwasslash) {
         thisformat.operators.push(scfn.commands.copy);
         thisformat.operands.push(ch);
         lastwasslash=false;
         continue;
         }
      if (lastwasasterisk) {
         thisformat.operators.push(scfn.commands.copy);
         thisformat.operands.push(ch+ch+ch+ch+ch); // do 5 of them since no real tabs
         lastwasasterisk=false;
         continue;
         }
      if (lastwasunderscore) {
         thisformat.operators.push(scfn.commands.copy);
         thisformat.operands.push("&nbsp;");
         lastwasunderscore=false;
         continue;
         }
      if (ingeneral) {
         if ("general".charAt(ingeneral)==ch.toLowerCase()) {
            ingeneral++;
            if (ingeneral == 7) {
               thisformat.operators.push(scfn.commands.general);
               thisformat.operands.push(ch);
               ingeneral=0;
               }
            continue;
            }
         ingeneral = 0;
         }
      if (indate) { // last char was part of a date placeholder
         if (indate.charAt(0)==ch) { // another of the same char
            indate += ch; // accumulate it
            continue;
            }
         thisformat.operators.push(scfn.commands.date); // something else, save date info
         thisformat.operands.push(indate);
         sectioninfo.hasdate=1;
         indate = "";
         }
      if (ampmstr) {
         ampmstr += ch;
         part=ampmstr.toLowerCase();
         if (part!="am/pm".substring(0,part.length) && part!="a/p".substring(0,part.length)) {
            ampstr="";
            }
         else if (part=="am/pm" || part=="a/p") {
            thisformat.operators.push(scfn.commands.date);
            thisformat.operands.push(ampmstr);
            ampmstr = "";
            }
         continue;
         }
      if (ch=="#" || ch=="0" || ch=="?") { // placeholder
         if (integerpart) {
            sectioninfo.integerdigits++;
            if (sectioninfo.commas) { // comma inside of integer placeholders
               sectioninfo.thousandssep = 1; // any number is thousands separator
               sectioninfo.commas = 0; // reset count of "thousand" factors
               }
            lastwasinteger = 1;
            thisformat.operators.push(scfn.commands.integer_placeholder);
            thisformat.operands.push(ch);
            }
         else {
            sectioninfo.fractiondigits++;
            lastwasinteger = 1;
            thisformat.operators.push(scfn.commands.fraction_placeholder);
            thisformat.operands.push(ch);
            }
         }
      else if (ch==".") { // decimal point
         lastwasinteger = 0;
         thisformat.operators.push(scfn.commands.decimal);
         thisformat.operands.push(ch);
         integerpart = 0;
         }
      else if (ch=='$') { // currency char
         lastwasinteger = 0;
         thisformat.operators.push(scfn.commands.currency);
         thisformat.operands.push(ch);
         }
      else if (ch==",") {
         if (lastwasinteger) {
            sectioninfo.commas++;
            }
         else {
            thisformat.operators.push(scfn.commands.copy);
            thisformat.operands.push(ch);
            }
         }
      else if (ch=="%") {
         lastwasinteger = 0;
         sectioninfo.percent++;
         thisformat.operators.push(scfn.commands.copy);
         thisformat.operands.push(ch);
         }
      else if (ch=='"') {
         lastwasinteger = 0;
         inquote = 1;
         quotestr = "";
         }
      else if (ch=='[') {
         lastwasinteger = 0;
         inbracket = 1;
         bracketstr = "";
         }
      else if (ch=='\\') {
         lastwasslash = 1;
         lastwasinteger = 0;
         }
      else if (ch=='*') {
         lastwasasterisk = 1;
         lastwasinteger = 0;
         }
      else if (ch=='_') {
         lastwasunderscore = 1;
         lastwasinteger = 0;
         }
      else if (ch==";") {
         section++; // start next section
         thisformat.sectioninfo[section] = {}; // create a new section
         sectioninfo = thisformat.sectioninfo[section]; // get reference to info for current section
         sectioninfo.sectionstart = 1 + thisformat.operators.length; // remember where it starts
         sectioninfo.integerdigits = 0; // number of integer-part placeholders
         sectioninfo.fractiondigits = 0; // fraction placeholders
         sectioninfo.commas = 0; // commas encountered, to handle scaling
         sectioninfo.percent = 0; // times to scale by 100
         integerpart = 1; // reset for new section
         lastwasinteger = 0;
         thisformat.operators.push(scfn.commands.section);
         thisformat.operands.push(ch);
         }
      else if (ch.toLowerCase()=="g") {
         ingeneral = 1;
         lastwasinteger = 0;
         }
      else if (ch.toLowerCase()=="a") {
         ampmstr = ch;
         lastwasinteger = 0;
         }
      else if ("dmyhHs".indexOf(ch)>=0) {
         indate = ch;
         }
      else {
         lastwasinteger = 0;
         thisformat.operators.push(scfn.commands.copy);
         thisformat.operands.push(ch);
         }
      }

   if (indate) { // last char was part of unsaved date placeholder
      thisformat.operators.push(scfn.commands.date);
      thisformat.operands.push(indate);
      sectioninfo.hasdate = 1;
      }

   return;

   }


/* *******************

 bracketdata = SocialCalc.FormatNumber.parse_format_bracket(bracketstr)

 Takes a bracket contents (e.g., "RED", ">10") and returns an operator and operand

 bracketdata->{}
    .operator
    .operand

************************* */

SocialCalc.FormatNumber.parse_format_bracket = function(bracketstr) {

   var scfn = SocialCalc.FormatNumber;
   var scc = SocialCalc.Constants;

   var bracketdata={};
   var parts;

   if (bracketstr.charAt(0)=='$') { // currency
      bracketdata.operator = scfn.commands.currency;
      parts=bracketstr.match(/^\$(.+?)(\-.+?){0,1}$/);
      if (parts) {
         bracketdata.operand = parts[1] || scc.FormatNumber_defaultCurrency || '$';
         }
      else {
         bracketdata.operand = bracketstr.substring(1) || scc.FormatNumber_defaultCurrency || '$';
         }
      }
   else if (bracketstr=='?$') {
      bracketdata.operator = scfn.commands.currency;
      bracketdata.operand = '[?$]';
      }
   else if (scfn.allowedcolors[bracketstr.toUpperCase()]) {
      bracketdata.operator = scfn.commands.color;
      bracketdata.operand = scfn.allowedcolors[bracketstr.toUpperCase()];
      }
   else if (parts=bracketstr.match(/^style=([^"]*)$/)) { // [style=...]
      bracketdata.operator = scfn.commands.style;
      bracketdata.operand = parts[1];
      }
   else if (bracketstr==",") {
      bracketdata.operator = scfn.commands.separator;
      bracketdata.operand = bracketstr;
      }
   else if (scfn.alloweddates[bracketstr.toUpperCase()]) {
      bracketdata.operator = scfn.commands.date;
      bracketdata.operand = scfn.alloweddates[bracketstr.toUpperCase()];
      }
   else if (parts=bracketstr.match(/^[<>=]/)) { // comparison operator
      parts=bracketstr.match(/^([<>=]+)(.+)$/); // split operator and value
      bracketdata.operator = scfn.commands.comparison;
      bracketdata.operand = parts[1]+":"+parts[2];
      }
   else { // unknown bracket
      bracketdata.operator = scfn.commands.copy;
      bracketdata.operand = "["+bracketstr+"]";
      }

   return bracketdata;

   }

/* *******************

 juliandate = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(year, month, day)

 From: http://aa.usno.navy.mil/faq/docs/JD_Formula.html
 Uses: Fliegel, H. F. and van Flandern, T. C. (1968). Communications of the ACM, Vol. 11, No. 10 (October, 1968).
 Translated from the FORTRAN

      I= YEAR
      J= MONTH
      K= DAY
C
      JD= K-32075+1461*(I+4800+(J-14)/12)/4+367*(J-2-(J-14)/12*12)
     2    /12-3*((I+4900+(J-14)/12)/100)/4

************************* */

SocialCalc.FormatNumber.convert_date_gregorian_to_julian = function(year, month, day) {

   var juliandate;

   juliandate = day-32075+SocialCalc.intFunc(1461*(year+4800+SocialCalc.intFunc((month-14)/12))/4);
   juliandate += SocialCalc.intFunc(367*(month-2-SocialCalc.intFunc((month-14)/12)*12)/12);
   juliandate = juliandate - SocialCalc.intFunc(3*SocialCalc.intFunc((year+4900+SocialCalc.intFunc((month-14)/12))/100)/4);

   return juliandate;

   }


/* *******************

 ymd = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(juliandate)

 ymd->{}
    .year
    .month
    .day

 From: http://aa.usno.navy.mil/faq/docs/JD_Formula.html
 Uses: Fliegel, H. F. and van Flandern, T. C. (1968). Communications of the ACM, Vol. 11, No. 10 (October, 1968).
 Translated from the FORTRAN

************************* */

SocialCalc.FormatNumber.convert_date_julian_to_gregorian = function(juliandate) {

   var L, N, I, J, K;

   L = juliandate+68569;
   N = Math.floor(4*L/146097);
   L = L-Math.floor((146097*N+3)/4);
   I = Math.floor(4000*(L+1)/1461001);
   L = L-Math.floor(1461*I/4)+31;
   J = Math.floor(80*L/2447);
   K = L-Math.floor(2447*J/80);
   L = Math.floor(J/11);
   J = J+2-12*L;
   I = 100*(N-49)+I+L;

   return {year:I, month:J, day:K};

   }

SocialCalc.intFunc = function(n) {
   if (n < 0) {
      return -Math.floor(-n);
      }
   else {
      return Math.floor(n);
      }
   }

//
/*
// SocialCalc Spreadsheet Formula Library
//
// Part of the SocialCalc package
//
// (c) Copyright 2008 Socialtext, Inc.
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

   var SocialCalc;
   if (!SocialCalc) SocialCalc = {}; // May be used with other SocialCalc libraries or standalone
                                     // In any case, requires SocialCalc.Constants.

SocialCalc.Formula = {};

//
// Formula constants for parsing:
//

   SocialCalc.Formula.ParseState = {num: 1, alpha: 2, coord: 3, string: 4, stringquote: 5, numexp1: 6, numexp2: 7, alphanumeric: 8, specialvalue:9};

   SocialCalc.Formula.TokenType = {num: 1, coord: 2, op: 3, name: 4, error: 5, string: 6, space: 7};

   SocialCalc.Formula.CharClass = {num: 1, numstart: 2, op: 3, eof: 4, alpha: 5, incoord: 6, error: 7, quote: 8, space: 9, specialstart: 10};
 
   SocialCalc.Formula.CharClassTable = {
      " ": 9, "!": 3, '"': 8, "'": 8, "#": 10, "$":6, "%":3, "&":3, "(": 3, ")": 3, "*": 3, "+": 3, ",": 3, "-": 3, ".": 2, "/": 3,
       "0": 1, "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 1, "8": 1, "9": 1,
       ":": 3, "<": 3, "=": 3, ">": 3,
       "A": 5, "B": 5, "C": 5, "D": 5, "E": 5, "F": 5, "G": 5, "H": 5, "I": 5, "J": 5, "K": 5, "L": 5, "M": 5, "N": 5,
       "O": 5, "P": 5, "Q": 5, "R": 5, "S": 5, "T": 5, "U": 5, "V": 5, "W": 5, "X": 5, "Y": 5, "Z": 5,
       "^": 3, "_": 5,
       "a": 5, "b": 5, "c": 5, "d": 5, "e": 5, "f": 5, "g": 5, "h": 5, "i": 5, "j": 5, "k": 5, "l": 5, "m": 5, "n": 5,
       "o": 5, "p": 5, "q": 5, "r": 5, "s": 5, "t": 5, "u": 5, "v": 5, "w": 5, "x": 5, "y": 5, "z": 5
       };

   SocialCalc.Formula.UpperCaseTable = {
       "a": "A", "b": "B", "c": "C", "d": "D", "e": "E", "f": "F", "g": "G", "h": "H", "i": "I", "j": "J", "k": "K", "l": "L", "m": "M",
       "n": "N", "o": "O", "p": "P", "q": "Q", "r": "R", "s": "S", "t": "T", "u": "U", "v": "V", "w": "W", "x": "X", "y": "Y", "z": "Z",
       "A": "A", "B": "B", "C": "C", "D": "D", "E": "E", "F": "F", "G": "G", "H": "H", "I": "I", "J": "J", "K": "K", "L": "L", "M": "M",
       "N": "N", "O": "O", "P": "P", "Q": "Q", "R": "R", "S": "S", "T": "T", "U": "U", "V": "V", "W": "W", "X": "X", "Y": "Y", "Z": "Z"
       }

   SocialCalc.Formula.SpecialConstants = { // names that turn into constants for name lookup
      "#NULL!": "0,e#NULL!", "#NUM!": "0,e#NUM!", "#DIV/0!": "0,e#DIV/0!", "#VALUE!": "0,e#VALUE!",
      "#REF!": "0,e#REF!", "#NAME?": "0,e#NAME?"};


   // Operator Precedence table
   //
   // 1- !, 2- : ,, 3- M P, 4- %, 5- ^, 6- * /, 7- + -, 8- &, 9- < > = G(>=) L(<=) N(<>),
   // Negative value means Right Associative

   SocialCalc.Formula.TokenPrecedence = {
      "!": 1,
      ":": 2, ",": 2,
      "M": -3, "P": -3,
      "%": 4,
      "^": 5,
      "*": 6, "/": 6,
      "+": 7, "-": 7,
      "&": 8,
      "<": 9, ">": 9, "G": 9, "L": 9, "N": 9
      };

   // Convert one-char token text to input text:

   SocialCalc.Formula.TokenOpExpansion = {'G': '>=', 'L': '<=', 'M': '-', 'N': '<>', 'P': '+'};

   //
   // Information about the resulting value types when doing operations on values (used by LookupResultType)
   //
   // Each object entry is an object with specific types with result type info as follows:
   //
   //    'type1a': '|type2a:resulta|type2b:resultb|...
   //    Type of t* or n* matches any of those types not listed
   //    Results may be a type or the numbers 1 or 2 specifying to return type1 or type2
   

   SocialCalc.Formula.TypeLookupTable = {
       unaryminus: { 'n*': '|n*:1|', 'e*': '|e*:1|', 't*': '|t*:e#VALUE!|', 'b': '|b:n|'},
       unaryplus: { 'n*': '|n*:1|', 'e*': '|e*:1|', 't*': '|t*:e#VALUE!|', 'b': '|b:n|'},
       unarypercent: { 'n*': '|n:n%|n*:n|', 'e*': '|e*:1|', 't*': '|t*:e#VALUE!|', 'b': '|b:n|'},
       plus: {
                'n%': '|n%:n%|nd:n|nt:n|ndt:n|n$:n|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'nd': '|n%:n|nd:nd|nt:ndt|ndt:ndt|n$:n|n:nd|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'nt': '|n%:n|nd:ndt|nt:nt|ndt:ndt|n$:n|n:nt|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'ndt': '|n%:n|nd:ndt|nt:ndt|ndt:ndt|n$:n|n:ndt|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'n$': '|n%:n|nd:n|nt:n|ndt:n|n$:n$|n:n$|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'nl': '|n%:n|nd:n|nt:n|ndt:n|n$:n|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'n': '|n%:n|nd:nd|nt:nt|ndt:ndt|n$:n$|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|',
                'b': '|n%:n%|nd:nd|nt:nt|ndt:ndt|n$:n$|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|',
                't*': '|n*:e#VALUE!|t*:e#VALUE!|b:e#VALUE!|e*:2|',
                'e*': '|e*:1|n*:1|t*:1|b:1|'
               },
       concat: {
                't': '|t:t|th:th|tw:tw|tl:t|tr:tr|t*:2|e*:2|',
                'th': '|t:th|th:th|tw:t|tl:th|tr:t|t*:t|e*:2|',
                'tw': '|t:tw|th:t|tw:tw|tl:tw|tr:tw|t*:t|e*:2|',
                'tl': '|t:tl|th:th|tw:tw|tl:tl|tr:tr|t*:t|e*:2|',
                't*': '|t*:t|e*:2|',
                'e*': '|e*:1|n*:1|t*:1|'
               },
       oneargnumeric: { 'n*': '|n*:n|', 'e*': '|e*:1|', 't*': '|t*:e#VALUE!|', 'b': '|b:n|'},
       twoargnumeric: { 'n*': '|n*:n|t*:e#VALUE!|e*:2|', 'e*': '|e*:1|n*:1|t*:1|', 't*': '|t*:e#VALUE!|n*:e#VALUE!|e*:2|'},
       propagateerror: { 'n*': '|n*:2|e*:2|', 'e*': '|e*:2|', 't*': '|t*:2|e*:2|', 'b': '|b:2|e*:2|'}
      };

/* *******************

 parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(line)

 Parses a text string as if it was a spreadsheet formula

 This uses a simple state machine run on each character in turn.
 States remember whether a number is being gathered, etc.
 The result is parseinfo which is an array with one entry for each token:
   parseinfo[i] = {
     text: "the characters making up the parsed token",
     type: the type of the token (a number),
     opcode: a single character version of an operator suitable for use in the
                  precedence table and distinguishing between unary and binary + and -.

************************* */

SocialCalc.Formula.ParseFormulaIntoTokens = function(line) {

   var i, ch, cclass, haddecimal, last_token, last_token_type, last_token_text, t;

   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;
   var parsestate = scf.ParseState;
   var tokentype = scf.TokenType;
   var charclass = scf.CharClass;
   var charclasstable = scf.CharClassTable;
   var uppercasetable = scf.UpperCaseTable; // much faster than toUpperCase function
   var pushtoken = scf.ParsePushToken;
   var coordregex = /^\$?[A-Z]{1,2}\$?[1-9]\d*$/i;

   var parseinfo = [];
   var str = "";
   var state = 0;
   var haddecimal = false;

  for (i=0; i<=line.length; i++) {
      if (i<line.length) {
         ch = line.charAt(i);
         cclass = charclasstable[ch];
         }
      else {
         ch = "";
         cclass = charclass.eof;
         }

      if (state == parsestate.num) {
         if (cclass == charclass.num) {
            str += ch;
            }
         else if (cclass == charclass.numstart && !haddecimal) {
            haddecimal = true;
            str += ch;
            }
         else if (ch == "E" || ch == "e") {
            str += ch;
            haddecimal = false;
            state = parsestate.numexp1;
            }
         else { // end of number - save it
            pushtoken(parseinfo, str, tokentype.num, 0);
            haddecimal = false;
            state = 0;
            }
         }

      if (state == parsestate.numexp1) {
         if (cclass == parsestate.num) {
            state = parsestate.numexp2;
            }
         else if ((ch == '+' || ch == '-') && (uppercasetable[str.charAt(str.length-1)] == 'E')) {
            str += ch;
            }
         else if (ch == 'E' || ch == 'e') {
            ;
            }
         else {
            pushtoken(parseinfo, scc.s_parseerrexponent, tokentype.error, 0);
            state = 0;
            }
         }

      if (state == parsestate.numexp2) {
         if (cclass == charclass.num) {
            str += ch;
            }
         else { // end of number - save it
            pushtoken(parseinfo, str, tokentype.num, 0);
            state = 0;
            }
         }

      if (state == parsestate.alpha) {
         if (cclass == charclass.num) {
            state = parsestate.coord;
            }
         else if (cclass == charclass.alpha || ch == ".") { // alpha may be letters, numbers, "_", or "."
            str += ch;
            }
         else if (cclass == charclass.incoord) {
            state = parsestate.coord;
            }
         else if (cclass == charclass.op || cclass == charclass.numstart
                || cclass == charclass.space || cclass == charclass.eof) {
            pushtoken(parseinfo, str.toUpperCase(), tokentype.name, 0);
            state = 0;
            }
         else {
            pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
            state = 0;
            }
         }

      if (state == parsestate.coord) {
         if (cclass == charclass.num) {
            str += ch;
            }
         else if (cclass == charclass.incoord) {
            str += ch;
            }
         else if (cclass == charclass.alpha) {
            state = parsestate.alphanumeric;
            }
         else if (cclass == charclass.op || cclass == charclass.numstart ||
                  cclass == charclass.eof || cclass == charclass.space) {
            if (coordregex.test(str)) {
               t = tokentype.coord;
               }
            else {
               t = tokentype.name;
               }
            pushtoken(parseinfo, str.toUpperCase(), t, 0);
            state = 0;
            }
         else {
            pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
            state = 0;
           }
         }


      if (state == parsestate.alphanumeric) {
         if (cclass == charclass.num || cclass == charclass.alpha) {
            str += ch;
            }
         else if (cclass == charclass.op || cclass == charclass.numstart
                || cclass == charclass.space || cclass == charclass.eof) {
            pushtoken(parseinfo, str.toUpperCase(), tokentype.name, 0);
            state = 0;
            }
         else {
            pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
            state = 0;
            }
         }

      if (state == parsestate.string) {
         if (cclass == charclass.quote) {
            state = parsestate.stringquote; // got quote in string: is it doubled (quote in string) or by itself (end of string)?
            }
         else if (cclass == charclass.eof) {
            pushtoken(parseinfo, scc.s_parseerrstring, tokentype.error, 0);
            state = 0;
            }
         else {
            str += ch;
            }
         }
      else if (state == parsestate.stringquote) { // note else if here
         if (cclass == charclass.quote) {
            str += ch;
            state = parsestate.string; // double quote: add one then continue getting string
            }
         else { // something else -- end of string
            pushtoken(parseinfo, str, tokentype.string, 0);
            state = 0; // drop through to process
            }
         }

      else if (state == parsestate.specialvalue) { // special values like #REF!
         if (str.charAt(str.length-1) == "!") { // done - save value as a name
            pushtoken(parseinfo, str, tokentype.name, 0);
            state = 0; // drop through to process
            }
         else if (cclass == charclass.eof) {
            pushtoken(parseinfo, scc.s_parseerrspecialvalue, tokentype.error, 0);
            state = 0;
            }
         else {
            str += ch;
            }
         }

      if (state == 0) {
         if (cclass == charclass.num) {
            str = ch;
            state = parsestate.num;
            }
         else if (cclass == charclass.numstart) {
            str = ch;
            haddecimal = true;
            state = parsestate.num;
            }
         else if (cclass == charclass.alpha || cclass == charclass.incoord) {
            str = ch;
            state = parsestate.alpha;
            }
         else if (cclass == charclass.specialstart) {
            str = ch;
            state = parsestate.specialvalue;
            }
         else if (cclass == charclass.op) {
            str = ch;
            if (parseinfo.length>0) {
               last_token = parseinfo[parseinfo.length-1];
               last_token_type = last_token.type;
               last_token_text = last_token.text;
               if (last_token_type == charclass.op) {
                  if (last_token_text == '<' || last_token_text == ">") {
                     str = last_token_text + str;
                     parseinfo.pop();
                     if (parseinfo.length>0) {
                        last_token = parseinfo[parseinfo.length-1];
                        last_token_type = last_token.type;
                        last_token_text = last_token.text;
                        }
                     else {
                        last_token_type = charclass.eof;
                        last_token_text = "EOF";
                        }
                     }
                  }
               }
            else {
               last_token_type = charclass.eof;
               last_token_text = "EOF";
               }
            t = tokentype.op;
            if ((parseinfo.length == 0)
                || (last_token_type == charclass.op && last_token_text != ')' && last_token_text != '%')) { // Unary operator
               if (str == '-') { // M is unary minus
                  str = "M";
                  ch = "M";
                  }
               else if (str == '+') { // P is unary plus
                  str = "P";
                  ch = "P";
                  }
               else if (str == ')' && last_token_text == '(') { // null arg list OK
                  ;
                  }
               else if (str != '(') { // binary-op open-paren OK, others no
                  t = tokentype.error;
                  str = scc.s_parseerrtwoops;
                  }
               }
            else if (str.length > 1) {
               if (str == '>=') { // G is >=
                  str = "G";
                  ch = "G";
                  }
               else if (str == '<=') { // L is <=
                  str = "L";
                  ch = "L";
                  }
               else if (str == '<>') { // N is <>
                  str = "N";
                  ch = "N";
                  }
               else {
                  t = tokentype.error;
                  str = scc.s_parseerrtwoops;
                  }
               }
            pushtoken(parseinfo, str, t, ch);
            state = 0;
            }
         else if (cclass == charclass.quote) { // starting a string
            str = "";
            state = parsestate.string;
            }
         else if (cclass == charclass.space) { // store so can reconstruct spacing
            //pushtoken(parseinfo, " ", tokentype.space, 0);
            }
         else if (cclass == charclass.eof) { // ignore -- needed to have extra loop to close out other things
            }
         else { // unknown class - such as unknown char
            pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
            }
         }
      }

   return parseinfo;

   }

SocialCalc.Formula.ParsePushToken = function(parseinfo, ttext, ttype, topcode) {

   parseinfo.push({text: ttext, type: ttype, opcode: topcode});

   }

/* *******************

 result = SocialCalc.Formula.evaluate_parsed_formula(parseinfo, sheet, allowrangereturn)

 Does the calculation expressed in a parsed formula, returning a value, its type, and error info
 returns: {value: value, type: valuetype, error: errortext}.

 If allowrangereturn is present and true, can return a range (e.g., "A1:A10" - translated from "A1|A10|")

************************* */

SocialCalc.Formula.evaluate_parsed_formula = function(parseinfo, sheet, allowrangereturn) {

   var result;

   var scf = SocialCalc.Formula;
   var tokentype = scf.TokenType;

   var revpolish;
   var parsestack = [];

   var errortext = "";

   revpolish = scf.ConvertInfixToPolish(parseinfo); // result is either an array or a string with error text

   result = scf.EvaluatePolish(parseinfo, revpolish, sheet, allowrangereturn);

   return result;

}

//
// revpolish = SocialCalc.Formula.ConvertInfixToPolish(parseinfo)
//
// Convert infix to reverse polish notation
//
// Returns revpolish array with a sequence of references to tokens by number if successful.
// Errors return a string with the error.
//
// Based upon the algorithm shown in Wikipedia "Reverse Polish notation" article
// and then enhanced for additional spreadsheet things
//

SocialCalc.Formula.ConvertInfixToPolish = function(parseinfo) {

   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;
   var tokentype = scf.TokenType;
   var token_precedence = scf.TokenPrecedence;

   var revpolish = [];
   var parsestack = [];

   var errortext = "";

   var function_start = -1;

   var i, pii, ttype, ttext, tprecedence, tstackprecedence;

   for (i=0; i<parseinfo.length; i++) {
      pii = parseinfo[i];
      ttype = pii.type;
      ttext = pii.text;
      if (ttype == tokentype.num || ttype == tokentype.coord || ttype == tokentype.string) {
         revpolish.push(i);
         }
      else if (ttype == tokentype.name) {
         parsestack.push(i);
         revpolish.push(function_start);
         }
      else if (ttype == tokentype.space) { // ignore
         continue;
         }
      else if (ttext == ',') {
         while (parsestack.length && parseinfo[parsestack[parsestack.length-1]].text != "(") {
            revpolish.push(parsestack.pop());
            }
         if (parsestack.length == 0) { // no ( -- error
            errortext = scc.s_parseerrmissingopenparen;
            break;
            }
         }
      else if (ttext == '(') {
         parsestack.push(i);
         }
      else if (ttext == ')') {
         while (parsestack.length && parseinfo[parsestack[parsestack.length-1]].text != "(") {
            revpolish.push(parsestack.pop());
            }
         if (parsestack.length == 0) { // no ( -- error
            errortext = scc.s_parseerrcloseparennoopen;
            break;
            }
         parsestack.pop();
         if (parsestack.length && parseinfo[parsestack[parsestack.length-1]].type == tokentype.name) {
            revpolish.push(parsestack.pop());
            }
         }
      else if (ttype == tokentype.op) {
         if (parsestack.length && parseinfo[parsestack[parsestack.length-1]].type == tokentype.name) {
            revpolish.push(parsestack.pop());
            }
         while (parsestack.length && parseinfo[parsestack[parsestack.length-1]].type == tokentype.op
                && parseinfo[parsestack[parsestack.length-1]].text != '(') {
            tprecedence = token_precedence[pii.opcode];
            tstackprecedence = token_precedence[parseinfo[parsestack[parsestack.length-1]].opcode];
            if (tprecedence >= 0 && tprecedence < tstackprecedence) {
               break;
               }
            else if (tprecedence < 0) {
               tprecedence = -tprecedence;
               if (tstackprecedence < 0) tstackprecedence = -tstackprecedence;
               if (tprecedence <= tstackprecedence) {
                  break;
                  }
               }
            revpolish.push(parsestack.pop());
            }
         parsestack.push(i);
         }
      else if (ttype == tokentype.error) {
         errortext = ttext;
         break;
         }
      else {
         errortext = "Internal error while processing parsed formula. ";
         break;
         }
      }
   while (parsestack.length>0) {
      if (parseinfo[parsestack[parsestack.length-1]].text == '(') {
         errortext = scc.s_parseerrmissingcloseparen;
         break;
         }
      revpolish.push(parsestack.pop());
      }

   if (errortext) {
      return errortext;
      }

   return revpolish;

   }


//
// result = SocialCalc.Formula.EvaluatePolish(parseinfo, revpolish, sheet, allowrangereturn)
//
// Execute reverse polish representation of formula
//
// Operand values are objects in the operand array with a "type" and an optional "value".
// Type can have these values (many are type and sub-type as two or more letters):
//    "tw", "th", "t", "n", "nt", "coord", "range", "start", "eErrorType", "b" (blank)
// The value of a coord is in the form A57 or A57!sheetname
// The value of a range is coord|coord|number where number starts at 0 and is
// the offset of the next item to fetch if you are going through the range one by one
// The number starts as a null string ("A1|B3|")
//

SocialCalc.Formula.EvaluatePolish = function(parseinfo, revpolish, sheet, allowrangereturn) {

   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;
   var tokentype = scf.TokenType;
   var lookup_result_type = scf.LookupResultType;
   var typelookup = scf.TypeLookupTable;
   var operand_as_number = scf.OperandAsNumber;
   var operand_as_text = scf.OperandAsText;
   var operand_value_and_type = scf.OperandValueAndType;
   var operands_as_coord_on_sheet = scf.OperandsAsCoordOnSheet;
   var format_number_for_display = SocialCalc.format_number_for_display || function(v, t, f) {return v+"";};

   var errortext = "";
   var function_start = -1;
   var missingOperandError = {value: "", type: "e#VALUE!", error: scc.s_parseerrmissingoperand};

   var operand = [];
   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   var i, rii, prii, ttype, ttext, value1, value2, tostype, tostype2, resulttype, valuetype, cond, vmatch, smatch;

   if (!parseinfo.length || (! (revpolish instanceof Array))) {
      return ({value: "", type: "e#VALUE!", error: (typeof revpolish == "string" ? revpolish : "")});
      }

   for (i=0; i<revpolish.length; i++) {
      rii = revpolish[i];
      if (rii == function_start) { // Remember the start of a function argument list
         PushOperand("start", 0);
         continue;
         }

      prii = parseinfo[rii];
      ttype = prii.type;
      ttext = prii.text;

      if (ttype == tokentype.num) {
         PushOperand("n", ttext-0);
         }

      else if (ttype == tokentype.coord) {
         PushOperand("coord", ttext);
         }

      else if (ttype == tokentype.string) {
         PushOperand("t", ttext);
         }

      else if (ttype == tokentype.op) {
         if (operand.length <= 0) { // Nothing on the stack...
            return missingOperandError;
            break; // done
            }

         // Unary minus

         if (ttext == 'M') {
            value1 = operand_as_number(sheet, operand);
            resulttype = lookup_result_type(value1.type, value1.type, typelookup.unaryminus);
            PushOperand(resulttype, -value1.value);
            }

         // Unary plus

         else if (ttext == 'P') {
            value1 = operand_as_number(sheet, operand);
            resulttype = lookup_result_type(value1.type, value1.type, typelookup.unaryplus);
            PushOperand(resulttype, value1.value);
            }

         // Unary % - percent, left associative

         else if (ttext == '%') {
            value1 = operand_as_number(sheet, operand);
            resulttype = lookup_result_type(value1.type, value1.type, typelookup.unarypercent);
            PushOperand(resulttype, 0.01*value1.value);
            }

         // & - string concatenate

         else if (ttext == '&') {
            if (operand.length <= 1) { // Need at least two things on the stack...
               return missingOperandError;
               }
            value2 = operand_as_text(sheet, operand);
            value1 = operand_as_text(sheet, operand);
            resulttype = lookup_result_type(value1.type, value1.type, typelookup.concat);
            PushOperand(resulttype, value1.value + value2.value);
            }

         // : - Range constructor

         else if (ttext == ':') {
            if (operand.length <= 1) { // Need at least two things on the stack...
               return missingOperandError;
               }
            value1 = scf.OperandsAsRangeOnSheet(sheet, operand); // get coords even if use name on other sheet
            if (value1.error) { // not available
               errortext = errortext || value1.error;
               }
            PushOperand(value1.type, value1.value); // push sheetname with range on that sheet
            }

         // ! - sheetname!coord

         else if (ttext == '!') {
            if (operand.length <= 1) { // Need at least two things on the stack...
               return missingOperandError;
               }
            value1 = operands_as_coord_on_sheet(sheet, operand); // get coord even if name on other sheet
            if (value1.error) { // not available
               errortext = errortext || value1.error;
               }
            PushOperand(value1.type, value1.value); // push sheetname with coord or range on that sheet
            }

         // Comparison operators: < L = G > N (< <= = >= > <>)

         else if (ttext == "<" || ttext == "L" || ttext == "=" || ttext == "G" || ttext == ">" || ttext == "N") {
            if (operand.length <= 1) { // Need at least two things on the stack...
               errortext = scc.s_parseerrmissingoperand; // remember error
               break;
               }
            value2 = operand_value_and_type(sheet, operand);
            value1 = operand_value_and_type(sheet, operand);
            if (value1.type.charAt(0) == "n" && value2.type.charAt(0) == "n") { // compare two numbers
               cond = 0;
               if (ttext == "<") { cond = value1.value < value2.value ? 1 : 0; }
               else if (ttext == "L") { cond = value1.value <= value2.value ? 1 : 0; }
               else if (ttext == "=") { cond = value1.value == value2.value ? 1 : 0; }
               else if (ttext == "G") { cond = value1.value >= value2.value ? 1 : 0; }
               else if (ttext == ">") { cond = value1.value > value2.value ? 1 : 0; }
               else if (ttext == "N") { cond = value1.value != value2.value ? 1 : 0; }
               PushOperand("nl", cond);
               }
            else if (value1.type.charAt(0) == "e") { // error on left
               PushOperand(value1.type, 0);
               }               
            else if (value2.type.charAt(0) == "e") { // error on right
               PushOperand(value2.type, 0);
               }               
            else { // text maybe mixed with numbers or blank
               tostype = value1.type.charAt(0);
               tostype2 = value2.type.charAt(0);
               if (tostype == "n") {
                  value1.value = format_number_for_display(value1.value, "n", "");
                  }
               else if (tostype == "b") {
                  value1.value = "";
                  }
               if (tostype2 == "n") {
                  value2.value = format_number_for_display(value2.value, "n", "");
                  }
               else if (tostype2 == "b") {
                  value2.value = "";
                  }
               cond = 0;
               value1.value = value1.value.toLowerCase(); // ignore case
               value2.value = value2.value.toLowerCase();
               if (ttext == "<") { cond = value1.value < value2.value ? 1 : 0; }
               else if (ttext == "L") { cond = value1.value <= value2.value ? 1 : 0; }
               else if (ttext == "=") { cond = value1.value == value2.value ? 1 : 0; }
               else if (ttext == "G") { cond = value1.value >= value2.value ? 1 : 0; }
               else if (ttext == ">") { cond = value1.value > value2.value ? 1 : 0; }
               else if (ttext == "N") { cond = value1.value != value2.value ? 1 : 0; }
               PushOperand("nl", cond);
               }
            }

         // Normal infix arithmethic operators: +, -. *, /, ^

         else { // what's left are the normal infix arithmetic operators
            if (operand.length <= 1) { // Need at least two things on the stack...
               errortext = scc.s_parseerrmissingoperand; // remember error
               break;
               }
            value2 = operand_as_number(sheet, operand);
            value1 = operand_as_number(sheet, operand);
            if (ttext == '+') {
               resulttype = lookup_result_type(value1.type, value2.type, typelookup.plus);
               PushOperand(resulttype, value1.value + value2.value);
               }
            else if (ttext == '-') {
               resulttype = lookup_result_type(value1.type, value2.type, typelookup.plus);
               PushOperand(resulttype, value1.value - value2.value);
               }
            else if (ttext == '*') {
               resulttype = lookup_result_type(value1.type, value2.type, typelookup.plus);
               PushOperand(resulttype, value1.value * value2.value);
               }
            else if (ttext == '/') {
               if (value2.value != 0) {
                  PushOperand("n", value1.value / value2.value); // gives plain numeric result type
                  }
               else {
                  PushOperand("e#DIV/0!", 0);
                  }
               }
            else if (ttext == '^') {
               value1.value = Math.pow(value1.value, value2.value);
               value1.type = "n"; // gives plain numeric result type
               if (isNaN(value1.value)) {
                  value1.value = 0;
                  value1.type = "e#NUM!";
                  }
               PushOperand(value1.type, value1.value);
               }
            }
         }

      // function or name

      else if (ttype == tokentype.name) {
         errortext = scf.CalculateFunction(ttext, operand, sheet);
         if (errortext) break;
         }

      else {
         errortext = scc.s_InternalError+"Unknown token "+ttype+" ("+ttext+"). ";
         break;
         }
      }

   // look at final value and handle special cases

   value = operand[0] ? operand[0].value : "";
   tostype = operand[0] ? operand[0].type : "";

   if (tostype == "name") { // name - expand it
      value1 = SocialCalc.Formula.LookupName(sheet, value);
      value = value1.value;
      tostype = value1.type;
      errortext = errortext || value1.error;
      }

   if (tostype == "coord") { // the value is a coord reference, get its value and type
      value1 = operand_value_and_type(sheet, operand);
      value = value1.value;
      tostype = value1.type;
      if (tostype == "b") {
         tostype = "n";
         value = 0;
         }
      }

   if (operand.length > 1 && !errortext) { // something left - error
      errortext += scc.s_parseerrerrorinformula;
      }

   // set return type

   valuetype = tostype;

   if (tostype.charAt(0) == "e") { // error value
      errortext = errortext || tostype.substring(1) || scc.s_calcerrerrorvalueinformula;
      }
   else if (tostype == "range") {
      vmatch = value.match(/^(.*)\|(.*)\|/);
      smatch = vmatch[1].indexOf("!");
      if (smatch>=0) { // swap sheetname
         vmatch[1] = vmatch[1].substring(smatch+1) + "!" + vmatch[1].substring(0, smatch).toUpperCase();
         }
      else {
         vmatch[1] = vmatch[1].toUpperCase();
         }
      value = vmatch[1] + ":" + vmatch[2].toUpperCase();
      if (!allowrangereturn) {
         errortext = scc.s_formularangeresult+" "+value;
         }
      }

   if (errortext && valuetype.charAt(0) != "e") {
      value = errortext;
      valuetype = "e";
     }

   // look for overflow

   if (valuetype.charAt(0) == "n" && (isNaN(value) || !isFinite(value))) {
      value = 0;
      valuetype = "e#NUM!";
      errortext = isNaN(value) ? scc.s_calcerrnumericnan: scc.s_calcerrnumericoverflow;
      }

   return ({value: value, type: valuetype, error: errortext});

   }


/*
#
# resulttype = SocialCalc.Formula.LookupResultType(type1, type2, typelookup);
#
# typelookup has values of the following form:
#
#    typelookup{"typespec1"} = "|typespec2A:resultA|typespec2B:resultB|..."
#
# First type1 is looked up. If no match, then the first letter (major type) of type1 plus "*" is looked up
# resulttype is type1 if result is "1", type2 if result is "2", otherwise the value of result.
#
*/

SocialCalc.Formula.LookupResultType = function(type1, type2, typelookup) {

   var pos1, pos2, result;

   var table1 = typelookup[type1];

   if (!table1) {
      table1 = typelookup[type1.charAt(0)+'*'];
      if (!table1) {
         return "e#VALUE! (internal error, missing LookupResultType "+type1.charAt(0)+"*)"; // missing from table -- please add it
         }
      }
   pos1 = table1.indexOf("|"+type2+":");
   if (pos1 >= 0) {
      pos2 = table1.indexOf("|", pos1+1);
      if (pos2<0) return "e#VALUE! (internal error, incorrect LookupResultType "+table1+")";
      result = table1.substring(pos1+type2.length+2, pos2);
      if (result == "1") return type1;
      if (result == "2") return type2;
      return result;
      }
   pos1 = table1.indexOf("|"+type2.charAt(0)+"*:");
   if (pos1 >= 0) {
      pos2 = table1.indexOf("|", pos1+1);
      if (pos2<0) return "e#VALUE! (internal error, incorrect LookupResultType "+table1+")";
      result = table1.substring(pos1+4, pos2);
      if (result == "1") return type1;
      if (result == "2") return type2;
      return result;
      }
   return "e#VALUE!";

   }

/*
#
# operandinfo = SocialCalc.Formula.TopOfStackValueAndType(sheet, operand)
#
# Returns top of stack value and type and then pops the stack.
# The result is {value: value, type: type, error: "only if bad error"}
#
*/

SocialCalc.Formula.TopOfStackValueAndType = function(sheet, operand) {

   var cellvtype, cell, pos, coordsheet;
   var scf = SocialCalc.Formula;

   var result = {type: "", value: ""};

   var stacklen = operand.length;

   if (!stacklen) { // make sure something is there
      result.error = SocialCalc.Constants.s_InternalError+"no operand on stack";
      return result;
      }

   result.value = operand[stacklen-1].value; // get top of stack
   result.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack

   if (result.type == "name") {
      result = scf.LookupName(sheet, result.value);
      }

   return result;

   }


/*
#
# operandinfo = OperandAsNumber(sheet, operand)
#
# Uses operand_value_and_type to get top of stack and pops it.
# Returns numeric value and type.
# Text values are treated as 0 if they can't be converted somehow.
#
*/

SocialCalc.Formula.OperandAsNumber = function(sheet, operand) {

   var t, valueinfo;
   var operandinfo = SocialCalc.Formula.OperandValueAndType(sheet, operand);

   t = operandinfo.type.charAt(0);

   if (t == "n") {
      operandinfo.value = operandinfo.value-0;
      }
   else if (t == "b") { // blank cell
      operandinfo.type = "n";
      operandinfo.value = 0;
      }
   else if (t == "e") { // error
      operandinfo.value = 0;
      }
   else {
      valueinfo = SocialCalc.DetermineValueType ? SocialCalc.DetermineValueType(operandinfo.value) :
                                                    {value: operandinfo.value-0, type: "n"}; // if without rest of SocialCalc
      if (valueinfo.type.charAt(0) == "n") {
         operandinfo.value = valueinfo.value-0;
         operandinfo.type = valueinfo.type;
         }
      else {
         operandinfo.value = 0;
         operandinfo.type = valueinfo.type;
         }
      }

   return operandinfo;

   }

/*
#
# operandinfo = OperandAsText(sheet, operand)
#
# Uses operand_value_and_type to get top of stack and pops it.
# Returns text value, preserving sub-type.
#
*/

SocialCalc.Formula.OperandAsText = function(sheet, operand) {

   var t, valueinfo;
   var operandinfo = SocialCalc.Formula.OperandValueAndType(sheet, operand);

   t = operandinfo.type.charAt(0);

   if (t ==  "t") { // any flavor of text returns as is
      ;
      }
   else if (t == "n") {
      operandinfo.value = SocialCalc.format_number_for_display ?
                             SocialCalc.format_number_for_display(operandinfo.value, operandinfo.type, "") :
                             operandinfo.value = operandinfo.value+"";
      operandinfo.type = "t";
      }
   else if (t == "b") { // blank
      operandinfo.value = "";
      operandinfo.type = "t";
      }
   else if (t == "e") { // error
      operandinfo.value = "";
      }
   else {
      operand.value = operandinfo.value + "";
      operand.type = "t";
      }

   return operandinfo;

   }

/*
#
# result = SocialCalc.Formula.OperandValueAndType(sheet, operand)
#
# Pops the top of stack and returns it, following a coord reference if necessary.
# The result is {value: value, type: type, error: "only if bad error"}
# Ranges are returned as if they were pushed onto the stack first coord first
# Also sets type with "t", "n", "th", etc., as appropriate
#
*/

SocialCalc.Formula.OperandValueAndType = function(sheet, operand) {

   var cellvtype, cell, pos, coordsheet;
   var scf = SocialCalc.Formula;

   var result = {type: "", value: ""};

   var stacklen = operand.length;

   if (!stacklen) { // make sure something is there
      result.error = SocialCalc.Constants.s_InternalError+"no operand on stack";
      return result;
      }

   result.value = operand[stacklen-1].value; // get top of stack
   result.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack

   if (result.type == "name") {
      result = scf.LookupName(sheet, result.value);
      }

   if (result.type == "range") {
      result = scf.StepThroughRangeDown(operand, result.value);
      }

   if (result.type == "coord") { // value is a coord reference
      coordsheet = sheet;
      pos = result.value.indexOf("!");
      if (pos != -1) { // sheet reference
         coordsheet = scf.FindInSheetCache(result.value.substring(pos+1)); // get other sheet
         if (coordsheet == null) { // unavailable
            result.type = "e#REF!";
            result.error = SocialCalc.Constants.s_sheetunavailable+" "+result.value.substring(pos+1);
            result.value = 0;
            return result;
            }
         result.value = result.value.substring(0, pos); // get coord part
         }

      if (coordsheet) {
         cell = coordsheet.cells[SocialCalc.Formula.PlainCoord(result.value)];
         if (cell) {
            cellvtype = cell.valuetype; // get type of value in the cell it points to
            result.value = cell.datavalue;
            }
         else {
            cellvtype = "b";
            }
         }
      else {
         cellvtype = "e#N/A";
         result.value = 0;
         }
      result.type = cellvtype || "b";
      if (result.type == "b") { // blank
         result.value = 0;
         }
      }

   return result;

   }

/*
#
# operandinfo = SocialCalc.Formula.OperandAsCoord(sheet, operand)
#
# Gets top of stack and pops it.
# Returns coord value. All others are treated as an error.
#
*/


SocialCalc.Formula.OperandAsCoord = function(sheet, operand) {

   var scf = SocialCalc.Formula;

   var result = {type: "", value: ""};

   var stacklen = operand.length;

   result.value = operand[stacklen-1].value; // get top of stack
   result.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack
   if (result.type == "name") {
      result = SocialCalc.Formula.LookupName(sheet, result.value);
      }
   if (result.type == "coord") { // value is a coord reference
      return result;
      }
   else {
      result.value = SocialCalc.Constants.s_calcerrcellrefmissing;
      result.type = "e#REF!";
      return result;
      }
}


/*
#
# result = SocialCalc.Formula.OperandsAsCoordOnSheet(sheet, operand)
#
# Gets 2 at top of stack and pops them, treating them as sheetname!coord-or-name.
# Returns stack-style coord value (coord!sheetname, or coord!sheetname|coord|) with
# a type of coord or range. All others are treated as an error.
# If sheetname not available, sets result.error.
#
*/

SocialCalc.Formula.OperandsAsCoordOnSheet = function(sheet, operand) {

   var sheetname, othersheet, pos1, pos2;
   var value1 = {};
   var result = {};
   var scf = SocialCalc.Formula;

   var stacklen = operand.length;
   value1.value = operand[stacklen-1].value; // get top of stack - coord or name
   value1.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack

   sheetname = scf.OperandAsSheetName(sheet, operand); // get sheetname as text
   othersheet = scf.FindInSheetCache(sheetname.value);
   if (othersheet == null) { // unavailable
      result.type = "e#REF!";
      result.value = 0;
      result.error = SocialCalc.Constants.s_sheetunavailable+" "+sheetname.value;
      return result;
      }

   if (value1.type == "name") {
      value1 = scf.LookupName(othersheet, value1.value);
      }
   result.type = value1.type;
   if (value1.type == "coord") { // value is a coord reference
      result.value = value1.value + "!" + sheetname.value; // return in the format as used on stack
      }
   else if (value1.type == "range") { // value is a range reference
      pos1 = value1.value.indexOf("|");
      pos2 = value1.value.indexOf("|", pos1+1);
      result.value = value1.value.substring(0, pos1) + "!" + sheetname.value +
                    "|" + value1.value.substring(pos1+1, pos2) + "|";
      }
   else if (value1.type.charAt(0)=="e") {
      result.value = value1.value;
      }
   else {
      result.error = SocialCalc.Constants.s_calcerrcellrefmissing;
      result.type = "e#REF!";
      result.value = 0;
      }
   return result;
   
   }

/*
#
# result = SocialCalc.Formula.OperandsAsRangeOnSheet(sheet, operand)
#
# Gets 2 at top of stack and pops them, treating them as coord2-or-name:coord1.
# Name is evaluated on sheet of coord1.
# Returns result with "value" of stack-style range value (coord!sheetname|coord|) and
# "type" of "range". All others are treated as an error.
#
*/

SocialCalc.Formula.OperandsAsRangeOnSheet = function(sheet, operand) {

   var value1, othersheet, pos1, pos2;
   var value2 = {};
   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;

   var stacklen = operand.length;
   value2.value = operand[stacklen-1].value; // get top of stack - coord or name for "right" side
   value2.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack

   value1 = scf.OperandAsCoord(sheet, operand); // get "left" coord
   if (value1.type != "coord") { // not a coord, which it must be
      return {value: 0, type: "e#REF!"};
      }

   othersheet = sheet;
   pos1 = value1.value.indexOf("!");
   if (pos1 != -1) { // sheet reference
      pos2 = value1.value.indexOf("|", pos1+1);
      if (pos2 < 0) pos2 = value1.value.length;
      othersheet = scf.FindInSheetCache(value1.value.substring(pos1+1,pos2)); // get other sheet
      if (othersheet == null) { // unavailable
         return {value: 0, type: "e#REF!", errortext: scc.s_sheetunavailable+" "+value1.value.substring(pos1+1,pos2)};
         }
      }

   if (value2.type == "name") { // coord:name is allowed, if name is just one cell
      value2 = scf.LookupName(othersheet, value2.value);
      }

   if (value2.type == "coord") { // value is a coord reference, so return the combined range
      return {value: value1.value+"|"+value2.value+"|", type: "range"}; // return range in the format as used on stack
      }
   else { // bad form
      return {value: scc.s_calcerrcellrefmissing, type: "e#REF!"};
      }
   }


/*
#
# result = SocialCalc.Formula.OperandAsSheetName(sheet, operand)
#
# Gets top of stack and pops it.
# Returns sheetname value. All others are treated as an error.
# Accepts text, cell reference, and named value which is one of those two.
#
*/

SocialCalc.Formula.OperandAsSheetName = function(sheet, operand) {

   var nvalue, cell;

   var scf = SocialCalc.Formula;

   var result = {type: "", value: ""};

   var stacklen = operand.length;

   result.value = operand[stacklen-1].value; // get top of stack
   result.type = operand[stacklen-1].type;
   operand.pop(); // we have data - pop stack
   if (result.type == "name") {
      nvalue = SocialCalc.Formula.LookupName(sheet, result.value);
      if (!nvalue.value) { // not a known name - return bare name as the name value
         return result;
         }
      result.value = nvalue.value;
      result.type = nvalue.type;
      }
   if (result.type == "coord") { // value is a coord reference, follow it to find sheet name
      cell = sheet.cells[SocialCalc.Formula.PlainCoord(result.value)];
      if (cell) {
         result.value = cell.datavalue;
         result.type = cell.valuetype;
         }
      else {
         result.value = "";
         result.type = "b";
         }
      }
   if (result.type.charAt(0) == "t") { // value is a string which could be a sheet name
      return result;
      }
   else {
      result.value = "";
      result.error = SocialCalc.Constants.s_calcerrsheetnamemissing;
      return result;
      }

   }

//
// value = SocialCalc.Formula.LookupName(sheet, name)
//
// Returns value and type of a named value
// Names are case insensitive
// Names may have a definition which is a coord (A1), a range (A1:B7), or a formula (=OFFSET(A1,0,0,5,1))
// Note: The range must not have sheet names ("!") in them.
//

SocialCalc.Formula.LookupName = function(sheet, name) {

   var pos, specialc, parseinfo;
   var names = sheet.names;
   var value = {};
   var startedwalk = false;

   if (names[name.toUpperCase()]) { // is name defined?

      value.value = names[name.toUpperCase()].definition; // yes

      if (value.value.charAt(0) == "=") { // formula
         if (!sheet.checknamecirc) { // are we possibly walking the name tree?
            sheet.checknamecirc = {}; // not yet
            startedwalk = true; // remember we are the reference that started it
            }
         else {
            if (sheet.checknamecirc[name]) { // circular reference
               value.type = "e#NAME?";
               value.error = SocialCalc.Constants.s_circularnameref+' "' + name + '".';
               return value;
               }
            }
         sheet.checknamecirc[name] = true;

         parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(value.value.substring(1));
         value = SocialCalc.Formula.evaluate_parsed_formula(parseinfo, sheet, 1); // parse formula, allowing range return

         delete sheet.checknamecirc[name]; // done with us
         if (startedwalk) {
            delete sheet.checknamecirc; // done with walk
            }

         if (value.type != "range") {
            return value;
            }
         }

      pos = value.value.indexOf(":");
      if (pos != -1) { // range
         value.type = "range";
         value.value = value.value.substring(0, pos) + "|" + value.value.substring(pos+1)+"|";
         value.value = value.value.toUpperCase();
         }
      else {
         value.type = "coord";
         value.value = value.value.toUpperCase();
         }
      return value;
      }
   else if (specialc=SocialCalc.Formula.SpecialConstants[name.toUpperCase()]) { // special constant, like #REF!
      pos = specialc.indexOf(",");
      value.value = specialc.substring(0,pos)-0;
      value.type = specialc.substring(pos+1);
      return value;
      }
   else {
      value.value = "";
      value.type = "e#NAME?";
      value.error = SocialCalc.Constants.s_calcerrunknownname+' "'+name+'"';
      return value;
      }
   }

/*
#
# coord = SocialCalc.Formula.StepThroughRangeDown(operand, rangevalue)
#
# Returns next coord in a range, keeping track on the operand stack
# Goes from upper left across and down to bottom right.
#
*/

SocialCalc.Formula.StepThroughRangeDown = function(operand, rangevalue) {

   var value1, value2, sequence, pos1, pos2, sheet1, rp, c, r, count;
   var scf = SocialCalc.Formula;

   pos1 = rangevalue.indexOf("|");
   pos2 = rangevalue.indexOf("|", pos1+1);
   value1 = rangevalue.substring(0, pos1);
   value2 = rangevalue.substring(pos1+1, pos2);
   sequence = rangevalue.substring(pos2+1) - 0;

   pos1 = value1.indexOf("!");
   if (pos1 != -1) {
      sheet1 = value1.substring(pos1);
      value1 = value1.substring(0, pos1);
      }
   else {
      sheet1 = "";
      }
   pos1 = value2.indexOf("!");
   if (pos1 != -1) {
      value2 = value2.substring(0, pos1);
      }

   rp = scf.OrderRangeParts(value1, value2);
   
   count = 0;
   for (r=rp.r1; r<=rp.r2; r++) {
      for (c=rp.c1; c<=rp.c2; c++) {
         count++;
         if (count > sequence) {
            if (r!=rp.r2 || c!=rp.c2) { // keep on stack until done
               scf.PushOperand(operand, "range", value1+sheet1+"|"+value2+"|"+count);
               }
            return {value: SocialCalc.crToCoord(c, r)+sheet1, type: "coord"};
            }
         }
      }
   }

/*
#
# result = SocialCalc.Formula.DecodeRangeParts(sheetdata, range)
#
# Returns sheetdata for the sheet where the range is, as well as
# the number of the first column in the range, the number of columns,
# and equivalent row information:
#
# {sheetdata: sheet, sheetname: name-or-"", col1num: n, ncols: n, row1num: n, nrows: n}
#
# If any errors, a null result is returned.
#
*/

SocialCalc.Formula.DecodeRangeParts = function(sheetdata, range) {

   var value1, value2, pos1, pos2, sheet1, coordsheetdata, rp;

   var scf = SocialCalc.Formula;

   pos1 = range.indexOf("|");
   pos2 = range.indexOf("|", pos1+1);
   value1 = range.substring(0, pos1);
   value2 = range.substring(pos1+1, pos2);

   pos1 = value1.indexOf("!");
   if (pos1 != -1) {
      sheet1 = value1.substring(pos1+1);
      value1 = value1.substring(0, pos1);
      }
   else {
      sheet1 = "";
      }
   pos1 = value2.indexOf("!");
   if (pos1 != -1) {
      value2 = value2.substring(0, pos1);
      }

   coordsheetdata = sheetdata;
   if (sheet1) { // sheet reference
      coordsheetdata = scf.FindInSheetCache(sheet1);
      if (coordsheetdata == null) { // unavailable
         return null;
         }
      }

   rp = scf.OrderRangeParts(value1, value2);

   return {sheetdata: coordsheetdata, sheetname: sheet1, col1num: rp.c1, ncols: rp.c2-rp.c1+1, row1num: rp.r1, nrows: rp.r2-rp.r1+1}

   }


//*********************
//
// Function Handling
//
//*********************

// List of functions -- Define after functions are defined
//
// SocialCalc.Formula.FunctionList["function_name"] = [function_subroutine, number_of_arguments, arg_def, func_def, func_class]
//   function_subroutine takes arguments (fname, operand, foperand, sheet), returns
//      errortext or null, pushing result on operand stack.
//   number_of_arguments is:
//      0 = no arguments
//      >0 = exactly that many arguments
//      <0 = that many arguments (abs value) or more
//      100 = don't check
//
//   arg_def, if present, is the name of the element in SocialCalc.Formula.FunctionArgDefs.
//   func_def, if present, is a string explaining the function. If not, looked up in SocialCalc.Constants.
//   func_class, if present, is the comma-separated names of the elements in SocialCalc.Formula.FunctionClasses.
//
// To add a function, just add it to this object.

   if (!SocialCalc.Formula.FunctionList) { // make sure it is defined (could have been in another module)
      SocialCalc.Formula.FunctionList = {};
      }

   // FunctionClasses[classname] = {name: full-name-string, items: [sorted list of function names]};
   // filled in by SocialCalc.Formula.FillFunctionInfo

   SocialCalc.Formula.FunctionClasses = null; // start null to say needs filling in

   // FunctionArgDef[argname] = explicit-string-for-arg-list;
   // filled in by SocialCalc.Formula.FillFunctionInfo

   SocialCalc.Formula.FunctionArgDefs = {};


/*
#
# errortext = SocialCalc.Formula.CalculateFunction(fname, operand, sheet)
#
# Dispatches for function fname.
#
*/

SocialCalc.Formula.CalculateFunction = function(fname, operand, sheet) {

   var fobj, foperand, ffunc, argnum, ttext;
   var scf = SocialCalc.Formula;
   var ok = 1;
   var errortext = "";

   fobj = scf.FunctionList[fname];

   if (fobj) {
      foperand = [];
      ffunc = fobj[0];
      argnum = fobj[1];
      scf.CopyFunctionArgs(operand, foperand);
      if (argnum != 100) {
         if (argnum < 0) {
            if (foperand.length < -argnum) {
               errortext = scf.FunctionArgsError(fname, operand);
               return errortext;
               }
            }
         else {
            if (foperand.length != argnum) {
               errortext = scf.FunctionArgsError(fname, operand);
               return errortext;
               }
            }
         }
      errortext = ffunc(fname, operand, foperand, sheet);
      }

   else {
         ttext = fname;

         if (operand.length && operand[operand.length-1].type == "start") { // no arguments - name or zero arg function
            operand.pop();
            scf.PushOperand(operand, "name", ttext);
            }

         else {
            errortext = SocialCalc.Constants.s_sheetfuncunknownfunction+" " + ttext +". ";
            }
      }

   return errortext;

}

//
// SocialCalc.Formula.PushOperand(operand, t, v)
//
// Pushes the type and value onto the operand stack
//

SocialCalc.Formula.PushOperand = function(operand, t, v) {

   operand.push({type: t, value: v});

   }

//
// SocialCalc.Formula.CopyFunctionArgs(operand, foperand)
//
// Pops operands from operand and pushes on foperand up to function start
// reversing order in the process.
//

SocialCalc.Formula.CopyFunctionArgs = function(operand, foperand) {

   var fobj, foperand, ffunc, argnum;
   var scf = SocialCalc.Formula;
   var ok = 1;
   var errortext = null;

   while (operand.length>0 && operand[operand.length-1].type != "start") { // get each arg
      foperand.push(operand.pop()); // copy it
      }
   operand.pop(); // get rid of "start"

   return;

   }

//
// errortext = SocialCalc.Formula.FunctionArgsError(fname, operand)
//
// Pushes appropriate error on operand stack and returns errortext, including fname
//

SocialCalc.Formula.FunctionArgsError = function(fname, operand) {

   var errortext = SocialCalc.Constants.s_calcerrincorrectargstofunction+" " + fname + ". ";
   SocialCalc.Formula.PushOperand(operand, "e#VALUE!", errortext);

   return errortext;

   }


//
// errortext = SocialCalc.Formula.FunctionSpecificError(fname, operand, errortype, errortext)
//
// Pushes specified error and text on operand stack.
//

SocialCalc.Formula.FunctionSpecificError = function(fname, operand, errortype, errortext) {

   SocialCalc.Formula.PushOperand(operand, errortype, errortext);

   return errortext;

   }

//
// haserror = SocialCalc.Formula.CheckForErrorValue(operand, v)
//
// If v.type is an error, push it on operand stack and return true, otherwise return false.
//

SocialCalc.Formula.CheckForErrorValue = function(operand, v) {

   if (v.type.charAt(0) == "e") {
      operand.push(v);
      return true;
      }
   else {
      return false;
      }

   }

/////////////////////////
//
// FUNCTION INFORMATION ROUTINES
//

//
// SocialCalc.Formula.FillFunctionInfo()
//
// Goes through function definitions and fills out FunctionArgDefs and FunctionClasses.
// Execute this after any changes to SocialCalc.Constants but before UI is used.
//

SocialCalc.Formula.FillFunctionInfo = function() {

   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;

   var fname, f, classes, cname, i;

   if (scf.FunctionClasses) { // only do once
      return;
      }

   for (fname in scf.FunctionList) {
      f = scf.FunctionList[fname];
      if (f[2]) { // has an arg def
         scf.FunctionArgDefs[f[2]] = scc["s_farg_"+f[2]] || ""; // get it from constants
         }
      if (!f[3]) { // no text def, see if in constants
         if (scc["s_fdef_"+fname]) {
            scf.FunctionList[fname][3] = scc["s_fdef_"+fname];
            }
         }
      }

   scf.FunctionClasses = {};
 
   for (i=0; i<scc.function_classlist.length; i++) {
      cname = scc.function_classlist[i];
      scf.FunctionClasses[cname] = {name: scc["s_fclass_"+cname], items: []};
      }

   for (fname in scf.FunctionList) {
      f = scf.FunctionList[fname];
      classes = f[4] ? f[4].split(",") : []; // get classes
      classes.push("all");
      for (i=0; i<classes.length; i++) {
         cname = classes[i];
         scf.FunctionClasses[cname].items.push(fname);
         }
      }
   for (cname in scf.FunctionClasses) {
      scf.FunctionClasses[cname].items.sort();
      }

   }

//
// str = SocialCalc.Formula.FunctionArgString(fname)
//
// Returns a string representing the arguments to function fname.
//

SocialCalc.Formula.FunctionArgString = function(fname) {

   var scf = SocialCalc.Formula;
   var fdata = scf.FunctionList[fname];
   var nargs, i, str;

   var adef = fdata[2];

   if (!adef) {
      nargs = fdata[1];
      if (nargs == 0) {
         adef = " ";
         }
      else if (nargs > 0) {
         str = "v1";
         for (i=2; i<=nargs; i++) {
            str += ", v"+i;
            }
         return str;
         }
      else if (nargs < 0) {
         str = "v1";
         for (i=2; i<-nargs; i++) {
            str += ", v"+i;
            }
         return str+", ...";
         }
      else {
         return "nargs: "+nargs;
         }
      }

   str = scf.FunctionArgDefs[adef] || adef;

   return str;

   }


/////////////////////////
//
// FUNCTION DEFINITIONS
//
// The standard function definitions follow.
//
// Note that some need SocialCalc.DetermineValueType to be defined.
//

/*
#
# AVERAGE(v1,c1:c2,...)
# COUNT(v1,c1:c2,...)
# COUNTA(v1,c1:c2,...)
# COUNTBLANK(v1,c1:c2,...)
# MAX(v1,c1:c2,...)
# MIN(v1,c1:c2,...)
# PRODUCT(v1,c1:c2,...)
# STDEV(v1,c1:c2,...)
# STDEVP(v1,c1:c2,...)
# SUM(v1,c1:c2,...)
# VAR(v1,c1:c2,...)
# VARP(v1,c1:c2,...)
#
# Calculate all of these and then return the desired one (overhead is in accessing not calculating)
# If this routine is changed, check the dseries_functions, too.
#
*/

SocialCalc.Formula.SeriesFunctions = function(fname, operand, foperand, sheet) {

   var value1, t, v1;

   var scf = SocialCalc.Formula;
   var operand_value_and_type = scf.OperandValueAndType;
   var lookup_result_type = scf.LookupResultType;
   var typelookupplus = scf.TypeLookupTable.plus;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   var sum = 0;
   var resulttypesum = "";
   var count = 0;
   var counta = 0;
   var countblank = 0;
   var product = 1;
   var maxval;
   var minval;
   var mk, sk, mk1, sk1; // For variance, etc.: M sub k, k-1, and S sub k-1
                         // as per Knuth "The Art of Computer Programming" Vol. 2 3rd edition, page 232

   while (foperand.length > 0) {
      value1 = operand_value_and_type(sheet, foperand);
      t = value1.type.charAt(0);
      if (t == "n") count += 1;
      if (t != "b") counta += 1;
      if (t == "b") countblank += 1;

      if (t == "n") {
         v1 = value1.value-0; // get it as a number
         sum += v1;
         product *= v1;
         maxval = (maxval!=undefined) ? (v1 > maxval ? v1 : maxval) : v1;
         minval = (minval!=undefined) ? (v1 < minval ? v1 : minval) : v1;
         if (count == 1) { // initialize with first values for variance used in STDEV, VAR, etc.
            mk1 = v1;
            sk1 = 0;
            }
         else { // Accumulate S sub 1 through n as per Knuth noted above
            mk = mk1 + (v1 - mk1) / count;
            sk = sk1 + (v1 - mk1) * (v1 - mk);
            sk1 = sk;
            mk1 = mk;
            }
         resulttypesum = lookup_result_type(value1.type, resulttypesum || value1.type, typelookupplus);
         }
      else if (t == "e" && resulttypesum.charAt(0) != "e") {
         resulttypesum = value1.type;
         }
      }

   resulttypesum = resulttypesum || "n";

   switch (fname) {
      case "SUM":
         PushOperand(resulttypesum, sum);
         break;

      case "PRODUCT": // may handle cases with text differently than some other spreadsheets
         PushOperand(resulttypesum, product);
         break;

      case "MIN":
         PushOperand(resulttypesum, minval || 0);
         break;

      case "MAX":
         PushOperand(resulttypesum, maxval || 0);
         break;

      case "COUNT":
         PushOperand("n", count);
         break;

      case "COUNTA":
         PushOperand("n", counta);
         break;

      case "COUNTBLANK":
         PushOperand("n", countblank);
         break;

      case "AVERAGE":
         if (count > 0) {
            PushOperand(resulttypesum, sum/count);
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "STDEV":
         if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / (count - 1))); // sk is never negative according to Knuth
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "STDEVP":
         if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / count));
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "VAR":
         if (count > 1) {
            PushOperand(resulttypesum, sk / (count - 1));
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "VARP":
         if (count > 1) {
            PushOperand(resulttypesum, sk / count);
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;
      }

   return null;

   }

// Add to function list
SocialCalc.Formula.FunctionList["AVERAGE"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["COUNT"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["COUNTA"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["COUNTBLANK"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["MAX"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["MIN"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["PRODUCT"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["STDEV"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["STDEVP"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["SUM"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["VAR"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList["VARP"] = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];

/*
#
# SUMPRODUCT(range1, range2, ...)
#
*/

SocialCalc.Formula.SumProductFunction = function(fname, operand, foperand, sheet) {
  
   var range, products = [], sum = 0;
   var scf = SocialCalc.Formula;
   var ncols = 0, nrows = 0;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   while (foperand.length > 0) {
      range = scf.TopOfStackValueAndType(sheet, foperand);
      if (range.type != "range") {
         PushOperand("e#VALUE!", 0);
         return;
         }
      rangeinfo = scf.DecodeRangeParts(sheet, range.value);
      if (!ncols) ncols = rangeinfo.ncols;
      else if (ncols != rangeinfo.ncols) {
         PushOperand("e#VALUE!", 0);
         return;
         }
      if (!nrows) nrows = rangeinfo.nrows;
      else if (nrows != rangeinfo.nrows) {
         PushOperand("e#VALUE!", 0);
         return;
         }
      for (i=0; i<rangeinfo.ncols; i++) {
         for (j=0; j<rangeinfo.nrows; j++) {
            k = i * rangeinfo.nrows + j;
            cellcr = SocialCalc.crToCoord(rangeinfo.col1num + i, rangeinfo.row1num + j);
            cell = rangeinfo.sheetdata.GetAssuredCell(cellcr);
            value = cell.valuetype == "n" ? cell.datavalue : 0;
            products[k] = (products[k] || 1) * value;
            }
         }
      }
   for (i=0; i<products.length; i++) {
      sum += products[i];
      }
   PushOperand("n", sum);

   return;

   }

SocialCalc.Formula.FunctionList["SUMPRODUCT"] = [SocialCalc.Formula.SumProductFunction, -1, "rangen", "", "stat"];

/*
#
# DAVERAGE(databaserange, fieldname, criteriarange)
# DCOUNT(databaserange, fieldname, criteriarange)
# DCOUNTA(databaserange, fieldname, criteriarange)
# DGET(databaserange, fieldname, criteriarange)
# DMAX(databaserange, fieldname, criteriarange)
# DMIN(databaserange, fieldname, criteriarange)
# DPRODUCT(databaserange, fieldname, criteriarange)
# DSTDEV(databaserange, fieldname, criteriarange)
# DSTDEVP(databaserange, fieldname, criteriarange)
# DSUM(databaserange, fieldname, criteriarange)
# DVAR(databaserange, fieldname, criteriarange)
# DVARP(databaserange, fieldname, criteriarange)
#
# Calculate all of these and then return the desired one (overhead is in accessing not calculating)
# If this routine is changed, check the series_functions, too.
#
*/

SocialCalc.Formula.DSeriesFunctions = function(fname, operand, foperand, sheet) {

   var value1, tostype, cr, dbrange, fieldname, criteriarange, dbinfo, criteriainfo;
   var fieldasnum, targetcol, i, j, k, cell, criteriafieldnums;
   var testok, criteriacr, criteria, testcol, testcr;
   var t;

   var scf = SocialCalc.Formula;
   var operand_value_and_type = scf.OperandValueAndType;
   var lookup_result_type = scf.LookupResultType;
   var typelookupplus = scf.TypeLookupTable.plus;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   var value1 = {};

   var sum = 0;
   var resulttypesum = "";
   var count = 0;
   var counta = 0;
   var countblank = 0;
   var product = 1;
   var maxval;
   var minval;
   var mk, sk, mk1, sk1; // For variance, etc.: M sub k, k-1, and S sub k-1
                         // as per Knuth "The Art of Computer Programming" Vol. 2 3rd edition, page 232

   dbrange = scf.TopOfStackValueAndType(sheet, foperand); // get a range
   fieldname = scf.OperandValueAndType(sheet, foperand); // get a value
   criteriarange = scf.TopOfStackValueAndType(sheet, foperand); // get a range

   if (dbrange.type != "range" || criteriarange.type != "range") {
      return scf.FunctionArgsError(fname, operand);
      }

   dbinfo = scf.DecodeRangeParts(sheet, dbrange.value);
   criteriainfo = scf.DecodeRangeParts(sheet, criteriarange.value);

   fieldasnum = scf.FieldToColnum(dbinfo.sheetdata, dbinfo.col1num, dbinfo.ncols, dbinfo.row1num, fieldname.value, fieldname.type);
   if (fieldasnum <= 0) {
      PushOperand("e#VALUE!", 0);
      return;
      }

   targetcol = dbinfo.col1num + fieldasnum - 1;
   criteriafieldnums = [];

   for (i=0; i<criteriainfo.ncols; i++) { // get criteria field colnums
      cell = criteriainfo.sheetdata.GetAssuredCell(SocialCalc.crToCoord(criteriainfo.col1num + i, criteriainfo.row1num));
      criterianum = scf.FieldToColnum(dbinfo.sheetdata, dbinfo.col1num, dbinfo.ncols, dbinfo.row1num, cell.datavalue, cell.valuetype);
      if (criterianum <= 0) {
         PushOperand("e#VALUE!", 0);
         return;
         }
      criteriafieldnums.push(dbinfo.col1num + criterianum - 1);
      }

   for (i=1; i<dbinfo.nrows; i++) { // go through each row of the database
      testok = false;
CRITERIAROW:
      for (j=1; j<criteriainfo.nrows; j++) { // go through each criteria row
         for (k=0; k<criteriainfo.ncols; k++) { // look at each column
            criteriacr = SocialCalc.crToCoord(criteriainfo.col1num + k, criteriainfo.row1num + j); // where criteria is
            cell = criteriainfo.sheetdata.GetAssuredCell(criteriacr);
            criteria = cell.datavalue;
            if (typeof criteria == "string" && criteria.length == 0) continue; // blank items are OK
            testcol = criteriafieldnums[k];
            testcr = SocialCalc.crToCoord(testcol, dbinfo.row1num + i); // cell to check
            cell = criteriainfo.sheetdata.GetAssuredCell(testcr);
            if (!scf.TestCriteria(cell.datavalue, cell.valuetype || "b", criteria)) {
               continue CRITERIAROW; // does not meet criteria - check next row
               }
            }
         testok = true; // met all the criteria
         break CRITERIAROW;
         }
      if (!testok) {
         continue;
         }

      cr = SocialCalc.crToCoord(targetcol, dbinfo.row1num + i); // get cell of this row to do the function on
      cell = dbinfo.sheetdata.GetAssuredCell(cr);

      value1.value = cell.datavalue;
      value1.type = cell.valuetype;
      t = value1.type.charAt(0);
      if (t == "n") count += 1;
      if (t != "b") counta += 1;
      if (t == "b") countblank += 1;

      if (t == "n") {
         v1 = value1.value-0; // get it as a number
         sum += v1;
         product *= v1;
         maxval = (maxval!=undefined) ? (v1 > maxval ? v1 : maxval) : v1;
         minval = (minval!=undefined) ? (v1 < minval ? v1 : minval) : v1;
         if (count == 1) { // initialize with first values for variance used in STDEV, VAR, etc.
            mk1 = v1;
            sk1 = 0;
            }
         else { // Accumulate S sub 1 through n as per Knuth noted above
            mk = mk1 + (v1 - mk1) / count;
            sk = sk1 + (v1 - mk1) * (v1 - mk);
            sk1 = sk;
            mk1 = mk;
            }
         resulttypesum = lookup_result_type(value1.type, resulttypesum || value1.type, typelookupplus);
         }
      else if (t == "e" && resulttypesum.charAt(0) != "e") {
         resulttypesum = value1.type;
         }
      }

   resulttypesum = resulttypesum || "n";

   switch (fname) {
      case "DSUM":
         PushOperand(resulttypesum, sum);
         break;

      case "DPRODUCT": // may handle cases with text differently than some other spreadsheets
         PushOperand(resulttypesum, product);
         break;

      case "DMIN":
         PushOperand(resulttypesum, minval || 0);
         break;

      case "DMAX":
         PushOperand(resulttypesum, maxval || 0);
         break;

      case "DCOUNT":
         PushOperand("n", count);
         break;

      case "DCOUNTA":
         PushOperand("n", counta);
         break;

      case "DAVERAGE":
         if (count > 0) {
            PushOperand(resulttypesum, sum/count);
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "DSTDEV":
         if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / (count - 1))); // sk is never negative according to Knuth
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "DSTDEVP":
         if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / count));
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "DVAR":
         if (count > 1) {
            PushOperand(resulttypesum, sk / (count - 1));
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "DVARP":
         if (count > 1) {
            PushOperand(resulttypesum, sk / count);
            }
         else {
            PushOperand("e#DIV/0!", 0);
            }
         break;

      case "DGET":
         if (count == 1) {
            PushOperand(resulttypesum, sum);
            }
         else if (count == 0) {
            PushOperand("e#VALUE!", 0);
            }
         else {
            PushOperand("e#NUM!", 0);
            }
         break;

      }

   return;

   }

SocialCalc.Formula.FunctionList["DAVERAGE"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DCOUNT"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DCOUNTA"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DGET"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DMAX"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DMIN"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DPRODUCT"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DSTDEV"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DSTDEVP"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DSUM"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DVAR"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList["DVARP"] = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];

/*
#
# colnum = SocialCalc.Formula.FieldToColnum(sheet, col1num, ncols, row1num, fieldname, fieldtype)
#
# If fieldname is a number, uses it, otherwise looks up string in cells in row to find field number
#
# If not found, returns 0.
#
*/

SocialCalc.Formula.FieldToColnum = function(sheet, col1num, ncols, row1num, fieldname, fieldtype) {

   var colnum, cell, value;

   if (fieldtype.charAt(0) == "n") { // number - return it if legal
      colnum = fieldname - 0; // make sure a number
      if (colnum <= 0 || colnum > ncols) {
         return 0;
         }
      return Math.floor(colnum);
      }

   if (fieldtype.charAt(0) != "t") { // must be text otherwise
      return 0;
      }

   fieldname = fieldname ? fieldname.toLowerCase() : "";

   for (colnum=0; colnum < ncols; colnum++) { // look through column headers for a match
      cell = sheet.GetAssuredCell(SocialCalc.crToCoord(col1num+colnum, row1num));
      value = cell.datavalue;
      value = (value+"").toLowerCase(); // ignore case
      if (value == fieldname) { // match
         return colnum+1;
         }         
      }
   return 0; // looked at all and no match

   }


/*
#
# HLOOKUP(value, range, row, [rangelookup])
# VLOOKUP(value, range, col, [rangelookup])
# MATCH(value, range, [rangelookup])
#
*/

SocialCalc.Formula.LookupFunctions = function(fname, operand, foperand, sheet) {

   var lookupvalue, range, offset, rangelookup, offsetvalue, rangeinfo;
   var c, r, cincr, rincr, previousOK, csave, rsave, cell, value, valuetype, cr, lookupvalue;

   var scf = SocialCalc.Formula;
   var operand_value_and_type = scf.OperandValueAndType;
   var lookup_result_type = scf.LookupResultType;
   var typelookupplus = scf.TypeLookupTable.plus;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   lookupvalue = operand_value_and_type(sheet, foperand);
   if (typeof lookupvalue.value == "string") {
      lookupvalue.value = lookupvalue.value.toLowerCase();
      }

   range = scf.TopOfStackValueAndType(sheet, foperand);

   rangelookup = 1; // default to true or 1
   if (fname == "MATCH") {
      if (foperand.length) {
         rangelookup = scf.OperandAsNumber(sheet, foperand);
         if (rangelookup.type.charAt(0) != "n") {
            PushOperand("e#VALUE!", 0);
            return;
            }
         if (foperand.length) {
            scf.FunctionArgsError(fname, operand);
            return 0;
            }
         rangelookup = rangelookup.value - 0;
         }
      }
   else {
      offsetvalue = scf.OperandAsNumber(sheet, foperand);
      if (offsetvalue.type.charAt(0) != "n") {
         PushOperand("e#VALUE!", 0);
         return;
         }
      offsetvalue = Math.floor(offsetvalue.value);
      if (foperand.length) {
         rangelookup = scf.OperandAsNumber(sheet, foperand);
         if (rangelookup.type.charAt(0) != "n") {
            PushOperand("e#VALUE!", 0);
            return;
            }
         if (foperand.length) {
            scf.FunctionArgsError(fname, operand);
            return 0;
            }
         rangelookup = rangelookup.value ? 1 : 0; // convert to 1 or 0
         }
      }
   lookupvalue.type = lookupvalue.type.charAt(0); // only deal with general type
   if (lookupvalue.type == "n") { // if number, make sure a number
      lookupvalue.value = lookupvalue.value - 0;
      }

   if (range.type != "range") {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }

   rangeinfo = scf.DecodeRangeParts(sheet, range.value, range.type);
   if (!rangeinfo) {
      PushOperand("e#REF!", 0);
      return;
      }

   c = 0;
   r = 0;
   cincr = 0;
   rincr = 0;
   if (fname == "HLOOKUP") {
      cincr = 1;
      if (offsetvalue > rangeinfo.nrows) {
         PushOperand("e#REF!", 0);
         return;
         }
      }
   else if (fname == "VLOOKUP") {
      rincr = 1;
      if (offsetvalue > rangeinfo.ncols) {
         PushOperand("e#REF!", 0);
         return;
         }
      }
   else if (fname == "MATCH") {
      if (rangeinfo.ncols > 1) {
         if (rangeinfo.nrows > 1) {
            PushOperand("e#N/A", 0);
            return;
            }
         cincr = 1;
         }
      else {
         rincr = 1;
         }
      }
   else {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }
   if (offsetvalue < 1 && fname != "MATCH") {
      PushOperand("e#VALUE!", 0);
      return 0;
      }

   previousOK; // if 1, previous test was <. If 2, also this one wasn't

   while (1) {
      cr = SocialCalc.crToCoord(rangeinfo.col1num + c, rangeinfo.row1num + r);
      cell = rangeinfo.sheetdata.GetAssuredCell(cr);
      value = cell.datavalue;
      valuetype = cell.valuetype ? cell.valuetype.charAt(0) : "b"; // only deal with general types
      if (valuetype == "n") {
         value = value - 0; // make sure number
         }
      if (rangelookup) { // rangelookup type 1 or -1: look for within brackets for matches
         if (lookupvalue.type == "n" && valuetype == "n") {
            if (lookupvalue.value == value) { // match
               break;
               }
            if ((rangelookup > 0 && lookupvalue.value > value)
                || (rangelookup < 0 && lookupvalue.value < value)) { // possible match: wait and see
               previousOK = 1;
               csave = c; // remember col and row of last OK
               rsave = r;
               }
            else if (previousOK) { // last one was OK, this one isn't
               previousOK = 2;
               break;
               }
            }

         else if (lookupvalue.type == "t" && valuetype == "t") {
            value = typeof value == "string" ? value.toLowerCase() : "";
            if (lookupvalue.value == value) { // match
               break;
               }
            if ((rangelookup > 0 && lookupvalue.value > value)
                || (rangelookup < 0 && lookupvalue.value < value)) { // possible match: wait and see
               previousOK = 1;
               csave = c;
               rsave = r;
               }
            else if (previousOK) { // last one was OK, this one isn't
               previousOK = 2;
               break;
               }
            }
         }
      else { // exact value matches
         if (lookupvalue.type == "n" && valuetype == "n") {
            if (lookupvalue.value == value) { // match
               break;
               }
            }
         else if (lookupvalue.type == "t" && valuetype == "t") {
            value = typeof value == "string" ? value.toLowerCase() : "";
            if (lookupvalue.value == value) { // match
               break;
               }
            }
         }

      r += rincr;
      c += cincr;
      if (r >= rangeinfo.nrows || c >= rangeinfo.ncols) { // end of range to check, no exact match
         if (previousOK) { // at least one could have been OK
            previousOK = 2;
            break;
            }
         PushOperand("e#N/A", 0);
         return;
         }
      }

   if (previousOK == 2) { // back to last OK
      r = rsave;
      c = csave;
      }

   if (fname == "MATCH") {
      value = c + r + 1; // only one may be <> 0
      valuetype = "n";
      }
   else {
      cr = SocialCalc.crToCoord(rangeinfo.col1num+c+(fname == "VLOOKUP" ? offsetvalue-1 : 0), rangeinfo.row1num+r+(fname == "HLOOKUP" ? offsetvalue-1 : 0));
      cell = rangeinfo.sheetdata.GetAssuredCell(cr);
      value = cell.datavalue;
      valuetype = cell.valuetype;
      }
   PushOperand(valuetype, value);

   return;

   }

SocialCalc.Formula.FunctionList["HLOOKUP"] = [SocialCalc.Formula.LookupFunctions, -3, "hlookup", "", "lookup"];
SocialCalc.Formula.FunctionList["MATCH"] = [SocialCalc.Formula.LookupFunctions, -2, "match", "", "lookup"];
SocialCalc.Formula.FunctionList["VLOOKUP"] = [SocialCalc.Formula.LookupFunctions, -3, "vlookup", "", "lookup"];

/*
#
# INDEX(range, rownum, colnum)
#
*/

SocialCalc.Formula.IndexFunction = function(fname, operand, foperand, sheet) {

   var range, sheetname, indexinfo, rowindex, colindex, result, resulttype;

   var scf = SocialCalc.Formula;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   range = scf.TopOfStackValueAndType(sheet, foperand); // get range
   if (range.type != "range") {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }
   indexinfo = scf.DecodeRangeParts(sheet, range.value, range.type);
   if (indexinfo.sheetname) {
      sheetname = "!" + indexinfo.sheetname;
      }
   else {
      sheetname = "";
      }

   rowindex = {value:0};
   colindex = {value:0};

   if (foperand.length) { // look for row number
      rowindex = scf.OperandAsNumber(sheet, foperand);
      if (rowindex.type.charAt(0) != "n" || rowindex.value < 0) {
         PushOperand("e#VALUE!", 0);
         return;
         }
      if (foperand.length) { // look for col number
         colindex = scf.OperandAsNumber(sheet, foperand);
         if (colindex.type.charAt(0) != "n" || colindex.value < 0) {
            PushOperand("e#VALUE!", 0);
            return;
            }
         if (foperand.length) {
            scf.FunctionArgsError(fname, operand);
            return 0;
            }
         }
      else { // col number missing
         if (indexinfo.nrows == 1) { // if only one row, then rowindex is really colindex
            colindex.value = rowindex.value;
            rowindex.value = 0;
            }
         }
      }

   if (rowindex.value > indexinfo.nrows || colindex.value > indexinfo.ncols) {
      PushOperand("e#REF!", 0);
      return;
      }

   if (rowindex.value == 0) {
      if (colindex.value == 0) {
         if (indexinfo.nrows == 1 && indexinfo.ncols == 1) {
            result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num) + sheetname;
            resulttype = "coord";
            }
         else {
            result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num) + sheetname + "|" +
                     SocialCalc.crToCoord(indexinfo.col1num+indexinfo.ncols-1, indexinfo.row1num+indexinfo.nrows-1) + 
                     "|";
            resulttype = "range";
            }
         }
      else {
         if (indexinfo.nrows == 1) {
            result = SocialCalc.crToCoord(indexinfo.col1num+colindex.value-1, indexinfo.row1num) + sheetname;
            resulttype = "coord";
            }
         else {
            result = SocialCalc.crToCoord(indexinfo.col1num+colindex.value-1, indexinfo.row1num) + sheetname + "|" +
                     SocialCalc.crToCoord(indexinfo.col1num+colindex.value-1, indexinfo.row1num+indexinfo.nrows-1) +
                     "|";
            resulttype = "range";
            }
         }
      }
   else {
      if (colindex.value == 0) {
         if (indexinfo.ncols == 1) {
            result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num+rowindex.value-1) + sheetname;
            resulttype = "coord";
            }
         else {
            result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num+rowindex.value-1) + sheetname + "|" +
                     SocialCalc.crToCoord(indexinfo.col1num+indexinfo.ncols-1, indexinfo.row1num+rowindex.value-1) +
                     "|";
            resulttype = "range";
            }
         }
      else {
         result = SocialCalc.crToCoord(indexinfo.col1num+colindex.value-1, indexinfo.row1num+rowindex.value-1) + sheetname;
         resulttype = "coord";
         }
      }

   PushOperand(resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["INDEX"] = [SocialCalc.Formula.IndexFunction, -1, "index", "", "lookup"];

/*
#
# COUNTIF(c1:c2,"criteria")
# SUMIF(c1:c2,"criteria",[range2])
#
*/

SocialCalc.Formula.CountifSumifFunctions = function(fname, operand, foperand, sheet) {

   var range, criteria, sumrange, f2operand, result, resulttype, value1, value2;
   var sum = 0;
   var resulttypesum = "";
   var count = 0;

   var scf = SocialCalc.Formula;
   var operand_value_and_type = scf.OperandValueAndType;
   var lookup_result_type = scf.LookupResultType;
   var typelookupplus = scf.TypeLookupTable.plus;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   range = scf.TopOfStackValueAndType(sheet, foperand); // get range or coord
   criteria = scf.OperandAsText(sheet, foperand); // get criteria
   if (fname == "SUMIF") {
      if (foperand.length == 1) { // three arg form of SUMIF
         sumrange = scf.TopOfStackValueAndType(sheet, foperand);
         }
      else if (foperand.length == 0) { // two arg form
         sumrange = {value: range.value, type: range.type};
         }
      else {
         scf.FunctionArgsError(fname, operand);
         return 0;
         }
      }
   else {
      sumrange = {value: range.value, type: range.type};
      }

   if (criteria.type.charAt(0) == "n") {
      criteria.value = criteria.value + ""; // make text
      }
   else if (criteria.type.charAt(0) == "e") { // error
      criteria.value = null;
      }
   else if (criteria.type.charAt(0) == "b") { // blank here is undefined
      criteria.value = null;
      }

   if (range.type != "coord" && range.type != "range") {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }

   if (fname == "SUMIF" && sumrange.type != "coord" && sumrange.type != "range") {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }

   foperand.push(range);
   f2operand = []; // to allow for 3 arg form
   f2operand.push(sumrange);

   while (foperand.length) {
      value1 = operand_value_and_type(sheet, foperand);
      value2 = operand_value_and_type(sheet, f2operand);

      if (!scf.TestCriteria(value1.value, value1.type, criteria.value)) {
         continue;
         }

      count += 1;

      if (value2.type.charAt(0) == "n") {
         sum += value2.value-0;
         resulttypesum = lookup_result_type(value2.type, resulttypesum || value2.type, typelookupplus);
         }
      else if (value2.type.charAt(0) == "e" && resulttypesum.charAt(0) != "e") {
         resulttypesum = value2.type;
         }
      }

   resulttypesum = resulttypesum || "n";

   if (fname == "SUMIF") {
      PushOperand(resulttypesum, sum);
      }
   else if (fname == "COUNTIF") {
      PushOperand("n", count);
      }

   return;

   }

SocialCalc.Formula.FunctionList["COUNTIF"] = [SocialCalc.Formula.CountifSumifFunctions, 2, "rangec", "", "stat"];
SocialCalc.Formula.FunctionList["SUMIF"] = [SocialCalc.Formula.CountifSumifFunctions, -2, "sumif", "", "stat"];

/*
#
# IF(cond,truevalue,falsevalue)
#
*/

SocialCalc.Formula.IfFunction = function(fname, operand, foperand, sheet) {

   var cond, t;

   cond = SocialCalc.Formula.OperandValueAndType(sheet, foperand);
   t = cond.type.charAt(0);
   if (t != "n" && t != "b") {
      operand.push({type: "e#VALUE!", value: 0});
      return;
      }

   var op1, op2;

   op1 = foperand.pop();
   if (foperand.length == 1) {
      op2 = foperand.pop();
      }
   else if (foperand.length == 0) {
      op2 = {type: "n", value: 0};
      }
   else {
      scf.FunctionArgsError(fname, operand);
      return;
   }

   operand.push(cond.value ? op1 : op2);

   }

// Add to function list
SocialCalc.Formula.FunctionList["IF"] = [SocialCalc.Formula.IfFunction, -2, "iffunc", "", "test"];

/*
#
# DATE(year,month,day)
#
*/

SocialCalc.Formula.DateFunction = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var result = 0;
   var year = scf.OperandAsNumber(sheet, foperand);
   var month = scf.OperandAsNumber(sheet, foperand);
   var day = scf.OperandAsNumber(sheet, foperand);
   var resulttype = scf.LookupResultType(year.type, month.type, scf.TypeLookupTable.twoargnumeric);
   resulttype = scf.LookupResultType(resulttype, day.type, scf.TypeLookupTable.twoargnumeric);
   if (resulttype.charAt(0) == "n") {
      result = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(
                  Math.floor(year.value), Math.floor(month.value), Math.floor(day.value)
                  ) - SocialCalc.FormatNumber.datevalues.julian_offset;
      resulttype = "nd";
      }
   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["DATE"] = [SocialCalc.Formula.DateFunction, 3, "date", "", "datetime"];

/*
#
# TIME(hour,minute,second)
#
*/

SocialCalc.Formula.TimeFunction = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var result = 0;
   var hours = scf.OperandAsNumber(sheet, foperand);
   var minutes = scf.OperandAsNumber(sheet, foperand);
   var seconds = scf.OperandAsNumber(sheet, foperand);
   var resulttype = scf.LookupResultType(hours.type, minutes.type, scf.TypeLookupTable.twoargnumeric);
   resulttype = scf.LookupResultType(resulttype, seconds.type, scf.TypeLookupTable.twoargnumeric);
   if (resulttype.charAt(0) == "n") {
      result = ((hours.value * 60 * 60) + (minutes.value * 60) + seconds.value) / (24*60*60);
      resulttype = "nt";
      }
   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["TIME"] = [SocialCalc.Formula.TimeFunction, 3, "hms", "", "datetime"];

/*
#
# DAY(date)
# MONTH(date)
# YEAR(date)
# WEEKDAY(date, [type])
#
*/

SocialCalc.Formula.DMYFunctions = function(fname, operand, foperand, sheet) {

   var ymd, dtype, doffset;
   var scf = SocialCalc.Formula;
   var result = 0;

   var datevalue = scf.OperandAsNumber(sheet, foperand);
   var resulttype = scf.LookupResultType(datevalue.type, datevalue.type, scf.TypeLookupTable.oneargnumeric);

   if (resulttype.charAt(0) == "n") {
      ymd = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(
               Math.floor(datevalue.value + SocialCalc.FormatNumber.datevalues.julian_offset));
      switch (fname) {
         case "DAY":
            result = ymd.day;
            break;

         case "MONTH":
            result = ymd.month;
            break;

         case "YEAR":
            result = ymd.year;
            break;

         case "WEEKDAY":
            dtype = {value: 1};
            if (foperand.length) { // get type if present
               dtype = scf.OperandAsNumber(sheet, foperand);
               if (dtype.type.charAt(0) != "n" || dtype.value < 1 || dtype.value > 3) {
                  scf.PushOperand(operand, "e#VALUE!", 0);
                  return;
                  }
               if (foperand.length) { // extra args
                  scf.FunctionArgsError(fname, operand);
                  return;
                  }
               }
            doffset = 6;
            if (dtype.value > 1) {
               doffset -= 1;
               }
            result = Math.floor(datevalue.value+doffset) % 7 + (dtype.value < 3 ? 1 : 0);
            break;
         }
      }

   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["DAY"] = [SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList["MONTH"] = [SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList["YEAR"] = [SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList["WEEKDAY"] = [SocialCalc.Formula.DMYFunctions, -1, "weekday", "", "datetime"];

/*
#
# HOUR(datetime)
# MINUTE(datetime)
# SECOND(datetime)
#
*/

SocialCalc.Formula.HMSFunctions = function(fname, operand, foperand, sheet) {

   var hours, minutes, seconds, fraction;
   var scf = SocialCalc.Formula;
   var result = 0;

   var datetime = scf.OperandAsNumber(sheet, foperand);
   var resulttype = scf.LookupResultType(datetime.type, datetime.type, scf.TypeLookupTable.oneargnumeric);

   if (resulttype.charAt(0) == "n") {
      if (datetime.value < 0) {
         scf.PushOperand(operand, "e#NUM!", 0); // must be non-negative
         return;
         }
      fraction = datetime.value - Math.floor(datetime.value); // fraction of a day
      fraction *= 24;
      hours = Math.floor(fraction);
      fraction -= Math.floor(fraction);
      fraction *= 60;
      minutes = Math.floor(fraction);
      fraction -= Math.floor(fraction);
      fraction *= 60;
      seconds = Math.floor(fraction + (datetime.value >= 0 ? 0.5: -0.5));
      if (fname == "HOUR") {
         result = hours;
         }
      else if (fname == "MINUTE") {
         result = minutes;
         }
      else if (fname == "SECOND") {
         result = seconds;
         }
      }

   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["HOUR"] = [SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList["MINUTE"] = [SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList["SECOND"] = [SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime"];

/*
#
# EXACT(v1,v2)
#
*/

SocialCalc.Formula.ExactFunction = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "nl";

   var value1 = scf.OperandValueAndType(sheet, foperand);
   var v1type = value1.type.charAt(0);
   var value2 = scf.OperandValueAndType(sheet, foperand);
   var v2type = value2.type.charAt(0);

   if (v1type == "t") {
      if (v2type == "t") {
         result = value1.value == value2.value ? 1 : 0;
         }
      else if (v2type == "b") {
         result = value1.value.length ? 0 : 1;
         }
      else if (v2type == "n") {
         result = value1.value == value2.value+"" ? 1 : 0;
         }
      else if (v2type == "e") {
         result = value2.value;
         resulttype = value2.type;
         }
      else {
         result = 0;
         }
      }
   else if (v1type == "n") {
      if (v2type == "n") {
         result = value1.value-0 == value2.value-0 ? 1 : 0;
         }
      else if (v2type == "b") {
         result = 0;
         }
      else if (v2type == "t") {
         result = value1.value+"" == value2.value ? 1 : 0;
         }
      else if (v2type == "e") {
         result = value2.value;
         resulttype = value2.type;
         }
      else {
         result = 0;
         }
      }
   else if (v1type == "b") {
      if (v2type == "t") {
         result = value2.value.length ? 0 : 1;
         }
      else if (v2type == "b") {
         result = 1;
         }
      else if (v2type == "n") {
         result = 0;
         }
      else if (v2type == "e") {
         result = value2.value;
         resulttype = value2.type;
         }
      else {
         result = 0;
         }
      }
   else if (v1type == "e") {
      result = value1.value;
      resulttype = value1.type;
      }

   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["EXACT"] = [SocialCalc.Formula.ExactFunction, 2, "", "", "text"];

/*
#
# FIND(key,string,[start])
# LEFT(string,[length])
# LEN(string)
# LOWER(string)
# MID(string,start,length)
# PROPER(string)
# REPLACE(string,start,length,new)
# REPT(string,count)
# RIGHT(string,[length])
# SUBSTITUTE(string,old,new,[which])
# TRIM(string)
# HEXCODE(string)
# UPPER(string)
#
*/

// SocialCalc.Formula.ArgList has an array for each function, one entry for each possible arg (up to max).
// Min args are specified in SocialCalc.Formula.FunctionList.
// If array element is 1 then it's a text argument, if it's 0 then it's numeric, if -1 then just get whatever's there
// Text values are manipulated as UTF-8, converting from and back to byte strings

SocialCalc.Formula.ArgList = {
                FIND: [1, 1, 0],
                LEFT: [1, 0],
                LEN: [1],
                LOWER: [1],
                MID: [1, 0, 0],
                PROPER: [1],
                REPLACE: [1, 0, 0, 1],
                REPT: [1, 0],
                RIGHT: [1, 0],
                SUBSTITUTE: [1, 1, 1, 0],
                TRIM: [1],
                HEXCODE: [1],
                UPPER: [1]
               };

SocialCalc.Formula.StringFunctions = function(fname, operand, foperand, sheet) {

   var i, value, offset, len, start, count;
   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "e#VALUE!";

   var numargs = foperand.length;
   var argdef = scf.ArgList[fname];
   var operand_value = [];
   var operand_type = [];

   for (i=1; i <= numargs; i++) { // go through each arg, get value and type, and check for errors
      if (i > argdef.length) { // too many args
         scf.FunctionArgsError(fname, operand);
         return;
         }
      if (argdef[i-1] == 0) {
         value = scf.OperandAsNumber(sheet, foperand);
         }
      else if (argdef[i-1] == 1) {
         value = scf.OperandAsText(sheet, foperand);
         }
      else if (argdef[i-1] == -1) {
         value = scf.OperandValueAndType(sheet, foperand);
         }
      operand_value[i] = value.value;
      operand_type[i] = value.type;
      if (value.type.charAt(0) == "e") {
         scf.PushOperand(operand, value.type, result);
         return;
         }
      }

   switch (fname) {
      case "FIND":
         offset = operand_type[3] ? operand_value[3]-1 : 0;
         if (offset < 0) {
            result = "Start is before string"; // !! not displayed, no need to translate
            }
         else {
            result = operand_value[2].indexOf(operand_value[1], offset); // (null string matches first char)
            if (result >= 0) {
               result += 1;
               resulttype = "n";
               }
            else {
               result = "Not found"; // !! not displayed, error is e#VALUE!
               }
            }
         break;

      case "LEFT":
         len = operand_type[2] ? operand_value[2]-0 : 1;
         if (len < 0) {
            result = "Negative length";
            }
         else {
            result = operand_value[1].substring(0, len);
            resulttype = "t";
            }
         break;

      case "LEN":
         result = operand_value[1].length;
         resulttype = "n";
         break;

      case "LOWER":
         result = operand_value[1].toLowerCase();
         resulttype = "t";
         break;

      case "MID":
         start = operand_value[2]-0;
         len = operand_value[3]-0;
         if (len < 1 || start < 1) {
            result = "Bad arguments";
            }
         else {
            result = operand_value[1].substring(start-1, start+len-1);
            resulttype = "t";
            }
         break;

      case "PROPER":
         result = operand_value[1].replace(/\b\w+\b/g, function(word) {
                     return word.substring(0,1).toUpperCase() + 
                        word.substring(1);
                     }); // uppercase first character of words (see JavaScript, Flanagan, 5th edition, page 704)
         resulttype = "t";
         break;

      case "REPLACE":
         start = operand_value[2]-0;
         len = operand_value[3]-0;
         if (len < 0 || start < 1) {
            result = "Bad arguments";
            }
         else {
            result = operand_value[1].substring(0, start-1) + operand_value[4] + 
               operand_value[1].substring(start-1+len);
            resulttype = "t";
            }
         break;

      case "REPT":
         count = operand_value[2]-0;
         if (count < 0) {
            result = "Negative count";
            }
         else {
            result = "";
            for (; count > 0; count--) {
               result += operand_value[1];
               }
            resulttype = "t";
            }
         break;

      case "RIGHT":
         len = operand_type[2] ? operand_value[2]-0 : 1;
         if (len < 0) {
            result = "Negative length";
            }
         else {
            result = operand_value[1].slice(-len);
            resulttype = "t";
            }
         break;

      case "SUBSTITUTE":
         fulltext = operand_value[1];
         oldtext = operand_value[2];
         newtext = operand_value[3];
         if (operand_value[4] != null) {
            which = operand_value[4]-0;
            if (which <= 0) {
               result = "Non-positive instance number";
               break;
               }
            }
         else {
            which = 0;
            }
         count = 0;
         oldpos = 0;
         result = "";
         while (true) {
            pos = fulltext.indexOf(oldtext, oldpos);
            if (pos >= 0) {
               count++; //!!!!!! old test just in case: if (count>1000) {alert(pos); break;}
               result += fulltext.substring(oldpos, pos);
               if (which==0) {
                  result += newtext; // substitute
                  }
               else if (which==count) {
                  result += newtext + fulltext.substring(pos+oldtext.length);
                  break;
                  }
               else {
                  result += oldtext; // leave as was
                  }
               oldpos = pos + oldtext.length;
               }
            else { // no more
               result += fulltext.substring(oldpos);
               break;
               }
            }
         resulttype = "t";
         break;

      case "TRIM":
         result = operand_value[1];
         result = result.replace(/^ */, "");
         result = result.replace(/ *$/, "");
         result = result.replace(/ +/g, " ");
         resulttype = "t";
         break;

      case "HEXCODE":
         result = String(operand_value[1]);
         var code = result.charCodeAt(0);
         if (0xD800 <= code && code <= 0xDBFF) {
             var next = result.charCodeAt(1);
             if (0xDC00 <= next && next <= 0xDFFF) {
                 code = ((code - 0xD800) * 0x400) + (next - 0xDC00) + 0x10000;
             }
         }
         result = code.toString(16).toUpperCase();
         resulttype = "t";
         break;

      case "UPPER":
         result = operand_value[1].toUpperCase();
         resulttype = "t";
         break;

      }

   scf.PushOperand(operand, resulttype, result);
   return;

   }

SocialCalc.Formula.FunctionList["FIND"] = [SocialCalc.Formula.StringFunctions, -2, "find", "", "text"];
SocialCalc.Formula.FunctionList["LEFT"] = [SocialCalc.Formula.StringFunctions, -2, "tc", "", "text"];
SocialCalc.Formula.FunctionList["LEN"] = [SocialCalc.Formula.StringFunctions, 1, "txt", "", "text"];
SocialCalc.Formula.FunctionList["LOWER"] = [SocialCalc.Formula.StringFunctions, 1, "txt", "", "text"];
SocialCalc.Formula.FunctionList["MID"] = [SocialCalc.Formula.StringFunctions, 3, "mid", "", "text"];
SocialCalc.Formula.FunctionList["PROPER"] = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList["REPLACE"] = [SocialCalc.Formula.StringFunctions, 4, "replace", "", "text"];
SocialCalc.Formula.FunctionList["REPT"] = [SocialCalc.Formula.StringFunctions, 2, "tc", "", "text"];
SocialCalc.Formula.FunctionList["RIGHT"] = [SocialCalc.Formula.StringFunctions, -1, "tc", "", "text"];
SocialCalc.Formula.FunctionList["SUBSTITUTE"] = [SocialCalc.Formula.StringFunctions, -3, "subs", "", "text"];
SocialCalc.Formula.FunctionList["TRIM"] = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList["HEXCODE"] = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList["UPPER"] = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];

/*
#
# is_functions:
#
# ISBLANK(value)
# ISERR(value)
# ISERROR(value)
# ISLOGICAL(value)
# ISNA(value)
# ISNONTEXT(value)
# ISNUMBER(value)
# ISTEXT(value)
#
*/

SocialCalc.Formula.IsFunctions = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "nl";

   var value = scf.OperandValueAndType(sheet, foperand);
   var t = value.type.charAt(0);

   switch (fname) {

      case "ISBLANK":
         result = value.type == "b" ? 1 : 0;
         break;

      case "ISERR":
         result = t == "e" ? (value.type == "e#N/A" ? 0 : 1) : 0;
         break;

      case "ISERROR":
         result = t == "e" ? 1 : 0;
         break;

      case "ISLOGICAL":
         result = value.type == "nl" ? 1 : 0;
         break;

      case "ISNA":
         result = value.type == "e#N/A" ? 1 : 0;
         break;

      case "ISNONTEXT":
         result = t == "t" ? 0 : 1;
         break;

      case "ISNUMBER":
         result = t == "n" ? 1 : 0;
         break;

      case "ISTEXT":
         result = t == "t" ? 1 : 0;
         break;
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["ISBLANK"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISERR"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISERROR"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISLOGICAL"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISNA"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISNONTEXT"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISNUMBER"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList["ISTEXT"] = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];

/*
#
# ntv_functions:
#
# N(value)
# T(value)
# VALUE(value)
#
*/

SocialCalc.Formula.NTVFunctions = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "e#VALUE!";

   var value = scf.OperandValueAndType(sheet, foperand);
   var t = value.type.charAt(0);

   switch (fname) {

      case "N":
         result = t == "n" ? value.value-0 : 0;
         resulttype = "n";
         break;

      case "T":
         result = t == "t" ? value.value+"" : "";
         resulttype = "t";
         break;

      case "VALUE":
         if (t == "n" || t == "b") {
            result = value.value || 0;
            resulttype = "n";
            }
         else if (t == "t") {
            value = SocialCalc.DetermineValueType(value.value);
            if (value.type.charAt(0) != "n") {
               result = 0;
               resulttype = "e#VALUE!";
               }
            else {
               result = value.value-0;
               resulttype = "n";
               }
            }
         break;
      }

   if (t == "e") { // error trumps
      resulttype = value.type;
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["N"] = [SocialCalc.Formula.NTVFunctions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["T"] = [SocialCalc.Formula.NTVFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList["VALUE"] = [SocialCalc.Formula.NTVFunctions, 1, "v", "", "text"];

/*
#
# ABS(value)
# ACOS(value)
# ASIN(value)
# ATAN(value)
# COS(value)
# DEGREES(value)
# EVEN(value)
# EXP(value)
# FACT(value)
# INT(value)
# LN(value)
# LOG10(value)
# ODD(value)
# RADIANS(value)
# SIN(value)
# SQRT(value)
# TAN(value)
#
*/

SocialCalc.Formula.Math1Functions = function(fname, operand, foperand, sheet) {

   var v1, value, f;
   var result = {};

   var scf = SocialCalc.Formula;

   v1 = scf.OperandAsNumber(sheet, foperand);
   value = v1.value;
   result.type = scf.LookupResultType(v1.type, v1.type, scf.TypeLookupTable.oneargnumeric);

   if (result.type == "n") {
      switch (fname) {
         case "ABS":
            value = Math.abs(value);
            break;

         case "ACOS":
            if (value >= -1 && value <= 1) {
               value = Math.acos(value);
               }
            else {
               result.type = "e#NUM!";
               }
            break;

         case "ASIN":
            if (value >= -1 && value <= 1) {
               value = Math.asin(value);
               }
            else {
               result.type = "e#NUM!";
               }
            break;

         case "ATAN":
            value = Math.atan(value);
            break;

         case "COS":
            value = Math.cos(value);
            break;

         case "DEGREES":
            value = value * 180/Math.PI;
            break;

         case "EVEN":
            value = value < 0 ? -value : value;
            if (value != Math.floor(value)) {
               value = Math.floor(value + 1) + (Math.floor(value + 1) % 2);
               }
            else { // integer
               value = value + (value % 2);
               }
            if (v1.value < 0) value = -value;
            break;

         case "EXP":
            value = Math.exp(value);
            break;

         case "FACT":
            f = 1;
            value = Math.floor(value);
            for (;value>0;value--) {
               f *= value;
               }
            value = f;
            break;

         case "INT":
            value = Math.floor(value); // spreadsheet INT is floor(), not int()
            break;

         case "LN":
            if (value <= 0) {
               result.type = "e#NUM!";
               result.error = SocialCalc.Constants.s_sheetfunclnarg;
               }
            value = Math.log(value);
            break;

         case "LOG10":
            if (value <= 0) {
               result.type = "e#NUM!";
               result.error = SocialCalc.Constants.s_sheetfunclog10arg;
               }
            value = Math.log(value)/Math.log(10);
            break;

         case "ODD":
            value = value < 0 ? -value : value;
            if (value != Math.floor(value)) {
               value = Math.floor(value + 1) + (1 - (Math.floor(value + 1) % 2));
               }
            else { // integer
               value = value + (1 - (value % 2));
               }
            if (v1.value < 0) value = -value;
            break;

         case "RADIANS":
            value = value * Math.PI/180;
            break;

         case "SIN":
            value = Math.sin(value);
            break;

         case "SQRT":
            if (value >= 0) {
               value = Math.sqrt(value);
               }
            else {
               result.type = "e#NUM!";
               }
            break;

         case "TAN":
            if (Math.cos(value) != 0) {
               value = Math.tan(value);
               }
            else {
               result.type = "e#NUM!";
               }
            break;
         }
      }

   result.value = value;
   operand.push(result);

   return null;

   }

// Add to function list
SocialCalc.Formula.FunctionList["ABS"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["ACOS"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["ASIN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["ATAN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["COS"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["DEGREES"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["EVEN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["EXP"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["FACT"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["INT"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["LN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["LOG10"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["ODD"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["RADIANS"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["SIN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["SQRT"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList["TAN"] = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];


/*
#
# ATAN2(x, y)
# MOD(a, b)
# POWER(a, b)
# TRUNC(value, precision)
#
*/

SocialCalc.Formula.Math2Functions = function(fname, operand, foperand, sheet) {

   var xval, yval, value, quotient, decimalscale, i;
   var result = {};

   var scf = SocialCalc.Formula;

   xval = scf.OperandAsNumber(sheet, foperand);
   yval = scf.OperandAsNumber(sheet, foperand);
   value = 0;
   result.type = scf.LookupResultType(xval.type, yval.type, scf.TypeLookupTable.twoargnumeric);

   if (result.type == "n") {
      switch (fname) {
         case "ATAN2":
            if (xval.value == 0 && yval.value == 0) {
               result.type = "e#DIV/0!";
               }
            else {
               result.value = Math.atan2(yval.value, xval.value);
               }
            break;

         case "POWER":
            result.value = Math.pow(xval.value, yval.value);
            if (isNaN(result.value)) {
               result.value = 0;
               result.type = "e#NUM!";
               }
            break;

         case "MOD": // en.wikipedia.org/wiki/Modulo_operation, etc.
            if (yval.value == 0) {
               result.type = "e#DIV/0!";
               }
            else {
               quotient = xval.value/yval.value;
               quotient = Math.floor(quotient);
               result.value = xval.value - (quotient * yval.value);
               }
            break;

         case "TRUNC":
            decimalscale = 1; // cut down to required number of decimal digits
            if (yval.value >= 0) {
               yval.value = Math.floor(yval.value);
               for (i=0; i<yval.value; i++) {
                  decimalscale *= 10;
                  }
               result.value = Math.floor(Math.abs(xval.value) * decimalscale) / decimalscale;
               }
            else if (yval.value < 0) {
               yval.value = Math.floor(-yval.value);
               for (i=0; i<yval.value; i++) {
                  decimalscale *= 10;
                  }
               result.value = Math.floor(Math.abs(xval.value) / decimalscale) * decimalscale;
               }
            if (xval.value < 0) {
               result.value = -result.value;
               }
            }
         }
 
   operand.push(result);

   return null;

   }

// Add to function list
SocialCalc.Formula.FunctionList["ATAN2"] = [SocialCalc.Formula.Math2Functions, 2, "xy", "", "math"];
SocialCalc.Formula.FunctionList["MOD"] = [SocialCalc.Formula.Math2Functions, 2, "", "", "math"];
SocialCalc.Formula.FunctionList["POWER"] = [SocialCalc.Formula.Math2Functions, 2, "", "", "math"];
SocialCalc.Formula.FunctionList["TRUNC"] = [SocialCalc.Formula.Math2Functions, 2, "valpre", "", "math"];

/*
#
# LOG(value,[base])
#
*/

SocialCalc.Formula.LogFunction = function(fname, operand, foperand, sheet) {

   var value, value2;
   var result = {};

   var scf = SocialCalc.Formula;

   result.value = 0;

   value = scf.OperandAsNumber(sheet, foperand);
   result.type = scf.LookupResultType(value.type, value.type, scf.TypeLookupTable.oneargnumeric);
   if (foperand.length == 1) {
      value2 = scf.OperandAsNumber(sheet, foperand);
      if (value2.type.charAt(0) != "n" || value2.value <= 0) {
         scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfunclogsecondarg);
         return 0;
         }
      }
   else if (foperand.length != 0) {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }
   else {
      value2 = {value: Math.E, type: "n"};
      }

   if (result.type == "n") {
      if (value.value <= 0) {
         scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfunclogfirstarg);
         return 0;
         }
      result.value = Math.log(value.value)/Math.log(value2.value);
      }

   operand.push(result);

   return;

   }

SocialCalc.Formula.FunctionList["LOG"] = [SocialCalc.Formula.LogFunction, -1, "log", "", "math"];


/*
#
# ROUND(value,[precision])
#
*/

SocialCalc.Formula.RoundFunction = function(fname, operand, foperand, sheet) {

   var value2, decimalscale, scaledvalue, i;

   var scf = SocialCalc.Formula;
   var result = 0;
   var resulttype = "e#VALUE!";

   var value = scf.OperandValueAndType(sheet, foperand);
   var resulttype = scf.LookupResultType(value.type, value.type, scf.TypeLookupTable.oneargnumeric);

   if (foperand.length == 1) {
      value2 = scf.OperandValueAndType(sheet, foperand);
      if (value2.type.charAt(0) != "n") {
         scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfuncroundsecondarg);
         return 0;
         }
      }
   else if (foperand.length != 0) {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }
   else {
      value2 = {value: 0, type: "n"}; // if no second arg, assume 0 for simple round
      }

   if (resulttype == "n") {
      value2.value = value2.value-0;
      if (value2.value == 0) {
         result = Math.round(value.value);
         }
      else if (value2.value > 0) {
         decimalscale = 1; // cut down to required number of decimal digits
         value2.value = Math.floor(value2.value);
         for (i=0; i<value2.value; i++) {
            decimalscale *= 10;
            }
         scaledvalue = Math.round(value.value * decimalscale);
         result = scaledvalue / decimalscale;
         }
      else if (value2.value < 0) {
         decimalscale = 1; // cut down to required number of decimal digits
         value2.value = Math.floor(-value2.value);
         for (i=0; i<value2.value; i++) {
            decimalscale *= 10;
            }
         scaledvalue = Math.round(value.value / decimalscale);
         result = scaledvalue * decimalscale;
         }
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["ROUND"] = [SocialCalc.Formula.RoundFunction, -1, "vp", "", "math"];

/*
#
# CEILING(value, [significance])
# FLOOR(value, [significance])
#
*/

SocialCalc.Formula.CeilingFloorFunctions = function(fname, operand, foperand, sheet) {

   var scf = SocialCalc.Formula;
   var val, sig, t;

   var PushOperand = function(t, v) {operand.push({type: t, value: v});};

   val = scf.OperandValueAndType(sheet, foperand);
   t = val.type.charAt(0);
   if (t != "n") {
      PushOperand("e#VALUE!", 0);
      return;
      }
   if (val.value == 0) {
      PushOperand("n", 0);
      return;
      }

   if (foperand.length == 1) {
      sig = scf.OperandValueAndType(sheet, foperand);
      t = val.type.charAt(0);
      if (t != "n") {
         PushOperand("e#VALUE!", 0);
         return;
         }
      }
   else if (foperand.length == 0) {
      sig = {type: "n", value: val.value > 0 ? 1 : -1};
      }
   else {
      PushOperand("e#VALUE!", 0);
      return;
      }
   if (sig.value == 0) {
      PushOperand("n", 0);
      return;
      }
   if (sig.value * val.value < 0) {
      PushOperand("e#NUM!", 0);
      return;
      }

   switch (fname) {
      case "CEILING":
         PushOperand("n", Math.ceil(val.value / sig.value) * sig.value);
         break;
      case "FLOOR":
         PushOperand("n", Math.floor(val.value / sig.value) * sig.value);
         break;
      }

   return;

   }

SocialCalc.Formula.FunctionList["CEILING"] = [SocialCalc.Formula.CeilingFloorFunctions, -1, "vsig", "", "math"];
SocialCalc.Formula.FunctionList["FLOOR"] = [SocialCalc.Formula.CeilingFloorFunctions, -1, "vsig", "", "math"];

/*
#
# AND(v1,c1:c2,...)
# OR(v1,c1:c2,...)
#
*/

SocialCalc.Formula.AndOrFunctions = function(fname, operand, foperand, sheet) {

   var value1, result;

   var scf = SocialCalc.Formula;
   var resulttype = "";

   if (fname == "AND") {
      result = 1;
      }
   else if (fname == "OR") {
      result = 0;
      }

   while (foperand.length) {
      value1 = scf.OperandValueAndType(sheet, foperand);
      if (value1.type.charAt(0) == "n") {
         value1.value = value1.value-0;
         if (fname == "AND") {
            result = value1.value != 0 ? result : 0;
            }
         else if (fname == "OR") {
            result = value1.value != 0 ? 1 : result;
            }
         resulttype = scf.LookupResultType(value1.type, resulttype || "nl", scf.TypeLookupTable.propagateerror);
         }
      else if (value1.type.charAt(0) == "e" && resulttype.charAt(0) != "e") {
         resulttype = value1.type;
         }
      }
   if (resulttype.length < 1) {
      resulttype = "e#VALUE!";
      result = 0;
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["AND"] = [SocialCalc.Formula.AndOrFunctions, -1, "vn", "", "test"];
SocialCalc.Formula.FunctionList["OR"] = [SocialCalc.Formula.AndOrFunctions, -1, "vn", "", "test"];

/*
#
# NOT(value)
#
*/

SocialCalc.Formula.NotFunction = function(fname, operand, foperand, sheet) {

   var result = 0;
   var scf = SocialCalc.Formula;
   var value = scf.OperandValueAndType(sheet, foperand);
   var resulttype = scf.LookupResultType(value.type, value.type, scf.TypeLookupTable.propagateerror);

   if (value.type.charAt(0) == "n" || value.type == "b") {
      result = value.value-0 != 0 ? 0 : 1; // do the "not" operation
      resulttype = "nl";
      }
   else if (value.type.charAt(0) == "t") {
      resulttype = "e#VALUE!";
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["NOT"] = [SocialCalc.Formula.NotFunction, 1, "v", "", "test"];

/*
#
# CHOOSE(index,value1,value2,...)
#
*/

SocialCalc.Formula.ChooseFunction = function(fname, operand, foperand, sheet) {

   var resulttype, count, value1;
   var result = 0;
   var scf = SocialCalc.Formula;

   var cindex = scf.OperandAsNumber(sheet, foperand);

   if (cindex.type.charAt(0) != "n") {
      cindex.value = 0;
      }
   cindex.value = Math.floor(cindex.value);

   count = 0;
   while (foperand.length) {
      value1 = scf.TopOfStackValueAndType(sheet, foperand);
      count += 1;
      if (cindex.value == count) {
         result = value1.value;
         resulttype = value1.type;
         break;
         }
      }
   if (resulttype) { // found something
      scf.PushOperand(operand, resulttype, result);
      }
   else {
      scf.PushOperand(operand, "e#VALUE!", 0);
      }

   return;

   }

SocialCalc.Formula.FunctionList["CHOOSE"] = [SocialCalc.Formula.ChooseFunction, -2, "choose", "", "lookup"];

/*
#
# COLUMNS(c1:c2)
# ROWS(c1:c2)
#
*/

SocialCalc.Formula.ColumnsRowsFunctions = function(fname, operand, foperand, sheet) {

   var resulttype, rangeinfo;
   var result = 0;
   var scf = SocialCalc.Formula;

   var value1 = scf.TopOfStackValueAndType(sheet, foperand);

   if (value1.type == "coord") {
      result = 1;
      resulttype = "n";
      }

   else if (value1.type == "range") {
      rangeinfo = scf.DecodeRangeParts(sheet, value1.value);
      if (fname == "COLUMNS") {
         result = rangeinfo.ncols;
         }
      else if (fname == "ROWS") {
         result = rangeinfo.nrows;
         }
      resulttype = "n";
      }
   else {
      result = 0;
      resulttype = "e#VALUE!";
      }

   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["COLUMNS"] = [SocialCalc.Formula.ColumnsRowsFunctions, 1, "range", "", "lookup"];
SocialCalc.Formula.FunctionList["ROWS"] = [SocialCalc.Formula.ColumnsRowsFunctions, 1, "range", "", "lookup"];


/*
#
# FALSE()
# NA()
# NOW()
# PI()
# TODAY()
# TRUE()
#
*/

SocialCalc.Formula.ZeroArgFunctions = function(fname, operand, foperand, sheet) {

   var startval, tzoffset, start_1_1_1970, seconds_in_a_day, nowdays;
   var result = {value: 0};

   switch (fname) {
      case "FALSE":
         result.type = "nl";
         result.value = 0;
         break;

      case "NA":
         result.type = "e#N/A";
         break;

      case "NOW":
         startval = new Date();
         tzoffset = startval.getTimezoneOffset();
         startval = startval.getTime() / 1000; // convert to seconds
         start_1_1_1970 = 25569; // Day number of 1/1/1970 starting with 1/1/1900 as 1
         seconds_in_a_day = 24 * 60 * 60;
         nowdays = start_1_1_1970 + startval / seconds_in_a_day - tzoffset/(24*60);
         result.value = nowdays;
         result.type = "ndt";
         SocialCalc.Formula.FreshnessInfo.volatile.NOW = true; // remember
         break;

      case "PI":
         result.type = "n";
         result.value = Math.PI;
         break;

      case "TODAY":
         startval = new Date();
         tzoffset = startval.getTimezoneOffset();
         startval = startval.getTime() / 1000; // convert to seconds
         start_1_1_1970 = 25569; // Day number of 1/1/1970 starting with 1/1/1900 as 1
         seconds_in_a_day = 24 * 60 * 60;
         nowdays = start_1_1_1970 + startval / seconds_in_a_day - tzoffset/(24*60);
         result.value = Math.floor(nowdays);
         result.type = "nd";
         SocialCalc.Formula.FreshnessInfo.volatile.TODAY = true; // remember
         break;

      case "TRUE":
         result.type = "nl";
         result.value = 1;
         break;

      }

   operand.push(result);

   return null;

}

// Add to function list
SocialCalc.Formula.FunctionList["FALSE"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test"];
SocialCalc.Formula.FunctionList["NA"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test"];
SocialCalc.Formula.FunctionList["NOW"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "datetime"];
SocialCalc.Formula.FunctionList["PI"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "math"];
SocialCalc.Formula.FunctionList["TODAY"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "datetime"];
SocialCalc.Formula.FunctionList["TRUE"] = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test"];

//
// * * * * * FINANCIAL FUNCTIONS * * * * *
//

/*
#
# DDB(cost,salvage,lifetime,period,[method])
#
# Depreciation, method defaults to 2 for double-declining balance
# See: http://en.wikipedia.org/wiki/Depreciation
#
*/

SocialCalc.Formula.DDBFunction = function(fname, operand, foperand, sheet) {

   var method, depreciation, accumulateddepreciation, i;
   var scf = SocialCalc.Formula;

   var cost = scf.OperandAsNumber(sheet, foperand);
   var salvage = scf.OperandAsNumber(sheet, foperand);
   var lifetime = scf.OperandAsNumber(sheet, foperand);
   var period = scf.OperandAsNumber(sheet, foperand);

   if (scf.CheckForErrorValue(operand, cost)) return;
   if (scf.CheckForErrorValue(operand, salvage)) return;
   if (scf.CheckForErrorValue(operand, lifetime)) return;
   if (scf.CheckForErrorValue(operand, period)) return;

   if (lifetime.value < 1) {
      scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfuncddblife);
      return 0;
      }

   method = {value: 2, type: "n"};
   if (foperand.length > 0 ) {
      method = scf.OperandAsNumber(sheet, foperand);
      }
   if (foperand.length != 0) {
      scf.FunctionArgsError(fname, operand);
      return 0;
      }
   if (scf.CheckForErrorValue(operand, method)) return;

   depreciation = 0; // calculated for each period
   accumulateddepreciation = 0; // accumulated by adding each period's

   for (i=1; i<=period.value-0 && i<=lifetime.value; i++) { // calculate for each period based on net from previous
      depreciation = (cost.value - accumulateddepreciation) * (method.value / lifetime.value);
      if (cost.value - accumulateddepreciation - depreciation < salvage.value) { // don't go lower than salvage value
         depreciation = cost.value - accumulateddepreciation - salvage.value;
         }
      accumulateddepreciation += depreciation;
      }

   scf.PushOperand(operand, 'n$', depreciation);

   return;

   }

SocialCalc.Formula.FunctionList["DDB"] = [SocialCalc.Formula.DDBFunction, -4, "ddb", "", "financial"];

/*
#
# SLN(cost,salvage,lifetime)
#
# Depreciation for each period by straight-line method
# See: http://en.wikipedia.org/wiki/Depreciation
#
*/

SocialCalc.Formula.SLNFunction = function(fname, operand, foperand, sheet) {

   var depreciation;
   var scf = SocialCalc.Formula;

   var cost = scf.OperandAsNumber(sheet, foperand);
   var salvage = scf.OperandAsNumber(sheet, foperand);
   var lifetime = scf.OperandAsNumber(sheet, foperand);

   if (scf.CheckForErrorValue(operand, cost)) return;
   if (scf.CheckForErrorValue(operand, salvage)) return;
   if (scf.CheckForErrorValue(operand, lifetime)) return;

   if (lifetime.value < 1) {
      scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfuncslnlife);
      return 0;
      }

   depreciation = (cost.value - salvage.value) / lifetime.value;

   scf.PushOperand(operand, 'n$', depreciation);

   return;

   }

SocialCalc.Formula.FunctionList["SLN"] = [SocialCalc.Formula.SLNFunction, 3, "csl", "", "financial"];

/*
#
# SYD(cost,salvage,lifetime,period)
#
# Depreciation by Sum of Year's Digits method
#
*/

SocialCalc.Formula.SYDFunction = function(fname, operand, foperand, sheet) {

   var depreciation, sumperiods;
   var scf = SocialCalc.Formula;

   var cost = scf.OperandAsNumber(sheet, foperand);
   var salvage = scf.OperandAsNumber(sheet, foperand);
   var lifetime = scf.OperandAsNumber(sheet, foperand);
   var period = scf.OperandAsNumber(sheet, foperand);

   if (scf.CheckForErrorValue(operand, cost)) return;
   if (scf.CheckForErrorValue(operand, salvage)) return;
   if (scf.CheckForErrorValue(operand, lifetime)) return;
   if (scf.CheckForErrorValue(operand, period)) return;

   if (lifetime.value < 1 || period.value <= 0) {
      scf.PushOperand(operand, "e#NUM!", 0);
      return 0;
      }

   sumperiods = ((lifetime.value + 1) * lifetime.value)/2; // add up 1 through lifetime
   depreciation = (cost.value - salvage.value) * (lifetime.value - period.value + 1) / sumperiods; // calc depreciation

   scf.PushOperand(operand, 'n$', depreciation);

   return;

   }

SocialCalc.Formula.FunctionList["SYD"] = [SocialCalc.Formula.SYDFunction, 4, "cslp", "", "financial"];

/*
#
# FV(rate, n, payment, [pv, [paytype]])
# NPER(rate, payment, pv, [fv, [paytype]])
# PMT(rate, n, pv, [fv, [paytype]])
# PV(rate, n, payment, [fv, [paytype]])
# RATE(n, payment, pv, [fv, [paytype, [guess]]])
#
# Following the Open Document Format formula specification:
#
#    PV = - Fv - (Payment * Nper) [if rate equals 0]
#    Pv*(1+Rate)^Nper + Payment * (1 + Rate*PaymentType) * ( (1+Rate)^nper -1)/Rate + Fv = 0
#
# For each function, the formulas are solved for the appropriate value (transformed using
# basic algebra).
#
*/

SocialCalc.Formula.InterestFunctions = function(fname, operand, foperand, sheet) {

   var resulttype, result, dval, eval, fval;
   var pv, fv, rate, n, payment, paytype, guess, part1, part2, part3, part4, part5;
   var olddelta, maxloop, tries, deltaepsilon, rate, oldrate, m;

   var scf = SocialCalc.Formula;

   var aval = scf.OperandAsNumber(sheet, foperand);
   var bval = scf.OperandAsNumber(sheet, foperand);
   var cval = scf.OperandAsNumber(sheet, foperand);

   resulttype = scf.LookupResultType(aval.type, bval.type, scf.TypeLookupTable.twoargnumeric);
   resulttype = scf.LookupResultType(resulttype, cval.type, scf.TypeLookupTable.twoargnumeric);
   if (foperand.length) { // optional arguments
      dval = scf.OperandAsNumber(sheet, foperand);
      resulttype = scf.LookupResultType(resulttype, dval.type, scf.TypeLookupTable.twoargnumeric);
      if (foperand.length) { // optional arguments
         eval = scf.OperandAsNumber(sheet, foperand);
         resulttype = scf.LookupResultType(resulttype, eval.type, scf.TypeLookupTable.twoargnumeric);
         if (foperand.length) { // optional arguments
            if (fname != "RATE") { // only rate has 6 possible args
               scf.FunctionArgsError(fname, operand);
               return 0;
               }
            fval = scf.OperandAsNumber(sheet, foperand);
            resulttype = scf.LookupResultType(resulttype, fval.type, scf.TypeLookupTable.twoargnumeric);
            }
         }
      }

   if (resulttype == "n") {
      switch (fname) {
         case "FV": // FV(rate, n, payment, [pv, [paytype]])
            rate = aval.value;
            n = bval.value;
            payment = cval.value;
            pv = dval!=null ? dval.value : 0; // get value if present, or use default
            paytype = eval!=null ? (eval.value ? 1 : 0) : 0;
            if (rate == 0) { // simple calculation if no interest
               fv = -pv - (payment * n);
               }
            else {
               fv = -(pv*Math.pow(1+rate,n) + payment * (1 + rate*paytype) * ( Math.pow(1+rate,n) -1)/rate);
               }
            result = fv;
            resulttype = 'n$';
            break;

         case "NPER": // NPER(rate, payment, pv, [fv, [paytype]])
            rate = aval.value;
            payment = bval.value;
            pv = cval.value;
            fv = dval!=null ? dval.value : 0;
            paytype = eval!=null ? (eval.value ? 1 : 0) : 0;
            if (rate == 0) { // simple calculation if no interest
               if (payment == 0) {
                  scf.PushOperand(operand, "e#NUM!", 0);
                  return;
                  }
               n = (pv + fv)/(-payment);
               }
            else {
               part1 = payment * (1 + rate * paytype) / rate;
               part2 = pv + part1;
               if (part2 == 0 || rate <= -1) {
                  scf.PushOperand(operand, "e#NUM!", 0);
                  return;
                  }
               part3 = (part1 - fv) / part2;
               if (part3 <= 0) {
                  scf.PushOperand(operand, "e#NUM!", 0);
                  return;
                  }
               part4 = Math.log(part3);
               part5 = Math.log(1 + rate); // rate > -1
               n = part4/part5;
               }
            result = n;
            resulttype = 'n';
            break;

         case "PMT": // PMT(rate, n, pv, [fv, [paytype]])
            rate = aval.value;
            n = bval.value;
            pv = cval.value;
            fv = dval!=null ? dval.value : 0;
            paytype = eval!=null ? (eval.value ? 1 : 0) : 0;
            if (n == 0) {
               scf.PushOperand(operand, "e#NUM!", 0);
               return;
               }
            else if (rate == 0) { // simple calculation if no interest
               payment = (fv - pv)/n;
               }
            else {
               payment = (0 - fv - pv*Math.pow(1+rate,n))/((1 + rate*paytype) * ( Math.pow(1+rate,n) -1)/rate);
               }
            result = payment;
            resulttype = 'n$';
            break;

         case "PV": // PV(rate, n, payment, [fv, [paytype]])
            rate = aval.value;
            n = bval.value;
            payment = cval.value;
            fv = dval!=null ? dval.value : 0;
            paytype = eval!=null ? (eval.value ? 1 : 0) : 0;
            if (rate == -1) {
               scf.PushOperand(operand, "e#DIV/0!", 0);
               return;
               }
            else if (rate == 0) { // simple calculation if no interest
               pv = -fv - (payment * n);
               }
            else {
               pv = (-fv - payment * (1 + rate*paytype) * ( Math.pow(1+rate,n) -1)/rate)/(Math.pow(1+rate,n));
               }
            result = pv;
            resulttype = 'n$';
            break;

            case "RATE": // RATE(n, payment, pv, [fv, [paytype, [guess]]])
               n = aval.value;
               payment = bval.value;
               pv = cval.value;
               fv = dval!=null ? dval.value : 0;
               paytype = eval!=null ? (eval.value ? 1 : 0) : 0;
               guess = fval!=null ? fval.value : 0.1;

               // rate is calculated by repeated approximations
               // The deltas are used to calculate new guesses

               maxloop = 100;
               tries = 0;
               delta = 1;
               epsilon = 0.0000001; // this is close enough
               rate = guess || 0.00000001; // zero is not allowed
               while ((delta >= 0 ? delta : -delta) > epsilon && (rate != oldrate)) {
                  delta = fv + pv*Math.pow(1+rate,n) + payment * (1 + rate*paytype) * ( Math.pow(1+rate,n) -1)/rate;
                  if (olddelta!=null) {
                     m = (delta - olddelta)/(rate - oldrate) || .001; // get slope (not zero)
                     oldrate = rate;
                     rate = rate - delta / m; // look for zero crossing
                     olddelta = delta;
                     }
                  else { // first time - no old values
                     oldrate = rate;
                     rate = 1.1 * rate;
                     olddelta = delta;
                     }
                  tries++;
                  if (tries >= maxloop) { // didn't converge yet
                     scf.PushOperand(operand, "e#NUM!", 0);
                     return;
                     }
                  }
               result = rate;
               resulttype = 'n%';
               break;
         }
      }
 
   scf.PushOperand(operand, resulttype, result);

   return;

   }

SocialCalc.Formula.FunctionList["FV"] = [SocialCalc.Formula.InterestFunctions, -3, "fv", "", "financial"];
SocialCalc.Formula.FunctionList["NPER"] = [SocialCalc.Formula.InterestFunctions, -3, "nper", "", "financial"];
SocialCalc.Formula.FunctionList["PMT"] = [SocialCalc.Formula.InterestFunctions, -3, "pmt", "", "financial"];
SocialCalc.Formula.FunctionList["PV"] = [SocialCalc.Formula.InterestFunctions, -3, "pv", "", "financial"];
SocialCalc.Formula.FunctionList["RATE"] = [SocialCalc.Formula.InterestFunctions, -3, "rate", "", "financial"];

/*
#
# NPV(rate,v1,v2,c1:c2,...)
#
*/

SocialCalc.Formula.NPVFunction = function(fname, operand, foperand, sheet) {

   var resulttypenpv, rate, sum, factor, value1;

   var scf = SocialCalc.Formula;

   var rate = scf.OperandAsNumber(sheet, foperand);
   if (scf.CheckForErrorValue(operand, rate)) return;

   sum = 0;
   resulttypenpv = "n";
   factor = 1;

   while (foperand.length) {
      value1 = scf.OperandValueAndType(sheet, foperand);
      if (value1.type.charAt(0) == "n") {
         factor *= (1 + rate.value);
         if (factor == 0) {
            scf.PushOperand(operand, "e#DIV/0!", 0);
            return;
            }
         sum += value1.value / factor;
         resulttypenpv = scf.LookupResultType(value1.type, resulttypenpv || value1.type, scf.TypeLookupTable.plus);
         }
      else if (value1.type.charAt(0) == "e" && resulttypenpv.charAt(0) != "e") {
         resulttypenpv = value1.type;
         break;
         }
      }

   if (resulttypenpv.charAt(0) == "n") {
      resulttypenpv = 'n$';
      }

   scf.PushOperand(operand, resulttypenpv, sum);

   return;

   }

SocialCalc.Formula.FunctionList["NPV"] = [SocialCalc.Formula.NPVFunction, -2, "npv", "", "financial"];

/*
#
# IRR(c1:c2,[guess])
#
*/

SocialCalc.Formula.IRRFunction = function(fname, operand, foperand, sheet) {

   var value1, guess, oldsum, maxloop, tries, epsilon, rate, oldrate, m, sum, factor, i;
   var rangeoperand = [];
   var cashflows = [];

   var scf = SocialCalc.Formula;

   rangeoperand.push(foperand.pop()); // first operand is a range

   while (rangeoperand.length) { // get values from range so we can do iterative approximations
      value1 = scf.OperandValueAndType(sheet, rangeoperand);
      if (value1.type.charAt(0) == "n") {
         cashflows.push(value1.value);
         }
      else if (value1.type.charAt(0) == "e") {
         scf.PushOperand(operand, "e#VALUE!", 0);
         return;
         }
      }

   if (!cashflows.length) {
      scf.PushOperand(operand, "e#NUM!", 0);
      return;
      }

   guess = {value: 0};

   if (foperand.length) { // guess is provided
      guess = scf.OperandAsNumber(sheet, foperand);
      if (guess.type.charAt(0) != "n" && guess.type.charAt(0) != "b") {
         scf.PushOperand(operand, "e#VALUE!", 0);
         return;
         }
      if (foperand.length) { // should be no more args
         scf.FunctionArgsError(fname, operand);
         return;
         }
      }

   guess.value = guess.value || 0.1;

   // rate is calculated by repeated approximations
   // The deltas are used to calculate new guesses

   maxloop = 20;
   tries = 0;
   epsilon = 0.0000001; // this is close enough
   rate = guess.value;
   sum = 1;

   while ((sum >= 0 ? sum : -sum) > epsilon && (rate != oldrate)) {
      sum = 0;
      factor = 1;
      for (i=0; i<cashflows.length; i++) {
         factor *= (1 + rate);
         if (factor == 0) {
            scf.PushOperand(operand, "e#DIV/0!", 0);
            return;
            }
         sum += cashflows[i] / factor;
         }

      if (oldsum!=null) {
         m = (sum - oldsum)/(rate - oldrate); // get slope
         oldrate = rate;
         rate = rate - sum / m; // look for zero crossing
         oldsum = sum;
         }
      else { // first time - no old values
         oldrate = rate;
         rate = 1.1 * rate;
         oldsum = sum;
         }
      tries++;
      if (tries >= maxloop) { // didn't converge yet
         scf.PushOperand(operand, "e#NUM!", 0);
         return;
         }
      }

   scf.PushOperand(operand, 'n%', rate);

   return;

   }

SocialCalc.Formula.FunctionList["IRR"] = [SocialCalc.Formula.IRRFunction, -1, "irr", "", "financial"];

//
// SHEET CACHE
//

SocialCalc.Formula.SheetCache = {

   // Sheet data: Attributes are each sheet in the cache with values of an object with:
   //
   //    sheet: sheet-obj (or null, meaning not found)
   //    recalcstate: constants.asloaded = as loaded
   //                 constants.recalcing = being recalced now
   //                 constants.recalcdone = recalc done
   //    name: name of sheet (in case just have object and don't know name)
   //

   sheets: {},

   // Waiting for loading:
   // If sheet is not in cache, this is set to the sheetname being loaded
   // so it can be tested in the recalc loop to start load and then wait until restarted.
   // Reset to null before restarting.

   waitingForLoading: null,

   // Constants to use for setting sheets[*].recalcstate:

   constants: {asloaded: 0, recalcing: 1, recalcdone: 2},

   loadsheet: null // (deprecated - use SocialCalc.RecalcInfo.LoadSheet)

   };

//
// othersheet = SocialCalc.Formula.FindInSheetCache(sheetname)
//
// Returns a SocialCalc.Sheet object corresponding to string sheetname
// or null if the sheet is not available or in error.
//
// Each sheet is loaded only once and then stored in a cache.
// Loading is handled elsewhere, e.g., in the recalc loop.
//

SocialCalc.Formula.FindInSheetCache = function(sheetname) {

   var str;
   var sfsc = SocialCalc.Formula.SheetCache;

   var nsheetname = SocialCalc.Formula.NormalizeSheetName(sheetname); // normalize different versions

   if (sfsc.sheets[nsheetname]) { // a sheet by that name is in the cache already
      return sfsc.sheets[nsheetname].sheet; // return it
      }

   if (sfsc.waitingForLoading) { // waiting already - only queue up one
      return null; // return not found
      }

   if (sfsc.loadsheet) { // Deprecated old format synchronous callback
alert("Using SocialCalc.Formula.SheetCache.loadsheet - deprecated");
      return SocialCalc.Formula.AddSheetToCache(nsheetname, sfsc.loadsheet(nsheetname));
      }

   sfsc.waitingForLoading = nsheetname; // let recalc loop know that we have a sheet to load

   return null; // return not found

   }

//
// newsheet = SocialCalc.Formula.AddSheetToCache(sheetname, str, live)
//
// Adds a new sheet to the sheet cache.
// Returns the sheet object filled out with the str (a saved sheet).
//

SocialCalc.Formula.AddSheetToCache = function(sheetname, str, live) {

   var newsheet = null;
   var sfsc = SocialCalc.Formula.SheetCache;
   var sfscc = sfsc.constants;
   var newsheetname = SocialCalc.Formula.NormalizeSheetName(sheetname);

   if (str) {
      newsheet = new SocialCalc.Sheet();
      newsheet.ParseSheetSave(str);
      }

   sfsc.sheets[newsheetname] = {sheet: newsheet, recalcstate: sfscc.asloaded, name: newsheetname};

   SocialCalc.Formula.FreshnessInfo.sheets[newsheetname] = (typeof(live) == "undefined" || live === false);

   return newsheet;

   }

//
// nsheet = SocialCalc.Formula.NormalizeSheetName(sheetname)
//

SocialCalc.Formula.NormalizeSheetName = function(sheetname) {

   if (SocialCalc.Callbacks.NormalizeSheetName) {
      return SocialCalc.Callbacks.NormalizeSheetName(sheetname);
      }
   else {
      return sheetname.toLowerCase();
      }
   }

//
// REMOTE FUNCTION INFO
//

SocialCalc.Formula.RemoteFunctionInfo = {

   // Waiting for server:
   // If waiting for an XHR response from the server, this is set to some non-blank status text
   // so it can be tested in the recalc loop to start load and then wait until restarted.
   // Reset to null before restarting.

   waitingForServer: null

   };

//
// FRESHNESS INFO
//
// This information is generated during recalc.
// It may be used to help determine when the recalc data in a spreadsheet
// may be out of date.
// For example, it may be used to display a message like:
// "Dependent on sheet 'FOO' which was updated more recently than this printout"

SocialCalc.Formula.FreshnessInfo = {

   // For each external sheet referenced successfully an attribute of that name with value true to keep the sheet cached.
   // Value false means the sheet is reloaded at each recalc.

   sheets: {},

   // For each volatile function that is called an attribute of that name with value true.

   volatile: {},

   // Set to false when started and true when recalc completes

   recalc_completed: false

   };

SocialCalc.Formula.FreshnessInfoReset = function() {

   var scffi = SocialCalc.Formula.FreshnessInfo;
   var scfsc = SocialCalc.Formula.SheetCache;

   // Loop through sheets freshness, deleting cached sheets that should be reloaded.

   for (var sheet in scffi.sheets) {
      if (scffi.sheets[sheet] === false) {
         delete scfsc.sheets[sheet];
         }
      }
   
   // Reset freshness info.

   scffi.sheets = {};
   scffi.volatile = {};
   scffi.recalc_completed = false;

   }

//
// MISC ROUTINES
//

//
// result = SocialCalc.Formula.PlainCoord(coord)
//
// Returns: coord without any $'s
//

SocialCalc.Formula.PlainCoord = function(coord) {

   if (coord.indexOf("$") == -1) return coord;

   return coord.replace(/\$/g, ""); // remove any $'s

   }

//
// result = SocialCalc.Formula.OrderRangeParts(coord1, coord2)
//
// Returns: {c1: col, r1: row, c2: col, r2 = row} with c1/r1 upper left
//

SocialCalc.Formula.OrderRangeParts = function(coord1, coord2) {

   var cr1, cr2;
   var result = {};

   cr1 = SocialCalc.coordToCr(coord1);
   cr2 = SocialCalc.coordToCr(coord2);
   if (cr1.col > cr2.col) { result.c1 = cr2.col; result.c2 = cr1.col; }
   else { result.c1 = cr1.col; result.c2 = cr2.col; }
   if (cr1.row > cr2.row) { result.r1 = cr2.row; result.r2 = cr1.row; }
   else { result.r1 = cr1.row; result.r2 = cr2.row; }

   return result;

   }

//
// cond = SocialCalc.Formula.TestCriteria(value, type, criteria)
//
// Determines whether a value/type meets the criteria.
// A criteria can be a numeric value, text beginning with <, <=, =, >=, >, <>, text by itself is start of text to match.
// Used by a variety of functions, including the "D" functions (DSUM, etc.).
//
// Returns true or false
//

SocialCalc.Formula.TestCriteria = function(value, type, criteria) {

   var comparitor, basestring, basevalue, cond, testvalue;

   if (criteria == null) { // undefined (e.g., error value) is always false
      return false;
      }

   criteria = criteria + "";
   comparitor = criteria.charAt(0); // look for comparitor
   if (comparitor == "=" || comparitor == "<" || comparitor == ">") {
      basestring = criteria.substring(1);
      }
   else {
      comparitor = criteria.substring(0,2);
      if (comparitor == "<=" || comparitor == "<>" || comparitor == ">=") {
         basestring = criteria.substring(2);
         }
      else {
         comparitor = "none";
         basestring = criteria;
         }
      }

   basevalue = SocialCalc.DetermineValueType(basestring); // get type of value being compared
   if (!basevalue.type) { // no criteria base value given
      if (comparitor == "none") { // blank criteria matches nothing
         return false;
         }
      if (type.charAt(0) == "b") { // comparing to empty cell
         if (comparitor == "=") { // empty equals empty
            return true;
            }
         }
      else {
         if (comparitor == "<>") { // "something" does not equal empty
            return true;
            }
         }
      return false; // otherwise false
      }

   cond = false;

   if (basevalue.type.charAt(0) == "n" && type.charAt(0) == "t") { // criteria is number, but value is text
      testvalue = SocialCalc.DetermineValueType(value);
      if (testvalue.type.charAt(0) == "n") { // could be number - make it one
         value = testvalue.value;
         type = testvalue.type;
         }
      }

   if (type.charAt(0) == "n" && basevalue.type.charAt(0) == "n") { // compare two numbers
      value = value - 0; // make sure numbers
      basevalue.value = basevalue.value - 0;
      switch (comparitor) {
         case "<":
            cond = value < basevalue.value;
            break;

         case "<=":
            cond = value <= basevalue.value;
            break;

         case "=":
         case "none":
            cond = value == basevalue.value;
            break;

         case ">=":
            cond = value >= basevalue.value;
            break;

         case ">":
            cond = value > basevalue.value;
            break;

         case "<>":
            cond = value != basevalue.value;
            break;
         }
      }

   else if (type.charAt(0) == "e") { // error on left
      cond = false;
      }

   else if (basevalue.type.charAt(0) == "e") { // error on right
      cond = false;
      }

   else { // text, maybe mixed with number or blank
      if (type.charAt(0) == "n") {
         value = SocialCalc.format_number_for_display(value, "n", "");
         }
      if (basevalue.type.charAt(0) == "n") {
         return false; // if number and didn't match already, isn't a match
         }

      value = value ? value.toLowerCase() : "";
      basevalue.value = basevalue.value ? basevalue.value.toLowerCase() : "";

      switch (comparitor) {
         case "<":
            cond = value < basevalue.value;
            break;

         case "<=":
            cond = value <= basevalue.value;
            break;

         case "=":
            cond = value == basevalue.value;
            break;

         case "none":
            cond = value.substring(0, basevalue.value.length) == basevalue.value;
            break;

         case ">=":
            cond = value >= basevalue.value;
            break;

         case ">":
            cond = value > basevalue.value;
            break;

         case "<>":
            cond = value != basevalue.value;
            break;
         }
      }

   return cond;

   }
//
/*
// The module of the SocialCalc package for the optional popup menus in socialcalcspreadsheetcontrol.js
//
// (c) Copyright 2009 Socialtext, Inc.
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
//
*/

   var SocialCalc; // All values are stored in the master SocialCalc object
   if (!SocialCalc) {
      SocialCalc = {};
      }

   // The main Popup data -- there is only one set

   SocialCalc.Popup = {};

   // Routines and values for each type of control, indexed by type name
   // The value for each is an object constructed as follows:
   //
   //    Create = function(type, id, attribs)
   //    Initialize = function(type, id, data)
   //    SetValue = function(type, id, value)
   //    GetValue = function(type, id) returns value
   //    SetDisabled = function(type, id, t/f)
   //    Show = function(type, id)
   //    Hide = function(type, id)
   //    Cancel = function(type, id)
   //    Reset = function(type)
   //
   //    data = object to hold type-specific data
   //

   SocialCalc.Popup.Types = {};

   // Definitions for each individual control, indexed by id
   // The value for each is an object constructed as follows:
   //
   //    type: type name of the control
   //    value: current value of the control (usually a string, but can depend on type)
   //    data: object with type-specific items
   //

   SocialCalc.Popup.Controls = {};

   // System-wide values of currently active control
   //
   //    id: id of current control or null
   //

   SocialCalc.Popup.Current = {};

   // Override this for localization

   SocialCalc.Popup.LocalizeString = function(str) {return str;};


// * * * * * * * * * * * * * * * *
//
// GENERAL ROUTINES
//
// * * * * * * * * * * * * * * * *

//
// SocialCalc.Popup.Create(type, id, attribs)
//
// Creates a control of type "type" as the children of document element "id" using "attribs"
//

SocialCalc.Popup.Create = function(type, id, attribs) {

   var pt = SocialCalc.Popup.Types[type];
   if (pt && pt.Create) {
      pt.Create(type, id, attribs);
      }

   SocialCalc.Popup.imagePrefix = SocialCalc.Constants.defaultImagePrefix; // image prefix

   }


//
// SocialCalc.Popup.SetValue(id, value)
//
// Sets the value of control.
//

SocialCalc.Popup.SetValue = function(id, value) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!spc[id]) {alert("Unknown control "+id);return;}

   var type = spc[id].type;
   var pt = spt[type];
   var spcdata = spc[id].data;

   if (pt && pt.Create) {
      pt.SetValue(type, id, value);
      if (spcdata.attribs && spcdata.attribs.changedcallback) {
         spcdata.attribs.changedcallback(spcdata.attribs, id, value);
         }
      }

   }


//
// SocialCalc.Popup.SetDisabled(id, disabled)
//
// Sets whether the control is disabled (true) or not (false).
//

SocialCalc.Popup.SetDisabled = function(id, disabled) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!spc[id]) {alert("Unknown control "+id);return;}

   var type = spc[id].type;

   var pt = spt[type];
   if (pt && pt.Create) {
      if (sp.Current.id && id == sp.Current.id) {
         pt.Hide(type, sp.Current.id);
         sp.Current.id = null;
         }
      pt.SetDisabled(type, id, disabled);
      }

   }


//
// SocialCalc.Popup.GetValue(id)
//
// Returns the value of control.
//

SocialCalc.Popup.GetValue = function(id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!spc[id]) {alert("Unknown control "+id);return;}

   var type = spc[id].type;

   var pt = spt[type];
   if (pt && pt.Create) {
      return pt.GetValue(type, id);
      }

   return null;

   }


//
// SocialCalc.Popup.Initialize(id, data)
//
// Gives "data" to the appropriate initialization code.
//

SocialCalc.Popup.Initialize = function(id, data) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!spc[id]) {alert("Unknown control "+id);return;}

   var type = spc[id].type;

   var pt = spt[type];
   if (pt && pt.Initialize) {
      pt.Initialize(type, id, data);
      }

   }


//
// SocialCalc.Popup.Reset(type)
//
// Resets Popup, such as when turning to page.
//

SocialCalc.Popup.Reset = function(type) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (spt[type].Reset) spt[type].Reset(type);

   }


//
// SocialCalc.Popup.CClick(id)
//
// Should be called when the user clicks on a control to do the popup
//

SocialCalc.Popup.CClick = function(id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!spc[id]) {alert("Unknown control "+id);return;}

   if (spc[id].data && spc[id].data.disabled) return;

   var type = spc[id].type;

   var pt = spt[type];

   if (sp.Current.id) {
      spt[spc[sp.Current.id].type].Hide(type, sp.Current.id);
      if (id == sp.Current.id) { // same one - done
         sp.Current.id = null;
         return;
         }
      }

   if (pt && pt.Show) {
      pt.Show(type, id);
      }

   sp.Current.id = id;

   }


//
// SocialCalc.Popup.Close()
//
// Used to close any open popup.
//

SocialCalc.Popup.Close = function() {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!sp.Current.id) return;

   sp.CClick(sp.Current.id);

   }

//
// SocialCalc.Popup.Cancel()
//
// Closes Popup and restores old value
//

SocialCalc.Popup.Cancel = function() {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (!sp.Current.id) return;

   var type = spc[sp.Current.id].type;

   var pt = spt[type];

   pt.Cancel(type, sp.Current.id);

   sp.Current.id = null;

   }

//
// ele = SocialCalc.Popup.CreatePopupDiv(id, attribs)
//
// Utility function to create the main popup div of width attribs.width.
// If attribs.title, create one with that text, and optionally attribs.moveable.
//

SocialCalc.Popup.CreatePopupDiv = function(id, attribs) {

   var pos, ele;

   var sp = SocialCalc.Popup;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var main = document.createElement("div");
   main.style.position = "absolute";

   pos = SocialCalc.GetElementPosition(spcdata.mainele);

   main.style.top = (pos.top+spcdata.mainele.offsetHeight)+"px";
   main.style.left = pos.left+"px";
   main.style.zIndex = 100;
   main.style.backgroundColor = "#FFF";
   main.style.border = "1px solid black";

   if (attribs.width) {
      main.style.width = attribs.width;
      }

   spcdata.mainele.appendChild(main);

   if (attribs.title) {
      main.innerHTML = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr>'+
         '<td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">'+attribs.title+'</td>'+
         '<td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.Popup.Cancel();">&nbsp;X&nbsp;</td></tr></table>';

      if (attribs.moveable) {
         spcdata.dragregistered = main.firstChild.firstChild.firstChild.firstChild;
         SocialCalc.DragRegister(spcdata.dragregistered, true, true, 
                    {MouseDown: SocialCalc.DragFunctionStart, 
                     MouseMove: SocialCalc.DragFunctionPosition,
                     MouseUp: SocialCalc.DragFunctionPosition,
                     Disabled: null, positionobj: main},
                     spcdata.mainele);
         }
      }

   return main;

   }

//
// SocialCalc.Popup.EnsurePosition(id, container)
//
// Utility function to make sure popup is positioned completely within container (both element objects)
// and appropriate with respect to the main element controlling the popup.
//

SocialCalc.Popup.EnsurePosition = function(id, container) {

   var sp = SocialCalc.Popup;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var main = spcdata.mainele.firstChild;
   if (!main) {alert("No main popup element firstChild.");return};
   var popup = spcdata.popupele;

   function GetLayoutValues(ele) {
      var r = SocialCalc.GetElementPosition(ele);
      r.height = ele.offsetHeight;
      r.width = ele.offsetWidth;
      r.bottom = r.top+r.height;
      r.right = r.left+r.width;
      return r;
      }

   var p = GetLayoutValues(popup);
   var c = GetLayoutValues(container);
   var m = GetLayoutValues(main);
   var t = 0; // type of placement
//addmsg("popup t/r/b/l/h/w= "+p.top+"/"+p.right+"/"+p.bottom+"/"+p.left+"/"+p.height+"/"+p.width);
//addmsg("container t/r/b/l/h/w= "+c.top+"/"+c.right+"/"+c.bottom+"/"+c.left+"/"+c.height+"/"+c.width);
//addmsg("main t/r/b/l/h/w= "+m.top+"/"+m.right+"/"+m.bottom+"/"+m.left+"/"+m.height+"/"+m.width);

   // Check various layout cases in priority order

   if (m.bottom+p.height < c.bottom && m.left+p.width < c.right) { // normal case: room on bottom and right
      popup.style.top = m.bottom + "px";
      popup.style.left = m.left + "px";
      t = 1;
      }

   else if (m.top-p.height > c.top && m.left+p.width < c.right) { // room on top and right
      popup.style.top = (m.top-p.height) + "px";
      popup.style.left = m.left + "px";
      t = 2;
      }

   else if (m.bottom+p.height < c.bottom && m.right-p.width > c.left) { // room on bottom and left
      popup.style.top = m.bottom + "px";
      popup.style.left = (m.right-p.width) + "px";
      t = 3;
      }

   else if (m.top-p.height > c.top && m.right-p.width > c.left) { // room on top and left
      popup.style.top = (m.top-p.height) + "px";
      popup.style.left = (m.right-p.width) + "px";
      t = 4;
      }

   else if (m.bottom+p.height < c.bottom && p.width < c.width) { // room on bottom and middle
      popup.style.top = m.bottom + "px";
      popup.style.left = (c.left+Math.floor((c.width-p.width)/2)) + "px";
      t = 5;
      }

   else if (m.top-p.height > c.top && p.width < c.width) { // room on top and middle
      popup.style.top = (m.top-p.height) + "px";
      popup.style.left = (c.left+Math.floor((c.width-p.width)/2)) + "px";
      t = 6;
      }

   else if (p.height < c.height && m.right+p.width < c.right) { // room on middle and right
      popup.style.top = (c.top+Math.floor((c.height-p.height)/2)) + "px";
      popup.style.left = m.right + "px";
      t = 7;
      }

   else if (p.height < c.height && m.left-p.width > c.left) { // room on middle and left
      popup.style.top = (c.top+Math.floor((c.height-p.height)/2)) + "px";
      popup.style.left = (m.left-p.width) + "px";
      t = 8;
      }

   else { // nothing works, so leave as it is
      }
//addmsg("Popup layout "+t);

}

//
// ele = SocialCalc.Popup.DestroyPopupDiv(ele, dragregistered)
//
// Utility function to get rid of the main popup div.
//

SocialCalc.Popup.DestroyPopupDiv = function(ele, dragregistered) {

   if (!ele) return;

   ele.innerHTML = "";

   SocialCalc.DragUnregister(dragregistered); // OK to do this even if not registered

   if (ele.parentNode) {
      ele.parentNode.removeChild(ele);
      }

   }

//
// Color Utility Functions
//

SocialCalc.Popup.RGBToHex = function(val) {

   var sp = SocialCalc.Popup;

   if (val=="") {
      return "000000";
      }
   var rgbvals = val.match(/(\d+)\D+(\d+)\D+(\d+)/);
   if (rgbvals) {
      return sp.ToHex(rgbvals[1])+sp.ToHex(rgbvals[2])+sp.ToHex(rgbvals[3]);
      }
   else {
      return "000000";
      }
   }

SocialCalc.Popup.HexDigits="0123456789ABCDEF";

SocialCalc.Popup.ToHex = function(num) {
   var sp = SocialCalc.Popup;
   var first=Math.floor(num / 16);
   var second=num % 16;
   return sp.HexDigits.charAt(first)+sp.HexDigits.charAt(second);
   }

SocialCalc.Popup.FromHex = function(str) {

   var sp = SocialCalc.Popup;
   var first = sp.HexDigits.indexOf(str.charAt(0).toUpperCase());
   var second = sp.HexDigits.indexOf(str.charAt(1).toUpperCase());
   return ((first>=0)?first:0)*16+((second>=0)?second:0);
   }

SocialCalc.Popup.HexToRGB = function(val) {

   var sp = SocialCalc.Popup;

   return "rgb("+sp.FromHex(val.substring(1,3))+","+sp.FromHex(val.substring(3,5))+","+sp.FromHex(val.substring(5,7))+")";

   }

SocialCalc.Popup.makeRGB = function(r, g, b) {
   return "rgb("+(r>0?r:0)+","+(g>0?g:0)+","+(b>0?b:0)+")";
   }

SocialCalc.Popup.splitRGB = function(rgb) {
   var parts = rgb.match(/(\d+)\D+(\d+)\D+(\d+)\D/);
   if (!parts) {
      return {r:0, g:0, b:0};
      }
   else {
      return {r: parts[1]-0, g: parts[2]-0, b: parts[3]-0};
      }
   }

// * * * * * * * * * * * * * * * *
//
// ROUTINES FOR EACH TYPE
//
// * * * * * * * * * * * * * * * *

//
// List
//
// type: List
// value: value of control,
// display: "value to display",
// custom: true if custom value,
// disabled: t/f,
// attribs: {
//    title: "popup title string",
//    moveable: t/f,
//    width: optional width, e.g., "100px",
//    ensureWithin: optional element object to ensure popup fits within if possible
//    changedcallback: optional function(attribs, id, newvalue),
//    ...
//    }
// data: {
//    ncols: calculated number of columns
//    options: [
//       {o: option-name, v: value-to-return,
//        a: {option attribs} // optional: {skip: true, custom: true, cancel: true, newcol: true}
//       },
//       ...]
//    }
//
// popupele: gets popup element object when created
// contentele: gets element created with all the content
// listdiv: gets div with list of items
// customele: gets input element with custom value
// dragregistered: gets element, if any, registered as draggable
//

SocialCalc.Popup.Types.List = {};

SocialCalc.Popup.Types.List.Create = function(type, id, attribs) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   var spcid = {type: type, value: "", display: "", data: {}};
   //if (spc[id]) {alert("Already created "+id); return;}
   spc[id] = spcid;
   var spcdata = spcid.data;

   spcdata.attribs = attribs || {};

   var ele = document.getElementById(id);
   if (!ele) {alert("Missing element "+id); return;}

   spcdata.mainele = ele;

   ele.innerHTML = '<input style="cursor:pointer;width:100px;font-size:smaller;" onfocus="this.blur();" onclick="SocialCalc.Popup.CClick(\''+id+'\');" value="">';

   spcdata.options = []; // set to nothing - use Initialize to fill

   }

SocialCalc.Popup.Types.List.SetValue = function(type, id, value) {

   var i;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   spcdata.value = value;
   spcdata.custom = false;

   for (i=0; i<spcdata.options.length; i++) {
      o = spcdata.options[i];
      if (o.a) {
         if (o.a.skip || o.a.custom || o.a.cancel) {
            continue;
            }
         }
      if (o.v == spcdata.value) { // matches value
         spcdata.display = o.o;
         break;
         }
      }
   if (i==spcdata.options.length) { // none found
      spcdata.display = "Custom";
      spcdata.custom = true;
      }

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      spcdata.mainele.firstChild.value = spcdata.display;
      }

   }


SocialCalc.Popup.Types.List.SetDisabled = function(type, id, disabled) {

   var i;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   spcdata.disabled = disabled;

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      spcdata.mainele.firstChild.disabled = disabled;
      }

   }


SocialCalc.Popup.Types.List.GetValue = function(type, id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   return spcdata.value;

   }


// data is: {value: initial value, attribs: {attribs stuff}, options: [{o: option-name, v: value-to-return, a: optional-attribs}, ...]}

SocialCalc.Popup.Types.List.Initialize = function(type, id, data) {

   var a;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   for (a in data.attribs) {
      spcdata.attribs[a] = data.attribs[a];
      }

   spcdata.options = data ? data.options : [];

   if (data.value) { // if has a value, set to it
      sp.SetValue(id, data.value);
      }

   }


SocialCalc.Popup.Types.List.Reset = function(type) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (sp.Current.id && spc[sp.Current.id].type == type) { // we have a popup
      spt[type].Hide(type, sp.Current.id);
      sp.Current.id = null;
      }

   }


SocialCalc.Popup.Types.List.Show = function(type, id) {

   var i, ele, o, bg;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data

   var str = "";

   spcdata.popupele = sp.CreatePopupDiv(id, spcdata.attribs);

   if (spcdata.custom) {
      str = SocialCalc.Popup.Types.List.MakeCustom(type, id);

      ele = document.createElement("div");
      ele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">'+str+'</div>';

      spcdata.customele = ele.firstChild.firstChild.childNodes[1];
      spcdata.listdiv = null;
      spcdata.contentele = ele;
      }
   else {
      str = SocialCalc.Popup.Types.List.MakeList(type, id);

      ele = document.createElement("div");
      ele.innerHTML = '<div style="cursor:default;padding:4px;">'+str+'</div>';

      spcdata.customele = null;
      spcdata.listdiv = ele.firstChild;
      spcdata.contentele = ele;
      }

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      spcdata.mainele.firstChild.disabled = true;
      }

   spcdata.popupele.appendChild(ele);

   if (spcdata.attribs.ensureWithin) {
      SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
      }

   }


SocialCalc.Popup.Types.List.MakeList = function(type, id) {

   var i, ele, o, bg;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data

   var str = '<table cellspacing="0" cellpadding="0"><tr>';
   var td = '<td style="vertical-align:top;">';

   str += td;

   spcdata.ncols = 1;

   for (i=0; i<spcdata.options.length; i++) {
      o = spcdata.options[i];
      if (o.a) {
         if ( o.a.newcol) {
            str += '</td>'+td+"&nbsp;&nbsp;&nbsp;&nbsp;"+'</td>'+td;
            spcdata.ncols += 1;
            continue;
            }
         if (o.a.skip) {
            str += '<div style="font-size:x-small;white-space:nowrap;">'+o.o+'</div>';
            continue;
            }
         }
      if (o.v == spcdata.value && !(o.a && (o.a.custom || o.a.cancel))) { // matches value
         bg = "background-color:#DDF;";
         }
      else {
         bg = "";
         }
      str += '<div style="font-size:x-small;white-space:nowrap;'+bg+'" onclick="SocialCalc.Popup.Types.List.ItemClicked(\''+id+'\',\''+i+'\');" onmousemove="SocialCalc.Popup.Types.List.MouseMove(\''+id+'\',this);">'+o.o+'</div>';
      }

   str += "</td></tr></table>";

   return str;

   }


SocialCalc.Popup.Types.List.MakeCustom = function(type, id) {

   var SPLoc = SocialCalc.Popup.LocalizeString;

   var i, ele, o, bg;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var style = 'style="font-size:smaller;"';

   var str = "";

   var val = spcdata.value;
   val = SocialCalc.special_chars(val);

   str = '<div style="white-space:nowrap;"><br>'+
         '<input id="customvalue" value="'+val+'"><br><br>'+
         '<input '+style+' type="button" value="'+SPLoc("OK")+'" onclick="SocialCalc.Popup.Types.List.CustomOK(\''+id+'\');return false;">'+
         '<input '+style+' type="button" value="'+SPLoc("List")+'" onclick="SocialCalc.Popup.Types.List.CustomToList(\''+id+'\');">'+
         '<input '+style+' type="button" value="'+SPLoc("Cancel")+'" onclick="SocialCalc.Popup.Close();">'+
         '<br></div>';

   return str;

   }


SocialCalc.Popup.Types.List.ItemClicked = function(id, num) {

   var oele, str, nele;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var a = spcdata.options[num].a;

   if (a && a.custom) {
      oele = spcdata.contentele;
      str = SocialCalc.Popup.Types.List.MakeCustom("List", id);
      nele = document.createElement("div");
      nele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">'+str+'</div>';
      spcdata.customele = nele.firstChild.firstChild.childNodes[1];
      spcdata.listdiv = null;
      spcdata.contentele = nele;
      spcdata.popupele.replaceChild(nele, oele);
      if (spcdata.attribs.ensureWithin) {
         SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
         }
      return;
      }

   if (a && a.cancel) {
      SocialCalc.Popup.Close();
      return;
      }

   SocialCalc.Popup.SetValue(id, spcdata.options[num].v);

   SocialCalc.Popup.Close();
   
   }


SocialCalc.Popup.Types.List.CustomToList = function(id) {

   var oele, str, nele;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   oele = spcdata.contentele;
   str = SocialCalc.Popup.Types.List.MakeList("List", id);
   nele = document.createElement("div");
   nele.innerHTML = '<div style="cursor:default;padding:4px;">'+str+'</div>';
   spcdata.customele = null;
   spcdata.listdiv = nele.firstChild;
   spcdata.contentele = nele;
   spcdata.popupele.replaceChild(nele, oele);
   
   if (spcdata.attribs.ensureWithin) {
      SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
      }
   }


SocialCalc.Popup.Types.List.CustomOK = function(id) {

   var i, c;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   SocialCalc.Popup.SetValue(id, spcdata.customele.value);

   SocialCalc.Popup.Close();
   
   }


SocialCalc.Popup.Types.List.MouseMove = function(id, ele) {

   var col, i, c;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var list = spcdata.listdiv;

   if (!list) return;

   var rowele = list.firstChild.firstChild.firstChild; // div.table.tbody.tr

   for (col=0; col<spcdata.ncols; col++) {
      for (i=0; i<rowele.childNodes[col*2].childNodes.length; i++) {
         rowele.childNodes[col*2].childNodes[i].style.backgroundColor = "#FFF";
         }
      }

   ele.style.backgroundColor = "#DDF";
   
   }

SocialCalc.Popup.Types.List.Hide = function(type, id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   sp.DestroyPopupDiv(spcdata.popupele, spcdata.dragregistered);
   spcdata.popupele = null;

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      spcdata.mainele.firstChild.disabled = false;
      }

   }

SocialCalc.Popup.Types.List.Cancel = function(type, id) {

   SocialCalc.Popup.Types.List.Hide(type, id);

   }


//
// ColorChooser
//
// type: ColorChooser
// value: value of control as "rgb(r,g,b)" or "" if default,
// oldvalue: starting value to reset to on close,
// display: "value to display" as hex color value,
// custom: true if custom value,
// disabled: t/f,
// attribs: {
//    title: "popup title string",
//    moveable: t/f,
//    width: optional width, e.g., "100px", of popup chooser
//    ensureWithin: optional element object to ensure popup fits within if possible
//    sampleWidth: optional width, e.g., "20px",
//    sampleHeight: optional height, e.g., "20px",
//    backgroundImage: optional background image for sample (transparent where want to show current color), e.g., "colorbg.gif"
//    backgroundImageDefault: optional background image for sample when default (transparent shows white)
//    backgroundImageDisabled: optional background image for sample when disabled (transparent shows gray)
//    changedcallback: optional function(attribs, id, newvalue),
//    ...
//    }
// data: {
//    }
//
// popupele: gets popup element object when created
// contentele: gets element created with all the content
// customele: gets input element with custom value
//

SocialCalc.Popup.Types.ColorChooser = {};

SocialCalc.Popup.Types.ColorChooser.Create = function(type, id, attribs) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   var spcid = {type: type, value: "", display: "", data: {}};
   //if (spc[id]) {alert("Already created "+id); return;}
   spc[id] = spcid;
   var spcdata = spcid.data;

   spcdata.attribs = attribs || {};
   var spca = spcdata.attribs;

   spcdata.value = "";

   var ele = document.getElementById(id);
   if (!ele) {alert("Missing element "+id); return;}

   spcdata.mainele = ele;

   ele.innerHTML = '<div style="cursor:pointer;border:1px solid black;vertical-align:top;width:'+
                   (spca.sampleWidth || '15px')+';height:'+(spca.sampleHeight || '15px')+
                   ';" onclick="SocialCalc.Popup.Types.ColorChooser.ControlClicked(\''+id+'\');">&nbsp;</div>';

   }

SocialCalc.Popup.Types.ColorChooser.SetValue = function(type, id, value) {

   var i, img, pos;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;
   var spca = spcdata.attribs;

   spcdata.value = value;
   spcdata.custom = false;

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      if (spcdata.value) {
         spcdata.mainele.firstChild.style.backgroundColor = spcdata.value;
         if (spca.backgroundImage) {
            img = "url("+sp.imagePrefix+spca.backgroundImage+")";
            }
         else {
            img = "";
            }
         pos = "center center";
         }
      else {
         spcdata.mainele.firstChild.style.backgroundColor = "#FFF";
         if (spca.backgroundImageDefault) {
            img = "url("+sp.imagePrefix+spca.backgroundImageDefault+")";
            pos = "center center";
            }
         else {
            img = "url("+sp.imagePrefix+"defaultcolor.gif)";
            pos = "left top";
            }
         }
      spcdata.mainele.firstChild.style.backgroundPosition = pos;
      spcdata.mainele.firstChild.style.backgroundImage = img;
      }

   }


SocialCalc.Popup.Types.ColorChooser.SetDisabled = function(type, id, disabled) {

   var i;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;
   var spca = spcdata.attribs;

   spcdata.disabled = disabled;

   if (spcdata.mainele && spcdata.mainele.firstChild) {
      if (disabled) {
         spcdata.mainele.firstChild.style.backgroundColor = "#DDD";
         if (spca.backgroundImageDisabled) {
            img = "url("+sp.imagePrefix+spca.backgroundImageDisabled+")";
            pos = "center center";
            }
         else {
            img = "url("+sp.imagePrefix+"defaultcolor.gif)";
            pos = "left top";
            }
         spcdata.mainele.firstChild.style.backgroundPosition = pos;
         spcdata.mainele.firstChild.style.backgroundImage = img;
         }
      else {
         sp.SetValue(id, spcdata.value);
         }
      }

   }


SocialCalc.Popup.Types.ColorChooser.GetValue = function(type, id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   return spcdata.value;

   }


SocialCalc.Popup.Types.ColorChooser.Initialize = function(type, id, data) {

   var a;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   for (a in data.attribs) {
      spcdata.attribs[a] = data.attribs[a];
      }

   if (data.value) { // if has a value, set to it
      sp.SetValue(id, data.value);
      }

   }


SocialCalc.Popup.Types.ColorChooser.Reset = function(type) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;

   if (sp.Current.id && spc[sp.Current.id].type == type) { // we have a popup
      spt[type].Hide(type, sp.Current.id);
      sp.Current.id = null;
      }

   }


SocialCalc.Popup.Types.ColorChooser.Show = function(type, id) {

   var i, ele, mainele;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data

   var str = "";

   spcdata.oldvalue = spcdata.value; // remember starting value

   spcdata.popupele = sp.CreatePopupDiv(id, spcdata.attribs);

   if (spcdata.custom) {
      str = SocialCalc.Popup.Types.ColorChooser.MakeCustom(type, id);

      ele = document.createElement("div");
      ele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">'+str+'</div>';

      spcdata.customele = ele.firstChild.firstChild.childNodes[2];
      spcdata.contentele = ele;
      }
   else {
      mainele = SocialCalc.Popup.Types.ColorChooser.CreateGrid(type, id);

      ele = document.createElement("div");
      ele.style.padding = "3px";
      ele.style.backgroundColor = "#CCC";
      ele.appendChild(mainele);

      spcdata.customele = null;
      spcdata.contentele = ele;
      }

   spcdata.popupele.appendChild(ele);

   if (spcdata.attribs.ensureWithin) {
      SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
      }

   }


SocialCalc.Popup.Types.ColorChooser.MakeCustom = function(type, id) {

   var i, ele, o, bg;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   var SPLoc = sp.LocalizeString;

   var style = 'style="font-size:smaller;"';

   var str = "";

   str = '<div style="white-space:nowrap;"><br>'+
         '#<input id="customvalue" style="width:75px;" value="'+spcdata.value+'"><br><br>'+
         '<input '+style+' type="button" value="'+SPLoc("OK")+'" onclick="SocialCalc.Popup.Types.ColorChooser.CustomOK(\''+id+'\');return false;">'+
         '<input '+style+' type="button" value="'+SPLoc("Grid")+'" onclick="SocialCalc.Popup.Types.ColorChooser.CustomToGrid(\''+id+'\');">'+
         '<br></div>';

   return str;

   }


SocialCalc.Popup.Types.ColorChooser.ItemClicked = function(id, num) {

   var oele, str, nele;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   SocialCalc.Popup.Close();
   
   }


SocialCalc.Popup.Types.ColorChooser.CustomToList = function(id) {

   var oele, str, nele;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   }


SocialCalc.Popup.Types.ColorChooser.CustomOK = function(id) {

   var i, c;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   sp.SetValue(id, spcdata.customele.value);

   sp.Close();
   
   }


SocialCalc.Popup.Types.ColorChooser.Hide = function(type, id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   sp.DestroyPopupDiv(spcdata.popupele, spcdata.dragregistered);
   spcdata.popupele = null;

   }


SocialCalc.Popup.Types.ColorChooser.Cancel = function(type, id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   sp.SetValue(id, spcdata.oldvalue); // reset to old value

   SocialCalc.Popup.Types.ColorChooser.Hide(type, id);

   }


SocialCalc.Popup.Types.ColorChooser.CreateGrid = function (type, id) {

   var ele, pos, row, rowele, col, g;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var SPLoc = sp.LocalizeString;
   var spcdata = spc[id].data;
   spcdata.grid = {};
   var grid = spcdata.grid;

   var mainele = document.createElement("div");

   ele = document.createElement("table");
   ele.cellSpacing = 0;
   ele.cellPadding = 0;
   ele.style.width = "100px";
   grid.table = ele;

   ele = document.createElement("tbody");
   grid.table.appendChild(ele);
   grid.tbody = ele;

   for (row=0; row<16; row++) {
      rowele = document.createElement("tr");
      for (col=0; col<5; col++) {
         g = {};
         grid[row+","+col] = g;
         ele = document.createElement("td");
         ele.style.fontSize = "1px";
         ele.innerHTML = "&nbsp;";
         ele.style.height = "10px";
         if (col<=1) {
            ele.style.width = "17px";
            ele.style.borderRight = "3px solid white";
            }
         else {
            ele.style.width = "20px";
            ele.style.backgroundRepeat = "no-repeat";
            }
         rowele.appendChild(ele);
         g.ele = ele;
         }
      grid.tbody.appendChild(rowele);
      }
   mainele.appendChild(grid.table);

   ele = document.createElement("div");
   ele.style.marginTop = "3px";
   ele.innerHTML = '<table cellspacing="0" cellpadding="0"><tr>'+
      '<td style="width:17px;background-color:#FFF;background-image:url('+sp.imagePrefix+'defaultcolor.gif);height:16px;font-size:10px;cursor:pointer;" title="'+SPLoc("Default")+'">&nbsp;</td>'+
      '<td style="width:23px;height:16px;font-size:10px;text-align:center;cursor:pointer;" title="'+SPLoc("Custom")+'">#</td>'+
      '<td style="width:60px;height:16px;font-size:10px;text-align:center;cursor:pointer;">'+SPLoc("OK")+'</td>'+
      '</tr></table>';
   grid.defaultbox = ele.firstChild.firstChild.firstChild.childNodes[0];
   grid.defaultbox.onclick = spt.ColorChooser.DefaultClicked;
   grid.custom = ele.firstChild.firstChild.firstChild.childNodes[1];
   grid.custom.onclick = spt.ColorChooser.CustomClicked;
   grid.msg = ele.firstChild.firstChild.firstChild.childNodes[2];
   grid.msg.onclick = spt.ColorChooser.CloseOK;
   mainele.appendChild(ele);

   grid.table.onmousedown = spt.ColorChooser.GridMouseDown;

   spt.ColorChooser.DetermineColors(id);
   spt.ColorChooser.SetColors(id);

   return mainele;

   }

SocialCalc.Popup.Types.ColorChooser.gridToG = function(grid, row, col) {

   return grid[row+","+col];

   }

SocialCalc.Popup.Types.ColorChooser.DetermineColors = function(id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;
   var spcdata = spc[id].data;
   var grid = spcdata.grid;

   var col, row;
   var rgb = sp.splitRGB(spcdata.value);
   var color;

   col = 2;
   row = 16-Math.floor((rgb.r+16)/16);
   grid["selectedrow"+col] = row;
   for (row=0; row<16; row++) {
      sptc.gridToG(grid,row,col).rgb = sp.makeRGB(17*(15-row),0,0);
      }

   col = 3;
   row = 16-Math.floor((rgb.g+16)/16);
   grid["selectedrow"+col] = row;
   for (row=0; row<16; row++) {
      sptc.gridToG(grid,row,col).rgb = sp.makeRGB(0,17*(15-row),0);
      }

   col = 4;
   row = 16-Math.floor((rgb.b+16)/16);
   grid["selectedrow"+col] = row;
   for (row=0; row<16; row++) {
      sptc.gridToG(grid,row,col).rgb = sp.makeRGB(0,0,17*(15-row));
      }

   col = 1;
   for (row=0; row<16; row++) {
      sptc.gridToG(grid,row,col).rgb = sp.makeRGB(17*(15-row),17*(15-row),17*(15-row));
      }

   col = 0;
   var steps = [0, 68, 153, 204, 255];
   var commonrgb = ["400", "310", "420", "440", "442", "340", "040", "042", "032", "044", "024", "004", "204", "314", "402", "414"];
   var x;
   for (row=0; row<16; row++) {
      x = commonrgb[row];
      sptc.gridToG(grid,row,col).rgb = "rgb("+steps[x.charAt(0)-0]+","+steps[x.charAt(1)-0]+","+steps[x.charAt(2)-0]+")";
      }

   }

SocialCalc.Popup.Types.ColorChooser.SetColors = function(id) {

   var row, col, g, ele, rgb;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;
   var spcdata = spc[id].data;
   var grid = spcdata.grid;

   for (row=0; row<16; row++) {
      for (col=0; col<5; col++) {
         g = sptc.gridToG(grid,row, col);
         g.ele.style.backgroundColor = g.rgb;
         g.ele.title = sp.RGBToHex(g.rgb);
         if (grid["selectedrow"+col]==row) {
            g.ele.style.backgroundImage = "url("+sp.imagePrefix+"chooserarrow.gif)";
            }
         else {
            g.ele.style.backgroundImage = "";
            }
         }
      }

   sp.SetValue(id, spcdata.value);

   grid.msg.style.backgroundColor = spcdata.value;
   rgb = sp.splitRGB(spcdata.value || "rgb(255,255,255)");
   if (rgb.r+rgb.g+rgb.b < 220) {
      grid.msg.style.color = "#FFF";
      }
   else {
      grid.msg.style.color = "#000";
      }
   if (!spcdata.value) { // default
      grid.msg.style.backgroundColor = "#FFF";
      grid.msg.style.backgroundImage = "url("+sp.imagePrefix+"defaultcolor.gif)";
      grid.msg.title = "Default";
      }
   else {
      grid.msg.style.backgroundImage = "";
      grid.msg.title = sp.RGBToHex(spcdata.value);
      }

   }

SocialCalc.Popup.Types.ColorChooser.GridMouseDown = function(e) {

   var event = e || window.event;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;

   var id = sp.Current.id;
   if (!id) return;

   var spcdata = spc[id].data;
   var grid = spcdata.grid;

   switch (event.type) {
      case "mousedown":
         grid.mousedown = true;
         break;
      case "mouseup":
         grid.mousedown = false;
         break;
      case "mousemove":
         if (!grid.mousedown) {
            return;
            }
         break;
      }

   var pos = SocialCalc.GetElementPositionWithScroll(spcdata.mainele);
   var clientX = event.clientX - pos.left;
   var clientY = event.clientY - pos.top;
   var gpos = SocialCalc.GetElementPositionWithScroll(grid.table);
   gpos.left -= pos.left;
   gpos.top -= pos.top
   var row = Math.floor((clientY-gpos.top-2)/10); // -2 is to split the diff btw IE & FF
   row = row < 0 ? 0 : row;
   var col = Math.floor((clientX-gpos.left)/20);
   row = row < 0 ? 0 : (row > 15 ? 15 : row);
   col = col < 0 ? 0 : (col > 4 ? 4 : col);
   var color = sptc.gridToG(grid,row,col).ele.style.backgroundColor;
   var newrgb = sp.splitRGB(color);
   var oldrgb = sp.splitRGB(spcdata.value);

   switch (col) {
      case 2:
         spcdata.value = sp.makeRGB(newrgb.r, oldrgb.g, oldrgb.b);
         break;
      case 3:
         spcdata.value = sp.makeRGB(oldrgb.r, newrgb.g, oldrgb.b);
         break;
      case 4:
         spcdata.value = sp.makeRGB(oldrgb.r, oldrgb.g, newrgb.b);
         break;
      case 0:
      case 1:
         spcdata.value = color;
      }

   sptc.DetermineColors(id);
   sptc.SetColors(id);

   }


SocialCalc.Popup.Types.ColorChooser.ControlClicked = function(id) {

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;

   var cid = sp.Current.id;
   if (!cid || id != cid) {
      sp.CClick(id);
      return;
      }

   sptc.CloseOK();

   }

SocialCalc.Popup.Types.ColorChooser.DefaultClicked = function(e) {

   var event = e || window.event;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;

   var id = sp.Current.id;
   if (!id) return;

   var spcdata = spc[id].data;

   spcdata.value = "";
   SocialCalc.Popup.SetValue(id, spcdata.value);

   SocialCalc.Popup.Close();

   }

SocialCalc.Popup.Types.ColorChooser.CustomClicked = function(e) {

   var event = e || window.event;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;

   var id = sp.Current.id;
   if (!id) return;

   var spcdata = spc[id].data;

   var oele, str, nele;

   oele = spcdata.contentele;
   str = SocialCalc.Popup.Types.ColorChooser.MakeCustom("ColorChooser", id);
   nele = document.createElement("div");
   nele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">'+str+'</div>';
   spcdata.customele = nele.firstChild.firstChild.childNodes[2];
   spcdata.contentele = nele;
   spcdata.popupele.replaceChild(nele, oele);

   spcdata.customele.value = sp.RGBToHex(spcdata.value);

   if (spcdata.attribs.ensureWithin) {
      SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
      }

   }



SocialCalc.Popup.Types.ColorChooser.CustomToGrid = function(id) {

   var oele, str, nele;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   SocialCalc.Popup.SetValue(id, sp.HexToRGB("#"+spcdata.customele.value));

   var oele, mainele, nele;

   oele = spcdata.contentele;
   mainele = SocialCalc.Popup.Types.ColorChooser.CreateGrid("ColorChooser", id);
   nele = document.createElement("div");
   nele.style.padding = "3px";
   nele.style.backgroundColor = "#CCC";
   nele.appendChild(mainele);
   spcdata.customele = null;
   spcdata.contentele = nele;
   spcdata.popupele.replaceChild(nele, oele);
   
   if (spcdata.attribs.ensureWithin) {
      SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
      }
   }


SocialCalc.Popup.Types.ColorChooser.CustomOK = function(id) {

   var i, c;
   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var spc = sp.Controls;
   var spcdata = spc[id].data;

   SocialCalc.Popup.SetValue(id, sp.HexToRGB("#"+spcdata.customele.value));

   SocialCalc.Popup.Close();
   
   }

SocialCalc.Popup.Types.ColorChooser.CloseOK = function(e) {

   var event = e || window.event;

   var sp = SocialCalc.Popup;
   var spt = sp.Types;
   var sptc = spt.ColorChooser;
   var spc = sp.Controls;

   var id = sp.Current.id;
   if (!id) return;

   var spcdata = spc[id].data;

   SocialCalc.Popup.SetValue(id, spcdata.value);

   SocialCalc.Popup.Close();

   }

//
// SocialCalcSpreadsheetControl
//
/*
// The code module of the SocialCalc package that lets you embed a spreadsheet
// control with toolbar, etc., into a web page.
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

The Original Code is SocialCalc JavaScript SpreadsheetControl.

The Original Developer is the Initial Developer.

The Initial Developer of the Original Code is Socialtext, Inc. All portions of the code written by 
Socialtext, Inc., are Copyright (c) Socialtext, Inc. All Rights Reserved.

Contributor: Dan Bricklin.


EXHIBIT B. Attribution Information

When the SpreadsheetControl is producing and/or controlling the display the Graphic Image must be
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
// SpreadsheetControl class:
//
// *************************************

// Global constants:

   SocialCalc.CurrentSpreadsheetControlObject = null; // right now there can only be one active at a time


// Constructor:

SocialCalc.SpreadsheetControl = function(idPrefix) {

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

   // Tab definitions: An array where each tab is an object of the form:
   //
   //    name: "name",
   //    text: "text-on-tab",
   //    html: "html-to-create div",
   //       replacements:
   //         "%s.": "SocialCalc", "%id.": spreadsheet.idPrefix, "%tbt.": spreadsheet.toolbartext
   //         Other replacements from spreadsheet.tabreplacements:
   //            replacementname: {regex: regular-expression-to-match-with-g, replacement: string}
   //    view: "viewname", // view to show when selected; "sheet" or missing/null is spreadsheet
   //    oncreate: function(spreadsheet, tab-name), // called when first created to initialize
   //    onclick: function(spreadsheet, tab-name), missing/null is sheet default
   //    onclickFocus: text, // spreadsheet.idPrefix+text is given the focus if present instead of normal KeyboardFocus
   //       or if text isn't a string, that value (e.g., true) is used for SocialCalc.CmdGotFocus
   //    onunclick: function(spreadsheet, tab-name), missing/null is sheet default

   this.tabs = [];
   this.tabnums = {}; // when adding tabs, add tab-name: array-index to this object
   this.tabreplacements = {}; // see use above
   this.currentTab = -1; // currently selected tab index in this.tabs or -1 (maintained by SocialCalc.SetTab)

   // View definitions: An object where each view is an object of the form:
   //
   //    name: "name", // localized when first set using SocialCalc.LocalizeString
   //    element: node-in-the-dom, // filled in when initialized
   //    replacements: {}, // see below
   //    html: "html-to-create div",
   //       replacements:
   //         "%s.": "SocialCalc", "%id.": spreadsheet.idPrefix, "%tbt.": spreadsheet.toolbartext, "%img.": spreadsheet.imagePrefix,
   //         SocialCalc.LocalizeSubstring replacements ("%loc!string!" and "%ssc!constant-name!")
   //         Other replacements from viewobject.replacements:
   //            replacementname: {regex: regular-expression-to-match-with-g, replacement: string}
   //    divStyle: attributes for sheet div (SocialCalc.setStyles format)
   //    oncreate: function(spreadsheet, viewobject), // called when first created to initialize
   //    needsresize: true/false/null, // if true, do resize calc after displaying
   //    onresize: function(spreadsheet, viewobject), // called if needs resize
   //    values: {} // optional values to share with onclick handlers, etc.
   //
   // There is always a "sheet" view.

   this.views = {}; // {viewname: view-object, ...}

   // Dynamic properties:

   this.sheet = null;
   this.context = null;
   this.editor = null;

   this.spreadsheetDiv = null;
   this.editorDiv = null;

   this.sortrange = ""; // remembered range for sort tab

   this.moverange = ""; // remembered range from movefrom used by movepaste/moveinsert

   // Constants:

   this.idPrefix = idPrefix || "SocialCalc-"; // prefix added to element ids used here, should end in "-"
   this.multipartBoundary = "SocialCalcSpreadsheetControlSave"; // boundary used by SpreadsheetControlCreateSpreadsheetSave
   this.imagePrefix = scc.defaultImagePrefix; // prefix added to img src

   this.toolbarbackground = scc.SCToolbarbackground;
   this.tabbackground = scc.SCTabbackground; // "background-color:#CCC;";
   this.tabselectedCSS = scc.SCTabselectedCSS;
   this.tabplainCSS = scc.SCTabplainCSS;
   this.toolbartext = scc.SCToolbartext;

   this.formulabarheight = scc.SCFormulabarheight; // in pixels, will contain a text input box

   this.statuslineheight = scc.SCStatuslineheight; // in pixels
   this.statuslineCSS = scc.SCStatuslineCSS;

   // Callbacks:

   this.ExportCallback = null; // a function called for Clipboard Export button: this.ExportCallback(spreadsheet_control_object)

   // Initialization Code:

   this.sheet = new SocialCalc.Sheet();
   this.context = new SocialCalc.RenderContext(this.sheet);
   this.context.showGrid=true;
   this.context.showRCHeaders=true;
   this.editor = new SocialCalc.TableEditor(this.context);
   this.editor.StatusCallback.statusline =
      {func: SocialCalc.SpreadsheetControlStatuslineCallback,
       params: {statuslineid: this.idPrefix+"statusline",
                recalcid1: this.idPrefix+"divider_recalc",
                recalcid2: this.idPrefix+"button_recalc"}};

   SocialCalc.CurrentSpreadsheetControlObject = this; // remember this for rendezvousing on events

   this.editor.MoveECellCallback.movefrom = function(editor) {
      var cr;
      var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
      spreadsheet.context.cursorsuffix = "";
      if (editor.range2.hasrange && !editor.cellhandles.noCursorSuffix) {
         if (editor.ecell.row==editor.range2.top && (editor.ecell.col<editor.range2.left || editor.ecell.col>editor.range2.right+1)) {
            spreadsheet.context.cursorsuffix = "insertleft";
            }
         if (editor.ecell.col==editor.range2.left && (editor.ecell.row<editor.range2.top || editor.ecell.row>editor.range2.bottom+1)) {
            spreadsheet.context.cursorsuffix = "insertup";
            }
         }
      };

   // formula bar buttons

   this.formulabuttons = {
      formulafunctions: {image: "formuladialog.gif", tooltip: "Functions", // tooltips are localized when set below
                         command: SocialCalc.SpreadsheetControl.DoFunctionList},
      multilineinput: {image: "multilinedialog.gif", tooltip: "Multi-line Input Box",
                         command: SocialCalc.SpreadsheetControl.DoMultiline},
      link: {image: "linkdialog.gif", tooltip: "Link Input Box",
                         command: SocialCalc.SpreadsheetControl.DoLink},
      sum: {image: "sumdialog.gif", tooltip: "Auto Sum",
                         command: SocialCalc.SpreadsheetControl.DoSum}
      }

   // Default tabs:

   // Edit

   this.tabnums.edit = this.tabs.length;
   this.tabs.push({name: "edit", text: "Edit", html:
      ' <div id="%id.edittools" style="padding:10px 0px 0px 0px;">'+
'&nbsp;<img id="%id.button_undo" src="%img.undo.gif" style="vertical-align:bottom;">'+
' <img id="%id.button_redo" src="%img.redo.gif" style="vertical-align:bottom;">'+
' &nbsp;<img src="%img.divider1.gif" style="vertical-align:bottom;">&nbsp; '+
'<img id="%id.button_copy" src="%img.copy.gif" style="vertical-align:bottom;">'+
' <img id="%id.button_cut" src="%img.cut.gif" style="vertical-align:bottom;">'+
' <img id="%id.button_paste" src="%img.paste.gif" style="vertical-align:bottom;">'+
' &nbsp;<img src="%img.divider1.gif" style="vertical-align:bottom;">&nbsp; '+
'<img id="%id.button_delete" src="%img.delete.gif" style="vertical-align:bottom;">'+
' <img id="%id.button_pasteformats" src="%img.pasteformats.gif" style="vertical-align:bottom;">'+
' &nbsp;<img src="%img.divider1.gif" style="vertical-align:bottom;">&nbsp; '+
' <span id="%id.locktools"><img id="%id.button_lock" src="%img.lock.gif" style="vertical-align:bottom;">'+
' <img id="%id.button_unlock" src="%img.unlock.gif" style="vertical-align:bottom;">'+
' &nbsp;<img src="%img.divider1.gif" style="vertical-align:bottom;">&nbsp;</span> '+
'<img id="%id.button_filldown" src="%img.filldown.gif" style="vertical-align:bottom;">'+
' <img id="%id.button_fillright" src="%img.fillright.gif" style="vertical-align:bottom;">'+
' &nbsp;<img src="%img.divider1.gif" style="vertical-align:bottom;">&nbsp; '+
'<img id="%id.button_movefrom" src="%img.movefromoff.gif" style="vertical-align:bottom;">'+
' <img id="%id.button_movepaste" src="%img.movepasteoff.gif" style="vertical-align:bottom;">'+
' <img id="%id.button_moveinsert" src="%img.moveinsertoff.gif" style="vertical-align:bottom;">'+
' &nbsp;<img src="%img.divider1.gif" style="vertical-align:bottom;">&nbsp; '+
'<img id="%id.button_alignleft" src="%img.alignleft.gif" style="vertical-align:bottom;">'+
' <img id="%id.button_aligncenter" src="%img.aligncenter.gif" style="vertical-align:bottom;">'+
' <img id="%id.button_alignright" src="%img.alignright.gif" style="vertical-align:bottom;">'+
' &nbsp;<img src="%img.divider1.gif" style="vertical-align:bottom;">&nbsp; '+
'<img id="%id.button_borderon" src="%img.borderson.gif" style="vertical-align:bottom;"> '+
' <img id="%id.button_borderoff" src="%img.bordersoff.gif" style="vertical-align:bottom;"> '+
' <img id="%id.button_swapcolors" src="%img.swapcolors.gif" style="vertical-align:bottom;"> '+
' &nbsp;<img src="%img.divider1.gif" style="vertical-align:bottom;">&nbsp; '+
'<img id="%id.button_merge" src="%img.merge.gif" style="vertical-align:bottom;"> '+
' <img id="%id.button_unmerge" src="%img.unmerge.gif" style="vertical-align:bottom;"> '+
' &nbsp;<img src="%img.divider1.gif" style="vertical-align:bottom;">&nbsp; '+
'<img id="%id.button_insertrow" src="%img.insertrow.gif" style="vertical-align:bottom;"> '+
' <img id="%id.button_insertcol" src="%img.insertcol.gif" style="vertical-align:bottom;"> '+
'&nbsp; <img id="%id.button_deleterow" src="%img.deleterow.gif" style="vertical-align:bottom;"> '+
' <img id="%id.button_deletecol" src="%img.deletecol.gif" style="vertical-align:bottom;"> '+
'&nbsp; <img id="%id.button_hiderow" src="%img.hiderow.gif" style="vertical-align:bottom;"> '+
' <img id="%id.button_hidecol" src="%img.hidecol.gif" style="vertical-align:bottom;"> '+
' &nbsp;<img id="%id.divider_recalc" src="%img.divider1.gif" style="vertical-align:bottom;">&nbsp; '+
'<img id="%id.button_recalc" src="%img.recalc.gif" style="vertical-align:bottom;"> '+
      ' </div>',
      oncreate: null, //function(spreadsheet, viewobject) {SocialCalc.DoCmd(null, "fill-rowcolstuff");},
      onclick: null});

   // Settings (Format)

   this.tabnums.settings = this.tabs.length;
   this.tabs.push({name: "settings", text: "Format", html:
      '<div id="%id.settingstools" style="display:none;">'+
      ' <div id="%id.sheetsettingstoolbar" style="display:none;">'+
      '  <table cellspacing="0" cellpadding="0"><tr><td>'+
      '   <div style="%tbt.">%loc!SHEET SETTINGS!:</div>'+
      '   </td></tr><tr><td>'+
      '   <input id="%id.settings-savesheet" type="button" value="%loc!Save!" onclick="SocialCalc.SettingsControlSave(\'sheet\');">'+
      '   <input type="button" value="%loc!Cancel!" onclick="SocialCalc.SettingsControlSave(\'cancel\');">'+
      '   <input type="button" value="%loc!Show Cell Settings!" onclick="SocialCalc.SpreadsheetControlSettingsSwitch(\'cell\');return false;">'+
      '   </td></tr></table>'+
      ' </div>'+
      ' <div id="%id.cellsettingstoolbar" style="display:none;">'+
      '  <table cellspacing="0" cellpadding="0"><tr><td>'+
      '   <div style="%tbt.">%loc!CELL SETTINGS!: <span id="%id.settingsecell">&nbsp;</span></div>'+
      '   </td></tr><tr><td>'+
      '  <input id="%id.settings-savecell" type="button" value="%loc!Save!" onclick="SocialCalc.SettingsControlSave(\'cell\');">'+
      '  <input type="button" value="%loc!Cancel!" onclick="SocialCalc.SettingsControlSave(\'cancel\');">'+
      '  <input type="button" value="%loc!Show Sheet Settings!" onclick="SocialCalc.SpreadsheetControlSettingsSwitch(\'sheet\');return false;">'+
      '  </td></tr></table>'+
      ' </div>'+
      '</div>',
      view: "settings",
      onclick: function(s, t) {
         SocialCalc.SettingsControls.idPrefix = s.idPrefix; // used to get color chooser div
         SocialCalc.SettingControlReset();
         var sheetattribs = s.sheet.EncodeSheetAttributes();
         var cellattribs = s.sheet.EncodeCellAttributes(s.editor.ecell.coord);
         SocialCalc.SettingsControlLoadPanel(s.views.settings.values.sheetspanel, sheetattribs);
         SocialCalc.SettingsControlLoadPanel(s.views.settings.values.cellspanel, cellattribs);
         document.getElementById(s.idPrefix+"settingsecell").innerHTML = s.editor.ecell.coord;
         SocialCalc.SpreadsheetControlSettingsSwitch("cell");
         s.views.settings.element.style.height = s.viewheight+"px";
         s.views.settings.element.firstChild.style.height = s.viewheight+"px";

         var range;  // set save message
         if (s.editor.range.hasrange) {
            range = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top) + ":" +
               SocialCalc.crToCoord(s.editor.range.right, s.editor.range.bottom);
            }
         else {
            range = s.editor.ecell.coord;
            }
         document.getElementById(s.idPrefix+"settings-savecell").value = SocialCalc.LocalizeString("Save to")+": "+range;
         },
      onclickFocus: true
         });

   this.views["settings"] = {name: "settings", values: {},
      oncreate: function(s, viewobj) {
         var scc = SocialCalc.Constants;

         viewobj.values.sheetspanel = {
//            name: "sheet",
            colorchooser: {id: s.idPrefix+"scolorchooser"},
            formatnumber: {setting: "numberformat", type: "PopupList", id: s.idPrefix+"formatnumber",
               initialdata: scc.SCFormatNumberFormats},
            formattext: {setting: "textformat", type: "PopupList", id: s.idPrefix+"formattext",
               initialdata: scc.SCFormatTextFormats},
            fontfamily: {setting: "fontfamily", type: "PopupList", id: s.idPrefix+"fontfamily",
               initialdata: scc.SCFormatFontfamilies},
            fontlook: {setting: "fontlook", type: "PopupList", id: s.idPrefix+"fontlook",
               initialdata: scc.SCFormatFontlook},
            fontsize: {setting: "fontsize", type: "PopupList", id: s.idPrefix+"fontsize",
               initialdata: scc.SCFormatFontsizes},
            textalignhoriz: {setting: "textalignhoriz", type: "PopupList", id: s.idPrefix+"textalignhoriz",
               initialdata: scc.SCFormatTextAlignhoriz},
            numberalignhoriz: {setting: "numberalignhoriz", type: "PopupList", id: s.idPrefix+"numberalignhoriz",
               initialdata: scc.SCFormatNumberAlignhoriz},
            alignvert: {setting: "alignvert", type: "PopupList", id: s.idPrefix+"alignvert",
               initialdata: scc.SCFormatAlignVertical},
            textcolor: {setting: "textcolor", type: "ColorChooser", id: s.idPrefix+"textcolor"},
            bgcolor: {setting: "bgcolor", type: "ColorChooser", id: s.idPrefix+"bgcolor"},
            padtop: {setting: "padtop", type: "PopupList", id: s.idPrefix+"padtop",
               initialdata: scc.SCFormatPadsizes},
            padright: {setting: "padright", type: "PopupList", id: s.idPrefix+"padright",
               initialdata: scc.SCFormatPadsizes},
            padbottom: {setting: "padbottom", type: "PopupList", id: s.idPrefix+"padbottom",
               initialdata: scc.SCFormatPadsizes},
            padleft: {setting: "padleft", type: "PopupList", id: s.idPrefix+"padleft",
               initialdata: scc.SCFormatPadsizes},
            colwidth: {setting: "colwidth", type: "PopupList", id: s.idPrefix+"colwidth",
               initialdata: scc.SCFormatColwidth},
            recalc: {setting: "recalc", type: "PopupList", id: s.idPrefix+"recalc",
               initialdata: scc.SCFormatRecalc},
            usermaxcol: {setting: "usermaxcol", type: "PopupList", id: s.idPrefix+"usermaxcol",
               initialdata: scc.SCFormatUserMaxCol},
            usermaxrow: {setting: "usermaxrow", type: "PopupList", id: s.idPrefix+"usermaxrow",
               initialdata: scc.SCFormatUserMaxRow}

            };
         viewobj.values.cellspanel = {
            name: "cell",
            colorchooser: {id: s.idPrefix+"scolorchooser"},
            cformatnumber: {setting: "numberformat", type: "PopupList", id: s.idPrefix+"cformatnumber",
               initialdata: scc.SCFormatNumberFormats},
            cformattext: {setting: "textformat", type: "PopupList", id: s.idPrefix+"cformattext",
               initialdata: scc.SCFormatTextFormats},
            cfontfamily: {setting: "fontfamily", type: "PopupList", id: s.idPrefix+"cfontfamily",
               initialdata: scc.SCFormatFontfamilies},
            cfontlook: {setting: "fontlook", type: "PopupList", id: s.idPrefix+"cfontlook",
               initialdata: scc.SCFormatFontlook},
            cfontsize: {setting: "fontsize", type: "PopupList", id: s.idPrefix+"cfontsize",
               initialdata: scc.SCFormatFontsizes},
            calignhoriz: {setting: "alignhoriz", type: "PopupList", id: s.idPrefix+"calignhoriz",
               initialdata: scc.SCFormatTextAlignhoriz},
            calignvert: {setting: "alignvert", type: "PopupList", id: s.idPrefix+"calignvert",
               initialdata: scc.SCFormatAlignVertical},
            ctextcolor: {setting: "textcolor", type: "ColorChooser", id: s.idPrefix+"ctextcolor"},
            cbgcolor: {setting: "bgcolor", type: "ColorChooser", id: s.idPrefix+"cbgcolor"},
            cbt: {setting: "bt", type: "BorderSide", id: s.idPrefix+"cbt"},
            cbr: {setting: "br", type: "BorderSide", id: s.idPrefix+"cbr"},
            cbb: {setting: "bb", type: "BorderSide", id: s.idPrefix+"cbb"},
            cbl: {setting: "bl", type: "BorderSide", id: s.idPrefix+"cbl"},
            cpadtop: {setting: "padtop", type: "PopupList", id: s.idPrefix+"cpadtop",
               initialdata: scc.SCFormatPadsizes},
            cpadright: {setting: "padright", type: "PopupList", id: s.idPrefix+"cpadright",
               initialdata: scc.SCFormatPadsizes},
            cpadbottom: {setting: "padbottom", type: "PopupList", id: s.idPrefix+"cpadbottom",
               initialdata: scc.SCFormatPadsizes},
            cpadleft: {setting: "padleft", type: "PopupList", id: s.idPrefix+"cpadleft",
               initialdata: scc.SCFormatPadsizes}
            };

         SocialCalc.SettingsControlInitializePanel(viewobj.values.sheetspanel);
         SocialCalc.SettingsControlInitializePanel(viewobj.values.cellspanel);
         },
      replacements: {
         itemtitle: {regex: /\%itemtitle\./g, replacement: 'style="padding:12px 10px 0px 10px;font-weight:bold;text-align:right;vertical-align:top;font-size:small;"'},
         sectiontitle: {regex: /\%sectiontitle\./g, replacement: 'style="padding:16px 10px 0px 0px;font-weight:bold;vertical-align:top;font-size:small;color:#C00;"'},
         parttitle: {regex: /\%parttitle\./g, replacement: 'style="font-weight:bold;font-size:x-small;padding:0px 0px 3px 0px;"'},
         itembody: {regex: /\%itembody\./g, replacement: 'style="padding:12px 0px 0px 0px;vertical-align:top;font-size:small;"'},
         bodypart: {regex: /\%bodypart\./g, replacement: 'style="padding:0px 10px 0px 0px;font-size:small;vertical-align:top;"'}
         },
      divStyle: "border:1px solid black;overflow:auto;",
      html:
 '<div id="%id.scolorchooser" style="display:none;position:absolute;z-index:20;"></div>'+
'<table cellspacing="0" cellpadding="0">'+
' <tr><td style="vertical-align:top;">'+
'<table id="%id.sheetsettingstable" style="display:none;" cellspacing="0" cellpadding="0">'+
'<tr>'+
' <td %itemtitle.><br>%loc!Default Format!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Number!</div>'+
'     <span id="%id.formatnumber"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Text!</div>'+
'     <span id="%id.formattext"></span>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'<tr>'+
' <td %itemtitle.><br>%loc!Default Alignment!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Text Horizontal!</div>'+
'     <span id="%id.textalignhoriz"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Number Horizontal!</div>'+
'     <span id="%id.numberalignhoriz"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Vertical!</div>'+
'     <span id="%id.alignvert"></span>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'<tr>'+
' <td %itemtitle.><br>%loc!Default Font!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Family!</div>'+
'     <span id="%id.fontfamily"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Bold &amp; Italics!</div>'+
'     <span id="%id.fontlook"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Size!</div>'+
'     <span id="%id.fontsize"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Color!</div>'+
'     <div id="%id.textcolor"></div>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Background!</div>'+
'     <div id="%id.bgcolor"></div>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'<tr>'+
' <td %itemtitle.><br>%loc!Default Padding!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Top!</div>'+
'     <span id="%id.padtop"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Right!</div>'+
'     <span id="%id.padright"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Bottom!</div>'+
'     <span id="%id.padbottom"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Left!</div>'+
'     <span id="%id.padleft"></span>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'<tr>'+
' <td %itemtitle.><br>%loc!Default Column Width!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>&nbsp;</div>'+
'     <span id="%id.colwidth"></span>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'<tr>'+
' <td %itemtitle.><br>%loc!Recalculation!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>&nbsp;</div>'+
'     <span id="%id.recalc"></span>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'<tr>'+
' <td %itemtitle.><br>%loc!Dimensions!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Columns!</div>'+
'     <span id="%id.usermaxcol"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Rows!</div>'+
'     <span id="%id.usermaxrow"></span>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'</table>'+
'<table id="%id.cellsettingstable" cellspacing="0" cellpadding="0">'+
'<tr>'+
' <td %itemtitle.><br>%loc!Format!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Number!</div>'+
'     <span id="%id.cformatnumber"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Text!</div>'+
'     <span id="%id.cformattext"></span>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'<tr>'+
' <td %itemtitle.><br>%loc!Alignment!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Horizontal!</div>'+
'     <span id="%id.calignhoriz"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Vertical!</div>'+
'     <span id="%id.calignvert"></span>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'<tr>'+
' <td %itemtitle.><br>%loc!Font!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Family!</div>'+
'     <span id="%id.cfontfamily"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Bold &amp; Italics!</div>'+
'     <span id="%id.cfontlook"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Size!</div>'+
'     <span id="%id.cfontsize"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Color!</div>'+
'     <div id="%id.ctextcolor"></div>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Background!</div>'+
'     <div id="%id.cbgcolor"></div>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'<tr>'+
' <td %itemtitle.><br>%loc!Borders!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0">'+
'    <tr><td %bodypart. colspan="3"><div %parttitle.>%loc!Top Border!</div></td>'+
'     <td %bodypart. colspan="3"><div %parttitle.>%loc!Right Border!</div></td>'+
'     <td %bodypart. colspan="3"><div %parttitle.>%loc!Bottom Border!</div></td>'+
'     <td %bodypart. colspan="3"><div %parttitle.>%loc!Left Border!</div></td>'+
'    </tr><tr>'+
'    <td %bodypart.>'+
'     <input id="%id.cbt-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">'+
'    </td>'+
'    <td %bodypart.>'+
'     <div id="%id.cbt-color"></div>'+
'    </td>'+
'    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>'+
'    <td %bodypart.>'+
'     <input id="%id.cbr-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">'+
'    </td>'+
'    <td %bodypart.>'+
'     <div id="%id.cbr-color"></div>'+
'    </td>'+
'    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>'+
'    <td %bodypart.>'+
'     <input id="%id.cbb-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">'+
'    </td>'+
'    <td %bodypart.>'+
'     <div id="%id.cbb-color"></div>'+
'    </td>'+
'    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>'+
'    <td %bodypart.>'+
'     <input id="%id.cbl-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">'+
'    </td>'+
'    <td %bodypart.>'+
'     <div id="%id.cbl-color"></div>'+
'    </td>'+
'    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'<tr>'+
' <td %itemtitle.><br>%loc!Padding!:</td>'+
' <td %itembody.>'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Top!</div>'+
'     <span id="%id.cpadtop"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Right!</div>'+
'     <span id="%id.cpadright"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Bottom!</div>'+
'     <span id="%id.cpadbottom"></span>'+
'    </td>'+
'    <td %bodypart.>'+
'     <div %parttitle.>%loc!Left!</div>'+
'     <span id="%id.cpadleft"></span>'+
'    </td>'+
'   </tr></table>'+
' </td>'+
'</tr>'+
'</table>'+
' </td><td style="vertical-align:top;padding:12px 0px 0px 12px;">'+
'  <div style="width:100px;height:100px;overflow:hidden;border:1px solid black;background-color:#EEE;padding:6px;">'+
'   <table cellspacing="0" cellpadding="0"><tr>'+
'    <td id="sample-text" style="height:100px;width:100px;"><div>%loc!This is a<br>sample!</div><div>-1234.5</div></td>'+
'   </tr></table>'+
'  </div>'+
' </td></tr></table>'+
'<br>'
      };

   // Sort

   this.tabnums.sort = this.tabs.length;
   this.tabs.push({name: "sort", text: "Sort", html:
      ' <div id="%id.sorttools" style="display:none;">'+
      '  <table cellspacing="0" cellpadding="0"><tr>'+
      '   <td style="vertical-align:top;padding-right:4px;width:160px;">'+
      '    <div style="%tbt.">%loc!Set Cells To Sort!</div>'+
      '    <select id="%id.sortlist" size="1" onfocus="%s.CmdGotFocus(this);"><option selected>[select range]</option></select>'+
      '    <input type="button" value="%loc!OK!" onclick="%s.DoCmd(this, \'ok-setsort\');" style="font-size:x-small;">'+
      '   </td>'+
      '   <td style="vertical-align:middle;padding-right:16px;width:100px;text-align:right;">'+
      '    <div style="%tbt.">&nbsp;</div>'+
      '    <input type="button" id="%id.sortbutton" value="%loc!Sort Cells! A1:A1" onclick="%s.DoCmd(this, \'dosort\');" style="visibility:hidden;">'+
      '   </td>'+
      '   <td style="vertical-align:top;padding-right:16px;">'+
      '    <table cellspacing="0" cellpadding="0"><tr>'+
      '     <td style="vertical-align:top;">'+
      '      <div style="%tbt.">%loc!Major Sort!</div>'+
      '      <select id="%id.majorsort" size="1" onfocus="%s.CmdGotFocus(this);"></select>'+
      '     </td><td>'+
      '      <input type="radio" name="majorsort" id="%id.majorsortup" value="up" checked><span style="font-size:x-small;color:#FFF;">%loc!Up!</span><br>'+
      '      <input type="radio" name="majorsort" id="%id.majorsortdown" value="down"><span style="font-size:x-small;color:#FFF;">%loc!Down!</span>'+
      '     </td>'+
      '    </tr></table>'+
      '   </td>'+
      '   <td style="vertical-align:top;padding-right:16px;">'+
      '    <table cellspacing="0" cellpadding="0"><tr>'+
      '     <td style="vertical-align:top;">'+
      '      <div style="%tbt.">%loc!Minor Sort!</div>'+
      '      <select id="%id.minorsort" size="1" onfocus="%s.CmdGotFocus(this);"></select>'+
      '     </td><td>'+
      '      <input type="radio" name="minorsort" id="%id.minorsortup" value="up" checked><span style="font-size:x-small;color:#FFF;">%loc!Up!</span><br>'+
      '      <input type="radio" name="minorsort" id="%id.minorsortdown" value="down"><span style="font-size:x-small;color:#FFF;">%loc!Down!</span>'+
      '     </td>'+
      '    </tr></table>'+
      '   </td>'+
      '   <td style="vertical-align:top;padding-right:16px;">'+
      '    <table cellspacing="0" cellpadding="0"><tr>'+
      '     <td style="vertical-align:top;">'+
      '      <div style="%tbt.">%loc!Last Sort!</div>'+
      '      <select id="%id.lastsort" size="1" onfocus="%s.CmdGotFocus(this);"></select>'+
      '     </td><td>'+
      '      <input type="radio" name="lastsort" id="%id.lastsortup" value="up" checked><span style="font-size:x-small;color:#FFF;">%loc!Up!</span><br>'+
      '      <input type="radio" name="lastsort" id="%id.lastsortdown" value="down"><span style="font-size:x-small;color:#FFF;">%loc!Down!</span>'+
      '     </td>'+
      '    </tr></table>'+
      '   </td>'+
      '  </tr></table>'+
      ' </div>',
      onclick: SocialCalc.SpreadsheetControlSortOnclick});
   this.editor.SettingsCallbacks.sort = {save: SocialCalc.SpreadsheetControlSortSave, load: SocialCalc.SpreadsheetControlSortLoad};

   // Audit

   this.tabnums.audit = this.tabs.length;
   this.tabs.push({name: "audit", text: "Audit", html:
      '<div id="%id.audittools" style="display:none;">'+
      ' <div style="%tbt.">&nbsp;</div>'+
      '</div>',
      view: "audit",
      onclick:
         function(s, t) {
            var SCLoc = SocialCalc.LocalizeString;
            var i, j;
            var str = '<table cellspacing="0" cellpadding="0" style="margin-bottom:10px;"><tr><td style="font-size:small;padding:6px;"><b>'+SCLoc("Audit Trail This Session")+':</b><br><br>';
            var stack = s.sheet.changes.stack;
            var tos = s.sheet.changes.tos;
            for (i=0; i<stack.length; i++) {
               if (i==tos+1) str += '<br></td></tr><tr><td style="font-size:small;background-color:#EEE;padding:6px;">'+SCLoc("UNDONE STEPS")+':<br>';
               for (j=0; j<stack[i].command.length; j++) {
                  str += SocialCalc.special_chars(stack[i].command[j]) + "<br>";
                  }
               }
            s.views.audit.element.innerHTML = str+"</td></tr></table>";
            SocialCalc.CmdGotFocus(true);
            },
      onclickFocus: true
         });

   this.views["audit"] = {name: "audit",
      divStyle: "border:1px solid black;overflow:auto;",
      html: 'Audit Trail'
      };

   // Comment

   this.tabnums.comment = this.tabs.length;
   this.tabs.push({name: "comment", text: "Comment", html:
      '<div id="%id.commenttools" style="display:none;">'+
      '<table cellspacing="0" cellpadding="0"><tr><td>'+
      '<textarea id="%id.commenttext" style="font-size:small;height:32px;width:600px;overflow:auto;" onfocus="%s.CmdGotFocus(this);"></textarea>'+
      '</td><td style="vertical-align:top;">'+
      '&nbsp;<input type="button" value="%loc!Save!" onclick="%s.SpreadsheetControlCommentSet();" style="font-size:x-small;">'+
      '</td></tr></table>'+
      '</div>',
      view: "sheet",
      onclick: SocialCalc.SpreadsheetControlCommentOnclick,
      onunclick: SocialCalc.SpreadsheetControlCommentOnunclick
      });

   // Names

   this.tabnums.names = this.tabs.length;
   this.tabs.push({name: "names", text: "Names", html:
      '<div id="%id.namestools" style="display:none;">'+
      '  <table cellspacing="0" cellpadding="0"><tr>'+
      '   <td style="vertical-align:top;padding-right:24px;">'+
      '    <div style="%tbt.">%loc!Existing Names!</div>'+
      '    <select id="%id.nameslist" size="1" onchange="%s.SpreadsheetControlNamesChangedName();" onfocus="%s.CmdGotFocus(this);"><option selected>[New]</option></select>'+
      '   </td>'+
      '   <td style="vertical-align:top;padding-right:6px;">'+
      '    <div style="%tbt.">%loc!Name!</div>'+
      '    <input type="text" id="%id.namesname" style="font-size:x-small;width:75px;" onfocus="%s.CmdGotFocus(this);">'+
      '   </td>'+
      '   <td style="vertical-align:top;padding-right:6px;">'+
      '    <div style="%tbt.">%loc!Description!</div>'+
      '    <input type="text" id="%id.namesdesc" style="font-size:x-small;width:150px;" onfocus="%s.CmdGotFocus(this);">'+
      '   </td>'+
      '   <td style="vertical-align:top;padding-right:6px;">'+
      '    <div style="%tbt.">%loc!Value!</div>'+
      '    <input type="text" id="%id.namesvalue" width="16" style="font-size:x-small;width:100px;" onfocus="%s.CmdGotFocus(this);">'+
      '   </td>'+
      '   <td style="vertical-align:top;padding-right:12px;width:100px;">'+
      '    <div style="%tbt.">%loc!Set Value To!</div>'+
      '    <input type="button" id="%id.namesrangeproposal" value="A1" onclick="%s.SpreadsheetControlNamesSetValue();" style="font-size:x-small;">'+
      '   </td>'+
      '   <td style="vertical-align:top;padding-right:6px;">'+
      '    <div style="%tbt.">&nbsp;</div>'+
      '    <input type="button" value="%loc!Save!" onclick="%s.SpreadsheetControlNamesSave();" style="font-size:x-small;">'+
      '    <input type="button" value="%loc!Delete!" onclick="%s.SpreadsheetControlNamesDelete()" style="font-size:x-small;">'+
      '   </td>'+
      '  </tr></table>'+
      '</div>',
      view: "sheet",
      onclick: SocialCalc.SpreadsheetControlNamesOnclick,
      onunclick: SocialCalc.SpreadsheetControlNamesOnunclick
      });

   // Clipboard

   this.tabnums.clipboard = this.tabs.length;
   this.tabs.push({name: "clipboard", text: "Clipboard", html:
      '<div id="%id.clipboardtools" style="display:none;">'+
      '  <table cellspacing="0" cellpadding="0"><tr>'+
      '   <td style="vertical-align:top;padding-right:24px;">'+
      '    <div style="%tbt.">'+
      '     &nbsp;'+
      '    </div>'+
      '   </td>'+
      '  </tr></table>'+
      '</div>',
      view: "clipboard",
      onclick: SocialCalc.SpreadsheetControlClipboardOnclick,
      onclickFocus: "clipboardtext"
      });

   this.views["clipboard"] = {name: "clipboard", divStyle: "overflow:auto;", html:
      ' <div style="font-size:x-small;padding:5px 0px 10px 0px;">'+
      '  <b>%loc!Display Clipboard in!:</b>'+
      '  <input type="radio" id="%id.clipboardformat-tab" name="%id.clipboardformat" checked onclick="%s.SpreadsheetControlClipboardFormat(\'tab\');"> %loc!Tab-delimited format! &nbsp;'+
      '  <input type="radio" id="%id.clipboardformat-csv" name="%id.clipboardformat" onclick="%s.SpreadsheetControlClipboardFormat(\'csv\');"> %loc!CSV format! &nbsp;'+
      '  <input type="radio" id="%id.clipboardformat-scsave" name="%id.clipboardformat" onclick="%s.SpreadsheetControlClipboardFormat(\'scsave\');"> %loc!SocialCalc-save format!'+
      ' </div>'+
      ' <input type="button" value="%loc!Load SocialCalc Clipboard With This!" style="font-size:x-small;" onclick="%s.SpreadsheetControlClipboardLoad();">&nbsp; '+
      ' <input type="button" value="%loc!Clear SocialCalc Clipboard!" style="font-size:x-small;" onclick="%s.SpreadsheetControlClipboardClear();">&nbsp; '+
      ' <br>'+
      ' <textarea id="%id.clipboardtext" style="font-size:small;height:350px;width:800px;overflow:auto;" onfocus="%s.CmdGotFocus(this);"></textarea>'
      };

   return;

   }

// Methods:

SocialCalc.SpreadsheetControl.prototype.InitializeSpreadsheetControl =
   function(node, height, width, spacebelow) {return SocialCalc.InitializeSpreadsheetControl(this, node, height, width, spacebelow);};
SocialCalc.SpreadsheetControl.prototype.DoOnResize = function() {return SocialCalc.DoOnResize(this);};
SocialCalc.SpreadsheetControl.prototype.SizeSSDiv = function() {return SocialCalc.SizeSSDiv(this);};
SocialCalc.SpreadsheetControl.prototype.ExecuteCommand = 
   function(combostr, sstr) {return SocialCalc.SpreadsheetControlExecuteCommand(this, combostr, sstr);};
SocialCalc.SpreadsheetControl.prototype.CreateSheetHTML = 
   function() {return SocialCalc.SpreadsheetControlCreateSheetHTML(this);};
SocialCalc.SpreadsheetControl.prototype.CreateSpreadsheetSave = 
   function(otherparts) {return SocialCalc.SpreadsheetControlCreateSpreadsheetSave(this, otherparts);};
SocialCalc.SpreadsheetControl.prototype.DecodeSpreadsheetSave = 
   function(str) {return SocialCalc.SpreadsheetControlDecodeSpreadsheetSave(this, str);};
SocialCalc.SpreadsheetControl.prototype.CreateCellHTML = 
   function(coord) {return SocialCalc.SpreadsheetControlCreateCellHTML(this, coord);};
SocialCalc.SpreadsheetControl.prototype.CreateCellHTMLSave = 
   function(range) {return SocialCalc.SpreadsheetControlCreateCellHTMLSave(this, range);};


// Sheet Methods to make things a little easier:

SocialCalc.SpreadsheetControl.prototype.ParseSheetSave = function(str) {return this.sheet.ParseSheetSave(str);};
SocialCalc.SpreadsheetControl.prototype.CreateSheetSave = function() {return this.sheet.CreateSheetSave();};


// Functions:

//
// InitializeSpreadsheetControl(spreadsheet, node, height, width, spacebelow)
//
// Creates the control elements and makes them the child of node (string or element).
// If present, height and width specify size.
// If either is 0 or null (missing), the maximum that fits on the screen
// (taking spacebelow into account) is used.
//
// Displays the tabs and creates the views (other than "sheet").
// The first tab is set as selected, but onclick is not invoked.
//
// You should do a redisplay or recalc (which redisplays) after running this.
//

SocialCalc.InitializeSpreadsheetControl = function(spreadsheet, node, height, width, spacebelow) {

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

   // create node to hold spreadsheet control

   spreadsheet.spreadsheetDiv = document.createElement("div");

   spreadsheet.SizeSSDiv(); // calculate and fill in the size values

   for (child=node.firstChild; child!=null; child=node.firstChild) {
      node.removeChild(child);
      }

   // create the tabbed UI at the top

   html = '<div><div style="'+spreadsheet.toolbarbackground+'padding:12px 10px 10px 4px;height:40px;">';

   for (i=0; i<tabs.length; i++) {
      html += tabs[i].html;
      }

   html += '</div>'+
      '<div style="'+spreadsheet.tabbackground+'padding-bottom:4px;margin:0px 0px 8px 0px;">'+
      '<table cellpadding="0" cellspacing="0"><tr>';

   for (i=0; i<tabs.length; i++) {
      html += '  <td id="%id.' + tabs[i].name + 'tab" style="' +
         (i==0 ? spreadsheet.tabselectedCSS : spreadsheet.tabplainCSS) +
         '" onclick="%s.SetTab(this);">' + SCLoc(tabs[i].text) + '</td>';
      }

   html += ' </tr></table></div></div>';

   spreadsheet.currentTab = 0; // this is where we started

   for (style in spreadsheet.tabreplacements) {
      html = html.replace(spreadsheet.tabreplacements[style].regex, spreadsheet.tabreplacements[style].replacement);
      }
   html = html.replace(/\%s\./g, "SocialCalc.");
   html = html.replace(/\%id\./g, spreadsheet.idPrefix);
   html = html.replace(/\%tbt\./g, spreadsheet.toolbartext);
   html = html.replace(/\%img\./g, spreadsheet.imagePrefix);

   html = SCLocSS(html); // localize with %loc!string! and %scc!constant!

   spreadsheet.spreadsheetDiv.innerHTML = html;

   node.appendChild(spreadsheet.spreadsheetDiv);

   // Initialize SocialCalc buttons

spreadsheet.Buttons = {
   button_undo: {tooltip: "Undo", command: "undo"},
   button_redo: {tooltip: "Redo", command: "redo"},
   button_copy: {tooltip: "Copy", command: "copy"},
   button_cut: {tooltip: "Cut", command: "cut"},
   button_paste: {tooltip: "Paste", command: "paste"},
   button_pasteformats: {tooltip: "Paste Formats", command: "pasteformats"},
   button_lock: {tooltip: "Lock", command: "lock"},
   button_unlock: {tooltip: "Unlock", command: "unlock"},
   button_delete: {tooltip: "Delete Contents", command: "delete"},
   button_filldown: {tooltip: "Fill Down", command: "filldown"},
   button_fillright: {tooltip: "Fill Right", command: "fillright"},
   button_movefrom: {tooltip: "Set/Clear Move From", command: "movefrom"},
   button_movepaste: {tooltip: "Move Paste", command: "movepaste"},
   button_moveinsert: {tooltip: "Move Insert", command: "moveinsert"},
   button_alignleft: {tooltip: "Align Left", command: "align-left"},
   button_aligncenter: {tooltip: "Align Center", command: "align-center"},
   button_alignright: {tooltip: "Align Right", command: "align-right"},
   button_borderon: {tooltip: "Borders On", command: "borderon"},
   button_borderoff: {tooltip: "Borders Off", command: "borderoff"},
   button_swapcolors: {tooltip: "Swap Colors", command: "swapcolors"},
   button_merge: {tooltip: "Merge Cells", command: "merge"},
   button_unmerge: {tooltip: "Unmerge Cells", command: "unmerge"},
   button_insertrow: {tooltip: "Insert Row", command: "insertrow"},
   button_insertcol: {tooltip: "Insert Column", command: "insertcol"},
   button_deleterow: {tooltip: "Delete Row", command: "deleterow"},
   button_deletecol: {tooltip: "Delete Column", command: "deletecol"},
   button_hiderow: {tooltip: "Hide Row", command: "hiderow"},
   button_hidecol: {tooltip: "Hide Column", command: "hidecol"},
   button_recalc: {tooltip: "Recalc", command: "recalc"}
   }

   for (button in spreadsheet.Buttons) {
      bele = document.getElementById(spreadsheet.idPrefix+button);
      if (!bele) {alert("Button "+(spreadsheet.idPrefix+button)+" missing"); continue;}
      bele.style.border = "1px solid "+scc.ISCButtonBorderNormal;
      SocialCalc.TooltipRegister(bele, SCLoc(spreadsheet.Buttons[button].tooltip), {}, spreadsheet.spreadsheetDiv);
      SocialCalc.ButtonRegister(spreadsheet.editor, bele,
         {normalstyle: "border:1px solid "+scc.ISCButtonBorderNormal+";backgroundColor:"+scc.ISCButtonBorderNormal+";",
          hoverstyle: "border:1px solid "+scc.ISCButtonBorderHover+";backgroundColor:"+scc.ISCButtonBorderNormal+";",
          downstyle: "border:1px solid "+scc.ISCButtonBorderDown+";backgroundColor:"+scc.ISCButtonDownBackground+";"}, 
         {MouseDown: SocialCalc.DoButtonCmd, command: spreadsheet.Buttons[button].command});
      }

   // create formula bar

   spreadsheet.formulabarDiv = document.createElement("div");
   spreadsheet.formulabarDiv.style.height = spreadsheet.formulabarheight + "px";
   spreadsheet.formulabarDiv.innerHTML = '<input type="text" size="60" value="">&nbsp;'; //'<textarea rows="4" cols="60" style="z-index:5;background-color:white;position:relative;"></textarea>&nbsp;';
   spreadsheet.spreadsheetDiv.appendChild(spreadsheet.formulabarDiv);
   var inputbox = new SocialCalc.InputBox(spreadsheet.formulabarDiv.firstChild, spreadsheet.editor);

   for (button in spreadsheet.formulabuttons) {
      bele = document.createElement("img");
      bele.id = spreadsheet.idPrefix+button;
      bele.src = (spreadsheet.formulabuttons[button].skipImagePrefix ? "" : spreadsheet.imagePrefix)+spreadsheet.formulabuttons[button].image;
      bele.style.verticalAlign = "middle";
      bele.style.border = "1px solid #FFF";
      bele.style.marginLeft = "4px";
      SocialCalc.TooltipRegister(bele, SCLoc(spreadsheet.formulabuttons[button].tooltip), {}, spreadsheet.spreadsheetDiv);
      SocialCalc.ButtonRegister(spreadsheet.editor, bele,
         {normalstyle: "border:1px solid #FFF;backgroundColor:#FFF;",
          hoverstyle: "border:1px solid #CCC;backgroundColor:#FFF;",
          downstyle: "border:1px solid #000;backgroundColor:#FFF;"}, 
         {MouseDown: spreadsheet.formulabuttons[button].command, Disabled: function() {return spreadsheet.editor.ECellReadonly();}});
      
      spreadsheet.formulabarDiv.appendChild(bele);
      }

   // initialize tabs that need it

   for (i=0; i<tabs.length; i++) { // execute any tab-specific initialization code
      if (tabs[i].oncreate) {
         tabs[i].oncreate(spreadsheet, tabs[i].name);
         }
      }

   // create sheet view and others

   spreadsheet.nonviewheight = spreadsheet.statuslineheight +
      spreadsheet.spreadsheetDiv.firstChild.offsetHeight +
      spreadsheet.spreadsheetDiv.lastChild.offsetHeight;
   spreadsheet.viewheight = spreadsheet.height-spreadsheet.nonviewheight;
   spreadsheet.editorDiv=spreadsheet.editor.CreateTableEditor(spreadsheet.width, spreadsheet.viewheight);

   spreadsheet.spreadsheetDiv.appendChild(spreadsheet.editorDiv);

   for (vname in views) {
      html = views[vname].html;
      for (style in views[vname].replacements) {
         html = html.replace(views[vname].replacements[style].regex, views[vname].replacements[style].replacement);
         }
      html = html.replace(/\%s\./g, "SocialCalc.");
      html = html.replace(/\%id\./g, spreadsheet.idPrefix);
      html = html.replace(/\%tbt\./g, spreadsheet.toolbartext);
      html = html.replace(/\%img\./g, spreadsheet.imagePrefix);
      v = document.createElement("div");
      SocialCalc.setStyles(v, views[vname].divStyle);
      v.style.display = "none";
      v.style.width = spreadsheet.width + "px";
      v.style.height = spreadsheet.viewheight + "px";
      v.id = spreadsheet.idPrefix + views[vname].name + "view";

      html = SCLocSS(html); // localize with %loc!string!, etc.

      v.innerHTML = html;
      spreadsheet.spreadsheetDiv.appendChild(v);
      views[vname].element = v;
      if (views[vname].oncreate) {
         views[vname].oncreate(spreadsheet, views[vname]);
         }
      }

   views.sheet = {name: "sheet", element: spreadsheet.editorDiv};

   // create statusline

   spreadsheet.statuslineDiv = document.createElement("div");
   spreadsheet.statuslineDiv.style.cssText = spreadsheet.statuslineCSS;
   spreadsheet.statuslineDiv.style.height = spreadsheet.statuslineheight -
      (spreadsheet.statuslineDiv.style.paddingTop.slice(0,-2)-0) -
      (spreadsheet.statuslineDiv.style.paddingBottom.slice(0,-2)-0) + "px";
   spreadsheet.statuslineDiv.id = spreadsheet.idPrefix+"statusline";
   spreadsheet.spreadsheetDiv.appendChild(spreadsheet.statuslineDiv);

   // set current control object based on mouseover

   if (spreadsheet.spreadsheetDiv.addEventListener) { // DOM Level 2 -- Firefox, et al
      spreadsheet.spreadsheetDiv.addEventListener("mousedown", function() { SocialCalc.SetSpreadsheetControlObject(spreadsheet); }, false);
      spreadsheet.spreadsheetDiv.addEventListener("mouseover", function() { SocialCalc.SetSpreadsheetControlObject(spreadsheet); }, false);
      }
   else if (spreadsheet.spreadsheetDiv.attachEvent) { // IE 5+
      spreadsheet.spreadsheetDiv.attachEvent("onmousedown", function() { SocialCalc.SetSpreadsheetControlObject(spreadsheet); });
      spreadsheet.spreadsheetDiv.attachEvent("onmouseover", function() { SocialCalc.SetSpreadsheetControlObject(spreadsheet); });
      }
   else { // don't handle this
      throw SocialCalc.Constants.s_BrowserNotSupported;
      }

   // done - refresh screen needed

   return;

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
// obj = GetSpreadsheetControlObject()
//
// Returns the current spreadsheet control object
//

SocialCalc.GetSpreadsheetControlObject = function() {

   var csco = SocialCalc.CurrentSpreadsheetControlObject;
   if (csco) return csco;

//   throw ("No current SpreadsheetControl object.");

   }

//
// SetSpreadsheetControlObject(spreadsheet)
//

SocialCalc.SetSpreadsheetControlObject = function(spreadsheet) {

   SocialCalc.CurrentSpreadsheetControlObject = spreadsheet;

   if (SocialCalc.Keyboard.focusTable && spreadsheet) {
      SocialCalc.Keyboard.focusTable = spreadsheet.editor;
      }

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
// SocialCalc.SetTab(obj)
//
// The obj argument is either a string with the tab name or a DOM element with an ID
//

SocialCalc.SetTab = function(obj) {

   var newtab, tname, newtabnum, newview, i, vname, ele;
   var menutabs = {};
   var tools = {};
   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var tabs = spreadsheet.tabs;
   var views = spreadsheet.views;

   if (typeof obj == "string") {
      newtab = obj;
      }
   else {
      newtab = obj.id.slice(spreadsheet.idPrefix.length,-3);
      }

   if (spreadsheet.editor.busy && // if busy and switching from "sheet", ignore
         (!tabs[spreadsheet.currentTab].view || tabs[spreadsheet.currentTab].view=="sheet")) {
      for (i=0; i<tabs.length; i++) {
         if(tabs[i].name==newtab && (tabs[i].view && tabs[i].view!="sheet")) {
            return;
            }
         }
      }

   if (spreadsheet.tabs[spreadsheet.currentTab].onunclick) {
      spreadsheet.tabs[spreadsheet.currentTab].onunclick(spreadsheet, spreadsheet.tabs[spreadsheet.currentTab].name);
      }

   for (i=0; i<tabs.length; i++) {
      tname = tabs[i].name;
      menutabs[tname] = document.getElementById(spreadsheet.idPrefix+tname+"tab");
      tools[tname] = document.getElementById(spreadsheet.idPrefix+tname+"tools");
      if (tname==newtab) {
         newtabnum = i;
         tools[tname].style.display = "block";
         menutabs[tname].style.cssText = spreadsheet.tabselectedCSS;
         }
      else {
         tools[tname].style.display = "none";
         menutabs[tname].style.cssText = spreadsheet.tabplainCSS;
         }
      }

   spreadsheet.currentTab = newtabnum;

   if (tabs[newtabnum].onclick) {
      tabs[newtabnum].onclick(spreadsheet, newtab);
      }

   for (vname in views) {
      if ((!tabs[newtabnum].view && vname == "sheet") || tabs[newtabnum].view == vname) {
         views[vname].element.style.display = "block";
         newview = vname;
         }
      else {
         views[vname].element.style.display = "none";
         }
      }

   if (tabs[newtabnum].onclickFocus) {
      ele = tabs[newtabnum].onclickFocus;
      if (typeof ele == "string") {
         ele = document.getElementById(spreadsheet.idPrefix+ele);
         ele.focus();
         }
      SocialCalc.CmdGotFocus(ele);
      }
   else {
      SocialCalc.KeyboardFocus();
      }

   if (views[newview].needsresize && views[newview].onresize) {
      views[newview].needsresize = false;
      views[newview].onresize(spreadsheet, views[newview]);
      }

   if (newview == "sheet") {
      spreadsheet.statuslineDiv.style.display = "block";
      spreadsheet.editor.ScheduleRender();
      }
   else {
      spreadsheet.statuslineDiv.style.display = "none";
      }

   return;

   }

//
// SocialCalc.SpreadsheetControlStatuslineCallback
//

SocialCalc.SpreadsheetControlStatuslineCallback = function(editor, status, arg, params) {

   var rele1, rele2;

   var ele = document.getElementById(params.statuslineid);

   if (ele) {
      ele.innerHTML = editor.GetStatuslineString(status, arg, params);
      }

   switch (status) {
      case "cmdendnorender":
      case "calcfinished":
      case "doneposcalc":
         rele1 = document.getElementById(params.recalcid1);
         rele2 = document.getElementById(params.recalcid2);
         if (!rele1 || !rele2) break;
         if (editor.context.sheetobj.attribs.needsrecalc=="yes") {
            rele1.style.display = "inline";
            rele2.style.display = "inline";
            }
         else {
            rele1.style.display = "none";
            rele2.style.display = "none";
            }
         break;

      default:
         break;
      }

   }


//
// SocialCalc.UpdateSortRangeProposal(editor)
//
// Updates sort range proposed in the UI in element idPrefix+sortlist
//

SocialCalc.UpdateSortRangeProposal = function(editor) {

   var ele = document.getElementById(SocialCalc.GetSpreadsheetControlObject().idPrefix+"sortlist");
   if (editor.range.hasrange) {
      ele.options[0].text = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" +
                            SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
      }
   else {
      ele.options[0].text = SocialCalc.LocalizeString("[select range]");
      }

   }

//
// SocialCalc.LoadColumnChoosers(spreadsheet)
//
// Updates list of columns for choosing which to sort for Major, Minor, and Last sort
//

SocialCalc.LoadColumnChoosers = function(spreadsheet) {

   var SCLoc = SocialCalc.LocalizeString;

   var sortrange, nrange, rparts, col, colname, sele, oldindex;

   if (spreadsheet.sortrange && spreadsheet.sortrange.indexOf(":")==-1) { // sortrange is a named range
      nrange = SocialCalc.Formula.LookupName(spreadsheet.sheet, spreadsheet.sortrange || "");
      if (nrange.type == "range") {
         rparts = nrange.value.match(/^(.*)\|(.*)\|$/);
         sortrange = rparts[1] + ":" + rparts[2];
         }
      else {
         sortrange = "A1:A1";
         }
      }
   else {
      sortrange = spreadsheet.sortrange;
      }
   var range = SocialCalc.ParseRange(sortrange);
   sele = document.getElementById(spreadsheet.idPrefix+"majorsort");
   oldindex = sele.selectedIndex;
   sele.options.length = 0;
   sele.options[sele.options.length] = new Option(SCLoc("[None]"), "");
   for (var col=range.cr1.col; col<=range.cr2.col; col++) {
      colname = SocialCalc.rcColname(col);
      sele.options[sele.options.length] = new Option(SCLoc("Column ")+colname, colname);
      }
   sele.selectedIndex = oldindex > 1 && oldindex <= (range.cr2.col-range.cr1.col+1) ? oldindex : 1; // restore what was there if reasonable
   sele = document.getElementById(spreadsheet.idPrefix+"minorsort");
   oldindex = sele.selectedIndex;
   sele.options.length = 0;
   sele.options[sele.options.length] = new Option(SCLoc("[None]"), "");
   for (var col=range.cr1.col; col<=range.cr2.col; col++) {
      colname = SocialCalc.rcColname(col);
      sele.options[sele.options.length] = new Option(colname, colname);
      }
   sele.selectedIndex = oldindex > 0 && oldindex <= (range.cr2.col-range.cr1.col+1) ? oldindex : 0; // default to [none]
   sele = document.getElementById(spreadsheet.idPrefix+"lastsort");
   oldindex = sele.selectedIndex;
   sele.options.length = 0;
   sele.options[sele.options.length] = new Option(SCLoc("[None]"), "");
   for (var col=range.cr1.col; col<=range.cr2.col; col++) {
      colname = SocialCalc.rcColname(col);
      sele.options[sele.options.length] = new Option(colname, colname);
      }
   sele.selectedIndex = oldindex > 0 && oldindex <= (range.cr2.col-range.cr1.col+1) ? oldindex : 0; // default to [none]

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
// SocialCalc.DoButtonCmd(e, buttoninfo, bobj)
//

SocialCalc.DoButtonCmd = function(e, buttoninfo, bobj) {

   SocialCalc.DoCmd(bobj.element, bobj.functionobj.command);

   }

//
// SocialCalc.DoCmd(obj, which)
//
// xxx
//

SocialCalc.DoCmd = function(obj, which) {

   var combostr, sstr, cl, i, clele, slist, slistele, str, sele, rele, lele, ele, sortrange, nrange, rparts;
   var sheet, cell, color, bgcolor, defaultcolor, defaultbgcolor;

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;

   switch (which) {
      case "undo":
         spreadsheet.ExecuteCommand("undo", "");
         break;

      case "redo":
         spreadsheet.ExecuteCommand("redo", "");
         break;

      case "fill-rowcolstuff":
      case "fill-text":
         cl = which.substring(5);
         clele = document.getElementById(spreadsheet.idPrefix+cl+"list");
         clele.length = 0;
         for (i=0; i<SocialCalc.SpreadsheetCmdTable[cl].length; i++) {
            clele.options[i] = new Option(SocialCalc.SpreadsheetCmdTable[cl][i].t);
            }
         which = "changed-"+cl; // fall through to changed code

      case "changed-rowcolstuff":
      case "changed-text":
         cl = which.substring(8);
         clele = document.getElementById(spreadsheet.idPrefix+cl+"list");
         slist = SocialCalc.SpreadsheetCmdTable.slists[SocialCalc.SpreadsheetCmdTable[cl][clele.selectedIndex].s]; // get sList for this command
         slistele = document.getElementById(spreadsheet.idPrefix+cl+"slist");
         slistele.length = 0; // reset
         for (i=0; i<(slist.length||0); i++) {
            slistele.options[i] = new Option(slist[i].t, slist[i].s);
            }
         return; // nothing else to do

      case "ok-rowcolstuff":
      case "ok-text":
         cl = which.substring(3);
         clele = document.getElementById(spreadsheet.idPrefix+cl+"list");
         slistele = document.getElementById(spreadsheet.idPrefix+cl+"slist");
         combostr = SocialCalc.SpreadsheetCmdTable[cl][clele.selectedIndex].c;
         sstr = slistele[slistele.selectedIndex].value;
         SocialCalc.SpreadsheetControlExecuteCommand(obj, combostr, sstr);
         break;

      case "ok-setsort":
         lele = document.getElementById(spreadsheet.idPrefix+"sortlist");
         if (lele.selectedIndex==0) {
            if (editor.range.hasrange) {
               spreadsheet.sortrange = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" +
                          SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
               }
            else {
               spreadsheet.sortrange = editor.ecell.coord+":"+editor.ecell.coord;
               }
            }
         else {
            spreadsheet.sortrange = lele.options[lele.selectedIndex].value;
            }
         ele = document.getElementById(spreadsheet.idPrefix+"sortbutton");
         ele.value = SocialCalc.LocalizeString("Sort ")+spreadsheet.sortrange;
         ele.style.visibility = "visible";
         SocialCalc.LoadColumnChoosers(spreadsheet);
         if (obj && obj.blur) obj.blur();
         SocialCalc.KeyboardFocus();   
         return;

      case "dosort":
         if (spreadsheet.sortrange && spreadsheet.sortrange.indexOf(":")==-1) { // sortrange is a named range
            nrange = SocialCalc.Formula.LookupName(spreadsheet.sheet, spreadsheet.sortrange || "");
            if (nrange.type != "range") return;
            rparts = nrange.value.match(/^(.*)\|(.*)\|$/);
            sortrange = rparts[1] + ":" + rparts[2];
            }
         else {
            sortrange = spreadsheet.sortrange;
            }
         if (sortrange == "A1:A1") return;
         str = "sort "+sortrange+" ";
         sele = document.getElementById(spreadsheet.idPrefix+"majorsort");
         rele = document.getElementById(spreadsheet.idPrefix+"majorsortup");
         str += sele.options[sele.selectedIndex].value + (rele.checked ? " up" : " down");
         sele = document.getElementById(spreadsheet.idPrefix+"minorsort");
         if (sele.selectedIndex>0) {
           rele = document.getElementById(spreadsheet.idPrefix+"minorsortup");
           str += " "+sele.options[sele.selectedIndex].value + (rele.checked ? " up" : " down");
           }
         sele = document.getElementById(spreadsheet.idPrefix+"lastsort");
         if (sele.selectedIndex>0) {
           rele = document.getElementById(spreadsheet.idPrefix+"lastsortup");
           str += " "+sele.options[sele.selectedIndex].value + (rele.checked ? " up" : " down");
           }
         spreadsheet.ExecuteCommand(str, "");
         break;

      case "merge":
         combostr = SocialCalc.SpreadsheetCmdLookup[which] || "";
         sstr = SocialCalc.SpreadsheetCmdSLookup[which] || "";
         spreadsheet.ExecuteCommand(combostr, sstr);
         if (editor.range.hasrange) { // set ecell to upper left
            editor.MoveECell(SocialCalc.crToCoord(editor.range.left, editor.range.top));
            editor.RangeRemove();
            }
         break;

      case "movefrom":
         if (editor.range2.hasrange) { // toggle if already there
            spreadsheet.context.cursorsuffix = "";
            editor.Range2Remove();
            spreadsheet.ExecuteCommand("redisplay", "");
            }
         else if (editor.range.hasrange) { // set range2 to range or one cell
            editor.range2.top = editor.range.top;
            editor.range2.right = editor.range.right;
            editor.range2.bottom = editor.range.bottom;
            editor.range2.left = editor.range.left;
            editor.range2.hasrange = true;
            editor.MoveECell(SocialCalc.crToCoord(editor.range.left, editor.range.top));
            }
         else {
            editor.range2.top = editor.ecell.row;
            editor.range2.right = editor.ecell.col;
            editor.range2.bottom = editor.ecell.row;
            editor.range2.left = editor.ecell.col;
            editor.range2.hasrange = true;
            }
         str = editor.range2.hasrange ? "" : "off";
         ele = document.getElementById(spreadsheet.idPrefix+"button_movefrom");
         ele.src=spreadsheet.imagePrefix+"movefrom"+str+".gif";
         ele = document.getElementById(spreadsheet.idPrefix+"button_movepaste");
         ele.src=spreadsheet.imagePrefix+"movepaste"+str+".gif";
         ele = document.getElementById(spreadsheet.idPrefix+"button_moveinsert");
         ele.src=spreadsheet.imagePrefix+"moveinsert"+str+".gif";
         if (editor.range2.hasrange) editor.RangeRemove();
         break;

      case "movepaste":
      case "moveinsert":
         if (editor.range2.hasrange) {
            spreadsheet.context.cursorsuffix = "";
            combostr = which+" "+
               SocialCalc.crToCoord(editor.range2.left, editor.range2.top) + ":" +
               SocialCalc.crToCoord(editor.range2.right, editor.range2.bottom)
               +" "+editor.ecell.coord;
            spreadsheet.ExecuteCommand(combostr, "");
            editor.Range2Remove();
            ele = document.getElementById(spreadsheet.idPrefix+"button_movefrom");
            ele.src=spreadsheet.imagePrefix+"movefromoff.gif";
            ele = document.getElementById(spreadsheet.idPrefix+"button_movepaste");
            ele.src=spreadsheet.imagePrefix+"movepasteoff.gif";
            ele = document.getElementById(spreadsheet.idPrefix+"button_moveinsert");
            ele.src=spreadsheet.imagePrefix+"moveinsertoff.gif";
            }
         break;

      case "swapcolors":
         sheet = spreadsheet.sheet;
         cell = sheet.GetAssuredCell(editor.ecell.coord);
         defaultcolor = sheet.attribs.defaultcolor ? sheet.colors[sheet.attribs.defaultcolor] : "rgb(0,0,0)";
         defaultbgcolor = sheet.attribs.defaultbgcolor ? sheet.colors[sheet.attribs.defaultbgcolor] : "rgb(255,255,255)";
         color = cell.color ? sheet.colors[cell.color] : defaultcolor; // get color
         if (color == defaultbgcolor) color = ""; // going to swap, so if same as background default, use default
         bgcolor = cell.bgcolor ? sheet.colors[cell.bgcolor] : defaultbgcolor;
         if (bgcolor == defaultcolor) bgcolor = ""; // going to swap, so if same as foreground default, use default
         spreadsheet.ExecuteCommand("set %C color "+bgcolor+"%Nset %C bgcolor "+color, "");
         break;

      default:
         combostr = SocialCalc.SpreadsheetCmdLookup[which] || "";
         sstr = SocialCalc.SpreadsheetCmdSLookup[which] || "";
         spreadsheet.ExecuteCommand(combostr, sstr);
         break;
      }

   if (obj && obj.blur) obj.blur();
   SocialCalc.KeyboardFocus();   

   }

SocialCalc.SpreadsheetCmdLookup = {
 'copy': 'copy %C all',
 'cut': 'cut %C all',
 'paste': 'paste %C all',
 'pasteformats': 'paste %C formats',
 'lock': 'set %C readonly yes',
 'unlock': 'set %C readonly no',
 'delete': 'erase %C formulas',
 'filldown': 'filldown %C all',
 'fillright': 'fillright %C all',
 'erase': 'erase %C all',
 'borderon': 'set %C bt %S%Nset %C br %S%Nset %C bb %S%Nset %C bl %S',
 'borderoff': 'set %C bt %S%Nset %C br %S%Nset %C bb %S%Nset %C bl %S',
 'merge': 'merge %C',
 'unmerge': 'unmerge %C',
 'align-left': 'set %C cellformat left',
 'align-center': 'set %C cellformat center',
 'align-right': 'set %C cellformat right',
 'align-default': 'set %C cellformat',
 'insertrow': 'insertrow %C',
 'insertcol': 'insertcol %C',
 'deleterow': 'deleterow %C',
 'deletecol': 'deletecol %C',
 'hiderow': 'set %H hide yes',
 'hidecol': 'set %W hide yes',
 'undo': 'undo',
 'redo': 'redo',
 'recalc': 'recalc'
 }

SocialCalc.SpreadsheetCmdSLookup = {
 'borderon': '1px solid rgb(0,0,0)',
 'borderoff': ''
 }

/******* NO LONGER USED

SocialCalc.SpreadsheetCmdTable = {
 cmd: [
  {t:"Fill Right", s:"ffal", c:"fillright %C %S"},
  {t:"Fill Down", s:"ffal", c:"filldown %C %S"},
  {t:"Copy", s:"all", c:"copy %C %S"},
  {t:"Cut", s:"all", c:"cut %C %S"},
  {t:"Paste", s:"ffal", c:"paste %C %S"},
  {t:"Erase", s:"ffal", c:"erase %C %S"},
  {t:"Insert", s:"rowcol", c:"insert%S %C"},
  {t:"Delete", s:"rowcol", c:"delete%S %C"},
  {t:"Merge Cells", s:"none", c:"merge %C"},
  {t:"Unmerge", s:"none", c:"unmerge %C"},
  {t:"Sort", s:"sortcol", c:"sort %R %S"},
  {t:"Cell Color", s:"colors", c:"set %C color %S"},
  {t:"Cell Background", s:"colors", c:"set %C bgcolor %S"},
  {t:"Cell Number Format", s:"ntvf", c:"set %C nontextvalueformat %S"},
  {t:"Cell Font", s:"fonts", c:"set %C font %S"},
  {t:"Cell Align", s:"cellformat", c:"set %C cellformat %S"},
  {t:"Cell Borders", s:"borderOnOff", c:"set %C bt %S%Nset %C br %S%Nset %C bb %S%Nset %C bl %S"},
  {t:"Column Width", s:"colWidths", c:"set %W width %S"},
  {t:"Default Color", s:"colors", c:"set sheet defaultcolor %S"},
  {t:"Default Background", s:"colors", c:"set sheet defaultbgcolor %S"},
  {t:"Default Number Format", s:"ntvf", c:"set sheet defaultnontextvalueformat %S"},
  {t:"Default Font", s:"fonts", c:"set sheet defaultfont %S"},
  {t:"Default Text Align", s:"cellformat", c:"set sheet defaulttextformat %S"},
  {t:"Default Number Align", s:"cellformat", c:"set sheet defaultnontextformat %S"},
  {t:"Default Column Width", s:"colWidths", c:"set sheet defaultcolwidth %S"}
  ],
 rowcolstuff: [
  {t:"Insert", s:"rowcol", c:"insert%S %C"},
  {t:"Delete", s:"rowcol", c:"delete%S %C"},
  {t:"Paste", s:"ffal", c:"paste %C %S"},
  {t:"Erase", s:"ffal", c:"erase %C %S"},
  {t:"Fill Right", s:"ffal", c:"fillright %C %S"},
  {t:"Fill Down", s:"ffal", c:"filldown %C %S"}
  ],
 text: [
  {t:"Cell Color", s:"colors", c:"set %C color %S"},
  {t:"Cell Background", s:"colors", c:"set %C bgcolor %S"},
  {t:"Cell Number Format", s:"ntvf", c:"set %C nontextvalueformat %S"},
  {t:"Cell Text Format", s:"tvf", c:"set %C textvalueformat %S"},
  {t:"Cell Font", s:"fonts", c:"set %C font %S"},
  {t:"Cell Align", s:"cellformat", c:"set %C cellformat %S"},
  {t:"Default Color", s:"colors", c:"set sheet defaultcolor %S"},
  {t:"Default Background", s:"colors", c:"set sheet defaultbgcolor %S"},
  {t:"Default Number Format", s:"ntvf", c:"set sheet defaultnontextvalueformat %S"},
  {t:"Default Text Format", s:"tvf", c:"set sheet defaulttextvalueformat %S"},
  {t:"Default Font", s:"fonts", c:"set sheet defaultfont %S"},
  {t:"Default Text Align", s:"cellformat", c:"set sheet defaulttextformat %S"},
  {t:"Default Number Align", s:"cellformat", c:"set sheet defaultnontextformat %S"}
  ],
 slists: {
  "colors": [
   {t:"Default", s:""},
   {t:"Black", s:"rgb(0,0,0)"},
   {t:"Dark Gray", s:"rgb(102,102,102)"}, // #666
   {t:"Gray", s:"rgb(204,204,204)"}, // #CCC
   {t:"White", s:"rgb(255,255,255)"},
   {t:"Red", s:"rgb(255,0,0)"},
   {t:"Dark Red", s:"rgb(153,0,0)"},
   {t:"Orange", s:"rgb(255,153,0)"},
   {t:"Yellow", s:"rgb(255,255,0)"},
   {t:"Light Yellow", s:"rgb(255,255,204)"},
   {t:"Green", s:"rgb(0,255,0)"},
   {t:"Dark Green", s:"rgb(0,153,0)"},
   {t:"Blue", s:"rgb(0,0,255)"},
   {t:"Dark Blue", s:"rgb(0,0,153)"},
   {t:"Light Blue", s:"rgb(204,204,255)"}
   ],
  "fonts": [ // style weight size family
   {t:"Default", s:""},
   {t:"Bold", s:"normal bold * *"},
   {t:"Italic", s:"italic normal * *"},
   {t:"Small", s:"* small *"},
   {t:"Medium", s:"* medium *"},
   {t:"Large", s:"* large *"},
   {t:"Bold Small", s:"normal bold small *"},
   {t:"Bold Medium", s:"normal bold medium *"},
   {t:"Bold Large", s:"normal bold large *"}
   ],
  "cellformat": [
   {t:"Default", s:""},
   {t:"Left", s:"left"},
   {t:"Right", s:"right"},
   {t:"Center", s:"center"}
   ],
  "borderOnOff": [
   {t:"On", s:"1px solid rgb(0,0,0)"},
   {t:"Off", s:""}
   ],
  "colWidths": [
   {t:"Default", s:""},
   {t:"20", s:"20"},
   {t:"40", s:"40"},
   {t:"60", s:"60"},
   {t:"80", s:"80"},
   {t:"100", s:"100"},
   {t:"120", s:"120"},
   {t:"140", s:"140"},
   {t:"160", s:"160"},
   {t:"180", s:"180"},
   {t:"200", s:"200"},
   {t:"220", s:"220"},
   {t:"240", s:"240"},
   {t:"260", s:"260"},
   {t:"280", s:"280"},
   {t:"300", s:"300"}
   ],
  "ntvf": [
   {t:"Default", s:""},
   {t:"1234", s:"0"},
   {t:"1,234", s:"#,##0"},
   {t:"1,234.5", s:"#,##0.0"},
   {t:"1,234.56", s:"#,##0.00"},
   {t:"1,234.567", s:"#,##0.000"},
   {t:"1,234%", s:"#,##0%"},
   {t:"1,234.5%", s:"#,##0.0%"},
   {t:"(1,234)", s:"#,##0_);(#,##0)"},
   {t:"(1,234.5)", s:"#,##0.0_);(#,##0.0)"},
   {t:"(1,234.56)", s:"#,##0.00_);(#,##0.00)"},
   {t:"00", s:"00"},
   {t:"000", s:"000"},
   {t:"0000", s:"0000"},
   {t:"$1,234.56", s:"$#,##0.00"},
   {t:"2006-01-04", s:"yyyy-mm-dd"},
   {t:"01:23:45", s:"hh:mm:ss"},
   {t:"2006-01-04 01:23:45", s:"yyyy-mm-dd hh:mm:ss"},
   {t:"Hidden", s:"hidden"}
   ],
  "tvf": [
   {t:"Default", s:""},
   {t:"Automatic", s:"general"},
   {t:"Plain Text", s:"text-plain"},
   {t:"HTML", s:"text-html"},
   {t:"Wiki", s:"text-wiki"},
   {t:"Hidden", s:"hidden"}
   ],
  "ffal": [ // Formulas, Formats, All
   {t:"All", s:"all"},
   {t:"Contents", s:"formulas"},
   {t:"Formats", s:"formats"}
   ],
  "all": [ // All
   {t:"All", s:"all"}
   ],
  "rowcol": [
   {t:"Row", s:"row"},
   {t:"Column", s:"col"}
   ],
  "sortcol": [
   {t:"A up", s:"A up"},
   {t:"B up", s:"B up"},
   {t:"C up", s:"C up"},
   {t:"A down", s:"A down"},
   {t:"B down", s:"B down"},
   {t:"C down", s:"C down"},
   {t:"A, B, C up", s:"A up B up C up"}
   ],
  "none": [ // nothing
   {t:" ", s:" "}
   ]
  }
 }
*********/

//
// SocialCalc.SpreadsheetControlExecuteCommand(obj, combostr, sstr)
//
// xxx
//

SocialCalc.SpreadsheetControlExecuteCommand = function(obj, combostr, sstr) {

   var i, commands;
   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var eobj = spreadsheet.editor;

   var str = {};
   str.P = "%";
   str.N = "\n"
   if (eobj.range.hasrange) {
      str.R = SocialCalc.crToCoord(eobj.range.left, eobj.range.top)+
             ":"+SocialCalc.crToCoord(eobj.range.right, eobj.range.bottom);
      str.C = str.R;
      str.W = SocialCalc.rcColname(eobj.range.left) + ":" + SocialCalc.rcColname(eobj.range.right);
      str.H = eobj.range.top + ":" + eobj.range.bottom;
      }
   else {
      str.C = eobj.ecell.coord;
      str.R = eobj.ecell.coord+":"+eobj.ecell.coord;
      str.W = SocialCalc.rcColname(SocialCalc.coordToCr(eobj.ecell.coord).col);
      str.H = SocialCalc.coordToCr(eobj.ecell.coord).row;
      }
   str.S = sstr;
   combostr = combostr.replace(/%C/g, str.C);
   combostr = combostr.replace(/%R/g, str.R);
   combostr = combostr.replace(/%N/g, str.N);
   combostr = combostr.replace(/%S/g, str.S);
   combostr = combostr.replace(/%W/g, str.W);
   combostr = combostr.replace(/%H/g, str.H);
   combostr = combostr.replace(/%P/g, str.P);

   eobj.EditorScheduleSheetCommands(combostr, true, false);

   }

//
// result = SocialCalc.SpreadsheetControlCreateSheetHTML(spreadsheet)
//
// Returns the HTML representation of the whole spreadsheet
//

SocialCalc.SpreadsheetControlCreateSheetHTML = function(spreadsheet) {

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

//
// result = SocialCalc.SpreadsheetControlCreateCellHTML(spreadsheet, coord, linkstyle)
//
// Returns the HTML representation of a cell. Blank is "", not "&nbsp;".
//

SocialCalc.SpreadsheetControlCreateCellHTML = function(spreadsheet, coord, linkstyle) {

   var result = "";
   var cell = spreadsheet.sheet.cells[coord];

   if (!cell) return "";

   if (cell.displaystring == undefined) {
      result = SocialCalc.FormatValueForDisplay(spreadsheet.sheet, cell.datavalue, coord, (linkstyle || spreadsheet.context.defaultHTMLlinkstyle));
      }
   else {
      result = cell.displaystring;
      }

   if (result == "&nbsp;") result = "";

   return result;

   }

//
// result = SocialCalc.SpreadsheetControlCreateCellHTMLSave(spreadsheet, range, linkstyle)
//
// Returns the HTML representation of a range of cells, or the whole sheet if range is null.
// The form is:
//    version:1.0
//    coord:cell-HTML
//    coord:cell-HTML
//    ...
//
// Empty cells are skipped. The cell-HTML is encoded with ":"=>"\c", newline=>"\n", and "\"=>"\b".
//

SocialCalc.SpreadsheetControlCreateCellHTMLSave = function(spreadsheet, range, linkstyle) {

   var cr1, cr2, row, col, coord, cell, cellHTML;
   var result = [];
   var prange;

   if (range) {
      prange = SocialCalc.ParseRange(range);
      }
   else {
      prange = {cr1: {row: 1, col:1},
                cr2: {row: spreadsheet.sheet.attribs.lastrow, col: spreadsheet.sheet.attribs.lastcol}};
      }
   cr1 = prange.cr1;
   cr2 = prange.cr2;

   result.push("version:1.0");

   for (row=cr1.row; row <= cr2.row; row++) {
      for (col=cr1.col; col <= cr2.col; col++) {
         coord = SocialCalc.crToCoord(col, row);
         cell=spreadsheet.sheet.cells[coord];
         if (!cell) continue;
         if (cell.displaystring == undefined) {
            cellHTML = SocialCalc.FormatValueForDisplay(spreadsheet.sheet, cell.datavalue, coord, (linkstyle || spreadsheet.context.defaultHTMLlinkstyle));
            }
         else {
            cellHTML = cell.displaystring;
            }
         if (cellHTML == "&nbsp;") continue;
         result.push(coord+":"+SocialCalc.encodeForSave(cellHTML));
         }
      }

   result.push(""); // one extra to get extra \n
   return result.join("\n");
   }

//
// Formula Bar Button Routines
//

SocialCalc.SpreadsheetControl.DoFunctionList = function() {

   var i, cname, str, f, ele;

   var scf = SocialCalc.Formula;
   var scc = SocialCalc.Constants;
   var fcl = scc.function_classlist;

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var idp = spreadsheet.idPrefix+"function";

   ele = document.getElementById(idp+"dialog");
   if (ele) return; // already have one

   scf.FillFunctionInfo();

   str = '<table><tr><td><span style="font-size:x-small;font-weight:bold">%loc!Category!</span><br>'+
      '<select id="'+idp+'class" size="'+fcl.length+'" style="width:120px;" onchange="SocialCalc.SpreadsheetControl.FunctionClassChosen(this.options[this.selectedIndex].value);">';
   for (i=0; i<fcl.length; i++) {
      str += '<option value="'+fcl[i]+'"'+(i==0?' selected>':'>')+SocialCalc.special_chars(scf.FunctionClasses[fcl[i]].name)+'</option>';
      }
   str += '</select></td><td>&nbsp;&nbsp;</td><td id="'+idp+'list"><span style="font-size:x-small;font-weight:bold">%loc!Functions!</span><br>'+
      '<select id="'+idp+'name" size="'+fcl.length+'" style="width:240px;" '+
      'onchange="SocialCalc.SpreadsheetControl.FunctionChosen(this.options[this.selectedIndex].value);" ondblclick="SocialCalc.SpreadsheetControl.DoFunctionPaste();">';
   str += SocialCalc.SpreadsheetControl.GetFunctionNamesStr("all");
   str += '</td></tr><tr><td colspan="3">'+
          '<div id="'+idp+'desc" style="width:380px;height:80px;overflow:auto;font-size:x-small;">'+SocialCalc.SpreadsheetControl.GetFunctionInfoStr(scf.FunctionClasses[fcl[0]].items[0])+'</div>'+
          '<div style="width:380px;text-align:right;padding-top:6px;font-size:small;">'+
          '<input type="button" value="%loc!Paste!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoFunctionPaste();">&nbsp;'+
          '<input type="button" value="%loc!Cancel!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.HideFunctions();"></div>'+
          '</td></tr></table>';

   var main = document.createElement("div");
   main.id = idp+"dialog";

   main.style.position = "absolute";

   var vp = SocialCalc.GetViewportInfo();
   var pos = SocialCalc.GetElementPositionWithScroll(spreadsheet.spreadsheetDiv);

   main.style.top = ((vp.height/3)-pos.top)+"px";
   main.style.left = ((vp.width/3)-pos.left)+"px";
   main.style.zIndex = 100;
   main.style.backgroundColor = "#FFF";
   main.style.border = "1px solid black";

   main.style.width = "400px";

   str = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr>'+
      '<td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">'+"&nbsp;%loc!Function List!"+'</td>'+
      '<td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.SpreadsheetControl.HideFunctions();">&nbsp;X&nbsp;</td></tr></table>'+
      '<div style="background-color:#DDD;">'+str+'</div>';

   str = SocialCalc.LocalizeSubstrings(str);

   main.innerHTML = str;

   SocialCalc.DragRegister(main.firstChild.firstChild.firstChild.firstChild, true, true,
                 {MouseDown: SocialCalc.DragFunctionStart, 
                  MouseMove: SocialCalc.DragFunctionPosition,
                  MouseUp: SocialCalc.DragFunctionPosition,
                  Disabled: null, positionobj: main},
                  spreadsheet.spreadsheetDiv);

   spreadsheet.spreadsheetDiv.appendChild(main);

   ele = document.getElementById(idp+"name");
   ele.focus();
   SocialCalc.CmdGotFocus(ele);
//!!! need to do keyboard handling: if esc, hide; if All, letter scrolls to there

   }

SocialCalc.SpreadsheetControl.GetFunctionNamesStr = function(cname) {

   var i, f;
   var scf = SocialCalc.Formula;
   var str = "";

   f = scf.FunctionClasses[cname];
   for (i=0; i<f.items.length; i++) {
      str += '<option value="'+f.items[i]+'"'+(i==0?' selected>':'>')+f.items[i]+'</option>';
      }

   return str;

   }

SocialCalc.SpreadsheetControl.FillFunctionNames = function(cname, ele) {

   var i, f;
   var scf = SocialCalc.Formula;

   ele.length = 0;
   f = scf.FunctionClasses[cname];
   for (i=0; i<f.items.length; i++) {
      ele.options[i] = new Option(f.items[i], f.items[i]);
      if (i==0) {
         ele.options[i].selected = true;
         }
      }
   }

SocialCalc.SpreadsheetControl.GetFunctionInfoStr = function(fname) {
   
   var scf = SocialCalc.Formula;
   var f = scf.FunctionList[fname];
   var scsc = SocialCalc.special_chars;

   var str = "<b>"+fname+"("+scsc(scf.FunctionArgString(fname))+")</b><br>";
   str += scsc(f[3]);

   return str;

   }

SocialCalc.SpreadsheetControl.FunctionClassChosen = function(cname) {

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var idp = spreadsheet.idPrefix+"function";
   var scf = SocialCalc.Formula;

   SocialCalc.SpreadsheetControl.FillFunctionNames(cname, document.getElementById(idp+"name"));

   SocialCalc.SpreadsheetControl.FunctionChosen(scf.FunctionClasses[cname].items[0]);

   }

SocialCalc.SpreadsheetControl.FunctionChosen = function(fname) {

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var idp = spreadsheet.idPrefix+"function";

   document.getElementById(idp+"desc").innerHTML = SocialCalc.SpreadsheetControl.GetFunctionInfoStr(fname);

   }

SocialCalc.SpreadsheetControl.HideFunctions = function() {

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();

   var ele = document.getElementById(spreadsheet.idPrefix+"functiondialog");
   ele.innerHTML = "";

   SocialCalc.DragUnregister(ele);

   SocialCalc.KeyboardFocus();

   if (ele.parentNode) {
      ele.parentNode.removeChild(ele);
      }

   }

SocialCalc.SpreadsheetControl.DoFunctionPaste = function() {

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;
   var ele = document.getElementById(spreadsheet.idPrefix+"functionname");
   var mele = document.getElementById(spreadsheet.idPrefix+"multilinetextarea");

   var text = ele.value+"(";

   SocialCalc.SpreadsheetControl.HideFunctions();

   if (mele) { // multi-line editing is in progress
      mele.value += text;
      mele.focus();
      SocialCalc.CmdGotFocus(mele);
      }
   else {
      editor.EditorAddToInput(text, "=");
      }

   }


SocialCalc.SpreadsheetControl.DoMultiline = function() {

   var SCLocSS = SocialCalc.LocalizeSubstrings;

   var str, ele, text;

   var scc = SocialCalc.Constants;
   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;
   var wval = editor.workingvalues;

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var idp = spreadsheet.idPrefix+"multiline";

   ele = document.getElementById(idp+"dialog");
   if (ele) return; // already have one

   switch (editor.state) {
      case "start":
         wval.ecoord = editor.ecell.coord;
         wval.erow = editor.ecell.row;
         wval.ecol = editor.ecell.col;
         editor.RangeRemove();
         text = SocialCalc.GetCellContents(editor.context.sheetobj, wval.ecoord);
         break;

      case "input":
      case "inputboxdirect":
         text = editor.inputBox.GetText();
         break;
      }

   editor.inputBox.element.disabled = true;

   text = SocialCalc.special_chars(text);

   str = '<textarea id="'+idp+'textarea" style="width:380px;height:120px;margin:10px 0px 0px 6px;">'+text+'</textarea>'+
         '<div style="width:380px;text-align:right;padding:6px 0px 4px 6px;font-size:small;">'+
         SCLocSS('<input type="button" value="%loc!Set Cell Contents!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoMultilinePaste();">&nbsp;'+
         '<input type="button" value="%loc!Clear!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoMultilineClear();">&nbsp;'+
         '<input type="button" value="%loc!Cancel!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.HideMultiline();"></div>'+
         '</div>');

   var main = document.createElement("div");
   main.id = idp+"dialog";

   main.style.position = "absolute";

   var vp = SocialCalc.GetViewportInfo();
   var pos = SocialCalc.GetElementPositionWithScroll(spreadsheet.spreadsheetDiv);

   main.style.top = ((vp.height/3)-pos.top)+"px";
   main.style.left = ((vp.width/3)-pos.left)+"px";
   main.style.zIndex = 100;
   main.style.backgroundColor = "#FFF";
   main.style.border = "1px solid black";

   main.style.width = "400px";

   main.innerHTML = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr>'+
      '<td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">'+
      SCLocSS("&nbsp;%loc!Multi-line Input Box!")+'</td>'+
      '<td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.SpreadsheetControl.HideMultiline();">&nbsp;X&nbsp;</td></tr></table>'+
      '<div style="background-color:#DDD;">'+str+'</div>';

   SocialCalc.DragRegister(main.firstChild.firstChild.firstChild.firstChild, true, true, 
                 {MouseDown: SocialCalc.DragFunctionStart, 
                  MouseMove: SocialCalc.DragFunctionPosition,
                  MouseUp: SocialCalc.DragFunctionPosition,
                  Disabled: null, positionobj: main},
                  spreadsheet.spreadsheetDiv);

   spreadsheet.spreadsheetDiv.appendChild(main);

   ele = document.getElementById(idp+"textarea");
   ele.focus();
   SocialCalc.CmdGotFocus(ele);
//!!! need to do keyboard handling: if esc, hide?

   }


SocialCalc.SpreadsheetControl.HideMultiline = function() {

   var scc = SocialCalc.Constants;
   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;

   var ele = document.getElementById(spreadsheet.idPrefix+"multilinedialog");
   ele.innerHTML = "";

   SocialCalc.DragUnregister(ele);

   SocialCalc.KeyboardFocus();

   if (ele.parentNode) {
      ele.parentNode.removeChild(ele);
      }

   switch (editor.state) {
      case "start":
         editor.inputBox.DisplayCellContents(null);
         break;

      case "input":
      case "inputboxdirect":
         editor.inputBox.element.disabled = false;
         editor.inputBox.Focus();
         break;
      }

   }

SocialCalc.SpreadsheetControl.DoMultilineClear = function() {

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();

   var ele = document.getElementById(spreadsheet.idPrefix+"multilinetextarea");

   ele.value = "";
   ele.focus();

   }


SocialCalc.SpreadsheetControl.DoMultilinePaste = function() {

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;
   var wval = editor.workingvalues;

   var ele = document.getElementById(spreadsheet.idPrefix+"multilinetextarea");

   var text = ele.value;

   SocialCalc.SpreadsheetControl.HideMultiline();

   switch (editor.state) {
      case "start":
         wval.partialexpr = "";
         wval.ecoord = editor.ecell.coord;
         wval.erow = editor.ecell.row;
         wval.ecol = editor.ecell.col;
         break;
      case "input":
      case "inputboxdirect":
         editor.inputBox.Blur();
         editor.inputBox.ShowInputBox(false);
         editor.state = "start";
         break;
      }

   editor.EditorSaveEdit(text);

   }


SocialCalc.SpreadsheetControl.DoLink = function() {

   var SCLoc = SocialCalc.LocalizeString;

   var str, ele, text, cell, setformat, popup;

   var scc = SocialCalc.Constants;
   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;
   var wval = editor.workingvalues;

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var idp = spreadsheet.idPrefix+"link";

   ele = document.getElementById(idp+"dialog");
   if (ele) return; // already have one

   switch (editor.state) {
      case "start":
         wval.ecoord = editor.ecell.coord;
         wval.erow = editor.ecell.row;
         wval.ecol = editor.ecell.col;
         editor.RangeRemove();
         text = SocialCalc.GetCellContents(editor.context.sheetobj, wval.ecoord);
         break;

      case "input":
      case "inputboxdirect":
         text = editor.inputBox.GetText();
         break;
      }

   editor.inputBox.element.disabled = true;

   if (text.charAt(0)=="'") {
      text = text.slice(1);
      }

   var parts = SocialCalc.ParseCellLinkText(text);

   text = SocialCalc.special_chars(text);

   cell = spreadsheet.sheet.cells[editor.ecell.coord];
   if (!cell || !cell.textvalueformat) { // set to link format, but don't override
      setformat = " checked";
      }
   else {
      setformat = "";
      }

   popup = parts.newwin ? " checked" : "";

   str = '<div style="padding:6px 0px 4px 6px;">'+
         '<span style="font-size:smaller;">'+SCLoc("Description")+'</span><br>'+
         '<input type="text" id="'+idp+'desc" style="width:380px;" value="'+SocialCalc.special_chars(parts.desc)+'"><br>'+
         '<span style="font-size:smaller;">'+SCLoc("URL")+'</span><br>'+
         '<input type="text" id="'+idp+'url" style="width:380px;" value="'+SocialCalc.special_chars(parts.url)+'"><br>';
   if (SocialCalc.Callbacks.MakePageLink) { // only show if handling pagenames here
      str += '<span style="font-size:smaller;">'+SCLoc("Page Name")+'</span><br>'+
             '<input type="text" id="'+idp+'pagename" style="width:380px;" value="'+SocialCalc.special_chars(parts.pagename)+'"><br>'+
             '<span style="font-size:smaller;">'+SCLoc("Workspace")+'</span><br>'+
             '<input type="text" id="'+idp+'workspace" style="width:380px;" value="'+SocialCalc.special_chars(parts.workspace)+'"><br>';
      }
   str += SocialCalc.LocalizeSubstrings('<input type="checkbox" id="'+idp+'format"'+setformat+'>&nbsp;'+
         '<span style="font-size:smaller;">%loc!Set to Link format!</span><br>'+
         '<input type="checkbox" id="'+idp+'popup"'+popup+'>&nbsp;'+
         '<span style="font-size:smaller;">%loc!Show in new browser window!</span>'+
         '</div>'+
         '<div style="width:380px;text-align:right;padding:6px 0px 4px 6px;font-size:small;">'+
         '<input type="button" value="%loc!Set Cell Contents!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoLinkPaste();">&nbsp;'+
         '<input type="button" value="%loc!Clear!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoLinkClear();">&nbsp;'+
         '<input type="button" value="%loc!Cancel!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.HideLink();"></div>'+
         '</div>');

   var main = document.createElement("div");
   main.id = idp+"dialog";

   main.style.position = "absolute";

   var vp = SocialCalc.GetViewportInfo();
   var pos = SocialCalc.GetElementPositionWithScroll(spreadsheet.spreadsheetDiv);

   main.style.top = ((vp.height/3)-pos.top)+"px";
   main.style.left = ((vp.width/3)-pos.left)+"px";
   main.style.zIndex = 100;
   main.style.backgroundColor = "#FFF";
   main.style.border = "1px solid black";

   main.style.width = "400px";

   main.innerHTML = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr>'+
      '<td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">'+"&nbsp;"+SCLoc("Link Input Box")+'</td>'+
      '<td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.SpreadsheetControl.HideLink();">&nbsp;X&nbsp;</td></tr></table>'+
      '<div style="background-color:#DDD;">'+str+'</div>';

   SocialCalc.DragRegister(main.firstChild.firstChild.firstChild.firstChild, true, true, 
                 {MouseDown: SocialCalc.DragFunctionStart, 
                  MouseMove: SocialCalc.DragFunctionPosition,
                  MouseUp: SocialCalc.DragFunctionPosition,
                  Disabled: null, positionobj: main},
                  spreadsheet.spreadsheetDiv);

   spreadsheet.spreadsheetDiv.appendChild(main);

   ele = document.getElementById(idp+"url");
   ele.focus();
   SocialCalc.CmdGotFocus(ele);
//!!! need to do keyboard handling: if esc, hide?

   }


SocialCalc.SpreadsheetControl.HideLink = function() {

   var scc = SocialCalc.Constants;
   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;

   var ele = document.getElementById(spreadsheet.idPrefix+"linkdialog");
   ele.innerHTML = "";

   SocialCalc.DragUnregister(ele);

   SocialCalc.KeyboardFocus();

   if (ele.parentNode) {
      ele.parentNode.removeChild(ele);
      }

   switch (editor.state) {
      case "start":
         editor.inputBox.DisplayCellContents(null);
         break;

      case "input":
      case "inputboxdirect":
         editor.inputBox.element.disabled = false;
         editor.inputBox.Focus();
         break;
      }

   }

SocialCalc.SpreadsheetControl.DoLinkClear = function() {

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();

   document.getElementById(spreadsheet.idPrefix+"linkdesc").value = "";
   document.getElementById(spreadsheet.idPrefix+"linkpagename").value = "";
   document.getElementById(spreadsheet.idPrefix+"linkworkspace").value = "";

   var ele = document.getElementById(spreadsheet.idPrefix+"linkurl");
   ele.value = "";
   ele.focus();

   }


SocialCalc.SpreadsheetControl.DoLinkPaste = function() {

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var editor = spreadsheet.editor;
   var wval = editor.workingvalues;

   var descele = document.getElementById(spreadsheet.idPrefix+"linkdesc");
   var urlele = document.getElementById(spreadsheet.idPrefix+"linkurl");
   var pagenameele = document.getElementById(spreadsheet.idPrefix+"linkpagename");
   var workspaceele = document.getElementById(spreadsheet.idPrefix+"linkworkspace");
   var formatele = document.getElementById(spreadsheet.idPrefix+"linkformat");
   var popupele = document.getElementById(spreadsheet.idPrefix+"linkpopup");

   var text = "";

   var ltsym, gtsym, obsym, cbsym;

   if (popupele.checked) {
      ltsym = "<<"; gtsym = ">>"; obsym = "[["; cbsym = "]]";
      }
   else {
      ltsym = "<"; gtsym = ">"; obsym = "["; cbsym = "]";
      }

   if (pagenameele && pagenameele.value) {
      if (workspaceele.value) {
         text = descele.value+"{"+workspaceele.value+obsym+pagenameele.value+cbsym+"}";
         }
      else {
         text = descele.value+obsym+pagenameele.value+cbsym;
         }
      }
   else {
      text = descele.value+ltsym+urlele.value+gtsym;
      }

   SocialCalc.SpreadsheetControl.HideLink();

   switch (editor.state) {
      case "start":
         wval.partialexpr = "";
         wval.ecoord = editor.ecell.coord;
         wval.erow = editor.ecell.row;
         wval.ecol = editor.ecell.col;
         break;
      case "input":
      case "inputboxdirect":
         editor.inputBox.Blur();
         editor.inputBox.ShowInputBox(false);
         editor.state = "start";
         break;
      }

   if (formatele.checked) {
      SocialCalc.SpreadsheetControlExecuteCommand(null, "set %C textvalueformat text-link", "");
      }

   editor.EditorSaveEdit(text);

   }

SocialCalc.SpreadsheetControl.DoSum = function() {

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

   editor.EditorScheduleSheetCommands(cmd, true, false);

   }


//
// TAB Routines
//

// Sort

SocialCalc.SpreadsheetControlSortOnclick = function(s, t) {

   var name, i;
   var namelist = [];
   var nl = document.getElementById(s.idPrefix+"sortlist");
   SocialCalc.LoadColumnChoosers(s);
   s.editor.RangeChangeCallback.sort = SocialCalc.UpdateSortRangeProposal;

   for (name in s.sheet.names) {
      namelist.push(name);
      }
   namelist.sort();
   nl.length = 0;
   nl.options[0] = new Option(SocialCalc.LocalizeString("[select range]"));
   for (i=0; i<namelist.length; i++) {
      name = namelist[i];
      nl.options[i+1] = new Option(name, name);
      if (name == s.sortrange) {
         nl.options[i+1].selected = true;
         }
      }
   if (s.sortrange == "") {
      nl.options[0].selected = true;
      }

   SocialCalc.UpdateSortRangeProposal(s.editor);
   SocialCalc.KeyboardFocus();
   return;

   }

SocialCalc.SpreadsheetControlSortSave = function(editor, setting) {
   // Format is:
   //    sort:sortrange:major:up/down:minor:up/down:last:up/down

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   var str, sele, rele;

   str = "sort:"+SocialCalc.encodeForSave(spreadsheet.sortrange)+":";
   sele = document.getElementById(spreadsheet.idPrefix+"majorsort");
   rele = document.getElementById(spreadsheet.idPrefix+"majorsortup");
   str += sele.selectedIndex + (rele.checked ? ":up" : ":down");
   sele = document.getElementById(spreadsheet.idPrefix+"minorsort");
   if (sele.selectedIndex>0) {
      rele = document.getElementById(spreadsheet.idPrefix+"minorsortup");
      str += ":"+sele.selectedIndex + (rele.checked ? ":up" : ":down");
      }
   else {
      str += "::";
      }
   sele = document.getElementById(spreadsheet.idPrefix+"lastsort");
   if (sele.selectedIndex>0) {
      rele = document.getElementById(spreadsheet.idPrefix+"lastsortup");
      str += ":"+sele.selectedIndex + (rele.checked ? ":up" : ":down");
      }
    else {
      str += "::";
      }
   return str+"\n";
   }

SocialCalc.SpreadsheetControlSortLoad = function(editor, setting, line, flags) {
   var parts, ele;

   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();

   parts = line.split(":");
   spreadsheet.sortrange = SocialCalc.decodeFromSave(parts[1]);
   ele = document.getElementById(spreadsheet.idPrefix+"sortbutton");
   if (spreadsheet.sortrange) {
      ele.value = SocialCalc.LocalizeString("Sort ")+spreadsheet.sortrange;
      ele.style.visibility = "visible";
      }
   else {
      ele.style.visibility = "hidden";
      }
   SocialCalc.LoadColumnChoosers(spreadsheet);

   sele = document.getElementById(spreadsheet.idPrefix+"majorsort");
   sele.selectedIndex = parts[2]-0;
   document.getElementById(spreadsheet.idPrefix+"majorsort"+parts[3]).checked = true;
   sele = document.getElementById(spreadsheet.idPrefix+"minorsort");
   if (parts[4]) {
      sele.selectedIndex = parts[4]-0;
      document.getElementById(spreadsheet.idPrefix+"minorsort"+parts[5]).checked = true;
      }
   else {
      sele.selectedIndex = 0;
      document.getElementById(spreadsheet.idPrefix+"minorsortup").checked = true;
      }
   sele = document.getElementById(spreadsheet.idPrefix+"lastsort");
   if (parts[6]) {
      sele.selectedIndex = parts[6]-0;
      document.getElementById(spreadsheet.idPrefix+"lastsort"+parts[7]).checked = true;
      }
    else {
      sele.selectedIndex = 0;
      document.getElementById(spreadsheet.idPrefix+"lastsortup").checked = true;
      }

   return true;
   }

// Comment

SocialCalc.SpreadsheetControlCommentOnclick = function(s, t) {
   s.editor.MoveECellCallback.comment = SocialCalc.SpreadsheetControlCommentMoveECell;
   SocialCalc.SpreadsheetControlCommentDisplay(s, t);
   SocialCalc.KeyboardFocus();
   return;
   }

SocialCalc.SpreadsheetControlCommentDisplay = function(s, t) {
   var c = "";
   if (s.editor.ecell && s.editor.ecell.coord && s.sheet.cells[s.editor.ecell.coord]) {
      c = s.sheet.cells[s.editor.ecell.coord].comment || "";
      }
   document.getElementById(s.idPrefix+"commenttext").value = c;
   }

SocialCalc.SpreadsheetControlCommentMoveECell = function(editor) {
   SocialCalc.SpreadsheetControlCommentDisplay(SocialCalc.GetSpreadsheetControlObject(), "comment");
   }

SocialCalc.SpreadsheetControlCommentSet = function() {
   var s=SocialCalc.GetSpreadsheetControlObject();
   s.ExecuteCommand("set %C comment "+SocialCalc.encodeForSave(document.getElementById(s.idPrefix+"commenttext").value));
   var cell=SocialCalc.GetEditorCellElement(s.editor, s.editor.ecell.row, s.editor.ecell.col);
   if (!s.editor.ECellReadonly()) {
      cell.element.title = document.getElementById(s.idPrefix+"commenttext").value;
      s.editor.UpdateCellCSS(cell, s.editor.ecell.row, s.editor.ecell.col);
      }
   SocialCalc.KeyboardFocus();
   }

SocialCalc.SpreadsheetControlCommentOnunclick = function(s, t) {
   delete s.editor.MoveECellCallback.comment;
   }

// Names

SocialCalc.SpreadsheetControlNamesOnclick = function(s, t) {
   document.getElementById(s.idPrefix+"namesname").value = "";
   document.getElementById(s.idPrefix+"namesdesc").value = "";
   document.getElementById(s.idPrefix+"namesvalue").value = "";
   s.editor.RangeChangeCallback.names = SocialCalc.SpreadsheetControlNamesRangeChange;
   s.editor.MoveECellCallback.names = SocialCalc.SpreadsheetControlNamesRangeChange;
   SocialCalc.SpreadsheetControlNamesRangeChange(s.editor);
   SocialCalc.SpreadsheetControlNamesFillNameList();
   SocialCalc.SpreadsheetControlNamesChangedName();
   }

SocialCalc.SpreadsheetControlNamesFillNameList = function() {
   var SCLoc = SocialCalc.LocalizeString;
   var name, i;
   var namelist = [];
   var s=SocialCalc.GetSpreadsheetControlObject();
   var nl = document.getElementById(s.idPrefix+"nameslist");
   var currentname = document.getElementById(s.idPrefix+"namesname").value.toUpperCase().replace(/[^A-Z0-9_\.]/g, "");
   for (name in s.sheet.names) {
      namelist.push(name);
      }
   namelist.sort();
   nl.length = 0;
   if (namelist.length > 0) {
      nl.options[0] = new Option(SCLoc("[New]"));
      }
   else {
      nl.options[0] = new Option(SCLoc("[None]"));
      }
   for (i=0; i<namelist.length; i++) {
      name = namelist[i];
      nl.options[i+1] = new Option(name, name);
      if (name == currentname) {
         nl.options[i+1].selected = true;
         }
      }
   if (currentname == "") {
      nl.options[0].selected = true;
      }
   }

SocialCalc.SpreadsheetControlNamesChangedName = function() {
   var s=SocialCalc.GetSpreadsheetControlObject();
   var nl = document.getElementById(s.idPrefix+"nameslist");
   var name = nl.options[nl.selectedIndex].value;
   if (s.sheet.names[name]) {
      document.getElementById(s.idPrefix+"namesname").value = name;
      document.getElementById(s.idPrefix+"namesdesc").value = s.sheet.names[name].desc || "";
      document.getElementById(s.idPrefix+"namesvalue").value = s.sheet.names[name].definition || "";
      }
   else {
      document.getElementById(s.idPrefix+"namesname").value = "";
      document.getElementById(s.idPrefix+"namesdesc").value = "";
      document.getElementById(s.idPrefix+"namesvalue").value = "";
      }
   }

SocialCalc.SpreadsheetControlNamesRangeChange = function(editor) {
   var s = SocialCalc.GetSpreadsheetControlObject();
   var ele = document.getElementById(s.idPrefix+"namesrangeproposal");
   if (editor.range.hasrange) {
      ele.value = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" +
                            SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
      }
   else {
      ele.value = editor.ecell.coord;
      }
   }

SocialCalc.SpreadsheetControlNamesOnunclick = function(s, t) {
   delete s.editor.RangeChangeCallback.names;
   delete s.editor.MoveECellCallback.names;
   }

SocialCalc.SpreadsheetControlNamesSetValue = function() {
   var s = SocialCalc.GetSpreadsheetControlObject();
   document.getElementById(s.idPrefix+"namesvalue").value = document.getElementById(s.idPrefix+"namesrangeproposal").value;
   SocialCalc.KeyboardFocus();
   }

SocialCalc.SpreadsheetControlNamesSave = function() {
   var s = SocialCalc.GetSpreadsheetControlObject();
   var name = document.getElementById(s.idPrefix+"namesname").value;
   SocialCalc.SetTab(s.tabs[0].name); // return to first tab
   SocialCalc.KeyboardFocus();
   if (name != "") {
      s.ExecuteCommand("name define "+name+" "+document.getElementById(s.idPrefix+"namesvalue").value+"\n"+
         "name desc "+name+" "+document.getElementById(s.idPrefix+"namesdesc").value);
      }
   }

SocialCalc.SpreadsheetControlNamesDelete = function() {
   var s = SocialCalc.GetSpreadsheetControlObject();
   var name = document.getElementById(s.idPrefix+"namesname").value;
   SocialCalc.SetTab(s.tabs[0].name); // return to first tab
   SocialCalc.KeyboardFocus();
   if (name != "") {
      s.ExecuteCommand("name delete "+name);
//      document.getElementById(s.idPrefix+"namesname").value = "";
//      document.getElementById(s.idPrefix+"namesvalue").value = "";
//      document.getElementById(s.idPrefix+"namesdesc").value = "";
//      SocialCalc.SpreadsheetControlNamesFillNameList();
      }
   SocialCalc.KeyboardFocus();
   }

// Clipboard

SocialCalc.SpreadsheetControlClipboardOnclick = function(s, t) {
   var s = SocialCalc.GetSpreadsheetControlObject();
   clipele = document.getElementById(s.idPrefix+"clipboardtext");
   document.getElementById(s.idPrefix+"clipboardformat-tab").checked = true;
   clipele.value = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "tab");
   return;
   }

SocialCalc.SpreadsheetControlClipboardFormat = function(which) {
   var s = SocialCalc.GetSpreadsheetControlObject();
   clipele = document.getElementById(s.idPrefix+"clipboardtext");
   clipele.value = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, which);
   }

SocialCalc.SpreadsheetControlClipboardLoad = function() {
   var s = SocialCalc.GetSpreadsheetControlObject();
   var savetype = "tab";
   SocialCalc.SetTab(s.tabs[0].name); // return to first tab
   SocialCalc.KeyboardFocus();
   if (document.getElementById(s.idPrefix+"clipboardformat-csv").checked) {
      savetype = "csv";
      }
   else if (document.getElementById(s.idPrefix+"clipboardformat-scsave").checked) {
      savetype = "scsave";
      }
   s.editor.EditorScheduleSheetCommands("loadclipboard "+
      SocialCalc.encodeForSave(
         SocialCalc.ConvertOtherFormatToSave(document.getElementById(s.idPrefix+"clipboardtext").value, savetype)), true, false);
   }

SocialCalc.SpreadsheetControlClipboardClear = function() {
   var s = SocialCalc.GetSpreadsheetControlObject();
   var clipele = document.getElementById(s.idPrefix+"clipboardtext");
   clipele.value = "";
   s.editor.EditorScheduleSheetCommands("clearclipboard", true, false);
   clipele.focus();
   }

SocialCalc.SpreadsheetControlClipboardExport = function() {
   var s = SocialCalc.GetSpreadsheetControlObject();
   if (s.ExportCallback) {
      s.ExportCallback(s);
      }
   SocialCalc.SetTab(s.tabs[0].name); // return to first tab
   SocialCalc.KeyboardFocus();
   }

// Settings

SocialCalc.SpreadsheetControlSettingsSwitch = function(target) {
   SocialCalc.SettingControlReset();
   var s = SocialCalc.GetSpreadsheetControlObject();
   var sheettable = document.getElementById(s.idPrefix+"sheetsettingstable");
   var celltable = document.getElementById(s.idPrefix+"cellsettingstable");
   var sheettoolbar = document.getElementById(s.idPrefix+"sheetsettingstoolbar");
   var celltoolbar = document.getElementById(s.idPrefix+"cellsettingstoolbar");
   if (target=="sheet") {
      sheettable.style.display = "block";
      celltable.style.display = "none";
      sheettoolbar.style.display = "block";
      celltoolbar.style.display = "none";
      SocialCalc.SettingsControlSetCurrentPanel(s.views.settings.values.sheetspanel);
      }
   else {
      sheettable.style.display = "none";
      celltable.style.display = "block";
      sheettoolbar.style.display = "none";
      celltoolbar.style.display = "block";
      SocialCalc.SettingsControlSetCurrentPanel(s.views.settings.values.cellspanel);
      }
   }

SocialCalc.SettingsControlSave = function(target) {
   var range, cmdstr;
   var s = SocialCalc.GetSpreadsheetControlObject();
   var sc = SocialCalc.SettingsControls;
   var panelobj = sc.CurrentPanel;
   var attribs = SocialCalc.SettingsControlUnloadPanel(panelobj);

   SocialCalc.SetTab(s.tabs[0].name); // return to first tab
   SocialCalc.KeyboardFocus();

   if (target=="sheet") {
      cmdstr = s.sheet.DecodeSheetAttributes(attribs);
      }
   else if (target=="cell") {
      if (s.editor.range.hasrange) {
         range = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top) + ":" +
            SocialCalc.crToCoord(s.editor.range.right, s.editor.range.bottom);
         }
      cmdstr = s.sheet.DecodeCellAttributes(s.editor.ecell.coord, attribs, range);
      }
   else { // Cancel
      }
   if (cmdstr) {
      s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
      }
   }

///////////////////////
//
// SAVE / LOAD ROUTINES
//
///////////////////////

//
// result = SocialCalc.SpreadsheetControlCreateSpreadsheetSave(spreadsheet, otherparts)
//
// Saves the spreadsheet's sheet data, editor settings, and audit trail (redo stack).
// The serialized data strings are concatenated together in multi-part MIME format.
// The first part lists the types of the subsequent parts (e.g., "sheet", "editor", and "audit")
// in this format:
//   # comments
//   version:1.0
//   part:type1
//   part:type2
//   ...
//
// If otherparts is non-null, it is an object with:
//   partname1: "part contents - should end with \n",
//   partname2: "part contents - should end with \n"
//


SocialCalc.SpreadsheetControlCreateSpreadsheetSave = function(spreadsheet, otherparts) {

   var result;

   var otherpartsstr = "";
   var otherpartsnames = "";
   var partname, extranl;

   if (otherparts) {
      for (partname in otherparts) {
         if (otherparts[partname].charAt(otherparts[partname]-1) != "\n") {
            extranl = "\n";
            }
         else {
            extranl = "";
            }
         otherpartsstr += "--" + spreadsheet.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" +
            otherparts[partname] + extranl;
         otherpartsnames += "part:"+partname + "\n";
         }
      }

   result = "socialcalc:version:1.0\n" +
      "MIME-Version: 1.0\nContent-Type: multipart/mixed; boundary="+
      spreadsheet.multipartBoundary + "\n" +
      "--" + spreadsheet.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" +
      "# SocialCalc Spreadsheet Control Save\nversion:1.0\npart:sheet\npart:edit\npart:audit\n" + otherpartsnames +
      "--" + spreadsheet.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" +
      spreadsheet.CreateSheetSave() +
      "--" + spreadsheet.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" +
      spreadsheet.editor.SaveEditorSettings() +
      "--" + spreadsheet.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" +
      spreadsheet.sheet.CreateAuditString() +
      otherpartsstr +
      "--" + spreadsheet.multipartBoundary + "--\n";

   return result;

   }


//
// parts = SocialCalc.SpreadsheetControlDecodeSpreadsheetSave(spreadsheet, str)
//
// Separates the parts from a spreadsheet save string, returning an object with the sub-strings.
//
//    {type1: {start: startpos, end: endpos}, type2:...}
//

SocialCalc.SpreadsheetControlDecodeSpreadsheetSave = function(spreadsheet, str) {

   var pos1, mpregex, searchinfo, boundary, boundaryregex, blanklineregex, start, ending, lines, i, lines, p, pnun;
   var parts = {};
   var partlist = [];

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


/*
* SettingsControls
*
* Each settings panel has an object in the following form:
*
*    {ctrl-name1: {setting: setting-nameA, type: ctrl-type, id: id-component},
*     ctrl-name2: {setting: setting-nameB, type: ctrl-type, id: id-component, initialdata: optional-initialdata-override},
*     ...}
*
* The ctrl-types are names that correspond to:
*
*    SocialCalc.SettingsControls.Controls = {
*       ctrl-type1: {
*          SetValue: function(panel-obj, ctrl-name, {def: true/false, val: value}) {...;},
*          ColorValues: if true, Onchanged converts between hex and RGB
*          GetValue: function(panel-obj, ctrl-name) {...return {def: true/false, val: value};},
*          Initialize: function(panel-obj, ctrl-name) {...;}, // used to fill dropdowns, etc.
*          InitialData: control-dependent, // used by Initialize (if no panel ctrlname.initialdata)
*          OnReset: function(ctrl-name) {...;}, // called to put down popups, etc.
*          ChangedCallback: function(ctrl-name) {...;} // if not null, called by control when user changes value
*       }
*
*/

SocialCalc.SettingsControls = {
   Controls: {},
   CurrentPanel: null // panel object to search on events
   };

//
// SocialCalc.SettingsControlSetCurrentPanel(panel-object)
//

SocialCalc.SettingsControlSetCurrentPanel = function(panelobj) {

   SocialCalc.SettingsControls.CurrentPanel = panelobj;

   SocialCalc.SettingsControls.PopupChangeCallback({panelobj: panelobj}, "", null);

   }


//
// SocialCalc.SettingsControlInitializePanel(panel-object)
//

SocialCalc.SettingsControlInitializePanel = function(panelobj) {

   var ctrlname;
   var sc = SocialCalc.SettingsControls;

   for (ctrlname in panelobj) {
      if (ctrlname=="name") continue;
      ctrl = sc.Controls[panelobj[ctrlname].type];
      if (ctrl && ctrl.Initialize) ctrl.Initialize(panelobj, ctrlname);
      }

   }


//
// SocialCalc.SettingsControlLoadPanel(panel-object, attribs)
//

SocialCalc.SettingsControlLoadPanel = function(panelobj, attribs) {

   var ctrlname;
   var sc = SocialCalc.SettingsControls;

   for (ctrlname in panelobj) {
      if (ctrlname=="name") continue;
      ctrl = sc.Controls[panelobj[ctrlname].type];
      if (ctrl && ctrl.SetValue) ctrl.SetValue(panelobj, ctrlname, attribs[panelobj[ctrlname].setting]);
      }

   }

//
// attribs = SocialCalc.SettingsControlUnloadPanel(panel-object)
//

SocialCalc.SettingsControlUnloadPanel = function(panelobj) {

   var ctrlname;
   var sc = SocialCalc.SettingsControls;
   var attribs = {};

   for (ctrlname in panelobj) {
      if (ctrlname=="name") continue;
      ctrl = sc.Controls[panelobj[ctrlname].type];
      if (ctrl && ctrl.GetValue) attribs[panelobj[ctrlname].setting] = ctrl.GetValue(panelobj, ctrlname);
      }

   return attribs;

   }

//
// SocialCalc.SettingsControls.PopupChangeCallback
//

SocialCalc.SettingsControls.PopupChangeCallback = function(attribs, id, value) {

   var sc = SocialCalc.Constants;

   var ele = document.getElementById("sample-text");

   if (!ele || !attribs || !attribs.panelobj) return;

   var idPrefix = SocialCalc.CurrentSpreadsheetControlObject.idPrefix;

   var c = attribs.panelobj.name == "cell" ? "c" : "";

   var v, a, parts, str1, str2, i;

   parts = sc.defaultCellLayout.match(/^padding.(\S+) (\S+) (\S+) (\S+).vertical.align.(\S+);$/) || [];

   var cv = {color: ["textcolor"], backgroundColor: ["bgcolor", "#FFF"],
             fontSize: ["fontsize", sc.defaultCellFontSize], fontFamily: ["fontfamily"],
             paddingTop: ["padtop", parts[1]], paddingRight: ["padright", parts[2]],
             paddingBottom: ["padbottom", parts[3]], paddingLeft: ["padleft", parts[4]],
             verticalAlign: ["alignvert", parts[5]]};

   for (a in cv) {
      v = SocialCalc.Popup.GetValue(idPrefix+c+cv[a][0]) || cv[a][1] || "";
      ele.style[a] = v;
      }

   if (c=="c") {
      cv = {borderTop: "cbt", borderRight: "cbr", borderBottom: "cbb", borderLeft: "cbl"};
      for (a in cv) {
         v = SocialCalc.SettingsControls.BorderSideGetValue(attribs.panelobj, cv[a]);
         ele.style[a] = v ? (v.val || "") : "";
         }
      v = SocialCalc.Popup.GetValue(idPrefix+"calignhoriz");
      ele.style.textAlign = v || "left";
      ele.childNodes[1].style.textAlign = v || "right";
      }
   else {
      ele.style.border = "";
      v = SocialCalc.Popup.GetValue(idPrefix+"textalignhoriz");
      ele.style.textAlign = v || "left";
      v = SocialCalc.Popup.GetValue(idPrefix+"numberalignhoriz");
      ele.childNodes[1].style.textAlign = v || "right";
      }

   v = SocialCalc.Popup.GetValue(idPrefix+c+"fontlook");
   parts = v ? (v.match(/^(\S+) (\S+)$/) || []) : [];
   ele.style.fontStyle = parts[1] || "";
   ele.style.fontWeight = parts[2] || "";

   v = SocialCalc.Popup.GetValue(idPrefix+c+"formatnumber") || "General";
   str1 = SocialCalc.FormatNumber.formatNumberWithFormat(9.8765, v, "");
   str2 = SocialCalc.FormatNumber.formatNumberWithFormat(-1234.5, v, "");
   if (str2 != "??-???-??&nbsp;??:??:??") { // not bad date from negative number
      str1 += "<br>"+str2;
      }
      
   ele.childNodes[1].innerHTML = str1;

   }

//
// PopupList Control
//

SocialCalc.SettingsControls.PopupListSetValue = function(panelobj, ctrlname, value) {

   if (!value) {alert(ctrlname+" no value"); return;}

   var sp = SocialCalc.Popup;

   if (!value.def) {
      sp.SetValue(panelobj[ctrlname].id, value.val);
      }
   else {
      sp.SetValue(panelobj[ctrlname].id, "");
      }

   }

//
// SocialCalc.SettingsControls.PopupListGetValue
//

SocialCalc.SettingsControls.PopupListGetValue = function(panelobj, ctrlname) {

   var ctl = panelobj[ctrlname];
   if (!ctl) return null;

   var value = SocialCalc.Popup.GetValue(ctl.id);
   if (value) {
      return {def: false, val: value};
      }
   else {
      return {def: true, val: 0};
      }

   }

//
// SocialCalc.SettingsControls.PopupListInitialize
//

SocialCalc.SettingsControls.PopupListInitialize = function(panelobj, ctrlname) {

   var i, val, pos, otext;
   var sc = SocialCalc.SettingsControls;
   var initialdata = panelobj[ctrlname].initialdata || sc.Controls[panelobj[ctrlname].type].InitialData || "";
   initialdata = SocialCalc.LocalizeSubstrings(initialdata);
   var optionvals = initialdata.split(/\|/);

   var options = [];

   for (i=0; i<(optionvals.length||0); i++) {
      val = optionvals[i];
      pos = val.indexOf(":");
      otext = val.substring(0, pos);
      if (otext.indexOf("\\")!=-1) { // escape any colons
         otext = otext.replace(/\\c/g,":");
         otext = otext.replace(/\\b/g,"\\");

         }
      otext = SocialCalc.special_chars(otext);
      if (otext == "[custom]") {
         options[i] = {o: SocialCalc.Constants.s_PopupListCustom, v: val.substring(pos+1), a:{custom: true}};
         }
      else if (otext == "[cancel]") {
         options[i] = {o: SocialCalc.Constants.s_PopupListCancel, v: "", a:{cancel: true}};
         }
      else if (otext == "[break]") {
         options[i] = {o: "-----", v: "", a:{skip: true}};
         }
      else if (otext == "[newcol]") {
         options[i] = {o: "", v: "", a:{newcol: true}};
         }
      else {
         options[i] = {o: otext, v: val.substring(pos+1)};
         }
      }

   SocialCalc.Popup.Create("List", panelobj[ctrlname].id, {});
   SocialCalc.Popup.Initialize(panelobj[ctrlname].id, 
      {options: options, 
       attribs:{changedcallback: SocialCalc.SettingsControls.PopupChangeCallback, panelobj: panelobj}});

   }


//
// SocialCalc.SettingsControls.PopupListReset
//

SocialCalc.SettingsControls.PopupListReset = function(ctrlname) {

   SocialCalc.Popup.Reset("List");

   }

SocialCalc.SettingsControls.Controls.PopupList = {
   SetValue: SocialCalc.SettingsControls.PopupListSetValue,
   GetValue: SocialCalc.SettingsControls.PopupListGetValue,
   Initialize: SocialCalc.SettingsControls.PopupListInitialize,
   OnReset: SocialCalc.SettingsControls.PopupListReset,
   ChangedCallback: null
   }

//
// ColorChooser Control
//

SocialCalc.SettingsControls.ColorChooserSetValue = function(panelobj, ctrlname, value) {

   if (!value) {alert(ctrlname+" no value"); return;}

   var sp = SocialCalc.Popup;

   if (!value.def) {
      sp.SetValue(panelobj[ctrlname].id, value.val);
      }
   else {
      sp.SetValue(panelobj[ctrlname].id, "");
      }

   }

//
// SocialCalc.SettingsControls.ColorChooserGetValue
//

SocialCalc.SettingsControls.ColorChooserGetValue = function(panelobj, ctrlname) {

   var value = SocialCalc.Popup.GetValue(panelobj[ctrlname].id);
   if (value) {
      return {def: false, val: value};
      }
   else {
      return {def: true, val: 0};
      }

   }

//
// SocialCalc.SettingsControls.ColorChooserInitialize
//

SocialCalc.SettingsControls.ColorChooserInitialize = function(panelobj, ctrlname) {

   var i, val, pos, otext;
   var sc = SocialCalc.SettingsControls;

   SocialCalc.Popup.Create("ColorChooser", panelobj[ctrlname].id, {});
   SocialCalc.Popup.Initialize(panelobj[ctrlname].id,
      {attribs:{title: "&nbsp;", moveable: true, width: "106px",
                changedcallback: SocialCalc.SettingsControls.PopupChangeCallback, panelobj: panelobj}});

   }


//
// SocialCalc.SettingsControls.ColorChooserReset
//

SocialCalc.SettingsControls.ColorChooserReset = function(ctrlname) {

   SocialCalc.Popup.Reset("ColorChooser");

   }

SocialCalc.SettingsControls.Controls.ColorChooser = {
   SetValue: SocialCalc.SettingsControls.ColorChooserSetValue,
   GetValue: SocialCalc.SettingsControls.ColorChooserGetValue,
   Initialize: SocialCalc.SettingsControls.ColorChooserInitialize,
   OnReset: SocialCalc.SettingsControls.ColorChooserReset,
   ChangedCallback: null
   }


//
// SocialCalc.SettingsControls.BorderSideSetValue
//

SocialCalc.SettingsControls.BorderSideSetValue = function(panelobj, ctrlname, value) {

   var sc = SocialCalc.SettingsControls;
   var ele, found, idname, parts;
   var idstart = panelobj[ctrlname].id;

   if (!value) {alert(ctrlname+" no value"); return;}

   ele = document.getElementById(idstart+"-onoff-bcb"); // border checkbox
   if (!ele) return;

   if (value.val) { // border does not use default: it looks only to the value currently
      ele.checked = true;
      ele.value = value.val;
      parts = value.val.match(/(\S+)\s+(\S+)\s+(\S.+)/);
      idname = idstart+"-color";
      SocialCalc.Popup.SetValue(idname, parts[3]);
      SocialCalc.Popup.SetDisabled(idname, false);
      }
   else {
      ele.checked = false;
      ele.value = value.val;
      idname = idstart+"-color";
      SocialCalc.Popup.SetValue(idname, "");
      SocialCalc.Popup.SetDisabled(idname, true);
      }

   }

//
// SocialCalc.SettingsControls.BorderSideGetValue
//

SocialCalc.SettingsControls.BorderSideGetValue = function(panelobj, ctrlname) {

   var sc = SocialCalc.SettingsControls;
   var ele, value;
   var idstart = panelobj[ctrlname].id;

   ele = document.getElementById(idstart+"-onoff-bcb"); // border checkbox
   if (!ele) return;


   if (ele.checked) { // on
      value = SocialCalc.Popup.GetValue(idstart+"-color");
      value = "1px solid " + (value || "rgb(0,0,0)");
      return {def: false, val: value};
      }
   else { // off
      return {def: false, val: ""};
      }

   }

//
// SocialCalc.SettingsControls.BorderSideInitialize
//

SocialCalc.SettingsControls.BorderSideInitialize = function(panelobj, ctrlname) {

   var sc = SocialCalc.SettingsControls;
   var idstart = panelobj[ctrlname].id;

   SocialCalc.Popup.Create("ColorChooser", idstart+"-color", {});
   SocialCalc.Popup.Initialize(idstart+"-color",
      {attribs:{title: "&nbsp;", width: "106px", moveable: true,
                changedcallback: SocialCalc.SettingsControls.PopupChangeCallback, panelobj: panelobj}});

   }


//
// SocialCalc.SettingsControlOnchangeBorder = function(ele)
//

SocialCalc.SettingsControlOnchangeBorder = function(ele) {

   var idname, value, found, ele2;
   var sc = SocialCalc.SettingsControls;
   var panelobj = sc.CurrentPanel;

   var nameparts = ele.id.match(/(^.*\-)(\w+)\-(\w+)\-(\w+)$/);
   if (!nameparts) return;
   var prefix = nameparts[1];
   var ctrlname = nameparts[2];
   var ctrlsubid = nameparts[3]
   var ctrlidsuffix = nameparts[4];
   var ctrltype = panelobj[ctrlname].type;

   switch (ctrlidsuffix) {
      case "bcb": // border checkbox
         if (ele.checked) {
            sc.Controls[ctrltype].SetValue(sc.CurrentPanel, ctrlname, {def: false, val: ele.value || "1px solid rgb(0,0,0)"});
            }
         else {
            sc.Controls[ctrltype].SetValue(sc.CurrentPanel, ctrlname, {def: false, val: ""});
            }
         break;
      }

   }


SocialCalc.SettingsControls.Controls.BorderSide = {
   SetValue: SocialCalc.SettingsControls.BorderSideSetValue,
   GetValue: SocialCalc.SettingsControls.BorderSideGetValue,
   OnClick: SocialCalc.SettingsControls.ColorComboOnClick,
   Initialize: SocialCalc.SettingsControls.BorderSideInitialize,
   InitialData: {thickness: "1 pixel:1px", style: "Solid:solid"},
   ChangedCallback: null
   }


SocialCalc.SettingControlReset = function() {

   var sc = SocialCalc.SettingsControls;
   var ctrlname;

   for (ctrlname in sc.Controls) {
      if (sc.Controls[ctrlname].OnReset) sc.Controls[ctrlname].OnReset(ctrlname);
      }
   }


/**********************
*
* CtrlSEditor implementation for editing SocialCalc.OtherSaveParts
*
*/

SocialCalc.OtherSaveParts = {}; // holds other parts to save - must be set when loaded if you want to keep

SocialCalc.CtrlSEditor = function(whichpart) {

   var strtoedit, partname;
   if (whichpart.length > 0) {
      strtoedit = SocialCalc.special_chars(SocialCalc.OtherSaveParts[whichpart] || "");
      }
   else {
      strtoedit = "Listing of Parts\n";
      for (partname in SocialCalc.OtherSaveParts) {
         strtoedit += SocialCalc.special_chars("\nPart: "+partname+"\n=====\n"+SocialCalc.OtherSaveParts[partname]+"\n");
         }
      }
   var editbox = document.createElement("div");
   editbox.style.cssText = "position:absolute;z-index:500;width:300px;height:300px;left:100px;top:200px;border:1px solid black;background-color:#EEE;text-align:center;";
   editbox.id = "socialcalc-editbox";
   editbox.innerHTML = whichpart+'<br><br><textarea id="socialcalc-editbox-textarea" style="width:250px;height:200px;">'+
      strtoedit + '</textarea><br><br><input type=button ' +
      'onclick="SocialCalc.CtrlSEditorDone (\'socialcalc-editbox\', \''+whichpart+'\');" value="OK">';
   document.body.appendChild(editbox);

   var ebta = document.getElementById("socialcalc-editbox-textarea");
   ebta.focus();
   SocialCalc.CmdGotFocus(ebta);

   }

SocialCalc.CtrlSEditorDone = function(idprefix, whichpart) {

   var edittextarea = document.getElementById(idprefix+"-textarea");
   var text = edittextarea.value;
   if (whichpart.length > 0) {
      if (text.length > 0) {
         SocialCalc.OtherSaveParts[whichpart] = text;
         }
      else {
         delete SocialCalc.OtherSaveParts[whichpart];
         }
      }

   var editbox = document.getElementById(idprefix);
   SocialCalc.KeyboardFocus();
   editbox.parentNode.removeChild(editbox);

   }

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

if (typeof global != 'undefined') var window = global;
if (typeof SocialCalc != 'undefined' && typeof module != 'undefined') module.exports = SocialCalc;
if (typeof document == 'undefined') var document = SocialCalc.document = {};

// Compatibility with webworker-threads
if (typeof self !== 'undefined' && self.thread) {
    window.setTimeout = function (cb, ms) {
        if (ms <= 1) { self.thread.nextTick(cb); }
    };
    window.clearTimeout = function () {};
}

// We don't really need a DOM-based presentation layer for embedded SC.
SocialCalc.GetEditorCellElement = function () {};
SocialCalc.ReplaceCell = function () {};
SocialCalc.EditorRenderSheet = function () {};
SocialCalc.SpreadsheetControlSortSave = function () { return "" };
SocialCalc.SpreadsheetControlStatuslineCallback = function () {};
SocialCalc.DoPositionCalculations = function (editor) {
    SocialCalc.EditorSheetStatusCallback(
        null, "doneposcalc", null, editor
    );
}
