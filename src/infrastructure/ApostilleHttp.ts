import { chain, remove, sortBy, uniq } from 'lodash';
import { Account, AccountHttp, Address, AggregateTransaction, Deadline, InnerTransaction, Listener, LockFundsTransaction, Mosaic, NamespaceId, PublicAccount, QueryParams, SignedTransaction, Transaction, TransactionAnnounceResponse, TransactionHttp, TransactionInfo, TransactionType, TransferTransaction, UInt64 } from 'nem2-sdk';
import { EMPTY, forkJoin, Observable, of } from 'rxjs';
import { expand, filter, mergeMap, reduce, shareReplay } from 'rxjs/operators';
import { Errors } from '../types/Errors';
import { Initiator, initiatorAccountType } from './Initiator';

const incompleteTransactionsFunc = (readyTransaction: IReadyTransaction) => {
  if (readyTransaction.initiator) {
    return !readyTransaction.initiator.complete;
  }
  return true;
};
export interface IReadyTransaction {
  initiator: Initiator;
  transaction: Transaction;
}

interface IAnnounceTransactionList {
  initiator: Initiator;
  innerTransaction: InnerTransaction;
}
export class ApostilleHttp {

  /**
   * @description creates a lockfunds transaction for an aggregate bonded transaction
   * @param {SignedTransaction} signedAggregateBondedTransaction
   * @returns {LockFundsTransaction}
   * @memberof ApostillePublicAccount
   */
  public static createLockFundsTransaction(signedAggregateBondedTransaction: SignedTransaction): LockFundsTransaction {
    const lockFundsTransaction = LockFundsTransaction.create(
      Deadline.create(),
      new Mosaic(new NamespaceId('nem.xem'), UInt64.fromUint(10)),
      UInt64.fromUint(480),
      signedAggregateBondedTransaction,
      signedAggregateBondedTransaction.networkType);

    return lockFundsTransaction;
  }

  public announceList: SignedTransaction[] = [];

  private transactionHttp: TransactionHttp;
  private accountHttp: AccountHttp;
  private listener: Listener;

  private unannouncedTransactions: IReadyTransaction[] = [];

  public constructor(url: string) {
    this.transactionHttp = new TransactionHttp(url);
    this.accountHttp = new AccountHttp(url);
    this.listener = new Listener(url);
  }

  /**
   * Generic announce method
   *
   * @param {SignedTransaction} signedTransaction
   * @returns {Promise<TransactionAnnounceResponse>}
   * @memberof ApostilleHttp
   */
  public announce(signedTransaction: SignedTransaction): Promise<TransactionAnnounceResponse> {
    return new Promise<TransactionAnnounceResponse>((resolve, reject) => {
      this.transactionHttp.announce(signedTransaction)
      .subscribe((x) => resolve(x), (err) => reject(err));
    });
  }

  /**
   * Helper method to announce aggregate bonded transaction with lock funds
   *
   * @param {PublicAccount} cosignatoryAccount
   * @param {SignedTransaction} signedAggregateBondedTransaction
   * @param {SignedTransaction} signedLockFundsTransaction
   * @param {Listener} listener
   * @returns {Promise<TransactionAnnounceResponse>}
   * @memberof ApostilleHttp
   */
  public announceAggregateBonded(
    cosignatoryAccount: PublicAccount,
    signedAggregateBondedTransaction: SignedTransaction,
    signedLockFundsTransaction: SignedTransaction,
  ): Promise<TransactionAnnounceResponse> {

    return new Promise<TransactionAnnounceResponse>((resolve, reject) => {
      this.listener.open().then(() => {

        // Announce lock funds first
        this.transactionHttp
          .announce(signedLockFundsTransaction)
          .subscribe((x) => console.log(x), (err) => reject(err));

        // Watch for lock funds confirmation before announcing aggregate bonded
        this.listener
          .confirmed(cosignatoryAccount.address)
          .pipe(
            filter((transaction) => {
              return transaction.transactionInfo !== undefined
                && transaction.transactionInfo.hash === signedLockFundsTransaction.hash;
            }),
            mergeMap(() => this.transactionHttp.announceAggregateBonded(signedAggregateBondedTransaction)),
          )
          .subscribe((announcedAggregateBonded) => {
            resolve(announcedAggregateBonded);
          }, (err) => {
            reject(err);
          });
      });
    });

  }

