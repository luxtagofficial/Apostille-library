import nem from 'nem-sdk';
import { NetworkType } from 'nem2-sdk';
import { Apostille } from '../../src/Apostille';

const tag = 'NEM is Awesome!';
// A funny but valid private key
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';

// Simulate the file content
const payload = nem.crypto.js.enc.Utf8.parse('Apostille is awesome !');



describe('Getters should work properly', () => {
  const hdAccountInformation = {
    address: 'SCKPEZ-5ZAPYO-PXVF6U-YLHINF-CLYZHO-YCIO3P-KGVV',
    privateKey: '2D0EFF8CE3509AE36487D7B8163D428FB71469FE0ACF1983A02F3E1655D5CC09'.toUpperCase(),
    publicKey: '727472EBD5474CD3BB8698D0C6406C541A6EE1B7DF9A0273B95B2A3ACFC594A4'.toUpperCase(),
  };

  it('should be created via private key', () => {
    const PrivateApostille = new Apostille(tag, signer, NetworkType.MIJIN_TEST);

    expect(PrivateApostille.privateKey).toMatch(hdAccountInformation.privateKey);
    expect(PrivateApostille.publicKey).toMatch(hdAccountInformation.publicKey);
    expect(PrivateApostille.address.pretty()).toMatch(hdAccountInformation.address);
});
});