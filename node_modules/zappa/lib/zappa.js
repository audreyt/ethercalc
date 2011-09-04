(function() {
  var client, coffeescript_helpers, express, fs, jquery, jsdom, log, path, rewrite_function, sammy, select, socketio, uuid, views, zappa, _;
  var __slice = Array.prototype.slice, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  zappa = {
    version: '0.2.0beta2'
  };
  log = console.log;
  fs = require('fs');
  path = require('path');
  _ = require('underscore');
  uuid = require('node-uuid');
  express = require('express');
  socketio = require('socket.io');
  jsdom = require('jsdom');
  jquery = fs.readFileSync(__dirname + '/../node_modules/jquery/dist/node-jquery.min.js').toString();
  sammy = fs.readFileSync(__dirname + '/../vendor/sammy-latest.min.js').toString();
  coffeescript_helpers = "var __slice = Array.prototype.slice;\nvar __hasProp = Object.prototype.hasOwnProperty;\nvar __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };\nvar __extends = function(child, parent) {\n  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }\n  function ctor() { this.constructor = child; }\n  ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype;\n  return child; };\nvar __indexOf = Array.prototype.indexOf || function(item) {\n  for (var i = 0, l = this.length; i < l; i++) {\n    if (this[i] === item) return i;\n  } return -1; };".replace(/\n/g, '');
  rewrite_function = function(func, locals_names) {
    var code, name, _i, _len;
    code = String(func);
    if (!code.indexOf('function' === 0)) {
      code = "function () {" + code + "}";
    }
    code = "" + coffeescript_helpers + "return (" + code + ").apply(context, args);";
    for (_i = 0, _len = locals_names.length; _i < _len; _i++) {
      name = locals_names[_i];
      code = ("var " + name + " = locals." + name + ";") + code;
    }
    return new Function('context', 'locals', 'args', code);
  };
  select = function(names, scopes) {
    var i;
    return _.union((function() {
      var _i, _len, _ref, _results;
      _ref = scopes.split(' + ');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        _results.push(names[i]);
      }
      return _results;
    })());
  };
  client = require('./client').build(zappa.version, coffeescript_helpers, rewrite_function);
  views = {};
  express.View.prototype.__defineGetter__('exists', function() {
    var id, p;
    p = this.path.replace(this.root + '/', '');
    id = p.split('/')[0];
    if (views[p]) {
      return true;
    }
    p = p.replace(path.extname(p), '');
    if (views[p]) {
      return true;
    }
    p = this.path.replace(id + '/', '');
    try {
      fs.statSync(p);
      return true;
    } catch (err) {
      return false;
    }
  });
  express.View.prototype.__defineGetter__('contents', function() {
    var id, p;
    p = this.path.replace(this.root + '/', '');
    id = p.split('/')[0];
    if (views[p]) {
      return views[p];
    }
    p = p.replace(path.extname(p), '');
    if (views[p]) {
      return views[p];
    }
    p = this.path.replace(id + '/', '');
    return fs.readFileSync(p, 'utf8');
  });
  zappa.app = function() {
    var a, app, defs, dir, externals, g, helpers, id, io, k, names, postrenders, r, rewritten_root, root_context, root_function, root_locals, routes, v, verb, ws_handlers, _fn, _fn2, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _ref3;
    id = uuid();
    externals = null;
    root_function = null;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      a = arguments[_i];
      switch (typeof a) {
        case 'function':
          root_function = a;
          break;
        case 'object':
          externals = a;
      }
    }
    names = {
      globals: ['global', 'process', 'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'require', 'module', '__filename', '__dirname'],
      root: ['zappa', 'express', 'app', 'io', 'requiring', 'get', 'post', 'put', 'del', 'at', 'helper', 'def', 'view', 'set', 'use', 'configure', 'include', 'shared', 'client', 'coffee', 'js', 'css', 'stylus', 'enable', 'disable', 'settings', 'postrender'],
      http: ['app', 'settings', 'response', 'request', 'next', 'params', 'send', 'render', 'redirect'],
      ws: ['app', 'io', 'settings', 'socket', 'id', 'params', 'client', 'emit', 'broadcast'],
      postrender: ['window', '$'],
      externals: (function() {
        var _results;
        _results = [];
        for (k in externals) {
          v = externals[k];
          _results.push(k);
        }
        return _results;
      })(),
      helpers: [],
      defs: []
    };
    routes = [];
    ws_handlers = {};
    helpers = {};
    defs = {};
    postrenders = {};
    app = express.createServer();
    io = socketio.listen(app);
    app.set('view engine', 'coffee');
    app.register('.coffee', zappa.adapter(require('coffeekup').adapters.express, {
      blacklist: ['format', 'autoescape', 'locals', 'hardcode', 'cache']
    }));
    root_context = {};
    root_locals = {
      zappa: zappa,
      express: express,
      app: app,
      io: io
    };
    _ref = names.globals;
    for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
      g = _ref[_j];
      root_locals[g] = eval(g);
    }
    root_locals.module = module.parent;
    root_locals.__filename = module.parent.filename;
    root_locals.__dirname = path.dirname(module.parent.filename);
    _ref2 = module.parent.paths;
    for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
      dir = _ref2[_k];
      require.paths.unshift(dir);
    }
    require.paths.unshift(root_locals.__dirname);
    _ref3 = ['get', 'post', 'put', 'del'];
    _fn = function(verb) {
      return root_locals[verb] = function() {
        var k, v, _ref4, _results;
        if (typeof arguments[0] !== 'object') {
          return routes.push({
            verb: verb,
            path: arguments[0],
            handler: arguments[1]
          });
        } else {
          _ref4 = arguments[0];
          _results = [];
          for (k in _ref4) {
            v = _ref4[k];
            _results.push(routes.push({
              verb: verb,
              path: k,
              handler: v
            }));
          }
          return _results;
        }
      };
    };
    for (_l = 0, _len4 = _ref3.length; _l < _len4; _l++) {
      verb = _ref3[_l];
      _fn(verb);
    }
    root_locals.client = function(obj) {
      var js, k, v, _results;
      app.enable('serve zappa');
      _results = [];
      for (k in obj) {
        v = obj[k];
        js = ";zappa.run(" + v + ");";
        _results.push(routes.push({
          verb: 'get',
          path: k,
          handler: js,
          contentType: 'js'
        }));
      }
      return _results;
    };
    root_locals.coffee = function(obj) {
      var js, k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        js = ";" + coffeescript_helpers + "(" + v + ")();";
        _results.push(routes.push({
          verb: 'get',
          path: k,
          handler: js,
          contentType: 'js'
        }));
      }
      return _results;
    };
    root_locals.js = function(obj) {
      var js, k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        js = String(v);
        _results.push(routes.push({
          verb: 'get',
          path: k,
          handler: js,
          contentType: 'js'
        }));
      }
      return _results;
    };
    root_locals.css = function(obj) {
      var css, k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        css = String(v);
        _results.push(routes.push({
          verb: 'get',
          path: k,
          handler: css,
          contentType: 'css'
        }));
      }
      return _results;
    };
    root_locals.stylus = function(obj) {
      var css, k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        _results.push(css = require('stylus').render(v, {
          filename: k
        }, function(err, css) {
          if (err) {
            throw err;
          }
          return routes.push({
            verb: 'get',
            path: k,
            handler: css,
            contentType: 'css'
          });
        }));
      }
      return _results;
    };
    root_locals.helper = function(obj) {
      var k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        names.helpers.push(k);
        _results.push(helpers[k] = v);
      }
      return _results;
    };
    root_locals.def = function(obj) {
      var k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        names.defs.push(k);
        _results.push(defs[k] = v);
      }
      return _results;
    };
    root_locals.postrender = function(obj) {
      var k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        _results.push(postrenders[k] = v);
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
    root_locals.view = function(obj) {
      var k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        _results.push(views["" + id + "/" + k] = v);
      }
      return _results;
    };
    root_locals.set = function(obj) {
      var k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        _results.push(app.set(k, v));
      }
      return _results;
    };
    root_locals.enable = function() {
      var i, _len5, _m, _results;
      _results = [];
      for (_m = 0, _len5 = arguments.length; _m < _len5; _m++) {
        i = arguments[_m];
        _results.push(app.enable(i));
      }
      return _results;
    };
    root_locals.disable = function() {
      var i, _len5, _m, _results;
      _results = [];
      for (_m = 0, _len5 = arguments.length; _m < _len5; _m++) {
        i = arguments[_m];
        _results.push(app.disable(i));
      }
      return _results;
    };
    root_locals.use = function() {
      var a, k, use, v, wrappers, _len5, _m, _results;
      wrappers = {
        static: function(path) {
          if (path == null) {
            path = root_locals.__dirname + '/public';
          }
          return express.static(path);
        }
      };
      use = function(name, arg) {
        if (arg == null) {
          arg = null;
        }
        if (wrappers[name]) {
          return app.use(wrappers[name](arg));
        } else if (typeof express[name] === 'function') {
          return app.use(express[name](arg));
        }
      };
      _results = [];
      for (_m = 0, _len5 = arguments.length; _m < _len5; _m++) {
        a = arguments[_m];
        _results.push((function() {
          var _results2;
          switch (typeof a) {
            case 'function':
              return app.use(a);
            case 'string':
              return use(a);
            case 'object':
              _results2 = [];
              for (k in a) {
                v = a[k];
                _results2.push(use(k, v));
              }
              return _results2;
          }
        })());
      }
      return _results;
    };
    root_locals.requiring = function() {
      var a, pairs, _len5, _m;
      pairs = {};
      for (_m = 0, _len5 = arguments.length; _m < _len5; _m++) {
        a = arguments[_m];
        pairs[a] = require(a);
      }
      return root_locals.def(pairs);
    };
    root_locals.configure = function(p) {
      var k, v, _results;
      if (typeof p === 'function') {
        return app.configure(p);
      } else {
        _results = [];
        for (k in p) {
          v = p[k];
          _results.push(app.configure(k, v));
        }
        return _results;
      }
    };
    root_locals.settings = app.settings;
    root_locals.shared = function(obj) {
      var js, k, rewritten_shared, v, _results;
      app.enable('serve zappa');
      _results = [];
      for (k in obj) {
        v = obj[k];
        js = ";zappa.run(" + v + ");";
        routes.push({
          verb: 'get',
          path: k,
          handler: js,
          contentType: 'js'
        });
        rewritten_shared = rewrite_function(v, select(names, 'globals + root + externals'));
        _results.push(rewritten_shared(root_context, root_locals));
      }
      return _results;
    };
    root_locals.include = function(name) {
      var include_locals, include_module, k, rewritten_sub, sub, v;
      sub = root_locals.require(name);
      rewritten_sub = rewrite_function(sub.include, select(names, 'globals + root + externals'));
      include_locals = {};
      for (k in root_locals) {
        v = root_locals[k];
        include_locals[k] = v;
      }
      include_module = require.cache[require.resolve(name)];
      include_locals.module = include_module;
      include_locals.__filename = include_module.filename;
      include_locals.__dirname = path.dirname(include_module.filename);
      return rewritten_sub(root_context, include_locals);
    };
    for (k in externals) {
      v = externals[k];
      root_locals[k] = v;
    }
    rewritten_root = rewrite_function(root_function, select(names, 'globals + root + externals'));
    rewritten_root(root_context, root_locals);
    for (k in helpers) {
      v = helpers[k];
      helpers[k] = rewrite_function(v, select(names, 'globals + http + externals + helpers + defs'));
    }
    for (k in ws_handlers) {
      v = ws_handlers[k];
      ws_handlers[k] = rewrite_function(v, select(names, 'globals + ws + externals + helpers + defs'));
    }
    for (k in postrenders) {
      v = postrenders[k];
      postrenders[k] = rewrite_function(v, select(names, 'globals + postrender + externals + helpers + defs'));
    }
    if (app.settings['serve zappa']) {
      app.get('/zappa/zappa.js', function(req, res) {
        res.contentType('js');
        return res.send(";" + coffeescript_helpers + "(" + client + ")();");
      });
    }
    if (app.settings['serve jquery']) {
      app.get('/zappa/jquery.js', function(req, res) {
        res.contentType('js');
        return res.send(jquery);
      });
    }
    if (app.settings['serve sammy']) {
      app.get('/zappa/sammy.js', function(req, res) {
        res.contentType('js');
        return res.send(sammy);
      });
    }
    if (app.settings['default layout']) {
      views.layout = function() {
        doctype(5);
        return html(function() {
          head(function() {
            var s, _len5, _len6, _m, _n, _ref4, _ref5;
            if (this.title) {
              title(this.title);
            }
            if (this.scripts) {
              _ref4 = this.scripts;
              for (_m = 0, _len5 = _ref4.length; _m < _len5; _m++) {
                s = _ref4[_m];
                script({
                  src: s + '.js'
                });
              }
            }
            if (this.script) {
              script({
                src: this.script + '.js'
              });
            }
            if (this.stylesheets) {
              _ref5 = this.stylesheets;
              for (_n = 0, _len6 = _ref5.length; _n < _len6; _n++) {
                s = _ref5[_n];
                link({
                  rel: 'stylesheet',
                  href: s + '.css'
                });
              }
            }
            if (this.stylesheet) {
              link({
                rel: 'stylesheet',
                href: this.stylesheet + '.css'
              });
            }
            if (this.style) {
              return style(this.style);
            }
          });
          return body(this.body);
        });
      };
    }
    _fn2 = function(r) {
      var context, def, e, g, helper, locals, name, rewritten_handler, _fn3, _len6, _len7, _n, _o, _ref4, _ref5;
      if (typeof r.handler === 'string') {
        return app[r.verb](r.path, function(req, res) {
          if (r.contentType != null) {
            res.contentType(r.contentType);
          }
          return res.send(r.handler);
        });
      } else {
        rewritten_handler = rewrite_function(r.handler, select(names, 'globals + http + externals + helpers + defs'));
        context = null;
        locals = {
          app: app,
          settings: app.settings
        };
        _ref4 = names.globals;
        for (_n = 0, _len6 = _ref4.length; _n < _len6; _n++) {
          g = _ref4[_n];
          locals[g] = eval(g);
        }
        _ref5 = names.externals;
        for (_o = 0, _len7 = _ref5.length; _o < _len7; _o++) {
          e = _ref5[_o];
          locals[e] = externals[e];
        }
        for (name in defs) {
          def = defs[name];
          locals[name] = def;
        }
        _fn3 = function(name, helper) {
          return locals[name] = function() {
            return helper(context, locals, arguments);
          };
        };
        for (name in helpers) {
          helper = helpers[name];
          _fn3(name, helper);
        }
        return app[r.verb](r.path, function(req, res, next) {
          var k, result, v, _ref6, _ref7, _ref8;
          context = {};
          _ref6 = req.query;
          for (k in _ref6) {
            v = _ref6[k];
            context[k] = v;
          }
          _ref7 = req.params;
          for (k in _ref7) {
            v = _ref7[k];
            context[k] = v;
          }
          _ref8 = req.body;
          for (k in _ref8) {
            v = _ref8[k];
            context[k] = v;
          }
          locals.params = context;
          locals.request = req;
          locals.response = res;
          locals.next = next;
          locals.send = function() {
            return res.send.apply(res, arguments);
          };
          locals.redirect = function() {
            return res.redirect.apply(res, arguments);
          };
          locals.render = function() {
            var args, _base, _ref10, _ref9;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            args[0] = id + '/' + args[0];
            if ((_ref9 = args[1]) == null) {
              args[1] = {};
            }
            if (typeof args[1] === 'function') {
              args.splice(1, 0, {});
            }
            if ((_ref10 = (_base = args[1]).params) == null) {
              _base.params = locals.params;
            }
            if (args[1].postrender != null) {
              return res.render(args[0], args[1], function(err, str) {
                return jsdom.env({
                  html: str,
                  src: [jquery],
                  done: function(err, window) {
                    var doctype, rendered;
                    locals.window = window;
                    locals.$ = window.$;
                    rendered = postrenders[args[1].postrender](context, locals);
                    doctype = (window.document.doctype || '') + "\n";
                    return res.send(doctype + window.document.documentElement.outerHTML);
                  }
                });
              });
            } else {
              return res.render.apply(res, args);
            }
          };
          result = rewritten_handler(context, locals);
          if (r.contentType != null) {
            res.contentType(r.contentType);
          }
          if (typeof result === 'string') {
            return res.send(result);
          } else {
            return result;
          }
        });
      }
    };
    for (_m = 0, _len5 = routes.length; _m < _len5; _m++) {
      r = routes[_m];
      _fn2(r);
    }
    io.sockets.on('connection', function(socket) {
      var context, def, e, g, h, helper, locals, name, _len6, _len7, _n, _o, _ref4, _ref5, _results;
      context = {};
      locals = {
        app: app,
        io: io,
        settings: app.settings,
        socket: socket,
        id: socket.id,
        client: {},
        emit: function() {
          return socket.emit.apply(socket, arguments);
        },
        broadcast: function() {
          return socket.broadcast.emit.apply(socket.broadcast, arguments);
        }
      };
      _ref4 = names.globals;
      for (_n = 0, _len6 = _ref4.length; _n < _len6; _n++) {
        g = _ref4[_n];
        locals[g] = eval(g);
      }
      _ref5 = names.externals;
      for (_o = 0, _len7 = _ref5.length; _o < _len7; _o++) {
        e = _ref5[_o];
        locals[e] = externals[e];
      }
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
      if (ws_handlers.connection != null) {
        ws_handlers.connection(context, locals);
      }
      socket.on('disconnect', function() {
        context = {};
        if (ws_handlers.disconnect != null) {
          return ws_handlers.disconnect(context, locals);
        }
      });
      _results = [];
      for (name in ws_handlers) {
        h = ws_handlers[name];
        _results.push((function(name, h) {
          if (name !== 'connection' && name !== 'disconnect') {
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
          }
        })(name, h));
      }
      return _results;
    });
    return {
      id: id,
      app: app,
      io: io
    };
  };
  zappa.run = function() {
    var a, app, externals, host, port, root_function, zapp, _i, _len;
    host = null;
    port = 3000;
    root_function = null;
    externals = null;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      a = arguments[_i];
      switch (typeof a) {
        case 'string':
          if (isNaN(Number(a))) {
            host = a;
          } else {
            port = Number(a);
          }
          break;
        case 'number':
          port = a;
          break;
        case 'function':
          root_function = a;
          break;
        case 'object':
          externals = a;
      }
    }
    zapp = zappa.app(externals, root_function);
    app = zapp.app;
    if (host) {
      app.listen(port, host);
    } else {
      app.listen(port);
    }
    log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);
    log("Zappa " + zappa.version + " orchestrating the show");
    return zapp;
  };
  zappa.adapter = function(engine, options) {
    var _ref;
    if (options == null) {
      options = {};
    }
    if ((_ref = options.blacklist) == null) {
      options.blacklist = [];
    }
    if (typeof engine === 'string') {
      engine = require(engine);
    }
    return {
      compile: function(template, data) {
        template = engine.compile(template, data);
        return function(data) {
          var k, v, _ref2;
          _ref2 = data.params;
          for (k in _ref2) {
            v = _ref2[k];
            if (typeof data[k] === 'undefined' && __indexOf.call(options.blacklist, k) < 0) {
              data[k] = v;
            }
          }
          return template(data);
        };
      }
    };
  };
  module.exports = zappa.run;
  module.exports.run = zappa.run;
  module.exports.app = zappa.app;
  module.exports.adapter = zappa.adapter;
  module.exports.version = zappa.version;
}).call(this);
