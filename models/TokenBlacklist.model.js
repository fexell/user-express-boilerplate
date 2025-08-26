import mongoose, { Schema } from 'mongoose'

const TokenBlacklistSchema                  = new Schema({
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

const TokenBlacklistModel                   = mongoose.model( 'BlacklistToken', TokenBlacklistSchema )

export {
  TokenBlacklistModel as default,
}
