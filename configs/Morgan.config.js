import morgan from 'morgan'

import LogModel from '../models/Log.model.js'

import UserHelper from '../helpers/User.helper.js'

morgan.token( 'ipAddress', ( req ) => UserHelper.GetIpAddress( req ) )
morgan.token( 'userId', ( req ) => UserHelper.GetUserId( req ) || 'unknown' )
morgan.token( 'statusCode', ( req, res ) => res.statusCode || res.status )

const MorganMiddleware                      = morgan( ':method :url :statusCode :ipAddress :userId :user-agent :response-time', {
  stream                                    : {
    write                                   : async (message) => {
      const log                             = message.trim().split( ' ' )

      const logObject                       = {
        method                              : log[ 0 ],
        url                                 : log[ 1 ],
        statusCode                          : Number( log[ 2 ] ),
        ipAddress                           : log[ 3 ],
        userId                              : log[ 4 ],
        userAgent                           : log[ 5 ],
        responseTime                        : Number( log[ 6 ] ),
      }

      await LogModel.create(logObject)
    },
  },
} )

export {
  MorganMiddleware as default,
}
