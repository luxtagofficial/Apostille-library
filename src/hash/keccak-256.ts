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
    super('08', '88');
  }
  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof KECCAK256
   */
  public signedHashing(data: string, signerPrivateKey: string, networkType: NetworkType): string {
    // nem2-sdk doesn't support keccak signing yet
    if (networkType === NetworkType.MAIN_NET || networkType === NetworkType.TEST_NET) {
      const keyPair = nem.crypto.keyPair.create(signerPrivateKey);
      const CHEKSUM = 'fe4e5459' + this.signed;
      return CHEKSUM +  keyPair.sign(CryptoJS.SHA3(data, { outputLength: 256 }).toString()).toString();
    } else {
      // sha-3 signing
      const signer = Account.createFromPrivateKey(signerPrivateKey, networkType);
      const CHEKSUM = 'fe4e5459' + this.signed;
      return CHEKSUM +  signer.signData(CryptoJS.SHA3(data, { outputLength: 256 }).toString());
    }
  }
  /**
   * @description - creates a hash of the digital file for public apostille
   * @param {string} data - digital file raw data
   * @returns - a hash with a magical byte
   * @memberof KECCAK256
   */
  public nonSignedHashing(data: string): string {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + CryptoJS.SHA3(data, { outputLength: 256 });
  }
}
