import cron from 'node-cron'
import crypto from 'crypto'

import EmailVerificationModel from '../models/EmailVerification.model.js'
import UserModel from '../models/User.model.js'

cron.schedule( '*/5 * * * *', async () => {
  try {
    const now                               = new Date()
    const unverifiedUsers                   = await UserModel.find( { isEmailVerified : false } )

    for ( const user of unverifiedUsers ) {
      const existingVerification            = await EmailVerificationModel.findOne({ userId : user._id, expiresAt : { $gt : now } })

      if( !existingVerification ) {
        const token                         = crypto.randomBytes( 32 ).toString( 'hex' )

        await EmailVerificationModel.create( {
          userId                            : user._id,
          token                             : token,
          expiresAt                         : new Date( Date.now() + 1000 * 60 * 10 ),
        })

        console.log( `Email verification token for user ${ user._id } created` )
      }
    }
  } catch ( error ) {
    console.error( `Error in email verification job: ${ error }` )
  }
})