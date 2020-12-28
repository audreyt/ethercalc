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

ifneq ("$(wildcard static/jquery-ui.min.js)","")
	ETHERCALC_FILES += static/jquery-ui.min.js
endif

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

all: depends $(JS_FILES)

$(JS_FILES): %.js: src/%.ls
	env PATH="$$PATH:./node_modules/livescript/bin" lsc -c -o . $<

manifest ::
	perl -pi -e 's/# [A-Z].*\n/# @{[`date`]}/m' manifest.appcache

./node_modules/uglify-js/bin/uglifyjs :
	npm install uglify-js

static/multi.js :: multi/main.ls multi/styles.styl
	webpack --optimize-minimize

depends: app.js static/ethercalc.js static/start.css static/multi.js

static/ethercalc.js: $(ETHERCALC_FILES) \
     ./node_modules/socialcalc/dist/SocialCalc.js \
     ./node_modules/uglify-js/bin/uglifyjs
	@-mkdir -p .git
	@echo '// Auto-generated from "make depends"; ALL CHANGES HERE WILL BE LOST!' > $@
	node node_modules/uglify-js/bin/uglifyjs node_modules/socialcalc/dist/SocialCalc.js $(ETHERCALC_FILES) $(UGLIFYJS_ARGS) --source-map includeSources -o tmpec.js
	cat tmpec.js >> $@
	rm tmpec.js
	mv tmpec.js.map static/ethercalc.js.map

COFFEE := $(shell command -v coffee 2> /dev/null)
.coffee.js:
ifndef COFFEE
	$(error "coffee is not available please install sass")
endif
	coffee -c $<

SASS := $(shell command -v sass 2> /dev/null)
.sass.css:
ifndef SASS
	$(error "sass is not available please install sass")
endif
	sass -t compressed $< > $@

clean ::
	@-rm $(JS_FILES)
	@-rm static/ethercalc.js static/ethercalc.js.map

.SUFFIXES: .js .css .sass .ls
.PHONY: run vm expire all clean depends
