// Auto-generated from make depends; all changes here will be lost. CellMaster
var SocialCalc;
SocialCalc || (SocialCalc = {});
SocialCalc.Constants = {cellDataType:{v:"value", n:"value", t:"text", f:"formula", c:"constant"}, textdatadefaulttype:"t", s_BrowserNotSupported:"Browser not supported.", s_InternalError:"Internal SocialCalc error (probably an internal bug): ", s_pssUnknownColType:"Unknown col type item", s_pssUnknownRowType:"Unknown row type item", s_pssUnknownLineType:"Unknown line type", s_cfspUnknownCellType:"Unknown cell type item", doCanonicalizeSheet:!0, s_escUnknownSheetCmd:"Unknown sheet command: ", s_escUnknownSetCoordCmd:"Unknown set coord command: ", 
s_escUnknownCmd:"Unknown command: ", s_caccCircRef:"Circular reference to ", defaultRowNameWidth:"30", defaultAssumedRowHeight:15, defaultCellIDPrefix:"cell_", defaultCellLayout:"padding:2px 2px 1px 2px;vertical-align:top;", defaultCellFontStyle:"normal normal", defaultCellFontSize:"small", defaultCellFontFamily:"Verdana,Arial,Helvetica,sans-serif", defaultPaneDividerWidth:"3", defaultPaneDividerHeight:"3", defaultGridCSS:"1px solid #C0C0C0;", defaultCommentClass:"", defaultCommentStyle:"background-repeat:no-repeat;background-position:top right;background-image:url(images/sc-commentbg.gif);", 
defaultCommentNoGridClass:"", defaultCommentNoGridStyle:"", defaultReadonlyClass:"", defaultReadonlyStyle:"background-repeat:no-repeat;background-position:top right;background-image:url(images/sc-lockbg.gif);", defaultReadonlyNoGridClass:"", defaultReadonlyNoGridStyle:"", defaultReadonlyComment:"Locked cell", defaultColWidth:"80", defaultMinimumColWidth:10, defaultHighlightTypeCursorClass:"", defaultHighlightTypeCursorStyle:"color:#FFF;backgroundColor:#A6A6A6;", defaultHighlightTypeRangeClass:"", 
defaultHighlightTypeRangeStyle:"color:#000;backgroundColor:#E5E5E5;", defaultColnameClass:"", defaultColnameStyle:"overflow:visible;font-size:small;text-align:center;color:#FFFFFF;background-color:#808080;", defaultSelectedColnameClass:"", defaultSelectedColnameStyle:"overflow:visible;font-size:small;text-align:center;color:#FFFFFF;background-color:#404040;", defaultRownameClass:"", defaultRownameStyle:"position:relative;overflow:visible;font-size:small;text-align:right;color:#FFFFFF;background-color:#808080;", 
defaultSelectedRownameClass:"", defaultSelectedRownameStyle:"position:relative;overflow:visible;font-size:small;text-align:right;color:#FFFFFF;background-color:#404040;", defaultUpperLeftClass:"", defaultUpperLeftStyle:"font-size:small;", defaultSkippedCellClass:"", defaultSkippedCellStyle:"font-size:small;background-color:#CCC", defaultPaneDividerClass:"", defaultPaneDividerStyle:"font-size:small;background-color:#C0C0C0;padding:0px;", defaultUnhideLeftClass:"", defaultUnhideLeftStyle:"float:right;width:9px;height:12px;cursor:pointer;background-image:url(images/sc-unhideleft.gif);padding:0;", 
defaultUnhideRightClass:"", defaultUnhideRightStyle:"float:left;width:9px;height:12px;cursor:pointer;background-image:url(images/sc-unhideright.gif);padding:0;", defaultUnhideTopClass:"", defaultUnhideTopStyle:"float:left;left:1px;position:absolute;bottom:-4px;width:12px;height:9px;cursor:pointer;background-image:url(images/sc-unhidetop.gif);padding:0;", defaultUnhideBottomClass:"", defaultUnhideBottomStyle:"float:left;width:12px;height:9px;cursor:pointer;background-image:url(images/sc-unhidebottom.gif);padding:0;", 
defaultColResizeBarClass:"col-resize-bar", defaultRowResizeBarClass:"row-resize-bar", s_rcMissingSheet:"Render Context must have a sheet object", defaultLinkFormatString:'<span style="font-size:smaller;text-decoration:none !important;background-color:#66B;color:#FFF;">Link</span>', defaultPageLinkFormatString:'<span style="font-size:smaller;text-decoration:none !important;background-color:#66B;color:#FFF;">Page</span>', defaultFormatp:"#,##0.0%", defaultFormatc:"[$$]#,##0.00", defaultFormatdt:"d-mmm-yyyy h:mm:ss", 
defaultFormatd:"d-mmm-yyyy", defaultFormatt:"[h]:mm:ss", defaultDisplayTRUE:"TRUE", defaultDisplayFALSE:"FALSE", defaultImagePrefix:"images/sc_", defaultTableEditorIDPrefix:"te_", defaultPageUpDnAmount:15, AllowCtrlS:!0, defaultTableControlThickness:20, cteGriddivClass:"", s_statusline_executing:"Executing...", s_statusline_displaying:"Displaying...", s_statusline_ordering:"Ordering...", s_statusline_calculating:"Calculating...", s_statusline_calculatingls:"Calculating... Loading Sheet...", s_statusline_doingserverfunc:"doing server function ", 
s_statusline_incell:" in cell ", s_statusline_calcstart:"Calculation start...", s_statusline_sum:"SUM", s_statusline_recalcneeded:'<span style="color:#999;">(Recalc needed)</span>', s_statusline_circref:'<span style="color:red;">Circular reference: ', s_statusline_sendemail:"Sending Email ", s_inputboxdisplaymultilinetext:"[Multi-line text: Click icon on right to edit]", defaultInputEchoClass:"", defaultInputEchoStyle:"filter:alpha(opacity=90);opacity:.9;backgroundColor:#FFD;border:1px solid #884;fontSize:small;padding:2px 10px 1px 2px;cursor:default;", 
defaultInputEchoPromptClass:"", defaultInputEchoPromptStyle:"filter:alpha(opacity=90);opacity:.9;backgroundColor:#FFD;borderLeft:1px solid #884;borderRight:1px solid #884;borderBottom:1px solid #884;fontSize:small;fontStyle:italic;padding:2px 10px 1px 2px;cursor:default;", defaultInputEchoHintClass:"", defaultInputEchoHintStyle:"filter:alpha(opacity=80);opacity:.8;backgroundColor:#884;border:1px solid #884;fontSize:small;fontWeight:bold;padding:2px 2px 2px 2px;color:#FFF;position:absolute;top:-20px;cursor:default;", 
ietUnknownFunction:"Unknown function ", CH_radius1:29, CH_radius2:41, s_CHfillAllTooltip:"Fill Contents and Formats Down/Right", s_CHfillContentsTooltip:"Fill Contents Only Down/Right", s_CHmovePasteAllTooltip:"Move Contents and Formats", s_CHmovePasteContentsTooltip:"Move Contents Only", s_CHmoveInsertAllTooltip:"Slide Contents and Formats within Row/Col", s_CHmoveInsertContentsTooltip:"Slide Contents within Row/Col", s_CHindicatorOperationLookup:{Fill:"Fill", FillC:"Fill Contents", Move:"Move", 
MoveI:"Slide", MoveC:"Move Contents", MoveIC:"Slide Contents"}, s_CHindicatorDirectionLookup:{Down:" Down", Right:" Right", Horizontal:" Horizontal", Vertical:" Vertical"}, defaultTCSliderThickness:9, defaultTCButtonThickness:20, defaultTCThumbThickness:15, TCmainStyle:"backgroundColor:#EEE;", TCmainClass:"", TCendcapStyle:"backgroundColor:#FFF;", TCendcapClass:"", TCpanesliderClass:"tc-paneslider", s_panesliderTooltiph:"Drag to lock pane vertically", s_panesliderTooltipv:"Drag to lock pane horizontally", 
TClessbuttonStyle:"backgroundColor:#AAA;", TClessbuttonClass:"", TClessbuttonRepeatWait:300, TClessbuttonRepeatInterval:20, TCmorebuttonStyle:"backgroundColor:#AAA;", TCmorebuttonClass:"", TCmorebuttonRepeatWait:300, TCmorebuttonRepeatInterval:20, TCscrollareaStyle:"backgroundColor:#DDD;", TCscrollareaClass:"", TCscrollareaRepeatWait:500, TCscrollareaRepeatInterval:100, TCthumbClass:"", TCthumbStyle:"backgroundColor:#CCC;", TCPStrackinglineClass:"tracklingine", TCPStrackinglineStyle:"overflow:hidden;position:absolute;zIndex:100;", 
TCPStrackinglineThickness:"2px", TCTDFSthumbstatusvClass:"", TCTDFSthumbstatusvStyle:"height:20px;width:auto;border:3px solid #808080;overflow:hidden;backgroundColor:#FFF;fontSize:small;position:absolute;zIndex:100;", TCTDFSthumbstatushClass:"", TCTDFSthumbstatushStyle:"height:20px;width:auto;border:1px solid black;padding:2px;backgroundColor:#FFF;fontSize:small;position:absolute;zIndex:100;", TCTDFSthumbstatusrownumClass:"", TCTDFSthumbstatusrownumStyle:"color:#FFF;background-color:#808080;font-size:small;white-space:nowrap;padding:3px;", 
TCTDFStopOffsetv:0, TCTDFSleftOffsetv:-80, s_TCTDFthumbstatusPrefixv:"Row ", TCTDFStopOffseth:-30, TCTDFSleftOffseth:0, s_TCTDFthumbstatusPrefixh:"Col ", TooltipOffsetX:2, TooltipOffsetY:10, TDpopupElementClass:"", TDpopupElementStyle:"border:1px solid black;padding:1px 2px 2px 2px;textAlign:center;backgroundColor:#FFF;fontSize:7pt;fontFamily:Verdana,Arial,Helvetica,sans-serif;position:absolute;width:auto;zIndex:110;", SCToolbarbackground:"background-color:#404040;", SCTabbackground:"background-color:#CCC;", 
SCTabselectedCSS:"font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#404040;cursor:default;border-right:1px solid #CCC;", SCTabplainCSS:"font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#808080;cursor:default;border-right:1px solid #CCC;", SCToolbartext:"font-size:x-small;font-weight:bold;color:#FFF", SCFormulabarheight:30, SCStatuslineheight:20, SCStatuslineCSS:"font-size:10px;padding:3px 0px;", SCFormatNumberFormats:"[cancel]:|[break]:|%loc!Default!:|[custom]:|%loc!Automatic!:general|%loc!Auto w/ commas!:[,]General|[break]:|00:00|000:000|0000:0000|00000:00000|[break]:|%loc!Formula!:formula|%loc!Hidden!:hidden|[newcol]:1234:0|1,234:#,##0|1,234.5:#,##0.0|1,234.56:#,##0.00|1,234.567:#,##0.000|1,234.5678:#,##0.0000|[break]:|1,234%:#,##0%|1,234.5%:#,##0.0%|1,234.56%:#,##0.00%|[newcol]:|$1,234:$#,##0|$1,234.5:$#,##0.0|$1,234.56:$#,##0.00|[break]:|(1,234):#,##0_);(#,##0)|(1,234.5):#,##0.0_);(#,##0.0)|(1,234.56):#,##0.00_);(#,##0.00)|[break]:|($1,234):$#,##0_);($#,##0)|($1,234.5):$#,##0.0_);($#,##0.0)|($1,234.56):$#,##0.00_);($#,##0.00)|[newcol]:|1/4/06:m/d/yy|01/04/2006:mm/dd/yyyy|2006-01-04:yyyy-mm-dd|4-Jan-06:d-mmm-yy|04-Jan-2006:dd-mmm-yyyy|January 4, 2006:mmmm d, yyyy|[break]:|1\\c23:h:mm|1\\c23 PM:h:mm AM/PM|1\\c23\\c45:h:mm:ss|01\\c23\\c45:hh:mm:ss|26\\c23 (h\\cm):[hh]:mm|69\\c45 (m\\cs):[mm]:ss|69 (s):[ss]|[newcol]:|2006-01-04 01\\c23\\c45:yyyy-mm-dd hh:mm:ss|January 4, 2006:mmmm d, yyyy hh:mm:ss|Wed:ddd|Wednesday:dddd|", 
SCFormatTextFormats:"[cancel]:|[break]:|%loc!Default!:|[custom]:|%loc!Automatic!:general|%loc!Plain Text!:text-plain|HTML:text-html|%loc!Wikitext!:text-wiki|%loc!Link!:text-link|%loc!Formula!:formula|%loc!Hidden!:hidden|", SCFormatPadsizes:"[cancel]:|[break]:|%loc!Default!:|[custom]:|%loc!No padding!:0px|[newcol]:|1 pixel:1px|2 pixels:2px|3 pixels:3px|4 pixels:4px|5 pixels:5px|6 pixels:6px|7 pixels:7px|8 pixels:8px|[newcol]:|9 pixels:9px|10 pixels:10px|11 pixels:11px|12 pixels:12px|13 pixels:13px|14 pixels:14px|16 pixels:16px|18 pixels:18px|[newcol]:|20 pixels:20px|22 pixels:22px|24 pixels:24px|28 pixels:28px|36 pixels:36px|", 
SCFormatFontsizes:"[cancel]:|[break]:|%loc!Default!:|[custom]:|X-Small:x-small|Small:small|Medium:medium|Large:large|X-Large:x-large|[newcol]:|6pt:6pt|7pt:7pt|8pt:8pt|9pt:9pt|10pt:10pt|11pt:11pt|12pt:12pt|14pt:14pt|16pt:16pt|[newcol]:|18pt:18pt|20pt:20pt|22pt:22pt|24pt:24pt|28pt:28pt|36pt:36pt|48pt:48pt|72pt:72pt|[newcol]:|8 pixels:8px|9 pixels:9px|10 pixels:10px|11 pixels:11px|12 pixels:12px|13 pixels:13px|14 pixels:14px|[newcol]:|16 pixels:16px|18 pixels:18px|20 pixels:20px|22 pixels:22px|24 pixels:24px|28 pixels:28px|36 pixels:36px|", 
SCFormatFontfamilies:"[cancel]:|[break]:|%loc!Default!:|[custom]:|Verdana:Verdana,Arial,Helvetica,sans-serif|Arial:arial,helvetica,sans-serif|Courier:'Courier New',Courier,monospace|", SCFormatFontlook:"[cancel]:|[break]:|%loc!Default!:|%loc!Normal!:normal normal|%loc!Bold!:normal bold|%loc!Italic!:italic normal|%loc!Bold Italic!:italic bold", SCFormatTextAlignhoriz:"[cancel]:|[break]:|%loc!Default!:|%loc!Left!:left|%loc!Center!:center|%loc!Right!:right|", SCFormatNumberAlignhoriz:"[cancel]:|[break]:|%loc!Default!:|%loc!Left!:left|%loc!Center!:center|%loc!Right!:right|", 
SCFormatAlignVertical:"[cancel]:|[break]:|%loc!Default!:|%loc!Top!:top|%loc!Middle!:middle|%loc!Bottom!:bottom|", SCFormatColwidth:"[cancel]:|[break]:|%loc!Default!:|[custom]:|[newcol]:|20 pixels:20|40:40|60:60|80:80|100:100|120:120|140:140|160:160|[newcol]:|180 pixels:180|200:200|220:220|240:240|260:260|280:280|300:300|", SCFormatRecalc:"[cancel]:|[break]:|%loc!Auto!:|%loc!Manual!:off|", SCFormatUserMaxCol:"[cancel]:|[break]:|%loc!Default!:|[custom]:|[newcol]:|Unlimited:0|10:10|20:20|30:30|40:40|50:50|60:60|80:80|100:100|", 
SCFormatUserMaxRow:"[cancel]:|[break]:|%loc!Default!:|[custom]:|[newcol]:|Unlimited:0|10:10|20:20|30:30|40:40|50:50|60:60|80:80|100:100|", ISCButtonBorderNormal:"#404040", ISCButtonBorderHover:"#999", ISCButtonBorderDown:"#FFF", ISCButtonDownBackground:"#888", s_PopupListCancel:"[Cancel]", s_PopupListCustom:"Custom", s_loc_align_center:"Align Center", s_loc_align_left:"Align Left", s_loc_align_right:"Align Right", s_loc_alignment:"Alignment", s_loc_audit:"Audit", s_loc_audit_trail_this_session:"Audit Trail This Session", 
s_loc_auto:"Auto", s_loc_auto_sum:"Auto Sum", s_loc_auto_wX_commas:"Auto w/ commas", s_loc_automatic:"Automatic", s_loc_background:"Background", s_loc_bold:"Bold", s_loc_bold_XampX_italics:"Bold &amp; Italics", s_loc_bold_italic:"Bold Italic", s_loc_borders:"Borders", s_loc_borders_off:"Borders Off", s_loc_borders_on:"Borders On", s_loc_bottom:"Bottom", s_loc_bottom_border:"Bottom Border", s_loc_cell_settings:"CELL SETTINGS", s_loc_csv_format:"CSV format", s_loc_cancel:"Cancel", s_loc_category:"Category", 
s_loc_center:"Center", s_loc_clear:"Clear", s_loc_clear_socialcalc_clipboard:"Clear SocialCalc Clipboard", s_loc_clipboard:"Clipboard", s_loc_color:"Color", s_loc_column_:"Column ", s_loc_comment:"Comment", s_loc_copy:"Copy", s_loc_custom:"Custom", s_loc_cut:"Cut", s_loc_default:"Default", s_loc_default_alignment:"Default Alignment", s_loc_default_column_width:"Default Column Width", s_loc_default_font:"Default Font", s_loc_default_format:"Default Format", s_loc_default_padding:"Default Padding", 
s_loc_delete:"Delete", s_loc_delete_column:"Delete Column", s_loc_delete_contents:"Delete Cell Contents", s_loc_delete_row:"Delete Row", s_loc_description:"Description", s_loc_display_clipboard_in:"Display Clipboard in", s_loc_down:"Down", s_loc_edit:"Edit", s_loc_existing_names:"Existing Names", s_loc_family:"Family", s_loc_fill_down:"Fill Down", s_loc_fill_right:"Fill Right", s_loc_font:"Font", s_loc_format:"Format", s_loc_formula:"Formula", s_loc_function_list:"Function List", s_loc_functions:"Functions", 
s_loc_grid:"Grid", s_loc_hidden:"Hidden", s_loc_hide_column:"Hide Column", s_loc_hide_row:"Hide Row", s_loc_horizontal:"Horizontal", s_loc_insert_column:"Insert Column Before", s_loc_insert_row:"Insert Row Before", s_loc_italic:"Italic", s_loc_last_sort:"Last Sort", s_loc_left:"Left", s_loc_left_border:"Left Border", s_loc_link:"Link", s_loc_link_input_box:"Link Input Box", s_loc_list:"List", s_loc_load_socialcalc_clipboard_with_this:"Load SocialCalc Clipboard With This", s_loc_lock_cell:"Lock Cell", 
s_loc_major_sort:"Major Sort", s_loc_manual:"Manual", s_loc_merge_cells:"Merge/Unmerge Cells", s_loc_middle:"Middle", s_loc_minor_sort:"Minor Sort", s_loc_move_insert:"Move Insert", s_loc_move_paste:"Move Paste", s_loc_multiXline_input_box:"Multi-line Input Box", s_loc_name:"Name", s_loc_names:"Names", s_loc_no_padding:"No padding", s_loc_normal:"Normal", s_loc_number:"Number", s_loc_number_horizontal:"Number Horizontal", s_loc_ok:"OK", s_loc_padding:"Padding", s_loc_page_name:"Page Name", s_loc_paste:"Paste", 
s_loc_paste_formats:"Paste Formats", s_loc_plain_text:"Plain Text", s_loc_recalc:"Recalc", s_loc_recalculation:"Recalculation", s_loc_redo:"Redo", s_loc_right:"Right", s_loc_right_border:"Right Border", s_loc_sheet_settings:"SHEET SETTINGS", s_loc_save:"Save", s_loc_save_to:"Save to", s_loc_set_cell_contents:"Set Cell Contents", s_loc_set_cells_to_sort:"Set Cells To Sort", s_loc_set_value_to:"Set Value To", s_loc_set_to_link_format:"Set to Link format", s_loc_setXclear_move_from:"Set/Clear Move From", 
s_loc_show_cell_settings:"Show Cell Settings", s_loc_show_sheet_settings:"Show Sheet Settings", s_loc_show_in_new_browser_window:"Show in new browser window", s_loc_size:"Size", s_loc_socialcalcXsave_format:"SocialCalc-save format", s_loc_sort:"Sort", s_loc_sort_:"Sort ", s_loc_sort_cells:"Sort Cells", s_loc_swap_colors:"Swap Colors", s_loc_tabXdelimited_format:"Tab-delimited format", s_loc_text:"Text", s_loc_text_horizontal:"Text Horizontal", s_loc_this_is_aXbrXsample:"This is a<br>sample", s_loc_top:"Top", 
s_loc_top_border:"Top Border", s_loc_undone_steps:"UNDONE STEPS", s_loc_url:"URL", s_loc_undo:"Undo", s_loc_unlock_cell:"Unlock Cell", s_loc_unmerge_cells:"Unmerge Cells", s_loc_up:"Up", s_loc_value:"Value", s_loc_vertical:"Vertical", s_loc_wikitext:"Wikitext", s_loc_workspace:"Workspace", s_loc_XnewX:"[New]", s_loc_XnoneX:"[None]", s_loc_Xselect_rangeX:"[select range]", SVStatuslineheight:20, SVStatuslineCSS:"font-size:10px;padding:3px 0px;", FormatNumber_separatorchar:",", FormatNumber_decimalchar:".", 
FormatNumber_defaultCurrency:"$", s_FormatNumber_daynames:"Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "), s_FormatNumber_daynames3:"Sun Mon Tue Wed Thu Fri Sat".split(" "), s_FormatNumber_monthnames:"January February March April May June July August September October November December".split(" "), s_FormatNumber_monthnames3:"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "), s_FormatNumber_am:"AM", s_FormatNumber_am1:"A", s_FormatNumber_pm:"PM", s_FormatNumber_pm1:"P", 
s_parseerrexponent:"Improperly formed number exponent", s_parseerrchar:"Unexpected character in formula", s_parseerrstring:"Improperly formed string", s_parseerrspecialvalue:"Improperly formed special value", s_parseerrtwoops:"Error in formula (two operators inappropriately in a row)", s_parseerrmissingopenparen:"Missing open parenthesis in list with comma(s). ", s_parseerrcloseparennoopen:"Closing parenthesis without open parenthesis. ", s_parseerrmissingcloseparen:"Missing close parenthesis. ", 
s_parseerrmissingoperand:"Missing operand. ", s_parseerrerrorinformula:"Error in formula.", s_calcerrerrorvalueinformula:"Error value in formula", s_parseerrerrorinformulabadval:"Error in formula resulting in bad value", s_formularangeresult:"Formula results in range value:", s_calcerrnumericnan:"Formula results in an bad numeric value", s_calcerrnumericoverflow:"Numeric overflow", s_sheetunavailable:"Sheet unavailable:", s_calcerrcellrefmissing:"Cell reference missing when expected.", s_calcerrsheetnamemissing:"Sheet name missing when expected.", 
s_circularnameref:"Circular name reference to name", s_calcerrunknownname:"Unknown name", s_calcerrincorrectargstofunction:"Incorrect arguments to function", s_sheetfuncunknownfunction:"Unknown function", s_sheetfunclnarg:"LN argument must be greater than 0", s_sheetfunclog10arg:"LOG10 argument must be greater than 0", s_sheetfunclogsecondarg:"LOG second argument must be numeric greater than 0", s_sheetfunclogfirstarg:"LOG first argument must be greater than 0", s_sheetfuncroundsecondarg:"ROUND second argument must be numeric", 
s_sheetfuncddblife:"DDB life must be greater than 1", s_sheetfuncslnlife:"SLN life must be greater than 1", s_fdef_ABS:"Absolute value function. ", s_fdef_ACOS:"Trigonometric arccosine function. ", s_fdef_AND:"True if all arguments are true. ", s_fdef_ASIN:"Trigonometric arcsine function. ", s_fdef_ATAN:"Trigonometric arctan function. ", s_fdef_ATAN2:"Trigonometric arc tangent function (result is in radians). ", s_fdef_AVERAGE:"Averages the values. ", s_fdef_CHOOSE:"Returns the value specified by the index. The values may be ranges of cells. ", 
s_fdef_COLUMNS:"Returns the number of columns in the range. ", s_fdef_COS:"Trigonometric cosine function (value is in radians). ", s_fdef_COUNT:"Counts the number of numeric values, not blank, text, or error. ", s_fdef_COUNTA:"Counts the number of non-blank values. ", s_fdef_COUNTBLANK:'Counts the number of blank values. (Note: "" is not blank.) ', s_fdef_COUNTIF:'Counts the number of number of cells in the range that meet the criteria. The criteria may be a value ("x", 15, 1+3) or a test (>25). ', 
s_fdef_DATE:'Returns the appropriate date value given numbers for year, month, and day. For example: DATE(2006,2,1) for February 1, 2006. Note: In this program, day "1" is December 31, 1899 and the year 1900 is not a leap year. Some programs use January 1, 1900, as day "1" and treat 1900 as a leap year. In both cases, though, dates on or after March 1, 1900, are the same. ', s_fdef_DAVERAGE:"Averages the values in the specified field in records that meet the criteria. ", s_fdef_DAY:"Returns the day of month for a date value. ", 
s_fdef_DCOUNT:"Counts the number of numeric values, not blank, text, or error, in the specified field in records that meet the criteria. ", s_fdef_DCOUNTA:"Counts the number of non-blank values in the specified field in records that meet the criteria. ", s_fdef_DDB:"Returns the amount of depreciation at the given period of time (the default factor is 2 for double-declining balance).   ", s_fdef_DEGREES:"Converts value in radians into degrees. ", s_fdef_DGET:"Returns the value of the specified field in the single record that meets the criteria. ", 
s_fdef_DMAX:"Returns the maximum of the numeric values in the specified field in records that meet the criteria. ", s_fdef_DMIN:"Returns the maximum of the numeric values in the specified field in records that meet the criteria. ", s_fdef_DPRODUCT:"Returns the result of multiplying the numeric values in the specified field in records that meet the criteria. ", s_fdef_DSTDEV:"Returns the sample standard deviation of the numeric values in the specified field in records that meet the criteria. ", s_fdef_DSTDEVP:"Returns the standard deviation of the numeric values in the specified field in records that meet the criteria. ", 
s_fdef_DSUM:"Returns the sum of the numeric values in the specified field in records that meet the criteria. ", s_fdef_DVAR:"Returns the sample variance of the numeric values in the specified field in records that meet the criteria. ", s_fdef_DVARP:"Returns the variance of the numeric values in the specified field in records that meet the criteria. ", s_fdef_EVEN:"Rounds the value up in magnitude to the nearest even integer. ", s_fdef_EXACT:'Returns "true" if the values are exactly the same, including case, type, etc. ', 
s_fdef_EXP:"Returns e raised to the value power. ", s_fdef_FACT:"Returns factorial of the value. ", s_fdef_FALSE:'Returns the logical value "false". ', s_fdef_FIND:'Returns the starting position within string2 of the first occurrence of string1 at or after "start". If start is omitted, 1 is assumed. ', s_fdef_FV:"Returns the future value of repeated payments of money invested at the given rate for the specified number of periods, with optional present value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). ", 
s_fdef_HLOOKUP:"Look for the matching value for the given value in the range and return the corresponding value in the cell specified by the row offset. If rangelookup is 1 (the default) and not 0, match if within numeric brackets (match<=value) instead of exact match. ", s_fdef_HOUR:"Returns the hour portion of a time or date/time value. ", s_fdef_IF:"Results in true-value if logical-expression is TRUE or non-zero, otherwise results in false-value. ", s_fdef_INDEX:"Returns a cell or range reference for the specified row and column in the range. If range is 1-dimensional, then only one of rownum or colnum are needed. If range is 2-dimensional and rownum or colnum are zero, a reference to the range of just the specified column or row is returned. You can use the returned reference value in a range, e.g., sum(A1:INDEX(A2:A10,4)). ", 
s_fdef_INT:"Returns the value rounded down to the nearest integer (towards -infinity). ", s_fdef_IRR:"Returns the interest rate at which the cash flows in the range have a net present value of zero. Uses an iterative process that will return #NUM! error if it does not converge. There may be more than one possible solution. Providing the optional guess value may help in certain situations where it does not converge or finds an inappropriate solution (the default guess is 10%). ", s_fdef_ISBLANK:'Returns "true" if the value is a reference to a blank cell. ', 
s_fdef_ISERR:'Returns "true" if the value is of type "Error" but not "NA". ', s_fdef_ISERROR:'Returns "true" if the value is of type "Error". ', s_fdef_ISLOGICAL:'Returns "true" if the value is of type "Logical" (true/false). ', s_fdef_ISNA:'Returns "true" if the value is the error type "NA". ', s_fdef_ISNONTEXT:'Returns "true" if the value is not of type "Text". ', s_fdef_ISNUMBER:'Returns "true" if the value is of type "Number" (including logical values). ', s_fdef_ISTEXT:'Returns "true" if the value is of type "Text". ', 
s_fdef_LEFT:"Returns the specified number of characters from the text value. If count is omitted, 1 is assumed. ", s_fdef_LEN:"Returns the number of characters in the text value. ", s_fdef_LN:"Returns the natural logarithm of the value. ", s_fdef_LOG:"Returns the logarithm of the value using the specified base. ", s_fdef_LOG10:"Returns the base 10 logarithm of the value. ", s_fdef_LOWER:"Returns the text value with all uppercase characters converted to lowercase. ", s_fdef_MATCH:"Look for the matching value for the given value in the range and return position (the first is 1) in that range. If rangelookup is 1 (the default) and not 0, match if within numeric brackets (match<=value) instead of exact match. If rangelookup is -1, act like 1 but the bracket is match>=value. ", 
s_fdef_MAX:"Returns the maximum of the numeric values. ", s_fdef_MID:"Returns the specified number of characters from the text value starting from the specified position. ", s_fdef_MIN:"Returns the minimum of the numeric values. ", s_fdef_MINUTE:"Returns the minute portion of a time or date/time value. ", s_fdef_MOD:"Returns the remainder of the first value divided by the second. ", s_fdef_MONTH:"Returns the month part of a date value. ", s_fdef_N:"Returns the value if it is a numeric value otherwise an error. ", 
s_fdef_NA:"Returns the #N/A error value which propagates through most operations. ", s_fdef_NOT:"Returns FALSE if value is true, and TRUE if it is false. ", s_fdef_NOW:"Returns the current date/time. ", s_fdef_NPER:"Returns the number of periods at which payments invested each period at the given rate with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period) has the given present value. ", s_fdef_NPV:"Returns the net present value of cash flows (which may be individual values and/or ranges) at the given rate. The flows are positive if income, negative if paid out, and are assumed at the end of each period. ", 
s_fdef_ODD:"Rounds the value up in magnitude to the nearest odd integer. ", s_fdef_OR:"True if any argument is true ", s_fdef_PI:"The value 3.1415926... ", s_fdef_PMT:"Returns the amount of each payment that must be invested at the given rate for the specified number of periods to have the specified present value, with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). ", s_fdef_POWER:"Returns the first value raised to the second value power. ", 
s_fdef_PRODUCT:"Returns the result of multiplying the numeric values. ", s_fdef_PROPER:"Returns the text value with the first letter of each word converted to uppercase and the others to lowercase. ", s_fdef_PV:"Returns the present value of the given number of payments each invested at the given rate, with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). ", s_fdef_RADIANS:"Converts value in degrees into radians. ", s_fdef_RATE:"Returns the rate at which the given number of payments each invested at the given rate has the specified present value, with optional future value (default 0) and payment type (default 0 = at end of period, 1 = beginning of period). Uses an iterative process that will return #NUM! error if it does not converge. There may be more than one possible solution. Providing the optional guess value may help in certain situations where it does not converge or finds an inappropriate solution (the default guess is 10%). ", 
s_fdef_REPLACE:"Returns text1 with the specified number of characters starting from the specified position replaced by text2. ", s_fdef_REPT:"Returns the text repeated the specified number of times. ", s_fdef_RIGHT:"Returns the specified number of characters from the text value starting from the end. If count is omitted, 1 is assumed. ", s_fdef_ROUND:"Rounds the value to the specified number of decimal places. If precision is negative, then round to powers of 10. The default precision is 0 (round to integer). ", 
s_fdef_ROWS:"Returns the number of rows in the range. ", s_fdef_SECOND:"Returns the second portion of a time or date/time value (truncated to an integer). ", s_fdef_SIN:"Trigonometric sine function (value is in radians) ", s_fdef_SLN:"Returns the amount of depreciation at each period of time using the straight-line method. ", s_fdef_SQRT:"Square root of the value ", s_fdef_STDEV:"Returns the sample standard deviation of the numeric values. ", s_fdef_STDEVP:"Returns the standard deviation of the numeric values. ", 
s_fdef_SUBSTITUTE:'Returns text1 with the all occurrences of oldtext replaced by newtext. If "occurrence" is present, then only that occurrence is replaced. ', s_fdef_SUM:"Adds the numeric values. The values to the sum function may be ranges in the form similar to A1:B5. ", s_fdef_SUMIF:'Sums the numeric values of cells in the range that meet the criteria. The criteria may be a value ("x", 15, 1+3) or a test (>25). If range2 is present, then range1 is tested and the corresponding range2 value is summed. ', 
s_fdef_SYD:"Depreciation by Sum of Year's Digits method. ", s_fdef_T:"Returns the text value or else a null string. ", s_fdef_TAN:"Trigonometric tangent function (value is in radians) ", s_fdef_TIME:"Returns the time value given the specified hour, minute, and second. ", s_fdef_TODAY:'Returns the current date (an integer). Note: In this program, day "1" is December 31, 1899 and the year 1900 is not a leap year. Some programs use January 1, 1900, as day "1" and treat 1900 as a leap year. In both cases, though, dates on or after March 1, 1900, are the same. ', 
s_fdef_TRIM:"Returns the text value with leading, trailing, and repeated spaces removed. ", s_fdef_TRUE:'Returns the logical value "true". ', s_fdef_TRUNC:"Truncates the value to the specified number of decimal places. If precision is negative, truncate to powers of 10. ", s_fdef_UPPER:"Returns the text value with all lowercase characters converted to uppercase. ", s_fdef_VALUE:"Converts the specified text value into a numeric value. Various forms that look like numbers (including digits followed by %, forms that look like dates, etc.) are handled. This may not handle all of the forms accepted by other spreadsheets and may be locale dependent. ", 
s_fdef_VAR:"Returns the sample variance of the numeric values. ", s_fdef_VARP:"Returns the variance of the numeric values. ", s_fdef_VLOOKUP:"Look for the matching value for the given value in the range and return the corresponding value in the cell specified by the column offset. If rangelookup is 1 (the default) and not 0, match if within numeric brackets (match>=value) instead of exact match. ", s_fdef_WEEKDAY:"Returns the day of week specified by the date value. If type is 1 (the default), Sunday is day and Saturday is day 7. If type is 2, Monday is day 1 and Sunday is day 7. If type is 3, Monday is day 0 and Sunday is day 6. ", 
s_fdef_YEAR:"Returns the year part of a date value. ", s_fdef_SUMPRODUCT:"Sums the pairwise products of 2 or more ranges. The ranges must be of equal length.", s_fdef_CEILING:"Rounds the given number up to the nearest integer or multiple of significance. Significance is the value to whose multiple of ten the value is to be rounded up (.01, .1, 1, 10, etc.)", s_fdef_FLOOR:"Rounds the given number down to the nearest multiple of significance. Significance is the value to whose multiple of ten the number is to be rounded down (.01, .1, 1, 10, etc.)", 
s_farg_v:"value", s_farg_vn:"value1, value2, ...", s_farg_xy:"valueX, valueY", s_farg_choose:"index, value1, value2, ...", s_farg_range:"range", s_farg_rangec:"range, criteria", s_farg_date:"year, month, day", s_farg_dfunc:"databaserange, fieldname, criteriarange", s_farg_ddb:"cost, salvage, lifetime, period, [factor]", s_farg_find:"string1, string2, [start]", s_farg_fv:"rate, n, payment, [pv, [paytype]]", s_farg_hlookup:"value, range, row, [rangelookup]", s_farg_iffunc:"logical-expression, true-value, [false-value]", 
s_farg_index:"range, rownum, colnum", s_farg_irr:"range, [guess]", s_farg_tc:"text, count", s_farg_log:"value, base", s_farg_match:"value, range, [rangelookup]", s_farg_mid:"text, start, length", s_farg_nper:"rate, payment, pv, [fv, [paytype]]", s_farg_npv:"rate, value1, value2, ...", s_farg_pmt:"rate, n, pv, [fv, [paytype]]", s_farg_pv:"rate, n, payment, [fv, [paytype]]", s_farg_rate:"n, payment, pv, [fv, [paytype, [guess]]]", s_farg_replace:"text1, start, length, text2", s_farg_vp:"value, [precision]", 
s_farg_valpre:"value, precision", s_farg_csl:"cost, salvage, lifetime", s_farg_cslp:"cost, salvage, lifetime, period", s_farg_subs:"text1, oldtext, newtext, [occurrence]", s_farg_sumif:"range1, criteria, [range2]", s_farg_hms:"hour, minute, second", s_farg_txt:"text", s_farg_vlookup:"value, range, col, [rangelookup]", s_farg_weekday:"date, [type]", s_farg_dt:"date", s_farg_rangen:"range1, range2, ...", s_farg_vsig:"value, [significance]", function_classlist:"all stat lookup datetime financial test math text gui action".split(" "), 
s_fclass_all:"All", s_fclass_stat:"Statistics", s_fclass_lookup:"Lookup", s_fclass_datetime:"Date & Time", s_fclass_financial:"Financial", s_fclass_test:"Test", s_fclass_math:"Math", s_fclass_text:"Text", s_fclass_action:"Email & Copy", s_fclass_gui:"Button & Input", lastone:null};
SocialCalc.ConstantsDefaultClasses = {defaultComment:"", defaultCommentNoGrid:"", defaultHighlightTypeCursor:"", defaultHighlightTypeRange:"", defaultColname:"", defaultSelectedColname:"", defaultRowname:"", defaultSelectedRowname:"", defaultUpperLeft:"", defaultSkippedCell:"", defaultPaneDivider:"", cteGriddiv:"", defaultInputEcho:{classname:"", style:"filter:alpha(opacity=90);opacity:.9;"}, TCmain:"", TCendcap:"", TCpaneslider:"", TClessbutton:"", TCmorebutton:"", TCscrollarea:"", TCthumb:"", TCPStrackingline:"", 
TCTDFSthumbstatus:"", TDpopupElement:""};
SocialCalc.ConstantsSetClasses = function(a) {
  var b = SocialCalc.ConstantsDefaultClasses, c = SocialCalc.Constants, d;
  a = a || "";
  for (d in b) {
    "string" == typeof b[d] ? (c[d + "Class"] = a + (b[d] || d), void 0 !== c[d + "Style"] && (c[d + "Style"] = "")) : "object" == typeof b[d] && (c[d + "Class"] = a + (b[d].classname || d), c[d + "Style"] = b[d].style);
  }
};
SocialCalc.ConstantsSetImagePrefix = function(a) {
  var b = SocialCalc.Constants, c;
  for (c in b) {
    "string" == typeof b[c] && (b[c] = b[c].replace(b.defaultImagePrefix, a));
  }
  b.defaultImagePrefix = a;
};
SocialCalc || (SocialCalc = {});
SocialCalc.Callbacks = {expand_wiki:null, expand_markup:function(a, b, c) {
  return SocialCalc.default_expand_markup(a, b, c);
}, MakePageLink:null, NormalizeSheetName:null};
SocialCalc.Cell = function(a) {
  this.coord = a;
  this.datavalue = "";
  this.datatype = null;
  this.formula = "";
  this.valuetype = "b";
  this.readonly = !1;
};
SocialCalc.CellProperties = {coord:1, datavalue:1, datatype:1, formula:1, valuetype:1, errors:1, comment:1, readonly:1, bt:2, br:2, bb:2, bl:2, layout:2, font:2, color:2, bgcolor:2, cellformat:2, nontextvalueformat:2, textvalueformat:2, colspan:2, rowspan:2, cssc:2, csss:2, mod:2, displaystring:3, parseinfo:3, hcolspan:3, hrowspan:3};
SocialCalc.CellPropertiesTable = {bt:"borderstyle", br:"borderstyle", bb:"borderstyle", bl:"borderstyle", layout:"layout", font:"font", color:"color", bgcolor:"color", cellformat:"cellformat", nontextvalueformat:"valueformat", textvalueformat:"valueformat"};
SocialCalc.Sheet = function() {
  SocialCalc.ResetSheet(this);
  this.statuscallbackparams = this.statuscallback = null;
};
SocialCalc.ResetSheet = function(a, b) {
  a.cells = {};
  a.attribs = {lastcol:1, lastrow:1, defaultlayout:0, usermaxcol:0, usermaxrow:0};
  a.rowattribs = {hide:{}, height:{}};
  a.colattribs = {width:{}, hide:{}};
  a.names = {};
  a.layouts = [];
  a.layouthash = {};
  a.fonts = [];
  a.fonthash = {};
  a.colors = [];
  a.colorhash = {};
  a.borderstyles = [];
  a.borderstylehash = {};
  a.cellformats = [];
  a.cellformathash = {};
  a.valueformats = [];
  a.valueformathash = {};
  a.matched_cells = [];
  a.selected_search_cell = void 0;
  a.copiedfrom = "";
  a.changes = new SocialCalc.UndoStack;
  a.renderneeded = !1;
  a.changedrendervalues = !0;
  a.recalcchangedavalue = !1;
  a.hiddencolrow = "";
  a.sci = new SocialCalc.SheetCommandInfo(a);
  a.ioEventTree = {};
  a.ioParameterList = {};
};
SocialCalc.Sheet.prototype.ResetSheet = function() {
  SocialCalc.ResetSheet(this);
};
SocialCalc.Sheet.prototype.AddCell = function(a) {
  return this.cells[a.coord] = a;
};
SocialCalc.Sheet.prototype.LastCol = function() {
  var a = 1, b;
  for (b in this.cells) {
    var c = SocialCalc.coordToCr(b);
    c.col > a && (a = c.col);
  }
  return a;
};
SocialCalc.Sheet.prototype.LastRow = function() {
  var a = 1, b;
  for (b in this.cells) {
    var c = SocialCalc.coordToCr(b);
    c.row > a && (a = c.row);
  }
  return a;
};
SocialCalc.Sheet.prototype.GetAssuredCell = function(a) {
  return this.cells[a] || this.AddCell(new SocialCalc.Cell(a));
};
SocialCalc.Sheet.prototype.ParseSheetSave = function(a) {
  SocialCalc.ParseSheetSave(a, this);
};
SocialCalc.Sheet.prototype.CellFromStringParts = function(a, b, c) {
  return SocialCalc.CellFromStringParts(this, a, b, c);
};
SocialCalc.Sheet.prototype.CreateSheetSave = function(a, b) {
  return SocialCalc.CreateSheetSave(this, a, b);
};
SocialCalc.Sheet.prototype.CellToString = function(a) {
  return SocialCalc.CellToString(this, a);
};
SocialCalc.Sheet.prototype.CanonicalizeSheet = function(a) {
  return SocialCalc.CanonicalizeSheet(this, a);
};
SocialCalc.Sheet.prototype.EncodeCellAttributes = function(a) {
  return SocialCalc.EncodeCellAttributes(this, a);
};
SocialCalc.Sheet.prototype.EncodeSheetAttributes = function() {
  return SocialCalc.EncodeSheetAttributes(this);
};
SocialCalc.Sheet.prototype.DecodeCellAttributes = function(a, b, c) {
  return SocialCalc.DecodeCellAttributes(this, a, b, c);
};
SocialCalc.Sheet.prototype.DecodeSheetAttributes = function(a) {
  return SocialCalc.DecodeSheetAttributes(this, a);
};
SocialCalc.Sheet.prototype.ScheduleSheetCommands = function(a, b) {
  return SocialCalc.ScheduleSheetCommands(this, a, b);
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
SocialCalc.Sheet.prototype.GetStyleNum = function(a, b) {
  return SocialCalc.GetStyleNum(this, a, b);
};
SocialCalc.Sheet.prototype.GetStyleString = function(a, b) {
  return SocialCalc.GetStyleString(this, a, b);
};
SocialCalc.Sheet.prototype.RecalcSheet = function() {
  return SocialCalc.RecalcSheet(this);
};
SocialCalc.ParseSheetSave = function(a, b) {
  var c = a.split(/\r\n|\n/), d = [], e, f, g, h, l = SocialCalc.Constants;
  for (e = 0;e < c.length;e++) {
    switch(d = c[e], d = d.split(":"), d[0]) {
      case "cell":
        g = b.GetAssuredCell(d[1]);
        f = 2;
        b.CellFromStringParts(g, d, f);
        break;
      case "col":
        h = d[1];
        for (f = 2;g = d[f++];) {
          switch(g) {
            case "w":
              b.colattribs.width[h] = d[f++];
              break;
            case "hide":
              b.colattribs.hide[h] = d[f++];
              break;
            default:
              throw l.s_pssUnknownColType + " '" + g + "'";;
          }
        }
        break;
      case "row":
        h = d[1] - 0;
        for (f = 2;g = d[f++];) {
          switch(g) {
            case "h":
              b.rowattribs.height[h] = d[f++] - 0;
              break;
            case "hide":
              b.rowattribs.hide[h] = d[f++];
              break;
            default:
              throw l.s_pssUnknownRowType + " '" + g + "'";;
          }
        }
        break;
      case "sheet":
        h = b.attribs;
        for (f = 1;g = d[f++];) {
          switch(g) {
            case "c":
              h.lastcol = d[f++] - 0;
              break;
            case "r":
              h.lastrow = d[f++] - 0;
              break;
            case "w":
              h.defaultcolwidth = d[f++] + "";
              break;
            case "h":
              h.defaultrowheight = d[f++] - 0;
              break;
            case "tf":
              h.defaulttextformat = d[f++] - 0;
              break;
            case "ntf":
              h.defaultnontextformat = d[f++] - 0;
              break;
            case "layout":
              h.defaultlayout = d[f++] - 0;
              break;
            case "font":
              h.defaultfont = d[f++] - 0;
              break;
            case "tvf":
              h.defaulttextvalueformat = d[f++] - 0;
              break;
            case "ntvf":
              h.defaultnontextvalueformat = d[f++] - 0;
              break;
            case "color":
              h.defaultcolor = d[f++] - 0;
              break;
            case "bgcolor":
              h.defaultbgcolor = d[f++] - 0;
              break;
            case "circularreferencecell":
              h.circularreferencecell = d[f++];
              break;
            case "recalc":
              h.recalc = d[f++];
              break;
            case "needsrecalc":
              h.needsrecalc = d[f++];
              break;
            case "usermaxcol":
              h.usermaxcol = d[f++] - 0;
              break;
            case "usermaxrow":
              h.usermaxrow = d[f++] - 0;
              break;
            default:
              f += 1;
          }
        }
        break;
      case "name":
        f = SocialCalc.decodeFromSave(d[1]).toUpperCase();
        b.names[f] = {desc:SocialCalc.decodeFromSave(d[2])};
        b.names[f].definition = SocialCalc.decodeFromSave(d[3]);
        break;
      case "layout":
        d = c[e].match(/^layout\:(\d+)\:(.+)$/);
        b.layouts[d[1] - 0] = d[2];
        b.layouthash[d[2]] = d[1] - 0;
        break;
      case "font":
        b.fonts[d[1] - 0] = d[2];
        b.fonthash[d[2]] = d[1] - 0;
        break;
      case "color":
        b.colors[d[1] - 0] = d[2];
        b.colorhash[d[2]] = d[1] - 0;
        break;
      case "border":
        b.borderstyles[d[1] - 0] = d[2];
        b.borderstylehash[d[2]] = d[1] - 0;
        break;
      case "cellformat":
        f = SocialCalc.decodeFromSave(d[2]);
        b.cellformats[d[1] - 0] = f;
        b.cellformathash[f] = d[1] - 0;
        break;
      case "valueformat":
        f = SocialCalc.decodeFromSave(d[2]);
        b.valueformats[d[1] - 0] = f;
        b.valueformathash[f] = d[1] - 0;
        break;
      case "version":
        break;
      case "copiedfrom":
        b.copiedfrom = d[1] + ":" + d[2];
        break;
      case "clipboardrange":
      ;
      case "clipboard":
        break;
      case "":
        break;
      default:
        throw alert(l.s_pssUnknownLineType + " '" + d[0] + "'"), l.s_pssUnknownLineType + " '" + d[0] + "'";;
    }
  }
};
SocialCalc.CellFromStringParts = function(a, b, c, d) {
  for (;a = c[d++];) {
    switch(a) {
      case "v":
        b.datavalue = SocialCalc.decodeFromSave(c[d++]) - 0;
        b.datatype = "v";
        b.valuetype = "n";
        break;
      case "t":
        b.datavalue = SocialCalc.decodeFromSave(c[d++]);
        b.datatype = "t";
        b.valuetype = SocialCalc.Constants.textdatadefaulttype;
        break;
      case "vt":
        a = c[d++];
        b.valuetype = a;
        "n" == a.charAt(0) ? (b.datatype = "v", b.datavalue = SocialCalc.decodeFromSave(c[d++]) - 0) : (b.datatype = "t", b.datavalue = SocialCalc.decodeFromSave(c[d++]));
        break;
      case "vtf":
        a = c[d++];
        b.valuetype = a;
        "n" == a.charAt(0) ? b.datavalue = SocialCalc.decodeFromSave(c[d++]) - 0 : b.datavalue = SocialCalc.decodeFromSave(c[d++]);
        b.formula = SocialCalc.decodeFromSave(c[d++]);
        b.datatype = "f";
        break;
      case "vtc":
        a = c[d++];
        b.valuetype = a;
        "n" == a.charAt(0) ? b.datavalue = SocialCalc.decodeFromSave(c[d++]) - 0 : b.datavalue = SocialCalc.decodeFromSave(c[d++]);
        b.formula = SocialCalc.decodeFromSave(c[d++]);
        b.datatype = "c";
        break;
      case "ro":
        ro = SocialCalc.decodeFromSave(c[d++]);
        b.readonly = "yes" == ro.toLowerCase();
        break;
      case "e":
        b.errors = SocialCalc.decodeFromSave(c[d++]);
        break;
      case "b":
        b.bt = c[d++] - 0;
        b.br = c[d++] - 0;
        b.bb = c[d++] - 0;
        b.bl = c[d++] - 0;
        break;
      case "l":
        b.layout = c[d++] - 0;
        break;
      case "f":
        b.font = c[d++] - 0;
        break;
      case "c":
        b.color = c[d++] - 0;
        break;
      case "bg":
        b.bgcolor = c[d++] - 0;
        break;
      case "cf":
        b.cellformat = c[d++] - 0;
        break;
      case "ntvf":
        b.nontextvalueformat = c[d++] - 0;
        break;
      case "tvf":
        b.textvalueformat = c[d++] - 0;
        break;
      case "colspan":
        b.colspan = c[d++] - 0;
        break;
      case "rowspan":
        b.rowspan = c[d++] - 0;
        break;
      case "cssc":
        b.cssc = c[d++];
        break;
      case "csss":
        b.csss = SocialCalc.decodeFromSave(c[d++]);
        break;
      case "mod":
        d += 1;
        break;
      case "comment":
        b.comment = SocialCalc.decodeFromSave(c[d++]);
        break;
      default:
        throw SocialCalc.Constants.s_cfspUnknownCellType + " '" + a + "'";;
    }
  }
};
SocialCalc.sheetfields = "defaultrowheight defaultcolwidth circularreferencecell recalc needsrecalc usermaxcol usermaxrow".split(" ");
SocialCalc.sheetfieldsshort = "h w circularreferencecell recalc needsrecalc usermaxcol usermaxrow".split(" ");
SocialCalc.sheetfieldsxlat = "defaulttextformat defaultnontextformat defaulttextvalueformat defaultnontextvalueformat defaultcolor defaultbgcolor defaultfont defaultlayout".split(" ");
SocialCalc.sheetfieldsxlatshort = "tf ntf tvf ntvf color bgcolor font layout".split(" ");
SocialCalc.sheetfieldsxlatxlt = "cellformat cellformat valueformat valueformat color color font layout".split(" ");
SocialCalc.CreateSheetSave = function(a, b, c) {
  var d, e, f, g, h, l = [];
  a.CanonicalizeSheet(c || SocialCalc.Constants.doCanonicalizeSheet);
  var n = a.xlt;
  e = b ? SocialCalc.ParseRange(b) : {cr1:{row:1, col:1}, cr2:{row:n.maxrow, col:n.maxcol}};
  c = e.cr1;
  e = e.cr2;
  l.push("version:1.5");
  for (f = c.row;f <= e.row;f++) {
    for (g = c.col;g <= e.col;g++) {
      if (h = SocialCalc.crToCoord(g, f), d = a.cells[h]) {
        d = a.CellToString(d), 0 != d.length && (d = "cell:" + h + d, l.push(d));
      }
    }
  }
  for (g = 1;g <= n.maxcol;g++) {
    h = SocialCalc.rcColname(g), a.colattribs.width[h] && l.push("col:" + h + ":w:" + a.colattribs.width[h]), a.colattribs.hide[h] && l.push("col:" + h + ":hide:" + a.colattribs.hide[h]);
  }
  for (f = 1;f <= n.maxrow;f++) {
    a.rowattribs.height[f] && l.push("row:" + f + ":h:" + a.rowattribs.height[f]), a.rowattribs.hide[f] && l.push("row:" + f + ":hide:" + a.rowattribs.hide[f]);
  }
  d = "sheet:c:" + n.maxcol + ":r:" + n.maxrow;
  for (f = 0;f < SocialCalc.sheetfields.length;f++) {
    (g = SocialCalc.encodeForSave(a.attribs[SocialCalc.sheetfields[f]])) && (d += ":" + SocialCalc.sheetfieldsshort[f] + ":" + g);
  }
  for (f = 0;f < SocialCalc.sheetfieldsxlat.length;f++) {
    (g = a.attribs[SocialCalc.sheetfieldsxlat[f]]) && (d += ":" + SocialCalc.sheetfieldsxlatshort[f] + ":" + n[SocialCalc.sheetfieldsxlatxlt[f] + "sxlat"][g]);
  }
  l.push(d);
  for (f = 1;f < n.newborderstyles.length;f++) {
    l.push("border:" + f + ":" + n.newborderstyles[f]);
  }
  for (f = 1;f < n.newcellformats.length;f++) {
    l.push("cellformat:" + f + ":" + SocialCalc.encodeForSave(n.newcellformats[f]));
  }
  for (f = 1;f < n.newcolors.length;f++) {
    l.push("color:" + f + ":" + n.newcolors[f]);
  }
  for (f = 1;f < n.newfonts.length;f++) {
    l.push("font:" + f + ":" + n.newfonts[f]);
  }
  for (f = 1;f < n.newlayouts.length;f++) {
    l.push("layout:" + f + ":" + n.newlayouts[f]);
  }
  for (f = 1;f < n.newvalueformats.length;f++) {
    l.push("valueformat:" + f + ":" + SocialCalc.encodeForSave(n.newvalueformats[f]));
  }
  for (f = 0;f < n.namesorder.length;f++) {
    d = n.namesorder[f], l.push("name:" + SocialCalc.encodeForSave(d).toUpperCase() + ":" + SocialCalc.encodeForSave(a.names[d].desc) + ":" + SocialCalc.encodeForSave(a.names[d].definition));
  }
  b && l.push("copiedfrom:" + SocialCalc.crToCoord(c.col, c.row) + ":" + SocialCalc.crToCoord(e.col, e.row));
  l.push("");
  delete a.xlt;
  return l.join("\n");
};
SocialCalc.CellToString = function(a, b) {
  var c, d, e, f, g, h;
  c = "";
  if (!b) {
    return c;
  }
  d = SocialCalc.encodeForSave(b.datavalue);
  "v" == b.datatype ? c = "n" == b.valuetype ? c + (":v:" + d) : c + (":vt:" + b.valuetype + ":" + d) : "t" == b.datatype ? c = b.valuetype == SocialCalc.Constants.textdatadefaulttype ? c + (":t:" + d) : c + (":vt:" + b.valuetype + ":" + d) : (e = SocialCalc.encodeForSave(b.formula), "f" == b.datatype ? c += ":vtf:" + b.valuetype + ":" + d + ":" + e : "c" == b.datatype && (c += ":vtc:" + b.valuetype + ":" + d + ":" + e));
  b.readonly && (c += ":ro:yes");
  b.errors && (c += ":e:" + SocialCalc.encodeForSave(b.errors));
  d = b.bt || "";
  e = b.br || "";
  f = b.bb || "";
  g = b.bl || "";
  if (a.xlt) {
    h = a.xlt;
    if (d || e || f || g) {
      c += ":b:" + h.borderstylesxlat[d || 0] + ":" + h.borderstylesxlat[e || 0] + ":" + h.borderstylesxlat[f || 0] + ":" + h.borderstylesxlat[g || 0];
    }
    b.layout && (c += ":l:" + h.layoutsxlat[b.layout]);
    b.font && (c += ":f:" + h.fontsxlat[b.font]);
    b.color && (c += ":c:" + h.colorsxlat[b.color]);
    b.bgcolor && (c += ":bg:" + h.colorsxlat[b.bgcolor]);
    b.cellformat && (c += ":cf:" + h.cellformatsxlat[b.cellformat]);
    b.textvalueformat && (c += ":tvf:" + h.valueformatsxlat[b.textvalueformat]);
    b.nontextvalueformat && (c += ":ntvf:" + h.valueformatsxlat[b.nontextvalueformat]);
  } else {
    if (d || e || f || g) {
      c += ":b:" + d + ":" + e + ":" + f + ":" + g;
    }
    b.layout && (c += ":l:" + b.layout);
    b.font && (c += ":f:" + b.font);
    b.color && (c += ":c:" + b.color);
    b.bgcolor && (c += ":bg:" + b.bgcolor);
    b.cellformat && (c += ":cf:" + b.cellformat);
    b.textvalueformat && (c += ":tvf:" + b.textvalueformat);
    b.nontextvalueformat && (c += ":ntvf:" + b.nontextvalueformat);
  }
  b.colspan && (c += ":colspan:" + b.colspan);
  b.rowspan && (c += ":rowspan:" + b.rowspan);
  b.cssc && (c += ":cssc:" + b.cssc);
  b.csss && (c += ":csss:" + SocialCalc.encodeForSave(b.csss));
  b.mod && (c += ":mod:" + b.mod);
  b.comment && (c += ":comment:" + SocialCalc.encodeForSave(b.comment));
  return c;
};
SocialCalc.CanonicalizeSheet = function(a, b) {
  var c, d, e, f, g, h, l, n = 0, p = 0, r = "borderstyle cellformat color font layout valueformat".split(" "), s = {namesorder:[]};
  for (g in a.names) {
    s.namesorder.push(g);
  }
  s.namesorder.sort();
  if (SocialCalc.Constants.doCanonicalizeSheet && b) {
    for (f = 0;f < r.length;f++) {
      g = r[f], s[g + "sUsed"] = {};
    }
    l = s.colorsUsed;
    h = s.borderstylesUsed;
    var q = s.fontsUsed, t = s.layoutsUsed, u = s.cellformatsUsed, v = s.valueformatsUsed;
    for (d in a.cells) {
      e = SocialCalc.coordToCr(d), f = a.cells[d], g = !1, f.valuetype && "b" != f.valuetype && (g = !0), f.color && (l[f.color] = 1, g = !0), f.bgcolor && (l[f.bgcolor] = 1, g = !0), f.bt && (h[f.bt] = 1, g = !0), f.br && (h[f.br] = 1, g = !0), f.bb && (h[f.bb] = 1, g = !0), f.bl && (h[f.bl] = 1, g = !0), f.layout && (t[f.layout] = 1, g = !0), f.font && (q[f.font] = 1, g = !0), f.cellformat && (u[f.cellformat] = 1, g = !0), f.textvalueformat && (v[f.textvalueformat] = 1, g = !0), f.nontextvalueformat && 
      (v[f.nontextvalueformat] = 1, g = !0), g && (e.row > n && (n = e.row), e.col > p && (p = e.col));
    }
    for (l = 0;l < SocialCalc.sheetfieldsxlat.length;l++) {
      (c = a.attribs[SocialCalc.sheetfieldsxlat[l]]) && (s[SocialCalc.sheetfieldsxlatxlt[l] + "sUsed"][c] = 1);
    }
    g = {height:1, hide:1};
    for (c in g) {
      for (e in a.rowattribs[c]) {
        e > n && (n = e);
      }
    }
    g = {hide:1, width:1};
    for (c in g) {
      for (d in a.colattribs[c]) {
        e = SocialCalc.coordToCr(d + "1"), e.col > p && (p = e.col);
      }
    }
    for (f = 0;f < r.length;f++) {
      g = r[f];
      d = [];
      e = s[g + "sUsed"];
      for (c in e) {
        d.push(a[g + "s"][c]);
      }
      d.sort();
      d.unshift("");
      e = [""];
      h = a[g + "hash"];
      for (l = 1;l < d.length;l++) {
        e[h[d[l]]] = l;
      }
      s[g + "sxlat"] = e;
      s["new" + g + "s"] = d;
    }
    s.maxrow = n || 1;
    s.maxcol = p || 1;
  } else {
    for (f = 0;f < r.length;f++) {
      g = r[f];
      s["new" + g + "s"] = a[g + "s"];
      c = a[g + "s"].length;
      e = Array(c);
      e[0] = "";
      for (l = 1;l < c;l++) {
        e[l] = l;
      }
      s[g + "sxlat"] = e;
    }
    s.maxrow = a.attribs.lastrow;
    s.maxcol = a.attribs.lastcol;
  }
  a.xlt = s;
};
SocialCalc.EncodeCellAttributes = function(a, b) {
  var c, d, e = {}, f = function(a) {
    e[a] = {def:!0, val:""};
  }, g = function(a) {
    for (var c = 0;c < a.length;c++) {
      f(a[c]);
    }
  }, h = function(a, c) {
    e[a].def = !1;
    e[a].val = c || "";
  };
  c = function(a, c) {
    "*" != c && (e[a].def = !1, e[a].val = c);
  };
  var l = a.GetAssuredCell(b);
  f("alignhoriz");
  l.cellformat && h("alignhoriz", a.cellformats[l.cellformat]);
  g(["alignvert", "padtop", "padright", "padbottom", "padleft"]);
  l.layout && (parts = a.layouts[l.layout].match(/^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/), c("padtop", parts[1]), c("padright", parts[2]), c("padbottom", parts[3]), c("padleft", parts[4]), c("alignvert", parts[5]));
  g(["fontfamily", "fontlook", "fontsize"]);
  l.font && (parts = a.fonts[l.font].match(/^(\*|\S+? \S+?) (\S+?) (\S.*)$/), c("fontfamily", parts[3]), c("fontsize", parts[2]), c("fontlook", parts[1]));
  f("textcolor");
  l.color && h("textcolor", a.colors[l.color]);
  f("bgcolor");
  l.bgcolor && h("bgcolor", a.colors[l.bgcolor]);
  g(["numberformat", "textformat"]);
  l.nontextvalueformat && h("numberformat", a.valueformats[l.nontextvalueformat]);
  l.textvalueformat && h("textformat", a.valueformats[l.textvalueformat]);
  g(["colspan", "rowspan"]);
  h("colspan", l.colspan || 1);
  h("rowspan", l.rowspan || 1);
  for (c = 0;4 > c;c++) {
    d = "trbl".charAt(c), d = "b" + d, f(d), h(d, l[d] ? a.borderstyles[l[d]] : ""), f(d + "thickness"), f(d + "style"), f(d + "color"), l[d] && (parts = a.borderstyles[l[d]].match(/(\S+)\s+(\S+)\s+(\S.+)/), h(d + "thickness", parts[1]), h(d + "style", parts[2]), h(d + "color", parts[3]));
  }
  g(["cssc", "csss", "mod"]);
  h("cssc", l.cssc || "");
  h("csss", l.csss || "");
  h("mod", l.mod || "n");
  return e;
};
SocialCalc.EncodeSheetAttributes = function(a) {
  var b = a.attribs, c = {}, d = function(a) {
    c[a] = {def:!0, val:""};
  }, e = function(a) {
    for (var c = 0;c < a.length;c++) {
      d(a[c]);
    }
  }, f = function(a, b) {
    c[a].def = !1;
    c[a].val = b || void 0;
  }, g = function(a, b) {
    "*" != b && (c[a].def = !1, c[a].val = b);
  };
  d("colwidth");
  b.defaultcolwidth && f("colwidth", b.defaultcolwidth);
  d("rowheight");
  b.rowheight && f("rowheight", b.defaultrowheight);
  d("textalignhoriz");
  b.defaulttextformat && f("textalignhoriz", a.cellformats[b.defaulttextformat]);
  d("numberalignhoriz");
  b.defaultnontextformat && f("numberalignhoriz", a.cellformats[b.defaultnontextformat]);
  e(["alignvert", "padtop", "padright", "padbottom", "padleft"]);
  b.defaultlayout && (parts = a.layouts[b.defaultlayout].match(/^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/), g("padtop", parts[1]), g("padright", parts[2]), g("padbottom", parts[3]), g("padleft", parts[4]), g("alignvert", parts[5]));
  e(["fontfamily", "fontlook", "fontsize"]);
  b.defaultfont && (parts = a.fonts[b.defaultfont].match(/^(\*|\S+? \S+?) (\S+?) (\S.*)$/), g("fontfamily", parts[3]), g("fontsize", parts[2]), g("fontlook", parts[1]));
  d("textcolor");
  b.defaultcolor && f("textcolor", a.colors[b.defaultcolor]);
  d("bgcolor");
  b.defaultbgcolor && f("bgcolor", a.colors[b.defaultbgcolor]);
  e(["numberformat", "textformat"]);
  b.defaultnontextvalueformat && f("numberformat", a.valueformats[b.defaultnontextvalueformat]);
  b.defaulttextvalueformat && f("textformat", a.valueformats[b.defaulttextvalueformat]);
  d("recalc");
  b.recalc && f("recalc", b.recalc);
  d("usermaxcol");
  b.usermaxcol && f("usermaxcol", b.usermaxcol);
  d("usermaxrow");
  b.usermaxrow && f("usermaxrow", b.usermaxrow);
  return c;
};
SocialCalc.DecodeCellAttributes = function(a, b, c, d) {
  var e, f = a.GetAssuredCell(b), g = !1, h = function(a, b, d) {
    c[a] && (a = c[a].def ? "" : c[a].val, a != (b || "") && n(d + " " + a));
  }, l = "", n = function(a) {
    l && (l += "\n");
    l += "set " + (d || b) + " " + a;
    g = !0;
  };
  h("alignhoriz", a.cellformats[f.cellformat], "cellformat");
  e = c.alignvert.def && c.padtop.def && c.padright.def && c.padbottom.def && c.padleft.def ? "" : "padding:" + (c.padtop.def ? "* " : c.padtop.val + " ") + (c.padright.def ? "* " : c.padright.val + " ") + (c.padbottom.def ? "* " : c.padbottom.val + " ") + (c.padleft.def ? "*" : c.padleft.val) + ";vertical-align:" + (c.alignvert.def ? "*;" : c.alignvert.val + ";");
  e != (a.layouts[f.layout] || "") && n("layout " + e);
  e = c.fontlook.def && c.fontsize.def && c.fontfamily.def ? "" : (c.fontlook.def ? "* " : c.fontlook.val + " ") + (c.fontsize.def ? "* " : c.fontsize.val + " ") + (c.fontfamily.def ? "*" : c.fontfamily.val);
  e != (a.fonts[f.font] || "") && n("font " + e);
  h("textcolor", a.colors[f.color], "color");
  h("bgcolor", a.colors[f.bgcolor], "bgcolor");
  h("numberformat", a.valueformats[f.nontextvalueformat], "nontextvalueformat");
  h("textformat", a.valueformats[f.textvalueformat], "textvalueformat");
  for (i = 0;4 > i;i++) {
    e = "trbl".charAt(i), e = "b" + e, h(e, a.borderstyles[f[e]], e);
  }
  h("cssc", f.cssc, "cssc");
  h("csss", f.csss, "csss");
  c.mod && (e = c.mod.def ? "n" : c.mod.val, e != (f.mod || "n") && ("n" == e && (e = ""), n("mod " + e)));
  return g ? l : null;
};
SocialCalc.DecodeSheetAttributes = function(a, b) {
  var c, d = a.attribs, e = !1, f = function(a, c, d) {
    b[a] && (a = b[a].def ? "" : b[a].val, a != (c || "") && h(d + " " + a));
  }, g = "", h = function(a) {
    g && (g += "\n");
    g += "set sheet " + a;
    e = !0;
  };
  f("colwidth", d.defaultcolwidth, "defaultcolwidth");
  f("rowheight", d.defaultrowheight, "defaultrowheight");
  f("textalignhoriz", a.cellformats[d.defaulttextformat], "defaulttextformat");
  f("numberalignhoriz", a.cellformats[d.defaultnontextformat], "defaultnontextformat");
  c = b.alignvert.def && b.padtop.def && b.padright.def && b.padbottom.def && b.padleft.def ? "" : "padding:" + (b.padtop.def ? "* " : b.padtop.val + " ") + (b.padright.def ? "* " : b.padright.val + " ") + (b.padbottom.def ? "* " : b.padbottom.val + " ") + (b.padleft.def ? "*" : b.padleft.val) + ";vertical-align:" + (b.alignvert.def ? "*;" : b.alignvert.val + ";");
  c != (a.layouts[d.defaultlayout] || "") && h("defaultlayout " + c);
  c = b.fontlook.def && b.fontsize.def && b.fontfamily.def ? "" : (b.fontlook.def ? "* " : b.fontlook.val + " ") + (b.fontsize.def ? "* " : b.fontsize.val + " ") + (b.fontfamily.def ? "*" : b.fontfamily.val);
  c != (a.fonts[d.defaultfont] || "") && h("defaultfont " + c);
  f("textcolor", a.colors[d.defaultcolor], "defaultcolor");
  f("bgcolor", a.colors[d.defaultbgcolor], "defaultbgcolor");
  f("numberformat", a.valueformats[d.defaultnontextvalueformat], "defaultnontextvalueformat");
  f("textformat", a.valueformats[d.defaulttextvalueformat], "defaulttextvalueformat");
  f("recalc", a.attribs.recalc, "recalc");
  f("usermaxcol", a.attribs.usermaxcol, "usermaxcol");
  f("usermaxrow", a.attribs.usermaxrow, "usermaxrow");
  return e ? g : null;
};
SocialCalc.SheetCommandInfo = function(a) {
  this.sheetobj = a;
  this.timerobj = null;
  this.firsttimerdelay = 50;
  this.timerdelay = 1;
  this.maxtimeslice = 100;
  this.saveundo = !1;
  this.CmdExtensionCallbacks = {};
};
SocialCalc.ScheduleSheetCommands = function(a, b, c) {
  var d = a.sci, e = new SocialCalc.Parse(b);
  d.sheetobj.statuscallback && a.statuscallback(d, "cmdstart", "", d.sheetobj.statuscallbackparams);
  c && d.sheetobj.changes.PushChange("");
  d.timerobj = window.setTimeout(function() {
    SocialCalc.SheetCommandsTimerRoutine(d, e, c);
  }, d.firsttimerdelay);
};
SocialCalc.SheetCommandsTimerRoutine = function(a, b, c) {
  var d, e = new Date;
  for (a.timerobj = null;!b.EOF();) {
    if ((d = SocialCalc.ExecuteSheetCommand(a.sheetobj, b, c)) && ("function" == typeof alert ? alert(d) : console.log(d)), b.NextLine(), new Date - e >= a.maxtimeslice) {
      a.timerobj = window.setTimeout(function() {
        SocialCalc.SheetCommandsTimerRoutine(a, b, c);
      }, a.timerdelay);
      return;
    }
  }
  a.sheetobj.statuscallback && a.sheetobj.statuscallback(a, "cmdend", "", a.sheetobj.statuscallbackparams);
};
SocialCalc.ExecuteSheetCommand = function(a, b, c) {
  var d, e, f, g, h, l, n, p, r, s, q, t, u, v, A, w, z, y, C, G, H, M, Q, J, N, D, B = a.attribs;
  D = a.changes;
  H = SocialCalc.CellProperties;
  A = SocialCalc.Constants;
  s = function() {
    var a = SocialCalc.ParseRange(g);
    p = a.cr1;
    r = a.cr2;
    r.col > B.lastcol && (B.lastcol = r.col);
    r.row > B.lastrow && (B.lastrow = r.row);
  };
  n = "";
  d = b.RestOfStringNoMove();
  c && a.changes.AddDo(d);
  e = b.NextToken();
  switch(e) {
    case "set":
      g = b.NextToken();
      h = b.NextToken();
      f = b.RestOfString();
      b = "set " + g + " " + h;
      if ("sheet" == g) {
        switch(a.renderneeded = !0, h) {
          case "defaultcolwidth":
            c && D.AddUndo(b, B[h]);
            B[h] = f;
            break;
          case "defaultcolor":
          ;
          case "defaultbgcolor":
            c && D.AddUndo(b, a.GetStyleString("color", B[h]));
            B[h] = a.GetStyleNum("color", f);
            break;
          case "defaultlayout":
            c && D.AddUndo(b, a.GetStyleString("layout", B[h]));
            B[h] = a.GetStyleNum("layout", f);
            break;
          case "defaultfont":
            c && D.AddUndo(b, a.GetStyleString("font", B[h]));
            "* * *" == f && (f = "");
            B[h] = a.GetStyleNum("font", f);
            break;
          case "defaulttextformat":
          ;
          case "defaultnontextformat":
            c && D.AddUndo(b, a.GetStyleString("cellformat", B[h]));
            B[h] = a.GetStyleNum("cellformat", f);
            break;
          case "defaulttextvalueformat":
          ;
          case "defaultnontextvalueformat":
            c && D.AddUndo(b, a.GetStyleString("valueformat", B[h]));
            B[h] = a.GetStyleNum("valueformat", f);
            for (l in a.cells) {
              delete a.cells[l].displaystring;
            }
            break;
          case "lastcol":
          ;
          case "lastrow":
            c && D.AddUndo(b, B[h] - 0);
            c = f - 0;
            "number" == typeof c && (B[h] = 0 < c ? c : 1);
            break;
          case "recalc":
            c && D.AddUndo(b, B[h]);
            "off" == f ? B.recalc = f : delete B.recalc;
            break;
          case "usermaxcol":
          ;
          case "usermaxrow":
            c && D.AddUndo(b, B[h] - 0);
            c = f - 0;
            "number" == typeof c && (B[h] = 0 < c ? c : 0);
            break;
          default:
            n = A.s_escUnknownSheetCmd + d;
        }
      } else {
        if (/^[a-z]{1,2}(:[a-z]{1,2})?$/i.test(g)) {
          for (a.renderneeded = !0, g = g.toUpperCase(), l = g.indexOf(":"), 0 <= l ? (p = SocialCalc.coordToCr(g.substring(0, l) + "1"), r = SocialCalc.coordToCr(g.substring(l + 1) + "1")) : r = p = SocialCalc.coordToCr(g + "1"), s = p.col;s <= r.col;s++) {
            "width" == h ? (l = SocialCalc.rcColname(s), c && D.AddUndo("set " + l + " width", a.colattribs.width[l]), 0 < f.length ? a.colattribs.width[l] = f : delete a.colattribs.width[l]) : "hide" == h && (a.hiddencolrow = "col", l = SocialCalc.rcColname(s), c && D.AddUndo("set " + l + " hide", a.colattribs.hide[l]), 0 < f.length ? a.colattribs.hide[l] = f : delete a.colattribs.hide[l]);
          }
        } else {
          if (/^\d+(:\d+)?$/i.test(g)) {
            for (a.renderneeded = !0, g = g.toUpperCase(), l = g.indexOf(":"), 0 <= l ? (p = SocialCalc.coordToCr("A" + g.substring(0, l)), r = SocialCalc.coordToCr("A" + g.substring(l + 1))) : r = p = SocialCalc.coordToCr("A" + g), b = p.row;b <= r.row;b++) {
              "height" == h ? (c && D.AddUndo("set " + b + " height", a.rowattribs.height[b]), 0 < f.length ? a.rowattribs.height[b] = f : delete a.rowattribs.height[b]) : "hide" == h && (a.hiddencolrow = "row", c && D.AddUndo("set " + b + " hide", a.rowattribs.hide[b]), 0 < f.length ? a.rowattribs.hide[b] = f : delete a.rowattribs.hide[b]);
            }
          } else {
            if (/^[a-z]{1,2}\d+(:[a-z]{1,2}\d+)?$/i.test(g)) {
              for (s(), p.row != r.row || p.col != r.col || a.celldisplayneeded || a.renderneeded ? (a.renderneeded = !0, a.celldisplayneeded = "") : a.celldisplayneeded = SocialCalc.crToCoord(p.col, p.row), b = p.row;b <= r.row;b++) {
                for (s = p.col;s <= r.col;s++) {
                  l = SocialCalc.crToCoord(s, b), q = a.GetAssuredCell(l), q.readonly && "readonly" != h || (c && D.AddUndo("set " + l + " all", a.CellToString(q)), "value" == h ? (l = f.indexOf(" "), q.datavalue = f.substring(l + 1) - 0, delete q.errors, q.datatype = "v", q.valuetype = f.substring(0, l), delete q.displaystring, delete q.parseinfo, B.needsrecalc = "yes") : "text" == h ? (l = f.indexOf(" "), q.datavalue = SocialCalc.decodeFromSave(f.substring(l + 1)), delete q.errors, q.datatype = 
                  "t", q.valuetype = f.substring(0, l), delete q.displaystring, delete q.parseinfo, B.needsrecalc = "yes") : "formula" == h ? (q.datavalue = 0, delete q.errors, q.datatype = "f", SocialCalc._app && "e#N/A" != q.valuetype && (q.prevvaluetype = q.valuetype), q.valuetype = "e#N/A", q.formula = f, delete q.displaystring, delete q.parseinfo, B.needsrecalc = "yes") : "constant" == h ? (l = f.indexOf(" "), e = f.substring(l + 1).indexOf(" "), q.datavalue = f.substring(l + 1, l + 1 + e) - 
                  0, q.valuetype = f.substring(0, l), "e" == q.valuetype.charAt(0) ? q.errors = q.valuetype.substring(1) : delete q.errors, q.datatype = "c", q.formula = f.substring(l + e + 2), delete q.displaystring, delete q.parseinfo, B.needsrecalc = "yes") : "empty" == h ? (q.datavalue = "", delete q.errors, q.datatype = null, q.formula = "", q.valuetype = "b", delete q.displaystring, delete q.parseinfo, B.needsrecalc = "yes") : "all" == h ? (0 < f.length ? (q = new SocialCalc.Cell(l), a.CellFromStringParts(q, 
                  f.split(":"), 1), a.cells[l] = q) : delete a.cells[l], B.needsrecalc = "yes") : /^b[trbl]$/.test(h) ? (q[h] = a.GetStyleNum("borderstyle", f), a.renderneeded = !0) : "color" == h || "bgcolor" == h ? q[h] = a.GetStyleNum("color", f) : "layout" == h || "cellformat" == h ? q[h] = a.GetStyleNum(h, f) : "font" == h ? ("* * *" == f && (f = ""), q[h] = a.GetStyleNum("font", f)) : "textvalueformat" == h || "nontextvalueformat" == h ? (q[h] = a.GetStyleNum("valueformat", f), delete q.displaystring) : 
                  "cssc" == h ? (f = f.replace(/[^a-zA-Z0-9\-]/g, ""), q.cssc = f) : "csss" == h ? (f = f.replace(/\n/g, ""), q.csss = f) : "mod" == h ? (f = f.replace(/[^yY]/g, "").toLowerCase(), q.mod = f) : "comment" == h ? q.comment = SocialCalc.decodeFromSave(f) : "readonly" == h ? q.readonly = "yes" == f.toLowerCase() : n = A.s_escUnknownSetCoordCmd + d);
                }
              }
            }
          }
        }
      }
      break;
    case "merge":
      a.renderneeded = !0;
      g = b.NextToken();
      f = b.RestOfString();
      s();
      q = a.GetAssuredCell(p.coord);
      if (q.readonly) {
        break;
      }
      c && D.AddUndo("unmerge " + p.coord);
      r.col > p.col ? q.colspan = r.col - p.col + 1 : delete q.colspan;
      r.row > p.row ? q.rowspan = r.row - p.row + 1 : delete q.rowspan;
      a.changedrendervalues = !0;
      break;
    case "unmerge":
      a.renderneeded = !0;
      g = b.NextToken();
      f = b.RestOfString();
      s();
      q = a.GetAssuredCell(p.coord);
      if (q.readonly) {
        break;
      }
      c && D.AddUndo("merge " + p.coord + ":" + SocialCalc.crToCoord(p.col + (q.colspan || 1) - 1, p.row + (q.rowspan || 1) - 1));
      delete q.colspan;
      delete q.rowspan;
      a.changedrendervalues = !0;
      break;
    case "erase":
    ;
    case "cut":
      a.renderneeded = !0;
      a.changedrendervalues = !0;
      g = b.NextToken();
      f = b.RestOfString();
      s();
      c && D.AddUndo("changedrendervalues");
      "cut" == e && (c && D.AddUndo("loadclipboard", SocialCalc.encodeForSave(SocialCalc.Clipboard.clipboard)), SocialCalc.Clipboard.clipboard = SocialCalc.CreateSheetSave(a, g));
      for (b = p.row;b <= r.row;b++) {
        for (s = p.col;s <= r.col;s++) {
          l = SocialCalc.crToCoord(s, b), q = a.GetAssuredCell(l), q.readonly || (c && D.AddUndo("set " + l + " all", a.CellToString(q)), "all" == f ? delete a.cells[l] : "formulas" == f ? (q.datavalue = "", q.datatype = null, q.formula = "", q.valuetype = "b", delete q.errors, delete q.displaystring, delete q.parseinfo, q.comment && delete q.comment) : "formats" == f && (h = new SocialCalc.Cell(l), h.datavalue = q.datavalue, h.datatype = q.datatype, h.formula = q.formula, h.valuetype = q.valuetype, 
          q.comment && (h.comment = q.comment), a.cells[l] = h));
        }
      }
      B.needsrecalc = "yes";
      break;
    case "fillright":
    ;
    case "filldown":
      a.renderneeded = !0;
      a.changedrendervalues = !0;
      c && D.AddUndo("changedrendervalues");
      g = b.NextToken();
      f = b.RestOfString();
      s();
      b = function(c) {
        var b = SocialCalc.GetSpreadsheetControlObject().editor, d = b.range2, e = void 0;
        d.hasrange && (c && 1 == d.bottom - d.top && d.left == d.right ? (c = a.GetAssuredCell(SocialCalc.crToCoord(d.left, d.top)), d = a.GetAssuredCell(SocialCalc.crToCoord(d.left, d.bottom)), "v" != c.datatype && "c" != c.datatype || "v" != d.datatype && "c" != d.datatype || (e = d.datavalue - c.datavalue)) : c || d.left == d.right || (c = a.GetAssuredCell(SocialCalc.crToCoord(d.left, d.top)), d = a.GetAssuredCell(SocialCalc.crToCoord(d.right, d.top)), "v" != c.datatype && "c" != c.datatype || 
        "v" != d.datatype && "c" != d.datatype || (e = d.datavalue - c.datavalue)));
        b.Range2Remove();
        return e;
      };
      "fillright" == e ? (e = !0, t = p.row, u = p.col + 1, z = b(!1)) : (e = !1, t = p.row + 1, u = p.col, z = b(!0));
      for (b = t;b <= r.row;b++) {
        for (s = u;s <= r.col;s++) {
          if (l = SocialCalc.crToCoord(s, b), q = a.GetAssuredCell(l), !q.readonly) {
            c && D.AddUndo("set " + l + " all", a.CellToString(q));
            e ? (v = SocialCalc.crToCoord(p.col, b), A = s - u + 1, d = 0) : (v = SocialCalc.crToCoord(s, p.row), A = 0, d = b - t + 1);
            w = a.GetAssuredCell(v);
            if ("all" == f || "formats" == f) {
              for (h in H) {
                1 != H[h] && (void 0 === typeof w[h] || 3 == H[h] ? delete q[h] : q[h] = w[h]);
              }
            }
            if ("all" == f || "formulas" == f) {
              q.datavalue = void 0 !== z ? w.datavalue + (e ? A : d) * z : w.datavalue, q.datatype = w.datatype, q.valuetype = w.valuetype, q.formula = "f" == q.datatype ? SocialCalc.OffsetFormulaCoords(w.formula, A, d) : w.formula, delete q.parseinfo, q.errors = w.errors;
            }
            delete q.displaystring;
          }
        }
      }
      B.needsrecalc = "yes";
      break;
    case "copy":
      g = b.NextToken();
      f = b.RestOfString();
      c && D.AddUndo("loadclipboard", SocialCalc.encodeForSave(SocialCalc.Clipboard.clipboard));
      SocialCalc.Clipboard.clipboard = SocialCalc.CreateSheetSave(a, g);
      break;
    case "loadclipboard":
      f = b.RestOfString();
      c && D.AddUndo("loadclipboard", SocialCalc.encodeForSave(SocialCalc.Clipboard.clipboard));
      SocialCalc.Clipboard.clipboard = SocialCalc.decodeFromSave(f);
      break;
    case "clearclipboard":
      c && D.AddUndo("loadclipboard", SocialCalc.encodeForSave(SocialCalc.Clipboard.clipboard));
      SocialCalc.Clipboard.clipboard = "";
      break;
    case "paste":
      a.renderneeded = !0;
      a.changedrendervalues = !0;
      c && D.AddUndo("changedrendervalues");
      g = b.NextToken();
      f = b.RestOfString();
      s();
      if (!SocialCalc.Clipboard.clipboard) {
        break;
      }
      e = new SocialCalc.Sheet;
      e.ParseSheetSave(SocialCalc.Clipboard.clipboard);
      z = SocialCalc.ParseRange(e.copiedfrom);
      A = p.col - z.cr1.col;
      d = p.row - z.cr1.row;
      y = Math.max(r.col - p.col + 1, z.cr2.col - z.cr1.col + 1);
      C = Math.max(r.row - p.row + 1, z.cr2.row - z.cr1.row + 1);
      p.col + y - 1 > B.lastcol && (B.lastcol = p.col + y - 1);
      p.row + C - 1 > B.lastrow && (B.lastrow = p.row + C - 1);
      for (b = p.row;b < p.row + C;b++) {
        for (s = p.col;s < p.col + y;s++) {
          if (l = SocialCalc.crToCoord(s, b), q = a.GetAssuredCell(l), !q.readonly) {
            c && D.AddUndo("set " + l + " all", a.CellToString(q));
            v = SocialCalc.crToCoord(z.cr1.col + (s - p.col) % (z.cr2.col - z.cr1.col + 1), z.cr1.row + (b - p.row) % (z.cr2.row - z.cr1.row + 1));
            w = e.GetAssuredCell(v);
            if ("all" == f || "formats" == f) {
              for (h in H) {
                1 != H[h] && (void 0 === typeof w[h] || 3 == H[h] ? delete q[h] : (l = SocialCalc.CellPropertiesTable[h], q[h] = l && w[h] ? a.GetStyleNum(l, e.GetStyleString(l, w[h])) : w[h]));
              }
            }
            if ("all" == f || "formulas" == f) {
              q.datavalue = w.datavalue, q.datatype = w.datatype, q.valuetype = w.valuetype, q.formula = "f" == q.datatype ? SocialCalc.OffsetFormulaCoords(w.formula, A, d) : w.formula, delete q.parseinfo, q.errors = w.errors, w.comment ? q.comment = w.comment : q.comment && delete q.comment;
            }
            delete q.displaystring;
          }
        }
      }
      B.needsrecalc = "yes";
      break;
    case "sort":
      a.renderneeded = !0;
      a.changedrendervalues = !0;
      c && D.AddUndo("changedrendervalues");
      g = b.NextToken();
      s();
      d = [];
      M = [];
      for (s = Q = 0;3 >= s;s++) {
        d[s] = b.NextToken(), M[s] = b.NextToken(), d[s] && (Q = s);
      }
      e = {};
      h = [];
      J = [];
      N = [];
      for (b = p.row;b <= r.row;b++) {
        for (s = p.col;s <= r.col;s++) {
          l = SocialCalc.crToCoord(s, b), (q = a.cells[l]) ? (e[l] = a.CellToString(q), c && D.AddUndo("set " + l + " all", e[l])) : c && D.AddUndo("set " + l + " all");
        }
        h.push(h.length);
        J.push([]);
        N.push([]);
        slast = N.length - 1;
        for (s = 0;s <= Q;s++) {
          l = d[s] + b, q = a.GetAssuredCell(l), l = q.datavalue, q = q.valuetype.charAt(0) || "b", "t" == q && (l = l.toLowerCase()), J[slast].push(l), N[slast].push(q);
        }
      }
      c = function(a, c) {
        var b, d, e, f, g;
        for (b = 0;b <= Q;b++) {
          if ("up" == M[b] ? (d = a, e = c) : (d = c, e = a), f = N[d][b], tb = N[e][b], "t" == f ? "t" == tb ? (d = J[d][b], e = J[e][b], g = d > e ? 1 : d < e ? -1 : 0) : "n" == tb ? g = 1 : "b" == tb ? g = "up" == M[b] ? -1 : 1 : "e" == tb && (g = -1) : "n" == f ? "t" == tb ? g = -1 : "n" == tb ? (d = J[d][b] - 0, e = J[e][b] - 0, g = d > e ? 1 : d < e ? -1 : 0) : "b" == tb ? g = "up" == M[b] ? -1 : 1 : "e" == tb && (g = -1) : "e" == f ? "e" == tb ? (d = J[d][b], e = J[e][b], g = d > e ? 1 : d < 
          e ? -1 : 0) : g = "b" == tb ? "up" == M[b] ? -1 : 1 : 1 : "b" == f && (g = "b" == tb ? 0 : "up" == M[b] ? 1 : -1), g) {
            return g;
          }
        }
        return a > c ? 1 : a < c ? -1 : 0;
      };
      h.sort(c);
      for (b = p.row;b <= r.row;b++) {
        for (c = h[b - p.row], s = p.col;s <= r.col;s++) {
          l = SocialCalc.crToCoord(s, b), D = SocialCalc.crToCoord(s, c + p.row), e[D] ? (q = new SocialCalc.Cell(l), a.CellFromStringParts(q, e[D].split(":"), 1), "f" == q.datatype && (q.formula = SocialCalc.OffsetFormulaCoords(q.formula, 0, b - p.row - c)), a.cells[l] = q) : delete a.cells[l];
        }
      }
      B.needsrecalc = "yes";
      break;
    case "insertcol":
    ;
    case "insertrow":
      a.renderneeded = !0;
      a.changedrendervalues = !0;
      g = b.NextToken();
      f = b.RestOfString();
      s();
      "insertcol" == e ? (A = 1, f = p.col, d = 0, u = 1, G = t = p.col, q = 1, y = B.lastrow, c && D.AddUndo("deletecol " + p.coord)) : (A = 0, d = f = 1, u = p.row, t = 1, G = B.lastcol, y = q = p.row, c && D.AddUndo("deleterow " + p.coord));
      for (b = B.lastrow;b >= u;b--) {
        for (s = B.lastcol;s >= f;s--) {
          v = SocialCalc.crToCoord(s, b), l = SocialCalc.crToCoord(s + A, b + d), a.cells[v] ? a.cells[l] = a.cells[v] : delete a.cells[l];
        }
      }
      for (b = q;b <= y;b++) {
        for (s = t;s <= G;s++) {
          for (h in l = SocialCalc.crToCoord(s, b), q = new SocialCalc.Cell(l), a.cells[l] = q, v = SocialCalc.crToCoord(s - A, b - d), w = a.GetAssuredCell(v), H) {
            2 == H[h] && (q[h] = w[h]);
          }
        }
      }
      for (l in a.cells) {
        (q = a.cells[l]) && "f" == q.datatype && (q.formula = SocialCalc.AdjustFormulaCoords(q.formula, p.col, A, p.row, d)), q && delete q.parseinfo;
      }
      for (z in a.names) {
        a.names[z] && (s = a.names[z].definition, l = "", "=" == s.charAt(0) && (l = "=", s = s.substring(1)), a.names[z].definition = l + SocialCalc.AdjustFormulaCoords(s, p.col, A, p.row, d));
      }
      for (b = B.lastrow;b >= u && "insertrow" == e;b--) {
        for (h in c = b + d, a.rowattribs) {
          l = a.rowattribs[h][b], a.rowattribs[h][c] != l && (l ? a.rowattribs[h][c] = l : delete a.rowattribs[h][c]);
        }
      }
      for (s = B.lastcol;s >= f && "insertcol" == e;s--) {
        for (h in b = SocialCalc.rcColname(s), c = SocialCalc.rcColname(s + A), a.colattribs) {
          l = a.colattribs[h][b], a.colattribs[h][c] != l && (l ? a.colattribs[h][c] = l : delete a.colattribs[h][c]);
        }
      }
      B.lastcol += A;
      B.lastrow += d;
      B.needsrecalc = "yes";
      break;
    case "deletecol":
    ;
    case "deleterow":
      a.renderneeded = !0;
      a.changedrendervalues = !0;
      g = b.NextToken();
      f = b.RestOfString();
      f = B.lastcol;
      H = B.lastrow;
      s();
      "deletecol" == e ? (A = p.col - r.col - 1, d = 0, u = r.col + 1, t = 1) : (A = 0, d = p.row - r.row - 1, u = 1, t = r.row + 1);
      for (b = t;b <= H - d;b++) {
        for (s = u;s <= f - A;s++) {
          if (l = SocialCalc.crToCoord(s + A, b + d), (q = a.cells[l]) && q.readonly) {
            return n = "Unable to remove " + ("deletecol" == e ? "column" : "row") + ", because cell " + q.coord + " is locked";
          }
        }
      }
      for (b = t;b <= H - d;b++) {
        for (s = u;s <= f - A;s++) {
          l = SocialCalc.crToCoord(s + A, b + d), c && (b < t - d || s < u - A) && ((q = a.cells[l]) ? D.AddUndo("set " + l + " all", a.CellToString(q)) : D.AddUndo("erase " + l + " all")), v = SocialCalc.crToCoord(s, b), (q = a.cells[v]) ? a.cells[l] = q : delete a.cells[l];
        }
      }
      for (l in a.cells) {
        if (q = a.cells[l]) {
          "f" == q.datatype ? (b = q.formula, q.formula = SocialCalc.AdjustFormulaCoords(b, p.col, A, p.row, d), q.formula != b && (delete q.parseinfo, c && -1 != q.formula.indexOf("#REF!") && (s = SocialCalc.coordToCr(l), D.AddUndo("set " + SocialCalc.rcColname(s.col - A) + (s.row - d) + " formula " + b)))) : delete q.parseinfo;
        }
      }
      for (z in a.names) {
        a.names[z] && (s = a.names[z].definition, l = "", "=" == s.charAt(0) && (l = "=", s = s.substring(1)), a.names[z].definition = l + SocialCalc.AdjustFormulaCoords(s, p.col, A, p.row, d));
      }
      for (b = t;b <= H - d && "deleterow" == e;b++) {
        for (h in s = b + d, a.rowattribs) {
          l = a.rowattribs[h][b], a.rowattribs[h][s] != l && (c && D.AddUndo("set " + s + " " + h, a.rowattribs[h][s]), l ? a.rowattribs[h][s] = l : delete a.rowattribs[h][s]);
        }
      }
      for (s = u;s <= f - A && "deletecol" == e;s++) {
        for (h in b = SocialCalc.rcColname(s), q = SocialCalc.rcColname(s + A), a.colattribs) {
          l = a.colattribs[h][b], a.colattribs[h][q] != l && (c && D.AddUndo("set " + q + " " + h, a.colattribs[h][q]), l ? a.colattribs[h][q] = l : delete a.colattribs[h][q]);
        }
      }
      if (c) {
        if ("deletecol" == e) {
          for (s = p.col;s <= r.col;s++) {
            D.AddUndo("insertcol " + SocialCalc.rcColname(p.col));
          }
        } else {
          for (b = p.row;b <= r.row;b++) {
            D.AddUndo("insertrow " + p.row);
          }
        }
      }
      "deletecol" == e ? p.col <= f && (B.lastcol = r.col <= f ? B.lastcol + A : p.col - 1) : p.row <= H && (B.lastrow = r.row <= H ? B.lastrow + d : p.row - 1);
      B.needsrecalc = "yes";
      break;
    case "movepaste":
    ;
    case "moveinsert":
      var Y, I;
      a.renderneeded = !0;
      a.changedrendervalues = !0;
      c && D.AddUndo("changedrendervalues");
      g = b.NextToken();
      q = b.NextToken();
      f = b.RestOfString();
      "" == f && (f = "all");
      s();
      I = SocialCalc.coordToCr(q);
      A = I.col - p.col;
      d = I.row - p.row;
      y = r.col - p.col + 1;
      C = r.row - p.row + 1;
      Y = {};
      for (b = p.row;b <= r.row;b++) {
        for (s = p.col;s <= r.col;s++) {
          if (l = SocialCalc.crToCoord(s, b), q = a.GetAssuredCell(l), !q.readonly && (c && D.AddUndo("set " + l + " all", a.CellToString(q)), a.cells[l])) {
            Y[l] = new SocialCalc.Cell(l);
            for (h in H) {
              void 0 !== typeof q[h] && (Y[l][h] = q[h], "all" == f && delete q[h], "formulas" == f && (1 != H[h] && 3 != H[h] || delete q[h]), "formats" == f && 2 == H[h] && delete q[h]);
            }
            "formulas" == f && (q.datavalue = "", q.datatype = null, q.formula = "", q.valuetype = "b");
            "all" == f && delete a.cells[l];
          }
        }
      }
      "moveinsert" == e && (t = u = !1, 0 == d && (I.col < p.col || I.col > r.col) ? I.col < p.col ? (G = p.col - I.col, u = -1) : (I.col -= 1, A = I.col - r.col, G = I.col - r.col, u = 1) : 0 == A && (I.row < p.row || I.row > r.row) ? I.row < p.row ? (G = p.row - I.row, t = -1) : (I.row -= 1, d = I.row - r.row, G = I.row - r.row, t = 1) : e = "movepaste");
      e = {};
      if (t) {
        for (b = 0;b < G;b++) {
          for (s = p.col;s <= r.col;s++) {
            0 > t ? (v = SocialCalc.crToCoord(s, I.row + G - b - 1), l = SocialCalc.crToCoord(s, r.row - b)) : (v = SocialCalc.crToCoord(s, I.row - G + b + 1), l = SocialCalc.crToCoord(s, p.row + b));
            w = a.GetAssuredCell(v);
            c && D.AddUndo("set " + v + " all", a.CellToString(w));
            q = a.GetAssuredCell(l);
            if ("all" == f || "formats" == f) {
              for (h in H) {
                1 != H[h] && (void 0 === typeof w[h] || 3 == H[h] ? delete q[h] : q[h] = w[h]);
              }
            }
            if ("all" == f || "formulas" == f) {
              q.datavalue = w.datavalue, q.datatype = w.datatype, q.valuetype = w.valuetype, q.formula = w.formula, delete q.parseinfo, q.errors = w.errors;
            }
            delete q.displaystring;
            e[v] = l;
          }
        }
      }
      if (u) {
        for (s = 0;s < G;s++) {
          for (b = p.row;b <= r.row;b++) {
            0 > u ? (v = SocialCalc.crToCoord(I.col + G - s - 1, b), l = SocialCalc.crToCoord(r.col - s, b)) : (v = SocialCalc.crToCoord(I.col - G + s + 1, b), l = SocialCalc.crToCoord(p.col + s, b));
            w = a.GetAssuredCell(v);
            c && D.AddUndo("set " + v + " all", a.CellToString(w));
            q = a.GetAssuredCell(l);
            if ("all" == f || "formats" == f) {
              for (h in H) {
                1 != H[h] && (void 0 === typeof w[h] || 3 == H[h] ? delete q[h] : q[h] = w[h]);
              }
            }
            if ("all" == f || "formulas" == f) {
              q.datavalue = w.datavalue, q.datatype = w.datatype, q.valuetype = w.valuetype, q.formula = w.formula, delete q.parseinfo, q.errors = w.errors;
            }
            delete q.displaystring;
            e[v] = l;
          }
        }
      }
      I.col + y - 1 > B.lastcol && (B.lastcol = I.col + y - 1);
      I.row + C - 1 > B.lastrow && (B.lastrow = I.row + C - 1);
      for (b = p.row;b < p.row + C;b++) {
        for (s = p.col;s < p.col + y;s++) {
          if (l = SocialCalc.crToCoord(s + A, b + d), q = a.GetAssuredCell(l), !q.readonly) {
            if (c && D.AddUndo("set " + l + " all", a.CellToString(q)), v = SocialCalc.crToCoord(s, b), e[v] = l, "all" != f || Y[v]) {
              (w = Y[v]) || (w = a.GetAssuredCell(v));
              if ("all" == f || "formats" == f) {
                for (h in H) {
                  1 != H[h] && (void 0 === typeof w[h] || 3 == H[h] ? delete q[h] : q[h] = w[h]);
                }
              }
              if ("all" == f || "formulas" == f) {
                q.datavalue = w.datavalue, q.datatype = w.datatype, q.valuetype = w.valuetype, q.formula = w.formula, delete q.parseinfo, q.errors = w.errors, w.comment ? q.comment = w.comment : q.comment && delete q.comment;
              }
              delete q.displaystring;
            } else {
              delete a.cells[l];
            }
          }
        }
      }
      for (l in a.cells) {
        if (q = a.cells[l]) {
          "f" == q.datatype ? (b = q.formula, q.formula = SocialCalc.ReplaceFormulaCoords(b, e), q.formula != b && (delete q.parseinfo, c && !e[l] && D.AddUndo("set " + l + " formula " + b))) : delete q.parseinfo;
        }
      }
      for (z in a.names) {
        a.names[z] && (b = s = a.names[z].definition, l = "", "=" == s.charAt(0) && (l = "=", s = s.substring(1)), a.names[z].definition = l + SocialCalc.ReplaceFormulaCoords(s, e), c && a.names[z].definition != b && D.AddUndo("name define " + z + " " + b));
      }
      B.needsrecalc = "yes";
      break;
    case "name":
      g = b.NextToken();
      z = b.NextToken();
      f = b.RestOfString();
      z = z.toUpperCase().replace(/[^A-Z0-9_\.]/g, "");
      if ("" == z) {
        break;
      }
      if ("define" == g) {
        if ("" == f) {
          break;
        }
        a.names[z] ? (c && D.AddUndo("name define " + z + " " + a.names[z].definition), a.names[z].definition = f) : (c && D.AddUndo("name delete " + z), a.names[z] = {definition:f, desc:""});
      } else {
        "desc" == g ? a.names[z] && (c && D.AddUndo("name desc " + z + " " + a.names[z].desc), a.names[z].desc = f) : "delete" == g && (c && (a.names[z].desc && D.AddUndo("name desc " + z + " " + a.names[z].desc), D.AddUndo("name define " + z + " " + a.names[z].definition)), delete a.names[z]);
      }
      B.needsrecalc = "yes";
      break;
    case "recalc":
      B.needsrecalc = "yes";
      a.recalconce = !0;
      break;
    case "redisplay":
      a.renderneeded = !0;
      break;
    case "changedrendervalues":
      a.changedrendervalues = !0;
      break;
    case "pane":
      z = b.NextToken().toUpperCase();
      l = 1;
      h = SocialCalc.GetSpreadsheetControlObject().editor;
      if ("ROW" === z.toUpperCase()) {
        b = parseInt(b.NextToken(), 10);
        "undefined" !== typeof h.context.rowpanes[1] && "number" === typeof h.context.rowpanes[1].first && (l = h.context.rowpanes[1].first);
        for (c && D.AddUndo("pane row " + l);"yes" == h.context.sheetobj.rowattribs.hide[b];) {
          b++;
        }
        (!b || b <= h.context.rowpanes[0].first) && 1 < h.context.rowpanes.length ? h.context.rowpanes.length = 1 : (h.context.SetRowPaneFirstLast(0, h.context.rowpanes[0].first, b - 1), h.context.SetRowPaneFirstLast(1, b, b));
        h.griddiv && (c = document.getElementById("trackingline-vertical")) && (h.griddiv.removeChild(c), h.FitToEditTable());
      } else {
        s = parseInt(b.NextToken(), 10);
        "undefined" !== typeof h.context.colpanes[1] && "number" === typeof h.context.colpanes[1].first && (l = h.context.colpanes[1].first);
        for (c && D.AddUndo("pane col " + l);"yes" == h.context.sheetobj.colattribs.hide[SocialCalc.rcColname(s)];) {
          s++;
        }
        (!s || s <= h.context.colpanes[0].first) && 1 < h.context.colpanes.length ? h.context.colpanes.length = 1 : (h.context.SetColPaneFirstLast(0, h.context.colpanes[0].first, s - 1), h.context.SetColPaneFirstLast(1, s, s));
        h.griddiv && (c = document.getElementById("trackingline-horizon")) && (h.griddiv.removeChild(c), h.FitToEditTable());
      }
      a.renderneeded = !0;
      break;
    case "startcmdextension":
      z = b.NextToken();
      (D = a.sci.CmdExtensionCallbacks[z]) && D.func(z, D.data, a, b, c);
      break;
    case "settimetrigger":
    ;
    case "sendemail":
    ;
    case "submitform":
      break;
    default:
      n = A.s_escUnknownCmd + d;
  }
  return n;
};
SocialCalc.SheetUndo = function(a) {
  var b, c = a.changes.TOS(), d = "";
  for (b = c ? c.undo.length - 1 : -1;0 <= b;b--) {
    d && (d += "\n"), d += c.undo[b];
  }
  a.changes.Undo();
  a.ScheduleSheetCommands(d, !1);
};
SocialCalc.SheetRedo = function(a) {
  var b, c;
  if (a.changes.Redo()) {
    b = a.changes.TOS();
    var d = "";
    for (c = 0;b && c < b.command.length;c++) {
      d && (d += "\n"), d += b.command[c];
    }
    a.ScheduleSheetCommands(d, !1);
  } else {
    a.ScheduleSheetCommands("", !1);
  }
};
SocialCalc.CreateAuditString = function(a) {
  var b, c = "", d = a.changes.stack, e = a.changes.tos;
  for (a = 0;a <= e;a++) {
    for (b = 0;b < d[a].command.length;b++) {
      c += d[a].command[b] + "\n";
    }
  }
  return c;
};
SocialCalc.GetStyleNum = function(a, b, c) {
  var d;
  if (0 == c.length) {
    return 0;
  }
  d = a[b + "hash"][c];
  d || (1 > a[b + "s"].length && a[b + "s"].push(""), d = a[b + "s"].push(c) - 1, a[b + "hash"][c] = d, a.changedrendervalues = !0);
  return d;
};
SocialCalc.GetStyleString = function(a, b, c) {
  return c ? a[b + "s"][c] : null;
};
SocialCalc.OffsetFormulaCoords = function(a, b, c) {
  var d, e, f, g, h = "";
  d = SocialCalc.Formula;
  if (!d) {
    return "Need SocialCalc.Formula";
  }
  var l = d.TokenType, n = l.op, p = l.string, l = l.coord, r = d.TokenOpExpansion;
  a = d.ParseFormulaIntoTokens(a);
  for (f = 0;f < a.length;f++) {
    if (e = a[f].type, d = a[f].text, e == l) {
      g = "";
      e = SocialCalc.coordToCr(d);
      "$" != d.charAt(0) ? e.col += b : g += "$";
      g += SocialCalc.rcColname(e.col);
      -1 == d.indexOf("$", 1) ? e.row += c : g += "$";
      g += e.row;
      if (1 > e.row || 1 > e.col) {
        g = "#REF!";
      }
      h += g;
    } else {
      h = e == p ? 0 <= d.indexOf('"') ? h + ('"' + d.replace(/"/, '""') + '"') : h + ('"' + d + '"') : e == n ? h + (r[d] || d) : h + d;
    }
  }
  return h;
};
SocialCalc.AdjustFormulaCoords = function(a, b, c, d, e) {
  var f, g, h = "", l = !1, n = SocialCalc.Formula;
  if (!n) {
    return "Need SocialCalc.Formula";
  }
  var p = n.TokenType, r = p.op, s = p.string, p = p.coord, n = n.TokenOpExpansion;
  parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(a);
  for (g = 0;g < parseinfo.length;g++) {
    f = parseinfo[g].type;
    a = parseinfo[g].text;
    f == r && ("!" == a ? l = !0 : ":" != a && (l = !1), a = n[a] || a);
    if (f == p) {
      cr = SocialCalc.coordToCr(a);
      (0 > c && cr.col >= b && cr.col < b - c || 0 > e && cr.row >= d && cr.row < d - e) && !l && (cr.col = 0, cr.row = 0);
      l || (cr.col >= b && (cr.col += c), cr.row >= d && (cr.row += e));
      f = "$" == a.charAt(0) ? "$" + SocialCalc.rcColname(cr.col) : SocialCalc.rcColname(cr.col);
      f = -1 != a.indexOf("$", 1) ? f + ("$" + cr.row) : f + cr.row;
      if (1 > cr.row || 1 > cr.col) {
        f = "#REF!";
      }
      a = f;
    } else {
      f == s && (a = 0 <= a.indexOf('"') ? '"' + a.replace(/"/, '""') + '"' : '"' + a + '"');
    }
    h += a;
  }
  return h;
};
SocialCalc.ReplaceFormulaCoords = function(a, b) {
  var c, d, e, f = "", g = !1;
  d = SocialCalc.Formula;
  if (!d) {
    return "Need SocialCalc.Formula";
  }
  var h = d.TokenType, l = h.op, n = h.string, h = h.coord, p = d.TokenOpExpansion;
  parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(a);
  for (e = 0;e < parseinfo.length;e++) {
    c = parseinfo[e].type, d = parseinfo[e].text, c == l && ("!" == d ? g = !0 : ":" != d && (g = !1), d = p[d] || d), c == h ? (cr = SocialCalc.coordToCr(d), c = SocialCalc.crToCoord(cr.col, cr.row), b[c] && !g && (cr = SocialCalc.coordToCr(b[c]), c = "$" == d.charAt(0) ? "$" + SocialCalc.rcColname(cr.col) : SocialCalc.rcColname(cr.col), d = c = -1 != d.indexOf("$", 1) ? c + ("$" + cr.row) : c + cr.row)) : c == n && (d = 0 <= d.indexOf('"') ? '"' + d.replace(/"/, '""') + '"' : '"' + d + '"'), f += 
    d;
  }
  return f;
};
SocialCalc.RecalcInfo = {sheet:null, currentState:0, state:{idle:0, start_calc:1, order:2, calc:3, start_wait:4, done_wait:5}, recalctimer:null, maxtimeslice:100, timeslicedelay:1, starttime:0, queue:[], LoadSheet:function(a) {
  return!1;
}};
SocialCalc.RecalcData = function() {
  this.inrecalc = !0;
  this.celllist = [];
  this.celllistitem = 0;
  this.calclist = null;
  this.calclistlength = 0;
  this.nextcalc = this.lastcalc = this.firstcalc = null;
  this.count = 0;
  this.checkinfo = {};
};
SocialCalc.RecalcCheckInfo = function() {
  this.oldcoord = null;
  this.parsepos = 0;
  this.inrangestart = this.inrange = !1;
  this.r = this.c = this.r2 = this.r1 = this.c2 = this.c1 = this.cr2 = this.cr1 = null;
};
SocialCalc.RecalcSheet = function(a) {
  var b = SocialCalc.RecalcInfo;
  b.currentState != b.state.idle ? b.queue.push(a) : (delete a.attribs.circularreferencecell, SocialCalc.Formula.FreshnessInfoReset(), SocialCalc.RecalcClearTimeout(), b.sheet = a, b.currentState = b.state.start_calc, b.starttime = new Date, a.statuscallback && a.statuscallback(b, "calcstart", null, a.statuscallbackparams), SocialCalc.RecalcSetTimeout());
};
SocialCalc.RecalcSetTimeout = function() {
  var a = SocialCalc.RecalcInfo;
  a.recalctimer = window.setTimeout(SocialCalc.RecalcTimerRoutine, a.timeslicedelay);
};
SocialCalc.RecalcClearTimeout = function() {
  var a = SocialCalc.RecalcInfo;
  a.recalctimer && (window.clearTimeout(a.recalctimer), a.recalctimer = null);
};
SocialCalc.RecalcLoadedSheet = function(a, b, c, d) {
  var e = SocialCalc.RecalcInfo, f = SocialCalc.Formula;
  a = SocialCalc.Formula.AddSheetToCache(a || f.SheetCache.waitingForLoading, b, d);
  c && a && "off" != a.attribs.recalc && (a.previousrecalcsheet = e.sheet, e.sheet = a, e.currentState = e.state.start_calc);
  f.SheetCache.waitingForLoading = null;
  SocialCalc.RecalcSetTimeout();
};
SocialCalc.RecalcTimerRoutine = function() {
  var a, b, c, d = new Date, e = 0, f = SocialCalc.Formula;
  if (!f) {
    return "Need SocialCalc.Formula";
  }
  var g = SocialCalc.RecalcInfo, h = g.sheet;
  if (h) {
    var l = h.recalcdata || (h.recalcdata = {}), n = function(a, c) {
      h.statuscallback && h.statuscallback(l, a, c, h.statuscallbackparams);
    };
    SocialCalc.RecalcClearTimeout();
    if (g.currentState == g.state.start_calc) {
      l = new SocialCalc.RecalcData;
      h.recalcdata = l;
      for (c in h.cells) {
        c && l.celllist.push(c);
      }
      l.calclist = {};
      g.currentState = g.state.order;
    }
    if (g.currentState == g.state.order) {
      for (;l.celllistitem < l.celllist.length;) {
        if (c = l.celllist[l.celllistitem++], SocialCalc.RecalcCheckCell(h, c), new Date - d >= g.maxtimeslice) {
          n("calcorder", {coord:c, total:l.celllist.length, count:l.celllistitem});
          SocialCalc.RecalcSetTimeout();
          return;
        }
      }
      n("calccheckdone", l.calclistlength);
      l.nextcalc = l.firstcalc;
      g.currentState = g.state.calc;
      SocialCalc.RecalcSetTimeout();
    } else {
      if (g.currentState == g.state.start_wait) {
        g.currentState = g.state.done_wait;
        if (g.LoadSheet && (a = g.LoadSheet(f.SheetCache.waitingForLoading))) {
          return;
        }
        SocialCalc.RecalcLoadedSheet(null, "", !1);
      } else {
        if (g.currentState == g.state.done_wait) {
          g.currentState = g.state.calc, SocialCalc.RecalcSetTimeout();
        } else {
          g.currentState != g.state.calc && alert("Recalc state error: " + g.currentState + ". Error in SocialCalc code.");
          for (c = h.recalcdata.nextcalc;c;) {
            b = h.cells[c];
            b.parseinfo || (b.parseinfo = f.ParseFormulaIntoTokens(b.formula));
            b.parseinfo.coord = c;
            a = f.evaluate_parsed_formula(b.parseinfo, h, !1);
            if (f.SheetCache.waitingForLoading) {
              l.nextcalc = c;
              l.count += e;
              n("calcloading", {sheetname:f.SheetCache.waitingForLoading});
              g.currentState = g.state.start_wait;
              SocialCalc.RecalcSetTimeout();
              return;
            }
            if (f.RemoteFunctionInfo.waitingForServer) {
              l.nextcalc = c;
              l.count += e;
              n("calcserverfunc", {funcname:f.RemoteFunctionInfo.waitingForServer, coord:c, total:l.calclistlength, count:l.count});
              g.currentState = g.state.done_wait;
              return;
            }
            if (b.datavalue != a.value || b.valuetype != a.type) {
              b.datavalue = a.value, b.valuetype = a.type, delete b.displaystring, h.recalcchangedavalue = !0;
            }
            a.error && (b.errors = a.error);
            e++;
            c = h.recalcdata.calclist[c];
            if (new Date - d >= g.maxtimeslice) {
              l.nextcalc = c;
              l.count += e;
              n("calcstep", {coord:c, total:l.calclistlength, count:l.count});
              SocialCalc.RecalcSetTimeout();
              return;
            }
          }
          l.inrecalc = !1;
          h.reRenderCellList = h.recalcdata.celllist;
          delete h.recalcdata;
          delete h.attribs.needsrecalc;
          g.sheet = h.previousrecalcsheet || null;
          g.sheet ? (g.currentState = g.state.calc, SocialCalc.RecalcSetTimeout()) : (f.FreshnessInfo.recalc_completed = !0, g.currentState = g.state.idle, n("calcfinished", new Date - g.starttime), 0 < g.queue.length && (h = g.queue.shift(), h.RecalcSheet()));
        }
      }
    }
  }
};
SocialCalc.RecalcCheckCell = function(a, b) {
  var c, d, e, f, g, h, l, n, p = SocialCalc.Formula;
  if (!p) {
    return "Need SocialCalc.Formula";
  }
  f = p.TokenType;
  var r = f.op, s = f.name, q = f.coord, t = a.recalcdata, u = t.checkinfo, v = !1, A = null, w = b;
  a: for (;w;) {
    if (l = a.cells[w], n = u[w], !l || "f" != l.datatype || n && "object" != typeof n) {
      w = A, u[w] && (A = u[w].oldcoord);
    } else {
      n || (n = new SocialCalc.RecalcCheckInfo, u[w] = n);
      l.errors && delete l.errors;
      l.parseinfo || (l.parseinfo = p.ParseFormulaIntoTokens(l.formula));
      c = l.parseinfo;
      for (f = n.parsepos;f < c.length;f++) {
        if (n.inrange) {
          n.inrangestart && (n.cr1.col > n.cr2.col ? (n.c1 = n.cr2.col, n.c2 = n.cr1.col) : (n.c1 = n.cr1.col, n.c2 = n.cr2.col), n.c = n.c1 - 1, n.cr1.row > n.cr2.row ? (n.r1 = n.cr2.row, n.r2 = n.cr1.row) : (n.r1 = n.cr1.row, n.r2 = n.cr2.row), n.r = n.r1, n.inrangestart = !1);
          n.c += 1;
          if (n.c > n.c2) {
            n.r += 1;
            if (n.r > n.r2) {
              n.inrange = !1;
              continue;
            }
            n.c = n.c1;
          }
          c = SocialCalc.crToCoord(n.c, n.r);
          n.parsepos = f;
          n.oldcoord = A;
          A = w;
          w = c;
          if (u[w] && "object" == typeof u[w]) {
            return l.errors = SocialCalc.Constants.s_caccCircRef + b, u[b] = !0, t.firstcalc ? t.calclist[t.lastcalc] = b : t.firstcalc = b, t.lastcalc = b, t.calclistlength++, a.attribs.circularreferencecell = w + "|" + A, l.errors;
          }
          continue a;
        }
        e = c[f].type;
        d = c[f].text;
        e == r && ("!" == d ? v = !0 : ":" != d && (v = !1));
        if (e == s) {
          if (g = p.LookupName(a, d), "range" == g.type) {
            if (h = g.value.indexOf("|"), -1 != h) {
              n.cr1 = SocialCalc.coordToCr(g.value.substring(0, h));
              d = g.value.indexOf("|", h + 1);
              n.cr2 = SocialCalc.coordToCr(g.value.substring(h + 1, d));
              n.inrange = !0;
              n.inrangestart = !0;
              f -= 1;
              continue;
            }
          } else {
            "coord" == g.type && (e = q, d = g.value);
          }
        }
        if (e == q) {
          if (2 <= f && c[f - 1].type == r && ":" == c[f - 1].text && c[f - 2].type == q && !v) {
            n.cr1 = SocialCalc.coordToCr(c[f - 2].text), n.cr2 = SocialCalc.coordToCr(d), n.inrange = !0, n.inrangestart = !0, f -= 1;
          } else {
            if (!v) {
              -1 != d.indexOf("$") && (d = d.replace(/\$/g, ""));
              n.parsepos = f + 1;
              n.oldcoord = A;
              A = w;
              w = d;
              if (u[w] && "object" == typeof u[w]) {
                return l.errors = SocialCalc.Constants.s_caccCircRef + b, u[b] = !0, t.firstcalc ? t.calclist[t.lastcalc] = b : t.firstcalc = b, t.lastcalc = b, t.calclistlength++, a.attribs.circularreferencecell = w + "|" + A, l.errors;
              }
              continue a;
            }
          }
        }
      }
      v = !1;
      u[w] = !0;
      t.firstcalc ? t.calclist[t.lastcalc] = w : t.firstcalc = w;
      t.lastcalc = w;
      t.calclistlength++;
      w = A;
      A = u[w] ? u[w].oldcoord : null;
    }
  }
  return "";
};
SocialCalc.Parse = function(a) {
  this.str = a;
  this.pos = 0;
  this.delimiter = " ";
  this.lineEnd = a.indexOf("\n");
  0 > this.lineEnd && (this.lineEnd = a.length);
};
SocialCalc.Parse.prototype.NextToken = function() {
  if (0 > this.pos) {
    return "";
  }
  var a = this.str.indexOf(this.delimiter, this.pos), b = this.pos;
  a > this.lineEnd && (a = this.lineEnd);
  if (0 <= a) {
    return this.pos = a + 1, this.str.substring(b, a);
  }
  this.pos = this.lineEnd;
  return this.str.substring(b, this.lineEnd);
};
SocialCalc.Parse.prototype.RestOfString = function() {
  var a = this.pos;
  if (0 > this.pos || this.pos >= this.lineEnd) {
    return "";
  }
  this.pos = this.lineEnd;
  return this.str.substring(a, this.lineEnd);
};
SocialCalc.Parse.prototype.RestOfStringNoMove = function() {
  return 0 > this.pos || this.pos >= this.lineEnd ? "" : this.str.substring(this.pos, this.lineEnd);
};
SocialCalc.Parse.prototype.NextLine = function() {
  this.pos = this.lineEnd + 1;
  this.lineEnd = this.str.indexOf("\n", this.pos);
  0 > this.lineEnd && (this.lineEnd = this.str.length);
};
SocialCalc.Parse.prototype.EOF = function() {
  return 0 > this.pos || this.pos >= this.str.length ? !0 : !1;
};
SocialCalc.UndoStack = function() {
  this.stack = [];
  this.tos = -1;
  this.maxRedo = 0;
  this.maxUndo = 50;
};
SocialCalc.UndoStack.prototype.PushChange = function(a) {
  for (;0 < this.stack.length && this.stack.length - 1 > this.tos;) {
    this.stack.pop();
  }
  this.stack.push({command:[], type:a, undo:[]});
  this.maxRedo && this.stack.length > this.maxRedo && this.stack.shift();
  this.maxUndo && this.stack.length > this.maxUndo && (this.stack[this.stack.length - this.maxUndo - 1].undo = []);
  this.tos = this.stack.length - 1;
};
SocialCalc.UndoStack.prototype.AddDo = function() {
  if (this.stack[this.stack.length - 1]) {
    for (var a = [], b = 0;b < arguments.length;b++) {
      null != arguments[b] && a.push(arguments[b]);
    }
    a = a.join(" ");
    this.stack[this.stack.length - 1].command.push(a);
  }
};
SocialCalc.UndoStack.prototype.AddUndo = function() {
  if (this.stack[this.stack.length - 1]) {
    for (var a = [], b = 0;b < arguments.length;b++) {
      null != arguments[b] && a.push(arguments[b]);
    }
    a = a.join(" ");
    this.stack[this.stack.length - 1].undo.push(a);
  }
};
SocialCalc.UndoStack.prototype.TOS = function() {
  return 0 <= this.tos ? this.stack[this.tos] : null;
};
SocialCalc.UndoStack.prototype.Undo = function() {
  return 0 <= this.tos && (!this.maxUndo || this.tos > this.stack.length - this.maxUndo - 1) ? (this.tos -= 1, !0) : !1;
};
SocialCalc.UndoStack.prototype.Redo = function() {
  return this.tos < this.stack.length - 1 ? (this.tos += 1, !0) : !1;
};
SocialCalc.Clipboard = {clipboard:""};
SocialCalc.RenderContext = function(a) {
  var b = a.attribs, c = SocialCalc.Constants;
  this.sheetobj = a;
  this.showRCHeaders = this.showGrid = this.hideRowsCols = !1;
  this.rownamewidth = c.defaultRowNameWidth;
  this.pixelsPerRow = c.defaultAssumedRowHeight;
  this.cellskip = {};
  this.coordToCR = {};
  this.colwidth = [];
  this.rowheight = [];
  this.totalheight = this.totalwidth = 0;
  this.rowpanes = [];
  this.colpanes = [];
  this.colunhideleft = [];
  this.colunhideright = [];
  this.rowunhidetop = [];
  this.rowunhidebottom = [];
  this.maxrow = this.maxcol = 0;
  this.highlights = {};
  this.cursorsuffix = "";
  this.highlightTypes = {cursor:{style:c.defaultHighlightTypeCursorStyle, className:c.defaultHighlightTypeCursorClass}, range:{style:c.defaultHighlightTypeRangeStyle, className:c.defaultHighlightTypeRangeClass}, cursorinsertup:{style:"color:#FFF;backgroundColor:#A6A6A6;backgroundRepeat:repeat-x;backgroundPosition:top left;backgroundImage:url(" + c.defaultImagePrefix + "cursorinsertup.gif);", className:c.defaultHighlightTypeCursorClass}, cursorinsertleft:{style:"color:#FFF;backgroundColor:#A6A6A6;backgroundRepeat:repeat-y;backgroundPosition:top left;backgroundImage:url(" + 
  c.defaultImagePrefix + "cursorinsertleft.gif);", className:c.defaultHighlightTypeCursorClass}, range2:{style:"color:#000;backgroundColor:#FFF;backgroundImage:url(" + c.defaultImagePrefix + "range2.gif);", className:""}};
  this.cellIDprefix = c.defaultCellIDPrefix;
  this.defaultlinkstyle = null;
  this.defaultHTMLlinkstyle = {type:"html"};
  this.defaultfontstyle = c.defaultCellFontStyle;
  this.defaultfontsize = c.defaultCellFontSize;
  this.defaultfontfamily = c.defaultCellFontFamily;
  this.defaultlayout = c.defaultCellLayout;
  this.defaultpanedividerwidth = c.defaultPaneDividerWidth;
  this.defaultpanedividerheight = c.defaultPaneDividerHeight;
  this.gridCSS = c.defaultGridCSS;
  this.commentClassName = c.defaultCommentClass;
  this.commentCSS = c.defaultCommentStyle;
  this.commentNoGridClassName = c.defaultCommentNoGridClass;
  this.commentNoGridCSS = c.defaultCommentNoGridStyle;
  this.readonlyClassName = c.defaultReadonlyClass;
  this.readonlyCSS = c.defaultReadonlyStyle;
  this.readonlyNoGridClassName = c.defaultReadonlyNoGridClass;
  this.readonlyNoGridCSS = c.defaultReadonlyNoGridStyle;
  this.readonlyComment = c.defaultReadonlyComment;
  this.classnames = {colname:c.defaultColnameClass, rowname:c.defaultRownameClass, selectedcolname:c.defaultSelectedColnameClass, selectedrowname:c.defaultSelectedRownameClass, upperleft:c.defaultUpperLeftClass, skippedcell:c.defaultSkippedCellClass, panedivider:c.defaultPaneDividerClass, unhideleft:c.defaultUnhideLeftClass, unhideright:c.defaultUnhideRightClass, unhidetop:c.defaultUnhideTopClass, unhidebottom:c.defaultUnhideBottomClass, colresizebar:c.defaultColResizeBarClass, rowresizebar:c.defaultRowResizeBarClass};
  this.explicitStyles = {colname:c.defaultColnameStyle, rowname:c.defaultRownameStyle, selectedcolname:c.defaultSelectedColnameStyle, selectedrowname:c.defaultSelectedRownameStyle, upperleft:c.defaultUpperLeftStyle, skippedcell:c.defaultSkippedCellStyle, panedivider:c.defaultPaneDividerStyle, unhideleft:c.defaultUnhideLeftStyle, unhideright:c.defaultUnhideRightStyle, unhidetop:c.defaultUnhideTopStyle, unhidebottom:c.defaultUnhideBottomStyle};
  this.cellskip = null;
  this.needcellskip = !0;
  this.fonts = [];
  this.layouts = [];
  this.needprecompute = !0;
  if (b) {
    this.rowpanes[0] = {first:1, last:b.lastrow}, this.colpanes[0] = {first:1, last:b.lastcol}, this.usermaxcol = b.usermaxcol, this.usermaxrow = b.usermaxrow;
  } else {
    throw c.s_rcMissingSheet;
  }
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
SocialCalc.RenderContext.prototype.SetRowPaneFirstLast = function(a, b, c) {
  this.rowpanes[a] = {first:b, last:c};
};
SocialCalc.RenderContext.prototype.SetColPaneFirstLast = function(a, b, c) {
  this.colpanes[a] = {first:b, last:c};
};
SocialCalc.RenderContext.prototype.CoordInPane = function(a, b, c) {
  return SocialCalc.CoordInPane(this, a, b, c);
};
SocialCalc.RenderContext.prototype.CellInPane = function(a, b, c, d) {
  return SocialCalc.CellInPane(this, a, b, c, d);
};
SocialCalc.RenderContext.prototype.InitializeTable = function(a) {
  SocialCalc.InitializeTable(this, a);
};
SocialCalc.RenderContext.prototype.RenderSheet = function(a, b) {
  return SocialCalc.RenderSheet(this, a, b);
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
SocialCalc.RenderContext.prototype.RenderRow = function(a, b, c) {
  return SocialCalc.RenderRow(this, a, b, c);
};
SocialCalc.RenderContext.prototype.RenderSpacingRow = function() {
  return SocialCalc.RenderSpacingRow(this);
};
SocialCalc.RenderContext.prototype.RenderCell = function(a, b, c, d, e, f) {
  return SocialCalc.RenderCell(this, a, b, c, d, e, f);
};
SocialCalc.PrecomputeSheetFontsAndLayouts = function(a) {
  var b, c, d, e, f, g, h = a.sheetobj;
  e = h.attribs;
  e.defaultfont && (b = h.fonts[e.defaultfont], b = b.replace(/^\*/, SocialCalc.Constants.defaultCellFontStyle), b = b.replace(/(.+)\*(.+)/, "$1" + SocialCalc.Constants.defaultCellFontSize + "$2"), b = b.replace(/\*$/, SocialCalc.Constants.defaultCellFontFamily), c = b.match(/^(\S+? \S+?) (\S+?) (\S.*)$/), a.defaultfontstyle = c[1], a.defaultfontsize = c[2], a.defaultfontfamily = c[3]);
  for (f = 1;f < h.fonts.length;f++) {
    c = h.fonts[f], c = c.replace(/^\*/, a.defaultfontstyle), c = c.replace(/(.+)\*(.+)/, "$1" + a.defaultfontsize + "$2"), c = c.replace(/\*$/, a.defaultfontfamily), c = c.match(/^(\S+?) (\S+?) (\S+?) (\S.*)$/), a.fonts[f] = {style:c[1], weight:c[2], size:c[3], family:c[4]};
  }
  b = /^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/;
  d = SocialCalc.Constants.defaultCellLayout.match(b);
  e = e.defaultlayout ? h.layouts[e.defaultlayout].match(b) : " * * * * *".split(" ");
  for (f = 1;f < h.layouts.length;f++) {
    c = h.layouts[f];
    c = c.match(b);
    for (g = 1;5 >= g;g++) {
      "*" == c[g] && (c[g] = "*" != e[g] ? e[g] : d[g]);
    }
    a.layouts[f] = "padding:" + c[1] + " " + c[2] + " " + c[3] + " " + c[4] + ";vertical-align:" + c[5] + ";";
  }
  a.needprecompute = !1;
};
SocialCalc.CalculateCellSkipData = function(a) {
  var b, c, d, e, f, g, h, l, n = a.sheetobj;
  a.maxrow = 0;
  a.maxcol = 0;
  a.cellskip = {};
  for (b = 1;b <= n.attribs.lastrow;b++) {
    for (c = 1;c <= n.attribs.lastcol;c++) {
      if (d = SocialCalc.crToCoord(c, b), e = n.cells[d], void 0 !== e && !a.cellskip[d] && (f = e.colspan || 1, e = e.rowspan || 1, 1 < f || 1 < e)) {
        for (g = b;g < b + e;g++) {
          for (h = c;h < c + f;h++) {
            l = SocialCalc.crToCoord(h, g), l == d ? a.coordToCR[d] = {row:b, col:c} : a.cellskip[l] = d, g > a.maxrow && (maxrow = g), h > a.maxcol && (maxcol = h);
          }
        }
      }
    }
  }
  a.needcellskip = !1;
};
SocialCalc.CalculateColWidthData = function(a) {
  var b, c, d, e = a.sheetobj;
  d = a.showRCHeaders ? a.rownamewidth - 0 : 0;
  for (colpane = 0;colpane < a.colpanes.length;colpane++) {
    for (b = a.colpanes[colpane].first;b <= a.colpanes[colpane].last;b++) {
      if (c = SocialCalc.rcColname(b), "yes" == e.colattribs.hide[c]) {
        a.colwidth[b] = 0;
      } else {
        c = e.colattribs.width[c] || e.attribs.defaultcolwidth || SocialCalc.Constants.defaultColWidth;
        if ("blank" == c || "auto" == c) {
          c = "";
        }
        a.colwidth[b] = c + "";
        d += c && 0 < c - 0 ? c - 0 : 10;
      }
    }
  }
  a.totalwidth = d;
};
SocialCalc.CalculateRowHeightData = function(a) {
  var b, c, d, e = a.sheetobj;
  d = a.showRCHeaders ? a.pixelsPerRow : 0;
  for (rowpane = 0;rowpane < a.rowpanes.length;rowpane++) {
    for (b = a.rowpanes[rowpane].first;b <= a.rowpanes[rowpane].last;b++) {
      if ("yes" === e.rowattribs.hide[b]) {
        a.rowheight[b] = 0;
      } else {
        c = e.rowattribs.height[b] || e.attribs.defaultrowheight || SocialCalc.Constants.defaultAssumedRowHeight;
        if ("blank" === c || "auto" === c) {
          c = "";
        }
        a.rowheight[b] = c + "";
        d += c && 0 < c - 0 ? c - 0 : 10;
      }
    }
  }
  a.totalheight = d;
};
SocialCalc.InitializeTable = function(a, b) {
  b.style.borderCollapse = "collapse";
  b.cellSpacing = "0";
  b.cellPadding = "0";
  b.style.width = a.totalwidth + "px";
};
SocialCalc.RenderSheet = function(a, b, c) {
  var d, e, f, g;
  a.sheetobj.changedrendervalues && (a.needcellskip = !0, a.needprecompute = !0, a.sheetobj.changedrendervalues = !1);
  a.needcellskip && a.CalculateCellSkipData();
  a.needprecompute && a.PrecomputeSheetFontsAndLayouts();
  a.CalculateColWidthData();
  a.CalculateRowHeightData();
  f = document.createElement("table");
  a.InitializeTable(f);
  d = a.RenderColGroup();
  f.appendChild(d);
  g = document.createElement("tbody");
  g.appendChild(a.RenderSizingRow());
  a.showRCHeaders && (d = a.RenderColHeaders()) && g.appendChild(d);
  for (e = 0;e < a.rowpanes.length;e++) {
    for (rownum = a.rowpanes[e].first;rownum <= a.rowpanes[e].last;rownum++) {
      d = a.RenderRow(rownum, e, c), g.appendChild(d);
    }
    e < a.rowpanes.length - 1 && (d = a.RenderSpacingRow(), g.appendChild(d));
  }
  f.appendChild(g);
  b && (a = b.parentNode) && a.replaceChild(f, b);
  return f;
};
SocialCalc.RenderRow = function(a, b, c, d) {
  var e = a.sheetobj, f = document.createElement("tr"), g, h, l;
  if (a.showRCHeaders) {
    h = document.createElement("td");
    a.classnames && (h.className = a.classnames.rowname);
    a.explicitStyles && (h.style.cssText = a.explicitStyles.rowname);
    h.width = a.rownamewidth;
    h.height = a.rowheight[b];
    h.style.verticalAlign = "top";
    h.innerHTML = b + "";
    if (b < a.rowpanes[a.rowpanes.length - 1].last && "yes" == e.rowattribs.hide[b + 1]) {
      l = document.createElement("div");
      l.style.position = "relative";
      g = document.createElement("div");
      a.classnames && (g.className = a.classnames.unhidetop);
      a.explicitStyles && (g.style.cssText = a.explicitStyles.unhidetop);
      var n = a.rowheight[b] - 0 - SocialCalc.Constants.defaultAssumedRowHeight;
      g.style.bottom = "-" + (0 === n ? 4 : n) + "px";
      a.rowunhidetop[b] = g;
      l.appendChild(g);
      h.appendChild(l);
    }
    1 < b && "yes" == e.rowattribs.hide[b - 1] && (g = document.createElement("div"), a.classnames && (g.className = a.classnames.unhidebottom), a.explicitStyles && (g.style.cssText = a.explicitStyles.unhidebottom), a.rowunhidebottom[b] = g, h.appendChild(g));
    l = document.createElement("div");
    l.className = a.classnames.rowresizebar;
    h.appendChild(l);
    f.appendChild(h);
  }
  for (l = 0;l < a.colpanes.length;l++) {
    for (g = a.colpanes[l].first;g <= a.colpanes[l].last;g++) {
      (h = a.RenderCell(b, g, c, l, null, d)) && f.appendChild(h);
    }
    l < a.colpanes.length - 1 && (h = document.createElement("td"), h.width = a.defaultpanedividerwidth, a.classnames.panedivider && (h.className = a.classnames.panedivider), a.explicitStyles.panedivider && (h.style.cssText = a.explicitStyles.panedivider), g = document.createElement("div"), g.style.width = a.defaultpanedividerwidth + "px", g.style.overflow = "hidden", h.appendChild(g), f.appendChild(h));
  }
  "yes" == e.rowattribs.hide[b] && (f.style.cssText += ";display:none");
  return f;
};
SocialCalc.RenderSpacingRow = function(a) {
  var b, c, d, e, f = document.createElement("tr");
  a.showRCHeaders && (c = document.createElement("td"), c.width = a.rownamewidth, c.height = a.defaultpanedividerheight, a.classnames.panedivider && (c.className = a.classnames.panedivider), a.explicitStyles.panedivider && (c.style.cssText = a.explicitStyles.panedivider), f.appendChild(c));
  for (d = 0;d < a.colpanes.length;d++) {
    for (b = a.colpanes[d].first;b <= a.colpanes[d].last;b++) {
      c = document.createElement("td");
      if (e = a.colwidth[b]) {
        c.width = e;
      }
      c.height = a.defaultpanedividerheight;
      a.classnames.panedivider && (c.className = a.classnames.panedivider);
      a.explicitStyles.panedivider && (c.style.cssText = a.explicitStyles.panedivider);
      c && f.appendChild(c);
    }
    d < a.colpanes.length - 1 && (c = document.createElement("td"), c.width = a.defaultpanedividerwidth, c.height = a.defaultpanedividerheight, a.classnames.panedivider && (c.className = a.classnames.panedivider), a.explicitStyles.panedivider && (c.style.cssText = a.explicitStyles.panedivider), f.appendChild(c));
  }
  return f;
};
SocialCalc.RenderColHeaders = function(a) {
  var b = a.sheetobj, c = document.createElement("tr"), d, e;
  if (!a.showRCHeaders) {
    return null;
  }
  e = document.createElement("td");
  a.classnames && (e.className = a.classnames.upperleft);
  a.explicitStyles && (e.style.cssText = a.explicitStyles.upperleft);
  e.width = a.rownamewidth;
  c.appendChild(e);
  for (colpane = 0;colpane < a.colpanes.length;colpane++) {
    for (d = a.colpanes[colpane].first;d <= a.colpanes[colpane].last;d++) {
      e = document.createElement("td");
      a.classnames && (e.className = a.classnames.colname);
      a.explicitStyles && (e.style.cssText = a.explicitStyles.colname);
      "yes" == b.colattribs.hide[SocialCalc.rcColname(d)] && (e.style.cssText += ";display:none");
      e.innerHTML = SocialCalc.rcColname(d);
      if (d < a.colpanes[a.colpanes.length - 1].last && "yes" == b.colattribs.hide[SocialCalc.rcColname(d + 1)]) {
        var f = document.createElement("div");
        a.classnames && (f.className = a.classnames.unhideleft);
        a.explicitStyles && (f.style.cssText = a.explicitStyles.unhideleft);
        a.colunhideleft[d] = f;
        e.appendChild(f);
      }
      1 < d && "yes" == b.colattribs.hide[SocialCalc.rcColname(d - 1)] && (f = document.createElement("div"), a.classnames && (f.className = a.classnames.unhideright), a.explicitStyles && (f.style.cssText = a.explicitStyles.unhideright), a.colunhideright[d] = f, e.appendChild(f));
      f = document.createElement("span");
      f.style.height = SocialCalc.Constants.defaultAssumedRowHeight + "px";
      f.className = a.classnames.colresizebar;
      e.appendChild(f);
      c.appendChild(e);
    }
    colpane < a.colpanes.length - 1 && (e = document.createElement("td"), e.width = a.defaultpanedividerwidth, a.classnames.panedivider && (e.className = a.classnames.panedivider), a.explicitStyles.panedivider && (e.style.cssText = a.explicitStyles.panedivider), c.appendChild(e));
  }
  return c;
};
SocialCalc.RenderColGroup = function(a) {
  var b, c, d, e, f = a.sheetobj, g = document.createElement("colgroup");
  a.showRCHeaders && (d = document.createElement("col"), d.width = a.rownamewidth, g.appendChild(d));
  for (b = 0;b < a.colpanes.length;b++) {
    for (c = a.colpanes[b].first;c <= a.colpanes[b].last;c++) {
      if (d = document.createElement("col"), "yes" == f.colattribs.hide[SocialCalc.rcColname(c)]) {
        d.width = "1";
      } else {
        if (e = a.colwidth[c]) {
          d.width = e;
        }
        g.appendChild(d);
      }
    }
    b < a.colpanes.length - 1 && (d = document.createElement("col"), d.width = a.defaultpanedividerwidth, g.appendChild(d));
  }
  return g;
};
SocialCalc.RenderSizingRow = function(a) {
  var b, c, d, e, f = a.sheetobj, g = document.createElement("tr");
  a.showRCHeaders && (d = document.createElement("td"), d.style.width = a.rownamewidth + "px", d.height = "1", g.appendChild(d));
  for (b = 0;b < a.colpanes.length;b++) {
    for (c = a.colpanes[b].first;c <= a.colpanes[b].last;c++) {
      d = document.createElement("td");
      if ("yes" == f.colattribs.hide[SocialCalc.rcColname(c)]) {
        d.width = "1";
      } else {
        if (e = a.colwidth[c]) {
          d.width = e;
        }
      }
      d.height = "1";
      g.appendChild(d);
    }
    b < a.colpanes.length - 1 && (d = document.createElement("td"), d.width = a.defaultpanedividerwidth, d.height = "1", g.appendChild(d));
  }
  return g;
};
SocialCalc.RenderCell = function(a, b, c, d, e, f, g) {
  var h = a.sheetobj, l, n, p, r, s, q, t = "";
  b -= 0;
  c -= 0;
  var u = SocialCalc.crToCoord(c, b);
  if (a.cellskip[u]) {
    if (a.CoordInPane(a.cellskip[u], d, e)) {
      return null;
    }
    n = f ? SocialCalc.CreatePseudoElement() : document.createElement("td");
    a.classnames.skippedcell && (n.className = a.classnames.skippedcell);
    a.explicitStyles.skippedcell && (n.style.cssText = a.explicitStyles.skippedcell);
    n.innerHTML = "&nbsp;";
    return n;
  }
  n = f ? SocialCalc.CreatePseudoElement() : document.createElement("td");
  a.cellIDprefix && (n.id = a.cellIDprefix + u);
  (r = h.cells[u]) || (r = new SocialCalc.Cell(u));
  q = h.attribs;
  scc = SocialCalc.Constants;
  if (1 < r.colspan) {
    for (l = p = 1;l < r.colspan;l++) {
      "yes" != h.colattribs.hide[SocialCalc.rcColname(c + l)] && a.CellInPane(b, c + l, d, e) && p++;
    }
    n.colSpan = p;
  }
  if (1 < r.rowspan) {
    for (l = p = 1;l < r.rowspan;l++) {
      "yes" != h.rowattribs.hide[b + l + ""] && a.CellInPane(b + l, c, d, e) && p++;
    }
    n.rowSpan = p;
  }
  void 0 == r.displaystring && (r.displaystring = SocialCalc.FormatValueForDisplay(h, r.datavalue, u, g || a.defaultlinkstyle));
  n.innerHTML = r.displaystring;
  t = (l = r.layout || q.defaultlayout) && "undefined" !== typeof a.layouts[l] ? t + a.layouts[l] : t + scc.defaultCellLayout;
  (l = r.font || q.defaultfont) && "undefined" !== typeof a.fonts[l] ? (g = a.fonts[l], t += "font-style:" + g.style + ";font-weight:" + g.weight + ";font-size:" + g.size + ";font-family:" + g.family + ";") : (scc.defaultCellFontSize && (t += "font-size:" + scc.defaultCellFontSize + ";"), scc.defaultCellFontFamily && (t += "font-family:" + scc.defaultCellFontFamily + ";"));
  (l = r.color || q.defaultcolor) && "undefined" !== typeof h.colors[l] && (t += "color:" + h.colors[l] + ";");
  (l = r.bgcolor || q.defaultbgcolor) && "undefined" !== typeof h.colors[l] && (t += "background-color:" + h.colors[l] + ";");
  (l = r.cellformat) && "undefined" !== typeof h.cellformats[l] ? t += "text-align:" + h.cellformats[l] + ";" : (g = r.valuetype.charAt(0), "t" == g ? (l = q.defaulttextformat) && "undefined" !== typeof h.cellformats[l] && (t += "text-align:" + h.cellformats[l] + ";") : "n" == g ? t = (l = q.defaultnontextformat) && "undefined" !== typeof h.cellformats[l] ? t + ("text-align:" + h.cellformats[l] + ";") : t + "text-align:right;" : t += "text-align:left;");
  if (1 < r.colspan || 1 < r.rowspan) {
    s = h.cells[SocialCalc.crToCoord(c + (r.colspan || 1) - 1, b + (r.rowspan || 1) - 1)];
  }
  (l = r.bt) && "undefined" !== typeof h.borderstyles[l] && (t += "border-top:" + h.borderstyles[l] + ";");
  (l = "undefined" != typeof s ? s.br : r.br) && "undefined" !== typeof h.borderstyles[l] ? t += "border-right:" + h.borderstyles[l] + ";" : a.showGrid && (g = a.CellInPane(b, c + (r.colspan || 1), d, e) ? SocialCalc.crToCoord(c + (r.colspan || 1), b) : "nomatch", a.cellskip[g] && (g = a.cellskip[g]), h.cells[g] && h.cells[g].bl || (t += "border-right:" + a.gridCSS));
  (l = "undefined" != typeof s ? s.bb : r.bb) && "undefined" !== typeof h.borderstyles[l] ? t += "border-bottom:" + h.borderstyles[l] + ";" : a.showGrid && (g = a.CellInPane(b + (r.rowspan || 1), c, d, e) ? SocialCalc.crToCoord(c, b + (r.rowspan || 1)) : "nomatch", a.cellskip[g] && (g = a.cellskip[g]), h.cells[g] && h.cells[g].bt || (t += "border-bottom:" + a.gridCSS));
  (l = r.bl) && "undefined" !== typeof h.borderstyles[l] && (t += "border-left:" + h.borderstyles[l] + ";");
  r.comment && (n.title = r.comment, a.showGrid ? (a.commentClassName && (n.className = (n.className ? n.className + " " : "") + a.commentClassName), t += a.commentCSS) : (a.commentNoGridClassName && (n.className = (n.className ? n.className + " " : "") + a.commentNoGridClassName), t += a.commentNoGridCSS));
  r.readonly && (r.comment || (n.title = a.readonlyComment), a.showGrid ? (a.readonlyClassName && (n.className = (n.className ? n.className + " " : "") + a.readonlyClassName), t += a.readonlyCSS) : (a.readonlyNoGridClassName && (n.className = (n.className ? n.className + " " : "") + a.readonlyNoGridClassName), t += a.readonlyNoGridCSS));
  n.style.cssText = t;
  void 0 !== r.cssc && (f ? n.className = (n.className ? n.className + " " : "") + r.cssc : n.classList.add(r.cssc));
  if (g = a.highlights[u]) {
    "cursor" == g && (g += a.cursorsuffix), a.highlightTypes[g].className && (n.className = (n.className ? n.className + " " : "") + a.highlightTypes[g].className), SocialCalc.setStyles(n, a.highlightTypes[g].style);
  }
  "yes" == h.colattribs.hide[SocialCalc.rcColname(c)] && (n.style.cssText += ";display:none");
  "yes" == h.rowattribs.hide[b] && (n.style.cssText += ";display:none");
  return n;
};
SocialCalc.CoordInPane = function(a, b, c, d) {
  var e = a.coordToCR[b];
  if (!e || !e.row || !e.col) {
    throw "Bad coordToCR for " + b;
  }
  return a.CellInPane(e.row, e.col, c, d);
};
SocialCalc.CellInPane = function(a, b, c, d, e) {
  var f = a.rowpanes[d];
  a = a.colpanes[e];
  if (!f || !a) {
    throw "CellInPane called with unknown panes " + d + "/" + e;
  }
  return b < f.first || b > f.last || c < a.first || c > a.last ? !1 : !0;
};
SocialCalc.CreatePseudoElement = function() {
  return{style:{cssText:""}, innerHTML:"", className:""};
};
SocialCalc.rcColname = function(a) {
  702 < a && (a = 702);
  1 > a && (a = 1);
  var b = (a - 1) % 26 + 65;
  return(a = Math.floor((a - 1) / 26)) ? String.fromCharCode(a + 64) + String.fromCharCode(b) : String.fromCharCode(b);
};
SocialCalc.letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
SocialCalc.crToCoord = function(a, b) {
  1 > a && (a = 1);
  702 < a && (a = 702);
  1 > b && (b = 1);
  var c = (a - 1) % 26, d = Math.floor((a - 1) / 26);
  return d ? SocialCalc.letters[d - 1] + SocialCalc.letters[c] + b : SocialCalc.letters[c] + b;
};
SocialCalc.coordToCol = {};
SocialCalc.coordToRow = {};
SocialCalc.coordToCr = function(a) {
  var b, c, d, e = SocialCalc.coordToRow[a];
  if (e) {
    return{row:e, col:SocialCalc.coordToCol[a]};
  }
  for (c = e = b = 0;c < a.length;c++) {
    d = a.charCodeAt(c), 36 != d && (57 >= d ? e = 10 * e + d - 48 : 97 <= d ? b = 26 * b + d - 96 : 65 <= d && (b = 26 * b + d - 64));
  }
  SocialCalc.coordToCol[a] = b;
  SocialCalc.coordToRow[a] = e;
  return{row:e, col:b};
};
SocialCalc.ParseRange = function(a) {
  var b, c, d;
  a || (a = "A1:A1");
  a = a.toUpperCase();
  b = a.indexOf(":");
  0 <= b ? (c = a.substring(0, b), d = SocialCalc.coordToCr(c), d.coord = c, c = a.substring(b + 1), b = SocialCalc.coordToCr(c), b.coord = c) : (d = SocialCalc.coordToCr(a), d.coord = a, b = SocialCalc.coordToCr(a), b.coord = a);
  return{cr1:d, cr2:b};
};
SocialCalc.decodeFromSave = function(a) {
  if ("string" != typeof a || -1 == a.indexOf("\\")) {
    return a;
  }
  a = a.replace(/\\c/g, ":");
  a = a.replace(/\\n/g, "\n");
  return a.replace(/\\b/g, "\\");
};
SocialCalc.decodeFromAjax = function(a) {
  if ("string" != typeof a || -1 == a.indexOf("\\")) {
    return a;
  }
  a = a.replace(/\\c/g, ":");
  a = a.replace(/\\n/g, "\n");
  a = a.replace(/\\e/g, "]]");
  return a.replace(/\\b/g, "\\");
};
SocialCalc.encodeForSave = function(a) {
  if ("string" != typeof a) {
    return a;
  }
  -1 != a.indexOf("\\") && (a = a.replace(/\\/g, "\\b"));
  -1 != a.indexOf(":") && (a = a.replace(/:/g, "\\c"));
  -1 != a.indexOf("\n") && (a = a.replace(/\n/g, "\\n"));
  return a;
};
SocialCalc.special_chars = function(a) {
  /[&<>"]/.test(a) && (a = a.replace(/&/g, "&amp;"), a = a.replace(/</g, "&lt;"), a = a.replace(/>/g, "&gt;"), a = a.replace(/"/g, "&quot;"));
  return a;
};
SocialCalc.Lookup = function(a, b) {
  for (i = 0;i < b.length;i++) {
    if (b[i] > a) {
      return 0 < i ? i - 1 : null;
    }
  }
  return b.length - 1;
};
SocialCalc.setStyles = function(a, b) {
  var c, d, e, f;
  if (b) {
    for (c = b.split(";"), d = 0;d < c.length;d++) {
      e = c[d].indexOf(":"), -1 != e && (f = c[d].substring(0, e), e = c[d].substring(e + 1), f && e && (a.style[f] = e));
    }
  }
};
SocialCalc.GetViewportInfo = function() {
  var a = {};
  window.innerWidth ? (a.width = window.innerWidth, a.height = window.innerHeight, a.horizontalScroll = window.pageXOffset, a.verticalScroll = window.pageYOffset) : document.documentElement && document.documentElement.clientWidth ? (a.width = document.documentElement.clientWidth, a.height = document.documentElement.clientHeight, a.horizontalScroll = document.documentElement.scrollLeft, a.verticalScroll = document.documentElement.scrollTop) : document.body.clientWidth && (a.width = document.body.clientWidth, 
  a.height = document.body.clientHeight, a.horizontalScroll = document.body.scrollLeft, a.verticalScroll = document.body.scrollTop);
  return a;
};
SocialCalc.GetElementPosition = function(a) {
  for (var b = 0, c = 0;a && "relative" != SocialCalc.GetComputedStyle(a, "position");) {
    b += a.offsetLeft, c += a.offsetTop, a = a.offsetParent;
  }
  return{left:b, top:c};
};
SocialCalc.GetElementPositionWithScroll = function(a) {
  a = a.getBoundingClientRect();
  return{left:a.left, right:a.right, top:a.top, bottom:a.bottom, width:a.width ? a.width : a.right - a.left, height:a.height ? a.height : a.bottom - a.top};
};
SocialCalc.GetElementFixedParent = function(a) {
  for (;a && "HTML" != a.tagName;) {
    if ("fixed" == SocialCalc.GetComputedStyle(a, "position")) {
      return a;
    }
    a = a.parentNode;
  }
  return!1;
};
SocialCalc.GetComputedStyle = function(a, b) {
  return("undefined" != typeof a.currentStyle ? a.currentStyle : document.defaultView.getComputedStyle(a, null))[b];
};
SocialCalc.LookupElement = function(a, b) {
  var c;
  for (c = 0;c < b.length;c++) {
    if (b[c].element == a) {
      return b[c];
    }
  }
  return null;
};
SocialCalc.AssignID = function(a, b, c) {
  a.idPrefix && (b.id = a.idPrefix + c);
};
SocialCalc.GetCellContents = function(a, b) {
  var c = "", d = a.cells[b];
  if (d) {
    switch(d.datatype) {
      case "v":
        c = d.datavalue + "";
        break;
      case "t":
        c = "'" + d.datavalue;
        break;
      case "f":
        c = "=" + d.formula;
        break;
      case "c":
        c = d.formula;
    }
  }
  return c;
};
SocialCalc.FormatValueForDisplay = function(a, b, c, d) {
  var e, f, g, h, l = a.attribs, n = a.cells[c];
  n || (n = new SocialCalc.Cell(c));
  h = b;
  f = n.valuetype || "";
  g = f.substring(1);
  valueinputwidget = f.charAt(1);
  var p = f.substring(2);
  e = b = null;
  f = f.charAt(0);
  if (n.errors || "e" == f) {
    return h = n.errors || g || "Error in cell";
  }
  if ("t" == f) {
    e = a.valueformats[n.textvalueformat - 0] || a.valueformats[l.defaulttextvalueformat - 0] || "";
    if ("formula" == e) {
      return h = "f" == n.datatype ? SocialCalc.special_chars("=" + n.formula) || "&nbsp;" : "c" == n.datatype ? SocialCalc.special_chars("'" + n.formula) || "&nbsp;" : SocialCalc.special_chars("'" + h) || "&nbsp;";
    }
    b = h;
    e = h = SocialCalc.format_text_for_display(h, n.valuetype, e, a, d, n.nontextvalueformat);
  } else {
    if ("n" == f) {
      e = n.nontextvalueformat;
      if (null == e || "" == e) {
        e = l.defaultnontextvalueformat;
      }
      e = a.valueformats[e - 0];
      if (null == e || "none" == e) {
        e = "";
      }
      if ("formula" == e) {
        return h = "f" == n.datatype ? SocialCalc.special_chars("=" + n.formula) || "&nbsp;" : "c" == n.datatype ? SocialCalc.special_chars("'" + n.formula) || "&nbsp;" : SocialCalc.special_chars("'" + h) || "&nbsp;";
      }
      if ("forcetext" == e) {
        return h = "f" == n.datatype ? SocialCalc.special_chars("=" + n.formula) || "&nbsp;" : "c" == n.datatype ? SocialCalc.special_chars(n.formula) || "&nbsp;" : SocialCalc.special_chars(h) || "&nbsp;";
      }
      b = h;
      e = h = SocialCalc.format_number_for_display(h, n.valuetype, e);
    } else {
      h = "&nbsp;";
    }
  }
  return "i" == valueinputwidget && null != b && null != e ? (a = SocialCalc.Formula.FunctionList[p]) ? (a = a[5], a = a.replace(/<%=checked%>/g, 0 == b ? "" : "checked"), a = a.replace(/<%=formated_value%>/g, e), a = a.replace(/<%=display_value%>/g, b), a.replace(/<%=cell_reference%>/g, c)) : "error:Widget HTML missing" : h;
};
SocialCalc.format_text_for_display = function(a, b, c, d, e, f) {
  var g, h, l;
  g = b.substring(1);
  l = a;
  if ("none" == c || null == c) {
    c = "";
  }
  /^(text-|custom|hidden)/.test(c) || (c = "");
  if ("" == c || "General" == c) {
    "h" == g && (c = "text-html");
    if ("w" == g || "r" == g) {
      c = "text-wiki";
    }
    "l" == g && (c = "text-link");
    g || (c = "text-plain");
  }
  "text-html" != c && (SocialCalc.Callbacks.expand_wiki && /^text-wiki/.test(c) ? l = SocialCalc.Callbacks.expand_wiki(l, d, e, c) : "text-wiki" == c ? l = SocialCalc.Callbacks.expand_markup && SocialCalc.Callbacks.expand_markup(l, d, e) || SocialCalc.special_chars("wiki-text:" + l) : "text-url" == c ? (a = SocialCalc.special_chars(l), b = encodeURI(l), l = '<a href="' + b + '">' + a + "</a>") : "text-link" == c ? l = SocialCalc.expand_text_link(l, d, e, c) : "text-image" == c ? (b = encodeURI(l), 
  l = '<img src="' + b + '">') : "text-custom:" == c.substring(0, 12) ? (a = SocialCalc.special_chars(l), a = a.replace(/  /g, "&nbsp; "), a = a.replace(/\n/g, "<br>"), b = encodeURI(l), h = {}, h.r = l, h.s = a, h.u = b, l = c.substring(12), l = l.replace(/@(r|s|u)/g, function(a, c) {
    return h[c];
  })) : "custom" == c.substring(0, 6) ? (l = SocialCalc.special_chars(l), l = l.replace(/  /g, "&nbsp; "), l = l.replace(/\n/g, "<br>"), l += " (custom format)") : "hidden" == c ? l = "&nbsp;" : null != f && "" != f && "none" != d.valueformats[f - 0] && "" != d.valueformats[f - 0] ? (c = d.valueformats[f], l = SocialCalc.format_number_for_display(a, b, c)) : (l = SocialCalc.special_chars(l), l = l.replace(/  /g, "&nbsp; "), l = l.replace(/\n/g, "<br>")));
  return l;
};
SocialCalc.format_number_for_display = function(a, b, c) {
  var d, e = SocialCalc.Constants;
  d = a - 0;
  b = b.substring(1);
  if ("Auto" == c || "" == c) {
    c = "%" == b ? e.defaultFormatp : "$" == b ? e.defaultFormatc : "dt" == b ? e.defaultFormatdt : "d" == b ? e.defaultFormatd : "t" == b ? e.defaultFormatt : "l" == b ? "logical" : "General";
  }
  return "logical" == c ? d ? e.defaultDisplayTRUE : e.defaultDisplayFALSE : "hidden" == c ? "&nbsp;" : SocialCalc.FormatNumber.formatNumberWithFormat(a, c, "");
};
SocialCalc.DetermineValueType = function(a) {
  var b = a + "", c = "t", d, e, f;
  d = b.replace(/^\s+/, "");
  d = d.replace(/\s+$/, "");
  0 == b.length ? c = "" : b.match(/^\s+$/) || (d.match(/^[-+]?\d*(?:\.)?\d*(?:[eE][-+]?\d+)?$/) ? (b = d - 0, isNaN(b) ? b = a + "" : c = "n") : d.match(/^[-+]?\d*(?:\.)?\d*\s*%$/) ? (b = (d.slice(0, -1) - 0) / 100, c = "n%") : d.match(/^[-+]?\$\s*\d*(?:\.)?\d*\s*$/) && d.match(/\d/) ? (b = d.replace(/\$/, "") - 0, c = "n$") : d.match(/^[-+]?(\d*,\d*)+(?:\.)?\d*$/) ? (b = d.replace(/,/g, "") - 0, c = "n") : d.match(/^[-+]?(\d*,\d*)+(?:\.)?\d*\s*%$/) ? (b = (d.replace(/[%,]/g, "") - 0) / 100, c = 
  "n%") : d.match(/^[-+]?\$\s*(\d*,\d*)+(?:\.)?\d*$/) && d.match(/\d/) ? (b = d.replace(/[\$,]/g, "") - 0, c = "n$") : (a = b.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{1,4})\s*$/)) ? (b = a[3] - 0, b = 1E3 > b ? b + 2E3 : b, b = 0 === navigator.language.indexOf("fr") ? SocialCalc.FormatNumber.convert_date_gregorian_to_julian(b, a[2] - 0, a[1] - 0) - 2415019 : SocialCalc.FormatNumber.convert_date_gregorian_to_julian(b, a[1] - 0, a[2] - 0) - 2415019, c = "nd") : (a = b.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s*$/)) ? 
  (b = a[1] - 0, b = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(1E3 > b ? b + 2E3 : b, a[2] - 0, a[3] - 0) - 2415019, c = "nd") : (a = b.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2}) (\d{1,2}):(\d{1,2})\s*$/)) ? (b = a[1] - 0, b = 1E3 > b ? b + 2E3 : b, d = a[4] - 0, e = a[5] - 0, b = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(b, a[2] - 0, a[3] - 0) - 2415019, c = "nd", 24 > d && 60 > e && (b += d / 24 + e / 1440, c = "ndt")) : (a = b.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})\s*$/)) ? 
  (b = a[1] - 0, b = 1E3 > b ? b + 2E3 : b, d = a[4] - 0, e = a[5] - 0, f = a[6] - 0, b = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(b, a[2] - 0, a[3] - 0) - 2415019, c = "nd", 24 > d && 60 > e && 60 > f && (b += d / 24 + e / 1440 + f / 86400, c = "ndt")) : (a = b.match(/^(\d{1,2}):(\d{1,2})\s*$/)) ? (d = a[1] - 0, e = a[2] - 0, 24 > d && 60 > e && (b = d / 24 + e / 1440, c = "nt")) : (a = b.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s*$/)) ? (d = a[1] - 0, e = a[2] - 0, f = a[3] - 0, 24 > 
  d && 60 > e && 60 > f && (b = d / 24 + e / 1440 + f / 86400, c = "nt")) : (a = b.match(/^\s*([-+]?\d+) (\d+)\/(\d+)\s*$/)) ? (e = a[1] - 0, d = a[2] - 0, (a = a[3] - 0) && 0 < a && (b = e + (0 > e ? -d / a : d / a), c = "n")) : (a = SocialCalc.InputConstants[b.toUpperCase()]) ? (d = a.indexOf(","), b = a.substring(0, d) - 0, c = a.substring(d + 1)) : 7 < d.length && "http://" == d.substring(0, 7).toLowerCase() ? (b = d, c = "tl") : d.match(/<([A-Z][A-Z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/i) && (b = d, 
  c = "th"));
  return{value:b, type:c};
};
SocialCalc.InputConstants = {TRUE:"1,nl", FALSE:"0,nl", "#N/A":"0,e#N/A", "#NULL!":"0,e#NULL!", "#NUM!":"0,e#NUM!", "#DIV/0!":"0,e#DIV/0!", "#VALUE!":"0,e#VALUE!", "#REF!":"0,e#REF!", "#NAME?":"0,e#NAME?"};
SocialCalc.default_expand_markup = function(a, b, c) {
  a = SocialCalc.special_chars(a);
  a = a.replace(/  /g, "&nbsp; ");
  return a = a.replace(/\n/g, "<br>");
};
SocialCalc.expand_text_link = function(a, b, c, d) {
  var e;
  e = SocialCalc.Constants;
  b = "";
  var f = SocialCalc.ParseCellLinkText(a + "");
  e = f.desc ? SocialCalc.special_chars(f.desc) : f.pagename ? e.defaultPageLinkFormatString : e.defaultLinkFormatString;
  7 < a.length && "http://" == a.substring(0, 7).toLowerCase() && ">" != a.charAt(a.length - 1) && (e = e.substring(7));
  a = f.newwin || !c ? ' target="_blank"' : "";
  f.pagename ? SocialCalc.Callbacks.MakePageLink && (b = SocialCalc.Callbacks.MakePageLink(f.pagename, f.workspacename, c, d)) : b = encodeURI(f.url);
  return'<a href="' + b + '"' + a + ">" + e + "</a>";
};
SocialCalc.ParseCellLinkText = function(a) {
  var b = {url:"", desc:"", newwin:!1, pagename:"", workspace:""}, c = !1, d = a.length - 1, e = 0, f = a.lastIndexOf("<"), g = a.lastIndexOf("["), h = a.lastIndexOf("{"), l = -1;
  ">" == a.charAt(d) && -1 != f || "]" == a.charAt(d) && -1 != g || !("}" != a.charAt(d) || "]" != a.charAt(d - 1) || -1 == h || -1 == g || g < h) ? (">" == a.charAt(d) ? (l = f - 1, 0 < f && "<" == a.charAt(l) && ">" == a.charAt(d - 1) && (l--, d--, b.newwin = !0)) : "]" == a.charAt(d) ? (l = g - 1, c = !0, 0 < g && "[" == a.charAt(l) && "]" == a.charAt(d - 1) && (l--, d--, b.newwin = !0)) : "}" == a.charAt(d) && (l = h - 1, c = !0, wsend = g, d--, 0 < g && "[" == a.charAt(g - 1) && "]" == a.charAt(d - 
  1) && (wsend = g - 1, d--, b.newwin = !0), " " == a.charAt(wsend - 1) && wsend--, b.workspace = a.substring(h + 1, wsend) || ""), " " == a.charAt(l) && l--, '"' == a.charAt(e) && '"' == a.charAt(l) && (e++, l--)) : (d++, l = d);
  c ? b.pagename = a.substring(g + 1, d) || "" : b.url = a.substring(f + 1, d) || "";
  l >= e && (b.desc = a.substring(e, l + 1));
  return b;
};
SocialCalc.ConvertSaveToOtherFormat = function(a, b, c) {
  var d, e, f, g;
  e = "";
  if ("scsave" == b) {
    return a;
  }
  if ("" == a) {
    return "";
  }
  d = new SocialCalc.Sheet;
  d.ParseSheetSave(a);
  if (c) {
    throw "SocialCalc.ConvertSaveToOtherFormat: Not doing recalc.";
  }
  a = d.copiedfrom ? SocialCalc.ParseRange(d.copiedfrom) : {cr1:{row:1, col:1}, cr2:{row:d.attribs.lastrow, col:d.attribs.lastcol}};
  if ("html" == b) {
    return e = new SocialCalc.RenderContext(d), d.copiedfrom && (e.rowpanes[0] = {first:a.cr1.row, last:a.cr2.row}, e.colpanes[0] = {first:a.cr1.col, last:a.cr2.col}), b = document.createElement("div"), a = e.RenderSheet(null, e.defaultHTMLlinkstyle), b.appendChild(a), delete e, delete d, e = b.innerHTML, delete a, delete b, e;
  }
  for (c = a.cr1.row;c <= a.cr2.row;c++) {
    for (f = a.cr1.col;f <= a.cr2.col;f++) {
      g = SocialCalc.crToCoord(f, c), g = d.GetAssuredCell(g), g = g.errors ? g.errors : g.datavalue + "", "csv" == b ? (-1 != g.indexOf('"') && (g = g.replace(/"/g, '""')), /[, \n"]/.test(g) && (g = '"' + g + '"'), f > a.cr1.col && (g = "," + g)) : "tab" == b && (-1 != g.indexOf("\n") && (-1 != g.indexOf('"') && (g = g.replace(/"/g, '""')), g = '"' + g + '"'), f > a.cr1.col && (g = "\t" + g)), e += g;
    }
    e += "\n";
  }
  return e;
};
SocialCalc.ConvertOtherFormatToSave = function(a, b) {
  var c, d, e, f, g, h, l, n, p, r, s, q, t = "", u = function() {
    r++;
    r > q && (q = r);
    s = SocialCalc.crToCoord(r, p);
    SocialCalc.SetConvertedCell(c, s, g);
    g = "";
  };
  if ("scsave" == b) {
    return a;
  }
  c = new SocialCalc.Sheet;
  d = a.split(/\r\n|\n/);
  q = 0;
  if ("csv" == b) {
    p = 0;
    h = !1;
    for (e = 0;e < d.length && (e != d.length - 1 || "" != d[e]);e++) {
      for (h ? g += "\n" : (g = "", p++, r = 0), f = d[e], l = 0;l < f.length;l++) {
        n = f.charAt(l), '"' == n ? h ? l < f.length - 1 && '"' == f.charAt(l + 1) ? (l++, g += '"') : (h = !1, l == f.length - 1 && u()) : h = !0 : ("," != n || h ? g += n : u(), l != f.length - 1 || h || u());
      }
    }
    0 < q && (c.attribs.lastrow = p, c.attribs.lastcol = q, t = c.CreateSheetSave("A1:" + SocialCalc.crToCoord(q, p)));
  }
  if ("tab" == b) {
    p = 0;
    h = !1;
    for (e = 0;e < d.length && (e != d.length - 1 || "" != d[e]);e++) {
      for (h ? g += "\n" : (g = "", p++, r = 0), f = d[e], l = 0;l < f.length;l++) {
        n = f.charAt(l);
        if ('"' == n) {
          if (h) {
            l < f.length - 1 ? '"' == f.charAt(l + 1) ? (l++, g += '"') : "\t" == f.charAt(l + 1) && (l++, h = !1, u()) : (h = !1, u());
            continue;
          }
          if ("" == g) {
            h = !0;
            continue;
          }
        }
        "\t" != n || h ? g += n : u();
        l != f.length - 1 || h || u();
      }
    }
    0 < q && (c.attribs.lastrow = p, c.attribs.lastcol = q, t = c.CreateSheetSave("A1:" + SocialCalc.crToCoord(q, p)));
  }
  return t;
};
SocialCalc.SetConvertedCell = function(a, b, c) {
  a = a.GetAssuredCell(b);
  b = SocialCalc.DetermineValueType(c);
  "n" == b.type && b.value == c ? (a.datatype = "v", a.valuetype = "n", a.datavalue = b.value) : "t" == b.type.charAt(0) ? (a.datatype = "t", a.valuetype = b.type, a.datavalue = b.value) : (a.datatype = "c", a.valuetype = b.type, a.datavalue = b.value, a.formula = c);
};
SocialCalc || (SocialCalc = {});
SocialCalc.TableEditor = function(a) {
  var b = SocialCalc.Constants;
  this.context = a;
  this.fullgrid = this.toplevel = null;
  this.noEdit = !1;
  this.timeout = this.cellhandles = this.logo = this.horizontaltablecontrol = this.verticaltablecontrol = this.inputEcho = this.inputBox = this.tableheight = this.height = this.tablewidth = this.width = null;
  this.ensureecell = this.busy = !1;
  this.deferredCommands = [];
  this.deferredEmailCommands = [];
  this.lastvisiblecol = this.lastnonscrollingcol = this.firstscrollingcolleft = this.firstscrollingcol = this.lastvisiblerow = this.lastnonscrollingrow = this.firstscrollingrowtop = this.firstscrollingrow = this.headposition = this.gridposition = null;
  this.rowpositions = [];
  this.colpositions = [];
  this.rowheight = [];
  this.colwidth = [];
  this.ecell = null;
  this.state = "start";
  this.workingvalues = {};
  this.imageprefix = b.defaultImagePrefix;
  this.idPrefix = b.defaultTableEditorIDPrefix;
  this.pageUpDnAmount = b.defaultPageUpDnAmount;
  this.recalcFunction = function(a) {
    if (a.context.sheetobj.RecalcSheet) {
      a.context.sheetobj.RecalcSheet(SocialCalc.EditorSheetStatusCallback, a);
    } else {
      return null;
    }
  };
  this.ctrlkeyFunction = function(a, b) {
    var e, f, g, h;
    switch(b) {
      case "[ctrl-c]":
      ;
      case "[ctrl-x]":
        e = a.pasteTextarea;
        e.value = "";
        if (f = SocialCalc.GetEditorCellElement(a, a.ecell.row, a.ecell.col)) {
          f = SocialCalc.GetElementPosition(f.element), e.style.left = f.left - 1 + "px", e.style.top = f.top - 1 + "px";
        }
        h = a.range.hasrange ? SocialCalc.crToCoord(a.range.left, a.range.top) + ":" + SocialCalc.crToCoord(a.range.right, a.range.bottom) : a.ecell.coord;
        f = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.CreateSheetSave(a.context.sheetobj, h), "tab");
        g = "[ctrl-c]" == b || a.noEdit || a.ECellReadonly() ? "copy " + h + " formulas" : "cut " + h + " formulas";
        a.EditorScheduleSheetCommands(g, !0, !1);
        e.style.display = "block";
        e.value = f;
        e.focus();
        e.select();
        window.setTimeout(function() {
          var b = a.pasteTextarea;
          b.blur();
          b.style.display = "none";
          SocialCalc.KeyboardFocus();
        }, 200);
        break;
      case "[ctrl-v]":
        if (a.noEdit || a.ECellReadonly()) {
          break;
        }
        e = a.pasteTextarea;
        e.value = "";
        if (f = SocialCalc.GetEditorCellElement(a, a.ecell.row, a.ecell.col)) {
          f = SocialCalc.GetElementPosition(f.element), e.style.left = f.left - 1 + "px", e.style.top = f.top - 1 + "px";
        }
        e.style.display = "block";
        e.value = "";
        e.focus();
        window.setTimeout(function() {
          var b = a.pasteTextarea, d = b.value;
          b.blur();
          b.style.display = "none";
          var b = "", e = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "tab"), d = d.replace(/\r\n/g, "\n");
          d == e || 1 == d.length - e.length && d.substring(0, d.length - 1) == e || (b = "loadclipboard " + SocialCalc.encodeForSave(SocialCalc.ConvertOtherFormatToSave(d, "tab")) + "\n");
          a.range.hasrange ? (d = new SocialCalc.Sheet, d.ParseSheetSave(SocialCalc.Clipboard.clipboard), d = d.copiedfrom.match(/(.+):(.+)/), d = null !== d && d[1] === d[2] ? SocialCalc.crToCoord(a.range.left, a.range.top) + ":" + SocialCalc.crToCoord(a.range.right, a.range.bottom) : SocialCalc.crToCoord(a.range.left, a.range.top)) : d = a.ecell.coord;
          a.EditorScheduleSheetCommands(b + ("paste " + d + " formulas"), !0, !1);
          SocialCalc.KeyboardFocus();
        }, 200);
        break;
      case "[ctrl-z]":
        return a.EditorScheduleSheetCommands("undo", !0, !1), !1;
      case "[ctrl-s]":
        if (!SocialCalc.Constants.AllowCtrlS) {
          break;
        }
        window.setTimeout(function() {
          var b = a.context.sheetobj, d = b.GetAssuredCell(a.ecell.coord), b = window.prompt("Advanced Feature:\n\nCustom Numeric Format or Command", d.nontextvalueformat ? b.valueformats[d.nontextvalueformat - 0] || "" : "");
          if (null != b) {
            if (b.match(/^cmd:/)) {
              g = b.substring(4);
            } else {
              if (b.match(/^edit:/)) {
                g = b.substring(5);
                SocialCalc.CtrlSEditor && SocialCalc.CtrlSEditor(g);
                return;
              }
              h = a.range.hasrange ? SocialCalc.crToCoord(a.range.left, a.range.top) + ":" + SocialCalc.crToCoord(a.range.right, a.range.bottom) : a.ecell.coord;
              g = "set " + h + " nontextvalueformat " + b;
            }
            a.EditorScheduleSheetCommands(g, !0, !1);
          }
        }, 200);
        return!1;
    }
    return!0;
  };
  a.sheetobj.statuscallback = SocialCalc.EditorSheetStatusCallback;
  a.sheetobj.statuscallbackparams = this;
  this.StatusCallback = {};
  this.MoveECellCallback = {};
  this.RangeChangeCallback = {};
  this.SettingsCallbacks = {};
  this.ecell = {coord:"A1", row:1, col:1};
  a.highlights[this.ecell.coord] = "cursor";
  this.range = {hasrange:!1};
  this.range2 = {hasrange:!1};
};
SocialCalc.TableEditor.prototype.CreateTableEditor = function(a, b) {
  return SocialCalc.CreateTableEditor(this, a, b);
};
SocialCalc.TableEditor.prototype.ResizeTableEditor = function(a, b) {
  return SocialCalc.ResizeTableEditor(this, a, b);
};
SocialCalc.TableEditor.prototype.SaveEditorSettings = function() {
  return SocialCalc.SaveEditorSettings(this);
};
SocialCalc.TableEditor.prototype.LoadEditorSettings = function(a, b) {
  return SocialCalc.LoadEditorSettings(this, a, b);
};
SocialCalc.TableEditor.prototype.EditorRenderSheet = function() {
  SocialCalc.EditorRenderSheet(this);
};
SocialCalc.TableEditor.prototype.EditorScheduleSheetCommands = function(a, b, c) {
  SocialCalc.EditorScheduleSheetCommands(this, a, b, c);
};
SocialCalc.TableEditor.prototype.ScheduleSheetCommands = function(a, b) {
  this.context.sheetobj.ScheduleSheetCommands(a, b);
};
SocialCalc.TableEditor.prototype.SheetUndo = function() {
  this.context.sheetobj.SheetUndo();
};
SocialCalc.TableEditor.prototype.SheetRedo = function() {
  this.context.sheetobj.SheetRedo();
};
SocialCalc.TableEditor.prototype.EditorStepSet = function(a, b) {
  SocialCalc.EditorStepSet(this, a, b);
};
SocialCalc.TableEditor.prototype.GetStatuslineString = function(a, b, c) {
  return SocialCalc.EditorGetStatuslineString(this, a, b, c);
};
SocialCalc.TableEditor.prototype.EditorMouseRegister = function() {
  return SocialCalc.EditorMouseRegister(this);
};
SocialCalc.TableEditor.prototype.EditorMouseUnregister = function() {
  return SocialCalc.EditorMouseUnregister(this);
};
SocialCalc.TableEditor.prototype.EditorMouseRange = function(a) {
  return SocialCalc.EditorMouseRange(this, a);
};
SocialCalc.TableEditor.prototype.EditorProcessKey = function(a, b) {
  return SocialCalc.EditorProcessKey(this, a, b);
};
SocialCalc.TableEditor.prototype.EditorAddToInput = function(a, b) {
  return SocialCalc.EditorAddToInput(this, a, b);
};
SocialCalc.TableEditor.prototype.DisplayCellContents = function() {
  return SocialCalc.EditorDisplayCellContents(this);
};
SocialCalc.TableEditor.prototype.EditorSaveEdit = function(a) {
  return SocialCalc.EditorSaveEdit(this, a);
};
SocialCalc.TableEditor.prototype.EditorApplySetCommandsToRange = function(a, b) {
  return SocialCalc.EditorApplySetCommandsToRange(this, a, b);
};
SocialCalc.TableEditor.prototype.MoveECellWithKey = function(a) {
  return SocialCalc.MoveECellWithKey(this, a);
};
SocialCalc.TableEditor.prototype.MoveECell = function(a) {
  return SocialCalc._app ? "A1" : SocialCalc.MoveECell(this, a);
};
SocialCalc.TableEditor.prototype.ReplaceCell = function(a, b, c) {
  SocialCalc.ReplaceCell(this, a, b, c);
};
SocialCalc.TableEditor.prototype.UpdateCellCSS = function(a, b, c) {
  SocialCalc.UpdateCellCSS(this, a, b, c);
};
SocialCalc.TableEditor.prototype.SetECellHeaders = function(a) {
  SocialCalc.SetECellHeaders(this, a);
};
SocialCalc.TableEditor.prototype.EnsureECellVisible = function() {
  SocialCalc.EnsureECellVisible(this);
};
SocialCalc.TableEditor.prototype.ECellReadonly = function(a) {
  return SocialCalc.ECellReadonly(this, a);
};
SocialCalc.TableEditor.prototype.RangeAnchor = function(a) {
  SocialCalc.RangeAnchor(this, a);
};
SocialCalc.TableEditor.prototype.RangeExtend = function(a) {
  SocialCalc.RangeExtend(this, a);
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
SocialCalc.TableEditor.prototype.CalculateRowPositions = function(a, b, c) {
  return SocialCalc.CalculateRowPositions(this, a, b, c);
};
SocialCalc.TableEditor.prototype.CalculateColPositions = function(a, b, c) {
  return SocialCalc.CalculateColPositions(this, a, b, c);
};
SocialCalc.TableEditor.prototype.ScrollRelative = function(a, b) {
  SocialCalc.ScrollRelative(this, a, b);
};
SocialCalc.TableEditor.prototype.ScrollRelativeBoth = function(a, b) {
  SocialCalc.ScrollRelativeBoth(this, a, b);
};
SocialCalc.TableEditor.prototype.PageRelative = function(a, b) {
  SocialCalc.PageRelative(this, a, b);
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
SocialCalc.TableEditor.prototype.StopPropagation = function() {
  return SocialCalc.StopPropagation(this);
};
SocialCalc.TableEditor.prototype.SetMouseMoveUp = function() {
  return SocialCalc.SetMouseMoveUp(this);
};
SocialCalc.TableEditor.prototype.RemoveMouseMoveUp = function() {
  return SocialCalc.RemoveMouseMoveUp(this);
};
SocialCalc.CreateTableEditor = function(a, b, c) {
  var d = SocialCalc.Constants, e = SocialCalc.AssignID;
  a.toplevel = document.createElement("div");
  a.toplevel.style.position = "relative";
  e(a, a.toplevel, "toplevel");
  a.width = b;
  a.height = c;
  a.griddiv = document.createElement("div");
  a.tablewidth = Math.max(0, b - d.defaultTableControlThickness);
  a.tableheight = Math.max(0, c - d.defaultTableControlThickness);
  a.griddiv.style.width = a.tablewidth + "px";
  a.griddiv.style.height = a.tableheight + "px";
  a.griddiv.style.overflow = "hidden";
  a.griddiv.style.cursor = "default";
  d.cteGriddivClass && (a.griddiv.className = d.cteGriddivClass);
  e(a, a.griddiv, "griddiv");
  a.FitToEditTable();
  a.EditorRenderSheet();
  a.griddiv.appendChild(a.fullgrid);
  a.verticaltablecontrol = new SocialCalc.TableControl(a, !0, a.tableheight);
  a.verticaltablecontrol.CreateTableControl();
  e(a, a.verticaltablecontrol.main, "tablecontrolv");
  a.horizontaltablecontrol = new SocialCalc.TableControl(a, !1, a.tablewidth);
  a.horizontaltablecontrol.CreateTableControl();
  e(a, a.horizontaltablecontrol.main, "tablecontrolh");
  c = document.createElement("table");
  a.layouttable = c;
  c.cellSpacing = 0;
  c.cellPadding = 0;
  e(a, c, "layouttable");
  b = document.createElement("tbody");
  c.appendChild(b);
  c = document.createElement("tr");
  b.appendChild(c);
  d = document.createElement("td");
  d.appendChild(a.griddiv);
  c.appendChild(d);
  d = document.createElement("td");
  d.appendChild(a.verticaltablecontrol.main);
  c.appendChild(d);
  c = document.createElement("tr");
  b.appendChild(c);
  d = document.createElement("td");
  d.appendChild(a.horizontaltablecontrol.main);
  c.appendChild(d);
  d = document.createElement("td");
  d.style.background = "url(" + a.imageprefix + "logo.gif) no-repeat center center";
  d.innerHTML = "<div style='cursor:pointer;font-size:1px;'><img src='" + a.imageprefix + "1x1.gif' border='0' width='18' height='18'></div>";
  c.appendChild(d);
  a.logo = d;
  e(a, a.logo, "logo");
  SocialCalc.TooltipRegister(d.firstChild.firstChild, "SocialCalc", null, a.toplevel);
  a.toplevel.appendChild(a.layouttable);
  a.noEdit || (a.inputEcho = new SocialCalc.InputEcho(a), e(a, a.inputEcho.main, "inputecho"));
  a.cellhandles = new SocialCalc.CellHandles(a);
  b = document.createElement("textarea");
  SocialCalc.setStyles(b, "display:none;position:absolute;height:1px;width:1px;opacity:0;filter:alpha(opacity=0);");
  b.value = "";
  a.pasteTextarea = b;
  e(a, a.pasteTextarea, "pastetextarea");
  navigator.userAgent.match(/Safari\//) && !navigator.userAgent.match(/Chrome\//) && (window.removeEventListener("beforepaste", SocialCalc.SafariPasteFunction, !1), window.addEventListener("beforepaste", SocialCalc.SafariPasteFunction, !1), window.removeEventListener("beforecopy", SocialCalc.SafariPasteFunction, !1), window.addEventListener("beforecopy", SocialCalc.SafariPasteFunction, !1), window.removeEventListener("beforecut", SocialCalc.SafariPasteFunction, !1), window.addEventListener("beforecut", 
  SocialCalc.SafariPasteFunction, !1));
  a.toplevel.appendChild(a.pasteTextarea);
  SocialCalc.MouseWheelRegister(a.toplevel, {WheelMove:SocialCalc.EditorProcessMouseWheel, editor:a});
  SocialCalc.KeyboardSetFocus(a);
  SocialCalc.EditorSheetStatusCallback(null, "startup", null, a);
  return a.toplevel;
};
SocialCalc.SafariPasteFunction = function(a) {
  a.preventDefault();
};
SocialCalc.ResizeTableEditor = function(a, b, c) {
  var d = SocialCalc.Constants;
  a.width = b;
  a.height = c;
  a.toplevel.style.width = b + "px";
  a.toplevel.style.height = c + "px";
  a.tablewidth = Math.max(0, b - d.defaultTableControlThickness);
  a.tableheight = Math.max(0, c - d.defaultTableControlThickness);
  a.griddiv.style.width = a.tablewidth + "px";
  a.griddiv.style.height = a.tableheight + "px";
  a.verticaltablecontrol.main.style.height = a.tableheight + "px";
  a.horizontaltablecontrol.main.style.width = a.tablewidth + "px";
  a.FitToEditTable();
  SocialCalc._app && (a.context.sheetobj.widgetsRendered = !1);
  a.ScheduleRender();
};
SocialCalc.SaveEditorSettings = function(a) {
  var b, c, d = a.context, e = a.range, f;
  f = "version:1.0\n";
  for (b = 0;b < d.rowpanes.length;b++) {
    f += "rowpane:" + b + ":" + d.rowpanes[b].first + ":" + d.rowpanes[b].last + "\n";
  }
  for (b = 0;b < d.colpanes.length;b++) {
    f += "colpane:" + b + ":" + d.colpanes[b].first + ":" + d.colpanes[b].last + "\n";
  }
  a.ecell && (f += "ecell:" + a.ecell.coord + "\n");
  e.hasrange && (f += "range:" + e.anchorcoord + ":" + e.top + ":" + e.bottom + ":" + e.left + ":" + e.right + "\n");
  for (c in a.SettingsCallbacks) {
    f += a.SettingsCallbacks[c].save(a, c);
  }
  return f;
};
SocialCalc.LoadEditorSettings = function(a, b, c) {
  b = b.split(/\r\n|\n/);
  var d = [], e, f, g, h = a.context, l, n;
  h.rowpanes = [{first:1, last:1}];
  h.colpanes = [{first:1, last:1}];
  a.ecell = null;
  a.range = {hasrange:!1};
  a.range2 = {hasrange:!1};
  n = a.range;
  h.highlights = {};
  l = h.highlights;
  for (f = 0;f < b.length;f++) {
    switch(e = b[f], d = e.split(":"), g = d[0], g) {
      case "version":
        break;
      case "rowpane":
        h.rowpanes[d[1] - 0] = {first:d[2] - 0, last:d[3] - 0};
        break;
      case "colpane":
        h.colpanes[d[1] - 0] = {first:d[2] - 0, last:d[3] - 0};
        break;
      case "ecell":
        a.ecell = SocialCalc.coordToCr(d[1]);
        a.ecell.coord = d[1];
        l[d[1]] = "cursor";
        break;
      case "range":
        n.hasrange = !0;
        n.anchorcoord = d[1];
        e = SocialCalc.coordToCr(n.anchorcoord);
        n.anchorrow = e.row;
        n.anchorcol = e.col;
        n.top = d[2] - 0;
        n.bottom = d[3] - 0;
        n.left = d[4] - 0;
        n.right = d[5] - 0;
        for (d = n.top;d <= n.bottom;d++) {
          for (e = n.left;e <= n.right;e++) {
            g = SocialCalc.crToCoord(e, d), "cursor" != l[g] && (l[g] = "range");
          }
        }
        break;
      default:
        a.SettingsCallbacks[g] && a.SettingsCallbacks[g].load(a, g, e, c);
    }
  }
};
SocialCalc.EditorRenderSheet = function(a) {
  a.EditorMouseUnregister();
  var b = a.context.sheetobj;
  if (null != b.reRenderCellList && SocialCalc._app && b.widgetsRendered) {
    for (var c in b.reRenderCellList) {
      var d = b.reRenderCellList[c], e = b.cells[d].valuetype;
      if ("i" != e.charAt(1) || e != b.cells[d].prevvaluetype) {
        cr = SocialCalc.coordToCr(d), cell = SocialCalc.GetEditorCellElement(a, cr.row, cr.col), null != cell && a.ReplaceCell(cell, cr.row, cr.col);
      }
    }
    b.reRenderCellList = [];
  } else {
    a.fullgrid = a.context.RenderSheet(a.fullgrid), null != b.reRenderCellList && SocialCalc._app && (b.widgetsRendered = !0, b.reRenderCellList = []);
  }
  a.ecell && a.SetECellHeaders("selected");
  SocialCalc.AssignID(a, a.fullgrid, "fullgrid");
  SocialCalc._app || (a.fullgrid.className = "te_download");
  a.EditorMouseRegister();
};
SocialCalc.EditorScheduleSheetCommands = function(a, b, c, d) {
  if ("start" == a.state || d) {
    if (a.busy && !d) {
      a.deferredCommands.push({cmdstr:b, saveundo:c});
    } else {
      switch(d = b.split(" "), d[0]) {
        case "recalc":
        ;
        case "redisplay":
          a.context.sheetobj.ScheduleSheetCommands(b, !1);
          break;
        case "undo":
          a.SheetUndo();
          break;
        case "redo":
          a.SheetRedo();
          break;
        case "setemailparameters":
          SocialCalc.TriggerIoAction.Email(d[1], d[2]);
          break;
        default:
          a.context.sheetobj.ScheduleSheetCommands(b, c);
      }
    }
  }
};
SocialCalc.EditorSheetStatusCallback = function(a, b, c, d) {
  var e;
  a = d.context.sheetobj;
  var f = function(a) {
    for (e in d.StatusCallback) {
      d.StatusCallback[e].func && d.StatusCallback[e].func(d, a, c, d.StatusCallback[e].params);
    }
  };
  switch(b) {
    case "startup":
      break;
    case "cmdstart":
      d.busy = !0;
      a.celldisplayneeded = "";
      break;
    case "cmdextension":
      break;
    case "cmdend":
      f(b);
      a.changedrendervalues && (d.context.PrecomputeSheetFontsAndLayouts(), d.context.CalculateCellSkipData(), a.changedrendervalues = !1);
      a.celldisplayneeded && !a.renderneeded && "e#N/A" != a.cells[a.celldisplayneeded].valuetype && (cr = SocialCalc.coordToCr(a.celldisplayneeded), b = SocialCalc.GetEditorCellElement(d, cr.row, cr.col), d.ReplaceCell(b, cr.row, cr.col));
      if (d.deferredCommands.length) {
        a = d.deferredCommands.shift();
        d.EditorScheduleSheetCommands(a.cmdstr, a.saveundo, !0);
        return;
      }
      a.attribs.needsrecalc && ("off" != a.attribs.recalc || a.recalconce) && d.recalcFunction ? (d.FitToEditTable(), a.renderneeded = !1, a.recalconce && delete a.recalconce, d.recalcFunction(d)) : a.renderneeded ? (d.FitToEditTable(), a.renderneeded = !1, d.ScheduleRender()) : d.SchedulePositionCalculations();
      if ("col" == a.hiddencolrow && null !== d.ecell) {
        for (b = d.ecell.col;"yes" == a.colattribs.hide[SocialCalc.rcColname(b)];) {
          b++;
        }
        b = SocialCalc.crToCoord(b, d.ecell.row);
        d.MoveECell(b);
        a.hiddencolrow = "";
      }
      if ("row" == a.hiddencolrow && null !== d.ecell) {
        for (b = d.ecell.row;"yes" == a.rowattribs.hide[b];) {
          b++;
        }
        b = SocialCalc.crToCoord(d.ecell.col, b);
        d.MoveECell(b);
        a.hiddencolrow = "";
      }
      return;
    case "calcstart":
      d.busy = !0;
      break;
    case "calccheckdone":
    ;
    case "calcorder":
    ;
    case "calcstep":
    ;
    case "calcloading":
    ;
    case "calcserverfunc":
      break;
    case "calcfinished":
      f(b);
      d.ScheduleRender();
      return;
    case "schedrender":
      d.busy = !0;
      break;
    case "renderdone":
      break;
    case "schedposcalc":
      d.busy = !0;
      break;
    case "doneposcalc":
      if (d.deferredEmailCommands.length) {
        f(b);
        a = d.deferredEmailCommands.shift();
        d.EditorScheduleSheetCommands(a.cmdstr, a.saveundo, !0);
        return;
      }
      d.deferredCommands.length ? (f(b), a = d.deferredCommands.shift(), d.EditorScheduleSheetCommands(a.cmdstr, a.saveundo, !0)) : (d.busy = !1, f(b), "start" == d.state && d.DisplayCellContents());
      return;
    case "emailing":
    ;
    case "confirmemailsent":
      break;
    default:
      alert("Unknown status: " + b);
  }
  f(b);
};
SocialCalc.EditorGetStatuslineString = function(a, b, c, d) {
  var e = SocialCalc.Constants, f, g, h;
  f = "";
  switch(b) {
    case "moveecell":
    ;
    case "rangechange":
    ;
    case "startup":
      break;
    case "cmdstart":
      d.command = !0;
      document.body.style.cursor = "progress";
      a.griddiv.style.cursor = "progress";
      f = e.s_statusline_executing;
      break;
    case "cmdextension":
      f = "Command Extension: " + c;
      break;
    case "cmdend":
      d.command = !1;
      break;
    case "schedrender":
      f = e.s_statusline_displaying;
      break;
    case "renderdone":
      f = " ";
      break;
    case "schedposcalc":
      f = e.s_statusline_displaying;
      break;
    case "cmdendnorender":
    ;
    case "doneposcalc":
      document.body.style.cursor = "default";
      a.griddiv.style.cursor = "default";
      "sent" == d.emailing && (f = d.emailreponse, d.emailreponse = "", d.emailing = "done");
      break;
    case "calcorder":
      f = e.s_statusline_ordering + Math.floor(100 * c.count / (c.total || 1)) + "%";
      break;
    case "calcstep":
      f = e.s_statusline_calculating + Math.floor(100 * c.count / (c.total || 1)) + "%";
      break;
    case "calcloading":
      f = e.s_statusline_calculatingls + ": " + c.sheetname;
      break;
    case "calcserverfunc":
      f = e.s_statusline_calculating + Math.floor(100 * c.count / (c.total || 1)) + "%, " + e.s_statusline_doingserverfunc + c.funcname + e.s_statusline_incell + c.coord;
      break;
    case "calcstart":
      d.calculating = !0;
      document.body.style.cursor = "progress";
      a.griddiv.style.cursor = "progress";
      f = e.s_statusline_calcstart;
      break;
    case "calccheckdone":
      break;
    case "calcfinished":
      d.calculating = !1;
      break;
    case "emailing":
      d.emailing = "sending";
      d.emailreponse = "";
      break;
    case "confirmemailsent":
      d.emailing = "sent";
      "undefined" === typeof d.emailreponse && (d.emailreponse = "");
      d.emailreponse += c;
      break;
    default:
      f = b;
  }
  "sending" == d.emailing && (f += e.s_statusline_sendemail);
  "sent" == d.emailing && (f += d.emailreponse);
  !f && d.calculating && (f = e.s_statusline_calculating);
  if (!(d.calculating || d.command || f || !a.range.hasrange || a.range.left == a.range.right && a.range.top == a.range.bottom)) {
    b = 0;
    for (c = a.range.top;c <= a.range.bottom;c++) {
      for (g = a.range.left;g <= a.range.right;g++) {
        (h = a.context.sheetobj.cells[SocialCalc.crToCoord(g, c)]) && h.valuetype && "n" == h.valuetype.charAt(0) && (b += h.datavalue - 0);
      }
    }
    b = SocialCalc.FormatNumber.formatNumberWithFormat(b, "[,]General", "");
    c = SocialCalc.crToCoord(a.range.left, a.range.top) + ":" + SocialCalc.crToCoord(a.range.right, a.range.bottom);
    f = c + " (" + (a.range.right - a.range.left + 1) + "x" + (a.range.bottom - a.range.top + 1) + ") " + e.s_statusline_sum + "=" + b + " " + f;
  }
  f = (a.ecell || {}).coord + " &nbsp; " + f;
  d.calculating || "yes" != a.context.sheetobj.attribs.needsrecalc || (f += " &nbsp; " + e.s_statusline_recalcneeded);
  if (a = a.context.sheetobj.attribs.circularreferencecell) {
    a = a.replace(/\|/, " referenced by "), f += " &nbsp; " + e.s_statusline_circref + a + "</span>";
  }
  return f + "";
};
SocialCalc.EditorMouseInfo = {registeredElements:[], editor:null, element:null, ignore:!1, mousedowncoord:"", mouselastcoord:"", mouseresizecol:"", mouseresizeclientx:null, mouseresizedisplay:null};
SocialCalc.EditorMouseRegister = function(a) {
  var b = SocialCalc.EditorMouseInfo, c = a.fullgrid, d;
  for (d = 0;d < b.registeredElements.length;d++) {
    if (b.registeredElements[d].editor == a) {
      if (b.registeredElements[d].element == c) {
        return;
      }
      break;
    }
  }
  d < b.registeredElements.length ? b.registeredElements[d].element = c : b.registeredElements.push({element:c, editor:a});
  if (c.addEventListener) {
    c.addEventListener("mousedown", SocialCalc.ProcessEditorMouseDown, !1), c.addEventListener("dblclick", SocialCalc.ProcessEditorDblClick, !1);
  } else {
    if (c.attachEvent) {
      c.attachEvent("onmousedown", SocialCalc.ProcessEditorMouseDown), c.attachEvent("ondblclick", SocialCalc.ProcessEditorDblClick);
    } else {
      throw "Browser not supported";
    }
  }
  b.ignore = !1;
};
SocialCalc.EditorMouseUnregister = function(a) {
  var b = SocialCalc.EditorMouseInfo, c;
  for (c = 0;c < b.registeredElements.length && b.registeredElements[c].editor != a;c++) {
  }
  c < b.registeredElements.length && (a = b.registeredElements[c].element, a.removeEventListener ? (a.removeEventListener("mousedown", SocialCalc.ProcessEditorMouseDown, !1), a.removeEventListener("dblclick", SocialCalc.ProcessEditorDblClick, !1)) : a.detachEvent && (a.detachEvent("onmousedown", SocialCalc.ProcessEditorMouseDown), a.detachEvent("ondblclick", SocialCalc.ProcessEditorDblClick)), b.registeredElements.splice(c, 1));
};
SocialCalc.StopPropagation = function(a) {
  a.stopPropagation ? a.stopPropagation() : a.cancelBubble = !0;
  a.preventDefault ? a.preventDefault() : a.returnValue = !1;
};
SocialCalc.SetMouseMoveUp = function(a, b, c, d) {
  document.addEventListener ? (document.addEventListener("mousemove", a, !0), document.addEventListener("mouseup", b, !0)) : c.attachEvent && (c.setCapture(), c.attachEvent("onmousemove", a), c.attachEvent("onmouseup", b), c.attachEvent("onlosecapture", b));
  SocialCalc.StopPropagation(d);
};
SocialCalc.RemoveMouseMoveUp = function(a, b, c, d) {
  SocialCalc.StopPropagation(d);
  document.removeEventListener ? (document.removeEventListener("mousemove", a, !0), document.removeEventListener("mouseup", b, !0)) : c.detachEvent && (c.detachEvent("onlosecapture", b), c.detachEvent("onmouseup", b), c.detachEvent("onmousemove", a), c.releaseCapture());
};
SocialCalc.ProcessEditorMouseDown = function(a) {
  var b, c, d, e = a || window.event, f = SocialCalc.EditorMouseInfo, g = e.target || e.srcElement;
  if (!f.ignore) {
    for (b = null;!b && g;g = g.parentNode) {
      b = SocialCalc.LookupElement(g, f.registeredElements);
    }
    if (b) {
      if (b = b.editor, f.element = g, d = b.range, c = SocialCalc.GetElementPositionWithScroll(b.toplevel), c = SocialCalc.GridMousePosition(b, e.clientX - c.left, e.clientY - c.top)) {
        if (f.editor = b, c.rowheader) {
          c.rowselect ? SocialCalc.ProcessEditorRowselectMouseDown(a, g, c) : SocialCalc.ProcessEditorRowsizeMouseDown(a, g, c);
        } else {
          if (c.colheader) {
            c.colselect ? SocialCalc.ProcessEditorColselectMouseDown(a, g, c) : SocialCalc.ProcessEditorColsizeMouseDown(a, g, c);
          } else {
            if (c.coord) {
              if (d.hasrange || a.shiftKey && b.RangeAnchor(), c = b.MoveECell(c.coord), !0 == SocialCalc._app) {
                SocialCalc.CmdGotFocus(!0);
              } else {
                var h = b.context.sheetobj.cells[c];
                h && "i" == h.valuetype.charAt(1) ? (a = h.valuetype.substring(2), a = document.getElementById(a + "_" + c), SocialCalc.CmdGotFocus(a)) : (d.hasrange && (a.shiftKey ? b.RangeExtend() : b.RangeRemove()), f.mousedowncoord = c, f.mouselastcoord = c, b.EditorMouseRange(c), SocialCalc.KeyboardSetFocus(b), "start" != b.state && b.inputBox && b.inputBox.element.focus(), SocialCalc.SetMouseMoveUp(SocialCalc.ProcessEditorMouseMove, SocialCalc.ProcessEditorMouseUp, g, e));
              }
            }
          }
        }
      }
    } else {
      f.editor = null;
    }
  }
};
SocialCalc.EditorMouseRange = function(a, b) {
  var c, d, e = a.range;
  switch(a.state) {
    case "input":
      c = a.inputBox.GetText();
      d = a.workingvalues;
      if (0 <= "(+-*/,:!&<>=^".indexOf(c.slice(-1)) && "=" == c.slice(0, 1) || "=" == c) {
        d.partialexpr = c;
      }
      d.partialexpr ? b && (e.hasrange ? a.inputBox.SetText(d.partialexpr + SocialCalc.crToCoord(e.left, e.top) + ":" + SocialCalc.crToCoord(e.right, e.bottom)) : a.inputBox.SetText(d.partialexpr + b)) : (a.inputBox.Blur(), a.inputBox.ShowInputBox(!1), a.state = "start", a.cellhandles.ShowCellHandles(!0), a.EditorSaveEdit(), a.inputBox.DisplayCellContents(null));
      break;
    case "inputboxdirect":
      a.inputBox.Blur(), a.inputBox.ShowInputBox(!1), a.state = "start", a.cellhandles.ShowCellHandles(!0), a.EditorSaveEdit(), a.inputBox.DisplayCellContents(null);
  }
};
SocialCalc.ProcessEditorMouseMove = function(a) {
  var b, c, d = a || window.event, e = SocialCalc.EditorMouseInfo;
  (b = e.editor) && !e.ignore && (c = SocialCalc.GetElementPositionWithScroll(b.toplevel), c = SocialCalc.GridMousePosition(b, d.clientX - c.left, d.clientY - c.top)) && (c && !c.coord ? SocialCalc.SetDragAutoRepeat(b, c) : (SocialCalc.SetDragAutoRepeat(b, null), c.coord && (c.coord != e.mouselastcoord && (a.shiftKey || b.range.hasrange || b.RangeAnchor(e.mousedowncoord), b.MoveECell(c.coord), b.RangeExtend()), e.mouselastcoord = c.coord, b.EditorMouseRange(c.coord), SocialCalc.StopPropagation(d))));
};
SocialCalc.ProcessEditorMouseUp = function(a) {
  var b, c, d = a || window.event, e = SocialCalc.EditorMouseInfo;
  if ((a = e.editor) && !e.ignore && (b = e.element, c = SocialCalc.GetElementPositionWithScroll(a.toplevel), c = SocialCalc.GridMousePosition(a, d.clientX - c.left, d.clientY - c.top), SocialCalc.SetDragAutoRepeat(a, null), c)) {
    return c.coord || (c.coord = a.ecell.coord), a.range.hasrange ? (a.MoveECell(c.coord), a.RangeExtend()) : c.coord && c.coord != e.mousedowncoord && (a.RangeAnchor(e.mousedowncoord), a.MoveECell(c.coord), a.RangeExtend()), a.EditorMouseRange(c.coord), e.editor = null, SocialCalc.RemoveMouseMoveUp(SocialCalc.ProcessEditorMouseMove, SocialCalc.ProcessEditorMouseUp, b, d), !1;
  }
};
SocialCalc.ProcessEditorColsizeMouseDown = function(a, b, c) {
  a = a || window.event;
  b = SocialCalc.EditorMouseInfo;
  var d = b.editor, e = SocialCalc.GetElementPositionWithScroll(d.toplevel), e = a.clientX - e.left;
  b.mouseresizecolnum = c.coltoresize;
  b.mouseresizecol = SocialCalc.rcColname(c.coltoresize);
  b.mousedownclientx = e;
  b.mousecoltounhide = c.coltounhide;
  c.coltoresize && (e = document.createElement("div"), b.mouseresizedisplay = e, e.style.width = "auto", e.style.position = "absolute", e.style.zIndex = 100, e.style.top = d.headposition.top + "px", e.style.left = d.colpositions[c.coltoresize] + "px", e.innerHTML = '<table cellpadding="0" cellspacing="0"><tr><td style="height:100px;border:1px dashed black;background-color:white;width:' + (d.context.colwidth[b.mouseresizecolnum] - 2) + 'px;">&nbsp;</td><td><div style="font-size:small;color:white;background-color:gray;padding:4px;">' + 
  d.context.colwidth[b.mouseresizecolnum] + "</div></td></tr></table>", SocialCalc.setStyles(e.firstChild.lastChild.firstChild.childNodes[0], "filter:alpha(opacity=85);opacity:.85;"), d.toplevel.appendChild(e));
  SocialCalc.SetMouseMoveUp(SocialCalc.ProcessEditorColsizeMouseMove, SocialCalc.ProcessEditorColsizeMouseUp, d.toplevel, a);
};
SocialCalc.ProcessEditorColsizeMouseMove = function(a) {
  a = a || window.event;
  var b = SocialCalc.EditorMouseInfo, c = b.editor;
  if (c) {
    if (b.mouseresizecolnum) {
      var d = SocialCalc.GetElementPositionWithScroll(c.toplevel), c = c.context.colwidth[b.mouseresizecolnum] - 0 + (a.clientX - d.left - b.mousedownclientx);
      c < SocialCalc.Constants.defaultMinimumColWidth && (c = SocialCalc.Constants.defaultMinimumColWidth);
      b = b.mouseresizedisplay;
      b.innerHTML = '<table cellpadding="0" cellspacing="0"><tr><td style="height:100px;border:1px dashed black;background-color:white;width:' + (c - 2) + 'px;">&nbsp;</td><td><div style="font-size:small;color:white;background-color:gray;padding:4px;">' + c + "</div></td></tr></table>";
      SocialCalc.setStyles(b.firstChild.lastChild.firstChild.childNodes[0], "filter:alpha(opacity=85);opacity:.85;");
    }
    SocialCalc.StopPropagation(a);
  }
};
SocialCalc.ProcessEditorColsizeMouseUp = function(a) {
  var b = a || window.event;
  a = SocialCalc.EditorMouseInfo;
  var c = a.editor;
  if (c) {
    element = a.element;
    var d = SocialCalc.GetElementPositionWithScroll(c.toplevel), d = b.clientX - d.left;
    SocialCalc.RemoveMouseMoveUp(SocialCalc.ProcessEditorColsizeMouseMove, SocialCalc.ProcessEditorColsizeMouseUp, c.toplevel, b);
    a.mousecoltounhide ? c.EditorScheduleSheetCommands("set " + SocialCalc.rcColname(a.mousecoltounhide) + " hide", !0, !1) : a.mouseresizecolnum && (b = c.context.colwidth[a.mouseresizecolnum] - 0 + (d - a.mousedownclientx), b < SocialCalc.Constants.defaultMinimumColWidth && (b = SocialCalc.Constants.defaultMinimumColWidth), c.EditorScheduleSheetCommands("set " + a.mouseresizecol + " width " + b, !0, !1), c.timeout && window.clearTimeout(c.timeout), c.timeout = window.setTimeout(SocialCalc.FinishColRowSize, 
    1));
    return!1;
  }
};
SocialCalc.FinishColRowSize = function() {
  var a = SocialCalc.EditorMouseInfo, b = a.editor;
  b && (b.toplevel.removeChild(a.mouseresizedisplay), a.mouseresizedisplay = null, a.editor = null);
};
SocialCalc.ProcessEditorRowselectMouseDown = function(a, b, c) {
  a = a || window.event;
  b = SocialCalc.EditorMouseInfo.editor;
  var d = SocialCalc.GetSpreadsheetControlObject().sheet;
  coord1 = SocialCalc.crToCoord(1, c.row);
  coord2 = SocialCalc.crToCoord(d.LastCol(), c.row);
  coord3 = SocialCalc.crToCoord(b.firstscrollingcol, c.row);
  b.RangeAnchor(coord1);
  b.RangeExtend(coord2);
  b.MoveECell(coord3);
  SocialCalc.SetMouseMoveUp(SocialCalc.ProcessEditorRowselectMouseMove, SocialCalc.ProcessEditorRowselectMouseUp, b.toplevel, a);
};
SocialCalc.ProcessEditorRowselectMouseMove = function(a) {
  a = a || window.event;
  var b = SocialCalc.EditorMouseInfo.editor, c = SocialCalc.GetSpreadsheetControlObject().sheet;
  if (b) {
    var d = SocialCalc.GetElementPositionWithScroll(b.toplevel);
    result = SocialCalc.GridMousePosition(b, a.clientX - d.left, a.clientY - d.top);
    coord2 = SocialCalc.crToCoord(c.LastCol(), result.row);
    coord3 = SocialCalc.crToCoord(b.firstscrollingcol, result.row);
    b.RangeExtend(coord2);
    b.MoveECell(coord3);
  }
};
SocialCalc.ProcessEditorRowselectMouseUp = function(a) {
  var b = SocialCalc.EditorMouseInfo.editor;
  b && SocialCalc.RemoveMouseMoveUp(SocialCalc.ProcessEditorRowselectMouseMove, SocialCalc.ProcessEditorRowselectMouseUp, b.toplevel, a);
};
SocialCalc.ProcessEditorColselectMouseDown = function(a, b, c) {
  a = a || window.event;
  b = SocialCalc.EditorMouseInfo.editor;
  var d = SocialCalc.GetSpreadsheetControlObject().sheet;
  coord1 = SocialCalc.crToCoord(c.col, 1);
  coord2 = SocialCalc.crToCoord(c.col, d.LastRow());
  coord3 = SocialCalc.crToCoord(c.col, b.firstscrollingrow);
  b.RangeAnchor(coord1);
  b.RangeExtend(coord2);
  b.MoveECell(coord3);
  SocialCalc.SetMouseMoveUp(SocialCalc.ProcessEditorColselectMouseMove, SocialCalc.ProcessEditorColselectMouseUp, b.toplevel, a);
};
SocialCalc.ProcessEditorColselectMouseMove = function(a) {
  a = a || window.event;
  var b = SocialCalc.EditorMouseInfo.editor, c = SocialCalc.GetSpreadsheetControlObject().sheet;
  if (b) {
    var d = SocialCalc.GetElementPositionWithScroll(b.toplevel);
    result = SocialCalc.GridMousePosition(b, a.clientX - d.left, a.clientY - d.top);
    coord2 = SocialCalc.crToCoord(result.col, c.LastRow());
    coord3 = SocialCalc.crToCoord(result.col, b.firstscrollingrow);
    b.RangeExtend(coord2);
    b.MoveECell(coord3);
  }
};
SocialCalc.ProcessEditorColselectMouseUp = function(a) {
  var b = SocialCalc.EditorMouseInfo.editor;
  b && SocialCalc.RemoveMouseMoveUp(SocialCalc.ProcessEditorColselectMouseMove, SocialCalc.ProcessEditorColselectMouseUp, b.toplevel, a);
};
SocialCalc.ProcessEditorRowsizeMouseDown = function(a, b, c) {
  a = a || window.event;
  b = SocialCalc.EditorMouseInfo;
  var d = b.editor, e = SocialCalc.GetSpreadsheetControlObject().spreadsheetDiv.firstChild.offsetHeight, e = a.clientY - e;
  b.mouseresizerownum = c.rowtoresize;
  b.mouseresizerow = c.rowtoresize;
  b.mousedownclienty = e;
  b.mouserowtounhide = c.rowtounhide;
  c.rowtoresize && (e = document.createElement("div"), b.mouseresizedisplay = e, e.style.width = d.context.totalwidth + "px", e.style.height = d.rowpositions[c.rowtoresize] + "px", e.style.position = "absolute", e.style.zIndex = 100, e.style.top = d.rowpositions[c.rowtoresize] + "px", e.style.left = d.headposition.left + "px", e.innerHTML = '<table cellpadding="0" cellspacing="0"><tr><td style="width:100pxborder:1px dashed black;background-color:white;height:' + (d.context.rowheight[b.mouseresizerownum] - 
  2) + 'px;">&nbsp;</td><td><div style="font-size:small;color:white;background-color:gray;padding:4px;">' + d.context.rowheight[b.mouseresizerownum] + "</div></td></tr></table>", SocialCalc.setStyles(e.firstChild.lastChild.firstChild.childNodes[0], "filter:alpha(opacity=85);opacity:.5;"), d.toplevel.appendChild(e));
  SocialCalc.SetMouseMoveUp(SocialCalc.ProcessEditorRowsizeMouseMove, SocialCalc.ProcessEditorRowsizeMouseUp, d.toplevel, a);
};
SocialCalc.ProcessEditorRowsizeMouseMove = function(a) {
  a = a || window.event;
  var b = SocialCalc.EditorMouseInfo, c = b.editor;
  if (c) {
    if (b.mouseresizerownum) {
      var d = SocialCalc.GetSpreadsheetControlObject().spreadsheetDiv.firstChild.offsetHeight, c = c.context.rowheight[b.mouseresizerownum] - 0 + (a.clientY - d - b.mousedownclienty);
      c < SocialCalc.Constants.defaultAssumedRowHeight && (c = SocialCalc.Constants.defaultAssumedRowHeight);
      b = b.mouseresizedisplay;
      b.innerHTML = '<table cellpadding="0" cellspacing="0"><tr><td style="width:100px;border:1px dashed black;background-color:white;height:' + (c - 2) + 'px;">&nbsp;</td><td><div style="font-size:small;color:white;background-color:gray;padding:4px;">' + c + "</div></td></tr></table>";
      SocialCalc.setStyles(b.firstChild.lastChild.firstChild.childNodes[0], "filter:alpha(opacity=85);opacity:.5;");
    }
    SocialCalc.StopPropagation(a);
  }
};
SocialCalc.ProcessEditorRowsizeMouseUp = function(a) {
  var b = a || window.event;
  a = SocialCalc.EditorMouseInfo;
  var c = a.editor;
  if (c) {
    element = a.element;
    var d = SocialCalc.GetSpreadsheetControlObject().spreadsheetDiv.firstChild.offsetHeight, d = b.clientY - d;
    SocialCalc.RemoveMouseMoveUp(SocialCalc.ProcessEditorRowsizeMouseMove, SocialCalc.ProcessEditorRowsizeMouseUp, c.toplevel, b);
    a.mouserowtounhide ? c.EditorScheduleSheetCommands("set " + a.mouserowtounhide + " hide", !0, !1) : a.mouseresizerownum && (b = c.context.rowheight[a.mouseresizerownum] - 0 + (d - a.mousedownclienty), b < SocialCalc.Constants.defaultAssumedRowHeight && (b = SocialCalc.Constants.defaultAssumedRowHeight), c.EditorScheduleSheetCommands("set " + a.mouseresizerownum + " height " + b, !0, !1), c.timeout && window.clearTimeout(c.timeout), c.timeout = window.setTimeout(SocialCalc.FinishColRowSize, 1));
    return!1;
  }
};
SocialCalc.AutoRepeatInfo = {timer:null, mouseinfo:null, repeatinterval:1E3, editor:null, repeatcallback:null};
SocialCalc.SetDragAutoRepeat = function(a, b, c) {
  var d = SocialCalc.AutoRepeatInfo;
  d.repeatcallback = c;
  if (b) {
    d.editor = a;
    d.mouseinfo && (b.rowheader || b.rowfooter ? b.row != d.mouseinfo.row && (c = SocialCalc.crToCoord(a.ecell.col, b.row), d.repeatcallback ? (a = b.row < d.mouseinfo.row ? "left" : b.row > d.mouseinfo.row ? "right" : "", d.repeatcallback(c, a)) : (a.MoveECell(c), a.MoveECell(c), a.RangeExtend(), a.EditorMouseRange(c))) : (b.colheader || b.colfooter) && b.col != d.mouseinfo.col && (c = SocialCalc.crToCoord(b.col, a.ecell.row), d.repeatcallback ? (a = b.row < d.mouseinfo.row ? "left" : b.row > d.mouseinfo.row ? 
    "right" : "", d.repeatcallback(c, a)) : (a.MoveECell(c), a.RangeExtend(), a.EditorMouseRange(c))));
    d.mouseinfo = b;
    if (5 > b.distance) {
      d.repeatinterval = 333;
    } else {
      if (10 > b.distance) {
        d.repeatinterval = 250;
      } else {
        if (25 > b.distance) {
          d.repeatinterval = 100;
        } else {
          if (35 > b.distance) {
            d.repeatinterval = 75;
          } else {
            d.timer && (window.clearTimeout(d.timer), d.timer = null);
            return;
          }
        }
      }
    }
    d.timer || (d.timer = window.setTimeout(SocialCalc.DragAutoRepeat, d.repeatinterval));
  } else {
    d.timer && (window.clearTimeout(d.timer), d.timer = null), d.mouseinfo = null;
  }
};
SocialCalc.DragAutoRepeat = function() {
  var a = SocialCalc.AutoRepeatInfo, b = a.mouseinfo, c;
  b.rowheader ? c = "left" : b.rowfooter ? c = "right" : b.colheader ? c = "up" : b.colfooter && (c = "down");
  a.repeatcallback ? (b = SocialCalc.coordToCr(a.editor.ecell.coord), "left" == c && 1 < b.col ? b.col-- : "right" == c ? b.col++ : "up" == c && 1 < b.row ? b.row-- : "down" == c && b.row++, b = SocialCalc.crToCoord(b.col, b.row), a.repeatcallback(b, c)) : (b = a.editor.MoveECellWithKey("[a" + c + "]shifted")) && a.editor.EditorMouseRange(b);
  a.timer = window.setTimeout(SocialCalc.DragAutoRepeat, a.repeatinterval);
};
SocialCalc.ProcessEditorDblClick = function(a) {
  var b, c;
  a = a || window.event;
  var d = SocialCalc.EditorMouseInfo, e = a.target || a.srcElement;
  if (!d.ignore) {
    for (b = null;!b && e;e = e.parentNode) {
      b = SocialCalc.LookupElement(e, d.registeredElements);
    }
    if (b) {
      if (b = b.editor, c = SocialCalc.GetElementPositionWithScroll(b.toplevel), (c = SocialCalc.GridMousePosition(b, a.clientX - c.left, a.clientY - c.top)) && c.coord) {
        d.editor = b;
        d.element = e;
        sheetobj = b.context.sheetobj;
        switch(b.state) {
          case "start":
            SocialCalc.EditorOpenCellEdit(b);
        }
        SocialCalc.StopPropagation(a);
      }
    } else {
      d.editor = null;
    }
  }
};
SocialCalc.EditorOpenCellEdit = function(a) {
  var b;
  if (!a.ecell || !a.inputBox || a.inputBox.element.disabled) {
    return!0;
  }
  a.inputBox.ShowInputBox(!0);
  a.inputBox.Focus();
  a.inputBox.SetText("");
  a.inputBox.DisplayCellContents();
  a.inputBox.Select("end");
  b = a.workingvalues;
  b.partialexpr = "";
  b.ecoord = a.ecell.coord;
  b.erow = a.ecell.row;
  b.ecol = a.ecell.col;
};
SocialCalc.EditorProcessKey = function(a, b, c) {
  var d, e = a.workingvalues, f = a.range;
  "string" != typeof b && (b = "");
  switch(a.state) {
    case "start":
      c.shiftKey && "[a" == b.substr(0, 2) && (b += "shifted");
      "[enter]" == b && (b = "[adown]");
      "[tab]" == b && (b = c.shiftKey ? "[aleft]" : "[aright]");
      if ("[a" == b.substr(0, 2) || "[pg" == b.substr(0, 3) || "[home]" == b) {
        return a = a.MoveECellWithKey(b), !a;
      }
      if ("[del]" == b || "[backspace]" == b) {
        a.noEdit || a.ECellReadonly() || a.EditorApplySetCommandsToRange("empty", "");
        break;
      }
      if ("[esc]" == b) {
        if (f.hasrange) {
          for (d in a.RangeRemove(), a.MoveECell(f.anchorcoord), a.StatusCallback) {
            a.StatusCallback[d].func(a, "specialkey", b, a.StatusCallback[d].params);
          }
        }
        break;
      }
      if ("[f2]" == b) {
        if (a.noEdit || a.ECellReadonly()) {
          return!0;
        }
        SocialCalc.EditorOpenCellEdit(a);
        break;
      }
      if (1 < b.length && "[" == b.substr(0, 1) || 0 == b.length) {
        return a.ctrlkeyFunction && 0 < b.length ? a.ctrlkeyFunction(a, b) : !0;
      }
      if (!a.ecell || !a.inputBox || a.ECellReadonly()) {
        return!0;
      }
      a.inputBox.element.disabled = !1;
      a.state = "input";
      a.inputBox.ShowInputBox(!0);
      a.inputBox.Focus();
      a.inputBox.SetText(b);
      a.inputBox.Select("end");
      e.partialexpr = "";
      e.ecoord = a.ecell.coord;
      e.erow = a.ecell.row;
      e.ecol = a.ecell.col;
      a.RangeRemove();
      break;
    case "input":
      d = a.inputBox.GetText();
      if (a.inputBox.skipOne) {
        break;
      }
      if ("[esc]" == b || "[enter]" == b || "[tab]" == b || b && "[a" == b.substr(0, 2)) {
        if (0 <= "(+-*/,:!&<>=^".indexOf(d.slice(-1)) && "=" == d.slice(0, 1) || "=" == d) {
          e.partialexpr = d;
        }
        if (e.partialexpr && (c.shiftKey && "[a" == b.substr(0, 2) && (b += "shifted"), d = a.MoveECellWithKey(b))) {
          f.hasrange ? a.inputBox.SetText(e.partialexpr + SocialCalc.crToCoord(f.left, f.top) + ":" + SocialCalc.crToCoord(f.right, f.bottom)) : a.inputBox.SetText(e.partialexpr + d);
          break;
        }
        a.inputBox.Blur();
        a.inputBox.ShowInputBox(!1);
        a.state = "start";
        a.cellhandles.ShowCellHandles(!0);
        "[esc]" != b ? (a.EditorSaveEdit(), a.ecell.coord != e.ecoord && a.MoveECell(e.ecoord), "[enter]" == b && (b = "[adown]"), "[tab]" == b && (b = c.shiftKey ? "[aleft]" : "[aright]"), "[a" == b.substr(0, 2) && a.MoveECellWithKey(b)) : (a.inputBox.DisplayCellContents(), a.RangeRemove(), a.MoveECell(e.ecoord));
        break;
      }
      if (e.partialexpr && "[backspace]" == b) {
        a.inputBox.SetText(e.partialexpr);
        e.partialexpr = "";
        a.RangeRemove();
        a.MoveECell(e.ecoord);
        a.inputBox.ShowInputBox(!0);
        break;
      }
      if ("[f2]" == b) {
        break;
      }
      f.hasrange && a.RangeRemove();
      a.MoveECell(e.ecoord);
      e.partialexpr && (a.inputBox.ShowInputBox(!0), e.partialexpr = "");
      return!0;
    case "inputboxdirect":
      a.inputBox.GetText();
      if ("[esc]" == b || "[enter]" == b || "[tab]" == b) {
        a.inputBox.Blur();
        a.inputBox.ShowInputBox(!1);
        a.state = "start";
        a.cellhandles.ShowCellHandles(!0);
        "[esc]" == b ? a.inputBox.DisplayCellContents() : (a.EditorSaveEdit(), a.ecell.coord != e.ecoord && a.MoveECell(e.ecoord), "[enter]" == b && (b = "[adown]"), "[tab]" == b && (b = c.shiftKey ? "[aleft]" : "[aright]"), "[a" == b.substr(0, 2) && a.MoveECellWithKey(b));
        break;
      }
      if ("[f2]" == b) {
        break;
      }
      return!0;
    case "skip-and-start":
      a.state = "start";
      a.cellhandles.ShowCellHandles(!0);
      break;
    default:
      return!0;
  }
  return!1;
};
SocialCalc.EditorAddToInput = function(a, b, c) {
  var d = a.workingvalues;
  if (!a.noEdit && !a.ECellReadonly()) {
    switch(a.state) {
      case "start":
        a.state = "input";
        a.inputBox.ShowInputBox(!0);
        a.inputBox.element.disabled = !1;
        a.inputBox.Focus();
        a.inputBox.SetText((c || "") + b);
        a.inputBox.Select("end");
        d.partialexpr = "";
        d.ecoord = a.ecell.coord;
        d.erow = a.ecell.row;
        d.ecol = a.ecell.col;
        a.RangeRemove();
        break;
      case "input":
      ;
      case "inputboxdirect":
        a.inputBox.element.focus(), d.partialexpr && (a.inputBox.SetText(d.partialexpr), d.partialexpr = "", a.RangeRemove(), a.MoveECell(d.ecoord)), a.inputBox.SetText(a.inputBox.GetText() + b);
    }
  }
};
SocialCalc.EditorDisplayCellContents = function(a) {
  a.inputBox && a.inputBox.DisplayCellContents();
};
SocialCalc.EditorSaveEdit = function(a, b) {
  var c, d, e, f = a.context.sheetobj, g = a.workingvalues;
  e = "string" == typeof b ? b : a.inputBox.GetText();
  c = SocialCalc.GetCellContents(f, g.ecoord) + "";
  e != c && (c = e.charAt(0), "=" == c && -1 == e.indexOf("\n") ? (d = "formula", e = e.substring(1)) : "'" == c ? (d = "text t", e = e.substring(1), c = SocialCalc.DetermineValueType(e), "t" == c.type.charAt(0) && (d = "text " + c.type)) : 0 == e.length ? d = "empty" : (c = SocialCalc.DetermineValueType(e), d = "n" == c.type && e == c.value + "" ? "value n" : "t" == c.type.charAt(0) ? "text " + c.type : "" == c.type ? "text t" : "constant " + c.type + " " + c.value), "t" == d.charAt(0) && (e = SocialCalc.encodeForSave(e)), 
  e = "set " + g.ecoord + " " + d + " " + e, a.EditorScheduleSheetCommands(e, !0, !1), "undefined" !== typeof f.ioEventTree && "undefined" !== typeof f.ioParameterList && "undefined" !== typeof f.ioEventTree[g.ecoord] && SocialCalc.EditedTriggerCell(f.ioEventTree[g.ecoord], g.ecoord, a, f));
};
SocialCalc.EditedTriggerCell = function(a, b, c, d) {
  for (var e in a) {
    if (a = d.ioParameterList[e], "undefined" !== typeof a) {
      switch(a.function_name) {
        case "EMAILONEDIT":
        ;
        case "EMAILONEDITIF":
          cmdline = "setemailparameters " + e + " " + b, c.deferredEmailCommands.push({cmdstr:cmdline, saveundo:!1});
      }
    }
  }
};
SocialCalc.EditorApplySetCommandsToRange = function(a, b) {
  var c;
  c = a.ecell;
  var d = a.range;
  d.hasrange ? (coord = SocialCalc.crToCoord(d.left, d.top) + ":" + SocialCalc.crToCoord(d.right, d.bottom), c = "set " + coord + " " + b) : c = "set " + c.coord + " " + b;
  a.EditorScheduleSheetCommands(c, !0, !1);
  a.DisplayCellContents();
};
SocialCalc.EditorProcessMouseWheel = function(a, b, c, d) {
  d.functionobj.editor.busy || (0 < b && d.functionobj.editor.ScrollRelative(!0, Math.floor(1.5 * -b)), 0 > b && d.functionobj.editor.ScrollRelative(!0, Math.ceil(1.5 * -b)));
};
SocialCalc.GridMousePosition = function(a, b, c) {
  var d, e, f = {};
  for (d = 1;d < a.rowpositions.length && !(a.rowheight[d] && a.rowpositions[d] + a.rowheight[d] > c);d++) {
  }
  for (e = 1;e < a.colpositions.length && !(a.colwidth[e] && a.colpositions[e] + a.colwidth[e] > b);e++) {
  }
  f.row = d;
  f.col = e;
  if (a.headposition) {
    if (b < a.headposition.left && b >= a.gridposition.left) {
      f.rowheader = !0;
      f.distance = a.headposition.left - b;
      f.rowtoresize = !1;
      f.rowselect = !1;
      for (e = 1;e < a.rowpositions.length;e++) {
        if (a.rowheight[e] && a.rowpositions[e] + a.rowheight[e] - 3 <= c && a.rowpositions[e] + a.rowheight[e] + 3 >= c) {
          f.rowtoresize = e;
          break;
        }
      }
      if (unhide = a.context.rowunhidetop[d]) {
        pos = SocialCalc.GetElementPosition(unhide), b >= pos.left && b < pos.left + unhide.offsetWidth && c >= a.rowpositions[d] + a.rowheight[d] - unhide.offsetHeight && c < a.rowpositions[d] + a.rowheight[d] && (f.rowtounhide = d + 1);
      }
      if (unhide = a.context.rowunhidebottom[d]) {
        pos = SocialCalc.GetElementPosition(unhide), b >= pos.left && b < pos.left + unhide.offsetWidth && c >= a.rowpositions[d] && c < a.rowpositions[d] + unhide.offsetHeight && (f.rowtounhide = d - 1);
      }
      for (b = 0;b < a.context.rowpanes.length;b++) {
        if (f.rowtoresize >= a.context.rowpanes[b].first && f.rowtoresize <= a.context.rowpanes[b].last) {
          return f;
        }
      }
      delete f.rowtoresize;
      f.rowselect = !0;
    } else {
      if (c < a.headposition.top && c > a.gridposition.top) {
        f.colheader = !0;
        f.distance = a.headposition.top - c;
        f.coltoresize = !1;
        f.colselect = !1;
        for (d = 1;d < a.colpositions.length;d++) {
          if (a.colwidth[d] && a.colpositions[d] + a.colwidth[d] - 3 <= b && a.colpositions[d] + a.colwidth[d] + 3 >= b) {
            f.coltoresize = d;
            break;
          }
        }
        if (unhide = a.context.colunhideleft[e]) {
          pos = SocialCalc.GetElementPosition(unhide), b >= pos.left && b < pos.left + unhide.offsetWidth && c >= pos.top && c < pos.top + unhide.offsetHeight && (f.coltounhide = e + 1);
        }
        if (unhide = a.context.colunhideright[e]) {
          pos = SocialCalc.GetElementPosition(unhide), b >= pos.left && b < pos.left + unhide.offsetWidth && c >= pos.top && c < pos.top + unhide.offsetHeight && (f.coltounhide = e - 1);
        }
        for (b = 0;b < a.context.colpanes.length;b++) {
          if (f.coltoresize >= a.context.colpanes[b].first && f.coltoresize <= a.context.colpanes[b].last) {
            return f;
          }
        }
        delete f.coltoresize;
        f.colselect = !0;
      } else {
        b >= a.verticaltablecontrol.controlborder ? (f.rowfooter = !0, f.distance = b - a.verticaltablecontrol.controlborder) : c >= a.horizontaltablecontrol.controlborder ? (f.colfooter = !0, f.distance = c - a.horizontaltablecontrol.controlborder) : b < a.gridposition.left ? (f.rowheader = !0, f.distance = a.headposition.left - b) : c <= a.gridposition.top ? (f.colheader = !0, f.distance = a.headposition.top - c) : (f.coord = SocialCalc.crToCoord(f.col, f.row), a.context.cellskip[f.coord] && (f.coord = 
        a.context.cellskip[f.coord]));
      }
    }
    return f;
  }
  return null;
};
SocialCalc.GetEditorCellElement = function(a, b, c) {
  var d = 0, e = 0;
  !1 == a.context.showRCHeaders && (b--, c--, e = d = -1);
  var f, g, h, l, n = 0, p = 0;
  for (f = 0;f < a.context.rowpanes.length;f++) {
    if (b >= a.context.rowpanes[f].first && b <= a.context.rowpanes[f].last + e) {
      for (g = 0;g < a.context.colpanes.length;g++) {
        if (c >= a.context.colpanes[g].first && c <= a.context.colpanes[g].last + d) {
          n += b - a.context.rowpanes[f].first + 2;
          for (h = a.context.colpanes[g].first;h <= c;h++) {
            (l = a.context.cellskip[SocialCalc.crToCoord(h, b)]) && a.context.CoordInPane(l, f, g) || p++;
          }
          return{element:a.griddiv.firstChild.lastChild.childNodes[n].childNodes[p], rowpane:f, colpane:g};
        }
        for (h = a.context.colpanes[g].first;h <= a.context.colpanes[g].last;h++) {
          (l = a.context.cellskip[SocialCalc.crToCoord(h, b)]) && a.context.CoordInPane(l, f, g) || p++;
        }
        p += 1;
      }
    }
    n += a.context.rowpanes[f].last - a.context.rowpanes[f].first + 2;
  }
  return null;
};
SocialCalc.MoveECellWithKey = function(a, b) {
  var c, d, e, f = !1, g = 1;
  if (!a.ecell) {
    return null;
  }
  "shifted" == b.slice(-7) && (b = b.slice(0, -7), f = !0);
  c = a.ecell.row;
  d = a.ecell.col;
  e = a.context.sheetobj.cells[a.ecell.coord];
  switch(b) {
    case "[adown]":
      c += e && e.rowspan || 1;
      break;
    case "[aup]":
      c--;
      g = -1;
      break;
    case "[pgdn]":
      c += a.pageUpDnAmount - 1 + (e && e.rowspan || 1);
      break;
    case "[pgup]":
      c -= a.pageUpDnAmount;
      g = -1;
      break;
    case "[aright]":
      d += e && e.colspan || 1;
      break;
    case "[aleft]":
      d--;
      g = -1;
      break;
    case "[home]":
      d = c = 1;
      break;
    default:
      return null;
  }
  a.context.sheetobj.attribs.usermaxcol && (d = Math.min(a.context.sheetobj.attribs.usermaxcol, d));
  for (a.context.sheetobj.attribs.usermaxrow && (c = Math.min(a.context.sheetobj.attribs.usermaxrow, c));"yes" == a.context.sheetobj.colattribs.hide[SocialCalc.rcColname(d)];) {
    d += g, 1 > d && (g = -g, d = 1);
  }
  for (;"yes" == a.context.sheetobj.rowattribs.hide[c];) {
    c += g, 1 > c && (g = -g, c = 1);
  }
  a.range.hasrange || f && a.RangeAnchor();
  c = a.MoveECell(SocialCalc.crToCoord(d, c));
  a.range.hasrange && (f ? a.RangeExtend() : a.RangeRemove());
  return c;
};
SocialCalc.MoveECell = function(a, b) {
  var c, d, e = a.context.highlights;
  c = SocialCalc.coordToCr(b);
  a.context.sheetobj.attribs.usermaxcol && c.col > a.context.sheetobj.attribs.usermaxcol && (c.col = a.context.sheetobj.attribs.usermaxcol);
  a.context.sheetobj.attribs.usermaxrow && c.row > a.context.sheetobj.attribs.usermaxrow && (c.row = a.context.sheetobj.attribs.usermaxrow);
  b = SocialCalc.crToCoord(c.col, c.row);
  if (a.ecell) {
    if (a.ecell.coord == b) {
      return b;
    }
    c = SocialCalc.GetEditorCellElement(a, a.ecell.row, a.ecell.col);
    delete e[a.ecell.coord];
    a.range2.hasrange && a.ecell.row >= a.range2.top && a.ecell.row <= a.range2.bottom && a.ecell.col >= a.range2.left && a.ecell.col <= a.range2.right && (e[a.ecell.coord] = "range2");
    a.UpdateCellCSS(c, a.ecell.row, a.ecell.col);
    a.SetECellHeaders("");
    a.cellhandles.ShowCellHandles(!1);
  }
  b = a.context.cellskip[b] || b;
  a.ecell = SocialCalc.coordToCr(b);
  a.ecell.coord = b;
  c = SocialCalc.GetEditorCellElement(a, a.ecell.row, a.ecell.col);
  e[b] = "cursor";
  for (d in a.MoveECellCallback) {
    a.MoveECellCallback[d](a);
  }
  a.UpdateCellCSS(c, a.ecell.row, a.ecell.col);
  a.SetECellHeaders("selected");
  for (d in a.StatusCallback) {
    a.StatusCallback[d].func(a, "moveecell", b, a.StatusCallback[d].params);
  }
  a.busy ? a.ensureecell = !0 : (a.ensureecell = !1, a.EnsureECellVisible());
  return b;
};
SocialCalc.EnsureECellVisible = function(a) {
  var b = 0, c = 0;
  a.ecell.row > a.lastnonscrollingrow && (a.ecell.row < a.firstscrollingrow ? b = a.ecell.row - a.firstscrollingrow - Math.floor((a.lastvisiblerow - a.firstscrollingrow) / 2) : a.ecell.row + 1 > a.lastvisiblerow && (b = a.ecell.row - a.lastvisiblerow + Math.floor((a.lastvisiblerow - a.firstscrollingrow) / 2)));
  a.ecell.col > a.lastnonscrollingcol && (a.ecell.col < a.firstscrollingcol ? c = a.ecell.col - a.firstscrollingcol - Math.floor((a.lastvisiblecol - a.firstscrollingcol) / 2) : a.ecell.col + 1 > a.lastvisiblecol && (c = a.ecell.col - a.lastvisiblecol + Math.floor((a.lastvisiblecol - a.firstscrollingcol) / 2)));
  0 != b || 0 != c ? a.ScrollRelativeBoth(b, c) : a.cellhandles.ShowCellHandles(!0);
};
SocialCalc.ReplaceCell = function(a, b, c, d) {
  var e;
  if (b && (a = a.context.RenderCell(c, d, b.rowpane, b.colpane, !0, null)) && b.element) {
    for (e in b.element.innerHTML = a.innerHTML, b.element.style.cssText = "", b.element.className = a.className, a.style) {
      "cssText" != a.style[e] && (b.element.style[e] = a.style[e]);
    }
  }
};
SocialCalc.UpdateCellCSS = function(a, b, c, d) {
  var e;
  if (b && (a = a.context.RenderCell(c, d, b.rowpane, b.colpane, !0, null))) {
    for (e in b.element.style.cssText = "", b.element.className = a.className, a.style) {
      "cssText" != a.style[e] && (b.element.style[e] = a.style[e]);
    }
  }
};
SocialCalc.SetECellHeaders = function(a, b) {
  if (!1 !== a.context.showRCHeaders) {
    var c = a.ecell, d = a.context, e, f, g, h = 0, l = 0, n;
    if (c) {
      for (;"yes" == d.sheetobj.colattribs.hide[SocialCalc.rcColname(c.col)];) {
        c.col++;
      }
      for (;"yes" == d.sheetobj.rowattribs.hide[c.row];) {
        c.row++;
      }
      c.coord = SocialCalc.crToCoord(c.col, c.row);
      for (e = 0;e < d.rowpanes.length;e++) {
        f = d.rowpanes[e].first, g = d.rowpanes[e].last, c.row >= f && c.row <= g && null !== a.fullgrid && (n = a.fullgrid.childNodes[1].childNodes[2 + h + c.row - f].childNodes[0]) && (d.classnames && (n.className = d.classnames[b + "rowname"]), d.explicitStyles && (n.style.cssText = d.explicitStyles[b + "rowname"]), n.style.verticalAlign = "top"), h += g - f + 2;
      }
      for (e = 0;e < d.colpanes.length;e++) {
        f = d.colpanes[e].first, g = d.colpanes[e].last, c.col >= f && c.col <= g && null !== a.fullgrid && (n = a.fullgrid.childNodes[1].childNodes[1].childNodes[1 + l + c.col - f]) && (d.classnames && (n.className = d.classnames[b + "colname"]), d.explicitStyles && (n.style.cssText = d.explicitStyles[b + "colname"])), l += g - f + 2;
      }
    }
  }
};
SocialCalc.ECellReadonly = function(a, b) {
  !b && a.ecell && (b = a.ecell.coord);
  if (!b) {
    return!1;
  }
  var c = a.context.sheetobj.cells[b];
  return c && c.readonly;
};
SocialCalc.RangeAnchor = function(a, b) {
  a.range.hasrange && a.RangeRemove();
  a.RangeExtend(b);
};
SocialCalc.RangeExtend = function(a, b) {
  var c, d, e, f, g, h, l = a.context.highlights;
  c = a.range;
  d = a.range2;
  b ? (f = SocialCalc.coordToCr(b), f.coord = b) : f = a.ecell;
  if (f) {
    c.hasrange || (c.anchorcoord = f.coord, c.anchorrow = f.row, c.top = f.row, c.bottom = f.row, c.anchorcol = f.col, c.left = f.col, c.right = f.col, c.hasrange = !0);
    c.anchorrow < f.row ? (c.top = c.anchorrow, c.bottom = f.row) : (c.top = f.row, c.bottom = c.anchorrow);
    c.anchorcol < f.col ? (c.left = c.anchorcol, c.right = f.col) : (c.left = f.col, c.right = c.anchorcol);
    for (e in l) {
      switch(l[e]) {
        case "range":
          l[e] = "unrange";
          break;
        case "range2":
          l[e] = "unrange2";
      }
    }
    for (f = c.top;f <= c.bottom;f++) {
      for (g = c.left;g <= c.right;g++) {
        switch(e = SocialCalc.crToCoord(g, f), l[e]) {
          case "unrange":
            l[e] = "range";
            break;
          case "cursor":
            break;
          default:
            l[e] = "newrange";
        }
      }
    }
    for (f = d.top;d.hasrange && f <= d.bottom;f++) {
      for (g = d.left;g <= d.right;g++) {
        switch(e = SocialCalc.crToCoord(g, f), l[e]) {
          case "unrange2":
            l[e] = "range2";
            break;
          case "range":
          ;
          case "newrange":
          ;
          case "cursor":
            break;
          default:
            l[e] = "newrange2";
        }
      }
    }
    for (e in l) {
      switch(l[e]) {
        case "unrange":
          delete l[e];
          break;
        case "newrange":
          l[e] = "range";
          break;
        case "newrange2":
          l[e] = "range2";
          break;
        case "range":
        ;
        case "range2":
        ;
        case "cursor":
          continue;
      }
      d = SocialCalc.coordToCr(e);
      c = SocialCalc.GetEditorCellElement(a, d.row, d.col);
      a.UpdateCellCSS(c, d.row, d.col);
    }
    for (h in a.RangeChangeCallback) {
      a.RangeChangeCallback[h](a);
    }
    e = SocialCalc.crToCoord(a.range.left, a.range.top);
    if (a.range.left != a.range.right || a.range.top != a.range.bottom) {
      e += ":" + SocialCalc.crToCoord(a.range.right, a.range.bottom);
    }
    for (h in a.StatusCallback) {
      a.StatusCallback[h].func(a, "rangechange", e, a.StatusCallback[h].params);
    }
  }
};
SocialCalc.RangeRemove = function(a) {
  var b, c, d, e, f = a.context.highlights, g = a.range, h = a.range2;
  if (g.hasrange || h.hasrange) {
    for (b = h.top;h.hasrange && b <= h.bottom;b++) {
      for (c = h.left;c <= h.right;c++) {
        switch(d = SocialCalc.crToCoord(c, b), f[d]) {
          case "range":
            f[d] = "newrange2";
            break;
          case "range2":
          ;
          case "cursor":
            break;
          default:
            f[d] = "newrange2";
        }
      }
    }
    for (d in f) {
      switch(f[d]) {
        case "range":
          delete f[d];
          break;
        case "newrange2":
          f[d] = "range2";
          break;
        case "cursor":
          continue;
      }
      c = SocialCalc.coordToCr(d);
      b = SocialCalc.GetEditorCellElement(a, c.row, c.col);
      a.UpdateCellCSS(b, c.row, c.col);
    }
    g.hasrange = !1;
    for (e in a.RangeChangeCallback) {
      a.RangeChangeCallback[e](a);
    }
    for (e in a.StatusCallback) {
      a.StatusCallback[e].func(a, "rangechange", "", a.StatusCallback[e].params);
    }
  }
};
SocialCalc.Range2Remove = function(a) {
  var b, c, d, e = a.context.highlights, f = a.range2;
  if (f.hasrange) {
    for (d in e) {
      switch(e[d]) {
        case "range2":
          delete e[d];
          break;
        case "range":
        ;
        case "cursor":
          continue;
      }
      c = SocialCalc.coordToCr(d);
      b = SocialCalc.GetEditorCellElement(a, c.row, c.col);
      a.UpdateCellCSS(b, c.row, c.col);
    }
    f.hasrange = !1;
  }
};
SocialCalc.FitToEditTable = function(a) {
  var b, c, d, e = a.context, f = e.sheetobj;
  d = e.showRCHeaders ? e.rownamewidth - 0 : 0;
  for (colpane = 0;colpane < e.colpanes.length - 1;colpane++) {
    for (b = e.colpanes[colpane].first;b <= e.colpanes[colpane].last;b++) {
      if (c = SocialCalc.rcColname(b), "yes" != f.colattribs.hide[c]) {
        c = f.colattribs.width[c] || f.attribs.defaultcolwidth || SocialCalc.Constants.defaultColWidth;
        if ("blank" == c || "auto" == c) {
          c = "";
        }
        d += c && 0 < c - 0 ? c - 0 : 10;
      }
    }
  }
  for (b = e.colpanes[colpane].first;1E4 >= b;b++) {
    c = SocialCalc.rcColname(b);
    if ("yes" != f.colattribs.hide[c]) {
      c = f.colattribs.width[c] || f.attribs.defaultcolwidth || SocialCalc.Constants.defaultColWidth;
      if ("blank" == c || "auto" == c) {
        c = "";
      }
      d += c && 0 < c - 0 ? c - 0 : 10;
    }
    if (d > a.tablewidth) {
      break;
    }
  }
  e.colpanes[colpane].last = e.sheetobj.attribs.usermaxcol || b;
  d = e.showRCHeaders ? 1 : 0;
  for (b = 0;b < e.rowpanes.length - 1;b++) {
    for (d += e.rowpanes[b].last - e.rowpanes[b].first + 1, c = e.rowpanes[b].first;c <= e.rowpanes[b].last;c++) {
      "yes" == f.rowattribs.hide[c] && d--;
    }
  }
  a = a.tableheight - d * e.pixelsPerRow;
  e.rowpanes[b].last = e.sheetobj.attribs.usermaxrow || e.rowpanes[b].first + Math.floor(a / e.pixelsPerRow) + 1;
};
SocialCalc.CalculateEditorPositions = function(a) {
  var b;
  a.gridposition = SocialCalc.GetElementPosition(a.griddiv);
  b = a.griddiv.firstChild.lastChild.childNodes[1].childNodes[0];
  a.headposition = SocialCalc.GetElementPosition(b);
  a.headposition.left += b.offsetWidth;
  a.headposition.top += b.offsetHeight;
  a.rowpositions = [];
  for (b = 0;b < a.context.rowpanes.length;b++) {
    a.CalculateRowPositions(b, a.rowpositions, a.rowheight);
  }
  for (b = 0;b < a.rowpositions.length && !(a.rowpositions[b] > a.gridposition.top + a.tableheight);b++) {
  }
  a.lastvisiblerow = b - 1;
  a.colpositions = [];
  for (b = 0;b < a.context.colpanes.length;b++) {
    a.CalculateColPositions(b, a.colpositions, a.colwidth);
  }
  for (b = 0;b < a.colpositions.length && !(a.colpositions[b] > a.gridposition.left + a.tablewidth);b++) {
  }
  a.lastvisiblecol = b - 1;
  for (a.firstscrollingrow = a.context.rowpanes[a.context.rowpanes.length - 1].first;"yes" == a.context.sheetobj.rowattribs.hide[a.firstscrollingrow];) {
    a.firstscrollingrow++;
  }
  a.firstscrollingrowtop = a.rowpositions[a.firstscrollingrow] || a.headposition.top;
  a.lastnonscrollingrow = 0 < a.context.rowpanes.length - 1 ? a.context.rowpanes[a.context.rowpanes.length - 2].last : 0;
  for (a.firstscrollingcol = a.context.colpanes[a.context.colpanes.length - 1].first;"yes" == a.context.sheetobj.colattribs.hide[SocialCalc.rcColname(a.firstscrollingcol)];) {
    a.firstscrollingcol++;
  }
  a.firstscrollingcolleft = a.colpositions[a.firstscrollingcol] || a.headposition.left;
  a.lastnonscrollingcol = 0 < a.context.colpanes.length - 1 ? a.context.colpanes[a.context.colpanes.length - 2].last : 0;
  a.verticaltablecontrol.ComputeTableControlPositions();
  a.horizontaltablecontrol.ComputeTableControlPositions();
};
SocialCalc.ScheduleRender = function(a) {
  a.timeout && window.clearTimeout(a.timeout);
  SocialCalc.EditorSheetStatusCallback(null, "schedrender", null, a);
  a.timeout = window.setTimeout(function() {
    SocialCalc.DoRenderStep(a);
  }, 1);
};
SocialCalc.DoRenderStep = function(a) {
  a.timeout = null;
  a.EditorRenderSheet();
  SocialCalc.EditorSheetStatusCallback(null, "renderdone", null, a);
  SocialCalc.EditorSheetStatusCallback(null, "schedposcalc", null, a);
  a.timeout = window.setTimeout(function() {
    SocialCalc.DoPositionCalculations(a);
  }, 1);
};
SocialCalc.SchedulePositionCalculations = function(a) {
  SocialCalc.EditorSheetStatusCallback(null, "schedposcalc", null, a);
  a.timeout = window.setTimeout(function() {
    SocialCalc.DoPositionCalculations(a);
  }, 1);
};
SocialCalc.DoPositionCalculations = function(a) {
  a.timeout = null;
  a.CalculateEditorPositions();
  a.verticaltablecontrol.PositionTableControlElements();
  a.horizontaltablecontrol.PositionTableControlElements();
  SocialCalc.EditorSheetStatusCallback(null, "doneposcalc", null, a);
  a.ensureecell && a.ecell && !a.deferredCommands.length && (a.ensureecell = !1, a.EnsureECellVisible());
  a.cellhandles.ShowCellHandles(!0);
};
SocialCalc.CalculateRowPositions = function(a, b, c, d) {
  var e, f, g, h = a.context, l;
  if (h.showRCHeaders) {
    l = a.fullgrid.lastChild;
    a = 2;
    for (e = 0;e < b;e++) {
      a += h.rowpanes[e].last - h.rowpanes[e].first + 2;
    }
    f = 0;
    for (b = h.rowpanes[e].first;b <= h.rowpanes[e].last;b++) {
      g = l.childNodes[a + f], f++, g && !c[b] && (c[b] = g.firstChild.offsetTop, d[b] = g.firstChild.offsetHeight);
    }
  }
};
SocialCalc.CalculateColPositions = function(a, b, c, d) {
  var e, f, g, h, l = a.context;
  if (l.showRCHeaders) {
    f = a.fullgrid.lastChild;
    a = 1;
    for (e = 0;e < b;e++) {
      a += l.colpanes[e].last - l.colpanes[e].first + 2;
    }
    g = f.childNodes[1];
    f = 0;
    for (b = l.colpanes[e].first;b <= l.colpanes[e].last;b++) {
      h = SocialCalc.GetElementPosition(g.childNodes[a + f]), c[b] || (c[b] = h.left, g.childNodes[a + f] && (d[b] = g.childNodes[a + f].offsetWidth)), f++;
    }
  }
};
SocialCalc.ScrollRelative = function(a, b, c) {
  b ? a.ScrollRelativeBoth(c, 0) : a.ScrollRelativeBoth(0, c);
};
SocialCalc.ScrollRelativeBoth = function(a, b, c) {
  var d = a.context, e = 0 < b ? 1 : -1, f = 0 < c ? 1 : -1, g = d.rowpanes.length, h = 1 < g ? d.rowpanes[g - 2].last + 1 : 1;
  d.rowpanes[g - 1].first + b < h && (b = -d.rowpanes[g - 1].first + h);
  var h = d.colpanes.length, l = 1 < h ? d.colpanes[h - 2].last + 1 : 1;
  for (d.colpanes[h - 1].first + c < l && (c = -d.colpanes[h - 1].first + l);"yes" == d.sheetobj.colattribs.hide[SocialCalc.rcColname(d.colpanes[h - 1].first + c)];) {
    if (c += f, 1 > c) {
      c = 0;
      break;
    }
  }
  for (;"yes" == d.sheetobj.rowattribs.hide[d.rowpanes[g - 1].first + b];) {
    if (b += e, 1 > b) {
      b = 0;
      break;
    }
  }
  if ((1 == b || -1 == b) && 0 == c) {
    1 == b ? a.ScrollTableUpOneRow() : a.ScrollTableDownOneRow(), a.ecell && a.SetECellHeaders("selected"), a.SchedulePositionCalculations();
  } else {
    if (0 != b || 0 != c) {
      d.rowpanes[g - 1].first += b, d.rowpanes[g - 1].last += b, d.colpanes[h - 1].first += c, d.colpanes[h - 1].last += c, a.LimitLastPanes(), a.FitToEditTable(), a.ScheduleRender();
    }
  }
};
SocialCalc.PageRelative = function(a, b, c) {
  var d = a.context, e = b ? "rowpanes" : "colpanes", d = d[e][d[e].length - 1], f = b ? "lastvisiblerow" : "lastvisiblecol", e = b ? a.rowheight : a.colwidth, g = b ? SocialCalc.Constants.defaultAssumedRowHeight : SocialCalc.Constants.defaultColWidth;
  if (0 < c) {
    b = a[f], b == d.first && (b += 1);
  } else {
    c = b ? a.tableheight - (a.firstscrollingrowtop - a.gridposition.top) : a.tablewidth - (a.firstscrollingcolleft - a.gridposition.left);
    c -= 0 < e[a[f]] ? e[a[f]] : g;
    for (b = d.first - 1;0 < b;b--) {
      f = 0 < e[b] ? e[b] : g;
      if (c < f) {
        break;
      }
      c -= f;
    }
    e = d.first;
    b >= e && (b = e - 1);
    1 > b && (b = 1);
  }
  d.first = b;
  d.last = b + 1;
  a.LimitLastPanes();
  a.FitToEditTable();
  a.ScheduleRender();
};
SocialCalc.LimitLastPanes = function(a) {
  a = a.context;
  var b;
  b = a.rowpanes.length;
  1 < b && a.rowpanes[b - 1].first <= a.rowpanes[b - 2].last && (a.rowpanes[b - 1].first = a.rowpanes[b - 2].last + 1);
  a.sheetobj.attribs.usermaxrow && a.rowpanes[b - 1].first > a.sheetobj.attribs.usermaxrow && (a.rowpanes[b - 1].first = a.sheetobj.attribs.usermaxrow);
  b = a.colpanes.length;
  1 < b && a.colpanes[b - 1].first <= a.colpanes[b - 2].last && (a.colpanes[b - 1].first = a.colpanes[b - 2].last + 1);
  a.sheetobj.attribs.usermaxcol && a.colpanes[b - 1].first > a.sheetobj.attribs.usermaxcol && (a.colpanes[b - 1].first = a.sheetobj.attribs.usermaxcol);
};
SocialCalc.ScrollTableUpOneRow = function(a) {
  var b, c, d, e, f, g, h = {}, l = a.context, n = l.sheetobj, p = a.fullgrid, r;
  r = p.lastChild;
  b = l.showRCHeaders ? 2 : 1;
  for (c = 0;c < l.rowpanes.length - 1;c++) {
    b += l.rowpanes[c].last - l.rowpanes[c].first + 2;
  }
  if (l.sheetobj.attribs.usermaxrow && 1 > l.sheetobj.attribs.usermaxrow - l.rowpanes[c].first) {
    return p;
  }
  r.removeChild(r.childNodes[b]);
  l.rowpanes[c].first++;
  l.rowpanes[c].last++;
  a.FitToEditTable();
  l.CalculateColWidthData();
  l.sheetobj.attribs.usermaxrow && l.rowpanes[c].last == l.sheetobj.attribs.usermaxrow || (a = l.RenderRow(l.rowpanes[c].last, c), r.appendChild(a));
  maxrowspan = 1;
  a = l.rowpanes[c].first - 1;
  for (f = 0;f < l.colpanes.length;f++) {
    for (e = l.colpanes[f].first;e <= l.colpanes[f].last;e++) {
      coord = SocialCalc.crToCoord(e, a), l.cellskip[coord] || (g = n.cells[coord]) && g.rowspan > maxrowspan && (maxrowspan = g.rowspan);
    }
  }
  if (1 < maxrowspan) {
    for (d = 1;d < maxrowspan && !(d + a >= l.rowpanes[c].last);d++) {
      e = l.RenderRow(d + a, c), f = r.childNodes[b + d - 1], r.replaceChild(e, f);
    }
  }
  a = l.rowpanes[c].last;
  for (f = 0;f < l.colpanes.length;f++) {
    for (e = l.colpanes[f].first;e <= l.colpanes[f].last;e++) {
      if (coord = l.cellskip[SocialCalc.crToCoord(e, a)]) {
        d = l.coordToCR[coord].row - 0, d == l.rowpanes[c].last || d < l.rowpanes[c].first || (g = n.cells[coord]) && 1 < g.rowspan && (h[d] = !0);
      }
    }
  }
  for (d in h) {
    e = l.RenderRow(d, c), f = r.childNodes[b + (d - l.rowpanes[c].first)], r.replaceChild(e, f);
  }
  return p;
};
SocialCalc.ScrollTableDownOneRow = function(a) {
  var b, c, d, e, f, g, h = {}, l = a.context, n = l.sheetobj, p = a.fullgrid, r;
  r = p.lastChild;
  b = l.showRCHeaders ? 2 : 1;
  for (c = 0;c < l.rowpanes.length - 1;c++) {
    b += l.rowpanes[c].last - l.rowpanes[c].first + 2;
  }
  l.sheetobj.attribs.usermaxrow || r.removeChild(r.childNodes[b + (l.rowpanes[c].last - l.rowpanes[c].first)]);
  l.rowpanes[c].first--;
  l.rowpanes[c].last--;
  a.FitToEditTable();
  l.CalculateColWidthData();
  e = l.RenderRow(l.rowpanes[c].first, c);
  r.insertBefore(e, r.childNodes[b]);
  maxrowspan = 1;
  a = l.rowpanes[c].first;
  for (f = 0;f < l.colpanes.length;f++) {
    for (e = l.colpanes[f].first;e <= l.colpanes[f].last;e++) {
      coord = SocialCalc.crToCoord(e, a), l.cellskip[coord] || (g = n.cells[coord]) && g.rowspan > maxrowspan && (maxrowspan = g.rowspan);
    }
  }
  if (1 < maxrowspan) {
    for (d = 1;d < maxrowspan && !(d + a > l.rowpanes[c].last);d++) {
      e = l.RenderRow(d + a, c), f = r.childNodes[b + d], r.replaceChild(e, f);
    }
  }
  a = l.rowpanes[c].last;
  for (f = 0;f < l.colpanes.length;f++) {
    for (e = l.colpanes[f].first;e <= l.colpanes[f].last;e++) {
      if (coord = SocialCalc.crToCoord(e, a), (g = n.cells[coord]) && 1 < g.rowspan) {
        h[a] = !0;
      } else {
        if (coord = l.cellskip[SocialCalc.crToCoord(e, a)]) {
          d = l.coordToCR[coord].row - 0, d == a || d < l.rowpanes[c].first || (g = n.cells[coord]) && 1 < g.rowspan && (h[d] = !0);
        }
      }
    }
  }
  for (d in h) {
    e = l.RenderRow(d, c), f = r.childNodes[b + (d - l.rowpanes[c].first)], r.replaceChild(e, f);
  }
  return p;
};
SocialCalc.InputBox = function(a, b) {
  a && (this.element = a, this.editor = b, this.inputEcho = null, b.inputBox = this, a.onmousedown = SocialCalc.InputBoxOnMouseDown, b.MoveECellCallback.formulabar = function(a) {
    "start" == a.state && b.inputBox.DisplayCellContents(a.ecell.coord);
  });
};
SocialCalc.InputBox.prototype.DisplayCellContents = function(a) {
  SocialCalc.InputBoxDisplayCellContents(this, a);
};
SocialCalc.InputBox.prototype.ShowInputBox = function(a) {
  this.editor.inputEcho.ShowInputEcho(a);
};
SocialCalc.InputBox.prototype.GetText = function() {
  return this.element.value;
};
SocialCalc.InputBox.prototype.SetText = function(a) {
  this.element && (this.element.value = a, this.editor.inputEcho.SetText(a + "_"));
};
SocialCalc.InputBox.prototype.Focus = function() {
  SocialCalc.InputBoxFocus(this);
};
SocialCalc.InputBox.prototype.Blur = function() {
  return this.element.blur();
};
SocialCalc.InputBox.prototype.Select = function(a) {
  if (this.element) {
    switch(a) {
      case "end":
        if (document.selection && document.selection.createRange) {
          try {
            var b = document.selection.createRange().duplicate();
            b.moveToElementText(this.element);
            b.collapse(!1);
            b.select();
          } catch (c) {
            void 0 != this.element.selectionStart && (this.element.selectionStart = this.element.value.length, this.element.selectionEnd = this.element.value.length);
          }
        } else {
          void 0 != this.element.selectionStart && (this.element.selectionStart = this.element.value.length, this.element.selectionEnd = this.element.value.length);
        }
      ;
    }
  }
};
SocialCalc.InputBoxDisplayCellContents = function(a, b) {
  var c = SocialCalc.Constants;
  if (a) {
    if (!b) {
      if (!a.editor.ecell) {
        return;
      }
      b = a.editor.ecell.coord;
    }
    var d = SocialCalc.GetCellContents(a.editor.context.sheetobj, b);
    -1 != d.indexOf("\n") ? (d = c.s_inputboxdisplaymultilinetext, a.element.disabled = !0) : a.editor.ECellReadonly() ? a.element.disabled = !0 : a.element.disabled = !1;
    a.SetText(d);
  }
};
SocialCalc.InputBoxFocus = function(a) {
  if (a) {
    a.element.focus();
    a = a.editor;
    a.state = "input";
    var b = a.workingvalues;
    b.partialexpr = "";
    b.ecoord = a.ecell.coord;
    b.erow = a.ecell.row;
    b.ecol = a.ecell.col;
  }
};
SocialCalc.InputBoxOnMouseDown = function(a) {
  a = SocialCalc.Keyboard.focusTable;
  if (!a) {
    return!0;
  }
  var b = a.workingvalues;
  switch(a.state) {
    case "start":
      a.state = "inputboxdirect";
      b.partialexpr = "";
      b.ecoord = a.ecell.coord;
      b.erow = a.ecell.row;
      b.ecol = a.ecell.col;
      a.inputEcho.ShowInputEcho(!0);
      break;
    case "input":
      b.partialexpr = "", a.MoveECell(b.ecoord), a.state = "inputboxdirect", SocialCalc.KeyboardFocus();
  }
};
SocialCalc.InputEcho = function(a) {
  var b = SocialCalc.Constants;
  this.editor = a;
  this.text = "";
  this.functionbox = this.hint = this.prompt = this.main = this.container = this.interval = null;
  this.container = document.createElement("div");
  SocialCalc.setStyles(this.container, "display:none;position:absolute;zIndex:10;");
  this.main = document.createElement("div");
  b.defaultInputEchoClass && (this.main.className = b.defaultInputEchoClass);
  b.defaultInputEchoStyle && SocialCalc.setStyles(this.main, b.defaultInputEchoStyle);
  this.main.innerHTML = "&nbsp;";
  this.hint = document.createElement("div");
  b.defaultInputEchoHintClass && (this.hint.className = b.defaultInputEchoHintClass);
  b.defaultInputEchoHintStyle && SocialCalc.setStyles(this.hint, b.defaultInputEchoHintStyle);
  this.hint.innerHTML = "";
  this.container.appendChild(this.hint);
  this.container.appendChild(this.main);
  this.prompt = document.createElement("div");
  b.defaultInputEchoPromptClass && (this.prompt.className = b.defaultInputEchoPromptClass);
  b.defaultInputEchoPromptStyle && SocialCalc.setStyles(this.prompt, b.defaultInputEchoPromptStyle);
  this.prompt.innerHTML = "";
  this.container.appendChild(this.prompt);
  SocialCalc.DragRegister(this.main, !0, !0, {MouseDown:SocialCalc.DragFunctionStart, MouseMove:SocialCalc.DragFunctionPosition, MouseUp:SocialCalc.DragFunctionPosition, Disabled:null, positionobj:this.container}, this.editor.toplevel);
  a.toplevel.appendChild(this.container);
};
SocialCalc.InputEcho.prototype.ShowInputEcho = function(a) {
  return SocialCalc.ShowInputEcho(this, a);
};
SocialCalc.InputEcho.prototype.SetText = function(a) {
  return SocialCalc.SetInputEchoText(this, a);
};
SocialCalc.ShowInputEcho = function(a, b) {
  var c, d = a.editor;
  if (d) {
    if (b) {
      d.cellhandles.ShowCellHandles(!1);
      if (c = SocialCalc.GetEditorCellElement(d, d.ecell.row, d.ecell.col)) {
        c = SocialCalc.GetElementPosition(c.element), a.container.style.left = c.left - 1 + "px", a.container.style.top = c.top - 1 + "px";
      }
      a.hint.innerHTML = d.ecell.coord;
      a.container.style.display = "block";
      a.interval && window.clearInterval(a.interval);
      a.interval = window.setInterval(SocialCalc.InputEchoHeartbeat, 50);
    } else {
      a.interval && window.clearInterval(a.interval), a.container.style.display = "none";
    }
  }
};
SocialCalc.SetInputEchoText = function(a, b) {
  var c = SocialCalc.Constants, d;
  d = SocialCalc.special_chars(b);
  d = d.replace(/\n/g, "<br>");
  a.text != d && (a.main.innerHTML = d, a.text = d);
  d = b.match(/.*[\+\-\*\/\&\^\<\>\=\,\(]([A-Za-z][A-Za-z][\w\.]*?)\([^\)]*$/);
  "=" == b.charAt(0) && d ? (d = d[1].toUpperCase(), SocialCalc.Formula.FunctionList[d] ? (SocialCalc.Formula.FillFunctionInfo(), c = SocialCalc.special_chars(d + "(" + SocialCalc.Formula.FunctionArgString(d) + ")")) : c = c.ietUnknownFunction + d, a.prompt.innerHTML != c && (a.prompt.innerHTML = c, a.prompt.style.display = "block")) : "none" != a.prompt.style.display && (a.prompt.innerHTML = "", a.prompt.style.display = "none");
};
SocialCalc.InputEchoHeartbeat = function() {
  var a = SocialCalc.Keyboard.focusTable;
  if (!a) {
    return!0;
  }
  a.inputEcho.SetText(a.inputBox.GetText() + "_");
};
SocialCalc.InputEchoMouseDown = function(a) {
  a = SocialCalc.Keyboard.focusTable;
  if (!a) {
    return!0;
  }
  a.inputBox.element.focus();
};
SocialCalc.CellHandles = function(a) {
  if (!a.noEdit) {
    this.editor = a;
    this.movedmouse = this.noCursorSuffix = !1;
    this.draghandle = document.createElement("div");
    SocialCalc.setStyles(this.draghandle, "display:none;position:absolute;zIndex:8;border:1px solid white;width:4px;height:4px;fontSize:1px;backgroundColor:#0E93D8;cursor:default;");
    this.draghandle.innerHTML = "&nbsp;";
    a.toplevel.appendChild(this.draghandle);
    SocialCalc.AssignID(a, this.draghandle, "draghandle");
    var b = "png";
    navigator.userAgent.match(/MSIE 6\.0/) && (b = "gif");
    this.dragpalette = document.createElement("div");
    SocialCalc.setStyles(this.dragpalette, "display:none;position:absolute;zIndex:8;width:90px;height:90px;fontSize:1px;textAlign:center;cursor:default;backgroundImage:url(" + SocialCalc.Constants.defaultImagePrefix + "drag-handles." + b + ");");
    this.dragpalette.innerHTML = "&nbsp;";
    a.toplevel.appendChild(this.dragpalette);
    SocialCalc.AssignID(a, this.dragpalette, "dragpalette");
    this.dragtooltip = document.createElement("div");
    SocialCalc.setStyles(this.dragtooltip, "display:none;position:absolute;zIndex:9;border:1px solid black;width:100px;height:auto;fontSize:10px;backgroundColor:#FFFFFF;");
    this.dragtooltip.innerHTML = "&nbsp;";
    a.toplevel.appendChild(this.dragtooltip);
    SocialCalc.AssignID(a, this.dragtooltip, "dragtooltip");
    this.fillinghandle = document.createElement("div");
    SocialCalc.setStyles(this.fillinghandle, "display:none;position:absolute;zIndex:9;border:1px solid black;width:auto;height:14px;fontSize:10px;backgroundColor:#FFFFFF;");
    this.fillinghandle.innerHTML = "&nbsp;";
    a.toplevel.appendChild(this.fillinghandle);
    SocialCalc.AssignID(a, this.fillinghandle, "fillinghandle");
    if (this.draghandle.addEventListener) {
      this.draghandle.addEventListener("mousemove", SocialCalc.CellHandlesMouseMoveOnHandle, !1), this.dragpalette.addEventListener("mousedown", SocialCalc.CellHandlesMouseDown, !1), this.dragpalette.addEventListener("mousemove", SocialCalc.CellHandlesMouseMoveOnHandle, !1);
    } else {
      if (this.draghandle.attachEvent) {
        this.draghandle.attachEvent("onmousemove", SocialCalc.CellHandlesMouseMoveOnHandle), this.dragpalette.attachEvent("onmousedown", SocialCalc.CellHandlesMouseDown), this.dragpalette.attachEvent("onmousemove", SocialCalc.CellHandlesMouseMoveOnHandle);
      } else {
        throw "Browser not supported";
      }
    }
  }
};
SocialCalc.CellHandles.prototype.ShowCellHandles = function(a, b) {
  return SocialCalc.ShowCellHandles(this, a, b);
};
SocialCalc.ShowCellHandles = function(a, b, c) {
  var d = a.editor, e = !1, f, g, h = 1, l = 1;
  if (d) {
    if (b && (f = d.ecell.row, g = d.ecell.col, "start" == d.state && !(f >= d.lastvisiblerow || g >= d.lastvisiblecol || f < d.firstscrollingrow || g < d.firstscrollingcol))) {
      for (;"yes" == d.context.sheetobj.colattribs.hide[SocialCalc.rcColname(g + h)];) {
        h++;
      }
      for (;"yes" == d.context.sheetobj.rowattribs.hide[f + l];) {
        l++;
      }
      b = d.context.sheetobj.cells[SocialCalc.crToCoord(g + h - 1, f + l - 1)];
      "undefined" != typeof b && (h += (b.colspan || 1) - 1, l += (b.rowspan || 1) - 1);
      d.rowpositions[f + l] + 20 > d.horizontaltablecontrol.controlborder || d.rowpositions[f + l] - 10 < d.headposition.top || d.colpositions[g + h] + 20 > d.verticaltablecontrol.controlborder || d.colpositions[g + h] - 30 < d.headposition.left || (a.draghandle.style.left = d.colpositions[g + h] - 1 + "px", a.draghandle.style.top = d.rowpositions[f + l] - 1 + "px", a.draghandle.style.display = "block", c && (a.draghandle.style.display = "none", a.dragpalette.style.left = d.colpositions[g + h] - 
      45 + "px", a.dragpalette.style.top = d.rowpositions[f + l] - 45 + "px", a.dragpalette.style.display = "block", a.dragtooltip.style.left = d.colpositions[g + h] - 45 + "px", a.dragtooltip.style.top = d.rowpositions[f + l] + 45 + "px", a.dragtooltip.style.display = "none"), e = !0);
    }
    e || (a.draghandle.style.display = "none");
    c || (a.dragpalette.style.display = "none", a.dragtooltip.style.display = "none");
  }
};
SocialCalc.CellHandlesMouseMoveOnHandle = function(a) {
  var b = SocialCalc.Constants, c = a || window.event, d = c.target || c.srcElement, e = SocialCalc.Keyboard.focusTable;
  if (!e) {
    return!0;
  }
  a = e.cellhandles;
  if (!a.editor) {
    return!0;
  }
  var f = SocialCalc.GetElementPositionWithScroll(e.toplevel), g = c.clientX - f.left, c = c.clientY - f.top;
  if (!e.cellhandles.mouseDown) {
    e.cellhandles.ShowCellHandles(!0, !0);
    if (d == a.dragpalette) {
      b = SocialCalc.SegmentDivHit([b.CH_radius1, b.CH_radius2], e.cellhandles.dragpalette, g, c);
      if (0 == b) {
        SocialCalc.CellHandlesHoverTimeout();
        return;
      }
      a.tooltipstimer && (window.clearTimeout(a.tooltipstimer), a.tooltipstimer = null);
      a.tooltipswhichhandle = b;
      a.tooltipstimer = window.setTimeout(SocialCalc.CellHandlesTooltipsTimeout, 700);
    }
    a.timer && (window.clearTimeout(a.timer), a.timer = null);
    a.timer = window.setTimeout(SocialCalc.CellHandlesHoverTimeout, 3E3);
  }
};
SocialCalc.SegmentDivHit = function(a, b, c, d) {
  var e = b.offsetWidth, f = b.offsetHeight, g = b.offsetLeft;
  b = b.offsetTop;
  var h = 0, l = a, n = Math.sqrt(Math.pow(c - g - (e / 2 - 0.5), 2) + Math.pow(d - b - (f / 2 - 0.5), 2));
  if (2 == l.length) {
    return c >= g && c < g + e / 2 && d >= b && d < b + f / 2 && (n <= a[0] ? h = -1 : n <= a[1] && (h = 1)), c >= g + e / 2 && c < g + e && d >= b && d < b + f / 2 && (n <= a[0] ? h = -2 : n <= a[1] && (h = 2)), c >= g + e / 2 && c < g + e && d >= b + f / 2 && d < b + f && (n <= a[0] ? h = -3 : n <= a[1] && (h = 3)), c >= g && c < g + e / 2 && d >= b + f / 2 && d < b + f && (n <= a[0] ? h = -4 : n <= a[1] && (h = 4)), h;
  }
  for (;;) {
    if (c >= g && c < g + e / 2 && d >= b && d < b + f / 2) {
      quadrant += "1";
      h = l[0];
      if ("number" == typeof h) {
        break;
      }
      l = h;
      e /= 2;
      f /= 2;
    } else {
      if (c >= g + e / 2 && c < g + e && d >= b && d < b + f / 2) {
        quadrant += "2";
        h = l[1];
        if ("number" == typeof h) {
          break;
        }
        l = h;
        e /= 2;
        g += e;
        f /= 2;
      } else {
        if (c >= g + e / 2 && c < g + e && d >= b + f / 2 && d < b + f) {
          quadrant += "3";
          h = l[2];
          if ("number" == typeof h) {
            break;
          }
          l = h;
          e /= 2;
          g += e;
          f /= 2;
          b += f;
        } else {
          if (c >= g && c < g + e / 2 && d >= b + f / 2 && d < b + f) {
            quadrant += "4";
            h = l[3];
            if ("number" == typeof h) {
              break;
            }
            l = h;
            e /= 2;
            f /= 2;
            b += f;
          } else {
            return 0;
          }
        }
      }
    }
  }
  return h;
};
SocialCalc.CellHandlesHoverTimeout = function() {
  editor = SocialCalc.Keyboard.focusTable;
  if (!editor) {
    return!0;
  }
  var a = editor.cellhandles;
  a.timer && (window.clearTimeout(a.timer), a.timer = null);
  a.tooltipstimer && (window.clearTimeout(a.tooltipstimer), a.tooltipstimer = null);
  editor.cellhandles.ShowCellHandles(!0, !1);
};
SocialCalc.CellHandlesTooltipsTimeout = function() {
  editor = SocialCalc.Keyboard.focusTable;
  if (!editor) {
    return!0;
  }
  var a = editor.cellhandles;
  a.tooltipstimer && (window.clearTimeout(a.tooltipstimer), a.tooltipstimer = null);
  var b = a.tooltipswhichhandle;
  if (0 == b) {
    SocialCalc.CellHandlesHoverTimeout();
  } else {
    if (-3 == b) {
      a.dragtooltip.innerHTML = scc.s_CHfillAllTooltip;
    } else {
      if (3 == b) {
        a.dragtooltip.innerHTML = scc.s_CHfillContentsTooltip;
      } else {
        if (-2 == b) {
          a.dragtooltip.innerHTML = scc.s_CHmovePasteAllTooltip;
        } else {
          if (-4 == b) {
            a.dragtooltip.innerHTML = scc.s_CHmoveInsertAllTooltip;
          } else {
            if (2 == b) {
              a.dragtooltip.innerHTML = scc.s_CHmovePasteContentsTooltip;
            } else {
              if (4 == b) {
                a.dragtooltip.innerHTML = scc.s_CHmoveInsertContentsTooltip;
              } else {
                a.dragtooltip.innerHTML = "&nbsp;";
                a.dragtooltip.style.display = "none";
                return;
              }
            }
          }
        }
      }
    }
    a.dragtooltip.style.display = "block";
  }
};
SocialCalc.CellHandlesMouseDown = function(a) {
  var b = SocialCalc.Constants, c, d = a || window.event, e = SocialCalc.EditorMouseInfo;
  a = SocialCalc.Keyboard.focusTable;
  if (!a) {
    return!0;
  }
  if (!a.busy) {
    var f = a.cellhandles;
    f.movedmouse = !1;
    var g = SocialCalc.GetElementPositionWithScroll(a.toplevel), h = d.clientX - g.left, g = d.clientY - g.top;
    f.timer && (window.clearTimeout(f.timer), f.timer = null);
    f.tooltipstimer && (window.clearTimeout(f.tooltipstimer), f.tooltipstimer = null);
    f.dragtooltip.innerHTML = "&nbsp;";
    f.dragtooltip.style.display = "none";
    c = a.range;
    var l = SocialCalc.SegmentDivHit([b.CH_radius1, b.CH_radius2], a.cellhandles.dragpalette, h, g);
    if (1 == l || -1 == l || 0 == l) {
      f.ShowCellHandles(!0, !1);
    } else {
      e.ignore = !0;
      -3 == l ? (f.dragtype = "Fill", f.noCursorSuffix = !1) : 3 == l ? (f.dragtype = "FillC", f.noCursorSuffix = !1) : -2 == l ? (f.dragtype = "Move", f.noCursorSuffix = !0) : -4 == l ? (f.dragtype = "MoveI", f.noCursorSuffix = !1) : 2 == l ? (f.dragtype = "MoveC", f.noCursorSuffix = !0) : 4 == l && (f.dragtype = "MoveIC", f.noCursorSuffix = !1);
      f.filltype = null;
      switch(f.dragtype) {
        case "Fill":
        ;
        case "FillC":
          c.hasrange || a.RangeAnchor();
          a.range2.top = a.range.top;
          a.range2.right = a.range.right;
          a.range2.bottom = a.range.bottom;
          a.range2.left = a.range.left;
          a.range2.hasrange = !0;
          break;
        case "Move":
        ;
        case "MoveI":
        ;
        case "MoveC":
        ;
        case "MoveIC":
          c.hasrange || a.RangeAnchor();
          a.range2.top = a.range.top;
          a.range2.right = a.range.right;
          a.range2.bottom = a.range.bottom;
          a.range2.left = a.range.left;
          a.range2.hasrange = !0;
          a.RangeRemove();
          break;
        default:
          return;
      }
      f.fillinghandle.style.left = h + "px";
      f.fillinghandle.style.top = g - 17 + "px";
      f.fillinghandle.innerHTML = b.s_CHindicatorOperationLookup[f.dragtype] + (b.s_CHindicatorDirectionLookup[a.cellhandles.filltype] || "");
      f.fillinghandle.style.display = "block";
      f.ShowCellHandles(!0, !1);
      f.mouseDown = !0;
      e.editor = a;
      b = a.ecell.coord;
      f.startingcoord = b;
      f.startingX = h;
      f.startingY = g;
      e.mouselastcoord = b;
      SocialCalc.KeyboardSetFocus(a);
      document.addEventListener ? (document.addEventListener("mousemove", SocialCalc.CellHandlesMouseMove, !0), document.addEventListener("mouseup", SocialCalc.CellHandlesMouseUp, !0)) : f.draghandle.attachEvent && (f.draghandle.setCapture(), f.draghandle.attachEvent("onmousemove", SocialCalc.CellHandlesMouseMove), f.draghandle.attachEvent("onmouseup", SocialCalc.CellHandlesMouseUp), f.draghandle.attachEvent("onlosecapture", SocialCalc.CellHandlesMouseUp));
      SocialCalc.StopPropagation(d);
    }
  }
};
SocialCalc.CellHandlesMouseMove = function(a) {
  var b = SocialCalc.Constants, c, d, e, f = a || window.event, g = SocialCalc.EditorMouseInfo;
  if (a = g.editor) {
    var h = a.cellhandles;
    c = SocialCalc.GetElementPositionWithScroll(a.toplevel);
    var l = f.clientX - c.left, n = f.clientY - c.top;
    if (c = SocialCalc.GridMousePosition(a, l, n)) {
      if (c && !c.coord) {
        SocialCalc.SetDragAutoRepeat(a, c, SocialCalc.CellHandlesDragAutoRepeat);
      } else {
        if (SocialCalc.SetDragAutoRepeat(a, null), c.coord) {
          d = SocialCalc.coordToCr(a.cellhandles.startingcoord);
          e = SocialCalc.coordToCr(c.coord);
          h.movedmouse = !0;
          switch(h.dragtype) {
            case "Fill":
            ;
            case "FillC":
              c.coord == h.startingcoord ? (h.filltype = null, h.startingX = l, h.startingY = n) : h.filltype ? "Down" == h.filltype ? (e.col = d.col, e.row < d.row && (e.row = d.row)) : (e.row = d.row, e.col < d.col && (e.col = d.col)) : (10 < Math.abs(n - h.startingY) ? h.filltype = "Down" : 10 < Math.abs(l - h.startingX) && (h.filltype = "Right"), e.col = d.col, e.row = d.row);
              c.coord = SocialCalc.crToCoord(e.col, e.row);
              c.coord != g.mouselastcoord && (a.MoveECell(c.coord), a.RangeExtend());
              break;
            case "Move":
            ;
            case "MoveC":
              c.coord != g.mouselastcoord && (a.MoveECell(c.coord), d = a.range2.right - a.range2.left + c.col, e = a.range2.bottom - a.range2.top + c.row, a.RangeAnchor(SocialCalc.crToCoord(d, e)), a.RangeExtend());
              break;
            case "MoveI":
            ;
            case "MoveIC":
              c.coord == h.startingcoord ? (h.filltype = null, h.startingX = l, h.startingY = n) : h.filltype ? "Vertical" == h.filltype ? (e.col = a.range2.left, e.row >= a.range2.top && e.row <= a.range2.bottom + 1 && (e.row = a.range2.bottom + 2)) : (e.row = a.range2.top, e.col >= a.range2.left && e.col <= a.range2.right + 1 && (e.col = a.range2.right + 2)) : (10 < Math.abs(n - h.startingY) ? h.filltype = "Vertical" : 10 < Math.abs(l - h.startingX) && (h.filltype = "Horizontal"), e.col = d.col, 
              e.row = d.row), c.coord = SocialCalc.crToCoord(e.col, e.row), c.coord != g.mouselastcoord && (a.MoveECell(c.coord), h.filltype ? (d = a.range2.right - a.range2.left + e.col, e = a.range2.bottom - a.range2.top + e.row, a.RangeAnchor(SocialCalc.crToCoord(d, e)), a.RangeExtend()) : a.RangeRemove());
          }
          h.fillinghandle.style.left = l + "px";
          h.fillinghandle.style.top = n - 17 + "px";
          h.fillinghandle.innerHTML = b.s_CHindicatorOperationLookup[h.dragtype] + (b.s_CHindicatorDirectionLookup[a.cellhandles.filltype] || "");
          h.fillinghandle.style.display = "block";
          g.mouselastcoord = c.coord;
          SocialCalc.StopPropagation(f);
        }
      }
    }
  }
};
SocialCalc.CellHandlesDragAutoRepeat = function(a, b) {
  var c = SocialCalc.EditorMouseInfo, d = c.editor;
  if (d) {
    var e = d.cellhandles, f = SocialCalc.coordToCr(d.cellhandles.startingcoord), g = SocialCalc.coordToCr(a), h, l = 0, n = 0;
    "left" == b ? n = -1 : "right" == b ? n = 1 : "up" == b ? l = -1 : "down" == b && (l = 1);
    d.ScrollRelativeBoth(l, n);
    switch(e.dragtype) {
      case "Fill":
      ;
      case "FillC":
        e.filltype ? "Down" == e.filltype ? (g.col = f.col, g.row < f.row && (g.row = f.row)) : (g.row = f.row, g.col < f.col && (g.col = f.col)) : (g.col = f.col, g.row = f.row);
        h = SocialCalc.crToCoord(g.col, g.row);
        h != c.mouselastcoord && (d.MoveECell(a), d.RangeExtend());
        break;
      case "Move":
      ;
      case "MoveC":
        a != c.mouselastcoord && (d.MoveECell(a), e = d.range2.right - d.range2.left + d.ecell.col, g = d.range2.bottom - d.range2.top + d.ecell.row, d.RangeAnchor(SocialCalc.crToCoord(e, g)), d.RangeExtend());
        break;
      case "MoveI":
      ;
      case "MoveIC":
        e.filltype ? "Vertical" == e.filltype ? (g.col = d.range2.left, g.row >= d.range2.top && g.row <= d.range2.bottom + 1 && (g.row = d.range2.bottom + 2)) : (g.row = d.range2.top, g.col >= d.range2.left && g.col <= d.range2.right + 1 && (g.col = d.range2.right + 2)) : (g.col = f.col, g.row = f.row), h = SocialCalc.crToCoord(g.col, g.row), h != c.mouselastcoord && (d.MoveECell(h), e = d.range2.right - d.range2.left + g.col, g = d.range2.bottom - d.range2.top + g.row, d.RangeAnchor(SocialCalc.crToCoord(e, 
        g)), d.RangeExtend());
    }
    c.mouselastcoord = h;
  }
};
SocialCalc.CellHandlesMouseUp = function(a) {
  var b, c, d, e, f, g = a || window.event, h = SocialCalc.EditorMouseInfo;
  if (a = h.editor) {
    var l = a.cellhandles;
    h.ignore = !1;
    b = SocialCalc.GetElementPositionWithScroll(a.toplevel);
    b = SocialCalc.GridMousePosition(a, g.clientX - b.left, g.clientY - b.top);
    SocialCalc.SetDragAutoRepeat(a, null);
    l.mouseDown = !1;
    l.noCursorSuffix = !1;
    l.fillinghandle.style.display = "none";
    b || (b = {});
    b.coord || (b.coord = a.ecell.coord);
    switch(l.dragtype) {
      case "Fill":
      ;
      case "Move":
      ;
      case "MoveI":
        c = " all";
        break;
      case "FillC":
      ;
      case "MoveC":
      ;
      case "MoveIC":
        c = " formulas";
    }
    l.movedmouse || (l.dragtype = "Nothing");
    switch(l.dragtype) {
      case "Nothing":
        a.Range2Remove();
        a.RangeRemove();
        break;
      case "Fill":
      ;
      case "FillC":
        d = SocialCalc.coordToCr(l.startingcoord);
        e = SocialCalc.coordToCr(b.coord);
        l.filltype && ("Down" == l.filltype ? e.col = d.col : e.row = d.row);
        b.coord = SocialCalc.crToCoord(e.col, e.row);
        a.MoveECell(b.coord);
        a.RangeExtend();
        b = "Right" == a.cellhandles.filltype ? "right" : "down";
        c = "fill" + b + " " + SocialCalc.crToCoord(a.range.left, a.range.top) + ":" + SocialCalc.crToCoord(a.range.right, a.range.bottom) + c;
        a.EditorScheduleSheetCommands(c, !0, !1);
        break;
      case "Move":
      ;
      case "MoveC":
        a.context.cursorsuffix = "";
        c = "movepaste " + SocialCalc.crToCoord(a.range2.left, a.range2.top) + ":" + SocialCalc.crToCoord(a.range2.right, a.range2.bottom) + " " + a.ecell.coord + c;
        a.EditorScheduleSheetCommands(c, !0, !1);
        a.Range2Remove();
        break;
      case "MoveI":
      ;
      case "MoveIC":
        a.context.cursorsuffix = "", b = a.range2.right - a.range2.left, d = a.range2.bottom - a.range2.top, e = a.ecell.col - a.range2.left, f = a.ecell.row - a.range2.top, c = "moveinsert " + SocialCalc.crToCoord(a.range2.left, a.range2.top) + ":" + SocialCalc.crToCoord(a.range2.right, a.range2.bottom) + " " + a.ecell.coord + c, a.EditorScheduleSheetCommands(c, !0, !1), a.Range2Remove(), a.RangeRemove(), " Horizontal" == a.cellhandles.filltype && 0 < e ? a.MoveECell(SocialCalc.crToCoord(a.ecell.col - 
        b - 1, a.ecell.row)) : " Vertical" == a.cellhandles.filltype && 0 < f && a.MoveECell(SocialCalc.crToCoord(a.ecell.col, a.ecell.row - d - 1)), a.RangeAnchor(SocialCalc.crToCoord(a.ecell.col + b, a.ecell.row + d)), a.RangeExtend();
    }
    SocialCalc.RemoveMouseMoveUp(SocialCalc.CellHandlesMouseMove, SocialCalc.CellHandlesMouseUp, l.draghandle, g);
    h.editor = null;
    return!1;
  }
};
SocialCalc.TableControl = function(a, b, c) {
  var d = SocialCalc.Constants;
  this.editor = a;
  this.vertical = b;
  this.size = c;
  this.thumbpos = this.scrollareasize = this.scrollareaend = this.scrollareastart = this.morebuttonstart = this.lessbuttonstart = this.panesliderstart = this.endcapstart = this.controlborder = this.thumb = this.scrollarea = this.morebutton = this.lessbutton = this.paneslider = this.endcap = this.main = null;
  this.controlthickness = d.defaultTableControlThickness;
  this.sliderthickness = d.defaultTCSliderThickness;
  this.buttonthickness = d.defaultTCButtonThickness;
  this.thumbthickness = d.defaultTCThumbThickness;
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
SocialCalc.CreateTableControl = function(a) {
  var b, c, d = SocialCalc.AssignID, e = SocialCalc.setStyles, f = SocialCalc.Constants, g = a.editor.imageprefix, h = a.vertical ? "v" : "h";
  a.main = document.createElement("div");
  b = a.main.style;
  b.height = (a.vertical ? a.size : a.controlthickness) + "px";
  b.width = (a.vertical ? a.controlthickness : a.size) + "px";
  b.zIndex = 0;
  e(a.main, f.TCmainStyle);
  b.backgroundImage = "url(" + g + "main-" + h + ".gif)";
  f.TCmainClass && (a.main.className = f.TCmainClass);
  a.main.style.display = "none";
  a.endcap = document.createElement("div");
  b = a.endcap.style;
  b.height = a.controlthickness + "px";
  b.width = a.controlthickness + "px";
  b.zIndex = 1;
  b.overflow = "hidden";
  b.position = "absolute";
  e(a.endcap, f.TCendcapStyle);
  b.backgroundImage = "url(" + g + "endcap-" + h + ".gif)";
  f.TCendcapClass && (a.endcap.className = f.TCendcapClass);
  d(a.editor, a.endcap, "endcap" + h);
  a.main.appendChild(a.endcap);
  a.paneslider = document.createElement("div");
  b = a.paneslider.style;
  b.height = (a.vertical ? a.sliderthickness : a.controlthickness) + "px";
  b.overflow = "hidden";
  b.width = (a.vertical ? a.controlthickness : a.sliderthickness) + "px";
  b.position = "absolute";
  b[a.vertical ? "top" : "left"] = "4px";
  b.zIndex = 3;
  b.backgroundImage = "url(" + g + "paneslider-" + h + ".gif)";
  f.TCpanesliderClass && (a.paneslider.className = f.TCpanesliderClass);
  d(a.editor, a.paneslider, "paneslider" + h);
  (function(b, c, d) {
    f["s_" + c + "Tooltip" + d] && SocialCalc.TooltipRegister(b, f["s_" + c + "Tooltip" + d], null, a.editor.toplevel);
  })(a.paneslider, "paneslider", h);
  b = {MouseDown:SocialCalc.TCPSDragFunctionStart, MouseMove:SocialCalc.TCPSDragFunctionMove, MouseUp:SocialCalc.TCPSDragFunctionStop, Disabled:function() {
    return a.editor.busy;
  }};
  b.control = a;
  SocialCalc.DragRegister(a.paneslider, a.vertical, !a.vertical, b, a.editor.toplevel);
  a.main.appendChild(a.paneslider);
  a.lessbutton = document.createElement("div");
  b = a.lessbutton.style;
  b.height = (a.vertical ? a.buttonthickness : a.controlthickness) + "px";
  b.width = (a.vertical ? a.controlthickness : a.buttonthickness) + "px";
  b.zIndex = 2;
  b.overflow = "hidden";
  b.position = "absolute";
  e(a.lessbutton, f.TClessbuttonStyle);
  b.backgroundImage = "url(" + g + "less-" + h + "n.gif)";
  f.TClessbuttonClass && (a.lessbutton.className = f.TClessbuttonClass);
  d(a.editor, a.lessbutton, "lessbutton" + h);
  c = {repeatwait:f.TClessbuttonRepeatWait, repeatinterval:f.TClessbuttonRepeatInterval, normalstyle:"backgroundImage:url(" + g + "less-" + h + "n.gif);", downstyle:"backgroundImage:url(" + g + "less-" + h + "d.gif);", hoverstyle:"backgroundImage:url(" + g + "less-" + h + "h.gif);"};
  b = {MouseDown:function() {
    a.editor.busy || a.editor.ScrollRelative(a.vertical, -1);
  }, Repeat:function() {
    a.editor.busy || a.editor.ScrollRelative(a.vertical, -1);
  }, Disabled:function() {
    return a.editor.busy;
  }};
  SocialCalc.ButtonRegister(a.editor, a.lessbutton, c, b);
  a.main.appendChild(a.lessbutton);
  a.morebutton = document.createElement("div");
  b = a.morebutton.style;
  b.height = (a.vertical ? a.buttonthickness : a.controlthickness) + "px";
  b.width = (a.vertical ? a.controlthickness : a.buttonthickness) + "px";
  b.zIndex = 2;
  b.overflow = "hidden";
  b.position = "absolute";
  e(a.morebutton, f.TCmorebuttonStyle);
  b.backgroundImage = "url(" + g + "more-" + h + "n.gif)";
  f.TCmorebuttonClass && (a.morebutton.className = f.TCmorebuttonClass);
  d(a.editor, a.morebutton, "morebutton" + h);
  c = {repeatwait:f.TCmorebuttonRepeatWait, repeatinterval:f.TCmorebuttonRepeatInterval, normalstyle:"backgroundImage:url(" + g + "more-" + h + "n.gif);", downstyle:"backgroundImage:url(" + g + "more-" + h + "d.gif);", hoverstyle:"backgroundImage:url(" + g + "more-" + h + "h.gif);"};
  b = {MouseDown:function() {
    a.editor.busy || a.editor.ScrollRelative(a.vertical, 1);
  }, Repeat:function() {
    a.editor.busy || a.editor.ScrollRelative(a.vertical, 1);
  }, Disabled:function() {
    return a.editor.busy;
  }};
  SocialCalc.ButtonRegister(a.editor, a.morebutton, c, b);
  a.main.appendChild(a.morebutton);
  a.scrollarea = document.createElement("div");
  b = a.scrollarea.style;
  b.height = a.controlthickness + "px";
  b.width = a.controlthickness + "px";
  b.zIndex = 1;
  b.overflow = "hidden";
  b.position = "absolute";
  e(a.scrollarea, f.TCscrollareaStyle);
  b.backgroundImage = "url(" + g + "scrollarea-" + h + ".gif)";
  f.TCscrollareaClass && (a.scrollarea.className = f.TCscrollareaClass);
  d(a.editor, a.scrollarea, "scrollarea" + h);
  c = {repeatwait:f.TCscrollareaRepeatWait, repeatinterval:f.TCscrollareaRepeatWait};
  b = {MouseDown:SocialCalc.ScrollAreaClick, Repeat:SocialCalc.ScrollAreaClick, Disabled:function() {
    return a.editor.busy;
  }};
  b.control = a;
  SocialCalc.ButtonRegister(a.editor, a.scrollarea, c, b);
  a.main.appendChild(a.scrollarea);
  a.thumb = document.createElement("div");
  b = a.thumb.style;
  b.height = (a.vertical ? a.thumbthickness : a.controlthickness) + "px";
  b.width = (a.vertical ? a.controlthickness : a.thumbthickness) + "px";
  b.zIndex = 2;
  b.overflow = "hidden";
  b.position = "absolute";
  e(a.thumb, f.TCthumbStyle);
  a.thumb.style.backgroundImage = "url(" + g + "thumb-" + h + "n.gif)";
  f.TCthumbClass && (a.thumb.className = f.TCthumbClass);
  d(a.editor, a.thumb, "thumb" + h);
  b = {MouseDown:SocialCalc.TCTDragFunctionStart, MouseMove:SocialCalc.TCTDragFunctionMove, MouseUp:SocialCalc.TCTDragFunctionStop, Disabled:function() {
    return a.editor.busy;
  }};
  b.control = a;
  SocialCalc.DragRegister(a.thumb, a.vertical, !a.vertical, b, a.editor.toplevel);
  c = {normalstyle:"backgroundImage:url(" + g + "thumb-" + h + "n.gif)", name:"Thumb", downstyle:"backgroundImage:url(" + g + "thumb-" + h + "d.gif)", hoverstyle:"backgroundImage:url(" + g + "thumb-" + h + "h.gif)"};
  SocialCalc.ButtonRegister(a.editor, a.thumb, c, null);
  a.main.appendChild(a.thumb);
  return a.main;
};
SocialCalc.ScrollAreaClick = function(a, b, c) {
  a = c.functionobj.control;
  c = SocialCalc.GetElementPositionWithScroll(a.editor.toplevel);
  b = a.vertical ? b.clientY - c.top : b.clientX - c.left;
  a.editor.busy || a.editor.PageRelative(a.vertical, b > a.thumbpos ? 1 : -1);
};
SocialCalc.PositionTableControlElements = function(a) {
  var b, c, d = a.editor;
  a.vertical ? (b = a.controlborder + "px", a.endcap.style.top = a.endcapstart + "px", a.endcap.style.left = b, a.paneslider.style.top = a.panesliderstart + "px", a.paneslider.style.left = b, a.lessbutton.style.top = a.lessbuttonstart + "px", a.lessbutton.style.left = b, a.morebutton.style.top = a.morebuttonstart + "px", a.morebutton.style.left = b, a.scrollarea.style.top = a.scrollareastart + "px", a.scrollarea.style.left = b, a.scrollarea.style.height = a.scrollareasize + "px", c = Math.max(d.context.sheetobj.attribs.lastrow, 
  d.firstscrollingrow + 1), c = (d.firstscrollingrow - (d.lastnonscrollingrow + 1)) * (a.scrollareasize - 3 * a.thumbthickness) / (c - (d.lastnonscrollingrow + 1)) + a.scrollareastart - 1, c = Math.floor(c), a.thumb.style.top = c + "px", a.thumb.style.left = b) : (b = a.controlborder + "px", a.endcap.style.left = a.endcapstart + "px", a.endcap.style.top = b, a.paneslider.style.left = a.panesliderstart + "px", a.paneslider.style.top = b, a.lessbutton.style.left = a.lessbuttonstart + "px", a.lessbutton.style.top = 
  b, a.morebutton.style.left = a.morebuttonstart + "px", a.morebutton.style.top = b, a.scrollarea.style.left = a.scrollareastart + "px", a.scrollarea.style.top = b, a.scrollarea.style.width = a.scrollareasize + "px", c = Math.max(d.context.sheetobj.attribs.lastcol, d.firstscrollingcol + 1), c = (d.firstscrollingcol - (d.lastnonscrollingcol + 1)) * (a.scrollareasize - a.thumbthickness) / (c - d.lastnonscrollingcol) + a.scrollareastart - 1, c = Math.floor(c), a.thumb.style.left = c + "px", a.thumb.style.top = 
  b);
  a.thumbpos = c;
  a.main.style.display = "block";
};
SocialCalc.ComputeTableControlPositions = function(a) {
  var b = a.editor;
  if (!b.gridposition || !b.headposition) {
    throw "Can't compute table control positions before editor positions";
  }
  a.vertical ? (a.controlborder = b.gridposition.left + b.tablewidth, a.endcapstart = b.gridposition.top, a.panesliderstart = b.firstscrollingrowtop - a.sliderthickness, a.lessbuttonstart = b.firstscrollingrowtop - 1, a.morebuttonstart = b.gridposition.top + b.tableheight - a.buttonthickness, a.scrollareastart = b.firstscrollingrowtop - 1 + a.buttonthickness) : (a.controlborder = b.gridposition.top + b.tableheight, a.endcapstart = b.gridposition.left, a.panesliderstart = b.firstscrollingcolleft - 
  a.sliderthickness, a.lessbuttonstart = b.firstscrollingcolleft - 1, a.morebuttonstart = b.gridposition.left + b.tablewidth - a.buttonthickness, a.scrollareastart = b.firstscrollingcolleft - 1 + a.buttonthickness);
  a.scrollareaend = a.morebuttonstart - 1;
  a.scrollareasize = a.scrollareaend - a.scrollareastart + 1;
};
SocialCalc.TCPSDragFunctionStart = function(a, b, c) {
  var d = c.functionobj.control.editor, e = SocialCalc.Constants;
  SocialCalc.DragFunctionStart(a, b, c);
  b.trackingline = document.createElement("div");
  b.trackingline.style.height = c.vertical ? e.TCPStrackinglineThickness : d.tableheight - (d.headposition.top - d.gridposition.top) + "px";
  b.trackingline.style.width = c.vertical ? d.tablewidth - (d.headposition.left - d.gridposition.left) + "px" : e.TCPStrackinglineThickness;
  b.trackingline.style.backgroundImage = "url(" + d.imageprefix + "trackingline-" + (c.vertical ? "v" : "h") + ".gif)";
  e.TCPStrackinglineClass && (b.trackingline.className = e.TCPStrackinglineClass);
  SocialCalc.setStyles(b.trackingline, e.TCPStrackinglineStyle);
  c.vertical ? (row = SocialCalc.Lookup(b.clientY + c.functionobj.control.sliderthickness, d.rowpositions), b.trackingline.style.top = (d.rowpositions[row] || d.headposition.top) + "px", b.trackingline.style.left = d.headposition.left + "px", b.trackingline.id = "trackingline-vertical", d.context.rowpanes.length - 1 && (d.context.SetRowPaneFirstLast(1, d.context.rowpanes[0].last + 1, d.context.rowpanes[0].last + 1), d.FitToEditTable(), d.ScheduleRender())) : (col = SocialCalc.Lookup(b.clientX + c.functionobj.control.sliderthickness, 
  d.colpositions), b.trackingline.style.top = d.headposition.top + "px", b.trackingline.style.left = (d.colpositions[col] || d.headposition.left) + "px", b.trackingline.id = "trackingline-horizon", d.context.colpanes.length - 1 && (d.context.SetColPaneFirstLast(1, d.context.colpanes[0].last + 1, d.context.colpanes[0].last + 1), d.FitToEditTable(), d.ScheduleRender()));
  d.griddiv.appendChild(b.trackingline);
};
SocialCalc.TCPSDragFunctionMove = function(a, b, c) {
  var d, e;
  e = c.functionobj.control;
  d = e.sliderthickness;
  var f = e.editor;
  if (c.vertical) {
    e = e.morebuttonstart - e.minscrollingpanesize - b.offsetY;
    b.clientY > e && (b.clientY = e);
    e = f.headposition.top - d - b.offsetY;
    b.clientY < e && (b.clientY = e);
    for (d = SocialCalc.Lookup(b.clientY + d, f.rowpositions);"yes" == f.context.sheetobj.rowattribs.hide[d];) {
      d++;
    }
    b.trackingline.style.top = (f.rowpositions[d] || f.headposition.top) + "px";
  } else {
    e = e.morebuttonstart - e.minscrollingpanesize - b.offsetX;
    b.clientX > e && (b.clientX = e);
    e = f.headposition.left - d - b.offsetX;
    b.clientX < e && (b.clientX = e);
    for (d = SocialCalc.Lookup(b.clientX + d, f.colpositions);"yes" == f.context.sheetobj.colattribs.hide[SocialCalc.rcColname(d)];) {
      d++;
    }
    b.trackingline.style.left = (f.colpositions[d] || f.headposition.left) + "px";
  }
  SocialCalc.DragFunctionPosition(a, b, c);
};
SocialCalc.TCPSDragFunctionStop = function(a, b, c) {
  var d = c.functionobj.control, e = d.sliderthickness;
  a = d.editor;
  if (c.vertical) {
    c = d.morebuttonstart - d.minscrollingpanesize - b.offsetY;
    b.clientY > c && (b.clientY = c);
    c = a.headposition.top - e - b.offsetY;
    b.clientY < c && (b.clientY = c);
    b = SocialCalc.Lookup(b.clientY + e, a.rowpositions);
    b > a.context.sheetobj.attribs.lastrow && (b = a.context.sheetobj.attribs.lastrow);
    for (;"yes" == a.context.sheetobj.rowattribs.hide[b];) {
      b++;
    }
    a.EditorScheduleSheetCommands("pane row " + b, !0, !1);
  } else {
    c = d.morebuttonstart - d.minscrollingpanesize - b.offsetX;
    b.clientX > c && (b.clientX = c);
    c = a.headposition.left - e - b.offsetX;
    b.clientX < c && (b.clientX = c);
    b = SocialCalc.Lookup(b.clientX + e, a.colpositions);
    b > a.context.sheetobj.attribs.lastcol && (b = a.context.sheetobj.attribs.lastcol);
    for (;"yes" == a.context.sheetobj.colattribs.hide[SocialCalc.rcColname(b)];) {
      b++;
    }
    a.EditorScheduleSheetCommands("pane col " + b, !0, !1);
  }
};
SocialCalc.TCTDragFunctionStart = function(a, b, c) {
  var d = c.functionobj.control, e = d.editor, f = SocialCalc.Constants;
  SocialCalc.DragFunctionStart(a, b, c);
  b.thumbstatus && (b.thumbstatus.rowmsgele && (b.thumbstatus.rowmsgele = null), b.thumbstatus.rowpreviewele && (b.thumbstatus.rowpreviewele = null), e.toplevel.removeChild(b.thumbstatus), b.thumbstatus = null);
  b.thumbstatus = document.createElement("div");
  c.vertical ? (f.TCTDFSthumbstatusvClass && (b.thumbstatus.className = f.TCTDFSthumbstatusvClass), SocialCalc.setStyles(b.thumbstatus, f.TCTDFSthumbstatusvStyle), b.thumbstatus.style.top = b.clientY + f.TCTDFStopOffsetv + "px", b.thumbstatus.style.left = d.controlborder - 10 - e.tablewidth / 2 + "px", b.thumbstatus.style.width = e.tablewidth / 2 + "px", b.thumbcontext = new SocialCalc.RenderContext(e.context.sheetobj), b.thumbcontext.showGrid = !0, b.thumbcontext.rowpanes = [{first:1, last:1}], 
  a = e.context.colpanes[e.context.colpanes.length - 1], b.thumbcontext.colpanes = [{first:a.first, last:a.last}], b.thumbstatus.innerHTML = '<table cellspacing="0" cellpadding="0"><tr><td valign="top" style="' + f.TCTDFSthumbstatusrownumStyle + '" class="' + f.TCTDFSthumbstatusrownumClass + '"><div>msg</div></td><td valign="top"><div style="overflow:hidden;">preview</div></td></tr></table>', b.thumbstatus.rowmsgele = b.thumbstatus.firstChild.firstChild.firstChild.firstChild.firstChild, b.thumbstatus.rowpreviewele = 
  b.thumbstatus.firstChild.firstChild.firstChild.childNodes[1].firstChild, e.toplevel.appendChild(b.thumbstatus), SocialCalc.TCTDragFunctionRowSetStatus(b, e, e.firstscrollingrow || 1)) : (f.TCTDFSthumbstatushClass && (b.thumbstatus.className = f.TCTDFSthumbstatushClass), SocialCalc.setStyles(b.thumbstatus, f.TCTDFSthumbstatushStyle), b.thumbstatus.style.top = d.controlborder + f.TCTDFStopOffseth + "px", b.thumbstatus.style.left = b.clientX + f.TCTDFSleftOffseth + "px", e.toplevel.appendChild(b.thumbstatus), 
  b.thumbstatus.innerHTML = f.s_TCTDFthumbstatusPrefixh + SocialCalc.rcColname(e.firstscrollingcol));
};
SocialCalc.TCTDragFunctionRowSetStatus = function(a, b, c) {
  a.thumbstatus.rowmsgele.innerHTML = SocialCalc.Constants.s_TCTDFthumbstatusPrefixv + c + " ";
  a.thumbcontext.rowpanes = [{first:c, last:c}];
  a.thumbrowshown = c;
  a.thumbcontext.RenderSheet(a.thumbstatus.rowpreviewele.firstChild, {type:"html"});
};
SocialCalc.TCTDragFunctionMove = function(a, b, c) {
  var d, e;
  d = c.functionobj.control;
  e = d.editor;
  var f = SocialCalc.Constants;
  c.vertical ? (b.clientY > d.scrollareaend - b.offsetY - d.thumbthickness + 2 && (b.clientY = d.scrollareaend - b.offsetY - d.thumbthickness + 2), b.clientY < d.scrollareastart - b.offsetY - 1 && (b.clientY = d.scrollareastart - b.offsetY - 1), b.thumbstatus.style.top = b.clientY + "px", d = (b.clientY + b.offsetY - d.scrollareastart + 1) / (d.scrollareasize - d.thumbthickness) * (e.context.sheetobj.attribs.lastrow - e.lastnonscrollingrow) + e.lastnonscrollingrow + 1, d = Math.floor(d), d <= e.lastnonscrollingrow && 
  (d = e.lastnonscrollingrow + 1), d > e.context.sheetobj.attribs.lastrow && (d = e.context.sheetobj.attribs.lastrow), d != b.thumbrowshown && SocialCalc.TCTDragFunctionRowSetStatus(b, e, d)) : (b.clientX > d.scrollareaend - b.offsetX - d.thumbthickness + 2 && (b.clientX = d.scrollareaend - b.offsetX - d.thumbthickness + 2), b.clientX < d.scrollareastart - b.offsetX - 1 && (b.clientX = d.scrollareastart - b.offsetX - 1), b.thumbstatus.style.left = b.clientX + "px", d = (b.clientX + b.offsetX - d.scrollareastart + 
  1) / (d.scrollareasize - d.thumbthickness) * (e.context.sheetobj.attribs.lastcol - e.lastnonscrollingcol) + e.lastnonscrollingcol + 1, d = Math.floor(d), d <= e.lastnonscrollingcol && (d = e.lastnonscrollingcol + 1), d > e.context.sheetobj.attribs.lastcol && (d = e.context.sheetobj.attribs.lastcol), e = f.s_TCTDFthumbstatusPrefixh + SocialCalc.rcColname(d), b.thumbstatus.innerHTML = e);
  SocialCalc.DragFunctionPosition(a, b, c);
};
SocialCalc.TCTDragFunctionStop = function(a, b, c) {
  var d = c.functionobj.control;
  a = d.editor;
  c.vertical ? (c = (b.clientY + b.offsetY - d.scrollareastart + 1) / (d.scrollareasize - d.thumbthickness) * (a.context.sheetobj.attribs.lastrow - a.lastnonscrollingrow) + a.lastnonscrollingrow + 1, c = Math.floor(c), c <= a.lastnonscrollingrow && (c = a.lastnonscrollingrow + 1), c > a.context.sheetobj.attribs.lastrow && (c = a.context.sheetobj.attribs.lastrow), a.context.SetRowPaneFirstLast(a.context.rowpanes.length - 1, c, c + 1)) : (c = (b.clientX + b.offsetX - d.scrollareastart + 1) / (d.scrollareasize - 
  d.thumbthickness) * (a.context.sheetobj.attribs.lastcol - a.lastnonscrollingcol) + a.lastnonscrollingcol + 1, c = Math.floor(c), c <= a.lastnonscrollingcol && (c = a.lastnonscrollingcol + 1), c > a.context.sheetobj.attribs.lastcol && (c = a.context.sheetobj.attribs.lastcol), a.context.SetColPaneFirstLast(a.context.colpanes.length - 1, c, c + 1));
  a.FitToEditTable();
  b.thumbstatus.rowmsgele && (b.thumbstatus.rowmsgele = null);
  b.thumbstatus.rowpreviewele && (b.thumbstatus.rowpreviewele = null);
  a.toplevel.removeChild(b.thumbstatus);
  b.thumbstatus = null;
  a.ScheduleRender();
};
SocialCalc.DragInfo = {registeredElements:[], draggingElement:null, startX:0, startY:0, startZ:0, clientX:0, clientY:0, offsetX:0, offsetY:0, relativeOffset:{left:0, top:0}};
SocialCalc.DragRegister = function(a, b, c, d, e) {
  var f = SocialCalc.DragInfo;
  d || (d = {MouseDown:SocialCalc.DragFunctionStart, MouseMove:SocialCalc.DragFunctionPosition, MouseUp:SocialCalc.DragFunctionPosition, Disabled:null});
  f.registeredElements.push({element:a, vertical:b, horizontal:c, functionobj:d, parent:e});
  if (a.addEventListener) {
    a.addEventListener("mousedown", SocialCalc.DragMouseDown, !1);
  } else {
    if (a.attachEvent) {
      a.attachEvent("onmousedown", SocialCalc.DragMouseDown);
    } else {
      throw SocialCalc.Constants.s_BrowserNotSupported;
    }
  }
};
SocialCalc.DragUnregister = function(a) {
  var b = SocialCalc.DragInfo, c;
  if (a) {
    for (c = 0;c < b.registeredElements.length;c++) {
      if (b.registeredElements[c].element == a) {
        b.registeredElements.splice(c, 1);
        a.removeEventListener ? a.removeEventListener("mousedown", SocialCalc.DragMouseDown, !1) : a.detachEvent("onmousedown", SocialCalc.DragMouseDown);
        break;
      }
    }
  }
};
SocialCalc.DragMouseDown = function(a) {
  a = a || window.event;
  var b = SocialCalc.DragInfo, c = SocialCalc.LookupElement(a.target || a.srcElement, b.registeredElements);
  if (c && !(c && c.functionobj && c.functionobj.Disabled && c.functionobj.Disabled(a, b, c))) {
    return b.draggingElement = c, c.parent && (b.relativeOffset = SocialCalc.GetElementPositionWithScroll(c.parent)), b.clientX = a.clientX - b.relativeOffset.left, b.clientY = a.clientY - b.relativeOffset.top, b.startX = b.clientX, b.startY = b.clientY, b.startZ = c.element.style.zIndex, b.offsetX = 0, b.offsetY = 0, c.element.style.zIndex = "100", SocialCalc.SetMouseMoveUp(SocialCalc.DragMouseMove, SocialCalc.DragMouseUp, c.element, a), c && c.functionobj && c.functionobj.MouseDown && c.functionobj.MouseDown(a, 
    b, c), !1;
  }
};
SocialCalc.DragMouseMove = function(a) {
  a = a || window.event;
  var b = SocialCalc.DragInfo, c = b.draggingElement;
  b.clientX = a.clientX - b.relativeOffset.left;
  b.clientY = a.clientY - b.relativeOffset.top;
  SocialCalc.StopPropagation(a);
  c && c.functionobj && c.functionobj.MouseMove && c.functionobj.MouseMove(a, b, c);
  return!1;
};
SocialCalc.DragMouseUp = function(a) {
  a = a || window.event;
  var b = SocialCalc.DragInfo, c = b.draggingElement;
  b.clientX = a.clientX - b.relativeOffset.left;
  b.clientY = a.clientY - b.relativeOffset.top;
  c.element.style.zIndex = b.startZ;
  c && c.functionobj && c.functionobj.MouseUp && c.functionobj.MouseUp(a, b, c);
  SocialCalc.RemoveMouseMoveUp(SocialCalc.DragMouseMove, SocialCalc.DragMouseUp, c.element, a);
  b.draggingElement = null;
  return!1;
};
SocialCalc.DragFunctionStart = function(a, b, c) {
  a = c.functionobj.positionobj || c.element;
  b.offsetY = parseInt(a.style.top) - b.clientY;
  b.offsetX = parseInt(a.style.left) - b.clientX;
};
SocialCalc.DragFunctionPosition = function(a, b, c) {
  a = c.functionobj.positionobj || c.element;
  c.vertical && (a.style.top = b.clientY + b.offsetY + "px");
  c.horizontal && (a.style.left = b.clientX + b.offsetX + "px");
};
SocialCalc.TooltipInfo = {registeredElements:[], registered:!1, tooltipElement:null, timer:null, popupElement:null, clientX:0, clientY:0, offsetX:SocialCalc.Constants.TooltipOffsetX, offsetY:SocialCalc.Constants.TooltipOffsetY};
SocialCalc.TooltipRegister = function(a, b, c, d) {
  var e = SocialCalc.TooltipInfo;
  e.registeredElements.push({element:a, tiptext:b, functionobj:c, parent:d});
  if (!e.registered) {
    if (document.addEventListener) {
      document.addEventListener("mousemove", SocialCalc.TooltipMouseMove, !1);
    } else {
      if (document.attachEvent) {
        document.attachEvent("onmousemove", SocialCalc.TooltipMouseMove);
      } else {
        throw SocialCalc.Constants.s_BrowserNotSupported;
      }
    }
    e.registered = !0;
  }
};
SocialCalc.TooltipMouseMove = function(a) {
  var b = a || window.event;
  a = SocialCalc.TooltipInfo;
  a.clientX = b.clientX;
  a.clientY = b.clientY;
  b = SocialCalc.LookupElement(b.target || b.srcElement, a.registeredElements);
  a.timer && (window.clearTimeout(a.timer), a.timer = null);
  a.popupElement && SocialCalc.TooltipHide();
  a.tooltipElement = b || null;
  b && !SocialCalc.ButtonInfo.buttonDown && (a.timer = window.setTimeout(SocialCalc.TooltipWaitDone, 700), a.tooltipElement.element.addEventListener ? a.tooltipElement.element.addEventListener("mousedown", SocialCalc.TooltipMouseDown, !1) : a.tooltipElement.element.attachEvent && a.tooltipElement.element.attachEvent("onmousedown", SocialCalc.TooltipMouseDown));
};
SocialCalc.TooltipMouseDown = function(a) {
  a = SocialCalc.TooltipInfo;
  a.timer && (window.clearTimeout(a.timer), a.timer = null);
  a.popupElement && SocialCalc.TooltipHide();
  a.tooltipElement && (a.tooltipElement.element.removeEventListener ? a.tooltipElement.element.removeEventListener("mousedown", SocialCalc.TooltipMouseDown, !1) : a.tooltipElement.element.attachEvent && a.tooltipElement.element.detachEvent("onmousedown", SocialCalc.TooltipMouseDown), a.tooltipElement = null);
};
SocialCalc.TooltipDisplay = function(a) {
  var b = SocialCalc.TooltipInfo, c = SocialCalc.Constants, d = a.functionobj && "number" == typeof a.functionobj.offsetx ? a.functionobj.offsetx : b.offsetX, e = a.functionobj && "number" == typeof a.functionobj.offsety ? a.functionobj.offsety : b.offsetY, f = SocialCalc.GetViewportInfo(), g = SocialCalc.GetElementPositionWithScroll(a.parent);
  b.popupElement = document.createElement("div");
  c.TDpopupElementClass && (b.popupElement.className = c.TDpopupElementClass);
  SocialCalc.setStyles(b.popupElement, c.TDpopupElementStyle);
  b.popupElement.innerHTML = a.tiptext;
  b.clientX > f.width / 2 ? (b.popupElement.style.bottom = g.height - b.clientY + e + g.top + "px", b.popupElement.style.right = g.width - b.clientX + d + g.left + "px") : (b.popupElement.style.bottom = g.height - b.clientY + e + g.top + "px", b.popupElement.style.left = b.clientX + d - g.left + "px");
  50 > b.clientY && (b.popupElement.style.bottom = g.height - b.clientY + e - 50 + g.top + "px");
  a.parent.appendChild(b.popupElement);
};
SocialCalc.TooltipHide = function() {
  var a = SocialCalc.TooltipInfo;
  a.popupElement && (a.popupElement.parentNode.removeChild(a.popupElement), a.popupElement = null);
};
SocialCalc.TooltipWaitDone = function() {
  var a = SocialCalc.TooltipInfo;
  a.timer = null;
  SocialCalc.TooltipDisplay(a.tooltipElement);
};
SocialCalc.ButtonInfo = {registeredElements:[], buttonElement:null, doingHover:!1, buttonDown:!1, timer:null, relativeOffset:null, clientX:0, clientY:0};
SocialCalc.ButtonRegister = function(a, b, c, d) {
  var e = SocialCalc.ButtonInfo;
  c || (c = {});
  e.registeredElements.push({name:c.name, element:b, editor:a, normalstyle:c.normalstyle, hoverstyle:c.hoverstyle, downstyle:c.downstyle, repeatwait:c.repeatwait, repeatinterval:c.repeatinterval, functionobj:d});
  if (b.addEventListener) {
    b.addEventListener("mousedown", SocialCalc.ButtonMouseDown, !1), b.addEventListener("mouseover", SocialCalc.ButtonMouseOver, !1), b.addEventListener("mouseout", SocialCalc.ButtonMouseOut, !1);
  } else {
    if (b.attachEvent) {
      b.attachEvent("onmousedown", SocialCalc.ButtonMouseDown), b.attachEvent("onmouseover", SocialCalc.ButtonMouseOver), b.attachEvent("onmouseout", SocialCalc.ButtonMouseOut);
    } else {
      throw SocialCalc.Constants.s_BrowserNotSupported;
    }
  }
};
SocialCalc.ButtonMouseOver = function(a) {
  a = a || window.event;
  var b = SocialCalc.ButtonInfo, c = SocialCalc.LookupElement(a.target || a.srcElement, b.registeredElements);
  c && (b.buttonDown ? b.buttonElement == c && (b.doingHover = !0) : (b.buttonElement && b.buttonElement != c && b.doingHover && SocialCalc.setStyles(b.buttonElement.element, b.buttonElement.normalstyle), b.buttonElement = c, b.doingHover = !0, SocialCalc.setStyles(c.element, c.hoverstyle), c && c.functionobj && c.functionobj.MouseOver && c.functionobj.MouseOver(a, b, c)));
};
SocialCalc.ButtonMouseOut = function(a) {
  a = a || window.event;
  var b = SocialCalc.ButtonInfo;
  if (b.buttonDown) {
    b.doingHover = !1;
  } else {
    var c = SocialCalc.LookupElement(a.target || a.srcElement, b.registeredElements);
    b.doingHover && (b.buttonElement && SocialCalc.setStyles(b.buttonElement.element, b.buttonElement.normalstyle), b.buttonElement = null, b.doingHover = !1);
    c && c.functionobj && c.functionobj.MouseOut && c.functionobj.MouseOut(a, b, c);
  }
};
SocialCalc.ButtonMouseDown = function(a) {
  a = a || window.event;
  var b = SocialCalc.ButtonInfo;
  SocialCalc.GetViewportInfo();
  var c = SocialCalc.LookupElement(a.target || a.srcElement, b.registeredElements);
  !c || c && c.functionobj && c.functionobj.Disabled && c.functionobj.Disabled(a, b, c) || (b.buttonElement = c, b.buttonDown = !0, SocialCalc.setStyles(c.element, b.buttonElement.downstyle), document.addEventListener ? document.addEventListener("mouseup", SocialCalc.ButtonMouseUp, !0) : c.element.attachEvent && (c.element.setCapture(), c.element.attachEvent("onmouseup", SocialCalc.ButtonMouseUp), c.element.attachEvent("onlosecapture", SocialCalc.ButtonMouseUp)), SocialCalc.StopPropagation(a), b.relativeOffset = 
  SocialCalc.GetElementPositionWithScroll(c.editor.toplevel), b.clientX = a.clientX - b.relativeOffset.left, b.clientY = a.clientY - b.relativeOffset.top, c && c.functionobj && c.functionobj.MouseDown && c.functionobj.MouseDown(a, b, c), c.repeatwait && (b.timer = window.setTimeout(SocialCalc.ButtonRepeat, c.repeatwait)));
};
SocialCalc.ButtonMouseUp = function(a) {
  a = a || window.event;
  var b = SocialCalc.ButtonInfo, c = b.buttonElement;
  b.timer && (window.clearTimeout(b.timer), b.timer = null);
  b.buttonDown && (SocialCalc.StopPropagation(a), document.removeEventListener ? document.removeEventListener("mouseup", SocialCalc.ButtonMouseUp, !0) : document.detachEvent && (c.element.detachEvent("onlosecapture", SocialCalc.ButtonMouseUp), c.element.detachEvent("onmouseup", SocialCalc.ButtonMouseUp), c.element.releaseCapture()), b.buttonElement.downstyle && (b.doingHover ? SocialCalc.setStyles(c.element, b.buttonElement.hoverstyle) : SocialCalc.setStyles(c.element, b.buttonElement.normalstyle)), 
  b.buttonDown = !1, c && c.functionobj && c.functionobj.MouseUp && c.functionobj.MouseUp(a, b, c));
};
SocialCalc.ButtonRepeat = function() {
  var a = SocialCalc.ButtonInfo, b = a.buttonElement;
  b && (b && b.functionobj && b.functionobj.Repeat && b.functionobj.Repeat(null, a, b), a.timer = window.setTimeout(SocialCalc.ButtonRepeat, b.repeatinterval || 100));
};
SocialCalc.MouseWheelInfo = {registeredElements:[]};
SocialCalc.MouseWheelRegister = function(a, b) {
  SocialCalc.MouseWheelInfo.registeredElements.push({element:a, functionobj:b});
  if (a.addEventListener) {
    a.addEventListener("DOMMouseScroll", SocialCalc.ProcessMouseWheel, !1), a.addEventListener("mousewheel", SocialCalc.ProcessMouseWheel, !1);
  } else {
    if (a.attachEvent) {
      a.attachEvent("onmousewheel", SocialCalc.ProcessMouseWheel);
    } else {
      throw SocialCalc.Constants.s_BrowserNotSupported;
    }
  }
};
SocialCalc.ProcessMouseWheel = function(a) {
  a = a || window.event;
  var b;
  if (!SocialCalc.Keyboard.passThru) {
    var c = SocialCalc.MouseWheelInfo;
    b = a.target || a.srcElement;
    var d;
    for (d = null;!d && b;b = b.parentNode) {
      d = SocialCalc.LookupElement(b, c.registeredElements);
    }
    d && ((b = a.wheelDelta ? a.wheelDelta / 120 : -a.detail / 3) || (b = 0), d.functionobj && d.functionobj.WheelMove && d.functionobj.WheelMove(a, b, c, d), a.preventDefault && a.preventDefault(), a.returnValue = !1);
  }
};
SocialCalc.keyboardTables = {specialKeysCommon:{8:"[backspace]", 9:"[tab]", 13:"[enter]", 25:"[tab]", 27:"[esc]", 33:"[pgup]", 34:"[pgdn]", 35:"[end]", 36:"[home]", 37:"[aleft]", 38:"[aup]", 39:"[aright]", 40:"[adown]", 45:"[ins]", 46:"[del]", 113:"[f2]"}, specialKeysIE:{8:"[backspace]", 9:"[tab]", 13:"[enter]", 25:"[tab]", 27:"[esc]", 33:"[pgup]", 34:"[pgdn]", 35:"[end]", 36:"[home]", 37:"[aleft]", 38:"[aup]", 39:"[aright]", 40:"[adown]", 45:"[ins]", 46:"[del]", 113:"[f2]"}, controlKeysIE:{67:"[ctrl-c]", 
83:"[ctrl-s]", 86:"[ctrl-v]", 88:"[ctrl-x]", 90:"[ctrl-z]"}, specialKeysOpera:{8:"[backspace]", 9:"[tab]", 13:"[enter]", 25:"[tab]", 27:"[esc]", 33:"[pgup]", 34:"[pgdn]", 35:"[end]", 36:"[home]", 37:"[aleft]", 38:"[aup]", 39:"[aright]", 40:"[adown]", 45:"[ins]", 46:"[del]", 113:"[f2]"}, controlKeysOpera:{67:"[ctrl-c]", 83:"[ctrl-s]", 86:"[ctrl-v]", 88:"[ctrl-x]", 90:"[ctrl-z]"}, specialKeysSafari:{8:"[backspace]", 9:"[tab]", 13:"[enter]", 25:"[tab]", 27:"[esc]", 63232:"[aup]", 63233:"[adown]", 63234:"[aleft]", 
63235:"[aright]", 63272:"[del]", 63273:"[home]", 63275:"[end]", 63276:"[pgup]", 63277:"[pgdn]", 63237:"[f2]"}, controlKeysSafari:{99:"[ctrl-c]", 115:"[ctrl-s]", 118:"[ctrl-v]", 120:"[ctrl-x]", 122:"[ctrl-z]"}, ignoreKeysSafari:{63236:"[f1]", 63238:"[f3]", 63239:"[f4]", 63240:"[f5]", 63241:"[f6]", 63242:"[f7]", 63243:"[f8]", 63244:"[f9]", 63245:"[f10]", 63246:"[f11]", 63247:"[f12]", 63289:"[numlock]"}, specialKeysFirefox:{8:"[backspace]", 9:"[tab]", 13:"[enter]", 25:"[tab]", 27:"[esc]", 33:"[pgup]", 
34:"[pgdn]", 35:"[end]", 36:"[home]", 37:"[aleft]", 38:"[aup]", 39:"[aright]", 40:"[adown]", 45:"[ins]", 46:"[del]", 113:"[f2]"}, controlKeysFirefox:{99:"[ctrl-c]", 115:"[ctrl-s]", 118:"[ctrl-v]", 120:"[ctrl-x]", 122:"[ctrl-z]"}, ignoreKeysFirefox:{16:"[shift]", 17:"[ctrl]", 18:"[alt]", 20:"[capslock]", 19:"[pause]", 44:"[printscreen]", 91:"[windows]", 92:"[windows]", 112:"[f1]", 114:"[f3]", 115:"[f4]", 116:"[f5]", 117:"[f6]", 118:"[f7]", 119:"[f8]", 120:"[f9]", 121:"[f10]", 122:"[f11]", 123:"[f12]", 
144:"[numlock]", 145:"[scrolllock]", 224:"[cmd]"}};
SocialCalc.Keyboard = {areListener:!1, focusTable:null, passThru:null, didProcessKey:!1, statusFromProcessKey:!1, repeatingKeyPress:!1, chForProcessKey:""};
SocialCalc.KeyboardSetFocus = function(a) {
  SocialCalc.Keyboard.focusTable = a;
  SocialCalc.Keyboard.areListener || (document.onkeydown = SocialCalc.ProcessKeyDown, document.onkeypress = SocialCalc.ProcessKeyPress, SocialCalc.Keyboard.areListener = !0);
  SocialCalc.Keyboard.passThru && (SocialCalc.Keyboard.passThru.blur && SocialCalc.Keyboard.passThru.blur(), SocialCalc.Keyboard.passThru = null);
  window.focus();
};
SocialCalc.KeyboardFocus = function() {
  SocialCalc.Keyboard.passThru = null;
  window.focus();
};
SocialCalc.ProcessKeyDown = function(a) {
  var b = SocialCalc.keyboardTables;
  b.didProcessKey = !1;
  b.statusFromProcessKey = !1;
  b.repeatingKeyPress = !1;
  var c = "", d = !0;
  if (!SocialCalc._app && !SocialCalc.Keyboard.passThru) {
    a = a || window.event;
    if (void 0 == a.which) {
      c = b.specialKeysCommon[a.keyCode];
      if (!c && (a.ctrlKey && (c = b.controlKeysIE[a.keyCode]), !c)) {
        return!0;
      }
      d = SocialCalc.ProcessKey(c, a);
      d || (a.preventDefault && a.preventDefault(), a.returnValue = !1);
    } else {
      c = b.specialKeysCommon[a.keyCode];
      if (!c) {
        if (a.ctrlKey || a.metaKey) {
          c = b.controlKeysIE[a.keyCode];
        }
        if (!c) {
          return!0;
        }
      }
      d = SocialCalc.ProcessKey(c, a);
      b.didProcessKey = !0;
      b.statusFromProcessKey = d;
      b.chForProcessKey = c;
    }
    return d;
  }
};
SocialCalc.ProcessKeyPress = function(a) {
  var b = SocialCalc.keyboardTables, c = "";
  a = a || window.event;
  if (!SocialCalc._app && !SocialCalc.Keyboard.passThru) {
    if (b.didProcessKey) {
      if (b.repeatingKeyPress) {
        return SocialCalc.ProcessKey(b.chForProcessKey, a);
      }
      b.repeatingKeyPress = !0;
      return b.statusFromProcessKey;
    }
    if (void 0 == a.which) {
      c = String.fromCharCode(a.keyCode);
    } else {
      if (!a.which) {
        return!1;
      }
      if (void 0 == a.charCode) {
        if (0 != a.which) {
          if (32 > a.which || 144 == a.which) {
            if (c = b.specialKeysOpera[a.which]) {
              return!0;
            }
          } else {
            c = a.ctrlKey ? b.controlKeysOpera[a.keyCode] : String.fromCharCode(a.which);
          }
        } else {
          return!0;
        }
      } else {
        if (0 == a.keyCode && 0 == a.charCode) {
          return;
        }
        if (a.keyCode == a.charCode) {
          if (c = b.specialKeysSafari[a.keyCode], !c) {
            if (b.ignoreKeysSafari[a.keyCode]) {
              return!0;
            }
            c = a.metaKey ? b.controlKeysSafari[a.keyCode] : String.fromCharCode(a.which);
          }
        } else {
          if (b.specialKeysFirefox[a.keyCode]) {
            return!0;
          }
          c = String.fromCharCode(a.which);
          if (a.ctrlKey || a.metaKey) {
            c = b.controlKeysFirefox[a.which];
          }
        }
      }
    }
    b = SocialCalc.ProcessKey(c, a);
    b || (a.preventDefault && a.preventDefault(), a.returnValue = !1);
    return b;
  }
};
SocialCalc.ProcessKey = function(a, b) {
  var c = SocialCalc.Keyboard.focusTable;
  return c ? c.EditorProcessKey(a, b) : !0;
};
SocialCalc || (SocialCalc = {});
SocialCalc.FormatNumber = {};
SocialCalc.FormatNumber.format_definitions = {};
SocialCalc.FormatNumber.separatorchar = ",";
SocialCalc.FormatNumber.decimalchar = ".";
SocialCalc.FormatNumber.daynames = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ");
SocialCalc.FormatNumber.daynames3 = "Sun Mon Tue Wed Thu Fri Sat".split(" ");
SocialCalc.FormatNumber.monthnames3 = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
SocialCalc.FormatNumber.monthnames = "January February March April May June July August September October November December".split(" ");
SocialCalc.FormatNumber.allowedcolors = {BLACK:"#000000", BLUE:"#0000FF", CYAN:"#00FFFF", GREEN:"#00FF00", MAGENTA:"#FF00FF", RED:"#FF0000", WHITE:"#FFFFFF", YELLOW:"#FFFF00"};
SocialCalc.FormatNumber.alloweddates = {H:"h]", M:"m]", MM:"mm]", S:"s]", SS:"ss]"};
SocialCalc.FormatNumber.commands = {copy:1, color:2, integer_placeholder:3, fraction_placeholder:4, decimal:5, currency:6, general:7, separator:8, date:9, comparison:10, section:11, style:12};
SocialCalc.FormatNumber.datevalues = {julian_offset:2415019, seconds_in_a_day:86400, seconds_in_an_hour:3600};
SocialCalc.FormatNumber.formatNumberWithFormat = function(a, b, c) {
  c = SocialCalc.Constants;
  var d = SocialCalc.FormatNumber, e, f, g, h, l, n, p, r, s, q, t, u = "", v, A, w, z, y, C, G, H, M, Q, J;
  if ("string" == typeof a && !a.length) {
    return "";
  }
  J = a - 0;
  if (!isFinite(J)) {
    return "string" == typeof a ? d.formatTextWithFormat(a, b) : "NaN";
  }
  a = J;
  var N = 0 > J ? 1 : 0;
  N && (J = -J);
  w = 0 == J ? 1 : 0;
  d.parse_format_string(d.format_definitions, b);
  b = d.format_definitions[b];
  if (!b) {
    throw "Format not parsed error!";
  }
  v = b.sectioninfo.length - 1;
  if (b.hascomparison) {
    for (w = t = v = 0;;w++) {
      e = b.operators[w];
      f = b.operands[w];
      if (!e) {
        t && (b = "General", d.parse_format_string(d.format_definitions, b), b = d.format_definitions[b], v = 0);
        break;
      }
      if (e == d.commands.section) {
        if (!t) {
          break;
        }
        t = 0;
        v++;
      } else {
        if (e == d.commands.comparison) {
          t = f.indexOf(":");
          A = f.substring(0, t);
          f = f.substring(t + 1) - 0;
          if ("<" == A && a < f || "<=" == A && a <= f || "=" == A && a == f || "<>" == A && a != f || ">=" == A && a >= f || ">" == A && a > f) {
            break;
          }
          t = 1;
        }
      }
    }
  } else {
    if (0 < v) {
      if (1 == v) {
        N ? (N = 0, v = 1) : v = 0;
      } else {
        if (2 == v || 3 == v) {
          N ? (N = 0, v = 1) : v = w ? 2 : 0;
        }
      }
    }
  }
  v = b.sectioninfo[v];
  if (0 < v.commas) {
    for (t = 0;t < v.commas;t++) {
      J /= 1E3;
    }
  }
  if (0 < v.percent) {
    for (t = 0;t < v.percent;t++) {
      J *= 100;
    }
  }
  f = 1;
  for (t = 0;t < v.fractiondigits;t++) {
    f *= 10;
  }
  w = Math.floor(J * f + 0.5);
  w /= f;
  if ("number" != typeof w || !isFinite(w)) {
    return "NaN";
  }
  f = w + "";
  0 == w && (v.fractiondigits || v.integerdigits) && (N = 0);
  if (0 <= f.indexOf("e")) {
    return a + "";
  }
  f = f.match(/^\+{0,1}(\d*)(?:\.(\d*)){0,1}$/);
  if (!f) {
    return "NaN";
  }
  (w = f[1]) && "0" != w || (w = "");
  (A = f[2]) || (A = "");
  if (v.hasdate) {
    if (0 > a) {
      return "??-???-??&nbsp;??:??:??";
    }
    g = (a - Math.floor(a)) * d.datevalues.seconds_in_a_day;
    h = a * d.datevalues.seconds_in_a_day;
    l = Math.floor(g / d.datevalues.seconds_in_an_hour);
    p = Math.floor(h / d.datevalues.seconds_in_an_hour);
    g -= l * d.datevalues.seconds_in_an_hour;
    n = Math.floor(g / 60);
    r = Math.floor(h / 60);
    f = 1;
    for (t = 0;t < v.fractiondigits;t++) {
      f *= 10;
    }
    g = Math.floor((g - 60 * n) * f + 0.5);
    g /= f;
    h = Math.floor(h * f + 0.5);
    h /= f;
    60 <= g && (g = 0, n++, r++, 60 <= n && (n = 0, l++, p++, 24 <= l && (l = 0, a++)));
    A = g - Math.floor(g) + "";
    A = A.substring(2);
    q = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(Math.floor(a + d.datevalues.julian_offset));
    t = 0;
    for (mspos = v.sectionstart;;mspos++) {
      e = b.operators[mspos];
      f = b.operands[mspos];
      if (!e) {
        break;
      }
      if (e == d.commands.section) {
        break;
      }
      e == d.commands.date ? ("am/pm" != f.toLowerCase() && "a/p" != f.toLowerCase() || s || (12 <= l ? (l -= 12, s = "a/p" == f.toLowerCase() ? c.s_FormatNumber_pm1 : c.s_FormatNumber_pm) : s = "a/p" == f.toLowerCase() ? c.s_FormatNumber_am1 : c.s_FormatNumber_am, 0 > f.indexOf(s) && (s = s.toLowerCase())), !t || "m" != f && "mm" != f || (b.operands[mspos] += "in"), t = "h" == f.charAt(0) ? 1 : 0) : e != d.commands.copy && (t = 0);
    }
    t = 0;
    for (--mspos;;mspos--) {
      e = b.operators[mspos];
      f = b.operands[mspos];
      if (!e) {
        break;
      }
      if (e == d.commands.section) {
        break;
      }
      e == d.commands.date ? (!t || "m" != f && "mm" != f || (b.operands[mspos] += "in"), t = "ss" == f ? 1 : 0) : e != d.commands.copy && (t = 0);
    }
  }
  C = y = z = 0;
  H = G = "";
  M = c.FormatNumber_separatorchar;
  0 <= M.indexOf(" ") && (M = M.replace(/ /g, "&nbsp;"));
  Q = c.FormatNumber_decimalchar;
  0 <= Q.indexOf(" ") && (Q = Q.replace(/ /g, "&nbsp;"));
  for (t = v.sectionstart;e = b.operators[t];) {
    if (f = b.operands[t++], e == d.commands.copy) {
      u += f;
    } else {
      if (e == d.commands.color) {
        G = f;
      } else {
        if (e == d.commands.style) {
          H = f;
        } else {
          if (e == d.commands.integer_placeholder) {
            N && (u += "-", N = 0);
            z++;
            if (1 == z && w.length > v.integerdigits) {
              for (;y < w.length - v.integerdigits;y++) {
                u += w.charAt(y), v.thousandssep && (e = w.length - y - 1, 2 < e && 0 == e % 3 && (u += M));
              }
            }
            if (w.length < v.integerdigits && z <= v.integerdigits - w.length) {
              if ("0" == f || "?" == f) {
                u += "0" == f ? "0" : "&nbsp;", v.thousandssep && (e = v.integerdigits - z, 2 < e && 0 == e % 3 && (u += M));
              }
            } else {
              u += w.charAt(y), v.thousandssep && (e = w.length - y - 1, 2 < e && 0 == e % 3 && (u += M)), y++;
            }
          } else {
            if (e == d.commands.fraction_placeholder) {
              if (C >= A.length) {
                if ("0" == f || "?" == f) {
                  u += "0" == f ? "0" : "&nbsp;";
                }
              } else {
                u += A.charAt(C);
              }
              C++;
            } else {
              if (e == d.commands.decimal) {
                N && (u += "-", N = 0), u += Q;
              } else {
                if (e == d.commands.currency) {
                  N && (u += "-", N = 0), u += f;
                } else {
                  if (e == d.commands.general) {
                    if (0 != J && (f = Math.floor(Math.LOG10E * Math.log(J)), f = Math.pow(10, 13 - f), J = Math.floor(f * J + 0.5) / f, !isFinite(J))) {
                      return "NaN";
                    }
                    N && (u += "-");
                    f = J + "";
                    if (0 <= f.indexOf("e")) {
                      u += f;
                    } else {
                      f = f.match(/^\+{0,1}(\d*)(?:\.(\d*)){0,1}$/);
                      (w = f[1]) && "0" != w || (w = "");
                      (A = f[2]) || (A = "");
                      C = y = 0;
                      if (w.length) {
                        for (;y < w.length;y++) {
                          u += w.charAt(y), v.thousandssep && (e = w.length - y - 1, 2 < e && 0 == e % 3 && (u += M));
                        }
                      } else {
                        u += "0";
                      }
                      if (A.length) {
                        for (u += Q;C < A.length;C++) {
                          u += A.charAt(C);
                        }
                      }
                    }
                  } else {
                    if (e == d.commands.date) {
                      f = f.toLowerCase(), "y" == f || "yy" == f ? u += (q.year + "").substring(2) : "yyyy" == f ? u += q.year + "" : "d" == f ? u += q.day + "" : "dd" == f ? (f = 1E3 + q.day, u += (f + "").substr(2)) : "ddd" == f ? (f = Math.floor(a + 6) % 7, u += c.s_FormatNumber_daynames3[f]) : "dddd" == f ? (f = Math.floor(a + 6) % 7, u += c.s_FormatNumber_daynames[f]) : "m" == f ? u += q.month + "" : "mm" == f ? (f = 1E3 + q.month, u += (f + "").substr(2)) : "mmm" == f ? u += c.s_FormatNumber_monthnames3[q.month - 
                      1] : "mmmm" == f ? u += c.s_FormatNumber_monthnames[q.month - 1] : "mmmmm" == f ? u += c.s_FormatNumber_monthnames[q.month - 1].charAt(0) : "h" == f ? u += l + "" : "h]" == f ? u += p + "" : "mmin" == f ? (f = 1E3 + n + "", u += f.substr(2)) : "mm]" == f ? 100 > r ? (f = 1E3 + r + "", u += f.substr(2)) : u += r + "" : "min" == f ? u += n + "" : "m]" == f ? u += r + "" : "hh" == f ? (f = 1E3 + l + "", u += f.substr(2)) : "s" == f ? (f = Math.floor(g), u += f + "") : "ss" == f ? 
                      (f = 1E3 + Math.floor(g) + "", u += f.substr(2)) : "am/pm" == f || "a/p" == f ? u += s : "ss]" == f && (100 > h ? (f = 1E3 + Math.floor(h) + "", u += f.substr(2)) : (f = Math.floor(h), u += f + ""));
                    } else {
                      if (e == d.commands.section) {
                        break;
                      } else {
                        e != d.commands.comparison && (u += "!! Parse error !!");
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  G && (u = '<span style="color:' + G + ';">' + u + "</span>");
  H && (u = '<span style="' + H + ';">' + u + "</span>");
  return u;
};
SocialCalc.FormatNumber.formatTextWithFormat = function(a, b) {
  var c = SocialCalc.FormatNumber, d = a + "", e = "", f, g, h = "", l = "";
  c.parse_format_string(c.format_definitions, b);
  thisformat = c.format_definitions[b];
  if (!thisformat) {
    throw "Format not parsed error!";
  }
  f = thisformat.sectioninfo.length - 1;
  if (0 == f) {
    f = 0;
  } else {
    if (3 == f) {
      f = 3;
    } else {
      return d;
    }
  }
  for (f = thisformat.sectioninfo[f].sectionstart;op = thisformat.operators[f];) {
    g = thisformat.operands[f++], op == c.commands.copy ? e = "@" == g ? e + d : e + g.replace(/ /g, "&nbsp;") : op == c.commands.color ? h = g : op == c.commands.style && (l = g);
  }
  h && (e = '<span style="color:' + h + ';">' + e + "</span>");
  l && (e = '<span style="' + l + ';">' + e + "</span>");
  return e;
};
SocialCalc.FormatNumber.parse_format_string = function(a, b) {
  var c = SocialCalc.FormatNumber, d, e, f = 1, g, h, l, n, p, r, s, q, t, u, v, A, w;
  if (!a[b]) {
    d = {operators:[], operands:[], sectioninfo:[{}]};
    a[b] = d;
    e = 0;
    sectioninfo = d.sectioninfo[e];
    sectioninfo.sectionstart = 0;
    sectioninfo.integerdigits = 0;
    sectioninfo.fractiondigits = 0;
    sectioninfo.commas = 0;
    for (w = sectioninfo.percent = 0;w < b.length;w++) {
      if (t = b.charAt(w), p) {
        '"' == t ? (p = 0, d.operators.push(c.commands.copy), d.operands.push(r)) : r += t;
      } else {
        if (s) {
          "]" == t ? (s = 0, t = SocialCalc.FormatNumber.parse_format_bracket(q), t.operator == c.commands.separator ? sectioninfo.thousandssep = 1 : (t.operator == c.commands.date && (sectioninfo.hasdate = 1), t.operator == c.commands.comparison && (d.hascomparison = 1), d.operators.push(t.operator), d.operands.push(t.operand))) : q += t;
        } else {
          if (h) {
            d.operators.push(c.commands.copy), d.operands.push(t), h = !1;
          } else {
            if (l) {
              d.operators.push(c.commands.copy), d.operands.push(t + t + t + t + t), l = !1;
            } else {
              if (n) {
                d.operators.push(c.commands.copy), d.operands.push("&nbsp;"), n = !1;
              } else {
                if (u) {
                  if ("general".charAt(u) == t.toLowerCase()) {
                    u++;
                    7 == u && (d.operators.push(c.commands.general), d.operands.push(t), u = 0);
                    continue;
                  }
                  u = 0;
                }
                if (A) {
                  if (A.charAt(0) == t) {
                    A += t;
                    continue;
                  }
                  d.operators.push(c.commands.date);
                  d.operands.push(A);
                  sectioninfo.hasdate = 1;
                  A = "";
                }
                if (v) {
                  if (v += t, t = v.toLowerCase(), t != "am/pm".substring(0, t.length) && t != "a/p".substring(0, t.length)) {
                    ampstr = "";
                  } else {
                    if ("am/pm" == t || "a/p" == t) {
                      d.operators.push(c.commands.date), d.operands.push(v), v = "";
                    }
                  }
                } else {
                  "#" == t || "0" == t || "?" == t ? (f ? (sectioninfo.integerdigits++, sectioninfo.commas && (sectioninfo.thousandssep = 1, sectioninfo.commas = 0), g = 1, d.operators.push(c.commands.integer_placeholder)) : (sectioninfo.fractiondigits++, g = 1, d.operators.push(c.commands.fraction_placeholder)), d.operands.push(t)) : "." == t ? (g = 0, d.operators.push(c.commands.decimal), d.operands.push(t), f = 0) : "$" == t ? (g = 0, d.operators.push(c.commands.currency), d.operands.push(t)) : 
                  "," == t ? g ? sectioninfo.commas++ : (d.operators.push(c.commands.copy), d.operands.push(t)) : "%" == t ? (g = 0, sectioninfo.percent++, d.operators.push(c.commands.copy), d.operands.push(t)) : '"' == t ? (g = 0, p = 1, r = "") : "[" == t ? (g = 0, s = 1, q = "") : "\\" == t ? (h = 1, g = 0) : "*" == t ? (l = 1, g = 0) : "_" == t ? (n = 1, g = 0) : ";" == t ? (e++, d.sectioninfo[e] = {}, sectioninfo = d.sectioninfo[e], sectioninfo.sectionstart = 1 + d.operators.length, sectioninfo.integerdigits = 
                  0, sectioninfo.fractiondigits = 0, sectioninfo.commas = 0, sectioninfo.percent = 0, f = 1, g = 0, d.operators.push(c.commands.section), d.operands.push(t)) : "g" == t.toLowerCase() ? (u = 1, g = 0) : "a" == t.toLowerCase() ? (v = t, g = 0) : 0 <= "dmyhHs".indexOf(t) ? A = t : (g = 0, d.operators.push(c.commands.copy), d.operands.push(t));
                }
              }
            }
          }
        }
      }
    }
    A && (d.operators.push(c.commands.date), d.operands.push(A), sectioninfo.hasdate = 1);
  }
};
SocialCalc.FormatNumber.parse_format_bracket = function(a) {
  var b = SocialCalc.FormatNumber, c = SocialCalc.Constants, d = {}, e;
  "$" == a.charAt(0) ? (d.operator = b.commands.currency, e = a.match(/^\$(.+?)(\-.+?){0,1}$/), d.operand = e ? e[1] || c.FormatNumber_defaultCurrency || "$" : a.substring(1) || c.FormatNumber_defaultCurrency || "$") : "?$" == a ? (d.operator = b.commands.currency, d.operand = "[?$]") : b.allowedcolors[a.toUpperCase()] ? (d.operator = b.commands.color, d.operand = b.allowedcolors[a.toUpperCase()]) : (e = a.match(/^style=([^"]*)$/)) ? (d.operator = b.commands.style, d.operand = e[1]) : "," == a ? 
  (d.operator = b.commands.separator, d.operand = a) : b.alloweddates[a.toUpperCase()] ? (d.operator = b.commands.date, d.operand = b.alloweddates[a.toUpperCase()]) : a.match(/^[<>=]/) ? (e = a.match(/^([<>=]+)(.+)$/), d.operator = b.commands.comparison, d.operand = e[1] + ":" + e[2]) : (d.operator = b.commands.copy, d.operand = "[" + a + "]");
  return d;
};
SocialCalc.FormatNumber.convert_date_gregorian_to_julian = function(a, b, c) {
  c = c - 32075 + SocialCalc.intFunc(1461 * (a + 4800 + SocialCalc.intFunc((b - 14) / 12)) / 4);
  c += SocialCalc.intFunc(367 * (b - 2 - 12 * SocialCalc.intFunc((b - 14) / 12)) / 12);
  return c -= SocialCalc.intFunc(3 * SocialCalc.intFunc((a + 4900 + SocialCalc.intFunc((b - 14) / 12)) / 100) / 4);
};
SocialCalc.FormatNumber.convert_date_julian_to_gregorian = function(a) {
  var b, c, d, e;
  a += 68569;
  b = Math.floor(4 * a / 146097);
  a -= Math.floor((146097 * b + 3) / 4);
  c = Math.floor(4E3 * (a + 1) / 1461001);
  a = a - Math.floor(1461 * c / 4) + 31;
  d = Math.floor(80 * a / 2447);
  e = a - Math.floor(2447 * d / 80);
  a = Math.floor(d / 11);
  return{year:100 * (b - 49) + c + a, month:d + 2 - 12 * a, day:e};
};
SocialCalc.intFunc = function(a) {
  return 0 > a ? -Math.floor(-a) : Math.floor(a);
};
SocialCalc || (SocialCalc = {});
SocialCalc.Formula = {};
SocialCalc.TriggerIoAction = {};
SocialCalc.Formula.ParseState = {num:1, alpha:2, coord:3, string:4, stringquote:5, numexp1:6, numexp2:7, alphanumeric:8, specialvalue:9};
SocialCalc.Formula.TokenType = {num:1, coord:2, op:3, name:4, error:5, string:6, space:7};
SocialCalc.Formula.CharClass = {num:1, numstart:2, op:3, eof:4, alpha:5, incoord:6, error:7, quote:8, space:9, specialstart:10};
SocialCalc.Formula.CharClassTable = {" ":9, "!":3, '"':8, "'":8, "#":10, $:6, "%":3, "&":3, "(":3, ")":3, "*":3, "+":3, ",":3, "-":3, ".":2, "/":3, 0:1, 1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, ":":3, "<":3, "=":3, ">":3, A:5, B:5, C:5, D:5, E:5, F:5, G:5, H:5, I:5, J:5, K:5, L:5, M:5, N:5, O:5, P:5, Q:5, R:5, S:5, T:5, U:5, V:5, W:5, X:5, Y:5, Z:5, "^":3, _:5, a:5, b:5, c:5, d:5, e:5, f:5, g:5, h:5, i:5, j:5, k:5, l:5, m:5, n:5, o:5, p:5, q:5, r:5, s:5, t:5, u:5, v:5, w:5, x:5, y:5, z:5};
SocialCalc.Formula.UpperCaseTable = {a:"A", b:"B", c:"C", d:"D", e:"E", f:"F", g:"G", h:"H", i:"I", j:"J", k:"K", l:"L", m:"M", n:"N", o:"O", p:"P", q:"Q", r:"R", s:"S", t:"T", u:"U", v:"V", w:"W", x:"X", y:"Y", z:"Z", A:"A", B:"B", C:"C", D:"D", E:"E", F:"F", G:"G", H:"H", I:"I", J:"J", K:"K", L:"L", M:"M", N:"N", O:"O", P:"P", Q:"Q", R:"R", S:"S", T:"T", U:"U", V:"V", W:"W", X:"X", Y:"Y", Z:"Z"};
SocialCalc.Formula.SpecialConstants = {"#NULL!":"0,e#NULL!", "#NUM!":"0,e#NUM!", "#DIV/0!":"0,e#DIV/0!", "#VALUE!":"0,e#VALUE!", "#REF!":"0,e#REF!", "#NAME?":"0,e#NAME?"};
SocialCalc.Formula.TokenPrecedence = {"!":1, ":":2, ",":2, M:-3, P:-3, "%":4, "^":5, "*":6, "/":6, "+":7, "-":7, "&":8, "<":9, ">":9, G:9, L:9, N:9};
SocialCalc.Formula.TokenOpExpansion = {G:">=", L:"<=", M:"-", N:"<>", P:"+"};
SocialCalc.Formula.TypeLookupTable = {unaryminus:{"n*":"|n*:1|", "e*":"|e*:1|", "t*":"|t*:e#VALUE!|", b:"|b:n|"}, unaryplus:{"n*":"|n*:1|", "e*":"|e*:1|", "t*":"|t*:e#VALUE!|", b:"|b:n|"}, unarypercent:{"n*":"|n:n%|n*:n|", "e*":"|e*:1|", "t*":"|t*:e#VALUE!|", b:"|b:n|"}, plus:{"n%":"|n%:n%|nd:n|nt:n|ndt:n|n$:n|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|", nd:"|n%:n|nd:nd|nt:ndt|ndt:ndt|n$:n|n:nd|n*:n|b:n|e*:2|t*:e#VALUE!|", nt:"|n%:n|nd:ndt|nt:nt|ndt:ndt|n$:n|n:nt|n*:n|b:n|e*:2|t*:e#VALUE!|", ndt:"|n%:n|nd:ndt|nt:ndt|ndt:ndt|n$:n|n:ndt|n*:n|b:n|e*:2|t*:e#VALUE!|", 
n$:"|n%:n|nd:n|nt:n|ndt:n|n$:n$|n:n$|n*:n|b:n|e*:2|t*:e#VALUE!|", nl:"|n%:n|nd:n|nt:n|ndt:n|n$:n|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|", n:"|n%:n|nd:nd|nt:nt|ndt:ndt|n$:n$|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|", b:"|n%:n%|nd:nd|nt:nt|ndt:ndt|n$:n$|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|", "t*":"|n*:e#VALUE!|t*:e#VALUE!|b:e#VALUE!|e*:2|", "e*":"|e*:1|n*:1|t*:1|b:1|"}, concat:{t:"|t:t|th:th|tw:tw|tl:t|tr:tr|t*:2|e*:2|", th:"|t:th|th:th|tw:t|tl:th|tr:t|t*:t|e*:2|", tw:"|t:tw|th:t|tw:tw|tl:tw|tr:tw|t*:t|e*:2|", tl:"|t:tl|th:th|tw:tw|tl:tl|tr:tr|t*:t|e*:2|", 
"t*":"|t*:t|e*:2|", "e*":"|e*:1|n*:1|t*:1|"}, oneargnumeric:{"n*":"|n*:n|", "e*":"|e*:1|", "t*":"|t*:e#VALUE!|", b:"|b:n|"}, twoargnumeric:{"n*":"|n*:n|t*:e#VALUE!|e*:2|", "e*":"|e*:1|n*:1|t*:1|", "t*":"|t*:e#VALUE!|n*:e#VALUE!|e*:2|"}, propagateerror:{"n*":"|n*:2|e*:2|", "e*":"|e*:2|", "t*":"|t*:2|e*:2|", b:"|b:2|e*:2|"}};
SocialCalc.Formula.ParseFormulaIntoTokens = function(a) {
  var b, c, d, e, f, g;
  b = SocialCalc.Formula;
  var h = SocialCalc.Constants, l = b.ParseState, n = b.TokenType, p = b.CharClass, r = b.CharClassTable, s = b.UpperCaseTable, q = b.ParsePushToken, t = /^\$?[A-Z]{1,2}\$?[1-9]\d*$/i, u = [], v = "";
  f = 0;
  e = !1;
  for (b = 0;b <= a.length;b++) {
    b < a.length ? (c = a.charAt(b), d = r[c]) : (c = "", d = p.eof), f == l.num && (d == p.num ? v += c : d != p.numstart || e ? "E" == c || "e" == c ? (v += c, e = !1, f = l.numexp1) : (q(u, v, n.num, 0), e = !1, f = 0) : (e = !0, v += c)), f == l.numexp1 && (d == l.num ? f = l.numexp2 : "+" != c && "-" != c || "E" != s[v.charAt(v.length - 1)] ? "E" != c && "e" != c && (q(u, h.s_parseerrexponent, n.error, 0), f = 0) : v += c), f == l.numexp2 && (d == p.num ? v += c : (q(u, v, n.num, 0), f = 0)), 
    f == l.alpha && (d == p.num ? f = l.coord : d == p.alpha || "." == c ? v += c : d == p.incoord ? f = l.coord : (d == p.op || d == p.numstart || d == p.space || d == p.eof ? q(u, v.toUpperCase(), n.name, 0) : q(u, h.s_parseerrchar, n.error, 0), f = 0)), f == l.coord && (d == p.num ? v += c : d == p.incoord ? v += c : d == p.alpha ? f = l.alphanumeric : (d == p.op || d == p.numstart || d == p.eof || d == p.space ? (f = t.test(v) ? n.coord : n.name, q(u, v.toUpperCase(), f, 0)) : q(u, h.s_parseerrchar, 
    n.error, 0), f = 0)), f == l.alphanumeric && (d == p.num || d == p.alpha ? v += c : (d == p.op || d == p.numstart || d == p.space || d == p.eof ? q(u, v.toUpperCase(), n.name, 0) : q(u, h.s_parseerrchar, n.error, 0), f = 0)), f == l.string ? d == p.quote ? f = l.stringquote : d == p.eof ? (q(u, h.s_parseerrstring, n.error, 0), f = 0) : v += c : f == l.stringquote ? d == p.quote ? (v += c, f = l.string) : (q(u, v, n.string, 0), f = 0) : f == l.specialvalue && ("!" == v.charAt(v.length - 1) ? (q(u, 
    v, n.name, 0), f = 0) : d == p.eof ? (q(u, h.s_parseerrspecialvalue, n.error, 0), f = 0) : v += c), 0 == f && (d == p.num ? (v = c, f = l.num) : d == p.numstart ? (v = c, e = !0, f = l.num) : d == p.alpha || d == p.incoord ? (v = c, f = l.alpha) : d == p.specialstart ? (v = c, f = l.specialvalue) : d == p.op ? (v = c, 0 < u.length ? (f = u[u.length - 1], d = f.type, g = f.text, d != p.op || "<" != g && ">" != g || (v = g + v, u.pop(), 0 < u.length ? (f = u[u.length - 1], d = f.type, g = f.text) : 
    (d = p.eof, g = "EOF"))) : (d = p.eof, g = "EOF"), f = n.op, 0 == u.length || d == p.op && ")" != g && "%" != g ? "-" == v ? c = v = "M" : "+" == v ? c = v = "P" : ")" == v && "(" == g || "(" == v || (f = n.error, v = h.s_parseerrtwoops) : 1 < v.length && (">=" == v ? c = v = "G" : "<=" == v ? c = v = "L" : "<>" == v ? c = v = "N" : (f = n.error, v = h.s_parseerrtwoops)), q(u, v, f, c), f = 0) : d == p.quote ? (v = "", f = l.string) : d != p.space && d != p.eof && q(u, h.s_parseerrchar, n.error, 
    0));
  }
  return u;
};
SocialCalc.Formula.ParsePushToken = function(a, b, c, d) {
  a.push({text:b, type:c, opcode:d});
};
SocialCalc.Formula.evaluate_parsed_formula = function(a, b, c) {
  var d = SocialCalc.Formula, e;
  e = d.ConvertInfixToPolish(a);
  return d.EvaluatePolish(a, e, b, c);
};
SocialCalc.Formula.ConvertInfixToPolish = function(a) {
  var b = SocialCalc.Formula, c = SocialCalc.Constants, d = b.TokenType, b = b.TokenPrecedence, e = [], f = [], g = "", h, l, n, p;
  for (h = 0;h < a.length;h++) {
    if (l = a[h], n = l.type, p = l.text, n == d.num || n == d.coord || n == d.string) {
      e.push(h);
    } else {
      if (n == d.name) {
        f.push(h), e.push(-1);
      } else {
        if (n != d.space) {
          if ("," == p) {
            for (;f.length && "(" != a[f[f.length - 1]].text;) {
              e.push(f.pop());
            }
            if (0 == f.length) {
              g = c.s_parseerrmissingopenparen;
              break;
            }
          } else {
            if ("(" == p) {
              f.push(h);
            } else {
              if (")" == p) {
                for (;f.length && "(" != a[f[f.length - 1]].text;) {
                  e.push(f.pop());
                }
                if (0 == f.length) {
                  g = c.s_parseerrcloseparennoopen;
                  break;
                }
                f.pop();
                f.length && a[f[f.length - 1]].type == d.name && e.push(f.pop());
              } else {
                if (n == d.op) {
                  for (f.length && a[f[f.length - 1]].type == d.name && e.push(f.pop());f.length && a[f[f.length - 1]].type == d.op && "(" != a[f[f.length - 1]].text;) {
                    n = b[l.opcode];
                    p = b[a[f[f.length - 1]].opcode];
                    if (0 <= n && n < p) {
                      break;
                    } else {
                      if (0 > n && (n = -n, 0 > p && (p = -p), n <= p)) {
                        break;
                      }
                    }
                    e.push(f.pop());
                  }
                  f.push(h);
                } else {
                  g = n == d.error ? p : "Internal error while processing parsed formula. ";
                  break;
                }
              }
            }
          }
        }
      }
    }
  }
  for (;0 < f.length;) {
    if ("(" == a[f[f.length - 1]].text) {
      g = c.s_parseerrmissingcloseparen;
      break;
    }
    e.push(f.pop());
  }
  return g ? g : e;
};
"undefined" === typeof SocialCalc.debug_log && (SocialCalc.debug_log = []);
SocialCalc.DebugLog = function(a) {
  SocialCalc.debug_log.push(a);
};
SocialCalc.Formula.EvaluatePolish = function(a, b, c, d) {
  var e = SocialCalc.Formula, f = SocialCalc.Constants, g = e.TokenType, h = e.LookupResultType, l = e.TypeLookupTable, n = e.OperandAsNumber, p = e.OperandAsText, r = e.OperandValueAndType, s = e.OperandsAsCoordOnSheet, q = SocialCalc.format_number_for_display || function(a, b, c) {
    return a + "";
  }, t = "", u = {value:"", type:"e#VALUE!", error:f.s_parseerrmissingoperand}, v = [], A = function(a, b) {
    v.push({type:a, value:b});
  }, w, z, y, C, G, H;
  if (!(a.length && b instanceof Array)) {
    return{value:"", type:"e#VALUE!", error:"string" == typeof b ? b : ""};
  }
  SocialCalc.DebugLog({revpolish:b});
  SocialCalc.DebugLog({revpolish:b});
  var M = [];
  for (w = 0;w < b.length;w++) {
    if (z = b[w], -1 == z) {
      A("start", 0);
    } else {
      if (y = a[z], C = y.type, z = y.text, M.push(y), C == g.num) {
        A("n", z - 0);
      } else {
        if (C == g.coord) {
          A("coord", z);
        } else {
          if (C == g.string) {
            A("t", z);
          } else {
            if (C == g.op) {
              if (0 >= v.length) {
                return u;
              }
              if ("M" == z) {
                y = n(c, v), z = h(y.type, y.type, l.unaryminus), A(z, -y.value);
              } else {
                if ("P" == z) {
                  y = n(c, v), z = h(y.type, y.type, l.unaryplus), A(z, y.value);
                } else {
                  if ("%" == z) {
                    y = n(c, v), z = h(y.type, y.type, l.unarypercent), A(z, 0.01 * y.value);
                  } else {
                    if ("&" == z) {
                      if (1 >= v.length) {
                        return u;
                      }
                      C = p(c, v);
                      y = p(c, v);
                      z = h(y.type, y.type, l.concat);
                      A(z, y.value + C.value);
                    } else {
                      if (":" == z) {
                        if (1 >= v.length) {
                          return u;
                        }
                        y = e.OperandsAsRangeOnSheet(c, v);
                        y.error && (t = t || y.error);
                        A(y.type, y.value);
                      } else {
                        if ("!" == z) {
                          if (1 >= v.length) {
                            return u;
                          }
                          y = s(c, v);
                          y.error && (t = t || y.error);
                          A(y.type, y.value);
                        } else {
                          if ("<" == z || "L" == z || "=" == z || "G" == z || ">" == z || "N" == z) {
                            if (1 >= v.length) {
                              t = f.s_parseerrmissingoperand;
                              break;
                            }
                            C = r(c, v);
                            y = r(c, v);
                            "n" == y.type.charAt(0) && "n" == C.type.charAt(0) ? (G = 0, "<" == z ? G = y.value < C.value ? 1 : 0 : "L" == z ? G = y.value <= C.value ? 1 : 0 : "=" == z ? G = y.value == C.value ? 1 : 0 : "G" == z ? G = y.value >= C.value ? 1 : 0 : ">" == z ? G = y.value > C.value ? 1 : 0 : "N" == z && (G = y.value != C.value ? 1 : 0), A("nl", G)) : "e" == y.type.charAt(0) ? A(y.type, 0) : "e" == C.type.charAt(0) ? A(C.type, 0) : (G = y.type.charAt(0), H = C.type.charAt(0), "n" == 
                            G ? y.value = q(y.value, "n", "") : "b" == G && (y.value = ""), "n" == H ? C.value = q(C.value, "n", "") : "b" == H && (C.value = ""), G = 0, y.value = y.value.toLowerCase(), C.value = C.value.toLowerCase(), "<" == z ? G = y.value < C.value ? 1 : 0 : "L" == z ? G = y.value <= C.value ? 1 : 0 : "=" == z ? G = y.value == C.value ? 1 : 0 : "G" == z ? G = y.value >= C.value ? 1 : 0 : ">" == z ? G = y.value > C.value ? 1 : 0 : "N" == z && (G = y.value != C.value ? 1 : 0), A("nl", 
                            G));
                          } else {
                            if (1 >= v.length) {
                              t = f.s_parseerrmissingoperand;
                              break;
                            }
                            C = n(c, v);
                            y = n(c, v);
                            "+" == z ? (z = h(y.type, C.type, l.plus), A(z, y.value + C.value)) : "-" == z ? (z = h(y.type, C.type, l.plus), A(z, y.value - C.value)) : "*" == z ? (z = h(y.type, C.type, l.plus), A(z, y.value * C.value)) : "/" == z ? 0 != C.value ? A("n", y.value / C.value) : A("e#DIV/0!", 0) : "^" == z && (y.value = Math.pow(y.value, C.value), y.type = "n", isNaN(y.value) && (y.value = 0, y.type = "e#NUM!"), A(y.type, y.value));
                          }
                        }
                      }
                    }
                  }
                }
              }
            } else {
              if (C == g.name) {
                if (t = e.CalculateFunction(z, v, c, a.coord)) {
                  break;
                }
              } else {
                t = f.s_InternalError + "Unknown token " + C + " (" + z + "). ";
                break;
              }
            }
          }
        }
      }
    }
  }
  value = v[0] ? v[0].value : "";
  G = v[0] ? v[0].type : "";
  "name" == G && (y = SocialCalc.Formula.LookupName(c, value), value = y.value, G = y.type, t = t || y.error);
  "coord" == G && (y = r(c, v), value = y.value, G = y.type, "b" == G && (G = "n", value = 0));
  1 < v.length && !t && (t += f.s_parseerrerrorinformula);
  a = G;
  "e" == G.charAt(0) ? t = t || G.substring(1) || f.s_calcerrerrorvalueinformula : "range" == G && (b = value.match(/^(.*)\|(.*)\|/), c = b[1].indexOf("!"), b[1] = 0 <= c ? b[1].substring(c + 1) + "!" + b[1].substring(0, c).toUpperCase() : b[1].toUpperCase(), value = b[1] + ":" + b[2].toUpperCase(), d || (t = f.s_formularangeresult + " " + value));
  t && "e" != a.charAt(0) && (value = t, a = "e");
  "n" != a.charAt(0) || !isNaN(value) && isFinite(value) || (value = 0, a = "e#NUM!", t = isNaN(value) ? f.s_calcerrnumericnan : f.s_calcerrnumericoverflow);
  return{value:value, type:a, error:t};
};
SocialCalc.Formula.LookupResultType = function(a, b, c) {
  var d, e;
  e = c[a];
  if (!e && (e = c[a.charAt(0) + "*"], !e)) {
    return "e#VALUE! (internal error, missing LookupResultType " + a.charAt(0) + "*)";
  }
  c = e.indexOf("|" + b + ":");
  if (0 <= c) {
    d = e.indexOf("|", c + 1);
    if (0 > d) {
      return "e#VALUE! (internal error, incorrect LookupResultType " + e + ")";
    }
    e = e.substring(c + b.length + 2, d);
    return "1" == e ? a : "2" == e ? b : e;
  }
  c = e.indexOf("|" + b.charAt(0) + "*:");
  if (0 <= c) {
    d = e.indexOf("|", c + 1);
    if (0 > d) {
      return "e#VALUE! (internal error, incorrect LookupResultType " + e + ")";
    }
    e = e.substring(c + 4, d);
    return "1" == e ? a : "2" == e ? b : e;
  }
  return "e#VALUE!";
};
SocialCalc.Formula.TopOfStackValueAndType = function(a, b) {
  var c = SocialCalc.Formula, d = {type:"", value:""}, e = b.length;
  if (!e) {
    return d.error = SocialCalc.Constants.s_InternalError + "no operand on stack", d;
  }
  d.value = b[e - 1].value;
  d.type = b[e - 1].type;
  b.pop();
  "name" == d.type && (d = c.LookupName(a, d.value));
  return d;
};
SocialCalc.Formula.OperandAsNumber = function(a, b) {
  var c, d = SocialCalc.Formula.OperandValueAndType(a, b);
  c = d.type.charAt(0);
  "n" == c ? d.value -= 0 : "b" == c ? (d.type = "n", d.value = 0) : "e" == c ? d.value = 0 : (c = SocialCalc.DetermineValueType ? SocialCalc.DetermineValueType(d.value) : {value:d.value - 0, type:"n"}, "n" == c.type.charAt(0) ? d.value = c.value - 0 : d.value = 0, d.type = c.type);
  return d;
};
SocialCalc.Formula.OperandAsText = function(a, b) {
  var c, d = SocialCalc.Formula.OperandValueAndType(a, b);
  c = d.type.charAt(0);
  "t" != c && ("n" == c ? (d.value = SocialCalc.format_number_for_display ? SocialCalc.format_number_for_display(d.value, d.type, "") : d.value += "", d.type = "t") : "b" == c ? (d.value = "", d.type = "t") : "e" == c ? d.value = "" : (b.value = d.value + "", b.type = "t"));
  return d;
};
SocialCalc.Formula.OperandValueAndType = function(a, b) {
  var c, d, e;
  c = SocialCalc.Formula;
  var f = {type:"", value:""};
  d = b.length;
  if (!d) {
    return f.error = SocialCalc.Constants.s_InternalError + "no operand on stack", f;
  }
  f.value = b[d - 1].value;
  f.type = b[d - 1].type;
  b.pop();
  "name" == f.type && (f = c.LookupName(a, f.value));
  "range" == f.type && (f = c.StepThroughRangeDown(b, f.value));
  if ("coord" == f.type) {
    e = a;
    d = f.value.indexOf("!");
    if (-1 != d) {
      e = c.FindInSheetCache(f.value.substring(d + 1));
      if (null == e) {
        return f.type = "e#REF!", f.error = SocialCalc.Constants.s_sheetunavailable + " " + f.value.substring(d + 1), f.value = 0, f;
      }
      f.value = f.value.substring(0, d);
    }
    e ? (d = e.cells[SocialCalc.Formula.PlainCoord(f.value)]) ? (c = d.valuetype, f.value = d.datavalue) : c = "b" : (c = "e#N/A", f.value = 0);
    f.type = c || "b";
    "b" == f.type && (f.value = 0);
  }
  return f;
};
SocialCalc.Formula.OperandAsCoord = function(a, b) {
  return SocialCalc.Formula.OperandAsType(a, b, "coord");
};
SocialCalc.Formula.OperandAsRange = function(a, b) {
  return SocialCalc.Formula.OperandAsType(a, b, "range");
};
SocialCalc.Formula.OperandAsType = function(a, b, c) {
  var d = {type:"", value:""}, e = b.length;
  d.value = b[e - 1].value;
  d.type = b[e - 1].type;
  b.pop();
  "name" == d.type && (d = SocialCalc.Formula.LookupName(a, d.value));
  d.type != c && (d.value = SocialCalc.Constants.s_calcerrcellrefmissing, d.type = "e#REF!");
  return d;
};
SocialCalc.Formula.OperandsAsCoordOnSheet = function(a, b) {
  var c, d, e, f = {}, g = {};
  e = SocialCalc.Formula;
  c = b.length;
  f.value = b[c - 1].value;
  f.type = b[c - 1].type;
  b.pop();
  c = e.OperandAsSheetName(a, b);
  d = e.FindInSheetCache(c.value);
  if (null == d) {
    return g.type = "e#REF!", g.value = 0, g.error = SocialCalc.Constants.s_sheetunavailable + " " + c.value, g;
  }
  "name" == f.type && (f = e.LookupName(d, f.value));
  g.type = f.type;
  "coord" == f.type ? g.value = f.value + "!" + c.value : "range" == f.type ? (e = f.value.indexOf("|"), d = f.value.indexOf("|", e + 1), g.value = f.value.substring(0, e) + "!" + c.value + "|" + f.value.substring(e + 1, d) + "|") : "e" == f.type.charAt(0) ? g.value = f.value : (g.error = SocialCalc.Constants.s_calcerrcellrefmissing, g.type = "e#REF!", g.value = 0);
  return g;
};
SocialCalc.Formula.OperandsAsRangeOnSheet = function(a, b) {
  var c, d, e, f, g = {}, h = SocialCalc.Formula, l = SocialCalc.Constants;
  c = b.length;
  g.value = b[c - 1].value;
  g.type = b[c - 1].type;
  b.pop();
  c = h.OperandAsCoord(a, b);
  if ("coord" != c.type) {
    return{value:0, type:"e#REF!"};
  }
  d = a;
  e = c.value.indexOf("!");
  if (-1 != e && (f = c.value.indexOf("|", e + 1), 0 > f && (f = c.value.length), d = h.FindInSheetCache(c.value.substring(e + 1, f)), null == d)) {
    return{value:0, type:"e#REF!", errortext:l.s_sheetunavailable + " " + c.value.substring(e + 1, f)};
  }
  "name" == g.type && (g = h.LookupName(d, g.value, "end"));
  return "coord" == g.type ? {value:c.value + "|" + g.value + "|", type:"range"} : {value:l.s_calcerrcellrefmissing, type:"e#REF!"};
};
SocialCalc.Formula.OperandAsSheetName = function(a, b) {
  var c, d = {type:"", value:""};
  c = b.length;
  d.value = b[c - 1].value;
  d.type = b[c - 1].type;
  b.pop();
  if ("name" == d.type) {
    c = SocialCalc.Formula.LookupName(a, d.value);
    if (!c.value) {
      return d;
    }
    d.value = c.value;
    d.type = c.type;
  }
  "coord" == d.type && ((c = a.cells[SocialCalc.Formula.PlainCoord(d.value)]) ? (d.value = c.datavalue, d.type = c.valuetype) : (d.value = "", d.type = "b"));
  "t" != d.type.charAt(0) && (d.value = "", d.error = SocialCalc.Constants.s_calcerrsheetnamemissing);
  return d;
};
SocialCalc.Formula.LookupName = function(a, b, c) {
  var d, e, f = a.names;
  e = {};
  d = !1;
  if (f[b.toUpperCase()]) {
    e.value = f[b.toUpperCase()].definition;
    if ("=" == e.value.charAt(0)) {
      if (!a.checknamecirc) {
        a.checknamecirc = {}, d = !0;
      } else {
        if (a.checknamecirc[b]) {
          return e.type = "e#NAME?", e.error = SocialCalc.Constants.s_circularnameref + ' "' + b + '".', e;
        }
      }
      a.checknamecirc[b] = !0;
      e = SocialCalc.Formula.ParseFormulaIntoTokens(e.value.substring(1));
      e = SocialCalc.Formula.evaluate_parsed_formula(e, a, 1);
      delete a.checknamecirc[b];
      d && delete a.checknamecirc;
      if ("range" != e.type) {
        return e;
      }
    }
    a = e.value.indexOf(":");
    -1 != a ? (e.type = "range", e.value = e.value.substring(0, a) + "|" + e.value.substring(a + 1) + "|") : e.type = "coord";
    e.value = e.value.toUpperCase();
  } else {
    (d = SocialCalc.Formula.SpecialConstants[b.toUpperCase()]) ? (a = d.indexOf(","), e.value = d.substring(0, a) - 0, e.type = d.substring(a + 1)) : /^[a-zA-Z][a-zA-Z]?$/.test(b) ? (e.type = "coord", e.value = b.toUpperCase() + (c ? a.attribs.lastrow : 1)) : (e.value = "", e.type = "e#NAME?", e.error = SocialCalc.Constants.s_calcerrunknownname + ' "' + b + '"');
  }
  return e;
};
SocialCalc.Formula.StepThroughRangeDown = function(a, b) {
  var c, d, e, f, g, h, l, n, p = SocialCalc.Formula;
  f = b.indexOf("|");
  e = b.indexOf("|", f + 1);
  c = b.substring(0, f);
  d = b.substring(f + 1, e);
  e = b.substring(e + 1) - 0;
  f = c.indexOf("!");
  -1 != f ? (g = c.substring(f), c = c.substring(0, f)) : g = "";
  f = d.indexOf("!");
  -1 != f && (d = d.substring(0, f));
  f = p.OrderRangeParts(c, d);
  n = 0;
  for (l = f.r1;l <= f.r2;l++) {
    for (h = f.c1;h <= f.c2;h++) {
      if (n++, n > e) {
        return l == f.r2 && h == f.c2 || p.PushOperand(a, "range", c + g + "|" + d + "|" + n), {value:SocialCalc.crToCoord(h, l) + g, type:"coord"};
      }
    }
  }
};
SocialCalc.Formula.DecodeRangeParts = function(a, b) {
  var c, d, e, f, g = SocialCalc.Formula;
  e = b.indexOf("|");
  f = b.indexOf("|", e + 1);
  c = b.substring(0, e);
  d = b.substring(e + 1, f);
  e = c.indexOf("!");
  -1 != e ? (f = c.substring(e + 1), c = c.substring(0, e)) : f = "";
  e = d.indexOf("!");
  -1 != e && (d = d.substring(0, e));
  e = a;
  if (f && (e = g.FindInSheetCache(f), null == e)) {
    return null;
  }
  c = g.OrderRangeParts(c, d);
  return{sheetdata:e, sheetname:f, col1num:c.c1, ncols:c.c2 - c.c1 + 1, row1num:c.r1, nrows:c.r2 - c.r1 + 1};
};
SocialCalc.Formula.FunctionList || (SocialCalc.Formula.FunctionList = {});
SocialCalc.Formula.FunctionClasses = null;
SocialCalc.Formula.FunctionArgDefs = {};
SocialCalc.Formula.StoreIoEventFormula = function(a, b, c, d, e) {
  var f = [];
  SocialCalc.Formula.Clone(f, c);
  f.reverse();
  if (0 != f.length) {
    "RADIOBUTTON" == a && "undefined" === typeof d.ioEventTree && (d.ioEventTree = {});
    "undefined" === typeof d.ioEventTree && (d.ioEventTree = {});
    "undefined" === typeof d.ioParameterList && (d.ioParameterList = {});
    "undefined" === typeof d.ioTimeTriggerList && (d.ioTimeTriggerList = {});
    "undefined" === typeof d.ioParameterList[b] && (d.ioParameterList[b] = {});
    d.ioParameterList[b] = f;
    d.ioParameterList[b].function_name = a;
    if ("TimeTrigger" == e) {
      var g = function(a, b, c) {
        b = c.cells[b];
        "undefined" !== typeof b && "n" == b.valuetype.charAt(0) && a.push(b.datavalue);
      }, h = SocialCalc.Formula.PlainCoord(f[0].value);
      c = [];
      if ("range" == f[0].type) {
        for (var l = SocialCalc.Formula.DecodeRangeParts(d, h), n = 0;n < l.ncols;n++) {
          for (var p = 0;p < l.nrows;p++) {
            var r = SocialCalc.crToCoord(l.col1num + n, l.row1num + p);
            g(c, r, d);
          }
        }
      }
      "coord" == f[0].type && g(c, h, d);
      "n" == f[0].type.charAt(0) && c.push(f[0].value);
      if ("undefined" === typeof d.ioTimeTriggerList[b] || !1 == SocialCalc.Formula.ArrayValuesEqual(d.ioTimeTriggerList[b], c)) {
        d.ioTimeTriggerList[b] = c;
        l = (new Date).getTimezoneOffset();
        n = [];
        for (p = 0;p < c.length;++p) {
          n[p] = Math.floor(1440 * (c[p] - 25569) + l);
        }
        d.ScheduleSheetCommands("settimetrigger " + b + " " + n.toString());
      }
    }
    if ("EventTree" == e && ("coord" == f[0].type || "range" == f[0].type)) {
      c = f[0].value.replace(/\$/g, "");
      g = function(a, b, c) {
        "undefined" === typeof a[b] && (a[b] = {});
        a[b][c] = c;
      };
      if ("range" == f[0].type) {
        for (l = SocialCalc.Formula.DecodeRangeParts(d, c), n = 0;n < l.ncols;n++) {
          for (p = 0;p < l.nrows;p++) {
            h = SocialCalc.crToCoord(l.col1num + n, l.row1num + p), g(d.ioEventTree, h, b);
          }
        }
      }
      "coord" == f[0].type && g(d.ioEventTree, c, b);
    }
    if ("Input" == e && (e = null != SocialCalc.CurrentSpreadsheetControlObject ? SocialCalc.CurrentSpreadsheetControlObject.formDataViewer : SocialCalc.CurrentSpreadsheetViewerObject.formDataViewer, null != e && !0 == e.loaded)) {
      null == e.formFields && SocialCalc.Formula.LoadFormFields();
      l = (a + b).toLowerCase();
      c = null;
      null == e.formFields[l] && (c = e.formFields[l] = e.formFieldsLength++ + 2, c = "set " + SocialCalc.crToCoord(c, 1) + " text t " + SocialCalc.encodeForSave(a.toLowerCase() + b));
      if ("t" == f[0].type.charAt(0) || "n" == f[0].type.charAt(0)) {
        if (a = SocialCalc.crToCoord(e.formFields[l], 2), null == e.sheet.cells[a] || e.sheet.cells[a].datavalue != f[0].value) {
          f = "set " + a + " text t " + SocialCalc.encodeForSave(f[0].value), c = null != c ? c + "\n" + f : f;
        }
      }
      null != c && e.sheet.ScheduleSheetCommands(c, !1);
    }
    SocialCalc.DebugLog({ioEventTree:d.ioEventTree});
    SocialCalc.DebugLog({ioParameterList:d.ioParameterList});
  }
};
SocialCalc.Formula.ArrayValuesEqual = function(a, b) {
  var c = a.length;
  if (c != b.length) {
    return!1;
  }
  for (;c--;) {
    if (a[c] !== b[c]) {
      return!1;
    }
  }
  return!0;
};
SocialCalc.Formula.Clone = function(a, b) {
  for (var c in b) {
    "object" === typeof b[c] && null !== b[c] && a[c] ? SocialCalc.Formula.Clone(a[c], b[c]) : a[c] = b[c];
  }
};
SocialCalc.Formula.LoadFormFields = function() {
  var a = null != SocialCalc.CurrentSpreadsheetControlObject ? SocialCalc.CurrentSpreadsheetControlObject.formDataViewer : SocialCalc.CurrentSpreadsheetViewerObject.formDataViewer;
  a.formFields = {};
  null == a.sheet.cells.A1 && a.sheet.ScheduleSheetCommands("set A1 text t " + SocialCalc.encodeForSave("FieldName:"), !1);
  null == a.sheet.cells.A2 && a.sheet.ScheduleSheetCommands("set A2 text t " + SocialCalc.encodeForSave("Pending:"), !1);
  for (var b = 2;;) {
    var c = SocialCalc.crToCoord(b, 1), c = a.sheet.cells[c];
    if (!c) {
      break;
    }
    a.formFields[c.datavalue.toLowerCase()] = b;
    b++;
  }
  a.formFieldsLength = b - 2;
};
SocialCalc.Formula.CalculateFunction = function(a, b, c, d) {
  var e, f, g, h, l = SocialCalc.Formula;
  f = "";
  if (e = l.FunctionList[a]) {
    f = [];
    g = e[0];
    h = e[1];
    l.CopyFunctionArgs(b, f);
    e[6] && "" != e[6] && (SocialCalc.DebugLog("action:" + a), l.StoreIoEventFormula(a, d, f, c, e[6]));
    if (100 != h) {
      if (0 > h) {
        if (f.length < -h) {
          return f = l.FunctionArgsError(a, b);
        }
      } else {
        if (f.length != h) {
          return f = l.FunctionArgsError(a, b);
        }
      }
    }
    f = g(a, b, f, c);
  } else {
    b.length && "start" == b[b.length - 1].type ? (b.pop(), l.PushOperand(b, "name", a)) : f = SocialCalc.Constants.s_sheetfuncunknownfunction + " " + a + ". ";
  }
  return f;
};
SocialCalc.Formula.PushOperand = function(a, b, c) {
  a.push({type:b, value:c});
};
SocialCalc.Formula.CopyFunctionArgs = function(a, b) {
  for (;0 < a.length && "start" != a[a.length - 1].type;) {
    b.push(a.pop());
  }
  a.pop();
};
SocialCalc.Formula.FunctionArgsError = function(a, b) {
  var c = SocialCalc.Constants.s_calcerrincorrectargstofunction + " " + a + ". ";
  SocialCalc.Formula.PushOperand(b, "e#VALUE!", c);
  return c;
};
SocialCalc.Formula.FunctionSpecificError = function(a, b, c, d) {
  SocialCalc.Formula.PushOperand(b, c, d);
  return d;
};
SocialCalc.Formula.CheckForErrorValue = function(a, b) {
  return "e" == b.type.charAt(0) ? (a.push(b), !0) : !1;
};
SocialCalc.Formula.FillFunctionInfo = function() {
  var a = SocialCalc.Formula, b = SocialCalc.Constants, c, d, e;
  if (!a.FunctionClasses) {
    for (c in a.FunctionList) {
      d = a.FunctionList[c], d[2] && (a.FunctionArgDefs[d[2]] = b["s_farg_" + d[2]] || ""), d[3] || b["s_fdef_" + c] && (a.FunctionList[c][3] = b["s_fdef_" + c]);
    }
    a.FunctionClasses = {};
    for (d = 0;d < b.function_classlist.length;d++) {
      e = b.function_classlist[d], a.FunctionClasses[e] = {name:b["s_fclass_" + e], items:[]};
    }
    for (c in a.FunctionList) {
      for (d = a.FunctionList[c], b = d[4] ? d[4].split(",") : [], b.push("all"), d = 0;d < b.length;d++) {
        e = b[d], a.FunctionClasses[e].items.push(c);
      }
    }
    for (e in a.FunctionClasses) {
      a.FunctionClasses[e].items.sort();
    }
  }
};
SocialCalc.Formula.FunctionArgString = function(a) {
  var b = SocialCalc.Formula;
  a = b.FunctionList[a];
  var c;
  c = a[2];
  if (!c) {
    if (a = a[1], 0 == a) {
      c = " ";
    } else {
      if (0 < a) {
        c = "v1";
        for (b = 2;b <= a;b++) {
          c += ", v" + b;
        }
        return c;
      }
      if (0 > a) {
        c = "v1";
        for (b = 2;b < -a;b++) {
          c += ", v" + b;
        }
        return c + ", ...";
      }
      return "nargs: " + a;
    }
  }
  return c = b.FunctionArgDefs[c] || c;
};
SocialCalc.Formula.SeriesFunctions = function(a, b, c, d) {
  var e, f;
  e = SocialCalc.Formula;
  for (var g = e.OperandValueAndType, h = e.LookupResultType, l = e.TypeLookupTable.plus, n = function(a, c) {
    b.push({type:a, value:c});
  }, p = 0, r = "", s = 0, q = 0, t = 0, u = 1, v, A, w, z, y, C;0 < c.length;) {
    e = g(d, c), f = e.type.charAt(0), "n" == f && (s += 1), "b" != f && (q += 1), "b" == f && (t += 1), "n" == f ? (f = e.value - 0, p += f, u *= f, v = void 0 != v ? f > v ? f : v : f, A = void 0 != A ? f < A ? f : A : f, 1 == s ? (y = f, C = 0) : (w = y + (f - y) / s, C = z = C + (f - y) * (f - w), y = w), r = h(e.type, r || e.type, l)) : "e" == f && "e" != r.charAt(0) && (r = e.type);
  }
  r = r || "n";
  switch(a) {
    case "SUM":
      n(r, p);
      break;
    case "PRODUCT":
      n(r, u);
      break;
    case "MIN":
      n(r, A || 0);
      break;
    case "MAX":
      n(r, v || 0);
      break;
    case "COUNT":
      n("n", s);
      break;
    case "COUNTA":
      n("n", q);
      break;
    case "COUNTBLANK":
      n("n", t);
      break;
    case "AVERAGE":
      0 < s ? n(r, p / s) : n("e#DIV/0!", 0);
      break;
    case "STDEV":
      1 < s ? n(r, Math.sqrt(z / (s - 1))) : n("e#DIV/0!", 0);
      break;
    case "STDEVP":
      1 < s ? n(r, Math.sqrt(z / s)) : n("e#DIV/0!", 0);
      break;
    case "VAR":
      1 < s ? n(r, z / (s - 1)) : n("e#DIV/0!", 0);
      break;
    case "VARP":
      1 < s ? n(r, z / s) : n("e#DIV/0!", 0);
  }
  return null;
};
SocialCalc.Formula.FunctionList.AVERAGE = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.COUNT = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.COUNTA = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.COUNTBLANK = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.MAX = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.MIN = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.PRODUCT = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.STDEV = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.STDEVP = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.SUM = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.VAR = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.FunctionList.VARP = [SocialCalc.Formula.SeriesFunctions, -1, "vn", null, "stat"];
SocialCalc.Formula.SumProductFunction = function(a, b, c, d) {
  for (var e = [], f = 0, g = SocialCalc.Formula, h = 0, l = 0, n = function(a, c) {
    b.push({type:a, value:c});
  };0 < c.length;) {
    a = g.TopOfStackValueAndType(d, c);
    if ("range" != a.type) {
      n("e#VALUE!", 0);
      return;
    }
    rangeinfo = g.DecodeRangeParts(d, a.value);
    if (!h) {
      h = rangeinfo.ncols;
    } else {
      if (h != rangeinfo.ncols) {
        n("e#VALUE!", 0);
        return;
      }
    }
    if (!l) {
      l = rangeinfo.nrows;
    } else {
      if (l != rangeinfo.nrows) {
        n("e#VALUE!", 0);
        return;
      }
    }
    for (i = 0;i < rangeinfo.ncols;i++) {
      for (j = 0;j < rangeinfo.nrows;j++) {
        k = i * rangeinfo.nrows + j, cellcr = SocialCalc.crToCoord(rangeinfo.col1num + i, rangeinfo.row1num + j), cell = rangeinfo.sheetdata.GetAssuredCell(cellcr), value = "n" == cell.valuetype ? cell.datavalue : 0, e[k] = (e[k] || 1) * value;
      }
    }
  }
  for (i = 0;i < e.length;i++) {
    f += e[i];
  }
  n("n", f);
};
SocialCalc.Formula.FunctionList.SUMPRODUCT = [SocialCalc.Formula.SumProductFunction, -1, "rangen", "", "stat"];
SocialCalc.Formula.DSeriesFunctions = function(a, b, c, d) {
  var e, f, g, h, l, n, p, r, s = SocialCalc.Formula, q = s.LookupResultType, t = s.TypeLookupTable.plus, u = function(a, c) {
    b.push({type:a, value:c});
  };
  f = e = void 0;
  var v = 0, A = "", w = 0, z = 0, y = 1, C, G, H, M, Q;
  g = s.TopOfStackValueAndType(d, c);
  h = s.OperandValueAndType(d, c);
  l = s.TopOfStackValueAndType(d, c);
  if ("range" != g.type || "range" != l.type) {
    return s.FunctionArgsError(a, b);
  }
  c = s.DecodeRangeParts(d, g.value);
  d = s.DecodeRangeParts(d, l.value);
  h = s.FieldToColnum(c.sheetdata, c.col1num, c.ncols, c.row1num, h.value, h.type);
  if (0 >= h) {
    u("e#VALUE!", 0);
  } else {
    h = c.col1num + h - 1;
    l = [];
    for (g = 0;g < d.ncols;g++) {
      n = d.sheetdata.GetAssuredCell(SocialCalc.crToCoord(d.col1num + g, d.row1num));
      criterianum = s.FieldToColnum(c.sheetdata, c.col1num, c.ncols, c.row1num, n.datavalue, n.valuetype);
      if (0 >= criterianum) {
        u("e#VALUE!", 0);
        return;
      }
      l.push(c.col1num + criterianum - 1);
    }
    for (g = 1;g < c.nrows;g++) {
      p = !1;
      e = 1;
      a: for (;e < d.nrows;e++) {
        for (f = 0;f < d.ncols;f++) {
          if (r = SocialCalc.crToCoord(d.col1num + f, d.row1num + e), n = d.sheetdata.GetAssuredCell(r), r = n.datavalue, "string" != typeof r || 0 != r.length) {
            if (n = l[f], n = SocialCalc.crToCoord(n, c.row1num + g), n = d.sheetdata.GetAssuredCell(n), !s.TestCriteria(n.datavalue, n.valuetype || "b", r)) {
              continue a;
            }
          }
        }
        p = !0;
        break a;
      }
      p && (e = SocialCalc.crToCoord(h, c.row1num + g), n = c.sheetdata.GetAssuredCell(e), e = n.datavalue, f = n.valuetype, p = f.charAt(0), "n" == p && (w += 1), "b" != p && (z += 1), "n" == p ? (v1 = e - 0, v += v1, y *= v1, C = void 0 != C ? v1 > C ? v1 : C : v1, G = void 0 != G ? v1 < G ? v1 : G : v1, 1 == w ? (M = v1, Q = 0) : (e = M + (v1 - M) / w, Q = H = Q + (v1 - M) * (v1 - e), M = e), A = q(f, A || f, t)) : "e" == p && "e" != A.charAt(0) && (A = f));
    }
    A = A || "n";
    switch(a) {
      case "DSUM":
        u(A, v);
        break;
      case "DPRODUCT":
        u(A, y);
        break;
      case "DMIN":
        u(A, G || 0);
        break;
      case "DMAX":
        u(A, C || 0);
        break;
      case "DCOUNT":
        u("n", w);
        break;
      case "DCOUNTA":
        u("n", z);
        break;
      case "DAVERAGE":
        0 < w ? u(A, v / w) : u("e#DIV/0!", 0);
        break;
      case "DSTDEV":
        1 < w ? u(A, Math.sqrt(H / (w - 1))) : u("e#DIV/0!", 0);
        break;
      case "DSTDEVP":
        1 < w ? u(A, Math.sqrt(H / w)) : u("e#DIV/0!", 0);
        break;
      case "DVAR":
        1 < w ? u(A, H / (w - 1)) : u("e#DIV/0!", 0);
        break;
      case "DVARP":
        1 < w ? u(A, H / w) : u("e#DIV/0!", 0);
        break;
      case "DGET":
        1 == w ? u(A, v) : 0 == w ? u("e#VALUE!", 0) : u("e#NUM!", 0);
    }
  }
};
SocialCalc.Formula.FunctionList.DAVERAGE = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DCOUNT = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DCOUNTA = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DGET = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DMAX = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DMIN = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DPRODUCT = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DSTDEV = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DSTDEVP = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DSUM = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DVAR = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FunctionList.DVARP = [SocialCalc.Formula.DSeriesFunctions, 3, "dfunc", "", "stat"];
SocialCalc.Formula.FieldToColnum = function(a, b, c, d, e, f) {
  var g;
  if ("n" == f.charAt(0)) {
    return f = e - 0, 0 >= f || f > c ? 0 : Math.floor(f);
  }
  if ("t" != f.charAt(0)) {
    return 0;
  }
  e = e ? e.toLowerCase() : "";
  for (f = 0;f < c;f++) {
    if (g = a.GetAssuredCell(SocialCalc.crToCoord(b + f, d)), g = g.datavalue, g = (g + "").toLowerCase(), g == e) {
      return f + 1;
    }
  }
  return 0;
};
SocialCalc.Formula.LookupFunctions = function(a, b, c, d) {
  var e, f, g, h, l, n, p, r, s, q, t;
  t = SocialCalc.Formula;
  e = t.OperandValueAndType;
  var u = function(a, c) {
    b.push({type:a, value:c});
  };
  e = e(d, c);
  "string" == typeof e.value && (e.value = e.value.toLowerCase());
  f = t.TopOfStackValueAndType(d, c);
  g = 1;
  if ("MATCH" == a) {
    if (c.length) {
      g = t.OperandAsNumber(d, c);
      if ("n" != g.type.charAt(0)) {
        u("e#VALUE!", 0);
        return;
      }
      if (c.length) {
        return t.FunctionArgsError(a, b), 0;
      }
      g = g.value - 0;
    }
  } else {
    h = t.OperandAsNumber(d, c);
    if ("n" != h.type.charAt(0)) {
      u("e#VALUE!", 0);
      return;
    }
    h = Math.floor(h.value);
    if (c.length) {
      g = t.OperandAsNumber(d, c);
      if ("n" != g.type.charAt(0)) {
        u("e#VALUE!", 0);
        return;
      }
      if (c.length) {
        return t.FunctionArgsError(a, b), 0;
      }
      g = g.value ? 1 : 0;
    }
  }
  e.type = e.type.charAt(0);
  "n" == e.type && (e.value -= 0);
  if ("range" != f.type) {
    return t.FunctionArgsError(a, b), 0;
  }
  if (c = t.DecodeRangeParts(d, f.value, f.type)) {
    n = l = f = d = 0;
    if ("HLOOKUP" == a) {
      if (l = 1, h > c.nrows) {
        u("e#REF!", 0);
        return;
      }
    } else {
      if ("VLOOKUP" == a) {
        if (n = 1, h > c.ncols) {
          u("e#REF!", 0);
          return;
        }
      } else {
        if ("MATCH" == a) {
          if (1 < c.ncols) {
            if (1 < c.nrows) {
              u("e#N/A", 0);
              return;
            }
            l = 1;
          } else {
            n = 1;
          }
        } else {
          return t.FunctionArgsError(a, b), 0;
        }
      }
    }
    if (1 > h && "MATCH" != a) {
      return u("e#VALUE!", 0), 0;
    }
    for (p;;) {
      t = SocialCalc.crToCoord(c.col1num + d, c.row1num + f);
      q = c.sheetdata.GetAssuredCell(t);
      t = q.datavalue;
      q = q.valuetype ? q.valuetype.charAt(0) : "b";
      "n" == q && (t -= 0);
      if (g) {
        if ("n" == e.type && "n" == q) {
          if (e.value == t) {
            break;
          }
          if (0 < g && e.value > t || 0 > g && e.value < t) {
            p = 1, r = d, s = f;
          } else {
            if (p) {
              p = 2;
              break;
            }
          }
        } else {
          if ("t" == e.type && "t" == q) {
            t = "string" == typeof t ? t.toLowerCase() : "";
            if (e.value == t) {
              break;
            }
            if (0 < g && e.value > t || 0 > g && e.value < t) {
              p = 1, r = d, s = f;
            } else {
              if (p) {
                p = 2;
                break;
              }
            }
          }
        }
      } else {
        if ("n" == e.type && "n" == q) {
          if (e.value == t) {
            break;
          }
        } else {
          if ("t" == e.type && "t" == q && (t = "string" == typeof t ? t.toLowerCase() : "", e.value == t)) {
            break;
          }
        }
      }
      f += n;
      d += l;
      if (f >= c.nrows || d >= c.ncols) {
        if (p) {
          p = 2;
          break;
        }
        u("e#N/A", 0);
        return;
      }
    }
    2 == p && (f = s, d = r);
    "MATCH" == a ? (t = d + f + 1, q = "n") : (t = SocialCalc.crToCoord(c.col1num + d + ("VLOOKUP" == a ? h - 1 : 0), c.row1num + f + ("HLOOKUP" == a ? h - 1 : 0)), q = c.sheetdata.GetAssuredCell(t), t = q.datavalue, q = q.valuetype);
    u(q, t);
  } else {
    u("e#REF!", 0);
  }
};
SocialCalc.Formula.FunctionList.HLOOKUP = [SocialCalc.Formula.LookupFunctions, -3, "hlookup", "", "lookup"];
SocialCalc.Formula.FunctionList.MATCH = [SocialCalc.Formula.LookupFunctions, -2, "match", "", "lookup"];
SocialCalc.Formula.FunctionList.VLOOKUP = [SocialCalc.Formula.LookupFunctions, -3, "vlookup", "", "lookup"];
SocialCalc.Formula.IndexFunction = function(a, b, c, d) {
  var e, f, g, h, l = SocialCalc.Formula, n = function(a, c) {
    b.push({type:a, value:c});
  };
  e = l.TopOfStackValueAndType(d, c);
  if ("range" != e.type) {
    return l.FunctionArgsError(a, b), 0;
  }
  f = l.DecodeRangeParts(d, e.value, e.type);
  e = f.sheetname ? "!" + f.sheetname : "";
  g = {value:0};
  h = {value:0};
  if (c.length) {
    g = l.OperandAsNumber(d, c);
    if ("n" != g.type.charAt(0) || 0 > g.value) {
      n("e#VALUE!", 0);
      return;
    }
    if (c.length) {
      h = l.OperandAsNumber(d, c);
      if ("n" != h.type.charAt(0) || 0 > h.value) {
        n("e#VALUE!", 0);
        return;
      }
      if (c.length) {
        return l.FunctionArgsError(a, b), 0;
      }
    } else {
      1 == f.nrows && (h.value = g.value, g.value = 0);
    }
  }
  g.value > f.nrows || h.value > f.ncols ? n("e#REF!", 0) : (0 == g.value ? 0 == h.value ? 1 == f.nrows && 1 == f.ncols ? (a = SocialCalc.crToCoord(f.col1num, f.row1num) + e, c = "coord") : (a = SocialCalc.crToCoord(f.col1num, f.row1num) + e + "|" + SocialCalc.crToCoord(f.col1num + f.ncols - 1, f.row1num + f.nrows - 1) + "|", c = "range") : 1 == f.nrows ? (a = SocialCalc.crToCoord(f.col1num + h.value - 1, f.row1num) + e, c = "coord") : (a = SocialCalc.crToCoord(f.col1num + h.value - 1, f.row1num) + 
  e + "|" + SocialCalc.crToCoord(f.col1num + h.value - 1, f.row1num + f.nrows - 1) + "|", c = "range") : 0 == h.value ? 1 == f.ncols ? (a = SocialCalc.crToCoord(f.col1num, f.row1num + g.value - 1) + e, c = "coord") : (a = SocialCalc.crToCoord(f.col1num, f.row1num + g.value - 1) + e + "|" + SocialCalc.crToCoord(f.col1num + f.ncols - 1, f.row1num + g.value - 1) + "|", c = "range") : (a = SocialCalc.crToCoord(f.col1num + h.value - 1, f.row1num + g.value - 1) + e, c = "coord"), n(c, a));
};
SocialCalc.Formula.FunctionList.INDEX = [SocialCalc.Formula.IndexFunction, -1, "index", "", "lookup"];
SocialCalc.Formula.CountifSumifFunctions = function(a, b, c, d) {
  var e, f, g, h, l = 0, n = "", p = 0, r = SocialCalc.Formula, s = r.OperandValueAndType, q = r.LookupResultType, t = r.TypeLookupTable.plus;
  e = r.TopOfStackValueAndType(d, c);
  f = r.OperandAsText(d, c);
  if ("SUMIF" == a) {
    if (1 == c.length) {
      g = r.TopOfStackValueAndType(d, c);
    } else {
      if (0 == c.length) {
        g = {value:e.value, type:e.type};
      } else {
        return r.FunctionArgsError(a, b), 0;
      }
    }
  } else {
    g = {value:e.value, type:e.type};
  }
  "n" == f.type.charAt(0) ? f.value += "" : "e" == f.type.charAt(0) ? f.value = null : "b" == f.type.charAt(0) && (f.value = null);
  if ("coord" != e.type && "range" != e.type || "SUMIF" == a && "coord" != g.type && "range" != g.type) {
    return r.FunctionArgsError(a, b), 0;
  }
  c.push(e);
  e = [];
  for (e.push(g);c.length;) {
    g = s(d, c), h = s(d, e), r.TestCriteria(g.value, g.type, f.value) && (p += 1, "n" == h.type.charAt(0) ? (l += h.value - 0, n = q(h.type, n || h.type, t)) : "e" == h.type.charAt(0) && "e" != n.charAt(0) && (n = h.type));
  }
  "SUMIF" == a ? b.push({type:n || "n", value:l}) : "COUNTIF" == a && b.push({type:"n", value:p});
};
SocialCalc.Formula.FunctionList.COUNTIF = [SocialCalc.Formula.CountifSumifFunctions, 2, "rangec", "", "stat"];
SocialCalc.Formula.FunctionList.SUMIF = [SocialCalc.Formula.CountifSumifFunctions, -2, "sumif", "", "stat"];
SocialCalc.Formula.IfFunction = function(a, b, c, d) {
  var e;
  d = SocialCalc.Formula.OperandValueAndType(d, c);
  e = d.type.charAt(0);
  if ("n" != e && "b" != e) {
    b.push({type:"e#VALUE!", value:0});
  } else {
    e = c.pop();
    if (1 == c.length) {
      a = c.pop();
    } else {
      if (0 == c.length) {
        a = {type:"n", value:0};
      } else {
        scf.FunctionArgsError(a, b);
        return;
      }
    }
    b.push(d.value ? e : a);
  }
};
SocialCalc.Formula.FunctionList.IF = [SocialCalc.Formula.IfFunction, -2, "iffunc", "", "test"];
SocialCalc.Formula.DateFunction = function(a, b, c, d) {
  a = SocialCalc.Formula;
  var e = 0, f = a.OperandAsNumber(d, c), g = a.OperandAsNumber(d, c);
  c = a.OperandAsNumber(d, c);
  d = a.LookupResultType(f.type, g.type, a.TypeLookupTable.twoargnumeric);
  d = a.LookupResultType(d, c.type, a.TypeLookupTable.twoargnumeric);
  "n" == d.charAt(0) && (e = SocialCalc.FormatNumber.convert_date_gregorian_to_julian(Math.floor(f.value), Math.floor(g.value), Math.floor(c.value)) - SocialCalc.FormatNumber.datevalues.julian_offset, d = "nd");
  a.PushOperand(b, d, e);
};
SocialCalc.Formula.FunctionList.DATE = [SocialCalc.Formula.DateFunction, 3, "date", "", "datetime"];
SocialCalc.Formula.TimeFunction = function(a, b, c, d) {
  a = SocialCalc.Formula;
  var e = 0, f = a.OperandAsNumber(d, c), g = a.OperandAsNumber(d, c);
  c = a.OperandAsNumber(d, c);
  d = a.LookupResultType(f.type, g.type, a.TypeLookupTable.twoargnumeric);
  d = a.LookupResultType(d, c.type, a.TypeLookupTable.twoargnumeric);
  "n" == d.charAt(0) && (e = (3600 * f.value + 60 * g.value + c.value) / 86400, d = "nt");
  a.PushOperand(b, d, e);
};
SocialCalc.Formula.FunctionList.TIME = [SocialCalc.Formula.TimeFunction, 3, "hms", "", "datetime"];
SocialCalc.Formula.DMYFunctions = function(a, b, c, d) {
  var e, f = SocialCalc.Formula, g = 0, h = f.OperandAsNumber(d, c), l = f.LookupResultType(h.type, h.type, f.TypeLookupTable.oneargnumeric);
  if ("n" == l.charAt(0)) {
    switch(e = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(Math.floor(h.value + SocialCalc.FormatNumber.datevalues.julian_offset)), a) {
      case "DAY":
        g = e.day;
        break;
      case "MONTH":
        g = e.month;
        break;
      case "YEAR":
        g = e.year;
        break;
      case "WEEKDAY":
        e = {value:1};
        if (c.length) {
          e = f.OperandAsNumber(d, c);
          if ("n" != e.type.charAt(0) || 1 > e.value || 3 < e.value) {
            f.PushOperand(b, "e#VALUE!", 0);
            return;
          }
          if (c.length) {
            f.FunctionArgsError(a, b);
            return;
          }
        }
        a = 6;
        1 < e.value && (a -= 1);
        g = Math.floor(h.value + a) % 7 + (3 > e.value ? 1 : 0);
    }
  }
  f.PushOperand(b, l, g);
};
SocialCalc.Formula.FunctionList.DAY = [SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList.MONTH = [SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList.YEAR = [SocialCalc.Formula.DMYFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList.WEEKDAY = [SocialCalc.Formula.DMYFunctions, -1, "weekday", "", "datetime"];
SocialCalc.Formula.HMSFunctions = function(a, b, c, d) {
  var e, f = SocialCalc.Formula, g = 0, h = f.OperandAsNumber(d, c), l = f.LookupResultType(h.type, h.type, f.TypeLookupTable.oneargnumeric);
  if ("n" == l.charAt(0)) {
    if (0 > h.value) {
      f.PushOperand(b, "e#NUM!", 0);
      return;
    }
    e = h.value - Math.floor(h.value);
    e *= 24;
    c = Math.floor(e);
    e -= Math.floor(e);
    e *= 60;
    d = Math.floor(e);
    e -= Math.floor(e);
    e = Math.floor(60 * e + (0 <= h.value ? 0.5 : -0.5));
    "HOUR" == a ? g = c : "MINUTE" == a ? g = d : "SECOND" == a && (g = e);
  }
  f.PushOperand(b, l, g);
};
SocialCalc.Formula.FunctionList.HOUR = [SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList.MINUTE = [SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.FunctionList.SECOND = [SocialCalc.Formula.HMSFunctions, 1, "v", "", "datetime"];
SocialCalc.Formula.ExactFunction = function(a, b, c, d) {
  a = SocialCalc.Formula;
  var e = 0, f = "nl", g = a.OperandValueAndType(d, c), h = g.type.charAt(0);
  c = a.OperandValueAndType(d, c);
  d = c.type.charAt(0);
  "t" == h ? "t" == d ? e = g.value == c.value ? 1 : 0 : "b" == d ? e = g.value.length ? 0 : 1 : "n" == d ? e = g.value == c.value + "" ? 1 : 0 : "e" == d ? (e = c.value, f = c.type) : e = 0 : "n" == h ? "n" == d ? e = g.value - 0 == c.value - 0 ? 1 : 0 : "b" == d ? e = 0 : "t" == d ? e = g.value + "" == c.value ? 1 : 0 : "e" == d ? (e = c.value, f = c.type) : e = 0 : "b" == h ? "t" == d ? e = c.value.length ? 0 : 1 : "b" == d ? e = 1 : "n" == d ? e = 0 : "e" == d ? (e = c.value, f = c.type) : e = 
  0 : "e" == h && (e = g.value, f = g.type);
  a.PushOperand(b, f, e);
};
SocialCalc.Formula.FunctionList.EXACT = [SocialCalc.Formula.ExactFunction, 2, "", "", "text"];
SocialCalc.Formula.ArgList = {FIND:[1, 1, 0], LEFT:[1, 0], LEN:[1], LOWER:[1], MID:[1, 0, 0], PROPER:[1], REPLACE:[1, 0, 0, 1], REPT:[1, 0], RIGHT:[1, 0], SUBSTITUTE:[1, 1, 1, 0], TRIM:[1], HEXCODE:[1], UPPER:[1]};
SocialCalc.Formula.StringFunctions = function(a, b, c, d) {
  var e, f, g, h = SocialCalc.Formula;
  g = 0;
  var l = "e#VALUE!", n = c.length, p = h.ArgList[a], r = [], s = [];
  for (e = 1;e <= n;e++) {
    if (e > p.length) {
      h.FunctionArgsError(a, b);
      return;
    }
    0 == p[e - 1] ? f = h.OperandAsNumber(d, c) : 1 == p[e - 1] ? f = h.OperandAsText(d, c) : -1 == p[e - 1] && (f = h.OperandValueAndType(d, c));
    r[e] = f.value;
    s[e] = f.type;
    if ("e" == f.type.charAt(0)) {
      h.PushOperand(b, f.type, g);
      return;
    }
  }
  switch(a) {
    case "FIND":
      g = s[3] ? r[3] - 1 : 0;
      0 > g ? g = "Start is before string" : (g = r[2].indexOf(r[1], g), 0 <= g ? (g += 1, l = "n") : g = "Not found");
      break;
    case "LEFT":
      g = s[2] ? r[2] - 0 : 1;
      0 > g ? g = "Negative length" : (g = r[1].substring(0, g), l = "t");
      break;
    case "LEN":
      g = r[1].length;
      l = "n";
      break;
    case "LOWER":
      g = r[1].toLowerCase();
      l = "t";
      break;
    case "MID":
      a = r[2] - 0;
      g = r[3] - 0;
      1 > g || 1 > a ? g = "Bad arguments" : (g = r[1].substring(a - 1, a + g - 1), l = "t");
      break;
    case "PROPER":
      g = r[1].replace(/\b\w+\b/g, function(a) {
        return a.substring(0, 1).toUpperCase() + a.substring(1);
      });
      l = "t";
      break;
    case "REPLACE":
      a = r[2] - 0;
      g = r[3] - 0;
      0 > g || 1 > a ? g = "Bad arguments" : (g = r[1].substring(0, a - 1) + r[4] + r[1].substring(a - 1 + g), l = "t");
      break;
    case "REPT":
      a = r[2] - 0;
      if (0 > a) {
        g = "Negative count";
      } else {
        for (g = "";0 < a;a--) {
          g += r[1];
        }
        l = "t";
      }
      break;
    case "RIGHT":
      g = s[2] ? r[2] - 0 : 1;
      0 > g ? g = "Negative length" : (g = r[1].slice(-g), l = "t");
      break;
    case "SUBSTITUTE":
      fulltext = r[1];
      oldtext = r[2];
      newtext = r[3];
      if (null != r[4]) {
        if (which = r[4] - 0, 0 >= which) {
          g = "Non-positive instance number";
          break;
        }
      } else {
        which = 0;
      }
      oldpos = a = 0;
      for (g = "";;) {
        if (pos = fulltext.indexOf(oldtext, oldpos), 0 <= pos) {
          a++;
          g += fulltext.substring(oldpos, pos);
          if (0 == which) {
            g += newtext;
          } else {
            if (which == a) {
              g += newtext + fulltext.substring(pos + oldtext.length);
              break;
            } else {
              g += oldtext;
            }
          }
          oldpos = pos + oldtext.length;
        } else {
          g += fulltext.substring(oldpos);
          break;
        }
      }
      l = "t";
      break;
    case "TRIM":
      g = r[1];
      g = g.replace(/^ */, "");
      g = g.replace(/ *$/, "");
      g = g.replace(/ +/g, " ");
      l = "t";
      break;
    case "HEXCODE":
      g = String(r[1]);
      l = g.charCodeAt(0);
      55296 <= l && 56319 >= l && (r = g.charCodeAt(1), 56320 <= r && 57343 >= r && (l = 1024 * (l - 55296) + (r - 56320) + 65536));
      g = l.toString(16).toUpperCase();
      l = "t";
      break;
    case "UPPER":
      g = r[1].toUpperCase(), l = "t";
  }
  h.PushOperand(b, l, g);
};
SocialCalc.Formula.FunctionList.FIND = [SocialCalc.Formula.StringFunctions, -2, "find", "", "text"];
SocialCalc.Formula.FunctionList.LEFT = [SocialCalc.Formula.StringFunctions, -2, "tc", "", "text"];
SocialCalc.Formula.FunctionList.LEN = [SocialCalc.Formula.StringFunctions, 1, "txt", "", "text"];
SocialCalc.Formula.FunctionList.LOWER = [SocialCalc.Formula.StringFunctions, 1, "txt", "", "text"];
SocialCalc.Formula.FunctionList.MID = [SocialCalc.Formula.StringFunctions, 3, "mid", "", "text"];
SocialCalc.Formula.FunctionList.PROPER = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList.REPLACE = [SocialCalc.Formula.StringFunctions, 4, "replace", "", "text"];
SocialCalc.Formula.FunctionList.REPT = [SocialCalc.Formula.StringFunctions, 2, "tc", "", "text"];
SocialCalc.Formula.FunctionList.RIGHT = [SocialCalc.Formula.StringFunctions, -1, "tc", "", "text"];
SocialCalc.Formula.FunctionList.SUBSTITUTE = [SocialCalc.Formula.StringFunctions, -3, "subs", "", "text"];
SocialCalc.Formula.FunctionList.TRIM = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList.HEXCODE = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList.UPPER = [SocialCalc.Formula.StringFunctions, 1, "v", "", "text"];
SocialCalc.Formula.IsFunctions = function(a, b, c, d) {
  var e = SocialCalc.Formula, f = 0;
  c = e.OperandValueAndType(d, c);
  d = c.type.charAt(0);
  switch(a) {
    case "ISBLANK":
      f = "b" == c.type ? 1 : 0;
      break;
    case "ISERR":
      f = "e" == d ? "e#N/A" == c.type ? 0 : 1 : 0;
      break;
    case "ISERROR":
      f = "e" == d ? 1 : 0;
      break;
    case "ISLOGICAL":
      f = "nl" == c.type ? 1 : 0;
      break;
    case "ISNA":
      f = "e#N/A" == c.type ? 1 : 0;
      break;
    case "ISNONTEXT":
      f = "t" == d ? 0 : 1;
      break;
    case "ISNUMBER":
      f = "n" == d ? 1 : 0;
      break;
    case "ISTEXT":
      f = "t" == d ? 1 : 0;
  }
  e.PushOperand(b, "nl", f);
};
SocialCalc.Formula.FunctionList.ISBLANK = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList.ISERR = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList.ISERROR = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList.ISLOGICAL = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList.ISNA = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList.ISNONTEXT = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList.ISNUMBER = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.FunctionList.ISTEXT = [SocialCalc.Formula.IsFunctions, 1, "v", "", "test"];
SocialCalc.Formula.NTVFunctions = function(a, b, c, d) {
  var e = SocialCalc.Formula, f = 0, g = "e#VALUE!";
  c = e.OperandValueAndType(d, c);
  d = c.type.charAt(0);
  switch(a) {
    case "N":
      f = "n" == d ? c.value - 0 : 0;
      g = "n";
      break;
    case "T":
      f = "t" == d ? c.value + "" : "";
      g = "t";
      break;
    case "VALUE":
      "n" == d || "b" == d ? (f = c.value || 0, g = "n") : "t" == d && (c = SocialCalc.DetermineValueType(c.value), "n" != c.type.charAt(0) ? (f = 0, g = "e#VALUE!") : (f = c.value - 0, g = "n"));
  }
  "e" == d && (g = c.type);
  e.PushOperand(b, g, f);
};
SocialCalc.Formula.FunctionList.N = [SocialCalc.Formula.NTVFunctions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.T = [SocialCalc.Formula.NTVFunctions, 1, "v", "", "text"];
SocialCalc.Formula.FunctionList.VALUE = [SocialCalc.Formula.NTVFunctions, 1, "v", "", "text"];
SocialCalc.Formula.Math1Functions = function(a, b, c, d) {
  var e = {}, f = SocialCalc.Formula;
  d = f.OperandAsNumber(d, c);
  c = d.value;
  e.type = f.LookupResultType(d.type, d.type, f.TypeLookupTable.oneargnumeric);
  if ("n" == e.type) {
    switch(a) {
      case "ABS":
        c = Math.abs(c);
        break;
      case "ACOS":
        -1 <= c && 1 >= c ? c = Math.acos(c) : e.type = "e#NUM!";
        break;
      case "ASIN":
        -1 <= c && 1 >= c ? c = Math.asin(c) : e.type = "e#NUM!";
        break;
      case "ATAN":
        c = Math.atan(c);
        break;
      case "COS":
        c = Math.cos(c);
        break;
      case "DEGREES":
        c = 180 * c / Math.PI;
        break;
      case "EVEN":
        c = 0 > c ? -c : c;
        c = c != Math.floor(c) ? Math.floor(c + 1) + Math.floor(c + 1) % 2 : c + c % 2;
        0 > d.value && (c = -c);
        break;
      case "EXP":
        c = Math.exp(c);
        break;
      case "FACT":
        a = 1;
        for (c = Math.floor(c);0 < c;c--) {
          a *= c;
        }
        c = a;
        break;
      case "INT":
        c = Math.floor(c);
        break;
      case "LN":
        0 >= c && (e.type = "e#NUM!", e.error = SocialCalc.Constants.s_sheetfunclnarg);
        c = Math.log(c);
        break;
      case "LOG10":
        0 >= c && (e.type = "e#NUM!", e.error = SocialCalc.Constants.s_sheetfunclog10arg);
        c = Math.log(c) / Math.log(10);
        break;
      case "ODD":
        c = 0 > c ? -c : c;
        c = c != Math.floor(c) ? Math.floor(c + 1) + (1 - Math.floor(c + 1) % 2) : c + (1 - c % 2);
        0 > d.value && (c = -c);
        break;
      case "RADIANS":
        c = c * Math.PI / 180;
        break;
      case "SIN":
        c = Math.sin(c);
        break;
      case "SQRT":
        0 <= c ? c = Math.sqrt(c) : e.type = "e#NUM!";
        break;
      case "TAN":
        0 != Math.cos(c) ? c = Math.tan(c) : e.type = "e#NUM!";
    }
  }
  e.value = c;
  b.push(e);
  return null;
};
SocialCalc.Formula.FunctionList.ABS = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.ACOS = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.ASIN = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.ATAN = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.COS = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.DEGREES = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.EVEN = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.EXP = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.FACT = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.INT = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.LN = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.LOG10 = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.ODD = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.RADIANS = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.SIN = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.SQRT = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.FunctionList.TAN = [SocialCalc.Formula.Math1Functions, 1, "v", "", "math"];
SocialCalc.Formula.Math2Functions = function(a, b, c, d) {
  var e, f, g = {};
  f = SocialCalc.Formula;
  e = f.OperandAsNumber(d, c);
  c = f.OperandAsNumber(d, c);
  g.type = f.LookupResultType(e.type, c.type, f.TypeLookupTable.twoargnumeric);
  if ("n" == g.type) {
    switch(a) {
      case "ATAN2":
        0 == e.value && 0 == c.value ? g.type = "e#DIV/0!" : g.value = Math.atan2(c.value, e.value);
        break;
      case "POWER":
        g.value = Math.pow(e.value, c.value);
        isNaN(g.value) && (g.value = 0, g.type = "e#NUM!");
        break;
      case "MOD":
        0 == c.value ? g.type = "e#DIV/0!" : (a = e.value / c.value, a = Math.floor(a), g.value = e.value - a * c.value);
        break;
      case "TRUNC":
        a = 1;
        if (0 <= c.value) {
          c.value = Math.floor(c.value);
          for (f = 0;f < c.value;f++) {
            a *= 10;
          }
          g.value = Math.floor(Math.abs(e.value) * a) / a;
        } else {
          if (0 > c.value) {
            c.value = Math.floor(-c.value);
            for (f = 0;f < c.value;f++) {
              a *= 10;
            }
            g.value = Math.floor(Math.abs(e.value) / a) * a;
          }
        }
        0 > e.value && (g.value = -g.value);
    }
  }
  b.push(g);
  return null;
};
SocialCalc.Formula.FunctionList.ATAN2 = [SocialCalc.Formula.Math2Functions, 2, "xy", "", "math"];
SocialCalc.Formula.FunctionList.MOD = [SocialCalc.Formula.Math2Functions, 2, "", "", "math"];
SocialCalc.Formula.FunctionList.POWER = [SocialCalc.Formula.Math2Functions, 2, "", "", "math"];
SocialCalc.Formula.FunctionList.TRUNC = [SocialCalc.Formula.Math2Functions, 2, "valpre", "", "math"];
SocialCalc.Formula.LogFunction = function(a, b, c, d) {
  var e, f = {}, g = SocialCalc.Formula;
  f.value = 0;
  e = g.OperandAsNumber(d, c);
  f.type = g.LookupResultType(e.type, e.type, g.TypeLookupTable.oneargnumeric);
  if (1 == c.length) {
    if (c = g.OperandAsNumber(d, c), "n" != c.type.charAt(0) || 0 >= c.value) {
      return g.FunctionSpecificError(a, b, "e#NUM!", SocialCalc.Constants.s_sheetfunclogsecondarg), 0;
    }
  } else {
    if (0 != c.length) {
      return g.FunctionArgsError(a, b), 0;
    }
    c = {value:Math.E, type:"n"};
  }
  if ("n" == f.type) {
    if (0 >= e.value) {
      return g.FunctionSpecificError(a, b, "e#NUM!", SocialCalc.Constants.s_sheetfunclogfirstarg), 0;
    }
    f.value = Math.log(e.value) / Math.log(c.value);
  }
  b.push(f);
};
SocialCalc.Formula.FunctionList.LOG = [SocialCalc.Formula.LogFunction, -1, "log", "", "math"];
SocialCalc.Formula.RoundFunction = function(a, b, c, d) {
  var e, f, g = SocialCalc.Formula;
  f = 0;
  var h = "e#VALUE!";
  e = g.OperandValueAndType(d, c);
  h = g.LookupResultType(e.type, e.type, g.TypeLookupTable.oneargnumeric);
  if (1 == c.length) {
    if (c = g.OperandValueAndType(d, c), "n" != c.type.charAt(0)) {
      return g.FunctionSpecificError(a, b, "e#NUM!", SocialCalc.Constants.s_sheetfuncroundsecondarg), 0;
    }
  } else {
    if (0 != c.length) {
      return g.FunctionArgsError(a, b), 0;
    }
    c = {value:0, type:"n"};
  }
  if ("n" == h) {
    if (c.value -= 0, 0 == c.value) {
      f = Math.round(e.value);
    } else {
      if (0 < c.value) {
        a = 1;
        c.value = Math.floor(c.value);
        for (f = 0;f < c.value;f++) {
          a *= 10;
        }
        e = Math.round(e.value * a);
        f = e / a;
      } else {
        if (0 > c.value) {
          a = 1;
          c.value = Math.floor(-c.value);
          for (f = 0;f < c.value;f++) {
            a *= 10;
          }
          e = Math.round(e.value / a);
          f = e * a;
        }
      }
    }
  }
  g.PushOperand(b, h, f);
};
SocialCalc.Formula.FunctionList.ROUND = [SocialCalc.Formula.RoundFunction, -1, "vp", "", "math"];
SocialCalc.Formula.CeilingFloorFunctions = function(a, b, c, d) {
  var e = SocialCalc.Formula, f, g, h = function(a, c) {
    b.push({type:a, value:c});
  };
  f = e.OperandValueAndType(d, c);
  g = f.type.charAt(0);
  if ("n" != g) {
    h("e#VALUE!", 0);
  } else {
    if (0 == f.value) {
      h("n", 0);
    } else {
      if (1 == c.length) {
        if (c = e.OperandValueAndType(d, c), g = f.type.charAt(0), "n" != g) {
          h("e#VALUE!", 0);
          return;
        }
      } else {
        if (0 == c.length) {
          c = {type:"n", value:0 < f.value ? 1 : -1};
        } else {
          h("e#VALUE!", 0);
          return;
        }
      }
      if (0 == c.value) {
        h("n", 0);
      } else {
        if (0 > c.value * f.value) {
          h("e#NUM!", 0);
        } else {
          switch(a) {
            case "CEILING":
              h("n", Math.ceil(f.value / c.value) * c.value);
              break;
            case "FLOOR":
              h("n", Math.floor(f.value / c.value) * c.value);
          }
        }
      }
    }
  }
};
SocialCalc.Formula.FunctionList.CEILING = [SocialCalc.Formula.CeilingFloorFunctions, -1, "vsig", "", "math"];
SocialCalc.Formula.FunctionList.FLOOR = [SocialCalc.Formula.CeilingFloorFunctions, -1, "vsig", "", "math"];
SocialCalc.Formula.AndOrFunctions = function(a, b, c, d) {
  var e, f, g = SocialCalc.Formula, h = "";
  for ("AND" == a ? f = 1 : "OR" == a && (f = 0);c.length;) {
    e = g.OperandValueAndType(d, c), "n" == e.type.charAt(0) ? (e.value -= 0, "AND" == a ? f = 0 != e.value ? f : 0 : "OR" == a && (f = 0 != e.value ? 1 : f), h = g.LookupResultType(e.type, h || "nl", g.TypeLookupTable.propagateerror)) : "e" == e.type.charAt(0) && "e" != h.charAt(0) && (h = e.type);
  }
  1 > h.length && (h = "e#VALUE!", f = 0);
  g.PushOperand(b, h, f);
};
SocialCalc.Formula.FunctionList.AND = [SocialCalc.Formula.AndOrFunctions, -1, "vn", "", "test"];
SocialCalc.Formula.FunctionList.OR = [SocialCalc.Formula.AndOrFunctions, -1, "vn", "", "test"];
SocialCalc.Formula.NotFunction = function(a, b, c, d) {
  a = 0;
  var e = SocialCalc.Formula;
  c = e.OperandValueAndType(d, c);
  d = e.LookupResultType(c.type, c.type, e.TypeLookupTable.propagateerror);
  "n" == c.type.charAt(0) || "b" == c.type ? (a = 0 != c.value - 0 ? 0 : 1, d = "nl") : "t" == c.type.charAt(0) && (d = "e#VALUE!");
  e.PushOperand(b, d, a);
};
SocialCalc.Formula.FunctionList.NOT = [SocialCalc.Formula.NotFunction, 1, "v", "", "test"];
SocialCalc.Formula.ChooseFunction = function(a, b, c, d) {
  var e, f, g = 0, h = SocialCalc.Formula, l = h.OperandAsNumber(d, c);
  "n" != l.type.charAt(0) && (l.value = 0);
  l.value = Math.floor(l.value);
  for (a = 0;c.length;) {
    if (f = h.TopOfStackValueAndType(d, c), a += 1, l.value == a) {
      g = f.value;
      e = f.type;
      break;
    }
  }
  e ? h.PushOperand(b, e, g) : h.PushOperand(b, "e#VALUE!", 0);
};
SocialCalc.Formula.FunctionList.CHOOSE = [SocialCalc.Formula.ChooseFunction, -2, "choose", "", "lookup"];
SocialCalc.Formula.ColumnsRowsFunctions = function(a, b, c, d) {
  var e = 0, f = SocialCalc.Formula;
  c = f.TopOfStackValueAndType(d, c);
  "coord" == c.type ? (e = 1, a = "n") : "range" == c.type ? (d = f.DecodeRangeParts(d, c.value), "COLUMNS" == a ? e = d.ncols : "ROWS" == a && (e = d.nrows), a = "n") : (e = 0, a = "e#VALUE!");
  f.PushOperand(b, a, e);
};
SocialCalc.Formula.FunctionList.COLUMNS = [SocialCalc.Formula.ColumnsRowsFunctions, 1, "range", "", "lookup"];
SocialCalc.Formula.FunctionList.ROWS = [SocialCalc.Formula.ColumnsRowsFunctions, 1, "range", "", "lookup"];
SocialCalc.Formula.ZeroArgFunctions = function(a, b, c, d) {
  c = {value:0};
  switch(a) {
    case "FALSE":
      c.type = "nl";
      c.value = 0;
      break;
    case "NA":
      c.type = "e#N/A";
      break;
    case "NOW":
      a = new Date;
      d = a.getTimezoneOffset();
      a = a.getTime() / 1E3;
      c.value = 25569 + a / 86400 - d / 1440;
      c.type = "ndt";
      SocialCalc.Formula.FreshnessInfo["volatile"].NOW = !0;
      break;
    case "PI":
      c.type = "n";
      c.value = Math.PI;
      break;
    case "TODAY":
      a = new Date;
      d = a.getTimezoneOffset();
      a = a.getTime() / 1E3;
      c.value = Math.floor(25569 + a / 86400 - d / 1440);
      c.type = "nd";
      SocialCalc.Formula.FreshnessInfo["volatile"].TODAY = !0;
      break;
    case "TRUE":
      c.type = "nl", c.value = 1;
  }
  b.push(c);
  return null;
};
SocialCalc.Formula.FunctionList.FALSE = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test"];
SocialCalc.Formula.FunctionList.NA = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test"];
SocialCalc.Formula.FunctionList.NOW = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "datetime"];
SocialCalc.Formula.FunctionList.PI = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "math"];
SocialCalc.Formula.FunctionList.TODAY = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "datetime"];
SocialCalc.Formula.FunctionList.TRUE = [SocialCalc.Formula.ZeroArgFunctions, 0, "", "", "test"];
SocialCalc.Formula.DDBFunction = function(a, b, c, d) {
  var e, f = SocialCalc.Formula, g = f.OperandAsNumber(d, c), h = f.OperandAsNumber(d, c), l = f.OperandAsNumber(d, c), n = f.OperandAsNumber(d, c);
  if (!(f.CheckForErrorValue(b, g) || f.CheckForErrorValue(b, h) || f.CheckForErrorValue(b, l) || f.CheckForErrorValue(b, n))) {
    if (1 > l.value) {
      return f.FunctionSpecificError(a, b, "e#NUM!", SocialCalc.Constants.s_sheetfuncddblife), 0;
    }
    e = {value:2, type:"n"};
    0 < c.length && (e = f.OperandAsNumber(d, c));
    if (0 != c.length) {
      return f.FunctionArgsError(a, b), 0;
    }
    if (!f.CheckForErrorValue(b, e)) {
      c = a = 0;
      for (d = 1;d <= n.value - 0 && d <= l.value;d++) {
        a = e.value / l.value * (g.value - c), g.value - c - a < h.value && (a = g.value - c - h.value), c += a;
      }
      f.PushOperand(b, "n$", a);
    }
  }
};
SocialCalc.Formula.FunctionList.DDB = [SocialCalc.Formula.DDBFunction, -4, "ddb", "", "financial"];
SocialCalc.Formula.SLNFunction = function(a, b, c, d) {
  var e = SocialCalc.Formula, f = e.OperandAsNumber(d, c), g = e.OperandAsNumber(d, c);
  c = e.OperandAsNumber(d, c);
  if (!e.CheckForErrorValue(b, f) && !e.CheckForErrorValue(b, g) && !e.CheckForErrorValue(b, c)) {
    if (1 > c.value) {
      return e.FunctionSpecificError(a, b, "e#NUM!", SocialCalc.Constants.s_sheetfuncslnlife), 0;
    }
    a = (f.value - g.value) / c.value;
    e.PushOperand(b, "n$", a);
  }
};
SocialCalc.Formula.FunctionList.SLN = [SocialCalc.Formula.SLNFunction, 3, "csl", "", "financial"];
SocialCalc.Formula.SYDFunction = function(a, b, c, d) {
  var e;
  a = SocialCalc.Formula;
  e = a.OperandAsNumber(d, c);
  var f = a.OperandAsNumber(d, c), g = a.OperandAsNumber(d, c);
  d = a.OperandAsNumber(d, c);
  if (!(a.CheckForErrorValue(b, e) || a.CheckForErrorValue(b, f) || a.CheckForErrorValue(b, g) || a.CheckForErrorValue(b, d))) {
    if (1 > g.value || 0 >= d.value) {
      return a.PushOperand(b, "e#NUM!", 0), 0;
    }
    c = (g.value + 1) * g.value / 2;
    e = (e.value - f.value) * (g.value - d.value + 1) / c;
    a.PushOperand(b, "n$", e);
  }
};
SocialCalc.Formula.FunctionList.SYD = [SocialCalc.Formula.SYDFunction, 4, "cslp", "", "financial"];
SocialCalc.Formula.InterestFunctions = function(a, b, c, d) {
  var e, f, g, h, l, n, p, r, s, q = SocialCalc.Formula, t = q.OperandAsNumber(d, c);
  p = q.OperandAsNumber(d, c);
  n = q.OperandAsNumber(d, c);
  e = q.LookupResultType(t.type, p.type, q.TypeLookupTable.twoargnumeric);
  e = q.LookupResultType(e, n.type, q.TypeLookupTable.twoargnumeric);
  if (c.length && (g = q.OperandAsNumber(d, c), e = q.LookupResultType(e, g.type, q.TypeLookupTable.twoargnumeric), c.length && (h = q.OperandAsNumber(d, c), e = q.LookupResultType(e, h.type, q.TypeLookupTable.twoargnumeric), c.length))) {
    if ("RATE" != a) {
      return q.FunctionArgsError(a, b), 0;
    }
    l = q.OperandAsNumber(d, c);
    e = q.LookupResultType(e, l.type, q.TypeLookupTable.twoargnumeric);
  }
  if ("n" == e) {
    switch(a) {
      case "FV":
        l = t.value;
        a = p.value;
        p = n.value;
        n = null != g ? g.value : 0;
        h = null != h ? h.value ? 1 : 0 : 0;
        f = g = 0 == l ? -n - p * a : -(n * Math.pow(1 + l, a) + p * (1 + l * h) * (Math.pow(1 + l, a) - 1) / l);
        e = "n$";
        break;
      case "NPER":
        l = t.value;
        p = p.value;
        n = n.value;
        g = null != g ? g.value : 0;
        h = null != h ? h.value ? 1 : 0 : 0;
        if (0 == l) {
          if (0 == p) {
            q.PushOperand(b, "e#NUM!", 0);
            return;
          }
          a = (n + g) / -p;
        } else {
          r = p * (1 + l * h) / l;
          s = n + r;
          if (0 == s || -1 >= l) {
            q.PushOperand(b, "e#NUM!", 0);
            return;
          }
          r = (r - g) / s;
          if (0 >= r) {
            q.PushOperand(b, "e#NUM!", 0);
            return;
          }
          r = Math.log(r);
          s = Math.log(1 + l);
          a = r / s;
        }
        f = a;
        e = "n";
        break;
      case "PMT":
        l = t.value;
        a = p.value;
        n = n.value;
        g = null != g ? g.value : 0;
        h = null != h ? h.value ? 1 : 0 : 0;
        if (0 == a) {
          q.PushOperand(b, "e#NUM!", 0);
          return;
        }
        f = p = 0 == l ? (g - n) / a : (0 - g - n * Math.pow(1 + l, a)) / ((1 + l * h) * (Math.pow(1 + l, a) - 1) / l);
        e = "n$";
        break;
      case "PV":
        l = t.value;
        a = p.value;
        p = n.value;
        g = null != g ? g.value : 0;
        h = null != h ? h.value ? 1 : 0 : 0;
        if (-1 == l) {
          q.PushOperand(b, "e#DIV/0!", 0);
          return;
        }
        f = n = 0 == l ? -g - p * a : (-g - p * (1 + l * h) * (Math.pow(1 + l, a) - 1) / l) / Math.pow(1 + l, a);
        e = "n$";
        break;
      case "RATE":
        a = t.value;
        p = p.value;
        n = n.value;
        g = null != g ? g.value : 0;
        h = null != h ? h.value ? 1 : 0 : 0;
        l = null != l ? l.value : 0.1;
        c = 0;
        delta = 1;
        epsilon = 1E-7;
        for (l = l || 1E-8;(0 <= delta ? delta : -delta) > epsilon && l != r;) {
          if (delta = g + n * Math.pow(1 + l, a) + p * (1 + l * h) * (Math.pow(1 + l, a) - 1) / l, null != s ? (s = (delta - s) / (l - r) || 0.001, r = l, l -= delta / s) : (r = l, l *= 1.1), s = delta, c++, 100 <= c) {
            q.PushOperand(b, "e#NUM!", 0);
            return;
          }
        }
        f = l;
        e = "n%";
    }
  }
  q.PushOperand(b, e, f);
};
SocialCalc.Formula.FunctionList.FV = [SocialCalc.Formula.InterestFunctions, -3, "fv", "", "financial"];
SocialCalc.Formula.FunctionList.NPER = [SocialCalc.Formula.InterestFunctions, -3, "nper", "", "financial"];
SocialCalc.Formula.FunctionList.PMT = [SocialCalc.Formula.InterestFunctions, -3, "pmt", "", "financial"];
SocialCalc.Formula.FunctionList.PV = [SocialCalc.Formula.InterestFunctions, -3, "pv", "", "financial"];
SocialCalc.Formula.FunctionList.RATE = [SocialCalc.Formula.InterestFunctions, -3, "rate", "", "financial"];
SocialCalc.Formula.NPVFunction = function(a, b, c, d) {
  var e, f, g, h, l = SocialCalc.Formula;
  e = l.OperandAsNumber(d, c);
  if (!l.CheckForErrorValue(b, e)) {
    f = 0;
    a = "n";
    for (g = 1;c.length;) {
      if (h = l.OperandValueAndType(d, c), "n" == h.type.charAt(0)) {
        g *= 1 + e.value;
        if (0 == g) {
          l.PushOperand(b, "e#DIV/0!", 0);
          return;
        }
        f += h.value / g;
        a = l.LookupResultType(h.type, a || h.type, l.TypeLookupTable.plus);
      } else {
        if ("e" == h.type.charAt(0) && "e" != a.charAt(0)) {
          a = h.type;
          break;
        }
      }
    }
    "n" == a.charAt(0) && (a = "n$");
    l.PushOperand(b, a, f);
  }
};
SocialCalc.Formula.FunctionList.NPV = [SocialCalc.Formula.NPVFunction, -2, "npv", "", "financial"];
SocialCalc.Formula.IRRFunction = function(a, b, c, d) {
  var e, f, g, h;
  h = [];
  var l = [], n = SocialCalc.Formula;
  for (h.push(c.pop());h.length;) {
    if (e = n.OperandValueAndType(d, h), "n" == e.type.charAt(0)) {
      l.push(e.value);
    } else {
      if ("e" == e.type.charAt(0)) {
        n.PushOperand(b, "e#VALUE!", 0);
        return;
      }
    }
  }
  if (l.length) {
    e = {value:0};
    if (c.length) {
      e = n.OperandAsNumber(d, c);
      if ("n" != e.type.charAt(0) && "b" != e.type.charAt(0)) {
        n.PushOperand(b, "e#VALUE!", 0);
        return;
      }
      if (c.length) {
        n.FunctionArgsError(a, b);
        return;
      }
    }
    e.value = e.value || 0.1;
    a = 0;
    c = e.value;
    for (d = 1;1E-7 < (0 <= d ? d : -d) && c != g;) {
      d = 0;
      e = 1;
      for (h = 0;h < l.length;h++) {
        e *= 1 + c;
        if (0 == e) {
          n.PushOperand(b, "e#DIV/0!", 0);
          return;
        }
        d += l[h] / e;
      }
      null != f ? (f = (d - f) / (c - g), g = c, c -= d / f) : (g = c, c *= 1.1);
      f = d;
      a++;
      if (20 <= a) {
        n.PushOperand(b, "e#NUM!", 0);
        return;
      }
    }
    n.PushOperand(b, "n%", c);
  } else {
    n.PushOperand(b, "e#NUM!", 0);
  }
};
SocialCalc.Formula.FunctionList.IRR = [SocialCalc.Formula.IRRFunction, -1, "irr", "", "financial"];
SocialCalc.Formula.IoFunctions = function(a, b, c, d) {
  var e, f, g = SocialCalc.Formula, h = 0, l = "e#VALUE!", n = c.length, p = {BUTTON:[1], EMAIL:[4, 4, 4, 4], EMAILIF:[4, 4, 4, 4, 4], EMAILONEDIT:[4, 4, 4, 4, 4], EMAILAT:[4, 4, 4, 4, 4], EMAILONEDITIF:[4, 4, 4, 4, 4, 4], EMAILATIF:[4, 4, 4, 4, 4, 4], SUBMIT:[1], TEXTBOX:[1], CHECKBOX:[-1], COPYVALUE:[2, -1, 3], COPYFORMULA:[2, -1, 3]}[a], r = [], s = [];
  for (e = 1;e <= n;e++) {
    if (e > p.length) {
      g.FunctionArgsError(a, b);
      return;
    }
    0 == p[e - 1] ? f = g.OperandAsNumber(d, c) : 1 == p[e - 1] ? f = g.OperandAsText(d, c) : 2 == p[e - 1] ? (f = g.OperandAsCoord(d, c), f.value = f.value.replace(/\$/g, "")) : 3 == p[e - 1] ? f = g.OperandValueAndType(d, c) : 4 == p[e - 1] ? "range" == c[c.length - 1].type ? (f = g.OperandAsRange(d, c), f.value = f.value.replace(/\$/g, "")) : f = g.OperandAsText(d, c) : -1 == p[e - 1] && (f = g.OperandValueAndType(d, c));
    r[e] = f.value;
    s[e] = f.type;
    if ("e" == f.type.charAt(0)) {
      g.PushOperand(b, f.type, h);
      return;
    }
  }
  switch(a) {
    case "SUBMIT":
      h = "Submit";
    case "BUTTON":
    ;
    case "TEXTBOX":
      0 < n && (h = r[1]);
      l = "ti" + a;
      break;
    case "EMAIL":
    ;
    case "EMAILIF":
      l = "ti" + a;
      h = "Send";
      break;
    case "EMAILONEDIT":
    ;
    case "EMAILONEDITIF":
    ;
    case "EMAILAT":
    ;
    case "EMAILATIF":
      l = "ti" + a;
      h = "Send Now";
      break;
    case "CHECKBOX":
      h = "t" == s[1].charAt(0) ? "TRUE" == r[1].toUpperCase() ? 1 : 0 : 0 == r[1] ? 0 : 1;
      l = "ni" + a;
      break;
    case "COPYVALUE":
      h = d.cells[r[1]].datavalue;
      l = "t";
      break;
    case "COPYFORMULA":
      h = d.cells[r[1]].datavalue, l = "t";
  }
  g.PushOperand(b, l, h);
};
SocialCalc.Formula.FunctionList.BUTTON = [SocialCalc.Formula.IoFunctions, 1, "label", "", "gui", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Button('<%=cell_reference%>');\"><%=formated_value%></button>"];
SocialCalc.Formula.FunctionList.EMAIL = [SocialCalc.Formula.IoFunctions, -3, "to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "ParameterList"];
SocialCalc.Formula.FunctionList.EMAILIF = [SocialCalc.Formula.IoFunctions, -4, "condition_range, to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "ParameterList"];
SocialCalc.Formula.FunctionList.EMAILONEDIT = [SocialCalc.Formula.IoFunctions, -4, "editRange, to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "EventTree"];
SocialCalc.Formula.FunctionList.EMAILAT = [SocialCalc.Formula.IoFunctions, -4, "datetime_value, to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "TimeTrigger"];
SocialCalc.Formula.FunctionList.EMAILONEDITIF = [SocialCalc.Formula.IoFunctions, -5, "editRange, condition, to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "EventTree"];
SocialCalc.Formula.FunctionList.EMAILATIF = [SocialCalc.Formula.IoFunctions, -5, "datetime_value, condition, to_range subject_range, body_range", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Email('<%=cell_reference%>');\"><%=formated_value%></button>", "TimeTrigger"];
SocialCalc.Formula.FunctionList.SUBMIT = [SocialCalc.Formula.IoFunctions, 100, "[label]", "", "action", "<button type='button' onclick=\"SocialCalc.TriggerIoAction.Submit('<%=cell_reference%>');\"><%=formated_value%></button>", "ParameterList"];
SocialCalc.Formula.FunctionList.TEXTBOX = [SocialCalc.Formula.IoFunctions, 1, "value", "", "gui", "<input type='text' id='TEXTBOX_<%=cell_reference%>' onblur='SocialCalc.CmdGotFocus(null);' oninput=\"SocialCalc.TriggerIoAction.TextBox('<%=cell_reference%>')\" value='<%=display_value%>' >", "Input"];
SocialCalc.Formula.FunctionList.CHECKBOX = [SocialCalc.Formula.IoFunctions, 1, "value", "", "gui", "<input type='checkbox' id='CHECKBOX_<%=cell_reference%>' <%=checked%> onblur='SocialCalc.CmdGotFocus(null);' onchange=\"SocialCalc.TriggerIoAction.CheckBox('<%=cell_reference%>')\" >", "Input"];
SocialCalc.Formula.FunctionList.COPYVALUE = [SocialCalc.Formula.IoFunctions, 3, "trigger_cell, value_range, destinationCell(s)", "", "action", "", "EventTree"];
SocialCalc.Formula.FunctionList.COPYFORMULA = [SocialCalc.Formula.IoFunctions, 3, "trigger_cell, formula_range, destinationCell(s)", "", "action", "", "EventTree"];
SocialCalc.TriggerIoAction.Button = function(a) {
  var b = window.spreadsheet, c = b.sheet;
  if ("undefined" !== typeof c.ioEventTree && "undefined" !== typeof c.ioParameterList && "undefined" !== c.ioEventTree[a]) {
    for (var d in c.ioEventTree[a]) {
      switch(a = c.ioParameterList[d], a.function_name) {
        case "COPYVALUE":
          var e = c.cells[SocialCalc.Formula.PlainCoord(a[1].value)];
          if ("undefined" !== typeof e && "b" != e.valuetype) {
            var f = e.datatype, g = e.valuetype, h = e.datavalue, l = e.formula;
            "f" == f && (l = "", f = g, "nd" == g && (f = "c", l = e.displaystring), "t" == g.charAt(0) && (f = "t"));
            a = "set " + a[2].value + " " + SocialCalc.Constants.cellDataType[f] + " " + g + " " + SocialCalc.encodeForSave(h) + " " + SocialCalc.encodeForSave(l);
          } else {
            a = "set " + a[2].value + " empty";
          }
          b.editor.EditorScheduleSheetCommands(a.trim(), !0, !1);
          break;
        case "COPYFORMULA":
          e = c.cells[SocialCalc.Formula.PlainCoord(a[1].value)], "undefined" !== typeof e && "b" != e.valuetype ? (f = e.datatype, g = e.valuetype, h = e.datavalue, l = e.formula, "f" == f && (sourceCell = SocialCalc.coordToCr(a[1].value), destinationCell = SocialCalc.coordToCr(a[2].value), l = SocialCalc.OffsetFormulaCoords(l, destinationCell.col - sourceCell.col, destinationCell.row - sourceCell.row), g = h = ""), a = "set " + a[2].value + " " + SocialCalc.Constants.cellDataType[f] + " " + g + 
          " " + SocialCalc.encodeForSave(h) + " " + SocialCalc.encodeForSave(l)) : a = "set " + a[2].value + " empty", b.editor.EditorScheduleSheetCommands(a.trim(), !0, !1);
      }
    }
  }
};
SocialCalc.TriggerIoAction.Email = function(a, b) {
  b = "undefined" !== typeof b ? b : null;
  var c = SocialCalc.Formula, d = window.spreadsheet;
  null == d && (d = window.ss);
  var e = d.sheet, f = e.cells[a];
  if ("undefined" !== typeof e.ioParameterList) {
    var g = e.ioParameterList[a];
    if ("undefined" !== typeof g) {
      for (var h = [], l = [], n = 1, p = 0;p < g.length;p++) {
        if ("t" == g[p].type.charAt(0) && (h[p] = [String(g[p].value).replace(/ /g, "%20")]), "coord" == g[p].type && (h[p] = [String(e.GetAssuredCell(g[p].value).datavalue).replace(/ /g, "%20")]), "range" == g[p].type) {
          var r = c.DecodeRangeParts(e, g[p].value);
          h[p] = [];
          l[p] = [];
          for (var s = 0, q = 0;q < r.ncols;q++) {
            for (var t = 0;t < r.nrows;t++) {
              var u = SocialCalc.crToCoord(r.col1num + q, r.row1num + t), f = r.sheetdata.GetAssuredCell(u);
              h[p].push(f.datavalue.toString().replace(/ /g, "%20"));
              l[p].push(u);
              s++;
            }
          }
          s > n && (n = s);
        }
      }
      c = -1;
      f = 0;
      switch(g.function_name) {
        case "EMAILIF":
          c = 0;
        case "EMAILAT":
        ;
        case "EMAILONEDIT":
          f = 1;
          break;
        case "EMAILONEDITIF":
        ;
        case "EMAILATIF":
          c = 1, f = 2;
      }
      switch(g.function_name) {
        case "EMAILONEDIT":
        ;
        case "EMAILONEDITIF":
          b && "coord" == g[0].type && g[0].value == b && (b = null);
          break;
        default:
          b = null;
      }
      g = !1;
      p = [];
      for (n -= 1;-1 < n;n--) {
        if (-1 == c || !1 != h[c][n >= h[c].length ? 0 : n]) {
          b && b != l[0][n] || (r = n >= h[f].length ? 0 : n, s = n >= h[f + 1].length ? 0 : n, q = n >= h[f + 2].length ? 0 : n, t = h[f][r] + " " + h[f + 1][s] + " " + h[f + 2][q], g = !0, e.ScheduleSheetCommands("sendemail " + t, !1), p.push([h[f][r], h[f + 1][s], h[f + 2][q]]));
        }
      }
      g && SocialCalc.EditorSheetStatusCallback(null, "emailing", null, d.editor);
      return p;
    }
  }
};
SocialCalc.TriggerIoAction.Submit = function(a) {
  a = null != SocialCalc.CurrentSpreadsheetControlObject ? SocialCalc.CurrentSpreadsheetControlObject.formDataViewer : SocialCalc.CurrentSpreadsheetViewerObject.formDataViewer;
  if (null != a && !0 == a.loaded) {
    for (var b = window.spreadsheet.sheet, c = new Date, c = "" + c.getFullYear() + "-" + (c.getMonth() + 1) + "-" + c.getDate() + " " + c.getHours() + ":" + c.getMinutes() + ":" + c.getSeconds(), d = 2;d <= a.formFieldsLength + 1;d++) {
      var e = SocialCalc.crToCoord(d, 2), c = c + ("\r" + a.sheet.cells[e].datavalue)
    }
    b.ScheduleSheetCommands("submitform \r" + c, !1);
  }
};
SocialCalc.TriggerIoAction.TextBox = function(a) {
  SocialCalc.TriggerIoAction.updateInputWidgetFormula("TEXTBOX", a, function(a) {
    return a.value;
  });
};
SocialCalc.TriggerIoAction.CheckBox = function(a) {
  SocialCalc.TriggerIoAction.updateInputWidgetFormula("CHECKBOX", a, function(a) {
    return a.checked ? "TRUE" : "FALSE";
  });
};
SocialCalc.TriggerIoAction.updateInputWidgetFormula = function(a, b, c) {
  var d = window.spreadsheet, e = d.sheet.cells[b];
  b = document.getElementById(a + "_" + b);
  c = c(b);
  c = SocialCalc.encodeForSave(c);
  d.editor.EditorScheduleSheetCommands("set " + e.coord + " formula " + a + '("' + c + '")', !0, !1);
  SocialCalc.TriggerIoAction.UpdateFormDataSheet(a, e.coord, c);
};
SocialCalc.TriggerIoAction.UpdateFormDataSheet = function(a, b, c) {
  var d = null != SocialCalc.CurrentSpreadsheetControlObject ? SocialCalc.CurrentSpreadsheetControlObject.formDataViewer : SocialCalc.CurrentSpreadsheetViewerObject.formDataViewer;
  null != d && (a = (a + b).toLowerCase(), null != d.formFields[a] && (a = SocialCalc.crToCoord(d.formFields[a], 2), d.sheet.ScheduleSheetCommands("set " + a + " text t " + c, !1)));
};
SocialCalc.Formula.SheetCache = {sheets:{}, waitingForLoading:null, constants:{asloaded:0, recalcing:1, recalcdone:2}, loadsheet:null};
SocialCalc.Formula.FindInSheetCache = function(a) {
  var b = SocialCalc.Formula.SheetCache;
  a = SocialCalc.Formula.NormalizeSheetName(a);
  if (b.sheets[a]) {
    return b.sheets[a].sheet;
  }
  if (b.waitingForLoading) {
    return null;
  }
  if (b.loadsheet) {
    return alert("Using SocialCalc.Formula.SheetCache.loadsheet - deprecated"), SocialCalc.Formula.AddSheetToCache(a, b.loadsheet(a));
  }
  b.waitingForLoading = a;
  return null;
};
SocialCalc.Formula.AddSheetToCache = function(a, b, c) {
  var d = null, e = SocialCalc.Formula.SheetCache, f = e.constants;
  a = SocialCalc.Formula.NormalizeSheetName(a);
  b && (d = new SocialCalc.Sheet, d.ParseSheetSave(b));
  e.sheets[a] = {sheet:d, recalcstate:f.asloaded, name:a};
  SocialCalc.Formula.FreshnessInfo.sheets[a] = "undefined" == typeof c || !1 === c;
  return d;
};
SocialCalc.Formula.NormalizeSheetName = function(a) {
  return SocialCalc.Callbacks.NormalizeSheetName ? SocialCalc.Callbacks.NormalizeSheetName(a) : a.toLowerCase();
};
SocialCalc.Formula.RemoteFunctionInfo = {waitingForServer:null};
SocialCalc.Formula.FreshnessInfo = {sheets:{}, "volatile":{}, recalc_completed:!1};
SocialCalc.Formula.FreshnessInfoReset = function() {
  var a = SocialCalc.Formula.FreshnessInfo, b = SocialCalc.Formula.SheetCache, c;
  for (c in a.sheets) {
    !1 === a.sheets[c] && delete b.sheets[c];
  }
  a.sheets = {};
  a["volatile"] = {};
  a.recalc_completed = !1;
};
SocialCalc.Formula.PlainCoord = function(a) {
  return-1 == a.indexOf("$") ? a : a.replace(/\$/g, "");
};
SocialCalc.Formula.OrderRangeParts = function(a, b) {
  var c, d, e = {};
  c = SocialCalc.coordToCr(a);
  d = SocialCalc.coordToCr(b);
  c.col > d.col ? (e.c1 = d.col, e.c2 = c.col) : (e.c1 = c.col, e.c2 = d.col);
  c.row > d.row ? (e.r1 = d.row, e.r2 = c.row) : (e.r1 = c.row, e.r2 = d.row);
  return e;
};
SocialCalc.Formula.TestCriteria = function(a, b, c) {
  var d, e, f;
  if (null == c) {
    return!1;
  }
  c += "";
  d = c.charAt(0);
  "=" == d || "<" == d || ">" == d ? c = c.substring(1) : -1 != c.search(/([^~]\*|^\*)/) || -1 != c.search(/([^~]\?|^\?)/) ? (d = "regex", "*" == c ? c = ".+" : (c = c.split("").reverse().join(""), c = c.replace(/\?(?=[^~])|\?$/g, "?.").replace(/\?~/g, "?\\").replace(/\*(?=[^~])|\*$/g, "*.").replace(/\*~/, "*\\"), c = c.split("").reverse().join("")), c = "^" + c + "$") : (d = c.substring(0, 2), "<=" == d || "<>" == d || ">=" == d ? c = c.substring(2) : d = "none");
  c = SocialCalc.DetermineValueType(c);
  if (!c.type) {
    if ("none" == d) {
      return!1;
    }
    if ("b" == b.charAt(0)) {
      if ("=" == d) {
        return!0;
      }
    } else {
      if ("<>" == d) {
        return!0;
      }
    }
    return!1;
  }
  e = !1;
  "n" == c.type.charAt(0) && "t" == b.charAt(0) && (f = SocialCalc.DetermineValueType(a), "n" == f.type.charAt(0) && (a = f.value, b = f.type));
  if ("n" == b.charAt(0) && "n" == c.type.charAt(0)) {
    switch(a -= 0, c.value -= 0, d) {
      case "<":
        e = a < c.value;
        break;
      case "<=":
        e = a <= c.value;
        break;
      case "=":
      ;
      case "none":
        e = a == c.value;
        break;
      case ">=":
        e = a >= c.value;
        break;
      case ">":
        e = a > c.value;
        break;
      case "<>":
        e = a != c.value;
    }
  } else {
    if ("e" == b.charAt(0)) {
      e = !1;
    } else {
      if ("e" == c.type.charAt(0)) {
        e = !1;
      } else {
        "n" == b.charAt(0) && (a = SocialCalc.format_number_for_display(a, "n", ""));
        if ("n" == c.type.charAt(0)) {
          return!1;
        }
        a = a ? a.toLowerCase() : "";
        c.value = c.value ? c.value.toLowerCase() : "";
        switch(d) {
          case "<":
            e = a < c.value;
            break;
          case "<=":
            e = a <= c.value;
            break;
          case "=":
            e = a == c.value;
            break;
          case "none":
            e = a.substring(0, c.value.length) == c.value;
            break;
          case ">=":
            e = a >= c.value;
            break;
          case ">":
            e = a > c.value;
            break;
          case "<>":
            e = a != c.value;
            break;
          case "regex":
            e = -1 != a.search(RegExp(c.value));
        }
      }
    }
  }
  return e;
};
SocialCalc || (SocialCalc = {});
SocialCalc.Popup = {};
SocialCalc.Popup.Types = {};
SocialCalc.Popup.Controls = {};
SocialCalc.Popup.Current = {};
SocialCalc.Popup.LocalizeString = function(a) {
  return a;
};
SocialCalc.Popup.Create = function(a, b, c) {
  var d = SocialCalc.Popup.Types[a];
  d && d.Create && d.Create(a, b, c);
  SocialCalc.Popup.imagePrefix = SocialCalc.Constants.defaultImagePrefix;
};
SocialCalc.Popup.SetValue = function(a, b) {
  var c = SocialCalc.Popup, d = c.Types, e = c.Controls;
  e[a] ? (c = e[a].type, d = d[c], e = e[a].data, d && d.Create && (d.SetValue(c, a, b), e.attribs && e.attribs.changedcallback && e.attribs.changedcallback(e.attribs, a, b))) : alert("Unknown control " + a);
};
SocialCalc.Popup.SetDisabled = function(a, b) {
  var c = SocialCalc.Popup, d = c.Types, e = c.Controls;
  e[a] ? (e = e[a].type, (d = d[e]) && d.Create && (c.Current.id && a == c.Current.id && (d.Hide(e, c.Current.id), c.Current.id = null), d.SetDisabled(e, a, b))) : alert("Unknown control " + a);
};
SocialCalc.Popup.GetValue = function(a) {
  var b = SocialCalc.Popup, c = b.Types, b = b.Controls;
  if (b[a]) {
    return b = b[a].type, (c = c[b]) && c.Create ? c.GetValue(b, a) : null;
  }
  alert("Unknown control " + a);
};
SocialCalc.Popup.Initialize = function(a, b) {
  var c = SocialCalc.Popup, d = c.Types, c = c.Controls;
  c[a] ? (c = c[a].type, (d = d[c]) && d.Initialize && d.Initialize(c, a, b)) : alert("Unknown control " + a);
};
SocialCalc.Popup.Reset = function(a) {
  var b = SocialCalc.Popup.Types;
  b[a].Reset && b[a].Reset(a);
};
SocialCalc.Popup.CClick = function(a) {
  var b = SocialCalc.Popup, c = b.Types, d = b.Controls;
  if (!d[a]) {
    alert("Unknown control " + a);
  } else {
    if (!d[a].data || !d[a].data.disabled) {
      var e = d[a].type, f = c[e];
      if (b.Current.id && (c[d[b.Current.id].type].Hide(e, b.Current.id), a == b.Current.id)) {
        b.Current.id = null;
        return;
      }
      f && f.Show && f.Show(e, a);
      b.Current.id = a;
    }
  }
};
SocialCalc.Popup.Close = function() {
  var a = SocialCalc.Popup;
  a.Current.id && a.CClick(a.Current.id);
};
SocialCalc.Popup.Cancel = function() {
  var a = SocialCalc.Popup, b = a.Types, c = a.Controls;
  a.Current.id && (c = c[a.Current.id].type, b[c].Cancel(c, a.Current.id), a.Current.id = null);
};
SocialCalc.Popup.CreatePopupDiv = function(a, b) {
  var c, d = SocialCalc.Popup.Controls[a].data, e = document.createElement("div");
  e.style.position = "absolute";
  c = SocialCalc.GetElementPosition(d.mainele);
  e.style.top = c.top + d.mainele.offsetHeight + "px";
  e.style.left = c.left + "px";
  e.style.zIndex = 100;
  e.style.backgroundColor = "#FFF";
  e.style.border = "1px solid black";
  b.width && (e.style.width = b.width);
  d.mainele.appendChild(e);
  b.title && (e.innerHTML = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr><td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">' + b.title + '</td><td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.Popup.Cancel();">&nbsp;X&nbsp;</td></tr></table>', b.moveable && (d.dragregistered = e.firstChild.firstChild.firstChild.firstChild, SocialCalc.DragRegister(d.dragregistered, !0, !0, {MouseDown:SocialCalc.DragFunctionStart, 
  MouseMove:SocialCalc.DragFunctionPosition, MouseUp:SocialCalc.DragFunctionPosition, Disabled:null, positionobj:e}, d.mainele)));
  return e;
};
SocialCalc.Popup.EnsurePosition = function(a, b) {
  function c(a) {
    var b = SocialCalc.GetElementPosition(a);
    b.height = a.offsetHeight;
    b.width = a.offsetWidth;
    b.bottom = b.top + b.height;
    b.right = b.left + b.width;
    return b;
  }
  var d = SocialCalc.Popup.Controls[a].data, e = d.mainele.firstChild;
  if (e) {
    var d = d.popupele, f = c(d), g = c(b), e = c(e);
    e.bottom + f.height < g.bottom && e.left + f.width < g.right ? (d.style.top = e.bottom + "px", d.style.left = e.left + "px") : e.top - f.height > g.top && e.left + f.width < g.right ? (d.style.top = e.top - f.height + "px", d.style.left = e.left + "px") : e.bottom + f.height < g.bottom && e.right - f.width > g.left ? (d.style.top = e.bottom + "px", d.style.left = e.right - f.width + "px") : e.top - f.height > g.top && e.right - f.width > g.left ? (d.style.top = e.top - f.height + "px", d.style.left = 
    e.right - f.width + "px") : e.bottom + f.height < g.bottom && f.width < g.width ? (d.style.top = e.bottom + "px", d.style.left = g.left + Math.floor((g.width - f.width) / 2) + "px") : e.top - f.height > g.top && f.width < g.width ? (d.style.top = e.top - f.height + "px", d.style.left = g.left + Math.floor((g.width - f.width) / 2) + "px") : f.height < g.height && e.right + f.width < g.right ? (d.style.top = g.top + Math.floor((g.height - f.height) / 2) + "px", d.style.left = e.right + "px") : 
    f.height < g.height && e.left - f.width > g.left && (d.style.top = g.top + Math.floor((g.height - f.height) / 2) + "px", d.style.left = e.left - f.width + "px");
  } else {
    alert("No main popup element firstChild.");
  }
};
SocialCalc.Popup.DestroyPopupDiv = function(a, b) {
  a && (a.innerHTML = "", SocialCalc.DragUnregister(b), a.parentNode && a.parentNode.removeChild(a));
};
SocialCalc.Popup.RGBToHex = function(a) {
  var b = SocialCalc.Popup;
  return "" == a ? "000000" : (a = a.match(/(\d+)\D+(\d+)\D+(\d+)/)) ? b.ToHex(a[1]) + b.ToHex(a[2]) + b.ToHex(a[3]) : "000000";
};
SocialCalc.Popup.HexDigits = "0123456789ABCDEF";
SocialCalc.Popup.ToHex = function(a) {
  var b = SocialCalc.Popup, c = a % 16;
  return b.HexDigits.charAt(Math.floor(a / 16)) + b.HexDigits.charAt(c);
};
SocialCalc.Popup.FromHex = function(a) {
  var b = SocialCalc.Popup, c = b.HexDigits.indexOf(a.charAt(0).toUpperCase());
  a = b.HexDigits.indexOf(a.charAt(1).toUpperCase());
  return 16 * (0 <= c ? c : 0) + (0 <= a ? a : 0);
};
SocialCalc.Popup.HexToRGB = function(a) {
  var b = SocialCalc.Popup;
  return "rgb(" + b.FromHex(a.substring(1, 3)) + "," + b.FromHex(a.substring(3, 5)) + "," + b.FromHex(a.substring(5, 7)) + ")";
};
SocialCalc.Popup.makeRGB = function(a, b, c) {
  return "rgb(" + (0 < a ? a : 0) + "," + (0 < b ? b : 0) + "," + (0 < c ? c : 0) + ")";
};
SocialCalc.Popup.splitRGB = function(a) {
  return(a = a.match(/(\d+)\D+(\d+)\D+(\d+)\D/)) ? {r:a[1] - 0, g:a[2] - 0, b:a[3] - 0} : {r:0, g:0, b:0};
};
SocialCalc.Popup.Types.List = {};
SocialCalc.Popup.Types.List.Create = function(a, b, c) {
  a = {type:a, value:"", display:"", data:{}};
  SocialCalc.Popup.Controls[b] = a;
  a = a.data;
  a.attribs = c || {};
  (c = document.getElementById(b)) ? (a.mainele = c, c.innerHTML = '<input style="cursor:pointer;width:100px;font-size:smaller;" onfocus="this.blur();" onclick="SocialCalc.Popup.CClick(\'' + b + '\');" value="">', a.options = []) : alert("Missing element " + b);
};
SocialCalc.Popup.Types.List.SetValue = function(a, b, c) {
  a = SocialCalc.Popup.Controls[b].data;
  a.value = c;
  a.custom = !1;
  for (c = 0;c < a.options.length;c++) {
    if (o = a.options[c], !(o.a && (o.a.skip || o.a.custom || o.a.cancel) || o.v != a.value)) {
      a.display = o.o;
      break;
    }
  }
  c == a.options.length && (a.display = "Custom", a.custom = !0);
  a.mainele && a.mainele.firstChild && (a.mainele.firstChild.value = a.display);
};
SocialCalc.Popup.Types.List.SetDisabled = function(a, b, c) {
  a = SocialCalc.Popup.Controls[b].data;
  a.disabled = c;
  a.mainele && a.mainele.firstChild && (a.mainele.firstChild.disabled = c);
};
SocialCalc.Popup.Types.List.GetValue = function(a, b) {
  return SocialCalc.Popup.Controls[b].data.value;
};
SocialCalc.Popup.Types.List.Initialize = function(a, b, c) {
  var d;
  a = SocialCalc.Popup;
  var e = a.Controls[b].data;
  for (d in c.attribs) {
    e.attribs[d] = c.attribs[d];
  }
  e.options = c ? c.options : [];
  c.value && a.SetValue(b, c.value);
};
SocialCalc.Popup.Types.List.Reset = function(a) {
  var b = SocialCalc.Popup, c = b.Types, d = b.Controls;
  b.Current.id && d[b.Current.id].type == a && (c[a].Hide(a, b.Current.id), b.Current.id = null);
};
SocialCalc.Popup.Types.List.Show = function(a, b) {
  var c;
  c = SocialCalc.Popup;
  var d = c.Controls[b].data, e = "";
  d.popupele = c.CreatePopupDiv(b, d.attribs);
  d.custom ? (e = SocialCalc.Popup.Types.List.MakeCustom(a, b), c = document.createElement("div"), c.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">' + e + "</div>", d.customele = c.firstChild.firstChild.childNodes[1], d.listdiv = null) : (e = SocialCalc.Popup.Types.List.MakeList(a, b), c = document.createElement("div"), c.innerHTML = '<div style="cursor:default;padding:4px;">' + e + "</div>", d.customele = null, d.listdiv = c.firstChild);
  d.contentele = c;
  d.mainele && d.mainele.firstChild && (d.mainele.firstChild.disabled = !0);
  d.popupele.appendChild(c);
  d.attribs.ensureWithin && SocialCalc.Popup.EnsurePosition(b, d.attribs.ensureWithin);
};
SocialCalc.Popup.Types.List.MakeList = function(a, b) {
  var c, d, e, f = SocialCalc.Popup.Controls[b].data, g;
  g = '<table cellspacing="0" cellpadding="0"><tr><td style="vertical-align:top;">';
  f.ncols = 1;
  for (c = 0;c < f.options.length;c++) {
    d = f.options[c];
    if (d.a) {
      if (d.a.newcol) {
        g += '</td><td style="vertical-align:top;">&nbsp;&nbsp;&nbsp;&nbsp;</td><td style="vertical-align:top;">';
        f.ncols += 1;
        continue;
      }
      if (d.a.skip) {
        g += '<div style="font-size:x-small;white-space:nowrap;">' + d.o + "</div>";
        continue;
      }
    }
    e = d.v != f.value || d.a && (d.a.custom || d.a.cancel) ? "" : "background-color:#DDF;";
    g += '<div style="font-size:x-small;white-space:nowrap;' + e + '" onclick="SocialCalc.Popup.Types.List.ItemClicked(\'' + b + "','" + c + "');\" onmousemove=\"SocialCalc.Popup.Types.List.MouseMove('" + b + "',this);\">" + d.o + "</div>";
  }
  return g + "</td></tr></table>";
};
SocialCalc.Popup.Types.List.MakeCustom = function(a, b) {
  var c = SocialCalc.Popup.LocalizeString, d = "", d = SocialCalc.Popup.Controls[b].data.value, d = SocialCalc.special_chars(d);
  return d = '<div style="white-space:nowrap;"><br><input id="customvalue" value="' + d + '"><br><br><input style="font-size:smaller;" type="button" value="' + c("OK") + '" onclick="SocialCalc.Popup.Types.List.CustomOK(\'' + b + '\');return false;"><input style="font-size:smaller;" type="button" value="' + c("List") + '" onclick="SocialCalc.Popup.Types.List.CustomToList(\'' + b + '\');"><input style="font-size:smaller;" type="button" value="' + c("Cancel") + '" onclick="SocialCalc.Popup.Close();"><br></div>';
};
SocialCalc.Popup.Types.List.ItemClicked = function(a, b) {
  var c, d, e, f = SocialCalc.Popup.Controls[a].data;
  (c = f.options[b].a) && c.custom ? (c = f.contentele, d = SocialCalc.Popup.Types.List.MakeCustom("List", a), e = document.createElement("div"), e.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">' + d + "</div>", f.customele = e.firstChild.firstChild.childNodes[1], f.listdiv = null, f.contentele = e, f.popupele.replaceChild(e, c), f.attribs.ensureWithin && SocialCalc.Popup.EnsurePosition(a, f.attribs.ensureWithin)) : (c && c.cancel || SocialCalc.Popup.SetValue(a, f.options[b].v), 
  SocialCalc.Popup.Close());
};
SocialCalc.Popup.Types.List.CustomToList = function(a) {
  var b, c, d, e = SocialCalc.Popup.Controls[a].data;
  b = e.contentele;
  c = SocialCalc.Popup.Types.List.MakeList("List", a);
  d = document.createElement("div");
  d.innerHTML = '<div style="cursor:default;padding:4px;">' + c + "</div>";
  e.customele = null;
  e.listdiv = d.firstChild;
  e.contentele = d;
  e.popupele.replaceChild(d, b);
  e.attribs.ensureWithin && SocialCalc.Popup.EnsurePosition(a, e.attribs.ensureWithin);
};
SocialCalc.Popup.Types.List.CustomOK = function(a) {
  SocialCalc.Popup.SetValue(a, SocialCalc.Popup.Controls[a].data.customele.value);
  SocialCalc.Popup.Close();
};
SocialCalc.Popup.Types.List.MouseMove = function(a, b) {
  var c, d, e = SocialCalc.Popup.Controls[a].data;
  if (c = e.listdiv) {
    var f = c.firstChild.firstChild.firstChild;
    for (c = 0;c < e.ncols;c++) {
      for (d = 0;d < f.childNodes[2 * c].childNodes.length;d++) {
        f.childNodes[2 * c].childNodes[d].style.backgroundColor = "#FFF";
      }
    }
    b.style.backgroundColor = "#DDF";
  }
};
SocialCalc.Popup.Types.List.Hide = function(a, b) {
  var c = SocialCalc.Popup, d = c.Controls[b].data;
  c.DestroyPopupDiv(d.popupele, d.dragregistered);
  d.popupele = null;
  d.mainele && d.mainele.firstChild && (d.mainele.firstChild.disabled = !1);
};
SocialCalc.Popup.Types.List.Cancel = function(a, b) {
  SocialCalc.Popup.Types.List.Hide(a, b);
};
SocialCalc.Popup.Types.ColorChooser = {};
SocialCalc.Popup.Types.ColorChooser.Create = function(a, b, c) {
  a = {type:a, value:"", display:"", data:{}};
  SocialCalc.Popup.Controls[b] = a;
  a = a.data;
  a.attribs = c || {};
  c = a.attribs;
  a.value = "";
  var d = document.getElementById(b);
  d ? (a.mainele = d, d.innerHTML = '<div style="cursor:pointer;border:1px solid black;vertical-align:top;width:' + (c.sampleWidth || "15px") + ";height:" + (c.sampleHeight || "15px") + ';" onclick="SocialCalc.Popup.Types.ColorChooser.ControlClicked(\'' + b + "');\">&nbsp;</div>") : alert("Missing element " + b);
};
SocialCalc.Popup.Types.ColorChooser.SetValue = function(a, b, c) {
  a = SocialCalc.Popup;
  b = a.Controls[b].data;
  var d = b.attribs;
  b.value = c;
  b.custom = !1;
  b.mainele && b.mainele.firstChild && (b.value ? (b.mainele.firstChild.style.backgroundColor = b.value, c = d.backgroundImage ? "url(" + a.imagePrefix + d.backgroundImage + ")" : "", a = "center center") : (b.mainele.firstChild.style.backgroundColor = "#FFF", d.backgroundImageDefault ? (c = "url(" + a.imagePrefix + d.backgroundImageDefault + ")", a = "center center") : (c = "url(" + a.imagePrefix + "defaultcolor.gif)", a = "left top")), b.mainele.firstChild.style.backgroundPosition = a, b.mainele.firstChild.style.backgroundImage = 
  c);
};
SocialCalc.Popup.Types.ColorChooser.SetDisabled = function(a, b, c) {
  a = SocialCalc.Popup;
  var d = a.Controls[b].data, e = d.attribs;
  d.disabled = c;
  d.mainele && d.mainele.firstChild && (c ? (d.mainele.firstChild.style.backgroundColor = "#DDD", e.backgroundImageDisabled ? (img = "url(" + a.imagePrefix + e.backgroundImageDisabled + ")", pos = "center center") : (img = "url(" + a.imagePrefix + "defaultcolor.gif)", pos = "left top"), d.mainele.firstChild.style.backgroundPosition = pos, d.mainele.firstChild.style.backgroundImage = img) : a.SetValue(b, d.value));
};
SocialCalc.Popup.Types.ColorChooser.GetValue = function(a, b) {
  return SocialCalc.Popup.Controls[b].data.value;
};
SocialCalc.Popup.Types.ColorChooser.Initialize = function(a, b, c) {
  var d;
  a = SocialCalc.Popup;
  var e = a.Controls[b].data;
  for (d in c.attribs) {
    e.attribs[d] = c.attribs[d];
  }
  c.value && a.SetValue(b, c.value);
};
SocialCalc.Popup.Types.ColorChooser.Reset = function(a) {
  var b = SocialCalc.Popup, c = b.Types, d = b.Controls;
  b.Current.id && d[b.Current.id].type == a && (c[a].Hide(a, b.Current.id), b.Current.id = null);
};
SocialCalc.Popup.Types.ColorChooser.Show = function(a, b) {
  var c, d;
  c = SocialCalc.Popup;
  var e = c.Controls[b].data;
  d = "";
  e.oldvalue = e.value;
  e.popupele = c.CreatePopupDiv(b, e.attribs);
  e.custom ? (d = SocialCalc.Popup.Types.ColorChooser.MakeCustom(a, b), c = document.createElement("div"), c.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">' + d + "</div>", e.customele = c.firstChild.firstChild.childNodes[2]) : (d = SocialCalc.Popup.Types.ColorChooser.CreateGrid(a, b), c = document.createElement("div"), c.style.padding = "3px", c.style.backgroundColor = "#CCC", c.appendChild(d), e.customele = null);
  e.contentele = c;
  e.popupele.appendChild(c);
  e.attribs.ensureWithin && SocialCalc.Popup.EnsurePosition(b, e.attribs.ensureWithin);
};
SocialCalc.Popup.Types.ColorChooser.MakeCustom = function(a, b) {
  var c = SocialCalc.Popup, d = c.LocalizeString, e = "";
  return e = '<div style="white-space:nowrap;"><br>#<input id="customvalue" style="width:75px;" value="' + c.Controls[b].data.value + '"><br><br><input style="font-size:smaller;" type="button" value="' + d("OK") + '" onclick="SocialCalc.Popup.Types.ColorChooser.CustomOK(\'' + b + '\');return false;"><input style="font-size:smaller;" type="button" value="' + d("Grid") + '" onclick="SocialCalc.Popup.Types.ColorChooser.CustomToGrid(\'' + b + "');\"><br></div>";
};
SocialCalc.Popup.Types.ColorChooser.ItemClicked = function(a, b) {
  SocialCalc.Popup.Close();
};
SocialCalc.Popup.Types.ColorChooser.CustomToList = function(a) {
};
SocialCalc.Popup.Types.ColorChooser.CustomOK = function(a) {
  var b = SocialCalc.Popup;
  b.SetValue(a, b.Controls[a].data.customele.value);
  b.Close();
};
SocialCalc.Popup.Types.ColorChooser.Hide = function(a, b) {
  var c = SocialCalc.Popup, d = c.Controls[b].data;
  c.DestroyPopupDiv(d.popupele, d.dragregistered);
  d.popupele = null;
};
SocialCalc.Popup.Types.ColorChooser.Cancel = function(a, b) {
  var c = SocialCalc.Popup;
  c.SetValue(b, c.Controls[b].data.oldvalue);
  SocialCalc.Popup.Types.ColorChooser.Hide(a, b);
};
SocialCalc.Popup.Types.ColorChooser.CreateGrid = function(a, b) {
  var c, d, e, f, g, h = SocialCalc.Popup, l = h.Types, n = h.LocalizeString;
  c = h.Controls[b].data;
  c.grid = {};
  var p = c.grid, r = document.createElement("div");
  c = document.createElement("table");
  c.cellSpacing = 0;
  c.cellPadding = 0;
  c.style.width = "100px";
  p.table = c;
  c = document.createElement("tbody");
  p.table.appendChild(c);
  p.tbody = c;
  for (d = 0;16 > d;d++) {
    e = document.createElement("tr");
    for (f = 0;5 > f;f++) {
      g = {}, p[d + "," + f] = g, c = document.createElement("td"), c.style.fontSize = "1px", c.innerHTML = "&nbsp;", c.style.height = "10px", 1 >= f ? (c.style.width = "17px", c.style.borderRight = "3px solid white") : (c.style.width = "20px", c.style.backgroundRepeat = "no-repeat"), e.appendChild(c), g.ele = c;
    }
    p.tbody.appendChild(e);
  }
  r.appendChild(p.table);
  c = document.createElement("div");
  c.style.marginTop = "3px";
  c.innerHTML = '<table cellspacing="0" cellpadding="0"><tr><td style="width:17px;background-color:#FFF;background-image:url(' + h.imagePrefix + 'defaultcolor.gif);height:16px;font-size:10px;cursor:pointer;" title="' + n("Default") + '">&nbsp;</td><td style="width:23px;height:16px;font-size:10px;text-align:center;cursor:pointer;" title="' + n("Custom") + '">#</td><td style="width:60px;height:16px;font-size:10px;text-align:center;cursor:pointer;">' + n("OK") + "</td></tr></table>";
  p.defaultbox = c.firstChild.firstChild.firstChild.childNodes[0];
  p.defaultbox.onclick = l.ColorChooser.DefaultClicked;
  p.custom = c.firstChild.firstChild.firstChild.childNodes[1];
  p.custom.onclick = l.ColorChooser.CustomClicked;
  p.msg = c.firstChild.firstChild.firstChild.childNodes[2];
  p.msg.onclick = l.ColorChooser.CloseOK;
  r.appendChild(c);
  p.table.onmousedown = l.ColorChooser.GridMouseDown;
  l.ColorChooser.DetermineColors(b);
  l.ColorChooser.SetColors(b);
  return r;
};
SocialCalc.Popup.Types.ColorChooser.gridToG = function(a, b, c) {
  return a[b + "," + c];
};
SocialCalc.Popup.Types.ColorChooser.DetermineColors = function(a) {
  var b = SocialCalc.Popup, c = b.Types.ColorChooser, d = b.Controls[a].data;
  a = d.grid;
  var e, f = b.splitRGB(d.value), d = 2;
  e = 16 - Math.floor((f.r + 16) / 16);
  a["selectedrow" + d] = e;
  for (e = 0;16 > e;e++) {
    c.gridToG(a, e, d).rgb = b.makeRGB(17 * (15 - e), 0, 0);
  }
  d = 3;
  e = 16 - Math.floor((f.g + 16) / 16);
  a["selectedrow" + d] = e;
  for (e = 0;16 > e;e++) {
    c.gridToG(a, e, d).rgb = b.makeRGB(0, 17 * (15 - e), 0);
  }
  d = 4;
  e = 16 - Math.floor((f.b + 16) / 16);
  a["selectedrow" + d] = e;
  for (e = 0;16 > e;e++) {
    c.gridToG(a, e, d).rgb = b.makeRGB(0, 0, 17 * (15 - e));
  }
  d = 1;
  for (e = 0;16 > e;e++) {
    c.gridToG(a, e, d).rgb = b.makeRGB(17 * (15 - e), 17 * (15 - e), 17 * (15 - e));
  }
  var d = 0, b = [0, 68, 153, 204, 255], f = "400 310 420 440 442 340 040 042 032 044 024 004 204 314 402 414".split(" "), g;
  for (e = 0;16 > e;e++) {
    g = f[e], c.gridToG(a, e, d).rgb = "rgb(" + b[g.charAt(0) - 0] + "," + b[g.charAt(1) - 0] + "," + b[g.charAt(2) - 0] + ")";
  }
};
SocialCalc.Popup.Types.ColorChooser.SetColors = function(a) {
  var b, c, d, e = SocialCalc.Popup, f = e.Types.ColorChooser, g = e.Controls[a].data, h = g.grid;
  for (b = 0;16 > b;b++) {
    for (c = 0;5 > c;c++) {
      d = f.gridToG(h, b, c), d.ele.style.backgroundColor = d.rgb, d.ele.title = e.RGBToHex(d.rgb), d.ele.style.backgroundImage = h["selectedrow" + c] == b ? "url(" + e.imagePrefix + "chooserarrow.gif)" : "";
    }
  }
  e.SetValue(a, g.value);
  h.msg.style.backgroundColor = g.value;
  a = e.splitRGB(g.value || "rgb(255,255,255)");
  h.msg.style.color = 220 > a.r + a.g + a.b ? "#FFF" : "#000";
  g.value ? (h.msg.style.backgroundImage = "", h.msg.title = e.RGBToHex(g.value)) : (h.msg.style.backgroundColor = "#FFF", h.msg.style.backgroundImage = "url(" + e.imagePrefix + "defaultcolor.gif)", h.msg.title = "Default");
};
SocialCalc.Popup.Types.ColorChooser.GridMouseDown = function(a) {
  var b = a || window.event;
  a = SocialCalc.Popup;
  var c = a.Types.ColorChooser, d = a.Controls, e = a.Current.id;
  if (e) {
    var d = d[e].data, f = d.grid;
    switch(b.type) {
      case "mousedown":
        f.mousedown = !0;
        break;
      case "mouseup":
        f.mousedown = !1;
        break;
      case "mousemove":
        if (!f.mousedown) {
          return;
        }
      ;
    }
    var g = SocialCalc.GetElementPositionWithScroll(d.mainele), h = b.clientX - g.left, l = b.clientY - g.top, b = SocialCalc.GetElementPositionWithScroll(f.table);
    b.left -= g.left;
    b.top -= g.top;
    g = Math.floor((l - b.top - 2) / 10);
    g = 0 > g ? 0 : g;
    h = Math.floor((h - b.left) / 20);
    h = 0 > h ? 0 : 4 < h ? 4 : h;
    f = c.gridToG(f, 0 > g ? 0 : 15 < g ? 15 : g, h).ele.style.backgroundColor;
    g = a.splitRGB(f);
    b = a.splitRGB(d.value);
    switch(h) {
      case 2:
        d.value = a.makeRGB(g.r, b.g, b.b);
        break;
      case 3:
        d.value = a.makeRGB(b.r, g.g, b.b);
        break;
      case 4:
        d.value = a.makeRGB(b.r, b.g, g.b);
        break;
      case 0:
      ;
      case 1:
        d.value = f;
    }
    c.DetermineColors(e);
    c.SetColors(e);
  }
};
SocialCalc.Popup.Types.ColorChooser.ControlClicked = function(a) {
  var b = SocialCalc.Popup, c = b.Types.ColorChooser, d = b.Current.id;
  d && a == d ? c.CloseOK() : b.CClick(a);
};
SocialCalc.Popup.Types.ColorChooser.DefaultClicked = function(a) {
  var b = SocialCalc.Popup;
  a = b.Controls;
  if (b = b.Current.id) {
    a = a[b].data, a.value = "", SocialCalc.Popup.SetValue(b, a.value), SocialCalc.Popup.Close();
  }
};
SocialCalc.Popup.Types.ColorChooser.CustomClicked = function(a) {
  a = SocialCalc.Popup;
  var b = a.Controls, c = a.Current.id;
  if (c) {
    var b = b[c].data, d, e, f;
    d = b.contentele;
    e = SocialCalc.Popup.Types.ColorChooser.MakeCustom("ColorChooser", c);
    f = document.createElement("div");
    f.innerHTML = '<div style="cursor:default;padding:4px;background-color:#CCC;">' + e + "</div>";
    b.customele = f.firstChild.firstChild.childNodes[2];
    b.contentele = f;
    b.popupele.replaceChild(f, d);
    b.customele.value = a.RGBToHex(b.value);
    b.attribs.ensureWithin && SocialCalc.Popup.EnsurePosition(c, b.attribs.ensureWithin);
  }
};
SocialCalc.Popup.Types.ColorChooser.CustomToGrid = function(a) {
  var b, c;
  b = SocialCalc.Popup;
  var d = b.Controls[a].data;
  SocialCalc.Popup.SetValue(a, b.HexToRGB("#" + d.customele.value));
  var e;
  b = d.contentele;
  e = SocialCalc.Popup.Types.ColorChooser.CreateGrid("ColorChooser", a);
  c = document.createElement("div");
  c.style.padding = "3px";
  c.style.backgroundColor = "#CCC";
  c.appendChild(e);
  d.customele = null;
  d.contentele = c;
  d.popupele.replaceChild(c, b);
  d.attribs.ensureWithin && SocialCalc.Popup.EnsurePosition(a, d.attribs.ensureWithin);
};
SocialCalc.Popup.Types.ColorChooser.CustomOK = function(a) {
  var b = SocialCalc.Popup;
  SocialCalc.Popup.SetValue(a, b.HexToRGB("#" + b.Controls[a].data.customele.value));
  SocialCalc.Popup.Close();
};
SocialCalc.Popup.Types.ColorChooser.CloseOK = function(a) {
  var b = SocialCalc.Popup;
  a = b.Controls;
  if (b = b.Current.id) {
    SocialCalc.Popup.SetValue(b, a[b].data.value), SocialCalc.Popup.Close();
  }
};
SocialCalc || (alert("Main SocialCalc code module needed"), SocialCalc = {});
SocialCalc.TableEditor || alert("SocialCalc TableEditor code module needed");
SocialCalc.CurrentSpreadsheetControlObject = null;
SocialCalc.SpreadsheetControl = function(a) {
  var b = SocialCalc.Constants;
  this.spreadsheetDiv = this.parentNode = null;
  this.viewheight = this.width = this.height = this.requestedSpaceBelow = this.requestedWidth = this.requestedHeight = 0;
  this.tabs = [];
  this.tabnums = {};
  this.tabreplacements = {};
  this.currentTab = -1;
  this.views = {};
  this.editorDiv = this.spreadsheetDiv = this.editor = this.context = this.sheet = null;
  this.moverange = this.sortrange = "";
  this.idPrefix = a || "SocialCalc-";
  this.multipartBoundary = "SocialCalcSpreadsheetControlSave";
  this.imagePrefix = b.defaultImagePrefix;
  this.toolbarbackground = b.SCToolbarbackground;
  this.tabbackground = b.SCTabbackground;
  this.tabselectedCSS = b.SCTabselectedCSS;
  this.tabplainCSS = b.SCTabplainCSS;
  this.toolbartext = b.SCToolbartext;
  this.formulabarheight = b.SCFormulabarheight;
  this.statuslineheight = b.SCStatuslineheight;
  this.statuslineCSS = b.SCStatuslineCSS;
  this.ExportCallback = null;
  "undefined" === typeof SocialCalc.debug_log && (SocialCalc.debug_log = []);
  this.sheet = new SocialCalc.Sheet;
  this.context = new SocialCalc.RenderContext(this.sheet);
  this.context.showGrid = !0;
  this.context.showRCHeaders = !0;
  this.editor = new SocialCalc.TableEditor(this.context);
  this.editor.StatusCallback.statusline = {func:SocialCalc.SpreadsheetControlStatuslineCallback, params:{statuslineid:this.idPrefix + "statusline", recalcid1:this.idPrefix + "divider_recalc", recalcid2:this.idPrefix + "button_recalc"}};
  SocialCalc.CurrentSpreadsheetControlObject = this;
  this.editor.MoveECellCallback.movefrom = function(a) {
    var b = SocialCalc.GetSpreadsheetControlObject();
    b.context.cursorsuffix = "";
    a.range2.hasrange && !a.cellhandles.noCursorSuffix && (a.ecell.row == a.range2.top && (a.ecell.col < a.range2.left || a.ecell.col > a.range2.right + 1) && (b.context.cursorsuffix = "insertleft"), a.ecell.col == a.range2.left && (a.ecell.row < a.range2.top || a.ecell.row > a.range2.bottom + 1) && (b.context.cursorsuffix = "insertup"));
  };
  this.formulabuttons = {formulafunctions:{image:"insertformula.png", tooltip:"Functions", command:SocialCalc.SpreadsheetControl.DoFunctionList}, multilineinput:{image:"listbox.png", tooltip:"Multi-line Input Box", command:SocialCalc.SpreadsheetControl.DoMultiline}, link:{image:"inserthyperlink.png", tooltip:"Link Input Box", command:SocialCalc.SpreadsheetControl.DoLink}, sum:{image:"autosum.png", tooltip:"Auto Sum", command:SocialCalc.SpreadsheetControl.DoSum}};
  this.findbuttons = {last:{image:"upsearch.png", tooltip:"Find Previous", command:SocialCalc.SpreadsheetControl.SearchUp}, next:{image:"downsearch.png", tooltip:"Find Next", command:SocialCalc.SpreadsheetControl.SearchDown}};
  this.tabnums.edit = this.tabs.length;
  this.tabs.push({name:"edit", text:"Edit", html:' <div id="%id.edittools" style="padding:10px 0px 0px 0px;">&nbsp;<img id="%id.button_undo" src="%img.undo.png" style="vertical-align:bottom;"> <img id="%id.button_redo" src="%img.redo.png" style="vertical-align:bottom;"> &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; <img id="%id.button_copy" src="%img.copy.png" style="vertical-align:bottom;"> <img id="%id.button_cut" src="%img.cut.png" style="vertical-align:bottom;"> <img id="%id.button_paste" src="%img.paste.png" style="vertical-align:bottom;"> &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; <img id="%id.button_delete" src="%img.delete.png" style="vertical-align:bottom;"> <img id="%id.button_pasteformats" src="%img.formatpaintbrush.png" style="vertical-align:bottom;"> &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp;  <span id="%id.locktools"><img id="%id.button_lock" src="%img.lock.png" style="vertical-align:bottom;"> <img id="%id.button_unlock" src="%img.unlock.png" style="vertical-align:bottom;"> &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp;</span> <img id="%id.button_filldown" src="%img.filldown.png" style="vertical-align:bottom;"> <img id="%id.button_fillright" src="%img.fillright.png" style="vertical-align:bottom;"> &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; <img id="%id.button_movefrom" src="%img.movefromoff.gif" style="vertical-align:bottom;"> <img id="%id.button_movepaste" src="%img.movepasteoff.gif" style="vertical-align:bottom;"> <img id="%id.button_moveinsert" src="%img.moveinsertoff.gif" style="vertical-align:bottom;"> &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; <img id="%id.button_alignleft" src="%img.alignleft.png" style="vertical-align:bottom;"> <img id="%id.button_aligncenter" src="%img.aligncenter.png" style="vertical-align:bottom;"> <img id="%id.button_alignright" src="%img.alignright.png" style="vertical-align:bottom;"> &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; <img id="%id.button_borderon" src="%img.borderson.png" style="vertical-align:bottom;">  <img id="%id.button_borderoff" src="%img.bordersoff.png" style="vertical-align:bottom;">  <img id="%id.button_swapcolors" src="%img.swapcolors.png" style="vertical-align:bottom;">  &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; <img id="%id.button_merge" src="%img.mergecells.png" style="vertical-align:bottom;">  &nbsp;<img src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; <img id="%id.button_insertrow" src="%img.insertrows.png" style="vertical-align:bottom;">  <img id="%id.button_insertcol" src="%img.insertcolumns.png" style="vertical-align:bottom;">  <img id="%id.button_deleterow" src="%img.deleterows.png" style="vertical-align:bottom;">  <img id="%id.button_deletecol" src="%img.deletecolumns.png" style="vertical-align:bottom;">  <img id="%id.button_hiderow" src="%img.hiderow.png" style="vertical-align:bottom;">  <img id="%id.button_hidecol" src="%img.hidecol.png" style="vertical-align:bottom;">  &nbsp;<img id="%id.divider_recalc" src="%img.divider1.png" style="vertical-align:bottom;">&nbsp; <img id="%id.button_recalc" src="%img.recalc.png" style="vertical-align:bottom;">  </div>', 
  oncreate:null, onclick:null});
  this.tabnums.settings = this.tabs.length;
  this.tabs.push({name:"settings", text:"Format", html:'<div id="%id.settingstools" style="display:none;"> <div id="%id.sheetsettingstoolbar" style="display:none;">  <table cellspacing="0" cellpadding="0"><tr><td>   <div style="%tbt.">%loc!SHEET SETTINGS!:</div>   </td></tr><tr><td>   <input id="%id.settings-savesheet" type="button" value="%loc!Save!" onclick="SocialCalc.SettingsControlSave(\'sheet\');">   <input type="button" value="%loc!Cancel!" onclick="SocialCalc.SettingsControlSave(\'cancel\');">   <input type="button" value="%loc!Show Cell Settings!" onclick="SocialCalc.SpreadsheetControlSettingsSwitch(\'cell\');return false;">   </td></tr></table> </div> <div id="%id.cellsettingstoolbar" style="display:none;">  <table cellspacing="0" cellpadding="0"><tr><td>   <div style="%tbt.">%loc!CELL SETTINGS!: <span id="%id.settingsecell">&nbsp;</span></div>   </td></tr><tr><td>  <input id="%id.settings-savecell" type="button" value="%loc!Save!" onclick="SocialCalc.SettingsControlSave(\'cell\');">  <input type="button" value="%loc!Cancel!" onclick="SocialCalc.SettingsControlSave(\'cancel\');">  <input type="button" value="%loc!Show Sheet Settings!" onclick="SocialCalc.SpreadsheetControlSettingsSwitch(\'sheet\');return false;">  </td></tr></table> </div></div>', 
  view:"settings", onclick:function(a, b) {
    SocialCalc.SettingsControls.idPrefix = a.idPrefix;
    SocialCalc.SettingControlReset();
    var e = a.sheet.EncodeSheetAttributes(), f = a.sheet.EncodeCellAttributes(a.editor.ecell.coord);
    SocialCalc.SettingsControlLoadPanel(a.views.settings.values.sheetspanel, e);
    SocialCalc.SettingsControlLoadPanel(a.views.settings.values.cellspanel, f);
    document.getElementById(a.idPrefix + "settingsecell").innerHTML = a.editor.ecell.coord;
    SocialCalc.SpreadsheetControlSettingsSwitch("cell");
    a.views.settings.element.style.height = a.viewheight + "px";
    a.views.settings.element.firstChild.style.height = a.viewheight + "px";
    e = a.editor.range.hasrange ? SocialCalc.crToCoord(a.editor.range.left, a.editor.range.top) + ":" + SocialCalc.crToCoord(a.editor.range.right, a.editor.range.bottom) : a.editor.ecell.coord;
    document.getElementById(a.idPrefix + "settings-savecell").value = SocialCalc.LocalizeString("Save to") + ": " + e;
  }, onclickFocus:!0});
  this.views.settings = {name:"settings", values:{}, oncreate:function(a, b) {
    var e = SocialCalc.Constants;
    b.values.sheetspanel = {colorchooser:{id:a.idPrefix + "scolorchooser"}, formatnumber:{setting:"numberformat", type:"PopupList", id:a.idPrefix + "formatnumber", initialdata:e.SCFormatNumberFormats}, formattext:{setting:"textformat", type:"PopupList", id:a.idPrefix + "formattext", initialdata:e.SCFormatTextFormats}, fontfamily:{setting:"fontfamily", type:"PopupList", id:a.idPrefix + "fontfamily", initialdata:e.SCFormatFontfamilies}, fontlook:{setting:"fontlook", type:"PopupList", id:a.idPrefix + 
    "fontlook", initialdata:e.SCFormatFontlook}, fontsize:{setting:"fontsize", type:"PopupList", id:a.idPrefix + "fontsize", initialdata:e.SCFormatFontsizes}, textalignhoriz:{setting:"textalignhoriz", type:"PopupList", id:a.idPrefix + "textalignhoriz", initialdata:e.SCFormatTextAlignhoriz}, numberalignhoriz:{setting:"numberalignhoriz", type:"PopupList", id:a.idPrefix + "numberalignhoriz", initialdata:e.SCFormatNumberAlignhoriz}, alignvert:{setting:"alignvert", type:"PopupList", id:a.idPrefix + "alignvert", 
    initialdata:e.SCFormatAlignVertical}, textcolor:{setting:"textcolor", type:"ColorChooser", id:a.idPrefix + "textcolor"}, bgcolor:{setting:"bgcolor", type:"ColorChooser", id:a.idPrefix + "bgcolor"}, padtop:{setting:"padtop", type:"PopupList", id:a.idPrefix + "padtop", initialdata:e.SCFormatPadsizes}, padright:{setting:"padright", type:"PopupList", id:a.idPrefix + "padright", initialdata:e.SCFormatPadsizes}, padbottom:{setting:"padbottom", type:"PopupList", id:a.idPrefix + "padbottom", initialdata:e.SCFormatPadsizes}, 
    padleft:{setting:"padleft", type:"PopupList", id:a.idPrefix + "padleft", initialdata:e.SCFormatPadsizes}, colwidth:{setting:"colwidth", type:"PopupList", id:a.idPrefix + "colwidth", initialdata:e.SCFormatColwidth}, recalc:{setting:"recalc", type:"PopupList", id:a.idPrefix + "recalc", initialdata:e.SCFormatRecalc}, usermaxcol:{setting:"usermaxcol", type:"PopupList", id:a.idPrefix + "usermaxcol", initialdata:e.SCFormatUserMaxCol}, usermaxrow:{setting:"usermaxrow", type:"PopupList", id:a.idPrefix + 
    "usermaxrow", initialdata:e.SCFormatUserMaxRow}};
    b.values.cellspanel = {name:"cell", colorchooser:{id:a.idPrefix + "scolorchooser"}, cformatnumber:{setting:"numberformat", type:"PopupList", id:a.idPrefix + "cformatnumber", initialdata:e.SCFormatNumberFormats}, cformattext:{setting:"textformat", type:"PopupList", id:a.idPrefix + "cformattext", initialdata:e.SCFormatTextFormats}, cfontfamily:{setting:"fontfamily", type:"PopupList", id:a.idPrefix + "cfontfamily", initialdata:e.SCFormatFontfamilies}, cfontlook:{setting:"fontlook", type:"PopupList", 
    id:a.idPrefix + "cfontlook", initialdata:e.SCFormatFontlook}, cfontsize:{setting:"fontsize", type:"PopupList", id:a.idPrefix + "cfontsize", initialdata:e.SCFormatFontsizes}, calignhoriz:{setting:"alignhoriz", type:"PopupList", id:a.idPrefix + "calignhoriz", initialdata:e.SCFormatTextAlignhoriz}, calignvert:{setting:"alignvert", type:"PopupList", id:a.idPrefix + "calignvert", initialdata:e.SCFormatAlignVertical}, ctextcolor:{setting:"textcolor", type:"ColorChooser", id:a.idPrefix + "ctextcolor"}, 
    cbgcolor:{setting:"bgcolor", type:"ColorChooser", id:a.idPrefix + "cbgcolor"}, cbt:{setting:"bt", type:"BorderSide", id:a.idPrefix + "cbt"}, cbr:{setting:"br", type:"BorderSide", id:a.idPrefix + "cbr"}, cbb:{setting:"bb", type:"BorderSide", id:a.idPrefix + "cbb"}, cbl:{setting:"bl", type:"BorderSide", id:a.idPrefix + "cbl"}, cpadtop:{setting:"padtop", type:"PopupList", id:a.idPrefix + "cpadtop", initialdata:e.SCFormatPadsizes}, cpadright:{setting:"padright", type:"PopupList", id:a.idPrefix + 
    "cpadright", initialdata:e.SCFormatPadsizes}, cpadbottom:{setting:"padbottom", type:"PopupList", id:a.idPrefix + "cpadbottom", initialdata:e.SCFormatPadsizes}, cpadleft:{setting:"padleft", type:"PopupList", id:a.idPrefix + "cpadleft", initialdata:e.SCFormatPadsizes}};
    SocialCalc.SettingsControlInitializePanel(b.values.sheetspanel);
    SocialCalc.SettingsControlInitializePanel(b.values.cellspanel);
  }, replacements:{itemtitle:{regex:/\%itemtitle\./g, replacement:'style="padding:12px 10px 0px 10px;font-weight:bold;text-align:right;vertical-align:top;font-size:small;"'}, sectiontitle:{regex:/\%sectiontitle\./g, replacement:'style="padding:16px 10px 0px 0px;font-weight:bold;vertical-align:top;font-size:small;color:#C00;"'}, parttitle:{regex:/\%parttitle\./g, replacement:'style="font-weight:bold;font-size:x-small;padding:0px 0px 3px 0px;"'}, itembody:{regex:/\%itembody\./g, replacement:'style="padding:12px 0px 0px 0px;vertical-align:top;font-size:small;"'}, 
  bodypart:{regex:/\%bodypart\./g, replacement:'style="padding:0px 10px 0px 0px;font-size:small;vertical-align:top;"'}}, divStyle:"border:1px solid black;overflow:auto;", html:'<div id="%id.scolorchooser" style="display:none;position:absolute;z-index:20;"></div><table cellspacing="0" cellpadding="0"> <tr><td style="vertical-align:top;"><table id="%id.sheetsettingstable" style="display:none;" cellspacing="0" cellpadding="0"><tr> <td %itemtitle.><br>%loc!Default Format!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>%loc!Number!</div>     <span id="%id.formatnumber"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Text!</div>     <span id="%id.formattext"></span>    </td>   </tr></table> </td></tr><tr> <td %itemtitle.><br>%loc!Default Alignment!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>%loc!Text Horizontal!</div>     <span id="%id.textalignhoriz"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Number Horizontal!</div>     <span id="%id.numberalignhoriz"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Vertical!</div>     <span id="%id.alignvert"></span>    </td>   </tr></table> </td></tr><tr> <td %itemtitle.><br>%loc!Default Font!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>%loc!Family!</div>     <span id="%id.fontfamily"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Bold &amp; Italics!</div>     <span id="%id.fontlook"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Size!</div>     <span id="%id.fontsize"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Color!</div>     <div id="%id.textcolor"></div>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Background!</div>     <div id="%id.bgcolor"></div>    </td>   </tr></table> </td></tr><tr> <td %itemtitle.><br>%loc!Default Padding!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>%loc!Top!</div>     <span id="%id.padtop"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Right!</div>     <span id="%id.padright"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Bottom!</div>     <span id="%id.padbottom"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Left!</div>     <span id="%id.padleft"></span>    </td>   </tr></table> </td></tr><tr> <td %itemtitle.><br>%loc!Default Column Width!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>&nbsp;</div>     <span id="%id.colwidth"></span>    </td>   </tr></table> </td></tr><tr> <td %itemtitle.><br>%loc!Recalculation!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>&nbsp;</div>     <span id="%id.recalc"></span>    </td>   </tr></table> </td></tr><tr> <td %itemtitle.><br>%loc!Dimensions!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>%loc!Columns!</div>     <span id="%id.usermaxcol"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Rows!</div>     <span id="%id.usermaxrow"></span>    </td>   </tr></table> </td></tr></table><table id="%id.cellsettingstable" cellspacing="0" cellpadding="0"><tr> <td %itemtitle.><br>%loc!Format!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>%loc!Number!</div>     <span id="%id.cformatnumber"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Text!</div>     <span id="%id.cformattext"></span>    </td>   </tr></table> </td></tr><tr> <td %itemtitle.><br>%loc!Alignment!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>%loc!Horizontal!</div>     <span id="%id.calignhoriz"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Vertical!</div>     <span id="%id.calignvert"></span>    </td>   </tr></table> </td></tr><tr> <td %itemtitle.><br>%loc!Font!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>%loc!Family!</div>     <span id="%id.cfontfamily"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Bold &amp; Italics!</div>     <span id="%id.cfontlook"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Size!</div>     <span id="%id.cfontsize"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Color!</div>     <div id="%id.ctextcolor"></div>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Background!</div>     <div id="%id.cbgcolor"></div>    </td>   </tr></table> </td></tr><tr> <td %itemtitle.><br>%loc!Borders!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0">    <tr><td %bodypart. colspan="3"><div %parttitle.>%loc!Top Border!</div></td>     <td %bodypart. colspan="3"><div %parttitle.>%loc!Right Border!</div></td>     <td %bodypart. colspan="3"><div %parttitle.>%loc!Bottom Border!</div></td>     <td %bodypart. colspan="3"><div %parttitle.>%loc!Left Border!</div></td>    </tr><tr>    <td %bodypart.>     <input id="%id.cbt-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">    </td>    <td %bodypart.>     <div id="%id.cbt-color"></div>    </td>    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>    <td %bodypart.>     <input id="%id.cbr-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">    </td>    <td %bodypart.>     <div id="%id.cbr-color"></div>    </td>    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>    <td %bodypart.>     <input id="%id.cbb-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">    </td>    <td %bodypart.>     <div id="%id.cbb-color"></div>    </td>    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>    <td %bodypart.>     <input id="%id.cbl-onoff-bcb" onclick="SocialCalc.SettingsControlOnchangeBorder(this);" type="checkbox">    </td>    <td %bodypart.>     <div id="%id.cbl-color"></div>    </td>    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>   </tr></table> </td></tr><tr> <td %itemtitle.><br>%loc!Padding!:</td> <td %itembody.>   <table cellspacing="0" cellpadding="0"><tr>    <td %bodypart.>     <div %parttitle.>%loc!Top!</div>     <span id="%id.cpadtop"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Right!</div>     <span id="%id.cpadright"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Bottom!</div>     <span id="%id.cpadbottom"></span>    </td>    <td %bodypart.>     <div %parttitle.>%loc!Left!</div>     <span id="%id.cpadleft"></span>    </td>   </tr></table> </td></tr></table> </td><td style="vertical-align:top;padding:12px 0px 0px 12px;">  <div style="width:100px;height:100px;overflow:hidden;border:1px solid black;background-color:#EEE;padding:6px;">   <table cellspacing="0" cellpadding="0"><tr>    <td id="sample-text" style="height:100px;width:100px;"><div>%loc!This is a<br>sample!</div><div>-1234.5</div></td>   </tr></table>  </div> </td></tr></table><br>'};
  this.tabnums.sort = this.tabs.length;
  this.tabs.push({name:"sort", text:"Sort", html:' <div id="%id.sorttools" style="display:none;">  <table cellspacing="0" cellpadding="0"><tr>   <td style="vertical-align:top;padding-right:4px;width:160px;">    <div style="%tbt.">%loc!Set Cells To Sort!</div>    <select id="%id.sortlist" size="1" onfocus="%s.CmdGotFocus(this);"><option selected>[select range]</option><option value="all">Sort All</option></select>    <input type="button" value="%loc!OK!" onclick="%s.DoCmd(this, \'ok-setsort\');" style="font-size:x-small;">   </td>   <td style="vertical-align:middle;padding-right:16px;width:100px;text-align:right;">    <div style="%tbt.">&nbsp;</div>    <input type="button" id="%id.sortbutton" value="%loc!Sort Cells! A1:A1" onclick="%s.DoCmd(this, \'dosort\');" style="visibility:hidden;">   </td>   <td style="vertical-align:top;padding-right:16px;">    <table cellspacing="0" cellpadding="0"><tr>     <td style="vertical-align:top;">      <div style="%tbt.">%loc!Major Sort!</div>      <select id="%id.majorsort" size="1" onfocus="%s.CmdGotFocus(this);"></select>     </td><td>      <input type="radio" name="majorsort" id="%id.majorsortup" value="up" checked><span style="font-size:x-small;color:#555753;">%loc!Up!</span><br>      <input type="radio" name="majorsort" id="%id.majorsortdown" value="down"><span style="font-size:x-small;color:#555753;">%loc!Down!</span>     </td>    </tr></table>   </td>   <td style="vertical-align:top;padding-right:16px;">    <table cellspacing="0" cellpadding="0"><tr>     <td style="vertical-align:top;">      <div style="%tbt.">%loc!Minor Sort!</div>      <select id="%id.minorsort" size="1" onfocus="%s.CmdGotFocus(this);"></select>     </td><td>      <input type="radio" name="minorsort" id="%id.minorsortup" value="up" checked><span style="font-size:x-small;color:#555753;">%loc!Up!</span><br>      <input type="radio" name="minorsort" id="%id.minorsortdown" value="down"><span style="font-size:x-small;color:#555753;">%loc!Down!</span>     </td>    </tr></table>   </td>   <td style="vertical-align:top;padding-right:16px;">    <table cellspacing="0" cellpadding="0"><tr>     <td style="vertical-align:top;">      <div style="%tbt.">%loc!Last Sort!</div>      <select id="%id.lastsort" size="1" onfocus="%s.CmdGotFocus(this);"></select>     </td><td>      <input type="radio" name="lastsort" id="%id.lastsortup" value="up" checked><span style="font-size:x-small;color:#555753;">%loc!Up!</span><br>      <input type="radio" name="lastsort" id="%id.lastsortdown" value="down"><span style="font-size:x-small;color:#555753;">%loc!Down!</span>     </td>    </tr></table>   </td>  </tr></table> </div>', 
  onclick:SocialCalc.SpreadsheetControlSortOnclick});
  this.editor.SettingsCallbacks.sort = {save:SocialCalc.SpreadsheetControlSortSave, load:SocialCalc.SpreadsheetControlSortLoad};
  this.tabnums.audit = this.tabs.length;
  this.tabs.push({name:"audit", text:"Audit", html:'<div id="%id.audittools" style="display:none;"> <div style="%tbt.">&nbsp;</div></div>', view:"audit", onclick:function(a, b) {
    var e = SocialCalc.LocalizeString, f, g, h = '<table cellspacing="0" cellpadding="0" style="margin-bottom:10px;"><tr><td style="font-size:small;padding:6px;"><b>' + e("Audit Trail This Session") + ":</b><br><br>", l = a.sheet.changes.stack, n = a.sheet.changes.tos;
    for (f = 0;f < l.length;f++) {
      for (f == n + 1 && (h += '<br></td></tr><tr><td style="font-size:small;background-color:#EEE;padding:6px;">' + e("UNDONE STEPS") + ":<br>"), g = 0;g < l[f].command.length;g++) {
        h += SocialCalc.special_chars(l[f].command[g]) + "<br>";
      }
    }
    var p = function(a) {
      if ("string" == typeof a) {
        return a;
      }
      if (!a) {
        return "null";
      }
      if ("object" == typeof a) {
        p.check || (p.check = []);
        for (var b = 0, c = p.check.length;b < c;++b) {
          if (p.check[b] == a) {
            return "{}";
          }
        }
        p.check.push(a);
      }
      var c = "", b = "undefined" == typeof a.length ? 1 : 0, d = "", e;
      for (e in a) {
        b && (c = "'" + e + "':"), d = "string" == typeof a[e] ? d + (c + "'" + a[e] + "',") : "object" == typeof a[e] ? d + (c + p(a[e]) + ",") : d + (c + a[e] + ",");
      }
      "object" == typeof a && p.check.pop();
      return b ? "{" + d.slice(0, -1) + "}" : "[" + d.slice(0, -1) + "]";
    };
    if ("undefined" != typeof SocialCalc.debug_log) {
      for (var r in SocialCalc.debug_log) {
        h += p(SocialCalc.debug_log[r]) + "<br>";
      }
    }
    a.views.audit.element.innerHTML = h + "</td></tr></table>";
    SocialCalc.CmdGotFocus(!0);
  }, onclickFocus:!0});
  this.views.audit = {name:"audit", divStyle:"border:1px solid black;overflow:auto;", html:"Audit Trail"};
  this.tabnums.comment = this.tabs.length;
  this.tabs.push({name:"comment", text:"Comment", html:'<div id="%id.commenttools" style="display:none;"><table cellspacing="0" cellpadding="0"><tr><td><textarea id="%id.commenttext" style="font-size:small;height:32px;width:600px;overflow:auto;" onfocus="%s.CmdGotFocus(this);"></textarea></td><td style="vertical-align:top;">&nbsp;<input type="button" value="%loc!Save!" onclick="%s.SpreadsheetControlCommentSet();" style="font-size:x-small;"></td></tr></table></div>', view:"sheet", onclick:SocialCalc.SpreadsheetControlCommentOnclick, 
  onunclick:SocialCalc.SpreadsheetControlCommentOnunclick});
  this.tabnums.names = this.tabs.length;
  this.tabs.push({name:"names", text:"Names", html:'<div id="%id.namestools" style="display:none;">  <table cellspacing="0" cellpadding="0"><tr>   <td style="vertical-align:top;padding-right:24px;">    <div style="%tbt.">%loc!Existing Names!</div>    <select id="%id.nameslist" size="1" onchange="%s.SpreadsheetControlNamesChangedName();" onfocus="%s.CmdGotFocus(this);"><option selected>[New]</option></select>   </td>   <td style="vertical-align:top;padding-right:6px;">    <div style="%tbt.">%loc!Name!</div>    <input type="text" id="%id.namesname" style="font-size:x-small;width:75px;" onfocus="%s.CmdGotFocus(this);">   </td>   <td style="vertical-align:top;padding-right:6px;">    <div style="%tbt.">%loc!Description!</div>    <input type="text" id="%id.namesdesc" style="font-size:x-small;width:150px;" onfocus="%s.CmdGotFocus(this);">   </td>   <td style="vertical-align:top;padding-right:6px;">    <div style="%tbt.">%loc!Value!</div>    <input type="text" id="%id.namesvalue" width="16" style="font-size:x-small;width:100px;" onfocus="%s.CmdGotFocus(this);">   </td>   <td style="vertical-align:top;padding-right:12px;width:100px;">    <div style="%tbt.">%loc!Set Value To!</div>    <input type="button" id="%id.namesrangeproposal" value="A1" onclick="%s.SpreadsheetControlNamesSetValue();" style="font-size:x-small;">   </td>   <td style="vertical-align:top;padding-right:6px;">    <div style="%tbt.">&nbsp;</div>    <input type="button" value="%loc!Save!" onclick="%s.SpreadsheetControlNamesSave();" style="font-size:x-small;">    <input type="button" value="%loc!Delete!" onclick="%s.SpreadsheetControlNamesDelete()" style="font-size:x-small;">   </td>  </tr></table></div>', 
  view:"sheet", onclick:SocialCalc.SpreadsheetControlNamesOnclick, onunclick:SocialCalc.SpreadsheetControlNamesOnunclick});
  this.tabnums.clipboard = this.tabs.length;
  this.tabs.push({name:"clipboard", text:"Clipboard", html:'<div id="%id.clipboardtools" style="display:none;">  <table cellspacing="0" cellpadding="0"><tr>   <td style="vertical-align:top;padding-right:24px;">    <div style="%tbt.">     &nbsp;    </div>   </td>  </tr></table></div>', view:"clipboard", onclick:SocialCalc.SpreadsheetControlClipboardOnclick, onclickFocus:"clipboardtext"});
  this.views.clipboard = {name:"clipboard", divStyle:"overflow:auto;", html:' <div style="font-size:x-small;padding:5px 0px 10px 0px;">  <b>%loc!Display Clipboard in!:</b>  <input type="radio" id="%id.clipboardformat-tab" name="%id.clipboardformat" checked onclick="%s.SpreadsheetControlClipboardFormat(\'tab\');"> %loc!Tab-delimited format! &nbsp;  <input type="radio" id="%id.clipboardformat-csv" name="%id.clipboardformat" onclick="%s.SpreadsheetControlClipboardFormat(\'csv\');"> %loc!CSV format! &nbsp;  <input type="radio" id="%id.clipboardformat-scsave" name="%id.clipboardformat" onclick="%s.SpreadsheetControlClipboardFormat(\'scsave\');"> %loc!SocialCalc-save format! </div> <input type="button" value="%loc!Load SocialCalc Clipboard With This!" style="font-size:x-small;" onclick="%s.SpreadsheetControlClipboardLoad();">&nbsp;  <input type="button" value="%loc!Clear SocialCalc Clipboard!" style="font-size:x-small;" onclick="%s.SpreadsheetControlClipboardClear();">&nbsp;  <br> <textarea id="%id.clipboardtext" style="font-size:small;height:350px;width:800px;overflow:auto;" onfocus="%s.CmdGotFocus(this);"></textarea>'};
};
SocialCalc.SpreadsheetControl.prototype.InitializeSpreadsheetControl = function(a, b, c, d) {
  return SocialCalc.InitializeSpreadsheetControl(this, a, b, c, d);
};
SocialCalc.SpreadsheetControl.prototype.DoOnResize = function() {
  return SocialCalc.DoOnResize(this);
};
SocialCalc.SpreadsheetControl.prototype.SizeSSDiv = function() {
  return SocialCalc.SizeSSDiv(this);
};
SocialCalc.SpreadsheetControl.prototype.ExecuteCommand = function(a, b) {
  return SocialCalc.SpreadsheetControlExecuteCommand(this, a, b);
};
SocialCalc.SpreadsheetControl.prototype.CreateSheetHTML = function() {
  return SocialCalc.SpreadsheetControlCreateSheetHTML(this);
};
SocialCalc.SpreadsheetControl.prototype.CreateSpreadsheetSave = function(a) {
  return SocialCalc.SpreadsheetControlCreateSpreadsheetSave(this, a);
};
SocialCalc.SpreadsheetControl.prototype.DecodeSpreadsheetSave = function(a) {
  return SocialCalc.SpreadsheetControlDecodeSpreadsheetSave(this, a);
};
SocialCalc.SpreadsheetControl.prototype.CreateCellHTML = function(a) {
  return SocialCalc.SpreadsheetControlCreateCellHTML(this, a);
};
SocialCalc.SpreadsheetControl.prototype.CreateCellHTMLSave = function(a) {
  return SocialCalc.SpreadsheetControlCreateCellHTMLSave(this, a);
};
SocialCalc.SpreadsheetControl.prototype.ParseSheetSave = function(a) {
  return this.sheet.ParseSheetSave(a);
};
SocialCalc.SpreadsheetControl.prototype.CreateSheetSave = function() {
  return this.sheet.CreateSheetSave();
};
SocialCalc.InitializeSpreadsheetControl = function(a, b, c, d, e) {
  var f = SocialCalc.Constants, g = SocialCalc.LocalizeString, h = SocialCalc.LocalizeSubstrings, l, n, p, r = a.tabs, s = a.views;
  a.requestedHeight = c;
  a.requestedWidth = d;
  a.requestedSpaceBelow = e;
  "string" == typeof b && (b = document.getElementById(b));
  null == b && alert("SocialCalc.SpreadsheetControl not given parent node.");
  a.parentNode = b;
  a.spreadsheetDiv = document.createElement("div");
  a.SizeSSDiv();
  for (c = b.firstChild;null != c;c = b.firstChild) {
    b.removeChild(c);
  }
  c = '<div><div style="' + a.toolbarbackground + 'padding:12px 10px 10px 4px;height:40px;">';
  for (d = 0;d < r.length;d++) {
    c += r[d].html;
  }
  c += '</div><div style="' + a.tabbackground + 'margin:0px 0px 8px 0px;"><table cellpadding="0" cellspacing="0"><tr>';
  for (d = 0;d < r.length;d++) {
    c += '  <td id="%id.' + r[d].name + 'tab" style="' + (0 == d ? a.tabselectedCSS : a.tabplainCSS) + '" onclick="%s.SetTab(this);">' + g(r[d].text) + "</td>";
  }
  c += " </tr></table></div></div>";
  a.currentTab = 0;
  for (n in a.tabreplacements) {
    c = c.replace(a.tabreplacements[n].regex, a.tabreplacements[n].replacement);
  }
  c = c.replace(/\%s\./g, "SocialCalc.");
  c = c.replace(/\%id\./g, a.idPrefix);
  c = c.replace(/\%tbt\./g, a.toolbartext);
  c = c.replace(/\%img\./g, a.imagePrefix);
  c = h(c);
  a.spreadsheetDiv.innerHTML = c;
  b.appendChild(a.spreadsheetDiv);
  a.Buttons = {button_undo:{tooltip:"Undo", command:"undo"}, button_redo:{tooltip:"Redo", command:"redo"}, button_copy:{tooltip:"Copy", command:"copy"}, button_cut:{tooltip:"Cut", command:"cut"}, button_paste:{tooltip:"Paste", command:"paste"}, button_pasteformats:{tooltip:"Paste Formats", command:"pasteformats"}, button_lock:{tooltip:"Lock Cell", command:"lock"}, button_unlock:{tooltip:"Unlock Cell", command:"unlock"}, button_delete:{tooltip:"Delete Cell Contents", command:"delete"}, button_filldown:{tooltip:"Fill Down", 
  command:"filldown"}, button_fillright:{tooltip:"Fill Right", command:"fillright"}, button_movefrom:{tooltip:"Set/Clear Move From", command:"movefrom"}, button_movepaste:{tooltip:"Move Paste", command:"movepaste"}, button_moveinsert:{tooltip:"Move Insert", command:"moveinsert"}, button_alignleft:{tooltip:"Align Left", command:"align-left"}, button_aligncenter:{tooltip:"Align Center", command:"align-center"}, button_alignright:{tooltip:"Align Right", command:"align-right"}, button_borderon:{tooltip:"Borders On", 
  command:"borderon"}, button_borderoff:{tooltip:"Borders Off", command:"borderoff"}, button_swapcolors:{tooltip:"Swap Colors", command:"swapcolors"}, button_merge:{tooltip:"Merge/Unmerge Cells", command:"merge"}, button_insertrow:{tooltip:"Insert Row Before", command:"insertrow"}, button_insertcol:{tooltip:"Insert Column Before", command:"insertcol"}, button_deleterow:{tooltip:"Delete Row", command:"deleterow"}, button_deletecol:{tooltip:"Delete Column", command:"deletecol"}, button_hiderow:{tooltip:"Hide Row", 
  command:"hiderow"}, button_hidecol:{tooltip:"Hide Column", command:"hidecol"}, button_recalc:{tooltip:"Recalculate", command:"recalc"}};
  for (p in a.Buttons) {
    (b = document.getElementById(a.idPrefix + p)) ? (b.style.border = "1px solid " + f.ISCButtonBorderNormal, SocialCalc.TooltipRegister(b, g(a.Buttons[p].tooltip), {}, a.spreadsheetDiv), SocialCalc.ButtonRegister(a.editor, b, {normalstyle:"border:1px solid " + f.ISCButtonBorderNormal + ";backgroundColor:" + f.ISCButtonBorderNormal + ";", hoverstyle:"border:1px solid " + f.ISCButtonBorderHover + ";backgroundColor:" + f.ISCButtonBorderNormal + ";", downstyle:"border:1px solid " + f.ISCButtonBorderDown + 
    ";backgroundColor:" + f.ISCButtonDownBackground + ";"}, {MouseDown:SocialCalc.DoButtonCmd, command:a.Buttons[p].command})) : alert("Button " + (a.idPrefix + p) + " missing");
  }
  a.formulabarDiv = document.createElement("div");
  a.formulabarDiv.style.height = a.formulabarheight + "px";
  a.formulabarDiv.innerHTML = '<input type="text" size="60" value="">&nbsp;';
  a.spreadsheetDiv.appendChild(a.formulabarDiv);
  new SocialCalc.InputBox(a.formulabarDiv.firstChild, a.editor);
  for (p in a.formulabuttons) {
    b = document.createElement("img"), b.id = a.idPrefix + p, b.src = (a.formulabuttons[p].skipImagePrefix ? "" : a.imagePrefix) + a.formulabuttons[p].image, b.style.verticalAlign = "middle", b.style.border = "1px solid #FFF", b.style.marginLeft = "4px", SocialCalc.TooltipRegister(b, g(a.formulabuttons[p].tooltip), {}, a.spreadsheetDiv), SocialCalc.ButtonRegister(a.editor, b, {normalstyle:"border:1px solid #FFF;backgroundColor:#FFF;", hoverstyle:"border:1px solid #CCC;backgroundColor:#FFF;", downstyle:"border:1px solid #000;backgroundColor:#FFF;"}, 
    {MouseDown:a.formulabuttons[p].command, Disabled:function() {
      return a.editor.ECellReadonly();
    }}), a.formulabarDiv.appendChild(b);
  }
  f = $("<input id='searchbarinput' value='' placeholder='Search sheet\u2026'>");
  c = $("<span id='searchbar'></span>");
  c.append("<div id='searchstatus'></div>");
  c.append(f);
  for (p in a.findbuttons) {
    b = document.createElement("img"), b.id = a.idPrefix + p, b.src = a.imagePrefix + a.findbuttons[p].image, b.style.verticalAlign = "middle", b.style.border = "1px solid #FFF", SocialCalc.TooltipRegister(b, g(a.findbuttons[p].tooltip), {}, a.formulabardiv), SocialCalc.ButtonRegister(a.editor, b, {normalstyle:"border:1px solid #FFF;backgroundColor:#FFF;", hoverstyle:"border:1px solid #CCC;backgroundColor:#FFF;", downstyle:"border:1px solid #000;backgroundColor:#FFF;"}, {MouseDown:a.findbuttons[p].command, 
    Disabled:function() {
      return!1;
    }}), c[0].appendChild(b);
  }
  f.on("input", SocialCalc.SpreadsheetControl.FindInSheet);
  f.on("focus", function() {
    SocialCalc.Keyboard.passThru = !0;
  });
  f.on("blur", function() {
    SocialCalc.Keyboard.passThru = !1;
  });
  f.keyup(function(a) {
    13 == a.keyCode && (a.shiftKey ? SocialCalc.SpreadsheetControl.SearchUp() : SocialCalc.SpreadsheetControl.SearchDown());
  });
  a.formulabarDiv.appendChild(c[0]);
  for (d = 0;d < r.length;d++) {
    if (r[d].oncreate) {
      r[d].oncreate(a, r[d].name);
    }
  }
  SocialCalc.CalculateSheetNonViewHeight(a);
  a.viewheight = a.height - a.nonviewheight;
  a.editorDiv = a.editor.CreateTableEditor(a.width, a.viewheight);
  g = document.createElement("div");
  g.id = "te_appView";
  g.appendChild(a.editorDiv);
  a.editorDiv = g;
  g = document.createElement("div");
  g.id = "te_formData";
  g.style.display = "none";
  a.editorDiv.appendChild(g);
  a.spreadsheetDiv.appendChild(a.editorDiv);
  a.formDataViewer = new SocialCalc.SpreadsheetViewer("te_FormData-");
  a.formDataViewer.InitializeSpreadsheetViewer(g.id, 180, 0, 200);
  for (l in s) {
    c = s[l].html;
    for (n in s[l].replacements) {
      c = c.replace(s[l].replacements[n].regex, s[l].replacements[n].replacement);
    }
    c = c.replace(/\%s\./g, "SocialCalc.");
    c = c.replace(/\%id\./g, a.idPrefix);
    c = c.replace(/\%tbt\./g, a.toolbartext);
    c = c.replace(/\%img\./g, a.imagePrefix);
    g = document.createElement("div");
    SocialCalc.setStyles(g, s[l].divStyle);
    g.style.display = "none";
    g.style.width = a.width + "px";
    g.style.height = a.viewheight + "px";
    g.id = a.idPrefix + s[l].name + "view";
    c = h(c);
    g.innerHTML = c;
    a.spreadsheetDiv.appendChild(g);
    s[l].element = g;
    if (s[l].oncreate) {
      s[l].oncreate(a, s[l]);
    }
  }
  s.sheet = {name:"sheet", element:a.editorDiv};
  a.statuslineDiv = document.createElement("div");
  a.statuslineDiv.style.cssText = a.statuslineCSS;
  a.statuslineDiv.style.height = a.statuslineheight - (a.statuslineDiv.style.paddingTop.slice(0, -2) - 0) - (a.statuslineDiv.style.paddingBottom.slice(0, -2) - 0) + "px";
  a.statuslineDiv.id = a.idPrefix + "statusline";
  a.spreadsheetDiv.appendChild(a.statuslineDiv);
  if (a.spreadsheetDiv.addEventListener) {
    a.spreadsheetDiv.addEventListener("mousedown", function() {
      SocialCalc.SetSpreadsheetControlObject(a);
    }, !1), a.spreadsheetDiv.addEventListener("mouseover", function() {
      SocialCalc.SetSpreadsheetControlObject(a);
    }, !1);
  } else {
    if (a.spreadsheetDiv.attachEvent) {
      a.spreadsheetDiv.attachEvent("onmousedown", function() {
        SocialCalc.SetSpreadsheetControlObject(a);
      }), a.spreadsheetDiv.attachEvent("onmouseover", function() {
        SocialCalc.SetSpreadsheetControlObject(a);
      });
    } else {
      throw SocialCalc.Constants.s_BrowserNotSupported;
    }
  }
};
SocialCalc.CalculateSheetNonViewHeight = function(a) {
  a.nonviewheight = a.statuslineheight;
  for (var b = 0;b < a.spreadsheetDiv.childNodes.length;b++) {
    "SocialCalc-statusline" != a.spreadsheetDiv.childNodes[b].id && (a.nonviewheight += a.spreadsheetDiv.childNodes[b].offsetHeight);
  }
};
SocialCalc.LocalizeString = function(a) {
  var b = SocialCalc.LocalizeStringList[a];
  b || (b = SocialCalc.Constants["s_loc_" + a.toLowerCase().replace(/\s/g, "_").replace(/\W/g, "X")] || a, SocialCalc.LocalizeStringList[a] = b);
  return b;
};
SocialCalc.LocalizeStringList = {};
SocialCalc.LocalizeSubstrings = function(a) {
  var b = SocialCalc.LocalizeString;
  return a.replace(/%(loc|ssc)!(.*?)!/g, function(a, d, e) {
    return "ssc" == d ? SocialCalc.Constants[e] || alert("Missing constant: " + e) : b(e);
  });
};
SocialCalc.GetSpreadsheetControlObject = function() {
  var a = null != SocialCalc.CurrentSpreadsheetControlObject ? SocialCalc.CurrentSpreadsheetControlObject : SocialCalc.CurrentSpreadsheetViewerObject;
  if (a) {
    return a;
  }
};
SocialCalc.SetSpreadsheetControlObject = function(a) {
  SocialCalc.CurrentSpreadsheetControlObject = a;
  SocialCalc.Keyboard.focusTable && a && (SocialCalc.Keyboard.focusTable = a.editor);
};
SocialCalc.DoOnResize = function(a) {
  var b, c = a.views;
  if (a.SizeSSDiv()) {
    for (vname in c) {
      b = c[vname].element, b.style.width = a.width + "px", b.style.height = a.height - a.nonviewheight + "px";
    }
    a.editor.ResizeTableEditor(a.width, a.height - a.nonviewheight);
  }
};
SocialCalc.SizeSSDiv = function(a) {
  var b, c, d, e;
  d = !1;
  b = SocialCalc.GetViewportInfo();
  c = SocialCalc.GetElementPosition(a.parentNode);
  c.bottom = 0;
  c.right = 0;
  e = a.parentNode.style;
  e.marginTop && (c.top += e.marginTop.slice(0, -2) - 0);
  e.marginBottom && (c.bottom += e.marginBottom.slice(0, -2) - 0);
  e.marginLeft && (c.left += e.marginLeft.slice(0, -2) - 0);
  e.marginRight && (c.right += e.marginRight.slice(0, -2) - 0);
  e = a.requestedHeight || b.height - (c.top + c.bottom + 10) - (a.requestedSpaceBelow || 0);
  a.height != e && (a.height = e, a.spreadsheetDiv.style.height = e + "px", d = !0);
  e = a.requestedWidth || b.width - (c.left + c.right + 10) || 700;
  a.width != e && (a.width = e, a.spreadsheetDiv.style.width = e + "px", d = !0);
  a.spreadsheetDiv.style.position = "relative";
  return d;
};
SocialCalc.SetTab = function(a) {
  var b, c, d, e, f, g = {}, h = {}, l = SocialCalc.GetSpreadsheetControlObject(), n = l.tabs, p = l.views;
  a = "string" == typeof a ? a : a.id.slice(l.idPrefix.length, -3);
  if (l.editor.busy && (!n[l.currentTab].view || "sheet" == n[l.currentTab].view)) {
    for (e = 0;e < n.length;e++) {
      if (n[e].name == a && n[e].view && "sheet" != n[e].view) {
        return;
      }
    }
  }
  if (l.tabs[l.currentTab].onunclick) {
    l.tabs[l.currentTab].onunclick(l, l.tabs[l.currentTab].name);
  }
  for (e = 0;e < n.length;e++) {
    b = n[e].name, g[b] = document.getElementById(l.idPrefix + b + "tab"), h[b] = document.getElementById(l.idPrefix + b + "tools"), b == a ? (c = e, h[b].style.display = "block", g[b].style.cssText = l.tabselectedCSS) : (h[b].style.display = "none", g[b].style.cssText = l.tabplainCSS);
  }
  l.currentTab = c;
  if (n[c].onclick) {
    n[c].onclick(l, a);
  }
  for (f in p) {
    !n[c].view && "sheet" == f || n[c].view == f ? (p[f].element.style.display = "block", d = f) : p[f].element.style.display = "none";
  }
  n[c].onclickFocus ? (c = n[c].onclickFocus, "string" == typeof c && (c = document.getElementById(l.idPrefix + c), c.focus()), SocialCalc.CmdGotFocus(c)) : SocialCalc.KeyboardFocus();
  p[d].needsresize && p[d].onresize && (p[d].needsresize = !1, p[d].onresize(l, p[d]));
  "sheet" == d ? (l.statuslineDiv.style.display = "block", l.editor.ScheduleRender()) : l.statuslineDiv.style.display = "none";
};
SocialCalc.SpreadsheetControlStatuslineCallback = function(a, b, c, d) {
  var e = document.getElementById(d.statuslineid);
  e && (e.innerHTML = a.GetStatuslineString(b, c, d));
  switch(b) {
    case "cmdendnorender":
    ;
    case "calcfinished":
    ;
    case "doneposcalc":
      b = document.getElementById(d.recalcid1);
      d = document.getElementById(d.recalcid2);
      if (!b || !d) {
        break;
      }
      "yes" == a.context.sheetobj.attribs.needsrecalc ? (b.style.display = "inline", d.style.display = "inline") : (b.style.display = "none", d.style.display = "none");
  }
};
SocialCalc.UpdateSortRangeProposal = function(a) {
  document.getElementById(SocialCalc.GetSpreadsheetControlObject().idPrefix + "sortlist").options[0].text = a.range.hasrange ? SocialCalc.crToCoord(a.range.left, a.range.top) + ":" + SocialCalc.crToCoord(a.range.right, a.range.bottom) : SocialCalc.LocalizeString("[select range]");
};
SocialCalc.LoadColumnChoosers = function(a) {
  var b = SocialCalc.LocalizeString, c, d, e, f;
  a.sortrange && -1 == a.sortrange.indexOf(":") ? (c = SocialCalc.Formula.LookupName(a.sheet, a.sortrange || ""), "range" == c.type ? (c = c.value.match(/^(.*)\|(.*)\|$/), c = c[1] + ":" + c[2]) : c = "A1:A1") : c = a.sortrange;
  var g = SocialCalc.ParseRange(c);
  e = document.getElementById(a.idPrefix + "majorsort");
  f = e.selectedIndex;
  e.options.length = 0;
  e.options[e.options.length] = new Option(b("[None]"), "");
  for (c = g.cr1.col;c <= g.cr2.col;c++) {
    d = SocialCalc.rcColname(c), e.options[e.options.length] = new Option(b("Column ") + d, d);
  }
  e.selectedIndex = 1 < f && f <= g.cr2.col - g.cr1.col + 1 ? f : 1;
  e = document.getElementById(a.idPrefix + "minorsort");
  f = e.selectedIndex;
  e.options.length = 0;
  e.options[e.options.length] = new Option(b("[None]"), "");
  for (c = g.cr1.col;c <= g.cr2.col;c++) {
    d = SocialCalc.rcColname(c), e.options[e.options.length] = new Option(d, d);
  }
  e.selectedIndex = 0 < f && f <= g.cr2.col - g.cr1.col + 1 ? f : 0;
  e = document.getElementById(a.idPrefix + "lastsort");
  f = e.selectedIndex;
  e.options.length = 0;
  e.options[e.options.length] = new Option(b("[None]"), "");
  for (c = g.cr1.col;c <= g.cr2.col;c++) {
    d = SocialCalc.rcColname(c), e.options[e.options.length] = new Option(d, d);
  }
  e.selectedIndex = 0 < f && f <= g.cr2.col - g.cr1.col + 1 ? f : 0;
};
SocialCalc.CmdGotFocus = function(a) {
  SocialCalc.Keyboard.passThru = a;
};
SocialCalc.DoButtonCmd = function(a, b, c) {
  SocialCalc.DoCmd(c.element, c.functionobj.command);
};
SocialCalc.DoCmd = function(a, b) {
  var c, d, e, f, g, h;
  f = SocialCalc.GetSpreadsheetControlObject();
  e = f.editor;
  switch(b) {
    case "undo":
      f.ExecuteCommand("undo", "");
      break;
    case "redo":
      f.ExecuteCommand("redo", "");
      break;
    case "fill-rowcolstuff":
    ;
    case "fill-text":
      c = b.substring(5);
      e = document.getElementById(f.idPrefix + c + "list");
      for (d = e.length = 0;d < SocialCalc.SpreadsheetCmdTable[c].length;d++) {
        e.options[d] = new Option(SocialCalc.SpreadsheetCmdTable[c][d].t);
      }
      b = "changed-" + c;
    case "changed-rowcolstuff":
    ;
    case "changed-text":
      c = b.substring(8);
      e = document.getElementById(f.idPrefix + c + "list");
      e = SocialCalc.SpreadsheetCmdTable.slists[SocialCalc.SpreadsheetCmdTable[c][e.selectedIndex].s];
      f = document.getElementById(f.idPrefix + c + "slist");
      for (d = f.length = 0;d < (e.length || 0);d++) {
        f.options[d] = new Option(e[d].t, e[d].s);
      }
      return;
    case "ok-rowcolstuff":
    ;
    case "ok-text":
      c = b.substring(3);
      e = document.getElementById(f.idPrefix + c + "list");
      f = document.getElementById(f.idPrefix + c + "slist");
      c = SocialCalc.SpreadsheetCmdTable[c][e.selectedIndex].c;
      d = f[f.selectedIndex].value;
      SocialCalc.SpreadsheetControlExecuteCommand(a, c, d);
      break;
    case "ok-setsort":
      c = document.getElementById(f.idPrefix + "sortlist");
      if (0 == c.selectedIndex) {
        f.sortrange = e.range.hasrange ? SocialCalc.crToCoord(e.range.left, e.range.top) + ":" + SocialCalc.crToCoord(e.range.right, e.range.bottom) : e.ecell.coord + ":" + e.ecell.coord;
      } else {
        if ("all" == c.options[c.selectedIndex].value) {
          var l = f.sheet.cells, n = h = g = e = -1;
          for (d in l) {
            l = SocialCalc.coordToCr(d);
            if (-1 == h || l.row < h) {
              h = l.row;
            }
            if (-1 == e || l.col < e) {
              e = l.col;
            }
            if (-1 == n || l.row > n) {
              n = l.row;
            }
            if (-1 == g || l.col > g) {
              g = l.col;
            }
          }
          f.sortrange = SocialCalc.crToCoord(e, h) + ":" + SocialCalc.crToCoord(g, n);
          c.options[c.selectedIndex].text += " (" + f.sortrange + ")";
        } else {
          f.sortrange = c.options[c.selectedIndex].value;
        }
      }
      d = document.getElementById(f.idPrefix + "sortbutton");
      d.value = SocialCalc.LocalizeString("Sort ") + f.sortrange;
      d.style.visibility = "visible";
      SocialCalc.LoadColumnChoosers(f);
      a && a.blur && a.blur();
      SocialCalc.KeyboardFocus();
      return;
    case "dosort":
      if (f.sortrange && -1 == f.sortrange.indexOf(":")) {
        c = SocialCalc.Formula.LookupName(f.sheet, f.sortrange || "");
        if ("range" != c.type) {
          return;
        }
        c = c.value.match(/^(.*)\|(.*)\|$/);
        c = c[1] + ":" + c[2];
      } else {
        c = f.sortrange;
      }
      if ("A1:A1" == c) {
        return;
      }
      c = "sort " + c + " ";
      d = document.getElementById(f.idPrefix + "majorsort");
      e = document.getElementById(f.idPrefix + "majorsortup");
      c += d.options[d.selectedIndex].value + (e.checked ? " up" : " down");
      d = document.getElementById(f.idPrefix + "minorsort");
      0 < d.selectedIndex && (e = document.getElementById(f.idPrefix + "minorsortup"), c += " " + d.options[d.selectedIndex].value + (e.checked ? " up" : " down"));
      d = document.getElementById(f.idPrefix + "lastsort");
      0 < d.selectedIndex && (e = document.getElementById(f.idPrefix + "lastsortup"), c += " " + d.options[d.selectedIndex].value + (e.checked ? " up" : " down"));
      f.ExecuteCommand(c, "");
      break;
    case "merge":
      c = SocialCalc.SpreadsheetCmdLookup[b] || "";
      d = SocialCalc.SpreadsheetCmdSLookup[b] || "";
      f.ExecuteCommand(c, d);
      e.range.hasrange && (e.MoveECell(SocialCalc.crToCoord(e.range.left, e.range.top)), e.RangeRemove());
      break;
    case "movefrom":
      e.range2.hasrange ? (f.context.cursorsuffix = "", e.Range2Remove(), f.ExecuteCommand("redisplay", "")) : e.range.hasrange ? (e.range2.top = e.range.top, e.range2.right = e.range.right, e.range2.bottom = e.range.bottom, e.range2.left = e.range.left, e.range2.hasrange = !0, e.MoveECell(SocialCalc.crToCoord(e.range.left, e.range.top))) : (e.range2.top = e.ecell.row, e.range2.right = e.ecell.col, e.range2.bottom = e.ecell.row, e.range2.left = e.ecell.col, e.range2.hasrange = !0);
      c = e.range2.hasrange ? "" : "off";
      d = document.getElementById(f.idPrefix + "button_movefrom");
      d.src = f.imagePrefix + "movefrom" + c + ".gif";
      d = document.getElementById(f.idPrefix + "button_movepaste");
      d.src = f.imagePrefix + "movepaste" + c + ".gif";
      d = document.getElementById(f.idPrefix + "button_moveinsert");
      d.src = f.imagePrefix + "moveinsert" + c + ".gif";
      e.range2.hasrange && e.RangeRemove();
      break;
    case "movepaste":
    ;
    case "moveinsert":
      e.range2.hasrange && (f.context.cursorsuffix = "", c = b + " " + SocialCalc.crToCoord(e.range2.left, e.range2.top) + ":" + SocialCalc.crToCoord(e.range2.right, e.range2.bottom) + " " + e.ecell.coord, f.ExecuteCommand(c, ""), e.Range2Remove(), d = document.getElementById(f.idPrefix + "button_movefrom"), d.src = f.imagePrefix + "movefromoff.gif", d = document.getElementById(f.idPrefix + "button_movepaste"), d.src = f.imagePrefix + "movepasteoff.gif", d = document.getElementById(f.idPrefix + "button_moveinsert"), 
      d.src = f.imagePrefix + "moveinsertoff.gif");
      break;
    case "swapcolors":
      c = f.sheet;
      g = c.GetAssuredCell(e.ecell.coord);
      e = c.attribs.defaultcolor ? c.colors[c.attribs.defaultcolor] : "rgb(0,0,0)";
      h = c.attribs.defaultbgcolor ? c.colors[c.attribs.defaultbgcolor] : "rgb(255,255,255)";
      d = g.color ? c.colors[g.color] : e;
      d == h && (d = "");
      c = g.bgcolor ? c.colors[g.bgcolor] : h;
      c == e && (c = "");
      f.ExecuteCommand("set %C color " + c + "%Nset %C bgcolor " + d, "");
      break;
    default:
      c = SocialCalc.SpreadsheetCmdLookup[b] || "", d = SocialCalc.SpreadsheetCmdSLookup[b] || "", f.ExecuteCommand(c, d);
  }
  a && a.blur && a.blur();
  SocialCalc.KeyboardFocus();
};
SocialCalc.SpreadsheetCmdLookup = {copy:"copy %C all", cut:"cut %C all", paste:"paste %C all", pasteformats:"paste %C formats", lock:"set %C readonly yes", unlock:"set %C readonly no", "delete":"erase %C formulas", filldown:"filldown %C all", fillright:"fillright %C all", erase:"erase %C all", borderon:"set %C bt %S%Nset %C br %S%Nset %C bb %S%Nset %C bl %S", borderoff:"set %C bt %S%Nset %C br %S%Nset %C bb %S%Nset %C bl %S", merge:"merge %C", unmerge:"unmerge %C", "align-left":"set %C cellformat left", 
"align-center":"set %C cellformat center", "align-right":"set %C cellformat right", "align-default":"set %C cellformat", insertrow:"insertrow %C", insertcol:"insertcol %C", deleterow:"deleterow %C", deletecol:"deletecol %C", hiderow:"set %H hide yes", hidecol:"set %W hide yes", undo:"undo", redo:"redo", recalc:"recalc"};
SocialCalc.SpreadsheetCmdSLookup = {borderon:"1px solid rgb(0,0,0)", borderoff:""};
SocialCalc.SpreadsheetControlExecuteCommand = function(a, b, c) {
  a = SocialCalc.GetSpreadsheetControlObject().editor;
  var d, e, f, g;
  a.range.hasrange ? (e = d = SocialCalc.crToCoord(a.range.left, a.range.top) + ":" + SocialCalc.crToCoord(a.range.right, a.range.bottom), f = SocialCalc.rcColname(a.range.left) + ":" + SocialCalc.rcColname(a.range.right), g = a.range.top + ":" + a.range.bottom) : a.ecell ? (e = a.ecell.coord, d = a.ecell.coord + ":" + a.ecell.coord, f = SocialCalc.rcColname(SocialCalc.coordToCr(a.ecell.coord).col), g = SocialCalc.coordToCr(a.ecell.coord).row) : (e = "A1", d = "A1:A1", f = SocialCalc.rcColname(SocialCalc.coordToCr("A1").col), 
  g = SocialCalc.coordToCr("A1").row);
  b = b.replace(/%C/g, e);
  b = b.replace(/%R/g, d);
  b = b.replace(/%N/g, "\n");
  b = b.replace(/%S/g, c);
  b = b.replace(/%W/g, f);
  b = b.replace(/%H/g, g);
  b = b.replace(/%P/g, "%");
  a.EditorScheduleSheetCommands(b, !0, !1);
};
SocialCalc.SpreadsheetControlCreateSheetHTML = function(a) {
  var b, c;
  b = "";
  b = new SocialCalc.RenderContext(a.sheet);
  a = document.createElement("div");
  c = b.RenderSheet(null, {type:"html"});
  a.appendChild(c);
  delete b;
  b = a.innerHTML;
  delete c;
  delete a;
  return b;
};
SocialCalc.SpreadsheetControlCreateCellHTML = function(a, b, c) {
  var d = "", d = a.sheet.cells[b];
  if (!d) {
    return "";
  }
  d = void 0 == d.displaystring ? SocialCalc.FormatValueForDisplay(a.sheet, d.datavalue, b, c || a.context.defaultHTMLlinkstyle) : d.displaystring;
  "&nbsp;" == d && (d = "");
  return d;
};
SocialCalc.SpreadsheetControlCreateCellHTMLSave = function(a, b, c) {
  var d, e, f, g, h, l = [];
  d = b ? SocialCalc.ParseRange(b) : {cr1:{row:1, col:1}, cr2:{row:a.sheet.attribs.lastrow, col:a.sheet.attribs.lastcol}};
  b = d.cr1;
  d = d.cr2;
  l.push("version:1.0");
  for (e = b.row;e <= d.row;e++) {
    for (f = b.col;f <= d.col;f++) {
      if (g = SocialCalc.crToCoord(f, e), h = a.sheet.cells[g]) {
        h = void 0 == h.displaystring ? SocialCalc.FormatValueForDisplay(a.sheet, h.datavalue, g, c || a.context.defaultHTMLlinkstyle) : h.displaystring, "&nbsp;" != h && l.push(g + ":" + SocialCalc.encodeForSave(h));
      }
    }
  }
  l.push("");
  return l.join("\n");
};
SocialCalc.SpreadsheetControl.DoFunctionList = function() {
  var a, b, c = SocialCalc.Formula, d = SocialCalc.Constants.function_classlist, e = SocialCalc.GetSpreadsheetControlObject(), f = e.idPrefix + "function";
  b = document.getElementById(f + "dialog");
  if (!b) {
    c.FillFunctionInfo();
    b = '<table><tr><td><span style="font-size:x-small;font-weight:bold">%loc!Category!</span><br><select id="' + f + 'class" size="' + d.length + '" style="width:120px;" onchange="SocialCalc.SpreadsheetControl.FunctionClassChosen(this.options[this.selectedIndex].value);">';
    for (a = 0;a < d.length;a++) {
      b += '<option value="' + d[a] + '"' + (0 == a ? " selected>" : ">") + SocialCalc.special_chars(c.FunctionClasses[d[a]].name) + "</option>";
    }
    b += '</select></td><td>&nbsp;&nbsp;</td><td id="' + f + 'list"><span style="font-size:x-small;font-weight:bold">%loc!Functions!</span><br><select id="' + f + 'name" size="' + d.length + '" style="width:240px;" onchange="SocialCalc.SpreadsheetControl.FunctionChosen(this.options[this.selectedIndex].value);" ondblclick="SocialCalc.SpreadsheetControl.DoFunctionPaste();">';
    b += SocialCalc.SpreadsheetControl.GetFunctionNamesStr("all");
    b += '</td></tr><tr><td colspan="3"><div id="' + f + 'desc" style="width:380px;height:80px;overflow:auto;font-size:x-small;">' + SocialCalc.SpreadsheetControl.GetFunctionInfoStr(c.FunctionClasses[d[0]].items[0]) + '</div><div style="width:380px;text-align:right;padding-top:6px;font-size:small;"><input type="button" value="%loc!Paste!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoFunctionPaste();">&nbsp;<input type="button" value="%loc!Cancel!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.HideFunctions();"></div></td></tr></table>';
    c = document.createElement("div");
    c.id = f + "dialog";
    c.style.position = "absolute";
    d = SocialCalc.GetViewportInfo();
    a = SocialCalc.GetElementPositionWithScroll(e.spreadsheetDiv);
    c.style.top = d.height / 3 - a.top + "px";
    c.style.left = d.width / 3 - a.left + "px";
    c.style.zIndex = 100;
    c.style.backgroundColor = "#FFF";
    c.style.border = "1px solid black";
    c.style.width = "400px";
    b = SocialCalc.LocalizeSubstrings('<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr><td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">&nbsp;%loc!Function List!</td><td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.SpreadsheetControl.HideFunctions();">&nbsp;X&nbsp;</td></tr></table><div style="background-color:#DDD;">' + b + "</div>");
    c.innerHTML = b;
    SocialCalc.DragRegister(c.firstChild.firstChild.firstChild.firstChild, !0, !0, {MouseDown:SocialCalc.DragFunctionStart, MouseMove:SocialCalc.DragFunctionPosition, MouseUp:SocialCalc.DragFunctionPosition, Disabled:null, positionobj:c}, e.spreadsheetDiv);
    e.spreadsheetDiv.appendChild(c);
    b = document.getElementById(f + "name");
    b.focus();
    SocialCalc.CmdGotFocus(b);
  }
};
SocialCalc.SpreadsheetControl.GetFunctionNamesStr = function(a) {
  var b, c = "";
  b = SocialCalc.Formula.FunctionClasses[a];
  for (a = 0;a < b.items.length;a++) {
    c += '<option value="' + b.items[a] + '"' + (0 == a ? " selected>" : ">") + b.items[a] + "</option>";
  }
  return c;
};
SocialCalc.SpreadsheetControl.FillFunctionNames = function(a, b) {
  var c, d;
  c = SocialCalc.Formula;
  b.length = 0;
  d = c.FunctionClasses[a];
  for (c = 0;c < d.items.length;c++) {
    b.options[c] = new Option(d.items[c], d.items[c]), 0 == c && (b.options[c].selected = !0);
  }
};
SocialCalc.SpreadsheetControl.GetFunctionInfoStr = function(a) {
  var b = SocialCalc.Formula, c = b.FunctionList[a], d = SocialCalc.special_chars;
  a = "<b>" + a + "(" + d(b.FunctionArgString(a)) + ")</b><br>";
  return a += d(c[3]);
};
SocialCalc.SpreadsheetControl.FunctionClassChosen = function(a) {
  var b = SocialCalc.GetSpreadsheetControlObject().idPrefix + "function", c = SocialCalc.Formula;
  SocialCalc.SpreadsheetControl.FillFunctionNames(a, document.getElementById(b + "name"));
  SocialCalc.SpreadsheetControl.FunctionChosen(c.FunctionClasses[a].items[0]);
};
SocialCalc.SpreadsheetControl.FunctionChosen = function(a) {
  var b = SocialCalc.GetSpreadsheetControlObject().idPrefix + "function";
  document.getElementById(b + "desc").innerHTML = SocialCalc.SpreadsheetControl.GetFunctionInfoStr(a);
};
SocialCalc.SpreadsheetControl.HideFunctions = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), a = document.getElementById(a.idPrefix + "functiondialog");
  a.innerHTML = "";
  SocialCalc.DragUnregister(a);
  SocialCalc.KeyboardFocus();
  a.parentNode && a.parentNode.removeChild(a);
};
SocialCalc.SpreadsheetControl.DoFunctionPaste = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), b = a.editor, c = document.getElementById(a.idPrefix + "functionname"), a = document.getElementById(a.idPrefix + "multilinetextarea"), c = c.value + "(";
  SocialCalc.SpreadsheetControl.HideFunctions();
  a ? (a.value += c, a.focus(), SocialCalc.CmdGotFocus(a)) : b.EditorAddToInput(c, "=");
};
SocialCalc.SpreadsheetControl.DoMultiline = function() {
  var a = SocialCalc.LocalizeSubstrings, b, c, d = SocialCalc.GetSpreadsheetControlObject(), e = d.editor, f = e.workingvalues, d = SocialCalc.GetSpreadsheetControlObject(), g = d.idPrefix + "multiline";
  b = document.getElementById(g + "dialog");
  if (!b) {
    switch(e.state) {
      case "start":
        f.ecoord = e.ecell.coord;
        f.erow = e.ecell.row;
        f.ecol = e.ecell.col;
        e.RangeRemove();
        c = SocialCalc.GetCellContents(e.context.sheetobj, f.ecoord);
        break;
      case "input":
      ;
      case "inputboxdirect":
        c = e.inputBox.GetText();
    }
    e.inputBox.element.disabled = !0;
    c = SocialCalc.special_chars(c);
    b = '<textarea id="' + g + 'textarea" style="width:380px;height:120px;margin:10px 0px 0px 6px;">' + c + '</textarea><div style="width:380px;text-align:right;padding:6px 0px 4px 6px;font-size:small;">' + a('<input type="button" value="%loc!Set Cell Contents!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoMultilinePaste();">&nbsp;<input type="button" value="%loc!Clear!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoMultilineClear();">&nbsp;<input type="button" value="%loc!Cancel!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.HideMultiline();"></div></div>');
    c = document.createElement("div");
    c.id = g + "dialog";
    c.style.position = "absolute";
    e = SocialCalc.GetViewportInfo();
    f = SocialCalc.GetElementPositionWithScroll(d.spreadsheetDiv);
    c.style.top = e.height / 3 - f.top + "px";
    c.style.left = e.width / 3 - f.left + "px";
    c.style.zIndex = 100;
    c.style.backgroundColor = "#FFF";
    c.style.border = "1px solid black";
    c.style.width = "400px";
    c.innerHTML = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr><td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">' + a("&nbsp;%loc!Multi-line Input Box!") + '</td><td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.SpreadsheetControl.HideMultiline();">&nbsp;X&nbsp;</td></tr></table><div style="background-color:#DDD;">' + b + "</div>";
    SocialCalc.DragRegister(c.firstChild.firstChild.firstChild.firstChild, !0, !0, {MouseDown:SocialCalc.DragFunctionStart, MouseMove:SocialCalc.DragFunctionPosition, MouseUp:SocialCalc.DragFunctionPosition, Disabled:null, positionobj:c}, d.spreadsheetDiv);
    d.spreadsheetDiv.appendChild(c);
    b = document.getElementById(g + "textarea");
    b.focus();
    SocialCalc.CmdGotFocus(b);
  }
};
SocialCalc.SpreadsheetControl.HideMultiline = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), b = a.editor, a = document.getElementById(a.idPrefix + "multilinedialog");
  a.innerHTML = "";
  SocialCalc.DragUnregister(a);
  SocialCalc.KeyboardFocus();
  a.parentNode && a.parentNode.removeChild(a);
  switch(b.state) {
    case "start":
      b.inputBox.DisplayCellContents(null);
      break;
    case "input":
    ;
    case "inputboxdirect":
      b.inputBox.element.disabled = !1, b.inputBox.Focus();
  }
};
SocialCalc.SpreadsheetControl.DoMultilineClear = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), a = document.getElementById(a.idPrefix + "multilinetextarea");
  a.value = "";
  a.focus();
};
SocialCalc.SpreadsheetControl.DoMultilinePaste = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), b = a.editor, c = b.workingvalues, a = document.getElementById(a.idPrefix + "multilinetextarea").value;
  SocialCalc.SpreadsheetControl.HideMultiline();
  switch(b.state) {
    case "start":
      c.partialexpr = "";
      c.ecoord = b.ecell.coord;
      c.erow = b.ecell.row;
      c.ecol = b.ecell.col;
      break;
    case "input":
    ;
    case "inputboxdirect":
      b.inputBox.Blur(), b.inputBox.ShowInputBox(!1), b.state = "start";
  }
  b.EditorSaveEdit(a);
};
SocialCalc.SpreadsheetControl.DoLink = function() {
  var a = SocialCalc.LocalizeString, b, c, d, e, f = SocialCalc.GetSpreadsheetControlObject();
  d = f.editor;
  e = d.workingvalues;
  var f = SocialCalc.GetSpreadsheetControlObject(), g = f.idPrefix + "link";
  c = document.getElementById(g + "dialog");
  if (!c) {
    switch(d.state) {
      case "start":
        e.ecoord = d.ecell.coord;
        e.erow = d.ecell.row;
        e.ecol = d.ecell.col;
        d.RangeRemove();
        b = SocialCalc.GetCellContents(d.context.sheetobj, e.ecoord);
        break;
      case "input":
      ;
      case "inputboxdirect":
        b = d.inputBox.GetText();
    }
    d.inputBox.element.disabled = !0;
    "'" == b.charAt(0) && (b = b.slice(1));
    c = SocialCalc.ParseCellLinkText(b);
    SocialCalc.special_chars(b);
    d = (b = f.sheet.cells[d.ecell.coord]) && b.textvalueformat ? "" : " checked";
    e = c.newwin ? " checked" : "";
    b = '<div style="padding:6px 0px 4px 6px;"><span style="font-size:smaller;">' + a("Description") + '</span><br><input type="text" id="' + g + 'desc" style="width:380px;" value="' + SocialCalc.special_chars(c.desc) + '"><br><span style="font-size:smaller;">' + a("URL") + '</span><br><input type="text" id="' + g + 'url" style="width:380px;" value="' + SocialCalc.special_chars(c.url) + '"><br>';
    SocialCalc.Callbacks.MakePageLink && (b += '<span style="font-size:smaller;">' + a("Page Name") + '</span><br><input type="text" id="' + g + 'pagename" style="width:380px;" value="' + SocialCalc.special_chars(c.pagename) + '"><br><span style="font-size:smaller;">' + a("Workspace") + '</span><br><input type="text" id="' + g + 'workspace" style="width:380px;" value="' + SocialCalc.special_chars(c.workspace) + '"><br>');
    b += SocialCalc.LocalizeSubstrings('<input type="checkbox" id="' + g + 'format"' + d + '>&nbsp;<span style="font-size:smaller;">%loc!Set to Link format!</span><br><input type="checkbox" id="' + g + 'popup"' + e + '>&nbsp;<span style="font-size:smaller;">%loc!Show in new browser window!</span></div><div style="width:380px;text-align:right;padding:6px 0px 4px 6px;font-size:small;"><input type="button" value="%loc!Set Cell Contents!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoLinkPaste();">&nbsp;<input type="button" value="%loc!Clear!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.DoLinkClear();">&nbsp;<input type="button" value="%loc!Cancel!" style="font-size:smaller;" onclick="SocialCalc.SpreadsheetControl.HideLink();"></div></div>');
    c = document.createElement("div");
    c.id = g + "dialog";
    c.style.position = "absolute";
    d = SocialCalc.GetViewportInfo();
    e = SocialCalc.GetElementPositionWithScroll(f.spreadsheetDiv);
    c.style.top = d.height / 3 - e.top + "px";
    c.style.left = d.width / 3 - e.left + "px";
    c.style.zIndex = 100;
    c.style.backgroundColor = "#FFF";
    c.style.border = "1px solid black";
    c.style.width = "400px";
    c.innerHTML = '<table cellspacing="0" cellpadding="0" style="border-bottom:1px solid black;"><tr><td style="font-size:10px;cursor:default;width:100%;background-color:#999;color:#FFF;">&nbsp;' + a("Link Input Box") + '</td><td style="font-size:10px;cursor:default;color:#666;" onclick="SocialCalc.SpreadsheetControl.HideLink();">&nbsp;X&nbsp;</td></tr></table><div style="background-color:#DDD;">' + b + "</div>";
    SocialCalc.DragRegister(c.firstChild.firstChild.firstChild.firstChild, !0, !0, {MouseDown:SocialCalc.DragFunctionStart, MouseMove:SocialCalc.DragFunctionPosition, MouseUp:SocialCalc.DragFunctionPosition, Disabled:null, positionobj:c}, f.spreadsheetDiv);
    f.spreadsheetDiv.appendChild(c);
    c = document.getElementById(g + "url");
    c.focus();
    SocialCalc.CmdGotFocus(c);
  }
};
SocialCalc.SpreadsheetControl.HideLink = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), b = a.editor, a = document.getElementById(a.idPrefix + "linkdialog");
  a.innerHTML = "";
  SocialCalc.DragUnregister(a);
  SocialCalc.KeyboardFocus();
  a.parentNode && a.parentNode.removeChild(a);
  switch(b.state) {
    case "start":
      b.inputBox.DisplayCellContents(null);
      break;
    case "input":
    ;
    case "inputboxdirect":
      b.inputBox.element.disabled = !1, b.inputBox.Focus();
  }
};
SocialCalc.SpreadsheetControl.DoLinkClear = function() {
  var a = SocialCalc.GetSpreadsheetControlObject();
  document.getElementById(a.idPrefix + "linkdesc").value = "";
  document.getElementById(a.idPrefix + "linkpagename").value = "";
  document.getElementById(a.idPrefix + "linkworkspace").value = "";
  a = document.getElementById(a.idPrefix + "linkurl");
  a.value = "";
  a.focus();
};
SocialCalc.SpreadsheetControl.DoLinkPaste = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), b = a.editor, c = b.workingvalues, d = document.getElementById(a.idPrefix + "linkdesc"), e = document.getElementById(a.idPrefix + "linkurl"), f = document.getElementById(a.idPrefix + "linkpagename"), g = document.getElementById(a.idPrefix + "linkworkspace"), h = document.getElementById(a.idPrefix + "linkformat"), l = "", n, p;
  document.getElementById(a.idPrefix + "linkpopup").checked ? (a = "<<", l = ">>", n = "[[", p = "]]") : (a = "<", l = ">", n = "[", p = "]");
  l = f && f.value ? g.value ? d.value + "{" + g.value + n + f.value + p + "}" : d.value + n + f.value + p : d.value + a + e.value + l;
  SocialCalc.SpreadsheetControl.HideLink();
  switch(b.state) {
    case "start":
      c.partialexpr = "";
      c.ecoord = b.ecell.coord;
      c.erow = b.ecell.row;
      c.ecol = b.ecell.col;
      break;
    case "input":
    ;
    case "inputboxdirect":
      b.inputBox.Blur(), b.inputBox.ShowInputBox(!1), b.state = "start";
  }
  h.checked && SocialCalc.SpreadsheetControlExecuteCommand(null, "set %C textvalueformat text-link", "");
  b.EditorSaveEdit(l);
};
SocialCalc.SpreadsheetControl.DoSum = function() {
  var a, b, c, d, e = SocialCalc.GetSpreadsheetControlObject().editor, f = e.context.sheetobj;
  if (e.range.hasrange) {
    a = SocialCalc.crToCoord(e.range.left, e.range.top) + ":" + SocialCalc.crToCoord(e.range.right, e.range.bottom), a = "set " + SocialCalc.crToCoord(e.range.right, e.range.bottom + 1) + " formula sum(" + a + ")";
  } else {
    if (a = e.ecell.row - 1, c = e.ecell.col, 1 >= a) {
      a = "set " + e.ecell.coord + " constant e#REF! 0 #REF!";
    } else {
      for (d = !1;0 < a;) {
        b = SocialCalc.crToCoord(c, a);
        b = f.GetAssuredCell(b);
        if (b.datatype && "t" != b.datatype) {
          d = !0;
        } else {
          if (d) {
            a++;
            break;
          }
        }
        a--;
      }
      a = "set " + e.ecell.coord + " formula sum(" + SocialCalc.crToCoord(c, a) + ":" + SocialCalc.crToCoord(c, e.ecell.row - 1) + ")";
    }
  }
  e.EditorScheduleSheetCommands(a, !0, !1);
};
SocialCalc.SpreadsheetControl.FindInSheet = function() {
  var a = $("#searchstatus"), b = SocialCalc.GetSpreadsheetControlObject();
  if (this.value.length) {
    var c = b.sheet.cells, d = RegExp(this.value, "im"), e, f = [], g;
    for (g in c) {
      e = c[g];
      var h = SocialCalc.coordToCr(g);
      "yes" !== b.sheet.rowattribs.hide[h.row] && "yes" !== b.sheet.colattribs.hide[SocialCalc.rcColname(h.col)] && (e = "c" === e.datatype ? e.displaystring : String(e.datavalue), void 0 !== e && e.match(d) && f.push(g));
    }
    b.sheet.search_cells = f;
    f.length ? (b.sheet.selected_search_cell = 0, b.editor.MoveECell(f[0]), a.text("1 of " + f.length)) : (b.sheet.selected_search_cell = void 0, a.text("No Matches"));
  } else {
    a.text(""), b.sheet.search_cells = [], b.sheet.selected_search_cell = void 0;
  }
};
SocialCalc.SpreadsheetControl.SearchSheet = function(a) {
  var b = SocialCalc.GetSpreadsheetControlObject(), c = b.sheet, d = c.search_cells;
  if (d.length) {
    var e = c.selected_search_cell, e = e === (0 === a ? 0 : d.length - 1) ? 0 === a ? d.length - 1 : 0 : e + (0 === a ? -1 : 1);
    a = d[e];
    c.selected_search_cell = e;
    b.editor.MoveECell(a);
    document.getElementById("searchstatus").textContent = String(e + 1) + " of " + d.length;
  }
};
SocialCalc.SpreadsheetControl.SearchUp = function() {
  SocialCalc.SpreadsheetControl.SearchSheet(0);
};
SocialCalc.SpreadsheetControl.SearchDown = function() {
  SocialCalc.SpreadsheetControl.SearchSheet(1);
};
SocialCalc.SpreadsheetControlSortOnclick = function(a, b) {
  var c, d, e = [], f = document.getElementById(a.idPrefix + "sortlist");
  SocialCalc.LoadColumnChoosers(a);
  a.editor.RangeChangeCallback.sort = SocialCalc.UpdateSortRangeProposal;
  for (c in a.sheet.names) {
    e.push(c);
  }
  e.sort();
  f.length = 0;
  f.options[0] = new Option(SocialCalc.LocalizeString("[select range]"));
  f.options[1] = new Option(SocialCalc.LocalizeString("Sort All"), "all");
  n_options = f.options.length;
  for (d = 0;d < e.length;d++) {
    c = e[d], f.options[d + n_options] = new Option(c, c), c == a.sortrange && (f.options[d + n_options].selected = !0);
  }
  "" == a.sortrange && (f.options[0].selected = !0);
  SocialCalc.UpdateSortRangeProposal(a.editor);
  SocialCalc.KeyboardFocus();
};
SocialCalc.SpreadsheetControlSortSave = function(a, b) {
  var c = SocialCalc.GetSpreadsheetControlObject(), d, e, f;
  d = "sort:" + SocialCalc.encodeForSave(c.sortrange) + ":";
  e = document.getElementById(c.idPrefix + "majorsort");
  f = document.getElementById(c.idPrefix + "majorsortup");
  d += e.selectedIndex + (f.checked ? ":up" : ":down");
  e = document.getElementById(c.idPrefix + "minorsort");
  0 < e.selectedIndex ? (f = document.getElementById(c.idPrefix + "minorsortup"), d += ":" + e.selectedIndex + (f.checked ? ":up" : ":down")) : d += "::";
  e = document.getElementById(c.idPrefix + "lastsort");
  0 < e.selectedIndex ? (f = document.getElementById(c.idPrefix + "lastsortup"), d += ":" + e.selectedIndex + (f.checked ? ":up" : ":down")) : d += "::";
  return d + "\n";
};
SocialCalc.SpreadsheetControlSortLoad = function(a, b, c, d) {
  a = SocialCalc.GetSpreadsheetControlObject();
  c = c.split(":");
  a.sortrange = SocialCalc.decodeFromSave(c[1]);
  b = document.getElementById(a.idPrefix + "sortbutton");
  a.sortrange ? (b.value = SocialCalc.LocalizeString("Sort ") + a.sortrange, b.style.visibility = "visible") : b.style.visibility = "hidden";
  SocialCalc.LoadColumnChoosers(a);
  sele = document.getElementById(a.idPrefix + "majorsort");
  sele.selectedIndex = c[2] - 0;
  document.getElementById(a.idPrefix + "majorsort" + c[3]).checked = !0;
  sele = document.getElementById(a.idPrefix + "minorsort");
  c[4] ? (sele.selectedIndex = c[4] - 0, document.getElementById(a.idPrefix + "minorsort" + c[5]).checked = !0) : (sele.selectedIndex = 0, document.getElementById(a.idPrefix + "minorsortup").checked = !0);
  sele = document.getElementById(a.idPrefix + "lastsort");
  c[6] ? (sele.selectedIndex = c[6] - 0, document.getElementById(a.idPrefix + "lastsort" + c[7]).checked = !0) : (sele.selectedIndex = 0, document.getElementById(a.idPrefix + "lastsortup").checked = !0);
  return!0;
};
SocialCalc.SpreadsheetControlCommentOnclick = function(a, b) {
  a.editor.MoveECellCallback.comment = SocialCalc.SpreadsheetControlCommentMoveECell;
  SocialCalc.SpreadsheetControlCommentDisplay(a, b);
  SocialCalc.KeyboardFocus();
};
SocialCalc.SpreadsheetControlCommentDisplay = function(a, b) {
  var c = "";
  a.editor.ecell && a.editor.ecell.coord && a.sheet.cells[a.editor.ecell.coord] && (c = a.sheet.cells[a.editor.ecell.coord].comment || "");
  document.getElementById(a.idPrefix + "commenttext").value = c;
};
SocialCalc.SpreadsheetControlCommentMoveECell = function(a) {
  SocialCalc.SpreadsheetControlCommentDisplay(SocialCalc.GetSpreadsheetControlObject(), "comment");
};
SocialCalc.SpreadsheetControlCommentSet = function() {
  var a = SocialCalc.GetSpreadsheetControlObject();
  a.ExecuteCommand("set %C comment " + SocialCalc.encodeForSave(document.getElementById(a.idPrefix + "commenttext").value));
  var b = SocialCalc.GetEditorCellElement(a.editor, a.editor.ecell.row, a.editor.ecell.col);
  a.editor.ECellReadonly() || (b.element.title = document.getElementById(a.idPrefix + "commenttext").value, a.editor.UpdateCellCSS(b, a.editor.ecell.row, a.editor.ecell.col));
  SocialCalc.KeyboardFocus();
};
SocialCalc.SpreadsheetControlCommentOnunclick = function(a, b) {
  delete a.editor.MoveECellCallback.comment;
};
SocialCalc.SpreadsheetControlNamesOnclick = function(a, b) {
  document.getElementById(a.idPrefix + "namesname").value = "";
  document.getElementById(a.idPrefix + "namesdesc").value = "";
  document.getElementById(a.idPrefix + "namesvalue").value = "";
  a.editor.RangeChangeCallback.names = SocialCalc.SpreadsheetControlNamesRangeChange;
  a.editor.MoveECellCallback.names = SocialCalc.SpreadsheetControlNamesRangeChange;
  SocialCalc.SpreadsheetControlNamesRangeChange(a.editor);
  SocialCalc.SpreadsheetControlNamesFillNameList();
  SocialCalc.SpreadsheetControlNamesChangedName();
};
SocialCalc.SpreadsheetControlNamesFillNameList = function() {
  var a = SocialCalc.LocalizeString, b, c = [], d = SocialCalc.GetSpreadsheetControlObject(), e = document.getElementById(d.idPrefix + "nameslist"), f = document.getElementById(d.idPrefix + "namesname").value.toUpperCase().replace(/[^A-Z0-9_\.]/g, "");
  for (b in d.sheet.names) {
    c.push(b);
  }
  c.sort();
  e.length = 0;
  e.options[0] = 0 < c.length ? new Option(a("[New]")) : new Option(a("[None]"));
  for (a = 0;a < c.length;a++) {
    b = c[a], e.options[a + 1] = new Option(b, b), b == f && (e.options[a + 1].selected = !0);
  }
  "" == f && (e.options[0].selected = !0);
};
SocialCalc.SpreadsheetControlNamesChangedName = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), b = document.getElementById(a.idPrefix + "nameslist"), b = b.options[b.selectedIndex].value;
  a.sheet.names[b] ? (document.getElementById(a.idPrefix + "namesname").value = b, document.getElementById(a.idPrefix + "namesdesc").value = a.sheet.names[b].desc || "", document.getElementById(a.idPrefix + "namesvalue").value = a.sheet.names[b].definition || "") : (document.getElementById(a.idPrefix + "namesname").value = "", document.getElementById(a.idPrefix + "namesdesc").value = "", document.getElementById(a.idPrefix + "namesvalue").value = "");
};
SocialCalc.SpreadsheetControlNamesRangeChange = function(a) {
  var b = SocialCalc.GetSpreadsheetControlObject();
  document.getElementById(b.idPrefix + "namesrangeproposal").value = a.range.hasrange ? SocialCalc.crToCoord(a.range.left, a.range.top) + ":" + SocialCalc.crToCoord(a.range.right, a.range.bottom) : a.ecell.coord;
};
SocialCalc.SpreadsheetControlNamesOnunclick = function(a, b) {
  delete a.editor.RangeChangeCallback.names;
  delete a.editor.MoveECellCallback.names;
};
SocialCalc.SpreadsheetControlNamesSetValue = function() {
  var a = SocialCalc.GetSpreadsheetControlObject();
  document.getElementById(a.idPrefix + "namesvalue").value = document.getElementById(a.idPrefix + "namesrangeproposal").value;
  SocialCalc.KeyboardFocus();
};
SocialCalc.SpreadsheetControlNamesSave = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), b = document.getElementById(a.idPrefix + "namesname").value;
  SocialCalc.SetTab(a.tabs[0].name);
  SocialCalc.KeyboardFocus();
  "" != b && a.ExecuteCommand("name define " + b + " " + document.getElementById(a.idPrefix + "namesvalue").value + "\nname desc " + b + " " + document.getElementById(a.idPrefix + "namesdesc").value);
};
SocialCalc.SpreadsheetControlNamesDelete = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), b = document.getElementById(a.idPrefix + "namesname").value;
  SocialCalc.SetTab(a.tabs[0].name);
  SocialCalc.KeyboardFocus();
  "" != b && a.ExecuteCommand("name delete " + b);
  SocialCalc.KeyboardFocus();
};
SocialCalc.SpreadsheetControlClipboardOnclick = function(a, b) {
  a = SocialCalc.GetSpreadsheetControlObject();
  clipele = document.getElementById(a.idPrefix + "clipboardtext");
  document.getElementById(a.idPrefix + "clipboardformat-tab").checked = !0;
  clipele.value = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "tab");
};
SocialCalc.SpreadsheetControlClipboardFormat = function(a) {
  var b = SocialCalc.GetSpreadsheetControlObject();
  clipele = document.getElementById(b.idPrefix + "clipboardtext");
  clipele.value = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, a);
};
SocialCalc.SpreadsheetControlClipboardLoad = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), b = "tab";
  SocialCalc.SetTab(a.tabs[0].name);
  SocialCalc.KeyboardFocus();
  document.getElementById(a.idPrefix + "clipboardformat-csv").checked ? b = "csv" : document.getElementById(a.idPrefix + "clipboardformat-scsave").checked && (b = "scsave");
  a.editor.EditorScheduleSheetCommands("loadclipboard " + SocialCalc.encodeForSave(SocialCalc.ConvertOtherFormatToSave(document.getElementById(a.idPrefix + "clipboardtext").value, b)), !0, !1);
};
SocialCalc.SpreadsheetControlClipboardClear = function() {
  var a = SocialCalc.GetSpreadsheetControlObject(), b = document.getElementById(a.idPrefix + "clipboardtext");
  b.value = "";
  a.editor.EditorScheduleSheetCommands("clearclipboard", !0, !1);
  b.focus();
};
SocialCalc.SpreadsheetControlClipboardExport = function() {
  var a = SocialCalc.GetSpreadsheetControlObject();
  a.ExportCallback && a.ExportCallback(a);
  SocialCalc.SetTab(a.tabs[0].name);
  SocialCalc.KeyboardFocus();
};
SocialCalc.SpreadsheetControlSettingsSwitch = function(a) {
  SocialCalc.SettingControlReset();
  var b = SocialCalc.GetSpreadsheetControlObject(), c = document.getElementById(b.idPrefix + "sheetsettingstable"), d = document.getElementById(b.idPrefix + "cellsettingstable"), e = document.getElementById(b.idPrefix + "sheetsettingstoolbar"), f = document.getElementById(b.idPrefix + "cellsettingstoolbar");
  "sheet" == a ? (c.style.display = "block", d.style.display = "none", e.style.display = "block", f.style.display = "none", SocialCalc.SettingsControlSetCurrentPanel(b.views.settings.values.sheetspanel)) : (c.style.display = "none", d.style.display = "block", e.style.display = "none", f.style.display = "block", SocialCalc.SettingsControlSetCurrentPanel(b.views.settings.values.cellspanel));
};
SocialCalc.SettingsControlSave = function(a) {
  var b, c, d = SocialCalc.GetSpreadsheetControlObject(), e = SocialCalc.SettingsControlUnloadPanel(SocialCalc.SettingsControls.CurrentPanel);
  SocialCalc.SetTab(d.tabs[0].name);
  SocialCalc.KeyboardFocus();
  "sheet" == a ? c = d.sheet.DecodeSheetAttributes(e) : "cell" == a && (d.editor.range.hasrange && (b = SocialCalc.crToCoord(d.editor.range.left, d.editor.range.top) + ":" + SocialCalc.crToCoord(d.editor.range.right, d.editor.range.bottom)), c = d.sheet.DecodeCellAttributes(d.editor.ecell.coord, e, b));
  c && d.editor.EditorScheduleSheetCommands(c, !0, !1);
};
SocialCalc.SpreadsheetControlCreateSpreadsheetSave = function(a, b) {
  var c = "", d = "", e, f;
  if (b) {
    for (e in b) {
      f = "\n" != b[e].charAt(b[e] - 1) ? "\n" : "", c += "--" + a.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" + b[e] + f, d += "part:" + e + "\n";
    }
  }
  return "socialcalc:version:1.0\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=" + a.multipartBoundary + "\n--" + a.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n# SocialCalc Spreadsheet Control Save\nversion:1.0\npart:sheet\npart:edit\npart:audit\n" + d + "--" + a.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" + a.CreateSheetSave() + "--" + a.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" + a.editor.SaveEditorSettings() + 
  "--" + a.multipartBoundary + "\nContent-type: text/plain; charset=UTF-8\n\n" + a.sheet.CreateAuditString() + c + "--" + a.multipartBoundary + "--\n";
};
SocialCalc.SpreadsheetControlDecodeSpreadsheetSave = function(a, b) {
  var c, d, e, f, g, h, l, n = {}, p = [];
  c = b.search(/^MIME-Version:\s1\.0/mi);
  if (0 > c) {
    return n;
  }
  d = /^Content-Type:\s*multipart\/mixed;\s*boundary=(\S+)/mig;
  d.lastIndex = c;
  e = d.exec(b);
  if (0 >= d.lastIndex) {
    return n;
  }
  c = e[1];
  f = RegExp("^--" + c + "(?:\r\n|\n)", "mg");
  f.lastIndex = d.lastIndex;
  f.exec(b);
  d = /(?:\r\n|\n)(?:\r\n|\n)/gm;
  d.lastIndex = f.lastIndex;
  e = d.exec(b);
  if (!e) {
    return n;
  }
  g = d.lastIndex;
  f.lastIndex = g;
  e = f.exec(b);
  if (!e) {
    return n;
  }
  e = e.index;
  g = b.substring(g, e).split(/\r\n|\n/);
  for (h = 0;h < g.length;h++) {
    switch(line = g[h], l = line.split(":"), l[0]) {
      case "part":
        p.push(l[1]);
    }
  }
  for (pnum = 0;pnum < p.length;pnum++) {
    d.lastIndex = e;
    e = d.exec(b);
    if (!e) {
      break;
    }
    g = d.lastIndex;
    pnum == p.length - 1 && (f = RegExp("^--" + c + "--$", "mg"));
    f.lastIndex = g;
    e = f.exec(b);
    if (!e) {
      break;
    }
    e = e.index;
    n[p[pnum]] = {start:g, end:e};
  }
  return n;
};
SocialCalc.SettingsControls = {Controls:{}, CurrentPanel:null};
SocialCalc.SettingsControlSetCurrentPanel = function(a) {
  SocialCalc.SettingsControls.CurrentPanel = a;
  SocialCalc.SettingsControls.PopupChangeCallback({panelobj:a}, "", null);
};
SocialCalc.SettingsControlInitializePanel = function(a) {
  var b, c = SocialCalc.SettingsControls;
  for (b in a) {
    "name" != b && (ctrl = c.Controls[a[b].type]) && ctrl.Initialize && ctrl.Initialize(a, b);
  }
};
SocialCalc.SettingsControlLoadPanel = function(a, b) {
  var c, d = SocialCalc.SettingsControls;
  for (c in a) {
    "name" != c && (ctrl = d.Controls[a[c].type]) && ctrl.SetValue && ctrl.SetValue(a, c, b[a[c].setting]);
  }
};
SocialCalc.SettingsControlUnloadPanel = function(a) {
  var b, c = SocialCalc.SettingsControls, d = {};
  for (b in a) {
    "name" != b && (ctrl = c.Controls[a[b].type]) && ctrl.GetValue && (d[a[b].setting] = ctrl.GetValue(a, b));
  }
  return d;
};
SocialCalc.SettingsControls.PopupChangeCallback = function(a, b, c) {
  var d = SocialCalc.Constants;
  if ((b = document.getElementById("sample-text")) && a && a.panelobj) {
    c = SocialCalc.CurrentSpreadsheetControlObject.idPrefix;
    var e = "cell" == a.panelobj.name ? "c" : "", f, g;
    g = d.defaultCellLayout.match(/^padding.(\S+) (\S+) (\S+) (\S+).vertical.align.(\S+);$/) || [];
    g = {color:["textcolor"], backgroundColor:["bgcolor", "#FFF"], fontSize:["fontsize", d.defaultCellFontSize], fontFamily:["fontfamily"], paddingTop:["padtop", g[1]], paddingRight:["padright", g[2]], paddingBottom:["padbottom", g[3]], paddingLeft:["padleft", g[4]], verticalAlign:["alignvert", g[5]]};
    for (f in g) {
      d = SocialCalc.Popup.GetValue(c + e + g[f][0]) || g[f][1] || "", b.style[f] = d;
    }
    if ("c" == e) {
      g = {borderTop:"cbt", borderRight:"cbr", borderBottom:"cbb", borderLeft:"cbl"};
      for (f in g) {
        d = SocialCalc.SettingsControls.BorderSideGetValue(a.panelobj, g[f]), b.style[f] = d ? d.val || "" : "";
      }
      d = SocialCalc.Popup.GetValue(c + "calignhoriz");
      b.style.textAlign = d || "left";
    } else {
      b.style.border = "", d = SocialCalc.Popup.GetValue(c + "textalignhoriz"), b.style.textAlign = d || "left", d = SocialCalc.Popup.GetValue(c + "numberalignhoriz");
    }
    b.childNodes[1].style.textAlign = d || "right";
    g = (d = SocialCalc.Popup.GetValue(c + e + "fontlook")) ? d.match(/^(\S+) (\S+)$/) || [] : [];
    b.style.fontStyle = g[1] || "";
    b.style.fontWeight = g[2] || "";
    d = SocialCalc.Popup.GetValue(c + e + "formatnumber") || "General";
    a = SocialCalc.FormatNumber.formatNumberWithFormat(9.8765, d, "");
    f = SocialCalc.FormatNumber.formatNumberWithFormat(-1234.5, d, "");
    "??-???-??&nbsp;??:??:??" != f && (a += "<br>" + f);
    b.childNodes[1].innerHTML = a;
  }
};
SocialCalc.SettingsControls.PopupListSetValue = function(a, b, c) {
  if (c) {
    var d = SocialCalc.Popup;
    c.def ? d.SetValue(a[b].id, "") : d.SetValue(a[b].id, c.val);
  } else {
    alert(b + " no value");
  }
};
SocialCalc.SettingsControls.PopupListGetValue = function(a, b) {
  var c = a[b];
  return c ? (c = SocialCalc.Popup.GetValue(c.id)) ? {def:!1, val:c} : {def:!0, val:0} : null;
};
SocialCalc.SettingsControls.PopupListInitialize = function(a, b) {
  var c, d, e, f;
  c = SocialCalc.SettingsControls;
  c = a[b].initialdata || c.Controls[a[b].type].InitialData || "";
  c = SocialCalc.LocalizeSubstrings(c);
  var g = c.split(/\|/), h = [];
  for (c = 0;c < (g.length || 0);c++) {
    d = g[c], e = d.indexOf(":"), f = d.substring(0, e), -1 != f.indexOf("\\") && (f = f.replace(/\\c/g, ":"), f = f.replace(/\\b/g, "\\")), f = SocialCalc.special_chars(f), h[c] = "[custom]" == f ? {o:SocialCalc.Constants.s_PopupListCustom, v:d.substring(e + 1), a:{custom:!0}} : "[cancel]" == f ? {o:SocialCalc.Constants.s_PopupListCancel, v:"", a:{cancel:!0}} : "[break]" == f ? {o:"-----", v:"", a:{skip:!0}} : "[newcol]" == f ? {o:"", v:"", a:{newcol:!0}} : {o:f, v:d.substring(e + 1)};
  }
  SocialCalc.Popup.Create("List", a[b].id, {});
  SocialCalc.Popup.Initialize(a[b].id, {options:h, attribs:{changedcallback:SocialCalc.SettingsControls.PopupChangeCallback, panelobj:a}});
};
SocialCalc.SettingsControls.PopupListReset = function(a) {
  SocialCalc.Popup.Reset("List");
};
SocialCalc.SettingsControls.Controls.PopupList = {SetValue:SocialCalc.SettingsControls.PopupListSetValue, GetValue:SocialCalc.SettingsControls.PopupListGetValue, Initialize:SocialCalc.SettingsControls.PopupListInitialize, OnReset:SocialCalc.SettingsControls.PopupListReset, ChangedCallback:null};
SocialCalc.SettingsControls.ColorChooserSetValue = function(a, b, c) {
  if (c) {
    var d = SocialCalc.Popup;
    c.def ? d.SetValue(a[b].id, "") : d.SetValue(a[b].id, c.val);
  } else {
    alert(b + " no value");
  }
};
SocialCalc.SettingsControls.ColorChooserGetValue = function(a, b) {
  var c = SocialCalc.Popup.GetValue(a[b].id);
  return c ? {def:!1, val:c} : {def:!0, val:0};
};
SocialCalc.SettingsControls.ColorChooserInitialize = function(a, b) {
  SocialCalc.Popup.Create("ColorChooser", a[b].id, {});
  SocialCalc.Popup.Initialize(a[b].id, {attribs:{title:"&nbsp;", moveable:!0, width:"106px", changedcallback:SocialCalc.SettingsControls.PopupChangeCallback, panelobj:a}});
};
SocialCalc.SettingsControls.ColorChooserReset = function(a) {
  SocialCalc.Popup.Reset("ColorChooser");
};
SocialCalc.SettingsControls.Controls.ColorChooser = {SetValue:SocialCalc.SettingsControls.ColorChooserSetValue, GetValue:SocialCalc.SettingsControls.ColorChooserGetValue, Initialize:SocialCalc.SettingsControls.ColorChooserInitialize, OnReset:SocialCalc.SettingsControls.ColorChooserReset, ChangedCallback:null};
SocialCalc.SettingsControls.BorderSideSetValue = function(a, b, c) {
  a = a[b].id;
  if (c) {
    if (b = document.getElementById(a + "-onoff-bcb")) {
      c.val ? (b.checked = !0, b.value = c.val, c = c.val.match(/(\S+)\s+(\S+)\s+(\S.+)/), a += "-color", SocialCalc.Popup.SetValue(a, c[3]), SocialCalc.Popup.SetDisabled(a, !1)) : (b.checked = !1, b.value = c.val, a += "-color", SocialCalc.Popup.SetValue(a, ""), SocialCalc.Popup.SetDisabled(a, !0));
    }
  } else {
    alert(b + " no value");
  }
};
SocialCalc.SettingsControls.BorderSideGetValue = function(a, b) {
  var c, d = a[b].id;
  if (c = document.getElementById(d + "-onoff-bcb")) {
    return c.checked ? (c = SocialCalc.Popup.GetValue(d + "-color"), {def:!1, val:"1px solid " + (c || "rgb(0,0,0)")}) : {def:!1, val:""};
  }
};
SocialCalc.SettingsControls.BorderSideInitialize = function(a, b) {
  var c = a[b].id;
  SocialCalc.Popup.Create("ColorChooser", c + "-color", {});
  SocialCalc.Popup.Initialize(c + "-color", {attribs:{title:"&nbsp;", width:"106px", moveable:!0, changedcallback:SocialCalc.SettingsControls.PopupChangeCallback, panelobj:a}});
};
SocialCalc.SettingsControlOnchangeBorder = function(a) {
  var b = SocialCalc.SettingsControls, c = b.CurrentPanel, d = a.id.match(/(^.*\-)(\w+)\-(\w+)\-(\w+)$/);
  if (d) {
    var e = d[2], c = c[e].type;
    switch(d[4]) {
      case "bcb":
        a.checked ? b.Controls[c].SetValue(b.CurrentPanel, e, {def:!1, val:a.value || "1px solid rgb(0,0,0)"}) : b.Controls[c].SetValue(b.CurrentPanel, e, {def:!1, val:""});
    }
  }
};
SocialCalc.SettingsControls.Controls.BorderSide = {SetValue:SocialCalc.SettingsControls.BorderSideSetValue, GetValue:SocialCalc.SettingsControls.BorderSideGetValue, OnClick:SocialCalc.SettingsControls.ColorComboOnClick, Initialize:SocialCalc.SettingsControls.BorderSideInitialize, InitialData:{thickness:"1 pixel:1px", style:"Solid:solid"}, ChangedCallback:null};
SocialCalc.SettingControlReset = function() {
  var a = SocialCalc.SettingsControls, b;
  for (b in a.Controls) {
    a.Controls[b].OnReset && a.Controls[b].OnReset(b);
  }
};
SocialCalc.OtherSaveParts = {};
SocialCalc.CtrlSEditor = function(a) {
  var b, c;
  if (0 < a.length) {
    b = SocialCalc.special_chars(SocialCalc.OtherSaveParts[a] || "");
  } else {
    for (c in b = "Listing of Parts\n", SocialCalc.OtherSaveParts) {
      b += SocialCalc.special_chars("\nPart: " + c + "\n=====\n" + SocialCalc.OtherSaveParts[c] + "\n");
    }
  }
  c = document.createElement("div");
  c.style.cssText = "position:absolute;z-index:500;width:300px;height:300px;left:100px;top:200px;border:1px solid black;background-color:#EEE;text-align:center;";
  c.id = "socialcalc-editbox";
  c.innerHTML = a + '<br><br><textarea id="socialcalc-editbox-textarea" style="width:250px;height:200px;">' + b + "</textarea><br><br><input type=button onclick=\"SocialCalc.CtrlSEditorDone ('socialcalc-editbox', '" + a + '\');" value="OK">';
  document.body.appendChild(c);
  a = document.getElementById("socialcalc-editbox-textarea");
  a.focus();
  SocialCalc.CmdGotFocus(a);
};
SocialCalc.CtrlSEditorDone = function(a, b) {
  var c = document.getElementById(a + "-textarea").value;
  0 < b.length && (0 < c.length ? SocialCalc.OtherSaveParts[b] = c : delete SocialCalc.OtherSaveParts[b]);
  c = document.getElementById(a);
  SocialCalc.KeyboardFocus();
  c.parentNode.removeChild(c);
};
SocialCalc || (alert("Main SocialCalc code module needed"), SocialCalc = {});
SocialCalc.TableEditor || alert("SocialCalc TableEditor code module needed");
SocialCalc.CurrentSpreadsheetViewerObject = null;
SocialCalc.SpreadsheetViewer = function(a) {
  var b = SocialCalc.Constants;
  this.spreadsheetDiv = this.parentNode = null;
  this.viewheight = this.width = this.height = this.requestedSpaceBelow = this.requestedWidth = this.requestedHeight = 0;
  this.editorDiv = this.spreadsheetDiv = this.editor = this.context = this.sheet = null;
  this.sortrange = "";
  this.idPrefix = a || "SocialCalc-";
  this.imagePrefix = b.defaultImagePrefix;
  this.statuslineheight = b.SVStatuslineheight;
  this.statuslineCSS = b.SVStatuslineCSS;
  this.sheet = new SocialCalc.Sheet;
  this.context = new SocialCalc.RenderContext(this.sheet);
  if (!0 == SocialCalc._app || !0 == SocialCalc._view) {
    b.defaultImagePrefix = this.imagePrefix = "../" + this.imagePrefix;
  }
  !0 == SocialCalc._app ? (this.context.showGrid = !1, this.context.showRCHeaders = !1) : (this.context.showGrid = !0, this.context.showRCHeaders = !0);
  this.editor = new SocialCalc.TableEditor(this.context);
  this.editor.noEdit = !0;
  this.editor.StatusCallback.statusline = {func:SocialCalc.SpreadsheetViewerStatuslineCallback, params:{}};
  this.hasStatusLine = !0;
  this.statuslineHTML = '<table cellspacing="0" cellpadding="0"><tr><td width="100%" style="overflow:hidden;">{status}</td><td>&nbsp;</td></tr></table>';
  this.noRecalc = this.statuslineFull = !0;
  this.repeatingMacroTimer = null;
  this.repeatingMacroInterval = 60;
  this.repeatingMacroCommands = "";
  SocialCalc.CurrentSpreadsheetViewerObject = this;
};
SocialCalc.SpreadsheetViewer.prototype.InitializeSpreadsheetViewer = function(a, b, c, d) {
  return SocialCalc.InitializeSpreadsheetViewer(this, a, b, c, d);
};
SocialCalc.SpreadsheetViewer.prototype.LoadSave = function(a) {
  return SocialCalc.SpreadsheetViewerLoadSave(this, a);
};
SocialCalc.SpreadsheetViewer.prototype.DoOnResize = function() {
  return SocialCalc.DoOnResize(this);
};
SocialCalc.SpreadsheetViewer.prototype.SizeSSDiv = function() {
  return SocialCalc.SizeSSDiv(this);
};
SocialCalc.SpreadsheetViewer.prototype.DecodeSpreadsheetSave = function(a) {
  return SocialCalc.SpreadsheetViewerDecodeSpreadsheetSave(this, a);
};
SocialCalc.SpreadsheetViewer.prototype.ParseSheetSave = function(a) {
  return this.sheet.ParseSheetSave(a);
};
SocialCalc.InitializeSpreadsheetViewer = function(a, b, c, d, e) {
  a.requestedHeight = c;
  a.requestedWidth = d;
  a.requestedSpaceBelow = e;
  "string" == typeof b && (b = document.getElementById(b));
  null == b && alert("SocialCalc.SpreadsheetControl not given parent node.");
  a.parentNode = b;
  a.spreadsheetDiv = document.createElement("div");
  a.SizeSSDiv();
  for (c = b.firstChild;null != c;c = b.firstChild) {
    b.removeChild(c);
  }
  b.appendChild(a.spreadsheetDiv);
  a.nonviewheight = a.hasStatusLine ? a.statuslineheight : 0;
  a.viewheight = a.height - a.nonviewheight;
  a.editorDiv = a.editor.CreateTableEditor(a.width, a.viewheight);
  a.spreadsheetDiv.appendChild(a.editorDiv);
  a.hasStatusLine && (a.statuslineDiv = document.createElement("div"), a.statuslineDiv.style.cssText = a.statuslineCSS, a.statuslineDiv.style.height = a.statuslineheight - (a.statuslineDiv.style.paddingTop.slice(0, -2) - 0) - (a.statuslineDiv.style.paddingBottom.slice(0, -2) - 0) + "px", a.statuslineDiv.id = a.idPrefix + "statusline", a.spreadsheetDiv.appendChild(a.statuslineDiv), a.editor.StatusCallback.statusline = {func:SocialCalc.SpreadsheetViewerStatuslineCallback, params:{spreadsheetobj:a}});
  !0 == SocialCalc._app && (a.formDataViewer = new SocialCalc.SpreadsheetViewer("te_FormData-"), a.formDataViewer.sheet.statuscallback = null, SocialCalc.CurrentSpreadsheetViewerObject = a);
};
SocialCalc.SpreadsheetViewerLoadSave = function(a, b) {
  var c, d, e;
  if (c = a.DecodeSpreadsheetSave(b)) {
    c.sheet && (a.sheet.ResetSheet(), a.sheet.ParseSheetSave(b.substring(c.sheet.start, c.sheet.end))), c.edit && a.editor.LoadEditorSettings(b.substring(c.edit.start, c.edit.end)), c.startupmacro && a.editor.EditorScheduleSheetCommands(b.substring(c.startupmacro.start, c.startupmacro.end), !1, !0), c.repeatingmacro && (c = b.substring(c.repeatingmacro.start, c.repeatingmacro.end), c = c.replace("\r", ""), d = c.indexOf("\n"), 0 < d && (e = c.substring(0, d) - 0, a.repeatingMacroInterval = e, a.repeatingMacroCommands = 
    c.substring(d + 1), 0 < e && (a.repeatingMacroTimer = window.setTimeout(SocialCalc.SpreadsheetViewerDoRepeatingMacro, 1E3 * a.repeatingMacroInterval))));
  }
  "off" == a.editor.context.sheetobj.attribs.recalc || a.noRecalc ? a.editor.ScheduleRender() : a.editor.EditorScheduleSheetCommands("recalc");
};
SocialCalc.SpreadsheetViewerDoRepeatingMacro = function() {
  var a = SocialCalc.GetSpreadsheetViewerObject(), b = a.editor;
  a.repeatingMacroTimer = null;
  SocialCalc.SheetCommandInfo.CmdExtensionCallbacks.repeatmacro = {func:SocialCalc.SpreadsheetViewerRepeatMacroCommand, data:null};
  b.EditorScheduleSheetCommands(a.repeatingMacroCommands);
};
SocialCalc.SpreadsheetViewerRepeatMacroCommand = function(a, b, c, d, e) {
  a = SocialCalc.GetSpreadsheetViewerObject();
  d = d.RestOfString() - 0;
  0 < d || (d = a.repeatingMacroInterval);
  a.repeatingMacroInterval = d;
  a.repeatingMacroTimer = window.setTimeout(SocialCalc.SpreadsheetViewerDoRepeatingMacro, 1E3 * a.repeatingMacroInterval);
};
SocialCalc.SpreadsheetViewerStopRepeatingMacro = function() {
  var a = SocialCalc.GetSpreadsheetViewerObject();
  a.repeatingMacroTimer && (window.clearTimeout(a.repeatingMacroTimer), a.repeatingMacroTimer = null);
};
SocialCalc.SpreadsheetViewerDoButtonCmd = function(a, b, c) {
  a = c.element;
  c = c.functionobj.command;
  b = SocialCalc.GetSpreadsheetViewerObject().editor;
  switch(c) {
    case "recalc":
      b.EditorScheduleSheetCommands("recalc");
  }
  a && a.blur && a.blur();
  SocialCalc.KeyboardFocus();
};
SocialCalc.LocalizeString = function(a) {
  var b = SocialCalc.LocalizeStringList[a];
  b || (b = SocialCalc.Constants["s_loc_" + a.toLowerCase().replace(/\s/g, "_").replace(/\W/g, "X")] || a, SocialCalc.LocalizeStringList[a] = b);
  return b;
};
SocialCalc.LocalizeStringList = {};
SocialCalc.LocalizeSubstrings = function(a) {
  var b = SocialCalc.LocalizeString;
  return a.replace(/%(loc|ssc)!(.*?)!/g, function(a, d, e) {
    return "ssc" == d ? SocialCalc.Constants[e] || alert("Missing constant: " + e) : b(e);
  });
};
SocialCalc.GetSpreadsheetViewerObject = function() {
  var a = SocialCalc.CurrentSpreadsheetViewerObject;
  if (a) {
    return a;
  }
  throw "No current SpreadsheetViewer object.";
};
SocialCalc.DoOnResize = function(a) {
  var b, c = a.views;
  if (a.SizeSSDiv()) {
    for (vname in c) {
      b = c[vname].element, b.style.width = a.width + "px", b.style.height = a.height - a.nonviewheight + "px";
    }
    a.editor.ResizeTableEditor(a.width, a.height - a.nonviewheight);
  }
};
SocialCalc.SizeSSDiv = function(a) {
  var b, c, d, e;
  d = !1;
  b = SocialCalc.GetViewportInfo();
  c = SocialCalc.GetElementPosition(a.parentNode);
  c.bottom = 0;
  c.right = 0;
  e = a.parentNode.style;
  e.marginTop && (c.top += e.marginTop.slice(0, -2) - 0);
  e.marginBottom && (c.bottom += e.marginBottom.slice(0, -2) - 0);
  e.marginLeft && (c.left += e.marginLeft.slice(0, -2) - 0);
  e.marginRight && (c.right += e.marginRight.slice(0, -2) - 0);
  e = a.requestedHeight || b.height - (c.top + c.bottom + 10) - (a.requestedSpaceBelow || 0);
  a.height != e && (a.height = e, a.spreadsheetDiv.style.height = e + "px", d = !0);
  e = a.requestedWidth || b.width - (c.left + c.right + 10) || 700;
  a.width != e && (a.width = e, a.spreadsheetDiv.style.width = e + "px", d = !0);
  a.spreadsheetDiv.style.position = "relative";
  return d;
};
SocialCalc.SpreadsheetViewerStatuslineCallback = function(a, b, c, d) {
  var e = d.spreadsheetobj, f = "";
  e && e.statuslineDiv && (f = e.statuslineFull ? a.GetStatuslineString(b, c, d) : a.ecell.coord, f = e.statuslineHTML.replace(/\{status\}/, f), e.statuslineDiv.innerHTML = f);
};
SocialCalc.CmdGotFocus = function(a) {
  SocialCalc.Keyboard.passThru = a;
};
SocialCalc.SpreadsheetViewerCreateSheetHTML = function(a) {
  var b, c;
  b = "";
  b = new SocialCalc.RenderContext(a.sheet);
  a = document.createElement("div");
  c = b.RenderSheet(null, {type:"html"});
  a.appendChild(c);
  delete b;
  b = a.innerHTML;
  delete c;
  delete a;
  return b;
};
SocialCalc.SpreadsheetViewerDecodeSpreadsheetSave = function(a, b) {
  var c, d, e, f, g, h, l, n = {}, p = [];
  /[^\n]\r[^\n]/.test(b) && (b = b.replace(/([^\n])\r([^\n])/g, "$1\r\n$2"));
  c = b.search(/^MIME-Version:\s1\.0/mi);
  if (0 > c) {
    return n;
  }
  d = /^Content-Type:\s*multipart\/mixed;\s*boundary=(\S+)/mig;
  d.lastIndex = c;
  e = d.exec(b);
  if (0 >= d.lastIndex) {
    return n;
  }
  c = e[1];
  f = RegExp("^--" + c + "(?:\r\n|\n)", "mg");
  f.lastIndex = d.lastIndex;
  f.exec(b);
  d = /(?:\r\n|\n)(?:\r\n|\n)/gm;
  d.lastIndex = f.lastIndex;
  e = d.exec(b);
  if (!e) {
    return n;
  }
  g = d.lastIndex;
  f.lastIndex = g;
  e = f.exec(b);
  if (!e) {
    return n;
  }
  e = e.index;
  g = b.substring(g, e).split(/\r\n|\n/);
  for (h = 0;h < g.length;h++) {
    switch(line = g[h], l = line.split(":"), l[0]) {
      case "part":
        p.push(l[1]);
    }
  }
  for (pnum = 0;pnum < p.length;pnum++) {
    d.lastIndex = e;
    e = d.exec(b);
    if (!e) {
      break;
    }
    g = d.lastIndex;
    pnum == p.length - 1 && (f = RegExp("^--" + c + "--$", "mg"));
    f.lastIndex = g;
    e = f.exec(b);
    if (!e) {
      break;
    }
    e = e.index;
    n[p[pnum]] = {start:g, end:e};
  }
  return n;
};
(function() {
  Class = function(a, b) {
    if (!a) {
      throw "Class requires a class definition string as its first argument";
    }
    if (!b) {
      throw "Class requires a class wrapper function as its second argument";
    }
    if (!a.match(/^([\w\.]+)(?:\(\s*([\w\.]+)\s*\))?(?:\s+(.*?)\s*)?$/)) {
      throw "Can't parse Class Definition: '" + a + "'";
    }
    var c = RegExp.$1, d = RegExp.$2 || "", e = [];
    RegExp.$3 && (e = RegExp.$3.split(/\s+/));
    for (var f = [], g = !0, h = 0, l = e.length;h < l;h++) {
      var n = e[h];
      "-nostrict" == n && (g = !1);
      n.match(/^-inc=(.+)$/) && (f = RegExp.$1.split(","));
    }
    for (var e = c.split("."), p = Class.global, h = 0;h < e.length;h++) {
      p[e[h]] || (p[e[h]] = function() {
        try {
          this.init();
        } catch (a) {
        }
      }), p = p[e[h]];
    }
    p.className = c;
    p.isa = function(a) {
      if (p.baseClassName = a) {
        p.prototype = eval("new " + a + "()"), p.prototype.superFunc = function(b) {
          return eval(a).prototype[b];
        };
      }
    };
    p.isa(d);
    p.global = Class.global;
    p.addGlobal = function() {
      this.newGlobals++;
      return Class.global;
    };
    p.extend = function(a) {
      if ("object" != typeof a) {
        throw "extend requires an object of name:value pairs";
      }
      for (var b in a) {
        p.prototype[b] = a[b];
      }
    };
    c = 0;
    for (d = f.length;c < d;c++) {
      h = f[c], f[c] = "proto" == h ? p.prototype : "this" == h ? p : Class.global[h];
    }
    g ? Class.eval_strict(b, p, f) : b.apply(p, f);
    return p;
  };
})();
Class.global = this;
Class.eval_strict = function(a, b, c) {
  var d = 0, e;
  for (e in Class.global) {
    d++;
  }
  b.newGlobals = 0;
  a.apply(b, c);
  a = 0;
  for (e in Class.global) {
    a++;
  }
  if (d + b.newGlobals != a) {
    throw "Class '" + b.className + "' defines " + (a - d) + " new global JavaScript variables without using this.addGlobal()";
  }
  delete b.newGlobals;
};
Class("Document.Emitter", function() {
  var a = this.prototype;
  a.className = "Document.Emitter";
  a.instantiate = function() {
    return eval("new " + this.className + "()");
  };
  a.init = function() {
    this.output = "";
  };
  a.content = function() {
    return this.output;
  };
  a.insert = function(a) {
    this.output += a.output;
  };
});
Class("Document.Emitter.HTML(Document.Emitter)", function() {
  var a = this.prototype;
  a.className = "Document.Emitter.HTML";
  a.begin_node = function(a) {
    var c = a.type;
    switch(c) {
      case "asis":
      ;
      case "line":
        break;
      case "br":
      ;
      case "hr":
        this.output += "<" + c + " />";
        break;
      case "html":
        this.output += '<span class="wafl">Raw HTML section. Edit in Wiki Text mode.</span>';
        break;
      case "waflparagraph":
      ;
      case "waflphrase":
      ;
      case "im":
        if (a._wafl.match(/^image:\s*(\S+)(?:\s+size=(\w+))?/)) {
          a = "if (typeof(ss) != 'undefined' && ss.editor) { var recalc = function () { try { ss.editor.DoPositionCalculations() } catch (e) { setTimeout(recalc, 500) } }; recalc() } if (!window.image_dimension_cache) window.image_dimension_cache = {};window.image_dimension_cache['/data/wafl/" + a._label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "\\'").replace(/\\/g, "\\\\") + "'] = [ this.offsetWidth, this.offsetHeight ]; this.style.width = this.offsetWidth + 'px'; this.style.height = this.offsetHeight + 'px'";
          var c = RegExp.$1, d = RegExp.$2;
          switch(d) {
            case "small":
              d = "100";
              break;
            case "medium":
              d = "300";
              break;
            case "large":
              d = "600";
          }
          d && (d = ' width="' + d + '"');
          this.output += '<img src="' + c.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + '" onload="' + a + '"' + d + " />";
          break;
        }
        this.output += '<span class="wafl">' + a._label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "\\'").replace(/\\/g, "\\\\") + "</span>";
        break;
      case "a":
      ;
      case "wikilink":
        this.output += '<a href="' + encodeURI(a._href) + '">';
        break;
      case "file":
        this.output += '<a title="(network resource)" href="' + encodeURI(a._href) + '">';
        break;
      case "ul":
      ;
      case "ol":
      ;
      case "table":
      ;
      case "tr":
        this.output += "<" + c + ">\n";
        break;
      default:
        this.output += "<" + c + ">";
    }
  };
  a.end_node = function(a) {
    a = a.type;
    switch(a) {
      case "asis":
      ;
      case "br":
      ;
      case "hr":
      ;
      case "html":
      ;
      case "waflparagraph":
      ;
      case "waflphrase":
      ;
      case "im":
        break;
      case "line":
        this.output += "<br />";
        break;
      case "file":
      ;
      case "wikilink":
        this.output += "</a>";
        break;
      default:
        0 == a.search(/^(?:p|ul|ol|li|h\d|table|tr|td)$/) ? this.output += "</" + a + ">\n" : this.output += "</" + a + ">";
    }
  };
  a.text_node = function(a) {
    this.output += a.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  };
});
Class("Document.Parser", function() {
  var a = this.prototype;
  a.className = "Document.Parser";
  a.init = function() {
  };
  a.parse = function(a, c) {
    this.input = -1 == a.search(/\n$/) ? a + "\n" : a;
    c && (this.receiver = c);
    this.receiver.init();
    this.grammar = this.create_grammar();
    this.parse_blocks("top");
    return this.receiver.content();
  };
  a.create_grammar = function() {
    throw "Please define create_grammar in a derived class of Document.Parser.";
  };
  a.parse_blocks = function(a) {
    if (a = this.grammar[a].blocks) {
      for (;this.input.length;) {
        for (var c = this.input.length, d = 0;d < a.length;d++) {
          var e = a[d], f = this.find_match("matched_block", e);
          if (f) {
            this.input = this.input.substr(f.end);
            this.handle_match(e, f);
            break;
          }
        }
        if (this.input.length >= c) {
          throw this.classname + ": Reduction error for:\n" + this.input + "\n" + JSON.stringify(this);
        }
      }
    }
  };
  a.handle_match = function(a, c) {
    var d = this.grammar[a];
    this.subparse(d.blocks ? "parse_blocks" : "parse_phrases", c, a, d.filter);
  };
  a.find_match = function(a, c) {
    var d = this.grammar[c].match;
    if (!d) {
      throw "no regexp for type: " + c;
    }
    if (d = this.input.match(d)) {
      return d = this[a].call(this, d, this.grammar[c].lookbehind), d.type = this.grammar[c].type || c, d;
    }
  };
  a.parse_phrases = function(a) {
    if (a = this.grammar[a].phrases) {
      for (;this.input.length;) {
        for (var c = null, d = 0;d < a.length;d++) {
          var e = this.find_match("matched_phrase", a[d]);
          if (e && (!c || e.begin < c.begin) && (c = e, 0 == c.begin)) {
            break;
          }
        }
        if (!c) {
          this.receiver.text_node(this.input || "");
          break;
        }
        0 != c.begin && this.receiver.text_node(this.input.substr(0, c.begin) || "");
        this.input = this.input.substr(c.end);
        this.handle_match(c.type, c);
      }
    } else {
      this.receiver.text_node(this.input || "");
    }
  };
  a.subparse = function(a, c, d, e) {
    c.type = this.grammar[d].type;
    null == c.type && (c.type = d);
    e = e ? e(c) : null;
    c.type && this.receiver.begin_node(c);
    var f = eval("new " + this.className + "()");
    f.input = null == e ? c.text : e;
    f.grammar = this.grammar;
    f.receiver = this.receiver.instantiate();
    f[a].call(f, d);
    this.receiver.insert(f.receiver);
    c.type && this.receiver.end_node(c);
  };
  a.matched_block = function(a) {
    return{begin:a.index, text:a[1], end:a[0].length, 1:a[2], 2:a[3], 3:a[4]};
  };
  a.matched_phrase = function(a, c) {
    if (c) {
      var d = a[2], e = this.input.indexOf(a[1]);
      return{text:d, begin:e, end:e + a[1].length, 1:RegExp.$2, 2:RegExp.$3, 3:RegExp.$4};
    }
    return{begin:a.index, text:a[1], end:a.index + a[0].length, 1:a[2], 2:a[3], 3:a[4]};
  };
});
Class("Document.Parser.Wikitext(Document.Parser)", function() {
  var a = this.prototype;
  a.className = "Document.Parser.Wikitext";
  a.init = function() {
  };
  a.create_grammar = function() {
    var a = "pre html hr hx waflparagraph ul ol blockquote p empty else".split(" "), c = "waflphrase asis wikilink wikilink2 a im mail file tt b i del a".split(" "), d = function(a, b) {
      b = "\\" + (b || a);
      a = "\\" + a;
      return{match:RegExp("(?:^|[^" + a + "\\w])(" + a + "(?=\\S)(?!" + b + ")(.*?)" + b + "(?=[^" + b + "\\w]|$))"), phrases:"\\`" == a ? null : c, lookbehind:!0};
    }, e = {yahoo:"yahoo", ymsgr:"yahoo", callto:"callto", callme:"callto", skype:"callto", aim:"aim"}, f = {aim:"AIM: %1", yahoo:"Yahoo: %1", callto:"Skype: %1"}, g = "(\\b(", h;
    for (h in e) {
      g += h + "|";
    }
    g = g.replace(/\|$/, ")\\:([^\\s\\>\\)]+))");
    h = function(a, b) {
      var c = RegExp("(^|\n)" + b + " *", "g");
      return{match:RegExp("^(" + a + "+ .*\n(?:[*-+#]+ .*\n)*)(?:s*\n)?"), blocks:["ul", "ol", "subl", "li"], filter:function(a) {
        return a.text.replace(c, "$1");
      }};
    };
    return{_all_blocks:a, _all_phrases:c, top:{blocks:a}, ol:h("#", "[*#]"), ul:h("[-+*]", "[-+*#]"), blockquote:{match:/^((?:>[^\n]*\n)+)(?:\s*\n)?/, blocks:["blockquote", "line"], filter:function(a) {
      return a.text.replace(/(^|\n)>\ ?/g, "$1");
    }}, line:{match:/([^\n]*)\n/, phrases:c}, subl:{type:"li", match:/^(([^\n]*)\n[*#]+\ [^\n]*\n(?:[*#]+\ [^\n]*\n)*)(?:\s*\n)?/, blocks:["ul", "ol", "li2"]}, li:{match:/([^\n]*)\n/, phrases:c}, li2:{type:"", match:/([^\n]*)\n/, phrases:c}, html:{match:/^(\.html\ *\n(?:[^\n]*\n)*?\.html)\ *\n(?:\s*\n)?/, filter:function(a) {
      a._html = a.text;
      return "";
    }}, pre:{match:/^\.pre\ *\n((?:[^\n]*\n)*?)\.pre\ *\n(?:\s*\n)?/}, hr:{match:/^--+(?:\s*\n)?/}, hx:{match:/^((\^+) *([^\n]*?)(\s+=+)?\s*?\n+)/, phrases:c, filter:function(a) {
      a.type = "h" + a["1"].length;
      return a[2];
    }}, p:{match:/^((?:(?!(?:(?:\^+|\#+|\*+|\-+) |\>|\.\w+\s*\n|\{[^\}]+\}\s*\n))[^\n]*\S[^\n]*\n)+(?:(?=^|\n)\s*\n)*)/, phrases:c, filter:function(a) {
      return a.text.replace(/\n$/, "");
    }}, empty:{match:/^(\s*\n)/, filter:function(a) {
      a.type = "";
    }}, "else":{match:/^(([^\n]*)\n)/, phrases:[], filter:function(a) {
      a.type = "p";
    }}, waflparagraph:{match:/^\{(.*)\}[\ \t]*\n(?:\s*\n)?/, filter:function(a) {
      a._wafl = a._label = a.text;
      return "";
    }}, waflphrase:{match:/(?:^|[\s\-])((?:"([^\n]+?)")?\{([\w-]+(?=[\:\ \}])(?:\s*:)?\s*[^\n]*?\s*)\}(?=[\W_]|$))/, filter:function(a) {
      a._wafl = a[2];
      a._label = a[1] || a._wafl;
      return "";
    }, lookbehind:!0}, asis:{match:/(\{\{([^\n]*?)\}\}(\}*))/, filter:function(a) {
      a.type = "";
      return a[1] + a[2];
    }}, wikilink:{match:/(?:^|[_\W])(\[()(?=[^\s\[\]])(.*?)\](?=[_\W]|$))/, filter:function(a) {
      a._href = "?" + a[2];
      return a.text || a[2];
    }, lookbehind:!0}, wikilink2:{type:"wikilink", match:/(?:"([^"]*)"\s*)(\[(?=[^\s\[\]])(.*?)\](?=[_\W]|$))/, filter:function(a) {
      a._href = "?" + a[2];
      return a[1] || a[2];
    }}, a:{match:/((?:"([^"]*)"\s*)?<?((?:http|https|ftp|irc|file):(?:\/\/)?[\;\/\?\:\@\&\=\+\$\,\[\]\#A-Za-z0-9\-\_\.\!\~\*\'\(\)]+[A-Za-z0-9\/#])>?)/, filter:function(a) {
      a._href = a[2];
      return a[1] || a[2];
    }}, file:{match:/((?:"([^"]*)")?<(\\\\[^\s\>\)]+)>)/, filter:function(a) {
      var b = a[2].replace(/^\\\\/, "");
      a._href = "file://" + b.replace(/\\/g, "/");
      return a["1"] || b;
    }}, im:{match:RegExp(g), filter:function(a) {
      a._wafl = a[1] + ": " + a[2];
      a._label = (f[e[a[1]]] || "%1").replace(/%1/g, a[2]);
      return "";
    }}, mail:{match:/([\w+%\-\.]+@(?:[\w\-]+\.)+[\w\-]+)/, filter:function(a) {
      a.type = "a";
      a._href = "mailto:" + a.text.replace(/%/g, "%25");
    }}, tt:d("`"), b:d("*"), i:d("_"), del:d("-")};
  };
});
!function(a, b) {
  "object" == typeof module && "object" == typeof module.exports ? module.exports = a.document ? b(a, !0) : function(a) {
    if (!a.document) {
      throw Error("jQuery requires a window with a document");
    }
    return b(a);
  } : b(a);
}("undefined" != typeof window ? window : this, function(a, b) {
  function c(a) {
    var b = a.length, c = m.type(a);
    return "function" === c || m.isWindow(a) ? !1 : 1 === a.nodeType && b ? !0 : "array" === c || 0 === b || "number" == typeof b && 0 < b && b - 1 in a;
  }
  function d(a, b, c) {
    if (m.isFunction(b)) {
      return m.grep(a, function(a, d) {
        return!!b.call(a, d, a) !== c;
      });
    }
    if (b.nodeType) {
      return m.grep(a, function(a) {
        return a === b !== c;
      });
    }
    if ("string" == typeof b) {
      if (Hb.test(b)) {
        return m.filter(b, a, c);
      }
      b = m.filter(b, a);
    }
    return m.grep(a, function(a) {
      return 0 <= m.inArray(a, b) !== c;
    });
  }
  function e(a, b) {
    do {
      a = a[b];
    } while (a && 1 !== a.nodeType);
    return a;
  }
  function f(a) {
    var b = bb[a] = {};
    return m.each(a.match(Z) || [], function(a, c) {
      b[c] = !0;
    }), b;
  }
  function g() {
    E.addEventListener ? (E.removeEventListener("DOMContentLoaded", h, !1), a.removeEventListener("load", h, !1)) : (E.detachEvent("onreadystatechange", h), a.detachEvent("onload", h));
  }
  function h() {
    (E.addEventListener || "load" === event.type || "complete" === E.readyState) && (g(), m.ready());
  }
  function l(a, b, c) {
    if (void 0 === c && 1 === a.nodeType) {
      var d = "data-" + b.replace(Ib, "-$1").toLowerCase();
      if (c = a.getAttribute(d), "string" == typeof c) {
        try {
          c = "true" === c ? !0 : "false" === c ? !1 : "null" === c ? null : +c + "" === c ? +c : Jb.test(c) ? m.parseJSON(c) : c;
        } catch (e) {
        }
        m.data(a, b, c);
      } else {
        c = void 0;
      }
    }
    return c;
  }
  function n(a) {
    for (var b in a) {
      if (("data" !== b || !m.isEmptyObject(a[b])) && "toJSON" !== b) {
        return!1;
      }
    }
    return!0;
  }
  function p(a, b, c, d) {
    if (m.acceptData(a)) {
      var e, f, g = m.expando, h = a.nodeType, l = h ? m.cache : a, n = h ? a[g] : a[g] && g;
      if (n && l[n] && (d || l[n].data) || void 0 !== c || "string" != typeof b) {
        return n || (n = h ? a[g] = T.pop() || m.guid++ : g), l[n] || (l[n] = h ? {} : {toJSON:m.noop}), ("object" == typeof b || "function" == typeof b) && (d ? l[n] = m.extend(l[n], b) : l[n].data = m.extend(l[n].data, b)), f = l[n], d || (f.data || (f.data = {}), f = f.data), void 0 !== c && (f[m.camelCase(b)] = c), "string" == typeof b ? (e = f[b], null == e && (e = f[m.camelCase(b)])) : e = f, e;
      }
    }
  }
  function r(a, b, c) {
    if (m.acceptData(a)) {
      var d, e, f = a.nodeType, g = f ? m.cache : a, h = f ? a[m.expando] : m.expando;
      if (g[h]) {
        if (b && (d = c ? g[h] : g[h].data)) {
          m.isArray(b) ? b = b.concat(m.map(b, m.camelCase)) : b in d ? b = [b] : (b = m.camelCase(b), b = b in d ? [b] : b.split(" "));
          for (e = b.length;e--;) {
            delete d[b[e]];
          }
          if (c ? !n(d) : !m.isEmptyObject(d)) {
            return;
          }
        }
        (c || (delete g[h].data, n(g[h]))) && (f ? m.cleanData([a], !0) : x.deleteExpando || g != g.window ? delete g[h] : g[h] = null);
      }
    }
  }
  function s() {
    return!0;
  }
  function q() {
    return!1;
  }
  function t() {
    try {
      return E.activeElement;
    } catch (a) {
    }
  }
  function u(a) {
    var b = cb.split("|");
    a = a.createDocumentFragment();
    if (a.createElement) {
      for (;b.length;) {
        a.createElement(b.pop());
      }
    }
    return a;
  }
  function v(a, b) {
    var c, d, e = 0, f = typeof a.getElementsByTagName !== W ? a.getElementsByTagName(b || "*") : typeof a.querySelectorAll !== W ? a.querySelectorAll(b || "*") : void 0;
    if (!f) {
      for (f = [], c = a.childNodes || a;null != (d = c[e]);e++) {
        !b || m.nodeName(d, b) ? f.push(d) : m.merge(f, v(d, b));
      }
    }
    return void 0 === b || b && m.nodeName(a, b) ? m.merge([a], f) : f;
  }
  function A(a) {
    Ia.test(a.type) && (a.defaultChecked = a.checked);
  }
  function w(a, b) {
    return m.nodeName(a, "table") && m.nodeName(11 !== b.nodeType ? b : b.firstChild, "tr") ? a.getElementsByTagName("tbody")[0] || a.appendChild(a.ownerDocument.createElement("tbody")) : a;
  }
  function z(a) {
    return a.type = (null !== m.find.attr(a, "type")) + "/" + a.type, a;
  }
  function y(a) {
    var b = Kb.exec(a.type);
    return b ? a.type = b[1] : a.removeAttribute("type"), a;
  }
  function C(a, b) {
    for (var c, d = 0;null != (c = a[d]);d++) {
      m._data(c, "globalEval", !b || m._data(b[d], "globalEval"));
    }
  }
  function G(a, b) {
    if (1 === b.nodeType && m.hasData(a)) {
      var c, d, e;
      d = m._data(a);
      var f = m._data(b, d), g = d.events;
      if (g) {
        for (c in delete f.handle, f.events = {}, g) {
          for (d = 0, e = g[c].length;e > d;d++) {
            m.event.add(b, c, g[c][d]);
          }
        }
      }
      f.data && (f.data = m.extend({}, f.data));
    }
  }
  function H(b, c) {
    var d = m(c.createElement(b)).appendTo(c.body), e = a.getDefaultComputedStyle ? a.getDefaultComputedStyle(d[0]).display : m.css(d[0], "display");
    return d.detach(), e;
  }
  function M(a) {
    var b = E, c = db[a];
    return c || (c = H(a, b), "none" !== c && c || (sa = (sa || m("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement), b = (sa[0].contentWindow || sa[0].contentDocument).document, b.write(), b.close(), c = H(a, b), sa.detach()), db[a] = c), c;
  }
  function Q(a, b) {
    return{get:function() {
      var c = a();
      if (null != c) {
        return c ? void delete this.get : (this.get = b).apply(this, arguments);
      }
    }};
  }
  function J(a, b) {
    if (b in a) {
      return b;
    }
    for (var c = b.charAt(0).toUpperCase() + b.slice(1), d = b, e = eb.length;e--;) {
      if (b = eb[e] + c, b in a) {
        return b;
      }
    }
    return d;
  }
  function N(a, b) {
    for (var c, d, e, f = [], g = 0, h = a.length;h > g;g++) {
      d = a[g], d.style && (f[g] = m._data(d, "olddisplay"), c = d.style.display, b ? (f[g] || "none" !== c || (d.style.display = ""), "" === d.style.display && ta(d) && (f[g] = m._data(d, "olddisplay", M(d.nodeName)))) : f[g] || (e = ta(d), (c && "none" !== c || !e) && m._data(d, "olddisplay", e ? c : m.css(d, "display"))));
    }
    for (g = 0;h > g;g++) {
      d = a[g], d.style && (b && "none" !== d.style.display && "" !== d.style.display || (d.style.display = b ? f[g] || "" : "none"));
    }
    return a;
  }
  function D(a, b, c) {
    return(a = Lb.exec(b)) ? Math.max(0, a[1] - (c || 0)) + (a[2] || "px") : b;
  }
  function B(a, b, c, d, e) {
    b = c === (d ? "border" : "content") ? 4 : "width" === b ? 1 : 0;
    for (var f = 0;4 > b;b += 2) {
      "margin" === c && (f += m.css(a, c + ka[b], !0, e)), d ? ("content" === c && (f -= m.css(a, "padding" + ka[b], !0, e)), "margin" !== c && (f -= m.css(a, "border" + ka[b] + "Width", !0, e))) : (f += m.css(a, "padding" + ka[b], !0, e), "padding" !== c && (f += m.css(a, "border" + ka[b] + "Width", !0, e)));
    }
    return f;
  }
  function Y(a, b, c) {
    var d = !0, e = "width" === b ? a.offsetWidth : a.offsetHeight, f = la(a), g = x.boxSizing() && "border-box" === m.css(a, "boxSizing", !1, f);
    if (0 >= e || null == e) {
      if (e = ea(a, b, f), (0 > e || null == e) && (e = a.style[b]), wa.test(e)) {
        return e;
      }
      d = g && (x.boxSizingReliable() || e === a.style[b]);
      e = parseFloat(e) || 0;
    }
    return e + B(a, b, c || (g ? "border" : "content"), d, f) + "px";
  }
  function I(a, b, c, d, e) {
    return new I.prototype.init(a, b, c, d, e);
  }
  function Xa() {
    return setTimeout(function() {
      fa = void 0;
    }), fa = m.now();
  }
  function va(a, b) {
    var c, d = {height:a}, e = 0;
    for (b = b ? 1 : 0;4 > e;e += 2 - b) {
      c = ka[e], d["margin" + c] = d["padding" + c] = a;
    }
    return b && (d.opacity = d.width = a), d;
  }
  function Ya(a, b, c) {
    for (var d, e = (ua[b] || []).concat(ua["*"]), f = 0, g = e.length;g > f;f++) {
      if (d = e[f].call(c, b, a)) {
        return d;
      }
    }
  }
  function Gb(a, b) {
    var c, d, e, f, g;
    for (c in a) {
      if (d = m.camelCase(c), e = b[d], f = a[c], m.isArray(f) && (e = f[1], f = a[c] = f[0]), c !== d && (a[d] = f, delete a[c]), g = m.cssHooks[d], g && "expand" in g) {
        for (c in f = g.expand(f), delete a[d], f) {
          c in a || (a[c] = f[c], b[c] = e);
        }
      } else {
        b[d] = e;
      }
    }
  }
  function Za(a, b, c) {
    var d, e = 0, f = xa.length, g = m.Deferred().always(function() {
      delete h.elem;
    }), h = function() {
      if (d) {
        return!1;
      }
      for (var b = fa || Xa(), b = Math.max(0, l.startTime + l.duration - b), c = 1 - (b / l.duration || 0), e = 0, f = l.tweens.length;f > e;e++) {
        l.tweens[e].run(c);
      }
      return g.notifyWith(a, [l, c, b]), 1 > c && f ? b : (g.resolveWith(a, [l]), !1);
    }, l = g.promise({elem:a, props:m.extend({}, b), opts:m.extend(!0, {specialEasing:{}}, c), originalProperties:b, originalOptions:c, startTime:fa || Xa(), duration:c.duration, tweens:[], createTween:function(b, c) {
      var d = m.Tween(a, l.opts, b, c, l.opts.specialEasing[b] || l.opts.easing);
      return l.tweens.push(d), d;
    }, stop:function(b) {
      var c = 0, e = b ? l.tweens.length : 0;
      if (d) {
        return this;
      }
      for (d = !0;e > c;c++) {
        l.tweens[c].run(1);
      }
      return b ? g.resolveWith(a, [l, b]) : g.rejectWith(a, [l, b]), this;
    }});
    c = l.props;
    for (Gb(c, l.opts.specialEasing);f > e;e++) {
      if (b = xa[e].call(l, a, c, l.opts)) {
        return b;
      }
    }
    return m.map(c, Ya, l), m.isFunction(l.opts.start) && l.opts.start.call(a, l), m.fx.timer(m.extend(h, {elem:a, anim:l, queue:l.opts.queue})), l.progress(l.opts.progress).done(l.opts.done, l.opts.complete).fail(l.opts.fail).always(l.opts.always);
  }
  function $a(a) {
    return function(b, c) {
      "string" != typeof b && (c = b, b = "*");
      var d, e = 0, f = b.toLowerCase().match(Z) || [];
      if (m.isFunction(c)) {
        for (;d = f[e++];) {
          "+" === d.charAt(0) ? (d = d.slice(1) || "*", (a[d] = a[d] || []).unshift(c)) : (a[d] = a[d] || []).push(c);
        }
      }
    };
  }
  function ab(a, b, c, d) {
    function e(h) {
      var l;
      return f[h] = !0, m.each(a[h] || [], function(a, F) {
        var h = F(b, c, d);
        return "string" != typeof h || g || f[h] ? g ? !(l = h) : void 0 : (b.dataTypes.unshift(h), e(h), !1);
      }), l;
    }
    var f = {}, g = a === Ja;
    return e(b.dataTypes[0]) || !f["*"] && e("*");
  }
  function Ka(a, b) {
    var c, d, e = m.ajaxSettings.flatOptions || {};
    for (d in b) {
      void 0 !== b[d] && ((e[d] ? a : c || (c = {}))[d] = b[d]);
    }
    return c && m.extend(!0, a, c), a;
  }
  function La(a, b, c, d) {
    var e;
    if (m.isArray(b)) {
      m.each(b, function(b, e) {
        c || Mb.test(a) ? d(a, e) : La(a + "[" + ("object" == typeof e ? b : "") + "]", e, c, d);
      });
    } else {
      if (c || "object" !== m.type(b)) {
        d(a, b);
      } else {
        for (e in b) {
          La(a + "[" + e + "]", b[e], c, d);
        }
      }
    }
  }
  function fb() {
    try {
      return new a.XMLHttpRequest;
    } catch (b) {
    }
  }
  function gb(a) {
    return m.isWindow(a) ? a : 9 === a.nodeType ? a.defaultView || a.parentWindow : !1;
  }
  var T = [], aa = T.slice, hb = T.concat, Ma = T.push, ib = T.indexOf, ma = {}, Nb = ma.toString, ba = ma.hasOwnProperty, Na = "".trim, x = {}, m = function(a, b) {
    return new m.fn.init(a, b);
  }, Ob = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, Pb = /^-ms-/, Qb = /-([\da-z])/gi, Rb = function(a, b) {
    return b.toUpperCase();
  };
  m.fn = m.prototype = {jquery:"1.11.0", constructor:m, selector:"", length:0, toArray:function() {
    return aa.call(this);
  }, get:function(a) {
    return null != a ? 0 > a ? this[a + this.length] : this[a] : aa.call(this);
  }, pushStack:function(a) {
    a = m.merge(this.constructor(), a);
    return a.prevObject = this, a.context = this.context, a;
  }, each:function(a, b) {
    return m.each(this, a, b);
  }, map:function(a) {
    return this.pushStack(m.map(this, function(b, c) {
      return a.call(b, c, b);
    }));
  }, slice:function() {
    return this.pushStack(aa.apply(this, arguments));
  }, first:function() {
    return this.eq(0);
  }, last:function() {
    return this.eq(-1);
  }, eq:function(a) {
    var b = this.length;
    a = +a + (0 > a ? b : 0);
    return this.pushStack(0 <= a && b > a ? [this[a]] : []);
  }, end:function() {
    return this.prevObject || this.constructor(null);
  }, push:Ma, sort:T.sort, splice:T.splice};
  m.extend = m.fn.extend = function() {
    var a, b, c, d, e, f, g = arguments[0] || {}, h = 1, l = arguments.length, n = !1;
    "boolean" == typeof g && (n = g, g = arguments[h] || {}, h++);
    "object" == typeof g || m.isFunction(g) || (g = {});
    for (h === l && (g = this, h--);l > h;h++) {
      if (null != (e = arguments[h])) {
        for (d in e) {
          a = g[d], c = e[d], g !== c && (n && c && (m.isPlainObject(c) || (b = m.isArray(c))) ? (b ? (b = !1, f = a && m.isArray(a) ? a : []) : f = a && m.isPlainObject(a) ? a : {}, g[d] = m.extend(n, f, c)) : void 0 !== c && (g[d] = c));
        }
      }
    }
    return g;
  };
  m.extend({expando:"jQuery" + ("1.11.0" + Math.random()).replace(/\D/g, ""), isReady:!0, error:function(a) {
    throw Error(a);
  }, noop:function() {
  }, isFunction:function(a) {
    return "function" === m.type(a);
  }, isArray:Array.isArray || function(a) {
    return "array" === m.type(a);
  }, isWindow:function(a) {
    return null != a && a == a.window;
  }, isNumeric:function(a) {
    return 0 <= a - parseFloat(a);
  }, isEmptyObject:function(a) {
    for (var b in a) {
      return!1;
    }
    return!0;
  }, isPlainObject:function(a) {
    var b;
    if (!a || "object" !== m.type(a) || a.nodeType || m.isWindow(a)) {
      return!1;
    }
    try {
      if (a.constructor && !ba.call(a, "constructor") && !ba.call(a.constructor.prototype, "isPrototypeOf")) {
        return!1;
      }
    } catch (c) {
      return!1;
    }
    if (x.ownLast) {
      for (b in a) {
        return ba.call(a, b);
      }
    }
    for (b in a) {
    }
    return void 0 === b || ba.call(a, b);
  }, type:function(a) {
    return null == a ? a + "" : "object" == typeof a || "function" == typeof a ? ma[Nb.call(a)] || "object" : typeof a;
  }, globalEval:function(b) {
    b && m.trim(b) && (a.execScript || function(b) {
      a.eval.call(a, b);
    })(b);
  }, camelCase:function(a) {
    return a.replace(Pb, "ms-").replace(Qb, Rb);
  }, nodeName:function(a, b) {
    return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase();
  }, each:function(a, b, d) {
    var e, f = 0, g = a.length, h = c(a);
    if (d) {
      if (h) {
        for (;g > f && (e = b.apply(a[f], d), !1 !== e);f++) {
        }
      } else {
        for (f in a) {
          if (e = b.apply(a[f], d), !1 === e) {
            break;
          }
        }
      }
    } else {
      if (h) {
        for (;g > f && (e = b.call(a[f], f, a[f]), !1 !== e);f++) {
        }
      } else {
        for (f in a) {
          if (e = b.call(a[f], f, a[f]), !1 === e) {
            break;
          }
        }
      }
    }
    return a;
  }, trim:Na && !Na.call("\ufeff\u00a0") ? function(a) {
    return null == a ? "" : Na.call(a);
  } : function(a) {
    return null == a ? "" : (a + "").replace(Ob, "");
  }, makeArray:function(a, b) {
    var d = b || [];
    return null != a && (c(Object(a)) ? m.merge(d, "string" == typeof a ? [a] : a) : Ma.call(d, a)), d;
  }, inArray:function(a, b, c) {
    var d;
    if (b) {
      if (ib) {
        return ib.call(b, a, c);
      }
      d = b.length;
      for (c = c ? 0 > c ? Math.max(0, d + c) : c : 0;d > c;c++) {
        if (c in b && b[c] === a) {
          return c;
        }
      }
    }
    return-1;
  }, merge:function(a, b) {
    for (var c = +b.length, d = 0, e = a.length;c > d;) {
      a[e++] = b[d++];
    }
    if (c !== c) {
      for (;void 0 !== b[d];) {
        a[e++] = b[d++];
      }
    }
    return a.length = e, a;
  }, grep:function(a, b, c) {
    for (var d = [], e = 0, f = a.length, g = !c;f > e;e++) {
      c = !b(a[e], e), c !== g && d.push(a[e]);
    }
    return d;
  }, map:function(a, b, d) {
    var e, f = 0, g = a.length, h = [];
    if (c(a)) {
      for (;g > f;f++) {
        e = b(a[f], f, d), null != e && h.push(e);
      }
    } else {
      for (f in a) {
        e = b(a[f], f, d), null != e && h.push(e);
      }
    }
    return hb.apply([], h);
  }, guid:1, proxy:function(a, b) {
    var c, d, e;
    return "string" == typeof b && (e = a[b], b = a, a = e), m.isFunction(a) ? (c = aa.call(arguments, 2), d = function() {
      return a.apply(b || this, c.concat(aa.call(arguments)));
    }, d.guid = a.guid = a.guid || m.guid++, d) : void 0;
  }, now:function() {
    return+new Date;
  }, support:x});
  m.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(a, b) {
    ma["[object " + b + "]"] = b.toLowerCase();
  });
  var qa = function(a) {
    function b(a, c, d, e) {
      var f, g, F, h, l;
      if ((c ? c.ownerDocument || c : ca) !== J && I(c), c = c || J, d = d || [], !a || "string" != typeof a) {
        return d;
      }
      if (1 !== (h = c.nodeType) && 9 !== h) {
        return[];
      }
      if (N && !e) {
        if (f = xa.exec(a)) {
          if (F = f[1]) {
            if (9 === h) {
              if (g = c.getElementById(F), !g || !g.parentNode) {
                return d;
              }
              if (g.id === F) {
                return d.push(g), d;
              }
            } else {
              if (c.ownerDocument && (g = c.ownerDocument.getElementById(F)) && Aa(c, g) && g.id === F) {
                return d.push(g), d;
              }
            }
          } else {
            if (f[2]) {
              return na.apply(d, c.getElementsByTagName(a)), d;
            }
            if ((F = f[3]) && y.getElementsByClassName && c.getElementsByClassName) {
              return na.apply(d, c.getElementsByClassName(F)), d;
            }
          }
        }
        if (y.qsa && (!X || !X.test(a))) {
          if (g = f = R, F = c, l = 9 === h && a, 1 === h && "object" !== c.nodeName.toLowerCase()) {
            h = q(a);
            (f = c.getAttribute("id")) ? g = f.replace(ya, "\\$&") : c.setAttribute("id", g);
            g = "[id='" + g + "'] ";
            for (F = h.length;F--;) {
              h[F] = g + s(h[F]);
            }
            F = ma.test(a) && n(c.parentNode) || c;
            l = h.join(",");
          }
          if (l) {
            try {
              return na.apply(d, F.querySelectorAll(l)), d;
            } catch (m) {
            } finally {
              f || c.removeAttribute("id");
            }
          }
        }
      }
      var L;
      a: {
        a = a.replace(ba, "$1");
        var K, P;
        g = q(a);
        if (!e && 1 === g.length) {
          if (L = g[0] = g[0].slice(0), 2 < L.length && "ID" === (K = L[0]).type && y.getById && 9 === c.nodeType && N && x.relative[L[1].type]) {
            if (c = (x.find.ID(K.matches[0].replace(oa, pa), c) || [])[0], !c) {
              L = d;
              break a;
            }
            a = a.slice(L.shift().value.length);
          }
          for (h = ga.needsContext.test(a) ? 0 : L.length;h-- && (K = L[h], !x.relative[f = K.type]);) {
            if ((P = x.find[f]) && (e = P(K.matches[0].replace(oa, pa), ma.test(L[0].type) && n(c.parentNode) || c))) {
              if (L.splice(h, 1), a = e.length && s(L), !a) {
                L = (na.apply(d, e), d);
                break a;
              }
              break;
            }
          }
        }
        L = (E(a, g)(e, c, !N, d, ma.test(a) && n(c.parentNode) || c), d);
      }
      return L;
    }
    function c() {
      function a(c, d) {
        return b.push(c + " ") > x.cacheLength && delete a[b.shift()], a[c + " "] = d;
      }
      var b = [];
      return a;
    }
    function d(a) {
      return a[R] = !0, a;
    }
    function e(a) {
      var b = J.createElement("div");
      try {
        return!!a(b);
      } catch (c) {
        return!1;
      } finally {
        b.parentNode && b.parentNode.removeChild(b);
      }
    }
    function f(a, b) {
      for (var c = a.split("|"), d = a.length;d--;) {
        x.attrHandle[c[d]] = b;
      }
    }
    function g(a, b) {
      var c = b && a, d = c && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || aa) - (~a.sourceIndex || aa);
      if (d) {
        return d;
      }
      if (c) {
        for (;c = c.nextSibling;) {
          if (c === b) {
            return-1;
          }
        }
      }
      return a ? 1 : -1;
    }
    function h(a) {
      return function(b) {
        return "input" === b.nodeName.toLowerCase() && b.type === a;
      };
    }
    function l(a) {
      return function(b) {
        var c = b.nodeName.toLowerCase();
        return("input" === c || "button" === c) && b.type === a;
      };
    }
    function m(a) {
      return d(function(b) {
        return b = +b, d(function(c, d) {
          for (var e, f = a([], c.length, b), g = f.length;g--;) {
            c[e = f[g]] && (c[e] = !(d[e] = c[e]));
          }
        });
      });
    }
    function n(a) {
      return a && typeof a.getElementsByTagName !== T && a;
    }
    function p() {
    }
    function q(a, c) {
      var d, e, f, g, F, h, l;
      if (F = W[a + " "]) {
        return c ? 0 : F.slice(0);
      }
      F = a;
      h = [];
      for (l = x.preFilter;F;) {
        d && !(e = qa.exec(F)) || (e && (F = F.slice(e[0].length) || F), h.push(f = []));
        d = !1;
        (e = ra.exec(F)) && (d = e.shift(), f.push({value:d, type:e[0].replace(ba, " ")}), F = F.slice(d.length));
        for (g in x.filter) {
          !(e = ga[g].exec(F)) || l[g] && !(e = l[g](e)) || (d = e.shift(), f.push({value:d, type:g, matches:e}), F = F.slice(d.length));
        }
        if (!d) {
          break;
        }
      }
      return c ? F.length : F ? b.error(a) : W(a, h).slice(0);
    }
    function s(a) {
      for (var b = 0, c = a.length, d = "";c > b;b++) {
        d += a[b].value;
      }
      return d;
    }
    function r(a, b, c) {
      var d = b.dir, e = c && "parentNode" === d, f = Tb++;
      return b.first ? function(b, c, f) {
        for (;b = b[d];) {
          if (1 === b.nodeType || e) {
            return a(b, c, f);
          }
        }
      } : function(b, c, g) {
        var F, h, l = [da, f];
        if (g) {
          for (;b = b[d];) {
            if ((1 === b.nodeType || e) && a(b, c, g)) {
              return!0;
            }
          }
        } else {
          for (;b = b[d];) {
            if (1 === b.nodeType || e) {
              if (h = b[R] || (b[R] = {}), (F = h[d]) && F[0] === da && F[1] === f) {
                return l[2] = F[2];
              }
              if (h[d] = l, l[2] = a(b, c, g)) {
                return!0;
              }
            }
          }
        }
      };
    }
    function t(a) {
      return 1 < a.length ? function(b, c, d) {
        for (var e = a.length;e--;) {
          if (!a[e](b, c, d)) {
            return!1;
          }
        }
        return!0;
      } : a[0];
    }
    function u(a, b, c, d, e) {
      for (var f, g = [], F = 0, h = a.length, l = null != b;h > F;F++) {
        (f = a[F]) && (!c || c(f, d, e)) && (g.push(f), l && b.push(F));
      }
      return g;
    }
    function v(a, c, e, f, g, F) {
      return f && !f[R] && (f = v(f)), g && !g[R] && (g = v(g, F)), d(function(d, F, h, l) {
        var m, K, n = [], P = [], p = F.length, O;
        if (!(O = d)) {
          O = c || "*";
          for (var q = h.nodeType ? [h] : h, za = [], s = 0, r = q.length;r > s;s++) {
            b(O, q[s], za);
          }
          O = za;
        }
        O = !a || !d && c ? O : u(O, n, a, h, l);
        q = e ? g || (d ? a : p || f) ? [] : F : O;
        if (e && e(O, q, h, l), f) {
          for (m = u(q, P), f(m, [], h, l), h = m.length;h--;) {
            (K = m[h]) && (q[P[h]] = !(O[P[h]] = K));
          }
        }
        if (d) {
          if (g || a) {
            if (g) {
              m = [];
              for (h = q.length;h--;) {
                (K = q[h]) && m.push(O[h] = K);
              }
              g(null, q = [], m, l);
            }
            for (h = q.length;h--;) {
              (K = q[h]) && -1 < (m = g ? U.call(d, K) : n[h]) && (d[m] = !(F[m] = K));
            }
          }
        } else {
          q = u(q === F ? q.splice(p, q.length) : q), g ? g(null, F, q, l) : na.apply(F, q);
        }
      });
    }
    function w(a) {
      var b, c, d, e = a.length, f = x.relative[a[0].type];
      c = f || x.relative[" "];
      for (var g = f ? 1 : 0, F = r(function(a) {
        return a === b;
      }, c, !0), h = r(function(a) {
        return-1 < U.call(b, a);
      }, c, !0), l = [function(a, c, d) {
        return!f && (d || c !== D) || ((b = c).nodeType ? F(a, c, d) : h(a, c, d));
      }];e > g;g++) {
        if (c = x.relative[a[g].type]) {
          l = [r(t(l), c)];
        } else {
          if (c = x.filter[a[g].type].apply(null, a[g].matches), c[R]) {
            for (d = ++g;e > d && !x.relative[a[d].type];d++) {
            }
            return v(1 < g && t(l), 1 < g && s(a.slice(0, g - 1).concat({value:" " === a[g - 2].type ? "*" : ""})).replace(ba, "$1"), c, d > g && w(a.slice(g, d)), e > d && w(a = a.slice(d)), e > d && s(a));
          }
          l.push(c);
        }
      }
      return t(l);
    }
    function z(a, c) {
      var e = 0 < c.length, f = 0 < a.length, g = function(d, g, F, h, l) {
        var m, K, n, P = 0, p = "0", O = d && [], q = [], za = D, s = d || f && x.find.TAG("*", l), r = da += null == za ? 1 : Math.random() || 0.1, t = s.length;
        for (l && (D = g !== J && g);p !== t && null != (m = s[p]);p++) {
          if (f && m) {
            for (K = 0;n = a[K++];) {
              if (n(m, g, F)) {
                h.push(m);
                break;
              }
            }
            l && (da = r);
          }
          e && ((m = !n && m) && P--, d && O.push(m));
        }
        if (P += p, e && p !== P) {
          for (K = 0;n = c[K++];) {
            n(O, q, g, F);
          }
          if (d) {
            if (0 < P) {
              for (;p--;) {
                O[p] || q[p] || (q[p] = ka.call(h));
              }
            }
            q = u(q);
          }
          na.apply(h, q);
          l && !d && 0 < q.length && 1 < P + c.length && b.uniqueSort(h);
        }
        return l && (da = r, D = za), O;
      };
      return e ? d(g) : g;
    }
    var A, y, x, C, B, E, D, G, H, I, J, M, N, X, Q, Da, Aa, R = "sizzle" + -new Date, ca = a.document, da = 0, Tb = 0, V = c(), W = c(), Z = c(), Y = function(a, b) {
      return a === b && (H = !0), 0;
    }, T = "undefined", aa = -2147483648, ha = {}.hasOwnProperty, S = [], ka = S.pop, la = S.push, na = S.push, ea = S.slice, U = S.indexOf || function(a) {
      for (var b = 0, c = this.length;c > b;b++) {
        if (this[b] === a) {
          return b;
        }
      }
      return-1;
    }, ia = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+".replace("w", "w#"), ja = "\\[[\\x20\\t\\r\\n\\f]*((?:\\\\.|[\\w-]|[^\\x00-\\xa0])+)[\\x20\\t\\r\\n\\f]*(?:([*^$|!~]?=)[\\x20\\t\\r\\n\\f]*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + ia + ")|)|)[\\x20\\t\\r\\n\\f]*\\]", fa = ":((?:\\\\.|[\\w-]|[^\\x00-\\xa0])+)(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + ja.replace(3, 8) + ")*)|.*)\\)|)", ba = RegExp("^[\\x20\\t\\r\\n\\f]+|((?:^|[^\\\\])(?:\\\\.)*)[\\x20\\t\\r\\n\\f]+$", "g"), qa = /^[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/, 
    ra = /^[\x20\t\r\n\f]*([>+~]|[\x20\t\r\n\f])[\x20\t\r\n\f]*/, sa = RegExp("=[\\x20\\t\\r\\n\\f]*([^\\]'\"]*?)[\\x20\\t\\r\\n\\f]*\\]", "g"), ta = RegExp(fa), ua = RegExp("^" + ia + "$"), ga = {ID:/^#((?:\\.|[\w-]|[^\x00-\xa0])+)/, CLASS:/^\.((?:\\.|[\w-]|[^\x00-\xa0])+)/, TAG:RegExp("^(" + "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+".replace("w", "w*") + ")"), ATTR:RegExp("^" + ja), PSEUDO:RegExp("^" + fa), CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\([\\x20\\t\\r\\n\\f]*(even|odd|(([+-]|)(\\d*)n|)[\\x20\\t\\r\\n\\f]*(?:([+-]|)[\\x20\\t\\r\\n\\f]*(\\d+)|))[\\x20\\t\\r\\n\\f]*\\)|)", 
    "i"), bool:RegExp("^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$", "i"), needsContext:RegExp("^[\\x20\\t\\r\\n\\f]*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\([\\x20\\t\\r\\n\\f]*((?:-\\d)?\\d*)[\\x20\\t\\r\\n\\f]*\\)|)(?=[^-]|$)", "i")}, va = /^(?:input|select|textarea|button)$/i, wa = /^h\d$/i, Ba = /^[^{]+\{\s*\[native \w/, xa = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, ma = /[+~]/, ya = /'|\\/g, oa = RegExp("\\\\([\\da-f]{1,6}[\\x20\\t\\r\\n\\f]?|([\\x20\\t\\r\\n\\f])|.)", 
    "ig"), pa = function(a, b, c) {
      a = "0x" + b - 65536;
      return a !== a || c ? b : 0 > a ? String.fromCharCode(a + 65536) : String.fromCharCode(a >> 10 | 55296, 1023 & a | 56320);
    };
    try {
      na.apply(S = ea.call(ca.childNodes), ca.childNodes), S[ca.childNodes.length].nodeType;
    } catch (Ca) {
      na = {apply:S.length ? function(a, b) {
        la.apply(a, ea.call(b));
      } : function(a, b) {
        for (var c = a.length, d = 0;a[c++] = b[d++];) {
        }
        a.length = c - 1;
      }};
    }
    y = b.support = {};
    B = b.isXML = function(a) {
      return(a = a && (a.ownerDocument || a).documentElement) ? "HTML" !== a.nodeName : !1;
    };
    I = b.setDocument = function(a) {
      var b, c = a ? a.ownerDocument || a : ca;
      a = c.defaultView;
      return c !== J && 9 === c.nodeType && c.documentElement ? (J = c, M = c.documentElement, N = !B(c), a && a !== a.top && (a.addEventListener ? a.addEventListener("unload", function() {
        I();
      }, !1) : a.attachEvent && a.attachEvent("onunload", function() {
        I();
      })), y.attributes = e(function(a) {
        return a.className = "i", !a.getAttribute("className");
      }), y.getElementsByTagName = e(function(a) {
        return a.appendChild(c.createComment("")), !a.getElementsByTagName("*").length;
      }), y.getElementsByClassName = Ba.test(c.getElementsByClassName) && e(function(a) {
        return a.innerHTML = "<div class='a'></div><div class='a i'></div>", a.firstChild.className = "i", 2 === a.getElementsByClassName("i").length;
      }), y.getById = e(function(a) {
        return M.appendChild(a).id = R, !c.getElementsByName || !c.getElementsByName(R).length;
      }), y.getById ? (x.find.ID = function(a, b) {
        if (typeof b.getElementById !== T && N) {
          var c = b.getElementById(a);
          return c && c.parentNode ? [c] : [];
        }
      }, x.filter.ID = function(a) {
        var b = a.replace(oa, pa);
        return function(a) {
          return a.getAttribute("id") === b;
        };
      }) : (delete x.find.ID, x.filter.ID = function(a) {
        var b = a.replace(oa, pa);
        return function(a) {
          return(a = typeof a.getAttributeNode !== T && a.getAttributeNode("id")) && a.value === b;
        };
      }), x.find.TAG = y.getElementsByTagName ? function(a, b) {
        return typeof b.getElementsByTagName !== T ? b.getElementsByTagName(a) : void 0;
      } : function(a, b) {
        var c, d = [], e = 0, f = b.getElementsByTagName(a);
        if ("*" === a) {
          for (;c = f[e++];) {
            1 === c.nodeType && d.push(c);
          }
          return d;
        }
        return f;
      }, x.find.CLASS = y.getElementsByClassName && function(a, b) {
        return typeof b.getElementsByClassName !== T && N ? b.getElementsByClassName(a) : void 0;
      }, Q = [], X = [], (y.qsa = Ba.test(c.querySelectorAll)) && (e(function(a) {
        a.innerHTML = "<select t=''><option selected=''></option></select>";
        a.querySelectorAll("[t^='']").length && X.push("[*^$]=[\\x20\\t\\r\\n\\f]*(?:''|\"\")");
        a.querySelectorAll("[selected]").length || X.push("\\[[\\x20\\t\\r\\n\\f]*(?:value|checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)");
        a.querySelectorAll(":checked").length || X.push(":checked");
      }), e(function(a) {
        var b = c.createElement("input");
        b.setAttribute("type", "hidden");
        a.appendChild(b).setAttribute("name", "D");
        a.querySelectorAll("[name=d]").length && X.push("name[\\x20\\t\\r\\n\\f]*[*^$|!~]?=");
        a.querySelectorAll(":enabled").length || X.push(":enabled", ":disabled");
        a.querySelectorAll("*,:x");
        X.push(",.*:");
      })), (y.matchesSelector = Ba.test(Da = M.webkitMatchesSelector || M.mozMatchesSelector || M.oMatchesSelector || M.msMatchesSelector)) && e(function(a) {
        y.disconnectedMatch = Da.call(a, "div");
        Da.call(a, "[s!='']:x");
        Q.push("!=", fa);
      }), X = X.length && RegExp(X.join("|")), Q = Q.length && RegExp(Q.join("|")), b = Ba.test(M.compareDocumentPosition), Aa = b || Ba.test(M.contains) ? function(a, b) {
        var c = 9 === a.nodeType ? a.documentElement : a, d = b && b.parentNode;
        return a === d || !(!d || 1 !== d.nodeType || !(c.contains ? c.contains(d) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d)));
      } : function(a, b) {
        if (b) {
          for (;b = b.parentNode;) {
            if (b === a) {
              return!0;
            }
          }
        }
        return!1;
      }, Y = b ? function(a, b) {
        if (a === b) {
          return H = !0, 0;
        }
        var d = !a.compareDocumentPosition - !b.compareDocumentPosition;
        return d ? d : (d = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1, 1 & d || !y.sortDetached && b.compareDocumentPosition(a) === d ? a === c || a.ownerDocument === ca && Aa(ca, a) ? -1 : b === c || b.ownerDocument === ca && Aa(ca, b) ? 1 : G ? U.call(G, a) - U.call(G, b) : 0 : 4 & d ? -1 : 1);
      } : function(a, b) {
        if (a === b) {
          return H = !0, 0;
        }
        var d, e = 0;
        d = a.parentNode;
        var f = b.parentNode, F = [a], h = [b];
        if (!d || !f) {
          return a === c ? -1 : b === c ? 1 : d ? -1 : f ? 1 : G ? U.call(G, a) - U.call(G, b) : 0;
        }
        if (d === f) {
          return g(a, b);
        }
        for (d = a;d = d.parentNode;) {
          F.unshift(d);
        }
        for (d = b;d = d.parentNode;) {
          h.unshift(d);
        }
        for (;F[e] === h[e];) {
          e++;
        }
        return e ? g(F[e], h[e]) : F[e] === ca ? -1 : h[e] === ca ? 1 : 0;
      }, c) : J;
    };
    b.matches = function(a, c) {
      return b(a, null, null, c);
    };
    b.matchesSelector = function(a, c) {
      if ((a.ownerDocument || a) !== J && I(a), c = c.replace(sa, "='$1']"), y.matchesSelector && N && !(Q && Q.test(c) || X && X.test(c))) {
        try {
          var d = Da.call(a, c);
          if (d || y.disconnectedMatch || a.document && 11 !== a.document.nodeType) {
            return d;
          }
        } catch (e) {
        }
      }
      return 0 < b(c, J, null, [a]).length;
    };
    b.contains = function(a, b) {
      return(a.ownerDocument || a) !== J && I(a), Aa(a, b);
    };
    b.attr = function(a, b) {
      (a.ownerDocument || a) !== J && I(a);
      var c = x.attrHandle[b.toLowerCase()], c = c && ha.call(x.attrHandle, b.toLowerCase()) ? c(a, b, !N) : void 0;
      return void 0 !== c ? c : y.attributes || !N ? a.getAttribute(b) : (c = a.getAttributeNode(b)) && c.specified ? c.value : null;
    };
    b.error = function(a) {
      throw Error("Syntax error, unrecognized expression: " + a);
    };
    b.uniqueSort = function(a) {
      var b, c = [], d = 0, e = 0;
      if (H = !y.detectDuplicates, G = !y.sortStable && a.slice(0), a.sort(Y), H) {
        for (;b = a[e++];) {
          b === a[e] && (d = c.push(e));
        }
        for (;d--;) {
          a.splice(c[d], 1);
        }
      }
      return G = null, a;
    };
    C = b.getText = function(a) {
      var b, c = "", d = 0;
      if (b = a.nodeType) {
        if (1 === b || 9 === b || 11 === b) {
          if ("string" == typeof a.textContent) {
            return a.textContent;
          }
          for (a = a.firstChild;a;a = a.nextSibling) {
            c += C(a);
          }
        } else {
          if (3 === b || 4 === b) {
            return a.nodeValue;
          }
        }
      } else {
        for (;b = a[d++];) {
          c += C(b);
        }
      }
      return c;
    };
    x = b.selectors = {cacheLength:50, createPseudo:d, match:ga, attrHandle:{}, find:{}, relative:{">":{dir:"parentNode", first:!0}, " ":{dir:"parentNode"}, "+":{dir:"previousSibling", first:!0}, "~":{dir:"previousSibling"}}, preFilter:{ATTR:function(a) {
      return a[1] = a[1].replace(oa, pa), a[3] = (a[4] || a[5] || "").replace(oa, pa), "~=" === a[2] && (a[3] = " " + a[3] + " "), a.slice(0, 4);
    }, CHILD:function(a) {
      return a[1] = a[1].toLowerCase(), "nth" === a[1].slice(0, 3) ? (a[3] || b.error(a[0]), a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * ("even" === a[3] || "odd" === a[3])), a[5] = +(a[7] + a[8] || "odd" === a[3])) : a[3] && b.error(a[0]), a;
    }, PSEUDO:function(a) {
      var b, c = !a[5] && a[2];
      return ga.CHILD.test(a[0]) ? null : (a[3] && void 0 !== a[4] ? a[2] = a[4] : c && ta.test(c) && (b = q(c, !0)) && (b = c.indexOf(")", c.length - b) - c.length) && (a[0] = a[0].slice(0, b), a[2] = c.slice(0, b)), a.slice(0, 3));
    }}, filter:{TAG:function(a) {
      var b = a.replace(oa, pa).toLowerCase();
      return "*" === a ? function() {
        return!0;
      } : function(a) {
        return a.nodeName && a.nodeName.toLowerCase() === b;
      };
    }, CLASS:function(a) {
      var b = V[a + " "];
      return b || (b = RegExp("(^|[\\x20\\t\\r\\n\\f])" + a + "([\\x20\\t\\r\\n\\f]|$)")) && V(a, function(a) {
        return b.test("string" == typeof a.className && a.className || typeof a.getAttribute !== T && a.getAttribute("class") || "");
      });
    }, ATTR:function(a, c, d) {
      return function(e) {
        e = b.attr(e, a);
        return null == e ? "!=" === c : c ? (e += "", "=" === c ? e === d : "!=" === c ? e !== d : "^=" === c ? d && 0 === e.indexOf(d) : "*=" === c ? d && -1 < e.indexOf(d) : "$=" === c ? d && e.slice(-d.length) === d : "~=" === c ? -1 < (" " + e + " ").indexOf(d) : "|=" === c ? e === d || e.slice(0, d.length + 1) === d + "-" : !1) : !0;
      };
    }, CHILD:function(a, b, c, d, e) {
      var f = "nth" !== a.slice(0, 3), g = "last" !== a.slice(-4), F = "of-type" === b;
      return 1 === d && 0 === e ? function(a) {
        return!!a.parentNode;
      } : function(b, c, h) {
        var l, m, L, K, n;
        c = f !== g ? "nextSibling" : "previousSibling";
        var P = b.parentNode, p = F && b.nodeName.toLowerCase();
        h = !h && !F;
        if (P) {
          if (f) {
            for (;c;) {
              for (m = b;m = m[c];) {
                if (F ? m.nodeName.toLowerCase() === p : 1 === m.nodeType) {
                  return!1;
                }
              }
              n = c = "only" === a && !n && "nextSibling";
            }
            return!0;
          }
          if (n = [g ? P.firstChild : P.lastChild], g && h) {
            for (h = P[R] || (P[R] = {}), l = h[a] || [], K = l[0] === da && l[1], L = l[0] === da && l[2], m = K && P.childNodes[K];m = ++K && m && m[c] || (L = K = 0) || n.pop();) {
              if (1 === m.nodeType && ++L && m === b) {
                h[a] = [da, K, L];
                break;
              }
            }
          } else {
            if (h && (l = (b[R] || (b[R] = {}))[a]) && l[0] === da) {
              L = l[1];
            } else {
              for (;(m = ++K && m && m[c] || (L = K = 0) || n.pop()) && ((F ? m.nodeName.toLowerCase() !== p : 1 !== m.nodeType) || !++L || (h && ((m[R] || (m[R] = {}))[a] = [da, L]), m !== b));) {
              }
            }
          }
          return L -= e, L === d || 0 === L % d && 0 <= L / d;
        }
      };
    }, PSEUDO:function(a, c) {
      var e, f = x.pseudos[a] || x.setFilters[a.toLowerCase()] || b.error("unsupported pseudo: " + a);
      return f[R] ? f(c) : 1 < f.length ? (e = [a, a, "", c], x.setFilters.hasOwnProperty(a.toLowerCase()) ? d(function(a, b) {
        for (var d, e = f(a, c), g = e.length;g--;) {
          d = U.call(a, e[g]), a[d] = !(b[d] = e[g]);
        }
      }) : function(a) {
        return f(a, 0, e);
      }) : f;
    }}, pseudos:{not:d(function(a) {
      var b = [], c = [], e = E(a.replace(ba, "$1"));
      return e[R] ? d(function(a, b, c, d) {
        var f;
        c = e(a, null, d, []);
        for (d = a.length;d--;) {
          (f = c[d]) && (a[d] = !(b[d] = f));
        }
      }) : function(a, d, f) {
        return b[0] = a, e(b, null, f, c), !c.pop();
      };
    }), has:d(function(a) {
      return function(c) {
        return 0 < b(a, c).length;
      };
    }), contains:d(function(a) {
      return function(b) {
        return-1 < (b.textContent || b.innerText || C(b)).indexOf(a);
      };
    }), lang:d(function(a) {
      return ua.test(a || "") || b.error("unsupported lang: " + a), a = a.replace(oa, pa).toLowerCase(), function(b) {
        var c;
        do {
          if (c = N ? b.lang : b.getAttribute("xml:lang") || b.getAttribute("lang")) {
            return c = c.toLowerCase(), c === a || 0 === c.indexOf(a + "-");
          }
        } while ((b = b.parentNode) && 1 === b.nodeType);
        return!1;
      };
    }), target:function(b) {
      var c = a.location && a.location.hash;
      return c && c.slice(1) === b.id;
    }, root:function(a) {
      return a === M;
    }, focus:function(a) {
      return a === J.activeElement && (!J.hasFocus || J.hasFocus()) && !!(a.type || a.href || ~a.tabIndex);
    }, enabled:function(a) {
      return!1 === a.disabled;
    }, disabled:function(a) {
      return!0 === a.disabled;
    }, checked:function(a) {
      var b = a.nodeName.toLowerCase();
      return "input" === b && !!a.checked || "option" === b && !!a.selected;
    }, selected:function(a) {
      return a.parentNode && a.parentNode.selectedIndex, !0 === a.selected;
    }, empty:function(a) {
      for (a = a.firstChild;a;a = a.nextSibling) {
        if (6 > a.nodeType) {
          return!1;
        }
      }
      return!0;
    }, parent:function(a) {
      return!x.pseudos.empty(a);
    }, header:function(a) {
      return wa.test(a.nodeName);
    }, input:function(a) {
      return va.test(a.nodeName);
    }, button:function(a) {
      var b = a.nodeName.toLowerCase();
      return "input" === b && "button" === a.type || "button" === b;
    }, text:function(a) {
      var b;
      return "input" === a.nodeName.toLowerCase() && "text" === a.type && (null == (b = a.getAttribute("type")) || "text" === b.toLowerCase());
    }, first:m(function() {
      return[0];
    }), last:m(function(a, b) {
      return[b - 1];
    }), eq:m(function(a, b, c) {
      return[0 > c ? c + b : c];
    }), even:m(function(a, b) {
      for (var c = 0;b > c;c += 2) {
        a.push(c);
      }
      return a;
    }), odd:m(function(a, b) {
      for (var c = 1;b > c;c += 2) {
        a.push(c);
      }
      return a;
    }), lt:m(function(a, b, c) {
      for (b = 0 > c ? c + b : c;0 <= --b;) {
        a.push(b);
      }
      return a;
    }), gt:m(function(a, b, c) {
      for (c = 0 > c ? c + b : c;++c < b;) {
        a.push(c);
      }
      return a;
    })}};
    x.pseudos.nth = x.pseudos.eq;
    for (A in{radio:!0, checkbox:!0, file:!0, password:!0, image:!0}) {
      x.pseudos[A] = h(A);
    }
    for (A in{submit:!0, reset:!0}) {
      x.pseudos[A] = l(A);
    }
    p.prototype = x.filters = x.pseudos;
    x.setFilters = new p;
    E = b.compile = function(a, b) {
      var c, d = [], e = [], f = Z[a + " "];
      if (!f) {
        b || (b = q(a));
        for (c = b.length;c--;) {
          f = w(b[c]), f[R] ? d.push(f) : e.push(f);
        }
        f = Z(a, z(e, d));
      }
      return f;
    };
    return y.sortStable = R.split("").sort(Y).join("") === R, y.detectDuplicates = !!H, I(), y.sortDetached = e(function(a) {
      return 1 & a.compareDocumentPosition(J.createElement("div"));
    }), e(function(a) {
      return a.innerHTML = "<a href='#'></a>", "#" === a.firstChild.getAttribute("href");
    }) || f("type|href|height|width", function(a, b, c) {
      return c ? void 0 : a.getAttribute(b, "type" === b.toLowerCase() ? 1 : 2);
    }), y.attributes && e(function(a) {
      return a.innerHTML = "<input/>", a.firstChild.setAttribute("value", ""), "" === a.firstChild.getAttribute("value");
    }) || f("value", function(a, b, c) {
      return c || "input" !== a.nodeName.toLowerCase() ? void 0 : a.defaultValue;
    }), e(function(a) {
      return null == a.getAttribute("disabled");
    }) || f("checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", function(a, b, c) {
      var d;
      return c ? void 0 : !0 === a[b] ? b.toLowerCase() : (d = a.getAttributeNode(b)) && d.specified ? d.value : null;
    }), b;
  }(a);
  m.find = qa;
  m.expr = qa.selectors;
  m.expr[":"] = m.expr.pseudos;
  m.unique = qa.uniqueSort;
  m.text = qa.getText;
  m.isXMLDoc = qa.isXML;
  m.contains = qa.contains;
  var jb = m.expr.match.needsContext, kb = /^<(\w+)\s*\/?>(?:<\/\1>|)$/, Hb = /^.[^:#\[\.,]*$/;
  m.filter = function(a, b, c) {
    var d = b[0];
    return c && (a = ":not(" + a + ")"), 1 === b.length && 1 === d.nodeType ? m.find.matchesSelector(d, a) ? [d] : [] : m.find.matches(a, m.grep(b, function(a) {
      return 1 === a.nodeType;
    }));
  };
  m.fn.extend({find:function(a) {
    var b, c = [], d = this, e = d.length;
    if ("string" != typeof a) {
      return this.pushStack(m(a).filter(function() {
        for (b = 0;e > b;b++) {
          if (m.contains(d[b], this)) {
            return!0;
          }
        }
      }));
    }
    for (b = 0;e > b;b++) {
      m.find(a, d[b], c);
    }
    return c = this.pushStack(1 < e ? m.unique(c) : c), c.selector = this.selector ? this.selector + " " + a : a, c;
  }, filter:function(a) {
    return this.pushStack(d(this, a || [], !1));
  }, not:function(a) {
    return this.pushStack(d(this, a || [], !0));
  }, is:function(a) {
    return!!d(this, "string" == typeof a && jb.test(a) ? m(a) : a || [], !1).length;
  }});
  var ga, E = a.document, Ub = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/;
  (m.fn.init = function(a, b) {
    var c, d;
    if (!a) {
      return this;
    }
    if ("string" == typeof a) {
      if (c = "<" === a.charAt(0) && ">" === a.charAt(a.length - 1) && 3 <= a.length ? [null, a, null] : Ub.exec(a), !c || !c[1] && b) {
        return!b || b.jquery ? (b || ga).find(a) : this.constructor(b).find(a);
      }
      if (c[1]) {
        if (b = b instanceof m ? b[0] : b, m.merge(this, m.parseHTML(c[1], b && b.nodeType ? b.ownerDocument || b : E, !0)), kb.test(c[1]) && m.isPlainObject(b)) {
          for (c in b) {
            m.isFunction(this[c]) ? this[c](b[c]) : this.attr(c, b[c]);
          }
        }
        return this;
      }
      if (d = E.getElementById(c[2]), d && d.parentNode) {
        if (d.id !== c[2]) {
          return ga.find(a);
        }
        this.length = 1;
        this[0] = d;
      }
      return this.context = E, this.selector = a, this;
    }
    return a.nodeType ? (this.context = this[0] = a, this.length = 1, this) : m.isFunction(a) ? "undefined" != typeof ga.ready ? ga.ready(a) : a(m) : (void 0 !== a.selector && (this.selector = a.selector, this.context = a.context), m.makeArray(a, this));
  }).prototype = m.fn;
  ga = m(E);
  var Vb = /^(?:parents|prev(?:Until|All))/, Wb = {children:!0, contents:!0, next:!0, prev:!0};
  m.extend({dir:function(a, b, c) {
    var d = [];
    for (a = a[b];a && 9 !== a.nodeType && (void 0 === c || 1 !== a.nodeType || !m(a).is(c));) {
      1 === a.nodeType && d.push(a), a = a[b];
    }
    return d;
  }, sibling:function(a, b) {
    for (var c = [];a;a = a.nextSibling) {
      1 === a.nodeType && a !== b && c.push(a);
    }
    return c;
  }});
  m.fn.extend({has:function(a) {
    var b, c = m(a, this), d = c.length;
    return this.filter(function() {
      for (b = 0;d > b;b++) {
        if (m.contains(this, c[b])) {
          return!0;
        }
      }
    });
  }, closest:function(a, b) {
    for (var c, d = 0, e = this.length, f = [], g = jb.test(a) || "string" != typeof a ? m(a, b || this.context) : 0;e > d;d++) {
      for (c = this[d];c && c !== b;c = c.parentNode) {
        if (11 > c.nodeType && (g ? -1 < g.index(c) : 1 === c.nodeType && m.find.matchesSelector(c, a))) {
          f.push(c);
          break;
        }
      }
    }
    return this.pushStack(1 < f.length ? m.unique(f) : f);
  }, index:function(a) {
    return a ? "string" == typeof a ? m.inArray(this[0], m(a)) : m.inArray(a.jquery ? a[0] : a, this) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
  }, add:function(a, b) {
    return this.pushStack(m.unique(m.merge(this.get(), m(a, b))));
  }, addBack:function(a) {
    return this.add(null == a ? this.prevObject : this.prevObject.filter(a));
  }});
  m.each({parent:function(a) {
    return(a = a.parentNode) && 11 !== a.nodeType ? a : null;
  }, parents:function(a) {
    return m.dir(a, "parentNode");
  }, parentsUntil:function(a, b, c) {
    return m.dir(a, "parentNode", c);
  }, next:function(a) {
    return e(a, "nextSibling");
  }, prev:function(a) {
    return e(a, "previousSibling");
  }, nextAll:function(a) {
    return m.dir(a, "nextSibling");
  }, prevAll:function(a) {
    return m.dir(a, "previousSibling");
  }, nextUntil:function(a, b, c) {
    return m.dir(a, "nextSibling", c);
  }, prevUntil:function(a, b, c) {
    return m.dir(a, "previousSibling", c);
  }, siblings:function(a) {
    return m.sibling((a.parentNode || {}).firstChild, a);
  }, children:function(a) {
    return m.sibling(a.firstChild);
  }, contents:function(a) {
    return m.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : m.merge([], a.childNodes);
  }}, function(a, b) {
    m.fn[a] = function(c, d) {
      var e = m.map(this, b, c);
      return "Until" !== a.slice(-5) && (d = c), d && "string" == typeof d && (e = m.filter(d, e)), 1 < this.length && (Wb[a] || (e = m.unique(e)), Vb.test(a) && (e = e.reverse())), this.pushStack(e);
    };
  });
  var Z = /\S+/g, bb = {};
  m.Callbacks = function(a) {
    a = "string" == typeof a ? bb[a] || f(a) : m.extend({}, a);
    var b, c, d, e, g, h, l = [], n = !a.once && [], p = function(f) {
      c = a.memory && f;
      d = !0;
      g = h || 0;
      h = 0;
      e = l.length;
      for (b = !0;l && e > g;g++) {
        if (!1 === l[g].apply(f[0], f[1]) && a.stopOnFalse) {
          c = !1;
          break;
        }
      }
      b = !1;
      l && (n ? n.length && p(n.shift()) : c ? l = [] : q.disable());
    }, q = {add:function() {
      if (l) {
        var d = l.length;
        !function Sb(b) {
          m.each(b, function(b, c) {
            var d = m.type(c);
            "function" === d ? a.unique && q.has(c) || l.push(c) : c && c.length && "string" !== d && Sb(c);
          });
        }(arguments);
        b ? e = l.length : c && (h = d, p(c));
      }
      return this;
    }, remove:function() {
      return l && m.each(arguments, function(a, c) {
        for (var d;-1 < (d = m.inArray(c, l, d));) {
          l.splice(d, 1), b && (e >= d && e--, g >= d && g--);
        }
      }), this;
    }, has:function(a) {
      return a ? -1 < m.inArray(a, l) : !(!l || !l.length);
    }, empty:function() {
      return l = [], e = 0, this;
    }, disable:function() {
      return l = n = c = void 0, this;
    }, disabled:function() {
      return!l;
    }, lock:function() {
      return n = void 0, c || q.disable(), this;
    }, locked:function() {
      return!n;
    }, fireWith:function(a, c) {
      return!l || d && !n || (c = c || [], c = [a, c.slice ? c.slice() : c], b ? n.push(c) : p(c)), this;
    }, fire:function() {
      return q.fireWith(this, arguments), this;
    }, fired:function() {
      return!!d;
    }};
    return q;
  };
  m.extend({Deferred:function(a) {
    var b = [["resolve", "done", m.Callbacks("once memory"), "resolved"], ["reject", "fail", m.Callbacks("once memory"), "rejected"], ["notify", "progress", m.Callbacks("memory")]], c = "pending", d = {state:function() {
      return c;
    }, always:function() {
      return e.done(arguments).fail(arguments), this;
    }, then:function() {
      var a = arguments;
      return m.Deferred(function(c) {
        m.each(b, function(b, f) {
          var g = m.isFunction(a[b]) && a[b];
          e[f[1]](function() {
            var a = g && g.apply(this, arguments);
            a && m.isFunction(a.promise) ? a.promise().done(c.resolve).fail(c.reject).progress(c.notify) : c[f[0] + "With"](this === d ? c.promise() : this, g ? [a] : arguments);
          });
        });
        a = null;
      }).promise();
    }, promise:function(a) {
      return null != a ? m.extend(a, d) : d;
    }}, e = {};
    return d.pipe = d.then, m.each(b, function(a, f) {
      var g = f[2], h = f[3];
      d[f[1]] = g.add;
      h && g.add(function() {
        c = h;
      }, b[1 ^ a][2].disable, b[2][2].lock);
      e[f[0]] = function() {
        return e[f[0] + "With"](this === e ? d : this, arguments), this;
      };
      e[f[0] + "With"] = g.fireWith;
    }), d.promise(e), a && a.call(e, e), e;
  }, when:function(a) {
    var b = 0, c = aa.call(arguments), d = c.length, e = 1 !== d || a && m.isFunction(a.promise) ? d : 0, f = 1 === e ? a : m.Deferred(), g = function(a, b, c) {
      return function(d) {
        b[a] = this;
        c[a] = 1 < arguments.length ? aa.call(arguments) : d;
        c === h ? f.notifyWith(b, c) : --e || f.resolveWith(b, c);
      };
    }, h, l, n;
    if (1 < d) {
      for (h = Array(d), l = Array(d), n = Array(d);d > b;b++) {
        c[b] && m.isFunction(c[b].promise) ? c[b].promise().done(g(b, n, c)).fail(f.reject).progress(g(b, l, h)) : --e;
      }
    }
    return e || f.resolveWith(n, c), f.promise();
  }});
  var ya;
  m.fn.ready = function(a) {
    return m.ready.promise().done(a), this;
  };
  m.extend({isReady:!1, readyWait:1, holdReady:function(a) {
    a ? m.readyWait++ : m.ready(!0);
  }, ready:function(a) {
    if (!0 === a ? !--m.readyWait : !m.isReady) {
      if (!E.body) {
        return setTimeout(m.ready);
      }
      m.isReady = !0;
      !0 !== a && 0 < --m.readyWait || (ya.resolveWith(E, [m]), m.fn.trigger && m(E).trigger("ready").off("ready"));
    }
  }});
  m.ready.promise = function(b) {
    if (!ya) {
      if (ya = m.Deferred(), "complete" === E.readyState) {
        setTimeout(m.ready);
      } else {
        if (E.addEventListener) {
          E.addEventListener("DOMContentLoaded", h, !1), a.addEventListener("load", h, !1);
        } else {
          E.attachEvent("onreadystatechange", h);
          a.attachEvent("onload", h);
          var c = !1;
          try {
            c = null == a.frameElement && E.documentElement;
          } catch (d) {
          }
          c && c.doScroll && !function O() {
            if (!m.isReady) {
              try {
                c.doScroll("left");
              } catch (a) {
                return setTimeout(O, 50);
              }
              g();
              m.ready();
            }
          }();
        }
      }
    }
    return ya.promise(b);
  };
  var W = "undefined", lb;
  for (lb in m(x)) {
    break;
  }
  x.ownLast = "0" !== lb;
  x.inlineBlockNeedsLayout = !1;
  m(function() {
    var a, b, c = E.getElementsByTagName("body")[0];
    c && (a = E.createElement("div"), a.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px", b = E.createElement("div"), c.appendChild(a).appendChild(b), typeof b.style.zoom !== W && (b.style.cssText = "border:0;margin:0;width:1px;padding:1px;display:inline;zoom:1", (x.inlineBlockNeedsLayout = 3 === b.offsetWidth) && (c.style.zoom = 1)), c.removeChild(a));
  });
  (function() {
    var a = E.createElement("div");
    if (null == x.deleteExpando) {
      x.deleteExpando = !0;
      try {
        delete a.test;
      } catch (b) {
        x.deleteExpando = !1;
      }
    }
  })();
  m.acceptData = function(a) {
    var b = m.noData[(a.nodeName + " ").toLowerCase()], c = +a.nodeType || 1;
    return 1 !== c && 9 !== c ? !1 : !b || !0 !== b && a.getAttribute("classid") === b;
  };
  var Jb = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, Ib = /([A-Z])/g;
  m.extend({cache:{}, noData:{"applet ":!0, "embed ":!0, "object ":"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"}, hasData:function(a) {
    return a = a.nodeType ? m.cache[a[m.expando]] : a[m.expando], !!a && !n(a);
  }, data:function(a, b, c) {
    return p(a, b, c);
  }, removeData:function(a, b) {
    return r(a, b);
  }, _data:function(a, b, c) {
    return p(a, b, c, !0);
  }, _removeData:function(a, b) {
    return r(a, b, !0);
  }});
  m.fn.extend({data:function(a, b) {
    var c, d, e, f = this[0], g = f && f.attributes;
    if (void 0 === a) {
      if (this.length && (e = m.data(f), 1 === f.nodeType && !m._data(f, "parsedAttrs"))) {
        for (c = g.length;c--;) {
          d = g[c].name, 0 === d.indexOf("data-") && (d = m.camelCase(d.slice(5)), l(f, d, e[d]));
        }
        m._data(f, "parsedAttrs", !0);
      }
      return e;
    }
    return "object" == typeof a ? this.each(function() {
      m.data(this, a);
    }) : 1 < arguments.length ? this.each(function() {
      m.data(this, a, b);
    }) : f ? l(f, a, m.data(f, a)) : void 0;
  }, removeData:function(a) {
    return this.each(function() {
      m.removeData(this, a);
    });
  }});
  m.extend({queue:function(a, b, c) {
    var d;
    return a ? (b = (b || "fx") + "queue", d = m._data(a, b), c && (!d || m.isArray(c) ? d = m._data(a, b, m.makeArray(c)) : d.push(c)), d || []) : void 0;
  }, dequeue:function(a, b) {
    b = b || "fx";
    var c = m.queue(a, b), d = c.length, e = c.shift(), f = m._queueHooks(a, b), g = function() {
      m.dequeue(a, b);
    };
    "inprogress" === e && (e = c.shift(), d--);
    e && ("fx" === b && c.unshift("inprogress"), delete f.stop, e.call(a, g, f));
    !d && f && f.empty.fire();
  }, _queueHooks:function(a, b) {
    var c = b + "queueHooks";
    return m._data(a, c) || m._data(a, c, {empty:m.Callbacks("once memory").add(function() {
      m._removeData(a, b + "queue");
      m._removeData(a, c);
    })});
  }});
  m.fn.extend({queue:function(a, b) {
    var c = 2;
    return "string" != typeof a && (b = a, a = "fx", c--), arguments.length < c ? m.queue(this[0], a) : void 0 === b ? this : this.each(function() {
      var c = m.queue(this, a, b);
      m._queueHooks(this, a);
      "fx" === a && "inprogress" !== c[0] && m.dequeue(this, a);
    });
  }, dequeue:function(a) {
    return this.each(function() {
      m.dequeue(this, a);
    });
  }, clearQueue:function(a) {
    return this.queue(a || "fx", []);
  }, promise:function(a, b) {
    var c, d = 1, e = m.Deferred(), f = this, g = this.length, h = function() {
      --d || e.resolveWith(f, [f]);
    };
    "string" != typeof a && (b = a, a = void 0);
    for (a = a || "fx";g--;) {
      (c = m._data(f[g], a + "queueHooks")) && c.empty && (d++, c.empty.add(h));
    }
    return h(), e.promise(b);
  }});
  var Ca = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source, ka = ["Top", "Right", "Bottom", "Left"], ta = function(a, b) {
    return a = b || a, "none" === m.css(a, "display") || !m.contains(a.ownerDocument, a);
  }, U = m.access = function(a, b, c, d, e, f, g) {
    var h = 0, l = a.length, n = null == c;
    if ("object" === m.type(c)) {
      for (h in e = !0, c) {
        m.access(a, b, h, c[h], !0, f, g);
      }
    } else {
      if (void 0 !== d && (e = !0, m.isFunction(d) || (g = !0), n && (g ? (b.call(a, d), b = null) : (n = b, b = function(a, b, c) {
        return n.call(m(a), c);
      })), b)) {
        for (;l > h;h++) {
          b(a[h], c, g ? d : d.call(a[h], h, b(a[h], c)));
        }
      }
    }
    return e ? a : n ? b.call(a) : l ? b(a[0], c) : f;
  }, Ia = /^(?:checkbox|radio)$/i;
  !function() {
    var a = E.createDocumentFragment(), b = E.createElement("div"), c = E.createElement("input");
    if (b.setAttribute("className", "t"), b.innerHTML = "  <link/><table></table><a href='/a'>a</a>", x.leadingWhitespace = 3 === b.firstChild.nodeType, x.tbody = !b.getElementsByTagName("tbody").length, x.htmlSerialize = !!b.getElementsByTagName("link").length, x.html5Clone = "<:nav></:nav>" !== E.createElement("nav").cloneNode(!0).outerHTML, c.type = "checkbox", c.checked = !0, a.appendChild(c), x.appendChecked = c.checked, b.innerHTML = "<textarea>x</textarea>", x.noCloneChecked = !!b.cloneNode(!0).lastChild.defaultValue, 
    a.appendChild(b), b.innerHTML = "<input type='radio' checked='checked' name='t'/>", x.checkClone = b.cloneNode(!0).cloneNode(!0).lastChild.checked, x.noCloneEvent = !0, b.attachEvent && (b.attachEvent("onclick", function() {
      x.noCloneEvent = !1;
    }), b.cloneNode(!0).click()), null == x.deleteExpando) {
      x.deleteExpando = !0;
      try {
        delete b.test;
      } catch (d) {
        x.deleteExpando = !1;
      }
    }
    a = b = c = null;
  }();
  (function() {
    var b, c, d = E.createElement("div");
    for (b in{submit:!0, change:!0, focusin:!0}) {
      c = "on" + b, (x[b + "Bubbles"] = c in a) || (d.setAttribute(c, "t"), x[b + "Bubbles"] = !1 === d.attributes[c].expando);
    }
  })();
  var Oa = /^(?:input|select|textarea)$/i, Xb = /^key/, Yb = /^(?:mouse|contextmenu)|click/, mb = /^(?:focusinfocus|focusoutblur)$/, nb = /^([^.]*)(?:\.(.+)|)$/;
  m.event = {global:{}, add:function(a, b, c, d, e) {
    var f, g, h, l, n, p, q, s, r, t;
    if (h = m._data(a)) {
      c.handler && (l = c, c = l.handler, e = l.selector);
      c.guid || (c.guid = m.guid++);
      (g = h.events) || (g = h.events = {});
      (p = h.handle) || (p = h.handle = function(a) {
        return typeof m === W || a && m.event.triggered === a.type ? void 0 : m.event.dispatch.apply(p.elem, arguments);
      }, p.elem = a);
      b = (b || "").match(Z) || [""];
      for (h = b.length;h--;) {
        f = nb.exec(b[h]) || [], r = t = f[1], f = (f[2] || "").split(".").sort(), r && (n = m.event.special[r] || {}, r = (e ? n.delegateType : n.bindType) || r, n = m.event.special[r] || {}, q = m.extend({type:r, origType:t, data:d, handler:c, guid:c.guid, selector:e, needsContext:e && m.expr.match.needsContext.test(e), namespace:f.join(".")}, l), (s = g[r]) || (s = g[r] = [], s.delegateCount = 0, n.setup && !1 !== n.setup.call(a, d, f, p) || (a.addEventListener ? a.addEventListener(r, p, !1) : 
        a.attachEvent && a.attachEvent("on" + r, p))), n.add && (n.add.call(a, q), q.handler.guid || (q.handler.guid = c.guid)), e ? s.splice(s.delegateCount++, 0, q) : s.push(q), m.event.global[r] = !0);
      }
      a = null;
    }
  }, remove:function(a, b, c, d, e) {
    var f, g, h, l, n, p, q, s, r, t, u, v = m.hasData(a) && m._data(a);
    if (v && (p = v.events)) {
      b = (b || "").match(Z) || [""];
      for (n = b.length;n--;) {
        if (h = nb.exec(b[n]) || [], r = u = h[1], t = (h[2] || "").split(".").sort(), r) {
          q = m.event.special[r] || {};
          r = (d ? q.delegateType : q.bindType) || r;
          s = p[r] || [];
          h = h[2] && RegExp("(^|\\.)" + t.join("\\.(?:.*\\.|)") + "(\\.|$)");
          for (l = f = s.length;f--;) {
            g = s[f], !e && u !== g.origType || c && c.guid !== g.guid || h && !h.test(g.namespace) || d && d !== g.selector && ("**" !== d || !g.selector) || (s.splice(f, 1), g.selector && s.delegateCount--, q.remove && q.remove.call(a, g));
          }
          l && !s.length && (q.teardown && !1 !== q.teardown.call(a, t, v.handle) || m.removeEvent(a, r, v.handle), delete p[r]);
        } else {
          for (r in p) {
            m.event.remove(a, r + b[n], c, d, !0);
          }
        }
      }
      m.isEmptyObject(p) && (delete v.handle, m._removeData(a, "events"));
    }
  }, trigger:function(b, c, d, e) {
    var f, g, h, l, n, p, q = [d || E], r = ba.call(b, "type") ? b.type : b;
    p = ba.call(b, "namespace") ? b.namespace.split(".") : [];
    if (h = f = d = d || E, 3 !== d.nodeType && 8 !== d.nodeType && !mb.test(r + m.event.triggered) && (0 <= r.indexOf(".") && (p = r.split("."), r = p.shift(), p.sort()), g = 0 > r.indexOf(":") && "on" + r, b = b[m.expando] ? b : new m.Event(r, "object" == typeof b && b), b.isTrigger = e ? 2 : 3, b.namespace = p.join("."), b.namespace_re = b.namespace ? RegExp("(^|\\.)" + p.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, b.result = void 0, b.target || (b.target = d), c = null == c ? [b] : m.makeArray(c, 
    [b]), n = m.event.special[r] || {}, e || !n.trigger || !1 !== n.trigger.apply(d, c))) {
      if (!e && !n.noBubble && !m.isWindow(d)) {
        l = n.delegateType || r;
        for (mb.test(l + r) || (h = h.parentNode);h;h = h.parentNode) {
          q.push(h), f = h;
        }
        f === (d.ownerDocument || E) && q.push(f.defaultView || f.parentWindow || a);
      }
      for (p = 0;(h = q[p++]) && !b.isPropagationStopped();) {
        b.type = 1 < p ? l : n.bindType || r, (f = (m._data(h, "events") || {})[b.type] && m._data(h, "handle")) && f.apply(h, c), (f = g && h[g]) && f.apply && m.acceptData(h) && (b.result = f.apply(h, c), !1 === b.result && b.preventDefault());
      }
      if (b.type = r, !(e || b.isDefaultPrevented() || n._default && !1 !== n._default.apply(q.pop(), c)) && m.acceptData(d) && g && d[r] && !m.isWindow(d)) {
        (f = d[g]) && (d[g] = null);
        m.event.triggered = r;
        try {
          d[r]();
        } catch (s) {
        }
        m.event.triggered = void 0;
        f && (d[g] = f);
      }
      return b.result;
    }
  }, dispatch:function(a) {
    a = m.event.fix(a);
    var b, c, d, e, f, g = [], h = aa.call(arguments);
    b = (m._data(this, "events") || {})[a.type] || [];
    var l = m.event.special[a.type] || {};
    if (h[0] = a, a.delegateTarget = this, !l.preDispatch || !1 !== l.preDispatch.call(this, a)) {
      g = m.event.handlers.call(this, a, b);
      for (b = 0;(e = g[b++]) && !a.isPropagationStopped();) {
        for (a.currentTarget = e.elem, f = 0;(d = e.handlers[f++]) && !a.isImmediatePropagationStopped();) {
          a.namespace_re && !a.namespace_re.test(d.namespace) || (a.handleObj = d, a.data = d.data, c = ((m.event.special[d.origType] || {}).handle || d.handler).apply(e.elem, h), void 0 === c || !1 !== (a.result = c) || (a.preventDefault(), a.stopPropagation()));
        }
      }
      return l.postDispatch && l.postDispatch.call(this, a), a.result;
    }
  }, handlers:function(a, b) {
    var c, d, e, f, g = [], h = b.delegateCount, l = a.target;
    if (h && l.nodeType && (!a.button || "click" !== a.type)) {
      for (;l != this;l = l.parentNode || this) {
        if (1 === l.nodeType && (!0 !== l.disabled || "click" !== a.type)) {
          e = [];
          for (f = 0;h > f;f++) {
            d = b[f], c = d.selector + " ", void 0 === e[c] && (e[c] = d.needsContext ? 0 <= m(c, this).index(l) : m.find(c, this, null, [l]).length), e[c] && e.push(d);
          }
          e.length && g.push({elem:l, handlers:e});
        }
      }
    }
    return h < b.length && g.push({elem:this, handlers:b.slice(h)}), g;
  }, fix:function(a) {
    if (a[m.expando]) {
      return a;
    }
    var b, c, d;
    b = a.type;
    var e = a, f = this.fixHooks[b];
    f || (this.fixHooks[b] = f = Yb.test(b) ? this.mouseHooks : Xb.test(b) ? this.keyHooks : {});
    d = f.props ? this.props.concat(f.props) : this.props;
    a = new m.Event(e);
    for (b = d.length;b--;) {
      c = d[b], a[c] = e[c];
    }
    return a.target || (a.target = e.srcElement || E), 3 === a.target.nodeType && (a.target = a.target.parentNode), a.metaKey = !!a.metaKey, f.filter ? f.filter(a, e) : a;
  }, props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "), fixHooks:{}, keyHooks:{props:["char", "charCode", "key", "keyCode"], filter:function(a, b) {
    return null == a.which && (a.which = null != b.charCode ? b.charCode : b.keyCode), a;
  }}, mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "), filter:function(a, b) {
    var c, d, e, f = b.button, g = b.fromElement;
    return null == a.pageX && null != b.clientX && (d = a.target.ownerDocument || E, e = d.documentElement, c = d.body, a.pageX = b.clientX + (e && e.scrollLeft || c && c.scrollLeft || 0) - (e && e.clientLeft || c && c.clientLeft || 0), a.pageY = b.clientY + (e && e.scrollTop || c && c.scrollTop || 0) - (e && e.clientTop || c && c.clientTop || 0)), !a.relatedTarget && g && (a.relatedTarget = g === a.target ? b.toElement : g), a.which || void 0 === f || (a.which = 1 & f ? 1 : 2 & f ? 3 : 4 & f ? 2 : 
    0), a;
  }}, special:{load:{noBubble:!0}, focus:{trigger:function() {
    if (this !== t() && this.focus) {
      try {
        return this.focus(), !1;
      } catch (a) {
      }
    }
  }, delegateType:"focusin"}, blur:{trigger:function() {
    return this === t() && this.blur ? (this.blur(), !1) : void 0;
  }, delegateType:"focusout"}, click:{trigger:function() {
    return m.nodeName(this, "input") && "checkbox" === this.type && this.click ? (this.click(), !1) : void 0;
  }, _default:function(a) {
    return m.nodeName(a.target, "a");
  }}, beforeunload:{postDispatch:function(a) {
    void 0 !== a.result && (a.originalEvent.returnValue = a.result);
  }}}, simulate:function(a, b, c, d) {
    a = m.extend(new m.Event, c, {type:a, isSimulated:!0, originalEvent:{}});
    d ? m.event.trigger(a, null, b) : m.event.dispatch.call(b, a);
    a.isDefaultPrevented() && c.preventDefault();
  }};
  m.removeEvent = E.removeEventListener ? function(a, b, c) {
    a.removeEventListener && a.removeEventListener(b, c, !1);
  } : function(a, b, c) {
    b = "on" + b;
    a.detachEvent && (typeof a[b] === W && (a[b] = null), a.detachEvent(b, c));
  };
  m.Event = function(a, b) {
    return this instanceof m.Event ? (a && a.type ? (this.originalEvent = a, this.type = a.type, this.isDefaultPrevented = a.defaultPrevented || void 0 === a.defaultPrevented && (!1 === a.returnValue || a.getPreventDefault && a.getPreventDefault()) ? s : q) : this.type = a, b && m.extend(this, b), this.timeStamp = a && a.timeStamp || m.now(), void(this[m.expando] = !0)) : new m.Event(a, b);
  };
  m.Event.prototype = {isDefaultPrevented:q, isPropagationStopped:q, isImmediatePropagationStopped:q, preventDefault:function() {
    var a = this.originalEvent;
    this.isDefaultPrevented = s;
    a && (a.preventDefault ? a.preventDefault() : a.returnValue = !1);
  }, stopPropagation:function() {
    var a = this.originalEvent;
    this.isPropagationStopped = s;
    a && (a.stopPropagation && a.stopPropagation(), a.cancelBubble = !0);
  }, stopImmediatePropagation:function() {
    this.isImmediatePropagationStopped = s;
    this.stopPropagation();
  }};
  m.each({mouseenter:"mouseover", mouseleave:"mouseout"}, function(a, b) {
    m.event.special[a] = {delegateType:b, bindType:b, handle:function(a) {
      var c, d = a.relatedTarget, e = a.handleObj;
      return(!d || d !== this && !m.contains(this, d)) && (a.type = e.origType, c = e.handler.apply(this, arguments), a.type = b), c;
    }};
  });
  x.submitBubbles || (m.event.special.submit = {setup:function() {
    return m.nodeName(this, "form") ? !1 : void m.event.add(this, "click._submit keypress._submit", function(a) {
      a = a.target;
      (a = m.nodeName(a, "input") || m.nodeName(a, "button") ? a.form : void 0) && !m._data(a, "submitBubbles") && (m.event.add(a, "submit._submit", function(a) {
        a._submit_bubble = !0;
      }), m._data(a, "submitBubbles", !0));
    });
  }, postDispatch:function(a) {
    a._submit_bubble && (delete a._submit_bubble, this.parentNode && !a.isTrigger && m.event.simulate("submit", this.parentNode, a, !0));
  }, teardown:function() {
    return m.nodeName(this, "form") ? !1 : void m.event.remove(this, "._submit");
  }});
  x.changeBubbles || (m.event.special.change = {setup:function() {
    return Oa.test(this.nodeName) ? (("checkbox" === this.type || "radio" === this.type) && (m.event.add(this, "propertychange._change", function(a) {
      "checked" === a.originalEvent.propertyName && (this._just_changed = !0);
    }), m.event.add(this, "click._change", function(a) {
      this._just_changed && !a.isTrigger && (this._just_changed = !1);
      m.event.simulate("change", this, a, !0);
    })), !1) : void m.event.add(this, "beforeactivate._change", function(a) {
      a = a.target;
      Oa.test(a.nodeName) && !m._data(a, "changeBubbles") && (m.event.add(a, "change._change", function(a) {
        !this.parentNode || a.isSimulated || a.isTrigger || m.event.simulate("change", this.parentNode, a, !0);
      }), m._data(a, "changeBubbles", !0));
    });
  }, handle:function(a) {
    var b = a.target;
    return this !== b || a.isSimulated || a.isTrigger || "radio" !== b.type && "checkbox" !== b.type ? a.handleObj.handler.apply(this, arguments) : void 0;
  }, teardown:function() {
    return m.event.remove(this, "._change"), !Oa.test(this.nodeName);
  }});
  x.focusinBubbles || m.each({focus:"focusin", blur:"focusout"}, function(a, b) {
    var c = function(a) {
      m.event.simulate(b, a.target, m.event.fix(a), !0);
    };
    m.event.special[b] = {setup:function() {
      var d = this.ownerDocument || this, e = m._data(d, b);
      e || d.addEventListener(a, c, !0);
      m._data(d, b, (e || 0) + 1);
    }, teardown:function() {
      var d = this.ownerDocument || this, e = m._data(d, b) - 1;
      e ? m._data(d, b, e) : (d.removeEventListener(a, c, !0), m._removeData(d, b));
    }};
  });
  m.fn.extend({on:function(a, b, c, d, e) {
    var f, g;
    if ("object" == typeof a) {
      "string" != typeof b && (c = c || b, b = void 0);
      for (f in a) {
        this.on(f, b, c, a[f], e);
      }
      return this;
    }
    if (null == c && null == d ? (d = b, c = b = void 0) : null == d && ("string" == typeof b ? (d = c, c = void 0) : (d = c, c = b, b = void 0)), !1 === d) {
      d = q;
    } else {
      if (!d) {
        return this;
      }
    }
    return 1 === e && (g = d, d = function(a) {
      return m().off(a), g.apply(this, arguments);
    }, d.guid = g.guid || (g.guid = m.guid++)), this.each(function() {
      m.event.add(this, a, d, c, b);
    });
  }, one:function(a, b, c, d) {
    return this.on(a, b, c, d, 1);
  }, off:function(a, b, c) {
    var d, e;
    if (a && a.preventDefault && a.handleObj) {
      return d = a.handleObj, m(a.delegateTarget).off(d.namespace ? d.origType + "." + d.namespace : d.origType, d.selector, d.handler), this;
    }
    if ("object" == typeof a) {
      for (e in a) {
        this.off(e, b, a[e]);
      }
      return this;
    }
    return(!1 === b || "function" == typeof b) && (c = b, b = void 0), !1 === c && (c = q), this.each(function() {
      m.event.remove(this, a, c, b);
    });
  }, trigger:function(a, b) {
    return this.each(function() {
      m.event.trigger(a, b, this);
    });
  }, triggerHandler:function(a, b) {
    var c = this[0];
    return c ? m.event.trigger(a, b, c, !0) : void 0;
  }});
  var cb = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video", Zb = / jQuery\d+="(?:null|\d+)"/g, ob = RegExp("<(?:" + cb + ")[\\s/>]", "i"), Pa = /^\s+/, pb = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, qb = /<([\w:]+)/, rb = /<tbody/i, $b = /<|&#?\w+;/, ac = /<(?:script|style|link)/i, bc = /checked\s*(?:[^=]|=\s*.checked.)/i, sb = /^$|\/(?:java|ecma)script/i, 
  Kb = /^true\/(.*)/, cc = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g, V = {option:[1, "<select multiple='multiple'>", "</select>"], legend:[1, "<fieldset>", "</fieldset>"], area:[1, "<map>", "</map>"], param:[1, "<object>", "</object>"], thead:[1, "<table>", "</table>"], tr:[2, "<table><tbody>", "</tbody></table>"], col:[2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], td:[3, "<table><tbody><tr>", "</tr></tbody></table>"], _default:x.htmlSerialize ? [0, "", ""] : [1, "X<div>", "</div>"]}, 
  Qa = u(E).appendChild(E.createElement("div"));
  V.optgroup = V.option;
  V.tbody = V.tfoot = V.colgroup = V.caption = V.thead;
  V.th = V.td;
  m.extend({clone:function(a, b, c) {
    var d, e, f, g, h, l = m.contains(a.ownerDocument, a);
    if (x.html5Clone || m.isXMLDoc(a) || !ob.test("<" + a.nodeName + ">") ? f = a.cloneNode(!0) : (Qa.innerHTML = a.outerHTML, Qa.removeChild(f = Qa.firstChild)), !(x.noCloneEvent && x.noCloneChecked || 1 !== a.nodeType && 11 !== a.nodeType || m.isXMLDoc(a))) {
      for (d = v(f), h = v(a), g = 0;null != (e = h[g]);++g) {
        if (d[g]) {
          var n = d[g], p = void 0, q = void 0, r = void 0;
          if (1 === n.nodeType) {
            if (p = n.nodeName.toLowerCase(), !x.noCloneEvent && n[m.expando]) {
              r = m._data(n);
              for (q in r.events) {
                m.removeEvent(n, q, r.handle);
              }
              n.removeAttribute(m.expando);
            }
            "script" === p && n.text !== e.text ? (z(n).text = e.text, y(n)) : "object" === p ? (n.parentNode && (n.outerHTML = e.outerHTML), x.html5Clone && e.innerHTML && !m.trim(n.innerHTML) && (n.innerHTML = e.innerHTML)) : "input" === p && Ia.test(e.type) ? (n.defaultChecked = n.checked = e.checked, n.value !== e.value && (n.value = e.value)) : "option" === p ? n.defaultSelected = n.selected = e.defaultSelected : ("input" === p || "textarea" === p) && (n.defaultValue = e.defaultValue);
          }
        }
      }
    }
    if (b) {
      if (c) {
        for (h = h || v(a), d = d || v(f), g = 0;null != (e = h[g]);g++) {
          G(e, d[g]);
        }
      } else {
        G(a, f);
      }
    }
    return d = v(f, "script"), 0 < d.length && C(d, !l && v(a, "script")), f;
  }, buildFragment:function(a, b, c, d) {
    for (var e, f, g, h, l, n, p, q = a.length, r = u(b), s = [], t = 0;q > t;t++) {
      if (f = a[t], f || 0 === f) {
        if ("object" === m.type(f)) {
          m.merge(s, f.nodeType ? [f] : f);
        } else {
          if ($b.test(f)) {
            h = h || r.appendChild(b.createElement("div"));
            l = (qb.exec(f) || ["", ""])[1].toLowerCase();
            p = V[l] || V._default;
            h.innerHTML = p[1] + f.replace(pb, "<$1></$2>") + p[2];
            for (e = p[0];e--;) {
              h = h.lastChild;
            }
            if (!x.leadingWhitespace && Pa.test(f) && s.push(b.createTextNode(Pa.exec(f)[0])), !x.tbody) {
              for (e = (f = "table" !== l || rb.test(f) ? "<table>" !== p[1] || rb.test(f) ? 0 : h : h.firstChild) && f.childNodes.length;e--;) {
                m.nodeName(n = f.childNodes[e], "tbody") && !n.childNodes.length && f.removeChild(n);
              }
            }
            m.merge(s, h.childNodes);
            for (h.textContent = "";h.firstChild;) {
              h.removeChild(h.firstChild);
            }
            h = r.lastChild;
          } else {
            s.push(b.createTextNode(f));
          }
        }
      }
    }
    h && r.removeChild(h);
    x.appendChecked || m.grep(v(s, "input"), A);
    for (t = 0;f = s[t++];) {
      if ((!d || -1 === m.inArray(f, d)) && (g = m.contains(f.ownerDocument, f), h = v(r.appendChild(f), "script"), g && C(h), c)) {
        for (e = 0;f = h[e++];) {
          sb.test(f.type || "") && c.push(f);
        }
      }
    }
    return r;
  }, cleanData:function(a, b) {
    for (var c, d, e, f, g = 0, h = m.expando, l = m.cache, n = x.deleteExpando, p = m.event.special;null != (c = a[g]);g++) {
      if ((b || m.acceptData(c)) && (e = c[h], f = e && l[e])) {
        if (f.events) {
          for (d in f.events) {
            p[d] ? m.event.remove(c, d) : m.removeEvent(c, d, f.handle);
          }
        }
        l[e] && (delete l[e], n ? delete c[h] : typeof c.removeAttribute !== W ? c.removeAttribute(h) : c[h] = null, T.push(e));
      }
    }
  }});
  m.fn.extend({text:function(a) {
    return U(this, function(a) {
      return void 0 === a ? m.text(this) : this.empty().append((this[0] && this[0].ownerDocument || E).createTextNode(a));
    }, null, a, arguments.length);
  }, append:function() {
    return this.domManip(arguments, function(a) {
      1 !== this.nodeType && 11 !== this.nodeType && 9 !== this.nodeType || w(this, a).appendChild(a);
    });
  }, prepend:function() {
    return this.domManip(arguments, function(a) {
      if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
        var b = w(this, a);
        b.insertBefore(a, b.firstChild);
      }
    });
  }, before:function() {
    return this.domManip(arguments, function(a) {
      this.parentNode && this.parentNode.insertBefore(a, this);
    });
  }, after:function() {
    return this.domManip(arguments, function(a) {
      this.parentNode && this.parentNode.insertBefore(a, this.nextSibling);
    });
  }, remove:function(a, b) {
    for (var c, d = a ? m.filter(a, this) : this, e = 0;null != (c = d[e]);e++) {
      b || 1 !== c.nodeType || m.cleanData(v(c)), c.parentNode && (b && m.contains(c.ownerDocument, c) && C(v(c, "script")), c.parentNode.removeChild(c));
    }
    return this;
  }, empty:function() {
    for (var a, b = 0;null != (a = this[b]);b++) {
      for (1 === a.nodeType && m.cleanData(v(a, !1));a.firstChild;) {
        a.removeChild(a.firstChild);
      }
      a.options && m.nodeName(a, "select") && (a.options.length = 0);
    }
    return this;
  }, clone:function(a, b) {
    return a = null == a ? !1 : a, b = null == b ? a : b, this.map(function() {
      return m.clone(this, a, b);
    });
  }, html:function(a) {
    return U(this, function(a) {
      var b = this[0] || {}, c = 0, d = this.length;
      if (void 0 === a) {
        return 1 === b.nodeType ? b.innerHTML.replace(Zb, "") : void 0;
      }
      if (!("string" != typeof a || ac.test(a) || !x.htmlSerialize && ob.test(a) || !x.leadingWhitespace && Pa.test(a) || V[(qb.exec(a) || ["", ""])[1].toLowerCase()])) {
        a = a.replace(pb, "<$1></$2>");
        try {
          for (;d > c;c++) {
            b = this[c] || {}, 1 === b.nodeType && (m.cleanData(v(b, !1)), b.innerHTML = a);
          }
          b = 0;
        } catch (e) {
        }
      }
      b && this.empty().append(a);
    }, null, a, arguments.length);
  }, replaceWith:function() {
    var a = arguments[0];
    return this.domManip(arguments, function(b) {
      a = this.parentNode;
      m.cleanData(v(this));
      a && a.replaceChild(b, this);
    }), a && (a.length || a.nodeType) ? this : this.remove();
  }, detach:function(a) {
    return this.remove(a, !0);
  }, domManip:function(a, b) {
    a = hb.apply([], a);
    var c, d, e, f, g = 0, h = this.length, l = this, n = h - 1, p = a[0], q = m.isFunction(p);
    if (q || 1 < h && "string" == typeof p && !x.checkClone && bc.test(p)) {
      return this.each(function(c) {
        var d = l.eq(c);
        q && (a[0] = p.call(this, c, d.html()));
        d.domManip(a, b);
      });
    }
    if (h && (f = m.buildFragment(a, this[0].ownerDocument, !1, this), c = f.firstChild, 1 === f.childNodes.length && (f = c), c)) {
      e = m.map(v(f, "script"), z);
      for (d = e.length;h > g;g++) {
        c = f, g !== n && (c = m.clone(c, !0, !0), d && m.merge(e, v(c, "script"))), b.call(this[g], c, g);
      }
      if (d) {
        for (f = e[e.length - 1].ownerDocument, m.map(e, y), g = 0;d > g;g++) {
          c = e[g], sb.test(c.type || "") && !m._data(c, "globalEval") && m.contains(f, c) && (c.src ? m._evalUrl && m._evalUrl(c.src) : m.globalEval((c.text || c.textContent || c.innerHTML || "").replace(cc, "")));
        }
      }
      f = c = null;
    }
    return this;
  }});
  m.each({appendTo:"append", prependTo:"prepend", insertBefore:"before", insertAfter:"after", replaceAll:"replaceWith"}, function(a, b) {
    m.fn[a] = function(a) {
      for (var c = 0, d = [], e = m(a), f = e.length - 1;f >= c;c++) {
        a = c === f ? this : this.clone(!0), m(e[c])[b](a), Ma.apply(d, a.get());
      }
      return this.pushStack(d);
    };
  });
  var sa, db = {};
  !function() {
    var a, b, c = E.createElement("div");
    c.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
    a = c.getElementsByTagName("a")[0];
    a.style.cssText = "float:left;opacity:.5";
    x.opacity = /^0.5/.test(a.style.opacity);
    x.cssFloat = !!a.style.cssFloat;
    c.style.backgroundClip = "content-box";
    c.cloneNode(!0).style.backgroundClip = "";
    x.clearCloneStyle = "content-box" === c.style.backgroundClip;
    a = c = null;
    x.shrinkWrapBlocks = function() {
      var a, c, d;
      if (null == b) {
        if (a = E.getElementsByTagName("body")[0], !a) {
          return;
        }
        c = E.createElement("div");
        d = E.createElement("div");
        a.appendChild(c).appendChild(d);
        b = !1;
        typeof d.style.zoom !== W && (d.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;padding:0;margin:0;border:0;width:1px;padding:1px;zoom:1", d.innerHTML = "<div></div>", d.firstChild.style.width = "5px", b = 3 !== d.offsetWidth);
        a.removeChild(c);
      }
      return b;
    };
  }();
  var ub = /^margin/, wa = RegExp("^(" + Ca + ")(?!px)[a-z%]+$", "i"), la, ea, dc = /^(top|right|bottom|left)$/;
  a.getComputedStyle ? (la = function(a) {
    return a.ownerDocument.defaultView.getComputedStyle(a, null);
  }, ea = function(a, b, c) {
    var d, e, f, g, h = a.style;
    return c = c || la(a), g = c ? c.getPropertyValue(b) || c[b] : void 0, c && ("" !== g || m.contains(a.ownerDocument, a) || (g = m.style(a, b)), wa.test(g) && ub.test(b) && (d = h.width, e = h.minWidth, f = h.maxWidth, h.minWidth = h.maxWidth = h.width = g, g = c.width, h.width = d, h.minWidth = e, h.maxWidth = f)), void 0 === g ? g : g + "";
  }) : E.documentElement.currentStyle && (la = function(a) {
    return a.currentStyle;
  }, ea = function(a, b, c) {
    var d, e, f, g, h = a.style;
    return c = c || la(a), g = c ? c[b] : void 0, null == g && h && h[b] && (g = h[b]), wa.test(g) && !dc.test(b) && (d = h.left, e = a.runtimeStyle, f = e && e.left, f && (e.left = a.currentStyle.left), h.left = "fontSize" === b ? "1em" : g, g = h.pixelLeft + "px", h.left = d, f && (e.left = f)), void 0 === g ? g : g + "" || "auto";
  });
  !function() {
    function b() {
      var c, d, l = E.getElementsByTagName("body")[0];
      l && (c = E.createElement("div"), d = E.createElement("div"), c.style.cssText = n, l.appendChild(c).appendChild(d), d.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;display:block;padding:1px;border:1px;width:4px;margin-top:1%;top:1%", m.swap(l, null != l.style.zoom ? {zoom:1} : {}, function() {
        e = 4 === d.offsetWidth;
      }), f = !0, g = !1, h = !0, a.getComputedStyle && (g = "1%" !== (a.getComputedStyle(d, null) || {}).top, f = "4px" === (a.getComputedStyle(d, null) || {width:"4px"}).width), l.removeChild(c), d = l = null);
    }
    var c, d, e, f, g, h, l = E.createElement("div"), n = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px";
    l.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
    c = l.getElementsByTagName("a")[0];
    c.style.cssText = "float:left;opacity:.5";
    x.opacity = /^0.5/.test(c.style.opacity);
    x.cssFloat = !!c.style.cssFloat;
    l.style.backgroundClip = "content-box";
    l.cloneNode(!0).style.backgroundClip = "";
    x.clearCloneStyle = "content-box" === l.style.backgroundClip;
    c = l = null;
    m.extend(x, {reliableHiddenOffsets:function() {
      if (null != d) {
        return d;
      }
      var a, b, c, e = E.createElement("div"), f = E.getElementsByTagName("body")[0];
      if (f) {
        return e.setAttribute("className", "t"), e.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", a = E.createElement("div"), a.style.cssText = n, f.appendChild(a).appendChild(e), e.innerHTML = "<table><tr><td></td><td>t</td></tr></table>", b = e.getElementsByTagName("td"), b[0].style.cssText = "padding:0;margin:0;border:0;display:none", c = 0 === b[0].offsetHeight, b[0].style.display = "", b[1].style.display = "none", d = c && 0 === b[0].offsetHeight, f.removeChild(a), 
        d;
      }
    }, boxSizing:function() {
      return null == e && b(), e;
    }, boxSizingReliable:function() {
      return null == f && b(), f;
    }, pixelPosition:function() {
      return null == g && b(), g;
    }, reliableMarginRight:function() {
      var b, c, d, e;
      if (null == h && a.getComputedStyle) {
        if (b = E.getElementsByTagName("body")[0], !b) {
          return;
        }
        c = E.createElement("div");
        d = E.createElement("div");
        c.style.cssText = n;
        b.appendChild(c).appendChild(d);
        e = d.appendChild(E.createElement("div"));
        e.style.cssText = d.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;padding:0;margin:0;border:0";
        e.style.marginRight = e.style.width = "0";
        d.style.width = "1px";
        h = !parseFloat((a.getComputedStyle(e, null) || {}).marginRight);
        b.removeChild(c);
      }
      return h;
    }});
  }();
  m.swap = function(a, b, c, d) {
    var e, f = {};
    for (e in b) {
      f[e] = a.style[e], a.style[e] = b[e];
    }
    c = c.apply(a, d || []);
    for (e in b) {
      a.style[e] = f[e];
    }
    return c;
  };
  var Ra = /alpha\([^)]*\)/i, ec = /opacity\s*=\s*([^)]*)/, fc = /^(none|table(?!-c[ea]).+)/, Lb = RegExp("^(" + Ca + ")(.*)$", "i"), gc = RegExp("^([+-])=(" + Ca + ")", "i"), hc = {position:"absolute", visibility:"hidden", display:"block"}, vb = {letterSpacing:0, fontWeight:400}, eb = ["Webkit", "O", "Moz", "ms"];
  m.extend({cssHooks:{opacity:{get:function(a, b) {
    if (b) {
      var c = ea(a, "opacity");
      return "" === c ? "1" : c;
    }
  }}}, cssNumber:{columnCount:!0, fillOpacity:!0, fontWeight:!0, lineHeight:!0, opacity:!0, order:!0, orphans:!0, widows:!0, zIndex:!0, zoom:!0}, cssProps:{"float":x.cssFloat ? "cssFloat" : "styleFloat"}, style:function(a, b, c, d) {
    if (a && 3 !== a.nodeType && 8 !== a.nodeType && a.style) {
      var e, f, g, h = m.camelCase(b), l = a.style;
      if (b = m.cssProps[h] || (m.cssProps[h] = J(l, h)), g = m.cssHooks[b] || m.cssHooks[h], void 0 === c) {
        return g && "get" in g && void 0 !== (e = g.get(a, !1, d)) ? e : l[b];
      }
      if (f = typeof c, "string" === f && (e = gc.exec(c)) && (c = (e[1] + 1) * e[2] + parseFloat(m.css(a, b)), f = "number"), null != c && c === c && ("number" !== f || m.cssNumber[h] || (c += "px"), x.clearCloneStyle || "" !== c || 0 !== b.indexOf("background") || (l[b] = "inherit"), !(g && "set" in g && void 0 === (c = g.set(a, c, d))))) {
        try {
          l[b] = "", l[b] = c;
        } catch (n) {
        }
      }
    }
  }, css:function(a, b, c, d) {
    var e, f, g, h = m.camelCase(b);
    return b = m.cssProps[h] || (m.cssProps[h] = J(a.style, h)), g = m.cssHooks[b] || m.cssHooks[h], g && "get" in g && (f = g.get(a, !0, c)), void 0 === f && (f = ea(a, b, d)), "normal" === f && b in vb && (f = vb[b]), "" === c || c ? (e = parseFloat(f), !0 === c || m.isNumeric(e) ? e || 0 : f) : f;
  }});
  m.each(["height", "width"], function(a, b) {
    m.cssHooks[b] = {get:function(a, c, d) {
      return c ? 0 === a.offsetWidth && fc.test(m.css(a, "display")) ? m.swap(a, hc, function() {
        return Y(a, b, d);
      }) : Y(a, b, d) : void 0;
    }, set:function(a, c, d) {
      var e = d && la(a);
      return D(a, c, d ? B(a, b, d, x.boxSizing() && "border-box" === m.css(a, "boxSizing", !1, e), e) : 0);
    }};
  });
  x.opacity || (m.cssHooks.opacity = {get:function(a, b) {
    return ec.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? 0.01 * parseFloat(RegExp.$1) + "" : b ? "1" : "";
  }, set:function(a, b) {
    var c = a.style, d = a.currentStyle, e = m.isNumeric(b) ? "alpha(opacity=" + 100 * b + ")" : "", f = d && d.filter || c.filter || "";
    c.zoom = 1;
    (1 <= b || "" === b) && "" === m.trim(f.replace(Ra, "")) && c.removeAttribute && (c.removeAttribute("filter"), "" === b || d && !d.filter) || (c.filter = Ra.test(f) ? f.replace(Ra, e) : f + " " + e);
  }});
  m.cssHooks.marginRight = Q(x.reliableMarginRight, function(a, b) {
    return b ? m.swap(a, {display:"inline-block"}, ea, [a, "marginRight"]) : void 0;
  });
  m.each({margin:"", padding:"", border:"Width"}, function(a, b) {
    m.cssHooks[a + b] = {expand:function(c) {
      var d = 0, e = {};
      for (c = "string" == typeof c ? c.split(" ") : [c];4 > d;d++) {
        e[a + ka[d] + b] = c[d] || c[d - 2] || c[0];
      }
      return e;
    }};
    ub.test(a) || (m.cssHooks[a + b].set = D);
  });
  m.fn.extend({css:function(a, b) {
    return U(this, function(a, b, c) {
      var d, e = {}, f = 0;
      if (m.isArray(b)) {
        c = la(a);
        for (d = b.length;d > f;f++) {
          e[b[f]] = m.css(a, b[f], !1, c);
        }
        return e;
      }
      return void 0 !== c ? m.style(a, b, c) : m.css(a, b);
    }, a, b, 1 < arguments.length);
  }, show:function() {
    return N(this, !0);
  }, hide:function() {
    return N(this);
  }, toggle:function(a) {
    return "boolean" == typeof a ? a ? this.show() : this.hide() : this.each(function() {
      ta(this) ? m(this).show() : m(this).hide();
    });
  }});
  m.Tween = I;
  I.prototype = {constructor:I, init:function(a, b, c, d, e, f) {
    this.elem = a;
    this.prop = c;
    this.easing = e || "swing";
    this.options = b;
    this.start = this.now = this.cur();
    this.end = d;
    this.unit = f || (m.cssNumber[c] ? "" : "px");
  }, cur:function() {
    var a = I.propHooks[this.prop];
    return a && a.get ? a.get(this) : I.propHooks._default.get(this);
  }, run:function(a) {
    var b, c = I.propHooks[this.prop];
    return this.pos = b = this.options.duration ? m.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration) : a, this.now = (this.end - this.start) * b + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), c && c.set ? c.set(this) : I.propHooks._default.set(this), this;
  }};
  I.prototype.init.prototype = I.prototype;
  I.propHooks = {_default:{get:function(a) {
    var b;
    return null == a.elem[a.prop] || a.elem.style && null != a.elem.style[a.prop] ? (b = m.css(a.elem, a.prop, ""), b && "auto" !== b ? b : 0) : a.elem[a.prop];
  }, set:function(a) {
    m.fx.step[a.prop] ? m.fx.step[a.prop](a) : a.elem.style && (null != a.elem.style[m.cssProps[a.prop]] || m.cssHooks[a.prop]) ? m.style(a.elem, a.prop, a.now + a.unit) : a.elem[a.prop] = a.now;
  }}};
  I.propHooks.scrollTop = I.propHooks.scrollLeft = {set:function(a) {
    a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now);
  }};
  m.easing = {linear:function(a) {
    return a;
  }, swing:function(a) {
    return 0.5 - Math.cos(a * Math.PI) / 2;
  }};
  m.fx = I.prototype.init;
  m.fx.step = {};
  var fa, Ea, ic = /^(?:toggle|show|hide)$/, wb = RegExp("^(?:([+-])=|)(" + Ca + ")([a-z%]*)$", "i"), jc = /queueHooks$/, xa = [function(a, b, c) {
    var d, e, f, g, h, l, n, p = this, q = {}, r = a.style, s = a.nodeType && ta(a), t = m._data(a, "fxshow");
    c.queue || (g = m._queueHooks(a, "fx"), null == g.unqueued && (g.unqueued = 0, h = g.empty.fire, g.empty.fire = function() {
      g.unqueued || h();
    }), g.unqueued++, p.always(function() {
      p.always(function() {
        g.unqueued--;
        m.queue(a, "fx").length || g.empty.fire();
      });
    }));
    1 === a.nodeType && ("height" in b || "width" in b) && (c.overflow = [r.overflow, r.overflowX, r.overflowY], l = m.css(a, "display"), n = M(a.nodeName), "none" === l && (l = n), "inline" === l && "none" === m.css(a, "float") && (x.inlineBlockNeedsLayout && "inline" !== n ? r.zoom = 1 : r.display = "inline-block"));
    c.overflow && (r.overflow = "hidden", x.shrinkWrapBlocks() || p.always(function() {
      r.overflow = c.overflow[0];
      r.overflowX = c.overflow[1];
      r.overflowY = c.overflow[2];
    }));
    for (d in b) {
      if (e = b[d], ic.exec(e)) {
        if (delete b[d], f = f || "toggle" === e, e === (s ? "hide" : "show")) {
          if ("show" !== e || !t || void 0 === t[d]) {
            continue;
          }
          s = !0;
        }
        q[d] = t && t[d] || m.style(a, d);
      }
    }
    if (!m.isEmptyObject(q)) {
      for (d in t ? "hidden" in t && (s = t.hidden) : t = m._data(a, "fxshow", {}), f && (t.hidden = !s), s ? m(a).show() : p.done(function() {
        m(a).hide();
      }), p.done(function() {
        var b;
        m._removeData(a, "fxshow");
        for (b in q) {
          m.style(a, b, q[b]);
        }
      }), q) {
        b = Ya(s ? t[d] : 0, d, p), d in t || (t[d] = b.start, s && (b.end = b.start, b.start = "width" === d || "height" === d ? 1 : 0));
      }
    }
  }], ua = {"*":[function(a, b) {
    var c = this.createTween(a, b), d = c.cur(), e = wb.exec(b), f = e && e[3] || (m.cssNumber[a] ? "" : "px"), g = (m.cssNumber[a] || "px" !== f && +d) && wb.exec(m.css(c.elem, a)), h = 1, l = 20;
    if (g && g[3] !== f) {
      f = f || g[3];
      e = e || [];
      g = +d || 1;
      do {
        h = h || ".5", g /= h, m.style(c.elem, a, g + f);
      } while (h !== (h = c.cur() / d) && 1 !== h && --l);
    }
    return e && (g = c.start = +g || +d || 0, c.unit = f, c.end = e[1] ? g + (e[1] + 1) * e[2] : +e[2]), c;
  }]};
  m.Animation = m.extend(Za, {tweener:function(a, b) {
    m.isFunction(a) ? (b = a, a = ["*"]) : a = a.split(" ");
    for (var c, d = 0, e = a.length;e > d;d++) {
      c = a[d], ua[c] = ua[c] || [], ua[c].unshift(b);
    }
  }, prefilter:function(a, b) {
    b ? xa.unshift(a) : xa.push(a);
  }});
  m.speed = function(a, b, c) {
    var d = a && "object" == typeof a ? m.extend({}, a) : {complete:c || !c && b || m.isFunction(a) && a, duration:a, easing:c && b || b && !m.isFunction(b) && b};
    return d.duration = m.fx.off ? 0 : "number" == typeof d.duration ? d.duration : d.duration in m.fx.speeds ? m.fx.speeds[d.duration] : m.fx.speeds._default, (null == d.queue || !0 === d.queue) && (d.queue = "fx"), d.old = d.complete, d.complete = function() {
      m.isFunction(d.old) && d.old.call(this);
      d.queue && m.dequeue(this, d.queue);
    }, d;
  };
  m.fn.extend({fadeTo:function(a, b, c, d) {
    return this.filter(ta).css("opacity", 0).show().end().animate({opacity:b}, a, c, d);
  }, animate:function(a, b, c, d) {
    var e = m.isEmptyObject(a), f = m.speed(b, c, d);
    b = function() {
      var b = Za(this, m.extend({}, a), f);
      (e || m._data(this, "finish")) && b.stop(!0);
    };
    return b.finish = b, e || !1 === f.queue ? this.each(b) : this.queue(f.queue, b);
  }, stop:function(a, b, c) {
    var d = function(a) {
      var b = a.stop;
      delete a.stop;
      b(c);
    };
    return "string" != typeof a && (c = b, b = a, a = void 0), b && !1 !== a && this.queue(a || "fx", []), this.each(function() {
      var b = !0, e = null != a && a + "queueHooks", f = m.timers, g = m._data(this);
      if (e) {
        g[e] && g[e].stop && d(g[e]);
      } else {
        for (e in g) {
          g[e] && g[e].stop && jc.test(e) && d(g[e]);
        }
      }
      for (e = f.length;e--;) {
        f[e].elem !== this || null != a && f[e].queue !== a || (f[e].anim.stop(c), b = !1, f.splice(e, 1));
      }
      !b && c || m.dequeue(this, a);
    });
  }, finish:function(a) {
    return!1 !== a && (a = a || "fx"), this.each(function() {
      var b, c = m._data(this), d = c[a + "queue"];
      b = c[a + "queueHooks"];
      var e = m.timers, f = d ? d.length : 0;
      c.finish = !0;
      m.queue(this, a, []);
      b && b.stop && b.stop.call(this, !0);
      for (b = e.length;b--;) {
        e[b].elem === this && e[b].queue === a && (e[b].anim.stop(!0), e.splice(b, 1));
      }
      for (b = 0;f > b;b++) {
        d[b] && d[b].finish && d[b].finish.call(this);
      }
      delete c.finish;
    });
  }});
  m.each(["toggle", "show", "hide"], function(a, b) {
    var c = m.fn[b];
    m.fn[b] = function(a, d, e) {
      return null == a || "boolean" == typeof a ? c.apply(this, arguments) : this.animate(va(b, !0), a, d, e);
    };
  });
  m.each({slideDown:va("show"), slideUp:va("hide"), slideToggle:va("toggle"), fadeIn:{opacity:"show"}, fadeOut:{opacity:"hide"}, fadeToggle:{opacity:"toggle"}}, function(a, b) {
    m.fn[a] = function(a, c, d) {
      return this.animate(b, a, c, d);
    };
  });
  m.timers = [];
  m.fx.tick = function() {
    var a, b = m.timers, c = 0;
    for (fa = m.now();c < b.length;c++) {
      a = b[c], a() || b[c] !== a || b.splice(c--, 1);
    }
    b.length || m.fx.stop();
    fa = void 0;
  };
  m.fx.timer = function(a) {
    m.timers.push(a);
    a() ? m.fx.start() : m.timers.pop();
  };
  m.fx.interval = 13;
  m.fx.start = function() {
    Ea || (Ea = setInterval(m.fx.tick, m.fx.interval));
  };
  m.fx.stop = function() {
    clearInterval(Ea);
    Ea = null;
  };
  m.fx.speeds = {slow:600, fast:200, _default:400};
  m.fn.delay = function(a, b) {
    return a = m.fx ? m.fx.speeds[a] || a : a, b = b || "fx", this.queue(b, function(b, c) {
      var d = setTimeout(b, a);
      c.stop = function() {
        clearTimeout(d);
      };
    });
  };
  (function() {
    var a, b, c, d, e = E.createElement("div");
    e.setAttribute("className", "t");
    e.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
    a = e.getElementsByTagName("a")[0];
    c = E.createElement("select");
    d = c.appendChild(E.createElement("option"));
    b = e.getElementsByTagName("input")[0];
    a.style.cssText = "top:1px";
    x.getSetAttribute = "t" !== e.className;
    x.style = /top/.test(a.getAttribute("style"));
    x.hrefNormalized = "/a" === a.getAttribute("href");
    x.checkOn = !!b.value;
    x.optSelected = d.selected;
    x.enctype = !!E.createElement("form").enctype;
    c.disabled = !0;
    x.optDisabled = !d.disabled;
    b = E.createElement("input");
    b.setAttribute("value", "");
    x.input = "" === b.getAttribute("value");
    b.value = "t";
    b.setAttribute("type", "radio");
    x.radioValue = "t" === b.value;
  })();
  var kc = /\r/g;
  m.fn.extend({val:function(a) {
    var b, c, d, e = this[0];
    if (arguments.length) {
      return d = m.isFunction(a), this.each(function(c) {
        var e;
        1 === this.nodeType && (e = d ? a.call(this, c, m(this).val()) : a, null == e ? e = "" : "number" == typeof e ? e += "" : m.isArray(e) && (e = m.map(e, function(a) {
          return null == a ? "" : a + "";
        })), b = m.valHooks[this.type] || m.valHooks[this.nodeName.toLowerCase()], b && "set" in b && void 0 !== b.set(this, e, "value") || (this.value = e));
      });
    }
    if (e) {
      return b = m.valHooks[e.type] || m.valHooks[e.nodeName.toLowerCase()], b && "get" in b && void 0 !== (c = b.get(e, "value")) ? c : (c = e.value, "string" == typeof c ? c.replace(kc, "") : null == c ? "" : c);
    }
  }});
  m.extend({valHooks:{option:{get:function(a) {
    var b = m.find.attr(a, "value");
    return null != b ? b : m.text(a);
  }}, select:{get:function(a) {
    for (var b, c = a.options, d = a.selectedIndex, e = "select-one" === a.type || 0 > d, f = e ? null : [], g = e ? d + 1 : c.length, h = 0 > d ? g : e ? d : 0;g > h;h++) {
      if (b = c[h], !(!b.selected && h !== d || (x.optDisabled ? b.disabled : null !== b.getAttribute("disabled")) || b.parentNode.disabled && m.nodeName(b.parentNode, "optgroup"))) {
        if (a = m(b).val(), e) {
          return a;
        }
        f.push(a);
      }
    }
    return f;
  }, set:function(a, b) {
    for (var c, d, e = a.options, f = m.makeArray(b), g = e.length;g--;) {
      if (d = e[g], 0 <= m.inArray(m.valHooks.option.get(d), f)) {
        try {
          d.selected = c = !0;
        } catch (h) {
          d.scrollHeight;
        }
      } else {
        d.selected = !1;
      }
    }
    return c || (a.selectedIndex = -1), e;
  }}}});
  m.each(["radio", "checkbox"], function() {
    m.valHooks[this] = {set:function(a, b) {
      return m.isArray(b) ? a.checked = 0 <= m.inArray(m(a).val(), b) : void 0;
    }};
    x.checkOn || (m.valHooks[this].get = function(a) {
      return null === a.getAttribute("value") ? "on" : a.value;
    });
  });
  var ra, xb, ha = m.expr.attrHandle, Sa = /^(?:checked|selected)$/i, ia = x.getSetAttribute, Fa = x.input;
  m.fn.extend({attr:function(a, b) {
    return U(this, m.attr, a, b, 1 < arguments.length);
  }, removeAttr:function(a) {
    return this.each(function() {
      m.removeAttr(this, a);
    });
  }});
  m.extend({attr:function(a, b, c) {
    var d, e, f = a.nodeType;
    if (a && 3 !== f && 8 !== f && 2 !== f) {
      return typeof a.getAttribute === W ? m.prop(a, b, c) : (1 === f && m.isXMLDoc(a) || (b = b.toLowerCase(), d = m.attrHooks[b] || (m.expr.match.bool.test(b) ? xb : ra)), void 0 === c ? d && "get" in d && null !== (e = d.get(a, b)) ? e : (e = m.find.attr(a, b), null == e ? void 0 : e) : null !== c ? d && "set" in d && void 0 !== (e = d.set(a, c, b)) ? e : (a.setAttribute(b, c + ""), c) : void m.removeAttr(a, b));
    }
  }, removeAttr:function(a, b) {
    var c, d, e = 0, f = b && b.match(Z);
    if (f && 1 === a.nodeType) {
      for (;c = f[e++];) {
        d = m.propFix[c] || c, m.expr.match.bool.test(c) ? Fa && ia || !Sa.test(c) ? a[d] = !1 : a[m.camelCase("default-" + c)] = a[d] = !1 : m.attr(a, c, ""), a.removeAttribute(ia ? c : d);
      }
    }
  }, attrHooks:{type:{set:function(a, b) {
    if (!x.radioValue && "radio" === b && m.nodeName(a, "input")) {
      var c = a.value;
      return a.setAttribute("type", b), c && (a.value = c), b;
    }
  }}}});
  xb = {set:function(a, b, c) {
    return!1 === b ? m.removeAttr(a, c) : Fa && ia || !Sa.test(c) ? a.setAttribute(!ia && m.propFix[c] || c, c) : a[m.camelCase("default-" + c)] = a[c] = !0, c;
  }};
  m.each(m.expr.match.bool.source.match(/\w+/g), function(a, b) {
    var c = ha[b] || m.find.attr;
    ha[b] = Fa && ia || !Sa.test(b) ? function(a, b, d) {
      var e, f;
      return d || (f = ha[b], ha[b] = e, e = null != c(a, b, d) ? b.toLowerCase() : null, ha[b] = f), e;
    } : function(a, b, c) {
      return c ? void 0 : a[m.camelCase("default-" + b)] ? b.toLowerCase() : null;
    };
  });
  Fa && ia || (m.attrHooks.value = {set:function(a, b, c) {
    return m.nodeName(a, "input") ? void(a.defaultValue = b) : ra && ra.set(a, b, c);
  }});
  ia || (ra = {set:function(a, b, c) {
    var d = a.getAttributeNode(c);
    return d || a.setAttributeNode(d = a.ownerDocument.createAttribute(c)), d.value = b += "", "value" === c || b === a.getAttribute(c) ? b : void 0;
  }}, ha.id = ha.name = ha.coords = function(a, b, c) {
    var d;
    return c ? void 0 : (d = a.getAttributeNode(b)) && "" !== d.value ? d.value : null;
  }, m.valHooks.button = {get:function(a, b) {
    var c = a.getAttributeNode(b);
    return c && c.specified ? c.value : void 0;
  }, set:ra.set}, m.attrHooks.contenteditable = {set:function(a, b, c) {
    ra.set(a, "" === b ? !1 : b, c);
  }}, m.each(["width", "height"], function(a, b) {
    m.attrHooks[b] = {set:function(a, c) {
      return "" === c ? (a.setAttribute(b, "auto"), c) : void 0;
    }};
  }));
  x.style || (m.attrHooks.style = {get:function(a) {
    return a.style.cssText || void 0;
  }, set:function(a, b) {
    return a.style.cssText = b + "";
  }});
  var lc = /^(?:input|select|textarea|button|object)$/i, mc = /^(?:a|area)$/i;
  m.fn.extend({prop:function(a, b) {
    return U(this, m.prop, a, b, 1 < arguments.length);
  }, removeProp:function(a) {
    return a = m.propFix[a] || a, this.each(function() {
      try {
        this[a] = void 0, delete this[a];
      } catch (b) {
      }
    });
  }});
  m.extend({propFix:{"for":"htmlFor", "class":"className"}, prop:function(a, b, c) {
    var d, e, f, g = a.nodeType;
    if (a && 3 !== g && 8 !== g && 2 !== g) {
      return f = 1 !== g || !m.isXMLDoc(a), f && (b = m.propFix[b] || b, e = m.propHooks[b]), void 0 !== c ? e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : a[b] = c : e && "get" in e && null !== (d = e.get(a, b)) ? d : a[b];
    }
  }, propHooks:{tabIndex:{get:function(a) {
    var b = m.find.attr(a, "tabindex");
    return b ? parseInt(b, 10) : lc.test(a.nodeName) || mc.test(a.nodeName) && a.href ? 0 : -1;
  }}}});
  x.hrefNormalized || m.each(["href", "src"], function(a, b) {
    m.propHooks[b] = {get:function(a) {
      return a.getAttribute(b, 4);
    }};
  });
  x.optSelected || (m.propHooks.selected = {get:function(a) {
    a = a.parentNode;
    return a && (a.selectedIndex, a.parentNode && a.parentNode.selectedIndex), null;
  }});
  m.each("tabIndex readOnly maxLength cellSpacing cellPadding rowSpan colSpan useMap frameBorder contentEditable".split(" "), function() {
    m.propFix[this.toLowerCase()] = this;
  });
  x.enctype || (m.propFix.enctype = "encoding");
  var Ta = /[\t\r\n\f]/g;
  m.fn.extend({addClass:function(a) {
    var b, c, d, e, f, g = 0, h = this.length;
    b = "string" == typeof a && a;
    if (m.isFunction(a)) {
      return this.each(function(b) {
        m(this).addClass(a.call(this, b, this.className));
      });
    }
    if (b) {
      for (b = (a || "").match(Z) || [];h > g;g++) {
        if (c = this[g], d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace(Ta, " ") : " ")) {
          for (f = 0;e = b[f++];) {
            0 > d.indexOf(" " + e + " ") && (d += e + " ");
          }
          d = m.trim(d);
          c.className !== d && (c.className = d);
        }
      }
    }
    return this;
  }, removeClass:function(a) {
    var b, c, d, e, f, g = 0, h = this.length;
    b = 0 === arguments.length || "string" == typeof a && a;
    if (m.isFunction(a)) {
      return this.each(function(b) {
        m(this).removeClass(a.call(this, b, this.className));
      });
    }
    if (b) {
      for (b = (a || "").match(Z) || [];h > g;g++) {
        if (c = this[g], d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace(Ta, " ") : "")) {
          for (f = 0;e = b[f++];) {
            for (;0 <= d.indexOf(" " + e + " ");) {
              d = d.replace(" " + e + " ", " ");
            }
          }
          d = a ? m.trim(d) : "";
          c.className !== d && (c.className = d);
        }
      }
    }
    return this;
  }, toggleClass:function(a, b) {
    var c = typeof a;
    return "boolean" == typeof b && "string" === c ? b ? this.addClass(a) : this.removeClass(a) : this.each(m.isFunction(a) ? function(c) {
      m(this).toggleClass(a.call(this, c, this.className, b), b);
    } : function() {
      if ("string" === c) {
        for (var b, d = 0, e = m(this), f = a.match(Z) || [];b = f[d++];) {
          e.hasClass(b) ? e.removeClass(b) : e.addClass(b);
        }
      } else {
        (c === W || "boolean" === c) && (this.className && m._data(this, "__className__", this.className), this.className = this.className || !1 === a ? "" : m._data(this, "__className__") || "");
      }
    });
  }, hasClass:function(a) {
    a = " " + a + " ";
    for (var b = 0, c = this.length;c > b;b++) {
      if (1 === this[b].nodeType && 0 <= (" " + this[b].className + " ").replace(Ta, " ").indexOf(a)) {
        return!0;
      }
    }
    return!1;
  }});
  m.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function(a, b) {
    m.fn[b] = function(a, c) {
      return 0 < arguments.length ? this.on(b, null, a, c) : this.trigger(b);
    };
  });
  m.fn.extend({hover:function(a, b) {
    return this.mouseenter(a).mouseleave(b || a);
  }, bind:function(a, b, c) {
    return this.on(a, null, b, c);
  }, unbind:function(a, b) {
    return this.off(a, null, b);
  }, delegate:function(a, b, c, d) {
    return this.on(b, a, c, d);
  }, undelegate:function(a, b, c) {
    return 1 === arguments.length ? this.off(a, "**") : this.off(b, a || "**", c);
  }});
  var Ua = m.now(), Va = /\?/, nc = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;
  m.parseJSON = function(b) {
    if (a.JSON && a.JSON.parse) {
      return a.JSON.parse(b + "");
    }
    var c, d = null, e = m.trim(b + "");
    return e && !m.trim(e.replace(nc, function(a, b, e, f) {
      return c && b && (d = 0), 0 === d ? a : (c = e || b, d += !f - !e, "");
    })) ? Function("return " + e)() : m.error("Invalid JSON: " + b);
  };
  m.parseXML = function(b) {
    var c, d;
    if (!b || "string" != typeof b) {
      return null;
    }
    try {
      a.DOMParser ? (d = new DOMParser, c = d.parseFromString(b, "text/xml")) : (c = new ActiveXObject("Microsoft.XMLDOM"), c.async = "false", c.loadXML(b));
    } catch (e) {
      c = void 0;
    }
    return c && c.documentElement && !c.getElementsByTagName("parsererror").length || m.error("Invalid XML: " + b), c;
  };
  var ja, S, oc = /#.*$/, yb = /([?&])_=[^&]*/, pc = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm, qc = /^(?:GET|HEAD)$/, rc = /^\/\//, zb = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/, Ab = {}, Ja = {}, Bb = "*/".concat("*");
  try {
    S = location.href;
  } catch (yc) {
    S = E.createElement("a"), S.href = "", S = S.href;
  }
  ja = zb.exec(S.toLowerCase()) || [];
  m.extend({active:0, lastModified:{}, etag:{}, ajaxSettings:{url:S, type:"GET", isLocal:/^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(ja[1]), global:!0, processData:!0, async:!0, contentType:"application/x-www-form-urlencoded; charset=UTF-8", accepts:{"*":Bb, text:"text/plain", html:"text/html", xml:"application/xml, text/xml", json:"application/json, text/javascript"}, contents:{xml:/xml/, html:/html/, json:/json/}, responseFields:{xml:"responseXML", text:"responseText", json:"responseJSON"}, 
  converters:{"* text":String, "text html":!0, "text json":m.parseJSON, "text xml":m.parseXML}, flatOptions:{url:!0, context:!0}}, ajaxSetup:function(a, b) {
    return b ? Ka(Ka(a, m.ajaxSettings), b) : Ka(m.ajaxSettings, a);
  }, ajaxPrefilter:$a(Ab), ajaxTransport:$a(Ja), ajax:function(a, b) {
    function c(a, b, d, e) {
      var p, F, w, y, L = b;
      if (2 !== z) {
        z = 2;
        h && clearTimeout(h);
        n = void 0;
        g = e || "";
        x.readyState = 0 < a ? 4 : 0;
        e = 200 <= a && 300 > a || 304 === a;
        if (d) {
          w = q;
          for (var A = x, K, C, P, B, G = w.contents, D = w.dataTypes;"*" === D[0];) {
            D.shift(), void 0 === C && (C = w.mimeType || A.getResponseHeader("Content-Type"));
          }
          if (C) {
            for (B in G) {
              if (G[B] && G[B].test(C)) {
                D.unshift(B);
                break;
              }
            }
          }
          if (D[0] in d) {
            P = D[0];
          } else {
            for (B in d) {
              if (!D[0] || w.converters[B + " " + D[0]]) {
                P = B;
                break;
              }
              K || (K = B);
            }
            P = P || K;
          }
          w = P ? (P !== D[0] && D.unshift(P), d[P]) : void 0;
        }
        var E;
        a: {
          d = q;
          K = w;
          C = x;
          P = e;
          var O, H, I;
          w = {};
          A = d.dataTypes.slice();
          if (A[1]) {
            for (O in d.converters) {
              w[O.toLowerCase()] = d.converters[O];
            }
          }
          for (B = A.shift();B;) {
            if (d.responseFields[B] && (C[d.responseFields[B]] = K), !I && P && d.dataFilter && (K = d.dataFilter(K, d.dataType)), I = B, B = A.shift()) {
              if ("*" === B) {
                B = I;
              } else {
                if ("*" !== I && I !== B) {
                  if (O = w[I + " " + B] || w["* " + B], !O) {
                    for (E in w) {
                      if (H = E.split(" "), H[1] === B && (O = w[I + " " + H[0]] || w["* " + H[0]])) {
                        !0 === O ? O = w[E] : !0 !== w[E] && (B = H[0], A.unshift(H[1]));
                        break;
                      }
                    }
                  }
                  if (!0 !== O) {
                    if (O && d["throws"]) {
                      K = O(K);
                    } else {
                      try {
                        K = O(K);
                      } catch (J) {
                        E = {state:"parsererror", error:O ? J : "No conversion from " + I + " to " + B};
                        break a;
                      }
                    }
                  }
                }
              }
            }
          }
          E = {state:"success", data:K};
        }
        w = E;
        e ? (q.ifModified && (y = x.getResponseHeader("Last-Modified"), y && (m.lastModified[f] = y), y = x.getResponseHeader("etag"), y && (m.etag[f] = y)), 204 === a || "HEAD" === q.type ? L = "nocontent" : 304 === a ? L = "notmodified" : (L = w.state, p = w.data, F = w.error, e = !F)) : (F = L, (a || !L) && (L = "error", 0 > a && (a = 0)));
        x.status = a;
        x.statusText = (b || L) + "";
        e ? t.resolveWith(r, [p, L, x]) : t.rejectWith(r, [x, L, F]);
        x.statusCode(v);
        v = void 0;
        l && s.trigger(e ? "ajaxSuccess" : "ajaxError", [x, q, e ? p : F]);
        u.fireWith(r, [x, L]);
        l && (s.trigger("ajaxComplete", [x, q]), --m.active || m.event.trigger("ajaxStop"));
      }
    }
    "object" == typeof a && (b = a, a = void 0);
    b = b || {};
    var d, e, f, g, h, l, n, p, q = m.ajaxSetup({}, b), r = q.context || q, s = q.context && (r.nodeType || r.jquery) ? m(r) : m.event, t = m.Deferred(), u = m.Callbacks("once memory"), v = q.statusCode || {}, w = {}, y = {}, z = 0, A = "canceled", x = {readyState:0, getResponseHeader:function(a) {
      var b;
      if (2 === z) {
        if (!p) {
          for (p = {};b = pc.exec(g);) {
            p[b[1].toLowerCase()] = b[2];
          }
        }
        b = p[a.toLowerCase()];
      }
      return null == b ? null : b;
    }, getAllResponseHeaders:function() {
      return 2 === z ? g : null;
    }, setRequestHeader:function(a, b) {
      var c = a.toLowerCase();
      return z || (a = y[c] = y[c] || a, w[a] = b), this;
    }, overrideMimeType:function(a) {
      return z || (q.mimeType = a), this;
    }, statusCode:function(a) {
      var b;
      if (a) {
        if (2 > z) {
          for (b in a) {
            v[b] = [v[b], a[b]];
          }
        } else {
          x.always(a[x.status]);
        }
      }
      return this;
    }, abort:function(a) {
      a = a || A;
      return n && n.abort(a), c(0, a), this;
    }};
    if (t.promise(x).complete = u.add, x.success = x.done, x.error = x.fail, q.url = ((a || q.url || S) + "").replace(oc, "").replace(rc, ja[1] + "//"), q.type = b.method || b.type || q.method || q.type, q.dataTypes = m.trim(q.dataType || "*").toLowerCase().match(Z) || [""], null == q.crossDomain && (d = zb.exec(q.url.toLowerCase()), q.crossDomain = !(!d || d[1] === ja[1] && d[2] === ja[2] && (d[3] || ("http:" === d[1] ? "80" : "443")) === (ja[3] || ("http:" === ja[1] ? "80" : "443")))), q.data && 
    q.processData && "string" != typeof q.data && (q.data = m.param(q.data, q.traditional)), ab(Ab, q, b, x), 2 === z) {
      return x;
    }
    (l = q.global) && 0 === m.active++ && m.event.trigger("ajaxStart");
    q.type = q.type.toUpperCase();
    q.hasContent = !qc.test(q.type);
    f = q.url;
    q.hasContent || (q.data && (f = q.url += (Va.test(f) ? "&" : "?") + q.data, delete q.data), !1 === q.cache && (q.url = yb.test(f) ? f.replace(yb, "$1_=" + Ua++) : f + (Va.test(f) ? "&" : "?") + "_=" + Ua++));
    q.ifModified && (m.lastModified[f] && x.setRequestHeader("If-Modified-Since", m.lastModified[f]), m.etag[f] && x.setRequestHeader("If-None-Match", m.etag[f]));
    (q.data && q.hasContent && !1 !== q.contentType || b.contentType) && x.setRequestHeader("Content-Type", q.contentType);
    x.setRequestHeader("Accept", q.dataTypes[0] && q.accepts[q.dataTypes[0]] ? q.accepts[q.dataTypes[0]] + ("*" !== q.dataTypes[0] ? ", " + Bb + "; q=0.01" : "") : q.accepts["*"]);
    for (e in q.headers) {
      x.setRequestHeader(e, q.headers[e]);
    }
    if (q.beforeSend && (!1 === q.beforeSend.call(r, x, q) || 2 === z)) {
      return x.abort();
    }
    A = "abort";
    for (e in{success:1, error:1, complete:1}) {
      x[e](q[e]);
    }
    if (n = ab(Ja, q, b, x)) {
      x.readyState = 1;
      l && s.trigger("ajaxSend", [x, q]);
      q.async && 0 < q.timeout && (h = setTimeout(function() {
        x.abort("timeout");
      }, q.timeout));
      try {
        z = 1, n.send(w, c);
      } catch (C) {
        if (!(2 > z)) {
          throw C;
        }
        c(-1, C);
      }
    } else {
      c(-1, "No Transport");
    }
    return x;
  }, getJSON:function(a, b, c) {
    return m.get(a, b, c, "json");
  }, getScript:function(a, b) {
    return m.get(a, void 0, b, "script");
  }});
  m.each(["get", "post"], function(a, b) {
    m[b] = function(a, c, d, e) {
      return m.isFunction(c) && (e = e || d, d = c, c = void 0), m.ajax({url:a, type:b, dataType:e, data:c, success:d});
    };
  });
  m.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function(a, b) {
    m.fn[b] = function(a) {
      return this.on(b, a);
    };
  });
  m._evalUrl = function(a) {
    return m.ajax({url:a, type:"GET", dataType:"script", async:!1, global:!1, "throws":!0});
  };
  m.fn.extend({wrapAll:function(a) {
    if (m.isFunction(a)) {
      return this.each(function(b) {
        m(this).wrapAll(a.call(this, b));
      });
    }
    if (this[0]) {
      var b = m(a, this[0].ownerDocument).eq(0).clone(!0);
      this[0].parentNode && b.insertBefore(this[0]);
      b.map(function() {
        for (var a = this;a.firstChild && 1 === a.firstChild.nodeType;) {
          a = a.firstChild;
        }
        return a;
      }).append(this);
    }
    return this;
  }, wrapInner:function(a) {
    return this.each(m.isFunction(a) ? function(b) {
      m(this).wrapInner(a.call(this, b));
    } : function() {
      var b = m(this), c = b.contents();
      c.length ? c.wrapAll(a) : b.append(a);
    });
  }, wrap:function(a) {
    var b = m.isFunction(a);
    return this.each(function(c) {
      m(this).wrapAll(b ? a.call(this, c) : a);
    });
  }, unwrap:function() {
    return this.parent().each(function() {
      m.nodeName(this, "body") || m(this).replaceWith(this.childNodes);
    }).end();
  }});
  m.expr.filters.hidden = function(a) {
    return 0 >= a.offsetWidth && 0 >= a.offsetHeight || !x.reliableHiddenOffsets() && "none" === (a.style && a.style.display || m.css(a, "display"));
  };
  m.expr.filters.visible = function(a) {
    return!m.expr.filters.hidden(a);
  };
  var sc = /%20/g, Mb = /\[\]$/, Cb = /\r?\n/g, tc = /^(?:submit|button|image|reset|file)$/i, uc = /^(?:input|select|textarea|keygen)/i;
  m.param = function(a, b) {
    var c, d = [], e = function(a, b) {
      b = m.isFunction(b) ? b() : null == b ? "" : b;
      d[d.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b);
    };
    if (void 0 === b && (b = m.ajaxSettings && m.ajaxSettings.traditional), m.isArray(a) || a.jquery && !m.isPlainObject(a)) {
      m.each(a, function() {
        e(this.name, this.value);
      });
    } else {
      for (c in a) {
        La(c, a[c], b, e);
      }
    }
    return d.join("&").replace(sc, "+");
  };
  m.fn.extend({serialize:function() {
    return m.param(this.serializeArray());
  }, serializeArray:function() {
    return this.map(function() {
      var a = m.prop(this, "elements");
      return a ? m.makeArray(a) : this;
    }).filter(function() {
      var a = this.type;
      return this.name && !m(this).is(":disabled") && uc.test(this.nodeName) && !tc.test(a) && (this.checked || !Ia.test(a));
    }).map(function(a, b) {
      var c = m(this).val();
      return null == c ? null : m.isArray(c) ? m.map(c, function(a) {
        return{name:b.name, value:a.replace(Cb, "\r\n")};
      }) : {name:b.name, value:c.replace(Cb, "\r\n")};
    }).get();
  }});
  m.ajaxSettings.xhr = void 0 !== a.ActiveXObject ? function() {
    var b;
    if (!(b = !this.isLocal && /^(get|post|head|put|delete|options)$/i.test(this.type) && fb())) {
      a: {
        try {
          b = new a.ActiveXObject("Microsoft.XMLHTTP");
          break a;
        } catch (c) {
        }
        b = void 0;
      }
    }
    return b;
  } : fb;
  var vc = 0, Ga = {}, Ha = m.ajaxSettings.xhr();
  a.ActiveXObject && m(a).on("unload", function() {
    for (var a in Ga) {
      Ga[a](void 0, !0);
    }
  });
  x.cors = !!Ha && "withCredentials" in Ha;
  (Ha = x.ajax = !!Ha) && m.ajaxTransport(function(a) {
    if (!a.crossDomain || x.cors) {
      var b;
      return{send:function(c, d) {
        var e, f = a.xhr(), g = ++vc;
        if (f.open(a.type, a.url, a.async, a.username, a.password), a.xhrFields) {
          for (e in a.xhrFields) {
            f[e] = a.xhrFields[e];
          }
        }
        a.mimeType && f.overrideMimeType && f.overrideMimeType(a.mimeType);
        a.crossDomain || c["X-Requested-With"] || (c["X-Requested-With"] = "XMLHttpRequest");
        for (e in c) {
          void 0 !== c[e] && f.setRequestHeader(e, c[e] + "");
        }
        f.send(a.hasContent && a.data || null);
        b = function(c, e) {
          var h, l, n;
          if (b && (e || 4 === f.readyState)) {
            if (delete Ga[g], b = void 0, f.onreadystatechange = m.noop, e) {
              4 !== f.readyState && f.abort();
            } else {
              n = {};
              h = f.status;
              "string" == typeof f.responseText && (n.text = f.responseText);
              try {
                l = f.statusText;
              } catch (p) {
                l = "";
              }
              h || !a.isLocal || a.crossDomain ? 1223 === h && (h = 204) : h = n.text ? 200 : 404;
            }
          }
          n && d(h, l, n, f.getAllResponseHeaders());
        };
        a.async ? 4 === f.readyState ? setTimeout(b) : f.onreadystatechange = Ga[g] = b : b();
      }, abort:function() {
        b && b(void 0, !0);
      }};
    }
  });
  m.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"}, contents:{script:/(?:java|ecma)script/}, converters:{"text script":function(a) {
    return m.globalEval(a), a;
  }}});
  m.ajaxPrefilter("script", function(a) {
    void 0 === a.cache && (a.cache = !1);
    a.crossDomain && (a.type = "GET", a.global = !1);
  });
  m.ajaxTransport("script", function(a) {
    if (a.crossDomain) {
      var b, c = E.head || m("head")[0] || E.documentElement;
      return{send:function(d, e) {
        b = E.createElement("script");
        b.async = !0;
        a.scriptCharset && (b.charset = a.scriptCharset);
        b.src = a.url;
        b.onload = b.onreadystatechange = function(a, c) {
          (c || !b.readyState || /loaded|complete/.test(b.readyState)) && (b.onload = b.onreadystatechange = null, b.parentNode && b.parentNode.removeChild(b), b = null, c || e(200, "success"));
        };
        c.insertBefore(b, c.firstChild);
      }, abort:function() {
        b && b.onload(void 0, !0);
      }};
    }
  });
  var Db = [], Wa = /(=)\?(?=&|$)|\?\?/;
  m.ajaxSetup({jsonp:"callback", jsonpCallback:function() {
    var a = Db.pop() || m.expando + "_" + Ua++;
    return this[a] = !0, a;
  }});
  m.ajaxPrefilter("json jsonp", function(b, c, d) {
    var e, f, g, h = !1 !== b.jsonp && (Wa.test(b.url) ? "url" : "string" == typeof b.data && !(b.contentType || "").indexOf("application/x-www-form-urlencoded") && Wa.test(b.data) && "data");
    return h || "jsonp" === b.dataTypes[0] ? (e = b.jsonpCallback = m.isFunction(b.jsonpCallback) ? b.jsonpCallback() : b.jsonpCallback, h ? b[h] = b[h].replace(Wa, "$1" + e) : !1 !== b.jsonp && (b.url += (Va.test(b.url) ? "&" : "?") + b.jsonp + "=" + e), b.converters["script json"] = function() {
      return g || m.error(e + " was not called"), g[0];
    }, b.dataTypes[0] = "json", f = a[e], a[e] = function() {
      g = arguments;
    }, d.always(function() {
      a[e] = f;
      b[e] && (b.jsonpCallback = c.jsonpCallback, Db.push(e));
      g && m.isFunction(f) && f(g[0]);
      g = f = void 0;
    }), "script") : void 0;
  });
  m.parseHTML = function(a, b, c) {
    if (!a || "string" != typeof a) {
      return null;
    }
    "boolean" == typeof b && (c = b, b = !1);
    b = b || E;
    var d = kb.exec(a);
    c = !c && [];
    return d ? [b.createElement(d[1])] : (d = m.buildFragment([a], b, c), c && c.length && m(c).remove(), m.merge([], d.childNodes));
  };
  var Eb = m.fn.load;
  m.fn.load = function(a, b, c) {
    if ("string" != typeof a && Eb) {
      return Eb.apply(this, arguments);
    }
    var d, e, f, g = this, h = a.indexOf(" ");
    return 0 <= h && (d = a.slice(h, a.length), a = a.slice(0, h)), m.isFunction(b) ? (c = b, b = void 0) : b && "object" == typeof b && (f = "POST"), 0 < g.length && m.ajax({url:a, type:f, dataType:"html", data:b}).done(function(a) {
      e = arguments;
      g.html(d ? m("<div>").append(m.parseHTML(a)).find(d) : a);
    }).complete(c && function(a, b) {
      g.each(c, e || [a.responseText, b, a]);
    }), this;
  };
  m.expr.filters.animated = function(a) {
    return m.grep(m.timers, function(b) {
      return a === b.elem;
    }).length;
  };
  var Fb = a.document.documentElement;
  m.offset = {setOffset:function(a, b, c) {
    var d, e, f, g, h, l, n = m.css(a, "position"), p = m(a), q = {};
    "static" === n && (a.style.position = "relative");
    h = p.offset();
    f = m.css(a, "top");
    l = m.css(a, "left");
    ("absolute" === n || "fixed" === n) && -1 < m.inArray("auto", [f, l]) ? (d = p.position(), g = d.top, e = d.left) : (g = parseFloat(f) || 0, e = parseFloat(l) || 0);
    m.isFunction(b) && (b = b.call(a, c, h));
    null != b.top && (q.top = b.top - h.top + g);
    null != b.left && (q.left = b.left - h.left + e);
    "using" in b ? b.using.call(a, q) : p.css(q);
  }};
  m.fn.extend({offset:function(a) {
    if (arguments.length) {
      return void 0 === a ? this : this.each(function(b) {
        m.offset.setOffset(this, a, b);
      });
    }
    var b, c, d = {top:0, left:0}, e = this[0], f = e && e.ownerDocument;
    if (f) {
      return b = f.documentElement, m.contains(b, e) ? (typeof e.getBoundingClientRect !== W && (d = e.getBoundingClientRect()), c = gb(f), {top:d.top + (c.pageYOffset || b.scrollTop) - (b.clientTop || 0), left:d.left + (c.pageXOffset || b.scrollLeft) - (b.clientLeft || 0)}) : d;
    }
  }, position:function() {
    if (this[0]) {
      var a, b, c = {top:0, left:0}, d = this[0];
      return "fixed" === m.css(d, "position") ? b = d.getBoundingClientRect() : (a = this.offsetParent(), b = this.offset(), m.nodeName(a[0], "html") || (c = a.offset()), c.top += m.css(a[0], "borderTopWidth", !0), c.left += m.css(a[0], "borderLeftWidth", !0)), {top:b.top - c.top - m.css(d, "marginTop", !0), left:b.left - c.left - m.css(d, "marginLeft", !0)};
    }
  }, offsetParent:function() {
    return this.map(function() {
      for (var a = this.offsetParent || Fb;a && !m.nodeName(a, "html") && "static" === m.css(a, "position");) {
        a = a.offsetParent;
      }
      return a || Fb;
    });
  }});
  m.each({scrollLeft:"pageXOffset", scrollTop:"pageYOffset"}, function(a, b) {
    var c = /Y/.test(b);
    m.fn[a] = function(d) {
      return U(this, function(a, d, e) {
        var f = gb(a);
        return void 0 === e ? f ? b in f ? f[b] : f.document.documentElement[d] : a[d] : void(f ? f.scrollTo(c ? m(f).scrollLeft() : e, c ? e : m(f).scrollTop()) : a[d] = e);
      }, a, d, arguments.length, null);
    };
  });
  m.each(["top", "left"], function(a, b) {
    m.cssHooks[b] = Q(x.pixelPosition, function(a, c) {
      return c ? (c = ea(a, b), wa.test(c) ? m(a).position()[b] + "px" : c) : void 0;
    });
  });
  m.each({Height:"height", Width:"width"}, function(a, b) {
    m.each({padding:"inner" + a, content:b, "":"outer" + a}, function(c, d) {
      m.fn[d] = function(d, e) {
        var f = arguments.length && (c || "boolean" != typeof d), g = c || (!0 === d || !0 === e ? "margin" : "border");
        return U(this, function(b, c, d) {
          var e;
          return m.isWindow(b) ? b.document.documentElement["client" + a] : 9 === b.nodeType ? (e = b.documentElement, Math.max(b.body["scroll" + a], e["scroll" + a], b.body["offset" + a], e["offset" + a], e["client" + a])) : void 0 === d ? m.css(b, c, g) : m.style(b, c, d, g);
        }, b, f ? d : void 0, f, null);
      };
    });
  });
  m.fn.size = function() {
    return this.length;
  };
  m.fn.andSelf = m.fn.addBack;
  "function" == typeof define && define.amd && define("jquery", [], function() {
    return m;
  });
  var wc = a.jQuery, xc = a.$;
  return m.noConflict = function(b) {
    return a.$ === m && (a.$ = xc), b && a.jQuery === m && (a.jQuery = wc), m;
  }, typeof b === W && (a.jQuery = a.$ = m), m;
});
(function() {
  var a;
  a = function(a) {
    var c, d;
    return c = !1, a(function() {
      var e;
      return e = (document.body || document.documentElement).style, c = void 0 !== e.animation || void 0 !== e.WebkitAnimation || void 0 !== e.MozAnimation || void 0 !== e.MsAnimation || void 0 !== e.OAnimation, a(window).bind("keyup.vex", function(a) {
        return 27 === a.keyCode ? d.closeByEscape() : void 0;
      });
    }), d = {globalID:1, animationEndEvent:"animationend webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend", baseClassNames:{vex:"vex", content:"vex-content", overlay:"vex-overlay", close:"vex-close", closing:"vex-closing", open:"vex-open"}, defaultOptions:{content:"", showCloseButton:!0, escapeButtonCloses:!0, overlayClosesOnClick:!0, appendLocation:"body", className:"", css:{}, overlayClassName:"", overlayCSS:{}, contentClassName:"", contentCSS:{}, closeClassName:"", closeCSS:{}}, 
    open:function(c) {
      return c = a.extend({}, d.defaultOptions, c), c.id = d.globalID, d.globalID += 1, c.$vex = a("<div>").addClass(d.baseClassNames.vex).addClass(c.className).css(c.css).data({vex:c}), c.$vexOverlay = a("<div>").addClass(d.baseClassNames.overlay).addClass(c.overlayClassName).css(c.overlayCSS).data({vex:c}), c.overlayClosesOnClick && c.$vexOverlay.bind("click.vex", function(c) {
        return c.target === this ? d.close(a(this).data().vex.id) : void 0;
      }), c.$vex.append(c.$vexOverlay), c.$vexContent = a("<div>").addClass(d.baseClassNames.content).addClass(c.contentClassName).css(c.contentCSS).append(c.content).data({vex:c}), c.$vex.append(c.$vexContent), c.showCloseButton && (c.$closeButton = a("<div>").addClass(d.baseClassNames.close).addClass(c.closeClassName).css(c.closeCSS).data({vex:c}).bind("click.vex", function() {
        return d.close(a(this).data().vex.id);
      }), c.$vexContent.append(c.$closeButton)), a(c.appendLocation).append(c.$vex), d.setupBodyClassName(c.$vex), c.afterOpen && c.afterOpen(c.$vexContent, c), setTimeout(function() {
        return c.$vexContent.trigger("vexOpen", c);
      }, 0), c.$vexContent;
    }, getAllVexes:function() {
      return a("." + d.baseClassNames.vex + ':not(".' + d.baseClassNames.closing + '") .' + d.baseClassNames.content);
    }, getVexByID:function(c) {
      return d.getAllVexes().filter(function() {
        return a(this).data().vex.id === c;
      });
    }, close:function(a) {
      var b;
      if (!a) {
        if (b = d.getAllVexes().last(), !b.length) {
          return!1;
        }
        a = b.data().vex.id;
      }
      return d.closeByID(a);
    }, closeAll:function() {
      var c;
      return c = d.getAllVexes().map(function() {
        return a(this).data().vex.id;
      }).toArray(), null != c && c.length ? (a.each(c.reverse(), function(a, b) {
        return d.closeByID(b);
      }), !0) : !1;
    }, closeByID:function(e) {
      var f, g, h, l, n;
      return g = d.getVexByID(e), g.length ? (f = g.data().vex.$vex, n = a.extend({}, g.data().vex), h = function() {
        return n.beforeClose ? n.beforeClose(g, n) : void 0;
      }, l = function() {
        return g.trigger("vexClose", n), f.remove(), n.afterClose ? n.afterClose(g, n) : void 0;
      }, c ? (h(), f.unbind(d.animationEndEvent).bind(d.animationEndEvent, function() {
        return l();
      }).addClass(d.baseClassNames.closing)) : (h(), l()), !0) : void 0;
    }, closeByEscape:function() {
      var c, f, g;
      return g = d.getAllVexes().map(function() {
        return a(this).data().vex.id;
      }).toArray(), null != g && g.length ? (f = Math.max.apply(Math, g), c = d.getVexByID(f), !0 !== c.data().vex.escapeButtonCloses ? !1 : d.closeByID(f)) : !1;
    }, setupBodyClassName:function(c) {
      return c.bind("vexOpen.vex", function() {
        return a("body").addClass(d.baseClassNames.open);
      }).bind("vexClose.vex", function() {
        return d.getAllVexes().length ? void 0 : a("body").removeClass(d.baseClassNames.open);
      });
    }, hideLoading:function() {
      return a(".vex-loading-spinner").remove();
    }, showLoading:function() {
      return d.hideLoading(), a("body").append('<div class="vex-loading-spinner ' + d.defaultOptions.className + '"></div>');
    }};
  };
  "function" == typeof define && define.amd ? define(["jquery"], a) : "object" == typeof exports ? module.exports = a(require("jquery")) : window.vex = a(jQuery);
}).call(this);
(function() {
  var a;
  a = function(a, c) {
    var d, e;
    return null == c ? a.error("Vex is required to use vex.dialog") : (d = function(c) {
      var d;
      return d = {}, a.each(c.serializeArray(), function() {
        return d[this.name] ? (d[this.name].push || (d[this.name] = [d[this.name]]), d[this.name].push(this.value || "")) : d[this.name] = this.value || "";
      }), d;
    }, e = {}, e.buttons = {YES:{text:"OK", type:"submit", className:"vex-dialog-button-primary"}, NO:{text:"Cancel", type:"button", className:"vex-dialog-button-secondary", click:function(a) {
      return a.data().vex.value = !1, c.close(a.data().vex.id);
    }}}, e.defaultOptions = {callback:function() {
    }, afterOpen:function() {
    }, message:"Message", input:'<input name="vex" type="hidden" value="_vex-empty-value" />', value:!1, buttons:[e.buttons.YES, e.buttons.NO], showCloseButton:!1, onSubmit:function(f) {
      var g, h;
      return g = a(this), h = g.parent(), f.preventDefault(), f.stopPropagation(), h.data().vex.value = e.getFormValueOnSubmit(d(g)), c.close(h.data().vex.id);
    }, focusFirstInput:!0}, e.defaultAlertOptions = {message:"Alert", buttons:[e.buttons.YES]}, e.defaultConfirmOptions = {message:"Confirm"}, e.open = function(d) {
      var g;
      return d = a.extend({}, c.defaultOptions, e.defaultOptions, d), d.content = e.buildDialogForm(d), d.beforeClose = function(a) {
        return d.callback(a.data().vex.value);
      }, g = c.open(d), d.focusFirstInput && g.find('input[type="submit"], textarea, input[type="date"], input[type="datetime"], input[type="datetime-local"], input[type="email"], input[type="month"], input[type="number"], input[type="password"], input[type="search"], input[type="tel"], input[type="text"], input[type="time"], input[type="url"], input[type="week"]').first().focus(), g;
    }, e.alert = function(c) {
      return "string" == typeof c && (c = {message:c}), c = a.extend({}, e.defaultAlertOptions, c), e.open(c);
    }, e.confirm = function(c) {
      return "string" == typeof c ? a.error("dialog.confirm(options) requires options.callback.") : (c = a.extend({}, e.defaultConfirmOptions, c), e.open(c));
    }, e.prompt = function(c) {
      var d;
      return "string" == typeof c ? a.error("dialog.prompt(options) requires options.callback.") : (d = {message:'<label for="vex">' + (c.label || "Prompt:") + "</label>", input:'<input name="vex" type="text" class="vex-dialog-prompt-input" placeholder="' + (c.placeholder || "") + '"  value="' + (c.value || "") + '" />'}, c = a.extend({}, d, c), e.open(c));
    }, e.buildDialogForm = function(c) {
      var d, h, l;
      return d = a('<form class="vex-dialog-form" />'), l = a('<div class="vex-dialog-message" />'), h = a('<div class="vex-dialog-input" />'), d.append(l.append(c.message)).append(h.append(c.input)).append(e.buttonsToDOM(c.buttons)).bind("submit.vex", c.onSubmit), d;
    }, e.getFormValueOnSubmit = function(a) {
      return a.vex || "" === a.vex ? "_vex-empty-value" === a.vex ? !0 : a.vex : a;
    }, e.buttonsToDOM = function(d) {
      var e;
      return e = a('<div class="vex-dialog-buttons" />'), a.each(d, function(h, l) {
        return e.append(a('<input type="' + l.type + '" />').val(l.text).addClass(l.className + " vex-dialog-button " + (0 === h ? "vex-first " : "") + (h === d.length - 1 ? "vex-last " : "")).bind("click.vex", function(d) {
          return l.click ? l.click(a(this).parents("." + c.baseClassNames.content), d) : void 0;
        }));
      }), e;
    }, e);
  };
  "function" == typeof define && define.amd ? define(["jquery", "vex"], a) : "object" == typeof exports ? module.exports = a(require("jquery"), require("vex")) : window.vex.dialog = a(window.jQuery, window.vex);
}).call(this);

