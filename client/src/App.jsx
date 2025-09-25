import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Home from './components/Home';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Register from './components/Register';
import Login from './components/Login';
import Logs from './components/Logs';
import RegisterLab from "./components/RegisterLab";
import LabDashboard from "./components/LabDashboard";
import ContractTransactions from './pages/ContractTransactions';
import './index.css';

function App() {
  return (
    <DataProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/logs" element={<Logs />} />
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/register-lab" element={<RegisterLab />} />
            <Route path="/lab-dashboard" element={<LabDashboard />} />
            <Route path='/exploblock' element={<ContractTransactions />} />
          </Routes>
        </Layout>
      </Router>
    </DataProvider>
  );
}

export default App;