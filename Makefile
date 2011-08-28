all :: app.js

run :: app.js
	node app.js

.coffee.js:
	coffee -c $<

.SUFFIXES: .js .coffee
