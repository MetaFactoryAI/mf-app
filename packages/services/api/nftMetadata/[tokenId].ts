import { VercelRequest, VercelResponse } from '@vercel/node';

import { client } from '../../graphql/client';

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  const { tokenId } = req.query;
  console.log(req.query);

  if (tokenId === 'nftMetadata') {
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
  }

  try {
    const nftTokenId = parseInt(tokenId as string, 10);
    const data = await client.query({
      robot_product: [
        { where: { nft_token_id: { _eq: nftTokenId } } },
        {
          id: true,
          nft_metadata: [{}, true],
        },
      ],
    });
    console.log(data);

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    res.status(200).send(data.robot_product[0]?.nft_metadata || null);
  } catch (e) {
    res.status(400).send(`Error getting metadata`);
  }
};
