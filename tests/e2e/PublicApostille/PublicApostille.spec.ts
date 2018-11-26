import CryptoJS from 'crypto-js';
import { Account, Address, NetworkType } from 'nem2-sdk';
import { ApostilleHttp, HistoricalEndpoints, PublicApostille, SHA256 } from '../../../index';

const fileName = 'FileName.pdf';
const pk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const networkType = NetworkType.MIJIN_TEST;
const signer = Account.createFromPrivateKey(pk, networkType);
const apostilleHttp = new ApostilleHttp(HistoricalEndpoints[networkType]);

beforeAll(() => {
  jest.setTimeout(10000);
});

const hashFn = new SHA256();

describe('announce function should work properly', () => {
  test('updating an public apostille should be allowed as many times as we want', async () => {
    const sinkAddress = Address.createFromRawAddress( 'SCKPEZ-5ZAPYO-PXVF6U-YLHINF-CLYZHO-YCIO3P-KGVV');
    const publicApostille = new PublicApostille(fileName, sinkAddress);

    let updateTransaction;
    let signedTransaction;

    updateTransaction = publicApostille.update(CryptoJS.enc.Utf8.parse('Public apostille is awesome !'), hashFn);
    signedTransaction = signer.sign(updateTransaction);
    await apostilleHttp.announce(signedTransaction);
    updateTransaction = publicApostille.update(CryptoJS.enc.Utf8.parse('Public apostille can be updated'), hashFn);
    signedTransaction = signer.sign(updateTransaction);
    await apostilleHttp.announce(signedTransaction);
    updateTransaction = publicApostille.update(CryptoJS.enc.Utf8.parse('as many times as we want'), hashFn);
    signedTransaction = signer.sign(updateTransaction);
    await apostilleHttp.announce(signedTransaction);
  });

});
