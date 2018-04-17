"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_js_1 = __importDefault(require("crypto-js"));
const HashFunction_1 = require("./HashFunction");
class SHA3256 extends HashFunction_1.HashFunction {
    constructor() {
        super('08', '88');
    }
    signedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.signed;
        return CHEKSUM + crypto_js_1.default.SHA3(data, undefined, { outputLength: 256 });
    }
    nonSignedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.nonSigned;
        return CHEKSUM + crypto_js_1.default.SHA3(data, undefined, { outputLength: 256 });
    }
}
exports.SHA3256 = SHA3256;
//# sourceMappingURL=sha3-256.js.map