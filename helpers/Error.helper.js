

/**
 * @class CustomErrorHelper
 * @classdesc Custom Error Class, extended from Error, with status property
 * @property {String} message Error message
 * @property {Number} status HTTP status code
 */
class CustomErrorHelper extends Error {
  constructor( message, status = 400 ) {
    super( message )

    this.status                             = status
  }
}

export {
  CustomErrorHelper as default,
}
