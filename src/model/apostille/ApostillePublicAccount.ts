import { drop } from 'lodash';
import { Account, AccountHttp, AggregateTransaction, Deadline, LockFundsTransaction, ModifyMultisigAccountTransaction, Mosaic, MultisigCosignatoryModification, MultisigCosignatoryModificationType, PlainMessage, PublicAccount, QueryParams, SignedTransaction, TransferTransaction, UInt64, XEM } from 'nem2-sdk';
import { HashFunction } from '../../hash/HashFunction';
import { Errors } from '../../types/Errors';
import { IReadyTransaction } from '../transaction/ReadyTransaction';

export class ApostillePublicAccount {
    /**
     * @param {PublicAccount} publicAccount
     */
    constructor(public readonly publicAccount: PublicAccount) {
    }

    /**
     * @description - returning a transfer transaction for the apostille account
     * @param {string} rawData - the raw data to send in the payload
     * @param {(Mosaic[] | Mosaic[])} [mosaics=[]] - array of mosiacs to attache
     * @returns {TransferTransaction}
     * @memberof ApostillePublicAccount
     */
    public update(
        rawData: string,
        mosaics: Mosaic[] | Mosaic[] = [],
    ): TransferTransaction {
        const plainMessage = PlainMessage.create(rawData);

        const creationTransaction = TransferTransaction.create(
            Deadline.create(),
            this.publicAccount.address,
            mosaics,
            plainMessage,
            this.publicAccount.address.networkType,
        );

        return creationTransaction;
    }

    /**
     * @description - returning a signed transfer transaction for the apostille account
     * @param {string} rawData - the raw data to send in the payload
     * @param {(Mosaic[] | Mosaic[])} [mosaics=[]] - array of mosiacs to attache
     * @param {Account} initiatorAccount - the initiator of the transaction
     * @param {HashFunction} [hashFunction] - if provided will hash the raw data and add a magical byte to the hash
     * @returns {SignedTransaction}
     * @memberof ApostilleAccount
     */
    public updateAndSign(
        rawData: string,
        mosaics: Mosaic[] | Mosaic[] = [],
        initiatorAccount: Account,
        hashFunction?: HashFunction,
    ): SignedTransaction {
        if (initiatorAccount.address.networkType !== this.publicAccount.address.networkType) {
            throw new Error(Errors[Errors.NETWORK_TYPE_MISMATCHED]);
        }

        let data: string = rawData;
        // first we create the creation transaction as a transfer transaction
        if (hashFunction) {
            // for digital files it's a good idea to hash the content of the file
            // but can be used for other types of information for real life assets
            const hash = hashFunction.signedHashing(
                rawData,
                initiatorAccount.privateKey,
                this.publicAccount.address.networkType,
            );
            data = hash;
        }

        const creationTransaction = this.update(
            data,
            mosaics,
        );

        const signedTransaction = initiatorAccount.sign(creationTransaction);

        return signedTransaction;
    }

    /**
     * @description - modify ownership of the apostille account by modifying the multisisg contratc
     * @param {PublicAccount[]} newOwners - array of new owners
     * @param {PublicAccount[]} OwnersToRemove - array of owners to remove
     * @param {number} quorum - relative quorum (refer to own function above and/or http://bit.ly/2Jnff1r )
     * @param {number} minRemoval - relative number of minimum owners necessary to agree to remove 1/n owners
     * @returns {ModifyMultisigAccountTransaction}
     * @memberof ApostilleAccount
     */
    public transfer(
        newOwners: PublicAccount[],
        ownersToRemove: PublicAccount[],
        quorum: number,
        minRemoval: number,
    ): ModifyMultisigAccountTransaction {
        // the initiator must be a multisig account
        const modifications: MultisigCosignatoryModification[] = [];
        newOwners.forEach((cosignatory) => {
            modifications.push(
                new MultisigCosignatoryModification(
                    MultisigCosignatoryModificationType.Add,
                    cosignatory));
        });

        newOwners.forEach((cosignatory) => {
            modifications.push(
                new MultisigCosignatoryModification(
                    MultisigCosignatoryModificationType.Remove,
                    cosignatory));
        });

        const modifyMultisigAccountTransaction = ModifyMultisigAccountTransaction.create(
            Deadline.create(),
            quorum,
            minRemoval,
            modifications,
            this.publicAccount.address.networkType,
        );

        return modifyMultisigAccountTransaction;
    }

