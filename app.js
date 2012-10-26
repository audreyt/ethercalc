/*
CC0 1.0 Universal

To the extent possible under law, 唐鳳 has waived all copyright and
related or neighboring rights to EtherCalc.

This work is published from Taiwan.

<http://creativecommons.org/publicdomain/zero/1.0>
*/
(function(){
  var slurp, argv, json, port, host, basepath, keyfile, certfile, key, transport, options, replace$ = ''.replace;
  slurp = function(it){
    return require('fs').readFileSync(it, 'utf8');
  };
  argv = (function(){
    try {
      return require('optimist').argv;
    } catch (e$) {}
  }()) || {};
  json = (function(){
    try {
      return JSON.parse(slurp('/home/dotcloud/environment.json'));
    } catch (e$) {}
  }());
  port = Number(argv.port || (json != null ? json.PORT_NODEJS : void 8) || process.env.PORT || process.env.VCAP_APP_PORT) || 8000;
  host = argv.host || process.env.VCAP_APP_HOST || '0.0.0.0';
  basepath = replace$.call(argv.basepath || "", /\/$/, '');
  keyfile = argv.keyfile, certfile = argv.certfile, key = argv.key;
  transport = 'http';
  if (keyfile != null && certfile != null) {
    options = {
      https: {
        key: slurp(keyfile),
        cert: slurp(certfile)
      }
    };
    transport = 'https';
  }
  console.log("Please connect to: " + transport + "://" + (host === '0.0.0.0' ? require('os').hostname() : host) + ":" + port + "/");
  require('zappajs')(port, host, options, function(){
    this.KEY = key;
    this.BASEPATH = basepath;
    return this.include('main');
  });
}).call(this);
