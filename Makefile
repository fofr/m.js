json = $(shell node -p -e 'require("./package.json").$(1)')

NAME      = $(call json,name)
VERSION   = $(call json,version)
LICENSE   = $(call json,license)
HOMEPAGE  = $(call json,homepage)
COPYRIGHT = 2012-$(shell TZ=UTC date +%Y)

define HEADER
/*  $(NAME).js - v$(VERSION)
 *  Copyright $(COPYRIGHT), Readmill Network Ltd
 *  Released under the $(LICENSE) license
 *  More Information: $(HOMEPAGE)
 */
endef
export HEADER

define USAGE
Usage instructions:
    make serve                runs a development server on port 8000
    make serve port=[port]    runs a development server on the port specified
    make test                 runs the test suite using phantomjs
    make test grep=[filter]   runs the tests matching filter
    make clean                removes the pkg directory
    make build                creates a development build
    make package              creates a production (minified) build
    make help                 displays this message
endef
export USAGE

PKGDIR = pkg
MAXOUT = $(PKGDIR)/m.js
MINOUT = $(PKGDIR)/m.min.js

port ?= 8000

npmbin := $(shell npm bin)
runner := $(npmbin)/mocha-phantomjs
uglify := $(npmbin)/uglifyjs
jshint := $(npmbin)/jshint

default: help

help:
	@echo "$$USAGE"

pkgdir:
	@mkdir -p $(PKGDIR)

clean:
	@rm -rf $(PKGDIR)

build: pkgdir
	@rm -f $(MAXOUT)
	@cat vendor/{soak,broadcast}.js > $(MAXOUT)
	@echo "$$HEADER" >> $(MAXOUT)
	@cat lib/m.js lib/m/{dom,create,remove,sandbox,events,module}.js >> $(MAXOUT)
	@echo Created $(MAXOUT)

package: clean build
	@$(uglify) $(MAXOUT) --mangle --comments '/Copyright \d{4}/' --output $(MINOUT)
	@cat $(MINOUT) | gzip -c > $(MINOUT).gz
	@echo "Built files..."
	@ls -lahS pkg/*.{js,gz} | awk '{printf "%s\t%s\n", $$9, $$5}'
	@rm $(MINOUT).gz

	@zip -qj $(PKGDIR)/m.zip $(MAXOUT) $(MINOUT) LICENSE
	@echo "Created $(PKGDIR)/m.zip"

test: $(runner)
	@COLUMNS=$COLUMNS $(runner) --reporter=dot test/index.html?grep=$(grep)

serve:
	@echo "Tests are available at http://localhost:$(port)/test/index.html"
	@python -m SimpleHTTPServer $(port)

lint: $(jshint)
	@$(jshint) --show-non-errors --config=jshint.json lib && echo 'No lint errors found'

ci:
	@echo 'Running unit tests against jQuery...'
	@$(MAKE) test
	@echo 'Running unit tests against Zepto...'
	@$(MAKE) test DOM_LIBRARY=zepto
	@echo 'Linting JavaScript files...'
	@$(MAKE) lint

$(runner) $(uglify) $(jshint): $(npmbin)

$(npmbin):
	@npm install

.PHONY: help pkgdir clean build package test serve lint ci
