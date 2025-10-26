import cron from 'node-cron'
import crypto from 'crypto'

import EmailVerificationModel from '../models/EmailVerification.model.js'
import UserModel from '../models/User.model.js'

// Run cron job every 5 minutes
cron.schedule( '*/5 * * * *', async () => {
  try {

    // Get the current time
    const now                               = new Date()

    // Find all unverified users
    const unverifiedUsers                   = await UserModel.find( { isEmailVerified : false } )

    // For each unverified user
    for ( const user of unverifiedUsers ) {

      // Get the existing email verification record
      const existingVerification            = await EmailVerificationModel.findOne({ userId : user._id, expiresAt : { $gt : now } })

      // If there is no existing email verification record
      if( !existingVerification ) {

        // Create the email verification token
        const token                         = crypto.randomBytes( 32 ).toString( 'hex' )

        // Create the email verification record
        await EmailVerificationModel.create( {
          userId                            : user._id,
          token                             : token,
        })

        // Log a success message
        console.log( `Email verification token for user ${ user._id } created` )
      }
    }
  } catch ( error ) {
    console.error( `Error in email verification job: ${ error }` )
  }
})