import crypto from 'crypto'
import mongoose, { Schema } from 'mongoose'

const EmailVerificationSchema               = new Schema({
  userId                                    : {
    type                                    : Schema.Types.ObjectId,
    required                                : true,
  },
  token                                     : {
    type                                    : String,
    required                                : true,
    default                                 : crypto.randomBytes( 32 ).toString( 'hex' ),
  },
  expiresAt                                 : {
    type                                    : Date,
    required                                : true,
    expires                                 : 0,
    default                                 : () => new Date( Date.now() + 1000 * 60 * 10 ),
  },
}, {
  timestamps                                : true,
})

const EmailVerificationModel                = mongoose.model( 'EmailVerification', EmailVerificationSchema )

export {
  EmailVerificationModel as default
}
