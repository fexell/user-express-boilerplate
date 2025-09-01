

/**
 * @class StringHelper
 * @classdesc Contains all methods related to strings (and string manipulations)
 * 
 * @method StringHelper.Capitalize Capitalize a string (and lowercase the rest)
 */
class StringHelper {

  /**
   * @method StringHelper.Capitalize
   * @description Capitalize a string (and lowercase the rest)
   * @param {String} string 
   * @returns {String} The capitalized string
   */
  static Capitalize( string ) {

    // Turn the first letter of the string to uppercase, slice/remove the first letter and lowercase the rest
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }
}

export {
  StringHelper as default,
}