  /**
   * @description - checks on chain if account exists
   * @param {PublicAccount} publicAccount
   * @returns {Promise<boolean>}
   * @memberof ApostilleAccount
   */
  public async isCreated(publicAccount: PublicAccount): Promise<boolean> {
    try {
      const unconfirmedTransactions = await this._unconfirmedTransactions(publicAccount).toPromise();
      if (unconfirmedTransactions.length > 0) {
        // the apostille has been sent to the network
        return true;
      } else {
        // then check transactions
        const transactions = await this._transactions(publicAccount).toPromise();
        return (transactions.length > 0);
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * @description - get cosignatories of an account
   * @returns {Promise<PublicAccount[]>}
   * @memberof ApostilleHttp
   */
  public getCosignatories(address: Address): Promise<PublicAccount[]> {
    return new Promise(async (resolve, reject) => {
      this.accountHttp.getMultisigAccountInfo(address).subscribe(
        (multisigAccountInfo) => {
          resolve(multisigAccountInfo.cosignatories);
        },
        (err) => reject(err),
      );
    });
  }

  /**
   * @description - Check if account is owned
   * @returns {Promise<boolean>}
   * @memberof ApostilleHttp
   */
  public isOwned(address: Address): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getCosignatories(address).then(
        (cosignatories) => {
          resolve(cosignatories.length > 0);
        },
      ).catch((error) => {
        const errorText = JSON.parse(error.response.text);
        if (errorText.code === 'ResourceNotFound') {
          resolve(false);
        } else {
         reject(error);
        }
      });
    });
  }

