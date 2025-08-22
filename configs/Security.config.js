import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import { slowDown } from 'express-slow-down'
import { xss } from 'express-xss-sanitizer'
import helmet from 'helmet'
import hpp from 'hpp'
import { csrfSync } from 'csrf-sync'

import { NODE_ENV, COOKIE_SECRET } from '../configs/Environment.config.js'

import TimeHelper from '../helpers/Time.helper.js'

const CookieParserMiddleware                = cookieParser( COOKIE_SECRET, { secure: NODE_ENV === 'production' } )

const SecurityMiddlewares                   = () => [
  helmet(),
  hpp(),
  xss(),
]

const CsrfProtectionMiddleware              = csrfSync()

const LimiterMiddleware                     = rateLimit( {
  windowMs                                  : TimeHelper.FifteenMinutes,
  max                                       : 100,
  standardHeaders                           : 'draft-8',
  legacyHeaders                             : false,
} )

const SlowDownLimiterMiddleware             = slowDown( {
  windowMs                                  : TimeHelper.FifteenMinutes,
  delayAfter                                : 100,
  delayMs                                   : ( hits ) => hits * 500,
} )

export {
  CookieParserMiddleware,
  SecurityMiddlewares as default,
  CsrfProtectionMiddleware,
  LimiterMiddleware,
  SlowDownLimiterMiddleware,
}
