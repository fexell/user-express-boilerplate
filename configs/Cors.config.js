import cors from 'cors'

const CorsOptions                           = {
  origin                                    : [ 'http://localhost:3000' ],
  credentials                               : true,
}

const CorsMiddleware                        = cors( CorsOptions )

export {
  CorsMiddleware as default,
}
