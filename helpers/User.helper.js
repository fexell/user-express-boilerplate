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

      // Get the user id from either req, session or cookie
      return req.userId || req.session.userId || CookieHelper.GetUserIdCookie( req, res )

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  static GetUserEmail( req, res ) {
    try {

      // Get the user email from either req.user, req.session.user, parameters, form body, or query
      return req.user?.email || req.session.user?.email || req.params?.email || req.body?.email || req.query?.email

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  static GetUserUsername( req, res ) {
    try {

      // Get the user username from either req.user, req.session.user, parameters, form body, or query
      return req.user?.username || req.session.user?.username || req.params?.username || req.body?.username || req.query?.username

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

      // Get the client's ip address
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

      // Get the user agent
      return req.useragent.source || req.headers[ 'User-Agent' ]

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method UserHelper.GetUserById - Get/retrieve the user's record from MongoDB by id
   * @param {mongoose.ObjectId} userId - The user's id
   * @param {Boolean} lean - Whether to lean (return plain javascript object) or not
   * @param {Boolean} withPassword - Whether to return the password or not
   * @returns {Mongoose.Document}
   */
  static async GetUserById( res, userId, lean = false, withPassword = false ) {
    try {

      // Attempt to find the user by id
      return !lean
        ? !withPassword
          ? await UserModel.findById( userId || this.GetUserId( req, res ) )
          : await UserModel.findById( userId || this.GetUserId( req, res ) ).select( '+password' )
        : !withPassword
          ? await UserModel.findById( userId || this.GetUserId( req, res ) ).lean()
          : await UserModel.findById( userId || this.GetUserId( req, res ) ).select( '+password' ).lean()

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

      // Attempt to find the user by email
      return !lean
        ? !withPassword
          ? await UserModel.findOne( { email: email || this.GetUserEmail( req, res ) } )
          : await UserModel.findOne( { email: email || this.GetUserEmail( req, res ) } ).select( '+password' )
        : !withPassword
          ? await UserModel.findOne( { email: email || this.GetUserEmail( req, res ) } ).lean()
          : await UserModel.findOne( { email: email || this.GetUserEmail( req, res ) } ).select( '+password' ).lean()

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * 
   * @param {Response} res 
   * @param {String} username 
   * @param {Boolean} lean 
   * @returns {Mongoose.Document}
   */
  static async GetUserByUsername( res, username, lean = false ) {
    try {

      // Attempt to find the user by username
      return !lean
        ? await UserModel.findOne( { username: username || this.GetUserUsername( req, res ) } )
        : await UserModel.findOne( { username: username || this.GetUserUsername( req, res ) } ).lean()

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }
}

export {
  UserHelper as default,
}
