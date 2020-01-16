//Simulate Login
const Patient = require('./_models/Patient');
const CareGiver = require('./_models/CareGiver');
const cmd = require('node-cmd');

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

var patientList = new Array();
var careGiverList = new Array();

let p1 = new Patient("test1", "123", "Geertje Goor", 84);
let c1 = new CareGiver("test2", "123", "Pietje Pot", 34);

patientList.push(p1);
careGiverList.push(c1);

// Functionality 
function signInPatient(username, password) {
    var patient = patientList.find(x => x.userName === username);
    if (patient == undefined) {
        console.log("Invalid Credentials");
    } else if (patient.password === password) {
        console.log("Logged In");
        localStorage.setItem('role', 'Patient');
        localStorage.setItem('fullName', patient.fullName);
        cmd.run('node server.js');
    } else {
        console.log("Invalid Credentials");
    }
}

function signInCareGiver(username, password) {
    var cg = careGiverList.find(x => x.userName === username);
    if (cg == undefined) {
        console.log("Invalid Credentials");
    } else if (cg.password === password) {
        console.log("Logged In");
        localStorage.setItem('role', 'CareGiver');
        cmd.run('node server.js');
    } else {
        console.log("Invalid Credentials");
    }
}


signInPatient("test1", "123")
