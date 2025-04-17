import Web3 from 'web3';
import ContractABI from '../abi/SubManager.json'; // ✅ Make sure this ABI was copied from /build/contracts after compiling
import CONFIG from '../config'; // Should have LOCAL and SEPOLIA details

const getContract = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    throw new Error("Ethereum provider not found");
  }

  const web3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  const networkId = await web3.eth.net.getId();

  let selectedNetwork;
  if (networkId.toString() === CONFIG.SEPOLIA.networkId) {
    selectedNetwork = CONFIG.SEPOLIA;
  } else if (networkId.toString() === CONFIG.LOCAL.networkId) {
    selectedNetwork = CONFIG.LOCAL;
  } else {
    throw new Error(`Unsupported network ID: ${networkId}`);
  }

  // ✅ Validate contract address
  if (!selectedNetwork.address) {
    throw new Error(`Contract address for network ${networkId} not found in config`);
  }

  return new web3.eth.Contract(ContractABI.abi, selectedNetwork.address);
};

export default getContract;
