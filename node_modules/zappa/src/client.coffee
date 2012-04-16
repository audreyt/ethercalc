# Client-side zappa.
skeleton = ->
  zappa = window.zappa = {}
  zappa.version = null

  settings = null

  zappa.run = (func) ->
    context = {}
    
    # Storage for the functions provided by the user.
    ws_handlers = {}
    helpers = {}

    app = context.app = Sammy() if Sammy?

    context.get = ->
      if typeof arguments[0] isnt 'object'
        route path: arguments[0], handler: arguments[1]
      else
        for k, v of arguments[0]
          route path: k, handler: v

    context.helper = (obj) ->
      for k, v of obj
        helpers[k] = v

    context.on = (obj) ->
      for k, v of obj
        ws_handlers[k] = v

    context.connect = ->
      context.socket = io.connect.apply io, arguments
      
    context.emit = ->
      if typeof arguments[0] isnt 'object'
        context.socket.emit.apply context.socket, arguments
      else
        for k, v of arguments[0]
          context.socket.emit.apply context.socket, [k, v]

    route = (r) ->
      ctx = {app}

      for name, helper of helpers
        ctx[name] = ->
          helper.apply(ctx, arguments)

      app.get r.path, (sammy_context) ->
        ctx.params = sammy_context.params
        ctx.sammy_context = sammy_context
        ctx.render = -> sammy_context.render.apply sammy_context, arguments
        ctx.redirect = -> sammy_context.redirect.apply sammy_context, arguments
        switch settings['databag']
          when 'this' then r.handler.apply(sammy_context.params, [ctx])
          when 'param' then r.handler.apply(ctx, [sammy_context.params])
          else r.handler.apply(ctx, [ctx])

    # GO!!!
    func.apply(context, [context])

    # Implements the websockets client with socket.io.
    if context.socket?
      for name, h of ws_handlers
        do (name, h) ->
          context.socket.on name, (data) ->
            ctx =
              app: app
              socket: context.socket
              id: context.socket.id
              data: data
              emit: context.emit

            for name, helper of helpers
              do (name, helper) ->
                ctx[name] = ->
                  helper.apply(ctx, arguments)

            switch settings['databag']
              when 'this' then h.apply(data, [ctx])
              when 'param' then h.apply(ctx, [data])
              else h.apply(ctx, [ctx])

    $(-> app.run '#/') if app?

@build = (version, settings) ->
  String(skeleton)
    .replace('version = null;', "version = '#{version}';")
    .replace('settings = null;', "var settings = #{JSON.stringify settings};")