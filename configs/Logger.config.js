import pino from 'pino'
import PinoHttp from 'pino-http'

const LoggerMiddleware                      = pino({
  level                                     : 'info',
  transport                                 : {
    targets                                 : [
      {
        target                              : 'pino/file',
        options                             : { destination: 'logs/app.log' },
        level                               : 'info',
      },
      {
        target                              : 'pino/file',
        options                             : { destination: 'logs/error.log' },
        level                               : 'error',
      },
    ],
  },
})

const HttpLoggerMiddleware                  = PinoHttp({ logger: LoggerMiddleware })

export {
  LoggerMiddleware as default,
  HttpLoggerMiddleware,
}
