import cron from 'node-cron'
import crypto from 'crypto'

import EmailVerificationModel from '../models/EmailVerification.model.js'
import UserModel from '../models/User.model.js'

// Run cron job every 5 minutes
cron.schedule( '*/5 * * * *', async () => {
  try {

    // Get the current time
    const now                               = new Date()

    const threshold                         = new Date( Date.now() + 1000 * 60 * 2 )

    // Find all unverified users
    const unverifiedUsers                   = await UserModel.find( { isEmailVerified : false } )

    // For each unverified user
    for( const user of unverifiedUsers ) {
      const existing                        = await EmailVerificationModel.findOne( { userId : user._id } )

      if( !existing || existing.expiresAt <= threshold ) {
        const token                         = crypto.randomBytes( 32 ).toString( 'hex' )

        if( existing )
          await EmailVerificationModel.deleteOne({ _id : existing._id })

        await EmailVerificationModel.create({
          userId                            : user._id,
          token                             : token,
        })

        console.log( `Refreshed email verification token for user ${ user.email }` )
      }
    }
  } catch ( error ) {
    console.error( `Error in email verification job: ${ error }` )
  }
})