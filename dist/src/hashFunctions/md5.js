"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_js_1 = __importDefault(require("crypto-js"));
const HashFunction_1 = require("./HashFunction");
class MD5 extends HashFunction_1.HashFunction {
    constructor() {
        super('01', '81');
    }
    signedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.signed;
        return CHEKSUM + crypto_js_1.default.MD5(data);
    }
    nonSignedHashing(data) {
        const CHEKSUM = 'fe4e5459' + this.nonSigned;
        return CHEKSUM + crypto_js_1.default.MD5(data);
    }
}
exports.MD5 = MD5;
//# sourceMappingURL=md5.js.map