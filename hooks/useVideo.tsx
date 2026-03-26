'use client';

import { FileType } from '@/lib/utils';
import { TimelineClip, useTimelineStore } from '@/store/timeline.store';
import { useCallback, useEffect, useRef } from 'react';

export interface UseVideoRefsProps {
  videoRefs?: React.MutableRefObject<Map<string, HTMLVideoElement>>;
  audioRefs?: React.MutableRefObject<Map<string, HTMLAudioElement>>;
}

const sync = (el: HTMLMediaElement | null | undefined, t: number) => {
  if (!el) return;
  if (Math.abs(el.currentTime - t) > 0.05) {
    el.currentTime = t;
  }
};

const getActiveClipAtTime = (clips: TimelineClip[], time: number, type?: FileType) => {
  return clips.find((c) => time >= c.startTime && time < c.startTime + c.duration && (!type || c.type === type));
};

export const useVideo = ({ videoRefs, audioRefs }: UseVideoRefsProps) => {
  const {
    clips,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    masterVolume: volume,
    setMasterVolume: setVolume,
    isMasterMuted: isMuted,
    setIsMasterMuted: setIsMuted,
  } = useTimelineStore();

  const lastSeekRef = useRef<number | null>(null);

  const projectDuration = clips.length ? Math.max(...clips.map((c) => c.startTime + c.duration)) : 0;

  const videoClip = getActiveClipAtTime(clips, currentTime, FileType.Video);

  // ---------------- PLAY / PAUSE ----------------
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, [setIsPlaying]);

  // ---------------- SEEK ----------------
  const handleSeek = (time: number) => {
    lastSeekRef.current = time;
    setCurrentTime(time);

    const activeClips = clips.filter((c) => time >= c.startTime && time < c.startTime + c.duration);

    activeClips.forEach((c) => {
      const local = time - c.startTime + (c.trimStart || 0);

      if (c.type === FileType.Video && videoRefs) {
        sync(videoRefs.current.get(c.id), local);
      }
      if (c.type === FileType.Audio && audioRefs) {
        sync(audioRefs.current.get(c.id), local);
      }
    });
  };

  // ---------------- TIME UPDATE (VIDEO DRIVES CLOCK) ----------------
  // Note: Only used if we have a primary video driving the clock
  const handleTimeUpdate = (clipId: string) => {
    const v = videoRefs?.current.get(clipId);
    const clip = clips.find((c) => c.id === clipId);
    if (!v || !clip) return;

    const local = v.currentTime;
    const global = clip.startTime + local - (clip.trimStart || 0);

    if (global >= projectDuration) {
      setIsPlaying(false);
      setCurrentTime(projectDuration);
      return;
    }

    if (Math.abs(global - currentTime) < 0.05) return;

    setCurrentTime(global);
  };

  // ---------------- SYNC ON GLOBAL TIME ----------------
  useEffect(() => {
    if (currentTime === lastSeekRef.current) return;

    const activeClips = clips.filter((c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration);

    activeClips.forEach((c) => {
      const local = currentTime - c.startTime + (c.trimStart || 0);

      if (c.type === FileType.Video && videoRefs) {
        sync(videoRefs.current.get(c.id), local);
      }
      if (c.type === FileType.Audio && audioRefs) {
        sync(audioRefs.current.get(c.id), local);
      }
    });
  }, [currentTime, clips, videoRefs, audioRefs]);

  // ---------------- MASTER PLAYBACK (sync all refs) ----------------
  useEffect(() => {
    if (!videoRefs || !audioRefs) return;

    if (isPlaying) {
      videoRefs.current.forEach((v) => {
        if (v.paused) v.play().catch(() => {});
      });
      audioRefs.current.forEach((a) => {
        if (a.paused) a.play().catch(() => {});
      });
    } else {
      videoRefs.current.forEach((v) => {
        if (!v.paused) v.pause();
      });
      audioRefs.current.forEach((a) => {
        if (!a.paused) a.pause();
      });
    }
  }, [isPlaying, videoRefs, audioRefs]);

  // ---------------- METADATA ----------------
  const handleLoadedVideoMetadata = () => {
    handleSeek(currentTime);
  };

  const handleAudioLoadedMetadata = () => {
    handleSeek(currentTime);
  };

  // ---------------- VOLUME ----------------
  const handleVolumeChange = (val: number) => {
    if (videoRefs) {
      videoRefs.current.forEach((v) => (v.volume = val));
    }
    if (audioRefs) {
      audioRefs.current.forEach((a) => (a.volume = val));
    }

    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const m = !isMuted;
    if (videoRefs) {
      videoRefs.current.forEach((v) => (v.muted = m));
    }
    if (audioRefs) {
      audioRefs.current.forEach((a) => (a.muted = m));
    }
    setIsMuted(m);
  };

  useEffect(() => {
    const vVol = isMuted ? 0 : volume;

    if (videoRefs) {
      videoRefs.current.forEach((v) => {
        v.volume = vVol;
        v.muted = isMuted;
      });
    }
    if (audioRefs) {
      audioRefs.current.forEach((a) => {
        a.volume = vVol;
        a.muted = isMuted;
      });
    }
  }, [volume, isMuted, videoRefs, audioRefs]);

  // ---------------- FALLBACK CLOCK (no video case) ----------------
  // If usePlaybackEngine is used, this may be redundant, but good as safety
  useEffect(() => {
    if (!isPlaying) return;
    if (videoRefs && videoRefs.current.size > 0) return;

    const interval = setInterval(() => {
      const next = currentTime + 0.05;

      if (next >= projectDuration) {
        setIsPlaying(false);
        setCurrentTime(projectDuration);
      } else {
        setCurrentTime(next);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, projectDuration, videoRefs, currentTime, setCurrentTime, setIsPlaying]);

  return {
    isPlaying,
    currentTime,
    duration: projectDuration,
    togglePlay,
    handleSeek,
    handleTimeUpdate,
    handleLoadedVideoMetadata,
    handleAudioLoadedMetadata,
    volume,
    isMuted,
    toggleMute,
    handleVolumeChange,
  };
};
