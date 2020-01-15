class Patient {
    constructor(userName, password, fullName, age) {
        this.userName = userName;
        this.password = password;
        this.fullName = fullName;
        this.age = age
    }

    contactCareGiver(careGiver) {
        careGiver.contact(this.fullName);
    }
}

module.exports = Patient
