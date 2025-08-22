import { v4 as uuidv4 } from 'uuid'

import RefreshTokenModel from '../models/RefreshToken.model.js'
import UserModel from '../models/User.model.js'

import CookieHelper, { CookieNames } from '../helpers/Cookie.helper.js'
import CustomErrorHelper from '../helpers/Error.helper.js'
import PasswordHelper from '../helpers/Password.helper.js'
import ResponseHelper from '../helpers/Response.helper.js'
import UserHelper from '../helpers/User.helper.js'
import TokenHelper from '../helpers/Token.helper.js'

/**
 * @class AuthController
 * @classdesc Contains all controller methods related to authentication
 * 
 * @method AuthController.Login - Login method
 * @method AuthController.Logout - Logout method
 * @method AuthController.VerifyEmail - Verify email method
 * @method AuthController.UnitsLoggedInOn - Returns the units the user is currently logged in on
 */
class AuthController {

  /**
   * @method AuthController.Login
   * @description The controller method handling user login
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns 
   */
  static async Login( req, res, next ) {
    try {
      const {
        email,
        password,
      }                                     = req.body

      if(!email)
        throw new CustomErrorHelper( req.t('email.required') )

      else if(!password)
        throw new CustomErrorHelper( req.t('password.required') )

      const user                            = await UserHelper.GetUserByEmail( res, email, true, true )

      if(!user)
        throw new CustomErrorHelper( req.t('user.notFound') )

      if(!await PasswordHelper.Verify( user.password, password ))
        throw new CustomErrorHelper( req.t('password.invalid') )

      const jwtId                           = uuidv4()
      const clientIp                        = UserHelper.GetIpAddress( req, res )
      const accessToken                     = TokenHelper.GenerateNewAccessToken( req, res, user._id, jwtId )
      const refreshToken                    = TokenHelper.SignRefreshToken( user._id )

      const newRefreshTokenRecord           = await TokenHelper.GenerateNewRefreshToken(
        req,
        res,
        user._id,
        refreshToken,
      )

      CookieHelper.SetUserIdCookie( res, user._id )

      req.jwtId                             = req.session.jwtId                          = jwtId
      req.user                              = req.session.user                           = user
      req.userId                            = req.session.userId                         = user._id
      req.accessToken                       = req.session.accessToken                    = accessToken
      req.refreshTokenId                    = req.session.refreshTokenId                 = newRefreshTokenRecord._id

      return ResponseHelper.Success( res, req.t('user.login.success'), UserModel.SerializeUser( user ), 'user' )

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
   * @returns 
   */
  static async Logout( req, res, next, forced = false ) {
    try {
      const userId                          = UserHelper.GetUserId( req, res )
      const refreshTokenId                  = TokenHelper.GetRefreshTokenId( req, res )

      if(!userId && !refreshTokenId)
        throw new CustomErrorHelper( req.t('user.alreadyLoggedOut') )

      const refreshTokenRecord              = await RefreshTokenModel.findOne( { _id: refreshTokenId, userId: userId, isRevoked: false } )

      if(refreshTokenRecord) {
        refreshTokenRecord.isRevoked        = true

        await refreshTokenRecord.save()
      }

      delete req.session.jwtId
      delete req.session.user
      delete req.session.userId
      delete req.session.accessToken
      delete req.session.refreshTokenId

      CookieHelper.ClearCookie( res, CookieNames.USER_ID )
      CookieHelper.ClearCookie( res, CookieNames.ACCESS_TOKEN, true )
      CookieHelper.ClearCookie( res, CookieNames.REFRESH_TOKEN, true )

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
      const emailVerificationToken          = req.params.token
      const email                           = req.query?.email || req.body?.email

      if( !emailVerificationToken )
        throw new CustomErrorHelper( req.t('email.token.notFound') )

      else if( !email )
        throw new CustomErrorHelper( req.t('email.query.notFound') )

      const user                            = await UserHelper.GetUserByEmail( res, email )

      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound') )

      else if( user.isEmailVerified )
        throw new CustomErrorHelper( req.t('email.alreadyVerified') )

      user.emailVerificationToken           = null
      user.isEmailVerified                  = true

      await user.save()

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
      const userId                          = UserHelper.GetUserId( req, res )

      if( !userId )
        throw new CustomErrorHelper( req.t('user.id.notFound') )

      const sort                            = req.query.sort || '-createdAt'

      const units                           = await RefreshTokenModel.find( { userId: userId, isRevoked: false } ).sort( sort ).lean()

      return ResponseHelper.Success( res, req.t('user.units.found'), units.map( unit => RefreshTokenModel.SerializeRefreshToken( unit ) ), 'units' )

    } catch ( error ) {
      return next( error )
    }
  }
}

export {
  AuthController as default,
}
