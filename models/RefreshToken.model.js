import mongoose, { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const RefreshTokenSchema                    = new Schema({
  userId                                    : {
    type                                    : Schema.Types.ObjectId,
    required                                : true,
  },
  deviceId                                  : {
    type                                    : String,
    required                                : true,
  },
  salt                                      : {
    type                                    : String,
    required                                : true,
  },
  token                                     : {
    type                                    : String,
    required                                : true,
  },
  ipAddress                                 : {
    type                                    : String,
    required                                : true,
  },
  userAgent                                 : {
    type                                    : String,
    required                                : true,
  },
  expiresAt                                 : {
    type                                    : Date,
    required                                : true,
    expires                                 : 0,
  },
  rotatedAt                                 : {
    type                                    : Date,
    required                                : true,
    default                                 : new Date(),
  },
}, {
  timestamps                                : true,
})

RefreshTokenSchema
  .statics
  .SerializeRefreshToken                    = function( refreshToken ) {
    return {
      id                                    : refreshToken._id,
      ipAddress                             : refreshToken.ipAddress,
      userAgent                             : refreshToken.userAgent,
      createdAt                             : refreshToken.createdAt,
    }
  }

const RefreshTokenModel                     = mongoose.model( 'RefreshToken', RefreshTokenSchema )

export {
  RefreshTokenModel as default
}
