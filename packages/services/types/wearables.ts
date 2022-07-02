export interface RichProperty {
  name: string;
  value: string | number;
  display_value?: string;
}

export interface WearableMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  properties: {
    brand: string | undefined;
    // season: string | undefined,
    style?: string | undefined;
    composition: string | undefined;
    madeIn: RichProperty | undefined;
    releaseDate: RichProperty | undefined;
    designer: string | undefined;
    technician: string | undefined;
    creators: Creator[];
    images: string[];
  };
  files: FileData[];
}

export interface Creator {
  id?: string;
  name: string;
  role?: string;
  ethAddress?: string;
  share?: number;
  robotEarned?: number;
  url?: string | null;
}

export type FileData = {
  mimeType: string;
  uri: string;
  name: string;
  extension: string;
  properties: {
    description: string;
  };
};
