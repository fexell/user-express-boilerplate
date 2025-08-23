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

AuthRouter.put( '/verify/email/:token', [
  AuthMiddleware.AccountInactive,
], AuthController.VerifyEmail )

AuthRouter.get( '/find/units', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], AuthController.UnitsLoggedInOn )

export {
  AuthRouter as default,
}
