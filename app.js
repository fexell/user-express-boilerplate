import express from 'express'
import useragent from 'express-useragent'
import fs from 'fs'
import pinoHttp from 'pino-http'

import CorsMiddleware from './configs/Cors.config.js'
import {
  NODE_ENV,
  PORT,
} from './configs/Environment.config.js'
import FingerprintMiddleware from './configs/Fingerprint.config.js'
import i18nMiddleware from './configs/i18n.config.js'
import LoggerMiddleware from './configs/Logger.config.js'
import ConnectToMongoDB from './configs/Mongoose.config.js'
import MorganMiddleware from './configs/Morgan.config.js'
import SecurityMiddlewares, {
  CookieParserMiddleware,
  CsrfProtectionMiddleware,
  LimiterMiddleware,
  SlowDownLimiterMiddleware,
} from './configs/Security.config.js'
import SessionMiddleware from './configs/Session.config.js'

// Initiate express app
const App                                   = express()

// Private- and public keys, for JWT
const PRIVATE_KEY                           = fs.readFileSync( 'jwt.key', 'utf8' )
const PUBLIC_KEY                            = fs.readFileSync( 'jwt.key.pub', 'utf8' )

// Disable for security reasons
App.set( 'trust proxy', 0 )
App.disable( 'x-powered-by' )

// Use all middlewares
App.use( SecurityMiddlewares() )
App.use( i18nMiddleware )
App.use( CorsMiddleware )
App.use( express.json() )
App.use( express.urlencoded({ extended: true }) )
App.use( CookieParserMiddleware )
App.use( LimiterMiddleware )
App.use( SlowDownLimiterMiddleware )
App.use( SessionMiddleware )
App.use( useragent.express() )
App.use( MorganMiddleware )
App.use( FingerprintMiddleware )
App.use( LoggerMiddleware )

// Import routes
import ApiRouter from './routes/Api/Api.route.js'

// Register /api route
App.use( '/api', [ CsrfProtectionMiddleware.csrfSynchronisedProtection ], ApiRouter )

// 404 route if the requested route is not found
App.use( ( req, res, next ) => res.status( 404 ).send( 'Not Found', { url: req.url } ) )

// Global error middleware
import ErrorMiddleware from './middlewares/Error.middleware.js'

// Use the global error middleware handler
App.use( ErrorMiddleware.Handler )

// Start the server
App.listen( PORT, async () => {
  console.log( `Server running in ${ NODE_ENV } mode on port ${ PORT }` )

  // Connect to MongoDB
  await ConnectToMongoDB()
})

export {
  App as default,
  PRIVATE_KEY,
  PUBLIC_KEY,
}
