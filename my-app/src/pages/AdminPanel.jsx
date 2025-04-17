import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getContract from '../utils/contract';
import Web3 from 'web3';

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const AdminPanel = () => {
  const [account, setAccount] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [creatorPool, setCreatorPool] = useState('0');
  const [platformPool, setPlatformPool] = useState('0');
  const [newPrice, setNewPrice] = useState('');
  const [unapprovedContent, setUnapprovedContent] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnapprovedContent();
  }, []);

  const fetchUnapprovedContent = async () => {
    try {
      const contract = await getContract();
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      const user = accounts[0];
      setAccount(user);

      // ✅ Use custom admin() function instead of owner()
      const admin = await contract.methods.admin().call();
      setIsAdmin(user.toLowerCase() === admin.toLowerCase());

      const creator = await contract.methods.creatorsPool().call();
      const platform = await contract.methods.platformPool().call();

      setCreatorPool(web3.utils.fromWei(creator, 'ether'));
      setPlatformPool(web3.utils.fromWei(platform, 'ether'));

      const total = await contract.methods.getTotalContent().call();
      const unapproved = [];

      for (let tokenId = 0; tokenId < total; tokenId++) {
        const exists = await contract.methods.contentExists(tokenId).call();
        if (exists) {
          const content = await contract.methods.getContentByTokenId(tokenId).call();
          const approved = await contract.methods.isContentApproved(tokenId).call();
          if (!approved) {
            unapproved.push({ ...content, tokenId });
          }
        }
      }

      setUnapprovedContent(unapproved);
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  };

  const handleWithdraw = async () => {
    try {
      const contract = await getContract();
      await contract.methods.withdrawPlatformFunds().send({ from: account });
      alert("✅ Platform funds withdrawn!");
    } catch (err) {
      console.error("Withdraw failed:", err);
      alert("❌ Withdrawal failed. See console.");
    }
  };

  const handleUpdatePrice = async () => {
    try {
      const contract = await getContract();
      const weiPrice = Web3.utils.toWei(newPrice, 'ether');
      await contract.methods.setSubscriptionPrice(weiPrice).send({ from: account });
      alert("✅ Subscription price updated!");
    } catch (err) {
      console.error("Update failed:", err);
      alert("❌ Price update failed.");
    }
  };

  const handleApprove = async (tokenId) => {
    try {
      const contract = await getContract();
      await contract.methods.approveContent(tokenId).send({ from: account });
      alert(`✅ Content #${tokenId} approved!`);
      await fetchUnapprovedContent();
    } catch (err) {
      console.error("Approval failed:", err);
      alert("❌ Approval failed.");
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>🔙 Back</button>
      <h2>🛠️ Admin Dashboard</h2>

      {!isAdmin ? (
        <p>🔒 You are not the contract admin.</p>
      ) : (
        <div style={{ maxWidth: '600px' }}>
          <p><b>Connected:</b> {account}</p>

          <div style={{ marginTop: '1rem' }}>
            <h4>💼 Pools</h4>
            <p>Creator Pool: {creatorPool} ETH</p>
            <p>Platform Pool: {platformPool} ETH</p>
          </div>

          <button
            onClick={handleWithdraw}
            style={{ padding: '0.6rem', backgroundColor: '#007bff', color: 'white', border: 'none', marginTop: '1rem', cursor: 'pointer' }}
          >
            Withdraw Platform Funds
          </button>

          <div style={{ marginTop: '2rem' }}>
            <h4>💸 Set Subscription Price</h4>
            <input
              type="text"
              placeholder="Enter new price in ETH"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              style={{ padding: '0.5rem', width: '100%' }}
            />
            <button
              onClick={handleUpdatePrice}
              style={{ padding: '0.6rem', backgroundColor: 'green', color: 'white', border: 'none', marginTop: '0.5rem', cursor: 'pointer' }}
            >
              Update Price
            </button>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h4>📝 Pending Approvals</h4>
            {unapprovedContent.length === 0 ? (
              <p>No unapproved content found.</p>
            ) : (
              unapprovedContent.map(content => (
                <div
                  key={content.tokenId}
                  style={{
                    border: '1px solid #ccc',
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '8px'
                  }}
                >
                  <img
                    src={`${IPFS_GATEWAY}${content.ipfsHash}`}
                    alt={content.name}
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', marginBottom: '0.5rem' }}
                  />
                  <p><strong>{content.name}</strong></p>
                  <p>Creator: {content.creator}</p>
                  <button
                    onClick={() => handleApprove(content.tokenId)}
                    style={{
                      padding: '0.4rem 1rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ✅ Approve
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
