

import UserModel from '../models/User.model.js'

import CustomErrorHelper from '../helpers/Error.helper.js'
import ResponseHelper from '../helpers/Response.helper.js'
import UserHelper from '../helpers/User.helper.js'

/**
 * @class UserController
 * @classdesc Contains all controller methods related to the user
 * 
 * @method UserController.Create - Create a new user
 * @method UserController.GetUser - Get the user's details
 */
class UserController {

  /**
   * @method UserController.Create
   * @description The controller method handling creating a new user (most of the validation is done in the user model, User.model.js)
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns 
   */
  static async Create( req, res, next ) {
    try {

      // Destructure the request body
      const {
        email,
        username,
        forename,
        surname,
        password,
        passwordConfirm,
      }                                     = req.body

      // If the passwords don't match
      if(password !== passwordConfirm)
        throw new CustomErrorHelper( req.t('password.mismatch') )

      // Create the new user
      const newUser                         = new UserModel({
        email,
        username,
        forename,
        surname,
        password,
      })

      // Save the new user
      await newUser.save()

      // Return the new user
      return ResponseHelper.Success( res, req.t('user.created'), 201, UserModel.SerializeUser( newUser ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method UserController.GetUser
   * @description The controller method handling getting the _current_ user's details
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns 
   */
  static async GetUser( req, res, next ) {
    try {

      // Retrieve the user by user id
      const user                            = await UserHelper.GetUserById( UserHelper.GetUserId( req, res ), true )

      // If the user doesn't exist
      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound') )

      // Return the user
      return ResponseHelper.Success( res, req.t('user.found'), 200, UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }

  static async GetUserById( req, res, next ) {
    try {

      const userId                          = req.params.id

      if( !userId )
        throw new CustomErrorHelper( req.t('user.id.notFound') )

      const user                            = await UserHelper.GetUserById( userId, true )

      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound') )

      return ResponseHelper.Success( res, req.t('user.found'), 200, UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }

  static async GetUserByEmail( req, res, next ) {
    try {

      const email                           = req.params.email

      if( !email )
        throw new CustomErrorHelper( req.t('email.notFound') )

      const user                            = await UserHelper.GetUserByEmail( res, email )

      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound') )

      return ResponseHelper.Success( res, req.t('user.found'), 200, UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }

  static async GetUserByUsername( req, res, next ) {
    try {

      const username                        = req.params.username

      if( !username )
        throw new CustomErrorHelper( req.t('username.notFound') )

      const user                            = await UserHelper.GetUserByUsername( res, username )

      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound') )

      return ResponseHelper.Success( res, req.t('user.found'), 200, UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }
}

export {
  UserController as default,
}
