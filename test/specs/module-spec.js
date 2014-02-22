describe('m.module()', function () {
  var module = m.module;
  var Module = module.Module;
  var ModuleFactory = module.ModuleFactory;
  var ModuleRegistry = module.ModuleRegistry;
  var ctx = lazy();

  // Helper to setup the context outside of a before block.
  function set(name, value) {
    beforeEach(ctx.set.bind(ctx, name, value));
  };

  set('factory', function () {
    return new module.ModuleFactory('test');
  });
  set('element', function () {
    return document.createElement('div');
  });
  set('instance', function () {
    return ctx.factory.build().create({el: ctx.element});
  });
  set('fixture', function () {
    return document.createElement('div');
  });

  beforeEach(function () {
    document.body.appendChild(ctx.fixture);
  });

  afterEach(function () {
    ctx.fixture.parentNode.removeChild(ctx.fixture);
    ctx.set.clean();
  });

  it('forwards the call on to .define()', function () {
    var target = sinon.stub(module, 'define');
    var methods = {};
    module('test', methods);

    assert.called(target);
    assert.calledOn(target, module);
    assert.calledWith(target, 'test', methods);

    target.restore();
  });

  it('has all the properties from a ModuleRegistry instance', function () {
    var registry = new ModuleRegistry();
    for (var prop in registry) {
      assert.property(module, prop);
    }
  });

  describe('ModuleRegistry', function () {
    set('moduleRegistry', function () {
      return new m.module.ModuleRegistry();
    });

    describe('.define()', function () {
      it('adds a new item to the module.registry', function () {
        ctx.moduleRegistry.define('test', {});

        var test = ctx.moduleRegistry.registry.test;
        assert.instanceOf(test, ModuleFactory);
      });

      it('creates a new ModuleFactory instance', function () {
        var instance = new ModuleFactory('name');
        var target = sinon.stub(module, 'ModuleFactory').returns(instance);

        ctx.moduleRegistry.define('name');
        assert.calledWithNew(target);
        assert.calledWith(target, 'name', ctx.moduleRegistry.find);

        target.restore();
      });

      it('passes the methods into the ModuleFactory instance', function () {
        var methods = {method1: 'method1'};
        var instance = new ModuleFactory('name');
        var target = sinon.stub(instance, 'methods');

        sinon.stub(module, 'ModuleFactory').returns(instance);

        ctx.moduleRegistry.define('name', methods);
        assert.called(target);
        assert.calledWith(target, {method1: 'method1'});

        module.ModuleFactory.restore();
      });

      it('throws an exception if the module is already defined', function () {
        ctx.moduleRegistry.define('name', ctx.factory);
        assert.throws(function () {
          ctx.moduleRegistry.define('name', ctx.factory);
        });
      });

      it('returns the newly created object', function () {
        var instance = new ModuleFactory('name');
        var target = sinon.stub(module, 'ModuleFactory').returns(instance);
        assert.equal(ctx.moduleRegistry.define('name', ctx.factory), instance);
        target.restore();
      });
    });

    describe('.find()', function () {
      set('example', new ModuleFactory('example'));

      beforeEach(function () {
        ctx.moduleRegistry.registry.example = ctx.example;
      });

      it('finds an item in the module registry', function () {
        assert.equal(ctx.moduleRegistry.find('example'), ctx.example);
      });

      it('returns null if no module is found', function () {
        assert.isNull(ctx.moduleRegistry.find('non-existant'));
      });
    });

    describe('.create()', function () {
      it('creates a new instance of the module with the element', function () {
        ctx.moduleRegistry.define('my-new-module');
        var element = document.createElement('div');
        var options = {batman: 'two-face'};
        var result  = ctx.moduleRegistry.create('my-new-module', element, options);
        assert.equal(result.el, element);
        assert.equal(result.type(), 'my-new-module');
        assert.equal(result.options.batman, 'two-face');
      });
    });

    describe('.initialize()', function () {
      set('test1', function () {
        return new ModuleFactory('test1', {});
      });

      beforeEach(function () {
        ctx.element1 = m.$('<div data-test1>').appendTo(ctx.fixture);
        ctx.element2 = m.$('<div data-test1>').appendTo(ctx.fixture);
        ctx.element3 = m.$('<div data-test2>').appendTo(ctx.fixture);
        ctx.target = sinon.stub(ctx.moduleRegistry, 'instance');

        ctx.moduleRegistry.registry = {
          test1: ctx.test1
        };
      });

      it('finds all elements with the `data-*` attribute', function () {
        ctx.moduleRegistry.initialize(ctx.fixture);
        assert.called(ctx.target);
      });

      it('skips modules that are not functions', function () {
        ctx.moduleRegistry.initialize(ctx.fixture);
        assert.calledTwice(ctx.target);
      });

      it('calls module.instance() with the element and factory', function () {
        ctx.moduleRegistry.initialize(ctx.fixture);
        assert.calledWith(ctx.target, ctx.test1, ctx.element1[0]);
        assert.calledWith(ctx.target, ctx.test1, ctx.element2[0]);
      });

      describe('', function () {
        beforeEach(function () {
          ctx.delegate = sinon.stub(ctx.moduleRegistry, 'delegate');
        });

        afterEach(function () {
          ctx.delegate.restore();
        });

        it('delegates initilization to the document if events are provided', function () {
          ctx.test1.events = [{}];
          ctx.moduleRegistry.initialize(ctx.fixture);
          assert.called(ctx.delegate);
        });

        it('does not initialize the module if it is has been deferred', function () {
          ctx.test1.events = [{}];
          ctx.moduleRegistry.initialize(ctx.fixture);
          assert.notCalled(ctx.target);
        });
      });

      it('returns the module object', function () {
        assert.equal(ctx.moduleRegistry.initialize(), ctx.moduleRegistry);
      });
    });

    describe('.instance()', function () {
      beforeEach(function () {
        ctx.element = document.createElement('div');
        ctx.factory = new ModuleFactory('test');
        ctx.factory.options = ctx.defaults = {test1: 'a', test2: 'b', test3: 'c'};

        ctx.sandbox = {
          i18n: {
            translate: sinon.spy()
          }
        };
        sinon.stub(m, 'sandbox').returns(ctx.sandbox);

        ctx.module = Module.extend();
        ctx.instance = new ctx.module({el: ctx.element});

        sinon.stub(ctx.module, 'create', function () {
          return ctx.instance;
        });
        sinon.stub(ctx.factory, 'build').returns(ctx.module);

        ctx.extractedOptions = {test1: 1, test2: 2};
        sinon.stub(ctx.factory, 'extract').returns(ctx.extractedOptions);
      });

      afterEach(function () {
        m.sandbox.restore();
      });

      it('extract the options from the element', function () {
        ctx.moduleRegistry.instance(ctx.factory, ctx.element);

        assert.called(ctx.factory.extract);
        assert.calledWith(ctx.factory.extract, ctx.element);
      });

      it('not modify the defaults object', function () {
        var clone = _.extend({}, ctx.defaults);
        ctx.moduleRegistry.instance(ctx.factory, ctx.element);

        assert.deepEqual(ctx.defaults, clone);
      });

      it('create a sandbox object', function () {
        ctx.moduleRegistry.instance(ctx.factory, ctx.element);
        assert.called(m.sandbox);
      });

      it('initialize the module factory with the sandbox, options and translate function', function () {
        ctx.moduleRegistry.instance(ctx.factory, ctx.element);

        assert.called(ctx.module.create);
        assert.calledWith(ctx.module.create, _.extend({}, ctx.extractedOptions, {
          el: ctx.element,
          sandbox: ctx.sandbox
        }));
      });

      it('calls the .run() method', function () {
        var target = sinon.stub(ctx.instance, 'run');
        ctx.moduleRegistry.instance(ctx.factory, ctx.element);

        assert.called(target);
      });

      it('listens for the remove event and unbinds the listeners', function () {
        var target = sinon.stub(ctx.moduleRegistry, 'removeInstance');
        ctx.moduleRegistry.instance(ctx.factory, ctx.element);

        ctx.instance.emit('remove');
        assert.called(target);
        assert.calledWith(target, ctx.instance);

        target.restore();
      });

      it('it adds the instance to the module cache', function () {
        var target = sinon.stub(ctx.moduleRegistry, 'addInstance');
        ctx.moduleRegistry.instance(ctx.factory, ctx.element);

        assert.called(target);
        assert.calledWith(target, ctx.instance);

        target.restore();
      });

      it('simply calls run() if the module already exists', function () {
        ctx.moduleRegistry.instances.test = [ctx.instance];

        var target = sinon.stub(ctx.instance, 'run');
        ctx.moduleRegistry.instance(ctx.factory, ctx.element);

        assert.called(target);
        assert.notCalled(ctx.factory.build);
      });

      it('returns the newly created instance', function () {
        var instance = ctx.moduleRegistry.instance(ctx.factory, ctx.element);
        assert.instanceOf(instance, Module);
      });
    });

    describe('.delegate()', function () {
      set('events', function () { return [{on: 'click'}, {on: 'keypress'}]; });
      set('el', function () { return document.createElement('div'); });

      beforeEach(function () {
        ctx.factory.events = ctx.events;
        ctx.el.setAttribute('data-test', '');
        document.body.appendChild(ctx.el);

        ctx.set('target', sinon.stub(ctx.moduleRegistry, 'delegateHandler'));
      });

      afterEach(function () {
        document.body.removeChild(ctx.el);
      });

      it('registers an event handler on the document for each event', function () {
        ctx.moduleRegistry.delegate(ctx.factory);
        $(ctx.el).trigger('click');
        $(ctx.el).trigger('keypress');
        assert.calledTwice(ctx.target);
      });

      it('passes in the factory and options as data properties of the event', function () {
        ctx.moduleRegistry.delegate(ctx.factory);
        $(ctx.el).trigger('click');
        assert.calledWith(ctx.target, ctx.factory, ctx.events[0], sinon.match.object);
      });

      it('sets the `hasDelegated` flag on the factory', function () {
        ctx.moduleRegistry.delegate(ctx.factory);
        assert.isTrue(ctx.factory.hasDelegated);
      });

      it('does nothing if the `hasDelegated` flag is set on the factory', function () {
        ctx.factory.hasDelegated = true;
        ctx.moduleRegistry.delegate(ctx.factory);
        $(ctx.el).trigger('click');
        assert.notCalled(ctx.target);
      });
    });

    describe('.delegateHandler', function () {
      set('event', function () {
        var event = _.clone(m.$.Event('click'));
        event.currentTarget = ctx.element;
        event.preventDefault = sinon.spy();
        return event;
      });

      beforeEach(function () {
        ctx.element = document.createElement('div');
        ctx.target = sinon.stub(ctx.moduleRegistry, 'instance');
      });

      it('instantiates the module with the factory and current event target', function () {
        ctx.moduleRegistry.delegateHandler(ctx.factory, {}, ctx.event);
        assert.calledWith(ctx.target, ctx.factory, ctx.element);
      });

      it('prevents the default event action', function () {
        ctx.moduleRegistry.delegateHandler(ctx.factory, {}, ctx.event);
        assert.called(ctx.event.preventDefault);
      });

      it('does not prevent the default event action if options.preventDefault is false', function () {
        ctx.moduleRegistry.delegateHandler(ctx.factory, {preventDefault: false}, ctx.event);
        assert.notCalled(ctx.event.preventDefault);
      });

      it('does not try to call options.callback if it is not a function', function () {
        var context = ctx;
        [null, undefined, 'string', 10, false, true].forEach(function (value) {
          assert.doesNotThrow(function () {
            context.moduleRegistry.delegateHandler(context.factory, {callback: value}, context.event);
          });
        });
      });

      it('does nothing if the meta key is held down', function () {
        ctx.event.metaKey = true;
        ctx.moduleRegistry.delegateHandler(ctx.factory, {}, ctx.event);
        assert.notCalled(ctx.target);
      });
    });

    describe('.findInstance()', function () {
      it('finds an instance for the factory and element provided', function () {
        ctx.moduleRegistry.instances.test = [ctx.instance];
        var target = ctx.moduleRegistry.findInstance(ctx.factory, ctx.element);
        assert.strictEqual(target, ctx.instance);
      });

      it('returns null if no instance can be found', function () {
        var target = ctx.moduleRegistry.findInstance(ctx.factory, ctx.element);
        assert.isNull(target);
      });
    });

    describe('.addInstance()', function () {
      it('adds the instance to the module.instances cache', function () {
        var target = ctx.moduleRegistry.addInstance(ctx.instance);
        assert.deepEqual(ctx.moduleRegistry.instances.test, [ctx.instance]);
      });

      it('creates the array if it does not already exist', function () {
        var target = ctx.moduleRegistry.addInstance(ctx.instance);
        assert.deepEqual(ctx.moduleRegistry.instances.test, [ctx.instance]);
      });
    });

    describe('.removeInstance()', function () {
      beforeEach(function () {
        ctx.moduleRegistry.instances.test = [ctx.instance];
      });

      it('removes the instance from the cache', function () {
        ctx.moduleRegistry.removeInstance(ctx.instance);
        assert.deepEqual(ctx.moduleRegistry.instances.test, []);
      });
    });

    describe('.lookup()', function () {
      beforeEach(function () {
        ctx.moduleRegistry.instances.test = [ctx.instance];
      });

      it('returns all modules for the element provided', function () {
        var result = ctx.moduleRegistry.lookup(ctx.instance.el);
        assert.deepEqual(result, [ctx.instance]);
      });

      it('returns an empty array if no elements are found', function () {
        var result = ctx.moduleRegistry.lookup(document.createElement('a'));
        assert.deepEqual(result, []);
      });

      it('returns the exact module if a type is provided', function () {
        var result = ctx.moduleRegistry.lookup(ctx.instance.el, 'test');
        assert.equal(result, ctx.instance);
      });

      it('returns null if the module was not found for the element provided', function () {
        var result = ctx.moduleRegistry.lookup(ctx.instance.el, 'non-existant');
        assert.isNull(result);
      });
    });

    describe('.mixin()', function () {
      it('extends the Module prototype', function () {
        var methods = {method1: function () {}, prop1: 'property'};

        ctx.moduleRegistry.mixin(methods);

        assert.propertyVal(Module.prototype, 'prop1', 'property');
        assert.propertyVal(Module.prototype, 'method1', methods.method1);
      });

      it('throws an error if the property has already been set', function () {
        Module.prototype.method1 = function () {};

        assert.throws(function () {
          ctx.moduleRegistry.mixin({method1: function () {}});
        });
      });
    });
  });

  describe('ModuleFactory()', function () {
    set('name', function () {
      return 'example';
    });
    set('findModule', function () {
      return sinon.spy();
    });
    set('methods', function () {
      return {};
    });
    set('subject', function () {
      return new ModuleFactory(ctx.name, ctx.findModule);
    });

    it('throws an error if no type is provided', function () {
      assert.throws(function () {
        new ModuleFactory();
      });
    });

    it('has a type property', function () {
      assert.equal(ctx.subject.type, 'example');
    });

    it('has a data property', function () {
      assert.equal(ctx.subject.namespace, 'data-example');
    });

    it('has a selector property', function () {
      assert.equal(ctx.subject.selector, '[data-example]');
    });

    it('sets the findModule() method to the passed function', function () {
      assert.equal(ctx.subject.findModule, ctx.findModule);
    });

    it('does not set the findModule() method if no function is provided', function () {
      ctx.findModule = null;
      assert.isFalse(_.has(ctx.subject, 'findModule'), 'subject should not have own property findModule');
    });

    describe('.build()', function () {
      it('builds a new Module instance', function () {
        assert.instanceOf(ctx.subject.build().prototype, Module);
      });

      it('returns the same object if called more than once', function () {
        assert.strictEqual(ctx.subject.build(), ctx.subject.build());
      });

      it('returns a new object if the force option is true', function () {
        var first = ctx.subject.build();
        var second = ctx.subject.build({force: true});
        assert.notStrictEqual(first, second);
      });

      it('uses the parent if provided', function () {
        var target = ctx.subject.parent = new ModuleFactory('parent').build();
        assert.instanceOf(ctx.subject.build().prototype, target);
      });

      it('extends the prototype with properties if provided', function () {
        function method1() {}
        ctx.subject.properties.method1 = method1;
        assert.strictEqual(ctx.subject.build().prototype.method1, method1);
      });

      it('creates a named constructor function', function () {
        var constructor = ctx.subject.build();
        assert.equal(constructor.name, 'ExampleModule');
      });
    });

    describe('.extend()', function () {
      it('sets the parent property to the child Module provided', function () {
        var ParentModule = Module.extend();
        ctx.subject.extend(ParentModule);
        assert.strictEqual(ctx.subject.parent, ParentModule);
      });

      it('throws an error if the parent is not a Module constructor', function () {
        _.each([null, 'test', new Module(), new ModuleFactory('fake'), ModuleFactory], function (parent) {
          assert.throws(function () {
            ctx.subject.extend(parent);
          });
        }, ctx);
      });

      it('uses the findModule() function to lookup a string', function () {
        var ParentModule = Module.extend();
        ctx.findModule = sinon.stub().returns(ParentModule);

        ctx.subject.extend(ParentModule);
        assert.strictEqual(ctx.subject.parent, ParentModule);
      });

      it('returns itself', function () {
        var ParentModule = Module.extend();
        assert.strictEqual(ctx.subject.extend(ParentModule), ctx.subject);
      });
    });

    describe('.methods()', function () {
      it('extends the properties object with the new methods', function () {
        function myMethod() {}

        ctx.subject.methods({
          prop: 'my-prop',
          method: myMethod
        });

        assert.propertyVal(ctx.subject.properties, 'prop', 'my-prop');
        assert.propertyVal(ctx.subject.properties, 'method', myMethod);
      });

      it('throws an error if a property is added twice', function () {
        ctx.subject.properties.prop = 'exists';
        assert.throws(function () {
          ctx.subject.methods({
            prop: 'my-prop'
          });
        });
      });

      it('returns itself', function () {
        assert.strictEqual(ctx.subject.methods(), ctx.subject);
      });
    });

    describe('.mixin()', function () {
      it('is an alias for .methods()', function () {
        assert.strictEqual(ctx.subject.mixin, ctx.subject.methods);
      });
    });

    describe('.options()', function () {
      it('sets the default options for the module', function () {
        ctx.subject.options({
          limit: 5,
          offset: 2,
          url: 'http://example.com'
        });

        assert.propertyVal(ctx.subject.defaults, 'limit', 5);
        assert.propertyVal(ctx.subject.defaults, 'offset', 2);
        assert.propertyVal(ctx.subject.defaults, 'url', 'http://example.com');
      });

      it('returns itself', function () {
        assert.strictEqual(ctx.subject.options({limit: '5'}), ctx.subject);
      });
    });

    describe('.defer()', function () {
      it('pushes the event into the events queue', function () {
        var event = {on: 'click', preventDefault: false};
        ctx.subject.defer(event);

        assert.include(ctx.subject.events, event);
      });

      it('throws an error if the "on" property is missing', function () {
        var event = {preventDefault: false};

        assert.throws(function () {
          ctx.subject.defer(event);
        });
      });

      it('returns itself', function () {
        assert.strictEqual(ctx.subject.defer({on: 'click'}), ctx.subject);
      });
    });

    describe('.isDeferred()', function () {
      it('returns true if the factory has registered events', function () {
        ctx.subject.events.push({});
        assert.isTrue(ctx.subject.isDeferred());
      });

      it('returns false if the factory has no registered events', function () {
        assert.isFalse(ctx.subject.isDeferred());
      });
    });

    describe('.extract()', function () {
      it('extracts the data keys from the element', function () {
        var element = $('<div>', {
          'data-not-module': 'skip',
          'data-example': 'skip',
          'data-example-a': 'capture',
          'data-example-b': 'capture',
          'data-example-c': 'capture'
        })[0];

        var target = ctx.subject.extract(element);
        assert.deepEqual(target, {a: 'capture', b: 'capture', c: 'capture'});
      });

      it('converts JSON contents of keys into JS primitives', function () {
        var element = $('<div>', {
          'data-example-null': 'null',
          'data-example-int': '100',
          'data-example-arr': '[1, 2, 3]',
          'data-example-obj': '{"a": 1, "b":2, "c": 3}',
          'data-example-str': 'hello'
        })[0];

        var target = ctx.subject.extract(element);

        assert.deepEqual(target, {
          'null': null,
          'int': 100,
          'arr': [1, 2, 3],
          'obj': {"a": 1, "b": 2, "c": 3},
          'str': 'hello'
        });
      });

      it('uses strings for content that it cannot parse as JSON', function () {
        var element = $('<div>', {
          'data-example-url': 'http://example.com/path/to.html',
          'data-example-bad': '{oh: 1, no'
        })[0];

        var target = ctx.subject.extract(element);

        assert.deepEqual(target, {
          'url': 'http://example.com/path/to.html',
          'bad': '{oh: 1, no'
        });
      });

      it('converts keys with hyphens into camelCase', function () {
        var element = $('<div>', {
          'data-example-long-property': 'long',
          'data-example-really-very-long-property': 'longer'
        })[0];

        var target = ctx.subject.extract(element);

        assert.deepEqual(target, {
          'longProperty': 'long',
          'reallyVeryLongProperty': 'longer'
        });
      });

      it('handles modules with hyphens in the name', function () {
        ctx.name = 'long-example';

        var element = $('<div>', {
          'data-long-example-long-property': 'long',
          'data-long-example-really-very-long-property': 'longer'
        })[0];

        var target = ctx.subject.extract(element);

        assert.deepEqual(target, {
          'longProperty': 'long',
          'reallyVeryLongProperty': 'longer'
        });
      });

      it('sets boolean attributes to true', function () {
        var element = $('<div>', {
          'data-example-long-property': ''
        })[0];

        var target = ctx.subject.extract(element);

        assert.deepEqual(target, {'longProperty': true});
      });
    });
  });

  describe('Module()', function () {
    set('el', function () {
      return document.createElement('div');
    });
    set('sandbox', function () {
      return m.sandbox();
    });
    set('options', function () {
      return {el: ctx.el, sandbox: ctx.sandbox};
    });
    set('subject', function () {
      return new Module(ctx.options);
    });

    it('is an instance of Events', function () {
      assert.instanceOf(ctx.subject, m.Events);
    });

    it('assigns .el as the element option', function () {
      assert.ok(ctx.subject.el === ctx.el);
    });

    it('wraps .$el in $ if not already wrapped', function () {
      // Zepto appears to extend the normal array. So is more difficult to
      // test for than jQuery so here we have a forked test :(
      // https://github.com/madrobby/zepto/issues/349#issuecomment-4985091
      if (m.$.zepto) {
        assert.ok(m.$.zepto.isZ(ctx.subject.$el));
      } else {
        assert.ok(ctx.subject.$el instanceof m.$);
      }
    });

    it('assigns the sandbox property', function () {
      assert.equal(ctx.subject.sandbox, ctx.sandbox);
    });

    it('assigns a cid property', function () {
      assert.match(ctx.subject.cid, /base:\d+/);
    });

    it('assigns the options property', function () {
      ctx.options['foo'] = 'bar';
      assert.equal(ctx.subject.options.foo, 'bar');
      assert.notEqual(ctx.subject.options, Module.prototype.options);
    });

    it('triggers the "module:create" event if sandbox.publish exists', function () {
      var target = sinon.spy();

      ctx.sandbox = {publish: target};
      var subject = ctx.subject;
      assert.called(target);
      assert.calledWith(target, 'module:create', ctx.options, ctx.subject);
    });

    it('initializes the module', function () {
      var target = sinon.spy();
      var ChildModule = Module.extend({initialize: target});

      new ChildModule();
      assert.called(target);
    });

    it('sets up the event handlers', function () {
      var target = sinon.spy();
      var ChildModule = Module.extend({
        events: {click: '_onClick'},
        _onClick: target
      });

      var childModule = new ChildModule();
      childModule.$el.click();
      assert.called(target);
    });

    // The teardown feature is not currently supported by Zepto and needs
    // to be patched in with another library[1]?
    // [1]: https://github.com/Enideo/zepto-events-special
    if (m.$.zepto) {
      it('auto teardown after dom removal is not supported using Zepto due to a lack of $.event.special support');
    } else {
      it('tears down when module element is removed', function () {
        var target = ctx.subject.teardown = sinon.spy();
        ctx.fixture.appendChild(ctx.subject.el);
        ctx.subject.$el.remove();
        assert.called(target);
      });
    }

    describe('.$()', function () {
      it('find children within the module element', function () {
        ctx.subject.$el.append($('<input /><input />'));
        assert.equal(ctx.subject.$('input').length, 2);
      });
    });

    describe('.type()', function () {
      it('returns the module factory type', function () {
        assert.equal(ctx.subject.type(), 'base');
      });
    });

    describe('.run()', function () {
      it('simply returns itself', function () {
        assert.strictEqual(ctx.subject.run(), ctx.subject);
      });
    });

    describe('.html()', function () {
      it('sets the html of the element', function () {
        var html = '<div data-superman="yes">Superman lives here</div>';
        ctx.subject.html(html);
        assert.equal(ctx.subject.$el.html(), html);
      });

      it('triggers the "module:html" event if sandbox.publish exists', function () {
        var target = sinon.spy();

        ctx.subject.sandbox = {publish: target};
        ctx.subject.html('<div></div>');
        assert.called(target);
        assert.calledWith(target, 'module:html', '<div></div>', ctx.subject);
      });

      it('returns itself', function () {
        assert.strictEqual(ctx.subject.html(), ctx.subject);
      });
    });

    describe('.initialize()', function () {
      it('exists as a no-op', function () {
        assert.isFunction(ctx.instance.initialize);
      });
    });

    describe('.teardown()', function () {
      it('exists as a no-op', function () {
        assert.isFunction(ctx.instance.teardown);
      });
    });

    describe('.remove()', function () {
      it('tears down the module', function () {
        var target = sinon.stub(ctx.subject, 'teardown');
        ctx.subject.remove();

        assert.called(target);
      });

      it('triggers the "remove" event on itself', function () {
        var target = sinon.spy();
        ctx.subject.addListener('remove', target);

        ctx.subject.remove();
        assert.called(target);
        assert.calledWith(target, ctx.subject);
      });

      it('triggers the "module:remove" event if sandbox.publish exists', function () {
        var target = sinon.spy();

        ctx.subject.sandbox = {publish: target};
        ctx.subject.remove();
        assert.called(target);
        assert.calledWith(target, 'module:remove', ctx.subject);
      });

      it('removes the element from the page', function () {
        ctx.fixture.appendChild(ctx.subject.el);
        ctx.subject.remove();

        assert.equal(ctx.fixture.children.length, 0);
      });
    });

    describe('.delegateEvents()', function () {
      it('binds a handler for an event on the module element', function () {
        var target = ctx.subject._onClick = sinon.spy();

        ctx.subject.delegateEvents({'click': '_onClick'});
        ctx.subject.$el.click();

        assert.called(target);
      });

      it('delegates a handler for an event on a child element', function () {
        var target = ctx.subject._onClick = sinon.spy();
        ctx.subject.el.appendChild(document.createElement('span'));

        // Append to body for event bubbling to work.
        document.body.appendChild(ctx.subject.el)

        ctx.subject.delegateEvents({'click span': '_onClick'});
        ctx.subject.$('span').trigger('click');

        assert.called(target);

        document.body.removeChild(ctx.subject.el)
      });

      it('binds the handler to the module scope', function () {
        var target = ctx.subject._onClick = sinon.spy();

        ctx.subject.delegateEvents({'click': '_onClick'});
        ctx.subject.$el.click();

        assert.calledOn(target, ctx.subject);
      });

      it('accepts a function rather than a method name', function () {
        var target = sinon.spy();

        ctx.subject.delegateEvents({'click': target});
        ctx.subject.$el.click();

        assert.called(target);
      });

      it('unbinds all existing delegated events', function () {
        var target = sinon.spy();

        ctx.subject.delegateEvents({'click': target});
        ctx.subject.delegateEvents();
        ctx.subject.$el.click();

        assert.notCalled(target);
      });
    });

    describe('.undelegateEvents()', function () {
      it('unbinds listeners bound using .delegateEvents()', function () {
        var target = sinon.spy();

        ctx.subject.delegateEvents({'click': target});
        ctx.subject.undelegateEvents();
        ctx.subject.$el.click();

        assert.notCalled(target);
      });

      it('does not unbind other listeners', function () {
        var target = sinon.spy();

        ctx.subject.$el.on('click', target);
        ctx.subject.undelegateEvents();
        ctx.subject.$el.click();

        assert.called(target);
      });
    });
  });

  describe('m.events.on(module:remove)', function () {
    it('removes all handlers registered by the sandbox', function () {
      var target = sinon.spy();
      m.events.publish('module:remove', {sandbox: {unsubscribe: target}});

      assert.called(target);
      assert.calledWithExactly(target);
    });
  });

  describe('m.events.on(module:html)', function () {
    it('reinitializes the module', function () {
      var target = sinon.stub(m.module, 'initialize');
      var el = document.createElement('div');
      m.events.publish('module:html', '<div>NewHTML</div>', {el: el});
      assert.calledWith(target, el);
      target.restore();
    });
  });
});
