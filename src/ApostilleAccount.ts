import { sortBy } from 'lodash';
import { AccountHttp, Address, BlockchainHttp, PublicAccount, TransactionType } from 'nem2-sdk';
import { TransactionsStreams } from './TransactionsStreams';

export class ApostilleAccount {
    /**
     * @param {PublicAccount} publicAccount
     */
    constructor(
        /**
         * The account apostille public account.
         */
        public readonly publicAccount: PublicAccount,
        ) {
        }

    public async isOwned(urls: string) {
        const cossignatories = await this.getCosignatories(urls);
        if (cossignatories.length > 0) {
            return true;
        }
        return false;
    }

    public getCosignatories(urls: string): Promise<object[]> {
        const accountHttp = new AccountHttp(urls);
        return new Promise(async (resolve, reject) => {
            accountHttp.getMultisigAccountInfo(this.publicAccount.address).subscribe(
                (accountInfo) => {
                    resolve(accountInfo.cosignatories);
                },
                (err) => reject(err),
            );
        });
    }

    /**
     * @description - get first transaction
     * @static
     * @param {string} urls
     * @returns {Promise<any>}
     * @memberof Verifier
     */
    public getCreationTransaction(urls: string): Promise<any> {
        const accountHttp = new AccountHttp(urls);
        return new Promise(async (resolve, reject) => {
            accountHttp.getAccountInfo(this.publicAccount.address).subscribe(
                (accountInfo) => {
                    const blockchainHttp = new BlockchainHttp(urls);
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
                                resolve(sortedAggregateTransaction[0]);
                            }

                            resolve(sortedTransaction[0]);
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
     */
    public equals(address: Address) {
        return this.publicAccount.address.plain() === address.plain();
    }

    public monitor(urls?: string): TransactionsStreams {
        if (urls) {
            return new TransactionsStreams(this, urls);
        }
        return new TransactionsStreams(this);
    }

}
