import { v4 as uuidv4 } from 'uuid'

import RefreshTokenModel from '../models/RefreshToken.model.js'
import UserModel from '../models/User.model.js'

import CookieHelper, { CookieNames } from '../helpers/Cookie.helper.js'
import CustomErrorHelper from '../helpers/Error.helper.js'
import PasswordHelper from '../helpers/Password.helper.js'
import ResponseHelper from '../helpers/Response.helper.js'
import SessionHelper from '../helpers/Session.helper.js'
import StatusCodes from '../helpers/StatusCodes.helper.js'
import UserHelper from '../helpers/User.helper.js'
import TokenHelper from '../helpers/Token.helper.js'

/**
 * @class AuthController
 * @classdesc Contains all controller methods related to authentication
 * 
 * @method AuthController.Login Login method
 * @method AuthController.Logout Logout method
 * @method AuthController.VerifyEmail Verify email method
 * @method AuthController.UnitsLoggedInOn Returns the units the user is currently logged in on
 * @method AuthController.RevokeRefreshToken The controller method handling revoking a refresh token
 */
class AuthController {

  /**
   * @method AuthController.Login
   * @description The controller method handling user login
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns Success response
   */
  static async Login( req, res, next ) {
    try {

      // Destructure the request body
      const {
        email,
        password,
      }                                     = req.body

      // if the email is empty
      if( !email )
        throw new CustomErrorHelper( req.t('email.required') )

      // if the password is empty
      else if( !password )
        throw new CustomErrorHelper( req.t('password.required') )

      // Get the user record by email
      const user                            = await UserHelper.GetUserByEmail( req, res, email, true, true )

      // If the user was not found
      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound'), StatusCodes.NOT_FOUND )

      // If the password is incorrect
      if( !await PasswordHelper.Verify( user.password, password ) )
        throw new CustomErrorHelper( req.t('password.invalid') )

      // JWT ID for the access token
      const jwtId                           = uuidv4()

      // Generate a new access token
      const accessToken                     = TokenHelper.GenerateNewAccessToken( req, res, user._id, jwtId )

      // Sign a new refresh token
      const refreshToken                    = TokenHelper.SignRefreshToken( user._id )

      // Generate a new refresh token record
      const newRefreshTokenRecord           = await TokenHelper.GenerateNewRefreshToken(
        req,
        res,
        'Login',
        user._id,
      )

      // Set the user id cookie
      CookieHelper.SetUserIdCookie( res, user._id )

      // Set everything in the session
      req.jwtId                             = req.session.jwtId                           = jwtId
      req.userId                            = req.session.userId                          = user._id
      req.accessToken                       = req.session.accessToken                     = accessToken
      req.refreshToken                      = req.session.refreshToken                    = newRefreshTokenRecord.token
      req.refreshTokenId                    = req.session.refreshTokenId                  = newRefreshTokenRecord._id

      // Return the success response
      return ResponseHelper.Success( res, req.t('user.login.success'), 200, UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthController.Logout
   * @description The controller method handling user logout
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @param {Boolean} forced 
   * @returns Success response
   */
  static async Logout( req, res, next, forced = false ) {
    try {

      // Get the user id and refresh token id
      const userId                          = UserHelper.GetUserId( req, res )
      const refreshToken                    = TokenHelper.GetRefreshToken( req, res )

      // If the user id and refresh token id are not found
      if( !userId && !refreshToken )
        throw new CustomErrorHelper( req.t('user.alreadyLoggedOut') )

      await TokenHelper.RevokeRefreshToken( req, res, 'User logged out' )

      // Clear all the session variables
      SessionHelper.ClearAllSessions( req )

      // Clear all the cookies
      CookieHelper.ClearAllCookies( res )

      if( typeof forced === 'string' )
        return ResponseHelper.Success( res, req.t( forced ) )

      // If the logout wasn't forced, return the success response, otherwise return the forced logout response
      return !forced
        ? ResponseHelper.Success( res, req.t('user.logout.success'))
        : ResponseHelper.Success( res, req.t('user.logout.forced'))

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthController.VerifyEmail
   * @description The controller method handling email verification
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns 
   */
  static async VerifyEmail( req, res, next ) {
    try {

      // Get the email verification token from the parameter
      const emailVerificationToken          = req.params.token

      // Get the email from the query or the form body
      const email                           = req.query?.email || req.body?.email

      // If the email verification token was not found
      if( !emailVerificationToken )
        throw new CustomErrorHelper( req.t('email.token.notFound'), StatusCodes.NOT_FOUND )

      // If the email was not found
      else if( !email )
        throw new CustomErrorHelper( req.t('email.query.notFound'), StatusCodes.NOT_FOUND )

      // Attempt to find the user by their email
      const user                            = await UserHelper.GetUserByEmail( req, res, email )

      // If the user was not found
      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound'), StatusCodes.NOT_FOUND )

      // If the user's email is already verified
      else if( user.isEmailVerified )
        throw new CustomErrorHelper( req.t('email.alreadyVerified') )

      // Set the email verification token to null and set the email as verified
      user.emailVerificationToken           = null
      user.isEmailVerified                  = true

      // Save the user
      await user.save()

      // Return the success response
      return ResponseHelper.Success( res, req.t('emailVerification.success') )

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthController.UnitsLoggedInOn
   * @description The controller method handling returning the units the user is currently logged in on
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns 
   */
  static async UnitsLoggedInOn( req, res, next ) {
    try {

      // Get the user id
      const userId                          = UserHelper.GetUserId( req, res )

      // If the user id was not found
      if( !userId )
        throw new CustomErrorHelper( req.t('user.id.notFound') )

      // Sort by whatever the user wants (from query) or sort by createdAt
      const sort                            = req.query.sort || '-createdAt'

      // Attempt to find the refresh token records
      const units                           = await RefreshTokenModel.find( { userId: userId } ).sort( sort ).lean()

      // Return the success response
      return ResponseHelper.Success( res, req.t('user.units.found'), 200, units.map( unit => RefreshTokenModel.SerializeRefreshToken( unit ) ), 'units' )

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthController.RevokeRefreshToken
   * @description The controller method handling revoking a refresh token
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns 
   */
  static async RevokeRefreshToken( req, res, next ) {
    try {
      const refreshTokenId                  = req.params.tokenId

      // If the refresh token id was not found
      if( !refreshTokenId )
        throw new CustomErrorHelper( req.t('refreshToken.id.notFound'), StatusCodes.NOT_FOUND )

      // Attempt to find the refresh token record
      const refreshTokenRecord              = await RefreshTokenModel.findOne({ _id: refreshTokenId })

      // If the refresh token record was not found
      if( !refreshTokenRecord )
        throw new CustomErrorHelper( req.t('refreshTokenRecord.notFound'), StatusCodes.NOT_FOUND )

      // Revoke the targeted refresh token
      await TokenHelper.RevokeRefreshToken( req, res, 'Refresh token revoked by user', refreshTokenRecord.deviceId )

      // Return the success response
      return ResponseHelper.Success( res, req.t('refreshTokenRecord.revoked') )

    } catch ( error ) {
      return next( error )
    }
  }

  static async RevokeAllRefreshTokens( req, res, next ) {
    try {
      await TokenHelper.RevokeRefreshToken( req, res, 'All refresh tokens revoked', null, UserHelper.GetUserId( req, res ) )

      return ResponseHelper.Success( res, req.t('refreshTokens.revoked') )

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method AuthController.UpdatePassword
   * @description The controller method handling updating a user's password
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {JSON} Success response
   */
  static async UpdatePassword( req, res, next ) {
    try {

      // Destructure the request body
      const {
        password,
        newPassword,
        newPasswordConfirm,
      }                                     = req.body

      // If password field wasn't found
      if( !password )
        throw new CustomErrorHelper( req.t('password.required') )

      // If the new password field wasn't found
      else if( !newPassword )
        throw new CustomErrorHelper( req.t('newPassword.required') )

      // If the new password confirm field wasn't found
      else if( !newPasswordConfirm )
        throw new CustomErrorHelper( req.t('newPasswordConfirm.required') )

      // If the password is the same as the new password
      else if( password === newPassword )
        throw new CustomErrorHelper( req.t('password.sameAsOld') )

      // If the new password doesn't match the new password confirm
      else if( newPassword !== newPasswordConfirm )
        throw new CustomErrorHelper( req.t('password.mismatch') )

      // Attempt to find the user, by id
      const user                            = await UserHelper.GetUserById( req, res, UserHelper.GetUserId( req, res ), true )

      // If the user was not found
      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound'), StatusCodes.NOT_FOUND )

      // Hash the new password, and set it to the user
      user.password                         = await PasswordHelper.Hash( newPassword )

      // Save the user
      await user.save()

      // Return the success response
      return ResponseHelper.Success( res, req.t('password.updated') )

    } catch ( error ) {
      return next( error )
    }
  }

  static async RefreshTokens( req, res, next ) {
    try {
      const jwtId                           = uuidv4()
      const userId                          = UserHelper.GetUserId( req, res )

      await TokenHelper.GenerateNewAccessToken( req, res, userId, jwtId )
      await TokenHelper.GenerateNewRefreshToken( req, res, 'RefreshTokens' )

      return ResponseHelper.Success( res, req.t('tokens.refreshed') )

    } catch ( error ) {
      return next( error )
    }
  }
}

export {
  AuthController as default,
}
