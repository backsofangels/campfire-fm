export interface AudioFile {
  id: string;
  filename: string;
  url: string;
}

export interface ClipConfig {
  file: string;
  loop: boolean;
  defaultVolume: number;
}

export interface Collection {
  id: string;
  name: string;
  clips: ClipConfig[];
}

export interface CollectionsFile {
  collections: Collection[];
}