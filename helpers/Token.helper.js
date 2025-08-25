import jwt from 'jsonwebtoken'

import { PRIVATE_KEY, PUBLIC_KEY } from '../app.js'

import AuthController from '../controllers/Auth.controller.js'

import { JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRATION, JWT_REFRESH_TOKEN_EXPIRATION } from '../configs/Environment.config.js'

import RefreshTokenModel from '../models/RefreshToken.model.js'

import CookieHelper from './Cookie.helper.js'
import CustomErrorHelper from './Error.helper.js'
import ResponseHelper from './Response.helper.js'
import UserHelper from './User.helper.js'

/**
 * @constant ExpirationTime - JWT Expiration Time
 * @type {Object}
 * @property {String} ACCESS_TOKEN - Access Token Expiration Time (3 minutes)
 * @property {String} REFRESH_TOKEN - Refresh Token Expiration Time (30 days)
 */
const ExpirationTime                        = {
  ACCESS_TOKEN                              : JWT_ACCESS_TOKEN_EXPIRATION || '3m', // 3 minutes
  REFRESH_TOKEN                             : JWT_REFRESH_TOKEN_EXPIRATION || '30d', // 30 days
}

/**
 * Token Helper
 * @class TokenHelper
 * @classdesc Contains all methods related to (JWT) tokens
 * 
 * @method TokenHelper.Options Token Options
 * @method TokenHelper.Sign Sign JWT method
 * @method TokenHelper.SignAccessToken Sign Access Token method
 * @method TokenHelper.SignRefreshToken Sign Refresh Token method
 * @method TokenHelper.VerifyToken Verify JWT method
 * @method TokenHelper.VerifyAccessToken Verify Access Token method
 * @method TokenHelper.GetAccessToken Get Access Token method
 * @method TokenHelper.GenerateNewAccessToken Generate New Access Token method
 * @method TokenHelper.VerifyRefreshToken Verify Refresh Token method
 * @method TokenHelper.GetRefreshTokenId Get Refresh Token Id method
 * @method TokenHelper.GenerateNewRefreshToken Generate New Refresh Token method
 * @method TokenHelper.GetRefreshTokenRecord Get Refresh Token Record method
 * @method TokenHelper.GetRefreshTokenRecords Get all refresh token records
 * @method TokenHelper.RevokeRefreshToken Revoke one or more refresh tokens
 * @method TokenHelper.ValidateAndDecodeToken Validate And Decode Token method
 */
class TokenHelper {

  /**
   * @method TokenHelper.Options
   * @description JWT Options
   * @param {String} expiresIn 
   * @param {String} jwtId 
   * @returns {Object}
   */
  static Options( expiresIn, jwtId ) {

    // Return an object with the JWT options
    return {
      issuer                              : 'UserBoilerplate',
      algorithm                           : 'RS256',
      ...(expiresIn && { expiresIn }),
      ...(jwtId && { jwtid: jwtId }),
    }
  }

