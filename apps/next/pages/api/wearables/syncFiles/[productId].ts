import { VercelRequest, VercelResponse } from '@vercel/node';

import { getMetadataForProduct } from 'shared/utils/wearableMetadata';

import { ValueTypes } from 'services/mfos';
import { mfosClient } from 'services/mfos/client';
import { fileFormatsSelector } from 'services/mfos/files/selectors';
import {
  productNftMetadataSelector,
  productsFilesSelector,
} from 'services/mfos/products/selectors';
import { deleteFiles, uploadFile } from 'services/mfos/system/mutations';
import { getWearablesFolder } from 'services/mfos/system/queries';
import { getWearableFilesFromGithubForProduct } from 'services/utils/filesHelpers';
import { logger } from 'services/utils/logger';
import { isNotNullOrUndefined } from 'services/utils/typeHelpers';

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  const productId = req.query.productId as string;
  try {
    const wearableFiles = await getWearableFilesFromGithubForProduct(productId);

    const { products_by_id: product, file_formats: formats } = await mfosClient(
      'query',
    )({
      products_by_id: [
        { id: productId },
        {
          id: true,
          name: true,
          ...productsFilesSelector,
        },
      ],
      file_formats: [{}, fileFormatsSelector],
    });

    if (!product) {
      res.status(404).send(`Product not found`);
      return;
    }
    const wearablesFolder = await getWearablesFolder();
    const fileIdsToDelete: string[] = [];
    const updateProductData: ValueTypes['update_products_input'] = {};

    const htmlFile = wearableFiles.find((file) => file.extension === 'html');
    if (htmlFile) {
      const htmlFileUpload = await uploadFile(
        { name: htmlFile.name, url: htmlFile.uri },
        ['html', 'wearable'],
        wearablesFolder,
      );
      logger.info('Uploaded HTML wearable file', { htmlFileUpload, productId });

      updateProductData.html_file = { id: htmlFileUpload.id };
      if (product.html_file) {
        fileIdsToDelete.push(product.html_file.id);
      }
    }

    const vrmFile = wearableFiles.find((file) => file.extension === 'vrm');
    if (vrmFile) {
      const vrmFileUpload = await uploadFile(
        { name: vrmFile.name, url: vrmFile.uri },
        ['vrm', 'wearable'],
        wearablesFolder,
      );
      logger.info('Uploaded VRM wearable file', { vrmFileUpload, productId });

      updateProductData.vrm_file = { id: vrmFileUpload.id };
      if (product.vrm_file) {
        fileIdsToDelete.push(product.vrm_file.id);
      }
    }

    const thumbnail = wearableFiles.find((file) =>
      file.name.endsWith('_a.png'),
    );
    if (thumbnail) {
      const thumbnailUpload = await uploadFile(
        { name: thumbnail.name, url: thumbnail.uri },
        ['thumbnail', 'wearable'],
        wearablesFolder,
      );
      logger.info('Uploaded wearable thumbnail file', {
        thumbnailUpload,
        productId,
      });

      updateProductData.thumbnail = { id: thumbnailUpload.id };
      if (product.thumbnail) {
        fileIdsToDelete.push(product.thumbnail.id);
      }
    }

    const otherFiles = wearableFiles.filter(
      (file) => ![htmlFile, vrmFile, thumbnail].includes(file),
    );

    if (otherFiles.length) {
      const otherFilesUpload = await Promise.all(
        otherFiles.map((file) =>
          uploadFile(
            { name: file.name, url: file.uri },
            ['wearable'],
            wearablesFolder,
          ),
        ),
      );
      logger.info('Uploaded other wearable files', {
        otherFilesUpload,
        productId,
      });

      updateProductData.wearable_files = otherFilesUpload.map((file, i) => ({
        directus_files_id: file,
        file_format: formats.find(
          (format) => format.extension === otherFiles[i].extension,
        ),
      }));

      if (product.wearable_files) {
        const oldFileIds = product.wearable_files
          .map((file) => file?.directus_files_id?.id)
          .filter(isNotNullOrUndefined);
        fileIdsToDelete.push(...oldFileIds);
      }
    }

    const updatedProductRes = await mfosClient('mutation')(
      {
        update_products_item: [
          {
            id: product.id,
            data: updateProductData,
          },
          productNftMetadataSelector,
        ],
      },
      {
        operationName: 'UpdateProductNftFiles',
      },
    );

    logger.info('Deleting old wearable files', { fileIdsToDelete, productId });
    await deleteFiles(fileIdsToDelete);

    const result = updatedProductRes.update_products_item
      ? getMetadataForProduct(updatedProductRes.update_products_item)
      : null;
    res.status(200).send(result);
  } catch (e) {
    logger.warn('Failed to fetch wearable files from GitHub', {
      error: e,
    });
    res.status(500).send(`Unable to fetch files from GitHub`);
  }
};
