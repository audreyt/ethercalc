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
	static/jquery.js \
	static/vex.combined.min.js

LS_FILES=$(wildcard src/*.ls)

CLOSURE_COMPILER=closure-compiler

JS_FILES=\
	app.js dotcloud.js player.js main.js sc.js db.js

run: all
	node app.js $(ETHERCALC_ARGS)

vm: all
	node app.js --vm $(ETHERCALC_ARGS)

expire: all
	node app.js --expire 10 $(ETHERCALC_ARGS)

all: SocialCalcModule.js depends $(LS_FILES:src/%.ls=%.js)

$(LS_FILES:src/%.ls=%.js): %.js: src/%.ls
	env PATH="$$PATH:node_modules/.bin" lsc -c -o . $<

manifest ::
	perl -pi -e 's/# [A-Z].*\n/# @{[`date`]}/m' manifest.appcache

./node_modules/streamline/bin/_node :
	npm i --dev

depends: app.js static/ethercalc.js static/start.css

SocialCalcModule.js: $(SOCIALCALC_FILES) exports.js
	cat $(SOCIALCALC_FILES) exports.js > $@

static/ethercalc.js: $(ETHERCALC_FILES)
	@echo '// Auto-generated from "make depends"; all changes here will be lost.' > $@
	$(CLOSURE_COMPILER) --language_in=ES5 $(CLOSURE_ARGS) --js $(ETHERCALC_FILES) >> $@

.coffee.js:
	coffee -c $<

.sass.css:
	sass -t compressed $< > $@

clean ::
	@-rm $(JS_FILES)

push ::
	dotcloud push ethercalc

.SUFFIXES: .js .coffee .css .sass .ls

.PHONY: run vm expire all clean depends push
