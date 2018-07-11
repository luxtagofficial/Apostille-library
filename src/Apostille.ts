import { drop, uniqBy } from 'lodash';
import * as nemSDK from 'nem-sdk';
import { Account, AccountHttp, Address, AggregateTransaction, Deadline, InnerTransaction, Listener, LockFundsTransaction, ModifyMultisigAccountTransaction, Mosaic, MultisigCosignatoryModification, MultisigCosignatoryModificationType, NetworkType, PlainMessage, PublicAccount, QueryParams, SignedTransaction, TransactionAnnounceResponse, TransactionHttp, TransactionType, TransferTransaction, UInt64, XEM } from 'nem2-sdk';
import { filter, flatMap } from 'rxjs/operators';
import { ApostilleAccount } from './ApostilleAccount';
import { SHA256 } from './hashFunctions';
import { HashFunction } from './hashFunctions/HashFunction';
import { Initiator } from './Initiator';
import { IReadyTransaction } from './ReadyTransaction';
import { TransactionsStreams } from './TransactionsStreams';

const nem = nemSDK.default;
// TODO: add tx hash of creation
// TODO: a getter function for getting all the owners of the apostille
/**
 * @description the private apostille class
 * @class Apostille
 */
class Apostille {
  /**
   * @description - an array of all the transaction before they get announced to the network
   * @private
   * @type {IReadyTransaction[]}
   * @memberof Apostille
   */
  private transactions: IReadyTransaction[] = [];
  /**
   * @description - the apostille account
   * @private
   * @type {Account}
   * @memberof Apostille
   */
  private Apostille: Account = new Account();
  /**
   * @description - whether the apostille was created or not
   * @private
   * @type {boolean}
   * @memberof Apostille
   */
  // tslint:disable-next-line:variable-name
  private _created: boolean = false;
  /**
   * @description - whether the apostille creation transaction was announced to the network
   * @private
   * @type {boolean}
   * @memberof Apostille
   */
  private creationAnnounced: boolean = false;
  /**
   * @description - the account that made the creation transaction
   * @private
   * @memberof Apostille
   */
  private creatorAccount;
  /**
   * @description - the apostille hash (magical byte + hash)
   * @private
   * @memberof Apostille
   */
  private hash;

