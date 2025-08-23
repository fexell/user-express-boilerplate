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

UserRouter.get( '/:id', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.GetUserById )

UserRouter.get( '/email/:email', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.GetUserByEmail )

UserRouter.get( '/username/:username', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.GetUserByUsername )

UserRouter.post( '/', [
  AuthMiddleware.AlreadyLoggedIn,
], UserController.Create )

export {
  UserRouter as default,
}
