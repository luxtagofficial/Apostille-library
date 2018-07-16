
import { NetworkType } from 'nem2-sdk';
import { KECCAK256, KECCAK512, MD5, SHA1, SHA256 } from '../../index';

describe('Generate correct hash', () => {
    it('generates signed checksum with MD5 using MIJIN_TEST network type', () => {
        const md5 = new MD5();
        const signerPrivateKey = 'F1E7660DB9EF5E73203881304F31B7CCDF167A08055013A633D098EBD94FD36F';
        const data = 'I am legen wait for it dary';
        // tslint:disable-next-line:max-line-length
        const result = 'fe4e545981FE2D021949C6FE3B2552B7FE197EE67A1A07A8EB66E231EC2AAD9BFED66ED66BF28B2F7E86E86FEB66785AFD9C071E5BAC9EB1B43B9155A2BB1BD5E6C85E0E0E';

        expect(md5.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST)).toEqual(result);
    });

    it('generates signed checksum with SHA1 using MIJIN_TEST network type', () => {
        const sha1 = new SHA1();
        const signerPrivateKey = 'F1E7660DB9EF5E73203881304F31B7CCDF167A08055013A633D098EBD94FD36F';
        const data = 'I am legen wait for it dary';
        // tslint:disable-next-line:max-line-length
        const result = 'fe4e545982F0C8290E45664E78D1825BB24CC067A4273E550303AE8D014FC6491B9719512BF9559353907D49466001DCAAC3C2C45D222315175EDDA82DFC6F5F7802573D04';

        expect(sha1.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST)).toEqual(result);
    });

    it('generates signed checksum with SHA256 using MIJIN_TEST network type', () => {
        const sha256 = new SHA256();
        const signerPrivateKey = 'F1E7660DB9EF5E73203881304F31B7CCDF167A08055013A633D098EBD94FD36F';
        const data = 'I am legen wait for it dary';
        // tslint:disable-next-line:max-line-length
        const result = 'fe4e545983CEEC521C2F006B00F68C913DB59773E26F6FDFA4FDBC1FDD6A20004E89C66BDCB9DDF430AB7F5F2857BB3A9BADEC52C77584DB119281568EC1AB95ACB815F30F';

        expect(sha256.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST)).toEqual(result);
    });

    it('generates signed checksum with KECCAK256 using MIJIN_TEST network type', () => {
        const keccak256 = new KECCAK256();
        const signerPrivateKey = 'F1E7660DB9EF5E73203881304F31B7CCDF167A08055013A633D098EBD94FD36F';
        const data = 'I am legen wait for it dary';
        // tslint:disable-next-line:max-line-length
        const result = 'fe4e54598886AB714B482A9DF4F6387DA5AE748DB78E49C27B24B3284F7E4B9BB55A8BD78A981B25EEAC70E5AE3814B75DCED68D4AFB6581BCC8F768DF09192CF88509C90D';

        expect(keccak256.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST)).toEqual(result);
    });

    it('generates signed checksum with KECCAK512 using MIJIN_TEST network type', () => {
        const keccak512 = new KECCAK512();
        const signerPrivateKey = 'F1E7660DB9EF5E73203881304F31B7CCDF167A08055013A633D098EBD94FD36F';
        const data = 'I am legen wait for it dary';
        // tslint:disable-next-line:max-line-length
        const result = 'fe4e54598933E11AEF0E0D940CC4B7533578D12D86A9654DC3C7241BD8FCDE3AD2552E19AAB4F257874E5D0500FA22013E9035E1ADF821A174148806FEB5853EAF5D80EC0E';

        expect(keccak512.signedHashing(data, signerPrivateKey, NetworkType.MIJIN_TEST)).toEqual(result);
    });
});
