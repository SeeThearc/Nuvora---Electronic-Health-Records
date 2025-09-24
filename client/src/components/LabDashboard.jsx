import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const LabDashboard = () => {
  const { state, acc, fetchJSONFromIPFS, uploadImageToIPFS } = useData();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [resultFile, setResultFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadLabRequests();
  }, [state.contract, acc]);

  const loadLabRequests = async () => {
    if (!state.contract || !acc) return;

    try {
      setLoading(true);
      // Get all patient addresses to check their lab requests
      const patientAddresses = await state.contract.getAllPatientAddresses();
      const pending = [];
      const completed = [];

      for (const patientAddress of patientAddresses) {
        try {
          const requests = await state.contract.getLabRequests(patientAddress);
          
          for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            
            // Only include requests assigned to this lab
            if (request.lab.toLowerCase() === acc.toLowerCase()) {
              // Get patient details
              let patientInfo = { name: 'Unknown', lastName: 'Patient' };
              try {
                const patientData = await state.contract.getPatientData(patientAddress);
                if (patientData.exists && patientData.dataIPFShash) {
                  const patientIPFS = await fetchJSONFromIPFS(patientData.dataIPFShash);
                  patientInfo = patientIPFS;
                }
              } catch (error) {
                console.log('Error fetching patient data:', error);
              }

              // Get doctor details
              let doctorInfo = { name: 'Unknown', lastName: 'Doctor', specialization: 'N/A' };
              try {
                const doctorData = await state.contract.getDoctorData(request.doctor);
                if (doctorData.exists && doctorData.dataIPFShash) {
                  const doctorIPFS = await fetchJSONFromIPFS(doctorData.dataIPFShash);
                  doctorInfo = { ...doctorIPFS, specialization: doctorData.specialization };
                }
              } catch (error) {
                console.log('Error fetching doctor data:', error);
              }

              const requestWithDetails = {
                ...request,
                index: i,
                patientAddress,
                patientInfo,
                doctorInfo,
                requestDate: new Date().toISOString()
              };

              if (request.completed) {
                completed.push(requestWithDetails);
              } else if (request.patientApproved) {
                pending.push(requestWithDetails);
              }
            }
          }
        } catch (error) {
          console.error(`Error checking requests for patient ${patientAddress}:`, error);
        }
      }

      setPendingRequests(pending);
      setCompletedRequests(completed);
      setLoading(false);
    } catch (error) {
      console.error("Error loading lab requests:", error);
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid file type (JPEG, PNG, GIF, WebP, PDF)');
        return;
      }

      setResultFile(file);
    }
  };

  const uploadResult = async () => {
    if (!resultFile || !selectedRequest) {
      alert('Please select a file and request');
      return;
    }

    try {
      setUploading(true);
      
      // Upload file to IPFS
      const resultIPFS = await uploadImageToIPFS(resultFile);
      
      // Upload result to blockchain
      const tx = await state.contract.uploadLabResult(
        selectedRequest.patientAddress,
        selectedRequest.index,
        resultIPFS
      );
      await tx.wait();
      
      alert('Lab result uploaded successfully!');
      
      // Reset form
      setResultFile(null);
      setSelectedRequest(null);
      document.getElementById('result-file-input').value = '';
      
      // Refresh requests
      await loadLabRequests();
      setUploading(false);
    } catch (error) {
      console.error("Error uploading lab result:", error);
      alert('Failed to upload lab result. Please try again.');
      setUploading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="lab-dashboard">
      <div className="dashboard-header">
        <h2>Laboratory Dashboard</h2>
        <button 
          onClick={loadLabRequests} 
          className="refresh-btn"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Requests'}
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading lab requests...</p>
        </div>
      )}

      {/* Upload Results Section */}
      {pendingRequests.length > 0 && (
        <div className="upload-section">
          <h3>Upload Test Results</h3>
          
          <div className="upload-form">
            <div className="form-group">
              <label>Select Request:</label>
              <select 
                value={selectedRequest ? `${selectedRequest.patientAddress}-${selectedRequest.index}` : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [patientAddr, index] = e.target.value.split('-');
                    const request = pendingRequests.find(req => 
                      req.patientAddress === patientAddr && req.index.toString() === index
                    );
                    setSelectedRequest(request);
                  } else {
                    setSelectedRequest(null);
                  }
                }}
              >
                <option value="">Select a test request</option>
                {pendingRequests.map(request => (
                  <option 
                    key={`${request.patientAddress}-${request.index}`} 
                    value={`${request.patientAddress}-${request.index}`}
                  >
                    {request.patientInfo.name} {request.patientInfo.lastName} - {request.testMessage.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>

            {selectedRequest && (
              <div className="selected-request-info">
                <h5>Selected Request Details:</h5>
                <p><strong>Patient:</strong> {selectedRequest.patientInfo.name} {selectedRequest.patientInfo.lastName}</p>
                <p><strong>Doctor:</strong> Dr. {selectedRequest.doctorInfo.name} {selectedRequest.doctorInfo.lastName}</p>
                <p><strong>Test:</strong> {selectedRequest.testMessage}</p>
                <p><strong>Patient Address:</strong> {formatAddress(selectedRequest.patientAddress)}</p>
              </div>
            )}

            <div className="form-group">
              <label>Upload Test Result File:</label>
              <input
                id="result-file-input"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
            </div>

            {resultFile && (
              <div className="file-info">
                <p>Selected file: {resultFile.name}</p>
                <p>Size: {(resultFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>Type: {resultFile.type}</p>
              </div>
            )}

            <button 
              onClick={uploadResult} 
              disabled={!resultFile || !selectedRequest || uploading}
              className="upload-btn"
            >
              {uploading ? 'Uploading Result...' : 'Upload Test Result'}
            </button>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      <div className="requests-section">
        <h3>Pending Test Requests ({pendingRequests.length})</h3>
        
        {pendingRequests.length === 0 && !loading && (
          <div className="no-requests">
            <p>No pending test requests assigned to your laboratory.</p>
          </div>
        )}

        <div className="requests-grid">
          {pendingRequests.map(request => (
            <div key={`${request.patientAddress}-${request.index}`} className="request-card">
              <div className="request-header">
                <h4>Test Request</h4>
                <span className="status-badge pending">Pending Results</span>
              </div>

              <div className="request-details">
                <div className="patient-info">
                  <h5>Patient Information</h5>
                  <p><strong>Name:</strong> {request.patientInfo.name} {request.patientInfo.lastName}</p>
                  <p><strong>Age:</strong> {request.patientInfo.age}</p>
                  <p><strong>Blood Group:</strong> {request.patientInfo.bloodGroup}</p>
                  <p><strong>Address:</strong> {formatAddress(request.patientAddress)}</p>
                </div>

                <div className="doctor-info">
                  <h5>Requesting Doctor</h5>
                  <p><strong>Dr.</strong> {request.doctorInfo.name} {request.doctorInfo.lastName}</p>
                  <p><strong>Specialization:</strong> {request.doctorInfo.specialization}</p>
                  <p><strong>Address:</strong> {formatAddress(request.doctor)}</p>
                </div>

                <div className="test-info">
                  <h5>Test Details</h5>
                  <div className="test-description">
                    {request.testMessage}
                  </div>
                  {request.reportIPFS && (
                    <p>
                      <strong>Additional Documents:</strong>
                      <a href={`https://gateway.pinata.cloud/ipfs/${request.reportIPFS}`} 
                         target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="request-actions">
                <button 
                  onClick={() => setSelectedRequest(request)}
                  className="select-btn"
                >
                  Select for Upload
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Requests */}
      <div className="requests-section">
        <h3>Completed Test Requests ({completedRequests.length})</h3>
        
        <div className="requests-grid">
          {completedRequests.map(request => (
            <div key={`${request.patientAddress}-${request.index}`} className="request-card completed">
              <div className="request-header">
                <h4>Test Request</h4>
                <span className="status-badge completed">Completed</span>
              </div>

              <div className="request-details">
                <div className="patient-info">
                  <p><strong>Patient:</strong> {request.patientInfo.name} {request.patientInfo.lastName}</p>
                  <p><strong>Doctor:</strong> Dr. {request.doctorInfo.name} {request.doctorInfo.lastName}</p>
                  <p><strong>Test:</strong> {request.testMessage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {completedRequests.length === 0 && !loading && (
          <div className="no-requests">
            <p>No completed test requests yet.</p>
          </div>
        )}
      </div>

      <div className="lab-info">
        <h4>How the Lab Process Works:</h4>
        <ol>
          <li>Doctors request lab tests for their patients</li>
          <li>Patients approve the lab test requests</li>
          <li>Approved requests appear in your pending list</li>
          <li>Upload test results as image or PDF files</li>
          <li>Results are automatically added to patient's medical records</li>
          <li>Both patient and requesting doctor can access the results</li>
        </ol>
      </div>
    </div>
  );
};

export default LabDashboard;