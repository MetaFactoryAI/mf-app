/* eslint-disable @typescript-eslint/ban-ts-comment */
import { VercelRequest, VercelResponse } from '@vercel/node';

import { notionClient } from '../utils/notion/client';
import { DatabaseResult, PropertyName } from '../utils/notion/parser';
import {
  getClo3dModel,
  getProductBrand,
  getProductDescription,
  getProductDesigner,
  getProductEditionOf,
  getProductHasSiLoChip,
  getProductImages,
  getProductReleaseDate,
  getProductTemplate,
  getProductTitle,
  getProductWearables,
} from '../utils/notion/productHelpers';
import { PageProperty } from '../utils/notion/types';

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  const result = await notionClient.databases.query({
    database_id: '50d380c274dc48efb5576b09470d36c7',
    filter: {
      property: 'Wearable Status',
      select: { equals: 'Done' },
    },
  });

  const properties: Record<string, PageProperty> = {};

  try {
    const parsedResult = await DatabaseResult.parseAsync(result);

    // eslint-disable-next-line no-restricted-syntax
    for (const [propertyName, { id, type }] of Object.entries(
      parsedResult.results[0].properties,
    )) {
      if (properties[propertyName]) {
        throw new Error(`Duplicate ID found: ${propertyName} ${id}`);
      }
      properties[propertyName] = {
        id,
        type,
        propertyName: propertyName as PropertyName,
      };
    }
    const items = parsedResult.results.map((p) => ({
      id: p.id,
      url: p.url,
      name: getProductTitle(p),
      description: getProductDescription(p),
      brand: getProductBrand(p),
      designer: getProductDesigner(p),
      clo3dModel: getClo3dModel(p),
      hasSiLoChip: getProductHasSiLoChip(p),
      baseProduct: getProductTemplate(p),
      images: getProductImages(p),
      editionOf: getProductEditionOf(p),
      wearables: getProductWearables(p),
      releaseDate: getProductReleaseDate(p),
    }));

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    res.status(200).send(items);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};
