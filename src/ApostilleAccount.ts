import { sortBy } from 'lodash';
import { AccountHttp, Address, BlockchainHttp, MultisigAccountInfo, NetworkType, PublicAccount, Transaction, TransactionHttp, TransactionInfo, TransactionType } from 'nem2-sdk';
import { Observable } from 'rxjs';
import { Errors, HistoricalEndpoints, TransactionsStreams } from '../index';

export class ApostilleAccount {
    /**
     * @description the network type of the HD apostille account
     * @type {NetworkType}
     * @memberof Apostille
     */
    public urls: string;

    /**
     * @param {PublicAccount} publicAccount
     */
    constructor(
        public readonly publicAccount: PublicAccount,
        urls?: string,
        ) {
            if (urls) {
                this.urls = urls;
            } else {
                if (publicAccount.address.networkType === NetworkType.MIJIN) {
                    throw new Error(Errors[Errors.MIJIN_ENDPOINT_NEEDED]);
                }
                this.urls = HistoricalEndpoints[publicAccount.address.networkType];
            }
        }

    /**
     * @description - get first transaction
     * @static
     * @param {string} urls
     * @returns {Promise<boolean>}
     * @memberof ApostilleAccount
     */
    public async isOwned() {
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
    public getCosignatories(): Promise<PublicAccount[]> {
        const accountHttp = new AccountHttp(this.urls);
        return new Promise(async (resolve, reject) => {
            accountHttp.getMultisigAccountInfo(this.publicAccount.address).subscribe(
                (accountInfo) => {
                    const multisigAccountInfo: MultisigAccountInfo = Object.assign(MultisigAccountInfo, accountInfo);

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
    public getTransactionById(transactionID: string): Observable<Transaction> {
        const transactionHttp = new TransactionHttp(this.urls);
        return transactionHttp.getTransaction(transactionID);
    }

    /**
     * @description - get creationTransaction Info
     * @param {string} urls
     * @returns {Promise<string>}
     * @memberof ApostilleAccount
     */
    public async getCreationTransactionInfo(): Promise<TransactionInfo> {
        const transaction: Transaction = await this.getCreationTransaction();
        if (transaction.transactionInfo instanceof TransactionInfo) {
            const transactionInfo: TransactionInfo = transaction.transactionInfo;
            return transactionInfo;
        }
        throw new Error(Errors[Errors.COULD_NOT_FOUND_TRANSACTION_INFO]);
    }

    /**
     * @description - get first transaction
     * @param {string} urls
     * @returns {Promise<Transaction>}
     * @memberof ApostilleAccount
     */
    public getCreationTransaction(): Promise<Transaction> {
        const accountHttp = new AccountHttp(this.urls);
        return new Promise((resolve, reject) => {
            accountHttp.getAccountInfo(this.publicAccount.address).subscribe(
                (accountInfo) => {
                    const blockchainHttp = new BlockchainHttp(this.urls);
                    const firstTransactionBlock = accountInfo.addressHeight.lower;
                    // find the first block of this account
                    blockchainHttp.getBlockTransactions(firstTransactionBlock).subscribe(
                        (block: any[]) => {
                            const filteredTransaction: any[] = [];
                            for (const transaction of block) {
                                if (transaction.type === TransactionType.TRANSFER) {
                                    const address = Address.createFromRawAddress(transaction.recipient.address);
                                    if (this.equals(address)) {
                                        filteredTransaction.push(transaction);
                                    }
                                } else if (transaction.type === TransactionType.AGGREGATE_COMPLETE) {
                                    for (const innerTransaction of transaction.innerTransactions) {
                                        if (innerTransaction.type === TransactionType.TRANSFER) {
                                            const address = Address.createFromRawAddress(
                                                innerTransaction.recipient.address);
                                            if (this.equals(address)) {
                                                filteredTransaction.push(transaction);
                                            }
                                            break;
                                        }
                                    }
                                }
                            }

                            // sort the block by index
                            const sortedTransaction = sortBy(filteredTransaction, ['transactionInfo.index']);
                            if (sortedTransaction[0].type === TransactionType.AGGREGATE_COMPLETE) {
                                // if the smallest index is aggregate transaction, then sort innertransaction by index
                                const sortedAggregateTransaction = sortBy(
                                    sortedTransaction[0].innerTransactions, ['transactionInfo.index']);
                                resolve(Object.assign(
                                    Transaction, sortedAggregateTransaction[0]));
                            }

                            resolve(Object.assign(Transaction, sortedTransaction[0]));
                        },
                        (err) => {
                            console.error(err.message);
                            reject(undefined);
                        });
                },
                (err) => {
                    console.error(err.message);
                    reject(undefined);
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
    public monitor(): TransactionsStreams {
        return new TransactionsStreams(this, this.urls);
    }

}
