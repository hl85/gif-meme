export interface KlipyFileVariant {
  url: string;
  width: number;
  height: number;
  size?: number;
}

export interface KlipyGif {
  id: string;
  title: string;
  slug?: string;
  url: string;
  preview_url: string;
  blur_preview?: string;
  width: number;
  height: number;
  source: string;
}

export interface KlipyAd {
  type: 'ad';
  id: string;
  image_url: string;
  click_url: string;
  impression_url: string;
  width: number;
  height: number;
}

export interface KlipyPage<T> {
  items: T[];
  ads: KlipyAd[];
  page: number;
  perPage: number;
  hasNext: boolean;
}
