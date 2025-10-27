import { Router } from 'express'

import AuthController from '../../../controllers/Auth.controller.js'

import AuthMiddleware from '../../../middlewares/Auth.middleware.js'

/**
 * @type {Router}
 * @constant AuthRouter
 * @description Contains all routes related to authentication
 * 
 * @route {POST} /api/auth/login
 * @route {POST} /api/auth/logout
 * @route {PUT} /api/auth/verify/email/:token
 * @route {GET} /api/auth/find/units
 * 
 * @exports AuthRouter
 */
const AuthRouter                            = Router()

/**
 * @route POST /api/auth/login
 * @description Login a user
 * @returns {User} The user's details
 */
AuthRouter.post( '/login', [
  AuthMiddleware.AlreadyLoggedIn,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], AuthController.Login )

/**
 * @route POST /api/auth/logout
 * @description Logout a user
 * @returns {String} A success message
 */
AuthRouter.post( '/logout', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.AlreadyLoggedOut,
], AuthController.Logout )

/**
 * @route PUT /api/auth/verify/email/:token
 * @description Verify a user's email
 * @returns {String} A success message
 */
AuthRouter.put( '/email/verify/:token', AuthController.VerifyEmail )

/**
 * @route GET /api/auth/find/units
 * @description Find the units the user is currently logged in on
 * @returns {RefreshTokens[]} The refresh tokens that are _not_ revoked
 */
AuthRouter.get( '/find/units', [
  AuthMiddleware.ValidateTokens,
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], AuthController.UnitsLoggedInOn )

AuthRouter.put( '/unit/revoke/all', [
  AuthMiddleware.ValidateTokens,
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], AuthController.RevokeAllRefreshTokens )

AuthRouter.put( '/unit/revoke/:tokenId', [
  AuthMiddleware.ValidateTokens,
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], AuthController.RevokeRefreshToken )

AuthRouter.put( '/tokens/refresh', [
  AuthMiddleware.ValidateTokens,
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], AuthController.RefreshTokens )

export {
  AuthRouter as default,
}
