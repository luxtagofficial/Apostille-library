import { Account, NetworkType } from 'nem2-sdk';
import { Apostille, Initiator } from '../../../index';

const seed = 'KV_,x797taRe}Y<+';
// A funny but valid private key
const sk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';

const generator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
const signer = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
// creation payload
const payload = 'Apostille is awesome !';

const hdAccountInformation = {
  address: 'SCJQAL-SM4JXY-Z3MWTU-B5SJQP-HUF6M3-ODNSUA-D2KK',
  privateKey: '4A9C3F528DA4F1A51FD4277F0BC8F72865B86B97F93EC3ED82BCD642EEC35F0F'.toUpperCase(),
  publicKey: '8715355AC04966093A4C95A129DA51118C372677AD4BF2BBFEFE9A2A0C660157'.toUpperCase(),
};

const PrivateApostille1 = new Apostille(seed, generator, NetworkType.MIJIN_TEST);
const PrivateApostille2 = new Apostille(seed, generator, NetworkType.MIJIN_TEST);

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

// TODO: a getter function for getting all the owners of the apostille
