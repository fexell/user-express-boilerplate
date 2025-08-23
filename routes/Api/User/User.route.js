import { Router } from 'express'

import UserController from '../../../controllers/User.controller.js'

import AuthMiddleware from '../../../middlewares/Auth.middleware.js'

const UserRouter                            = Router()

UserRouter.get( '/', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.GetUser )

UserRouter.post( '/', [
  AuthMiddleware.AlreadyLoggedIn,
], UserController.Create )

export {
  UserRouter as default,
}
