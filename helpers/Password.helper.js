import argon2 from 'argon2'

/**
 * @class PasswordHelper
 * @classdesc Contains all methods related to password
 */
class PasswordHelper {

  /**
   * @method PasswordHelper.Hash
   * @description Hashes the password
   * @param {*} password - The password to hash
   * @returns 
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
   * @param {*} hash - The hashed password
   * @param {*} password - The password (unhashed) to verify
   * @returns 
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
