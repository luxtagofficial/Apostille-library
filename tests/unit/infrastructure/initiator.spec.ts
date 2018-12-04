import { Account, NetworkType, PublicAccount } from 'nem2-sdk';
import { IMultisigInitiator, Initiator, initiatorAccountType } from '../../../src/infrastructure/Initiator';
import { Errors } from '../../../src/types/Errors';

// A funny but valid private key
const pk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const accountPK = Account.createFromPrivateKey(pk, NetworkType.MIJIN_TEST);
const publicAccountPublicKey = 'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56';
const publicAccount = PublicAccount.createFromPublicKey(publicAccountPublicKey, NetworkType.MIJIN_TEST);

describe('Initiator', () => {
  describe('Regular account initiator', () => {
    it('should accept a regular account', () => {
      const account = accountPK;
      const initiator = new Initiator(account);
      expect(initiator.account.publicKey).toBe(account.publicKey);
      expect(initiator.accountType).toBe(initiatorAccountType.ACCOUNT);
      expect(initiator.complete).toBeTruthy();
    });

    it('should throw if no private key', () => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new Initiator(publicAccount);
      }).toThrowError(Errors[Errors.INITIATOR_TYPE_ACCOUNT_REQUIRE_ACCOUNT]);
    });
  });

  describe('Hardware wallet initiator', () => {
    it('should accept an account with no private key', () => {
      const account = publicAccount;
      const initiator = new Initiator(account, initiatorAccountType.HARDWARE_WALLET);
      expect(initiator.account.publicKey).toBe(account.publicKey);
      expect(initiator.accountType).toBe(initiatorAccountType.HARDWARE_WALLET);
      expect(initiator.complete).toBeFalsy();
    });
  });

  describe('Multisig account initiator', () => {
    it('should throw without multisig initiator', () => {
      const account = publicAccount;
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new Initiator(account, initiatorAccountType.MULTISIG_ACCOUNT);
      }).toThrowError(Errors[Errors.INITIATOR_TYPE_MULTISIG_REQUIRE_MULTISIG_INITIATOR]);
    });
    it('should throw if no signers are present', () => {
      const account = publicAccount;
      const multisigInfo: IMultisigInitiator = {
        cosignatories: [],
        isComplete: false,
      };
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new Initiator(account, initiatorAccountType.MULTISIG_ACCOUNT, multisigInfo);
      }).toThrowError(Errors[Errors.INITIATOR_TYPE_MULTISIG_REQUIRE_AT_LEAST_ONE_COSIGNER]);
    });
    it('should create multisig initiator', () => {
      const account = publicAccount;
      const multisigSigner = accountPK;
      const multisigInfo: IMultisigInitiator = {
        cosignatories: [
          multisigSigner,
        ],
        isComplete: true,
      };
      const initiator = new Initiator(account, initiatorAccountType.MULTISIG_ACCOUNT, multisigInfo);
      expect(initiator.complete).toBeTruthy();
    });
    it('should return incomplete if not all signers are present', () => {
      const account = publicAccount;
      const multisigSigner = accountPK;
      const multisigInfo: IMultisigInitiator = {
        cosignatories: [
          multisigSigner,
        ],
        isComplete: false,
      };
      const initiator = new Initiator(account, initiatorAccountType.MULTISIG_ACCOUNT, multisigInfo);
      expect(initiator.complete).toBeFalsy();
    });
  });

});
