describe('m.libraries', function () {
  var libraries = m.libraries;
  var LibraryRegistry = m.LibraryRegistry;
  var sandbox = sinon.sandbox.create();
  var ctx = lazy({}, 'set', beforeEach);

  afterEach(function () {
    libraries.reset();
    sandbox.restore();
  });

  it('is an instance of LibraryRegistry', function () {
    assert.instanceOf(m.libraries, LibraryRegistry);
  });

  describe('LibraryRegistry()', function () {
    ctx.set('libraries', function () {
      return new LibraryRegistry();
    });

    it('returns a new instance of LibraryRegistry', function () {
      assert.instanceOf(ctx.libraries, LibraryRegistry);
    });

    it('has a registry property', function () {
      assert.isObject(ctx.libraries.registry);
    });

    describe('.add()', function () {
      it('adds a new item to the registry', function () {
        var factory = function dom() {};
        ctx.libraries.add('dom', factory);

        var result = ctx.libraries.get('dom');
        assert.equal(result, factory);
      });

      it('raises an error if the item already exists', function () {
        ctx.libraries.add('dom', sandbox.spy());
        assert.throws(function () {
          ctx.libraries.add('dom', sandbox.spy());
        }, Error);
      });

      it('raises an error if the factory is not a function', function () {
        var types = [1, '1', {}, [], null, undefined, new Date()];
        _.each(types, function (type) {
          assert.throws(function () {
            ctx.libraries.add('dom', type);
          }, Error, null, 'Expected to throw for type: ' + type);
        });
      });

      it('returns itself', function () {
        var returns = ctx.libraries.add('dom', sandbox.spy());
        assert.equal(returns, ctx.libraries);
      });
    });

    describe('.has()', function () {
      it('returns true if the object is in the registry', function () {
        ctx.libraries.add('dom', function () {});
        assert.isTrue(ctx.libraries.has('dom'));
      });

      it('returns false if the object is in the registry', function () {
        assert.isFalse(ctx.libraries.has('dom'));
      });
    });

    describe('.get()', function () {
      it('returns the factory', function () {
        function dom() {}
        ctx.libraries.add('dom', dom);
        var result = ctx.libraries.get('dom');
        assert.equal(result, dom);
      });

      it('throws an error if the libraries item has not been registered', function () {
        assert.throws(function () {
          ctx.libraries.get('foo');
        }, Error)
      });
    });

    describe('.require()', function () {
      it('returns a new instance of LibraryModuleDependencies', function () {
        assert.instanceOf(ctx.libraries.require(), m.LibraryModuleDependencies);
      });

      describe('returned dependancies', function () {
        it('builds an instance of each of the dependencies', function () {
          var instance = {fake: 'dom'};
          var factory = sandbox.stub().returns(instance);

          ctx.libraries.add('dom', factory);
          var dependencies = ctx.libraries.require(['dom']);
          var instances = dependencies.build();

          assert.equal(instances.dom, instance);
        });
      });
    });
  });

  describe('LibraryModuleDependencies()', function () {
    ctx.set('libraries', function () {
      return new LibraryRegistry();
    });

    ctx.set('dom', function () {
      return {teardown: sinon.stub()}
    });

    ctx.set('dependencies', function () {
      return new m.LibraryModuleDependencies(ctx.libraries, ['dom']);
    });

    beforeEach(function () {
      ctx.libraries.add('dom', function () { return ctx.dom; });
    });

    describe('.build()', function () {
      it('returns an instance of each of the dependencies', function () {
        var built = ctx.dependencies.build();
        assert.equal(built.dom, ctx.dom);
      });
    });

    describe('.teardown()', function () {
      it('calls .teardown() on each of the instances', function () {
        ctx.dependencies.build();
        ctx.dependencies.teardown();
        assert.called(ctx.dom.teardown);
      });

      it('does not error if the instance has no .teardown() method', function () {
        ctx.dom.teardown = null;

        ctx.dependencies.build();
        assert.doesNotThrow(function () {
          ctx.dependencies.teardown();
        });
      });
    });
  });
});
