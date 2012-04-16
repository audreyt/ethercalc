# **Zappa** is a [CoffeeScript](http://coffeescript.org) DSL-ish interface for building web apps on the
# [node.js](http://nodejs.org) runtime, integrating [express](http://expressjs.com), [socket.io](http://socket.io)
# and other best-of-breed libraries.

zappa = version: '0.3.3'

codename = 'The Gumbo Variations'

log = console.log
fs = require 'fs'
path = require 'path'
uuid = require 'node-uuid'
express = require 'express'
socketio = require 'socket.io'
jquery = fs.readFileSync(__dirname + '/../vendor/jquery-1.6.4.min.js').toString()
sammy = fs.readFileSync(__dirname + '/../vendor/sammy-0.7.0.min.js').toString()
uglify = require 'uglify-js'

# Soft dependencies:
jsdom = null

# CoffeeScript-generated JavaScript may contain anyone of these; when we "rewrite"
# a function (see below) though, it loses access to its parent scope, and consequently to
# any helpers it might need. So we need to reintroduce these helpers manually inside any
# "rewritten" function.
coffeescript_helpers = """
  var __slice = Array.prototype.slice;
  var __hasProp = Object.prototype.hasOwnProperty;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  var __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype;
    return child; };
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    } return -1; };
""".replace /\n/g, ''

minify = (js) ->
  ast = uglify.parser.parse(js)
  ast = uglify.uglify.ast_mangle(ast)
  ast = uglify.uglify.ast_squeeze(ast)
  uglify.uglify.gen_code(ast)

# Shallow copy attributes from `sources` (array of objects) to `recipient`.
# Does NOT overwrite attributes already present in `recipient`.
copy_data_to = (recipient, sources) ->
  for obj in sources
    for k, v of obj
      recipient[k] = v unless recipient[k]

# Keep inline views at the module level and namespaced by app id
# so that the monkeypatched express can look them up.
views = {}
  
# Monkeypatch express to support lookup of inline templates. Such is life.
express.View.prototype.__defineGetter__ 'exists', ->
  # Path given by zappa: /path/to/appid/foo.bar.
  
  # Try appid/foo.bar in memory.
  p = @path.replace @root + '/', ''
  id = p.split('/')[0]
  return true if views[p]

  # Try appid/foo in memory.
  p = p.replace(path.extname(p), '')
  return true if views[p]

  # Try /path/to/foo.bar in filesystem (normal express behaviour).
  p = @path.replace id + '/', ''
  try
    fs.statSync(p)
    return true
  catch err
    return false

express.View.prototype.__defineGetter__ 'contents', ->
  # Path given by zappa: /path/to/appid/foo.bar.

  # Try appid/foo.bar in memory.
  p = @path.replace @root + '/', ''
  id = p.split('/')[0]
  return views[p] if views[p]

  # Try appid/foo in memory.
  p = p.replace(path.extname(p), '')
  return views[p] if views[p]

  # Try /path/to/foo.bar in filesystem (normal express behaviour).
  p = @path.replace id + '/', ''
  fs.readFileSync p, 'utf8'

