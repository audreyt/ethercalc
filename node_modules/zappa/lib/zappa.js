(function() {
  var codename, coffeescript_helpers, copy_data_to, express, fs, jquery, jsdom, log, minify, path, sammy, socketio, uglify, uuid, views, zappa;
  var __slice = Array.prototype.slice, __hasProp = Object.prototype.hasOwnProperty, __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (__hasProp.call(this, i) && this[i] === item) return i; } return -1; };

  zappa = {
    version: '0.3.3'
  };

  codename = 'The Gumbo Variations';

  log = console.log;

  fs = require('fs');

  path = require('path');

  uuid = require('node-uuid');

  express = require('express');

  socketio = require('socket.io');

  jquery = fs.readFileSync(__dirname + '/../vendor/jquery-1.6.4.min.js').toString();

  sammy = fs.readFileSync(__dirname + '/../vendor/sammy-0.7.0.min.js').toString();

  uglify = require('uglify-js');

  jsdom = null;

  coffeescript_helpers = "var __slice = Array.prototype.slice;\nvar __hasProp = Object.prototype.hasOwnProperty;\nvar __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };\nvar __extends = function(child, parent) {\n  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }\n  function ctor() { this.constructor = child; }\n  ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype;\n  return child; };\nvar __indexOf = Array.prototype.indexOf || function(item) {\n  for (var i = 0, l = this.length; i < l; i++) {\n    if (this[i] === item) return i;\n  } return -1; };".replace(/\n/g, '');

  minify = function(js) {
    var ast;
    ast = uglify.parser.parse(js);
    ast = uglify.uglify.ast_mangle(ast);
    ast = uglify.uglify.ast_squeeze(ast);
    return uglify.uglify.gen_code(ast);
  };

  copy_data_to = function(recipient, sources) {
    var k, obj, v, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = sources.length; _i < _len; _i++) {
      obj = sources[_i];
      _results.push((function() {
        var _results2;
        _results2 = [];
        for (k in obj) {
          v = obj[k];
          if (!recipient[k]) {
            _results2.push(recipient[k] = v);
          } else {
            _results2.push(void 0);
          }
        }
        return _results2;
      })());
    }
    return _results;
  };

  views = {};

  express.View.prototype.__defineGetter__('exists', function() {
    var id, p;
    p = this.path.replace(this.root + '/', '');
    id = p.split('/')[0];
    if (views[p]) return true;
    p = p.replace(path.extname(p), '');
    if (views[p]) return true;
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
    if (views[p]) return views[p];
    p = p.replace(path.extname(p), '');
    if (views[p]) return views[p];
    p = this.path.replace(id + '/', '');
    return fs.readFileSync(p, 'utf8');
  });

  zappa.app = function(func) {
    var app, client, context, helpers, io, postrenders, route, verb, ws_handlers, zappa_used, _fn, _i, _len, _ref;
    context = {
      id: uuid(),
      zappa: zappa,
      express: express
    };
    context.root = path.dirname(module.parent.filename);
    ws_handlers = {};
    helpers = {};
    postrenders = {};
    app = context.app = express.createServer();
    io = context.io = socketio.listen(app);
    client = null;
    zappa_used = false;
    app.set('view engine', 'coffee');
    app.register('.coffee', zappa.adapter(require('coffeekup').adapters.express, {
      blacklist: ['format', 'autoescape', 'locals', 'hardcode', 'cache']
    }));
    app.set('views', path.join(context.root, '/views'));
    _ref = ['get', 'post', 'put', 'del'];
    _fn = function(verb) {
      return context[verb] = function() {
        var k, v, _ref2, _results;
        if (arguments.length > 1) {
          return route({
            verb: verb,
            path: arguments[0],
            handler: arguments[1]
          });
        } else {
          _ref2 = arguments[0];
          _results = [];
          for (k in _ref2) {
            v = _ref2[k];
            _results.push(route({
              verb: verb,
              path: k,
              handler: v
            }));
          }
          return _results;
        }
      };
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      verb = _ref[_i];
      _fn(verb);
    }
    context.client = function(obj) {
      var js, k, v, _results;
      if (!zappa_used) context.use('zappa');
      _results = [];
      for (k in obj) {
        v = obj[k];
        js = ";zappa.run(" + v + ");";
        if (app.settings['minify']) js = minify(js);
        _results.push(route({
          verb: 'get',
          path: k,
          handler: js,
          contentType: 'js'
        }));
      }
      return _results;
    };
    context.coffee = function(obj) {
      var js, k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        js = ";" + coffeescript_helpers + "(" + v + ")();";
        if (app.settings['minify']) js = minify(js);
        _results.push(route({
          verb: 'get',
          path: k,
          handler: js,
          contentType: 'js'
        }));
      }
      return _results;
    };
    context.js = function(obj) {
      var js, k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        js = String(v);
        if (app.settings['minify']) js = minify(js);
        _results.push(route({
          verb: 'get',
          path: k,
          handler: js,
          contentType: 'js'
        }));
      }
      return _results;
    };
    context.css = function(obj) {
      var css, k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        css = String(v);
        _results.push(route({
          verb: 'get',
          path: k,
          handler: css,
          contentType: 'css'
        }));
      }
      return _results;
    };
    context.stylus = function(obj) {
      var css, k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        _results.push(css = require('stylus').render(v, {
          filename: k
        }, function(err, css) {
          if (err) throw err;
          return route({
            verb: 'get',
            path: k,
            handler: css,
            contentType: 'css'
          });
        }));
      }
      return _results;
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
    context.postrender = function(obj) {
      var k, v, _results;
      jsdom = require('jsdom');
      _results = [];
      for (k in obj) {
        v = obj[k];
        _results.push(postrenders[k] = v);
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
    context.view = function(obj) {
      var k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        _results.push(views["" + context.id + "/" + k] = v);
      }
      return _results;
    };
    context.register = function(obj) {
      var k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        _results.push(app.register('.' + k, v));
      }
      return _results;
    };
    context.set = function(obj) {
      var k, v, _results;
      _results = [];
      for (k in obj) {
        v = obj[k];
        _results.push(app.set(k, v));
      }
      return _results;
    };
    context.enable = function() {
      var i, _j, _len2, _results;
      _results = [];
      for (_j = 0, _len2 = arguments.length; _j < _len2; _j++) {
        i = arguments[_j];
        _results.push(app.enable(i));
      }
      return _results;
    };
    context.disable = function() {
      var i, _j, _len2, _results;
      _results = [];
      for (_j = 0, _len2 = arguments.length; _j < _len2; _j++) {
        i = arguments[_j];
        _results.push(app.disable(i));
      }
      return _results;
    };
    context.use = function() {
      var a, k, use, v, zappa_middleware, _j, _len2, _results;
      zappa_middleware = {
        static: function(p) {
          if (p == null) p = path.join(context.root, '/public');
          return express.static(p);
        },
        zappa: function() {
          return function(req, res, next) {
            var send;
            send = function(code) {
              res.contentType('js');
              return res.send(code);
            };
            if (req.method.toUpperCase() !== 'GET') {
              return next();
            } else {
              switch (req.url) {
                case '/zappa/zappa.js':
                  return send(client);
                case '/zappa/jquery.js':
                  return send(jquery);
                case '/zappa/sammy.js':
                  return send(sammy);
                default:
                  return next();
              }
            }
          };
        }
      };
      use = function(name, arg) {
        if (arg == null) arg = null;
        if (name === 'zappa') zappa_used = true;
        if (zappa_middleware[name]) {
          return app.use(zappa_middleware[name](arg));
        } else if (typeof express[name] === 'function') {
          return app.use(express[name](arg));
        }
      };
      _results = [];
      for (_j = 0, _len2 = arguments.length; _j < _len2; _j++) {
        a = arguments[_j];
        switch (typeof a) {
          case 'function':
            _results.push(app.use(a));
            break;
          case 'string':
            _results.push(use(a));
            break;
          case 'object':
            _results.push((function() {
              var _results2;
              _results2 = [];
              for (k in a) {
                v = a[k];
                _results2.push(use(k, v));
              }
              return _results2;
            })());
            break;
          default:
            _results.push(void 0);
        }
      }
      return _results;
    };
    context.configure = function(p) {
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
    context.settings = app.settings;
    context.shared = function(obj) {
      var js, k, v, _results;
      if (!zappa_used) context.use('zappa');
      _results = [];
      for (k in obj) {
        v = obj[k];
        js = ";zappa.run(" + v + ");";
        if (app.settings['minify']) js = minify(js);
        route({
          verb: 'get',
          path: k,
          handler: js,
          contentType: 'js'
        });
        _results.push(v.apply(context, [context]));
      }
      return _results;
    };
    context.include = function(p) {
      var sub;
      sub = require(path.join(context.root, p));
      return sub.include.apply(context, [context]);
    };
    route = function(r) {
      if (typeof r.handler === 'string') {
        return app[r.verb](r.path, function(req, res) {
          if (r.contentType != null) res.contentType(r.contentType);
          return res.send(r.handler);
        });
      } else {
        return app[r.verb](r.path, function(req, res, next) {
          var ctx, data, helper, name, render, result, _fn2;
          ctx = {
            app: app,
            settings: app.settings,
            request: req,
            query: req.query,
            params: req.params,
            body: req.body,
            session: req.session,
            response: res,
            next: next,
            send: function() {
              return res.send.apply(res, arguments);
            },
            redirect: function() {
              return res.redirect.apply(res, arguments);
            },
            render: function() {
              var k, v, _ref2, _results;
              if (typeof arguments[0] !== 'object') {
                return render.apply(this, arguments);
              } else {
                _ref2 = arguments[0];
                _results = [];
                for (k in _ref2) {
                  v = _ref2[k];
                  _results.push(render.apply(this, [k, v]));
                }
                return _results;
              }
            }
          };
          render = function() {
            var args, _ref2;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            args[0] = context.id + '/' + args[0];
            if ((_ref2 = args[1]) == null) args[1] = {};
            if (typeof args[1] === 'function') args.splice(1, 0, {});
            if (app.settings['databag']) args[1].params = data;
            if (args[1].postrender != null) {
              return res.render(args[0], args[1], function(err, str) {
                return jsdom.env({
                  html: str,
                  src: [jquery],
                  done: function(err, window) {
                    var doctype, rendered;
                    ctx.window = window;
                    rendered = postrenders[args[1].postrender].apply(ctx, [window.$, ctx]);
                    doctype = (window.document.doctype || '') + "\n";
                    return res.send(doctype + window.document.documentElement.outerHTML);
                  }
                });
              });
            } else {
              return res.render.apply(res, args);
            }
          };
          _fn2 = function(name, helper) {
            return ctx[name] = function() {
              var args;
              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              args.push(ctx);
              return helper.apply(ctx, args);
            };
          };
          for (name in helpers) {
            helper = helpers[name];
            _fn2(name, helper);
          }
          if (app.settings['databag']) {
            data = {};
            copy_data_to(data, [req.query, req.params, req.body]);
          }
          switch (app.settings['databag']) {
            case 'this':
              result = r.handler.apply(data, [ctx]);
              break;
            case 'param':
              result = r.handler.apply(ctx, [data]);
              break;
            default:
              result = r.handler.apply(ctx, [ctx]);
          }
          if (r.contentType != null) res.contentType(r.contentType);
          if (typeof result === 'string') {
            return res.send(result);
          } else {
            return result;
          }
        });
      }
    };
    io.sockets.on('connection', function(socket) {
      var build_ctx, c, ctx, h, name, _results;
      c = {};
      build_ctx = function() {
        var ctx, helper, name, _fn2;
        ctx = {
          app: app,
          io: io,
          settings: app.settings,
          socket: socket,
          id: socket.id,
          client: c,
          emit: function() {
            var k, v, _ref2, _results;
            if (typeof arguments[0] !== 'object') {
              return socket.emit.apply(socket, arguments);
            } else {
              _ref2 = arguments[0];
              _results = [];
              for (k in _ref2) {
                v = _ref2[k];
                _results.push(socket.emit.apply(socket, [k, v]));
              }
              return _results;
            }
          },
          broadcast: function() {
            var k, v, _ref2, _results;
            if (typeof arguments[0] !== 'object') {
              return socket.broadcast.emit.apply(socket.broadcast, arguments);
            } else {
              _ref2 = arguments[0];
              _results = [];
              for (k in _ref2) {
                v = _ref2[k];
                _results.push(socket.broadcast.emit.apply(socket.broadcast, [k, v]));
              }
              return _results;
            }
          }
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
        return ctx;
      };
      ctx = build_ctx();
      if (ws_handlers.connection != null) ws_handlers.connection.apply(ctx, [ctx]);
      socket.on('disconnect', function() {
        ctx = build_ctx();
        if (ws_handlers.disconnect != null) {
          return ws_handlers.disconnect.apply(ctx, [ctx]);
        }
      });
      _results = [];
      for (name in ws_handlers) {
        h = ws_handlers[name];
        _results.push((function(name, h) {
          if (name !== 'connection' && name !== 'disconnect') {
            return socket.on(name, function(data) {
              ctx = build_ctx();
              ctx.data = data;
              switch (app.settings['databag']) {
                case 'this':
                  return h.apply(data, [ctx]);
                case 'param':
                  return h.apply(ctx, [data]);
                default:
                  return h.apply(ctx, [ctx]);
              }
            });
          }
        })(name, h));
      }
      return _results;
    });
    func.apply(context, [context]);
    client = require('./client').build(zappa.version, app.settings);
    client = ";" + coffeescript_helpers + "(" + client + ")();";
    if (app.settings['minify']) client = minify(client);
    if (app.settings['default layout']) {
      context.view({
        layout: function() {
          doctype(5);
          return html(function() {
            head(function() {
              var s, _j, _k, _len2, _len3, _ref2, _ref3;
              if (this.title) title(this.title);
              if (this.scripts) {
                _ref2 = this.scripts;
                for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                  s = _ref2[_j];
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
                _ref3 = this.stylesheets;
                for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
                  s = _ref3[_k];
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
              if (this.style) return style(this.style);
            });
            return body(this.body);
          });
        }
      });
    }
    return context;
  };

  zappa.run = function() {
    var a, app, host, port, root_function, zapp, _i, _len, _ref;
    host = null;
    port = 3000;
    root_function = null;
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
      }
    }
    zapp = zappa.app(root_function);
    app = zapp.app;
    if (host) {
      app.listen(port, host);
    } else {
      app.listen(port);
    }
    log('Express server listening on port %d in %s mode', (_ref = app.address()) != null ? _ref.port : void 0, app.settings.env);
    log("Zappa " + zappa.version + " \"" + codename + "\" orchestrating the show");
    return zapp;
  };

  zappa.adapter = function(engine, options) {
    var _ref;
    if (options == null) options = {};
    if ((_ref = options.blacklist) == null) options.blacklist = [];
    if (typeof engine === 'string') engine = require(engine);
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
