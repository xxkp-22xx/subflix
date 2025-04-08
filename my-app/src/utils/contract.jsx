import Web3 from 'web3';
import ContractABI from '../abi/SubManager.json';
import CONFIG from '../config';

const getContract = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    throw new Error("Ethereum provider not found");
  }

  const web3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const networkId = await web3.eth.net.getId();

  const network =
    networkId === parseInt(CONFIG.SEPOLIA.networkId)
      ? CONFIG.SEPOLIA
      : CONFIG.LOCAL;

  return new web3.eth.Contract(ContractABI.abi, network.address);
};

export default getContract;
