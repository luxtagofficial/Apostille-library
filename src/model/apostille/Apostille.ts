import * as nemSDK from 'nem-sdk';
import { Account, Deadline, ModifyMultisigAccountTransaction, MultisigCosignatoryModification, MultisigCosignatoryModificationType, NetworkType, PublicAccount, SignedTransaction } from 'nem2-sdk';
import { SHA256 } from '../../hash/sha256';
import { ApostillePublicAccount } from './ApostillePublicAccount';

const nem = nemSDK.default;
// TODO: add tx hash of creation
// TODO: a getter function for getting all the owners of the apostille
/**
 * @description the private apostille class
 * @class Apostille
 */
class Apostille {

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
    return new Apostille(hdAccount);
  }

  /**
   * Creates an instance of Apostille.
   * @param {Account} hdAccount - the apostille account (HD account)
   * @param {Account} generatorAccount - the account used to sign the hash to generate the HD account private key
   * @memberof Apostille
   */
  private constructor(
    public readonly HDAccount: Account,
  ) {}

  /**
   * @description - create a multisig contract to own the apostille account
   * @param {PublicAccount[]} owners - array of public account that will become owners
   * @param {number} quorum - the minimum number of owners necessary to agree on the apostille account activities
   * @param {number} minRemoval - minimum number of owners necessary to agree to remove one or some owners
   * @memberof Apostille
   */
  public associate(owners: PublicAccount[], quorum: number, minRemoval: number): SignedTransaction {
    const modifications: MultisigCosignatoryModification[] = [];
    owners.forEach((cosignatory) => {
      modifications.push(
        new MultisigCosignatoryModification(
          MultisigCosignatoryModificationType.Add,
          cosignatory));
    });
    const convertIntoMultisigTransaction = ModifyMultisigAccountTransaction.create(
      Deadline.create(),
      quorum,
      minRemoval,
      modifications,
      this.HDAccount.address.networkType,
    );

    const signedTransaction = this.HDAccount.sign(convertIntoMultisigTransaction);

    return  signedTransaction;
  }

  get apostillePublicAccount(): ApostillePublicAccount {
    return new ApostillePublicAccount(this.HDAccount.publicAccount);
  }

}

export { Apostille };