/* eslint-disable no-await-in-loop */
import assert from 'assert';

import { Client } from '../../mfos';
import { logger } from '../../utils/logger';
import { getProductPageFiles } from '../notionHelpers';
import {
  uploadClo3dFileForProduct,
  uploadContentForProduct,
  uploadDesignFilesForProduct,
  uploadImagesForProduct,
  uploadWearablesForProduct,
} from '../../mfos/products/mutations';
import {
  productsFilesSelector,
  productsSelector,
} from '../../mfos/products/selectors';

export async function migrateProductFiles(client: Client): Promise<void> {
  const productsQuery = await client('query')({
    products: [
      { limit: 200 },
      { ...productsSelector, ...productsFilesSelector },
    ],
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
    await uploadImagesForProduct(p, productPage);
    await uploadWearablesForProduct(p, productPage);
    await uploadDesignFilesForProduct(p, productPage);
    await uploadClo3dFileForProduct(p, productPage);
    await uploadContentForProduct(p, productPage);
  }
}
