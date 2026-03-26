import { LibraryContents } from '@/store/library.store';
import { TimelineClip } from '@/store/timeline.store';
import { getFullVideoMetadata } from './generateVideoMetadata';
import { FileType } from './utils';
import { Metadata } from './videoFrames';

export const formatDuration = (timeInSeconds: number) => {
  if (!timeInSeconds || isNaN(timeInSeconds)) return '00:00';

  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const BASE_PIXELS_PER_SECOND = 100;

export const leftTrimHandler = (
  e: React.PointerEvent<HTMLDivElement>,
  clip: TimelineClip,
  pixelsPerSecond: number,
  onUpdate: (id: string, updates: Partial<TimelineClip>) => void,
) => {
  e.stopPropagation();

  const startX = e.clientX;
  const startStartTime = clip.startTime;
  const startDuration = clip.duration;
  const startTrim = clip.trimStart || 0;

  const handlePointerMove = (moveEvent: PointerEvent) => {
    const dx = (moveEvent.clientX - startX) / (pixelsPerSecond || BASE_PIXELS_PER_SECOND);

    const newStartTime = Math.max(0, startStartTime + dx);

    const delta = newStartTime - startStartTime;

    const newDuration = Math.max(0.1, startDuration - delta);

    const newTrim = Math.max(0, startTrim + delta);

    onUpdate(clip.id, {
      startTime: newStartTime,
      duration: newDuration,
      trimStart: newTrim,
    });
  };

  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
};

export const rightTrimHandler = (
  e: React.PointerEvent<HTMLDivElement>,
  clip: TimelineClip,
  pixelsPerSecond: number,
  onUpdate: (id: string, updates: Partial<TimelineClip>) => void,
) => {
  e.stopPropagation();

  const startX = e.clientX;
  const startDuration = clip.duration;

  const handlePointerMove = (moveEvent: PointerEvent) => {
    const dx = (moveEvent.clientX - startX) / (pixelsPerSecond || BASE_PIXELS_PER_SECOND);

    const newDuration = Math.max(0.1, startDuration + dx);

    onUpdate(clip.id, {
      duration: newDuration,
    });
  };

  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
};

export const handleGenerateContentInfo = async (uploads: File[]): Promise<LibraryContents[]> => {
  return await Promise.all(
    uploads.map(async (file) => {
      let type = FileType.Video;
      if (file.type.startsWith('image/')) type = FileType.Image;
      if (file.type.startsWith('audio/')) type = FileType.Audio;

      const url = URL.createObjectURL(file);

      let metadata: Metadata = {};
      if (type === FileType.Video) {
        metadata = (await getFullVideoMetadata(file)) as Metadata;
      }

      let duration: number | undefined;

      if (type === FileType.Video || type === FileType.Audio) {
        duration = await new Promise<number>((resolve) => {
          const media = document.createElement(type === FileType.Video ? 'video' : 'audio');
          media.src = url;
          media.onloadedmetadata = () => resolve(media.duration || 0);
        });
        metadata.duration = duration;
      }

      return {
        id: crypto.randomUUID(),
        file,
        type,
        url,
        ...metadata,
      } as LibraryContents;
    }),
  );
};

export const getAspectLabel = (ratio?: number) => {
  if (!ratio) return '-';
  if (Math.abs(ratio - 16 / 9) < 0.01) return '16:9';
  if (Math.abs(ratio - 4 / 3) < 0.01) return '4:3';
  if (Math.abs(ratio - 1) < 0.01) return '1:1';
  return ratio.toFixed(2);
};

export const format = (value?: number, unit = '') => {
  if (!value && value !== 0) return '-';
  return `${Number(value).toFixed(2)} ${unit}`;
};

export const formatBytes = (bytes?: number) => {
  if (!bytes) return '-';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const secondsToTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const timeToSeconds = (time: string): number => {
  const [m, s] = time.split(':').map(Number);
  return m * 60 + s;
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
};

export const getTransitionStyles = (clip: TimelineClip, globalTime: number): React.CSSProperties => {
  if (!clip.transition || clip.transition === 'none') return {};

  const progress = (globalTime - clip.startTime) / (clip.transitionDuration || 1);
  if (progress < 0 || progress > 1) return {};

  const pPercent = Math.min(Math.max(progress * 100, 0), 100);

  switch (clip.transition) {
    case 'fade':
    case 'crossfade':
    case 'fadeblack':
    case 'fadewhite':
      return { opacity: progress };
    case 'wipeleft':
      return { clipPath: `inset(0 ${100 - pPercent}% 0 0)` };
    case 'wiperight':
      return { clipPath: `inset(0 0 0 ${100 - pPercent}%)` };
    case 'wipeup':
      return { clipPath: `inset(0 0 ${100 - pPercent}% 0)` };
    case 'wipedown':
      return { clipPath: `inset(${100 - pPercent}% 0 0 0)` };
    case 'slideleft':
      return { transform: `translateX(${100 - pPercent}%)` };
    case 'slideright':
      return { transform: `translateX(-${100 - pPercent}%)` };
    case 'slideup':
      return { transform: `translateY(${100 - pPercent}%)` };
    case 'slidedown':
      return { transform: `translateY(-${100 - pPercent}%)` };
    case 'circlecrop':
      return { clipPath: `circle(${pPercent}% at 50% 50%)` };
    default:
      return {};
  }
};

export const handleRequestFullScreen = (id: string) => {
  const element = document.getElementById(id);
  element?.requestFullscreen();
};
