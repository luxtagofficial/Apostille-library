// import * as nemDefault from 'nem-sdk';
// import { Account, NetworkType } from 'nem2-sdk';
// import { Apostille } from '../../../index';

// const nem = nemDefault.default;

// const seed = 'NEM is Awesome!';
// // A funny but valid private key
// const sk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
// const generator = Account.createFromPrivateKey(sk, NetworkType.TEST_NET);
// // Create a common object holding key
// const common = nem.model.objects.create('common')('', sk);

// // Simulate the file content
// const payload = nem.crypto.js.enc.Utf8.parse('Apostille is awesome !');

// // Create the Apostille
// const oldPrivateApostille = nem.model.apostille.create(
//   common,
//   'NEM is Awesome!',
//   payload,
//   'Test Apostille',
//   // tslint:disable-next-line:no-string-literal
//   nem.model.apostille.hashing['SHA256'],
//   false, {}, true,
//   nem.model.network.data.testnet.id);

// const newPrivateApostille = Apostille.init(seed, generator);

describe('HD account generation should be correct', () => {
  it.skip('skip', () => {
    expect('').toMatch('');
  });

  // it.skip('private key should be valid', () => {
  //   console.log('PRIVATE_KEY', newPrivateApostille.privateKey);
  //   expect(nem.utils.helpers.isPrivateKeyValid(newPrivateApostille.privateKey)).toBeTruthy();
  // });

  // it.skip('public key should be valid', () => {
  //   expect(nem.utils.helpers.isPublicKeyValid(newPrivateApostille.publicKey)).toBeTruthy();
  // });

  // it.skip('should generate the same HD account as old apostille', () => {
  //   expect(
  //     oldPrivateApostille.data.dedicatedAccount.privateKey.toUpperCase() === newPrivateApostille.privateKey,
  //   ).toBeTruthy();
  // });
});
