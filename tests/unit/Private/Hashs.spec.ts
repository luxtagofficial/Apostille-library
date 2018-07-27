import CryptoJS from 'crypto-js';
import nem from 'nem-sdk';
import { Account, NetworkType } from 'nem2-sdk';
import { Apostille } from '../../../src/Apostille';
import { KECCAK256 } from '../../../src/hashFunctions/keccak-256';
import { KECCAK512 } from '../../../src/hashFunctions/keccak-512';
import { MD5 } from '../../../src/hashFunctions/md5';
import { SHA1 } from '../../../src/hashFunctions/sha1';
import { SHA256 } from '../../../src/hashFunctions/sha256';
import { Initiator } from '../../../src/Initiator';

const seed = 'NEM is Awesome!';
// A funny but valid private key
const sk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const generator = Account.createFromPrivateKey(sk, NetworkType.TEST_NET);
const initiator = new Initiator(generator);

// Create a common object holding key
const common = nem.model.objects.create('common')('', sk);

// Simulate the file content
const payload = CryptoJS.enc.Utf8.parse('Private apostille is awesome !');

/*** Test for MD5, SHA1, SHA256, SHA3-256, SHA3-512 ***/
const hashArray = ['MD5', 'SHA1', 'SHA256', 'SHA3-256', 'SHA3-512'];

describe('private apostille hash should be correct', () => {

  it(`should generate correct signed checksum with MD5`, () => {
    const oldPrivateApostille = nem.model.apostille.create(
      common,
      seed,
      payload,
      'Test Apostille',
      // tslint:disable-next-line:no-string-literal
      nem.model.apostille.hashing['MD5'],
      false, {}, true,
      nem.model.network.data.testnet.id);
    const newPrivateApostille = Apostille.init(seed, generator);
    return newPrivateApostille.create(initiator, payload, [], new MD5()).then(() => {
      expect(newPrivateApostille.creationHash.substring(0, 10)).toMatch(oldPrivateApostille.data.checksum);
    });
  });

  it(`should generate correct hash with MD5`, () => {
    const oldPrivateApostille = nem.model.apostille.create(
      common,
      seed,
      payload,
      'Test Apostille',
      // tslint:disable-next-line:no-string-literal
      nem.model.apostille.hashing['MD5'],
      false, {}, true,
      nem.model.network.data.testnet.id);
    const newPrivateApostille = Apostille.init(seed, generator);
    return newPrivateApostille.create(initiator, payload, [], new MD5()).then(() => {
      expect(newPrivateApostille.creationHash).toMatch(oldPrivateApostille.data.hash);
    });
  });

  it(`should generate correct signed checksum with SHA1`, () => {
    const oldPrivateApostille = nem.model.apostille.create(
      common,
      seed,
      payload,
      'Test Apostille',
      // tslint:disable-next-line:no-string-literal
      nem.model.apostille.hashing['SHA1'],
      false, {}, true,
      nem.model.network.data.testnet.id);
    const newPrivateApostille = Apostille.init(seed, generator);
    return newPrivateApostille.create(initiator, payload, [], new SHA1()).then(() => {
      expect(newPrivateApostille.creationHash.substring(0, 10)).toMatch(oldPrivateApostille.data.checksum);
    });
  });

  it(`should generate correct hash with SHA1`, () => {
    const oldPrivateApostille = nem.model.apostille.create(
      common,
      seed,
      payload,
      'Test Apostille',
      // tslint:disable-next-line:no-string-literal
      nem.model.apostille.hashing['SHA1'],
      false, {}, true,
      nem.model.network.data.testnet.id);
    const newPrivateApostille = Apostille.init(seed, generator);
    return newPrivateApostille.create(initiator, payload, [], new SHA1()).then(() => {
      expect(newPrivateApostille.creationHash).toMatch(oldPrivateApostille.data.hash);
    });
  });

  it(`should generate correct signed checksum with SHA256`, () => {
    const oldPrivateApostille = nem.model.apostille.create(
      common,
      seed,
      payload,
      'Test Apostille',
      // tslint:disable-next-line:no-string-literal
      nem.model.apostille.hashing['SHA256'],
      false, {}, true,
      nem.model.network.data.testnet.id);
    const newPrivateApostille = Apostille.init(seed, generator);
    return newPrivateApostille.create(initiator, payload, [], new SHA256()).then(() => {
      expect(newPrivateApostille.creationHash.substring(0, 10)).toMatch(oldPrivateApostille.data.checksum);
    });
  });

  it(`should generate correct hash with SHA256`, () => {
    const oldPrivateApostille = nem.model.apostille.create(
      common,
      seed,
      payload,
      'Test Apostille',
      // tslint:disable-next-line:no-string-literal
      nem.model.apostille.hashing['SHA256'],
      false, {}, true,
      nem.model.network.data.testnet.id);
    const newPrivateApostille = Apostille.init(seed, generator);
    return newPrivateApostille.create(initiator, payload, [], new SHA256()).then(() => {
      expect(newPrivateApostille.creationHash).toMatch(oldPrivateApostille.data.hash);
    });
  });

  it(`should generate correct signed checksum with KECCAK-256`, () => {
    const oldPrivateApostille = nem.model.apostille.create(
      common,
      seed,
      payload,
      'Test Apostille',
      // tslint:disable-next-line:no-string-literal
      nem.model.apostille.hashing['SHA3-256'],
      false, {}, true,
      nem.model.network.data.testnet.id);
    const newPrivateApostille = Apostille.init(seed, generator);
    return newPrivateApostille.create(initiator, payload, [], new KECCAK256()).then(() => {
      expect(newPrivateApostille.creationHash.substring(0, 10)).toMatch(oldPrivateApostille.data.checksum);
    });
  });

  it(`should generate correct hash with KECCAK-256`, () => {
    const oldPrivateApostille = nem.model.apostille.create(
      common,
      seed,
      payload,
      'Test Apostille',
      // tslint:disable-next-line:no-string-literal
      nem.model.apostille.hashing['SHA3-256'],
      false, {}, true,
      nem.model.network.data.testnet.id);
    const newPrivateApostille = Apostille.init(seed, generator);
    return newPrivateApostille.create(initiator, payload, [], new KECCAK256()).then(() => {
      expect(newPrivateApostille.creationHash).toMatch(oldPrivateApostille.data.hash);
    });
  });

  it(`should generate correct signed checksum with KECCAK-512`, () => {
    const oldPrivateApostille = nem.model.apostille.create(
      common,
      seed,
      payload,
      'Test Apostille',
      // tslint:disable-next-line:no-string-literal
      nem.model.apostille.hashing['SHA3-512'],
      false, {}, true,
      nem.model.network.data.testnet.id);
    const newPrivateApostille = Apostille.init(seed, generator);
    return newPrivateApostille.create(initiator, payload, [], new KECCAK512()).then(() => {
      expect(newPrivateApostille.creationHash.substring(0, 10)).toMatch(oldPrivateApostille.data.checksum);
    });
  });

  it(`should generate correct hash with KECCAK-512`, () => {
    const oldPrivateApostille = nem.model.apostille.create(
      common,
      seed,
      payload,
      'Test Apostille',
      // tslint:disable-next-line:no-string-literal
      nem.model.apostille.hashing['SHA3-512'],
      false, {}, true,
      nem.model.network.data.testnet.id);
    const newPrivateApostille = Apostille.init(seed, generator);
    return newPrivateApostille.create(initiator, payload, [], new KECCAK512()).then(() => {
      expect(newPrivateApostille.creationHash).toMatch(oldPrivateApostille.data.hash);
    });
  });

});
