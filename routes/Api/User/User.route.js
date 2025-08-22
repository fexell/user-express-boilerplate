import { Router } from 'express'

import UserController from '../../../controllers/User.controller.js'

import AuthMiddleware from '../../../middlewares/Auth.middleware.js'

const UserRouter                            = Router()

UserRouter.get( '/', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.IsRefreshTokenRevoked,
  AuthMiddleware.IsEmailVerified,
  AuthMiddleware.IsAccountActive,
], UserController.GetUser )
UserRouter.post( '/', [
  AuthMiddleware.AlreadyLoggedIn,
], UserController.Create )

export {
  UserRouter as default,
}
