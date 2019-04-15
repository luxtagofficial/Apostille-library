import { NetworkType } from 'nem2-sdk';

/**
 * Hashes functions interface
 *
 * @export
 * @abstract
 * @class HashFunction
 */
export abstract class HashFunction {
  public readonly signed: string;
  /**
   *
   * Returns apostille magic header
   * @readonly
   * @memberof HashFunction
   */
  get checksum() {
    return 'fe4e5459' + this.signed;
  }

  /**
   * Creates an instance of HashFunction.
   * @param {string} nonSigned - the none signed hex value
   * @param {string} signed - signed hex value
   * @memberof HashFunction
   */
  public constructor(signed: string) {
      this.signed = signed;
  }

  /**
   * hashes data and adds a magical byte for apostille
   *
   * @abstract
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns {string} - signed hash
   * @memberof HashFunction
   */
  public abstract signedHashing(data: string, signerPrivateKey: string, networkType: NetworkType): string;

}
