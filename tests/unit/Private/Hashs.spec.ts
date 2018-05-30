import CryptoJS from 'crypto-js';
import nem from 'nem-sdk';
import { Account, NetworkType } from 'nem2-sdk';
import { Apostille } from '../../../index';
import { Initiator } from '../../../index';
import { KECCAK256, KECCAK512, MD5, SHA1, SHA256 } from '../../../index';

// prepare hashing object
const chooseHash = (hashing) => {
  if (hashing === 'MD5') {
    return new MD5();
  } else if (hashing === 'SHA1') {
    return new SHA1();
  } else if (hashing === 'SHA256') {
    return new SHA256();
  } else if (hashing === 'SHA3-256') {
    return new KECCAK256();
  } else {
    return new KECCAK512();
  }
};

const seed = 'NEM is Awesome!';
// A funny but valid private key
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const initiator = new Initiator(Account.createFromPrivateKey(signer, NetworkType.TEST_NET), NetworkType.TEST_NET);

// Create a common object holding key
const common = nem.model.objects.create('common')('', signer);

// Simulate the file content
const payload = CryptoJS.enc.Utf8.parse('Private apostille is awesome !');

/*** Test for MD5, SHA1, SHA256, SHA3-256, SHA3-512 ***/
const hashArray = ['MD5', 'SHA1', 'SHA256', 'SHA3-256', 'SHA3-512'];
let oldPrivateApostille;
let newPrivateApostille;
let hashType;
hashArray.forEach((hash) => {
  // Create the Apostille
  oldPrivateApostille = nem.model.apostille.create(
    common,
    seed,
    payload,
    'Test Apostille',
    nem.model.apostille.hashing[hash],
    false, {}, true,
    nem.model.network.data.testnet.id);

  newPrivateApostille = new Apostille(seed, signer, NetworkType.TEST_NET);

  hashType = chooseHash(hash);
  newPrivateApostille.create(initiator, payload, [], hashType);

  describe('private apostille hash should be correct', () => {
    it(`should generate correct signed checksum with ${hash}`, () => {
      expect(newPrivateApostille.creationHash.substring(0, 10)).toMatch(oldPrivateApostille.data.checksum);
    });

    it(`should generate correct hash with ${hash}`, () => {
      expect(newPrivateApostille.creationHash).toMatch(oldPrivateApostille.data.hash);
    });
  });
});
