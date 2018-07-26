import * as nemSDK from 'nem-sdk';
import { Account, Address, Deadline, ModifyMultisigAccountTransaction, MultisigCosignatoryModification, MultisigCosignatoryModificationType, NetworkType, PublicAccount, TransactionType } from 'nem2-sdk';
import { ApostilleAccount, Initiator } from '../index';
import { IReadyTransaction } from './IReadyTransaction';
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
    const apostille = Account.createFromPrivateKey(privateKey, networkType);
    return new Apostille(apostille, generatorAccount);
  }

  /**
   * @description - the apostille account
   * @private
   * @type {Account}
   * @memberof Apostille
   */
  private Apostille: Account = new Account();
  /**
   * @description - whether the apostille was created or not
   * @private
   * @type {boolean}
   * @memberof Apostille
   */
  private creatorAccount;

  /**
   * Creates an instance of Apostille.
   * @param {string} seed - the seed used to generate an initial hash
   * @param {Account} generatorAccount - the account used to sign the hash to generate an HD account private key
   * @memberof Apostille
   */
  private constructor(
    public readonly apostille: Account,
    private readonly generatorAccount: Account,
  ) {
    super(apostille.publicAccount);
  }

  /**
   * @description - create a multisig contract to own the apostille account
   * @param {PublicAccount[]} owners - array of public account that will become owners
   * @param {number} quorum - the minimum number of owners necessary to agree on the apostille account activities
   * @param {number} minRemoval - minimum number of owners necessary to agree to remove one or some owners
   * @memberof Apostille
   */
  public own(owners: PublicAccount[], quorum: number, minRemoval: number): void {
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
      this.apostille.address.networkType,
    );

    const apostilleAccount = new Initiator(this.Apostille);
    const readyModification: IReadyTransaction = {
       initiator: apostilleAccount,
       transaction: multisigCreation,
       type: TransactionType.MODIFY_MULTISIG_ACCOUNT,
    };
    this.pushToTransactions(readyModification);
  }

  /**
   * @description - gets the apostille account private key
   * @readonly
   * @type {string}
   * @memberof Apostille
   */
  get privateKey(): string {
    return this.Apostille.privateKey;
  }
  /**
   * @description - gets the apsotille account public key
   * @readonly
   * @type {string}
   * @memberof Apostille
   */
  get publicKey(): string {
    return this.Apostille.publicKey;
  }
  /**
   * @description - gets the apsotille account address
   * @readonly
   * @type {Address}
   * @memberof Apostille
   */
  get address(): Address {
    return this.Apostille.address;
  }
  /**
   * @description - gets the account that was used to generate the apostille account (HD account)
   * @readonly
   * @type {PublicAccount}
   * @memberof Apostille
   */
  get generator(): PublicAccount {
    return this.generatorAccount.publicAccount;
  }
  /**
   * @description - gets the public account of the generated apostille acount (HD account)
   * @readonly
   * @type {PublicAccount}
   * @memberof Apostille
   */
  get hdAccount(): PublicAccount {
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