    /**
     * @description - modify ownership of the apostille account by modifying the multisisg contract
     * @param {PublicAccount[]} newOwners - array of new owners
     * @param {PublicAccount[]} OwnersToRemove - array of owners to remove
     * @param {number} quorum - relative quorum (refer to own function above and/or http://bit.ly/2Jnff1r )
     * @param {number} minRemoval - relative number of minimum owners necessary to agree to remove 1/n owners
     * @param {Account[]} signers - array of accounts that will sign the transaction
     * @param {boolean} isCompleteCosignatories - whether the transaction is an aggregate complete or bonded
     * @returns {SignedTransaction}
     * @memberof ApostillePublicAccount
     */
    public transferAndSign(
        newOwners: PublicAccount[],
        OwnersToRemove: PublicAccount[],
        quorum: number,
        minRemoval: number,
        signers: Account[],
        isCompleteCosignatories: boolean,
    ): IReadyTransaction {
        const transferTransaction = this.transfer(
            newOwners,
            OwnersToRemove,
            quorum,
            minRemoval,
        );

        if (isCompleteCosignatories) {
           return this._signTransferTransactionAgregateComplete(transferTransaction, signers);
        } else {
            return this._signTransferTransactionAggregateBonded(transferTransaction, signers);
        }
    }

    /**
     * @description returning lockFundTransactions that can be signed later on
     * @param {SignedTransaction} signedAggregateBondedTransaction
     * @returns {LockFundsTransaction}
     * @memberof ApostillePublicAccount
     */
    public lockFundsTransaction(signedAggregateBondedTransaction: SignedTransaction): LockFundsTransaction {
        const lockFundsTransaction = LockFundsTransaction.create(
            Deadline.create(),
            XEM.createRelative(10),
            UInt64.fromUint(480),
            signedAggregateBondedTransaction,
            this.publicAccount.address.networkType);

        return lockFundsTransaction;
    }

    /**
     * @description - returning signed lockFundsTransaction for announcing aggregate bonded
     * @param {SignedTransaction} signedAggregateBondedTransaction
     * @param {Account} signer
     * @returns {SignedTransaction}
     * @memberof ApostillePublicAccount
     */
    public lockFundsTransactionAndSign(
        signedAggregateBondedTransaction: SignedTransaction,
        signer: Account,
    ): SignedTransaction {
        // the lock need the signed aggregate transaction
        const lockFundsTransaction = this.lockFundsTransaction(signedAggregateBondedTransaction);
        // we sign the lock
        const signedLock = signer.sign(lockFundsTransaction);

        return signedLock;
    }

    /**
     * @description - cheks on chain if there are any transactions announced
     * @returns {Promise<boolean>}
     * @memberof ApostilleAccount
     */
    public isCreated(url: string): Promise<boolean> {
        // check if the apostille account has any transaction
        const accountHttp = new AccountHttp(url);
        return new Promise(async (resolve, reject) => {
            // we need to check unconfirmed transactions first
            await accountHttp.unconfirmedTransactions(
            this.publicAccount,
            new QueryParams(10),
            ).subscribe(
                async (unconfirmedTransactions) => {
                if (unconfirmedTransactions.length) {
                    // the apostille has been sent to the network
                    resolve(true);
                } else {
                    // then check transactions
                    await accountHttp.transactions(
                        this.publicAccount,
                        new QueryParams(10),
                    ).subscribe((transactions) => {
                        // if there is then the apostille has been created
                        if (transactions.length) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    },
                    (err) => {
                        // network or comunication problem
                        throw new Error(err.message);
                    });
                }
                },
                (err) => {
                    // network or comunication problem
                    throw new Error(err.message);
                },
            );
        });
    }

