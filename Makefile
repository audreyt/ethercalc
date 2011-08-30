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
	third-party/wikiwyg/lib/Document/Parser/Wikitext.js

all :: app.js ethercalc.js

ethercalc.js :: $(ETHERCALC_FILES)
	@perl -e 'system(join(" ", closure => map { ("--js", $$_) } @ARGV). " > $@")' $(ETHERCALC_FILES) 

run :: app.js
	node app.js

.coffee.js:
	coffee -c $<

.SUFFIXES: .js .coffee
