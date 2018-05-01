import * as nemSDK from 'nem-sdk';
import { } from 'nem2-sdk';
import { Apostille } from './Apostille';
import { PublicApostille } from './PublicApostille';
import { SHA256 } from './hashFunctions';

const nem = nemSDK.default;

class Verifier {
  public static VerifiPubluc(fileContent: string, apostille: PublicApostille): boolean;
  public static VerifiPubluc(fileContent: string, txID: string): boolean;

}

export { Verifier };
