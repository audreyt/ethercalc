/*
CC0 1.0 Universal

To the extent possible under law, 唐鳳 has waived all copyright and
related or neighboring rights to EtherCalc.

This work is published from Taiwan.

<http://creativecommons.org/publicdomain/zero/1.0>
*/

argv = try require \optimist .argv
json = try JSON.parse do
    require \fs .readFileSync \/home/dotcloud/environment.json \utf8
port = Number(argv?port or json?PORT_NODEJS or process.env.PORT or process.env.VCAP_APP_PORT) or 8000
host = argv?host or process.env.VCAP_APP_HOST or \0.0.0.0
key  = argv?key or null
basepath = (argv?basepath or "") - //  /$  //

console.log "Please connect to: http://#{
    if host is \0.0.0.0 then require \os .hostname! else host
}:#port/"

<- (require \zappajs) port, host
@KEY = key
@BASEPATH = basepath
@include \main
