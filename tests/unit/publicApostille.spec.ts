import nem from 'nem-sdk';
import CryptoJS from 'crypto-js';
import { NetworkType } from 'nem2-sdk';
import { PublicApostille } from '../../src/PublicApostille';
import { SHA256, MD5, SHA1, SHA3256, SHA3512 } from '../../src/hashFunctions';

// prepare hashing object
const chooseHash = function(hashing) {
  if (hashing === 'MD5') {
    return new MD5;
  } else if (hashing === 'SHA1') {
    return new SHA1;
  } else if (hashing === 'SHA256') {
    return new SHA256;
  } else if (hashing === 'SHA3-256') {
    return new SHA3256;
  } else {
    return new SHA3512;
  }
};

const fileName = 'FileName.pdf';
// A funny but valid private key
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';

// Create a common object holding key
const common = nem.model.objects.create('common')('', signer);

// Simulate the file content
const fileContent = CryptoJS.enc.Utf8.parse('Public apostille is awesome !');

// Create the public Apostille
let oldPublicApostille = nem.model.apostille.create(common, fileName, fileContent, 'Test Apostille', nem.model.apostille.hashing['SHA256'], false, {}, false, nem.model.network.data.testnet.id);

let newPublicApostille = new PublicApostille(signer, NetworkType.TEST_NET);

/*** Test for SHA256 ***/
let hashType = chooseHash('SHA256');
newPublicApostille.create(fileContent, hashType);

describe('Public apostille hashes should be correct', () => {
  it('should generate correct non-signed checksum with sha-256', () => {
    expect(newPublicApostille.apostilleHash.substring(0, 10)).toMatch(oldPublicApostille.data.checksum);
  });
  it('should generate correct file hash with sha-256', () => {
    expect(newPublicApostille.apostilleHash).toMatch(oldPublicApostille.data.hash);
  });
});

/*** Test for MD5, SHA1, SHA3-256, SHA3-512 ***/
const hashArray = ['MD5', 'SHA1', 'SHA3-256', 'SHA3-512'];

hashArray.forEach(hash => {
  // Create the public Apostille
  let oldPublicApostille = nem.model.apostille.create(common, fileName, fileContent, 'Test Apostille', nem.model.apostille.hashing[hash], false, {}, false, nem.model.network.data.testnet.id);

  let newPublicApostille = new PublicApostille(signer, NetworkType.TEST_NET);

  let hashType = chooseHash(hash);
  newPublicApostille.create(fileContent, hashType);

  describe('Public apostille hashes should be correct', () => {
    it(`should generate correct non-signed checksum with ${hash}`, () => {
      expect(newPublicApostille.apostilleHash.substring(0, 10)).toMatch(oldPublicApostille.data.checksum);
    });
    it(`should generate correct file hash with ${hash}`, () => {
      expect(newPublicApostille.apostilleHash).toMatch(oldPublicApostille.data.hash);
    });
  });
});

