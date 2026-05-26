# Implementation Plan: Video Section Improvements

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

## Overview

Implementation proceeds bottom-up: pure utilities and store reducers first, then the resume hook, then presentational components, then screens, and finally the `VideoTab` rewire that integrates everything. Property tests are placed immediately after the pure logic they validate so regressions are caught early. The existing `VideoListItem`, `EmbeddedVideoPlayer`, `MediaActionSheet`, and folder grid are reused or extended rather than replaced.

## Tasks

- [ ] 1. Set up constants, types, and shared generators
  - [ ] 1.1 Add feature constants to `src/utils/constants.ts`
    - Export `RECENTS_CAP = 20`, `RESUME_SAVE_INTERVAL_MS = 5000`, `RESUME_SAVE_INTERVAL_TOLERANCE_MS = 250`, `NOMEDIA_PROBE_TIMEOUT_MS = 500`, `CONTINUE_WATCHING_LOWER = 0.05`, `CONTINUE_WATCHING_UPPER = 0.95`
    - _Requirements: 2.3, 3.1, 4.1, 7.4_

  - [ ] 1.2 Add `RecentEntry` type and persisted-state additions
    - Add `RecentEntry = { videoId: string; lastOpenedAt: number }` to `src/types/index.ts` (or a new `src/types/Recents.ts`)
    - Export the type so the store and selectors can share it
    - _Requirements: 2.1, 2.4_

  - [ ] 1.3 Add fast-check dev dependency and shared property generators
    - Install `fast-check` as a devDependency
    - Create `src/utils/__tests__/generators.ts` exporting `arbVideo`, `arbRecentEntry`, `arbHiddenPath`, `arbVisiblePath`, `arbFavorites` for reuse across property tests
    - _Requirements: foundational for property tests in tasks 3, 4, 5, 6, 9_

