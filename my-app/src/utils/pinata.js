import axios from 'axios';

const PINATA_API_KEY = "2f2a0cd299cd293885d4";
const PINATA_API_SECRET = "138bfaf5116529a9cd5c95230551d86cb0b473542832edb86e516a8d6f959696"; // OR use JWT

export const uploadToIPFS = async (file) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(url, formData, {
      maxContentLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data`,
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });

    const ipfsHash = response.data.IpfsHash;
    return ipfsHash;
  } catch (error) {
    console.error("IPFS Upload Error:", error);
    throw new Error("Failed to upload to IPFS");
  }
};
