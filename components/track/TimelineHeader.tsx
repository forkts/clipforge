import { Button } from '@/components/ui/button';
import { useGlobalAudioControls } from '@/hooks/useGlobalAudioControls';
import { useTimelineHooks } from '@/hooks/useTimelineHooks';
import { FileType } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline.store';
import { AudioWaveform, Menu, Shredder, Trash, Volume2, VolumeX, X } from 'lucide-react';
import { Input } from '../ui/input';

interface Props {
  zoom: number;
  setZoom: (zoom: number) => void;
  videoRefs: React.MutableRefObject<Map<string, HTMLVideoElement>>;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  openTrackSideBar: boolean;
  setOpenTrackSideBar: (openTrackSideBar: boolean) => void;
  showTimeline: boolean;
  onToggleTimeline: () => void;
}

export const TimelineHeader = ({
  zoom,
  setZoom,
  videoRefs,
  audioRefs,
  openTrackSideBar,
  showTimeline,
  onToggleTimeline,
  setOpenTrackSideBar,
}: Props) => {
  const { toggleMute } = useGlobalAudioControls(videoRefs, audioRefs);

  const { clips, selectedClip, clearTimeline, setSelectedClip } = useTimelineStore();

  const { removeClip } = useTimelineHooks();

  const hasVideoClips = clips.some((c) => c.type === FileType.Video);

  const hasSelectedTimelineClip = !!selectedClip && clips.some((c) => c.id === selectedClip.id);

  const handleDeleteSelectedClip = () => {
    if (selectedClip) {
      removeClip(selectedClip.id);
      setSelectedClip(null);
    }
  };

  return (
    <div className="px-3 py-2 border-b border-neutral-700 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-xs" onClick={() => setOpenTrackSideBar(!openTrackSideBar)}>
          <Menu size={16} />
        </Button>
        <Input
          type="range"
          className="w-20"
          min={20}
          max={300}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </div>

      <div className="flex items-center gap-2">
        {hasVideoClips && selectedClip && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => toggleMute(selectedClip)}
            className="text-muted-foreground hover:text-white"
          >
            {selectedClip.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        )}

        {hasSelectedTimelineClip && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDeleteSelectedClip}
            className="text-red-400 hover:text-red-300"
          >
            <Trash className="w-4 h-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={clearTimeline}
          disabled={!clips.length}
          className="text-red-400 border border-white"
        >
          <Shredder className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleTimeline} className="text-muted-foreground">
          {showTimeline ? <X size={20} /> : <AudioWaveform size={20} />}
        </Button>
      </div>
    </div>
  );
};
