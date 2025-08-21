import mongoose, { Schema } from 'mongoose'

const RefreshTokenSchema                    = new Schema({
  userId                                    : {
    type                                    : Schema.Types.ObjectId,
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
  isRevoked                                 : {
    type                                    : Boolean,
    default                                 : false,
  }
}, {
  timestamps                                : true,
})

RefreshTokenSchema
  .statics
  .SerializeRefreshToken                    = function( refreshToken ) {
    return {
      id                                    : refreshToken._id,
      userId                                : refreshToken.userId,
      ipAddress                             : refreshToken.ipAddress,
      userAgent                             : refreshToken.userAgent,
    }
  }

const RefreshTokenModel                     = mongoose.model( 'RefreshToken', RefreshTokenSchema )

export {
  RefreshTokenModel as default
}
