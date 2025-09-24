import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import PatientInfo from '../components/PatientInfo';
import GrantAccess from '../components/GrantAccess';
import AllowedDoctors from '../components/AllowedDoctors';
import ChatWithDoctor from '../components/ChatWithDoctor';
import UploadMedicalRecord from '../components/UploadMedicalRecord';
import MedicalRecords from '../components/MedicalRecords';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const { state, acc, userData, userType } = useData();
  const [activeTab, setActiveTab] = useState('grant');

  if (userType !== 'patient') {
    return <div className="dashboard-error">Please register as a patient first</div>;
  }

  return (
    <div className="patient-dashboard">
      <div className="dashboard-header">
        <h1>Patient Dashboard</h1>
        <p>Welcome, {userData?.name} {userData?.lastName}</p>
      </div>

      <div className="dashboard-content">
        {/* Left Sidebar - Patient Info */}
        <div className="sidebar">
          <PatientInfo userData={userData} />
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="tab-navigation">
            <button 
              className={activeTab === 'grant' ? 'active' : ''} 
              onClick={() => setActiveTab('grant')}
            >
              Grant Access
            </button>
            <button 
              className={activeTab === 'doctors' ? 'active' : ''} 
              onClick={() => setActiveTab('doctors')}
            >
              Allowed Doctors
            </button>
            <button 
              className={activeTab === 'chat' ? 'active' : ''} 
              onClick={() => setActiveTab('chat')}
            >
              Chat with Doctors
            </button>
            <button 
              className={activeTab === 'upload' ? 'active' : ''} 
              onClick={() => setActiveTab('upload')}
            >
              Upload Records
            </button>
            <button 
              className={activeTab === 'records' ? 'active' : ''} 
              onClick={() => setActiveTab('records')}
            >
              Medical Records
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'grant' && <GrantAccess />}
            {activeTab === 'doctors' && <AllowedDoctors />}
            {activeTab === 'chat' && <ChatWithDoctor />}
            {activeTab === 'upload' && <UploadMedicalRecord />}
            {activeTab === 'records' && <MedicalRecords />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;