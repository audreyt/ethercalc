@include = ->
    @use \bodyParser, @app.router, @express.static __dirname

    @include \dotcloud
    @include \player-broadcast
    @include \player-graph
    @include \player

    DB = @include \db
    SC = @include \sc

    KEY = @KEY
    BASEPATH = @BASEPATH
    HMAC_CACHE = {}
    hmac = if !KEY then -> it else -> HMAC_CACHE[it] ||= do
        encoder = require \crypto .createHmac \sha256 KEY
        encoder.update it.toString!
        encoder.digest \hex

    RealBin = require \path .dirname do
        require \fs .realpathSync __filename
    sendFile = (file) -> ->
        @response.contentType \text/html
        @response.sendfile "#RealBin/#file"

    @get '/': sendFile \index.html
    @get '/_new': ->
        room = require \uuid-pure .newId 10 36 .toLowerCase!
        @response.redirect if KEY then "#BASEPATH/#room/edit" else "#BASEPATH/#room"
    @get '/_start': sendFile \start.html
    @get '/:room':
        if KEY then ->
            | @query.auth?length    => sendFile \index.html .call @
            | otherwise             => @response.redirect "#BASEPATH/#{ @params.room }?auth=0"
        else sendFile \index.html
    @get '/:room/edit': ->
        room = @params.room
        @response.redirect "#BASEPATH/#room?auth=#{ hmac room }"
    @get '/:room/view': ->
        room = @params.room
        @response.redirect "#BASEPATH/#room?auth=0"

    IO = @io
    TextType = { \Content-Type : 'text/plain; charset=utf-8' }
    JsonType = { \Content-Type : 'application/json; charset=utf-8' }
    HtmlType = { \Content-Type : 'text/html; charset=utf-8' }
    api = (cb) -> ->
        {snapshot} <~ SC._get @params.room, IO
        if snapshot
            [type, content] = cb.call @params, snapshot
            @response.send content, type, 200
        else @response.send '', TextType, 404

    @get '/_/:room/cells/:cell': api -> [JsonType
        JSON.stringify SC[@room].sheet.cells[@cell]
    ]
    @get '/_/:room/cells': api -> [JsonType
        JSON.stringify SC[@room].sheet.cells
    ]
    @get '/_/:room/html': api -> [HtmlType
        SC[@room]?CreateSheetHTML!
    ]
    @get '/_/:room': api -> [TextType, it]

    @put '/_/:room': ->
        buf = ''
        @request.setEncoding \utf8
        @request.on \data (chunk) ~> buf += chunk
        @request.on \end ~>
            <~ SC._put @params.room, buf
            @response.send \OK, TextType, 201

    @post '/_/:room': ->
        {room} = @params
        {command} = @body
        unless command
            return @response.send 'Please send command', TextType, 400
        command = [command] unless Array.isArray command
        <~ SC._get room, IO
        SC[room]?ExecuteCommand command * \\n
        IO.sockets.in "log-#room" .emit \data {
            type: \execute
            cmdstr: command * \\n
            room
        }
        @response.send do
            JSON.stringify {command}
            JsonType
            202

    @post '/:room': ->
        {room, snapshot} = @body
        <~ SC._put room, snapshot
        @response.send \OK, TextType, 201

    @on data: !->
        {room, msg, user, ecell, cmdstr, type, auth} = @data
        room = "#room" - /^_+/ # preceding underscore is reserved
        reply = (data) ~> @emit {data}
        broadcast = (data) ~>
            @socket.broadcast.to do
                if @data.to then "user-#{@data.to}" else "log-#room"
            .emit \data data
        switch type
        | \chat
            <~ DB.rpush "chat-#room" msg
            broadcast @data
        | \ask.ecells
            _, values <~ DB.hgetall "ecell-#room"
            broadcast { type: \ecells, ecells: values, room }
        | \my.ecell
            DB.hset "ecell-#room", user, ecell
        | \execute
            return if auth is \0 or KEY and hmac(room) isnt auth
            <~ DB.multi!
                .rpush "log-#room" cmdstr
                .rpush "audit-#room" cmdstr
                .bgsave!.exec!
            SC[room]?ExecuteCommand cmdstr
            broadcast @data
        | \ask.log
            @socket.join "log-#room"
            @socket.join "user-#user"
            _, [snapshot, log, chat] <~ DB.multi!
                .get "snapshot-#room"
                .lrange "log-#room" 0 -1
                .lrange "chat-#room" 0 -1
                .exec!
            SC[room] = SC._init snapshot, log, DB, room, @io
            reply { type: \log, room, log, chat, snapshot }
        | \ask.recalc
            @socket.join "recalc.#room"
            {log, snapshot} <~ SC._get room, @io
            reply { type: \recalc, room, log, snapshot }
        | \stopHuddle
            return if @KEY and KEY isnt @KEY
            <~ DB.del <[ audit log chat ecell snapshot ]>.map -> "#it-#room"
            delete SC[room]
            broadcast @data
        | \ecell
            return if auth is \0 or KEY and auth isnt hmac room
            broadcast @data
        | otherwise
            broadcast @data
