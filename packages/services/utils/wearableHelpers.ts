/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from 'zod';

import { $, ValueTypes } from '../graphql/__generated__/zeus';
import { client } from '../graphql/client';
import { WearableMetadata } from '../types/wearables';
import { getFiles } from './filesHelpers';
import { ProductPage } from './notion/parser';
import {
  getClo3dModel,
  getProductBrand,
  getProductDescription,
  getProductDesigner,
  getProductImages,
  getProductReleaseDate,
  getProductShopLink,
  getProductTechnician,
  getProductTemplate,
  getProductTitle,
  getWearablesFolder,
} from './notion/productHelpers';
import { isNotNullOrUndefined } from './typeHelpers';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const updateProduct = async (
  shopifyId: string,
  _set: ValueTypes['robot_product_set_input'],
  _append: ValueTypes['robot_product_append_input'] = {},
) => {
  const data = await client.mutate(
    {
      update_robot_product: [
        {
          where: { shopify_id: { _eq: $`shopifyId` } },
          _set: $`_set`,
          _append: $`_append`,
        },
        {
          affected_rows: true,
          returning: {
            title: true,
            nft_metadata: [{}, true],
          },
        },
      ],
    },
    {
      operationName: 'updateProduct',
      variables: { shopifyId, _set, _append },
    },
  );

  return data.update_robot_product;
};

export const generateWearableMetadata = async (
  p: z.infer<typeof ProductPage>,
): Promise<WearableMetadata> => {
  const blank = getProductTemplate(p);
  const designer = getProductDesigner(p);
  const tech = getProductTechnician(p);
  const images = getProductImages(p);
  const wearablesFolder = getWearablesFolder(p);
  const files = wearablesFolder ? await getFiles(wearablesFolder) : [];

  return {
    name: getProductTitle(p),
    image: images[0],
    description: getProductDescription(p),
    animation_url: files[0]?.uri,
    properties: {
      brand: getProductBrand(p).name,
      style: blank?.style,
      composition: blank?.composition,
      shopLink: getProductShopLink(p),
      madeIn: blank?.madeIn,
      creators: [designer, tech].filter(isNotNullOrUndefined),
      releaseDate: getProductReleaseDate(p),
      images,
    },
    files: [getClo3dModel(p), ...files],
  };
};
