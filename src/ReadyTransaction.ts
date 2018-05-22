import { Transaction, TransactionType } from 'nem2-sdk';
import { Initiator } from './Initiator';

export interface IReadyTransaction {
  readonly initiator: Initiator;
  readonly transaction: Transaction;
  readonly type: TransactionType;
}
