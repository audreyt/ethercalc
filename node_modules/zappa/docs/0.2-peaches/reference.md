---
layout: default
title: API Reference (v0.2.1)
permalink: /reference/index.html
---

# {{page.title}}

**Please note this is a work in progress. There are still many sections to be added or refined.**

## EXPORTS

`require 'zappa'` returns a function with the following attributes:

### version

Version of zappa running.

### app

`zappa.app [locals,] function`

Builds an app with express/socket.io, based on the function you provided.

This function will have access to all the local variables described in the **Root scope** section.

It will also lose access to its parent scope in the process, so any variables from the outside that you want to be available at your root scope must be passed through the optional `locals` param. Ex.:

    foo = 'bar'
    
    zappa.app ->
      console.log foo # foo is not defined
      
    zappa.app {foo}, ->
      console.log foo # 'bar'

Returns an object with attributes `id` (uuid generated for this app), `app` (express server) and `io` (socket.io server).

### run

`zappa.run [port,] [host,] [locals,] function`

Same as `zappa.app`, but calls `app.listen` for you.

The base export is actually a reference to this same function, so these are equivalent:

    require('zappa').run ->
      get '/': 'hi'
      
    require('zappa') ->
      get '/': 'hi'

You can pass the parameters in any order. Number is port, string is host, object is locals and function is your application. Port and host are optional. Omitted params will also be omitted in the `app.listen` call to express (defaulting to port 3000 and binding to INADDR_ANY).

### adapter

Creates a zappa view adapter to be used with `app.register`. See `view`.

## ROOT SCOPE

The function you pass to `zappa.app` or `zappa.run` will be modified to include these variables:

### @/this

An empty object. It will be shared with `include`'d files.

### get, post, put, del

`get path: handler`

Define handlers for HTTP requests.

Shortcuts to express' `app.[verb]`. Params will just be passed forward unmodified (except for the handler function, which will be re-scoped), unless a single object is passed. In which case, each key in the object will be a route path, and the value its respective handler. The handler can be a function or a string. In the latter case, the handler passed to express will be a function that only calls `res.send` with this string.

The handler functions will have access to all variables described in the **HTTP handlers scope** section. They won't have access to their parent scope. To make variables available to these handlers, use `def` or `helper`.

If a handler returns a string, `res.send(string)` will be called automatically.

Ex.:
    
    get '/': 'hi'

    get '/', -> 'hi'
    
    get /regex/, -> 'hi'
    
    get '/': 'hi', '/wiki': 'wiki', '/chat': 'chat'

    get
      '/': -> 'hi'
      '/wiki': 'wiki'
      '/chat': -> response.send 'chat'

### at

`at event: handler`

Define handlers for events emitted by the client through socket.io.

Shortcut to socket.io's `socket.on 'event'`.

The handler functions will have access to all variables described in the **Socket.io handlers scope** section. They won't have access to their parent scope. To make variables available to these handlers, use `def` or `helper`.

### helper

`helper name: function`

A function that will be available to both the HTTP and sockets scopes. It will have access to the same variables as whatever called it. Ex.:

    get '/': ->
      @foo = 'bar'
      sum 5, 7
      
    at connection: ->
      @foo = 'f7u12'
      sum 26, 18

    helper sum: (a, b) ->
                          # Values when called from "get" vs "at"
      console.log a       # 5 vs 26
      console.log @foo    # 'bar' vs 'f7u12'
      console.log request # available vs error
      console.log emit    # error vs available
      
Since the parameter is actually an object, you can define any number of helpers in one go:

    helper
      sum: (a, b) -> a + b
      subtract: (a, b) -> a - b

### def

`def key: value`

Makes `value` available to both the HTTP and sockets scopes as a local variable with same name as `key`. In contrast to a `helper`, it will **not** be modified in any way. So a `def`'d function will still have access to its normal scope, and won't have available anything from the HTTP or sockets scopes that's not passed to it explicitly as a parameter. Ex.:

    def sum: (a, b) ->
      console.log @foo      # undefined
      console.log request   # error
      console.log emit      # error
      a + b                 # 12 

    get '/': ->
      @foo = 'bar'
      sum 5, 7

Since the parameter is actually an object, you can define any number of variables in one go:

    def foo: 'bar', ping: 'pong', zig: 'zag'

### view

`view path: contents`

Define an inline template. For all purposes it's like you had a file on disk at `path`. It will have precedence over a template on disk.

Ex.:

    view index: ->
      h1 @foo
      
    view 'index.eco': '''
      <h1><%= @foo %></h1>
    '''

By default, the templating engine is CoffeeKup. To use other engines, just use express' mechanisms:

    render 'index.jade'

Or:

    set 'view engine': 'jade'
    
All variables at `@`/`params` (request params + those you created) are automatically made available to templates as `params.foo` (in CoffeeKup, `@params.foo`).

In addition, if you're using the *zappa view adapter* (as is the case by default, with CoffeeKup), they're also made available at the template's "root namespace" (`foo` or CoffeeKup's `@foo`).

Since in express templating data is usually mixed up with framework locals and template options, the adapter will only put variables in the template root if there isn't a variable there with the same name already, *and* the name is not blacklisted.

To use this feature with other templating engines:

    blacklist = 'scope|self|locals|filename|debug|compiler|compileDebug|inline'.split '|'
    app.register '.jade', zappa.adapter 'jade', blacklist

To disable it on default zappa:

    app.register '.coffee', require('coffeekup').adapters.express

### postrender

`postrender name: contents`

DOM rendering with server-side jQuery.

### include

`include file`

Will `require` the file at the path specified, and run a function exported as `include` against the same scope as the current function. Ex.:

    # app.coffee
    require('zappa') ->
      @foo = 'bar'
      ping = 'pong'
      get '/': 'main'
      include './sub'
      
    # sub.coffee
    @include = ->
      console.log @foo    # 'bar'
      console.log ping    # error
      get '/sub': 'sub'

