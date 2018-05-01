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
import { Initiator } from './Initiator';

const nem = nemSDK.default;
class Apostille {
  // TODO: convert this array into signedTransaction one
  private transactions: any[] = [];
  private Apostille: Account = new Account();
  private created: boolean = false;
  private creationAnnounced: boolean = false;
  private generatorAccount: Account = new Account();
  private creatorAccount;
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

  public async create(
    initiatorAccount: Initiator,
    rawData: string,
    mosaics: Mosaic[] | Mosaic[] = [],
    hashFunction?: HashFunction,
  ): Promise<void> {
    if (initiatorAccount.network !== this.networkType) {
      throw new Error('Netrowk type miss matched!');
    }
    // check if the apostille was already created locally or on chain
    await this.isAnnouced(this);
    if (this.created) {
      this.created = true;
      throw new Error('you have already created this apostille');
    }
    this.creatorAccount = initiatorAccount;
    let creationTransaction: TransferTransaction;
    let signedCreation: SignedTransaction;
    if (initiatorAccount.multisigAccount) {
      // the sender is a multisig account
      // we need to wrap the transaction in an aggregate transaction
      // first we create the creation transaction as a transfer transaction
      if (hashFunction) {
        // for digital files it's a good idea to hash the content of the file
        // but can be used for other types of information for real life assets
        this.hash = hashFunction.signedHashing(rawData, initiatorAccount.account.privateKey);
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          mosaics,
          PlainMessage.create(this.hash),
          this.networkType,
        );
      } else {
        // the data can be sent without being hashed
        creationTransaction = TransferTransaction.create(
          Deadline.create(),
          Address.createFromRawAddress(this.Apostille.address.plain()),
          mosaics,
          PlainMessage.create(rawData),
          this.networkType,
        );
      }
      // we wrap the creation transaction in an aggreagte transaction
      if (initiatorAccount.complete) {
        // aggregate complete
        const aggregateTransaction = AggregateTransaction.createComplete(
          Deadline.create(),
          [
            creationTransaction.toAggregate(initiatorAccount.multisigAccount),
          ],
          NetworkType.MIJIN_TEST,
          [],
        );
        if (initiatorAccount.cosignatories) {
          // if we have cosignatories that needs to sign
          signedCreation = this.creatorAccount.account.signTransactionWithCosignatories(
            aggregateTransaction,
            initiatorAccount.cosignatories);
        } else {
          signedCreation = this.creatorAccount.account.sign(aggregateTransaction);
        }
        this.transactions.push(signedCreation);
        this.created = true;
      } else {
        // aggreagte bounded
        // we need a lock transaction
        const aggregateTransaction = AggregateTransaction.createBonded(
          Deadline.create(),
          [
            creationTransaction.toAggregate(initiatorAccount.multisigAccount),
          ],
          NetworkType.MIJIN_TEST,
          [],
        );
        if (initiatorAccount.cosignatories) {
          // if we have cosignatories
          signedCreation = this.creatorAccount.account.signTransactionWithCosignatories(
            aggregateTransaction,
            initiatorAccount.cosignatories);
        } else {
          signedCreation = this.creatorAccount.account.sign(aggregateTransaction);
        }
        // the lock need the signed aggregate transaction
        const lockFundsTransaction = LockFundsTransaction.create(
          Deadline.create(),
          XEM.createRelative(10),
          UInt64.fromUint(480),
          signedCreation,
          NetworkType.MIJIN_TEST);
        // we sign the lock and push it along with the aggregate to the transaction arry
        const signedLock = this.creatorAccount.account.sign(lockFundsTransaction);
        this.transactions.push(signedLock, signedCreation);
        this.created = true;
      }
    } else {
      // the account is a normal account
      if (hashFunction) {
        this.hash = hashFunction.signedHashing(rawData, initiatorAccount.account.privateKey);
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
      signedCreation = this.creatorAccount.account.sign(creationTransaction);
      this.transactions.push(signedCreation);
    }
    this.created = true;
  }

  public async update(
    initiatorAccount: Initiator,
    message: string,
    mosaics: Mosaic[] | Mosaic[] = [],
  ): Promise<void> {
    if (initiatorAccount.network !== this.networkType) {
      throw new Error('Netrowk type miss matched!');
    }
    if (!this.created) {
      // we test locally first to avoid testing on chain evrytime we update
      await this.isAnnouced(this);
      if (!this.created) {
        throw new Error('Apostille not created yet!');
      }
    }
    const updateTransaction = TransferTransaction.create(
      Deadline.create(),
      Address.createFromRawAddress(this.Apostille.address.plain()),
      mosaics,
      PlainMessage.create(message),
      this.networkType,
    );
    let signedUpdate: SignedTransaction;
    if (initiatorAccount.multisigAccount) {
      // we need to wrap the transaction in an aggregate transaction
      if (initiatorAccount.complete) {
        // we create an aggregate complete
        const aggregateTransaction = AggregateTransaction.createComplete(
          Deadline.create(),
          [
            updateTransaction.toAggregate(initiatorAccount.multisigAccount),
          ],
          NetworkType.MIJIN_TEST,
          [],
        );

        if (initiatorAccount.cosignatories) {
          // we sign with cosignatories
          signedUpdate = initiatorAccount.account.signTransactionWithCosignatories(
            aggregateTransaction,
            initiatorAccount.cosignatories);
        } else {
          signedUpdate = initiatorAccount.account.sign(aggregateTransaction);
        }
        this.transactions.push(signedUpdate);
      } else {
        // we create aggregate bounded
        // we need a lock transaction
        const aggregateTransaction = AggregateTransaction.createBonded(
          Deadline.create(),
          [
            updateTransaction.toAggregate(initiatorAccount.multisigAccount),
          ],
          NetworkType.MIJIN_TEST,
          [],
        );

        if (initiatorAccount.cosignatories) {
          // we sign with cosignatories
          signedUpdate = initiatorAccount.account.signTransactionWithCosignatories(
            aggregateTransaction,
            initiatorAccount.cosignatories);
        } else {
          signedUpdate = initiatorAccount.account.sign(aggregateTransaction);
        }

        // the lock need the signed aggregate transaction
        const lockFundsTransaction = LockFundsTransaction.create(
          Deadline.create(),
          XEM.createRelative(10),
          UInt64.fromUint(480),
          signedUpdate,
          NetworkType.MIJIN_TEST);
        // we sign the lock and push it along with the aggregate to the transaction arry
        const signedLock = initiatorAccount.account.sign(lockFundsTransaction);
        this.transactions.push(signedLock, signedUpdate);
      }
    }
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
