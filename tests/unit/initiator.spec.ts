import { Account, NetworkType } from 'nem2-sdk';
import { Apostille, Initiator } from '../../index';
import { Errors } from '../../src/Errors';

const tag = 'NEM is Awesome!';
// A funny but valid private key
const sk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const generator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);

const PrivateApostille1 = new Apostille(tag, generator);

describe('initiator should work properly', () => {
  it('multisisg without compleet boolean should throw an error', () => {
    expect(() => {
      const ini = new Initiator(generator, NetworkType.MIJIN_TEST, generator.publicAccount);
    }).toThrow(Errors[Errors.MISSING_IS_COMPLETE_ARGUMENT]);
  });

  it('should compleet getter should work properly', () => {
    const init1 = new Initiator(generator, NetworkType.MIJIN_TEST, generator.publicAccount, false);
    const init2 = new Initiator(generator, NetworkType.MIJIN_TEST, generator.publicAccount, true);
    expect(init1.complete).toBeFalsy();
    expect(init2.complete).toBeTruthy();
  });
});
