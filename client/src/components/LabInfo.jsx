import React from 'react';
import { useData } from '../context/DataContext';

const LabInfo = ({ userData }) => {
  const { acc } = useData();

  if (!userData) {
    return (
      <div className="lab-info">
        <h3>Laboratory Information</h3>
        <p>Loading laboratory data...</p>
      </div>
    );
  }

  const formatAddress = (address) => {
    if (!address) return 'Not connected';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <div className="lab-info">
      {/* Lab Avatar and Status */}
      <div className="lab-avatar-large">
        <div className="avatar-circle-large">
          {userData.labName?.charAt(0)}{userData.labName?.charAt(1)}
        </div>
        <div className="lab-status">
          <div className="status-indicator"></div>
          <span>Online</span>
        </div>
      </div>

      <h3>Laboratory Information</h3>
      
      {/* Lab Details Card */}
      <div className="info-card">
        <div className="info-item">
          <label>Laboratory Name:</label>
          <span>{userData.labName}</span>
        </div>
        <div className="info-item">
          <label>License Number:</label>
          <span>{userData.licenseNumber || 'Not provided'}</span>
        </div>
        <div className="info-item">
          <label>Accreditation:</label>
          <span>{userData.accreditation || 'Not specified'}</span>
        </div>
        <div className="info-item">
          <label>Contact Person:</label>
          <span>{userData.contactPerson || 'Not provided'}</span>
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
          <label>Website:</label>
          <span>
            {userData.website ? (
              <a href={userData.website} target="_blank" rel="noopener noreferrer">
                {userData.website}
              </a>
            ) : (
              'Not provided'
            )}
          </span>
        </div>
        <div className="info-item">
          <label>Operating Hours:</label>
          <span>{userData.operatingHours || 'Not specified'}</span>
        </div>
        <div className="info-item">
          <label>Wallet Address:</label>
          <span className="wallet-address">{formatAddress(acc)}</span>
        </div>
      </div>

      {/* Services Section */}
      <div className="services-card">
        <h4>Services Offered</h4>
        <div className="services-content">
          {userData.services ? (
            <p>{userData.services}</p>
          ) : (
            <p>No services specified</p>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className="address-card">
        <h4>Laboratory Address</h4>
        <div className="address-content">
          {userData.address ? (
            <p>{userData.address}</p>
          ) : (
            <p>No address provided</p>
          )}
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="quick-stats">
        <h4>Quick Stats</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">--</span>
            <span className="stat-label">Pending Requests</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">--</span>
            <span className="stat-label">Completed Tests</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">--</span>
            <span className="stat-label">Total Patients</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabInfo;