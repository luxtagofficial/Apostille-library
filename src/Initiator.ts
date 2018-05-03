import { Account, PublicAccount, NetworkType } from 'nem2-sdk';

class Initiator {
  constructor(
    public readonly account: Account | string,
    public readonly network: NetworkType,
    public readonly multisigAccount?: PublicAccount,
    private isComplete?: boolean,
    public readonly cosignatories?: Account[],
  ) {
    if (multisigAccount) {
      if (isComplete === undefined) {
        throw new Error('Missing argument "isCompleet"');
      }
    }

    if (typeof account === 'string') {
      this.account = Account.createFromPrivateKey(account, network);
    }
  }

  get complete(): boolean {
    // TODO: there should be a function to check if all cosignatories are present
    if (this.isComplete) {
      return true;
    }
    return false;
  }

}

export { Initiator };
