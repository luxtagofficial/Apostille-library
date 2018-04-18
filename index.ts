// import everything from the src folder
import { XEM, NetworkType } from 'nem2-sdk';
import { Apostille } from './src/Apostille';
import { SHA256 } from './src/hashFunctions';

const tag = 'NEM is Awesome!';
// privatekey
var signer = "0F30BA45EF341096493CD793D17D4808DAB5EC20A6CC0EB2354DDD687A3A8CF8";


const myApostille = new Apostille(tag, signer, NetworkType.MIJIN_TEST);


const jsonObject = {
  data: 'Hello World!',
};
const hashType = new SHA256();

myApostille.create(JSON.stringify(jsonObject), hashType, [XEM.createRelative(2)]);
console.log('appostil pk', myApostille.privateKey);
console.log('appostil pp', myApostille.publicKey);
console.log('appostil address', myApostille.address);
myApostille.update('test #1', [XEM.createRelative(1)]);
myApostille.update('test #2', [XEM.createRelative(2)]);
myApostille.update('test #3', [XEM.createRelative(3)]);
myApostille.announce();

export * from './src/hashFunctions';
export * from './src/Apostille';
