import * as nemSDK from 'nem-sdk';
import { Account, Address, Deadline, ModifyMultisigAccountTransaction, MultisigCosignatoryModification, MultisigCosignatoryModificationType, NetworkType, PublicAccount, TransactionType } from 'nem2-sdk';
import { ApostilleAccount } from './ApostilleAccount';
import { IReadyTransaction } from './IReadyTransaction';
import { Initiator } from './Initiator';
import { SHA256 } from './hashFunctions';

const nem = nemSDK.default;
// TODO: add tx hash of creation
// TODO: a getter function for getting all the owners of the apostille
/**
 * @description the private apostille class
 * @class Apostille
 */
class Apostille extends ApostilleAccount {

  public static init(
    seed: string,
    generatorAccount: Account): Apostille {
    const networkType = generatorAccount.address.networkType;
    // hash the seed for the apostille account
    const hashSeed = SHA256.hash(seed);
    let privateKey: string;
    // sign the hashed seed to get the private key
    if (networkType === NetworkType.MAIN_NET || networkType === NetworkType.TEST_NET) {
      const keyPair = nem.crypto.keyPair.create(generatorAccount.privateKey);
      privateKey = nem.utils.helpers.fixPrivateKey(keyPair.sign(hashSeed).toString());
    } else {
      privateKey = nem.utils.helpers.fixPrivateKey(generatorAccount.signData(hashSeed));
    }
    // create the HD acccount (appostille)
    const hdAccount = Account.createFromPrivateKey(privateKey, networkType);
    return new Apostille(hdAccount, generatorAccount);
  }

  public static initWithPrivateKey(privateKey: string, networkType: NetworkType) {
    // create the HD acccount (appostille)
    const hdAccount = Account.createFromPrivateKey(privateKey, networkType);
    return new Apostille(hdAccount);
  }

  /**
   * Creates an instance of Apostille.
   * @param {Account} hdAccount - the apostille account (HD account)
   * @param {Account} generatorAccount - the account used to sign the hash to generate the HD account private key
   * @memberof Apostille
   */
  private constructor(
    public readonly hdAccount: Account,
    private readonly generatorAccount?: Account,
  ) {
    super(hdAccount.publicAccount);
  }

  /**
   * @description - create a multisig contract to own the apostille account
   * @param {PublicAccount[]} owners - array of public account that will become owners
   * @param {number} quorum - the minimum number of owners necessary to agree on the apostille account activities
   * @param {number} minRemoval - minimum number of owners necessary to agree to remove one or some owners
   * @memberof Apostille
   */
  public associate(owners: PublicAccount[], quorum: number, minRemoval: number): void {
    const modifications: MultisigCosignatoryModification[] = [];
    owners.forEach((cosignatory) => {
      modifications.push(
        new MultisigCosignatoryModification(
          MultisigCosignatoryModificationType.Add,
          cosignatory));
    });
    const multisigCreation = ModifyMultisigAccountTransaction.create(
      Deadline.create(),
      quorum,
      minRemoval,
      modifications,
      this.hdAccount.address.networkType,
    );

    const apostilleAccount = new Initiator(this.hdAccount);
    const readyModification: IReadyTransaction = {
       initiator: apostilleAccount,
       transaction: multisigCreation,
       type: TransactionType.MODIFY_MULTISIG_ACCOUNT,
    };
    this.transactions.push(readyModification);
  }

  /**
   * @description - gets the hdAccount account private key
   * @readonly
   * @type {string}
   * @memberof Apostille
   */
  get privateKey(): string {
    return this.hdAccount.privateKey;
  }
  /**
   * @description - gets the hdAccount account public key
   * @readonly
   * @type {string}
   * @memberof Apostille
   */
  get publicKey(): string {
    return this.hdAccount.publicKey;
  }
  /**
   * @description - gets the hdAccount account address
   * @readonly
   * @type {Address}
   * @memberof Apostille
   */
  get address(): Address {
    return this.hdAccount.address;
  }
  /**
   * @description - gets the account that was used to generate the apostille account (HD account)
   * @readonly
   * @type {PublicAccount}
   * @memberof Apostille
   */
  get generator(): null | PublicAccount {
    if (this.generatorAccount) {
       return this.generatorAccount.publicAccount;
    } else {
      return null;
    }
  }
  /**
   * @description - gets the public account of the generated apostille acount (HD account)
   * @readonly
   * @type {PublicAccount}
   * @memberof Apostille
   */
  get publicHD(): PublicAccount {
    return this.publicAccount;
  }

  /**
   * @description - gets the signer of the creation transaction
   * @readonly
   * @type {(Account | PublicAccount | undefined)}
   * @memberof Apostille
   */
  get creator(): Account | PublicAccount | undefined {
    if (this.creatorAccount) {
      if (this.creatorAccount.multisigAccount) {
        return this.creatorAccount.multisigAccount;
      } else {
        return this.creatorAccount.account;
      }
    }
    return undefined;
  }

}

export { Apostille };
