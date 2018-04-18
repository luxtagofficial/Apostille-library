import nem from 'nem-sdk';
import { NetworkType } from 'nem2-sdk';
import { PublicApostille } from '../../src/PublicApostille';
import { SHA256 } from '../../src/hashFunctions';

const fileName = 'FileName.pdf';
// A funny but valid private key
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';

// Create a common object holding key
const common = nem.model.objects.create('common')('', signer);

// Simulate the file content
const fileContent = nem.crypto.js.enc.Utf8.parse('Public apostille is awesome !');

// Create the public Apostille
const oldPublicApostille = nem.model.apostille.create(common, fileName, fileContent, 'Test Apostille', nem.model.apostille.hashing['SHA256'], false, {}, false, nem.model.network.data.testnet.id);

const newPublicApostille = new PublicApostille(signer, NetworkType.TEST_NET);
const hashType = new SHA256();
newPublicApostille.create(fileContent, hashType);

describe('Public apostille hashes should be correct', () => {
  it('should generate correct non-signed checksum with sha-256', () => {
    expect(newPublicApostille.apostilleHash.substring(0, 10)).toMatch(oldPublicApostille.data.checksum);
  });
  it('should generate correct file hash with sha-256', () => {
    expect(newPublicApostille.apostilleHash).toMatch(oldPublicApostille.data.hash);
  });
});
