var fs = require('fs'),
    express = require('express'), // http://expressjs.com/api.html
    request = require('request'), // https://github.com/mikeal/request
    portscanner = require('portscanner'), // https://npmjs.org/package/portscanner
    Blockchain = require('./main').Blockchain,
    Block = require('./main').Block,
    blockChain = new Blockchain();

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('../scratch');
}

/**
 * @constructor NodeManager
 * The node manager manages the registered dapp nodes
 * @param {Number} [interval]   optional monitoring interval in milliseconds
 */
function NodeManager(interval) {
    this.nodes = [];
    this.interval = interval != undefined ? interval : 10000; // monitoring interval in ms
}

/**
 * Retrieve a list with all registered dapp nodes
 * @return {Array}
 */
NodeManager.prototype.list = function () {
    return this.nodes;
};

/**
 * Connect to a remote node
 * @param {String} url    Url of the remote node
 */
NodeManager.prototype.connect = function (url) {
    // TODO: normalize the url
    if (this.nodes.indexOf(url) == -1) {
        this.nodes.push(url);
        console.log('connected node ' + url);
    }
};

/**
 * Disconnect from a remote node
 * @param {String} url    Url of the node
 */
NodeManager.prototype.disconnect = function (url) {
    // TODO: normalize the url
    var index = this.nodes.indexOf(url);
    if (index != -1) {
        this.nodes.splice(index, 1);
        console.log('disconnected node ' + url);

        // unregister the objects that where running on this node
        objects.unregisterAll(url);
    }
};

/**
 * Scan the network for nodes, and update the object list of all connected nodes
 * @param {function} callback
 */
NodeManager.prototype.scan = function (callback) {
    var me = this;
    this.scanNodes(function (err, status) {});
};

/**
 * Scan all local ports for other Distributed-App nodes, and
 * connect/disconnect them
 * @param {function} callback
 */
NodeManager.prototype.scanNodes = function (callback) {
    var unchecked = (endPort - startPort + 1);
    var start = +new Date();
    var manager = this;
    var connected = [];
    var disconnected = [];
    for (var port = startPort; port <= endPort; port++) {
        if (port != myPort) {
            var url = 'http://localhost:' + port;
            (function (url) {
                manager.isDistributedApp(url, function (err, isDapp) {
                    if (isDapp) {
                        if (manager.nodes.indexOf(url) == -1) {
                            // new node found. connect this node
                            manager.connect(url);
                            connected.push(url);
                        }
                    } else {
                        if (manager.nodes.indexOf(url) != -1) {
                            // known node does not exist anymore. disconnect
                            manager.disconnect(url);
                            disconnected.push(url);
                        }
                    }

                    unchecked--;
                    if (unchecked == 0) {
                        var end = +new Date();
                        callback(null, {
                            'connected': connected,
                            'disconnected': disconnected,
                            'time': (end - start)
                        }); // TODO: what to send back?
                    }
                })
            })(url);
        } else {
            unchecked--;
        }
    }
};

// /**
//  * Check if a Distributed-App node is running at given url
//  * @param {String} url
//  * @param {function} callback
//  */
NodeManager.prototype.isDistributedApp = function (url, callback) {
    request.get(url, function (err, res, body) {
        if (!err) {
            if (res.headers['content-type'].indexOf('application/json') == 0) {
                var json = JSON.parse(body);
                if (json.app == 'distributed-app') {
                    callback(null, true);
                    return;
                }
            }
        }
        callback(null, false);
    });
};

/**
 * Start monitoring the network for nodes, and the connected nodes for changes
 */
NodeManager.prototype.startMonitoring = function () {
    console.log('started monitoring the network for other distributed-app nodes');

    var manager = this;

    function scan() {
        // scan for other dapp nodes
        manager.scan(function (err, status) {
            if (err) {
                console.log('scanning failed: ' + err);
            }
            manager.monitorTimer = setTimeout(scan, manager.interval);
        });
    }

    scan();
};

/**
 * Stop monitoring the network and the connected nodes
 */
NodeManager.prototype.stopMonitoring = function () {
    console.log('stopped monitoring the network for other distributed-app nodes');
    if (this.monitorTimer) {
        clearTimeout(this.monitorTimer);
        delete this.monitorTimer;
    }
};

/**
 * Start the distributed application listening on a free port,
 * providing a RESTful API.
 */
var startPort = 3000;
var endPort = 3010;
var monitorInterval = 5000; // ms
var myPort = undefined;
var myUrl = undefined;

// list with registered dapp nodes
var nodes = new NodeManager(monitorInterval);
nodes.startMonitoring();

