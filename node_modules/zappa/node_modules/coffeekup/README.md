# CoffeeKup <☕/>
## Markup as CoffeeScript

CoffeeKup is a templating engine for [node.js](http://nodejs.org) and browsers that lets you to write your HTML templates in 100% pure [CoffeeScript](http://coffeescript.org).

It was created in celebration of [whyday](http://whyday.org/), as an application of the concept used in [Markaby](https://github.com/markaby/markaby) ("Markup as Ruby", by Tim Fletcher and why the lucky stiff) to CoffeeScript.

Here's what a template written for CoffeeKup looks like:

    doctype 5
    html ->
      head ->
        meta charset: 'utf-8'
        title "#{@title or 'Untitled'} | A completely plausible website"
        meta(name: 'description', content: @description) if @description?
        
        link rel: 'stylesheet', href: '/css/app.css'
        
        style '''
          body {font-family: sans-serif}
          header, nav, section, footer {display: block}
        '''
        
        script src: '/js/jquery.js'
        
        coffeescript ->
          $(document).ready ->
            alert 'Alerts suck!'
      body ->
        header ->
          h1 @title or 'Untitled'
          
          nav ->
            ul ->
              (li -> a href: '/', -> 'Home') unless @path is '/'
              li -> a href: '/chunky', -> 'Bacon!'
              switch @user.role
                when 'owner', 'admin'
                  li -> a href: '/admin', -> 'Secret Stuff'
                when 'vip'
                  li -> a href: '/vip', -> 'Exclusive Stuff'
                else
                  li -> a href: '/commoners', -> 'Just Stuff'

        div '#myid.myclass.anotherclass', style: 'position: fixed', ->
          p 'Divitis kills! Inline styling too.'

        section ->
          # A helper function you built and included.
          breadcrumb separator: '>', clickable: yes
          
          h2 "Let's count to 10:"
          p i for i in [1..10]
          
          # Another hypothetical helper.
          form_to @post, ->
            textbox '#title', label: 'Title:'
            textbox '#author', label: 'Author:'
            submit 'Save'

        footer ->
          # CoffeeScript comments. Not visible in the output document.
          comment 'HTML comments.'
          p 'Bye!'

Interactive demo at [coffeekup.org](http://coffeekup.org).

## _why?

- **One language to rule them all**. JavaScript is everywhere, thus so is CoffeeScript. Servers, browsers, even databases. If extending this to rendering logic and UI structure (server and client side) is desirable to you, CoffeeKup is your friend.

- **More specifically, one _outstanding_ language**. CoffeeScript is one hell of a clean, expressive, flexible and powerful language. It's hard to find such combination, especially if you need it to run in the browser too.

- **Not yet another specialized language to learn**. Transferable knowledge FTW.

- **Embed your templates in CoffeeScript nicely**. Templates are just functions, so they don't lose syntax highlighting and syntax checking when embedded in CoffeeScript apps.

- **Embed CoffeeScript in your templates nicely**. In the same manner, you can write the contents of `<script>` blocks in CoffeeScript, and keep the highlighting. Perhaps more significantly, the CoffeeScript compiler doesn't have to be called just to convert these blocks to JS, as in other templating engines.

- **Extensive editor support**. You benefit from the already existing list of excellent CoffeeScript [text editor plugins](https://github.com/jashkenas/coffee-script/wiki/Text-editor-plugins).

- **Client-server consistency**. The same template language _and_ implementation in node.js or the browser.

- **Easily extendable into a higher level "DSL"**. Since all elements are just functions, it's very easy to define your own custom "tags", which will work and look the same as "native" ones.

- **HTML 5 ready**. Boring legacy doctypes and elements also available.

- **Optional auto-escaping**. You can also use the `h` helper on a case-by-case basis.

- **Optional formatting**, with line breaks and indentation.

- **Pick your poison**. Works with both CoffeeScript and JavaScript apps.

## Why not?

CoffeeKup may not be your best choice in those cases:

- You're after the cleanest syntax possible, above all. In this regard a specialized language such as [Jade](http://jade-lang.com) just can't be beaten.

- You use divs and/or classes for everything. While in CoffeeKup you can do `div '#id.class.class'`, specialized languages often have an even shorter syntax for that.

- You want CoffeeScript for rendering logic, but you'd rather stick with HTML for markup. Then you're looking for [Eco](http://github.com/sstephenson/eco).

- For your specific project/team/preferences, you think a limited and/or separate language for templating is actually beneficial.

## Installing

Just grab [node.js](http://nodejs.org/#download) and [npm](http://github.com/isaacs/npm) and you're set:

    npm install coffeekup

To get the `coffeekup` command, install it globally:

    npm install coffeekup -g
    
Or to use the latest version:

    git clone git@github.com:mauricemach/coffeekup.git && cd coffeekup
    cake build
    npm link
    cd ~/myproject
    npm link coffeekup

## Using

    ck = require 'coffeekup'

    ck.render -> h1 "You can feed me templates as functions."
    ck.render "h1 'Or strings. I am not too picky.'"

Defining variables:

    template = ->
      h1 @title
      form method: 'post', action: 'login', ->
        textbox id: 'username'
        textbox id: 'password'
        button @title

    helpers =
      textbox: (attrs) ->
        attrs.type = 'text'
        attrs.name = attrs.id
        input attrs

    ck.render(template, title: 'Log In', hardcode: helpers)

Precompiling to functions:

    template = ck.compile(template, locals: yes, hardcode: {zig: 'zag'})
    
    template(foo: 'bar', locals: {ping: 'pong'})

With [express](http://expressjs.com):

    app.set 'view engine', 'coffee'
    app.register '.coffee', require('coffeekup').adapters.express

    app.get '/', (req, res) ->
      # Will render views/index.coffee:
      res.render 'index', foo: 'bar'

With [zappa](http://github.com/mauricemach/zappa):

    get '/': ->
      @franks = ['miller', 'oz', 'sinatra', 'zappa']
      render 'index'

    view index: ->
      for name in @franks
        a href: "http://en.wikipedia.org/wiki/Frank_#{name}", -> name

With [meryl](https://github.com/kadirpekel/meryl/tree/master/examples/coffeekup-template):

    coffeekup = require 'coffeekup'
    
    meryl.get '/', (req, resp) ->
      people = ['bob', 'alice', 'meryl']
      resp.render 'layout', content: 'index', context: {people: people}

    meryl.run
      templateExt: '.coffee'
      templateFunc: coffeekup.adapters.meryl

On the browser:

    <script src="template.js"></script>
    <script>
      $('body').append(templates.template({foo: 'bar'}));
    </script>

This is one of many browser deployment possibilities, pre-compiling your template on the server to a standalone function. To see all serving suggestions, check out [regular](http://github.com/mauricemach/coffeekup/blob/master/examples/browser/regular/index.html), [decaf](http://github.com/mauricemach/coffeekup/blob/master/examples/browser/decaf/index.html) and [crème](http://github.com/mauricemach/coffeekup/blob/master/examples/browser/creme/index.html).

Command-line:

    $ coffeekup -h

    Usage:
      coffeekup [options] path/to/template.coffee

          --js           compile template to js function
      -n, --namespace    global object holding the templates (default: "templates")
      -w, --watch        watch templates for changes, and recompile
      -o, --output       set the directory for compiled html
      -p, --print        print the compiled html to stdout
      -f, --format       apply line breaks and indentation to html output
      -u, --utils        add helper locals (currently only "render")
      -v, --version      display CoffeeKup version
      -h, --help         display this help message

See [/examples](http://github.com/mauricemach/coffeekup/tree/master/examples) for complete versions (you have to run `cake build` first).

Please note that even though all examples are given in CoffeeScript, you can also use their plain JavaScript counterparts just fine.

## Resources

- [API reference](https://github.com/mauricemach/coffeekup/blob/master/docs/reference.md)

- [Mailing list](https://groups.google.com/group/coffeekup)

- [Issues](https://github.com/mauricemach/coffeekup/issues)

- **IRC**: #coffeekup on irc.freenode.net

- [A Beginners's Introduction to CoffeeKup](https://github.com/mark-hahn/coffeekup-intro)

## Tools

- [html2coffeekup](https://github.com/brandonbloom/html2coffeekup) - Converts HTML to CoffeeKup templates.

- [htmlkup](https://github.com/colinta/htmlkup) - Another HTML converter, stdin/stdout based.

- [ice](https://github.com/ludicast/ice) - CoffeeKup and Eco in Rails ([screencast](http://vimeo.com/25907220)).

- [coffee-world](https://github.com/khoomeister/coffee-world) - Tool to watch and compile HTML with CoffeeKup, CSS with coffee-css and JS with CoffeeScript.

- [cupcake](https://github.com/twilson63/cupcake) - Express app generator with CoffeeKup support.

## Related projects

- [ck](https://github.com/aeosynth/ck) - "a smaller, faster coffeekup": Alternative, barebones implementation.

- [ckup](https://github.com/satyr/ckup) - "Markup as Coco": Similar engine but for [Coco](https://github.com/satyr/coco) ("Unfancy CoffeeScript").

- [Eco](https://github.com/sstephenson/eco) - "Embedded CoffeeScript templates": "EJS/ERB" for CoffeeScript.

- [timbits](https://github.com/Postmedia/timbits) - "Widget framework based on Express and CoffeeScript".

- [coffee-css](https://github.com/khoomeister/coffee-css) - "More CSS for CoffeeScript".

- [ccss](https://github.com/aeosynth/ccss) - "CoffeeScript CSS".

## Compatibility

Latest version tested with node 0.4.9 and CoffeeScript 1.1.1.

## Special thanks

  - [Jeremy Ashkenas](https://github.com/jashkenas), for the amazing CoffeeScript language.
  - [why the lucky stiff](Why_the_lucky_stiff), for the inspiration.
