import crypto from 'crypto'
import requestIp from 'request-ip'

import UserModel from '../models/User.model.js'

import CookieHelper, { CookieNames } from './Cookie.helper.js'
import ResponseHelper from './Response.helper.js'
import TimeHelper from './Time.helper.js'
import { Mongoose } from 'mongoose'

/**
 * @class UserHelper
 * @classdesc Contains all methods related to the user or users
 * 
 * @method UserHelper.GetUserId Get the user's id from req, session or cookie
 * @method UserHelper.GetIpAddress Get the user's ip address
 * @method UserHelper.GetUserAgent Get the user's user agent (browser information)
 * @method UserHelper.GenerateDeviceId Generates unique device id
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
      return ResponseHelper.CatchError( res, error )
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
      return ResponseHelper.CatchError( res, error )
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
      return ResponseHelper.CatchError( res, error )
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
      return ResponseHelper.CatchError( res, error )
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
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method UserHelper.GenerateDeviceId
   * @description Generates unique device id
   * @param {Request} req 
   * @param {Reponse} res 
   * @param {Mongoose.ObjectId} uid 
   * @returns 
   */
  static GenerateDeviceId( req, res, uid ) {
    try {
      // Get the user's id, from either parameter, or req, session, or cookie
      const userId                            = uid || this.GetUserId( req, res )

      // Get the user's ip address
      const ipAddress                         = this.GetIpAddress( req, res )

      // Get the user agent
      const userAgent                         = this.GetUserAgent( req, res )

      // Generate the device id
      const data                              = `${ userId }:${ ipAddress }:${ userAgent }`
      const hash                              = crypto.createHash( 'sha256' ).update( data ).digest( 'hex' )

      // Store the device id in a cookie
      CookieHelper.SetDeviceIdCookie( res, hash )

      // Store the device id in req, and session
      req.deviceId                            = req.session.deviceId                        = hash

      // Return the hashed device id
      return hash

    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
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

      // Get the device id
      return req.deviceId || req.session.deviceId || CookieHelper.GetDeviceIdCookie( req, res )

    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
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
      return ResponseHelper.CatchError( res, error )
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
      return ResponseHelper.CatchError( res, error )
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
      return ResponseHelper.CatchError( res, error )
    }
  }
}

export {
  UserHelper as default,
}
