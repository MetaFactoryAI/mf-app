import assert from 'assert';

import { logger } from '../../utils/logger';
import {
  $,
  GraphQLTypes,
  InputType,
  ValueTypes,
} from '../__generated__/user/zeus';
import { mfosClient } from '../client';

import { brandSelector } from './selectors';

export type CreateBrandResult = InputType<
  GraphQLTypes['brands'],
  typeof brandSelector
>;
export const createBrandIfNotExists = async (
  brand: ValueTypes['create_brands_input'],
): Promise<CreateBrandResult> => {
  assert(brand.notion_id, 'notion_id required');

  const existingBrand = await mfosClient('query')({
    brands: [
      { filter: { notion_id: { _eq: brand.notion_id } } },
      brandSelector,
    ],
  });

  if (existingBrand.brands?.[0]) {
    return existingBrand.brands[0];
  }
  logger.info('Creating Brand', { brand });

  const createBrandRes = await mfosClient('mutation')(
    {
      create_brands_item: [
        {
          data: $('brand', 'create_brands_input!'),
        },
        brandSelector,
      ],
    },
    {
      operationName: 'createBrand',
      variables: {
        brand,
      },
    },
  );

  if (!createBrandRes.create_brands_item) {
    throw new Error('Failed to create Brand');
  }

  return createBrandRes.create_brands_item;
};
