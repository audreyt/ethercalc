@include = ->
  @enable 'serve jquery'
  @use 'bodyParser', @app.router, @express.static __dirname
  @include 'dotcloud'
  @include 'player'

  DB = @include 'db'
  SC = @include 'sc'

  RealBin = require("path").dirname(require("fs").realpathSync(__filename))
  sendFile = (file) -> ->
    @response.contentType 'text/html'
    @response.sendfile "#{RealBin}/#{file}"

  KEY = @KEY
  hmac = if !KEY then (x) -> (x) else (x) ->
    encoder = require('crypto').createHmac('sha256', KEY)
    encoder.update x.toString()
    encoder.digest('hex')

  @get '/': sendFile "index.html"
  @get '/_new': ->
    room = require("uuid-pure").newId(10, 36).toLowerCase()
    @response.redirect if KEY then "/#{ room }/edit" else "/#{ room }"
  @get '/_start': sendFile "start.html"
  @get '/:room': sendFile "index.html"
  @get '/:room/edit': ->
    room = @params.room
    @response.redirect "/#{ room }?auth=#{ hmac(room) }"
  @get '/_/:room': ->
    SC._get @params.room, null, ({ log, snapshot }) =>
      @response.send '', { 'Content-Type': 'text/plain' }, 404 unless snapshot
      @response.send snapshot, { 'Content-Type': 'text/plain' }, 201

  @put '/_/:room': ->
    buf = ''
    @request.setEncoding('utf8')
    @request.on 'data', (chunk) => buf += chunk
    @request.on 'end', => SC._put @params.room, buf, =>
      @response.send 'OK', { 'Content-Type': 'text/plain' }, 201

  @post '/:room': ->
    {room, snapshot} = @data
    SC._put room, snapshot, =>
      @response.send 'OK', { 'Content-Type': 'text/plain' }, 201

  @on data: ->
    {room, msg, user, ecell, cmdstr, type, auth} = @data
    room = room.replace(/^_+/, '') # preceding underscore is reserved
    reply = (data) => @emit { data }
    broadcast = (data) =>
      @socket.broadcast.to(if @data.to then "user-#{@data.to}" else "log-#{room}").emit 'data', data
    switch type
      when 'chat'
        DB.rpush "chat-#{room}", msg, =>
          broadcast @data
      when 'ask.ecells'
        DB.hgetall "ecell-#{room}", (_, values) =>
          broadcast
            type: 'ecells'
            ecells: values
            room: room
      when 'my.ecell'
        DB.hset "ecell-#{room}", user, ecell
      when 'execute'
        return if KEY and hmac(room) isnt auth
        DB.multi()
          .rpush("log-#{room}", cmdstr)
          .bgsave().exec =>
            SC[room]?.ExecuteCommand cmdstr
            broadcast @data
      when 'ask.log'
        @socket.join("log-#{room}")
        @socket.join("user-#{user}")
        DB.multi()
          .get("snapshot-#{room}")
          .lrange("log-#{room}", 0, -1)
          .lrange("chat-#{room}", 0, -1)
          .exec (_, [snapshot, log, chat]) =>
            SC[room] = SC._init(snapshot, log, DB, room, @io)
            reply { type: 'log', room, log, chat, snapshot }
      when 'ask.recalc'
        @socket.join("recalc.#{room}")
        SC._get room, @io, ({ log, snapshot }) =>
          reply { type: 'recalc', room, log, snapshot }
      when 'stopHuddle'
        return if @KEY and KEY isnt @KEY
        DB.del [
          "log-#{room}"
          "chat-#{room}"
          "ecell-#{room}"
          "snapshot-#{room}"
        ], => delete SC[room]; broadcast @data
      when 'ecell'
        return if KEY and hmac(room) isnt auth
        broadcast @data
      else broadcast @data
    return
