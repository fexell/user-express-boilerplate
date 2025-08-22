import i18next from 'i18next'
import i18nextBackend from 'i18next-fs-backend'
import i18nextMiddleware from 'i18next-http-middleware'
import path from 'path'

i18next
  .use( i18nextBackend )
  .use( i18nextMiddleware.LanguageDetector )
  .init({
    backend                                 : {
      loadPath                              : path.join( process.cwd(), 'locales', '{{lng}}', '{{ns}}.json' ),
    },
    detection                               : {
      order                                 : [ 'querystring', 'cookie', 'header' ],
      caches                                : [ 'cookie' ],
    },
    fallbackLng                             : 'en',
    preload                                 : [ 'en', 'sv' ],
  })

const i18nMiddleware                        = i18nextMiddleware.handle( i18next )

export {
  i18nMiddleware as default,
}
