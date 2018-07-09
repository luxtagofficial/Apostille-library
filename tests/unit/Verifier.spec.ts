import { NetworkType, PublicAccount } from 'nem2-sdk';
import { Verifier } from '../../index';

describe.skip('verifier should work properly', () => {
  describe('verify signature of public apostille', () => {
    it('Can verify signature of public apostille', () => {
        const fileContent = 'I am so so so awesome as always';
        const payload = 'fe4e545903cd39cec9bf017c5fc0f586be0a8a91dad3953295868ce47738f804446c25ce7c';
        const publicKey = '22816F825B4CACEA334723D51297D8582332D8B875A5829908AAE85831ABB508';
        const signer = PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST);
        expect(Verifier.verifyApostille(fileContent, payload, signer)).toEqual(true);
    });

    it('Return false if wrong file content provided', () => {
        const fileContent = 'I am not awesome as always';
        const payload = 'fe4e545903cd39cec9bf017c5fc0f586be0a8a91dad3953295868ce47738f804446c25ce7c';
        const publicKey = '22816F825B4CACEA334723D51297D8582332D8B875A5829908AAE85831ABB508';
        const signer = PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST);
        expect(Verifier.verifyApostille(fileContent, payload, signer)).toEqual(false);
    });

    it('Return false if wrong payload provided', () => {
        const fileContent = 'I am not awesome as always';
        const payload = 'fe4e545903cd39cec9bf017c5fc0f586be0a8a91dad3953295868ce47738f804446c211111';
        const publicKey = '22816F825B4CACEA334723D51297D8582332D8B875A5829908AAE85831ABB508';
        const signer = PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST);

        expect(Verifier.verifyApostille(fileContent, payload, signer)).toEqual(false);
    });

  });

  describe('verify signature of private hash apostille', () => {

    it('Can verify signature of private hash apostille', () => {
        const fileContent = 'I am so so so awesome as always';
        const payload = 'fe4e545983cf6c0ae5d753cce50b36dfa978a830daf9f7faf42d6f3b33850485d7b9cf54b1f95fb0763c011312e3ec2d43741043e52f4a34ecdd8453cb161c695f2f8edc06';
        const publicKey = '22816F825B4CACEA334723D51297D8582332D8B875A5829908AAE85831ABB508';
        const signer = PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST);

        expect(Verifier.verifyApostille(fileContent, payload, signer)).toEqual(true);
    });
  });
});
