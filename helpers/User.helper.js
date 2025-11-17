import crypto from 'crypto'
import requestIp from 'request-ip'
import { Mongoose } from 'mongoose'

import EmailVerificationModel from '../models/EmailVerification.model.js'
import UserModel from '../models/User.model.js'

import { DEVICE_ID_SECRET } from '../configs/Environment.config.js'

import CookieHelper, { CookieNames } from './Cookie.helper.js'
import RegexHelper from './Regex.helper.js'
import ResponseHelper from './Response.helper.js'
import TimeHelper from './Time.helper.js'
import AuthController from '../controllers/Auth.controller.js'

// Map to hold refresh token locks
const refreshLocks                          = new Map()

/**
 * @class UserHelper
 * @classdesc Contains all methods related to the user or users
 * 
 * @method UserHelper.GetUserId Get the user's id from req, session or cookie
 * @method UserHelper.GetIpAddress Get the user's ip address
 * @method UserHelper.GetUserAgent Get the user's user agent (browser information)
 * @method UserHelper.GenerateDeviceId Generates unique device id
 * @method UserHelper.GetDeviceId Get the user's device id
 * @method UserHelper.ValidateDeviceId Validates whether the provided device ID matches the expected one
 * @method UserHelper.WithUserLock Acquires a lock on the given user ID and executes the given function, handling race conditions
 * @method UserHelper.GetUserById Get the user's record from MongoDB by id
 * @method UserHelper.GetUserByEmail Get the user's record from MongoDB by email
 */
class UserHelper {

  /**
   * @method UserHelper.GetUserId
   * @description Get the user's id from req, session or cookie
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {Mongoose.ObjectId}
   */
  static GetUserId( req, res, next ) {
    try {

      // Get the user id from either req, session or cookie
      return req.userId || req.session.userId || CookieHelper.GetUserIdCookie( req, res, next )

    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method UserHelper.GetUserEmail
   * @description Get the user's email
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {String} The user's email
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
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {String} The user's username
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
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {String} The user's ip address
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
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {String} The user's user agent
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
   * @param {Request} req Express request object
   * @param {Reponse} res Express response object
   * @param {Mongoose.ObjectId} uid 
   * @returns {String} The hashed device id
   */
  static GenerateDeviceId( req, res, uid, forceNew = false ) {
    try {
      let salt

      // Get the user's id, from either parameter, or req, session, or cookie
      const userId                          = uid || this.GetUserId( req, res )

      // Get the device id
      let deviceId                          = !forceNew ? this.GetDeviceId( req, res ) : null

      // If no device id could be found
      if( !deviceId ) {
        salt                                = crypto.randomBytes( 16 ).toString( 'hex' )

        // What the device id *should* be
        const data                          = `${ userId }:${ salt }`

        // Set the device id to the hash
        deviceId                            = crypto.createHmac( 'sha256', DEVICE_ID_SECRET ).update( data ).digest( 'hex' )

        // Store the device id in a cookie
        CookieHelper.SetDeviceIdCookie( res, deviceId )
      }

      // Store in request and session for easy access
      req.deviceId                            = req.session.deviceId                        = deviceId

      // Return the hashed device id
      return { deviceId, salt }

    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  /**
   * @method UserHelper.GetDeviceId
   * @description Get the user's device id
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @returns {String} The user's device id, from req, session or cookie
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
   * @method UserHelper.ValidateDeviceId
   * @description Validates whether the provided device ID matches the expected one
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   * @param {Object} refreshTokenRecord The database record for the refresh token
   * @returns {Boolean} True if the device ID matches the expected value, false otherwise
   */
  static ValidateDeviceId( req, res, refreshTokenRecord ) {
    try {

      // Retrieve the device ID that was stored in the client
      const deviceId                        = this.GetDeviceId( req, res )

      // If no device id is provided OR the refresh token record is missing its salt,
      // we cannot validate the device -> reject immediately
      if( !deviceId || !refreshTokenRecord?.salt )
        return false

      // Recreate what the device ID *should* be
      const expectedDeviceId                = crypto
        .createHmac( 'sha256', DEVICE_ID_SECRET )
        .update( `${ refreshTokenRecord.userId }:${ refreshTokenRecord.salt }` )
        .digest( 'hex' )

      // Convert both the provided deviceId and the expected one into Buffers
      const deviceIdBuffer                  = Buffer.from( deviceId )
      const expectedBuffer                  = Buffer.from( expectedDeviceId )

      // If the buffer lengths differ, they cannot be equal
      if( deviceIdBuffer.length !== expectedBuffer.length )
        return false

      // Compare the two buffers in constant time to protect against timing attacks
      return crypto.timingSafeEqual( deviceIdBuffer, expectedBuffer )

    } catch( error ) {

      // If anything goes wrong -> fail safely
      return false
    }
  }

  /**
   * @method UserHelper.WithUserLock
   * @description Acquires a lock on the given user ID and executes the given function, handling race conditions
   * @param {mongoose.ObjectId} userId The user's id
   * @param {Function} fn The function to execute while holding the lock
   * @returns {Promise} A promise that resolves after the lock has been released
   */
  static async WithUserLock( userId, fn ) {

    // If the user is already locked, return the existing promise
    if( refreshLocks.has( userId ) ) {
      return refreshLocks.get( userId )
    }

    // Otherwise, acquire the lock
    const refreshPromise                    = fn().finally( () => refreshLocks.delete( userId ) )

    // Add the promise to the map
    refreshLocks.set( userId, refreshPromise )

    // Return the promise
    return refreshPromise
  }

  /**
   * @method UserHelper.GetUserById
   * @description Get/retrieve the user's record from MongoDB by id
   * @param {mongoose.ObjectId} userId The user's id
   * @param {Boolean} lean Whether to lean (return plain javascript object) or not
   * @param {Boolean} withPassword Whether to return the password or not
   * @returns {Mongoose.Document} The user's record, by id
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
   * @returns {Mongoose.Document} The user's record, by email
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
   * @param {Response} res Express response object
   * @param {String} username The targeted username
   * @param {Boolean} lean Whether the database findOne should be lean
   * @returns {Mongoose.Document} The user's record, by username
   */
  static async GetUserByUsername( req, res, username, lean = false ) {
    try {

      // If no username is provided, get the user's username
      const input                           = username || await this.GetUserUsername( req, res )

      // Case-insensitive exact match
      const usernameRegex                   = new RegExp( `^(${ RegexHelper.Escape( input ) })$`, 'i' )

      // Attempt to find the user by username
      const query                           = { username: { $regex: usernameRegex } }

      return !lean
        ? await UserModel.findOne( query )
        : await UserModel.findOne( query ).lean()

    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }

  static async GetEmailVerificationTokenRecord( req, res, lean = false ) {
    try {

      // Attempt to find the email verification token record
      return !lean
        ? await EmailVerificationModel.findOne({
          $or: [
            { userId: this.GetUserId( req, res ) },
            { token: req.params.token || req.body?.token },
          ],
        })
        : await EmailVerificationModel.findOne({
          $or: [
            { userId: this.GetUserId( req, res ) },
            { token: req.params.token || req.body?.token },
          ],
        }).lean()

    } catch ( error ) {
      return ResponseHelper.CatchError( res, error )
    }
  }
}

export {
  UserHelper as default,
}
