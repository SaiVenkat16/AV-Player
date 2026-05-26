# Requirements Document

## Introduction

The Video section of AV Player currently shows a folder grid on the Video tab and a per-folder list. Users have no way to find recently opened videos, resume partially watched videos, or favorite videos for quick access. This feature restructures the Video tab to surface "Continue Watching / Recent" and "Favorites" rows above the existing folder grid, adds a dedicated "All Videos" screen reachable from the tab header, persists per-video resume positions, allows favoriting videos through the existing long-press action sheet, and excludes hidden / system folders (WhatsApp, .nomedia, .thumbnails, Recorder, Call) from the new flat / horizontal lists. Stale entries (whose underlying file is no longer present) are pruned automatically. The Video tab folder grid itself is left unchanged.

## Glossary

- **Video_Tab**: The top-level Video tab screen (`src/screens/video/VideoTab.tsx`) that hosts video library sections and the folder grid.
- **Video_Library**: The set of `Video` records currently in `useLibraryStore.videos`, excluding ids in `useLibraryStore.privateIds`.
- **Recents_Section**: A horizontal row on the Video_Tab that combines recently opened videos and partially watched videos, ordered by last-opened time.
- **Favorites_Section**: A horizontal row on the Video_Tab that lists videos whose id is contained in `useLibraryStore.favorites`.
- **All_Videos_Screen**: A new screen reachable from the Video_Tab header that shows every visible video as a flat list with sort and search controls.
- **Hidden_Folder_Filter**: A predicate that identifies folders to exclude from Recents_Section, Favorites_Section, and All_Videos_Screen. A folder is hidden when any path segment, compared case-insensitively, equals one of: `WhatsApp`, `Status`, `.nomedia`, `.thumbnails`, `Recorder`, `Call`; or when the folder contains a file named `.nomedia`.
- **Video_Player**: The full-screen video playback overlay (`VideoPlayerOverlay` + `EmbeddedVideoPlayer`).
- **Resume_Position**: A non-negative integer number of seconds in the range 0 to video `duration`, persisted per video id in MMKV, representing where playback should resume.
- **Watch_Progress**: The ratio `Resume_Position / duration` for a given video, clamped to the range 0.0 to 1.0.
- **Continue_Watching_Eligible**: A video is Continue_Watching_Eligible when `0.05 <= Watch_Progress <= 0.95`.
- **Recents_Entry**: A persisted record `{ videoId, lastOpenedAt }` representing one entry in Recents_Section.
- **Recents_Cap**: The maximum number of Recents_Entry records retained, set to 20.
- **MediaActionSheet**: The existing long-press action sheet (`src/components/common/MediaActionSheet.tsx`) used for songs and videos.
- **Stale_Entry**: A Recents_Entry, favorite id, or Resume_Position whose `videoId` does not match any `Video` record in `useLibraryStore.videos`.

## Requirements

### Requirement 1: Video Tab section layout

**User Story:** As a user, I want the Video_Tab to surface my recently watched and favorite videos above the folder grid, so that I can resume or replay videos without drilling into folders.

#### Acceptance Criteria

1. THE Video_Tab SHALL render, in vertical order from top to bottom, the Recents_Section in position 1, the Favorites_Section in position 2, and the existing folder grid in position 3, AND THE Video_Tab SHALL keep the folder grid in position 3 regardless of whether the Recents_Section or Favorites_Section above contain entries or are empty.
2. THE Video_Tab SHALL always render the Recents_Section header row with the visible label "Recents", AND WHERE the Recents_Section entry list contains zero entries, THE Video_Tab SHALL render, in place of the entry row, a single placeholder caption with the exact text "No recent videos yet".
3. THE Video_Tab SHALL always render the Favorites_Section header row with the visible label "Favorites", AND WHERE the Favorites_Section entry list contains zero entries, THE Video_Tab SHALL render, in place of the entry row, a single placeholder caption with the exact text "No favorite videos yet".
4. THE Recents_Section SHALL render its entries in a single horizontal row in most-recent-first order, AND WHEN the combined rendered width of the entries exceeds the available Video_Tab viewport width, THE Recents_Section SHALL allow horizontal scrolling that exposes every entry in the list without truncation.
5. THE Favorites_Section SHALL render its entries in a single horizontal row, AND WHEN the combined rendered width of the entries exceeds the available Video_Tab viewport width, THE Favorites_Section SHALL allow horizontal scrolling that exposes every entry in the list without truncation.
6. THE Video_Tab folder grid SHALL display every folder returned by `groupVideosByFolder`, including folders matched by the Hidden_Folder_Filter, in the same order produced by `groupVideosByFolder`, AND IF `groupVideosByFolder` returns zero folders, THEN THE Video_Tab SHALL render an empty-state caption with the exact text "No folders found" in place of the folder grid while still keeping the folder grid region in position 3.
7. IF loading the Recents_Section entries or the Favorites_Section entries fails, THEN THE Video_Tab SHALL render, in place of the affected section's entry row, an inline error caption indicating that the section could not be loaded and SHALL preserve the section header and the layout positions of all three sections.

