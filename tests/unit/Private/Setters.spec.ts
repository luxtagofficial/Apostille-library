import { Account, NetworkType } from 'nem2-sdk';
import { Apostille } from '../../../index';

const seed = 'KV_,x797taRe}t<+';
// A funny but valid private key
const sk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';

const generator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
// const signer = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
// creation payload
// const payload = 'Apostille is awesome !';

const PrivateApostille = Apostille.init(seed, generator);

describe('Setters should work properly', () => {

  it('create setter should work properly', () => {
    // tslint:disable-next-line:no-string-literal
    expect(PrivateApostille['_created']).toBeFalsy();
    PrivateApostille.created = true;
    // tslint:disable-next-line:no-string-literal
    expect(PrivateApostille['_created']).toBeTruthy();
  });

});
