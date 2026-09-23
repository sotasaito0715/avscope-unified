/**
 * DMM API関連の型定義
 */

export interface DMMItem {
  service_code: string;
  service_name: string;
  floor_code: string;
  floor_name: string;
  category_name: string;
  content_id: string;
  product_id: string;
  title: string;
  volume: string;
  caption?: string;
  review: {
    count: number;
    average: string;
  };
  URL: string;
  affiliateURL: string;
  imageURL: {
    list: string;
    small: string;
    large: string;
  };
  sampleImageURL: {
    sample_s: {
      image: string[];
    };
    sample_l: {
      image: string[];
    };
  };
  sampleMovieURL: {
    size_476_306: string;
    size_560_360: string;
    size_644_414: string;
    size_720_480: string;
    pc_flag: number;
    sp_flag: number;
  };
  prices: {
    price: string;
    list_price: string;
    deliveries: {
      delivery: {
        type: string;
        price: string;
        list_price: string;
      }[];
    };
  };
  date: string;
  iteminfo: {
    genre: {
      id: number;
      name: string;
    }[];
    series: {
      id: number;
      name: string;
    }[];
    maker: {
      id: number;
      name: string;
    }[];
    label: {
      id: number;
      name: string;
    }[];
    actress: {
      id: number;
      name: string;
      ruby: string;
    }[];
    director: {
      id: number;
      name: string;
      ruby: string;
    }[];
    author: {
      id: number;
      name: string;
      ruby: string;
    }[];
  };
}

export interface DMMResponse {
  items: DMMItem[];
  total_count: number;
  result_count: number;
  status: number;
}

export interface ActressInfo {
  id: string;
  name: string;
  ruby: string;
  bust: string;
  cup: string;
  waist: string;
  hip: string;
  height: string;
  birthday: string | null;
  blood_type: string | null;
  hobby: string | null;
  prefectures: string | null;
  imageURL?: {
    small?: string;
    large?: string;
  };
  listURL?: {
    digital?: string;
    monthly?: string;
    mono?: string;
  };
}

export interface ActressResponse {
  status: string;
  result_count: number;
  total_count: string;
  first_position: number;
  actress: ActressInfo[];
}

export interface FetchItemsParams {
  sort?: string;
  keyword?: string;
  hits?: number;
  page?: number;
  article?: string;
  article_id?: string;
}

export interface FetchActressParams {
  actress_id?: string;
  keyword?: string;
  gte_bust?: string;
  lte_bust?: string;
  gte_waist?: string;
  lte_waist?: string;
  gte_hip?: string;
  lte_hip?: string;
  gte_height?: string;
  lte_height?: string;
  gte_birthday?: string;
  lte_birthday?: string;
  sort?: string;
  hits?: number;
  offset?: number;
}
