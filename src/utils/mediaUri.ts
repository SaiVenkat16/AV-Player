function encodeFsPath(path: string): string {
  // On Android, raw file paths or simple file:// URIs often work better than fully encoded ones.
  return path.replace(/\\/g, '/');
}

function stripFileScheme(u: string): string {
  return u.startsWith('file://') ? u.slice(7) : u;
}

export function toLocalPath(path: string): string {
  return encodeFsPath(stripFileScheme(path.trim()));
}

function hasExplicitScheme(uri: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(uri);
}

/**
 * Normalize local and remote media paths for both <Image> and <Video />.
 */
export function toMediaUri(uri: string | null | undefined): string | undefined {
  if (uri == null) {
    return undefined;
  }
  const value = uri.trim();
  if (value.length === 0) {
    return undefined;
  }
  if (value.startsWith('file://')) {
    return `file://${toLocalPath(value)}`;
  }
  if (hasExplicitScheme(value)) {
    return value;
  }
  return `file://${toLocalPath(value)}`;
}

/**
 * Normalize local / remote paths for React Native <Image source={{ uri }} />.
 */
export function toImageSource(uri: string | null | undefined): { uri: string } | undefined {
  const normalized = toMediaUri(uri);
  return normalized ? { uri: normalized } : undefined;
}

/** `react-native-video` / `CreateThumbnail` — same encoding rules as images. */
export function toFileUri(path: string): string {
  return toMediaUri(path) ?? '';
}
