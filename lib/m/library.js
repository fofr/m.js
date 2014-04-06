/* A registry object that can be used to create a unique object for each module
 * on the page. This provides the basic api for the page which every module
 * has access to. Not all modules will require every library object, and this
 * makes it easy to provide fake objects to modules within tests.
 *
 * Adding a new object to the library is as simple as providing it with a name
 * and function. This function should return an object unique to that module.
 *
 *   m.libraries.add('template', function () {
 *     return new Template();
 *   };
 */
(function (m, _) {
  var LibraryRegistry = m.create({

    /* Holds all registered library functions */
    registry: null,

    /* Returns a new LibraryRegistry instance.
     */
    constructor: function LibraryRegistry() {
      this.reset();
    },

    /* Adds a new item to the library. This requires a name and a factory
     * function that returns a new instance or function.
     *
     * name - The name of the item to be registered.
     * factory - A function that returns a new instance of said item.
     *
     * Returns itself.
     */
    add: function (name, factory) {
      if (this.registry[name]) {
        throw new Error('LibraryRegistry already contains an item with name: ' + name);
      }
      if (typeof factory !== 'function') {
        throw new Error('factory argument must be a function');
      }
      this.registry[name] = factory;
      return this;
    },

    /* Resets the state of the library removing all registered items. */
    reset: function () {
      this.registry = {};
    },

    /* Checks to see if the LibraryRegistry contains the specified module. This is
     * useful to conditionally checking for a module before loading and
     * raising an Error.
     *
     * Returns true if the module exists.
     */
    has: function (name) {
      return this.registry.hasOwnProperty(name);
    },

    /* Fetches an item from the library.
     *
     * name - The name of the item to fetch.
     *
     * Returns the item if found.
     * Raises Error if the item is not found.
     */
    get: function (name) {
      if (!this.has(name)) {
        throw new Error(name + ' was not found in the registry');
      }
      return this.registry[name];
    },

    require: function (dependencies) {
      return new LibraryModuleDependencies(this, dependencies);
    }
  });

  /* A factory function that creates new require() function for the registry
   * object provided.
   */
  var LibraryModuleDependencies = m.create({
    instances: null,
    dependencies: null,
    library: null,

    constructor: function LibraryModuleDependencies(library, dependencies) {
      this.instances = {};
      this.dependencies = dependencies;
      this.library = library;
    },

    build: function () {
      _.each(this.dependencies, function (name) {
        this.instances[name] = this.library.get(name)();
      }, this);
      return this.instances;
    },

    /* Will call teardown() on each item in the registry if present, this
     * allows them to clean up any state that may be left hanging around.
     */
    teardown: function () {
      _.each(this.instances, function (instance) {
        if (typeof instance.teardown === 'function') {
          instance.teardown();
        }
      });
    }
  });

  /* Export the LibraryRegistry constructor and a new instance */
  m.libraries = new LibraryRegistry();
  m.LibraryRegistry = LibraryRegistry;
  m.LibraryModuleDependencies = LibraryModuleDependencies;

})(this.m = this.m || {}, this._);
