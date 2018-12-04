import { Account, AggregateTransaction, Deadline, LockFundsTransaction, ModifyMultisigAccountTransaction, PublicAccount, SignedTransaction, Transaction, TransferTransaction } from 'nem2-sdk';
import { Errors } from '../types/Errors';

export interface IMultisigInitiator {
  isComplete: boolean;
  cosignatories: Account[];
}

export enum initiatorAccountType {
  ACCOUNT,
  MULTISIG_ACCOUNT,
  HARDWARE_WALLET,
}

/**
 * @description - a class wrapping the transaction initiator account
 * @class Initiator
 */
export class Initiator {
  /**
   * @description - gets if the aggregate transaction that wil be created is complete or bonded
   * @readonly
   * @type {boolean}
   * @memberof Initiator
   */
  get complete(): boolean {
    switch (this.accountType) {
      case initiatorAccountType.ACCOUNT:
        return this._isAccountComplete();
      case initiatorAccountType.HARDWARE_WALLET:
        return false;
      case initiatorAccountType.MULTISIG_ACCOUNT:
        return this._isMultiSigAccountComplete();
    }
  }

  get publicAccount(): PublicAccount {
    if (this.account instanceof Account) {
      return this.account.publicAccount;
    }
    return this.account;
  }

  /**
   * Creates an instance of Initiator.
   * @param {Account} account - the first signing account
   * @param {PublicAccount} [multisigAccount] - public account of the multisisg account if
   *                                            transaction is coming from a multisisg account
   * @param {boolean} [isComplete] - whether the transaction is aggregate complete or aggregate bonded
   * @param {Account[]} [cosignatories] - array of cosignatories accounts for multisigAccount
   * @memberof Initiator
   */
  constructor(
    public readonly account: Account | PublicAccount,
    public readonly accountType: initiatorAccountType = initiatorAccountType.ACCOUNT,
    public readonly multiSigAccount?: IMultisigInitiator,
  ) {
    if (accountType === initiatorAccountType.ACCOUNT) {
      if (account instanceof PublicAccount) {
        throw Error(Errors[Errors.INITIATOR_TYPE_ACCOUNT_REQUIRE_ACCOUNT]);
      }
    }
    if (accountType === initiatorAccountType.MULTISIG_ACCOUNT) {
      if (multiSigAccount === undefined) {
        throw Error(Errors[Errors.INITIATOR_TYPE_MULTISIG_REQUIRE_MULTISIG_INITIATOR]);
      }
      if (multiSigAccount.cosignatories.length < 1) {
        throw Error(Errors[Errors.INITIATOR_TYPE_MULTISIG_REQUIRE_AT_LEAST_ONE_COSIGNER]);
      }
    }
  }

  public sign(transaction: Transaction): SignedTransaction | boolean {
    if (this.accountType === initiatorAccountType.ACCOUNT) {
      if (this.account instanceof Account) {
        return this.account.sign(transaction);
      }
    } else if (this.accountType === initiatorAccountType.MULTISIG_ACCOUNT &&
        this.account instanceof PublicAccount) {
      const [firstCosigner, ...cosigners] = this.multiSigAccount!.cosignatories;
      let aggregateTransaction: AggregateTransaction | undefined;
      if (transaction instanceof TransferTransaction ||
        transaction instanceof ModifyMultisigAccountTransaction) {
        const refreshedTransaction = transaction.replyGiven(Deadline.create());
        if (this.complete) {
          aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(),
            [refreshedTransaction.toAggregate(this.account)],
            this.account.address.networkType,
            []);
        } else {
          aggregateTransaction = AggregateTransaction.createBonded(
            Deadline.create(),
            [refreshedTransaction.toAggregate(this.account)],
            this.account.address.networkType,
            []);
        }
      } else if (transaction instanceof AggregateTransaction) {
        aggregateTransaction = transaction;
      } else if (transaction instanceof LockFundsTransaction) {
        return firstCosigner.sign(transaction);
      }
      if (aggregateTransaction !== undefined) {
        return firstCosigner.signTransactionWithCosignatories(aggregateTransaction, cosigners);
      }
    }
    return false;
  }

  private _isAccountComplete(): boolean {
    return this.account instanceof Account;
  }

  private _isMultiSigAccountComplete(): boolean {
    return this.multiSigAccount!.isComplete;
  }

}
