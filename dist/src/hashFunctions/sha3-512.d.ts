import { HashFunction } from './HashFunction';
export declare class SHA3512 extends HashFunction {
    constructor();
    signedHashing(data: string, signerPrivateKey: string): string;
    nonSignedHashing(data: string): string;
}
