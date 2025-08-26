import crypto from 'crypto'
import mongoose, { Schema } from 'mongoose'
import { t } from 'i18next'

import ErrorHelper from '../helpers/Error.helper.js'
import PasswordHelper from '../helpers/Password.helper.js'
import StringHelper from '../helpers/String.helper.js'

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
    match                                   : [ /^[a-zA-Z0-9]+$/, t('username.invalid') ],
    validate                                : {
      validator                             : async function( value ) {
        const usernameRegex                 = new RegExp( /^[a-zA-Z0-9]+$/, 'i' )
        const user                          = await this.constructor.findOne({
          username                          : {
            $regex                          : usernameRegex,
          },
        })

        if(this.isNew && user)
          throw new ErrorHelper( t('username.taken') )

        else if(!this.isNew && !usernameRegex.test(this.username))
          throw new ErrorHelper( t('username.taken') )

        return true
      }
    }
  },
  forename                                  : {
    type                                    : String,
    required                                : [ true, t('forename.required') ],
    trim                                    : true,
    minlength                               : [ 3, t('forename.minlength') ],
    match                                   : [ /^[a-zA-Z]+$/, t('forename.invalid') ],
  },
  surname                                   : {
    type                                    : String,
    required                                : [ true, t('surname.required') ],
    trim                                    : true,
    minlength                               : [ 3, t('surname.minlength') ],
    match                                   : [ /^[a-zA-Z]+$/, t('surname.invalid') ],
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
  emailVerificationToken                    : {
    type                                    : String,
    default                                 : crypto.randomBytes( 32 ).toString( 'hex' ),
  }
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
      this.emailVerificationToken           = crypto.randomBytes( 32 ).toString( 'hex' )
    }
  }

  if(this.isNew || this.isModified('forename'))
    this.forename                           = StringHelper.Capitalize( this.forename.trim() )

  if(this.isNew || this.isModified('surname'))
    this.surname                            = StringHelper.Capitalize( this.surname.trim() )

  if(this.isNew || this.isModified('password'))
    this.password                           = await PasswordHelper.Hash( this.password )

  if(this.modifiedPaths().length === 0)
    return next(new ErrorHelper( t('user.noChanges'), 400 ))

  return next()
})

const UserModel                             = mongoose.model( 'User', UserSchema )

export {
  UserModel as default,
}
