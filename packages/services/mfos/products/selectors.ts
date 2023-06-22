import { GraphQLTypes, InputType, Selector } from '../__generated__/user/zeus';
import { fileSelector } from '../files/selectors';

export const productsSelector = Selector('products')({
  id: true,
  name: true,
  description: true,
  product_stage: [{}, { name: true, sort: true }],
  shopify_id: true,
  notion_id: true,
});

export type ProductBase = InputType<
  GraphQLTypes['products'],
  typeof productsSelector
>;

export const productWearableSelector = Selector('products_wearables')({
  id: true,
  file_format: [
    {},
    {
      name: true,
      id: true,
      extension: true,
      mime_type: true,
      description: true,
    },
  ],
  directus_files_id: [{}, fileSelector],
});
export type ProductWearable = InputType<
  GraphQLTypes['products_wearables'],
  typeof productWearableSelector
>;
export const productsFilesSelector = Selector('products')({
  clo3d_file: [{}, fileSelector],
  html_file: [{}, fileSelector],
  thumbnail: [{}, fileSelector],
  vrm_file: [{}, fileSelector],
  wearable_files: [{}, productWearableSelector],
  content: [
    {},
    {
      id: true,
      directus_files_id: [{}, fileSelector],
    },
  ],
  design_files: [
    {},
    {
      id: true,
      directus_files_id: [{}, fileSelector],
    },
  ],
  images: [
    {},
    {
      id: true,
      directus_files_id: [{}, fileSelector],
    },
  ],
});
export type ProductFiles = InputType<
  GraphQLTypes['products'],
  typeof productsFilesSelector
>;

export type ProductWithFiles = ProductBase & ProductFiles;

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
      logo: [{}, fileSelector],
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
      id: true,
    },
  ],
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
  clo3d_file: [{}, fileSelector],
  html_file: [{}, fileSelector],
  thumbnail: [{}, fileSelector],
  vrm_file: [{}, fileSelector],
  wearable_files: [{}, productWearableSelector],
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
