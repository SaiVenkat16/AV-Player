// Decide which inner icon + color to layer inside the muted folder icon
// based on the folder name. Mirrors the Music tab's folder rendering.

import { Colors } from '../theme/colors';

export interface FolderIconInfo {
  innerIcon: string;
  innerColor: string;
}

export function getVideoFolderIcon(folderName: string): FolderIconInfo {
  const f = folderName.toLowerCase();

  if (f.includes('camera') || f.includes('dcim')) {
    return { innerIcon: 'camera', innerColor: '#3B82F6' };
  }
  if (f.includes('whatsapp')) {
    return { innerIcon: 'whatsapp', innerColor: '#25D366' };
  }
  if (f.includes('telegram')) {
    return { innerIcon: 'send', innerColor: '#0088CC' };
  }
  if (f.includes('download')) {
    return { innerIcon: 'download', innerColor: '#3B82F6' };
  }
  if (f.includes('movie') || f.includes('film')) {
    return { innerIcon: 'movie-open', innerColor: '#EC4899' };
  }
  if (f.includes('record') || f.includes('screen')) {
    return { innerIcon: 'record-circle', innerColor: '#EF4444' };
  }
  if (f.includes('youtube') || f.includes('yt')) {
    return { innerIcon: 'youtube', innerColor: '#FF0000' };
  }
  if (f.includes('instagram') || f.includes('insta')) {
    return { innerIcon: 'instagram', innerColor: '#E1306C' };
  }
  if (f.includes('tiktok')) {
    return { innerIcon: 'music-note', innerColor: '#69C9D0' };
  }
  if (f.includes('snap')) {
    return { innerIcon: 'snapchat', innerColor: '#FFFC00' };
  }
  if (f.includes('facebook') || f.includes('fb')) {
    return { innerIcon: 'facebook', innerColor: '#1877F2' };
  }
  if (f.includes('tutorial') || f.includes('learn') || f.includes('course')) {
    return { innerIcon: 'school', innerColor: '#10B981' };
  }
  if (f.includes('animation') || f.includes('cartoon')) {
    return { innerIcon: 'animation-play', innerColor: '#F59E0B' };
  }
  if (f.includes('music') || f.includes('mv') || f.includes('song')) {
    return { innerIcon: 'music-circle', innerColor: '#A855F7' };
  }
  // Default
  return { innerIcon: 'play-circle', innerColor: Colors.accent1 };
}