  /**
   * @method TokenHelper.Sign
   * @description Signs the JWT
   * @param {mongoose.ObjectId} payload 
   * @param {String} expiresIn 
   * @param {String} jwtId 
   * @returns {String}
   */
  static Sign( payload, expiresIn, jwtId ) {
    try {

      // Sign the JWT
      return jwt.sign( payload, { key: PRIVATE_KEY, passphrase: JWT_SECRET }, this.Options( expiresIn, jwtId ) )

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method TokenHelper.SignAccessToken
   * @description Signs the Access Token, with the user's id as the payload
   * @param {mongoose.ObjectId} payload 
   * @param {String} jwtId 
   * @returns {String}
   */
  static SignAccessToken( payload, jwtId ) {
    try {

      // Sign the Access Token, with its expiration time (3 minutes) and jsonwebtoken id
      return this.Sign( { userId: payload }, ExpirationTime.ACCESS_TOKEN, jwtId )

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method TokenHelper.SignRefreshToken
   * @description Signs the Refresh Token, with the user's id as the payload
   * @param {mongoose.ObjectId} payload 
   * @returns 
   */
  static SignRefreshToken( payload ) {
    try {

      // Sign the Refresh Token with its expiration time (30 days)
      return this.Sign( { userId: payload }, ExpirationTime.REFRESH_TOKEN )

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method TokenHelper.VerifyToken
   * @description Verifies the JWT
   * @param {String} token 
   * @param {String} expiresIn 
   * @param {String} jwtId 
   * @returns 
   */
  static VerifyToken( token, expiresIn, jwtId ) {
    try {

      // Verify the JWT
      return jwt.verify( token, { key: PUBLIC_KEY }, this.Options( expiresIn, jwtId ) )

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * Access Token methods
   * 
   * @method TokenHelper.VerifyAccessToken
   * @description Verifies the Access Token
   * @param {String} token 
   * @param {String} jwtId 
   * @returns {Object}
   */
  static VerifyAccessToken( token, jwtId ) {
    try {

      // Verify the Access Token
      return this.VerifyToken( token, ExpirationTime.ACCESS_TOKEN, jwtId )

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method TokenHelper.GetAccessToken
   * @description Gets the Access Token, from either req, session or cookie
   * @param {*} req 
   * @param {*} res 
   * @returns 
   */
  static GetAccessToken( req, res ) {
    try {

      // Get the Access Token from either req, session or cookie
      return req.accessToken || req.session.accessToken || CookieHelper.GetAccessTokenCookie( req, res )
      
    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method TokenHelper.GenerateNewAccessToken
   * @description Generates a new Access Token, and binds it to req and session
   * @param {*} req 
   * @param {*} res 
   * @param {mongoose.ObjectId} userId 
   * @param {String} jwtId 
   * @returns 
   */
  static GenerateNewAccessToken( req, res, userId, jwtId ) {
    try {

      // If the user id is not provided, throw an error
      if( !userId )
        throw new CustomErrorHelper( req.t( 'user.id.notFound' ) )

      // Generate a new Access Token
      const accessToken                     = this.SignAccessToken( userId, jwtId )

      // Create the Access Token cookie
      CookieHelper.SetAccessTokenCookie( res, accessToken )

      // Return the signed Access Token
      return this.SignAccessToken( userId, jwtId || req.session.jwtId )

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * Refresh Token methods
   * 
   * @method TokenHelper.VerifyRefreshToken
   * @description Verifies the Refresh Token
   * @param {String} token 
   * @returns 
   */
  static VerifyRefreshToken( token ) {
    try {

      // Verify the Refresh Token
      return this.VerifyToken( token, ExpirationTime.REFRESH_TOKEN )

    } catch ( error ) {
      throw new CustomErrorHelper( error.message )
    }
  }

  /**
   * @method TokenHelper.GetRefreshTokenId
   * @description Gets the Refresh Token Id, from either req, session or cookie
   * @param {*} req 
   * @param {*} res 
   * @returns 
   */
  static GetRefreshTokenId( req, res ) {
    try {

      // Get the Refresh Token Id from either req, session or cookie
      return req.refreshTokenId || req.session.refreshTokenId || CookieHelper.GetRefreshTokenIdCookie( req, res )

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method TokenHelper.GenerateNewRefreshToken
   * @description Generates a new Refresh Token, and binds it to req and session
   * @param {*} req 
   * @param {*} res 
   * @param {mongoose.ObjectId} userId 
   * @param {*} ipAddress 
   * @param {String} userAgent 
   * @param {String} token 
   * @returns 
   */
  static async GenerateNewRefreshToken( req, res, userId, token ) {
    try {

      // Generate a new Refresh Token record
      const newRefreshTokenRecord           = new RefreshTokenModel({
        userId                              : userId,
        deviceId                            : UserHelper.GetDeviceId( req, res ),
        ipAddress                           : UserHelper.GetIpAddress( req, res ),
        userAgent                           : UserHelper.GetUserAgent( req, res ),
        token                               : token,
      })

      // Save the Refresh Token record
      await newRefreshTokenRecord.save()

      // Create the Refresh Token cookie
      CookieHelper.SetRefreshTokenIdCookie( res, newRefreshTokenRecord._id )

      // Return the Refresh Token record
      return newRefreshTokenRecord

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method TokenHelper.GetRefreshTokenRecord - Get Refresh Token Record method
   * @param {*} req 
   * @param {*} res 
   * @param {Boolean} isLean 
   * @param {Boolean} isRevoked 
   * @returns 
   */
  static async GetRefreshTokenRecord( req, res, isLean = false, isRevoked = false ) {
    try {

      // Get the user id and refresh token id
      const userId                          = UserHelper.GetUserId( req, res )
      const refreshTokenId                  = this.GetRefreshTokenId( req, res )

      // If the user id and refresh token id are not found, let the user know they are not authenticated
      if( !userId && !refreshTokenId )
        throw new CustomErrorHelper( req.t( 'user.notAuthenticated' ) )

      // Attempt to find the refresh token record
      const refreshTokenRecord              = !isLean
        ? await RefreshTokenModel.findOne({ _id: refreshTokenId, userId: userId, deviceId: UserHelper.GetDeviceId( req, res ), isRevoked: isRevoked })
        : await RefreshTokenModel.findOne({ _id: refreshTokenId, userId: userId, deviceId: UserHelper.GetDeviceId( req, res ), isRevoked: isRevoked }).lean()

      // Return the refresh token record
      return refreshTokenRecord

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method TokenHelper.GetRefreshTokenRecords
   * @description Get all refresh token records
   * @param {Request} req 
   * @param {Response} res 
   * @param {Boolean} isLean 
   * @param {Boolean} isRevoked 
   * @returns 
   */
  static async GetRefreshTokenRecords( req, res, isLean = false, isRevoked = false ) {
    try {

      // Get the user id
      const userId                          = UserHelper.GetUserId( req, res )

      if( !userId )
        throw new CustomErrorHelper( req.t( 'user.id.notFound' ) )

      // Attempt to find the refresh token records
      const refreshTokenRecords             = !isLean
        ? await RefreshTokenModel.find({ userId: userId, deviceId: UserHelper.GetDeviceId( req, res ), isRevoked: isRevoked })
        : await RefreshTokenModel.find({ userId: userId, deviceId: UserHelper.GetDeviceId( req, res ), isRevoked: isRevoked }).lean()

      // Return the refresh token records
      return refreshTokenRecords

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method TokenHelper.RevokeRefreshToken
   * @description Method for revoking one or more refresh tokens
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @param {Boolean} many 
   * @returns 
   */
  static async RevokeRefreshToken( req, res, isMany = false ) {
    try {

      // Get the refresh token id
      const refreshTokenId                  = this.GetRefreshTokenId( req, res )

      // If the refresh token id is not found, let the user know they are not authenticated
      if( !refreshTokenId )
        throw new CustomErrorHelper( req.t( 'refreshToken.id.notFound' ) )

      // Attempt to find the refresh token record
      const refreshTokenRecords             = !isMany
        ? await RefreshTokenModel.updateOne({ _id: refreshTokenId, deviceId: UserHelper.GetDeviceId( req, res ) }, { $set: { isRevoked: true } })
        : await RefreshTokenModel.updateMany({ userId: UserHelper.GetUserId( req, res ), deviceId: UserHelper.GetDeviceId( req, res ) }, { $set: { isRevoked: true } })

      // Return the success response
      return ResponseHelper.Success( res, req.t( 'refreshTokenRecord.revoked' ) )

    } catch ( error ) {
      return ResponseHelper.Error( res, error.message )
    }
  }

  /**
   * @method TokenHelper.ValidateAndDecodeToken
   * @description Method for validating and decoding a token
   * @param {Request} req 
   * @param {String} token 
   * @param {String} type 
   * @returns 
   */
  static ValidateAndDecodeToken( req, token, type ) {
    try {

      // Depending on the type, validate and decode the token
      const decodedToken                    = type === 'access'
        ? this.VerifyAccessToken( token, req.jwtId || req.session.jwtId )
        : this.VerifyRefreshToken( token )

      // If the token is not valid, return null
      if( !decodedToken || !decodedToken.userId )
        return null

      // If the token is valid, return the decoded token
      return decodedToken

    } catch ( error ) {
      return null
    }
  }
}

export {
  TokenHelper as default,
}
