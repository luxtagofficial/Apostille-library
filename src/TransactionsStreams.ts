import { AggregateTransaction, CosignatureSignedTransaction, Listener, Transaction, TransactionStatusError } from 'nem2-sdk';
import { Observable } from 'rxjs';
import { ApostilleAccount } from '../index';

export class TransactionsStreams {

  constructor(
    public readonly apostilleAccount: ApostilleAccount,
    public readonly listener: Listener,
  ) {}

  /**
   * @description Returns an observable stream of Transaction for this Apostille Account.
   * Each time a transaction is in confirmed state an it involves this Apostille Account,
   * it emits a new Transaction in the event stream.
   * @returns {Observable<Transaction>} an observable stream of Transaction with state confirmed
   * @memberof TransactionsStream
   */
  public onConfirmed(): Promise<Observable<Transaction>> {
    console.log('Opening Connection...');
    return this.listener.open().then(() => {
      return this.listener.confirmed(this.apostilleAccount.publicAccount.address);
    });
  }

  public onUnconfirmedAdded(): Promise<Observable<Transaction>> {
    console.log('Opening Connection...');
    return this.listener.open().then(() => {
      return this.listener.unconfirmedAdded(this.apostilleAccount.publicAccount.address);
    });
  }

  public onUnconfirmedRemoved(): Promise<Observable<string>> {
    console.log('Opening Connection...');
    return this.listener.open().then(() => {
      return this.listener.unconfirmedRemoved(this.apostilleAccount.publicAccount.address);
    });
  }

  public onAggregateBondedAdded(): Promise<Observable<AggregateTransaction>> {
    console.log('Opening Connection...');
    return this.listener.open().then(() => {
      return this.listener.aggregateBondedAdded(this.apostilleAccount.publicAccount.address);
    });
  }

  public onAggregateBondedRemoved(): Promise<Observable<AggregateTransaction>> {
    console.log('Opening Connection...');
    return this.listener.open().then(() => {
      return this.listener.aggregateBondedAdded(this.apostilleAccount.publicAccount.address);
    });
  }

  public onError(): Promise<Observable<TransactionStatusError>> {
    console.log('Opening Connection...');
    return this.listener.open().then(() => {
      return this.listener.status(this.apostilleAccount.publicAccount.address);
    });
  }

  public onCosignatureAdded(): Promise<Observable<CosignatureSignedTransaction>> {
    console.log('Opening Connection...');
    return this.listener.open().then(() => {
      return this.listener.cosignatureAdded(this.apostilleAccount.publicAccount.address);
    });
  }

  public close(): void {
    console.log('Closing Connection...');
    this.listener.close();
  }
}
