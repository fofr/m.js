/* An application level event hub that can be used by libraries and modules
 * to publish events between each other. Both the hub and ModuleMediator objects
 * share the same API, although the module event listeners are namespaced
 * to allow automatic cleanup when the module is destroyed.
 *
 * Examples
 *
 *   // Global usage:
 *   events.subscribe('app:setup', onSetup);
 *   events.publish('app:setup');
 *
 *   // In a module, the third argument lets you define a context.
 *   var hub = this.require('hub');
 *   hub.subscribe('dropdown:open', this.onOpen, this);
 *   hub.publish('dropdown:open');
 */
define(function (require, exports) {
  // Create a happy new global event object with a familiar api.
  var util = require('lib/util');
  var Broadcast = require('vendor/broadcast');
  var libraries = require('lib/library').libraries;

  exports.Events = Broadcast;
  var hub = new Broadcast();

  /* Allow events to be paused, this will collect any events published while
   * paused and republished them when .resume() is called. This is useful
   * for initialization where you may want to wait for everything to be
   * ready before events are published.
   *
   * Returns nothing.
   */
  hub.pause = function () {
    this._deferred = this._deferred || [];
  };

  /* Resumes normal publishing of events, will flush the backlog of events
   * collected while paused.
   *
   * Returns nothing.
   */
  hub.resume = function () {
    var items = this._deferred || [];
    this._deferred = null;

    for (var index = 0, length = items.length; index < length; index += 1) {
      this.publish.apply(this, items[index]);
    }
  };

  /* Wrap the normal emit function in order to collect published events while
   * paused.
   *
   * Returns itself.
   */
  hub.publish = function (name/* , arguments... */) {
    // Allow internal module events to be whitelisted. This allows the
    // application to setup. For example listening for module:create.
    if (this._deferred && name.indexOf('module:') !== 0) {
      this._deferred.push(_.toArray(arguments));
      return this;
    }
    return this.emit.apply(this, arguments);
  };
  hub.subscribe = hub.addListener;
  hub.unsubscribe = hub.removeListener;

  exports.events = hub;

  /* Another events object that publishes events to a global hub. The method
   * names are therefore different to distinguish them from their local
   * counterparts but the signatures are the same.
   */
  exports.ModuleMediator = util.create({

    /* Creates a new instance of a ModuleMediator object.
     *
     * hub - A Broadcast instance.
     *
     * Returns an instance of ModuleMediator.
     */
    constructor: function ModuleMediator(hub) {
      this._hub = hub;
      this._namespace = _.uniqueId('.hub');
    },

    /* Publish a global event throughout the application. This method is
     * exactly the same as the Backbone.Events#trigger() method.
     *
     * name  - An event name.
     * *args - All following arguments are passed to handlers.
     *
     * Examples
     *
     *   this.publish('dropdown:open');
     *
     * Returns itself.
     */
    publish: function () {
      this._hub.publish.apply(this._hub, arguments);
      return this;
    },

    /* Subscribes to a global event. The method signature is the sames as the
     * Backbone.Events#on() method.
     *
     * event   - An event name.
     * handler - An event handler.
     * context - A context for the handler (default: this).
     *
     * Examples
     *
     *   this.subscribe('popover:open', this.close);
     *
     * Returns itself.
     */
    subscribe: function (name/* , fn, context */) {
      var args = _.toArray(arguments);

      if (!name) {
        throw new Error('hub.subscribe() must be called with a name argument');
      }

      args[0] = args[0] + this._namespace;
      this._hub.subscribe.apply(this._hub, args);
      return this;
    },

    /* Unsubscribes from a specific event. Has the same signature as
     * Backbone.Events#off(). Calling this with no arguments removes all
     * handlers bound by this object for all events.
     *
     * name - The event name to subscribe from.
     * handler - A specific handler to unbind.
     *
     * Examples
     *
     *   this.unsubscribe('dropdown:close');
     *
     * Returns itself.
     */
    unsubscribe: function (/* name, fn */) {
      var args = _.toArray(arguments);
      args[0] = (args[0] || '') + this._namespace;
      this._hub.unsubscribe.apply(this._hub, args);
      return this;
    },

    /* Teardown function called by the ModuleRegistry when the module is removed
     * from the document.
     */
    teardown: function () {
      return this.unsubscribe();
    }
  });

  libraries.add('hub', function () {
    return new exports.ModuleMediator(hub);
  });

});
