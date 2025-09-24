import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const Login = () => {
  const { acc, userType, connectWallet } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (acc !== "Not connected" && userType) {
      if (userType === 'lab') {
        navigate('/lab-dashboard');
      } else {
        navigate(`/${userType}-dashboard`);
      }
    }
  }, [acc, userType, navigate]);

  return (
    <div className="form-container">
      <h2 className="form-title">Login</h2>
      {acc === "Not connected" ? (
        <>
          <p>Connect your wallet to login</p>
          <button onClick={connectWallet} className="btn btn-primary">Connect Wallet</button>
        </>
      ) : (
        <>
          <p className="wallet-status">Wallet: {acc.slice(0, 6)}...{acc.slice(-4)}</p>
          {userType ? (
            <p>Redirecting...</p>
          ) : (
            <>
              <p>You don't seem to be registered yet.</p>
              <button onClick={() => navigate('/register')} className="btn btn-primary">Register Now</button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Login;
