import mongoose, { Schema } from 'mongoose'

const LogSchema                             = new Schema({
  message                                   : {
    type                                    : String,
  },
  method                                    : {
    type                                    : String,
  },
  url                                       : {
    type                                    : String,
  },
  statusCode                                : {
    type                                    : Number,
  },
  ipAddress                                 : {
    type                                    : String,
  },
  userId                                    : {
    type                                    : String,
    default                                 : 'unknown',
  },
  userAgent                                 : {
    type                                    : String,
  },
  responseTime                              : {
    type                                    : Number,
  },
}, {
  timestamps                                : true,
})

const LogModel                              = mongoose.model( 'Log', LogSchema )

export {
  LogModel as default,
}
