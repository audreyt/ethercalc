@__DB__ = null
@include = ->
    return @__DB__ if @__DB__
    env = process.env
    [redisPort, redisHost, redisPass] = env<[ REDIS_PORT REDIS_HOST REDIS_PASS ]>

    services = JSON.parse do
        process.env.VCAP_SERVICES or '{}'

    for name, items of services
        | /^redis/.test name and items?length
            [redisPort, redisHost, redisPass] = items.0.credentials<[ port hostname password ]>

    redisHost ?= \localhost
    redisPort ?= 6379

    db = require \redis .createClient redisPort, redisHost
    db.auth redisPass if redisPass
    db.on \connect ->
        db.DB = true
        console.log "Connected to Redis Server: #redisHost:#redisPort"
    db.on \error (err) ->
        | db.DB is true => return console.log """
            ==> Lost connection to Redis Server - attempting to reconnect...
        """
        | db.DB => return false
        | otherwise
        console.log err
        console.log "==> Falling back to JSON storage: #{ process.cwd! }/dump.json"

        fs = require \fs
        db.DB = {}
        try
            db.DB = JSON.parse do
                require \fs .readFileSync \dump.json \utf8
            console.log "==> Restored previous session from JSON file"
        Commands =
            bgsave: (cb) ->
                fs.writeFileSync do
                    \dump.json
                    JSON.stringify db.DB
                    \utf8
                cb?!
            get: (key, cb) -> cb?(null, db.DB[key])
            set: (key, val, cb) -> db.DB[key] = val; cb?!
            rpush: (key, val, cb) -> (db.DB[key] ?= []).push val; cb?!
            lrange: (key, from, to, cb) -> cb?(null, db.DB[key] ?= [])
            hset: (key, idx, val) -> (db.DB[key] ?= [])[idx] = val; cb?!
            hgetall: (key, cb) -> cb?(null, db.DB[key] ?= {})
            del: (keys, cb) ->
                if Array.isArray keys   => for key in keys => delete db.DB[key]
                else                    => delete db.DB[keys]
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
