import { VercelRequest, VercelResponse } from '@vercel/node';

import { productNftMetadataSelector } from '../../lib/selectors';
import { mfosClient } from '../../mfos/client';
import { getMetadataForProduct } from '../../utils/wearableMetadata';

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  const { tokenId } = req.query;

  if (tokenId === 'nftMetadata') {
    const productQuery = await mfosClient('query')(
      {
        products: [
          { filter: { nft_token_id: { _nnull: true } } },
          productNftMetadataSelector,
        ],
      },
      {
        operationName: 'getNftMetadataForAllProducts',
      },
    );

    const data = (productQuery.products || []).map((p) => ({
      id: p.id,
      nft_token_id: p.nft_token_id,
      nft_metadata: getMetadataForProduct(p),
    }));
    res.status(200).send(data);
  }

  try {
    const nftTokenId = parseInt(tokenId as string, 10);
    const productQuery = await mfosClient('query')(
      {
        products: [
          { filter: { nft_token_id: { _eq: nftTokenId } } },
          productNftMetadataSelector,
        ],
      },
      {
        operationName: 'getNftMetadataById',
      },
    );

    const product = productQuery.products?.[0];
    const productMetadata = product ? getMetadataForProduct(product) : null;

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    res.setHeader('Cache-Control', 's-maxage=86400');
    res.status(200).send(productMetadata);
  } catch (e) {
    res.status(400).send(`Error getting metadata`);
  }
};
