/*
CC0 1.0 Universal

To the extent possible under law, 唐鳳 has waived all copyright and
related or neighboring rights to EtherCalc.

This work is published from Taiwan.

<http://creativecommons.org/publicdomain/zero/1.0>
*/

slurp = -> require \fs .readFileSync it, \utf8
argv = (try require \optimist .boolean <[ vm polling cors ]> .argv) || {}
json = try JSON.parse slurp \/home/dotcloud/environment.json
port = Number(argv.port or json?PORT_NODEJS or process.env.PORT or process.env.VCAP_APP_PORT or process.env.OPENSHIFT_NODEJS_PORT) or 8000
host = argv.host or process.env.VCAP_APP_HOST or process.env.OPENSHIFT_NODEJS_IP or \0.0.0.0
basepath = (argv.basepath or "") - //  /$  //

{ keyfile, certfile, key, polling, cors, expire } = argv

transport = \http
if keyfile? and certfile?
  options = https:
    key: slurp keyfile
    cert: slurp certfile
  transport = \https
else options = {}

console.log "Please connect to: #transport://#{
  if host is \0.0.0.0 then require \os .hostname! else host
}:#port/"

options.io = { origin: '*' } if cors

<- (require \zappajs) port, host, options
@KEY = key
@BASEPATH = basepath
@POLLING = polling
@CORS = cors
@EXPIRE = +expire
@EXPIRE = 0 if isNaN @EXPIRE
@include \main
