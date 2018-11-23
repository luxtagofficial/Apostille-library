import { Account, NetworkType } from 'nem2-sdk';
import { Initiator } from '../../index';
import { Errors } from '../../src/types/Errors';

// const tag = 'NEM is Awesome!';
// A funny but valid private key
const sk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const generator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);

// const PrivateApostille1 = Apostille.init(tag, generator);

describe('initiator should work properly', () => {
  it('multisisg without complete boolean should throw an error', () => {
    expect(() => new Initiator(generator, generator.publicAccount))
      .toThrowError(Errors[Errors.MISSING_IS_COMPLETE_ARGUMENT]);
  });

  it('should complete getter should work properly', () => {
    const init1 = new Initiator(generator, generator.publicAccount, false);
    const init2 = new Initiator(generator, generator.publicAccount, true);
    expect(init1.complete).toBeFalsy();
    expect(init2.complete).toBeTruthy();
  });
});
