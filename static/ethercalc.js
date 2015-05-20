// Auto-generated from "make depends"; ALL CHANGES HERE WILL BE LOST!
var SocialCalc;

if (!SocialCalc) SocialCalc = {};

SocialCalc.Constants = {
    textdatadefaulttype: "t",
    s_BrowserNotSupported: "Browser not supported.",
    s_InternalError: "Internal SocialCalc error (probably an internal bug): ",
    s_pssUnknownColType: "Unknown col type item",
    s_pssUnknownRowType: "Unknown row type item",
    s_pssUnknownLineType: "Unknown line type",
    s_cfspUnknownCellType: "Unknown cell type item",
    doCanonicalizeSheet: true,
    s_escUnknownSheetCmd: "Unknown sheet command: ",
    s_escUnknownSetCoordCmd: "Unknown set coord command: ",
    s_escUnknownCmd: "Unknown command: ",
    s_caccCircRef: "Circular reference to ",
    defaultRowNameWidth: "30",
    defaultAssumedRowHeight: 15,
    defaultCellIDPrefix: "cell_",
    defaultCellLayout: "padding:2px 2px 1px 2px;vertical-align:top;",
    defaultCellFontStyle: "normal normal",
    defaultCellFontSize: "small",
    defaultCellFontFamily: "Verdana,Arial,Helvetica,sans-serif",
    defaultPaneDividerWidth: "2",
    defaultPaneDividerHeight: "3",
    defaultGridCSS: "1px solid #C0C0C0;",
    defaultCommentClass: "",
    defaultCommentStyle: "background-repeat:no-repeat;background-position:top right;background-image:url(images/sc-commentbg.gif);",
    defaultCommentNoGridClass: "",
    defaultCommentNoGridStyle: "",
    defaultReadonlyClass: "",
    defaultReadonlyStyle: "background-repeat:no-repeat;background-position:top right;background-image:url(images/sc-lockbg.gif);",
    defaultReadonlyNoGridClass: "",
    defaultReadonlyNoGridStyle: "",
    defaultReadonlyComment: "Locked cell",
    defaultColWidth: "80",
    defaultMinimumColWidth: 10,
    defaultHighlightTypeCursorClass: "",
    defaultHighlightTypeCursorStyle: "color:#FFF;backgroundColor:#A6A6A6;",
    defaultHighlightTypeRangeClass: "",
    defaultHighlightTypeRangeStyle: "color:#000;backgroundColor:#E5E5E5;",
    defaultColnameClass: "",
    defaultColnameStyle: "font-size:small;text-align:center;color:#FFFFFF;background-color:#808080;cursor:col-resize;",
    defaultSelectedColnameClass: "",
    defaultSelectedColnameStyle: "font-size:small;text-align:center;color:#FFFFFF;background-color:#404040;cursor:col-resize;",
    defaultRownameClass: "",
    defaultRownameStyle: "font-size:small;text-align:right;color:#FFFFFF;background-color:#808080;direction:rtl;cursor:row-resize;",
    defaultSelectedRownameClass: "",
    defaultSelectedRownameStyle: "font-size:small;text-align:right;color:#FFFFFF;background-color:#404040;cursor:row-resize;",
    defaultUpperLeftClass: "",
    defaultUpperLeftStyle: "font-size:small;",
    defaultSkippedCellClass: "",
    defaultSkippedCellStyle: "font-size:small;background-color:#CCC",
    defaultPaneDividerClass: "",
    defaultPaneDividerStyle: "font-size:small;background-color:#C0C0C0;padding:0px;",
    defaultUnhideLeftClass: "",
    defaultUnhideLeftStyle: "float:right;width:9px;height:12px;cursor:pointer;background-image:url(images/sc-unhideleft.gif);padding:0;",
    defaultUnhideRightClass: "",
    defaultUnhideRightStyle: "float:left;width:9px;height:12px;cursor:pointer;background-image:url(images/sc-unhideright.gif);padding:0;",
    defaultUnhideTopClass: "",
    defaultUnhideTopStyle: "float:left;left:1px;position:absolute;bottom:-4px;width:12px;height:9px;cursor:pointer;background-image:url(images/sc-unhidetop.gif);padding:0;",
    defaultUnhideBottomClass: "",
    defaultUnhideBottomStyle: "float:left;width:12px;height:9px;cursor:pointer;background-image:url(images/sc-unhidebottom.gif);padding:0;",
    s_rcMissingSheet: "Render Context must have a sheet object",
    defaultLinkFormatString: '<span style="font-size:smaller;text-decoration:none !important;background-color:#66B;color:#FFF;">Link</span>',
    defaultPageLinkFormatString: '<span style="font-size:smaller;text-decoration:none !important;background-color:#66B;color:#FFF;">Page</span>',
    defaultFormatp: "#,##0.0%",
    defaultFormatc: "[$$]#,##0.00",
    defaultFormatdt: "d-mmm-yyyy h:mm:ss",
    defaultFormatd: "d-mmm-yyyy",
    defaultFormatt: "[h]:mm:ss",
    defaultDisplayTRUE: "TRUE",
    defaultDisplayFALSE: "FALSE",
    defaultImagePrefix: "images/sc_",
    defaultTableEditorIDPrefix: "te_",
    defaultPageUpDnAmount: 15,
    AllowCtrlS: true,
    defaultTableControlThickness: 20,
    cteGriddivClass: "",
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
    s_inputboxdisplaymultilinetext: "[Multi-line text: Click icon on right to edit]",
    defaultInputEchoClass: "",
    defaultInputEchoStyle: "filter:alpha(opacity=90);opacity:.9;backgroundColor:#FFD;border:1px solid #884;" + "fontSize:small;padding:2px 10px 1px 2px;cursor:default;",
    defaultInputEchoPromptClass: "",
    defaultInputEchoPromptStyle: "filter:alpha(opacity=90);opacity:.9;backgroundColor:#FFD;" + "borderLeft:1px solid #884;borderRight:1px solid #884;borderBottom:1px solid #884;" + "fontSize:small;fontStyle:italic;padding:2px 10px 1px 2px;cursor:default;",
    ietUnknownFunction: "Unknown function ",
    CH_radius1: 29,
    CH_radius2: 41,
    s_CHfillAllTooltip: "Fill Contents and Formats Down/Right",
    s_CHfillContentsTooltip: "Fill Contents Only Down/Right",
    s_CHmovePasteAllTooltip: "Move Contents and Formats",
    s_CHmovePasteContentsTooltip: "Move Contents Only",
    s_CHmoveInsertAllTooltip: "Slide Contents and Formats within Row/Col",
    s_CHmoveInsertContentsTooltip: "Slide Contents within Row/Col",
    s_CHindicatorOperationLookup: {
        Fill: "Fill",
        FillC: "Fill Contents",
        Move: "Move",
        MoveI: "Slide",
        MoveC: "Move Contents",
        MoveIC: "Slide Contents"
    },
    s_CHindicatorDirectionLookup: {
        Down: " Down",
        Right: " Right",
        Horizontal: " Horizontal",
        Vertical: " Vertical"
    },
    defaultTCSliderThickness: 9,
    defaultTCButtonThickness: 20,
    defaultTCThumbThickness: 15,
    TCmainStyle: "backgroundColor:#EEE;",
    TCmainClass: "",
    TCendcapStyle: "backgroundColor:#FFF;",
    TCendcapClass: "",
    TCpanesliderStyle: "backgroundColor:#CCC;",
    TCpanesliderClass: "",
    s_panesliderTooltiph: "Drag to lock pane vertically",
    s_panesliderTooltipv: "Drag to lock pane horizontally",
    TClessbuttonStyle: "backgroundColor:#AAA;",
    TClessbuttonClass: "",
    TClessbuttonRepeatWait: 300,
    TClessbuttonRepeatInterval: 20,
    TCmorebuttonStyle: "backgroundColor:#AAA;",
    TCmorebuttonClass: "",
    TCmorebuttonRepeatWait: 300,
    TCmorebuttonRepeatInterval: 20,
    TCscrollareaStyle: "backgroundColor:#DDD;",
    TCscrollareaClass: "",
    TCscrollareaRepeatWait: 500,
    TCscrollareaRepeatInterval: 100,
    TCthumbClass: "",
    TCthumbStyle: "backgroundColor:#CCC;",
    TCPStrackinglineClass: "tracklingine",
    TCPStrackinglineStyle: "overflow:hidden;position:absolute;zIndex:100;",
    TCPStrackinglineThickness: "2px",
    TCTDFSthumbstatusvClass: "",
    TCTDFSthumbstatusvStyle: "height:20px;width:auto;border:3px solid #808080;overflow:hidden;" + "backgroundColor:#FFF;fontSize:small;position:absolute;zIndex:100;",
    TCTDFSthumbstatushClass: "",
    TCTDFSthumbstatushStyle: "height:20px;width:auto;border:1px solid black;padding:2px;" + "backgroundColor:#FFF;fontSize:small;position:absolute;zIndex:100;",
    TCTDFSthumbstatusrownumClass: "",
    TCTDFSthumbstatusrownumStyle: "color:#FFF;background-color:#808080;font-size:small;white-space:nowrap;padding:3px;",
    TCTDFStopOffsetv: 0,
    TCTDFSleftOffsetv: -80,
    s_TCTDFthumbstatusPrefixv: "Row ",
    TCTDFStopOffseth: -30,
    TCTDFSleftOffseth: 0,
    s_TCTDFthumbstatusPrefixh: "Col ",
    TooltipOffsetX: 2,
    TooltipOffsetY: 10,
    TDpopupElementClass: "",
    TDpopupElementStyle: "border:1px solid black;padding:1px 2px 2px 2px;textAlign:center;backgroundColor:#FFF;" + "fontSize:7pt;fontFamily:Verdana,Arial,Helvetica,sans-serif;" + "position:absolute;width:auto;zIndex:110;",
    SCToolbarbackground: "background-color:#404040;",
    SCTabbackground: "background-color:#CCC;",
    SCTabselectedCSS: "font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#404040;cursor:default;border-right:1px solid #CCC;",
    SCTabplainCSS: "font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#808080;cursor:default;border-right:1px solid #CCC;",
    SCToolbartext: "font-size:x-small;font-weight:bold;color:#FFF",
    SCFormulabarheight: 30,
    SCStatuslineheight: 20,
    SCStatuslineCSS: "font-size:10px;padding:3px 0px;",
    SCFormatNumberFormats: "[cancel]:|[break]:|%loc!Default!:|[custom]:|%loc!Automatic!:general|%loc!Auto w/ commas!:[,]General|[break]:|" + "00:00|000:000|0000:0000|00000:00000|[break]:|%loc!Formula!:formula|%loc!Hidden!:hidden|[newcol]:" + "1234:0|1,234:#,##0|1,234.5:#,##0.0|1,234.56:#,##0.00|1,234.567:#,##0.000|1,234.5678:#,##0.0000|" + "[break]:|1,234%:#,##0%|1,234.5%:#,##0.0%|1,234.56%:#,##0.00%|" + "[newcol]:|$1,234:$#,##0|$1,234.5:$#,##0.0|$1,234.56:$#,##0.00|[break]:|" + "(1,234):#,##0_);(#,##0)|(1,234.5):#,##0.0_);(#,##0.0)|(1,234.56):#,##0.00_);(#,##0.00)|[break]:|" + "($1,234):$#,##0_);($#,##0)|($1,234.5):$#,##0.0_);($#,##0.0)|($1,234.56):$#,##0.00_);($#,##0.00)|" + "[newcol]:|1/4/06:m/d/yy|01/04/2006:mm/dd/yyyy|2006-01-04:yyyy-mm-dd|4-Jan-06:d-mmm-yy|04-Jan-2006:dd-mmm-yyyy|January 4, 2006:mmmm d, yyyy|" + "[break]:|1\\c23:h:mm|1\\c23 PM:h:mm AM/PM|1\\c23\\c45:h:mm:ss|01\\c23\\c45:hh:mm:ss|26\\c23 (h\\cm):[hh]:mm|69\\c45 (m\\cs):[mm]:ss|69 (s):[ss]|" + "[newcol]:|2006-01-04 01\\c23\\c45:yyyy-mm-dd hh:mm:ss|January 4, 2006:mmmm d, yyyy hh:mm:ss|Wed:ddd|Wednesday:dddd|",
    SCFormatTextFormats: "[cancel]:|[break]:|%loc!Default!:|[custom]:|%loc!Automatic!:general|%loc!Plain Text!:text-plain|" + "HTML:text-html|%loc!Wikitext!:text-wiki|%loc!Link!:text-link|%loc!Formula!:formula|%loc!Hidden!:hidden|",
    SCFormatPadsizes: "[cancel]:|[break]:|%loc!Default!:|[custom]:|%loc!No padding!:0px|" + "[newcol]:|1 pixel:1px|2 pixels:2px|3 pixels:3px|4 pixels:4px|5 pixels:5px|" + "6 pixels:6px|7 pixels:7px|8 pixels:8px|[newcol]:|9 pixels:9px|10 pixels:10px|11 pixels:11px|" + "12 pixels:12px|13 pixels:13px|14 pixels:14px|16 pixels:16px|" + "18 pixels:18px|[newcol]:|20 pixels:20px|22 pixels:22px|24 pixels:24px|28 pixels:28px|36 pixels:36px|",
    SCFormatFontsizes: "[cancel]:|[break]:|%loc!Default!:|[custom]:|X-Small:x-small|Small:small|Medium:medium|Large:large|X-Large:x-large|" + "[newcol]:|6pt:6pt|7pt:7pt|8pt:8pt|9pt:9pt|10pt:10pt|11pt:11pt|12pt:12pt|14pt:14pt|16pt:16pt|" + "[newcol]:|18pt:18pt|20pt:20pt|22pt:22pt|24pt:24pt|28pt:28pt|36pt:36pt|48pt:48pt|72pt:72pt|" + "[newcol]:|8 pixels:8px|9 pixels:9px|10 pixels:10px|11 pixels:11px|" + "12 pixels:12px|13 pixels:13px|14 pixels:14px|[newcol]:|16 pixels:16px|" + "18 pixels:18px|20 pixels:20px|22 pixels:22px|24 pixels:24px|28 pixels:28px|36 pixels:36px|",
    SCFormatFontfamilies: "[cancel]:|[break]:|%loc!Default!:|[custom]:|Verdana:Verdana,Arial,Helvetica,sans-serif|" + "Arial:arial,helvetica,sans-serif|Courier:'Courier New',Courier,monospace|",
    SCFormatFontlook: "[cancel]:|[break]:|%loc!Default!:|%loc!Normal!:normal normal|%loc!Bold!:normal bold|%loc!Italic!:italic normal|" + "%loc!Bold Italic!:italic bold",
    SCFormatTextAlignhoriz: "[cancel]:|[break]:|%loc!Default!:|%loc!Left!:left|%loc!Center!:center|%loc!Right!:right|",
    SCFormatNumberAlignhoriz: "[cancel]:|[break]:|%loc!Default!:|%loc!Left!:left|%loc!Center!:center|%loc!Right!:right|",
    SCFormatAlignVertical: "[cancel]:|[break]:|%loc!Default!:|%loc!Top!:top|%loc!Middle!:middle|%loc!Bottom!:bottom|",
    SCFormatColwidth: "[cancel]:|[break]:|%loc!Default!:|[custom]:|[newcol]:|" + "20 pixels:20|40:40|60:60|80:80|100:100|120:120|140:140|160:160|" + "[newcol]:|180 pixels:180|200:200|220:220|240:240|260:260|280:280|300:300|",
    SCFormatRecalc: "[cancel]:|[break]:|%loc!Auto!:|%loc!Manual!:off|",
    SCFormatUserMaxCol: "[cancel]:|[break]:|%loc!Default!:|[custom]:|[newcol]:|" + "Unlimited:0|10:10|20:20|30:30|40:40|50:50|60:60|80:80|100:100|",
    SCFormatUserMaxRow: "[cancel]:|[break]:|%loc!Default!:|[custom]:|[newcol]:|" + "Unlimited:0|10:10|20:20|30:30|40:40|50:50|60:60|80:80|100:100|",
    ISCButtonBorderNormal: "#404040",
    ISCButtonBorderHover: "#999",
    ISCButtonBorderDown: "#FFF",
    ISCButtonDownBackground: "#888",
    s_PopupListCancel: "[Cancel]",
    s_PopupListCustom: "Custom",
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
    SVStatuslineheight: 20,
    SVStatuslineCSS: "font-size:10px;padding:3px 0px;",
    FormatNumber_separatorchar: ",",
    FormatNumber_decimalchar: ".",
    FormatNumber_defaultCurrency: "$",
    s_FormatNumber_daynames: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
    s_FormatNumber_daynames3: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
    s_FormatNumber_monthnames: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
    s_FormatNumber_monthnames3: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
    s_FormatNumber_am: "AM",
    s_FormatNumber_am1: "A",
    s_FormatNumber_pm: "PM",
    s_FormatNumber_pm1: "P",
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
    s_sheetunavailable: "Sheet unavailable:",
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
    s_fdef_ABS: "Absolute value function. ",
    s_fdef_ACOS: "Trigonometric arccosine function. ",
    s_fdef_AND: "True if all arguments are true. ",
    s_fdef_ASIN: "Trigonometric arcsine function. ",
    s_fdef_ATAN: "Trigonometric arctan function. ",
    s_fdef_ATAN2: "Trigonometric arc tangent function (result is in radians). ",
    s_fdef_AVERAGE: "Averages the values. ",
    s_fdef_CHOOSE: "Returns the value specified by the index. The values may be ranges of cells. ",
    s_fdef_COLUMNS: "Returns the number of columns in the range. ",
    s_fdef_COS: "Trigonometric cosine function (value is in radians). ",
    s_fdef_COUNT: "Counts the number of numeric values, not blank, text, or error. ",
    s_fdef_COUNTA: "Counts the number of non-blank values. ",
    s_fdef_COUNTBLANK: 'Counts the number of blank values. (Note: "" is not blank.) ',
    s_fdef_COUNTIF: 'Counts the number of number of cells in the range that meet the criteria. The criteria may be a value ("x", 15, 1+3) or a test (>25). ',
    s_fdef_DATE: 'Returns the appropriate date value given numbers for year, month, and day. For example: DATE(2006,2,1) for February 1, 2006. Note: In this program, day "1" is December 31, 1899 and the year 1900 is not a leap year. Some programs use January 1, 1900, as day "1" and treat 1900 as a leap year. In both cases, though, dates on or after March 1, 1900, are the same. ',
    s_fdef_DAVERAGE: "Averages the values in the specified field in records that meet the criteria. ",
    s_fdef_DAY: "Returns the day of month for a date value. ",
    s_fdef_DCOUNT: "Counts the number of numeric values, not blank, text, or error, in the specified field in records that meet the criteria. ",
    s_fdef_DCOUNTA: "Counts the number of non-blank values in the specified field in records that meet the criteria. ",
    s_fdef_DDB: "Returns the amount of depreciation at the given period of time (the default factor is 2 for double-declining balance).   ",
    s_fdef_DEGREES: "Converts value in radians into degrees. ",
    s_fdef_DGET: "Returns the value of the specified field in the single record that meets the criteria. ",
    s_fdef_DMAX: "Returns the maximum of the numeric values in the specified field in records that meet the criteria. ",
    s_fdef_DMIN: "Returns the maximum of the numeric values in the specified field in records that meet the criteria. ",
    s_fdef_DPRODUCT: "Returns the result of multiplying the numeric values in the specified field in records that meet the criteria. ",
    s_fdef_DSTDEV: "Returns the sample standard deviation of the numeric values in the specified field in records that meet the criteria. ",
    s_fdef_DSTDEVP: "Returns the standard deviation of the numeric values in the specified field in records that meet the criteria. ",
    s_fdef_DSUM: "Returns the sum of the numeric values in the specified field in records that meet the criteria. ",
    s_fdef_DVAR: "Returns the sample variance of the numeric values in the specified field in records that meet the criteria. ",
    s_fdef_DVARP: "Returns the variance of the numeric values in the specified field in records that meet the criteria. ",
    s_fdef_EVEN: "Rounds the value up in magnitude to the nearest even integer. ",
    s_fdef_EXACT: 'Returns "true" if the values are exactly the same, including case, type, etc. ',
    s_fdef_EXP: "Returns e raised to the value power. ",
    s_fdef_FACT: "Returns factorial of the value. ",
    s_fdef_FALSE: 'Returns the logical value "false". ',
    s_fdef_FIND: 'Returns the starting position within string2 of the first occurrence of string1 at or after "start". If start is omitted, 1 is assumed. ',
    s_fdef_FV: "Returns the future value of repeated payments of money invested at the given rate for the specified number of periods, with optional present value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). ",
    s_fdef_HLOOKUP: "Look for the matching value for the given value in the range and return the corresponding value in the cell specified by the row offset. If rangelookup is 1 (the default) and not 0, match if within numeric brackets (match<=value) instead of exact match. ",
    s_fdef_HOUR: "Returns the hour portion of a time or date/time value. ",
    s_fdef_IF: "Results in true-value if logical-expression is TRUE or non-zero, otherwise results in false-value. ",
    s_fdef_INDEX: "Returns a cell or range reference for the specified row and column in the range. If range is 1-dimensional, then only one of rownum or colnum are needed. If range is 2-dimensional and rownum or colnum are zero, a reference to the range of just the specified column or row is returned. You can use the returned reference value in a range, e.g., sum(A1:INDEX(A2:A10,4)). ",
    s_fdef_INT: "Returns the value rounded down to the nearest integer (towards -infinity). ",
    s_fdef_IRR: "Returns the interest rate at which the cash flows in the range have a net present value of zero. Uses an iterative process that will return #NUM! error if it does not converge. There may be more than one possible solution. Providing the optional guess value may help in certain situations where it does not converge or finds an inappropriate solution (the default guess is 10%). ",
    s_fdef_ISBLANK: 'Returns "true" if the value is a reference to a blank cell. ',
    s_fdef_ISERR: 'Returns "true" if the value is of type "Error" but not "NA". ',
    s_fdef_ISERROR: 'Returns "true" if the value is of type "Error". ',
    s_fdef_ISLOGICAL: 'Returns "true" if the value is of type "Logical" (true/false). ',
    s_fdef_ISNA: 'Returns "true" if the value is the error type "NA". ',
    s_fdef_ISNONTEXT: 'Returns "true" if the value is not of type "Text". ',
    s_fdef_ISNUMBER: 'Returns "true" if the value is of type "Number" (including logical values). ',
    s_fdef_ISTEXT: 'Returns "true" if the value is of type "Text". ',
    s_fdef_LEFT: "Returns the specified number of characters from the text value. If count is omitted, 1 is assumed. ",
    s_fdef_LEN: "Returns the number of characters in the text value. ",
    s_fdef_LN: "Returns the natural logarithm of the value. ",
    s_fdef_LOG: "Returns the logarithm of the value using the specified base. ",
    s_fdef_LOG10: "Returns the base 10 logarithm of the value. ",
    s_fdef_LOWER: "Returns the text value with all uppercase characters converted to lowercase. ",
    s_fdef_MATCH: "Look for the matching value for the given value in the range and return position (the first is 1) in that range. If rangelookup is 1 (the default) and not 0, match if within numeric brackets (match<=value) instead of exact match. If rangelookup is -1, act like 1 but the bracket is match>=value. ",
    s_fdef_MAX: "Returns the maximum of the numeric values. ",
    s_fdef_MID: "Returns the specified number of characters from the text value starting from the specified position. ",
    s_fdef_MIN: "Returns the minimum of the numeric values. ",
    s_fdef_MINUTE: "Returns the minute portion of a time or date/time value. ",
    s_fdef_MOD: "Returns the remainder of the first value divided by the second. ",
    s_fdef_MONTH: "Returns the month part of a date value. ",
    s_fdef_N: "Returns the value if it is a numeric value otherwise an error. ",
    s_fdef_NA: "Returns the #N/A error value which propagates through most operations. ",
    s_fdef_NOT: "Returns FALSE if value is true, and TRUE if it is false. ",
    s_fdef_NOW: "Returns the current date/time. ",
    s_fdef_NPER: "Returns the number of periods at which payments invested each period at the given rate with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period) has the given present value. ",
    s_fdef_NPV: "Returns the net present value of cash flows (which may be individual values and/or ranges) at the given rate. The flows are positive if income, negative if paid out, and are assumed at the end of each period. ",
    s_fdef_ODD: "Rounds the value up in magnitude to the nearest odd integer. ",
    s_fdef_OR: "True if any argument is true ",
    s_fdef_PI: "The value 3.1415926... ",
    s_fdef_PMT: "Returns the amount of each payment that must be invested at the given rate for the specified number of periods to have the specified present value, with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). ",
    s_fdef_POWER: "Returns the first value raised to the second value power. ",
    s_fdef_PRODUCT: "Returns the result of multiplying the numeric values. ",
    s_fdef_PROPER: "Returns the text value with the first letter of each word converted to uppercase and the others to lowercase. ",
    s_fdef_PV: "Returns the present value of the given number of payments each invested at the given rate, with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). ",
    s_fdef_RADIANS: "Converts value in degrees into radians. ",
    s_fdef_RATE: "Returns the rate at which the given number of payments each invested at the given rate has the specified present value, with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). Uses an iterative process that will return #NUM! error if it does not converge. There may be more than one possible solution. Providing the optional guess value may help in certain situations where it does not converge or finds an inappropriate solution (the default guess is 10%). ",
    s_fdef_REPLACE: "Returns text1 with the specified number of characters starting from the specified position replaced by text2. ",
    s_fdef_REPT: "Returns the text repeated the specified number of times. ",
    s_fdef_RIGHT: "Returns the specified number of characters from the text value starting from the end. If count is omitted, 1 is assumed. ",
    s_fdef_ROUND: "Rounds the value to the specified number of decimal places. If precision is negative, then round to powers of 10. The default precision is 0 (round to integer). ",
    s_fdef_ROWS: "Returns the number of rows in the range. ",
    s_fdef_SECOND: "Returns the second portion of a time or date/time value (truncated to an integer). ",
    s_fdef_SIN: "Trigonometric sine function (value is in radians) ",
    s_fdef_SLN: "Returns the amount of depreciation at each period of time using the straight-line method. ",
    s_fdef_SQRT: "Square root of the value ",
    s_fdef_STDEV: "Returns the sample standard deviation of the numeric values. ",
    s_fdef_STDEVP: "Returns the standard deviation of the numeric values. ",
    s_fdef_SUBSTITUTE: 'Returns text1 with the all occurrences of oldtext replaced by newtext. If "occurrence" is present, then only that occurrence is replaced. ',
    s_fdef_SUM: "Adds the numeric values. The values to the sum function may be ranges in the form similar to A1:B5. ",
    s_fdef_SUMIF: 'Sums the numeric values of cells in the range that meet the criteria. The criteria may be a value ("x", 15, 1+3) or a test (>25). If range2 is present, then range1 is tested and the corresponding range2 value is summed. ',
    s_fdef_SYD: "Depreciation by Sum of Year's Digits method. ",
    s_fdef_T: "Returns the text value or else a null string. ",
    s_fdef_TAN: "Trigonometric tangent function (value is in radians) ",
    s_fdef_TIME: "Returns the time value given the specified hour, minute, and second. ",
    s_fdef_TODAY: 'Returns the current date (an integer). Note: In this program, day "1" is December 31, 1899 and the year 1900 is not a leap year. Some programs use January 1, 1900, as day "1" and treat 1900 as a leap year. In both cases, though, dates on or after March 1, 1900, are the same. ',
    s_fdef_TRIM: "Returns the text value with leading, trailing, and repeated spaces removed. ",
    s_fdef_TRUE: 'Returns the logical value "true". ',
    s_fdef_TRUNC: "Truncates the value to the specified number of decimal places. If precision is negative, truncate to powers of 10. ",
    s_fdef_UPPER: "Returns the text value with all lowercase characters converted to uppercase. ",
    s_fdef_VALUE: "Converts the specified text value into a numeric value. Various forms that look like numbers (including digits followed by %, forms that look like dates, etc.) are handled. This may not handle all of the forms accepted by other spreadsheets and may be locale dependent. ",
    s_fdef_VAR: "Returns the sample variance of the numeric values. ",
    s_fdef_VARP: "Returns the variance of the numeric values. ",
    s_fdef_VLOOKUP: "Look for the matching value for the given value in the range and return the corresponding value in the cell specified by the column offset. If rangelookup is 1 (the default) and not 0, match if within numeric brackets (match>=value) instead of exact match. ",
    s_fdef_WEEKDAY: "Returns the day of week specified by the date value. If type is 1 (the default), Sunday is day and Saturday is day 7. If type is 2, Monday is day 1 and Sunday is day 7. If type is 3, Monday is day 0 and Sunday is day 6. ",
    s_fdef_YEAR: "Returns the year part of a date value. ",
    s_fdef_SUMPRODUCT: "Sums the pairwise products of 2 or more ranges. The ranges must be of equal length.",
    s_fdef_CEILING: "Rounds the given number up to the nearest integer or multiple of significance. Significance is the value to whose multiple of ten the value is to be rounded up (.01, .1, 1, 10, etc.)",
    s_fdef_FLOOR: "Rounds the given number down to the nearest multiple of significance. Significance is the value to whose multiple of ten the number is to be rounded down (.01, .1, 1, 10, etc.)",
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
    s_farg_vsig: "value, [significance]",
    function_classlist: [ "all", "stat", "lookup", "datetime", "financial", "test", "math", "text" ],
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
    cteGriddiv: "",
    defaultInputEcho: {
        classname: "",
        style: "filter:alpha(opacity=90);opacity:.9;"
    },
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

SocialCalc.ConstantsSetClasses = function(prefix) {
    var defaults = SocialCalc.ConstantsDefaultClasses;
    var scc = SocialCalc.Constants;
    var item;
    prefix = prefix || "";
    for (item in defaults) {
        if (typeof defaults[item] == "string") {
            scc[item + "Class"] = prefix + (defaults[item] || item);
            if (scc[item + "Style"] !== undefined) {
                scc[item + "Style"] = "";
            }
        } else if (typeof defaults[item] == "object") {
            scc[item + "Class"] = prefix + (defaults[item].classname || item);
            scc[item + "Style"] = defaults[item].style;
        }
    }
};

SocialCalc.ConstantsSetImagePrefix = function(imagePrefix) {
    var scc = SocialCalc.Constants;
    for (var item in scc) {
        if (typeof scc[item] == "string") {
            scc[item] = scc[item].replace(scc.defaultImagePrefix, imagePrefix);
        }
    }
    scc.defaultImagePrefix = imagePrefix;
};

var SocialCalc;

if (!SocialCalc) SocialCalc = {};

SocialCalc.Callbacks = {
    expand_wiki: null,
    expand_markup: function(displayvalue, sheetobj, linkstyle) {
        return SocialCalc.default_expand_markup(displayvalue, sheetobj, linkstyle);
    },
    MakePageLink: null,
    NormalizeSheetName: null
};

SocialCalc.Cell = function(coord) {
    this.coord = coord;
    this.datavalue = "";
    this.datatype = null;
    this.formula = "";
    this.valuetype = "b";
    this.readonly = false;
};

SocialCalc.CellProperties = {
    coord: 1,
    datavalue: 1,
    datatype: 1,
    formula: 1,
    valuetype: 1,
    errors: 1,
    comment: 1,
    readonly: 1,
    bt: 2,
    br: 2,
    bb: 2,
    bl: 2,
    layout: 2,
    font: 2,
    color: 2,
    bgcolor: 2,
    cellformat: 2,
    nontextvalueformat: 2,
    textvalueformat: 2,
    colspan: 2,
    rowspan: 2,
    cssc: 2,
    csss: 2,
    mod: 2,
    displaystring: 3,
    parseinfo: 3,
    hcolspan: 3,
    hrowspan: 3
};

SocialCalc.CellPropertiesTable = {
    bt: "borderstyle",
    br: "borderstyle",
    bb: "borderstyle",
    bl: "borderstyle",
    layout: "layout",
    font: "font",
    color: "color",
    bgcolor: "color",
    cellformat: "cellformat",
    nontextvalueformat: "valueformat",
    textvalueformat: "valueformat"
};

SocialCalc.Sheet = function() {
    SocialCalc.ResetSheet(this);
    this.statuscallback = null;
    this.statuscallbackparams = null;
};

SocialCalc.ResetSheet = function(sheet, reload) {
    sheet.cells = {};
    sheet.attribs = {
        lastcol: 1,
        lastrow: 1,
        defaultlayout: 0,
        usermaxcol: 0,
        usermaxrow: 0
    };
    sheet.rowattribs = {
        hide: {},
        height: {}
    };
    sheet.colattribs = {
        width: {},
        hide: {}
    };
    sheet.names = {};
    sheet.layouts = [];
    sheet.layouthash = {};
    sheet.fonts = [];
    sheet.fonthash = {};
    sheet.colors = [];
    sheet.colorhash = {};
    sheet.borderstyles = [];
    sheet.borderstylehash = {};
    sheet.cellformats = [];
    sheet.cellformathash = {};
    sheet.valueformats = [];
    sheet.valueformathash = {};
    sheet.matched_cells = [];
    sheet.selected_search_cell = undefined;
    sheet.copiedfrom = "";
    sheet.changes = new SocialCalc.UndoStack();
    sheet.renderneeded = false;
    sheet.changedrendervalues = true;
    sheet.recalcchangedavalue = false;
    sheet.hiddencolrow = "";
    sheet.sci = new SocialCalc.SheetCommandInfo(sheet);
};

SocialCalc.Sheet.prototype.ResetSheet = function() {
    SocialCalc.ResetSheet(this);
};

SocialCalc.Sheet.prototype.AddCell = function(newcell) {
    return this.cells[newcell.coord] = newcell;
};

SocialCalc.Sheet.prototype.GetAssuredCell = function(coord) {
    return this.cells[coord] || this.AddCell(new SocialCalc.Cell(coord));
};

SocialCalc.Sheet.prototype.ParseSheetSave = function(savedsheet) {
    SocialCalc.ParseSheetSave(savedsheet, this);
};

SocialCalc.Sheet.prototype.CellFromStringParts = function(cell, parts, j) {
    return SocialCalc.CellFromStringParts(this, cell, parts, j);
};

SocialCalc.Sheet.prototype.CreateSheetSave = function(range, canonicalize) {
    return SocialCalc.CreateSheetSave(this, range, canonicalize);
};

SocialCalc.Sheet.prototype.CellToString = function(cell) {
    return SocialCalc.CellToString(this, cell);
};

SocialCalc.Sheet.prototype.CanonicalizeSheet = function(full) {
    return SocialCalc.CanonicalizeSheet(this, full);
};

SocialCalc.Sheet.prototype.EncodeCellAttributes = function(coord) {
    return SocialCalc.EncodeCellAttributes(this, coord);
};

SocialCalc.Sheet.prototype.EncodeSheetAttributes = function() {
    return SocialCalc.EncodeSheetAttributes(this);
};

SocialCalc.Sheet.prototype.DecodeCellAttributes = function(coord, attribs, range) {
    return SocialCalc.DecodeCellAttributes(this, coord, attribs, range);
};

SocialCalc.Sheet.prototype.DecodeSheetAttributes = function(attribs) {
    return SocialCalc.DecodeSheetAttributes(this, attribs);
};

SocialCalc.Sheet.prototype.ScheduleSheetCommands = function(cmd, saveundo) {
    return SocialCalc.ScheduleSheetCommands(this, cmd, saveundo);
};

SocialCalc.Sheet.prototype.SheetUndo = function() {
    return SocialCalc.SheetUndo(this);
};

SocialCalc.Sheet.prototype.SheetRedo = function() {
    return SocialCalc.SheetRedo(this);
};

SocialCalc.Sheet.prototype.CreateAuditString = function() {
    return SocialCalc.CreateAuditString(this);
};

SocialCalc.Sheet.prototype.GetStyleNum = function(atype, style) {
    return SocialCalc.GetStyleNum(this, atype, style);
};

SocialCalc.Sheet.prototype.GetStyleString = function(atype, num) {
    return SocialCalc.GetStyleString(this, atype, num);
};

SocialCalc.Sheet.prototype.RecalcSheet = function() {
    return SocialCalc.RecalcSheet(this);
};

SocialCalc.ParseSheetSave = function(savedsheet, sheetobj) {
    var lines = savedsheet.split(/\r\n|\n/);
    var parts = [];
    var line;
    var i, j, t, v, coord, cell, attribs, name;
    var scc = SocialCalc.Constants;
    for (i = 0; i < lines.length; i++) {
        line = lines[i];
        parts = line.split(":");
        switch (parts[0]) {
          case "cell":
            cell = sheetobj.GetAssuredCell(parts[1]);
            j = 2;
            sheetobj.CellFromStringParts(cell, parts, j);
            break;

          case "col":
            coord = parts[1];
            j = 2;
            while (t = parts[j++]) {
                switch (t) {
                  case "w":
                    sheetobj.colattribs.width[coord] = parts[j++];
                    break;

                  case "hide":
                    sheetobj.colattribs.hide[coord] = parts[j++];
                    break;

                  default:
                    throw scc.s_pssUnknownColType + " '" + t + "'";
                    break;
                }
            }
            break;

          case "row":
            coord = parts[1] - 0;
            j = 2;
            while (t = parts[j++]) {
                switch (t) {
                  case "h":
                    sheetobj.rowattribs.height[coord] = parts[j++] - 0;
                    break;

                  case "hide":
                    sheetobj.rowattribs.hide[coord] = parts[j++];
                    break;

                  default:
                    throw scc.s_pssUnknownRowType + " '" + t + "'";
                    break;
                }
            }
            break;

          case "sheet":
            attribs = sheetobj.attribs;
            j = 1;
            while (t = parts[j++]) {
                switch (t) {
                  case "c":
                    attribs.lastcol = parts[j++] - 0;
                    break;

                  case "r":
                    attribs.lastrow = parts[j++] - 0;
                    break;

                  case "w":
                    attribs.defaultcolwidth = parts[j++] + "";
                    break;

                  case "h":
                    attribs.defaultrowheight = parts[j++] - 0;
                    break;

                  case "tf":
                    attribs.defaulttextformat = parts[j++] - 0;
                    break;

                  case "ntf":
                    attribs.defaultnontextformat = parts[j++] - 0;
                    break;

                  case "layout":
                    attribs.defaultlayout = parts[j++] - 0;
                    break;

                  case "font":
                    attribs.defaultfont = parts[j++] - 0;
                    break;

                  case "tvf":
                    attribs.defaulttextvalueformat = parts[j++] - 0;
                    break;

                  case "ntvf":
                    attribs.defaultnontextvalueformat = parts[j++] - 0;
                    break;

                  case "color":
                    attribs.defaultcolor = parts[j++] - 0;
                    break;

                  case "bgcolor":
                    attribs.defaultbgcolor = parts[j++] - 0;
                    break;

                  case "circularreferencecell":
                    attribs.circularreferencecell = parts[j++];
                    break;

                  case "recalc":
                    attribs.recalc = parts[j++];
                    break;

                  case "needsrecalc":
                    attribs.needsrecalc = parts[j++];
                    break;

                  case "usermaxcol":
                    attribs.usermaxcol = parts[j++] - 0;
                    break;

                  case "usermaxrow":
                    attribs.usermaxrow = parts[j++] - 0;
                    break;

                  default:
                    j += 1;
                    break;
                }
            }
            break;

          case "name":
            name = SocialCalc.decodeFromSave(parts[1]).toUpperCase();
            sheetobj.names[name] = {
                desc: SocialCalc.decodeFromSave(parts[2])
            };
            sheetobj.names[name].definition = SocialCalc.decodeFromSave(parts[3]);
            break;

          case "layout":
            parts = lines[i].match(/^layout\:(\d+)\:(.+)$/);
            sheetobj.layouts[parts[1] - 0] = parts[2];
            sheetobj.layouthash[parts[2]] = parts[1] - 0;
            break;

          case "font":
            sheetobj.fonts[parts[1] - 0] = parts[2];
            sheetobj.fonthash[parts[2]] = parts[1] - 0;
            break;

          case "color":
            sheetobj.colors[parts[1] - 0] = parts[2];
            sheetobj.colorhash[parts[2]] = parts[1] - 0;
            break;

          case "border":
            sheetobj.borderstyles[parts[1] - 0] = parts[2];
            sheetobj.borderstylehash[parts[2]] = parts[1] - 0;
            break;

          case "cellformat":
            v = SocialCalc.decodeFromSave(parts[2]);
            sheetobj.cellformats[parts[1] - 0] = v;
            sheetobj.cellformathash[v] = parts[1] - 0;
            break;

          case "valueformat":
            v = SocialCalc.decodeFromSave(parts[2]);
            sheetobj.valueformats[parts[1] - 0] = v;
            sheetobj.valueformathash[v] = parts[1] - 0;
            break;

          case "version":
            break;

          case "copiedfrom":
            sheetobj.copiedfrom = parts[1] + ":" + parts[2];
            break;

          case "clipboardrange":
          case "clipboard":
            break;

          case "":
            break;

          default:
            alert(scc.s_pssUnknownLineType + " '" + parts[0] + "'");
            throw scc.s_pssUnknownLineType + " '" + parts[0] + "'";
            break;
        }
        parts = null;
    }
};

SocialCalc.CellFromStringParts = function(sheet, cell, parts, j) {
    var cell, t, v;
    while (t = parts[j++]) {
        switch (t) {
          case "v":
            cell.datavalue = SocialCalc.decodeFromSave(parts[j++]) - 0;
            cell.datatype = "v";
            cell.valuetype = "n";
            break;

          case "t":
            cell.datavalue = SocialCalc.decodeFromSave(parts[j++]);
            cell.datatype = "t";
            cell.valuetype = SocialCalc.Constants.textdatadefaulttype;
            break;

          case "vt":
            v = parts[j++];
            cell.valuetype = v;
            if (v.charAt(0) == "n") {
                cell.datatype = "v";
                cell.datavalue = SocialCalc.decodeFromSave(parts[j++]) - 0;
            } else {
                cell.datatype = "t";
                cell.datavalue = SocialCalc.decodeFromSave(parts[j++]);
            }
            break;

          case "vtf":
            v = parts[j++];
            cell.valuetype = v;
            if (v.charAt(0) == "n") {
                cell.datavalue = SocialCalc.decodeFromSave(parts[j++]) - 0;
            } else {
                cell.datavalue = SocialCalc.decodeFromSave(parts[j++]);
            }
            cell.formula = SocialCalc.decodeFromSave(parts[j++]);
            cell.datatype = "f";
            break;

          case "vtc":
            v = parts[j++];
            cell.valuetype = v;
            if (v.charAt(0) == "n") {
                cell.datavalue = SocialCalc.decodeFromSave(parts[j++]) - 0;
            } else {
                cell.datavalue = SocialCalc.decodeFromSave(parts[j++]);
            }
            cell.formula = SocialCalc.decodeFromSave(parts[j++]);
            cell.datatype = "c";
            break;

          case "ro":
            ro = SocialCalc.decodeFromSave(parts[j++]);
            cell.readonly = ro.toLowerCase() == "yes";
            break;

          case "e":
            cell.errors = SocialCalc.decodeFromSave(parts[j++]);
            break;

          case "b":
            cell.bt = parts[j++] - 0;
            cell.br = parts[j++] - 0;
            cell.bb = parts[j++] - 0;
            cell.bl = parts[j++] - 0;
            break;

          case "l":
            cell.layout = parts[j++] - 0;
            break;

          case "f":
            cell.font = parts[j++] - 0;
            break;

          case "c":
            cell.color = parts[j++] - 0;
            break;

          case "bg":
            cell.bgcolor = parts[j++] - 0;
            break;

          case "cf":
            cell.cellformat = parts[j++] - 0;
            break;

          case "ntvf":
            cell.nontextvalueformat = parts[j++] - 0;
            break;

          case "tvf":
            cell.textvalueformat = parts[j++] - 0;
            break;

          case "colspan":
            cell.colspan = parts[j++] - 0;
            break;

          case "rowspan":
            cell.rowspan = parts[j++] - 0;
            break;

          case "cssc":
            cell.cssc = parts[j++];
            break;

          case "csss":
            cell.csss = SocialCalc.decodeFromSave(parts[j++]);
            break;

          case "mod":
            j += 1;
            break;

          case "comment":
            cell.comment = SocialCalc.decodeFromSave(parts[j++]);
            break;

          default:
            throw SocialCalc.Constants.s_cfspUnknownCellType + " '" + t + "'";
            break;
        }
    }
};

SocialCalc.sheetfields = [ "defaultrowheight", "defaultcolwidth", "circularreferencecell", "recalc", "needsrecalc", "usermaxcol", "usermaxrow" ];

SocialCalc.sheetfieldsshort = [ "h", "w", "circularreferencecell", "recalc", "needsrecalc", "usermaxcol", "usermaxrow" ];

SocialCalc.sheetfieldsxlat = [ "defaulttextformat", "defaultnontextformat", "defaulttextvalueformat", "defaultnontextvalueformat", "defaultcolor", "defaultbgcolor", "defaultfont", "defaultlayout" ];

SocialCalc.sheetfieldsxlatshort = [ "tf", "ntf", "tvf", "ntvf", "color", "bgcolor", "font", "layout" ];

SocialCalc.sheetfieldsxlatxlt = [ "cellformat", "cellformat", "valueformat", "valueformat", "color", "color", "font", "layout" ];

SocialCalc.CreateSheetSave = function(sheetobj, range, canonicalize) {
    var cell, cr1, cr2, row, col, coord, attrib, line, value, formula, i, t, r, b, l, name, blanklen;
    var result = [];
    var prange;
    sheetobj.CanonicalizeSheet(canonicalize || SocialCalc.Constants.doCanonicalizeSheet);
    var xlt = sheetobj.xlt;
    if (range) {
        prange = SocialCalc.ParseRange(range);
    } else {
        prange = {
            cr1: {
                row: 1,
                col: 1
            },
            cr2: {
                row: xlt.maxrow,
                col: xlt.maxcol
            }
        };
    }
    cr1 = prange.cr1;
    cr2 = prange.cr2;
    result.push("version:1.5");
    for (row = cr1.row; row <= cr2.row; row++) {
        for (col = cr1.col; col <= cr2.col; col++) {
            coord = SocialCalc.crToCoord(col, row);
            cell = sheetobj.cells[coord];
            if (!cell) continue;
            line = sheetobj.CellToString(cell);
            if (line.length == 0) continue;
            line = "cell:" + coord + line;
            result.push(line);
        }
    }
    for (col = 1; col <= xlt.maxcol; col++) {
        coord = SocialCalc.rcColname(col);
        if (sheetobj.colattribs.width[coord]) result.push("col:" + coord + ":w:" + sheetobj.colattribs.width[coord]);
        if (sheetobj.colattribs.hide[coord]) result.push("col:" + coord + ":hide:" + sheetobj.colattribs.hide[coord]);
    }
    for (row = 1; row <= xlt.maxrow; row++) {
        if (sheetobj.rowattribs.height[row]) result.push("row:" + row + ":h:" + sheetobj.rowattribs.height[row]);
        if (sheetobj.rowattribs.hide[row]) result.push("row:" + row + ":hide:" + sheetobj.rowattribs.hide[row]);
    }
    line = "sheet:c:" + xlt.maxcol + ":r:" + xlt.maxrow;
    for (i = 0; i < SocialCalc.sheetfields.length; i++) {
        value = SocialCalc.encodeForSave(sheetobj.attribs[SocialCalc.sheetfields[i]]);
        if (value) line += ":" + SocialCalc.sheetfieldsshort[i] + ":" + value;
    }
    for (i = 0; i < SocialCalc.sheetfieldsxlat.length; i++) {
        value = sheetobj.attribs[SocialCalc.sheetfieldsxlat[i]];
        if (value) line += ":" + SocialCalc.sheetfieldsxlatshort[i] + ":" + xlt[SocialCalc.sheetfieldsxlatxlt[i] + "sxlat"][value];
    }
    result.push(line);
    for (i = 1; i < xlt.newborderstyles.length; i++) {
        result.push("border:" + i + ":" + xlt.newborderstyles[i]);
    }
    for (i = 1; i < xlt.newcellformats.length; i++) {
        result.push("cellformat:" + i + ":" + SocialCalc.encodeForSave(xlt.newcellformats[i]));
    }
    for (i = 1; i < xlt.newcolors.length; i++) {
        result.push("color:" + i + ":" + xlt.newcolors[i]);
    }
    for (i = 1; i < xlt.newfonts.length; i++) {
        result.push("font:" + i + ":" + xlt.newfonts[i]);
    }
    for (i = 1; i < xlt.newlayouts.length; i++) {
        result.push("layout:" + i + ":" + xlt.newlayouts[i]);
    }
    for (i = 1; i < xlt.newvalueformats.length; i++) {
        result.push("valueformat:" + i + ":" + SocialCalc.encodeForSave(xlt.newvalueformats[i]));
    }
    for (i = 0; i < xlt.namesorder.length; i++) {
        name = xlt.namesorder[i];
        result.push("name:" + SocialCalc.encodeForSave(name).toUpperCase() + ":" + SocialCalc.encodeForSave(sheetobj.names[name].desc) + ":" + SocialCalc.encodeForSave(sheetobj.names[name].definition));
    }
    if (range) {
        result.push("copiedfrom:" + SocialCalc.crToCoord(cr1.col, cr1.row) + ":" + SocialCalc.crToCoord(cr2.col, cr2.row));
    }
    result.push("");
    delete sheetobj.xlt;
    return result.join("\n");
};

SocialCalc.CellToString = function(sheet, cell) {
    var cell, line, value, formula, t, r, b, l, xlt;
    line = "";
    if (!cell) return line;
    value = SocialCalc.encodeForSave(cell.datavalue);
    if (cell.datatype == "v") {
        if (cell.valuetype == "n") line += ":v:" + value; else line += ":vt:" + cell.valuetype + ":" + value;
    } else if (cell.datatype == "t") {
        if (cell.valuetype == SocialCalc.Constants.textdatadefaulttype) line += ":t:" + value; else line += ":vt:" + cell.valuetype + ":" + value;
    } else {
        formula = SocialCalc.encodeForSave(cell.formula);
        if (cell.datatype == "f") {
            line += ":vtf:" + cell.valuetype + ":" + value + ":" + formula;
        } else if (cell.datatype == "c") {
            line += ":vtc:" + cell.valuetype + ":" + value + ":" + formula;
        }
    }
    if (cell.readonly) {
        line += ":ro:yes";
    }
    if (cell.errors) {
        line += ":e:" + SocialCalc.encodeForSave(cell.errors);
    }
    t = cell.bt || "";
    r = cell.br || "";
    b = cell.bb || "";
    l = cell.bl || "";
    if (sheet.xlt) {
        xlt = sheet.xlt;
        if (t || r || b || l) line += ":b:" + xlt.borderstylesxlat[t || 0] + ":" + xlt.borderstylesxlat[r || 0] + ":" + xlt.borderstylesxlat[b || 0] + ":" + xlt.borderstylesxlat[l || 0];
        if (cell.layout) line += ":l:" + xlt.layoutsxlat[cell.layout];
        if (cell.font) line += ":f:" + xlt.fontsxlat[cell.font];
        if (cell.color) line += ":c:" + xlt.colorsxlat[cell.color];
        if (cell.bgcolor) line += ":bg:" + xlt.colorsxlat[cell.bgcolor];
        if (cell.cellformat) line += ":cf:" + xlt.cellformatsxlat[cell.cellformat];
        if (cell.textvalueformat) line += ":tvf:" + xlt.valueformatsxlat[cell.textvalueformat];
        if (cell.nontextvalueformat) line += ":ntvf:" + xlt.valueformatsxlat[cell.nontextvalueformat];
    } else {
        if (t || r || b || l) line += ":b:" + t + ":" + r + ":" + b + ":" + l;
        if (cell.layout) line += ":l:" + cell.layout;
        if (cell.font) line += ":f:" + cell.font;
        if (cell.color) line += ":c:" + cell.color;
        if (cell.bgcolor) line += ":bg:" + cell.bgcolor;
        if (cell.cellformat) line += ":cf:" + cell.cellformat;
        if (cell.textvalueformat) line += ":tvf:" + cell.textvalueformat;
        if (cell.nontextvalueformat) line += ":ntvf:" + cell.nontextvalueformat;
    }
    if (cell.colspan) line += ":colspan:" + cell.colspan;
    if (cell.rowspan) line += ":rowspan:" + cell.rowspan;
    if (cell.cssc) line += ":cssc:" + cell.cssc;
    if (cell.csss) line += ":csss:" + SocialCalc.encodeForSave(cell.csss);
    if (cell.mod) line += ":mod:" + cell.mod;
    if (cell.comment) line += ":comment:" + SocialCalc.encodeForSave(cell.comment);
    return line;
};

SocialCalc.CanonicalizeSheet = function(sheetobj, full) {
    var l, coord, cr, cell, filled, an, a, newa, newxlat, used, ahash, i, v;
    var maxrow = 0;
    var maxcol = 0;
    var alist = [ "borderstyle", "cellformat", "color", "font", "layout", "valueformat" ];
    var xlt = {};
    xlt.namesorder = [];
    for (a in sheetobj.names) {
        xlt.namesorder.push(a);
    }
    xlt.namesorder.sort();
    if (!SocialCalc.Constants.doCanonicalizeSheet || !full) {
        for (an = 0; an < alist.length; an++) {
            a = alist[an];
            xlt["new" + a + "s"] = sheetobj[a + "s"];
            l = sheetobj[a + "s"].length;
            newxlat = new Array(l);
            newxlat[0] = "";
            for (i = 1; i < l; i++) {
                newxlat[i] = i;
            }
            xlt[a + "sxlat"] = newxlat;
        }
        xlt.maxrow = sheetobj.attribs.lastrow;
        xlt.maxcol = sheetobj.attribs.lastcol;
        sheetobj.xlt = xlt;
        return;
    }
    for (an = 0; an < alist.length; an++) {
        a = alist[an];
        xlt[a + "sUsed"] = {};
    }
    var colorsUsed = xlt.colorsUsed;
    var borderstylesUsed = xlt.borderstylesUsed;
    var fontsUsed = xlt.fontsUsed;
    var layoutsUsed = xlt.layoutsUsed;
    var cellformatsUsed = xlt.cellformatsUsed;
    var valueformatsUsed = xlt.valueformatsUsed;
    for (coord in sheetobj.cells) {
        cr = SocialCalc.coordToCr(coord);
        cell = sheetobj.cells[coord];
        filled = false;
        if (cell.valuetype && cell.valuetype != "b") filled = true;
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
    for (i = 0; i < SocialCalc.sheetfieldsxlat.length; i++) {
        v = sheetobj.attribs[SocialCalc.sheetfieldsxlat[i]];
        if (v) {
            xlt[SocialCalc.sheetfieldsxlatxlt[i] + "sUsed"][v] = 1;
        }
    }
    a = {
        height: 1,
        hide: 1
    };
    for (v in a) {
        for (cr in sheetobj.rowattribs[v]) {
            if (cr > maxrow) maxrow = cr;
        }
    }
    a = {
        hide: 1,
        width: 1
    };
    for (v in a) {
        for (coord in sheetobj.colattribs[v]) {
            cr = SocialCalc.coordToCr(coord + "1");
            if (cr.col > maxcol) maxcol = cr.col;
        }
    }
    for (an = 0; an < alist.length; an++) {
        a = alist[an];
        newa = [];
        used = xlt[a + "sUsed"];
        for (v in used) {
            newa.push(sheetobj[a + "s"][v]);
        }
        newa.sort();
        newa.unshift("");
        newxlat = [ "" ];
        ahash = sheetobj[a + "hash"];
        for (i = 1; i < newa.length; i++) {
            newxlat[ahash[newa[i]]] = i;
        }
        xlt[a + "sxlat"] = newxlat;
        xlt["new" + a + "s"] = newa;
    }
    xlt.maxrow = maxrow || 1;
    xlt.maxcol = maxcol || 1;
    sheetobj.xlt = xlt;
};

SocialCalc.EncodeCellAttributes = function(sheet, coord) {
    var value, i, b, bb;
    var result = {};
    var InitAttrib = function(name) {
        result[name] = {
            def: true,
            val: ""
        };
    };
    var InitAttribs = function(namelist) {
        for (var i = 0; i < namelist.length; i++) {
            InitAttrib(namelist[i]);
        }
    };
    var SetAttrib = function(name, v) {
        result[name].def = false;
        result[name].val = v || "";
    };
    var SetAttribStar = function(name, v) {
        if (v == "*") return;
        result[name].def = false;
        result[name].val = v;
    };
    var cell = sheet.GetAssuredCell(coord);
    InitAttrib("alignhoriz");
    if (cell.cellformat) {
        SetAttrib("alignhoriz", sheet.cellformats[cell.cellformat]);
    }
    InitAttribs([ "alignvert", "padtop", "padright", "padbottom", "padleft" ]);
    if (cell.layout) {
        parts = sheet.layouts[cell.layout].match(/^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/);
        SetAttribStar("padtop", parts[1]);
        SetAttribStar("padright", parts[2]);
        SetAttribStar("padbottom", parts[3]);
        SetAttribStar("padleft", parts[4]);
        SetAttribStar("alignvert", parts[5]);
    }
    InitAttribs([ "fontfamily", "fontlook", "fontsize" ]);
    if (cell.font) {
        parts = sheet.fonts[cell.font].match(/^(\*|\S+? \S+?) (\S+?) (\S.*)$/);
        SetAttribStar("fontfamily", parts[3]);
        SetAttribStar("fontsize", parts[2]);
        SetAttribStar("fontlook", parts[1]);
    }
    InitAttrib("textcolor");
    if (cell.color) {
        SetAttrib("textcolor", sheet.colors[cell.color]);
    }
    InitAttrib("bgcolor");
    if (cell.bgcolor) {
        SetAttrib("bgcolor", sheet.colors[cell.bgcolor]);
    }
    InitAttribs([ "numberformat", "textformat" ]);
    if (cell.nontextvalueformat) {
        SetAttrib("numberformat", sheet.valueformats[cell.nontextvalueformat]);
    }
    if (cell.textvalueformat) {
        SetAttrib("textformat", sheet.valueformats[cell.textvalueformat]);
    }
    InitAttribs([ "colspan", "rowspan" ]);
    SetAttrib("colspan", cell.colspan || 1);
    SetAttrib("rowspan", cell.rowspan || 1);
    for (i = 0; i < 4; i++) {
        b = "trbl".charAt(i);
        bb = "b" + b;
        InitAttrib(bb);
        SetAttrib(bb, cell[bb] ? sheet.borderstyles[cell[bb]] : "");
        InitAttrib(bb + "thickness");
        InitAttrib(bb + "style");
        InitAttrib(bb + "color");
        if (cell[bb]) {
            parts = sheet.borderstyles[cell[bb]].match(/(\S+)\s+(\S+)\s+(\S.+)/);
            SetAttrib(bb + "thickness", parts[1]);
            SetAttrib(bb + "style", parts[2]);
            SetAttrib(bb + "color", parts[3]);
        }
    }
    InitAttribs([ "cssc", "csss", "mod" ]);
    SetAttrib("cssc", cell.cssc || "");
    SetAttrib("csss", cell.csss || "");
    SetAttrib("mod", cell.mod || "n");
    return result;
};

SocialCalc.EncodeSheetAttributes = function(sheet) {
    var value;
    var attribs = sheet.attribs;
    var result = {};
    var InitAttrib = function(name) {
        result[name] = {
            def: true,
            val: ""
        };
    };
    var InitAttribs = function(namelist) {
        for (var i = 0; i < namelist.length; i++) {
            InitAttrib(namelist[i]);
        }
    };
    var SetAttrib = function(name, v) {
        result[name].def = false;
        result[name].val = v || value;
    };
    var SetAttribStar = function(name, v) {
        if (v == "*") return;
        result[name].def = false;
        result[name].val = v;
    };
    InitAttrib("colwidth");
    if (attribs.defaultcolwidth) {
        SetAttrib("colwidth", attribs.defaultcolwidth);
    }
    InitAttrib("rowheight");
    if (attribs.rowheight) {
        SetAttrib("rowheight", attribs.defaultrowheight);
    }
    InitAttrib("textalignhoriz");
    if (attribs.defaulttextformat) {
        SetAttrib("textalignhoriz", sheet.cellformats[attribs.defaulttextformat]);
    }
    InitAttrib("numberalignhoriz");
    if (attribs.defaultnontextformat) {
        SetAttrib("numberalignhoriz", sheet.cellformats[attribs.defaultnontextformat]);
    }
    InitAttribs([ "alignvert", "padtop", "padright", "padbottom", "padleft" ]);
    if (attribs.defaultlayout) {
        parts = sheet.layouts[attribs.defaultlayout].match(/^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/);
        SetAttribStar("padtop", parts[1]);
        SetAttribStar("padright", parts[2]);
        SetAttribStar("padbottom", parts[3]);
        SetAttribStar("padleft", parts[4]);
        SetAttribStar("alignvert", parts[5]);
    }
    InitAttribs([ "fontfamily", "fontlook", "fontsize" ]);
    if (attribs.defaultfont) {
        parts = sheet.fonts[attribs.defaultfont].match(/^(\*|\S+? \S+?) (\S+?) (\S.*)$/);
        SetAttribStar("fontfamily", parts[3]);
        SetAttribStar("fontsize", parts[2]);
        SetAttribStar("fontlook", parts[1]);
    }
    InitAttrib("textcolor");
    if (attribs.defaultcolor) {
        SetAttrib("textcolor", sheet.colors[attribs.defaultcolor]);
    }
    InitAttrib("bgcolor");
    if (attribs.defaultbgcolor) {
        SetAttrib("bgcolor", sheet.colors[attribs.defaultbgcolor]);
    }
    InitAttribs([ "numberformat", "textformat" ]);
    if (attribs.defaultnontextvalueformat) {
        SetAttrib("numberformat", sheet.valueformats[attribs.defaultnontextvalueformat]);
    }
    if (attribs.defaulttextvalueformat) {
        SetAttrib("textformat", sheet.valueformats[attribs.defaulttextvalueformat]);
    }
    InitAttrib("recalc");
    if (attribs.recalc) {
        SetAttrib("recalc", attribs.recalc);
    }
    InitAttrib("usermaxcol");
    if (attribs.usermaxcol) {
        SetAttrib("usermaxcol", attribs.usermaxcol);
    }
    InitAttrib("usermaxrow");
    if (attribs.usermaxrow) {
        SetAttrib("usermaxrow", attribs.usermaxrow);
    }
    return result;
};

SocialCalc.DecodeCellAttributes = function(sheet, coord, newattribs, range) {
    var value, b, bb;
    var cell = sheet.GetAssuredCell(coord);
    var changed = false;
    var CheckChanges = function(attribname, oldval, cmdname) {
        var val;
        if (newattribs[attribname]) {
            if (newattribs[attribname].def) {
                val = "";
            } else {
                val = newattribs[attribname].val;
            }
            if (val != (oldval || "")) {
                DoCmd(cmdname + " " + val);
            }
        }
    };
    var cmdstr = "";
    var DoCmd = function(str) {
        if (cmdstr) cmdstr += "\n";
        cmdstr += "set " + (range || coord) + " " + str;
        changed = true;
    };
    CheckChanges("alignhoriz", sheet.cellformats[cell.cellformat], "cellformat");
    if (!newattribs.alignvert.def || !newattribs.padtop.def || !newattribs.padright.def || !newattribs.padbottom.def || !newattribs.padleft.def) {
        value = "padding:" + (newattribs.padtop.def ? "* " : newattribs.padtop.val + " ") + (newattribs.padright.def ? "* " : newattribs.padright.val + " ") + (newattribs.padbottom.def ? "* " : newattribs.padbottom.val + " ") + (newattribs.padleft.def ? "*" : newattribs.padleft.val) + ";vertical-align:" + (newattribs.alignvert.def ? "*;" : newattribs.alignvert.val + ";");
    } else {
        value = "";
    }
    if (value != (sheet.layouts[cell.layout] || "")) {
        DoCmd("layout " + value);
    }
    if (!newattribs.fontlook.def || !newattribs.fontsize.def || !newattribs.fontfamily.def) {
        value = (newattribs.fontlook.def ? "* " : newattribs.fontlook.val + " ") + (newattribs.fontsize.def ? "* " : newattribs.fontsize.val + " ") + (newattribs.fontfamily.def ? "*" : newattribs.fontfamily.val);
    } else {
        value = "";
    }
    if (value != (sheet.fonts[cell.font] || "")) {
        DoCmd("font " + value);
    }
    CheckChanges("textcolor", sheet.colors[cell.color], "color");
    CheckChanges("bgcolor", sheet.colors[cell.bgcolor], "bgcolor");
    CheckChanges("numberformat", sheet.valueformats[cell.nontextvalueformat], "nontextvalueformat");
    CheckChanges("textformat", sheet.valueformats[cell.textvalueformat], "textvalueformat");
    for (i = 0; i < 4; i++) {
        b = "trbl".charAt(i);
        bb = "b" + b;
        CheckChanges(bb, sheet.borderstyles[cell[bb]], bb);
    }
    CheckChanges("cssc", cell.cssc, "cssc");
    CheckChanges("csss", cell.csss, "csss");
    if (newattribs.mod) {
        if (newattribs.mod.def) {
            value = "n";
        } else {
            value = newattribs.mod.val;
        }
        if (value != (cell.mod || "n")) {
            if (value == "n") value = "";
            DoCmd("mod " + value);
        }
    }
    if (changed) {
        return cmdstr;
    } else {
        return null;
    }
};

SocialCalc.DecodeSheetAttributes = function(sheet, newattribs) {
    var value;
    var attribs = sheet.attribs;
    var changed = false;
    var CheckChanges = function(attribname, oldval, cmdname) {
        var val;
        if (newattribs[attribname]) {
            if (newattribs[attribname].def) {
                val = "";
            } else {
                val = newattribs[attribname].val;
            }
            if (val != (oldval || "")) {
                DoCmd(cmdname + " " + val);
            }
        }
    };
    var cmdstr = "";
    var DoCmd = function(str) {
        if (cmdstr) cmdstr += "\n";
        cmdstr += "set sheet " + str;
        changed = true;
    };
    CheckChanges("colwidth", attribs.defaultcolwidth, "defaultcolwidth");
    CheckChanges("rowheight", attribs.defaultrowheight, "defaultrowheight");
    CheckChanges("textalignhoriz", sheet.cellformats[attribs.defaulttextformat], "defaulttextformat");
    CheckChanges("numberalignhoriz", sheet.cellformats[attribs.defaultnontextformat], "defaultnontextformat");
    if (!newattribs.alignvert.def || !newattribs.padtop.def || !newattribs.padright.def || !newattribs.padbottom.def || !newattribs.padleft.def) {
        value = "padding:" + (newattribs.padtop.def ? "* " : newattribs.padtop.val + " ") + (newattribs.padright.def ? "* " : newattribs.padright.val + " ") + (newattribs.padbottom.def ? "* " : newattribs.padbottom.val + " ") + (newattribs.padleft.def ? "*" : newattribs.padleft.val) + ";vertical-align:" + (newattribs.alignvert.def ? "*;" : newattribs.alignvert.val + ";");
    } else {
        value = "";
    }
    if (value != (sheet.layouts[attribs.defaultlayout] || "")) {
        DoCmd("defaultlayout " + value);
    }
    if (!newattribs.fontlook.def || !newattribs.fontsize.def || !newattribs.fontfamily.def) {
        value = (newattribs.fontlook.def ? "* " : newattribs.fontlook.val + " ") + (newattribs.fontsize.def ? "* " : newattribs.fontsize.val + " ") + (newattribs.fontfamily.def ? "*" : newattribs.fontfamily.val);
    } else {
        value = "";
    }
    if (value != (sheet.fonts[attribs.defaultfont] || "")) {
        DoCmd("defaultfont " + value);
    }
    CheckChanges("textcolor", sheet.colors[attribs.defaultcolor], "defaultcolor");
    CheckChanges("bgcolor", sheet.colors[attribs.defaultbgcolor], "defaultbgcolor");
    CheckChanges("numberformat", sheet.valueformats[attribs.defaultnontextvalueformat], "defaultnontextvalueformat");
    CheckChanges("textformat", sheet.valueformats[attribs.defaulttextvalueformat], "defaulttextvalueformat");
    CheckChanges("recalc", sheet.attribs.recalc, "recalc");
    CheckChanges("usermaxcol", sheet.attribs.usermaxcol, "usermaxcol");
    CheckChanges("usermaxrow", sheet.attribs.usermaxrow, "usermaxrow");
    if (changed) {
        return cmdstr;
    } else {
        return null;
    }
};

SocialCalc.SheetCommandInfo = function(sheetobj) {
    this.sheetobj = sheetobj;
    this.timerobj = null;
    this.firsttimerdelay = 50;
    this.timerdelay = 1;
    this.maxtimeslice = 100;
    this.saveundo = false;
    this.CmdExtensionCallbacks = {};
};

SocialCalc.ScheduleSheetCommands = function(sheet, cmdstr, saveundo) {
    var sci = sheet.sci;
    var parseobj = new SocialCalc.Parse(cmdstr);
    if (sci.sheetobj.statuscallback) {
        sheet.statuscallback(sci, "cmdstart", "", sci.sheetobj.statuscallbackparams);
    }
    if (saveundo) {
        sci.sheetobj.changes.PushChange("");
    }
    sci.timerobj = window.setTimeout(function() {
        SocialCalc.SheetCommandsTimerRoutine(sci, parseobj, saveundo);
    }, sci.firsttimerdelay);
};

SocialCalc.SheetCommandsTimerRoutine = function(sci, parseobj, saveundo) {
    var errortext;
    var starttime = new Date();
    sci.timerobj = null;
    while (!parseobj.EOF()) {
        errortext = SocialCalc.ExecuteSheetCommand(sci.sheetobj, parseobj, saveundo);
        if (errortext) alert(errortext);
        parseobj.NextLine();
        if (new Date() - starttime >= sci.maxtimeslice) {
            sci.timerobj = window.setTimeout(function() {
                SocialCalc.SheetCommandsTimerRoutine(sci, parseobj, saveundo);
            }, sci.timerdelay);
            return;
        }
    }
    if (sci.sheetobj.statuscallback) {
        sci.sheetobj.statuscallback(sci, "cmdend", "", sci.sheetobj.statuscallbackparams);
    }
};

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
    var col, row, editor, undoNum, trackLine;
    var attribs = sheet.attribs;
    var changes = sheet.changes;
    var cellProperties = SocialCalc.CellProperties;
    var scc = SocialCalc.Constants;
    var ParseRange = function() {
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
        undostart = "set " + what + " " + attrib;
        if (what == "sheet") {
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
                if (rest == "* * *") rest = "";
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
                for (cr in sheet.cells) {
                    delete sheet.cells[cr].displaystring;
                }
                break;

              case "lastcol":
              case "lastrow":
                if (saveundo) changes.AddUndo(undostart, attribs[attrib] - 0);
                num = rest - 0;
                if (typeof num == "number") attribs[attrib] = num > 0 ? num : 1;
                break;

              case "recalc":
                if (saveundo) changes.AddUndo(undostart, attribs[attrib]);
                if (rest == "off") {
                    attribs.recalc = rest;
                } else {
                    delete attribs.recalc;
                }
                break;

              case "usermaxcol":
              case "usermaxrow":
                if (saveundo) changes.AddUndo(undostart, attribs[attrib] - 0);
                num = rest - 0;
                if (typeof num == "number") attribs[attrib] = num > 0 ? num : 0;
                break;

              default:
                errortext = scc.s_escUnknownSheetCmd + cmdstr;
                break;
            }
        } else if (/^[a-z]{1,2}(:[a-z]{1,2})?$/i.test(what)) {
            sheet.renderneeded = true;
            what = what.toUpperCase();
            pos = what.indexOf(":");
            if (pos >= 0) {
                cr1 = SocialCalc.coordToCr(what.substring(0, pos) + "1");
                cr2 = SocialCalc.coordToCr(what.substring(pos + 1) + "1");
            } else {
                cr1 = SocialCalc.coordToCr(what + "1");
                cr2 = cr1;
            }
            for (col = cr1.col; col <= cr2.col; col++) {
                if (attrib == "width") {
                    cr = SocialCalc.rcColname(col);
                    if (saveundo) changes.AddUndo("set " + cr + " width", sheet.colattribs.width[cr]);
                    if (rest.length > 0) {
                        sheet.colattribs.width[cr] = rest;
                    } else {
                        delete sheet.colattribs.width[cr];
                    }
                } else if (attrib == "hide") {
                    sheet.hiddencolrow = "col";
                    cr = SocialCalc.rcColname(col);
                    if (saveundo) changes.AddUndo("set " + cr + " hide", sheet.colattribs.hide[cr]);
                    if (rest.length > 0) {
                        sheet.colattribs.hide[cr] = rest;
                    } else {
                        delete sheet.colattribs.hide[cr];
                    }
                }
            }
        } else if (/^\d+(:\d+)?$/i.test(what)) {
            sheet.renderneeded = true;
            what = what.toUpperCase();
            pos = what.indexOf(":");
            if (pos >= 0) {
                cr1 = SocialCalc.coordToCr("A" + what.substring(0, pos));
                cr2 = SocialCalc.coordToCr("A" + what.substring(pos + 1));
            } else {
                cr1 = SocialCalc.coordToCr("A" + what);
                cr2 = cr1;
            }
            for (row = cr1.row; row <= cr2.row; row++) {
                if (attrib == "height") {
                    if (saveundo) changes.AddUndo("set " + row + " height", sheet.rowattribs.height[row]);
                    if (rest.length > 0) {
                        sheet.rowattribs.height[row] = rest;
                    } else {
                        delete sheet.rowattribs.height[row];
                    }
                } else if (attrib == "hide") {
                    sheet.hiddencolrow = "row";
                    if (saveundo) changes.AddUndo("set " + row + " hide", sheet.rowattribs.hide[row]);
                    if (rest.length > 0) {
                        sheet.rowattribs.hide[row] = rest;
                    } else {
                        delete sheet.rowattribs.hide[row];
                    }
                }
            }
        } else if (/^[a-z]{1,2}\d+(:[a-z]{1,2}\d+)?$/i.test(what)) {
            ParseRange();
            if (cr1.row != cr2.row || cr1.col != cr2.col || sheet.celldisplayneeded || sheet.renderneeded) {
                sheet.renderneeded = true;
                sheet.celldisplayneeded = "";
            } else {
                sheet.celldisplayneeded = SocialCalc.crToCoord(cr1.col, cr1.row);
            }
            for (row = cr1.row; row <= cr2.row; row++) {
                for (col = cr1.col; col <= cr2.col; col++) {
                    cr = SocialCalc.crToCoord(col, row);
                    cell = sheet.GetAssuredCell(cr);
                    if (cell.readonly && attrib != "readonly") continue;
                    if (saveundo) changes.AddUndo("set " + cr + " all", sheet.CellToString(cell));
                    if (attrib == "value") {
                        pos = rest.indexOf(" ");
                        cell.datavalue = rest.substring(pos + 1) - 0;
                        delete cell.errors;
                        cell.datatype = "v";
                        cell.valuetype = rest.substring(0, pos);
                        delete cell.displaystring;
                        delete cell.parseinfo;
                        attribs.needsrecalc = "yes";
                    } else if (attrib == "text") {
                        pos = rest.indexOf(" ");
                        cell.datavalue = SocialCalc.decodeFromSave(rest.substring(pos + 1));
                        delete cell.errors;
                        cell.datatype = "t";
                        cell.valuetype = rest.substring(0, pos);
                        delete cell.displaystring;
                        delete cell.parseinfo;
                        attribs.needsrecalc = "yes";
                    } else if (attrib == "formula") {
                        cell.datavalue = 0;
                        delete cell.errors;
                        cell.datatype = "f";
                        cell.valuetype = "e#N/A";
                        cell.formula = rest;
                        delete cell.displaystring;
                        delete cell.parseinfo;
                        attribs.needsrecalc = "yes";
                    } else if (attrib == "constant") {
                        pos = rest.indexOf(" ");
                        pos2 = rest.substring(pos + 1).indexOf(" ");
                        cell.datavalue = rest.substring(pos + 1, pos + 1 + pos2) - 0;
                        cell.valuetype = rest.substring(0, pos);
                        if (cell.valuetype.charAt(0) == "e") {
                            cell.errors = cell.valuetype.substring(1);
                        } else {
                            delete cell.errors;
                        }
                        cell.datatype = "c";
                        cell.formula = rest.substring(pos + pos2 + 2);
                        delete cell.displaystring;
                        delete cell.parseinfo;
                        attribs.needsrecalc = "yes";
                    } else if (attrib == "empty") {
                        cell.datavalue = "";
                        delete cell.errors;
                        cell.datatype = null;
                        cell.formula = "";
                        cell.valuetype = "b";
                        delete cell.displaystring;
                        delete cell.parseinfo;
                        attribs.needsrecalc = "yes";
                    } else if (attrib == "all") {
                        if (rest.length > 0) {
                            cell = new SocialCalc.Cell(cr);
                            sheet.CellFromStringParts(cell, rest.split(":"), 1);
                            sheet.cells[cr] = cell;
                        } else {
                            delete sheet.cells[cr];
                        }
                        attribs.needsrecalc = "yes";
                    } else if (/^b[trbl]$/.test(attrib)) {
                        cell[attrib] = sheet.GetStyleNum("borderstyle", rest);
                        sheet.renderneeded = true;
                    } else if (attrib == "color" || attrib == "bgcolor") {
                        cell[attrib] = sheet.GetStyleNum("color", rest);
                    } else if (attrib == "layout" || attrib == "cellformat") {
                        cell[attrib] = sheet.GetStyleNum(attrib, rest);
                    } else if (attrib == "font") {
                        if (rest == "* * *") rest = "";
                        cell[attrib] = sheet.GetStyleNum("font", rest);
                    } else if (attrib == "textvalueformat" || attrib == "nontextvalueformat") {
                        cell[attrib] = sheet.GetStyleNum("valueformat", rest);
                        delete cell.displaystring;
                    } else if (attrib == "cssc") {
                        rest = rest.replace(/[^a-zA-Z0-9\-]/g, "");
                        cell.cssc = rest;
                    } else if (attrib == "csss") {
                        rest = rest.replace(/\n/g, "");
                        cell.csss = rest;
                    } else if (attrib == "mod") {
                        rest = rest.replace(/[^yY]/g, "").toLowerCase();
                        cell.mod = rest;
                    } else if (attrib == "comment") {
                        cell.comment = SocialCalc.decodeFromSave(rest);
                    } else if (attrib == "readonly") {
                        cell.readonly = rest.toLowerCase() == "yes";
                    } else {
                        errortext = scc.s_escUnknownSetCoordCmd + cmdstr;
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
        cell = sheet.GetAssuredCell(cr1.coord);
        if (cell.readonly) break;
        if (saveundo) changes.AddUndo("unmerge " + cr1.coord);
        if (cr2.col > cr1.col) cell.colspan = cr2.col - cr1.col + 1; else delete cell.colspan;
        if (cr2.row > cr1.row) cell.rowspan = cr2.row - cr1.row + 1; else delete cell.rowspan;
        sheet.changedrendervalues = true;
        break;

      case "unmerge":
        sheet.renderneeded = true;
        what = cmd.NextToken();
        rest = cmd.RestOfString();
        ParseRange();
        cell = sheet.GetAssuredCell(cr1.coord);
        if (cell.readonly) break;
        if (saveundo) changes.AddUndo("merge " + cr1.coord + ":" + SocialCalc.crToCoord(cr1.col + (cell.colspan || 1) - 1, cr1.row + (cell.rowspan || 1) - 1));
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
        if (saveundo) changes.AddUndo("changedrendervalues");
        if (cmd1 == "cut") {
            if (saveundo) changes.AddUndo("loadclipboard", SocialCalc.encodeForSave(SocialCalc.Clipboard.clipboard));
            SocialCalc.Clipboard.clipboard = SocialCalc.CreateSheetSave(sheet, what);
        }
        for (row = cr1.row; row <= cr2.row; row++) {
            for (col = cr1.col; col <= cr2.col; col++) {
                cr = SocialCalc.crToCoord(col, row);
                cell = sheet.GetAssuredCell(cr);
                if (cell.readonly) continue;
                if (saveundo) changes.AddUndo("set " + cr + " all", sheet.CellToString(cell));
                if (rest == "all") {
                    delete sheet.cells[cr];
                } else if (rest == "formulas") {
                    cell.datavalue = "";
                    cell.datatype = null;
                    cell.formula = "";
                    cell.valuetype = "b";
                    delete cell.errors;
                    delete cell.displaystring;
                    delete cell.parseinfo;
                    if (cell.comment) {
                        delete cell.comment;
                    }
                } else if (rest == "formats") {
                    newcell = new SocialCalc.Cell(cr);
                    newcell.datavalue = cell.datavalue;
                    newcell.datatype = cell.datatype;
                    newcell.formula = cell.formula;
                    newcell.valuetype = cell.valuetype;
                    if (cell.comment) {
                        newcell.comment = cell.comment;
                    }
                    sheet.cells[cr] = newcell;
                }
            }
        }
        attribs.needsrecalc = "yes";
        break;

      case "fillright":
      case "filldown":
        sheet.renderneeded = true;
        sheet.changedrendervalues = true;
        if (saveundo) changes.AddUndo("changedrendervalues");
        what = cmd.NextToken();
        rest = cmd.RestOfString();
        ParseRange();
        function increment_amount(down) {
            function valid_datatype(type) {
                return type == "v" || type == "c";
            }
            var editor = SocialCalc.GetSpreadsheetControlObject().editor;
            var range = editor.range2;
            var returnval = undefined;
            if (range.hasrange) {
                var startcell, endcell;
                if (down && range.bottom - range.top == 1 && range.left == range.right) {
                    startcell = sheet.GetAssuredCell(SocialCalc.crToCoord(range.left, range.top));
                    endcell = sheet.GetAssuredCell(SocialCalc.crToCoord(range.left, range.bottom));
                    if (valid_datatype(startcell.datatype) && valid_datatype(endcell.datatype)) {
                        returnval = endcell.datavalue - startcell.datavalue;
                    }
                } else if (!down && range.left != range.right) {
                    startcell = sheet.GetAssuredCell(SocialCalc.crToCoord(range.left, range.top));
                    endcell = sheet.GetAssuredCell(SocialCalc.crToCoord(range.right, range.top));
                    if (valid_datatype(startcell.datatype) && valid_datatype(endcell.datatype)) {
                        returnval = endcell.datavalue - startcell.datavalue;
                    }
                }
            }
            editor.Range2Remove();
            return returnval;
        }
        var inc;
        if (cmd1 == "fillright") {
            fillright = true;
            rowstart = cr1.row;
            colstart = cr1.col + 1;
            inc = increment_amount(false);
        } else {
            fillright = false;
            rowstart = cr1.row + 1;
            colstart = cr1.col;
            inc = increment_amount(true);
        }
        for (row = rowstart; row <= cr2.row; row++) {
            for (col = colstart; col <= cr2.col; col++) {
                cr = SocialCalc.crToCoord(col, row);
                cell = sheet.GetAssuredCell(cr);
                if (cell.readonly) continue;
                if (saveundo) changes.AddUndo("set " + cr + " all", sheet.CellToString(cell));
                if (fillright) {
                    crbase = SocialCalc.crToCoord(cr1.col, row);
                    coloffset = col - colstart + 1;
                    rowoffset = 0;
                } else {
                    crbase = SocialCalc.crToCoord(col, cr1.row);
                    coloffset = 0;
                    rowoffset = row - rowstart + 1;
                }
                basecell = sheet.GetAssuredCell(crbase);
                if (rest == "all" || rest == "formats") {
                    for (attrib in cellProperties) {
                        if (cellProperties[attrib] == 1) continue;
                        if (typeof basecell[attrib] === undefined || cellProperties[attrib] == 3) {
                            delete cell[attrib];
                        } else {
                            cell[attrib] = basecell[attrib];
                        }
                    }
                }
                if (rest == "all" || rest == "formulas") {
                    if (inc !== undefined) {
                        cell.datavalue = basecell.datavalue + (fillright ? coloffset : rowoffset) * inc;
                    } else {
                        cell.datavalue = basecell.datavalue;
                    }
                    cell.datatype = basecell.datatype;
                    cell.valuetype = basecell.valuetype;
                    if (cell.datatype == "f") {
                        cell.formula = SocialCalc.OffsetFormulaCoords(basecell.formula, coloffset, rowoffset);
                    } else {
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
        if (saveundo) changes.AddUndo("changedrendervalues");
        what = cmd.NextToken();
        rest = cmd.RestOfString();
        ParseRange();
        if (!SocialCalc.Clipboard.clipboard) {
            break;
        }
        clipsheet = new SocialCalc.Sheet();
        clipsheet.ParseSheetSave(SocialCalc.Clipboard.clipboard);
        cliprange = SocialCalc.ParseRange(clipsheet.copiedfrom);
        coloffset = cr1.col - cliprange.cr1.col;
        rowoffset = cr1.row - cliprange.cr1.row;
        numcols = Math.max(cr2.col - cr1.col + 1, cliprange.cr2.col - cliprange.cr1.col + 1);
        numrows = Math.max(cr2.row - cr1.row + 1, cliprange.cr2.row - cliprange.cr1.row + 1);
        if (cr1.col + numcols - 1 > attribs.lastcol) attribs.lastcol = cr1.col + numcols - 1;
        if (cr1.row + numrows - 1 > attribs.lastrow) attribs.lastrow = cr1.row + numrows - 1;
        for (row = cr1.row; row < cr1.row + numrows; row++) {
            for (col = cr1.col; col < cr1.col + numcols; col++) {
                cr = SocialCalc.crToCoord(col, row);
                cell = sheet.GetAssuredCell(cr);
                if (cell.readonly) continue;
                if (saveundo) changes.AddUndo("set " + cr + " all", sheet.CellToString(cell));
                crbase = SocialCalc.crToCoord(cliprange.cr1.col + (col - cr1.col) % (cliprange.cr2.col - cliprange.cr1.col + 1), cliprange.cr1.row + (row - cr1.row) % (cliprange.cr2.row - cliprange.cr1.row + 1));
                basecell = clipsheet.GetAssuredCell(crbase);
                if (rest == "all" || rest == "formats") {
                    for (attrib in cellProperties) {
                        if (cellProperties[attrib] == 1) continue;
                        if (typeof basecell[attrib] === undefined || cellProperties[attrib] == 3) {
                            delete cell[attrib];
                        } else {
                            attribtable = SocialCalc.CellPropertiesTable[attrib];
                            if (attribtable && basecell[attrib]) {
                                cell[attrib] = sheet.GetStyleNum(attribtable, clipsheet.GetStyleString(attribtable, basecell[attrib]));
                            } else {
                                cell[attrib] = basecell[attrib];
                            }
                        }
                    }
                }
                if (rest == "all" || rest == "formulas") {
                    cell.datavalue = basecell.datavalue;
                    cell.datatype = basecell.datatype;
                    cell.valuetype = basecell.valuetype;
                    if (cell.datatype == "f") {
                        cell.formula = SocialCalc.OffsetFormulaCoords(basecell.formula, coloffset, rowoffset);
                    } else {
                        cell.formula = basecell.formula;
                    }
                    delete cell.parseinfo;
                    cell.errors = basecell.errors;
                    if (basecell.comment) {
                        cell.comment = basecell.comment;
                    } else if (cell.comment) {
                        delete cell.comment;
                    }
                }
                delete cell.displaystring;
            }
        }
        attribs.needsrecalc = "yes";
        break;

      case "sort":
        sheet.renderneeded = true;
        sheet.changedrendervalues = true;
        if (saveundo) changes.AddUndo("changedrendervalues");
        what = cmd.NextToken();
        ParseRange();
        cols = [];
        dirs = [];
        lastsortcol = 0;
        for (i = 0; i <= 3; i++) {
            cols[i] = cmd.NextToken();
            dirs[i] = cmd.NextToken();
            if (cols[i]) lastsortcol = i;
        }
        sortcells = {};
        sortlist = [];
        sortvalues = [];
        sorttypes = [];
        for (row = cr1.row; row <= cr2.row; row++) {
            for (col = cr1.col; col <= cr2.col; col++) {
                cr = SocialCalc.crToCoord(col, row);
                cell = sheet.cells[cr];
                if (cell) {
                    sortcells[cr] = sheet.CellToString(cell);
                    if (saveundo) changes.AddUndo("set " + cr + " all", sortcells[cr]);
                } else {
                    if (saveundo) changes.AddUndo("set " + cr + " all");
                }
            }
            sortlist.push(sortlist.length);
            sortvalues.push([]);
            sorttypes.push([]);
            slast = sorttypes.length - 1;
            for (i = 0; i <= lastsortcol; i++) {
                cr = cols[i] + row;
                cell = sheet.GetAssuredCell(cr);
                val = cell.datavalue;
                valtype = cell.valuetype.charAt(0) || "b";
                if (valtype == "t") val = val.toLowerCase();
                sortvalues[slast].push(val);
                sorttypes[slast].push(valtype);
            }
        }
        sortfunction = function(a, b) {
            var i, a1, b1, ta, cresult;
            for (i = 0; i <= lastsortcol; i++) {
                if (dirs[i] == "up") {
                    a1 = a;
                    b1 = b;
                } else {
                    a1 = b;
                    b1 = a;
                }
                ta = sorttypes[a1][i];
                tb = sorttypes[b1][i];
                if (ta == "t") {
                    if (tb == "t") {
                        a1 = sortvalues[a1][i];
                        b1 = sortvalues[b1][i];
                        cresult = a1 > b1 ? 1 : a1 < b1 ? -1 : 0;
                    } else if (tb == "n") {
                        cresult = 1;
                    } else if (tb == "b") {
                        cresult = dirs[i] == "up" ? -1 : 1;
                    } else if (tb == "e") {
                        cresult = -1;
                    }
                } else if (ta == "n") {
                    if (tb == "t") {
                        cresult = -1;
                    } else if (tb == "n") {
                        a1 = sortvalues[a1][i] - 0;
                        b1 = sortvalues[b1][i] - 0;
                        cresult = a1 > b1 ? 1 : a1 < b1 ? -1 : 0;
                    } else if (tb == "b") {
                        cresult = dirs[i] == "up" ? -1 : 1;
                    } else if (tb == "e") {
                        cresult = -1;
                    }
                } else if (ta == "e") {
                    if (tb == "e") {
                        a1 = sortvalues[a1][i];
                        b1 = sortvalues[b1][i];
                        cresult = a1 > b1 ? 1 : a1 < b1 ? -1 : 0;
                    } else if (tb == "b") {
                        cresult = dirs[i] == "up" ? -1 : 1;
                    } else {
                        cresult = 1;
                    }
                } else if (ta == "b") {
                    if (tb == "b") {
                        cresult = 0;
                    } else {
                        cresult = dirs[i] == "up" ? 1 : -1;
                    }
                }
                if (cresult) {
                    return cresult;
                }
            }
            cresult = a > b ? 1 : a < b ? -1 : 0;
            return cresult;
        };
        sortlist.sort(sortfunction);
        for (row = cr1.row; row <= cr2.row; row++) {
            originalrow = sortlist[row - cr1.row];
            for (col = cr1.col; col <= cr2.col; col++) {
                cr = SocialCalc.crToCoord(col, row);
                sortedcr = SocialCalc.crToCoord(col, originalrow + cr1.row);
                if (sortcells[sortedcr]) {
                    cell = new SocialCalc.Cell(cr);
                    sheet.CellFromStringParts(cell, sortcells[sortedcr].split(":"), 1);
                    if (cell.datatype == "f") {
                        cell.formula = SocialCalc.OffsetFormulaCoords(cell.formula, 0, row - cr1.row - originalrow);
                    }
                    sheet.cells[cr] = cell;
                } else {
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
            if (saveundo) changes.AddUndo("deletecol " + cr1.coord);
        } else {
            coloffset = 0;
            colend = 1;
            rowoffset = 1;
            rowend = cr1.row;
            newcolstart = 1;
            newcolend = attribs.lastcol;
            newrowstart = cr1.row;
            newrowend = cr1.row;
            if (saveundo) changes.AddUndo("deleterow " + cr1.coord);
        }
        for (row = attribs.lastrow; row >= rowend; row--) {
            for (col = attribs.lastcol; col >= colend; col--) {
                crbase = SocialCalc.crToCoord(col, row);
                cr = SocialCalc.crToCoord(col + coloffset, row + rowoffset);
                if (!sheet.cells[crbase]) {
                    delete sheet.cells[cr];
                } else {
                    sheet.cells[cr] = sheet.cells[crbase];
                }
            }
        }
        for (row = newrowstart; row <= newrowend; row++) {
            for (col = newcolstart; col <= newcolend; col++) {
                cr = SocialCalc.crToCoord(col, row);
                cell = new SocialCalc.Cell(cr);
                sheet.cells[cr] = cell;
                crbase = SocialCalc.crToCoord(col - coloffset, row - rowoffset);
                basecell = sheet.GetAssuredCell(crbase);
                for (attrib in cellProperties) {
                    if (cellProperties[attrib] == 2) {
                        cell[attrib] = basecell[attrib];
                    }
                }
            }
        }
        for (cr in sheet.cells) {
            cell = sheet.cells[cr];
            if (cell && cell.datatype == "f") {
                cell.formula = SocialCalc.AdjustFormulaCoords(cell.formula, cr1.col, coloffset, cr1.row, rowoffset);
            }
            if (cell) {
                delete cell.parseinfo;
            }
        }
        for (name in sheet.names) {
            if (sheet.names[name]) {
                v1 = sheet.names[name].definition;
                v2 = "";
                if (v1.charAt(0) == "=") {
                    v2 = "=";
                    v1 = v1.substring(1);
                }
                sheet.names[name].definition = v2 + SocialCalc.AdjustFormulaCoords(v1, cr1.col, coloffset, cr1.row, rowoffset);
            }
        }
        for (row = attribs.lastrow; row >= rowend && cmd1 == "insertrow"; row--) {
            rownext = row + rowoffset;
            for (attrib in sheet.rowattribs) {
                val = sheet.rowattribs[attrib][row];
                if (sheet.rowattribs[attrib][rownext] != val) {
                    if (val) {
                        sheet.rowattribs[attrib][rownext] = val;
                    } else {
                        delete sheet.rowattribs[attrib][rownext];
                    }
                }
            }
        }
        for (col = attribs.lastcol; col >= colend && cmd1 == "insertcol"; col--) {
            colthis = SocialCalc.rcColname(col);
            colnext = SocialCalc.rcColname(col + coloffset);
            for (attrib in sheet.colattribs) {
                val = sheet.colattribs[attrib][colthis];
                if (sheet.colattribs[attrib][colnext] != val) {
                    if (val) {
                        sheet.colattribs[attrib][colnext] = val;
                    } else {
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
        lastcol = attribs.lastcol;
        lastrow = attribs.lastrow;
        ParseRange();
        if (cmd1 == "deletecol") {
            coloffset = cr1.col - cr2.col - 1;
            rowoffset = 0;
            colstart = cr2.col + 1;
            rowstart = 1;
        } else {
            coloffset = 0;
            rowoffset = cr1.row - cr2.row - 1;
            colstart = 1;
            rowstart = cr2.row + 1;
        }
        for (row = rowstart; row <= lastrow - rowoffset; row++) {
            for (col = colstart; col <= lastcol - coloffset; col++) {
                cr = SocialCalc.crToCoord(col + coloffset, row + rowoffset);
                cell = sheet.cells[cr];
                if (cell && cell.readonly) {
                    errortext = "Unable to remove " + (cmd1 == "deletecol" ? "column" : "row") + ", because cell " + cell.coord + " is locked";
                    return errortext;
                }
            }
        }
        for (row = rowstart; row <= lastrow - rowoffset; row++) {
            for (col = colstart; col <= lastcol - coloffset; col++) {
                cr = SocialCalc.crToCoord(col + coloffset, row + rowoffset);
                if (saveundo && (row < rowstart - rowoffset || col < colstart - coloffset)) {
                    cell = sheet.cells[cr];
                    if (!cell) {
                        changes.AddUndo("erase " + cr + " all");
                    } else {
                        changes.AddUndo("set " + cr + " all", sheet.CellToString(cell));
                    }
                }
                crbase = SocialCalc.crToCoord(col, row);
                cell = sheet.cells[crbase];
                if (!cell) {
                    delete sheet.cells[cr];
                } else {
                    sheet.cells[cr] = cell;
                }
            }
        }
        for (cr in sheet.cells) {
            cell = sheet.cells[cr];
            if (cell) {
                if (cell.datatype == "f") {
                    oldformula = cell.formula;
                    cell.formula = SocialCalc.AdjustFormulaCoords(oldformula, cr1.col, coloffset, cr1.row, rowoffset);
                    if (cell.formula != oldformula) {
                        delete cell.parseinfo;
                        if (saveundo && cell.formula.indexOf("#REF!") != -1) {
                            oldcr = SocialCalc.coordToCr(cr);
                            changes.AddUndo("set " + SocialCalc.rcColname(oldcr.col - coloffset) + (oldcr.row - rowoffset) + " formula " + oldformula);
                        }
                    }
                } else {
                    delete cell.parseinfo;
                }
            }
        }
        for (name in sheet.names) {
            if (sheet.names[name]) {
                v1 = sheet.names[name].definition;
                v2 = "";
                if (v1.charAt(0) == "=") {
                    v2 = "=";
                    v1 = v1.substring(1);
                }
                sheet.names[name].definition = v2 + SocialCalc.AdjustFormulaCoords(v1, cr1.col, coloffset, cr1.row, rowoffset);
            }
        }
        for (row = rowstart; row <= lastrow - rowoffset && cmd1 == "deleterow"; row++) {
            rowbefore = row + rowoffset;
            for (attrib in sheet.rowattribs) {
                val = sheet.rowattribs[attrib][row];
                if (sheet.rowattribs[attrib][rowbefore] != val) {
                    if (saveundo) changes.AddUndo("set " + rowbefore + " " + attrib, sheet.rowattribs[attrib][rowbefore]);
                    if (val) {
                        sheet.rowattribs[attrib][rowbefore] = val;
                    } else {
                        delete sheet.rowattribs[attrib][rowbefore];
                    }
                }
            }
        }
        for (col = colstart; col <= lastcol - coloffset && cmd1 == "deletecol"; col++) {
            colthis = SocialCalc.rcColname(col);
            colbefore = SocialCalc.rcColname(col + coloffset);
            for (attrib in sheet.colattribs) {
                val = sheet.colattribs[attrib][colthis];
                if (sheet.colattribs[attrib][colbefore] != val) {
                    if (saveundo) changes.AddUndo("set " + colbefore + " " + attrib, sheet.colattribs[attrib][colbefore]);
                    if (val) {
                        sheet.colattribs[attrib][colbefore] = val;
                    } else {
                        delete sheet.colattribs[attrib][colbefore];
                    }
                }
            }
        }
        if (saveundo) {
            if (cmd1 == "deletecol") {
                for (col = cr1.col; col <= cr2.col; col++) {
                    changes.AddUndo("insertcol " + SocialCalc.rcColname(col));
                }
            } else {
                for (row = cr1.row; row <= cr2.row; row++) {
                    changes.AddUndo("insertrow " + row);
                }
            }
        }
        if (cmd1 == "deletecol") {
            if (cr1.col <= lastcol) {
                if (cr2.col <= lastcol) {
                    attribs.lastcol += coloffset;
                } else {
                    attribs.lastcol = cr1.col - 1;
                }
            }
        } else {
            if (cr1.row <= lastrow) {
                if (cr2.row <= lastrow) {
                    attribs.lastrow += rowoffset;
                } else {
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
        if (saveundo) changes.AddUndo("changedrendervalues");
        what = cmd.NextToken();
        dest = cmd.NextToken();
        rest = cmd.RestOfString();
        if (rest == "") rest = "all";
        ParseRange();
        destcr = SocialCalc.coordToCr(dest);
        coloffset = destcr.col - cr1.col;
        rowoffset = destcr.row - cr1.row;
        numcols = cr2.col - cr1.col + 1;
        numrows = cr2.row - cr1.row + 1;
        movingcells = {};
        for (row = cr1.row; row <= cr2.row; row++) {
            for (col = cr1.col; col <= cr2.col; col++) {
                cr = SocialCalc.crToCoord(col, row);
                cell = sheet.GetAssuredCell(cr);
                if (cell.readonly) continue;
                if (saveundo) changes.AddUndo("set " + cr + " all", sheet.CellToString(cell));
                if (!sheet.cells[cr]) {
                    continue;
                }
                movingcells[cr] = new SocialCalc.Cell(cr);
                for (attrib in cellProperties) {
                    if (typeof cell[attrib] === undefined) {
                        continue;
                    } else {
                        movingcells[cr][attrib] = cell[attrib];
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
                if (rest == "formulas") {
                    cell.datavalue = "";
                    cell.datatype = null;
                    cell.formula = "";
                    cell.valuetype = "b";
                }
                if (rest == "all") {
                    delete sheet.cells[cr];
                }
            }
        }
        if (cmd1 == "moveinsert") {
            inserthoriz = false;
            insertvert = false;
            if (rowoffset == 0 && (destcr.col < cr1.col || destcr.col > cr2.col)) {
                if (destcr.col < cr1.col) {
                    pushamount = cr1.col - destcr.col;
                    inserthoriz = -1;
                } else {
                    destcr.col -= 1;
                    coloffset = destcr.col - cr2.col;
                    pushamount = destcr.col - cr2.col;
                    inserthoriz = 1;
                }
            } else if (coloffset == 0 && (destcr.row < cr1.row || destcr.row > cr2.row)) {
                if (destcr.row < cr1.row) {
                    pushamount = cr1.row - destcr.row;
                    insertvert = -1;
                } else {
                    destcr.row -= 1;
                    rowoffset = destcr.row - cr2.row;
                    pushamount = destcr.row - cr2.row;
                    insertvert = 1;
                }
            } else {
                cmd1 = "movepaste";
            }
        }
        movedto = {};
        if (insertvert) {
            for (row = 0; row < pushamount; row++) {
                for (col = cr1.col; col <= cr2.col; col++) {
                    if (insertvert < 0) {
                        crbase = SocialCalc.crToCoord(col, destcr.row + pushamount - row - 1);
                        cr = SocialCalc.crToCoord(col, cr2.row - row);
                    } else {
                        crbase = SocialCalc.crToCoord(col, destcr.row - pushamount + row + 1);
                        cr = SocialCalc.crToCoord(col, cr1.row + row);
                    }
                    basecell = sheet.GetAssuredCell(crbase);
                    if (saveundo) changes.AddUndo("set " + crbase + " all", sheet.CellToString(basecell));
                    cell = sheet.GetAssuredCell(cr);
                    if (rest == "all" || rest == "formats") {
                        for (attrib in cellProperties) {
                            if (cellProperties[attrib] == 1) continue;
                            if (typeof basecell[attrib] === undefined || cellProperties[attrib] == 3) {
                                delete cell[attrib];
                            } else {
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
                    movedto[crbase] = cr;
                }
            }
        }
        if (inserthoriz) {
            for (col = 0; col < pushamount; col++) {
                for (row = cr1.row; row <= cr2.row; row++) {
                    if (inserthoriz < 0) {
                        crbase = SocialCalc.crToCoord(destcr.col + pushamount - col - 1, row);
                        cr = SocialCalc.crToCoord(cr2.col - col, row);
                    } else {
                        crbase = SocialCalc.crToCoord(destcr.col - pushamount + col + 1, row);
                        cr = SocialCalc.crToCoord(cr1.col + col, row);
                    }
                    basecell = sheet.GetAssuredCell(crbase);
                    if (saveundo) changes.AddUndo("set " + crbase + " all", sheet.CellToString(basecell));
                    cell = sheet.GetAssuredCell(cr);
                    if (rest == "all" || rest == "formats") {
                        for (attrib in cellProperties) {
                            if (cellProperties[attrib] == 1) continue;
                            if (typeof basecell[attrib] === undefined || cellProperties[attrib] == 3) {
                                delete cell[attrib];
                            } else {
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
                    movedto[crbase] = cr;
                }
            }
        }
        if (destcr.col + numcols - 1 > attribs.lastcol) attribs.lastcol = destcr.col + numcols - 1;
        if (destcr.row + numrows - 1 > attribs.lastrow) attribs.lastrow = destcr.row + numrows - 1;
        for (row = cr1.row; row < cr1.row + numrows; row++) {
            for (col = cr1.col; col < cr1.col + numcols; col++) {
                cr = SocialCalc.crToCoord(col + coloffset, row + rowoffset);
                cell = sheet.GetAssuredCell(cr);
                if (cell.readonly) continue;
                if (saveundo) changes.AddUndo("set " + cr + " all", sheet.CellToString(cell));
                crbase = SocialCalc.crToCoord(col, row);
                movedto[crbase] = cr;
                if (rest == "all" && !movingcells[crbase]) {
                    delete sheet.cells[cr];
                    continue;
                }
                basecell = movingcells[crbase];
                if (!basecell) basecell = sheet.GetAssuredCell(crbase);
                if (rest == "all" || rest == "formats") {
                    for (attrib in cellProperties) {
                        if (cellProperties[attrib] == 1) continue;
                        if (typeof basecell[attrib] === undefined || cellProperties[attrib] == 3) {
                            delete cell[attrib];
                        } else {
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
                    if (basecell.comment) {
                        cell.comment = basecell.comment;
                    } else if (cell.comment) {
                        delete cell.comment;
                    }
                }
                delete cell.displaystring;
            }
        }
        for (cr in sheet.cells) {
            cell = sheet.cells[cr];
            if (cell) {
                if (cell.datatype == "f") {
                    oldformula = cell.formula;
                    cell.formula = SocialCalc.ReplaceFormulaCoords(oldformula, movedto);
                    if (cell.formula != oldformula) {
                        delete cell.parseinfo;
                        if (saveundo && !movedto[cr]) {
                            changes.AddUndo("set " + cr + " formula " + oldformula);
                        }
                    }
                } else {
                    delete cell.parseinfo;
                }
            }
        }
        for (name in sheet.names) {
            if (sheet.names[name]) {
                v1 = sheet.names[name].definition;
                oldformula = v1;
                v2 = "";
                if (v1.charAt(0) == "=") {
                    v2 = "=";
                    v1 = v1.substring(1);
                }
                sheet.names[name].definition = v2 + SocialCalc.ReplaceFormulaCoords(v1, movedto);
                if (saveundo && sheet.names[name].definition != oldformula) {
                    changes.AddUndo("name define " + name + " " + oldformula);
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
        if (name == "") break;
        if (what == "define") {
            if (rest == "") break;
            if (sheet.names[name]) {
                if (saveundo) changes.AddUndo("name define " + name + " " + sheet.names[name].definition);
                sheet.names[name].definition = rest;
            } else {
                if (saveundo) changes.AddUndo("name delete " + name);
                sheet.names[name] = {
                    definition: rest,
                    desc: ""
                };
            }
        } else if (what == "desc") {
            if (sheet.names[name]) {
                if (saveundo) changes.AddUndo("name desc " + name + " " + sheet.names[name].desc);
                sheet.names[name].desc = rest;
            }
        } else if (what == "delete") {
            if (saveundo) {
                if (sheet.names[name].desc) changes.AddUndo("name desc " + name + " " + sheet.names[name].desc);
                changes.AddUndo("name define " + name + " " + sheet.names[name].definition);
            }
            delete sheet.names[name];
        }
        attribs.needsrecalc = "yes";
        break;

      case "recalc":
        attribs.needsrecalc = "yes";
        sheet.recalconce = true;
        break;

      case "redisplay":
        sheet.renderneeded = true;
        break;

      case "changedrendervalues":
        sheet.changedrendervalues = true;
        break;

      case "pane":
        name = cmd.NextToken().toUpperCase();
        undoNum = 1;
        editor = SocialCalc.GetSpreadsheetControlObject().editor;
        if (name.toUpperCase() === "ROW") {
            row = parseInt(cmd.NextToken(), 10);
            if (typeof editor.context.rowpanes[1] !== "undefined" && typeof editor.context.rowpanes[1].first === "number") {
                undoNum = editor.context.rowpanes[1].first;
            }
            if (saveundo) changes.AddUndo("pane row " + undoNum);
            while (editor.context.sheetobj.rowattribs.hide[row] == "yes") {
                row++;
            }
            if ((!row || row <= editor.context.rowpanes[0].first) && editor.context.rowpanes.length > 1) {
                editor.context.rowpanes.length = 1;
            } else if (editor.context.rowpanes.length - 1 && !editor.timeout) {
                editor.context.SetRowPaneFirstLast(0, editor.context.rowpanes[0].first, row - 1);
                editor.context.SetRowPaneFirstLast(1, row, row);
            } else {
                editor.context.SetRowPaneFirstLast(0, editor.context.rowpanes[0].first, row - 1);
                editor.context.SetRowPaneFirstLast(1, row, row);
            }
            if (editor.griddiv) {
                trackLine = document.getElementById("trackingline-vertical");
                if (trackLine) {
                    editor.griddiv.removeChild(trackLine);
                    editor.FitToEditTable();
                }
            }
        } else {
            col = parseInt(cmd.NextToken(), 10);
            if (typeof editor.context.colpanes[1] !== "undefined" && typeof editor.context.colpanes[1].first === "number") {
                undoNum = editor.context.colpanes[1].first;
            }
            if (saveundo) changes.AddUndo("pane col " + undoNum);
            while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == "yes") {
                col++;
            }
            if ((!col || col <= editor.context.colpanes[0].first) && editor.context.colpanes.length > 1) {
                editor.context.colpanes.length = 1;
            } else if (editor.context.colpanes.length - 1 && !editor.timeout) {
                editor.context.SetColPaneFirstLast(0, editor.context.colpanes[0].first, col - 1);
                editor.context.SetColPaneFirstLast(1, col, col);
            } else {
                editor.context.SetColPaneFirstLast(0, editor.context.colpanes[0].first, col - 1);
                editor.context.SetColPaneFirstLast(1, col, col);
            }
            if (editor.griddiv) {
                trackLine = document.getElementById("trackingline-horizon");
                if (trackLine) {
                    editor.griddiv.removeChild(trackLine);
                    editor.FitToEditTable();
                }
            }
        }
        sheet.renderneeded = true;
        break;

      case "startcmdextension":
        name = cmd.NextToken();
        cmdextension = sheet.sci.CmdExtensionCallbacks[name];
        if (cmdextension) {
            cmdextension.func(name, cmdextension.data, sheet, cmd, saveundo);
        }
        break;

      default:
        errortext = scc.s_escUnknownCmd + cmdstr;
        break;
    }
    return errortext;
};

SocialCalc.SheetUndo = function(sheet) {
    var i;
    var tos = sheet.changes.TOS();
    var lastone = tos ? tos.undo.length - 1 : -1;
    var cmdstr = "";
    for (i = lastone; i >= 0; i--) {
        if (cmdstr) cmdstr += "\n";
        cmdstr += tos.undo[i];
    }
    sheet.changes.Undo();
    sheet.ScheduleSheetCommands(cmdstr, false);
};

SocialCalc.SheetRedo = function(sheet) {
    var tos, i;
    var didredo = sheet.changes.Redo();
    if (!didredo) {
        sheet.ScheduleSheetCommands("", false);
        return;
    }
    tos = sheet.changes.TOS();
    var cmdstr = "";
    for (i = 0; tos && i < tos.command.length; i++) {
        if (cmdstr) cmdstr += "\n";
        cmdstr += tos.command[i];
    }
    sheet.ScheduleSheetCommands(cmdstr, false);
};

SocialCalc.CreateAuditString = function(sheet) {
    var i, j;
    var result = "";
    var stack = sheet.changes.stack;
    var tos = sheet.changes.tos;
    for (i = 0; i <= tos; i++) {
        for (j = 0; j < stack[i].command.length; j++) {
            result += stack[i].command[j] + "\n";
        }
    }
    return result;
};

SocialCalc.GetStyleNum = function(sheet, atype, style) {
    var num;
    if (style.length == 0) return 0;
    num = sheet[atype + "hash"][style];
    if (!num) {
        if (sheet[atype + "s"].length < 1) sheet[atype + "s"].push("");
        num = sheet[atype + "s"].push(style) - 1;
        sheet[atype + "hash"][style] = num;
        sheet.changedrendervalues = true;
    }
    return num;
};

SocialCalc.GetStyleString = function(sheet, atype, num) {
    if (!num) return null;
    return sheet[atype + "s"][num];
};

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
    for (i = 0; i < parseinfo.length; i++) {
        ttype = parseinfo[i].type;
        ttext = parseinfo[i].text;
        if (ttype == token_coord) {
            newcr = "";
            cr = SocialCalc.coordToCr(ttext);
            if (ttext.charAt(0) != "$") {
                cr.col += coloffset;
            } else {
                newcr += "$";
            }
            newcr += SocialCalc.rcColname(cr.col);
            if (ttext.indexOf("$", 1) == -1) {
                cr.row += rowoffset;
            } else {
                newcr += "$";
            }
            newcr += cr.row;
            if (cr.row < 1 || cr.col < 1) {
                newcr = "#REF!";
            }
            updatedformula += newcr;
        } else if (ttype == token_string) {
            if (ttext.indexOf('"') >= 0) {
                updatedformula += '"' + ttext.replace(/"/, '""') + '"';
            } else updatedformula += '"' + ttext + '"';
        } else if (ttype == token_op) {
            updatedformula += tokenOpExpansion[ttext] || ttext;
        } else {
            updatedformula += ttext;
        }
    }
    return updatedformula;
};

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
    for (i = 0; i < parseinfo.length; i++) {
        ttype = parseinfo[i].type;
        ttext = parseinfo[i].text;
        if (ttype == token_op) {
            if (ttext == "!") {
                sheetref = true;
            } else if (ttext != ":") {
                sheetref = false;
            }
            ttext = tokenOpExpansion[ttext] || ttext;
        }
        if (ttype == token_coord) {
            cr = SocialCalc.coordToCr(ttext);
            if (coloffset < 0 && cr.col >= col && cr.col < col - coloffset || rowoffset < 0 && cr.row >= row && cr.row < row - rowoffset) {
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
            if (ttext.charAt(0) == "$") {
                newcr = "$" + SocialCalc.rcColname(cr.col);
            } else {
                newcr = SocialCalc.rcColname(cr.col);
            }
            if (ttext.indexOf("$", 1) != -1) {
                newcr += "$" + cr.row;
            } else {
                newcr += cr.row;
            }
            if (cr.row < 1 || cr.col < 1) {
                newcr = "#REF!";
            }
            ttext = newcr;
        } else if (ttype == token_string) {
            if (ttext.indexOf('"') >= 0) {
                ttext = '"' + ttext.replace(/"/, '""') + '"';
            } else ttext = '"' + ttext + '"';
        }
        updatedformula += ttext;
    }
    return updatedformula;
};

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
    for (i = 0; i < parseinfo.length; i++) {
        ttype = parseinfo[i].type;
        ttext = parseinfo[i].text;
        if (ttype == token_op) {
            if (ttext == "!") {
                sheetref = true;
            } else if (ttext != ":") {
                sheetref = false;
            }
            ttext = tokenOpExpansion[ttext] || ttext;
        }
        if (ttype == token_coord) {
            cr = SocialCalc.coordToCr(ttext);
            coord = SocialCalc.crToCoord(cr.col, cr.row);
            if (movedto[coord] && !sheetref) {
                cr = SocialCalc.coordToCr(movedto[coord]);
                if (ttext.charAt(0) == "$") {
                    newcr = "$" + SocialCalc.rcColname(cr.col);
                } else {
                    newcr = SocialCalc.rcColname(cr.col);
                }
                if (ttext.indexOf("$", 1) != -1) {
                    newcr += "$" + cr.row;
                } else {
                    newcr += cr.row;
                }
                ttext = newcr;
            }
        } else if (ttype == token_string) {
            if (ttext.indexOf('"') >= 0) {
                ttext = '"' + ttext.replace(/"/, '""') + '"';
            } else ttext = '"' + ttext + '"';
        }
        updatedformula += ttext;
    }
    return updatedformula;
};

SocialCalc.RecalcInfo = {
    sheet: null,
    currentState: 0,
    state: {
        idle: 0,
        start_calc: 1,
        order: 2,
        calc: 3,
        start_wait: 4,
        done_wait: 5
    },
    recalctimer: null,
    maxtimeslice: 100,
    timeslicedelay: 1,
    starttime: 0,
    queue: [],
    LoadSheet: function(sheetname) {
        return false;
    }
};

SocialCalc.RecalcData = function() {
    this.inrecalc = true;
    this.celllist = [];
    this.celllistitem = 0;
    this.calclist = null;
    this.calclistlength = 0;
    this.firstcalc = null;
    this.lastcalc = null;
    this.nextcalc = null;
    this.count = 0;
    this.checkinfo = {};
};

SocialCalc.RecalcCheckInfo = function() {
    this.oldcoord = null;
    this.parsepos = 0;
    this.inrange = false;
    this.inrangestart = false;
    this.cr1 = null;
    this.cr2 = null;
    this.c1 = null;
    this.c2 = null;
    this.r1 = null;
    this.r2 = null;
    this.c = null;
    this.r = null;
};

SocialCalc.RecalcSheet = function(sheet) {
    var coord, err, recalcdata;
    var scri = SocialCalc.RecalcInfo;
    if (scri.currentState != scri.state.idle) {
        scri.queue.push(sheet);
        return;
    }
    delete sheet.attribs.circularreferencecell;
    SocialCalc.Formula.FreshnessInfoReset();
    SocialCalc.RecalcClearTimeout();
    scri.sheet = sheet;
    scri.currentState = scri.state.start_calc;
    scri.starttime = new Date();
    if (sheet.statuscallback) {
        sheet.statuscallback(scri, "calcstart", null, sheet.statuscallbackparams);
    }
    SocialCalc.RecalcSetTimeout();
};

SocialCalc.RecalcSetTimeout = function() {
    var scri = SocialCalc.RecalcInfo;
    scri.recalctimer = window.setTimeout(SocialCalc.RecalcTimerRoutine, scri.timeslicedelay);
};

SocialCalc.RecalcClearTimeout = function() {
    var scri = SocialCalc.RecalcInfo;
    if (scri.recalctimer) {
        window.clearTimeout(scri.recalctimer);
        scri.recalctimer = null;
    }
};

SocialCalc.RecalcLoadedSheet = function(sheetname, str, recalcneeded, live) {
    var sheet;
    var scri = SocialCalc.RecalcInfo;
    var scf = SocialCalc.Formula;
    sheet = SocialCalc.Formula.AddSheetToCache(sheetname || scf.SheetCache.waitingForLoading, str, live);
    if (recalcneeded && sheet && sheet.attribs.recalc != "off") {
        sheet.previousrecalcsheet = scri.sheet;
        scri.sheet = sheet;
        scri.currentState = scri.state.start_calc;
    }
    scf.SheetCache.waitingForLoading = null;
    SocialCalc.RecalcSetTimeout();
};

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
    var recalcdata = sheet.recalcdata || (sheet.recalcdata = {});
    var do_statuscallback = function(status, arg) {
        if (sheet.statuscallback) {
            sheet.statuscallback(recalcdata, status, arg, sheet.statuscallbackparams);
        }
    };
    SocialCalc.RecalcClearTimeout();
    if (scri.currentState == scri.state.start_calc) {
        recalcdata = new SocialCalc.RecalcData();
        sheet.recalcdata = recalcdata;
        for (coord in sheet.cells) {
            if (!coord) continue;
            recalcdata.celllist.push(coord);
        }
        recalcdata.calclist = {};
        scri.currentState = scri.state.order;
    }
    if (scri.currentState == scri.state.order) {
        while (recalcdata.celllistitem < recalcdata.celllist.length) {
            coord = recalcdata.celllist[recalcdata.celllistitem++];
            err = SocialCalc.RecalcCheckCell(sheet, coord);
            if (new Date() - starttime >= scri.maxtimeslice) {
                do_statuscallback("calcorder", {
                    coord: coord,
                    total: recalcdata.celllist.length,
                    count: recalcdata.celllistitem
                });
                SocialCalc.RecalcSetTimeout();
                return;
            }
        }
        do_statuscallback("calccheckdone", recalcdata.calclistlength);
        recalcdata.nextcalc = recalcdata.firstcalc;
        scri.currentState = scri.state.calc;
        SocialCalc.RecalcSetTimeout();
        return;
    }
    if (scri.currentState == scri.state.start_wait) {
        scri.currentState = scri.state.done_wait;
        if (scri.LoadSheet) {
            status = scri.LoadSheet(scf.SheetCache.waitingForLoading);
            if (status) {
                return;
            }
        }
        SocialCalc.RecalcLoadedSheet(null, "", false);
        return;
    }
    if (scri.currentState == scri.state.done_wait) {
        scri.currentState = scri.state.calc;
        SocialCalc.RecalcSetTimeout();
        return;
    }
    if (scri.currentState != scri.state.calc) {
        alert("Recalc state error: " + scri.currentState + ". Error in SocialCalc code.");
    }
    coord = sheet.recalcdata.nextcalc;
    while (coord) {
        cell = sheet.cells[coord];
        eresult = scf.evaluate_parsed_formula(cell.parseinfo, sheet, false);
        if (scf.SheetCache.waitingForLoading) {
            recalcdata.nextcalc = coord;
            recalcdata.count += count;
            do_statuscallback("calcloading", {
                sheetname: scf.SheetCache.waitingForLoading
            });
            scri.currentState = scri.state.start_wait;
            SocialCalc.RecalcSetTimeout();
            return;
        }
        if (scf.RemoteFunctionInfo.waitingForServer) {
            recalcdata.nextcalc = coord;
            recalcdata.count += count;
            do_statuscallback("calcserverfunc", {
                funcname: scf.RemoteFunctionInfo.waitingForServer,
                coord: coord,
                total: recalcdata.calclistlength,
                count: recalcdata.count
            });
            scri.currentState = scri.state.done_wait;
            return;
        }
        if (cell.datavalue != eresult.value || cell.valuetype != eresult.type) {
            cell.datavalue = eresult.value;
            cell.valuetype = eresult.type;
            delete cell.displaystring;
            sheet.recalcchangedavalue = true;
        }
        if (eresult.error) {
            cell.errors = eresult.error;
        }
        count++;
        coord = sheet.recalcdata.calclist[coord];
        if (new Date() - starttime >= scri.maxtimeslice) {
            recalcdata.nextcalc = coord;
            recalcdata.count += count;
            do_statuscallback("calcstep", {
                coord: coord,
                total: recalcdata.calclistlength,
                count: recalcdata.count
            });
            SocialCalc.RecalcSetTimeout();
            return;
        }
    }
    recalcdata.inrecalc = false;
    delete sheet.recalcdata;
    delete sheet.attribs.needsrecalc;
    scri.sheet = sheet.previousrecalcsheet || null;
    if (scri.sheet) {
        scri.currentState = scri.state.calc;
        SocialCalc.RecalcSetTimeout();
        return;
    }
    scf.FreshnessInfo.recalc_completed = true;
    scri.currentState = scri.state.idle;
    do_statuscallback("calcfinished", new Date() - scri.starttime);
    if (scri.queue.length > 0) {
        sheet = scri.queue.shift();
        sheet.RecalcSheet();
    }
};

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
    var sheetref = false;
    var oldcoord = null;
    var coord = startcoord;
    mainloop: while (coord) {
        cell = sheet.cells[coord];
        coordvals = checkinfo[coord];
        if (!cell || cell.datatype != "f" || coordvals && typeof coordvals != "object") {
            coord = oldcoord;
            if (checkinfo[coord]) oldcoord = checkinfo[coord].oldcoord;
            continue;
        }
        if (!coordvals) {
            coordvals = new SocialCalc.RecalcCheckInfo();
            checkinfo[coord] = coordvals;
        }
        if (cell.errors) {
            delete cell.errors;
        }
        if (!cell.parseinfo) {
            cell.parseinfo = scf.ParseFormulaIntoTokens(cell.formula);
        }
        parseinfo = cell.parseinfo;
        for (i = coordvals.parsepos; i < parseinfo.length; i++) {
            if (coordvals.inrange) {
                if (coordvals.inrangestart) {
                    if (coordvals.cr1.col > coordvals.cr2.col) {
                        coordvals.c1 = coordvals.cr2.col;
                        coordvals.c2 = coordvals.cr1.col;
                    } else {
                        coordvals.c1 = coordvals.cr1.col;
                        coordvals.c2 = coordvals.cr2.col;
                    }
                    coordvals.c = coordvals.c1 - 1;
                    if (coordvals.cr1.row > coordvals.cr2.row) {
                        coordvals.r1 = coordvals.cr2.row;
                        coordvals.r2 = coordvals.cr1.row;
                    } else {
                        coordvals.r1 = coordvals.cr1.row;
                        coordvals.r2 = coordvals.cr2.row;
                    }
                    coordvals.r = coordvals.r1;
                    coordvals.inrangestart = false;
                } else {}
                coordvals.c += 1;
                if (coordvals.c > coordvals.c2) {
                    coordvals.r += 1;
                    if (coordvals.r > coordvals.r2) {
                        coordvals.inrange = false;
                        continue;
                    }
                    coordvals.c = coordvals.c1;
                }
                rangecoord = SocialCalc.crToCoord(coordvals.c, coordvals.r);
                coordvals.parsepos = i;
                coordvals.oldcoord = oldcoord;
                oldcoord = coord;
                coord = rangecoord;
                if (checkinfo[coord] && typeof checkinfo[coord] == "object") {
                    cell.errors = SocialCalc.Constants.s_caccCircRef + startcoord;
                    checkinfo[startcoord] = true;
                    if (!recalcdata.firstcalc) {
                        recalcdata.firstcalc = startcoord;
                    } else {
                        recalcdata.calclist[recalcdata.lastcalc] = startcoord;
                    }
                    recalcdata.lastcalc = startcoord;
                    recalcdata.calclistlength++;
                    sheet.attribs.circularreferencecell = coord + "|" + oldcoord;
                    return cell.errors;
                }
                continue mainloop;
            }
            ttype = parseinfo[i].type;
            ttext = parseinfo[i].text;
            if (ttype == token_op) {
                if (ttext == "!") {
                    sheetref = true;
                } else if (ttext != ":") {
                    sheetref = false;
                }
            }
            if (ttype == token_name) {
                value = scf.LookupName(sheet, ttext);
                if (value.type == "range") {
                    pos = value.value.indexOf("|");
                    if (pos != -1) {
                        coordvals.cr1 = SocialCalc.coordToCr(value.value.substring(0, pos));
                        pos2 = value.value.indexOf("|", pos + 1);
                        coordvals.cr2 = SocialCalc.coordToCr(value.value.substring(pos + 1, pos2));
                        coordvals.inrange = true;
                        coordvals.inrangestart = true;
                        i = i - 1;
                        continue;
                    }
                } else if (value.type == "coord") {
                    ttype = token_coord;
                    ttext = value.value;
                } else {}
            }
            if (ttype == token_coord) {
                if (i >= 2 && parseinfo[i - 1].type == token_op && parseinfo[i - 1].text == ":" && parseinfo[i - 2].type == token_coord && !sheetref) {
                    coordvals.cr1 = SocialCalc.coordToCr(parseinfo[i - 2].text);
                    coordvals.cr2 = SocialCalc.coordToCr(ttext);
                    coordvals.inrange = true;
                    coordvals.inrangestart = true;
                    i = i - 1;
                    continue;
                } else if (!sheetref) {
                    if (ttext.indexOf("$") != -1) ttext = ttext.replace(/\$/g, "");
                    coordvals.parsepos = i + 1;
                    coordvals.oldcoord = oldcoord;
                    oldcoord = coord;
                    coord = ttext;
                    if (checkinfo[coord] && typeof checkinfo[coord] == "object") {
                        cell.errors = SocialCalc.Constants.s_caccCircRef + startcoord;
                        checkinfo[startcoord] = true;
                        if (!recalcdata.firstcalc) {
                            recalcdata.firstcalc = startcoord;
                        } else {
                            recalcdata.calclist[recalcdata.lastcalc] = startcoord;
                        }
                        recalcdata.lastcalc = startcoord;
                        recalcdata.calclistlength++;
                        sheet.attribs.circularreferencecell = coord + "|" + oldcoord;
                        return cell.errors;
                    }
                    continue mainloop;
                }
            }
        }
        sheetref = false;
        checkinfo[coord] = true;
        if (!recalcdata.firstcalc) {
            recalcdata.firstcalc = coord;
        } else {
            recalcdata.calclist[recalcdata.lastcalc] = coord;
        }
        recalcdata.lastcalc = coord;
        recalcdata.calclistlength++;
        coord = oldcoord;
        oldcoord = checkinfo[coord] ? checkinfo[coord].oldcoord : null;
    }
    return "";
};

SocialCalc.Parse = function(str) {
    this.str = str;
    this.pos = 0;
    this.delimiter = " ";
    this.lineEnd = str.indexOf("\n");
    if (this.lineEnd < 0) {
        this.lineEnd = str.length;
    }
};

SocialCalc.Parse.prototype.NextToken = function() {
    if (this.pos < 0) return "";
    var pos2 = this.str.indexOf(this.delimiter, this.pos);
    var pos1 = this.pos;
    if (pos2 > this.lineEnd) {
        pos2 = this.lineEnd;
    }
    if (pos2 >= 0) {
        this.pos = pos2 + 1;
        return this.str.substring(pos1, pos2);
    } else {
        this.pos = this.lineEnd;
        return this.str.substring(pos1, this.lineEnd);
    }
};

SocialCalc.Parse.prototype.RestOfString = function() {
    var oldpos = this.pos;
    if (this.pos < 0 || this.pos >= this.lineEnd) return "";
    this.pos = this.lineEnd;
    return this.str.substring(oldpos, this.lineEnd);
};

SocialCalc.Parse.prototype.RestOfStringNoMove = function() {
    if (this.pos < 0 || this.pos >= this.lineEnd) return "";
    return this.str.substring(this.pos, this.lineEnd);
};

SocialCalc.Parse.prototype.NextLine = function() {
    this.pos = this.lineEnd + 1;
    this.lineEnd = this.str.indexOf("\n", this.pos);
    if (this.lineEnd < 0) {
        this.lineEnd = this.str.length;
    }
};

SocialCalc.Parse.prototype.EOF = function() {
    if (this.pos < 0 || this.pos >= this.str.length) return true;
    return false;
};

SocialCalc.UndoStack = function() {
    this.stack = [];
    this.tos = -1;
    this.maxRedo = 0;
    this.maxUndo = 50;
};

SocialCalc.UndoStack.prototype.PushChange = function(type) {
    while (this.stack.length > 0 && this.stack.length - 1 > this.tos) {
        this.stack.pop();
    }
    this.stack.push({
        command: [],
        type: type,
        undo: []
    });
    if (this.maxRedo && this.stack.length > this.maxRedo) {
        this.stack.shift();
    }
    if (this.maxUndo && this.stack.length > this.maxUndo) {
        this.stack[this.stack.length - this.maxUndo - 1].undo = [];
    }
    this.tos = this.stack.length - 1;
};

SocialCalc.UndoStack.prototype.AddDo = function() {
    if (!this.stack[this.stack.length - 1]) {
        return;
    }
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] != null) args.push(arguments[i]);
    }
    var cmd = args.join(" ");
    this.stack[this.stack.length - 1].command.push(cmd);
};

SocialCalc.UndoStack.prototype.AddUndo = function() {
    if (!this.stack[this.stack.length - 1]) {
        return;
    }
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] != null) args.push(arguments[i]);
    }
    var cmd = args.join(" ");
    this.stack[this.stack.length - 1].undo.push(cmd);
};

SocialCalc.UndoStack.prototype.TOS = function() {
    if (this.tos >= 0) return this.stack[this.tos]; else return null;
};

SocialCalc.UndoStack.prototype.Undo = function() {
    if (this.tos >= 0 && (!this.maxUndo || this.tos > this.stack.length - this.maxUndo - 1)) {
        this.tos -= 1;
        return true;
    } else {
        return false;
    }
};

SocialCalc.UndoStack.prototype.Redo = function() {
    if (this.tos < this.stack.length - 1) {
        this.tos += 1;
        return true;
    } else {
        return false;
    }
};

SocialCalc.Clipboard = {
    clipboard: ""
};

SocialCalc.RenderContext = function(sheetobj) {
    var parts, num, s;
    var attribs = sheetobj.attribs;
    var scc = SocialCalc.Constants;
    this.sheetobj = sheetobj;
    this.hideRowsCols = false;
    this.showGrid = false;
    this.showRCHeaders = false;
    this.rownamewidth = scc.defaultRowNameWidth;
    this.pixelsPerRow = scc.defaultAssumedRowHeight;
    this.cellskip = {};
    this.coordToCR = {};
    this.colwidth = [];
    this.rowheight = [];
    this.totalwidth = 0;
    this.totalheight = 0;
    this.rowpanes = [];
    this.colpanes = [];
    this.colunhideleft = [];
    this.colunhideright = [];
    this.rowunhidetop = [];
    this.rowunhidebottom = [];
    this.maxcol = 0;
    this.maxrow = 0;
    this.highlights = {};
    this.cursorsuffix = "";
    this.highlightTypes = {
        cursor: {
            style: scc.defaultHighlightTypeCursorStyle,
            className: scc.defaultHighlightTypeCursorClass
        },
        range: {
            style: scc.defaultHighlightTypeRangeStyle,
            className: scc.defaultHighlightTypeRangeClass
        },
        cursorinsertup: {
            style: "color:#FFF;backgroundColor:#A6A6A6;backgroundRepeat:repeat-x;backgroundPosition:top left;backgroundImage:url(" + scc.defaultImagePrefix + "cursorinsertup.gif);",
            className: scc.defaultHighlightTypeCursorClass
        },
        cursorinsertleft: {
            style: "color:#FFF;backgroundColor:#A6A6A6;backgroundRepeat:repeat-y;backgroundPosition:top left;backgroundImage:url(" + scc.defaultImagePrefix + "cursorinsertleft.gif);",
            className: scc.defaultHighlightTypeCursorClass
        },
        range2: {
            style: "color:#000;backgroundColor:#FFF;backgroundImage:url(" + scc.defaultImagePrefix + "range2.gif);",
            className: ""
        }
    };
    this.cellIDprefix = scc.defaultCellIDPrefix;
    this.defaultlinkstyle = null;
    this.defaultHTMLlinkstyle = {
        type: "html"
    };
    this.defaultfontstyle = scc.defaultCellFontStyle;
    this.defaultfontsize = scc.defaultCellFontSize;
    this.defaultfontfamily = scc.defaultCellFontFamily;
    this.defaultlayout = scc.defaultCellLayout;
    this.defaultpanedividerwidth = scc.defaultPaneDividerWidth;
    this.defaultpanedividerheight = scc.defaultPaneDividerHeight;
    this.gridCSS = scc.defaultGridCSS;
    this.commentClassName = scc.defaultCommentClass;
    this.commentCSS = scc.defaultCommentStyle;
    this.commentNoGridClassName = scc.defaultCommentNoGridClass;
    this.commentNoGridCSS = scc.defaultCommentNoGridStyle;
    this.readonlyClassName = scc.defaultReadonlyClass;
    this.readonlyCSS = scc.defaultReadonlyStyle;
    this.readonlyNoGridClassName = scc.defaultReadonlyNoGridClass;
    this.readonlyNoGridCSS = scc.defaultReadonlyNoGridStyle;
    this.readonlyComment = scc.defaultReadonlyComment;
    this.classnames = {
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
    this.explicitStyles = {
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
    this.cellskip = null;
    this.needcellskip = true;
    this.fonts = [];
    this.layouts = [];
    this.needprecompute = true;
    if (attribs) {
        this.rowpanes[0] = {
            first: 1,
            last: attribs.lastrow
        };
        this.colpanes[0] = {
            first: 1,
            last: attribs.lastcol
        };
        this.usermaxcol = attribs.usermaxcol;
        this.usermaxrow = attribs.usermaxrow;
    } else throw scc.s_rcMissingSheet;
};

SocialCalc.RenderContext.prototype.PrecomputeSheetFontsAndLayouts = function() {
    SocialCalc.PrecomputeSheetFontsAndLayouts(this);
};

SocialCalc.RenderContext.prototype.CalculateCellSkipData = function() {
    SocialCalc.CalculateCellSkipData(this);
};

SocialCalc.RenderContext.prototype.CalculateColWidthData = function() {
    SocialCalc.CalculateColWidthData(this);
};

SocialCalc.RenderContext.prototype.CalculateRowHeightData = function() {
    SocialCalc.CalculateRowHeightData(this);
};

SocialCalc.RenderContext.prototype.SetRowPaneFirstLast = function(panenum, first, last) {
    this.rowpanes[panenum] = {
        first: first,
        last: last
    };
};

SocialCalc.RenderContext.prototype.SetColPaneFirstLast = function(panenum, first, last) {
    this.colpanes[panenum] = {
        first: first,
        last: last
    };
};

SocialCalc.RenderContext.prototype.CoordInPane = function(coord, rowpane, colpane) {
    return SocialCalc.CoordInPane(this, coord, rowpane, colpane);
};

SocialCalc.RenderContext.prototype.CellInPane = function(row, col, rowpane, colpane) {
    return SocialCalc.CellInPane(this, row, col, rowpane, colpane);
};

SocialCalc.RenderContext.prototype.InitializeTable = function(tableobj) {
    SocialCalc.InitializeTable(this, tableobj);
};

SocialCalc.RenderContext.prototype.RenderSheet = function(oldtable, linkstyle) {
    return SocialCalc.RenderSheet(this, oldtable, linkstyle);
};

SocialCalc.RenderContext.prototype.RenderColGroup = function() {
    return SocialCalc.RenderColGroup(this);
};

SocialCalc.RenderContext.prototype.RenderColHeaders = function() {
    return SocialCalc.RenderColHeaders(this);
};

SocialCalc.RenderContext.prototype.RenderSizingRow = function() {
    return SocialCalc.RenderSizingRow(this);
};

SocialCalc.RenderContext.prototype.RenderRow = function(rownum, rowpane, linkstyle) {
    return SocialCalc.RenderRow(this, rownum, rowpane, linkstyle);
};

SocialCalc.RenderContext.prototype.RenderSpacingRow = function() {
    return SocialCalc.RenderSpacingRow(this);
};

SocialCalc.RenderContext.prototype.RenderCell = function(rownum, colnum, rowpane, colpane, noElement, linkstyle) {
    return SocialCalc.RenderCell(this, rownum, colnum, rowpane, colpane, noElement, linkstyle);
};

SocialCalc.PrecomputeSheetFontsAndLayouts = function(context) {
    var defaultfont, parts, layoutre, dparts, sparts, num, s, i;
    var sheetobj = context.sheetobj;
    var attribs = sheetobj.attribs;
    if (attribs.defaultfont) {
        defaultfont = sheetobj.fonts[attribs.defaultfont];
        defaultfont = defaultfont.replace(/^\*/, SocialCalc.Constants.defaultCellFontStyle);
        defaultfont = defaultfont.replace(/(.+)\*(.+)/, "$1" + SocialCalc.Constants.defaultCellFontSize + "$2");
        defaultfont = defaultfont.replace(/\*$/, SocialCalc.Constants.defaultCellFontFamily);
        parts = defaultfont.match(/^(\S+? \S+?) (\S+?) (\S.*)$/);
        context.defaultfontstyle = parts[1];
        context.defaultfontsize = parts[2];
        context.defaultfontfamily = parts[3];
    }
    for (num = 1; num < sheetobj.fonts.length; num++) {
        s = sheetobj.fonts[num];
        s = s.replace(/^\*/, context.defaultfontstyle);
        s = s.replace(/(.+)\*(.+)/, "$1" + context.defaultfontsize + "$2");
        s = s.replace(/\*$/, context.defaultfontfamily);
        parts = s.match(/^(\S+?) (\S+?) (\S+?) (\S.*)$/);
        context.fonts[num] = {
            style: parts[1],
            weight: parts[2],
            size: parts[3],
            family: parts[4]
        };
    }
    layoutre = /^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/;
    dparts = SocialCalc.Constants.defaultCellLayout.match(layoutre);
    if (attribs.defaultlayout) {
        sparts = sheetobj.layouts[attribs.defaultlayout].match(layoutre);
    } else {
        sparts = [ "", "*", "*", "*", "*", "*" ];
    }
    for (num = 1; num < sheetobj.layouts.length; num++) {
        s = sheetobj.layouts[num];
        parts = s.match(layoutre);
        for (i = 1; i <= 5; i++) {
            if (parts[i] == "*") {
                parts[i] = sparts[i] != "*" ? sparts[i] : dparts[i];
            }
        }
        context.layouts[num] = "padding:" + parts[1] + " " + parts[2] + " " + parts[3] + " " + parts[4] + ";vertical-align:" + parts[5] + ";";
    }
    context.needprecompute = false;
};

SocialCalc.CalculateCellSkipData = function(context) {
    var row, col, coord, cell, contextcell, colspan, rowspan, skiprow, skipcol, skipcoord;
    var sheetobj = context.sheetobj;
    var sheetrowattribs = sheetobj.rowattribs;
    var sheetcolattribs = sheetobj.colattribs;
    context.maxrow = 0;
    context.maxcol = 0;
    context.cellskip = {};
    for (row = 1; row <= sheetobj.attribs.lastrow; row++) {
        for (col = 1; col <= sheetobj.attribs.lastcol; col++) {
            coord = SocialCalc.crToCoord(col, row);
            cell = sheetobj.cells[coord];
            if (cell === undefined || context.cellskip[coord]) continue;
            colspan = cell.colspan || 1;
            rowspan = cell.rowspan || 1;
            if (colspan > 1 || rowspan > 1) {
                for (skiprow = row; skiprow < row + rowspan; skiprow++) {
                    for (skipcol = col; skipcol < col + colspan; skipcol++) {
                        skipcoord = SocialCalc.crToCoord(skipcol, skiprow);
                        if (skipcoord == coord) {
                            context.coordToCR[coord] = {
                                row: row,
                                col: col
                            };
                        } else {
                            context.cellskip[skipcoord] = coord;
                        }
                        if (skiprow > context.maxrow) maxrow = skiprow;
                        if (skipcol > context.maxcol) maxcol = skipcol;
                    }
                }
            }
        }
    }
    context.needcellskip = false;
};

SocialCalc.CalculateColWidthData = function(context) {
    var colnum, colname, colwidth, totalwidth;
    var sheetobj = context.sheetobj;
    var sheetcolattribs = sheetobj.colattribs;
    totalwidth = context.showRCHeaders ? context.rownamewidth - 0 : 0;
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            colname = SocialCalc.rcColname(colnum);
            if (sheetobj.colattribs.hide[colname] == "yes") {
                context.colwidth[colnum] = 0;
            } else {
                colwidth = sheetobj.colattribs.width[colname] || sheetobj.attribs.defaultcolwidth || SocialCalc.Constants.defaultColWidth;
                if (colwidth == "blank" || colwidth == "auto") colwidth = "";
                context.colwidth[colnum] = colwidth + "";
                totalwidth += colwidth && colwidth - 0 > 0 ? colwidth - 0 : 10;
            }
        }
    }
    context.totalwidth = totalwidth;
};

SocialCalc.CalculateRowHeightData = function(context) {
    var rownum, rowheight, totalheight;
    var sheetobj = context.sheetobj;
    totalheight = context.showRCHeaders ? context.pixelsPerRow : 0;
    for (rowpane = 0; rowpane < context.rowpanes.length; rowpane++) {
        for (rownum = context.rowpanes[rowpane].first; rownum <= context.rowpanes[rowpane].last; rownum++) {
            if (sheetobj.rowattribs.hide[rownum] === "yes") {
                context.rowheight[rownum] = 0;
            } else {
                rowheight = sheetobj.rowattribs.height[rownum] || sheetobj.attribs.defaultrowheight || SocialCalc.Constants.defaultAssumedRowHeight;
                if (rowheight === "blank" || rowheight === "auto") rowheight = "";
                context.rowheight[rownum] = rowheight + "";
                totalheight += rowheight && rowheight - 0 > 0 ? rowheight - 0 : 10;
            }
        }
    }
    context.totalheight = totalheight;
};

SocialCalc.InitializeTable = function(context, tableobj) {
    tableobj.style.borderCollapse = "collapse";
    tableobj.cellSpacing = "0";
    tableobj.cellPadding = "0";
    tableobj.style.width = context.totalwidth + "px";
};

SocialCalc.RenderSheet = function(context, oldtable, linkstyle) {
    var newrow, rowpane;
    var tableobj, colgroupobj, tbodyobj, parentnode;
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
    context.CalculateColWidthData();
    context.CalculateRowHeightData();
    tableobj = document.createElement("table");
    context.InitializeTable(tableobj);
    colgroupobj = context.RenderColGroup();
    tableobj.appendChild(colgroupobj);
    tbodyobj = document.createElement("tbody");
    tbodyobj.appendChild(context.RenderSizingRow());
    if (context.showRCHeaders) {
        newrow = context.RenderColHeaders();
        if (newrow) tbodyobj.appendChild(newrow);
    }
    for (rowpane = 0; rowpane < context.rowpanes.length; rowpane++) {
        for (rownum = context.rowpanes[rowpane].first; rownum <= context.rowpanes[rowpane].last; rownum++) {
            newrow = context.RenderRow(rownum, rowpane, linkstyle);
            tbodyobj.appendChild(newrow);
        }
        if (rowpane < context.rowpanes.length - 1) {
            newrow = context.RenderSpacingRow();
            tbodyobj.appendChild(newrow);
        }
    }
    tableobj.appendChild(tbodyobj);
    if (oldtable) {
        parentnode = oldtable.parentNode;
        if (parentnode) parentnode.replaceChild(tableobj, oldtable);
    }
    return tableobj;
};

SocialCalc.RenderRow = function(context, rownum, rowpane, linkstyle) {
    var sheetobj = context.sheetobj;
    var result = document.createElement("tr");
    var colnum, newcol, colpane, newdiv;
    if (context.showRCHeaders) {
        newcol = document.createElement("td");
        if (context.classnames) newcol.className = context.classnames.rowname;
        if (context.explicitStyles) newcol.style.cssText = context.explicitStyles.rowname;
        newcol.width = context.rownamewidth;
        newcol.height = context.rowheight[rownum];
        newcol.style.verticalAlign = "top";
        newcol.innerHTML = rownum + "";
        if (rownum < context.rowpanes[context.rowpanes.length - 1].last && sheetobj.rowattribs.hide[rownum + 1] == "yes") {
            var container = document.createElement("div");
            container.style.position = "relative";
            var unhide = document.createElement("div");
            if (context.classnames) unhide.className = context.classnames.unhidetop;
            if (context.explicitStyles) unhide.style.cssText = context.explicitStyles.unhidetop;
            var fixPosition = context.rowheight[rownum] - 0 - SocialCalc.Constants.defaultAssumedRowHeight;
            fixPosition = fixPosition === 0 ? 4 : fixPosition;
            unhide.style.bottom = "-" + fixPosition + "px";
            context.rowunhidetop[rownum] = unhide;
            container.appendChild(unhide);
            newcol.appendChild(container);
        }
        if (rownum > 1 && sheetobj.rowattribs.hide[rownum - 1] == "yes") {
            var unhide = document.createElement("div");
            if (context.classnames) unhide.className = context.classnames.unhidebottom;
            if (context.explicitStyles) unhide.style.cssText = context.explicitStyles.unhidebottom;
            context.rowunhidebottom[rownum] = unhide;
            newcol.appendChild(unhide);
        }
        result.appendChild(newcol);
    }
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            newcol = context.RenderCell(rownum, colnum, rowpane, colpane, null, linkstyle);
            if (newcol) result.appendChild(newcol);
        }
        if (colpane < context.colpanes.length - 1) {
            newcol = document.createElement("td");
            newcol.width = context.defaultpanedividerwidth;
            if (context.classnames.panedivider) newcol.className = context.classnames.panedivider;
            if (context.explicitStyles.panedivider) newcol.style.cssText = context.explicitStyles.panedivider;
            newdiv = document.createElement("div");
            newdiv.style.width = context.defaultpanedividerwidth + "px";
            newdiv.style.overflow = "hidden";
            newcol.appendChild(newdiv);
            result.appendChild(newcol);
        }
    }
    if (sheetobj.rowattribs.hide[rownum] == "yes") {
        result.style.cssText += ";display:none";
    }
    return result;
};

SocialCalc.RenderSpacingRow = function(context) {
    var colnum, newcol, colpane, w;
    var sheetobj = context.sheetobj;
    var result = document.createElement("tr");
    if (context.showRCHeaders) {
        newcol = document.createElement("td");
        newcol.width = context.rownamewidth;
        newcol.height = context.defaultpanedividerheight;
        if (context.classnames.panedivider) newcol.className = context.classnames.panedivider;
        if (context.explicitStyles.panedivider) newcol.style.cssText = context.explicitStyles.panedivider;
        result.appendChild(newcol);
    }
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            newcol = document.createElement("td");
            w = context.colwidth[colnum];
            if (w) newcol.width = w;
            newcol.height = context.defaultpanedividerheight;
            if (context.classnames.panedivider) newcol.className = context.classnames.panedivider;
            if (context.explicitStyles.panedivider) newcol.style.cssText = context.explicitStyles.panedivider;
            if (newcol) result.appendChild(newcol);
        }
        if (colpane < context.colpanes.length - 1) {
            newcol = document.createElement("td");
            newcol.width = context.defaultpanedividerwidth;
            newcol.height = context.defaultpanedividerheight;
            if (context.classnames.panedivider) newcol.className = context.classnames.panedivider;
            if (context.explicitStyles.panedivider) newcol.style.cssText = context.explicitStyles.panedivider;
            result.appendChild(newcol);
        }
    }
    return result;
};

SocialCalc.RenderColHeaders = function(context) {
    var sheetobj = context.sheetobj;
    var result = document.createElement("tr");
    var colnum, newcol;
    if (!context.showRCHeaders) return null;
    newcol = document.createElement("td");
    if (context.classnames) newcol.className = context.classnames.upperleft;
    if (context.explicitStyles) newcol.style.cssText = context.explicitStyles.upperleft;
    newcol.width = context.rownamewidth;
    result.appendChild(newcol);
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            newcol = document.createElement("td");
            if (context.classnames) newcol.className = context.classnames.colname;
            if (context.explicitStyles) newcol.style.cssText = context.explicitStyles.colname;
            if (sheetobj.colattribs.hide[SocialCalc.rcColname(colnum)] == "yes") {
                newcol.style.cssText += ";display:none";
            }
            newcol.innerHTML = SocialCalc.rcColname(colnum);
            if (colnum < context.colpanes[context.colpanes.length - 1].last && sheetobj.colattribs.hide[SocialCalc.rcColname(colnum + 1)] == "yes") {
                var unhide = document.createElement("div");
                if (context.classnames) unhide.className = context.classnames.unhideleft;
                if (context.explicitStyles) unhide.style.cssText = context.explicitStyles.unhideleft;
                context.colunhideleft[colnum] = unhide;
                newcol.appendChild(unhide);
            }
            if (colnum > 1 && sheetobj.colattribs.hide[SocialCalc.rcColname(colnum - 1)] == "yes") {
                unhide = document.createElement("div");
                if (context.classnames) unhide.className = context.classnames.unhideright;
                if (context.explicitStyles) unhide.style.cssText = context.explicitStyles.unhideright;
                context.colunhideright[colnum] = unhide;
                newcol.appendChild(unhide);
            }
            result.appendChild(newcol);
        }
        if (colpane < context.colpanes.length - 1) {
            newcol = document.createElement("td");
            newcol.width = context.defaultpanedividerwidth;
            if (context.classnames.panedivider) newcol.className = context.classnames.panedivider;
            if (context.explicitStyles.panedivider) newcol.style.cssText = context.explicitStyles.panedivider;
            result.appendChild(newcol);
        }
    }
    return result;
};

SocialCalc.RenderColGroup = function(context) {
    var colpane, colnum, newcol, t;
    var sheetobj = context.sheetobj;
    var result = document.createElement("colgroup");
    if (context.showRCHeaders) {
        newcol = document.createElement("col");
        newcol.width = context.rownamewidth;
        result.appendChild(newcol);
    }
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            newcol = document.createElement("col");
            if (sheetobj.colattribs.hide[SocialCalc.rcColname(colnum)] == "yes") {
                newcol.width = "1";
            } else {
                t = context.colwidth[colnum];
                if (t) newcol.width = t;
                result.appendChild(newcol);
            }
        }
        if (colpane < context.colpanes.length - 1) {
            newcol = document.createElement("col");
            newcol.width = context.defaultpanedividerwidth;
            result.appendChild(newcol);
        }
    }
    return result;
};

SocialCalc.RenderSizingRow = function(context) {
    var colpane, colnum, newcell, t;
    var sheetobj = context.sheetobj;
    var result = document.createElement("tr");
    if (context.showRCHeaders) {
        newcell = document.createElement("td");
        newcell.style.width = context.rownamewidth + "px";
        newcell.height = "1";
        result.appendChild(newcell);
    }
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            newcell = document.createElement("td");
            if (sheetobj.colattribs.hide[SocialCalc.rcColname(colnum)] == "yes") {
                newcell.width = "1";
            } else {
                t = context.colwidth[colnum];
                if (t) newcell.width = t;
            }
            newcell.height = "1";
            result.appendChild(newcell);
        }
        if (colpane < context.colpanes.length - 1) {
            newcell = document.createElement("td");
            newcell.width = context.defaultpanedividerwidth;
            newcell.height = "1";
            result.appendChild(newcell);
        }
    }
    return result;
};

SocialCalc.RenderCell = function(context, rownum, colnum, rowpane, colpane, noElement, linkstyle) {
    var sheetobj = context.sheetobj;
    var num, t, result, span, stylename, cell, endcell, sheetattribs, scdefaults;
    var stylestr = "";
    rownum = rownum - 0;
    colnum = colnum - 0;
    var coord = SocialCalc.crToCoord(colnum, rownum);
    if (context.cellskip[coord]) {
        if (context.CoordInPane(context.cellskip[coord], rowpane, colpane)) {
            return null;
        }
        result = noElement ? SocialCalc.CreatePseudoElement() : document.createElement("td");
        if (context.classnames.skippedcell) result.className = context.classnames.skippedcell;
        if (context.explicitStyles.skippedcell) result.style.cssText = context.explicitStyles.skippedcell;
        result.innerHTML = "&nbsp;";
        return result;
    }
    result = noElement ? SocialCalc.CreatePseudoElement() : document.createElement("td");
    if (context.cellIDprefix) {
        result.id = context.cellIDprefix + coord;
    }
    cell = sheetobj.cells[coord];
    if (!cell) {
        cell = new SocialCalc.Cell(coord);
    }
    sheetattribs = sheetobj.attribs;
    scc = SocialCalc.Constants;
    if (cell.colspan > 1) {
        span = 1;
        for (num = 1; num < cell.colspan; num++) {
            if (sheetobj.colattribs.hide[SocialCalc.rcColname(colnum + num)] != "yes" && context.CellInPane(rownum, colnum + num, rowpane, colpane)) {
                span++;
            }
        }
        result.colSpan = span;
    }
    if (cell.rowspan > 1) {
        span = 1;
        for (num = 1; num < cell.rowspan; num++) {
            if (sheetobj.rowattribs.hide[rownum + num + ""] != "yes" && context.CellInPane(rownum + num, colnum, rowpane, colpane)) span++;
        }
        result.rowSpan = span;
    }
    if (cell.displaystring == undefined) {
        cell.displaystring = SocialCalc.FormatValueForDisplay(sheetobj, cell.datavalue, coord, linkstyle || context.defaultlinkstyle);
    }
    result.innerHTML = cell.displaystring;
    num = cell.layout || sheetattribs.defaultlayout;
    if (num && typeof context.layouts[num] !== "undefined") {
        stylestr += context.layouts[num];
    } else {
        stylestr += scc.defaultCellLayout;
    }
    num = cell.font || sheetattribs.defaultfont;
    if (num && typeof context.fonts[num] !== "undefined") {
        t = context.fonts[num];
        stylestr += "font-style:" + t.style + ";font-weight:" + t.weight + ";font-size:" + t.size + ";font-family:" + t.family + ";";
    } else {
        if (scc.defaultCellFontSize) {
            stylestr += "font-size:" + scc.defaultCellFontSize + ";";
        }
        if (scc.defaultCellFontFamily) {
            stylestr += "font-family:" + scc.defaultCellFontFamily + ";";
        }
    }
    num = cell.color || sheetattribs.defaultcolor;
    if (num && typeof sheetobj.colors[num] !== "undefined") stylestr += "color:" + sheetobj.colors[num] + ";";
    num = cell.bgcolor || sheetattribs.defaultbgcolor;
    if (num && typeof sheetobj.colors[num] !== "undefined") stylestr += "background-color:" + sheetobj.colors[num] + ";";
    num = cell.cellformat;
    if (num && typeof sheetobj.cellformats[num] !== "undefined") {
        stylestr += "text-align:" + sheetobj.cellformats[num] + ";";
    } else {
        t = cell.valuetype.charAt(0);
        if (t == "t") {
            num = sheetattribs.defaulttextformat;
            if (num && typeof sheetobj.cellformats[num] !== "undefined") stylestr += "text-align:" + sheetobj.cellformats[num] + ";";
        } else if (t == "n") {
            num = sheetattribs.defaultnontextformat;
            if (num && typeof sheetobj.cellformats[num] !== "undefined") {
                stylestr += "text-align:" + sheetobj.cellformats[num] + ";";
            } else {
                stylestr += "text-align:right;";
            }
        } else stylestr += "text-align:left;";
    }
    if (cell.colspan > 1 || cell.rowspan > 1) {
        endcell = sheetobj.cells[SocialCalc.crToCoord(colnum + (cell.colspan || 1) - 1, rownum + (cell.rowspan || 1) - 1)];
    }
    num = cell.bt;
    if (num && typeof sheetobj.borderstyles[num] !== "undefined") stylestr += "border-top:" + sheetobj.borderstyles[num] + ";";
    num = typeof endcell != "undefined" ? endcell.br : cell.br;
    if (num && typeof sheetobj.borderstyles[num] !== "undefined") stylestr += "border-right:" + sheetobj.borderstyles[num] + ";"; else if (context.showGrid) {
        if (context.CellInPane(rownum, colnum + (cell.colspan || 1), rowpane, colpane)) t = SocialCalc.crToCoord(colnum + (cell.colspan || 1), rownum); else t = "nomatch";
        if (context.cellskip[t]) t = context.cellskip[t];
        if (!sheetobj.cells[t] || !sheetobj.cells[t].bl) stylestr += "border-right:" + context.gridCSS;
    }
    num = typeof endcell != "undefined" ? endcell.bb : cell.bb;
    if (num && typeof sheetobj.borderstyles[num] !== "undefined") stylestr += "border-bottom:" + sheetobj.borderstyles[num] + ";"; else if (context.showGrid) {
        if (context.CellInPane(rownum + (cell.rowspan || 1), colnum, rowpane, colpane)) t = SocialCalc.crToCoord(colnum, rownum + (cell.rowspan || 1)); else t = "nomatch";
        if (context.cellskip[t]) t = context.cellskip[t];
        if (!sheetobj.cells[t] || !sheetobj.cells[t].bt) stylestr += "border-bottom:" + context.gridCSS;
    }
    num = cell.bl;
    if (num && typeof sheetobj.borderstyles[num] !== "undefined") stylestr += "border-left:" + sheetobj.borderstyles[num] + ";";
    if (cell.comment) {
        result.title = cell.comment;
        if (context.showGrid) {
            if (context.commentClassName) {
                result.className = (result.className ? result.className + " " : "") + context.commentClassName;
            }
            stylestr += context.commentCSS;
        } else {
            if (context.commentNoGridClassName) {
                result.className = (result.className ? result.className + " " : "") + context.commentNoGridClassName;
            }
            stylestr += context.commentNoGridCSS;
        }
    }
    if (cell.readonly) {
        if (!cell.comment) {
            result.title = context.readonlyComment;
        }
        if (context.showGrid) {
            if (context.readonlyClassName) {
                result.className = (result.className ? result.className + " " : "") + context.readonlyClassName;
            }
            stylestr += context.readonlyCSS;
        } else {
            if (context.readonlyNoGridClassName) {
                result.className = (result.className ? result.className + " " : "") + context.readonlyNoGridClassName;
            }
            stylestr += context.readonlyNoGridCSS;
        }
    }
    result.style.cssText = stylestr;
    t = context.highlights[coord];
    if (t) {
        if (t == "cursor") t += context.cursorsuffix;
        if (context.highlightTypes[t].className) {
            result.className = (result.className ? result.className + " " : "") + context.highlightTypes[t].className;
        }
        SocialCalc.setStyles(result, context.highlightTypes[t].style);
    }
    if (sheetobj.colattribs.hide[SocialCalc.rcColname(colnum)] == "yes") {
        result.style.cssText += ";display:none";
    }
    if (sheetobj.rowattribs.hide[rownum] == "yes") {
        result.style.cssText += ";display:none";
    }
    return result;
};

SocialCalc.CoordInPane = function(context, coord, rowpane, colpane) {
    var coordToCR = context.coordToCR[coord];
    if (!coordToCR || !coordToCR.row || !coordToCR.col) throw "Bad coordToCR for " + coord;
    return context.CellInPane(coordToCR.row, coordToCR.col, rowpane, colpane);
};

SocialCalc.CellInPane = function(context, row, col, rowpane, colpane) {
    var panerowlimits = context.rowpanes[rowpane];
    var panecollimits = context.colpanes[colpane];
    if (!panerowlimits || !panecollimits) throw "CellInPane called with unknown panes " + rowpane + "/" + colpane;
    if (row < panerowlimits.first || row > panerowlimits.last) return false;
    if (col < panecollimits.first || col > panecollimits.last) return false;
    return true;
};

SocialCalc.CreatePseudoElement = function() {
    return {
        style: {
            cssText: ""
        },
        innerHTML: "",
        className: ""
    };
};

SocialCalc.rcColname = function(c) {
    if (c > 702) c = 702;
    if (c < 1) c = 1;
    var collow = (c - 1) % 26 + 65;
    var colhigh = Math.floor((c - 1) / 26);
    if (colhigh) return String.fromCharCode(colhigh + 64) + String.fromCharCode(collow); else return String.fromCharCode(collow);
};

SocialCalc.letters = [ "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z" ];

SocialCalc.crToCoord = function(c, r) {
    var result;
    if (c < 1) c = 1;
    if (c > 702) c = 702;
    if (r < 1) r = 1;
    var collow = (c - 1) % 26;
    var colhigh = Math.floor((c - 1) / 26);
    if (colhigh) result = SocialCalc.letters[colhigh - 1] + SocialCalc.letters[collow] + r; else result = SocialCalc.letters[collow] + r;
    return result;
};

SocialCalc.coordToCol = {};

SocialCalc.coordToRow = {};

SocialCalc.coordToCr = function(cr) {
    var c, i, ch;
    var r = SocialCalc.coordToRow[cr];
    if (r) return {
        row: r,
        col: SocialCalc.coordToCol[cr]
    };
    c = 0;
    r = 0;
    for (i = 0; i < cr.length; i++) {
        ch = cr.charCodeAt(i);
        if (ch == 36) ; else if (ch <= 57) r = 10 * r + ch - 48; else if (ch >= 97) c = 26 * c + ch - 96; else if (ch >= 65) c = 26 * c + ch - 64;
    }
    SocialCalc.coordToCol[cr] = c;
    SocialCalc.coordToRow[cr] = r;
    return {
        row: r,
        col: c
    };
};

SocialCalc.ParseRange = function(range) {
    var pos, cr, cr1, cr2;
    if (!range) range = "A1:A1";
    range = range.toUpperCase();
    pos = range.indexOf(":");
    if (pos >= 0) {
        cr = range.substring(0, pos);
        cr1 = SocialCalc.coordToCr(cr);
        cr1.coord = cr;
        cr = range.substring(pos + 1);
        cr2 = SocialCalc.coordToCr(cr);
        cr2.coord = cr;
    } else {
        cr1 = SocialCalc.coordToCr(range);
        cr1.coord = range;
        cr2 = SocialCalc.coordToCr(range);
        cr2.coord = range;
    }
    return {
        cr1: cr1,
        cr2: cr2
    };
};

SocialCalc.decodeFromSave = function(s) {
    if (typeof s != "string") return s;
    if (s.indexOf("\\") == -1) return s;
    var r = s.replace(/\\c/g, ":");
    r = r.replace(/\\n/g, "\n");
    return r.replace(/\\b/g, "\\");
};

SocialCalc.decodeFromAjax = function(s) {
    if (typeof s != "string") return s;
    if (s.indexOf("\\") == -1) return s;
    var r = s.replace(/\\c/g, ":");
    r = r.replace(/\\n/g, "\n");
    r = r.replace(/\\e/g, "]]");
    return r.replace(/\\b/g, "\\");
};

SocialCalc.encodeForSave = function(s) {
    if (typeof s != "string") return s;
    if (s.indexOf("\\") != -1) s = s.replace(/\\/g, "\\b");
    if (s.indexOf(":") != -1) s = s.replace(/:/g, "\\c");
    if (s.indexOf("\n") != -1) s = s.replace(/\n/g, "\\n");
    return s;
};

SocialCalc.special_chars = function(string) {
    if (/[&<>"]/.test(string)) {
        string = string.replace(/&/g, "&amp;");
        string = string.replace(/</g, "&lt;");
        string = string.replace(/>/g, "&gt;");
        string = string.replace(/"/g, "&quot;");
    }
    return string;
};

SocialCalc.Lookup = function(value, list) {
    for (i = 0; i < list.length; i++) {
        if (list[i] > value) {
            if (i > 0) return i - 1; else return null;
        }
    }
    return list.length - 1;
};

SocialCalc.setStyles = function(element, cssText) {
    var parts, part, pos, name, value;
    if (!cssText) return;
    parts = cssText.split(";");
    for (part = 0; part < parts.length; part++) {
        pos = parts[part].indexOf(":");
        if (pos != -1) {
            name = parts[part].substring(0, pos);
            value = parts[part].substring(pos + 1);
            if (name && value) {
                element.style[name] = value;
            }
        }
    }
};

SocialCalc.GetViewportInfo = function() {
    var result = {};
    if (window.innerWidth) {
        result.width = window.innerWidth;
        result.height = window.innerHeight;
        result.horizontalScroll = window.pageXOffset;
        result.verticalScroll = window.pageYOffset;
    } else {
        if (document.documentElement && document.documentElement.clientWidth) {
            result.width = document.documentElement.clientWidth;
            result.height = document.documentElement.clientHeight;
            result.horizontalScroll = document.documentElement.scrollLeft;
            result.verticalScroll = document.documentElement.scrollTop;
        } else if (document.body.clientWidth) {
            result.width = document.body.clientWidth;
            result.height = document.body.clientHeight;
            result.horizontalScroll = document.body.scrollLeft;
            result.verticalScroll = document.body.scrollTop;
        }
    }
    return result;
};

SocialCalc.GetElementPosition = function(element) {
    var offsetLeft = 0;
    var offsetTop = 0;
    while (element) {
        if (SocialCalc.GetComputedStyle(element, "position") == "relative") break;
        offsetLeft += element.offsetLeft;
        offsetTop += element.offsetTop;
        element = element.offsetParent;
    }
    return {
        left: offsetLeft,
        top: offsetTop
    };
};

SocialCalc.GetElementPositionWithScroll = function(element) {
    var rect = element.getBoundingClientRect();
    return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width ? rect.width : rect.right - rect.left,
        height: rect.height ? rect.height : rect.bottom - rect.top
    };
};

SocialCalc.GetElementFixedParent = function(element) {
    while (element) {
        if (element.tagName == "HTML") break;
        if (SocialCalc.GetComputedStyle(element, "position") == "fixed") return element;
        element = element.parentNode;
    }
    return false;
};

SocialCalc.GetComputedStyle = function(element, style) {
    var computedStyle;
    if (typeof element.currentStyle != "undefined") {
        computedStyle = element.currentStyle;
    } else {
        computedStyle = document.defaultView.getComputedStyle(element, null);
    }
    return computedStyle[style];
};

SocialCalc.LookupElement = function(element, array) {
    var i;
    for (i = 0; i < array.length; i++) {
        if (array[i].element == element) return array[i];
    }
    return null;
};

SocialCalc.AssignID = function(obj, element, id) {
    if (obj.idPrefix) {
        element.id = obj.idPrefix + id;
    }
};

SocialCalc.GetCellContents = function(sheetobj, coord) {
    var result = "";
    var cellobj = sheetobj.cells[coord];
    if (cellobj) {
        switch (cellobj.datatype) {
          case "v":
            result = cellobj.datavalue + "";
            break;

          case "t":
            result = "'" + cellobj.datavalue;
            break;

          case "f":
            result = "=" + cellobj.formula;
            break;

          case "c":
            result = cellobj.formula;
            break;

          default:
            break;
        }
    }
    return result;
};

SocialCalc.FormatValueForDisplay = function(sheetobj, value, cr, linkstyle) {
    var valueformat, has_parens, has_commas, valuetype, valuesubtype;
    var displayvalue;
    var sheetattribs = sheetobj.attribs;
    var scc = SocialCalc.Constants;
    var cell = sheetobj.cells[cr];
    if (!cell) {
        cell = new SocialCalc.Cell(cr);
    }
    displayvalue = value;
    valuetype = cell.valuetype || "";
    valuesubtype = valuetype.substring(1);
    valuetype = valuetype.charAt(0);
    if (cell.errors || valuetype == "e") {
        displayvalue = cell.errors || valuesubtype || "Error in cell";
        return displayvalue;
    }
    if (valuetype == "t") {
        valueformat = sheetobj.valueformats[cell.textvalueformat - 0] || sheetobj.valueformats[sheetattribs.defaulttextvalueformat - 0] || "";
        if (valueformat == "formula") {
            if (cell.datatype == "f") {
                displayvalue = SocialCalc.special_chars("=" + cell.formula) || "&nbsp;";
            } else if (cell.datatype == "c") {
                displayvalue = SocialCalc.special_chars("'" + cell.formula) || "&nbsp;";
            } else {
                displayvalue = SocialCalc.special_chars("'" + displayvalue) || "&nbsp;";
            }
            return displayvalue;
        }
        displayvalue = SocialCalc.format_text_for_display(displayvalue, cell.valuetype, valueformat, sheetobj, linkstyle, cell.nontextvalueformat);
    } else if (valuetype == "n") {
        valueformat = cell.nontextvalueformat;
        if (valueformat == null || valueformat == "") {
            valueformat = sheetattribs.defaultnontextvalueformat;
        }
        valueformat = sheetobj.valueformats[valueformat - 0];
        if (valueformat == null || valueformat == "none") {
            valueformat = "";
        }
        if (valueformat == "formula") {
            if (cell.datatype == "f") {
                displayvalue = SocialCalc.special_chars("=" + cell.formula) || "&nbsp;";
            } else if (cell.datatype == "c") {
                displayvalue = SocialCalc.special_chars("'" + cell.formula) || "&nbsp;";
            } else {
                displayvalue = SocialCalc.special_chars("'" + displayvalue) || "&nbsp;";
            }
            return displayvalue;
        } else if (valueformat == "forcetext") {
            if (cell.datatype == "f") {
                displayvalue = SocialCalc.special_chars("=" + cell.formula) || "&nbsp;";
            } else if (cell.datatype == "c") {
                displayvalue = SocialCalc.special_chars(cell.formula) || "&nbsp;";
            } else {
                displayvalue = SocialCalc.special_chars(displayvalue) || "&nbsp;";
            }
            return displayvalue;
        }
        displayvalue = SocialCalc.format_number_for_display(displayvalue, cell.valuetype, valueformat);
    } else {
        displayvalue = "&nbsp;";
    }
    return displayvalue;
};

SocialCalc.format_text_for_display = function(rawvalue, valuetype, valueformat, sheetobj, linkstyle, nontextvalueformat) {
    var valueformat, valuesubtype, dvsc, dvue, textval;
    var displayvalue;
    valuesubtype = valuetype.substring(1);
    displayvalue = rawvalue;
    if (valueformat == "none" || valueformat == null) valueformat = "";
    if (!/^(text-|custom|hidden)/.test(valueformat)) valueformat = "";
    if (valueformat == "" || valueformat == "General") {
        if (valuesubtype == "h") valueformat = "text-html";
        if (valuesubtype == "w" || valuesubtype == "r") valueformat = "text-wiki";
        if (valuesubtype == "l") valueformat = "text-link";
        if (!valuesubtype) valueformat = "text-plain";
    }
    if (valueformat == "text-html") {
    } else if (SocialCalc.Callbacks.expand_wiki && /^text-wiki/.test(valueformat)) {
        displayvalue = SocialCalc.Callbacks.expand_wiki(displayvalue, sheetobj, linkstyle, valueformat);
    } else if (valueformat == "text-wiki") {
        displayvalue = SocialCalc.Callbacks.expand_markup && SocialCalc.Callbacks.expand_markup(displayvalue, sheetobj, linkstyle) || SocialCalc.special_chars("wiki-text:" + displayvalue);
    } else if (valueformat == "text-url") {
        dvsc = SocialCalc.special_chars(displayvalue);
        dvue = encodeURI(displayvalue);
        displayvalue = '<a href="' + dvue + '">' + dvsc + "</a>";
    } else if (valueformat == "text-link") {
        displayvalue = SocialCalc.expand_text_link(displayvalue, sheetobj, linkstyle, valueformat);
    } else if (valueformat == "text-image") {
        dvue = encodeURI(displayvalue);
        displayvalue = '<img src="' + dvue + '">';
    } else if (valueformat.substring(0, 12) == "text-custom:") {
        dvsc = SocialCalc.special_chars(displayvalue);
        dvsc = dvsc.replace(/  /g, "&nbsp; ");
        dvsc = dvsc.replace(/\n/g, "<br>");
        dvue = encodeURI(displayvalue);
        textval = {};
        textval.r = displayvalue;
        textval.s = dvsc;
        textval.u = dvue;
        displayvalue = valueformat.substring(12);
        displayvalue = displayvalue.replace(/@(r|s|u)/g, function(a, c) {
            return textval[c];
        });
    } else if (valueformat.substring(0, 6) == "custom") {
        displayvalue = SocialCalc.special_chars(displayvalue);
        displayvalue = displayvalue.replace(/  /g, "&nbsp; ");
        displayvalue = displayvalue.replace(/\n/g, "<br>");
        displayvalue += " (custom format)";
    } else if (valueformat == "hidden") {
        displayvalue = "&nbsp;";
    } else if (nontextvalueformat != null && nontextvalueformat != "" && sheetobj.valueformats[nontextvalueformat - 0] != "none" && sheetobj.valueformats[nontextvalueformat - 0] != "") {
        valueformat = sheetobj.valueformats[nontextvalueformat];
        displayvalue = SocialCalc.format_number_for_display(rawvalue, valuetype, valueformat);
    } else {
        displayvalue = SocialCalc.special_chars(displayvalue);
        displayvalue = displayvalue.replace(/  /g, "&nbsp; ");
        displayvalue = displayvalue.replace(/\n/g, "<br>");
    }
    return displayvalue;
};

SocialCalc.format_number_for_display = function(rawvalue, valuetype, valueformat) {
    var value, valuesubtype;
    var scc = SocialCalc.Constants;
    value = rawvalue - 0;
    valuesubtype = valuetype.substring(1);
    if (valueformat == "Auto" || valueformat == "") {
        if (valuesubtype == "%") {
            valueformat = scc.defaultFormatp;
        } else if (valuesubtype == "$") {
            valueformat = scc.defaultFormatc;
        } else if (valuesubtype == "dt") {
            valueformat = scc.defaultFormatdt;
        } else if (valuesubtype == "d") {
            valueformat = scc.defaultFormatd;
        } else if (valuesubtype == "t") {
            valueformat = scc.defaultFormatt;
        } else if (valuesubtype == "l") {
            valueformat = "logical";
        } else {
            valueformat = "General";
        }
    }
    if (valueformat == "logical") {
        return value ? scc.defaultDisplayTRUE : scc.defaultDisplayFALSE;
    }
    if (valueformat == "hidden") {
        return "&nbsp;";
    }
    return SocialCalc.FormatNumber.formatNumberWithFormat(rawvalue, valueformat, "");
};

SocialCalc.DetermineValueType = function(rawvalue) {
    var value = rawvalue + "";
    var type = "t";
    var tvalue, matches, year, hour, minute, second, denom, num, intgr, constr;
    tvalue = value.replace(/^\s+/, "");
    tvalue = tvalue.replace(/\s+$/, "");
    if (value.length == 0) {
        type = "";
    } else if (value.match(/^\s+$/)) {
    } else if (tvalue.match(/^[-+]?\d*(?:\.)?\d*(?:[eE][-+]?\d+)?$/)) {
        value = tvalue - 0;
        if (isNaN(value)) {
            value = rawvalue + "";
        } else {
            type = "n";
        }
    } else if (tvalue.match(/^[-+]?\d*(?:\.)?\d*\s*%$/)) {
        value = (tvalue.slice(0, -1) - 0) / 100;
        type = "n%";
    } else if (tvalue.match(/^[-+]?\$\s*\d*(?:\.)?\d*\s*$/) && tvalue.match(/\d/)) {
        value = tvalue.replace(/\$/, "") - 0;
        type = "n$";
    } else if (tvalue.match(/^[-+]?(\d*,\d*)+(?:\.)?\d*$/)) {
        value = tvalue.replace(/,/g, "") - 0;
        type = "n";
    } else if (tvalue.match(/^[-+]?(\d*,\d*)+(?:\.)?\d*\s*%$/)) {
        value = (tvalue.replace(/[%,]/g, "") - 0) / 100;
        type = "n%";
    } else if (tvalue.match(/^[-+]?\$\s*(\d*,\d*)+(?:\.)?\d*$/) && tvalue.match(/\d/)) {
        value = tvalue.replace(/[\$,]/g, "") - 0;
        type = "n$";
    } else if (matches = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{1,4})\s*$/)) {
        year = matches[3] - 0;
        year = year < 1e3 ? year + 2e3 : year;
        value = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(year, matches[1] - 0, matches[2] - 0) - 2415019;
        type = "nd";
    } else if (matches = value.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s*$/)) {
        year = matches[1] - 0;
        year = year < 1e3 ? year + 2e3 : year;
        value = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(year, matches[2] - 0, matches[3] - 0) - 2415019;
        type = "nd";
    } else if (matches = value.match(/^(\d{1,2}):(\d{1,2})\s*$/)) {
        hour = matches[1] - 0;
        minute = matches[2] - 0;
        if (hour < 24 && minute < 60) {
            value = hour / 24 + minute / (24 * 60);
            type = "nt";
        }
    } else if (matches = value.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s*$/)) {
        hour = matches[1] - 0;
        minute = matches[2] - 0;
        second = matches[3] - 0;
        if (hour < 24 && minute < 60 && second < 60) {
            value = hour / 24 + minute / (24 * 60) + second / (24 * 60 * 60);
            type = "nt";
        }
    } else if (matches = value.match(/^\s*([-+]?\d+) (\d+)\/(\d+)\s*$/)) {
        intgr = matches[1] - 0;
        num = matches[2] - 0;
        denom = matches[3] - 0;
        if (denom && denom > 0) {
            value = intgr + (intgr < 0 ? -num / denom : num / denom);
            type = "n";
        }
    } else if (constr = SocialCalc.InputConstants[value.toUpperCase()]) {
        num = constr.indexOf(",");
        value = constr.substring(0, num) - 0;
        type = constr.substring(num + 1);
    } else if (tvalue.length > 7 && tvalue.substring(0, 7).toLowerCase() == "http://") {
        value = tvalue;
        type = "tl";
    } else if (tvalue.match(/<([A-Z][A-Z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/i)) {
        value = tvalue;
        type = "th";
    }
    return {
        value: value,
        type: type
    };
};

SocialCalc.InputConstants = {
    TRUE: "1,nl",
    FALSE: "0,nl",
    "#N/A": "0,e#N/A",
    "#NULL!": "0,e#NULL!",
    "#NUM!": "0,e#NUM!",
    "#DIV/0!": "0,e#DIV/0!",
    "#VALUE!": "0,e#VALUE!",
    "#REF!": "0,e#REF!",
    "#NAME?": "0,e#NAME?"
};

SocialCalc.default_expand_markup = function(displayvalue, sheetobj, linkstyle) {
    var result = displayvalue;
    result = SocialCalc.special_chars(result);
    result = result.replace(/  /g, "&nbsp; ");
    result = result.replace(/\n/g, "<br>");
    return result;
    result = result.replace(/('*)'''(.*?)'''/g, "$1<b>$2</b>");
    result = result.replace(/''(.*?)''/g, "<i>$1</i>");
    return result;
};

SocialCalc.expand_text_link = function(displayvalue, sheetobj, linkstyle, valueformat) {
    var desc, tb, str;
    var scc = SocialCalc.Constants;
    var url = "";
    var parts = SocialCalc.ParseCellLinkText(displayvalue + "");
    if (parts.desc) {
        desc = SocialCalc.special_chars(parts.desc);
    } else {
        desc = parts.pagename ? scc.defaultPageLinkFormatString : scc.defaultLinkFormatString;
    }
    if (displayvalue.length > 7 && displayvalue.substring(0, 7).toLowerCase() == "http://" && displayvalue.charAt(displayvalue.length - 1) != ">") {
        desc = desc.substring(7);
    }
    tb = parts.newwin || !linkstyle ? ' target="_blank"' : "";
    if (parts.pagename) {
        if (SocialCalc.Callbacks.MakePageLink) {
            url = SocialCalc.Callbacks.MakePageLink(parts.pagename, parts.workspacename, linkstyle, valueformat);
        }
    } else {
        url = encodeURI(parts.url);
    }
    str = '<a href="' + url + '"' + tb + ">" + desc + "</a>";
    return str;
};

SocialCalc.ParseCellLinkText = function(str) {
    var result = {
        url: "",
        desc: "",
        newwin: false,
        pagename: "",
        workspace: ""
    };
    var pageform = false;
    var urlend = str.length - 1;
    var descstart = 0;
    var lastlt = str.lastIndexOf("<");
    var lastbrkt = str.lastIndexOf("[");
    var lastbrace = str.lastIndexOf("{");
    var descend = -1;
    if ((str.charAt(urlend) != ">" || lastlt == -1) && (str.charAt(urlend) != "]" || lastbrkt == -1) && (str.charAt(urlend) != "}" || str.charAt(urlend - 1) != "]" || lastbrace == -1 || lastbrkt == -1 || lastbrkt < lastbrace)) {
        urlend++;
        descend = urlend;
    } else {
        if (str.charAt(urlend) == ">") {
            descend = lastlt - 1;
            if (lastlt > 0 && str.charAt(descend) == "<" && str.charAt(urlend - 1) == ">") {
                descend--;
                urlend--;
                result.newwin = true;
            }
        } else if (str.charAt(urlend) == "]") {
            descend = lastbrkt - 1;
            pageform = true;
            if (lastbrkt > 0 && str.charAt(descend) == "[" && str.charAt(urlend - 1) == "]") {
                descend--;
                urlend--;
                result.newwin = true;
            }
        } else if (str.charAt(urlend) == "}") {
            descend = lastbrace - 1;
            pageform = true;
            wsend = lastbrkt;
            urlend--;
            if (lastbrkt > 0 && str.charAt(lastbrkt - 1) == "[" && str.charAt(urlend - 1) == "]") {
                wsend = lastbrkt - 1;
                urlend--;
                result.newwin = true;
            }
            if (str.charAt(wsend - 1) == " ") {
                wsend--;
            }
            result.workspace = str.substring(lastbrace + 1, wsend) || "";
        }
        if (str.charAt(descend) == " ") {
            descend--;
        }
        if (str.charAt(descstart) == '"' && str.charAt(descend) == '"') {
            descstart++;
            descend--;
        }
    }
    if (pageform) {
        result.pagename = str.substring(lastbrkt + 1, urlend) || "";
    } else {
        result.url = str.substring(lastlt + 1, urlend) || "";
    }
    if (descend >= descstart) {
        result.desc = str.substring(descstart, descend + 1);
    }
    return result;
};

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
        throw "SocialCalc.ConvertSaveToOtherFormat: Not doing recalc.";
    }
    if (sheet.copiedfrom) {
        clipextents = SocialCalc.ParseRange(sheet.copiedfrom);
    } else {
        clipextents = {
            cr1: {
                row: 1,
                col: 1
            },
            cr2: {
                row: sheet.attribs.lastrow,
                col: sheet.attribs.lastcol
            }
        };
    }
    if (outputformat == "html") {
        context = new SocialCalc.RenderContext(sheet);
        if (sheet.copiedfrom) {
            context.rowpanes[0] = {
                first: clipextents.cr1.row,
                last: clipextents.cr2.row
            };
            context.colpanes[0] = {
                first: clipextents.cr1.col,
                last: clipextents.cr2.col
            };
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
            } else {
                str = cell.datavalue + "";
            }
            if (outputformat == "csv") {
                if (str.indexOf('"') != -1) {
                    str = str.replace(/"/g, '""');
                }
                if (/[, \n"]/.test(str)) {
                    str = '"' + str + '"';
                }
                if (col > clipextents.cr1.col) {
                    str = "," + str;
                }
            } else if (outputformat == "tab") {
                if (str.indexOf("\n") != -1) {
                    if (str.indexOf('"') != -1) {
                        str = str.replace(/"/g, '""');
                    }
                    str = '"' + str + '"';
                }
                if (col > clipextents.cr1.col) {
                    str = "	" + str;
                }
            }
            result += str;
        }
        result += "\n";
    }
    return result;
};

SocialCalc.ConvertOtherFormatToSave = function(inputstr, inputformat) {
    var sheet, context, lines, i, line, value, inquote, j, ch, values, row, col, cr, maxc;
    var result = "";
    var AddCell = function() {
        col++;
        if (col > maxc) maxc = col;
        cr = SocialCalc.crToCoord(col, row);
        SocialCalc.SetConvertedCell(sheet, cr, value);
        value = "";
    };
    if (inputformat == "scsave") {
        return inputstr;
    }
    sheet = new SocialCalc.Sheet();
    lines = inputstr.split(/\r\n|\n/);
    maxc = 0;
    if (inputformat == "csv") {
        row = 0;
        inquote = false;
        for (i = 0; i < lines.length; i++) {
            if (i == lines.length - 1 && lines[i] == "") {
                break;
            }
            if (inquote) {
                value += "\n";
            } else {
                value = "";
                row++;
                col = 0;
            }
            line = lines[i];
            for (j = 0; j < line.length; j++) {
                ch = line.charAt(j);
                if (ch == '"') {
                    if (inquote) {
                        if (j < line.length - 1 && line.charAt(j + 1) == '"') {
                            j++;
                            value += '"';
                        } else {
                            inquote = false;
                            if (j == line.length - 1) {
                                AddCell();
                            }
                        }
                    } else {
                        inquote = true;
                    }
                    continue;
                }
                if (ch == "," && !inquote) {
                    AddCell();
                } else {
                    value += ch;
                }
                if (j == line.length - 1 && !inquote) {
                    AddCell();
                }
            }
        }
        if (maxc > 0) {
            sheet.attribs.lastrow = row;
            sheet.attribs.lastcol = maxc;
            result = sheet.CreateSheetSave("A1:" + SocialCalc.crToCoord(maxc, row));
        }
    }
    if (inputformat == "tab") {
        row = 0;
        inquote = false;
        for (i = 0; i < lines.length; i++) {
            if (i == lines.length - 1 && lines[i] == "") {
                break;
            }
            if (inquote) {
                value += "\n";
            } else {
                value = "";
                row++;
                col = 0;
            }
            line = lines[i];
            for (j = 0; j < line.length; j++) {
                ch = line.charAt(j);
                if (ch == '"') {
                    if (inquote) {
                        if (j < line.length - 1) {
                            if (line.charAt(j + 1) == '"') {
                                j++;
                                value += '"';
                            } else if (line.charAt(j + 1) == "	") {
                                j++;
                                inquote = false;
                                AddCell();
                            }
                        } else {
                            inquote = false;
                            AddCell();
                        }
                        continue;
                    }
                    if (value == "") {
                        inquote = true;
                        continue;
                    }
                }
                if (ch == "	" && !inquote) {
                    AddCell();
                } else {
                    value += ch;
                }
                if (j == line.length - 1 && !inquote) {
                    AddCell();
                }
            }
        }
        if (maxc > 0) {
            sheet.attribs.lastrow = row;
            sheet.attribs.lastcol = maxc;
            result = sheet.CreateSheetSave("A1:" + SocialCalc.crToCoord(maxc, row));
        }
    }
    return result;
};

SocialCalc.SetConvertedCell = function(sheet, cr, rawvalue) {
    var cell, value;
    cell = sheet.GetAssuredCell(cr);
    value = SocialCalc.DetermineValueType(rawvalue);
    if (value.type == "n" && value.value == rawvalue) {
        cell.datatype = "v";
        cell.valuetype = "n";
        cell.datavalue = value.value;
    } else if (value.type.charAt(0) == "t") {
        cell.datatype = "t";
        cell.valuetype = value.type;
        cell.datavalue = value.value;
    } else {
        cell.datatype = "c";
        cell.valuetype = value.type;
        cell.datavalue = value.value;
        cell.formula = rawvalue;
    }
};

var SocialCalc;

if (!SocialCalc) {
    SocialCalc = {};
}

SocialCalc.TableEditor = function(context) {
    var scc = SocialCalc.Constants;
    this.context = context;
    this.toplevel = null;
    this.fullgrid = null;
    this.noEdit = false;
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
    this.timeout = null;
    this.busy = false;
    this.ensureecell = false;
    this.deferredCommands = [];
    this.gridposition = null;
    this.headposition = null;
    this.firstscrollingrow = null;
    this.firstscrollingrowtop = null;
    this.lastnonscrollingrow = null;
    this.lastvisiblerow = null;
    this.firstscrollingcol = null;
    this.firstscrollingcolleft = null;
    this.lastnonscrollingcol = null;
    this.lastvisiblecol = null;
    this.rowpositions = [];
    this.colpositions = [];
    this.rowheight = [];
    this.colwidth = [];
    this.ecell = null;
    this.state = "start";
    this.workingvalues = {};
    this.imageprefix = scc.defaultImagePrefix;
    this.idPrefix = scc.defaultTableEditorIDPrefix;
    this.pageUpDnAmount = scc.defaultPageUpDnAmount;
    this.recalcFunction = function(editor) {
        if (editor.context.sheetobj.RecalcSheet) {
            editor.context.sheetobj.RecalcSheet(SocialCalc.EditorSheetStatusCallback, editor);
        } else return null;
    };
    this.ctrlkeyFunction = function(editor, charname) {
        var ta, cell, position, cmd, sel, cliptext;
        switch (charname) {
          case "[ctrl-c]":
          case "[ctrl-x]":
            ta = editor.pasteTextarea;
            ta.value = "";
            cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
            if (cell) {
                position = SocialCalc.GetElementPosition(cell.element);
                ta.style.left = position.left - 1 + "px";
                ta.style.top = position.top - 1 + "px";
            }
            if (editor.range.hasrange) {
                sel = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
            } else {
                sel = editor.ecell.coord;
            }
            cliptext = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.CreateSheetSave(editor.context.sheetobj, sel), "tab");
            if (charname == "[ctrl-c]" || editor.noEdit || editor.ECellReadonly()) {
                cmd = "copy " + sel + " formulas";
            } else {
                cmd = "cut " + sel + " formulas";
            }
            editor.EditorScheduleSheetCommands(cmd, true, false);
            ta.style.display = "block";
            ta.value = cliptext;
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
            if (editor.noEdit || editor.ECellReadonly()) return true;
            ta = editor.pasteTextarea;
            ta.value = "";
            cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
            if (cell) {
                position = SocialCalc.GetElementPosition(cell.element);
                ta.style.left = position.left - 1 + "px";
                ta.style.top = position.top - 1 + "px";
            }
            ta.style.display = "block";
            ta.value = "";
            ta.focus();
            window.setTimeout(function() {
                var ta = editor.pasteTextarea;
                var value = ta.value;
                ta.blur();
                ta.style.display = "none";
                var cmd = "";
                var clipstr = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "tab");
                value = value.replace(/\r\n/g, "\n");
                if (value != clipstr && (value.length - clipstr.length != 1 || value.substring(0, value.length - 1) != clipstr)) {
                    cmd = "loadclipboard " + SocialCalc.encodeForSave(SocialCalc.ConvertOtherFormatToSave(value, "tab")) + "\n";
                }
                var cr;
                if (editor.range.hasrange) {
                    var clipsheet = new SocialCalc.Sheet();
                    clipsheet.ParseSheetSave(SocialCalc.Clipboard.clipboard);
                    var matches = clipsheet.copiedfrom.match(/(.+):(.+)/);
                    if (matches !== null && matches[1] === matches[2]) {
                        cr = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
                    } else {
                        cr = SocialCalc.crToCoord(editor.range.left, editor.range.top);
                    }
                } else {
                    cr = editor.ecell.coord;
                }
                cmd += "paste " + cr + " formulas";
                editor.EditorScheduleSheetCommands(cmd, true, false);
                SocialCalc.KeyboardFocus();
            }, 200);
            return true;

          case "[ctrl-z]":
            editor.EditorScheduleSheetCommands("undo", true, false);
            return false;

          case "[ctrl-s]":
            if (!SocialCalc.Constants.AllowCtrlS) break;
            window.setTimeout(function() {
                var sheet = editor.context.sheetobj;
                var cell = sheet.GetAssuredCell(editor.ecell.coord);
                var ntvf = cell.nontextvalueformat ? sheet.valueformats[cell.nontextvalueformat - 0] || "" : "";
                var newntvf = window.prompt("Advanced Feature:\n\nCustom Numeric Format or Command", ntvf);
                if (newntvf != null) {
                    if (newntvf.match(/^cmd:/)) {
                        cmd = newntvf.substring(4);
                    } else if (newntvf.match(/^edit:/)) {
                        cmd = newntvf.substring(5);
                        if (SocialCalc.CtrlSEditor) {
                            SocialCalc.CtrlSEditor(cmd);
                        }
                        return;
                    } else {
                        if (editor.range.hasrange) {
                            sel = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
                        } else {
                            sel = editor.ecell.coord;
                        }
                        cmd = "set " + sel + " nontextvalueformat " + newntvf;
                    }
                    editor.EditorScheduleSheetCommands(cmd, true, false);
                }
            }, 200);
            return false;

          default:
            break;
        }
        return true;
    };
    context.sheetobj.statuscallback = SocialCalc.EditorSheetStatusCallback;
    context.sheetobj.statuscallbackparams = this;
    this.StatusCallback = {};
    this.MoveECellCallback = {};
    this.RangeChangeCallback = {};
    this.SettingsCallbacks = {};
    this.ecell = {
        coord: "A1",
        row: 1,
        col: 1
    };
    context.highlights[this.ecell.coord] = "cursor";
    this.range = {
        hasrange: false
    };
    this.range2 = {
        hasrange: false
    };
};

SocialCalc.TableEditor.prototype.CreateTableEditor = function(width, height) {
    return SocialCalc.CreateTableEditor(this, width, height);
};

SocialCalc.TableEditor.prototype.ResizeTableEditor = function(width, height) {
    return SocialCalc.ResizeTableEditor(this, width, height);
};

SocialCalc.TableEditor.prototype.SaveEditorSettings = function() {
    return SocialCalc.SaveEditorSettings(this);
};

SocialCalc.TableEditor.prototype.LoadEditorSettings = function(str, flags) {
    return SocialCalc.LoadEditorSettings(this, str, flags);
};

SocialCalc.TableEditor.prototype.EditorRenderSheet = function() {
    SocialCalc.EditorRenderSheet(this);
};

SocialCalc.TableEditor.prototype.EditorScheduleSheetCommands = function(cmdstr, saveundo, ignorebusy) {
    SocialCalc.EditorScheduleSheetCommands(this, cmdstr, saveundo, ignorebusy);
};

SocialCalc.TableEditor.prototype.ScheduleSheetCommands = function(cmdstr, saveundo) {
    this.context.sheetobj.ScheduleSheetCommands(cmdstr, saveundo);
};

SocialCalc.TableEditor.prototype.SheetUndo = function() {
    this.context.sheetobj.SheetUndo();
};

SocialCalc.TableEditor.prototype.SheetRedo = function() {
    this.context.sheetobj.SheetRedo();
};

SocialCalc.TableEditor.prototype.EditorStepSet = function(status, arg) {
    SocialCalc.EditorStepSet(this, status, arg);
};

SocialCalc.TableEditor.prototype.GetStatuslineString = function(status, arg, params) {
    return SocialCalc.EditorGetStatuslineString(this, status, arg, params);
};

SocialCalc.TableEditor.prototype.EditorMouseRegister = function() {
    return SocialCalc.EditorMouseRegister(this);
};

SocialCalc.TableEditor.prototype.EditorMouseUnregister = function() {
    return SocialCalc.EditorMouseUnregister(this);
};

SocialCalc.TableEditor.prototype.EditorMouseRange = function(coord) {
    return SocialCalc.EditorMouseRange(this, coord);
};

SocialCalc.TableEditor.prototype.EditorProcessKey = function(ch, e) {
    return SocialCalc.EditorProcessKey(this, ch, e);
};

SocialCalc.TableEditor.prototype.EditorAddToInput = function(str, prefix) {
    return SocialCalc.EditorAddToInput(this, str, prefix);
};

SocialCalc.TableEditor.prototype.DisplayCellContents = function() {
    return SocialCalc.EditorDisplayCellContents(this);
};

SocialCalc.TableEditor.prototype.EditorSaveEdit = function(text) {
    return SocialCalc.EditorSaveEdit(this, text);
};

SocialCalc.TableEditor.prototype.EditorApplySetCommandsToRange = function(cmdline, type) {
    return SocialCalc.EditorApplySetCommandsToRange(this, cmdline, type);
};

SocialCalc.TableEditor.prototype.MoveECellWithKey = function(ch) {
    return SocialCalc.MoveECellWithKey(this, ch);
};

SocialCalc.TableEditor.prototype.MoveECell = function(newcell) {
    return SocialCalc.MoveECell(this, newcell);
};

SocialCalc.TableEditor.prototype.ReplaceCell = function(cell, row, col) {
    SocialCalc.ReplaceCell(this, cell, row, col);
};

SocialCalc.TableEditor.prototype.UpdateCellCSS = function(cell, row, col) {
    SocialCalc.UpdateCellCSS(this, cell, row, col);
};

SocialCalc.TableEditor.prototype.SetECellHeaders = function(selected) {
    SocialCalc.SetECellHeaders(this, selected);
};

SocialCalc.TableEditor.prototype.EnsureECellVisible = function() {
    SocialCalc.EnsureECellVisible(this);
};

SocialCalc.TableEditor.prototype.ECellReadonly = function(coord) {
    return SocialCalc.ECellReadonly(this, coord);
};

SocialCalc.TableEditor.prototype.RangeAnchor = function(coord) {
    SocialCalc.RangeAnchor(this, coord);
};

SocialCalc.TableEditor.prototype.RangeExtend = function(coord) {
    SocialCalc.RangeExtend(this, coord);
};

SocialCalc.TableEditor.prototype.RangeRemove = function() {
    SocialCalc.RangeRemove(this);
};

SocialCalc.TableEditor.prototype.Range2Remove = function() {
    SocialCalc.Range2Remove(this);
};

SocialCalc.TableEditor.prototype.FitToEditTable = function() {
    SocialCalc.FitToEditTable(this);
};

SocialCalc.TableEditor.prototype.CalculateEditorPositions = function() {
    SocialCalc.CalculateEditorPositions(this);
};

SocialCalc.TableEditor.prototype.ScheduleRender = function() {
    SocialCalc.ScheduleRender(this);
};

SocialCalc.TableEditor.prototype.DoRenderStep = function() {
    SocialCalc.DoRenderStep(this);
};

SocialCalc.TableEditor.prototype.SchedulePositionCalculations = function() {
    SocialCalc.SchedulePositionCalculations(this);
};

SocialCalc.TableEditor.prototype.DoPositionCalculations = function() {
    SocialCalc.DoPositionCalculations(this);
};

SocialCalc.TableEditor.prototype.CalculateRowPositions = function(panenum, positions, sizes) {
    return SocialCalc.CalculateRowPositions(this, panenum, positions, sizes);
};

SocialCalc.TableEditor.prototype.CalculateColPositions = function(panenum, positions, sizes) {
    return SocialCalc.CalculateColPositions(this, panenum, positions, sizes);
};

SocialCalc.TableEditor.prototype.ScrollRelative = function(vertical, amount) {
    SocialCalc.ScrollRelative(this, vertical, amount);
};

SocialCalc.TableEditor.prototype.ScrollRelativeBoth = function(vamount, hamount) {
    SocialCalc.ScrollRelativeBoth(this, vamount, hamount);
};

SocialCalc.TableEditor.prototype.PageRelative = function(vertical, direction) {
    SocialCalc.PageRelative(this, vertical, direction);
};

SocialCalc.TableEditor.prototype.LimitLastPanes = function() {
    SocialCalc.LimitLastPanes(this);
};

SocialCalc.TableEditor.prototype.ScrollTableUpOneRow = function() {
    return SocialCalc.ScrollTableUpOneRow(this);
};

SocialCalc.TableEditor.prototype.ScrollTableDownOneRow = function() {
    return SocialCalc.ScrollTableDownOneRow(this);
};

SocialCalc.TableEditor.prototype.ScrollTableLeftOneCol = function() {
    return SocialCalc.ScrollTableLeftOneCol(this);
};

SocialCalc.TableEditor.prototype.ScrollTableRightOneCol = function() {
    return SocialCalc.ScrollTableRightOneCol(this);
};

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
    editor.griddiv.style.width = editor.tablewidth + "px";
    editor.griddiv.style.height = editor.tableheight + "px";
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
    td = document.createElement("td");
    td.style.background = "url(" + editor.imageprefix + "logo.gif) no-repeat center center";
    td.innerHTML = "<div style='cursor:pointer;font-size:1px;'><img src='" + editor.imageprefix + "1x1.gif' border='0' width='18' height='18'></div>";
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
    ta = document.createElement("textarea");
    SocialCalc.setStyles(ta, "display:none;position:absolute;height:1px;width:1px;opacity:0;filter:alpha(opacity=0);");
    ta.value = "";
    editor.pasteTextarea = ta;
    AssignID(editor, editor.pasteTextarea, "pastetextarea");
    if (navigator.userAgent.match(/Safari\//) && !navigator.userAgent.match(/Chrome\//)) {
        window.removeEventListener("beforepaste", SocialCalc.SafariPasteFunction, false);
        window.addEventListener("beforepaste", SocialCalc.SafariPasteFunction, false);
        window.removeEventListener("beforecopy", SocialCalc.SafariPasteFunction, false);
        window.addEventListener("beforecopy", SocialCalc.SafariPasteFunction, false);
        window.removeEventListener("beforecut", SocialCalc.SafariPasteFunction, false);
        window.addEventListener("beforecut", SocialCalc.SafariPasteFunction, false);
    }
    editor.toplevel.appendChild(editor.pasteTextarea);
    SocialCalc.MouseWheelRegister(editor.toplevel, {
        WheelMove: SocialCalc.EditorProcessMouseWheel,
        editor: editor
    });
    SocialCalc.KeyboardSetFocus(editor);
    SocialCalc.EditorSheetStatusCallback(null, "startup", null, editor);
    return editor.toplevel;
};

SocialCalc.SafariPasteFunction = function(e) {
    e.preventDefault();
};

SocialCalc.ResizeTableEditor = function(editor, width, height) {
    var scc = SocialCalc.Constants;
    editor.width = width;
    editor.height = height;
    editor.toplevel.style.width = width + "px";
    editor.toplevel.style.height = height + "px";
    editor.tablewidth = Math.max(0, width - scc.defaultTableControlThickness);
    editor.tableheight = Math.max(0, height - scc.defaultTableControlThickness);
    editor.griddiv.style.width = editor.tablewidth + "px";
    editor.griddiv.style.height = editor.tableheight + "px";
    editor.verticaltablecontrol.main.style.height = editor.tableheight + "px";
    editor.horizontaltablecontrol.main.style.width = editor.tablewidth + "px";
    editor.FitToEditTable();
    editor.ScheduleRender();
    return;
};

SocialCalc.SaveEditorSettings = function(editor) {
    var i, setting;
    var context = editor.context;
    var range = editor.range;
    var result = "";
    result += "version:1.0\n";
    for (i = 0; i < context.rowpanes.length; i++) {
        result += "rowpane:" + i + ":" + context.rowpanes[i].first + ":" + context.rowpanes[i].last + "\n";
    }
    for (i = 0; i < context.colpanes.length; i++) {
        result += "colpane:" + i + ":" + context.colpanes[i].first + ":" + context.colpanes[i].last + "\n";
    }
    if (editor.ecell) {
        result += "ecell:" + editor.ecell.coord + "\n";
    }
    if (range.hasrange) {
        result += "range:" + range.anchorcoord + ":" + range.top + ":" + range.bottom + ":" + range.left + ":" + range.right + "\n";
    }
    for (setting in editor.SettingsCallbacks) {
        result += editor.SettingsCallbacks[setting].save(editor, setting);
    }
    return result;
};

SocialCalc.LoadEditorSettings = function(editor, str, flags) {
    var lines = str.split(/\r\n|\n/);
    var parts = [];
    var line, i, cr, row, col, coord, setting;
    var context = editor.context;
    var highlights, range;
    context.rowpanes = [ {
        first: 1,
        last: 1
    } ];
    context.colpanes = [ {
        first: 1,
        last: 1
    } ];
    editor.ecell = null;
    editor.range = {
        hasrange: false
    };
    editor.range2 = {
        hasrange: false
    };
    range = editor.range;
    context.highlights = {};
    highlights = context.highlights;
    for (i = 0; i < lines.length; i++) {
        line = lines[i];
        parts = line.split(":");
        setting = parts[0];
        switch (setting) {
          case "version":
            break;

          case "rowpane":
            context.rowpanes[parts[1] - 0] = {
                first: parts[2] - 0,
                last: parts[3] - 0
            };
            break;

          case "colpane":
            context.colpanes[parts[1] - 0] = {
                first: parts[2] - 0,
                last: parts[3] - 0
            };
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
            range.top = parts[2] - 0;
            range.bottom = parts[3] - 0;
            range.left = parts[4] - 0;
            range.right = parts[5] - 0;
            for (row = range.top; row <= range.bottom; row++) {
                for (col = range.left; col <= range.right; col++) {
                    coord = SocialCalc.crToCoord(col, row);
                    if (highlights[coord] != "cursor") {
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
};

SocialCalc.EditorRenderSheet = function(editor) {
    editor.EditorMouseUnregister();
    editor.fullgrid = editor.context.RenderSheet(editor.fullgrid);
    if (editor.ecell) editor.SetECellHeaders("selected");
    SocialCalc.AssignID(editor, editor.fullgrid, "fullgrid");
    editor.EditorMouseRegister();
};

SocialCalc.EditorScheduleSheetCommands = function(editor, cmdstr, saveundo, ignorebusy) {
    if (editor.state != "start" && !ignorebusy) {
        return;
    }
    if (editor.busy && !ignorebusy) {
        editor.deferredCommands.push({
            cmdstr: cmdstr,
            saveundo: saveundo
        });
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
};

SocialCalc.EditorSheetStatusCallback = function(recalcdata, status, arg, editor) {
    var f, cell, dcmd;
    var sheetobj = editor.context.sheetobj;
    var signalstatus = function(s) {
        for (f in editor.StatusCallback) {
            if (editor.StatusCallback[f].func) {
                editor.StatusCallback[f].func(editor, s, arg, editor.StatusCallback[f].params);
            }
        }
    };
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
        if (sheetobj.attribs.needsrecalc && (sheetobj.attribs.recalc != "off" || sheetobj.recalconce) && editor.recalcFunction) {
            editor.FitToEditTable();
            sheetobj.renderneeded = false;
            if (sheetobj.recalconce) delete sheetobj.recalconce;
            editor.recalcFunction(editor);
        } else {
            if (sheetobj.renderneeded) {
                editor.FitToEditTable();
                sheetobj.renderneeded = false;
                editor.ScheduleRender();
            } else {
                editor.SchedulePositionCalculations();
            }
        }
        if (sheetobj.hiddencolrow == "col") {
            var col = editor.ecell.col;
            while (sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == "yes") {
                col++;
            }
            var coord = SocialCalc.crToCoord(col, editor.ecell.row);
            editor.MoveECell(coord);
            sheetobj.hiddencolrow = "";
        }
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
        editor.busy = true;
        break;

      case "renderdone":
        break;

      case "schedposcalc":
        editor.busy = true;
        break;

      case "doneposcalc":
        if (editor.deferredCommands.length) {
            signalstatus(status);
            dcmd = editor.deferredCommands.shift();
            editor.EditorScheduleSheetCommands(dcmd.cmdstr, dcmd.saveundo, true);
        } else {
            editor.busy = false;
            signalstatus(status);
            if (editor.state == "start") editor.DisplayCellContents();
        }
        return;

      default:
        addmsg("Unknown status: " + status);
        break;
    }
    signalstatus(status);
    return;
};

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
        progress = "Command Extension: " + arg;
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
        progress = scc.s_statusline_ordering + Math.floor(100 * arg.count / (arg.total || 1)) + "%";
        break;

      case "calcstep":
        progress = scc.s_statusline_calculating + Math.floor(100 * arg.count / (arg.total || 1)) + "%";
        break;

      case "calcloading":
        progress = scc.s_statusline_calculatingls + ": " + arg.sheetname;
        break;

      case "calcserverfunc":
        progress = scc.s_statusline_calculating + Math.floor(100 * arg.count / (arg.total || 1)) + "%, " + scc.s_statusline_doingserverfunc + arg.funcname + scc.s_statusline_incell + arg.coord;
        break;

      case "calcstart":
        params.calculating = true;
        document.body.style.cursor = "progress";
        editor.griddiv.style.cursor = "progress";
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
    if (!params.calculating && !params.command && !progress && editor.range.hasrange && (editor.range.left != editor.range.right || editor.range.top != editor.range.bottom)) {
        sum = 0;
        for (r = editor.range.top; r <= editor.range.bottom; r++) {
            for (c = editor.range.left; c <= editor.range.right; c++) {
                cell = editor.context.sheetobj.cells[SocialCalc.crToCoord(c, r)];
                if (!cell) continue;
                if (cell.valuetype && cell.valuetype.charAt(0) == "n") {
                    sum += cell.datavalue - 0;
                }
            }
        }
        sum = SocialCalc.FormatNumber.formatNumberWithFormat(sum, "[,]General", "");
        coord = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
        progress = coord + " (" + (editor.range.right - editor.range.left + 1) + "x" + (editor.range.bottom - editor.range.top + 1) + ") " + scc.s_statusline_sum + "=" + sum + " " + progress;
    }
    sstr = (editor.ecell || {}).coord + " &nbsp; " + progress;
    if (!params.calculating && editor.context.sheetobj.attribs.needsrecalc == "yes") {
        sstr += " &nbsp; " + scc.s_statusline_recalcneeded;
    }
    circ = editor.context.sheetobj.attribs.circularreferencecell;
    if (circ) {
        circ = circ.replace(/\|/, " referenced by ");
        sstr += " &nbsp; " + scc.s_statusline_circref + circ + "</span>";
    }
    return sstr;
};

SocialCalc.EditorMouseInfo = {
    registeredElements: [],
    editor: null,
    element: null,
    ignore: false,
    mousedowncoord: "",
    mouselastcoord: "",
    mouseresizecol: "",
    mouseresizeclientx: null,
    mouseresizedisplay: null
};

SocialCalc.EditorMouseRegister = function(editor) {
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var element = editor.fullgrid;
    var i;
    for (i = 0; i < mouseinfo.registeredElements.length; i++) {
        if (mouseinfo.registeredElements[i].editor == editor) {
            if (mouseinfo.registeredElements[i].element == element) {
                return;
            }
            break;
        }
    }
    if (i < mouseinfo.registeredElements.length) {
        mouseinfo.registeredElements[i].element = element;
    } else {
        mouseinfo.registeredElements.push({
            element: element,
            editor: editor
        });
    }
    if (element.addEventListener) {
        element.addEventListener("mousedown", SocialCalc.ProcessEditorMouseDown, false);
        element.addEventListener("dblclick", SocialCalc.ProcessEditorDblClick, false);
    } else if (element.attachEvent) {
        element.attachEvent("onmousedown", SocialCalc.ProcessEditorMouseDown);
        element.attachEvent("ondblclick", SocialCalc.ProcessEditorDblClick);
    } else {
        throw "Browser not supported";
    }
    mouseinfo.ignore = false;
    return;
};

SocialCalc.EditorMouseUnregister = function(editor) {
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var element = editor.fullgrid;
    var i, oldelement;
    for (i = 0; i < mouseinfo.registeredElements.length; i++) {
        if (mouseinfo.registeredElements[i].editor == editor) {
            break;
        }
    }
    if (i < mouseinfo.registeredElements.length) {
        oldelement = mouseinfo.registeredElements[i].element;
        if (oldelement.removeEventListener) {
            oldelement.removeEventListener("mousedown", SocialCalc.ProcessEditorMouseDown, false);
            oldelement.removeEventListener("dblclick", SocialCalc.ProcessEditorDblClick, false);
        } else if (oldelement.detachEvent) {
            oldelement.detachEvent("onmousedown", SocialCalc.ProcessEditorMouseDown);
            oldelement.detachEvent("ondblclick", SocialCalc.ProcessEditorDblClick);
        }
        mouseinfo.registeredElements.splice(i, 1);
    }
    return;
};

SocialCalc.ProcessEditorMouseDown = function(e) {
    var editor, result, coord, textarea, wval, range;
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var ele = event.target || event.srcElement;
    var mobj;
    if (mouseinfo.ignore) return;
    for (mobj = null; !mobj && ele; ele = ele.parentNode) {
        mobj = SocialCalc.LookupElement(ele, mouseinfo.registeredElements);
    }
    if (!mobj) {
        mouseinfo.editor = null;
        return;
    }
    editor = mobj.editor;
    mouseinfo.element = ele;
    range = editor.range;
    var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
    var clientX = event.clientX - pos.left;
    var clientY = event.clientY - pos.top;
    result = SocialCalc.GridMousePosition(editor, clientX, clientY);
    if (!result) return;
    mouseinfo.editor = editor;
    if (result.rowheader && result.rowtoresize) {
        SocialCalc.ProcessEditorRowsizeMouseDown(e, ele, result);
        return;
    }
    if (result.colheader && result.coltoresize) {
        SocialCalc.ProcessEditorColsizeMouseDown(e, ele, result);
        return;
    }
    if (!result.coord) return;
    if (!range.hasrange) {
        if (e.shiftKey) editor.RangeAnchor();
    }
    coord = editor.MoveECell(result.coord);
    if (range.hasrange) {
        if (e.shiftKey) editor.RangeExtend(); else editor.RangeRemove();
    }
    mouseinfo.mousedowncoord = coord;
    mouseinfo.mouselastcoord = coord;
    editor.EditorMouseRange(coord);
    SocialCalc.KeyboardSetFocus(editor);
    if (editor.state != "start" && editor.inputBox) editor.inputBox.element.focus();
    if (document.addEventListener) {
        document.addEventListener("mousemove", SocialCalc.ProcessEditorMouseMove, true);
        document.addEventListener("mouseup", SocialCalc.ProcessEditorMouseUp, true);
    } else if (ele.attachEvent) {
        ele.setCapture();
        ele.attachEvent("onmousemove", SocialCalc.ProcessEditorMouseMove);
        ele.attachEvent("onmouseup", SocialCalc.ProcessEditorMouseUp);
        ele.attachEvent("onlosecapture", SocialCalc.ProcessEditorMouseUp);
    }
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    return;
};

SocialCalc.EditorMouseRange = function(editor, coord) {
    var inputtext, wval;
    var range = editor.range;
    switch (editor.state) {
      case "input":
        inputtext = editor.inputBox.GetText();
        wval = editor.workingvalues;
        if ("(+-*/,:!&<>=^".indexOf(inputtext.slice(-1)) >= 0 && inputtext.slice(0, 1) == "=" || inputtext == "=") {
            wval.partialexpr = inputtext;
        }
        if (wval.partialexpr) {
            if (coord) {
                if (range.hasrange) {
                    editor.inputBox.SetText(wval.partialexpr + SocialCalc.crToCoord(range.left, range.top) + ":" + SocialCalc.crToCoord(range.right, range.bottom));
                } else {
                    editor.inputBox.SetText(wval.partialexpr + coord);
                }
            }
        } else {
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
};

SocialCalc.ProcessEditorMouseMove = function(e) {
    var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval;
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    editor = mouseinfo.editor;
    if (!editor) return;
    if (mouseinfo.ignore) return;
    element = mouseinfo.element;
    var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
    var clientX = event.clientX - pos.left;
    var clientY = event.clientY - pos.top;
    result = SocialCalc.GridMousePosition(editor, clientX, clientY);
    if (!result) return;
    if (result && !result.coord) {
        SocialCalc.SetDragAutoRepeat(editor, result);
        return;
    }
    SocialCalc.SetDragAutoRepeat(editor, null);
    if (!result.coord) return;
    if (result.coord != mouseinfo.mouselastcoord) {
        if (!e.shiftKey && !editor.range.hasrange) {
            editor.RangeAnchor(mouseinfo.mousedowncoord);
        }
        editor.MoveECell(result.coord);
        editor.RangeExtend();
    }
    mouseinfo.mouselastcoord = result.coord;
    editor.EditorMouseRange(result.coord);
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    return;
};

SocialCalc.ProcessEditorMouseUp = function(e) {
    var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval;
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    editor = mouseinfo.editor;
    if (!editor) return;
    if (mouseinfo.ignore) return;
    element = mouseinfo.element;
    var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
    var clientX = event.clientX - pos.left;
    var clientY = event.clientY - pos.top;
    result = SocialCalc.GridMousePosition(editor, clientX, clientY);
    SocialCalc.SetDragAutoRepeat(editor, null);
    if (!result) return;
    if (!result.coord) result.coord = editor.ecell.coord;
    if (editor.range.hasrange) {
        editor.MoveECell(result.coord);
        editor.RangeExtend();
    } else if (result.coord && result.coord != mouseinfo.mousedowncoord) {
        editor.RangeAnchor(mouseinfo.mousedowncoord);
        editor.MoveECell(result.coord);
        editor.RangeExtend();
    }
    editor.EditorMouseRange(result.coord);
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    if (document.removeEventListener) {
        document.removeEventListener("mousemove", SocialCalc.ProcessEditorMouseMove, true);
        document.removeEventListener("mouseup", SocialCalc.ProcessEditorMouseUp, true);
    } else if (element.detachEvent) {
        element.detachEvent("onlosecapture", SocialCalc.ProcessEditorMouseUp);
        element.detachEvent("onmouseup", SocialCalc.ProcessEditorMouseUp);
        element.detachEvent("onmousemove", SocialCalc.ProcessEditorMouseMove);
        element.releaseCapture();
    }
    mouseinfo.editor = null;
    return false;
};

SocialCalc.ProcessEditorColsizeMouseDown = function(e, ele, result) {
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var editor = mouseinfo.editor;
    var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
    var clientX = event.clientX - pos.left;
    mouseinfo.mouseresizecolnum = result.coltoresize;
    mouseinfo.mouseresizecol = SocialCalc.rcColname(result.coltoresize);
    mouseinfo.mousedownclientx = clientX;
    mouseinfo.mousecoltounhide = result.coltounhide;
    if (!mouseinfo.mousecoltounhide) {
        var sizedisplay = document.createElement("div");
        mouseinfo.mouseresizedisplay = sizedisplay;
        sizedisplay.style.width = "auto";
        sizedisplay.style.position = "absolute";
        sizedisplay.style.zIndex = 100;
        sizedisplay.style.top = editor.headposition.top + "px";
        sizedisplay.style.left = editor.colpositions[result.coltoresize] + "px";
        sizedisplay.innerHTML = '<table cellpadding="0" cellspacing="0"><tr><td style="height:100px;' + "border:1px dashed black;background-color:white;width:" + (editor.context.colwidth[mouseinfo.mouseresizecolnum] - 2) + 'px;">&nbsp;</td>' + '<td><div style="font-size:small;color:white;background-color:gray;padding:4px;">' + editor.context.colwidth[mouseinfo.mouseresizecolnum] + "</div></td></tr></table>";
        SocialCalc.setStyles(sizedisplay.firstChild.lastChild.firstChild.childNodes[0], "filter:alpha(opacity=85);opacity:.85;");
        editor.toplevel.appendChild(sizedisplay);
    }
    if (document.addEventListener) {
        document.addEventListener("mousemove", SocialCalc.ProcessEditorColsizeMouseMove, true);
        document.addEventListener("mouseup", SocialCalc.ProcessEditorColsizeMouseUp, true);
    } else if (editor.toplevel.attachEvent) {
        editor.toplevel.setCapture();
        editor.toplevel.attachEvent("onmousemove", SocialCalc.ProcessEditorColsizeMouseMove);
        editor.toplevel.attachEvent("onmouseup", SocialCalc.ProcessEditorColsizeMouseUp);
        editor.toplevel.attachEvent("onlosecapture", SocialCalc.ProcessEditorColsizeMouseUp);
    }
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    return;
};

SocialCalc.ProcessEditorColsizeMouseMove = function(e) {
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var editor = mouseinfo.editor;
    if (!editor) return;
    if (!mouseinfo.mousecoltounhide) {
        var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
        var clientX = event.clientX - pos.left;
        var newsize = editor.context.colwidth[mouseinfo.mouseresizecolnum] - 0 + (clientX - mouseinfo.mousedownclientx);
        if (newsize < SocialCalc.Constants.defaultMinimumColWidth) newsize = SocialCalc.Constants.defaultMinimumColWidth;
        var sizedisplay = mouseinfo.mouseresizedisplay;
        sizedisplay.innerHTML = '<table cellpadding="0" cellspacing="0"><tr><td style="height:100px;' + "border:1px dashed black;background-color:white;width:" + (newsize - 2) + 'px;">&nbsp;</td>' + '<td><div style="font-size:small;color:white;background-color:gray;padding:4px;">' + newsize + "</div></td></tr></table>";
        SocialCalc.setStyles(sizedisplay.firstChild.lastChild.firstChild.childNodes[0], "filter:alpha(opacity=85);opacity:.85;");
    }
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    return;
};

SocialCalc.ProcessEditorColsizeMouseUp = function(e) {
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var editor = mouseinfo.editor;
    if (!editor) return;
    element = mouseinfo.element;
    var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
    var clientX = event.clientX - pos.left;
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    if (document.removeEventListener) {
        document.removeEventListener("mousemove", SocialCalc.ProcessEditorColsizeMouseMove, true);
        document.removeEventListener("mouseup", SocialCalc.ProcessEditorColsizeMouseUp, true);
    } else if (editor.toplevel.detachEvent) {
        editor.toplevel.detachEvent("onlosecapture", SocialCalc.ProcessEditorColsizeMouseUp);
        editor.toplevel.detachEvent("onmouseup", SocialCalc.ProcessEditorColsizeMouseUp);
        editor.toplevel.detachEvent("onmousemove", SocialCalc.ProcessEditorColsizeMouseMove);
        editor.toplevel.releaseCapture();
    }
    if (mouseinfo.mousecoltounhide) {
        editor.EditorScheduleSheetCommands("set " + SocialCalc.rcColname(mouseinfo.mousecoltounhide) + " hide", true, false);
    } else {
        var newsize = editor.context.colwidth[mouseinfo.mouseresizecolnum] - 0 + (clientX - mouseinfo.mousedownclientx);
        if (newsize < SocialCalc.Constants.defaultMinimumColWidth) newsize = SocialCalc.Constants.defaultMinimumColWidth;
        editor.EditorScheduleSheetCommands("set " + mouseinfo.mouseresizecol + " width " + newsize, true, false);
        if (editor.timeout) window.clearTimeout(editor.timeout);
        editor.timeout = window.setTimeout(SocialCalc.FinishColRowSize, 1);
    }
    return false;
};

SocialCalc.FinishColRowSize = function() {
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var editor = mouseinfo.editor;
    if (!editor) return;
    editor.toplevel.removeChild(mouseinfo.mouseresizedisplay);
    mouseinfo.mouseresizedisplay = null;
    mouseinfo.editor = null;
    return;
};

SocialCalc.ProcessEditorRowsizeMouseDown = function(e, ele, result) {
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var editor = mouseinfo.editor;
    var pos = SocialCalc.GetSpreadsheetControlObject().spreadsheetDiv.firstChild.offsetHeight;
    var clientY = event.clientY - pos;
    mouseinfo.mouseresizerownum = result.rowtoresize;
    mouseinfo.mouseresizerow = result.rowtoresize;
    mouseinfo.mousedownclienty = clientY;
    mouseinfo.mouserowtounhide = result.rowtounhide;
    if (!mouseinfo.mouserowtounhide) {
        var sizedisplay = document.createElement("div");
        mouseinfo.mouseresizedisplay = sizedisplay;
        sizedisplay.style.width = editor.context.totalwidth + "px";
        sizedisplay.style.height = editor.rowpositions[result.rowtoresize] + "px";
        sizedisplay.style.position = "absolute";
        sizedisplay.style.zIndex = 100;
        sizedisplay.style.top = editor.rowpositions[result.rowtoresize] + "px";
        sizedisplay.style.left = editor.headposition.left + "px";
        sizedisplay.innerHTML = '<table cellpadding="0" cellspacing="0"><tr><td style="width:100px' + "border:1px dashed black;background-color:white;height:" + (editor.context.rowheight[mouseinfo.mouseresizerownum] - 2) + 'px;">&nbsp;</td>' + '<td><div style="font-size:small;color:white;background-color:gray;padding:4px;">' + editor.context.rowheight[mouseinfo.mouseresizerownum] + "</div></td></tr></table>";
        SocialCalc.setStyles(sizedisplay.firstChild.lastChild.firstChild.childNodes[0], "filter:alpha(opacity=85);opacity:.5;");
        editor.toplevel.appendChild(sizedisplay);
    }
    if (document.addEventListener) {
        document.addEventListener("mousemove", SocialCalc.ProcessEditorRowsizeMouseMove, true);
        document.addEventListener("mouseup", SocialCalc.ProcessEditorRowsizeMouseUp, true);
    } else if (editor.toplevel.attachEvent) {
        editor.toplevel.setCapture();
        editor.toplevel.attachEvent("onmousemove", SocialCalc.ProcessEditorRowsizeMouseMove);
        editor.toplevel.attachEvent("onmouseup", SocialCalc.ProcessEditorRowsizeMouseUp);
        editor.toplevel.attachEvent("onlosecapture", SocialCalc.ProcessEditorRowsizeMouseUp);
    }
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    return;
};

SocialCalc.ProcessEditorRowsizeMouseMove = function(e) {
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var editor = mouseinfo.editor;
    if (!editor) return;
    if (!mouseinfo.mouserowtounhide) {
        var pos = SocialCalc.GetSpreadsheetControlObject().spreadsheetDiv.firstChild.offsetHeight;
        var clientY = event.clientY - pos;
        var newsize = editor.context.rowheight[mouseinfo.mouseresizerownum] - 0 + (clientY - mouseinfo.mousedownclienty);
        if (newsize < SocialCalc.Constants.defaultAssumedRowHeight) newsize = SocialCalc.Constants.defaultAssumedRowHeight;
        var sizedisplay = mouseinfo.mouseresizedisplay;
        sizedisplay.innerHTML = '<table cellpadding="0" cellspacing="0"><tr><td style="width:100px;' + "border:1px dashed black;background-color:white;height:" + (newsize - 2) + 'px;">&nbsp;</td>' + '<td><div style="font-size:small;color:white;background-color:gray;padding:4px;">' + newsize + "</div></td></tr></table>";
        SocialCalc.setStyles(sizedisplay.firstChild.lastChild.firstChild.childNodes[0], "filter:alpha(opacity=85);opacity:.5;");
    }
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    return;
};

SocialCalc.ProcessEditorRowsizeMouseUp = function(e) {
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var editor = mouseinfo.editor;
    if (!editor) return;
    element = mouseinfo.element;
    var pos = SocialCalc.GetSpreadsheetControlObject().spreadsheetDiv.firstChild.offsetHeight;
    var clientY = event.clientY - pos;
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    if (document.removeEventListener) {
        document.removeEventListener("mousemove", SocialCalc.ProcessEditorRowsizeMouseMove, true);
        document.removeEventListener("mouseup", SocialCalc.ProcessEditorRowsizeMouseUp, true);
    } else if (editor.toplevel.detachEvent) {
        editor.toplevel.detachEvent("onlosecapture", SocialCalc.ProcessEditorRowsizeMouseUp);
        editor.toplevel.detachEvent("onmouseup", SocialCalc.ProcessEditorRowsizeMouseUp);
        editor.toplevel.detachEvent("onmousemove", SocialCalc.ProcessEditorRowsizeMouseMove);
        editor.toplevel.releaseCapture();
    }
    if (mouseinfo.mouserowtounhide) {
        editor.EditorScheduleSheetCommands("set " + mouseinfo.mouserowtounhide + " hide", true, false);
    } else {
        var newsize = editor.context.rowheight[mouseinfo.mouseresizerownum] - 0 + (clientY - mouseinfo.mousedownclienty);
        if (newsize < SocialCalc.Constants.defaultAssumedRowHeight) newsize = SocialCalc.Constants.defaultAssumedRowHeight;
        editor.EditorScheduleSheetCommands("set " + mouseinfo.mouseresizerownum + " height " + newsize, true, false);
        if (editor.timeout) window.clearTimeout(editor.timeout);
        editor.timeout = window.setTimeout(SocialCalc.FinishColRowSize, 1);
    }
    return false;
};

SocialCalc.AutoRepeatInfo = {
    timer: null,
    mouseinfo: null,
    repeatinterval: 1e3,
    editor: null,
    repeatcallback: null
};

SocialCalc.SetDragAutoRepeat = function(editor, mouseinfo, callback) {
    var repeatinfo = SocialCalc.AutoRepeatInfo;
    var coord, direction;
    repeatinfo.repeatcallback = callback;
    if (!mouseinfo) {
        if (repeatinfo.timer) {
            window.clearTimeout(repeatinfo.timer);
            repeatinfo.timer = null;
        }
        repeatinfo.mouseinfo = null;
        return;
    }
    repeatinfo.editor = editor;
    if (repeatinfo.mouseinfo) {
        if (mouseinfo.rowheader || mouseinfo.rowfooter) {
            if (mouseinfo.row != repeatinfo.mouseinfo.row) {
                coord = SocialCalc.crToCoord(editor.ecell.col, mouseinfo.row);
                if (repeatinfo.repeatcallback) {
                    if (mouseinfo.row < repeatinfo.mouseinfo.row) {
                        direction = "left";
                    } else if (mouseinfo.row > repeatinfo.mouseinfo.row) {
                        direction = "right";
                    } else {
                        direction = "";
                    }
                    repeatinfo.repeatcallback(coord, direction);
                } else {
                    editor.MoveECell(coord);
                    editor.MoveECell(coord);
                    editor.RangeExtend();
                    editor.EditorMouseRange(coord);
                }
            }
        } else if (mouseinfo.colheader || mouseinfo.colfooter) {
            if (mouseinfo.col != repeatinfo.mouseinfo.col) {
                coord = SocialCalc.crToCoord(mouseinfo.col, editor.ecell.row);
                if (repeatinfo.repeatcallback) {
                    if (mouseinfo.row < repeatinfo.mouseinfo.row) {
                        direction = "left";
                    } else if (mouseinfo.row > repeatinfo.mouseinfo.row) {
                        direction = "right";
                    } else {
                        direction = "";
                    }
                    repeatinfo.repeatcallback(coord, direction);
                } else {
                    editor.MoveECell(coord);
                    editor.RangeExtend();
                    editor.EditorMouseRange(coord);
                }
            }
        }
    }
    repeatinfo.mouseinfo = mouseinfo;
    if (mouseinfo.distance < 5) repeatinfo.repeatinterval = 333; else if (mouseinfo.distance < 10) repeatinfo.repeatinterval = 250; else if (mouseinfo.distance < 25) repeatinfo.repeatinterval = 100; else if (mouseinfo.distance < 35) repeatinfo.repeatinterval = 75; else {
        if (repeatinfo.timer) {
            window.clearTimeout(repeatinfo.timer);
            repeatinfo.timer = null;
        }
        return;
    }
    if (!repeatinfo.timer) {
        repeatinfo.timer = window.setTimeout(SocialCalc.DragAutoRepeat, repeatinfo.repeatinterval);
    }
    return;
};

SocialCalc.DragAutoRepeat = function() {
    var repeatinfo = SocialCalc.AutoRepeatInfo;
    var mouseinfo = repeatinfo.mouseinfo;
    var direction, coord, cr;
    if (mouseinfo.rowheader) direction = "left"; else if (mouseinfo.rowfooter) direction = "right"; else if (mouseinfo.colheader) direction = "up"; else if (mouseinfo.colfooter) direction = "down";
    if (repeatinfo.repeatcallback) {
        cr = SocialCalc.coordToCr(repeatinfo.editor.ecell.coord);
        if (direction == "left" && cr.col > 1) cr.col--; else if (direction == "right") cr.col++; else if (direction == "up" && cr.row > 1) cr.row--; else if (direction == "down") cr.row++;
        coord = SocialCalc.crToCoord(cr.col, cr.row);
        repeatinfo.repeatcallback(coord, direction);
    } else {
        coord = repeatinfo.editor.MoveECellWithKey("[a" + direction + "]shifted");
        if (coord) repeatinfo.editor.EditorMouseRange(coord);
    }
    repeatinfo.timer = window.setTimeout(SocialCalc.DragAutoRepeat, repeatinfo.repeatinterval);
};

SocialCalc.ProcessEditorDblClick = function(e) {
    var editor, result, coord, textarea, wval, range;
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var ele = event.target || event.srcElement;
    var mobj;
    if (mouseinfo.ignore) return;
    for (mobj = null; !mobj && ele; ele = ele.parentNode) {
        mobj = SocialCalc.LookupElement(ele, mouseinfo.registeredElements);
    }
    if (!mobj) {
        mouseinfo.editor = null;
        return;
    }
    editor = mobj.editor;
    var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
    var clientX = event.clientX - pos.left;
    var clientY = event.clientY - pos.top;
    result = SocialCalc.GridMousePosition(editor, clientX, clientY);
    if (!result || !result.coord) return;
    mouseinfo.editor = editor;
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
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    return;
};

SocialCalc.EditorOpenCellEdit = function(editor) {
    var wval;
    if (!editor.ecell) return true;
    if (!editor.inputBox) return true;
    if (editor.inputBox.element.disabled) return true;
    editor.inputBox.ShowInputBox(true);
    editor.inputBox.Focus();
    editor.inputBox.SetText("");
    editor.inputBox.DisplayCellContents();
    editor.inputBox.Select("end");
    wval = editor.workingvalues;
    wval.partialexpr = "";
    wval.ecoord = editor.ecell.coord;
    wval.erow = editor.ecell.row;
    wval.ecol = editor.ecell.col;
    return;
};

SocialCalc.EditorProcessKey = function(editor, ch, e) {
    var result, cell, cellobj, valueinfo, fch, coord, inputtext, f;
    var sheetobj = editor.context.sheetobj;
    var wval = editor.workingvalues;
    var range = editor.range;
    if (typeof ch != "string") ch = "";
    switch (editor.state) {
      case "start":
        if (e.shiftKey && ch.substr(0, 2) == "[a") {
            ch = ch + "shifted";
        }
        if (ch == "[enter]") ch = "[adown]";
        if (ch == "[tab]") ch = e.shiftKey ? "[aleft]" : "[aright]";
        if (ch.substr(0, 2) == "[a" || ch.substr(0, 3) == "[pg" || ch == "[home]") {
            result = editor.MoveECellWithKey(ch);
            return !result;
        }
        if (ch == "[del]" || ch == "[backspace]") {
            if (!editor.noEdit && !editor.ECellReadonly()) {
                editor.EditorApplySetCommandsToRange("empty", "");
            }
            break;
        }
        if (ch == "[esc]") {
            if (range.hasrange) {
                editor.RangeRemove();
                editor.MoveECell(range.anchorcoord);
                for (f in editor.StatusCallback) {
                    editor.StatusCallback[f].func(editor, "specialkey", ch, editor.StatusCallback[f].params);
                }
            }
            return false;
        }
        if (ch == "[f2]") {
            if (editor.noEdit || editor.ECellReadonly()) return true;
            SocialCalc.EditorOpenCellEdit(editor);
            return false;
        }
        if (ch.length > 1 && ch.substr(0, 1) == "[" || ch.length == 0) {
            if (editor.ctrlkeyFunction && ch.length > 0) {
                return editor.ctrlkeyFunction(editor, ch);
            } else {
                return true;
            }
        }
        if (!editor.ecell) return true;
        if (!editor.inputBox) return true;
        if (editor.ECellReadonly()) return true;
        editor.inputBox.element.disabled = false;
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
        inputtext = editor.inputBox.GetText();
        if (editor.inputBox.skipOne) return false;
        if (ch == "[esc]" || ch == "[enter]" || ch == "[tab]" || ch && ch.substr(0, 2) == "[a") {
            if ("(+-*/,:!&<>=^".indexOf(inputtext.slice(-1)) >= 0 && inputtext.slice(0, 1) == "=" || inputtext == "=") {
                wval.partialexpr = inputtext;
            }
            if (wval.partialexpr) {
                if (e.shiftKey && ch.substr(0, 2) == "[a") {
                    ch = ch + "shifted";
                }
                coord = editor.MoveECellWithKey(ch);
                if (coord) {
                    if (range.hasrange) {
                        editor.inputBox.SetText(wval.partialexpr + SocialCalc.crToCoord(range.left, range.top) + ":" + SocialCalc.crToCoord(range.right, range.bottom));
                    } else {
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
                if (ch == "[enter]") ch = "[adown]";
                if (ch == "[tab]") ch = e.shiftKey ? "[aleft]" : "[aright]";
                if (ch.substr(0, 2) == "[a") {
                    editor.MoveECellWithKey(ch);
                }
            } else {
                editor.inputBox.DisplayCellContents();
                editor.RangeRemove();
                editor.MoveECell(wval.ecoord);
            }
            break;
        }
        if (wval.partialexpr && ch == "[backspace]") {
            editor.inputBox.SetText(wval.partialexpr);
            wval.partialexpr = "";
            editor.RangeRemove();
            editor.MoveECell(wval.ecoord);
            editor.inputBox.ShowInputBox(true);
            return false;
        }
        if (ch == "[f2]") return false;
        if (range.hasrange) {
            editor.RangeRemove();
        }
        editor.MoveECell(wval.ecoord);
        if (wval.partialexpr) {
            editor.inputBox.ShowInputBox(true);
            wval.partialexpr = "";
        }
        return true;

      case "inputboxdirect":
        inputtext = editor.inputBox.GetText();
        if (ch == "[esc]" || ch == "[enter]" || ch == "[tab]") {
            editor.inputBox.Blur();
            editor.inputBox.ShowInputBox(false);
            editor.state = "start";
            editor.cellhandles.ShowCellHandles(true);
            if (ch == "[esc]") {
                editor.inputBox.DisplayCellContents();
            } else {
                editor.EditorSaveEdit();
                if (editor.ecell.coord != wval.ecoord) {
                    editor.MoveECell(wval.ecoord);
                }
                if (ch == "[enter]") ch = "[adown]";
                if (ch == "[tab]") ch = e.shiftKey ? "[aleft]" : "[aright]";
                if (ch.substr(0, 2) == "[a") {
                    editor.MoveECellWithKey(ch);
                }
            }
            break;
        }
        if (ch == "[f2]") return false;
        return true;

      case "skip-and-start":
        editor.state = "start";
        editor.cellhandles.ShowCellHandles(true);
        return false;

      default:
        return true;
    }
    return false;
};

SocialCalc.EditorAddToInput = function(editor, str, prefix) {
    var wval = editor.workingvalues;
    if (editor.noEdit || editor.ECellReadonly()) return;
    switch (editor.state) {
      case "start":
        editor.state = "input";
        editor.inputBox.ShowInputBox(true);
        editor.inputBox.element.disabled = false;
        editor.inputBox.Focus();
        editor.inputBox.SetText((prefix || "") + str);
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
        editor.inputBox.SetText(editor.inputBox.GetText() + str);
        break;

      default:
        break;
    }
};

SocialCalc.EditorDisplayCellContents = function(editor) {
    if (editor.inputBox) editor.inputBox.DisplayCellContents();
};

SocialCalc.EditorSaveEdit = function(editor, text) {
    var result, cell, valueinfo, fch, type, value, oldvalue, cmdline;
    var sheetobj = editor.context.sheetobj;
    var wval = editor.workingvalues;
    type = "text t";
    value = typeof text == "string" ? text : editor.inputBox.GetText();
    oldvalue = SocialCalc.GetCellContents(sheetobj, wval.ecoord) + "";
    if (value == oldvalue) {
        return;
    }
    fch = value.charAt(0);
    if (fch == "=" && value.indexOf("\n") == -1) {
        type = "formula";
        value = value.substring(1);
    } else if (fch == "'") {
        type = "text t";
        value = value.substring(1);
        valueinfo = SocialCalc.DetermineValueType(value);
        if (valueinfo.type.charAt(0) == "t") {
            type = "text " + valueinfo.type;
        }
    } else if (value.length == 0) {
        type = "empty";
    } else {
        valueinfo = SocialCalc.DetermineValueType(value);
        if (valueinfo.type == "n" && value == valueinfo.value + "") {
            type = "value n";
        } else if (valueinfo.type.charAt(0) == "t") {
            type = "text " + valueinfo.type;
        } else if (valueinfo.type == "") {
            type = "text t";
        } else {
            type = "constant " + valueinfo.type + " " + valueinfo.value;
        }
    }
    if (type.charAt(0) == "t") {
        value = SocialCalc.encodeForSave(value);
    }
    cmdline = "set " + wval.ecoord + " " + type + " " + value;
    editor.EditorScheduleSheetCommands(cmdline, true, false);
    return;
};

SocialCalc.EditorApplySetCommandsToRange = function(editor, cmd) {
    var cell, row, col, line, errortext;
    var sheetobj = editor.context.sheetobj;
    var ecell = editor.ecell;
    var range = editor.range;
    if (range.hasrange) {
        coord = SocialCalc.crToCoord(range.left, range.top) + ":" + SocialCalc.crToCoord(range.right, range.bottom);
        line = "set " + coord + " " + cmd;
        errortext = editor.EditorScheduleSheetCommands(line, true, false);
    } else {
        line = "set " + ecell.coord + " " + cmd;
        errortext = editor.EditorScheduleSheetCommands(line, true, false);
    }
    editor.DisplayCellContents();
};

SocialCalc.EditorProcessMouseWheel = function(event, delta, mousewheelinfo, wobj) {
    if (wobj.functionobj.editor.busy) return;
    if (delta > 0) {
        wobj.functionobj.editor.ScrollRelative(true, Math.floor(-delta * 1.5));
    }
    if (delta < 0) {
        wobj.functionobj.editor.ScrollRelative(true, Math.ceil(-delta * 1.5));
    }
};

SocialCalc.GridMousePosition = function(editor, clientX, clientY) {
    var row, rowpane, col, colpane;
    var result = {};
    for (row = 1; row < editor.rowpositions.length; row++) {
        if (!editor.rowheight[row]) continue;
        if (editor.rowpositions[row] + editor.rowheight[row] > clientY) {
            break;
        }
    }
    for (col = 1; col < editor.colpositions.length; col++) {
        if (!editor.colwidth[col]) continue;
        if (editor.colpositions[col] + editor.colwidth[col] > clientX) {
            break;
        }
    }
    result.row = row;
    result.col = col;
    if (editor.headposition) {
        if (clientX < editor.headposition.left && clientX >= editor.gridposition.left) {
            result.rowheader = true;
            result.distance = editor.headposition.left - clientX;
            result.rowtoresize = row - (editor.rowpositions[row] + editor.rowheight[row] / 2 > clientY ? 1 : 0) || 1;
            if (unhide = editor.context.rowunhidetop[row]) {
                pos = SocialCalc.GetElementPosition(unhide);
                if (clientX >= pos.left && clientX < pos.left + unhide.offsetWidth && clientY >= editor.rowpositions[row] + editor.rowheight[row] - unhide.offsetHeight && clientY < editor.rowpositions[row] + editor.rowheight[row]) {
                    result.rowtounhide = row + 1;
                }
            }
            if (unhide = editor.context.rowunhidebottom[row]) {
                pos = SocialCalc.GetElementPosition(unhide);
                if (clientX >= pos.left && clientX < pos.left + unhide.offsetWidth && clientY >= pos.top && clientY < pos.top + unhide.offsetHeight) {
                    result.rowtounhide = row - 1;
                }
            }
            for (rowpane = 0; rowpane < editor.context.rowpanes.length; rowpane++) {
                if (result.rowtoresize >= editor.context.rowpanes[rowpane].first && result.rowtoresize <= editor.context.rowpanes[rowpane].last) {
                    return result;
                }
            }
            delete result.rowtoresize;
            return result;
        } else if (clientY < editor.headposition.top && clientY > editor.gridposition.top) {
            result.colheader = true;
            result.distance = editor.headposition.top - clientY;
            result.coltoresize = col - (editor.colpositions[col] + editor.colwidth[col] / 2 > clientX ? 1 : 0) || 1;
            if (unhide = editor.context.colunhideleft[col]) {
                pos = SocialCalc.GetElementPosition(unhide);
                if (clientX >= pos.left && clientX < pos.left + unhide.offsetWidth && clientY >= pos.top && clientY < pos.top + unhide.offsetHeight) {
                    result.coltounhide = col + 1;
                }
            }
            if (unhide = editor.context.colunhideright[col]) {
                pos = SocialCalc.GetElementPosition(unhide);
                if (clientX >= pos.left && clientX < pos.left + unhide.offsetWidth && clientY >= pos.top && clientY < pos.top + unhide.offsetHeight) {
                    result.coltounhide = col - 1;
                }
            }
            for (colpane = 0; colpane < editor.context.colpanes.length; colpane++) {
                if (result.coltoresize >= editor.context.colpanes[colpane].first && result.coltoresize <= editor.context.colpanes[colpane].last) {
                    return result;
                }
            }
            delete result.coltoresize;
            return result;
        } else if (clientX >= editor.verticaltablecontrol.controlborder) {
            result.rowfooter = true;
            result.distance = clientX - editor.verticaltablecontrol.controlborder;
            return result;
        } else if (clientY >= editor.horizontaltablecontrol.controlborder) {
            result.colfooter = true;
            result.distance = clientY - editor.horizontaltablecontrol.controlborder;
            return result;
        } else if (clientX < editor.gridposition.left) {
            result.rowheader = true;
            result.distance = editor.headposition.left - clientX;
            return result;
        } else if (clientY <= editor.gridposition.top) {
            result.colheader = true;
            result.distance = editor.headposition.top - clientY;
            return result;
        } else {
            result.coord = SocialCalc.crToCoord(result.col, result.row);
            if (editor.context.cellskip[result.coord]) {
                result.coord = editor.context.cellskip[result.coord];
            }
            return result;
        }
    }
    return null;
};

SocialCalc.GetEditorCellElement = function(editor, row, col) {
    var rowpane, colpane, c, coord;
    var rowindex = 0;
    var colindex = 0;
    for (rowpane = 0; rowpane < editor.context.rowpanes.length; rowpane++) {
        if (row >= editor.context.rowpanes[rowpane].first && row <= editor.context.rowpanes[rowpane].last) {
            for (colpane = 0; colpane < editor.context.colpanes.length; colpane++) {
                if (col >= editor.context.colpanes[colpane].first && col <= editor.context.colpanes[colpane].last) {
                    rowindex += row - editor.context.rowpanes[rowpane].first + 2;
                    for (c = editor.context.colpanes[colpane].first; c <= col; c++) {
                        coord = editor.context.cellskip[SocialCalc.crToCoord(c, row)];
                        if (!coord || !editor.context.CoordInPane(coord, rowpane, colpane)) colindex++;
                    }
                    return {
                        element: editor.griddiv.firstChild.lastChild.childNodes[rowindex].childNodes[colindex],
                        rowpane: rowpane,
                        colpane: colpane
                    };
                }
                for (c = editor.context.colpanes[colpane].first; c <= editor.context.colpanes[colpane].last; c++) {
                    coord = editor.context.cellskip[SocialCalc.crToCoord(c, row)];
                    if (!coord || !editor.context.CoordInPane(coord, rowpane, colpane)) colindex++;
                }
                colindex += 1;
            }
        }
        rowindex += editor.context.rowpanes[rowpane].last - editor.context.rowpanes[rowpane].first + 1 + 1;
    }
    return null;
};

SocialCalc.MoveECellWithKey = function(editor, ch) {
    var coord, row, col, cell;
    var shifted = false;
    var delta = 1;
    if (!editor.ecell) {
        return null;
    }
    if (ch.slice(-7) == "shifted") {
        ch = ch.slice(0, -7);
        shifted = true;
    }
    row = editor.ecell.row;
    col = editor.ecell.col;
    cell = editor.context.sheetobj.cells[editor.ecell.coord];
    switch (ch) {
      case "[adown]":
        row += cell && cell.rowspan || 1;
        break;

      case "[aup]":
        row--;
        delta = -1;
        break;

      case "[pgdn]":
        row += editor.pageUpDnAmount - 1 + (cell && cell.rowspan || 1);
        break;

      case "[pgup]":
        row -= editor.pageUpDnAmount;
        delta = -1;
        break;

      case "[aright]":
        col += cell && cell.colspan || 1;
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
    if (editor.context.sheetobj.attribs.usermaxcol) col = Math.min(editor.context.sheetobj.attribs.usermaxcol, col);
    if (editor.context.sheetobj.attribs.usermaxrow) row = Math.min(editor.context.sheetobj.attribs.usermaxrow, row);
    while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == "yes") {
        col += delta;
        if (col < 1) {
            delta = -delta;
            col = 1;
        }
    }
    while (editor.context.sheetobj.rowattribs.hide[row] == "yes") {
        row += delta;
        if (row < 1) {
            delta = -delta;
            row = 1;
        }
    }
    if (!editor.range.hasrange) {
        if (shifted) editor.RangeAnchor();
    }
    coord = editor.MoveECell(SocialCalc.crToCoord(col, row));
    if (editor.range.hasrange) {
        if (shifted) editor.RangeExtend(); else editor.RangeRemove();
    }
    return coord;
};

SocialCalc.MoveECell = function(editor, newcell) {
    var cell, f;
    var highlights = editor.context.highlights;
    var ecell = SocialCalc.coordToCr(newcell);
    if (editor.context.sheetobj.attribs.usermaxcol && ecell.col > editor.context.sheetobj.attribs.usermaxcol) ecell.col = editor.context.sheetobj.attribs.usermaxcol;
    if (editor.context.sheetobj.attribs.usermaxrow && ecell.row > editor.context.sheetobj.attribs.usermaxrow) ecell.row = editor.context.sheetobj.attribs.usermaxrow;
    newcell = SocialCalc.crToCoord(ecell.col, ecell.row);
    if (editor.ecell) {
        if (editor.ecell.coord == newcell) return newcell;
        cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
        delete highlights[editor.ecell.coord];
        if (editor.range2.hasrange && editor.ecell.row >= editor.range2.top && editor.ecell.row <= editor.range2.bottom && editor.ecell.col >= editor.range2.left && editor.ecell.col <= editor.range2.right) {
            highlights[editor.ecell.coord] = "range2";
        }
        editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);
        editor.SetECellHeaders("");
        editor.cellhandles.ShowCellHandles(false);
    }
    newcell = editor.context.cellskip[newcell] || newcell;
    editor.ecell = SocialCalc.coordToCr(newcell);
    editor.ecell.coord = newcell;
    cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
    highlights[newcell] = "cursor";
    for (f in editor.MoveECellCallback) {
        editor.MoveECellCallback[f](editor);
    }
    editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);
    editor.SetECellHeaders("selected");
    for (f in editor.StatusCallback) {
        editor.StatusCallback[f].func(editor, "moveecell", newcell, editor.StatusCallback[f].params);
    }
    if (editor.busy) {
        editor.ensureecell = true;
    } else {
        editor.ensureecell = false;
        editor.EnsureECellVisible();
    }
    return newcell;
};

SocialCalc.EnsureECellVisible = function(editor) {
    var vamount = 0;
    var hamount = 0;
    if (editor.ecell.row > editor.lastnonscrollingrow) {
        if (editor.ecell.row < editor.firstscrollingrow) {
            vamount = editor.ecell.row - editor.firstscrollingrow;
        } else if (editor.ecell.row > editor.lastvisiblerow) {
            vamount = editor.ecell.row - editor.lastvisiblerow;
        }
    }
    if (editor.ecell.col > editor.lastnonscrollingcol) {
        if (editor.ecell.col < editor.firstscrollingcol) {
            hamount = editor.ecell.col - editor.firstscrollingcol;
        } else if (editor.ecell.col > editor.lastvisiblecol) {
            hamount = editor.ecell.col - editor.lastvisiblecol;
        }
    }
    if (vamount != 0 || hamount != 0) {
        editor.ScrollRelativeBoth(vamount, hamount);
    } else {
        editor.cellhandles.ShowCellHandles(true);
    }
};

SocialCalc.ReplaceCell = function(editor, cell, row, col) {
    var newelement, a;
    if (!cell) return;
    newelement = editor.context.RenderCell(row, col, cell.rowpane, cell.colpane, true, null);
    if (newelement) {
        cell.element.innerHTML = newelement.innerHTML;
        cell.element.style.cssText = "";
        cell.element.className = newelement.className;
        for (a in newelement.style) {
            if (newelement.style[a] != "cssText") cell.element.style[a] = newelement.style[a];
        }
    }
};

SocialCalc.UpdateCellCSS = function(editor, cell, row, col) {
    var newelement, a;
    if (!cell) return;
    newelement = editor.context.RenderCell(row, col, cell.rowpane, cell.colpane, true, null);
    if (newelement) {
        cell.element.style.cssText = "";
        cell.element.className = newelement.className;
        for (a in newelement.style) {
            if (newelement.style[a] != "cssText") cell.element.style[a] = newelement.style[a];
        }
    }
};

SocialCalc.SetECellHeaders = function(editor, selected) {
    var ecell = editor.ecell;
    var context = editor.context;
    var rowpane, colpane, first, last;
    var rowindex = 0;
    var colindex = 0;
    var headercell;
    if (!ecell) return;
    while (context.sheetobj.colattribs.hide[SocialCalc.rcColname(ecell.col)] == "yes") {
        ecell.col++;
    }
    while (context.sheetobj.rowattribs.hide[ecell.row] == "yes") {
        ecell.row++;
    }
    ecell.coord = SocialCalc.crToCoord(ecell.col, ecell.row);
    for (rowpane = 0; rowpane < context.rowpanes.length; rowpane++) {
        first = context.rowpanes[rowpane].first;
        last = context.rowpanes[rowpane].last;
        if (ecell.row >= first && ecell.row <= last) {
            headercell = editor.fullgrid.childNodes[1].childNodes[2 + rowindex + ecell.row - first].childNodes[0];
            if (headercell) {
                if (context.classnames) headercell.className = context.classnames[selected + "rowname"];
                if (context.explicitStyles) headercell.style.cssText = context.explicitStyles[selected + "rowname"];
                headercell.style.verticalAlign = "top";
            }
        }
        rowindex += last - first + 1 + 1;
    }
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        first = context.colpanes[colpane].first;
        last = context.colpanes[colpane].last;
        if (ecell.col >= first && ecell.col <= last) {
            headercell = editor.fullgrid.childNodes[1].childNodes[1].childNodes[1 + colindex + ecell.col - first];
            if (headercell) {
                if (context.classnames) headercell.className = context.classnames[selected + "colname"];
                if (context.explicitStyles) headercell.style.cssText = context.explicitStyles[selected + "colname"];
            }
        }
        colindex += last - first + 1 + 1;
    }
};

SocialCalc.ECellReadonly = function(editor, ecoord) {
    if (!ecoord && editor.ecell) {
        ecoord = editor.ecell.coord;
    }
    if (!ecoord) return false;
    var cell = editor.context.sheetobj.cells[ecoord];
    return cell && cell.readonly;
};

SocialCalc.RangeAnchor = function(editor, ecoord) {
    if (editor.range.hasrange) {
        editor.RangeRemove();
    }
    editor.RangeExtend(ecoord);
};

SocialCalc.RangeExtend = function(editor, ecoord) {
    var a, cell, cr, coord, row, col, f;
    var highlights = editor.context.highlights;
    var range = editor.range;
    var range2 = editor.range2;
    var ecell;
    if (ecoord) {
        ecell = SocialCalc.coordToCr(ecoord);
        ecell.coord = ecoord;
    } else ecell = editor.ecell;
    if (!ecell) return;
    if (!range.hasrange) {
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
    } else {
        range.top = ecell.row;
        range.bottom = range.anchorrow;
    }
    if (range.anchorcol < ecell.col) {
        range.left = range.anchorcol;
        range.right = ecell.col;
    } else {
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
    for (row = range.top; row <= range.bottom; row++) {
        for (col = range.left; col <= range.right; col++) {
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
    for (row = range2.top; range2.hasrange && row <= range2.bottom; row++) {
        for (col = range2.left; col <= range2.right; col++) {
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
    for (f in editor.RangeChangeCallback) {
        editor.RangeChangeCallback[f](editor);
    }
    coord = SocialCalc.crToCoord(editor.range.left, editor.range.top);
    if (editor.range.left != editor.range.right || editor.range.top != editor.range.bottom) {
        coord += ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
    }
    for (f in editor.StatusCallback) {
        editor.StatusCallback[f].func(editor, "rangechange", coord, editor.StatusCallback[f].params);
    }
    return;
};

SocialCalc.RangeRemove = function(editor) {
    var cell, cr, coord, row, col, f;
    var highlights = editor.context.highlights;
    var range = editor.range;
    var range2 = editor.range2;
    if (!range.hasrange && !range2.hasrange) return;
    for (row = range2.top; range2.hasrange && row <= range2.bottom; row++) {
        for (col = range2.left; col <= range2.right; col++) {
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
        cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
        editor.UpdateCellCSS(cell, cr.row, cr.col);
    }
    range.hasrange = false;
    for (f in editor.RangeChangeCallback) {
        editor.RangeChangeCallback[f](editor);
    }
    for (f in editor.StatusCallback) {
        editor.StatusCallback[f].func(editor, "rangechange", "", editor.StatusCallback[f].params);
    }
    return;
};

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
        cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
        editor.UpdateCellCSS(cell, cr.row, cr.col);
    }
    range2.hasrange = false;
    return;
};

SocialCalc.FitToEditTable = function(editor) {
    var colnum, colname, colwidth, totalwidth, totalrows, rownum, rowpane, needed;
    var context = editor.context;
    var sheetobj = context.sheetobj;
    var sheetcolattribs = sheetobj.colattribs;
    totalwidth = context.showRCHeaders ? context.rownamewidth - 0 : 0;
    for (colpane = 0; colpane < context.colpanes.length - 1; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            colname = SocialCalc.rcColname(colnum);
            if (sheetobj.colattribs.hide[colname] != "yes") {
                colwidth = sheetobj.colattribs.width[colname] || sheetobj.attribs.defaultcolwidth || SocialCalc.Constants.defaultColWidth;
                if (colwidth == "blank" || colwidth == "auto") colwidth = "";
                totalwidth += colwidth && colwidth - 0 > 0 ? colwidth - 0 : 10;
            }
        }
    }
    for (colnum = context.colpanes[colpane].first; colnum <= 1e4; colnum++) {
        colname = SocialCalc.rcColname(colnum);
        if (sheetobj.colattribs.hide[colname] != "yes") {
            colwidth = sheetobj.colattribs.width[colname] || sheetobj.attribs.defaultcolwidth || SocialCalc.Constants.defaultColWidth;
            if (colwidth == "blank" || colwidth == "auto") colwidth = "";
            totalwidth += colwidth && colwidth - 0 > 0 ? colwidth - 0 : 10;
        }
        if (totalwidth > editor.tablewidth) break;
    }
    context.colpanes[colpane].last = context.sheetobj.attribs.usermaxcol || colnum;
    totalrows = context.showRCHeaders ? 1 : 0;
    for (rowpane = 0; rowpane < context.rowpanes.length - 1; rowpane++) {
        totalrows += context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 1;
        for (rownum = context.rowpanes[rowpane].first; rownum <= context.rowpanes[rowpane].last; rownum++) {
            if (sheetobj.rowattribs.hide[rownum] == "yes") {
                totalrows--;
            }
        }
    }
    needed = editor.tableheight - totalrows * context.pixelsPerRow;
    context.rowpanes[rowpane].last = context.sheetobj.attribs.usermaxrow || context.rowpanes[rowpane].first + Math.floor(needed / context.pixelsPerRow) + 1;
};

SocialCalc.CalculateEditorPositions = function(editor) {
    var rowpane, colpane, i;
    editor.gridposition = SocialCalc.GetElementPosition(editor.griddiv);
    var element = editor.griddiv.firstChild.lastChild.childNodes[1].childNodes[0];
    editor.headposition = SocialCalc.GetElementPosition(element);
    editor.headposition.left += element.offsetWidth;
    editor.headposition.top += element.offsetHeight;
    editor.rowpositions = [];
    for (rowpane = 0; rowpane < editor.context.rowpanes.length; rowpane++) {
        editor.CalculateRowPositions(rowpane, editor.rowpositions, editor.rowheight);
    }
    for (i = 0; i < editor.rowpositions.length; i++) {
        if (editor.rowpositions[i] > editor.gridposition.top + editor.tableheight) break;
    }
    editor.lastvisiblerow = i - 1;
    editor.colpositions = [];
    for (colpane = 0; colpane < editor.context.colpanes.length; colpane++) {
        editor.CalculateColPositions(colpane, editor.colpositions, editor.colwidth);
    }
    for (i = 0; i < editor.colpositions.length; i++) {
        if (editor.colpositions[i] > editor.gridposition.left + editor.tablewidth) break;
    }
    editor.lastvisiblecol = i - 1;
    editor.firstscrollingrow = editor.context.rowpanes[editor.context.rowpanes.length - 1].first;
    while (editor.context.sheetobj.rowattribs.hide[editor.firstscrollingrow] == "yes") {
        editor.firstscrollingrow++;
    }
    editor.firstscrollingrowtop = editor.rowpositions[editor.firstscrollingrow] || editor.headposition.top;
    editor.lastnonscrollingrow = editor.context.rowpanes.length - 1 > 0 ? editor.context.rowpanes[editor.context.rowpanes.length - 2].last : 0;
    editor.firstscrollingcol = editor.context.colpanes[editor.context.colpanes.length - 1].first;
    while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(editor.firstscrollingcol)] == "yes") {
        editor.firstscrollingcol++;
    }
    editor.firstscrollingcolleft = editor.colpositions[editor.firstscrollingcol] || editor.headposition.left;
    editor.lastnonscrollingcol = editor.context.colpanes.length - 1 > 0 ? editor.context.colpanes[editor.context.colpanes.length - 2].last : 0;
    editor.verticaltablecontrol.ComputeTableControlPositions();
    editor.horizontaltablecontrol.ComputeTableControlPositions();
};

SocialCalc.ScheduleRender = function(editor) {
    if (editor.timeout) window.clearTimeout(editor.timeout);
    SocialCalc.EditorSheetStatusCallback(null, "schedrender", null, editor);
    editor.timeout = window.setTimeout(function() {
        SocialCalc.DoRenderStep(editor);
    }, 1);
};

SocialCalc.DoRenderStep = function(editor) {
    editor.timeout = null;
    editor.EditorRenderSheet();
    SocialCalc.EditorSheetStatusCallback(null, "renderdone", null, editor);
    SocialCalc.EditorSheetStatusCallback(null, "schedposcalc", null, editor);
    editor.timeout = window.setTimeout(function() {
        SocialCalc.DoPositionCalculations(editor);
    }, 1);
};

SocialCalc.SchedulePositionCalculations = function(editor) {
    SocialCalc.EditorSheetStatusCallback(null, "schedposcalc", null, editor);
    editor.timeout = window.setTimeout(function() {
        SocialCalc.DoPositionCalculations(editor);
    }, 1);
};

SocialCalc.DoPositionCalculations = function(editor) {
    editor.timeout = null;
    editor.CalculateEditorPositions();
    editor.verticaltablecontrol.PositionTableControlElements();
    editor.horizontaltablecontrol.PositionTableControlElements();
    SocialCalc.EditorSheetStatusCallback(null, "doneposcalc", null, editor);
    if (editor.ensureecell && editor.ecell && !editor.deferredCommands.length) {
        editor.ensureecell = false;
        editor.EnsureECellVisible();
    }
    editor.cellhandles.ShowCellHandles(true);
};

SocialCalc.CalculateRowPositions = function(editor, panenum, positions, sizes) {
    var toprow, rowpane, rownum, offset, trowobj, cellposition;
    var context = editor.context;
    var sheetobj = context.sheetobj;
    var tbodyobj;
    if (!context.showRCHeaders) throw "Needs showRCHeaders=true";
    tbodyobj = editor.fullgrid.lastChild;
    toprow = 2;
    for (rowpane = 0; rowpane < panenum; rowpane++) {
        toprow += context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 2;
    }
    offset = 0;
    for (rownum = context.rowpanes[rowpane].first; rownum <= context.rowpanes[rowpane].last; rownum++) {
        trowobj = tbodyobj.childNodes[toprow + offset];
        offset++;
        if (!trowobj) {
            continue;
        }
        cellposition = SocialCalc.GetElementPosition(trowobj.firstChild);
        if (!positions[rownum]) {
            positions[rownum] = cellposition.top;
            sizes[rownum] = trowobj.firstChild.offsetHeight;
        }
    }
    return;
};

SocialCalc.CalculateColPositions = function(editor, panenum, positions, sizes) {
    var leftcol, colpane, colnum, offset, trowobj, cellposition;
    var context = editor.context;
    var sheetobj = context.sheetobj;
    var tbodyobj;
    if (!context.showRCHeaders) throw "Needs showRCHeaders=true";
    tbodyobj = editor.fullgrid.lastChild;
    leftcol = 1;
    for (colpane = 0; colpane < panenum; colpane++) {
        leftcol += context.colpanes[colpane].last - context.colpanes[colpane].first + 2;
    }
    trowobj = tbodyobj.childNodes[1];
    offset = 0;
    for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
        cellposition = SocialCalc.GetElementPosition(trowobj.childNodes[leftcol + offset]);
        if (!positions[colnum]) {
            positions[colnum] = cellposition.left;
            if (trowobj.childNodes[leftcol + offset]) {
                sizes[colnum] = trowobj.childNodes[leftcol + offset].offsetWidth;
            }
        }
        offset++;
    }
    return;
};

SocialCalc.ScrollRelative = function(editor, vertical, amount) {
    if (vertical) {
        editor.ScrollRelativeBoth(amount, 0);
    } else {
        editor.ScrollRelativeBoth(0, amount);
    }
    return;
};

SocialCalc.ScrollRelativeBoth = function(editor, vamount, hamount) {
    var context = editor.context;
    var dv = vamount > 0 ? 1 : -1, dh = hamount > 0 ? 1 : -1;
    var vplen = context.rowpanes.length;
    var vlimit = vplen > 1 ? context.rowpanes[vplen - 2].last + 1 : 1;
    if (context.rowpanes[vplen - 1].first + vamount < vlimit) {
        vamount = -context.rowpanes[vplen - 1].first + vlimit;
    }
    var hplen = context.colpanes.length;
    var hlimit = hplen > 1 ? context.colpanes[hplen - 2].last + 1 : 1;
    if (context.colpanes[hplen - 1].first + hamount < hlimit) {
        hamount = -context.colpanes[hplen - 1].first + hlimit;
    }
    while (context.sheetobj.colattribs.hide[SocialCalc.rcColname(context.colpanes[hplen - 1].first + hamount)] == "yes") {
        hamount += dh;
        if (hamount < 1) {
            hamount = 0;
            break;
        }
    }
    while (context.sheetobj.rowattribs.hide[context.rowpanes[vplen - 1].first + vamount] == "yes") {
        vamount += dv;
        if (vamount < 1) {
            vamount = 0;
            break;
        }
    }
    if ((vamount == 1 || vamount == -1) && hamount == 0) {
        if (vamount == 1) {
            editor.ScrollTableUpOneRow();
        } else {
            editor.ScrollTableDownOneRow();
        }
        if (editor.ecell) editor.SetECellHeaders("selected");
        editor.SchedulePositionCalculations();
        return;
    }
    if (vamount != 0 || hamount != 0) {
        context.rowpanes[vplen - 1].first += vamount;
        context.rowpanes[vplen - 1].last += vamount;
        context.colpanes[hplen - 1].first += hamount;
        context.colpanes[hplen - 1].last += hamount;
        editor.LimitLastPanes();
        editor.FitToEditTable();
        editor.ScheduleRender();
    }
};

SocialCalc.PageRelative = function(editor, vertical, direction) {
    var context = editor.context;
    var panes = vertical ? "rowpanes" : "colpanes";
    var lastpane = context[panes][context[panes].length - 1];
    var lastvisible = vertical ? "lastvisiblerow" : "lastvisiblecol";
    var sizearray = vertical ? editor.rowheight : editor.colwidth;
    var defaultsize = vertical ? SocialCalc.Constants.defaultAssumedRowHeight : SocialCalc.Constants.defaultColWidth;
    var size, newfirst, totalsize, current;
    if (direction > 0) {
        newfirst = editor[lastvisible];
        if (newfirst == lastpane.first) newfirst += 1;
    } else {
        if (vertical) {
            totalsize = editor.tableheight - (editor.firstscrollingrowtop - editor.gridposition.top);
        } else {
            totalsize = editor.tablewidth - (editor.firstscrollingcolleft - editor.gridposition.left);
        }
        totalsize -= sizearray[editor[lastvisible]] > 0 ? sizearray[editor[lastvisible]] : defaultsize;
        for (newfirst = lastpane.first - 1; newfirst > 0; newfirst--) {
            size = sizearray[newfirst] > 0 ? sizearray[newfirst] : defaultsize;
            if (totalsize < size) break;
            totalsize -= size;
        }
        current = lastpane.first;
        if (newfirst >= current) newfirst = current - 1;
        if (newfirst < 1) newfirst = 1;
    }
    lastpane.first = newfirst;
    lastpane.last = newfirst + 1;
    editor.LimitLastPanes();
    editor.FitToEditTable();
    editor.ScheduleRender();
};

SocialCalc.LimitLastPanes = function(editor) {
    var context = editor.context;
    var plen;
    plen = context.rowpanes.length;
    if (plen > 1 && context.rowpanes[plen - 1].first <= context.rowpanes[plen - 2].last) context.rowpanes[plen - 1].first = context.rowpanes[plen - 2].last + 1;
    if (context.sheetobj.attribs.usermaxrow && context.rowpanes[plen - 1].first > context.sheetobj.attribs.usermaxrow) context.rowpanes[plen - 1].first = context.sheetobj.attribs.usermaxrow;
    plen = context.colpanes.length;
    if (plen > 1 && context.colpanes[plen - 1].first <= context.colpanes[plen - 2].last) context.colpanes[plen - 1].first = context.colpanes[plen - 2].last + 1;
    if (context.sheetobj.attribs.usermaxcol && context.colpanes[plen - 1].first > context.sheetobj.attribs.usermaxcol) context.colpanes[plen - 1].first = context.sheetobj.attribs.usermaxcol;
};

SocialCalc.ScrollTableUpOneRow = function(editor) {
    var toprow, rowpane, rownum, colnum, colpane, cell, oldrownum, maxspan, newbottomrow, newrow, oldchild, bottomrownum;
    var rowneedsrefresh = {};
    var context = editor.context;
    var sheetobj = context.sheetobj;
    var tableobj = editor.fullgrid;
    var tbodyobj;
    tbodyobj = tableobj.lastChild;
    toprow = context.showRCHeaders ? 2 : 1;
    for (rowpane = 0; rowpane < context.rowpanes.length - 1; rowpane++) {
        toprow += context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 2;
    }
    if (context.sheetobj.attribs.usermaxrow && context.sheetobj.attribs.usermaxrow - context.rowpanes[rowpane].first < 1) {
        return tableobj;
    }
    tbodyobj.removeChild(tbodyobj.childNodes[toprow]);
    context.rowpanes[rowpane].first++;
    context.rowpanes[rowpane].last++;
    editor.FitToEditTable();
    context.CalculateColWidthData();
    if (!context.sheetobj.attribs.usermaxrow || context.rowpanes[rowpane].last != context.sheetobj.attribs.usermaxrow) {
        newbottomrow = context.RenderRow(context.rowpanes[rowpane].last, rowpane);
        tbodyobj.appendChild(newbottomrow);
    }
    maxrowspan = 1;
    oldrownum = context.rowpanes[rowpane].first - 1;
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            coord = SocialCalc.crToCoord(colnum, oldrownum);
            if (context.cellskip[coord]) continue;
            cell = sheetobj.cells[coord];
            if (cell && cell.rowspan > maxrowspan) maxrowspan = cell.rowspan;
        }
    }
    if (maxrowspan > 1) {
        for (rownum = 1; rownum < maxrowspan; rownum++) {
            if (rownum + oldrownum >= context.rowpanes[rowpane].last) break;
            newrow = context.RenderRow(rownum + oldrownum, rowpane);
            oldchild = tbodyobj.childNodes[toprow + rownum - 1];
            tbodyobj.replaceChild(newrow, oldchild);
        }
    }
    bottomrownum = context.rowpanes[rowpane].last;
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            coord = context.cellskip[SocialCalc.crToCoord(colnum, bottomrownum)];
            if (!coord) continue;
            rownum = context.coordToCR[coord].row - 0;
            if (rownum == context.rowpanes[rowpane].last || rownum < context.rowpanes[rowpane].first) continue;
            cell = sheetobj.cells[coord];
            if (cell && cell.rowspan > 1) rowneedsrefresh[rownum] = true;
        }
    }
    for (rownum in rowneedsrefresh) {
        newrow = context.RenderRow(rownum, rowpane);
        oldchild = tbodyobj.childNodes[toprow + (rownum - context.rowpanes[rowpane].first)];
        tbodyobj.replaceChild(newrow, oldchild);
    }
    return tableobj;
};

SocialCalc.ScrollTableDownOneRow = function(editor) {
    var toprow, rowpane, rownum, colnum, colpane, cell, newrownum, maxspan, newbottomrow, newrow, oldchild, bottomrownum;
    var rowneedsrefresh = {};
    var context = editor.context;
    var sheetobj = context.sheetobj;
    var tableobj = editor.fullgrid;
    var tbodyobj;
    tbodyobj = tableobj.lastChild;
    toprow = context.showRCHeaders ? 2 : 1;
    for (rowpane = 0; rowpane < context.rowpanes.length - 1; rowpane++) {
        toprow += context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 2;
    }
    if (!context.sheetobj.attribs.usermaxrow) {
        tbodyobj.removeChild(tbodyobj.childNodes[toprow + (context.rowpanes[rowpane].last - context.rowpanes[rowpane].first)]);
    }
    context.rowpanes[rowpane].first--;
    context.rowpanes[rowpane].last--;
    editor.FitToEditTable();
    context.CalculateColWidthData();
    newrow = context.RenderRow(context.rowpanes[rowpane].first, rowpane);
    tbodyobj.insertBefore(newrow, tbodyobj.childNodes[toprow]);
    maxrowspan = 1;
    newrownum = context.rowpanes[rowpane].first;
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            coord = SocialCalc.crToCoord(colnum, newrownum);
            if (context.cellskip[coord]) continue;
            cell = sheetobj.cells[coord];
            if (cell && cell.rowspan > maxrowspan) maxrowspan = cell.rowspan;
        }
    }
    if (maxrowspan > 1) {
        for (rownum = 1; rownum < maxrowspan; rownum++) {
            if (rownum + newrownum > context.rowpanes[rowpane].last) break;
            newrow = context.RenderRow(rownum + newrownum, rowpane);
            oldchild = tbodyobj.childNodes[toprow + rownum];
            tbodyobj.replaceChild(newrow, oldchild);
        }
    }
    bottomrownum = context.rowpanes[rowpane].last;
    for (colpane = 0; colpane < context.colpanes.length; colpane++) {
        for (colnum = context.colpanes[colpane].first; colnum <= context.colpanes[colpane].last; colnum++) {
            coord = SocialCalc.crToCoord(colnum, bottomrownum);
            cell = sheetobj.cells[coord];
            if (cell && cell.rowspan > 1) {
                rowneedsrefresh[bottomrownum] = true;
                continue;
            }
            coord = context.cellskip[SocialCalc.crToCoord(colnum, bottomrownum)];
            if (!coord) continue;
            rownum = context.coordToCR[coord].row - 0;
            if (rownum == bottomrownum || rownum < context.rowpanes[rowpane].first) continue;
            cell = sheetobj.cells[coord];
            if (cell && cell.rowspan > 1) rowneedsrefresh[rownum] = true;
        }
    }
    for (rownum in rowneedsrefresh) {
        newrow = context.RenderRow(rownum, rowpane);
        oldchild = tbodyobj.childNodes[toprow + (rownum - context.rowpanes[rowpane].first)];
        tbodyobj.replaceChild(newrow, oldchild);
    }
    return tableobj;
};

SocialCalc.InputBox = function(element, editor) {
    if (!element) return;
    this.element = element;
    this.editor = editor;
    this.inputEcho = null;
    editor.inputBox = this;
    element.onmousedown = SocialCalc.InputBoxOnMouseDown;
    editor.MoveECellCallback.formulabar = function(e) {
        if (e.state != "start") return;
        editor.inputBox.DisplayCellContents(e.ecell.coord);
    };
};

SocialCalc.InputBox.prototype.DisplayCellContents = function(coord) {
    SocialCalc.InputBoxDisplayCellContents(this, coord);
};

SocialCalc.InputBox.prototype.ShowInputBox = function(show) {
    this.editor.inputEcho.ShowInputEcho(show);
};

SocialCalc.InputBox.prototype.GetText = function() {
    return this.element.value;
};

SocialCalc.InputBox.prototype.SetText = function(newtext) {
    if (!this.element) return;
    this.element.value = newtext;
    this.editor.inputEcho.SetText(newtext + "_");
};

SocialCalc.InputBox.prototype.Focus = function() {
    SocialCalc.InputBoxFocus(this);
};

SocialCalc.InputBox.prototype.Blur = function() {
    return this.element.blur();
};

SocialCalc.InputBox.prototype.Select = function(t) {
    if (!this.element) return;
    switch (t) {
      case "end":
        if (document.selection && document.selection.createRange) {
            try {
                var range = document.selection.createRange().duplicate();
                range.moveToElementText(this.element);
                range.collapse(false);
                range.select();
            } catch (e) {
                if (this.element.selectionStart != undefined) {
                    this.element.selectionStart = this.element.value.length;
                    this.element.selectionEnd = this.element.value.length;
                }
            }
        } else if (this.element.selectionStart != undefined) {
            this.element.selectionStart = this.element.value.length;
            this.element.selectionEnd = this.element.value.length;
        }
        break;
    }
};

SocialCalc.InputBoxDisplayCellContents = function(inputbox, coord) {
    var scc = SocialCalc.Constants;
    if (!inputbox) return;
    if (!coord) coord = inputbox.editor.ecell.coord;
    var text = SocialCalc.GetCellContents(inputbox.editor.context.sheetobj, coord);
    if (text.indexOf("\n") != -1) {
        text = scc.s_inputboxdisplaymultilinetext;
        inputbox.element.disabled = true;
    } else if (inputbox.editor.ECellReadonly()) {
        inputbox.element.disabled = true;
    } else {
        inputbox.element.disabled = false;
    }
    inputbox.SetText(text);
};

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

SocialCalc.InputBoxOnMouseDown = function(e) {
    var editor = SocialCalc.Keyboard.focusTable;
    if (!editor) return true;
    var wval = editor.workingvalues;
    switch (editor.state) {
      case "start":
        editor.state = "inputboxdirect";
        wval.partialexpr = "";
        wval.ecoord = editor.ecell.coord;
        wval.erow = editor.ecell.row;
        wval.ecol = editor.ecell.col;
        editor.inputEcho.ShowInputEcho(true);
        break;

      case "input":
        wval.partialexpr = "";
        editor.MoveECell(wval.ecoord);
        editor.state = "inputboxdirect";
        SocialCalc.KeyboardFocus();
        break;

      case "inputboxdirect":
        break;
    }
};

SocialCalc.InputEcho = function(editor) {
    var scc = SocialCalc.Constants;
    this.editor = editor;
    this.text = "";
    this.interval = null;
    this.container = null;
    this.main = null;
    this.prompt = null;
    this.functionbox = null;
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
    SocialCalc.DragRegister(this.main, true, true, {
        MouseDown: SocialCalc.DragFunctionStart,
        MouseMove: SocialCalc.DragFunctionPosition,
        MouseUp: SocialCalc.DragFunctionPosition,
        Disabled: null,
        positionobj: this.container
    }, this.editor.toplevel);
    editor.toplevel.appendChild(this.container);
};

SocialCalc.InputEcho.prototype.ShowInputEcho = function(show) {
    return SocialCalc.ShowInputEcho(this, show);
};

SocialCalc.InputEcho.prototype.SetText = function(str) {
    return SocialCalc.SetInputEchoText(this, str);
};

SocialCalc.ShowInputEcho = function(inputecho, show) {
    var cell, position;
    var editor = inputecho.editor;
    if (!editor) return;
    if (show) {
        editor.cellhandles.ShowCellHandles(false);
        cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
        if (cell) {
            position = SocialCalc.GetElementPosition(cell.element);
            inputecho.container.style.left = position.left - 1 + "px";
            inputecho.container.style.top = position.top - 1 + "px";
        }
        inputecho.container.style.display = "block";
        if (inputecho.interval) window.clearInterval(inputecho.interval);
        inputecho.interval = window.setInterval(SocialCalc.InputEchoHeartbeat, 50);
    } else {
        if (inputecho.interval) window.clearInterval(inputecho.interval);
        inputecho.container.style.display = "none";
    }
};

SocialCalc.SetInputEchoText = function(inputecho, str) {
    var scc = SocialCalc.Constants;
    var fname, fstr;
    var newstr = SocialCalc.special_chars(str);
    newstr = newstr.replace(/\n/g, "<br>");
    if (inputecho.text != newstr) {
        inputecho.main.innerHTML = newstr;
        inputecho.text = newstr;
    }
    var parts = str.match(/.*[\+\-\*\/\&\^\<\>\=\,\(]([A-Za-z][A-Za-z][\w\.]*?)\([^\)]*$/);
    if (str.charAt(0) == "=" && parts) {
        fname = parts[1].toUpperCase();
        if (SocialCalc.Formula.FunctionList[fname]) {
            SocialCalc.Formula.FillFunctionInfo();
            fstr = SocialCalc.special_chars(fname + "(" + SocialCalc.Formula.FunctionArgString(fname) + ")");
        } else {
            fstr = scc.ietUnknownFunction + fname;
        }
        if (inputecho.prompt.innerHTML != fstr) {
            inputecho.prompt.innerHTML = fstr;
            inputecho.prompt.style.display = "block";
        }
    } else if (inputecho.prompt.style.display != "none") {
        inputecho.prompt.innerHTML = "";
        inputecho.prompt.style.display = "none";
    }
};

SocialCalc.InputEchoHeartbeat = function() {
    var editor = SocialCalc.Keyboard.focusTable;
    if (!editor) return true;
    editor.inputEcho.SetText(editor.inputBox.GetText() + "_");
};

SocialCalc.InputEchoMouseDown = function(e) {
    var event = e || window.event;
    var editor = SocialCalc.Keyboard.focusTable;
    if (!editor) return true;
    editor.inputBox.element.focus();
};

SocialCalc.CellHandles = function(editor) {
    var scc = SocialCalc.Constants;
    var functions;
    if (editor.noEdit) return;
    this.editor = editor;
    this.noCursorSuffix = false;
    this.movedmouse = false;
    this.draghandle = document.createElement("div");
    SocialCalc.setStyles(this.draghandle, "display:none;position:absolute;zIndex:8;border:1px solid white;width:4px;height:4px;fontSize:1px;backgroundColor:#0E93D8;cursor:default;");
    this.draghandle.innerHTML = "&nbsp;";
    editor.toplevel.appendChild(this.draghandle);
    SocialCalc.AssignID(editor, this.draghandle, "draghandle");
    var imagetype = "png";
    if (navigator.userAgent.match(/MSIE 6\.0/)) {
        imagetype = "gif";
    }
    this.dragpalette = document.createElement("div");
    SocialCalc.setStyles(this.dragpalette, "display:none;position:absolute;zIndex:8;width:90px;height:90px;fontSize:1px;textAlign:center;cursor:default;" + "backgroundImage:url(" + SocialCalc.Constants.defaultImagePrefix + "drag-handles." + imagetype + ");");
    this.dragpalette.innerHTML = "&nbsp;";
    editor.toplevel.appendChild(this.dragpalette);
    SocialCalc.AssignID(editor, this.dragpalette, "dragpalette");
    this.dragtooltip = document.createElement("div");
    SocialCalc.setStyles(this.dragtooltip, "display:none;position:absolute;zIndex:9;border:1px solid black;width:100px;height:auto;fontSize:10px;backgroundColor:#FFFFFF;");
    this.dragtooltip.innerHTML = "&nbsp;";
    editor.toplevel.appendChild(this.dragtooltip);
    SocialCalc.AssignID(editor, this.dragtooltip, "dragtooltip");
    this.fillinghandle = document.createElement("div");
    SocialCalc.setStyles(this.fillinghandle, "display:none;position:absolute;zIndex:9;border:1px solid black;width:auto;height:14px;fontSize:10px;backgroundColor:#FFFFFF;");
    this.fillinghandle.innerHTML = "&nbsp;";
    editor.toplevel.appendChild(this.fillinghandle);
    SocialCalc.AssignID(editor, this.fillinghandle, "fillinghandle");
    if (this.draghandle.addEventListener) {
        this.draghandle.addEventListener("mousemove", SocialCalc.CellHandlesMouseMoveOnHandle, false);
        this.dragpalette.addEventListener("mousedown", SocialCalc.CellHandlesMouseDown, false);
        this.dragpalette.addEventListener("mousemove", SocialCalc.CellHandlesMouseMoveOnHandle, false);
    } else if (this.draghandle.attachEvent) {
        this.draghandle.attachEvent("onmousemove", SocialCalc.CellHandlesMouseMoveOnHandle);
        this.dragpalette.attachEvent("onmousedown", SocialCalc.CellHandlesMouseDown);
        this.dragpalette.attachEvent("onmousemove", SocialCalc.CellHandlesMouseMoveOnHandle);
    } else {
        throw "Browser not supported";
    }
};

SocialCalc.CellHandles.prototype.ShowCellHandles = function(show, moveshow) {
    return SocialCalc.ShowCellHandles(this, show, moveshow);
};

SocialCalc.ShowCellHandles = function(cellhandles, show, moveshow) {
    var cell, cell2, position, position2;
    var editor = cellhandles.editor;
    var doshow = false;
    var row, col;
    var colinc = 1, rowinc = 1;
    if (!editor) return;
    do {
        if (!show) break;
        row = editor.ecell.row;
        col = editor.ecell.col;
        if (editor.state != "start") break;
        if (row >= editor.lastvisiblerow) break;
        if (col >= editor.lastvisiblecol) break;
        if (row < editor.firstscrollingrow) break;
        if (col < editor.firstscrollingcol) break;
        while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col + colinc)] == "yes") {
            colinc++;
        }
        while (editor.context.sheetobj.rowattribs.hide[row + rowinc] == "yes") {
            rowinc++;
        }
        cell = editor.context.sheetobj.cells[SocialCalc.crToCoord(col + colinc - 1, row + rowinc - 1)];
        if (typeof cell != "undefined") {
            colinc += (cell.colspan || 1) - 1;
            rowinc += (cell.rowspan || 1) - 1;
        }
        if (editor.rowpositions[row + rowinc] + 20 > editor.horizontaltablecontrol.controlborder) {
            break;
        }
        if (editor.rowpositions[row + rowinc] - 10 < editor.headposition.top) {
            break;
        }
        if (editor.colpositions[col + colinc] + 20 > editor.verticaltablecontrol.controlborder) {
            break;
        }
        if (editor.colpositions[col + colinc] - 30 < editor.headposition.left) {
            break;
        }
        cellhandles.draghandle.style.left = editor.colpositions[col + colinc] - 1 + "px";
        cellhandles.draghandle.style.top = editor.rowpositions[row + rowinc] - 1 + "px";
        cellhandles.draghandle.style.display = "block";
        if (moveshow) {
            cellhandles.draghandle.style.display = "none";
            cellhandles.dragpalette.style.left = editor.colpositions[col + colinc] - 45 + "px";
            cellhandles.dragpalette.style.top = editor.rowpositions[row + rowinc] - 45 + "px";
            cellhandles.dragpalette.style.display = "block";
            cellhandles.dragtooltip.style.left = editor.colpositions[col + colinc] - 45 + "px";
            cellhandles.dragtooltip.style.top = editor.rowpositions[row + rowinc] + 45 + "px";
            cellhandles.dragtooltip.style.display = "none";
        }
        doshow = true;
    } while (false);
    if (!doshow) {
        cellhandles.draghandle.style.display = "none";
    }
    if (!moveshow) {
        cellhandles.dragpalette.style.display = "none";
        cellhandles.dragtooltip.style.display = "none";
    }
};

SocialCalc.CellHandlesMouseMoveOnHandle = function(e) {
    var scc = SocialCalc.Constants;
    var event = e || window.event;
    var target = event.target || event.srcElement;
    var editor = SocialCalc.Keyboard.focusTable;
    if (!editor) return true;
    var cellhandles = editor.cellhandles;
    if (!cellhandles.editor) return true;
    var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
    var clientX = event.clientX - pos.left;
    var clientY = event.clientY - pos.top;
    if (!editor.cellhandles.mouseDown) {
        editor.cellhandles.ShowCellHandles(true, true);
        if (target == cellhandles.dragpalette) {
            var whichhandle = SocialCalc.SegmentDivHit([ scc.CH_radius1, scc.CH_radius2 ], editor.cellhandles.dragpalette, clientX, clientY);
            if (whichhandle == 0) {
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
        cellhandles.timer = window.setTimeout(SocialCalc.CellHandlesHoverTimeout, 3e3);
    }
    return;
};

SocialCalc.SegmentDivHit = function(segtable, divWithMouseHit, x, y) {
    var width = divWithMouseHit.offsetWidth;
    var height = divWithMouseHit.offsetHeight;
    var left = divWithMouseHit.offsetLeft;
    var top = divWithMouseHit.offsetTop;
    var v = 0;
    var table = segtable;
    var len = Math.sqrt(Math.pow(x - left - (width / 2 - .5), 2) + Math.pow(y - top - (height / 2 - .5), 2));
    if (table.length == 2) {
        if (x >= left && x < left + width / 2 && y >= top && y < top + height / 2) {
            if (len <= segtable[0]) v = -1; else if (len <= segtable[1]) v = 1;
        }
        if (x >= left + width / 2 && x < left + width && y >= top && y < top + height / 2) {
            if (len <= segtable[0]) v = -2; else if (len <= segtable[1]) v = 2;
        }
        if (x >= left + width / 2 && x < left + width && y >= top + height / 2 && y < top + height) {
            if (len <= segtable[0]) v = -3; else if (len <= segtable[1]) v = 3;
        }
        if (x >= left && x < left + width / 2 && y >= top + height / 2 && y < top + height) {
            if (len <= segtable[0]) v = -4; else if (len <= segtable[1]) v = 4;
        }
        return v;
    }
    while (true) {
        if (x >= left && x < left + width / 2 && y >= top && y < top + height / 2) {
            quadrant += "1";
            v = table[0];
            if (typeof v == "number") {
                break;
            }
            table = v;
            width = width / 2;
            height = height / 2;
            continue;
        }
        if (x >= left + width / 2 && x < left + width && y >= top && y < top + height / 2) {
            quadrant += "2";
            v = table[1];
            if (typeof v == "number") {
                break;
            }
            table = v;
            width = width / 2;
            left = left + width;
            height = height / 2;
            continue;
        }
        if (x >= left + width / 2 && x < left + width && y >= top + height / 2 && y < top + height) {
            quadrant += "3";
            v = table[2];
            if (typeof v == "number") {
                break;
            }
            table = v;
            width = width / 2;
            left = left + width;
            height = height / 2;
            top = top + height;
            continue;
        }
        if (x >= left && x < left + width / 2 && y >= top + height / 2 && y < top + height) {
            quadrant += "4";
            v = table[3];
            if (typeof v == "number") {
                break;
            }
            table = v;
            width = width / 2;
            height = height / 2;
            top = top + height;
            continue;
        }
        return 0;
    }
    return v;
};

SocialCalc.CellHandlesHoverTimeout = function() {
    editor = SocialCalc.Keyboard.focusTable;
    if (!editor) return true;
    var cellhandles = editor.cellhandles;
    if (cellhandles.timer) {
        window.clearTimeout(cellhandles.timer);
        cellhandles.timer = null;
    }
    if (cellhandles.tooltipstimer) {
        window.clearTimeout(cellhandles.tooltipstimer);
        cellhandles.tooltipstimer = null;
    }
    editor.cellhandles.ShowCellHandles(true, false);
};

SocialCalc.CellHandlesTooltipsTimeout = function() {
    editor = SocialCalc.Keyboard.focusTable;
    if (!editor) return true;
    var cellhandles = editor.cellhandles;
    if (cellhandles.tooltipstimer) {
        window.clearTimeout(cellhandles.tooltipstimer);
        cellhandles.tooltipstimer = null;
    }
    var whichhandle = cellhandles.tooltipswhichhandle;
    if (whichhandle == 0) {
        SocialCalc.CellHandlesHoverTimeout();
        return;
    }
    if (whichhandle == -3) {
        cellhandles.dragtooltip.innerHTML = scc.s_CHfillAllTooltip;
    } else if (whichhandle == 3) {
        cellhandles.dragtooltip.innerHTML = scc.s_CHfillContentsTooltip;
    } else if (whichhandle == -2) {
        cellhandles.dragtooltip.innerHTML = scc.s_CHmovePasteAllTooltip;
    } else if (whichhandle == -4) {
        cellhandles.dragtooltip.innerHTML = scc.s_CHmoveInsertAllTooltip;
    } else if (whichhandle == 2) {
        cellhandles.dragtooltip.innerHTML = scc.s_CHmovePasteContentsTooltip;
    } else if (whichhandle == 4) {
        cellhandles.dragtooltip.innerHTML = scc.s_CHmoveInsertContentsTooltip;
    } else {
        cellhandles.dragtooltip.innerHTML = "&nbsp;";
        cellhandles.dragtooltip.style.display = "none";
        return;
    }
    cellhandles.dragtooltip.style.display = "block";
};

SocialCalc.CellHandlesMouseDown = function(e) {
    var scc = SocialCalc.Constants;
    var editor, result, coord, textarea, wval, range;
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    editor = SocialCalc.Keyboard.focusTable;
    if (!editor) return true;
    if (editor.busy) return;
    var cellhandles = editor.cellhandles;
    cellhandles.movedmouse = false;
    var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
    var clientX = event.clientX - pos.left;
    var clientY = event.clientY - pos.top;
    if (cellhandles.timer) {
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
    var whichhandle = SocialCalc.SegmentDivHit([ scc.CH_radius1, scc.CH_radius2 ], editor.cellhandles.dragpalette, clientX, clientY);
    if (whichhandle == 1 || whichhandle == -1 || whichhandle == 0) {
        cellhandles.ShowCellHandles(true, false);
        return;
    }
    mouseinfo.ignore = true;
    if (whichhandle == -3) {
        cellhandles.dragtype = "Fill";
        cellhandles.noCursorSuffix = false;
    } else if (whichhandle == 3) {
        cellhandles.dragtype = "FillC";
        cellhandles.noCursorSuffix = false;
    } else if (whichhandle == -2) {
        cellhandles.dragtype = "Move";
        cellhandles.noCursorSuffix = true;
    } else if (whichhandle == -4) {
        cellhandles.dragtype = "MoveI";
        cellhandles.noCursorSuffix = false;
    } else if (whichhandle == 2) {
        cellhandles.dragtype = "MoveC";
        cellhandles.noCursorSuffix = true;
    } else if (whichhandle == 4) {
        cellhandles.dragtype = "MoveIC";
        cellhandles.noCursorSuffix = false;
    }
    cellhandles.filltype = null;
    switch (cellhandles.dragtype) {
      case "Fill":
      case "FillC":
        if (!range.hasrange) {
            editor.RangeAnchor();
        }
        editor.range2.top = editor.range.top;
        editor.range2.right = editor.range.right;
        editor.range2.bottom = editor.range.bottom;
        editor.range2.left = editor.range.left;
        editor.range2.hasrange = true;
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
        return;
    }
    cellhandles.fillinghandle.style.left = clientX + "px";
    cellhandles.fillinghandle.style.top = clientY - 17 + "px";
    cellhandles.fillinghandle.innerHTML = scc.s_CHindicatorOperationLookup[cellhandles.dragtype] + (scc.s_CHindicatorDirectionLookup[editor.cellhandles.filltype] || "");
    cellhandles.fillinghandle.style.display = "block";
    cellhandles.ShowCellHandles(true, false);
    cellhandles.mouseDown = true;
    mouseinfo.editor = editor;
    coord = editor.ecell.coord;
    cellhandles.startingcoord = coord;
    cellhandles.startingX = clientX;
    cellhandles.startingY = clientY;
    mouseinfo.mouselastcoord = coord;
    SocialCalc.KeyboardSetFocus(editor);
    if (document.addEventListener) {
        document.addEventListener("mousemove", SocialCalc.CellHandlesMouseMove, true);
        document.addEventListener("mouseup", SocialCalc.CellHandlesMouseUp, true);
    } else if (cellhandles.draghandle.attachEvent) {
        cellhandles.draghandle.setCapture();
        cellhandles.draghandle.attachEvent("onmousemove", SocialCalc.CellHandlesMouseMove);
        cellhandles.draghandle.attachEvent("onmouseup", SocialCalc.CellHandlesMouseUp);
        cellhandles.draghandle.attachEvent("onlosecapture", SocialCalc.CellHandlesMouseUp);
    }
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    return;
};

SocialCalc.CellHandlesMouseMove = function(e) {
    var scc = SocialCalc.Constants;
    var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval;
    var crstart, crend, cr, c, r;
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    editor = mouseinfo.editor;
    if (!editor) return;
    var cellhandles = editor.cellhandles;
    element = mouseinfo.element;
    var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
    var clientX = event.clientX - pos.left;
    var clientY = event.clientY - pos.top;
    result = SocialCalc.GridMousePosition(editor, clientX, clientY);
    if (!result) return;
    if (result && !result.coord) {
        SocialCalc.SetDragAutoRepeat(editor, result, SocialCalc.CellHandlesDragAutoRepeat);
        return;
    }
    SocialCalc.SetDragAutoRepeat(editor, null);
    if (!result.coord) return;
    crstart = SocialCalc.coordToCr(editor.cellhandles.startingcoord);
    crend = SocialCalc.coordToCr(result.coord);
    cellhandles.movedmouse = true;
    switch (cellhandles.dragtype) {
      case "Fill":
      case "FillC":
        if (result.coord == cellhandles.startingcoord) {
            cellhandles.filltype = null;
            cellhandles.startingX = clientX;
            cellhandles.startingY = clientY;
        } else {
            if (cellhandles.filltype) {
                if (cellhandles.filltype == "Down") {
                    crend.col = crstart.col;
                    if (crend.row < crstart.row) crend.row = crstart.row;
                } else {
                    crend.row = crstart.row;
                    if (crend.col < crstart.col) crend.col = crstart.col;
                }
            } else {
                if (Math.abs(clientY - cellhandles.startingY) > 10) {
                    cellhandles.filltype = "Down";
                } else if (Math.abs(clientX - cellhandles.startingX) > 10) {
                    cellhandles.filltype = "Right";
                }
                crend.col = crstart.col;
                crend.row = crstart.row;
            }
        }
        result.coord = SocialCalc.crToCoord(crend.col, crend.row);
        if (result.coord != mouseinfo.mouselastcoord) {
            editor.MoveECell(result.coord);
            editor.RangeExtend();
        }
        break;

      case "Move":
      case "MoveC":
        if (result.coord != mouseinfo.mouselastcoord) {
            editor.MoveECell(result.coord);
            c = editor.range2.right - editor.range2.left + result.col;
            r = editor.range2.bottom - editor.range2.top + result.row;
            editor.RangeAnchor(SocialCalc.crToCoord(c, r));
            editor.RangeExtend();
        }
        break;

      case "MoveI":
      case "MoveIC":
        if (result.coord == cellhandles.startingcoord) {
            cellhandles.filltype = null;
            cellhandles.startingX = clientX;
            cellhandles.startingY = clientY;
        } else {
            if (cellhandles.filltype) {
                if (cellhandles.filltype == "Vertical") {
                    crend.col = editor.range2.left;
                    if (crend.row >= editor.range2.top && crend.row <= editor.range2.bottom + 1) crend.row = editor.range2.bottom + 2;
                } else {
                    crend.row = editor.range2.top;
                    if (crend.col >= editor.range2.left && crend.col <= editor.range2.right + 1) crend.col = editor.range2.right + 2;
                }
            } else {
                if (Math.abs(clientY - cellhandles.startingY) > 10) {
                    cellhandles.filltype = "Vertical";
                } else if (Math.abs(clientX - cellhandles.startingX) > 10) {
                    cellhandles.filltype = "Horizontal";
                }
                crend.col = crstart.col;
                crend.row = crstart.row;
            }
        }
        result.coord = SocialCalc.crToCoord(crend.col, crend.row);
        if (result.coord != mouseinfo.mouselastcoord) {
            editor.MoveECell(result.coord);
            if (!cellhandles.filltype) {
                editor.RangeRemove();
            } else {
                c = editor.range2.right - editor.range2.left + crend.col;
                r = editor.range2.bottom - editor.range2.top + crend.row;
                editor.RangeAnchor(SocialCalc.crToCoord(c, r));
                editor.RangeExtend();
            }
        }
        break;
    }
    cellhandles.fillinghandle.style.left = clientX + "px";
    cellhandles.fillinghandle.style.top = clientY - 17 + "px";
    cellhandles.fillinghandle.innerHTML = scc.s_CHindicatorOperationLookup[cellhandles.dragtype] + (scc.s_CHindicatorDirectionLookup[editor.cellhandles.filltype] || "");
    cellhandles.fillinghandle.style.display = "block";
    mouseinfo.mouselastcoord = result.coord;
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    return;
};

SocialCalc.CellHandlesDragAutoRepeat = function(coord, direction) {
    var mouseinfo = SocialCalc.EditorMouseInfo;
    var editor = mouseinfo.editor;
    if (!editor) return;
    var cellhandles = editor.cellhandles;
    var crstart = SocialCalc.coordToCr(editor.cellhandles.startingcoord);
    var crend = SocialCalc.coordToCr(coord);
    var newcoord, c, r;
    var vscroll = 0;
    var hscroll = 0;
    if (direction == "left") hscroll = -1; else if (direction == "right") hscroll = 1; else if (direction == "up") vscroll = -1; else if (direction == "down") vscroll = 1;
    editor.ScrollRelativeBoth(vscroll, hscroll);
    switch (cellhandles.dragtype) {
      case "Fill":
      case "FillC":
        if (cellhandles.filltype) {
            if (cellhandles.filltype == "Down") {
                crend.col = crstart.col;
                if (crend.row < crstart.row) crend.row = crstart.row;
            } else {
                crend.row = crstart.row;
                if (crend.col < crstart.col) crend.col = crstart.col;
            }
        } else {
            crend.col = crstart.col;
            crend.row = crstart.row;
        }
        newcoord = SocialCalc.crToCoord(crend.col, crend.row);
        if (newcoord != mouseinfo.mouselastcoord) {
            editor.MoveECell(coord);
            editor.RangeExtend();
        }
        break;

      case "Move":
      case "MoveC":
        if (coord != mouseinfo.mouselastcoord) {
            editor.MoveECell(coord);
            c = editor.range2.right - editor.range2.left + editor.ecell.col;
            r = editor.range2.bottom - editor.range2.top + editor.ecell.row;
            editor.RangeAnchor(SocialCalc.crToCoord(c, r));
            editor.RangeExtend();
        }
        break;

      case "MoveI":
      case "MoveIC":
        if (cellhandles.filltype) {
            if (cellhandles.filltype == "Vertical") {
                crend.col = editor.range2.left;
                if (crend.row >= editor.range2.top && crend.row <= editor.range2.bottom + 1) crend.row = editor.range2.bottom + 2;
            } else {
                crend.row = editor.range2.top;
                if (crend.col >= editor.range2.left && crend.col <= editor.range2.right + 1) crend.col = editor.range2.right + 2;
            }
        } else {
            crend.col = crstart.col;
            crend.row = crstart.row;
        }
        newcoord = SocialCalc.crToCoord(crend.col, crend.row);
        if (newcoord != mouseinfo.mouselastcoord) {
            editor.MoveECell(newcoord);
            c = editor.range2.right - editor.range2.left + crend.col;
            r = editor.range2.bottom - editor.range2.top + crend.row;
            editor.RangeAnchor(SocialCalc.crToCoord(c, r));
            editor.RangeExtend();
        }
        break;
    }
    mouseinfo.mouselastcoord = newcoord;
};

SocialCalc.CellHandlesMouseUp = function(e) {
    var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval, cstr, cmdtype, cmdtype2;
    var crstart, crend;
    var sizec, sizer, deltac, deltar;
    var event = e || window.event;
    var mouseinfo = SocialCalc.EditorMouseInfo;
    editor = mouseinfo.editor;
    if (!editor) return;
    var cellhandles = editor.cellhandles;
    element = mouseinfo.element;
    mouseinfo.ignore = false;
    var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel);
    var clientX = event.clientX - pos.left;
    var clientY = event.clientY - pos.top;
    result = SocialCalc.GridMousePosition(editor, clientX, clientY);
    SocialCalc.SetDragAutoRepeat(editor, null);
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
    if (!cellhandles.movedmouse) {
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
            if (cellhandles.filltype == "Down") {
                crend.col = crstart.col;
            } else {
                crend.row = crstart.row;
            }
        }
        result.coord = SocialCalc.crToCoord(crend.col, crend.row);
        editor.MoveECell(result.coord);
        editor.RangeExtend();
        if (editor.cellhandles.filltype == "Right") {
            cmdtype = "right";
        } else {
            cmdtype = "down";
        }
        cstr = "fill" + cmdtype + " " + SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom) + cmdtype2;
        editor.EditorScheduleSheetCommands(cstr, true, false);
        break;

      case "Move":
      case "MoveC":
        editor.context.cursorsuffix = "";
        cstr = "movepaste " + SocialCalc.crToCoord(editor.range2.left, editor.range2.top) + ":" + SocialCalc.crToCoord(editor.range2.right, editor.range2.bottom) + " " + editor.ecell.coord + cmdtype2;
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
        cstr = "moveinsert " + SocialCalc.crToCoord(editor.range2.left, editor.range2.top) + ":" + SocialCalc.crToCoord(editor.range2.right, editor.range2.bottom) + " " + editor.ecell.coord + cmdtype2;
        editor.EditorScheduleSheetCommands(cstr, true, false);
        editor.Range2Remove();
        editor.RangeRemove();
        if (editor.cellhandles.filltype == " Horizontal" && deltac > 0) {
            editor.MoveECell(SocialCalc.crToCoord(editor.ecell.col - sizec - 1, editor.ecell.row));
        } else if (editor.cellhandles.filltype == " Vertical" && deltar > 0) {
            editor.MoveECell(SocialCalc.crToCoord(editor.ecell.col, editor.ecell.row - sizer - 1));
        }
        editor.RangeAnchor(SocialCalc.crToCoord(editor.ecell.col + sizec, editor.ecell.row + sizer));
        editor.RangeExtend();
        break;
    }
    if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    if (document.removeEventListener) {
        document.removeEventListener("mousemove", SocialCalc.CellHandlesMouseMove, true);
        document.removeEventListener("mouseup", SocialCalc.CellHandlesMouseUp, true);
    } else if (cellhandles.draghandle.detachEvent) {
        cellhandles.draghandle.detachEvent("onlosecapture", SocialCalc.CellHandlesMouseUp);
        cellhandles.draghandle.detachEvent("onmouseup", SocialCalc.CellHandlesMouseUp);
        cellhandles.draghandle.detachEvent("onmousemove", SocialCalc.CellHandlesMouseMove);
        cellhandles.draghandle.releaseCapture();
    }
    mouseinfo.editor = null;
    return false;
};

SocialCalc.TableControl = function(editor, vertical, size) {
    var scc = SocialCalc.Constants;
    this.editor = editor;
    this.vertical = vertical;
    this.size = size;
    this.main = null;
    this.endcap = null;
    this.paneslider = null;
    this.lessbutton = null;
    this.morebutton = null;
    this.scrollarea = null;
    this.thumb = null;
    this.controlborder = null;
    this.endcapstart = null;
    this.panesliderstart = null;
    this.lessbuttonstart = null;
    this.morebuttonstart = null;
    this.scrollareastart = null;
    this.scrollareaend = null;
    this.scrollareasize = null;
    this.thumbpos = null;
    this.controlthickness = scc.defaultTableControlThickness;
    this.sliderthickness = scc.defaultTCSliderThickness;
    this.buttonthickness = scc.defaultTCButtonThickness;
    this.thumbthickness = scc.defaultTCThumbThickness;
    this.minscrollingpanesize = this.buttonthickness + this.buttonthickness + this.thumbthickness + 20;
};

SocialCalc.TableControl.prototype.CreateTableControl = function() {
    return SocialCalc.CreateTableControl(this);
};

SocialCalc.TableControl.prototype.PositionTableControlElements = function() {
    SocialCalc.PositionTableControlElements(this);
};

SocialCalc.TableControl.prototype.ComputeTableControlPositions = function() {
    SocialCalc.ComputeTableControlPositions(this);
};

SocialCalc.CreateTableControl = function(control) {
    var s, functions, params;
    var AssignID = SocialCalc.AssignID;
    var setStyles = SocialCalc.setStyles;
    var scc = SocialCalc.Constants;
    var TooltipRegister = function(element, etype, vh) {
        if (scc["s_" + etype + "Tooltip" + vh]) {
            SocialCalc.TooltipRegister(element, scc["s_" + etype + "Tooltip" + vh], null, control.editor.toplevel);
        }
    };
    var imageprefix = control.editor.imageprefix;
    var vh = control.vertical ? "v" : "h";
    control.main = document.createElement("div");
    s = control.main.style;
    s.height = (control.vertical ? control.size : control.controlthickness) + "px";
    s.width = (control.vertical ? control.controlthickness : control.size) + "px";
    s.zIndex = 0;
    setStyles(control.main, scc.TCmainStyle);
    s.backgroundImage = "url(" + imageprefix + "main-" + vh + ".gif)";
    if (scc.TCmainClass) control.main.className = scc.TCmainClass;
    control.main.style.display = "none";
    control.endcap = document.createElement("div");
    s = control.endcap.style;
    s.height = control.controlthickness + "px";
    s.width = control.controlthickness + "px";
    s.zIndex = 1;
    s.overflow = "hidden";
    s.position = "absolute";
    setStyles(control.endcap, scc.TCendcapStyle);
    s.backgroundImage = "url(" + imageprefix + "endcap-" + vh + ".gif)";
    if (scc.TCendcapClass) control.endcap.className = scc.TCendcapClass;
    AssignID(control.editor, control.endcap, "endcap" + vh);
    control.main.appendChild(control.endcap);
    control.paneslider = document.createElement("div");
    s = control.paneslider.style;
    s.height = (control.vertical ? control.sliderthickness : control.controlthickness) + "px";
    s.overflow = "hidden";
    s.width = (control.vertical ? control.controlthickness : control.sliderthickness) + "px";
    s.position = "absolute";
    s[control.vertical ? "top" : "left"] = "4px";
    s.zIndex = 3;
    setStyles(control.paneslider, scc.TCpanesliderStyle);
    s.backgroundImage = "url(" + imageprefix + "paneslider-" + vh + ".gif)";
    if (scc.TCpanesliderClass) control.paneslider.className = scc.TCpanesliderClass;
    AssignID(control.editor, control.paneslider, "paneslider" + vh);
    TooltipRegister(control.paneslider, "paneslider", vh);
    functions = {
        MouseDown: SocialCalc.TCPSDragFunctionStart,
        MouseMove: SocialCalc.TCPSDragFunctionMove,
        MouseUp: SocialCalc.TCPSDragFunctionStop,
        Disabled: function() {
            return control.editor.busy;
        }
    };
    functions.control = control;
    SocialCalc.DragRegister(control.paneslider, control.vertical, !control.vertical, functions, control.editor.toplevel);
    control.main.appendChild(control.paneslider);
    control.lessbutton = document.createElement("div");
    s = control.lessbutton.style;
    s.height = (control.vertical ? control.buttonthickness : control.controlthickness) + "px";
    s.width = (control.vertical ? control.controlthickness : control.buttonthickness) + "px";
    s.zIndex = 2;
    s.overflow = "hidden";
    s.position = "absolute";
    setStyles(control.lessbutton, scc.TClessbuttonStyle);
    s.backgroundImage = "url(" + imageprefix + "less-" + vh + "n.gif)";
    if (scc.TClessbuttonClass) control.lessbutton.className = scc.TClessbuttonClass;
    AssignID(control.editor, control.lessbutton, "lessbutton" + vh);
    params = {
        repeatwait: scc.TClessbuttonRepeatWait,
        repeatinterval: scc.TClessbuttonRepeatInterval,
        normalstyle: "backgroundImage:url(" + imageprefix + "less-" + vh + "n.gif);",
        downstyle: "backgroundImage:url(" + imageprefix + "less-" + vh + "d.gif);",
        hoverstyle: "backgroundImage:url(" + imageprefix + "less-" + vh + "h.gif);"
    };
    functions = {
        MouseDown: function() {
            if (!control.editor.busy) control.editor.ScrollRelative(control.vertical, -1);
        },
        Repeat: function() {
            if (!control.editor.busy) control.editor.ScrollRelative(control.vertical, -1);
        },
        Disabled: function() {
            return control.editor.busy;
        }
    };
    SocialCalc.ButtonRegister(control.editor, control.lessbutton, params, functions);
    control.main.appendChild(control.lessbutton);
    control.morebutton = document.createElement("div");
    s = control.morebutton.style;
    s.height = (control.vertical ? control.buttonthickness : control.controlthickness) + "px";
    s.width = (control.vertical ? control.controlthickness : control.buttonthickness) + "px";
    s.zIndex = 2;
    s.overflow = "hidden";
    s.position = "absolute";
    setStyles(control.morebutton, scc.TCmorebuttonStyle);
    s.backgroundImage = "url(" + imageprefix + "more-" + vh + "n.gif)";
    if (scc.TCmorebuttonClass) control.morebutton.className = scc.TCmorebuttonClass;
    AssignID(control.editor, control.morebutton, "morebutton" + vh);
    params = {
        repeatwait: scc.TCmorebuttonRepeatWait,
        repeatinterval: scc.TCmorebuttonRepeatInterval,
        normalstyle: "backgroundImage:url(" + imageprefix + "more-" + vh + "n.gif);",
        downstyle: "backgroundImage:url(" + imageprefix + "more-" + vh + "d.gif);",
        hoverstyle: "backgroundImage:url(" + imageprefix + "more-" + vh + "h.gif);"
    };
    functions = {
        MouseDown: function() {
            if (!control.editor.busy) control.editor.ScrollRelative(control.vertical, +1);
        },
        Repeat: function() {
            if (!control.editor.busy) control.editor.ScrollRelative(control.vertical, +1);
        },
        Disabled: function() {
            return control.editor.busy;
        }
    };
    SocialCalc.ButtonRegister(control.editor, control.morebutton, params, functions);
    control.main.appendChild(control.morebutton);
    control.scrollarea = document.createElement("div");
    s = control.scrollarea.style;
    s.height = control.controlthickness + "px";
    s.width = control.controlthickness + "px";
    s.zIndex = 1;
    s.overflow = "hidden";
    s.position = "absolute";
    setStyles(control.scrollarea, scc.TCscrollareaStyle);
    s.backgroundImage = "url(" + imageprefix + "scrollarea-" + vh + ".gif)";
    if (scc.TCscrollareaClass) control.scrollarea.className = scc.TCscrollareaClass;
    AssignID(control.editor, control.scrollarea, "scrollarea" + vh);
    params = {
        repeatwait: scc.TCscrollareaRepeatWait,
        repeatinterval: scc.TCscrollareaRepeatWait
    };
    functions = {
        MouseDown: SocialCalc.ScrollAreaClick,
        Repeat: SocialCalc.ScrollAreaClick,
        Disabled: function() {
            return control.editor.busy;
        }
    };
    functions.control = control;
    SocialCalc.ButtonRegister(control.editor, control.scrollarea, params, functions);
    control.main.appendChild(control.scrollarea);
    control.thumb = document.createElement("div");
    s = control.thumb.style;
    s.height = (control.vertical ? control.thumbthickness : control.controlthickness) + "px";
    s.width = (control.vertical ? control.controlthickness : control.thumbthickness) + "px";
    s.zIndex = 2;
    s.overflow = "hidden";
    s.position = "absolute";
    setStyles(control.thumb, scc.TCthumbStyle);
    control.thumb.style.backgroundImage = "url(" + imageprefix + "thumb-" + vh + "n.gif)";
    if (scc.TCthumbClass) control.thumb.className = scc.TCthumbClass;
    AssignID(control.editor, control.thumb, "thumb" + vh);
    functions = {
        MouseDown: SocialCalc.TCTDragFunctionStart,
        MouseMove: SocialCalc.TCTDragFunctionMove,
        MouseUp: SocialCalc.TCTDragFunctionStop,
        Disabled: function() {
            return control.editor.busy;
        }
    };
    functions.control = control;
    SocialCalc.DragRegister(control.thumb, control.vertical, !control.vertical, functions, control.editor.toplevel);
    params = {
        normalstyle: "backgroundImage:url(" + imageprefix + "thumb-" + vh + "n.gif)",
        name: "Thumb",
        downstyle: "backgroundImage:url(" + imageprefix + "thumb-" + vh + "d.gif)",
        hoverstyle: "backgroundImage:url(" + imageprefix + "thumb-" + vh + "h.gif)"
    };
    SocialCalc.ButtonRegister(control.editor, control.thumb, params, null);
    control.main.appendChild(control.thumb);
    return control.main;
};

SocialCalc.ScrollAreaClick = function(e, buttoninfo, bobj) {
    var control = bobj.functionobj.control;
    var pos = SocialCalc.GetElementPositionWithScroll(control.editor.toplevel);
    var clickpos = control.vertical ? buttoninfo.clientY - pos.top : buttoninfo.clientX - pos.left;
    if (control.editor.busy) {
        return;
    }
    control.editor.PageRelative(control.vertical, clickpos > control.thumbpos ? 1 : -1);
    return;
};

SocialCalc.PositionTableControlElements = function(control) {
    var border, realend, thumbpos;
    var editor = control.editor;
    if (control.vertical) {
        border = control.controlborder + "px";
        control.endcap.style.top = control.endcapstart + "px";
        control.endcap.style.left = border;
        control.paneslider.style.top = control.panesliderstart + "px";
        control.paneslider.style.left = border;
        control.lessbutton.style.top = control.lessbuttonstart + "px";
        control.lessbutton.style.left = border;
        control.morebutton.style.top = control.morebuttonstart + "px";
        control.morebutton.style.left = border;
        control.scrollarea.style.top = control.scrollareastart + "px";
        control.scrollarea.style.left = border;
        control.scrollarea.style.height = control.scrollareasize + "px";
        realend = Math.max(editor.context.sheetobj.attribs.lastrow, editor.firstscrollingrow + 1);
        thumbpos = (editor.firstscrollingrow - (editor.lastnonscrollingrow + 1)) * (control.scrollareasize - 3 * control.thumbthickness) / (realend - (editor.lastnonscrollingrow + 1)) + control.scrollareastart - 1;
        thumbpos = Math.floor(thumbpos);
        control.thumb.style.top = thumbpos + "px";
        control.thumb.style.left = border;
    } else {
        border = control.controlborder + "px";
        control.endcap.style.left = control.endcapstart + "px";
        control.endcap.style.top = border;
        control.paneslider.style.left = control.panesliderstart + "px";
        control.paneslider.style.top = border;
        control.lessbutton.style.left = control.lessbuttonstart + "px";
        control.lessbutton.style.top = border;
        control.morebutton.style.left = control.morebuttonstart + "px";
        control.morebutton.style.top = border;
        control.scrollarea.style.left = control.scrollareastart + "px";
        control.scrollarea.style.top = border;
        control.scrollarea.style.width = control.scrollareasize + "px";
        realend = Math.max(editor.context.sheetobj.attribs.lastcol, editor.firstscrollingcol + 1);
        thumbpos = (editor.firstscrollingcol - (editor.lastnonscrollingcol + 1)) * (control.scrollareasize - control.thumbthickness) / (realend - editor.lastnonscrollingcol) + control.scrollareastart - 1;
        thumbpos = Math.floor(thumbpos);
        control.thumb.style.left = thumbpos + "px";
        control.thumb.style.top = border;
    }
    control.thumbpos = thumbpos;
    control.main.style.display = "block";
};

SocialCalc.ComputeTableControlPositions = function(control) {
    var editor = control.editor;
    if (!editor.gridposition || !editor.headposition) throw "Can't compute table control positions before editor positions";
    if (control.vertical) {
        control.controlborder = editor.gridposition.left + editor.tablewidth;
        control.endcapstart = editor.gridposition.top;
        control.panesliderstart = editor.firstscrollingrowtop - control.sliderthickness;
        control.lessbuttonstart = editor.firstscrollingrowtop - 1;
        control.morebuttonstart = editor.gridposition.top + editor.tableheight - control.buttonthickness;
        control.scrollareastart = editor.firstscrollingrowtop - 1 + control.buttonthickness;
        control.scrollareaend = control.morebuttonstart - 1;
        control.scrollareasize = control.scrollareaend - control.scrollareastart + 1;
    } else {
        control.controlborder = editor.gridposition.top + editor.tableheight;
        control.endcapstart = editor.gridposition.left;
        control.panesliderstart = editor.firstscrollingcolleft - control.sliderthickness;
        control.lessbuttonstart = editor.firstscrollingcolleft - 1;
        control.morebuttonstart = editor.gridposition.left + editor.tablewidth - control.buttonthickness;
        control.scrollareastart = editor.firstscrollingcolleft - 1 + control.buttonthickness;
        control.scrollareaend = control.morebuttonstart - 1;
        control.scrollareasize = control.scrollareaend - control.scrollareastart + 1;
    }
};

SocialCalc.TCPSDragFunctionStart = function(event, draginfo, dobj) {
    var editor = dobj.functionobj.control.editor;
    var scc = SocialCalc.Constants;
    SocialCalc.DragFunctionStart(event, draginfo, dobj);
    draginfo.trackingline = document.createElement("div");
    draginfo.trackingline.style.height = dobj.vertical ? scc.TCPStrackinglineThickness : editor.tableheight - (editor.headposition.top - editor.gridposition.top) + "px";
    draginfo.trackingline.style.width = dobj.vertical ? editor.tablewidth - (editor.headposition.left - editor.gridposition.left) + "px" : scc.TCPStrackinglineThickness;
    draginfo.trackingline.style.backgroundImage = "url(" + editor.imageprefix + "trackingline-" + (dobj.vertical ? "v" : "h") + ".gif)";
    if (scc.TCPStrackinglineClass) draginfo.trackingline.className = scc.TCPStrackinglineClass;
    SocialCalc.setStyles(draginfo.trackingline, scc.TCPStrackinglineStyle);
    if (dobj.vertical) {
        row = SocialCalc.Lookup(draginfo.clientY + dobj.functionobj.control.sliderthickness, editor.rowpositions);
        draginfo.trackingline.style.top = (editor.rowpositions[row] || editor.headposition.top) + "px";
        draginfo.trackingline.style.left = editor.headposition.left + "px";
        draginfo.trackingline.id = "trackingline-vertical";
        if (editor.context.rowpanes.length - 1) {
            editor.context.SetRowPaneFirstLast(1, editor.context.rowpanes[0].last + 1, editor.context.rowpanes[0].last + 1);
            editor.FitToEditTable();
            editor.ScheduleRender();
        }
    } else {
        col = SocialCalc.Lookup(draginfo.clientX + dobj.functionobj.control.sliderthickness, editor.colpositions);
        draginfo.trackingline.style.top = editor.headposition.top + "px";
        draginfo.trackingline.style.left = (editor.colpositions[col] || editor.headposition.left) + "px";
        draginfo.trackingline.id = "trackingline-horizon";
        if (editor.context.colpanes.length - 1) {
            editor.context.SetColPaneFirstLast(1, editor.context.colpanes[0].last + 1, editor.context.colpanes[0].last + 1);
            editor.FitToEditTable();
            editor.ScheduleRender();
        }
    }
    editor.griddiv.appendChild(draginfo.trackingline);
};

SocialCalc.TCPSDragFunctionMove = function(event, draginfo, dobj) {
    var row, col, max, min;
    var control = dobj.functionobj.control;
    var sliderthickness = control.sliderthickness;
    var editor = control.editor;
    if (dobj.vertical) {
        max = control.morebuttonstart - control.minscrollingpanesize - draginfo.offsetY;
        if (draginfo.clientY > max) draginfo.clientY = max;
        min = editor.headposition.top - sliderthickness - draginfo.offsetY;
        if (draginfo.clientY < min) draginfo.clientY = min;
        row = SocialCalc.Lookup(draginfo.clientY + sliderthickness, editor.rowpositions);
        while (editor.context.sheetobj.rowattribs.hide[row] == "yes") {
            row++;
        }
        draginfo.trackingline.style.top = (editor.rowpositions[row] || editor.headposition.top) + "px";
    } else {
        max = control.morebuttonstart - control.minscrollingpanesize - draginfo.offsetX;
        if (draginfo.clientX > max) draginfo.clientX = max;
        min = editor.headposition.left - sliderthickness - draginfo.offsetX;
        if (draginfo.clientX < min) draginfo.clientX = min;
        col = SocialCalc.Lookup(draginfo.clientX + sliderthickness, editor.colpositions);
        while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == "yes") {
            col++;
        }
        draginfo.trackingline.style.left = (editor.colpositions[col] || editor.headposition.left) + "px";
    }
    SocialCalc.DragFunctionPosition(event, draginfo, dobj);
};

SocialCalc.TCPSDragFunctionStop = function(event, draginfo, dobj) {
    var row, col, max, min, dc;
    var control = dobj.functionobj.control;
    var sliderthickness = control.sliderthickness;
    var editor = control.editor;
    if (dobj.vertical) {
        max = control.morebuttonstart - control.minscrollingpanesize - draginfo.offsetY;
        if (draginfo.clientY > max) draginfo.clientY = max;
        min = editor.headposition.top - sliderthickness - draginfo.offsetY;
        if (draginfo.clientY < min) draginfo.clientY = min;
        row = SocialCalc.Lookup(draginfo.clientY + sliderthickness, editor.rowpositions);
        if (row > editor.context.sheetobj.attribs.lastrow) row = editor.context.sheetobj.attribs.lastrow;
        while (editor.context.sheetobj.rowattribs.hide[row] == "yes") {
            row++;
        }
        editor.EditorScheduleSheetCommands("pane row " + row, true, false);
    } else {
        max = control.morebuttonstart - control.minscrollingpanesize - draginfo.offsetX;
        if (draginfo.clientX > max) draginfo.clientX = max;
        min = editor.headposition.left - sliderthickness - draginfo.offsetX;
        if (draginfo.clientX < min) draginfo.clientX = min;
        col = SocialCalc.Lookup(draginfo.clientX + sliderthickness, editor.colpositions);
        if (col > editor.context.sheetobj.attribs.lastcol) col = editor.context.sheetobj.attribs.lastcol;
        while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == "yes") {
            col++;
        }
        editor.EditorScheduleSheetCommands("pane col " + col, true, false);
    }
};

SocialCalc.TCTDragFunctionStart = function(event, draginfo, dobj) {
    var rowpane, colpane, row, col;
    var control = dobj.functionobj.control;
    var editor = control.editor;
    var scc = SocialCalc.Constants;
    SocialCalc.DragFunctionStart(event, draginfo, dobj);
    if (draginfo.thumbstatus) {
        if (draginfo.thumbstatus.rowmsgele) draginfo.thumbstatus.rowmsgele = null;
        if (draginfo.thumbstatus.rowpreviewele) draginfo.thumbstatus.rowpreviewele = null;
        editor.toplevel.removeChild(draginfo.thumbstatus);
        draginfo.thumbstatus = null;
    }
    draginfo.thumbstatus = document.createElement("div");
    if (dobj.vertical) {
        if (scc.TCTDFSthumbstatusvClass) draginfo.thumbstatus.className = scc.TCTDFSthumbstatusvClass;
        SocialCalc.setStyles(draginfo.thumbstatus, scc.TCTDFSthumbstatusvStyle);
        draginfo.thumbstatus.style.top = draginfo.clientY + scc.TCTDFStopOffsetv + "px";
        draginfo.thumbstatus.style.left = control.controlborder - 10 - editor.tablewidth / 2 + "px";
        draginfo.thumbstatus.style.width = editor.tablewidth / 2 + "px";
        draginfo.thumbcontext = new SocialCalc.RenderContext(editor.context.sheetobj);
        draginfo.thumbcontext.showGrid = true;
        draginfo.thumbcontext.rowpanes = [ {
            first: 1,
            last: 1
        } ];
        var pane = editor.context.colpanes[editor.context.colpanes.length - 1];
        draginfo.thumbcontext.colpanes = [ {
            first: pane.first,
            last: pane.last
        } ];
        draginfo.thumbstatus.innerHTML = '<table cellspacing="0" cellpadding="0"><tr><td valign="top" style="' + scc.TCTDFSthumbstatusrownumStyle + '" class="' + scc.TCTDFSthumbstatusrownumClass + '"><div>msg</div></td><td valign="top"><div style="overflow:hidden;">preview</div></td></tr></table>';
        draginfo.thumbstatus.rowmsgele = draginfo.thumbstatus.firstChild.firstChild.firstChild.firstChild.firstChild;
        draginfo.thumbstatus.rowpreviewele = draginfo.thumbstatus.firstChild.firstChild.firstChild.childNodes[1].firstChild;
        editor.toplevel.appendChild(draginfo.thumbstatus);
        SocialCalc.TCTDragFunctionRowSetStatus(draginfo, editor, editor.firstscrollingrow || 1);
    } else {
        if (scc.TCTDFSthumbstatushClass) draginfo.thumbstatus.className = scc.TCTDFSthumbstatushClass;
        SocialCalc.setStyles(draginfo.thumbstatus, scc.TCTDFSthumbstatushStyle);
        draginfo.thumbstatus.style.top = control.controlborder + scc.TCTDFStopOffseth + "px";
        draginfo.thumbstatus.style.left = draginfo.clientX + scc.TCTDFSleftOffseth + "px";
        editor.toplevel.appendChild(draginfo.thumbstatus);
        draginfo.thumbstatus.innerHTML = scc.s_TCTDFthumbstatusPrefixh + SocialCalc.rcColname(editor.firstscrollingcol);
    }
};

SocialCalc.TCTDragFunctionRowSetStatus = function(draginfo, editor, row) {
    var scc = SocialCalc.Constants;
    var msg = scc.s_TCTDFthumbstatusPrefixv + row + " ";
    draginfo.thumbstatus.rowmsgele.innerHTML = msg;
    draginfo.thumbcontext.rowpanes = [ {
        first: row,
        last: row
    } ];
    draginfo.thumbrowshown = row;
    var ele = draginfo.thumbcontext.RenderSheet(draginfo.thumbstatus.rowpreviewele.firstChild, {
        type: "html"
    });
};

SocialCalc.TCTDragFunctionMove = function(event, draginfo, dobj) {
    var first, msg;
    var control = dobj.functionobj.control;
    var thumbthickness = control.thumbthickness;
    var editor = control.editor;
    var scc = SocialCalc.Constants;
    if (dobj.vertical) {
        if (draginfo.clientY > control.scrollareaend - draginfo.offsetY - control.thumbthickness + 2) draginfo.clientY = control.scrollareaend - draginfo.offsetY - control.thumbthickness + 2;
        if (draginfo.clientY < control.scrollareastart - draginfo.offsetY - 1) draginfo.clientY = control.scrollareastart - draginfo.offsetY - 1;
        draginfo.thumbstatus.style.top = draginfo.clientY + "px";
        first = (draginfo.clientY + draginfo.offsetY - control.scrollareastart + 1) / (control.scrollareasize - control.thumbthickness) * (editor.context.sheetobj.attribs.lastrow - editor.lastnonscrollingrow) + editor.lastnonscrollingrow + 1;
        first = Math.floor(first);
        if (first <= editor.lastnonscrollingrow) first = editor.lastnonscrollingrow + 1;
        if (first > editor.context.sheetobj.attribs.lastrow) first = editor.context.sheetobj.attribs.lastrow;
        if (first != draginfo.thumbrowshown) {
            SocialCalc.TCTDragFunctionRowSetStatus(draginfo, editor, first);
        }
    } else {
        if (draginfo.clientX > control.scrollareaend - draginfo.offsetX - control.thumbthickness + 2) draginfo.clientX = control.scrollareaend - draginfo.offsetX - control.thumbthickness + 2;
        if (draginfo.clientX < control.scrollareastart - draginfo.offsetX - 1) draginfo.clientX = control.scrollareastart - draginfo.offsetX - 1;
        draginfo.thumbstatus.style.left = draginfo.clientX + "px";
        first = (draginfo.clientX + draginfo.offsetX - control.scrollareastart + 1) / (control.scrollareasize - control.thumbthickness) * (editor.context.sheetobj.attribs.lastcol - editor.lastnonscrollingcol) + editor.lastnonscrollingcol + 1;
        first = Math.floor(first);
        if (first <= editor.lastnonscrollingcol) first = editor.lastnonscrollingcol + 1;
        if (first > editor.context.sheetobj.attribs.lastcol) first = editor.context.sheetobj.attribs.lastcol;
        msg = scc.s_TCTDFthumbstatusPrefixh + SocialCalc.rcColname(first);
        draginfo.thumbstatus.innerHTML = msg;
    }
    SocialCalc.DragFunctionPosition(event, draginfo, dobj);
};

SocialCalc.TCTDragFunctionStop = function(event, draginfo, dobj) {
    var first;
    var control = dobj.functionobj.control;
    var editor = control.editor;
    if (dobj.vertical) {
        first = (draginfo.clientY + draginfo.offsetY - control.scrollareastart + 1) / (control.scrollareasize - control.thumbthickness) * (editor.context.sheetobj.attribs.lastrow - editor.lastnonscrollingrow) + editor.lastnonscrollingrow + 1;
        first = Math.floor(first);
        if (first <= editor.lastnonscrollingrow) first = editor.lastnonscrollingrow + 1;
        if (first > editor.context.sheetobj.attribs.lastrow) first = editor.context.sheetobj.attribs.lastrow;
        editor.context.SetRowPaneFirstLast(editor.context.rowpanes.length - 1, first, first + 1);
    } else {
        first = (draginfo.clientX + draginfo.offsetX - control.scrollareastart + 1) / (control.scrollareasize - control.thumbthickness) * (editor.context.sheetobj.attribs.lastcol - editor.lastnonscrollingcol) + editor.lastnonscrollingcol + 1;
        first = Math.floor(first);
        if (first <= editor.lastnonscrollingcol) first = editor.lastnonscrollingcol + 1;
        if (first > editor.context.sheetobj.attribs.lastcol) first = editor.context.sheetobj.attribs.lastcol;
        editor.context.SetColPaneFirstLast(editor.context.colpanes.length - 1, first, first + 1);
    }
    editor.FitToEditTable();
    if (draginfo.thumbstatus.rowmsgele) draginfo.thumbstatus.rowmsgele = null;
    if (draginfo.thumbstatus.rowpreviewele) draginfo.thumbstatus.rowpreviewele = null;
    editor.toplevel.removeChild(draginfo.thumbstatus);
    draginfo.thumbstatus = null;
    editor.ScheduleRender();
};

SocialCalc.DragInfo = {
    registeredElements: [],
    draggingElement: null,
    startX: 0,
    startY: 0,
    startZ: 0,
    clientX: 0,
    clientY: 0,
    offsetX: 0,
    offsetY: 0,
    relativeOffset: {
        left: 0,
        top: 0
    }
};

SocialCalc.DragRegister = function(element, vertical, horizontal, functionobj, parent) {
    var draginfo = SocialCalc.DragInfo;
    if (!functionobj) {
        functionobj = {
            MouseDown: SocialCalc.DragFunctionStart,
            MouseMove: SocialCalc.DragFunctionPosition,
            MouseUp: SocialCalc.DragFunctionPosition,
            Disabled: null
        };
    }
    draginfo.registeredElements.push({
        element: element,
        vertical: vertical,
        horizontal: horizontal,
        functionobj: functionobj,
        parent: parent
    });
    if (element.addEventListener) {
        element.addEventListener("mousedown", SocialCalc.DragMouseDown, false);
    } else if (element.attachEvent) {
        element.attachEvent("onmousedown", SocialCalc.DragMouseDown);
    } else {
        throw SocialCalc.Constants.s_BrowserNotSupported;
    }
};

SocialCalc.DragUnregister = function(element) {
    var draginfo = SocialCalc.DragInfo;
    var i;
    if (!element) return;
    for (i = 0; i < draginfo.registeredElements.length; i++) {
        if (draginfo.registeredElements[i].element == element) {
            draginfo.registeredElements.splice(i, 1);
            if (element.removeEventListener) {
                element.removeEventListener("mousedown", SocialCalc.DragMouseDown, false);
            } else {
                element.detachEvent("onmousedown", SocialCalc.DragMouseDown);
            }
            return;
        }
    }
    return;
};

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
    if (document.addEventListener) {
        document.addEventListener("mousemove", SocialCalc.DragMouseMove, true);
        document.addEventListener("mouseup", SocialCalc.DragMouseUp, true);
    } else if (dobj.element.attachEvent) {
        dobj.element.setCapture();
        dobj.element.attachEvent("onmousemove", SocialCalc.DragMouseMove);
        dobj.element.attachEvent("onmouseup", SocialCalc.DragMouseUp);
        dobj.element.attachEvent("onlosecapture", SocialCalc.DragMouseUp);
    }
    if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
    if (e.preventDefault) e.preventDefault(); else e.returnValue = false;
    if (dobj && dobj.functionobj && dobj.functionobj.MouseDown) dobj.functionobj.MouseDown(e, draginfo, dobj);
    return false;
};

SocialCalc.DragMouseMove = function(event) {
    var e = event || window.event;
    var draginfo = SocialCalc.DragInfo;
    var dobj = draginfo.draggingElement;
    draginfo.clientX = e.clientX - draginfo.relativeOffset.left;
    draginfo.clientY = e.clientY - draginfo.relativeOffset.top;
    if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
    if (dobj && dobj.functionobj && dobj.functionobj.MouseMove) dobj.functionobj.MouseMove(e, draginfo, dobj);
    return false;
};

SocialCalc.DragMouseUp = function(event) {
    var e = event || window.event;
    var draginfo = SocialCalc.DragInfo;
    var dobj = draginfo.draggingElement;
    draginfo.clientX = e.clientX - draginfo.relativeOffset.left;
    draginfo.clientY = e.clientY - draginfo.relativeOffset.top;
    dobj.element.style.zIndex = draginfo.startZ;
    if (dobj && dobj.functionobj && dobj.functionobj.MouseUp) dobj.functionobj.MouseUp(e, draginfo, dobj);
    if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
    if (document.removeEventListener) {
        document.removeEventListener("mousemove", SocialCalc.DragMouseMove, true);
        document.removeEventListener("mouseup", SocialCalc.DragMouseUp, true);
    } else if (dobj.element.detachEvent) {
        dobj.element.detachEvent("onlosecapture", SocialCalc.DragMouseUp);
        dobj.element.detachEvent("onmouseup", SocialCalc.DragMouseUp);
        dobj.element.detachEvent("onmousemove", SocialCalc.DragMouseMove);
        dobj.element.releaseCapture();
    }
    draginfo.draggingElement = null;
    return false;
};

SocialCalc.DragFunctionStart = function(event, draginfo, dobj) {
    var element = dobj.functionobj.positionobj || dobj.element;
    draginfo.offsetY = parseInt(element.style.top) - draginfo.clientY;
    draginfo.offsetX = parseInt(element.style.left) - draginfo.clientX;
};

SocialCalc.DragFunctionPosition = function(event, draginfo, dobj) {
    var element = dobj.functionobj.positionobj || dobj.element;
    if (dobj.vertical) element.style.top = draginfo.clientY + draginfo.offsetY + "px";
    if (dobj.horizontal) element.style.left = draginfo.clientX + draginfo.offsetX + "px";
};

SocialCalc.TooltipInfo = {
    registeredElements: [],
    registered: false,
    tooltipElement: null,
    timer: null,
    popupElement: null,
    clientX: 0,
    clientY: 0,
    offsetX: SocialCalc.Constants.TooltipOffsetX,
    offsetY: SocialCalc.Constants.TooltipOffsetY
};

SocialCalc.TooltipRegister = function(element, tiptext, functionobj, parent) {
    var tooltipinfo = SocialCalc.TooltipInfo;
    tooltipinfo.registeredElements.push({
        element: element,
        tiptext: tiptext,
        functionobj: functionobj,
        parent: parent
    });
    if (tooltipinfo.registered) return;
    if (document.addEventListener) {
        document.addEventListener("mousemove", SocialCalc.TooltipMouseMove, false);
    } else if (document.attachEvent) {
        document.attachEvent("onmousemove", SocialCalc.TooltipMouseMove);
    } else {
        throw SocialCalc.Constants.s_BrowserNotSupported;
    }
    tooltipinfo.registered = true;
    return;
};

SocialCalc.TooltipMouseMove = function(event) {
    var e = event || window.event;
    var tooltipinfo = SocialCalc.TooltipInfo;
    tooltipinfo.clientX = e.clientX;
    tooltipinfo.clientY = e.clientY;
    var tobj = SocialCalc.LookupElement(e.target || e.srcElement, tooltipinfo.registeredElements);
    if (tooltipinfo.timer) {
        window.clearTimeout(tooltipinfo.timer);
        tooltipinfo.timer = null;
    }
    if (tooltipinfo.popupElement) {
        SocialCalc.TooltipHide();
    }
    tooltipinfo.tooltipElement = tobj || null;
    if (!tobj || SocialCalc.ButtonInfo.buttonDown) return;
    tooltipinfo.timer = window.setTimeout(SocialCalc.TooltipWaitDone, 700);
    if (tooltipinfo.tooltipElement.element.addEventListener) {
        tooltipinfo.tooltipElement.element.addEventListener("mousedown", SocialCalc.TooltipMouseDown, false);
    } else if (tooltipinfo.tooltipElement.element.attachEvent) {
        tooltipinfo.tooltipElement.element.attachEvent("onmousedown", SocialCalc.TooltipMouseDown);
    }
    return;
};

SocialCalc.TooltipMouseDown = function(event) {
    var e = event || window.event;
    var tooltipinfo = SocialCalc.TooltipInfo;
    if (tooltipinfo.timer) {
        window.clearTimeout(tooltipinfo.timer);
        tooltipinfo.timer = null;
    }
    if (tooltipinfo.popupElement) {
        SocialCalc.TooltipHide();
    }
    if (tooltipinfo.tooltipElement) {
        if (tooltipinfo.tooltipElement.element.removeEventListener) {
            tooltipinfo.tooltipElement.element.removeEventListener("mousedown", SocialCalc.TooltipMouseDown, false);
        } else if (tooltipinfo.tooltipElement.element.attachEvent) {
            tooltipinfo.tooltipElement.element.detachEvent("onmousedown", SocialCalc.TooltipMouseDown);
        }
        tooltipinfo.tooltipElement = null;
    }
    return;
};

SocialCalc.TooltipDisplay = function(tobj) {
    var tooltipinfo = SocialCalc.TooltipInfo;
    var scc = SocialCalc.Constants;
    var offsetX = tobj.functionobj && typeof tobj.functionobj.offsetx == "number" ? tobj.functionobj.offsetx : tooltipinfo.offsetX;
    var offsetY = tobj.functionobj && typeof tobj.functionobj.offsety == "number" ? tobj.functionobj.offsety : tooltipinfo.offsetY;
    var viewport = SocialCalc.GetViewportInfo();
    var pos = SocialCalc.GetElementPositionWithScroll(tobj.parent);
    tooltipinfo.popupElement = document.createElement("div");
    if (scc.TDpopupElementClass) tooltipinfo.popupElement.className = scc.TDpopupElementClass;
    SocialCalc.setStyles(tooltipinfo.popupElement, scc.TDpopupElementStyle);
    tooltipinfo.popupElement.innerHTML = tobj.tiptext;
    if (tooltipinfo.clientX > viewport.width / 2) {
        tooltipinfo.popupElement.style.bottom = pos.height - tooltipinfo.clientY + offsetY + pos.top + "px";
        tooltipinfo.popupElement.style.right = pos.width - tooltipinfo.clientX + offsetX + pos.left + "px";
    } else {
        tooltipinfo.popupElement.style.bottom = pos.height - tooltipinfo.clientY + offsetY + pos.top + "px";
        tooltipinfo.popupElement.style.left = tooltipinfo.clientX + offsetX - pos.left + "px";
    }
    if (tooltipinfo.clientY < 50) {
        tooltipinfo.popupElement.style.bottom = pos.height - tooltipinfo.clientY + offsetY - 50 + pos.top + "px";
    }
    tobj.parent.appendChild(tooltipinfo.popupElement);
};

SocialCalc.TooltipHide = function() {
    var tooltipinfo = SocialCalc.TooltipInfo;
    if (tooltipinfo.popupElement) {
        tooltipinfo.popupElement.parentNode.removeChild(tooltipinfo.popupElement);
        tooltipinfo.popupElement = null;
    }
};

SocialCalc.TooltipWaitDone = function() {
    var tooltipinfo = SocialCalc.TooltipInfo;
    tooltipinfo.timer = null;
    SocialCalc.TooltipDisplay(tooltipinfo.tooltipElement);
};

SocialCalc.ButtonInfo = {
    registeredElements: [],
    buttonElement: null,
    doingHover: false,
    buttonDown: false,
    timer: null,
    relativeOffset: null,
    clientX: 0,
    clientY: 0
};

SocialCalc.ButtonRegister = function(editor, element, paramobj, functionobj) {
    var buttoninfo = SocialCalc.ButtonInfo;
    if (!paramobj) paramobj = {};
    buttoninfo.registeredElements.push({
        name: paramobj.name,
        element: element,
        editor: editor,
        normalstyle: paramobj.normalstyle,
        hoverstyle: paramobj.hoverstyle,
        downstyle: paramobj.downstyle,
        repeatwait: paramobj.repeatwait,
        repeatinterval: paramobj.repeatinterval,
        functionobj: functionobj
    });
    if (element.addEventListener) {
        element.addEventListener("mousedown", SocialCalc.ButtonMouseDown, false);
        element.addEventListener("mouseover", SocialCalc.ButtonMouseOver, false);
        element.addEventListener("mouseout", SocialCalc.ButtonMouseOut, false);
    } else if (element.attachEvent) {
        element.attachEvent("onmousedown", SocialCalc.ButtonMouseDown);
        element.attachEvent("onmouseover", SocialCalc.ButtonMouseOver);
        element.attachEvent("onmouseout", SocialCalc.ButtonMouseOut);
    } else {
        throw SocialCalc.Constants.s_BrowserNotSupported;
    }
    return;
};

SocialCalc.ButtonMouseOver = function(event) {
    var e = event || window.event;
    var buttoninfo = SocialCalc.ButtonInfo;
    var bobj = SocialCalc.LookupElement(e.target || e.srcElement, buttoninfo.registeredElements);
    if (!bobj) return;
    if (buttoninfo.buttonDown) {
        if (buttoninfo.buttonElement == bobj) {
            buttoninfo.doingHover = true;
        }
        return;
    }
    if (buttoninfo.buttonElement && buttoninfo.buttonElement != bobj && buttoninfo.doingHover) {
        SocialCalc.setStyles(buttoninfo.buttonElement.element, buttoninfo.buttonElement.normalstyle);
    }
    buttoninfo.buttonElement = bobj;
    buttoninfo.doingHover = true;
    SocialCalc.setStyles(bobj.element, bobj.hoverstyle);
    if (bobj && bobj.functionobj && bobj.functionobj.MouseOver) bobj.functionobj.MouseOver(e, buttoninfo, bobj);
    return;
};

SocialCalc.ButtonMouseOut = function(event) {
    var e = event || window.event;
    var buttoninfo = SocialCalc.ButtonInfo;
    if (buttoninfo.buttonDown) {
        buttoninfo.doingHover = false;
        return;
    }
    var bobj = SocialCalc.LookupElement(e.target || e.srcElement, buttoninfo.registeredElements);
    if (buttoninfo.doingHover) {
        if (buttoninfo.buttonElement) SocialCalc.setStyles(buttoninfo.buttonElement.element, buttoninfo.buttonElement.normalstyle);
        buttoninfo.buttonElement = null;
        buttoninfo.doingHover = false;
    }
    if (bobj && bobj.functionobj && bobj.functionobj.MouseOut) bobj.functionobj.MouseOut(e, buttoninfo, bobj);
    return;
};

SocialCalc.ButtonMouseDown = function(event) {
    var e = event || window.event;
    var buttoninfo = SocialCalc.ButtonInfo;
    var viewportinfo = SocialCalc.GetViewportInfo();
    var bobj = SocialCalc.LookupElement(e.target || e.srcElement, buttoninfo.registeredElements);
    if (!bobj) return;
    if (bobj && bobj.functionobj && bobj.functionobj.Disabled) {
        if (bobj.functionobj.Disabled(e, buttoninfo, bobj)) {
            return;
        }
    }
    buttoninfo.buttonElement = bobj;
    buttoninfo.buttonDown = true;
    SocialCalc.setStyles(bobj.element, buttoninfo.buttonElement.downstyle);
    if (document.addEventListener) {
        document.addEventListener("mouseup", SocialCalc.ButtonMouseUp, true);
    } else if (bobj.element.attachEvent) {
        bobj.element.setCapture();
        bobj.element.attachEvent("onmouseup", SocialCalc.ButtonMouseUp);
        bobj.element.attachEvent("onlosecapture", SocialCalc.ButtonMouseUp);
    }
    if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
    if (e.preventDefault) e.preventDefault(); else e.returnValue = false;
    buttoninfo.relativeOffset = SocialCalc.GetElementPositionWithScroll(bobj.editor.toplevel);
    buttoninfo.clientX = e.clientX - buttoninfo.relativeOffset.left;
    buttoninfo.clientY = e.clientY - buttoninfo.relativeOffset.top;
    if (bobj && bobj.functionobj && bobj.functionobj.MouseDown) bobj.functionobj.MouseDown(e, buttoninfo, bobj);
    if (bobj.repeatwait) {
        buttoninfo.timer = window.setTimeout(SocialCalc.ButtonRepeat, bobj.repeatwait);
    }
    return;
};

SocialCalc.ButtonMouseUp = function(event) {
    var e = event || window.event;
    var buttoninfo = SocialCalc.ButtonInfo;
    var bobj = buttoninfo.buttonElement;
    if (buttoninfo.timer) {
        window.clearTimeout(buttoninfo.timer);
        buttoninfo.timer = null;
    }
    if (!buttoninfo.buttonDown) return;
    if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
    if (e.preventDefault) e.preventDefault(); else e.returnValue = false;
    if (document.removeEventListener) {
        document.removeEventListener("mouseup", SocialCalc.ButtonMouseUp, true);
    } else if (document.detachEvent) {
        bobj.element.detachEvent("onlosecapture", SocialCalc.ButtonMouseUp);
        bobj.element.detachEvent("onmouseup", SocialCalc.ButtonMouseUp);
        bobj.element.releaseCapture();
    }
    if (buttoninfo.buttonElement.downstyle) {
        if (buttoninfo.doingHover) SocialCalc.setStyles(bobj.element, buttoninfo.buttonElement.hoverstyle); else SocialCalc.setStyles(bobj.element, buttoninfo.buttonElement.normalstyle);
    }
    buttoninfo.buttonDown = false;
    if (bobj && bobj.functionobj && bobj.functionobj.MouseUp) bobj.functionobj.MouseUp(e, buttoninfo, bobj);
};

SocialCalc.ButtonRepeat = function() {
    var buttoninfo = SocialCalc.ButtonInfo;
    var bobj = buttoninfo.buttonElement;
    if (!bobj) return;
    if (bobj && bobj.functionobj && bobj.functionobj.Repeat) bobj.functionobj.Repeat(null, buttoninfo, bobj);
    buttoninfo.timer = window.setTimeout(SocialCalc.ButtonRepeat, bobj.repeatinterval || 100);
};

SocialCalc.MouseWheelInfo = {
    registeredElements: []
};

SocialCalc.MouseWheelRegister = function(element, functionobj) {
    var mousewheelinfo = SocialCalc.MouseWheelInfo;
    mousewheelinfo.registeredElements.push({
        element: element,
        functionobj: functionobj
    });
    if (element.addEventListener) {
        element.addEventListener("DOMMouseScroll", SocialCalc.ProcessMouseWheel, false);
        element.addEventListener("mousewheel", SocialCalc.ProcessMouseWheel, false);
    } else if (element.attachEvent) {
        element.attachEvent("onmousewheel", SocialCalc.ProcessMouseWheel);
    } else {
        throw SocialCalc.Constants.s_BrowserNotSupported;
    }
    return;
};

SocialCalc.ProcessMouseWheel = function(e) {
    var event = e || window.event;
    var delta;
    if (SocialCalc.Keyboard.passThru) return;
    var mousewheelinfo = SocialCalc.MouseWheelInfo;
    var ele = event.target || event.srcElement;
    var wobj;
    for (wobj = null; !wobj && ele; ele = ele.parentNode) {
        wobj = SocialCalc.LookupElement(ele, mousewheelinfo.registeredElements);
    }
    if (!wobj) return;
    if (event.wheelDelta) {
        delta = event.wheelDelta / 120;
    } else delta = -event.detail / 3;
    if (!delta) delta = 0;
    if (wobj.functionobj && wobj.functionobj.WheelMove) wobj.functionobj.WheelMove(event, delta, mousewheelinfo, wobj);
    if (event.preventDefault) event.preventDefault();
    event.returnValue = false;
};

SocialCalc.keyboardTables = {
    specialKeysCommon: {
        8: "[backspace]",
        9: "[tab]",
        13: "[enter]",
        25: "[tab]",
        27: "[esc]",
        33: "[pgup]",
        34: "[pgdn]",
        35: "[end]",
        36: "[home]",
        37: "[aleft]",
        38: "[aup]",
        39: "[aright]",
        40: "[adown]",
        45: "[ins]",
        46: "[del]",
        113: "[f2]"
    },
    specialKeysIE: {
        8: "[backspace]",
        9: "[tab]",
        13: "[enter]",
        25: "[tab]",
        27: "[esc]",
        33: "[pgup]",
        34: "[pgdn]",
        35: "[end]",
        36: "[home]",
        37: "[aleft]",
        38: "[aup]",
        39: "[aright]",
        40: "[adown]",
        45: "[ins]",
        46: "[del]",
        113: "[f2]"
    },
    controlKeysIE: {
        67: "[ctrl-c]",
        83: "[ctrl-s]",
        86: "[ctrl-v]",
        88: "[ctrl-x]",
        90: "[ctrl-z]"
    },
    specialKeysOpera: {
        8: "[backspace]",
        9: "[tab]",
        13: "[enter]",
        25: "[tab]",
        27: "[esc]",
        33: "[pgup]",
        34: "[pgdn]",
        35: "[end]",
        36: "[home]",
        37: "[aleft]",
        38: "[aup]",
        39: "[aright]",
        40: "[adown]",
        45: "[ins]",
        46: "[del]",
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
        8: "[backspace]",
        9: "[tab]",
        13: "[enter]",
        25: "[tab]",
        27: "[esc]",
        63232: "[aup]",
        63233: "[adown]",
        63234: "[aleft]",
        63235: "[aright]",
        63272: "[del]",
        63273: "[home]",
        63275: "[end]",
        63276: "[pgup]",
        63277: "[pgdn]",
        63237: "[f2]"
    },
    controlKeysSafari: {
        99: "[ctrl-c]",
        115: "[ctrl-s]",
        118: "[ctrl-v]",
        120: "[ctrl-x]",
        122: "[ctrl-z]"
    },
    ignoreKeysSafari: {
        63236: "[f1]",
        63238: "[f3]",
        63239: "[f4]",
        63240: "[f5]",
        63241: "[f6]",
        63242: "[f7]",
        63243: "[f8]",
        63244: "[f9]",
        63245: "[f10]",
        63246: "[f11]",
        63247: "[f12]",
        63289: "[numlock]"
    },
    specialKeysFirefox: {
        8: "[backspace]",
        9: "[tab]",
        13: "[enter]",
        25: "[tab]",
        27: "[esc]",
        33: "[pgup]",
        34: "[pgdn]",
        35: "[end]",
        36: "[home]",
        37: "[aleft]",
        38: "[aup]",
        39: "[aright]",
        40: "[adown]",
        45: "[ins]",
        46: "[del]",
        113: "[f2]"
    },
    controlKeysFirefox: {
        99: "[ctrl-c]",
        115: "[ctrl-s]",
        118: "[ctrl-v]",
        120: "[ctrl-x]",
        122: "[ctrl-z]"
    },
    ignoreKeysFirefox: {
        16: "[shift]",
        17: "[ctrl]",
        18: "[alt]",
        20: "[capslock]",
        19: "[pause]",
        44: "[printscreen]",
        91: "[windows]",
        92: "[windows]",
        112: "[f1]",
        114: "[f3]",
        115: "[f4]",
        116: "[f5]",
        117: "[f6]",
        118: "[f7]",
        119: "[f8]",
        120: "[f9]",
        121: "[f10]",
        122: "[f11]",
        123: "[f12]",
        144: "[numlock]",
        145: "[scrolllock]",
        224: "[cmd]"
    }
};

SocialCalc.Keyboard = {
    areListener: false,
    focusTable: null,
    passThru: null,
    didProcessKey: false,
    statusFromProcessKey: false,
    repeatingKeyPress: false,
    chForProcessKey: ""
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
};

SocialCalc.KeyboardFocus = function() {
    SocialCalc.Keyboard.passThru = null;
    window.focus();
};

SocialCalc.ProcessKeyDown = function(e) {
    var kt = SocialCalc.keyboardTables;
    kt.didProcessKey = false;
    kt.statusFromProcessKey = false;
    kt.repeatingKeyPress = false;
    var ch = "";
    var status = true;
    if (SocialCalc.Keyboard.passThru) return;
    e = e || window.event;
    if (e.which == undefined) {
        ch = kt.specialKeysCommon[e.keyCode];
        if (!ch) {
            if (e.ctrlKey) {
                ch = kt.controlKeysIE[e.keyCode];
            }
            if (!ch) return true;
        }
        status = SocialCalc.ProcessKey(ch, e);
        if (!status) {
            if (e.preventDefault) e.preventDefault();
            e.returnValue = false;
        }
    } else {
        ch = kt.specialKeysCommon[e.keyCode];
        if (!ch) {
            if (e.ctrlKey || e.metaKey) {
                ch = kt.controlKeysIE[e.keyCode];
            }
            if (!ch) return true;
        }
        status = SocialCalc.ProcessKey(ch, e);
        kt.didProcessKey = true;
        kt.statusFromProcessKey = status;
        kt.chForProcessKey = ch;
    }
    return status;
};

SocialCalc.ProcessKeyPress = function(e) {
    var kt = SocialCalc.keyboardTables;
    var ch = "";
    e = e || window.event;
    if (SocialCalc.Keyboard.passThru) return;
    if (kt.didProcessKey) {
        if (kt.repeatingKeyPress) {
            return SocialCalc.ProcessKey(kt.chForProcessKey, e);
        } else {
            kt.repeatingKeyPress = true;
            return kt.statusFromProcessKey;
        }
    }
    if (e.which == undefined) {
        ch = String.fromCharCode(e.keyCode);
    } else {
        if (!e.which) return false;
        if (e.charCode == undefined) {
            if (e.which != 0) {
                if (e.which < 32 || e.which == 144) {
                    ch = kt.specialKeysOpera[e.which];
                    if (ch) {
                        return true;
                    }
                } else {
                    if (e.ctrlKey) {
                        ch = kt.controlKeysOpera[e.keyCode];
                    } else {
                        ch = String.fromCharCode(e.which);
                    }
                }
            } else {
                return true;
            }
        } else if (e.keyCode == 0 && e.charCode == 0) {
            return;
        } else if (e.keyCode == e.charCode) {
            ch = kt.specialKeysSafari[e.keyCode];
            if (!ch) {
                if (kt.ignoreKeysSafari[e.keyCode]) return true;
                if (e.metaKey) {
                    ch = kt.controlKeysSafari[e.keyCode];
                } else {
                    ch = String.fromCharCode(e.which);
                }
            }
        } else {
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
};

SocialCalc.ProcessKey = function(ch, e) {
    var ft = SocialCalc.Keyboard.focusTable;
    if (!ft) return true;
    return ft.EditorProcessKey(ch, e);
};

var SocialCalc;

if (!SocialCalc) SocialCalc = {};

SocialCalc.FormatNumber = {};

SocialCalc.FormatNumber.format_definitions = {};

SocialCalc.FormatNumber.separatorchar = ",";

SocialCalc.FormatNumber.decimalchar = ".";

SocialCalc.FormatNumber.daynames = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];

SocialCalc.FormatNumber.daynames3 = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];

SocialCalc.FormatNumber.monthnames3 = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

SocialCalc.FormatNumber.monthnames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

SocialCalc.FormatNumber.allowedcolors = {
    BLACK: "#000000",
    BLUE: "#0000FF",
    CYAN: "#00FFFF",
    GREEN: "#00FF00",
    MAGENTA: "#FF00FF",
    RED: "#FF0000",
    WHITE: "#FFFFFF",
    YELLOW: "#FFFF00"
};

SocialCalc.FormatNumber.alloweddates = {
    H: "h]",
    M: "m]",
    MM: "mm]",
    S: "s]",
    SS: "ss]"
};

SocialCalc.FormatNumber.commands = {
    copy: 1,
    color: 2,
    integer_placeholder: 3,
    fraction_placeholder: 4,
    decimal: 5,
    currency: 6,
    general: 7,
    separator: 8,
    date: 9,
    comparison: 10,
    section: 11,
    style: 12
};

SocialCalc.FormatNumber.datevalues = {
    julian_offset: 2415019,
    seconds_in_a_day: 24 * 60 * 60,
    seconds_in_an_hour: 60 * 60
};

SocialCalc.FormatNumber.formatNumberWithFormat = function(rawvalue, format_string, currency_char) {
    var scc = SocialCalc.Constants;
    var scfn = SocialCalc.FormatNumber;
    var op, operandstr, fromend, cval, operandstrlc;
    var startval, estartval;
    var hrs, mins, secs, ehrs, emins, esecs, ampmstr, ymd;
    var minOK, mpos;
    var result = "";
    var thisformat;
    var section, gotcomparison, compop, compval, cpos, oppos;
    var sectioninfo;
    var i, decimalscale, scaledvalue, strvalue, strparts, integervalue, fractionvalue;
    var integerdigits2, integerpos, fractionpos, textcolor, textstyle, separatorchar, decimalchar;
    var value;
    if (typeof rawvalue == "string" && !rawvalue.length) return "";
    value = rawvalue - 0;
    if (!isFinite(value)) {
        if (typeof rawvalue == "string") {
            return scfn.formatTextWithFormat(rawvalue, format_string);
        } else {
            return "NaN";
        }
    }
    rawvalue = value;
    var negativevalue = value < 0 ? 1 : 0;
    if (negativevalue) value = -value;
    var zerovalue = value == 0 ? 1 : 0;
    currency_char = currency_char || scc.FormatNumber_DefaultCurrency;
    scfn.parse_format_string(scfn.format_definitions, format_string);
    thisformat = scfn.format_definitions[format_string];
    if (!thisformat) throw "Format not parsed error!";
    section = thisformat.sectioninfo.length - 1;
    if (thisformat.hascomparison) {
        section = 0;
        gotcomparison = 0;
        for (cpos = 0; ;cpos++) {
            op = thisformat.operators[cpos];
            operandstr = thisformat.operands[cpos];
            if (!op) {
                if (gotcomparison) {
                    format_string = "General";
                    scfn.parse_format_string(scfn.format_definitions, format_string);
                    thisformat = scfn.format_definitions[format_string];
                    section = 0;
                }
                break;
            }
            if (op == scfn.commands.section) {
                if (!gotcomparison) {
                    break;
                }
                gotcomparison = 0;
                section++;
                continue;
            }
            if (op == scfn.commands.comparison) {
                i = operandstr.indexOf(":");
                compop = operandstr.substring(0, i);
                compval = operandstr.substring(i + 1) - 0;
                if (compop == "<" && rawvalue < compval || compop == "<=" && rawvalue <= compval || compop == "=" && rawvalue == compval || compop == "<>" && rawvalue != compval || compop == ">=" && rawvalue >= compval || compop == ">" && rawvalue > compval) {
                    break;
                }
                gotcomparison = 1;
            }
        }
    } else if (section > 0) {
        if (section == 1) {
            if (negativevalue) {
                negativevalue = 0;
                section = 1;
            } else {
                section = 0;
            }
        } else if (section == 2 || section == 3) {
            if (negativevalue) {
                negativevalue = 0;
                section = 1;
            } else if (zerovalue) {
                section = 2;
            } else {
                section = 0;
            }
        }
    }
    sectioninfo = thisformat.sectioninfo[section];
    if (sectioninfo.commas > 0) {
        for (i = 0; i < sectioninfo.commas; i++) {
            value /= 1e3;
        }
    }
    if (sectioninfo.percent > 0) {
        for (i = 0; i < sectioninfo.percent; i++) {
            value *= 100;
        }
    }
    decimalscale = 1;
    for (i = 0; i < sectioninfo.fractiondigits; i++) {
        decimalscale *= 10;
    }
    scaledvalue = Math.floor(value * decimalscale + .5);
    scaledvalue = scaledvalue / decimalscale;
    if (typeof scaledvalue != "number") return "NaN";
    if (!isFinite(scaledvalue)) return "NaN";
    strvalue = scaledvalue + "";
    if (scaledvalue == 0 && (sectioninfo.fractiondigits || sectioninfo.integerdigits)) {
        negativevalue = 0;
    }
    if (strvalue.indexOf("e") >= 0) {
        return rawvalue + "";
    }
    strparts = strvalue.match(/^\+{0,1}(\d*)(?:\.(\d*)){0,1}$/);
    if (!strparts) return "NaN";
    integervalue = strparts[1];
    if (!integervalue || integervalue == "0") integervalue = "";
    fractionvalue = strparts[2];
    if (!fractionvalue) fractionvalue = "";
    if (sectioninfo.hasdate) {
        if (rawvalue < 0) {
            return "??-???-??&nbsp;??:??:??";
        }
        startval = (rawvalue - Math.floor(rawvalue)) * scfn.datevalues.seconds_in_a_day;
        estartval = rawvalue * scfn.datevalues.seconds_in_a_day;
        hrs = Math.floor(startval / scfn.datevalues.seconds_in_an_hour);
        ehrs = Math.floor(estartval / scfn.datevalues.seconds_in_an_hour);
        startval = startval - hrs * scfn.datevalues.seconds_in_an_hour;
        mins = Math.floor(startval / 60);
        emins = Math.floor(estartval / 60);
        secs = startval - mins * 60;
        decimalscale = 1;
        for (i = 0; i < sectioninfo.fractiondigits; i++) {
            decimalscale *= 10;
        }
        secs = Math.floor(secs * decimalscale + .5);
        secs = secs / decimalscale;
        esecs = Math.floor(estartval * decimalscale + .5);
        esecs = esecs / decimalscale;
        if (secs >= 60) {
            secs = 0;
            mins++;
            emins++;
            if (mins >= 60) {
                mins = 0;
                hrs++;
                ehrs++;
                if (hrs >= 24) {
                    hrs = 0;
                    rawvalue++;
                }
            }
        }
        fractionvalue = secs - Math.floor(secs) + "";
        fractionvalue = fractionvalue.substring(2);
        ymd = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(Math.floor(rawvalue + scfn.datevalues.julian_offset));
        minOK = 0;
        mspos = sectioninfo.sectionstart;
        for (;;mspos++) {
            op = thisformat.operators[mspos];
            operandstr = thisformat.operands[mspos];
            if (!op) break;
            if (op == scfn.commands.section) break;
            if (op == scfn.commands.date) {
                if ((operandstr.toLowerCase() == "am/pm" || operandstr.toLowerCase() == "a/p") && !ampmstr) {
                    if (hrs >= 12) {
                        hrs -= 12;
                        ampmstr = operandstr.toLowerCase() == "a/p" ? scc.s_FormatNumber_pm1 : scc.s_FormatNumber_pm;
                    } else {
                        ampmstr = operandstr.toLowerCase() == "a/p" ? scc.s_FormatNumber_am1 : scc.s_FormatNumber_am;
                    }
                    if (operandstr.indexOf(ampmstr) < 0) ampmstr = ampmstr.toLowerCase();
                }
                if (minOK && (operandstr == "m" || operandstr == "mm")) {
                    thisformat.operands[mspos] += "in";
                }
                if (operandstr.charAt(0) == "h") {
                    minOK = 1;
                } else {
                    minOK = 0;
                }
            } else if (op != scfn.commands.copy) {
                minOK = 0;
            }
        }
        minOK = 0;
        for (--mspos; ;mspos--) {
            op = thisformat.operators[mspos];
            operandstr = thisformat.operands[mspos];
            if (!op) break;
            if (op == scfn.commands.section) break;
            if (op == scfn.commands.date) {
                if (minOK && (operandstr == "m" || operandstr == "mm")) {
                    thisformat.operands[mspos] += "in";
                }
                if (operandstr == "ss") {
                    minOK = 1;
                } else {
                    minOK = 0;
                }
            } else if (op != scfn.commands.copy) {
                minOK = 0;
            }
        }
    }
    integerdigits2 = 0;
    integerpos = 0;
    fractionpos = 0;
    textcolor = "";
    textstyle = "";
    separatorchar = scc.FormatNumber_separatorchar;
    if (separatorchar.indexOf(" ") >= 0) separatorchar = separatorchar.replace(/ /g, "&nbsp;");
    decimalchar = scc.FormatNumber_decimalchar;
    if (decimalchar.indexOf(" ") >= 0) decimalchar = decimalchar.replace(/ /g, "&nbsp;");
    oppos = sectioninfo.sectionstart;
    while (op = thisformat.operators[oppos]) {
        operandstr = thisformat.operands[oppos++];
        if (op == scfn.commands.copy) {
            result += operandstr;
        } else if (op == scfn.commands.color) {
            textcolor = operandstr;
        } else if (op == scfn.commands.style) {
            textstyle = operandstr;
        } else if (op == scfn.commands.integer_placeholder) {
            if (negativevalue) {
                result += "-";
                negativevalue = 0;
            }
            integerdigits2++;
            if (integerdigits2 == 1) {
                if (integervalue.length > sectioninfo.integerdigits) {
                    for (;integerpos < integervalue.length - sectioninfo.integerdigits; integerpos++) {
                        result += integervalue.charAt(integerpos);
                        if (sectioninfo.thousandssep) {
                            fromend = integervalue.length - integerpos - 1;
                            if (fromend > 2 && fromend % 3 == 0) {
                                result += separatorchar;
                            }
                        }
                    }
                }
            }
            if (integervalue.length < sectioninfo.integerdigits && integerdigits2 <= sectioninfo.integerdigits - integervalue.length) {
                if (operandstr == "0" || operandstr == "?") {
                    result += operandstr == "0" ? "0" : "&nbsp;";
                    if (sectioninfo.thousandssep) {
                        fromend = sectioninfo.integerdigits - integerdigits2;
                        if (fromend > 2 && fromend % 3 == 0) {
                            result += separatorchar;
                        }
                    }
                }
            } else {
                result += integervalue.charAt(integerpos);
                if (sectioninfo.thousandssep) {
                    fromend = integervalue.length - integerpos - 1;
                    if (fromend > 2 && fromend % 3 == 0) {
                        result += separatorchar;
                    }
                }
                integerpos++;
            }
        } else if (op == scfn.commands.fraction_placeholder) {
            if (fractionpos >= fractionvalue.length) {
                if (operandstr == "0" || operandstr == "?") {
                    result += operandstr == "0" ? "0" : "&nbsp;";
                }
            } else {
                result += fractionvalue.charAt(fractionpos);
            }
            fractionpos++;
        } else if (op == scfn.commands.decimal) {
            if (negativevalue) {
                result += "-";
                negativevalue = 0;
            }
            result += decimalchar;
        } else if (op == scfn.commands.currency) {
            if (negativevalue) {
                result += "-";
                negativevalue = 0;
            }
            result += operandstr;
        } else if (op == scfn.commands.general) {
            if (value != 0) {
                var factor = Math.floor(Math.LOG10E * Math.log(value));
                factor = Math.pow(10, 13 - factor);
                value = Math.floor(factor * value + .5) / factor;
                if (!isFinite(value)) return "NaN";
            }
            if (negativevalue) {
                result += "-";
            }
            strvalue = value + "";
            if (strvalue.indexOf("e") >= 0) {
                result += strvalue;
                continue;
            }
            strparts = strvalue.match(/^\+{0,1}(\d*)(?:\.(\d*)){0,1}$/);
            integervalue = strparts[1];
            if (!integervalue || integervalue == "0") integervalue = "";
            fractionvalue = strparts[2];
            if (!fractionvalue) fractionvalue = "";
            integerpos = 0;
            fractionpos = 0;
            if (integervalue.length) {
                for (;integerpos < integervalue.length; integerpos++) {
                    result += integervalue.charAt(integerpos);
                    if (sectioninfo.thousandssep) {
                        fromend = integervalue.length - integerpos - 1;
                        if (fromend > 2 && fromend % 3 == 0) {
                            result += separatorchar;
                        }
                    }
                }
            } else {
                result += "0";
            }
            if (fractionvalue.length) {
                result += decimalchar;
                for (;fractionpos < fractionvalue.length; fractionpos++) {
                    result += fractionvalue.charAt(fractionpos);
                }
            }
        } else if (op == scfn.commands.date) {
            operandstrlc = operandstr.toLowerCase();
            if (operandstrlc == "y" || operandstrlc == "yy") {
                result += (ymd.year + "").substring(2);
            } else if (operandstrlc == "yyyy") {
                result += ymd.year + "";
            } else if (operandstrlc == "d") {
                result += ymd.day + "";
            } else if (operandstrlc == "dd") {
                cval = 1e3 + ymd.day;
                result += (cval + "").substr(2);
            } else if (operandstrlc == "ddd") {
                cval = Math.floor(rawvalue + 6) % 7;
                result += scc.s_FormatNumber_daynames3[cval];
            } else if (operandstrlc == "dddd") {
                cval = Math.floor(rawvalue + 6) % 7;
                result += scc.s_FormatNumber_daynames[cval];
            } else if (operandstrlc == "m") {
                result += ymd.month + "";
            } else if (operandstrlc == "mm") {
                cval = 1e3 + ymd.month;
                result += (cval + "").substr(2);
            } else if (operandstrlc == "mmm") {
                result += scc.s_FormatNumber_monthnames3[ymd.month - 1];
            } else if (operandstrlc == "mmmm") {
                result += scc.s_FormatNumber_monthnames[ymd.month - 1];
            } else if (operandstrlc == "mmmmm") {
                result += scc.s_FormatNumber_monthnames[ymd.month - 1].charAt(0);
            } else if (operandstrlc == "h") {
                result += hrs + "";
            } else if (operandstrlc == "h]") {
                result += ehrs + "";
            } else if (operandstrlc == "mmin") {
                cval = 1e3 + mins + "";
                result += cval.substr(2);
            } else if (operandstrlc == "mm]") {
                if (emins < 100) {
                    cval = 1e3 + emins + "";
                    result += cval.substr(2);
                } else {
                    result += emins + "";
                }
            } else if (operandstrlc == "min") {
                result += mins + "";
            } else if (operandstrlc == "m]") {
                result += emins + "";
            } else if (operandstrlc == "hh") {
                cval = 1e3 + hrs + "";
                result += cval.substr(2);
            } else if (operandstrlc == "s") {
                cval = Math.floor(secs);
                result += cval + "";
            } else if (operandstrlc == "ss") {
                cval = 1e3 + Math.floor(secs) + "";
                result += cval.substr(2);
            } else if (operandstrlc == "am/pm" || operandstrlc == "a/p") {
                result += ampmstr;
            } else if (operandstrlc == "ss]") {
                if (esecs < 100) {
                    cval = 1e3 + Math.floor(esecs) + "";
                    result += cval.substr(2);
                } else {
                    cval = Math.floor(esecs);
                    result += cval + "";
                }
            }
        } else if (op == scfn.commands.section) {
            break;
        } else if (op == scfn.commands.comparison) {
            continue;
        } else {
            result += "!! Parse error !!";
        }
    }
    if (textcolor) {
        result = '<span style="color:' + textcolor + ';">' + result + "</span>";
    }
    if (textstyle) {
        result = '<span style="' + textstyle + ';">' + result + "</span>";
    }
    return result;
};

SocialCalc.FormatNumber.formatTextWithFormat = function(rawvalue, format_string) {
    var scc = SocialCalc.Constants;
    var scfn = SocialCalc.FormatNumber;
    var value = rawvalue + "";
    var result = "";
    var section;
    var sectioninfo;
    var oppos;
    var operandstr;
    var textcolor = "";
    var textstyle = "";
    scfn.parse_format_string(scfn.format_definitions, format_string);
    thisformat = scfn.format_definitions[format_string];
    if (!thisformat) throw "Format not parsed error!";
    section = thisformat.sectioninfo.length - 1;
    if (section == 0) {
        section = 0;
    } else if (section == 3) {
        section = 3;
    } else {
        return value;
    }
    sectioninfo = thisformat.sectioninfo[section];
    oppos = sectioninfo.sectionstart;
    while (op = thisformat.operators[oppos]) {
        operandstr = thisformat.operands[oppos++];
        if (op == scfn.commands.copy) {
            if (operandstr == "@") {
                result += value;
            } else {
                result += operandstr.replace(/ /g, "&nbsp;");
            }
        } else if (op == scfn.commands.color) {
            textcolor = operandstr;
        } else if (op == scfn.commands.style) {
            textstyle = operandstr;
        }
    }
    if (textcolor) {
        result = '<span style="color:' + textcolor + ';">' + result + "</span>";
    }
    if (textstyle) {
        result = '<span style="' + textstyle + ';">' + result + "</span>";
    }
    return result;
};

SocialCalc.FormatNumber.parse_format_string = function(format_defs, format_string) {
    var scfn = SocialCalc.FormatNumber;
    var thisformat, section, sectionfinfo;
    var integerpart = 1;
    var lastwasinteger;
    var lastwasslash;
    var lastwasasterisk;
    var lastwasunderscore;
    var inquote, quotestr;
    var inbracket, bracketstr, bracketdata;
    var ingeneral, gpos;
    var ampmstr, part;
    var indate;
    var chpos;
    var ch;
    if (format_defs[format_string]) return;
    thisformat = {
        operators: [],
        operands: [],
        sectioninfo: [ {} ]
    };
    format_defs[format_string] = thisformat;
    section = 0;
    sectioninfo = thisformat.sectioninfo[section];
    sectioninfo.sectionstart = 0;
    sectioninfo.integerdigits = 0;
    sectioninfo.fractiondigits = 0;
    sectioninfo.commas = 0;
    sectioninfo.percent = 0;
    for (chpos = 0; chpos < format_string.length; chpos++) {
        ch = format_string.charAt(chpos);
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
            if (ch == "]") {
                inbracket = 0;
                bracketdata = SocialCalc.FormatNumber.parse_format_bracket(bracketstr);
                if (bracketdata.operator == scfn.commands.separator) {
                    sectioninfo.thousandssep = 1;
                    continue;
                }
                if (bracketdata.operator == scfn.commands.date) {
                    sectioninfo.hasdate = 1;
                }
                if (bracketdata.operator == scfn.commands.comparison) {
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
            lastwasslash = false;
            continue;
        }
        if (lastwasasterisk) {
            thisformat.operators.push(scfn.commands.copy);
            thisformat.operands.push(ch + ch + ch + ch + ch);
            lastwasasterisk = false;
            continue;
        }
        if (lastwasunderscore) {
            thisformat.operators.push(scfn.commands.copy);
            thisformat.operands.push("&nbsp;");
            lastwasunderscore = false;
            continue;
        }
        if (ingeneral) {
            if ("general".charAt(ingeneral) == ch.toLowerCase()) {
                ingeneral++;
                if (ingeneral == 7) {
                    thisformat.operators.push(scfn.commands.general);
                    thisformat.operands.push(ch);
                    ingeneral = 0;
                }
                continue;
            }
            ingeneral = 0;
        }
        if (indate) {
            if (indate.charAt(0) == ch) {
                indate += ch;
                continue;
            }
            thisformat.operators.push(scfn.commands.date);
            thisformat.operands.push(indate);
            sectioninfo.hasdate = 1;
            indate = "";
        }
        if (ampmstr) {
            ampmstr += ch;
            part = ampmstr.toLowerCase();
            if (part != "am/pm".substring(0, part.length) && part != "a/p".substring(0, part.length)) {
                ampstr = "";
            } else if (part == "am/pm" || part == "a/p") {
                thisformat.operators.push(scfn.commands.date);
                thisformat.operands.push(ampmstr);
                ampmstr = "";
            }
            continue;
        }
        if (ch == "#" || ch == "0" || ch == "?") {
            if (integerpart) {
                sectioninfo.integerdigits++;
                if (sectioninfo.commas) {
                    sectioninfo.thousandssep = 1;
                    sectioninfo.commas = 0;
                }
                lastwasinteger = 1;
                thisformat.operators.push(scfn.commands.integer_placeholder);
                thisformat.operands.push(ch);
            } else {
                sectioninfo.fractiondigits++;
                lastwasinteger = 1;
                thisformat.operators.push(scfn.commands.fraction_placeholder);
                thisformat.operands.push(ch);
            }
        } else if (ch == ".") {
            lastwasinteger = 0;
            thisformat.operators.push(scfn.commands.decimal);
            thisformat.operands.push(ch);
            integerpart = 0;
        } else if (ch == "$") {
            lastwasinteger = 0;
            thisformat.operators.push(scfn.commands.currency);
            thisformat.operands.push(ch);
        } else if (ch == ",") {
            if (lastwasinteger) {
                sectioninfo.commas++;
            } else {
                thisformat.operators.push(scfn.commands.copy);
                thisformat.operands.push(ch);
            }
        } else if (ch == "%") {
            lastwasinteger = 0;
            sectioninfo.percent++;
            thisformat.operators.push(scfn.commands.copy);
            thisformat.operands.push(ch);
        } else if (ch == '"') {
            lastwasinteger = 0;
            inquote = 1;
            quotestr = "";
        } else if (ch == "[") {
            lastwasinteger = 0;
            inbracket = 1;
            bracketstr = "";
        } else if (ch == "\\") {
            lastwasslash = 1;
            lastwasinteger = 0;
        } else if (ch == "*") {
            lastwasasterisk = 1;
            lastwasinteger = 0;
        } else if (ch == "_") {
            lastwasunderscore = 1;
            lastwasinteger = 0;
        } else if (ch == ";") {
            section++;
            thisformat.sectioninfo[section] = {};
            sectioninfo = thisformat.sectioninfo[section];
            sectioninfo.sectionstart = 1 + thisformat.operators.length;
            sectioninfo.integerdigits = 0;
            sectioninfo.fractiondigits = 0;
            sectioninfo.commas = 0;
            sectioninfo.percent = 0;
            integerpart = 1;
            lastwasinteger = 0;
            thisformat.operators.push(scfn.commands.section);
            thisformat.operands.push(ch);
        } else if (ch.toLowerCase() == "g") {
            ingeneral = 1;
            lastwasinteger = 0;
        } else if (ch.toLowerCase() == "a") {
            ampmstr = ch;
            lastwasinteger = 0;
        } else if ("dmyhHs".indexOf(ch) >= 0) {
            indate = ch;
        } else {
            lastwasinteger = 0;
            thisformat.operators.push(scfn.commands.copy);
            thisformat.operands.push(ch);
        }
    }
    if (indate) {
        thisformat.operators.push(scfn.commands.date);
        thisformat.operands.push(indate);
        sectioninfo.hasdate = 1;
    }
    return;
};

SocialCalc.FormatNumber.parse_format_bracket = function(bracketstr) {
    var scfn = SocialCalc.FormatNumber;
    var scc = SocialCalc.Constants;
    var bracketdata = {};
    var parts;
    if (bracketstr.charAt(0) == "$") {
        bracketdata.operator = scfn.commands.currency;
        parts = bracketstr.match(/^\$(.+?)(\-.+?){0,1}$/);
        if (parts) {
            bracketdata.operand = parts[1] || scc.FormatNumber_defaultCurrency || "$";
        } else {
            bracketdata.operand = bracketstr.substring(1) || scc.FormatNumber_defaultCurrency || "$";
        }
    } else if (bracketstr == "?$") {
        bracketdata.operator = scfn.commands.currency;
        bracketdata.operand = "[?$]";
    } else if (scfn.allowedcolors[bracketstr.toUpperCase()]) {
        bracketdata.operator = scfn.commands.color;
        bracketdata.operand = scfn.allowedcolors[bracketstr.toUpperCase()];
    } else if (parts = bracketstr.match(/^style=([^"]*)$/)) {
        bracketdata.operator = scfn.commands.style;
        bracketdata.operand = parts[1];
    } else if (bracketstr == ",") {
        bracketdata.operator = scfn.commands.separator;
        bracketdata.operand = bracketstr;
    } else if (scfn.alloweddates[bracketstr.toUpperCase()]) {
        bracketdata.operator = scfn.commands.date;
        bracketdata.operand = scfn.alloweddates[bracketstr.toUpperCase()];
    } else if (parts = bracketstr.match(/^[<>=]/)) {
        parts = bracketstr.match(/^([<>=]+)(.+)$/);
        bracketdata.operator = scfn.commands.comparison;
        bracketdata.operand = parts[1] + ":" + parts[2];
    } else {
        bracketdata.operator = scfn.commands.copy;
        bracketdata.operand = "[" + bracketstr + "]";
    }
    return bracketdata;
};

SocialCalc.FormatNumber.convert_date_gregorian_to_julian = function(year, month, day) {
    var juliandate;
    juliandate = day - 32075 + SocialCalc.intFunc(1461 * (year + 4800 + SocialCalc.intFunc((month - 14) / 12)) / 4);
    juliandate += SocialCalc.intFunc(367 * (month - 2 - SocialCalc.intFunc((month - 14) / 12) * 12) / 12);
    juliandate = juliandate - SocialCalc.intFunc(3 * SocialCalc.intFunc((year + 4900 + SocialCalc.intFunc((month - 14) / 12)) / 100) / 4);
    return juliandate;
};

SocialCalc.FormatNumber.convert_date_julian_to_gregorian = function(juliandate) {
    var L, N, I, J, K;
    L = juliandate + 68569;
    N = Math.floor(4 * L / 146097);
    L = L - Math.floor((146097 * N + 3) / 4);
    I = Math.floor(4e3 * (L + 1) / 1461001);
    L = L - Math.floor(1461 * I / 4) + 31;
    J = Math.floor(80 * L / 2447);
    K = L - Math.floor(2447 * J / 80);
    L = Math.floor(J / 11);
    J = J + 2 - 12 * L;
    I = 100 * (N - 49) + I + L;
    return {
        year: I,
        month: J,
        day: K
    };
};

SocialCalc.intFunc = function(n) {
    if (n < 0) {
        return -Math.floor(-n);
    } else {
        return Math.floor(n);
    }
};

var SocialCalc;

if (!SocialCalc) SocialCalc = {};

SocialCalc.Formula = {};

SocialCalc.Formula.ParseState = {
    num: 1,
    alpha: 2,
    coord: 3,
    string: 4,
    stringquote: 5,
    numexp1: 6,
    numexp2: 7,
    alphanumeric: 8,
    specialvalue: 9
};

SocialCalc.Formula.TokenType = {
    num: 1,
    coord: 2,
    op: 3,
    name: 4,
    error: 5,
    string: 6,
    space: 7
};

SocialCalc.Formula.CharClass = {
    num: 1,
    numstart: 2,
    op: 3,
    eof: 4,
    alpha: 5,
    incoord: 6,
    error: 7,
    quote: 8,
    space: 9,
    specialstart: 10
};

SocialCalc.Formula.CharClassTable = {
    " ": 9,
    "!": 3,
    '"': 8,
    "'": 8,
    "#": 10,
    $: 6,
    "%": 3,
    "&": 3,
    "(": 3,
    ")": 3,
    "*": 3,
    "+": 3,
    ",": 3,
    "-": 3,
    ".": 2,
    "/": 3,
    "0": 1,
    "1": 1,
    "2": 1,
    "3": 1,
    "4": 1,
    "5": 1,
    "6": 1,
    "7": 1,
    "8": 1,
    "9": 1,
    ":": 3,
    "<": 3,
    "=": 3,
    ">": 3,
    A: 5,
    B: 5,
    C: 5,
    D: 5,
    E: 5,
    F: 5,
    G: 5,
    H: 5,
    I: 5,
    J: 5,
    K: 5,
    L: 5,
    M: 5,
    N: 5,
    O: 5,
    P: 5,
    Q: 5,
    R: 5,
    S: 5,
    T: 5,
    U: 5,
    V: 5,
    W: 5,
    X: 5,
    Y: 5,
    Z: 5,
    "^": 3,
    _: 5,
    a: 5,
    b: 5,
    c: 5,
    d: 5,
    e: 5,
    f: 5,
    g: 5,
    h: 5,
    i: 5,
    j: 5,
    k: 5,
    l: 5,
    m: 5,
    n: 5,
    o: 5,
    p: 5,
    q: 5,
    r: 5,
    s: 5,
    t: 5,
    u: 5,
    v: 5,
    w: 5,
    x: 5,
    y: 5,
    z: 5
};

SocialCalc.Formula.UpperCaseTable = {
    a: "A",
    b: "B",
    c: "C",
    d: "D",
    e: "E",
    f: "F",
    g: "G",
    h: "H",
    i: "I",
    j: "J",
    k: "K",
    l: "L",
    m: "M",
    n: "N",
    o: "O",
    p: "P",
    q: "Q",
    r: "R",
    s: "S",
    t: "T",
    u: "U",
    v: "V",
    w: "W",
    x: "X",
    y: "Y",
    z: "Z",
    A: "A",
    B: "B",
    C: "C",
    D: "D",
    E: "E",
    F: "F",
    G: "G",
    H: "H",
    I: "I",
    J: "J",
    K: "K",
    L: "L",
    M: "M",
    N: "N",
    O: "O",
    P: "P",
    Q: "Q",
    R: "R",
    S: "S",
    T: "T",
    U: "U",
    V: "V",
    W: "W",
    X: "X",
    Y: "Y",
    Z: "Z"
};

SocialCalc.Formula.SpecialConstants = {
    "#NULL!": "0,e#NULL!",
    "#NUM!": "0,e#NUM!",
    "#DIV/0!": "0,e#DIV/0!",
    "#VALUE!": "0,e#VALUE!",
    "#REF!": "0,e#REF!",
    "#NAME?": "0,e#NAME?"
};

SocialCalc.Formula.TokenPrecedence = {
    "!": 1,
    ":": 2,
    ",": 2,
    M: -3,
    P: -3,
    "%": 4,
    "^": 5,
    "*": 6,
    "/": 6,
    "+": 7,
    "-": 7,
    "&": 8,
    "<": 9,
    ">": 9,
    G: 9,
    L: 9,
    N: 9
};

SocialCalc.Formula.TokenOpExpansion = {
    G: ">=",
    L: "<=",
    M: "-",
    N: "<>",
    P: "+"
};

SocialCalc.Formula.TypeLookupTable = {
    unaryminus: {
        "n*": "|n*:1|",
        "e*": "|e*:1|",
        "t*": "|t*:e#VALUE!|",
        b: "|b:n|"
    },
    unaryplus: {
        "n*": "|n*:1|",
        "e*": "|e*:1|",
        "t*": "|t*:e#VALUE!|",
        b: "|b:n|"
    },
    unarypercent: {
        "n*": "|n:n%|n*:n|",
        "e*": "|e*:1|",
        "t*": "|t*:e#VALUE!|",
        b: "|b:n|"
    },
    plus: {
        "n%": "|n%:n%|nd:n|nt:n|ndt:n|n$:n|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|",
        nd: "|n%:n|nd:nd|nt:ndt|ndt:ndt|n$:n|n:nd|n*:n|b:n|e*:2|t*:e#VALUE!|",
        nt: "|n%:n|nd:ndt|nt:nt|ndt:ndt|n$:n|n:nt|n*:n|b:n|e*:2|t*:e#VALUE!|",
        ndt: "|n%:n|nd:ndt|nt:ndt|ndt:ndt|n$:n|n:ndt|n*:n|b:n|e*:2|t*:e#VALUE!|",
        n$: "|n%:n|nd:n|nt:n|ndt:n|n$:n$|n:n$|n*:n|b:n|e*:2|t*:e#VALUE!|",
        nl: "|n%:n|nd:n|nt:n|ndt:n|n$:n|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|",
        n: "|n%:n|nd:nd|nt:nt|ndt:ndt|n$:n$|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|",
        b: "|n%:n%|nd:nd|nt:nt|ndt:ndt|n$:n$|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|",
        "t*": "|n*:e#VALUE!|t*:e#VALUE!|b:e#VALUE!|e*:2|",
        "e*": "|e*:1|n*:1|t*:1|b:1|"
    },
    concat: {
        t: "|t:t|th:th|tw:tw|tl:t|tr:tr|t*:2|e*:2|",
        th: "|t:th|th:th|tw:t|tl:th|tr:t|t*:t|e*:2|",
        tw: "|t:tw|th:t|tw:tw|tl:tw|tr:tw|t*:t|e*:2|",
        tl: "|t:tl|th:th|tw:tw|tl:tl|tr:tr|t*:t|e*:2|",
        "t*": "|t*:t|e*:2|",
        "e*": "|e*:1|n*:1|t*:1|"
    },
    oneargnumeric: {
        "n*": "|n*:n|",
        "e*": "|e*:1|",
        "t*": "|t*:e#VALUE!|",
        b: "|b:n|"
    },
    twoargnumeric: {
        "n*": "|n*:n|t*:e#VALUE!|e*:2|",
        "e*": "|e*:1|n*:1|t*:1|",
        "t*": "|t*:e#VALUE!|n*:e#VALUE!|e*:2|"
    },
    propagateerror: {
        "n*": "|n*:2|e*:2|",
        "e*": "|e*:2|",
        "t*": "|t*:2|e*:2|",
        b: "|b:2|e*:2|"
    }
};

SocialCalc.Formula.ParseFormulaIntoTokens = function(line) {
    var i, ch, cclass, haddecimal, last_token, last_token_type, last_token_text, t;
    var scf = SocialCalc.Formula;
    var scc = SocialCalc.Constants;
    var parsestate = scf.ParseState;
    var tokentype = scf.TokenType;
    var charclass = scf.CharClass;
    var charclasstable = scf.CharClassTable;
    var uppercasetable = scf.UpperCaseTable;
    var pushtoken = scf.ParsePushToken;
    var coordregex = /^\$?[A-Z]{1,2}\$?[1-9]\d*$/i;
    var parseinfo = [];
    var str = "";
    var state = 0;
    var haddecimal = false;
    for (i = 0; i <= line.length; i++) {
        if (i < line.length) {
            ch = line.charAt(i);
            cclass = charclasstable[ch];
        } else {
            ch = "";
            cclass = charclass.eof;
        }
        if (state == parsestate.num) {
            if (cclass == charclass.num) {
                str += ch;
            } else if (cclass == charclass.numstart && !haddecimal) {
                haddecimal = true;
                str += ch;
            } else if (ch == "E" || ch == "e") {
                str += ch;
                haddecimal = false;
                state = parsestate.numexp1;
            } else {
                pushtoken(parseinfo, str, tokentype.num, 0);
                haddecimal = false;
                state = 0;
            }
        }
        if (state == parsestate.numexp1) {
            if (cclass == parsestate.num) {
                state = parsestate.numexp2;
            } else if ((ch == "+" || ch == "-") && uppercasetable[str.charAt(str.length - 1)] == "E") {
                str += ch;
            } else if (ch == "E" || ch == "e") {
            } else {
                pushtoken(parseinfo, scc.s_parseerrexponent, tokentype.error, 0);
                state = 0;
            }
        }
        if (state == parsestate.numexp2) {
            if (cclass == charclass.num) {
                str += ch;
            } else {
                pushtoken(parseinfo, str, tokentype.num, 0);
                state = 0;
            }
        }
        if (state == parsestate.alpha) {
            if (cclass == charclass.num) {
                state = parsestate.coord;
            } else if (cclass == charclass.alpha || ch == ".") {
                str += ch;
            } else if (cclass == charclass.incoord) {
                state = parsestate.coord;
            } else if (cclass == charclass.op || cclass == charclass.numstart || cclass == charclass.space || cclass == charclass.eof) {
                pushtoken(parseinfo, str.toUpperCase(), tokentype.name, 0);
                state = 0;
            } else {
                pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
                state = 0;
            }
        }
        if (state == parsestate.coord) {
            if (cclass == charclass.num) {
                str += ch;
            } else if (cclass == charclass.incoord) {
                str += ch;
            } else if (cclass == charclass.alpha) {
                state = parsestate.alphanumeric;
            } else if (cclass == charclass.op || cclass == charclass.numstart || cclass == charclass.eof || cclass == charclass.space) {
                if (coordregex.test(str)) {
                    t = tokentype.coord;
                } else {
                    t = tokentype.name;
                }
                pushtoken(parseinfo, str.toUpperCase(), t, 0);
                state = 0;
            } else {
                pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
                state = 0;
            }
        }
        if (state == parsestate.alphanumeric) {
            if (cclass == charclass.num || cclass == charclass.alpha) {
                str += ch;
            } else if (cclass == charclass.op || cclass == charclass.numstart || cclass == charclass.space || cclass == charclass.eof) {
                pushtoken(parseinfo, str.toUpperCase(), tokentype.name, 0);
                state = 0;
            } else {
                pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
                state = 0;
            }
        }
        if (state == parsestate.string) {
            if (cclass == charclass.quote) {
                state = parsestate.stringquote;
            } else if (cclass == charclass.eof) {
                pushtoken(parseinfo, scc.s_parseerrstring, tokentype.error, 0);
                state = 0;
            } else {
                str += ch;
            }
        } else if (state == parsestate.stringquote) {
            if (cclass == charclass.quote) {
                str += ch;
                state = parsestate.string;
            } else {
                pushtoken(parseinfo, str, tokentype.string, 0);
                state = 0;
            }
        } else if (state == parsestate.specialvalue) {
            if (str.charAt(str.length - 1) == "!") {
                pushtoken(parseinfo, str, tokentype.name, 0);
                state = 0;
            } else if (cclass == charclass.eof) {
                pushtoken(parseinfo, scc.s_parseerrspecialvalue, tokentype.error, 0);
                state = 0;
            } else {
                str += ch;
            }
        }
        if (state == 0) {
            if (cclass == charclass.num) {
                str = ch;
                state = parsestate.num;
            } else if (cclass == charclass.numstart) {
                str = ch;
                haddecimal = true;
                state = parsestate.num;
            } else if (cclass == charclass.alpha || cclass == charclass.incoord) {
                str = ch;
                state = parsestate.alpha;
            } else if (cclass == charclass.specialstart) {
                str = ch;
                state = parsestate.specialvalue;
            } else if (cclass == charclass.op) {
                str = ch;
                if (parseinfo.length > 0) {
                    last_token = parseinfo[parseinfo.length - 1];
                    last_token_type = last_token.type;
                    last_token_text = last_token.text;
                    if (last_token_type == charclass.op) {
                        if (last_token_text == "<" || last_token_text == ">") {
                            str = last_token_text + str;
                            parseinfo.pop();
                            if (parseinfo.length > 0) {
                                last_token = parseinfo[parseinfo.length - 1];
                                last_token_type = last_token.type;
                                last_token_text = last_token.text;
                            } else {
                                last_token_type = charclass.eof;
                                last_token_text = "EOF";
                            }
                        }
                    }
                } else {
                    last_token_type = charclass.eof;
                    last_token_text = "EOF";
                }
                t = tokentype.op;
                if (parseinfo.length == 0 || last_token_type == charclass.op && last_token_text != ")" && last_token_text != "%") {
                    if (str == "-") {
                        str = "M";
                        ch = "M";
                    } else if (str == "+") {
                        str = "P";
                        ch = "P";
                    } else if (str == ")" && last_token_text == "(") {
                    } else if (str != "(") {
                        t = tokentype.error;
                        str = scc.s_parseerrtwoops;
                    }
                } else if (str.length > 1) {
                    if (str == ">=") {
                        str = "G";
                        ch = "G";
                    } else if (str == "<=") {
                        str = "L";
                        ch = "L";
                    } else if (str == "<>") {
                        str = "N";
                        ch = "N";
                    } else {
                        t = tokentype.error;
                        str = scc.s_parseerrtwoops;
                    }
                }
                pushtoken(parseinfo, str, t, ch);
                state = 0;
            } else if (cclass == charclass.quote) {
                str = "";
                state = parsestate.string;
            } else if (cclass == charclass.space) {} else if (cclass == charclass.eof) {} else {
                pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
            }
        }
    }
    return parseinfo;
};

SocialCalc.Formula.ParsePushToken = function(parseinfo, ttext, ttype, topcode) {
    parseinfo.push({
        text: ttext,
        type: ttype,
        opcode: topcode
    });
};

SocialCalc.Formula.evaluate_parsed_formula = function(parseinfo, sheet, allowrangereturn) {
    var result;
    var scf = SocialCalc.Formula;
    var tokentype = scf.TokenType;
    var revpolish;
    var parsestack = [];
    var errortext = "";
    revpolish = scf.ConvertInfixToPolish(parseinfo);
    result = scf.EvaluatePolish(parseinfo, revpolish, sheet, allowrangereturn);
    return result;
};

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
    for (i = 0; i < parseinfo.length; i++) {
        pii = parseinfo[i];
        ttype = pii.type;
        ttext = pii.text;
        if (ttype == tokentype.num || ttype == tokentype.coord || ttype == tokentype.string) {
            revpolish.push(i);
        } else if (ttype == tokentype.name) {
            parsestack.push(i);
            revpolish.push(function_start);
        } else if (ttype == tokentype.space) {
            continue;
        } else if (ttext == ",") {
            while (parsestack.length && parseinfo[parsestack[parsestack.length - 1]].text != "(") {
                revpolish.push(parsestack.pop());
            }
            if (parsestack.length == 0) {
                errortext = scc.s_parseerrmissingopenparen;
                break;
            }
        } else if (ttext == "(") {
            parsestack.push(i);
        } else if (ttext == ")") {
            while (parsestack.length && parseinfo[parsestack[parsestack.length - 1]].text != "(") {
                revpolish.push(parsestack.pop());
            }
            if (parsestack.length == 0) {
                errortext = scc.s_parseerrcloseparennoopen;
                break;
            }
            parsestack.pop();
            if (parsestack.length && parseinfo[parsestack[parsestack.length - 1]].type == tokentype.name) {
                revpolish.push(parsestack.pop());
            }
        } else if (ttype == tokentype.op) {
            if (parsestack.length && parseinfo[parsestack[parsestack.length - 1]].type == tokentype.name) {
                revpolish.push(parsestack.pop());
            }
            while (parsestack.length && parseinfo[parsestack[parsestack.length - 1]].type == tokentype.op && parseinfo[parsestack[parsestack.length - 1]].text != "(") {
                tprecedence = token_precedence[pii.opcode];
                tstackprecedence = token_precedence[parseinfo[parsestack[parsestack.length - 1]].opcode];
                if (tprecedence >= 0 && tprecedence < tstackprecedence) {
                    break;
                } else if (tprecedence < 0) {
                    tprecedence = -tprecedence;
                    if (tstackprecedence < 0) tstackprecedence = -tstackprecedence;
                    if (tprecedence <= tstackprecedence) {
                        break;
                    }
                }
                revpolish.push(parsestack.pop());
            }
            parsestack.push(i);
        } else if (ttype == tokentype.error) {
            errortext = ttext;
            break;
        } else {
            errortext = "Internal error while processing parsed formula. ";
            break;
        }
    }
    while (parsestack.length > 0) {
        if (parseinfo[parsestack[parsestack.length - 1]].text == "(") {
            errortext = scc.s_parseerrmissingcloseparen;
            break;
        }
        revpolish.push(parsestack.pop());
    }
    if (errortext) {
        return errortext;
    }
    return revpolish;
};

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
    var format_number_for_display = SocialCalc.format_number_for_display || function(v, t, f) {
        return v + "";
    };
    var errortext = "";
    var function_start = -1;
    var missingOperandError = {
        value: "",
        type: "e#VALUE!",
        error: scc.s_parseerrmissingoperand
    };
    var operand = [];
    var PushOperand = function(t, v) {
        operand.push({
            type: t,
            value: v
        });
    };
    var i, rii, prii, ttype, ttext, value1, value2, tostype, tostype2, resulttype, valuetype, cond, vmatch, smatch;
    if (!parseinfo.length || !(revpolish instanceof Array)) {
        return {
            value: "",
            type: "e#VALUE!",
            error: typeof revpolish == "string" ? revpolish : ""
        };
    }
    for (i = 0; i < revpolish.length; i++) {
        rii = revpolish[i];
        if (rii == function_start) {
            PushOperand("start", 0);
            continue;
        }
        prii = parseinfo[rii];
        ttype = prii.type;
        ttext = prii.text;
        if (ttype == tokentype.num) {
            PushOperand("n", ttext - 0);
        } else if (ttype == tokentype.coord) {
            PushOperand("coord", ttext);
        } else if (ttype == tokentype.string) {
            PushOperand("t", ttext);
        } else if (ttype == tokentype.op) {
            if (operand.length <= 0) {
                return missingOperandError;
                break;
            }
            if (ttext == "M") {
                value1 = operand_as_number(sheet, operand);
                resulttype = lookup_result_type(value1.type, value1.type, typelookup.unaryminus);
                PushOperand(resulttype, -value1.value);
            } else if (ttext == "P") {
                value1 = operand_as_number(sheet, operand);
                resulttype = lookup_result_type(value1.type, value1.type, typelookup.unaryplus);
                PushOperand(resulttype, value1.value);
            } else if (ttext == "%") {
                value1 = operand_as_number(sheet, operand);
                resulttype = lookup_result_type(value1.type, value1.type, typelookup.unarypercent);
                PushOperand(resulttype, .01 * value1.value);
            } else if (ttext == "&") {
                if (operand.length <= 1) {
                    return missingOperandError;
                }
                value2 = operand_as_text(sheet, operand);
                value1 = operand_as_text(sheet, operand);
                resulttype = lookup_result_type(value1.type, value1.type, typelookup.concat);
                PushOperand(resulttype, value1.value + value2.value);
            } else if (ttext == ":") {
                if (operand.length <= 1) {
                    return missingOperandError;
                }
                value1 = scf.OperandsAsRangeOnSheet(sheet, operand);
                if (value1.error) {
                    errortext = errortext || value1.error;
                }
                PushOperand(value1.type, value1.value);
            } else if (ttext == "!") {
                if (operand.length <= 1) {
                    return missingOperandError;
                }
                value1 = operands_as_coord_on_sheet(sheet, operand);
                if (value1.error) {
                    errortext = errortext || value1.error;
                }
                PushOperand(value1.type, value1.value);
            } else if (ttext == "<" || ttext == "L" || ttext == "=" || ttext == "G" || ttext == ">" || ttext == "N") {
                if (operand.length <= 1) {
                    errortext = scc.s_parseerrmissingoperand;
                    break;
                }
                value2 = operand_value_and_type(sheet, operand);
                value1 = operand_value_and_type(sheet, operand);
                if (value1.type.charAt(0) == "n" && value2.type.charAt(0) == "n") {
                    cond = 0;
                    if (ttext == "<") {
                        cond = value1.value < value2.value ? 1 : 0;
                    } else if (ttext == "L") {
                        cond = value1.value <= value2.value ? 1 : 0;
                    } else if (ttext == "=") {
                        cond = value1.value == value2.value ? 1 : 0;
                    } else if (ttext == "G") {
                        cond = value1.value >= value2.value ? 1 : 0;
                    } else if (ttext == ">") {
                        cond = value1.value > value2.value ? 1 : 0;
                    } else if (ttext == "N") {
                        cond = value1.value != value2.value ? 1 : 0;
                    }
                    PushOperand("nl", cond);
                } else if (value1.type.charAt(0) == "e") {
                    PushOperand(value1.type, 0);
                } else if (value2.type.charAt(0) == "e") {
                    PushOperand(value2.type, 0);
                } else {
                    tostype = value1.type.charAt(0);
                    tostype2 = value2.type.charAt(0);
                    if (tostype == "n") {
                        value1.value = format_number_for_display(value1.value, "n", "");
                    } else if (tostype == "b") {
                        value1.value = "";
                    }
                    if (tostype2 == "n") {
                        value2.value = format_number_for_display(value2.value, "n", "");
                    } else if (tostype2 == "b") {
                        value2.value = "";
                    }
                    cond = 0;
                    value1.value = value1.value.toLowerCase();
                    value2.value = value2.value.toLowerCase();
                    if (ttext == "<") {
                        cond = value1.value < value2.value ? 1 : 0;
                    } else if (ttext == "L") {
                        cond = value1.value <= value2.value ? 1 : 0;
                    } else if (ttext == "=") {
                        cond = value1.value == value2.value ? 1 : 0;
                    } else if (ttext == "G") {
                        cond = value1.value >= value2.value ? 1 : 0;
                    } else if (ttext == ">") {
                        cond = value1.value > value2.value ? 1 : 0;
                    } else if (ttext == "N") {
                        cond = value1.value != value2.value ? 1 : 0;
                    }
                    PushOperand("nl", cond);
                }
            } else {
                if (operand.length <= 1) {
                    errortext = scc.s_parseerrmissingoperand;
                    break;
                }
                value2 = operand_as_number(sheet, operand);
                value1 = operand_as_number(sheet, operand);
                if (ttext == "+") {
                    resulttype = lookup_result_type(value1.type, value2.type, typelookup.plus);
                    PushOperand(resulttype, value1.value + value2.value);
                } else if (ttext == "-") {
                    resulttype = lookup_result_type(value1.type, value2.type, typelookup.plus);
                    PushOperand(resulttype, value1.value - value2.value);
                } else if (ttext == "*") {
                    resulttype = lookup_result_type(value1.type, value2.type, typelookup.plus);
                    PushOperand(resulttype, value1.value * value2.value);
                } else if (ttext == "/") {
                    if (value2.value != 0) {
                        PushOperand("n", value1.value / value2.value);
                    } else {
                        PushOperand("e#DIV/0!", 0);
                    }
                } else if (ttext == "^") {
                    value1.value = Math.pow(value1.value, value2.value);
                    value1.type = "n";
                    if (isNaN(value1.value)) {
                        value1.value = 0;
                        value1.type = "e#NUM!";
                    }
                    PushOperand(value1.type, value1.value);
                }
            }
        } else if (ttype == tokentype.name) {
            errortext = scf.CalculateFunction(ttext, operand, sheet);
            if (errortext) break;
        } else {
            errortext = scc.s_InternalError + "Unknown token " + ttype + " (" + ttext + "). ";
            break;
        }
    }
    value = operand[0] ? operand[0].value : "";
    tostype = operand[0] ? operand[0].type : "";
    if (tostype == "name") {
        value1 = SocialCalc.Formula.LookupName(sheet, value);
        value = value1.value;
        tostype = value1.type;
        errortext = errortext || value1.error;
    }
    if (tostype == "coord") {
        value1 = operand_value_and_type(sheet, operand);
        value = value1.value;
        tostype = value1.type;
        if (tostype == "b") {
            tostype = "n";
            value = 0;
        }
    }
    if (operand.length > 1 && !errortext) {
        errortext += scc.s_parseerrerrorinformula;
    }
    valuetype = tostype;
    if (tostype.charAt(0) == "e") {
        errortext = errortext || tostype.substring(1) || scc.s_calcerrerrorvalueinformula;
    } else if (tostype == "range") {
        vmatch = value.match(/^(.*)\|(.*)\|/);
        smatch = vmatch[1].indexOf("!");
        if (smatch >= 0) {
            vmatch[1] = vmatch[1].substring(smatch + 1) + "!" + vmatch[1].substring(0, smatch).toUpperCase();
        } else {
            vmatch[1] = vmatch[1].toUpperCase();
        }
        value = vmatch[1] + ":" + vmatch[2].toUpperCase();
        if (!allowrangereturn) {
            errortext = scc.s_formularangeresult + " " + value;
        }
    }
    if (errortext && valuetype.charAt(0) != "e") {
        value = errortext;
        valuetype = "e";
    }
    if (valuetype.charAt(0) == "n" && (isNaN(value) || !isFinite(value))) {
        value = 0;
        valuetype = "e#NUM!";
        errortext = isNaN(value) ? scc.s_calcerrnumericnan : scc.s_calcerrnumericoverflow;
    }
    return {
        value: value,
        type: valuetype,
        error: errortext
    };
};

SocialCalc.Formula.LookupResultType = function(type1, type2, typelookup) {
    var pos1, pos2, result;
    var table1 = typelookup[type1];
    if (!table1) {
        table1 = typelookup[type1.charAt(0) + "*"];
        if (!table1) {
            return "e#VALUE! (internal error, missing LookupResultType " + type1.charAt(0) + "*)";
        }
    }
    pos1 = table1.indexOf("|" + type2 + ":");
    if (pos1 >= 0) {
        pos2 = table1.indexOf("|", pos1 + 1);
        if (pos2 < 0) return "e#VALUE! (internal error, incorrect LookupResultType " + table1 + ")";
        result = table1.substring(pos1 + type2.length + 2, pos2);
        if (result == "1") return type1;
        if (result == "2") return type2;
        return result;
    }
    pos1 = table1.indexOf("|" + type2.charAt(0) + "*:");
    if (pos1 >= 0) {
        pos2 = table1.indexOf("|", pos1 + 1);
        if (pos2 < 0) return "e#VALUE! (internal error, incorrect LookupResultType " + table1 + ")";
        result = table1.substring(pos1 + 4, pos2);
        if (result == "1") return type1;
        if (result == "2") return type2;
        return result;
    }
    return "e#VALUE!";
};

SocialCalc.Formula.TopOfStackValueAndType = function(sheet, operand) {
    var cellvtype, cell, pos, coordsheet;
    var scf = SocialCalc.Formula;
    var result = {
        type: "",
        value: ""
    };
    var stacklen = operand.length;
    if (!stacklen) {
        result.error = SocialCalc.Constants.s_InternalError + "no operand on stack";
        return result;
    }
    result.value = operand[stacklen - 1].value;
    result.type = operand[stacklen - 1].type;
    operand.pop();
    if (result.type == "name") {
        result = scf.LookupName(sheet, result.value);
    }
    return result;
};

SocialCalc.Formula.OperandAsNumber = function(sheet, operand) {
    var t, valueinfo;
    var operandinfo = SocialCalc.Formula.OperandValueAndType(sheet, operand);
    t = operandinfo.type.charAt(0);
    if (t == "n") {
        operandinfo.value = operandinfo.value - 0;
    } else if (t == "b") {
        operandinfo.type = "n";
        operandinfo.value = 0;
    } else if (t == "e") {
        operandinfo.value = 0;
    } else {
        valueinfo = SocialCalc.DetermineValueType ? SocialCalc.DetermineValueType(operandinfo.value) : {
            value: operandinfo.value - 0,
            type: "n"
        };
        if (valueinfo.type.charAt(0) == "n") {
            operandinfo.value = valueinfo.value - 0;
            operandinfo.type = valueinfo.type;
        } else {
            operandinfo.value = 0;
            operandinfo.type = valueinfo.type;
        }
    }
    return operandinfo;
};

SocialCalc.Formula.OperandAsText = function(sheet, operand) {
    var t, valueinfo;
    var operandinfo = SocialCalc.Formula.OperandValueAndType(sheet, operand);
    t = operandinfo.type.charAt(0);
    if (t == "t") {
    } else if (t == "n") {
        operandinfo.value = SocialCalc.format_number_for_display ? SocialCalc.format_number_for_display(operandinfo.value, operandinfo.type, "") : operandinfo.value = operandinfo.value + "";
        operandinfo.type = "t";
    } else if (t == "b") {
        operandinfo.value = "";
        operandinfo.type = "t";
    } else if (t == "e") {
        operandinfo.value = "";
    } else {
        operand.value = operandinfo.value + "";
        operand.type = "t";
    }
    return operandinfo;
};

SocialCalc.Formula.OperandValueAndType = function(sheet, operand) {
    var cellvtype, cell, pos, coordsheet;
    var scf = SocialCalc.Formula;
    var result = {
        type: "",
        value: ""
    };
    var stacklen = operand.length;
    if (!stacklen) {
        result.error = SocialCalc.Constants.s_InternalError + "no operand on stack";
        return result;
    }
    result.value = operand[stacklen - 1].value;
    result.type = operand[stacklen - 1].type;
    operand.pop();
    if (result.type == "name") {
        result = scf.LookupName(sheet, result.value);
    }
    if (result.type == "range") {
        result = scf.StepThroughRangeDown(operand, result.value);
    }
    if (result.type == "coord") {
        coordsheet = sheet;
        pos = result.value.indexOf("!");
        if (pos != -1) {
            coordsheet = scf.FindInSheetCache(result.value.substring(pos + 1));
            if (coordsheet == null) {
                result.type = "e#REF!";
                result.error = SocialCalc.Constants.s_sheetunavailable + " " + result.value.substring(pos + 1);
                result.value = 0;
                return result;
            }
            result.value = result.value.substring(0, pos);
        }
        if (coordsheet) {
            cell = coordsheet.cells[SocialCalc.Formula.PlainCoord(result.value)];
            if (cell) {
                cellvtype = cell.valuetype;
                result.value = cell.datavalue;
            } else {
                cellvtype = "b";
            }
        } else {
            cellvtype = "e#N/A";
            result.value = 0;
        }
        result.type = cellvtype || "b";
        if (result.type == "b") {
            result.value = 0;
        }
    }
    return result;
};

SocialCalc.Formula.OperandAsCoord = function(sheet, operand) {
    var scf = SocialCalc.Formula;
    var result = {
        type: "",
        value: ""
    };
    var stacklen = operand.length;
    result.value = operand[stacklen - 1].value;
    result.type = operand[stacklen - 1].type;
    operand.pop();
    if (result.type == "name") {
        result = SocialCalc.Formula.LookupName(sheet, result.value);
    }
    if (result.type == "coord") {
        return result;
    } else {
        result.value = SocialCalc.Constants.s_calcerrcellrefmissing;
        result.type = "e#REF!";
        return result;
    }
};

SocialCalc.Formula.OperandsAsCoordOnSheet = function(sheet, operand) {
    var sheetname, othersheet, pos1, pos2;
    var value1 = {};
    var result = {};
    var scf = SocialCalc.Formula;
    var stacklen = operand.length;
    value1.value = operand[stacklen - 1].value;
    value1.type = operand[stacklen - 1].type;
    operand.pop();
    sheetname = scf.OperandAsSheetName(sheet, operand);
    othersheet = scf.FindInSheetCache(sheetname.value);
    if (othersheet == null) {
        result.type = "e#REF!";
        result.value = 0;
        result.error = SocialCalc.Constants.s_sheetunavailable + " " + sheetname.value;
        return result;
    }
    if (value1.type == "name") {
        value1 = scf.LookupName(othersheet, value1.value);
    }
    result.type = value1.type;
    if (value1.type == "coord") {
        result.value = value1.value + "!" + sheetname.value;
    } else if (value1.type == "range") {
        pos1 = value1.value.indexOf("|");
        pos2 = value1.value.indexOf("|", pos1 + 1);
        result.value = value1.value.substring(0, pos1) + "!" + sheetname.value + "|" + value1.value.substring(pos1 + 1, pos2) + "|";
    } else if (value1.type.charAt(0) == "e") {
        result.value = value1.value;
    } else {
        result.error = SocialCalc.Constants.s_calcerrcellrefmissing;
        result.type = "e#REF!";
        result.value = 0;
    }
    return result;
};

SocialCalc.Formula.OperandsAsRangeOnSheet = function(sheet, operand) {
    var value1, othersheet, pos1, pos2;
    var value2 = {};
    var scf = SocialCalc.Formula;
    var scc = SocialCalc.Constants;
    var stacklen = operand.length;
    value2.value = operand[stacklen - 1].value;
    value2.type = operand[stacklen - 1].type;
    operand.pop();
    value1 = scf.OperandAsCoord(sheet, operand);
    if (value1.type != "coord") {
        return {
            value: 0,
            type: "e#REF!"
        };
    }
    othersheet = sheet;
    pos1 = value1.value.indexOf("!");
    if (pos1 != -1) {
        pos2 = value1.value.indexOf("|", pos1 + 1);
        if (pos2 < 0) pos2 = value1.value.length;
        othersheet = scf.FindInSheetCache(value1.value.substring(pos1 + 1, pos2));
        if (othersheet == null) {
            return {
                value: 0,
                type: "e#REF!",
                errortext: scc.s_sheetunavailable + " " + value1.value.substring(pos1 + 1, pos2)
            };
        }
    }
    if (value2.type == "name") {
        value2 = scf.LookupName(othersheet, value2.value, "end");
    }
    if (value2.type == "coord") {
        return {
            value: value1.value + "|" + value2.value + "|",
            type: "range"
        };
    } else {
        return {
            value: scc.s_calcerrcellrefmissing,
            type: "e#REF!"
        };
    }
};

SocialCalc.Formula.OperandAsSheetName = function(sheet, operand) {
    var nvalue, cell;
    var scf = SocialCalc.Formula;
    var result = {
        type: "",
        value: ""
    };
    var stacklen = operand.length;
    result.value = operand[stacklen - 1].value;
    result.type = operand[stacklen - 1].type;
    operand.pop();
    if (result.type == "name") {
        nvalue = SocialCalc.Formula.LookupName(sheet, result.value);
        if (!nvalue.value) {
            return result;
        }
        result.value = nvalue.value;
        result.type = nvalue.type;
    }
    if (result.type == "coord") {
        cell = sheet.cells[SocialCalc.Formula.PlainCoord(result.value)];
        if (cell) {
            result.value = cell.datavalue;
            result.type = cell.valuetype;
        } else {
            result.value = "";
            result.type = "b";
        }
    }
    if (result.type.charAt(0) == "t") {
        return result;
    } else {
        result.value = "";
        result.error = SocialCalc.Constants.s_calcerrsheetnamemissing;
        return result;
    }
};

SocialCalc.Formula.LookupName = function(sheet, name, isEnd) {
    var pos, specialc, parseinfo;
    var names = sheet.names;
    var value = {};
    var startedwalk = false;
    if (names[name.toUpperCase()]) {
        value.value = names[name.toUpperCase()].definition;
        if (value.value.charAt(0) == "=") {
            if (!sheet.checknamecirc) {
                sheet.checknamecirc = {};
                startedwalk = true;
            } else {
                if (sheet.checknamecirc[name]) {
                    value.type = "e#NAME?";
                    value.error = SocialCalc.Constants.s_circularnameref + ' "' + name + '".';
                    return value;
                }
            }
            sheet.checknamecirc[name] = true;
            parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(value.value.substring(1));
            value = SocialCalc.Formula.evaluate_parsed_formula(parseinfo, sheet, 1);
            delete sheet.checknamecirc[name];
            if (startedwalk) {
                delete sheet.checknamecirc;
            }
            if (value.type != "range") {
                return value;
            }
        }
        pos = value.value.indexOf(":");
        if (pos != -1) {
            value.type = "range";
            value.value = value.value.substring(0, pos) + "|" + value.value.substring(pos + 1) + "|";
            value.value = value.value.toUpperCase();
        } else {
            value.type = "coord";
            value.value = value.value.toUpperCase();
        }
        return value;
    } else if (specialc = SocialCalc.Formula.SpecialConstants[name.toUpperCase()]) {
        pos = specialc.indexOf(",");
        value.value = specialc.substring(0, pos) - 0;
        value.type = specialc.substring(pos + 1);
        return value;
    } else if (/^[a-zA-Z][a-zA-Z]?$/.test(name)) {
        value.type = "coord";
        value.value = name.toUpperCase() + (isEnd ? sheet.attribs.lastrow : 1);
        return value;
    } else {
        value.value = "";
        value.type = "e#NAME?";
        value.error = SocialCalc.Constants.s_calcerrunknownname + ' "' + name + '"';
        return value;
    }
};

SocialCalc.Formula.StepThroughRangeDown = function(operand, rangevalue) {
    var value1, value2, sequence, pos1, pos2, sheet1, rp, c, r, count;
    var scf = SocialCalc.Formula;
    pos1 = rangevalue.indexOf("|");
    pos2 = rangevalue.indexOf("|", pos1 + 1);
    value1 = rangevalue.substring(0, pos1);
    value2 = rangevalue.substring(pos1 + 1, pos2);
    sequence = rangevalue.substring(pos2 + 1) - 0;
    pos1 = value1.indexOf("!");
    if (pos1 != -1) {
        sheet1 = value1.substring(pos1);
        value1 = value1.substring(0, pos1);
    } else {
        sheet1 = "";
    }
    pos1 = value2.indexOf("!");
    if (pos1 != -1) {
        value2 = value2.substring(0, pos1);
    }
    rp = scf.OrderRangeParts(value1, value2);
    count = 0;
    for (r = rp.r1; r <= rp.r2; r++) {
        for (c = rp.c1; c <= rp.c2; c++) {
            count++;
            if (count > sequence) {
                if (r != rp.r2 || c != rp.c2) {
                    scf.PushOperand(operand, "range", value1 + sheet1 + "|" + value2 + "|" + count);
                }
                return {
                    value: SocialCalc.crToCoord(c, r) + sheet1,
                    type: "coord"
                };
            }
        }
    }
};

SocialCalc.Formula.DecodeRangeParts = function(sheetdata, range) {
    var value1, value2, pos1, pos2, sheet1, coordsheetdata, rp;
    var scf = SocialCalc.Formula;
    pos1 = range.indexOf("|");
    pos2 = range.indexOf("|", pos1 + 1);
    value1 = range.substring(0, pos1);
    value2 = range.substring(pos1 + 1, pos2);
    pos1 = value1.indexOf("!");
    if (pos1 != -1) {
        sheet1 = value1.substring(pos1 + 1);
        value1 = value1.substring(0, pos1);
    } else {
        sheet1 = "";
    }
    pos1 = value2.indexOf("!");
    if (pos1 != -1) {
        value2 = value2.substring(0, pos1);
    }
    coordsheetdata = sheetdata;
    if (sheet1) {
        coordsheetdata = scf.FindInSheetCache(sheet1);
        if (coordsheetdata == null) {
            return null;
        }
    }
    rp = scf.OrderRangeParts(value1, value2);
    return {
        sheetdata: coordsheetdata,
        sheetname: sheet1,
        col1num: rp.c1,
        ncols: rp.c2 - rp.c1 + 1,
        row1num: rp.r1,
        nrows: rp.r2 - rp.r1 + 1
    };
};

if (!SocialCalc.Formula.FunctionList) {
    SocialCalc.Formula.FunctionList = {};
}

SocialCalc.Formula.FunctionClasses = null;

SocialCalc.Formula.FunctionArgDefs = {};

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
            } else {
                if (foperand.length != argnum) {
                    errortext = scf.FunctionArgsError(fname, operand);
                    return errortext;
                }
            }
        }
        errortext = ffunc(fname, operand, foperand, sheet);
    } else {
        ttext = fname;
        if (operand.length && operand[operand.length - 1].type == "start") {
            operand.pop();
            scf.PushOperand(operand, "name", ttext);
        } else {
            errortext = SocialCalc.Constants.s_sheetfuncunknownfunction + " " + ttext + ". ";
        }
    }
    return errortext;
};

SocialCalc.Formula.PushOperand = function(operand, t, v) {
    operand.push({
        type: t,
        value: v
    });
};

SocialCalc.Formula.CopyFunctionArgs = function(operand, foperand) {
    var fobj, foperand, ffunc, argnum;
    var scf = SocialCalc.Formula;
    var ok = 1;
    var errortext = null;
    while (operand.length > 0 && operand[operand.length - 1].type != "start") {
        foperand.push(operand.pop());
    }
    operand.pop();
    return;
};

SocialCalc.Formula.FunctionArgsError = function(fname, operand) {
    var errortext = SocialCalc.Constants.s_calcerrincorrectargstofunction + " " + fname + ". ";
    SocialCalc.Formula.PushOperand(operand, "e#VALUE!", errortext);
    return errortext;
};

SocialCalc.Formula.FunctionSpecificError = function(fname, operand, errortype, errortext) {
    SocialCalc.Formula.PushOperand(operand, errortype, errortext);
    return errortext;
};

SocialCalc.Formula.CheckForErrorValue = function(operand, v) {
    if (v.type.charAt(0) == "e") {
        operand.push(v);
        return true;
    } else {
        return false;
    }
};

SocialCalc.Formula.FillFunctionInfo = function() {
    var scf = SocialCalc.Formula;
    var scc = SocialCalc.Constants;
    var fname, f, classes, cname, i;
    if (scf.FunctionClasses) {
        return;
    }
    for (fname in scf.FunctionList) {
        f = scf.FunctionList[fname];
        if (f[2]) {
            scf.FunctionArgDefs[f[2]] = scc["s_farg_" + f[2]] || "";
        }
        if (!f[3]) {
            if (scc["s_fdef_" + fname]) {
                scf.FunctionList[fname][3] = scc["s_fdef_" + fname];
            }
        }
    }
    scf.FunctionClasses = {};
    for (i = 0; i < scc.function_classlist.length; i++) {
        cname = scc.function_classlist[i];
        scf.FunctionClasses[cname] = {
            name: scc["s_fclass_" + cname],
            items: []
        };
    }
    for (fname in scf.FunctionList) {
        f = scf.FunctionList[fname];
        classes = f[4] ? f[4].split(",") : [];
        classes.push("all");
        for (i = 0; i < classes.length; i++) {
            cname = classes[i];
            scf.FunctionClasses[cname].items.push(fname);
        }
    }
    for (cname in scf.FunctionClasses) {
        scf.FunctionClasses[cname].items.sort();
    }
};

SocialCalc.Formula.FunctionArgString = function(fname) {
    var scf = SocialCalc.Formula;
    var fdata = scf.FunctionList[fname];
    var nargs, i, str;
    var adef = fdata[2];
    if (!adef) {
        nargs = fdata[1];
        if (nargs == 0) {
            adef = " ";
        } else if (nargs > 0) {
            str = "v1";
            for (i = 2; i <= nargs; i++) {
                str += ", v" + i;
            }
            return str;
        } else if (nargs < 0) {
            str = "v1";
            for (i = 2; i < -nargs; i++) {
                str += ", v" + i;
            }
            return str + ", ...";
        } else {
            return "nargs: " + nargs;
        }
    }
    str = scf.FunctionArgDefs[adef] || adef;
    return str;
};

SocialCalc.Formula.SeriesFunctions = function(fname, operand, foperand, sheet) {
    var value1, t, v1;
    var scf = SocialCalc.Formula;
    var operand_value_and_type = scf.OperandValueAndType;
    var lookup_result_type = scf.LookupResultType;
    var typelookupplus = scf.TypeLookupTable.plus;
    var PushOperand = function(t, v) {
        operand.push({
            type: t,
            value: v
        });
    };
    var sum = 0;
    var resulttypesum = "";
    var count = 0;
    var counta = 0;
    var countblank = 0;
    var product = 1;
    var maxval;
    var minval;
    var mk, sk, mk1, sk1;
    while (foperand.length > 0) {
        value1 = operand_value_and_type(sheet, foperand);
        t = value1.type.charAt(0);
        if (t == "n") count += 1;
        if (t != "b") counta += 1;
        if (t == "b") countblank += 1;
        if (t == "n") {
            v1 = value1.value - 0;
            sum += v1;
            product *= v1;
            maxval = maxval != undefined ? v1 > maxval ? v1 : maxval : v1;
            minval = minval != undefined ? v1 < minval ? v1 : minval : v1;
            if (count == 1) {
                mk1 = v1;
                sk1 = 0;
            } else {
                mk = mk1 + (v1 - mk1) / count;
                sk = sk1 + (v1 - mk1) * (v1 - mk);
                sk1 = sk;
                mk1 = mk;
            }
            resulttypesum = lookup_result_type(value1.type, resulttypesum || value1.type, typelookupplus);
        } else if (t == "e" && resulttypesum.charAt(0) != "e") {
            resulttypesum = value1.type;
        }
    }
    resulttypesum = resulttypesum || "n";
    switch (fname) {
      case "SUM":
        PushOperand(resulttypesum, sum);
        break;

      case "PRODUCT":
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
            PushOperand(resulttypesum, sum / count);
        } else {
            PushOperand("e#DIV/0!", 0);
        }
        break;

      case "STDEV":
        if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / (count - 1)));
        } else {
            PushOperand("e#DIV/0!", 0);
        }
        break;

      case "STDEVP":
        if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / count));
        } else {
            PushOperand("e#DIV/0!", 0);
        }
        break;

      case "VAR":
        if (count > 1) {
            PushOperand(resulttypesum, sk / (count - 1));
        } else {
            PushOperand("e#DIV/0!", 0);
        }
        break;

      case "VARP":
        if (count > 1) {
            PushOperand(resulttypesum, sk / count);
        } else {
            PushOperand("e#DIV/0!", 0);
        }
        break;
    }
    return null;
};

SocialCalc.Formula.FunctionList["AVERAGE"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["COUNT"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["COUNTA"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["COUNTBLANK"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["MAX"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["MIN"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["PRODUCT"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["STDEV"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["STDEVP"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["SUM"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["VAR"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.FunctionList["VARP"] = [ SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat" ];

SocialCalc.Formula.SumProductFunction = function(fname, operand, foperand, sheet) {
    var range, products = [], sum = 0;
    var scf = SocialCalc.Formula;
    var ncols = 0, nrows = 0;
    var PushOperand = function(t, v) {
        operand.push({
            type: t,
            value: v
        });
    };
    while (foperand.length > 0) {
        range = scf.TopOfStackValueAndType(sheet, foperand);
        if (range.type != "range") {
            PushOperand("e#VALUE!", 0);
            return;
        }
        rangeinfo = scf.DecodeRangeParts(sheet, range.value);
        if (!ncols) ncols = rangeinfo.ncols; else if (ncols != rangeinfo.ncols) {
            PushOperand("e#VALUE!", 0);
            return;
        }
        if (!nrows) nrows = rangeinfo.nrows; else if (nrows != rangeinfo.nrows) {
            PushOperand("e#VALUE!", 0);
            return;
        }
        for (i = 0; i < rangeinfo.ncols; i++) {
            for (j = 0; j < rangeinfo.nrows; j++) {
                k = i * rangeinfo.nrows + j;
                cellcr = SocialCalc.crToCoord(rangeinfo.col1num + i, rangeinfo.row1num + j);
                cell = rangeinfo.sheetdata.GetAssuredCell(cellcr);
                value = cell.valuetype == "n" ? cell.datavalue : 0;
                products[k] = (products[k] || 1) * value;
            }
        }
    }
    for (i = 0; i < products.length; i++) {
        sum += products[i];
    }
    PushOperand("n", sum);
    return;
};

SocialCalc.Formula.FunctionList["SUMPRODUCT"] = [ SocialCalc.Formula.SumProductFunction, -1, "rangen", "", "stat" ];

SocialCalc.Formula.DSeriesFunctions = function(fname, operand, foperand, sheet) {
    var value1, tostype, cr, dbrange, fieldname, criteriarange, dbinfo, criteriainfo;
    var fieldasnum, targetcol, i, j, k, cell, criteriafieldnums;
    var testok, criteriacr, criteria, testcol, testcr;
    var t;
    var scf = SocialCalc.Formula;
    var operand_value_and_type = scf.OperandValueAndType;
    var lookup_result_type = scf.LookupResultType;
    var typelookupplus = scf.TypeLookupTable.plus;
    var PushOperand = function(t, v) {
        operand.push({
            type: t,
            value: v
        });
    };
    var value1 = {};
    var sum = 0;
    var resulttypesum = "";
    var count = 0;
    var counta = 0;
    var countblank = 0;
    var product = 1;
    var maxval;
    var minval;
    var mk, sk, mk1, sk1;
    dbrange = scf.TopOfStackValueAndType(sheet, foperand);
    fieldname = scf.OperandValueAndType(sheet, foperand);
    criteriarange = scf.TopOfStackValueAndType(sheet, foperand);
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
    for (i = 0; i < criteriainfo.ncols; i++) {
        cell = criteriainfo.sheetdata.GetAssuredCell(SocialCalc.crToCoord(criteriainfo.col1num + i, criteriainfo.row1num));
        criterianum = scf.FieldToColnum(dbinfo.sheetdata, dbinfo.col1num, dbinfo.ncols, dbinfo.row1num, cell.datavalue, cell.valuetype);
        if (criterianum <= 0) {
            PushOperand("e#VALUE!", 0);
            return;
        }
        criteriafieldnums.push(dbinfo.col1num + criterianum - 1);
    }
    for (i = 1; i < dbinfo.nrows; i++) {
        testok = false;
        CRITERIAROW: for (j = 1; j < criteriainfo.nrows; j++) {
            for (k = 0; k < criteriainfo.ncols; k++) {
                criteriacr = SocialCalc.crToCoord(criteriainfo.col1num + k, criteriainfo.row1num + j);
                cell = criteriainfo.sheetdata.GetAssuredCell(criteriacr);
                criteria = cell.datavalue;
                if (typeof criteria == "string" && criteria.length == 0) continue;
                testcol = criteriafieldnums[k];
                testcr = SocialCalc.crToCoord(testcol, dbinfo.row1num + i);
                cell = criteriainfo.sheetdata.GetAssuredCell(testcr);
                if (!scf.TestCriteria(cell.datavalue, cell.valuetype || "b", criteria)) {
                    continue CRITERIAROW;
                }
            }
            testok = true;
            break CRITERIAROW;
        }
        if (!testok) {
            continue;
        }
        cr = SocialCalc.crToCoord(targetcol, dbinfo.row1num + i);
        cell = dbinfo.sheetdata.GetAssuredCell(cr);
        value1.value = cell.datavalue;
        value1.type = cell.valuetype;
        t = value1.type.charAt(0);
        if (t == "n") count += 1;
        if (t != "b") counta += 1;
        if (t == "b") countblank += 1;
        if (t == "n") {
            v1 = value1.value - 0;
            sum += v1;
            product *= v1;
            maxval = maxval != undefined ? v1 > maxval ? v1 : maxval : v1;
            minval = minval != undefined ? v1 < minval ? v1 : minval : v1;
            if (count == 1) {
                mk1 = v1;
                sk1 = 0;
            } else {
                mk = mk1 + (v1 - mk1) / count;
                sk = sk1 + (v1 - mk1) * (v1 - mk);
                sk1 = sk;
                mk1 = mk;
            }
            resulttypesum = lookup_result_type(value1.type, resulttypesum || value1.type, typelookupplus);
        } else if (t == "e" && resulttypesum.charAt(0) != "e") {
            resulttypesum = value1.type;
        }
    }
    resulttypesum = resulttypesum || "n";
    switch (fname) {
      case "DSUM":
        PushOperand(resulttypesum, sum);
        break;

      case "DPRODUCT":
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
            PushOperand(resulttypesum, sum / count);
        } else {
            PushOperand("e#DIV/0!", 0);
        }
        break;

      case "DSTDEV":
        if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / (count - 1)));
        } else {
            PushOperand("e#DIV/0!", 0);
        }
        break;

      case "DSTDEVP":
        if (count > 1) {
            PushOperand(resulttypesum, Math.sqrt(sk / count));
        } else {
            PushOperand("e#DIV/0!", 0);
        }
        break;

      case "DVAR":
        if (count > 1) {
            PushOperand(resulttypesum, sk / (count - 1));
        } else {
            PushOperand("e#DIV/0!", 0);
        }
        break;

      case "DVARP":
        if (count > 1) {
            PushOperand(resulttypesum, sk / count);
        } else {
            PushOperand("e#DIV/0!", 0);
        }
        break;

      case "DGET":
        if (count == 1) {
            PushOperand(resulttypesum, sum);
        } else if (count == 0) {
            PushOperand("e#VALUE!", 0);
        } else {
            PushOperand("e#NUM!", 0);
        }
        break;
    }
    return;
};

SocialCalc.Formula.FunctionList["DAVERAGE"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DCOUNT"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DCOUNTA"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DGET"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DMAX"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DMIN"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DPRODUCT"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DSTDEV"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DSTDEVP"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DSUM"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DVAR"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FunctionList["DVARP"] = [ SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat" ];

SocialCalc.Formula.FieldToColnum = function(sheet, col1num, ncols, row1num, fieldname, fieldtype) {
    var colnum, cell, value;
    if (fieldtype.charAt(0) == "n") {
        colnum = fieldname - 0;
        if (colnum <= 0 || colnum > ncols) {
            return 0;
        }
        return Math.floor(colnum);
    }
    if (fieldtype.charAt(0) != "t") {
        return 0;
    }
    fieldname = fieldname ? fieldname.toLowerCase() : "";
    for (colnum = 0; colnum < ncols; colnum++) {
        cell = sheet.GetAssuredCell(SocialCalc.crToCoord(col1num + colnum, row1num));
        value = cell.datavalue;
        value = (value + "").toLowerCase();
        if (value == fieldname) {
            return colnum + 1;
        }
    }
    return 0;
};

SocialCalc.Formula.LookupFunctions = function(fname, operand, foperand, sheet) {
    var lookupvalue, range, offset, rangelookup, offsetvalue, rangeinfo;
    var c, r, cincr, rincr, previousOK, csave, rsave, cell, value, valuetype, cr, lookupvalue;
    var scf = SocialCalc.Formula;
    var operand_value_and_type = scf.OperandValueAndType;
    var lookup_result_type = scf.LookupResultType;
    var typelookupplus = scf.TypeLookupTable.plus;
    var PushOperand = function(t, v) {
        operand.push({
            type: t,
            value: v
        });
    };
    lookupvalue = operand_value_and_type(sheet, foperand);
    if (typeof lookupvalue.value == "string") {
        lookupvalue.value = lookupvalue.value.toLowerCase();
    }
    range = scf.TopOfStackValueAndType(sheet, foperand);
    rangelookup = 1;
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
    } else {
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
            rangelookup = rangelookup.value ? 1 : 0;
        }
    }
    lookupvalue.type = lookupvalue.type.charAt(0);
    if (lookupvalue.type == "n") {
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
    } else if (fname == "VLOOKUP") {
        rincr = 1;
        if (offsetvalue > rangeinfo.ncols) {
            PushOperand("e#REF!", 0);
            return;
        }
    } else if (fname == "MATCH") {
        if (rangeinfo.ncols > 1) {
            if (rangeinfo.nrows > 1) {
                PushOperand("e#N/A", 0);
                return;
            }
            cincr = 1;
        } else {
            rincr = 1;
        }
    } else {
        scf.FunctionArgsError(fname, operand);
        return 0;
    }
    if (offsetvalue < 1 && fname != "MATCH") {
        PushOperand("e#VALUE!", 0);
        return 0;
    }
    previousOK;
    while (1) {
        cr = SocialCalc.crToCoord(rangeinfo.col1num + c, rangeinfo.row1num + r);
        cell = rangeinfo.sheetdata.GetAssuredCell(cr);
        value = cell.datavalue;
        valuetype = cell.valuetype ? cell.valuetype.charAt(0) : "b";
        if (valuetype == "n") {
            value = value - 0;
        }
        if (rangelookup) {
            if (lookupvalue.type == "n" && valuetype == "n") {
                if (lookupvalue.value == value) {
                    break;
                }
                if (rangelookup > 0 && lookupvalue.value > value || rangelookup < 0 && lookupvalue.value < value) {
                    previousOK = 1;
                    csave = c;
                    rsave = r;
                } else if (previousOK) {
                    previousOK = 2;
                    break;
                }
            } else if (lookupvalue.type == "t" && valuetype == "t") {
                value = typeof value == "string" ? value.toLowerCase() : "";
                if (lookupvalue.value == value) {
                    break;
                }
                if (rangelookup > 0 && lookupvalue.value > value || rangelookup < 0 && lookupvalue.value < value) {
                    previousOK = 1;
                    csave = c;
                    rsave = r;
                } else if (previousOK) {
                    previousOK = 2;
                    break;
                }
            }
        } else {
            if (lookupvalue.type == "n" && valuetype == "n") {
                if (lookupvalue.value == value) {
                    break;
                }
            } else if (lookupvalue.type == "t" && valuetype == "t") {
                value = typeof value == "string" ? value.toLowerCase() : "";
                if (lookupvalue.value == value) {
                    break;
                }
            }
        }
        r += rincr;
        c += cincr;
        if (r >= rangeinfo.nrows || c >= rangeinfo.ncols) {
            if (previousOK) {
                previousOK = 2;
                break;
            }
            PushOperand("e#N/A", 0);
            return;
        }
    }
    if (previousOK == 2) {
        r = rsave;
        c = csave;
    }
    if (fname == "MATCH") {
        value = c + r + 1;
        valuetype = "n";
    } else {
        cr = SocialCalc.crToCoord(rangeinfo.col1num + c + (fname == "VLOOKUP" ? offsetvalue - 1 : 0), rangeinfo.row1num + r + (fname == "HLOOKUP" ? offsetvalue - 1 : 0));
        cell = rangeinfo.sheetdata.GetAssuredCell(cr);
        value = cell.datavalue;
        valuetype = cell.valuetype;
    }
    PushOperand(valuetype, value);
    return;
};

SocialCalc.Formula.FunctionList["HLOOKUP"] = [ SocialCalc.Formula.LookupFunctions, -3, "hlookup", "", "lookup" ];

SocialCalc.Formula.FunctionList["MATCH"] = [ SocialCalc.Formula.LookupFunctions, -2, "match", "", "lookup" ];

SocialCalc.Formula.FunctionList["VLOOKUP"] = [ SocialCalc.Formula.LookupFunctions, -3, "vlookup", "", "lookup" ];

SocialCalc.Formula.IndexFunction = function(fname, operand, foperand, sheet) {
    var range, sheetname, indexinfo, rowindex, colindex, result, resulttype;
    var scf = SocialCalc.Formula;
    var PushOperand = function(t, v) {
        operand.push({
            type: t,
            value: v
        });
    };
    range = scf.TopOfStackValueAndType(sheet, foperand);
    if (range.type != "range") {
        scf.FunctionArgsError(fname, operand);
        return 0;
    }
    indexinfo = scf.DecodeRangeParts(sheet, range.value, range.type);
    if (indexinfo.sheetname) {
        sheetname = "!" + indexinfo.sheetname;
    } else {
        sheetname = "";
    }
    rowindex = {
        value: 0
    };
    colindex = {
        value: 0
    };
    if (foperand.length) {
        rowindex = scf.OperandAsNumber(sheet, foperand);
        if (rowindex.type.charAt(0) != "n" || rowindex.value < 0) {
            PushOperand("e#VALUE!", 0);
            return;
        }
        if (foperand.length) {
            colindex = scf.OperandAsNumber(sheet, foperand);
            if (colindex.type.charAt(0) != "n" || colindex.value < 0) {
                PushOperand("e#VALUE!", 0);
                return;
            }
            if (foperand.length) {
                scf.FunctionArgsError(fname, operand);
                return 0;
            }
        } else {
            if (indexinfo.nrows == 1) {
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
            } else {
                result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num) + sheetname + "|" + SocialCalc.crToCoord(indexinfo.col1num + indexinfo.ncols - 1, indexinfo.row1num + indexinfo.nrows - 1) + "|";
                resulttype = "range";
            }
        } else {
            if (indexinfo.nrows == 1) {
                result = SocialCalc.crToCoord(indexinfo.col1num + colindex.value - 1, indexinfo.row1num) + sheetname;
                resulttype = "coord";
            } else {
                result = SocialCalc.crToCoord(indexinfo.col1num + colindex.value - 1, indexinfo.row1num) + sheetname + "|" + SocialCalc.crToCoord(indexinfo.col1num + colindex.value - 1, indexinfo.row1num + indexinfo.nrows - 1) + "|";
                resulttype = "range";
            }
        }
    } else {
        if (colindex.value == 0) {
            if (indexinfo.ncols == 1) {
                result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num + rowindex.value - 1) + sheetname;
                resulttype = "coord";
            } else {
                result = SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num + rowindex.value - 1) + sheetname + "|" + SocialCalc.crToCoord(indexinfo.col1num + indexinfo.ncols - 1, indexinfo.row1num + rowindex.value - 1) + "|";
                resulttype = "range";
            }
        } else {
            result = SocialCalc.crToCoord(indexinfo.col1num + colindex.value - 1, indexinfo.row1num + rowindex.value - 1) + sheetname;
            resulttype = "coord";
        }
    }
    PushOperand(resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["INDEX"] = [ SocialCalc.Formula.IndexFunction, -1, "index", "", "lookup" ];

SocialCalc.Formula.CountifSumifFunctions = function(fname, operand, foperand, sheet) {
    var range, criteria, sumrange, f2operand, result, resulttype, value1, value2;
    var sum = 0;
    var resulttypesum = "";
    var count = 0;
    var scf = SocialCalc.Formula;
    var operand_value_and_type = scf.OperandValueAndType;
    var lookup_result_type = scf.LookupResultType;
    var typelookupplus = scf.TypeLookupTable.plus;
    var PushOperand = function(t, v) {
        operand.push({
            type: t,
            value: v
        });
    };
    range = scf.TopOfStackValueAndType(sheet, foperand);
    criteria = scf.OperandAsText(sheet, foperand);
    if (fname == "SUMIF") {
        if (foperand.length == 1) {
            sumrange = scf.TopOfStackValueAndType(sheet, foperand);
        } else if (foperand.length == 0) {
            sumrange = {
                value: range.value,
                type: range.type
            };
        } else {
            scf.FunctionArgsError(fname, operand);
            return 0;
        }
    } else {
        sumrange = {
            value: range.value,
            type: range.type
        };
    }
    if (criteria.type.charAt(0) == "n") {
        criteria.value = criteria.value + "";
    } else if (criteria.type.charAt(0) == "e") {
        criteria.value = null;
    } else if (criteria.type.charAt(0) == "b") {
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
    f2operand = [];
    f2operand.push(sumrange);
    while (foperand.length) {
        value1 = operand_value_and_type(sheet, foperand);
        value2 = operand_value_and_type(sheet, f2operand);
        if (!scf.TestCriteria(value1.value, value1.type, criteria.value)) {
            continue;
        }
        count += 1;
        if (value2.type.charAt(0) == "n") {
            sum += value2.value - 0;
            resulttypesum = lookup_result_type(value2.type, resulttypesum || value2.type, typelookupplus);
        } else if (value2.type.charAt(0) == "e" && resulttypesum.charAt(0) != "e") {
            resulttypesum = value2.type;
        }
    }
    resulttypesum = resulttypesum || "n";
    if (fname == "SUMIF") {
        PushOperand(resulttypesum, sum);
    } else if (fname == "COUNTIF") {
        PushOperand("n", count);
    }
    return;
};

SocialCalc.Formula.FunctionList["COUNTIF"] = [ SocialCalc.Formula.CountifSumifFunctions, 2, "rangec", "", "stat" ];

SocialCalc.Formula.FunctionList["SUMIF"] = [ SocialCalc.Formula.CountifSumifFunctions, -2, "sumif", "", "stat" ];

SocialCalc.Formula.SumifsFunction = function(fname, operand, foperand, sheet) {
    var range, criteria, sumrange, f2operand, result, resulttype, value1, value2;
    var sum = 0;
    var resulttypesum = "";
    var count = 0;
    var scf = SocialCalc.Formula;
    var operand_value_and_type = scf.OperandValueAndType;
    var lookup_result_type = scf.LookupResultType;
    var typelookupplus = scf.TypeLookupTable.plus;
    var PushOperand = function(t, v) {
        operand.push({
            type: t,
            value: v
        });
    };
    sumrange = scf.TopOfStackValueAndType(sheet, foperand);
    if (sumrange.type != "coord" && sumrange.type != "range") {
        scf.FunctionArgsError(fname, operand);
        return 0;
    }
    var ranges = [], criterias = [];
    while (foperand.length) {
        range = scf.TopOfStackValueAndType(sheet, foperand);
        criteria = scf.OperandAsText(sheet, foperand);
        if (criteria.type.charAt(0) == "n") {
            criteria.value = criteria.value + "";
        } else if (criteria.type.charAt(0) == "e") {
            criteria.value = null;
        } else if (criteria.type.charAt(0) == "b") {
            criteria.value = null;
        }
        if (range.type != "coord" && range.type != "range") {
            scf.FunctionArgsError(fname, operand);
            return 0;
        }
        ranges.push([ range ]);
        criterias.push(criteria);
    }
    f2operand = [];
    f2operand.push(sumrange);
    while (f2operand.length) {
        value2 = operand_value_and_type(sheet, f2operand);
        var all_good = true;
        for (var i = 0; i < ranges.length; i++) {
            value1 = operand_value_and_type(sheet, ranges[i]);
            if (!scf.TestCriteria(value1.value, value1.type, criterias[i].value)) {
                all_good = false;
                break;
            }
        }
        if (!all_good) {
            continue;
        }
        if (value2.type.charAt(0) == "n") {
            sum += value2.value - 0;
            resulttypesum = lookup_result_type(value2.type, resulttypesum || value2.type, typelookupplus);
        } else if (value2.type.charAt(0) == "e" && resulttypesum.charAt(0) != "e") {
            resulttypesum = value2.type;
        }
    }
    resulttypesum = resulttypesum || "n";
    PushOperand(resulttypesum, sum);
    return;
};

SocialCalc.Formula.FunctionList["SUMIFS"] = [ SocialCalc.Formula.SumifsFunction, -3, "sumifs", "", "stat" ];

SocialCalc.Formula.IfFunction = function(fname, operand, foperand, sheet) {
    var cond, t;
    cond = SocialCalc.Formula.OperandValueAndType(sheet, foperand);
    t = cond.type.charAt(0);
    if (t != "n" && t != "b") {
        operand.push({
            type: "e#VALUE!",
            value: 0
        });
        return;
    }
    var op1, op2;
    op1 = foperand.pop();
    if (foperand.length == 1) {
        op2 = foperand.pop();
    } else if (foperand.length == 0) {
        op2 = {
            type: "n",
            value: 0
        };
    } else {
        scf.FunctionArgsError(fname, operand);
        return;
    }
    operand.push(cond.value ? op1 : op2);
};

SocialCalc.Formula.FunctionList["IF"] = [ SocialCalc.Formula.IfFunction, -2, "iffunc", "", "test" ];

SocialCalc.Formula.DateFunction = function(fname, operand, foperand, sheet) {
    var scf = SocialCalc.Formula;
    var result = 0;
    var year = scf.OperandAsNumber(sheet, foperand);
    var month = scf.OperandAsNumber(sheet, foperand);
    var day = scf.OperandAsNumber(sheet, foperand);
    var resulttype = scf.LookupResultType(year.type, month.type, scf.TypeLookupTable.twoargnumeric);
    resulttype = scf.LookupResultType(resulttype, day.type, scf.TypeLookupTable.twoargnumeric);
    if (resulttype.charAt(0) == "n") {
        result = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(Math.floor(year.value), Math.floor(month.value), Math.floor(day.value)) - SocialCalc.FormatNumber.datevalues.julian_offset;
        resulttype = "nd";
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["DATE"] = [ SocialCalc.Formula.DateFunction, 3, "date", "", "datetime" ];

SocialCalc.Formula.TimeFunction = function(fname, operand, foperand, sheet) {
    var scf = SocialCalc.Formula;
    var result = 0;
    var hours = scf.OperandAsNumber(sheet, foperand);
    var minutes = scf.OperandAsNumber(sheet, foperand);
    var seconds = scf.OperandAsNumber(sheet, foperand);
    var resulttype = scf.LookupResultType(hours.type, minutes.type, scf.TypeLookupTable.twoargnumeric);
    resulttype = scf.LookupResultType(resulttype, seconds.type, scf.TypeLookupTable.twoargnumeric);
    if (resulttype.charAt(0) == "n") {
        result = (hours.value * 60 * 60 + minutes.value * 60 + seconds.value) / (24 * 60 * 60);
        resulttype = "nt";
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["TIME"] = [ SocialCalc.Formula.TimeFunction, 3, "hms", "", "datetime" ];

SocialCalc.Formula.DMYFunctions = function(fname, operand, foperand, sheet) {
    var ymd, dtype, doffset;
    var scf = SocialCalc.Formula;
    var result = 0;
    var datevalue = scf.OperandAsNumber(sheet, foperand);
    var resulttype = scf.LookupResultType(datevalue.type, datevalue.type, scf.TypeLookupTable.oneargnumeric);
    if (resulttype.charAt(0) == "n") {
        ymd = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(Math.floor(datevalue.value + SocialCalc.FormatNumber.datevalues.julian_offset));
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
            dtype = {
                value: 1
            };
            if (foperand.length) {
                dtype = scf.OperandAsNumber(sheet, foperand);
                if (dtype.type.charAt(0) != "n" || dtype.value < 1 || dtype.value > 3) {
                    scf.PushOperand(operand, "e#VALUE!", 0);
                    return;
                }
                if (foperand.length) {
                    scf.FunctionArgsError(fname, operand);
                    return;
                }
            }
            doffset = 6;
            if (dtype.value > 1) {
                doffset -= 1;
            }
            result = Math.floor(datevalue.value + doffset) % 7 + (dtype.value < 3 ? 1 : 0);
            break;
        }
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["DAY"] = [ SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime" ];

SocialCalc.Formula.FunctionList["MONTH"] = [ SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime" ];

SocialCalc.Formula.FunctionList["YEAR"] = [ SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime" ];

SocialCalc.Formula.FunctionList["WEEKDAY"] = [ SocialCalc.Formula.DMYFunctions, -1, "weekday", "", "datetime" ];

SocialCalc.Formula.HMSFunctions = function(fname, operand, foperand, sheet) {
    var hours, minutes, seconds, fraction;
    var scf = SocialCalc.Formula;
    var result = 0;
    var datetime = scf.OperandAsNumber(sheet, foperand);
    var resulttype = scf.LookupResultType(datetime.type, datetime.type, scf.TypeLookupTable.oneargnumeric);
    if (resulttype.charAt(0) == "n") {
        if (datetime.value < 0) {
            scf.PushOperand(operand, "e#NUM!", 0);
            return;
        }
        fraction = datetime.value - Math.floor(datetime.value);
        fraction *= 24;
        hours = Math.floor(fraction);
        fraction -= Math.floor(fraction);
        fraction *= 60;
        minutes = Math.floor(fraction);
        fraction -= Math.floor(fraction);
        fraction *= 60;
        seconds = Math.floor(fraction + (datetime.value >= 0 ? .5 : -.5));
        if (fname == "HOUR") {
            result = hours;
        } else if (fname == "MINUTE") {
            result = minutes;
        } else if (fname == "SECOND") {
            result = seconds;
        }
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["HOUR"] = [ SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime" ];

SocialCalc.Formula.FunctionList["MINUTE"] = [ SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime" ];

SocialCalc.Formula.FunctionList["SECOND"] = [ SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime" ];

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
        } else if (v2type == "b") {
            result = value1.value.length ? 0 : 1;
        } else if (v2type == "n") {
            result = value1.value == value2.value + "" ? 1 : 0;
        } else if (v2type == "e") {
            result = value2.value;
            resulttype = value2.type;
        } else {
            result = 0;
        }
    } else if (v1type == "n") {
        if (v2type == "n") {
            result = value1.value - 0 == value2.value - 0 ? 1 : 0;
        } else if (v2type == "b") {
            result = 0;
        } else if (v2type == "t") {
            result = value1.value + "" == value2.value ? 1 : 0;
        } else if (v2type == "e") {
            result = value2.value;
            resulttype = value2.type;
        } else {
            result = 0;
        }
    } else if (v1type == "b") {
        if (v2type == "t") {
            result = value2.value.length ? 0 : 1;
        } else if (v2type == "b") {
            result = 1;
        } else if (v2type == "n") {
            result = 0;
        } else if (v2type == "e") {
            result = value2.value;
            resulttype = value2.type;
        } else {
            result = 0;
        }
    } else if (v1type == "e") {
        result = value1.value;
        resulttype = value1.type;
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["EXACT"] = [ SocialCalc.Formula.ExactFunction, 2, "", "", "text" ];

SocialCalc.Formula.ArgList = {
    FIND: [ 1, 1, 0 ],
    LEFT: [ 1, 0 ],
    LEN: [ 1 ],
    LOWER: [ 1 ],
    MID: [ 1, 0, 0 ],
    PROPER: [ 1 ],
    REPLACE: [ 1, 0, 0, 1 ],
    REPT: [ 1, 0 ],
    RIGHT: [ 1, 0 ],
    SUBSTITUTE: [ 1, 1, 1, 0 ],
    TRIM: [ 1 ],
    HEXCODE: [ 1 ],
    UPPER: [ 1 ]
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
    for (i = 1; i <= numargs; i++) {
        if (i > argdef.length) {
            scf.FunctionArgsError(fname, operand);
            return;
        }
        if (argdef[i - 1] == 0) {
            value = scf.OperandAsNumber(sheet, foperand);
        } else if (argdef[i - 1] == 1) {
            value = scf.OperandAsText(sheet, foperand);
        } else if (argdef[i - 1] == -1) {
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
        offset = operand_type[3] ? operand_value[3] - 1 : 0;
        if (offset < 0) {
            result = "Start is before string";
        } else {
            result = operand_value[2].indexOf(operand_value[1], offset);
            if (result >= 0) {
                result += 1;
                resulttype = "n";
            } else {
                result = "Not found";
            }
        }
        break;

      case "LEFT":
        len = operand_type[2] ? operand_value[2] - 0 : 1;
        if (len < 0) {
            result = "Negative length";
        } else {
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
        start = operand_value[2] - 0;
        len = operand_value[3] - 0;
        if (len < 1 || start < 1) {
            result = "Bad arguments";
        } else {
            result = operand_value[1].substring(start - 1, start + len - 1);
            resulttype = "t";
        }
        break;

      case "PROPER":
        result = operand_value[1].replace(/\b\w+\b/g, function(word) {
            return word.substring(0, 1).toUpperCase() + word.substring(1);
        });
        resulttype = "t";
        break;

      case "REPLACE":
        start = operand_value[2] - 0;
        len = operand_value[3] - 0;
        if (len < 0 || start < 1) {
            result = "Bad arguments";
        } else {
            result = operand_value[1].substring(0, start - 1) + operand_value[4] + operand_value[1].substring(start - 1 + len);
            resulttype = "t";
        }
        break;

      case "REPT":
        count = operand_value[2] - 0;
        if (count < 0) {
            result = "Negative count";
        } else {
            result = "";
            for (;count > 0; count--) {
                result += operand_value[1];
            }
            resulttype = "t";
        }
        break;

      case "RIGHT":
        len = operand_type[2] ? operand_value[2] - 0 : 1;
        if (len < 0) {
            result = "Negative length";
        } else {
            result = operand_value[1].slice(-len);
            resulttype = "t";
        }
        break;

      case "SUBSTITUTE":
        fulltext = operand_value[1];
        oldtext = operand_value[2];
        newtext = operand_value[3];
        if (operand_value[4] != null) {
            which = operand_value[4] - 0;
            if (which <= 0) {
                result = "Non-positive instance number";
                break;
            }
        } else {
            which = 0;
        }
        count = 0;
        oldpos = 0;
        result = "";
        while (true) {
            pos = fulltext.indexOf(oldtext, oldpos);
            if (pos >= 0) {
                count++;
                result += fulltext.substring(oldpos, pos);
                if (which == 0) {
                    result += newtext;
                } else if (which == count) {
                    result += newtext + fulltext.substring(pos + oldtext.length);
                    break;
                } else {
                    result += oldtext;
                }
                oldpos = pos + oldtext.length;
            } else {
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
        if (55296 <= code && code <= 56319) {
            var next = result.charCodeAt(1);
            if (56320 <= next && next <= 57343) {
                code = (code - 55296) * 1024 + (next - 56320) + 65536;
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
};

SocialCalc.Formula.FunctionList["FIND"] = [ SocialCalc.Formula.StringFunctions, -2, "find", "", "text" ];

SocialCalc.Formula.FunctionList["LEFT"] = [ SocialCalc.Formula.StringFunctions, -2, "tc", "", "text" ];

SocialCalc.Formula.FunctionList["LEN"] = [ SocialCalc.Formula.StringFunctions, 1, "txt", "", "text" ];

SocialCalc.Formula.FunctionList["LOWER"] = [ SocialCalc.Formula.StringFunctions, 1, "txt", "", "text" ];

SocialCalc.Formula.FunctionList["MID"] = [ SocialCalc.Formula.StringFunctions, 3, "mid", "", "text" ];

SocialCalc.Formula.FunctionList["PROPER"] = [ SocialCalc.Formula.StringFunctions, 1, "v", "", "text" ];

SocialCalc.Formula.FunctionList["REPLACE"] = [ SocialCalc.Formula.StringFunctions, 4, "replace", "", "text" ];

SocialCalc.Formula.FunctionList["REPT"] = [ SocialCalc.Formula.StringFunctions, 2, "tc", "", "text" ];

SocialCalc.Formula.FunctionList["RIGHT"] = [ SocialCalc.Formula.StringFunctions, -1, "tc", "", "text" ];

SocialCalc.Formula.FunctionList["SUBSTITUTE"] = [ SocialCalc.Formula.StringFunctions, -3, "subs", "", "text" ];

SocialCalc.Formula.FunctionList["TRIM"] = [ SocialCalc.Formula.StringFunctions, 1, "v", "", "text" ];

SocialCalc.Formula.FunctionList["HEXCODE"] = [ SocialCalc.Formula.StringFunctions, 1, "v", "", "text" ];

SocialCalc.Formula.FunctionList["UPPER"] = [ SocialCalc.Formula.StringFunctions, 1, "v", "", "text" ];

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
        result = t == "e" ? value.type == "e#N/A" ? 0 : 1 : 0;
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
};

SocialCalc.Formula.FunctionList["ISBLANK"] = [ SocialCalc.Formula.IsFunctions, 1, "v", "", "test" ];

SocialCalc.Formula.FunctionList["ISERR"] = [ SocialCalc.Formula.IsFunctions, 1, "v", "", "test" ];

SocialCalc.Formula.FunctionList["ISERROR"] = [ SocialCalc.Formula.IsFunctions, 1, "v", "", "test" ];

SocialCalc.Formula.FunctionList["ISLOGICAL"] = [ SocialCalc.Formula.IsFunctions, 1, "v", "", "test" ];

SocialCalc.Formula.FunctionList["ISNA"] = [ SocialCalc.Formula.IsFunctions, 1, "v", "", "test" ];

SocialCalc.Formula.FunctionList["ISNONTEXT"] = [ SocialCalc.Formula.IsFunctions, 1, "v", "", "test" ];

SocialCalc.Formula.FunctionList["ISNUMBER"] = [ SocialCalc.Formula.IsFunctions, 1, "v", "", "test" ];

SocialCalc.Formula.FunctionList["ISTEXT"] = [ SocialCalc.Formula.IsFunctions, 1, "v", "", "test" ];

SocialCalc.Formula.NTVFunctions = function(fname, operand, foperand, sheet) {
    var scf = SocialCalc.Formula;
    var result = 0;
    var resulttype = "e#VALUE!";
    var value = scf.OperandValueAndType(sheet, foperand);
    var t = value.type.charAt(0);
    switch (fname) {
      case "N":
        result = t == "n" ? value.value - 0 : 0;
        resulttype = "n";
        break;

      case "T":
        result = t == "t" ? value.value + "" : "";
        resulttype = "t";
        break;

      case "VALUE":
        if (t == "n" || t == "b") {
            result = value.value || 0;
            resulttype = "n";
        } else if (t == "t") {
            value = SocialCalc.DetermineValueType(value.value);
            if (value.type.charAt(0) != "n") {
                result = 0;
                resulttype = "e#VALUE!";
            } else {
                result = value.value - 0;
                resulttype = "n";
            }
        }
        break;
    }
    if (t == "e") {
        resulttype = value.type;
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["N"] = [ SocialCalc.Formula.NTVFunctions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["T"] = [ SocialCalc.Formula.NTVFunctions, 1, "v", "", "text" ];

SocialCalc.Formula.FunctionList["VALUE"] = [ SocialCalc.Formula.NTVFunctions, 1, "v", "", "text" ];

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
            } else {
                result.type = "e#NUM!";
            }
            break;

          case "ASIN":
            if (value >= -1 && value <= 1) {
                value = Math.asin(value);
            } else {
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
            value = value * 180 / Math.PI;
            break;

          case "EVEN":
            value = value < 0 ? -value : value;
            if (value != Math.floor(value)) {
                value = Math.floor(value + 1) + Math.floor(value + 1) % 2;
            } else {
                value = value + value % 2;
            }
            if (v1.value < 0) value = -value;
            break;

          case "EXP":
            value = Math.exp(value);
            break;

          case "FACT":
            f = 1;
            value = Math.floor(value);
            for (;value > 0; value--) {
                f *= value;
            }
            value = f;
            break;

          case "INT":
            value = Math.floor(value);
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
            value = Math.log(value) / Math.log(10);
            break;

          case "ODD":
            value = value < 0 ? -value : value;
            if (value != Math.floor(value)) {
                value = Math.floor(value + 1) + (1 - Math.floor(value + 1) % 2);
            } else {
                value = value + (1 - value % 2);
            }
            if (v1.value < 0) value = -value;
            break;

          case "RADIANS":
            value = value * Math.PI / 180;
            break;

          case "SIN":
            value = Math.sin(value);
            break;

          case "SQRT":
            if (value >= 0) {
                value = Math.sqrt(value);
            } else {
                result.type = "e#NUM!";
            }
            break;

          case "TAN":
            if (Math.cos(value) != 0) {
                value = Math.tan(value);
            } else {
                result.type = "e#NUM!";
            }
            break;
        }
    }
    result.value = value;
    operand.push(result);
    return null;
};

SocialCalc.Formula.FunctionList["ABS"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["ACOS"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["ASIN"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["ATAN"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["COS"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["DEGREES"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["EVEN"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["EXP"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["FACT"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["INT"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["LN"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["LOG10"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["ODD"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["RADIANS"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["SIN"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["SQRT"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

SocialCalc.Formula.FunctionList["TAN"] = [ SocialCalc.Formula.Math1Functions, 1, "v", "", "math" ];

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
            } else {
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

          case "MOD":
            if (yval.value == 0) {
                result.type = "e#DIV/0!";
            } else {
                quotient = xval.value / yval.value;
                quotient = Math.floor(quotient);
                result.value = xval.value - quotient * yval.value;
            }
            break;

          case "TRUNC":
            decimalscale = 1;
            if (yval.value >= 0) {
                yval.value = Math.floor(yval.value);
                for (i = 0; i < yval.value; i++) {
                    decimalscale *= 10;
                }
                result.value = Math.floor(Math.abs(xval.value) * decimalscale) / decimalscale;
            } else if (yval.value < 0) {
                yval.value = Math.floor(-yval.value);
                for (i = 0; i < yval.value; i++) {
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
};

SocialCalc.Formula.FunctionList["ATAN2"] = [ SocialCalc.Formula.Math2Functions, 2, "xy", "", "math" ];

SocialCalc.Formula.FunctionList["MOD"] = [ SocialCalc.Formula.Math2Functions, 2, "", "", "math" ];

SocialCalc.Formula.FunctionList["POWER"] = [ SocialCalc.Formula.Math2Functions, 2, "", "", "math" ];

SocialCalc.Formula.FunctionList["TRUNC"] = [ SocialCalc.Formula.Math2Functions, 2, "valpre", "", "math" ];

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
    } else if (foperand.length != 0) {
        scf.FunctionArgsError(fname, operand);
        return 0;
    } else {
        value2 = {
            value: Math.E,
            type: "n"
        };
    }
    if (result.type == "n") {
        if (value.value <= 0) {
            scf.FunctionSpecificError(fname, operand, "e#NUM!", SocialCalc.Constants.s_sheetfunclogfirstarg);
            return 0;
        }
        result.value = Math.log(value.value) / Math.log(value2.value);
    }
    operand.push(result);
    return;
};

SocialCalc.Formula.FunctionList["LOG"] = [ SocialCalc.Formula.LogFunction, -1, "log", "", "math" ];

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
    } else if (foperand.length != 0) {
        scf.FunctionArgsError(fname, operand);
        return 0;
    } else {
        value2 = {
            value: 0,
            type: "n"
        };
    }
    if (resulttype == "n") {
        value2.value = value2.value - 0;
        if (value2.value == 0) {
            result = Math.round(value.value);
        } else if (value2.value > 0) {
            decimalscale = 1;
            value2.value = Math.floor(value2.value);
            for (i = 0; i < value2.value; i++) {
                decimalscale *= 10;
            }
            scaledvalue = Math.round(value.value * decimalscale);
            result = scaledvalue / decimalscale;
        } else if (value2.value < 0) {
            decimalscale = 1;
            value2.value = Math.floor(-value2.value);
            for (i = 0; i < value2.value; i++) {
                decimalscale *= 10;
            }
            scaledvalue = Math.round(value.value / decimalscale);
            result = scaledvalue * decimalscale;
        }
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["ROUND"] = [ SocialCalc.Formula.RoundFunction, -1, "vp", "", "math" ];

SocialCalc.Formula.CeilingFloorFunctions = function(fname, operand, foperand, sheet) {
    var scf = SocialCalc.Formula;
    var val, sig, t;
    var PushOperand = function(t, v) {
        operand.push({
            type: t,
            value: v
        });
    };
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
    } else if (foperand.length == 0) {
        sig = {
            type: "n",
            value: val.value > 0 ? 1 : -1
        };
    } else {
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
};

SocialCalc.Formula.FunctionList["CEILING"] = [ SocialCalc.Formula.CeilingFloorFunctions, -1, "vsig", "", "math" ];

SocialCalc.Formula.FunctionList["FLOOR"] = [ SocialCalc.Formula.CeilingFloorFunctions, -1, "vsig", "", "math" ];

SocialCalc.Formula.AndOrFunctions = function(fname, operand, foperand, sheet) {
    var value1, result;
    var scf = SocialCalc.Formula;
    var resulttype = "";
    if (fname == "AND") {
        result = 1;
    } else if (fname == "OR") {
        result = 0;
    }
    while (foperand.length) {
        value1 = scf.OperandValueAndType(sheet, foperand);
        if (value1.type.charAt(0) == "n") {
            value1.value = value1.value - 0;
            if (fname == "AND") {
                result = value1.value != 0 ? result : 0;
            } else if (fname == "OR") {
                result = value1.value != 0 ? 1 : result;
            }
            resulttype = scf.LookupResultType(value1.type, resulttype || "nl", scf.TypeLookupTable.propagateerror);
        } else if (value1.type.charAt(0) == "e" && resulttype.charAt(0) != "e") {
            resulttype = value1.type;
        }
    }
    if (resulttype.length < 1) {
        resulttype = "e#VALUE!";
        result = 0;
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["AND"] = [ SocialCalc.Formula.AndOrFunctions, -1, "vn", "", "test" ];

SocialCalc.Formula.FunctionList["OR"] = [ SocialCalc.Formula.AndOrFunctions, -1, "vn", "", "test" ];

SocialCalc.Formula.NotFunction = function(fname, operand, foperand, sheet) {
    var result = 0;
    var scf = SocialCalc.Formula;
    var value = scf.OperandValueAndType(sheet, foperand);
    var resulttype = scf.LookupResultType(value.type, value.type, scf.TypeLookupTable.propagateerror);
    if (value.type.charAt(0) == "n" || value.type == "b") {
        result = value.value - 0 != 0 ? 0 : 1;
        resulttype = "nl";
    } else if (value.type.charAt(0) == "t") {
        resulttype = "e#VALUE!";
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["NOT"] = [ SocialCalc.Formula.NotFunction, 1, "v", "", "test" ];

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
    if (resulttype) {
        scf.PushOperand(operand, resulttype, result);
    } else {
        scf.PushOperand(operand, "e#VALUE!", 0);
    }
    return;
};

SocialCalc.Formula.FunctionList["CHOOSE"] = [ SocialCalc.Formula.ChooseFunction, -2, "choose", "", "lookup" ];

SocialCalc.Formula.ColumnsRowsFunctions = function(fname, operand, foperand, sheet) {
    var resulttype, rangeinfo;
    var result = 0;
    var scf = SocialCalc.Formula;
    var value1 = scf.TopOfStackValueAndType(sheet, foperand);
    if (value1.type == "coord") {
        result = 1;
        resulttype = "n";
    } else if (value1.type == "range") {
        rangeinfo = scf.DecodeRangeParts(sheet, value1.value);
        if (fname == "COLUMNS") {
            result = rangeinfo.ncols;
        } else if (fname == "ROWS") {
            result = rangeinfo.nrows;
        }
        resulttype = "n";
    } else {
        result = 0;
        resulttype = "e#VALUE!";
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["COLUMNS"] = [ SocialCalc.Formula.ColumnsRowsFunctions, 1, "range", "", "lookup" ];

SocialCalc.Formula.FunctionList["ROWS"] = [ SocialCalc.Formula.ColumnsRowsFunctions, 1, "range", "", "lookup" ];

SocialCalc.Formula.ZeroArgFunctions = function(fname, operand, foperand, sheet) {
    var startval, tzoffset, start_1_1_1970, seconds_in_a_day, nowdays;
    var result = {
        value: 0
    };
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
        startval = startval.getTime() / 1e3;
        start_1_1_1970 = 25569;
        seconds_in_a_day = 24 * 60 * 60;
        nowdays = start_1_1_1970 + startval / seconds_in_a_day - tzoffset / (24 * 60);
        result.value = nowdays;
        result.type = "ndt";
        SocialCalc.Formula.FreshnessInfo.volatile.NOW = true;
        break;

      case "PI":
        result.type = "n";
        result.value = Math.PI;
        break;

      case "TODAY":
        startval = new Date();
        tzoffset = startval.getTimezoneOffset();
        startval = startval.getTime() / 1e3;
        start_1_1_1970 = 25569;
        seconds_in_a_day = 24 * 60 * 60;
        nowdays = start_1_1_1970 + startval / seconds_in_a_day - tzoffset / (24 * 60);
        result.value = Math.floor(nowdays);
        result.type = "nd";
        SocialCalc.Formula.FreshnessInfo.volatile.TODAY = true;
        break;

      case "TRUE":
        result.type = "nl";
        result.value = 1;
        break;

      case "RAND":
        result.type = "n";
        result.value = Math.random();
        SocialCalc.Formula.FreshnessInfo.volatile.RAND = true;
        break;
    }
    operand.push(result);
    return null;
};

SocialCalc.Formula.FunctionList["FALSE"] = [ SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test" ];

SocialCalc.Formula.FunctionList["NA"] = [ SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test" ];

SocialCalc.Formula.FunctionList["NOW"] = [ SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "datetime" ];

SocialCalc.Formula.FunctionList["RAND"] = [ SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "math" ];

SocialCalc.Formula.FunctionList["PI"] = [ SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "math" ];

SocialCalc.Formula.FunctionList["TODAY"] = [ SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "datetime" ];

SocialCalc.Formula.FunctionList["TRUE"] = [ SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test" ];

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
    method = {
        value: 2,
        type: "n"
    };
    if (foperand.length > 0) {
        method = scf.OperandAsNumber(sheet, foperand);
    }
    if (foperand.length != 0) {
        scf.FunctionArgsError(fname, operand);
        return 0;
    }
    if (scf.CheckForErrorValue(operand, method)) return;
    depreciation = 0;
    accumulateddepreciation = 0;
    for (i = 1; i <= period.value - 0 && i <= lifetime.value; i++) {
        depreciation = (cost.value - accumulateddepreciation) * (method.value / lifetime.value);
        if (cost.value - accumulateddepreciation - depreciation < salvage.value) {
            depreciation = cost.value - accumulateddepreciation - salvage.value;
        }
        accumulateddepreciation += depreciation;
    }
    scf.PushOperand(operand, "n$", depreciation);
    return;
};

SocialCalc.Formula.FunctionList["DDB"] = [ SocialCalc.Formula.DDBFunction, -4, "ddb", "", "financial" ];

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
    scf.PushOperand(operand, "n$", depreciation);
    return;
};

SocialCalc.Formula.FunctionList["SLN"] = [ SocialCalc.Formula.SLNFunction, 3, "csl", "", "financial" ];

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
    sumperiods = (lifetime.value + 1) * lifetime.value / 2;
    depreciation = (cost.value - salvage.value) * (lifetime.value - period.value + 1) / sumperiods;
    scf.PushOperand(operand, "n$", depreciation);
    return;
};

SocialCalc.Formula.FunctionList["SYD"] = [ SocialCalc.Formula.SYDFunction, 4, "cslp", "", "financial" ];

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
    if (foperand.length) {
        dval = scf.OperandAsNumber(sheet, foperand);
        resulttype = scf.LookupResultType(resulttype, dval.type, scf.TypeLookupTable.twoargnumeric);
        if (foperand.length) {
            eval = scf.OperandAsNumber(sheet, foperand);
            resulttype = scf.LookupResultType(resulttype, eval.type, scf.TypeLookupTable.twoargnumeric);
            if (foperand.length) {
                if (fname != "RATE") {
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
          case "FV":
            rate = aval.value;
            n = bval.value;
            payment = cval.value;
            pv = dval != null ? dval.value : 0;
            paytype = eval != null ? eval.value ? 1 : 0 : 0;
            if (rate == 0) {
                fv = -pv - payment * n;
            } else {
                fv = -(pv * Math.pow(1 + rate, n) + payment * (1 + rate * paytype) * (Math.pow(1 + rate, n) - 1) / rate);
            }
            result = fv;
            resulttype = "n$";
            break;

          case "NPER":
            rate = aval.value;
            payment = bval.value;
            pv = cval.value;
            fv = dval != null ? dval.value : 0;
            paytype = eval != null ? eval.value ? 1 : 0 : 0;
            if (rate == 0) {
                if (payment == 0) {
                    scf.PushOperand(operand, "e#NUM!", 0);
                    return;
                }
                n = (pv + fv) / -payment;
            } else {
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
                part5 = Math.log(1 + rate);
                n = part4 / part5;
            }
            result = n;
            resulttype = "n";
            break;

          case "PMT":
            rate = aval.value;
            n = bval.value;
            pv = cval.value;
            fv = dval != null ? dval.value : 0;
            paytype = eval != null ? eval.value ? 1 : 0 : 0;
            if (n == 0) {
                scf.PushOperand(operand, "e#NUM!", 0);
                return;
            } else if (rate == 0) {
                payment = (fv - pv) / n;
            } else {
                payment = (0 - fv - pv * Math.pow(1 + rate, n)) / ((1 + rate * paytype) * (Math.pow(1 + rate, n) - 1) / rate);
            }
            result = payment;
            resulttype = "n$";
            break;

          case "PV":
            rate = aval.value;
            n = bval.value;
            payment = cval.value;
            fv = dval != null ? dval.value : 0;
            paytype = eval != null ? eval.value ? 1 : 0 : 0;
            if (rate == -1) {
                scf.PushOperand(operand, "e#DIV/0!", 0);
                return;
            } else if (rate == 0) {
                pv = -fv - payment * n;
            } else {
                pv = (-fv - payment * (1 + rate * paytype) * (Math.pow(1 + rate, n) - 1) / rate) / Math.pow(1 + rate, n);
            }
            result = pv;
            resulttype = "n$";
            break;

          case "RATE":
            n = aval.value;
            payment = bval.value;
            pv = cval.value;
            fv = dval != null ? dval.value : 0;
            paytype = eval != null ? eval.value ? 1 : 0 : 0;
            guess = fval != null ? fval.value : .1;
            maxloop = 100;
            tries = 0;
            delta = 1;
            epsilon = 1e-7;
            rate = guess || 1e-8;
            while ((delta >= 0 ? delta : -delta) > epsilon && rate != oldrate) {
                delta = fv + pv * Math.pow(1 + rate, n) + payment * (1 + rate * paytype) * (Math.pow(1 + rate, n) - 1) / rate;
                if (olddelta != null) {
                    m = (delta - olddelta) / (rate - oldrate) || .001;
                    oldrate = rate;
                    rate = rate - delta / m;
                    olddelta = delta;
                } else {
                    oldrate = rate;
                    rate = 1.1 * rate;
                    olddelta = delta;
                }
                tries++;
                if (tries >= maxloop) {
                    scf.PushOperand(operand, "e#NUM!", 0);
                    return;
                }
            }
            result = rate;
            resulttype = "n%";
            break;
        }
    }
    scf.PushOperand(operand, resulttype, result);
    return;
};

SocialCalc.Formula.FunctionList["FV"] = [ SocialCalc.Formula.InterestFunctions, -3, "fv", "", "financial" ];

SocialCalc.Formula.FunctionList["NPER"] = [ SocialCalc.Formula.InterestFunctions, -3, "nper", "", "financial" ];

SocialCalc.Formula.FunctionList["PMT"] = [ SocialCalc.Formula.InterestFunctions, -3, "pmt", "", "financial" ];

SocialCalc.Formula.FunctionList["PV"] = [ SocialCalc.Formula.InterestFunctions, -3, "pv", "", "financial" ];

SocialCalc.Formula.FunctionList["RATE"] = [ SocialCalc.Formula.InterestFunctions, -3, "rate", "", "financial" ];

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
            factor *= 1 + rate.value;
            if (factor == 0) {
                scf.PushOperand(operand, "e#DIV/0!", 0);
                return;
            }
            sum += value1.value / factor;
            resulttypenpv = scf.LookupResultType(value1.type, resulttypenpv || value1.type, scf.TypeLookupTable.plus);
        } else if (value1.type.charAt(0) == "e" && resulttypenpv.charAt(0) != "e") {
            resulttypenpv = value1.type;
            break;
        }
    }
    if (resulttypenpv.charAt(0) == "n") {
        resulttypenpv = "n$";
    }
    scf.PushOperand(operand, resulttypenpv, sum);
    return;
};

SocialCalc.Formula.FunctionList["NPV"] = [ SocialCalc.Formula.NPVFunction, -2, "npv", "", "financial" ];

SocialCalc.Formula.IRRFunction = function(fname, operand, foperand, sheet) {
    var value1, guess, oldsum, maxloop, tries, epsilon, rate, oldrate, m, sum, factor, i;
    var rangeoperand = [];
    var cashflows = [];
    var scf = SocialCalc.Formula;
    rangeoperand.push(foperand.pop());
    while (rangeoperand.length) {
        value1 = scf.OperandValueAndType(sheet, rangeoperand);
        if (value1.type.charAt(0) == "n") {
            cashflows.push(value1.value);
        } else if (value1.type.charAt(0) == "e") {
            scf.PushOperand(operand, "e#VALUE!", 0);
            return;
        }
    }
    if (!cashflows.length) {
        scf.PushOperand(operand, "e#NUM!", 0);
        return;
    }
    guess = {
        value: 0
    };
    if (foperand.length) {
        guess = scf.OperandAsNumber(sheet, foperand);
        if (guess.type.charAt(0) != "n" && guess.type.charAt(0) != "b") {
            scf.PushOperand(operand, "e#VALUE!", 0);
            return;
        }
        if (foperand.length) {
            scf.FunctionArgsError(fname, operand);
            return;
        }
    }
    guess.value = guess.value || .1;
    maxloop = 20;
    tries = 0;
    epsilon = 1e-7;
    rate = guess.value;
    sum = 1;
    while ((sum >= 0 ? sum : -sum) > epsilon && rate != oldrate) {
        sum = 0;
        factor = 1;
        for (i = 0; i < cashflows.length; i++) {
            factor *= 1 + rate;
            if (factor == 0) {
                scf.PushOperand(operand, "e#DIV/0!", 0);
                return;
            }
            sum += cashflows[i] / factor;
        }
        if (oldsum != null) {
            m = (sum - oldsum) / (rate - oldrate);
            oldrate = rate;
            rate = rate - sum / m;
            oldsum = sum;
        } else {
            oldrate = rate;
            rate = 1.1 * rate;
            oldsum = sum;
        }
        tries++;
        if (tries >= maxloop) {
            scf.PushOperand(operand, "e#NUM!", 0);
            return;
        }
    }
    scf.PushOperand(operand, "n%", rate);
    return;
};

SocialCalc.Formula.FunctionList["IRR"] = [ SocialCalc.Formula.IRRFunction, -1, "irr", "", "financial" ];

SocialCalc.Formula.SheetCache = {
    sheets: {},
    waitingForLoading: null,
    constants: {
        asloaded: 0,
        recalcing: 1,
        recalcdone: 2
    },
    loadsheet: null
};

SocialCalc.Formula.FindInSheetCache = function(sheetname) {
    var str;
    var sfsc = SocialCalc.Formula.SheetCache;
    var nsheetname = SocialCalc.Formula.NormalizeSheetName(sheetname);
    if (sfsc.sheets[nsheetname]) {
        return sfsc.sheets[nsheetname].sheet;
    }
    if (sfsc.waitingForLoading) {
        return null;
    }
    if (sfsc.loadsheet) {
        alert("Using SocialCalc.Formula.SheetCache.loadsheet - deprecated");
        return SocialCalc.Formula.AddSheetToCache(nsheetname, sfsc.loadsheet(nsheetname));
    }
    sfsc.waitingForLoading = nsheetname;
    return null;
};

SocialCalc.Formula.AddSheetToCache = function(sheetname, str, live) {
    var newsheet = null;
    var sfsc = SocialCalc.Formula.SheetCache;
    var sfscc = sfsc.constants;
    var newsheetname = SocialCalc.Formula.NormalizeSheetName(sheetname);
    if (str) {
        newsheet = new SocialCalc.Sheet();
        newsheet.ParseSheetSave(str);
    }
    sfsc.sheets[newsheetname] = {
        sheet: newsheet,
        recalcstate: sfscc.asloaded,
        name: newsheetname
    };
    SocialCalc.Formula.FreshnessInfo.sheets[newsheetname] = typeof live == "undefined" || live === false;
    return newsheet;
};

SocialCalc.Formula.NormalizeSheetName = function(sheetname) {
    if (SocialCalc.Callbacks.NormalizeSheetName) {
        return SocialCalc.Callbacks.NormalizeSheetName(sheetname);
    } else {
        return sheetname.toLowerCase();
    }
};

SocialCalc.Formula.RemoteFunctionInfo = {
    waitingForServer: null
};

SocialCalc.Formula.FreshnessInfo = {
    sheets: {},
    "volatile": {},
    recalc_completed: false
};

SocialCalc.Formula.FreshnessInfoReset = function() {
    var scffi = SocialCalc.Formula.FreshnessInfo;
    var scfsc = SocialCalc.Formula.SheetCache;
    for (var sheet in scffi.sheets) {
        if (scffi.sheets[sheet] === false) {
            delete scfsc.sheets[sheet];
        }
    }
    scffi.sheets = {};
    scffi.volatile = {};
    scffi.recalc_completed = false;
};

SocialCalc.Formula.PlainCoord = function(coord) {
    if (coord.indexOf("$") == -1) return coord;
    return coord.replace(/\$/g, "");
};

SocialCalc.Formula.OrderRangeParts = function(coord1, coord2) {
    var cr1, cr2;
    var result = {};
    cr1 = SocialCalc.coordToCr(coord1);
    cr2 = SocialCalc.coordToCr(coord2);
    if (cr1.col > cr2.col) {
        result.c1 = cr2.col;
        result.c2 = cr1.col;
    } else {
        result.c1 = cr1.col;
        result.c2 = cr2.col;
    }
    if (cr1.row > cr2.row) {
        result.r1 = cr2.row;
        result.r2 = cr1.row;
    } else {
        result.r1 = cr1.row;
        result.r2 = cr2.row;
    }
    return result;
};

SocialCalc.Formula.TestCriteria = function(value, type, criteria) {
    var comparitor, basestring, basevalue, cond, testvalue;
    if (criteria == null) {
        return false;
    }
    criteria = criteria + "";
    comparitor = criteria.charAt(0);
    if (comparitor == "=" || comparitor == "<" || comparitor == ">") {
        basestring = criteria.substring(1);
    } else {
        comparitor = criteria.substring(0, 2);
        if (comparitor == "<=" || comparitor == "<>" || comparitor == ">=") {
            basestring = criteria.substring(2);
        } else {
            comparitor = "none";
            basestring = criteria;
        }
    }
    basevalue = SocialCalc.DetermineValueType(basestring);
    if (!basevalue.type) {
        if (comparitor == "none") {
            return false;
        }
        if (type.charAt(0) == "b") {
            if (comparitor == "=") {
                return true;
            }
        } else {
            if (comparitor == "<>") {
                return true;
            }
        }
        return false;
    }
    cond = false;
    if (basevalue.type.charAt(0) == "n" && type.charAt(0) == "t") {
        testvalue = SocialCalc.DetermineValueType(value);
        if (testvalue.type.charAt(0) == "n") {
            value = testvalue.value;
            type = testvalue.type;
        }
    }
    if (type.charAt(0) == "n" && basevalue.type.charAt(0) == "n") {
        value = value - 0;
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
    } else if (type.charAt(0) == "e") {
        cond = false;
    } else if (basevalue.type.charAt(0) == "e") {
        cond = false;
    } else {
        if (type.charAt(0) == "n") {
            value = SocialCalc.format_number_for_display(value, "n", "");
        }
        if (basevalue.type.charAt(0) == "n") {
            return false;
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
};

var SocialCalc;

if (!SocialCalc) {
    SocialCalc = {};
}

SocialCalc.Popup = {};

SocialCalc.Popup.Types = {};

SocialCalc.Popup.Controls = {};

SocialCalc.Popup.Current = {};

SocialCalc.Popup.LocalizeString = function(str) {
    return str;
};

SocialCalc.Popup.Create = function(type, id, attribs) {
    var pt = SocialCalc.Popup.Types[type];
    if (pt && pt.Create) {
        pt.Create(type, id, attribs);
    }
    SocialCalc.Popup.imagePrefix = SocialCalc.Constants.defaultImagePrefix;
};

SocialCalc.Popup.SetValue = function(id, value) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    if (!spc[id]) {
        alert("Unknown control " + id);
        return;
    }
    var type = spc[id].type;
    var pt = spt[type];
    var spcdata = spc[id].data;
    if (pt && pt.Create) {
        pt.SetValue(type, id, value);
        if (spcdata.attribs && spcdata.attribs.changedcallback) {
            spcdata.attribs.changedcallback(spcdata.attribs, id, value);
        }
    }
};

SocialCalc.Popup.SetDisabled = function(id, disabled) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    if (!spc[id]) {
        alert("Unknown control " + id);
        return;
    }
    var type = spc[id].type;
    var pt = spt[type];
    if (pt && pt.Create) {
        if (sp.Current.id && id == sp.Current.id) {
            pt.Hide(type, sp.Current.id);
            sp.Current.id = null;
        }
        pt.SetDisabled(type, id, disabled);
    }
};

SocialCalc.Popup.GetValue = function(id) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    if (!spc[id]) {
        alert("Unknown control " + id);
        return;
    }
    var type = spc[id].type;
    var pt = spt[type];
    if (pt && pt.Create) {
        return pt.GetValue(type, id);
    }
    return null;
};

SocialCalc.Popup.Initialize = function(id, data) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    if (!spc[id]) {
        alert("Unknown control " + id);
        return;
    }
    var type = spc[id].type;
    var pt = spt[type];
    if (pt && pt.Initialize) {
        pt.Initialize(type, id, data);
    }
};

SocialCalc.Popup.Reset = function(type) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    if (spt[type].Reset) spt[type].Reset(type);
};

SocialCalc.Popup.CClick = function(id) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    if (!spc[id]) {
        alert("Unknown control " + id);
        return;
    }
    if (spc[id].data && spc[id].data.disabled) return;
    var type = spc[id].type;
    var pt = spt[type];
    if (sp.Current.id) {
        spt[spc[sp.Current.id].type].Hide(type, sp.Current.id);
        if (id == sp.Current.id) {
            sp.Current.id = null;
            return;
        }
    }
    if (pt && pt.Show) {
        pt.Show(type, id);
    }
    sp.Current.id = id;
};

SocialCalc.Popup.Close = function() {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    if (!sp.Current.id) return;
    sp.CClick(sp.Current.id);
};

SocialCalc.Popup.Cancel = function() {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    if (!sp.Current.id) return;
    var type = spc[sp.Current.id].type;
    var pt = spt[type];
    pt.Cancel(type, sp.Current.id);
    sp.Current.id = null;
};

SocialCalc.Popup.CreatePopupDiv = function(id, attribs) {
    var pos, ele;
    var sp = SocialCalc.Popup;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    var main = document.createElement("div");
    main.style.position = "absolute";
    pos = SocialCalc.GetElementPosition(spcdata.mainele);
    main.style.top = pos.top + spcdata.mainele.offsetHeight + "px";
    main.style.left = pos.left + "px";
    main.style.zIndex = 100;
    main.style.backgroundColor = "#FFF";
    main.style.border = "1px solid black";
    if (attribs.width) {
        main.style.width = attribs.width;
    }
    spcdata.mainele.appendChild(main);
    if (attribs.title) {
        main.innerHTML = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr>' + '<td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">' + attribs.title + "</td>" + '<td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.Popup.Cancel();">&nbsp;X&nbsp;</td></tr></table>';
        if (attribs.moveable) {
            spcdata.dragregistered = main.firstChild.firstChild.firstChild.firstChild;
            SocialCalc.DragRegister(spcdata.dragregistered, true, true, {
                MouseDown: SocialCalc.DragFunctionStart,
                MouseMove: SocialCalc.DragFunctionPosition,
                MouseUp: SocialCalc.DragFunctionPosition,
                Disabled: null,
                positionobj: main
            }, spcdata.mainele);
        }
    }
    return main;
};

SocialCalc.Popup.EnsurePosition = function(id, container) {
    var sp = SocialCalc.Popup;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    var main = spcdata.mainele.firstChild;
    if (!main) {
        alert("No main popup element firstChild.");
        return;
    }
    var popup = spcdata.popupele;
    function GetLayoutValues(ele) {
        var r = SocialCalc.GetElementPosition(ele);
        r.height = ele.offsetHeight;
        r.width = ele.offsetWidth;
        r.bottom = r.top + r.height;
        r.right = r.left + r.width;
        return r;
    }
    var p = GetLayoutValues(popup);
    var c = GetLayoutValues(container);
    var m = GetLayoutValues(main);
    var t = 0;
    if (m.bottom + p.height < c.bottom && m.left + p.width < c.right) {
        popup.style.top = m.bottom + "px";
        popup.style.left = m.left + "px";
        t = 1;
    } else if (m.top - p.height > c.top && m.left + p.width < c.right) {
        popup.style.top = m.top - p.height + "px";
        popup.style.left = m.left + "px";
        t = 2;
    } else if (m.bottom + p.height < c.bottom && m.right - p.width > c.left) {
        popup.style.top = m.bottom + "px";
        popup.style.left = m.right - p.width + "px";
        t = 3;
    } else if (m.top - p.height > c.top && m.right - p.width > c.left) {
        popup.style.top = m.top - p.height + "px";
        popup.style.left = m.right - p.width + "px";
        t = 4;
    } else if (m.bottom + p.height < c.bottom && p.width < c.width) {
        popup.style.top = m.bottom + "px";
        popup.style.left = c.left + Math.floor((c.width - p.width) / 2) + "px";
        t = 5;
    } else if (m.top - p.height > c.top && p.width < c.width) {
        popup.style.top = m.top - p.height + "px";
        popup.style.left = c.left + Math.floor((c.width - p.width) / 2) + "px";
        t = 6;
    } else if (p.height < c.height && m.right + p.width < c.right) {
        popup.style.top = c.top + Math.floor((c.height - p.height) / 2) + "px";
        popup.style.left = m.right + "px";
        t = 7;
    } else if (p.height < c.height && m.left - p.width > c.left) {
        popup.style.top = c.top + Math.floor((c.height - p.height) / 2) + "px";
        popup.style.left = m.left - p.width + "px";
        t = 8;
    } else {}
};

SocialCalc.Popup.DestroyPopupDiv = function(ele, dragregistered) {
    if (!ele) return;
    ele.innerHTML = "";
    SocialCalc.DragUnregister(dragregistered);
    if (ele.parentNode) {
        ele.parentNode.removeChild(ele);
    }
};

SocialCalc.Popup.RGBToHex = function(val) {
    var sp = SocialCalc.Popup;
    if (val == "") {
        return "000000";
    }
    var rgbvals = val.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (rgbvals) {
        return sp.ToHex(rgbvals[1]) + sp.ToHex(rgbvals[2]) + sp.ToHex(rgbvals[3]);
    } else {
        return "000000";
    }
};

SocialCalc.Popup.HexDigits = "0123456789ABCDEF";

SocialCalc.Popup.ToHex = function(num) {
    var sp = SocialCalc.Popup;
    var first = Math.floor(num / 16);
    var second = num % 16;
    return sp.HexDigits.charAt(first) + sp.HexDigits.charAt(second);
};

SocialCalc.Popup.FromHex = function(str) {
    var sp = SocialCalc.Popup;
    var first = sp.HexDigits.indexOf(str.charAt(0).toUpperCase());
    var second = sp.HexDigits.indexOf(str.charAt(1).toUpperCase());
    return (first >= 0 ? first : 0) * 16 + (second >= 0 ? second : 0);
};

SocialCalc.Popup.HexToRGB = function(val) {
    var sp = SocialCalc.Popup;
    return "rgb(" + sp.FromHex(val.substring(1, 3)) + "," + sp.FromHex(val.substring(3, 5)) + "," + sp.FromHex(val.substring(5, 7)) + ")";
};

SocialCalc.Popup.makeRGB = function(r, g, b) {
    return "rgb(" + (r > 0 ? r : 0) + "," + (g > 0 ? g : 0) + "," + (b > 0 ? b : 0) + ")";
};

SocialCalc.Popup.splitRGB = function(rgb) {
    var parts = rgb.match(/(\d+)\D+(\d+)\D+(\d+)\D/);
    if (!parts) {
        return {
            r: 0,
            g: 0,
            b: 0
        };
    } else {
        return {
            r: parts[1] - 0,
            g: parts[2] - 0,
            b: parts[3] - 0
        };
    }
};

SocialCalc.Popup.Types.List = {};

SocialCalc.Popup.Types.List.Create = function(type, id, attribs) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcid = {
        type: type,
        value: "",
        display: "",
        data: {}
    };
    spc[id] = spcid;
    var spcdata = spcid.data;
    spcdata.attribs = attribs || {};
    var ele = document.getElementById(id);
    if (!ele) {
        alert("Missing element " + id);
        return;
    }
    spcdata.mainele = ele;
    ele.innerHTML = '<input style="cursor:pointer;width:100px;font-size:smaller;" onfocus="this.blur();" onclick="SocialCalc.Popup.CClick(\'' + id + '\');" value="">';
    spcdata.options = [];
};

SocialCalc.Popup.Types.List.SetValue = function(type, id, value) {
    var i;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    spcdata.value = value;
    spcdata.custom = false;
    for (i = 0; i < spcdata.options.length; i++) {
        o = spcdata.options[i];
        if (o.a) {
            if (o.a.skip || o.a.custom || o.a.cancel) {
                continue;
            }
        }
        if (o.v == spcdata.value) {
            spcdata.display = o.o;
            break;
        }
    }
    if (i == spcdata.options.length) {
        spcdata.display = "Custom";
        spcdata.custom = true;
    }
    if (spcdata.mainele && spcdata.mainele.firstChild) {
        spcdata.mainele.firstChild.value = spcdata.display;
    }
};

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
};

SocialCalc.Popup.Types.List.GetValue = function(type, id) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    return spcdata.value;
};

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
    if (data.value) {
        sp.SetValue(id, data.value);
    }
};

SocialCalc.Popup.Types.List.Reset = function(type) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    if (sp.Current.id && spc[sp.Current.id].type == type) {
        spt[type].Hide(type, sp.Current.id);
        sp.Current.id = null;
    }
};

SocialCalc.Popup.Types.List.Show = function(type, id) {
    var i, ele, o, bg;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    var str = "";
    spcdata.popupele = sp.CreatePopupDiv(id, spcdata.attribs);
    if (spcdata.custom) {
        str = SocialCalc.Popup.Types.List.MakeCustom(type, id);
        ele = document.createElement("div");
        ele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">' + str + "</div>";
        spcdata.customele = ele.firstChild.firstChild.childNodes[1];
        spcdata.listdiv = null;
        spcdata.contentele = ele;
    } else {
        str = SocialCalc.Popup.Types.List.MakeList(type, id);
        ele = document.createElement("div");
        ele.innerHTML = '<div style="cursor:default;padding:4px;">' + str + "</div>";
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
};

SocialCalc.Popup.Types.List.MakeList = function(type, id) {
    var i, ele, o, bg;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    var str = '<table cellspacing="0" cellpadding="0"><tr>';
    var td = '<td style="vertical-align:top;">';
    str += td;
    spcdata.ncols = 1;
    for (i = 0; i < spcdata.options.length; i++) {
        o = spcdata.options[i];
        if (o.a) {
            if (o.a.newcol) {
                str += "</td>" + td + "&nbsp;&nbsp;&nbsp;&nbsp;" + "</td>" + td;
                spcdata.ncols += 1;
                continue;
            }
            if (o.a.skip) {
                str += '<div style="font-size:x-small;white-space:nowrap;">' + o.o + "</div>";
                continue;
            }
        }
        if (o.v == spcdata.value && !(o.a && (o.a.custom || o.a.cancel))) {
            bg = "background-color:#DDF;";
        } else {
            bg = "";
        }
        str += '<div style="font-size:x-small;white-space:nowrap;' + bg + '" onclick="SocialCalc.Popup.Types.List.ItemClicked(\'' + id + "','" + i + "');\" onmousemove=\"SocialCalc.Popup.Types.List.MouseMove('" + id + "',this);\">" + o.o + "</div>";
    }
    str += "</td></tr></table>";
    return str;
};

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
    str = '<div style="white-space:nowrap;"><br>' + '<input id="customvalue" value="' + val + '"><br><br>' + "<input " + style + ' type="button" value="' + SPLoc("OK") + '" onclick="SocialCalc.Popup.Types.List.CustomOK(\'' + id + "');return false;\">" + "<input " + style + ' type="button" value="' + SPLoc("List") + '" onclick="SocialCalc.Popup.Types.List.CustomToList(\'' + id + "');\">" + "<input " + style + ' type="button" value="' + SPLoc("Cancel") + '" onclick="SocialCalc.Popup.Close();">' + "<br></div>";
    return str;
};

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
        nele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">' + str + "</div>";
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
};

SocialCalc.Popup.Types.List.CustomToList = function(id) {
    var oele, str, nele;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    oele = spcdata.contentele;
    str = SocialCalc.Popup.Types.List.MakeList("List", id);
    nele = document.createElement("div");
    nele.innerHTML = '<div style="cursor:default;padding:4px;">' + str + "</div>";
    spcdata.customele = null;
    spcdata.listdiv = nele.firstChild;
    spcdata.contentele = nele;
    spcdata.popupele.replaceChild(nele, oele);
    if (spcdata.attribs.ensureWithin) {
        SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
    }
};

SocialCalc.Popup.Types.List.CustomOK = function(id) {
    var i, c;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    SocialCalc.Popup.SetValue(id, spcdata.customele.value);
    SocialCalc.Popup.Close();
};

SocialCalc.Popup.Types.List.MouseMove = function(id, ele) {
    var col, i, c;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    var list = spcdata.listdiv;
    if (!list) return;
    var rowele = list.firstChild.firstChild.firstChild;
    for (col = 0; col < spcdata.ncols; col++) {
        for (i = 0; i < rowele.childNodes[col * 2].childNodes.length; i++) {
            rowele.childNodes[col * 2].childNodes[i].style.backgroundColor = "#FFF";
        }
    }
    ele.style.backgroundColor = "#DDF";
};

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
};

SocialCalc.Popup.Types.List.Cancel = function(type, id) {
    SocialCalc.Popup.Types.List.Hide(type, id);
};

SocialCalc.Popup.Types.ColorChooser = {};

SocialCalc.Popup.Types.ColorChooser.Create = function(type, id, attribs) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcid = {
        type: type,
        value: "",
        display: "",
        data: {}
    };
    spc[id] = spcid;
    var spcdata = spcid.data;
    spcdata.attribs = attribs || {};
    var spca = spcdata.attribs;
    spcdata.value = "";
    var ele = document.getElementById(id);
    if (!ele) {
        alert("Missing element " + id);
        return;
    }
    spcdata.mainele = ele;
    ele.innerHTML = '<div style="cursor:pointer;border:1px solid black;vertical-align:top;width:' + (spca.sampleWidth || "15px") + ";height:" + (spca.sampleHeight || "15px") + ';" onclick="SocialCalc.Popup.Types.ColorChooser.ControlClicked(\'' + id + "');\">&nbsp;</div>";
};

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
                img = "url(" + sp.imagePrefix + spca.backgroundImage + ")";
            } else {
                img = "";
            }
            pos = "center center";
        } else {
            spcdata.mainele.firstChild.style.backgroundColor = "#FFF";
            if (spca.backgroundImageDefault) {
                img = "url(" + sp.imagePrefix + spca.backgroundImageDefault + ")";
                pos = "center center";
            } else {
                img = "url(" + sp.imagePrefix + "defaultcolor.gif)";
                pos = "left top";
            }
        }
        spcdata.mainele.firstChild.style.backgroundPosition = pos;
        spcdata.mainele.firstChild.style.backgroundImage = img;
    }
};

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
                img = "url(" + sp.imagePrefix + spca.backgroundImageDisabled + ")";
                pos = "center center";
            } else {
                img = "url(" + sp.imagePrefix + "defaultcolor.gif)";
                pos = "left top";
            }
            spcdata.mainele.firstChild.style.backgroundPosition = pos;
            spcdata.mainele.firstChild.style.backgroundImage = img;
        } else {
            sp.SetValue(id, spcdata.value);
        }
    }
};

SocialCalc.Popup.Types.ColorChooser.GetValue = function(type, id) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    return spcdata.value;
};

SocialCalc.Popup.Types.ColorChooser.Initialize = function(type, id, data) {
    var a;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    for (a in data.attribs) {
        spcdata.attribs[a] = data.attribs[a];
    }
    if (data.value) {
        sp.SetValue(id, data.value);
    }
};

SocialCalc.Popup.Types.ColorChooser.Reset = function(type) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    if (sp.Current.id && spc[sp.Current.id].type == type) {
        spt[type].Hide(type, sp.Current.id);
        sp.Current.id = null;
    }
};

SocialCalc.Popup.Types.ColorChooser.Show = function(type, id) {
    var i, ele, mainele;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    var str = "";
    spcdata.oldvalue = spcdata.value;
    spcdata.popupele = sp.CreatePopupDiv(id, spcdata.attribs);
    if (spcdata.custom) {
        str = SocialCalc.Popup.Types.ColorChooser.MakeCustom(type, id);
        ele = document.createElement("div");
        ele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">' + str + "</div>";
        spcdata.customele = ele.firstChild.firstChild.childNodes[2];
        spcdata.contentele = ele;
    } else {
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
};

SocialCalc.Popup.Types.ColorChooser.MakeCustom = function(type, id) {
    var i, ele, o, bg;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    var SPLoc = sp.LocalizeString;
    var style = 'style="font-size:smaller;"';
    var str = "";
    str = '<div style="white-space:nowrap;"><br>' + '#<input id="customvalue" style="width:75px;" value="' + spcdata.value + '"><br><br>' + "<input " + style + ' type="button" value="' + SPLoc("OK") + '" onclick="SocialCalc.Popup.Types.ColorChooser.CustomOK(\'' + id + "');return false;\">" + "<input " + style + ' type="button" value="' + SPLoc("Grid") + '" onclick="SocialCalc.Popup.Types.ColorChooser.CustomToGrid(\'' + id + "');\">" + "<br></div>";
    return str;
};

SocialCalc.Popup.Types.ColorChooser.ItemClicked = function(id, num) {
    var oele, str, nele;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    SocialCalc.Popup.Close();
};

SocialCalc.Popup.Types.ColorChooser.CustomToList = function(id) {
    var oele, str, nele;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
};

SocialCalc.Popup.Types.ColorChooser.CustomOK = function(id) {
    var i, c;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    sp.SetValue(id, spcdata.customele.value);
    sp.Close();
};

SocialCalc.Popup.Types.ColorChooser.Hide = function(type, id) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    sp.DestroyPopupDiv(spcdata.popupele, spcdata.dragregistered);
    spcdata.popupele = null;
};

SocialCalc.Popup.Types.ColorChooser.Cancel = function(type, id) {
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    sp.SetValue(id, spcdata.oldvalue);
    SocialCalc.Popup.Types.ColorChooser.Hide(type, id);
};

SocialCalc.Popup.Types.ColorChooser.CreateGrid = function(type, id) {
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
    for (row = 0; row < 16; row++) {
        rowele = document.createElement("tr");
        for (col = 0; col < 5; col++) {
            g = {};
            grid[row + "," + col] = g;
            ele = document.createElement("td");
            ele.style.fontSize = "1px";
            ele.innerHTML = "&nbsp;";
            ele.style.height = "10px";
            if (col <= 1) {
                ele.style.width = "17px";
                ele.style.borderRight = "3px solid white";
            } else {
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
    ele.innerHTML = '<table cellspacing="0" cellpadding="0"><tr>' + '<td style="width:17px;background-color:#FFF;background-image:url(' + sp.imagePrefix + 'defaultcolor.gif);height:16px;font-size:10px;cursor:pointer;" title="' + SPLoc("Default") + '">&nbsp;</td>' + '<td style="width:23px;height:16px;font-size:10px;text-align:center;cursor:pointer;" title="' + SPLoc("Custom") + '">#</td>' + '<td style="width:60px;height:16px;font-size:10px;text-align:center;cursor:pointer;">' + SPLoc("OK") + "</td>" + "</tr></table>";
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
};

SocialCalc.Popup.Types.ColorChooser.gridToG = function(grid, row, col) {
    return grid[row + "," + col];
};

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
    row = 16 - Math.floor((rgb.r + 16) / 16);
    grid["selectedrow" + col] = row;
    for (row = 0; row < 16; row++) {
        sptc.gridToG(grid, row, col).rgb = sp.makeRGB(17 * (15 - row), 0, 0);
    }
    col = 3;
    row = 16 - Math.floor((rgb.g + 16) / 16);
    grid["selectedrow" + col] = row;
    for (row = 0; row < 16; row++) {
        sptc.gridToG(grid, row, col).rgb = sp.makeRGB(0, 17 * (15 - row), 0);
    }
    col = 4;
    row = 16 - Math.floor((rgb.b + 16) / 16);
    grid["selectedrow" + col] = row;
    for (row = 0; row < 16; row++) {
        sptc.gridToG(grid, row, col).rgb = sp.makeRGB(0, 0, 17 * (15 - row));
    }
    col = 1;
    for (row = 0; row < 16; row++) {
        sptc.gridToG(grid, row, col).rgb = sp.makeRGB(17 * (15 - row), 17 * (15 - row), 17 * (15 - row));
    }
    col = 0;
    var steps = [ 0, 68, 153, 204, 255 ];
    var commonrgb = [ "400", "310", "420", "440", "442", "340", "040", "042", "032", "044", "024", "004", "204", "314", "402", "414" ];
    var x;
    for (row = 0; row < 16; row++) {
        x = commonrgb[row];
        sptc.gridToG(grid, row, col).rgb = "rgb(" + steps[x.charAt(0) - 0] + "," + steps[x.charAt(1) - 0] + "," + steps[x.charAt(2) - 0] + ")";
    }
};

SocialCalc.Popup.Types.ColorChooser.SetColors = function(id) {
    var row, col, g, ele, rgb;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var sptc = spt.ColorChooser;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    var grid = spcdata.grid;
    for (row = 0; row < 16; row++) {
        for (col = 0; col < 5; col++) {
            g = sptc.gridToG(grid, row, col);
            g.ele.style.backgroundColor = g.rgb;
            g.ele.title = sp.RGBToHex(g.rgb);
            if (grid["selectedrow" + col] == row) {
                g.ele.style.backgroundImage = "url(" + sp.imagePrefix + "chooserarrow.gif)";
            } else {
                g.ele.style.backgroundImage = "";
            }
        }
    }
    sp.SetValue(id, spcdata.value);
    grid.msg.style.backgroundColor = spcdata.value;
    rgb = sp.splitRGB(spcdata.value || "rgb(255,255,255)");
    if (rgb.r + rgb.g + rgb.b < 220) {
        grid.msg.style.color = "#FFF";
    } else {
        grid.msg.style.color = "#000";
    }
    if (!spcdata.value) {
        grid.msg.style.backgroundColor = "#FFF";
        grid.msg.style.backgroundImage = "url(" + sp.imagePrefix + "defaultcolor.gif)";
        grid.msg.title = "Default";
    } else {
        grid.msg.style.backgroundImage = "";
        grid.msg.title = sp.RGBToHex(spcdata.value);
    }
};

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
    gpos.top -= pos.top;
    var row = Math.floor((clientY - gpos.top - 2) / 10);
    row = row < 0 ? 0 : row;
    var col = Math.floor((clientX - gpos.left) / 20);
    row = row < 0 ? 0 : row > 15 ? 15 : row;
    col = col < 0 ? 0 : col > 4 ? 4 : col;
    var color = sptc.gridToG(grid, row, col).ele.style.backgroundColor;
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
};

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
};

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
};

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
    nele.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">' + str + "</div>";
    spcdata.customele = nele.firstChild.firstChild.childNodes[2];
    spcdata.contentele = nele;
    spcdata.popupele.replaceChild(nele, oele);
    spcdata.customele.value = sp.RGBToHex(spcdata.value);
    if (spcdata.attribs.ensureWithin) {
        SocialCalc.Popup.EnsurePosition(id, spcdata.attribs.ensureWithin);
    }
};

SocialCalc.Popup.Types.ColorChooser.CustomToGrid = function(id) {
    var oele, str, nele;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    SocialCalc.Popup.SetValue(id, sp.HexToRGB("#" + spcdata.customele.value));
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
};

SocialCalc.Popup.Types.ColorChooser.CustomOK = function(id) {
    var i, c;
    var sp = SocialCalc.Popup;
    var spt = sp.Types;
    var spc = sp.Controls;
    var spcdata = spc[id].data;
    SocialCalc.Popup.SetValue(id, sp.HexToRGB("#" + spcdata.customele.value));
    SocialCalc.Popup.Close();
};

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
};

var SocialCalc;

if (!SocialCalc) {
    alert("Main SocialCalc code module needed");
    SocialCalc = {};
}

if (!SocialCalc.TableEditor) {
    alert("SocialCalc TableEditor code module needed");
}

SocialCalc.CurrentSpreadsheetControlObject = null;

SocialCalc.SpreadsheetControl = function(idPrefix) {
    var scc = SocialCalc.Constants;
    this.parentNode = null;
    this.spreadsheetDiv = null;
    this.requestedHeight = 0;
    this.requestedWidth = 0;
    this.requestedSpaceBelow = 0;
    this.height = 0;
    this.width = 0;
    this.viewheight = 0;
    this.tabs = [];
    this.tabnums = {};
    this.tabreplacements = {};
    this.currentTab = -1;
    this.views = {};
    this.sheet = null;
    this.context = null;
    this.editor = null;
    this.spreadsheetDiv = null;
    this.editorDiv = null;
    this.sortrange = "";
    this.moverange = "";
    this.idPrefix = idPrefix || "SocialCalc-";
    this.multipartBoundary = "SocialCalcSpreadsheetControlSave";
    this.imagePrefix = scc.defaultImagePrefix;
    this.toolbarbackground = scc.SCToolbarbackground;
    this.tabbackground = scc.SCTabbackground;
    this.tabselectedCSS = scc.SCTabselectedCSS;
    this.tabplainCSS = scc.SCTabplainCSS;
    this.toolbartext = scc.SCToolbartext;
    this.formulabarheight = scc.SCFormulabarheight;
    this.statuslineheight = scc.SCStatuslineheight;
    this.statuslineCSS = scc.SCStatuslineCSS;
    this.ExportCallback = null;
    this.sheet = new SocialCalc.Sheet();
    this.context = new SocialCalc.RenderContext(this.sheet);
    this.context.showGrid = true;
    this.context.showRCHeaders = true;
    this.editor = new SocialCalc.TableEditor(this.context);
    this.editor.StatusCallback.statusline = {
        func: SocialCalc.SpreadsheetControlStatuslineCallback,
        params: {
            statuslineid: this.idPrefix + "statusline",
            recalcid1: this.idPrefix + "divider_recalc",
            recalcid2: this.idPrefix + "button_recalc"
        }
    };
    SocialCalc.CurrentSpreadsheetControlObject = this;
    this.editor.MoveECellCallback.movefrom = function(editor) {
        var cr;
        var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
        spreadsheet.context.cursorsuffix = "";
        if (editor.range2.hasrange && !editor.cellhandles.noCursorSuffix) {
            if (editor.ecell.row == editor.range2.top && (editor.ecell.col < editor.range2.left || editor.ecell.col > editor.range2.right + 1)) {
                spreadsheet.context.cursorsuffix = "insertleft";
            }
            if (editor.ecell.col == editor.range2.left && (editor.ecell.row < editor.range2.top || editor.ecell.row > editor.range2.bottom + 1)) {
                spreadsheet.context.cursorsuffix = "insertup";
            }
        }
    };
    this.formulabuttons = {
        formulafunctions: {
            image: "insertformula.png",
            tooltip: "Functions",
            command: SocialCalc.SpreadsheetControl.DoFunctionList
        },
        multilineinput: {
            image: "listbox.png",
            tooltip: "Multi-line Input Box",
            command: SocialCalc.SpreadsheetControl.DoMultiline
        },
        link: {
            image: "inserthyperlink.png",
            tooltip: "Link Input Box",
            command: SocialCalc.SpreadsheetControl.DoLink
        },
        sum: {
            image: "autosum.png",
            tooltip: "Auto Sum",
            command: SocialCalc.SpreadsheetControl.DoSum
        }
    };
    this.findbuttons = {
        last: {
            image: "upsearch.png",
            tooltip: "Find Previous",
            command: SocialCalc.SpreadsheetControl.SearchUp
        },
        next: {
            image: "downsearch.png",
            tooltip: "Find Next",
            command: SocialCalc.SpreadsheetControl.SearchDown
        }
    };
    this.tabnums.edit = this.tabs.length;
    this.tabs.push({
        name: "edit",
        text: "Edit",
        html: ' <div id="%id.edittools" style="padding:10px 0px 0px 0px;">' + '&nbsp;<img id="%id.button_undo" src="%img.undo.png" style="vertical-align:bottom;">' + ' <img id="%id.button_redo" src="%img.redo.png" style="vertical-align:bottom;">' + ' &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; ' + '<img id="%id.button_copy" src="%img.copy.png" style="vertical-align:bottom;">' + ' <img id="%id.button_cut" src="%img.cut.png" style="vertical-align:bottom;">' + ' <img id="%id.button_paste" src="%img.paste.png" style="vertical-align:bottom;">' + ' &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; ' + '<img id="%id.button_delete" src="%img.delete.png" style="vertical-align:bottom;">' + ' <img id="%id.button_pasteformats" src="%img.formatpaintbrush.png" style="vertical-align:bottom;">' + ' &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; ' + ' <span id="%id.locktools"><img id="%id.button_lock" src="%img.lock.png" style="vertical-align:bottom;">' + ' <img id="%id.button_unlock" src="%img.unlock.png" style="vertical-align:bottom;">' + ' &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp;</span> ' + '<img id="%id.button_filldown" src="%img.filldown.png" style="vertical-align:bottom;">' + ' <img id="%id.button_fillright" src="%img.fillright.png" style="vertical-align:bottom;">' + ' &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; ' + '<img id="%id.button_movefrom" src="%img.movefromoff.gif" style="vertical-align:bottom;">' + ' <img id="%id.button_movepaste" src="%img.movepasteoff.gif" style="vertical-align:bottom;">' + ' <img id="%id.button_moveinsert" src="%img.moveinsertoff.gif" style="vertical-align:bottom;">' + ' &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; ' + '<img id="%id.button_alignleft" src="%img.alignleft.png" style="vertical-align:bottom;">' + ' <img id="%id.button_aligncenter" src="%img.aligncenter.png" style="vertical-align:bottom;">' + ' <img id="%id.button_alignright" src="%img.alignright.png" style="vertical-align:bottom;">' + ' &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; ' + '<img id="%id.button_borderon" src="%img.borderson.png" style="vertical-align:bottom;"> ' + ' <img id="%id.button_borderoff" src="%img.bordersoff.png" style="vertical-align:bottom;"> ' + ' <img id="%id.button_swapcolors" src="%img.swapcolors.png" style="vertical-align:bottom;"> ' + ' &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; ' + '<img id="%id.button_merge" src="%img.mergecells.png" style="vertical-align:bottom;"> ' + ' &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; ' + '<img id="%id.button_insertrow" src="%img.insertrows.png" style="vertical-align:bottom;"> ' + ' <img id="%id.button_insertcol" src="%img.insertcolumns.png" style="vertical-align:bottom;"> ' + ' <img id="%id.button_deleterow" src="%img.deleterows.png" style="vertical-align:bottom;"> ' + ' <img id="%id.button_deletecol" src="%img.deletecolumns.png" style="vertical-align:bottom;"> ' + ' <img id="%id.button_hiderow" src="%img.hiderow.png" style="vertical-align:bottom;"> ' + ' <img id="%id.button_hidecol" src="%img.hidecol.png" style="vertical-align:bottom;"> ' + ' &nbsp;<img id="%id.divider_recalc" src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; ' + '<img id="%id.button_recalc" src="%img.recalc.png" style="vertical-align:bottom;"> ' + " </div>",
        oncreate: null,
        onclick: null
    });
    this.tabnums.settings = this.tabs.length;
    this.tabs.push({
        name: "settings",
        text: "Format",
        html: '<div id="%id.settingstools" style="display:none;">' + ' <div id="%id.sheetsettingstoolbar" style="display:none;">' + '  <table cellspacing="0" cellpadding="0"><tr><td>' + '   <div style="%tbt.">%loc!SHEET SETTINGS!:</div>' + "   </td></tr><tr><td>" + '   <input id="%id.settings-savesheet" type="button" value="%loc!Save!" onclick="SocialCalc.SettingsControlSave(\'sheet\');">' + '   <input type="button" value="%loc!Cancel!" onclick="SocialCalc.SettingsControlSave(\'cancel\');">' + '   <input type="button" value="%loc!Show Cell Settings!" onclick="SocialCalc.SpreadsheetControlSettingsSwitch(\'cell\');return false;">' + "   </td></tr></table>" + " </div>" + ' <div id="%id.cellsettingstoolbar" style="display:none;">' + '  <table cellspacing="0" cellpadding="0"><tr><td>' + '   <div style="%tbt.">%loc!CELL SETTINGS!: <span id="%id.settingsecell">&nbsp;</span></div>' + "   </td></tr><tr><td>" + '  <input id="%id.settings-savecell" type="button" value="%loc!Save!" onclick="SocialCalc.SettingsControlSave(\'cell\');">' + '  <input type="button" value="%loc!Cancel!" onclick="SocialCalc.SettingsControlSave(\'cancel\');">' + '  <input type="button" value="%loc!Show Sheet Settings!" onclick="SocialCalc.SpreadsheetControlSettingsSwitch(\'sheet\');return false;">' + "  </td></tr></table>" + " </div>" + "</div>",
        view: "settings",
        onclick: function(s, t) {
            SocialCalc.SettingsControls.idPrefix = s.idPrefix;
            SocialCalc.SettingControlReset();
            var sheetattribs = s.sheet.EncodeSheetAttributes();
            var cellattribs = s.sheet.EncodeCellAttributes(s.editor.ecell.coord);
            SocialCalc.SettingsControlLoadPanel(s.views.settings.values.sheetspanel, sheetattribs);
            SocialCalc.SettingsControlLoadPanel(s.views.settings.values.cellspanel, cellattribs);
            document.getElementById(s.idPrefix + "settingsecell").innerHTML = s.editor.ecell.coord;
            SocialCalc.SpreadsheetControlSettingsSwitch("cell");
            s.views.settings.element.style.height = s.viewheight + "px";
            s.views.settings.element.firstChild.style.height = s.viewheight + "px";
            var range;
            if (s.editor.range.hasrange) {
                range = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top) + ":" + SocialCalc.crToCoord(s.editor.range.right, s.editor.range.bottom);
            } else {
                range = s.editor.ecell.coord;
            }
            document.getElementById(s.idPrefix + "settings-savecell").value = SocialCalc.LocalizeString("Save to") + ": " + range;
        },
        onclickFocus: true
    });
    this.views["settings"] = {
        name: "settings",
        values: {},
        oncreate: function(s, viewobj) {
            var scc = SocialCalc.Constants;
            viewobj.values.sheetspanel = {
                colorchooser: {
                    id: s.idPrefix + "scolorchooser"
                },
                formatnumber: {
                    setting: "numberformat",
                    type: "PopupList",
                    id: s.idPrefix + "formatnumber",
                    initialdata: scc.SCFormatNumberFormats
                },
                formattext: {
                    setting: "textformat",
                    type: "PopupList",
                    id: s.idPrefix + "formattext",
                    initialdata: scc.SCFormatTextFormats
                },
                fontfamily: {
                    setting: "fontfamily",
                    type: "PopupList",
                    id: s.idPrefix + "fontfamily",
                    initialdata: scc.SCFormatFontfamilies
                },
                fontlook: {
                    setting: "fontlook",
                    type: "PopupList",
                    id: s.idPrefix + "fontlook",
                    initialdata: scc.SCFormatFontlook
                },
                fontsize: {
                    setting: "fontsize",
                    type: "PopupList",
                    id: s.idPrefix + "fontsize",
                    initialdata: scc.SCFormatFontsizes
                },
                textalignhoriz: {
                    setting: "textalignhoriz",
                    type: "PopupList",
                    id: s.idPrefix + "textalignhoriz",
                    initialdata: scc.SCFormatTextAlignhoriz
                },
                numberalignhoriz: {
                    setting: "numberalignhoriz",
                    type: "PopupList",
                    id: s.idPrefix + "numberalignhoriz",
                    initialdata: scc.SCFormatNumberAlignhoriz
                },
                alignvert: {
                    setting: "alignvert",
                    type: "PopupList",
                    id: s.idPrefix + "alignvert",
                    initialdata: scc.SCFormatAlignVertical
                },
                textcolor: {
                    setting: "textcolor",
                    type: "ColorChooser",
                    id: s.idPrefix + "textcolor"
                },
                bgcolor: {
                    setting: "bgcolor",
                    type: "ColorChooser",
                    id: s.idPrefix + "bgcolor"
                },
                padtop: {
                    setting: "padtop",
                    type: "PopupList",
                    id: s.idPrefix + "padtop",
                    initialdata: scc.SCFormatPadsizes
                },
                padright: {
                    setting: "padright",
                    type: "PopupList",
                    id: s.idPrefix + "padright",
                    initialdata: scc.SCFormatPadsizes
                },
                padbottom: {
                    setting: "padbottom",
                    type: "PopupList",
                    id: s.idPrefix + "padbottom",
                    initialdata: scc.SCFormatPadsizes
                },
                padleft: {
                    setting: "padleft",
                    type: "PopupList",
                    id: s.idPrefix + "padleft",
                    initialdata: scc.SCFormatPadsizes
                },
                colwidth: {
                    setting: "colwidth",
                    type: "PopupList",
                    id: s.idPrefix + "colwidth",
                    initialdata: scc.SCFormatColwidth
                },
                recalc: {
                    setting: "recalc",
                    type: "PopupList",
                    id: s.idPrefix + "recalc",
                    initialdata: scc.SCFormatRecalc
                },
                usermaxcol: {
                    setting: "usermaxcol",
                    type: "PopupList",
                    id: s.idPrefix + "usermaxcol",
                    initialdata: scc.SCFormatUserMaxCol
                },
                usermaxrow: {
                    setting: "usermaxrow",
                    type: "PopupList",
                    id: s.idPrefix + "usermaxrow",
                    initialdata: scc.SCFormatUserMaxRow
                }
            };
            viewobj.values.cellspanel = {
                name: "cell",
                colorchooser: {
                    id: s.idPrefix + "scolorchooser"
                },
                cformatnumber: {
                    setting: "numberformat",
                    type: "PopupList",
                    id: s.idPrefix + "cformatnumber",
                    initialdata: scc.SCFormatNumberFormats
                },
                cformattext: {
                    setting: "textformat",
                    type: "PopupList",
                    id: s.idPrefix + "cformattext",
                    initialdata: scc.SCFormatTextFormats
                },
                cfontfamily: {
                    setting: "fontfamily",
                    type: "PopupList",
                    id: s.idPrefix + "cfontfamily",
                    initialdata: scc.SCFormatFontfamilies
                },
                cfontlook: {
                    setting: "fontlook",
                    type: "PopupList",
                    id: s.idPrefix + "cfontlook",
                    initialdata: scc.SCFormatFontlook
                },
                cfontsize: {
                    setting: "fontsize",
                    type: "PopupList",
                    id: s.idPrefix + "cfontsize",
                    initialdata: scc.SCFormatFontsizes
                },
                calignhoriz: {
                    setting: "alignhoriz",
                    type: "PopupList",
                    id: s.idPrefix + "calignhoriz",
                    initialdata: scc.SCFormatTextAlignhoriz
                },
                calignvert: {
                    setting: "alignvert",
                    type: "PopupList",
                    id: s.idPrefix + "calignvert",
                    initialdata: scc.SCFormatAlignVertical
                },
                ctextcolor: {
                    setting: "textcolor",
                    type: "ColorChooser",
                    id: s.idPrefix + "ctextcolor"
                },
                cbgcolor: {
                    setting: "bgcolor",
                    type: "ColorChooser",
                    id: s.idPrefix + "cbgcolor"
                },
                cbt: {
                    setting: "bt",
                    type: "BorderSide",
                    id: s.idPrefix + "cbt"
                },
                cbr: {
                    setting: "br",
                    type: "BorderSide",
                    id: s.idPrefix + "cbr"
                },
                cbb: {
                    setting: "bb",
                    type: "BorderSide",
                    id: s.idPrefix + "cbb"
                },
                cbl: {
                    setting: "bl",
                    type: "BorderSide",
                    id: s.idPrefix + "cbl"
                },
                cpadtop: {
                    setting: "padtop",
                    type: "PopupList",
                    id: s.idPrefix + "cpadtop",
                    initialdata: scc.SCFormatPadsizes
                },
                cpadright: {
                    setting: "padright",
                    type: "PopupList",
                    id: s.idPrefix + "cpadright",
                    initialdata: scc.SCFormatPadsizes
                },
                cpadbottom: {
                    setting: "padbottom",
                    type: "PopupList",
                    id: s.idPrefix + "cpadbottom",
                    initialdata: scc.SCFormatPadsizes
                },
                cpadleft: {
                    setting: "padleft",
                    type: "PopupList",
                    id: s.idPrefix + "cpadleft",
                    initialdata: scc.SCFormatPadsizes
                }
            };
            SocialCalc.SettingsControlInitializePanel(viewobj.values.sheetspanel);
            SocialCalc.SettingsControlInitializePanel(viewobj.values.cellspanel);
        },
        replacements: {
            itemtitle: {
                regex: /\%itemtitle\./g,
                replacement: 'style="padding:12px 10px 0px 10px;font-weight:bold;text-align:right;vertical-align:top;font-size:small;"'
            },
            sectiontitle: {
                regex: /\%sectiontitle\./g,
                replacement: 'style="padding:16px 10px 0px 0px;font-weight:bold;vertical-align:top;font-size:small;color:#C00;"'
            },
            parttitle: {
                regex: /\%parttitle\./g,
                replacement: 'style="font-weight:bold;font-size:x-small;padding:0px 0px 3px 0px;"'
            },
            itembody: {
                regex: /\%itembody\./g,
                replacement: 'style="padding:12px 0px 0px 0px;vertical-align:top;font-size:small;"'
            },
            bodypart: {
                regex: /\%bodypart\./g,
                replacement: 'style="padding:0px 10px 0px 0px;font-size:small;vertical-align:top;"'
            }
        },
        divStyle: "border:1px solid black;overflow:auto;",
        html: '<div id="%id.scolorchooser" style="display:none;position:absolute;z-index:20;"></div>' + '<table cellspacing="0" cellpadding="0">' + ' <tr><td style="vertical-align:top;">' + '<table id="%id.sheetsettingstable" style="display:none;" cellspacing="0" cellpadding="0">' + "<tr>" + " <td %itemtitle.><br>%loc!Default Format!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Number!</div>" + '     <span id="%id.formatnumber"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Text!</div>" + '     <span id="%id.formattext"></span>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "<tr>" + " <td %itemtitle.><br>%loc!Default Alignment!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Text Horizontal!</div>" + '     <span id="%id.textalignhoriz"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Number Horizontal!</div>" + '     <span id="%id.numberalignhoriz"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Vertical!</div>" + '     <span id="%id.alignvert"></span>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "<tr>" + " <td %itemtitle.><br>%loc!Default Font!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Family!</div>" + '     <span id="%id.fontfamily"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Bold &amp; Italics!</div>" + '     <span id="%id.fontlook"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Size!</div>" + '     <span id="%id.fontsize"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Color!</div>" + '     <div id="%id.textcolor"></div>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Background!</div>" + '     <div id="%id.bgcolor"></div>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "<tr>" + " <td %itemtitle.><br>%loc!Default Padding!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Top!</div>" + '     <span id="%id.padtop"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Right!</div>" + '     <span id="%id.padright"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Bottom!</div>" + '     <span id="%id.padbottom"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Left!</div>" + '     <span id="%id.padleft"></span>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "<tr>" + " <td %itemtitle.><br>%loc!Default Column Width!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>&nbsp;</div>" + '     <span id="%id.colwidth"></span>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "<tr>" + " <td %itemtitle.><br>%loc!Recalculation!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>&nbsp;</div>" + '     <span id="%id.recalc"></span>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "<tr>" + " <td %itemtitle.><br>%loc!Dimensions!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Columns!</div>" + '     <span id="%id.usermaxcol"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Rows!</div>" + '     <span id="%id.usermaxrow"></span>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "</table>" + '<table id="%id.cellsettingstable" cellspacing="0" cellpadding="0">' + "<tr>" + " <td %itemtitle.><br>%loc!Format!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Number!</div>" + '     <span id="%id.cformatnumber"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Text!</div>" + '     <span id="%id.cformattext"></span>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "<tr>" + " <td %itemtitle.><br>%loc!Alignment!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Horizontal!</div>" + '     <span id="%id.calignhoriz"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Vertical!</div>" + '     <span id="%id.calignvert"></span>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "<tr>" + " <td %itemtitle.><br>%loc!Font!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Family!</div>" + '     <span id="%id.cfontfamily"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Bold &amp; Italics!</div>" + '     <span id="%id.cfontlook"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Size!</div>" + '     <span id="%id.cfontsize"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Color!</div>" + '     <div id="%id.ctextcolor"></div>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Background!</div>" + '     <div id="%id.cbgcolor"></div>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "<tr>" + " <td %itemtitle.><br>%loc!Borders!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0">' + '    <tr><td %bodypart. colspan="3"><div %parttitle.>%loc!Top Border!</div></td>' + '     <td %bodypart. colspan="3"><div %parttitle.>%loc!Right Border!</div></td>' + '     <td %bodypart. colspan="3"><div %parttitle.>%loc!Bottom Border!</div></td>' + '     <td %bodypart. colspan="3"><div %parttitle.>%loc!Left Border!</div></td>' + "    </tr><tr>" + "    <td %bodypart.>" + '     <input id="%id.cbt-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">' + "    </td>" + "    <td %bodypart.>" + '     <div id="%id.cbt-color"></div>' + "    </td>" + "    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>" + "    <td %bodypart.>" + '     <input id="%id.cbr-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">' + "    </td>" + "    <td %bodypart.>" + '     <div id="%id.cbr-color"></div>' + "    </td>" + "    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>" + "    <td %bodypart.>" + '     <input id="%id.cbb-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">' + "    </td>" + "    <td %bodypart.>" + '     <div id="%id.cbb-color"></div>' + "    </td>" + "    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>" + "    <td %bodypart.>" + '     <input id="%id.cbl-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">' + "    </td>" + "    <td %bodypart.>" + '     <div id="%id.cbl-color"></div>' + "    </td>" + "    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>" + "   </tr></table>" + " </td>" + "</tr>" + "<tr>" + " <td %itemtitle.><br>%loc!Padding!:</td>" + " <td %itembody.>" + '   <table cellspacing="0" cellpadding="0"><tr>' + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Top!</div>" + '     <span id="%id.cpadtop"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Right!</div>" + '     <span id="%id.cpadright"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Bottom!</div>" + '     <span id="%id.cpadbottom"></span>' + "    </td>" + "    <td %bodypart.>" + "     <div %parttitle.>%loc!Left!</div>" + '     <span id="%id.cpadleft"></span>' + "    </td>" + "   </tr></table>" + " </td>" + "</tr>" + "</table>" + ' </td><td style="vertical-align:top;padding:12px 0px 0px 12px;">' + '  <div style="width:100px;height:100px;overflow:hidden;border:1px solid black;background-color:#EEE;padding:6px;">' + '   <table cellspacing="0" cellpadding="0"><tr>' + '    <td id="sample-text" style="height:100px;width:100px;"><div>%loc!This is a<br>sample!</div><div>-1234.5</div></td>' + "   </tr></table>" + "  </div>" + " </td></tr></table>" + "<br>"
    };
    this.tabnums.sort = this.tabs.length;
    this.tabs.push({
        name: "sort",
        text: "Sort",
        html: ' <div id="%id.sorttools" style="display:none;">' + '  <table cellspacing="0" cellpadding="0"><tr>' + '   <td style="vertical-align:top;padding-right:4px;width:160px;">' + '    <div style="%tbt.">%loc!Set Cells To Sort!</div>' + '    <select id="%id.sortlist" size="1" onfocus="%s.CmdGotFocus(this);"><option selected>[select range]</option></select>' + '    <input type="button" value="%loc!OK!" onclick="%s.DoCmd(this, \'ok-setsort\');" style="font-size:x-small;">' + "   </td>" + '   <td style="vertical-align:middle;padding-right:16px;width:100px;text-align:right;">' + '    <div style="%tbt.">&nbsp;</div>' + '    <input type="button" id="%id.sortbutton" value="%loc!Sort Cells! A1:A1" onclick="%s.DoCmd(this, \'dosort\');" style="visibility:hidden;">' + "   </td>" + '   <td style="vertical-align:top;padding-right:16px;">' + '    <table cellspacing="0" cellpadding="0"><tr>' + '     <td style="vertical-align:top;">' + '      <div style="%tbt.">%loc!Major Sort!</div>' + '      <select id="%id.majorsort" size="1" onfocus="%s.CmdGotFocus(this);"></select>' + "     </td><td>" + '      <input type="radio" name="majorsort" id="%id.majorsortup" value="up" checked><span style="font-size:x-small;color:#555753;">%loc!Up!</span><br>' + '      <input type="radio" name="majorsort" id="%id.majorsortdown" value="down"><span style="font-size:x-small;color:#555753;">%loc!Down!</span>' + "     </td>" + "    </tr></table>" + "   </td>" + '   <td style="vertical-align:top;padding-right:16px;">' + '    <table cellspacing="0" cellpadding="0"><tr>' + '     <td style="vertical-align:top;">' + '      <div style="%tbt.">%loc!Minor Sort!</div>' + '      <select id="%id.minorsort" size="1" onfocus="%s.CmdGotFocus(this);"></select>' + "     </td><td>" + '      <input type="radio" name="minorsort" id="%id.minorsortup" value="up" checked><span style="font-size:x-small;color:#555753;">%loc!Up!</span><br>' + '      <input type="radio" name="minorsort" id="%id.minorsortdown" value="down"><span style="font-size:x-small;color:#555753;">%loc!Down!</span>' + "     </td>" + "    </tr></table>" + "   </td>" + '   <td style="vertical-align:top;padding-right:16px;">' + '    <table cellspacing="0" cellpadding="0"><tr>' + '     <td style="vertical-align:top;">' + '      <div style="%tbt.">%loc!Last Sort!</div>' + '      <select id="%id.lastsort" size="1" onfocus="%s.CmdGotFocus(this);"></select>' + "     </td><td>" + '      <input type="radio" name="lastsort" id="%id.lastsortup" value="up" checked><span style="font-size:x-small;color:#555753;">%loc!Up!</span><br>' + '      <input type="radio" name="lastsort" id="%id.lastsortdown" value="down"><span style="font-size:x-small;color:#555753;">%loc!Down!</span>' + "     </td>" + "    </tr></table>" + "   </td>" + "  </tr></table>" + " </div>",
        onclick: SocialCalc.SpreadsheetControlSortOnclick
    });
    this.editor.SettingsCallbacks.sort = {
        save: SocialCalc.SpreadsheetControlSortSave,
        load: SocialCalc.SpreadsheetControlSortLoad
    };
    this.tabnums.audit = this.tabs.length;
    this.tabs.push({
        name: "audit",
        text: "Audit",
        html: '<div id="%id.audittools" style="display:none;">' + ' <div style="%tbt.">&nbsp;</div>' + "</div>",
        view: "audit",
        onclick: function(s, t) {
            var SCLoc = SocialCalc.LocalizeString;
            var i, j;
            var str = '<table cellspacing="0" cellpadding="0" style="margin-bottom:10px;"><tr><td style="font-size:small;padding:6px;"><b>' + SCLoc("Audit Trail This Session") + ":</b><br><br>";
            var stack = s.sheet.changes.stack;
            var tos = s.sheet.changes.tos;
            for (i = 0; i < stack.length; i++) {
                if (i == tos + 1) str += '<br></td></tr><tr><td style="font-size:small;background-color:#EEE;padding:6px;">' + SCLoc("UNDONE STEPS") + ":<br>";
                for (j = 0; j < stack[i].command.length; j++) {
                    str += SocialCalc.special_chars(stack[i].command[j]) + "<br>";
                }
            }
            s.views.audit.element.innerHTML = str + "</td></tr></table>";
            SocialCalc.CmdGotFocus(true);
        },
        onclickFocus: true
    });
    this.views["audit"] = {
        name: "audit",
        divStyle: "border:1px solid black;overflow:auto;",
        html: "Audit Trail"
    };
    this.tabnums.comment = this.tabs.length;
    this.tabs.push({
        name: "comment",
        text: "Comment",
        html: '<div id="%id.commenttools" style="display:none;">' + '<table cellspacing="0" cellpadding="0"><tr><td>' + '<textarea id="%id.commenttext" style="font-size:small;height:32px;width:600px;overflow:auto;" onfocus="%s.CmdGotFocus(this);"></textarea>' + '</td><td style="vertical-align:top;">' + '&nbsp;<input type="button" value="%loc!Save!" onclick="%s.SpreadsheetControlCommentSet();" style="font-size:x-small;">' + "</td></tr></table>" + "</div>",
        view: "sheet",
        onclick: SocialCalc.SpreadsheetControlCommentOnclick,
        onunclick: SocialCalc.SpreadsheetControlCommentOnunclick
    });
    this.tabnums.names = this.tabs.length;
    this.tabs.push({
        name: "names",
        text: "Names",
        html: '<div id="%id.namestools" style="display:none;">' + '  <table cellspacing="0" cellpadding="0"><tr>' + '   <td style="vertical-align:top;padding-right:24px;">' + '    <div style="%tbt.">%loc!Existing Names!</div>' + '    <select id="%id.nameslist" size="1" onchange="%s.SpreadsheetControlNamesChangedName();" onfocus="%s.CmdGotFocus(this);"><option selected>[New]</option></select>' + "   </td>" + '   <td style="vertical-align:top;padding-right:6px;">' + '    <div style="%tbt.">%loc!Name!</div>' + '    <input type="text" id="%id.namesname" style="font-size:x-small;width:75px;" onfocus="%s.CmdGotFocus(this);">' + "   </td>" + '   <td style="vertical-align:top;padding-right:6px;">' + '    <div style="%tbt.">%loc!Description!</div>' + '    <input type="text" id="%id.namesdesc" style="font-size:x-small;width:150px;" onfocus="%s.CmdGotFocus(this);">' + "   </td>" + '   <td style="vertical-align:top;padding-right:6px;">' + '    <div style="%tbt.">%loc!Value!</div>' + '    <input type="text" id="%id.namesvalue" width="16" style="font-size:x-small;width:100px;" onfocus="%s.CmdGotFocus(this);">' + "   </td>" + '   <td style="vertical-align:top;padding-right:12px;width:100px;">' + '    <div style="%tbt.">%loc!Set Value To!</div>' + '    <input type="button" id="%id.namesrangeproposal" value="A1" onclick="%s.SpreadsheetControlNamesSetValue();" style="font-size:x-small;">' + "   </td>" + '   <td style="vertical-align:top;padding-right:6px;">' + '    <div style="%tbt.">&nbsp;</div>' + '    <input type="button" value="%loc!Save!" onclick="%s.SpreadsheetControlNamesSave();" style="font-size:x-small;">' + '    <input type="button" value="%loc!Delete!" onclick="%s.SpreadsheetControlNamesDelete()" style="font-size:x-small;">' + "   </td>" + "  </tr></table>" + "</div>",
        view: "sheet",
        onclick: SocialCalc.SpreadsheetControlNamesOnclick,
        onunclick: SocialCalc.SpreadsheetControlNamesOnunclick
    });
    this.tabnums.clipboard = this.tabs.length;
    this.tabs.push({
        name: "clipboard",
        text: "Clipboard",
        html: '<div id="%id.clipboardtools" style="display:none;">' + '  <table cellspacing="0" cellpadding="0"><tr>' + '   <td style="vertical-align:top;padding-right:24px;">' + '    <div style="%tbt.">' + "     &nbsp;" + "    </div>" + "   </td>" + "  </tr></table>" + "</div>",
        view: "clipboard",
        onclick: SocialCalc.SpreadsheetControlClipboardOnclick,
        onclickFocus: "clipboardtext"
    });
    this.views["clipboard"] = {
        name: "clipboard",
        divStyle: "overflow:auto;",
        html: ' <div style="font-size:x-small;padding:5px 0px 10px 0px;">' + "  <b>%loc!Display Clipboard in!:</b>" + '  <input type="radio" id="%id.clipboardformat-tab" name="%id.clipboardformat" checked onclick="%s.SpreadsheetControlClipboardFormat(\'tab\');"> %loc!Tab-delimited format! &nbsp;' + '  <input type="radio" id="%id.clipboardformat-csv" name="%id.clipboardformat" onclick="%s.SpreadsheetControlClipboardFormat(\'csv\');"> %loc!CSV format! &nbsp;' + '  <input type="radio" id="%id.clipboardformat-scsave" name="%id.clipboardformat" onclick="%s.SpreadsheetControlClipboardFormat(\'scsave\');"> %loc!SocialCalc-save format!' + " </div>" + ' <input type="button" value="%loc!Load SocialCalc Clipboard With This!" style="font-size:x-small;" onclick="%s.SpreadsheetControlClipboardLoad();">&nbsp; ' + ' <input type="button" value="%loc!Clear SocialCalc Clipboard!" style="font-size:x-small;" onclick="%s.SpreadsheetControlClipboardClear();">&nbsp; ' + " <br>" + ' <textarea id="%id.clipboardtext" style="font-size:small;height:350px;width:800px;overflow:auto;" onfocus="%s.CmdGotFocus(this);"></textarea>'
    };
    return;
};

SocialCalc.SpreadsheetControl.prototype.InitializeSpreadsheetControl = function(node, height, width, spacebelow) {
    return SocialCalc.InitializeSpreadsheetControl(this, node, height, width, spacebelow);
};

SocialCalc.SpreadsheetControl.prototype.DoOnResize = function() {
    return SocialCalc.DoOnResize(this);
};

SocialCalc.SpreadsheetControl.prototype.SizeSSDiv = function() {
    return SocialCalc.SizeSSDiv(this);
};

SocialCalc.SpreadsheetControl.prototype.ExecuteCommand = function(combostr, sstr) {
    return SocialCalc.SpreadsheetControlExecuteCommand(this, combostr, sstr);
};

SocialCalc.SpreadsheetControl.prototype.CreateSheetHTML = function() {
    return SocialCalc.SpreadsheetControlCreateSheetHTML(this);
};

SocialCalc.SpreadsheetControl.prototype.CreateSpreadsheetSave = function(otherparts) {
    return SocialCalc.SpreadsheetControlCreateSpreadsheetSave(this, otherparts);
};

SocialCalc.SpreadsheetControl.prototype.DecodeSpreadsheetSave = function(str) {
    return SocialCalc.SpreadsheetControlDecodeSpreadsheetSave(this, str);
};

SocialCalc.SpreadsheetControl.prototype.CreateCellHTML = function(coord) {
    return SocialCalc.SpreadsheetControlCreateCellHTML(this, coord);
};

SocialCalc.SpreadsheetControl.prototype.CreateCellHTMLSave = function(range) {
    return SocialCalc.SpreadsheetControlCreateCellHTMLSave(this, range);
};

SocialCalc.SpreadsheetControl.prototype.ParseSheetSave = function(str) {
    return this.sheet.ParseSheetSave(str);
};

SocialCalc.SpreadsheetControl.prototype.CreateSheetSave = function() {
    return this.sheet.CreateSheetSave();
};

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
    spreadsheet.spreadsheetDiv = document.createElement("div");
    spreadsheet.SizeSSDiv();
    for (child = node.firstChild; child != null; child = node.firstChild) {
        node.removeChild(child);
    }
    html = '<div><div style="' + spreadsheet.toolbarbackground + 'padding:12px 10px 10px 4px;height:40px;">';
    for (i = 0; i < tabs.length; i++) {
        html += tabs[i].html;
    }
    html += "</div>" + '<div style="' + spreadsheet.tabbackground + 'margin:0px 0px 8px 0px;">' + '<table cellpadding="0" cellspacing="0"><tr>';
    for (i = 0; i < tabs.length; i++) {
        html += '  <td id="%id.' + tabs[i].name + 'tab" style="' + (i == 0 ? spreadsheet.tabselectedCSS : spreadsheet.tabplainCSS) + '" onclick="%s.SetTab(this);">' + SCLoc(tabs[i].text) + "</td>";
    }
    html += " </tr></table></div></div>";
    spreadsheet.currentTab = 0;
    for (style in spreadsheet.tabreplacements) {
        html = html.replace(spreadsheet.tabreplacements[style].regex, spreadsheet.tabreplacements[style].replacement);
    }
    html = html.replace(/\%s\./g, "SocialCalc.");
    html = html.replace(/\%id\./g, spreadsheet.idPrefix);
    html = html.replace(/\%tbt\./g, spreadsheet.toolbartext);
    html = html.replace(/\%img\./g, spreadsheet.imagePrefix);
    html = SCLocSS(html);
    spreadsheet.spreadsheetDiv.innerHTML = html;
    node.appendChild(spreadsheet.spreadsheetDiv);
    spreadsheet.Buttons = {
        button_undo: {
            tooltip: "Undo",
            command: "undo"
        },
        button_redo: {
            tooltip: "Redo",
            command: "redo"
        },
        button_copy: {
            tooltip: "Copy",
            command: "copy"
        },
        button_cut: {
            tooltip: "Cut",
            command: "cut"
        },
        button_paste: {
            tooltip: "Paste",
            command: "paste"
        },
        button_pasteformats: {
            tooltip: "Paste Formats",
            command: "pasteformats"
        },
        button_lock: {
            tooltip: "Lock Cell",
            command: "lock"
        },
        button_unlock: {
            tooltip: "Unlock Cell",
            command: "unlock"
        },
        button_delete: {
            tooltip: "Delete Cell Contents",
            command: "delete"
        },
        button_filldown: {
            tooltip: "Fill Down",
            command: "filldown"
        },
        button_fillright: {
            tooltip: "Fill Right",
            command: "fillright"
        },
        button_movefrom: {
            tooltip: "Set/Clear Move From",
            command: "movefrom"
        },
        button_movepaste: {
            tooltip: "Move Paste",
            command: "movepaste"
        },
        button_moveinsert: {
            tooltip: "Move Insert",
            command: "moveinsert"
        },
        button_alignleft: {
            tooltip: "Align Left",
            command: "align-left"
        },
        button_aligncenter: {
            tooltip: "Align Center",
            command: "align-center"
        },
        button_alignright: {
            tooltip: "Align Right",
            command: "align-right"
        },
        button_borderon: {
            tooltip: "Borders On",
            command: "borderon"
        },
        button_borderoff: {
            tooltip: "Borders Off",
            command: "borderoff"
        },
        button_swapcolors: {
            tooltip: "Swap Colors",
            command: "swapcolors"
        },
        button_merge: {
            tooltip: "Merge/Unmerge Cells",
            command: "merge"
        },
        button_insertrow: {
            tooltip: "Insert Row Before",
            command: "insertrow"
        },
        button_insertcol: {
            tooltip: "Insert Column Before",
            command: "insertcol"
        },
        button_deleterow: {
            tooltip: "Delete Row",
            command: "deleterow"
        },
        button_deletecol: {
            tooltip: "Delete Column",
            command: "deletecol"
        },
        button_hiderow: {
            tooltip: "Hide Row",
            command: "hiderow"
        },
        button_hidecol: {
            tooltip: "Hide Column",
            command: "hidecol"
        },
        button_recalc: {
            tooltip: "Recalculate",
            command: "recalc"
        }
    };
    for (button in spreadsheet.Buttons) {
        bele = document.getElementById(spreadsheet.idPrefix + button);
        if (!bele) {
            alert("Button " + (spreadsheet.idPrefix + button) + " missing");
            continue;
        }
        bele.style.border = "1px solid " + scc.ISCButtonBorderNormal;
        SocialCalc.TooltipRegister(bele, SCLoc(spreadsheet.Buttons[button].tooltip), {}, spreadsheet.spreadsheetDiv);
        SocialCalc.ButtonRegister(spreadsheet.editor, bele, {
            normalstyle: "border:1px solid " + scc.ISCButtonBorderNormal + ";backgroundColor:" + scc.ISCButtonBorderNormal + ";",
            hoverstyle: "border:1px solid " + scc.ISCButtonBorderHover + ";backgroundColor:" + scc.ISCButtonBorderNormal + ";",
            downstyle: "border:1px solid " + scc.ISCButtonBorderDown + ";backgroundColor:" + scc.ISCButtonDownBackground + ";"
        }, {
            MouseDown: SocialCalc.DoButtonCmd,
            command: spreadsheet.Buttons[button].command
        });
    }
    spreadsheet.formulabarDiv = document.createElement("div");
    spreadsheet.formulabarDiv.style.height = spreadsheet.formulabarheight + "px";
    spreadsheet.formulabarDiv.innerHTML = '<input type="text" size="60" value="">&nbsp;';
    spreadsheet.spreadsheetDiv.appendChild(spreadsheet.formulabarDiv);
    var inputbox = new SocialCalc.InputBox(spreadsheet.formulabarDiv.firstChild, spreadsheet.editor);
    for (button in spreadsheet.formulabuttons) {
        bele = document.createElement("img");
        bele.id = spreadsheet.idPrefix + button;
        bele.src = (spreadsheet.formulabuttons[button].skipImagePrefix ? "" : spreadsheet.imagePrefix) + spreadsheet.formulabuttons[button].image;
        bele.style.verticalAlign = "middle";
        bele.style.border = "1px solid #FFF";
        bele.style.marginLeft = "4px";
        SocialCalc.TooltipRegister(bele, SCLoc(spreadsheet.formulabuttons[button].tooltip), {}, spreadsheet.spreadsheetDiv);
        SocialCalc.ButtonRegister(spreadsheet.editor, bele, {
            normalstyle: "border:1px solid #FFF;backgroundColor:#FFF;",
            hoverstyle: "border:1px solid #CCC;backgroundColor:#FFF;",
            downstyle: "border:1px solid #000;backgroundColor:#FFF;"
        }, {
            MouseDown: spreadsheet.formulabuttons[button].command,
            Disabled: function() {
                return spreadsheet.editor.ECellReadonly();
            }
        });
        spreadsheet.formulabarDiv.appendChild(bele);
    }
    var input = $("<input id='searchbarinput' value='' placeholder='Search sheet…'>");
    var searchBar = $("<span id='searchbar'></span>");
    searchBar.append("<div id='searchstatus'></div>");
    searchBar.append(input);
    for (button in spreadsheet.findbuttons) {
        bele = document.createElement("img");
        bele.id = spreadsheet.idPrefix + button;
        bele.src = spreadsheet.imagePrefix + spreadsheet.findbuttons[button].image;
        bele.style.verticalAlign = "middle";
        bele.style.border = "1px solid #FFF";
        SocialCalc.TooltipRegister(bele, SCLoc(spreadsheet.findbuttons[button].tooltip), {}, spreadsheet.formulabardiv);
        SocialCalc.ButtonRegister(spreadsheet.editor, bele, {
            normalstyle: "border:1px solid #FFF;backgroundColor:#FFF;",
            hoverstyle: "border:1px solid #CCC;backgroundColor:#FFF;",
            downstyle: "border:1px solid #000;backgroundColor:#FFF;"
        }, {
            MouseDown: spreadsheet.findbuttons[button].command,
            Disabled: function() {
                return false;
            }
        });
        searchBar[0].appendChild(bele);
    }
    input.on("input", SocialCalc.SpreadsheetControl.FindInSheet);
    input.on("focus", function() {
        SocialCalc.Keyboard.passThru = true;
    });
    input.on("blur", function() {
        SocialCalc.Keyboard.passThru = false;
    });
    input.keyup(function(e) {
        if (e.keyCode == 13) {
            SocialCalc.SpreadsheetControl.SearchDown();
        }
    });
    spreadsheet.formulabarDiv.appendChild(searchBar[0]);
    for (i = 0; i < tabs.length; i++) {
        if (tabs[i].oncreate) {
            tabs[i].oncreate(spreadsheet, tabs[i].name);
        }
    }
    spreadsheet.nonviewheight = spreadsheet.statuslineheight + spreadsheet.spreadsheetDiv.firstChild.offsetHeight + spreadsheet.spreadsheetDiv.lastChild.offsetHeight;
    spreadsheet.viewheight = spreadsheet.height - spreadsheet.nonviewheight;
    spreadsheet.editorDiv = spreadsheet.editor.CreateTableEditor(spreadsheet.width, spreadsheet.viewheight);
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
        html = SCLocSS(html);
        v.innerHTML = html;
        spreadsheet.spreadsheetDiv.appendChild(v);
        views[vname].element = v;
        if (views[vname].oncreate) {
            views[vname].oncreate(spreadsheet, views[vname]);
        }
    }
    views.sheet = {
        name: "sheet",
        element: spreadsheet.editorDiv
    };
    spreadsheet.statuslineDiv = document.createElement("div");
    spreadsheet.statuslineDiv.style.cssText = spreadsheet.statuslineCSS;
    spreadsheet.statuslineDiv.style.height = spreadsheet.statuslineheight - (spreadsheet.statuslineDiv.style.paddingTop.slice(0, -2) - 0) - (spreadsheet.statuslineDiv.style.paddingBottom.slice(0, -2) - 0) + "px";
    spreadsheet.statuslineDiv.id = spreadsheet.idPrefix + "statusline";
    spreadsheet.spreadsheetDiv.appendChild(spreadsheet.statuslineDiv);
    if (spreadsheet.spreadsheetDiv.addEventListener) {
        spreadsheet.spreadsheetDiv.addEventListener("mousedown", function() {
            SocialCalc.SetSpreadsheetControlObject(spreadsheet);
        }, false);
        spreadsheet.spreadsheetDiv.addEventListener("mouseover", function() {
            SocialCalc.SetSpreadsheetControlObject(spreadsheet);
        }, false);
    } else if (spreadsheet.spreadsheetDiv.attachEvent) {
        spreadsheet.spreadsheetDiv.attachEvent("onmousedown", function() {
            SocialCalc.SetSpreadsheetControlObject(spreadsheet);
        });
        spreadsheet.spreadsheetDiv.attachEvent("onmouseover", function() {
            SocialCalc.SetSpreadsheetControlObject(spreadsheet);
        });
    } else {
        throw SocialCalc.Constants.s_BrowserNotSupported;
    }
    return;
};

SocialCalc.LocalizeString = function(str) {
    var cstr = SocialCalc.LocalizeStringList[str];
    if (!cstr) {
        cstr = SocialCalc.Constants["s_loc_" + str.toLowerCase().replace(/\s/g, "_").replace(/\W/g, "X")] || str;
        SocialCalc.LocalizeStringList[str] = cstr;
    }
    return cstr;
};

SocialCalc.LocalizeStringList = {};

SocialCalc.LocalizeSubstrings = function(str) {
    var SCLoc = SocialCalc.LocalizeString;
    return str.replace(/%(loc|ssc)!(.*?)!/g, function(a, t, c) {
        if (t == "ssc") {
            return SocialCalc.Constants[c] || alert("Missing constant: " + c);
        } else {
            return SCLoc(c);
        }
    });
};

SocialCalc.GetSpreadsheetControlObject = function() {
    var csco = SocialCalc.CurrentSpreadsheetControlObject;
    if (csco) return csco;
};

SocialCalc.SetSpreadsheetControlObject = function(spreadsheet) {
    SocialCalc.CurrentSpreadsheetControlObject = spreadsheet;
    if (SocialCalc.Keyboard.focusTable && spreadsheet) {
        SocialCalc.Keyboard.focusTable = spreadsheet.editor;
    }
};

SocialCalc.DoOnResize = function(spreadsheet) {
    var v;
    var views = spreadsheet.views;
    var needresize = spreadsheet.SizeSSDiv();
    if (!needresize) return;
    for (vname in views) {
        v = views[vname].element;
        v.style.width = spreadsheet.width + "px";
        v.style.height = spreadsheet.height - spreadsheet.nonviewheight + "px";
    }
    spreadsheet.editor.ResizeTableEditor(spreadsheet.width, spreadsheet.height - spreadsheet.nonviewheight);
};

SocialCalc.SizeSSDiv = function(spreadsheet) {
    var sizes, pos, resized, nodestyle, newval;
    var fudgefactorX = 10;
    var fudgefactorY = 10;
    resized = false;
    sizes = SocialCalc.GetViewportInfo();
    pos = SocialCalc.GetElementPosition(spreadsheet.parentNode);
    pos.bottom = 0;
    pos.right = 0;
    nodestyle = spreadsheet.parentNode.style;
    if (nodestyle.marginTop) {
        pos.top += nodestyle.marginTop.slice(0, -2) - 0;
    }
    if (nodestyle.marginBottom) {
        pos.bottom += nodestyle.marginBottom.slice(0, -2) - 0;
    }
    if (nodestyle.marginLeft) {
        pos.left += nodestyle.marginLeft.slice(0, -2) - 0;
    }
    if (nodestyle.marginRight) {
        pos.right += nodestyle.marginRight.slice(0, -2) - 0;
    }
    newval = spreadsheet.requestedHeight || sizes.height - (pos.top + pos.bottom + fudgefactorY) - (spreadsheet.requestedSpaceBelow || 0);
    if (spreadsheet.height != newval) {
        spreadsheet.height = newval;
        spreadsheet.spreadsheetDiv.style.height = newval + "px";
        resized = true;
    }
    newval = spreadsheet.requestedWidth || sizes.width - (pos.left + pos.right + fudgefactorX) || 700;
    if (spreadsheet.width != newval) {
        spreadsheet.width = newval;
        spreadsheet.spreadsheetDiv.style.width = newval + "px";
        resized = true;
    }
    spreadsheet.spreadsheetDiv.style.position = "relative";
    return resized;
};

SocialCalc.SetTab = function(obj) {
    var newtab, tname, newtabnum, newview, i, vname, ele;
    var menutabs = {};
    var tools = {};
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var tabs = spreadsheet.tabs;
    var views = spreadsheet.views;
    if (typeof obj == "string") {
        newtab = obj;
    } else {
        newtab = obj.id.slice(spreadsheet.idPrefix.length, -3);
    }
    if (spreadsheet.editor.busy && (!tabs[spreadsheet.currentTab].view || tabs[spreadsheet.currentTab].view == "sheet")) {
        for (i = 0; i < tabs.length; i++) {
            if (tabs[i].name == newtab && (tabs[i].view && tabs[i].view != "sheet")) {
                return;
            }
        }
    }
    if (spreadsheet.tabs[spreadsheet.currentTab].onunclick) {
        spreadsheet.tabs[spreadsheet.currentTab].onunclick(spreadsheet, spreadsheet.tabs[spreadsheet.currentTab].name);
    }
    for (i = 0; i < tabs.length; i++) {
        tname = tabs[i].name;
        menutabs[tname] = document.getElementById(spreadsheet.idPrefix + tname + "tab");
        tools[tname] = document.getElementById(spreadsheet.idPrefix + tname + "tools");
        if (tname == newtab) {
            newtabnum = i;
            tools[tname].style.display = "block";
            menutabs[tname].style.cssText = spreadsheet.tabselectedCSS;
        } else {
            tools[tname].style.display = "none";
            menutabs[tname].style.cssText = spreadsheet.tabplainCSS;
        }
    }
    spreadsheet.currentTab = newtabnum;
    if (tabs[newtabnum].onclick) {
        tabs[newtabnum].onclick(spreadsheet, newtab);
    }
    for (vname in views) {
        if (!tabs[newtabnum].view && vname == "sheet" || tabs[newtabnum].view == vname) {
            views[vname].element.style.display = "block";
            newview = vname;
        } else {
            views[vname].element.style.display = "none";
        }
    }
    if (tabs[newtabnum].onclickFocus) {
        ele = tabs[newtabnum].onclickFocus;
        if (typeof ele == "string") {
            ele = document.getElementById(spreadsheet.idPrefix + ele);
            ele.focus();
        }
        SocialCalc.CmdGotFocus(ele);
    } else {
        SocialCalc.KeyboardFocus();
    }
    if (views[newview].needsresize && views[newview].onresize) {
        views[newview].needsresize = false;
        views[newview].onresize(spreadsheet, views[newview]);
    }
    if (newview == "sheet") {
        spreadsheet.statuslineDiv.style.display = "block";
        spreadsheet.editor.ScheduleRender();
    } else {
        spreadsheet.statuslineDiv.style.display = "none";
    }
    return;
};

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
        if (editor.context.sheetobj.attribs.needsrecalc == "yes") {
            rele1.style.display = "inline";
            rele2.style.display = "inline";
        } else {
            rele1.style.display = "none";
            rele2.style.display = "none";
        }
        break;

      default:
        break;
    }
};

SocialCalc.UpdateSortRangeProposal = function(editor) {
    var ele = document.getElementById(SocialCalc.GetSpreadsheetControlObject().idPrefix + "sortlist");
    if (editor.range.hasrange) {
        ele.options[0].text = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
    } else {
        ele.options[0].text = SocialCalc.LocalizeString("[select range]");
    }
};

SocialCalc.LoadColumnChoosers = function(spreadsheet) {
    var SCLoc = SocialCalc.LocalizeString;
    var sortrange, nrange, rparts, col, colname, sele, oldindex;
    if (spreadsheet.sortrange && spreadsheet.sortrange.indexOf(":") == -1) {
        nrange = SocialCalc.Formula.LookupName(spreadsheet.sheet, spreadsheet.sortrange || "");
        if (nrange.type == "range") {
            rparts = nrange.value.match(/^(.*)\|(.*)\|$/);
            sortrange = rparts[1] + ":" + rparts[2];
        } else {
            sortrange = "A1:A1";
        }
    } else {
        sortrange = spreadsheet.sortrange;
    }
    var range = SocialCalc.ParseRange(sortrange);
    sele = document.getElementById(spreadsheet.idPrefix + "majorsort");
    oldindex = sele.selectedIndex;
    sele.options.length = 0;
    sele.options[sele.options.length] = new Option(SCLoc("[None]"), "");
    for (var col = range.cr1.col; col <= range.cr2.col; col++) {
        colname = SocialCalc.rcColname(col);
        sele.options[sele.options.length] = new Option(SCLoc("Column ") + colname, colname);
    }
    sele.selectedIndex = oldindex > 1 && oldindex <= range.cr2.col - range.cr1.col + 1 ? oldindex : 1;
    sele = document.getElementById(spreadsheet.idPrefix + "minorsort");
    oldindex = sele.selectedIndex;
    sele.options.length = 0;
    sele.options[sele.options.length] = new Option(SCLoc("[None]"), "");
    for (var col = range.cr1.col; col <= range.cr2.col; col++) {
        colname = SocialCalc.rcColname(col);
        sele.options[sele.options.length] = new Option(colname, colname);
    }
    sele.selectedIndex = oldindex > 0 && oldindex <= range.cr2.col - range.cr1.col + 1 ? oldindex : 0;
    sele = document.getElementById(spreadsheet.idPrefix + "lastsort");
    oldindex = sele.selectedIndex;
    sele.options.length = 0;
    sele.options[sele.options.length] = new Option(SCLoc("[None]"), "");
    for (var col = range.cr1.col; col <= range.cr2.col; col++) {
        colname = SocialCalc.rcColname(col);
        sele.options[sele.options.length] = new Option(colname, colname);
    }
    sele.selectedIndex = oldindex > 0 && oldindex <= range.cr2.col - range.cr1.col + 1 ? oldindex : 0;
};

SocialCalc.CmdGotFocus = function(obj) {
    SocialCalc.Keyboard.passThru = obj;
};

SocialCalc.DoButtonCmd = function(e, buttoninfo, bobj) {
    SocialCalc.DoCmd(bobj.element, bobj.functionobj.command);
};

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
        clele = document.getElementById(spreadsheet.idPrefix + cl + "list");
        clele.length = 0;
        for (i = 0; i < SocialCalc.SpreadsheetCmdTable[cl].length; i++) {
            clele.options[i] = new Option(SocialCalc.SpreadsheetCmdTable[cl][i].t);
        }
        which = "changed-" + cl;

      case "changed-rowcolstuff":
      case "changed-text":
        cl = which.substring(8);
        clele = document.getElementById(spreadsheet.idPrefix + cl + "list");
        slist = SocialCalc.SpreadsheetCmdTable.slists[SocialCalc.SpreadsheetCmdTable[cl][clele.selectedIndex].s];
        slistele = document.getElementById(spreadsheet.idPrefix + cl + "slist");
        slistele.length = 0;
        for (i = 0; i < (slist.length || 0); i++) {
            slistele.options[i] = new Option(slist[i].t, slist[i].s);
        }
        return;

      case "ok-rowcolstuff":
      case "ok-text":
        cl = which.substring(3);
        clele = document.getElementById(spreadsheet.idPrefix + cl + "list");
        slistele = document.getElementById(spreadsheet.idPrefix + cl + "slist");
        combostr = SocialCalc.SpreadsheetCmdTable[cl][clele.selectedIndex].c;
        sstr = slistele[slistele.selectedIndex].value;
        SocialCalc.SpreadsheetControlExecuteCommand(obj, combostr, sstr);
        break;

      case "ok-setsort":
        lele = document.getElementById(spreadsheet.idPrefix + "sortlist");
        if (lele.selectedIndex == 0) {
            if (editor.range.hasrange) {
                spreadsheet.sortrange = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
            } else {
                spreadsheet.sortrange = editor.ecell.coord + ":" + editor.ecell.coord;
            }
        } else {
            spreadsheet.sortrange = lele.options[lele.selectedIndex].value;
        }
        ele = document.getElementById(spreadsheet.idPrefix + "sortbutton");
        ele.value = SocialCalc.LocalizeString("Sort ") + spreadsheet.sortrange;
        ele.style.visibility = "visible";
        SocialCalc.LoadColumnChoosers(spreadsheet);
        if (obj && obj.blur) obj.blur();
        SocialCalc.KeyboardFocus();
        return;

      case "dosort":
        if (spreadsheet.sortrange && spreadsheet.sortrange.indexOf(":") == -1) {
            nrange = SocialCalc.Formula.LookupName(spreadsheet.sheet, spreadsheet.sortrange || "");
            if (nrange.type != "range") return;
            rparts = nrange.value.match(/^(.*)\|(.*)\|$/);
            sortrange = rparts[1] + ":" + rparts[2];
        } else {
            sortrange = spreadsheet.sortrange;
        }
        if (sortrange == "A1:A1") return;
        str = "sort " + sortrange + " ";
        sele = document.getElementById(spreadsheet.idPrefix + "majorsort");
        rele = document.getElementById(spreadsheet.idPrefix + "majorsortup");
        str += sele.options[sele.selectedIndex].value + (rele.checked ? " up" : " down");
        sele = document.getElementById(spreadsheet.idPrefix + "minorsort");
        if (sele.selectedIndex > 0) {
            rele = document.getElementById(spreadsheet.idPrefix + "minorsortup");
            str += " " + sele.options[sele.selectedIndex].value + (rele.checked ? " up" : " down");
        }
        sele = document.getElementById(spreadsheet.idPrefix + "lastsort");
        if (sele.selectedIndex > 0) {
            rele = document.getElementById(spreadsheet.idPrefix + "lastsortup");
            str += " " + sele.options[sele.selectedIndex].value + (rele.checked ? " up" : " down");
        }
        spreadsheet.ExecuteCommand(str, "");
        break;

      case "merge":
        combostr = SocialCalc.SpreadsheetCmdLookup[which] || "";
        sstr = SocialCalc.SpreadsheetCmdSLookup[which] || "";
        spreadsheet.ExecuteCommand(combostr, sstr);
        if (editor.range.hasrange) {
            editor.MoveECell(SocialCalc.crToCoord(editor.range.left, editor.range.top));
            editor.RangeRemove();
        }
        break;

      case "movefrom":
        if (editor.range2.hasrange) {
            spreadsheet.context.cursorsuffix = "";
            editor.Range2Remove();
            spreadsheet.ExecuteCommand("redisplay", "");
        } else if (editor.range.hasrange) {
            editor.range2.top = editor.range.top;
            editor.range2.right = editor.range.right;
            editor.range2.bottom = editor.range.bottom;
            editor.range2.left = editor.range.left;
            editor.range2.hasrange = true;
            editor.MoveECell(SocialCalc.crToCoord(editor.range.left, editor.range.top));
        } else {
            editor.range2.top = editor.ecell.row;
            editor.range2.right = editor.ecell.col;
            editor.range2.bottom = editor.ecell.row;
            editor.range2.left = editor.ecell.col;
            editor.range2.hasrange = true;
        }
        str = editor.range2.hasrange ? "" : "off";
        ele = document.getElementById(spreadsheet.idPrefix + "button_movefrom");
        ele.src = spreadsheet.imagePrefix + "movefrom" + str + ".gif";
        ele = document.getElementById(spreadsheet.idPrefix + "button_movepaste");
        ele.src = spreadsheet.imagePrefix + "movepaste" + str + ".gif";
        ele = document.getElementById(spreadsheet.idPrefix + "button_moveinsert");
        ele.src = spreadsheet.imagePrefix + "moveinsert" + str + ".gif";
        if (editor.range2.hasrange) editor.RangeRemove();
        break;

      case "movepaste":
      case "moveinsert":
        if (editor.range2.hasrange) {
            spreadsheet.context.cursorsuffix = "";
            combostr = which + " " + SocialCalc.crToCoord(editor.range2.left, editor.range2.top) + ":" + SocialCalc.crToCoord(editor.range2.right, editor.range2.bottom) + " " + editor.ecell.coord;
            spreadsheet.ExecuteCommand(combostr, "");
            editor.Range2Remove();
            ele = document.getElementById(spreadsheet.idPrefix + "button_movefrom");
            ele.src = spreadsheet.imagePrefix + "movefromoff.gif";
            ele = document.getElementById(spreadsheet.idPrefix + "button_movepaste");
            ele.src = spreadsheet.imagePrefix + "movepasteoff.gif";
            ele = document.getElementById(spreadsheet.idPrefix + "button_moveinsert");
            ele.src = spreadsheet.imagePrefix + "moveinsertoff.gif";
        }
        break;

      case "swapcolors":
        sheet = spreadsheet.sheet;
        cell = sheet.GetAssuredCell(editor.ecell.coord);
        defaultcolor = sheet.attribs.defaultcolor ? sheet.colors[sheet.attribs.defaultcolor] : "rgb(0,0,0)";
        defaultbgcolor = sheet.attribs.defaultbgcolor ? sheet.colors[sheet.attribs.defaultbgcolor] : "rgb(255,255,255)";
        color = cell.color ? sheet.colors[cell.color] : defaultcolor;
        if (color == defaultbgcolor) color = "";
        bgcolor = cell.bgcolor ? sheet.colors[cell.bgcolor] : defaultbgcolor;
        if (bgcolor == defaultcolor) bgcolor = "";
        spreadsheet.ExecuteCommand("set %C color " + bgcolor + "%Nset %C bgcolor " + color, "");
        break;

      default:
        combostr = SocialCalc.SpreadsheetCmdLookup[which] || "";
        sstr = SocialCalc.SpreadsheetCmdSLookup[which] || "";
        spreadsheet.ExecuteCommand(combostr, sstr);
        break;
    }
    if (obj && obj.blur) obj.blur();
    SocialCalc.KeyboardFocus();
};

SocialCalc.SpreadsheetCmdLookup = {
    copy: "copy %C all",
    cut: "cut %C all",
    paste: "paste %C all",
    pasteformats: "paste %C formats",
    lock: "set %C readonly yes",
    unlock: "set %C readonly no",
    "delete": "erase %C formulas",
    filldown: "filldown %C all",
    fillright: "fillright %C all",
    erase: "erase %C all",
    borderon: "set %C bt %S%Nset %C br %S%Nset %C bb %S%Nset %C bl %S",
    borderoff: "set %C bt %S%Nset %C br %S%Nset %C bb %S%Nset %C bl %S",
    merge: "merge %C",
    unmerge: "unmerge %C",
    "align-left": "set %C cellformat left",
    "align-center": "set %C cellformat center",
    "align-right": "set %C cellformat right",
    "align-default": "set %C cellformat",
    insertrow: "insertrow %C",
    insertcol: "insertcol %C",
    deleterow: "deleterow %C",
    deletecol: "deletecol %C",
    hiderow: "set %H hide yes",
    hidecol: "set %W hide yes",
    undo: "undo",
    redo: "redo",
    recalc: "recalc"
};

SocialCalc.SpreadsheetCmdSLookup = {
    borderon: "1px solid rgb(0,0,0)",
    borderoff: ""
};

SocialCalc.SpreadsheetControlExecuteCommand = function(obj, combostr, sstr) {
    var i, commands;
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var eobj = spreadsheet.editor;
    var str = {};
    str.P = "%";
    str.N = "\n";
    if (eobj.range.hasrange) {
        str.R = SocialCalc.crToCoord(eobj.range.left, eobj.range.top) + ":" + SocialCalc.crToCoord(eobj.range.right, eobj.range.bottom);
        str.C = str.R;
        str.W = SocialCalc.rcColname(eobj.range.left) + ":" + SocialCalc.rcColname(eobj.range.right);
        str.H = eobj.range.top + ":" + eobj.range.bottom;
    } else if (eobj.ecell) {
        str.C = eobj.ecell.coord;
        str.R = eobj.ecell.coord + ":" + eobj.ecell.coord;
        str.W = SocialCalc.rcColname(SocialCalc.coordToCr(eobj.ecell.coord).col);
        str.H = SocialCalc.coordToCr(eobj.ecell.coord).row;
    } else {
        str.C = "A1";
        str.R = "A1:A1";
        str.W = SocialCalc.rcColname(SocialCalc.coordToCr("A1").col);
        str.H = SocialCalc.coordToCr("A1").row;
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
};

SocialCalc.SpreadsheetControlCreateSheetHTML = function(spreadsheet) {
    var context, div, ele;
    var result = "";
    context = new SocialCalc.RenderContext(spreadsheet.sheet);
    div = document.createElement("div");
    ele = context.RenderSheet(null, {
        type: "html"
    });
    div.appendChild(ele);
    delete context;
    result = div.innerHTML;
    delete ele;
    delete div;
    return result;
};

SocialCalc.SpreadsheetControlCreateCellHTML = function(spreadsheet, coord, linkstyle) {
    var result = "";
    var cell = spreadsheet.sheet.cells[coord];
    if (!cell) return "";
    if (cell.displaystring == undefined) {
        result = SocialCalc.FormatValueForDisplay(spreadsheet.sheet, cell.datavalue, coord, linkstyle || spreadsheet.context.defaultHTMLlinkstyle);
    } else {
        result = cell.displaystring;
    }
    if (result == "&nbsp;") result = "";
    return result;
};

SocialCalc.SpreadsheetControlCreateCellHTMLSave = function(spreadsheet, range, linkstyle) {
    var cr1, cr2, row, col, coord, cell, cellHTML;
    var result = [];
    var prange;
    if (range) {
        prange = SocialCalc.ParseRange(range);
    } else {
        prange = {
            cr1: {
                row: 1,
                col: 1
            },
            cr2: {
                row: spreadsheet.sheet.attribs.lastrow,
                col: spreadsheet.sheet.attribs.lastcol
            }
        };
    }
    cr1 = prange.cr1;
    cr2 = prange.cr2;
    result.push("version:1.0");
    for (row = cr1.row; row <= cr2.row; row++) {
        for (col = cr1.col; col <= cr2.col; col++) {
            coord = SocialCalc.crToCoord(col, row);
            cell = spreadsheet.sheet.cells[coord];
            if (!cell) continue;
            if (cell.displaystring == undefined) {
                cellHTML = SocialCalc.FormatValueForDisplay(spreadsheet.sheet, cell.datavalue, coord, linkstyle || spreadsheet.context.defaultHTMLlinkstyle);
            } else {
                cellHTML = cell.displaystring;
            }
            if (cellHTML == "&nbsp;") continue;
            result.push(coord + ":" + SocialCalc.encodeForSave(cellHTML));
        }
    }
    result.push("");
    return result.join("\n");
};

SocialCalc.SpreadsheetControl.DoFunctionList = function() {
    var i, cname, str, f, ele;
    var scf = SocialCalc.Formula;
    var scc = SocialCalc.Constants;
    var fcl = scc.function_classlist;
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var idp = spreadsheet.idPrefix + "function";
    ele = document.getElementById(idp + "dialog");
    if (ele) return;
    scf.FillFunctionInfo();
    str = '<table><tr><td><span style="font-size:x-small;font-weight:bold">%loc!Category!</span><br>' + '<select id="' + idp + 'class" size="' + fcl.length + '" style="width:120px;" onchange="SocialCalc.SpreadsheetControl.FunctionClassChosen(this.options[this.selectedIndex].value);">';
    for (i = 0; i < fcl.length; i++) {
        str += '<option value="' + fcl[i] + '"' + (i == 0 ? " selected>" : ">") + SocialCalc.special_chars(scf.FunctionClasses[fcl[i]].name) + "</option>";
    }
    str += '</select></td><td>&nbsp;&nbsp;</td><td id="' + idp + 'list"><span style="font-size:x-small;font-weight:bold">%loc!Functions!</span><br>' + '<select id="' + idp + 'name" size="' + fcl.length + '" style="width:240px;" ' + 'onchange="SocialCalc.SpreadsheetControl.FunctionChosen(this.options[this.selectedIndex].value);" ondblclick="SocialCalc.SpreadsheetControl.DoFunctionPaste();">';
    str += SocialCalc.SpreadsheetControl.GetFunctionNamesStr("all");
    str += '</td></tr><tr><td colspan="3">' + '<div id="' + idp + 'desc" style="width:380px;height:80px;overflow:auto;font-size:x-small;">' + SocialCalc.SpreadsheetControl.GetFunctionInfoStr(scf.FunctionClasses[fcl[0]].items[0]) + "</div>" + '<div style="width:380px;text-align:right;padding-top:6px;font-size:small;">' + '<input type="button" value="%loc!Paste!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoFunctionPaste();">&nbsp;' + '<input type="button" value="%loc!Cancel!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.HideFunctions();"></div>' + "</td></tr></table>";
    var main = document.createElement("div");
    main.id = idp + "dialog";
    main.style.position = "absolute";
    var vp = SocialCalc.GetViewportInfo();
    var pos = SocialCalc.GetElementPositionWithScroll(spreadsheet.spreadsheetDiv);
    main.style.top = vp.height / 3 - pos.top + "px";
    main.style.left = vp.width / 3 - pos.left + "px";
    main.style.zIndex = 100;
    main.style.backgroundColor = "#FFF";
    main.style.border = "1px solid black";
    main.style.width = "400px";
    str = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr>' + '<td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">' + "&nbsp;%loc!Function List!" + "</td>" + '<td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.SpreadsheetControl.HideFunctions();">&nbsp;X&nbsp;</td></tr></table>' + '<div style="background-color:#DDD;">' + str + "</div>";
    str = SocialCalc.LocalizeSubstrings(str);
    main.innerHTML = str;
    SocialCalc.DragRegister(main.firstChild.firstChild.firstChild.firstChild, true, true, {
        MouseDown: SocialCalc.DragFunctionStart,
        MouseMove: SocialCalc.DragFunctionPosition,
        MouseUp: SocialCalc.DragFunctionPosition,
        Disabled: null,
        positionobj: main
    }, spreadsheet.spreadsheetDiv);
    spreadsheet.spreadsheetDiv.appendChild(main);
    ele = document.getElementById(idp + "name");
    ele.focus();
    SocialCalc.CmdGotFocus(ele);
};

SocialCalc.SpreadsheetControl.GetFunctionNamesStr = function(cname) {
    var i, f;
    var scf = SocialCalc.Formula;
    var str = "";
    f = scf.FunctionClasses[cname];
    for (i = 0; i < f.items.length; i++) {
        str += '<option value="' + f.items[i] + '"' + (i == 0 ? " selected>" : ">") + f.items[i] + "</option>";
    }
    return str;
};

SocialCalc.SpreadsheetControl.FillFunctionNames = function(cname, ele) {
    var i, f;
    var scf = SocialCalc.Formula;
    ele.length = 0;
    f = scf.FunctionClasses[cname];
    for (i = 0; i < f.items.length; i++) {
        ele.options[i] = new Option(f.items[i], f.items[i]);
        if (i == 0) {
            ele.options[i].selected = true;
        }
    }
};

SocialCalc.SpreadsheetControl.GetFunctionInfoStr = function(fname) {
    var scf = SocialCalc.Formula;
    var f = scf.FunctionList[fname];
    var scsc = SocialCalc.special_chars;
    var str = "<b>" + fname + "(" + scsc(scf.FunctionArgString(fname)) + ")</b><br>";
    str += scsc(f[3]);
    return str;
};

SocialCalc.SpreadsheetControl.FunctionClassChosen = function(cname) {
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var idp = spreadsheet.idPrefix + "function";
    var scf = SocialCalc.Formula;
    SocialCalc.SpreadsheetControl.FillFunctionNames(cname, document.getElementById(idp + "name"));
    SocialCalc.SpreadsheetControl.FunctionChosen(scf.FunctionClasses[cname].items[0]);
};

SocialCalc.SpreadsheetControl.FunctionChosen = function(fname) {
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var idp = spreadsheet.idPrefix + "function";
    document.getElementById(idp + "desc").innerHTML = SocialCalc.SpreadsheetControl.GetFunctionInfoStr(fname);
};

SocialCalc.SpreadsheetControl.HideFunctions = function() {
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var ele = document.getElementById(spreadsheet.idPrefix + "functiondialog");
    ele.innerHTML = "";
    SocialCalc.DragUnregister(ele);
    SocialCalc.KeyboardFocus();
    if (ele.parentNode) {
        ele.parentNode.removeChild(ele);
    }
};

SocialCalc.SpreadsheetControl.DoFunctionPaste = function() {
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var editor = spreadsheet.editor;
    var ele = document.getElementById(spreadsheet.idPrefix + "functionname");
    var mele = document.getElementById(spreadsheet.idPrefix + "multilinetextarea");
    var text = ele.value + "(";
    SocialCalc.SpreadsheetControl.HideFunctions();
    if (mele) {
        mele.value += text;
        mele.focus();
        SocialCalc.CmdGotFocus(mele);
    } else {
        editor.EditorAddToInput(text, "=");
    }
};

SocialCalc.SpreadsheetControl.DoMultiline = function() {
    var SCLocSS = SocialCalc.LocalizeSubstrings;
    var str, ele, text;
    var scc = SocialCalc.Constants;
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var editor = spreadsheet.editor;
    var wval = editor.workingvalues;
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var idp = spreadsheet.idPrefix + "multiline";
    ele = document.getElementById(idp + "dialog");
    if (ele) return;
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
    str = '<textarea id="' + idp + 'textarea" style="width:380px;height:120px;margin:10px 0px 0px 6px;">' + text + "</textarea>" + '<div style="width:380px;text-align:right;padding:6px 0px 4px 6px;font-size:small;">' + SCLocSS('<input type="button" value="%loc!Set Cell Contents!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoMultilinePaste();">&nbsp;' + '<input type="button" value="%loc!Clear!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoMultilineClear();">&nbsp;' + '<input type="button" value="%loc!Cancel!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.HideMultiline();"></div>' + "</div>");
    var main = document.createElement("div");
    main.id = idp + "dialog";
    main.style.position = "absolute";
    var vp = SocialCalc.GetViewportInfo();
    var pos = SocialCalc.GetElementPositionWithScroll(spreadsheet.spreadsheetDiv);
    main.style.top = vp.height / 3 - pos.top + "px";
    main.style.left = vp.width / 3 - pos.left + "px";
    main.style.zIndex = 100;
    main.style.backgroundColor = "#FFF";
    main.style.border = "1px solid black";
    main.style.width = "400px";
    main.innerHTML = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr>' + '<td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">' + SCLocSS("&nbsp;%loc!Multi-line Input Box!") + "</td>" + '<td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.SpreadsheetControl.HideMultiline();">&nbsp;X&nbsp;</td></tr></table>' + '<div style="background-color:#DDD;">' + str + "</div>";
    SocialCalc.DragRegister(main.firstChild.firstChild.firstChild.firstChild, true, true, {
        MouseDown: SocialCalc.DragFunctionStart,
        MouseMove: SocialCalc.DragFunctionPosition,
        MouseUp: SocialCalc.DragFunctionPosition,
        Disabled: null,
        positionobj: main
    }, spreadsheet.spreadsheetDiv);
    spreadsheet.spreadsheetDiv.appendChild(main);
    ele = document.getElementById(idp + "textarea");
    ele.focus();
    SocialCalc.CmdGotFocus(ele);
};

SocialCalc.SpreadsheetControl.HideMultiline = function() {
    var scc = SocialCalc.Constants;
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var editor = spreadsheet.editor;
    var ele = document.getElementById(spreadsheet.idPrefix + "multilinedialog");
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
};

SocialCalc.SpreadsheetControl.DoMultilineClear = function() {
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var ele = document.getElementById(spreadsheet.idPrefix + "multilinetextarea");
    ele.value = "";
    ele.focus();
};

SocialCalc.SpreadsheetControl.DoMultilinePaste = function() {
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var editor = spreadsheet.editor;
    var wval = editor.workingvalues;
    var ele = document.getElementById(spreadsheet.idPrefix + "multilinetextarea");
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
};

SocialCalc.SpreadsheetControl.DoLink = function() {
    var SCLoc = SocialCalc.LocalizeString;
    var str, ele, text, cell, setformat, popup;
    var scc = SocialCalc.Constants;
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var editor = spreadsheet.editor;
    var wval = editor.workingvalues;
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var idp = spreadsheet.idPrefix + "link";
    ele = document.getElementById(idp + "dialog");
    if (ele) return;
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
    if (text.charAt(0) == "'") {
        text = text.slice(1);
    }
    var parts = SocialCalc.ParseCellLinkText(text);
    text = SocialCalc.special_chars(text);
    cell = spreadsheet.sheet.cells[editor.ecell.coord];
    if (!cell || !cell.textvalueformat) {
        setformat = " checked";
    } else {
        setformat = "";
    }
    popup = parts.newwin ? " checked" : "";
    str = '<div style="padding:6px 0px 4px 6px;">' + '<span style="font-size:smaller;">' + SCLoc("Description") + "</span><br>" + '<input type="text" id="' + idp + 'desc" style="width:380px;" value="' + SocialCalc.special_chars(parts.desc) + '"><br>' + '<span style="font-size:smaller;">' + SCLoc("URL") + "</span><br>" + '<input type="text" id="' + idp + 'url" style="width:380px;" value="' + SocialCalc.special_chars(parts.url) + '"><br>';
    if (SocialCalc.Callbacks.MakePageLink) {
        str += '<span style="font-size:smaller;">' + SCLoc("Page Name") + "</span><br>" + '<input type="text" id="' + idp + 'pagename" style="width:380px;" value="' + SocialCalc.special_chars(parts.pagename) + '"><br>' + '<span style="font-size:smaller;">' + SCLoc("Workspace") + "</span><br>" + '<input type="text" id="' + idp + 'workspace" style="width:380px;" value="' + SocialCalc.special_chars(parts.workspace) + '"><br>';
    }
    str += SocialCalc.LocalizeSubstrings('<input type="checkbox" id="' + idp + 'format"' + setformat + ">&nbsp;" + '<span style="font-size:smaller;">%loc!Set to Link format!</span><br>' + '<input type="checkbox" id="' + idp + 'popup"' + popup + ">&nbsp;" + '<span style="font-size:smaller;">%loc!Show in new browser window!</span>' + "</div>" + '<div style="width:380px;text-align:right;padding:6px 0px 4px 6px;font-size:small;">' + '<input type="button" value="%loc!Set Cell Contents!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoLinkPaste();">&nbsp;' + '<input type="button" value="%loc!Clear!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoLinkClear();">&nbsp;' + '<input type="button" value="%loc!Cancel!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.HideLink();"></div>' + "</div>");
    var main = document.createElement("div");
    main.id = idp + "dialog";
    main.style.position = "absolute";
    var vp = SocialCalc.GetViewportInfo();
    var pos = SocialCalc.GetElementPositionWithScroll(spreadsheet.spreadsheetDiv);
    main.style.top = vp.height / 3 - pos.top + "px";
    main.style.left = vp.width / 3 - pos.left + "px";
    main.style.zIndex = 100;
    main.style.backgroundColor = "#FFF";
    main.style.border = "1px solid black";
    main.style.width = "400px";
    main.innerHTML = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr>' + '<td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">' + "&nbsp;" + SCLoc("Link Input Box") + "</td>" + '<td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.SpreadsheetControl.HideLink();">&nbsp;X&nbsp;</td></tr></table>' + '<div style="background-color:#DDD;">' + str + "</div>";
    SocialCalc.DragRegister(main.firstChild.firstChild.firstChild.firstChild, true, true, {
        MouseDown: SocialCalc.DragFunctionStart,
        MouseMove: SocialCalc.DragFunctionPosition,
        MouseUp: SocialCalc.DragFunctionPosition,
        Disabled: null,
        positionobj: main
    }, spreadsheet.spreadsheetDiv);
    spreadsheet.spreadsheetDiv.appendChild(main);
    ele = document.getElementById(idp + "url");
    ele.focus();
    SocialCalc.CmdGotFocus(ele);
};

SocialCalc.SpreadsheetControl.HideLink = function() {
    var scc = SocialCalc.Constants;
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var editor = spreadsheet.editor;
    var ele = document.getElementById(spreadsheet.idPrefix + "linkdialog");
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
};

SocialCalc.SpreadsheetControl.DoLinkClear = function() {
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    document.getElementById(spreadsheet.idPrefix + "linkdesc").value = "";
    document.getElementById(spreadsheet.idPrefix + "linkpagename").value = "";
    document.getElementById(spreadsheet.idPrefix + "linkworkspace").value = "";
    var ele = document.getElementById(spreadsheet.idPrefix + "linkurl");
    ele.value = "";
    ele.focus();
};

SocialCalc.SpreadsheetControl.DoLinkPaste = function() {
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var editor = spreadsheet.editor;
    var wval = editor.workingvalues;
    var descele = document.getElementById(spreadsheet.idPrefix + "linkdesc");
    var urlele = document.getElementById(spreadsheet.idPrefix + "linkurl");
    var pagenameele = document.getElementById(spreadsheet.idPrefix + "linkpagename");
    var workspaceele = document.getElementById(spreadsheet.idPrefix + "linkworkspace");
    var formatele = document.getElementById(spreadsheet.idPrefix + "linkformat");
    var popupele = document.getElementById(spreadsheet.idPrefix + "linkpopup");
    var text = "";
    var ltsym, gtsym, obsym, cbsym;
    if (popupele.checked) {
        ltsym = "<<";
        gtsym = ">>";
        obsym = "[[";
        cbsym = "]]";
    } else {
        ltsym = "<";
        gtsym = ">";
        obsym = "[";
        cbsym = "]";
    }
    if (pagenameele && pagenameele.value) {
        if (workspaceele.value) {
            text = descele.value + "{" + workspaceele.value + obsym + pagenameele.value + cbsym + "}";
        } else {
            text = descele.value + obsym + pagenameele.value + cbsym;
        }
    } else {
        text = descele.value + ltsym + urlele.value + gtsym;
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
};

SocialCalc.SpreadsheetControl.DoSum = function() {
    var cmd, cell, row, col, sel, cr, foundvalue;
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var editor = spreadsheet.editor;
    var sheet = editor.context.sheetobj;
    if (editor.range.hasrange) {
        sel = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
        cmd = "set " + SocialCalc.crToCoord(editor.range.right, editor.range.bottom + 1) + " formula sum(" + sel + ")";
    } else {
        row = editor.ecell.row - 1;
        col = editor.ecell.col;
        if (row <= 1) {
            cmd = "set " + editor.ecell.coord + " constant e#REF! 0 #REF!";
        } else {
            foundvalue = false;
            while (row > 0) {
                cr = SocialCalc.crToCoord(col, row);
                cell = sheet.GetAssuredCell(cr);
                if (!cell.datatype || cell.datatype == "t") {
                    if (foundvalue) {
                        row++;
                        break;
                    }
                } else {
                    foundvalue = true;
                }
                row--;
            }
            cmd = "set " + editor.ecell.coord + " formula sum(" + SocialCalc.crToCoord(col, row) + ":" + SocialCalc.crToCoord(col, editor.ecell.row - 1) + ")";
        }
    }
    editor.EditorScheduleSheetCommands(cmd, true, false);
};

SocialCalc.SpreadsheetControl.FindInSheet = function() {
    var searchstatus = $("#searchstatus");
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    if (!this.value.length) {
        searchstatus.text("");
        spreadsheet.sheet.search_cells = [];
        spreadsheet.sheet.selected_search_cell = undefined;
        return;
    }
    var cells = spreadsheet.sheet.cells;
    var regex = new RegExp(this.value, "im");
    var cell, cellvalue;
    var search_cells = [];
    for (var cell_id in cells) {
        cell = cells[cell_id];
        var cr = SocialCalc.coordToCr(cell_id);
        if (spreadsheet.sheet.rowattribs.hide[cr.row] === "yes" || spreadsheet.sheet.colattribs.hide[SocialCalc.rcColname(cr.col)] === "yes") {
            continue;
        }
        if (cell.datatype === "c") {
            cellvalue = cell.displaystring;
        } else {
            cellvalue = String(cell.datavalue);
        }
        if (cellvalue !== undefined && cellvalue.match(regex)) {
            search_cells.push(cell_id);
        }
    }
    spreadsheet.sheet.search_cells = search_cells;
    if (search_cells.length) {
        spreadsheet.sheet.selected_search_cell = 0;
        spreadsheet.editor.MoveECell(search_cells[0]);
        searchstatus.text("1 of " + search_cells.length);
    } else {
        spreadsheet.sheet.selected_search_cell = undefined;
        searchstatus.text("No Matches");
    }
};

SocialCalc.SpreadsheetControl.SearchSheet = function(direction) {
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var sheet = spreadsheet.sheet;
    var cells = sheet.search_cells;
    if (!cells.length) {
        return;
    }
    var selected_cell = sheet.selected_search_cell;
    if (selected_cell === (direction === 0 ? 0 : cells.length - 1)) {
        selected_cell = direction === 0 ? cells.length - 1 : 0;
    } else {
        selected_cell += direction === 0 ? -1 : 1;
    }
    var new_cell = cells[selected_cell];
    sheet.selected_search_cell = selected_cell;
    spreadsheet.editor.MoveECell(new_cell);
    document.getElementById("searchstatus").textContent = String(selected_cell + 1) + " of " + cells.length;
};

SocialCalc.SpreadsheetControl.SearchUp = function() {
    SocialCalc.SpreadsheetControl.SearchSheet(0);
};

SocialCalc.SpreadsheetControl.SearchDown = function() {
    SocialCalc.SpreadsheetControl.SearchSheet(1);
};

SocialCalc.SpreadsheetControlSortOnclick = function(s, t) {
    var name, i;
    var namelist = [];
    var nl = document.getElementById(s.idPrefix + "sortlist");
    SocialCalc.LoadColumnChoosers(s);
    s.editor.RangeChangeCallback.sort = SocialCalc.UpdateSortRangeProposal;
    for (name in s.sheet.names) {
        namelist.push(name);
    }
    namelist.sort();
    nl.length = 0;
    nl.options[0] = new Option(SocialCalc.LocalizeString("[select range]"));
    for (i = 0; i < namelist.length; i++) {
        name = namelist[i];
        nl.options[i + 1] = new Option(name, name);
        if (name == s.sortrange) {
            nl.options[i + 1].selected = true;
        }
    }
    if (s.sortrange == "") {
        nl.options[0].selected = true;
    }
    SocialCalc.UpdateSortRangeProposal(s.editor);
    SocialCalc.KeyboardFocus();
    return;
};

SocialCalc.SpreadsheetControlSortSave = function(editor, setting) {
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    var str, sele, rele;
    str = "sort:" + SocialCalc.encodeForSave(spreadsheet.sortrange) + ":";
    sele = document.getElementById(spreadsheet.idPrefix + "majorsort");
    rele = document.getElementById(spreadsheet.idPrefix + "majorsortup");
    str += sele.selectedIndex + (rele.checked ? ":up" : ":down");
    sele = document.getElementById(spreadsheet.idPrefix + "minorsort");
    if (sele.selectedIndex > 0) {
        rele = document.getElementById(spreadsheet.idPrefix + "minorsortup");
        str += ":" + sele.selectedIndex + (rele.checked ? ":up" : ":down");
    } else {
        str += "::";
    }
    sele = document.getElementById(spreadsheet.idPrefix + "lastsort");
    if (sele.selectedIndex > 0) {
        rele = document.getElementById(spreadsheet.idPrefix + "lastsortup");
        str += ":" + sele.selectedIndex + (rele.checked ? ":up" : ":down");
    } else {
        str += "::";
    }
    return str + "\n";
};

SocialCalc.SpreadsheetControlSortLoad = function(editor, setting, line, flags) {
    var parts, ele;
    var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
    parts = line.split(":");
    spreadsheet.sortrange = SocialCalc.decodeFromSave(parts[1]);
    ele = document.getElementById(spreadsheet.idPrefix + "sortbutton");
    if (spreadsheet.sortrange) {
        ele.value = SocialCalc.LocalizeString("Sort ") + spreadsheet.sortrange;
        ele.style.visibility = "visible";
    } else {
        ele.style.visibility = "hidden";
    }
    SocialCalc.LoadColumnChoosers(spreadsheet);
    sele = document.getElementById(spreadsheet.idPrefix + "majorsort");
    sele.selectedIndex = parts[2] - 0;
    document.getElementById(spreadsheet.idPrefix + "majorsort" + parts[3]).checked = true;
    sele = document.getElementById(spreadsheet.idPrefix + "minorsort");
    if (parts[4]) {
        sele.selectedIndex = parts[4] - 0;
        document.getElementById(spreadsheet.idPrefix + "minorsort" + parts[5]).checked = true;
    } else {
        sele.selectedIndex = 0;
        document.getElementById(spreadsheet.idPrefix + "minorsortup").checked = true;
    }
    sele = document.getElementById(spreadsheet.idPrefix + "lastsort");
    if (parts[6]) {
        sele.selectedIndex = parts[6] - 0;
        document.getElementById(spreadsheet.idPrefix + "lastsort" + parts[7]).checked = true;
    } else {
        sele.selectedIndex = 0;
        document.getElementById(spreadsheet.idPrefix + "lastsortup").checked = true;
    }
    return true;
};

SocialCalc.SpreadsheetControlCommentOnclick = function(s, t) {
    s.editor.MoveECellCallback.comment = SocialCalc.SpreadsheetControlCommentMoveECell;
    SocialCalc.SpreadsheetControlCommentDisplay(s, t);
    SocialCalc.KeyboardFocus();
    return;
};

SocialCalc.SpreadsheetControlCommentDisplay = function(s, t) {
    var c = "";
    if (s.editor.ecell && s.editor.ecell.coord && s.sheet.cells[s.editor.ecell.coord]) {
        c = s.sheet.cells[s.editor.ecell.coord].comment || "";
    }
    document.getElementById(s.idPrefix + "commenttext").value = c;
};

SocialCalc.SpreadsheetControlCommentMoveECell = function(editor) {
    SocialCalc.SpreadsheetControlCommentDisplay(SocialCalc.GetSpreadsheetControlObject(), "comment");
};

SocialCalc.SpreadsheetControlCommentSet = function() {
    var s = SocialCalc.GetSpreadsheetControlObject();
    s.ExecuteCommand("set %C comment " + SocialCalc.encodeForSave(document.getElementById(s.idPrefix + "commenttext").value));
    var cell = SocialCalc.GetEditorCellElement(s.editor, s.editor.ecell.row, s.editor.ecell.col);
    if (!s.editor.ECellReadonly()) {
        cell.element.title = document.getElementById(s.idPrefix + "commenttext").value;
        s.editor.UpdateCellCSS(cell, s.editor.ecell.row, s.editor.ecell.col);
    }
    SocialCalc.KeyboardFocus();
};

SocialCalc.SpreadsheetControlCommentOnunclick = function(s, t) {
    delete s.editor.MoveECellCallback.comment;
};

SocialCalc.SpreadsheetControlNamesOnclick = function(s, t) {
    document.getElementById(s.idPrefix + "namesname").value = "";
    document.getElementById(s.idPrefix + "namesdesc").value = "";
    document.getElementById(s.idPrefix + "namesvalue").value = "";
    s.editor.RangeChangeCallback.names = SocialCalc.SpreadsheetControlNamesRangeChange;
    s.editor.MoveECellCallback.names = SocialCalc.SpreadsheetControlNamesRangeChange;
    SocialCalc.SpreadsheetControlNamesRangeChange(s.editor);
    SocialCalc.SpreadsheetControlNamesFillNameList();
    SocialCalc.SpreadsheetControlNamesChangedName();
};

SocialCalc.SpreadsheetControlNamesFillNameList = function() {
    var SCLoc = SocialCalc.LocalizeString;
    var name, i;
    var namelist = [];
    var s = SocialCalc.GetSpreadsheetControlObject();
    var nl = document.getElementById(s.idPrefix + "nameslist");
    var currentname = document.getElementById(s.idPrefix + "namesname").value.toUpperCase().replace(/[^A-Z0-9_\.]/g, "");
    for (name in s.sheet.names) {
        namelist.push(name);
    }
    namelist.sort();
    nl.length = 0;
    if (namelist.length > 0) {
        nl.options[0] = new Option(SCLoc("[New]"));
    } else {
        nl.options[0] = new Option(SCLoc("[None]"));
    }
    for (i = 0; i < namelist.length; i++) {
        name = namelist[i];
        nl.options[i + 1] = new Option(name, name);
        if (name == currentname) {
            nl.options[i + 1].selected = true;
        }
    }
    if (currentname == "") {
        nl.options[0].selected = true;
    }
};

SocialCalc.SpreadsheetControlNamesChangedName = function() {
    var s = SocialCalc.GetSpreadsheetControlObject();
    var nl = document.getElementById(s.idPrefix + "nameslist");
    var name = nl.options[nl.selectedIndex].value;
    if (s.sheet.names[name]) {
        document.getElementById(s.idPrefix + "namesname").value = name;
        document.getElementById(s.idPrefix + "namesdesc").value = s.sheet.names[name].desc || "";
        document.getElementById(s.idPrefix + "namesvalue").value = s.sheet.names[name].definition || "";
    } else {
        document.getElementById(s.idPrefix + "namesname").value = "";
        document.getElementById(s.idPrefix + "namesdesc").value = "";
        document.getElementById(s.idPrefix + "namesvalue").value = "";
    }
};

SocialCalc.SpreadsheetControlNamesRangeChange = function(editor) {
    var s = SocialCalc.GetSpreadsheetControlObject();
    var ele = document.getElementById(s.idPrefix + "namesrangeproposal");
    if (editor.range.hasrange) {
        ele.value = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
    } else {
        ele.value = editor.ecell.coord;
    }
};

SocialCalc.SpreadsheetControlNamesOnunclick = function(s, t) {
    delete s.editor.RangeChangeCallback.names;
    delete s.editor.MoveECellCallback.names;
};

SocialCalc.SpreadsheetControlNamesSetValue = function() {
    var s = SocialCalc.GetSpreadsheetControlObject();
    document.getElementById(s.idPrefix + "namesvalue").value = document.getElementById(s.idPrefix + "namesrangeproposal").value;
    SocialCalc.KeyboardFocus();
};

SocialCalc.SpreadsheetControlNamesSave = function() {
    var s = SocialCalc.GetSpreadsheetControlObject();
    var name = document.getElementById(s.idPrefix + "namesname").value;
    SocialCalc.SetTab(s.tabs[0].name);
    SocialCalc.KeyboardFocus();
    if (name != "") {
        s.ExecuteCommand("name define " + name + " " + document.getElementById(s.idPrefix + "namesvalue").value + "\n" + "name desc " + name + " " + document.getElementById(s.idPrefix + "namesdesc").value);
    }
};

SocialCalc.SpreadsheetControlNamesDelete = function() {
    var s = SocialCalc.GetSpreadsheetControlObject();
    var name = document.getElementById(s.idPrefix + "namesname").value;
    SocialCalc.SetTab(s.tabs[0].name);
    SocialCalc.KeyboardFocus();
    if (name != "") {
        s.ExecuteCommand("name delete " + name);
    }
    SocialCalc.KeyboardFocus();
};

SocialCalc.SpreadsheetControlClipboardOnclick = function(s, t) {
    var s = SocialCalc.GetSpreadsheetControlObject();
    clipele = document.getElementById(s.idPrefix + "clipboardtext");
    document.getElementById(s.idPrefix + "clipboardformat-tab").checked = true;
    clipele.value = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "tab");
    return;
};

SocialCalc.SpreadsheetControlClipboardFormat = function(which) {
    var s = SocialCalc.GetSpreadsheetControlObject();
    clipele = document.getElementById(s.idPrefix + "clipboardtext");
    clipele.value = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, which);
};

SocialCalc.SpreadsheetControlClipboardLoad = function() {
    var s = SocialCalc.GetSpreadsheetControlObject();
    var savetype = "tab";
    SocialCalc.SetTab(s.tabs[0].name);
    SocialCalc.KeyboardFocus();
    if (document.getElementById(s.idPrefix + "clipboardformat-csv").checked) {
        savetype = "csv";
    } else if (document.getElementById(s.idPrefix + "clipboardformat-scsave").checked) {
        savetype = "scsave";
    }
    s.editor.EditorScheduleSheetCommands("loadclipboard " + SocialCalc.encodeForSave(SocialCalc.ConvertOtherFormatToSave(document.getElementById(s.idPrefix + "clipboardtext").value, savetype)), true, false);
};

SocialCalc.SpreadsheetControlClipboardClear = function() {
    var s = SocialCalc.GetSpreadsheetControlObject();
    var clipele = document.getElementById(s.idPrefix + "clipboardtext");
    clipele.value = "";
    s.editor.EditorScheduleSheetCommands("clearclipboard", true, false);
    clipele.focus();
};

SocialCalc.SpreadsheetControlClipboardExport = function() {
    var s = SocialCalc.GetSpreadsheetControlObject();
    if (s.ExportCallback) {
        s.ExportCallback(s);
    }
    SocialCalc.SetTab(s.tabs[0].name);
    SocialCalc.KeyboardFocus();
};

SocialCalc.SpreadsheetControlSettingsSwitch = function(target) {
    SocialCalc.SettingControlReset();
    var s = SocialCalc.GetSpreadsheetControlObject();
    var sheettable = document.getElementById(s.idPrefix + "sheetsettingstable");
    var celltable = document.getElementById(s.idPrefix + "cellsettingstable");
    var sheettoolbar = document.getElementById(s.idPrefix + "sheetsettingstoolbar");
    var celltoolbar = document.getElementById(s.idPrefix + "cellsettingstoolbar");
    if (target == "sheet") {
        sheettable.style.display = "block";
        celltable.style.display = "none";
        sheettoolbar.style.display = "block";
        celltoolbar.style.display = "none";
        SocialCalc.SettingsControlSetCurrentPanel(s.views.settings.values.sheetspanel);
    } else {
        sheettable.style.display = "none";
        celltable.style.display = "block";
        sheettoolbar.style.display = "none";
        celltoolbar.style.display = "block";
        SocialCalc.SettingsControlSetCurrentPanel(s.views.settings.values.cellspanel);
    }
};

SocialCalc.SettingsControlSave = function(target) {
    var range, cmdstr;
    var s = SocialCalc.GetSpreadsheetControlObject();
    var sc = SocialCalc.SettingsControls;
    var panelobj = sc.CurrentPanel;
    var attribs = SocialCalc.SettingsControlUnloadPanel(panelobj);
    SocialCalc.SetTab(s.tabs[0].name);
    SocialCalc.KeyboardFocus();
    if (target == "sheet") {
        cmdstr = s.sheet.DecodeSheetAttributes(attribs);
    } else if (target == "cell") {
        if (s.editor.range.hasrange) {
            range = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top) + ":" + SocialCalc.crToCoord(s.editor.range.right, s.editor.range.bottom);
        }
        cmdstr = s.sheet.DecodeCellAttributes(s.editor.ecell.coord, attribs, range);
    } else {}
    if (cmdstr) {
        s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
    }
};

SocialCalc.SpreadsheetControlCreateSpreadsheetSave = function(spreadsheet, otherparts) {
    var result;
    var otherpartsstr = "";
    var otherpartsnames = "";
    var partname, extranl;
    if (otherparts) {
        for (partname in otherparts) {
            if (otherparts[partname].charAt(otherparts[partname] - 1) != "\n") {
                extranl = "\n";
            } else {
                extranl = "";
            }
            otherpartsstr += "--" + spreadsheet.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" + otherparts[partname] + extranl;
            otherpartsnames += "part:" + partname + "\n";
        }
    }
    result = "socialcalc:version:1.0\n" + "MIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=" + spreadsheet.multipartBoundary + "\n" + "--" + spreadsheet.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" + "# SocialCalc Spreadsheet Control Save\nversion:1.0\npart:sheet\npart:edit\npart:audit\n" + otherpartsnames + "--" + spreadsheet.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" + spreadsheet.CreateSheetSave() + "--" + spreadsheet.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" + spreadsheet.editor.SaveEditorSettings() + "--" + spreadsheet.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" + spreadsheet.sheet.CreateAuditString() + otherpartsstr + "--" + spreadsheet.multipartBoundary + "--\n";
    return result;
};

SocialCalc.SpreadsheetControlDecodeSpreadsheetSave = function(spreadsheet, str) {
    var pos1, mpregex, searchinfo, boundary, boundaryregex, blanklineregex, start, ending, lines, i, lines, p, pnun;
    var parts = {};
    var partlist = [];
    pos1 = str.search(/^MIME-Version:\s1\.0/im);
    if (pos1 < 0) return parts;
    mpregex = /^Content-Type:\s*multipart\/mixed;\s*boundary=(\S+)/gim;
    mpregex.lastIndex = pos1;
    searchinfo = mpregex.exec(str);
    if (mpregex.lastIndex <= 0) return parts;
    boundary = searchinfo[1];
    boundaryregex = new RegExp("^--" + boundary + "(?:\r\n|\n)", "mg");
    boundaryregex.lastIndex = mpregex.lastIndex;
    searchinfo = boundaryregex.exec(str);
    blanklineregex = /(?:\r\n|\n)(?:\r\n|\n)/gm;
    blanklineregex.lastIndex = boundaryregex.lastIndex;
    searchinfo = blanklineregex.exec(str);
    if (!searchinfo) return parts;
    start = blanklineregex.lastIndex;
    boundaryregex.lastIndex = start;
    searchinfo = boundaryregex.exec(str);
    if (!searchinfo) return parts;
    ending = searchinfo.index;
    lines = str.substring(start, ending).split(/\r\n|\n/);
    for (i = 0; i < lines.length; i++) {
        line = lines[i];
        p = line.split(":");
        switch (p[0]) {
          case "version":
            break;

          case "part":
            partlist.push(p[1]);
            break;
        }
    }
    for (pnum = 0; pnum < partlist.length; pnum++) {
        blanklineregex.lastIndex = ending;
        searchinfo = blanklineregex.exec(str);
        if (!searchinfo) return parts;
        start = blanklineregex.lastIndex;
        if (pnum == partlist.length - 1) {
            boundaryregex = new RegExp("^--" + boundary + "--$", "mg");
        }
        boundaryregex.lastIndex = start;
        searchinfo = boundaryregex.exec(str);
        if (!searchinfo) return parts;
        ending = searchinfo.index;
        parts[partlist[pnum]] = {
            start: start,
            end: ending
        };
    }
    return parts;
};

SocialCalc.SettingsControls = {
    Controls: {},
    CurrentPanel: null
};

SocialCalc.SettingsControlSetCurrentPanel = function(panelobj) {
    SocialCalc.SettingsControls.CurrentPanel = panelobj;
    SocialCalc.SettingsControls.PopupChangeCallback({
        panelobj: panelobj
    }, "", null);
};

SocialCalc.SettingsControlInitializePanel = function(panelobj) {
    var ctrlname;
    var sc = SocialCalc.SettingsControls;
    for (ctrlname in panelobj) {
        if (ctrlname == "name") continue;
        ctrl = sc.Controls[panelobj[ctrlname].type];
        if (ctrl && ctrl.Initialize) ctrl.Initialize(panelobj, ctrlname);
    }
};

SocialCalc.SettingsControlLoadPanel = function(panelobj, attribs) {
    var ctrlname;
    var sc = SocialCalc.SettingsControls;
    for (ctrlname in panelobj) {
        if (ctrlname == "name") continue;
        ctrl = sc.Controls[panelobj[ctrlname].type];
        if (ctrl && ctrl.SetValue) ctrl.SetValue(panelobj, ctrlname, attribs[panelobj[ctrlname].setting]);
    }
};

SocialCalc.SettingsControlUnloadPanel = function(panelobj) {
    var ctrlname;
    var sc = SocialCalc.SettingsControls;
    var attribs = {};
    for (ctrlname in panelobj) {
        if (ctrlname == "name") continue;
        ctrl = sc.Controls[panelobj[ctrlname].type];
        if (ctrl && ctrl.GetValue) attribs[panelobj[ctrlname].setting] = ctrl.GetValue(panelobj, ctrlname);
    }
    return attribs;
};

SocialCalc.SettingsControls.PopupChangeCallback = function(attribs, id, value) {
    var sc = SocialCalc.Constants;
    var ele = document.getElementById("sample-text");
    if (!ele || !attribs || !attribs.panelobj) return;
    var idPrefix = SocialCalc.CurrentSpreadsheetControlObject.idPrefix;
    var c = attribs.panelobj.name == "cell" ? "c" : "";
    var v, a, parts, str1, str2, i;
    parts = sc.defaultCellLayout.match(/^padding.(\S+) (\S+) (\S+) (\S+).vertical.align.(\S+);$/) || [];
    var cv = {
        color: [ "textcolor" ],
        backgroundColor: [ "bgcolor", "#FFF" ],
        fontSize: [ "fontsize", sc.defaultCellFontSize ],
        fontFamily: [ "fontfamily" ],
        paddingTop: [ "padtop", parts[1] ],
        paddingRight: [ "padright", parts[2] ],
        paddingBottom: [ "padbottom", parts[3] ],
        paddingLeft: [ "padleft", parts[4] ],
        verticalAlign: [ "alignvert", parts[5] ]
    };
    for (a in cv) {
        v = SocialCalc.Popup.GetValue(idPrefix + c + cv[a][0]) || cv[a][1] || "";
        ele.style[a] = v;
    }
    if (c == "c") {
        cv = {
            borderTop: "cbt",
            borderRight: "cbr",
            borderBottom: "cbb",
            borderLeft: "cbl"
        };
        for (a in cv) {
            v = SocialCalc.SettingsControls.BorderSideGetValue(attribs.panelobj, cv[a]);
            ele.style[a] = v ? v.val || "" : "";
        }
        v = SocialCalc.Popup.GetValue(idPrefix + "calignhoriz");
        ele.style.textAlign = v || "left";
        ele.childNodes[1].style.textAlign = v || "right";
    } else {
        ele.style.border = "";
        v = SocialCalc.Popup.GetValue(idPrefix + "textalignhoriz");
        ele.style.textAlign = v || "left";
        v = SocialCalc.Popup.GetValue(idPrefix + "numberalignhoriz");
        ele.childNodes[1].style.textAlign = v || "right";
    }
    v = SocialCalc.Popup.GetValue(idPrefix + c + "fontlook");
    parts = v ? v.match(/^(\S+) (\S+)$/) || [] : [];
    ele.style.fontStyle = parts[1] || "";
    ele.style.fontWeight = parts[2] || "";
    v = SocialCalc.Popup.GetValue(idPrefix + c + "formatnumber") || "General";
    str1 = SocialCalc.FormatNumber.formatNumberWithFormat(9.8765, v, "");
    str2 = SocialCalc.FormatNumber.formatNumberWithFormat(-1234.5, v, "");
    if (str2 != "??-???-??&nbsp;??:??:??") {
        str1 += "<br>" + str2;
    }
    ele.childNodes[1].innerHTML = str1;
};

SocialCalc.SettingsControls.PopupListSetValue = function(panelobj, ctrlname, value) {
    if (!value) {
        alert(ctrlname + " no value");
        return;
    }
    var sp = SocialCalc.Popup;
    if (!value.def) {
        sp.SetValue(panelobj[ctrlname].id, value.val);
    } else {
        sp.SetValue(panelobj[ctrlname].id, "");
    }
};

SocialCalc.SettingsControls.PopupListGetValue = function(panelobj, ctrlname) {
    var ctl = panelobj[ctrlname];
    if (!ctl) return null;
    var value = SocialCalc.Popup.GetValue(ctl.id);
    if (value) {
        return {
            def: false,
            val: value
        };
    } else {
        return {
            def: true,
            val: 0
        };
    }
};

SocialCalc.SettingsControls.PopupListInitialize = function(panelobj, ctrlname) {
    var i, val, pos, otext;
    var sc = SocialCalc.SettingsControls;
    var initialdata = panelobj[ctrlname].initialdata || sc.Controls[panelobj[ctrlname].type].InitialData || "";
    initialdata = SocialCalc.LocalizeSubstrings(initialdata);
    var optionvals = initialdata.split(/\|/);
    var options = [];
    for (i = 0; i < (optionvals.length || 0); i++) {
        val = optionvals[i];
        pos = val.indexOf(":");
        otext = val.substring(0, pos);
        if (otext.indexOf("\\") != -1) {
            otext = otext.replace(/\\c/g, ":");
            otext = otext.replace(/\\b/g, "\\");
        }
        otext = SocialCalc.special_chars(otext);
        if (otext == "[custom]") {
            options[i] = {
                o: SocialCalc.Constants.s_PopupListCustom,
                v: val.substring(pos + 1),
                a: {
                    custom: true
                }
            };
        } else if (otext == "[cancel]") {
            options[i] = {
                o: SocialCalc.Constants.s_PopupListCancel,
                v: "",
                a: {
                    cancel: true
                }
            };
        } else if (otext == "[break]") {
            options[i] = {
                o: "-----",
                v: "",
                a: {
                    skip: true
                }
            };
        } else if (otext == "[newcol]") {
            options[i] = {
                o: "",
                v: "",
                a: {
                    newcol: true
                }
            };
        } else {
            options[i] = {
                o: otext,
                v: val.substring(pos + 1)
            };
        }
    }
    SocialCalc.Popup.Create("List", panelobj[ctrlname].id, {});
    SocialCalc.Popup.Initialize(panelobj[ctrlname].id, {
        options: options,
        attribs: {
            changedcallback: SocialCalc.SettingsControls.PopupChangeCallback,
            panelobj: panelobj
        }
    });
};

SocialCalc.SettingsControls.PopupListReset = function(ctrlname) {
    SocialCalc.Popup.Reset("List");
};

SocialCalc.SettingsControls.Controls.PopupList = {
    SetValue: SocialCalc.SettingsControls.PopupListSetValue,
    GetValue: SocialCalc.SettingsControls.PopupListGetValue,
    Initialize: SocialCalc.SettingsControls.PopupListInitialize,
    OnReset: SocialCalc.SettingsControls.PopupListReset,
    ChangedCallback: null
};

SocialCalc.SettingsControls.ColorChooserSetValue = function(panelobj, ctrlname, value) {
    if (!value) {
        alert(ctrlname + " no value");
        return;
    }
    var sp = SocialCalc.Popup;
    if (!value.def) {
        sp.SetValue(panelobj[ctrlname].id, value.val);
    } else {
        sp.SetValue(panelobj[ctrlname].id, "");
    }
};

SocialCalc.SettingsControls.ColorChooserGetValue = function(panelobj, ctrlname) {
    var value = SocialCalc.Popup.GetValue(panelobj[ctrlname].id);
    if (value) {
        return {
            def: false,
            val: value
        };
    } else {
        return {
            def: true,
            val: 0
        };
    }
};

SocialCalc.SettingsControls.ColorChooserInitialize = function(panelobj, ctrlname) {
    var i, val, pos, otext;
    var sc = SocialCalc.SettingsControls;
    SocialCalc.Popup.Create("ColorChooser", panelobj[ctrlname].id, {});
    SocialCalc.Popup.Initialize(panelobj[ctrlname].id, {
        attribs: {
            title: "&nbsp;",
            moveable: true,
            width: "106px",
            changedcallback: SocialCalc.SettingsControls.PopupChangeCallback,
            panelobj: panelobj
        }
    });
};

SocialCalc.SettingsControls.ColorChooserReset = function(ctrlname) {
    SocialCalc.Popup.Reset("ColorChooser");
};

SocialCalc.SettingsControls.Controls.ColorChooser = {
    SetValue: SocialCalc.SettingsControls.ColorChooserSetValue,
    GetValue: SocialCalc.SettingsControls.ColorChooserGetValue,
    Initialize: SocialCalc.SettingsControls.ColorChooserInitialize,
    OnReset: SocialCalc.SettingsControls.ColorChooserReset,
    ChangedCallback: null
};

SocialCalc.SettingsControls.BorderSideSetValue = function(panelobj, ctrlname, value) {
    var sc = SocialCalc.SettingsControls;
    var ele, found, idname, parts;
    var idstart = panelobj[ctrlname].id;
    if (!value) {
        alert(ctrlname + " no value");
        return;
    }
    ele = document.getElementById(idstart + "-onoff-bcb");
    if (!ele) return;
    if (value.val) {
        ele.checked = true;
        ele.value = value.val;
        parts = value.val.match(/(\S+)\s+(\S+)\s+(\S.+)/);
        idname = idstart + "-color";
        SocialCalc.Popup.SetValue(idname, parts[3]);
        SocialCalc.Popup.SetDisabled(idname, false);
    } else {
        ele.checked = false;
        ele.value = value.val;
        idname = idstart + "-color";
        SocialCalc.Popup.SetValue(idname, "");
        SocialCalc.Popup.SetDisabled(idname, true);
    }
};

SocialCalc.SettingsControls.BorderSideGetValue = function(panelobj, ctrlname) {
    var sc = SocialCalc.SettingsControls;
    var ele, value;
    var idstart = panelobj[ctrlname].id;
    ele = document.getElementById(idstart + "-onoff-bcb");
    if (!ele) return;
    if (ele.checked) {
        value = SocialCalc.Popup.GetValue(idstart + "-color");
        value = "1px solid " + (value || "rgb(0,0,0)");
        return {
            def: false,
            val: value
        };
    } else {
        return {
            def: false,
            val: ""
        };
    }
};

SocialCalc.SettingsControls.BorderSideInitialize = function(panelobj, ctrlname) {
    var sc = SocialCalc.SettingsControls;
    var idstart = panelobj[ctrlname].id;
    SocialCalc.Popup.Create("ColorChooser", idstart + "-color", {});
    SocialCalc.Popup.Initialize(idstart + "-color", {
        attribs: {
            title: "&nbsp;",
            width: "106px",
            moveable: true,
            changedcallback: SocialCalc.SettingsControls.PopupChangeCallback,
            panelobj: panelobj
        }
    });
};

SocialCalc.SettingsControlOnchangeBorder = function(ele) {
    var idname, value, found, ele2;
    var sc = SocialCalc.SettingsControls;
    var panelobj = sc.CurrentPanel;
    var nameparts = ele.id.match(/(^.*\-)(\w+)\-(\w+)\-(\w+)$/);
    if (!nameparts) return;
    var prefix = nameparts[1];
    var ctrlname = nameparts[2];
    var ctrlsubid = nameparts[3];
    var ctrlidsuffix = nameparts[4];
    var ctrltype = panelobj[ctrlname].type;
    switch (ctrlidsuffix) {
      case "bcb":
        if (ele.checked) {
            sc.Controls[ctrltype].SetValue(sc.CurrentPanel, ctrlname, {
                def: false,
                val: ele.value || "1px solid rgb(0,0,0)"
            });
        } else {
            sc.Controls[ctrltype].SetValue(sc.CurrentPanel, ctrlname, {
                def: false,
                val: ""
            });
        }
        break;
    }
};

SocialCalc.SettingsControls.Controls.BorderSide = {
    SetValue: SocialCalc.SettingsControls.BorderSideSetValue,
    GetValue: SocialCalc.SettingsControls.BorderSideGetValue,
    OnClick: SocialCalc.SettingsControls.ColorComboOnClick,
    Initialize: SocialCalc.SettingsControls.BorderSideInitialize,
    InitialData: {
        thickness: "1 pixel:1px",
        style: "Solid:solid"
    },
    ChangedCallback: null
};

SocialCalc.SettingControlReset = function() {
    var sc = SocialCalc.SettingsControls;
    var ctrlname;
    for (ctrlname in sc.Controls) {
        if (sc.Controls[ctrlname].OnReset) sc.Controls[ctrlname].OnReset(ctrlname);
    }
};

SocialCalc.OtherSaveParts = {};

SocialCalc.CtrlSEditor = function(whichpart) {
    var strtoedit, partname;
    if (whichpart.length > 0) {
        strtoedit = SocialCalc.special_chars(SocialCalc.OtherSaveParts[whichpart] || "");
    } else {
        strtoedit = "Listing of Parts\n";
        for (partname in SocialCalc.OtherSaveParts) {
            strtoedit += SocialCalc.special_chars("\nPart: " + partname + "\n=====\n" + SocialCalc.OtherSaveParts[partname] + "\n");
        }
    }
    var editbox = document.createElement("div");
    editbox.style.cssText = "position:absolute;z-index:500;width:300px;height:300px;left:100px;top:200px;border:1px solid black;background-color:#EEE;text-align:center;";
    editbox.id = "socialcalc-editbox";
    editbox.innerHTML = whichpart + '<br><br><textarea id="socialcalc-editbox-textarea" style="width:250px;height:200px;">' + strtoedit + "</textarea><br><br><input type=button " + "onclick=\"SocialCalc.CtrlSEditorDone ('socialcalc-editbox', '" + whichpart + '\');" value="OK">';
    document.body.appendChild(editbox);
    var ebta = document.getElementById("socialcalc-editbox-textarea");
    ebta.focus();
    SocialCalc.CmdGotFocus(ebta);
};

SocialCalc.CtrlSEditorDone = function(idprefix, whichpart) {
    var edittextarea = document.getElementById(idprefix + "-textarea");
    var text = edittextarea.value;
    if (whichpart.length > 0) {
        if (text.length > 0) {
            SocialCalc.OtherSaveParts[whichpart] = text;
        } else {
            delete SocialCalc.OtherSaveParts[whichpart];
        }
    }
    var editbox = document.getElementById(idprefix);
    SocialCalc.KeyboardFocus();
    editbox.parentNode.removeChild(editbox);
};

var SocialCalc;

if (!SocialCalc) {
    alert("Main SocialCalc code module needed");
    SocialCalc = {};
}

if (!SocialCalc.TableEditor) {
    alert("SocialCalc TableEditor code module needed");
}

SocialCalc.CurrentSpreadsheetViewerObject = null;

SocialCalc.SpreadsheetViewer = function(idPrefix) {
    var scc = SocialCalc.Constants;
    this.parentNode = null;
    this.spreadsheetDiv = null;
    this.requestedHeight = 0;
    this.requestedWidth = 0;
    this.requestedSpaceBelow = 0;
    this.height = 0;
    this.width = 0;
    this.viewheight = 0;
    this.sheet = null;
    this.context = null;
    this.editor = null;
    this.spreadsheetDiv = null;
    this.editorDiv = null;
    this.sortrange = "";
    this.idPrefix = idPrefix || "SocialCalc-";
    this.imagePrefix = scc.defaultImagePrefix;
    this.statuslineheight = scc.SVStatuslineheight;
    this.statuslineCSS = scc.SVStatuslineCSS;
    this.sheet = new SocialCalc.Sheet();
    this.context = new SocialCalc.RenderContext(this.sheet);
    this.context.showGrid = true;
    this.context.showRCHeaders = true;
    this.editor = new SocialCalc.TableEditor(this.context);
    this.editor.noEdit = true;
    this.editor.StatusCallback.statusline = {
        func: SocialCalc.SpreadsheetViewerStatuslineCallback,
        params: {}
    };
    this.hasStatusLine = true;
    this.statuslineHTML = '<table cellspacing="0" cellpadding="0"><tr><td width="100%" style="overflow:hidden;">{status}</td><td>&nbsp;</td></tr></table>';
    this.statuslineFull = true;
    this.noRecalc = true;
    this.repeatingMacroTimer = null;
    this.repeatingMacroInterval = 60;
    this.repeatingMacroCommands = "";
    SocialCalc.CurrentSpreadsheetViewerObject = this;
    return;
};

SocialCalc.SpreadsheetViewer.prototype.InitializeSpreadsheetViewer = function(node, height, width, spacebelow) {
    return SocialCalc.InitializeSpreadsheetViewer(this, node, height, width, spacebelow);
};

SocialCalc.SpreadsheetViewer.prototype.LoadSave = function(str) {
    return SocialCalc.SpreadsheetViewerLoadSave(this, str);
};

SocialCalc.SpreadsheetViewer.prototype.DoOnResize = function() {
    return SocialCalc.DoOnResize(this);
};

SocialCalc.SpreadsheetViewer.prototype.SizeSSDiv = function() {
    return SocialCalc.SizeSSDiv(this);
};

SocialCalc.SpreadsheetViewer.prototype.DecodeSpreadsheetSave = function(str) {
    return SocialCalc.SpreadsheetViewerDecodeSpreadsheetSave(this, str);
};

SocialCalc.SpreadsheetViewer.prototype.ParseSheetSave = function(str) {
    return this.sheet.ParseSheetSave(str);
};

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
    spreadsheet.spreadsheetDiv = document.createElement("div");
    spreadsheet.SizeSSDiv();
    for (child = node.firstChild; child != null; child = node.firstChild) {
        node.removeChild(child);
    }
    node.appendChild(spreadsheet.spreadsheetDiv);
    spreadsheet.nonviewheight = spreadsheet.hasStatusLine ? spreadsheet.statuslineheight : 0;
    spreadsheet.viewheight = spreadsheet.height - spreadsheet.nonviewheight;
    spreadsheet.editorDiv = spreadsheet.editor.CreateTableEditor(spreadsheet.width, spreadsheet.viewheight);
    spreadsheet.spreadsheetDiv.appendChild(spreadsheet.editorDiv);
    if (spreadsheet.hasStatusLine) {
        spreadsheet.statuslineDiv = document.createElement("div");
        spreadsheet.statuslineDiv.style.cssText = spreadsheet.statuslineCSS;
        spreadsheet.statuslineDiv.style.height = spreadsheet.statuslineheight - (spreadsheet.statuslineDiv.style.paddingTop.slice(0, -2) - 0) - (spreadsheet.statuslineDiv.style.paddingBottom.slice(0, -2) - 0) + "px";
        spreadsheet.statuslineDiv.id = spreadsheet.idPrefix + "statusline";
        spreadsheet.spreadsheetDiv.appendChild(spreadsheet.statuslineDiv);
        spreadsheet.editor.StatusCallback.statusline = {
            func: SocialCalc.SpreadsheetViewerStatuslineCallback,
            params: {
                spreadsheetobj: spreadsheet
            }
        };
    }
    return;
};

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
        if (parts.startupmacro) {
            spreadsheet.editor.EditorScheduleSheetCommands(savestr.substring(parts.startupmacro.start, parts.startupmacro.end), false, true);
        }
        if (parts.repeatingmacro) {
            rmstr = savestr.substring(parts.repeatingmacro.start, parts.repeatingmacro.end);
            rmstr = rmstr.replace("\r", "");
            pos = rmstr.indexOf("\n");
            if (pos > 0) {
                t = rmstr.substring(0, pos) - 0;
                t2 = t;
                spreadsheet.repeatingMacroInterval = t;
                spreadsheet.repeatingMacroCommands = rmstr.substring(pos + 1);
                if (t2 > 0) {
                    spreadsheet.repeatingMacroTimer = window.setTimeout(SocialCalc.SpreadsheetViewerDoRepeatingMacro, spreadsheet.repeatingMacroInterval * 1e3);
                }
            }
        }
    }
    if (spreadsheet.editor.context.sheetobj.attribs.recalc == "off" || spreadsheet.noRecalc) {
        spreadsheet.editor.ScheduleRender();
    } else {
        spreadsheet.editor.EditorScheduleSheetCommands("recalc");
    }
};

SocialCalc.SpreadsheetViewerDoRepeatingMacro = function() {
    var spreadsheet = SocialCalc.GetSpreadsheetViewerObject();
    var editor = spreadsheet.editor;
    spreadsheet.repeatingMacroTimer = null;
    SocialCalc.SheetCommandInfo.CmdExtensionCallbacks.repeatmacro = {
        func: SocialCalc.SpreadsheetViewerRepeatMacroCommand,
        data: null
    };
    editor.EditorScheduleSheetCommands(spreadsheet.repeatingMacroCommands);
};

SocialCalc.SpreadsheetViewerRepeatMacroCommand = function(name, data, sheet, cmd, saveundo) {
    var spreadsheet = SocialCalc.GetSpreadsheetViewerObject();
    var rest = cmd.RestOfString();
    var t = rest - 0;
    if (!(t > 0)) t = spreadsheet.repeatingMacroInterval;
    spreadsheet.repeatingMacroInterval = t;
    spreadsheet.repeatingMacroTimer = window.setTimeout(SocialCalc.SpreadsheetViewerDoRepeatingMacro, spreadsheet.repeatingMacroInterval * 1e3);
};

SocialCalc.SpreadsheetViewerStopRepeatingMacro = function() {
    var spreadsheet = SocialCalc.GetSpreadsheetViewerObject();
    if (spreadsheet.repeatingMacroTimer) {
        window.clearTimeout(spreadsheet.repeatingMacroTimer);
        spreadsheet.repeatingMacroTimer = null;
    }
};

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
};

SocialCalc.LocalizeString = function(str) {
    var cstr = SocialCalc.LocalizeStringList[str];
    if (!cstr) {
        cstr = SocialCalc.Constants["s_loc_" + str.toLowerCase().replace(/\s/g, "_").replace(/\W/g, "X")] || str;
        SocialCalc.LocalizeStringList[str] = cstr;
    }
    return cstr;
};

SocialCalc.LocalizeStringList = {};

SocialCalc.LocalizeSubstrings = function(str) {
    var SCLoc = SocialCalc.LocalizeString;
    return str.replace(/%(loc|ssc)!(.*?)!/g, function(a, t, c) {
        if (t == "ssc") {
            return SocialCalc.Constants[c] || alert("Missing constant: " + c);
        } else {
            return SCLoc(c);
        }
    });
};

SocialCalc.GetSpreadsheetViewerObject = function() {
    var csvo = SocialCalc.CurrentSpreadsheetViewerObject;
    if (csvo) return csvo;
    throw "No current SpreadsheetViewer object.";
};

SocialCalc.DoOnResize = function(spreadsheet) {
    var v;
    var views = spreadsheet.views;
    var needresize = spreadsheet.SizeSSDiv();
    if (!needresize) return;
    for (vname in views) {
        v = views[vname].element;
        v.style.width = spreadsheet.width + "px";
        v.style.height = spreadsheet.height - spreadsheet.nonviewheight + "px";
    }
    spreadsheet.editor.ResizeTableEditor(spreadsheet.width, spreadsheet.height - spreadsheet.nonviewheight);
};

SocialCalc.SizeSSDiv = function(spreadsheet) {
    var sizes, pos, resized, nodestyle, newval;
    var fudgefactorX = 10;
    var fudgefactorY = 10;
    resized = false;
    sizes = SocialCalc.GetViewportInfo();
    pos = SocialCalc.GetElementPosition(spreadsheet.parentNode);
    pos.bottom = 0;
    pos.right = 0;
    nodestyle = spreadsheet.parentNode.style;
    if (nodestyle.marginTop) {
        pos.top += nodestyle.marginTop.slice(0, -2) - 0;
    }
    if (nodestyle.marginBottom) {
        pos.bottom += nodestyle.marginBottom.slice(0, -2) - 0;
    }
    if (nodestyle.marginLeft) {
        pos.left += nodestyle.marginLeft.slice(0, -2) - 0;
    }
    if (nodestyle.marginRight) {
        pos.right += nodestyle.marginRight.slice(0, -2) - 0;
    }
    newval = spreadsheet.requestedHeight || sizes.height - (pos.top + pos.bottom + fudgefactorY) - (spreadsheet.requestedSpaceBelow || 0);
    if (spreadsheet.height != newval) {
        spreadsheet.height = newval;
        spreadsheet.spreadsheetDiv.style.height = newval + "px";
        resized = true;
    }
    newval = spreadsheet.requestedWidth || sizes.width - (pos.left + pos.right + fudgefactorX) || 700;
    if (spreadsheet.width != newval) {
        spreadsheet.width = newval;
        spreadsheet.spreadsheetDiv.style.width = newval + "px";
        resized = true;
    }
    spreadsheet.spreadsheetDiv.style.position = "relative";
    return resized;
};

SocialCalc.SpreadsheetViewerStatuslineCallback = function(editor, status, arg, params) {
    var spreadsheet = params.spreadsheetobj;
    var slstr = "";
    if (spreadsheet && spreadsheet.statuslineDiv) {
        if (spreadsheet.statuslineFull) {
            slstr = editor.GetStatuslineString(status, arg, params);
        } else {
            slstr = editor.ecell.coord;
        }
        slstr = spreadsheet.statuslineHTML.replace(/\{status\}/, slstr);
        spreadsheet.statuslineDiv.innerHTML = slstr;
    }
    switch (status) {
      case "cmdendnorender":
      case "calcfinished":
      case "doneposcalc":
        break;

      default:
        break;
    }
};

SocialCalc.CmdGotFocus = function(obj) {
    SocialCalc.Keyboard.passThru = obj;
};

SocialCalc.SpreadsheetViewerCreateSheetHTML = function(spreadsheet) {
    var context, div, ele;
    var result = "";
    context = new SocialCalc.RenderContext(spreadsheet.sheet);
    div = document.createElement("div");
    ele = context.RenderSheet(null, {
        type: "html"
    });
    div.appendChild(ele);
    delete context;
    result = div.innerHTML;
    delete ele;
    delete div;
    return result;
};

SocialCalc.SpreadsheetViewerDecodeSpreadsheetSave = function(spreadsheet, str) {
    var pos1, mpregex, searchinfo, boundary, boundaryregex, blanklineregex, start, ending, lines, i, lines, p, pnun;
    var parts = {};
    var partlist = [];
    var hasreturnonly = /[^\n]\r[^\n]/;
    if (hasreturnonly.test(str)) {
        str = str.replace(/([^\n])\r([^\n])/g, "$1\r\n$2");
    }
    pos1 = str.search(/^MIME-Version:\s1\.0/im);
    if (pos1 < 0) return parts;
    mpregex = /^Content-Type:\s*multipart\/mixed;\s*boundary=(\S+)/gim;
    mpregex.lastIndex = pos1;
    searchinfo = mpregex.exec(str);
    if (mpregex.lastIndex <= 0) return parts;
    boundary = searchinfo[1];
    boundaryregex = new RegExp("^--" + boundary + "(?:\r\n|\n)", "mg");
    boundaryregex.lastIndex = mpregex.lastIndex;
    searchinfo = boundaryregex.exec(str);
    blanklineregex = /(?:\r\n|\n)(?:\r\n|\n)/gm;
    blanklineregex.lastIndex = boundaryregex.lastIndex;
    searchinfo = blanklineregex.exec(str);
    if (!searchinfo) return parts;
    start = blanklineregex.lastIndex;
    boundaryregex.lastIndex = start;
    searchinfo = boundaryregex.exec(str);
    if (!searchinfo) return parts;
    ending = searchinfo.index;
    lines = str.substring(start, ending).split(/\r\n|\n/);
    for (i = 0; i < lines.length; i++) {
        line = lines[i];
        p = line.split(":");
        switch (p[0]) {
          case "version":
            break;

          case "part":
            partlist.push(p[1]);
            break;
        }
    }
    for (pnum = 0; pnum < partlist.length; pnum++) {
        blanklineregex.lastIndex = ending;
        searchinfo = blanklineregex.exec(str);
        if (!searchinfo) return parts;
        start = blanklineregex.lastIndex;
        if (pnum == partlist.length - 1) {
            boundaryregex = new RegExp("^--" + boundary + "--$", "mg");
        }
        boundaryregex.lastIndex = start;
        searchinfo = boundaryregex.exec(str);
        if (!searchinfo) return parts;
        ending = searchinfo.index;
        parts[partlist[pnum]] = {
            start: start,
            end: ending
        };
    }
    return parts;
};

(function() {
    Class = function(classDefinition, classWrapper) {
        if (!classDefinition) throw "Class requires a class definition string as its first argument";
        if (!classWrapper) throw "Class requires a class wrapper function as its second argument";
        if (!classDefinition.match(/^([\w\.]+)(?:\(\s*([\w\.]+)\s*\))?(?:\s+(.*?)\s*)?$/)) throw "Can't parse Class Definition: '" + classDefinition + "'";
        var className = RegExp.$1;
        var baseClassName = RegExp.$2 || "";
        var options = [];
        if (RegExp.$3) {
            options = RegExp.$3.split(/\s+/);
        }
        var incValues = [];
        var strict = true;
        for (var i = 0, l = options.length; i < l; i++) {
            var option = options[i];
            if (option == "-nostrict") {
                strict = false;
            }
            if (option.match(/^-inc=(.+)$/)) {
                incValues = RegExp.$1.split(",");
            }
        }
        var parts = className.split(".");
        var klass = Class.global;
        for (var i = 0; i < parts.length; i++) {
            if (!klass[parts[i]]) {
                klass[parts[i]] = function() {
                    try {
                        this.init();
                    } catch (e) {}
                };
            }
            klass = klass[parts[i]];
        }
        klass.className = className;
        klass.isa = function(baseName) {
            klass.baseClassName = baseName;
            if (baseName) {
                klass.prototype = eval("new " + baseName + "()");
                klass.prototype.superFunc = function(name) {
                    return eval(baseName).prototype[name];
                };
            }
        };
        klass.isa(baseClassName);
        klass.global = Class.global;
        klass.addGlobal = function() {
            this.newGlobals++;
            return Class.global;
        };
        klass.extend = function(pairs) {
            if (typeof pairs != "object") {
                throw "extend requires an object of name:value pairs";
            }
            for (var name in pairs) {
                klass.prototype[name] = pairs[name];
            }
        };
        for (var ii = 0, ll = incValues.length; ii < ll; ii++) {
            var value = incValues[ii];
            if (value == "proto") {
                incValues[ii] = klass.prototype;
            } else if (value == "this") {
                incValues[ii] = klass;
            } else {
                incValues[ii] = Class.global[value];
            }
        }
        if (strict) {
            Class.eval_strict(classWrapper, klass, incValues);
        } else {
            classWrapper.apply(klass, incValues);
        }
        return klass;
    };
})();

Class.global = this;

Class.eval_strict = function(classWrapper, klass, incValues) {
    var globals = 0;
    var last_key;
    for (var k in Class.global) {
        globals++;
        last_key = k;
    }
    klass.newGlobals = 0;
    classWrapper.apply(klass, incValues);
    var globals_after = 0;
    for (var k in Class.global) {
        globals_after++;
    }
    if (globals + klass.newGlobals != globals_after) {
        throw "Class '" + klass.className + "' defines " + (globals_after - globals) + " new global JavaScript variables without using this.addGlobal()";
    }
    delete klass.newGlobals;
};

Class("Document.Emitter", function() {
    var proto = this.prototype;
    proto.className = "Document.Emitter";
    proto.instantiate = function() {
        return eval("new " + this.className + "()");
    };
    proto.init = function() {
        this.output = "";
    };
    proto.content = function() {
        return this.output;
    };
    proto.insert = function(receiver) {
        this.output += receiver.output;
    };
});

Class("Document.Emitter.HTML(Document.Emitter)", function() {
    var proto = this.prototype;
    proto.className = "Document.Emitter.HTML";
    proto.begin_node = function(node) {
        var tag = node.type;
        switch (tag) {
          case "asis":
          case "line":
            return;

          case "br":
          case "hr":
            {
                this.output += "<" + tag + " />";
                return;
            }

          case "html":
            {
                this.output += '<span class="wafl">Raw HTML section. Edit in Wiki Text mode.</span>';
                return;
            }

          case "waflparagraph":
          case "waflphrase":
          case "im":
            {
                if (node._wafl.match(/^image:\s*(\S+)(?:\s+size=(\w+))?/)) {
                    var onload = "if (typeof(ss) != 'undefined' && ss.editor) { var recalc = function () { try { ss.editor.DoPositionCalculations() } catch (e) { setTimeout(recalc, 500) } }; recalc() } if (!window.image_dimension_cache) window.image_dimension_cache = {};window.image_dimension_cache['/data/wafl/" + node._label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "\\'").replace(/\\/g, "\\\\") + "'] = [ this.offsetWidth, this.offsetHeight ]; this.style.width = this.offsetWidth + 'px'; this.style.height = this.offsetHeight + 'px'";
                    var imageName = RegExp.$1;
                    var width = RegExp.$2;
                    switch (width) {
                      case "small":
                        {
                            width = "100";
                            break;
                        }

                      case "medium":
                        {
                            width = "300";
                            break;
                        }

                      case "large":
                        {
                            width = "600";
                            break;
                        }
                    }
                    if (width) {
                        width = ' width="' + width + '"';
                    }
                    this.output += '<img src="' + imageName.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + '" onload="' + onload + '"' + width + " />";
                    return;
                }
                this.output += '<span class="wafl">' + node._label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "\\'").replace(/\\/g, "\\\\") + "</span>";
                return;
            }

          case "a":
          case "wikilink":
            {
                this.output += '<a href="' + encodeURI(node._href) + '">';
                return;
            }

          case "file":
            {
                this.output += '<a title="(network resource)" href="' + encodeURI(node._href) + '">';
                return;
            }

          case "ul":
          case "ol":
          case "table":
          case "tr":
            {
                this.output += "<" + tag + ">\n";
                return;
            }

          default:
            {
                this.output += "<" + tag + ">";
                return;
            }
        }
    };
    proto.end_node = function(node) {
        var tag = node.type;
        switch (tag) {
          case "asis":
          case "br":
          case "hr":
          case "html":
          case "waflparagraph":
          case "waflphrase":
          case "im":
            return;

          case "line":
            {
                this.output += "<br />";
                return;
            }

          case "file":
          case "wikilink":
            {
                this.output += "</a>";
                return;
            }

          default:
            {
                if (tag.search(/^(?:p|ul|ol|li|h\d|table|tr|td)$/) == 0) {
                    this.output += "</" + tag + ">\n";
                } else {
                    this.output += "</" + tag + ">";
                }
                return;
            }
        }
        return;
    };
    proto.text_node = function(text) {
        this.output += text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    };
});

Class("Document.Parser", function() {
    var proto = this.prototype;
    proto.className = "Document.Parser";
    proto.init = function() {};
    proto.parse = function(input, receiver) {
        this.input = input.search(/\n$/) == -1 ? input + "\n" : input;
        if (receiver) this.receiver = receiver;
        this.receiver.init();
        this.grammar = this.create_grammar();
        this.parse_blocks("top");
        return this.receiver.content();
    };
    proto.create_grammar = function() {
        throw "Please define create_grammar in a derived class of Document.Parser.";
    };
    proto.parse_blocks = function(container_type) {
        var types = this.grammar[container_type].blocks;
        if (!types) return;
        while (this.input.length) {
            var length = this.input.length;
            for (var i = 0; i < types.length; i++) {
                var type = types[i];
                var matched = this.find_match("matched_block", type);
                if (matched) {
                    this.input = this.input.substr(matched.end);
                    this.handle_match(type, matched);
                    break;
                }
            }
            if (this.input.length >= length) throw this.classname + ": Reduction error for:\n" + this.input + "\n" + JSON.stringify(this);
        }
        return;
    };
    proto.handle_match = function(type, match) {
        var grammar = this.grammar[type];
        var parse = grammar.blocks ? "parse_blocks" : "parse_phrases";
        this.subparse(parse, match, type, grammar.filter);
    };
    proto.find_match = function(matched_func, type) {
        var re = this.grammar[type].match;
        if (!re) throw "no regexp for type: " + type;
        var capture = this.input.match(re);
        if (capture) {
            var match = this[matched_func].call(this, capture, this.grammar[type].lookbehind);
            match.type = this.grammar[type].type || type;
            return match;
        }
        return;
    };
    proto.parse_phrases = function(container_type) {
        var types = this.grammar[container_type].phrases;
        if (!types) {
            this.receiver.text_node(this.input || "");
            return;
        }
        while (this.input.length) {
            var match = null;
            for (var i = 0; i < types.length; i++) {
                var type = types[i];
                var matched = this.find_match("matched_phrase", type);
                if (!matched) continue;
                if (!match || matched.begin < match.begin) {
                    match = matched;
                    if (match.begin == 0) break;
                }
            }
            if (!match) {
                this.receiver.text_node(this.input || "");
                break;
            }
            if (match.begin != 0) {
                this.receiver.text_node(this.input.substr(0, match.begin) || "");
            }
            this.input = this.input.substr(match.end);
            this.handle_match(match.type, match);
        }
        return;
    };
    proto.subparse = function(func, match, type, filter) {
        match.type = this.grammar[type].type;
        if (match.type == null) match.type = type;
        var filtered_text = filter ? filter(match) : null;
        if (match.type) this.receiver.begin_node(match);
        var parser = eval("new " + this.className + "()");
        parser.input = filtered_text == null ? match.text : filtered_text;
        parser.grammar = this.grammar;
        parser.receiver = this.receiver.instantiate();
        parser[func].call(parser, type);
        this.receiver.insert(parser.receiver);
        if (match.type) this.receiver.end_node(match);
    };
    proto.matched_block = function(capture) {
        return {
            begin: capture.index,
            text: capture[1],
            end: capture[0].length,
            1: capture[2],
            2: capture[3],
            3: capture[4]
        };
    };
    proto.matched_phrase = function(capture, lookbehind) {
        if (lookbehind) {
            var text = capture[2];
            var begin = this.input.indexOf(capture[1]);
            return {
                text: text,
                begin: begin,
                end: begin + capture[1].length,
                1: RegExp.$2,
                2: RegExp.$3,
                3: RegExp.$4
            };
        }
        return {
            begin: capture.index,
            text: capture[1],
            end: capture.index + capture[0].length,
            1: capture[2],
            2: capture[3],
            3: capture[4]
        };
    };
});

Class("Document.Parser.Wikitext(Document.Parser)", function() {
    var proto = this.prototype;
    proto.className = "Document.Parser.Wikitext";
    proto.init = function() {};
    proto.create_grammar = function() {
        var all_blocks = [ "pre", "html", "hr", "hx", "waflparagraph", "ul", "ol", "blockquote", "p", "empty", "else" ];
        var all_phrases = [ "waflphrase", "asis", "wikilink", "wikilink2", "a", "im", "mail", "file", "tt", "b", "i", "del", "a" ];
        var re_huggy = function(brace1, brace2) {
            brace2 = "\\" + (brace2 || brace1);
            brace1 = "\\" + brace1;
            return {
                match: new RegExp("(?:^|[^" + brace1 + "\\w])(" + brace1 + "(?=\\S)(?!" + brace2 + ")(.*?)" + brace2 + "(?=[^" + brace2 + "\\w]|$))"),
                phrases: brace1 == "\\`" ? null : all_phrases,
                lookbehind: true
            };
        };
        var im_types = {
            yahoo: "yahoo",
            ymsgr: "yahoo",
            callto: "callto",
            callme: "callto",
            skype: "callto",
            aim: "aim"
        };
        var im_label = {
            aim: "AIM: %1",
            yahoo: "Yahoo: %1",
            callto: "Skype: %1"
        };
        var im_re = "(\\b(";
        for (var key in im_types) {
            im_re += key + "|";
        }
        im_re = im_re.replace(/\|$/, ")\\:([^\\s\\>\\)]+))");
        var re_list = function(bullet, filter_out) {
            var exclusion = new RegExp("(^|\n)" + filter_out + " *", "g");
            return {
                match: new RegExp("^(" + bullet + "+ .*\n" + "(?:[*-+#]+ .*\n)*" + ")(?:s*\n)?"),
                blocks: [ "ul", "ol", "subl", "li" ],
                filter: function(node) {
                    return node.text.replace(exclusion, "$1");
                }
            };
        };
        return {
            _all_blocks: all_blocks,
            _all_phrases: all_phrases,
            top: {
                blocks: all_blocks
            },
            ol: re_list("#", "[*#]"),
            ul: re_list("[-+*]", "[-+*#]"),
            blockquote: {
                match: /^((?:>[^\n]*\n)+)(?:\s*\n)?/,
                blocks: [ "blockquote", "line" ],
                filter: function(node) {
                    return node.text.replace(/(^|\n)>\ ?/g, "$1");
                }
            },
            line: {
                match: /([^\n]*)\n/,
                phrases: all_phrases
            },
            subl: {
                type: "li",
                match: /^(([^\n]*)\n[*#]+\ [^\n]*\n(?:[*#]+\ [^\n]*\n)*)(?:\s*\n)?/,
                blocks: [ "ul", "ol", "li2" ]
            },
            li: {
                match: /([^\n]*)\n/,
                phrases: all_phrases
            },
            li2: {
                type: "",
                match: /([^\n]*)\n/,
                phrases: all_phrases
            },
            html: {
                match: /^(\.html\ *\n(?:[^\n]*\n)*?\.html)\ *\n(?:\s*\n)?/,
                filter: function(node) {
                    node._html = node.text;
                    return "";
                }
            },
            pre: {
                match: /^\.pre\ *\n((?:[^\n]*\n)*?)\.pre\ *\n(?:\s*\n)?/
            },
            hr: {
                match: /^--+(?:\s*\n)?/
            },
            hx: {
                match: /^((\^+) *([^\n]*?)(\s+=+)?\s*?\n+)/,
                phrases: all_phrases,
                filter: function(node) {
                    node.type = "h" + node["1"].length;
                    return node[2];
                }
            },
            p: {
                match: /^((?:(?!(?:(?:\^+|\#+|\*+|\-+) |\>|\.\w+\s*\n|\{[^\}]+\}\s*\n))[^\n]*\S[^\n]*\n)+(?:(?=^|\n)\s*\n)*)/,
                phrases: all_phrases,
                filter: function(node) {
                    return node.text.replace(/\n$/, "");
                }
            },
            empty: {
                match: /^(\s*\n)/,
                filter: function(node) {
                    node.type = "";
                }
            },
            "else": {
                match: /^(([^\n]*)\n)/,
                phrases: [],
                filter: function(node) {
                    node.type = "p";
                }
            },
            waflparagraph: {
                match: /^\{(.*)\}[\ \t]*\n(?:\s*\n)?/,
                filter: function(node) {
                    node._wafl = node._label = node.text;
                    return "";
                }
            },
            waflphrase: {
                match: /(?:^|[\s\-])((?:"([^\n]+?)")?\{([\w-]+(?=[\:\ \}])(?:\s*:)?\s*[^\n]*?\s*)\}(?=[\W_]|$))/,
                filter: function(node) {
                    node._wafl = node[2];
                    node._label = node[1] || node._wafl;
                    return "";
                },
                lookbehind: true
            },
            asis: {
                match: /(\{\{([^\n]*?)\}\}(\}*))/,
                filter: function(node) {
                    node.type = "";
                    return node[1] + node[2];
                }
            },
            wikilink: {
                match: /(?:^|[_\W])(\[()(?=[^\s\[\]])(.*?)\](?=[_\W]|$))/,
                filter: function(node) {
                    node._href = "?" + node[2];
                    return node.text || node[2];
                },
                lookbehind: true
            },
            wikilink2: {
                type: "wikilink",
                match: /(?:"([^"]*)"\s*)(\[(?=[^\s\[\]])(.*?)\](?=[_\W]|$))/,
                filter: function(node) {
                    node._href = "?" + node[2];
                    return node[1] || node[2];
                }
            },
            a: {
                match: /((?:"([^"]*)"\s*)?<?((?:http|https|ftp|irc|file):(?:\/\/)?[\;\/\?\:\@\&\=\+\$\,\[\]\#A-Za-z0-9\-\_\.\!\~\*\'\(\)]+[A-Za-z0-9\/#])>?)/,
                filter: function(node) {
                    node._href = node[2];
                    return node[1] || node[2];
                }
            },
            file: {
                match: /((?:"([^"]*)")?<(\\\\[^\s\>\)]+)>)/,
                filter: function(node) {
                    var href = node[2].replace(/^\\\\/, "");
                    node._href = "file://" + href.replace(/\\/g, "/");
                    return node["1"] || href;
                }
            },
            im: {
                match: new RegExp(im_re),
                filter: function(node) {
                    node._wafl = node[1] + ": " + node[2];
                    node._label = (im_label[im_types[node[1]]] || "%1").replace(/%1/g, node[2]);
                    return "";
                }
            },
            mail: {
                match: /([\w+%\-\.]+@(?:[\w\-]+\.)+[\w\-]+)/,
                filter: function(node) {
                    node.type = "a";
                    node._href = "mailto:" + node.text.replace(/%/g, "%25");
                }
            },
            tt: re_huggy("`"),
            b: re_huggy("*"),
            i: re_huggy("_"),
            del: re_huggy("-")
        };
    };
});

!function(a, b) {
    "object" == typeof module && "object" == typeof module.exports ? module.exports = a.document ? b(a, !0) : function(a) {
        if (!a.document) throw new Error("jQuery requires a window with a document");
        return b(a);
    } : b(a);
}("undefined" != typeof window ? window : this, function(a, b) {
    var c = [], d = c.slice, e = c.concat, f = c.push, g = c.indexOf, h = {}, i = h.toString, j = h.hasOwnProperty, k = "".trim, l = {}, m = "1.11.0", n = function(a, b) {
        return new n.fn.init(a, b);
    }, o = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, p = /^-ms-/, q = /-([\da-z])/gi, r = function(a, b) {
        return b.toUpperCase();
    };
    n.fn = n.prototype = {
        jquery: m,
        constructor: n,
        selector: "",
        length: 0,
        toArray: function() {
            return d.call(this);
        },
        get: function(a) {
            return null != a ? 0 > a ? this[a + this.length] : this[a] : d.call(this);
        },
        pushStack: function(a) {
            var b = n.merge(this.constructor(), a);
            return b.prevObject = this, b.context = this.context, b;
        },
        each: function(a, b) {
            return n.each(this, a, b);
        },
        map: function(a) {
            return this.pushStack(n.map(this, function(b, c) {
                return a.call(b, c, b);
            }));
        },
        slice: function() {
            return this.pushStack(d.apply(this, arguments));
        },
        first: function() {
            return this.eq(0);
        },
        last: function() {
            return this.eq(-1);
        },
        eq: function(a) {
            var b = this.length, c = +a + (0 > a ? b : 0);
            return this.pushStack(c >= 0 && b > c ? [ this[c] ] : []);
        },
        end: function() {
            return this.prevObject || this.constructor(null);
        },
        push: f,
        sort: c.sort,
        splice: c.splice
    }, n.extend = n.fn.extend = function() {
        var a, b, c, d, e, f, g = arguments[0] || {}, h = 1, i = arguments.length, j = !1;
        for ("boolean" == typeof g && (j = g, g = arguments[h] || {}, h++), "object" == typeof g || n.isFunction(g) || (g = {}), 
        h === i && (g = this, h--); i > h; h++) if (null != (e = arguments[h])) for (d in e) a = g[d], 
        c = e[d], g !== c && (j && c && (n.isPlainObject(c) || (b = n.isArray(c))) ? (b ? (b = !1, 
        f = a && n.isArray(a) ? a : []) : f = a && n.isPlainObject(a) ? a : {}, g[d] = n.extend(j, f, c)) : void 0 !== c && (g[d] = c));
        return g;
    }, n.extend({
        expando: "jQuery" + (m + Math.random()).replace(/\D/g, ""),
        isReady: !0,
        error: function(a) {
            throw new Error(a);
        },
        noop: function() {},
        isFunction: function(a) {
            return "function" === n.type(a);
        },
        isArray: Array.isArray || function(a) {
            return "array" === n.type(a);
        },
        isWindow: function(a) {
            return null != a && a == a.window;
        },
        isNumeric: function(a) {
            return a - parseFloat(a) >= 0;
        },
        isEmptyObject: function(a) {
            var b;
            for (b in a) return !1;
            return !0;
        },
        isPlainObject: function(a) {
            var b;
            if (!a || "object" !== n.type(a) || a.nodeType || n.isWindow(a)) return !1;
            try {
                if (a.constructor && !j.call(a, "constructor") && !j.call(a.constructor.prototype, "isPrototypeOf")) return !1;
            } catch (c) {
                return !1;
            }
            if (l.ownLast) for (b in a) return j.call(a, b);
            for (b in a) ;
            return void 0 === b || j.call(a, b);
        },
        type: function(a) {
            return null == a ? a + "" : "object" == typeof a || "function" == typeof a ? h[i.call(a)] || "object" : typeof a;
        },
        globalEval: function(b) {
            b && n.trim(b) && (a.execScript || function(b) {
                a.eval.call(a, b);
            })(b);
        },
        camelCase: function(a) {
            return a.replace(p, "ms-").replace(q, r);
        },
        nodeName: function(a, b) {
            return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase();
        },
        each: function(a, b, c) {
            var d, e = 0, f = a.length, g = s(a);
            if (c) {
                if (g) {
                    for (;f > e; e++) if (d = b.apply(a[e], c), d === !1) break;
                } else for (e in a) if (d = b.apply(a[e], c), d === !1) break;
            } else if (g) {
                for (;f > e; e++) if (d = b.call(a[e], e, a[e]), d === !1) break;
            } else for (e in a) if (d = b.call(a[e], e, a[e]), d === !1) break;
            return a;
        },
        trim: k && !k.call("﻿ ") ? function(a) {
            return null == a ? "" : k.call(a);
        } : function(a) {
            return null == a ? "" : (a + "").replace(o, "");
        },
        makeArray: function(a, b) {
            var c = b || [];
            return null != a && (s(Object(a)) ? n.merge(c, "string" == typeof a ? [ a ] : a) : f.call(c, a)), 
            c;
        },
        inArray: function(a, b, c) {
            var d;
            if (b) {
                if (g) return g.call(b, a, c);
                for (d = b.length, c = c ? 0 > c ? Math.max(0, d + c) : c : 0; d > c; c++) if (c in b && b[c] === a) return c;
            }
            return -1;
        },
        merge: function(a, b) {
            var c = +b.length, d = 0, e = a.length;
            while (c > d) a[e++] = b[d++];
            if (c !== c) while (void 0 !== b[d]) a[e++] = b[d++];
            return a.length = e, a;
        },
        grep: function(a, b, c) {
            for (var d, e = [], f = 0, g = a.length, h = !c; g > f; f++) d = !b(a[f], f), d !== h && e.push(a[f]);
            return e;
        },
        map: function(a, b, c) {
            var d, f = 0, g = a.length, h = s(a), i = [];
            if (h) for (;g > f; f++) d = b(a[f], f, c), null != d && i.push(d); else for (f in a) d = b(a[f], f, c), 
            null != d && i.push(d);
            return e.apply([], i);
        },
        guid: 1,
        proxy: function(a, b) {
            var c, e, f;
            return "string" == typeof b && (f = a[b], b = a, a = f), n.isFunction(a) ? (c = d.call(arguments, 2), 
            e = function() {
                return a.apply(b || this, c.concat(d.call(arguments)));
            }, e.guid = a.guid = a.guid || n.guid++, e) : void 0;
        },
        now: function() {
            return +new Date();
        },
        support: l
    }), n.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(a, b) {
        h["[object " + b + "]"] = b.toLowerCase();
    });
    function s(a) {
        var b = a.length, c = n.type(a);
        return "function" === c || n.isWindow(a) ? !1 : 1 === a.nodeType && b ? !0 : "array" === c || 0 === b || "number" == typeof b && b > 0 && b - 1 in a;
    }
    var t = function(a) {
        var b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s = "sizzle" + -new Date(), t = a.document, u = 0, v = 0, w = eb(), x = eb(), y = eb(), z = function(a, b) {
            return a === b && (j = !0), 0;
        }, A = "undefined", B = 1 << 31, C = {}.hasOwnProperty, D = [], E = D.pop, F = D.push, G = D.push, H = D.slice, I = D.indexOf || function(a) {
            for (var b = 0, c = this.length; c > b; b++) if (this[b] === a) return b;
            return -1;
        }, J = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", K = "[\\x20\\t\\r\\n\\f]", L = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", M = L.replace("w", "w#"), N = "\\[" + K + "*(" + L + ")" + K + "*(?:([*^$|!~]?=)" + K + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + M + ")|)|)" + K + "*\\]", O = ":(" + L + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + N.replace(3, 8) + ")*)|.*)\\)|)", P = new RegExp("^" + K + "+|((?:^|[^\\\\])(?:\\\\.)*)" + K + "+$", "g"), Q = new RegExp("^" + K + "*," + K + "*"), R = new RegExp("^" + K + "*([>+~]|" + K + ")" + K + "*"), S = new RegExp("=" + K + "*([^\\]'\"]*?)" + K + "*\\]", "g"), T = new RegExp(O), U = new RegExp("^" + M + "$"), V = {
            ID: new RegExp("^#(" + L + ")"),
            CLASS: new RegExp("^\\.(" + L + ")"),
            TAG: new RegExp("^(" + L.replace("w", "w*") + ")"),
            ATTR: new RegExp("^" + N),
            PSEUDO: new RegExp("^" + O),
            CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + K + "*(even|odd|(([+-]|)(\\d*)n|)" + K + "*(?:([+-]|)" + K + "*(\\d+)|))" + K + "*\\)|)", "i"),
            bool: new RegExp("^(?:" + J + ")$", "i"),
            needsContext: new RegExp("^" + K + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + K + "*((?:-\\d)?\\d*)" + K + "*\\)|)(?=[^-]|$)", "i")
        }, W = /^(?:input|select|textarea|button)$/i, X = /^h\d$/i, Y = /^[^{]+\{\s*\[native \w/, Z = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, $ = /[+~]/, _ = /'|\\/g, ab = new RegExp("\\\\([\\da-f]{1,6}" + K + "?|(" + K + ")|.)", "ig"), bb = function(a, b, c) {
            var d = "0x" + b - 65536;
            return d !== d || c ? b : 0 > d ? String.fromCharCode(d + 65536) : String.fromCharCode(d >> 10 | 55296, 1023 & d | 56320);
        };
        try {
            G.apply(D = H.call(t.childNodes), t.childNodes), D[t.childNodes.length].nodeType;
        } catch (cb) {
            G = {
                apply: D.length ? function(a, b) {
                    F.apply(a, H.call(b));
                } : function(a, b) {
                    var c = a.length, d = 0;
                    while (a[c++] = b[d++]) ;
                    a.length = c - 1;
                }
            };
        }
        function db(a, b, d, e) {
            var f, g, h, i, j, m, p, q, u, v;
            if ((b ? b.ownerDocument || b : t) !== l && k(b), b = b || l, d = d || [], !a || "string" != typeof a) return d;
            if (1 !== (i = b.nodeType) && 9 !== i) return [];
            if (n && !e) {
                if (f = Z.exec(a)) if (h = f[1]) {
                    if (9 === i) {
                        if (g = b.getElementById(h), !g || !g.parentNode) return d;
                        if (g.id === h) return d.push(g), d;
                    } else if (b.ownerDocument && (g = b.ownerDocument.getElementById(h)) && r(b, g) && g.id === h) return d.push(g), 
                    d;
                } else {
                    if (f[2]) return G.apply(d, b.getElementsByTagName(a)), d;
                    if ((h = f[3]) && c.getElementsByClassName && b.getElementsByClassName) return G.apply(d, b.getElementsByClassName(h)), 
                    d;
                }
                if (c.qsa && (!o || !o.test(a))) {
                    if (q = p = s, u = b, v = 9 === i && a, 1 === i && "object" !== b.nodeName.toLowerCase()) {
                        m = ob(a), (p = b.getAttribute("id")) ? q = p.replace(_, "\\$&") : b.setAttribute("id", q), 
                        q = "[id='" + q + "'] ", j = m.length;
                        while (j--) m[j] = q + pb(m[j]);
                        u = $.test(a) && mb(b.parentNode) || b, v = m.join(",");
                    }
                    if (v) try {
                        return G.apply(d, u.querySelectorAll(v)), d;
                    } catch (w) {} finally {
                        p || b.removeAttribute("id");
                    }
                }
            }
            return xb(a.replace(P, "$1"), b, d, e);
        }
        function eb() {
            var a = [];
            function b(c, e) {
                return a.push(c + " ") > d.cacheLength && delete b[a.shift()], b[c + " "] = e;
            }
            return b;
        }
        function fb(a) {
            return a[s] = !0, a;
        }
        function gb(a) {
            var b = l.createElement("div");
            try {
                return !!a(b);
            } catch (c) {
                return !1;
            } finally {
                b.parentNode && b.parentNode.removeChild(b), b = null;
            }
        }
        function hb(a, b) {
            var c = a.split("|"), e = a.length;
            while (e--) d.attrHandle[c[e]] = b;
        }
        function ib(a, b) {
            var c = b && a, d = c && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || B) - (~a.sourceIndex || B);
            if (d) return d;
            if (c) while (c = c.nextSibling) if (c === b) return -1;
            return a ? 1 : -1;
        }
        function jb(a) {
            return function(b) {
                var c = b.nodeName.toLowerCase();
                return "input" === c && b.type === a;
            };
        }
        function kb(a) {
            return function(b) {
                var c = b.nodeName.toLowerCase();
                return ("input" === c || "button" === c) && b.type === a;
            };
        }
        function lb(a) {
            return fb(function(b) {
                return b = +b, fb(function(c, d) {
                    var e, f = a([], c.length, b), g = f.length;
                    while (g--) c[e = f[g]] && (c[e] = !(d[e] = c[e]));
                });
            });
        }
        function mb(a) {
            return a && typeof a.getElementsByTagName !== A && a;
        }
        c = db.support = {}, f = db.isXML = function(a) {
            var b = a && (a.ownerDocument || a).documentElement;
            return b ? "HTML" !== b.nodeName : !1;
        }, k = db.setDocument = function(a) {
            var b, e = a ? a.ownerDocument || a : t, g = e.defaultView;
            return e !== l && 9 === e.nodeType && e.documentElement ? (l = e, m = e.documentElement, 
            n = !f(e), g && g !== g.top && (g.addEventListener ? g.addEventListener("unload", function() {
                k();
            }, !1) : g.attachEvent && g.attachEvent("onunload", function() {
                k();
            })), c.attributes = gb(function(a) {
                return a.className = "i", !a.getAttribute("className");
            }), c.getElementsByTagName = gb(function(a) {
                return a.appendChild(e.createComment("")), !a.getElementsByTagName("*").length;
            }), c.getElementsByClassName = Y.test(e.getElementsByClassName) && gb(function(a) {
                return a.innerHTML = "<div class='a'></div><div class='a i'></div>", a.firstChild.className = "i", 
                2 === a.getElementsByClassName("i").length;
            }), c.getById = gb(function(a) {
                return m.appendChild(a).id = s, !e.getElementsByName || !e.getElementsByName(s).length;
            }), c.getById ? (d.find.ID = function(a, b) {
                if (typeof b.getElementById !== A && n) {
                    var c = b.getElementById(a);
                    return c && c.parentNode ? [ c ] : [];
                }
            }, d.filter.ID = function(a) {
                var b = a.replace(ab, bb);
                return function(a) {
                    return a.getAttribute("id") === b;
                };
            }) : (delete d.find.ID, d.filter.ID = function(a) {
                var b = a.replace(ab, bb);
                return function(a) {
                    var c = typeof a.getAttributeNode !== A && a.getAttributeNode("id");
                    return c && c.value === b;
                };
            }), d.find.TAG = c.getElementsByTagName ? function(a, b) {
                return typeof b.getElementsByTagName !== A ? b.getElementsByTagName(a) : void 0;
            } : function(a, b) {
                var c, d = [], e = 0, f = b.getElementsByTagName(a);
                if ("*" === a) {
                    while (c = f[e++]) 1 === c.nodeType && d.push(c);
                    return d;
                }
                return f;
            }, d.find.CLASS = c.getElementsByClassName && function(a, b) {
                return typeof b.getElementsByClassName !== A && n ? b.getElementsByClassName(a) : void 0;
            }, p = [], o = [], (c.qsa = Y.test(e.querySelectorAll)) && (gb(function(a) {
                a.innerHTML = "<select t=''><option selected=''></option></select>", a.querySelectorAll("[t^='']").length && o.push("[*^$]=" + K + "*(?:''|\"\")"), 
                a.querySelectorAll("[selected]").length || o.push("\\[" + K + "*(?:value|" + J + ")"), 
                a.querySelectorAll(":checked").length || o.push(":checked");
            }), gb(function(a) {
                var b = e.createElement("input");
                b.setAttribute("type", "hidden"), a.appendChild(b).setAttribute("name", "D"), a.querySelectorAll("[name=d]").length && o.push("name" + K + "*[*^$|!~]?="), 
                a.querySelectorAll(":enabled").length || o.push(":enabled", ":disabled"), a.querySelectorAll("*,:x"), 
                o.push(",.*:");
            })), (c.matchesSelector = Y.test(q = m.webkitMatchesSelector || m.mozMatchesSelector || m.oMatchesSelector || m.msMatchesSelector)) && gb(function(a) {
                c.disconnectedMatch = q.call(a, "div"), q.call(a, "[s!='']:x"), p.push("!=", O);
            }), o = o.length && new RegExp(o.join("|")), p = p.length && new RegExp(p.join("|")), 
            b = Y.test(m.compareDocumentPosition), r = b || Y.test(m.contains) ? function(a, b) {
                var c = 9 === a.nodeType ? a.documentElement : a, d = b && b.parentNode;
                return a === d || !(!d || 1 !== d.nodeType || !(c.contains ? c.contains(d) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d)));
            } : function(a, b) {
                if (b) while (b = b.parentNode) if (b === a) return !0;
                return !1;
            }, z = b ? function(a, b) {
                if (a === b) return j = !0, 0;
                var d = !a.compareDocumentPosition - !b.compareDocumentPosition;
                return d ? d : (d = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1, 
                1 & d || !c.sortDetached && b.compareDocumentPosition(a) === d ? a === e || a.ownerDocument === t && r(t, a) ? -1 : b === e || b.ownerDocument === t && r(t, b) ? 1 : i ? I.call(i, a) - I.call(i, b) : 0 : 4 & d ? -1 : 1);
            } : function(a, b) {
                if (a === b) return j = !0, 0;
                var c, d = 0, f = a.parentNode, g = b.parentNode, h = [ a ], k = [ b ];
                if (!f || !g) return a === e ? -1 : b === e ? 1 : f ? -1 : g ? 1 : i ? I.call(i, a) - I.call(i, b) : 0;
                if (f === g) return ib(a, b);
                c = a;
                while (c = c.parentNode) h.unshift(c);
                c = b;
                while (c = c.parentNode) k.unshift(c);
                while (h[d] === k[d]) d++;
                return d ? ib(h[d], k[d]) : h[d] === t ? -1 : k[d] === t ? 1 : 0;
            }, e) : l;
        }, db.matches = function(a, b) {
            return db(a, null, null, b);
        }, db.matchesSelector = function(a, b) {
            if ((a.ownerDocument || a) !== l && k(a), b = b.replace(S, "='$1']"), !(!c.matchesSelector || !n || p && p.test(b) || o && o.test(b))) try {
                var d = q.call(a, b);
                if (d || c.disconnectedMatch || a.document && 11 !== a.document.nodeType) return d;
            } catch (e) {}
            return db(b, l, null, [ a ]).length > 0;
        }, db.contains = function(a, b) {
            return (a.ownerDocument || a) !== l && k(a), r(a, b);
        }, db.attr = function(a, b) {
            (a.ownerDocument || a) !== l && k(a);
            var e = d.attrHandle[b.toLowerCase()], f = e && C.call(d.attrHandle, b.toLowerCase()) ? e(a, b, !n) : void 0;
            return void 0 !== f ? f : c.attributes || !n ? a.getAttribute(b) : (f = a.getAttributeNode(b)) && f.specified ? f.value : null;
        }, db.error = function(a) {
            throw new Error("Syntax error, unrecognized expression: " + a);
        }, db.uniqueSort = function(a) {
            var b, d = [], e = 0, f = 0;
            if (j = !c.detectDuplicates, i = !c.sortStable && a.slice(0), a.sort(z), j) {
                while (b = a[f++]) b === a[f] && (e = d.push(f));
                while (e--) a.splice(d[e], 1);
            }
            return i = null, a;
        }, e = db.getText = function(a) {
            var b, c = "", d = 0, f = a.nodeType;
            if (f) {
                if (1 === f || 9 === f || 11 === f) {
                    if ("string" == typeof a.textContent) return a.textContent;
                    for (a = a.firstChild; a; a = a.nextSibling) c += e(a);
                } else if (3 === f || 4 === f) return a.nodeValue;
            } else while (b = a[d++]) c += e(b);
            return c;
        }, d = db.selectors = {
            cacheLength: 50,
            createPseudo: fb,
            match: V,
            attrHandle: {},
            find: {},
            relative: {
                ">": {
                    dir: "parentNode",
                    first: !0
                },
                " ": {
                    dir: "parentNode"
                },
                "+": {
                    dir: "previousSibling",
                    first: !0
                },
                "~": {
                    dir: "previousSibling"
                }
            },
            preFilter: {
                ATTR: function(a) {
                    return a[1] = a[1].replace(ab, bb), a[3] = (a[4] || a[5] || "").replace(ab, bb), 
                    "~=" === a[2] && (a[3] = " " + a[3] + " "), a.slice(0, 4);
                },
                CHILD: function(a) {
                    return a[1] = a[1].toLowerCase(), "nth" === a[1].slice(0, 3) ? (a[3] || db.error(a[0]), 
                    a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * ("even" === a[3] || "odd" === a[3])), a[5] = +(a[7] + a[8] || "odd" === a[3])) : a[3] && db.error(a[0]), 
                    a;
                },
                PSEUDO: function(a) {
                    var b, c = !a[5] && a[2];
                    return V.CHILD.test(a[0]) ? null : (a[3] && void 0 !== a[4] ? a[2] = a[4] : c && T.test(c) && (b = ob(c, !0)) && (b = c.indexOf(")", c.length - b) - c.length) && (a[0] = a[0].slice(0, b), 
                    a[2] = c.slice(0, b)), a.slice(0, 3));
                }
            },
            filter: {
                TAG: function(a) {
                    var b = a.replace(ab, bb).toLowerCase();
                    return "*" === a ? function() {
                        return !0;
                    } : function(a) {
                        return a.nodeName && a.nodeName.toLowerCase() === b;
                    };
                },
                CLASS: function(a) {
                    var b = w[a + " "];
                    return b || (b = new RegExp("(^|" + K + ")" + a + "(" + K + "|$)")) && w(a, function(a) {
                        return b.test("string" == typeof a.className && a.className || typeof a.getAttribute !== A && a.getAttribute("class") || "");
                    });
                },
                ATTR: function(a, b, c) {
                    return function(d) {
                        var e = db.attr(d, a);
                        return null == e ? "!=" === b : b ? (e += "", "=" === b ? e === c : "!=" === b ? e !== c : "^=" === b ? c && 0 === e.indexOf(c) : "*=" === b ? c && e.indexOf(c) > -1 : "$=" === b ? c && e.slice(-c.length) === c : "~=" === b ? (" " + e + " ").indexOf(c) > -1 : "|=" === b ? e === c || e.slice(0, c.length + 1) === c + "-" : !1) : !0;
                    };
                },
                CHILD: function(a, b, c, d, e) {
                    var f = "nth" !== a.slice(0, 3), g = "last" !== a.slice(-4), h = "of-type" === b;
                    return 1 === d && 0 === e ? function(a) {
                        return !!a.parentNode;
                    } : function(b, c, i) {
                        var j, k, l, m, n, o, p = f !== g ? "nextSibling" : "previousSibling", q = b.parentNode, r = h && b.nodeName.toLowerCase(), t = !i && !h;
                        if (q) {
                            if (f) {
                                while (p) {
                                    l = b;
                                    while (l = l[p]) if (h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType) return !1;
                                    o = p = "only" === a && !o && "nextSibling";
                                }
                                return !0;
                            }
                            if (o = [ g ? q.firstChild : q.lastChild ], g && t) {
                                k = q[s] || (q[s] = {}), j = k[a] || [], n = j[0] === u && j[1], m = j[0] === u && j[2], 
                                l = n && q.childNodes[n];
                                while (l = ++n && l && l[p] || (m = n = 0) || o.pop()) if (1 === l.nodeType && ++m && l === b) {
                                    k[a] = [ u, n, m ];
                                    break;
                                }
                            } else if (t && (j = (b[s] || (b[s] = {}))[a]) && j[0] === u) m = j[1]; else while (l = ++n && l && l[p] || (m = n = 0) || o.pop()) if ((h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType) && ++m && (t && ((l[s] || (l[s] = {}))[a] = [ u, m ]), 
                            l === b)) break;
                            return m -= e, m === d || m % d === 0 && m / d >= 0;
                        }
                    };
                },
                PSEUDO: function(a, b) {
                    var c, e = d.pseudos[a] || d.setFilters[a.toLowerCase()] || db.error("unsupported pseudo: " + a);
                    return e[s] ? e(b) : e.length > 1 ? (c = [ a, a, "", b ], d.setFilters.hasOwnProperty(a.toLowerCase()) ? fb(function(a, c) {
                        var d, f = e(a, b), g = f.length;
                        while (g--) d = I.call(a, f[g]), a[d] = !(c[d] = f[g]);
                    }) : function(a) {
                        return e(a, 0, c);
                    }) : e;
                }
            },
            pseudos: {
                not: fb(function(a) {
                    var b = [], c = [], d = g(a.replace(P, "$1"));
                    return d[s] ? fb(function(a, b, c, e) {
                        var f, g = d(a, null, e, []), h = a.length;
                        while (h--) (f = g[h]) && (a[h] = !(b[h] = f));
                    }) : function(a, e, f) {
                        return b[0] = a, d(b, null, f, c), !c.pop();
                    };
                }),
                has: fb(function(a) {
                    return function(b) {
                        return db(a, b).length > 0;
                    };
                }),
                contains: fb(function(a) {
                    return function(b) {
                        return (b.textContent || b.innerText || e(b)).indexOf(a) > -1;
                    };
                }),
                lang: fb(function(a) {
                    return U.test(a || "") || db.error("unsupported lang: " + a), a = a.replace(ab, bb).toLowerCase(), 
                    function(b) {
                        var c;
                        do if (c = n ? b.lang : b.getAttribute("xml:lang") || b.getAttribute("lang")) return c = c.toLowerCase(), 
                        c === a || 0 === c.indexOf(a + "-"); while ((b = b.parentNode) && 1 === b.nodeType);
                        return !1;
                    };
                }),
                target: function(b) {
                    var c = a.location && a.location.hash;
                    return c && c.slice(1) === b.id;
                },
                root: function(a) {
                    return a === m;
                },
                focus: function(a) {
                    return a === l.activeElement && (!l.hasFocus || l.hasFocus()) && !!(a.type || a.href || ~a.tabIndex);
                },
                enabled: function(a) {
                    return a.disabled === !1;
                },
                disabled: function(a) {
                    return a.disabled === !0;
                },
                checked: function(a) {
                    var b = a.nodeName.toLowerCase();
                    return "input" === b && !!a.checked || "option" === b && !!a.selected;
                },
                selected: function(a) {
                    return a.parentNode && a.parentNode.selectedIndex, a.selected === !0;
                },
                empty: function(a) {
                    for (a = a.firstChild; a; a = a.nextSibling) if (a.nodeType < 6) return !1;
                    return !0;
                },
                parent: function(a) {
                    return !d.pseudos.empty(a);
                },
                header: function(a) {
                    return X.test(a.nodeName);
                },
                input: function(a) {
                    return W.test(a.nodeName);
                },
                button: function(a) {
                    var b = a.nodeName.toLowerCase();
                    return "input" === b && "button" === a.type || "button" === b;
                },
                text: function(a) {
                    var b;
                    return "input" === a.nodeName.toLowerCase() && "text" === a.type && (null == (b = a.getAttribute("type")) || "text" === b.toLowerCase());
                },
                first: lb(function() {
                    return [ 0 ];
                }),
                last: lb(function(a, b) {
                    return [ b - 1 ];
                }),
                eq: lb(function(a, b, c) {
                    return [ 0 > c ? c + b : c ];
                }),
                even: lb(function(a, b) {
                    for (var c = 0; b > c; c += 2) a.push(c);
                    return a;
                }),
                odd: lb(function(a, b) {
                    for (var c = 1; b > c; c += 2) a.push(c);
                    return a;
                }),
                lt: lb(function(a, b, c) {
                    for (var d = 0 > c ? c + b : c; --d >= 0; ) a.push(d);
                    return a;
                }),
                gt: lb(function(a, b, c) {
                    for (var d = 0 > c ? c + b : c; ++d < b; ) a.push(d);
                    return a;
                })
            }
        }, d.pseudos.nth = d.pseudos.eq;
        for (b in {
            radio: !0,
            checkbox: !0,
            file: !0,
            password: !0,
            image: !0
        }) d.pseudos[b] = jb(b);
        for (b in {
            submit: !0,
            reset: !0
        }) d.pseudos[b] = kb(b);
        function nb() {}
        nb.prototype = d.filters = d.pseudos, d.setFilters = new nb();
        function ob(a, b) {
            var c, e, f, g, h, i, j, k = x[a + " "];
            if (k) return b ? 0 : k.slice(0);
            h = a, i = [], j = d.preFilter;
            while (h) {
                (!c || (e = Q.exec(h))) && (e && (h = h.slice(e[0].length) || h), i.push(f = [])), 
                c = !1, (e = R.exec(h)) && (c = e.shift(), f.push({
                    value: c,
                    type: e[0].replace(P, " ")
                }), h = h.slice(c.length));
                for (g in d.filter) !(e = V[g].exec(h)) || j[g] && !(e = j[g](e)) || (c = e.shift(), 
                f.push({
                    value: c,
                    type: g,
                    matches: e
                }), h = h.slice(c.length));
                if (!c) break;
            }
            return b ? h.length : h ? db.error(a) : x(a, i).slice(0);
        }
        function pb(a) {
            for (var b = 0, c = a.length, d = ""; c > b; b++) d += a[b].value;
            return d;
        }
        function qb(a, b, c) {
            var d = b.dir, e = c && "parentNode" === d, f = v++;
            return b.first ? function(b, c, f) {
                while (b = b[d]) if (1 === b.nodeType || e) return a(b, c, f);
            } : function(b, c, g) {
                var h, i, j = [ u, f ];
                if (g) {
                    while (b = b[d]) if ((1 === b.nodeType || e) && a(b, c, g)) return !0;
                } else while (b = b[d]) if (1 === b.nodeType || e) {
                    if (i = b[s] || (b[s] = {}), (h = i[d]) && h[0] === u && h[1] === f) return j[2] = h[2];
                    if (i[d] = j, j[2] = a(b, c, g)) return !0;
                }
            };
        }
        function rb(a) {
            return a.length > 1 ? function(b, c, d) {
                var e = a.length;
                while (e--) if (!a[e](b, c, d)) return !1;
                return !0;
            } : a[0];
        }
        function sb(a, b, c, d, e) {
            for (var f, g = [], h = 0, i = a.length, j = null != b; i > h; h++) (f = a[h]) && (!c || c(f, d, e)) && (g.push(f), 
            j && b.push(h));
            return g;
        }
        function tb(a, b, c, d, e, f) {
            return d && !d[s] && (d = tb(d)), e && !e[s] && (e = tb(e, f)), fb(function(f, g, h, i) {
                var j, k, l, m = [], n = [], o = g.length, p = f || wb(b || "*", h.nodeType ? [ h ] : h, []), q = !a || !f && b ? p : sb(p, m, a, h, i), r = c ? e || (f ? a : o || d) ? [] : g : q;
                if (c && c(q, r, h, i), d) {
                    j = sb(r, n), d(j, [], h, i), k = j.length;
                    while (k--) (l = j[k]) && (r[n[k]] = !(q[n[k]] = l));
                }
                if (f) {
                    if (e || a) {
                        if (e) {
                            j = [], k = r.length;
                            while (k--) (l = r[k]) && j.push(q[k] = l);
                            e(null, r = [], j, i);
                        }
                        k = r.length;
                        while (k--) (l = r[k]) && (j = e ? I.call(f, l) : m[k]) > -1 && (f[j] = !(g[j] = l));
                    }
                } else r = sb(r === g ? r.splice(o, r.length) : r), e ? e(null, g, r, i) : G.apply(g, r);
            });
        }
        function ub(a) {
            for (var b, c, e, f = a.length, g = d.relative[a[0].type], i = g || d.relative[" "], j = g ? 1 : 0, k = qb(function(a) {
                return a === b;
            }, i, !0), l = qb(function(a) {
                return I.call(b, a) > -1;
            }, i, !0), m = [ function(a, c, d) {
                return !g && (d || c !== h) || ((b = c).nodeType ? k(a, c, d) : l(a, c, d));
            } ]; f > j; j++) if (c = d.relative[a[j].type]) m = [ qb(rb(m), c) ]; else {
                if (c = d.filter[a[j].type].apply(null, a[j].matches), c[s]) {
                    for (e = ++j; f > e; e++) if (d.relative[a[e].type]) break;
                    return tb(j > 1 && rb(m), j > 1 && pb(a.slice(0, j - 1).concat({
                        value: " " === a[j - 2].type ? "*" : ""
                    })).replace(P, "$1"), c, e > j && ub(a.slice(j, e)), f > e && ub(a = a.slice(e)), f > e && pb(a));
                }
                m.push(c);
            }
            return rb(m);
        }
        function vb(a, b) {
            var c = b.length > 0, e = a.length > 0, f = function(f, g, i, j, k) {
                var m, n, o, p = 0, q = "0", r = f && [], s = [], t = h, v = f || e && d.find.TAG("*", k), w = u += null == t ? 1 : Math.random() || .1, x = v.length;
                for (k && (h = g !== l && g); q !== x && null != (m = v[q]); q++) {
                    if (e && m) {
                        n = 0;
                        while (o = a[n++]) if (o(m, g, i)) {
                            j.push(m);
                            break;
                        }
                        k && (u = w);
                    }
                    c && ((m = !o && m) && p--, f && r.push(m));
                }
                if (p += q, c && q !== p) {
                    n = 0;
                    while (o = b[n++]) o(r, s, g, i);
                    if (f) {
                        if (p > 0) while (q--) r[q] || s[q] || (s[q] = E.call(j));
                        s = sb(s);
                    }
                    G.apply(j, s), k && !f && s.length > 0 && p + b.length > 1 && db.uniqueSort(j);
                }
                return k && (u = w, h = t), r;
            };
            return c ? fb(f) : f;
        }
        g = db.compile = function(a, b) {
            var c, d = [], e = [], f = y[a + " "];
            if (!f) {
                b || (b = ob(a)), c = b.length;
                while (c--) f = ub(b[c]), f[s] ? d.push(f) : e.push(f);
                f = y(a, vb(e, d));
            }
            return f;
        };
        function wb(a, b, c) {
            for (var d = 0, e = b.length; e > d; d++) db(a, b[d], c);
            return c;
        }
        function xb(a, b, e, f) {
            var h, i, j, k, l, m = ob(a);
            if (!f && 1 === m.length) {
                if (i = m[0] = m[0].slice(0), i.length > 2 && "ID" === (j = i[0]).type && c.getById && 9 === b.nodeType && n && d.relative[i[1].type]) {
                    if (b = (d.find.ID(j.matches[0].replace(ab, bb), b) || [])[0], !b) return e;
                    a = a.slice(i.shift().value.length);
                }
                h = V.needsContext.test(a) ? 0 : i.length;
                while (h--) {
                    if (j = i[h], d.relative[k = j.type]) break;
                    if ((l = d.find[k]) && (f = l(j.matches[0].replace(ab, bb), $.test(i[0].type) && mb(b.parentNode) || b))) {
                        if (i.splice(h, 1), a = f.length && pb(i), !a) return G.apply(e, f), e;
                        break;
                    }
                }
            }
            return g(a, m)(f, b, !n, e, $.test(a) && mb(b.parentNode) || b), e;
        }
        return c.sortStable = s.split("").sort(z).join("") === s, c.detectDuplicates = !!j, 
        k(), c.sortDetached = gb(function(a) {
            return 1 & a.compareDocumentPosition(l.createElement("div"));
        }), gb(function(a) {
            return a.innerHTML = "<a href='#'></a>", "#" === a.firstChild.getAttribute("href");
        }) || hb("type|href|height|width", function(a, b, c) {
            return c ? void 0 : a.getAttribute(b, "type" === b.toLowerCase() ? 1 : 2);
        }), c.attributes && gb(function(a) {
            return a.innerHTML = "<input/>", a.firstChild.setAttribute("value", ""), "" === a.firstChild.getAttribute("value");
        }) || hb("value", function(a, b, c) {
            return c || "input" !== a.nodeName.toLowerCase() ? void 0 : a.defaultValue;
        }), gb(function(a) {
            return null == a.getAttribute("disabled");
        }) || hb(J, function(a, b, c) {
            var d;
            return c ? void 0 : a[b] === !0 ? b.toLowerCase() : (d = a.getAttributeNode(b)) && d.specified ? d.value : null;
        }), db;
    }(a);
    n.find = t, n.expr = t.selectors, n.expr[":"] = n.expr.pseudos, n.unique = t.uniqueSort, 
    n.text = t.getText, n.isXMLDoc = t.isXML, n.contains = t.contains;
    var u = n.expr.match.needsContext, v = /^<(\w+)\s*\/?>(?:<\/\1>|)$/, w = /^.[^:#\[\.,]*$/;
    function x(a, b, c) {
        if (n.isFunction(b)) return n.grep(a, function(a, d) {
            return !!b.call(a, d, a) !== c;
        });
        if (b.nodeType) return n.grep(a, function(a) {
            return a === b !== c;
        });
        if ("string" == typeof b) {
            if (w.test(b)) return n.filter(b, a, c);
            b = n.filter(b, a);
        }
        return n.grep(a, function(a) {
            return n.inArray(a, b) >= 0 !== c;
        });
    }
    n.filter = function(a, b, c) {
        var d = b[0];
        return c && (a = ":not(" + a + ")"), 1 === b.length && 1 === d.nodeType ? n.find.matchesSelector(d, a) ? [ d ] : [] : n.find.matches(a, n.grep(b, function(a) {
            return 1 === a.nodeType;
        }));
    }, n.fn.extend({
        find: function(a) {
            var b, c = [], d = this, e = d.length;
            if ("string" != typeof a) return this.pushStack(n(a).filter(function() {
                for (b = 0; e > b; b++) if (n.contains(d[b], this)) return !0;
            }));
            for (b = 0; e > b; b++) n.find(a, d[b], c);
            return c = this.pushStack(e > 1 ? n.unique(c) : c), c.selector = this.selector ? this.selector + " " + a : a, 
            c;
        },
        filter: function(a) {
            return this.pushStack(x(this, a || [], !1));
        },
        not: function(a) {
            return this.pushStack(x(this, a || [], !0));
        },
        is: function(a) {
            return !!x(this, "string" == typeof a && u.test(a) ? n(a) : a || [], !1).length;
        }
    });
    var y, z = a.document, A = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/, B = n.fn.init = function(a, b) {
        var c, d;
        if (!a) return this;
        if ("string" == typeof a) {
            if (c = "<" === a.charAt(0) && ">" === a.charAt(a.length - 1) && a.length >= 3 ? [ null, a, null ] : A.exec(a), 
            !c || !c[1] && b) return !b || b.jquery ? (b || y).find(a) : this.constructor(b).find(a);
            if (c[1]) {
                if (b = b instanceof n ? b[0] : b, n.merge(this, n.parseHTML(c[1], b && b.nodeType ? b.ownerDocument || b : z, !0)), 
                v.test(c[1]) && n.isPlainObject(b)) for (c in b) n.isFunction(this[c]) ? this[c](b[c]) : this.attr(c, b[c]);
                return this;
            }
            if (d = z.getElementById(c[2]), d && d.parentNode) {
                if (d.id !== c[2]) return y.find(a);
                this.length = 1, this[0] = d;
            }
            return this.context = z, this.selector = a, this;
        }
        return a.nodeType ? (this.context = this[0] = a, this.length = 1, this) : n.isFunction(a) ? "undefined" != typeof y.ready ? y.ready(a) : a(n) : (void 0 !== a.selector && (this.selector = a.selector, 
        this.context = a.context), n.makeArray(a, this));
    };
    B.prototype = n.fn, y = n(z);
    var C = /^(?:parents|prev(?:Until|All))/, D = {
        children: !0,
        contents: !0,
        next: !0,
        prev: !0
    };
    n.extend({
        dir: function(a, b, c) {
            var d = [], e = a[b];
            while (e && 9 !== e.nodeType && (void 0 === c || 1 !== e.nodeType || !n(e).is(c))) 1 === e.nodeType && d.push(e), 
            e = e[b];
            return d;
        },
        sibling: function(a, b) {
            for (var c = []; a; a = a.nextSibling) 1 === a.nodeType && a !== b && c.push(a);
            return c;
        }
    }), n.fn.extend({
        has: function(a) {
            var b, c = n(a, this), d = c.length;
            return this.filter(function() {
                for (b = 0; d > b; b++) if (n.contains(this, c[b])) return !0;
            });
        },
        closest: function(a, b) {
            for (var c, d = 0, e = this.length, f = [], g = u.test(a) || "string" != typeof a ? n(a, b || this.context) : 0; e > d; d++) for (c = this[d]; c && c !== b; c = c.parentNode) if (c.nodeType < 11 && (g ? g.index(c) > -1 : 1 === c.nodeType && n.find.matchesSelector(c, a))) {
                f.push(c);
                break;
            }
            return this.pushStack(f.length > 1 ? n.unique(f) : f);
        },
        index: function(a) {
            return a ? "string" == typeof a ? n.inArray(this[0], n(a)) : n.inArray(a.jquery ? a[0] : a, this) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
        },
        add: function(a, b) {
            return this.pushStack(n.unique(n.merge(this.get(), n(a, b))));
        },
        addBack: function(a) {
            return this.add(null == a ? this.prevObject : this.prevObject.filter(a));
        }
    });
    function E(a, b) {
        do a = a[b]; while (a && 1 !== a.nodeType);
        return a;
    }
    n.each({
        parent: function(a) {
            var b = a.parentNode;
            return b && 11 !== b.nodeType ? b : null;
        },
        parents: function(a) {
            return n.dir(a, "parentNode");
        },
        parentsUntil: function(a, b, c) {
            return n.dir(a, "parentNode", c);
        },
        next: function(a) {
            return E(a, "nextSibling");
        },
        prev: function(a) {
            return E(a, "previousSibling");
        },
        nextAll: function(a) {
            return n.dir(a, "nextSibling");
        },
        prevAll: function(a) {
            return n.dir(a, "previousSibling");
        },
        nextUntil: function(a, b, c) {
            return n.dir(a, "nextSibling", c);
        },
        prevUntil: function(a, b, c) {
            return n.dir(a, "previousSibling", c);
        },
        siblings: function(a) {
            return n.sibling((a.parentNode || {}).firstChild, a);
        },
        children: function(a) {
            return n.sibling(a.firstChild);
        },
        contents: function(a) {
            return n.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : n.merge([], a.childNodes);
        }
    }, function(a, b) {
        n.fn[a] = function(c, d) {
            var e = n.map(this, b, c);
            return "Until" !== a.slice(-5) && (d = c), d && "string" == typeof d && (e = n.filter(d, e)), 
            this.length > 1 && (D[a] || (e = n.unique(e)), C.test(a) && (e = e.reverse())), 
            this.pushStack(e);
        };
    });
    var F = /\S+/g, G = {};
    function H(a) {
        var b = G[a] = {};
        return n.each(a.match(F) || [], function(a, c) {
            b[c] = !0;
        }), b;
    }
    n.Callbacks = function(a) {
        a = "string" == typeof a ? G[a] || H(a) : n.extend({}, a);
        var b, c, d, e, f, g, h = [], i = !a.once && [], j = function(l) {
            for (c = a.memory && l, d = !0, f = g || 0, g = 0, e = h.length, b = !0; h && e > f; f++) if (h[f].apply(l[0], l[1]) === !1 && a.stopOnFalse) {
                c = !1;
                break;
            }
            b = !1, h && (i ? i.length && j(i.shift()) : c ? h = [] : k.disable());
        }, k = {
            add: function() {
                if (h) {
                    var d = h.length;
                    !function f(b) {
                        n.each(b, function(b, c) {
                            var d = n.type(c);
                            "function" === d ? a.unique && k.has(c) || h.push(c) : c && c.length && "string" !== d && f(c);
                        });
                    }(arguments), b ? e = h.length : c && (g = d, j(c));
                }
                return this;
            },
            remove: function() {
                return h && n.each(arguments, function(a, c) {
                    var d;
                    while ((d = n.inArray(c, h, d)) > -1) h.splice(d, 1), b && (e >= d && e--, f >= d && f--);
                }), this;
            },
            has: function(a) {
                return a ? n.inArray(a, h) > -1 : !(!h || !h.length);
            },
            empty: function() {
                return h = [], e = 0, this;
            },
            disable: function() {
                return h = i = c = void 0, this;
            },
            disabled: function() {
                return !h;
            },
            lock: function() {
                return i = void 0, c || k.disable(), this;
            },
            locked: function() {
                return !i;
            },
            fireWith: function(a, c) {
                return !h || d && !i || (c = c || [], c = [ a, c.slice ? c.slice() : c ], b ? i.push(c) : j(c)), 
                this;
            },
            fire: function() {
                return k.fireWith(this, arguments), this;
            },
            fired: function() {
                return !!d;
            }
        };
        return k;
    }, n.extend({
        Deferred: function(a) {
            var b = [ [ "resolve", "done", n.Callbacks("once memory"), "resolved" ], [ "reject", "fail", n.Callbacks("once memory"), "rejected" ], [ "notify", "progress", n.Callbacks("memory") ] ], c = "pending", d = {
                state: function() {
                    return c;
                },
                always: function() {
                    return e.done(arguments).fail(arguments), this;
                },
                then: function() {
                    var a = arguments;
                    return n.Deferred(function(c) {
                        n.each(b, function(b, f) {
                            var g = n.isFunction(a[b]) && a[b];
                            e[f[1]](function() {
                                var a = g && g.apply(this, arguments);
                                a && n.isFunction(a.promise) ? a.promise().done(c.resolve).fail(c.reject).progress(c.notify) : c[f[0] + "With"](this === d ? c.promise() : this, g ? [ a ] : arguments);
                            });
                        }), a = null;
                    }).promise();
                },
                promise: function(a) {
                    return null != a ? n.extend(a, d) : d;
                }
            }, e = {};
            return d.pipe = d.then, n.each(b, function(a, f) {
                var g = f[2], h = f[3];
                d[f[1]] = g.add, h && g.add(function() {
                    c = h;
                }, b[1 ^ a][2].disable, b[2][2].lock), e[f[0]] = function() {
                    return e[f[0] + "With"](this === e ? d : this, arguments), this;
                }, e[f[0] + "With"] = g.fireWith;
            }), d.promise(e), a && a.call(e, e), e;
        },
        when: function(a) {
            var b = 0, c = d.call(arguments), e = c.length, f = 1 !== e || a && n.isFunction(a.promise) ? e : 0, g = 1 === f ? a : n.Deferred(), h = function(a, b, c) {
                return function(e) {
                    b[a] = this, c[a] = arguments.length > 1 ? d.call(arguments) : e, c === i ? g.notifyWith(b, c) : --f || g.resolveWith(b, c);
                };
            }, i, j, k;
            if (e > 1) for (i = new Array(e), j = new Array(e), k = new Array(e); e > b; b++) c[b] && n.isFunction(c[b].promise) ? c[b].promise().done(h(b, k, c)).fail(g.reject).progress(h(b, j, i)) : --f;
            return f || g.resolveWith(k, c), g.promise();
        }
    });
    var I;
    n.fn.ready = function(a) {
        return n.ready.promise().done(a), this;
    }, n.extend({
        isReady: !1,
        readyWait: 1,
        holdReady: function(a) {
            a ? n.readyWait++ : n.ready(!0);
        },
        ready: function(a) {
            if (a === !0 ? !--n.readyWait : !n.isReady) {
                if (!z.body) return setTimeout(n.ready);
                n.isReady = !0, a !== !0 && --n.readyWait > 0 || (I.resolveWith(z, [ n ]), n.fn.trigger && n(z).trigger("ready").off("ready"));
            }
        }
    });
    function J() {
        z.addEventListener ? (z.removeEventListener("DOMContentLoaded", K, !1), a.removeEventListener("load", K, !1)) : (z.detachEvent("onreadystatechange", K), 
        a.detachEvent("onload", K));
    }
    function K() {
        (z.addEventListener || "load" === event.type || "complete" === z.readyState) && (J(), 
        n.ready());
    }
    n.ready.promise = function(b) {
        if (!I) if (I = n.Deferred(), "complete" === z.readyState) setTimeout(n.ready); else if (z.addEventListener) z.addEventListener("DOMContentLoaded", K, !1), 
        a.addEventListener("load", K, !1); else {
            z.attachEvent("onreadystatechange", K), a.attachEvent("onload", K);
            var c = !1;
            try {
                c = null == a.frameElement && z.documentElement;
            } catch (d) {}
            c && c.doScroll && !function e() {
                if (!n.isReady) {
                    try {
                        c.doScroll("left");
                    } catch (a) {
                        return setTimeout(e, 50);
                    }
                    J(), n.ready();
                }
            }();
        }
        return I.promise(b);
    };
    var L = "undefined", M;
    for (M in n(l)) break;
    l.ownLast = "0" !== M, l.inlineBlockNeedsLayout = !1, n(function() {
        var a, b, c = z.getElementsByTagName("body")[0];
        c && (a = z.createElement("div"), a.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px", 
        b = z.createElement("div"), c.appendChild(a).appendChild(b), typeof b.style.zoom !== L && (b.style.cssText = "border:0;margin:0;width:1px;padding:1px;display:inline;zoom:1", 
        (l.inlineBlockNeedsLayout = 3 === b.offsetWidth) && (c.style.zoom = 1)), c.removeChild(a), 
        a = b = null);
    }), function() {
        var a = z.createElement("div");
        if (null == l.deleteExpando) {
            l.deleteExpando = !0;
            try {
                delete a.test;
            } catch (b) {
                l.deleteExpando = !1;
            }
        }
        a = null;
    }(), n.acceptData = function(a) {
        var b = n.noData[(a.nodeName + " ").toLowerCase()], c = +a.nodeType || 1;
        return 1 !== c && 9 !== c ? !1 : !b || b !== !0 && a.getAttribute("classid") === b;
    };
    var N = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, O = /([A-Z])/g;
    function P(a, b, c) {
        if (void 0 === c && 1 === a.nodeType) {
            var d = "data-" + b.replace(O, "-$1").toLowerCase();
            if (c = a.getAttribute(d), "string" == typeof c) {
                try {
                    c = "true" === c ? !0 : "false" === c ? !1 : "null" === c ? null : +c + "" === c ? +c : N.test(c) ? n.parseJSON(c) : c;
                } catch (e) {}
                n.data(a, b, c);
            } else c = void 0;
        }
        return c;
    }
    function Q(a) {
        var b;
        for (b in a) if (("data" !== b || !n.isEmptyObject(a[b])) && "toJSON" !== b) return !1;
        return !0;
    }
    function R(a, b, d, e) {
        if (n.acceptData(a)) {
            var f, g, h = n.expando, i = a.nodeType, j = i ? n.cache : a, k = i ? a[h] : a[h] && h;
            if (k && j[k] && (e || j[k].data) || void 0 !== d || "string" != typeof b) return k || (k = i ? a[h] = c.pop() || n.guid++ : h), 
            j[k] || (j[k] = i ? {} : {
                toJSON: n.noop
            }), ("object" == typeof b || "function" == typeof b) && (e ? j[k] = n.extend(j[k], b) : j[k].data = n.extend(j[k].data, b)), 
            g = j[k], e || (g.data || (g.data = {}), g = g.data), void 0 !== d && (g[n.camelCase(b)] = d), 
            "string" == typeof b ? (f = g[b], null == f && (f = g[n.camelCase(b)])) : f = g, 
            f;
        }
    }
    function S(a, b, c) {
        if (n.acceptData(a)) {
            var d, e, f = a.nodeType, g = f ? n.cache : a, h = f ? a[n.expando] : n.expando;
            if (g[h]) {
                if (b && (d = c ? g[h] : g[h].data)) {
                    n.isArray(b) ? b = b.concat(n.map(b, n.camelCase)) : b in d ? b = [ b ] : (b = n.camelCase(b), 
                    b = b in d ? [ b ] : b.split(" ")), e = b.length;
                    while (e--) delete d[b[e]];
                    if (c ? !Q(d) : !n.isEmptyObject(d)) return;
                }
                (c || (delete g[h].data, Q(g[h]))) && (f ? n.cleanData([ a ], !0) : l.deleteExpando || g != g.window ? delete g[h] : g[h] = null);
            }
        }
    }
    n.extend({
        cache: {},
        noData: {
            "applet ": !0,
            "embed ": !0,
            "object ": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
        },
        hasData: function(a) {
            return a = a.nodeType ? n.cache[a[n.expando]] : a[n.expando], !!a && !Q(a);
        },
        data: function(a, b, c) {
            return R(a, b, c);
        },
        removeData: function(a, b) {
            return S(a, b);
        },
        _data: function(a, b, c) {
            return R(a, b, c, !0);
        },
        _removeData: function(a, b) {
            return S(a, b, !0);
        }
    }), n.fn.extend({
        data: function(a, b) {
            var c, d, e, f = this[0], g = f && f.attributes;
            if (void 0 === a) {
                if (this.length && (e = n.data(f), 1 === f.nodeType && !n._data(f, "parsedAttrs"))) {
                    c = g.length;
                    while (c--) d = g[c].name, 0 === d.indexOf("data-") && (d = n.camelCase(d.slice(5)), 
                    P(f, d, e[d]));
                    n._data(f, "parsedAttrs", !0);
                }
                return e;
            }
            return "object" == typeof a ? this.each(function() {
                n.data(this, a);
            }) : arguments.length > 1 ? this.each(function() {
                n.data(this, a, b);
            }) : f ? P(f, a, n.data(f, a)) : void 0;
        },
        removeData: function(a) {
            return this.each(function() {
                n.removeData(this, a);
            });
        }
    }), n.extend({
        queue: function(a, b, c) {
            var d;
            return a ? (b = (b || "fx") + "queue", d = n._data(a, b), c && (!d || n.isArray(c) ? d = n._data(a, b, n.makeArray(c)) : d.push(c)), 
            d || []) : void 0;
        },
        dequeue: function(a, b) {
            b = b || "fx";
            var c = n.queue(a, b), d = c.length, e = c.shift(), f = n._queueHooks(a, b), g = function() {
                n.dequeue(a, b);
            };
            "inprogress" === e && (e = c.shift(), d--), e && ("fx" === b && c.unshift("inprogress"), 
            delete f.stop, e.call(a, g, f)), !d && f && f.empty.fire();
        },
        _queueHooks: function(a, b) {
            var c = b + "queueHooks";
            return n._data(a, c) || n._data(a, c, {
                empty: n.Callbacks("once memory").add(function() {
                    n._removeData(a, b + "queue"), n._removeData(a, c);
                })
            });
        }
    }), n.fn.extend({
        queue: function(a, b) {
            var c = 2;
            return "string" != typeof a && (b = a, a = "fx", c--), arguments.length < c ? n.queue(this[0], a) : void 0 === b ? this : this.each(function() {
                var c = n.queue(this, a, b);
                n._queueHooks(this, a), "fx" === a && "inprogress" !== c[0] && n.dequeue(this, a);
            });
        },
        dequeue: function(a) {
            return this.each(function() {
                n.dequeue(this, a);
            });
        },
        clearQueue: function(a) {
            return this.queue(a || "fx", []);
        },
        promise: function(a, b) {
            var c, d = 1, e = n.Deferred(), f = this, g = this.length, h = function() {
                --d || e.resolveWith(f, [ f ]);
            };
            "string" != typeof a && (b = a, a = void 0), a = a || "fx";
            while (g--) c = n._data(f[g], a + "queueHooks"), c && c.empty && (d++, c.empty.add(h));
            return h(), e.promise(b);
        }
    });
    var T = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source, U = [ "Top", "Right", "Bottom", "Left" ], V = function(a, b) {
        return a = b || a, "none" === n.css(a, "display") || !n.contains(a.ownerDocument, a);
    }, W = n.access = function(a, b, c, d, e, f, g) {
        var h = 0, i = a.length, j = null == c;
        if ("object" === n.type(c)) {
            e = !0;
            for (h in c) n.access(a, b, h, c[h], !0, f, g);
        } else if (void 0 !== d && (e = !0, n.isFunction(d) || (g = !0), j && (g ? (b.call(a, d), 
        b = null) : (j = b, b = function(a, b, c) {
            return j.call(n(a), c);
        })), b)) for (;i > h; h++) b(a[h], c, g ? d : d.call(a[h], h, b(a[h], c)));
        return e ? a : j ? b.call(a) : i ? b(a[0], c) : f;
    }, X = /^(?:checkbox|radio)$/i;
    !function() {
        var a = z.createDocumentFragment(), b = z.createElement("div"), c = z.createElement("input");
        if (b.setAttribute("className", "t"), b.innerHTML = "  <link/><table></table><a href='/a'>a</a>", 
        l.leadingWhitespace = 3 === b.firstChild.nodeType, l.tbody = !b.getElementsByTagName("tbody").length, 
        l.htmlSerialize = !!b.getElementsByTagName("link").length, l.html5Clone = "<:nav></:nav>" !== z.createElement("nav").cloneNode(!0).outerHTML, 
        c.type = "checkbox", c.checked = !0, a.appendChild(c), l.appendChecked = c.checked, 
        b.innerHTML = "<textarea>x</textarea>", l.noCloneChecked = !!b.cloneNode(!0).lastChild.defaultValue, 
        a.appendChild(b), b.innerHTML = "<input type='radio' checked='checked' name='t'/>", 
        l.checkClone = b.cloneNode(!0).cloneNode(!0).lastChild.checked, l.noCloneEvent = !0, 
        b.attachEvent && (b.attachEvent("onclick", function() {
            l.noCloneEvent = !1;
        }), b.cloneNode(!0).click()), null == l.deleteExpando) {
            l.deleteExpando = !0;
            try {
                delete b.test;
            } catch (d) {
                l.deleteExpando = !1;
            }
        }
        a = b = c = null;
    }(), function() {
        var b, c, d = z.createElement("div");
        for (b in {
            submit: !0,
            change: !0,
            focusin: !0
        }) c = "on" + b, (l[b + "Bubbles"] = c in a) || (d.setAttribute(c, "t"), l[b + "Bubbles"] = d.attributes[c].expando === !1);
        d = null;
    }();
    var Y = /^(?:input|select|textarea)$/i, Z = /^key/, $ = /^(?:mouse|contextmenu)|click/, _ = /^(?:focusinfocus|focusoutblur)$/, ab = /^([^.]*)(?:\.(.+)|)$/;
    function bb() {
        return !0;
    }
    function cb() {
        return !1;
    }
    function db() {
        try {
            return z.activeElement;
        } catch (a) {}
    }
    n.event = {
        global: {},
        add: function(a, b, c, d, e) {
            var f, g, h, i, j, k, l, m, o, p, q, r = n._data(a);
            if (r) {
                c.handler && (i = c, c = i.handler, e = i.selector), c.guid || (c.guid = n.guid++), 
                (g = r.events) || (g = r.events = {}), (k = r.handle) || (k = r.handle = function(a) {
                    return typeof n === L || a && n.event.triggered === a.type ? void 0 : n.event.dispatch.apply(k.elem, arguments);
                }, k.elem = a), b = (b || "").match(F) || [ "" ], h = b.length;
                while (h--) f = ab.exec(b[h]) || [], o = q = f[1], p = (f[2] || "").split(".").sort(), 
                o && (j = n.event.special[o] || {}, o = (e ? j.delegateType : j.bindType) || o, 
                j = n.event.special[o] || {}, l = n.extend({
                    type: o,
                    origType: q,
                    data: d,
                    handler: c,
                    guid: c.guid,
                    selector: e,
                    needsContext: e && n.expr.match.needsContext.test(e),
                    namespace: p.join(".")
                }, i), (m = g[o]) || (m = g[o] = [], m.delegateCount = 0, j.setup && j.setup.call(a, d, p, k) !== !1 || (a.addEventListener ? a.addEventListener(o, k, !1) : a.attachEvent && a.attachEvent("on" + o, k))), 
                j.add && (j.add.call(a, l), l.handler.guid || (l.handler.guid = c.guid)), e ? m.splice(m.delegateCount++, 0, l) : m.push(l), 
                n.event.global[o] = !0);
                a = null;
            }
        },
        remove: function(a, b, c, d, e) {
            var f, g, h, i, j, k, l, m, o, p, q, r = n.hasData(a) && n._data(a);
            if (r && (k = r.events)) {
                b = (b || "").match(F) || [ "" ], j = b.length;
                while (j--) if (h = ab.exec(b[j]) || [], o = q = h[1], p = (h[2] || "").split(".").sort(), 
                o) {
                    l = n.event.special[o] || {}, o = (d ? l.delegateType : l.bindType) || o, m = k[o] || [], 
                    h = h[2] && new RegExp("(^|\\.)" + p.join("\\.(?:.*\\.|)") + "(\\.|$)"), i = f = m.length;
                    while (f--) g = m[f], !e && q !== g.origType || c && c.guid !== g.guid || h && !h.test(g.namespace) || d && d !== g.selector && ("**" !== d || !g.selector) || (m.splice(f, 1), 
                    g.selector && m.delegateCount--, l.remove && l.remove.call(a, g));
                    i && !m.length && (l.teardown && l.teardown.call(a, p, r.handle) !== !1 || n.removeEvent(a, o, r.handle), 
                    delete k[o]);
                } else for (o in k) n.event.remove(a, o + b[j], c, d, !0);
                n.isEmptyObject(k) && (delete r.handle, n._removeData(a, "events"));
            }
        },
        trigger: function(b, c, d, e) {
            var f, g, h, i, k, l, m, o = [ d || z ], p = j.call(b, "type") ? b.type : b, q = j.call(b, "namespace") ? b.namespace.split(".") : [];
            if (h = l = d = d || z, 3 !== d.nodeType && 8 !== d.nodeType && !_.test(p + n.event.triggered) && (p.indexOf(".") >= 0 && (q = p.split("."), 
            p = q.shift(), q.sort()), g = p.indexOf(":") < 0 && "on" + p, b = b[n.expando] ? b : new n.Event(p, "object" == typeof b && b), 
            b.isTrigger = e ? 2 : 3, b.namespace = q.join("."), b.namespace_re = b.namespace ? new RegExp("(^|\\.)" + q.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, 
            b.result = void 0, b.target || (b.target = d), c = null == c ? [ b ] : n.makeArray(c, [ b ]), 
            k = n.event.special[p] || {}, e || !k.trigger || k.trigger.apply(d, c) !== !1)) {
                if (!e && !k.noBubble && !n.isWindow(d)) {
                    for (i = k.delegateType || p, _.test(i + p) || (h = h.parentNode); h; h = h.parentNode) o.push(h), 
                    l = h;
                    l === (d.ownerDocument || z) && o.push(l.defaultView || l.parentWindow || a);
                }
                m = 0;
                while ((h = o[m++]) && !b.isPropagationStopped()) b.type = m > 1 ? i : k.bindType || p, 
                f = (n._data(h, "events") || {})[b.type] && n._data(h, "handle"), f && f.apply(h, c), 
                f = g && h[g], f && f.apply && n.acceptData(h) && (b.result = f.apply(h, c), b.result === !1 && b.preventDefault());
                if (b.type = p, !e && !b.isDefaultPrevented() && (!k._default || k._default.apply(o.pop(), c) === !1) && n.acceptData(d) && g && d[p] && !n.isWindow(d)) {
                    l = d[g], l && (d[g] = null), n.event.triggered = p;
                    try {
                        d[p]();
                    } catch (r) {}
                    n.event.triggered = void 0, l && (d[g] = l);
                }
                return b.result;
            }
        },
        dispatch: function(a) {
            a = n.event.fix(a);
            var b, c, e, f, g, h = [], i = d.call(arguments), j = (n._data(this, "events") || {})[a.type] || [], k = n.event.special[a.type] || {};
            if (i[0] = a, a.delegateTarget = this, !k.preDispatch || k.preDispatch.call(this, a) !== !1) {
                h = n.event.handlers.call(this, a, j), b = 0;
                while ((f = h[b++]) && !a.isPropagationStopped()) {
                    a.currentTarget = f.elem, g = 0;
                    while ((e = f.handlers[g++]) && !a.isImmediatePropagationStopped()) (!a.namespace_re || a.namespace_re.test(e.namespace)) && (a.handleObj = e, 
                    a.data = e.data, c = ((n.event.special[e.origType] || {}).handle || e.handler).apply(f.elem, i), 
                    void 0 !== c && (a.result = c) === !1 && (a.preventDefault(), a.stopPropagation()));
                }
                return k.postDispatch && k.postDispatch.call(this, a), a.result;
            }
        },
        handlers: function(a, b) {
            var c, d, e, f, g = [], h = b.delegateCount, i = a.target;
            if (h && i.nodeType && (!a.button || "click" !== a.type)) for (;i != this; i = i.parentNode || this) if (1 === i.nodeType && (i.disabled !== !0 || "click" !== a.type)) {
                for (e = [], f = 0; h > f; f++) d = b[f], c = d.selector + " ", void 0 === e[c] && (e[c] = d.needsContext ? n(c, this).index(i) >= 0 : n.find(c, this, null, [ i ]).length), 
                e[c] && e.push(d);
                e.length && g.push({
                    elem: i,
                    handlers: e
                });
            }
            return h < b.length && g.push({
                elem: this,
                handlers: b.slice(h)
            }), g;
        },
        fix: function(a) {
            if (a[n.expando]) return a;
            var b, c, d, e = a.type, f = a, g = this.fixHooks[e];
            g || (this.fixHooks[e] = g = $.test(e) ? this.mouseHooks : Z.test(e) ? this.keyHooks : {}), 
            d = g.props ? this.props.concat(g.props) : this.props, a = new n.Event(f), b = d.length;
            while (b--) c = d[b], a[c] = f[c];
            return a.target || (a.target = f.srcElement || z), 3 === a.target.nodeType && (a.target = a.target.parentNode), 
            a.metaKey = !!a.metaKey, g.filter ? g.filter(a, f) : a;
        },
        props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
        fixHooks: {},
        keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function(a, b) {
                return null == a.which && (a.which = null != b.charCode ? b.charCode : b.keyCode), 
                a;
            }
        },
        mouseHooks: {
            props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
            filter: function(a, b) {
                var c, d, e, f = b.button, g = b.fromElement;
                return null == a.pageX && null != b.clientX && (d = a.target.ownerDocument || z, 
                e = d.documentElement, c = d.body, a.pageX = b.clientX + (e && e.scrollLeft || c && c.scrollLeft || 0) - (e && e.clientLeft || c && c.clientLeft || 0), 
                a.pageY = b.clientY + (e && e.scrollTop || c && c.scrollTop || 0) - (e && e.clientTop || c && c.clientTop || 0)), 
                !a.relatedTarget && g && (a.relatedTarget = g === a.target ? b.toElement : g), a.which || void 0 === f || (a.which = 1 & f ? 1 : 2 & f ? 3 : 4 & f ? 2 : 0), 
                a;
            }
        },
        special: {
            load: {
                noBubble: !0
            },
            focus: {
                trigger: function() {
                    if (this !== db() && this.focus) try {
                        return this.focus(), !1;
                    } catch (a) {}
                },
                delegateType: "focusin"
            },
            blur: {
                trigger: function() {
                    return this === db() && this.blur ? (this.blur(), !1) : void 0;
                },
                delegateType: "focusout"
            },
            click: {
                trigger: function() {
                    return n.nodeName(this, "input") && "checkbox" === this.type && this.click ? (this.click(), 
                    !1) : void 0;
                },
                _default: function(a) {
                    return n.nodeName(a.target, "a");
                }
            },
            beforeunload: {
                postDispatch: function(a) {
                    void 0 !== a.result && (a.originalEvent.returnValue = a.result);
                }
            }
        },
        simulate: function(a, b, c, d) {
            var e = n.extend(new n.Event(), c, {
                type: a,
                isSimulated: !0,
                originalEvent: {}
            });
            d ? n.event.trigger(e, null, b) : n.event.dispatch.call(b, e), e.isDefaultPrevented() && c.preventDefault();
        }
    }, n.removeEvent = z.removeEventListener ? function(a, b, c) {
        a.removeEventListener && a.removeEventListener(b, c, !1);
    } : function(a, b, c) {
        var d = "on" + b;
        a.detachEvent && (typeof a[d] === L && (a[d] = null), a.detachEvent(d, c));
    }, n.Event = function(a, b) {
        return this instanceof n.Event ? (a && a.type ? (this.originalEvent = a, this.type = a.type, 
        this.isDefaultPrevented = a.defaultPrevented || void 0 === a.defaultPrevented && (a.returnValue === !1 || a.getPreventDefault && a.getPreventDefault()) ? bb : cb) : this.type = a, 
        b && n.extend(this, b), this.timeStamp = a && a.timeStamp || n.now(), void (this[n.expando] = !0)) : new n.Event(a, b);
    }, n.Event.prototype = {
        isDefaultPrevented: cb,
        isPropagationStopped: cb,
        isImmediatePropagationStopped: cb,
        preventDefault: function() {
            var a = this.originalEvent;
            this.isDefaultPrevented = bb, a && (a.preventDefault ? a.preventDefault() : a.returnValue = !1);
        },
        stopPropagation: function() {
            var a = this.originalEvent;
            this.isPropagationStopped = bb, a && (a.stopPropagation && a.stopPropagation(), 
            a.cancelBubble = !0);
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = bb, this.stopPropagation();
        }
    }, n.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    }, function(a, b) {
        n.event.special[a] = {
            delegateType: b,
            bindType: b,
            handle: function(a) {
                var c, d = this, e = a.relatedTarget, f = a.handleObj;
                return (!e || e !== d && !n.contains(d, e)) && (a.type = f.origType, c = f.handler.apply(this, arguments), 
                a.type = b), c;
            }
        };
    }), l.submitBubbles || (n.event.special.submit = {
        setup: function() {
            return n.nodeName(this, "form") ? !1 : void n.event.add(this, "click._submit keypress._submit", function(a) {
                var b = a.target, c = n.nodeName(b, "input") || n.nodeName(b, "button") ? b.form : void 0;
                c && !n._data(c, "submitBubbles") && (n.event.add(c, "submit._submit", function(a) {
                    a._submit_bubble = !0;
                }), n._data(c, "submitBubbles", !0));
            });
        },
        postDispatch: function(a) {
            a._submit_bubble && (delete a._submit_bubble, this.parentNode && !a.isTrigger && n.event.simulate("submit", this.parentNode, a, !0));
        },
        teardown: function() {
            return n.nodeName(this, "form") ? !1 : void n.event.remove(this, "._submit");
        }
    }), l.changeBubbles || (n.event.special.change = {
        setup: function() {
            return Y.test(this.nodeName) ? (("checkbox" === this.type || "radio" === this.type) && (n.event.add(this, "propertychange._change", function(a) {
                "checked" === a.originalEvent.propertyName && (this._just_changed = !0);
            }), n.event.add(this, "click._change", function(a) {
                this._just_changed && !a.isTrigger && (this._just_changed = !1), n.event.simulate("change", this, a, !0);
            })), !1) : void n.event.add(this, "beforeactivate._change", function(a) {
                var b = a.target;
                Y.test(b.nodeName) && !n._data(b, "changeBubbles") && (n.event.add(b, "change._change", function(a) {
                    !this.parentNode || a.isSimulated || a.isTrigger || n.event.simulate("change", this.parentNode, a, !0);
                }), n._data(b, "changeBubbles", !0));
            });
        },
        handle: function(a) {
            var b = a.target;
            return this !== b || a.isSimulated || a.isTrigger || "radio" !== b.type && "checkbox" !== b.type ? a.handleObj.handler.apply(this, arguments) : void 0;
        },
        teardown: function() {
            return n.event.remove(this, "._change"), !Y.test(this.nodeName);
        }
    }), l.focusinBubbles || n.each({
        focus: "focusin",
        blur: "focusout"
    }, function(a, b) {
        var c = function(a) {
            n.event.simulate(b, a.target, n.event.fix(a), !0);
        };
        n.event.special[b] = {
            setup: function() {
                var d = this.ownerDocument || this, e = n._data(d, b);
                e || d.addEventListener(a, c, !0), n._data(d, b, (e || 0) + 1);
            },
            teardown: function() {
                var d = this.ownerDocument || this, e = n._data(d, b) - 1;
                e ? n._data(d, b, e) : (d.removeEventListener(a, c, !0), n._removeData(d, b));
            }
        };
    }), n.fn.extend({
        on: function(a, b, c, d, e) {
            var f, g;
            if ("object" == typeof a) {
                "string" != typeof b && (c = c || b, b = void 0);
                for (f in a) this.on(f, b, c, a[f], e);
                return this;
            }
            if (null == c && null == d ? (d = b, c = b = void 0) : null == d && ("string" == typeof b ? (d = c, 
            c = void 0) : (d = c, c = b, b = void 0)), d === !1) d = cb; else if (!d) return this;
            return 1 === e && (g = d, d = function(a) {
                return n().off(a), g.apply(this, arguments);
            }, d.guid = g.guid || (g.guid = n.guid++)), this.each(function() {
                n.event.add(this, a, d, c, b);
            });
        },
        one: function(a, b, c, d) {
            return this.on(a, b, c, d, 1);
        },
        off: function(a, b, c) {
            var d, e;
            if (a && a.preventDefault && a.handleObj) return d = a.handleObj, n(a.delegateTarget).off(d.namespace ? d.origType + "." + d.namespace : d.origType, d.selector, d.handler), 
            this;
            if ("object" == typeof a) {
                for (e in a) this.off(e, b, a[e]);
                return this;
            }
            return (b === !1 || "function" == typeof b) && (c = b, b = void 0), c === !1 && (c = cb), 
            this.each(function() {
                n.event.remove(this, a, c, b);
            });
        },
        trigger: function(a, b) {
            return this.each(function() {
                n.event.trigger(a, b, this);
            });
        },
        triggerHandler: function(a, b) {
            var c = this[0];
            return c ? n.event.trigger(a, b, c, !0) : void 0;
        }
    });
    function eb(a) {
        var b = fb.split("|"), c = a.createDocumentFragment();
        if (c.createElement) while (b.length) c.createElement(b.pop());
        return c;
    }
    var fb = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video", gb = / jQuery\d+="(?:null|\d+)"/g, hb = new RegExp("<(?:" + fb + ")[\\s/>]", "i"), ib = /^\s+/, jb = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, kb = /<([\w:]+)/, lb = /<tbody/i, mb = /<|&#?\w+;/, nb = /<(?:script|style|link)/i, ob = /checked\s*(?:[^=]|=\s*.checked.)/i, pb = /^$|\/(?:java|ecma)script/i, qb = /^true\/(.*)/, rb = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g, sb = {
        option: [ 1, "<select multiple='multiple'>", "</select>" ],
        legend: [ 1, "<fieldset>", "</fieldset>" ],
        area: [ 1, "<map>", "</map>" ],
        param: [ 1, "<object>", "</object>" ],
        thead: [ 1, "<table>", "</table>" ],
        tr: [ 2, "<table><tbody>", "</tbody></table>" ],
        col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
        td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
        _default: l.htmlSerialize ? [ 0, "", "" ] : [ 1, "X<div>", "</div>" ]
    }, tb = eb(z), ub = tb.appendChild(z.createElement("div"));
    sb.optgroup = sb.option, sb.tbody = sb.tfoot = sb.colgroup = sb.caption = sb.thead, 
    sb.th = sb.td;
    function vb(a, b) {
        var c, d, e = 0, f = typeof a.getElementsByTagName !== L ? a.getElementsByTagName(b || "*") : typeof a.querySelectorAll !== L ? a.querySelectorAll(b || "*") : void 0;
        if (!f) for (f = [], c = a.childNodes || a; null != (d = c[e]); e++) !b || n.nodeName(d, b) ? f.push(d) : n.merge(f, vb(d, b));
        return void 0 === b || b && n.nodeName(a, b) ? n.merge([ a ], f) : f;
    }
    function wb(a) {
        X.test(a.type) && (a.defaultChecked = a.checked);
    }
    function xb(a, b) {
        return n.nodeName(a, "table") && n.nodeName(11 !== b.nodeType ? b : b.firstChild, "tr") ? a.getElementsByTagName("tbody")[0] || a.appendChild(a.ownerDocument.createElement("tbody")) : a;
    }
    function yb(a) {
        return a.type = (null !== n.find.attr(a, "type")) + "/" + a.type, a;
    }
    function zb(a) {
        var b = qb.exec(a.type);
        return b ? a.type = b[1] : a.removeAttribute("type"), a;
    }
    function Ab(a, b) {
        for (var c, d = 0; null != (c = a[d]); d++) n._data(c, "globalEval", !b || n._data(b[d], "globalEval"));
    }
    function Bb(a, b) {
        if (1 === b.nodeType && n.hasData(a)) {
            var c, d, e, f = n._data(a), g = n._data(b, f), h = f.events;
            if (h) {
                delete g.handle, g.events = {};
                for (c in h) for (d = 0, e = h[c].length; e > d; d++) n.event.add(b, c, h[c][d]);
            }
            g.data && (g.data = n.extend({}, g.data));
        }
    }
    function Cb(a, b) {
        var c, d, e;
        if (1 === b.nodeType) {
            if (c = b.nodeName.toLowerCase(), !l.noCloneEvent && b[n.expando]) {
                e = n._data(b);
                for (d in e.events) n.removeEvent(b, d, e.handle);
                b.removeAttribute(n.expando);
            }
            "script" === c && b.text !== a.text ? (yb(b).text = a.text, zb(b)) : "object" === c ? (b.parentNode && (b.outerHTML = a.outerHTML), 
            l.html5Clone && a.innerHTML && !n.trim(b.innerHTML) && (b.innerHTML = a.innerHTML)) : "input" === c && X.test(a.type) ? (b.defaultChecked = b.checked = a.checked, 
            b.value !== a.value && (b.value = a.value)) : "option" === c ? b.defaultSelected = b.selected = a.defaultSelected : ("input" === c || "textarea" === c) && (b.defaultValue = a.defaultValue);
        }
    }
    n.extend({
        clone: function(a, b, c) {
            var d, e, f, g, h, i = n.contains(a.ownerDocument, a);
            if (l.html5Clone || n.isXMLDoc(a) || !hb.test("<" + a.nodeName + ">") ? f = a.cloneNode(!0) : (ub.innerHTML = a.outerHTML, 
            ub.removeChild(f = ub.firstChild)), !(l.noCloneEvent && l.noCloneChecked || 1 !== a.nodeType && 11 !== a.nodeType || n.isXMLDoc(a))) for (d = vb(f), 
            h = vb(a), g = 0; null != (e = h[g]); ++g) d[g] && Cb(e, d[g]);
            if (b) if (c) for (h = h || vb(a), d = d || vb(f), g = 0; null != (e = h[g]); g++) Bb(e, d[g]); else Bb(a, f);
            return d = vb(f, "script"), d.length > 0 && Ab(d, !i && vb(a, "script")), d = h = e = null, 
            f;
        },
        buildFragment: function(a, b, c, d) {
            for (var e, f, g, h, i, j, k, m = a.length, o = eb(b), p = [], q = 0; m > q; q++) if (f = a[q], 
            f || 0 === f) if ("object" === n.type(f)) n.merge(p, f.nodeType ? [ f ] : f); else if (mb.test(f)) {
                h = h || o.appendChild(b.createElement("div")), i = (kb.exec(f) || [ "", "" ])[1].toLowerCase(), 
                k = sb[i] || sb._default, h.innerHTML = k[1] + f.replace(jb, "<$1></$2>") + k[2], 
                e = k[0];
                while (e--) h = h.lastChild;
                if (!l.leadingWhitespace && ib.test(f) && p.push(b.createTextNode(ib.exec(f)[0])), 
                !l.tbody) {
                    f = "table" !== i || lb.test(f) ? "<table>" !== k[1] || lb.test(f) ? 0 : h : h.firstChild, 
                    e = f && f.childNodes.length;
                    while (e--) n.nodeName(j = f.childNodes[e], "tbody") && !j.childNodes.length && f.removeChild(j);
                }
                n.merge(p, h.childNodes), h.textContent = "";
                while (h.firstChild) h.removeChild(h.firstChild);
                h = o.lastChild;
            } else p.push(b.createTextNode(f));
            h && o.removeChild(h), l.appendChecked || n.grep(vb(p, "input"), wb), q = 0;
            while (f = p[q++]) if ((!d || -1 === n.inArray(f, d)) && (g = n.contains(f.ownerDocument, f), 
            h = vb(o.appendChild(f), "script"), g && Ab(h), c)) {
                e = 0;
                while (f = h[e++]) pb.test(f.type || "") && c.push(f);
            }
            return h = null, o;
        },
        cleanData: function(a, b) {
            for (var d, e, f, g, h = 0, i = n.expando, j = n.cache, k = l.deleteExpando, m = n.event.special; null != (d = a[h]); h++) if ((b || n.acceptData(d)) && (f = d[i], 
            g = f && j[f])) {
                if (g.events) for (e in g.events) m[e] ? n.event.remove(d, e) : n.removeEvent(d, e, g.handle);
                j[f] && (delete j[f], k ? delete d[i] : typeof d.removeAttribute !== L ? d.removeAttribute(i) : d[i] = null, 
                c.push(f));
            }
        }
    }), n.fn.extend({
        text: function(a) {
            return W(this, function(a) {
                return void 0 === a ? n.text(this) : this.empty().append((this[0] && this[0].ownerDocument || z).createTextNode(a));
            }, null, a, arguments.length);
        },
        append: function() {
            return this.domManip(arguments, function(a) {
                if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                    var b = xb(this, a);
                    b.appendChild(a);
                }
            });
        },
        prepend: function() {
            return this.domManip(arguments, function(a) {
                if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                    var b = xb(this, a);
                    b.insertBefore(a, b.firstChild);
                }
            });
        },
        before: function() {
            return this.domManip(arguments, function(a) {
                this.parentNode && this.parentNode.insertBefore(a, this);
            });
        },
        after: function() {
            return this.domManip(arguments, function(a) {
                this.parentNode && this.parentNode.insertBefore(a, this.nextSibling);
            });
        },
        remove: function(a, b) {
            for (var c, d = a ? n.filter(a, this) : this, e = 0; null != (c = d[e]); e++) b || 1 !== c.nodeType || n.cleanData(vb(c)), 
            c.parentNode && (b && n.contains(c.ownerDocument, c) && Ab(vb(c, "script")), c.parentNode.removeChild(c));
            return this;
        },
        empty: function() {
            for (var a, b = 0; null != (a = this[b]); b++) {
                1 === a.nodeType && n.cleanData(vb(a, !1));
                while (a.firstChild) a.removeChild(a.firstChild);
                a.options && n.nodeName(a, "select") && (a.options.length = 0);
            }
            return this;
        },
        clone: function(a, b) {
            return a = null == a ? !1 : a, b = null == b ? a : b, this.map(function() {
                return n.clone(this, a, b);
            });
        },
        html: function(a) {
            return W(this, function(a) {
                var b = this[0] || {}, c = 0, d = this.length;
                if (void 0 === a) return 1 === b.nodeType ? b.innerHTML.replace(gb, "") : void 0;
                if (!("string" != typeof a || nb.test(a) || !l.htmlSerialize && hb.test(a) || !l.leadingWhitespace && ib.test(a) || sb[(kb.exec(a) || [ "", "" ])[1].toLowerCase()])) {
                    a = a.replace(jb, "<$1></$2>");
                    try {
                        for (;d > c; c++) b = this[c] || {}, 1 === b.nodeType && (n.cleanData(vb(b, !1)), 
                        b.innerHTML = a);
                        b = 0;
                    } catch (e) {}
                }
                b && this.empty().append(a);
            }, null, a, arguments.length);
        },
        replaceWith: function() {
            var a = arguments[0];
            return this.domManip(arguments, function(b) {
                a = this.parentNode, n.cleanData(vb(this)), a && a.replaceChild(b, this);
            }), a && (a.length || a.nodeType) ? this : this.remove();
        },
        detach: function(a) {
            return this.remove(a, !0);
        },
        domManip: function(a, b) {
            a = e.apply([], a);
            var c, d, f, g, h, i, j = 0, k = this.length, m = this, o = k - 1, p = a[0], q = n.isFunction(p);
            if (q || k > 1 && "string" == typeof p && !l.checkClone && ob.test(p)) return this.each(function(c) {
                var d = m.eq(c);
                q && (a[0] = p.call(this, c, d.html())), d.domManip(a, b);
            });
            if (k && (i = n.buildFragment(a, this[0].ownerDocument, !1, this), c = i.firstChild, 
            1 === i.childNodes.length && (i = c), c)) {
                for (g = n.map(vb(i, "script"), yb), f = g.length; k > j; j++) d = i, j !== o && (d = n.clone(d, !0, !0), 
                f && n.merge(g, vb(d, "script"))), b.call(this[j], d, j);
                if (f) for (h = g[g.length - 1].ownerDocument, n.map(g, zb), j = 0; f > j; j++) d = g[j], 
                pb.test(d.type || "") && !n._data(d, "globalEval") && n.contains(h, d) && (d.src ? n._evalUrl && n._evalUrl(d.src) : n.globalEval((d.text || d.textContent || d.innerHTML || "").replace(rb, "")));
                i = c = null;
            }
            return this;
        }
    }), n.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function(a, b) {
        n.fn[a] = function(a) {
            for (var c, d = 0, e = [], g = n(a), h = g.length - 1; h >= d; d++) c = d === h ? this : this.clone(!0), 
            n(g[d])[b](c), f.apply(e, c.get());
            return this.pushStack(e);
        };
    });
    var Db, Eb = {};
    function Fb(b, c) {
        var d = n(c.createElement(b)).appendTo(c.body), e = a.getDefaultComputedStyle ? a.getDefaultComputedStyle(d[0]).display : n.css(d[0], "display");
        return d.detach(), e;
    }
    function Gb(a) {
        var b = z, c = Eb[a];
        return c || (c = Fb(a, b), "none" !== c && c || (Db = (Db || n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement), 
        b = (Db[0].contentWindow || Db[0].contentDocument).document, b.write(), b.close(), 
        c = Fb(a, b), Db.detach()), Eb[a] = c), c;
    }
    !function() {
        var a, b, c = z.createElement("div"), d = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;padding:0;margin:0;border:0";
        c.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", 
        a = c.getElementsByTagName("a")[0], a.style.cssText = "float:left;opacity:.5", l.opacity = /^0.5/.test(a.style.opacity), 
        l.cssFloat = !!a.style.cssFloat, c.style.backgroundClip = "content-box", c.cloneNode(!0).style.backgroundClip = "", 
        l.clearCloneStyle = "content-box" === c.style.backgroundClip, a = c = null, l.shrinkWrapBlocks = function() {
            var a, c, e, f;
            if (null == b) {
                if (a = z.getElementsByTagName("body")[0], !a) return;
                f = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px", c = z.createElement("div"), 
                e = z.createElement("div"), a.appendChild(c).appendChild(e), b = !1, typeof e.style.zoom !== L && (e.style.cssText = d + ";width:1px;padding:1px;zoom:1", 
                e.innerHTML = "<div></div>", e.firstChild.style.width = "5px", b = 3 !== e.offsetWidth), 
                a.removeChild(c), a = c = e = null;
            }
            return b;
        };
    }();
    var Hb = /^margin/, Ib = new RegExp("^(" + T + ")(?!px)[a-z%]+$", "i"), Jb, Kb, Lb = /^(top|right|bottom|left)$/;
    a.getComputedStyle ? (Jb = function(a) {
        return a.ownerDocument.defaultView.getComputedStyle(a, null);
    }, Kb = function(a, b, c) {
        var d, e, f, g, h = a.style;
        return c = c || Jb(a), g = c ? c.getPropertyValue(b) || c[b] : void 0, c && ("" !== g || n.contains(a.ownerDocument, a) || (g = n.style(a, b)), 
        Ib.test(g) && Hb.test(b) && (d = h.width, e = h.minWidth, f = h.maxWidth, h.minWidth = h.maxWidth = h.width = g, 
        g = c.width, h.width = d, h.minWidth = e, h.maxWidth = f)), void 0 === g ? g : g + "";
    }) : z.documentElement.currentStyle && (Jb = function(a) {
        return a.currentStyle;
    }, Kb = function(a, b, c) {
        var d, e, f, g, h = a.style;
        return c = c || Jb(a), g = c ? c[b] : void 0, null == g && h && h[b] && (g = h[b]), 
        Ib.test(g) && !Lb.test(b) && (d = h.left, e = a.runtimeStyle, f = e && e.left, f && (e.left = a.currentStyle.left), 
        h.left = "fontSize" === b ? "1em" : g, g = h.pixelLeft + "px", h.left = d, f && (e.left = f)), 
        void 0 === g ? g : g + "" || "auto";
    });
    function Mb(a, b) {
        return {
            get: function() {
                var c = a();
                if (null != c) return c ? void delete this.get : (this.get = b).apply(this, arguments);
            }
        };
    }
    !function() {
        var b, c, d, e, f, g, h = z.createElement("div"), i = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px", j = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;padding:0;margin:0;border:0";
        h.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", 
        b = h.getElementsByTagName("a")[0], b.style.cssText = "float:left;opacity:.5", l.opacity = /^0.5/.test(b.style.opacity), 
        l.cssFloat = !!b.style.cssFloat, h.style.backgroundClip = "content-box", h.cloneNode(!0).style.backgroundClip = "", 
        l.clearCloneStyle = "content-box" === h.style.backgroundClip, b = h = null, n.extend(l, {
            reliableHiddenOffsets: function() {
                if (null != c) return c;
                var a, b, d, e = z.createElement("div"), f = z.getElementsByTagName("body")[0];
                if (f) return e.setAttribute("className", "t"), e.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", 
                a = z.createElement("div"), a.style.cssText = i, f.appendChild(a).appendChild(e), 
                e.innerHTML = "<table><tr><td></td><td>t</td></tr></table>", b = e.getElementsByTagName("td"), 
                b[0].style.cssText = "padding:0;margin:0;border:0;display:none", d = 0 === b[0].offsetHeight, 
                b[0].style.display = "", b[1].style.display = "none", c = d && 0 === b[0].offsetHeight, 
                f.removeChild(a), e = f = null, c;
            },
            boxSizing: function() {
                return null == d && k(), d;
            },
            boxSizingReliable: function() {
                return null == e && k(), e;
            },
            pixelPosition: function() {
                return null == f && k(), f;
            },
            reliableMarginRight: function() {
                var b, c, d, e;
                if (null == g && a.getComputedStyle) {
                    if (b = z.getElementsByTagName("body")[0], !b) return;
                    c = z.createElement("div"), d = z.createElement("div"), c.style.cssText = i, b.appendChild(c).appendChild(d), 
                    e = d.appendChild(z.createElement("div")), e.style.cssText = d.style.cssText = j, 
                    e.style.marginRight = e.style.width = "0", d.style.width = "1px", g = !parseFloat((a.getComputedStyle(e, null) || {}).marginRight), 
                    b.removeChild(c);
                }
                return g;
            }
        });
        function k() {
            var b, c, h = z.getElementsByTagName("body")[0];
            h && (b = z.createElement("div"), c = z.createElement("div"), b.style.cssText = i, 
            h.appendChild(b).appendChild(c), c.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;display:block;padding:1px;border:1px;width:4px;margin-top:1%;top:1%", 
            n.swap(h, null != h.style.zoom ? {
                zoom: 1
            } : {}, function() {
                d = 4 === c.offsetWidth;
            }), e = !0, f = !1, g = !0, a.getComputedStyle && (f = "1%" !== (a.getComputedStyle(c, null) || {}).top, 
            e = "4px" === (a.getComputedStyle(c, null) || {
                width: "4px"
            }).width), h.removeChild(b), c = h = null);
        }
    }(), n.swap = function(a, b, c, d) {
        var e, f, g = {};
        for (f in b) g[f] = a.style[f], a.style[f] = b[f];
        e = c.apply(a, d || []);
        for (f in b) a.style[f] = g[f];
        return e;
    };
    var Nb = /alpha\([^)]*\)/i, Ob = /opacity\s*=\s*([^)]*)/, Pb = /^(none|table(?!-c[ea]).+)/, Qb = new RegExp("^(" + T + ")(.*)$", "i"), Rb = new RegExp("^([+-])=(" + T + ")", "i"), Sb = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }, Tb = {
        letterSpacing: 0,
        fontWeight: 400
    }, Ub = [ "Webkit", "O", "Moz", "ms" ];
    function Vb(a, b) {
        if (b in a) return b;
        var c = b.charAt(0).toUpperCase() + b.slice(1), d = b, e = Ub.length;
        while (e--) if (b = Ub[e] + c, b in a) return b;
        return d;
    }
    function Wb(a, b) {
        for (var c, d, e, f = [], g = 0, h = a.length; h > g; g++) d = a[g], d.style && (f[g] = n._data(d, "olddisplay"), 
        c = d.style.display, b ? (f[g] || "none" !== c || (d.style.display = ""), "" === d.style.display && V(d) && (f[g] = n._data(d, "olddisplay", Gb(d.nodeName)))) : f[g] || (e = V(d), 
        (c && "none" !== c || !e) && n._data(d, "olddisplay", e ? c : n.css(d, "display"))));
        for (g = 0; h > g; g++) d = a[g], d.style && (b && "none" !== d.style.display && "" !== d.style.display || (d.style.display = b ? f[g] || "" : "none"));
        return a;
    }
    function Xb(a, b, c) {
        var d = Qb.exec(b);
        return d ? Math.max(0, d[1] - (c || 0)) + (d[2] || "px") : b;
    }
    function Yb(a, b, c, d, e) {
        for (var f = c === (d ? "border" : "content") ? 4 : "width" === b ? 1 : 0, g = 0; 4 > f; f += 2) "margin" === c && (g += n.css(a, c + U[f], !0, e)), 
        d ? ("content" === c && (g -= n.css(a, "padding" + U[f], !0, e)), "margin" !== c && (g -= n.css(a, "border" + U[f] + "Width", !0, e))) : (g += n.css(a, "padding" + U[f], !0, e), 
        "padding" !== c && (g += n.css(a, "border" + U[f] + "Width", !0, e)));
        return g;
    }
    function Zb(a, b, c) {
        var d = !0, e = "width" === b ? a.offsetWidth : a.offsetHeight, f = Jb(a), g = l.boxSizing() && "border-box" === n.css(a, "boxSizing", !1, f);
        if (0 >= e || null == e) {
            if (e = Kb(a, b, f), (0 > e || null == e) && (e = a.style[b]), Ib.test(e)) return e;
            d = g && (l.boxSizingReliable() || e === a.style[b]), e = parseFloat(e) || 0;
        }
        return e + Yb(a, b, c || (g ? "border" : "content"), d, f) + "px";
    }
    n.extend({
        cssHooks: {
            opacity: {
                get: function(a, b) {
                    if (b) {
                        var c = Kb(a, "opacity");
                        return "" === c ? "1" : c;
                    }
                }
            }
        },
        cssNumber: {
            columnCount: !0,
            fillOpacity: !0,
            fontWeight: !0,
            lineHeight: !0,
            opacity: !0,
            order: !0,
            orphans: !0,
            widows: !0,
            zIndex: !0,
            zoom: !0
        },
        cssProps: {
            "float": l.cssFloat ? "cssFloat" : "styleFloat"
        },
        style: function(a, b, c, d) {
            if (a && 3 !== a.nodeType && 8 !== a.nodeType && a.style) {
                var e, f, g, h = n.camelCase(b), i = a.style;
                if (b = n.cssProps[h] || (n.cssProps[h] = Vb(i, h)), g = n.cssHooks[b] || n.cssHooks[h], 
                void 0 === c) return g && "get" in g && void 0 !== (e = g.get(a, !1, d)) ? e : i[b];
                if (f = typeof c, "string" === f && (e = Rb.exec(c)) && (c = (e[1] + 1) * e[2] + parseFloat(n.css(a, b)), 
                f = "number"), null != c && c === c && ("number" !== f || n.cssNumber[h] || (c += "px"), 
                l.clearCloneStyle || "" !== c || 0 !== b.indexOf("background") || (i[b] = "inherit"), 
                !(g && "set" in g && void 0 === (c = g.set(a, c, d))))) try {
                    i[b] = "", i[b] = c;
                } catch (j) {}
            }
        },
        css: function(a, b, c, d) {
            var e, f, g, h = n.camelCase(b);
            return b = n.cssProps[h] || (n.cssProps[h] = Vb(a.style, h)), g = n.cssHooks[b] || n.cssHooks[h], 
            g && "get" in g && (f = g.get(a, !0, c)), void 0 === f && (f = Kb(a, b, d)), "normal" === f && b in Tb && (f = Tb[b]), 
            "" === c || c ? (e = parseFloat(f), c === !0 || n.isNumeric(e) ? e || 0 : f) : f;
        }
    }), n.each([ "height", "width" ], function(a, b) {
        n.cssHooks[b] = {
            get: function(a, c, d) {
                return c ? 0 === a.offsetWidth && Pb.test(n.css(a, "display")) ? n.swap(a, Sb, function() {
                    return Zb(a, b, d);
                }) : Zb(a, b, d) : void 0;
            },
            set: function(a, c, d) {
                var e = d && Jb(a);
                return Xb(a, c, d ? Yb(a, b, d, l.boxSizing() && "border-box" === n.css(a, "boxSizing", !1, e), e) : 0);
            }
        };
    }), l.opacity || (n.cssHooks.opacity = {
        get: function(a, b) {
            return Ob.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? .01 * parseFloat(RegExp.$1) + "" : b ? "1" : "";
        },
        set: function(a, b) {
            var c = a.style, d = a.currentStyle, e = n.isNumeric(b) ? "alpha(opacity=" + 100 * b + ")" : "", f = d && d.filter || c.filter || "";
            c.zoom = 1, (b >= 1 || "" === b) && "" === n.trim(f.replace(Nb, "")) && c.removeAttribute && (c.removeAttribute("filter"), 
            "" === b || d && !d.filter) || (c.filter = Nb.test(f) ? f.replace(Nb, e) : f + " " + e);
        }
    }), n.cssHooks.marginRight = Mb(l.reliableMarginRight, function(a, b) {
        return b ? n.swap(a, {
            display: "inline-block"
        }, Kb, [ a, "marginRight" ]) : void 0;
    }), n.each({
        margin: "",
        padding: "",
        border: "Width"
    }, function(a, b) {
        n.cssHooks[a + b] = {
            expand: function(c) {
                for (var d = 0, e = {}, f = "string" == typeof c ? c.split(" ") : [ c ]; 4 > d; d++) e[a + U[d] + b] = f[d] || f[d - 2] || f[0];
                return e;
            }
        }, Hb.test(a) || (n.cssHooks[a + b].set = Xb);
    }), n.fn.extend({
        css: function(a, b) {
            return W(this, function(a, b, c) {
                var d, e, f = {}, g = 0;
                if (n.isArray(b)) {
                    for (d = Jb(a), e = b.length; e > g; g++) f[b[g]] = n.css(a, b[g], !1, d);
                    return f;
                }
                return void 0 !== c ? n.style(a, b, c) : n.css(a, b);
            }, a, b, arguments.length > 1);
        },
        show: function() {
            return Wb(this, !0);
        },
        hide: function() {
            return Wb(this);
        },
        toggle: function(a) {
            return "boolean" == typeof a ? a ? this.show() : this.hide() : this.each(function() {
                V(this) ? n(this).show() : n(this).hide();
            });
        }
    });
    function $b(a, b, c, d, e) {
        return new $b.prototype.init(a, b, c, d, e);
    }
    n.Tween = $b, $b.prototype = {
        constructor: $b,
        init: function(a, b, c, d, e, f) {
            this.elem = a, this.prop = c, this.easing = e || "swing", this.options = b, this.start = this.now = this.cur(), 
            this.end = d, this.unit = f || (n.cssNumber[c] ? "" : "px");
        },
        cur: function() {
            var a = $b.propHooks[this.prop];
            return a && a.get ? a.get(this) : $b.propHooks._default.get(this);
        },
        run: function(a) {
            var b, c = $b.propHooks[this.prop];
            return this.pos = b = this.options.duration ? n.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration) : a, 
            this.now = (this.end - this.start) * b + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), 
            c && c.set ? c.set(this) : $b.propHooks._default.set(this), this;
        }
    }, $b.prototype.init.prototype = $b.prototype, $b.propHooks = {
        _default: {
            get: function(a) {
                var b;
                return null == a.elem[a.prop] || a.elem.style && null != a.elem.style[a.prop] ? (b = n.css(a.elem, a.prop, ""), 
                b && "auto" !== b ? b : 0) : a.elem[a.prop];
            },
            set: function(a) {
                n.fx.step[a.prop] ? n.fx.step[a.prop](a) : a.elem.style && (null != a.elem.style[n.cssProps[a.prop]] || n.cssHooks[a.prop]) ? n.style(a.elem, a.prop, a.now + a.unit) : a.elem[a.prop] = a.now;
            }
        }
    }, $b.propHooks.scrollTop = $b.propHooks.scrollLeft = {
        set: function(a) {
            a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now);
        }
    }, n.easing = {
        linear: function(a) {
            return a;
        },
        swing: function(a) {
            return .5 - Math.cos(a * Math.PI) / 2;
        }
    }, n.fx = $b.prototype.init, n.fx.step = {};
    var _b, ac, bc = /^(?:toggle|show|hide)$/, cc = new RegExp("^(?:([+-])=|)(" + T + ")([a-z%]*)$", "i"), dc = /queueHooks$/, ec = [ jc ], fc = {
        "*": [ function(a, b) {
            var c = this.createTween(a, b), d = c.cur(), e = cc.exec(b), f = e && e[3] || (n.cssNumber[a] ? "" : "px"), g = (n.cssNumber[a] || "px" !== f && +d) && cc.exec(n.css(c.elem, a)), h = 1, i = 20;
            if (g && g[3] !== f) {
                f = f || g[3], e = e || [], g = +d || 1;
                do h = h || ".5", g /= h, n.style(c.elem, a, g + f); while (h !== (h = c.cur() / d) && 1 !== h && --i);
            }
            return e && (g = c.start = +g || +d || 0, c.unit = f, c.end = e[1] ? g + (e[1] + 1) * e[2] : +e[2]), 
            c;
        } ]
    };
    function gc() {
        return setTimeout(function() {
            _b = void 0;
        }), _b = n.now();
    }
    function hc(a, b) {
        var c, d = {
            height: a
        }, e = 0;
        for (b = b ? 1 : 0; 4 > e; e += 2 - b) c = U[e], d["margin" + c] = d["padding" + c] = a;
        return b && (d.opacity = d.width = a), d;
    }
    function ic(a, b, c) {
        for (var d, e = (fc[b] || []).concat(fc["*"]), f = 0, g = e.length; g > f; f++) if (d = e[f].call(c, b, a)) return d;
    }
    function jc(a, b, c) {
        var d, e, f, g, h, i, j, k, m = this, o = {}, p = a.style, q = a.nodeType && V(a), r = n._data(a, "fxshow");
        c.queue || (h = n._queueHooks(a, "fx"), null == h.unqueued && (h.unqueued = 0, i = h.empty.fire, 
        h.empty.fire = function() {
            h.unqueued || i();
        }), h.unqueued++, m.always(function() {
            m.always(function() {
                h.unqueued--, n.queue(a, "fx").length || h.empty.fire();
            });
        })), 1 === a.nodeType && ("height" in b || "width" in b) && (c.overflow = [ p.overflow, p.overflowX, p.overflowY ], 
        j = n.css(a, "display"), k = Gb(a.nodeName), "none" === j && (j = k), "inline" === j && "none" === n.css(a, "float") && (l.inlineBlockNeedsLayout && "inline" !== k ? p.zoom = 1 : p.display = "inline-block")), 
        c.overflow && (p.overflow = "hidden", l.shrinkWrapBlocks() || m.always(function() {
            p.overflow = c.overflow[0], p.overflowX = c.overflow[1], p.overflowY = c.overflow[2];
        }));
        for (d in b) if (e = b[d], bc.exec(e)) {
            if (delete b[d], f = f || "toggle" === e, e === (q ? "hide" : "show")) {
                if ("show" !== e || !r || void 0 === r[d]) continue;
                q = !0;
            }
            o[d] = r && r[d] || n.style(a, d);
        }
        if (!n.isEmptyObject(o)) {
            r ? "hidden" in r && (q = r.hidden) : r = n._data(a, "fxshow", {}), f && (r.hidden = !q), 
            q ? n(a).show() : m.done(function() {
                n(a).hide();
            }), m.done(function() {
                var b;
                n._removeData(a, "fxshow");
                for (b in o) n.style(a, b, o[b]);
            });
            for (d in o) g = ic(q ? r[d] : 0, d, m), d in r || (r[d] = g.start, q && (g.end = g.start, 
            g.start = "width" === d || "height" === d ? 1 : 0));
        }
    }
    function kc(a, b) {
        var c, d, e, f, g;
        for (c in a) if (d = n.camelCase(c), e = b[d], f = a[c], n.isArray(f) && (e = f[1], 
        f = a[c] = f[0]), c !== d && (a[d] = f, delete a[c]), g = n.cssHooks[d], g && "expand" in g) {
            f = g.expand(f), delete a[d];
            for (c in f) c in a || (a[c] = f[c], b[c] = e);
        } else b[d] = e;
    }
    function lc(a, b, c) {
        var d, e, f = 0, g = ec.length, h = n.Deferred().always(function() {
            delete i.elem;
        }), i = function() {
            if (e) return !1;
            for (var b = _b || gc(), c = Math.max(0, j.startTime + j.duration - b), d = c / j.duration || 0, f = 1 - d, g = 0, i = j.tweens.length; i > g; g++) j.tweens[g].run(f);
            return h.notifyWith(a, [ j, f, c ]), 1 > f && i ? c : (h.resolveWith(a, [ j ]), 
            !1);
        }, j = h.promise({
            elem: a,
            props: n.extend({}, b),
            opts: n.extend(!0, {
                specialEasing: {}
            }, c),
            originalProperties: b,
            originalOptions: c,
            startTime: _b || gc(),
            duration: c.duration,
            tweens: [],
            createTween: function(b, c) {
                var d = n.Tween(a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing);
                return j.tweens.push(d), d;
            },
            stop: function(b) {
                var c = 0, d = b ? j.tweens.length : 0;
                if (e) return this;
                for (e = !0; d > c; c++) j.tweens[c].run(1);
                return b ? h.resolveWith(a, [ j, b ]) : h.rejectWith(a, [ j, b ]), this;
            }
        }), k = j.props;
        for (kc(k, j.opts.specialEasing); g > f; f++) if (d = ec[f].call(j, a, k, j.opts)) return d;
        return n.map(k, ic, j), n.isFunction(j.opts.start) && j.opts.start.call(a, j), n.fx.timer(n.extend(i, {
            elem: a,
            anim: j,
            queue: j.opts.queue
        })), j.progress(j.opts.progress).done(j.opts.done, j.opts.complete).fail(j.opts.fail).always(j.opts.always);
    }
    n.Animation = n.extend(lc, {
        tweener: function(a, b) {
            n.isFunction(a) ? (b = a, a = [ "*" ]) : a = a.split(" ");
            for (var c, d = 0, e = a.length; e > d; d++) c = a[d], fc[c] = fc[c] || [], fc[c].unshift(b);
        },
        prefilter: function(a, b) {
            b ? ec.unshift(a) : ec.push(a);
        }
    }), n.speed = function(a, b, c) {
        var d = a && "object" == typeof a ? n.extend({}, a) : {
            complete: c || !c && b || n.isFunction(a) && a,
            duration: a,
            easing: c && b || b && !n.isFunction(b) && b
        };
        return d.duration = n.fx.off ? 0 : "number" == typeof d.duration ? d.duration : d.duration in n.fx.speeds ? n.fx.speeds[d.duration] : n.fx.speeds._default, 
        (null == d.queue || d.queue === !0) && (d.queue = "fx"), d.old = d.complete, d.complete = function() {
            n.isFunction(d.old) && d.old.call(this), d.queue && n.dequeue(this, d.queue);
        }, d;
    }, n.fn.extend({
        fadeTo: function(a, b, c, d) {
            return this.filter(V).css("opacity", 0).show().end().animate({
                opacity: b
            }, a, c, d);
        },
        animate: function(a, b, c, d) {
            var e = n.isEmptyObject(a), f = n.speed(b, c, d), g = function() {
                var b = lc(this, n.extend({}, a), f);
                (e || n._data(this, "finish")) && b.stop(!0);
            };
            return g.finish = g, e || f.queue === !1 ? this.each(g) : this.queue(f.queue, g);
        },
        stop: function(a, b, c) {
            var d = function(a) {
                var b = a.stop;
                delete a.stop, b(c);
            };
            return "string" != typeof a && (c = b, b = a, a = void 0), b && a !== !1 && this.queue(a || "fx", []), 
            this.each(function() {
                var b = !0, e = null != a && a + "queueHooks", f = n.timers, g = n._data(this);
                if (e) g[e] && g[e].stop && d(g[e]); else for (e in g) g[e] && g[e].stop && dc.test(e) && d(g[e]);
                for (e = f.length; e--; ) f[e].elem !== this || null != a && f[e].queue !== a || (f[e].anim.stop(c), 
                b = !1, f.splice(e, 1));
                (b || !c) && n.dequeue(this, a);
            });
        },
        finish: function(a) {
            return a !== !1 && (a = a || "fx"), this.each(function() {
                var b, c = n._data(this), d = c[a + "queue"], e = c[a + "queueHooks"], f = n.timers, g = d ? d.length : 0;
                for (c.finish = !0, n.queue(this, a, []), e && e.stop && e.stop.call(this, !0), 
                b = f.length; b--; ) f[b].elem === this && f[b].queue === a && (f[b].anim.stop(!0), 
                f.splice(b, 1));
                for (b = 0; g > b; b++) d[b] && d[b].finish && d[b].finish.call(this);
                delete c.finish;
            });
        }
    }), n.each([ "toggle", "show", "hide" ], function(a, b) {
        var c = n.fn[b];
        n.fn[b] = function(a, d, e) {
            return null == a || "boolean" == typeof a ? c.apply(this, arguments) : this.animate(hc(b, !0), a, d, e);
        };
    }), n.each({
        slideDown: hc("show"),
        slideUp: hc("hide"),
        slideToggle: hc("toggle"),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(a, b) {
        n.fn[a] = function(a, c, d) {
            return this.animate(b, a, c, d);
        };
    }), n.timers = [], n.fx.tick = function() {
        var a, b = n.timers, c = 0;
        for (_b = n.now(); c < b.length; c++) a = b[c], a() || b[c] !== a || b.splice(c--, 1);
        b.length || n.fx.stop(), _b = void 0;
    }, n.fx.timer = function(a) {
        n.timers.push(a), a() ? n.fx.start() : n.timers.pop();
    }, n.fx.interval = 13, n.fx.start = function() {
        ac || (ac = setInterval(n.fx.tick, n.fx.interval));
    }, n.fx.stop = function() {
        clearInterval(ac), ac = null;
    }, n.fx.speeds = {
        slow: 600,
        fast: 200,
        _default: 400
    }, n.fn.delay = function(a, b) {
        return a = n.fx ? n.fx.speeds[a] || a : a, b = b || "fx", this.queue(b, function(b, c) {
            var d = setTimeout(b, a);
            c.stop = function() {
                clearTimeout(d);
            };
        });
    }, function() {
        var a, b, c, d, e = z.createElement("div");
        e.setAttribute("className", "t"), e.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", 
        a = e.getElementsByTagName("a")[0], c = z.createElement("select"), d = c.appendChild(z.createElement("option")), 
        b = e.getElementsByTagName("input")[0], a.style.cssText = "top:1px", l.getSetAttribute = "t" !== e.className, 
        l.style = /top/.test(a.getAttribute("style")), l.hrefNormalized = "/a" === a.getAttribute("href"), 
        l.checkOn = !!b.value, l.optSelected = d.selected, l.enctype = !!z.createElement("form").enctype, 
        c.disabled = !0, l.optDisabled = !d.disabled, b = z.createElement("input"), b.setAttribute("value", ""), 
        l.input = "" === b.getAttribute("value"), b.value = "t", b.setAttribute("type", "radio"), 
        l.radioValue = "t" === b.value, a = b = c = d = e = null;
    }();
    var mc = /\r/g;
    n.fn.extend({
        val: function(a) {
            var b, c, d, e = this[0];
            {
                if (arguments.length) return d = n.isFunction(a), this.each(function(c) {
                    var e;
                    1 === this.nodeType && (e = d ? a.call(this, c, n(this).val()) : a, null == e ? e = "" : "number" == typeof e ? e += "" : n.isArray(e) && (e = n.map(e, function(a) {
                        return null == a ? "" : a + "";
                    })), b = n.valHooks[this.type] || n.valHooks[this.nodeName.toLowerCase()], b && "set" in b && void 0 !== b.set(this, e, "value") || (this.value = e));
                });
                if (e) return b = n.valHooks[e.type] || n.valHooks[e.nodeName.toLowerCase()], b && "get" in b && void 0 !== (c = b.get(e, "value")) ? c : (c = e.value, 
                "string" == typeof c ? c.replace(mc, "") : null == c ? "" : c);
            }
        }
    }), n.extend({
        valHooks: {
            option: {
                get: function(a) {
                    var b = n.find.attr(a, "value");
                    return null != b ? b : n.text(a);
                }
            },
            select: {
                get: function(a) {
                    for (var b, c, d = a.options, e = a.selectedIndex, f = "select-one" === a.type || 0 > e, g = f ? null : [], h = f ? e + 1 : d.length, i = 0 > e ? h : f ? e : 0; h > i; i++) if (c = d[i], 
                    !(!c.selected && i !== e || (l.optDisabled ? c.disabled : null !== c.getAttribute("disabled")) || c.parentNode.disabled && n.nodeName(c.parentNode, "optgroup"))) {
                        if (b = n(c).val(), f) return b;
                        g.push(b);
                    }
                    return g;
                },
                set: function(a, b) {
                    var c, d, e = a.options, f = n.makeArray(b), g = e.length;
                    while (g--) if (d = e[g], n.inArray(n.valHooks.option.get(d), f) >= 0) try {
                        d.selected = c = !0;
                    } catch (h) {
                        d.scrollHeight;
                    } else d.selected = !1;
                    return c || (a.selectedIndex = -1), e;
                }
            }
        }
    }), n.each([ "radio", "checkbox" ], function() {
        n.valHooks[this] = {
            set: function(a, b) {
                return n.isArray(b) ? a.checked = n.inArray(n(a).val(), b) >= 0 : void 0;
            }
        }, l.checkOn || (n.valHooks[this].get = function(a) {
            return null === a.getAttribute("value") ? "on" : a.value;
        });
    });
    var nc, oc, pc = n.expr.attrHandle, qc = /^(?:checked|selected)$/i, rc = l.getSetAttribute, sc = l.input;
    n.fn.extend({
        attr: function(a, b) {
            return W(this, n.attr, a, b, arguments.length > 1);
        },
        removeAttr: function(a) {
            return this.each(function() {
                n.removeAttr(this, a);
            });
        }
    }), n.extend({
        attr: function(a, b, c) {
            var d, e, f = a.nodeType;
            if (a && 3 !== f && 8 !== f && 2 !== f) return typeof a.getAttribute === L ? n.prop(a, b, c) : (1 === f && n.isXMLDoc(a) || (b = b.toLowerCase(), 
            d = n.attrHooks[b] || (n.expr.match.bool.test(b) ? oc : nc)), void 0 === c ? d && "get" in d && null !== (e = d.get(a, b)) ? e : (e = n.find.attr(a, b), 
            null == e ? void 0 : e) : null !== c ? d && "set" in d && void 0 !== (e = d.set(a, c, b)) ? e : (a.setAttribute(b, c + ""), 
            c) : void n.removeAttr(a, b));
        },
        removeAttr: function(a, b) {
            var c, d, e = 0, f = b && b.match(F);
            if (f && 1 === a.nodeType) while (c = f[e++]) d = n.propFix[c] || c, n.expr.match.bool.test(c) ? sc && rc || !qc.test(c) ? a[d] = !1 : a[n.camelCase("default-" + c)] = a[d] = !1 : n.attr(a, c, ""), 
            a.removeAttribute(rc ? c : d);
        },
        attrHooks: {
            type: {
                set: function(a, b) {
                    if (!l.radioValue && "radio" === b && n.nodeName(a, "input")) {
                        var c = a.value;
                        return a.setAttribute("type", b), c && (a.value = c), b;
                    }
                }
            }
        }
    }), oc = {
        set: function(a, b, c) {
            return b === !1 ? n.removeAttr(a, c) : sc && rc || !qc.test(c) ? a.setAttribute(!rc && n.propFix[c] || c, c) : a[n.camelCase("default-" + c)] = a[c] = !0, 
            c;
        }
    }, n.each(n.expr.match.bool.source.match(/\w+/g), function(a, b) {
        var c = pc[b] || n.find.attr;
        pc[b] = sc && rc || !qc.test(b) ? function(a, b, d) {
            var e, f;
            return d || (f = pc[b], pc[b] = e, e = null != c(a, b, d) ? b.toLowerCase() : null, 
            pc[b] = f), e;
        } : function(a, b, c) {
            return c ? void 0 : a[n.camelCase("default-" + b)] ? b.toLowerCase() : null;
        };
    }), sc && rc || (n.attrHooks.value = {
        set: function(a, b, c) {
            return n.nodeName(a, "input") ? void (a.defaultValue = b) : nc && nc.set(a, b, c);
        }
    }), rc || (nc = {
        set: function(a, b, c) {
            var d = a.getAttributeNode(c);
            return d || a.setAttributeNode(d = a.ownerDocument.createAttribute(c)), d.value = b += "", 
            "value" === c || b === a.getAttribute(c) ? b : void 0;
        }
    }, pc.id = pc.name = pc.coords = function(a, b, c) {
        var d;
        return c ? void 0 : (d = a.getAttributeNode(b)) && "" !== d.value ? d.value : null;
    }, n.valHooks.button = {
        get: function(a, b) {
            var c = a.getAttributeNode(b);
            return c && c.specified ? c.value : void 0;
        },
        set: nc.set
    }, n.attrHooks.contenteditable = {
        set: function(a, b, c) {
            nc.set(a, "" === b ? !1 : b, c);
        }
    }, n.each([ "width", "height" ], function(a, b) {
        n.attrHooks[b] = {
            set: function(a, c) {
                return "" === c ? (a.setAttribute(b, "auto"), c) : void 0;
            }
        };
    })), l.style || (n.attrHooks.style = {
        get: function(a) {
            return a.style.cssText || void 0;
        },
        set: function(a, b) {
            return a.style.cssText = b + "";
        }
    });
    var tc = /^(?:input|select|textarea|button|object)$/i, uc = /^(?:a|area)$/i;
    n.fn.extend({
        prop: function(a, b) {
            return W(this, n.prop, a, b, arguments.length > 1);
        },
        removeProp: function(a) {
            return a = n.propFix[a] || a, this.each(function() {
                try {
                    this[a] = void 0, delete this[a];
                } catch (b) {}
            });
        }
    }), n.extend({
        propFix: {
            "for": "htmlFor",
            "class": "className"
        },
        prop: function(a, b, c) {
            var d, e, f, g = a.nodeType;
            if (a && 3 !== g && 8 !== g && 2 !== g) return f = 1 !== g || !n.isXMLDoc(a), f && (b = n.propFix[b] || b, 
            e = n.propHooks[b]), void 0 !== c ? e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : a[b] = c : e && "get" in e && null !== (d = e.get(a, b)) ? d : a[b];
        },
        propHooks: {
            tabIndex: {
                get: function(a) {
                    var b = n.find.attr(a, "tabindex");
                    return b ? parseInt(b, 10) : tc.test(a.nodeName) || uc.test(a.nodeName) && a.href ? 0 : -1;
                }
            }
        }
    }), l.hrefNormalized || n.each([ "href", "src" ], function(a, b) {
        n.propHooks[b] = {
            get: function(a) {
                return a.getAttribute(b, 4);
            }
        };
    }), l.optSelected || (n.propHooks.selected = {
        get: function(a) {
            var b = a.parentNode;
            return b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex), null;
        }
    }), n.each([ "tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable" ], function() {
        n.propFix[this.toLowerCase()] = this;
    }), l.enctype || (n.propFix.enctype = "encoding");
    var vc = /[\t\r\n\f]/g;
    n.fn.extend({
        addClass: function(a) {
            var b, c, d, e, f, g, h = 0, i = this.length, j = "string" == typeof a && a;
            if (n.isFunction(a)) return this.each(function(b) {
                n(this).addClass(a.call(this, b, this.className));
            });
            if (j) for (b = (a || "").match(F) || []; i > h; h++) if (c = this[h], d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace(vc, " ") : " ")) {
                f = 0;
                while (e = b[f++]) d.indexOf(" " + e + " ") < 0 && (d += e + " ");
                g = n.trim(d), c.className !== g && (c.className = g);
            }
            return this;
        },
        removeClass: function(a) {
            var b, c, d, e, f, g, h = 0, i = this.length, j = 0 === arguments.length || "string" == typeof a && a;
            if (n.isFunction(a)) return this.each(function(b) {
                n(this).removeClass(a.call(this, b, this.className));
            });
            if (j) for (b = (a || "").match(F) || []; i > h; h++) if (c = this[h], d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace(vc, " ") : "")) {
                f = 0;
                while (e = b[f++]) while (d.indexOf(" " + e + " ") >= 0) d = d.replace(" " + e + " ", " ");
                g = a ? n.trim(d) : "", c.className !== g && (c.className = g);
            }
            return this;
        },
        toggleClass: function(a, b) {
            var c = typeof a;
            return "boolean" == typeof b && "string" === c ? b ? this.addClass(a) : this.removeClass(a) : this.each(n.isFunction(a) ? function(c) {
                n(this).toggleClass(a.call(this, c, this.className, b), b);
            } : function() {
                if ("string" === c) {
                    var b, d = 0, e = n(this), f = a.match(F) || [];
                    while (b = f[d++]) e.hasClass(b) ? e.removeClass(b) : e.addClass(b);
                } else (c === L || "boolean" === c) && (this.className && n._data(this, "__className__", this.className), 
                this.className = this.className || a === !1 ? "" : n._data(this, "__className__") || "");
            });
        },
        hasClass: function(a) {
            for (var b = " " + a + " ", c = 0, d = this.length; d > c; c++) if (1 === this[c].nodeType && (" " + this[c].className + " ").replace(vc, " ").indexOf(b) >= 0) return !0;
            return !1;
        }
    }), n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function(a, b) {
        n.fn[b] = function(a, c) {
            return arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b);
        };
    }), n.fn.extend({
        hover: function(a, b) {
            return this.mouseenter(a).mouseleave(b || a);
        },
        bind: function(a, b, c) {
            return this.on(a, null, b, c);
        },
        unbind: function(a, b) {
            return this.off(a, null, b);
        },
        delegate: function(a, b, c, d) {
            return this.on(b, a, c, d);
        },
        undelegate: function(a, b, c) {
            return 1 === arguments.length ? this.off(a, "**") : this.off(b, a || "**", c);
        }
    });
    var wc = n.now(), xc = /\?/, yc = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;
    n.parseJSON = function(b) {
        if (a.JSON && a.JSON.parse) return a.JSON.parse(b + "");
        var c, d = null, e = n.trim(b + "");
        return e && !n.trim(e.replace(yc, function(a, b, e, f) {
            return c && b && (d = 0), 0 === d ? a : (c = e || b, d += !f - !e, "");
        })) ? Function("return " + e)() : n.error("Invalid JSON: " + b);
    }, n.parseXML = function(b) {
        var c, d;
        if (!b || "string" != typeof b) return null;
        try {
            a.DOMParser ? (d = new DOMParser(), c = d.parseFromString(b, "text/xml")) : (c = new ActiveXObject("Microsoft.XMLDOM"), 
            c.async = "false", c.loadXML(b));
        } catch (e) {
            c = void 0;
        }
        return c && c.documentElement && !c.getElementsByTagName("parsererror").length || n.error("Invalid XML: " + b), 
        c;
    };
    var zc, Ac, Bc = /#.*$/, Cc = /([?&])_=[^&]*/, Dc = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm, Ec = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, Fc = /^(?:GET|HEAD)$/, Gc = /^\/\//, Hc = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/, Ic = {}, Jc = {}, Kc = "*/".concat("*");
    try {
        Ac = location.href;
    } catch (Lc) {
        Ac = z.createElement("a"), Ac.href = "", Ac = Ac.href;
    }
    zc = Hc.exec(Ac.toLowerCase()) || [];
    function Mc(a) {
        return function(b, c) {
            "string" != typeof b && (c = b, b = "*");
            var d, e = 0, f = b.toLowerCase().match(F) || [];
            if (n.isFunction(c)) while (d = f[e++]) "+" === d.charAt(0) ? (d = d.slice(1) || "*", 
            (a[d] = a[d] || []).unshift(c)) : (a[d] = a[d] || []).push(c);
        };
    }
    function Nc(a, b, c, d) {
        var e = {}, f = a === Jc;
        function g(h) {
            var i;
            return e[h] = !0, n.each(a[h] || [], function(a, h) {
                var j = h(b, c, d);
                return "string" != typeof j || f || e[j] ? f ? !(i = j) : void 0 : (b.dataTypes.unshift(j), 
                g(j), !1);
            }), i;
        }
        return g(b.dataTypes[0]) || !e["*"] && g("*");
    }
    function Oc(a, b) {
        var c, d, e = n.ajaxSettings.flatOptions || {};
        for (d in b) void 0 !== b[d] && ((e[d] ? a : c || (c = {}))[d] = b[d]);
        return c && n.extend(!0, a, c), a;
    }
    function Pc(a, b, c) {
        var d, e, f, g, h = a.contents, i = a.dataTypes;
        while ("*" === i[0]) i.shift(), void 0 === e && (e = a.mimeType || b.getResponseHeader("Content-Type"));
        if (e) for (g in h) if (h[g] && h[g].test(e)) {
            i.unshift(g);
            break;
        }
        if (i[0] in c) f = i[0]; else {
            for (g in c) {
                if (!i[0] || a.converters[g + " " + i[0]]) {
                    f = g;
                    break;
                }
                d || (d = g);
            }
            f = f || d;
        }
        return f ? (f !== i[0] && i.unshift(f), c[f]) : void 0;
    }
    function Qc(a, b, c, d) {
        var e, f, g, h, i, j = {}, k = a.dataTypes.slice();
        if (k[1]) for (g in a.converters) j[g.toLowerCase()] = a.converters[g];
        f = k.shift();
        while (f) if (a.responseFields[f] && (c[a.responseFields[f]] = b), !i && d && a.dataFilter && (b = a.dataFilter(b, a.dataType)), 
        i = f, f = k.shift()) if ("*" === f) f = i; else if ("*" !== i && i !== f) {
            if (g = j[i + " " + f] || j["* " + f], !g) for (e in j) if (h = e.split(" "), h[1] === f && (g = j[i + " " + h[0]] || j["* " + h[0]])) {
                g === !0 ? g = j[e] : j[e] !== !0 && (f = h[0], k.unshift(h[1]));
                break;
            }
            if (g !== !0) if (g && a["throws"]) b = g(b); else try {
                b = g(b);
            } catch (l) {
                return {
                    state: "parsererror",
                    error: g ? l : "No conversion from " + i + " to " + f
                };
            }
        }
        return {
            state: "success",
            data: b
        };
    }
    n.extend({
        active: 0,
        lastModified: {},
        etag: {},
        ajaxSettings: {
            url: Ac,
            type: "GET",
            isLocal: Ec.test(zc[1]),
            global: !0,
            processData: !0,
            async: !0,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            accepts: {
                "*": Kc,
                text: "text/plain",
                html: "text/html",
                xml: "application/xml, text/xml",
                json: "application/json, text/javascript"
            },
            contents: {
                xml: /xml/,
                html: /html/,
                json: /json/
            },
            responseFields: {
                xml: "responseXML",
                text: "responseText",
                json: "responseJSON"
            },
            converters: {
                "* text": String,
                "text html": !0,
                "text json": n.parseJSON,
                "text xml": n.parseXML
            },
            flatOptions: {
                url: !0,
                context: !0
            }
        },
        ajaxSetup: function(a, b) {
            return b ? Oc(Oc(a, n.ajaxSettings), b) : Oc(n.ajaxSettings, a);
        },
        ajaxPrefilter: Mc(Ic),
        ajaxTransport: Mc(Jc),
        ajax: function(a, b) {
            "object" == typeof a && (b = a, a = void 0), b = b || {};
            var c, d, e, f, g, h, i, j, k = n.ajaxSetup({}, b), l = k.context || k, m = k.context && (l.nodeType || l.jquery) ? n(l) : n.event, o = n.Deferred(), p = n.Callbacks("once memory"), q = k.statusCode || {}, r = {}, s = {}, t = 0, u = "canceled", v = {
                readyState: 0,
                getResponseHeader: function(a) {
                    var b;
                    if (2 === t) {
                        if (!j) {
                            j = {};
                            while (b = Dc.exec(f)) j[b[1].toLowerCase()] = b[2];
                        }
                        b = j[a.toLowerCase()];
                    }
                    return null == b ? null : b;
                },
                getAllResponseHeaders: function() {
                    return 2 === t ? f : null;
                },
                setRequestHeader: function(a, b) {
                    var c = a.toLowerCase();
                    return t || (a = s[c] = s[c] || a, r[a] = b), this;
                },
                overrideMimeType: function(a) {
                    return t || (k.mimeType = a), this;
                },
                statusCode: function(a) {
                    var b;
                    if (a) if (2 > t) for (b in a) q[b] = [ q[b], a[b] ]; else v.always(a[v.status]);
                    return this;
                },
                abort: function(a) {
                    var b = a || u;
                    return i && i.abort(b), x(0, b), this;
                }
            };
            if (o.promise(v).complete = p.add, v.success = v.done, v.error = v.fail, k.url = ((a || k.url || Ac) + "").replace(Bc, "").replace(Gc, zc[1] + "//"), 
            k.type = b.method || b.type || k.method || k.type, k.dataTypes = n.trim(k.dataType || "*").toLowerCase().match(F) || [ "" ], 
            null == k.crossDomain && (c = Hc.exec(k.url.toLowerCase()), k.crossDomain = !(!c || c[1] === zc[1] && c[2] === zc[2] && (c[3] || ("http:" === c[1] ? "80" : "443")) === (zc[3] || ("http:" === zc[1] ? "80" : "443")))), 
            k.data && k.processData && "string" != typeof k.data && (k.data = n.param(k.data, k.traditional)), 
            Nc(Ic, k, b, v), 2 === t) return v;
            h = k.global, h && 0 === n.active++ && n.event.trigger("ajaxStart"), k.type = k.type.toUpperCase(), 
            k.hasContent = !Fc.test(k.type), e = k.url, k.hasContent || (k.data && (e = k.url += (xc.test(e) ? "&" : "?") + k.data, 
            delete k.data), k.cache === !1 && (k.url = Cc.test(e) ? e.replace(Cc, "$1_=" + wc++) : e + (xc.test(e) ? "&" : "?") + "_=" + wc++)), 
            k.ifModified && (n.lastModified[e] && v.setRequestHeader("If-Modified-Since", n.lastModified[e]), 
            n.etag[e] && v.setRequestHeader("If-None-Match", n.etag[e])), (k.data && k.hasContent && k.contentType !== !1 || b.contentType) && v.setRequestHeader("Content-Type", k.contentType), 
            v.setRequestHeader("Accept", k.dataTypes[0] && k.accepts[k.dataTypes[0]] ? k.accepts[k.dataTypes[0]] + ("*" !== k.dataTypes[0] ? ", " + Kc + "; q=0.01" : "") : k.accepts["*"]);
            for (d in k.headers) v.setRequestHeader(d, k.headers[d]);
            if (k.beforeSend && (k.beforeSend.call(l, v, k) === !1 || 2 === t)) return v.abort();
            u = "abort";
            for (d in {
                success: 1,
                error: 1,
                complete: 1
            }) v[d](k[d]);
            if (i = Nc(Jc, k, b, v)) {
                v.readyState = 1, h && m.trigger("ajaxSend", [ v, k ]), k.async && k.timeout > 0 && (g = setTimeout(function() {
                    v.abort("timeout");
                }, k.timeout));
                try {
                    t = 1, i.send(r, x);
                } catch (w) {
                    if (!(2 > t)) throw w;
                    x(-1, w);
                }
            } else x(-1, "No Transport");
            function x(a, b, c, d) {
                var j, r, s, u, w, x = b;
                2 !== t && (t = 2, g && clearTimeout(g), i = void 0, f = d || "", v.readyState = a > 0 ? 4 : 0, 
                j = a >= 200 && 300 > a || 304 === a, c && (u = Pc(k, v, c)), u = Qc(k, u, v, j), 
                j ? (k.ifModified && (w = v.getResponseHeader("Last-Modified"), w && (n.lastModified[e] = w), 
                w = v.getResponseHeader("etag"), w && (n.etag[e] = w)), 204 === a || "HEAD" === k.type ? x = "nocontent" : 304 === a ? x = "notmodified" : (x = u.state, 
                r = u.data, s = u.error, j = !s)) : (s = x, (a || !x) && (x = "error", 0 > a && (a = 0))), 
                v.status = a, v.statusText = (b || x) + "", j ? o.resolveWith(l, [ r, x, v ]) : o.rejectWith(l, [ v, x, s ]), 
                v.statusCode(q), q = void 0, h && m.trigger(j ? "ajaxSuccess" : "ajaxError", [ v, k, j ? r : s ]), 
                p.fireWith(l, [ v, x ]), h && (m.trigger("ajaxComplete", [ v, k ]), --n.active || n.event.trigger("ajaxStop")));
            }
            return v;
        },
        getJSON: function(a, b, c) {
            return n.get(a, b, c, "json");
        },
        getScript: function(a, b) {
            return n.get(a, void 0, b, "script");
        }
    }), n.each([ "get", "post" ], function(a, b) {
        n[b] = function(a, c, d, e) {
            return n.isFunction(c) && (e = e || d, d = c, c = void 0), n.ajax({
                url: a,
                type: b,
                dataType: e,
                data: c,
                success: d
            });
        };
    }), n.each([ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function(a, b) {
        n.fn[b] = function(a) {
            return this.on(b, a);
        };
    }), n._evalUrl = function(a) {
        return n.ajax({
            url: a,
            type: "GET",
            dataType: "script",
            async: !1,
            global: !1,
            "throws": !0
        });
    }, n.fn.extend({
        wrapAll: function(a) {
            if (n.isFunction(a)) return this.each(function(b) {
                n(this).wrapAll(a.call(this, b));
            });
            if (this[0]) {
                var b = n(a, this[0].ownerDocument).eq(0).clone(!0);
                this[0].parentNode && b.insertBefore(this[0]), b.map(function() {
                    var a = this;
                    while (a.firstChild && 1 === a.firstChild.nodeType) a = a.firstChild;
                    return a;
                }).append(this);
            }
            return this;
        },
        wrapInner: function(a) {
            return this.each(n.isFunction(a) ? function(b) {
                n(this).wrapInner(a.call(this, b));
            } : function() {
                var b = n(this), c = b.contents();
                c.length ? c.wrapAll(a) : b.append(a);
            });
        },
        wrap: function(a) {
            var b = n.isFunction(a);
            return this.each(function(c) {
                n(this).wrapAll(b ? a.call(this, c) : a);
            });
        },
        unwrap: function() {
            return this.parent().each(function() {
                n.nodeName(this, "body") || n(this).replaceWith(this.childNodes);
            }).end();
        }
    }), n.expr.filters.hidden = function(a) {
        return a.offsetWidth <= 0 && a.offsetHeight <= 0 || !l.reliableHiddenOffsets() && "none" === (a.style && a.style.display || n.css(a, "display"));
    }, n.expr.filters.visible = function(a) {
        return !n.expr.filters.hidden(a);
    };
    var Rc = /%20/g, Sc = /\[\]$/, Tc = /\r?\n/g, Uc = /^(?:submit|button|image|reset|file)$/i, Vc = /^(?:input|select|textarea|keygen)/i;
    function Wc(a, b, c, d) {
        var e;
        if (n.isArray(b)) n.each(b, function(b, e) {
            c || Sc.test(a) ? d(a, e) : Wc(a + "[" + ("object" == typeof e ? b : "") + "]", e, c, d);
        }); else if (c || "object" !== n.type(b)) d(a, b); else for (e in b) Wc(a + "[" + e + "]", b[e], c, d);
    }
    n.param = function(a, b) {
        var c, d = [], e = function(a, b) {
            b = n.isFunction(b) ? b() : null == b ? "" : b, d[d.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b);
        };
        if (void 0 === b && (b = n.ajaxSettings && n.ajaxSettings.traditional), n.isArray(a) || a.jquery && !n.isPlainObject(a)) n.each(a, function() {
            e(this.name, this.value);
        }); else for (c in a) Wc(c, a[c], b, e);
        return d.join("&").replace(Rc, "+");
    }, n.fn.extend({
        serialize: function() {
            return n.param(this.serializeArray());
        },
        serializeArray: function() {
            return this.map(function() {
                var a = n.prop(this, "elements");
                return a ? n.makeArray(a) : this;
            }).filter(function() {
                var a = this.type;
                return this.name && !n(this).is(":disabled") && Vc.test(this.nodeName) && !Uc.test(a) && (this.checked || !X.test(a));
            }).map(function(a, b) {
                var c = n(this).val();
                return null == c ? null : n.isArray(c) ? n.map(c, function(a) {
                    return {
                        name: b.name,
                        value: a.replace(Tc, "\r\n")
                    };
                }) : {
                    name: b.name,
                    value: c.replace(Tc, "\r\n")
                };
            }).get();
        }
    }), n.ajaxSettings.xhr = void 0 !== a.ActiveXObject ? function() {
        return !this.isLocal && /^(get|post|head|put|delete|options)$/i.test(this.type) && $c() || _c();
    } : $c;
    var Xc = 0, Yc = {}, Zc = n.ajaxSettings.xhr();
    a.ActiveXObject && n(a).on("unload", function() {
        for (var a in Yc) Yc[a](void 0, !0);
    }), l.cors = !!Zc && "withCredentials" in Zc, Zc = l.ajax = !!Zc, Zc && n.ajaxTransport(function(a) {
        if (!a.crossDomain || l.cors) {
            var b;
            return {
                send: function(c, d) {
                    var e, f = a.xhr(), g = ++Xc;
                    if (f.open(a.type, a.url, a.async, a.username, a.password), a.xhrFields) for (e in a.xhrFields) f[e] = a.xhrFields[e];
                    a.mimeType && f.overrideMimeType && f.overrideMimeType(a.mimeType), a.crossDomain || c["X-Requested-With"] || (c["X-Requested-With"] = "XMLHttpRequest");
                    for (e in c) void 0 !== c[e] && f.setRequestHeader(e, c[e] + "");
                    f.send(a.hasContent && a.data || null), b = function(c, e) {
                        var h, i, j;
                        if (b && (e || 4 === f.readyState)) if (delete Yc[g], b = void 0, f.onreadystatechange = n.noop, 
                        e) 4 !== f.readyState && f.abort(); else {
                            j = {}, h = f.status, "string" == typeof f.responseText && (j.text = f.responseText);
                            try {
                                i = f.statusText;
                            } catch (k) {
                                i = "";
                            }
                            h || !a.isLocal || a.crossDomain ? 1223 === h && (h = 204) : h = j.text ? 200 : 404;
                        }
                        j && d(h, i, j, f.getAllResponseHeaders());
                    }, a.async ? 4 === f.readyState ? setTimeout(b) : f.onreadystatechange = Yc[g] = b : b();
                },
                abort: function() {
                    b && b(void 0, !0);
                }
            };
        }
    });
    function $c() {
        try {
            return new a.XMLHttpRequest();
        } catch (b) {}
    }
    function _c() {
        try {
            return new a.ActiveXObject("Microsoft.XMLHTTP");
        } catch (b) {}
    }
    n.ajaxSetup({
        accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
            script: /(?:java|ecma)script/
        },
        converters: {
            "text script": function(a) {
                return n.globalEval(a), a;
            }
        }
    }), n.ajaxPrefilter("script", function(a) {
        void 0 === a.cache && (a.cache = !1), a.crossDomain && (a.type = "GET", a.global = !1);
    }), n.ajaxTransport("script", function(a) {
        if (a.crossDomain) {
            var b, c = z.head || n("head")[0] || z.documentElement;
            return {
                send: function(d, e) {
                    b = z.createElement("script"), b.async = !0, a.scriptCharset && (b.charset = a.scriptCharset), 
                    b.src = a.url, b.onload = b.onreadystatechange = function(a, c) {
                        (c || !b.readyState || /loaded|complete/.test(b.readyState)) && (b.onload = b.onreadystatechange = null, 
                        b.parentNode && b.parentNode.removeChild(b), b = null, c || e(200, "success"));
                    }, c.insertBefore(b, c.firstChild);
                },
                abort: function() {
                    b && b.onload(void 0, !0);
                }
            };
        }
    });
    var ad = [], bd = /(=)\?(?=&|$)|\?\?/;
    n.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
            var a = ad.pop() || n.expando + "_" + wc++;
            return this[a] = !0, a;
        }
    }), n.ajaxPrefilter("json jsonp", function(b, c, d) {
        var e, f, g, h = b.jsonp !== !1 && (bd.test(b.url) ? "url" : "string" == typeof b.data && !(b.contentType || "").indexOf("application/x-www-form-urlencoded") && bd.test(b.data) && "data");
        return h || "jsonp" === b.dataTypes[0] ? (e = b.jsonpCallback = n.isFunction(b.jsonpCallback) ? b.jsonpCallback() : b.jsonpCallback, 
        h ? b[h] = b[h].replace(bd, "$1" + e) : b.jsonp !== !1 && (b.url += (xc.test(b.url) ? "&" : "?") + b.jsonp + "=" + e), 
        b.converters["script json"] = function() {
            return g || n.error(e + " was not called"), g[0];
        }, b.dataTypes[0] = "json", f = a[e], a[e] = function() {
            g = arguments;
        }, d.always(function() {
            a[e] = f, b[e] && (b.jsonpCallback = c.jsonpCallback, ad.push(e)), g && n.isFunction(f) && f(g[0]), 
            g = f = void 0;
        }), "script") : void 0;
    }), n.parseHTML = function(a, b, c) {
        if (!a || "string" != typeof a) return null;
        "boolean" == typeof b && (c = b, b = !1), b = b || z;
        var d = v.exec(a), e = !c && [];
        return d ? [ b.createElement(d[1]) ] : (d = n.buildFragment([ a ], b, e), e && e.length && n(e).remove(), 
        n.merge([], d.childNodes));
    };
    var cd = n.fn.load;
    n.fn.load = function(a, b, c) {
        if ("string" != typeof a && cd) return cd.apply(this, arguments);
        var d, e, f, g = this, h = a.indexOf(" ");
        return h >= 0 && (d = a.slice(h, a.length), a = a.slice(0, h)), n.isFunction(b) ? (c = b, 
        b = void 0) : b && "object" == typeof b && (f = "POST"), g.length > 0 && n.ajax({
            url: a,
            type: f,
            dataType: "html",
            data: b
        }).done(function(a) {
            e = arguments, g.html(d ? n("<div>").append(n.parseHTML(a)).find(d) : a);
        }).complete(c && function(a, b) {
            g.each(c, e || [ a.responseText, b, a ]);
        }), this;
    }, n.expr.filters.animated = function(a) {
        return n.grep(n.timers, function(b) {
            return a === b.elem;
        }).length;
    };
    var dd = a.document.documentElement;
    function ed(a) {
        return n.isWindow(a) ? a : 9 === a.nodeType ? a.defaultView || a.parentWindow : !1;
    }
    n.offset = {
        setOffset: function(a, b, c) {
            var d, e, f, g, h, i, j, k = n.css(a, "position"), l = n(a), m = {};
            "static" === k && (a.style.position = "relative"), h = l.offset(), f = n.css(a, "top"), 
            i = n.css(a, "left"), j = ("absolute" === k || "fixed" === k) && n.inArray("auto", [ f, i ]) > -1, 
            j ? (d = l.position(), g = d.top, e = d.left) : (g = parseFloat(f) || 0, e = parseFloat(i) || 0), 
            n.isFunction(b) && (b = b.call(a, c, h)), null != b.top && (m.top = b.top - h.top + g), 
            null != b.left && (m.left = b.left - h.left + e), "using" in b ? b.using.call(a, m) : l.css(m);
        }
    }, n.fn.extend({
        offset: function(a) {
            if (arguments.length) return void 0 === a ? this : this.each(function(b) {
                n.offset.setOffset(this, a, b);
            });
            var b, c, d = {
                top: 0,
                left: 0
            }, e = this[0], f = e && e.ownerDocument;
            if (f) return b = f.documentElement, n.contains(b, e) ? (typeof e.getBoundingClientRect !== L && (d = e.getBoundingClientRect()), 
            c = ed(f), {
                top: d.top + (c.pageYOffset || b.scrollTop) - (b.clientTop || 0),
                left: d.left + (c.pageXOffset || b.scrollLeft) - (b.clientLeft || 0)
            }) : d;
        },
        position: function() {
            if (this[0]) {
                var a, b, c = {
                    top: 0,
                    left: 0
                }, d = this[0];
                return "fixed" === n.css(d, "position") ? b = d.getBoundingClientRect() : (a = this.offsetParent(), 
                b = this.offset(), n.nodeName(a[0], "html") || (c = a.offset()), c.top += n.css(a[0], "borderTopWidth", !0), 
                c.left += n.css(a[0], "borderLeftWidth", !0)), {
                    top: b.top - c.top - n.css(d, "marginTop", !0),
                    left: b.left - c.left - n.css(d, "marginLeft", !0)
                };
            }
        },
        offsetParent: function() {
            return this.map(function() {
                var a = this.offsetParent || dd;
                while (a && !n.nodeName(a, "html") && "static" === n.css(a, "position")) a = a.offsetParent;
                return a || dd;
            });
        }
    }), n.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(a, b) {
        var c = /Y/.test(b);
        n.fn[a] = function(d) {
            return W(this, function(a, d, e) {
                var f = ed(a);
                return void 0 === e ? f ? b in f ? f[b] : f.document.documentElement[d] : a[d] : void (f ? f.scrollTo(c ? n(f).scrollLeft() : e, c ? e : n(f).scrollTop()) : a[d] = e);
            }, a, d, arguments.length, null);
        };
    }), n.each([ "top", "left" ], function(a, b) {
        n.cssHooks[b] = Mb(l.pixelPosition, function(a, c) {
            return c ? (c = Kb(a, b), Ib.test(c) ? n(a).position()[b] + "px" : c) : void 0;
        });
    }), n.each({
        Height: "height",
        Width: "width"
    }, function(a, b) {
        n.each({
            padding: "inner" + a,
            content: b,
            "": "outer" + a
        }, function(c, d) {
            n.fn[d] = function(d, e) {
                var f = arguments.length && (c || "boolean" != typeof d), g = c || (d === !0 || e === !0 ? "margin" : "border");
                return W(this, function(b, c, d) {
                    var e;
                    return n.isWindow(b) ? b.document.documentElement["client" + a] : 9 === b.nodeType ? (e = b.documentElement, 
                    Math.max(b.body["scroll" + a], e["scroll" + a], b.body["offset" + a], e["offset" + a], e["client" + a])) : void 0 === d ? n.css(b, c, g) : n.style(b, c, d, g);
                }, b, f ? d : void 0, f, null);
            };
        });
    }), n.fn.size = function() {
        return this.length;
    }, n.fn.andSelf = n.fn.addBack, "function" == typeof define && define.amd && define("jquery", [], function() {
        return n;
    });
    var fd = a.jQuery, gd = a.$;
    return n.noConflict = function(b) {
        return a.$ === n && (a.$ = gd), b && a.jQuery === n && (a.jQuery = fd), n;
    }, typeof b === L && (a.jQuery = a.$ = n), n;
});

(function() {
    var a;
    a = function(a) {
        var b, c;
        return b = !1, a(function() {
            var d;
            return d = (document.body || document.documentElement).style, b = void 0 !== d.animation || void 0 !== d.WebkitAnimation || void 0 !== d.MozAnimation || void 0 !== d.MsAnimation || void 0 !== d.OAnimation, 
            a(window).bind("keyup.vex", function(a) {
                return 27 === a.keyCode ? c.closeByEscape() : void 0;
            });
        }), c = {
            globalID: 1,
            animationEndEvent: "animationend webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend",
            baseClassNames: {
                vex: "vex",
                content: "vex-content",
                overlay: "vex-overlay",
                close: "vex-close",
                closing: "vex-closing",
                open: "vex-open"
            },
            defaultOptions: {
                content: "",
                showCloseButton: !0,
                escapeButtonCloses: !0,
                overlayClosesOnClick: !0,
                appendLocation: "body",
                className: "",
                css: {},
                overlayClassName: "",
                overlayCSS: {},
                contentClassName: "",
                contentCSS: {},
                closeClassName: "",
                closeCSS: {}
            },
            open: function(b) {
                return b = a.extend({}, c.defaultOptions, b), b.id = c.globalID, c.globalID += 1, 
                b.$vex = a("<div>").addClass(c.baseClassNames.vex).addClass(b.className).css(b.css).data({
                    vex: b
                }), b.$vexOverlay = a("<div>").addClass(c.baseClassNames.overlay).addClass(b.overlayClassName).css(b.overlayCSS).data({
                    vex: b
                }), b.overlayClosesOnClick && b.$vexOverlay.bind("click.vex", function(b) {
                    return b.target === this ? c.close(a(this).data().vex.id) : void 0;
                }), b.$vex.append(b.$vexOverlay), b.$vexContent = a("<div>").addClass(c.baseClassNames.content).addClass(b.contentClassName).css(b.contentCSS).append(b.content).data({
                    vex: b
                }), b.$vex.append(b.$vexContent), b.showCloseButton && (b.$closeButton = a("<div>").addClass(c.baseClassNames.close).addClass(b.closeClassName).css(b.closeCSS).data({
                    vex: b
                }).bind("click.vex", function() {
                    return c.close(a(this).data().vex.id);
                }), b.$vexContent.append(b.$closeButton)), a(b.appendLocation).append(b.$vex), c.setupBodyClassName(b.$vex), 
                b.afterOpen && b.afterOpen(b.$vexContent, b), setTimeout(function() {
                    return b.$vexContent.trigger("vexOpen", b);
                }, 0), b.$vexContent;
            },
            getAllVexes: function() {
                return a("." + c.baseClassNames.vex + ':not(".' + c.baseClassNames.closing + '") .' + c.baseClassNames.content);
            },
            getVexByID: function(b) {
                return c.getAllVexes().filter(function() {
                    return a(this).data().vex.id === b;
                });
            },
            close: function(a) {
                var b;
                if (!a) {
                    if (b = c.getAllVexes().last(), !b.length) return !1;
                    a = b.data().vex.id;
                }
                return c.closeByID(a);
            },
            closeAll: function() {
                var b;
                return b = c.getAllVexes().map(function() {
                    return a(this).data().vex.id;
                }).toArray(), (null != b ? b.length : void 0) ? (a.each(b.reverse(), function(a, b) {
                    return c.closeByID(b);
                }), !0) : !1;
            },
            closeByID: function(d) {
                var e, f, g, h, i;
                return f = c.getVexByID(d), f.length ? (e = f.data().vex.$vex, i = a.extend({}, f.data().vex), 
                g = function() {
                    return i.beforeClose ? i.beforeClose(f, i) : void 0;
                }, h = function() {
                    return f.trigger("vexClose", i), e.remove(), i.afterClose ? i.afterClose(f, i) : void 0;
                }, b ? (g(), e.unbind(c.animationEndEvent).bind(c.animationEndEvent, function() {
                    return h();
                }).addClass(c.baseClassNames.closing)) : (g(), h()), !0) : void 0;
            },
            closeByEscape: function() {
                var b, d, e;
                return e = c.getAllVexes().map(function() {
                    return a(this).data().vex.id;
                }).toArray(), (null != e ? e.length : void 0) ? (d = Math.max.apply(Math, e), b = c.getVexByID(d), 
                b.data().vex.escapeButtonCloses !== !0 ? !1 : c.closeByID(d)) : !1;
            },
            setupBodyClassName: function(b) {
                return b.bind("vexOpen.vex", function() {
                    return a("body").addClass(c.baseClassNames.open);
                }).bind("vexClose.vex", function() {
                    return c.getAllVexes().length ? void 0 : a("body").removeClass(c.baseClassNames.open);
                });
            },
            hideLoading: function() {
                return a(".vex-loading-spinner").remove();
            },
            showLoading: function() {
                return c.hideLoading(), a("body").append('<div class="vex-loading-spinner ' + c.defaultOptions.className + '"></div>');
            }
        };
    }, "function" == typeof define && define.amd ? define([ "jquery" ], a) : "object" == typeof exports ? module.exports = a(require("jquery")) : window.vex = a(jQuery);
}).call(this), function() {
    var a;
    a = function(a, b) {
        var c, d;
        return null == b ? a.error("Vex is required to use vex.dialog") : (c = function(b) {
            var c;
            return c = {}, a.each(b.serializeArray(), function() {
                return c[this.name] ? (c[this.name].push || (c[this.name] = [ c[this.name] ]), c[this.name].push(this.value || "")) : c[this.name] = this.value || "";
            }), c;
        }, d = {}, d.buttons = {
            YES: {
                text: "OK",
                type: "submit",
                className: "vex-dialog-button-primary"
            },
            NO: {
                text: "Cancel",
                type: "button",
                className: "vex-dialog-button-secondary",
                click: function(a) {
                    return a.data().vex.value = !1, b.close(a.data().vex.id);
                }
            }
        }, d.defaultOptions = {
            callback: function() {},
            afterOpen: function() {},
            message: "Message",
            input: '<input name="vex" type="hidden" value="_vex-empty-value" />',
            value: !1,
            buttons: [ d.buttons.YES, d.buttons.NO ],
            showCloseButton: !1,
            onSubmit: function(e) {
                var f, g;
                return f = a(this), g = f.parent(), e.preventDefault(), e.stopPropagation(), g.data().vex.value = d.getFormValueOnSubmit(c(f)), 
                b.close(g.data().vex.id);
            },
            focusFirstInput: !0
        }, d.defaultAlertOptions = {
            message: "Alert",
            buttons: [ d.buttons.YES ]
        }, d.defaultConfirmOptions = {
            message: "Confirm"
        }, d.open = function(c) {
            var e;
            return c = a.extend({}, b.defaultOptions, d.defaultOptions, c), c.content = d.buildDialogForm(c), 
            c.beforeClose = function(a) {
                return c.callback(a.data().vex.value);
            }, e = b.open(c), c.focusFirstInput && e.find('input[type="submit"], textarea, input[type="date"], input[type="datetime"], input[type="datetime-local"], input[type="email"], input[type="month"], input[type="number"], input[type="password"], input[type="search"], input[type="tel"], input[type="text"], input[type="time"], input[type="url"], input[type="week"]').first().focus(), 
            e;
        }, d.alert = function(b) {
            return "string" == typeof b && (b = {
                message: b
            }), b = a.extend({}, d.defaultAlertOptions, b), d.open(b);
        }, d.confirm = function(b) {
            return "string" == typeof b ? a.error("dialog.confirm(options) requires options.callback.") : (b = a.extend({}, d.defaultConfirmOptions, b), 
            d.open(b));
        }, d.prompt = function(b) {
            var c;
            return "string" == typeof b ? a.error("dialog.prompt(options) requires options.callback.") : (c = {
                message: '<label for="vex">' + (b.label || "Prompt:") + "</label>",
                input: '<input name="vex" type="text" class="vex-dialog-prompt-input" placeholder="' + (b.placeholder || "") + '"  value="' + (b.value || "") + '" />'
            }, b = a.extend({}, c, b), d.open(b));
        }, d.buildDialogForm = function(b) {
            var c, e, f;
            return c = a('<form class="vex-dialog-form" />'), f = a('<div class="vex-dialog-message" />'), 
            e = a('<div class="vex-dialog-input" />'), c.append(f.append(b.message)).append(e.append(b.input)).append(d.buttonsToDOM(b.buttons)).bind("submit.vex", b.onSubmit), 
            c;
        }, d.getFormValueOnSubmit = function(a) {
            return a.vex || "" === a.vex ? "_vex-empty-value" === a.vex ? !0 : a.vex : a;
        }, d.buttonsToDOM = function(c) {
            var d;
            return d = a('<div class="vex-dialog-buttons" />'), a.each(c, function(e, f) {
                return d.append(a('<input type="' + f.type + '" />').val(f.text).addClass(f.className + " vex-dialog-button " + (0 === e ? "vex-first " : "") + (e === c.length - 1 ? "vex-last " : "")).bind("click.vex", function(c) {
                    return f.click ? f.click(a(this).parents("." + b.baseClassNames.content), c) : void 0;
                }));
            }), d;
        }, d);
    }, "function" == typeof define && define.amd ? define([ "jquery", "vex" ], a) : "object" == typeof exports ? module.exports = a(require("jquery"), require("vex")) : window.vex.dialog = a(window.jQuery, window.vex);
}.call(this);