portscanner.findAPortNotInUse(startPort, endPort, 'localhost', function (error, port) {
    if (error == null) {
        myPort = port;
        myUrl = 'http://localhost:' + myPort; // TODO: not so nice solution

        // initialize web app
        var app = express();

        // create method to retrieve raw request body
        // http://stackoverflow.com/a/9920700/1069529
        app.use(function (req, res, next) {
            var data = '';
            req.setEncoding('utf8');
            req.on('data', function (chunk) {
                data += chunk;
            });
            req.on('end', function () {
                req.rawBody = data;
                next();
            });
        });

        // Generic information
        app.get('/', function (req, res) {
            var json = {
                'app': 'distributed-app',
                'url': myUrl,
                'description': 'Distributed-App provides a framework to run Node.js applications in a distributed way.',
                'documentation': 'https://github.com/wjosdejong/distributed-app'
            };
            res.send(json);
        });

        // Nodes API
        app.get('/nodes', function (req, res) {
            res.send(nodes.list());
        });
        app.post('/nodes/connect', function (req, res) {
            var json = JSON.parse(req.rawBody);
            // TODO: throw error when url is missing
            nodes.connect(json.url);
            res.send({
                "status": "success",
                "error": null
            });
        });
        app.post('/nodes/disconnect', function (req, res) {
            var json = JSON.parse(req.rawBody);
            // TODO: throw error when url is missing
            nodes.disconnect(json.url);
            res.send({
                "status": "success",
                "error": null
            });
        });
        app.get('/nodes/scan', function (req, res) {
            nodes.scan(function (err, status) {
                if (err) {
                    res.statusCode = 500;
                    res.send(err);
                } else {
                    res.send(status);
                }
            });
        });

        // START CUSTOM FUNCTIONALITY
        // Length of chain
        app.get('/chainlength', function (req, res) {
            res.send(blockChain.chain);
        });

        // Get own chain for patient or full for CareGiver
        app.get('/chain', function (req, res) {
            res.setHeader('Content-Type', 'application/json');
            if (localStorage.getItem('role') == "Patient") {
                var data = blockChain.chain.filter(x => x.data.patientName == localStorage.getItem('fullName'));
                res.send(JSON.stringify(data, null, '\t'));
            } else {
                res.send(JSON.stringify(blockChain.chain, null, '\t'));
            }
        });

        // Get specified patient chain for CareGiver
        app.get('/chain/:patient', function (req, res) {
            if (localStorage.getItem('role') == "CareGiver") {
                var patient = req.params.object;
                var data = blockChain.chain.filter(x => x.data.patientName == patient);
                res.send(JSON.stringify(data, null, '\t'));
            } else {
                console.log("No Permission");
                res.sendStatus(403);
            }
        });

        function sendNewBlock(block) {
            nodes.list().forEach(function (url) {
                const req = url + '/receiveBlock';
                if (url != 'http://localhost:' + myPort) {
                    request.post(req).form(JSON.stringify(block));
                }
            });
        }

        app.post('/addBlock', function (req, res) {
            if (localStorage.getItem('role') !== "CareGiver") {
                res.send("No permission: Not a CareGiver");
                return;
            }

            var block = JSON.parse(req.rawBody);
            var newBLock = new Block(blockChain.chain.length, block.timestamp, block.data);

            var tempChain = blockChain;
            tempChain.addBlock(newBLock);

            if (tempChain.isChainValid()) {
                blockChain.chain = tempChain.chain;
                sendNewBlock(blockChain.chain[blockChain.chain.length - 1]);
                res.sendStatus(200);
            } else {
                checkForNewerChain();
                res.sendStatus(500);
            }
        });

        app.post('/receiveBlock', function (req, res) {
            var block = JSON.parse(req.rawBody);
            var newBlock = new Block(block.index, block.timestamp, block.data, block.previousHash, block.hash, block.nonce);
            var tempChain = blockChain;

            tempChain.addBlock(newBlock);

            if (newBlock.previousHash !== blockChain[blockChain.chain.length - 1]) {
                if (tempChain.isChainValid()) {
                    blockChain.chain = tempChain.chain;
                    res.sendStatus(200);
                } else {
                    checkForNewerChain();
                    res.sendStatus(200);
                }
            }
        });

        // start listening at the found free port
        app.listen(myPort);
        console.log('Blockchain started at ' + myUrl);
        checkForNewerChain();
        // END CUSTOM FUNCTIONALITY

    } else {
        console.log('error:', error);
    }
});

function checkForNewerChain() {
    console.log(nodes.list());
    nodes.list().forEach(function (url) {
        if (url != 'http://localhost:' + myPort) {
            var req = url + '/chainlength';
            request(req, function (error, response, body) {
                if (body !== undefined && body.length > blockChain.chain.length) {
                    // There is a newer chain
                    blockChain.chain = JSON.parse(body);
                    blockChain.chain.forEach(function (block) {
                        blockChain.chain.splice(block.index, 1, new Block(block.index, block.timestamp, block.data, block.previousHash, block.hash, block.nonce));
                    });
                    if (blockChain.isChainValid()) {
                        // Chain is also valid
                        return;
                    }
                }
            });
        }
    })
}

process.on('SIGINT', function () {
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
    // some other closing procedures go here
    process.exit(1);
});
