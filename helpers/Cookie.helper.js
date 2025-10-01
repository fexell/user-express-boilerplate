import mongoose from 'mongoose'

import { NODE_ENV } from '../configs/Environment.config.js'

import CustomErrorHelper from './Error.helper.js'
import TimeHelper from './Time.helper.js'
import ResponseHelper from './Response.helper.js'

/**
 * @constant CookieNames Cookie Names
 * @type {Object}
 * @property {String} REFRESH_TOKEN Refresh Token Cookie Name
 * @property {String} ACCESS_TOKEN Access Token Cookie Name
 * @property {String} USER_ID User Id Cookie Name
 */
const CookieNames                           = {
  USER_ID                                   : 'userId',
  ACCESS_TOKEN                              : 'accessToken',
  REFRESH_TOKEN                             : 'refreshToken',
  REFRESH_TOKEN_ID                          : 'refreshTokenId',
  DEVICE_ID                                 : 'deviceId',
}

/**
 * @class CookieHelper
 * @classdesc Contains all methods related to cookies
 * 
 * @method CookieHelper.CookieOptions "Normal" cookie options
 * @method CookieHelper.SignedHttpOnlyCookieOptions "Signed http only cookie" options
 * @method CookieHelper.SetCookie Set "a normal cookie" method
 * @method CookieHelper.SetSignedHttpOnlyCookie Set "a signed http only cookie" method
 * @method CookieHelper.SetUserIdCookie Set User Id Cookie method
 * @method CookieHelper.GetUserIdCookie Get User Id Cookie method
 * @method CookieHelper.SetAccessTokenCookie Set Access Token Cookie method
 * @method CookieHelper.GetAccessTokenCookie Get Access Token Cookie method
 * @method CookieHelper.SetRefreshTokenIdCookie Set Refresh Token Id Cookie method
 * @method CookieHelper.GetRefreshTokenIdCookie Get Refresh Token Id Cookie method
 * @method CookieHelper.ClearCookie Clear Cookie method
 */
class CookieHelper {

  /**
   * @method CookieHelper.CookieOptions
   * @description The options for a "normal" cookie, accessible from the client
   * @param {Number} maxAge Max age of the cookie
   * @returns {Object} The non-HTTPOnly cookie options
   */
  static CookieOptions( maxAge ) {
    return {
      secure                              : NODE_ENV === 'production',
      sameSite                            : 'Strict',
      maxAge                              : maxAge || TimeHelper.OneDay,
      signed                              : true,
    }
  }

