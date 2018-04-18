import { HashFunction } from './HashFunction';
export declare class SHA256 extends HashFunction {
    static hash(data: string): string;
    constructor();
    signedHashing(data: string, signerPrivateKey: string): string;
    nonSignedHashing(data: string): string;
}
