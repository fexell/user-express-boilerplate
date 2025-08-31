

import ResponseHelper from './Response.helper.js'

class SessionHelper {
  static ClearAllSessions( req ) {
    try {

      delete req.session.jwtId
      delete req.session.userId
      delete req.session.accessToken
      delete req.session.refreshToken
      delete req.session.refreshTokenId

    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }
}

export {
  SessionHelper as default,
}
