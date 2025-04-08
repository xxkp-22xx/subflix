import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = ({ userAddress, userRole }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '1rem',
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #ddd'
    }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {userRole === 'creator' && <Link to="/">Creator</Link>}
        {userRole === 'user' && <Link to="/user">User</Link>}
        {userRole === 'admin' && <Link to="/admin">Admin</Link>}
        <Link to="/mysubs">My Subs</Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {userAddress && <span style={{ fontSize: '0.9rem' }}>{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>}
        <button onClick={handleLogout} style={{ padding: '0.4rem 0.7rem' }}>Logout</button>
      </div>
    </nav>
  );
};

export default NavBar;
