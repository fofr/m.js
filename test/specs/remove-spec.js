describe('jQuery.event.special.remove', function () {
  var ctx = lazy();

  // Helper to setup the context outside of a before block.
  function set(name, value) {
    beforeEach(ctx.set.bind(ctx, name, value));
  };

  if (!m.$.event || !m.$.event.special) {
    return it('The current DOM library does not support the jQuery.event.special API');
  }

  set('$element', function () {
    return jQuery('<div>');
  });

  set('$child', function () {
    return jQuery('<div>');
  });

  beforeEach(function () {
    ctx.$element.append(ctx.$child);
  });

  afterEach(function () {
    ctx.set.restore();
  });

  it('calls the event handler on remove', function () {
    var target = sinon.spy();
    ctx.$element.on('remove', target);
    ctx.$element.remove();
    assert.called(target);
  });

  it('calls the children event handlers on remove', function () {
    var target = sinon.spy();
    ctx.$child.on('remove', target);
    ctx.$element.remove();
    assert.called(target);
  });

  it('calls the event handler when element replaced', function () {
    var target = sinon.spy();
    ctx.$child.on('remove', target);
    ctx.$element.html('');
    assert.called(target);
  });
});
