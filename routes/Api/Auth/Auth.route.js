import { Router } from 'express'

import AuthController from '../../../controllers/Auth.controller.js'

import AuthMiddleware from '../../../middlewares/Auth.middleware.js'

/**
 * 
 */
const AuthRouter                            = Router()

AuthRouter.post( '/login', [
  AuthMiddleware.AlreadyLoggedIn,
  AuthMiddleware.IsEmailVerified,
  AuthMiddleware.IsAccountActive,
], AuthController.Login )

AuthRouter.post( '/logout', [
  AuthMiddleware.AlreadyLoggedOut,
], AuthController.Logout )

AuthRouter.put( '/email/verify/:token', [
  AuthMiddleware.AlreadyLoggedIn,
  AuthMiddleware.IsAccountActive,
], AuthController.VerifyEmail )

export {
  AuthRouter as default,
}
