###
CC0 1.0 Universal

To the extent possible under law, 唐鳳 has waived all copyright and
related or neighboring rights to EtherCalc.

This work is published from Taiwan.

<http://creativecommons.org/publicdomain/zero/1.0>
###

argv = try require('optimist').argv
json = try JSON.parse(require('fs').readFileSync('/home/dotcloud/environment.json', 'utf8'))
port = Number(argv?.port || json?.PORT_NODEJS || process.env.PORT || process.env.VCAP_APP_PORT) || 8000
host = argv?.host || process.env.VCAP_APP_HOST || '0.0.0.0'
key = argv?.key || null

basepath = argv?.basepath || ""
if basepath.substr(-1) == "/" then basepath = basepath.substr(0, basepath.length-1)

url = if basepath then "#{basepath}/" else "http://#{if host is '0.0.0.0' then require('os').hostname() else host}:#{port}/"
console.log "Please connect to: #{url}"
require('zappa') port, host, ->
  @KEY = key
  @BASEPATH = basepath
  @include 'main'
