@title = 'Log In'

h1 @title

p "A local var: #{ping}"
p "A context var: #{@foo}"

form action: '/', method: 'post', ->
  div class: 'field', ->
    label for: 'username', -> 'Username: '
    input id: 'username', name: 'username'

  div class: 'field', ->
    label for: 'password', -> 'Password: '
    input id: 'password', name: 'password'
