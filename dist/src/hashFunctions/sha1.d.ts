import { HashFunction } from './HashFunction';
export declare class SHA1 extends HashFunction {
    constructor();
    signedHashing(data: string): string;
    nonSignedHashing(data: string): string;
}
