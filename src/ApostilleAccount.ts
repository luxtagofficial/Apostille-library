import { drop, sortBy, uniqBy } from 'lodash';
import { Account, AccountHttp, AccountInfo, Address, AggregateTransaction, BlockchainHttp, Deadline, InnerTransaction, Listener, LockFundsTransaction, ModifyMultisigAccountTransaction, Mosaic, MultisigCosignatoryModification, MultisigCosignatoryModificationType, NetworkType, PlainMessage, PublicAccount, QueryParams, SignedTransaction, Transaction, TransactionAnnounceResponse, TransactionHttp, TransactionInfo, TransactionType, TransferTransaction, UInt64, XEM } from 'nem2-sdk';
import { Observable } from 'rxjs';
import { filter, flatMap } from 'rxjs/operators';
import { Errors } from './Errors';
import { HashFunction } from './hashFunctions/HashFunction';
import { HistoricalEndpoints } from './HistoricalEndpoints';
import { Initiator } from './Initiator';
import { IReadyTransaction } from './IReadyTransaction';
import { TransactionsStreams } from './TransactionsStreams';

export class ApostilleAccount {

    /**
     * @description - an array of all the transaction before they get announced to the network
     * @private
     * @type {IReadyTransaction[]}
     * @memberof ApostilleAccount
     */
    protected transactions: IReadyTransaction[] = [];

    /**
     * @description - whether the apostille was created or not
     * @private
     * @type {boolean}
     * @memberof Apostille
     */
    protected creatorAccount;
    // tslint:disable-next-line:variable-name
    private _created: boolean = false;
    /**
     * @description - whether the apostille creation transaction was announced to the network
     * @private
     * @type {boolean}
     * @memberof ApostilleAccount
     */
    private creationAnnounced: boolean = false;
    /**
     * @description - the account that made the creation transaction
     * @private
     * @memberof ApostilleAccount
     */
    /**
     * @description - the apostille hash (magical byte + hash)
     * @private
     * @memberof ApostilleAccount
     */
    private hash;

    /**
     * @param {PublicAccount} publicAccount
     */
    constructor(public readonly publicAccount: PublicAccount) {}

