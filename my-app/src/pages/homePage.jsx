import { useState, useEffect } from 'react';
import Web3 from 'web3';
import contract from '../utils/contract';
import styles from '../styles/Home.module.css';

export default function HomePage() {
  const [account, setAccount] = useState(null);
  const [ganacheAccounts, setGanacheAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreatorView, setIsCreatorView] = useState(false);
  const [contentToRegister, setContentToRegister] = useState('');
  const [registeredContents, setRegisteredContents] = useState([]);
  const [currentContent, setCurrentContent] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState({
    ipfsHash: '',
    amount: '0.01'
  });

  // Ganache connection
  const ganacheWeb3 = new Web3('http://127.0.0.1:7545');

  useEffect(() => {
    const init = async () => {
      try {
        // Get Ganache accounts
        const ganacheAccs = await ganacheWeb3.eth.getAccounts();
        setGanacheAccounts(ganacheAccs);
        setAccount(ganacheAccs[0]);

        // Get balances for all Ganache accounts
        await updateBalances();

        // Load registered content
        await loadRegisteredContent();
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to connect to to Ganache");
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (registeredContents.length > 0 && !currentContent) {
      setCurrentContent(registeredContents[0]);
      setSubscriptionData(prev => ({
        ...prev,
        ipfsHash: registeredContents[0].ipfsHash
      }));
    }
  }, [registeredContents]);

  const loadRegisteredContent = async () => {
    try {
      // Get all content from contract events
      const events = await contract.getPastEvents('SubscriptionPurchased', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      // Get unique content hashes
      const contentHashes = [...new Set(events.map(e => e.returnValues.ipfsHash))];
      
      // Get creator for each content
      const contents = await Promise.all(
        contentHashes.map(async hash => {
          const creator = await contract.methods.contentCreators(hash).call();
          return { ipfsHash: hash, creator };
        })
      );

      setRegisteredContents(contents);
    } catch (err) {
      console.error("Failed to load registered content:", err);
    }
  };

  const updateBalances = async () => {
    const balancePromises = ganacheAccounts.map(acc => ganacheWeb3.eth.getBalance(acc));
    const balanceResults = await Promise.all(balancePromises);
    
    const balanceMap = {};
    ganacheAccounts.forEach((acc, index) => {
      balanceMap[acc] = ganacheWeb3.utils.fromWei(balanceResults[index], 'ether');
    });
    setBalances(balanceMap);
  };

  const handleAccountChange = async (e) => {
    const selectedAccount = e.target.value;
    setAccount(selectedAccount);
    await updateBalances();
  };

  const handleSubscriptionChange = (e) => {
    setSubscriptionData({
      ...subscriptionData,
      [e.target.name]: e.target.value
    });
  };

  const handleContentSelect = (content) => {
    setCurrentContent(content);
    setSubscriptionData(prev => ({
      ...prev,
      ipfsHash: content.ipfsHash
    }));
  };

  const purchaseSubscription = async () => {
    if (!account) {
      setError("Please select an account first");
      return;
    }
    
    if (!subscriptionData.ipfsHash) {
      setError("Please enter IPFS hash");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert amount to wei using Web3 utils
      const price = Web3.utils.toWei(subscriptionData.amount, 'ether');
      const balance = await ganacheWeb3.eth.getBalance(account);
      
      // Compare using BN (Big Number)
      if (Web3.utils.toBN(balance).lt(Web3.utils.toBN(price))) {
        throw new Error("Insufficient balance");
      }

      const gasEstimate = await contract.methods.purchaseSubscription(subscriptionData.ipfsHash)
        .estimateGas({ from: account, value: price });

      await contract.methods.purchaseSubscription(subscriptionData.ipfsHash)
        .send({
          from: account,
          value: price,
          gas: gasEstimate + 10000
        });
      
      alert("Subscription purchased successfully!");
      await loadRegisteredContent();
      await updateBalances();
      
    } catch (err) {
      console.error("Purchase failed:", err);
      setError(
        err.message.includes("insufficient funds") 
          ? "Insufficient balance" 
          : err.message.includes("revert") 
          ? "Contract rejected the transaction" 
          : "Purchase failed"
      );
    } finally {
      setLoading(false);
    }
};

  const registerContent = async () => {
    if (!account || !contentToRegister) {
      setError("Please enter IPFS hash");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await contract.methods.registerContent(contentToRegister, account)
        .send({ from: account });
      
      setContentToRegister('');
      await loadRegisteredContent();
      await updateBalances();
      alert("Content registered successfully!");
      
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Failed to register content");
    } finally {
      setLoading(false);
    }
  };

    return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.headerControls}>
          <div className={styles.accountSelector}>
            <label>Ganache Account: </label>
            <select onChange={handleAccountChange} value={account || ''}>
              {ganacheAccounts.map(acc => (
                <option key={acc} value={acc}>
                  {acc.substring(0, 6)}...{acc.substring(38)} - {balances[acc] || 0} ETH
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => setIsCreatorView(!isCreatorView)}
            className={styles.toggleButton}
          >
            {isCreatorView ? 'Switch to User View' : 'Switch to Creator View'}
          </button>
        </div>

        {/* Current Content Display */}
        {currentContent && (
          <div className={styles.currentContent}>
            <h3>Current Content</h3>
            <p>IPFS Hash: {currentContent.ipfsHash}</p>
            <p>Creator: {currentContent.creator}</p>
          </div>
        )}

        {error && <div className={styles.errorMessage}>{error}</div>}
        {isCreatorView ? (
          <div className={styles.creatorView}>
            <h1>Creator Dashboard</h1>
            
            <div className={styles.section}>
              <h2>Register New Content</h2>
              <input
                type="text"
                value={contentToRegister}
                onChange={(e) => setContentToRegister(e.target.value)}
                placeholder="Enter IPFS hash"
                className={styles.inputField}
              />
              <button 
                onClick={registerContent}
                disabled={loading}
                className={styles.actionButton}
              >
                {loading ? 'Processing...' : 'Register Content'}
              </button>
            </div>
            
            <div className={styles.section}>
              <h2>Registered Content</h2>
              <div className={styles.contentList}>
                {registeredContents.map((content, index) => (
                  <div key={index} className={styles.contentItem}>
                    <p>IPFS Hash: {content.ipfsHash}</p>
                    <p>Creator: {content.creator}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.userView}>
            <h1>Premium Content Subscription</h1>
            
            <div className={styles.subscriptionForm}>
              <h2>Purchase Subscription</h2>
              <div className={styles.formGroup}>
                <label>IPFS Hash:</label>
                <input
                  type="text"
                  name="ipfsHash"
                  value={subscriptionData.ipfsHash}
                  onChange={handleSubscriptionChange}
                  placeholder="Enter content IPFS hash"
                  className={styles.inputField}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Amount (ETH):</label>
                <input
                  type="number"
                  name="amount"
                  value={subscriptionData.amount}
                  onChange={handleSubscriptionChange}
                  min="0.01"
                  step="0.01"
                  className={styles.inputField}
                />
              </div>
              <button 
                onClick={purchaseSubscription}
                disabled={loading || !account}
                className={styles.subscribeButton}
              >
                {loading ? 'Processing...' : 'Buy Subscription'}
              </button>
            </div>
            
            <div className={styles.availableContent}>
              <h2>Available Content</h2>
              <div className={styles.contentList}>
                {registeredContents.map((content, index) => (
                  <div key={index} className={styles.contentItem}>
                    <p>IPFS Hash: {content.ipfsHash}</p>
                    <p>Creator: {content.creator}</p>
                    <button 
                      onClick={() => setSubscriptionData({
                        ...subscriptionData,
                        ipfsHash: content.ipfsHash
                      })}
                      className={styles.selectButton}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}