"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nem_sdk_1 = __importDefault(require("nem-sdk"));
const nem2_sdk_1 = require("nem2-sdk");
const Apostille_1 = require("../../src/Apostille");
const tag = 'NEM is Awesome!';
const signer = '73CA8F6F7F39A94E6094A0E423C85D6FA9C924E6C59E6CBFF5D2C969FF63650A';
const myApostille = new Apostille_1.Apostille(tag, signer, nem2_sdk_1.NetworkType.MIJIN_TEST);
it('private key should be valid', () => {
    expect(nem_sdk_1.default.utils.helpers.isPrivateKeyValid(myApostille.privateKey)).not.toBeFalsy();
});
//# sourceMappingURL=apostille.spec.js.map