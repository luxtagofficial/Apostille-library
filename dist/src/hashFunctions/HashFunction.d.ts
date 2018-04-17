export declare abstract class HashFunction {
    readonly nonSigned: string;
    readonly signed: string;
    constructor(nonSigned: string, signed: string);
    abstract signedHashing(data: string): string;
    abstract nonSignedHashing(data: string): string;
}
