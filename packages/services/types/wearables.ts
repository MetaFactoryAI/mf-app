export interface WearableMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  properties: {
    brand: string;
    // season: string | undefined,
    style: string | undefined;
    composition: string | undefined;
    shopLink: string | undefined;
    madeIn: string | undefined;
    releaseDate: string | undefined;
    creators: Creator[];
    images: string[];
  };
  files: FileData[];
}

export interface Creator {
  name: string;
  role: string;
  share?: number;
  url?: string | null;
}

export type FileData = {
  mimeType: string;
  uri: string;
  properties: {
    description: string;
  };
};
