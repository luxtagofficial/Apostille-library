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
    super('09', '89');
  }
  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof KECCAK512
   */
  public signedHashing(data: string, signerPrivateKey: string, networkType: NetworkType) {
    if (networkType === NetworkType.MAIN_NET || networkType === NetworkType.TEST_NET) {
      const keyPair = nem.crypto.keyPair.create(signerPrivateKey);
      const CHEKSUM = 'fe4e5459' + this.signed;
      return CHEKSUM +  keyPair.sign(CryptoJS.SHA3(data, { outputLength: 512 }).toString()).toString();
    } else {
      // sha-3 signing
      const signer = Account.createFromPrivateKey(signerPrivateKey, networkType);
      const CHEKSUM = 'fe4e5459' + this.signed;
      return CHEKSUM +  signer.signData(CryptoJS.SHA3(data, { outputLength: 512 }).toString());
    }
  }
  /**
   * @description - creates a hash of the digital file for public apostille
   * @param {string} data - digital file raw data
   * @returns - a hash with a magical byte
   * @memberof KECCAK512
   */
  public nonSignedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + CryptoJS.SHA3(data, { outputLength: 512 });
  }
}
