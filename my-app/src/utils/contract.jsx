import Web3 from 'web3';
import ContractABI from '../abi/SubManager.json';

const CONTRACT_ADDRESS = "0x8f451cb17cD302Ce56a7D3cCcC6cD4f570eB0AA4";

const getContract = async () => {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return new web3.eth.Contract(ContractABI.abi, CONTRACT_ADDRESS);
  } else {
    alert("Please install MetaMask");
    throw new Error("Ethereum provider not found");
  }
};

export default getContract;
