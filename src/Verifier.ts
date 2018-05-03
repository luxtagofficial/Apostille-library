import * as nemSDK from 'nem-sdk';
import { } from 'nem2-sdk';
import { Apostille } from './Apostille';
import { PublicApostille } from './PublicApostille';
import { SHA256 } from './hashFunctions';

const nem = nemSDK.default;

class Verifier {
  public static VerifiPublic(fileContent: string, track: PublicApostille | string): boolean {
    return true;
  }
}

export { Verifier };
