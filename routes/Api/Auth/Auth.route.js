import { Router } from 'express'

import AuthController from '../../../controllers/Auth.controller.js'

import AuthMiddleware from '../../../middlewares/Auth.middleware.js'

/**
 * 
 */
const AuthRouter                            = Router()

AuthRouter.post( '/login', [
  AuthMiddleware.AlreadyLoggedIn,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], AuthController.Login )

AuthRouter.post( '/logout', [
  AuthMiddleware.AlreadyLoggedOut,
], AuthController.Logout )

AuthRouter.put( '/email/verify/:token', [
  AuthMiddleware.AlreadyLoggedIn,
  AuthMiddleware.AccountInactive,
], AuthController.VerifyEmail )

AuthRouter.get( '/units', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], AuthController.UnitsLoggedInOn )

export {
  AuthRouter as default,
}
