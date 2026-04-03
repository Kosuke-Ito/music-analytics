export interface ListenerRecord {
  date: string;
  monthly_listeners: number;
  youtube_subscribers?: number;
  collected_at: string;
}

export interface ArtistConfig {
  id: string;
  name: string;
  spotify_artist_id: string;
  region?: "jp" | "global";
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
