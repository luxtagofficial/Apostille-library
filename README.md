# Apostille-library
[![Build Status](https://travis-ci.org/NEM-Apostille/Apostille-library.svg?branch=master)](https://travis-ci.org/NEM-Apostille/Apostille-library) [![codecov](https://codecov.io/gh/NEM-Apostille/Apostille-library/branch/master/graph/badge.svg)](https://codecov.io/gh/NEM-Apostille/Apostille-library)

Typescript implementation of Apostille protocol and standards described in the [apostille whitepaper](https://nem.io/wp-content/themes/nem/files/ApostilleWhitePaper.pdf).

---

This library is still a draft and **meant to work with Catapult only.** it will be updated as the `nem2-sdk` and Catapult evolves and as more contributions and ideas emerges. The purpose of this Github is to define the standard and give examples. 

## Table of Contents

- [Abstract](#abstract)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Public Apostille](#public-apostille)
    - [Private Apostille](#private-apostille)
      - [Create](#1--create)
      - [Update](#2--update)
      - [Transfer](#3--transfer)
      - [Announce](#4--announce)
- [Acknowledgments](#acknowledgments)

# Abstract

NEM Apostille is a standard that enables a very versatile blockchain certificate system. It is used for a variety of use cases including the following:

- proof of existence for real world and digital products,

- certificates of ownership and operation for IOT devices,
- use the blockchain to show chain-of-custody and/or supply chain projects
- providing on-chain certificates, diplomas, land titles, ID where the entire certificate is represented on the blockchain and is transferable and updatable.
- and more...

The key innovation of Apostille is the realization that every item can be given its own private key, and that private key can be used to make a container address to record data about the item, have value sent to and from the item, and taking advantage of NEM's advanced multisig be used to even transfer ownership of the item's container on-chain from person to person.

This is an evolutionary leap from other blockchain notarization applications which often just record a fingerprint or hash of a document to show that it exists (which is what public Apostille is for).

Also, due to the nature of NEM's architecture, few if any other blockchains can reproduce the utility unlocked by the NEM Apostille Standard.

# Features

- [x] extends from [nem2-sdk](https://github.com/nemtech/nem2-sdk-typescript-javascript)
- [x] supports Catapult
- [x] support private and public Apostille
- [ ] auditing and verification of the Apostilles
- [x] Supports different hash functions
  - [x] MD5
  - [x] SHA-1
  - [x] SHA256
  - [x] SHA3-256
  - [x] SHA3-512
- [x] custom sink for public Apostille
- [x] update function for private Apostille
- [ ] support of encrypted messages
- [ ] ownership transfer for private Apostille
- [ ] support multisig accounts
- [ ] create `.nty` file for NanoWallet
- [ ] example to use out of the box

# Getting Started

## Installation

If you want to work with the `apostille-libaray` you can add it to your project as a dependency.

```
coming soon on npm
```

## Usage

There are two types of Apostilles, public Apostille and private Apostille and each is suitable for different use case as we will see.

### Public Apostille

The public Apostille is used as a POE (Proof Of Existence) for digital files where we take a hash of the digital file and send it to a public sink address which will be time-stamped by the Blockchain proofing it's existence.

```typescript
import CryptoJS from 'crypto-js';
import { NetworkType } from 'nem2-sdk';
import { PublicApostille, SHA256 } from 'apostille-library';


// A funny but valid private key
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
// Simulate the file content
const fileContent = CryptoJS.enc.Utf8.parse('Public apostille is awesome !');
// create a public apostille instance
const MyPublicApostille = new PublicApostille(signer, NetworkType.TEST_NET);
// create a hashing object 
const hashType = new SHA256();
// prepare the transaction to send to the public sink
MyPublicApostille.create(fileContent, hashType);
// sign and announce the transaction to the blockchain
MyPublicApostille.announc();
```

By default when constructing a public Apostille the network type will be matched by the default public sink address as follow:

`MAIN_NET`: NCZSJHLTIMESERVBVKOW6US64YDZG2PFGQCSV23J

`TEST_NET` : TC7MCY5AGJQXZQ4BN3BOPNXUVIGDJCOHBPGUM2GE

`MIJIN_NET`: MCGDK2J46BODGGKMPIKCBGTBBIWL6AL5ZKLKQ56A

`MIJIN_TEST`: not decided yet

---

however if the need arise to use a different sink address you can just pass it to the constructor as follow

```typescript
const mySinkAddress = SCGDK2J46BODGGKMPIKCBGTBBIWL6AL5ZKLKQ56A;
// A funny but valid private key
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
// create a public apostille instance
const MyPublicApostille = new PublicApostille(signer, NetworkType.MIJIN_TEST, mySinkAddress);
```

### Private Apostille

While the public Apostille is suitable for digital files as a POE, the private Apostille can be even used to represent real world assets on the Blockchain and this unique approach that the NEM Blockchain enables makes it possible to have the following:

- Proof of Existence
- Proof of Authenticity
- Proof of Ownership
- Transfer of ownership
- Dynamic State/Status update

#### 1- Create

```typescript
import { XEM, NetworkType } from 'nem2-sdk';
import { Apostille, SHA256 } from 'apostille-library';

const seed = 'Classified-File.pdf';
// A funny but valid private key
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';
// create an instance of a private apostille 
const TheClassifiedFile = new Apostille(seed, signer, NetworkType.TEST_NET);
```

The seed is used to generate a hierarchical deterministic (HD) account which can be used to represent real life assets on the Blockchain

```typescript
import { XEM, NetworkType } from 'nem2-sdk';
import { Apostille, SHA256 } from 'apostille-library';

// A funny but valid private key
const signer = 'aaaaaaaaaaeeeeeeeeeebbbbbbbbbb5555555555dddddddddd1111111111aaee';

/*** A Car ***/
const VIN = 'WBSKG9C57DE781763';
const MyLambo = new Apostille(VIN, signer, NetworkType.TEST_NET);

/*** A Watch ***/
const SERIAL_NUMBER = 'NEM–the-harvest-0/100';
const MyXEMChronoswiss = new Apostille(SERIAL_NUMBER, signer, NetworkType.TEST_NET);
```

Now the HD accounts are constructed and we can access the `privateKey`, `publicKey` and `address`

```typescript
/*** Digital file HD account ***/
console.log(TheClassifiedFile.privateKey);
console.log(TheClassifiedFile.publicKey);
console.log(TheClassifiedFile.address);
/*** Lambo HD account ***/
console.log(MyLambo.privateKey);
console.log(MyLambo.publicKey);
console.log(MyLambo.address);
/*** XEM Chronoswiss HD account ***/
console.log(MyXEMChronoswiss.privateKey);
console.log(MyXEMChronoswiss.publicKey);
console.log(MyXEMChronoswiss.address);
```

Finally the last step would be to prepare a creation transaction that will be sent to the HD account as a proof of existence and a proof of authenticity (only the signer private key can generate the exact HD account given the same seed also a signed hash will be attached as a text message in the creation transaction which will be sent by the signer as a proof of origin)

```typescript
const fileContent = CryptoJS.enc.Utf8.parse('Top secret secrets');
const hashType = new SHA256();

TheClassifiedFile.create(fileContent, hashType);
TheClassifiedFile.announce();
```

In some use cases we want to attach metadata rather than a hash and/or fill the Apostille with XEMs or other Mosaics we can do so using the same `create` method

```typescript
const payload = {
    brand: 'Cronoswiss',
    serialNumber: 'XEM-0/100',
};


MyXEMChronoswiss.create(
	JSON.stringify(payload), 
	[
        new Mosaic( new MosaicId('comsa:cms'), UInt64.fromUint(10)),
        XEM.createRelative(10),
    ],);
MyXEMChronoswiss.announce();
```

**Note:**

you can only create a creation transaction once, it will be the first incoming transaction for the HD account and other transactions should be initiated by the `update` method which will see below.

#### 2- Update

Updating The Apostille once in the wilderness of the Blockchain has been made easy through the `update` method where we can reflect different status/states of a real life asset.

```typescript
MyXEMChronoswiss.update('Top Up to increase value', [
        new Mosaic( new MosaicId('comsa:cms'), UInt64.fromUint(1000)),
        XEM.createRelative(1000),
    ],);
MyXEMChronoswiss.update('Sold at a very good price ;)');
```

Talking about selling a luxurious watch, with the private Apostille we can represent and transfer ownership.

#### 3- Transfer

Coming soon...

#### 4- Announce

The `announce` method use aggregate transaction to announce to the network which means it's possible to create, update as many times and transfer before announcing to the network

**Note:** the aggregate transaction has a limit of <insert a number here> of transactions

# Acknowledgments