import type { HexString } from 'shared/utils/stringHelpers';

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
    to: HexString;
    erc1155: {
      contractAddress: HexString;
      ids: string[];
      values: number[];
    }[];
    erc721: never[];
    erc20: {
      contractAddresses: never[];
      amounts: never[];
    };
    salt: HexString;
    proof: HexString[];
  };
  merkle_root_hash: HexString;
};
