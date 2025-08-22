import session from 'express-session'
import MongoStore from 'connect-mongo'

import { NODE_ENV, MONGO_URI, SESSION_SECRET } from './Environment.config.js'

const SessionMiddleware                     = session( {
  secret                                    : SESSION_SECRET,
  resave                                    : true,
  saveUninitialized                         : true,
  store                                     : MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie                                    : {
    secure                                  : NODE_ENV === 'production',
    sameSite                                : 'Strict',
    httpOnly                                : true,
    maxAge                                  : 24 * 60 * 60 * 1000,
  },
} )

export {
  SessionMiddleware as default,
}
