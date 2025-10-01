

import ResponseHelper from './Response.helper.js'

/**
 * @class SessionHelper
 * @classdesc Contains all helper methods related to sessions
 */
class SessionHelper {

  /**
   * @method SessionHelper.ClearAllSessions
   * @description Clears all the session variables
   * @param {Request} req 
   * @returns {void}
   */
  static ClearAllSessions( req ) {
    try {

      delete req.session.jwtId
      delete req.session.userId
      delete req.session.accessToken
      delete req.session.refreshToken
      delete req.session.refreshTokenId
      delete req.session.deviceId

    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }
}

export {
  SessionHelper as default,
}
