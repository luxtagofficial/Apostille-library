import { Transaction, TransactionType } from 'nem2-sdk';
import { Initiator } from './Initiator';
/**
 * @description -  a transaction wrapper
 * @export
 * @interface IReadyTransaction
 */
export interface IReadyTransaction {
  /**
   * @description - the initiator of a transacction
   * @type {Initiator}
   * @memberof IReadyTransaction
   */
  readonly initiator: Initiator;
  /**
   * @description - the actual transaction
   * @type {Transaction}
   * @memberof IReadyTransaction
   */
  readonly transaction: Transaction;
  /**
   * @description - the type of the transaction
   * @type {TransactionType}
   * @memberof IReadyTransaction
   */
  readonly type: TransactionType;
}
