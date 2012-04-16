(function() {
  var skeleton;

  skeleton = function() {
    var settings, zappa;
    zappa = window.zappa = {};
    zappa.version = null;
    settings = null;
    return zappa.run = function(func) {
      var app, context, h, helpers, name, route, ws_handlers, _fn;
      context = {};
      ws_handlers = {};
      helpers = {};
      if (typeof Sammy !== "undefined" && Sammy !== null) {
        app = context.app = Sammy();
      }
      context.get = function() {
        var k, v, _ref, _results;
        if (typeof arguments[0] !== 'object') {
          return route({
            path: arguments[0],
            handler: arguments[1]
          });
        } else {
          _ref = arguments[0];
          _results = [];
          for (k in _ref) {
            v = _ref[k];
            _results.push(route({
              path: k,
              handler: v
            }));
          }
          return _results;
        }
      };
      context.helper = function(obj) {
        var k, v, _results;
        _results = [];
        for (k in obj) {
          v = obj[k];
          _results.push(helpers[k] = v);
        }
        return _results;
      };
      context.on = function(obj) {
        var k, v, _results;
        _results = [];
        for (k in obj) {
          v = obj[k];
          _results.push(ws_handlers[k] = v);
        }
        return _results;
      };
      context.connect = function() {
        return context.socket = io.connect.apply(io, arguments);
      };
      context.emit = function() {
        var k, v, _ref, _results;
        if (typeof arguments[0] !== 'object') {
          return context.socket.emit.apply(context.socket, arguments);
        } else {
          _ref = arguments[0];
          _results = [];
          for (k in _ref) {
            v = _ref[k];
            _results.push(context.socket.emit.apply(context.socket, [k, v]));
          }
          return _results;
        }
      };
      route = function(r) {
        var ctx, helper, name;
        ctx = {
          app: app
        };
        for (name in helpers) {
          helper = helpers[name];
          ctx[name] = function() {
            return helper.apply(ctx, arguments);
          };
        }
        return app.get(r.path, function(sammy_context) {
          ctx.params = sammy_context.params;
          ctx.sammy_context = sammy_context;
          ctx.render = function() {
            return sammy_context.render.apply(sammy_context, arguments);
          };
          ctx.redirect = function() {
            return sammy_context.redirect.apply(sammy_context, arguments);
          };
          switch (settings['databag']) {
            case 'this':
              return r.handler.apply(sammy_context.params, [ctx]);
            case 'param':
              return r.handler.apply(ctx, [sammy_context.params]);
            default:
              return r.handler.apply(ctx, [ctx]);
          }
        });
      };
      func.apply(context, [context]);
      if (context.socket != null) {
        _fn = function(name, h) {
          return context.socket.on(name, function(data) {
            var ctx, helper, name, _fn2;
            ctx = {
              app: app,
              socket: context.socket,
              id: context.socket.id,
              data: data,
              emit: context.emit
            };
            _fn2 = function(name, helper) {
              return ctx[name] = function() {
                return helper.apply(ctx, arguments);
              };
            };
            for (name in helpers) {
              helper = helpers[name];
              _fn2(name, helper);
            }
            switch (settings['databag']) {
              case 'this':
                return h.apply(data, [ctx]);
              case 'param':
                return h.apply(ctx, [data]);
              default:
                return h.apply(ctx, [ctx]);
            }
          });
        };
        for (name in ws_handlers) {
          h = ws_handlers[name];
          _fn(name, h);
        }
      }
      if (app != null) {
        return $(function() {
          return app.run('#/');
        });
      }
    };
  };

  this.build = function(version, settings) {
    return String(skeleton).replace('version = null;', "version = '" + version + "';").replace('settings = null;', "var settings = " + (JSON.stringify(settings)) + ";");
  };

}).call(this);
