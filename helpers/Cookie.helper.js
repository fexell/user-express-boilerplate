import mongoose from 'mongoose'

import { NODE_ENV } from '../configs/Environment.config.js'

import CustomErrorHelper from './Error.helper.js'
import TimeHelper from './Time.helper.js'
import ResponseHelper from './Response.helper.js'

/**
 * @constant CookieNames - Cookie Names
 * @type {Object}
 * @property {String} REFRESH_TOKEN - Refresh Token Cookie Name
 * @property {String} ACCESS_TOKEN - Access Token Cookie Name
 * @property {String} USER_ID - User Id Cookie Name
 */
const CookieNames                           = {
  REFRESH_TOKEN_ID                          : 'refreshTokenId',
  REFRESH_TOKEN                             : 'refreshToken',
  ACCESS_TOKEN                              : 'accessToken',
  USER_ID                                   : 'userId',
}

/**
 * @class CookieHelper - Cookie Helper Class
 * @classdesc Contains all methods related to cookies
 * 
 * @method CookieHelper.CookieOptions - "Normal cookie" options
 * @method CookieHelper.SignedHttpOnlyCookieOptions - "Signed http only cookie" options
 * @method CookieHelper.SetCookie - Set "a normal cookie" method
 * @method CookieHelper.SetSignedHttpOnlyCookie - Set "a signed http only cookie" method
 * @method CookieHelper.SetUserIdCookie - Set User Id Cookie method
 * @method CookieHelper.GetUserIdCookie - Get User Id Cookie method
 * @method CookieHelper.SetAccessTokenCookie - Set Access Token Cookie method
 * @method CookieHelper.GetAccessTokenCookie - Get Access Token Cookie method
 * @method CookieHelper.SetRefreshTokenIdCookie - Set Refresh Token Id Cookie method
 * @method CookieHelper.GetRefreshTokenIdCookie - Get Refresh Token Id Cookie method
 * @method CookieHelper.ClearCookie - Clear Cookie method
 */
class CookieHelper {

  /**
   * @method CookieHelper.CookieOptions
   * @description The options for a "normal" cookie, accessible from the client
   * @param {Number} maxAge 
   * @returns {Object}
   */
  static CookieOptions( maxAge ) {
    return {
      secure                              : NODE_ENV === 'production',
      sameSite                            : 'Strict',
      maxAge                              : maxAge || TimeHelper.OneDay,
    }
  }

  /**
   * @method CookieHelper.SignedHttpOnlyCookieOptions
   * @description The options for a "signed http only cookie", inaccessible from the client
   * @param {*} maxAge 
   * @returns {Object}
   */
  static SignedHttpOnlyCookieOptions( maxAge ) {
    return {
      secure                              : NODE_ENV === 'production',
      sameSite                            : 'Strict',
      httpOnly                            : true,
      maxAge                              : maxAge || TimeHelper.OneDay,
      signed                              : true,
      path                                : '/',
    }
  }

  /**
   * Set Cookies
   * 
   * @method CookieHelper.SetCookie
   * @description Set a "normal" cookie
   * @param {*} res 
   * @param {*} name 
   * @param {*} value 
   * @param {*} maxAge 
   * @returns {Object}
   */
  static SetCookie( res, name, value, maxAge ) {
    try {
      return res.cookie( name, value, this.CookieOptions( maxAge ) )
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method CookieHelper.SetSignedHttpOnlyCookie
   * @description Set a "signed http only" cookie
   * @param {*} res 
   * @param {*} name 
   * @param {*} value 
   * @param {*} maxAge 
   * @returns {Object}
   */
  static SetSignedHttpOnlyCookie( res, name, value, maxAge ) {
    try {
      return res.cookie( name, value, this.SignedHttpOnlyCookieOptions( maxAge ) )
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * User Id Cookies
   * 
   * @method CookieHelper.SetUserIdCookie
   * @description Set User Id Cookie, accessible from the client
   * @param {*} res 
   * @param {*} userId 
   * @returns {Object}
   */
  static SetUserIdCookie( res, userId ) {
    try {
      return this.SetCookie( res, CookieNames.USER_ID, userId, TimeHelper.OneMonth )
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method CookieHelper.GetUserIdCookie
   * @description Get User Id Cookie
   * @param {*} req 
   * @param {*} res 
   * @returns 
   */
  static GetUserIdCookie( req, res ) {
    try {
      if( req.cookies.userId && !mongoose.isValidObjectId(req.cookies.userId) )
        throw new CustomErrorHelper( req.t( 'user.id.invalid' ) )

      return req.cookies.userId || null
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * Access Token Cookies
   * 
   * @method CookieHelper.SetAccessTokenCookie
   * @description Set Access Token Cookie
   * @param {*} res 
   * @param {*} accessToken 
   * @returns 
   */
  static SetAccessTokenCookie( res, accessToken ) {
    try {
      return this.SetSignedHttpOnlyCookie( res, CookieNames.ACCESS_TOKEN, accessToken, TimeHelper.ThreeMinutes )
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method CookieHelper.GetAccessTokenCookie
   * @description Get Access Token from the signed cookie
   * @param {*} req 
   * @param {*} res 
   * @returns 
   */
  static GetAccessTokenCookie( req, res ) {
    try {
      return req.signedCookies.accessToken || null
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * Refresh Token Cookies
   * 
   * @method CookieHelper.SetRefreshTokenIdCookie
   * @description Set Refresh Token Id Cookie
   * @param {*} res 
   * @param {*} refreshTokenId 
   * @returns 
   */
  static SetRefreshTokenCookie( res, refreshToken ) {
    try {
      return this.SetSignedHttpOnlyCookie( res, CookieNames.REFRESH_TOKEN, refreshToken, TimeHelper.OneMonth )
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  static GetRefreshTokenCookie( req, res ) {
    try {
      return req.signedCookies.refreshToken || null
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  static SetRefreshTokenIdCookie( res, refreshTokenId ) {
    try {
      return this.SetSignedHttpOnlyCookie( res, CookieNames.REFRESH_TOKEN_ID, refreshTokenId, TimeHelper.OneMonth )
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method CookieHelper.GetRefreshTokenIdCookie
   * @description Get Refresh Token Id from the signed cookie
   * @param {*} req 
   * @param {*} res 
   * @returns 
   */
  static GetRefreshTokenIdCookie( req, res ) {
    try {
      if( req.signedCookies.refreshToken && !mongoose.isValidObjectId(req.signedCookies.refreshToken) )
        throw new CustomErrorHelper( req.t( 'refreshTokenId.invalid' ) )

      return req.signedCookies.refreshTokenId || null
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method CookieHelper.ClearCookie
   * @description Clear a cookie
   * @param {*} res 
   * @param {*} name 
   * @param {*} signed 
   * @returns 
   */
  static ClearCookie( res, name, signed = false ) {
    try {
      const options                         = signed ? this.SignedHttpOnlyCookieOptions() : this.CookieOptions()

      return res.clearCookie( name, options )
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }
}

export {
  CookieHelper as default,
  CookieNames
}
