/* eslint-disable no-bitwise */
import { NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import jsmediatags from 'jsmediatags';
import type { Song } from '../types';
import { detectMoodFromHeuristics } from '../utils/bpmDetector';
import { Logger } from '../utils/logger';

const { MetadataRetriever } = NativeModules;

if (Platform.OS === 'android' && !MetadataRetriever) {
  Logger.error('MetadataService', 'CRITICAL: MetadataRetriever native module is NOT defined. Rebuild required!');
}



function base64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const outputLen = (len * 3) >> 2;
  const bytes = new Uint8Array(outputLen);
  
  for (let i = 0, j = 0; i < len; i += 4) {
    const b1 = lookup[clean.charCodeAt(i)];
    const b2 = lookup[clean.charCodeAt(i + 1)];
    const b3 = lookup[clean.charCodeAt(i + 2)];
    const b4 = lookup[clean.charCodeAt(i + 3)];
    
    bytes[j++] = (b1 << 2) | (b2 >> 4);
    if (j < outputLen) bytes[j++] = ((b2 & 15) << 4) | (b3 >> 2);
    if (j < outputLen) bytes[j++] = ((b3 & 3) << 6) | b4;
  }
  return bytes;
}

function uint8ToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    
    binary += chars.charAt(b1 >> 2);
    binary += chars.charAt(((b1 & 3) << 4) | (b2 >> 4));
    if (i + 1 < len) {
      binary += chars.charAt(((b2 & 15) << 2) | (b3 >> 6));
    } else {
      binary += '=';
    }
    if (i + 2 < len) {
      binary += chars.charAt(b3 & 63);
    } else {
      binary += '=';
    }
  }
  return binary;
}

type ParsedTags = {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
  picture?: { data: Uint8Array; format: string };
};

function readTagsFromChunk(base64Chunk: string): Promise<ParsedTags> {
  return new Promise((resolve, reject) => {
    try {
      const u8 = base64ToUint8Array(base64Chunk);
      // Crucial: Create a clean, non-shared ArrayBuffer slice
      const arrayBuffer = u8.buffer.slice(0, u8.byteLength);
      
      jsmediatags.read(arrayBuffer as never, {
        onSuccess: tag => {
          const tags = tag.tags as Record<string, any>;
          const pic = tags.picture;
          resolve({
            title: tags.title,
            artist: tags.artist,
            album: tags.album,
            genre: tags.genre,
            year: tags.year,
            picture: pic
              ? {
                  data: new Uint8Array(pic.data),
                  format: pic.format,
                }
              : undefined,
          });
        },
        onError: e => {
          Logger.warn('MetadataService', `jsmediatags error: ${JSON.stringify(e)}`);
          reject(e);
        },
      });
    } catch (e) {
      reject(e);
    }
  });
}

const MAX_ALBUM_ART_SIZE = 512 * 1024; // 512KB limit — prevents cache overflow

async function writeTempArtFile(
  path: string,
  picture: { data: Uint8Array; format: string },
): Promise<string | null> {
  try {
    if (picture.data.byteLength > MAX_ALBUM_ART_SIZE) return null;
    const ext = picture.format.toLowerCase().includes('png') ? 'png' : 'jpg';
    const out = `${RNFS.CachesDirectoryPath}/art_${hashPath(path)}.${ext}`;
    const b64 = uint8ToBase64(picture.data);
    await RNFS.writeFile(out, b64, 'base64');
    return `file://${out}`;
  } catch (err) {
    Logger.warn('MetadataService', `Failed to write art file for ${path}`, err);
    return null;
  }
}

function hashPath(path: string): string {
  let h = 0;
  for (let i = 0; i < path.length; i += 1) h = (h * 31 + path.charCodeAt(i)) >>> 0;
  return `${h}`;
}

function cleanMetadata(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?/gi, '')
    .replace(/[[(][a-zA-Z0-9-.]+\.[a-z]{2,3}[\])]/gi, '')
    .replace(/::/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    // Remove symbols from start and end
    .replace(/^[:\s\-._]+|[:\s\-._]+$/g, '')
    .trim();
}

