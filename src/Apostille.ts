import * as nemSDK from 'nem-sdk';
import {
  Account,
  NetworkType,
  TransferTransaction,
  Deadline,
  Address,
  XEM,
  PlainMessage,
  TransactionHttp,
  InnerTransaction,
  AggregateTransaction,
  Mosaic,
  PublicAccount,
  SignedTransaction,
  AccountHttp,
  QueryParams,
  UInt64,
  LockFundsTransaction} from 'nem2-sdk';
import { SHA256 } from './hashFunctions';
import { HashFunction } from './hashFunctions/HashFunction';

const nem = nemSDK.default;
class Apostille {
  private transactions: any[] = [];
  private Apostille: Account = new Account();
  private created: boolean = false;
  private creationAnnounced: boolean = false;
  private generatorAccount: Account = new Account();
  private signerAccount: Account = new Account();
  private hash;

  constructor(
    public readonly seed: string,
    private genratorPrivateKey: string,
    public readonly networkType: NetworkType,
  ) {
    if (!nem.utils.helpers.isPrivateKeyValid(genratorPrivateKey)) {
      throw new Error('!invalid private key');
    }
    const keyPair = nem.crypto.keyPair.create(this.genratorPrivateKey);
    this.generatorAccount = Account.createFromPrivateKey(this.genratorPrivateKey, this.networkType);
    // hash the seed for the apostille account
    const hashSeed = SHA256.hash(this.seed);
    // signe the hashed seed to get the private key
    const privateKey = nem.utils.helpers.fixPrivateKey(keyPair.sign(hashSeed).toString());
    // create the HD acccount (appostille)
    this.Apostille = Account.createFromPrivateKey(privateKey, this.networkType);
  }

  public create(
    initiatorPrivateKey: string,
    rawData: string,
    mosaics: Mosaic[] | Mosaic[] = [],
    isMultisig: boolean,
    hashFunction?: HashFunction,
    multisigAccount?: PublicAccount,
    isCompleet?: boolean,
    cosignatories?: Account[],
  ): void {
    // check if it was created locally or on chain
    if (this.created || this.isAnnouced(this)) {
      throw new Error('you have already created this apostille');
    }
    this.signerAccount = Account.createFromPrivateKey(initiatorPrivateKey, this.networkType);
    let creationTransaction: TransferTransaction;
    let signedCreation: SignedTransaction;
    if (isMultisig) {
      // the sender is a multisig account
      // we need to wrap the transaction in an aggregate transaction
      if (hashFunction) {
        this.hash = hashFunction.signedHashing(rawData, initiatorPrivateKey);
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          mosaics,
          PlainMessage.create(this.hash),
          this.networkType,
        );
      } else {
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          mosaics,
          PlainMessage.create(rawData),
          this.networkType,
        );
      }
      // now we create the aggreagte transaction
      if (isCompleet) {
        // aggregate complete
        if (!multisigAccount) {
          throw new Error('The multisig account is missing!');
        }
        const aggregateTransaction = AggregateTransaction.createComplete(
          Deadline.create(),
          [
            creationTransaction.toAggregate(multisigAccount),
          ],
          NetworkType.MIJIN_TEST,
          [],
        );
        if (cosignatories) {
          // if we have cosignatories
          signedCreation = this.signerAccount.signTransactionWithCosignatories(
            aggregateTransaction,
            cosignatories);
        } else {
          signedCreation = this.signerAccount.sign(aggregateTransaction);
        }
        this.transactions.push(signedCreation);
        this.created = true;
      } else {
        // aggreagte bounded
        // we need a lock transaction
        if (!multisigAccount) {
          throw new Error('The multisig account is missing!');
        }
        const aggregateTransaction = AggregateTransaction.createBonded(
          Deadline.create(),
          [
            creationTransaction.toAggregate(multisigAccount),
          ],
          NetworkType.MIJIN_TEST,
          [],
        );
        if (cosignatories) {
          // if we have cosignatories
          signedCreation = this.signerAccount.signTransactionWithCosignatories(
            aggregateTransaction,
            cosignatories);
        } else {
          signedCreation = this.signerAccount.sign(aggregateTransaction);
        }
        const lockFundsTransaction = LockFundsTransaction.create(
          Deadline.create(),
          XEM.createRelative(10),
          UInt64.fromUint(480),
          signedCreation,
          NetworkType.MIJIN_TEST);

        const signedLock = this.signerAccount.sign(lockFundsTransaction);
        this.transactions.push(signedLock, signedCreation);
        this.created = true;
      }
    } else {
      // the account is a normal account
      if (hashFunction) {
        this.hash = hashFunction.signedHashing(rawData, initiatorPrivateKey);
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          mosaics,
          PlainMessage.create(this.hash),
          this.networkType,
        );
      } else {
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          mosaics,
          PlainMessage.create(rawData),
          this.networkType,
        );
      }
      // push the creation transaction to the transaction array
      signedCreation = this.signerAccount.sign(creationTransaction)
      this.transactions.push(signedCreation);
    }
    this.created = true;
  }

  public update(message: string, mosaics?: Mosaic[]): void {
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
        this.networkType,
      );
    } else {
      updateTransaction = TransferTransaction.create(
        Deadline.create(),
        Address.createFromRawAddress(this.Apostille.address.plain()),
        [XEM.createRelative(0)],
        PlainMessage.create(message),
        this.networkType,
      );
    }
    this.transactions.push(updateTransaction);
  }

  public announce(urls?: string): void {
    // TODO: check transaction types
    // if transfer transaction keep piling them in an aggregate
    // if aggregate complete announce alone
    // if lock fund then fetch the next aggregate transaction (should be bounded) and announce them
    if (!this.created) {
      throw new Error('Apostille not created yet!');
    }
    let transactionHttp;
    if (urls) {
      if (this.networkType === NetworkType.MAIN_NET || this.networkType === NetworkType.TEST_NET) {
        console.warn('To fetch a far far away transaction a historical node is needed');
      }
      transactionHttp = new TransactionHttp(urls);
    } else {
      if (this.networkType === NetworkType.MAIN_NET) {
        transactionHttp = new TransactionHttp('http://88.99.192.82:7890');
      } else if (this.networkType === NetworkType.TEST_NET) {
        transactionHttp = new TransactionHttp('http://104.128.226.60:7890');
      } else if (this.networkType === NetworkType.MIJIN) {
        throw new Error('Missing Endpoint argument!');
      } else {
        transactionHttp = new TransactionHttp('http://api.beta.catapult.mijin.io:3000');
      }
    }

    const owner = Account.createFromPrivateKey(this.signerPrivateKey, this.networkType);
    if (this.transactions.length === 1) {
      const signedTransaction = owner.sign(this.transactions[0]);
      transactionHttp.announce(signedTransaction).subscribe(
        (res) => {
          console.log(res);
          this.creationAnnounced = true;
        },
        (err) => { console.error(err); },
      );
      // empty the array
      this.transactions = [];
    } else {
      const aggregateTransactions: InnerTransaction[] = [];
      this.transactions.forEach((transaction) => {
        aggregateTransactions.push(transaction.toAggregate(owner.publicAccount));
      });

      const aggregateTransaction = AggregateTransaction.createComplete(
        Deadline.create(),
        aggregateTransactions,
        this.networkType,
        [],
      );

      const signedAggregate = owner.sign(aggregateTransaction);
      transactionHttp.announce(signedAggregate).subscribe(
        (res) => {
          console.log(res);
          this.creationAnnounced = true;
        },
        (err) => { console.error(err); },
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

  get hashSigner(): PublicAccount {
    return this.generatorAccount.publicAccount;
  }

  get hdAccount(): PublicAccount {
    return PublicAccount.createFromPublicKey(this.publicKey, this.networkType);
  }

  get apostilleHash(): string {
    return this.hash;
  }

  get isCreated(): boolean {
    return this.created;
  }

  public isAnnouced(apostille?: Apostille): boolean {
    // check if the apostille account has any transaction
    if (apostille) {
      let accountHttp ;
      if (this.networkType === NetworkType.MAIN_NET) {
        accountHttp  = new AccountHttp('http://88.99.192.82:7890');
      } else if (this.networkType === NetworkType.TEST_NET) {
        accountHttp  = new AccountHttp('http://104.128.226.60:7890');
      } else if (this.networkType === NetworkType.MIJIN) {
        throw new Error('Missing Endpoint argument!');
      } else {
        accountHttp  = new AccountHttp('http://api.beta.catapult.mijin.io:3000');
      }

      accountHttp.transactions(
        apostille.hdAccount,
        new QueryParams(10),
      ).subscribe(
          (transactions) => {
            if (transactions.length) {
              this.created = true;
              this.creationAnnounced = true;
              return true;
            } else {
              return this.creationAnnounced;
            }
          },
          (err) => {
            console.error(err);
            return this.creationAnnounced;
          },
      );
    }
    return this.creationAnnounced;
  }

}

export { Apostille };
