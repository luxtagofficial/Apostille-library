import CryptoJS from 'crypto-js';
import { PublicAccount } from 'nem2-sdk';

// const nem = nemSDK.default;

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
     * @description -
     * @static
     * @param {string} fileContent
     * @param {string} payload
     * @param {string} signer
     * @param {NetworkType} networkType
     * @returns
     * @memberof Verifier
     */
    public static verifyApostille(
        signer: PublicAccount,
        fileContent: string,
        payload: string,
        signature: string) {
        const apostilleHash = payload;

        // Get the checksum
        const checksum = apostilleHash.substring(0, 10);
        // Get the hashing byte
        const hashingByte = checksum.substring(8);
        // Retrieve the hashing method using the checksum in message and hash the file accordingly
        const fileHash = Verifier.retrieveHash(apostilleHash, fileContent);
        // Check if apostille is signed
        if (Verifier.isSigned(hashingByte)) {
            console.log('isSigned');
            // Verify signature
            console.log(signature.length);
            return signer.verifySignature(fileHash, signature);
        } else {
            console.log('!isSigned');
            // Check if hashed file match hash in transaction (without checksum)
            return fileHash === apostilleHash.substring(10);
        }
    }

    /**
     * Hash a file according to version byte in checksum
     *
     * @param {string} apostilleHash - The hash contained in the apostille transaction
     * @param {wordArray} fileContent - The file content
     *
     * @return {string} - The file content hashed with correct hashing method
     */
    private static retrieveHash(apostilleHash, fileContent) {
        // Get checksum
        const checksum = apostilleHash.substring(0, 10);
        // Get the version byte
        const hashingVersionBytes = checksum.substring(8);
        // Hash depending of version byte
        if (hashingVersionBytes === '01' || hashingVersionBytes === '81') {
            return CryptoJS.MD5(fileContent).toString(CryptoJS.enc.Hex);
        } else if (hashingVersionBytes === '02' || hashingVersionBytes === '82') {
            return CryptoJS.SHA1(fileContent).toString(CryptoJS.enc.Hex);
        } else if (hashingVersionBytes === '03' || hashingVersionBytes === '83') {
            return CryptoJS.SHA256(fileContent).toString(CryptoJS.enc.Hex);
        } else if (hashingVersionBytes === '08' || hashingVersionBytes === '88') {
            return CryptoJS.SHA3(fileContent, { outputLength: 256 }).toString(CryptoJS.enc.Hex);
        } else {
            return CryptoJS.SHA3(fileContent, { outputLength: 512 }).toString(CryptoJS.enc.Hex);
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
