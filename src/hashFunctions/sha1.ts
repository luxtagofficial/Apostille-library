import CryptoJS from 'crypto-js';
import * as nemSDK from 'nem-sdk';
import { HashFunction } from './HashFunction';

const nem = nemSDK.default;
/**
 * @description - SHA1 hash function class
 * @export
 * @class SHA1
 * @extends {HashFunction}
 */
export class SHA1 extends HashFunction {
  /**
   * Creates an instance of SHA1.
   * @memberof SHA1
   */
  constructor() {
    super('02', '82');
  }
  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof SHA1
   */
  public signedHashing(data: string, signerPrivateKey: string) {
    const keyPair = nem.crypto.keyPair.create(signerPrivateKey);
    const CHEKSUM = 'fe4e5459' + this.signed;
    return CHEKSUM + keyPair.sign(CryptoJS.SHA1(data).toString()).toString();
  }
  /**
   * @description - creates a hash of the digital file for public apostille
   * @param {string} data - digital file raw data
   * @returns - a hash with a magical byte
   * @memberof SHA1
   */
  public nonSignedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + CryptoJS.SHA1(data);
  }
}
