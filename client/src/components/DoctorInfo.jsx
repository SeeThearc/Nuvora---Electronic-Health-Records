import React from 'react';

const DoctorInfo = ({ userData }) => {
  if (!userData) return <div>Loading doctor info...</div>;

  return (
    <div className="doctor-info">
      <div className="doctor-avatar-large">
        <div className="avatar-circle-large">
          {userData.name?.charAt(0)}{userData.lastName?.charAt(0)}
        </div>
        <div className="doctor-status">
          <span className="status-indicator"></span>
          <span>Online</span>
        </div>
      </div>

      <h3>Doctor Information</h3>
      <div className="info-card">
        <div className="info-item">
          <label>Name:</label>
          <span>Dr. {userData.name} {userData.lastName}</span>
        </div>
        <div className="info-item">
          <label>Age:</label>
          <span>{userData.age}</span>
        </div>
        <div className="info-item">
          <label>Gender:</label>
          <span>{userData.gender}</span>
        </div>
        <div className="info-item">
          <label>Blood Group:</label>
          <span>{userData.bloodGroup}</span>
        </div>
        <div className="info-item">
          <label>Specialization:</label>
          <span className="specialization-text">{userData.specialization}</span>
        </div>
        <div className="info-item">
          <label>Experience:</label>
          <span>{userData.yearsWorked} years</span>
        </div>
      </div>

      <div className="quick-stats">
        <h4>Quick Stats</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">--</span>
            <span className="stat-label">Total Patients</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">--</span>
            <span className="stat-label">Records Added</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorInfo;