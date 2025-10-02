import jwt from 'jsonwebtoken'
import ms from 'ms'

import { PRIVATE_KEY, PUBLIC_KEY } from '../app.js'

import AuthController from '../controllers/Auth.controller.js'

import { JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRATION, JWT_REFRESH_TOKEN_EXPIRATION } from '../configs/Environment.config.js'

import RefreshTokenModel from '../models/RefreshToken.model.js'
import TokenBlacklistModel from '../models/TokenBlacklist.model.js'

import CookieHelper from './Cookie.helper.js'
import CustomErrorHelper from './Error.helper.js'
import ResponseHelper from './Response.helper.js'
import StatusCodes from './StatusCodes.helper.js'
import UserHelper from './User.helper.js'
import { mongo } from 'mongoose'
import { token } from 'morgan'

/**
 * @constant ExpirationTime - JWT Expiration Time
 * @type {Object}
 * @property {String} ACCESS_TOKEN - Access Token Expiration Time (15 minutes)
 * @property {String} REFRESH_TOKEN - Refresh Token Expiration Time (30 days)
 */
const ExpirationTime                        = {
  ACCESS_TOKEN                              : JWT_ACCESS_TOKEN_EXPIRATION || '15m', // 15 minutes
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
   * @returns {Object} Options object for the JWT
   */
  static Options( expiresIn, jwtId ) {

    // Return an object with the JWT options
    return {
      issuer                              : 'UserBoilerplate',
      algorithm                           : 'RS256',
      ...( expiresIn && { expiresIn } ),
      ...( jwtId && { jwtid: jwtId } ),
    }
  }

  /**
   * @method TokenHelper.Sign
   * @description Signs the JWT
   * @param {mongoose.ObjectId} payload 
   * @param {String} expiresIn 
   * @param {String} jwtId 
   * @returns {String} The signed JWT
   */
  static Sign( payload, expiresIn, jwtId ) {
    try {

      // Sign the JWT
      return jwt.sign( payload, { key: PRIVATE_KEY, passphrase: JWT_SECRET }, this.Options( expiresIn, jwtId ) )

    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.SignAccessToken
   * @description Signs the Access Token, with the user's id as the payload
   * @param {mongoose.ObjectId} payload 
   * @param {String} jwtId 
   * @returns {String} The signed Access Token
   */
  static SignAccessToken( payload, jwtId ) {
    try {

      // Sign the Access Token, with its expiration time (15 minutes) and jsonwebtoken id
      return this.Sign( { userId: payload }, ExpirationTime.ACCESS_TOKEN, jwtId )

    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.SignRefreshToken
   * @description Signs the Refresh Token, with the user's id as the payload
   * @param {mongoose.ObjectId} payload 
   * @returns {String} The signed Refresh Token
   */
  static SignRefreshToken( payload ) {
    try {

      // Sign the Refresh Token with its expiration time (30 days)
      return this.Sign( { userId: payload }, ExpirationTime.REFRESH_TOKEN )

    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.VerifyToken
   * @description Verifies the JWT
   * @param {String} token 
   * @param {String} expiresIn 
   * @param {String} jwtId 
   * @returns {Object} The verified JWT, and its payload
   */
  static async VerifyToken( token, expiresIn, jwtId ) {
    try {

      // Verify the JWT
      return await jwt.verify( token, { key: PUBLIC_KEY }, this.Options( expiresIn, jwtId ) )

    } catch ( error ) {
      if( error.name === 'TokenExpiredError' )
        throw new CustomErrorHelper( 'Token expired', StatusCodes.UNAUTHORIZED )

      throw new CustomErrorHelper( 'Invalid token', StatusCodes.UNAUTHORIZED )
    }
  }

  /**
   * Access Token methods
   * 
   * @method TokenHelper.VerifyAccessToken
   * @description Verifies the Access Token
   * @param {Response} res
   * @param {String} token 
   * @param {String} jwtId 
   * @returns {Object} The verified Access Token
   */
  static async VerifyAccessToken( token, jwtId ) {
    try {

      // Verify the Access Token
      return await this.VerifyToken( token, ExpirationTime.ACCESS_TOKEN, jwtId )

    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.GetAccessToken
   * @description Gets the Access Token, from either req, session or cookie
   * @param {Request} req 
   * @param {Response} res 
   * @returns {String} The Access Token
   */
  static GetAccessToken( req, res ) {
    try {

      // Get the Access Token from either req, session or cookie
      return req.accessToken || req.session.accessToken || CookieHelper.GetAccessTokenCookie( req, res )
      
    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.GenerateNewAccessToken
   * @description Generates a new Access Token, and binds it to req and session
   * @param {Request} req 
   * @param {Response} res 
   * @param {mongoose.ObjectId} userId 
   * @param {String} jwtId 
   * @returns {String} The signed Access Token
   */
  static GenerateNewAccessToken( req, res, userId, jwtId ) {
    try {

      // If the user id is not provided, throw an error
      if( !userId )
        throw new CustomErrorHelper( req.t( 'user.id.notFound' ) )

      // Generate a new Access Token
      const accessToken                     = this.SignAccessToken( userId, jwtId || req.session.jwtId )

      // Create the Access Token cookie
      CookieHelper.SetAccessTokenCookie( res, accessToken )

      req.accessToken                       = req.session.accessToken                     = accessToken

      // Return the signed Access Token
      return accessToken

    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * Refresh Token methods
   * 
   * @method TokenHelper.VerifyRefreshToken
   * @description Verifies the Refresh Token
   * @param {String} token 
   * @returns {Object} The verified/decoded Refresh Token
   */
  static async VerifyRefreshToken( token ) {
    try {

      // Verify the Refresh Token
      return await this.VerifyToken( token, ExpirationTime.REFRESH_TOKEN )

    } catch ( error ) {
    throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.GetRefreshToken
   * @description Gets the Refresh Token, from either req, session or cookie
   * @param {Request} req 
   * @param {Response} res 
   * @returns {String} The Refresh Token
   */
  static GetRefreshToken( req, res ) {
    try {

      // Get the Refresh Token from either req, session or cookie
      return req.refreshToken || req.session.refreshToken || CookieHelper.GetRefreshTokenCookie( req, res )

    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.GetRefreshTokenId
   * @description Gets the Refresh Token Id, from either req, session or cookie
   * @param {Request} req 
   * @param {Response} res 
   * @returns {mongoose.ObjectId} The Refresh Token Id
   */
  static GetRefreshTokenId( req, res ) {
    try {

      // Get the Refresh Token Id from either req, session or cookie
      return req.refreshTokenId || req.session.refreshTokenId || CookieHelper.GetRefreshTokenIdCookie( req, res )

    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.GenerateNewRefreshToken
   * @description Generates a new Refresh Token, and binds it to req and session
   * @param {Request} req 
   * @param {Response} res 
   * @param {mongoose.ObjectId} userId 
   * @param {String} ipAddress 
   * @param {String} userAgent 
   * @param {String} token 
   * @returns {String} The signed Refresh Token
   */
  static async GenerateNewRefreshToken( req, res, fromMethod = 'GenerateNewRefreshToken', userId ) {
    try {

      // Get the user's id
      const uid                             = userId ||UserHelper.GetUserId( req, res )

      // Get the _current_ device id
      const currentDeviceId                 = UserHelper.GetDeviceId( req, res )

      // Revoke the current refresh token
      await this.RevokeRefreshToken( req, res, `New refresh token generated by ${ fromMethod }`, currentDeviceId )

      // Generate a new device id
      const {
        deviceId: newDeviceId,
        salt: newSalt
      }                                     = UserHelper.GenerateDeviceId( req, res, uid, true )

      // Get the user agent
      const userAgent                       = UserHelper.GetUserAgent( req, res )

      // Get the ip address
      const ipAddress                       = UserHelper.GetIpAddress( req, res )

      const token                           = this.SignRefreshToken( uid )

      // Generate a new Refresh Token record
      const newRefreshTokenRecord           = new RefreshTokenModel({
        userId                              : uid,
        deviceId                            : newDeviceId,
        salt                                : newSalt,
        ipAddress                           : ipAddress,
        userAgent                           : userAgent,
        token                               : token,
        expiresAt                           : new Date( Date.now() + ms( ExpirationTime.REFRESH_TOKEN ) ),
      })

      // Save the Refresh Token record
      await newRefreshTokenRecord.save()

      // Create the Refresh Token cookies
      CookieHelper.SetRefreshTokenCookie( res, newRefreshTokenRecord.token )
      CookieHelper.SetRefreshTokenIdCookie( res, newRefreshTokenRecord._id )

      // Store in session and request
      req.refreshToken                      = req.session.refreshToken                    = newRefreshTokenRecord.token
      req.refreshTokenId                    = req.session.refreshTokenId                  = newRefreshTokenRecord._id

      // Return the Refresh Token record
      return newRefreshTokenRecord

    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.GetRefreshTokenRecord - Get Refresh Token Record method
   * @param {Request} req 
   * @param {Response} res 
   * @param {Boolean} isLean 
   * @param {Boolean} isRevoked 
   * @returns {Mongoose.Document} The Refresh Token Record
   */
  static async GetRefreshTokenRecord( req, res, isLean = false ) {
    try {

      // Get the user id and refresh token id
      const userId                          = UserHelper.GetUserId( req, res )
      const refreshToken                    = this.GetRefreshToken( req, res )
      const refreshTokenId                  = this.GetRefreshTokenId( req, res )

      // If the user id and refresh token id are not found, let the user know they are not authenticated
      if( !userId && !refreshTokenId )
        throw new CustomErrorHelper( req.t( 'user.notAuthenticated' ) )

      // Attempt to find the refresh token record
      const refreshTokenRecord              = !isLean
        ? await RefreshTokenModel.findOne({ _id: refreshTokenId, userId: userId, deviceId: UserHelper.GetDeviceId( req, res ), token: refreshToken })
        : await RefreshTokenModel.findOne({ _id: refreshTokenId, userId: userId, deviceId: UserHelper.GetDeviceId( req, res ), token: refreshToken }).lean()

      // If the refresh token record was not found
      if( !refreshTokenRecord )
        return null

      // Check if the refresh token is blacklisted
      const blacklisted                     = await TokenBlacklistModel.findOne({ token: refreshToken })

      // If the refresh token is blacklisted
      if( blacklisted ) {

        // If the refresh token is valid within the grace period
        if( blacklisted.graceUntil && Date.now() <= blacklisted.graceUntil.getTime() )
          return refreshTokenRecord

        // Return null if it is not within the grace period
        return null
      }

      // If the refresh token is revoked...
      if( refreshTokenRecord.revoked ) {

        // ...but if it is valid within the grace period
        if( refreshTokenRecord.graceUntil && Date.now() <= refreshTokenRecord.graceUntil.getTime() )
          return refreshTokenRecord

        // Return null if it is not within the grace period
        return null
      }

      // Return the refresh token record
      return refreshTokenRecord

    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.GetRefreshTokenRecords
   * @description Get all refresh token records
   * @param {Request} req 
   * @param {Response} res 
   * @param {Boolean} isLean 
   * @param {Boolean} isRevoked 
   * @returns {Mongoose.Document} The Refresh Token Records
   */
  static async GetRefreshTokenRecords( req, res, isLean = false ) {
    try {

      // Get the user id
      const userId                          = UserHelper.GetUserId( req, res )
      const refreshToken                    = this.GetRefreshToken( req, res )

      if( !userId )
        throw new CustomErrorHelper( req.t( 'user.id.notFound' ) )

      // Attempt to find the refresh token records
      const refreshTokenRecords             = !isLean
        ? await RefreshTokenModel.find({ userId: userId, deviceId: UserHelper.GetDeviceId( req, res ) })
        : await RefreshTokenModel.find({ userId: userId, deviceId: UserHelper.GetDeviceId( req, res ) }).lean()

      // Return the refresh token records
      return refreshTokenRecords

    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @method TokenHelper.RevokeRefreshToken
   * @description Method for revoking one or more refresh tokens
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @param {String} targetDeviceId The target device id to revoke
   * @returns {Object} Success response with the revoked refresh token(s)
   */
  static async RevokeRefreshToken( req, res, reason, targetDeviceId = null, userId ) {
    try {

      let refreshTokens                     = []

      // Get the device id
      const deviceId                        = UserHelper.GetDeviceId( req, res )

      // Get the refresh token records either by current device id or target device id
      if( ( targetDeviceId || !targetDeviceId ) && !userId )
        refreshTokens                       = !targetDeviceId && !userId
          ? await RefreshTokenModel.find({ deviceId: deviceId })
          : await RefreshTokenModel.find({ deviceId: targetDeviceId })

      else if( !targetDeviceId && userId )
        refreshTokens                       = await RefreshTokenModel.find({ userId: userId })

      // Initialize an array for the refresh token blacklist
      const blacklistRecords                = []

      // Initialize an array for the refresh token ids to delete
      const tokenIdsToDelete                = []

      for( const tokenRecord of refreshTokens ) {

        // Decode the refresh token
        const decoded                       = this.ValidateAndDecodeToken( req, res, tokenRecord.token, 'refresh' )

        // If the refresh token is not valid, continue
        if( !decoded )
          continue

        // Add the refresh token record to the blacklist
        blacklistRecords.push({
          userId                            : tokenRecord.userId,
          deviceId                          : tokenRecord.deviceId,
          salt                              : tokenRecord.salt,
          token                             : tokenRecord.token,
          ipAddress                         : tokenRecord.ipAddress,
          reason                            : reason,
          expiresAt                         : tokenRecord.expiresAt,
          meta                              : req.useragent,
        })

        // Add the refresh token id to the token ids to delete
        if( tokenRecord._id )
          tokenIdsToDelete.push( tokenRecord._id )
      }

      // First, insert the refresh token to the token-blacklist
      await TokenBlacklistModel.insertMany( blacklistRecords )

      // Then, delete the refresh tokens
      await RefreshTokenModel.deleteMany({ _id: { $in: tokenIdsToDelete } })

      // Return the amount of revoked tokens, and the revoked tokens id
      return {
        success: true,
        revokedTokens: tokenIdsToDelete.length,
        revokedTokenIds: tokenIdsToDelete.filter( id => id ).map( token => token.toString() ),
      }
      
    } catch ( error ) {
      throw new CustomErrorHelper( error.message, StatusCodes.INTERNAL_SERVER_ERROR )
    }
  }

  /**
   * @async
   * @method TokenHelper.ValidateAndDecodeToken
   * @description Method for validating and decoding a token
   * @param {Request} req 
   * @param {String} token 
   * @param {String} type 
   * @returns {Promise<Object>} The decoded token
   */
  static async ValidateAndDecodeToken( req, res, token, type ) {
    try {

      // Depending on the type, validate and decode the token
      const decodedToken                    = type === 'access'
        ? await this.VerifyAccessToken( token, req.session.jwtId || null )
        : await this.VerifyRefreshToken( token )

      // If the token is not valid, return null
      if( !decodedToken || ( type === 'access' && !decodedToken.userId ) )
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
