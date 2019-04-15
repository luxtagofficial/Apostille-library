import CryptoJS from 'crypto-js';
import * as nemSDK from 'nem-sdk';
import { Account, NetworkType } from 'nem2-sdk';
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
    super('83');
  }
  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof SHA256
   */
  public signedHashing(data: string, signerPrivateKey: string, networkType: NetworkType) {
    const dataHash = CryptoJS.SHA256(data).toString();

    if (networkType === NetworkType.MAIN_NET || networkType === NetworkType.TEST_NET) {
      const keyPair = nem.crypto.keyPair.create(signerPrivateKey);
      return this.checksum +  keyPair.sign(dataHash).toString();
    } else {
      // sha-3 signing
      const signer = Account.createFromPrivateKey(signerPrivateKey, networkType);
      return this.checksum +  signer.signData(dataHash);
    }
  }
}
