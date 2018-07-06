import { findIndex, sortBy, toUpper } from 'lodash';
import { AccountHttp, BlockchainHttp, PublicAccount } from 'nem2-sdk';

export class ApostilleAccount {
    /**
     * @param account
     */
    constructor(
        /**
         * The account apostille public account.
         */
        public readonly account: PublicAccount,
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
            accountHttp.getMultisigAccountInfo(this.account.address).subscribe(
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
            accountHttp.getAccountInfo(this.account.address).subscribe(
                (accountInfo) => {
                    const blockchainHttp = new BlockchainHttp(urls);
                    const firstTransactionBlock = accountInfo.addressHeight.lower;
                    blockchainHttp.getBlockTransactions(firstTransactionBlock).subscribe(
                        (block) => {
                            // sort the block by index
                            const sortedBlock = sortBy(block, ['transactionInfo.index']);
                            // find the first index of current address from the blockTransactions
                            const creationTransactionIndex = findIndex(sortedBlock, (o) => {
                                return o.recipient.address === toUpper(this.account.address.plain());
                            });

                            resolve(sortedBlock[creationTransactionIndex]);
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

}
