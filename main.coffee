@include = ->
  SC = {}

  @enable 'serve jquery'
  @use @express.static __dirname

  @include 'dotcloud'
  db = @include 'db'

  @get '/': ->
    @response.contentType 'text/html'
    @response.sendfile 'index.html'
  @get '/start': -> @render 'start'
  @get '/new': -> @response.redirect '/#' + require("uuid-pure").newId(10, 62)

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
            SC[room].ExecuteCommand cmdstr
            broadcast @data
      when 'ask.snapshot'
        db.multi()
          .get("snapshot-#{room}")
          .lrange("log-#{room}", 0, -1)
          .lrange("chat-#{room}", 0, -1)
          .exec (_, [snapshot, log, chat]) =>
            unless SC[room]
              SocialCalc = require('./SocialCalc')
              SocialCalc.SaveEditorSettings = -> ""
              SocialCalc.CreateAuditString = -> ""
              SocialCalc.CalculateEditorPositions = ->
              SC[room] = new SocialCalc.SpreadsheetControl
              delete SC[room].editor.StatusCallback.statusline
              SC[room].InitializeSpreadsheetControl("tableeditor", 0, 0, 0)
              SC[room].editor.StatusCallback.EtherCalc = func: (editor, status, arg) ->
                return unless status is 'doneposcalc' and not SC[room].editor.busy
                db.multi()
                  .set("snapshot-#{room}", SC[room].CreateSpreadsheetSave())
                  .del("log-#{room}")
                  .bgsave()
                  .exec => console.log "Regenerated snapshot for #{room}"
              parts = SC[room].DecodeSpreadsheetSave(snapshot) if snapshot
              if parts?.sheet
                SC[room].sheet.ResetSheet()
                SC[room].ParseSheetSave snapshot.substring(parts.sheet.start, parts.sheet.end)
              cmdstr = (line for line in log when not /^re(calc|display)$/.test(line)).join("\n")
              cmdstr += "\n" if cmdstr.length
              SC[room].context.sheetobj.ScheduleSheetCommands cmdstr + "recalc\n", false, true
            @emit broadcast:
              type: 'log'
              to: user
              room: room
              log: log
              chat: chat
              snapshot: snapshot
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

