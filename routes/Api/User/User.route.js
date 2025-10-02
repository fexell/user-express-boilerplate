import { Router } from 'express'

import UserController from '../../../controllers/User.controller.js'

import AuthMiddleware from '../../../middlewares/Auth.middleware.js'

/**
 * @type {Router}
 * @constant UserRouter
 * @description Contains all routes related to users
 * 
 * @route {GET} /api/user/find/me
 * @route {GET} /api/user/find/all
 * @route {GET} /api/user/find/id/:id
 * @route {GET} /api/user/find/email/:email
 * @route {GET} /api/user/find/username/:username
 * @route {POST} /api/user
 * 
 * @exports UserRouter
 */
const UserRouter                            = Router()

/** 
 * @route GET /api/user/find/me
 * @description Find the currently logged in user's details
 * @returns {User} The user's details
*/
UserRouter.get( '/find/me', [
  AuthMiddleware.ValidateTokens,
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.GetUser )

/**
 * @route GET /api/user/find/all
 * @description Find all users (moderators and admins only)
 * @returns {Users[]} An array of all users
 */
UserRouter.get( '/find/all', [
  AuthMiddleware.ValidateTokens,
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
  AuthMiddleware.RoleChecker([ 'moderator', 'admin' ]),
], UserController.GetAllUsers )

/**
 * @route GET /api/user/find/id/:id
 * @description Find a specific user by their id
 * @returns {User} The user's details
 */
UserRouter.get( '/find/id/:id', [
  AuthMiddleware.ValidateTokens,
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.GetUserById )

/**
 * @route GET /api/user/find/email/:email
 * @description Find a specific user by their email
 * @returns {User} The user's details
 */
UserRouter.get( '/find/email/:email', [
  AuthMiddleware.ValidateTokens,
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.GetUserByEmail )

/**
 * @route GET /api/user/find/username/:username
 * @description Find a specific user by their username
 * @returns {User} The user's details
 */
UserRouter.get( '/find/username/:username', [
  AuthMiddleware.ValidateTokens,
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.GetUserByUsername )

/**
 * @route PUT /api/user/update/me
 * @description Update the currently logged in user's details
 * @returns {User} The user's details
 */
UserRouter.put( '/update/me', [
  AuthMiddleware.ValidateTokens,
  AuthMiddleware.Authenticate,
  AuthMiddleware.VerifySessionData,
  AuthMiddleware.RefreshTokenRevoked,
  AuthMiddleware.EmailVerified,
  AuthMiddleware.AccountInactive,
], UserController.UpdateUser )

/**
 * @route POST /api/user/
 * @description Create a new user
 * @returns {User} The user's details
 */
UserRouter.post( '/', [
  AuthMiddleware.AlreadyLoggedIn,
], UserController.Create )

export {
  UserRouter as default,
}
