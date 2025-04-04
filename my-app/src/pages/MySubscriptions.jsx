import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import getContract from '../utils/contract';

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const MySubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySubscriptions = async () => {
      try {
        const contract = await getContract();
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(window.ethereum);
        const user = accounts[0];

        const totalOwned = await contract.methods.balanceOf(user).call();
        const subs = [];

        for (let i = 0; i < totalOwned; i++) {
          const tokenId = await contract.methods.tokenOfOwnerByIndex(user, i).call();
          const isValid = await contract.methods.isSubscriptionValid(tokenId).call();

          if (isValid) {
            const ipfsHash = await contract.methods.getContentIpfsHash(tokenId).call();
            const expiresAt = await contract.methods.getSubscriptionExpiry(tokenId).call();

            subs.push({ tokenId, ipfsHash, expiresAt });
          }
        }

        setSubscriptions(subs);
      } catch (err) {
        console.error("Error fetching subscriptions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMySubscriptions();
  }, []);

  const formatRemainingTime = (expiresAt) => {
    const now = Math.floor(Date.now() / 1000);
    const expires = Number(expiresAt); // Fix: convert BigInt to Number

    const secondsLeft = expires - now;
    if (secondsLeft <= 0) return 'Expired';

    const days = Math.floor(secondsLeft / (60 * 60 * 24));
    const hours = Math.floor((secondsLeft % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((secondsLeft % (60 * 60)) / 60);

    return `${days}d ${hours}h ${minutes}m left`;
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🔓 My Active Subscriptions</h2>

      {loading ? (
        <p>Loading subscriptions...</p>
      ) : subscriptions.length === 0 ? (
        <p>No active subscriptions found.</p>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {subscriptions.map((sub) => (
            <div
              key={sub.tokenId}
              style={{
                border: '1px solid #ccc',
                padding: '1rem',
                width: '200px',
                borderRadius: '10px'
              }}
            >
              <img
                src={`${IPFS_GATEWAY}${sub.ipfsHash}`}
                alt={`Content ${sub.tokenId}`}
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
              />
              <p style={{ marginTop: '0.5rem' }}>Token ID: {sub.tokenId}</p>
              <p style={{ color: '#777' }}>⏳ {formatRemainingTime(sub.expiresAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySubscriptions;
