
import * as nemDefault from 'nem-sdk';
import { NetworkType } from 'nem2-sdk';
import { KECCAK256, KECCAK512, MD5, SHA1, SHA256 } from '../../../src/hashFunctions';

const nem = nemDefault.default;

describe('Generate correct hash using MIJIN_TEST network type', () => {
    const signerPrivateKey = 'F1E7660DB9EF5E73203881304F31B7CCDF167A08055013A633D098EBD94FD36F';
    const data = 'I am legen wait for it dary';
    it('generates checksum of signed hash with MD5', () => {
        const md5 = new MD5();
        const checksum = 'fe4e545981';
        expect(md5.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST).substring(0, 10)).toEqual(checksum);
    });

    it('generates signed hash with MD5', () => {
        const md5 = new MD5();
        // tslint:disable-next-line:max-line-length
        const hash = 'fe4e545981FE2D021949C6FE3B2552B7FE197EE67A1A07A8EB66E231EC2AAD9BFED66ED66BF28B2F7E86E86FEB66785AFD9C071E5BAC9EB1B43B9155A2BB1BD5E6C85E0E0E';

        expect(md5.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST)).toEqual(hash);
    });

    it('generates checksum of signed hash with SHA1', () => {
        const sha1 = new SHA1();
        const checksum = 'fe4e545982';
        expect(sha1.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST).substring(0, 10)).toEqual(checksum);
    });

    it('generates signed hash with SHA1', () => {
        const sha1 = new SHA1();
        // tslint:disable-next-line:max-line-length
        const hash = 'fe4e545982F0C8290E45664E78D1825BB24CC067A4273E550303AE8D014FC6491B9719512BF9559353907D49466001DCAAC3C2C45D222315175EDDA82DFC6F5F7802573D04';

        expect(sha1.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST)).toEqual(hash);
    });

    it('generates checksum of signed hash with SHA256', () => {
        const sha256 = new SHA256();
        // tslint:disable-next-line:max-line-length
        const checksum = 'fe4e545983';

        expect(sha256.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST).substring(0, 10)).toEqual(checksum);
    });

    it('generates signed hash with SHA256', () => {
        const sha256 = new SHA256();
        // tslint:disable-next-line:max-line-length
        const hash = 'fe4e545983CEEC521C2F006B00F68C913DB59773E26F6FDFA4FDBC1FDD6A20004E89C66BDCB9DDF430AB7F5F2857BB3A9BADEC52C77584DB119281568EC1AB95ACB815F30F';

        expect(sha256.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST)).toEqual(hash);
    });

    it('generates checksum of signed hash with KECCAK256', () => {
        const keccak256 = new KECCAK256();
        const checksum = 'fe4e545988';
        // tslint:disable-next-line:max-line-length
        expect(keccak256.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST).substring(0, 10)).toEqual(checksum);
    });

    it('generates signed hash with KECCAK256', () => {
        const keccak256 = new KECCAK256();
        // tslint:disable-next-line:max-line-length
        const hash = 'fe4e54598886AB714B482A9DF4F6387DA5AE748DB78E49C27B24B3284F7E4B9BB55A8BD78A981B25EEAC70E5AE3814B75DCED68D4AFB6581BCC8F768DF09192CF88509C90D';

        expect(keccak256.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST)).toEqual(hash);
    });

    it('generates checksum of signed hash with KECCAK512', () => {
        const keccak512 = new KECCAK512();
        const checksum = 'fe4e545989';
        // tslint:disable-next-line:max-line-length
        expect(keccak512.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST).substring(0, 10)).toEqual(checksum);
    });

    it('generates signed hash with KECCAK512', () => {
        const keccak512 = new KECCAK512();
        // tslint:disable-next-line:max-line-length
        const hash = 'fe4e54598933E11AEF0E0D940CC4B7533578D12D86A9654DC3C7241BD8FCDE3AD2552E19AAB4F257874E5D0500FA22013E9035E1ADF821A174148806FEB5853EAF5D80EC0E';

        expect(keccak512.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST)).toEqual(hash);
    });

});

// TEST_NET ======================================
//
//
// ================================================

