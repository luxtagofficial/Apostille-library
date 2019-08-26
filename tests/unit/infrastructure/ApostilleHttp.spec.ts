import { chain, isEqual } from 'lodash';
import { Account, NetworkType, PublicAccount } from 'nem2-sdk';
import { reduce, take } from 'rxjs/operators';
import { ApostilleHttp } from '../../../src/infrastructure/ApostilleHttp';
import { ApostillePublicAccount } from '../../../src/model/apostille/ApostillePublicAccount';
import { HistoricalEndpoints } from '../../../src/model/repository/HistoricalEndpoints';
import { Errors } from '../../../src/types/Errors';
import { Initiator, initiatorAccountType } from './../../../src/infrastructure/Initiator';

const getApostillePublicAccount = ((publicKey: string, networkType: NetworkType): ApostillePublicAccount => {
  // Account 1
  const publicAccount = PublicAccount.createFromPublicKey(
  publicKey,
  networkType,
  );
  return new ApostillePublicAccount(publicAccount);
});

const apostilleHttp = new ApostilleHttp(HistoricalEndpoints[NetworkType.MIJIN_TEST]);
// Apostille Public Account 1
const apostillePublicAccount1 = getApostillePublicAccount(
  'DBBD409AB6E8900AD31CA0A5E2D85FB7F2DE559FC0325E76A191A4BF8B26C020',
  NetworkType.MIJIN_TEST);

// Apostille Public Account 2
const apostillePublicAccount2 = getApostillePublicAccount(
  '67FD8C18BAACED8777EBF483B596D6BE0F93EDB2084FA39968DF8D2D96400E08',
  NetworkType.MIJIN_TEST);

// Apostille Public Account 4
const apostillePublicAccount4 = getApostillePublicAccount(
  '95361ED8C94048BD5B0BDB229C19DF817DB7D66B59F4162E3F3A1D0D813B2AB9',
  NetworkType.MIJIN_TEST);

// Apostille Public Account 4
const owner1 = PublicAccount.createFromPublicKey(
  'F8F36DE56950993330A020CDD76B5C1D82266E3460F91EE43FBEFB71E8A8A193',
  NetworkType.MIJIN_TEST);

const network = NetworkType.MIJIN_TEST;
const generationHash = 'F669FE7D1FBAC0823334E5C01BD6D54E4F8B4D25AC8FEB24D15266FE6F1569CB';
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
  it('should return 1 cosignataries of the accounts', () => {
    expect.assertions(1);
    return expect(apostilleHttp.getCosignatories(apostillePublicAccount1.publicAccount.address))
      .resolves.toHaveLength(1);

  });

  it('should return true if the account is claimed', () => {
    expect.assertions(1);
    return expect(apostilleHttp.isOwned(apostillePublicAccount1.publicAccount.address)).resolves.toBeTruthy();
  });

  it.skip('should return false if the account is not claimed', () => {
    expect.assertions(1);
    return expect(apostilleHttp.isOwned(apostillePublicAccount2.publicAccount.address)).resolves.toBeFalsy();
  });

  it('should return creation transaction when it is an aggregate complete transaction', async () => {
    expect.assertions(1);
    const data = await apostilleHttp.getCreationTransaction(apostillePublicAccount1.publicAccount);
    return expect(data.message.payload).toEqual('{\"filename\":\"luxtag1.png\",\"tags\":[\"apostille\",\"sample\",\"LuxTag\"],\"description\":\"LuxTag logo\",\"originFileURL\":\"https://luxtag.io/wp-content/uploads/2018/04/logo-Luxtag-uai-720x269.png\"}');
  });

  it('should throw error if there is no first transactions', async () => {
    expect.assertions(1);
    return expect(
      apostilleHttp.getCreationTransaction(apostillePublicAccount4.publicAccount),
    ).rejects.toEqual(Errors[Errors.CREATION_TRANSACTIONS_NOT_FOUND]);
  });

  it.skip('should return creation transaction info', async () => {
    expect.assertions(1);
    const transactionInfo = await apostilleHttp.getCreationTransactionInfo(
      apostillePublicAccount1.publicAccount);
    return expect(transactionInfo.hash).toEqual('7356D0917464FDA989106FDCA9C66529AE07D59F93E9D857F15D60DF66A13B07');
  });

  describe('fetchAllTransactions', () => {
    it.skip('should return more than one page', async () => {
      expect.assertions(1);
      const transactions = await apostilleHttp.fetchAllTransactions(apostillePublicAccount1.publicAccount)
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
      expect(apostilleHttp.addTransaction({initiator, transaction})).toBeGreaterThan(0);
    });
    it('should not be able to add transactions to be signed by hardware wallets', () => {
      expect.assertions(1);
      const transaction = apostillePublicAccount1.update('Brand new signature');
      const initiator = hwInitiator;
      expect(() => {
        apostilleHttp.addTransaction({initiator, transaction});
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
    expect(apostilleHttp.aggregateAndSign(innerTxs, generationHash)).toHaveLength(2);
  });

});
