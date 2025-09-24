import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import DoctorInfo from '../components/DoctorInfo';
import PatientList from '../components/PatientList';
import PatientMedicalRecords from '../components/PatientMedicalRecords';
import UploadPatientRecord from '../components/UploadPatientRecord';
import ChatWithPatient from '../components/ChatWithPatient';
import RequestLabTest from '../components/RequestLabTest';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { state, acc, userData, userType } = useData();
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState(null);

  if (userType !== 'doctor') {
    return <div className="dashboard-error">Please register as a doctor first</div>;
  }

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <p>Welcome, Dr. {userData?.name} {userData?.lastName}</p>
        <span className="specialization-badge">{userData?.specialization}</span>
      </div>

      <div className="dashboard-content">
        {/* Left Sidebar - Doctor Info */}
        <div className="sidebar">
          <DoctorInfo userData={userData} />
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="tab-navigation">
            <button 
              className={activeTab === 'patients' ? 'active' : ''} 
              onClick={() => setActiveTab('patients')}
            >
              My Patients
            </button>
            <button 
              className={activeTab === 'records' ? 'active' : ''} 
              onClick={() => setActiveTab('records')}
              disabled={!selectedPatient}
            >
              Medical Records
            </button>
            <button 
              className={activeTab === 'upload' ? 'active' : ''} 
              onClick={() => setActiveTab('upload')}
              disabled={!selectedPatient}
            >
              Upload Records
            </button>
            <button 
              className={activeTab === 'chat' ? 'active' : ''} 
              onClick={() => setActiveTab('chat')}
              disabled={!selectedPatient}
            >
              Chat with Patient
            </button>
            <button 
              className={activeTab === 'request-lab-test' ? 'active' : ''} 
              onClick={() => setActiveTab('request-lab-test')}
              disabled={!selectedPatient}
            >
              Request Lab Test
            </button>
          </div>

          {/* Patient Selection Bar */}
          {selectedPatient && (
            <div className="selected-patient-bar">
              <span>Selected Patient: </span>
              <strong>{formatAddress(selectedPatient)}</strong>
              <button 
                onClick={() => {
                  setSelectedPatient(null);
                  setActiveTab('patients');
                }}
                className="clear-selection-btn"
              >
                Clear Selection
              </button>
            </div>
          )}

          <div className="tab-content">
            {activeTab === 'patients' && (
              <PatientList 
                selectedPatient={selectedPatient}
                setSelectedPatient={setSelectedPatient}
              />
            )}
            {activeTab === 'records' && selectedPatient && (
              <PatientMedicalRecords 
                key={selectedPatient}
                patientAddress={selectedPatient} 
              />
            )}
            {activeTab === 'upload' && selectedPatient && (
              <UploadPatientRecord 
                key={selectedPatient}
                patientAddress={selectedPatient} 
              />
            )}
            {activeTab === 'chat' && selectedPatient && (
              <ChatWithPatient 
                key={selectedPatient}
                patientAddress={selectedPatient} 
              />
            )}
            {activeTab === 'request-lab-test' && selectedPatient && (
              <RequestLabTest selectedPatient={selectedPatient} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
