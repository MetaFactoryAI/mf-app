import { VercelRequest, VercelResponse } from '@vercel/node';

import { productNftMetadataSelector } from 'services/lib/selectors';
import { mfosClient } from 'services/mfos/client';
import { getMetadataForProduct } from 'services/utils/wearableMetadata';

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  try {
    const productQuery = await mfosClient('query')({
      products: [
        { filter: { nft_token_id: { _nnull: true } } },
        productNftMetadataSelector,
      ],
    });
    const data = (productQuery.products || []).map((p) => ({
      id: p.id,
      nft_token_id: p.nft_token_id,
      nft_metadata: getMetadataForProduct(p),
    }));
    res.status(200).send(data);
  } catch (e) {
    res.status(400).send(`Error getting metadata: ${e as string}`);
  }
};
