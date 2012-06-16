(function(){
  var __join = [].join;
  this.include = function(){
    return this.client({
      '/player.js': function(){
        var doPlay, scc, b1, b2, b3, b4, b5, colorIndex, getBarColor, getDrawColor, GraphOnClick, UpdateGraphRangeProposal, GraphSetCells, DoGraph, GraphChanged, MinMaxChanged, GraphSave, GraphLoad, GraphVerticalBar, GraphHorizontalBar, MakePieChart, MakeLineChart, MakeScatterChart, __this = this;
        doPlay = function(){
          var emit, __ref;
          window.SocialCalc == null && (window.SocialCalc = {});
          SocialCalc._username = Math.random().toString();
          SocialCalc.isConnected = true;
          SocialCalc.hadSnapshot = false;
          SocialCalc._auth = (__ref = window.location.search) != null ? __ref.replace(/\??auth=/, '') : void 8;
          SocialCalc._view = SocialCalc._auth === '0';
          SocialCalc._room == null && (SocialCalc._room = window.location.hash.replace('#', ''));
          SocialCalc._room = SocialCalc._room.replace(/^_+/, '').replace(/\?.*/, '');
          if (!SocialCalc._room) {
            window.location = '/_start';
            return;
          }
          try {
            window.history.pushState({}, '', "/" + SocialCalc._room + (function(){
              switch (false) {
              case !SocialCalc._view:
                return '/view';
              case !SocialCalc._auth:
                return '/edit';
              default:
                return '';
              }
            }()));
          } catch (__e) {}
          __this.connect();
          emit = function(data){
            return __this.emit({
              data: data
            });
          };
          SocialCalc.Callbacks.broadcast = function(type, data){
            data == null && (data = {});
            if (!SocialCalc.isConnected) {
              return;
            }
            data.user = SocialCalc._username;
            data.room = SocialCalc._room;
            data.type = type;
            if (SocialCalc._auth) {
              data.auth = SocialCalc._auth;
            }
            return emit(data);
          };
          SocialCalc.isConnected = true;
          SocialCalc.Callbacks.broadcast('ask.log');
          SocialCalc.RecalcInfo.LoadSheet = function(ref){
            ref = ref.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
            return emit({
              type: 'ask.recalc',
              user: SocialCalc._username,
              room: ref
            });
          };
          return __this.on({
            data: function(){
              var ss, editor, user, ecell, peerClass, find, cr, cell, origCR, origCell, parts, line, cmdstr, refreshCmd, __ref;
              if (!((typeof SocialCalc != 'undefined' && SocialCalc !== null) && SocialCalc.isConnected)) {
                return;
              }
              if (this.data.user === SocialCalc._username) {
                return;
              }
              if (this.data.to && this.data.to !== SocialCalc._username) {
                return;
              }
              if (this.data.room && this.data.room !== SocialCalc._room && this.data.type !== "recalc") {
                return;
              }
              ss = window.spreadsheet;
              editor = ss.editor;
              switch (this.data.type) {
              case 'chat':
                if (typeof window.addmsg === 'function') {
                  window.addmsg(this.data.msg);
                }
                break;
              case 'ecells':
                for (user in __ref = this.data.ecells) {
                  ecell = __ref[user];
                  if (user === SocialCalc._username) {
                    continue;
                  }
                  peerClass = " " + user + " defaultPeer";
                  find = new RegExp(peerClass, 'g');
                  cr = SocialCalc.coordToCr(ecell);
                  cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
                  if (cell.element.className.search(find) === -1) {
                    cell.element.className += peerClass;
                  }
                }
                break;
              case 'ecell':
                peerClass = " " + this.data.user + " defaultPeer";
                find = new RegExp(peerClass, 'g');
                if (this.data.original) {
                  origCR = SocialCalc.coordToCr(this.data.original);
                  origCell = SocialCalc.GetEditorCellElement(editor, origCR.row, origCR.col);
                  (__ref = origCell.element).className = __ref.className.replace(find, '');
                  if (this.data.original === editor.ecell.coord || this.data.ecell === editor.ecell.coord) {
                    SocialCalc.Callbacks.broadcast('ecell', {
                      to: this.data.user,
                      ecell: editor.ecell.coord
                    });
                  }
                }
                cr = SocialCalc.coordToCr(this.data.ecell);
                cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
                if (cell.element.className.search(find) === -1) {
                  cell.element.className += peerClass;
                }
                break;
              case 'ask.ecell':
                SocialCalc.Callbacks.broadcast('ecell', {
                  to: this.data.user,
                  ecell: editor.ecell.coord
                });
                break;
              case 'log':
                if (SocialCalc.hadSnapshot) {
                  break;
                }
                SocialCalc.hadSnapshot = true;
                if (this.data.snapshot) {
                  parts = ss.DecodeSpreadsheetSave(this.data.snapshot);
                }
                if (parts != null && parts.sheet) {
                  ss.sheet.ResetSheet();
                  ss.ParseSheetSave(this.data.snapshot.substring(parts.sheet.start, parts.sheet.end));
                }
                if (typeof window.addmsg === 'function') {
                  window.addmsg(__join.call(this.data.chat, '\n'), true);
                }
                cmdstr = (function(){
                  var __i, __ref, __len, __results = [];
                  for (__i = 0, __len = (__ref = this.data.log).length; __i < __len; ++__i) {
                    line = __ref[__i];
                    if (!/^re(calc|display)$/.test(line)) {
                      __results.push(line);
                    }
                  }
                  return __results;
                }.call(this)).join('\n');
                if (cmdstr.length) {
                  refreshCmd = 'recalc';
                  ss.context.sheetobj.ScheduleSheetCommands(cmdstr + "\n" + refreshCmd + "\n", false, true);
                } else {
                  ss.context.sheetobj.ScheduleSheetCommands("recalc\n", false, true);
                }
                break;
              case 'recalc':
                if (this.data.force) {
                  SocialCalc.Formula.SheetCache.sheets = {};
                  if (ss != null) {
                    ss.sheet.recalconce = true;
                  }
                }
                if (this.data.snapshot) {
                  parts = ss.DecodeSpreadsheetSave(this.data.snapshot);
                }
                if (parts != null && parts.sheet) {
                  SocialCalc.RecalcLoadedSheet(this.data.room, this.data.snapshot.substring(parts.sheet.start, parts.sheet.end), true);
                  ss.context.sheetobj.ScheduleSheetCommands("recalc\n", false, true);
                } else {
                  SocialCalc.RecalcLoadedSheet(this.data.room, '', true);
                }
                break;
              case 'execute':
                ss.context.sheetobj.ScheduleSheetCommands(this.data.cmdstr, this.data.saveundo, true);
                if (ss.currentTab === ((__ref = ss.tabnums) != null ? __ref.graph : void 8)) {
                  setTimeout(function(){
                    return window.DoGraph(false, false);
                  }, 100);
                }
              }
            }
          });
        };
        window.doresize = function(){
          var __ref;
          if ((__ref = window.spreadsheet) != null) {
            __ref.DoOnResize();
          }
        };
        scc = SocialCalc.Constants;
        b1 = window.location.search ? 'A' : '4';
        b2 = 'C';
        b3 = '8';
        b4 = '9';
        b5 = '8';
        scc.SCToolbarbackground = 'background-color:#4040' + b1 + '0;';
        scc.SCTabbackground = 'background-color:#CC' + b2 + ';';
        scc.SCTabselectedCSS = 'font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#4040' + b1 + '0;cursor:default;border-right:1px solid #CC' + b2 + ';';
        scc.SCTabplainCSS = 'font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#8080' + b3 + '0;cursor:default;border-right:1px solid #CC' + b2 + ';';
        scc.SCToolbartext = 'font-size:x-small;font-weight:bold;color:#FFF;padding-bottom:4px;';
        scc.ISCButtonBorderNormal = '#4040' + b1 + '0';
        scc.ISCButtonBorderHover = '#99' + b4;
        scc.ISCButtonBorderDown = '#FFF';
        scc.ISCButtonDownBackground = '#88' + b5;
        scc.defaultImagePrefix = '/images/sc-';
        SocialCalc.Popup.LocalizeString = SocialCalc.LocalizeString;
        $(function(){
          var ss, savestr, __ref;
          window.spreadsheet = ss = SocialCalc._view
            ? new SocialCalc.SpreadsheetViewer()
            : new SocialCalc.SpreadsheetControl();
          document.getElementById('msgtext').value = '';
          ss.ExportCallback = function(s){
            return alert(SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "csv"));
          };
          if (ss.tabs) {
            ss.tabnums.graph = ss.tabs.length;
          }
          if ((__ref = ss.tabs) != null) {
            __ref.push({
              name: 'graph',
              text: SocialCalc.Constants.s_loc_graph,
              html: "<div id=\"%id.graphtools\" style=\"display:none;\"><div style=\"%tbt.\"><table cellspacing=\"0\" cellpadding=\"0\"><tr><td style=\"vertical-align:middle;padding-right:32px;padding-left:16px;\"><div style=\"%tbt.\">Cells to Graph</div><div id=\"%id.graphrange\" style=\"font-weight:bold;\">Not Set</div></td><td style=\"vertical-align:top;padding-right:32px;\"><div style=\"%tbt.\">Set Cells To Graph</div><select id=\"%id.graphlist\" size=\"1\" onfocus=\"%s.CmdGotFocus(this);\"><option selected>[select range]</option></select></td><td style=\"vertical-align:middle;padding-right:4px;\"><div style=\"%tbt.\">Graph Type</div><select id=\"%id.graphtype\" size=\"1\" onchange=\"window.GraphChanged(this);\" onfocus=\"%s.CmdGotFocus(this);\"></select><input type=\"button\" value=\"OK\" onclick=\"window.GraphSetCells();\" style=\"font-size:x-small;\"></div></td><td style=\"vertical-align:middle;padding-right:16px;\"><div style=\"%tbt.\">&nbsp;</div><input id=\"%id.graphhelp\" type=\"button\" onclick=\"DoGraph(true);\" value=\"Help\" style=\"font-size:x-small;\"></div></td><td style=\"vertical-align:middle;padding-right:16px;\">Min X <input id=\"%id.graphMinX\" onchange=\"window.MinMaxChanged(this,0);\" onfocus=\"%s.CmdGotFocus(this);\" size=5/>Max X <input id=\"%id.graphMaxX\" onchange=\"window.MinMaxChanged(this,1);\" onfocus=\"%s.CmdGotFocus(this);\" size=5/><br/>Min Y <input id=\"%id.graphMinY\" onchange=\"window.MinMaxChanged(this,2);\" onfocus=\"%s.CmdGotFocus(this);\" size=5/>Max Y <input id=\"%id.graphMaxY\" onchange=\"window.MinMaxChanged(this,3);\" onfocus=\"%s.CmdGotFocus(this);\" size=5/></div></td></tr></table></div></div>",
              view: 'graph',
              onclick: GraphOnClick,
              onclickFocus: true
            });
          }
          if ((__ref = ss.views) != null) {
            __ref.graph = {
              name: 'graph',
              divStyle: "overflow:auto;",
              values: {},
              html: '<div style="padding:6px;">Graph View</div>'
            };
          }
          if ((__ref = ss.editor) != null) {
            __ref.SettingsCallbacks.graph = {
              save: window.GraphSave,
              load: window.GraphLoad
            };
          }
          savestr = document.getElementById('savestr');
          if (typeof ss.InitializeSpreadsheetViewer === 'function') {
            ss.InitializeSpreadsheetViewer('tableeditor', 0, 0, 0);
          }
          if (typeof ss.InitializeSpreadsheetControl === 'function') {
            ss.InitializeSpreadsheetControl('tableeditor', 0, 0, 0);
          }
          if (typeof ss.ExecuteCommand === 'function') {
            ss.ExecuteCommand('redisplay', '');
          }
          if (typeof ss.ExecuteCommand === 'function') {
            ss.ExecuteCommand('set sheet defaulttextvalueformat text-wiki');
          }
          $(document).on('mouseover', '#te_fullgrid tr:nth-child(2) td:first', function(){
            return $(this).attr({
              title: 'Export to HTML'
            });
          });
          return $(document).on('click', '#te_fullgrid tr:nth-child(2) td:first', function(){
            return window.open("/_/" + SocialCalc._room + "/html");
          });
        });
        SocialCalc.Callbacks.expand_wiki = function(val){
          return "<div class=\"wiki\">" + new Document.Parser.Wikitext().parse(val, new Document.Emitter.HTML()) + "</div>";
        };
        SocialCalc.Constants.s_loc_plain = "Plain";
        SocialCalc.Constants.s_loc_graph = "Graph";
        SocialCalc.Constants.s_loc_cells_to_graph = "Cells to Graph";
        SocialCalc.Constants.s_loc_set_cells_to_graph = "Set Cells To Graph";
        SocialCalc.Constants.s_loc_graph_type = "Graph Type";
        SocialCalc.Constants.s_loc_help = "Help";
        SocialCalc.Constants.s_loc_horizontal_bar = "Horizontal Bar";
        SocialCalc.Constants.s_loc_vertical_bar = "Vertical Bar";
        SocialCalc.Constants.s_loc_pie_chart = "Pie Chart";
        SocialCalc.Constants.s_loc_line_chart = "Line Chart";
        SocialCalc.Constants.s_loc_scatter_chart = "Plot Points";
        SocialCalc.Constants.s_loc_not_set = "Not Set";
        SocialCalc.Constants.s_loc_unknown_range_name = "Unknown range name";
        SocialCalc.Constants.s_loc_hide_help = "Hide Help";
        SocialCalc.Constants.s_loc_x = "X ";
        SocialCalc.Constants.s_loc_y = "Y ";
        SocialCalc.Constants.s_loc_max = "Max ";
        SocialCalc.Constants.s_loc_min = "Min ";
        SocialCalc.Constants.s_loc_ok = " OK ";
        SocialCalc.Constants.s_GraphRangeNotSelected = "Select a range of cells with numeric values to graph and use the OK button above to set the range as the graph range.";
        colorIndex = 0;
        getBarColor = function(){
          var colors;
          colors = ['ff0', '0ff', 'f0f', '00f', 'f00', '0f0', '888', '880', '088', '808', '008', '800', '080'];
          return colors[colorIndex++] || colors[Math.round(Math.random() * 14)] + colors[Math.round(Math.random() * 14)] + colors[Math.round(Math.random() * 14)] + colors[Math.round(Math.random() * 14)] + colors[Math.round(Math.random() * 14)] + colors[Math.round(Math.random() * 14)];
        };
        getDrawColor = function(){
          return "#" + getBarColor();
        };
        GraphOnClick = function(s, t){
          var colorIndex, SCLoc, namelist, nl, name, i;
          colorIndex = 0;
          SCLoc = SocialCalc.LocalizeString;
          namelist = [];
          nl = document.getElementById(s.idPrefix + 'graphlist');
          s.editor.RangeChangeCallback.graph = UpdateGraphRangeProposal;
          for (name in s.sheet.names) {
            namelist.push(name);
          }
          namelist.sort();
          nl.length = 0;
          nl.options[0] = new Option(SCLoc('[select range]'));
          i = 0;
          while (i < namelist.length) {
            name = namelist[i];
            nl.options[i + 1] = new Option(name, name);
            if (name === s.graphrange) {
              nl.options[i + 1].selected = true;
            }
            i++;
          }
          if (s.graphrange === '') {
            nl.options[0].selected = true;
          }
          UpdateGraphRangeProposal(s.editor);
          nl = document.getElementById(s.idPrefix + 'graphtype');
          nl.length = 0;
          i = 0;
          while (i < SocialCalc.GraphTypesInfo.displayorder.length) {
            name = SocialCalc.GraphTypesInfo.displayorder[i];
            nl.options[i] = new Option(SCLoc(SocialCalc.GraphTypesInfo[name].display), name);
            if (name === s.graphtype) {
              nl.options[i].selected = true;
            }
            i++;
          }
          if (!s.graphtype) {
            nl.options[0].selected = true;
            s.graphtype = nl.options[0].value;
          }
          DoGraph(false, true);
        };
        UpdateGraphRangeProposal = function(editor){
          var ele;
          ele = document.getElementById(SocialCalc.GetSpreadsheetControlObject().idPrefix + "graphlist");
          if (editor.range.hasrange) {
            return ele.options[0].text = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
          } else {
            return ele.options[0].text = SocialCalc.LocalizeString("[select range]");
          }
        };
        window.GraphSetCells = GraphSetCells = function(){
          var spreadsheet, editor, lele, ele;
          spreadsheet = SocialCalc.GetSpreadsheetControlObject();
          editor = spreadsheet.editor;
          lele = document.getElementById(spreadsheet.idPrefix + "graphlist");
          if (lele.selectedIndex === 0) {
            if (editor.range.hasrange) {
              spreadsheet.graphrange = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
            } else {
              spreadsheet.graphrange = editor.ecell.coord + ":" + editor.ecell.coord;
            }
          } else {
            spreadsheet.graphrange = lele.options[lele.selectedIndex].value;
          }
          ele = document.getElementById(spreadsheet.idPrefix + "graphrange");
          ele.innerHTML = spreadsheet.graphrange;
          DoGraph(false, false);
        };
        window.DoGraph = DoGraph = function(helpflag, isResize){
          var colorIndex, spreadsheet, editor, gview, ginfo, gfunc, grange, nrange, rparts, prange, range;
          colorIndex = 0;
          spreadsheet = SocialCalc.GetSpreadsheetControlObject();
          editor = spreadsheet.editor;
          gview = spreadsheet.views.graph.element;
          ginfo = SocialCalc.GraphTypesInfo[spreadsheet.graphtype];
          gfunc = ginfo.func;
          if (!spreadsheet.graphrange) {
            if (gfunc && helpflag) {
              gfunc(spreadsheet, null, gview, spreadsheet.graphtype, helpflag, isResize);
            } else {
              gview.innerHTML = "<div style=\"padding:30px;font-weight:bold;\">" + SocialCalc.Constants.s_GraphRangeNotSelected + "</div>";
            }
            return;
          }
          grange = spreadsheet.graphrange;
          if (grange && grange.indexOf(":") === -1) {
            nrange = SocialCalc.Formula.LookupName(spreadsheet.sheet, grange || "");
            if (nrange.type !== "range") {
              gview.innerHTML = SocialCalc.LocalizeString("Unknown range name") + ": " + grange;
              return;
            }
            rparts = nrange.value.match(/^(.*)\|(.*)\|$/);
            grange = rparts[1] + ":" + rparts[2];
          }
          prange = SocialCalc.ParseRange(grange);
          range = {};
          if (prange.cr1.col <= prange.cr2.col) {
            range.left = prange.cr1.col;
            range.right = prange.cr2.col;
          } else {
            range.left = prange.cr2.col;
            range.right = prange.cr1.col;
          }
          if (prange.cr1.row <= prange.cr2.row) {
            range.top = prange.cr1.row;
            range.bottom = prange.cr2.row;
          } else {
            range.top = prange.cr2.row;
            range.bottom = prange.cr1.row;
          }
          if (gfunc) {
            gfunc(spreadsheet, range, gview, spreadsheet.graphtype, helpflag, isResize);
          }
        };
        window.GraphChanged = GraphChanged = function(gtobj){
          window.spreadsheet.graphtype = gtobj.options[gtobj.selectedIndex].value;
          return DoGraph(false, false);
        };
        window.MinMaxChanged = MinMaxChanged = function(minmaxobj, index){
          switch (index) {
          case 0:
            window.spreadsheet.graphMinX = minmaxobj.value;
            break;
          case 1:
            window.spreadsheet.graphMaxX = minmaxobj.value;
            break;
          case 2:
            window.spreadsheet.graphMinY = minmaxobj.value;
            break;
          case 3:
            window.spreadsheet.graphMaxY = minmaxobj.value;
          }
          return DoGraph(false, true);
        };
        window.GraphSave = GraphSave = function(editor, setting){
          var spreadsheet, gtype, str;
          spreadsheet = SocialCalc.GetSpreadsheetControlObject();
          gtype = spreadsheet.graphtype || "";
          str = "graph:range:" + SocialCalc.encodeForSave(spreadsheet.graphrange) + ":type:" + SocialCalc.encodeForSave(gtype);
          str += ":minmax:" + SocialCalc.encodeForSave(spreadsheet.graphMinX + "," + spreadsheet.graphMaxX + "," + spreadsheet.graphMinY + "," + spreadsheet.graphMaxY) + "\n";
          return str;
        };
        window.GraphLoad = GraphLoad = function(editor, setting, line, flags){
          var spreadsheet, parts, i, splitMinMax;
          spreadsheet = SocialCalc.GetSpreadsheetControlObject();
          parts = line.split(":");
          i = 1;
          while (i < parts.length) {
            switch (parts[i]) {
            case 'type':
              spreadsheet.graphtype = SocialCalc.decodeFromSave(parts[i + 1]);
              break;
            case 'range':
              spreadsheet.graphrange = SocialCalc.decodeFromSave(parts[i + 1]);
              break;
            case 'minmax':
              splitMinMax = SocialCalc.decodeFromSave(parts[i + 1]).split(',');
              spreadsheet.graphMinX = splitMinMax[0];
              document.getElementById("SocialCalc-graphMinX").value = spreadsheet.graphMinX;
              spreadsheet.graphMaxX = splitMinMax[1];
              document.getElementById("SocialCalc-graphMaxX").value = spreadsheet.graphMaxX;
              spreadsheet.graphMinY = splitMinMax[2];
              document.getElementById("SocialCalc-graphMinY").value = spreadsheet.graphMinY;
              spreadsheet.graphMaxY = splitMinMax[3];
              document.getElementById("SocialCalc-graphMaxY").value = spreadsheet.graphMaxY;
            }
            i += 2;
          }
          return true;
        };
        GraphVerticalBar = function(spreadsheet, range, gview, gtype, helpflag){
          var values, labels, str, nitems, byrow, maxheight, totalwidth, maxval, minval, i, cr, cr1, cell, val, profChartVals, profChartLabels, canv, ctx, colors, barColor, colorList, eachwidth, zeroLine, yScale, gChart, profChartUrl;
          values = [];
          labels = [];
          if (helpflag || !range) {
            str = "<input type=\"button\" value=" + SocialCalc.Constants.s_loc_hide_help + " onclick=\"DoGraph(false,false);\"><br><br>" + "This is the help text for graph type: " + SocialCalc.GraphTypesInfo[gtype].display + ".<br><br>" + "The <b>Graph</b> tab displays a bar graph of the cells which have been selected " + "(either in a single row across or column down). " + "If the row above (or column to the left) of the selection has values, those values are used as labels. " + "Otherwise the cells value is used as a label. " + "<br><br><input type=\"button\" value=" + SocialCalc.Constants.s_loc_hide_help + " onclick=\"DoGraph(false,false);\">";
            str = SocialCalc.LocalizeSubstrings(str);
            gview.innerHTML = str;
            return;
          }
          if (range.left === range.right) {
            nitems = range.bottom - range.top + 1;
            byrow = true;
          } else {
            nitems = range.right - range.left + 1;
            byrow = false;
          }
          str = "";
          maxheight = (spreadsheet.height - spreadsheet.nonviewheight) - 50;
          totalwidth = spreadsheet.width - 30;
          minval = maxval = null;
          i = 0;
          while (i < nitems) {
            cr = byrow
              ? SocialCalc.rcColname(range.left) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + range.top;
            cr1 = byrow
              ? SocialCalc.rcColname(range.left - 1 || 1) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + (range.top - 1 || 1);
            cell = spreadsheet.sheet.GetAssuredCell(cr);
            if (cell.valuetype.charAt(0) === "n") {
              val = cell.datavalue - 0;
              if (maxval == null || maxval < val) {
                maxval = val;
              }
              if (minval == null || minval > val) {
                minval = val;
              }
              values.push(val);
              cell = spreadsheet.sheet.GetAssuredCell(cr1);
              if ((range.right === range.left || range.top === range.bottom) && (cell.valuetype.charAt(0) === "t" || cell.valuetype.charAt(0) === "n")) {
                labels.push(cell.datavalue + "");
              } else {
                labels.push(val + "");
              }
            }
            i++;
          }
          if (maxval < 0) {
            maxval = 0;
          }
          if (minval > 0) {
            minval = 0;
          }
          str = "<table><tr><td><canvas id=\"myBarCanvas\" width=\"500px\" height=\"400px\" style=\"border:1px solid black;\"></canvas></td><td><span id=\"googleBarChart\"></span></td></tr></table>";
          gview.innerHTML = str;
          profChartVals = new Array();
          profChartLabels = new Array();
          canv = document.getElementById('myBarCanvas');
          ctx = canv.getContext('2d');
          ctx.font = "10pt bold Arial";
          maxheight = canv.height - 60;
          totalwidth = canv.width;
          colors = (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]).concat(["a", "b", "c", "d", "e", "f"]);
          barColor = getBarColor();
          ctx.fillStyle = '#' + barColor;
          colorList = [barColor];
          eachwidth = Math.floor(totalwidth / (values.length || 1)) - 4 || 1;
          zeroLine = maxheight * (maxval / (maxval - minval)) + 30;
          ctx.lineWidth = 5;
          ctx.moveTo(0, zeroLine);
          ctx.lineTo(canv.width, zeroLine);
          ctx.stroke();
          yScale = maxheight / (maxval - minval);
          i = 0;
          while (i < values.length) {
            ctx.fillRect(i * eachwidth, zeroLine - yScale * values[i], eachwidth, yScale * values[i]);
            profChartVals.push(Math.floor((values[i] - minval) * yScale / 3.4));
            profChartLabels.push(labels[i]);
            barColor = getBarColor();
            ctx.fillStyle = '#' + barColor;
            colorList.push(barColor);
            i++;
          }
          ctx.strokeStyle = '#000000';
          ctx.fillStyle = '#000000';
          if (values[0] > 0) {
            ctx.translate(5, zeroLine + 22);
          } else {
            ctx.translate(5, zeroLine - 15);
          }
          ctx.fillText(labels[0], 0, 0);
          if (labels[0] !== values[0]) {
            ctx.fillText(values[0], 0, -24);
          }
          i = 1;
          while (i < values.length) {
            if (values[i] > 0 && values[i - 1] < 0) {
              ctx.translate(eachwidth, 37);
            } else {
              if (values[i] < 0 && values[i - 1] > 0) {
                ctx.translate(eachwidth, -37);
              } else {
                ctx.translate(eachwidth, 0);
              }
            }
            ctx.fillText(labels[i], 0, 0);
            if (labels[i] !== values[i]) {
              ctx.fillText(values[i], 0, -24);
            }
            i++;
          }
          gChart = document.getElementById("googleBarChart");
          zeroLine = (-1 * minval) * yScale / 340;
          return profChartUrl = "chs=300x250&cht=bvg&chd=t:" + profChartVals.join(",") + "&chxt=x,y&chxl=0:|" + profChartLabels.join("|") + "|&chxr=1," + minval + "," + maxval + "&chp=" + zeroLine + "&chbh=a&chm=r,000000,0," + zeroLine + "," + (zeroLine + 0.005) + "&chco=" + colorList.join("|");
        };
        GraphHorizontalBar = function(spreadsheet, range, gview, gtype, helpflag){
          var values, labels, str, nitems, byrow, maxheight, totalwidth, minval, maxval, i, cr, cr1, cell, val, profChartVals, profChartLabels, canv, ctx, colors, barColor, colorList, eachwidth, zeroLine, yScale, gChart, profChartUrl;
          values = [];
          labels = [];
          if (helpflag || !range) {
            str = "<input type=\"button\" value=" + SocialCalc.Constants.s_loc_hide_help + " onclick=\"DoGraph(false,false);\"><br><br>" + "This is the help text for graph type: " + SocialCalc.GraphTypesInfo[gtype].display + ".<br><br>" + "The <b>Graph</b> tab displays a very simple bar graph representation of the cells currently selected as a range to graph " + "(either in a single row across or column down). " + "If the range is a single row or column, and if the row above (or column to the left) has values, those values are used as labels. " + "Otherwise the cell coordinates are used (e.g., B5). " + "This is a very early, minimal implementation for demonstration purposes. " + "<br><br><input type=\"button\" value=" + SocialCalc.Constants.s_loc_hide_help + " onclick=\"DoGraph(false,false);\">";
            gview.innerHTML = str;
            return;
          }
          if (range.left === range.right) {
            nitems = range.bottom - range.top + 1;
            byrow = true;
          } else {
            nitems = range.right - range.left + 1;
            byrow = false;
          }
          str = "";
          maxheight = (spreadsheet.height - spreadsheet.nonviewheight) - 50;
          totalwidth = spreadsheet.width - 30;
          minval = null;
          maxval = null;
          i = 0;
          while (i < nitems) {
            cr = byrow
              ? SocialCalc.rcColname(range.left) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + range.top;
            cr1 = byrow
              ? SocialCalc.rcColname(range.left - 1 || 1) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + (range.top - 1 || 1);
            cell = spreadsheet.sheet.GetAssuredCell(cr);
            if (cell.valuetype.charAt(0) === "n") {
              val = cell.datavalue - 0;
              if (maxval == null || maxval < val) {
                maxval = val;
              }
              if (minval == null || minval > val) {
                minval = val;
              }
              values.push(val);
              cell = spreadsheet.sheet.GetAssuredCell(cr1);
              if ((range.right === range.left || range.top === range.bottom) && (cell.valuetype.charAt(0) === "t" || cell.valuetype.charAt(0) === "n")) {
                labels.push(cell.datavalue + "");
              } else {
                labels.push(val + "");
              }
            }
            i++;
          }
          if (maxval < 0) {
            maxval = 0;
          }
          if (minval > 0) {
            minval = 0;
          }
          str = "<table><tr><td><canvas id=\"myBarCanvas\" width=\"500px\" height=\"400px\" style=\"border:1px solid black;\"></canvas></td><td><span id=\"googleBarChart\"></span></td></tr></table>";
          gview.innerHTML = str;
          profChartVals = new Array();
          profChartLabels = new Array();
          canv = document.getElementById("myBarCanvas");
          ctx = canv.getContext("2d");
          ctx.font = "10pt bold Arial";
          maxheight = canv.height - 60;
          totalwidth = canv.width;
          colors = (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]).concat(["a", "b", "c", "d", "e", "f"]);
          barColor = getBarColor();
          ctx.fillStyle = "#" + barColor;
          colorList = [barColor];
          eachwidth = Math.floor(maxheight / (values.length || 1)) - 4 || 1;
          zeroLine = totalwidth * (maxval / (maxval - minval)) - 5;
          zeroLine = canv.width - zeroLine + 40;
          ctx.lineWidth = 5;
          ctx.moveTo(zeroLine, 0);
          ctx.lineTo(zeroLine, canv.height);
          ctx.stroke();
          yScale = totalwidth / (maxval - minval) * 4.4 / 5;
          i = 0;
          while (i < values.length) {
            ctx.fillRect(zeroLine + yScale * values[i], i * eachwidth + 30, -1 * yScale * values[i], eachwidth);
            profChartVals.push(Math.floor((values[i] - minval) * yScale / 4.4));
            profChartLabels.push(labels[i]);
            barColor = getBarColor();
            ctx.fillStyle = "#" + barColor;
            colorList.push(barColor);
            i++;
          }
          ctx.strokeStyle = "#000000";
          ctx.fillStyle = "#000000";
          if (values[0] > 0) {
            ctx.translate(zeroLine - 22, 45);
          } else {
            ctx.translate(zeroLine + 15, 45);
          }
          ctx.fillText(labels[0], 0, 0);
          if (labels[0] !== values[0]) {
            ctx.fillText(values[0], 0, 24);
          }
          i = 1;
          while (i < values.length) {
            if (values[i] > 0 && values[i - 1] < 0) {
              ctx.translate(-37, eachwidth);
            } else {
              if (values[i] < 0 && values[i - 1] > 0) {
                ctx.translate(37, eachwidth);
              } else {
                ctx.translate(0, eachwidth);
              }
            }
            ctx.fillText(labels[i], 0, 0);
            if (labels[i] !== values[i]) {
              ctx.fillText(values[i], 0, 24);
            }
            i++;
          }
          gChart = document.getElementById("googleBarChart");
          zeroLine = (-1 * minval) * yScale / canv.width;
          return profChartUrl = "chs=300x250&cht=bhs&chd=t:" + profChartVals.join(",") + "&chxt=x,y&chxl=1:|" + profChartLabels.reverse().join("|") + "|&chxr=0," + minval + "," + maxval + "&chp=" + zeroLine + "&chbh=a&chm=r,000000,0," + zeroLine + "," + (zeroLine + 0.005) + "&chco=" + colorList.join("|");
        };
        MakePieChart = function(spreadsheet, range, gview, gtype, helpflag){
          var values, labels, total, nitems, byrow, i, cr, cr1, cell, val, str, profChartUrl, profChartLabels, canv, ctx, centerX, centerY, rad, textRad, lastStart, colors, arcColor, arcRads, centralRad, leftBias, realCanv, gChart;
          values = [];
          labels = [];
          total = 0;
          if (range.left === range.right) {
            nitems = range.bottom - range.top + 1;
            byrow = true;
          } else {
            nitems = range.right - range.left + 1;
            byrow = false;
          }
          i = 0;
          while (i < nitems) {
            cr = byrow
              ? SocialCalc.rcColname(range.left) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + range.top;
            cr1 = byrow
              ? SocialCalc.rcColname(range.left - 1 || 1) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + (range.top - 1 || 1);
            cell = spreadsheet.sheet.GetAssuredCell(cr);
            if (cell.valuetype.charAt(0) === "n") {
              val = cell.datavalue - 0;
              total += val;
              values.push(val);
              cell = spreadsheet.sheet.GetAssuredCell(cr1);
              if ((range.right === range.left || range.top === range.bottom) && (cell.valuetype.charAt(0) === "t" || cell.valuetype.charAt(0) === "n")) {
                labels.push(cell.datavalue + "");
              } else {
                labels.push(val + "");
              }
            }
            i++;
          }
          str = "<table><tr><td><img id=\"canvImg\" style=\"border:1px solid black;\" src=\"\"/><canvas id=\"myCanvas\" style=\"display:none;\" width=\"500px\" height=\"400px\"></canvas></td><td><span id=\"googleChart\"></span></td></tr></table>";
          gview.innerHTML = str;
          profChartUrl = "";
          profChartLabels = "";
          canv = document.getElementById("myCanvas");
          ctx = canv.getContext("2d");
          ctx.font = "10pt Arial";
          centerX = canv.width / 2;
          centerY = canv.height / 2;
          rad = centerY - 50;
          textRad = rad * 1.1;
          lastStart = 0;
          colors = (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]).concat(["a", "b", "c", "d", "e", "f"]);
          i = 0;
          while (i < values.length) {
            if (Number(values[i]) === 0) {
              i++;
              continue;
            }
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            arcColor = getDrawColor();
            ctx.fillStyle = arcColor;
            arcRads = 2 * Math.PI * (values[i] / total);
            profChartUrl += "," + values[i];
            ctx.arc(centerX, centerY, rad, lastStart, lastStart + arcRads, false);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "black";
            centralRad = lastStart + 0.5 * arcRads;
            leftBias = 0;
            if (centralRad > 1.5 && centralRad < 4.6) {
              leftBias = 55;
            }
            ctx.translate(centerX + Math.cos(centralRad) * textRad - leftBias, centerY + Math.sin(centralRad) * textRad);
            ctx.fillText(labels[i] + " (" + Math.round(values[i] / total * 100) + "%)", 0, 0);
            ctx.translate(-1 * centerX - Math.cos(centralRad) * textRad + leftBias, -1 * centerY - Math.sin(centralRad) * textRad);
            ctx.fillRect(1, 1, 1, 1);
            ctx.closePath();
            profChartLabels += "|" + labels[i];
            lastStart += arcRads;
            i++;
          }
          realCanv = document.getElementById("canvImg");
          realCanv.src = canv.toDataURL();
          gChart = document.getElementById("googleChart");
          return profChartUrl = "chs=300x145&cht=p&chd=t:" + profChartUrl.substring(1) + "&chl=" + profChartLabels.substring(1);
        };
        MakeLineChart = function(spreadsheet, range, gview, gtype, helpflag, isResize){
          var values, labels, total, colors, shapes, nitems, byrow, minX, maxX, minval, maxval, evenlySpaced, i, cr, cr1, cell, val, str, canv, ctx, scaleFactorX, scaleFactorY, lastX, lastY, profChart, topY, drawColor, colorArray, newIndex, colorMarkings, graphPlace, gChart, profChartUrl;
          values = [];
          labels = [];
          total = 0;
          colors = (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]).concat(["a", "b", "c", "d", "e", "f"]);
          shapes = ['s', 'o', 'c'];
          if (range.left === range.right) {
            nitems = range.bottom - range.top + 1;
            byrow = true;
          } else {
            nitems = range.right - range.left + 1;
            byrow = false;
          }
          if (isResize) {
            try {
              minX = 1 * document.getElementById("SocialCalc-graphMinX").value;
            } catch (e) {
              minX = null;
            }
            try {
              maxX = 1 * document.getElementById("SocialCalc-graphMaxX").value;
            } catch (e) {
              maxX = null;
            }
            try {
              minval = 1 * document.getElementById("SocialCalc-graphMinY").value;
            } catch (e) {
              minval = null;
            }
            try {
              maxval = 1 * document.getElementById("SocialCalc-graphMaxY").value;
            } catch (e) {
              maxval = null;
            }
          }
          evenlySpaced = false;
          i = 0;
          while (i < nitems) {
            cr = byrow
              ? SocialCalc.rcColname(range.left) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + range.top;
            cr1 = byrow
              ? SocialCalc.rcColname(range.left - 1 || 1) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + (range.top - 1 || 1);
            cell = spreadsheet.sheet.GetAssuredCell(cr);
            if (cell.valuetype.charAt(0) === "n") {
              val = cell.datavalue - 0;
              if ((maxval == null || maxval < val) && !isResize) {
                maxval = val;
              }
              if ((minval == null || minval > val) && !isResize) {
                minval = val;
              }
              values.push(val);
              cell = spreadsheet.sheet.GetAssuredCell(cr1);
              if ((range.right === range.left || range.top === range.bottom) && (cell.valuetype.charAt(0) === "t" || cell.valuetype.charAt(0) === "n")) {
                labels.push(cell.datavalue + "");
                if ((maxX == null || maxX < cell.datavalue) && !isResize) {
                  maxX = cell.datavalue;
                }
                if ((minX == null || minX > cell.datavalue) && !isResize) {
                  minX = cell.datavalue;
                }
              } else {
                labels.push(cr);
                evenlySpaced = true;
              }
            }
            i++;
          }
          if (evenlySpaced) {
            i = 0;
            while (i < values.length) {
              labels[i] = i;
              i++;
            }
            if (!isResize) {
              minX = 0;
              maxX = values.length - 1;
            }
          }
          str = "<canvas id=\"myLineCanvas\" style=\"border:1px solid black;\" width=\"500px\" height=\"400px\"></canvas><span id=\"googleLineChart\"></span>";
          gview.innerHTML = str;
          if (!isResize) {
            document.getElementById("SocialCalc-graphMinX").value = minX;
            spreadsheet.graphMinX = minX;
            document.getElementById("SocialCalc-graphMaxX").value = maxX;
            spreadsheet.graphMaxX = maxX;
            document.getElementById("SocialCalc-graphMinY").value = minval;
            spreadsheet.graphMinY = minval;
            document.getElementById("SocialCalc-graphMaxY").value = maxval;
            spreadsheet.graphMaxY = maxval;
          }
          canv = document.getElementById("myLineCanvas");
          ctx = canv.getContext("2d");
          scaleFactorX = (canv.width - 40) / (maxX - minX);
          scaleFactorY = (canv.height - 40) / (maxval - minval);
          lastX = scaleFactorX * (labels[0] - minX) + 20;
          lastY = scaleFactorY * (values[0] - minval) + 20;
          profChart = [Math.floor(lastX / canv.width * 100), Math.floor(lastY / canv.height * 100)];
          topY = canv.height;
          drawColor = getDrawColor();
          colorArray = [drawColor.replace("#", "")];
          ctx.strokeStyle = drawColor;
          ctx.fillStyle = drawColor;
          ctx.fillRect(lastX - 3, topY - lastY - 3, 6, 6);
          ctx.beginPath();
          i = 1;
          while (i < values.length) {
            if (labels[i] * 1 > labels[i - 1] * 1) {
              ctx.moveTo(lastX, topY - lastY);
              ctx.lineTo(scaleFactorX * (labels[i] - minX) + 20, topY - (scaleFactorY * (values[i] - minval) + 20));
              ctx.stroke();
            } else {
              drawColor = getDrawColor();
              ctx.strokeStyle = drawColor;
              ctx.fillStyle = drawColor;
              colorArray.push(drawColor.replace("#", ""));
              ctx.beginPath();
            }
            lastX = scaleFactorX * (labels[i] - minX) + 20;
            lastY = scaleFactorY * (values[i] - minval) + 20;
            if ((colorArray.length - 1) % 3 === 0) {
              ctx.fillRect(lastX - 3, topY - lastY - 3, 6, 6);
            } else if ((colorArray.length - 1) % 3 === 1) {
              ctx.beginPath();
              ctx.arc(lastX, topY - lastY, 3, 0, Math.PI * 2, false);
              ctx.fill();
            } else {
              ctx.fillRect(lastX, topY - lastY - 3, 2, 8);
              ctx.fillRect(lastX - 3, topY - lastY, 8, 2);
            }
            if (labels[i] * 1 > labels[i - 1] * 1) {
              profChart[profChart.length - 2] += "," + Math.floor(lastX / canv.width * 100);
              profChart[profChart.length - 1] += "," + Math.floor(lastY / canv.height * 100);
            } else {
              newIndex = profChart.length;
              profChart[newIndex] = Math.floor(lastX / canv.width * 100);
              profChart[newIndex + 1] = Math.floor(lastY / canv.height * 100);
            }
            i++;
          }
          ctx.stroke();
          colorMarkings = "&chco=" + colorArray.join(",") + "&chm=";
          i = 0;
          while (i < colorArray.length) {
            if (i % 3 === 0) {
              colorArray[i] = "s," + colorArray[i] + "," + i + ",-1,6";
            } else if (i % 3 === 1) {
              colorArray[i] = "o," + colorArray[i] + "," + i + ",-1,6";
            } else {
              colorArray[i] = "c," + colorArray[i] + "," + i + ",-1,10";
            }
            i++;
          }
          colorMarkings += colorArray.join("|");
          if (minval <= 0 && maxval >= 0) {
            ctx.beginPath();
            ctx.strokeStyle = "#000000";
            ctx.moveTo(0, canv.height - (scaleFactorY * -1 * minval + 20));
            ctx.lineTo(canv.width, canv.height - (scaleFactorY * -1 * minval + 20));
            ctx.stroke();
            graphPlace = 1 - (canv.height - (scaleFactorY * -1 * minval + 20)) / canv.height;
            colorMarkings += "|r,000000,0," + graphPlace + "," + (graphPlace + 0.005);
          }
          if (minX <= 0 && maxX >= 0) {
            ctx.beginPath();
            ctx.strokeStyle = "#000000";
            ctx.moveTo(scaleFactorX * -1 * minX + 20, 0);
            ctx.lineTo(scaleFactorX * -1 * minX + 20, canv.height);
            ctx.stroke();
            graphPlace = (scaleFactorX * -1 * minX + 20) / canv.width;
            colorMarkings += "|R,000000,0," + graphPlace + "," + (graphPlace + 0.005);
          }
          gChart = document.getElementById("googleLineChart");
          minX -= (maxX - minX) / 23;
          maxX += (maxX - minX) / 23;
          minval -= (maxval - minval) / 18;
          maxval += (maxval - minval) / 18;
          return profChartUrl = "chs=300x250" + colorMarkings + "&cht=lxy&chxt=x,y&chxr=0," + minX + "," + maxX + "|1," + minval + "," + maxval + "&chd=t:" + profChart.join("|");
        };
        MakeScatterChart = function(spreadsheet, range, gview, gtype, helpflag, isResize){
          var values, labels, total, colors, nitems, byrow, minX, maxX, minval, maxval, evenlySpaced, dotSizes, i, cr, cr1, cr2, cell, val, str, canv, ctx, scaleFactorX, scaleFactorY, lastX, lastY, profChart, topY, drawColor, colorMarkings, graphPlace, gChart, profChartUrl;
          values = [];
          labels = [];
          total = 0;
          colors = (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]).concat(["a", "b", "c", "d", "e", "f"]);
          if (range.left === range.right) {
            nitems = range.bottom - range.top + 1;
            byrow = true;
          } else {
            nitems = range.right - range.left + 1;
            byrow = false;
          }
          if (isResize) {
            try {
              minX = 1 * document.getElementById("SocialCalc-graphMinX").value;
            } catch (e) {
              minX = null;
            }
            try {
              maxX = 1 * document.getElementById("SocialCalc-graphMaxX").value;
            } catch (e) {
              maxX = null;
            }
            try {
              minval = 1 * document.getElementById("SocialCalc-graphMinY").value;
            } catch (e) {
              minval = null;
            }
            try {
              maxval = 1 * document.getElementById("SocialCalc-graphMaxY").value;
            } catch (e) {
              maxval = null;
            }
          }
          evenlySpaced = false;
          dotSizes = new Array();
          i = 0;
          while (i < nitems) {
            cr = byrow
              ? SocialCalc.rcColname(range.left) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + range.top;
            cr1 = byrow
              ? SocialCalc.rcColname(range.left - 1 || 1) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + (range.top - 1 || 1);
            cr2 = byrow
              ? SocialCalc.rcColname(range.left + 1 || 2) + (i + range.top)
              : SocialCalc.rcColname(i + range.left) + (range.top + 1 || 2);
            cell = spreadsheet.sheet.GetAssuredCell(cr);
            if (cell.valuetype.charAt(0) === "n") {
              val = cell.datavalue - 0;
              if ((maxval == null || maxval < val) && !isResize) {
                maxval = val;
              }
              if ((minval == null || minval > val) && !isResize) {
                minval = val;
              }
              values.push(val);
              cell = spreadsheet.sheet.GetAssuredCell(cr1);
              if ((range.right === range.left || range.top === range.bottom) && (cell.valuetype.charAt(0) === "t" || cell.valuetype.charAt(0) === "n")) {
                labels.push(cell.datavalue + "");
                if ((maxX == null || maxX < cell.datavalue) && !isResize) {
                  maxX = cell.datavalue;
                }
                if ((minX == null || minX > cell.datavalue) && !isResize) {
                  minX = cell.datavalue;
                }
              } else {
                labels.push(cr);
                evenlySpaced = true;
              }
              cell = spreadsheet.sheet.GetAssuredCell(cr2);
              if ((range.right === range.left || range.top === range.bottom) && (cell.valuetype.charAt(0) === "t" || cell.valuetype.charAt(0) === "n")) {
                dotSizes.push(cell.datavalue + "");
              } else {
                dotSizes.push("5");
              }
            }
            i++;
          }
          if (evenlySpaced) {
            i = 0;
            while (i < values.length) {
              labels[i] = i;
              i++;
            }
            if (!isResize) {
              minX = 0;
              maxX = values.length - 1;
            }
          }
          str = "<canvas id=\"myScatterCanvas\" style=\"border:1px solid black;\" width=\"500px\" height=\"400px\"></canvas><span id=\"googleScatterChart\"></span>";
          str += "<div id=\"scatterChartScales\"><input type=\"button\" id=\"autoScaleButton\" value=\"Reset\" onclick=\"\"/>X-min:<input id=\"minPlotX\" onchange=\"\" size=5/>X-max:<input id=\"maxPlotX\" onchange=\"\" size=5/>Y-min:<input id=\"minPlotY\" onchange=\"\" size=5/>Y-max:<input id=\"maxPlotY\" onchange=\"\" size=5/></div>";
          gview.innerHTML = str;
          if (!isResize) {
            document.getElementById("SocialCalc-graphMinX").value = minX;
            spreadsheet.graphMinX = minX;
            document.getElementById("SocialCalc-graphMaxX").value = maxX;
            spreadsheet.graphMaxX = maxX;
            document.getElementById("SocialCalc-graphMinY").value = minval;
            spreadsheet.graphMinY = minval;
            document.getElementById("SocialCalc-graphMaxY").value = maxval;
            spreadsheet.graphMaxY = maxval;
          }
          canv = document.getElementById("myScatterCanvas");
          ctx = canv.getContext("2d");
          scaleFactorX = (canv.width - 40) / (maxX - minX);
          scaleFactorY = (canv.height - 40) / (maxval - minval);
          lastX = scaleFactorX * (labels[0] - minX) + 20;
          lastY = scaleFactorY * (values[0] - minval) + 20;
          profChart = [Math.floor(lastX / canv.width * 100), Math.floor(lastY / canv.height * 100), dotSizes[0] * 10];
          topY = canv.height;
          drawColor = getDrawColor();
          ctx.fillStyle = drawColor;
          ctx.beginPath();
          ctx.arc(lastX, topY - lastY, dotSizes[0], 0, 2 * Math.PI, false);
          ctx.fill();
          i = 1;
          while (i < values.length) {
            ctx.moveTo(lastX, topY - lastY);
            lastX = scaleFactorX * (labels[i] - minX) + 20;
            lastY = scaleFactorY * (values[i] - minval) + 20;
            ctx.beginPath();
            ctx.arc(lastX, topY - lastY, dotSizes[i], 0, 2 * Math.PI, false);
            ctx.fill();
            profChart[profChart.length - 3] += "," + Math.floor(lastX / canv.width * 100);
            profChart[profChart.length - 2] += "," + Math.floor(lastY / canv.height * 100);
            profChart[profChart.length - 1] += "," + dotSizes[i] * 10;
            i++;
          }
          colorMarkings = "&chm=o," + drawColor.replace("#", "") + ",0,-1,10";
          if (minval <= 0 && maxval >= 0) {
            ctx.beginPath();
            ctx.strokeStyle = "#000000";
            ctx.moveTo(0, canv.height - (scaleFactorY * -1 * minval + 20));
            ctx.lineTo(canv.width, canv.height - (scaleFactorY * -1 * minval + 20));
            ctx.stroke();
            graphPlace = 1 - (canv.height - (scaleFactorY * -1 * minval + 20)) / canv.height;
            colorMarkings += "|r,000000,0," + graphPlace + "," + (graphPlace + 0.005);
          }
          if (minX <= 0 && maxX >= 0) {
            ctx.beginPath();
            ctx.strokeStyle = "#000000";
            ctx.moveTo(scaleFactorX * -1 * minX + 20, 0);
            ctx.lineTo(scaleFactorX * -1 * minX + 20, canv.height);
            ctx.stroke();
            graphPlace = (scaleFactorX * -1 * minX + 20) / canv.width;
            colorMarkings += "|R,000000,0," + graphPlace + "," + (graphPlace + 0.005);
          }
          gChart = document.getElementById("googleScatterChart");
          minX -= (maxX - minX) / 23;
          maxX += (maxX - minX) / 23;
          minval -= (maxval - minval) / 18;
          maxval += (maxval - minval) / 18;
          return profChartUrl = "chs=300x250" + colorMarkings + "&cht=s&chxt=x,y&chxr=0," + minX + "," + maxX + "|1," + minval + "," + maxval + "&chd=t:" + profChart.join("|");
        };
        SocialCalc.GraphTypesInfo = {
          displayorder: ["verticalbar", "horizontalbar", "piechart", "linechart", "scatterchart"],
          verticalbar: {
            display: SocialCalc.Constants.s_loc_vertical_bar,
            func: GraphVerticalBar
          },
          horizontalbar: {
            display: SocialCalc.Constants.s_loc_horizontal_bar,
            func: GraphHorizontalBar
          },
          piechart: {
            display: SocialCalc.Constants.s_loc_pie_chart,
            func: MakePieChart
          },
          linechart: {
            display: SocialCalc.Constants.s_loc_line_chart,
            func: MakeLineChart
          },
          scatterchart: {
            display: SocialCalc.Constants.s_loc_scatter_chart,
            func: MakeScatterChart
          }
        };
        return doPlay();
      }
    });
  };
}).call(this);
