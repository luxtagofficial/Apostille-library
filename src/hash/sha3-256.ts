import { sha3_256 } from 'js-sha3';
import { Account, NetworkType } from 'nem2-sdk';
import { Errors } from './../types/Errors';
import { HashFunction } from './HashFunction';

/**
 * @description - SHA3_256 hash function class
 * @export
 * @class SHA3_256
 * @extends {HashFunction}
 */
// tslint:disable-next-line:class-name
export class SHA3_256 extends HashFunction {
  /**
   * Creates an instance of SHA3_256.
   * @memberof SHA3_256
   */
  constructor() {
    super('90');
  }

  /**
   * @description - creates a signed hash for private apostille
   * @param {string} data - raw data
   * @param {string} signerPrivateKey - signer private key
   * @returns - a signed hash with a magical byte
   * @memberof SHA3_256
   */
  public signedHashing(data: string, signerPrivateKey: string, networkType: NetworkType): string {
    const dataHash = sha3_256(data);

    if (networkType === NetworkType.MAIN_NET || networkType === NetworkType.TEST_NET) {
      throw Errors[Errors.NETWORK_TYPE_NOT_SUPPORTED];
    } else {
      const signer = Account.createFromPrivateKey(signerPrivateKey, networkType);
      return this.checksum +  signer.signData(dataHash);
    }
  }
}
