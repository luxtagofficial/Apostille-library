import * as nemSDK from 'nem-sdk';
import { Account, NetworkType, TransferTransaction, Deadline, Address, XEM, PlainMessage, TransactionHttp, InnerTransaction, AggregateTransaction, Mosaic} from 'nem2-sdk';
import { SHA256 } from './hashFunctions';
import { HashFunction } from './hashFunctions/HashFunction';

const nem = nemSDK.default;
class Apostille {
  private transactions: Array<any> = [];
  private Apostille: Account = new Account();
  private created: boolean = false;
  private creationAnnounced: boolean = false;
  private hash;
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
    // TODO: check if the apostill exists on the blockchain
    if (this.created || this.creationAnnounced) {
      throw new Error('you have already created this apostille');
    }
    let creationTransaction: TransferTransaction;
    if (hashFunction) {
      this.hash = hashFunction.signedHashing(rawData, this.signerPrivateKey);
      if (mosaics) {
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          mosaics,
          PlainMessage.create(this.hash),
          this.networkType
        );
      } else {
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          [XEM.createRelative(0)],
          PlainMessage.create(this.hash),
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
    this.created = true;
  }

  public update(message: string, mosaics?: Array<Mosaic>): void {
    if (!this.created) {
      throw new Error('Apostille not created yet!');
    }
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
  }

  public announce(url?: string): void {
    if (!this.created) {
      throw new Error('Apostille not created yet!');
    }
    let transactionHttp;
    if (this.networkType === NetworkType.MAIN_NET) {
      transactionHttp = new TransactionHttp('http://88.99.192.82:7890');
    } else if (this.networkType === NetworkType.TEST_NET) {
      transactionHttp = new TransactionHttp('http://104.128.226.60:7890');
    } else if (this.networkType === NetworkType.MIJIN) {
      transactionHttp = new TransactionHttp(url);
    } else {
      transactionHttp = new TransactionHttp('http://api.beta.catapult.mijin.io:3000');
    }
    const owner = Account.createFromPrivateKey(this.signerPrivateKey, this.networkType);
    if (this.transactions.length === 1) {
      const signedTransaction = owner.sign(this.transactions[0]);
      transactionHttp.announce(signedTransaction).subscribe(
        (res) => {
          console.log(res);
          this.creationAnnounced = true;
        },
        err => console.error(err)
      );
      // empty the array
      this.transactions = [];
    } else {
      const aggregateTransactions: Array<InnerTransaction> = [];
      this.transactions.forEach(transaction => {
        aggregateTransactions.push(transaction.toAggregate(owner.publicAccount));
      });

      const aggregateTransaction = AggregateTransaction.createComplete(
        Deadline.create(),
        aggregateTransactions,
        this.networkType,
        []
      );

      const signedAggregate = owner.sign(aggregateTransaction);
      transactionHttp.announce(signedAggregate).subscribe(
        (res) => {
          console.log(res);
          this.creationAnnounced = true;
        },
        err => console.error(err)
      );
      // empty the array
      this.transactions = [];
    }
  }

  get privateKey(): string {
    return this.Apostille.privateKey;
  }

  get publicKey(): string {
    return this.Apostille.publicKey;
  }

  get address(): Address {
    return this.Apostille.address;
  }

  get apostilleHash(): string {
    return this.hash;
  }

  get isCreated(): boolean {
    return this.created;
  }

  isAnnouced(): boolean {
    // TODO: check from the block chain
    const isAnnouced = this.creationAnnounced;
    return isAnnouced;
  }
}

export { Apostille };
