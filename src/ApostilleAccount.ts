import Fuse from 'fuse.js';
import { AccountHttp, BlockchainHttp, PublicAccount } from 'nem2-sdk';

export class ApostilleAccount {
    /**
     * @param publicKey
     * @param address
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
     * @param {string} address
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
                            // search the object which hold the address from transactions
                            const transactions =  this.searchRecipientAddressInsideArray(block);
                            const innerTransactions = transactions[0].innerTransactions;

                            // search the inner transaction which has the current address from first transactions
                            const innerTransaction = this.searchRecipientAddressInsideArray(innerTransactions);
                            resolve(innerTransaction[0]);
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

    private searchRecipientAddressInsideArray(array: object[]): object {
        const options = {
            caseSensitive: true,
            distance: 100,
            keys: [
                'innerTransactions.recipient.address',
                'recipient.address',
            ],
            location: 0,
            maxPatternLength: 32,
            minMatchCharLength: 20,
            shouldSort: true,
            threshold: 0,
        };
        const fuse = new Fuse(array, options);
        const result = fuse.search(this.account.address.plain());

        return result;
    }

}
