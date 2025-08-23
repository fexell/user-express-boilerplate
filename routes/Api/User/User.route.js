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

UserRouter.get( '/find/all', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
  AuthMiddleware.RoleChecker([ 'moderator', 'admin' ]),
], UserController.GetAllUsers )

UserRouter.get( '/find/id/:id', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.GetUserById )

UserRouter.get( '/find/email/:email', [
  AuthMiddleware.Authenticate,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.GetUserByEmail )

UserRouter.get( '/find/username/:username', [
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
