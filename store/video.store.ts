import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type VideoUpdater = File | ((prev: File | null) => File | null);
type VideosUpdater = File[] | ((prev: File[]) => File[]);
type VideoMetadataUpdater = VideoMetadata | ((prev: VideoMetadata | null) => VideoMetadata | null);

type VideoStore = {
  video: File | null;
  setVideo: (video: VideoUpdater) => void;
  videos: File[];
  setVideos: (videos: VideosUpdater) => void;
};

export const useVideoStore = create<VideoStore>()(
  persist(
    (set) => ({
      video: null,
      setVideo: (updater) =>
        set((state) => ({
          video: typeof updater === 'function' ? updater(state.video) : updater,
        })),
      videos: [],
      setVideos: (updater) =>
        set((state) => ({
          videos: typeof updater === 'function' ? updater(state.videos) : updater,
        })),
    }),
    {
      name: 'clipforge-video-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

interface VideoMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  frameRate: number;
}

type VideoMetadataStore = {
  videoMetadata: VideoMetadata | null;
  setVideoMetadata: (updater: VideoMetadataUpdater) => void;
};

export const useVideoMetadataStore = create<VideoMetadataStore>()((set) => ({
  videoMetadata: null,
  setVideoMetadata: (updater: VideoMetadataUpdater) =>
    set((state) => ({
      videoMetadata: typeof updater === 'function' ? updater(state.videoMetadata) : updater,
    })),
}));
