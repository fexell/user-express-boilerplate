import morgan from 'morgan'

import LogModel from '../models/Log.model.js'

import UserHelper from '../helpers/User.helper.js'

morgan.token( 'ipAddress', ( req ) => UserHelper.GetIpAddress( req ) )
morgan.token( 'userId', ( req ) => UserHelper.GetUserId( req ) || 'unknown' )
morgan.token( 'statusCode', ( req, res ) => res.statusCode || res.status )

const MorganMiddleware                      = morgan( ( tokens, req, res ) => {
  return JSON.stringify({
    method                                  : tokens.method( req, res ),
    url                                     : tokens.url( req, res ),
    statusCode                              : tokens.status( req, res ),
    ipAddress                               : tokens.ipAddress( req, res ),
    userId                                  : tokens.userId( req, res ),
    userAgent                               : tokens['user-agent']( req, res ),
    responseTime                            : Number( tokens['response-time']( req, res ) ),
  })
}, {
  stream                                    : {
    write                                   : async (message) => {
      try {
        const logObject                     = JSON.parse( message )

        await LogModel.create( logObject )
      } catch( error ) {
        console.error('Error logging to database:', error)
      }
    },
  },
} )

export {
  MorganMiddleware as default,
}
