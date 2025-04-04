import React, { useEffect, useState } from "react";
import contract from "../utils/contract";
import styles from "../styles/Home.module.css";
import Web3 from "web3";

const web3 = new Web3("http://127.0.0.1:7545");

const HomePage = () => {
  const [account, setAccount] = useState(null);
  const [ganacheAccounts, setGanacheAccounts] = useState([]);
  const [contentToRegister, setContentToRegister] = useState("");
  const [subscriptionData, setSubscriptionData] = useState({ ipfsHash: "", amount: "" });
  const [registeredContents, setRegisteredContents] = useState([]);
  const [isCreatorView, setIsCreatorView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentContent, setCurrentContent] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      const accounts = await web3.eth.getAccounts();
      setGanacheAccounts(accounts);
      setAccount(accounts[0]);
    };
    fetchAccounts();
  }, []);

  const handleAccountChange = (e) => {
    setAccount(e.target.value);
  };

  const handleSubscriptionChange = (e) => {
    const { name, value } = e.target;
    setSubscriptionData((prev) => ({ ...prev, [name]: value }));
  };

  const registerContent = async () => {
    if (!contentToRegister || !account) {
      setError("IPFS Hash or account missing");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await contract.methods.registerContent(contentToRegister, account).send({ from: account });

      // Update UI with new content
      setRegisteredContents((prev) => [
        ...prev,
        { ipfsHash: contentToRegister, creator: account },
      ]);

      setContentToRegister("");
    } catch (err) {
      console.error(err);
      setError("Failed to register content");
    } finally {
      setLoading(false);
    }
  };

  const purchaseSubscription = async () => {
    const { ipfsHash, amount } = subscriptionData;

    if (!ipfsHash || !amount) {
      setError("IPFS hash and amount are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await contract.methods.purchaseSubscription(ipfsHash).send({
        from: account,
        value: web3.utils.toWei(amount, "ether"),
      });

      setCurrentContent({ ipfsHash, creator: account });
    } catch (err) {
      console.error(err);
      setError("Subscription failed");
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
            <select onChange={handleAccountChange} value={account || ""}>
              {ganacheAccounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc.substring(0, 6)}...{acc.substring(38)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreatorView(!isCreatorView)}
            className={styles.toggleButton}
          >
            {isCreatorView ? "Switch to User View" : "Switch to Creator View"}
          </button>
        </div>

        {currentContent && (
          <div className={styles.currentContent}>
            <h3>Current Content</h3>
            <p style={{fontSize:"20px"}}>IPFS Hash: {currentContent.ipfsHash}</p>
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
                {loading ? "Processing..." : "Register Content"}
              </button>
            </div>

            <div className={styles.section}>
              <h2>Registered Content</h2>
              <div className={styles.contentList}  style={{width:"67vw"}}>
                {registeredContents.map((content, index) => (
                  <div key={index} className={styles.contentItem}>
                    <p  style={{fontSize:"20px"}}>IPFS Hash: {content.ipfsHash}</p>
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
                {loading ? "Processing..." : "Buy Subscription"}
              </button>
            </div>

            <div className={styles.availableContent}>
              <h2>Available Content</h2>
              <div className={styles.contentList}>
                {registeredContents.map((content, index) => (
                  <div key={index} className={styles.contentItem}>
                    <p style={{ wordBreak: "break-word", fontSize: "20px" }}>IPFS Hash: {content.ipfsHash}</p>
                    <p style={{ wordBreak: "break-word" }}>Creator: {content.creator}</p>

                    <button
                      onClick={() =>
                        setSubscriptionData((prev) => ({
                          ...prev,
                          ipfsHash: content.ipfsHash,
                        }))
                      }
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
};

export default HomePage;
