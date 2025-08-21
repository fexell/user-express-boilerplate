

/**
 * @class StringHelper
 * @classdesc Contains all methods related to strings (and string manipulations)
 * 
 * @method StringHelper.Capitalize - Capitalize a string (and lowercase the rest)
 */
class StringHelper {

  /**
   * @method StringHelper.Capitalize
   * @description Capitalize a string (and lowercase the rest)
   * @param {*} string 
   * @returns {String}
   */
  static Capitalize( string ) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }
}

export {
  StringHelper as default,
}
