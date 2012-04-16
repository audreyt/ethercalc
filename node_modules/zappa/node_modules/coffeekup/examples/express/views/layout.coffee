doctype 5
html ->
  head ->
    meta charset: 'utf-8'

    title "#{@title} | My Site" if @title?
    meta(name: 'description', content: @description) if @description?
    link(rel: 'canonical', href: @canonical) if @canonical?

    link rel: 'icon', href: '/favicon.png'
    link rel: 'stylesheet', href: '/app.css'

    script src: 'http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js'
    script src: '/app.js'

    coffeescript ->
      $(document).ready ->
        alert 'hi!'        

    style '''
      header, nav, section, article, aside, footer {display: block}
      nav li {display: inline}
      nav.sub {float: right}
      #content {margin-left: 120px}
    '''
  body ->
    header ->
      a href: '/', title: 'Home', -> 'Home'

      nav ->
        ul ->
          for item in ['About', 'Pricing', 'Contact']
            li -> a href: "/#{item.toLowerCase()}", title: item, -> item
            
          li -> a href: '/about', title: 'About', -> 'About'
          li -> a href: '/pricing', title: 'Pricing', -> 'Pricing'
          li -> a href: '/contact', title: 'Contact Us', -> 'Contact Us'

    div id: 'content', ->
      @body

    footer ->
      p -> a href: '/privacy', -> 'Privacy Policy'
