import CryptoJS from 'crypto-js';
import { HashFunction } from './HashFunction';

export class MD5 extends HashFunction {
  constructor() {
    super('01', '81');
  }

  public signedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.signed;
    return CHEKSUM + CryptoJS.MD5(data);
  }
  public nonSignedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + CryptoJS.MD5(data);
  }
}
