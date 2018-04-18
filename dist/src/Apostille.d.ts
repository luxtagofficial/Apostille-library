import { NetworkType, Mosaic } from 'nem2-sdk';
import { HashFunction } from './hashFunctions/HashFunction';
declare class Apostille {
    readonly seed: string;
    private signerPrivateKey;
    readonly networkType: NetworkType;
    private transactions;
    private Apostille;
    private created;
    private creationAnnounced;
    private hash;
    constructor(seed: string, signerPrivateKey: string, networkType: NetworkType);
    create(rawData: string, hashFunction?: HashFunction, mosaics?: Array<Mosaic>): void;
    update(message: string, mosaics?: Array<Mosaic>): void;
    announce(): void;
    readonly privateKey: string;
    readonly publicKey: string;
    readonly address: string;
    readonly apostilleHash: string;
    readonly isCreated: boolean;
    isAnnouced(): boolean;
}
export { Apostille };
