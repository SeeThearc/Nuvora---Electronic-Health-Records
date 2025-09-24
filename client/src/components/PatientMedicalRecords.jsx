import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const PatientMedicalRecords = ({ patientAddress }) => {
  const { fetchMedicalRecords, getImageFromIPFS } = useData();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('PatientMedicalRecords - patientAddress prop:', patientAddress);
    console.log(patientAddress);
  }, [patientAddress]);

  useEffect(() => {
    if (patientAddress && patientAddress !== '' && patientAddress !== null) {
      console.log('Loading records for patient:', patientAddress);
      loadPatientRecords();
    } else {
      console.log('No valid patient address, clearing records');
      setRecords([]);
    }
  }, [patientAddress]);

  const loadPatientRecords = async () => {
    try {
      setLoading(true);
      console.log('Fetching medical records for:', patientAddress);
      
      // Use fetchMedicalRecords with the patient's address
      const patientRecords = await fetchMedicalRecords(patientAddress);
      console.log('Records received:', patientRecords);
      
      setRecords(patientRecords);
      setLoading(false);
    } catch (error) {
      console.error("Error loading patient records:", error);
      setRecords([]);
      setLoading(false);
    }
  };

  const openRecord = (record) => {
    setSelectedRecord(record);
  };

  const closeModal = () => {
    setSelectedRecord(null);
  };

  const downloadRecord = (hash, filename) => {
    const url = getImageFromIPFS(hash);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `medical_record_${hash.substring(0, 8)}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  // Show message if no patient is selected
  if (!patientAddress || patientAddress === '' || patientAddress === null) {
    return (
      <div className="patient-medical-records">
        <div className="no-patient-selected">
          <h3>No Patient Selected</h3>
          <p>Please select a patient from the "My Patients" tab first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-medical-records">
      <div className="records-header">
        <h3>Patient Medical Records ({records.length})</h3>
        <p>Patient: {formatAddress(patientAddress)}</p>
        <button 
          onClick={loadPatientRecords} 
          className="refresh-btn"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Records'}
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading patient medical records...</p>
        </div>
      )}

      <div className="records-grid">
        {records.map((record, index) => (
          <div key={record.hash} className="record-card">
            <div className="record-preview">
              <img 
                src={record.imageUrl} 
                alt={`Medical Record ${index + 1}`}
                onClick={() => openRecord(record)}
                style={{cursor: 'pointer'}}
                onError={(e) => {
                  console.error('Image load error:', e);
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </div>
            <div className="record-info">
              <p><strong>Record #{index + 1}</strong></p>
              <div className="record-actions">
                <button onClick={() => openRecord(record)}>View</button>
                <button onClick={() => downloadRecord(record.hash, `patient_record_${index + 1}`)}>
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {records.length === 0 && !loading && (
        <div className="no-records">
          <div className="no-records-icon">📋</div>
          <h4>No medical records found</h4>
          <p>This patient hasn't uploaded any medical records yet.</p>
          <p>You can upload new records for this patient using the "Upload Records" tab.</p>
        </div>
      )}

      {/* Modal for viewing record */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Medical Record</h4>
              <p>Patient: {formatAddress(patientAddress)}</p>
              <button onClick={closeModal} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <img 
                src={selectedRecord.imageUrl} 
                alt="Medical Record" 
                style={{maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain'}}
              />
            </div>
            <div className="modal-footer">
              <div className="record-metadata">
                <p><strong>Patient:</strong> {formatAddress(patientAddress)}</p>
              </div>
              <div className="modal-actions">
                <button 
                  onClick={() => downloadRecord(selectedRecord.hash, `patient_record_${selectedRecord.hash.substring(0, 8)}`)}
                  className="download-btn-modal"
                >
                  📥 Download
                </button>
                <button onClick={closeModal} className="close-btn-modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMedicalRecords;