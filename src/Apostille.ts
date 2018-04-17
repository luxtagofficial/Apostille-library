import * as nemSDK from 'nem-sdk';
import { Account, NetworkType, TransferTransaction, Deadline, Address, XEM, PlainMessage, TransactionHttp, InnerTransaction, AggregateTransaction, Mosaic} from 'nem2-sdk';
import { SHA256 } from './hashFunctions';
import { HashFunction } from './hashFunctions/HashFunction';

const nem = nemSDK.default;
class Apostille {
  private transactions: Array<any> = [];
  private Apostille = new Account();
  constructor(public readonly seed: string, private signerPrivateKey: string, public readonly networkType: NetworkType) {
    if (!nem.utils.helpers.isPrivateKeyValid(signerPrivateKey)) {
      throw new Error('!invalid private key');
    }
    const keyPair = nem.crypto.keyPair.create(this.signerPrivateKey);
    // hash the seed for the apostille account
    const hashSeed = SHA256.hash(this.seed);
    // signe the hashed seed to get the private key
    const privateKey = nem.utils.helpers.fixPrivateKey(keyPair.sign(hashSeed).toString());
    // create the HD acccount (appostille)
    this.Apostille = Account.createFromPrivateKey(privateKey, this.networkType);
  }

  public create(rawData: string, hashFunction?: HashFunction, mosaics?: Array<Mosaic>): void {
    let creationTransaction: TransferTransaction;
    if (hashFunction) {
      const hashedData = hashFunction.signedHashing(rawData);
      if (mosaics) {
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          mosaics,
          PlainMessage.create(hashedData),
          this.networkType
        );
      } else {
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          [XEM.createRelative(0)],
          PlainMessage.create(hashedData),
          this.networkType
        );
      }
    } else {
      if (mosaics) {
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          mosaics,
          PlainMessage.create(rawData),
          this.networkType
        );
      } else {
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          [XEM.createRelative(0)],
          PlainMessage.create(rawData),
          this.networkType
        );
      }
    }
    // push the creation transaction to the transaction array
    this.transactions.push(creationTransaction);
  }

  public update(message: string, mosaics?: Array<Mosaic>): void {
    let updateTransaction: TransferTransaction;
    if (mosaics) {
      updateTransaction = TransferTransaction.create(
        Deadline.create(),
        Address.createFromRawAddress(this.Apostille.address.plain()),
        mosaics,
        PlainMessage.create(message),
        this.networkType
      ); 
    } else {
      updateTransaction = TransferTransaction.create(
        Deadline.create(),
        Address.createFromRawAddress(this.Apostille.address.plain()),
        [XEM.createRelative(0)],
        PlainMessage.create(message),
        this.networkType
      );
    }
    this.transactions.push(updateTransaction);
    console.log('update pushed');
  }

  public announce(): void {
    const transactionHttp = new TransactionHttp('http://api.beta.catapult.mijin.io:3000');
    const owner = Account.createFromPrivateKey(this.signerPrivateKey, this.networkType);
    if (this.transactions.length === 1) {
      const signedTransaction = owner.sign(this.transactions[0]);
      transactionHttp.announce(signedTransaction).subscribe(
        res => console.log(res),
        err => console.error(err)
      );
      // empty the array
      this.transactions = [];
      console.log('owner pk', owner.privateKey);
      console.log('owner pp', owner.publicKey);
      console.log('owner address', owner.address.plain());
    } else {
      const aggregateTransactions: Array<InnerTransaction> = [];
      this.transactions.forEach(transaction => {
        aggregateTransactions.push(transaction.toAggregate(owner.publicAccount));
      });

      const aggregateTransaction = AggregateTransaction.createComplete(
        Deadline.create(),
        aggregateTransactions,
        NetworkType.MIJIN_TEST,
        []
      );

      const signedAggregate = owner.sign(aggregateTransaction);
      transactionHttp.announce(signedAggregate).subscribe(
        res => console.log(res),
        err => console.error(err)
      );
      // empty the array
      this.transactions = [];
      console.log('owner pk', owner.privateKey);
      console.log('owner pp', owner.publicKey);
      console.log('owner address', owner.address.plain());
    }
  }

  get privateKey(): string {
    return this.Apostille.privateKey;
  }

  get publicKey(): string {
    return this.Apostille.publicKey;
  }

  get address(): string {
    return this.Apostille.address.plain();
  }
}

export { Apostille };
