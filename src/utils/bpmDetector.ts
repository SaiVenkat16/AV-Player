/* eslint-disable no-bitwise */
import type { SongMood } from '../types';

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function estimateBpmFromHeuristics(
  durationSec: number,
  genre: string,
  title: string,
): number {
  const g = genre.toLowerCase();
  const t = title.toLowerCase();
  const base = 60 + (hashString(`${title}|${genre}`) % 90);
  if (g.includes('classical') || g.includes('ambient')) {
    return Math.min(90, 40 + (hashString(title) % 40));
  }
  if (g.includes('techno') || g.includes('edm') || g.includes('house')) {
    return 120 + (hashString(title) % 40);
  }
  if (g.includes('hip') || g.includes('rap')) {
    return 80 + (hashString(title) % 40);
  }
  if (t.includes('remix') || t.includes('club')) {
    return 122 + (hashString(title) % 28);
  }
  if (durationSec > 0 && durationSec < 150) {
    return Math.min(170, base + 18);
  }
  return base;
}

export function detectMoodFromHeuristics(
  durationSec: number,
  genre: string,
  title: string,
  artist: string,
): SongMood {
  const g = genre.toLowerCase();
  const t = `${title} ${artist}`.toLowerCase();
  if (g.includes('classical') || g.includes('ambient') || g.includes('lofi')) {
    return 'Chill';
  }
  if (g.includes('metal') || g.includes('punk') || g.includes('edm')) {
    return 'Energetic';
  }
  if (
    t.includes('sad') ||
    t.includes('cry') ||
    t.includes('alone') ||
    g.includes('blues')
  ) {
    return 'Sad';
  }
  if (t.includes('happy') || t.includes('sunshine') || g.includes('pop')) {
    return 'Happy';
  }
  if (g.includes('focus') || g.includes('study') || t.includes('piano')) {
    return 'Focus';
  }
  const bpm = estimateBpmFromHeuristics(durationSec, genre, title);
  if (bpm >= 128) {
    return 'Energetic';
  }
  if (bpm <= 85) {
    return 'Chill';
  }
  const h = hashString(`${title}|${artist}`) % 4;
  const pool: SongMood[] = ['Chill', 'Happy', 'Focus', 'Energetic'];
  return pool[h] ?? 'Chill';
}
