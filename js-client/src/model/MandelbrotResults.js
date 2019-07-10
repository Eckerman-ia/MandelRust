/**
 * Mandelbrot
 * Does Mandelbrot computation
 *
 * OpenAPI spec version: 1.0.0
 * Contact: william.wood@gsk.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * Swagger Codegen version: 2.4.6
 *
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.Mandelbrot) {
      root.Mandelbrot = {};
    }
    root.Mandelbrot.MandelbrotResults = factory(root.Mandelbrot.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The MandelbrotResults model module.
   * @module model/MandelbrotResults
   * @version 1.0.0
   */

  /**
   * Constructs a new <code>MandelbrotResults</code>.
   * @alias module:model/MandelbrotResults
   * @class
   * @extends Array
   */
  var exports = function() {
    var _this = this;
    _this = new Array();
    Object.setPrototypeOf(_this, exports);

    return _this;
  };

  /**
   * Constructs a <code>MandelbrotResults</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/MandelbrotResults} obj Optional instance to populate.
   * @return {module:model/MandelbrotResults} The populated <code>MandelbrotResults</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();
      ApiClient.constructFromObject(data, obj, 'Number');

    }
    return obj;
  }




  return exports;
}));