### client

    client '/foo.js': ->
      def sum: (a, b) -> a + b
      
      helper foo: (param) ->
        console.log param                       # 'bar' or 'pong'
        sum 1, 2                                # 3
        console.log @zig                        # A request or event input param.
        if render? then console.log 'route'
        else if emit? then console.log 'event'
    
      get '#/': ->
        foo 'bar'
        console.log 'A sammy.js route.'
        
      at welcome: ->
        foo 'pong'
        console.log 'A socket.io event.'

Serves `";zappa.run(#{your_function});"` as `/foo.js`, with content-type `application/javascript`.

To use it, you must also include `/zappa/zappa.js` in your template, before `/foo.js`.

### shared

    shared '/index.js': ->
      def sum: (a, b) -> a + b

      helper role: (name) ->
        unless @user.role is name
          if request? then redirect '/login'
          else if window? then alert "This is not the page you're looking for."
          else if socket? then client.disconnect()

    get '/admin': ->
      role 'admin'
      # admin stuff
  
    at 'delete everything': ->
      role 'admin'
  
    client '/index.js': ->
      get '#/admin': ->
        role 'admin'
        # admin stuff

Same as `client`, but also makes the elements defined in the function available at the server-side.

### coffee

    coffee '/foo.js': ->
      alert 'hi!'

Serves `";#{coffeescript_helpers}(#{your_function})();"` as `/foo.js`, with content-type `application/javascript`.

### js

    js '/foo.js': '''
      alert('hi!');
    '''

Serves the string as `/foo.js`, with content-type `application/javascript`.

### css

    css '/foo.css': '''
      font-family: sans-serif;
    '''

Serves the string as `/foo.css`, with content-type `text/css`.

### stylus

    stylus '/foo.css': '''
      border-radius()
        -webkit-border-radius arguments  
        -moz-border-radius arguments  
        border-radius arguments  

      body
        font 12px Helvetica, Arial, sans-serif  

      a.button
        border-radius 5px
    '''

Compiles the string with [stylus](http://learnboost.github.com/stylus) and serves the results as `/foo.css`, with content-type `text/css`.

You must have stylus installed with `npm install stylus`.

### zappa

### express

Same as `require 'express'`.

### io

Socket.io's object.

### app

Express's object.

### use

Shortcut to `app.use`. It can be used in a number of additional ways:

- It accepts many params in a row. Ex.:

        use express.bodyParser(), app.router, express.cookies()

- It accepts strings as parameters. This is syntactic sugar to the equivalent express middleware with no arguments. Ex.:

        use 'bodyParser', app.router, 'cookies'

- You can also specify parameters by using objects. Ex.:

        use 'bodyParser', static: __dirname + '/public', session: {secret: 'fnord'}, 'cookies'

- Finally, when using strings and objects, zappa will intercept some specific middleware and add behaviour, usually default parameters. Ex.:

        use 'static'
        
        # Syntactic sugar for:
        app.use express.static(__dirname + '/public')

### configure

Shortcut to `app.configure`. Accepts an object as param. Ex.:

    configure
      development: -> use 'foo'
      production: -> use 'bar'

### set

Shortcut to `app.set`. Accepts an object as param. Ex.:

    set foo: 'bar', ping: 'pong'

### enable

Shortcut to `app.enable`. Accepts multiple params in one go. Ex.:

    enable 'serve jquery', 'serve sammy'

### disable

Shortcut to `app.disable`. Accepts multiple params in one go. Ex.:

    disable 'serve jquery', 'serve sammy'

### global, process, console, setTimeout, clearTimeout, setInterval, clearInterval, require, \__filename, \__dirname, module

Node.js's global variables.

`require`, `module`, `__filename` and `__dirname` are not actually globals, but local to each module.
  
## REQUEST HANDLERS SCOPE

### @

All request input data is merged here.

### response

Directly from express.

### request

Directly from express.

### next

Directly from express.

### params

Alias to `@`.

### send

Shortcut to `response.send`.

### render

Shortcut to `response.render`.

Two additional features:

  - All data from `@`/`params` is automatically passed on to the template as `params`.
  
  - You can use `postrender`s: `render 'index', postrender: 'foo'`.

### redirect

Shortcut to `response.redirect`.

### session

Shortcut to `request.session`.

## SOCKETS HANDLERS SCOPE

### @

All input data is made accessible here.

### socket

Directly from socket.io.

### id

Shortcut to `socket.id`.

### params

Alias to `@`.

### client

You can put data pertaining to the client here. Alternative to `socket.set`.

### emit

Shortcut to `socket.emit`.

### broadcast

Shortcut to `socket.broadcast`.

## VIEW SCOPE

## CLIENT-SIDE ROOT SCOPE

### get, post, put, del

Routes with sammy.js.

### at

Event handlers with socket.io.

### helper

Same as its server-side counterpart.

### def

Same as its server-side counterpart.

## CLIENT-SIDE ROUTE HANDLERS SCOPE

## CLIENT-SIDE SOCKETS HANDLERS SCOPE

## APP SETTINGS

You can use the following options with `set`, `enable` and `disable`:

### serve zappa

Serves `/zappa/zappa.js`, required to use the zappa client API. Automatically enabled by `client` and `shared`.

### serve jquery

Serves `/zappa/jquery.js` (just standard, minified jQuery).

### serve sammy

Serves `/zappa/sammy.js` (just standard, minified Sammy).

### minify

Uses uglify-js to minify the outputs of `serve zappa`, `client`, `shared`, `coffee` and `js`.

### default layout

If enabled, zappa adds the following template with the name `layout`:

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