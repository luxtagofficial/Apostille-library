import { sortBy } from 'lodash';
import { AccountHttp, AccountInfo, Address, AggregateTransaction, BlockchainHttp, NetworkType, PublicAccount, Transaction, TransactionHttp, TransactionInfo, TransactionType, TransferTransaction } from 'nem2-sdk';
import { Observable } from 'rxjs';
import { Errors, HistoricalEndpoints, TransactionsStreams } from '../index';

export class ApostilleAccount {
    /**
     * @description the network type of the HD apostille account
     * @type {NetworkType}
     * @memberof Apostille
     */

    /**
     * @param {PublicAccount} publicAccount
     */
    constructor(public readonly publicAccount: PublicAccount) {}

    /**
     * @description - get first transaction
     * @static
     * @returns {Promise<boolean>}
     * @memberof ApostilleAccount
     */
    public async isOwned(): Promise<boolean> {
        const cossignatories = await this.getCosignatories();
        if (cossignatories.length > 0) {
            return true;
        }
        return false;
    }

    /**
     * @description - get cosignatories of the account
     * @static
     * @param {string} urls
     * @returns {Promise<PublicAccount[]>}
     * @memberof ApostilleAccount
     */
    public getCosignatories(urls?: string): Promise<PublicAccount[]> {
        let accountHttp: AccountHttp;
        if (urls) {
            accountHttp = new AccountHttp(urls);
        } else {
            if (this.publicAccount.address.networkType === NetworkType.MIJIN) {
                throw new Error(Errors[Errors.MIJIN_ENDPOINT_NEEDED]);
            }
            accountHttp = new AccountHttp(HistoricalEndpoints[this.publicAccount.address.networkType]);
        }
        return new Promise(async (resolve, reject) => {
            accountHttp.getMultisigAccountInfo(this.publicAccount.address).subscribe(
                (multisigAccountInfo) => {
                    resolve(multisigAccountInfo.cosignatories);
                },
                (err) => reject(err),
            );
        });
    }

    /**
     * @description - get Transaction by ID
     * @param {string} transactionID
     * @returns {Observable<Transaction>}
     * @memberof ApostilleAccount
     */
    public getTransactionById(transactionID: string, urls?: string): Observable<Transaction> {
        let transactionHttp: TransactionHttp;
        if (urls) {
            transactionHttp = new TransactionHttp(urls);
        } else {
            if (this.publicAccount.address.networkType === NetworkType.MIJIN) {
                throw new Error(Errors[Errors.MIJIN_ENDPOINT_NEEDED]);
            }
            transactionHttp = new TransactionHttp(HistoricalEndpoints[this.publicAccount.address.networkType]);
        }
        return transactionHttp.getTransaction(transactionID);
    }

    /**
     * @description - get creationTransaction Info
     * @param {string} urls
     * @returns {Promise<string>}
     * @memberof ApostilleAccount
     */
    public async getCreationTransactionInfo(): Promise<TransactionInfo> {
        const transaction: TransferTransaction = await this.getCreationTransaction();
        if (transaction.transactionInfo instanceof TransactionInfo) {
            return transaction.transactionInfo;
        }
        throw new Error(Errors[Errors.COULD_NOT_FOUND_TRANSACTION_INFO]);
    }

    /**
     * @description - get first transaction
     * @param {string} urls
     * @returns {Promise<TransferTransaction>}
     * @memberof ApostilleAccount
     */
    public getCreationTransaction(urls?: string): Promise<TransferTransaction> {
        let accountHttp: AccountHttp;
        let blockchainHttp: BlockchainHttp;
        if (urls) {
            accountHttp = new AccountHttp(urls);
            blockchainHttp = new BlockchainHttp(urls);
        } else {
            if (this.publicAccount.address.networkType === NetworkType.MIJIN) {
                throw new Error(Errors[Errors.MIJIN_ENDPOINT_NEEDED]);
            }
            accountHttp = new AccountHttp(HistoricalEndpoints[this.publicAccount.address.networkType]);
            blockchainHttp = new BlockchainHttp(HistoricalEndpoints[this.publicAccount.address.networkType]);
        }
        return new Promise((resolve, reject) => {
            accountHttp.getAccountInfo(this.publicAccount.address).subscribe(
                (accountInfo: AccountInfo) => {
                    const firstTransactionBlock = accountInfo.addressHeight.lower;
                    // find the first block of this account
                    blockchainHttp.getBlockTransactions(firstTransactionBlock).subscribe(
                        (block: Transaction[]) => {
                            // console.log(JSON.stringify(block));
                            const filteredTransaction: Transaction[] = [];
                            for (const transaction of block) {
                                if (transaction instanceof TransferTransaction) {
                                    const transferTransaction: TransferTransaction = transaction;
                                    if (this.equals(transferTransaction.recipient)) {
                                        filteredTransaction.push(transaction);
                                    }
                                } else if (transaction instanceof AggregateTransaction) {
                                    if (transaction.type === TransactionType.AGGREGATE_COMPLETE) {
                                        for (const innerTransaction of transaction.innerTransactions) {
                                            if (innerTransaction instanceof TransferTransaction) {
                                                if (this.equals(innerTransaction.recipient)) {
                                                    filteredTransaction.push(transaction);
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            // sort the block by index
                            const sortedTransaction: Transaction[] = sortBy(
                                filteredTransaction, ['transactionInfo.index']);
                            if (sortedTransaction.length > 0) {
                                const firstTransaction = sortedTransaction[0];
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
                        },
                        (err) => {
                            reject(err);
                        });
                },
                (err) => {
                    reject(err);
                });
        });
    }

    /**
     * Compares address for equality.
     * @param Address
     * @returns {boolean}
     * @memberof ApostilleAccount
     */
    public equals(address: Address) {
        return this.publicAccount.address.plain() === address.plain();
    }

    /**
     * @description - get transaction streams from the account
     * @static
     * @param {string} urls
     * @returns {TransactionsStreams}
     * @memberof ApostilleAccount
     */
    public monitor(urls?: string): TransactionsStreams {
        return new TransactionsStreams(this, urls);
    }

}
