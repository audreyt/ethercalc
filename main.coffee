@include = ->
  @enable 'serve jquery'
  @use 'bodyParser', @app.router, @express.static __dirname
  @include 'dotcloud'
  @include 'player'

  DB = @include 'db'
  SC = @include 'sc'

  RealBin = require("path").dirname(require("fs").realpathSync(__filename))
  static = (file) -> ->
    @response.contentType 'text/html'
    @response.sendfile "#{RealBin}/#{file}"

  @get '/': static "index.html"
  @get '/_new': -> @response.redirect '/' + require("uuid-pure").newId(10, 36).toLowerCase()
  @get '/_start': static "start.html"
  @get '/:room': static "index.html"

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
    {room, msg, user, ecell, cmdstr, type} = @data
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
        DB.del [
          "log-#{room}"
          "chat-#{room}"
          "ecell-#{room}"
          "snapshot-#{room}"
        ], => delete SC[room]; broadcast @data
      else broadcast @data
    return
