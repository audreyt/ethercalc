require('../src/zappa') ->
  @register jade: @zappa.adapter 'jade'
  
  @get '/': ->
    @render 'index.jade': {foo: 'Zappa + Jade'}
    
  @get '/coffeekup': ->
    @render 'index.coffee': {foo: 'Zappa + CoffeeKup'}