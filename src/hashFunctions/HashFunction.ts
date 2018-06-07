/**
 * Hashes functions interface
 *
 * @export
 * @abstract
 * @class HashFunction
 */
export abstract class HashFunction {
  public readonly nonSigned: string;
  public readonly signed: string;
  /**
   * Creates an instance of HashFunction.
   * @param {string} nonSigned - the none signed hex value
   * @param {string} signed - signed hex value
   * @memberof HashFunction
   */
  public constructor(nonSigned: string, signed: string) {
      this.nonSigned = nonSigned;
      this.signed = signed;
  }
  /**
   * hashes data and adds a magical byte for public apostille
   *
   * @abstract
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns {string} - signed hash
   * @memberof HashFunction
   */
  public abstract signedHashing(data: string, signerPrivateKey: string): string;
  /**
   * hashes data and adds a magical byte for private apostille
   *
   * @abstract
   * @param {string} data
   * @returns {string}
   * @memberof HashFunction
   */
  public abstract nonSignedHashing(data: string): string;
}
