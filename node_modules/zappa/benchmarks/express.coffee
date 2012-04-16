app = require('express').createServer()

app.register '.coffee', require('coffeekup').adapters.express

app.get '/', (req, res) ->
  res.render 'index.jade', foo: 'Express + Jade'

app.get '/coffeekup', (req, res) ->
  res.render 'index.coffee', foo: 'Express + CoffeeKup'

app.listen 3000

console.log "Listening on 3000..."