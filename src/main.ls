@include = ->
  @use \json, @app.router, @express.static __dirname
  @app.use \/edit @express.static __dirname
  @app.use \/view @express.static __dirname
  @app.use \/app @express.static __dirname

  @include \dotcloud
  @include \player-broadcast
  @include \player-graph
  @include \player

  DB = @include \db
  SC = @include \sc

  KEY = @KEY
  BASEPATH = @BASEPATH
  EXPIRE = @EXPIRE

  HMAC_CACHE = {}
  hmac = if !KEY then -> it else -> HMAC_CACHE[it] ||= do
    encoder = require \crypto .createHmac \sha256 KEY
    encoder.update it.toString!
    encoder.digest \hex

  [   Text,    Html,   Csv,   Json       ] = <[
    text/plain text/html text/csv application/json
  ]>.map (+ "; charset=utf-8")

  dataDir = process.env.OPENSHIFT_DATA_DIR #eddy
  fs = require \fs   #eddy require fs
  const RealBin = require \path .dirname do
    fs .realpathSync __filename


  sendFile = (file) -> ->
    @response.type Html
    @response.sendfile "#RealBin/#file"

  if @CORS
    console.log "Cross-Origin Resource Sharing (CORS) enabled."
    @all \* (req, res, next) ->
      @response.header \Access-Control-Allow-Origin  \*
      @response.header \Access-Control-Allow-Headers 'X-Requested-With,Content-Type,If-Modified-Since'
      @response.header \Access-Control-Allow-Methods 'GET,POST,PUT'
      return res.send(204) if req?method is \OPTIONS
      next!

  new-room = -> require \uuid-pure .newId 10 36 .toLowerCase!

  @get '/': sendFile \index.html
  @get '/favicon.ico': sendFile \favicon.ico  #eddy return browser site icon
  @get '/manifest.appcache': ->
    @response.type \text/cache-manifest
    @response.sendfile "#RealBin/manifest.appcache"
  @get '/_new': ->
    room = new-room!
    @response.redirect if KEY then "#BASEPATH/#room/edit" else "#BASEPATH/#room"
  @get '/_start': sendFile \start.html

  IO = @io
  api = (cb) -> ->
    {snapshot} <~ SC._get @params.room, IO
    if snapshot
      [type, content] = cb.call @params, snapshot
      if type is Csv
        @response.set \Content-Disposition """
          attachment; filename="#{ @params.room }.csv"
        """
      if content instanceof Function
        rv <~ content SC[@params.room]
        @response.type type
        @response.send 200 rv
      else
        @response.type type
        @response.send 200 content
    else
      @response.type Text
      @response.send 404 ''

  ExportCSV = api -> [Csv, (sc, cb) -> sc.exportCSV cb ]
  ExportHTML = api -> [Html, (sc, cb) -> sc.exportHTML cb ]
  @get '/:room.csv': ExportCSV
  @get '/:room.html': ExportHTML

  @get '/_from/:template': ->
    room = new-room!
    template = @params.template
    delete SC[room]
    {snapshot} <~ SC._get template, IO
    <~ SC._put room, snapshot
    @response.redirect if KEY then "#BASEPATH/#room/edit" else "#BASEPATH/#room"

# eddy @get { 
  @get '/:template/form': ->
    template = @params.template
    room = template + \_ + new-room!
    delete SC[room]
    {snapshot} <~ SC._get template, IO
    <~ SC._put room, snapshot
    @response.redirect "#BASEPATH/#room/app" 
  @get '/:template/appeditor': sendFile \panels.html    
  @get '/_timetrigger': -> 
      (, allTimeTriggers) <~ DB.hgetall "cron-list"
      console.log "allTimeTriggers "  {...allTimeTriggers}
      timeNowMins = Math.floor(new Date().getTime() / (1000 * 60))
      nextTriggerTime = 2147483647   # set to max seconds possible (31^2)      
      for cellID, timeList of allTimeTriggers
        timeList = for triggerTimeMins in timeList.split(',')
          if triggerTimeMins <= timeNowMins
            [room, cell] = cellID.split('!')        
            console.log "cellID #cellID triggerTimeMins #triggerTimeMins" 
            do
              {snapshot} <~ SC._get room, IO
              SC[room].triggerActionCell cell, ->                
            continue
          else
            if nextTriggerTime > triggerTimeMins 
              nextTriggerTime = triggerTimeMins
            triggerTimeMins
        #console.log "timeList #timeList"
        if timeList.length == 0 
          DB.hdel "cron-list", cellID
        else
          DB.hset "cron-list", cellID, timeList.toString()      
      <~ DB.multi!
        .set "cron-nextTriggerTime" nextTriggerTime
        .bgsave!exec!
      fs.writeFileSync do
        "#dataDir/nextTriggerTime.txt"
        nextTriggerTime
        \utf8                       
      console.log "--- cron email sent ---"
      @response.type Json
      @response.send allTimeTriggers
