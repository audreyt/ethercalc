@__DB__ = null
@include = ->
  return @__DB__ if @__DB__
  env = process.env
  [redisPort, redisHost, redisPass] = env<[ REDIS_PORT REDIS_HOST REDIS_PASS ]>

  services = JSON.parse(process.env.VCAP_SERVICES || '{}')
  for name, items of services when /^redis/.test(name) and items?.length
    [redisPort, redisHost, redisPass] = items.0.credentials<[ port hostname password ]>

  redisHost ?= \localhost
  redisPort ?= 6379

  db = require(\redis).createClient(redisPort, redisHost)
  db.auth(redisPass) if redisPass
  db.on \connect, (err) ->
    db.DB = true
    console.log "Connected to Redis Server: #redisHost:#redisPort"
  db.on \error, (err) ->
    if db.DB is true
      console.log "==> Lost connection to Redis Server - attempting to reconnect"
    return if db.DB
    console.log err
    console.log "==> Falling back to JSON storage: #{ process.cwd! }/dump.json"

    fs = require(\fs)
    db.DB = {}
    try
      db.DB = JSON.parse(require(\fs).readFileSync('dump.json', \utf8))
      console.log "==> Restored previous session from JSON file"
    Commands =
      bgsave: (cb) -> fs.writeFileSync('dump.json', JSON.stringify(db.DB), \utf8); cb?(null)
      get: (key, cb) -> cb?(null, db.DB[key])
      set: (key, val, cb) -> db.DB[key] = val; cb?!
      rpush: (key, val, cb) -> (db.DB[key] ?= []).push val; cb?!
      lrange: (key, from, to, cb) -> cb?(null, db.DB[key] ?= [])
      hset: (key, idx, val) -> (db.DB[key] ?= [])[idx] = val; cb?!
      hgetall: (key, cb) -> cb?(null, db.DB[key] ?= {})
      del: (keys, cb) ->
        for key in (if Array.isArray(keys) then keys else [keys])
          delete db.DB[key]
        cb?(null)
    db[name] = [func for name, func of Commands]
    db.multi = (...cmds) ->
      for name of Commands
        do (name) -> cmds[name] = (args) -> @push [name, ...args]; @
      cmds.results = []
      cmds.exec = (cb) ->
        return cb(null, @results) unless @length
        [cmd, ...args] = @shift!
        _, result <~ db[cmd](...args)
        @results.push result
        @exec cb
      return cmds
  @__DB__ = db
