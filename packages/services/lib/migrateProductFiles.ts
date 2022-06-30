/* eslint-disable no-await-in-loop */
import assert from 'assert';

import { Client } from '../mfos';
import { logger } from '../utils/logger';
import {
  uploadClo3dFileForProduct,
  uploadContentForProduct,
  uploadDesignFilesForProduct,
  uploadImagesForProduct,
  uploadWearablesForProduct,
} from './mfosHelpers';
import { getProductPageFiles } from './notionHelpers';
import { productsFilesSelector } from './selectors';

export async function migrateProductFiles(client: Client): Promise<void> {
  const productsQuery = await client('query')({
    products: [{ limit: 200 }, productsFilesSelector],
  });
  assert(productsQuery.products, 'Failed to get products');
  logger.info('Got products', {
    count: productsQuery.products.length,
  });
  let i = 0;

  for (const p of productsQuery.products) {
    i += 1;
    logger.info(
      `Migrating product ${i} of ${productsQuery.products.length}: ${p.name}`,
    );
    assert(p.notion_id);
    const productPage = await getProductPageFiles(p.notion_id);
    await uploadImagesForProduct(client, p, productPage);
    await uploadWearablesForProduct(client, p, productPage);
    await uploadDesignFilesForProduct(client, p, productPage);
    await uploadClo3dFileForProduct(client, p, productPage);
    await uploadContentForProduct(client, p, productPage);
  }
}
