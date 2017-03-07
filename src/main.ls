@include = ->
  @use \json, @app.router, @express.static __dirname
  @app.use \/edit @express.static __dirname
  @app.use \/view @express.static __dirname
  @app.use \/app @express.static __dirname

  @include \dotcloud
  @include \player-broadcast
  @include \player-graph
  @include \player

  J = require \j
  csv-parse = require \csv-parse

  DB = @include \db
  SC = @include \sc

  KEY = @KEY
  BASEPATH = @BASEPATH
  EXPIRE = @EXPIRE

  HMAC_CACHE = {}
  hmac = if !KEY then -> it else -> HMAC_CACHE[it] ||= do
    encoder = require \crypto .createHmac \sha256 (new Buffer KEY)
    encoder.update it.toString!
    encoder.digest \hex

  [   Text,    Html,   Csv,   Json       ] = <[
    text/plain text/html text/csv application/json
  ]>.map (+ "; charset=utf-8")

  require! <[ fs ]>
  const RealBin = require \path .dirname do
    fs.realpathSync __filename
  const DevMode = fs.existsSync "#RealBin/.git"
  #Time Triggered Email - contains next send time 
  dataDir = process.env.OPENSHIFT_DATA_DIR   
  #dataDir = ".."  
  
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

  new-room = -> "sheet1"

  @get '/': sendFile \index.html
  @get '/etc/*': -> @response.send 404 ''
  @get '/var/*': -> @response.send 404 ''
  #@get '/favicon.ico': -> @response.send 404 ''
  #return site icons
  @get '/favicon.ico': sendFile \favicon.ico
  @get '/android-chrome-192x192.png': sendFile \android-chrome-192x192.png
  @get '/apple-touch-icon.png': sendFile \apple-touch-icon.png
  @get '/browserconfig.xml': sendFile \browserconfig.xml
  @get '/favicon-16x16.png': sendFile \favicon-16x16.png
  @get '/favicon-32x32.png': sendFile \favicon-32x32.png
  @get '/favicon-32x32.png': sendFile \favicon-32x32.png
  @get '/mstile-150x150.png': sendFile \mstile-150x150.png
  @get '/mstile-310x310.png': sendFile \mstile-310x310.png
  @get '/safari-pinned-tab.svg': sendFile \safari-pinned-tab.svg
  @get '/manifest.appcache': ->
    # Sandstorm: Skip manifest appcache
    @response.type \text/cache-manifest
    @response.send 200 "CACHE MANIFEST\n\n##{Date!}\n\nNETWORK:\n*\n"
  @get '/static/socialcalc.js': ->
    @response.type \application/javascript
    @response.sendfile "#RealBin/node_modules/socialcalc/SocialCalc.js"
  @get '/static/form:part.js': ->
    part = @params.part
    @response.type \application/javascript
    @response.sendfile "#RealBin/form#part.js"
  @get '/=_new': ->
    room = new-room!
    @response.redirect if KEY then "#BASEPATH/=#room/edit" else "#BASEPATH/=#room"
  @get '/_new': ->
    room = new-room!
    @response.redirect if KEY then "#BASEPATH/#room/edit" else "#BASEPATH/#room"
  @get '/_start': sendFile \start.html

  IO = @io
  api = (cb, cb-multiple) -> ->
    room = encodeURIComponent(@params.room).replace(/%3A/g \:)
    if room is /^%3D/ and cb-multiple
      room.=slice 3
      {snapshot} <~ SC._get room, IO
      unless snapshot
        _, default-snapshot <~ DB.get "snapshot-#{room}1"
        unless default-snapshot
          @response.type Text
          @response.send 404 ''
          return
        [type, content] = cb-multiple.call @params, <[ Sheet1 ]>, [ default-snapshot ]
        @response.type type
        @response.set \Content-Disposition """
          attachment; filename="#room.xlsx"
        """
        @response.send 200 content
        return
      csv <~ SC[room].exportCSV
      _, body <~ csv-parse(csv, delimiter: \,)
      body.shift! # header
      todo = DB.multi!
      names = []
      for [link, title], idx in body | link and title and link is /^\//
        names ++= title
        todo.=get "snapshot-#{ link.slice(1) }"
      _, saves <~ todo.exec!
      [type, content] = cb-multiple.call @params, names, saves
      @response.type type
      @response.set \Content-Disposition """
        attachment; filename="#room.xlsx"
      """
      @response.send 200 content
    else
      {snapshot} <~ SC._get room, IO
      if snapshot
        [type, content] = cb.call @params, snapshot
        if type is Csv
          @response.set \Content-Disposition """
            attachment; filename="#{ @params.room }.csv"
          """
        if content instanceof Function
          rv <~ content SC[room]
          @response.type type
          @response.send 200 rv
        else
          @response.type type
          @response.send 200 content
      else
        @response.type Text
        @response.send 404 ''

  ExportCSV-JSON = api -> [Json, (sc, cb) ->
    csv <- sc.exportCSV
    _, body <- csv-parse(csv, delimiter: \,)
    cb body
  ]
  ExportCSV = api -> [Csv, (sc, cb) -> sc.exportCSV cb ]
  ExportHTML = api -> [Html, (sc, cb) -> sc.exportHTML cb ]

  J-TypeMap =
    md: \text/x-markdown
    xlsx: \application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    ods: \application/vnd.oasis.opendocument.spreadsheet
  Export-J = (type) -> api (-> # single
    rv = J.utils["to_#type"](J.read it)
    rv = rv.Sheet1 if rv?Sheet1?
    [J-TypeMap[type], rv]
  ), ((names, saves) -> # multi
    input = [ null, { SheetNames: names, Sheets: {} } ]
    for save, idx in saves
      [harb, { Sheets: { Sheet1 } }] = J.read save
      input.0 ||= harb
      input.1.Sheets[names[idx]] = Sheet1
    rv = J.utils["to_#type"](input)
    [J-TypeMap[type], rv]
  )
      
  # Send time triggered email. Send due emails and schedule time of next send. Called from bash file:timetrigger in cron
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
      @response.send 200 allTimeTriggers

  ExportExcelXML = api ->

  @get '/:room.csv': ExportCSV
  @get '/:room.csv.json': ExportCSV-JSON
  @get '/:room.html': ExportHTML
  #@get '/:room.ods': Export-J \ods
  @get '/:room.xlsx': Export-J \xlsx
  @get '/:room.md': Export-J \md
  if @CORS
     @get '/_rooms' : ->
        @response.type Text
        return @response.send 403 '_rooms not available with CORS'
  else
     @get '/_rooms' : ->
        rooms <~ SC._rooms 
        @response.type \application/json
        @response.json 200 rooms
  if @CORS
     @get '/_roomlinks' : ->
        @response.type Text
        return @response.send 403 '_roomlinks not available with CORS'
  else
     @get '/_roomlinks' : ->
        rooms <~ SC._rooms 
        roomlinks = for room in rooms
          "<a href=#BASEPATH/#room>#room</a>"
        @response.type Html
        @response.json 200 roomlinks

  @get '/_from/:template': ->
    room = new-room!
    template = @params.template
    delete SC[room]
    {snapshot} <~ SC._get template, IO
    <~ SC._put room, snapshot
    @response.redirect if KEY then "#BASEPATH/#room/edit" else "#BASEPATH/#room"
  @get '/_exists/:room' : ->
    exists <~ SC._exists @params.room
    @response.type \application/json
    @response.json (exists === 1)

  @get '/:room': ->
    ui-file = if @params.room is /^=/ then \multi/index.html else \index.html
    if @request.get(\x-sandstorm-permissions) isnt /modify/ and not @query.auth?length
      @response.redirect "#BASEPATH/#{ @params.room }?auth=0"
    # Check header here and do a ?auth=0
    if KEY then
      if @query.auth?length
        sendFile(ui-file).call @
      else @response.redirect "#BASEPATH/#{ @params.room }?auth=0"
    else sendFile(ui-file).call @
    
  # Form/App - auto duplicate sheet for new user to input data 
  @get '/:template/form': ->
    template = @params.template
    room = template + \_ + new-room!
    delete SC[room]
    {snapshot} <~ SC._get template, IO
    <~ SC._put room, snapshot
    @response.redirect "#BASEPATH/#room/app" 
  @get '/:template/appeditor': sendFile \panels.html    

  @get '/:room/edit': ->
    if @request.get(\x-sandstorm-permissions) isnt /modify/
      @response.redirect "#BASEPATH/#{ @params.room }?auth=0"
      return
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
  @get '/_/:room/csv.json': ExportCSV-JSON
  #@get '/_/:room/ods': Export-J \ods
  @get '/_/:room/xlsx': Export-J \xlsx
  @get '/_/:room/md': Export-J \md
  @get '/_/:room': api -> [Text, it]

  request-to-command = (request, cb) ->
    #console.log "request-to-command"
    if request.is \application/json
      command = request.body?command
      return cb command if command
    cs = []; request.on \data (chunk) ~> cs ++= chunk
    <~ request.on \end
    buf = Buffer.concat cs
    return cb buf.toString(\utf8) if request.is \text/x-socialcalc
    return cb buf.toString(\utf8) if request.is \text/plain
    # TODO: Move to thread
    for k, save of (J.utils.to_socialcalc(J.read buf) || {'': ''})
      save.=replace /[\d\D]*?\ncell:/ 'cell:'
      save.=replace /\s--SocialCalcSpreadsheetControlSave--[\d\D]*/ '\n'
      save.=replace /\\/g "\\b" if ~save.index-of "\\"
      save.=replace /:/g  "\\c" if ~save.index-of ":"
      save.=replace /\n/g "\\n" if ~save.index-of "\n"
      return cb "loadclipboard #save"

  request-to-save = (request, cb) ->
    #console.log "request-to-save"
    if request.is \application/json
      snapshot = request.body?snapshot
      return cb snapshot if snapshot
    cs = []; request.on \data (chunk) ~> cs ++= chunk
    <~ request.on \end
    buf = Buffer.concat cs
    return cb buf.toString(\utf8) if request.is \text/x-socialcalc
    if request.is \text/x-ethercalc-csv-double-encoded
      iconv = require \iconv-lite
      buf = iconv.decode buf, \utf8
      buf = iconv.encode buf, \latin1
      buf = iconv.decode buf, \utf8
    # TODO: Move to thread
    for k, save of (J.utils.to_socialcalc(J.read buf) || {'': ''})
      return cb save

  for route in <[ /=:room.xlsx /_/=:room/xlsx ]> => @put "#route": ->
    room = encodeURIComponent(@params.room).replace(/%3A/g \:)
    cs = []; @request.on \data (chunk) ~> cs ++= chunk
    <~ @request.on \end
    buf = Buffer.concat cs
    idx = 0
    toc = '#url,#title\n'
    parsed = J.utils.to_socialcalc J.read buf
    sheets-to-idx = {}
    res = []
    for k of parsed
      idx++
      sheets-to-idx[k] = idx
      toc += "\"/#{ @params.room.replace(/"/g, '""') }.#idx\","
      toc += "\"#{ k.replace(/"/g, '""') }\"\n"
      res.push k.replace(/'/g, "''").replace(/(\W)/g, '\\$1')
    { Sheet1 } = J.utils.to_socialcalc J.read toc
    todo = DB.multi!set("snapshot-#room", Sheet1)
    for k, save of parsed
      idx = sheets-to-idx[k]
      save.=replace //('?)\b(#{ res.join('|') })\1!//g, (,, ref) ~>
        "'#{ @params.room.replace(/'/g, "''") }.#{
          sheets-to-idx[ref.replace(/''/g, "'")] }'!"
      todo.=set("snapshot-#room.#idx", save)
    todo.bgsave!.exec!
    @response.send 201 \OK

  @put '/_/:room': ->
    return if @request.get(\x-sandstorm-permissions) isnt /modify/
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
    return if @request.get(\x-sandstorm-permissions) isnt /modify/
    #console.log "post /_/:room"
    {room} = @params
    command <~ request-to-command @request
    unless command
      @response.type Text
      return @response.send 400 'Please send command'
    {log, snapshot} <~ SC._get room, IO
    if not (@request.is \application/json) and command is /^loadclipboard\s*/
      row = 1
      if snapshot is /\nsheet:c:\d+:r:(\d+):/
        row += Number(RegExp.$1)
      if parseInt(@query.row)
        row = parseInt(@query.row)
        command := [command, "insertrow A#row", "paste A#row all"]
      else
        command := [command, "paste A#row all"]
    if command is /^set\s+(A\d+):B\d+\s+empty\s+multi-cascade/
      _, [snapshot] <~ DB.multi!get("snapshot-#room").exec
      if snapshot
        sheetId = RegExp.$1
        matches = snapshot.match(new RegExp("cell:#sheetId:t:\/(.+)\n", "i"));
        if matches
            removeKey = matches[1]
            backupKey = "#{matches[1]}.bak"
            _ <~ DB.multi!
              .del("snapshot-#backupKey").rename("snapshot-#removeKey", "snapshot-#backupKey")
              .del("log-#backupKey").rename("log-#removeKey", "log-#backupKey")
              .del("audit-#backupKey").rename("audit-#removeKey", "audit-#backupKey")
              .bgsave!.exec
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
    return if @request.get(\x-sandstorm-permissions) isnt /modify/
    #console.log "post /_/:room"
    snapshot <~ request-to-save @request
    room = @body?room || new-room!
    <~ SC._put room, snapshot
    @response.type Text
    @response.location "/_/#room"
    @response.send 201 "/#room"

  @delete '/_/:room': ->
    @response.type Text
    {room} = @params
    SC[room]?terminate!
    delete SC[room]
    <~ SC._del room
    @response.send 201 \OK

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
    #console.log "on data: " {...@data} 
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
      return if @socket?handshake?headers['x-sandstorm-permissions'] isnt /modify/
      return if cmdstr is /^set sheet defaulttextvalueformat text-wiki\s*$/
      <~ DB.multi!
        .rpush "log-#room" cmdstr
        .rpush "audit-#room" cmdstr
        .bgsave!.exec!
      commandParameters = cmdstr.split("\r")       
      unless SC[room]?
        console.log "SC[#room] went away. Reloading..."
        _, [snapshot, log] <~ DB.multi!get("snapshot-#room").lrange("log-#room", 0, -1).exec
        SC[room] = SC._init snapshot, log, DB, room, @io
      # eddy @on data {
      if commandParameters[0].trim() is \submitform
        room_data = if room.indexOf('_') == -1  # store data in <templatesheet>_formdata
          then room + "_formdata"
          else room.replace(/_[.=_a-zA-Z0-9]*$/i,"_formdata") # get formdata sheet of cloned template
        console.log "test SC[#{room_data}] submitform..."      
        unless SC["#{room_data}"]?
          console.log "Submitform. loading... SC[#{room_data}]"
          _, [snapshot, log] <~ DB.multi!get("snapshot-#{room_data}").lrange("log-#{room_data}", 0, -1).exec
          SC["#{room_data}"] = SC._init snapshot, log, DB, "#{room_data}", @io   
        # add form values to last row of formdata sheet
        attribs <-! SC["#{room_data}"]?exportAttribs
        console.log "sheet attribs:" { ...attribs }       
        formrow = for let datavalue, formDataIndex in commandParameters when formDataIndex != 0
          "set #{String.fromCharCode(64 + formDataIndex)+(attribs.lastrow+1)} text t #datavalue" 
          #SocialCalc.crToCoord(formDataIndex, attribs.lastrow+1)}                   
        #cmdstrformdata = "set A3 text t abc"   
        cmdstrformdata = formrow.join("\n")
        console.log "cmdstrformdata:"+cmdstrformdata        
        <~ DB.multi!
          .rpush "log-#{room_data}" cmdstrformdata
          .rpush "audit-#{room_data}" cmdstrformdata
          .bgsave!.exec!
        SC["#{room_data}"]?ExecuteCommand cmdstrformdata
        broadcast { room:"#{room_data}", user, type, auth, cmdstr: cmdstrformdata, +include_self }
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
    | \ecell
      return if auth is \0 or KEY and auth isnt hmac room
      broadcast @data
    | otherwise
      return if @socket?handshake?headers['x-sandstorm-permissions'] isnt /modify/
      broadcast @data
