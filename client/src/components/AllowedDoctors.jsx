import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const AllowedDoctors = () => {
  const { state, acc, fetchJSONFromIPFS } = useData();
  const [allowedDoctors, setAllowedDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(null); // Track which doctor is being revoked

  useEffect(() => {
    loadAllowedDoctors();
  }, [state.contract]);

  const loadAllowedDoctors = async () => {
    if (!state.contract) return;

    try {
      setLoading(true);
      const doctorAddresses = await state.contract.getAllowedDoctors(acc);
      const doctorData = [];

      for (const address of doctorAddresses) {
        try {
          const doctor = await state.contract.getDoctorData(address);
          if (doctor.exists) {
            const ipfsData = await fetchJSONFromIPFS(doctor.dataIPFShash);
            doctorData.push({
              address,
              specialization: doctor.specialization,
              ...ipfsData
            });
          }
        } catch (error) {
          console.log(`Error loading doctor ${address}:`, error);
        }
      }

      setAllowedDoctors(doctorData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading allowed doctors:", error);
      setLoading(false);
    }
  };

  const revokeAccess = async (doctorAddress, doctorName) => {
    // Confirmation dialog
    const confirmRevoke = window.confirm(
      `Are you sure you want to revoke access for Dr. ${doctorName}?\n\nThis will:\n- Remove their access to your medical records\n- Delete your chat history with them\n- Prevent them from viewing your future medical data\n\nThis action cannot be undone.`
    );

    if (!confirmRevoke) return;

    try {
      setRevoking(doctorAddress);
      const tx = await state.contract.revokeAccess(doctorAddress);
      await tx.wait();
      
      alert(`Access revoked successfully for Dr. ${doctorName}!`);
      
      // Reload the list to reflect changes
      await loadAllowedDoctors();
      setRevoking(null);
    } catch (error) {
      console.error("Error revoking access:", error);
      alert(`Error revoking access for Dr. ${doctorName}. Please try again.`);
      setRevoking(null);
    }
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="allowed-doctors">
      <div className="header-section">
        <h3>Allowed Doctors ({allowedDoctors.length})</h3>
        <button 
          onClick={loadAllowedDoctors} 
          className="refresh-btn"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your allowed doctors...</p>
        </div>
      )}
      
      <div className="doctors-list">
        {allowedDoctors.map(doctor => (
          <div key={doctor.address} className="doctor-card">
            <div className="doctor-avatar">
              <div className="avatar-circle">
                {doctor.name?.charAt(0)}{doctor.lastName?.charAt(0)}
              </div>
            </div>
            
            <div className="doctor-info">
              <h4>Dr. {doctor.name} {doctor.lastName}</h4>
              <p className="specialization">
                <strong>Specialization:</strong> {doctor.specialization}
              </p>
              <p className="experience">
                <strong>Experience:</strong> {doctor.yearsWorked} years
              </p>
              <p className="address">
                <strong>Address:</strong> 
                <span className="address-text" title={doctor.address}>
                  {formatAddress(doctor.address)}
                </span>
                <button 
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(doctor.address)}
                  title="Copy full address"
                >
                  📋
                </button>
              </p>
            </div>
            
            <div className="doctor-actions">
              <button 
                onClick={() => revokeAccess(doctor.address, `${doctor.name} ${doctor.lastName}`)}
                className="revoke-btn"
                disabled={loading || revoking === doctor.address}
              >
                {revoking === doctor.address ? (
                  <>
                    <span className="spinner"></span>
                    Revoking...
                  </>
                ) : (
                  <>
                    <span className="revoke-icon">🚫</span>
                    Revoke Access
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {allowedDoctors.length === 0 && !loading && (
        <div className="no-doctors">
          <div className="no-doctors-icon">👨‍⚕️</div>
          <h4>No doctors have access yet</h4>
          <p>You haven't granted access to any doctors yet.</p>
          <p>Use the "Grant Access" tab to allow doctors to view your medical records.</p>
        </div>
      )}
    </div>
  );
};

export default AllowedDoctors;