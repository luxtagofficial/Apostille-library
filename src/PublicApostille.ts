import { Address, AggregateTransaction, Deadline, Listener, LockFundsTransaction, NetworkType, PlainMessage, SignedTransaction, TransactionHttp, TransferTransaction, UInt64, XEM } from 'nem2-sdk';
import { Errors, HistoricalEndpoints, Initiator } from '../index';
import { Sinks } from './Sinks';
import { HashFunction } from './hashFunctions/HashFunction';

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
   * @param {Initiator} initiatorAccount - initiator of the trnsaction
   * @param {string} fileName - the digital file name
   * @param {NetworkType} networkType - network type
   * @param {string} [sinkAddress] - the sink address to use
   * @memberof PublicApostille
   */
  constructor(
    private initiatorAccount: Initiator,
    public readonly fileName: string,
    public readonly networkType: NetworkType,
    sinkAddress?: string,
  ) {
    if (sinkAddress) {
      const newSink = Address.createFromRawAddress(sinkAddress);
      if (newSink.networkType !== networkType) {
        throw new Error(Errors[Errors.NETWORK_TYPE_MISMATCHED]);
      }
      this.address = newSink;
    } else {
      this.address = Address.createFromRawAddress(Sinks[networkType]);
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
   * @description - announce the public apostille to the sink address
   * @param {string} [urls] - endpoint url
   * @returns {Promise<void>}
   * @memberof PublicApostille
   */
  public announce(urls?: string): Promise<void> {
    if (this.announced) {
      throw new Error(Errors[Errors.FILE_ALREADY_ANNOUNCED]);
    }
    let transactionHttp;
    let listener;
    let signedCreation: SignedTransaction;
    if (urls) {
      if (this.networkType === NetworkType.MAIN_NET || this.networkType === NetworkType.TEST_NET) {
        console.warn('To fetch a far far away transaction a historical node is needed');
      }
      // TODO: check if listners accepts urls
      transactionHttp = new TransactionHttp(urls);
      listener = new Listener(urls);
    } else {
      if (this.networkType === NetworkType.MAIN_NET || this.networkType === NetworkType.TEST_NET) {
        throw new Error(Errors[Errors.MIJIN_ENDPOINT_NEEDED]);
      }
      transactionHttp = new TransactionHttp(HistoricalEndpoints[this.networkType]);
      listener = new Listener(HistoricalEndpoints[this.networkType]);
    }
    if (this.initiatorAccount.network !== this.networkType) {
      throw new Error(Errors[Errors.NETWORK_TYPE_MISMATCHED]);
    }

    if (this.initiatorAccount.multisigAccount) {
      // we need to wrap the creation transaction in an aggregate transaction
      if (this.initiatorAccount.complete) {
        // we use aggregate complete
        const aggregateTransaction = AggregateTransaction.createComplete(
          Deadline.create(),
          [
            this.creationTransaction.toAggregate(this.initiatorAccount.multisigAccount),
          ],
          NetworkType.MIJIN_TEST,
          [],
        );
        if (this.initiatorAccount.cosignatories) {
          // if we have cosignatories that needs to sign
          signedCreation = this.initiatorAccount.account.signTransactionWithCosignatories(
            aggregateTransaction,
            this.initiatorAccount.cosignatories);
        } else {
          // it should be a 1-n account
          signedCreation = this.initiatorAccount.account.sign(aggregateTransaction);
        }
        // announce the creation transaction to the network
        return new Promise((resolve, reject) => {
          transactionHttp.announce(signedCreation).subscribe(
            (res) => {
              console.log(res);
              this.announced = true;
              resolve(res);
            },
            (err) => {
              console.error(err);
              reject(err);
             },
          );
        });
      } else {
        // we use aggregate bounded
        // we need a lock transaction
        const aggregateTransaction = AggregateTransaction.createBonded(
          Deadline.create(),
          [
            this.creationTransaction.toAggregate(this.initiatorAccount.multisigAccount),
          ],
          NetworkType.MIJIN_TEST,
          [],
        );
        if (this.initiatorAccount.cosignatories) {
          // if we have cosignatories
          signedCreation = this.initiatorAccount.account.signTransactionWithCosignatories(
            aggregateTransaction,
            this.initiatorAccount.cosignatories);
        } else {
          signedCreation = this.initiatorAccount.account.sign(aggregateTransaction);
        }
        // the lock need the signed aggregate transaction
        const lockFundsTransaction = LockFundsTransaction.create(
          Deadline.create(),
          XEM.createRelative(10),
          UInt64.fromUint(480),
          signedCreation,
          NetworkType.MIJIN_TEST);

        const signedLock = this.initiatorAccount.account.sign(lockFundsTransaction);
        // we announce the signed lock and then the creation transaction
        return new Promise((resolve, reject) => {
          listener.open().then(() => {

            transactionHttp.announce(signedLock).subscribe(
              (res) => console.log(res),
              (err) => console.error(err));

            listener.confirmed(this.initiatorAccount.account.address)
                .filter((transaction) => transaction.transactionInfo !== undefined
                    && transaction.transactionInfo.hash === signedLock.hash)
                .flatMap(() => transactionHttp.announceAggregateBonded(signedCreation))
                .subscribe(
                  (announcedAggregateBonded) => {
                    console.log(announcedAggregateBonded);
                    this.announced = true;
                    resolve(announcedAggregateBonded);
                  },
                  (err) => {
                    console.error(err);
                    reject(err);
                  });
          });
        });
      }
    } else {
      // it's a normal account
      signedCreation = this.initiatorAccount.account.sign(this.creationTransaction);
      // we announce the transaction
      return new Promise((resolve, reject) => {
        transactionHttp.announce(signedCreation).subscribe(
          (res) => {
            console.log(res);
            this.announced = true;
            resolve(res);
          },
          (err) => {
            console.error(err);
            reject(err);
           },
        );
      });
    }
  }
  /**
   * @description - gets the sink address that this public apostille use
   * @readonly
   * @type {string}
   * @memberof PublicApostille
   */
  get sinkAddress(): string {
    return this.address.pretty();
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
