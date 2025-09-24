import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const RequestLabTest = ({ selectedPatient }) => {
  const { state, fetchJSONFromIPFS } = useData();
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [reportIPFS, setReportIPFS] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLabs();
  }, [state.contract]);

  const loadLabs = async () => {
    if (!state.contract) return;
    
    try {
      setLoading(true);
      // Get all lab addresses - you'll need to add this function to your contract
      const labAddresses = await state.contract.getAllLabAddresses();
      const labData = [];

      for (const address of labAddresses) {
        try {
          const labInfo = await state.contract.getLabData(address);
          if (labInfo.exists) {
            const ipfsData = await fetchJSONFromIPFS(labInfo.dataIPFShash);
            labData.push({
              address,
              labName: labInfo.labName,
              ...ipfsData
            });
            console.log(labInfo.walletAddress);
          }
        } catch (error) {
          console.log(`Error loading lab ${address}:`, error);
        }
      }

      setLabs(labData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading labs:", error);
      setLoading(false);
    }
  };

  const requestTest = async () => {
    if (!selectedPatient || !selectedLab || !testMessage.trim()) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const selectedLabData = labs.find(l => l.address === selectedLab);
      const labWalletAddress = selectedLabData?.walletAddress;
      const tx = await state.contract.requestLabTest(
        selectedPatient,
        labWalletAddress,
        reportIPFS,
        testMessage
      );
      await tx.wait();
      
      alert('Lab test requested successfully! Patient will be notified to approve the request.');
      
      // Reset form
      setSelectedLab('');
      setTestMessage('');
      setReportIPFS('');
      setLoading(false);
    } catch (error) {
      console.error("Error requesting lab test:", error);
      alert('Failed to request lab test. Please try again.');
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  if (!selectedPatient) {
    return (
      <div className="request-lab-test">
        <div className="no-patient-selected">
          <h3>No Patient Selected</h3>
          <p>Please select a patient from the "My Patients" tab first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="request-lab-test">
      <h3>Request Lab Test</h3>
      <p>Patient: {formatAddress(selectedPatient)}</p>
      
      <div className="request-form">
        <div className="form-group">
          <label>Select Laboratory *:</label>
          <select 
            value={selectedLab} 
            onChange={(e) => setSelectedLab(e.target.value)}
            required
          >
            <option value="">Choose a laboratory</option>
            {labs.map(lab => (
              <option key={lab.address} value={lab.address}>
                {lab.labName} - {formatAddress(lab.address)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Test Description *:</label>
          <textarea
            placeholder="Describe the test required (e.g., Complete Blood Count, Lipid Profile, X-Ray Chest, etc.)"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            rows={4}
            required
          />
          <small>{testMessage.length}/500 characters</small>
        </div>

        <div className="form-group">
          <label>Report IPFS Hash (Optional):</label>
          <input
            type="text"
            placeholder="IPFS hash of any related documents"
            value={reportIPFS}
            onChange={(e) => setReportIPFS(e.target.value)}
          />
        </div>

        <button 
          onClick={requestTest} 
          disabled={!selectedLab || !testMessage.trim() || loading}
          className="request-btn"
        >
          {loading ? 'Requesting...' : 'Request Lab Test'}
        </button>
      </div>

      <div className="available-labs">
        <h4>Available Laboratories ({labs.length})</h4>
        <div className="labs-list">
          {labs.map(lab => (
            <div key={lab.address} className="lab-card">
              <div className="lab-info">
                <h5>{lab.labName}</h5>
                <p><strong>Services:</strong> {lab.services || 'General laboratory services'}</p>
                <p><strong>Address:</strong> {lab.address ? formatAddress(lab.address) : 'N/A'}</p>
                <p><strong>Phone:</strong> {lab.phone || 'N/A'}</p>
                {lab.operatingHours && (
                  <p><strong>Hours:</strong> {lab.operatingHours}</p>
                )}
              </div>
              <button 
                onClick={() => setSelectedLab(lab.address)}
                className="select-lab-btn"
              >
                Select This Lab
              </button>
            </div>
          ))}
        </div>
      </div>

      {labs.length === 0 && !loading && (
        <div className="no-labs">
          <h4>No laboratories available</h4>
          <p>There are no registered laboratories in the system yet.</p>
        </div>
      )}

      <div className="request-info">
        <h4>How Lab Test Requests Work:</h4>
        <ol>
          <li>Select a laboratory and describe the required test</li>
          <li>Patient will receive a notification to approve the request</li>
          <li>Once approved, the lab can access patient data and perform the test</li>
          <li>Lab will upload the test results to the patient's medical records</li>
        </ol>
      </div>
    </div>
  );
};

export default RequestLabTest;