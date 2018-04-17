"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_js_1 = __importDefault(require("crypto-js"));
const HashFunction_1 = require("./HashFunction");
class SHA3512 extends HashFunction_1.HashFunction {
    constructor() {
        super('09', '89');
    }
    signedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.signed;
        return CHEKSUM + crypto_js_1.default.SHA3(data, undefined, { outputLength: 512 });
    }
    nonSignedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.nonSigned;
        return CHEKSUM + crypto_js_1.default.SHA3(data, undefined, { outputLength: 512 });
    }
}
exports.SHA3512 = SHA3512;
//# sourceMappingURL=sha3-512.js.map