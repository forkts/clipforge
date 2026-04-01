'use client';

import { PlayButton } from '@/components/PlayButton';
import { Button } from '@/components/ui/button';
import { usePlaybackEngine } from '@/hooks/usePlayBackEngine';
import { useVideoControls } from '@/hooks/useVideoControls';
import { getTransitionStyles, handleRequestFullScreen, secondsToTime } from '@/lib/helpers';
import { FileType } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline.store';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Maximize } from 'lucide-react';
import React, { useEffect } from 'react';

interface Props {
  videoRefs: React.MutableRefObject<Map<string, HTMLVideoElement>>;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
}

export const EditorPreview = ({ videoRefs, audioRefs }: Props) => {
  const { clips, currentTime } = useTimelineStore();

  const { seek, stepBackward, stepForward, jumpBackward, jumpForward } = usePlaybackEngine({ videoRefs, audioRefs });
  const { isPlaying, togglePlay } = useVideoControls({ videoRefs, audioRefs });

  const videoDuration = clips.length
    ? Math.max(...clips.filter((c) => c.type === FileType.Video).map((c) => c.startTime + c.duration))
    : 0;

  const activeVideoClip = clips.find(
    (c) =>
      currentTime >= c.startTime &&
      currentTime < c.startTime + c.duration &&
      (c.type === FileType.Video || c.type === FileType.Image),
  );

  const setVideoRef = (id: string) => (el: HTMLVideoElement | null) => {
    if (el) videoRefs.current.set(id, el);
    else videoRefs.current.delete(id);
  };

  const setAudioRef = (id: string) => (el: HTMLAudioElement | null) => {
    if (el) audioRefs.current.set(id, el);
    else videoRefs.current.delete(id);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (true) {
        case e.code === 'ArrowRight' && !e.shiftKey:
          stepForward();
          break;
        case e.code === 'ArrowLeft' && !e.shiftKey:
          stepBackward();
          break;
        case e.code === 'ArrowRight' && e.shiftKey:
          jumpForward(10);
          break;
        case e.code === 'ArrowLeft' && e.shiftKey:
          jumpBackward(10);
          break;
      }
    };

    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, [currentTime, stepBackward, stepForward, jumpBackward, jumpForward]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center h-full w-full
      bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]
      bg-size-[24px_24px] relative"
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {activeVideoClip ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute top-0 right-0 z-20">
              <Button variant={'outline'} size={'icon'} onClick={() => handleRequestFullScreen('preview')}>
                <Maximize />
              </Button>
            </div>
            {clips.map((clip) => {
              const isActive = currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration;
              const isVisual = clip.type === FileType.Video || clip.type === FileType.Image;

              if (!isActive || !isVisual) return null;

              return (
                <video
                  key={clip.id}
                  ref={setVideoRef(clip.id)}
                  src={clip.url}
                  className="max-h-full max-w-full rounded-xl shadow-2xl absolute"
                  style={getTransitionStyles(clip, currentTime)}
                  muted={clip.muted}
                  preload="auto"
                  playsInline
                  onClick={togglePlay}
                  id="preview"
                />
              );
            })}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-black/20 rounded-xl border-2 border-dashed border-muted-foreground/20">
            No media at this position
          </div>
        )}

        {/* Hidden Audio Channel Loop */}
        {clips.map((clip) => {
          if (clip.type !== FileType.Audio) return null;
          return <audio key={clip.id} ref={setAudioRef(clip.id)} src={clip.url} />;
        })}
      </div>

      <div className="w-full px-4 opacity-0 hover:opacity-100 bg-linear-to-t from-black/80 to-transparent backdrop-blur-md absolute bottom-0 left-0">
        <input
          type="range"
          min={0}
          max={videoDuration}
          step={0.01}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />

        <div className="flex items-center justify-between mt-2 text-white text-sm">
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={stepBackward}>
              <ChevronLeft />
            </Button>
            <Button size="sm" onClick={() => jumpBackward(5)}>
              <ChevronsLeft />
            </Button>
            <PlayButton isPlaying={isPlaying} onPlayPause={togglePlay} />

            <Button size="sm" onClick={() => jumpForward(5)}>
              <ChevronsRight />
            </Button>
            <Button size="sm" onClick={stepForward}>
              <ChevronRight />
            </Button>
          </div>
          <span>
            {secondsToTime(currentTime)} / {secondsToTime(videoDuration)}
          </span>
        </div>
      </div>
    </div>
  );
};
