import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

const RegisterLab = () => {
  const { state, uploadJSONToIPFS, acc, loading, setLoading } = useData();
  const navigate = useNavigate();
  
  const [labForm, setLabForm] = useState({
    labName: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
    accreditation: '',
    services: '',
    operatingHours: '',
    contactPerson: '',
    website: ''
  });

  const registerLab = async (labData) => {
    try {
      if (!state.contract) {
        alert("Please connect your wallet first");
        return false;
      }
      const ipfsHash = await uploadJSONToIPFS(labData);
      const tx = await state.contract.registerLab(ipfsHash, labData.labName);
      
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Register Lab Failed:", error.message);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (acc === "Not connected") {
      alert("Please connect your wallet first");
      return;
    }

    const labData = {
      ...labForm,
      registrationType: 'lab',
      walletAddress: acc,
      registrationDate: new Date().toISOString()
    };

    const success = await registerLab(labData);
    if (success) {
      alert("Lab registered successfully!");
      navigate('/lab-dashboard');
    } else {
      alert("Failed to register lab. Please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Register as Laboratory</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input 
            type="text" 
            required 
            placeholder="Laboratory Name" 
            value={labForm.labName}
            onChange={e => setLabForm({...labForm, labName: e.target.value})} 
          />
          <input 
            type="text" 
            required 
            placeholder="License Number" 
            value={labForm.licenseNumber}
            onChange={e => setLabForm({...labForm, licenseNumber: e.target.value})} 
          />
        </div>

        <textarea 
          required 
          placeholder="Laboratory Address" 
          value={labForm.address}
          onChange={e => setLabForm({...labForm, address: e.target.value})} 
        />

        <div className="form-row">
          <input 
            type="tel" 
            required 
            placeholder="Phone Number" 
            value={labForm.phone}
            onChange={e => setLabForm({...labForm, phone: e.target.value})} 
          />
          <input 
            type="email" 
            required 
            placeholder="Email Address" 
            value={labForm.email}
            onChange={e => setLabForm({...labForm, email: e.target.value})} 
          />
        </div>

        <div className="form-row">
          <input 
            type="text" 
            placeholder="Accreditation (e.g., CAP, CLIA)" 
            value={labForm.accreditation}
            onChange={e => setLabForm({...labForm, accreditation: e.target.value})} 
          />
          <input 
            type="text" 
            placeholder="Contact Person" 
            value={labForm.contactPerson}
            onChange={e => setLabForm({...labForm, contactPerson: e.target.value})} 
          />
        </div>

        <textarea 
          placeholder="Services Offered (e.g., Blood tests, Imaging, Pathology)" 
          value={labForm.services}
          onChange={e => setLabForm({...labForm, services: e.target.value})} 
        />

        <div className="form-row">
          <input 
            type="text" 
            placeholder="Operating Hours" 
            value={labForm.operatingHours}
            onChange={e => setLabForm({...labForm, operatingHours: e.target.value})} 
          />
          <input 
            type="url" 
            placeholder="Website (optional)" 
            value={labForm.website}
            onChange={e => setLabForm({...labForm, website: e.target.value})} 
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Registering...' : 'Register Laboratory'}
        </button>
      </form>
    </div>
  );
};

export default RegisterLab;