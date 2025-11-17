import mongoose from 'mongoose'

import { NODE_ENV } from '../configs/Environment.config.js'
import LoggerMiddleware from '../configs/Logger.config.js'

import ResponseHelper from '../helpers/Response.helper.js'

/**
 * @class ErrorMiddleware
 * @description The global error middleware. Used in app.js -> App.use( ErrorMiddleware.Handler )
 */
class ErrorMiddleware {

  /**
   * @method ErrorMiddleware.Handler
   * @description The global error middleware handler
   * 
   * @param {Object} error 
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   * @returns {Object}
   */
  static Handler( error, req, res, next ) {
    
    // If the error is a mongoose validation error
    if( error instanceof mongoose.Error.ValidationError )
      return ResponseHelper.Error( res, req.t( Object.values( error.errors )[ 0 ].properties.message ), 400 ) // Handle one error at a time

    // If in development mode, console log the error
    if( NODE_ENV === 'development' )
      console.error( error )

    // Return the error
    return ResponseHelper.Error( res, error.message, error.status )
  }
}

export {
  ErrorMiddleware as default,
}
