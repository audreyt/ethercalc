@__DB__ = null
@include = ->
  return @__DB__ if @__DB__

  env = process.env
  [redisPort, redisHost, redisSockpath, redisPass, redisDb, dataDir] = env<[ REDIS_PORT REDIS_HOST REDIS_SOCKPATH REDIS_PASS REDIS_DB OPENSHIFT_DATA_DIR ]>

  services = JSON.parse do
    process.env.VCAP_SERVICES or '{}'

  for name, items of services
    | /^redis/.test name and items?length
      [redisPort, redisHost, redisPass] = items.0.credentials<[ port hostname password ]>

  redisHost ?= \localhost
  redisPort ?= 6379
  dataDir ?= process.cwd!

  require! \redis
  make-client = (cb) ->
    if redisSockpath
      client = redis.createClient redisSockpath
    else
      client = redis.createClient redisPort, redisHost
    if redisPass
      client.auth redisPass, -> console.log ...arguments
    if redisDb
      client.select redisDb, -> console.log "Selecting Redis database #{redisDb}"
    client.on \connect cb if cb
    return client

  try
    RedisStore = require \zappajs/node_modules/socket.io/lib/stores/redis
    <~ @io.configure
    redis-client = make-client ~>
      redis-pub = make-client!
      redis-sub = make-client!
      store = new RedisStore { redis, redis-pub, redis-sub, redis-client }
      @io.set \store store
      @io.enable 'browser client etag'
      @io.enable 'browser client gzip'
      @io.enable 'browser client minification'
      @io.set 'log level', 5
    redis-client.on \error ->

  db = make-client ~>
    db.DB = true
    if redisSockpath
      console.log "Connected to Redis Server: unix:#redisSockpath"
    else
      console.log "Connected to Redis Server: #redisHost:#redisPort"

  EXPIRE = @EXPIRE
  db.on \error (err) ->
    | db.DB is true => return console.log """
      ==> Lost connection to Redis Server - attempting to reconnect...
    """
    | db.DB => return false
    | otherwise
    console.log err
    console.log "==> Falling back to JSON storage: /var/dump.json"
    if EXPIRE
      console.log "==> The --expire <seconds> option requires a Redis server; stopping!"
      process.exit!

    fs = require \fs
    db.DB = {}
    minimatch = require \minimatch
    try
      db.DB = JSON.parse do
        require \fs .readFileSync "/var/dump.json" \utf8
      console.log "==> Restored previous session from JSON file"
      db.DB = {} if db.DB is true
    Commands =
      bgsave: (cb) ->
        fs.writeFileSync do
          "/var/dump.json"
          JSON.stringify db.DB,,2
          \utf8
        cb?!
      get: (key, cb) -> cb?(null, db.DB[key])
      set: (key, val, cb) -> db.DB[key] = val; cb?!
      exists: (key, cb) -> cb(null, if db.DB.hasOwnProperty(key) then 1 else 0)
      rpush: (key, val, cb) -> (db.DB[key] ?= []).push val; cb?!
      lrange: (key, from, to, cb) -> cb?(null, db.DB[key] ?= [])
      hset: (key, idx, val, cb) -> (db.DB[key] ?= {})[idx] = val; cb?!   # e.g. HSET myhash field1 "Hello"
      hgetall: (key, cb) -> cb?(null, db.DB[key] ?= {})
      hdel: (key, idx) -> delete db.DB[key][idx] if db.DB[key]?; cb?!    # e.g. HDEL myhash field1
      rename: (key, key2, cb) -> db.DB[key2] = delete db.DB[key]; cb?!
      keys: (select, cb) -> cb?(null, Object.keys(db.DB).filter(minimatch.filter(select)))
      del: (keys, cb) ->
        if Array.isArray keys
          for key in keys => delete! db.DB[key]
        else
          delete db.DB[keys]
        cb?!
    db <<<< Commands
    db.multi = (...cmds) ->
      for name of Commands => let name
        cmds[name] = (...args) ->
          @push [name, args]; @
      cmds.results = []
      cmds.exec = !(cb) ->
        | @length
          [cmd, args] = @shift!
          _, result <~! db[cmd](...args)
          @results.push result
          @exec cb
        | otherwise => cb null, @results
      return cmds
  @__DB__ = db
