import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';

const barStyle = {
  background: 'var(--surface)',
  borderBottom: '1px solid var(--border)',
  padding: '0.75rem 0',
  position: 'sticky',
  top: 0,
};

const innerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  flexWrap: 'wrap',
};

const brandStyle = {
  fontWeight: 700,
  fontSize: '1.05rem',
  color: 'var(--accent)',
  textDecoration: 'none',
};

const navLinksStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const customerLinks = user?.role === 'customer' && (
    <>
      <Link to="/customer/location" className="nav-inline-link">
        Location
      </Link>
      <Link to="/customer/workers" className="nav-inline-link">
        Find Workers
      </Link>
      <Link to="/customer/dashboard" className="nav-inline-link">
        My Bookings
      </Link>
    </>
  );

  const workerLinks = user?.role === 'worker' && (
    <Link to="/worker/dashboard" className="nav-inline-link">
      Worker Dashboard
    </Link>
  );

  const adminLinks = user?.role === 'admin' && (
    <Link to="/admin" className="nav-inline-link">
      Admin
    </Link>
  );

  return (
    <header style={barStyle}>
      <div className="container" style={innerStyle}>
        <Link to={user ? (user.role === 'admin' ? '/admin' : user.role === 'worker' ? '/worker/dashboard' : '/customer/location') : '/'} style={brandStyle}>
          Connect Worker
        </Link>
        <nav style={navLinksStyle}>
          {user && <NotificationDropdown />}
          {customerLinks}
          {workerLinks}
          {adminLinks}
          {!user && (
            <>
              <Link to="/login" className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem' }}>
                Get Started
              </Link>
            </>
          )}
          {user && (
            <>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {user.name}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
