import CryptoJS from 'crypto-js';
import { HashFunction } from './HashFunction';

export class SHA3256 extends HashFunction {
  constructor() {
    super('08', '88');
  }

  public signedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.signed;
    return CHEKSUM + CryptoJS.SHA3(data, undefined, { outputLength: 256 });
  }
  public nonSignedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + CryptoJS.SHA3(data, undefined, { outputLength: 256 });
  }
}
