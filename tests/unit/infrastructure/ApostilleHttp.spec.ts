import { NetworkType, PublicAccount, TransactionInfo, TransferTransaction } from 'nem2-sdk';
import { ApostilleHttp } from '../../../src/infrastructure/ApostilleHttp';
import { ApostillePublicAccount } from '../../../src/model/apostille/ApostillePublicAccount';
import { HistoricalEndpoints } from '../../../src/model/repository/HistoricalEndpoints';
import { Errors } from '../../../src/types/Errors';

const getPublicApostilleAccount = ((publicKey: string, networkType: NetworkType): ApostillePublicAccount => {
  // Account 1
  const publicAccount = PublicAccount.createFromPublicKey(
    publicKey,
    networkType,
  );
  return new ApostillePublicAccount(publicAccount);
});

describe('apostille public account non transaction methods should work properly', () => {
    const apostilleHttp = new ApostilleHttp(HistoricalEndpoints[NetworkType.MIJIN_TEST]);
    // Apostille Public Account1 1
    const apostillePublicAccount1 = getPublicApostilleAccount(
        'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56',
        NetworkType.MIJIN_TEST);

    // Apostille Public Account1 2
    const apostillePublicAccount2 = getPublicApostilleAccount(
        '67FD8C18BAACED8777EBF483B596D6BE0F93EDB2084FA39968DF8D2D96400E08',
        NetworkType.MIJIN_TEST);

    // Apostille Public Account 3
    const apostillePublicAccount3 = getPublicApostilleAccount(
      '901C9D46840BB74F4649EF3AF65A910A9F162DFA0FD5AD7E2739E5B82C2579F0',
      NetworkType.MIJIN_TEST);

    // Apostille Public Account 4
    const apostillePublicAccount4 = getPublicApostilleAccount(
      '95361ED8C94048BD5B0BDB229C19DF817DB7D66B59F4162E3F3A1D0D813B2AB9',
      NetworkType.MIJIN_TEST);

    it(' should return 2 cosignataries of the accounts', () => {
        return apostilleHttp.getCosignatories(apostillePublicAccount1.publicAccount.address).then((data) => {
            expect(data.length).toEqual(2);
        });
    });

    it('Should return true if the account is claimed', () => {
        return apostilleHttp.isOwned(apostillePublicAccount1.publicAccount.address).then((data) => {
            expect(data).toBeTruthy();
        });
    });

    it('Should return false if the account is not claimed', () => {
        return apostilleHttp.isOwned(apostillePublicAccount2.publicAccount.address).then((data) => {
            expect(data).toBeFalsy();
        });
    });

    //   TODO: Move this test to luxtag SDK
    it('Should return creation transaction when it is transfer transaction', () => {
        return apostilleHttp.getCreationTransaction(
            apostillePublicAccount3.publicAccount).then((data: TransferTransaction) => {
            expect(data.message.payload).toEqual('');
        });
    });

    //   TODO: Move this test to luxtag SDK
    it('Should return creation transaction when the it is an aggregate complete transaction', () => {
        return apostilleHttp.getCreationTransaction(
            apostillePublicAccount1.publicAccount).then((data: TransferTransaction) => {
            expect(data.message.payload).toEqual('I am really really awesomeee');
        });
    });

    //   TODO: Move this test to luxtag SDK
    it('Throws error if there is no first transactions', () => {
        return apostilleHttp.getCreationTransaction(
            apostillePublicAccount4.publicAccount).then((data: TransferTransaction) => {
            console.log(TransferTransaction);
        }).catch((err) => {
            expect(err).toEqual(Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
        });
    });

    it('Should return creation transaction info', () => {
        return apostilleHttp.getCreationTransactionInfo(
            apostillePublicAccount1.publicAccount).then((transactionInfo: TransactionInfo) => {
        expect(transactionInfo.id).toEqual('5B160E18C60E680001790BA2');
        });
    });

});
