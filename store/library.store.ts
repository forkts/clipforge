import { FileType } from "@/lib/utils";
import { Metadata } from "@/lib/videoFrames";
import { create } from "zustand";

type LibraryUpdater =
  | LibraryContents[]
  | ((prev: LibraryContents[]) => LibraryContents[]);

export interface LibraryContents extends Metadata {
  id: string;
  file: File;
  type: FileType;
  url: string;
  totalFrames?: number;
}

type LibraryStore = {
  library: LibraryContents[];
  editedLibrary: LibraryContents[];
  setLibrary: (updater: LibraryUpdater) => void;
  setEditedLibrary: (updater: LibraryUpdater) => void;
  removeLibrary: (id: string) => void;
  removeEditedLibrary: (id: string) => void;
};

export const useLibraryStore = create<LibraryStore>()((set) => ({
  library: [],
  editedLibrary: [],
  setLibrary: (updater) =>
    set((state) => ({
      library: typeof updater === "function" ? updater(state.library) : updater,
    })),
  setEditedLibrary: (updater) =>
    set((state) => ({
      editedLibrary:
        typeof updater === "function" ? updater(state.editedLibrary) : updater,
    })),
  removeLibrary: (id: string) =>
    set((state) => ({
      library: state.library.filter((item) => item.id !== id),
    })),
  removeEditedLibrary: (id: string) =>
    set((state) => ({
      editedLibrary: state.editedLibrary.filter((item) => item.id !== id),
    })),
}));
