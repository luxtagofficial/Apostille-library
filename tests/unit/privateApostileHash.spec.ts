import nem from 'nem-sdk';
import CryptoJS from 'crypto-js';
import { NetworkType, Account, Mosaic } from 'nem2-sdk';
import { Apostille } from '../../src/Apostille';
import { SHA256, MD5, SHA1, SHA3256, SHA3512 } from '../../src/hashFunctions';
import { Initiator } from '../../src/Initiator';

// prepare hashing object
const chooseHash = (hashing) => {
  if (hashing === 'MD5') {
    return new MD5();
  } else if (hashing === 'SHA1') {
    return new SHA1();
  } else if (hashing === 'SHA256') {
    return new SHA256();
  } else if (hashing === 'SHA3-256') {
    return new SHA3256();
  } else {
    return new SHA3512();
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
      expect(newPrivateApostille.apostilleHash.substring(0, 10)).toMatch(oldPrivateApostille.data.checksum);
    });

    it(`should generate correct hash with ${hash}`, () => {
      expect(newPrivateApostille.apostilleHash).toMatch(oldPrivateApostille.data.hash);
    });
  });
});
