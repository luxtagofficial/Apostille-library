import { Account, NetworkType, PublicAccount, TransactionType } from 'nem2-sdk';
import { Apostille } from '../../../../src/model/apostille/Apostille';

const seed = '.N:@N%5SVjj3Wkmr-';

// A funny but valid private key
const sk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';

describe('Apostille class should work properly with MIJIN_TEST Network Type', () => {

  const generator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
  const apostille = Apostille.initFromSeed(seed, generator);

  it('Apostille.init with MIJIN_TEST NetworkType should return correct HDAccount', () => {
    expect(apostille.HDAccount.privateKey).toMatch(
    'E26A117C038068239E312E04F2B43DCC839D31BE7471D04DCCE905C2DC164107');
  });

  it('should return correct PublicApostilleAccount', () => {
    expect(apostille.publicAccount.equals(apostille.HDAccount.publicAccount)).toBeTruthy();
  });

  describe('associate function should work properly', () => {

    it('should create a ModifyMultisigAccount transaction', async () => {
      const signedTransaction = apostille.associate([generator.publicAccount], 1, 1);
      expect(signedTransaction.transaction.type).toEqual(TransactionType.MODIFY_MULTISIG_ACCOUNT);
    });

    it('should returned correct signer', () => {
      const ownerPublicAccount = PublicAccount.createFromPublicKey(
        'E41D411DE4FEF6FA3097D869FAB918DB8ADF20779F464C27EDE3BA0762F4D85D',
        NetworkType.MIJIN_TEST,
      );
      const signedTransaction = apostille.associate([ownerPublicAccount], 1, 1);
      expect(signedTransaction.initiator.publicAccount.equals(apostille.HDAccount.publicAccount)).toBeTruthy();
    });

  });
});

describe('Apostille class should work properly with MAIN_NET Network Type', () => {
  const generator = Account.createFromPrivateKey(sk, NetworkType.MAIN_NET);
  const apostille = Apostille.initFromSeed(seed, generator);

  it('Apostille.init with MAIN_NET NetworkType should return correct HDAccount', () => {
    expect(apostille.HDAccount.privateKey).toMatch(
      '61AC074E12209092FAECC6625FB28D42606E83B1FDB90591DBF0F5C762009300');
  });
});
