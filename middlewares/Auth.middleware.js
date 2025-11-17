import crypto from 'crypto'
import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

import AuthController from '../controllers/Auth.controller.js'

import EmailVerificationModel from '../models/EmailVerification.model.js'
import RefreshTokenModel from '../models/RefreshToken.model.js'
import TokenBlacklistModel from '../models/TokenBlacklist.model.js'
import UserModel from '../models/User.model.js'

import CookieHelper from '../helpers/Cookie.helper.js'
import CustomErrorHelper from '../helpers/Error.helper.js'
import SessionHelper from '../helpers/Session.helper.js'
import StatusCodes from '../helpers/StatusCodes.helper.js'
import UserHelper from '../helpers/User.helper.js'
import TokenHelper from '../helpers/Token.helper.js'

/**
 * @class AuthMiddleware
 * @classdesc Contains all methods related to authentication and authorization
 * 
 * @method AuthMiddleware.Authenticate Authenticates the user's access or refresh token, to ensure that the user is logged in, and has access to the route
 * @method AuthMiddleware.VerifySessionData Validates the integrity of user-related data by comparing values from helpers against the session
 * @method AuthMiddleware.ValidateTokens Validates the integrity of the access and refresh tokens
 * @method AuthMiddleware.AlreadyLoggedIn Checks whether the user is already logged in
 * @method AuthMiddleware.AlreadyLoggedOut Checks whether the user is already logged out
 * @method AuthMiddleware.RoleChecker Authenticates whether the user has the required role to access the route
 * @method AuthMiddleware.EmailVerified Checks whether the user's email is verified
 * @method AuthMiddleware.AccountInactive Checks if the user's account is inactive
 * @method AuthMiddleware.RefreshTokenRevoked Checks if the current refresh token is revoked
 * 
 * @exports AuthMiddleware
 * 
 * Middlewares should be run in following order:
 * 1. ValidateTokens
 * 2. Authenticate
 * 3. VerifySessionData
 * 4. RefreshTokenRevoked
 * 5. EmailVerified
 * 6  AccountInactive
 * 7. RoleChecker
 */
class AuthMiddleware {

