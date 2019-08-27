import { Account, NetworkType, PublicAccount, TransactionType } from 'nem2-sdk';
import { Initiator } from '../../../../src/infrastructure/Initiator';
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

const generationHash = 'F669FE7D1FBAC0823334E5C01BD6D54E4F8B4D25AC8FEB24D15266FE6F1569CB';

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
  const signerInitiator = new Initiator(signer);
  // New owner
  const newOwner = PublicAccount.createFromPublicKey(
    '3F393E46EBB3F9825015C11C6ED130B23DB8639DDE5951DDA326D3ABAF2E1605',
    NetworkType.MIJIN_TEST);

  const updateTransaction = apostillePublicAccount.update('LuxTag is awesome');

  it('has address getter', () => {
    expect(apostillePublicAccount.publicAccount.address.plain()).toEqual(apostillePublicAccount.address.plain());
  });

  it('has publicKey getter', () => {
    expect(apostillePublicAccount.publicAccount.publicKey).toEqual(apostillePublicAccount.publicKey);
  });

  it('should return correct update transaction', () => {
    expect(updateTransaction.recipient).toEqual(apostillePublicAccount.publicAccount.address);
  });

  it('Create function should be a transfer type transaction', () => {
    expect(updateTransaction.type).toEqual(TransactionType.TRANSFER);
  });

  it('should not sign if apostille and signer are from different networkTypes', () => {
    const alienAccount = Account.createFromPrivateKey(
      'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee',
      NetworkType.MAIN_NET);
    const alienInitiator = new Initiator(alienAccount);
    expect(() => {
      alienInitiator.sign(updateTransaction, generationHash);
    }).toThrowError(Errors[Errors.NETWORK_TYPE_MISMATCHED]);
  });

  it('should return correct signed update transaction', () => {
    const signedTransaction = signerInitiator.sign(updateTransaction, generationHash);
    expect(signedTransaction.signer).toMatch(signer.publicAccount.publicKey);
  });

  // it.skip('should return correct signed update transaction if hash provided', () => {
  //   const signedTransaction = signerInitiator.sign(
  //     updateTransaction,
  //     signer,
  //     new SHA256());
  //   expect(signedTransaction.signer).toMatch(signer.publicAccount.publicKey);
  // });

  it('should return correct transfer transaction', () => {
    const transferTransaction = apostillePublicAccount.transfer(
      [newOwner],
      [signer.publicAccount],
      0,
      0);
    expect(transferTransaction.modifications.length).toEqual(2);
  });

});
