import { Account, PublicAccount } from 'nem2-sdk';
import { Errors } from '../../types/Errors';
/**
 * @description - a class wrapping the transaction initiator account
 * @class Initiator
 */
class Initiator {
  /**
   * Creates an instance of Initiator.
   * @param {Account} account - the first signing account
   * @param {PublicAccount} [multisigAccount] - public account of the multisisg account if
   *                                            transaction is coming from a multisisg account
   * @param {boolean} [isComplete] - whetehr the transaction is aggregate complete or bounded
   * @param {Account[]} [cosignatories] - array of cosignatories accounts
   * @memberof Initiator
   */
  constructor(
    public readonly account: Account,
    public readonly multisigAccount?: PublicAccount,
    private isComplete?: boolean,
    public readonly cosignatories?: Account[],
  ) {
    if (multisigAccount) {
      if (isComplete === undefined) {
        throw new Error(Errors[Errors.MISSING_IS_COMPLETE_ARGUMENT]);
      }
    }
  }
  /**
   * @description - gets if the aggregate transaction that wil be created is compleet or bounded
   * @readonly
   * @type {boolean}
   * @memberof Initiator
   */
  get complete(): boolean {
    // TODO: there should be a function to check if all cosignatories are present
    if (this.isComplete) {
      return true;
    }
    return false;
  }

}

export { Initiator };

