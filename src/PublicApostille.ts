import { NetworkType, Address } from 'nem2-sdk';
import { Sinks } from './Sinks';
import { HashFunction } from './hashFunctions/HashFunction';

class PublicApostille {
  private sinkAddress: Address;
  private  hash;
  constructor(public readonly networkType: NetworkType, sinkAddress?: string) {
    if (sinkAddress) {
      const newSink = Address.createFromRawAddress(sinkAddress);
      if (newSink.networkType !== networkType) {
        throw new Error('the address is of a wrong network type');
      }
      this.sinkAddress = newSink
    } else {
      this.sinkAddress = Address.createFromRawAddress(Sinks[networkType]);
    }
  }

  public create(fileContent: string, hashFunction: HashFunction) {
    this.hash = hashFunction.nonSignedHashing(fileContent);
  }

  public announce() {}

  get sinkAddrress(): string {
    return this.sinkAddress.pretty();
  }

  get networktype(): NetworkType {
    return this.networkType;
  }

  get apostilleHash(): string {
    return this.hash;
  }
}

export { PublicApostille };