function parseFilename(name: string): { title: string; artist: string } {
  const clean = cleanMetadata(name.replace(/\.[^/.]+$/, ''));
  if (clean.includes('-')) {
    const parts = clean.split('-').map(s => s.trim());
    return { title: parts[1] || parts[0], artist: parts[0] || 'Unknown Artist' };
  }
  return { title: clean, artist: 'Unknown Artist' };
}

export async function extractAudioMetadata(
  path: string,
): Promise<Partial<Song>> {
  const name = path.split('/').pop() || '';
  const fallback = parseFilename(name);
  let title = fallback.title;
  let artist = fallback.artist;
  let album = 'Unknown Album';
  let genre = '';
  let year = '';
  let duration = 0;
  let albumArt: string | null = null;
  let dateAdded = Date.now();
  let fileSize = 0;

  try {
    const stat = await RNFS.stat(path);
    fileSize = Number(stat.size);
    const stamp = new Date(stat.mtime ?? stat.ctime ?? Date.now()).getTime();
    if (Number.isFinite(stamp) && stamp > 0) {
      dateAdded = stamp;
    }
  } catch (error) {
    Logger.debug('MetadataService', `Failed to read file stat for ${path}`, error);
  }

  // Use Native MetadataRetriever on Android for 100% reliability
  if (Platform.OS === 'android' && MetadataRetriever) {
    try {
      Logger.debug('MetadataService', `Using Native Retriever for: ${path}`);
      const meta = await MetadataRetriever.getMetadata(path);

      if (meta.title?.trim()) title = cleanMetadata(meta.title);
      if (meta.artist?.trim()) artist = cleanMetadata(meta.artist);
      if (meta.album?.trim()) album = cleanMetadata(meta.album);
      if (meta.genre?.trim()) genre = cleanMetadata(meta.genre);
      if (meta.year?.trim()) year = cleanMetadata(meta.year);
      if (meta.duration > 0) duration = meta.duration;

      if (meta.albumArtBase64) {
        const out = `${RNFS.CachesDirectoryPath}/art_${hashPath(path)}.jpg`;
        await RNFS.writeFile(out, meta.albumArtBase64, 'base64');
        albumArt = `file://${out}`;
      }

      return {
        title: title || fallback.title,
        artist: artist || fallback.artist,
        album,
        duration,
        albumArt,
        genre,
        year,
        mood: detectMoodFromHeuristics(duration, genre, title, artist),
        dateAdded,
      };
    } catch (err) {
      Logger.warn('MetadataService', `Native retriever failed for ${path}, falling back to JS`, err);
    }
  }

    // Fallback to JS implementation (original logic)
    try {
      if (fileSize > 0) {
        duration = Math.floor(fileSize / 16000);
      }

      const readSize = fileSize > 0 ? Math.min(4 * 1024 * 1024, fileSize) : 4 * 1024 * 1024;
      const data = await RNFS.read(path, readSize, 0, 'base64');
      const tags = await readTagsFromChunk(data);

      if (tags.title?.trim()) title = cleanMetadata(tags.title);
      if (tags.artist?.trim()) artist = cleanMetadata(tags.artist);
      if (tags.album?.trim()) album = cleanMetadata(tags.album);
      if (tags.genre?.trim()) genre = cleanMetadata(tags.genre);
      if (tags.year?.trim()) year = cleanMetadata(tags.year);

      if (tags.picture) {
        albumArt = await writeTempArtFile(path, tags.picture);
      }
    } catch (err) {
      Logger.debug('MetadataService', `JS fallback failed for ${path}`, err);
    }

  return {
    title,
    artist,
    album,
    duration,
    albumArt,
    genre,
    year,
    mood: detectMoodFromHeuristics(duration, genre, title, artist),
    dateAdded,
  };
}
