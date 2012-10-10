/*
CC0 1.0 Universal

To the extent possible under law, 唐鳳 has waived all copyright and
related or neighboring rights to EtherCalc.

This work is published from Taiwan.

<http://creativecommons.org/publicdomain/zero/1.0>
*/
(function(){
  var argv, json, port, host, key, basepath, replace$ = ''.replace;
  argv = (function(){
    try {
      return require('optimist').argv;
    } catch (e$) {}
  }());
  json = (function(){
    try {
      return JSON.parse(require('fs').readFileSync('/home/dotcloud/environment.json', 'utf8'));
    } catch (e$) {}
  }());
  port = Number((argv != null ? argv.port : void 8) || (json != null ? json.PORT_NODEJS : void 8) || process.env.PORT || process.env.VCAP_APP_PORT) || 8000;
  host = (argv != null ? argv.host : void 8) || process.env.VCAP_APP_HOST || '0.0.0.0';
  key = (argv != null ? argv.key : void 8) || null;
  basepath = replace$.call((argv != null ? argv.basepath : void 8) || "", /\/$/, '');
  
  keyfile = (argv != null ? argv.keyfile : void 8) || null;
  certfile = (argv != null ? argv.certfile : void 8) || null;
  ssl = (keyfile != null && certfile !=null);
  options =  ssl ? {https: { key: require('fs').readFileSync(keyfile,'utf8'), 
                             cert:require('fs').readFileSync(certfile,'utf8')}} : null;
  transport = (ssl ? "https" : "http");
  console.log("Please connect to: " + transport + "://" + (host === '0.0.0.0' ? require('os').hostname() : host) + ":" + port + "/");
  require('zappajs')(port, host, options, function(){
    this.KEY = key;
    this.BASEPATH = basepath;
    return this.include('main');
  });
}).call(this);
