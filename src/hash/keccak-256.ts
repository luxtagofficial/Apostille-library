import CryptoJS from 'crypto-js';
import * as nemSDK from 'nem-sdk';
import { Account, NetworkType } from 'nem2-sdk';
import { HashFunction } from './HashFunction';

const nem = nemSDK.default;
/**
 * @description - KECCAK-256 hash function class
 * @export
 * @class KECCAK256
 * @extends {HashFunction}
 */
export class KECCAK256 extends HashFunction {
  /**
   * Creates an instance of KECCAK256.
   * @memberof KECCAK256
   */
  constructor() {
    super('88');
  }
  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof KECCAK256
   */
  public signedHashing(data: string, signerPrivateKey: string, networkType: NetworkType): string {
    const dataHash = CryptoJS.SHA3(data, { outputLength: 256 }).toString();

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
