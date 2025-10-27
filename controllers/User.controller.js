

import UserModel from '../models/User.model.js'
import EmailVerificationModel from '../models/EmailVerification.model.js'

import CustomErrorHelper from '../helpers/Error.helper.js'
import ResponseHelper from '../helpers/Response.helper.js'
import StatusCodes from '../helpers/StatusCodes.helper.js'
import StringHelper from '../helpers/String.helper.js'
import UserHelper from '../helpers/User.helper.js'

/**
 * @class UserController
 * @classdesc Contains all controller methods related to the user
 * 
 * @method UserController.Create Create a new user
 * @method UserController.GetUser Get the user's details
 * @method UserController.GetUserById Get the user's details by id
 * @method UserController.GetUserByEmail Get the user's details by email
 * @method UserController.GetUserByUsername Get the user's details by username
 * @method UserController.GetAllUsers Get/return all users
 * @method UserController.UpdateUser Update the user's own details
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
      if( password !== passwordConfirm )
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

      // Create an email verification token
      await EmailVerificationModel.create({
        userId                              : newUser._id,
      })

      // Return the new user
      return ResponseHelper.Success( res, req.t('user.created'), StatusCodes.CREATED, UserModel.SerializeUser( newUser ), 'user' )

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
      const user                            = await UserHelper.GetUserById( req, res, UserHelper.GetUserId( req, res ), true )

      // If the user doesn't exist
      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound'), StatusCodes.NOT_FOUND )

      // Return the user
      return ResponseHelper.Success( res, req.t('user.data.found'), StatusCodes.OK, UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method UserController.GetUserById
   * @description The controller method handling getting a user's details by their id
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns 
   */
  static async GetUserById( req, res, next ) {
    try {

      // Retrieve the target user id
      const userId                          = req.params.id

      // If the target user id is not found
      if( !userId )
        throw new CustomErrorHelper( req.t('user.id.notFound'), StatusCodes.NOT_FOUND )

      // Get/find the user in the database by their id
      const user                            = await UserHelper.GetUserById( req, res, userId, true )

      // If the user doesn't exist
      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound'), StatusCodes.NOT_FOUND )

      // Return the user
      return ResponseHelper.Success( res, req.t('user.found'), StatusCodes.OK, UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method UserController.GetUserByEmail
   * @description The controller method handling getting a user's details by their email
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns 
   */
  static async GetUserByEmail( req, res, next ) {
    try {

      // Retrieve the target user email
      const email                           = req.params.email

      // If there is no email parameter
      if( !email )
        throw new CustomErrorHelper( req.t('email.notFound'), StatusCodes.NOT_FOUND )

      // Get/find the user in the database by their email
      const user                            = await UserHelper.GetUserByEmail( req, res, email )

      // If the user doesn't exist
      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound'), StatusCodes.NOT_FOUND )

      // Return the user
      return ResponseHelper.Success( res, req.t('user.found'), StatusCodes.OK, UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method UserController.GetUserByUsername
   * @description The controller method handling getting a user's details by their username
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns 
   */
  static async GetUserByUsername( req, res, next ) {
    try {

      // Retrieve the target user's username
      const username                        = req.params.username

      // If the username from parameter is not found
      if( !username )
        throw new CustomErrorHelper( req.t('username.notFound'), StatusCodes.NOT_FOUND )

      // Get/find the user in the database by their username
      const user                            = await UserHelper.GetUserByUsername( req, res, username )

      // If the user doesn't exist
      if( !user )
        throw new CustomErrorHelper( req.t('user.notFound'), StatusCodes.NOT_FOUND )

      // Return the user
      return ResponseHelper.Success( res, req.t('user.found'), StatusCodes.OK, UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method UserController.GetAllUsers
   * @description The controller method handling returning all users
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns 
   */
  static async GetAllUsers( req, res, next ) {
    try {

      // Get the query to what to sort by
      const sort                            = req.query.sort || '-createdAt'

      // Find all users, sorted
      const users                           = await UserModel.find().sort( sort ).lean()

      // If there are no users
      if( !users.length )
        throw new CustomErrorHelper( req.t('users.notFound'), StatusCodes.NOT_FOUND )

      // Return the users
      return ResponseHelper.Success( res, req.t('users.found'), StatusCodes.OK, users.map( user => UserModel.SerializeUser( user ) ), 'users' )

    } catch ( error ) {
      return next( error )
    }
  }

  /**
   * @method UserController.UpdateUser
   * @description The controller method handling updating _the_ user's own details
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {JSON} Success message, and the user's details
   */
  static async UpdateUser( req, res, next ) {
    try {

      // Destructure the request body
      const {
        email,
        username,
        forename,
        surname,
      }                                     = req.body

      // Get the user, by id
      const user                            = await UserHelper.GetUserById( req, res, UserHelper.GetUserId( req, res ) )

      // If email is set and doesn't match the current email
      if( email && email !== user.email )
        user.email                          = email.toLowerCase()

      // If username is set and doesn't match the current username
      if( username && username !== user.username )
        user.username                       = username

      // If forename is set and doesn't match the current forename
      if( forename && forename !== user.forename )
        user.forename                       = StringHelper.Capitalize( forename )

      // If surname is set and doesn't match the current surname
      if( surname && surname !== user.surname )
        user.surname                        = StringHelper.Capitalize( surname )

      // Save the user
      await user.save()

      // Return the user, and a success message
      return ResponseHelper.Success( res, req.t('user.updated'), StatusCodes.OK, UserModel.SerializeUser( user ), 'user' )

    } catch ( error ) {
      return next( error )
    }
  }
}



export {
  UserController as default,
}
