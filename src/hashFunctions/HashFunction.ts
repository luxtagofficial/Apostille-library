export abstract class HashFunction {
  public readonly nonSigned: string;
  public readonly signed: string;

  public constructor(nonSigned: string, signed: string) {
    this.nonSigned = nonSigned;
    this.signed = signed;
  }

  public abstract signedHashing(data: string): string;
  public abstract nonSignedHashing(data: string): string;
}
