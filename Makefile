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

CLOSURE_COMPILER=closure-compiler

JS_FILES=\
	app.js dotcloud.js player.js main.js sc.js db.js

all :: SocialCalcModule.js
	env PATH="$$PATH:./node_modules/LiveScript/bin" lsc -c -o . src
	node app.js $(ETHERCALC_ARGS) --cors

manifest ::
	perl -pi -e 's/# [A-Z].*\n/# @{[`date`]}/m' manifest.appcache

vm :: SocialCalcModule.js
	env PATH="$$PATH:./node_modules/LiveScript/bin" lsc -c -o . src
	node app.js --vm $(ETHERCALC_ARGS)

expire :: SocialCalcModule.js
	env PATH="$$PATH:./node_modules/LiveScript/bin" lsc -c -o . src
	node app.js --expire 10 $(ETHERCALC_ARGS)

./node_modules/streamline/bin/_node :
	npm i --dev

static/multi.js :: multi/main.ls multi/styles.styl
	webpack --optimize-minimize

depends :: app.js static/ethercalc.js static/start.css static/multi.js

SocialCalcModule.js :: $(SOCIALCALC_FILES) exports.js
	cat $(SOCIALCALC_FILES) exports.js > $@
	#@perl -e 'system(join(" ", "closure-compiler" => map { ("--js", $$_) } @ARGV). " > $@")' $(SOCIALCALC_FILES) exports.js

static/ethercalc.js: $(ETHERCALC_FILES)
	@echo '// Auto-generated from "make depends"; all changes here will be lost.' > $@
	$(CLOSURE_COMPILER) --language_in=ES5 $(CLOSURE_ARGS) --js $(SOCIALCALC_FILES) $(ETHERCALC_FILES) >> $@

.coffee.js:
	coffee -c $<

.sass.css:
	sass -t compressed $< > $@

clean ::
	@-rm $(JS_FILES)

push ::
	dotcloud push ethercalc

.SUFFIXES: .js .coffee .css .sass .ls
