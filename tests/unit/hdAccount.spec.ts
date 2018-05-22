import nem from 'nem-sdk';
import { NetworkType } from 'nem2-sdk';
import { Apostille } from '../../src/Apostille';

const tag = 'NEM is Awesome!';
// A funny but valid private key
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';

// Create a common object holding key
const common = nem.model.objects.create('common')('', signer);

// Simulate the file content
const payload = nem.crypto.js.enc.Utf8.parse('Apostille is awesome !');

// Create the Apostille
const oldPrivateApostille = nem.model.apostille.create(
  common,
  'NEM is Awesome!',
  payload, 'Test Apostille',
  nem.model.apostille.hashing['SHA256'],
  false, {}, true,
  nem.model.network.data.testnet.id);

const newPrivateApostille = new Apostille(tag, signer, NetworkType.TEST_NET);

describe('HD account generation should be correct', () => {
  it('private key should be valid', () => {
    expect(nem.utils.helpers.isPrivateKeyValid(newPrivateApostille.privateKey)).toBeTruthy();
  });

  it('public key should be valid', () => {
    expect(nem.utils.helpers.isPublicKeyValid(newPrivateApostille.publicKey)).toBeTruthy();
  });

  it('should generate the same HD account as old apostille', () => {
    expect(
      oldPrivateApostille.data.dedicatedAccount.privateKey.toUpperCase() === newPrivateApostille.privateKey
    ).toBeTruthy();
  });
});
