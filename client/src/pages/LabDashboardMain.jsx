import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import LabInfo from '../components/LabInfo';
import LabDashboard from '../components/LabDashboard'; // Rename the main component to LabTestManagement

const LabDashboardMain = () => {
  const { userData, userType, acc } = useData();
  const [activeTab, setActiveTab] = useState('lab-info');

  if (userType !== 'lab') {
    return <div>Access denied. Please register as a laboratory.</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-tabs">
        <button 
          onClick={() => setActiveTab('lab-info')} 
          className={activeTab === 'lab-info' ? 'tab-active' : ''}
        >
          Lab Information
        </button>
        <button 
          onClick={() => setActiveTab('test-management')} 
          className={activeTab === 'test-management' ? 'tab-active' : ''}
        >
          Test Management
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'lab-info' && <LabInfo userData={userData} />}
        {activeTab === 'test-management' && <LabDashboard />}
      </div>
    </div>
  );
};

export default LabDashboardMain;