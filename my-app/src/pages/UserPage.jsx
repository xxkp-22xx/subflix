import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getContract from '../utils/contract';
import Web3 from 'web3';

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const UserPage = () => {
  const [contents, setContents] = useState([]);
  const [subscribedHashes, setSubscribedHashes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contract = await getContract();
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const user = accounts[0];

        // 1. Get all active subscriptions
        const owned = await contract.methods.balanceOf(user).call();
        const activeHashes = [];

        for (let i = 0; i < owned; i++) {
          const tokenId = await contract.methods.tokenOfOwnerByIndex(user, i).call();
          const isValid = await contract.methods.isSubscriptionValid(tokenId).call();
          if (isValid) {
            const ipfs = await contract.methods.getContentIpfsHash(tokenId).call();
            activeHashes.push(ipfs);
          }
        }

        setSubscribedHashes(activeHashes);

        // 2. Load all approved content
        const total = await contract.methods.getTotalContent().call();
        const fetched = [];

        for (let tokenId = 0; tokenId < total; tokenId++) {
          const exists = await contract.methods.contentExists(tokenId).call();
          if (exists) {
            const content = await contract.methods.getContentByTokenId(tokenId).call();
            const approved = await contract.methods.isContentApproved(tokenId).call();
            if (approved) {
              fetched.push({ ...content, tokenId });
            }
          }
        }

        setContents(fetched);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubscribe = async (tokenId) => {
    try {
      const contract = await getContract();
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const price = await contract.methods.subscriptionPrice().call();

      await contract.methods.purchaseSubscription(tokenId).send({
        from: accounts[0],
        value: price,
      });

      alert("✅ Subscription successful! Refresh to update access.");
    } catch (err) {
      console.error("❌ Subscription failed:", err);
      alert("Subscription failed. Check console.");
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>🔙 Back</button>
      <h2>📜 Browse All Approved Content</h2>

      {loading ? (
        <p>Loading content...</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {contents.map((content) => {
            const isSubscribed = subscribedHashes.includes(content.ipfsHash);
            return (
              <div
                key={content.tokenId}
                style={{
                  border: '1px solid #ccc',
                  padding: '1rem',
                  width: '200px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <img
                  src={`${IPFS_GATEWAY}${content.ipfsHash}`}
                  alt={content.name}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
                />
                <h4>{content.name}</h4>
                <p><b>Creator:</b> {content.creator.slice(0, 10)}...</p>
                <button
                  onClick={() => handleSubscribe(content.tokenId)}
                  disabled={isSubscribed}
                  style={{
                    padding: '0.5rem',
                    width: '100%',
                    backgroundColor: isSubscribed ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    marginTop: '0.5rem',
                    cursor: isSubscribed ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubscribed ? 'Already Subscribed' : 'Subscribe (0.01 ETH)'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserPage;
