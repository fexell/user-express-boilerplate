import crypto from 'crypto'
import mongoose, { Schema } from 'mongoose'
import { t } from 'i18next'

import EmailVerificationModel from './EmailVerification.model.js'

import CustomErrorHelper from '../helpers/Error.helper.js'
import PasswordHelper from '../helpers/Password.helper.js'
import StringHelper from '../helpers/String.helper.js'
import StatusCodes from '../helpers/StatusCodes.helper.js'

const UserSchema                            = new Schema({
  email                                     : {
    type                                    : String,
    required                                : [ true, t('email.required') ],
    unique                                  : [ true, t('email.taken') ],
    trim                                    : true,
    lowercase                               : true,
  },
  username                                  : {
    type                                    : String,
    required                                : [ true, t('username.required') ],
    unique                                  : [ true, t('username.taken') ],
    trim                                    : true,
    minlength                               : [ 3, t('username.minlength') ],
    maxlength                               : [ 20, t('username.maxlength') ],
    match                                   : [ /^[a-zåäö0-9_]+$/i, t('username.invalid') ],
    validate                                : {
      validator                             : async function( value ) {

        // Escape regex
        const escapeRegex                   = ( str ) => str.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' )

        // Reject if username has leading/trailing spaces
        if( value !== value.trim() )
          throw new CustomErrorHelper( t('username.invalidSpaces') )

        // If the user is trying to create a new user
        if( this.isNew ) {

          // Find a user with the same username
          const user                        = await this.constructor.findOne({
            username                        : {
              $regex                        : new RegExp( `^(${ escapeRegex( value ) })$`, 'i' ),
            },
          })

          // If the user already exists, throw an error that the username is taken
          if( user )
            throw new CustomErrorHelper( t('username.taken'), StatusCodes.CONFLICT, 'username' )

        // Else if the user is trying to update their username
        } else if( this.isModified( 'username' ) ) {

          // Find the current user
          const currentUser                 = await this.constructor.findById( this._id ).lean()

          // If the username is different from the current username (not a different variation), throw an error
          if( currentUser && currentUser.username.toLowerCase() !== value.toLowerCase() )
            throw new CustomErrorHelper( t('username.variation'), StatusCodes.CONFLICT, 'username' )
        }

        // If the username is not taken, or the username is the same as the current username (a different variation), return true
        return true
      }
    }
  },
  forename                                  : {
    type                                    : String,
    required                                : [ true, t('forename.required') ],
    trim                                    : true,
    minlength                               : [ 3, t('forename.minlength') ],
    match                                   : [ /^[a-zA-Zåäö]+$/i, t('forename.invalid') ],
  },
  surname                                   : {
    type                                    : String,
    required                                : [ true, t('surname.required') ],
    trim                                    : true,
    minlength                               : [ 3, t('surname.minlength') ],
    match                                   : [ /^[a-zA-Zåäö]+$/i, t('surname.invalid') ],
  },
  password                                  : {
    type                                    : String,
    required                                : [ true, t('password.required') ],
    minlength                               : [ 6, t('password.minlength') ],
    maxlength                               : [ 64, t('password.maxlength') ],
    select                                  : false,
  },
  role                                      : {
    type                                    : String,
    enum                                    : [ 'user', 'moderator', 'admin' ],
    default                                 : 'user',
  },
  isActive                                  : {
    type                                    : Boolean,
    default                                 : true,
  },
  isEmailVerified                           : {
    type                                    : Boolean,
    default                                 : false,
  },
  /* emailVerificationToken                    : {
    type                                    : String,
    default                                 : crypto.randomBytes( 32 ).toString( 'hex' ),
  } */
}, {
  timestamps                                : true,
})

UserSchema.statics.SerializeUser           = function( user ) {
  return {
    id                                      : user._id,
    email                                   : user.email,
    username                                : user.username,
    forename                                : user.forename,
    surname                                 : user.surname,
    role                                    : user.role,
  }
}

UserSchema.pre('save', async function( next ) {
  if(this.isNew || this.isModified('email')) {
    this.email                              = this.email.toLowerCase().trim()

    if(this.isModified('email')) {
      this.isEmailVerified                  = false
    }
  }

  if(this.isNew || this.isModified('forename'))
    this.forename                           = StringHelper.Capitalize( this.forename.trim() )

  if(this.isNew || this.isModified('surname'))
    this.surname                            = StringHelper.Capitalize( this.surname.trim() )

  if(this.isNew || this.isModified('password'))
    this.password                           = await PasswordHelper.Hash( this.password )

  if(this.modifiedPaths().length === 0)
    return next(new CustomErrorHelper( t('user.noChanges'), 400 ))

  return next()
})

const UserModel                             = mongoose.model( 'User', UserSchema )

export {
  UserModel as default,
}
