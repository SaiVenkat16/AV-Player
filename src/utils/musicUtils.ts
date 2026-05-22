import type { Song, SortMode } from '../types';

export function sortSongs(list: Song[], mode: SortMode): Song[] {
  const next = [...list];
  if (mode === 'az') {
    next.sort((a, b) => a.title.localeCompare(b.title));
  } else if (mode === 'artist') {
    next.sort((a, b) => a.artist.localeCompare(b.artist));
  } else if (mode === 'duration') {
    next.sort((a, b) => b.duration - a.duration);
  } else {
    next.sort((a, b) => b.dateAdded - a.dateAdded);
  }
  return next;
}
