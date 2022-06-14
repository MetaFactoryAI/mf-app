import { GraphQLTypes, InputType, Selector } from '@mf/cms';

export const brandSelector = Selector('brands')({
  id: true,
  name: true,
  eth_address: true,
  description: true,
  notion_id: true,
  discord_url: true,
  created_at: true,
});

export type CreateBrandRes = InputType<
  GraphQLTypes['brands'],
  typeof brandSelector
>;

export const productsSelector = Selector('products')({
  id: true,
  name: true,
  description: true,
  notion_id: true,
});

export type CreateProductRes = InputType<
  GraphQLTypes['products'],
  typeof productsSelector
>;

export const productsFilesSelector = Selector('products')({
  id: true,
  name: true,
  notion_id: true,
  wearable_files: [
    {},
    {
      id: true,
      file_format: [{}, { name: true, id: true, extension: true }],
      directus_files_id: [{}, { id: true, filename_download: true }],
    },
  ],
  images: [
    {},
    {
      id: true,
      directus_files_id: [
        {},
        {
          id: true,
          filename_download: true,
        },
      ],
    },
  ],
});

export type ProductWithFiles = InputType<
  GraphQLTypes['products'],
  typeof productsFilesSelector
>;

export const fileFormatsSelector = Selector('file_formats')({
  id: true,
  name: true,
  mime_type: true,
  extension: true,
});
export type FileFormat = InputType<
  GraphQLTypes['file_formats'],
  typeof fileFormatsSelector
>;
