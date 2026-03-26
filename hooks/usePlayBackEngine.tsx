'use client';

import { FileType } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline.store';
import { useCallback, useEffect, useRef } from 'react';

interface Props {
  videoRefs: React.MutableRefObject<Map<string, HTMLVideoElement>>;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
}

export const usePlaybackEngine = ({ videoRefs, audioRefs }: Props) => {
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);
  const setIsPlaying = useTimelineStore((s) => s.setIsPlaying);
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const clips = useTimelineStore((s) => s.clips);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const frameTime = 1 / (useTimelineStore((s) => s.selectedClip?.video?.fps) || 30);

  const rafRef = useRef<number | null>(null);

  // 1. SIMPLE SEEK - Immediately syncs media to the specific time
  const seek = useCallback(
    (time: number) => {
      setCurrentTime(time);
      clips.forEach((clip) => {
        const v = videoRefs.current.get(clip.id);
        const a = audioRefs.current.get(clip.id);
        const local = time - clip.startTime + (clip.trimStart || 0);

        if (v) v.currentTime = local;
        if (a) a.currentTime = local;
      });
    },
    [clips, setCurrentTime, videoRefs, audioRefs],
  );

  const stepForward = () => {
    seek(currentTime + frameTime);
  };

  const stepBackward = () => {
    seek(currentTime - frameTime);
  };

  const jumpBackward = (seconds = 1) => {
    seek(currentTime - seconds);
  };

  const jumpForward = (seconds = 1) => {
    seek(currentTime + seconds);
  };

  // 2. PLAYBACK LOOP - Advances the global clock and handles play/pause
  useEffect(() => {
    if (!isPlaying) {
      // Pause all media immediately when playback stops
      videoRefs.current.forEach((v) => v.pause());
      audioRefs.current.forEach((a) => a.pause());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    // Capture start times to avoid stale closures
    let lastTimestamp = Date.now();

    const tick = () => {
      const now = Date.now();
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      // Get fresh time from the store (using getState to avoid render loop lag)
      const currentProjectTime = useTimelineStore.getState().currentTime;
      const nextTime = currentProjectTime + delta;

      // Calculate total duration to detect the end
      const projectDuration = clips.length
        ? Math.max(...clips.filter((c) => c.type === FileType.Video).map((c) => c.startTime + c.duration))
        : 0;

      // Reset to start if we reached the end
      if (nextTime >= projectDuration) {
        setIsPlaying(false);
        setCurrentTime(0);
        // Sync media to 0
        clips.forEach((clip) => {
          const v = videoRefs.current.get(clip.id);
          const a = audioRefs.current.get(clip.id);
          if (v) v.currentTime = clip.trimStart || 0;
          if (a) a.currentTime = clip.trimStart || 0;
          if (v) v.pause();
          if (a) a.pause();
        });
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return;
      }

      // Only handle play/pause and track entry/exit logic
      clips.forEach((clip) => {
        const isActive = nextTime >= clip.startTime && nextTime < clip.startTime + clip.duration;
        const v = videoRefs.current.get(clip.id);
        const a = audioRefs.current.get(clip.id);

        if (isActive) {
          // If we just entered a clip or it's mounted, start it
          if (v && v.paused) {
            v.play().catch(() => {});
            // Initial sync on entry
            const local = nextTime - clip.startTime + (clip.trimStart || 0);
            v.currentTime = local;
          }
          if (a && a.paused) {
            a.play().catch(() => {});
            const local = nextTime - clip.startTime + (clip.trimStart || 0);
            a.currentTime = local;
          }
        } else {
          // Pause if we exited its range
          if (v && !v.paused) v.pause();
          if (a && !a.paused) a.pause();
        }
      });

      setCurrentTime(nextTime);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clips, setIsPlaying, setCurrentTime, videoRefs, audioRefs, isPlaying]);

  // 3. METADATA LOADING
  const loadVideoMetadata = (clipId: string) => {
    const v = videoRefs.current.get(clipId);
    const clip = clips.find((c) => c.id === clipId);
    if (v && clip) {
      v.currentTime = currentTime - clip.startTime + (clip.trimStart || 0);
    }
  };

  return { seek, loadVideoMetadata, stepBackward, stepForward, jumpBackward, jumpForward };
};
