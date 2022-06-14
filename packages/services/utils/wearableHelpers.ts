/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from 'zod';

import { useZeusVariables, ValueTypes } from '../graphql/__generated__/zeus';
import { client } from '../graphql/client';
import { WearableMetadata } from '../types/wearables';
import { EXTENSION_MIME_TYPES, getFiles } from './filesHelpers';
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
  const variables = useZeusVariables({
    shopifyId: 'String!',
    _set: 'robot_product_set_input',
    _append: 'robot_product_append_input',
  })({
    shopifyId,
    _set,
    _append,
  });
  const { $ } = variables;

  const data = await client.mutate(
    {
      update_robot_product: [
        {
          where: { shopify_id: { _eq: $('shopifyId') } },
          _set: $('_set'),
          _append: $('_append'),
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
      variables,
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
  const releaseDate = getProductReleaseDate(p);
  return {
    name: getProductTitle(p),
    image: images[0],
    description: getProductDescription(p),
    animation_url: files.find((f) => f.mimeType === EXTENSION_MIME_TYPES.glb)
      ?.uri,
    external_url: getProductShopLink(p) || undefined,
    properties: {
      brand: getProductBrand(p)?.name || undefined,
      style: blank?.style,
      composition: blank?.composition,
      madeIn: blank?.madeIn
        ? {
            name: 'Made In',
            value: blank.madeIn,
          }
        : undefined,
      designer: designer?.name,
      technician: tech?.name,
      creators: [designer, tech].filter(isNotNullOrUndefined),
      releaseDate: releaseDate
        ? {
            name: 'Release Date',
            value: releaseDate,
          }
        : undefined,
      images,
    },
    files: [getClo3dModel(p), ...files],
  };
};
