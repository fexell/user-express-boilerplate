import { Router } from 'express'

import { CsrfProtectionMiddleware } from '../../../configs/Security.config.js'

import ResponseHelper from '../../../helpers/Response.helper.js'

const CsrfRouter                            = Router()

CsrfRouter.get('/', async ( req, res, next ) => {
  try {
    return ResponseHelper.Success( res, 'CSRF token generated', 200, CsrfProtectionMiddleware.generateToken( req ), 'token' )
  } catch ( error ) {
    return next( error )
  }
})

export {
  CsrfRouter as default,
}
