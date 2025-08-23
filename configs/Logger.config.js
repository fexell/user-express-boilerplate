import pino from 'pino'

const Logger                                = pino({
  level                                     : 'info',
  transport                                 : {
    target                                  : 'pino-pretty',
    options                                 : {
      colorize                              : true
    },
  },
})

export {
  Logger as default
}
