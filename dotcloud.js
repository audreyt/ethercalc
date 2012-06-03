(function(){
  this.include = function(){
    var json, env, __ref, __this = this;
    try {
      this.io.configure(function(){
        return __this.io.set("transports", __this.KEY
          ? ['jsonp-polling']
          : ['websocket', 'flashsocket', 'xhr-polling', 'jsonp-polling']);
      });
      json = require('fs').readFileSync('/home/dotcloud/environment.json', 'utf8');
      env = process.env;
      return __ref = JSON.parse(json), env.REDIS_HOST = __ref.DOTCLOUD_DATA_REDIS_HOST, env.REDIS_PORT = __ref.DOTCLOUD_DATA_REDIS_PORT, env.REDIS_PASS = __ref.DOTCLOUD_DATA_REDIS_PASSWORD, __ref;
    } catch (__e) {}
  };
}).call(this);
