import { VercelRequest, VercelResponse } from '@vercel/node';

import { productNftMetadataSelector } from '../../lib/selectors';
import { mfosClient } from '../../utils/mfos/client';
import { getMetadataForProduct } from '../../utils/mfos/wearableMetadata';

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

    const productMetadata = (productQuery.products || []).map(
      getMetadataForProduct,
    );
    res.status(200).send(productMetadata);
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
