export interface CityListeners {
  city: string;
  country: string;
  listeners: number;
}

export interface LastfmCountry {
  country: string;
  listeners: number;
}

export interface ListenerRecord {
  date: string;
  monthly_listeners: number;
  spotify_followers?: number;
  youtube_subscribers?: number;
  youtube_total_views?: number;
  youtube_video_count?: number;
  top_cities?: CityListeners[];
  lastfm_listeners?: number;
  lastfm_playcount?: number;
  collected_at: string;
  /** 収集時の注意フラグ（例: 前日比で大きな変動） */
  validation_flags?: string[];
}

export interface ArtistConfig {
  id: string;
  name: string;
  spotify_artist_id: string;
  region?: "jp" | "global";
  label?: string;
  live_attendance?: Record<string, number>;
}

export type AnnotationCategory = "release" | "viral" | "collab" | "tour" | "award" | "other";

export type AnnotationConfidence = "high" | "medium" | "low";

export interface Annotation {
  date: string;
  title: string;
  description?: string;
  url?: string;
  category: AnnotationCategory;
  added_at: string;
  /** 主な情報源（ドメイン名やメディア名など） */
  source?: string;
  confidence?: AnnotationConfidence;
  /** 人手で確認済みのとき true */
  verified?: boolean;
}

export interface ArtistData {
  artist_id: string;
  artist_name: string;
  records: ListenerRecord[];
  annotations?: Annotation[];
}
