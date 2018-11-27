import { Account, NetworkType, PublicAccount, TransactionType } from 'nem2-sdk';
import { SHA256 } from '../../../../src/hash/sha256';
import { ApostillePublicAccount } from '../../../../src/model/apostille/ApostillePublicAccount';
import { Errors } from '../../../../src/types/Errors';

const getPublicApostilleAccount = ((publicKey: string, networkType: NetworkType): ApostillePublicAccount => {
  // Account 1
  const publicAccount = PublicAccount.createFromPublicKey(
    publicKey,
    networkType,
  );
  return new ApostillePublicAccount(publicAccount);
});

describe('apostille public account constructor should work properly', () => {
  const publicAccount = PublicAccount.createFromPublicKey(
    'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56',
    NetworkType.MIJIN_TEST,
  );

  // Apostille Public Account
  const apostillePublicAccount = new ApostillePublicAccount(publicAccount);

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
    const updateTransaction = apostillePublicAccount.update(
      'LuxTag is awesome',
      []);
    expect(updateTransaction.recipient).toEqual(apostillePublicAccount.publicAccount.address);
  });

  it('Create function should be a transfer type transaction', () => {
    const updateTransaction = apostillePublicAccount.update(
      'LuxTag is awesome',
      []);
    expect(updateTransaction.type).toEqual(TransactionType.TRANSFER);
  });

  it('should return correct signed update transaction', () => {
    const updateTransaction = apostillePublicAccount.update(
      'LuxTag is awesome',
      []);
    const signedTransaction = apostillePublicAccount.sign(updateTransaction, signer);
    expect(signedTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return correct signed update transaction if hash provided', () => {
    const updateTransaction = apostillePublicAccount.update(
      'LuxTag is awesome',
      []);
    const signedTransaction = apostillePublicAccount.sign(
      updateTransaction,
      signer,
      new SHA256());
    expect(signedTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return correct transfer transaction', () => {
    const transferTransaction = apostillePublicAccount.transfer(
      [newOwner],
      [signer.publicAccount],
      0,
      0);
    expect(transferTransaction.modifications.length).toEqual(2);
  });

  it('should throw error if no cosignatories are present', () => {
    const transferTransaction = apostillePublicAccount.transfer(
      [newOwner],
      [signer.publicAccount],
      0,
      0);
    expect(() => {
      apostillePublicAccount.signAggregate(
      transferTransaction,
      [],
      true);
    }).toThrowError(Errors[Errors.UNABLE_TO_SIGN_AGGREGATE_TRANSACTION]);
  });

  it('should return signed aggregate complete transfer transaction', () => {
    const transferTransaction = apostillePublicAccount.transfer(
      [newOwner],
      [signer.publicAccount],
      0,
      0);
    const signedTransferTransaction = apostillePublicAccount.signAggregate(
      transferTransaction,
      [signer],
      true);
    expect(signedTransferTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return signed aggregate complete transfer transaction with 2 cosignatories', () => {
    const transferTransaction = apostillePublicAccount.transfer(
      [newOwner],
      [signer.publicAccount],
      0,
      0);
    const signedTransferTransaction = apostillePublicAccount.signAggregate(
      transferTransaction,
      [signer, secondSigner],
      true);
    expect(signedTransferTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return signed aggregate bonded transfer transaction', () => {
    const aggregateBondedTransaction = apostillePublicAccount.transfer(
      [newOwner],
      [signer.publicAccount],
      0,
      0);
    const signedAggregateBondedTransaction = apostillePublicAccount.signAggregate(
      aggregateBondedTransaction,
      [signer],
      false);
    expect(signedAggregateBondedTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return signed aggregate bonded transfer transaction with 2 cosignatories', () => {
    const aggregateBondedTransaction = apostillePublicAccount.transfer(
      [newOwner],
      [signer.publicAccount],
      0,
      0);
    const signedAggregateBondedTransaction = apostillePublicAccount.signAggregate(
      aggregateBondedTransaction,
      [signer, secondSigner],
      false);
    expect(signedAggregateBondedTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  it('should return lock funds transaction', () => {
    const aggregateBondedTransaction = apostillePublicAccount.transfer(
      [newOwner],
      [signer.publicAccount],
      0,
      0);
    const signedAggregateBondedTransaction = apostillePublicAccount.signAggregate(
      aggregateBondedTransaction,
      [signer],
      false);
    const lockFundsTransaction = apostillePublicAccount.lockFundsTransaction(
      signedAggregateBondedTransaction);
    expect(lockFundsTransaction.type).toEqual(16716);
  });

  it('should return signed lock funds transaction', () => {
    const aggregateBondedTransaction = apostillePublicAccount.transfer(
      [newOwner],
      [signer.publicAccount],
      0,
      0);
    const signedAggregateBondedTransaction = apostillePublicAccount.signAggregate(
      aggregateBondedTransaction,
      [signer],
      false);
    const lockFundsTransaction = apostillePublicAccount.lockFundsTransaction(
      signedAggregateBondedTransaction);
    const signedLockFundsTransaction = apostillePublicAccount.sign(
      lockFundsTransaction,
      signer);
    expect(signedLockFundsTransaction.signer).toMatch(signer.publicKey);
  });

});
