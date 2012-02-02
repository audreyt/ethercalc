/*
CC0 1.0 Universal

To the extent possible under law, 唐鳳 has waived all copyright and
related or neighboring rights to EtherCalc.

This work is published from Taiwan.

<http://creativecommons.org/publicdomain/zero/1.0>
*/

(function() {
  var argv, host, json, port;

  argv = require('optimist').argv;

  json = (function() {
    try {
      return JSON.parse(require('fs').readFileSync('/home/dotcloud/environment.json', 'utf8'));
    } catch (_error) {}
  })();

  port = Number(argv.port || (json != null ? json.PORT_NODEJS : void 0) || process.env.PORT || process.env.VCAP_APP_PORT || 8000);

  host = argv.host || process.env.VCAP_APP_HOST || '0.0.0.0';

  require('zappa')(port, host, function() {
    return this.include('main');
  });

}).call(this);
