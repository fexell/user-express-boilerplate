import argon2 from 'argon2'

/**
 * @class PasswordHelper
 * @classdesc Contains all methods related to password
 * 
 * @method PasswordHelper.Hash Hashes the password
 * @method PasswordHelper.Verify Verifies the password
 */
class PasswordHelper {

  /**
   * @method PasswordHelper.Hash
   * @description Hashes the password
   * @param {String} password The password to hash
   * @returns {String} The hashed password
   */
  static async Hash( password ) {
    try {
      return await argon2.hash( password )
    } catch ( error ) {
      throw error
    }
  }

  /**
   * @method PasswordHelper.Verify
   * @description Verifies the password
   * @param {String} hash The hashed password
   * @param {String} password The password (unhashed) to verify
   * @returns {Boolean} Whether the password is valid or not
   */
  static async Verify( hash, password ) {
    try {
      return await argon2.verify( hash, password )
    } catch ( error ) {
      throw error
    }
  }
}

export {
  PasswordHelper as default,
}
