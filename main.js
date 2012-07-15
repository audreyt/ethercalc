(function(){
  var __join = [].join;
  this.include = function(){
    var DB, SC, KEY, BASEPATH, HMAC_CACHE, hmac, RealBin, sendFile, IO, TextType, JsonType, HtmlType, api;
    this.use('bodyParser', this.app.router, this.express['static'](__dirname));
    this.include('dotcloud');
    this.include('player-broadcast');
    this.include('player-graph');
    this.include('player');
    DB = this.include('db');
    SC = this.include('sc');
    KEY = this.KEY;
    BASEPATH = this.BASEPATH;
    HMAC_CACHE = {};
    hmac = !KEY
      ? function(it){
        return it;
      }
      : function(it){
        var encoder;
        return HMAC_CACHE[it] || (HMAC_CACHE[it] = (encoder = require('crypto').createHmac('sha256', KEY), encoder.update(it.toString()), encoder.digest('hex')));
      };
    RealBin = require('path').dirname(require('fs').realpathSync(__filename));
    sendFile = function(file){
      return function(){
        this.response.contentType('text/html');
        return this.response.sendfile(RealBin + "/" + file);
      };
    };
    this.get({
      '/': sendFile('index.html')
    });
    this.get({
      '/_new': function(){
        var room;
        room = require('uuid-pure').newId(10, 36).toLowerCase();
        return this.response.redirect(KEY
          ? BASEPATH + "/" + room + "/edit"
          : BASEPATH + "/" + room);
      }
    });
    this.get({
      '/_start': sendFile('start.html')
    });
    this.get({
      '/:room': KEY
        ? function(){
          var __ref;
          switch (false) {
          case !((__ref = this.query.auth) != null && __ref.length):
            return sendFile('index.html').call(this);
          default:
            return this.response.redirect(BASEPATH + "/" + this.params.room + "?auth=0");
          }
        }
        : sendFile('index.html')
    });
    this.get({
      '/:room/edit': function(){
        var room;
        room = this.params.room;
        return this.response.redirect(BASEPATH + "/" + room + "?auth=" + hmac(room));
      }
    });
    this.get({
      '/:room/view': function(){
        var room;
        room = this.params.room;
        return this.response.redirect(BASEPATH + "/" + room + "?auth=0");
      }
    });
    IO = this.io;
    TextType = {
      'Content-Type': 'text/plain; charset=utf-8'
    };
    JsonType = {
      'Content-Type': 'application/json; charset=utf-8'
    };
    HtmlType = {
      'Content-Type': 'text/html; charset=utf-8'
    };
    api = function(cb){
      return function(){
        var __this = this;
        return SC._get(this.params.room, IO, function(__arg){
          var snapshot, type, content, __ref;
          snapshot = __arg.snapshot;
          if (snapshot) {
            __ref = cb.call(__this.params, snapshot), type = __ref[0], content = __ref[1];
            return __this.response.send(content, type, 200);
          } else {
            return __this.response.send('', TextType, 404);
          }
        });
      };
    };
    this.get({
      '/_/:room/cells/:cell': api(function(){
        return [JsonType, JSON.stringify(SC[this.room].sheet.cells[this.cell])];
      })
    });
    this.get({
      '/_/:room/cells': api(function(){
        return [JsonType, JSON.stringify(SC[this.room].sheet.cells)];
      })
    });
    this.get({
      '/_/:room/html': api(function(){
        var __ref;
        return [HtmlType, (__ref = SC[this.room]) != null ? __ref.CreateSheetHTML() : void 8];
      })
    });
    this.get({
      '/_/:room': api(function(it){
        return [TextType, it];
      })
    });
    this.put({
      '/_/:room': function(){
        var buf, __this = this;
        buf = '';
        this.request.setEncoding('utf8');
        this.request.on('data', function(chunk){
          return buf += chunk;
        });
        return this.request.on('end', function(){
          return SC._put(__this.params.room, buf, function(){
            return __this.response.send('OK', TextType, 201);
          });
        });
      }
    });
    this.post({
      '/_/:room': function(){
        var room, command, __this = this;
        room = this.params.room;
        command = this.body.command;
        if (!command) {
          return this.response.send('Please send command', TextType, 400);
        }
        if (!Array.isArray(command)) {
          command = [command];
        }
        return SC._get(room, IO, function(){
          var __ref;
          if ((__ref = SC[room]) != null) {
            __ref.ExecuteCommand(__join.call(command, '\n'));
          }
          IO.sockets['in']("log-" + room).emit('data', {
            type: 'execute',
            cmdstr: __join.call(command, '\n'),
            room: room
          });
          return __this.response.send(JSON.stringify({
            command: command
          }), JsonType, 202);
        });
      }
    });
    this.post({
      '/:room': function(){
        var room, snapshot, __ref, __this = this;
        __ref = this.body, room = __ref.room, snapshot = __ref.snapshot;
        return SC._put(room, snapshot, function(){
          return __this.response.send('OK', TextType, 201);
        });
      }
    });
    return this.on({
      data: function(){
        var room, msg, user, ecell, cmdstr, type, auth, reply, broadcast, __ref, __this = this;
        __ref = this.data, room = __ref.room, msg = __ref.msg, user = __ref.user, ecell = __ref.ecell, cmdstr = __ref.cmdstr, type = __ref.type, auth = __ref.auth;
        room = (room + "").replace(/^_+/, '');
        reply = function(data){
          return __this.emit({
            data: data
          });
        };
        broadcast = function(data){
          return __this.socket.broadcast.to(__this.data.to
            ? "user-" + __this.data.to
            : "log-" + room).emit('data', data);
        };
        switch (type) {
        case 'chat':
          DB.rpush("chat-" + room, msg, function(){
            return broadcast(__this.data);
          });
          break;
        case 'ask.ecells':
          DB.hgetall("ecell-" + room, function(_, values){
            return broadcast({
              type: 'ecells',
              ecells: values,
              room: room
            });
          });
          break;
        case 'my.ecell':
          DB.hset("ecell-" + room, user, ecell);
          break;
        case 'execute':
          if (auth === '0' || KEY && hmac(room) !== auth) {
            return;
          }
          DB.multi().rpush("log-" + room, cmdstr).rpush("audit-" + room, cmdstr).bgsave().exec(function(){
            var __ref;
            if ((__ref = SC[room]) != null) {
              __ref.ExecuteCommand(cmdstr);
            }
            return broadcast(__this.data);
          });
          break;
        case 'ask.log':
          this.socket.join("log-" + room);
          this.socket.join("user-" + user);
          DB.multi().get("snapshot-" + room).lrange("log-" + room, 0, -1).lrange("chat-" + room, 0, -1).exec(function(_, __arg){
            var snapshot, log, chat;
            snapshot = __arg[0], log = __arg[1], chat = __arg[2];
            SC[room] = SC._init(snapshot, log, DB, room, __this.io);
            return reply({
              type: 'log',
              room: room,
              log: log,
              chat: chat,
              snapshot: snapshot
            });
          });
          break;
        case 'ask.recalc':
          this.socket.join("recalc." + room);
          SC._get(room, this.io, function(__arg){
            var log, snapshot;
            log = __arg.log, snapshot = __arg.snapshot;
            return reply({
              type: 'recalc',
              room: room,
              log: log,
              snapshot: snapshot
            });
          });
          break;
        case 'stopHuddle':
          if (this.KEY && KEY !== this.KEY) {
            return;
          }
          DB.del(['audit', 'log', 'chat', 'ecell', 'snapshot'].map(function(it){
            return it + "-" + room;
          }), function(){
            delete SC[room];
            return broadcast(__this.data);
          });
          break;
        case 'ecell':
          if (auth === '0' || KEY && auth !== hmac(room)) {
            return;
          }
          broadcast(this.data);
          break;
        default:
          broadcast(this.data);
        }
      }
    });
  };
}).call(this);
