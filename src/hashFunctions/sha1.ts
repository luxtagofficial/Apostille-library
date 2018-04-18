import CryptoJS from 'crypto-js';
import * as nemSDK from 'nem-sdk';
import { HashFunction } from './HashFunction';

const nem = nemSDK.default;

export class SHA1 extends HashFunction {
  constructor() {
    super('02', '82');
  }

  public signedHashing(data: string, signerPrivateKey: string) {
    const keyPair = nem.crypto.keyPair.create(signerPrivateKey);
    const CHEKSUM = 'fe4e5459' + this.signed;
    return CHEKSUM + keyPair.sign(CryptoJS.SHA1(data).toString()).toString();
  }
  public nonSignedHashing(data: string) {
    const CHEKSUM = 'fe4e5459' + this.nonSigned;
    return CHEKSUM + CryptoJS.SHA1(data);
  }
}
