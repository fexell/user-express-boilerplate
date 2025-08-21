import { Router } from 'express'

import UserController from '../../../controllers/User.controller.js'

import AuthMiddleware from '../../../middlewares/Auth.middleware.js'

const UserRouter                            = Router()

UserRouter.get( '/', [ AuthMiddleware.Authenticate ], UserController.GetUser )
UserRouter.post( '/', UserController.Create )

export {
  UserRouter as default,
}
