import { z } from 'zod';

import {
  BrandPage,
  DesgignerPage,
  ProductPage,
  TemplatePage,
  TextBlock,
} from './parser';

type ProductTemplate = {
  id: string;
  url: string;
  name: string;
  printMethod: string[];
  style: string | undefined;
  composition: string;
};

const getTextValue = (blocks: Array<z.infer<typeof TextBlock>>): string =>
  blocks.map((b) => b.plain_text).join('');

export const getProductTitle = (page: z.infer<typeof ProductPage>): string =>
  getTextValue(page.properties.Name.title);

export const getProductReleaseDate = (
  page: z.infer<typeof ProductPage>,
): string | undefined => page.properties['Drop Date'].date?.start;

export const getProductEditionOf = (
  page: z.infer<typeof ProductPage>,
): string => getTextValue(page.properties['QTY/Edition'].rich_text);

export const getProductHasSiLoChip = (
  page: z.infer<typeof ProductPage>,
): boolean => page.properties['SiLo Chip'].checkbox;

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
): { id: string; url: string; name: string } | null => {
  const designerRelation =
    page.properties['Designer Rel [NEW]'].relation[0]?.value;

  if (!designerRelation) return null;

  const designerPage = DesgignerPage.parse(designerRelation);

  return {
    id: designerPage.id,
    url: designerPage.url,
    name: getTextValue(designerPage.properties.Name.title),
  };
};

export const getClo3dModel = (page: z.infer<typeof ProductPage>): string =>
  page.properties['CLO3d Model'].files[0]?.file.url;

export const getProductImages = (page: z.infer<typeof ProductPage>): string[] =>
  page.properties['3D Static'].files.map((f) => f.file.url);

export const getProductWearables = (
  page: z.infer<typeof ProductPage>,
): string[] => page.properties['Wearable Files'].files.map((f) => f.file.url);

export const getProductTemplate = (
  page: z.infer<typeof ProductPage>,
): ProductTemplate | undefined => {
  const templateData = page.properties['Template Rel'].relation[0]?.value;
  if (!templateData) return undefined;

  const template = TemplatePage.parse(templateData);

  return {
    id: template.id,
    url: template.url,
    name: getTextValue(template.properties.Ref.title),
    printMethod: template.properties['Print Tech'].multi_select.map(
      (m) => m.name,
    ),
    style: template.properties.Style.select?.name,
    composition: getTextValue(template.properties.Composition.rich_text),
  };
};
