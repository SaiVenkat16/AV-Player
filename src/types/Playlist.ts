export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artUri: string | null;
  songIds: string[];
}

export interface Artist {
  id: string;
  name: string;
  songIds: string[];
}

export type SortMode = 'az' | 'date' | 'duration' | 'artist';

export type VisualizerStyle = 'bars' | 'rings' | 'particles' | 'wave';
