    8888888888P        d8888 8888888b.  8888888b.     d8888          @@@    @@@ 
          d88P        d88888 888   Y88b 888   Y88b   d88888        @@@@@@@@@@@@@@
         d88P        d88P888 888    888 888    888  d88P888       @@@@@@@@@@@@@@@@
        d88P        d88P 888 888   d88P 888   d88P d88P 888      @@@@@@@@  @@@@@@@@
       d88P        d88P  888 8888888P"  8888888P" d88P  888      @@@            @@@
      d88P        d88P   888 888        888      d88P   888      @@   @@@@@@@@   @@
     d88P        d8888888888 888        888     d8888888888           @@@@@@@@    
    d8888888888 d88P     888 888        888    d88P     888            @@@@@@     

### Not your mom's node framework
            
This document refers to the recently released **0.2.0 beta**. You can find a review on changes from 0.1.x at `/docs/peaches.md`.
            
**Zappa** is a [CoffeeScript](http://coffeescript.org)-optimized, radically minimalist interface orchestrating [Express](http://expressjs.com), [Socket.IO](http://socket.io), [Sammy](http://sammyjs.org) and other top talent, with two obsessions in mind:

- Providing an extremely focused interface for building web apps, delaying my carpal tunnel a few years.

- Taking advantage of possibilities brought by new web technologies and the node runtime: trivialization of websockets/comet, client-server smoother integration and code sharing, server-side DOM manipulation, etc.

It is heavily influenced by [that legendary framework](http://www.sinatrarb.com) named after another rockstar Frank, with also a hint of [Camping](http://camping.rubyforge.org/).

### Hi, World

Get a `cuppa.coffee`:

    require('zappa') ->
      get '/': 'hi'

And give your foot a push:

    $ npm install zappa
    $ coffee cuppa.coffee    
       info  - socket.io started
    Express server listening on port 3000 in development mode
    Zappa 0.2.0beta orchestrating the show

### Nice, but one-line string responses are mostly useless. Can you show me something closer to a real web app?

    get '*': '''
      <!DOCTYPE html>
      <html>
        <head><title>Sorry, we'll be back soon!</title></head>
        <body><h1>Sorry, we'll be back soon!</h1></body>
      </html>
    '''

### Seriously.

Right. This is what a basic route with a handler function looks like:

    get '/:name': ->
      "Hi, #{@name}"

If you return a string, it will automatically be sent as the response.

Now for a more typical scenario:

    get '/users/:id': ->
      User.findById @id, (@err, @user) =>
        render 'user'

    view user: ->
      if @err
        @title = 'Error'
        p "Something terrible happened: #{@err}."
      else
        @title = "#{@user.name}'s Home"
        p "Hullo, #{@user.name}!"

    view layout: ->
      html ->
        head -> title @title
        body ->
          h1 @title
          @body

Handler functions are executed within a specially crafted scope that is optimized for the typical scenario of taking the input, processing it, rendering a view with this data and sending a response, all with *minimal wiring*.

You have certain local variables automatically available such as `request`, `response` and `next` (straight from Express). You also have shortcuts such as `send`, `redirect` and `render`.

Besides being able to read your input through the standard API (ex.: `request.query.foo` and friends), you also have access to a merged collection of them, as `@foo` and the alias `params.foo`.

All variables at `@`/`params` (from input or put there by you) are automatically made available to templates as `params.foo` (in CoffeeKup, `@params.foo`).

In addition, if you're using the *zappa view adapter* (as is the case by default, with CoffeeKup), they're also made available at the template's "root namespace" (`foo` or CoffeeKup's `@foo`).

Since in express templating data is usually mixed up with framework locals and template options, the adapter will only put variables in the template root if there isn't a variable there with the same name already, *and* the name is not blacklisted.

To use this feature with other templating engines:

    blacklist = 'scope|self|locals|filename|debug|compiler|compileDebug|inline'.split '|'
    app.register '.jade', zappa.adapter 'jade', blacklist

To disable it on default zappa:

    app.register '.coffee', require('coffeekup').adapters.express

### Fine. But this is node! What about some async?

Both examples below will produce `bar?!` if you request `/bar`:

    get '/:foo': ->
      @foo += '?'
      
      sleep 3, =>
        @foo += '!'
        render 'index'

Or if you can't / don't want to use the fat arrow to bind `@`:

    get '/:foo': ->
      params.foo += '?'
      
      sleep 3, ->
        params.foo += '!'
        render 'index'

### Let me guess. You can also post/put/del, use regexes, routes are matched first to last, all like any self-respecting sinatra clone.

Exactly. Actually, when it comes to HTTP zappa hands over all the serious work to Express, so there are no big surprises here:

    get '/': 'got'
    post '/': 'posted'
    put '/': 'put'
    del '/': 'deleted'
    get '*': 'any url'

### Route combo

The routing functions accept an object where each key is a route path, and each values the response. This means we can define multiple routes in one go:

    get '/foo': 'bar', '/ping': 'pong', '/zig': 'zag'

Better yet:

    get
      '/foo': 'bar'
      '/ping': 'pong'
      '/zig': 'zag'

You can also use the default syntax where the first param is the path, and the second the response. This is mostly to allow for regexes:

    get '/foo', 'bar'
    get /^\/ws-(.*)/, ->
      'bloatware-' + params[0]

### Bi-directional events (WebSockets/Comet)

But the web is not just about HTTP requests anymore. WebSockets are soon to become available on all major browsers but IE. For this sucker and legacy browsers, there's a collection of ugly hacks that work (comet), and thanks to Socket.IO, we don't even have to care.

Zappa pushes this trivialization a bit further by removing some of the boilerplate, and providing some integration. The goal is to make event handling feel more like a first-class citizen along with request handling, readily available, instead of an exotic feature you bolt on your app.

All you have to do to handle bi-directional events in your apps is declare the handlers, side by side with your HTTP ones:

    get '/chat': ->
      render 'chat'

    get '/counter': ->
      "Total messages so far: #{app.counter}"

    at connection: ->
      app.counter ?= 0
      emit 'welcome', time: new Date()
      broadcast "#{id} connected"

    at disconnect: ->
      broadcast "#{id} is gone!"

    at said: ->
      app.counter++
      broadcast 'said', {id, @text}

    at afk: ->
      broadcast 'afk', {id}

When your app starts, if you defined one of those handlers, zappa will automatically require Socket.IO and fire it up. It will not take up a dedicated port, since Socket.IO can attach itself to the HTTP server and intercept WebSockets/comet traffic.

Event and request handlers are designed to behave as similarly as possible. There are locals for the standard API (`io`, `socket`), shortcuts (`emit`, `broadcast`) and input variables are also available at `@`.

### But what about the client-side?

That's an interesting question! Let's start with the basics.

First there's `coffee` with which you can define a route `/file.js`, that will respond with your CoffeeScript code in JS form, and the correct content-type set. No compilation involved, since we already have you function's string representation from the runtime.

    get '/': -> render 'index'

    coffee '/index.js': ->
      alert 'hullo'

    view index: ->
      h1 'Client embedding example'

    view layout: ->
      html ->
        head -> title 'bla'
        script src: '/index.js'
      body @body

On a step further, you have `client`, which gives you access to a matching zappa client-side API:

    enable 'serve jquery', 'serve sammy'

    get '/': ->
      render 'index', layout: no
    
    at connection: ->
      emit 'server time', time: new Date()
    
    client '/index.js': ->
      def sum: (a, b) -> a + b
    
      get '#/': ->
        alert 'index'
      
      at 'server time': ->
        alert "Server time: #{@time}"
        
      connect 'http://localhost'
        
    view index: ->
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
        
Finally, there's also `shared`. Certain zappa "keywords" work exactly the same on the server and client side. Guess what? If you define them inside a `shared` block, they're available at both environments!

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

### Scope and `def`

In order to gain all these specialized scopes, we lose closures.

To make things available at the root scope:

    foo = 'bar'
    require('zappa') {foo}, ->
      console.log foo   # 'bar'

To make things available to handlers, use `def`:

    foo = 'bar'
    def ping: 'pong'
    def zig: -> 'zag'

    get '/': ->
      foo   # undefined
      ping  # 'pong'
      zig() # 'zag'

### But `def foo: require 'foo'` is stupid repetition! I'm lazy!

Luckily for you, so am I. Meet `requiring`, `require`'s less patient brother.

    requiring 'fs', 'path', 'util'

    get '/': ->
      console.log fs, path, util

### Santa's little `helper`s

Helpers are just like defs, except they are modified to have access to the same context (@/this) and framework locals as whatever called them (request or event handlers).

    helper role: (name) ->
      if request?
        redirect '/login' unless @user.role is name
      else
        client.disconnect() unless @user.role is name

    get '/gm': ->
      role 'gm'
      # see stuff

    at kill: ->
      role 'gm'
      # kill stuff

### Post-rendering with server-side jQuery

Rendering things linearly is often the approach that makes more sense, but sometimes DOM manipulation can avoid loads of repetition. The best DOM libraries in the world are in javascript, and thanks to the work of Elijah Insua with [jsdom](http://jsdom.org/), you can use some with node too.

Zappa makes it trivial to post-process your rendered templates by manipulating them with jQuery:

    postrender plans: ->
      $('.staff').remove() if @user.plan isnt 'staff'
      $('div.' + @user.plan).addClass 'highlighted'

    get '/postrender': ->
      @user = plan: 'staff'
      render 'index', postrender: 'plans'

### App combo

Node.js servers don't block when calling `listen`, so you can run many apps in the same process:

    zappa = require 'zappa'
    
    zappa 8001, -> get '/': 'blog'
    zappa 8002, -> get '/': 'chat'
    zappa 8003, -> get '/': 'wiki'
  
    $ coffee apps.coffee
    
You can also take advantage of Express/Connect vhost middleware:

    zappa = require 'zappa'
    
    chat = zappa.app -> get '/': 'chat'
    blog = zappa.app -> get '/': 'blog'
    
    zappa 80, {chat, blog}, ->
      use express.vhost 'chat.com', chat
      use express.vhost 'blog.com', blog

### Splitting it up

If your single file of doom is becoming unwieldy, you can split it up based on whatever organization suits you better:

    include 'model'
    include 'controllers/http'
    include 'controllers/websockets'
    include 'controllers/client'
    include 'controllers/common'
    include 'views'

Or by subject:

    include 'users'
    include 'widgets'
    include 'gadgets'
    include 'funzos'
    
The files to be included just have to export an `include` function:

    # Could be `module.exports.include` as well.
    @include = ->
      get '/': 'This is a route inside an included file.'

### Connect(ing) middleware

You can specify your middleware through the standard `app.use`, or zappa's shortcut `use`. The latter can be used in a number of additional ways:

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

## Resources

- [API reference](https://github.com/mauricemach/zappa/blob/master/docs/reference.md)

- [Mailing list](https://groups.google.com/group/zappajs)

- [Issues](https://github.com/mauricemach/zappa/issues)

- [Hosting Zappa 0.2.x on Heroku](http://blog.superbigtree.com/blog/2011/08/19/hosting-zappa-0-2-x-on-heroku/)

- **IRC**: #zappajs on irc.freenode.net

## Thanks loads

To all people behind the excellent libs that made this little project possible, more specifically: 

- Jeremy Ashkenas for CoffeeScript, the "little" language is nothing short of revolutionary to me.

- TJ Holowaychuk for the robust and flexible cornerstone that's Express.

- Guillermo Rauch for solving (as far as I'm concerned) the comet problem once and for all.

- Ryan Dahl for Node.js, without which nothing of this would be possible.

Also:

- Blake Mizerany for Sinatra, the framework that made me redefine simple.

- why the lucky stiff, for making me redefine hacking.

- And last but not least Frank Zappa, for the spirit of nonconformity and experimentation that inspires me to push forward. Not to mention providing the soundtrack.

"Why do you necessarily have to be wrong just because a few million people think you are?" - FZ