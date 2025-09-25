import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const PatientList = ({ selectedPatient, setSelectedPatient }) => {
  const { state, acc, fetchJSONFromIPFS } = useData();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);

  useEffect(() => {
    loadMyPatients();
  }, [state.contract, acc]);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const loadMyPatients = async () => {
    if (!state.contract || !acc) return;

    try {
      setLoading(true);
      console.log('Loading patients for doctor:', acc);
      
      const patientAddresses = await state.contract.getDoctorPatients(acc);
      console.log('Patient addresses received from contract:', patientAddresses);
      
      const patientData = [];

      for (const blockchainAddress of patientAddresses) {
        try {
          console.log('Processing blockchain address:', blockchainAddress);
          const patientInfo = await state.contract.getPatientData(blockchainAddress);
          
          if (patientInfo.exists) {
            const ipfsData = await fetchJSONFromIPFS(patientInfo.dataIPFShash);
            console.log('IPFS data for patient:', ipfsData);
            
            // Keep the blockchain address separate from IPFS data
            const patientRecord = {
              blockchainAddress: blockchainAddress, // Store the actual blockchain address
              ...ipfsData, // This might overwrite 'address' with patient name
              grantedAt: new Date().toISOString()
            };
            
            // Ensure we preserve the blockchain address
            patientRecord.blockchainAddress = blockchainAddress;
            
            console.log('Final patient record:', patientRecord);
            patientData.push(patientRecord);
          }
        } catch (error) {
          console.log(`Error loading patient ${blockchainAddress}:`, error);
          // Add patient with limited info if IPFS fails
          patientData.push({
            blockchainAddress: blockchainAddress, // Use the actual blockchain address
            firstName: 'Unknown',
            lastName: 'Patient',
            age: '--',
            gender: '--',
            bloodGroup: '--',
            grantedAt: new Date().toISOString()
          });
        }
      }

      console.log('Final patient data array:', patientData);
      setPatients(patientData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading patients:", error);
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchTerm) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient => 
      patient.blockchainAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredPatients(filtered);
  };

  const selectPatient = (patient) => {
    // Use the blockchain address, not the name
    console.log('Selecting patient with blockchain address:', patient.blockchainAddress);
    console.log('Full patient object:', patient);
    setSelectedPatient(patient.blockchainAddress); // Pass the actual blockchain address
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="patient-list">
      <div className="list-header">
        <h3>My Patients ({patients.length})</h3>
        <button 
          onClick={loadMyPatients} 
          className="refresh-btn"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search patients by name, address, or blood group..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your patients...</p>
        </div>
      )}

      <div className="patients-grid">
        {filteredPatients.map(patient => (
          <div 
            key={patient.blockchainAddress} 
            className={`patient-card ${selectedPatient === patient.blockchainAddress ? 'selected' : ''}`}
            onClick={() => selectPatient(patient)}
          >
            <div className="patient-avatar">
              <div className="avatar-circle">
                {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
              </div>
            </div>
            
            <div className="patient-info">
              <h4>{patient.firstName} {patient.lastName}</h4>
              <div className="patient-details">
                <p><strong>Age:</strong> {patient.age}</p>
                <p><strong>Gender:</strong> {patient.gender}</p>
                <p><strong>Blood Group:</strong> <span className="blood-group">{patient.bloodGroup}</span></p>
                <p><strong>Address:</strong> {formatAddress(patient.blockchainAddress)}</p>
                <p><strong>Access Granted:</strong> {formatDate(patient.grantedAt)}</p>
              </div>
            </div>

            <div className="patient-actions">
              {selectedPatient === patient.blockchainAddress && (
                <span className="selected-badge">Selected</span>
              )}
              <button 
                className="select-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  selectPatient(patient);
                }}
              >
                {selectedPatient === patient.blockchainAddress ? 'Selected' : 'Select Patient'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && !loading && patients.length > 0 && (
        <div className="no-results">
          <p>No patients found matching your search.</p>
        </div>
      )}

      {patients.length === 0 && !loading && (
        <div className="no-patients">
          <div className="no-patients-icon">👥</div>
          <h4>No patients yet</h4>
          <p>No patients have granted you access to their medical records.</p>
          <p>Patients can grant you access through their dashboard.</p>
        </div>
      )}

      {selectedPatient && (
        <div className="selection-info">
          <p>✅ Patient selected: {formatAddress(selectedPatient)}</p>
          <p>You can now view their records, upload new records, or chat with them using the tabs above.</p>
        </div>
      )}
    </div>
  );
};

export default PatientList;