  /**
   * @description - get creationTransaction Info
   * @param {string} urls
   * @returns {Promise<string>}
   * @memberof ApostilleAccount
   */
  public async getCreationTransactionInfo(publicAccount: PublicAccount): Promise<TransactionInfo> {
    try {
      const transaction: TransferTransaction = await this.getCreationTransaction(publicAccount);
      if (transaction.transactionInfo instanceof TransactionInfo) {
        return transaction.transactionInfo;
      } else {
        throw new Error(Errors[Errors.TRANSACTION_INFO_NOT_FOUND]);
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * @description - get first transaction
   * @param {string} urls
   * @returns {Promise<TransferTransaction>}
   * @memberof ApostilleAccount
   */
  public getCreationTransaction(publicAccount: PublicAccount): Promise<TransferTransaction> {
    return new Promise((resolve, reject) => {
      this.fetchAllTransactions(publicAccount).pipe(
        reduce((acc, txs) => {
          return acc.concat(txs);
        }),
      ).subscribe((transactions: Transaction[]) => {
        if (transactions.length > 0) {
          const firstTransaction = transactions[transactions.length - 1];
          if (firstTransaction instanceof TransferTransaction) {
            resolve (firstTransaction);
          } else if (firstTransaction instanceof AggregateTransaction) {
            // if the smallest index is aggregate transaction, then sort it by index
            const innerTransactions = firstTransaction.innerTransactions;
            const sortedInnerTransactions = sortBy(
              innerTransactions, ['transactionInfo.index']);
            const firstInnerTransaction = sortedInnerTransactions[0];
            if (firstInnerTransaction instanceof TransferTransaction) {
              resolve(firstInnerTransaction);
            }
          }
        }
        reject(Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
      });
    });
  }

  public fetchAllTransactions(publicAccount: PublicAccount): Observable<Transaction[]> {
    let nextId: string = '';
    const pageSize: number = 100;
    let lastPageSize: number = 100;
    let queryParams = new QueryParams(pageSize);
    return this._transactions(publicAccount, queryParams).pipe(
      expand((transactions) => {
        lastPageSize = transactions.length;
        if (lastPageSize < pageSize) { return EMPTY; }
        nextId = transactions[transactions.length - 1].transactionInfo!.id;
        queryParams = new QueryParams(pageSize, nextId !== '' ? nextId : undefined);
        return this._transactions(publicAccount, queryParams);
      }),
      shareReplay(),
    );
  }

  public fetchAllTransactionsSync(publicAccount: PublicAccount): Promise<Transaction[]> {
    return this.fetchAllTransactions(publicAccount).pipe(
      reduce((acc, txs) => {
        return acc.concat(txs);
      }),
    ).toPromise();
  }

  public _transactions(
    publicAccount: PublicAccount,
    queryParams ?: QueryParams | undefined): Observable<Transaction[]> {
    return this.accountHttp.transactions(publicAccount, queryParams);
  }

  public _unconfirmedTransactions(
    publicAccount: PublicAccount,
    queryParams ?: QueryParams | undefined): Observable<Transaction[]> {
    return this.accountHttp.unconfirmedTransactions(publicAccount, queryParams);
  }

  /**
   * Bulk transactions helper functions
   */

  public addTransaction(readyTransaction: IReadyTransaction): number {
    const { initiator } = readyTransaction;
    if (initiator.canSign()) {
      return this.unannouncedTransactions.push(readyTransaction);
    } else {
      throw Error(Errors[Errors.INITIATOR_UNABLE_TO_SIGN]);
    }
  }

  public getIncompleteTransactions(): IReadyTransaction[] {
    return this.unannouncedTransactions.filter(incompleteTransactionsFunc);
  }

  public hasIncompleteTransactions(): boolean {
    return this.unannouncedTransactions.some(incompleteTransactionsFunc);
  }

  public reduceInitiatorList(initiators: Initiator[]): Account[] {
    let allInitiators: Account[] = [];
    for ( const i of initiators) {
      if (i.account instanceof Account) {
        allInitiators.push(i.account);
      }
      if (i.accountType === initiatorAccountType.MULTISIG_ACCOUNT) {
        allInitiators = allInitiators.concat(i.multiSigAccount!.cosignatories);
      }
    }
    return uniq(allInitiators);
  }

  public aggregateAndSign(innerTransactions: IAnnounceTransactionList[]): SignedTransaction[] {
    return chain(innerTransactions)
      .chunk(1000)
      .map((innerT) => {
        const initiatorsArray = innerT.map((innerTransaction) => innerTransaction.initiator);
        const innerTransactionsArray = innerT.map((innerTransaction) => innerTransaction.innerTransaction);

        const allInitiators: Account[] = this.reduceInitiatorList(initiatorsArray);
        const [firstCosigner, ...cosigners] = allInitiators;

        const aggregateTransaction = AggregateTransaction.createComplete(
          Deadline.create(),
          innerTransactionsArray,
          firstCosigner.address.networkType,
          []);

        return firstCosigner.signTransactionWithCosignatories(aggregateTransaction, cosigners);
      }).value();
  }

  /**
   * @description - announce all transactions to the network
   * @param {string} [urls] - endpoint url
   * @returns {Promise<void>}
   * @memberof ApostilleAccount
   */
  public announceAll(): Observable<[SignedTransaction[], Observable<TransactionAnnounceResponse>]> {
    let innerTransactionsList: IAnnounceTransactionList[] = [];
    let readyTx;
    while (this.unannouncedTransactions.length > 0) {
      readyTx = this.unannouncedTransactions.pop();
      if (readyTx === undefined) { break; }
      const {initiator, transaction} = readyTx as IReadyTransaction;
      /**
       * Pseudocode
       * For each transaction
       * If all cosigners are present for that transaction, add to an aggregate complete transaction
       * If not all cosigners are present for that transaction, convert it into an aggregate bonded
       * and create a corresponding lock funds transaction.
       *
       * ** Note **
       * There might be an edge case where N transactions having the same initiator but
       * does not have all the cosigners present can be bundled into a single aggregate bonded
       * transaction, thereby only needing ONE lock funds transaction instead of N lock funds transaction.
       * However, a look ahead might unnecessarily complicate this method and there is a possibility of
       * messing up the order of transactions. This edge case could be looked into in the future.
       */
      if (transaction.type === TransactionType.TRANSFER ||
        transaction.type === TransactionType.MODIFY_MULTISIG_ACCOUNT) {
        if (initiator.complete) {
          const refreshedTransaction = transaction.reapplyGiven(Deadline.create());
          const innerTransaction = refreshedTransaction.toAggregate(initiator.publicAccount);
          innerTransactionsList.push({initiator, innerTransaction});
        } else {
          this.announceList.concat(this.aggregateAndSign(innerTransactionsList));
          innerTransactionsList = []; // Clear buffer

          const aggregateBondedTransaction = initiator.sign(transaction);
          const lockFundsTransaction = ApostilleHttp.createLockFundsTransaction(aggregateBondedTransaction);
          const signedLockFunds = initiator.sign(lockFundsTransaction);
          this.announceList.push(signedLockFunds);
          this.announceList.push(aggregateBondedTransaction);
        }
      } else if (transaction.type === TransactionType.AGGREGATE_BONDED ||
        transaction.type === TransactionType.AGGREGATE_COMPLETE) {
        this.announceList.concat(this.aggregateAndSign(innerTransactionsList));
        innerTransactionsList = []; // Clear buffer

        const signedTransaction = initiator.sign(transaction);
        this.announceList.push(signedTransaction);
      }
    }

    this.announceList.concat(this.aggregateAndSign(innerTransactionsList));
    innerTransactionsList = []; // Clear buffer

    // Start listener
    this.confirmedListener();

    // Announce all signed transactions and push to network
    return forkJoin(
      of(this.announceList),
      this.announceList.map((signedTx) => {
        return this.transactionHttp.announce(signedTx);
      }),
    );
  }

  private confirmedListener(): void {
    const newBlock$ = this.listener.newBlock().subscribe(() => {
      if (this.announceList.length > 0) {
        const transactionHashes = this.announceList.map((signedTx) => signedTx.hash);
        this.transactionHttp.getTransactionsStatuses(transactionHashes).subscribe(
          (txs) => {
            for (const tx of txs) {
              if (tx.group === 'confirmed') {
                remove(this.announceList, (signedTx) => {
                  return signedTx.hash === tx.hash;
                });
              }
            }
          },
        );
      } else {
        newBlock$.unsubscribe();
      }
    });
  }
}
