describe('m.library', function () {
  var library = m.library;
  var Library = m.Library;
  var sandbox = sinon.sandbox.create();
  var ctx = lazy({}, 'set', beforeEach);

  afterEach(function () {
    library.reset();
    sandbox.restore();
  });

  it('is an instance of Library', function () {
    assert.instanceOf(m.library, Library);
  });

  describe('Library()', function () {
    ctx.set('library', function () {
      return new Library();
    });

    it('returns a new instance of Library', function () {
      assert.instanceOf(ctx.library, Library);
    });

    it('has a registry property', function () {
      assert.isObject(ctx.library.registry);
    });

    describe('.add()', function () {
      it('adds a new item to the registry', function () {
        var factory = function dom() {};
        ctx.library.add('dom', factory);

        var result = ctx.library.get('dom');
        assert.equal(result, factory);
      });

      it('raises an error if the item already exists', function () {
        ctx.library.add('dom', sandbox.spy());
        assert.throws(function () {
          ctx.library.add('dom', sandbox.spy());
        }, Error);
      });

      it('raises an error if the factory is not a function', function () {
        var types = [1, '1', {}, [], null, undefined, new Date()];
        _.each(types, function (type) {
          assert.throws(function () {
            ctx.library.add('dom', type);
          }, Error, null, 'Expected to throw for type: ' + type);
        });
      });

      it('returns itself', function () {
        var returns = ctx.library.add('dom', sandbox.spy());
        assert.equal(returns, ctx.library);
      });
    });

    describe('.has()', function () {
      it('returns true if the object is in the registry', function () {
        ctx.library.add('dom', function () {});
        assert.isTrue(ctx.library.has('dom'));
      });

      it('returns false if the object is in the registry', function () {
        assert.isFalse(ctx.library.has('dom'));
      });
    });

    describe('.get()', function () {
      it('returns the factory', function () {
        function dom() {}
        ctx.library.add('dom', dom);
        var result = ctx.library.get('dom');
        assert.equal(result, dom);
      });

      it('throws an error if the library item has not been registered', function () {
        assert.throws(function () {
          ctx.library.get('foo');
        }, Error)
      });
    });

    describe('.require()', function () {
      it('returns a new instance of ModuleDependencies', function () {
        assert.instanceOf(ctx.library.require(), m.ModuleDependencies);
      });

      describe('returned dependancies', function () {
        it('builds an instance of each of the dependencies', function () {
          var instance = {fake: 'dom'};
          var factory = sandbox.stub().returns(instance);

          ctx.library.add('dom', factory);
          var dependencies = ctx.library.require(['dom']);
          var instances = dependencies.build();

          assert.equal(instances.dom, instance);
        });
      });
    });
  });

  describe('ModuleDependencies()', function () {
    ctx.set('library', function () {
      return new Library();
    });

    ctx.set('dom', function () {
      return {teardown: sinon.stub()}
    });

    ctx.set('dependencies', function () {
      return new m.ModuleDependencies(ctx.library, ['dom']);
    });

    beforeEach(function () {
      ctx.library.add('dom', function () { return ctx.dom; });
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
