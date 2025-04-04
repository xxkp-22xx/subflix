import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadToIPFS } from '../utils/pinata';
import getContract from '../utils/contract';
import WalletSelector from '../components/WalletSelector';

const CreatorPage = () => {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!name || !file || !selectedAccount) {
      return alert("Please fill out all fields and select a wallet.");
    }

    try {
      setLoading(true);
      console.log("Uploading to IPFS...");
      const ipfsHash = await uploadToIPFS(file);
      console.log("IPFS Hash:", ipfsHash);

      const contract = await getContract();
      console.log("Registering with contract from:", selectedAccount);

      await contract.methods
        .registerContent(name, ipfsHash, selectedAccount)
        .send({ from: selectedAccount });

      alert("✅ Content registered successfully!");
      setName('');
      setFile(null);
      setPreviewUrl('');
    } catch (err) {
      console.error("Error registering content:", err);
      alert("❌ Failed to register content. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>🔙 Back</button>
      <h2>📦 Creator Dashboard</h2>

      <WalletSelector onAccountChange={setSelectedAccount} />

      <label>📝 Content Name</label>
      <input
        type="text"
        placeholder="Enter content name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
      />

      <label>🖼️ Upload Image</label>
      <input
        type="file"
        onChange={(e) => {
          const selected = e.target.files[0];
          setFile(selected);
          if (selected) {
            const preview = URL.createObjectURL(selected);
            setPreviewUrl(preview);
          } else {
            setPreviewUrl('');
          }
        }}
        style={{ marginBottom: '1rem' }}
      />

      {previewUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <label>🔍 Preview</label>
          <img
            src={previewUrl}
            alt="Preview"
            style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading}
        style={{
          padding: '0.7rem 1.5rem',
          fontSize: '1rem',
          background: '#4CAF50',
          color: '#fff',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Registering...' : 'Upload & Register'}
      </button>
    </div>
  );
};

export default CreatorPage;