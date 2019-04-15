import { sha3_512 } from 'js-sha3';
import * as nemSDK from 'nem-sdk';
import { Account, NetworkType } from 'nem2-sdk';
import { HashFunction } from './HashFunction';

const nem = nemSDK.default;
/**
 * @description - SHA3_512 hash function class
 * @export
 * @class SHA3_512
 * @extends {HashFunction}
 */
// tslint:disable-next-line:class-name
export class SHA3_512 extends HashFunction {
  /**
   * Creates an instance of SHA3_512.
   * @memberof SHA3_512
   */
  constructor() {
    super('11', '91');
  }

  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof SHA3_512
   */
  public signedHashing(data: string, signerPrivateKey: string, networkType: NetworkType) {
    if (networkType === NetworkType.MAIN_NET || networkType === NetworkType.TEST_NET) {
      const keyPair = nem.crypto.keyPair.create(signerPrivateKey);
      const CHEKSUM = 'fe4e5459' + this.signed;
      return CHEKSUM +  keyPair.sign(sha3_512(data)).toString();
    } else {
      // sha-3 signing
      const signer = Account.createFromPrivateKey(signerPrivateKey, networkType);
      const CHEKSUM = 'fe4e5459' + this.signed;
      return CHEKSUM +  signer.signData(sha3_512(data));
    }
  }

  /**
   * @description - creates a hash of the digital file for public apostille
   * @param {string} data - digital file raw data
   * @returns - a hash with a magical byte
   * @memberof SHA3_512
   */
  public nonSignedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + sha3_512(data);
  }
}