# } eddy 

  @get '/:room':
    if KEY then ->
      | @query.auth?length  => sendFile \index.html .call @
      | otherwise       => @response.redirect "#BASEPATH/#{ @params.room }?auth=0"
    else sendFile \index.html
  @get '/:room/edit': ->
    room = @params.room
    @response.redirect "#BASEPATH/#room?auth=#{ hmac room }"
  @get '/:room/view': ->
    room = @params.room
    #@response.redirect "#BASEPATH/#room?auth=0"
    @response.redirect "#BASEPATH/#room?auth=#{ hmac room }&view=1"
  @get '/:room/app': ->
    room = @params.room
    @response.redirect "#BASEPATH/#room?auth=#{ hmac room }&app=1"
  @get '/_/:room/cells/:cell': api -> [Json
    (sc, cb) ~> sc.exportCell @cell, cb
  ]
  @get '/_/:room/cells': api -> [Json
    (sc, cb) -> sc.exportCells cb
  ]
  @get '/_/:room/html': ExportHTML
  @get '/_/:room/csv': ExportCSV
  @get '/_/:room': api -> [Text, it]

  request-to-command = (request, cb) ->
    #console.log "request-to-command"
    if request.is \application/json
      command = request.body?command
      return cb command if command
    buf = ''; request.setEncoding \utf8; request.on \data (chunk) ~> buf += chunk
    <~ request.on \end
    return cb buf unless request.is \text/csv
    save <~ SC.csv-to-save buf
    save.=replace /\\/g "\\b" if ~save.index-of "\\"
    save.=replace /:/g  "\\c" if ~save.index-of ":"
    save.=replace /\n/g "\\n" if ~save.index-of "\n"
    cb "loadclipboard #save"

  request-to-save = (request, cb) ->
    #console.log "request-to-save"
    if request.is \application/json
      snapshot = request.body?snapshot
      return cb snapshot if snapshot
    buf = ''; request.setEncoding \utf8; request.on \data (chunk) ~> buf += chunk
    <~ request.on \end
    return cb buf unless request.is \text/csv
    save <~ SC.csv-to-save buf
    cb """socialcalc:version:1.0\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n# SocialCalc Spreadsheet Control Save\nversion:1.0\npart:sheet\npart:edit\npart:audit\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n#save\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n--SocialCalcSpreadsheetControlSave--\n"""

  @put '/_/:room': ->
    #console.log "put /_/:room"
    @response.type Text
    {room} = @params
    snapshot <~ request-to-save @request
    SC[room]?terminate!
    delete SC[room]
    <~ SC._put room, snapshot
    <~ DB.del "log-#room"
    IO.sockets.in "log-#room" .emit \data { snapshot, type: \snapshot }
    @response.send 201 \OK

  @post '/_/:room': ->
    #console.log "post /_/:room"
    {room} = @params
    return if room is \Kaohsiung-explode-20140801
    command <~ request-to-command @request
    unless command
      @response.type Text
      return @response.send 400 'Please send command'
    {log, snapshot} <~ SC._get room, IO
    if command is /^loadclipboard\s*/
      row = 1
      if snapshot is /\nsheet:c:\d+:r:(\d+):/
        row += Number(RegExp.$1)
      if parseInt(@query.row)
        row = parseInt(@query.row)
        command := [command, "insertrow A#row", "paste A#row all"]
      else
        command := [command, "paste A#row all"]
    command := [command] unless Array.isArray command
    cmdstr = command * \\n
    <~ DB.multi!
      .rpush "log-#room" cmdstr
      .rpush "audit-#room" cmdstr
      .bgsave!.exec!
    SC[room]?ExecuteCommand cmdstr
    IO.sockets.in "log-#room" .emit \data { cmdstr, room, type: \execute }
    @response.json 202 {command}

  @post '/_': ->
    #console.log "post /_/:room"
    snapshot <~ request-to-save @request
    room = @body?room || new-room!
    <~ SC._put room, snapshot
    @response.type Text
    @response.location "/_/#room"
    @response.send 201 "/#room"

  @on disconnect: !->
    console.log "on disconnect"
    { id } = @socket
    if IO.sockets.manager?roomClients?
      # socket.io 0.9.x
      :CleanRoomLegacy for key of IO.sockets.manager.roomClients[id] when key is // ^/log- //
        for client in IO.sockets.clients(key.substr(1))
        | client.id isnt id => continue CleanRoomLegacy
        room = key.substr(5)
        SC[room]?terminate!
        delete SC[room]
      return
    :CleanRoom for key, val of IO.sockets.adapter.rooms when key is // ^log- //
      for client, isConnected of val | isConnected and client isnt id
        continue CleanRoom
      room = key.substr(4)
      SC[room]?terminate!
      delete SC[room]

  @on data: !->
    {room, msg, user, ecell, cmdstr, type, auth} = @data
    # eddy
    console.log "on data: " {...@data} 
    room = "#room" - /^_+/ # preceding underscore is reserved
    DB.expire "snapshot-#room", EXPIRE if EXPIRE
    reply = (data) ~> @emit {data}
    broadcast = (data) ~>
      @socket.broadcast.to do
        if @data.to then "user-#{@data.to}" else "log-#{data.room}"
      .emit \data data
      if data.include_self? == true then @emit \data data   #message from server, so send to self as well
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
      return if cmdstr is /^set sheet defaulttextvalueformat text-wiki\s*$/
      console.log "execute:"+1
      <~ DB.multi!
        .rpush "log-#room" cmdstr
        .rpush "audit-#room" cmdstr
        .bgsave!.exec!
      console.log "execute:"+2
      commandParameters = cmdstr.split("\r")       
      unless SC[room]?
        console.log "SC[#room] went away. Reloading..."
        _, [snapshot, log] <~ DB.multi!get("snapshot-#room").lrange("log-#room", 0, -1).exec
        SC[room] = SC._init snapshot, log, DB, room, @io
      # eddy @on data {
      if commandParameters[0].trim() is \submitform
        console.log "test SC[#{room}] submitform..."      
        unless SC["aubzu1ovmu_formdata"]?
          console.log "Submitform. loading... SC[aubzu1ovmu_formdata]"
          _, [snapshot, log] <~ DB.multi!get("snapshot-aubzu1ovmu_formdata").lrange("log-aubzu1ovmu_formdata", 0, -1).exec
          SC["aubzu1ovmu_formdata"] = SC._init snapshot, log, DB, "aubzu1ovmu_formdata", @io   
        # add form values to last row of formdata sheet
        attribs <-! SC["aubzu1ovmu_formdata"]?exportAttribs
        console.log "sheet attribs:" { ...attribs }       
        formrow = for let datavalue, formDataIndex in commandParameters when formDataIndex != 0
          "set #{String.fromCharCode(64 + formDataIndex)+(attribs.lastrow+1)} text t #datavalue" 
          #SocialCalc.crToCoord(formDataIndex, attribs.lastrow+1)}                   
        #cmdstrformdata = "set A3 text t abc"   
        cmdstrformdata = formrow.join("\n")
        console.log "cmdstrformdata:"+cmdstrformdata        
        <~ DB.multi!
          .rpush "log-aubzu1ovmu_formdata" cmdstrformdata
          .rpush "audit-aubzu1ovmu_formdata" cmdstrformdata
          .bgsave!.exec!
        SC["aubzu1ovmu_formdata"]?ExecuteCommand cmdstrformdata
        broadcast { room:"aubzu1ovmu_formdata", user, type, auth, cmdstr: cmdstrformdata, +include_self }
      console.log "execute:"+6        
      # }eddy @on data 
      SC[room]?ExecuteCommand cmdstr
      broadcast @data
    | \ask.log
      # eddy @on data {
      #ignore requests for log if startup up database
      if typeof DB.DB == 'undefined'
        console.log "ignore connection request, no database yet!"      
        reply { type: \ignore }
        return
      # } eddy @on data         
      console.log "join [log-#{room}] [user-#user]"
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
      SC[room]?terminate!
      delete SC[room]
      {log, snapshot} <~ SC._get room, @io
      reply { type: \recalc, room, log, snapshot }
    | \stopHuddle
      return if @KEY and KEY isnt @KEY
      <~ DB.del <[ audit log chat ecell snapshot ]>.map -> "#it-#room"
      SC[room]?terminate!
      delete SC[room]
      broadcast @data
    | \ecell
      return if auth is \0 or KEY and auth isnt hmac room
      broadcast @data
    | otherwise
      broadcast @data
