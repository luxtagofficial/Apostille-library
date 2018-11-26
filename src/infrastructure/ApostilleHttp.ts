import { sortBy } from 'lodash';
import { AccountHttp, Address, AggregateTransaction, Listener, PublicAccount, QueryParams, SignedTransaction, Transaction, TransactionHttp, TransactionInfo, TransferTransaction } from 'nem2-sdk';
import { filter, mergeMap } from 'rxjs/operators';
import { Errors } from '../types/Errors';

class ApostilleHttp {

    private transactionHttp: TransactionHttp;
    private accountHttp: AccountHttp;

    public constructor(url: string) {
        this.transactionHttp = new TransactionHttp(url);
        this.accountHttp = new AccountHttp(url);
    }

    public announce(signedTransaction: SignedTransaction): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.transactionHttp.announce(signedTransaction)
            .subscribe((x) => resolve(x), (err) => reject(err));
        });
    }

    public announceAggregateBonded(
        cosignatoryAccount: PublicAccount,
        signedAggregateBondedTransaction: SignedTransaction,
        signedLockFundsTransaction: SignedTransaction,
        listener: Listener): void {

        listener.open().then(() => {

            this.transactionHttp
                .announce(signedLockFundsTransaction)
                .subscribe((x) => console.log(x), (err) => console.error(err));

            listener
                .confirmed(cosignatoryAccount.address)
                .pipe(
                    filter((transaction) => transaction.transactionInfo !== undefined
                        && transaction.transactionInfo.hash === signedLockFundsTransaction.hash),
                    mergeMap((ignored) => this.transactionHttp.announceAggregateBonded(
                        signedAggregateBondedTransaction)),
                )
                .subscribe((announcedAggregateBonded) => console.log(announcedAggregateBonded),
                    (err) => console.error(err));
        });
    }

    /**
     * @description - cheks on chain if there are any transactions announced
     * @returns {Promise<boolean>}
     * @memberof ApostilleAccount
     */
    public async isCreated(publicAccount: PublicAccount): Promise<boolean> {
        try {
            const unconfirmedTransactions = await this._unconfirmedTransactions(publicAccount);
            if (unconfirmedTransactions.length) {
                // the apostille has been sent to the network
                return true;
            } else {
                // then check transactions
                const transactions = await this._transactions(publicAccount);
                if (transactions.length) {
                    return true;
                } else {
                    return true;
                }
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * @description - get cosignatories of the account
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
     * @description - get first transaction
     * @static
     * @returns {Promise<boolean>}
     * @memberof ApostilleHttp
     */
    public async isOwned(address: Address): Promise<boolean> {
        try {
            const cossignatories = await this.getCosignatories(address);
            if (cossignatories.length > 0) {
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
                throw new Error(Errors[Errors.COULD_NOT_FOUND_TRANSACTION_INFO]);
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
            this._fetchAllTransactions(publicAccount).then((transactions: Transaction[]) => {
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
                            resolve (firstInnerTransaction);
                        } else {
                            reject (Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
                        }
                    } else {
                        reject (Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
                    }
                } else {
                    reject (Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
                }
            });
        });
    }

    /**
     * Fetch all transactions pertaining to this publicAccount
     *
     * @returns {Promise<Transaction[]>}
     * @memberof CertificateHistory
     */
    public _fetchAllTransactions(publicAccount: PublicAccount): Promise<Transaction[]> {
        return new Promise<Transaction[]>(async (resolve, reject) => {
            let nextId: string = '';
            const pageSize: number = 100;
            let lastPageSize: number = 100;
            const allTransactions: Transaction[] = [];
            while (lastPageSize === pageSize) {
                const queryParams = new QueryParams(pageSize, nextId !== '' ? nextId : undefined);
                await this._transactions(publicAccount, queryParams).then((transactions) => {
                    lastPageSize = transactions.length;
                    if (lastPageSize < 1) { return; }
                    nextId = transactions[transactions.length - 1].transactionInfo!.id;
                    allTransactions.push(...transactions);
                }).catch((err) => {
                    reject(err);
                });
            }
            resolve(allTransactions);
        });
    }

    private _unconfirmedTransactions(
        publicAccount: PublicAccount,
        queryParams?: QueryParams | undefined): Promise<Transaction[]> {

        return new Promise<Transaction[]>((resolve, reject) => {
            this.accountHttp.unconfirmedTransactions(
                publicAccount,
                queryParams,
            ).subscribe((unconfirmedTransactions) => {
                resolve(unconfirmedTransactions);
            }, (err) => {
                // network or comunication problem
                resolve(err);
            });
        });

    }

    private _transactions(
        publicAccount: PublicAccount,
        queryParams?: QueryParams | undefined): Promise<Transaction[]> {

        return new Promise<Transaction[]>((resolve, reject) => {
            this.accountHttp.transactions(
                publicAccount,
                queryParams,
            ).subscribe((transactions) => {
                resolve(transactions);
            }, (err) => {
                // network or comunication problem
                resolve(err);
            });
        });

    }

}

export { ApostilleHttp };
