

import UserModel from '../models/User.model.js'

import CustomErrorHelper from '../helpers/Error.helper.js'
import ResponseHelper from '../helpers/Response.helper.js'
import UserHelper from '../helpers/User.helper.js'

class UserController {
  static async Create( req, res, next ) {
    try {
      const {
        email,
        username,
        forename,
        surname,
        password,
        passwordConfirm,
      }                                     = req.body

      if(password !== passwordConfirm)
        throw new CustomErrorHelper( req.t('password.mismatch') )

      const newUser                         = new UserModel({
        email,
        username,
        forename,
        surname,
        password,
      })

      await newUser.save()

      return ResponseHelper.Success( res, req.t('user.created'), UserModel.SerializeUser( newUser ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }

  static async GetUser( req, res, next ) {
    try {
      const userId                          = UserHelper.GetUserId( req, res )
      const user                            = await UserHelper.GetUserById( userId, true )

      return ResponseHelper.Success( res, req.t('user.found'), UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }
}

export {
  UserController as default,
}
