"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nem_sdk_1 = __importDefault(require("nem-sdk"));
const nem2_sdk_1 = require("nem2-sdk");
const Apostille_1 = require("../../src/Apostille");
const hashFunctions_1 = require("../../src/hashFunctions");
const tag = 'NEM is Awesome!';
const signer = '73CA8F6F7F39A94E6094A0E423C85D6FA9C924E6C59E6CBFF5D2C969FF63650A';
// Create a common object holding key
var common = nem_sdk_1.default.model.objects.create('common')('', signer);
// Simulate the file content
var fileContent = nem_sdk_1.default.crypto.js.enc.Utf8.parse('Apostille is awesome !');
// Create the Apostille
var oldPrivateApostille = nem_sdk_1.default.model.apostille.create(common, 'NEM is Awesome!', fileContent, 'Test Apostille', nem_sdk_1.default.model.apostille.hashing['SHA256'], false, {}, true, nem_sdk_1.default.model.network.data.testnet.id);
const newPrivateApostille = new Apostille_1.Apostille(tag, signer, nem2_sdk_1.NetworkType.TEST_NET);
describe('HD account generation should be correct', () => {
    it('private key should be valid', () => {
        expect(nem_sdk_1.default.utils.helpers.isPrivateKeyValid(newPrivateApostille.privateKey)).toBeTruthy();
    });
    it('public key should be valid', () => {
        expect(nem_sdk_1.default.utils.helpers.isPublicKeyValid(newPrivateApostille.publicKey)).toBeTruthy();
    });
    it('should generate the same HD account', () => {
        expect(oldPrivateApostille.data.dedicatedAccount.privateKey.toUpperCase() === newPrivateApostille.privateKey).toBeTruthy();
    });
});
const hashType = new hashFunctions_1.SHA256();
newPrivateApostille.create(fileContent, hashType);
describe('apostille hash should be correct', () => {
    it('should generate correct signed checksum with sha-256', () => {
        console.log(newPrivateApostille.apostilleHash.substring(0, 10));
        expect(newPrivateApostille.apostilleHash.substring(0, 10) === oldPrivateApostille.data.checksum).toBeTruthy();
    });
    it('should generate correct hash with sha-256', () => {
        console.log(newPrivateApostille.apostilleHash);
        expect(newPrivateApostille.apostilleHash === oldPrivateApostille.data.hash).toBeTruthy();
    });
});
//# sourceMappingURL=apostille.spec.js.map