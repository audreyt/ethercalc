(function(){
  var vm, fs, path, bootSC, Node, replace$ = ''.replace, join$ = [].join;
  vm = require('vm');
  fs = require('fs');
  path = require('path');
  bootSC = fs.readFileSync(path.dirname(fs.realpathSync(__filename)) + "/SocialCalcModule.js", 'utf8');
  global.SC == null && (global.SC = {});
  this.include = function(){
    var DB;
    DB = this.include('db');
    SC._get = function(room, io, cb){
      var ref$, this$ = this;
      if ((ref$ = SC[room]) != null && ref$._snapshot) {
        return cb({
          snapshot: SC[room]._snapshot
        });
      }
      return DB.multi().get("snapshot-" + room).lrange("log-" + room, 0, -1).exec(function(_, arg$){
        var snapshot, log;
        snapshot = arg$[0], log = arg$[1];
        if ((snapshot || log.length) && io) {
          SC[room] = SC._init(snapshot, log, DB, room, io);
        }
        return cb({
          log: log,
          snapshot: snapshot
        });
      });
    };
    SC._put = function(room, snapshot, cb){
      var this$ = this;
      if (!snapshot) {
        return typeof cb === 'function' ? cb() : void 8;
      }
      return DB.multi().set("snapshot-" + room, snapshot).del(["log-" + room, "chat-" + room, "ecell-" + room, "audit-" + room]).bgsave().exec(function(){
        return typeof cb === 'function' ? cb() : void 8;
      });
    };
    SC._init = function(snapshot, log, DB, room, io){
      var sandbox, SocialCalc, ss, parts, cmdstr, line;
      log == null && (log = []);
      if (SC[room] != null) {
        SC[room]._doClearCache();
        return SC[room];
      }
      sandbox = vm.createContext({
        SocialCalc: null,
        ss: null,
        window: {
          setTimeout: function(cb, ms){
            if (ms === 1) {
              return process.nextTick(cb);
            }
          },
          clearTimeout: function(){}
        },
        console: console
      });
      vm.runInContext(bootSC, sandbox);
      SocialCalc = sandbox.SocialCalc;
      SocialCalc.SaveEditorSettings = function(){
        return "";
      };
      SocialCalc.CreateAuditString = function(){
        return "";
      };
      SocialCalc.CalculateEditorPositions = function(){};
      SocialCalc.Popup.Types.List.Create = function(){};
      SocialCalc.Popup.Types.ColorChooser.Create = function(){};
      SocialCalc.Popup.Initialize = function(){};
      vm.runInContext('ss = new SocialCalc.SpreadsheetControl', sandbox);
      SocialCalc.RecalcInfo.LoadSheet = function(ref){
        var serialization, parts;
        ref = (replace$.call(ref, /[^a-zA-Z0-9]+/g, '')).toLowerCase();
        if (SC[ref]) {
          serialization = SC[ref].CreateSpreadsheetSave();
          parts = SC[ref].DecodeSpreadsheetSave(serialization);
          SocialCalc.RecalcLoadedSheet(ref, serialization.substring(parts.sheet.start, parts.sheet.end), true);
        } else {
          SocialCalc.RecalcLoadedSheet(ref, '', true);
        }
        return true;
      };
      ss = sandbox.ss;
      ss.SocialCalc = SocialCalc;
      ss._room = room;
      ss._doClearCache = function(){
        return SocialCalc.Formula.SheetCache.sheets = {};
      };
      ss.editor.StatusCallback.EtherCalc = {
        func: function(editor, status, arg){
          var newSnapshot, this$ = this;
          if (!(status === 'doneposcalc' && !ss.editor.busy)) {
            return;
          }
          newSnapshot = ss.CreateSpreadsheetSave();
          if (ss._snapshot === newSnapshot) {
            return;
          }
          io.sockets['in']("recalc." + room).emit('data', {
            type: 'recalc',
            snapshot: newSnapshot,
            force: true,
            room: room
          });
          ss._snapshot = newSnapshot;
          return DB.multi().set("snapshot-" + room, newSnapshot).del("log-" + room).bgsave().exec(function(){
            return console.log("==> Regenerated snapshot for " + room);
          });
        }
      };
      if (snapshot) {
        parts = ss.DecodeSpreadsheetSave(snapshot);
      }
      if (parts != null && parts.sheet) {
        ss.sheet.ResetSheet();
        ss.ParseSheetSave(snapshot.substring(parts.sheet.start, parts.sheet.end));
      }
      cmdstr = (function(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = log).length; i$ < len$; ++i$) {
          line = ref$[i$];
          if (!/^re(calc|display)$/.test(line)) {
            results$.push(line);
          }
        }
        return results$;
      }()).join('\n');
      if (cmdstr.length) {
        cmdstr += "\n";
      }
      ss.context.sheetobj.ScheduleSheetCommands("set sheet defaulttextvalueformat text-wiki\n" + cmdstr + "recalc\n", false, true);
      SocialCalc.document.createElement = function(it){
        return new Node(it);
      };
      return ss;
    };
    return SC;
  };
  Node = (function(){
    Node.displayName = 'Node';
    var prototype = Node.prototype, constructor = Node;
    function Node(tag, attrs, style, elems, raw){
      this.tag = tag != null ? tag : "div";
      this.attrs = attrs != null
        ? attrs
        : {};
      this.style = style != null
        ? style
        : {};
      this.elems = elems != null
        ? elems
        : [];
      this.raw = raw != null ? raw : '';
    }
    Object.defineProperty(prototype, 'id', {
      set: function(id){
        this.attrs.id = id;
      },
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(prototype, 'width', {
      set: function(width){
        this.attrs.width = width;
      },
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(prototype, 'height', {
      set: function(height){
        this.attrs.height = height;
      },
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(prototype, 'className', {
      set: function($class){
        this.attrs['class'] = $class;
      },
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(prototype, 'innerHTML', {
      set: function(raw){
        this.raw = raw;
      },
      get: function(){
        return this.raw || join$.call(this.elems.map(function(it){
          return it.outerHTML;
        }), "\n");
      },
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(prototype, 'outerHTML', {
      get: function(){
        var tag, attrs, style, css, k, v;
        tag = this.tag, attrs = this.attrs, style = this.style;
        css = style.cssText || (function(){
          var ref$, results$ = [];
          for (k in ref$ = style) {
            v = ref$[k];
            results$.push(k + ":" + v);
          }
          return results$;
        }()).join(";");
        if (css) {
          attrs.style = css;
        } else {
          delete attrs.style;
        }
        return "<" + tag + (function(){
          var ref$, results$ = [];
          for (k in ref$ = attrs) {
            v = ref$[k];
            results$.push(" " + k + "=\"" + v + "\"");
          }
          return results$;
        }()).join("") + ">" + this.innerHTML + "</" + tag + ">";
      },
      configurable: true,
      enumerable: true
    });
    prototype.appendChild = function(it){
      return this.elems.push(it);
    };
    return Node;
  }());
}).call(this);
