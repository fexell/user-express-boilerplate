import Fingerprint from 'express-fingerprint'

const FingerprintMiddleware                 = Fingerprint({
  parameters                                : [
    Fingerprint.useragent,
    Fingerprint.acceptHeaders,
    Fingerprint.geoip,
  ]
})

export {
  FingerprintMiddleware as default
}
