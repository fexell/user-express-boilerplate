

class RegexHelper {
  static Escape( str ) {
    return str.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' )
  }
}

export {
  RegexHelper as default
}
