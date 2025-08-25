import requestIp from 'request-ip'

import UserModel from '../models/User.model.js'

import CookieHelper from './Cookie.helper.js'
import ResponseHelper from './Response.helper.js'

/**
 * @class UserHelper
 * @classdesc Contains all methods related to the user or users
 * 
 * @method UserHelper.GetUserId Get the user's id from req, session or cookie
 * @method UserHelper.GetIpAddress Get the user's ip address
 * @method UserHelper.GetUserAgent Get the user's user agent (browser information)
 * @method UserHelper.GetDeviceId Get the user's device id
 * @method UserHelper.GetUserById Get the user's record from MongoDB by id
 * @method UserHelper.GetUserByEmail Get the user's record from MongoDB by email
 */
class UserHelper {

  /**
   * @method UserHelper.GetUserId
   * @description Get the user's id from req, session or cookie
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

  /**
   * @method UserHelper.GetUserEmail
   * @description Get the user's email
   * @param {Request} req 
   * @param {Response} res 
   * @returns 
   */
  static async GetUserEmail( req, res ) {
    try {

      // Get the user's record
      const user                            = await this.GetUserById( req, res, this.GetUserId( req, res ) )

      // Return the user's email
      return user?.email

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method UserHelper.GetUserUsername
   * @description Get the user's username
   * @param {Request} req 
   * @param {Response} res 
   * @returns 
   */
  static async GetUserUsername( req, res ) {
    try {

      // Get the user's record by id
      const user                            = await this.GetUserById( req, res, this.GetUserId( req, res ) )

      // Return the user's username
      return user?.username

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method UserHelper.GetIpAddress
   * @description Get the user's ip address
   * @param {Request} req 
   * @param {Response} res 
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
   * @method UserHelper.GetUserAgent
   * @description Get the user's user agent / browser information
   * @param {Request} req 
   * @param {Response} res 
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
   * @method UserHelper.GetDeviceId
   * @description Get the user's device id
   * @param {Request} req 
   * @param {Response} res 
   * @returns 
   */
  static GetDeviceId( req, res ) {
    try {

      // Get the fingerprint
      return req.fingerprint.hash

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method UserHelper.GetUserById
   * @description Get/retrieve the user's record from MongoDB by id
   * @param {mongoose.ObjectId} userId - The user's id
   * @param {Boolean} lean - Whether to lean (return plain javascript object) or not
   * @param {Boolean} withPassword - Whether to return the password or not
   * @returns {Mongoose.Document}
   */
  static async GetUserById( req, res, userId, lean = false, withPassword = false ) {
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
   * @method UserHelper.GetUserByEmail
   * @description Get/retrieve the user's record from MongoDB by email
   * @param {String} email - The email address to retrieve a user by
   * @param {Boolean} lean - Whether to lean (return plain javascript object) or not
   * @param {Boolean} withPassword - Whether to return the password or not
   * @returns {Mongoose.Document}
   */
  static async GetUserByEmail( req, res, email, lean = false, withPassword = false ) {
    try {

      // Attempt to find the user by email
      return !lean
        ? !withPassword
          ? await UserModel.findOne( { email: email || await this.GetUserEmail( req, res ) } )
          : await UserModel.findOne( { email: email || await this.GetUserEmail( req, res ) } ).select( '+password' )
        : !withPassword
          ? await UserModel.findOne( { email: email || await this.GetUserEmail( req, res ) } ).lean()
          : await UserModel.findOne( { email: email || await this.GetUserEmail( req, res ) } ).select( '+password' ).lean()

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method UserHelper.GetUserByUsername
   * @description Get/retrieve the user's record from MongoDB by username
   * @param {Response} res 
   * @param {String} username 
   * @param {Boolean} lean 
   * @returns {Mongoose.Document}
   */
  static async GetUserByUsername( req, res, username, lean = false ) {
    try {

      // Attempt to find the user by username
      return !lean
        ? await UserModel.findOne( { username: username || await this.GetUserUsername( req, res ) } )
        : await UserModel.findOne( { username: username || await this.GetUserUsername( req, res ) } ).lean()

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }
}

export {
  UserHelper as default,
}
