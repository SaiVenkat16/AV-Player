# Design Document

## Overview

This design upgrades the AV Player Video section with three additions and two cross-cutting concerns:

1. Two new horizontal rows on the existing `VideoTab` — **Recents** (recently opened plus partially watched, with progress overlays) and **Favorites** (videos the user has marked) — placed above the existing folder grid which is left untouched.
2. A new **All Videos** screen reachable from the tab header, showing every visible video as a flat sortable list.
3. Per-video **resume position** persistence so the existing `EmbeddedVideoPlayer` resumes where the user left off, with a "Continue Watching" progress overlay on Recents tiles.

The two cross-cutting concerns are:

- A **Hidden Folder Filter** that excludes WhatsApp / Status / Recorder / Call / `.nomedia` / `.thumbnails` folders (and folders containing a `.nomedia` marker file) from the new flat / horizontal lists, while leaving the existing folder grid and per-folder screen untouched.
- **Stale entry pruning** that drops Recents, Favorites, and Resume Positions whose underlying video file no longer exists, run on tab activation and after `scanLibrary` completes.

The design sits on top of the existing infrastructure rather than rewriting it:

- `useLibraryStore` (Zustand + MMKV) already persists `videos`, `favorites`, and `privateIds`. We extend its persisted slice with `videoRecents` and `videoResume` and add the corresponding actions and pruner.
- The existing `VideoListItem` component continues to render the All Videos screen rows. A new `VideoPosterCard` component renders Recents and Favorites tiles using the same thumbnail / duration badge / resolution badge primitives, plus a progress bar overlay for Continue Watching.
- The existing `MediaActionSheet` is extended with two video-specific actions ("Play from start", "Remove from Recent") that surface only when the sheet is opened from a Recents tile.
- The existing `EmbeddedVideoPlayer` is wrapped with a thin resume-position controller hook that seeks on load, persists every five seconds, persists on close, and clears on natural end.
- Styles live in dedicated files under `src/styles/screens/video/` and `src/styles/components/video/`, matching the existing convention.

## Architecture

```mermaid
flowchart TD
  subgraph UI[Video UI Layer]
    VT[VideoTab\n(modified)]
    RS[RecentsSection\n(new)]
    FS[FavoritesSection\n(new)]
    AV[AllVideosScreen\n(new)]
    VPC[VideoPosterCard\n(new)]
    VLI[VideoListItem\n(reused)]
    MAS[MediaActionSheet\n(extended)]
    EVP[EmbeddedVideoPlayer\n(reused)]
  end

  subgraph Logic[Pure Logic / Hooks]
    HFF[hiddenFolderFilter.ts\n(new)]
    PRC[pruneStaleEntries\n(new)]
    SORT[sortAllVideos\n(new)]
    URP[useResumePosition\n(new hook)]
  end

  subgraph State[Persisted State - useLibraryStore]
    LS[(libraryStore)]
    REC[videoRecents: Recent[]]
    RES[videoResume: Record<id, number>]
    FAV[favorites: string[]]
    VID[videos: Video[]]
  end

  VT --> RS
  VT --> FS
  VT --> Grid[Folder Grid (unchanged)]
  VT -.header tap.-> AV
  RS --> VPC
  FS --> VPC
  AV --> VLI
  VPC -- onLongPress --> MAS
  VLI -- onLongPress --> MAS
  VPC -- onPress --> EVP
  VLI -- onPress --> EVP
  AV -- sort/filter --> SORT
  RS & FS & AV -- filter --> HFF
  VT -- on focus --> PRC
  PRC --> LS
  EVP --> URP
  URP --> LS
  RS --> REC
  FS --> FAV
  VPC -- progress overlay --> RES
  URP -- read/write --> RES
  URP -- write --> REC
```

The flow is one-directional: user actions update `useLibraryStore` (single source of truth, MMKV-persisted), and the UI is a pure function of the store plus the `useVideoPlayerStore` overlay.

## Components and Interfaces

### 1. `useLibraryStore` extensions (`src/store/libraryStore.ts`)

The persisted slice gets two new fields and four new actions. Existing fields and actions are preserved.

```ts
// Added to PersistedLibraryState
type RecentEntry = { videoId: string; lastOpenedAt: number };

interface PersistedLibraryStateAdditions {
  videoRecents: RecentEntry[];           // most-recent-first invariant maintained on write
  videoResume: Record<string, number>;   // videoId -> seconds (whole, >= 0)
}

// Added to LibraryState (the store interface)
interface LibraryStateAdditions {
  videoRecents: RecentEntry[];
  videoResume: Record<string, number>;

  recordVideoOpened: (videoId: string, atMs?: number) => void;
  removeVideoRecent: (videoId: string) => void;
  setVideoResume: (videoId: string, seconds: number) => void;
  clearVideoResume: (videoId: string) => void;
  pruneVideoLibrary: () => void;
}
```

