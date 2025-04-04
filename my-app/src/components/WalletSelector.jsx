import React, { useEffect, useState } from 'react';
import Web3 from 'web3';

const WalletSelector = ({ onAccountChange }) => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [balances, setBalances] = useState({});

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccounts(accs);
        setSelectedAccount(accs[0]);
        onAccountChange(accs[0]);

        const balanceObj = {};
        for (let acc of accs) {
          const wei = await web3.eth.getBalance(acc);
          balanceObj[acc] = web3.utils.fromWei(wei, 'ether');
        }
        setBalances(balanceObj);
      } else {
        alert("Please install MetaMask.");
      }
    };

    init();
  }, [onAccountChange]);

  const handleChange = (e) => {
    const selected = e.target.value;
    setSelectedAccount(selected);
    onAccountChange(selected);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3>🔑 Select Ganache Account</h3>
      <select value={selectedAccount} onChange={handleChange} style={{ padding: '0.5rem', width: '100%' }}>
        {accounts.map((acc) => (
          <option key={acc} value={acc}>
            {acc} ({balances[acc] || '...'} ETH)
          </option>
        ))}
      </select>
    </div>
  );
};

export default WalletSelector;
