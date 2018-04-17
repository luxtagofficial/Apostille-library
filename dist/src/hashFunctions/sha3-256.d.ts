import { HashFunction } from './HashFunction';
export declare class SHA3256 extends HashFunction {
    constructor();
    signedHashing(data: string): string;
    nonSignedHashing(data: string): string;
}