  /**
   * Creates an instance of Apostille.
   * @param {string} seed - the seed used to generate an initial hash
   * @param {Account} generatorAccount - the account used to sign the hash to generate an HD account private key
   * @param {NetworkType} networkType - network type of the apostille account
   * @memberof Apostille
   */
  constructor(
    public readonly seed: string,
    private generatorAccount: Account,
    public readonly networkType: NetworkType,
  ) {
    if (generatorAccount.address.networkType !== networkType) {
      throw new Error('network type miss matched!');
    }
    // hash the seed for the apostille account
    const hashSeed = SHA256.hash(this.seed);
    let privateKey: string;
    // signe the hashed seed to get the private key
    if (networkType === NetworkType.MAIN_NET || networkType === NetworkType.TEST_NET) {
      const keyPair = nem.crypto.keyPair.create(generatorAccount.privateKey);
      privateKey = nem.utils.helpers.fixPrivateKey(keyPair.sign(hashSeed).toString());
    } else {
      privateKey = nem.utils.helpers.fixPrivateKey(generatorAccount.signData(hashSeed));
    }
    // create the HD acccount (appostille)
    this.Apostille = Account.createFromPrivateKey(privateKey, this.networkType);
  }
  /**
   * @description - create a creation transaction for the apostille account
   * @param {Initiator} initiatorAccount - the initiator of the transaction
   * @param {string} rawData - the raw data to send in the payload
   * @param {(Mosaic[] | Mosaic[])} [mosaics=[]] - array of mosiacs to attache
   * @param {HashFunction} [hashFunction] - if provided will hash the raw data and add a magical byte to the hash
   * @returns {Promise<void>}
   * @memberof Apostille
   */
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
    await this.isAnnouced().then(() => {
      if (this._created) {
        this._created = true;
        throw new Error('you have already created this apostille');
      }
      this.creatorAccount = initiatorAccount;
      let creationTransaction: TransferTransaction;
      let readyCreation: IReadyTransaction;
      // first we create the creation transaction as a transfer transaction
      if (hashFunction) {
        // for digital files it's a good idea to hash the content of the file
        // but can be used for other types of information for real life assets
        this.hash = hashFunction.signedHashing(rawData, initiatorAccount.account.privateKey, this.networkType);
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
      // we prepare the transaction to push it in the array
      if (initiatorAccount.multisigAccount) {
        if (initiatorAccount.complete) {
          // aggregate compleet transaction
          readyCreation = {
            initiator: initiatorAccount,
            transaction: creationTransaction,
            type: TransactionType.AGGREGATE_COMPLETE,
          };
        } else {
          // aggregate bounded
          readyCreation = {
            initiator: initiatorAccount,
            transaction: creationTransaction,
            type: TransactionType.AGGREGATE_BONDED,
          };
        }
      } else {
        // transafer transaction
        readyCreation = {
          initiator: initiatorAccount,
          transaction: creationTransaction,
          type: TransactionType.TRANSFER,
        };
      }
      this.transactions.push(readyCreation);
      this._created = true;
    });
  }
  /**
   * @description - creates an update transaction
   * @param {Initiator} initiatorAccountthe - initiator of the transaction
   * @param {string} message - message to add as a payload
   * @param {(Mosaic[] | Mosaic[])} [mosaics=[]] - array of mosiacs to attache
   * @returns {Promise<void>}
   * @memberof Apostille
   */
  public async update(
    initiatorAccount: Initiator,
    message: string,
    mosaics: Mosaic[] | Mosaic[] = [],
  ): Promise<void> {
    if (!this._created) {
      // we test locally first to avoid testing on chain evrytime we update
      await this.isAnnouced();
      if (!this._created) {
        throw new Error('Apostille not created yet!');
      }
    }
    // we create the update transaction
    const updateTransaction = TransferTransaction.create(
      Deadline.create(),
      Address.createFromRawAddress(this.Apostille.address.plain()),
      mosaics,
      PlainMessage.create(message),
      this.networkType,
    );
    // we prepare the transaction to push it in the array
    let readyUpdate: IReadyTransaction;
    if (initiatorAccount.multisigAccount) {
      if (initiatorAccount.complete) {
        // aggregate compleet transaction
        readyUpdate = {
          initiator: initiatorAccount,
          transaction: updateTransaction,
          type: TransactionType.AGGREGATE_COMPLETE,
        };
      } else {
        // aggregate bounded
        readyUpdate = {
          initiator: initiatorAccount,
          transaction: updateTransaction,
          type: TransactionType.AGGREGATE_BONDED,
        };
      }
    } else {
      // transafer transaction
      readyUpdate = {
        initiator: initiatorAccount,
        transaction: updateTransaction,
        type: TransactionType.TRANSFER,
      };
    }
    this.transactions.push(readyUpdate);
  }
  /**
   * @description - create a multisig contract to own the apostille account
   * @param {PublicAccount[]} owners - array of public account that will become owners
   * @param {number} quorum - the minimum number of owners necessary to agree on the apostille account activities
   * @param {number} minRemoval - minimum number of owners necessary to agree to remove one or some owners
   * @memberof Apostille
   */
  public own(owners: PublicAccount[], quorum: number, minRemoval: number): void {
    const modifications: MultisigCosignatoryModification[] = [];
    owners.forEach((cosignatory) => {
      modifications.push(
        new MultisigCosignatoryModification(
          MultisigCosignatoryModificationType.Add,
          cosignatory));
    });
    const multisigCreation = ModifyMultisigAccountTransaction.create(
      Deadline.create(),
      quorum,
      minRemoval,
      modifications,
      this.networkType,
    );

    const apostilleAccount = new Initiator(this.Apostille, this.networkType);
    const readyModification: IReadyTransaction = {
       initiator: apostilleAccount,
       transaction: multisigCreation,
       type: TransactionType.MODIFY_MULTISIG_ACCOUNT,
    };
    this.transactions.push(readyModification);
  }
  /**
   * @description - modify ownership of the apostille account by modifying the multisisg contratc
   * @param {Account[]} signers - array of accounts that will sign the transaction
   * @param {boolean} complete - whether the transaction is an aggregate compleet or bounded
   * @param {PublicAccount[]} newOwners - array of new owners
   * @param {PublicAccount[]} OwnersToRemove - array of owners to remove
   * @param {number} quorumDelta - relative quorum (refer to own function above and/or http://bit.ly/2Jnff1r )
   * @param {number} minRemovalDelta - relative number of minimum owners necessary to agree to remove one or some owners
   * @memberof Apostille
   */
  public transfer(signers: Account[],
                  complete: boolean,
                  newOwners: PublicAccount[],
                  OwnersToRemove: PublicAccount[],
                  quorumDelta: number,
                  minRemovalDelta: number,
  ): void {
    // the initiator must be a multisig account
    const modifications: MultisigCosignatoryModification[] = [];
    newOwners.forEach((cosignatory) => {
      modifications.push(
        new MultisigCosignatoryModification(
          MultisigCosignatoryModificationType.Add,
          cosignatory));
    });
    OwnersToRemove.forEach((cosignatory) => {
      modifications.push(
        new MultisigCosignatoryModification(
          MultisigCosignatoryModificationType.Remove,
          cosignatory));
    });
    const multisigCreation = ModifyMultisigAccountTransaction.create(
      Deadline.create(),
      quorumDelta,
      minRemovalDelta,
      modifications,
      this.networkType,
    );
    let initiatorApostille: Initiator;
    const cosignatories = drop(signers);
    let readyModification: IReadyTransaction;
    if (complete) {
      // create an incomplete initiator
      initiatorApostille = new Initiator(
        signers[0],
        this.networkType,
        this.Apostille.publicAccount,
        true,
        cosignatories);
      // we prepare the ready transaction
      readyModification = {
        initiator: initiatorApostille,
        transaction: multisigCreation,
        type: TransactionType.AGGREGATE_COMPLETE,
      };
    } else {
      // create a compleet initiator
      initiatorApostille = new Initiator(
        signers[0],
        this.networkType,
        this.Apostille.publicAccount,
        false,
        cosignatories);
      // we prepare the ready transaction
      readyModification = {
        initiator: initiatorApostille,
        transaction: multisigCreation,
        type: TransactionType.AGGREGATE_BONDED,
      };
    }
    this.transactions.push(readyModification);
  }
  /**
   * @description - announce all transactions to the network
   * @param {string} [urls] - endpoint url
   * @returns {Promise<void>}
   * @memberof Apostille
   */
  public async announce(urls?: string): Promise<void> {
    await this.isAnnouced().then(async () => {
      if (!this._created) {
        throw new Error('Apostille not created yet!');
      }
      let transactionHttp: TransactionHttp;
      let listener: Listener;
      if (urls) {
        if (this.networkType === NetworkType.MAIN_NET || this.networkType === NetworkType.TEST_NET) {
          console.warn('To fetch a far far away transaction a historical node is needed');
        }
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
      let readyTransfer: IReadyTransaction[] = [];
      this.transactions.forEach(async (readyTransaction) => {
        if (readyTransaction.type === TransactionType.TRANSFER
            || readyTransaction.type === TransactionType.MODIFY_MULTISIG_ACCOUNT) {
          // if transfer transaction keep piling them in for an aggregate aggregate
          readyTransfer.push(readyTransaction);
        } else if (readyTransaction.type === TransactionType.AGGREGATE_COMPLETE) {
          // if aggregate complete check if trensfer transaction has transaction to announce
          if (!readyTransaction.initiator.multisigAccount) {
            throw Error('This aggregate compleet needs a multisig account');
          }
          if (readyTransfer.length > 0) {
            await this.announceTransfer(readyTransfer, transactionHttp);
            readyTransfer = [];
          }
          const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(),
            [
              readyTransaction.transaction.toAggregate(readyTransaction.initiator.multisigAccount),
            ],
            NetworkType.MIJIN_TEST,
            [],
          );
          // then announce aggregate compleet
          let signedTransaction: SignedTransaction;
          if (readyTransaction.initiator.cosignatories) {
            // if we have cosignatories that needs to sign
            signedTransaction = readyTransaction.initiator.account.signTransactionWithCosignatories(
              aggregateTransaction,
              readyTransaction.initiator.cosignatories);
          } else {
            // it should be a 1-n account
            signedTransaction = readyTransaction.initiator.account.sign(aggregateTransaction);
          }
          await transactionHttp.announce(signedTransaction).subscribe(
            (x) => console.log(x),
            (err) => console.error(err));

        } else if (readyTransaction.type === TransactionType.AGGREGATE_BONDED) {
          if (!readyTransaction.initiator.multisigAccount) {
            throw Error('This aggregate bounded needs a multisig account');
          }
          if (readyTransfer.length > 0) {
            await this.announceTransfer(readyTransfer, transactionHttp);
            readyTransfer = [];
          }
          // we need a lock transaction for the aggregate bounded
          const aggregateTransaction = AggregateTransaction.createBonded(
            Deadline.create(),
            [
              readyTransaction.transaction.toAggregate(readyTransaction.initiator.multisigAccount),
            ],
            NetworkType.MIJIN_TEST,
            [],
          );
          let signedTransaction: SignedTransaction;
          if (readyTransaction.initiator.cosignatories) {
            // if we have cosignatories that needs to sign
            signedTransaction = readyTransaction.initiator.account.signTransactionWithCosignatories(
              aggregateTransaction,
              readyTransaction.initiator.cosignatories);
          } else {
            // it should be a 1-n account
            signedTransaction = readyTransaction.initiator.account.sign(aggregateTransaction);
          }
          // the lock need the signed aggregate transaction
          const lockFundsTransaction = LockFundsTransaction.create(
            Deadline.create(),
            XEM.createRelative(10),
            UInt64.fromUint(480),
            signedTransaction,
            NetworkType.MIJIN_TEST);
          // we sign the lock
          const signedLock = readyTransaction.initiator.account.sign(lockFundsTransaction);
          // announce the lock then the aggregate bounded
          await listener.open().then(() => {

            transactionHttp.announce(signedLock).subscribe(
                (x) => console.log(x),
                (err) => console.error(err));
            listener.confirmed(readyTransaction.initiator.account.address).pipe(
              filter((transaction) => transaction.transactionInfo !== undefined
                    && transaction.transactionInfo.hash === signedLock.hash),
              flatMap(() => transactionHttp.announceAggregateBonded(signedTransaction)),
            ).subscribe(
              (announcedAggregateBonded) => console.log(announcedAggregateBonded),
              (err) => console.error(err));
          });
        }
      });
      // finally check if the transafer transaction arraay has transactions to announce
      if (readyTransfer.length > 0) {
        await this.announceTransfer(readyTransfer, transactionHttp);
        readyTransfer = [];
        // empty the array
      }
      // empty the array
      this.transactions = [];
    });
  }
  /**
   * @description - sets whether the apostille was created
   * @memberof Apostille
   */
  set created(value: boolean) {
    this._created = value;
  }
  /**
   * @description - gets the apostille account private key
   * @readonly
   * @type {string}
   * @memberof Apostille
   */
  get privateKey(): string {
    return this.Apostille.privateKey;
  }
  /**
   * @description - gets the apsotille account public key
   * @readonly
   * @type {string}
   * @memberof Apostille
   */
  get publicKey(): string {
    return this.Apostille.publicKey;
  }
  /**
   * @description - gets the apsotille account address
   * @readonly
   * @type {Address}
   * @memberof Apostille
   */
  get address(): Address {
    return this.Apostille.address;
  }
  /**
   * @description - gets the account that was used to generate the apostille account (HD account)
   * @readonly
   * @type {PublicAccount}
   * @memberof Apostille
   */
  get generator(): PublicAccount {
    return this.generatorAccount.publicAccount;
  }
  /**
   * @description - gets the public account of the generated apostille acount (HD account)
   * @readonly
   * @type {ApostilleAccount}
   * @memberof Apostille
   */
  get hdAccount(): ApostilleAccount {
    return new ApostilleAccount(PublicAccount.createFromPublicKey(this.publicKey, this.networkType));
  }
  /**
   * @description - gets the hash included in the payload of the creation transaction
   * @readonly
   * @type {(string | undefined)}
   * @memberof Apostille
   */
  get creationHash(): string | undefined {
    return this.hash;
  }
  /**
   * @description - gets the signer of the creation transaction
   * @readonly
   * @type {(Account | PublicAccount | undefined)}
   * @memberof Apostille
   */
  get creator(): Account | PublicAccount | undefined {
    if (this.creatorAccount) {
      if (this.creatorAccount.multisigAccount) {
        return this.creatorAccount.multisigAccount;
      } else {
        return this.creatorAccount.account;
      }
    }
    return undefined;
  }
  /**
   * @description - checks on chain if the apostille was created
   * @returns {Promise<boolean>}
   * @memberof Apostille
   */
  public isCreated(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.isAnnouced().then(() => {
        resolve(this._created);
      });
    });
  }
  /**
   * @description - cheks on chain if there are any transactions announced
   * @param {string} [urls] - enpoint url
   * @returns {Promise<boolean>}
   * @memberof Apostille
   */
  public isAnnouced(urls?: string): Promise<boolean> {
    // check if the apostille account has any transaction
    let accountHttp;
    if (urls) {
      if (this.networkType === NetworkType.MAIN_NET || this.networkType === NetworkType.TEST_NET) {
        console.warn('To fetch a far far away transaction a historical node is needed');
      }
      accountHttp = new AccountHttp(urls);
    } else {
      if (this.networkType === NetworkType.MAIN_NET) {
        accountHttp  = new AccountHttp('http://88.99.192.82:7890');
      } else if (this.networkType === NetworkType.TEST_NET) {
        accountHttp  = new AccountHttp('http://104.128.226.60:7890');
      } else if (this.networkType === NetworkType.MIJIN) {
        throw new Error('Missing Endpoint argument!');
      } else {
        accountHttp  = new AccountHttp('http://api.beta.catapult.mijin.io:3000');
      }
    }
    return new Promise(async (resolve, reject) => {
        await accountHttp.transactions(
          this.hdAccount.publicAccount,
          new QueryParams(10),
        ).subscribe(
            (transactions) => {
              if (transactions.length) {
                // the apostille has been announced
                this._created = true;
                this.creationAnnounced = true;
                resolve(true);
              } else {
                // is not announced and the value should be false
                resolve(this.creationAnnounced);
              }
            },
            (err) => {
              // an error occurred
              // can be true or fals depending on the last state
              console.log(err.message);
              resolve(this.creationAnnounced);
            },
        );
    });
  }

  public monitor(urls?: string): TransactionsStreams {
    if (urls) {
      return new TransactionsStreams(this.hdAccount, urls);
    }
    return new TransactionsStreams(this.hdAccount);
  }

  /**
   * @description - announce transfer transactions as aggregate if more than 1
   * @private
   * @param {IReadyTransaction[]} transactions - array of transfer transactions and thier initiators
   * @param {TransactionHttp} transactionHttp - transactionHTTP object
   * @returns {Promise<void>}
   * @memberof Apostille
   */
  private async announceTransfer(
    transactions: IReadyTransaction[],
    transactionHttp: TransactionHttp): Promise<TransactionAnnounceResponse | void> {
    if (transactions.length === 1 ) {
      // sign and announce the transfer transaction
      const signedTransaction = transactions[0].initiator.account.sign(transactions[0].transaction);
      return new Promise<TransactionAnnounceResponse | void>((resolve, reject) => {
        transactionHttp.announce(signedTransaction).subscribe(
          (res) => {
            console.log(res);
            resolve(res);
          },
          (err) => {
            console.error(err);
            reject(err);
        });
      });
    } else {
      // TODO: limit the aggregate to a 1000
      // we can use chunk from loadash

      // we extract unique initiators
      const initiators = uniqBy(transactions, 'initiator');
      const cosignatories: Account[] = [];
      for (let index = 1; index < initiators.length; index++) {
        // we create a cosignatory array excluding the first initioator
        cosignatories.push(initiators[index].initiator.account);
      }
      // we prepare the inner transaction for the aggregate transaction
      const innerTransactions: InnerTransaction[] = [];
      transactions.forEach((transaction) => {
        innerTransactions.push(transaction.transaction.toAggregate(
          transaction.initiator.account.publicAccount,
        ));
      });
      const aggregateTransaction = AggregateTransaction.createComplete(
        Deadline.create(),
        innerTransactions,
        NetworkType.MIJIN_TEST,
        [],
      );
      const signedTransaction = initiators[0].initiator.account.signTransactionWithCosignatories(
        aggregateTransaction,
        cosignatories);
      return new Promise<TransactionAnnounceResponse | void>((resolve, reject) => {
        transactionHttp.announce(signedTransaction).subscribe(
          (res) => {
            console.log(res);
            resolve(res);
          },
          (err) => {
            console.error(err);
            reject(err);
        });
      });
    }
  }

}

export { Apostille };
