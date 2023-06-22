import assert from 'assert';

import { MfosFile } from 'services/mfos/files/selectors';

import { FILES_BASE_URL } from '../config/public';

export const EXTENSION_MIME_TYPES = {
  glb: 'model/gltf-binary',
  vrm: 'model/gltf-binary',
  usdz: 'model/vnd.usd+zip',
  png: 'image/png',
  jpg: 'image/jpg',
  fbx: 'application/octet-stream',
  zprj: 'application/octet-stream',
  html: 'text/html',
};
export type FileExtension = keyof typeof EXTENSION_MIME_TYPES;
export const EXTENSION_DESCRIPTIONS: Record<FileExtension, string> = {
  glb: 'a GLTF file for Webaverse, NeosVR, etc',
  vrm: 'a rigged character model for any VRM-compatible software',
  usdz: 'a USD file for AR',
  png: 'a texture file for VRoid Studio',
  jpg: 'Texture file of original design',
  fbx: 'FBX file for 3D software (Blender, Unreal Engine, etc)',
  zprj: 'a project file for CLO3D / Marvelous Designer',
  html: 'an HTML file to render the wearable in a browser',
};

export const getUrlForFile = (
  file: MfosFile | null | undefined,
  downloadName?: string,
): string => {
  if (!file) return '';
  assert(file.id, 'Invalid File');
  const extension = file.filename_download.split('.').pop();
  const fileName = downloadName
    ? `${formatUrlSafeFileName(downloadName)}.${extension}`
    : file.filename_download;

  return `${FILES_BASE_URL}/${file.id}/${fileName}`;
};
export const formatUrlSafeFileName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
