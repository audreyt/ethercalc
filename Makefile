ETHERCALC_FILES=\
	socialcalcconstants.js \
	socialcalc-3.js \
	socialcalctableeditor.js \
	formatnumber2.js \
	formula1.js \
	socialcalcpopup.js \
	socialcalcspreadsheetcontrol.js \
	third-party/class-js/lib/Class.js \
	third-party/wikiwyg/lib/Document/Emitter.js \
	third-party/wikiwyg/lib/Document/Emitter/HTML.js \
	third-party/wikiwyg/lib/Document/Parser.js \
	third-party/wikiwyg/lib/Document/Parser/Wikitext.js \
	jquery.js

all :: app.js main.js
	node app.js

main.js : main_.js ./node_modules/streamline/bin/_node
	./node_modules/streamline/bin/_node -c $<

./node_modules/streamline/bin/_node :
	npm i --dev

depends :: app.js ethercalc.js start.css

ethercalc.js :: $(ETHERCALC_FILES)
	@perl -e 'system(join(" ", closure => map { ("--js", $$_) } @ARGV). " > $@")' $(ETHERCALC_FILES) 

.coffee.js:
	coffee -c $<

.sass.css:
	sass -t compressed $< > $@

push ::
	dotcloud push -b dotcloud ethercalc

.SUFFIXES: .js .coffee .css .sass
