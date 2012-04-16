require('./zappa') ->
  @get
    '/': ->
      @render 'index', foo: 'bar'
      
    '/eco': ->
      @render 'index.eco', foo: 'bar'
      
    '/jade': ->
      @render 'index.jade', foo: 'bar'

  @view index: ->
    h2 'CoffeeKup inline template'
    p @foo
  
  @view layout: ->
    doctype 5
    html ->
      head ->
        title 'CoffeeKup inline layout'
      body ->
        h1 'CoffeeKup inline layout'
        @body
  
  @view 'index.eco': '''
    <h2>Eco inline template</h2>
    <p><%= @foo %></p>
  '''
  
  @view 'layout.eco': '''
    <!DOCTYPE html>
    <html>
      <head>
        <title>Eco inline layout</title>
      <body>
        <h1>Eco inline layout</h1>
        <%- @body %>
      </body>
    </html>
  '''
  
  @view 'index.jade': '''
    h2 Jade inline template
    p= foo
  '''
  
  @view 'layout.jade': '''
    !!! 5
    html
      head
        title Jade inline layout
      body
        h1 Jade inline layout
        != body
  '''