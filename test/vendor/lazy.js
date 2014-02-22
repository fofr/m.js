/* Lazy.js - v0.3.0
 * Copyright 2012-2014, Aron Carroll / Readmill Network Ltd
 * Released under the MIT license
 * More Information: http://github.com/aron/lazy.js
 *
 * Allow for creating of test variables with lazy subject evaluation in the
 * style of RSpec's let and subject. The named property is set to either a
 * static value, or a factory function which is lazily evaluated and memoized.
 *
 * This is useful for unit tests where you sometimes want to defer
 * initializaton of test variables until later in the suite.
 *
 * Examples
 *
 *   var obj = lazy();
 *
 *   obj.set('target', 'boom');
 *   obj.target // => 'boom'
 *
 *   obj.set('target', 4);
 *   obj.target // => 4
 *
 *   obj.set('target', function () { Math.random() });
 *   obj.target # => 0.1856299617793411
 *   obj.target # => 0.1856299617793411
 *
 *   // The context of the inner function is the lazy object.
 *   obj.set('fixture', 'fixture');
 *   obj.set('target', function () { this.fixture === 'fixture' //=> true });
 *
 *   // Call .restore() to remove all added properties.
 *   obj.set.restore();
 *   obj.target //=> undefined
 *
 *   // The method name can also be specifed, I prefer "let" but it is a
 *   // reserved word, so I'll leave it to you to decide.
 *   var obj = lazy({}, 'let');
 *   obj.let('number', function () { Math.random() });
 *   obj.number //=> 0.3537909844890237
 *
 * Returns context.
 */
(function (module) {
  function lazy(context, method) {
    var cache = {};

    method  = method  || 'set';
    context = context || {};

    Object.defineProperty(context, method, {
      value: function (name, value) {
        var subject = arguments.length === 2 ? value : null;

        cache[name] = value;

        Object.defineProperty(context, name, {
          get: function () {
            var isFunction = typeof subject === 'function';
            var isMocked = isFunction && typeof subject.getCall === 'function';

            // If this is a plain function then call it and return the value
            // overwrite this getter with a standard property. However if it's
            // a sinon mock then just return it without calling it.
            return context[name] = isFunction && !isMocked ? subject.call(context) : subject;
          },
          set: function (value) {
            // If the object is assigned directly overwrite the getter and
            // treat as a normal property assignment.
            Object.defineProperty(context, name, {value: value, enumerable: true, writeable: true, configurable: true});
          },
          configurable: true,
          enumerable: true // Ensure it behaves like a standard assignment.
        });
      }
    });

    // Restores the key back to the last defined state. This can be useful
    // for resetting a context between tests for example.
    //
    // Examples
    //
    //   var ctx = lazy();
    //   ctx.set('foo', 'bar');
    //
    //   it('does something', function () {
    //     ctx.set('foo', 'baz');
    //   });
    //
    //   afterEach(function () {
    //     ctx.restore(); // Reset context for next test.
    //     ctx.foo === 'bar';
    //   });
    //
    // Returns nothing.
    context[method].restore = function () {
      for (var key in cache) {
        if (cache.hasOwnProperty(key)) {
          context[method](key, cache[key]);
        }
      }
    };

    // Clean up all test variables lazy evaluated with this.lazy().
    // As an alternative to restore() this can be called in afterEach() to
    // clean up the context after each test so that tests do not pollute each
    // other.
    //
    // Examples
    //
    //   beforeEach(function () {
    //     lazy(this);
    //     this.set('foo', 'bar');
    //   });
    //
    //   afterEach(function () {
    //     this.set.clean() // Cleans up lazily-defined variables on obj.
    //     this.foo // undefined
    //   });
    //
    // Returns nothing.
    context[method].clean = function () {
      for (var key in cache) {
        if (cache.hasOwnProperty(key)) {
          delete context[key];
        }
      }
      cache = {};
    };

    return context;
  }

  // Export the function for various environments.
  if (typeof module.define === 'function' && module.define.amd) {
    module.define('lazy', function () {
      return lazy;
    });
  } else if (module.exports) {
    module.exports = lazy;
  } else {
    module.lazy = lazy;
  }
})(typeof module === 'object' ? module : this);
