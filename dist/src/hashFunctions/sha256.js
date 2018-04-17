"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_js_1 = __importDefault(require("crypto-js"));
const HashFunction_1 = require("./HashFunction");
class SHA256 extends HashFunction_1.HashFunction {
    static hash(data) {
        return crypto_js_1.default.SHA256(data).toString(crypto_js_1.default.enc.Hex);
    }
    constructor() {
        super('03', '83');
    }
    signedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.signed;
        return CHEKSUM + crypto_js_1.default.SHA256(data);
    }
    nonSignedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.nonSigned;
        return CHEKSUM + crypto_js_1.default.SHA256(data);
    }
}
exports.SHA256 = SHA256;
//# sourceMappingURL=sha256.js.map