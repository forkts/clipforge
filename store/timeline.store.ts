import { TrackType } from '@/lib/utils';
import { create } from 'zustand';
import { LibraryContents } from './library.store';

type PlayUpdater = boolean | ((prev: boolean) => boolean);

function cleanupClipResources(clip?: TimelineClip) {
  try {
    clip?.revokeFrames?.();
  } catch {}
}

let processing: Promise<unknown> = Promise.resolve();

export function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = processing.then(task, task);

  // keep chain alive but ignore result type
  processing = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}

export interface TimelineClip extends LibraryContents {
  track: TrackType;
  startTime: number;
  duration: number;
  trimStart: number;

  scale?: number;
  position?: { x: number; y: number };
  opacity?: number;
  volume?: number;
  muted?: boolean;
  animation?: 'fade' | 'slide' | 'zoom' | 'spin' | 'none';
  transition?:
    | 'fade'
    | 'crossfade'
    | 'wipeleft'
    | 'wiperight'
    | 'wipeup'
    | 'wipedown'
    | 'slideleft'
    | 'slideright'
    | 'slideup'
    | 'slidedown'
    | 'circlecrop'
    | 'rectcrop'
    | 'distance'
    | 'fadeblack'
    | 'fadewhite'
    | 'radial'
    | 'none';
  transitionDuration?: number;

  frames?: string[];
  revokeFrames?: () => void; // important
  waveform?: number[];

  actualFps?: number;
  totalFrames?: number;
}

interface TimelineStore {
  clips: TimelineClip[];
  addClip: (
    clip: Omit<TimelineClip, 'id' | 'startTime'> & {
      id?: string;
      startTime?: number;
    },
  ) => void;
  updateClip: (id: string, updates: Partial<TimelineClip>) => void;
  removeClip: (id: string) => void;
  reorderClips: (track: string, startIndex: number, endIndex: number) => void;
  splitClip: (id: string, playheadGlobalTime: number) => void;
  selectedClip: TimelineClip | null;
  setSelectedClip: (id: TimelineClip | null) => void;

  clearTimeline: () => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (updater: PlayUpdater) => void;
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  isMasterMuted: boolean;
  setIsMasterMuted: (muted: boolean) => void;
  setStitchedVideo: (clip: TimelineClip) => void;
  setStitchedAudio: (clip: TimelineClip) => void;
  muteVideos: (clip: TimelineClip) => void;
  addAudioToStitchedVideo: (clip: TimelineClip) => void;
}

interface ClipsStore {
  generatingTrack: boolean;
  stitchingVideos: boolean;
  setStitchingVideos: (stitching: boolean) => void;
  insertingAudio: boolean;
  setInsertingAudio: (insertingAudio: boolean) => void;
  stitchingAudios: boolean;
  setStitchingAudios: (stitchingAudios: boolean) => void;
  addingAudioToVideo: boolean;
  setAddingAudioToVideo: (addingAudioToVideo: boolean) => void;
  setGeneratingTrack: (generatingTrack: boolean) => void;
  selectedClipDetails: TimelineClip | null;
  setSelectedClipDetails: (id: TimelineClip | null) => void;
  mutingVideos: boolean;
  setMutingVideos: (mutingVideos: boolean) => void;
  isProcessing: () => boolean;
}

export const useClipsStore = create<ClipsStore>((set, get) => ({
  selectedClipDetails: null,
  isProcessing: () => {
    const s = get();
    return s.stitchingVideos || s.stitchingAudios || s.addingAudioToVideo || s.mutingVideos || s.generatingTrack;
  },
  stitchingVideos: false,
  setStitchingVideos: (stitching: boolean) => set({ stitchingVideos: stitching }),
  insertingAudio: false,
  setInsertingAudio: (insertingAudio: boolean) => set({ insertingAudio: insertingAudio }),
  stitchingAudios: false,
  setStitchingAudios: (stitchingAudios: boolean) => set({ stitchingAudios: stitchingAudios }),
  addingAudioToVideo: false,
  setAddingAudioToVideo: (addingAudioToVideo: boolean) => set({ addingAudioToVideo: addingAudioToVideo }),
  generatingTrack: false,
  mutingVideos: false,
  setMutingVideos: (mutingVideos: boolean) => set({ mutingVideos: mutingVideos }),
  setGeneratingTrack: (generating: boolean) => set({ generatingTrack: generating }),
  setSelectedClipDetails: (id: TimelineClip | null) => set({ selectedClipDetails: id }),
}));

export const useTimelineStore = create<TimelineStore>((set) => ({
  clips: [],
  currentTime: 0,
  isPlaying: false,
  setIsPlaying: (updater) =>
    set((state) => ({
      isPlaying: typeof updater === 'function' ? updater(state.isPlaying) : updater,
    })),
  selectedClip: null,
  setSelectedClip: (id) => set({ selectedClip: id }),
  setCurrentTime: (time) => set({ currentTime: time }),
  masterVolume: 1,
  setMasterVolume: (volume) => set({ masterVolume: volume }),
  isMasterMuted: false,
  setIsMasterMuted: (muted) => set({ isMasterMuted: muted }),
  // Logic moved to useTimelineHooks
  addClip: () => {},
  updateClip: () => {},
  removeClip: () => {},
  reorderClips: () => {},
  splitClip: () => {},
  clearTimeline: () =>
    set((state) => {
      state.clips.forEach(cleanupClipResources);
      return {
        clips: [],
        selectedClip: null,
        currentTime: 0,
        isPlaying: false,
      };
    }),

  setStitchedVideo: (clip: TimelineClip) => set({ clips: [clip] }),
  setStitchedAudio: (clip: TimelineClip) => set({ clips: [clip] }),
  muteVideos: (clip: TimelineClip) => set({ clips: [clip] }),
  addAudioToStitchedVideo: (clip: TimelineClip) => set({ clips: [clip] }),
}));
