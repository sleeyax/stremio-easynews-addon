// Generated using: https://app.quicktype.io/.

export type EasynewsSearchResponse = {
  sid: string;
  results: number;
  perPage: string;
  numPages: number;
  dlFarm: string;
  dlPort: number;
  baseURL: string;
  downURL: string;
  thumbURL: string;
  page: number;
  groups: { [key: string]: number }[];
  data: FileData[];
  returned: number;
  unfilteredResults: number;
  hidden: number;
  classicThumbs: string;
  fields: Fields;
  hthm: number;
  hInfo: number;
  st: string;
  sS: string;
  stemmed: string;
  largeThumb: string;
  largeThumbSize: string;
  gsColumns: GsColumn[];
};

export type FileData = {
  '0': string;
  '1': string;
  '2': FileExtension;
  '3': string;
  '4': string;
  '5': string;
  '6': string;
  '7': string;
  '8': string;
  '9': Group;
  '10': string;
  '11': FileExtension;
  '12': CompressionStandard;
  '13': string;
  '14': string;
  '15': number;
  '16': number;
  '17': number;
  '18': CodingFormat;
  '19': string;
  '20': The20;
  '35': string;
  type: ContentType;
  height: string;
  width: string;
  theight: number;
  twidth: number;
  fullres: string;
  alangs: string[] | null;
  slangs: null;
  passwd: boolean;
  virus: boolean;
  expires: The20;
  nfo: string;
  ts: number;
  rawSize: number;
  volume: boolean;
  sc: boolean;
  primaryURL: URL;
  fallbackURL: URL;
  sb: number;
  size: number;
  runtime: number;
  sig: string;
};

export enum FileExtension {
  AVI = '.avi',
  Mkv = '.mkv',
  Mp4 = '.mp4',
}

export enum CompressionStandard {
  H264 = 'H264',
  Xvid = 'XVID',
}

export enum CodingFormat {
  AAC = 'AAC',
  Mp3 = 'MP3',
  Mpg123 = 'MPG123',
  Unknown = 'UNKNOWN',
}

export enum The20 {
  The8734 = '&#8734;',
}

export enum Group {
  AltBinariesBonelessAltBinariesMisc = 'alt.binaries.boneless alt.binaries.misc',
  AltBinariesBonelessAltBinariesMiscAltBinariesNl = 'alt.binaries.boneless alt.binaries.misc alt.binaries.nl',
  AltBinariesBonelessAltBinariesMultimedia = 'alt.binaries.boneless alt.binaries.multimedia',
  AltBinariesBonelessAltBinariesNewzbin = 'alt.binaries.boneless alt.binaries.newzbin',
  AltBinariesDVDAltBinariesNlAltBinariesX = 'alt.binaries.dvd alt.binaries.nl alt.binaries.x',
  AltBinariesMiscAltBinariesNl = 'alt.binaries.misc alt.binaries.nl',
  AltBinariesMultimedia = 'alt.binaries.multimedia',
  AltBinariesMultimediaAltBinariesTeevee = 'alt.binaries.multimedia alt.binaries.teevee',
  AltBinariesNl = 'alt.binaries.nl',
  AltBinariesWtfnzbDelta = 'alt.binaries.wtfnzb.delta',
}

export enum URL {
  MembersEasynewsCOM = '//members.easynews.com',
}

export enum ContentType {
  Video = 'VIDEO',
}

export type Fields = {
  '2': string;
  '3': string;
  '4': string;
  '5': string;
  '6': string;
  '7': string;
  '9': string;
  '10': string;
  '12': string;
  '14': string;
  '15': string;
  '16': string;
  '17': string;
  '18': string;
  '20': string;
  FullThumb: string;
};

export type GsColumn = {
  num: number;
  name: string;
};
