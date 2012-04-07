DB = null
@include = ->
  return DB if DB
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
      console.log "==> Lost connection to Redis Server - attempting to reconnect"
    return if db.DB
    console.log err
    console.log "==> Falling back to JSON storage: #{ process.cwd() }/dump.json"

    fs = require('fs')
    db.DB = {}
    try
      db.DB = JSON.parse(require('fs').readFileSync('dump.json', 'utf8'))
      console.log "==> Restored previous session from JSON file"
    Commands =
      bgsave: (cb) -> fs.writeFileSync('dump.json', JSON.stringify(db.DB), 'utf8'); cb?(null)
      get: (key, cb) -> cb?(null, db.DB[key])
      set: (key, val, cb) -> db.DB[key] = val; cb?()
      rpush: (key, val, cb) -> (db.DB[key] ?= []).push val; cb?()
      lrange: (key, from, to, cb) -> cb?(null, db.DB[key] ?= [])
      hset: (key, idx, val) -> (db.DB[key] ?= [])[idx] = val; cb?()
      hgetall: (key, cb) -> cb?(null, db.DB[key] ?= {})
      del: (keys, cb) -> delete db.DB[key] for key in (if Array.isArray(keys) then keys else [keys]); cb?(null)
    db[name] = func for name, func of Commands
    db.multi = (cmds...) ->
      for name of Commands
        do (name) -> cmds[name] = (args...) -> @push [name, args...]; @
      cmds.results = []
      cmds.exec = (cb) ->
        return cb(null, @results) unless @length
        [cmd, args...] = @shift()
        db[cmd](args..., (_, result) => @results.push result; @exec(cb))
      return cmds
  DB = db
  return db
