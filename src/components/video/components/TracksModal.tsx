import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../../theme/colors';
import { styles } from '../../../styles/components/video/TracksModalStyles';

export interface AudioTrackInfo {
  index: number;
  title?: string;
  language?: string;
}

export interface SubtitleTrackInfo {
  /** Stable id used for selection. -1 = none. Source-prefixed for safety. */
  id: number;
  source: 'embedded' | 'external';
  title: string;
  language?: string;
  type?: string;
  index?: number; // original index within its source list
  uri?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  audioTracks: AudioTrackInfo[];
  selectedAudioTrackIdx: number;
  onSelectAudio: (index: number) => void;
  subtitleTracks: SubtitleTrackInfo[];
  /** -1 = subtitles disabled, otherwise matches `id` of selected SubtitleTrackInfo. */
  selectedSubtitleId: number;
  onSelectSubtitle: (id: number) => void;
}

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
  ml: 'Malayalam',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ur: 'Urdu',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  ru: 'Russian',
  ar: 'Arabic',
};

function prettyLang(code?: string): string | undefined {
  if (!code) return undefined;
  const norm = code.toLowerCase().slice(0, 2);
  return LANG_NAMES[norm] ?? code.toUpperCase();
}

function audioLabel(t: AudioTrackInfo): string {
  const lang = prettyLang(t.language);
  if (lang && t.title && t.title.toLowerCase() !== lang.toLowerCase()) {
    return `${lang} — ${t.title}`;
  }
  if (lang) return lang;
  if (t.title) return t.title;
  return `Track ${t.index + 1}`;
}

export function TracksModal({
  visible,
  onClose,
  audioTracks,
  selectedAudioTrackIdx,
  onSelectAudio,
  subtitleTracks,
  selectedSubtitleId,
  onSelectSubtitle,
}: Props): React.ReactElement {
  const [tab, setTab] = useState<'audio' | 'subtitles'>('audio');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, tab === 'audio' && styles.tabActive]}
              onPress={() => setTab('audio')}
            >
              <Text style={[styles.tabText, tab === 'audio' && styles.tabTextActive]}>
                Audio ({audioTracks.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === 'subtitles' && styles.tabActive]}
              onPress={() => setTab('subtitles')}
            >
              <Text style={[styles.tabText, tab === 'subtitles' && styles.tabTextActive]}>
                Subtitles ({subtitleTracks.length})
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {tab === 'audio' ? (
              audioTracks.length === 0 ? (
                <View style={styles.empty}>
                  <MaterialCommunityIcons name="volume-off" size={36} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>No audio tracks available</Text>
                </View>
              ) : (
                audioTracks.map((t) => {
                  const active = selectedAudioTrackIdx === t.index;
                  return (
                    <Pressable
                      key={t.index}
                      style={[styles.row, active && styles.rowActive]}
                      onPress={() => {
                        onSelectAudio(t.index);
                        onClose();
                      }}
                    >
                      <View style={styles.iconCol}>
                        <MaterialCommunityIcons
                          name={active ? 'radiobox-marked' : 'radiobox-blank'}
                          size={20}
                          color={active ? Colors.accent1 : Colors.textMuted}
                        />
                      </View>
                      <View style={styles.textCol}>
                        <Text style={[styles.title, active && styles.titleActive]}>
                          {audioLabel(t)}
                        </Text>
                        {t.language && (
                          <Text style={styles.subtitle}>{t.language}</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )
            ) : (
              <>
                {/* "Off" row first */}
                <Pressable
                  style={[styles.row, selectedSubtitleId === -1 && styles.rowActive]}
                  onPress={() => {
                    onSelectSubtitle(-1);
                    onClose();
                  }}
                >
                  <View style={styles.iconCol}>
                    <MaterialCommunityIcons
                      name={
                        selectedSubtitleId === -1
                          ? 'radiobox-marked'
                          : 'radiobox-blank'
                      }
                      size={20}
                      color={
                        selectedSubtitleId === -1
                          ? Colors.accent1
                          : Colors.textMuted
                      }
                    />
                  </View>
                  <View style={styles.textCol}>
                    <Text
                      style={[
                        styles.title,
                        selectedSubtitleId === -1 && styles.titleActive,
                      ]}
                    >
                      Off
                    </Text>
                  </View>
                </Pressable>

                {subtitleTracks.length === 0 ? (
                  <View style={styles.empty}>
                    <MaterialCommunityIcons
                      name="closed-caption-outline"
                      size={36}
                      color={Colors.textMuted}
                    />
                    <Text style={styles.emptyText}>
                      No subtitles found
                    </Text>
                  </View>
                ) : (
                  subtitleTracks.map((t) => {
                    const active = selectedSubtitleId === t.id;
                    const lang = prettyLang(t.language);
                    return (
                      <Pressable
                        key={t.id}
                        style={[styles.row, active && styles.rowActive]}
                        onPress={() => {
                          onSelectSubtitle(t.id);
                          onClose();
                        }}
                      >
                        <View style={styles.iconCol}>
                          <MaterialCommunityIcons
                            name={active ? 'radiobox-marked' : 'radiobox-blank'}
                            size={20}
                            color={active ? Colors.accent1 : Colors.textMuted}
                          />
                        </View>
                        <View style={styles.textCol}>
                          <Text style={[styles.title, active && styles.titleActive]}>
                            {lang ?? t.title}
                          </Text>
                          <Text style={styles.subtitle}>
                            {t.source === 'embedded' ? 'Embedded' : 'External'}
                            {t.title && lang && t.title.toLowerCase() !== lang.toLowerCase()
                              ? ` · ${t.title}`
                              : ''}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
