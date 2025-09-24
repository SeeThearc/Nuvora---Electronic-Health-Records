// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract EHR {
    struct Patient {
        string dataIPFShash;
        string[] medRecords;
        mapping(address=>bool) allowedDoctors;
        mapping(address=>bool) allowedLabs; // approved labs
        bool exists;
    }

    struct Doctor {
        string dataIPFShash;
        string specialization;
        address[] patients;
        bool exists;
    }

    struct Lab {
        string dataIPFShash;
        string labName;
        bool exists;
    }

    struct LabRequest {
        address doctor;
        address lab;
        string reportIPFS;
        string testMessage;       // Added: description of the test
        bool patientApproved;
        bool completed;
    }

    mapping(address=>mapping(address=>string[])) private chatMessageHashes;
    mapping(address=>Patient) private patients;
    mapping(address=>Doctor) private doctors;
    mapping(address=>Lab) private labs;

    // patient => lab requests
    mapping(address=>LabRequest[]) private labRequests;

    address[] private patientAddresses;
    address[] private doctorAddresses;
    address[] private labAddresses;

    // Events
    event PatientRegistered(address indexed patientAddress);
    event DoctorRegistered(address indexed doctorAddress);
    event LabRegistered(address indexed labAddress);
    event MedicalRecordAdded(address indexed patientAddress, string ipfsHash);
    event LabRequested(
        address indexed patient,
        address indexed doctor,
        address indexed lab,
        string reportIPFS,
        string testMessage
    );
    event LabRequestApproved(address indexed patient, address indexed doctor, address indexed lab);
    event LabResultAdded(address indexed patient, address indexed lab, string reportIPFS);
    event AccessGranted(address indexed patientAddress, address indexed doctorAddress);
    event AccessRevoked(address indexed patientAddress, address indexed doctorAddress);
    event ChatMessageSent(address indexed patientAddress, address indexed doctorAddress, address sender, string ipfsHash);

    // --- Registration functions ---
    function registerPatient(string memory _dataIPFShash) public {
        require(!patients[msg.sender].exists && !doctors[msg.sender].exists, "Already registered");
        Patient storage newPatient = patients[msg.sender];
        newPatient.dataIPFShash = _dataIPFShash;
        newPatient.exists = true;
        patientAddresses.push(msg.sender);
        emit PatientRegistered(msg.sender);
    }

    function registerDoctor(string memory _dataIPFShash, string memory _specialization) public {
        require(!doctors[msg.sender].exists && !patients[msg.sender].exists, "Already registered");
        Doctor storage newDoctor = doctors[msg.sender];
        newDoctor.dataIPFShash = _dataIPFShash;
        newDoctor.specialization = _specialization;
        newDoctor.exists = true;
        doctorAddresses.push(msg.sender);
        emit DoctorRegistered(msg.sender);
    }

    function registerLab(string memory _dataIPFShash, string memory _labName) public {
        require(!labs[msg.sender].exists, "Lab already registered");
        Lab storage newLab = labs[msg.sender];
        newLab.dataIPFShash = _dataIPFShash;
        newLab.labName = _labName;
        newLab.exists = true;
        labAddresses.push(msg.sender);
        emit LabRegistered(msg.sender);
    }

    // --- Doctor requests lab test ---
    function requestLabTest(address patientAddress, address labAddress, string memory reportIPFS, string memory testMessage) public onlyDoctor {
        require(patients[patientAddress].exists, "Patient not exists");
        require(patients[patientAddress].allowedDoctors[msg.sender], "Doctor not allowed by patient");
        require(labs[labAddress].exists, "Lab not exists");

        labRequests[patientAddress].push(LabRequest({
            doctor: msg.sender,
            lab: labAddress,
            reportIPFS: reportIPFS,
            testMessage: testMessage,  // store test message
            patientApproved: false,
            completed: false
        }));

        emit LabRequested(patientAddress, msg.sender, labAddress, reportIPFS, testMessage);
    }

    // --- Patient approves lab request ---
    function approveLabRequest(uint256 requestIndex) public onlyPatient {
        require(requestIndex < labRequests[msg.sender].length, "Invalid request index");
        LabRequest storage request = labRequests[msg.sender][requestIndex];
        request.patientApproved = true;
        patients[msg.sender].allowedLabs[request.lab] = true; // allow lab access
        emit LabRequestApproved(msg.sender, request.doctor, request.lab);
    }

    // --- Lab uploads test result ---
    function uploadLabResult(address patientAddress, uint256 requestIndex, string memory resultIPFS) public {
        require(labs[msg.sender].exists, "Only registered labs");
        require(requestIndex < labRequests[patientAddress].length, "Invalid request index");

        LabRequest storage request = labRequests[patientAddress][requestIndex];
        require(request.lab == msg.sender, "Not assigned to this lab");
        require(request.patientApproved, "Patient has not approved");
        require(!request.completed, "Request already completed");

        patients[patientAddress].medRecords.push(resultIPFS);
        request.completed = true;

        emit LabResultAdded(patientAddress, msg.sender, resultIPFS);
    }

    // --- Chat functions ---
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

    // --- Access control ---
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

    // --- Getters ---
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

    function getLabRequests(address patientAddress) public view returns(LabRequest[] memory) {
        return labRequests[patientAddress];
    }

    function isPatient(address addr) public view returns(bool) {
        return patients[addr].exists;
    }

    function isDoctor(address addr) public view returns(bool) {
        return doctors[addr].exists;
    }

    function isLab(address addr) public view returns(bool) {
        return labs[addr].exists;
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

    // --- Modifiers ---
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
    function getLabData(address labAddress) public view returns(string memory dataIPFShash, string memory labName, bool exists) {
        require(labs[labAddress].exists, "Lab does not exist");
        Lab storage lab = labs[labAddress];
        return (lab.dataIPFShash, lab.labName, lab.exists);
    }

    // Get all lab addresses (similar to getAllDoctorAddresses)
    function getAllLabAddresses() public view returns(address[] memory) {
        return labAddresses;
    }

    // Check if an address is a registered lab
    function isLabRegistered(address labAddress) public view returns(bool) {
        return labs[labAddress].exists;
    }
}