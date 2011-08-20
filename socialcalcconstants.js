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

   s_rcMissingSheet: "Render Context must have a sheet object", // unlikely thrown error

   //*** SocialCalc.format_text_for_display

   defaultLinkFormatString: '<span style="font-size:smaller;text-decoration:none !important;background-color:#66B;color:#FFF;">Link</span>', // used for format "text-link"; you could make this an img tag if desired
//   defaultLinkFormatString: '<img src="images/sc-linkout.gif" border="0" alt="Link out" title="Link out">',
   defaultPageLinkFormatString: '<span style="font-size:smaller;text-decoration:none !important;background-color:#66B;color:#FFF;">Page</span>', // used for format "text-link"; you could make this an img tag if desired

   //*** SocialCalc.format_number_for_display

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

   s_farg_v: "value",
   s_farg_vn: "value1, value2, ...",
   s_farg_xy: "valueX, valueY",
   s_farg_choose: "index, value1, value2, ...",
   s_farg_range: "range",
   s_farg_rangec: "range, criteria",
   s_farg_date: "year, month, day",
   s_farg_dfunc: "databaserange, fieldname, criteriarange",
   s_farg_ddb: "cost, salvage, lifetime, period [, factor]",
   s_farg_find: "string1, string2 [, start]",
   s_farg_fv: "rate, n, payment, [pv, [paytype]]",
   s_farg_hlookup: "value, range, row, [rangelookup]",
   s_farg_iffunc: "logical-expression, true-value, false-value",
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
   s_farg_subs: "text1, oldtext, newtext [, occurrence]",
   s_farg_sumif: "range1, criteria [, range2]",
   s_farg_hms: "hour, minute, second",
   s_farg_txt: "text",
   s_farg_vlookup: "value, range, col, [rangelookup]",
   s_farg_weekday: "date, [type]",
   s_farg_dt: "date",

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

