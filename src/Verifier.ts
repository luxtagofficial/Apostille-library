import CryptoJS from 'crypto-js';
import { PublicAccount } from 'nem2-sdk';
import { Errors } from '../index';

/**
 * @description - a class with diffrent verifier function utilities
 * @class Verifier
 */
class Verifier {

    /**
     * @description - verify public apostille message
     * @static
     * @param {string} data - the data
     * @param {string} payload - the hashed data
     * @return {boolean}
     * @memberof Verifier
     */
    public static verifyPublicApostille(data: string, payload: string): boolean {
        if (this.isApostille(payload)) {
            if (this.isPublicApostille(payload)) {
                const fileHash = Verifier.retrieveHash(payload, data);
                return fileHash === payload.substring(10);
            }
            throw new Error(Errors[Errors.NOT_PUBLIC_APOSTILLE]);
        }
        throw new Error(Errors[Errors.NOT_APOSTILLE]);
    }

    /**
     * @description - verify private apostille message
     * @static
     * @param {PublicAccount} signer - the account used to sign the data
     * @param {string} data - the data
     * @param {string} payload - the hashed data
     * @return {boolean}
     * @memberof Verifier
     */
    public static verifyPrivateApostille(signer: PublicAccount, data: string, payload: string): boolean {
        if (this.isApostille(payload)) {
            if (this.isPrivateApostille(payload)) {
                const fileHash = Verifier.retrieveHash(payload, data);
                return signer.verifySignature(fileHash, payload.substring(10));
            }
            throw new Error(Errors[Errors.NOT_PRIVATE_APOSTILLE]);
        }
        throw new Error(Errors[Errors.NOT_APOSTILLE]);
    }

    /**
     * Check if payload is apostile
     *
     * @param {string} payload - The hash contained in the apostille transaction
     *
     * @return {boolean}
     */
    public static isApostille(payload: string): boolean {
        return (payload.substring(0, 8) === 'fe4e5459');
    }

    /**
     * Check if payload is public apostile
     *
     * @param {string} payload - The hash contained in the apostille transaction
     *
     * @return {boolean}
     */
    public static isPublicApostille(payload: string): boolean {
        const hashingByte = payload.substring(8, 10);
        return (hashingByte === '01' || hashingByte === '02' || hashingByte === '03' ||
            hashingByte === '08' || hashingByte === '09');
    }

    /**
     * Check if payload is private apostile
     *
     * @param {string} payload - The hash contained in the apostille transaction
     *
     * @return {boolean}
     */
    public static isPrivateApostille(payload: string): boolean {
        const hashingByte = payload.substring(8, 10);
        return (hashingByte === '81' || hashingByte === '82' || hashingByte === '83' ||
            hashingByte === '88' || hashingByte === '89');
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

}

export { Verifier };
