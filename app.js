(function() {
  /*
  CC0 1.0 Universal
  
  To the extent possible under law, 唐鳳 has waived all copyright and
  related or neighboring rights to EtherCalc.
  
  This work is published from Taiwan.
  
  <http://creativecommons.org/publicdomain/zero/1.0>
  */
  var host, port;
  port = Number(process.env.PORT || process.env.VCAP_APP_PORT || 8000);
  host = process.env.VCAP_APP_HOST || '0.0.0.0';
  require('zappa')(port, host, function() {
    return include('main');
  });
}).call(this);
