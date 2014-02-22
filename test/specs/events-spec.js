describe('m.events', function () {
  var events = m.events;
  var callbacks = events._callbacks; // Cache the original callbacks.
  var ctx = lazy();

  // Helper to setup the context outside of a before block.
  function set(name, value) {
    beforeEach(ctx.set.bind(ctx, name, value));
  };

  afterEach(function () {
    events._callbacks = callbacks;
    ctx.set.clean();
  });

  it('is an instance of Events', function () {
    assert.instanceOf(events, m.Events);
  });

  set('handler1', function () { return sinon.spy() });
  set('handler2', function () { return sinon.spy() });
  set('handler3', function () { return sinon.spy() });

  describe('', function () {
    beforeEach(function () {
      events.subscribe('dropdown:open', ctx.handler1);
      events.subscribe('dropdown:close', ctx.handler2);
      events.subscribe('search:submit', ctx.handler3);
    });

    describe('.pause()', function () {
      it('prevents events being published', function () {
        events.pause();
        events.publish('dropdown:open');
        events.publish('dropdown:close');
        events.publish('search:submit');

        assert.notCalled(ctx.handler1);
        assert.notCalled(ctx.handler2);
        assert.notCalled(ctx.handler3);
        events.resume();
      });

      it('allows module:* events through', function () {
        var handler = sinon.spy();

        events.subscribe('module:create', handler);

        events.pause();
        events.publish('module:create');

        assert.called(handler);
        events.resume();
      });
    });

    describe('.resume()', function () {
      it('republishes all cached events', function () {
        events.pause();
        events.publish('dropdown:open');
        events.publish('dropdown:close');
        events.publish('search:submit');
        events.resume();

        assert.called(ctx.handler1);
        assert.called(ctx.handler2);
        assert.called(ctx.handler3);
      });
    });
  });

  describe('SandboxEvents()', function () {
    set('instance', function () {
      return new m.SandboxEvents(events);
    });

    describe('.publish()', function () {
      it('publishes an event on the events object', function () {
        var calls = [
          [['dropdown:open'], sinon.spy()],
          [['dropdown:toggle', true], sinon.spy()],
          [['dropdown', {}, [], 10, 'string', null], sinon.spy()]
        ];

        _.each(calls, function (call) {
          var spy  = call[1];
          var args = call[0];
          var name = args[0];

          events.addListener(name, spy);
          ctx.instance.publish.apply(ctx.instance, args);

          assert.calledWith.apply(assert, [spy].concat(args.slice(1)));
        }, ctx);
      });
    });

    describe('.subscribe()', function () {
      it('registers a handler for the event on the events object', function () {
        var handler = sinon.spy();
        ctx.instance.subscribe('dropdown:open', handler);

        events.publish('dropdown:open');

        assert.called(handler);
      });

      it('allows the context to be provided', function () {
        var handler = sinon.spy();
        var context = {};
        ctx.instance.subscribe('dropdown:open', handler, context);

        events.publish('dropdown:open');

        assert.calledOn(handler, context);
      });

      it('allows the context to be falsy', function () {
        var handler = sinon.spy();
        ctx.instance.subscribe('dropdown:open', handler, null);

        events.publish('dropdown:open');

        assert.calledOn(handler, window);
      });
    });

    describe('.unsubscribe()', function () {
      beforeEach(function () {
        ctx.instance.subscribe('dropdown:open', ctx.handler1);
        ctx.instance.subscribe('dropdown:open', ctx.handler2);
      });

      it('removes the registered listener for the event', function () {
        debugger;
        ctx.instance.unsubscribe('dropdown:open', ctx.handler1);

        events.publish('dropdown:open');

        assert.notCalled(ctx.handler1);
        assert.called(ctx.handler2);
      });

      it('removes all the registered listeners for the event', function () {
        ctx.instance.unsubscribe('dropdown:open');

        events.publish('dropdown:open');

        assert.notCalled(ctx.handler1);
        assert.notCalled(ctx.handler2);
      });

      it('does not remove other listeners for other events', function () {
        ctx.handler3 = sinon.spy();
        ctx.instance.subscribe('search:submit', ctx.handler3);

        ctx.instance.unsubscribe('dropdown:open');

        events.publish('dropdown:open');
        events.publish('search:submit');

        assert.notCalled(ctx.handler1);
        assert.notCalled(ctx.handler2);
        assert.called(ctx.handler3);
      });

      it('removes all the registered listeners', function () {
        ctx.handler3 = sinon.spy();
        ctx.instance.subscribe('search:submit', ctx.handler3);

        ctx.instance.unsubscribe();

        events.publish('dropdown:open');
        events.publish('search:submit');

        assert.notCalled(ctx.handler1);
        assert.notCalled(ctx.handler2);
        assert.notCalled(ctx.handler3);
      });

      it('does not remove other listeners from other modules', function () {
        ctx.handler3 = sinon.spy();
        events.subscribe('dropdown:open', ctx.handler3);

        ctx.instance.unsubscribe();

        events.publish('dropdown:open');

        assert.notCalled(ctx.handler1);
        assert.notCalled(ctx.handler2);
        assert.called(ctx.handler3);
      });
    });
  });

  describe('sandbox.setup()', function () {
    it('applies a sandbox instance to the instance', function () {
      var sandbox = m.sandbox();
      var prototype = m.SandboxEvents.prototype;
      assert.equal(sandbox.publish, prototype.publish);
      assert.equal(sandbox.subscribe, prototype.subscribe);
      assert.equal(sandbox.unsubscribe, prototype.unsubscribe);
    });
  });
});
