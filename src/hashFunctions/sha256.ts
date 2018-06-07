import CryptoJS from 'crypto-js';
import * as nemSDK from 'nem-sdk';
import { HashFunction } from './HashFunction';

const nem = nemSDK.default;
/**
 * @description - SHA256 hash function class
 * @export
 * @class SHA256
 * @extends {HashFunction}
 */
export class SHA256 extends HashFunction {
  /**
   * @description - return a simple sha256 hash
   * @static
   * @param {string} data - raw data to hash
   * @returns- sha256 hash
   * @memberof SHA256
   */
  public static hash(data: string) {
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  }
  /**
   * Creates an instance of SHA256.
   * @memberof SHA256
   */
  constructor() {
    super('03', '83');
  }
  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof SHA256
   */
  public signedHashing(data: string, signerPrivateKey: string) {
    const keyPair = nem.crypto.keyPair.create(signerPrivateKey);
    const CHEKSUM = 'fe4e5459' + this.signed;
    return CHEKSUM + keyPair.sign(CryptoJS.SHA256(data).toString()).toString();
  }
  /**
   * @description - creates a hash of the digital file for public apostille
   * @param {string} data - digital file raw data
   * @returns - a hash with a magical byte
   * @memberof SHA256
   */
  public nonSignedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + CryptoJS.SHA256(data);
  }
}
