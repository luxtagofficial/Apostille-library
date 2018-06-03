import { Account, NetworkType } from 'nem2-sdk';
import { Apostille, Initiator } from '../../../index';

const tag = 'NEM is Awesome!';
// A funny but valid private key
const sk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';

const generator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
const signer = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
// creation payload
const payload = 'Apostille is awesome !';

const hdAccountInformation = {
  address: 'SCKPEZ-5ZAPYO-PXVF6U-YLHINF-CLYZHO-YCIO3P-KGVV',
  privateKey: '2D0EFF8CE3509AE36487D7B8163D428FB71469FE0ACF1983A02F3E1655D5CC09'.toUpperCase(),
  publicKey: '727472EBD5474CD3BB8698D0C6406C541A6EE1B7DF9A0273B95B2A3ACFC594A4'.toUpperCase(),
};

const PrivateApostille1 = new Apostille(tag, generator, NetworkType.MIJIN_TEST);
const PrivateApostille2 = new Apostille(tag, generator, NetworkType.MIJIN_TEST);

describe('Getters should work properly', () => {
  it('should correctly generate a private apostille via a private key', () => {
    expect(PrivateApostille1.privateKey).toMatch(hdAccountInformation.privateKey);
    expect(PrivateApostille1.publicKey).toMatch(hdAccountInformation.publicKey);
    expect(PrivateApostille1.address.pretty()).toMatch(hdAccountInformation.address);
  });

  it('should return the genrator public account', () => {
    expect(PrivateApostille1.generator)
    .toMatchObject(signer.publicAccount);
  });

  it('creator sould be undefined', () => {
    expect(PrivateApostille1.creator).toBeUndefined();
  });

  it('creator sould be a valid account', async () => {
    const creator = new Initiator(signer, NetworkType.MIJIN_TEST);
    await PrivateApostille1.create(creator, payload);
    expect(PrivateApostille1.creator).toMatchObject(creator.account);
  });

  it('multisig creator sould be a valid public account', async () => {
    const dumpMultisigCreator = new Initiator(signer, NetworkType.MIJIN_TEST, signer.publicAccount, true);
    await PrivateApostille2.create(dumpMultisigCreator, payload);
    expect(PrivateApostille2.creator).toMatchObject(dumpMultisigCreator.multisigAccount);
    expect(PrivateApostille2.creator.publicKey).toMatch(dumpMultisigCreator.multisigAccount.publicKey);
  });
});
