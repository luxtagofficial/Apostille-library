import { NetworkType, PublicAccount } from 'nem2-sdk';
import { ApostilleAccount } from '../../index';

describe('apostille accound methods should work properly', () => {
  it(' should return 2 cosignataries of the accounts', () => {
    const publicKey = 'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56';
    const apostilleAccount = new ApostilleAccount(PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST));

    return apostilleAccount.getCosignatories().then((data) => {
        expect(data.length).toEqual(2);
    });
  });

  it('Should return true if the account is claimed', () => {
    const publicKey = 'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56';
    const apostilleAccount = new ApostilleAccount(PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST));

    return apostilleAccount.isOwned().then((data) => {
        expect(data).toEqual(true);
    });
  });

  it('Should return false if the account is not claimed', () => {
    const publicKey = '22816F825B4CACEA334723D51297D8582332D8B875A5829908AAE85831ABB508';
    const apostilleAccount = new ApostilleAccount(PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST));

    return apostilleAccount.isOwned().then((data) => {
        expect(data).toEqual(false);
    });
  });

  it('Should return creation transaction', () => {
    const publicKey = 'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56';
    const apostilleAccount = new ApostilleAccount(PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST));

    return apostilleAccount.getCreationTransaction().then((data: any) => {
      expect(data.message.payload).toEqual('I am really really awesomeee');
    });
  });
});
