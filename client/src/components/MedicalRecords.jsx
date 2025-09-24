import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const MedicalRecords = () => {
  const { acc, fetchMedicalRecords, getImageFromIPFS } = useData();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadMedicalRecords();
  }, []);

  const loadMedicalRecords = async () => {
    try {
      setLoading(true);
      const patientRecords = await fetchMedicalRecords(acc);
      setRecords(patientRecords);
      setLoading(false);
    } catch (error) {
      console.error("Error loading medical records:", error);
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
    link.download = filename || `medical_record_${hash}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="medical-records">
      <h3>My Medical Records ({records.length})</h3>
      
      <button onClick={loadMedicalRecords} className="refresh-btn">
        Refresh Records
      </button>

      {loading && <div>Loading medical records...</div>}

      <div className="records-grid">
        {records.map((record, index) => (
          <div key={record.hash} className="record-card">
            <div className="record-preview">
              <img 
                src={record.imageUrl} 
                alt={`Medical Record ${index + 1}`}
                onClick={() => openRecord(record)}
                style={{cursor: 'pointer'}}
              />
            </div>
            <div className="record-info">
              <p><strong>Record #{index + 1}</strong></p>
              {/* <p>Hash: {record.hash.substring(0, 20)}...</p> */}
              <div className="record-actions">
                <button onClick={() => openRecord(record)}>View</button>
                <button onClick={() => downloadRecord(record.hash, `record_${index + 1}`)}>
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {records.length === 0 && !loading && (
        <div className="no-records">
          <p>No medical records uploaded yet.</p>
          <p>Upload your first medical record using the "Upload Records" tab.</p>
        </div>
      )}

      {/* Modal for viewing record */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Medical Record</h4>
              <button onClick={closeModal} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <img 
                src={selectedRecord.imageUrl} 
                alt="Medical Record" 
                style={{maxWidth: '100%', maxHeight: '80vh'}}
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => downloadRecord(selectedRecord.hash)}>
                Download
              </button>
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;