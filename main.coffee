return if not require('streamline/module')(module)

@include = ->
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
  
  @on broadcast: -> ((_) =>
    emit = (data) => @broadcast broadcast: data
    {room, msg, user, ecell, cmdstr, type} = @data
    switch type
      when 'chat'
        db.rpush "chat-#{room}", msg, _
        emit @data
      when 'ask.ecells'
        values = db.hgetall "ecell-#{room}", _
        emit
          type: 'ecells'
          ecells: values
          room: room
      when 'my.ecell'
        db.hset "ecell-#{room}", user, ecell
      when 'execute'
        db.rpush "log-#{room}", cmdstr, _
        db.bgsave _
        emit @data
      when 'ask.snapshot'
        snapshot = db.get "snapshot-#{room}", _
        log = db.lrange "log-#{room}", 0, -1, _
        chat = db.lrange "chat-#{room}", 0, -1, _
        @emit broadcast:
          type: 'log'
          to: user
          room: room
          log: log
          chat: chat
          snapshot: snapshot
      when 'stopHuddle'
        db.del "log-#{room}", _
        db.del "chat-#{room}", _
        db.del "ecell-#{room}", _
        db.del "snapshot-#{room}", _
        emit @data
      else emit @data
    return
  )(->)
  
  @include 'player'

  @get '/:room': ->
    @render room: { layout: no }

  @use 'bodyParser'

  @post '/:room': ->
    {room} = @data
    db.set "snapshot-#{room}", @snapshot, (err) =>
      db.get "snapshot-#{room}", (err, snapshot) =>
        @response.send 'text', { 'Content-Type': 'text/plain' }, 201

  @view room: ->
    coffeescript ->
      window.location = '/#' + window.location.pathname.replace(/.*\//, '')

