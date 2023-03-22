export const parseIds = (nfts: { [key: string]: any }) => {
  if (!nfts) return [];

  return Object.keys(nfts).map((key: string) => nfts[key].nft_token_id);
};
