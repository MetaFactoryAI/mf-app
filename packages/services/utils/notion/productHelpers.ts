import { z } from 'zod';

import { Creator, FileData } from '../../types/wearables';
import {
  BrandPage,
  DesignerPage,
  ProductPage,
  ProductPageFiles,
  TemplatePage,
  TextBlock,
} from './parser';

type ProductTemplate = {
  id: string;
  url: string;
  name: string;
  madeIn: string;
  printMethod: string[];
  style: string | undefined;
  composition: string;
};

const getTextValue = (blocks: Array<z.infer<typeof TextBlock>>): string =>
  blocks.map((b) => b.plain_text).join('');

export const getProductTitle = (page: z.infer<typeof ProductPage>): string =>
  getTextValue(page.properties.Name.title);

export const getProductShopLink = (
  page: z.infer<typeof ProductPage>,
): string | null => page.properties['Shopify Link'].url;

export const getProductShopifyId = (
  page: z.infer<typeof ProductPage>,
): string | undefined => getProductShopLink(page)?.split(/\S*\//g)[1];

export const getProductReleaseDate = (
  page: z.infer<typeof ProductPage>,
): string | undefined => page.properties['Drop Date'].date?.start;

export const getProductEditionOf = (
  page: z.infer<typeof ProductPage>,
): string => getTextValue(page.properties['QTY/Edition'].rich_text);

export const getSiloChipVersion = (
  page: z.infer<typeof ProductPage>,
): string | undefined => page.properties['SiLo Chip'].select?.name;

export const getProductPrice = (
  page: z.infer<typeof ProductPage>,
): number | null => page.properties.Price.number;

export const getProductDescription = (
  page: z.infer<typeof ProductPage>,
): string => getTextValue(page.properties.Description.rich_text);

export const getProductStatus = (
  page: z.infer<typeof ProductPage>,
): string | undefined => page.properties.Status.select?.name;

export const getProductBrandId = (
  page: z.infer<typeof ProductPage>,
): string | undefined => page.properties['Brand Rel'].relation[0]?.id;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getProductBrand = (page: z.infer<typeof ProductPage>) => {
  try {
    const brandPage = BrandPage.nullable().parse(
      page.properties['Brand Rel'].relation[0]?.value || null,
    );
    return (
      brandPage && {
        id: brandPage.id,
        url: brandPage.url,
        name: getTextValue(brandPage.properties.Name.title),
        discordUrl: brandPage.properties['Discord Link'].url,
        description: getTextValue(brandPage.properties.Description.rich_text),
        createdAt: brandPage.created_time,
        ethAddress: getTextValue(brandPage.properties['ETH Address'].rich_text),
      }
    );
  } catch (e) {
    throw new Error(
      `Unable to parse brand:  ${JSON.stringify(
        page.properties['Brand Rel'],
        null,
        2,
      )}`,
    );
  }
};

export const getRobot = (page: z.infer<typeof DesignerPage>): Creator => ({
  id: page.id,
  name: getTextValue(page.properties.Name.title),
  ethAddress: getTextValue(page.properties['Eth Address'].rich_text),
});

export const getProductDesigner = (
  page: z.infer<typeof ProductPage>,
): Creator | null => {
  const designerRelation =
    page.properties['Designer Rel [NEW]'].relation[0]?.value;

  if (!designerRelation) return null;

  const designerPage = DesignerPage.parse(designerRelation);

  return {
    ...getRobot(designerPage),
    role: 'Designer',
  };
};

export const getProductTechnician = (
  page: z.infer<typeof ProductPage>,
): Creator | null => {
  const techRelation = page.properties['Technician Rel'].relation[0]?.value;

  if (!techRelation) return null;

  const techPage = DesignerPage.parse(techRelation);

  return {
    ...getRobot(techPage),
    role: 'Technician',
  };
};
export const getProductDesigners = (
  page: z.infer<typeof ProductPage>,
): Creator[] => {
  const designerPages = page.properties['Designer Rel [NEW]'].relation.map(
    (r) => DesignerPage.parse(r.value),
  );

  return designerPages.map(getRobot);
};
export const getProductTechs = (
  page: z.infer<typeof ProductPage>,
): Creator[] => {
  const techPages = page.properties['Technician Rel'].relation.map((r) =>
    DesignerPage.parse(r.value),
  );

  return techPages.map(getRobot);
};

export const getClo3dModel = (page: z.infer<typeof ProductPage>): FileData => ({
  uri: page.properties['CLO3d Model'].files[0]?.file.url,
  name: page.properties['CLO3d Model'].files[0]?.name,
  extension: 'zprj',
  mimeType: 'application/octet-stream',
  properties: {
    description: 'CLO3D / Marvelous Designer Project File',
  },
});

export const getProductImages = (page: z.infer<typeof ProductPage>): string[] =>
  page.properties['3D Static'].files.map((f) => {
    if (f.type === 'file') {
      return f.file.url;
    }
    return f.external.url;
  });

export const getProductProductionCost = (
  page: z.infer<typeof ProductPage>,
): number | null => page.properties['Cost ea.'].number;

export const getProductFulfillment = (
  page: z.infer<typeof ProductPage>,
): string | undefined => page.properties.Fulfillment.select?.name;

export const getWearablesFolder = (
  page: z.infer<typeof ProductPage> | z.infer<typeof ProductPageFiles>,
): string | undefined =>
  page.properties['Wearable Files'].files[0]?.external.url;

export const getProductTemplate = (
  page: z.infer<typeof ProductPage>,
): ProductTemplate | undefined => {
  const templateData = page.properties['Template Rel'].relation[0]?.value;
  if (!templateData) return undefined;

  const template = TemplatePage.parse(templateData);

  return {
    id: template.id,
    url: template.url,
    madeIn: getTextValue(template.properties['Made In'].rich_text),
    name: getTextValue(template.properties.Ref.title),
    printMethod: template.properties['Print Tech'].multi_select.map(
      (m) => m.name,
    ),
    style: template.properties.Style.select?.name,
    composition: getTextValue(template.properties.Composition.rich_text),
  };
};
