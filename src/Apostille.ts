import * as nemSDK from 'nem-sdk';
import { Account, Address, Deadline, ModifyMultisigAccountTransaction, Mosaic, MultisigCosignatoryModification, MultisigCosignatoryModificationType, NetworkType, PublicAccount, TransactionType } from 'nem2-sdk';
import { ApostilleAccount, Initiator, TransactionsStreams } from '../index';
import { IReadyTransaction } from './IReadyTransaction';
import { SHA256 } from './hashFunctions';
import { HashFunction } from './hashFunctions/HashFunction';

const nem = nemSDK.default;
// TODO: add tx hash of creation
// TODO: a getter function for getting all the owners of the apostille
/**
 * @description the private apostille class
 * @class Apostille
 */
class Apostille {
  /**
   * @description the network type of the HD apostille account
   * @type {NetworkType}
   * @memberof Apostille
   */
  public readonly networkType: NetworkType;

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
   * @description - the apostille public account
   * @private
   * @type {ApostilleAccount}
   * @memberof Apostille
   */
  private apostilleAccount;

  /**
   * Creates an instance of Apostille.
   * @param {string} seed - the seed used to generate an initial hash
   * @param {Account} generatorAccount - the account used to sign the hash to generate an HD account private key
   * @memberof Apostille
   */
  constructor(
    public readonly seed: string,
    private generatorAccount: Account,
  ) {
    this.networkType = generatorAccount.address.networkType;
    // hash the seed for the apostille account
    const hashSeed = SHA256.hash(this.seed);
    let privateKey: string;
    // signe the hashed seed to get the private key
    if (this.networkType === NetworkType.MAIN_NET || this.networkType === NetworkType.TEST_NET) {
      const keyPair = nem.crypto.keyPair.create(generatorAccount.privateKey);
      privateKey = nem.utils.helpers.fixPrivateKey(keyPair.sign(hashSeed).toString());
    } else {
      privateKey = nem.utils.helpers.fixPrivateKey(generatorAccount.signData(hashSeed));
    }
    // create the HD acccount (appostille)
    this.Apostille = Account.createFromPrivateKey(privateKey, this.networkType);
    this.apostilleAccount = new ApostilleAccount(this.Apostille.publicAccount);
  }

  /**
   * @description - create a creation transaction for the apostille account
   * @param {Initiator} initiatorAccount - the initiator of the transaction
   * @param {string} rawData - the raw data to send in the payload
   * @param {(Mosaic[] | Mosaic[])} [mosaics=[]] - array of mosiacs to attache
   * @param {HashFunction} [hashFunction] - if provided will hash the raw data and add a magical byte to the hash
   * @returns {Promise<void>}
   * @memberof Apostille
   */
  public async create(
    initiatorAccount: Initiator,
    rawData: string,
    mosaics: Mosaic[] | Mosaic[] = [],
    hashFunction?: HashFunction,
  ): Promise<void> {
    this.creatorAccount = initiatorAccount;
    await this.hdAccount.create(
      initiatorAccount,
      rawData,
      mosaics,
      hashFunction,
    );
  }

  /**
   * @description - creates an update transaction
   * @param {Initiator} initiatorAccountthe - initiator of the transaction
   * @param {string} message - message to add as a payload
   * @param {(Mosaic[] | Mosaic[])} [mosaics=[]] - array of mosiacs to attache
   * @returns {Promise<void>}
   * @memberof Apostille
   */
  public async update(
    initiatorAccount: Initiator,
    message: string,
    mosaics: Mosaic[] | Mosaic[] = [],
  ): Promise<void> {
    await this.hdAccount.update(
      initiatorAccount,
      message,
      mosaics,
    );
  }

  /**
   * @description - announce all transactions to the network
   * @param {string} [urls] - endpoint url
   * @returns {Promise<void>}
   * @memberof Apostille
   */
  public async announce(urls?: string): Promise<void> {
    await this.hdAccount.announce();
  }

  /**
   * @description - checks on chain if the apostille was created
   * @returns {Promise<boolean>}
   * @memberof Apostille
   */
  public isCreated(): Promise<boolean> {
    return this.hdAccount.isCreated();
  }

  /**
   * @description - cheks on chain if there are any transactions announced
   * @param {string} [urls] - enpoint url
   * @returns {Promise<boolean>}
   * @memberof Apostille
   */
  public isAnnounced(urls?: string): Promise<boolean> {
    return this.hdAccount.isAnnounced(urls);
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
      this.networkType,
    );

    const apostilleAccount = new Initiator(this.Apostille);
    const readyModification: IReadyTransaction = {
       initiator: apostilleAccount,
       transaction: multisigCreation,
       type: TransactionType.MODIFY_MULTISIG_ACCOUNT,
    };
    this.hdAccount.pushToTransactions(readyModification);
  }
  /**
   * @description - modify ownership of the apostille account by modifying the multisisg contratc
   * @param {Account[]} signers - array of accounts that will sign the transaction
   * @param {boolean} complete - whether the transaction is an aggregate compleet or bounded
   * @param {PublicAccount[]} newOwners - array of new owners
   * @param {PublicAccount[]} OwnersToRemove - array of owners to remove
   * @param {number} quorumDelta - relative quorum (refer to own function above and/or http://bit.ly/2Jnff1r )
   * @param {number} minRemovalDelta - relative number of minimum owners necessary to agree to remove one or some owners
   * @memberof Apostille
   */
  public transfer(signers: Account[],
                  complete: boolean,
                  newOwners: PublicAccount[],
                  ownersToRemove: PublicAccount[],
                  quorumDelta: number,
                  minRemovalDelta: number,
  ): void {
    this.hdAccount.transfer(
      signers,
      complete,
      newOwners,
      ownersToRemove,
      quorumDelta,
      minRemovalDelta,
    );
  }
  /**
   * @description - sets whether the apostille was created
   * @memberof Apostille
   */
  set created(value: boolean) {
    this.hdAccount.created = value;
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
   * @type {ApostilleAccount}
   * @memberof Apostille
   */
  get hdAccount(): ApostilleAccount {
    return this.apostilleAccount;
  }
  /**
   * @description - gets the hash included in the payload of the creation transaction
   * @readonly
   * @type {(string | undefined)}
   * @memberof Apostille
   */
  get creationHash(): string | undefined {
    return this.hdAccount.creationHash;
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

  /**
   * @description - a function to monitor error and transactions from and to the apostille account
   * @param {string} [urls]
   * @returns {TransactionsStreams}
   * @memberof Apostille
   */
  public monitor(urls?: string): TransactionsStreams {
    return this.hdAccount.monitor(urls);
  }

}

export { Apostille };