# Takes in a function and builds express/socket.io apps based on the rules contained in it.
zappa.app = (func) ->
  context = {id: uuid(), zappa, express}
  
  context.root = path.dirname(module.parent.filename)

  # Storage for user-provided stuff.
  # Views are kept at the module level.
  ws_handlers = {}
  helpers = {}
  postrenders = {}
  
  app = context.app = express.createServer()
  io = context.io = socketio.listen(app)

  # Reference to the zappa client, the value will be set later.
  client = null
  
  # Tracks if the zappa middleware is already mounted (`@use 'zappa'`).
  zappa_used = no

  # Zappa's default settings.
  app.set 'view engine', 'coffee'
  app.register '.coffee', zappa.adapter require('coffeekup').adapters.express,
    blacklist: ['format', 'autoescape', 'locals', 'hardcode', 'cache']

  # Sets default view dir to @root (`path.dirname(module.parent.filename)`).
  app.set 'views', path.join(context.root, '/views')

  for verb in ['get', 'post', 'put', 'del']
    do (verb) ->
      context[verb] = ->
        if arguments.length > 1
          route verb: verb, path: arguments[0], handler: arguments[1]
        else
          for k, v of arguments[0]
            route verb: verb, path: k, handler: v

  context.client = (obj) ->
    context.use 'zappa' unless zappa_used
    for k, v of obj
      js = ";zappa.run(#{v});"
      js = minify(js) if app.settings['minify']
      route verb: 'get', path: k, handler: js, contentType: 'js'

  context.coffee = (obj) ->
    for k, v of obj
      js = ";#{coffeescript_helpers}(#{v})();"
      js = minify(js) if app.settings['minify']
      route verb: 'get', path: k, handler: js, contentType: 'js'

  context.js = (obj) ->
    for k, v of obj
      js = String(v)
      js = minify(js) if app.settings['minify']
      route verb: 'get', path: k, handler: js, contentType: 'js'

  context.css = (obj) ->
    for k, v of obj
      css = String(v)
      route verb: 'get', path: k, handler: css, contentType: 'css'

  context.stylus = (obj) ->
    for k, v of obj
      css = require('stylus').render v, filename: k, (err, css) ->
        throw err if err
        route verb: 'get', path: k, handler: css, contentType: 'css'

  context.helper = (obj) ->
    for k, v of obj
      helpers[k] = v

  context.postrender = (obj) ->
    jsdom = require 'jsdom'
    for k, v of obj
      postrenders[k] = v

  context.on = (obj) ->
    for k, v of obj
      ws_handlers[k] = v

  context.view = (obj) ->
    for k, v of obj
      views["#{context.id}/#{k}"] = v

  context.register = (obj) ->
    for k, v of obj
      app.register '.' + k, v

  context.set = (obj) ->
    for k, v of obj
      app.set k, v
      
  context.enable = ->
    app.enable i for i in arguments

  context.disable = ->
    app.disable i for i in arguments

  context.use = ->
    zappa_middleware =
      static: (p = path.join(context.root, '/public')) ->
        express.static(p)
      zappa: ->
        (req, res, next) ->
          send = (code) ->
            res.contentType 'js'
            res.send code
          if req.method.toUpperCase() isnt 'GET' then next()
          else
            switch req.url
              when '/zappa/zappa.js' then send client
              when '/zappa/jquery.js' then send jquery
              when '/zappa/sammy.js' then send sammy
              else next()

    use = (name, arg = null) ->
      zappa_used = yes if name is 'zappa'
      
      if zappa_middleware[name]
        app.use zappa_middleware[name](arg)
      else if typeof express[name] is 'function'
        app.use express[name](arg)
     
    for a in arguments
      switch typeof a
        when 'function' then app.use a
        when 'string' then use a
        when 'object' then use k, v for k, v of a
    
  context.configure = (p) ->
    if typeof p is 'function' then app.configure p
    else app.configure k, v for k, v of p
    
  context.settings = app.settings

  context.shared = (obj) ->
    context.use 'zappa' unless zappa_used
    for k, v of obj
      js = ";zappa.run(#{v});"
      js = minify(js) if app.settings['minify']
      route verb: 'get', path: k, handler: js, contentType: 'js'
      v.apply(context, [context])

  context.include = (p) ->
    sub = require path.join(context.root, p)
    sub.include.apply(context, [context])

  # Register a route with express.
  route = (r) ->
    if typeof r.handler is 'string'
      app[r.verb] r.path, (req, res) ->
        res.contentType r.contentType if r.contentType?
        res.send r.handler
    else
      app[r.verb] r.path, (req, res, next) ->
        ctx =
          app: app
          settings: app.settings
          request: req
          query: req.query
          params: req.params
          body: req.body
          session: req.session
          response: res
          next: next
          send: -> res.send.apply res, arguments
          redirect: -> res.redirect.apply res, arguments
          render: ->
            if typeof arguments[0] isnt 'object'
              render.apply @, arguments
            else
              for k, v of arguments[0]
                render.apply @, [k, v]

        render = (args...) ->
          # Adds the app id to the view name so that the monkeypatched
          # express.View.exists and express.View.contents can lookup
          # this app's inline templates.
          args[0] = context.id + '/' + args[0]
        
          # Make sure the second arg is an object.
          args[1] ?= {}
          args.splice 1, 0, {} if typeof args[1] is 'function'
        
          if app.settings['databag']
            args[1].params = data

          if args[1].postrender?
            # Apply postrender before sending response.
            res.render args[0], args[1], (err, str) ->
              jsdom.env html: str, src: [jquery], done: (err, window) ->
                ctx.window = window
                rendered = postrenders[args[1].postrender].apply(ctx, [window.$, ctx])

                doctype = (window.document.doctype or '') + "\n"
                res.send doctype + window.document.documentElement.outerHTML
          else
            # Just forward params to express.
            res.render.apply res, args

        for name, helper of helpers
          do (name, helper) ->
            ctx[name] = (args...) ->
              args.push ctx
              helper.apply ctx, args

        if app.settings['databag']
          data = {}
          copy_data_to data, [req.query, req.params, req.body]

        # Go!
        switch app.settings['databag']
          when 'this' then result = r.handler.apply(data, [ctx])
          when 'param' then result = r.handler.apply(ctx, [data])
          else result = r.handler.apply(ctx, [ctx])
        
        res.contentType(r.contentType) if r.contentType?
        if typeof result is 'string' then res.send result
        else return result
  
  # Register socket.io handlers.
  io.sockets.on 'connection', (socket) ->
    c = {}
    
    build_ctx = ->
      ctx =
        app: app
        io: io
        settings: app.settings
        socket: socket
        id: socket.id
        client: c
        emit: ->
          if typeof arguments[0] isnt 'object'
            socket.emit.apply socket, arguments
          else
            for k, v of arguments[0]
              socket.emit.apply socket, [k, v]
        broadcast: ->
          if typeof arguments[0] isnt 'object'
            socket.broadcast.emit.apply socket.broadcast, arguments
          else
            for k, v of arguments[0]
              socket.broadcast.emit.apply socket.broadcast, [k, v]

      for name, helper of helpers
        do (name, helper) ->
          ctx[name] = ->
            helper.apply(ctx, arguments)
      ctx

    ctx = build_ctx()
    ws_handlers.connection.apply(ctx, [ctx]) if ws_handlers.connection?

    socket.on 'disconnect', ->
      ctx = build_ctx()
      ws_handlers.disconnect.apply(ctx, [ctx]) if ws_handlers.disconnect?

    for name, h of ws_handlers
      do (name, h) ->
        if name isnt 'connection' and name isnt 'disconnect'
          socket.on name, (data) ->
            ctx = build_ctx()
            ctx.data = data
            switch app.settings['databag']
              when 'this' then h.apply(data, [ctx])
              when 'param' then h.apply(ctx, [data])
              else h.apply(ctx, [ctx])

  # Go!
  func.apply(context, [context])

  # The stringified zappa client.
  client = require('./client').build(zappa.version, app.settings)
  client = ";#{coffeescript_helpers}(#{client})();"
  client = minify(client) if app.settings['minify']

  if app.settings['default layout']
    context.view layout: ->
      doctype 5
      html ->
        head ->
          title @title if @title
          if @scripts
            for s in @scripts
              script src: s + '.js'
          script(src: @script + '.js') if @script
          if @stylesheets
            for s in @stylesheets
              link rel: 'stylesheet', href: s + '.css'
          link(rel: 'stylesheet', href: @stylesheet + '.css') if @stylesheet
          style @style if @style
        body @body

  context

