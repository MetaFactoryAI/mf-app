/* eslint-disable @typescript-eslint/ban-ts-comment,no-await-in-loop */
import { VercelRequest, VercelResponse } from '@vercel/node';

import { notionClient } from '../utils/notion/client';
import { DatabaseResult, PropertyName } from '../utils/notion/parser';
import {
  getProductShopifyId,
  getProductTitle,
} from '../utils/notion/productHelpers';
import { PageProperty } from '../utils/notion/types';
import {
  generateWearableMetadata,
  updateProduct,
} from '../utils/wearableHelpers';

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  const result = await notionClient.databases.query({
    database_id: '50d380c274dc48efb5576b09470d36c7',
    filter: {
      and: [
        {
          property: 'Wearable Files',
          files: { is_not_empty: true },
        },
        {
          property: 'Shopify Link',
          url: { is_not_empty: true },
        },
      ],
    },
  });

  const properties: Record<string, PageProperty> = {};

  try {
    const parsedResult = await DatabaseResult.parseAsync(result);

    // eslint-disable-next-line no-restricted-syntax
    for (const [propertyName, { id, type }] of Object.entries(
      parsedResult.results[0].properties,
    )) {
      if (properties[propertyName]) {
        throw new Error(`Duplicate ID found: ${propertyName} ${id}`);
      }
      properties[propertyName] = {
        id,
        type,
        propertyName: propertyName as PropertyName,
      };
    }
    // console.log(JSON.stringify(parsedResult.results[0], null, 2));

    const itemResults = [];

    for (const p of parsedResult.results) {
      const title = getProductTitle(p);

      const metadata = await generateWearableMetadata(p);
      const setDataRes = await updateProduct(getProductShopifyId(p), {
        notion_id: p.id,
        title,
        nft_metadata: metadata,
      });

      itemResults.push(setDataRes?.returning);
    }

    res.status(200).send(itemResults);
  } catch (e) {
    res.status(500).send(e);
  }
};
