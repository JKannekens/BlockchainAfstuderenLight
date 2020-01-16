class CareGiver {
    constructor(userName, password, fullName, age) {
        this.userName = userName;
        this.password = password;
        this.fullName = fullName;
        this.age = age
    }

    contact(patient) {
        console.log("Patient: " + patient + " has contacted you.")
    }
}

module.exports = CareGiver;