- [ ] 2. Implement the Hidden Folder Filter utility
  - [ ] 2.1 Implement `src/utils/hiddenFolderFilter.ts`
    - Implement `normalisePathSegments(path)`: replace `\` with `/`, split on `/`, drop empty segments, NFC-normalise
    - Implement `isHiddenBySegment(path)`: case-insensitive match against `WhatsApp`, `Status`, `.nomedia`, `.thumbnails`, `Recorder`, `Call`
    - Implement `probeNoMediaMarker(dir, timeoutMs)`: RNFS check with 500 ms soft timeout, returning `false` on any error
    - Implement an in-memory cache and `warmHiddenFolderCache(videos)` that probes every distinct directory and settles all probes
    - Implement synchronous `isHidden(path)` that combines the segment rule and the cached `.nomedia` rule
    - Treat null, undefined, and whitespace-only paths as not hidden
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 2.2 Write property test for path normalisation
    - **Property 12: Path normalisation**
    - **Validates: Requirements 7.1**
    - File: `src/utils/__tests__/normalisePathSegments.property.test.ts`
    - Tag: `// Feature: video-section-improvements, Property 12: Path normalisation`
    - Generators: `fc.string()` plus a hand-crafted generator for paths with mixed `/` and `\`
    - Assert no segment is empty, no segment contains separators, and the segments come from the documented split rule

  - [ ]* 2.3 Write property test for hidden folder predicate
    - **Property 13: Hidden folder predicate**
    - **Validates: Requirements 7.2, 7.3, 7.5**
    - File: `src/utils/__tests__/isHidden.property.test.ts`
    - Generators: `(path, fsHasNoMedia)` with paths that include and exclude hidden literals at random positions
    - Assert the if-and-only-if relationship and the null/undefined/whitespace-input rule

  - [ ]* 2.4 Write example tests for edge cases
    - File: `src/utils/__tests__/hiddenFolderFilter.test.ts`
    - Cover null, undefined, and whitespace-only paths, Unicode NFC equivalents, and probe failure paths
    - _Requirements: 7.4, 7.5_

  - [ ]* 2.5 Write integration test for `.nomedia` probe
    - File: `src/utils/__tests__/nomediaProbe.integration.test.ts`
    - Use real `RNFS.mkdir` plus a real `.nomedia` file under a temp directory, assert `probeNoMediaMarker` resolves correctly within 500 ms
    - _Requirements: 7.3_

- [ ] 3. Extend `useLibraryStore` with recents, resume, and prune
  - [ ] 3.1 Add persisted slice fields and migration in `src/store/libraryStore.ts`
    - Add `videoRecents: RecentEntry[]` and `videoResume: Record<string, number>` to the persisted state with safe defaults `[]` and `{}`
    - Extend `partialize` to include the new fields
    - Extend `migrateLibraryPersistedState` to backfill the new fields and bump `LIBRARY_VIDEO_CACHE_VERSION` to `3`
    - _Requirements: 2.5, 3.9_

  - [ ] 3.2 Implement recents reducers (`recordVideoOpened`, `removeVideoRecent`)
    - `recordVideoOpened(id, atMs?)` replaces any existing entry, prepends, then truncates to `RECENTS_CAP` dropping smallest `lastOpenedAt` first, ties by lex-smaller `videoId`
    - Maintain the four invariants: length cap, descending `lastOpenedAt` with `videoId` tiebreak, no duplicates, single occurrence per id
    - `removeVideoRecent(id)` removes every entry matching `id`
    - _Requirements: 2.1, 2.3, 2.4, 4.5_

  - [ ]* 3.3 Write property test for recents reducer invariant
    - **Property 1: Recents reducer invariant**
    - **Validates: Requirements 2.1, 2.3, 2.4**
    - File: `src/store/__tests__/libraryStore.recents.property.test.ts`
    - Generators: `RecentEntry[]` plus sequences of `recordVideoOpened` ops with random `videoId`/`atMs`
    - Assert length cap, sort order, uniqueness, and the most-recent-call-at-index-0 condition

  - [ ]* 3.4 Write property test for replace-on-same-id semantics
    - **Property 2: Recents replace-on-same-id semantics**
    - **Validates: Requirements 2.1**
    - File: `src/store/__tests__/libraryStore.recents.replace.property.test.ts`
    - Assert exactly one entry has the given `videoId` after the call and its `lastOpenedAt` equals the call's `atMs`

  - [ ]* 3.5 Write property test for remove-from-recent semantics
    - **Property 8: Remove-from-recent semantics**
    - **Validates: Requirements 4.5**
    - File: `src/store/__tests__/removeVideoRecent.property.test.ts`
    - Assert the result equals `videoRecents.filter(e => e.videoId !== id)` and other entries' relative order is preserved

  - [ ]* 3.6 Write example tests for recents reducers
    - File: `src/store/__tests__/libraryStore.recents.test.ts`
    - Cover single insert, replacement, cap overflow, removal of absent id
    - _Requirements: 2.1, 2.3, 4.5_

  - [ ] 3.7 Implement resume reducers (`setVideoResume`, `clearVideoResume`)
    - `setVideoResume(id, seconds)` clamps to `[0, ∞)` and stores `Math.floor(seconds)`. If `seconds <= 0`, delete the key instead
    - `clearVideoResume(id)` removes the key (no-op if absent)
    - Maintain invariants: every value is a non-negative integer, each id appears at most once
    - _Requirements: 3.5, 3.9_

  - [ ]* 3.8 Write property test for resume map invariant
    - **Property 5: Resume map invariant**
    - **Validates: Requirements 3.9, 3.5**
    - File: `src/store/__tests__/libraryStore.resume.property.test.ts`
    - Generators: sequences of `setVideoResume` / `clearVideoResume` calls
    - Assert every value is a non-negative integer, ids appear once, and clearing removes the key

  - [ ]* 3.9 Write example tests for resume reducers
    - File: `src/store/__tests__/libraryStore.resume.test.ts`
    - Cover the three branches of `setVideoResume` (positive, zero, negative)
    - _Requirements: 3.5, 3.9_

  - [ ] 3.10 Implement `pruneVideoLibrary` action
    - Single atomic `set` that drops `videoRecents` entries whose `videoId` is absent from `videos`, drops `videoResume` keys absent from `videos`, and drops `favorites` ids absent from both `videos` and `songs`
    - On thrown exception, surface a one-shot non-blocking `themedAlert` toast and leave persisted state unchanged
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

  - [ ]* 3.11 Write property test for prune projection
    - **Property 16: Prune is a projection**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.5**
    - File: `src/store/__tests__/pruneVideoLibrary.property.test.ts`
    - Generators: `(videoRecents, videoResume, favorites, videos, songs)` arbitraries
    - Assert subsequence projection on each slice and that prune is idempotent

  - [ ]* 3.12 Write example tests for prune
    - File: `src/store/__tests__/libraryStore.prune.test.ts`
    - Cover stale recents, stale resume keys, stale favorites in both songs and videos collections
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 3.13 Write integration test for MMKV persistence
    - File: `src/store/__tests__/mmkv.persistence.integration.test.ts`
    - Verify `recordVideoOpened` and `setVideoResume` round-trip through MMKV on reload
    - _Requirements: 2.5, 3.9_

- [ ] 4. Implement the resume-decision rule and All Videos sort utility
  - [ ] 4.1 Implement `shouldResume(resume, duration)` in `src/utils/resumeDecision.ts`
    - Pure function returning `resume > 0 && resume < duration`
    - Used by `useResumePosition`, `AllVideosScreen` open helper, and Recents tap dispatch
    - _Requirements: 3.3, 3.4, 6.10_

  - [ ]* 4.2 Write property test for resume decision rule
    - **Property 4: Resume decision rule**
    - **Validates: Requirements 3.3, 3.4, 6.10**
    - File: `src/utils/__tests__/resumeDecision.property.test.ts`
    - Generators: `(resume, duration)` over `[0, 100000]`
    - Assert the if-and-only-if relationship

  - [ ] 4.3 Implement `sortAllVideos` in `src/utils/videoSort.ts`
    - `SortMode = 'name' | 'recent' | 'size' | 'duration'`
    - `name`: case-insensitive ascending `title`, ties by ascending `id`
    - `recent`: has-recent group first (descending `lastOpenedAt`, ties by ascending `title`), no-recent group second (ascending `title`)
    - `size`: descending `sizeBytes`, ties by ascending `title`
    - `duration`: descending `duration`, ties by ascending `title`
    - Returns a new array, does not mutate input
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ]* 4.4 Write property test for All Videos selector and sort
    - **Property 14: All-videos selector and sort**
    - **Validates: Requirements 6.2, 6.5, 6.6, 6.7, 6.8**
    - File: `src/utils/__tests__/sortAllVideos.property.test.ts`
    - Parameterise over the four sort modes; assert permutation of the filtered input, monotone non-decreasing under each ordering relation, stability, and no input mutation

- [ ] 5. Implement the resume-position controller hook
  - [ ] 5.1 Create `src/components/video/hooks/useResumePosition.ts`
    - On video load: read `videoResume[id]`; if `shouldResume(resume, dur)` then `videoRef.current.seek(resume)`; call `recordVideoOpened(id)` once per mount AFTER successful load
    - Periodic save: `setInterval` every 5000 ms ± 250 ms tolerance calling `setVideoResume(id, Math.floor(currentPos))`
    - Cleanup save: flush a final `setVideoResume` synchronously inside the `useEffect` cleanup
    - On `onEnd`: call `clearVideoResume(id)`
    - Defensive try/catch around store calls so a persistence failure does not interrupt playback
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_

  - [ ]* 5.2 Write example tests for `useResumePosition` with fake timers
    - File: `src/components/video/hooks/__tests__/useResumePosition.test.tsx`
    - Cover periodic save (5 s ± 250 ms tolerance), cleanup save on unmount, clear on `onEnd`, no-op when `shouldResume` is false, no-recents on load failure
    - _Requirements: 2.2, 3.1, 3.2, 3.5_

- [ ] 6. Build the `VideoPosterCard` component
  - [ ] 6.1 Create `src/styles/components/video/VideoPosterCardStyles.ts`
    - All `Text` styles use `fontFamily` from the allowed Poppins set and never set `fontWeight`
    - Includes thumbnail wrapper, badges, title, and progress overlay styles
    - _Requirements: 9.7, 9.8_

  - [ ] 6.2 Implement `src/components/video/VideoPosterCard.tsx`
    - Props: `{ video, watchProgress, showProgress, onPress, onLongPress, width? }`
    - 16:9 thumbnail with rounded corners; placeholder gradient + play icon when `thumbnailUri` is null
    - Duration badge (bottom-right) using `formatTime(duration)`, omitted when `duration === 0`
    - Resolution badge (top-left) showing `SD`/`HD`/`FHD`/`4K`, omitted when `width` or `height` is `0`
    - Title `Text` with `numberOfLines={2}` below thumbnail
    - Progress overlay: a 3 px tall bar absolutely positioned at thumbnail bottom edge, fill width `Math.min(Math.round(progress * tileWidth), tileWidth)`, rendered ONLY when `showProgress && CONTINUE_WATCHING_LOWER <= progress <= CONTINUE_WATCHING_UPPER`
    - All styles imported from the style module; no inline `style={{...}}` literals
    - _Requirements: 3.6, 3.7, 9.1, 9.2, 9.3, 9.7, 9.8_

  - [ ]* 6.3 Write property test for Continue Watching progress overlay
    - **Property 6: Continue Watching progress overlay**
    - **Validates: Requirements 3.6, 3.7**
    - File: `src/components/video/__tests__/videoPosterCard.progress.property.test.tsx`
    - Generators: `(progress in [0, 1], tileWidth in [0, 1000])`
    - Assert overlay presence and bar fill width formula and bound

  - [ ]* 6.4 Write property test for poster card rendering
    - **Property 17: VideoPosterCard rendering**
    - **Validates: Requirements 9.1, 9.2, 9.3**
    - File: `src/components/video/__tests__/videoPosterCard.render.property.test.tsx`
    - Generator: `Video` arbitrary covering thumbnail null/non-null, duration zero/positive, width/height zero/positive
    - Assert thumbnail vs placeholder, duration badge presence, resolution badge presence rules

  - [ ]* 6.5 Write example/snapshot tests for `VideoPosterCard`
    - File: `src/components/video/__tests__/VideoPosterCard.test.tsx`
    - Cover badge presence rules and progress overlay rendering with concrete examples
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 7. Build the Recents and Favorites section selectors and components
  - [ ] 7.1 Implement `src/components/video/selectors/recentsSelector.ts`
    - Pure function joining `videoRecents` to `videos`, dropping unresolved ids, applying `privateIds` exclusion, applying `isHidden(path)` exclusion, applying file-existence check
    - Preserves the descending-`lastOpenedAt` order of `videoRecents` and does not mutate the input
    - _Requirements: 2.6, 2.7, 2.8_

  - [ ]* 7.2 Write property test for Recents render selector
    - **Property 3: Recents render selector**
    - **Validates: Requirements 2.6, 2.7, 2.8, 7.6**
    - File: `src/components/video/selectors/__tests__/recentsSelector.property.test.ts`
    - Generators: `(videoRecents, videos, privateIds)` with mocked `fsExists` and `hiddenSet`
    - Assert all five conditions plus no-mutation invariant

  - [ ] 7.3 Implement `src/components/video/selectors/favoritesSelector.ts`
    - Returns `[...favorites].reverse()` filtered to ids that resolve to a `Video`, are not in `privateIds`, and whose path is not classified hidden
    - Does not mutate the input `favorites` array
    - _Requirements: 5.7, 5.8, 5.9, 5.10_

  - [ ]* 7.4 Write property test for Favorites render selector
    - **Property 11: Favorites render selector**
    - **Validates: Requirements 5.7, 5.8, 5.9, 5.10**
    - File: `src/components/video/selectors/__tests__/favoritesSelector.property.test.ts`
    - Generators: `(favorites, videos, privateIds)`
    - Assert reversed order, filtering rules, and no input mutation

  - [ ] 7.5 Create `src/styles/components/video/RecentsSectionStyles.ts` and `FavoritesSectionStyles.ts`
    - Header text styles, empty/error caption styles, horizontal list container styles
    - All `Text` styles use Poppins `fontFamily` and never set `fontWeight`
    - _Requirements: 9.4, 9.5, 9.7, 9.8_

  - [ ] 7.6 Implement `src/components/video/RecentsSection.tsx`
    - Header `Text` with literal label `"Recent"` (per Requirement 9.4)
    - Horizontal `FlatList` of `VideoPosterCard` with `showProgress={true}`
    - Empty state caption `"No recent videos yet"` when filtered list is empty
    - Wrap in `<SectionErrorBoundary>` that renders an inline error caption while preserving header and layout position
    - Props expose `onTapResume`, `onTapStart`, `onLongPress(video, source)` so `VideoTab` decides dispatch
    - _Requirements: 1.2, 1.4, 1.7, 2.9, 9.4_

  - [ ] 7.7 Implement `src/components/video/FavoritesSection.tsx`
    - Header `Text` with literal label `"Favorites"`
    - Horizontal `FlatList` of `VideoPosterCard` with `showProgress={false}`
    - Empty state caption `"No favorite videos yet"` when filtered list is empty
    - Wrap in `<SectionErrorBoundary>`
    - _Requirements: 1.3, 1.5, 1.7, 9.5_

- [ ] 8. Implement favorites add/remove helpers used by the action sheet
  - [ ] 8.1 Add `addFavorite`/`removeFavorite` helpers (or expose existing logic) shared with songs
    - `addFavorite(favorites, id)` returns input unchanged if `favorites.includes(id)`, otherwise `[...favorites, id]`
    - `removeFavorite(favorites, id)` returns `favorites.filter(x => x !== id)`
    - Wire to `useLibraryStore.favorites` actions; preserve existing audio-favorite behaviour
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 8.2 Write property test for add-favorite idempotence
    - **Property 9: Add-favorite is idempotent and appending**
    - **Validates: Requirements 5.1, 5.3, 5.4**
    - File: `src/store/__tests__/addFavorite.property.test.ts`
    - Assert idempotence on already-present id and append-to-end on absent id

  - [ ]* 8.3 Write property test for remove-favorite semantics
    - **Property 10: Remove-favorite is identity-when-absent and full-removal-when-present**
    - **Validates: Requirements 5.5, 5.6**
    - File: `src/store/__tests__/removeFavorite.property.test.ts`
    - Assert structural equality when id is absent, full removal when present

- [ ] 9. Extend `MediaActionSheet` with Recents-specific actions
  - [ ] 9.1 Add a `source` prop to `MediaActionSheet`
    - `MediaActionSource = 'recents' | 'favorites' | 'all-videos' | 'folder' | 'song'`
    - Type the prop on `MediaActionSheetProps` and thread it through internal action computation
    - _Requirements: 4.3_

  - [ ] 9.2 Add "Play from start" and "Remove from Recent" actions when `type === 'video'` and `source === 'recents'`
    - "Play from start" calls `clearVideoResume(id)` then opens the video from position zero within 1000 ms
    - "Remove from Recent" calls `removeVideoRecent(id)` and dismisses the sheet
    - Show exactly one of "Add to Favorites" / "Remove from Favorites" based on `favorites.includes(id)`
    - Reuse the existing `optionRow` style; no new inline styles
    - _Requirements: 4.3, 4.4, 4.5, 5.2_

  - [ ]* 9.3 Write property test for play-from-start clears resume
    - **Property 7: Play-from-start clears resume**
    - **Validates: Requirements 4.4**
    - File: `src/components/common/__tests__/playFromStart.property.test.ts`
    - Generators: `(videoResume map, id)`
    - Assert `videoResume[id]` is undefined after the handler and the open-from-zero path is taken

  - [ ]* 9.4 Write example tests for the Recents action sheet
    - File: `src/components/common/__tests__/MediaActionSheet.recents.test.tsx`
    - Assert that when `source === 'recents'` the actions array contains "Play from start" and "Remove from Recent" plus exactly one of "Add to Favorites"/"Remove from Favorites"
    - _Requirements: 4.3_

- [ ] 10. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Build the All Videos screen and navigation entry
  - [ ] 11.1 Add `AllVideos` to `VideoStackParamList` and register the screen in `src/navigation/VideoStack.tsx`
    - Add `<Stack.Screen name="AllVideos" component={AllVideosScreen} />`
    - _Requirements: 6.1_

  - [ ] 11.2 Create `src/styles/screens/video/AllVideosStyles.ts`
    - Header, sort-chip row, list, empty-state caption styles
    - All `Text` styles use Poppins `fontFamily` and never set `fontWeight`
    - _Requirements: 9.6, 9.7, 9.8_

  - [ ] 11.3 Implement `src/screens/video/AllVideosScreen.tsx`
    - Header with back chevron and title `"All Videos"` (per Requirement 9.6)
    - Local `sortMode` state defaulting to `'name'`; sort chip row with options Name / Recent / Size / Duration
    - `FlashList` of `VideoListItem` driven by `sortAllVideos(visibleVideos, recents, sortMode)`
    - `visibleVideos` excludes `privateIds` and `isHidden` paths
    - Empty state when `visibleVideos.length === 0`
    - Tap handler uses `shouldResume` and opens via `useVideoPlayerStore.openVideo`
    - On unreadable/missing source the screen stays put, shows an error message, preserves sort and scroll position
    - Long-press opens `MediaActionSheet` with `source: 'all-videos'` within 300 ms
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 9.6_

  - [ ]* 11.4 Write example tests for `AllVideosScreen`
    - File: `src/screens/video/__tests__/AllVideosScreen.test.tsx`
    - Cover default sort `'name'`, sort chip switching, empty state, error state, long-press → MediaActionSheet wiring
    - _Requirements: 6.3, 6.4, 6.11, 6.12_

- [ ] 12. Rewire `VideoTab` to integrate sections and pruning
  - [ ] 12.1 Extend `src/styles/screens/video/VideoTabStyles.ts`
    - Add section header, empty-caption, "All Videos" header button styles
    - All `Text` styles use Poppins `fontFamily` and never set `fontWeight`
    - _Requirements: 1.2, 1.3, 9.7, 9.8_

  - [ ] 12.2 Replace VideoTab outer layout with a vertical `ScrollView`
    - Region 1: `RecentsSection`; Region 2: `FavoritesSection`; Region 3: existing folder grid (unchanged, including `groupVideosByFolder` order, including hidden folders)
    - Folder grid keeps position 3 regardless of whether the rows above have entries
    - When `groupVideosByFolder` returns zero folders, render the empty caption `"No folders found"` in place of the grid while preserving the region
    - Render the inner folder `FlashList` with `nestedScrollEnabled` and `scrollEnabled={false}`
    - _Requirements: 1.1, 1.6, 7.7_

  - [ ] 12.3 Add the "All Videos" header navigation control
    - Pressable with the visible label `"All Videos"` plus chevron next to the existing search/scan controls
    - Navigates to the `AllVideos` screen on tap
    - _Requirements: 6.1, 9.6_

  - [ ] 12.4 Wire tap and long-press dispatch for Recents and Favorites
    - Tap on Recents tile: compute `progress = videoResume[id] / duration`. If `0.05 <= progress <= 0.95`, call resume path (player picks up resume via `useResumePosition`). Otherwise clear `videoResume[id]` defensively and open from zero
    - Tap on Favorites tile: open via the same path that `VideoListItem` uses for the same video (Requirement 9.9)
    - Long-press (≥ 500 ms) opens `MediaActionSheet` within 300 ms with `source: 'recents'` or `'favorites'` accordingly, suppressing the tap-to-play for that gesture
    - On any failure, retain the original Recents_Entry state, dismiss the sheet, and show a user-visible error within 1000 ms
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 9.9_

  - [ ] 12.5 Run prune and warm hidden-folder cache on tab focus and after `scanLibrary`
    - Use `useFocusEffect` to call `pruneVideoLibrary()` and `warmHiddenFolderCache(videos)` within 500 ms of focus, debounced behind a "did-prune-this-session" flag
    - Subscribe to `scanLibrary` completion to re-run the prune and clear the hidden-folder cache
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 12.6 Write example tests for `VideoTab` layout
    - File: `src/screens/video/__tests__/VideoTab.layout.test.tsx`
    - Assert section order, empty captions ("No recent videos yet", "No favorite videos yet", "No folders found"), header text "Recent" and "Favorites"
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 9.4, 9.5_

  - [ ]* 12.7 Write integration test for tab-focus pruning
    - File: `src/screens/video/__tests__/videoTab.focus.integration.test.tsx`
    - Mount `VideoTab` with stale ids in store, simulate focus, assert `pruneVideoLibrary` ran within 500 ms
    - _Requirements: 8.1_

- [ ] 13. Wire the resume hook into `EmbeddedVideoPlayer`
  - [ ] 13.1 Compose `useResumePosition` into the existing `EmbeddedVideoPlayer`
    - Pass the active `VideoItem`, the `videoRef`, and current `pos`/`dur` from player state
    - Forward `onEnd` so the hook can clear `videoResume[id]`
    - Verify the hook does not double-record `recordVideoOpened` across re-renders
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 13.2 Ensure failed loads do not pollute Recents
    - Confirm `recordVideoOpened` runs only AFTER successful `onLoad`, never on decoder error
    - _Requirements: 2.2_

- [ ] 14. Folder-grid invariance verification
  - [ ]* 14.1 Write property test asserting folder grid is never filtered by hidden
    - **Property 15: Folder grid is the inverse — never filtered by hidden**
    - **Validates: Requirements 1.6, 7.7**
    - File: `src/screens/video/__tests__/folderGrid.notFiltered.property.test.tsx`
    - Generators: `Video[]` mixing hidden and non-hidden paths
    - Assert the rendered VideoTab folder grid contains every folder produced by `groupVideosByFolder(videos)` in order, including hidden ones

- [ ] 15. Lint-style smoke checks
  - [ ]* 15.1 Add `tests/lint/no-inline-styles.test.ts`
    - AST scan asserting no `style={{` or `StyleSheet.create(` calls inside component bodies under `src/screens/video/`, `src/components/video/`, or new files added by this feature
    - _Requirements: 9.7_

  - [ ]* 15.2 Add `tests/lint/poppins-only.test.ts`
    - AST scan asserting every `Text` style under `src/styles/screens/video/` and `src/styles/components/video/` declares `fontFamily` from the allowed Poppins set and never declares `fontWeight`
    - _Requirements: 9.8_

- [ ] 16. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP, but the property tests there are the primary correctness signal for the pure logic.
- Each task references granular requirements clauses for traceability rather than just user stories.
- Property tests use fast-check; each property test file is tagged with `// Feature: video-section-improvements, Property N: <title>` and runs with `numRuns: 100`.
- Per the design's note on the Requirement 1.2 vs 9.4 header-label discrepancy, the implementation uses `"Recent"` (the more specific Requirement 9.4 wins). Flag this in code review.
- Style modules under `src/styles/screens/video/` and `src/styles/components/video/` are the only place inline style objects are allowed; no `style={{...}}` literals inside component files.
- Every introduced `Text` element sets `fontFamily` to one of the allowed Poppins variants and never sets `fontWeight`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "4.1", "4.3"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "4.2", "4.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.7", "3.10", "8.1"] },
    { "id": 4, "tasks": ["3.3", "3.4", "3.5", "3.6", "3.8", "3.9", "3.11", "3.12", "3.13", "8.2", "8.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1", "7.1", "7.3", "7.5", "9.1"] },
    { "id": 6, "tasks": ["6.2", "7.2", "7.4", "9.2"] },
    { "id": 7, "tasks": ["6.3", "6.4", "6.5", "7.6", "7.7", "9.3", "9.4", "11.1", "11.2"] },
    { "id": 8, "tasks": ["11.3"] },
    { "id": 9, "tasks": ["11.4", "12.1"] },
    { "id": 10, "tasks": ["12.2"] },
    { "id": 11, "tasks": ["12.3", "12.4", "12.5"] },
    { "id": 12, "tasks": ["12.6", "12.7", "13.1"] },
    { "id": 13, "tasks": ["13.2", "14.1", "15.1", "15.2"] }
  ]
}
```

## Workflow Completion

This workflow created the design and planning artifacts only. It did not implement the feature. To begin executing tasks, open `tasks.md` and click "Start task" next to the task items.
