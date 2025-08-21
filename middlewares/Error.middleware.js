import mongoose from 'mongoose'

import ResponseHelper from '../helpers/Response.helper.js'

import { NODE_ENV } from '../configs/Environment.config.js'

/**
 * @class ErrorMiddleware
 * @description The global error middleware. Used in app.js -> App.use( ErrorMiddleware.Handler )
 */
class ErrorMiddleware {
  static Handler( error, req, res, next ) {
    if( error instanceof mongoose.Error.ValidationError )
      return ResponseHelper.Error( res, Object.values( error.errors )[ 0 ].message, 400 )

    if( NODE_ENV === 'development' )
      console.error( error )

    return ResponseHelper.Error( res, error.message, error.status )
  }
}

export {
  ErrorMiddleware as default,
}