### Requirement 2: Recents tracking and persistence

**User Story:** As a user, I want videos I open to be remembered in a Recents list, so that I can find them again quickly on the Video_Tab.

#### Acceptance Criteria

1. WHEN the Video_Player successfully begins playback of a video with id `V`, THE Video_Library SHALL record a Recents_Entry with `videoId = V` and `lastOpenedAt = current epoch milliseconds`, replacing any existing Recents_Entry whose `videoId = V`.
2. IF the Video_Player fails to load or play a video (e.g., decoder error, unreadable file), THEN THE Video_Library SHALL NOT create or update a Recents_Entry for that video and SHALL leave the existing Recents_Entry list unchanged.
3. WHEN a Recents_Entry is recorded and the resulting Recents_Entry count exceeds Recents_Cap (20), THE Video_Library SHALL discard Recents_Entry items with the smallest `lastOpenedAt` values until the count equals 20, breaking ties by discarding entries with lexicographically smaller `videoId` first.
4. THE Recents_Section SHALL list videos in descending order of `lastOpenedAt`, breaking ties by ascending `videoId`, and SHALL display at most 20 entries.
5. WHEN a Recents_Entry is added, updated, or removed, THE Video_Library SHALL persist the updated Recents_Entry list to the existing MMKV-backed `useLibraryStore` persistence within 500 milliseconds so that the same list is restored on the next app start.
6. THE Recents_Section SHALL exclude from display any Recents_Entry whose `videoId` is contained in `useLibraryStore.privateIds`.
7. THE Recents_Section SHALL exclude from display any Recents_Entry whose corresponding video path matches the Hidden_Folder_Filter (path-segment match against WhatsApp, Status, .nomedia, .thumbnails, Recorder, Call, or a positive .nomedia probe in the containing folder).
8. IF a Recents_Entry references a video file that is no longer present at its recorded path at the time the Recents_Section is rendered, THEN THE Recents_Section SHALL exclude that Recents_Entry from display while retaining it in the persisted list for the current app session.
9. WHILE the filtered Recents_Entry list visible to the Recents_Section contains zero entries, THE Recents_Section SHALL render an empty-state indicator conveying that no recently opened videos are available, instead of an empty list.

### Requirement 3: Resume position and Continue Watching overlay

**User Story:** As a user, I want partially watched videos to remember where I left off and visually show my progress, so that I can pick up where I stopped.

#### Acceptance Criteria

1. WHILE a video is playing in the Video_Player, THE Video_Player SHALL persist the current playback position in whole seconds (0 to video `duration`) as Resume_Position for that video id at an interval of 5 seconds, plus or minus 250 milliseconds.
2. WHEN the Video_Player closes through the back button, hardware back press, or video end, THE Video_Player SHALL persist the final playback position in whole seconds as Resume_Position for that video id within 500 milliseconds of the close event.
3. WHEN the Video_Player opens a video with a stored Resume_Position strictly greater than 0 seconds and strictly less than the video `duration` in seconds, THE Video_Player SHALL seek to Resume_Position before starting playback and SHALL begin playback within 1 second of the seek completing.
4. IF the Video_Player opens a video whose stored Resume_Position is 0, is greater than or equal to `duration`, or references a video id with no stored Resume_Position, THEN THE Video_Player SHALL start playback from position 0 without performing a seek.
5. WHEN the Video_Player reports playback end, THE Video_Player SHALL clear Resume_Position for that video id within 500 milliseconds of the end event such that subsequent reads return no stored value.
6. THE Recents_Section SHALL render a horizontal progress bar overlay on each tile whose video is Continue_Watching_Eligible, with bar fill width equal to round(Watch_Progress * tile width in pixels) and bar fill bounded to the tile width.
7. WHERE a Recents_Section tile is not Continue_Watching_Eligible, THE Recents_Section SHALL render the tile without a progress bar overlay.
8. IF persistence of Resume_Position via the existing MMKV-backed `useLibraryStore` fails, THEN THE Video_Player SHALL retain the last in-memory Resume_Position for the active session and SHALL not interrupt playback.
9. THE Resume_Position values SHALL be persisted using the existing MMKV-backed `useLibraryStore` persistence, keyed by video id, with at most one stored Resume_Position per video id.

