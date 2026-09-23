/**
 * DUGA ウェブサービス API 型定義
 */

export interface DugaImageSizes {
  small?: string;
  midium?: string;
  large?: string;
}

export interface DugaThumbnail {
  image?: string | string[];
}

export interface DugaSampleMovie {
  movie?: string;
  capture?: string;
}

export interface DugaNamedEntity {
  id?: string | number;
  name?: string;
}

export interface DugaPerformerEntity extends DugaNamedEntity {
  kana?: string;
}

export interface DugaSaleTypeEntry {
  type?: string;
  price?: string | number;
}

export interface DugaReview {
  rating?: string | number;
  reviewer?: string | number;
}

export interface DugaRanking {
  total?: string | number;
}

export interface DugaMylist {
  total?: string | number;
}

export interface DugaItem {
  productid?: string;
  title?: string;
  originaltitle?: string;
  caption?: string;
  makername?: string;
  url?: string;
  affiliateurl?: string;
  opendate?: string;
  releasedate?: string;
  itemno?: string;
  price?: string;
  volume?: string | number;
  posterimage?: DugaImageSizes;
  jacketimage?: DugaImageSizes;
  thumbnail?: DugaThumbnail;
  samplemovie?: DugaSampleMovie;
  label?: DugaNamedEntity & { number?: string | number };
  category?: { data?: DugaNamedEntity | DugaNamedEntity[] };
  series?: DugaNamedEntity;
  performer?: { data?: DugaPerformerEntity | DugaPerformerEntity[] };
  director?: { data?: DugaNamedEntity | DugaNamedEntity[] };
  saletype?: { data?: DugaSaleTypeEntry | DugaSaleTypeEntry[] };
  ranking?: DugaRanking | DugaRanking[];
  review?: DugaReview | DugaReview[];
  mylist?: DugaMylist | DugaMylist[];
}

export interface DugaSearchResponse {
  hits?: string | number;
  count?: string | number;
  offset?: string | number;
  timestamp?: string;
  items?: Array<{ item?: DugaItem } | DugaItem>;
  error?: string;
}

export interface DugaSearchParams {
  version?: string;
  timestamp?: string;
  appid?: string;
  agentid?: string;
  bannerid?: string;
  format?: string;
  keyword?: string;
  hits?: string | number;
  offset?: string | number;
  adult?: string | number;
  sort?: string;
  target?: string;
  category?: string;
  device?: string;
  labelid?: string;
  seriesid?: string;
  performerid?: string;
  openstt?: string;
  openend?: string;
  releasestt?: string;
  releaseend?: string;
}
