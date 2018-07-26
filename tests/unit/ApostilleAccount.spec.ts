import { NetworkType, PublicAccount, TransactionInfo, TransferTransaction } from 'nem2-sdk';
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

  it('Should return creation transaction when it is transfer transaction', () => {
    const publicKey = '901C9D46840BB74F4649EF3AF65A910A9F162DFA0FD5AD7E2739E5B82C2579F0';
    const apostilleAccount = new ApostilleAccount(PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST));

    return apostilleAccount.getCreationTransaction().then((data: TransferTransaction) => {
      expect(data.message.payload).toEqual('');
    });
  });

  it('Should return creation transaction when the it is an aggregate complete transaction', () => {
    const publicKey = 'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56';
    const apostilleAccount = new ApostilleAccount(PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST));

    return apostilleAccount.getCreationTransaction().then((data: TransferTransaction) => {
      expect(data.message.payload).toEqual('I am really really awesomeee');
    });
  });

  it('Throws error if there is no first transactions', () => {
    const publicKey = '95361ED8C94048BD5B0BDB229C19DF817DB7D66B59F4162E3F3A1D0D813B2AB9';
    const apostilleAccount = new ApostilleAccount(PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST));

    return apostilleAccount.getCreationTransaction().then((data: TransferTransaction) => {
      console.log(TransferTransaction);
    }).catch((err) => {
      expect(err.message).toEqual('Not Found');
    });
  });

  it('Should return creation transaction info', () => {
    const publicKey = 'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56';
    const apostilleAccount = new ApostilleAccount(PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST));

    return apostilleAccount.getCreationTransactionInfo().then((transactionInfo: TransactionInfo) => {
      expect(transactionInfo.id).toEqual('5B160E18C60E680001790BA2');
    });
  });

  it('returns correct transaction by ID', () => {
    const transactionID = '5B160E18C60E680001790BA2';
    const publicKey = 'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56';
    const apostilleAccount = new ApostilleAccount(PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST));

    apostilleAccount.getTransactionById(transactionID)
      .subscribe((transaction) => {
        expect(transaction.transactionInfo.id).toEqual(transactionID);
      });
  });

});
