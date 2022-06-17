import { VercelRequest, VercelResponse } from '@vercel/node';

import { productNftMetadataSelector } from '../../lib/selectors';
import { mfosClient } from '../../utils/mfos/client';
import { getMetadataForProduct } from '../../utils/mfos/wearableMetadata';

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  try {
    const productQuery = await mfosClient.query({
      products: [
        { filter: { nft_token_id: { _nnull: true } } },
        productNftMetadataSelector,
      ],
    });

    const productMetadata = (productQuery.products || []).map(
      getMetadataForProduct,
    );
    res.status(200).send(productMetadata);
  } catch (e) {
    res.status(400).send(`Error getting metadata: ${e as string}`);
  }
};
