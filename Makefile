SOCIALCALC_FILES=\
	socialcalcconstants.js \
	socialcalc-3.js \
	socialcalctableeditor.js \
	formatnumber2.js \
	formula1.js \
	socialcalcpopup.js \
	socialcalcspreadsheetcontrol.js \
	socialcalcviewer.js

ETHERCALC_FILES=\
	$(SOCIALCALC_FILES) \
	third-party/class-js/lib/Class.js \
	third-party/wikiwyg/lib/Document/Emitter.js \
	third-party/wikiwyg/lib/Document/Emitter/HTML.js \
	third-party/wikiwyg/lib/Document/Parser.js \
	third-party/wikiwyg/lib/Document/Parser/Wikitext.js \
	jquery.js

JS_FILES=\
	app.js dotcloud.js player.js main.js sc.js

all :: $(JS_FILES)
	node app.js

./node_modules/streamline/bin/_node :
	npm i --dev

depends :: app.js static/ethercalc.js static/start.css

SocialCalc.js :: $(SOCIALCALC_FILES) exports.js
	cat $(SOCIALCALC_FILES) exports.js > $@
	#@perl -e 'system(join(" ", closure => map { ("--js", $$_) } @ARGV). " > $@")' $(SOCIALCALC_FILES) exports.js

static/ethercalc.js :: $(ETHERCALC_FILES)
	@perl -e 'system(join(" ", closure => map { ("--js", $$_) } @ARGV). " > $@")' $(ETHERCALC_FILES) 

.ls.js:
	env PATH="./node_modules/.bin:$$PATH" livescript -c $<

.coffee.js:
	coffee -c $<

.sass.css:
	sass -t compressed $< > $@

clean ::
	@-rm $(JS_FILES)

push ::
	dotcloud push ethercalc

.SUFFIXES: .js .coffee .css .sass .ls
