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

JS_FILES=\
	app.js dotcloud.js player.js main.js sc.js db.js

all :: SocialCalcModule.js static/ethercalc.js
	@sed -i "s/Updated.*/Updated $(shell date)/" manifest.appcache
	env PATH="$$PATH:../node_modules/LiveScript/bin" livescript -c -o . src
	node app.js $(ETHERCALC_ARGS)

only :: SocialCalcModule.js static/ethercalc.js
	@sed -i "s/Updated.*/Updated $(shell date)/" manifest.appcache
	env PATH="$$PATH:../node_modules/LiveScript/bin" livescript -c -o . src
	@echo -e '\a'
	@read -p "Press [Enter]"
	
vm :: SocialCalcModule.js
	env PATH="$$PATH:../node_modules/LiveScript/bin" livescript -c -o . src
	node app.js --vm $(ETHERCALC_ARGS)

expire :: SocialCalcModule.js
	env PATH="$$PATH:../node_modules/LiveScript/bin" livescript -c -o . src
	node app.js --expire 10 $(ETHERCALC_ARGS)

./node_modules/streamline/bin/_node :
	npm i --dev

depends :: app.js static/ethercalc.js static/start.css

SocialCalcModule.js :: $(SOCIALCALC_FILES) exports.js 
	cat $(SOCIALCALC_FILES) exports.js > $@
	@cp $(SOCIALCALC_FILES) /cygdrive/c/Users/eddy/Dropbox/ethercalc/
	@cp src/*.ls /cygdrive/c/Users/eddy/Dropbox/ethercalc/src/
	#@perl -e 'system(join(" ", "closure-compiler" => map { ("--js", $$_) } @ARGV). " > $@")' $(SOCIALCALC_FILES) exports.js

static/ethercalc.js :: $(ETHERCALC_FILES)
	@echo "// Auto-generated from "make depends"; all changes here will be lost. CellMaster" > $@
	@java -jar ../closure-compiler/compiler.jar --js $(ETHERCALC_FILES) --warning_level QUIET --formatting PRETTY_PRINT >> $@
	#@java -jar ../closure-compiler/compiler.jar --js $(ETHERCALC_FILES) --warning_level QUIET >> $@
	#@cat $(ETHERCALC_FILES) >> $@
	#@perl -e 'system(join(" ", "closure-compiler" => "--language_in=ES5" => map { ("--js", $$_) } @ARGV). " >> $@")' $(ETHERCALC_FILES) 
 
.coffee.js:
	coffee -c $<

.sass.css:
	sass -t compressed $< > $@

clean ::
	@-rm $(JS_FILES)

push ::
	dotcloud push ethercalc

.SUFFIXES: .js .coffee .css .sass .ls
