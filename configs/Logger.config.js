import winston from 'winston'
import ExpressWinston from 'express-winston'
import Log from 'express-winston-middleware'

const LoggerMiddleware                      = ExpressWinston.logger( {
  level                                     : 'info',
  transports                                : [ new winston.transports.File( { filename: 'logs/app.log' }) ],
  format                                    : winston.format.combine( winston.format.colorize(), winston.format.json() ),
})

export {
  LoggerMiddleware as default,
}
