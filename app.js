import express from 'express'
import useragent from 'express-useragent'
import fs from 'fs'

import CorsMiddleware from './configs/Cors.config.js'
import {
  NODE_ENV,
  PORT,
} from './configs/Environment.config.js'
import i18nMiddleware from './configs/i18n.config.js'
import ConnectToMongoDB from './configs/Mongoose.config.js'
import SecurityMiddlewares, {
  CookieParserMiddleware,
  CsrfProtectionMiddleware,
  LimiterMiddleware,
  SlowDownLimiterMiddleware,
} from './configs/Security.config.js'
import SessionMiddleware from './configs/Session.config.js'

const App                                   = express()

const PRIVATE_KEY                           = fs.readFileSync( 'jwt.key', 'utf8' )
const PUBLIC_KEY                            = fs.readFileSync( 'jwt.key.pub', 'utf8' )

App.set( 'trust proxy', 0 )
App.disable( 'x-powered-by' )

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

import ApiRouter from './routes/Api/Api.route.js'

App.use( '/api', [ CsrfProtectionMiddleware.csrfSynchronisedProtection ], ApiRouter )
App.use( ( req, res, next ) => res.status( 404 ).send( 'Not Found', { url: req.url } ) )

import ErrorMiddleware from './middlewares/Error.middleware.js'

App.use( ErrorMiddleware.Handler )

App.listen( PORT, async () => {
  console.log( `Server running in ${ NODE_ENV } mode on port ${ PORT }` )

  await ConnectToMongoDB()
})

export {
  App as default,
  PRIVATE_KEY,
  PUBLIC_KEY,
}
