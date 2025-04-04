// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Web3 from 'web3';

const LoginPage = ({ setUserAddress, setUserRole }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3 = new Web3(window.ethereum);
      const address = accounts[0];
      setUserAddress(address);
    } else {
      alert('MetaMask not found!');
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setUserRole(role);
  };

  const handleEnter = () => {
    if (!selectedRole) return alert('Select a role!');
    if (selectedRole === 'admin') return navigate('/admin');
    if (selectedRole === 'creator') return navigate('/creator');
    if (selectedRole === 'user') return navigate('/user');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🔐 Connect Your Wallet</h2>
      <button onClick={connectWallet} style={{ padding: '0.7rem', marginBottom: '1rem' }}>
        Connect MetaMask
      </button>

      <h3>🧑‍💼 Select Your Role</h3>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => handleRoleSelect('admin')} style={{ backgroundColor: selectedRole === 'admin' ? '#007bff' : '#ddd' }}>
          Admin
        </button>
        <button onClick={() => handleRoleSelect('creator')} style={{ backgroundColor: selectedRole === 'creator' ? '#28a745' : '#ddd' }}>
          Creator
        </button>
        <button onClick={() => handleRoleSelect('user')} style={{ backgroundColor: selectedRole === 'user' ? '#ffc107' : '#ddd' }}>
          Subscriber
        </button>
      </div>

      <button onClick={handleEnter} style={{ padding: '0.7rem', backgroundColor: '#000', color: 'white' }}>
        🚀 Enter
      </button>
    </div>
  );
};

export default LoginPage;
