/* eslint-disable @next/next/no-img-element */
import { PlayButton } from '@/components/PlayButton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTimelineHooks } from '@/hooks/useTimelineHooks';
import { formatDuration } from '@/lib/helpers';
import { FileType } from '@/lib/utils';
import { LibraryContents } from '@/store/library.store';
import { useClipsStore, useTimelineStore } from '@/store/timeline.store';
import { GalleryHorizontal, Loader2, Plus, Trash } from 'lucide-react';
import { useRef, useState } from 'react';

interface Props {
  item: LibraryContents;
  index: number;
  onViewCarousel?: (index: number) => void;
}

export const HistoryLibrary: React.FC<Props> = ({ item, index, onViewCarousel }) => {
  const { removeLoading, trackLoading, handleAddToTrack, handleRemoveFromLibrary } = useTimelineHooks();
  const setSelectedClip = useTimelineStore((s) => s.setSelectedClip);
  const setSelectedClipDetails = useClipsStore((s) => s.setSelectedClipDetails);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  return (
    <div
      className="aspect-video bg-muted rounded-lg overflow-hidden group relative cursor-pointer border hover:border-foreground/50"
      onClick={() => {
        setSelectedClipDetails(Object.assign(item));
        setSelectedClip(Object.assign(item));
      }}
    >
      <Button
        size="icon"
        onClick={() => handleAddToTrack(item)}
        className="absolute bottom-1 right-1 w-6 h-6 z-20 bg-black/60 opacity-0 group-hover:opacity-100"
      >
        {trackLoading ? (
          <Loader2 size={12} className="text-white animate-spin" />
        ) : (
          <Plus size={12} className="text-white" />
        )}
      </Button>

      <Button
        size="icon"
        className="absolute top-1 right-1 w-6 h-6 z-20 bg-black/60 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          handleRemoveFromLibrary(e, item);
        }}
      >
        {removeLoading ? (
          <Loader2 size={12} className="text-white animate-spin" />
        ) : (
          <Trash size={12} className="text-white" />
        )}
      </Button>

      <Button
        size="icon"
        className="absolute top-1 right-8 w-6 h-6 z-20 bg-black/60 opacity-0 group-hover:opacity-100"
        title="View in Carousel"
        onClick={(e) => {
          e.stopPropagation();
          onViewCarousel?.(index);
        }}
      >
        <GalleryHorizontal size={12} className="text-white" />
      </Button>

      {item.type === FileType.Video && (
        <>
          <video src={item.url} muted className="w-full h-full object-cover" />
          {item.duration && <Duration d={item.duration} />}
        </>
      )}

      {item.type === FileType.Image && (
        <img src={item.url} alt={item.file.name} className="w-full h-full object-cover" />
      )}

      {item.type === FileType.Audio && (
        <div className="flex items-center justify-center h-full bg-emerald-500/10 relative">
          <PlayButton
            isPlaying={isPlaying}
            onPlayPause={() => {
              if (!audioRef.current) return;
              if (audioRef.current.paused) {
                audioRef.current.play();
              } else {
                audioRef.current.pause();
              }
              setIsPlaying(!isPlaying);
            }}
          />
          <audio ref={audioRef} src={item.url} />
          {item.duration && <Duration d={item.duration} />}
        </div>
      )}

      <div className="absolute top-1 left-1 text-[10px] bg-background/80 px-1 rounded">
        <div className="flex items-center gap-2">
          <div>{index + 1}</div>
          <Separator orientation="vertical" className="h-4" />
          <div className="truncate p-0 m-0">{item.file.name}</div>
        </div>
      </div>
    </div>
  );
};

const Duration = ({ d }: { d: number }) => (
  <div className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">{formatDuration(d)}</div>
);
