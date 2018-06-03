import { Address, AggregateTransaction, Deadline, Listener, LockFundsTransaction, NetworkType, PlainMessage, SignedTransaction, TransactionHttp, TransferTransaction, UInt64, XEM } from 'nem2-sdk';
import { Initiator } from './Initiator';
import { Sinks } from './Sinks';
import { HashFunction } from './hashFunctions/HashFunction';

// TODO: add tx hash

class PublicApostille {
  public announced: boolean = false;
  private address: Address;
  private hash;
  private creationTransaction;

  constructor(
    private initiatorAccount: Initiator,
    public readonly fileName: string,
    public readonly networkType: NetworkType,
    sinkAddress?: string,
  ) {
    if (sinkAddress) {
      const newSink = Address.createFromRawAddress(sinkAddress);
      if (newSink.networkType !== networkType) {
        throw new Error('the address is of a wrong network type');
      }
      this.address = newSink;
    } else {
      this.address = Address.createFromRawAddress(Sinks[networkType]);
    }
  }

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

  public announce(urls?: string): Promise<void> {
    if (this.announced) {
      throw new Error('This File has already been anounced to the network');
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
      if (this.networkType === NetworkType.MAIN_NET) {
        transactionHttp = new TransactionHttp('http://88.99.192.82:7890');
        listener = new Listener('http://88.99.192.82:7890');
      } else if (this.networkType === NetworkType.TEST_NET) {
        transactionHttp = new TransactionHttp('http://104.128.226.60:7890');
        listener = new Listener('http://104.128.226.60:7890');
      } else if (this.networkType === NetworkType.MIJIN) {
        throw new Error('Missing Endpoint argument!');
      } else {
        transactionHttp = new TransactionHttp('http://api.beta.catapult.mijin.io:3000');
        listener = new Listener('http://api.beta.catapult.mijin.io:3000');
      }
    }
    if (this.initiatorAccount.network !== this.networkType) {
      throw new Error('Netrowk type miss matched!');
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

  get sinkAddress(): string {
    return this.address.pretty();
  }

  get apostilleHash(): string {
    return this.hash;
  }
  // TODO: add last transaction hash
}

export { PublicApostille };
