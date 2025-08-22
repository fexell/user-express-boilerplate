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
  AuthMiddleware.AccountActive,
], AuthController.Login )

AuthRouter.post( '/logout', [
  AuthMiddleware.AlreadyLoggedOut,
], AuthController.Logout )

AuthRouter.put( '/email/verify/:token', [
  AuthMiddleware.AlreadyLoggedIn,
  AuthMiddleware.AccountActive,
], AuthController.VerifyEmail )

AuthRouter.get( '/units', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountActive,
], AuthController.UnitsLoggedInOn )

export {
  AuthRouter as default,
}
