import { Account, AggregateTransaction, Deadline, NetworkType, PublicAccount, TransactionType } from 'nem2-sdk';
import { IMultisigInitiator, Initiator, initiatorAccountType } from '../../../src/infrastructure/Initiator';
import { Errors } from '../../../src/types/Errors';
import { ApostilleHttp } from './../../../src/infrastructure/ApostilleHttp';
import { ApostillePublicAccount } from './../../../src/model/apostille/ApostillePublicAccount';

const network = NetworkType.MIJIN_TEST;
const pk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const accountPK = Account.createFromPrivateKey(pk, network);
const publicAccountPublicKey = 'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56';
const publicAccount = PublicAccount.createFromPublicKey(publicAccountPublicKey, network);
const apostillePublicAccountPublicKey = 'E15CAB00A5A34216A8A29034F950A18DFC6F4F27BCCFBF9779DC6886653B7E56';
const apostillePublicAccount = ApostillePublicAccount.createFromPublicKey(apostillePublicAccountPublicKey, network);
const completeInitiator = new Initiator(accountPK);
const multiSigInitiator = new Initiator(apostillePublicAccount.publicAccount,
  initiatorAccountType.MULTISIG_ACCOUNT,
  {
    cosignatories: [accountPK],
    isComplete: true,
  });
const incompleteInitiator = new Initiator(apostillePublicAccount.publicAccount,
  initiatorAccountType.MULTISIG_ACCOUNT,
  {
    cosignatories: [accountPK],
    isComplete: false,
  });
const hwInitiator = new Initiator(publicAccount, initiatorAccountType.HARDWARE_WALLET);

const transferTransaction = apostillePublicAccount.transfer([publicAccount], [publicAccount], 0, 0);

describe('Initiator', () => {
  describe('Regular account initiator', () => {
    it('should accept a regular account', () => {
      const account = accountPK;
      const initiator = new Initiator(account);
      expect(initiator.publicAccount.publicKey).toBe(account.publicKey);
      expect(initiator.accountType).toBe(initiatorAccountType.ACCOUNT);
      expect(initiator.complete).toBe(true);
    });

    it('should throw if no private key', () => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new Initiator(publicAccount);
      }).toThrowError(Errors[Errors.INITIATOR_TYPE_ACCOUNT_REQUIRE_ACCOUNT]);
    });

    it('should be able to sign', () => {
      const account = accountPK;
      const initiator = new Initiator(account);
      expect(initiator.canSign()).toBe(true);
    });
  });

  describe('Hardware wallet initiator', () => {
    it('should accept an account with no private key', () => {
      const account = publicAccount;
      const initiator = new Initiator(account, initiatorAccountType.HARDWARE_WALLET);
      expect(initiator.account.publicKey).toBe(account.publicKey);
      expect(initiator.accountType).toBe(initiatorAccountType.HARDWARE_WALLET);
      expect(initiator.complete).toBe(false);
    });

    it('should not be able to sign', () => {
      const account = publicAccount;
      const initiator = new Initiator(account, initiatorAccountType.HARDWARE_WALLET);
      expect(initiator.canSign()).toBe(false);
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
      expect(initiator.publicAccount.equals(account)).toBeTruthy();
      expect(initiator.complete).toBe(true);
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
      expect(initiator.complete).toBe(false);
    });

    it('should be able to sign', () => {
      const account = publicAccount;
      const multisigSigner = accountPK;
      const multisigInfo: IMultisigInitiator = {
        cosignatories: [
          multisigSigner,
        ],
        isComplete: false,
      };
      const initiator = new Initiator(account, initiatorAccountType.MULTISIG_ACCOUNT, multisigInfo);
      expect(initiator.canSign()).toBe(true);
    });
  });

  describe('Signing', () => {
    it('should return signed transaction', () => {
      const signedTransferTransaction = completeInitiator.sign(transferTransaction);
      expect(signedTransferTransaction.signer).toMatch(accountPK.publicKey);
      expect(signedTransferTransaction.type).toBe(TransactionType.MODIFY_MULTISIG_ACCOUNT);
    });

    it('should throw error for hardware wallet', () => {
      expect(() => {
        hwInitiator.sign(transferTransaction);
      }).toThrowError(Errors[Errors.INITIATOR_UNABLE_TO_SIGN]);
    });

    it('should return signed aggregate complete transfer transaction', () => {
      const signedTransferTransaction = multiSigInitiator.sign(transferTransaction);
      expect(signedTransferTransaction.signer).toMatch(accountPK.publicKey);
      expect(signedTransferTransaction.type).toBe(TransactionType.AGGREGATE_COMPLETE);
    });

    it('should return signed aggregate bonded transfer transaction', () => {
      const signedTransferTransaction = incompleteInitiator.sign(transferTransaction);
      expect(signedTransferTransaction.signer).toMatch(accountPK.publicKey);
      expect(signedTransferTransaction.type).toBe(TransactionType.AGGREGATE_BONDED);
    });

    it('should return signed lock funds transaction', () => {
      const signedTransferTransaction = incompleteInitiator.sign(transferTransaction);
      const lockFundsTransaction =  ApostilleHttp.createLockFundsTransaction(signedTransferTransaction);
      const signedLockFundsTransaction = incompleteInitiator.sign(lockFundsTransaction);
      expect(lockFundsTransaction.type).toBe(TransactionType.LOCK);
      expect(signedLockFundsTransaction.type).toBe(TransactionType.LOCK);
      expect(signedLockFundsTransaction.signer).toMatch(accountPK.publicKey);
    });

    it('should throw error if using account to sign aggregate transactions', () => {
      const transferTransaction1 = apostillePublicAccount.update('raw');
      const transferTransaction2 = apostillePublicAccount.update('raw');
      const aggregateTransaction = AggregateTransaction.createComplete(
        Deadline.create(),
        [
          transferTransaction1.toAggregate(apostillePublicAccount.publicAccount),
          transferTransaction2.toAggregate(apostillePublicAccount.publicAccount),
        ],
        transferTransaction1.networkType,
        []);
      expect(() => {
        completeInitiator.sign(aggregateTransaction);
      }).toThrowError(Errors[Errors.INITIATOR_UNABLE_TO_SIGN]);
    });

    it('can sign aggregate transactions', () => {
      const transferTransaction1 = apostillePublicAccount.update('raw');
      const transferTransaction2 = apostillePublicAccount.update('raw');
      const aggregateTransaction = AggregateTransaction.createComplete(
        Deadline.create(),
        [
          transferTransaction1.toAggregate(apostillePublicAccount.publicAccount),
          transferTransaction2.toAggregate(apostillePublicAccount.publicAccount),
        ],
        transferTransaction1.networkType,
        []);
      const signedAggregateTransaction = multiSigInitiator.sign(aggregateTransaction);
      expect(signedAggregateTransaction.signer).toMatch(accountPK.publicKey);
      expect(signedAggregateTransaction.type).toBe(TransactionType.AGGREGATE_COMPLETE);
    });
  });

});