  /**
   * @memberof AuthMiddleware
   * @method AuthMiddleware.Authenticate
   * @description Authenticates the user's access or refresh token, to ensure that the user is logged in, and has access to the route
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {NextFunction} 
   */
  static async Authenticate( req, res, next ) {
    try {

      // First get the user id and access token
      const userId                          = UserHelper.GetUserId( req, res, next )
      const accessToken                     = TokenHelper.GetAccessToken( req, res )

      // Check if the user has the user id and access token stored in either session or cookie
      if( !userId && !accessToken )
        throw new CustomErrorHelper( req.t('route.protected'), StatusCodes.UNAUTHORIZED )

      // Validate the access token
      const decodedAccessToken              = await TokenHelper.ValidateAndDecodeToken( req, res, accessToken, 'access' )

      // If the access token is valid, return the next middleware
      if( decodedAccessToken ) {

        // If the user id from the decoded access token does not match the user id from the session, logout the user
        if( decodedAccessToken.userId.toString() !== userId.toString() )
          return AuthController.Logout( req, res, next, true )

        // Update the access token in req object and session
        req.accessToken                     = req.session.accessToken                     = accessToken
        req.decodedAccessToken              = decodedAccessToken
        req.userId                          = req.session.userId                          = userId

        // Continue to the next middleware or route
        return next()

      // If the access token is not valid, check if the refresh token is valid
      } else {

        // Get the refresh token record, and then try to decode the refresh token
        const refreshTokenRecord            = await TokenHelper.GetRefreshTokenRecord( req, res )

        // If the refresh token is not found, logout the user
        if( !refreshTokenRecord || !UserHelper.ValidateDeviceId( req, res, refreshTokenRecord ) )
          return AuthController.Logout( req, res, next, true )

        /**
         * Generate new access token, refresh token record, and jwt id, with help of WithUserLock
         * @see UserHelper.WithUserLock
         */
        const {
          newAccessToken,
          newRefreshTokenRecord,
          jwtId,
        }                                   = await UserHelper.WithUserLock( userId, async () => {
          // Generate new JWT ID
          const jwtId                       = uuidv4()

          // Generate a new refresh token record
          const newRefreshTokenRecord       = await TokenHelper.GenerateNewRefreshToken( req, res, 'Authenticate' )

          // Generate a new access token
          const newAccessToken              = await TokenHelper.GenerateNewAccessToken( req, res, userId, jwtId )

          // Return the new access token, refresh token record, and jwt id
          return { newAccessToken, newRefreshTokenRecord, jwtId }
        })

        // Bind the variables to request and session
        req.jwtId                           = req.session.jwtId                           = jwtId
        req.userId                          = req.session.userId                          = userId
        req.accessToken                     = req.session.accessToken                     = newAccessToken
        req.refreshToken                    = req.session.refreshToken                    = newRefreshTokenRecord.token
        req.refreshTokenId                  = req.session.refreshTokenId                  = newRefreshTokenRecord._id
        req.decodedAccessToken              = await TokenHelper.ValidateAndDecodeToken( req, res, newAccessToken, 'access' )
        req.decodedRefreshToken             = await TokenHelper.ValidateAndDecodeToken( req, res, newRefreshTokenRecord.token, 'refresh' )

        // Continue to the next middleware or route
        return next()
      }
    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthMiddleware.VerifySessionData
   * @description Validates the integrity of user-related data by comparing values from helpers against the session
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {NextFunction}
   */
  static async VerifySessionData( req, res, next ) {
    try {

      // Define the user-related fields we want to verify against the session
      const fields                          = [
        { name: 'userId', getter: () => UserHelper.GetUserId( req, res, next ) },
        { name: 'deviceId', getter: () => UserHelper.GetDeviceId( req, res ) },
        { name: 'accessToken', getter: () => TokenHelper.GetAccessToken( req, res ) },
        { name: 'refreshToken', getter: () => TokenHelper.GetRefreshToken( req, res ) },
        { name: 'refreshTokenId', getter: () => TokenHelper.GetRefreshTokenId( req, res ) },
      ]

      // Loop through each field and validate it
      for( const { name, getter } of fields ) {

        // Get the value using the helper
        const value                         = getter()

        // Get the corresponding value stored in the session
        const sessionValue                  = req.session[ name ]

        // If either is missing -> force logout
        if( !value || !sessionValue )
          return AuthController.Logout( req, res, next, true )

        // Convert both values to buffers for safe comparison
        const valueBuffer                   = Buffer.from( String( value ) )
        const sessionBuffer                 = Buffer.from( String( sessionValue ) )

        // If values don't match (length or content) -> force logout
        if( valueBuffer.length !== sessionBuffer.length || !crypto.timingSafeEqual( valueBuffer, sessionBuffer ) )
          return AuthController.Logout( req, res, next, true )
      }

      // Continue to the next middleware or route
      return next()

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthMiddleware.ValidateTokens
   * @description Validates the integrity of the access and refresh tokens
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {NextFunction}
   */
  static async ValidateTokens( req, res, next ) {
    try {

      // Get the access token and refresh token
      const accessToken                     = TokenHelper.GetAccessToken( req, res )
      const refreshToken                    = TokenHelper.GetRefreshToken( req, res )

      // Validate and decode the access token and refresh token
      const decodedAccessToken              = TokenHelper.ValidateAndDecodeToken( req, res, accessToken, 'access' )
      const decodedRefreshToken             = TokenHelper.ValidateAndDecodeToken( req, res, refreshToken, 'refresh' )

      // If the access token is missing or invalid
      if( accessToken && !decodedAccessToken )
        console.log( 'Access token expired or invalid.' )

      // If the refresh token is missing or invalid
      if( refreshToken && !decodedRefreshToken )
        return AuthController.Logout( req, res, next, true )

      // Bind the variables to req and session
      if( decodedAccessToken ) {
        req.accessToken                     = req.session.accessToken                     = accessToken
        req.decodedAccessToken              = decodedAccessToken
      }

      //
      if( decodedRefreshToken ) {
        req.refreshToken                    = req.session.refreshToken                    = refreshToken
        req.decodedRefreshToken             = decodedRefreshToken
      }

      // Continue to the next middleware or route
      return next()

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthMiddleware.AlreadyLoggedIn
   * @description Authentication middleware, checking whether the user is already logged in
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {NextFunction}
   */
  static async AlreadyLoggedIn( req, res, next ) {
    try {

      // Get all stored user data
      const userId                          = UserHelper.GetUserId( req, res, next )
      const accessToken                     = TokenHelper.GetAccessToken( req, res )
      const refreshTokenId                  = TokenHelper.GetRefreshTokenId( req, res )

      // If all the data was found, the user is already logged in
      if( userId && accessToken && refreshTokenId ) 
        throw new CustomErrorHelper( req.t('user.alreadyLoggedIn') )

      // Continue to the next middleware or route
      return next()

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthMiddleware.AlreadyLoggedOut
   * @description Authentication middleware, checking whether the user is already logged out
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {NextFunction}
   */
  static async AlreadyLoggedOut( req, res, next ) {
    try {

      // Get all stored user data
      const userId                          = UserHelper.GetUserId( req, res, next )
      const accessToken                     = TokenHelper.GetAccessToken( req, res )
      const refreshTokenId                  = TokenHelper.GetRefreshTokenId( req, res )

      // If nothing was found, the user is already logged out
      if( !userId && !accessToken && !refreshTokenId )
        throw new CustomErrorHelper( req.t('user.alreadyLoggedOut') )

      // Continue to the next middleware or route
      return next()

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthMiddleware.RoleChecker
   * @description Authorization middleware, checking whether the user has the required role to access the route
   * @param {Array|String} roles 
   * @returns {NextFunction}
   */
  static RoleChecker( roles = [] ) {
    return async ( req, res, next ) => {
      try {

        // Get the user's record (in the database)
        const user                          = await UserHelper.GetUserById( req, res, UserHelper.GetUserId( req, res, next ), true )

        // If roles is a string, and the user is not the required role
        if( typeof roles === 'string' && roles !== user.role )
          throw new CustomErrorHelper( req.t('user.unauthorized'), StatusCodes.UNAUTHORIZED )

        // Else if roles is an array, and the user's role is not in the required roles
        else if( Array.isArray( roles ) && !roles.includes( user.role ) )
          throw new CustomErrorHelper( req.t('user.unauthorized'), StatusCodes.UNAUTHORIZED )

        // Continue to the next middleware or route
        return next()

      } catch ( error ) {
        return next( error )
      }
    }
  }

  /**
   * @method AuthMiddleware.IsEmailVerified
   * @description Authentication middleware, checking whether the user's email address is verified
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {NextFunction}
   */
  static async EmailVerified( req, res, next ) {
    try {

      // Get the user's email
      const email                           = await UserHelper.GetUserEmail( req, res ) || req.body?.email

      // If the email was not found
      if( !email )
        throw new CustomErrorHelper( req.t('email.notFound'), StatusCodes.NOT_FOUND )

      // Get the user's record, by their email
      const user                            = await UserHelper.GetUserByEmail( req, res, email )

      // If the user was not found
      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound'), StatusCodes.NOT_FOUND )

      // If the user's email is not verified
      else if( !user?.isEmailVerified )
        throw new CustomErrorHelper( req.t('email.notVerified'), StatusCodes.FORBIDDEN )

      // Continue to the next middleware or route
      return next()

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthMiddleware.AccountActive
   * @description Authentication middleware, checking whether the user's account is active
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {NextFunction}
   */
  static async AccountInactive( req, res, next ) {
    try {

      // Get the user's email
      const email                           = await UserHelper.GetUserEmail( req, res ) ||
        req.body?.email ||
        req.params?.email

      // If the email was not found
      if( !email )
        throw new CustomErrorHelper( req.t('email.notFound'), StatusCodes.NOT_FOUND )

      // Get the user's record, by their email
      const user                            = await UserHelper.GetUserByEmail( req, res, email )

      // If the user's account is not active
      if( !user.isActive )
        throw new CustomErrorHelper( req.t('user.notActive'), StatusCodes.FORBIDDEN )

      // Continue to the next middleware or route
      return next()

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthMiddleware.RefreshTokenRevoked
   * @description Authentication middleware, checking whether the refresh token is revoked
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {NextFunction}
   */
  static async RefreshTokenRevoked( req, res, next ) {
    try {

      // Attempt to find the refresh token in the token-blacklist
      const revokedRefreshToken             = await TokenBlacklistModel.findOne({ token: TokenHelper.GetRefreshToken( req, res ) })

      // If the refresh token is revoked
      if( revokedRefreshToken )
        return AuthController.Logout( req, res, next, 'refreshToken.revoked' )

      // Continue to the next middleware or route
      return next()
      
    } catch ( error ) {
      return next( error )
    }
  }
}

export {
  AuthMiddleware as default,
}
