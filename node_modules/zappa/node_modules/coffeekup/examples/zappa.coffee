require('zappa') ->
  enable 'default layout'
  
  get '/': ->
    @franks = ['miller', 'oz', 'sinatra', 'zappa']
    render 'index'

  view index: ->
    @title = 'Zappa example'
    h1 @title
    ul ->
      for f in @franks
        li f
