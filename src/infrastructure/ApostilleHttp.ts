import { sortBy } from 'lodash';
import { AccountHttp, Address, AggregateTransaction, Listener, PublicAccount, QueryParams, SignedTransaction, Transaction, TransactionAnnounceResponse, TransactionHttp, TransactionInfo, TransferTransaction } from 'nem2-sdk';
import { EMPTY, Observable } from 'rxjs';
import { expand, filter, mergeMap } from 'rxjs/operators';
import { Errors } from '../types/Errors';
import { Initiator } from './Initiator';

export interface IReadyTransaction {
  transaction: Transaction;
  initiator?: Initiator;
}
export class ApostilleHttp {

  private transactionHttp: TransactionHttp;
  private accountHttp: AccountHttp;
  private listener: Listener;

  private unannouncedTransactions: IReadyTransaction[] = [];

  public constructor(url: string) {
    this.transactionHttp = new TransactionHttp(url);
    this.accountHttp = new AccountHttp(url);
    this.listener = new Listener(url);
  }

  public addTransaction(transaction: Transaction, initiator?: Initiator): void {
    this.unannouncedTransactions.push({transaction, initiator});
  }

  public getIncompleteTransactions(): Transaction[] {
    return this.unannouncedTransactions
      .filter((readyTransaction) => {
        return readyTransaction.initiator === undefined;
      })
      .map((readyTransaction) => {
        return readyTransaction.transaction;
      });
  }

  public hasIncompleteTransactions(): boolean {
    return this.unannouncedTransactions.some((readyTransaction) => {
      return readyTransaction.initiator === undefined;
    });
  }

  /**
   * @internal
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
            mergeMap((ignored) => this.transactionHttp.announceAggregateBonded(signedAggregateBondedTransaction)),
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
      if (unconfirmedTransactions.length) {
        // the apostille has been sent to the network
        return true;
      } else {
        // then check transactions
        const transactions = await this._transactions(publicAccount).toPromise();
        if (transactions.length > 0) {
          return true;
        } else {
          return false;
        }
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
  public async isOwned(address: Address): Promise<boolean> {
    try {
      const cosignatories = await this.getCosignatories(address);
      if (cosignatories.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      const errorText = JSON.parse(error.response.text);
      if (errorText.code === 'ResourceNotFound') {
        return false;
      } else {
        throw new Error(error);
      }
    }
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
      this.fetchAllTransactions(publicAccount).subscribe((transactions: Transaction[]) => {
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
    );
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
}
