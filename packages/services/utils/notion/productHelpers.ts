import { z } from 'zod';

import { Creator, FileData } from '../../types/wearables';
import {
  BrandPage,
  DesignerPage,
  ProductPage,
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

export const getProductShopLink = (page: z.infer<typeof ProductPage>): string =>
  page.properties['Shopify Link'].url;

export const getProductShopifyId = (
  page: z.infer<typeof ProductPage>,
): string => getProductShopLink(page)?.split(/\S*\//g)[1];

export const getProductReleaseDate = (
  page: z.infer<typeof ProductPage>,
): string | undefined => page.properties['Drop Date'].date?.start;

export const getProductEditionOf = (
  page: z.infer<typeof ProductPage>,
): string => getTextValue(page.properties['QTY/Edition'].rich_text);

export const getSiloChipVersion = (
  page: z.infer<typeof ProductPage>,
): string | undefined => page.properties['SiLo Chip'].select?.name;

export const getProductDescription = (
  page: z.infer<typeof ProductPage>,
): string => getTextValue(page.properties.Description.rich_text);

export const getProductBrand = (
  page: z.infer<typeof ProductPage>,
): { id: string; url: string; name: string } => {
  const brandPage = BrandPage.parse(
    page.properties['Brand Rel'].relation[0].value,
  );

  return {
    id: brandPage.id,
    url: brandPage.url,
    name: getTextValue(brandPage.properties.Name.title),
  };
};

export const getProductDesigner = (
  page: z.infer<typeof ProductPage>,
): Creator | null => {
  const designerRelation =
    page.properties['Designer Rel [NEW]'].relation[0]?.value;

  if (!designerRelation) return null;

  const designerPage = DesignerPage.parse(designerRelation);

  return {
    name: getTextValue(designerPage.properties.Name.title),
    url: designerPage.properties.Social.url,
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
    name: getTextValue(techPage.properties.Name.title),
    url: techPage.properties.Social.url,
    role: 'Technician',
  };
};

export const getClo3dModel = (page: z.infer<typeof ProductPage>): FileData => ({
  uri: page.properties['CLO3d Model'].files[0]?.file.url,
  mimeType: 'application/octet-stream',
  properties: {
    description: 'CLO3D / Marvelous Designer Project File',
  },
});

export const getProductImages = (page: z.infer<typeof ProductPage>): string[] =>
  page.properties['3D Static'].files.map((f) => f.file.url);

export const getWearablesFolder = (
  page: z.infer<typeof ProductPage>,
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
