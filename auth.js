//Simulate Login
const Patient = require('./Patient');
const CareGiver = require('./CareGiver');

var patientList = new Array();
var careGiverList = new Array();

let p1 = new Patient("test1", "123", "Geertje Goor", 84);
let c1 = new CareGiver("test2", "123", "Pietje Pot", 34);

patientList.push(p1);
careGiverList.push(c1);

let loggedIn = false;

// Functionality 
function signInPatient(username, password) {
    var patient = patientList.find(x => x.userName === username);
    if (patient == undefined) {
        console.log("Invalid Credentials");
    } else if (patient.password === password) {
        console.log("Logged In")
        loggedIn = true;
    } else {
        console.log("Invalid Credentials");
    }
}

function signInCareGiver(username, password) {
    var cg = careGiverList.find(x => x.userName === username);
    if (cg == undefined) {
        console.log("Invalid Credentials");
    } else if (cg.password === password) {
        console.log("Logged In")
        loggedIn = true;
    } else {
        console.log("Invalid Credentials");
    }
}

function signOut() {
    if (loggedIn == true) {
        loggedIn = false;
    }
}

//Test
signInPatient("test1", "123");
