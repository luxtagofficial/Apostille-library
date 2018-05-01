import {
  NetworkType,
  Address,
  TransferTransaction,
  Deadline,
  PlainMessage,
  XEM,
  TransactionHttp,
  Account } from 'nem2-sdk';
import { Sinks } from './Sinks';
import { HashFunction } from './hashFunctions/HashFunction';

class PublicApostille {
  private address: Address;
  private  hash;
  private announced: boolean = false;
  private creationTransaction: TransferTransaction;
  constructor(
    private signerPrivateKey: string,
    public readonly networkType: NetworkType,
    sinkAddress?: string,
  ) {
    if (sinkAddress) {
      const newSink = Address.createFromRawAddress(sinkAddress);
      if (newSink.networkType !== networkType) {
        throw new Error('the address is of a wrong network type');
      }
      this.address = newSink;
    } else {
      this.address = Address.createFromRawAddress(Sinks[networkType]);
    }
  }

  public create(fileContent: string, hashFunction: HashFunction) {
    this.hash = hashFunction.nonSignedHashing(fileContent);
    this.creationTransaction = TransferTransaction.create(
      Deadline.create(),
      this.address,
      [XEM.createRelative(0)],
      PlainMessage.create(this.hash),
      this.networkType,
    );
    this.announced = false;
  }

  public announce(urls?: string) {
    if (this.announced) {
      throw new Error('This File has already been anounced to the network');
    }
    let transactionHttp;
    if (urls) {
      if (this.networkType === NetworkType.MAIN_NET || this.networkType === NetworkType.TEST_NET) {
        console.warn('To fetch a far far away transaction a historical node is needed');
      }
      transactionHttp = new TransactionHttp(urls);
    } else {
      if (this.networkType === NetworkType.MAIN_NET) {
        transactionHttp = new TransactionHttp('http://88.99.192.82:7890');
      } else if (this.networkType === NetworkType.TEST_NET) {
        transactionHttp = new TransactionHttp('http://104.128.226.60:7890');
      } else if (this.networkType === NetworkType.MIJIN) {
        throw new Error('Missing Endpoint argument!');
      } else {
        transactionHttp = new TransactionHttp('http://api.beta.catapult.mijin.io:3000');
      }
    }
    const owner = Account.createFromPrivateKey(this.signerPrivateKey, this.networkType);
    const signedTransaction = owner.sign(this.creationTransaction);
    transactionHttp.announce(signedTransaction).subscribe(
      (res) => {
        console.log(res);
        this.announced = true;
      },
      (err) => { console.error(err); },
    );
  }

  get sinkAddress(): string {
    return this.address.pretty();
  }

  get networktype(): NetworkType {
    return this.networkType;
  }

  get apostilleHash(): string {
    return this.hash;
  }
}

export { PublicApostille };
