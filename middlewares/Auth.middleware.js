import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

import AuthController from '../controllers/Auth.controller.js'

import RefreshTokenModel from '../models/RefreshToken.model.js'

import CookieHelper from '../helpers/Cookie.helper.js'
import CustomErrorHelper from '../helpers/Error.helper.js'
import UserHelper from '../helpers/User.helper.js'
import TokenHelper from '../helpers/Token.helper.js'

/**
 * @class AuthMiddleware
 * @classdesc Contains all methods related to authentication and authorization
 * 
 * @method AuthMiddleware.Authenticate Authentication middleware, checking whether the user has access to the route
 * @method AuthMiddleware.AlreadyLoggedIn Authentication middleware, checking whether the user is already logged in
 * @method AuthMiddleware.AlreadyLoggedOut Authentication middleware, checking whether the user is already logged out
 * @method AuthMiddleware.RoleChecker Authorization middleware, checking whether the user has the required role to access the route
 * @method AuthMiddleware.EmailVerified Authentication middleware, checking whether the user's email address is verified
 * @method AuthMiddleware.AccountInactive Authentication middleware, checking whether the user's account is active
 * @method AuthMiddleware.RefreshTokenRevoked Authentication middleware, checking whether the refresh token is revoked
 * 
 * @exports AuthMiddleware
 * 
 * Middlewares should be run in following order:
 * 1. Authenticate
 * 2. RefreshTokenRevoked
 * 3. EmailVerified
 * 4. AccountInactive
 * 5. RoleChecker
 */
class AuthMiddleware {

  /**
   * @method AuthMiddleware.Authenticate
   * @description Authentication middleware, checking whether the user has access to the route
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {NextFunction} 
   */
  static async Authenticate( req, res, next ) {
    try {

      // First get the user id and access token
      const userId                          = UserHelper.GetUserId( req, res )
      const accessToken                     = TokenHelper.GetAccessToken( req, res )

      // Check if the user has the user id and access token stored in either session or cookie
      if( !userId && !accessToken )
        throw new CustomErrorHelper( req.t('route.protected') )

      // Validate the access token
      const decodedAccessToken              = TokenHelper.ValidateAndDecodeToken( req, accessToken, 'access' )

      // If the access token is valid, return the next middleware
      if( decodedAccessToken ) {

        // If the user id from the decoded access token does not match the user id from the session, logout the user
        if( decodedAccessToken.userId.toString() !== userId.toString() )
          return AuthController.Logout( req, res, next, true )

        // Continue to the next middleware or route
        return next()

      // If the access token is not valid, check if the refresh token is valid
      } else {

        // Get the refresh token record, and then try to decode the refresh token
        const refreshTokenRecord            = await TokenHelper.GetRefreshTokenRecord( req, res, next )

        // If the refresh token is not found, logout the user
        if( !refreshTokenRecord )
          return AuthController.Logout( req, res, next, true )

        const decodedRefreshToken           = TokenHelper.ValidateAndDecodeToken( req, refreshTokenRecord.token, 'refresh' )

        // If the refresh token is not valid, logout the user
        if( !decodedRefreshToken )
          return AuthController.Logout( req, res, next, true )

        // If the user id from the decoded refresh token does not match the user id from the session, logout the user
        if( decodedRefreshToken.userId.toString() !== userId.toString() )
          return AuthController.Logout( req, res, next, true )

        // Revoke the current refresh token
        refreshTokenRecord.isRevoked        = true

        // Save the old refresh token
        await refreshTokenRecord.save()

        // Sign a new refresh token
        const newRefreshToken               = TokenHelper.SignRefreshToken( userId )

        // Generate a new refresh token record
        const newRefreshTokenRecord         = await TokenHelper.GenerateNewRefreshToken(
          req,
          res,
          userId,
          newRefreshToken,
        )

        // Assign a new JWT ID
        const jwtId                         = uuidv4()

        // Generate a new access token
        const newAccessToken                = TokenHelper.GenerateNewAccessToken( req, res, userId, jwtId )

        // Save the JWT ID in both req and req.session
        req.jwtId                           = req.session.jwtId                          = jwtId
        req.userId                          = req.session.userId                         = userId 
        req.accessToken                     = req.session.accessToken                    = newAccessToken
        req.refreshTokenId                  = req.session.refreshTokenId                 = newRefreshTokenRecord._id

        // Continue to the next middleware or route
        return next()
      }
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
   * @returns 
   */
  static async AlreadyLoggedIn( req, res, next ) {
    try {

      // Get all stored user data
      const userId                          = UserHelper.GetUserId( req, res )
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
   * @returns 
   */
  static async AlreadyLoggedOut( req, res, next ) {
    try {

      // Get all stored user data
      const userId                          = UserHelper.GetUserId( req, res )
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
   * @returns 
   */
  static RoleChecker( roles = [] ) {
    return async ( req, res, next ) => {
      try {

        // Get the user's record (in the database)
        const user                          = await UserHelper.GetUserById( res, UserHelper.GetUserId( req, res ), true )

        // If roles is a string, and the user is not the required role
        if( typeof roles === 'string' && roles !== user.role )
          throw new CustomErrorHelper( req.t('user.unauthorized') )

        // Else if roles is an array, and the user's role is not in the required roles
        else if( Array.isArray( roles ) && !roles.includes( user.role ) )
          throw new CustomErrorHelper( req.t('user.unauthorized') )

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
   * @returns 
   */
  static async EmailVerified( req, res, next ) {
    try {

      // Get the user's email
      const email                           = UserHelper.GetUserEmail( req, res )

      // If the email was not found
      if( !email )
        throw new CustomErrorHelper( req.t('email.notFound') )

      // Get the user's record, by their email
      const user                            = await UserHelper.GetUserByEmail( res, email )

      // If the user's email is not verified
      if( !user.isEmailVerified )
        throw new CustomErrorHelper( req.t('email.notVerified') )

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
   * @returns 
   */
  static async AccountInactive( req, res, next ) {
    try {

      // Get the user's email
      const email                           = UserHelper.GetUserEmail( req, res )

      // If the email was not found
      if( !email )
        throw new CustomErrorHelper( req.t('email.notFound') )

      // Get the user's record, by their email
      const user                            = await UserHelper.GetUserByEmail( res, email )

      // If the user's account is not active
      if( !user.isActive )
        throw new CustomErrorHelper( req.t('user.notActive') )

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
   * @returns 
   */
  static async RefreshTokenRevoked( req, res, next ) {
    try {

      // Get the refresh token record
      const refreshTokenRecord              = await TokenHelper.GetRefreshTokenRecord( req, res, next, true, true )

      // If the refresh token is revoked
      if( refreshTokenRecord && refreshTokenRecord.isRevoked )
        return AuthController.Logout( req, res, next, 'user.logout.revoked' )

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
