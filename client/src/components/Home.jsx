import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

const Home = () => {
  const { acc, userType } = useData();

  return (
    <div className="home-container">
      <h1 className="home-title">Electronic Health Records System</h1>
      <p className="home-desc">
        Secure, decentralized healthcare data management using blockchain and IPFS.
      </p>
      {acc === "Not connected" ? (
        <p>Connect your wallet to get started</p>
      ) : (
        <>
          <p className="wallet-status">Wallet: {acc.slice(0, 6)}...{acc.slice(-4)}</p>
          {userType ? (
            <Link to={`/${userType}-dashboard`} className="btn btn-primary">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">Register</Link>
              <Link to="/login" className="btn btn-secondary">Login</Link>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Home;