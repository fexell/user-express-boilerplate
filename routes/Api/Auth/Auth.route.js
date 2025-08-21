import { Router } from 'express'

import AuthController from '../../../controllers/Auth.controller.js'

import AuthMiddleware from '../../../middlewares/Auth.middleware.js'

const AuthRouter                            = Router()

AuthRouter.post( '/login', [ AuthMiddleware.AlreadyLoggedIn ], AuthController.Login )
AuthRouter.post( '/logout', AuthController.Logout )

export {
  AuthRouter as default,
}
