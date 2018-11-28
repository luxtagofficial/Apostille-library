import { Account, AggregateTransaction, Deadline, LockFundsTransaction, ModifyMultisigAccountTransaction, Mosaic, MultisigCosignatoryModification, MultisigCosignatoryModificationType, PlainMessage, PublicAccount, SignedTransaction, Transaction, TransferTransaction, UInt64, XEM } from 'nem2-sdk';
import { HashFunction } from '../../hash/HashFunction';
import { Errors } from '../../types/Errors';

export class ApostillePublicAccount {
  /**
   * @param {PublicAccount} publicAccount
   * @memberof ApostillePublicAccount
   */
  constructor(public readonly publicAccount: PublicAccount) {
  }

  /**
   * @description - returning a transfer transaction for the apostille account
   * @param {string} rawData - the raw data to send in the payload
   * @param {(Mosaic[] | Mosaic[])} [mosaics=[]] - array of mosiacs to attach
   * @returns {TransferTransaction}
   * @memberof ApostillePublicAccount
   */
  public update(
    rawData: string,
    mosaics: Mosaic[] = [],
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
   * @description - modify ownership of the apostille account by modifying the multisig contract
   * @param {PublicAccount[]} newOwners - array of owners to add
   * @param {PublicAccount[]} OwnersToRemove - array of owners to remove
   * @param {number} quorum - relative quorum (refer to http://bit.ly/2Jnff1r)
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

    ownersToRemove.forEach((cosignatory) => {
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
   * @description creates a lockfunds transaction for an aggregate bonded transaction
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
   * @description sign normal transaction (can sign update(if normal transaction) and lockFundsTransaction)
   * @param {TransferTransaction} transferTransaction
   * @param {Account} initiatorAccount
   * @param {HashFunction} [hashFunction] - only hash transfer transaction message
   * @returns
   * @memberof ApostillePublicAccount
   */
  public sign(
    transaction: TransferTransaction | Transaction,
    initiatorAccount: Account,
    hashFunction?: HashFunction) {
    if (initiatorAccount.address.networkType !== this.publicAccount.address.networkType) {
      throw new Error(Errors[Errors.NETWORK_TYPE_MISMATCHED]);
    }

    let tx = transaction;

    // first we create the creation transaction as a transfer transaction
    if (hashFunction && tx instanceof TransferTransaction) {
      // for digital files it's a good idea to hash the content of the file
      // but can be used for other types of information for real life assets

      const rawData = tx.message.payload;

      const hash = hashFunction.signedHashing(
        rawData,
        initiatorAccount.privateKey,
        this.publicAccount.address.networkType,
      );

      tx = this.update(hash, tx.mosaics);
    }

    const signedTransaction = initiatorAccount.sign(tx);

    return signedTransaction;
  }

  /**
   * @description signed aggregate transaction (can sign update(if multisig transaction) and transfer transaction)
   * @param {Transaction} transaction
   * @param {Account[]} signers
   * @param {boolean} isCompleteCosignatories
   * @returns
   * @memberof ApostillePublicAccount
   */
  public signAggregate(transaction: Transaction, signers: Account[], isCompleteCosignatories: boolean) {
    if (isCompleteCosignatories) {
       return this._signTransferTransactionAgregateComplete(transaction, signers);
    } else {
      return this._signTransferTransactionAggregateBonded(transaction, signers);
    }
  }

  private _signTransferTransactionAgregateComplete(
    transaction: Transaction,
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
    transaction: Transaction,
    signers: Account[],
  ): SignedTransaction {
    const aggregateTransaction = AggregateTransaction.createBonded(
      Deadline.create(),
      [transaction.toAggregate(this.publicAccount)],
      this.publicAccount.address.networkType);

    const signedAggregateTransaction = this._signAggregate(aggregateTransaction, signers);

    return signedAggregateTransaction;
  }

  private _signAggregate(aggregateTransaction: AggregateTransaction, signers: Account[]): SignedTransaction {
    // fetch the first signer
    const mainSigner = signers.shift();

    if (mainSigner === undefined) {
      throw Error(Errors[Errors.UNABLE_TO_SIGN_AGGREGATE_TRANSACTION]);
    }

    // init signitTransaction
    let signedTransaction: SignedTransaction;

    if (signers.length === 0) {
      // it should be a 1-n account
      signedTransaction = mainSigner.sign(aggregateTransaction);
    } else {
      // if we have cosignatories that needs to sign
      signedTransaction = mainSigner.signTransactionWithCosignatories(
        aggregateTransaction,
        signers,
      );
    }

    return signedTransaction;
  }
}
