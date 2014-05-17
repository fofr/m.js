m.js
====

A module system for websites.

Usage
-----

Development and production builds are available from the releases[1] section
of the repository. Download and extract the m.zip file it contains the
m.js (development) and m.min.js (production) builds ready for use.

The whole library minified and gzipped currently weighs in at around 3.5kb.

[1]: https://github.com/aron/m.js/releases

Dependencies
------------

m requires that the jQuery[1] and underscore[2] libraries are available on
the page before the m.js script is included.

m also works using Zepto[3], a lightweight alternative to jQuery designed
for modern browsers and mobile devices. Just include Zepto instead of jQuery
in your document.

__NOTE:__ One known caveat with using Zepto is that the .teardown() method on
a module will not be called when a dom element is removed from the document.
You'll need to manage this yourself or port the special events API to Zepto.

When using an AMD loader you'll need to ensure the modules "jquery" and
"underscore" are available. For alternatives to jQuery you'll need to alias
the module (RequireJS provides the "map" configuration setting[4]).


[1]: http://jquery.com
[2]: http://underscorejs.org
[3]: http://zeptojs.com/
[4]: http://requirejs.org/docs/api.html#config-map

Development
-----------

It's very simple, hack on the code, ensure the lint and tests pass and submit
a pull request. Rinse and repeat.

To install the developer packages you'll need node and npm installed on your
machine. Then run:

    $ npm install

To run the linter:

    $ make lint

Code is organized by AMD modules using RequireJS and the CommonJS wrapper
pattern[1].

[1]: http://requirejs.org/docs/commonjs.html#manualconversion

Production
----------

To produce a concatenated build run:

    $ make build

To produce a development and production (minified) build ready for distribution run:

    $ make package

This will output a `pkg` directory containing the development, production files
as well as a zip file containing both files and the license. make package will
also output filesize info for the two files and a minified gzipped example for
reference.

Testing
-------

The entire test suite is run on Travis CI on each push you can check the current
state at any time by visiting: https://travis-ci.org/aron/m.js

To run the suite locally using phantomjs[1] run:

    $ make test

To run only a subset of tests a `grep` variable can be passed to make.

    $ make test grep=build

Alternatively tests can be run in the browser:

    $ make test

And open the browser at http://localhost:8000. You can choose a port by providing
a `port` env variable to make.

    $ make test port=4567

Finally, you can run the tests using an alternative DOM library such as Zepto
by passing the `DOM_LIBRARY` variable to make.

    $ make test DOM_LIBRARY=zepto

[1]: http://phantomjs.org

### Writing specs

These should be placed in the test/specs directory and the filename should
be the module name ending with `-spec.js`.

### Libraries

- Mocha[1]: Test runner, we use the `bdd` style.
- Chai[2]: Assertion library, we use `assert` style.
- Sinon[3]: Mocking and stubbing library.

[1]: http://visionmedia.github.com/mocha/
[2]: http://chaijs.com/api/assert/
[3]: http://sinonjs.org/docs

### Test Helper

There is also a `ctx.set` helper that allows you to assign lazy loaded properties
within your tests. For example:

    ctx.set('subject', 4);
    ctx.subject; // => 4

    ctx.set('subject', Math.random);
    ctx.subject; // => 0.1856299617793411
    ctx.subject; // => 0.1856299617793411

    ctx.set('fixture', document.createElement('div'));
    ctx.set('subject', function () {
      ctx.fixture.nodeName === 'DIV';
    });

License
-------

Available under the MIT license. See LICENSE file for details.
