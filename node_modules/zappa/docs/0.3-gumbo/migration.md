---
layout: default
title: 'Migration to 0.3.x: TL;DR guide'
permalink: /migration/index.html
---

# {{page.title}}

- Change `get` to `@get` or `(foo) -> foo.get`. Same thing with all zappa-provided locals in all scopes: `view`, `render`, `emit`, etc.
- Change `at` to `@on`.
- Change `def foo: bar` to `foo = bar`.
- Change `zappa {foo}, ->` to `zappa ->`.
- Change `requiring 'foo', 'bar'` to `[foo, bar] = [require('foo'), require('bar')]`
- Change `postrender foo: ->` to `@postrender foo: ($) ->`

Data importing

- Change `get '/:foo': -> render @foo` to one of these alternatives:
  - `@get '/:foo': -> @render @params.foo`
  - `@get '/:foo': (c) -> @render c.params.foo`
  - `@set databag: 'param'; @get '/:foo': (d) -> @render d.foo`
  - `@set databag: 'context'; @get '/:foo': (c) -> c.render @foo`
  
Data exporting

- Change `get '/': -> @foo = 'bar'; render 'index'` to one of these alternatives:
  - `@get '/': -> @render index: {foo: 'bar'}`
  - `@set databag: 'param'; @get '/': (d) -> d.foo = 'bar'; @render 'index'`
  - `@set databag: 'context'; @get '/': (c) -> @foo = 'bar'; c.render 'index'`