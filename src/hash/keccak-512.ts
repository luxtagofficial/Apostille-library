import CryptoJS from 'crypto-js';
import * as nemSDK from 'nem-sdk';
import { Account, NetworkType } from 'nem2-sdk';
import { HashFunction } from './HashFunction';

const nem = nemSDK.default;
/**
 * @description - KECCAK-512 hash function class
 * @export
 * @class KECCAK512
 * @extends {HashFunction}
 */
export class KECCAK512 extends HashFunction {
  /**
   * Creates an instance of KECCAK512.
   * @memberof KECCAK512
   */
  constructor() {
    super('89');
  }
  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof KECCAK512
   */
  public signedHashing(data: string, signerPrivateKey: string, networkType: NetworkType) {
    const dataHash = CryptoJS.SHA3(data, { outputLength: 512 }).toString();

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
