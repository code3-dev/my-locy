export interface LocationData {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export interface WikipediaData {
  title: string;
  extract: string;
  thumbnail?: string;
  url: string;
}