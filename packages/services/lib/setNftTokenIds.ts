import { order_by } from '../graphql/__generated__/zeus';
import { hasuraClient } from '../graphql/client';

export async function setNftTokenIds(): Promise<void> {
  const data = await hasuraClient.query({
    robot_product: [
      {
        where: { nft_metadata: { _is_null: false } },
        order_by: [{ shopify_id: order_by.asc }],
      },
      {
        id: true,
        nft_token_id: true,
        nft_metadata: [{}, true],
      },
    ],
  });

  for (let i = 0; i < data.robot_product.length; i += 1) {
    await hasuraClient.mutate({
      update_robot_product_by_pk: [
        {
          pk_columns: { id: data.robot_product[i].id },
          _set: { nft_token_id: i + 1 },
        },
        { nft_token_id: true },
      ],
    });
  }
}
