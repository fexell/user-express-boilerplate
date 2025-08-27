import mongoose, { Schema } from 'mongoose'

const TokenBlacklistSchema                  = new Schema({
  deviceId                                  : {
    type                                    : String,
    required                                : true,
  },
  token                                     : {
    type                                    : String,
    required                                : true,
  },
  revokedAt                                 : {
    type                                    : Date,
    default                                 : Date.now,
  },
  expireAt                                  : {
    type                                    : Date,
  },
}, {
  timestamps                                : true,
})

const TokenBlacklistModel                   = mongoose.model( 'TokenBlacklist', TokenBlacklistSchema )

export {
  TokenBlacklistModel as default,
}
