import { Account, ModifyMultisigAccountTransaction, NetworkType, PublicAccount, SignedTransaction, TransferTransaction } from 'nem2-sdk';
import { HistoricalEndpoints } from '../../../src/HistoricalEndpoints';
import { SHA256 } from '../../../src/hashFunctions/sha256';
import { ApostillePublicAccount } from '../../../src/model/ApostillePublicAccount';

const getPublicApostilleAccount = ((publicKey: string, networkType: NetworkType): ApostillePublicAccount => {
  // Account 1
  const publicAccount = PublicAccount.createFromPublicKey(
    publicKey,
    networkType,
  );
  return new ApostillePublicAccount(
    publicAccount,
    HistoricalEndpoints[networkType],
  );
});

describe('apostille public account constructor should work properly', () => {
  const publicAccount = PublicAccount.createFromPublicKey(
    'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56',
    NetworkType.MIJIN_TEST,
  );

  // Apostille Public Account
  const apostillePublicAccount = new ApostillePublicAccount(
    publicAccount,
    HistoricalEndpoints[NetworkType.MIJIN_TEST]);

  it('should return correct public account', () => {
    expect(apostillePublicAccount.publicAccount.equals(publicAccount)).toBeTruthy();
  });
});

describe('apostille public account transaction methods should work properly', () => {
  // Apostille Public Account
  const apostillePublicAccount = getPublicApostilleAccount(
    'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56',
    NetworkType.MIJIN_TEST);

  // Signer or Current Owner
  const signer = Account.createFromPrivateKey(
    'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee',
    NetworkType.MIJIN_TEST);

  // Second Signer or Current Owner
  const secondSigner = Account.createFromPrivateKey(
    'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaaa',
    NetworkType.MIJIN_TEST);

  // New owner
  const newOwner = PublicAccount.createFromPublicKey(
    '3F393E46EBB3F9825015C11C6ED130B23DB8639DDE5951DDA326D3ABAF2E1605',
    NetworkType.MIJIN_TEST);

  it('should return correct update transaction', () => {
    const updateTransaction: TransferTransaction = apostillePublicAccount.update(
      'LuxTag is awesome',
      []);
    expect(updateTransaction.recipient).toEqual(apostillePublicAccount.publicAccount.address);
  });

  it('should return correct signed update transaction', () => {
    const signedTransaction: SignedTransaction = apostillePublicAccount.updateAndSign(
      'LuxTag is awesome',
      [],
      signer);
    expect(signedTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return correct signed update transaction if hash provided', () => {
    const signedTransaction: SignedTransaction = apostillePublicAccount.updateAndSign(
      'LuxTag is awesome',
      [],
      signer,
      new SHA256());
    expect(signedTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return correct transfer transaction', () => {
    const transferTransaction: ModifyMultisigAccountTransaction = apostillePublicAccount.transfer(
      [newOwner],
      [signer.publicAccount],
      0,
      0);
    expect(transferTransaction.modifications.length).toEqual(2);
  });

  it('should return signed aggregate complete transfer transaction', () => {
    const signedTransferTransaction = apostillePublicAccount.transferAndSign(
      [newOwner],
      [signer.publicAccount],
      0,
      0,
      [signer],
      true);
    expect(signedTransferTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return signed aggregate complete transfer transaction with 2 cosignatories', () => {
    const signedTransferTransaction = apostillePublicAccount.transferAndSign(
      [newOwner],
      [signer.publicAccount],
      0,
      0,
      [signer, secondSigner],
      true);
    expect(signedTransferTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return signed aggregate bonded transfer transaction', () => {
    const signedAggregateBondedTransaction = apostillePublicAccount.transferAndSign(
      [newOwner],
      [signer.publicAccount],
      0,
      0,
      [signer],
      false);
    expect(signedAggregateBondedTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return signed aggregate bonded transfer transaction with 2 cosignatories', () => {
    const signedAggregateBondedTransaction = apostillePublicAccount.transferAndSign(
      [newOwner],
      [signer.publicAccount],
      0,
      0,
      [signer, secondSigner],
      false);
    expect(signedAggregateBondedTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return lock funds transaction', () => {
    const signedAggregateBondedTransaction = apostillePublicAccount.transferAndSign(
      [newOwner],
      [signer.publicAccount],
      0,
      0,
      [signer],
      false);
    const lockFundsTransaction = apostillePublicAccount.lockFundsTransaction(
      signedAggregateBondedTransaction);
    expect(lockFundsTransaction.type).toEqual(16716);
  });

  it('should return signed lock funds transaction', () => {
    const signedAggregateBondedTransaction = apostillePublicAccount.transferAndSign(
      [newOwner],
      [signer.publicAccount],
      0,
      0,
      [signer],
      false);
    const signedLockFundsTransaction = apostillePublicAccount.lockFundsTransactionAndSign(
      signedAggregateBondedTransaction,
      signer);
    expect(signedLockFundsTransaction.signer).toMatch(signer.publicKey);
  });
});

describe('apostille public account non transaction methods should work properly', () => {
  // Apostille Public Account1 1
  const apostillePublicAccount1 = getPublicApostilleAccount(
    'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56',
    NetworkType.MIJIN_TEST);

  // Apostille Public Account1 2
  const apostillePublicAccount2 = getPublicApostilleAccount(
    '67FD8C18BAACED8777EBF483B596D6BE0F93EDB2084FA39968DF8D2D96400E08',
    NetworkType.MIJIN_TEST);

  // Apostille Public Account1 3
  // const apostillePublicAccount3 = getPublicApostilleAccount(
  //   '901C9D46840BB74F4649EF3AF65A910A9F162DFA0FD5AD7E2739E5B82C2579F0',
  //   NetworkType.MIJIN_TEST);

  // Apostille Public Account1 4
  // const apostillePublicAccount4 = getPublicApostilleAccount(
  //   '95361ED8C94048BD5B0BDB229C19DF817DB7D66B59F4162E3F3A1D0D813B2AB9',
  //   NetworkType.MIJIN_TEST);

  it(' should return 2 cosignataries of the accounts', () => {
    return apostillePublicAccount1.getCosignatories().then((data) => {
        expect(data.length).toEqual(2);
    });
  });

  it('Should return true if the account is claimed', () => {
    return apostillePublicAccount1.isOwned().then((data) => {
        expect(data).toBeTruthy();
    });
  });

  it('Should return false if the account is not claimed', () => {
    return apostillePublicAccount2.isOwned().then((data) => {
        expect(data).toBeFalsy();
    });
  });

  // TODO: Move this test to luxtag SDK
  // it('Should return creation transaction when it is transfer transaction', () => {
  //   return apostillePublicAccount3.getCreationTransaction().then((data: TransferTransaction) => {
  //     expect(data.message.payload).toEqual('');
  //   });
  // });

  // TODO: Move this test to luxtag SDK
  // it('Should return creation transaction when the it is an aggregate complete transaction', () => {
  //   return apostillePublicAccount1.getCreationTransaction().then((data: TransferTransaction) => {
  //     expect(data.message.payload).toEqual('I am really really awesomeee');
  //   });
  // });

  // TODO: Move this test to luxtag SDK
  // it('Throws error if there is no first transactions', () => {
  //   return apostillePublicAccount4.getCreationTransaction().then((data: TransferTransaction) => {
  //     console.log(TransferTransaction);
  //   }).catch((err) => {
  //     expect(err).toEqual(Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
  //   });
  // });

  // it('Should return creation transaction info', () => {
  //   return apostillePublicAccount1.getCreationTransactionInfo().then((transactionInfo: TransactionInfo) => {
  //     expect(transactionInfo.id).toEqual('5B160E18C60E680001790BA2');
  //   });
  // });

  // Skipped because weird error by nem2 SDK
  // it.skip('returns correct transaction by ID', async () => {
  //   const transaction = await apostillePublicAccount1.getTransactionById(transactionID);

  //   if (transaction.transactionInfo) {
  //     expect(transaction.transactionInfo.id).toEqual(transactionID);
  //   }
  // });

});
