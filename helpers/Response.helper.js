

/**
 * @class ResponseHelper
 * @classdesc Contains all methods related to responses
 * 
 * @method ResponseHelper.Success - Success Response method
 * @method ResponseHelper.Error - Error Response method
 */
class ResponseHelper {

  /**
   * @method ResponseHelper.Success
   * @description Success Response
   * @param {*} res 
   * @param {*} message - The success message
   * @param {*} data - Data to pass along (e.g. user data)
   * @param {*} key - The key name for the data
   * @returns 
   */
  static Success( res, message, data, key = 'data' ) {
    try {
      return res
        .status( 200 )
        .json({
          ...(message && { message }),
          ...(data && { [ key ]: data }),
        })

    } catch ( error ) {
      return console.error( error )
    }
  }

  /**
   * @method ResponseHelper.Error
   * @description Error Response
   * @param {*} res 
   * @param {*} message - The error message
   * @param {*} status - HTTP status code
   * @returns 
   */
  static Error( res, message, status = 400 ) {
    try {
      return res
        .status(status)
        .json({ message })

    } catch ( error ) {
      return console.error( error )
    }
  }
}

export {
  ResponseHelper as default,
}
