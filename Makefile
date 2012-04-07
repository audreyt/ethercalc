SOCIALCALC_FILES=\
	socialcalcconstants.js \
	socialcalc-3.js \
	socialcalctableeditor.js \
	formatnumber2.js \
	formula1.js \
	socialcalcpopup.js \
	socialcalcspreadsheetcontrol.js

ETHERCALC_FILES=\
	$(SOCIALCALC_FILES) \
	third-party/class-js/lib/Class.js \
	third-party/wikiwyg/lib/Document/Emitter.js \
	third-party/wikiwyg/lib/Document/Emitter/HTML.js \
	third-party/wikiwyg/lib/Document/Parser.js \
	third-party/wikiwyg/lib/Document/Parser/Wikitext.js \
	jquery.js

all :: app.js
	node app.js

./node_modules/streamline/bin/_node :
	npm i --dev

depends :: app.js static/ethercalc.js static/start.css

SocialCalc.js :: $(SOCIALCALC_FILES) exports.js
	cat $(SOCIALCALC_FILES) exports.js > $@
	#@perl -e 'system(join(" ", closure => map { ("--js", $$_) } @ARGV). " > $@")' $(SOCIALCALC_FILES) exports.js

static/ethercalc.js :: $(ETHERCALC_FILES)
	@perl -e 'system(join(" ", closure => map { ("--js", $$_) } @ARGV). " > $@")' $(ETHERCALC_FILES) 

.coffee.js:
	coffee -c $<

.sass.css:
	sass -t compressed $< > $@

push ::
	dotcloud push ethercalc

.SUFFIXES: .js .coffee .css .sass
