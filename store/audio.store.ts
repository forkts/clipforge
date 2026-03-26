import { create } from "zustand";

type AudioUpdater = File | ((prev: File | null) => File | null);
type AudiosUpdater = File[] | ((prev: File[]) => File[]);

type AudioStore = {
  audio: File | null;
  setAudio: (audio: AudioUpdater) => void;
  audios: File[];
  setAudios: (audios: AudiosUpdater) => void;
};

export const useAudioStore = create<AudioStore>()((set) => ({
  audio: null,
  setAudio: (audio) =>
    set((state) => ({
      audio: typeof audio === "function" ? audio(state.audio) : audio,
    })),
  audios: [],
  setAudios: (audios) =>
    set((state) => ({
      audios: typeof audios === "function" ? audios(state.audios) : audios,
    })),
}));
