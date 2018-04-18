import { HashFunction } from './HashFunction';
export declare class MD5 extends HashFunction {
    constructor();
    signedHashing(data: string, signerPrivateKey: string): string;
    nonSignedHashing(data: string): string;
}
