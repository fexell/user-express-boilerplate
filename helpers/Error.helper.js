

import StatusCodes from './StatusCodes.helper.js'

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
  constructor( message, status = StatusCodes.BAD_REQUEST, field = null ) {
    super( message )

    this.status                             = status
    this.field                              = field
  }
}

export {
  CustomErrorHelper as default,
}
