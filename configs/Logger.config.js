import pino from 'pino'
import PinoHttp from 'pino-http'
import winston, { format } from 'winston'
import expressWinston from 'express-winston'

const LoggerMiddleware                      = expressWinston.logger({
  transports                                : [
    new winston.transports.File({
      filename                              : 'logs/app.log',
      level                                 : 'info',
    }),
    new winston.transports.File({
      filename                              : 'logs/error.log',
      level                                 : 'error',
    })
  ],
  msg                                       : 'HTTP {{req.method}} {{req.url}}',
})

export {
  LoggerMiddleware as default,
}
