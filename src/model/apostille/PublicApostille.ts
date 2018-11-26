import { Address, Deadline, NetworkType, PlainMessage, TransferTransaction, XEM } from 'nem2-sdk';
import { HashFunction } from '../../hash/HashFunction';
import { Sinks } from '../repository/Sinks';
import { Initiator } from '../transaction/Initiator';

// TODO: add tx hash of the update
/**
 * @description - public apostille class
 * @class PublicApostille
 */
class PublicApostille {
  /**
   * @description - whether the apostille was announced to the network
   * @type {boolean}
   * @memberof PublicApostille
   */
  public announced: boolean = false;

  /**
   * @description - the sink address this public apostille is using
   * @private
   * @type {Address}
   * @memberof PublicApostille
   */
  private address: Address;

  /**
   * @description - the network type the public apostille
   * @private
   * @memberof PublicApostille
   */
  private networkType: NetworkType;

  /**
   * @description - the hash uncluding the magical byte of this public apostille
   * @private
   * @memberof PublicApostille
   */
  private hash;

  /**
   * @description - the transaction to be sent to the sink address
   * @private
   * @memberof PublicApostille
   */
  private creationTransaction;

  /**
   * Creates an instance of PublicApostille.
   * @param {Initiator} initiatorAccount - initiator of the transaction
   * @param {string} fileName - the digital file name
   * @param {NetworkType} networkType - network type
   * @param {string} [sinkAddress] - the sink address to use
   * @memberof PublicApostille
   */
  constructor(
    private initiatorAccount: Initiator,
    public readonly fileName: string,
    sinkAddress?: Address,
  ) {
    this.networkType = initiatorAccount.account.address.networkType;
    if (sinkAddress) {
      this.address = sinkAddress;
    } else {
      this.address = Address.createFromRawAddress(Sinks[this.networkType]);
    }
  }

  /**
   * @description - update the file content to be notarised on the blockchain
   * @param {string} fileContent - the content of the file
   * @param {HashFunction} hashFunction - hash function to use
   * @memberof PublicApostille
   */
  public update(fileContent: string, hashFunction: HashFunction): void {
    this.hash = hashFunction.nonSignedHashing(fileContent);
    this.creationTransaction = TransferTransaction.create(
      Deadline.create(),
      this.address,
      [XEM.createRelative(0)],
      PlainMessage.create(this.hash),
      this.networkType,
    );
    // by putting announce to false we can reuse this function
    // if we want to provide a new content
    this.announced = false;
  }

  /**
   * @description - gets the sink address that this public apostille use
   * @readonly
   * @type {string}
   * @memberof PublicApostille
   */
  get sinkAddress(): Address {
    return this.address;
  }

  /**
   * @description - gets the public apostille hash (including the magic byte)
   * @readonly
   * @type {string}
   * @memberof PublicApostille
   */
  get apostilleHash(): string {
    return this.hash;
  }

  // TODO: add last transaction hash
}

export { PublicApostille };
