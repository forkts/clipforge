'use client';

import { getFrameAtTime } from '@/lib/generateFrameAtTime';
import { TimelineClip } from '@/store/timeline.store';
import { useEffect, useRef, useState } from 'react';

export function useTimelineFrames(clip: TimelineClip, zoom: number, visibleStart: number, visibleEnd: number) {
  const cacheRef = useRef<Map<number, string>>(new Map());
  const [frames, setFrames] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const density = Math.max(0.5, zoom / 80); // adaptive density
    const step = 1 / density;

    const load = async () => {
      for (let t = visibleStart; t <= visibleEnd; t += step) {
        const key = Number(t.toFixed(2));

        if (cacheRef.current.has(key)) continue;

        const frame = await getFrameAtTime(clip.file, key + (clip.trimStart || 0));

        if (cancelled) return;

        cacheRef.current.set(key, frame);
        setFrames(new Map(cacheRef.current));
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [clip.id, zoom, visibleStart, visibleEnd, clip.file, clip.trimStart]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      cacheRef.current.clear();
    };
  }, []);

  return frames;
}
