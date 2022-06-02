// Generated by ts-to-zod
import fetch from 'node-fetch';
import { z } from 'zod';

import { FileData } from '../types/wearables';

export const githubContentsSchema = z.array(
  z.object({
    name: z.string(),
    path: z.string(),
    sha: z.string(),
    size: z.number(),
    url: z.string().url(),
    html_url: z.string().url(),
    git_url: z.string().url(),
    download_url: z.string().url(),
    type: z.string(),
    _links: z.object({
      self: z.string(),
      git: z.string(),
      html: z.string(),
    }),
  }),
);

const baseUrl =
  'https://api.github.com/repos/MetaFactoryAI/mf-wearables/contents';

export const getFiles = async (wearableUrl: string): Promise<FileData[]> => {
  const folderName = wearableUrl.split(/\S*main\//g)[1];
  const res = await fetch(`${baseUrl}/${folderName}`);

  try {
    const json: unknown = await res.json();
    const files = githubContentsSchema.parse(json);
    return files.map(formatFileMetadata);
  } catch (e) {
    console.warn('Unable to get files from URL', wearableUrl, e);
    return [];
  }
};

export const EXTENSION_MIME_TYPES = {
  glb: 'model/gltf-binary',
  usdz: 'model/vnd.usd+zip',
  png: 'image/png',
  jpg: 'image/jpg',
  fbx: 'application/octet-stream',
};

type FileExtension = keyof typeof EXTENSION_MIME_TYPES;

const EXTENSION_DESCRIPTIONS: Record<FileExtension, string> = {
  glb: 'a GLTF file for Webaverse, NeosVR, etc',
  usdz: 'a USD file for AR',
  png: 'a texture file for VRoid Studio',
  jpg: 'Texture file of original design',
  fbx: 'FBX file for 3D software (Blender, Unreal Engine, etc)',
};

export const formatFileMetadata = (
  data: z.infer<typeof githubContentsSchema.element>,
): FileData => {
  const fileExtension = /[^.]+$/.exec(data.name)?.[0] as FileExtension;
  if (!fileExtension) throw new Error('Invalid File Name');

  const mimeType = EXTENSION_MIME_TYPES[fileExtension];
  if (!mimeType) throw new Error('Unsupported file format');

  return {
    mimeType,
    uri: data.download_url,
    properties: {
      description: EXTENSION_DESCRIPTIONS[fileExtension],
    },
  };
};
