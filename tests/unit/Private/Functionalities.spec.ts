import { Account, NetworkType, TransactionType } from 'nem2-sdk';
import { Apostille, Initiator } from '../../../index';
import { Errors } from '../../../src/Errors';

const seed = '.N:@N%5SVjj3Wkmr-';
// A funny but valid private key
const sk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const generator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);

beforeAll(() => {
  jest.setTimeout(10000);
});

describe('Create functionn should work properly', () => {

  it('should throw an error if you try to create an apostille more than once', async () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator);
    expect.assertions(1);
    await privateApostille.create(initiator, 'raw');
    return privateApostille.create(initiator, 'raw').catch((e) => {
      expect(e.message).toMatch(Errors[Errors.APOSTILLE_ALREADY_CREATED]);
    });
  });

  it('should create a transfer transaction', () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator);
    return privateApostille.create(initiator, 'raw').then(() => {
      // tslint:disable-next-line:no-string-literal
      expect(privateApostille['transactions'][0].type).toEqual(TransactionType.TRANSFER);
    });
  });

  it('should create an aggregate complete transaction', () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator, creator.publicAccount, true);
    return privateApostille.create(initiator, 'raw').then(() => {
      // tslint:disable-next-line:no-string-literal
      expect(privateApostille['transactions'][0].type).toEqual(TransactionType.AGGREGATE_COMPLETE);
    });
  });

  it('should create an aggregate bounded transaction', () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator, creator.publicAccount, false);
    return privateApostille.create(initiator, 'raw').then(() => {
      // tslint:disable-next-line:no-string-literal
      expect(privateApostille['transactions'][0].type).toEqual(TransactionType.AGGREGATE_BONDED);
    });
  });

});

describe('update function should work properly', () => {

  it('should throw an error if we try to update before creating', async () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator);
    expect.assertions(1);
    return privateApostille.update(initiator, 'raw').catch((e) => {
      expect(e.message).toMatch(Errors[Errors.APOSTILLE_NOT_CREATED]);
    });
  });

  it('should create a transfer transaction', async () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator);
    expect.assertions(1);
    await privateApostille.create(initiator, 'raw');
    await privateApostille.update(initiator, 'update');
    // tslint:disable-next-line:no-string-literal
    expect(privateApostille['transactions'][1].type).toEqual(TransactionType.TRANSFER);
  });

  it('should create an aggregate complete transaction', async () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator, creator.publicAccount, true);
    expect.assertions(1);
    await privateApostille.create(initiator, 'raw');
    await privateApostille.update(initiator, 'update');
    // tslint:disable-next-line:no-string-literal
    expect(privateApostille['transactions'][0].type).toEqual(TransactionType.AGGREGATE_COMPLETE);
  });

  it('should create an aggregate bounded transaction', async () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator, creator.publicAccount, false);
    expect.assertions(1);
    await privateApostille.create(initiator, 'raw');
    await privateApostille.update(initiator, 'update');
    // tslint:disable-next-line:no-string-literal
    expect(privateApostille['transactions'][0].type).toEqual(TransactionType.AGGREGATE_BONDED);
  });

});

describe('associate function should work properly', () => {

  it('should create an aggregate bounded transaction', async () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator, creator.publicAccount, false);
    expect.assertions(1);
    await privateApostille.create(initiator, 'raw');
    await privateApostille.update(initiator, 'update');
    privateApostille.associate([initiator.account.publicAccount], 1, 1);
    // tslint:disable-next-line:no-string-literal
    expect(privateApostille['transactions'][2].type).toEqual(TransactionType.MODIFY_MULTISIG_ACCOUNT);
  });

});

describe('transfer function should work properly', () => {

  it('should create an aggregate complete transaction', async () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator, creator.publicAccount, false);
    expect.assertions(1);
    privateApostille.transfer([creator], true, [creator.publicAccount], [creator.publicAccount], 0, 0);
    // tslint:disable-next-line:no-string-literal
    expect(privateApostille['transactions'][0].type).toEqual(TransactionType.AGGREGATE_COMPLETE);
  });

  it('should create an aggregate complete transaction', async () => {
    const privateApostille = Apostille.init(seed, generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator, creator.publicAccount, false);
    expect.assertions(1);
    privateApostille.transfer([creator], false, [], [], 0, 0);
    // tslint:disable-next-line:no-string-literal
    expect(privateApostille['transactions'][0].type).toEqual(TransactionType.AGGREGATE_BONDED);
  });

});

describe('isCreated function should work properly', () => {

  it('should return false before creation', async () => {
    const privateApostille = Apostille.init('QUleqZedaOUtlSh', generator);
    expect.assertions(1);
    return privateApostille.isCreated().then((result) => {
      expect(result).toBeFalsy();
    });
  });

  it('should return true after creation', async () => {
    const privateApostille = Apostille.init('new random seed', generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator);
    expect.assertions(1);
    await privateApostille.create(initiator, 'raw');
    return privateApostille.isCreated().then((result) => {
      expect(result).toBeTruthy();
    });
  });

  it('should return true for an already created apostille', async () => {
    const privateApostille = Apostille.init('MIJIN_TEST', generator);
    expect.assertions(1);
    return privateApostille.isCreated().then((result) => {
      expect(result).toBeTruthy();
    });
  });

  it('should throw an error if we don\'t specefy mijin endpoint url', () => {
    const MJgenerator = Account.createFromPrivateKey(sk, NetworkType.MIJIN);
    try {
      return Apostille.init('k7u*VTsVCk6h,FdN', MJgenerator);
    } catch (e) {
      expect(e.message).toMatch(Errors[Errors.MIJIN_ENDPOINT_NEEDED]);
    }
  });

  it('should return false before an announce', () => {
    const MTgenerator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const apostilleMT = Apostille.init('QUleqZedaOUtlSh', MTgenerator);
    return apostilleMT.isCreated().then((MT) => {
      expect(MT).toBeFalsy();
    });
  });

  it('should return true after an announce', async () => {
    const privateApostille = Apostille.init('_934@Ve*,tM(3MN-', generator);
    const creator = Account.createFromPrivateKey(sk, NetworkType.MIJIN_TEST);
    const initiator = new Initiator(creator);
    privateApostille.created = true;
    await privateApostille.update(initiator, 'update');
    await privateApostille.announce();
    return privateApostille.isCreated().then((result) => {
      expect(result).toBeTruthy();
    });
  });

  it('should return true for an already announced apostille', () => {
    const privateApostille = Apostille.init('MIJIN_TEST', generator);
    return privateApostille.isCreated().then((result) => {
      expect(result).toBeTruthy();
    });
  });
});

// TODO: check the order of transactions
// TODO: no transfer transaction should exist after a multisig modification
