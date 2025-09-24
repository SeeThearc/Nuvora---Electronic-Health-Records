import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const LabRequestsApproval = () => {
  const { state, acc, fetchJSONFromIPFS } = useData();
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    loadLabRequests();
  }, [state.contract, acc]);

  const loadLabRequests = async () => {
    if (!state.contract || !acc) return;

    try {
      setLoading(true);
      const requests = (await state.contract.getLabRequests(acc)) || [];
      const requestsWithDetails = [];

      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        try {
          // Doctor details
          const doctorData = await state.contract.getDoctorData(request?.doctor);
          let doctorInfo = { name: 'Unknown', lastName: 'Doctor', specialization: 'N/A' };
          if (doctorData?.exists && doctorData?.dataIPFShash) {
            try {
              const doctorIPFS = await fetchJSONFromIPFS(doctorData.dataIPFShash) || {};
              doctorInfo = { ...doctorIPFS, specialization: doctorData.specialization || 'N/A' };
            } catch (error) {
              console.log('Error fetching doctor IPFS data:', error);
            }
          }

          // Lab details
          let labData = null;
          if (state.contract && typeof state.contract.getLabData === 'function') {
            labData = await state.contract.getLabData(request?.lab);
          }

          let labInfo = { labName: 'Unknown Lab' };
          if (labData?.exists && labData?.dataIPFShash) {
            try {
              const labIPFS = await fetchJSONFromIPFS(labData.dataIPFShash) || {};
              labInfo = { ...labIPFS, labName: labData.labName || 'Unknown Lab' };
            } catch (error) {
              console.log('Error fetching lab IPFS data:', error);
              labInfo.labName = labData.labName || 'Unknown Lab';
            }
          }

          requestsWithDetails.push({
            ...request,
            index: i,
            doctorInfo,
            labInfo,
            requestDate: new Date().toISOString() // fallback date
          });
        } catch (error) {
          console.error(`Error processing request ${i}:`, error);
        }
      }

      setLabRequests(requestsWithDetails);
      setLoading(false);
    } catch (error) {
      console.error("Error loading lab requests:", error);
      setLoading(false);
    }
  };

  const approveRequest = async (requestIndex, doctorName, labName) => {
    const confirmApproval = window.confirm(
      `Are you sure you want to approve this lab test request?\n\n` +
      `Doctor: Dr. ${doctorName}\n` +
      `Laboratory: ${labName}\n\n` +
      `This will allow the lab to access your relevant medical data for testing.`
    );

    if (!confirmApproval) return;

    try {
      setApproving(requestIndex);
      const tx = await state.contract.approveLabRequest(requestIndex);
      await tx.wait();

      alert('Lab request approved successfully!');
      await loadLabRequests(); // refresh list
      setApproving(null);
    } catch (error) {
      console.error("Error approving lab request:", error);
      alert('Failed to approve lab request. Please try again.');
      setApproving(null);
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const getStatusBadge = (request) => {
    if (request.completed) {
      return <span className="status-badge completed">Completed</span>;
    } else if (request.patientApproved) {
      return <span className="status-badge approved">Approved - Pending Lab Results</span>;
    } else {
      return <span className="status-badge pending">Pending Your Approval</span>;
    }
  };

  const pendingRequests = labRequests.filter(req => !req.patientApproved && !req.completed);
  const approvedRequests = labRequests.filter(req => req.patientApproved);

  return (
    <div className="lab-requests-approval">
      <div className="requests-header">
        <h3>Lab Test Requests</h3>
        <button onClick={loadLabRequests} className="refresh-btn" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your lab requests...</p>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="requests-section">
          <h4>Pending Approval ({pendingRequests.length})</h4>
          <div className="requests-list">
            {pendingRequests.map(request => (
              <div key={request.index} className="request-card pending-request">
                <div className="request-header">
                  <h5>Lab Test Request</h5>
                  {getStatusBadge(request)}
                </div>
                <div className="request-details">
                  <div className="detail-row">
                    <strong>Requested by:</strong> Dr. {request.doctorInfo.name} {request.doctorInfo.lastName}
                  </div>
                  <div className="detail-row">
                    <strong>Specialization:</strong> {request.doctorInfo.specialization}
                  </div>
                  <div className="detail-row">
                    <strong>Laboratory:</strong> {request.labInfo.labName}
                  </div>
                  <div className="detail-row">
                    <strong>Test Description:</strong>
                    <div className="test-description">{request.testMessage}</div>
                  </div>
                  {request.reportIPFS && (
                    <div className="detail-row">
                      <strong>Additional Documents:</strong>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${request.reportIPFS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                  <div className="detail-row">
                    <strong>Doctor Address:</strong> {formatAddress(request.doctor)}
                  </div>
                  <div className="detail-row">
                    <strong>Lab Address:</strong> {formatAddress(request.lab)}
                  </div>
                </div>

                <div className="request-actions">
                  <button
                    onClick={() =>
                      approveRequest(
                        request.index,
                        `${request.doctorInfo.name} ${request.doctorInfo.lastName}`,
                        request.labInfo.labName
                      )
                    }
                    className="approve-btn"
                    disabled={approving === request.index}
                  >
                    {approving === request.index ? (
                      <>
                        <span className="spinner"></span>
                        Approving...
                      </>
                    ) : (
                      'Approve Request'
                    )}
                  </button>
                </div>

                <div className="approval-info">
                  <h6>What happens when you approve:</h6>
                  <ul>
                    <li>The laboratory will gain access to your relevant medical records</li>
                    <li>They can perform the requested tests</li>
                    <li>Test results will be added to your medical records</li>
                    <li>Your doctor will be able to view the results</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved/Completed Requests */}
      {approvedRequests.length > 0 && (
        <div className="requests-section">
          <h4>Approved Requests ({approvedRequests.length})</h4>
          <div className="requests-list">
            {approvedRequests.map(request => (
              <div key={request.index} className="request-card approved-request">
                <div className="request-header">
                  <h5>Lab Test Request</h5>
                  {getStatusBadge(request)}
                </div>
                <div className="request-details">
                  <div className="detail-row">
                    <strong>Doctor:</strong> Dr. {request.doctorInfo.name} {request.doctorInfo.lastName}
                  </div>
                  <div className="detail-row">
                    <strong>Laboratory:</strong> {request.labInfo.labName}
                  </div>
                  <div className="detail-row">
                    <strong>Test:</strong> {request.testMessage}
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong>
                    {request.completed ? (
                      <span className="completed-text">
                        Test completed - Results available in your medical records
                      </span>
                    ) : (
                      <span className="pending-text">Waiting for lab to upload results</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {labRequests.length === 0 && !loading && (
        <div className="no-requests">
          <div className="no-requests-icon">🧪</div>
          <h4>No lab requests</h4>
          <p>You don't have any lab test requests yet.</p>
          <p>When doctors request lab tests for you, they will appear here for your approval.</p>
        </div>
      )}
    </div>
  );
};

export default LabRequestsApproval;
