import * as nemSDK from 'nem-sdk';
import { Account, NetworkType, PublicAccount } from 'nem2-sdk';
import { SHA256 } from '../../hash/sha256';
import { IReadyTransaction } from '../../infrastructure/ApostilleHttp';
import { Initiator } from '../../infrastructure/Initiator';
import { ApostillePublicAccount } from './ApostillePublicAccount';

const nem = nemSDK.default;

const fixPrivateKey = (privateKey) => {
  return ('0000000000000000000000000000000000000000000000000000000000000000' + privateKey.replace(/^00/, ''))
    .slice(-64);
};

/**
 * @description the private apostille class
 * @class Apostille
 */
export class Apostille extends ApostillePublicAccount {

  /**
   * @description init apostille
   * @static
   * @param {string} seed
   * @param {Account} generatorAccount
   * @returns {Apostille}
   * @memberof Apostille
   */
  public static initFromSeed(
    seed: string,
    generatorAccount: Account): Apostille {
    const networkType = generatorAccount.address.networkType;
    // hash the seed for the apostille account
    const hashSeed = SHA256.hash(seed);
    let privateKey: string;
    // sign the hashed seed to get the private key
    if (networkType === NetworkType.MAIN_NET || networkType === NetworkType.TEST_NET) {
      const keyPair = nem.crypto.keyPair.create(generatorAccount.privateKey);
      privateKey = fixPrivateKey(keyPair.sign(hashSeed).toString());
    } else {
      privateKey = fixPrivateKey(generatorAccount.signData(hashSeed));
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
  public constructor(
    public readonly HDAccount: Account,
  ) {
    super(HDAccount.publicAccount);
  }

  /**
   *
   * @description - create a multisig contract to own the apostille account
   * @param {PublicAccount[]} owners- array of public account that will become owners
   * @param {number} quorumDelta - the minimum number of owners necessary to agree on the apostille account activities
   * @param {number} minRemovalDelta - minimum number of owners necessary to agree to remove one or some owners
   * @returns {IReadyTransaction}
   * @memberof Apostille
   */
  public associate(owners: PublicAccount[], quorumDelta: number, minRemovalDelta: number): IReadyTransaction {
    return {
      initiator: this.initiator,
      transaction: this.transfer(owners, [], quorumDelta, minRemovalDelta),
    };
  }

  private get initiator(): Initiator {
    return new Initiator(this.HDAccount);
  }

}
