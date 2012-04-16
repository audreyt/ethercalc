app = require('express').createServer()

coffeekup = require '../../src/coffeekup'

app.set 'view engine', 'coffee'
app.register '.coffee', coffeekup.adapters.express

app.get '/', (req, res) ->
  res.render 'index'

app.get '/login', (req, res) ->
  res.render 'login', foo: 'bar', locals: {ping: 'pong'}

app.get '/inline', (req, res) ->
  res.send coffeekup.render ->
    h1 'This is an inline template.'

app.listen 3000

console.log "Listening on 3000..."