### Requirement 4: Recents tile interactions

**User Story:** As a user, I want clear tap and long-press actions on Recents tiles, so that I can either resume, restart, or manage the entry.

#### Acceptance Criteria

1. WHEN a user taps a Recents_Section tile whose video is Continue_Watching_Eligible (0.05 <= Watch_Progress <= 0.95) and no long-press has been recognised within the same gesture, THE Video_Player SHALL open that video within 1000ms and resume playback from its Resume_Position with a position tolerance of plus or minus 500ms.
2. WHEN a user taps a Recents_Section tile whose video is not Continue_Watching_Eligible and no long-press has been recognised within the same gesture, THE Video_Player SHALL open that video within 1000ms and start playback from position zero.
3. WHEN a user long-presses a Recents_Section tile for at least 500ms, THE Video_Tab SHALL present the MediaActionSheet for that video within 300ms containing the actions "Play from start", "Remove from Recent", exactly one of "Add to Favorites" or "Remove from Favorites" based on the video's current Favorites membership, and the existing MediaActionSheet video actions, and THE Video_Tab SHALL suppress the tap-to-play behaviour for that gesture.
4. WHEN the user selects "Play from start" on a Recents_Section tile, THE Video_Player SHALL clear Resume_Position for that videoId, dismiss the MediaActionSheet, and open the video from position zero within 1000ms.
5. WHEN the user selects "Remove from Recent" on a Recents_Section tile, THE Video_Library SHALL remove the Recents_Entry whose videoId matches the selected video, dismiss the MediaActionSheet, and update the Recents_Section view to omit that entry within 500ms, while preserving all other Recents_Entry records and the underlying video file.
6. IF a tap or long-press action on a Recents_Section tile fails to complete (video unavailable, removal fails, or Resume_Position cannot be cleared), THEN THE Video_Tab SHALL retain the original Recents_Entry state, dismiss any open MediaActionSheet, and present a user-visible error indication describing the failure within 1000ms.

### Requirement 5: Video favorites

**User Story:** As a user, I want to mark videos as favorites and find them in a dedicated row, so that I can replay favorite videos quickly.

#### Acceptance Criteria

1. THE Video_Library SHALL store video favorites by appending the video id (non-empty string, maximum 256 characters) to the existing `useLibraryStore.favorites` array shared with songs, preserving insertion order and persisting the array across app restarts.
2. WHEN a user long-presses a video row anywhere in the Video section for at least 500 milliseconds, THE Video_Tab SHALL present the MediaActionSheet within 300 milliseconds, displaying an "Add to Favorites" action when the video id is not contained in `favorites`, and a "Remove from Favorites" action when the video id is contained in `favorites`, with exactly one of these two actions visible at a time.
3. IF the user selects "Add to Favorites" on a video whose id is already contained in `favorites`, THEN THE Video_Library SHALL leave `favorites` unchanged, dismiss the MediaActionSheet, and produce no duplicate entry and no error indication.
4. WHEN the user selects "Add to Favorites" on a video whose id is not contained in `favorites`, THE Video_Library SHALL append that video id to the end of `favorites`, dismiss the MediaActionSheet, and cause the Favorites_Section to reflect the addition on its next render.
5. WHEN the user selects "Remove from Favorites" on a video whose id is contained in `favorites`, THE Video_Library SHALL remove every occurrence of that video id from `favorites`, dismiss the MediaActionSheet, and cause the Favorites_Section to reflect the removal on its next render.
6. IF the user selects "Remove from Favorites" on a video whose id is not contained in `favorites`, THEN THE Video_Library SHALL leave `favorites` unchanged, dismiss the MediaActionSheet, and produce no error indication.
7. THE Favorites_Section SHALL list videos whose id is contained in `favorites`, ordered by the index of each id in `favorites` from most recently appended (highest index) to least recently appended (lowest index).
8. THE Favorites_Section SHALL exclude any video whose id is contained in `useLibraryStore.privateIds`.
9. THE Favorites_Section SHALL exclude any video whose path matches the Hidden_Folder_Filter.
10. IF a video id contained in `favorites` does not correspond to any video currently available in the Video_Library, THEN THE Favorites_Section SHALL exclude that id from the rendered list and SHALL leave `favorites` unchanged.

