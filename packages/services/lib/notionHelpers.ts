import { QueryDatabaseParameters } from '@notionhq/client/build/src/api-endpoints';
import { z } from 'zod';

import { logger } from '../utils/logger';
import { notionClient } from '../utils/notion/client';
import {
  ProductPage,
  ProductPageFiles,
  PropertyName,
} from '../utils/notion/parser';
import { PageProperty } from '../utils/notion/types';

const ProductResults = z.array(ProductPage);

export type ProductPageFile = z.infer<typeof ProductPageFiles>;
export const getProductPageFiles = async (
  id: string,
): Promise<ProductPageFile> => {
  const result = await notionClient.pages.retrieve({
    page_id: id,
  });

  return ProductPageFiles.parse(result);
};

export const getNotionProducts = async (
  filter?: QueryDatabaseParameters['filter'],
): Promise<z.infer<typeof ProductPage>[]> => {
  let nextCursor = '';
  let hasMore = false;
  const products: z.infer<typeof ProductResults> = [];
  do {
    // eslint-disable-next-line no-await-in-loop
    const result = await notionClient.databases.query({
      database_id: '50d380c274dc48efb5576b09470d36c7',
      filter,
      start_cursor: nextCursor || undefined,
    });
    nextCursor = result.next_cursor || '';
    hasMore = result.has_more;

    // eslint-disable-next-line no-await-in-loop
    const productResults = await ProductResults.parseAsync(result.results);
    logger.info(`Loaded ${productResults.length} products`);
    products.push(...productResults);
  } while (hasMore);

  const properties: Record<string, PageProperty> = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const [propertyName, { id, type }] of Object.entries(
    products[0].properties,
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

  return products;
};
