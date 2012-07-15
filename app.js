/*
CC0 1.0 Universal

To the extent possible under law, 唐鳳 has waived all copyright and
related or neighboring rights to EtherCalc.

This work is published from Taiwan.

<http://creativecommons.org/publicdomain/zero/1.0>
*/
(function(){
  var argv, json, port, host, key, basepath, __replace = ''.replace;
  argv = (function(){
    try {
      return require('optimist').argv;
    } catch (__e) {}
  }());
  json = (function(){
    try {
      return JSON.parse(require('fs').readFileSync('/home/dotcloud/environment.json', 'utf8'));
    } catch (__e) {}
  }());
  port = Number((argv != null ? argv.port : void 8) || (json != null ? json.PORT_NODEJS : void 8) || process.env.PORT || process.env.VCAP_APP_PORT) || 8000;
  host = (argv != null ? argv.host : void 8) || process.env.VCAP_APP_HOST || '0.0.0.0';
  key = (argv != null ? argv.key : void 8) || null;
  basepath = __replace.call((argv != null ? argv.basepath : void 8) || "", /\/$/, '');
  console.log("Please connect to: http://" + (host === '0.0.0.0' ? require('os').hostname() : host) + ":" + port + "/");
  require('zappajs')(port, host, function(){
    this.KEY = key;
    this.BASEPATH = basepath;
    return this.include('main');
  });
}).call(this);
