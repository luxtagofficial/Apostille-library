import { Account, AggregateTransaction, Deadline, PublicAccount, SignedTransaction, Transaction, TransactionType } from 'nem2-sdk';
import { Errors } from '../../types/Errors';

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
    return false;
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
    }
  }

  public sign(transaction: Transaction, transactionType: TransactionType): SignedTransaction {
    if (this.accountType === initiatorAccountType.HARDWARE_WALLET) {
      throw new Error(Errors[Errors.UNABLE_TO_SIGN_INITIATOR_TYPE_HARDWARE_WALLET]);
    }

    if (this.accountType === initiatorAccountType.ACCOUNT &&
        this.account instanceof Account) {
      return this._signWithAccount(transaction, this.account);
    }

    if (this.accountType === initiatorAccountType.MULTISIG_ACCOUNT &&
        this.multiSigAccount !== undefined) {
      return this._signWithMultiSig(transaction, this.multiSigAccount);
    }

    throw new Error(Errors[Errors.UNABLE_TO_SIGN]);
  }

  private _signWithAccount(transaction: Transaction, account: Account) {
    return account.sign(transaction);
  }

  private _signWithMultiSig(transaction: Transaction, multiSigAccount: IMultisigInitiator): SignedTransaction {
    if (transaction.TransactionType === TransactionType.AGGREGATE_COMPLETE ||
      transaction.TransactionType === TransactionType.AGGREGATE_BONDED) {
        return multiSigAccount.cosignatories.reduce((cosig, transaction) => {

        });
      }
    if (multiSigAccount.isComplete) {
      const aggregateTransaction = AggregateTransaction.createComplete(
        Deadline.create(),
        [transaction.toAggregate(account.publicAccount),
            sisterTransferTransaction.toAggregate(account.publicAccount)],
        NetworkType.MIJIN_TEST,
        [],
    );
    }
  }

  private _isAccountComplete(): boolean {
    return this.account instanceof Account;
  }

  private _isMultiSigAccountComplete(): boolean {
    if (this.multiSigAccount === undefined) {
      return false;
    }
    return this.multiSigAccount.isComplete;
  }

}
