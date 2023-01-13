import { FileRes } from 'services/mfos/files/selectors';
import assert from 'assert';
import { FILES_BASE_URL } from '../config/public';

export const EXTENSION_MIME_TYPES = {
  glb: 'model/gltf-binary',
  usdz: 'model/vnd.usd+zip',
  png: 'image/png',
  jpg: 'image/jpg',
  fbx: 'application/octet-stream',
  zprj: 'application/octet-stream',
};
export type FileExtension = keyof typeof EXTENSION_MIME_TYPES;
export const EXTENSION_DESCRIPTIONS: Record<FileExtension, string> = {
  glb: 'a GLTF file for Webaverse, NeosVR, etc',
  usdz: 'a USD file for AR',
  png: 'a texture file for VRoid Studio',
  jpg: 'Texture file of original design',
  fbx: 'FBX file for 3D software (Blender, Unreal Engine, etc)',
  zprj: 'a project file for CLO3D / Marvelous Designer',
};

export const getUrlForFile = (file: FileRes | null | undefined): string => {
  if (!file) return '';
  assert(file.id, 'Invalid File');
  return `${FILES_BASE_URL}/${file.id}`;
};
