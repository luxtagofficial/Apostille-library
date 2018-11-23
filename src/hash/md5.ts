import CryptoJS from 'crypto-js';
import * as nemSDK from 'nem-sdk';
import { Account, NetworkType } from 'nem2-sdk';
import { HashFunction } from './HashFunction';

const nem = nemSDK.default;
/**
 * @description - MD5 hash function class
 * @export
 * @class MD5
 * @extends {HashFunction}
 */
export class MD5 extends HashFunction {
  /**
   * Creates an instance of MD5.
   * @memberof MD5
   */
  constructor() {
    super('01', '81');
  }
  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof MD5
   */
  public signedHashing(data: string, signerPrivateKey: string, networkType: NetworkType) {
    if (networkType === NetworkType.MAIN_NET || networkType === NetworkType.TEST_NET) {
      const keyPair = nem.crypto.keyPair.create(signerPrivateKey);
      const CHEKSUM = 'fe4e5459' + this.signed;
      return CHEKSUM +  keyPair.sign(CryptoJS.MD5(data).toString()).toString();
    } else {
      // sha-3 signing
      const signer = Account.createFromPrivateKey(signerPrivateKey, networkType);
      const CHEKSUM = 'fe4e5459' + this.signed;
      return CHEKSUM +  signer.signData(CryptoJS.MD5(data).toString());
    }
  }
  /**
   * @description - creates a hash of the digital file for public apostille
   * @param {string} data - digital file raw data
   * @returns - a hash with a magical byte
   * @memberof MD5
   */
  public nonSignedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + CryptoJS.MD5(data);
  }
}
