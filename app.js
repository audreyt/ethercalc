(function() {
  /*
  CC0 1.0 Universal
  
  To the extent possible under law, 唐鳳 has waived all copyright and
  related or neighboring rights to MeetingCalc.
  
  This work is published from Taiwan.
  
  <http://creativecommons.org/publicdomain/zero/1.0>
  */
  var db, host, items, name, port, redisHost, redisPass, redisPort, services, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  port = Number(process.env.VCAP_APP_PORT || 3000);
  host = process.env.VCAP_APP_HOST || '127.0.0.1';
  _ref = [null, null, null], redisPort = _ref[0], redisHost = _ref[1], redisPass = _ref[2];
  services = JSON.parse(process.env.VCAP_SERVICES || "{}");
  for (name in services) {
    items = services[name];
    if (!/^redis/.test(name)) {
      continue;
    }
    if (items && items.length) {
      redisPort = items[0].credentials.port;
      redisHost = items[0].credentials.hostname;
      redisPass = items[0].credentials.password;
    }
  }
  db = require('redis').createClient(redisPort, redisHost);
  if (redisPass) {
    db.auth(redisPass);
  }
  db.on("error", function(err) {
    if (db.DB) {
      return;
    }
    db.DB = {};
    db.rpush = function(key, val, cb) {
      var _base, _ref2;
      ((_ref2 = (_base = db.DB)[key]) != null ? _ref2 : _base[key] = []).push(val);
      return typeof cb === "function" ? cb() : void 0;
    };
    db.lrange = function(key, from, to, cb) {
      var _base, _ref2;
      return typeof cb === "function" ? cb(null, (_ref2 = (_base = db.DB)[key]) != null ? _ref2 : _base[key] = []) : void 0;
    };
    db.hset = function(key, idx, val) {
      var _base, _ref2;
      ((_ref2 = (_base = db.DB)[key]) != null ? _ref2 : _base[key] = [])[idx] = val;
      return typeof cb === "function" ? cb() : void 0;
    };
    return db.hgetall = function(key, cb) {
      var _base, _ref2;
      return typeof cb === "function" ? cb(null, (_ref2 = (_base = db.DB)[key]) != null ? _ref2 : _base[key] = {}) : void 0;
    };
  });
  require('zappa')(port, host, {
    db: db
  }, function() {
    enable('serve jquery');
    app.use(express.static(__dirname));
    def({
      db: db
    });
    get({
      '/': function() {
        response.contentType('text/html');
        return response.sendfile('index.mt');
      }
    });
    get({
      '/edit': function() {
        response.contentType('text/html');
        return response.sendfile('index.mt');
      }
    });
    get({
      '/start': function() {
        return render('start');
      }
    });
    get({
      '/new': function() {
        return response.redirect(require("uuid-pure").newId(10));
      }
    });
    view({
      room: function() {
        return coffeescript(function() {
          return window.location = '/#' + window.location.pathname.replace(/.*\//, '');
        });
      }
    });
    view({
      start: function() {
        div({
          id: "topnav_wrap"
        }, function() {
          return div({
            id: "navigation"
          });
        });
        return div({
          id: "intro-left"
        }, function() {
          h1("MeetingCalc");
          h2("MeetingCalc is a web spreadsheet.");
          p("Your data is saved on the web, and people can edit the same document at the same time. Everybody's changes are instantly reflected on all screens.");
          p("Work together on inventories, survey forms, list managements, brainstorming sessions and more!");
          return div({
            id: "intro-links"
          }, function() {
            return a({
              id: "newpadbutton",
              href: "/new"
            }, function() {
              span("Create new pad");
              return small("No sign-up, start editing instantly");
            });
          });
        });
      }
    });
    view({
      layout: function() {
        return html(function() {
          head(function() {
            title("MeetingCalc");
            return link({
              href: "/start.css",
              rel: "stylesheet",
              type: "text/css"
            });
          });
          return body({
            id: "framedpagebody",
            "class": "home"
          }, function() {
            return div({
              id: "top"
            }, function() {
              return this.body;
            });
          });
        });
      }
    });
    at({
      broadcast: function() {
        var emit;
        emit = function(msg) {
          return io.sockets.emit('broadcast', msg);
        };
        switch (this.type) {
          case 'chat':
            db.rpush("chat-" + this.room, this.msg, __bind(function() {
              return emit(this);
            }, this));
            return;
          case 'ask.ecells':
            db.hgetall("ecell-" + this.room, __bind(function(err, values) {
              return emit({
                type: 'ecells',
                ecells: values,
                room: this.room
              });
            }, this));
            return;
          case 'my.ecell':
            db.hset("ecell-" + this.room, this.user, this.ecell);
            return;
          case 'execute':
            db.rpush("log-" + this.room, this.cmdstr, __bind(function() {
              return emit(this);
            }, this));
            return;
          case 'ask.snapshot':
            db.lrange("log-" + this.room, 0, -1, __bind(function(err, log) {
              return db.lrange("chat-" + this.room, 0, -1, __bind(function(err, chat) {
                return emit({
                  type: 'log',
                  to: this.user,
                  room: this.room,
                  log: log,
                  chat: chat
                });
              }, this));
            }, this));
            return;
        }
        return emit(this);
      }
    });
    client({
      '/player.js': function() {
        if (typeof SocialCalc === "undefined" || SocialCalc === null) {
          SocialCalc = {};
        }
        SocialCalc._username = Math.random().toString();
        SocialCalc.isConnected = true;
        SocialCalc.hadSnapshot = false;
        SocialCalc._room = window.location.hash.replace('#', '');
        if (!SocialCalc._room) {
          window.location = '/start';
          return;
        }
        connect();
        SocialCalc.Callbacks.broadcast = function(type, data) {
          if (data == null) {
            data = {};
          }
          if (!SocialCalc.isConnected) {
            return;
          }
          data.user = SocialCalc._username;
          data.room = SocialCalc._room;
          data.type = type;
          return emit('broadcast', data);
        };
        SocialCalc.isConnected = true;
        SocialCalc.Callbacks.broadcast("ask.snapshot");
        return at({
          broadcast: function() {
            var cell, cmdstr, cr, ecell, editor, find, origCR, origCell, parts, peerClass, spreadsheet, user, _ref2;
            if (!(typeof SocialCalc !== "undefined" && SocialCalc !== null ? SocialCalc.isConnected : void 0)) {
              return;
            }
            if (this.user === SocialCalc._username) {
              return;
            }
            if (this.to && this.to !== SocialCalc._username) {
              return;
            }
            if (this.room && this.room !== SocialCalc._room) {
              return;
            }
            editor = SocialCalc.CurrentSpreadsheetControlObject.editor;
            switch (this.type) {
              case "chat":
                return window.addmsg(this.msg);
              case "ecells":
                _ref2 = this.ecells;
                for (user in _ref2) {
                  ecell = _ref2[user];
                  if (user === SocialCalc._username) {
                    continue;
                  }
                  peerClass = " " + user + " defaultPeer";
                  find = new RegExp(peerClass, "g");
                  cr = SocialCalc.coordToCr(ecell);
                  cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
                  if (cell.element.className.search(find) === -1) {
                    cell.element.className += peerClass;
                  }
                }
                break;
              case "ecell":
                peerClass = " " + this.user + " defaultPeer";
                find = new RegExp(peerClass, "g");
                if (this.original) {
                  origCR = SocialCalc.coordToCr(this.original);
                  origCell = SocialCalc.GetEditorCellElement(editor, origCR.row, origCR.col);
                  origCell.element.className = origCell.element.className.replace(find, "");
                }
                cr = SocialCalc.coordToCr(this.ecell);
                cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
                if (cell.element.className.search(find) === -1) {
                  return cell.element.className += peerClass;
                }
                break;
              case "ask.snapshot":
                return SocialCalc.Callbacks.broadcast("snapshot", {
                  to: this.user,
                  snapshot: SocialCalc.CurrentSpreadsheetControlObject.CreateSpreadsheetSave()
                });
              case "ask.ecell":
                SocialCalc.Callbacks.broadcast("ecell", {
                  to: this.user,
                  ecell: editor.ecell.coord
                });
                break;
              case "log":
                if (SocialCalc.hadSnapshot) {
                  break;
                }
                SocialCalc.hadSnapshot = true;
                spreadsheet = SocialCalc.CurrentSpreadsheetControlObject;
                window.addmsg(this.chat.join("\n"), true);
                cmdstr = this.log.join("\n");
                SocialCalc.CurrentSpreadsheetControlObject.context.sheetobj.ScheduleSheetCommands(cmdstr, false, true);
                return editor = SocialCalc.CurrentSpreadsheetControlObject.editor;
              case "snapshot":
                if (SocialCalc.hadSnapshot) {
                  break;
                }
                SocialCalc.hadSnapshot = true;
                spreadsheet = SocialCalc.CurrentSpreadsheetControlObject;
                parts = spreadsheet.DecodeSpreadsheetSave(this.snapshot);
                if (parts) {
                  if (parts.sheet) {
                    spreadsheet.sheet.ResetSheet();
                    spreadsheet.ParseSheetSave(this.snapshot.substring(parts.sheet.start, parts.sheet.end));
                  }
                  if (parts.edit) {
                    spreadsheet.editor.LoadEditorSettings(this.snapshot.substring(parts.edit.start, parts.edit.end));
                  }
                }
                if (spreadsheet.editor.context.sheetobj.attribs.recalc === "off") {
                  spreadsheet.ExecuteCommand("redisplay", "");
                  spreadsheet.ExecuteCommand("set sheet defaulttextvalueformat text-wiki");
                } else {
                  spreadsheet.ExecuteCommand("recalc", "");
                  spreadsheet.ExecuteCommand("set sheet defaulttextvalueformat text-wiki");
                }
                break;
              case "execute":
                SocialCalc.CurrentSpreadsheetControlObject.context.sheetobj.ScheduleSheetCommands(this.cmdstr, this.saveundo, true);
                break;
            }
          }
        });
      }
    });
    return get({
      '/:room': function() {
        this.layout = false;
        return render('room', this);
      }
    });
  });
}).call(this);
