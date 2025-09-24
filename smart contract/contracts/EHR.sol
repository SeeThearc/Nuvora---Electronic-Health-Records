// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract EHR {
    // -------------------- STRUCTS --------------------
    struct Patient {
        string dataIPFShash;
        string[] medRecords;
        mapping(address => bool) allowedDoctors;
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
        string specialization;
        address[] patients;
        bool exists;
    }

    struct LabRequest {
        address doctor;
        address patient;
        address lab;
        string requestDescription;
        string requestIPFShash;
        bool approved;
        bool exists;
    }

    struct LabReport {
        string description;
        string reportIPFShash;
        bool exists;
    }

    // -------------------- MAPPINGS --------------------
    mapping(address => Patient) private patients;
    mapping(address => Doctor) private doctors;
    mapping(address => Lab) private labs;
    mapping(address => mapping(address => string[])) private chatMessageHashes;
    mapping(uint256 => LabRequest) private labRequests;
    mapping(uint256 => LabReport) private labReports;

    address[] private patientAddresses;
    address[] private doctorAddresses;
    address[] private labAddresses;
    uint256 private labRequestCounter;

    // -------------------- EVENTS --------------------
    event PatientRegistered(address indexed patientAddress);
    event DoctorRegistered(address indexed doctorAddress);
    event LabRegistered(address indexed labAddress);
    event MedicalRecordAdded(address indexed patientAddress, string ipfsHash);
    event AccessGranted(address indexed patientAddress, address indexed doctorAddress);
    event AccessRevoked(address indexed patientAddress, address indexed doctorAddress);
    event ChatMessageSent(address indexed patientAddress, address indexed doctorAddress, address sender, string ipfsHash);
    event LabTestRequested(uint256 indexed requestId, address doctor, address patient, address lab, string description, string requestIPFShash);
    event LabRequestApproved(uint256 indexed requestId, address patient);
    event LabReportUploaded(address patient, address doctor, address lab, uint256 requestId, string description, string reportIPFShash);

    // -------------------- MODIFIERS --------------------
    modifier onlyPatient() {
        require(patients[msg.sender].exists, "Only patient allowed");
        _;
    }

    modifier onlyDoctor() {
        require(doctors[msg.sender].exists, "Only doctor allowed");
        _;
    }

    modifier onlyLab() {
        require(labs[msg.sender].exists, "Only lab allowed");
        _;
    }

    modifier authorizedForPatient(address patientAddress) {
        require(msg.sender == patientAddress || patients[patientAddress].allowedDoctors[msg.sender], "Not authorized");
        _;
    }

    // -------------------- REGISTRATION --------------------
    function registerPatient(string memory _dataIPFShash) public {
        require(!patients[msg.sender].exists, "Already registered");
        require(!doctors[msg.sender].exists && !labs[msg.sender].exists, "Cannot register as patient");

        Patient storage p = patients[msg.sender];
        p.dataIPFShash = _dataIPFShash;
        p.exists = true;
        patientAddresses.push(msg.sender);

        emit PatientRegistered(msg.sender);
    }

    function registerDoctor(string memory _dataIPFShash, string memory _specialization) public {
        require(!doctors[msg.sender].exists, "Already registered");
        require(!patients[msg.sender].exists && !labs[msg.sender].exists, "Cannot register as doctor");

        Doctor storage d = doctors[msg.sender];
        d.dataIPFShash = _dataIPFShash;
        d.specialization = _specialization;
        d.exists = true;
        doctorAddresses.push(msg.sender);

        emit DoctorRegistered(msg.sender);
    }

    function registerLab(string memory _dataIPFShash, string memory _specialization) public {
        require(!labs[msg.sender].exists, "Already registered");
        require(!patients[msg.sender].exists && !doctors[msg.sender].exists, "Cannot register as lab");

        Lab storage l = labs[msg.sender];
        l.dataIPFShash = _dataIPFShash;
        l.specialization = _specialization;
        l.exists = true;
        labAddresses.push(msg.sender);

        emit LabRegistered(msg.sender);
    }

    // -------------------- DOCTOR-PATIENT --------------------
    function grantAccess(address doctorAddress) public onlyPatient {
        require(doctors[doctorAddress].exists, "Doctor does not exist");
        patients[msg.sender].allowedDoctors[doctorAddress] = true;

        bool exists = false;
        for(uint256 i=0;i<doctors[doctorAddress].patients.length;i++){
            if(doctors[doctorAddress].patients[i] == msg.sender){
                exists = true;
                break;
            }
        }
        if(!exists){
            doctors[doctorAddress].patients.push(msg.sender);
        }

        emit AccessGranted(msg.sender, doctorAddress);
    }

    function revokeAccess(address doctorAddress) public onlyPatient {
        require(doctors[doctorAddress].exists, "Doctor does not exist");
        patients[msg.sender].allowedDoctors[doctorAddress] = false;

        for(uint256 i=0;i<doctors[doctorAddress].patients.length;i++){
            if(doctors[doctorAddress].patients[i]==msg.sender){
                doctors[doctorAddress].patients[i] = doctors[doctorAddress].patients[doctors[doctorAddress].patients.length-1];
                doctors[doctorAddress].patients.pop();
                break;
            }
        }
        delete chatMessageHashes[msg.sender][doctorAddress];
        emit AccessRevoked(msg.sender, doctorAddress);
    }

    function addMedicalRecord(address patientAddress, string memory ipfshash) public authorizedForPatient(patientAddress) {
        patients[patientAddress].medRecords.push(ipfshash);
        emit MedicalRecordAdded(patientAddress, ipfshash);
    }

    // -------------------- CHAT --------------------
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

    function getChat(address doctorAddress) public view onlyPatient returns(string[] memory){
        require(patients[msg.sender].allowedDoctors[doctorAddress], "Access not granted");
        return chatMessageHashes[msg.sender][doctorAddress];
    }

    function getChatWithPatient(address patientAddress) public view onlyDoctor returns(string[] memory){
        require(patients[patientAddress].allowedDoctors[msg.sender], "Access not granted");
        return chatMessageHashes[patientAddress][msg.sender];
    }

    // -------------------- LAB WORKFLOW --------------------
    function requestLabTest(address patientAddr, address labAddr, string memory description, string memory requestIPFShash) public onlyDoctor returns(uint256){
        require(patients[patientAddr].exists, "Patient does not exist");
        require(labs[labAddr].exists, "Lab does not exist");
        require(patients[patientAddr].allowedDoctors[msg.sender], "Doctor not authorized for this patient");

        labRequestCounter++;
        labRequests[labRequestCounter] = LabRequest(msg.sender, patientAddr, labAddr, description, requestIPFShash, false, true);
        emit LabTestRequested(labRequestCounter, msg.sender, patientAddr, labAddr, description, requestIPFShash);
        return labRequestCounter;
    }

    function approveLabRequest(uint256 requestId) public onlyPatient {
        require(labRequests[requestId].exists, "Request does not exist");
        require(labRequests[requestId].patient == msg.sender, "Not your request");
        labRequests[requestId].approved = true;
        emit LabRequestApproved(requestId, msg.sender);
    }

    function uploadLabReport(uint256 requestId, string memory description, string memory reportIPFShash) public onlyLab {
        LabRequest storage req = labRequests[requestId];
        require(req.exists, "Request does not exist");
        require(req.lab == msg.sender, "Not your assigned lab");
        require(req.approved, "Request not approved");
        require(!labReports[requestId].exists, "Report already uploaded");

        labReports[requestId] = LabReport(description, reportIPFShash, true);
        patients[req.patient].medRecords.push(reportIPFShash);

        bool found = false;
        for(uint256 i=0;i<labs[msg.sender].patients.length;i++){
            if(labs[msg.sender].patients[i]==req.patient){
                found=true;
                break;
            }
        }
        if(!found){
            labs[msg.sender].patients.push(req.patient);
        }

        emit LabReportUploaded(req.patient, req.doctor, msg.sender, requestId, description, reportIPFShash);
    }

    // -------------------- GETTERS --------------------
    function getPatientRecords(address patientAddress) public view authorizedForPatient(patientAddress) returns(string[] memory){
        return patients[patientAddress].medRecords;
    }

    function getLabRequest(uint256 requestId) public view returns(LabRequest memory){
        return labRequests[requestId];
    }

    function getLabReport(uint256 requestId) public view returns(LabReport memory){
        return labReports[requestId];
    }

    function getDoctorPatients(address doctorAddress) public view onlyDoctor returns(address[] memory){
        return doctors[doctorAddress].patients;
    }

    function getLabPatients(address labAddress) public view onlyLab returns(address[] memory){
        return labs[labAddress].patients;
    }
}
