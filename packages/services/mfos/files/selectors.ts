import { GraphQLTypes, InputType, Selector } from '../__generated__/user/zeus';

export const fileSelector = Selector('directus_files')({
  id: true,
  filename_download: true,
  filename_disk: true,
  tags: true,
});
export type FileRes = InputType<
  GraphQLTypes['directus_files'],
  typeof fileSelector
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
