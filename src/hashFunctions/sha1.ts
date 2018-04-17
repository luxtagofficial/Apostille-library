import CryptoJS from 'crypto-js';
import { HashFunction } from './HashFunction';

export class SHA1 extends HashFunction {
  constructor() {
    super('02', '82');
  }

  public signedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.signed;
    return CHEKSUM + CryptoJS.SHA1(data);
  }
  public nonSignedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + CryptoJS.SHA1(data);
  }
}
