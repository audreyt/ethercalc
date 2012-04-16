@title = 'Chunky Bacon!'
@canonical = 'http://chunky.bacon'

h1 @title

p 'This is the home page.'

p "Let's count to 10: "

p "#{i}..." for i in [1..10]

partial 'partial', [1..10]