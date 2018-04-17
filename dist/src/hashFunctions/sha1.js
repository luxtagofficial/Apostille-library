"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_js_1 = __importDefault(require("crypto-js"));
const HashFunction_1 = require("./HashFunction");
class SHA1 extends HashFunction_1.HashFunction {
    constructor() {
        super('02', '82');
    }
    signedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.signed;
        return CHEKSUM + crypto_js_1.default.SHA1(data);
    }
    nonSignedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.nonSigned;
        return CHEKSUM + crypto_js_1.default.SHA1(data);
    }
}
exports.SHA1 = SHA1;
//# sourceMappingURL=sha1.js.map