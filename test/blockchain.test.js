const assert = require('assert');
const Block = require('../lib/main').Block;
const Blockchain = require('../lib/main').Blockchain;
const mocha = require('mocha');

let blockObj = null;

mocha.beforeEach(function () {
    blockObj = new Block(0, 25, "test", "empty");
});

mocha.describe('Block class', function () {
    mocha.describe('Constructor', function () {
        it('Should correctly complete and save block', function () {
            assert.equal(blockObj.index, 0);
            assert.equal(blockObj.timestamp, 25);
            assert.equal(blockObj.data, "test");
            assert.equal(blockObj.previousHash, "empty");
            assert.equal(blockObj.nonce, 0);
        });

        it('Should give the block a correct hash', function () {
            assert.equal(blockObj.hash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        });

        it('Should have different hash after tampering', function () {
            var normalHash = blockObj.calculateHash();
            blockObj.timestamp = 10;

            assert.notEqual(blockObj.calculateHash, normalHash);
        });
    });
});

let blockchain = null;

mocha.beforeEach(function () {
    blockchain = new Blockchain();
});

mocha.describe('Blockchain class', function () {
    mocha.describe('createGenesisBlock', function () {
        it('Should correctly create a genesis block', function () {
            assert.equal(blockchain.chain.length, 1);
            assert.equal(blockchain.chain[0].index, 0);
            assert.equal(blockchain.chain[0].data, "Genesis block");
            assert.equal(blockchain.chain[0].previousHash, "randomBecauseThereIsNoPreviousBlock");
        });
    });

    mocha.describe('addBlock', function () {
        it('Should correctly contain added block', function () {
            blockchain.addBlock(blockObj);

            assert.equal(blockchain.chain.length, 2);
            assert.equal(blockchain.chain[1].data, "test");
            assert.equal(blockchain.chain[1].hash, "0012bf4fda8d3f4bcb76100dcceeeb17b1611d2eac3b492cd81b05635c2cec5e");
        });
    });

    mocha.describe('isChainValid', function () {
        it('Should return true if chain is not tampered with', function () {
            assert.equal(blockchain.isChainValid(), true);
        });

        it('Should return false if chain is tampered with on genesis block', function () {
            blockchain.addBlock(blockObj);
            blockchain.chain[0].data = "tamperdepamper";
            blockchain.addBlock(blockObj);

            assert.equal(blockchain.isChainValid(), false);
        });
    });
});

