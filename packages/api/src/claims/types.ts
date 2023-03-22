export type NftItem = {
  nft_token_id: number;
  id: number;
  nft_metadata: {
    name: string;
    image: string;
    files: { uri: string; mimeType: string }[];
    properties: {
      brand: string;
      images: string[];
    };
  };
};

export type NftClaim = {
  claim_json: {
    to: string;
    erc1155: {
      contractAddress: string;
      ids: string[];
      values: number[];
    }[];
    erc721: never[];
    erc20: {
      contractAddresses: never[];
      amounts: never[];
    };
    salt: string;
    proof: string[];
    claim_count: number;
  };
  merkle_root_hash: string;
};
