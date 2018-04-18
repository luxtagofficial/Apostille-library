"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const nemSDK = __importStar(require("nem-sdk"));
const nem2_sdk_1 = require("nem2-sdk");
const hashFunctions_1 = require("./hashFunctions");
const nem = nemSDK.default;
class Apostille {
    constructor(seed, signerPrivateKey, networkType) {
        this.seed = seed;
        this.signerPrivateKey = signerPrivateKey;
        this.networkType = networkType;
        this.transactions = [];
        this.Apostille = new nem2_sdk_1.Account();
        this.created = false;
        this.creationAnnounced = false;
        if (!nem.utils.helpers.isPrivateKeyValid(signerPrivateKey)) {
            throw new Error('!invalid private key');
        }
        const keyPair = nem.crypto.keyPair.create(this.signerPrivateKey);
        // hash the seed for the apostille account
        const hashSeed = hashFunctions_1.SHA256.hash(this.seed);
        // signe the hashed seed to get the private key
        const privateKey = nem.utils.helpers.fixPrivateKey(keyPair.sign(hashSeed).toString());
        // create the HD acccount (appostille)
        this.Apostille = nem2_sdk_1.Account.createFromPrivateKey(privateKey, this.networkType);
    }
    create(rawData, hashFunction, mosaics) {
        // TODO: check if the apostill exists on the blockchain
        if (this.created || this.creationAnnounced) {
            throw new Error('you have already created this apostille');
        }
        let creationTransaction;
        if (hashFunction) {
            this.hash = hashFunction.signedHashing(rawData, this.signerPrivateKey);
            if (mosaics) {
                creationTransaction = nem2_sdk_1.TransferTransaction.create(nem2_sdk_1.Deadline.create(), nem2_sdk_1.Address.createFromRawAddress(this.Apostille.address.plain()), mosaics, nem2_sdk_1.PlainMessage.create(this.hash), this.networkType);
            }
            else {
                creationTransaction = nem2_sdk_1.TransferTransaction.create(nem2_sdk_1.Deadline.create(), nem2_sdk_1.Address.createFromRawAddress(this.Apostille.address.plain()), [nem2_sdk_1.XEM.createRelative(0)], nem2_sdk_1.PlainMessage.create(this.hash), this.networkType);
            }
        }
        else {
            if (mosaics) {
                creationTransaction = nem2_sdk_1.TransferTransaction.create(nem2_sdk_1.Deadline.create(), nem2_sdk_1.Address.createFromRawAddress(this.Apostille.address.plain()), mosaics, nem2_sdk_1.PlainMessage.create(rawData), this.networkType);
            }
            else {
                creationTransaction = nem2_sdk_1.TransferTransaction.create(nem2_sdk_1.Deadline.create(), nem2_sdk_1.Address.createFromRawAddress(this.Apostille.address.plain()), [nem2_sdk_1.XEM.createRelative(0)], nem2_sdk_1.PlainMessage.create(rawData), this.networkType);
            }
        }
        // push the creation transaction to the transaction array
        this.transactions.push(creationTransaction);
        this.created = true;
    }
    update(message, mosaics) {
        if (!this.created) {
            throw new Error('Apostille not created yet!');
        }
        let updateTransaction;
        if (mosaics) {
            updateTransaction = nem2_sdk_1.TransferTransaction.create(nem2_sdk_1.Deadline.create(), nem2_sdk_1.Address.createFromRawAddress(this.Apostille.address.plain()), mosaics, nem2_sdk_1.PlainMessage.create(message), this.networkType);
        }
        else {
            updateTransaction = nem2_sdk_1.TransferTransaction.create(nem2_sdk_1.Deadline.create(), nem2_sdk_1.Address.createFromRawAddress(this.Apostille.address.plain()), [nem2_sdk_1.XEM.createRelative(0)], nem2_sdk_1.PlainMessage.create(message), this.networkType);
        }
        this.transactions.push(updateTransaction);
    }
    announce() {
        if (!this.created) {
            throw new Error('Apostille not created yet!');
        }
        const transactionHttp = new nem2_sdk_1.TransactionHttp('http://api.beta.catapult.mijin.io:3000');
        const owner = nem2_sdk_1.Account.createFromPrivateKey(this.signerPrivateKey, this.networkType);
        if (this.transactions.length === 1) {
            const signedTransaction = owner.sign(this.transactions[0]);
            transactionHttp.announce(signedTransaction).subscribe((res) => {
                console.log(res);
                this.creationAnnounced = true;
            }, err => console.error(err));
            // empty the array
            this.transactions = [];
        }
        else {
            const aggregateTransactions = [];
            this.transactions.forEach(transaction => {
                aggregateTransactions.push(transaction.toAggregate(owner.publicAccount));
            });
            const aggregateTransaction = nem2_sdk_1.AggregateTransaction.createComplete(nem2_sdk_1.Deadline.create(), aggregateTransactions, nem2_sdk_1.NetworkType.MIJIN_TEST, []);
            const signedAggregate = owner.sign(aggregateTransaction);
            transactionHttp.announce(signedAggregate).subscribe((res) => {
                console.log(res);
                this.creationAnnounced = true;
            }, err => console.error(err));
            // empty the array
            this.transactions = [];
        }
    }
    get privateKey() {
        return this.Apostille.privateKey;
    }
    get publicKey() {
        return this.Apostille.publicKey;
    }
    get address() {
        return this.Apostille.address.pretty();
    }
    get apostilleHash() {
        return this.hash;
    }
    get isCreated() {
        return this.created;
    }
    isAnnouced() {
        // TODO: check from the block chain
        const isAnnouced = this.creationAnnounced;
        return isAnnouced;
    }
}
exports.Apostille = Apostille;
//# sourceMappingURL=Apostille.js.map