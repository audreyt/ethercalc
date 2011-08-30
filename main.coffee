@include = ->
  enable 'serve jquery'
  app.use express.static __dirname

  include 'dotcloud'
  include 'db'

  get '/': ->
    response.contentType 'text/html'
    response.sendfile 'index.html'

  get '/edit': ->
    response.contentType 'text/html'
    response.sendfile 'index.html'

  get '/start': -> render 'start'
  get '/new': -> response.redirect require("uuid-pure").newId(10, 62)

  view room: ->
    coffeescript ->
      window.location = '/#' + window.location.pathname.replace(/.*\//, '')

  view start: ->
    div id:"topnav_wrap", -> div id:"navigation"
    div id:"intro-left", ->
      h1 "EtherCalc"
      h2 "EtherCalc is a web spreadsheet."
      p "Your data is saved on the web, and people can edit the same document at the same time. Everybody's changes are instantly reflected on all screens."
      p "Work together on inventories, survey forms, list managements, brainstorming sessions and more!"
      div id:"intro-links", ->
        a id:"newpadbutton", href:"/new", alt: "Create Spreadsheet", ->
          span "Create Spreadsheet"
          br ""
          small "No sign-up, start editing instantly"

  view layout: ->
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
            alt:"Fxrk me on GitHub"
  
  at broadcast: ->
    #io.sockets.in(@room).emit 'broadcast', @
    emit = (msg) -> io.sockets.emit 'broadcast', msg
    switch @type
      when 'chat'
        db.rpush "chat-#{@room}", @msg, => emit @
      when 'ask.ecells'
        db.hgetall "ecell-#{@room}", (err, values) => emit
          type: 'ecells'
          ecells: values
          room: @room
      when 'my.ecell'
        db.hset "ecell-#{@room}", @user, @ecell
      when 'execute'
        db.rpush "log-#{@room}", @cmdstr, => emit @
      when 'ask.snapshot'
        db.lrange "log-#{@room}", 0, -1, (err, log) =>
          db.lrange "chat-#{@room}", 0, -1, (err, chat) => emit
            type: 'log'
            to: @user
            room: @room
            log: log
            chat: chat
    emit @
  
  include 'player'

  get '/:room': ->
    @layout = no
    render 'room', @
