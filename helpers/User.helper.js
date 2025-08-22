import requestIp from 'request-ip'

import UserModel from '../models/User.model.js'

import CookieHelper from './Cookie.helper.js'
import ResponseHelper from './Response.helper.js'

/**
 * @class UserHelper
 * @classdesc Contains all methods related to the user or users
 * 
 * @method UserHelper.GetUserId - Get the user's id from req, session or cookie
 * @method UserHelper.GetIpAddress - Get the user's ip address
 * @method UserHelper.GetUserAgent - Get the user's user agent (browser information)
 * @method UserHelper.GetUserById - Get the user's record from MongoDB by id
 * @method UserHelper.GetUserByEmail - Get the user's record from MongoDB by email
 */
class UserHelper {

  /**
   * @method UserHelper.GetUserId - Get the user's id from req, session or cookie
   * @param {*} req 
   * @param {*} res 
   * @returns {Mongoose.ObjectId}
   */
  static GetUserId( req, res ) {
    try {
      return req.userId || req.session.userId || CookieHelper.GetUserIdCookie( req, res )
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  static GetUserEmail( req, res ) {
    try {
      return req.user?.email || req.session.user?.email || req.params?.email || req.body?.email || req.query?.email
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method UserHelper.GetIpAddress - Get the user's ip address
   * @param {*} req 
   * @param {*} res 
   * @returns {String}
   */
  static GetIpAddress( req, res ) {
    try {
      return requestIp.getClientIp( req )
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method UserHelper.GetUserAgent - Get the user's user agent (browser information)
   * @param {*} req 
   * @param {*} res 
   * @returns {String}
   */
  static GetUserAgent( req, res ) {
    try {
      return req.useragent.source || req.headers[ 'User-Agent' ]

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method UserHelper.GetUserById - Get/retrieve the user's record from MongoDB by id
   * @param {*} userId 
   * @param {*} lean - Whether to lean (return plain javascript object) or not
   * @param {*} withPassword - Whether to return the password or not
   * @returns {Mongoose.Document}
   */
  static async GetUserById( userId, lean = false, withPassword = false ) {
    try {
      return !lean
        ? !withPassword
          ? await UserModel.findById( userId )
          : await UserModel.findById( userId ).select( '+password' )
        : !withPassword
          ? await UserModel.findById( userId ).lean()
          : await UserModel.findById( userId ).select( '+password' ).lean()

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method UserHelper.GetUserByEmail - Get/retrieve the user's record from MongoDB by email
   * @param {*} email - The email address to retrieve a user by
   * @param {*} lean - Whether to lean (return plain javascript object) or not
   * @param {*} withPassword - Whether to return the password or not
   * @returns {Mongoose.Document}
   */
  static async GetUserByEmail( res, email, lean = false, withPassword = false ) {
    try {
      return !lean
        ? !withPassword
          ? await UserModel.findOne( { email } )
          : await UserModel.findOne( { email } ).select( '+password' )
        : !withPassword
          ? await UserModel.findOne( { email } ).lean()
          : await UserModel.findOne( { email } ).select( '+password' ).lean()

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }
}

export {
  UserHelper as default,
}
