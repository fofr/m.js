define(function (require, exports, module) {
  var soak = require('vendor/soak');
  var util = exports;

  util.inherit = soak.inherit;
  util.create = soak.create;
  util.mixin = soak.mixin;

  /* Creates a new constructor function with the provided prototype and class
   * methods. New sub objects can be created using the .extend() method. The
   * only requirement is that the first object passed has a constructor
   * property.
   *
   * instance   - Instance methods to be applied to the constructor prototype.
   * properties - Properties to be applied directly to the constructor.
   *
   * Examples
   *
   *   var Adder = util.create({
   *     // Naming the constructor improves debugger output.
   *     constructor: function Adder(start) {
   *       this.count = start;
   *     },
   *
   *     // An instance method.
   *     add: function (number) { return this.count + number; }
   *   }, {
   *     // A method on Adder.
   *     plusTwo: function () {}
   *   });
   *
   * Returns a new constructor function with prototype and properties.
   */
  exports.create = function create(instance, properties) {
    if (!instance || !instance.hasOwnProperty('constructor') || typeof instance.constructor !== 'function') {
      throw new Error('The instance methods argument must have a constructor property');
    }
    return util.inherit(util.inherit.constructor(Object), instance, properties);
  };
});
