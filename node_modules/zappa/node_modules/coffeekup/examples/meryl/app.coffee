meryl = require 'meryl'
coffeekup = require '../../src/coffeekup'

meryl.h 'GET /', (req, resp) ->
  people = ['bob', 'alice', 'meryl']
  resp.render 'layout', content: 'index', context: {people: people}

meryl.run
  templateDir: 'templates'
  templateExt: '.coffee'
  templateFunc: coffeekup.adapters.meryl

console.log 'Listening on 3000...'
