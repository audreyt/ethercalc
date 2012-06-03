@include = ->
  @enable 'serve jquery'
  @use \bodyParser, @app.router, @express.static __dirname
  @include \dotcloud
  @include \player

  DB = @include \db
  SC = @include \sc

  RealBin = require(\path).dirname(require(\fs).realpathSync(__filename))
  sendFile = (file) -> ->
    @response.contentType \text/html
    @response.sendfile "#RealBin/#file"

  KEY = @KEY
  HMAC_CACHE = {}
  hmac = if !KEY then (-> it) else -> HMAC_CACHE[it] ||= (
    encoder = require(\crypto).createHmac(\sha256, KEY)
    encoder.update it.toString!
    encoder.digest \hex
  )

  @get '/': sendFile \index.html
  @get '/_new': ->
    room = require(\uuid-pure).newId(10, 36).toLowerCase!
    @response.redirect if KEY then "/#room/edit" else "/#room"
  @get '/_start': sendFile \start.html
  @get '/:room': if KEY then ->
    return sendFile(\index.html).call(@) if @query.auth?.length
    @response.redirect "/#{ @params.room }?auth=0"
  else sendFile \index.html
  @get '/:room/edit': ->
    room = @params.room
    @response.redirect "/#room?auth=#{ hmac(room) }"
  @get '/:room/view': ->
    room = @params.room
    @response.redirect "/#room?auth=0"

  IO = @io
  @get '/_/:room/cells/:cell': ->
    {snapshot} <~ SC._get(@params.room, IO)
    if snapshot
      @response.send JSON.stringify(
        SC[@params.room].sheet.cells[@params.cell]
      ), { \Content-Type : \application/json }, 200
    else
      @response.send '', { \Content-Type : \text/plain }, 404

  @get '/_/:room/cells': ->
    {snapshot} <~ SC._get(@params.room, IO)
    if snapshot
      @response.send JSON.stringify(
        SC[@params.room].sheet.cells
      ), { \Content-Type : \application/json }, 200
    else
      @response.send '', { \Content-Type : \text/plain }, 404

  @get '/_/:room/html': ->
    {snapshot} <~ SC._get(@params.room, IO)
    if snapshot
      @response.send SC[@params.room]?.CreateSheetHTML!, {
        \Content-Type : 'text/html; charset=UTF-8'
      }, 200
    else
      @response.send '', { \Content-Type : \text/plain }, 404

  @get '/_/:room': ->
    {snapshot} <~ SC._get(@params.room, IO)
    if snapshot
      @response.send snapshot, { \Content-Type : \text/plain }, 200
    else
      @response.send '', { \Content-Type : \text/plain }, 404

  @put '/_/:room': ->
    buf = ''
    @request.setEncoding \utf8
    @request.on \data, (chunk) ~> buf += chunk
    @request.on \end, ~>
      <~ SC._put @params.room, buf
      @response.send \OK, { \Content-Type : \text/plain }, 201

  @post '/_/:room': ->
    {room} = @params
    {command} = @body
    if command
      command = [command] unless Array.isArray(command)
      <~ SC._get(room, IO)
      SC[room]?.ExecuteCommand command.join("\n")
      IO.sockets.in("log-#room").emit 'data', {
        type: \execute
        cmdstr: command.join("\n")
        room
      }
      @response.send JSON.stringify({command}), {
        \Content-Type : \text/plain
      }, 201
    else
      @response.send 'Please send command', {
        \Content-Type : \text/plain
      }, 201

  @post '/:room': ->
    {room, snapshot} = @body
    <~ SC._put room, snapshot
    @response.send \OK, { \Content-Type : \text/plain }, 201

  @on data: ->
    {room, msg, user, ecell, cmdstr, type, auth} = @data
    room .= replace(/^_+/, '') # preceding underscore is reserved
    reply = (data) ~> @emit {data}
    broadcast = (data) ~>
      @socket.broadcast.to(
        if @data.to then "user-#{@data.to}" else "log-#room"
      ).emit \data, data
    switch type
    | \chat
      <~ DB.rpush "chat-#room", msg
      broadcast @data
    | \ask.ecells
      _, values <~ DB.hgetall "ecell-#room"
      broadcast { type: \ecells, ecells: values, room }
    | \my.ecell => DB.hset "ecell-#room", user, ecell
    | \execute
      return if KEY and hmac(room) isnt auth
      <~ DB.multi!
        .rpush("log-#room", cmdstr)
        .rpush("audit-#room", cmdstr)
        .bgsave!.exec
      SC[room]?.ExecuteCommand cmdstr
      broadcast @data
    | \ask.log
      @socket.join("log-#room")
      @socket.join("user-#user")
      _, [snapshot, log, chat] <~ DB.multi!
        .get "snapshot-#room"
        .lrange "log-#room", 0, -1
        .lrange "chat-#room", 0, -1
        .exec
      SC[room] = SC._init(snapshot, log, DB, room, @io)
      reply { type: \log, room, log, chat, snapshot }
    | \ask.recalc
      @socket.join("recalc.#room")
      {log, snapshot} <~ SC._get room, @io
      reply { type: \recalc, room, log, snapshot }
    | \stopHuddle
      return if @KEY and KEY isnt @KEY
      <~ DB.del <[ audit log chat ecell snapshot ]>.map(-> "#it-#room")
      delete SC[room]
      broadcast @data
    | \ecell
      return if KEY and hmac(room) isnt auth
      broadcast @data
    | otherwise => broadcast @data
    return
