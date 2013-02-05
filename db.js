(function(){
  var slice$ = [].slice;
  this.__DB__ = null;
  this.include = function(){
    var env, ref$, redisPort, redisHost, redisPass, dataDir, services, name, items, ref1$, redis, makeClient, db, this$ = this;
    if (this.__DB__) {
      return this.__DB__;
    }
    env = process.env;
    ref$ = [env['REDIS_PORT'], env['REDIS_HOST'], env['REDIS_PASS'], env['OPENSHIFT_DATA_DIR']], redisPort = ref$[0], redisHost = ref$[1], redisPass = ref$[2], dataDir = ref$[3];
    services = JSON.parse(process.env.VCAP_SERVICES || '{}');
    for (name in services) {
      items = services[name];
      if (/^redis/.test(name) && (items != null && items.length)) {
        ref1$ = [(ref$ = items[0].credentials)['port'], ref$['hostname'], ref$['password']], redisPort = ref1$[0], redisHost = ref1$[1], redisPass = ref1$[2];
      }
    }
    redisHost == null && (redisHost = 'localhost');
    redisPort == null && (redisPort = 6379);
    dataDir == null && (dataDir = process.cwd());
    redis = require('redis');
    makeClient = function(){
      var client;
      client = redis.createClient(redisPort, redisHost);
      if (redisPass) {
        client.auth(redisPass, function(){
          return console.log.apply(console, arguments);
        });
      }
      return client;
    };
    this.io.configure(function(){
      var RedisStore, redisPub, redisSub, redisClient, store;
      RedisStore = require('zappajs/node_modules/socket.io/lib/stores/redis');
      redisPub = makeClient();
      redisSub = makeClient();
      redisClient = makeClient();
      store = new RedisStore({
        redis: redis,
        redisPub: redisPub,
        redisSub: redisSub,
        redisClient: redisClient
      });
      this$.io.set('store', store);
      this$.io.enable('browser client etag');
      this$.io.enable('browser client gzip');
      this$.io.enable('browser client minification');
      return this$.io.set('log level', 5);
    });
    db = makeClient();
    db.on('connect', function(){
      db.DB = true;
      return console.log("Connected to Redis Server: " + redisHost + ":" + redisPort);
    });
    db.on('error', function(err){
      var fs, Commands;
      switch (false) {
      case db.DB !== true:
        return console.log("==> Lost connection to Redis Server - attempting to reconnect...");
      case !db.DB:
        return false;
      }
      console.log(err);
      console.log("==> Falling back to JSON storage: " + dataDir + "/dump.json");
      fs = require('fs');
      db.DB = {};
      try {
        db.DB = JSON.parse(require('fs').readFileSync(dataDir + "/dump.json", 'utf8'));
        console.log("==> Restored previous session from JSON file");
      } catch (e$) {}
      Commands = {
        bgsave: function(cb){
          fs.writeFileSync(dataDir + "/dump.json", JSON.stringify(db.DB), 'utf8');
          return typeof cb === 'function' ? cb() : void 8;
        },
        get: function(key, cb){
          return typeof cb === 'function' ? cb(null, db.DB[key]) : void 8;
        },
        set: function(key, val, cb){
          db.DB[key] = val;
          return typeof cb === 'function' ? cb() : void 8;
        },
        rpush: function(key, val, cb){
          var ref$, ref1$;
          ((ref1$ = (ref$ = db.DB)[key]) != null
            ? ref1$
            : ref$[key] = []).push(val);
          return typeof cb === 'function' ? cb() : void 8;
        },
        lrange: function(key, from, to, cb){
          var ref$, ref1$;
          return typeof cb === 'function' ? cb(null, (ref1$ = (ref$ = db.DB)[key]) != null
            ? ref1$
            : ref$[key] = []) : void 8;
        },
        hset: function(key, idx, val){
          var ref$, ref1$;
          ((ref1$ = (ref$ = db.DB)[key]) != null
            ? ref1$
            : ref$[key] = [])[idx] = val;
          return typeof cb === 'function' ? cb() : void 8;
        },
        hgetall: function(key, cb){
          var ref$, ref1$;
          return typeof cb === 'function' ? cb(null, (ref1$ = (ref$ = db.DB)[key]) != null
            ? ref1$
            : ref$[key] = {}) : void 8;
        },
        del: function(keys, cb){
          var i$, len$, yet$, key;
          if (Array.isArray(keys)) {
            for (yet$ = true, i$ = 0, len$ = keys.length; i$ < len$; ++i$) {
              key = keys[i$];
              yet$ = false;
              delete db.DB[key];
            } if (yet$) {
              delete db.DB[keys];
            }
          }
          return typeof cb === 'function' ? cb() : void 8;
        }
      };
      importAll$(db, Commands);
      return db.multi = function(){
        var cmds, name;
        cmds = slice$.call(arguments);
        for (name in Commands) {
          (fn$.call(this, name));
        }
        cmds.results = [];
        cmds.exec = function(cb){
          var ref$, cmd, args, this$ = this;
          switch (false) {
          case !this.length:
            ref$ = this.shift(), cmd = ref$[0], args = ref$[1];
            db[cmd].apply(db, slice$.call(args).concat([function(_, result){
              this$.results.push(result);
              this$.exec(cb);
            }]));
            break;
          default:
            cb(null, this.results);
          }
        };
        return cmds;
        function fn$(name){
          cmds[name] = function(){
            var args;
            args = slice$.call(arguments);
            this.push([name, args]);
            return this;
          };
        }
      };
    });
    return this.__DB__ = db;
  };
  function importAll$(obj, src){
    for (var key in src) obj[key] = src[key];
    return obj;
  }
}).call(this);
