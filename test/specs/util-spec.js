describe('m.util.create()', function () {
  var ctx = lazy({}, 'set', beforeEach);

  ctx.set('properties', function () {
    return {constructor: function () {}};
  });

  it('returns a constructor function', function () {
    assert.isFunction(m.util.create(ctx.properties));
  });

  it('augments the constructor prototype with properties', function () {
    function method1() {}
    function method2() {}

    ctx.properties.method1 = method1;
    ctx.properties.method2 = method2;

    var Factory = m.util.create(ctx.properties);

    assert.equal(Factory.prototype.method1, method1);
    assert.equal(Factory.prototype.method2, method2);
  });

  it('augments the constructor prototype with properties', function () {
    function method1() {}
    function method2() {}

    var Factory = m.util.create(ctx.properties, {
      method1: method1,
      method2: method2
    });

    assert.equal(Factory.method1, method1);
    assert.equal(Factory.method2, method2);
  });

  it('adds an extend function to the constrcutor', function () {
    var Factory = m.util.create(ctx.properties);
    assert.isFunction(Factory.extend);
  });

  it('throws an error if no constructor is provided', function () {
    assert.throws(function () {
      m.util.create();
    });

    assert.throws(function () {
      m.util.create({});
    });

    assert.throws(function () {
      m.util.create({constructor: 'string'});
    });
  });
});
