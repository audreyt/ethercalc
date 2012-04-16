---
layout: default
title: v0.3.x "The Gumbo Variations"
permalink: /announcement/index.html
---

# {{page.title}}

Moving further with smoothing out the rough edges, 0.3.0 restores **normal JS scope** and **meaningful stack traces** by [doing away with function rewriting](https://github.com/mauricemach/zappa/issues/74), replacing the "magic locals" of 0.2.x with properties of `this` (and its CoffeeScript alias `@`).

So, the following 0.2.x snippet:

{% highlight coffeescript %}
require('zappa') ->
  get '/': -> render 'index'
  at connection: -> emit 'welcome'
{% endhighlight %}

In 0.3.x becomes:

{% highlight coffeescript %}
require('zappa') ->
  @get '/': -> @render 'index'
  @on connection: -> @emit 'welcome'
{% endhighlight %}

Also, an alternative reference is available as a parameter:

{% highlight coffeescript %}
require('zappa') (foo) ->
  foo.get '/': (bar) -> bar.render 'index'
  foo.on connection: (bar) -> bar.emit 'welcome'
{% endhighlight %}

When using the `@`-based API, keep in mind fat arrows may be necessary:

{% highlight coffeescript %}
require('zappa') ->
  @get '/': ->
    require('fs').readFile 'file.txt', 'utf-8', (err, txt) =>
      @send txt
{% endhighlight %}

## OK, so what do I get for prepending those `@`s everywhere?

First, a **normal JavaScript scope**, with closures. Say goodbye to `def` & friends:

{% highlight coffeescript %}
foo = 'bar'
require('zappa') ->
  ping = 'pong'
  @get '/': -> foo + ping
{% endhighlight %}

The equivalent in 0.2.x was:

{% highlight coffeescript %}
foo = 'bar'
require('zappa') {foo}, ->
  def ping: 'pong'
  get '/': -> foo + ping
{% endhighlight %}

A normal scope also means we reclaim file-specific node.js variables such as `require` and `__filename`. In 0.2.x, those were lost in the function-rewriting process. Rough replacements were provided, but they weren't valid in all contexts, and the only way to be safe was to "import" the real variables from the outside scope explicitly:

{% highlight coffeescript %}
require('zappa') {require, __filename, __dirname}, ->
{% endhighlight %}

In gumbo, we're spared this bag of hurt.

The second big benefit is **meaningful stack traces**. With function rewriting we also lost track of the file and line number from which errors originated. The first line in the stack trace always pointed to the framework source:

    ReferenceError: foo is not defined
        at Object.<anonymous> (eval at <anonymous> (/path/to/node_modules/zappa/lib/zappa.js:35:12))

In 0.3.x, it points to the relevant filename and (js) line number:

    ReferenceError: foo is not defined
        at Object.<anonymous> (/path/to/app.coffee:5:16)

## What about data? Didn't it use to live at `@`?

Yes indeed. In 0.2.x, all input data was made available at `@`, and this object was automatically forwarded to templates:

{% highlight coffeescript %}
require('zappa') ->
  get '/': ->
    @foo += '!'
    render 'index'
  
  view index: -> p @foo
{% endhighlight %}

In gumbo, by default, there's no automatic data manipulation:

{% highlight coffeescript %}
require('zappa') ->
  @get '/': ->
    foo = @query.foo
    foo += '!'
    @render index: {foo}
  
  view index: -> p @foo
{% endhighlight %}

But if you like the old behavior, you can activate it, and use the alternative reference for the API:

{% highlight coffeescript %}
require('zappa') ->
  @set databag: 'this'
  
  @get '/:foo': (c) ->
    @foo += '!'
    c.render 'index'
  
  @view index: -> p @foo
{% endhighlight %}

Or you can do the opposite, keep `@` for the API and use the alternative reference for data:

{% highlight coffeescript %}
require('zappa') ->
  @set databag: 'param'
  
  @get '/:foo': (d) ->
    d.foo += '!'
    @render 'index'
  
  @view index: -> p @foo
{% endhighlight %}

## Learn more

- [API Reference](http://zappajs.org/docs/0.3-gumbo/reference/)
- [Migration TL;DR guide](http://zappajs.org/docs/0.3-gumbo/migration/)
