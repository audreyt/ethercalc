###
CC0 1.0 Universal

To the extent possible under law, 唐鳳 has waived all copyright and
related or neighboring rights to EtherCalc.

This work is published from Taiwan.

<http://creativecommons.org/publicdomain/zero/1.0>
###

port = Number(process.env.VCAP_APP_PORT || 8080)
host = process.env.VCAP_APP_HOST || '127.0.0.1'
[redisPort, redisHost, redisPass] = [null, null, null]

services = JSON.parse(process.env.VCAP_SERVICES || "{}")
for name, items of services
  continue unless /^redis/.test(name)
  if items && items.length
    redisPort = items[0].credentials.port
    redisHost = items[0].credentials.hostname
    redisPass = items[0].credentials.password

db = require('redis').createClient(redisPort, redisHost)
db.auth(redisPass) if redisPass
db.on "error", (err) ->
  return if db.DB
  db.DB = {}
  db.rpush = (key, val, cb) -> (db.DB[key] ?= []).push val; cb?()
  db.lrange = (key, from, to, cb) -> cb?(null, db.DB[key] ?= [])
  db.hset = (key, idx, val) -> (db.DB[key] ?= [])[idx] = val; cb?()
  db.hgetall = (key, cb) -> cb?(null, db.DB[key] ?= {})

require('zappa') port, host, {db}, -> include 'main'
