import { NetworkType, PublicAccount } from 'nem2-sdk';
import { map, reduce, shareReplay } from 'rxjs/operators';
import { ApostilleHttp } from './../src/infrastructure/ApostilleHttp';
import { HistoricalEndpoints } from './../src/model/repository/HistoricalEndpoints';

// const accountLarge = PublicAccount.createFromPublicKey(
//   'FE9F2C724D0E0360A20B9ED7591E4E25CF25D6F4A4E8E52C491C62D2452397F8',
// NetworkType.MIJIN_TEST);

// const accountSmall = PublicAccount.createFromPublicKey(
//   '38FD27361DB3B12953AF6C3813F740ADB7C980789DCB3D2486B3B654CBC91B72',
// NetworkType.MIJIN_TEST);
const accountSmall = PublicAccount.createFromPublicKey(
  '95361ED8C94048BD5B0BDB229C19DF817DB7D66B59F4162E3F3A1D0D813B2AB9',
NetworkType.MIJIN_TEST);

const http = new ApostilleHttp(HistoricalEndpoints[NetworkType.MIJIN_TEST]);

const subscription = http.fetchAllTransactions(accountSmall).pipe(
  map((txs) => {
    return txs.map((tx) => {
      if (!tx.transactionInfo) { return {}; }
      console.log(tx.transactionInfo.id, tx.transactionInfo.height.compact());
      return {
        height: tx.transactionInfo.height,
        id: tx.transactionInfo.id,
      };
    });
  }),
  reduce((acc, txs) => {
    return acc.concat(txs);
  }),
  shareReplay(),
);

subscription.subscribe((txs) => {
  console.log('First', txs.length);
});
subscription.subscribe((txs) => {
  console.log('Second', txs.length);
});
setTimeout(() => {
  subscription.subscribe((txs) => {
    console.log('Third', txs.length);
  });
}, 10000);