### Requirement 6: All Videos screen

**User Story:** As a user, I want a flat list of every video on my device, so that I can browse without navigating folders.

#### Acceptance Criteria

1. THE Video_Tab header SHALL provide a navigation control labeled "All Videos" that, WHEN tapped, opens the All_Videos_Screen.
2. THE All_Videos_Screen SHALL display every video in `useLibraryStore.videos` excluding videos whose id is contained in `useLibraryStore.privateIds` and excluding videos whose path matches the Hidden_Folder_Filter.
3. IF `useLibraryStore.videos` contains zero entries after applying the privateIds and Hidden_Folder_Filter exclusions, THEN THE All_Videos_Screen SHALL display an empty state message indicating no videos are available and SHALL render zero rows.
4. THE All_Videos_Screen SHALL provide sort options Name, Recent, Size, and Duration as user-selectable controls, and SHALL default to Name on first entry to the screen.
5. WHILE the sort option is Name, THE All_Videos_Screen SHALL sort videos by `title` in case-insensitive ascending order, with ties broken by ascending `id`.
6. WHILE the sort option is Recent, THE All_Videos_Screen SHALL sort videos by `lastOpenedAt` in descending order, placing videos without a Recents_Entry after all videos that have one, with ties broken by ascending `title` (case-insensitive).
7. WHILE the sort option is Size, THE All_Videos_Screen SHALL sort videos by `sizeBytes` in descending order, with ties broken by ascending `title` (case-insensitive).
8. WHILE the sort option is Duration, THE All_Videos_Screen SHALL sort videos by `duration` in descending order, with ties broken by ascending `title` (case-insensitive).
9. THE All_Videos_Screen SHALL render each video using the existing `VideoListItem` component.
10. WHEN a user taps a row on the All_Videos_Screen, THE Video_Player SHALL open that video, and IF Resume_Position is greater than zero and less than `duration`, THEN THE Video_Player SHALL resume playback from Resume_Position; OTHERWISE THE Video_Player SHALL begin playback from position zero.
11. IF a tapped video's source file is unreadable or missing at playback time, THEN THE All_Videos_Screen SHALL remain on the list, SHALL display an error message indicating the video cannot be played, and SHALL preserve the current sort option and scroll position.
12. WHEN a user long-presses a row on the All_Videos_Screen, THE All_Videos_Screen SHALL present the MediaActionSheet for that video within 300 milliseconds of the long-press being recognized.

### Requirement 7: Hidden folder filter

**User Story:** As a user, I do not want videos from system or chat-app folders to appear in my flat lists or Recents and Favorites rows, so that those views stay relevant.

#### Acceptance Criteria

