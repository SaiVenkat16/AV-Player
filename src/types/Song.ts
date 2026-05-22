export type SongMood = 'Chill' | 'Energetic' | 'Sad' | 'Happy' | 'Focus';

export interface Song {
  id: string;
  path: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  albumArt: string | null;
  genre: string;
  year: string;
  dateAdded: number;
  mood: SongMood;
}
