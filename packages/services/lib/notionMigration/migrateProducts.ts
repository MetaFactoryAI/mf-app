/* eslint-disable no-await-in-loop */
import assert from 'assert';
import uniqBy from 'lodash/uniqBy';

import { PRODUCT_STAGES, ValueTypes } from '../../mfos';
import { logger } from '../../utils/logger';
import {
  getProductBrand,
  getProductDescription,
  getProductEditionOf,
  getProductPrice,
  getProductProductionCost,
  getProductReleaseDate,
  getProductShopifyId,
  getProductStatus,
  getProductTitle,
} from '../../utils/notion/productHelpers';
import { isNotNullOrUndefined } from '../../utils/typeHelpers';
import {
  createBrandIfNotExists,
  createProductIfNotExists,
} from '../mfosHelpers';
import { getNotionProducts } from '../notionHelpers';
import { CreateBrandRes } from '../selectors';

const PRODUCT_STATUS_TO_STAGE: Record<
  string,
  typeof PRODUCT_STAGES[keyof typeof PRODUCT_STAGES]
> = {
  Released: PRODUCT_STAGES.fulfillment_completed,
  'Sale Active': PRODUCT_STAGES.sale_live,
  'Event -> Drop': PRODUCT_STAGES.fulfillment_completed,
  Fulfillment: PRODUCT_STAGES.shipping,
  'Open Edition Live': PRODUCT_STAGES.sale_live,
};

const toNumber = (numString: string): number | null => {
  try {
    return parseInt(numString, 10);
  } catch (e) {
    return null;
  }
};

export async function migrateProducts(): Promise<void> {
  const products = await getNotionProducts({
    or: [
      {
        property: 'Status',
        select: { equals: 'Released' },
      },
      {
        property: 'Status',
        select: { equals: 'Sale Active' },
      },
      {
        property: 'Status',
        select: { equals: 'Event -> Drop' },
      },
      {
        property: 'Status',
        select: { equals: 'Fulfillment' },
      },
      {
        property: 'Status',
        select: { equals: 'Open Edition Live' },
      },
    ],
  });

  const brands = uniqBy(
    products.map(getProductBrand).filter(isNotNullOrUndefined),
    'id',
  );

  const brandsRes: Record<string, CreateBrandRes> = {};
  for (const b of brands) {
    try {
      brandsRes[b.id] = await createBrandIfNotExists({
        created_at: b.createdAt,
        eth_address: b.ethAddress,
        discord_url: b.discordUrl,
        name: b.name,
        description: b.description,
        notion_id: b.id,
      });
    } catch (e) {
      logger.warn('Error creating brand', { error: (e as Error).message });
    }
  }

  const createdProducts = [];

  for (const p of products) {
    try {
      const brand = getProductBrand(p);
      // const designer = getProductDesigner(p);
      // const tech = getProductTechnician(p);
      const cost = getProductProductionCost(p);
      const status = getProductStatus(p);
      const price = getProductPrice(p);
      const releaseDate = getProductReleaseDate(p);
      const editionOf = getProductEditionOf(p);
      const saleType =
        editionOf?.toLowerCase().indexOf('open') >= 0
          ? 'open_edition'
          : 'limited_edition';
      const quantity = toNumber(editionOf);

      assert(status);
      const stage = PRODUCT_STATUS_TO_STAGE[status];
      assert(stage, `Invalid product status ${status}`);
      // const designerUser = designer
      //   ? await getSystemUserByAddress(designer?.ethAddress)
      //   : null;
      // const techUser = tech
      //   ? await getSystemUserByAddress(tech?.ethAddress)
      //   : null;

      const product: ValueTypes['create_products_input'] = {
        created_at: p.created_time,
        name: getProductTitle(p),
        description: getProductDescription(p),
        shopify_id: getProductShopifyId(p),
        notion_id: p.id,
        sale_type: saleType,
        quantity: quantity?.toString(),
        production_cost: cost,
        product_stage: stage,
      };

      if (price)
        product.price = {
          amount: parseInt(price.toString(), 10),
          currency: 'USD',
        };

      if (releaseDate)
        product.release_date = new Date(releaseDate).toISOString();
      if (brand?.id)
        product.brand_id = {
          id: brandsRes[brand.id].id,
          name: brand.name,
        };

      const createProductRes = await createProductIfNotExists(product);
      createdProducts.push(createProductRes);
    } catch (e) {
      logger.warn('Error creating product', {
        error: e,
        product: p.properties.Name.title,
      });
    }
  }

  logger.info('finished migrating products', {
    numProducts: products.length,
    created: createdProducts.length,
  });
}
