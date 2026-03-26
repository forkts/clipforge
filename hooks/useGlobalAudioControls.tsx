'use client';

import { TimelineClip } from '@/store/timeline.store';
import { useTimelineHooks } from './useTimelineHooks';

export const useGlobalAudioControls = (
  videoRefs: React.MutableRefObject<Map<string, HTMLVideoElement>>,
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>,
) => {
  const { updateClip } = useTimelineHooks();
  const toggleMute = (clip: TimelineClip) => {
    const next = !clip.muted;

    updateClip(clip.id, { ...clip, muted: next });

    const v = videoRefs.current.get(clip.id);
    if (v) v.muted = next;

    const a = audioRefs.current.get(clip.id);
    if (a) a.muted = next;
  };

  return { toggleMute };
};
