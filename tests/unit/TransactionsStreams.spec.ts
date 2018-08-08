import { Account, NetworkType } from '../../node_modules/nem2-sdk';
import { Apostille } from '../../src/Apostille';
import { Initiator } from '../../src/Initiator';

const seed = '.N:@N%5SVj3Wkmr-';
const sk = '0F30BA45EF341096493CD793D17D4808DAB5EC20A6CC0EB2354DDD687A3A8CF8';
const gensignr = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
const privateApostille = Apostille.init(seed, gensignr);
const initiator = new Initiator(gensignr);

beforeAll(() => {
  jest.setTimeout(20000);
});

afterAll(() => {
  privateApostille.monitor().close();
});

describe('TransactionStreams should work properly', () => {
  privateApostille.created = true;
  it('should catch unconfirmed transactions when added', async () => {
    await privateApostille.monitor().onUnconfirmedAdded().then((channel) => {
      channel.subscribe((transaction: any) => {
        console.log('Listening for unconfirmed added transactions...');
        console.log('added', transaction.message.payload);
        return expect(transaction.message.payload).toMatch('transactions stream test unconfirmed');
        // expect(transaction.message.payload).toMatch('###');
      },
      (err) => console.error(err));
    });
    await privateApostille.update(initiator, 'transactions stream test unconfirmed')
    .then(async () => await privateApostille.announce());
  });

  it('should catch unconfirmed when removed transactions', async () => {
    await privateApostille.monitor().onUnconfirmedRemoved().then((channel) => {
      channel.subscribe((transaction: any) => {
        console.log('Listening for unconfirmed removed transactions...');
        return expect(transaction.message.payload).toMatch('transactions stream test unconfirmed');
        // expect(transaction.message.payload).toMatch('###');
      },
      (err) => console.error(err));
    });
    await privateApostille.update(initiator, 'transactions stream test unconfirmed')
    .then(async () => await privateApostille.announce());
  });

  it('should catch confirmed transactions', async () => {
    await privateApostille.monitor().onConfirmed().then((channel) => {
      channel.subscribe((transaction: any) => {
        console.log('Listening for confirmed transactions...');
        console.log('confirmed', transaction.message.payload);
        return expect(transaction.message.payload).toMatch('transactions stream test unconfirmed');
        // expect(transaction.message.payload).toMatch('###');
      },
      (err) => console.error(err));
    });
    await privateApostille.update(initiator, 'transactions stream test unconfirmed')
      .then(async () => await privateApostille.announce());
  });
});
