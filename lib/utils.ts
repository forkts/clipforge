import { clsx, type ClassValue } from "clsx";
import {
  ArrowLeftRight,
  Film,
  History,
  Music,
  Sparkles,
  Type,
  Wand2,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum FileType {
  Audio = "AUDIO",
  Document = "DOCUMENT",
  Image = "IMAGE",
  Video = "VIDEO",
}

export const createTimeMapping = (zoom: number) => {
  return {
    timeToPixels: (t: number) => t * zoom,
    pixelsToTime: (px: number) => px / zoom,
  };
};

export enum TrackType {
  Video = "v1",
  Audio = "a1",
  Image = "i1",
  Document = "d1",
}

export const trackMap = {
  [FileType.Video]: TrackType.Video,
  [FileType.Audio]: TrackType.Audio,
  [FileType.Image]: TrackType.Image,
  [FileType.Document]: TrackType.Document,
};

export type AssetCategory = "transition" | "effect" | "text" | "animation";

export interface EditorAsset {
  id: string;
  name: string;
  category: AssetCategory;
  config?: Record<string, unknown>;
}

export const transitions: EditorAsset[] = [
  { id: "fade", name: "Fade", category: "transition" },
  { id: "slide", name: "Slide", category: "transition" },
  { id: "wipe", name: "Wipe", category: "transition" },
];

export const effects: EditorAsset[] = [
  { id: "grayscale", name: "Grayscale", category: "effect" },
  { id: "sepia", name: "Sepia", category: "effect" },
  { id: "blur", name: "Blur", category: "effect" },
];

export const textStyles: EditorAsset[] = [
  { id: "title", name: "Title", category: "text" },
  { id: "subtitle", name: "Subtitle", category: "text" },
  { id: "caption", name: "Caption", category: "text" },
];

export const animations: EditorAsset[] = [
  { id: "fade-in", name: "Fade In", category: "animation" },
  { id: "zoom-in", name: "Zoom In", category: "animation" },
  { id: "slide-up", name: "Slide Up", category: "animation" },
];

export const tabs = [
  { id: "media", icon: Film, label: "Media" },
  { id: "audio", icon: Music, label: "Audio" },
  { id: "edited", icon: History, label: "Edited" },
  { id: "text", icon: Type, label: "Text" },
  { id: "transitions", icon: ArrowLeftRight, label: "Transitions" },
  { id: "effects", icon: Sparkles, label: "Effects" },
  { id: "animations", icon: Wand2, label: "Animations" },
];

export interface AnimationsProps {
  name: string;
  icon: string;
  animation: string;
}
