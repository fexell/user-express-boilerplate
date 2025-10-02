import mongoose, { Schema } from 'mongoose'

const TokenBlacklistSchema                  = new Schema({
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
  reason                                    : {
    type                                    : String,
    required                                : true,
    default                                 : 'unknown',
  },
  revokedAt                                 : {
    type                                    : Date,
    default                                 : Date.now,
  },
  expiresAt                                 : {
    type                                    : Date,
    expires                                 : 0,
  },
  graceUntil                                : {
    type                                    : Date,
    required                                : true,
    default                                 : () => new Date( Date.now() + 60 * 1000 ),
  },
  meta                                      : {
    type                                    : Object || JSON,
  },
}, {
  timestamps                                : true,
})

const TokenBlacklistModel                   = mongoose.model( 'TokenBlacklist', TokenBlacklistSchema )

export {
  TokenBlacklistModel as default,
}
