---
layout: default
title: 'Migration to 0.2.x: TL;DR guide'
permalink: /migration/index.html
---

# {{page.title}}

Commands

- Change `zappa app.coffee` to `coffee app.coffee`.

- Change `zappa -w app.coffee` to `npm install run -g` and `runjs app.coffee`.

- Change `zappa -c app.coffee` to `coffee -c app.coffee`.

Root Scope

- Add `require('zappa') ->` to apps.

- Add `@include = ->` to includes.

- Add `enable 'default template'` to use it.

- Add `use 'static'` to serve static files from `/public`.

- Add `use 'bodyParser', 'cookieParser', session: {secret: 'foo'}` to use them.

- Change `using` to `requiring`.

- Change `app().http_server` to `app`.

- Change `app().ws_server` to `io`.

- Change `view ->` and `render 'default'` to `view index: ->` and `render 'index'`.

- Change `layout ->` to `view layout: ->`.

- Change `msg foo: ->` to `at foo: ->`.

- Change `at disconnection: ->` to `at disconnect: ->`.

- Change `client 'path/to/foo': ->` to `coffee '/path/to/foo.js': ->`.

- Change `style 'path/to/foo': ->` to `css '/path/to/foo.css': ->`.

- Instead of `app 'chat'` etc, use:

        zappa 8001, ->
          get '/': 'chat'
        
        zappa 8002, ->
          get '/': 'wiki'

Request Scope

- Change `render 'foo', apply: 'bar'` to `render 'foo', postrender: 'bar'`.

Event (WebSockets) Scope

- Change `app.foo` to `def data: {foo: 'bar'}` and `data.foo`.

- Change `send` to `emit`.

Template Scope

- Change `@content` to `@body`.

Not implemented yet

- `route`.

- `render` in socket events.