import CryptoJS from 'crypto-js';
import { HashFunction } from './HashFunction';

export class SHA256 extends HashFunction {
  private constructor() {
    super('03', '83');
  }

  public signedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.signed;
    return CHEKSUM + CryptoJS.SHA256(data);
  }
  public nonSignedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + CryptoJS.SHA256(data);
  }
}
