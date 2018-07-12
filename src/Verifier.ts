import CryptoJS from 'crypto-js';
import { PublicAccount } from 'nem2-sdk';

/**
 * @description - a class with diffrent verifier function utilities
 * @class Verifier
 */
class Verifier {

    public static hashing = {
        'MD5': {
            name: 'MD5',
            signedVersion: '81',
            version: '01',
        },
        'SHA1': {
            name: 'SHA1',
            signedVersion: '82',
            version: '02',
        },
        'SHA256' : {
            name: 'SHA256',
            signedVersion: '83',
            version: '03',
        },
        'SHA3-256': {
            name: 'SHA3-256',
            signedVersion: '88',
            version: '08',
        },
        'SHA3-512': {
            name: 'SHA3-512',
            signedVersion: '89',
            version: '09',
        },
    };

    /**
     * @description - verify apostille message
     * @static
     * @param {PublicAccount} signer - the account used to sign the data
     * @param {string} data - the data
     * @param {string} payload - the hashed data
     * @returns
     * @memberof Verifier
     */
    public static verifyApostille(
        signer: PublicAccount,
        data: string,
        payload: string,
    ) {
        const apostilleHash = payload;

        // Get the checksum
        const checksum = apostilleHash.substring(0, 10);
        // Get the hashing byte
        const hashingByte = checksum.substring(8);
        // Retrieve the hashing method using the checksum in message and hash the file accordingly
        const fileHash = Verifier.retrieveHash(apostilleHash, data);
        // Check if apostille is signed
        if (Verifier.isSigned(hashingByte)) {
            // Verify signature
            return signer.verifySignature(fileHash, apostilleHash.substring(10));
        } else {
            // Check if hashed file match hash in transaction (without checksum)
            return fileHash === apostilleHash.substring(10);
        }
    }

    /**
     * Hash a file according to version byte in checksum
     *
     * @param {string} apostilleHash - The hash contained in the apostille transaction
     * @param {string} data - The data
     *
     * @return {string} - The file content hashed with correct hashing method
     */
    private static retrieveHash(apostilleHash, data) {
        // Get checksum
        const checksum = apostilleHash.substring(0, 10);
        // Get the version byte
        const hashingVersionBytes = checksum.substring(8);
        // Hash depending of version byte
        if (hashingVersionBytes === '01' || hashingVersionBytes === '81') {
            return CryptoJS.MD5(data).toString(CryptoJS.enc.Hex);
        } else if (hashingVersionBytes === '02' || hashingVersionBytes === '82') {
            return CryptoJS.SHA1(data).toString(CryptoJS.enc.Hex);
        } else if (hashingVersionBytes === '03' || hashingVersionBytes === '83') {
            return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
        } else if (hashingVersionBytes === '08' || hashingVersionBytes === '88') {
            return CryptoJS.SHA3(data, { outputLength: 256 }).toString(CryptoJS.enc.Hex);
        } else {
            return CryptoJS.SHA3(data, { outputLength: 512 }).toString(CryptoJS.enc.Hex);
        }
    }

    /**
     * Check if an apostille is signed
     *
     * @param {string} hashingByte - An hashing version byte
     *
     * @return {boolean} - True if signed, false otherwise
     */
    private static isSigned(hashingByte) {
        const array = Object.keys(Verifier.hashing);
        for (let i = 0; array.length > i; i++) {
            if (Verifier.hashing[array[i]].signedVersion === hashingByte) {
                return true;
            }
        }
        return false;
    }
}

export { Verifier };
