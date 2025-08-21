import mongoose from 'mongoose'

import { MONGO_URI } from '../configs/Environment.config.js'

const ConnectToMongoDB                      = async () => {
  try {
    await mongoose.connect( MONGO_URI )

    console.log( 'Connected to MongoDB' )
  } catch ( error ) {
    console.error(`Database connection error: ${ error }`)
  }
}

export {
  ConnectToMongoDB as default,
}
