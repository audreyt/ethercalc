(function() {
  var skeleton;
  skeleton = function() {
    var coffeescript_helpers, rewrite_function, zappa;
    zappa = window.zappa = {};
    zappa.version = null;
    coffeescript_helpers = null;
    rewrite_function = null;
    return zappa.run = function(root_function) {
      var app, context, def, defs, defs_names, h, helper, helpers, helpers_names, k, locals, name, r, rewritten_root, root_context, root_locals, root_locals_names, routes, sammy_locals_names, socket, v, ws_handlers, ws_locals_names, _fn, _fn2, _fn3, _i, _len;
      root_locals_names = ['app', 'socket', 'def', 'helper', 'get', 'connect', 'at', 'emit'];
      sammy_locals_names = ['app', 'context', 'params', 'render', 'redirect'];
      ws_locals_names = ['app', 'socket', 'id', 'params', 'emit'];
      helpers_names = [];
      defs_names = [];
      routes = [];
      ws_handlers = {};
      helpers = {};
      defs = {};
      if (typeof Sammy !== "undefined" && Sammy !== null) {
        app = Sammy();
      }
      socket = null;
      root_context = {};
      root_locals = {
        app: app,
        socket: socket
      };
      root_locals.get = function() {
        var k, v, _ref, _results;
        if (typeof arguments[0] !== 'object') {
          return routes.push({
            path: arguments[0],
            handler: arguments[1]
          });
        } else {
          _ref = arguments[0];
          _results = [];
          for (k in _ref) {
            v = _ref[k];
            _results.push(routes.push({
              path: k,
              handler: v
            }));
          }
          return _results;
        }
      };
      root_locals.helper = function(obj) {
        var k, v, _results;
        _results = [];
        for (k in obj) {
          v = obj[k];
          helpers_names.push(k);
          _results.push(helpers[k] = v);
        }
        return _results;
      };
      root_locals.def = function(obj) {
        var k, v, _results;
        _results = [];
        for (k in obj) {
          v = obj[k];
          defs_names.push(k);
          _results.push(defs[k] = v);
        }
        return _results;
      };
      root_locals.at = function(obj) {
        var k, v, _results;
        _results = [];
        for (k in obj) {
          v = obj[k];
          _results.push(ws_handlers[k] = v);
        }
        return _results;
      };
      root_locals.connect = function() {
        return socket = io.connect.apply(io, arguments);
      };
      root_locals.emit = function() {
        return socket.emit.apply(socket, arguments);
      };
      rewritten_root = rewrite_function(root_function, root_locals_names);
      rewritten_root(root_context, root_locals);
      for (k in helpers) {
        v = helpers[k];
        helpers[k] = rewrite_function(v, sammy_locals_names.concat(helpers_names).concat(defs_names));
      }
      for (k in ws_handlers) {
        v = ws_handlers[k];
        ws_handlers[k] = rewrite_function(v, ws_locals_names.concat(helpers_names).concat(defs_names));
      }
      _fn = function(r) {
        var context, def, helper, locals, name, rewritten_handler;
        rewritten_handler = rewrite_function(r.handler, sammy_locals_names.concat(helpers_names).concat(defs_names));
        context = null;
        locals = {
          app: app
        };
        for (name in defs) {
          def = defs[name];
          locals[name] = def;
        }
        for (name in helpers) {
          helper = helpers[name];
          locals[name] = function() {
            return helper(context, locals, arguments);
          };
        }
        return app.get(r.path, function(sammy_context) {
          var k, v, _ref;
          context = {};
          _ref = sammy_context.params;
          for (k in _ref) {
            v = _ref[k];
            context[k] = v;
          }
          locals.params = context;
          locals.context = sammy_context;
          locals.render = function() {
            return sammy_context.render.apply(res, arguments);
          };
          locals.redirect = function() {
            return sammy_context.redirect.apply(res, arguments);
          };
          return rewritten_handler(context, locals);
        });
      };
      for (_i = 0, _len = routes.length; _i < _len; _i++) {
        r = routes[_i];
        _fn(r);
      }
      if (socket != null) {
        context = {};
        locals = {
          app: app,
          socket: socket,
          id: socket.id,
          emit: function() {
            return socket.emit.apply(socket, arguments);
          }
        };
        for (name in defs) {
          def = defs[name];
          locals[name] = def;
        }
        _fn2 = function(name, helper) {
          return locals[name] = function() {
            return helper(context, locals, arguments);
          };
        };
        for (name in helpers) {
          helper = helpers[name];
          _fn2(name, helper);
        }
        _fn3 = function(name, h) {
          return socket.on(name, function(data) {
            var k, v;
            context = {};
            for (k in data) {
              v = data[k];
              context[k] = v;
            }
            locals.params = context;
            return h(context, locals);
          });
        };
        for (name in ws_handlers) {
          h = ws_handlers[name];
          _fn3(name, h);
        }
      }
      if (app != null) {
        return $(function() {
          return app.run('#/');
        });
      }
    };
  };
  this.build = function(version, coffeescript_helpers, rewrite_function) {
    return String(skeleton).replace('version = null;', "version = '" + version + "';").replace('coffeescript_helpers = null;', "var coffeescript_helpers = '" + coffeescript_helpers + "';").replace('rewrite_function = null;', "var rewrite_function = " + rewrite_function + ";").replace(/(\n)/g, '');
  };
}).call(this);