  /**
   * @method CookieHelper.SignedHttpOnlyCookieOptions
   * @description The options for a "signed http only cookie", inaccessible from the client
   * @param {Number} maxAge Max age of the cookie
   * @returns {Object} The HTTPOnly cookie options
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
   * @description Set a "normal" (non-HTTPOnly) cookie
   * @param {Response} res 
   * @param {String} name 
   * @param {String} value 
   * @param {Number} maxAge 
   * @returns {Object}
   */
  static SetCookie( res, name, value, maxAge ) {
    try {
      return res.cookie( name, value, this.CookieOptions( maxAge ) )
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method CookieHelper.SetSignedHttpOnlyCookie
   * @description Set a "signed http only" cookie
   * @param {Response} res 
   * @param {String} name 
   * @param {String} value 
   * @param {Number} maxAge 
   * @returns {Object}
   */
  static SetSignedHttpOnlyCookie( res, name, value, maxAge ) {
    try {
      return res.cookie( name, value, this.SignedHttpOnlyCookieOptions( maxAge ) )
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * User Id Cookies
   * 
   * @method CookieHelper.SetUserIdCookie
   * @description Set User Id Cookie, accessible from the client
   * @param {Response} res 
   * @param {Mongoose.ObjectId} userId 
   * @returns {Object}
   */
  static SetUserIdCookie( res, userId ) {
    try {
      return this.SetCookie( res, CookieNames.USER_ID, userId, TimeHelper.OneMonth )
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method CookieHelper.GetUserIdCookie
   * @description Get User Id Cookie
   * @param {Request} req 
   * @param {Response} res 
   * @returns {Mongoose.ObjectId} The user id
   */
  static GetUserIdCookie( req, res ) {
    try {
      if( req.cookies.userId && !mongoose.isValidObjectId(req.cookies.userId) )
        throw new CustomErrorHelper( req.t( 'user.id.invalid' ) )

      return req.signedCookies.userId || null
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * Access Token Cookies
   * 
   * @method CookieHelper.SetAccessTokenCookie
   * @description Set Access Token Cookie
   * @param {Response} res 
   * @param {String} accessToken 
   * @returns 
   */
  static SetAccessTokenCookie( res, accessToken ) {
    try {
      return this.SetSignedHttpOnlyCookie( res, CookieNames.ACCESS_TOKEN, accessToken, TimeHelper.FifteenMinutes )
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method CookieHelper.GetAccessTokenCookie
   * @description Get Access Token from the signed cookie
   * @param {Request} req 
   * @param {Response} res 
   * @returns {String} The Access Token
   */
  static GetAccessTokenCookie( req, res ) {
    try {
      return req.signedCookies.accessToken || null
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * Refresh Token Cookies
   * 
   * @method CookieHelper.SetRefreshTokenIdCookie
   * @description Set Refresh Token Id Cookie
   * @param {Response} res 
   * @param {Mongoose.ObjectId} refreshTokenId 
   * @returns 
   */
  static SetRefreshTokenCookie( res, refreshToken ) {
    try {
      return this.SetSignedHttpOnlyCookie( res, CookieNames.REFRESH_TOKEN, refreshToken, TimeHelper.OneMonth )
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method CookieHelper.GetRefreshTokenCookie
   * @description Get Refresh Token from the signed cookie
   * @param {Request} req 
   * @param {Response} res 
   * @returns {String} The Refresh Token
   */
  static GetRefreshTokenCookie( req, res ) {
    try {
      return req.signedCookies.refreshToken || null
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method CookieHelper.SetRefreshTokenIdCookie
   * @description Set Refresh Token Id Cookie
   * @param {Response} res 
   * @param {Mongoose.ObjectId} refreshTokenId 
   * @returns 
   */
  static SetRefreshTokenIdCookie( res, refreshTokenId ) {
    try {
      return this.SetSignedHttpOnlyCookie( res, CookieNames.REFRESH_TOKEN_ID, refreshTokenId, TimeHelper.OneMonth )
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method CookieHelper.GetRefreshTokenIdCookie
   * @description Get Refresh Token Id from the signed cookie
   * @param {Request} req 
   * @param {Response} res 
   * @returns {Mongoose.ObjectId} The Refresh Token Id
   */
  static GetRefreshTokenIdCookie( req, res ) {
    try {
      if( req.signedCookies.refreshToken && !mongoose.isValidObjectId(req.signedCookies.refreshToken) )
        throw new CustomErrorHelper( req.t( 'refreshTokenId.invalid' ) )

      return req.signedCookies.refreshTokenId || null

    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method CookieHelper.SetDeviceIdCookie
   * @description Set Device Id Cookie
   * @param {Response} res 
   * @param {String} deviceId 
   * @returns 
   */
  static SetDeviceIdCookie( res, deviceId ) {
    try {
      return this.SetSignedHttpOnlyCookie( res, CookieNames.DEVICE_ID, deviceId, TimeHelper.OneMonth )
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method CookieHelper.GetDeviceIdCookie
   * @description Get Device Id from the signed cookie
   * @param {Request} req 
   * @param {Response} res 
   * @returns {String} The Device Id
   */
  static GetDeviceIdCookie( req, res ) {
    try {
      return req.signedCookies.deviceId || null
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method CookieHelper.ClearCookie
   * @description Clear a cookie
   * @param {Response} res 
   * @param {String} name 
   * @param {Boolean} signed 
   * @returns 
   */
  static ClearCookie( res, name, signed = false ) {
    try {
      const options                         = signed ? this.SignedHttpOnlyCookieOptions() : this.CookieOptions()

      return res.clearCookie( name, options )
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method CookieHelper.ClearAllCookies
   * @description Clear all cookies
   * @param {Response} res 
   * @returns {void}
   */
  static ClearAllCookies( res ) {
    try {

      this.ClearCookie( res, CookieNames.USER_ID )
      this.ClearCookie( res, CookieNames.ACCESS_TOKEN, true )
      this.ClearCookie( res, CookieNames.REFRESH_TOKEN, true )
      this.ClearCookie( res, CookieNames.REFRESH_TOKEN_ID, true )
      this.ClearCookie( res, CookieNames.DEVICE_ID, true )
      
    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }
}

export {
  CookieHelper as default,
  CookieNames
}
