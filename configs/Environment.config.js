import 'dotenv/config'

const {
  NODE_ENV,
  PORT,
  JWT_SECRET,
  JWT_ACCESS_TOKEN_EXPIRATION,
  JWT_REFRESH_TOKEN_EXPIRATION,
  SESSION_SECRET,
  COOKIE_SECRET,
  CSRF_SECRET,
  DEVICE_ID_SECRET,
  MONGO_URI,
}                                           = process.env

const DbString                              = MONGO_URI

export {
  NODE_ENV,
  PORT,
  JWT_SECRET,
  JWT_ACCESS_TOKEN_EXPIRATION,
  JWT_REFRESH_TOKEN_EXPIRATION,
  SESSION_SECRET,
  COOKIE_SECRET,
  CSRF_SECRET,
  DEVICE_ID_SECRET,
  DbString as MONGO_URI,
}
