import { GraphQLTypes, InputType, Selector } from '../__generated__/user/zeus';
import { fileSelector } from '../files/selectors';

export const productsSelector = Selector('products')({
  id: true,
  name: true,
  description: true,
  shopify_id: true,
  notion_id: true,
});
export type CreateProductRes = InputType<
  GraphQLTypes['products'],
  typeof productsSelector
>;
export const productsFilesSelector = Selector('products')({
  ...productsSelector,
  clo3d_file: [
    {},
    {
      id: true,
      filename_download: true,
    },
  ],
  content: [
    {},
    {
      id: true,
      directus_files_id: [{}, { id: true, filename_download: true }],
    },
  ],
  design_files: [
    {},
    {
      id: true,
      directus_files_id: [{}, { id: true, filename_download: true }],
    },
  ],
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
export const collaboratorRolesSelector = Selector('collaborator_roles')({
  name: true,
  id: true,
});
export type CollaboratorRole = InputType<
  GraphQLTypes['collaborator_roles'],
  typeof collaboratorRolesSelector
>;
export const collaboratorsSelector = Selector('collaborators')({
  id: true,
  role: [{}, collaboratorRolesSelector],
  display_name: true,
  payment_eth_address: true,
  account: [
    {},
    {
      id: true,
      first_name: true,
    },
  ],
});
export type CollaboratorResult = InputType<
  GraphQLTypes['collaborators'],
  typeof collaboratorsSelector
>;
export const productsContributorsSelector = Selector('products')({
  ...productsSelector,
  brand_id: [
    {},
    {
      id: true,
      name: true,
      eth_address: true,
    },
  ],
  contributors: [
    {},
    {
      id: true,
      contribution_share: true,
      collaborators_id: [{}, collaboratorsSelector],
    },
  ],
});
export type ProductWithContributors = InputType<
  GraphQLTypes['products'],
  typeof productsContributorsSelector
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
  contributors: [
    { sort: ['-contribution_share'] },
    {
      contribution_share: true,
      collaborators_id: [
        {},
        {
          display_name: true,
          role: [{}, { name: true }],
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
