all :: app.js

.coffee.js:
	coffee -c $<

.SUFFIXES: .js .coffee
