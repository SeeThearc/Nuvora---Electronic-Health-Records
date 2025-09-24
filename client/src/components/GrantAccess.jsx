import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const GrantAccess = () => {
  const { state, getAllDoctors } = useData();
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, [state.contract]);

  useEffect(() => {
    filterDoctors();
  }, [selectedSpecialization, searchTerm, doctors]);

  const loadDoctors = async () => {
    if (!state.contract) return;
    
    try {
      setLoading(true);
      const doctorData = await getAllDoctors();
      const specs = new Set();

      doctorData.forEach(doctor => {
        specs.add(doctor.specialization);
      });

      setDoctors(doctorData);
      setSpecializations([...specs]);
      setLoading(false);
    } catch (error) {
      console.error("Error loading doctors:", error);
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (selectedSpecialization) {
      filtered = filtered.filter(doc => doc.specialization === selectedSpecialization);
    }

    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const grantAccess = async () => {
    if (!selectedDoctor || !state.contract) return;

    try {
      setLoading(true);
      const tx = await state.contract.grantAccess(selectedDoctor);
      await tx.wait();
      alert('Access granted successfully!');
      setSelectedDoctor('');
      setLoading(false);
    } catch (error) {
      console.error("Error granting access:", error);
      alert('Error granting access');
      setLoading(false);
    }
  };

  return (
    <div className="grant-access">
      <h3>Grant Access to Doctors</h3>
      
      <div className="access-form">
        <div className="form-group">
          <label>Select Specialization:</label>
          <select 
            value={selectedSpecialization} 
            onChange={(e) => setSelectedSpecialization(e.target.value)}
          >
            <option value="">All Specializations</option>
            {specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Search Doctors:</label>
          <input
            type="text"
            placeholder="Search by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Select Doctor:</label>
          <select 
            value={selectedDoctor} 
            onChange={(e) => setSelectedDoctor(e.target.value)}
          >
            <option value="">Select a doctor</option>
            {filteredDoctors.map(doctor => (
              <option key={doctor.address} value={doctor.address}>
                Dr. {doctor.name} {doctor.lastName} - {doctor.specialization} ({doctor.address.substring(0, 10)}...)
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={grantAccess} 
          disabled={!selectedDoctor || loading}
          className="grant-btn"
        >
          {loading ? 'Granting Access...' : 'Grant Access'}
        </button>
      </div>

      <div className="manual-address">
        <h4>Or Enter Doctor Address Manually:</h4>
        <input
          type="text"
          placeholder="Enter doctor's wallet address"
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
        />
      </div>
    </div>
  );
};

export default GrantAccess;