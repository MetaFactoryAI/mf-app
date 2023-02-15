/* eslint-disable import/prefer-default-export */

export const getIpfsHash = async (ipfsHash: string, protocolType = 'ipfs') => {
  const url = `https://${process.env.NEXT_PUBLIC_IPFS_NODE}/${protocolType}/${ipfsHash}`;

  return fetch(url).then((res) => res.json());
};
