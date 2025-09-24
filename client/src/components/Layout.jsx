import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => {
  const { acc, connectWallet, userType } = useData();

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" className="navbar-title">Nuvora</Link>
        </div>
        <div className="navbar-items">
          {acc === "Not connected" ? (
            <button onClick={connectWallet} className="btn btn-primary">
              Connect Wallet
            </button>
          ) : (
            <>
              <span className="wallet-address">{acc.slice(0, 6)}...{acc.slice(-4)}</span>
              {userType && (
                <Link to={`/${userType}-dashboard`} className="navbar-link">
                  Dashboard
                </Link>
              )}
              <Link to="/register" className="navbar-link">Register</Link>
            </>
          )}
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;