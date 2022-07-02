import assert from 'assert';

import { FileRes, ProductNftMetadataInfo } from '../lib/selectors';
import { COLLABORATOR_ROLES } from '../mfos';
import { Creator, FileData, WearableMetadata } from '../types/wearables';
import { CONFIG } from './config';
import { EXTENSION_MIME_TYPES } from './filesHelpers';
import { composeListIntoString } from './stringHelpers';

export const getUrlForFile = (file: FileRes | null | undefined): string => {
  if (!file) return '';
  assert(file.id, 'Invalid File');
  return `${CONFIG.mfosUrl}/assets/${file.id}`;
};

export const getWearableShopLink = (shopifyId: string): string =>
  `https://shop.metafactory.ai/products/${shopifyId}`;

export const getMetadataForProduct = (
  product: ProductNftMetadataInfo,
): WearableMetadata => {
  assert(product, 'No product found');

  const images = (product.images || []).map((i) =>
    getUrlForFile(i.directus_files_id),
  );

  const wearables: FileData[] = (product.wearable_files || []).map(
    ({ directus_files_id: file, file_format }) => ({
      name: file?.filename_download || file?.id || 'Untitled',
      extension: file_format?.extension || '',
      mimeType: file_format?.mime_type || '',
      uri: getUrlForFile(file),
      properties: {
        description: file_format?.description || '',
      },
    }),
  );

  const contributors: Creator[] = (product.contributors || []).map((c) => ({
    name: c.collaborators_id?.display_name || '<anonymous>',
    role: c.collaborators_id?.role?.name || 'Collaborator',
    share: c.contribution_share,
  }));
  const designer = composeListIntoString(
    (product.contributors || [])
      .filter(
        (c) =>
          c.collaborators_id?.role?.name === COLLABORATOR_ROLES.designer.name,
      )
      .map((c) => c.collaborators_id?.display_name),
  );
  const technician = composeListIntoString(
    (product.contributors || [])
      .filter(
        (c) =>
          c.collaborators_id?.role?.name ===
          COLLABORATOR_ROLES.productionManager.name,
      )
      .map((c) => c.collaborators_id?.display_name),
  );
  const composition = composeListIntoString(
    product.materials?.map((m) => m.production_materials_id?.composition),
  );

  const madeIn = composeListIntoString(
    product.materials?.map((m) => m.production_materials_id?.made_in),
  );

  return {
    name: product.name,
    image: images[0],
    description:
      product.description ||
      'Interoperable wearable for the open metaverse. Powered by MetaFactory.',
    animation_url: wearables.find(
      (f) => f.mimeType === EXTENSION_MIME_TYPES.glb,
    )?.uri,
    external_url: product.shopify_id
      ? getWearableShopLink(product.shopify_id)
      : undefined,
    properties: {
      brand: product.brand_id?.name,
      composition,
      madeIn: madeIn
        ? {
            name: 'Made In',
            value: madeIn,
          }
        : undefined,
      designer,
      technician,
      creators: contributors,
      releaseDate: product.release_date
        ? {
            name: 'Release Date',
            value: product.release_date as string,
          }
        : undefined,
      images,
    },
    files: wearables,
  };
};
