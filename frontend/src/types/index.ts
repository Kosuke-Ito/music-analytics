export interface ListenerRecord {
  date: string;
  monthly_listeners: number;
  collected_at: string;
}

export interface ArtistData {
  artist_id: string;
  artist_name: string;
  records: ListenerRecord[];
}
