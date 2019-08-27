import { Address, Deadline, ModifyMultisigAccountTransaction, MultisigCosignatoryModification, MultisigCosignatoryModificationType, NetworkType, PlainMessage, PublicAccount, TransferTransaction } from 'nem2-sdk';

export class ApostillePublicAccount {
  /**
   * Create instance of ApostillePublicAccount from public key
   *
   * @static
   * @param {string} publicKey
   * @param {NetworkType} networkType
   * @returns {ApostillePublicAccount}
   * @memberof ApostillePublicAccount
   */
  public static createFromPublicKey(publicKey: string, networkType: NetworkType): ApostillePublicAccount {
    const publicAccount = PublicAccount.createFromPublicKey(publicKey, networkType);
    return new ApostillePublicAccount(publicAccount);
  }

  /**
   * @param {PublicAccount} publicAccount
   * @memberof ApostillePublicAccount
   */
  constructor(public readonly publicAccount: PublicAccount) {
  }

  /**
   * @description - returning a transfer transaction for the apostille account
   * @param {string} rawData - the raw data to send in the payload
   * @returns {TransferTransaction}
   * @memberof ApostillePublicAccount
   */
  public update(rawData: string, destAddress?: Address): TransferTransaction {
    const plainMessage = PlainMessage.create(rawData);

    const creationTransaction = TransferTransaction.create(
      Deadline.create(),
      destAddress || this.publicAccount.address,
      [],
      plainMessage,
      this.publicAccount.address.networkType,
    );

    return creationTransaction;
  }

  /**
   * @description - modify ownership of the apostille account by modifying the multisig contract
   * @param {PublicAccount[]} newOwners - array of owners to add
   * @param {PublicAccount[]} OwnersToRemove - array of owners to remove
   * @param {number} quorumDelta - relative quorum (refer to http://bit.ly/2Jnff1r)
   * @param {number} minRemovalDelta - relative number of minimum owners necessary to agree to remove 1/n owners
   * @returns {ModifyMultisigAccountTransaction}
   * @memberof ApostilleAccount
   */
  public transfer(
    newOwners: PublicAccount[],
    ownersToRemove: PublicAccount[],
    quorumDelta: number,
    minRemovalDelta: number,
  ): ModifyMultisigAccountTransaction {
    const addOwners = newOwners.map((cosignatory) => {
      return new MultisigCosignatoryModification(MultisigCosignatoryModificationType.Add, cosignatory);
    });
    const removeOwners = ownersToRemove.map((cosignatory) => {
      return new MultisigCosignatoryModification(MultisigCosignatoryModificationType.Remove, cosignatory);
    });

    return ModifyMultisigAccountTransaction.create(
      Deadline.create(),
      quorumDelta,
      minRemovalDelta,
      [...addOwners, ...removeOwners],
      this.publicAccount.address.networkType,
    );
  }

  get publicKey(): string {
    return this.publicAccount.publicKey;
  }

  get address(): Address {
    return this.publicAccount.address;
  }

}
