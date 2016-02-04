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
	third-party/class-js/lib/Class.js \
	third-party/wikiwyg/lib/Document/Emitter.js \
	third-party/wikiwyg/lib/Document/Emitter/HTML.js \
	third-party/wikiwyg/lib/Document/Parser.js \
	third-party/wikiwyg/lib/Document/Parser/Wikitext.js \
	static/jquery.js \
	static/vex.combined.min.js

LS_FILES=$(wildcard src/*.ls)

JS_FILES=$(LS_FILES:src/%.ls=%.js)

UGLIFYJS_ARGS = -c -m
ifdef DEBUG
  UGLIFYJS_ARGS += -b
endif

run: all
	node app.js --cors $(ETHERCALC_ARGS)

vm: all
	node app.js --vm $(ETHERCALC_ARGS)

expire: all
	node app.js --expire 10 $(ETHERCALC_ARGS)

all: SocialCalcModule.js depends $(JS_FILES)

$(JS_FILES): %.js: src/%.ls
	env PATH="$$PATH:./node_modules/livescript/bin" lsc -c -o . $<

manifest ::
	perl -pi -e 's/# [A-Z].*\n/# @{[`date`]}/m' manifest.appcache

./node_modules/streamline/bin/_node :
	npm i --dev

static/multi.js :: multi/main.ls multi/styles.styl
	webpack --optimize-minimize

depends: app.js static/ethercalc.js static/start.css static/multi.js

SocialCalcModule.js: $(SOCIALCALC_FILES) exports.js
	cat $(SOCIALCALC_FILES) exports.js > $@

static/ethercalc.js: $(ETHERCALC_FILES) SocialCalcModule.js
	@-mkdir .git
	@echo '// Auto-generated from "make depends"; ALL CHANGES HERE WILL BE LOST!' > $@
	node node_modules/zappajs/node_modules/uglify-js/bin/uglifyjs $(SOCIALCALC_FILES) $(ETHERCALC_FILES) $(UGLIFYJS_ARGS) --source-map ethercalc.js.map --source-map-include-sources >> $@
	mv ethercalc.js.map static

.coffee.js:
	coffee -c $<

.sass.css:
	sass -t compressed $< > $@

clean ::
	@-rm $(JS_FILES)

.SUFFIXES: .js .css .sass .ls
.PHONY: run vm expire all clean depends
