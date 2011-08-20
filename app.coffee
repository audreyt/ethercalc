port = Number(process.env.VCAP_APP_PORT || 3000)
host = process.env.VCAP_APP_HOST || '127.0.0.1'
redisPort = null
redisHost = null
redisPass = null

services = JSON.parse(process.env.VCAP_SERVICES || "{}")
for name, items of services
  continue unless /^redis/.test(name)
  if items && items.length
    redisPort = items[0].credentials.port
    redisHost = items[0].credentials.hostname
    redisPass = items[0].credentials.password

db = require('redis').createClient(redisPort, redisHost)
db.auth(redisPass) if redisPass

require('zappa') port, host, {db}, ->
  enable 'serve jquery'
  app.use express.static __dirname

  def {db}

  get '/': ->
    response.contentType 'text/html'
    response.sendfile 'index.mt'

  get '/edit': ->
    response.contentType 'text/html'
    response.sendfile 'index.mt'

  get '/start': -> render 'start'
  get '/new': ->
    response.redirect require("uuid-pure").newId(10)

  view room: ->
    coffeescript ->
      window.location = '/#' + window.location.pathname.replace(/.*\//, '')

  view start: ->
    div id:"topnav_wrap", -> div id:"navigation"
    div id:"intro-left", ->
      h1 "MeetingCalc"
      h2 "MeetingCalc is a web spreadsheet."
      p "Your data is saved on the web, and people can edit the same document at the same time. Everybody's changes are instantly reflected on all screens."
      p "Work together on inventories, survey forms, list managements, brainstorming sessions and more!"
      div id:"intro-links", ->
        a id:"newpadbutton", href:"/new", ->
            span "Create new pad"
            small "No sign-up, start editing instantly"

  view layout: ->
    html ->
      head ->
        title "MeetingCalc"
        link href:"/start.css", rel:"stylesheet", type:"text/css"
      body id:"framedpagebody", class:"home", ->
        div id:"top", -> @body
  
  at broadcast: ->
    #io.sockets.in(@room).emit 'broadcast', @
    switch @type
      when 'chat'
        db.rpush "chat-#{@room}", @msg, =>
          io.sockets.emit 'chat', @
        return
      when 'ask.ecells'
        db.hgetall "ecell-#{@room}", (err, values) =>
          io.sockets.emit 'broadcast',
            type: 'ecells'
            ecells: values
            room: @room
        return
      when 'my.ecell'
        db.hset "ecell-#{@room}", @user, @ecell
        return
      when 'execute'
        db.rpush "log-#{@room}", @cmdstr, =>
          io.sockets.emit 'broadcast', @
        return
      when 'ask.snapshot'
        db.lrange "log-#{@room}", 0, -1, (err, log) =>
          db.lrange "chat-#{@room}", 0, -1, (err, chat) =>
            io.sockets.emit 'broadcast',
              type: 'log'
              to: @user
              room: @room
              log: log
              chat: chat
        return
    io.sockets.emit 'broadcast', @
  
  client '/player.js': ->
    SocialCalc ?= {}
    SocialCalc._username = Math.random().toString()
    SocialCalc.isConnected = true
    SocialCalc.hadSnapshot = false
    SocialCalc._room = window.location.hash.replace('#', '')
    unless SocialCalc._room
        window.location = '/start'
        return
    
    connect()
    #subscribe(SocialCalc._room)

    SocialCalc.Callbacks.broadcast = (type, data={}) ->
      return unless SocialCalc.isConnected
      data.user = SocialCalc._username
      data.room = SocialCalc._room
      data.type = type
      emit 'broadcast', data

    SocialCalc.isConnected = true
    SocialCalc.Callbacks.broadcast "ask.snapshot"

    at broadcast: ->
      return unless SocialCalc?.isConnected
      return if @user == SocialCalc._username
      return if @to and @to != SocialCalc._username
      return if @room and @room != SocialCalc._room

      editor = SocialCalc.CurrentSpreadsheetControlObject.editor
      switch @type
        when "chat"
          window.addmsg @msg
        when "ecells"
          for user, ecell of @ecells
            continue if user == SocialCalc._username
            peerClass = " " + user + " defaultPeer"
            find = new RegExp(peerClass, "g")
            cr = SocialCalc.coordToCr(ecell)
            cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col)
            cell.element.className += peerClass if cell.element.className.search(find) == -1
          break
        when "ecell"
            peerClass = " " + @user + " defaultPeer"
            find = new RegExp(peerClass, "g")
            if @original
              origCR = SocialCalc.coordToCr(@original)
              origCell = SocialCalc.GetEditorCellElement(editor, origCR.row, origCR.col)
              origCell.element.className = origCell.element.className.replace(find, "")
            cr = SocialCalc.coordToCr(@ecell)
            cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col)
            cell.element.className += peerClass if cell.element.className.search(find) == -1
        when "ask.snapshot"
          SocialCalc.Callbacks.broadcast "snapshot",
            to: @user
            snapshot: SocialCalc.CurrentSpreadsheetControlObject.CreateSpreadsheetSave()
        when "ask.ecell"
          SocialCalc.Callbacks.broadcast "ecell",
            to: @user
            ecell: editor.ecell.coord
          break
        when "log"
          break if SocialCalc.hadSnapshot
          SocialCalc.hadSnapshot = true
          spreadsheet = SocialCalc.CurrentSpreadsheetControlObject
          window.addmsg @chat.join("\n"), true
          cmdstr = @log.join("\n")
          SocialCalc.CurrentSpreadsheetControlObject.context.sheetobj.ScheduleSheetCommands cmdstr, false, true
          editor = SocialCalc.CurrentSpreadsheetControlObject.editor
#          editor.MoveECellCallback.broadcast = (e) ->
#            SocialCalc.Callbacks.broadcast "my.ecell"
#              ecell: e.ecell.coord
        when "snapshot"
          break if SocialCalc.hadSnapshot
          SocialCalc.hadSnapshot = true
          spreadsheet = SocialCalc.CurrentSpreadsheetControlObject
          parts = spreadsheet.DecodeSpreadsheetSave(@snapshot)
          if parts
            if parts.sheet
              spreadsheet.sheet.ResetSheet()
              spreadsheet.ParseSheetSave @snapshot.substring(parts.sheet.start, parts.sheet.end)
            spreadsheet.editor.LoadEditorSettings @snapshot.substring(parts.edit.start, parts.edit.end)  if parts.edit
          if spreadsheet.editor.context.sheetobj.attribs.recalc == "off"
            spreadsheet.ExecuteCommand "redisplay", ""
            spreadsheet.ExecuteCommand "set sheet defaulttextvalueformat text-wiki"
          else
            spreadsheet.ExecuteCommand "recalc", ""
            spreadsheet.ExecuteCommand "set sheet defaulttextvalueformat text-wiki"
          break
        when "execute"
          SocialCalc.CurrentSpreadsheetControlObject.context.sheetobj.ScheduleSheetCommands @cmdstr, @saveundo, true
          break

  get '/:room': ->
    @layout = no
    render 'room', @

