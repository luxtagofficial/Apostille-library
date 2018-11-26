import { Address, Deadline, PlainMessage, TransferTransaction, XEM } from 'nem2-sdk';
import { HashFunction } from '../../hash/HashFunction';

/**
 * @description - public apostille class
 * @class PublicApostille
 */
class PublicApostille {

  /**
   * @description - the hash uncluding the magical byte of this public apostille
   * @private
   * @memberof PublicApostille
   */
  private hash;

  /**
   * Creates an instance of PublicApostille.
   * @param {string} fileName - the digital file name
   * @param {NetworkType} networkType - network type
   * @param {string} [sinkAddress] - the sink address to use
   * @memberof PublicApostille
   */
  constructor(
    public readonly fileName: string,
    public readonly sinkAddress: Address,
  ) {
  }

  /**
   * @description - update the file content to be notarised on the blockchain
   * @param {string} fileContent - the content of the file
   * @param {HashFunction} hashFunction - hash function to use
   * @memberof PublicApostille
   */
  public update(fileContent: string, hashFunction: HashFunction): TransferTransaction {
    this.hash = hashFunction.nonSignedHashing(fileContent);
    const creationTransaction = TransferTransaction.create(
      Deadline.create(),
      this.sinkAddress,
      [XEM.createRelative(0)],
      PlainMessage.create(this.hash),
      this.sinkAddress.networkType,
    );
    return creationTransaction;
  }

  get apostilleHash(): string {
    return this.hash;
  }

}

export { PublicApostille };
