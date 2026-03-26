'use client';

import { TimelineHeader } from '@/components/track/TimelineHeader';
import { TimelineTrackSidebar } from '@/components/track/TrackSidebar';
import { usePlaybackEngine } from '@/hooks/usePlayBackEngine';
import { useVisibleRange } from '@/hooks/useVisibleRange';
import { useIsMobile } from '@/hooks/useIsMobile';
import { createTimeMapping } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline.store';
import { useEffect, useRef, useState } from 'react';
import { TimelineRuler } from '../../../components/track/TimelineRuler';
import { TimelineTrack } from '../../../components/track/TimelineTrack';

interface Props {
  videoRefs: React.MutableRefObject<Map<string, HTMLVideoElement>>;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  showTimeline: boolean;
  onToggleTimeline: () => void;
}

export const SIDEBAR_WIDTH = 192;

export function EditorTimeline({ videoRefs, audioRefs, showTimeline, onToggleTimeline }: Props) {
  const [zoom, setZoom] = useState<number>(20);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [openTrackSideBar, setOpenTrackSideBar] = useState<boolean>(true);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const clips = useTimelineStore((s) => s.clips);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const currentSidebarWidth = isMobile ? 128 : 192;
  
  const { seek } = usePlaybackEngine({ videoRefs, audioRefs });
  const { timeToPixels, pixelsToTime } = createTimeMapping(zoom);
  const visible = useVisibleRange(scrollLeft, containerWidth, pixelsToTime);

  const duration = clips.length ? Math.max(...clips.map((c) => c.startTime + c.duration)) : 10;

  // Resize Observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setContainerWidth(el.clientWidth);
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);

    update(); // initial

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <TimelineHeader
        zoom={zoom}
        setZoom={setZoom}
        videoRefs={videoRefs}
        audioRefs={audioRefs}
        openTrackSideBar={openTrackSideBar}
        setOpenTrackSideBar={setOpenTrackSideBar}
        showTimeline={showTimeline}
        onToggleTimeline={onToggleTimeline}
      />

      {/* Scroll container */}
      <div
        ref={containerRef}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        className="flex-1 overflow-x-auto overflow-y-auto relative"
      >
        <div
          className="flex flex-row relative min-h-full bg-background
          bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),
          linear-gradient(to_bottom,#80808012_1px,transparent_1px)]
          bg-[size:24px_24px]"
          style={{
            minWidth: '100%',
            width: timeToPixels(duration) + currentSidebarWidth,
          }}
        >
          {/* Sidebar */}
          {openTrackSideBar && (
            <div 
              style={{ width: currentSidebarWidth }}
              className="sticky left-0 shrink-0 border-r border-border bg-background z-[60] flex flex-col pt-6"
            >
              <TimelineTrackSidebar />
            </div>
          )}

          {/* Tracks */}
          <div className="flex-1 relative flex flex-col mx-1">
            {/* Ruler */}
            <div className="sticky top-0 z-[70] bg-background">
              <TimelineRuler duration={duration} timeToPx={timeToPixels} pxToTime={pixelsToTime} onSeek={seek} />

              {/* PlayHead handle */}
              <div
                className="absolute top-0 h-full w-0 z-[80] pointer-events-none"
                style={{
                  transform: `translateX(${timeToPixels(currentTime)}px)`,
                }}
              >
                <div className="absolute top-0 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-red-500 shadow-sm" />
              </div>
            </div>

            {/* Track body */}
            <div className="relative flex-1">
              {/* Vertical grid */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
                  <div key={i} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: timeToPixels(i) }} />
                ))}
              </div>

              <TimelineTrack
                clips={clips}
                zoom={zoom}
                visibleStart={visible.start}
                visibleEnd={visible.end}
                timeToPx={timeToPixels}
              />

              {/* PlayHead line */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 pointer-events-none"
                style={{
                  transform: `translateX(${timeToPixels(currentTime)}px)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
