import { TimelineClip, useTimelineStore } from '@/store/timeline.store';
import { UseVideoRefsProps } from './useVideo';

export const useVideoControls = ({ videoRefs, audioRefs }: UseVideoRefsProps) => {
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const setIsPlaying = useTimelineStore((s) => s.setIsPlaying);
  const volume = useTimelineStore((s) => s.masterVolume);
  const setVolume = useTimelineStore((s) => s.setMasterVolume);
  const isMuted = useTimelineStore((s) => s.isMasterMuted);
  const setIsMuted = useTimelineStore((s) => s.setIsMasterMuted);
  const updateClip = useTimelineStore((s) => s.updateClip);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleVolumeChange = (val: number) => {
    videoRefs?.current.forEach((v) => (v.volume = val));
    audioRefs?.current.forEach((a) => (a.volume = val));

    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = (clip: TimelineClip) => {
    const next = !isMuted;

    updateClip(clip.id, { ...clip, muted: next });

    videoRefs?.current.forEach((v) => (v.muted = next));
    audioRefs?.current.forEach((a) => (a.muted = next));

    setIsMuted(next);
  };

  return {
    isPlaying,
    togglePlay,
    volume,
    isMuted,
    toggleMute,
    handleVolumeChange,
  };
};
