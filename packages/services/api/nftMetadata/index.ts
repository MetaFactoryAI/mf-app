import { VercelRequest, VercelResponse } from '@vercel/node';

import { client } from '../../graphql/client';

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  try {
    const data = await client.query({
      robot_product: [
        { where: { nft_metadata: { _is_null: false } } },
        {
          id: true,
          nft_token_id: true,
          nft_metadata: [{}, true],
        },
      ],
    });

    res.status(200).send(data.robot_product);
  } catch (e) {
    res.status(400).send(`Error getting metadata: ${e as string}`);
  }
};
