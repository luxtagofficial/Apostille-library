import * as nemDefault from 'nem-sdk';
import { Account, NetworkType } from 'nem2-sdk';
import { Initiator, KECCAK256, KECCAK512, MD5, PublicApostille, SHA1, SHA256 } from '../../../index';

const nem = nemDefault.default;

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

const fileName = 'FileName.pdf';
// A funny but valid private key
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const initiator = new Initiator(Account.createFromPrivateKey(signer, NetworkType.TEST_NET));
// Create a common object holding key
const common = nem.model.objects.create('common')('', signer);

// Simulate the file content
const fileContent = nem.crypto.js.enc.Utf8.parse('Public apostille is awesome !');

/*** Test for MD5, SHA1, SHA3-256, SHA3-512 ***/
const hashArray = ['MD5', 'SHA1', 'SHA256', 'SHA3-256', 'SHA3-512'];
let oldPublicApostille;
let newPublicApostille;
let hashType;

hashArray.forEach((hash) => {
  // Create the public Apostille
  oldPublicApostille = nem.model.apostille.create(
    common,
    fileName,
    fileContent,
    'Test Apostille',
    nem.model.apostille.hashing[hash],
    false, {}, false,
    nem.model.network.data.testnet.id);

  newPublicApostille = new PublicApostille(initiator, fileName);

  hashType = chooseHash(hash);
  newPublicApostille.update(fileContent, hashType);

  describe('Public apostille hashes should be correct', () => {
    it(`should generate correct non-signed checksum with ${hash}`, () => {
      expect(newPublicApostille.apostilleHash.substring(0, 10)).toMatch(oldPublicApostille.data.checksum);
    });
    it(`should generate correct file hash with ${hash}`, () => {
      expect(newPublicApostille.apostilleHash).toMatch(oldPublicApostille.data.hash);
    });
  });
});
