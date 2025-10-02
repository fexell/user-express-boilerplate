

import StatusCodes from './StatusCodes.helper.js'

/**
 * @class ResponseHelper
 * @classdesc Contains all methods related to responses
 * 
 * @method ResponseHelper.Success Success Response method
 * @method ResponseHelper.Error Error Response method
 */
class ResponseHelper {

  /**
   * @method ResponseHelper.Success
   * @description Success Response
   * @param {Response} res 
   * @param {String} message The success message
   * @param {*} data Data to pass along (e.g. user data)
   * @param {String} key The key name for the data
   * @returns {Response} Express response
   */
  static Success( res, message, status = StatusCodes.OK, data, key = 'data' ) {
    try {

      // Returns a success response, with a message, status, and/or data
      return res
        .status( status )
        .json({
          ...( message && { message } ),
          ...( data && { [ key ]: data } ),
        })

    } catch ( error ) {
      return console.error( error )
    }
  }

  /**
   * @method ResponseHelper.Error
   * @description Error Response
   * @param {Response} res 
   * @param {String} message The error message
   * @param {Number} status HTTP status code
   * @returns {Response} Express response
   */
  static Error( res, message, status = StatusCodes.BAD_REQUEST ) {
    try {

      // Returns an error response, with a message and status
      return res
        .status( status )
        .json({ message })

    } catch ( error ) {
      return console.error( error )
    }
  }

  /**
   * @method ResponseHelper.CatchError
   * @description Error Response for methods that doesn't use next( error )
   * @param {Response} res 
   * @param {Object} error 
   * @returns 
   */
  static CatchError( res, error ) {
    return this.Error( res, error.message, error.statusCode || error.status )
  }
}

export {
  ResponseHelper as default,
}