    /**
     * @description - create a creation transaction for the apostille account
     * @param {Initiator} initiatorAccount - the initiator of the transaction
     * @param {string} rawData - the raw data to send in the payload
     * @param {(Mosaic[] | Mosaic[])} [mosaics=[]] - array of mosiacs to attache
     * @param {HashFunction} [hashFunction] - if provided will hash the raw data and add a magical byte to the hash
     * @returns {Promise<void>}
     * @memberof ApostilleAccount
     */
    public async create(
        initiatorAccount: Initiator,
        rawData: string,
        mosaics: Mosaic[] | Mosaic[] = [],
        hashFunction?: HashFunction,
    ): Promise<void> {
        if (initiatorAccount.account.address.networkType !== this.publicAccount.address.networkType) {
            throw new Error(Errors[Errors.NETWORK_TYPE_MISMATCHED]);
        }
        // check if the apostille was already created locally or on chain
        await this.isCreated().then(() => {
        if (this._created) {
            throw new Error(Errors[Errors.APOSTILLE_ALREADY_CREATED]);
        }
        this.creatorAccount = initiatorAccount;
        let plainMessage: PlainMessage;
        // first we create the creation transaction as a transfer transaction
        if (hashFunction) {
            // for digital files it's a good idea to hash the content of the file
            // but can be used for other types of information for real life assets
            this.hash = hashFunction.signedHashing(
                rawData,
                initiatorAccount.account.privateKey,
                this.publicAccount.address.networkType,
            );
            plainMessage = PlainMessage.create(this.hash);
        } else {
            plainMessage = PlainMessage.create(rawData);
        }

        const creationTransaction = TransferTransaction.create(
            Deadline.create(),
            this.publicAccount.address,
            mosaics,
            plainMessage,
            this.publicAccount.address.networkType,
        );

        const readyCreation = this.getIReadyTransaction(initiatorAccount, creationTransaction);

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
     * @memberof ApostilleAccount
     */
    public async update(
        initiatorAccount: Initiator,
        message: string,
        mosaics: Mosaic[] | Mosaic[] = [],
    ): Promise<void> {
        if (!this._created) {
            // we test locally first to avoid testing on chain evrytime we update
            await this.isCreated();
            if (!this._created) {
                throw new Error(Errors[Errors.APOSTILLE_NOT_CREATED]);
            }
        }
        // we create the update transaction
        const updateTransaction = TransferTransaction.create(
            Deadline.create(),
            this.publicAccount.address,
            mosaics,
            PlainMessage.create(message),
            this.publicAccount.address.networkType,
        );

        // we prepare the transaction to push it in the array
        const readyUpdate = this.getIReadyTransaction(initiatorAccount, updateTransaction);
        this.transactions.push(readyUpdate);
    }

    /**
     * @description - announce all transactions to the network
     * @param {string} [urls] - endpoint url
     * @returns {Promise<void>}
     * @memberof ApostilleAccount
     */
    public async announce(urls?: string): Promise<void> {
        await this.isCreated().then(async () => {
            if (!this._created) {
                throw new Error(Errors[Errors.APOSTILLE_NOT_CREATED]);
            }

            const filteredUrls = this.filterUrls(urls);
            const transactionHttp = new TransactionHttp(filteredUrls);
            const listener = new Listener(filteredUrls);
            let readyTransfer: IReadyTransaction[] = [];

            this.transactions.forEach(async (readyTransaction) => {
                if (readyTransaction.type === TransactionType.AGGREGATE_COMPLETE) {
                    // if aggregate complete check if trensfer transaction has transaction to announce
                    if (readyTransfer.length > 0) {
                        await this.announceTransfer(readyTransfer, transactionHttp);
                        readyTransfer = [];
                    }

                    await this.announceAggregateTransactionComplete(readyTransaction, transactionHttp);

                } else if (readyTransaction.type === TransactionType.AGGREGATE_BONDED) {
                    // if aggregate bounded check if trensfer transaction has transaction to announce
                    if (readyTransfer.length > 0) {
                        await this.announceTransfer(readyTransfer, transactionHttp);
                        readyTransfer = [];
                    }
                    await this.announceAggregateTransactionBounded(readyTransaction, transactionHttp, listener);
                } else {
                    // if it is not aggregate transaction keep piling them in for an aggregate aggregate
                    readyTransfer.push(readyTransaction);
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
     * @description - cheks on chain if there are any transactions announced
     * @param {string} [urls] - enpoint url
     * @returns {Promise<boolean>}
     * @memberof ApostilleAccount
     */
    public isCreated(urls?: string): Promise<boolean> {
        // check if the apostille account has any transaction
        const accountHttp = new AccountHttp(this.filterUrls(urls));
        return new Promise(async (resolve, reject) => {
            await accountHttp.transactions(
            this.publicAccount,
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

    /**
     * @description - modify ownership of the apostille account by modifying the multisisg contratc
     * @param {Account[]} signers - array of accounts that will sign the transaction
     * @param {boolean} complete - whether the transaction is an aggregate compleet or bounded
     * @param {PublicAccount[]} newOwners - array of new owners
     * @param {PublicAccount[]} OwnersToRemove - array of owners to remove
     * @param {number} quorumDelta - relative quorum (refer to own function above and/or http://bit.ly/2Jnff1r )
     * @param {number} minRemovalDelta - relative number of minimum owners necessary to agree to remove 1/n owners
     * @memberof ApostilleAccount
     */
    public transfer(
        signers: Account[],
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
            this.publicAccount.address.networkType,
        );
        let initiatorApostille: Initiator;
        const cosignatories = drop(signers);
        let readyModification: IReadyTransaction;
        if (complete) {
            // create an incomplete initiator
            initiatorApostille = new Initiator(
                signers[0],
                this.publicAccount,
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
                this.publicAccount,
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
        return new TransactionsStreams(this, new Listener(this.filterUrls(urls)));
    }

    /**
     * @description - sets whether the apostille was created
     * @memberof ApostilleAccount
     */
    set created(value: boolean) {
        this._created = value;
    }

    /**
     * @description - gets the hash included in the payload of the creation transaction
     * @readonly
     * @type {(string | undefined)}
     * @memberof ApostilleAccount
     */
    get creationHash(): string | undefined {
        return this.hash;
    }

    private getIReadyTransaction(
        initiator: Initiator,
        transaction: Transaction,
        ): IReadyTransaction {
            // we prepare the transaction to push it in the array
        let type: TransactionType;
        // we prepare the transaction to push it in the array
        if (initiator.multisigAccount) {
            if (initiator.complete) {
                // aggregate complete transaction
                type = TransactionType.AGGREGATE_COMPLETE;
            } else {
                // aggregate bounded
                type = TransactionType.AGGREGATE_BONDED;
            }
        } else {
            // transafer transaction
            type = TransactionType.TRANSFER;
        }
        return {
            initiator,
            transaction,
            type,
        };
    }

    private filterUrls(urls: string | undefined): string {
        if (urls) {
            if (this.publicAccount.address.networkType === NetworkType.MAIN_NET
                || this.publicAccount.address.networkType === NetworkType.TEST_NET) {
                console.warn('To fetch a far far away transaction a historical node is needed');
            }
            return urls;
        } else {
            if (this.publicAccount.address.networkType === NetworkType.MIJIN) {
                throw new Error(Errors[Errors.MIJIN_ENDPOINT_NEEDED]);
            }
            return HistoricalEndpoints[this.publicAccount.address.networkType];
        }
    }

    /**
     * @description - announce transfer transactions as aggregate if more than 1
     * @private
     * @param {IReadyTransaction[]} transactions - array of transfer transactions and thier initiators
     * @param {TransactionHttp} transactionHttp - transactionHTTP object
     * @returns {Promise<void>}
     * @memberof ApostilleAccount
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
            // we can use chunk from lodash

            // we extract unique initiators
            const initiators = uniqBy(transactions, 'initiator');
            const cosignatories: Account[] = [];
            for (let index = 1; index < initiators.length; index++) {
                // we create a cosignatory array excluding the first initiator
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

    private async announceAggregateTransactionComplete(
        readyTransaction: IReadyTransaction, transactionHttp: TransactionHttp): Promise<void> {
        if (!readyTransaction.initiator.multisigAccount) {
            throw Error(Errors[Errors.AGGREGATE_COMPLETE_NEED_MULTISIG_ACCOUNT]);
        }

        const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(),
            [readyTransaction.transaction.toAggregate(readyTransaction.initiator.multisigAccount)],
            NetworkType.MIJIN_TEST,
            [],
        );
        // then announce aggregate compleet
        let signedTransaction: SignedTransaction;
        if (readyTransaction.initiator.cosignatories) {
            // if we have cosignatories that needs to sign
            signedTransaction = readyTransaction.initiator.account.signTransactionWithCosignatories(
                aggregateTransaction,
                readyTransaction.initiator.cosignatories,
            );
        } else {
            // it should be a 1-n account
            signedTransaction = readyTransaction.initiator.account.sign(aggregateTransaction);
        }
        await transactionHttp.announce(signedTransaction).subscribe(
            (x) => console.log(x),
            (err) => console.error(err));
    }

    private async announceAggregateTransactionBounded(
        readyTransaction: IReadyTransaction,
        transactionHttp: TransactionHttp,
        listener: Listener) {
        if (!readyTransaction.initiator.multisigAccount) {
            throw Error(Errors[Errors.AGGREGATE_BOUNDED_NEED_MULTISIG_ACCOUNT]);
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
            filter((transaction: any) => transaction.transactionInfo !== undefined
                    && transaction.transactionInfo.hash === signedLock.hash),
            flatMap(() => transactionHttp.announceAggregateBonded(signedTransaction)),
            ).subscribe(
            (announcedAggregateBonded) => console.log(announcedAggregateBonded),
            (err) => console.error(err));
        });

    }
}
