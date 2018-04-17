import nem from 'nem-sdk';
import { NetworkType } from 'nem2-sdk';
import { Apostille } from '../../src/Apostille';

const tag = 'NEM is Awesome!';
const signer = '73CA8F6F7F39A94E6094A0E423C85D6FA9C924E6C59E6CBFF5D2C969FF63650A';

const myApostille = new Apostille(tag, signer, NetworkType.MIJIN_TEST);
it('private key should be valid', () => {
  expect(nem.utils.helpers.isPrivateKeyValid(myApostille.privateKey)).not.toBeFalsy();
});
