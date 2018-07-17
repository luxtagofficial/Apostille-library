import CryptoJS from 'crypto-js';
import { Account, NetworkType } from 'nem2-sdk';
import sinon from 'sinon';
import { Initiator, PublicApostille, SHA256 } from '../../../index';

const fileName = 'FileName.pdf';
// A funny but valid private key
const pk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const signer = Account.createFromPrivateKey(pk, NetworkType.MIJIN_TEST);

beforeAll(() => {
  jest.setTimeout(10000);
});

// Simulate the file content
const fileContent = CryptoJS.enc.Utf8.parse('Public apostille is awesome !');
const hashFunction = new SHA256();

describe('announce function should work properly', () => {

  it('should throw error if network type is mijin and we don\'t specefy an endpoint', () => {
    expect(() => {
      const initiator = new Initiator(signer);
      const publicApostille = new PublicApostille(
        initiator,
        fileName,);

      publicApostille.update(fileContent, hashFunction);
      publicApostille.announce();
    }).toThrow();
  });

  it('should throw error if try to announce more than once', async () => {
    const initiator = new Initiator(signer);
    const publicApostille = new PublicApostille(
      initiator,
      fileName,
      'SCKPEZ-5ZAPYO-PXVF6U-YLHINF-CLYZHO-YCIO3P-KGVV');
    publicApostille.update(fileContent, hashFunction);
    await publicApostille.announce();

    expect(publicApostille.announced).toBeTruthy();
    expect(() => {
      publicApostille.announce();
    }).toThrow();
  });

  test('updating an public apostille should be allowed as many times as we want', async () => {
    const initiator = new Initiator(signer);
    const publicApostille = new PublicApostille(
      initiator,
      fileName,
      'SCKPEZ-5ZAPYO-PXVF6U-YLHINF-CLYZHO-YCIO3P-KGVV');

    publicApostille.update(CryptoJS.enc.Utf8.parse('Public apostille is awesome !'), hashFunction);
    await publicApostille.announce();
    publicApostille.update(CryptoJS.enc.Utf8.parse('Public apostille can be updated'), hashFunction);
    await publicApostille.announce();
    publicApostille.update(CryptoJS.enc.Utf8.parse('as many times as we want'), hashFunction);
    await publicApostille.announce();
  });

  test('announce should work properly', async () => {
    const stubannounce = sinon.stub(PublicApostille.prototype, 'announce');
    const initiator = new Initiator(signer);
    const publicApostille = new PublicApostille(
      initiator,
      fileName,
      'SCKPEZ-5ZAPYO-PXVF6U-YLHINF-CLYZHO-YCIO3P-KGVV');

    publicApostille.update(CryptoJS.enc.Utf8.parse('Public apostille is awesome !'), hashFunction);
    await publicApostille.announce();
    expect(stubannounce.called).toBeTruthy();
  });
});
