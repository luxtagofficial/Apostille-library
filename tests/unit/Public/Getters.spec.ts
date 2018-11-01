import { Account, NetworkType, Address } from 'nem2-sdk';
import { Initiator, PublicApostille } from '../../../index';

const fileName = 'FileName.pdf';
// A funny but valid private key
const pk = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
const signer = Account.createFromPrivateKey(pk, NetworkType.MIJIN_TEST);

const initiator = new Initiator(signer);
const sinkAddress = Address.createFromRawAddress('SCKPEZ-5ZAPYO-PXVF6U-YLHINF-CLYZHO-YCIO3P-KGVV');
const publicApostille = new PublicApostille(
  initiator,
  fileName,
  sinkAddress);

describe('getters should work properly', () => {
  it('should return correct sink address', () => {
    expect(publicApostille.sinkAddress.plain()).toMatch(sinkAddress.plain());
  });
});