Behaviour:

- `recordVideoOpened(id, atMs)` — replaces any existing entry for `id`, prepends a new `{videoId: id, lastOpenedAt: atMs ?? Date.now()}`, then truncates to `RECENTS_CAP = 20`. Truncation drops smallest `lastOpenedAt`, ties broken by lexicographically smaller `videoId`.
- `removeVideoRecent(id)` — removes every entry matching `id` (no-op if absent).
- `setVideoResume(id, seconds)` — clamps `seconds` into `[0, ∞)` and writes `Math.floor(seconds)` (whole seconds). If `seconds <= 0`, the key is deleted instead (consistent with "no resume needed").
- `clearVideoResume(id)` — removes the key; no-op if absent.
- `pruneVideoLibrary()` — atomic prune (single `set`) that:
  - drops every `videoRecents` entry whose `videoId` is absent from `videos`;
  - drops every `videoResume` key whose `videoId` is absent from `videos`;
  - drops every `favorites` id absent from both `videos` and `songs` (preserves existing audio-favorite behaviour);
  - on read/write error, the existing zustand-persist + MMKV layer leaves the prior state in place; the action surfaces a one-shot non-blocking error via `themedAlert` (toast-style).

The persistence config (`partialize`) and `migrateLibraryPersistedState` are extended to include the new fields with safe defaults (`[]` and `{}`). `LIBRARY_VIDEO_CACHE_VERSION` is bumped to `3` so older persisted blobs migrate without losing existing favorites.

### 2. Hidden Folder Filter (`src/utils/hiddenFolderFilter.ts`, new)

A pure utility module so the same predicate is shared by Recents, Favorites, All Videos, and the pruner.

```ts
export const HIDDEN_FOLDER_NAMES = [
  'WhatsApp', 'Status', '.nomedia', '.thumbnails', 'Recorder', 'Call',
] as const;

/** Splits a path on / and \, dropping empty segments. NFC-normalises segments. */
export function normalisePathSegments(path: string | null | undefined): string[];

/**
 * Pure, synchronous segment-name check. No I/O.
 * Returns true if any normalised segment matches a hidden literal (case-insensitive, NFC).
 */
export function isHiddenBySegment(path: string | null | undefined): boolean;

/**
 * Async folder probe. Returns true if `${dir}/.nomedia` exists at the time of the
 * check. Honours a 500 ms soft timeout: any error or timeout returns false (not hidden
 * by the .nomedia rule), per Requirement 7.4.
 */
export function probeNoMediaMarker(dir: string, timeoutMs?: number): Promise<boolean>;

/**
 * Synchronous combined check used by render code paths. Uses a per-folder cache
 * populated by warmHiddenFolderCache() so the UI never blocks on RNFS.
 */
export function isHidden(path: string | null | undefined): boolean;

/**
 * Warms the .nomedia cache for every distinct directory found in `videos`.
 * Returns once all probes settle (or each times out at 500 ms). Called before
 * the first render of Recents/Favorites/AllVideos and after scanLibrary.
 */
export function warmHiddenFolderCache(videos: Video[]): Promise<void>;
```

The synchronous `isHidden(path)` returns `true` when either `isHiddenBySegment(path)` is true, or the cached probe for the containing directory says `.nomedia` is present. Cache lookups for an unprobed directory return `false`, which means the segment-name rule still applies and the `.nomedia` rule is treated as "not hidden" — matching Requirement 7.4.

The cache is cleared on every successful `scanLibrary` completion so newly added `.nomedia` files take effect.

### 3. `VideoTab` (`src/screens/video/VideoTab.tsx`, modified)

Layout becomes a single vertical `ScrollView` (replacing the current `FlashList` of folders) with three regions in fixed order:

1. **Recents row** — header "Recent" + horizontal `FlatList` of `VideoPosterCard`. Always rendered. Empty filtered list → caption "No recent videos yet".
2. **Favorites row** — header "Favorites" + horizontal `FlatList` of `VideoPosterCard`. Always rendered. Empty filtered list → caption "No favorite videos yet".
3. **Folder grid** — the existing `FolderCard` 2-column grid, kept exactly as today, including the existing empty state. Hidden folders are NOT filtered here (Requirement 7.7).

The header gains an "All Videos" affordance (text button + chevron icon) that navigates to `AllVideos`. The existing `HomeHeader` is preserved.

On tab focus (`useFocusEffect`), the component calls `pruneVideoLibrary()` and `warmHiddenFolderCache(videos)`. Both are debounced behind a "did-prune-this-session" flag so a tab toggle doesn't re-prune unnecessarily; instead it re-runs only after the most recent `scanLibrary` completion.