describe('Generate correct hash using TEST_NET network type', () => {
    const seed = 'NEM is Awesome!';
    const signerPrivateKey = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
    // Create a common object holding key
    const common = nem.model.objects.create('common')('', signerPrivateKey);
    // Simulate the file content
    const payload = nem.crypto.js.enc.Utf8.parse('Private apostille is awesome !');
    it('generates checksum of signed hash with MD5', () => {
        const md5 = new MD5();
        const oldPrivateApostille = nem.model.apostille.create(
            common,
            seed,
            payload,
            'Test Apostille',
            // tslint:disable-next-line:no-string-literal
            nem.model.apostille.hashing['MD5'],
            false, {}, true,
            nem.model.network.data.testnet.id);

        expect(md5.signedHashing(payload, signerPrivateKey, NetworkType.TEST_NET).substring(0, 10))
        .toEqual(oldPrivateApostille.data.checksum);
    });

    it('generates signed hash with MD5', () => {
        const md5 = new MD5();
        const oldPrivateApostille = nem.model.apostille.create(
            common,
            seed,
            payload,
            'Test Apostille',
            // tslint:disable-next-line:no-string-literal
            nem.model.apostille.hashing['MD5'],
            false, {}, true,
            nem.model.network.data.testnet.id);

        expect(md5.signedHashing(payload, signerPrivateKey, NetworkType.TEST_NET))
        .toEqual(oldPrivateApostille.data.hash);
    });

    it('generates checksum of signed hahs with SHA1', () => {
        const sha1 = new SHA1();
        const oldPrivateApostille = nem.model.apostille.create(
            common,
            seed,
            payload,
            'Test Apostille',
            // tslint:disable-next-line:no-string-literal
            nem.model.apostille.hashing['SHA1'],
            false, {}, true,
            nem.model.network.data.testnet.id);
        expect(sha1.signedHashing(payload, signerPrivateKey, NetworkType.TEST_NET).substring(0, 10))
        .toEqual(oldPrivateApostille.data.checksum);
    });

    it('generates signed hahs with SHA1', () => {
        const sha1 = new SHA1();
        const oldPrivateApostille = nem.model.apostille.create(
            common,
            seed,
            payload,
            'Test Apostille',
            // tslint:disable-next-line:no-string-literal
            nem.model.apostille.hashing['SHA1'],
            false, {}, true,
            nem.model.network.data.testnet.id);
        expect(sha1.signedHashing(payload, signerPrivateKey, NetworkType.TEST_NET))
        .toEqual(oldPrivateApostille.data.hash);
    });

    it('generates checksum of signed hash with SHA256', () => {
        const sha256 = new SHA256();
        const oldPrivateApostille = nem.model.apostille.create(
            common,
            seed,
            payload,
            'Test Apostille',
            // tslint:disable-next-line:no-string-literal
            nem.model.apostille.hashing['SHA256'],
            false, {}, true,
            nem.model.network.data.testnet.id);
        expect(sha256.signedHashing(payload, signerPrivateKey, NetworkType.TEST_NET).substring(0, 10))
        .toEqual(oldPrivateApostille.data.checksum);
    });

    it('generates signed hash with SHA256', () => {
        const sha256 = new SHA256();
        const oldPrivateApostille = nem.model.apostille.create(
            common,
            seed,
            payload,
            'Test Apostille',
            // tslint:disable-next-line:no-string-literal
            nem.model.apostille.hashing['SHA256'],
            false, {}, true,
            nem.model.network.data.testnet.id);
        expect(sha256.signedHashing(payload, signerPrivateKey, NetworkType.TEST_NET))
        .toEqual(oldPrivateApostille.data.hash);
    });

    it('generates checksum of signed hash with KECCAK256', () => {
        const keccak256 = new KECCAK256();
        const oldPrivateApostille = nem.model.apostille.create(
            common,
            seed,
            payload,
            'Test Apostille',
            // tslint:disable-next-line:no-string-literal
            nem.model.apostille.hashing['SHA3-256'],
            false, {}, true,
            nem.model.network.data.testnet.id);
        expect(keccak256.signedHashing(payload, signerPrivateKey, NetworkType.TEST_NET).substring(0, 10))
        .toEqual(oldPrivateApostille.data.checksum);
    });

    it('generates signed hash with KECCAK256', () => {
        const keccak256 = new KECCAK256();
        const oldPrivateApostille = nem.model.apostille.create(
            common,
            seed,
            payload,
            'Test Apostille',
            // tslint:disable-next-line:no-string-literal
            nem.model.apostille.hashing['SHA3-256'],
            false, {}, true,
            nem.model.network.data.testnet.id);
        expect(keccak256.signedHashing(payload, signerPrivateKey, NetworkType.TEST_NET))
        .toEqual(oldPrivateApostille.data.hash);
    });

    it('generates checksum of signed hash with KECCAK512', () => {
        const keccak512 = new KECCAK512();
        const oldPrivateApostille = nem.model.apostille.create(
            common,
            seed,
            payload,
            'Test Apostille',
            // tslint:disable-next-line:no-string-literal
            nem.model.apostille.hashing['SHA3-512'],
            false, {}, true,
            nem.model.network.data.testnet.id);
        expect(keccak512.signedHashing(payload, signerPrivateKey, NetworkType.TEST_NET).substring(0, 10))
        .toEqual(oldPrivateApostille.data.checksum);
    });

    it('generates signed hash with KECCAK512', () => {
        const keccak512 = new KECCAK512();
        const oldPrivateApostille = nem.model.apostille.create(
            common,
            seed,
            payload,
            'Test Apostille',
            // tslint:disable-next-line:no-string-literal
            nem.model.apostille.hashing['SHA3-512'],
            false, {}, true,
            nem.model.network.data.testnet.id);
        expect(keccak512.signedHashing(payload, signerPrivateKey, NetworkType.TEST_NET))
        .toEqual(oldPrivateApostille.data.hash);
    });
});
