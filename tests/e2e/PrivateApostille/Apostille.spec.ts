import { Account, NetworkType } from 'nem2-sdk';
import { Apostille, ApostilleHttp, HistoricalEndpoints } from '../../../index';
import { Initiator } from '../../../src/infrastructure/Initiator';

// A funny but valid private key
const sk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const generator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
const apostilleHttp = new ApostilleHttp(HistoricalEndpoints[NetworkType.MIJIN_TEST]);
const seed = 'KV_,x797taRe}Y<+';
const PrivateApostille1 = Apostille.initFromSeed(seed, generator);
const hdAccountInformation = {
  address: 'SDTE6Z-XQAQ46-FDJ5P7-MSU43E-BNT4SR-7C7EKU-HHL5',
  privateKey: 'B9EF817A39DAEB43179EE9129E5D592410B8A47FA4870A4EC16024575E51A608'.toUpperCase(),
  publicKey: '9C0C770BD1E1506FD207A8D783E0E4AC00D98B6D790401573519D82133474B90'.toUpperCase(),
};
const generationHash = 'F669FE7D1FBAC0823334E5C01BD6D54E4F8B4D25AC8FEB24D15266FE6F1569CB';

beforeAll(() => {
  jest.setTimeout(10000);
});

it('should correctly generate a private apostille via a private key', () => {
  expect(PrivateApostille1.HDAccount.privateKey).toMatch(hdAccountInformation.privateKey);
  expect(PrivateApostille1.HDAccount.publicKey).toMatch(hdAccountInformation.publicKey);
  expect(PrivateApostille1.HDAccount.address.pretty()).toMatch(hdAccountInformation.address);
});

describe('isCreated function should work properly', () => {

  it('should return false before creation', async () => {
    const privateApostille = Apostille.initFromSeed('QUleqZedaOUtlSh', generator);
    expect.assertions(1);
    return apostilleHttp.isCreated(privateApostille.HDAccount.publicAccount).then((result) => {
      expect(result).toBeFalsy();
    });
  });

  it('should return true after creation', async () => {
    const privateApostille = Apostille.initFromSeed('new random seed', generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const Icreator = new Initiator(creator);
    expect.assertions(1);
    const creationTransaction = privateApostille.update('raw');
    const signedTransaction = Icreator.sign(creationTransaction, generationHash);
    await apostilleHttp.announce(signedTransaction);
    return apostilleHttp.isCreated(privateApostille.publicAccount).then((result) => {
      expect(result).toBeTruthy();
    });
  });

  it('should return false before an announce', () => {
    const MTgenerator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const apostilleMT = Apostille.initFromSeed('QUleqZedaOUtlSh', MTgenerator);
    return apostilleHttp.isCreated(apostilleMT.HDAccount.publicAccount).then((result) => {
      expect(result).toBeFalsy();
    });
  });
});

// TODO: check the order of transactions
// TODO: no transfer transaction should exist after a multisig modification
