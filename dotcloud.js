(function(){
  this.include = function(){
    var json, env, ref$, this$ = this;
    try {
      this.io.configure(function(){
        return this$.io.set('transports', this$.KEY
          ? ['jsonp-polling']
          : ['websocket', 'flashsocket', 'xhr-polling', 'jsonp-polling']);
      });
      json = require('fs').readFileSync('/home/dotcloud/environment.json', 'utf8');
      env = process.env;
      return ref$ = JSON.parse(json), env.REDIS_HOST = ref$.DOTCLOUD_DATA_REDIS_HOST, env.REDIS_PORT = ref$.DOTCLOUD_DATA_REDIS_PORT, env.REDIS_PASS = ref$.DOTCLOUD_DATA_REDIS_PASSWORD, ref$;
    } catch (e$) {}
  };
}).call(this);
