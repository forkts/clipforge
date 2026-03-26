import { useTimelineHooks } from '@/hooks/useTimelineHooks';
import { TimelineClip, useClipsStore, useTimelineStore } from '@/store/timeline.store';
import { Plus, Trash2, Volume2, VolumeX } from 'lucide-react';
import { memo, useState } from 'react';

interface Props {
  clip: TimelineClip;
  zoom: number;
  visibleStart: number;
  visibleEnd: number;
  timeToPx: (t: number) => number;
}

export const TimelineClipView = memo(({ clip, zoom, timeToPx }: Props) => {
  const width = timeToPx(clip.duration);
  const left = timeToPx(clip.startTime);

  const setSelectedClip = useTimelineStore((s) => s.setSelectedClip);
  const setSelectedClipDetails = useClipsStore((s) => s.setSelectedClipDetails);
  const selectedClipId = useTimelineStore((s) => s.selectedClip?.id);
  const isSelected = selectedClipId === clip.id;

  const { splitClip, removeClip, updateClip } = useTimelineHooks();
  const [hoverX, setHoverX] = useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClip(clip);
    setSelectedClipDetails(clip);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.altKey && hoverX !== null) {
      e.stopPropagation();
      const localTime = hoverX / zoom;
      const globalTime = clip.startTime + localTime;
      splitClip(clip.id, globalTime);
    } else {
      handleSelect(e);
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        if (!isSelected) {
          handleSelect(e);
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`
          absolute top-1/2 -translate-y-1/2 h-10 md:h-12 rounded-lg
          transition-all duration-150
          cursor-pointer group
          ${isSelected ? 'bg-blue-500/80 hover:bg-blue-500' : 'border-2 border-primary shadow-lg'}
        `}
      style={{
        left,
        width,
      }}
    >
      <div
        className={`
            absolute left-0 top-0 bottom-0 w-2
            cursor-ew-resize
            bg-black/30
            opacity-0 group-hover:opacity-100
            ${isSelected ? 'opacity-100 bg-yellow-500' : ''}
          `}
      />

      <div
        className={`
            absolute right-0 top-0 bottom-0 w-2
            cursor-ew-resize
            bg-black/30
            opacity-0 group-hover:opacity-100
            ${isSelected ? 'opacity-100 bg-yellow-500' : ''}
          `}
      />

      <div className="relative h-full w-full px-2 flex items-center justify-between overflow-hidden">
        <p className="text-xs font-medium truncate shrink min-w-0 mr-1 z-10">{clip.file.name}</p>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateClip(clip.id, { muted: !clip.muted });
            }}
            className="p-1 hover:bg-white/20 rounded-md transition-colors"
            title={clip.muted ? 'Unmute' : 'Mute'}
          >
            {clip.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeClip(clip.id);
            }}
            className="p-1 hover:bg-red-500/30 text-red-100/50 hover:text-red-200 rounded-md transition-colors"
            title="Delete Clip"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isSelected && <div className="absolute inset-0 pointer-events-none rounded-lg ring-2 ring-primary/40" />}

      {hoverX !== null && (
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-sky-400 z-20 pointer-events-none shadow-[0_0_8px_rgba(56,189,248,0.5)]"
          style={{ left: hoverX }}
        />
      )}

      {/* Transition Indicators */}
      <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center pointer-events-none z-[25]">
        {clip.transition && clip.transition !== 'none' ? (
          <div className="bg-yellow-500 text-black text-[9px] font-black px-1 rounded shadow-sm scale-90 translate-x-[-2px] border border-black/20">
            {clip.transition.substring(0, 4).toUpperCase()}
          </div>
        ) : (
          <div
            title="Add Transition"
            onClick={handleSelect}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/30 hover:bg-white/50 rounded-full p-0.5 pointer-events-auto cursor-pointer flex items-center justify-center border border-white/20 shadow-md transform hover:scale-110 active:scale-95"
          >
            <Plus size={10} className="text-white fill-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {clip.transition && clip.transition !== 'none' && (
        <div className="absolute bottom-1 left-0 right-0 h-[3px] mx-1 rounded-full bg-yellow-500/60 transition-opacity overflow-hidden">
          <div className="h-full bg-yellow-400 animate-pulse" style={{ width: '30%' }} />
        </div>
      )}
    </div>
  );
});

TimelineClipView.displayName = 'TimelineClipView';
