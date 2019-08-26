import fs from 'fs';
import { Account, NetworkType, PublicAccount, SignedTransaction } from 'nem2-sdk';
import path from 'path';
import { Apostille, ApostilleHttp, HistoricalEndpoints, Initiator, SHA256, SHA3_256 } from '../index';

// ApostilleHttp
const network = NetworkType.MIJIN_TEST;
const apostilleHttp = new ApostilleHttp(HistoricalEndpoints[network]);

// Create Apostille function
function createApostille(pk, fileName) {
  const file = fs.readFileSync(`${path.basename(__dirname)}/${fileName}`);
  const fileData = file.toString('hex');

  // Account info
  const generatorAccount = Account.createFromPrivateKey(pk, network);

  // FOR DEMO PURPOSES ONLY - DO NOT USE IN PRODUCTION!
  const sinkPublicKey = SHA256.hash('PublicApostilleSinkAddress');
  const sinkAddress = PublicAccount.createFromPublicKey(sinkPublicKey, network).address;

  // Create apostille
  const apostille = Apostille.initFromSeed(fileName, generatorAccount);

  const fileHash = new SHA3_256().signedHashing(fileData, pk, network);

  console.log(fileHash);

  const apostilleTx = apostille.update(fileHash);
  apostilleHttp.addTransaction({
    initiator: new Initiator(generatorAccount),
    transaction: apostilleTx,
  });

  const sinkTx = apostille.update(fileHash, sinkAddress);
  apostilleHttp.addTransaction({
    initiator: new Initiator(apostille.HDAccount),
    transaction: sinkTx,
  });

  const multisigTx = apostille.associate([generatorAccount.publicAccount], 1, 1);
  apostilleHttp.addTransaction(multisigTx);

  const metadata = {
    filename: fileName,
    tags: ['apostille', 'sample', 'LuxTag'],
    // tslint:disable-next-line:object-literal-sort-keys
    description: 'LuxTag logo',
    originFileURL: 'https://luxtag.io/wp-content/uploads/2018/04/logo-Luxtag-uai-720x269.png',
  };
  const metadataTx = apostille.update(JSON.stringify(metadata));
  apostilleHttp.addTransaction({
    initiator: new Initiator(generatorAccount),
    transaction: metadataTx,
  });
}

// File info
const f = 'luxtag1.png';
const accounts = [
  'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aae1',
  'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aae2',
  'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aae3',
  'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aae4',
  'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aae5',
  'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aae6',
  'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aae7',
];

accounts.forEach((a) => createApostille(a, f));

// Announce
apostilleHttp.announceAll().subscribe(
  (result) => {
    if (result instanceof Array) {
      if (result[0] instanceof SignedTransaction) {
        return;
      }
    }
    console.log(result);
  },
);
