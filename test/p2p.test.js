const request = require('supertest');
const assert = require('assert');
const Blockchain = require('../lib/main').Blockchain;
const Block = require('../lib/main').Block;
const {
    signInCareGiver,
    signInPatient,
    signOut
} = require('../app');

var data = new Block(1, new Date(), {
    patientName: "Thomas Lucas",
    employeeName: "Justin Kannekens",
    startTime: "12:00",
    endTime: "12:30",
    description: "xoxoxoxo"
});

describe('POST /addBlock', function () {

    it('should not continue if current user is a patient', function (done) {
        this.timeout(0)
        signInPatient('test1', '123');
        request('http://localhost:3000')
            .post('/addBlock')
            .send(data)
            .expect(403, done)
    });

})
