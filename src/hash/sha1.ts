import CryptoJS from 'crypto-js';
import * as nemSDK from 'nem-sdk';
import { Account, NetworkType } from 'nem2-sdk';
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
    super('82');
  }
  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof SHA1
   */
  public signedHashing(data: string, signerPrivateKey: string, networkType: NetworkType) {
    const dataHash = CryptoJS.SHA1(data).toString();

    if (networkType === NetworkType.MAIN_NET || networkType === NetworkType.TEST_NET) {
      const keyPair = nem.crypto.keyPair.create(signerPrivateKey);
      return this.checksum +  keyPair.sign(dataHash).toString();
    } else {
      const signer = Account.createFromPrivateKey(signerPrivateKey, networkType);
      return this.checksum +  signer.signData(dataHash);
    }
  }
}