To keep folder-grid scrolling performant, the grid section is rendered inside the same outer `ScrollView` using `nestedScrollEnabled` and `scrollEnabled={false}` on the inner `FlashList`. (FlashList renders all items because the outer ScrollView controls scrolling, so we cap the grid at all folders since it's already paginated by the user's storage layout.)

### 4. `RecentsSection` and `FavoritesSection` (`src/components/video/RecentsSection.tsx`, `FavoritesSection.tsx`, new)

Both are thin presentational components that:

- subscribe to the relevant slice (`videoRecents` + `videos` + `videoResume` for Recents; `favorites` + `videos` for Favorites);
- compute the visible list by joining ids to `Video` records, dropping unresolved ids and applying `privateIds` and `isHidden` filters;
- render a header `Text` with the literal label, a horizontal `FlatList` of `VideoPosterCard`, and the empty / error caption otherwise.

The Favorites order is "most recently appended first" — `[...favorites].reverse()` filtered by `videos`. The Recents order is `videoRecents` (already sorted most-recent-first by the store).

Tap and long-press handlers receive the resolved `Video` object and delegate to props supplied by `VideoTab`:

```ts
type RecentsSectionProps = {
  onTapResume: (video: Video) => void;     // resume from Resume_Position
  onTapStart:  (video: Video) => void;     // play from 0
  onLongPress: (video: Video, source: 'recents' | 'favorites') => void;
};
```

`VideoTab` decides which tap callback to invoke based on `Watch_Progress = videoResume[id] / video.duration`:

- if `0.05 <= progress <= 0.95` → `onTapResume`,
- otherwise → `onTapStart` (which clears the resume position before opening, defensively).

### 5. `VideoPosterCard` (`src/components/video/VideoPosterCard.tsx`, new)

A horizontal poster card sharing the visual primitives of `VideoListItem`:

- 16:9 thumbnail, fixed width (e.g. 160), with rounded corners;
- duration badge anchored bottom-right (`formatTime(duration)`), omitted when duration is 0;
- resolution badge anchored top-left (`SD`/`HD`/`FHD`/`4K`), omitted when no resolution;
- placeholder gradient + play icon when `thumbnailUri` is null (matches `VideoListItem`'s fallback);
- title (`numberOfLines={2}`) below the thumbnail;
- **progress overlay**: a 3-px tall horizontal bar absolutely positioned at the thumbnail's bottom edge. Width = `Math.round(progress * tileWidth)`, rendered ONLY when `progress` falls in `[0.05, 0.95]`. Track colour `Colors.glassBorder`, fill colour `Colors.accent1`.

Props:

```ts
type VideoPosterCardProps = {
  video: Video;
  watchProgress: number;       // 0..1; pass 0 for non-recents tiles
  showProgress: boolean;       // true only on Recents
  onPress: () => void;
  onLongPress: () => void;
  width?: number;              // default 160
};
```

The card is the single shared tile across Recents and Favorites; Favorites passes `showProgress={false}`.

### 6. `AllVideosScreen` (`src/screens/video/AllVideosScreen.tsx`, new)

Reachable via `navigation.navigate('AllVideos')`. Adds an entry to `VideoStackParamList` and a screen registration in `VideoStackNavigator`.

Layout: header (back chevron + title "All Videos") → sort chip row → `FlashList` of `VideoListItem`. The screen owns local state `sortMode` (default `'name'`) and reads `videos`, `privateIds`, `videoRecents`, `videoResume` from `useLibraryStore`.

Sorting (a single pure helper in `src/utils/videoSort.ts`):

```ts
type SortMode = 'name' | 'recent' | 'size' | 'duration';

export function sortAllVideos(
  videos: Video[],
  recents: RecentEntry[],
  mode: SortMode,
): Video[];
```

Each branch follows the spec exactly:

- `'name'` → `localeCompare` on `title.toLowerCase()`, ties → `id` ascending.
- `'recent'` → join with recents map; videos without an entry are sorted to the end. Within the "has-recent" group, descending `lastOpenedAt`. Ties → `title.toLowerCase()` ascending.
- `'size'` → descending `sizeBytes`, ties → title ascending.
- `'duration'` → descending `duration`, ties → title ascending.

`sortAllVideos` is a pure function, returns a new array, and is the unit-of-test (and PBT target) for the sorting requirements.

Tapping a row calls a small helper that mirrors the Recents behaviour:

```ts
function openVideo(v: Video) {
  const r = useLibraryStore.getState().videoResume[v.id] ?? 0;
  if (r > 0 && r < v.duration) {
    // resume — useResumePosition hook will pick it up on EmbeddedVideoPlayer mount
  }
  useVideoPlayerStore.getState().openVideo(v.id);
}
```

Long-press opens `MediaActionSheet` with `source: 'all-videos'`.

### 7. `MediaActionSheet` extension (`src/components/common/MediaActionSheet.tsx`, modified)

Add an optional `source` prop:

```ts
type MediaActionSource = 'recents' | 'favorites' | 'all-videos' | 'folder' | 'song';
type MediaActionSheetProps = { /* existing */ source?: MediaActionSource };
```

When `type === 'video'`:

- always show "Play Now", "Add/Remove Favorites", "Move to Private Vault", "Delete from Library" (existing behaviour).
- when `source === 'recents'`, additionally show **"Play from start"** (clears `videoResume[id]` and opens the video) and **"Remove from Recent"** (calls `removeVideoRecent`).
- "Add to Favorites" / "Remove from Favorites" continue to be mutually exclusive based on `favorites.includes(id)`.

The sheet uses the existing `BottomSheet` and styled rows; new actions reuse the existing `optionRow` style. No inline styles are introduced.

### 8. Resume position controller (`src/components/video/hooks/useResumePosition.ts`, new)

A small hook composed into `useVideoPlayerState` (or wrapping `EmbeddedVideoPlayer` directly to keep the changes localised):

```ts
function useResumePosition(item: VideoItem, videoRef, dur, pos): void;
```

Responsibilities:

1. **On video load** — read `useLibraryStore.getState().videoResume[item.id]`. If the value is strictly greater than `0` and strictly less than `dur` (in seconds), call `videoRef.current.seek(value)`. Also call `recordVideoOpened(item.id)` exactly once per mount, AFTER a successful load (so a decoder error before `onLoad` does not pollute Recents — Requirement 2.2).
2. **Periodic save** — a `setInterval` of 5000 ms (±250 ms tolerance via `setTimeout` chain) that calls `setVideoResume(item.id, Math.floor(currentPos))` whenever `currentPos` is in `[0, dur)`.
3. **On unmount / back / hardware-back** — flush one final `setVideoResume(item.id, Math.floor(currentPos))` synchronously inside the `useEffect` cleanup. The 500 ms guarantee is met because MMKV writes are sub-millisecond.
4. **On natural end** (`onEnd` from `react-native-video`) — call `clearVideoResume(item.id)`.
5. **Persistence failure** — wrap each store call; on caught error, keep the current in-memory state and do not interrupt playback. The store's `setVideoResume` already swallows MMKV failures via the existing `mmkvZustandStorage` adapter, so this is mostly a defensive boundary.

The hook intentionally takes `pos`/`dur` from the existing player state instead of re-reading from `videoRef`, so it stays a pure consumer of state and is easy to unit-test in isolation.

### 9. Header navigation entry

`VideoStackParamList` gains `AllVideos: undefined`. `VideoStackNavigator` registers `<Stack.Screen name="AllVideos" component={AllVideosScreen} />`. The Video tab header gets a small "All Videos" pressable next to the existing search/scan controls.

### 10. Styling

All new components import their styles from dedicated files:

- `src/styles/screens/video/VideoTabStyles.ts` — extended with section header, empty caption, and "All Videos" header button styles.
- `src/styles/screens/video/AllVideosStyles.ts` — new (header, sort chip row, list).
- `src/styles/components/video/VideoPosterCardStyles.ts` — new.
- `src/styles/components/video/RecentsSectionStyles.ts` — new (shared with FavoritesSection or split per file).
- `src/styles/components/video/FavoritesSectionStyles.ts` — new.

No `style={{...}}` literals or inline `StyleSheet.create` are introduced inside component files (Requirement 9.7). Every introduced `Text` element sets `fontFamily` to one of the allowed Poppins variants and never sets `fontWeight` (Requirement 9.8).

## Data Models

### Video (unchanged)

```ts
interface Video {
  id: string;
  path: string;
  title: string;
  duration: number;   // seconds
  width: number;
  height: number;
  sizeBytes: number;
  thumbnailUri: string | null;
}
```

### RecentEntry (new)

```ts
type RecentEntry = {
  videoId: string;        // matches Video.id
  lastOpenedAt: number;   // epoch milliseconds
};
```

### Persisted state additions

```ts
type LibraryPersistedAdditions = {
  videoRecents: RecentEntry[];          // length <= RECENTS_CAP (20)
  videoResume: Record<string, number>;  // videoId -> whole seconds in [0, ∞)
};
```

### Constants

Added to `src/utils/constants.ts`:

```ts
export const RECENTS_CAP = 20;
export const RESUME_SAVE_INTERVAL_MS = 5000;
export const RESUME_SAVE_INTERVAL_TOLERANCE_MS = 250;
export const NOMEDIA_PROBE_TIMEOUT_MS = 500;
export const CONTINUE_WATCHING_LOWER = 0.05;
export const CONTINUE_WATCHING_UPPER = 0.95;
```

### Persistence

The existing zustand `persist` middleware is reused. `partialize` is extended to include `videoRecents` and `videoResume`. `migrateLibraryPersistedState` is extended to:

- treat missing `videoRecents` as `[]`;
- treat missing `videoResume` as `{}`;
- bump `LIBRARY_VIDEO_CACHE_VERSION` to `3` so prior persisted blobs migrate cleanly.

No new storage key is needed. The existing `STORAGE_KEYS.libraryMeta` MMKV slot continues to hold the entire library blob.

### Invariants

The store's reducers must preserve these invariants on every write:

- `videoRecents.length <= RECENTS_CAP`.
- `videoRecents` is sorted descending by `lastOpenedAt`, ties ascending by `videoId`.
- For every `videoRecents[i].videoId`, the id occurs at most once across the array (no duplicates).
- For every key `k` in `videoResume`, `Number.isInteger(videoResume[k]) && videoResume[k] >= 0`.

These four invariants are direct PBT targets (see Correctness Properties below).

<!-- prework + correctness properties to follow -->


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

PBT applies cleanly to this feature because the core logic — the recents reducer, the favorites reducer, the hidden-folder predicate, the resume-decision rule, the All Videos sort, the section selectors, and the prune reducer — is all pure functions over plain data. UI text and layout assertions are covered by example tests in the Testing Strategy. AWS-style integration tests are not needed; MMKV persistence is covered by a small integration test rather than a property.

The following properties are derived from the prework analysis above (see the Property Reflection section). Wherever multiple acceptance criteria are validated by the same universal rule, they are consolidated into one property.

### Property 1: Recents reducer invariant

*For any* initial `RecentEntry[]` (length ≤ 20) and any sequence of `recordVideoOpened(id, atMs)` calls, the resulting `videoRecents` array satisfies all of:

- length is at most `RECENTS_CAP` (20);
- every `videoId` appears at most once;
- entries are sorted in descending order of `lastOpenedAt`, with ties broken by ascending `videoId`;
- if a call had the largest `atMs` of any call to date for any present id, the most recent call for that id appears at index 0.

**Validates: Requirements 2.1, 2.3, 2.4**

### Property 2: Recents replace-on-same-id semantics

*For any* `RecentEntry[]` and any call `recordVideoOpened(id, atMs)`, the resulting array contains exactly one entry whose `videoId === id`, and that entry's `lastOpenedAt === atMs`.

**Validates: Requirements 2.1**

### Property 3: Recents render selector

*For any* `(videoRecents, videos, privateIds, fsExists, hiddenSet)`, the visible Recents list:

- contains only ids found in `videos`;
- contains no id present in `privateIds`;
- contains no video whose path is classified hidden;
- contains no id whose `fsExists(path)` returns false;
- preserves the order of `videoRecents` (which is the descending-`lastOpenedAt` order from Property 1);
- does NOT mutate the source `videoRecents` array.

**Validates: Requirements 2.6, 2.7, 2.8, 7.6**

### Property 4: Resume decision rule

*For any* `(resume, duration)` with `duration > 0`, `shouldResume(resume, duration) === (resume > 0 && resume < duration)`. When `shouldResume` is true the player seeks to `resume`; when false the player starts at position zero and never issues a seek.

**Validates: Requirements 3.3, 3.4, 6.10**

### Property 5: Resume map invariant

*For any* sequence of `setVideoResume(id, sec)` and `clearVideoResume(id)` calls, the resulting `videoResume` map satisfies:

- every value is a non-negative integer;
- each `id` appears at most once as a key;
- after `clearVideoResume(id)`, the key `id` is absent.

**Validates: Requirements 3.9, 3.5**

### Property 6: Continue Watching progress overlay

*For any* `(progress in [0, 1], tileWidth in [0, ∞))`, the rendered Recents tile satisfies:

- if `0.05 ≤ progress ≤ 0.95`, a progress bar is rendered with fill width equal to `min(round(progress * tileWidth), tileWidth)` and bounded to `[0, tileWidth]`;
- otherwise no progress bar element is rendered.

**Validates: Requirements 3.6, 3.7**

### Property 7: Play-from-start clears resume

*For any* `(videoResume, id)`, after invoking the "Play from start" handler with `id`, `videoResume[id]` is undefined and the open-from-zero playback path is taken.

**Validates: Requirements 4.4**

### Property 8: Remove-from-recent semantics

*For any* `videoRecents` and any `id`, after `removeVideoRecent(id)` the result equals `videoRecents.filter(e => e.videoId !== id)`. Every other entry's relative order and `lastOpenedAt` is preserved.

**Validates: Requirements 4.5**

### Property 9: Add-favorite is idempotent and appending

*For any* `favorites: string[]` and any `id`, `addFavorite(id)` returns:

- `favorites` unchanged when `favorites.includes(id)`;
- `[...favorites, id]` when `!favorites.includes(id)`.

In both cases the result contains no duplicates of `id`.

**Validates: Requirements 5.1, 5.3, 5.4**

### Property 10: Remove-favorite is identity-when-absent and full-removal-when-present

*For any* `favorites: string[]` and any `id`, `removeFavorite(id)` equals `favorites.filter(x => x !== id)`. When `id` is absent, the result is structurally equal to the input.

**Validates: Requirements 5.5, 5.6**

### Property 11: Favorites render selector

*For any* `(favorites, videos, privateIds)`, the visible Favorites list equals the reverse of `favorites`, filtered to ids that:

- correspond to a `Video` record in `videos`;
- are not present in `privateIds`;
- have a path that is not classified hidden.

The selector does NOT mutate the input `favorites` array, even when entries are filtered out.

**Validates: Requirements 5.7, 5.8, 5.9, 5.10**

### Property 12: Path normalisation

*For any* `path: string`, `normalisePathSegments(path)` returns an array such that:

- no element is the empty string;
- no element contains `/` or `\`;
- the segments come from splitting `path.replace(/\\/g, '/')` on `/`, NFC-normalised.

**Validates: Requirements 7.1**

### Property 13: Hidden folder predicate

*For any* `(path: string, fsHasNoMedia: boolean)`, `isHidden(path, fsHasNoMedia)` returns true if and only if either:

- some segment of `normalisePathSegments(path)`, lower-cased and NFC-normalised, equals one of `whatsapp`, `status`, `.nomedia`, `.thumbnails`, `recorder`, `call`; OR
- `fsHasNoMedia` is true.

When `path` is null, undefined, or whitespace-only, `isHidden` returns false (treated as not hidden).

**Validates: Requirements 7.2, 7.3, 7.5**

### Property 14: All-videos selector and sort

*For any* `(videos, privateIds, recents)` and any `sortMode in {name, recent, size, duration}`, `sortAllVideos(videos, recents, sortMode)`:

- returns a permutation of `videos.filter(v => !privateIds.includes(v.id) && !isHidden(v.path))`;
- is monotone non-decreasing under the sort mode's ordering relation, where:
  - `name`: `(title.toLowerCase(), id)` ascending;
  - `recent`: has-recent group first (descending `lastOpenedAt` from `recents`, then ascending `title.toLowerCase()`), no-recent group second (ascending `title.toLowerCase()`);
  - `size`: `(-sizeBytes, title.toLowerCase())`;
  - `duration`: `(-duration, title.toLowerCase())`;
- is stable: when comparator returns equal, input order is preserved;
- does NOT mutate the input `videos` array.

**Validates: Requirements 6.2, 6.5, 6.6, 6.7, 6.8**

### Property 15: Folder grid is the inverse — never filtered by hidden

*For any* `videos`, the rendered VideoTab folder grid (and the existing `VideoFolderScreen` per-folder list) contains every folder produced by `groupVideosByFolder(videos)` in the same order, including folders that the Hidden Folder Filter would classify as hidden in the Recents/Favorites/AllVideos rows.

**Validates: Requirements 1.6, 7.7**

### Property 16: Prune is a projection

*For any* `(videoRecents, videoResume, favorites, videos, songs)`, `pruneVideoLibrary` produces a new state in which:

- `videoRecents` is the subsequence of inputs whose `videoId` appears in `videos.map(id)`;
- `videoResume` keys are the original keys intersected with `videos.map(id)`, with values unchanged;
- `favorites` is the subsequence of inputs whose ids appear in `videos.map(id)` ∪ `songs.map(id)`;
- prune is idempotent: applying it twice yields the same state as applying it once.

**Validates: Requirements 8.1, 8.2, 8.3, 8.5**

### Property 17: VideoPosterCard rendering

*For any* `Video` record `v`, `VideoPosterCard({video: v, ...})` renders an output that:

- includes the `v.thumbnailUri` image when truthy and the placeholder element otherwise;
- includes a duration-badge element with text `formatTime(v.duration)` when `v.duration > 0`, and omits it otherwise;
- includes a resolution-badge element with the resolution token (`SD`/`HD`/`FHD`/`4K`) when `v.width > 0 && v.height > 0`, and omits it otherwise.

**Validates: Requirements 9.1, 9.2, 9.3**

## Error Handling

The feature lives entirely on-device. The relevant failure modes are local I/O failures (MMKV persistence, RNFS directory probe, video decoder errors) and user-resolvable inconsistencies (missing files, dangling ids).

**MMKV persistence failures.** The existing `mmkvZustandStorage` adapter already swallows `getItem`/`setItem`/`removeItem` errors and logs a warning. New actions (`recordVideoOpened`, `setVideoResume`, `clearVideoResume`, `removeVideoRecent`, `pruneVideoLibrary`) inherit this behaviour through zustand-persist. A failed write therefore leaves the in-memory state intact. Playback is never interrupted by a persistence failure (Requirement 3.8).

**Resume seek before playback.** If the seek call fails (e.g., the underlying `react-native-video` ref is null because the player unmounted between read and seek), the resume hook catches the error and lets playback start from zero rather than crashing.

**Video file missing or unreadable.** When the user taps a tile whose underlying file no longer exists, the `EmbeddedVideoPlayer`'s existing `onError` handler shows the existing `VideoErrorOverlay`. The new code adds a small enhancement: on the All Videos screen and on Recents tiles, the tap handler does NOT close the screen; the user remains where they were and the existing themed alert is displayed. The list, sort mode, and scroll position are preserved (Requirement 6.11). Stale entries are not auto-removed during the user's session — they are pruned the next time the Video tab gains focus or `scanLibrary` completes (Requirement 8.1).

**.nomedia probe failure.** `probeNoMediaMarker` honours a 500 ms soft timeout and treats any error (rejected promise, timeout, permission denied) as "no `.nomedia` present" (Requirement 7.4). The segment-name rule still applies, so a path like `/sdcard/Recorder/foo.mp4` remains hidden even if the directory cannot be read.

**Pruning failure.** `pruneVideoLibrary` writes the new state in a single zustand `set` call. If the underlying MMKV write fails, zustand still updates the in-memory state but the persisted blob does not change; on next app start the un-pruned blob is loaded and the prune runs again. We additionally trap thrown exceptions inside `pruneVideoLibrary` and surface a one-shot non-blocking themed-alert toast: "Some recents could not be tidied up. They'll be retried later." (Requirement 8.6.) Sections continue to render correctly because they apply the live filter at render time.

**Recents/Favorites section load failure.** Section selectors are pure functions on the store; the only realistic failure is an unexpected exception inside the selector (e.g., a corrupt persisted blob with a non-array `videoRecents`). Each section is wrapped in a small `<SectionErrorBoundary>` that shows an inline error caption ("Couldn't load Recents — pull to refresh.") and preserves the headers and the layout positions of all three sections (Requirement 1.7). The error boundary resets when the boundary's key (the store version) changes.

**Header label discrepancy in Requirements 1.2 vs 9.4.** Requirement 1.2 specifies the Recents header text as `"Recents"`, while Requirement 9.4 specifies `"Recent"`. The latter is more specific (it explicitly mandates exact text, no whitespace, case preserved), so the implementation will use `"Recent"`. This is documented here so it surfaces in code review; if the user prefers `"Recents"`, the change is a single string constant.

## Testing Strategy

PBT applies because the bulk of the new logic is pure: store reducers, selectors, sort, hidden-folder predicate, resume-decision rule, and the prune reducer. UI behaviour (header text, sort-chip rendering, navigation wiring, section ordering, error captions) is verified with example tests using `@testing-library/react-native`. MMKV persistence and Android `.nomedia` probing get small integration tests but are not subjected to PBT because they exercise external services whose behaviour does not vary meaningfully with input.

### Unit and example tests

Located alongside source as `*.test.ts` / `*.test.tsx` files (matching the existing project layout in `jest.config.js`).

- `libraryStore.recents.test.ts` — tests `recordVideoOpened` and `removeVideoRecent` with concrete examples (single insert, replacement, cap overflow, removal of absent id).
- `libraryStore.resume.test.ts` — example tests for `setVideoResume`/`clearVideoResume` covering the three branches of `setVideoResume` (positive, zero, negative).
- `libraryStore.prune.test.ts` — example tests for the prune action across recents, resume, and favorites.
- `useResumePosition.test.tsx` — example tests with fake timers covering the periodic save (5 s ± 250 ms tolerance), the cleanup save on unmount, and the clear on `onEnd` (Requirements 3.1, 3.2, 3.5).
- `VideoPosterCard.test.tsx` — example/snapshot tests for the card's badge presence rules and progress overlay (combined with property tests for the rendering rule itself).
- `VideoTab.layout.test.tsx` — example tests asserting section order, empty-state captions ("No recent videos yet", "No favorite videos yet", "No folders found"), and header text "Recent" (per 9.4) and "Favorites".
- `AllVideosScreen.test.tsx` — example tests for default sort `'name'`, sort chip switching, empty state, error state, and long-press → MediaActionSheet wiring.
- `MediaActionSheet.recents.test.tsx` — example tests asserting that when `source === 'recents'` the actions array contains "Play from start" and "Remove from Recent" plus exactly one of "Add to Favorites" / "Remove from Favorites".
- `hiddenFolderFilter.test.ts` — example edge cases for null/undefined/whitespace paths and Unicode normalisation (Requirements 7.4, 7.5).

### Property-based tests

PBT library: **fast-check** (already standard for React Native projects on Jest; not currently in the repo so it will be added as a dev dependency in the implementation phase).

Each property test:

- runs minimum **100** iterations (`fc.assert(prop, { numRuns: 100 })`);
- carries a tag comment of the form `// Feature: video-section-improvements, Property N: <title>`;
- targets a single Correctness Property from the design document;
- is implemented as a SINGLE property test per Correctness Property (one-to-one mapping).

| Property | Test file | Generators |
|----------|-----------|------------|
| 1, 2     | `libraryStore.recents.property.test.ts` | `RecentEntry[]`, sequences of `recordVideoOpened` ops with random `videoId` and random `atMs` |
| 3        | `recentsSelector.property.test.ts` | `(videoRecents, videos, privateIds)` with fast-check oneof for valid/invalid ids; mocked `fsExists` |
| 4        | `resumeDecision.property.test.ts` | `(resume, duration)` over `[0, 100000]` |
| 5        | `libraryStore.resume.property.test.ts` | sequences of `setVideoResume` / `clearVideoResume` ops |
| 6        | `videoPosterCard.progress.property.test.tsx` | `(progress in [0, 1], tileWidth in [0, 1000])` |
| 7        | `playFromStart.property.test.ts` | `(videoResume map, id)` |
| 8        | `removeVideoRecent.property.test.ts` | `(videoRecents, id)` |
| 9        | `addFavorite.property.test.ts` | `(favorites: string[], id)` |
| 10       | `removeFavorite.property.test.ts` | `(favorites: string[], id)` |
| 11       | `favoritesSelector.property.test.ts` | `(favorites, videos, privateIds)` |
| 12       | `normalisePathSegments.property.test.ts` | `fc.string()` plus a hand-crafted generator for paths with mixed `/` and `\` |
| 13       | `isHidden.property.test.ts` | `(path, fsHasNoMedia)` with paths that include and exclude hidden literals at random positions |
| 14       | `sortAllVideos.property.test.ts` | `(Video[], RecentEntry[], sortMode)` parameterised over the four modes |
| 15       | `folderGrid.notFiltered.property.test.tsx` | `Video[]` mixing hidden and non-hidden paths |
| 16       | `pruneVideoLibrary.property.test.ts` | `(videoRecents, videoResume, favorites, videos, songs)` |
| 17       | `videoPosterCard.render.property.test.tsx` | `Video` arbitrary covering thumbnail null/non-null, duration zero/positive, width/height zero/positive |

Generators and shrinkers will live in `src/utils/__tests__/generators.ts` (e.g., `arbVideo`, `arbRecentEntry`, `arbHiddenPath`, `arbVisiblePath`) so they can be reused across multiple property files.

### Integration tests (kept narrow, not PBT)

- `mmkv.persistence.integration.test.ts` — verifies that after `recordVideoOpened` and `setVideoResume`, the MMKV blob round-trips on reload (covers Requirement 2.5 and the persistence half of 3.9).
- `nomediaProbe.integration.test.ts` — runs against a real temporary directory created with `RNFS.mkdir` plus a real `.nomedia` file, asserting `probeNoMediaMarker` resolves correctly within 500 ms (covers Requirement 7.3 in a real RNFS environment).
- `videoTab.focus.integration.test.tsx` — mounts `VideoTab` with a populated store containing stale ids, simulates a focus event, and asserts `pruneVideoLibrary` ran within 500 ms (covers Requirement 8.1 lifecycle).

### Smoke / lint checks

Two project-wide lint rules cover the static-analysis requirements:

- An ESLint rule (or a small Jest-based AST scan in `tests/lint/no-inline-styles.test.ts`) verifies that no file under `src/screens/video/`, `src/components/video/`, or new files added by this feature contains `style={{` or `StyleSheet.create(` calls inside component bodies (Requirement 9.7).
- A second scan (`tests/lint/poppins-only.test.ts`) verifies that every `Text` style under `src/styles/screens/video/` and `src/styles/components/video/` declares `fontFamily` from the allowed set and never declares `fontWeight` (Requirement 9.8).

These run once per CI run (single execution, deterministic, no inputs to vary), matching the SMOKE classification.
