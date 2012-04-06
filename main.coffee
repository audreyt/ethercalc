SC = {}

@include = ->
  @enable 'serve jquery'
  @use @express.static __dirname

  @include 'dotcloud'
  db = @include 'db'

  @get '/': ->
    @response.contentType 'text/html'
    @response.sendfile 'index.html'
  @get '/start': -> @render 'start'
  @get '/new': -> @response.redirect '/#' + require("uuid-pure").newId(10, 62).toLowerCase()

  @view start: ->
    div id:"topnav_wrap", -> div id:"navigation"
    div id:"intro-left", ->
      h1 "EtherCalc"
      h2 "EtherCalc is a web spreadsheet."
      p "Your data is saved on the web, and people can edit the same document at the same time. Everybody's changes are instantly reflected on all screens."
      p "Work together on inventories, survey forms, list management, brainstorming sessions and more!"
      div id:"intro-links", ->
        a id:"newpadbutton", href:"/new", alt: "Create Spreadsheet", ->
          span "Create Spreadsheet"
          br ""
          small "No sign-up, start editing instantly"

  @view layout: ->
    html ->
      head ->
        title "EtherCalc"
        link href:"/start.css", rel:"stylesheet", type:"text/css"
      body id:"framedpagebody", class:"home", ->
        div id:"top", -> @body
        a href:"https://github.com/audreyt/ethercalc", ->
          img
            style:"z-order: 9999; position: absolute; top: 0; right: 0; border: 0"
            src:"//a248.e.akamai.net/assets.github.com/img/7afbc8b248c68eb468279e8c17986ad46549fb71/687474703a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f6461726b626c75655f3132313632312e706e67"
            alt:"Fork me on GitHub"
  
  @on broadcast: ->
    emit = (data) => @emit broadcast: data
    broadcast = (data) => @broadcast broadcast: data
    {room, msg, user, ecell, cmdstr, type} = @data
    switch type
      when 'chat'
        db.rpush "chat-#{room}", msg, =>
          broadcast @data
      when 'ask.ecells'
        db.hgetall "ecell-#{room}", (_, values) =>
          broadcast
            type: 'ecells'
            ecells: values
            room: room
      when 'my.ecell'
        db.hset "ecell-#{room}", user, ecell
      when 'execute'
        db.multi()
          .rpush("log-#{room}", cmdstr)
          .bgsave()
          .exec =>
            SC[room]?.ExecuteCommand cmdstr
            broadcast @data
      when 'ask.log', 'ask.recalc'
        db.multi()
          .get("snapshot-#{room}")
          .lrange("log-#{room}", 0, -1)
          .lrange("chat-#{room}", 0, -1)
          .exec (_, [snapshot, log, chat]) =>
            SC[room] = initSC snapshot, log, db, room
            emit { type: type.replace('ask.', ''), room, log, chat, snapshot }
      when 'stopHuddle'
        db.del [
          "log-#{room}"
          "chat-#{room}"
          "ecell-#{room}"
          "snapshot-#{room}"
        ], => broadcast @data
      else broadcast @data
    return
  
  @include 'player'

  @get '/:room': ->
    @render room: { layout: no }

  @use 'bodyParser'

  @post '/:room': ->
    {room, snapshot} = @data
    db.set "snapshot-#{room}", snapshot, (err) =>
      @response.send 'text', { 'Content-Type': 'text/plain' }, 201

  @view room: ->
    coffeescript ->
      window.location = '/#' + window.location.pathname.replace(/.*\//, '')

vm = require('vm')
bootSC = require('fs').readFileSync('./SocialCalc.js', 'utf8')
initSC = (snapshot, log, db, room) ->
  if SC[room]?
    SC[room]._doClearCache()
    return SC[room]
  sandbox = vm.createContext(SocialCalc: null, ss: null, console: console, require: -> require('jsdom'))
  vm.runInContext bootSC, sandbox
  SocialCalc = sandbox.SocialCalc
  SocialCalc.SaveEditorSettings = -> ""
  SocialCalc.CreateAuditString = -> ""
  SocialCalc.CalculateEditorPositions = ->
  SocialCalc.Popup.Types.List.Create = ->
  SocialCalc.Popup.Types.ColorChooser.Create = ->
  SocialCalc.Popup.Initialize = ->
  vm.runInContext 'ss = new SocialCalc.SpreadsheetControl', sandbox
  SocialCalc.RecalcInfo.LoadSheet = (ref) ->
    ref = ref.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase()
    if SC[ref]
      serialization = SC[ref].CreateSpreadsheetSave()
      parts = SC[ref].DecodeSpreadsheetSave(serialization)
      SocialCalc.RecalcLoadedSheet(
        ref,
        serialization.substring(parts.sheet.start, parts.sheet.end),
        true # recalc
      )
    else
      SocialCalc.RecalcLoadedSheet(ref, "", true)
    return true

  ss = sandbox.ss
  delete ss.editor.StatusCallback.statusline
  div = SocialCalc.document.createElement('div')
  SocialCalc.document.body.appendChild div
  ss.InitializeSpreadsheetControl(div, 0, 0, 0)
  ss._room = room
  ss._doClearCache = -> SocialCalc.Formula.SheetCache.sheets = {}
  ss.editor.StatusCallback.EtherCalc = func: (editor, status, arg) ->
    return unless status is 'doneposcalc' and not ss.editor.busy
    newSnapshot = ss.CreateSpreadsheetSave()
    db.multi()
      .set("snapshot-#{ss._room}", newSnapshot)
      .del("log-#{ss._room}")
      .bgsave()
      .exec => console.log "Regenerated snapshot for #{ss._room}"
  parts = ss.DecodeSpreadsheetSave(snapshot) if snapshot
  if parts?.sheet
    ss.sheet.ResetSheet()
    ss.ParseSheetSave snapshot.substring(parts.sheet.start, parts.sheet.end)
  cmdstr = (line for line in log when not /^re(calc|display)$/.test(line)).join("\n")
  cmdstr += "\n" if cmdstr.length
  ss.context.sheetobj.ScheduleSheetCommands cmdstr + "recalc\n", false, true
  return ss
