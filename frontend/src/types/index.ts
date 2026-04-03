export interface ListenerRecord {
  date: string;
  monthly_listeners: number;
  collected_at: string;
}

export interface ArtistConfig {
  id: string;
  name: string;
  spotify_artist_id: string;
}

export interface ArtistData {
  artist_id: string;
  artist_name: string;
  records: ListenerRecord[];
}
