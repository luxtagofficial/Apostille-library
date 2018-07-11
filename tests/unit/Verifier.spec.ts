import { Account, NetworkType, PublicAccount } from 'nem2-sdk';
import { Verifier } from '../../index';

describe('verifier should work properly', () => {
  describe('verify signature of public apostille', () => {
    it('Can verify signature of public apostille', () => {
        const publicKey = '22816F825B4CACEA334723D51297D8582332D8B875A5829908AAE85831ABB508';
        const signer = PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST);
        const data = 'I am so so so awesome as always';
        const payload = 'fe4e545903cd39cec9bf017c5fc0f586be0a8a91dad3953295868ce47738f804446c25ce7c';

        expect(Verifier.verifyApostille(signer, data, payload)).toEqual(true);
    });

    it('Return false if wrong data provided', () => {
        const publicKey = '22816F825B4CACEA334723D51297D8582332D8B875A5829908AAE85831ABB508';
        const signer = PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST);
        const data = 'I am not awesome as always';
        const payload = 'fe4e545903cd39cec9bf017c5fc0f586be0a8a91dad3953295868ce47738f804446c25ce7c';

        expect(Verifier.verifyApostille(signer, data, payload)).toEqual(false);
    });

    it('Return false if wrong payload provided', () => {
        const data = 'I am so so so awesome as always';
        const payload = 'fe4e545903cd39cec9bf017c5fc0f586be0a8a91dad3953295868ce47738f804446c211111';
        const publicKey = '22816F825B4CACEA334723D51297D8582332D8B875A5829908AAE85831ABB508';
        const signer = PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST);

        expect(Verifier.verifyApostille(signer, data, payload)).toEqual(false);
    });

  });

  describe('verify signature of private hash apostille', () => {
    const privateKey = 'AB73CCA88C527143CB14C253369364DF95EE8CF83061396F4E724FFC8EF9A779';
    const signerAccount = Account.createFromPrivateKey(privateKey, NetworkType.MIJIN_TEST);

    it('Can verify signature of private hash apostille made from MD5', () => {
        const data = 'I am so so so awesome as always';
        const payload = 'fe4e545981B205883C56628DC6D2CC36AA08DF4B4447D2219C90075F7BBF334144BEE2ECC9B0814D65255E5B8E603BF12C6F779A59EFAF439E9F20A5ABB46D05A92E7CB507';

        expect(Verifier.verifyApostille(signerAccount.publicAccount, data, payload)).toEqual(true);
    });

    it('Can verify signature of private hash apostille made from SHA1', () => {
        const data = 'I am so so so awesome as always';
        const payload = 'fe4e5459825BF8E45436CD46A64B8274FFAF45C5CABF7303CD254444142CF11506B70CFEAFC3BC9A43DA6761ACCEF6FA77B19F4605600BCB0B69F7D190B208D7841D4B1302';

        expect(Verifier.verifyApostille(signerAccount.publicAccount, data, payload)).toEqual(true);
    });

    it('Can verify signature of private hash apostille made from SHA256', () => {
        const data = 'I am so so so awesome as always';
        const payload = 'fe4e545983008A0AFE137F54DE9393F81E8C82B6974F41D7EEA4EFB6CCF2D3FBB6028F1108BE1F508BE555114549CA9055EED65DB150523A878CBF5354FAC46622CB7F0E0F';

        expect(Verifier.verifyApostille(signerAccount.publicAccount, data, payload)).toEqual(true);
    });

    it('Can verify signature of private hash apostille made from KECCAK256', () => {
        const data = 'I am so so so awesome as always';
        const payload = 'fe4e54598873CAA25DCCAAD8A4F70BC9B0EA1178852B8A6E64B0BB570EB5087850ED4256B9C416390F07421E6D15F76A99F0A134223BDD54F6556E5DAD3A72434EC2F79A05';

        expect(Verifier.verifyApostille(signerAccount.publicAccount, data, payload)).toEqual(true);
    });

    it('Can verify signature of private hash apostille made from KECCAK512', () => {
        const data = 'I am so so so awesome as always';
        const payload = 'fe4e5459891B662C91D6AE6C698CB60A2B1CBFF091EEAD30C5A513C54D0E91EFEB3F08E55341A2E869754063DD5445D4099494DAB9835DFB966DDD1A7F776C3A100F22E301';

        expect(Verifier.verifyApostille(signerAccount.publicAccount, data, payload)).toEqual(true);
    });

    it('Return false if wrong data provided', () => {
        const data = 'I am not awesome as always';
        const payload = 'fe4e545983008A0AFE137F54DE9393F81E8C82B6974F41D7EEA4EFB6CCF2D3FBB6028F1108BE1F508BE555114549CA9055EED65DB150523A878CBF5354FAC46622CB7F0E0F';

        expect(Verifier.verifyApostille(signerAccount.publicAccount, data, payload)).toEqual(false);
    });

    it('Return false if wrong payload provided', () => {
        const data = 'I am so so so awesome as always';
        const payload = 'fe4e545983008A0AFE137F54DE9393F81E8C82B6974F41D7EEA4EFB6CCF2D3FBB6028F1108BE1F508BE555114549CA9055EED65DB150523A878CBF5354FAC46622CB7F0E0E';

        expect(Verifier.verifyApostille(signerAccount.publicAccount, data, payload)).toEqual(false);
    });
  });
});
