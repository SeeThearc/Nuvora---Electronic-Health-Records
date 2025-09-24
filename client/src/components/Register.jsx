import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import RegisterLab from './RegisterLab';

const Register = () => {
  const { registerPatient, registerDoctor, loading, acc } = useData();
  const navigate = useNavigate();
  const [registrationType, setRegistrationType] = useState('patient');

  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    bloodGroup: '',
    allergies: '',
    address: '',
    phone: '',
    email: ''
  });

  const [doctorForm, setDoctorForm] = useState({
    firstName: '',
    lastName: '',
    specialization: '',
    yearsOfExperience: '',
    medicalLicense: '',
    hospital: '',
    phone: '',
    email: ''
  });

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    if (acc === "Not connected") {
      alert("Please connect your wallet first");
      return;
    }
    const patientData = {
      ...patientForm,
      registrationType: 'patient',
      walletAddress: acc,
      registrationDate: new Date().toISOString()
    };
    const success = await registerPatient(patientData);
    if (success) navigate('/patient-dashboard');
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    if (acc === "Not connected") {
      alert("Please connect your wallet first");
      return;
    }
    const doctorData = {
      ...doctorForm,
      registrationType: 'doctor',
      walletAddress: acc,
      registrationDate: new Date().toISOString()
    };
    const success = await registerDoctor(doctorData);
    if (success) navigate('/doctor-dashboard');
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Register</h2>
      <div className="form-tabs">
        <button
          onClick={() => setRegistrationType('patient')}
          className={registrationType === 'patient' ? 'tab-active' : ''}
        >Register as Patient</button>
        <button
          onClick={() => setRegistrationType('doctor')}
          className={registrationType === 'doctor' ? 'tab-active' : ''}
        >Register as Doctor</button>
        <button
          onClick={() => setRegistrationType('lab')}
          className={registrationType === 'lab' ? 'tab-active' : ''}
        >Register as Laboratory</button>
      </div>
      {registrationType === 'patient' && (
  <form onSubmit={handlePatientSubmit}>
    <div className="form-row">
      <input
        type="text"
        required
        placeholder="First Name"
        value={patientForm.firstName}
        onChange={e => setPatientForm({ ...patientForm, firstName: e.target.value })}
      />
      <input
        type="text"
        required
        placeholder="Last Name"
        value={patientForm.lastName}
        onChange={e => setPatientForm({ ...patientForm, lastName: e.target.value })}
      />
    </div>
    <div className="form-row">
      <input
        type="number"
        required
        placeholder="Age"
        value={patientForm.age}
        onChange={e => setPatientForm({ ...patientForm, age: e.target.value })}
      />
      <select
        required
        value={patientForm.gender}
        onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
      >
        <option value="">Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
      <select
        required
        value={patientForm.bloodGroup}
        onChange={e => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
      >
        <option value="">Blood Group</option>
        <option>A+</option>
        <option>A-</option>
        <option>B+</option>
        <option>B-</option>
        <option>AB+</option>
        <option>AB-</option>
        <option>O+</option>
        <option>O-</option>
      </select>
    </div>
    <textarea
      placeholder="Allergies (if any)"
      value={patientForm.allergies}
      onChange={e => setPatientForm({ ...patientForm, allergies: e.target.value })}
    />
    <textarea
      required
      placeholder="Address"
      value={patientForm.address}
      onChange={e => setPatientForm({ ...patientForm, address: e.target.value })}
    />
    <div className="form-row">
      <input
        type="tel"
        required
        placeholder="Phone"
        value={patientForm.phone}
        onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })}
      />
      <input
        type="email"
        required
        placeholder="Email"
        value={patientForm.email}
        onChange={e => setPatientForm({ ...patientForm, email: e.target.value })}
      />
    </div>
    <button type="submit" disabled={loading} className="btn btn-primary">
      {loading ? 'Registering...' : 'Register as Patient'}
    </button>
  </form>
)}

{registrationType === 'doctor' && (
  <form onSubmit={handleDoctorSubmit}>
    <div className="form-row">
      <input
        type="text"
        required
        placeholder="First Name"
        value={doctorForm.firstName}
        onChange={e => setDoctorForm({ ...doctorForm, firstName: e.target.value })}
      />
      <input
        type="text"
        required
        placeholder="Last Name"
        value={doctorForm.lastName}
        onChange={e => setDoctorForm({ ...doctorForm, lastName: e.target.value })}
      />
    </div>
    <div className="form-row">
      <select
        required
        value={doctorForm.specialization}
        onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
      >
        <option value="">Specialization</option>
        <option>General Medicine</option>
        <option>Cardiology</option>
        <option>Neurology</option>
        <option>Orthopedics</option>
        <option>Pediatrics</option>
        <option>Dermatology</option>
        <option>Psychiatry</option>
        <option>Surgery</option>
      </select>
      <input
        type="number"
        required
        placeholder="Years of Experience"
        value={doctorForm.yearsOfExperience}
        onChange={e => setDoctorForm({ ...doctorForm, yearsOfExperience: e.target.value })}
      />
    </div>
    <input
      type="text"
      required
      placeholder="Medical License Number"
      value={doctorForm.medicalLicense}
      onChange={e => setDoctorForm({ ...doctorForm, medicalLicense: e.target.value })}
    />
    <input
      type="text"
      required
      placeholder="Hospital/Clinic"
      value={doctorForm.hospital}
      onChange={e => setDoctorForm({ ...doctorForm, hospital: e.target.value })}
    />
    <div className="form-row">
      <input
        type="tel"
        required
        placeholder="Phone"
        value={doctorForm.phone}
        onChange={e => setDoctorForm({ ...doctorForm, phone: e.target.value })}
      />
      <input
        type="email"
        required
        placeholder="Email"
        value={doctorForm.email}
        onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
      />
    </div>
    <button type="submit" disabled={loading} className="btn btn-primary">
      {loading ? 'Registering...' : 'Register as Doctor'}
    </button>
  </form>
)}

{registrationType === 'lab' && <RegisterLab />}

    </div>
  );
};

export default Register;