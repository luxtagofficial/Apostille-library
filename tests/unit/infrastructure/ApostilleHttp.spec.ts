import { chain, isEqual } from 'lodash';
import { Account, NetworkType, PublicAccount } from 'nem2-sdk';
import { reduce, take } from 'rxjs/operators';
import { ApostilleHttp } from '../../../src/infrastructure/ApostilleHttp';
import { ApostillePublicAccount } from '../../../src/model/apostille/ApostillePublicAccount';
import { HistoricalEndpoints } from '../../../src/model/repository/HistoricalEndpoints';
import { Errors } from '../../../src/types/Errors';
import { Initiator, initiatorAccountType } from './../../../src/infrastructure/Initiator';

const getPublicApostilleAccount = ((publicKey: string, networkType: NetworkType): ApostillePublicAccount => {
  // Account 1
  const publicAccount = PublicAccount.createFromPublicKey(
  publicKey,
  networkType,
  );
  return new ApostillePublicAccount(publicAccount);
});

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

// Apostille Public Account 4
const owner1 = PublicAccount.createFromPublicKey(
  'F8F36DE56950993330A020CDD76B5C1D82266E3460F91EE43FBEFB71E8A8A193',
  NetworkType.MIJIN_TEST);

// Apostille Public Account 4
// const owner2 = PublicAccount.createFromPublicKey(
//   '22816F825B4CACEA334723D51297D8582332D8B875A5829908AAE85831ABB508',
//   NetworkType.MIJIN_TEST);

const network = NetworkType.MIJIN_TEST;
const pk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const accountPK = Account.createFromPrivateKey(pk, network);
const completeInitiator = new Initiator(accountPK);
const multiSigInitiator = new Initiator(apostillePublicAccount1.publicAccount,
  initiatorAccountType.MULTISIG_ACCOUNT,
  {
    cosignatories: [accountPK],
    isComplete: true,
  });
const incompleteInitiator = new Initiator(apostillePublicAccount1.publicAccount,
  initiatorAccountType.MULTISIG_ACCOUNT,
  {
    cosignatories: [accountPK],
    isComplete: false,
  });
const hwInitiator = new Initiator(owner1, initiatorAccountType.HARDWARE_WALLET);

// const transferTransaction = apostillePublicAccount1.transfer([owner1], [owner2], 0, 0);

describe('apostille public account non transaction methods should work properly', () => {
  it('should return 2 cosignataries of the accounts', () => {
    expect.assertions(1);
    return expect(apostilleHttp.getCosignatories(apostillePublicAccount1.publicAccount.address))
      .resolves.toHaveLength(2);

  });

  it('should return true if the account is claimed', () => {
    expect.assertions(1);
    return expect(apostilleHttp.isOwned(apostillePublicAccount1.publicAccount.address)).resolves.toBeTruthy();
  });

  it('should return false if the account is not claimed', () => {
    expect.assertions(1);
    return expect(apostilleHttp.isOwned(apostillePublicAccount2.publicAccount.address)).resolves.toBeFalsy();
  });

  it('should return creation transaction when it is transfer transaction', async () => {
    expect.assertions(1);
    const data = await apostilleHttp.getCreationTransaction(apostillePublicAccount3.publicAccount);
    return expect(data.message.payload).toEqual('');
  });

  it('should return creation transaction when the it is an aggregate complete transaction', async () => {
    expect.assertions(1);
    const data = await apostilleHttp.getCreationTransaction(apostillePublicAccount1.publicAccount);
    return expect(data.message.payload).toEqual('I am really really awesomeee');
  });

  it('should throw error if there is no first transactions', async () => {
    expect.assertions(1);
    return expect(
      apostilleHttp.getCreationTransaction(apostillePublicAccount4.publicAccount),
    ).rejects.toEqual(Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
  });

  it('should return creation transaction info', async () => {
    expect.assertions(1);
    const transactionInfo = await apostilleHttp.getCreationTransactionInfo(
      apostillePublicAccount1.publicAccount);
    return expect(transactionInfo.id).toEqual('5B160E18C60E680001790BA2');
  });

  describe('fetchAllTransactions', () => {
    it('should return more than one page', async () => {
      expect.assertions(1);
      const accountLarge = PublicAccount.createFromPublicKey(
        'FE9F2C724D0E0360A20B9ED7591E4E25CF25D6F4A4E8E52C491C62D2452397F8',
        NetworkType.MIJIN_TEST);
      const transactions = await apostilleHttp.fetchAllTransactions(accountLarge)
        .pipe(
          take(2),
          reduce((acc, txs) => {
            return acc.concat(txs);
          }),
        ).toPromise();
      return expect(transactions.length).toBeGreaterThan(100);
    });
    it('should return all transactions', async () => {
      const txs = await apostilleHttp.fetchAllTransactionsSync(apostillePublicAccount1.publicAccount);
      expect(txs.length).toBeGreaterThan(0);
    });
  });

  describe('addTransaction', () => {
    it('should add new transactions to list', () => {
      expect.assertions(1);
      const transaction = apostillePublicAccount1.update('Brand new signature');
      const initiator = completeInitiator;
      expect(apostilleHttp.addTransaction(transaction, initiator)).toBeGreaterThan(0);
    });
    it('should not be able to add transactions to be signed by hardware wallets', () => {
      expect.assertions(1);
      const transaction = apostillePublicAccount1.update('Brand new signature');
      const initiator = hwInitiator;
      expect(() => {
        apostilleHttp.addTransaction(transaction, initiator);
      }).toThrowError(Errors[Errors.INITIATOR_UNABLE_TO_SIGN]);
    });
  });

  it('should reduce initiator list', () => {
    const accountList = apostilleHttp.reduceInitiatorList([multiSigInitiator, incompleteInitiator]);
    expect(isEqual(accountList, [accountPK])).toBe(true);
  });

  it('should create two aggregate transactions for innerTransactions > 1000', () => {
    const transaction = apostillePublicAccount1.update('Brand new signature');
    const innerTx = transaction.toAggregate(multiSigInitiator.publicAccount);
    const innerTxs = chain(new Array(1500))
      .fill({
        initiator: multiSigInitiator,
        innerTransaction: innerTx,
      })
      .value();
    expect(apostilleHttp.aggregateAndSign(innerTxs)).toHaveLength(2);
  });

});
