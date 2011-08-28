(function() {
  /*
  CC0 1.0 Universal
  
  To the extent possible under law, 唐鳳 has waived all copyright and
  related or neighboring rights to EtherCalc.
  
  This work is published from Taiwan.
  
  <http://creativecommons.org/publicdomain/zero/1.0>
  */
  var db, host, items, name, port, redisHost, redisPass, redisPort, services, _ref;
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
    return include('main');
  });
}).call(this);
