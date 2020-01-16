const SHA256 = require('crypto-js/sha256');
const blockData = require('../_models/blockData');

class Block {

    constructor(index, timestamp, data = new blockData(), previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash);
    }
}

class Blockchain {

    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
    }

    createGenesisBlock() {
        return new Block(0, new Date(), "Genesis block", "randomBecauseThereIsNoPreviousBlock");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            console.log('1');
            console.log(currentBlock);

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;
    }
}

module.exports = Blockchain;

//Just to test
// let blockchain = new Blockchain();

// console.log("Mining block 1...");
// blockchain.addBlock(new Block(1, new Date(), {
//     patientName: "Thomas Lucas",
//     employeeName: "Justin Kannekens",
//     startTime: "12:00",
//     endTime: "12:30",
//     description: "xoxoxoxo"
// }));
// console.log("Mining block 2...");
// blockchain.addBlock(new Block(2, new Date(), {
//     patientName: "Justin Kannekens",
//     employeeName: "Thomas Lucas",
//     startTime: "12:00",
//     endTime: "12:30",
//     description: "xoxoxoxo"
// }));
// console.log(blockchain);
