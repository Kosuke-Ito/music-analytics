export interface CityListeners {
  city: string;
  country: string;
  listeners: number;
}

export interface ListenerRecord {
  date: string;
  monthly_listeners: number;
  youtube_subscribers?: number;
  top_cities?: CityListeners[];
  collected_at: string;
}

export interface ArtistConfig {
  id: string;
  name: string;
  spotify_artist_id: string;
  region?: "jp" | "global";
  live_attendance?: Record<string, number>;
}

export type AnnotationCategory = "release" | "viral" | "collab" | "tour" | "award" | "other";

export interface Annotation {
  date: string;
  title: string;
  description?: string;
  url?: string;
  category: AnnotationCategory;
  added_at: string;
}

export interface ArtistData {
  artist_id: string;
  artist_name: string;
  records: ListenerRecord[];
  annotations?: Annotation[];
}
