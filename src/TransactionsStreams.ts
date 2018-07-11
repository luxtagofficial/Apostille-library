import { AggregateTransaction, CosignatureSignedTransaction, Listener, NetworkType, Transaction, TransactionStatusError } from 'nem2-sdk';
import { Observable } from 'rxjs';
import { ApostilleAccount } from './ApostilleAccount';

export class TransactionsStreams {

  private listener: Listener;

  constructor(
    public readonly apostilleAccount: ApostilleAccount,
    private urls?: string,
  ) {
    if (this.urls) {
      this.listener = new Listener(this.urls);
    } else {
      if (apostilleAccount.publicAccount.address.networkType === NetworkType.MAIN_NET) {
        this.listener = new Listener('http://88.99.192.82:7890');
      } else if (apostilleAccount.publicAccount.address.networkType === NetworkType.TEST_NET) {
        this.listener = new Listener('http://104.128.226.60:7890');
      } else if (apostilleAccount.publicAccount.address.networkType === NetworkType.MIJIN) {
        throw new Error('Missing Endpoint argument!');
      } else {
        this.listener = new Listener('http://api.beta.catapult.mijin.io:3000');
      }
    }
  }

  /**
   * @description Returns an observable stream of Transaction for this Apostille Account.
   * Each time a transaction is in confirmed state an it involves this Apostille Account,
   * it emits a new Transaction in the event stream.
   * @returns {Observable<Transaction>} an observable stream of Transaction with state confirmed
   * @memberof TransactionsStream
   */
  public onConfirmed(): Promise<Observable<Transaction>> {
    return this.listener.open().then(() => {
      return this.listener.confirmed(this.apostilleAccount.publicAccount.address);
    });
  }

  public onUnconfirmedAdded(): Promise<Observable<Transaction>> {
    return this.listener.open().then(() => {
      return this.listener.unconfirmedAdded(this.apostilleAccount.publicAccount.address);
    });
  }

  public onUnconfirmedRemoved(): Promise<Observable<string>> {
    return this.listener.open().then(() => {
      return this.listener.unconfirmedRemoved(this.apostilleAccount.publicAccount.address);
    });
  }

  public onAggregateBondedAdded(): Promise<Observable<AggregateTransaction>> {
    return this.listener.open().then(() => {
      return this.listener.aggregateBondedAdded(this.apostilleAccount.publicAccount.address);
    });
  }

  public onAggregateBondedRemoved(): Promise<Observable<AggregateTransaction>> {
    return this.listener.open().then(() => {
      return this.listener.aggregateBondedAdded(this.apostilleAccount.publicAccount.address);
    });
  }

  public onError(): Promise<Observable<TransactionStatusError>> {
    return this.listener.open().then(() => {
      return this.listener.status(this.apostilleAccount.publicAccount.address);
    });
  }

  public onCosignatureAdded(): Promise<Observable<CosignatureSignedTransaction>> {
    return this.listener.open().then(() => {
      return this.listener.cosignatureAdded(this.apostilleAccount.publicAccount.address);
    });
  }
}