# Takes a function and runs it as a zappa app. Optionally accepts a port number, and/or
# a hostname (any order). The hostname must be a string, and the port number must be
# castable as a number.
# Returns an object where `app` is the express server and `io` is the socket.io handle.
# Ex.:
#     require('zappa') -> get '/': 'hi'
#     require('zappa').run 80, -> get '/': 'hi'
#     require('zappa') -> 'domain.com', 80, -> get '/': 'hi'
zappa.run = ->
  host = null
  port = 3000
  root_function = null

  for a in arguments
    switch typeof a
      when 'string'
        if isNaN( (Number) a ) then host = a
        else port = (Number) a
      when 'number' then port = a
      when 'function' then root_function = a

  zapp = zappa.app(root_function)
  app = zapp.app

  if host then app.listen port, host
  else app.listen port

  log 'Express server listening on port %d in %s mode',
    app.address()?.port, app.settings.env

  log "Zappa #{zappa.version} \"#{codename}\" orchestrating the show"

  zapp

# Creates a zappa view adapter for templating engine `engine`. This adapter
# can be used with `app.register` and creates params "shortcuts".
# 
# Zappa, by default, automatically sends all request params to templates,
# but inside the `params` local.
#
# This adapter adds a "root local" for each of these params, *only* 
# if a local with the same name doesn't exist already, *and* the name is not
# in the optional blacklist.
#
# The blacklist is useful to prevent request params from triggering unset
# template engine options.
#
# If `engine` is a string, the adapter will use `require(engine)`. Otherwise,
# it will assume the `engine` param is an object with a `compile` function.
zappa.adapter = (engine, options = {}) ->
  options.blacklist ?= []
  engine = require(engine) if typeof engine is 'string'
  compile: (template, data) ->
    template = engine.compile(template, data)
    (data) ->
      for k, v of data.params
        if typeof data[k] is 'undefined' and k not in options.blacklist
          data[k] = v
      template(data)

module.exports = zappa.run
module.exports.run = zappa.run
module.exports.app = zappa.app
module.exports.adapter = zappa.adapter
module.exports.version = zappa.version