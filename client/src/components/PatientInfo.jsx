import React from 'react';
import { useData } from '../context/DataContext';

const PatientInfo = ({ userData }) => {
  const { acc } = useData();

  if (!userData) {
    return (
      <div className="patient-info">
        <h3>Patient Information</h3>
        <p>Loading patient data...</p>
      </div>
    );
  }

  const formatAddress = (address) => {
    if (!address) return 'Not connected';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <div className="patient-info">
      {/* Patient Avatar and Status */}
      <div className="patient-avatar-large">
        <div className="avatar-circle-large">
          {userData.name?.charAt(0)}{userData.lastName?.charAt(0)}
        </div>
        <div className="patient-status">
          <div className="status-indicator"></div>
          <span>Online</span>
        </div>
      </div>

      <h3>Patient Information</h3>
      
      {/* Patient Details Card */}
      <div className="info-card">
        <div className="info-item">
          <label>Full Name:</label>
          <span>{userData.name} {userData.lastName}</span>
        </div>
        <div className="info-item">
          <label>Age:</label>
          <span>{userData.age} years</span>
        </div>
        <div className="info-item">
          <label>Gender:</label>
          <span>{userData.gender}</span>
        </div>
        <div className="info-item">
          <label>Blood Group:</label>
          <span className="blood-group-text">{userData.bloodGroup}</span>
        </div>
        <div className="info-item">
          <label>Phone:</label>
          <span>{userData.phone || 'Not provided'}</span>
        </div>
        <div className="info-item">
          <label>Email:</label>
          <span>{userData.email || 'Not provided'}</span>
        </div>
        <div className="info-item">
          <label>Address:</label>
          <span className="wallet-address">{formatAddress(acc)}</span>
        </div>
      </div>
    </div>
  );
};

export default PatientInfo;