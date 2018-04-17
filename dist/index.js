"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import everything from the src folder
const nem2_sdk_1 = require("nem2-sdk");
const Apostille_1 = require("./src/Apostille");
const hashFunctions_1 = require("./src/hashFunctions");
const tag = 'NEM is Awesome!';
// privatekey
var signer = "0F30BA45EF341096493CD793D17D4808DAB5EC20A6CC0EB2354DDD687A3A8CF8";
const myApostille = new Apostille_1.Apostille(tag, signer, nem2_sdk_1.NetworkType.MIJIN_TEST);
const jsonObject = {
    data: 'Hello World!',
};
const hashType = new hashFunctions_1.SHA256();
myApostille.create(JSON.stringify(jsonObject), hashType, [nem2_sdk_1.XEM.createRelative(2)]);
console.log('appostil pk', myApostille.privateKey);
console.log('appostil pp', myApostille.publicKey);
console.log('appostil address', myApostille.address);
myApostille.update('test #1', [nem2_sdk_1.XEM.createRelative(1)]);
myApostille.update('test #2', [nem2_sdk_1.XEM.createRelative(2)]);
myApostille.update('test #3', [nem2_sdk_1.XEM.createRelative(3)]);
myApostille.announce();
//# sourceMappingURL=index.js.map