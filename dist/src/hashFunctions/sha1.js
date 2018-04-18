"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_js_1 = __importDefault(require("crypto-js"));
const nemSDK = __importStar(require("nem-sdk"));
const HashFunction_1 = require("./HashFunction");
const nem = nemSDK.default;
class SHA1 extends HashFunction_1.HashFunction {
    constructor() {
        super('02', '82');
    }
    signedHashing(data, signerPrivateKey) {
        const keyPair = nem.crypto.keyPair.create(signerPrivateKey);
        const CHEKSUM = 'fe4e5459' + this.signed;
        return CHEKSUM + keyPair.sign(crypto_js_1.default.SHA1(data).toString()).toString();
    }
    nonSignedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.nonSigned;
        return CHEKSUM + crypto_js_1.default.SHA1(data);
    }
}
exports.SHA1 = SHA1;
//# sourceMappingURL=sha1.js.map