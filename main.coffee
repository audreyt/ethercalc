@include = ->
  @enable 'serve jquery'
  @use @express.static __dirname

  @include 'dotcloud'
  @include 'player'

  DB = @include 'db'
  SC = @include 'sc'

  @get '/': ->
    @response.contentType 'text/html'
    @response.sendfile 'index.html'

  @get '/:room': ->
    @response.contentType 'text/html'
    @response.sendfile 'index.html'

  @get '/_start': -> @render 'start'
  @get '/_new': -> @response.redirect '/' + require("uuid-pure").newId(10, 62).toLowerCase()

  @use 'bodyParser'

  @post '/:room': ->
    {room, snapshot} = @data
    DB.set "snapshot-#{room}", snapshot, (err) =>
      @response.send 'text', { 'Content-Type': 'text/plain' }, 201

  @view start: ->
    div id:"topnav_wrap", -> div id:"navigation"
    div id:"intro-left", ->
      h1 "EtherCalc"
      h2 "EtherCalc is a web spreadsheet."
      p "Your data is saved on the web, and people can edit the same document at the same time. Everybody's changes are instantly reflected on all screens."
      p "Work together on inventories, survey forms, list management, brainstorming sessions and more!"
      div id:"intro-links", ->
        a id:"newpadbutton", href:"/_new", alt: "Create Spreadsheet", ->
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
    {room, msg, user, ecell, cmdstr, type} = @data
    room = room.replace(/^_+/, '') # preceding underscore is reserved
    emit = (data) => @emit broadcast: data
    broadcast = (data) => @socket.broadcast.to("log-#{room}").emit 'broadcast', data
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
          .bgsave()
          .exec =>
            SC[room]?.ExecuteCommand cmdstr
            broadcast @data
      when 'ask.log'
        @socket.join("log-#{room}")
        DB.multi()
          .get("snapshot-#{room}")
          .lrange("log-#{room}", 0, -1)
          .lrange("chat-#{room}", 0, -1)
          .exec (_, [snapshot, log, chat]) =>
            SC[room] = SC._init(snapshot, log, DB, room, @io)
            emit { type: 'log', room, log, chat, snapshot }
      when 'ask.recalc'
        @socket.join("recalc.#{room}")
        if SC[room]?._snapshot
          emit { type: 'recalc', room, snapshot: SC[room]._snapshot }
        else
          DB.multi()
            .get("snapshot-#{room}")
            .lrange("log-#{room}", 0, -1)
            .exec (_, [snapshot, log]) =>
              SC[room] = SC._init(snapshot, log, DB, room, @io)
              emit { type: 'recalc', room, log, snapshot }
      when 'stopHuddle'
        DB.del [
          "log-#{room}"
          "chat-#{room}"
          "ecell-#{room}"
          "snapshot-#{room}"
        ], => broadcast @data
      else broadcast @data
    return
