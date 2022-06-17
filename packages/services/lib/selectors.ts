import { GraphQLTypes, InputType, Selector } from '../mfos';

export const fileSelector = Selector('directus_files')({
  id: true,
  filename_download: true,
});

export type FileRes = InputType<
  GraphQLTypes['directus_files'],
  typeof fileSelector
>;

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

export const productNftMetadataSelector = Selector('products')({
  id: true,
  nft_token_id: true,
  name: true,
  description: true,
  brand_id: [
    {},
    {
      name: true,
    },
  ],
  clo3d_file: [{}, fileSelector],
  season: true,
  release_date: true,
  shopify_id: true,
  materials: [
    {},
    {
      production_materials_id: [
        {},
        {
          composition: true,
          made_in: true,
          name: true,
        },
      ],
    },
  ],
  collaborators: [
    { sort: ['-collaboration_share'] },
    {
      collaboration_share: true,
      role: [{}, { name: true }],
      collaborator_id: [
        {},
        {
          name: true,
        },
      ],
    },
  ],
  wearable_files: [
    {},
    {
      id: true,
      file_format: [
        {},
        {
          extension: true,
          mime_type: true,
          description: true,
          name: true,
          id: true,
        },
      ],
      directus_files_id: [{}, fileSelector],
    },
  ],
  images: [
    {},
    {
      directus_files_id: [{}, fileSelector],
    },
  ],
});

export type ProductNftMetadataInfo = InputType<
  GraphQLTypes['products'],
  typeof productNftMetadataSelector
>;