1. THE Hidden_Folder_Filter SHALL evaluate each video by replacing every backslash (`\`) in its `path` with a forward slash (`/`) and then splitting the resulting string on `/` into ordered segments, discarding empty segments produced by leading, trailing, or consecutive separators.
2. WHEN any path segment of a video, compared case-insensitively after Unicode NFC normalisation, exactly equals one of the literal names `WhatsApp`, `Status`, `.nomedia`, `.thumbnails`, `Recorder`, or `Call`, THE Hidden_Folder_Filter SHALL classify that video as hidden.
3. WHEN the directory containing a video file is readable and contains an entry whose name equals `.nomedia` (case-sensitive, exact match, regardless of whether it is a file or a directory), THE Hidden_Folder_Filter SHALL classify that video as hidden.
4. IF the directory of a video cannot be read within 500 milliseconds, or the read operation returns an error of any kind (including permission denied, not found, I/O error, or timeout), THEN THE Hidden_Folder_Filter SHALL classify the video as not hidden by the `.nomedia` file rule and SHALL still apply the segment-name rule from criterion 2.
5. IF a video's `path` is null, undefined, or an empty string after trimming whitespace, THEN THE Hidden_Folder_Filter SHALL classify that video as not hidden.
6. THE Recents_Section, Favorites_Section, and All_Videos_Screen SHALL exclude every video classified as hidden by the Hidden_Folder_Filter, such that no excluded video appears in their rendered lists.
7. THE Video_Tab folder grid and the existing per-folder VideoFolderScreen SHALL display videos without applying the Hidden_Folder_Filter, so that hidden-classified videos remain visible in those two views.

### Requirement 8: Stale entry pruning

**User Story:** As a user, I do not want broken or missing videos to appear in Recents, Favorites, or Continue Watching after files are deleted or moved, so that those rows stay accurate.

#### Acceptance Criteria

1. WHEN the user opens the Video_Tab, THE Video_Library SHALL remove every Stale_Entry from the Recents_Entry list within 500 milliseconds of tab activation and SHALL preserve every non-stale Recents_Entry unchanged.
2. WHEN the user opens the Video_Tab, THE Video_Library SHALL remove from `favorites` every favorite id whose corresponding video is absent from `useLibraryStore.videos` and is also absent from `useLibraryStore.songs`, and SHALL retain every favorite id whose target exists in either collection.
3. WHEN the user opens the Video_Tab, THE Video_Library SHALL remove every Resume_Position whose `videoId` is absent from `useLibraryStore.videos` and SHALL retain every Resume_Position whose `videoId` matches a Video record in `useLibraryStore.videos`.
4. WHEN `useLibraryStore.scanLibrary` completes, THE Video_Library SHALL apply the same stale-entry pruning described in 8.1, 8.2, and 8.3 within 500 milliseconds of scan completion and SHALL leave non-stale entries unchanged.
5. WHILE pruning is in progress, THE Recents_Section, Favorites_Section, and Continue Watching overlay SHALL NOT render any Stale_Entry.
6. IF pruning fails to complete due to a store read or write error, THEN THE Video_Library SHALL retain the prior persisted state of `recents`, `favorites`, and `resumePositions` without partial modification and SHALL surface a non-blocking error indication to the user identifying that pruning did not complete.

### Requirement 9: Visual style and tile interaction parity

**User Story:** As a user, I want the new sections to match the rest of the app visually, so that the Video section feels consistent.

#### Acceptance Criteria

1. THE Recents_Section and Favorites_Section SHALL render each tile as a horizontal poster card displaying the same thumbnail image source, duration badge text, and resolution badge text produced by `VideoListItem`, with the duration badge anchored to the bottom-right of the thumbnail and the resolution badge anchored to the top-left of the thumbnail.
2. IF a tile has no thumbnail available, THEN THE Recents_Section and Favorites_Section SHALL render the same placeholder thumbnail used by `VideoListItem` in place of the image.
3. IF a tile has no duration metadata, THEN THE Recents_Section and Favorites_Section SHALL omit the duration badge; IF a tile has no resolution metadata, THEN THE Recents_Section and Favorites_Section SHALL omit the resolution badge.
4. THE Recents_Section header SHALL display the exact text "Recent" with no leading or trailing whitespace and with case preserved.
5. THE Favorites_Section header SHALL display the exact text "Favorites" with no leading or trailing whitespace and with case preserved.
6. THE All_Videos_Screen header SHALL display the exact text "All Videos" with no leading or trailing whitespace and with case preserved.
7. THE Video section SHALL NOT contain any inline `style={{...}}` object literals or inline `StyleSheet.create` calls inside component files, and SHALL import all styles from dedicated style modules located under `src/styles/screens/video/` or `src/styles/components/video/`.
8. THE Video section SHALL set `fontFamily` on every Text element it introduces to one of `Poppins-Regular`, `Poppins-Medium`, `Poppins-SemiBold`, `Poppins-Bold`, or `Poppins-ExtraBold`, and SHALL NOT set the `fontWeight` style property on any Text element it introduces.
9. WHEN a user taps a tile in Recents_Section or Favorites_Section, THE Video section SHALL trigger the same navigation and playback action that `VideoListItem` triggers when tapped for the same video item.
