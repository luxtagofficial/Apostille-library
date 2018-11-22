import { Listener, PublicAccount, SignedTransaction, TransactionHttp } from 'nem2-sdk';
import { filter, mergeMap } from 'rxjs/operators';

class ApostilleHttp {

    private transactionHttp: TransactionHttp;

    private constructor(url: string) {
        this.transactionHttp = new TransactionHttp(url);
    }

    public announce(signedTransaction: SignedTransaction): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.transactionHttp.announce(signedTransaction)
            .subscribe((x) => resolve(x), (err) => reject(err));
        });
    }

    public announceAggregateBonded(
        cosignatoryAccount: PublicAccount,
        signedAggregateBondedTransaction: SignedTransaction,
        signedLockFundsTransaction: SignedTransaction,
        listener: Listener): void {

        listener.open().then(() => {

            this.transactionHttp
                .announce(signedLockFundsTransaction)
                .subscribe((x) => console.log(x), (err) => console.error(err));

            listener
                .confirmed(cosignatoryAccount.address)
                .pipe(
                    filter((transaction) => transaction.transactionInfo !== undefined
                        && transaction.transactionInfo.hash === signedLockFundsTransaction.hash),
                    mergeMap((ignored) => this.transactionHttp.announceAggregateBonded(
                        signedAggregateBondedTransaction)),
                )
                .subscribe((announcedAggregateBonded) => console.log(announcedAggregateBonded),
                    (err) => console.error(err));
        });
    }
}

export { ApostilleHttp };
