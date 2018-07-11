import { Account, NetworkType } from '../../node_modules/nem2-sdk';
import { Apostille } from '../../src/Apostille';
import { Initiator } from '../../src/Initiator';

beforeAll(() => {
  jest.setTimeout(10000);
});

const seed = '.N:@N%5SVj3Wkmr-';
const sk = '0F30BA45EF341096493CD793D17D4808DAB5EC20A6CC0EB2354DDD687A3A8CF8';
const gensignr = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
const privateApostille = new Apostille(seed, gensignr);
const initiator = new Initiator(gensignr, NetworkType.MIJIN_TEST);

describe('TransactionStreams should work properly', () => {
  privateApostille.created = true;
  it('should catch unconfirmed transactions', async () => {
    privateApostille.monitor().onUnconfirmedAdded().then((channel) => {
      channel.subscribe((transaction: any) => {
        console.log('CONFIRMED:', transaction.message.payload);
        return expect(transaction.message.payload).toMatch('transactions stream test unconfirmed');
      },
      (err) => console.error(err));
    });
    await privateApostille.update(initiator, 'transactions stream test unconfirmed')
    .then(async () => await privateApostille.announce());
  });
});
