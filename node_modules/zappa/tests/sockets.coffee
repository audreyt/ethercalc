zappa = require '../src/zappa'
port = 15700

# socket.io-client currently (2011-11-22) not working in node 0.6.x
# https://github.com/LearnBoost/socket.io-client/issues/336

@tests =
  connects: (t) ->
    t.expect 1
    t.wait 3000
    
    zapp = zappa port++, ->
      @on connection: ->
        t.reached 1

    c = t.client(zapp.app)
    c.connect()

  'server emits': (t) ->
    t.expect 1
    t.wait 3000
    
    zapp = zappa port++, ->
      @on connection: ->
        @emit 'welcome'

    c = t.client(zapp.app)
    c.connect()

    c.on 'welcome', ->
      t.reached 1

  'server broadcasts': (t) ->
    t.expect 'reached1', 'reached2', 'data1', 'data2'
    t.wait 3000
    
    zapp = zappa port++, {t}, ->
      @on shout: ->
        @io.sockets.emit 'shout', @data

    c = t.client(zapp.app)
    c.connect()
    c2 = t.client(zapp.app)
    c2.connect()
    c3 = t.client(zapp.app)
    c3.connect()

    c.on 'shout', (data) ->
      t.reached 'reached1'
      t.equal 'data1', data.foo, 'bar'
    
    c2.on 'shout', (data) ->
      t.reached 'reached2'
      t.equal 'data2', data.foo, 'bar'
      
    c.emit 'shout', foo: 'bar'