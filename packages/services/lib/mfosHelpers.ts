/* eslint-disable no-await-in-loop */
import { Client, createSystemClient, ValueTypes } from '@mf/cms';
import assert from 'assert';

import { useZeusVariables } from '../graphql/__generated__/zeus';
import { CONFIG } from '../utils/config';
import { getFiles } from '../utils/filesHelpers';
import { logger } from '../utils/logger';
import { getWearablesFolder } from '../utils/notion/productHelpers';
import { ProductPageFile } from './notionHelpers';
import {
  brandSelector,
  CreateBrandRes,
  CreateProductRes,
  fileFormatsSelector,
  productsSelector,
  ProductWithFiles,
} from './selectors';

const systemClient = createSystemClient(
  CONFIG.mfosSystemGraphqlUrl,
  CONFIG.mfosGraphqlToken,
);

export const createBrandIfNotExists = async (
  client: Client,
  brand: ValueTypes['create_brands_input'],
): Promise<CreateBrandRes> => {
  assert(brand.notion_id, 'notion_id required');
  const variables = useZeusVariables({
    brand: 'create_brands_input!',
  })({
    brand,
  });

  const existingBrand = await client.query({
    brands: [
      { filter: { notion_id: { _eq: brand.notion_id } } },
      brandSelector,
    ],
  });

  if (existingBrand.brands?.[0]) {
    return existingBrand.brands[0];
  }

  const createBrandRes = await client.mutate(
    {
      create_brands_item: [
        {
          data: variables.$('brand'),
        },
        brandSelector,
      ],
    },
    {
      operationName: 'createBrand',
      variables,
    },
  );

  if (!createBrandRes.create_brands_item) {
    throw new Error('Failed to create Brand');
  }

  return createBrandRes.create_brands_item;
};

export const createProductIfNotExists = async (
  client: Client,
  product: ValueTypes['create_products_input'],
): Promise<CreateProductRes> => {
  assert(product.notion_id, 'notion_id required');
  const variables = useZeusVariables({
    product: 'create_products_input!',
  })({
    product,
  });

  const existingQuery = await client.query({
    products: [
      { filter: { notion_id: { _eq: product.notion_id } } },
      productsSelector,
    ],
  });

  const existing = existingQuery.products?.[0];

  if (existing?.id) {
    const updateVariables = useZeusVariables({
      product: 'update_products_input!',
    })({
      product,
    });

    const updatedRes = await client.mutate(
      {
        update_products_item: [
          { id: existing.id, data: variables.$('product') },
          productsSelector,
        ],
      },
      {
        operationName: 'updateProduct',
        variables: updateVariables,
      },
    );
    assert(updatedRes.update_products_item, 'Unable to update product');
    return updatedRes.update_products_item;
  }

  const createRes = await client.mutate(
    {
      create_products_item: [
        {
          data: variables.$('product'),
        },
        productsSelector,
      ],
    },
    {
      operationName: 'createProduct',
      variables,
    },
  );

  if (!createRes.create_products_item) {
    throw new Error('Failed to create Product');
  }

  return createRes.create_products_item;
};

async function uploadFile(
  file: { name: string; url: string },
  tags?: string[],
) {
  const uploadDate = new Date().toISOString();
  const importFileVariables = useZeusVariables({
    data: 'create_directus_files_input!',
  })({
    data: {
      filename_download: file.name,
      storage: 'ipfs',
      uploaded_on: uploadDate,
      modified_on: uploadDate,
      tags,
    },
  });

  const uploaded = await systemClient.mutate(
    {
      import_file: [
        {
          url: file.url,
          data: importFileVariables.$('data'),
        },
        {
          id: true,
          filename_download: true,
          storage: true,
          uploaded_on: true,
          modified_on: true,
        },
      ],
    },
    {
      operationName: 'UploadFile',
      variables: importFileVariables,
    },
  );
  assert(uploaded.import_file);
  return uploaded.import_file;
}

export const uploadImagesForProduct = async (
  client: Client,
  product: ProductWithFiles,
  productPage: ProductPageFile,
): Promise<void> => {
  const notionImages = productPage.properties['3D Static'].files.map((f) => {
    if (f.type === 'file') {
      return { name: f.name, url: f.file.url };
    }
    return { name: f.name, url: f.external.url };
  });

  const imagesToUpload = notionImages.filter(
    (i) =>
      !product.images?.find(
        (img) => img.directus_files_id?.filename_download === i.name,
      ),
  );

  logger.info(
    `Uploading ${imagesToUpload.length} out of ${notionImages.length} images for ${product.name}.`,
  );

  try {
    for (const i of imagesToUpload) {
      const file = await uploadFile(i, ['productImage']);

      const linkFileVariables = useZeusVariables({
        data: 'create_products_files_input!',
      })({
        data: {
          directus_files_id: file,
          products_id: {
            id: product.id,
            name: product.name,
          },
        },
      });

      const linkedToFile = await client.mutate(
        {
          create_products_files_item: [
            {
              data: linkFileVariables.$('data'),
            },
            {
              id: true,
            },
          ],
        },
        {
          operationName: 'LinkFileToProduct',
          variables: linkFileVariables,
        },
      );
      logger.info(
        `uploaded image and linked to file`,
        linkedToFile.create_products_files_item,
      );
    }
  } catch (e) {
    logger.warn('Failed to upload image', { error: e, product, productPage });
  }
};

export const uploadWearablesForProduct = async (
  client: Client,
  product: ProductWithFiles,
  productPage: ProductPageFile,
): Promise<void> => {
  const wearablesFolder = getWearablesFolder(productPage);
  if (!wearablesFolder) {
    logger.info('No wearables for product, skipping', {
      product: product.name,
    });
    return;
  }
  const wearableFiles = await getFiles(wearablesFolder);

  const wearablesToUpload = wearableFiles.filter(
    (file) =>
      !product.wearable_files?.find(
        (f) => f.directus_files_id?.filename_download === file.name,
      ),
  );

  const { file_formats: formats } = await client.query({
    file_formats: [{}, fileFormatsSelector],
  });

  assert(formats, 'unable to get file formats');

  logger.info(
    `Uploading ${wearablesToUpload.length} out of ${wearablesToUpload.length} wearables for ${product.name}.`,
  );

  try {
    for (const wearable of wearablesToUpload) {
      const file = await uploadFile(
        { name: wearable.name, url: wearable.uri },
        ['wearable'],
      );

      const linkWearableVariables = useZeusVariables({
        data: 'create_products_wearables_input!',
      })({
        data: {
          directus_files_id: file,
          file_format: formats.find((f) => f.extension === wearable.extension),
          products_id: {
            id: product.id,
            name: product.name,
          },
        },
      });

      await client.mutate(
        {
          create_products_wearables_item: [
            {
              data: linkWearableVariables.$('data'),
            },
            {
              id: true,
            },
          ],
        },
        {
          operationName: 'LinkWearableToProduct',
          variables: linkWearableVariables,
        },
      );
    }
  } catch (e) {
    logger.warn('Failed to upload wearable', {
      error: e,
      product,
      productPage,
    });
  }
};