    /**
     * @description - get first transaction
     * @static
     * @returns {Promise<boolean>}
     * @memberof ApostilleAccount
     */
    public async isOwned(url: string): Promise<boolean> {
        try {
            const cossignatories = await this.getCosignatories(url);
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
     * @description - get cosignatories of the account
     * @returns {Promise<PublicAccount[]>}
     * @memberof ApostillePublicAccount
     */
    public getCosignatories(url: string): Promise<PublicAccount[]> {
        const accountHttp = new AccountHttp(url);

        return new Promise(async (resolve, reject) => {
            accountHttp.getMultisigAccountInfo(this.publicAccount.address).subscribe(
                (multisigAccountInfo) => {
                    resolve(multisigAccountInfo.cosignatories);
                },
                (err) => reject(err),
            );
        });
    }

    // /**
    //  * @description - get Transaction by ID
    //  * @param {string} transactionID
    //  * @returns {Observable<Transaction>}
    //  * @memberof ApostilleAccount
    //  */
    // public getTransactionById(transactionID: string, urls?: string): Promise<Transaction> {
    //     let transactionHttp: TransactionHttp;
    //     if (urls) {
    //         transactionHttp = new TransactionHttp(urls);
    //     } else {
    //         if (this.publicAccount.address.networkType === NetworkType.MIJIN) {
    //             throw new Error(Errors[Errors.MIJIN_ENDPOINT_NEEDED]);
    //         }
    //         transactionHttp = new TransactionHttp(HistoricalEndpoints[this.publicAccount.address.networkType]);
    //     }

    //     return new Promise<Transaction>((resolve, reject) => {
    //         transactionHttp.getTransaction(transactionID)
    //         .subscribe((transaction: Transaction) => {
    //             resolve(transaction);
    //         }, (err) => {
    //             reject(err);
    //         });
    //     });
    // }

    // /**
    //  * @description - get creationTransaction Info
    //  * @param {string} urls
    //  * @returns {Promise<string>}
    //  * @memberof ApostilleAccount
    //  */
    // public async getCreationTransactionInfo(urls?: string): Promise<TransactionInfo> {
    //     const transaction: TransferTransaction = await this.getCreationTransaction(urls);
    //     if (transaction.transactionInfo instanceof TransactionInfo) {
    //         return transaction.transactionInfo;
    //     }
    //     throw new Error(Errors[Errors.TRANSACTION_INFO_NOT_FOUND]);
    // }

    // /**
    //  * @description - get first transaction
    //  * @param {string} urls
    //  * @returns {Promise<TransferTransaction>}
    //  * @memberof ApostilleAccount
    //  */
    // public getCreationTransaction(urls?: string): Promise<TransferTransaction> {
    //     let fixUrl: string;

    //     if (urls) {
    //         fixUrl = urls;
    //     } else {
    //         fixUrl = HistoricalEndpoints[this.publicAccount.address.networkType];
    //     }

    //     return new Promise((resolve, reject) => {
    //         this.fetchAllIncomingTransactions(fixUrl).then((transactions: Transaction[]) => {
    //             if (transactions.length > 0) {
    //                 const firstTransaction = transactions[transactions.length - 1];
    //                 if (firstTransaction instanceof TransferTransaction) {
    //                     resolve (firstTransaction);
    //                 } else if (firstTransaction instanceof AggregateTransaction) {
    //                     // if the smallest index is aggregate transaction, then sort it by index
    //                     const innerTransactions = firstTransaction.innerTransactions;
    //                     const sortedInnerTransactions = sortBy(
    //                         innerTransactions, ['transactionInfo.index']);
    //                     const firstInnerTransaction = sortedInnerTransactions[0];
    //                     if (firstInnerTransaction instanceof TransferTransaction) {
    //                         resolve (firstInnerTransaction);
    //                     } else {
    //                         reject (Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
    //                     }
    //                 } else {
    //                     reject (Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
    //                 }
    //             } else {
    //                 reject (Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
    //             }
    //         });
    //     });
    // }

    // /**
    //  * Fetch all incoming transactions pertaining to this publicAccount
    //  *
    //  * @returns {Promise<Transaction[]>}
    //  * @memberof CertificateHistory
    //  */
    // public fetchAllIncomingTransactions(urls?: string): Promise<Transaction[]> {
    //     let fixUrls: string;

    //     if (urls) {
    //         fixUrls = urls;
    //     } else {
    //         fixUrls = HistoricalEndpoints[this.publicAccount.address.networkType];
    //     }
    //     return new Promise<Transaction[]>(async (resolve, reject) => {
    //         let nextId: string = '';
    //         const pageSize: number = 100;
    //         let lastPageSize: number = 100;
    //         const allTransactions: Transaction[] = [];
    //         while (lastPageSize === pageSize) {
    //             const queryParams = new QueryParams(pageSize, nextId !== '' ? nextId : undefined);
    //             await this.fetchTransactions(queryParams, fixUrls).then((transactions) => {
    //                 lastPageSize = transactions.length;
    //                 if (lastPageSize < 1) { return; }
    //                 nextId = transactions[transactions.length - 1].transactionInfo!.id;
    //                 allTransactions.push(...transactions);
    //             }).catch((err) => {
    //                 reject(err);
    //             });
    //         }
    //         resolve(allTransactions);
    //     });
    // }

    // /**
    //  * Fetch transaction with query params
    //  *
    //  * @private
    //  * @param {QueryParams} queryParams
    //  * @returns {Promise<Transaction[]>}
    //  * @memberof CertificateHistory
    //  */
    // public async fetchTransactions(
    //     queryParams: QueryParams,
    //     urls?: string,
    // ): Promise<Transaction[]> {
    //     let fixUrls: string;

    //     if (urls) {
    //         fixUrls = urls;
    //     } else {
    //         fixUrls = HistoricalEndpoints[this.publicAccount.address.networkType];
    //     }
    //     const accountHttp = new AccountHttp(fixUrls);
    //     return await new Promise<Transaction[]>((resolve, reject) => {
    //         accountHttp.transactions(
    //             this.publicAccount,
    //             queryParams)
    //         .subscribe((transactions: Transaction[]) => {
    //             resolve(transactions);
    //         }, (err) => {
    //             reject(err);
    //         });
    //     });
    // }

    private _signAggregate(aggregateTransaction: AggregateTransaction, signers: Account[]): SignedTransaction {
        // fetch the first signer
        const mainSigner = signers[0];

        // fetch the signer from index 1 till n
        const cosignatories = drop(signers);

        // init signitTransaction
        let signedTransaction: SignedTransaction;

        if (cosignatories.length === 0) {
            // it should be a 1-n account
            signedTransaction = mainSigner.sign(aggregateTransaction);
        } else {
            // if we have cosignatories that needs to sign
            signedTransaction = mainSigner.signTransactionWithCosignatories(
                aggregateTransaction,
                cosignatories,
            );
        }

        return signedTransaction;
    }

    private _signTransferTransactionAgregateComplete(
        transaction: ModifyMultisigAccountTransaction,
        signers: Account[],
    ): SignedTransaction {
        const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(),
            [transaction.toAggregate(this.publicAccount)],
            this.publicAccount.address.networkType,
            []);

        const signedAggregateTransaction = this._signAggregate(aggregateTransaction, signers);

        return signedAggregateTransaction;
    }

    private _signTransferTransactionAggregateBonded(
        transaction: ModifyMultisigAccountTransaction,
        signers: Account[],
    ): SignedTransaction {
        const aggregateTransaction = AggregateTransaction.createBonded(
            Deadline.create(),
            [transaction.toAggregate(this.publicAccount)],
            this.publicAccount.address.networkType);

        const signedAggregateTransaction = this._signAggregate(aggregateTransaction, signers);

        return signedAggregateTransaction;
    }
}
