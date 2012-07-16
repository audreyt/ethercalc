(function(){
  this.include = function(){
    return this.client({
      '/player/main.js': function(){
        var $, doPlay, onLoad, __ref, __this = this;
        $ = window.jQuery || window.$ || alert('jQuery not available');
        doPlay = function(){
          var emit, __ref;
          window.SocialCalc == null && (window.SocialCalc = {});
          SocialCalc._username = Math.random().toString();
          SocialCalc.isConnected = true;
          if (/\?auth=/.test(window.location.search)) {
            SocialCalc._auth = (__ref = window.location.search) != null ? __ref.replace(/\??auth=/, '') : void 8;
          }
          SocialCalc._view = SocialCalc._auth === '0';
          SocialCalc._room == null && (SocialCalc._room = window.location.hash.replace('#', ''));
          SocialCalc._room = (SocialCalc._room + "").replace(/^_+/, '').replace(/\?.*/, '');
          if ((typeof Drupal != 'undefined' && Drupal !== null) && Drupal.sheetnode) {
            if (/overlay=node\/\d+/.test(window.location.hash)) {
              SocialCalc._room = window.location.hash.match(/=node\/(\d+)/)[1];
            } else if (/\/node\/\d+/.test(window.location.href)) {
              SocialCalc._room = window.location.href.match(/\/node\/(\d+)/)[1];
            }
          } else if (SocialCalc._room) {
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
          } else {
            window.location = '/_start';
            return;
          }
          __this.connect(($('script[src*="socket.io/socket.io.js"]').attr('src') + "").replace(/socket.io\/socket.io.js.*/, ''));
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
              if (!ss) {
                return;
              }
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
                  if ((cell != null ? cell.element.className.search(find) : void 8) === -1) {
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
                  origCell.element.className = origCell.element.className.replace(find, '');
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
                  window.addmsg(this.data.chat.join('\n'), true);
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
        $(function(){
          var $container, __ref, __ref1;
          if (!((typeof Drupal != 'undefined' && Drupal !== null) && ((__ref = Drupal.sheetnode) != null && ((__ref1 = __ref.sheetviews) != null && __ref1.length)))) {
            return onLoad();
          }
          $container = Drupal.sheetnode.sheetviews[0].$container;
          return $container.bind('sheetnodeReady', function(_, __arg){
            var spreadsheet;
            spreadsheet = __arg.spreadsheet;
            if (spreadsheet.tabbackground === 'display:none;') {
              if (spreadsheet.InitializeSpreadsheetControl) {
                return;
              }
              SocialCalc._auth = '0';
            }
            return onLoad(spreadsheet);
          });
        });
        onLoad = function(ssInstance){
          var ss, __ref;
          window.spreadsheet = ss = ssInstance || (SocialCalc._view
            ? new SocialCalc.SpreadsheetViewer()
            : new SocialCalc.SpreadsheetControl());
          SocialCalc.Callbacks.broadcast('ask.log');
          if (!window.GraphOnClick) {
            return;
          }
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
              onclick: window.GraphOnClick,
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
        };
        if ((__ref = window.Document) != null && __ref.Parser) {
          SocialCalc.Callbacks.expand_wiki = function(val){
            return "<div class=\"wiki\">" + new Document.Parser.Wikitext().parse(val, new Document.Emitter.HTML()) + "</div>";
          };
        }
        return doPlay();
      }
    });
  };
}).call(this);
