/* Dom manipulation library such as jQuery or Zepto. It will take what ever
 * is assigned to $ in the global namespace and alias it to m.$. This allows
 * this library to be swapped out with alternatives before loading. Although
 * the library needs to adhear to the jQuery API as Zepto does.
 */
define(function (require, exports, module) {
  /* global $:true */
  exports.$ = $;
  exports.setDom = function setDom(library) {
    exports.$ = library;
  };
});
