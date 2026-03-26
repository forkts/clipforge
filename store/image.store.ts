import { create } from "zustand";

type ImageUpdater = File | ((prev: File | null) => File | null);
type ImagesUpdater = File[] | ((prev: File[]) => File[]);

type ImageStore = {
  images: File[];
  setImages: (images: ImagesUpdater) => void;
  image: File | null;
  setImage: (image: ImageUpdater) => void;
};

export const useImageStore = create<ImageStore>()((set) => ({
  images: [],
  setImages: (updater) =>
    set((state) => ({
      images: typeof updater === "function" ? updater(state.images) : updater,
    })),
  image: null,
  setImage: (updater) =>
    set((state) => ({
      image: typeof updater === "function" ? updater(state.image) : updater,
    })),
}));
