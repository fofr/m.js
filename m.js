define(function (require, exports) {
  var dom = require('lib/dom');
  var util = require('lib/util');
  var events = require('lib/events');
  var module = require('lib/module');
  var library = require('lib/library');

  require('lib/remove');

  // m.util.create() && m.util.inherit();
  exports.util = util;

  // m.$ && m.setDom() && m.events;
  _.extend(exports, dom, events, library);

  // m.module();
  exports.module = module.module;

  // m.module() && m.module.initialize();
  _.extend(exports.module, module);
});
