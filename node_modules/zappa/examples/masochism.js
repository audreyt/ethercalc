require('./zappa')(function(c){
  c.use('static', 'bodyParser')
  
  c.get('/', function(c){
    c.render('index', {foo: 'bar'})
  })
  
  c.view({index: function(){
    h1(this.foo)
  }})
})