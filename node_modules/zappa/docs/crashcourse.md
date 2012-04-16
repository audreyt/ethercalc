---
layout: default
title: Crash Course
permalink: /crashcourse/index.html
---

# {{page.title}}

Yes indeed, here we are. Let's begin with the classic:

## Hi, World

Get a `cuppa.coffee`:

{% highlight coffeescript %}
require('zappa') ->
  @get '/': 'hi'
{% endhighlight %}

And give your foot a push:

    $ npm install zappa
    $ coffee cuppa.coffee    
       info  - socket.io started
    Express server listening on port 3000 in development mode
    Zappa 0.3.1 "The Gumbo Variations" orchestrating the show

(hat tip to [sinatra](http://sinatrarb.com))

If your thing is the bleeding edge, replace `npm install zappa` with:

    $ git clone git@github.com:mauricemach/zappa.git && cd zappa
    $ cake setup
    $ cd /path/to/project
    $ npm install /path/to/zappa

## OK, so WTF did just happen?

CoffeeScript is relatively new on the scene, so it might be worth it to compare that first example with the equivalent JavaScript:

{% highlight javascript %}
require('zappa')(function(){
  this.get({'/': 'hi'});
});
{% endhighlight %}

`require 'zappa'` returns a function you can use to run your apps. We're calling it right away and passing an anonymous function as the parameter.

The zappa function does the initial express and socket.io setup, then calls your function with the relevant stuff exposed at `this` (and its CoffeeScript alias `@`).

You have direct access to the low-level APIs at `@app` and `@io`:

{% highlight coffeescript %}
require('zappa') ->
  @app.get '/', (req, res) ->
    res.send 'boring!'
    
  @io.sockets.on 'connection', (socket) ->
    socket.emit 'boring'
{% endhighlight %}

On top of that, you also have some handy shortcuts such as the `@get` you already know, `@on` (to define socket.io  handlers), `@use`, `@set`, `@configure`, etc. Those are not only shorter but also accept smarter parameters:

{% highlight coffeescript %}
require('zappa') ->
  @get '/foo': 'bar', '/ping': 'pong', '/zig': 'zag'
  @use 'bodyParser', 'methodOverride', @app.router, 'static'
  @set 'view engine': 'jade', views: "#{__dirname}/custom/dir"
{% endhighlight %}

If you can't/don't want to use `this`, you can receive the context as a parameter and name it whatever you want:

{% highlight coffeescript %}
require('zappa') (foo) ->
  foo.get '/': 'hi'
{% endhighlight %}

After running your function, zappa automatically starts the whole thing and spits out a message with some useful info.

## What about \[ENTER OPTION HERE\]?

Of course you can run your app in a different port and/or host:

{% highlight coffeescript %}
require('zappa') 'domain.com', 80, ->
  @get '/': 'hi'
{% endhighlight %}
  
Get a reference without running it automatically:

{% highlight coffeescript %}
chat = require('zappa').app ->
  @get '/': 'hi'
  
chat.app.listen 3000
{% endhighlight %}

And so on. To see all the options, check the [API reference](http://zappajs.org/docs/0.3-gumbo/reference).

## Nice, but one-line string responses are mostly useless. Can you show me something closer to a real web app?

{% highlight coffeescript %}
@get '*': '''
  <!DOCTYPE html>
  <html>
    <head><title>Oops</title></head>
    <body><h1>Sorry, check back in a few minutes!</h1></body>
  </html>
'''
{% endhighlight %}

## Seriously.

Right. This is what a basic route with a handler function looks like:

{% highlight coffeescript %}
@get '/:name': ->
  "Hi, #{@params.name}"
{% endhighlight %}

As you can see, the value of `this` is modified in the handler function too, giving you quick access to everything you need to handle the request. The low level API lives at `@request`, `@response` and `@next`, but you also have handy shortcuts such as `@render`, `@redirect`, `@query`, `@params`, etc.

Of course, you can receive the context as a param here too:

{% highlight coffeescript %}
@get '/:name': (foo) ->
  "Hi, #{foo.params.name}"
{% endhighlight %}

If you return a string, it will automatically be sent as the response. But most of the time you'll be doing something asynchronous, and in this case you have to call `@send`:

{% highlight coffeescript %}
@get '/ponchos/:id': ->
  Poncho.findById @params.id, (err, poncho) =>
    # Is that a real poncho, or is that a sears poncho?
    @send poncho.type
{% endhighlight %}

Note that we're using a fat arrow (`=>`) here, to preserve the value of `this`. We could be just as well using the alternative reference (`foo.send`) and a normal arrow.

## Radical views

Generally `@render` works just like `@response.render`:

{% highlight coffeescript %}
@get '/': ->
  @render 'index', foo: 'bar'
{% endhighlight %}

One difference is that it also works with the "key: value syntax":

{% highlight coffeescript %}
@get '/': ->
  @render index: {foo: 'bar'}
{% endhighlight %}

Another is that you can define inline views that `@render` "sees" as if they were in the filesystem:

{% highlight coffeescript %}
 
@get '/': ->
  @render index: {foo: 'bar'}

@view index: ->
  @title = 'Inline template'
  h1 @title
  p @foo

@view layout: ->
  doctype 5
  html ->
    head -> title @title
    body @body
{% endhighlight %}

Note that zappa comes with a default templating engine, [CoffeeKup](http://coffeekup.org), and you don't have to setup anything to use it. You can also easily use other engines by specifying the file extension or the `'view engine'` setting; it's just express. Well, express + inline views support:

{% highlight coffeescript %}
 
@set 'view engine': 'eco'

@get '/': -> @render index: {foo: 'bar'}
@get '/jade': -> @render 'index.jade': {foo: 'bar'}

@view index: '''
  <% @title = 'Eco template' %>
  <h1><%= @title %></h1>
  <p><%= @foo %></p>
'''

@view layout: '''
  <!DOCTYPE html>
  <html>
    <head><title><%= @title %></title></head>
    <body><%- @body %></body>
  </html>
'''

@view 'index.jade': '''
  - title = "Jade template";
  h1= title
  p= foo
'''

@view 'layout.jade': '''
  !!! 5
  html
    head
      title= title
    body!= body
'''
{% endhighlight %}

If you don't feel like writing brain-dead HTML boilerplate, you can use a configurable template zappa provides:

{% highlight coffeescript %}
require('zappa') ->
  @enable 'default layout'

  @get '/': ->
    @render index: {foo: 'bar'}

  @view index: ->
    @title = 'Inline template'
    h1 @title
    p @foo
{% endhighlight %}

The following template will be added automatically:

{% highlight coffeescript %}
@view layout: ->
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
      if @stylesheet
        link(rel: 'stylesheet', href: @stylesheet + '.css')
      style @style if @style
    body @body
{% endhighlight %}

## Knock your sockets off

Using socket.io in zappa is just a matter of defining the event handlers with `@on`:

{% highlight coffeescript %}
require('zappa') ->
  @get '/': ->
    @render 'index'

  @on connection: ->
    @emit welcome: {@id}
  
  @on shout: ->
    @broadcast shouted: {@id, text: @data.text}
{% endhighlight %}

Socket.io is automatically required and attached to the express server, intercepting WebSockets/comet traffic on the same port.

Just like in request handlers, the value of `this` is modified to include all the relevant stuff you need, including the low-level API (here at `@socket` and `@io`) and smart shortcuts (`@id`, `@emit`, `@broadcast`, etc). Input variables are available at `@data`.

On the client-side, you can use the vanilla socket.io API if you like, but that wouldn't make much sense, would it? Which leads us to...

## The client side of the source

With `@coffee`, you can define client-side code inline, and serve it in JS form with the correct content-type set. No compilation involved, since we already have its string representation from the runtime:

{% highlight coffeescript %}
 
@get '/': ->
  @render 'index'
  
@coffee '/index.js': ->
  alert 'hullo'

@view index: ->
  h1 'Inline client example'

@view layout: ->
  doctype 5
  html ->
    head -> title 'bla'
    script src: '/index.js'
  body @body
{% endhighlight %}

On a step further, you have `@client`, which gives you access to a matching client-side zappa API:

{% highlight coffeescript %}
 
@enable 'serve jquery', 'serve sammy'

@get '/': ->
  @render index: {layout: no}

@on connection: ->
  @emit time: {time: new Date()}

@client '/index.js': ->
  @get '#/foo': ->
    $('body').append 'client-side route with sammy.js'

  @on time: ->
    $('body').append "Server time: #{@data.time}"

  @connect()

@view index: ->
  doctype 5
  html ->
    head ->
      title 'Client-side zappa'
      script src: '/socket.io/socket.io.js'
      script src: '/zappa/jquery.js'
      script src: '/zappa/sammy.js'
      script src: '/zappa/zappa.js'
      script src: '/index.js'
    body ''
{% endhighlight %}

Finally, there's `@shared`. This block of code is not only served to the client, but also executed on the server.

{% highlight coffeescript %}
 
@shared '/shared.js': ->
  root = window ? global
  root.sum = (x, y) ->
    String(Number(x) + Number(y))

@get '/sum/:x/:y': ->
  @send sum(@params.x, @params.y)

@coffee '/index.js': ->
  $ =>
    $('button').click =>
      $('#result').html(sum $('#x').html(), $('#y').html())
{% endhighlight %}

## Santa's little helpers

Zappa helpers are functions with automatic access to the same context (`this`/`@`) as whatever called them (request or event handlers):

{% highlight coffeescript %}
 
@helper map: (name) ->
  map = maps[name]
  format = if @request? then @query.format else @data.format
  
  if format is 'xml' then map = map.toXML()
  else map = map.toJSON()
  
  if @request? then @send map
  else @emit map: {map}

@get '/maps/dungeon': ->
  @map 'dungeon'

@on 'enter dungeon': ->
  @map 'dungeon'
{% endhighlight %}

## Post-rendering with server-side jQuery

Rendering things linearly is often the approach that makes more sense, but sometimes DOM manipulation can avoid loads of repetition. The best DOM libraries in the land are in JavaScript, and thanks to [jsdom](http://jsdom.org/), you can use them on the server-side too.

Zappa makes it trivial to post-process your rendered templates by manipulating them with jQuery:

{% highlight coffeescript %}
 
@postrender plans: ($) ->
  $('.staff').remove() if @user.plan isnt 'staff'
  $('div.' + @user.plan).addClass 'highlighted'

@get '/postrender': ->
  @user = plan: 'staff'
  @render index: {postrender: 'plans'}
{% endhighlight %}

## Including modules

Besides good ol' `require`, zappa also provides `@include`, which not only requires a file, but also calls an exported function named `include`, setting the value of `this` to the same context:

{% highlight coffeescript %}
@include 'http'
@include 'websockets'
{% endhighlight %}
    
Then in `http.coffee`:

{% highlight coffeescript %}
# Same as module.exports.include
@include = ->
  @get '/foo': -> @render 'foo'
  @get '/bar': -> @render 'bar'
  # ...
{% endhighlight %}

And `websockets.coffee`:

{% highlight coffeescript %}
@include = ->
  @on foo: -> @emit 'foo'
  @on bar: -> @emit 'bar'
  # ...
{% endhighlight %}

## Connect(ing) middleware

You can specify your middleware through the standard `@app.use`, or zappa's shortcut `@use`. The latter can be used in a number of additional ways:

It accepts many params in a row. Ex.:

{% highlight coffeescript %}
@use @express.bodyParser(), @app.router, @express.cookies()
{% endhighlight %}

It accepts strings as parameters. This is syntactic sugar to the equivalent express middleware with no arguments. Ex.:

{% highlight coffeescript %}
@use 'bodyParser', @app.router, 'cookies'
{% endhighlight %}

You can also specify parameters by using objects. Ex.:

{% highlight coffeescript %}
@use 'bodyParser', static: __dirname + '/public', session: {secret: 'fnord'}, 'cookies'
{% endhighlight %}

Finally, when using strings and objects, zappa will intercept some specific middleware and add behaviour, usually default parameters. Ex.:

{% highlight coffeescript %}
 
@use 'static'

# Syntactic sugar for:
@app.use @express.static(__dirname + '/public')
{% endhighlight %}

## Aaaaaand that's it for tonight.

Thank you for coming to the show, hope you enjoyed it. [CoffeeScript](https://coffeescript.org) on guitar, [Express](http://expressjs.com) on the keyboards, [Socket.IO](http://socket.io) on drums. [Node.js](http://nodejs.org) on background vocals, [npm](http://npmjs.org) on bass. G'night everyone.

To learn more, check out [the links](http://zappajs.org) at the home page.