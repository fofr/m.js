describe('m.library', function () {
  var library = m.library;
  var Library = m.Library;

  afterEach(function () {
    library.reset();
  });

  it('is an instance of Library', function () {
    assert.instanceOf(m.library, Library);
  });

  describe('Library()', function () {
    it('returns a new instance of Library', function () {
      assert.instanceOf(new Library(), Library);
    });
  });
});
