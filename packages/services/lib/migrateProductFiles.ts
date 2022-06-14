/* eslint-disable no-await-in-loop */
import { Client } from '@mf/cms';
import assert from 'assert';

import { logger } from '../utils/logger';
import {
  uploadImagesForProduct,
  uploadWearablesForProduct,
} from './mfosHelpers';
import { getProductPageFiles } from './notionHelpers';
import { productsFilesSelector } from './selectors';

export async function migrateProductFiles(client: Client): Promise<void> {
  const productsQuery = await client.query({
    products: [{ limit: 200 }, productsFilesSelector],
  });
  assert(productsQuery.products, 'Failed to get products');
  logger.info('Got products', {
    count: productsQuery.products.length,
  });

  for (const p of productsQuery.products) {
    assert(p.notion_id);
    const productPage = await getProductPageFiles(p.notion_id);
    await uploadImagesForProduct(client, p, productPage);
    await uploadWearablesForProduct(client, p, productPage);
  }
}
