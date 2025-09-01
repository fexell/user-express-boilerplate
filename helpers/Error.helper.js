

/**
 * @class CustomErrorHelper
 * @classdesc Custom Error Class, extended from Error, with status property
 * @property {String} message Error message
 * @property {Number} status HTTP status code
 */
class CustomErrorHelper extends Error {

  /**
   * Constructor
   * @param {String} message 
   * @param {Number} status 
   */
  constructor( message, status = 400 ) {
    super( message )

    this.status                             = status
  }
}

export {
  CustomErrorHelper as default,
}
