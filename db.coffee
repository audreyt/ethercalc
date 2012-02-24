@include = ->
  env = process.env
  [redisPort, redisHost, redisPass] = [env.REDIS_PORT, env.REDIS_HOST, env.REDIS_PASS]

  services = JSON.parse(process.env.VCAP_SERVICES || "{}")
  for name, items of services
    continue unless /^redis/.test(name)
    if items && items.length
      redisPort = items[0].credentials.port
      redisHost = items[0].credentials.hostname
      redisPass = items[0].credentials.password

  redisHost ?= 'localhost'
  redisPort ?= 6379

  db = require('redis').createClient(redisPort, redisHost)
  db.auth(redisPass) if redisPass
  db.on "connect", (err) ->
    db.DB = true
    console.log "Connected to Redis Server: #{redisHost}:#{redisPort}"
  db.on "error", (err) ->
    if db.DB is true
      console.log "Lost connection to Redis Server - attempting to reconnect"
    return if db.DB
    console.log err
    console.log "Falling back to in-memory DB"
    db.DB = {}
    db.bgsave = (cb) -> cb?(null)
    db.get = (key, cb) -> cb?(null, db.DB[key])
    db.set = (key, val, cb) -> db.DB[key] = val; cb?()
    db.rpush = (key, val, cb) -> (db.DB[key] ?= []).push val; cb?()
    db.lrange = (key, from, to, cb) -> cb?(null, db.DB[key] ?= [])
    db.hset = (key, idx, val) -> (db.DB[key] ?= [])[idx] = val; cb?()
    db.hgetall = (key, cb) -> cb?(null, db.DB[key] ?= {})
    db.del = (key, cb) -> delete db.DB[key]; cb?(null)
  return db
