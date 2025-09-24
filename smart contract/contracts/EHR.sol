// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract EHR {
    struct Patient {
        string dataIPFShash;
        string[] medRecords;
        mapping(address=>bool) allowedDoctors;
        bool exists;
    }

    struct Doctor {
        string dataIPFShash;
        string specialization;
        address[] patients;
        bool exists;
    }

    mapping(address=>mapping(address=>string[])) private chatMessageHashes;
    mapping(address=>Patient) private patients;
    mapping(address=>Doctor) private doctors;
    address[] private patientAddresses;
    address[] private doctorAddresses;

    event PatientRegistered(address indexed patientAddress);
    event DoctorRegistered(address indexed doctorAddress);
    event MedicalRecordAdded(address indexed patientAddress, string ipfsHash);
    event AccessGranted(address indexed patientAddress, address indexed doctorAddress);
    event AccessRevoked(address indexed patientAddress, address indexed doctorAddress);
    event ChatMessageSent(address indexed patientAddress, address indexed doctorAddress, address sender, string ipfsHash);

    // NEW GETTER FUNCTIONS
    function getPatientData(address patientAddress) public view returns(string memory dataIPFShash, bool exists) {
        require(patients[patientAddress].exists, "Patient does not exist");
        require(msg.sender == patientAddress || patients[patientAddress].allowedDoctors[msg.sender], "Not authorized to access patient data");
        
        Patient storage patient = patients[patientAddress];
        return (patient.dataIPFShash, patient.exists);
    }

    function getDoctorData(address doctorAddress) public view returns(string memory dataIPFShash, string memory specialization, bool exists) {
        require(doctors[doctorAddress].exists, "Doctor does not exist");
        
        Doctor storage doctor = doctors[doctorAddress];
        return (doctor.dataIPFShash, doctor.specialization, doctor.exists);
    }

    function getAllDoctorAddresses() public view returns(address[] memory) {
        return doctorAddresses;
    }

    function getAllPatientAddresses() public view returns(address[] memory) {
        return patientAddresses;
    }

    function getDoctorPatients(address doctorAddress) public view returns(address[] memory) {
        require(doctors[doctorAddress].exists, "Doctor does not exist");
        require(msg.sender == doctorAddress, "Only doctor can access their patient list");
        return doctors[doctorAddress].patients;
    }

    // EXISTING FUNCTIONS (unchanged)
    function registerPatient(string memory _dataIPFShash) public {
        require(!patients[msg.sender].exists, "Patient already registered");
        require(!doctors[msg.sender].exists, "already registered as doctor");
        
        Patient storage newPatient = patients[msg.sender];
        newPatient.dataIPFShash = _dataIPFShash;
        newPatient.exists = true;
        patientAddresses.push(msg.sender);
        
        emit PatientRegistered(msg.sender);
    }

    function registerDoctor(string memory _dataIPFShash, string memory _specialization) public {
        require(!doctors[msg.sender].exists, "doctor already registered");
        require(!patients[msg.sender].exists, "already registered as patient");
        
        Doctor storage newDoctor = doctors[msg.sender];
        newDoctor.dataIPFShash = _dataIPFShash;
        newDoctor.exists = true;
        newDoctor.specialization = _specialization;
        doctorAddresses.push(msg.sender);
        
        emit DoctorRegistered(msg.sender);
    }

    function addMedicalRecord(address patientAddress, string memory ipfshash) public authorizedForPatient(patientAddress) {
        require(patients[patientAddress].exists, "patient does not exists");
        patients[patientAddress].medRecords.push(ipfshash);
        emit MedicalRecordAdded(patientAddress, ipfshash);
    }

    function getPatientRecords(address patientAddress) public view authorizedForPatient(patientAddress) returns(string[] memory) {
        require(patients[patientAddress].exists, "patient does not exists");
        return patients[patientAddress].medRecords;
    }

    function grantAccess(address doctorAddress) public onlyPatient {
        require(doctors[doctorAddress].exists, "doctor does not exists");
        patients[msg.sender].allowedDoctors[doctorAddress] = true;
        
        bool patientexists = false;
        for(uint256 i = 0; i < doctors[doctorAddress].patients.length; i++) {
            if(doctors[doctorAddress].patients[i] == msg.sender) {
                patientexists = true;
                break;
            }
        }
        if(!patientexists) {
            doctors[doctorAddress].patients.push(msg.sender);
        }
        emit AccessGranted(msg.sender, doctorAddress);
    }

    function revokeAccess(address doctorAddress) public onlyPatient {
        require(doctors[doctorAddress].exists, "doctor does not exists");
        patients[msg.sender].allowedDoctors[doctorAddress] = false;
        
        for(uint256 i = 0; i < doctors[doctorAddress].patients.length; i++) {
            if(doctors[doctorAddress].patients[i] == msg.sender) {
                doctors[doctorAddress].patients[i] = doctors[doctorAddress].patients[doctors[doctorAddress].patients.length - 1];
                doctors[doctorAddress].patients.pop();
                break;
            }
        }
        delete chatMessageHashes[msg.sender][doctorAddress];
        emit AccessRevoked(msg.sender, doctorAddress);
    }

    function sendMessageToDoctor(address doctorAddress, string memory ipfsHash) public onlyPatient {
        require(patients[msg.sender].allowedDoctors[doctorAddress], "Access not granted");
        chatMessageHashes[msg.sender][doctorAddress].push(ipfsHash);
        emit ChatMessageSent(msg.sender, doctorAddress, msg.sender, ipfsHash);
    }

    function sendMessageToPatient(address patientAddress, string memory ipfsHash) public onlyDoctor {
        require(patients[patientAddress].allowedDoctors[msg.sender], "Access not granted by patient");
        chatMessageHashes[patientAddress][msg.sender].push(ipfsHash);
        emit ChatMessageSent(patientAddress, msg.sender, msg.sender, ipfsHash);
    }

    function getChat(address doctorAddress) public view onlyPatient returns(string[] memory) {
        require(patients[msg.sender].allowedDoctors[doctorAddress], "Access not granted");
        return chatMessageHashes[msg.sender][doctorAddress];
    }

    function getChatWithPatient(address patientAddress) public view onlyDoctor returns(string[] memory) {
        require(patients[patientAddress].allowedDoctors[msg.sender], "Access not granted");
        return chatMessageHashes[patientAddress][msg.sender];
    }

    function isPatient(address addr) public view returns(bool) {
        return patients[addr].exists;
    }

    function isDoctor(address addr) public view returns(bool) {
        return doctors[addr].exists;
    }

    function checkAccess(address patientAddress, address doctorAddress) public view returns(bool) {
        require(patients[patientAddress].exists, "patient does not exists");
        require(doctors[doctorAddress].exists, "Doctor does not exists");
        return patients[patientAddress].allowedDoctors[doctorAddress];
    }

    function getAllowedDoctors(address patientAddress) public view returns(address[] memory) {
        require(patients[patientAddress].exists, "patient does not exists");
        require(msg.sender == patientAddress || patients[patientAddress].allowedDoctors[msg.sender], "No access");
        
        uint256 c = 0;
        for(uint256 i = 0; i < doctorAddresses.length; i++) {
            if(patients[patientAddress].allowedDoctors[doctorAddresses[i]]) {
                c++;
            }
        }
        
        address[] memory allowedDocs = new address[](c);
        uint256 index = 0;
        for(uint256 i = 0; i < doctorAddresses.length; i++) {
            if(patients[patientAddress].allowedDoctors[doctorAddresses[i]]) {
                allowedDocs[index++] = doctorAddresses[i];
            }
        }
        return allowedDocs;
    }

    modifier onlyPatient() {
        require(patients[msg.sender].exists, "only registered patients");
        _;
    }

    modifier onlyDoctor() {
        require(doctors[msg.sender].exists, "only registered doctors");
        _;
    }

    modifier authorizedForPatient(address patientAddress) {
        require(msg.sender == patientAddress || patients[patientAddress].allowedDoctors[msg.sender], "not authorized to access patients data");
        _;
    }
}