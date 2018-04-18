import nem from 'nem-sdk';
import { NetworkType } from 'nem2-sdk';
import { Apostille } from '../../src/Apostille';
import { SHA256 } from '../../src/hashFunctions';

const tag = 'NEM is Awesome!';
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';

// Create a common object holding key
var common = nem.model.objects.create('common')('', signer);

// Simulate the file content
var fileContent = nem.crypto.js.enc.Utf8.parse('Apostille is awesome !');

// Create the Apostille
var oldPrivateApostille = nem.model.apostille.create(common, 'NEM is Awesome!', fileContent, 'Test Apostille', nem.model.apostille.hashing['SHA256'], false, {}, true, nem.model.network.data.testnet.id);

const newPrivateApostille = new Apostille(tag, signer, NetworkType.TEST_NET);

describe('HD account generation should be correct', () => {
  it('private key should be valid', () => {
    expect(nem.utils.helpers.isPrivateKeyValid(newPrivateApostille.privateKey)).toBeTruthy();
  });

  it('public key should be valid', () => {
    expect(nem.utils.helpers.isPublicKeyValid(newPrivateApostille.publicKey)).toBeTruthy();
  });

  it('should generate the same HD account as old apostille', () => {
    expect(oldPrivateApostille.data.dedicatedAccount.privateKey.toUpperCase() === newPrivateApostille.privateKey).toBeTruthy();
  });
});

const hashType = new SHA256();
newPrivateApostille.create(fileContent, hashType);

describe('private apostille hash should be correct', () => {
  it('should generate correct signed checksum with sha-256', () => {
    expect(newPrivateApostille.apostilleHash.substring(0, 10) === oldPrivateApostille.data.checksum).toBeTruthy();
  });

  it('should generate correct hash with sha-256', () => {
    expect(newPrivateApostille.apostilleHash === oldPrivateApostille.data.hash).toBeTruthy();
  });
});