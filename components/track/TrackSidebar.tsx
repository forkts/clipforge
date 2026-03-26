import { useTimelineHooks } from '@/hooks/useTimelineHooks';
import { cn } from '@/lib/utils';
import { useClipsStore } from '@/store/timeline.store';
import { Combine, Gauge, ImageIcon, Loader2, Music, Video, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

const StitchTimer = ({ hasStarted }: { hasStarted: boolean }) => {
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    if (!hasStarted) return;
    const startTime = Date.now();

    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted]);

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary animate-in fade-in slide-in-from-left-2 duration-300 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
      <Gauge size={10} className="animate-pulse" />
      <span>
        {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
      </span>
    </div>
  );
};

export const TimelineTrackSidebar = () => {
  const { handleAddAudioToVideo, handleStitchAudios, handleStitchVideos, handleMuteVideos, videoClips, audioClips } =
    useTimelineHooks();

  const { stitchingVideos, stitchingAudios, addingAudioToVideo, mutingVideos, isProcessing } = useClipsStore();

  return (
    <div className="flex flex-col h-full bg-background select-none relative overflow-hidden">
      {/* Processing Animation for Sidebar */}
      {isProcessing() && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
        </div>
      )}

      {/* Audio Track Sidebar */}
      <div
        className={cn(
          'h-[64px] md:h-[74px] px-2 md:px-4 flex flex-col justify-center border-b border-neutral-700/50 relative transition-colors duration-300',
          (stitchingAudios || addingAudioToVideo) && 'bg-primary/5',
        )}
      >
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Music size={12} className={cn('md:w-3.5 md:h-3.5', stitchingAudios && 'text-primary animate-bounce')} /> Audio
          </div>
          {stitchingAudios && <Loader2 size={10} className="animate-spin text-primary" />}
        </div>
        <div className="flex gap-1 md:gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 md:h-7 px-1.5 md:px-2 text-[9px] md:text-[10px] w-fit"
            disabled={!videoClips.length || !audioClips.length || isProcessing()}
            onClick={handleAddAudioToVideo}
            loading={addingAudioToVideo}
          >
            Insert Audio
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 h-6 md:w-7 md:h-7"
            onClick={handleStitchAudios}
            title="Stitch All Audios"
            disabled={!audioClips.length || isProcessing()}
            loading={stitchingAudios}
          >
            <Combine size={12} className="md:w-3.5 md:h-3.5" />
          </Button>
        </div>
      </div>

      {/* Video Track Sidebar */}
      <div
        className={cn(
          'h-[64px] md:h-[74px] px-2 md:px-4 flex flex-col justify-center border-b border-neutral-700/50 relative transition-colors duration-300',
          (stitchingVideos || mutingVideos) && 'bg-primary/5',
        )}
      >
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Video size={12} className={cn('md:w-3.5 md:h-3.5', stitchingVideos && 'text-primary animate-bounce')} /> Video
          </div>
          {stitchingVideos && <StitchTimer hasStarted={stitchingVideos} />}
          {mutingVideos && <Loader2 size={10} className="animate-spin text-primary" />}
        </div>
        <div className="flex gap-1 md:gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 md:w-7 md:h-7"
            onClick={handleStitchVideos}
            loading={stitchingVideos}
            title="Stitch All Videos"
            disabled={!videoClips.length || isProcessing()}
          >
            <Combine size={12} className="md:w-3.5 md:h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 md:w-7 md:h-7"
            onClick={handleMuteVideos}
            disabled={!videoClips.length || isProcessing()}
            title="Mute Video"
            loading={mutingVideos}
          >
            <VolumeX size={12} className="md:w-3.5 md:h-3.5" />
          </Button>
        </div>
      </div>

      {/* Visuals/Overlay Track Sidebar */}
      <div className="h-[64px] md:h-[74px] px-2 md:px-4 flex flex-col justify-center border-b border-neutral-700/50 relative">
        <div className="flex items-center gap-2 mb-1 md:mb-2 text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <ImageIcon size={12} className="md:w-3.5 md:h-3.5" /> Visuals
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 md:w-7 md:h-7" disabled={isProcessing()}>
          <Combine size={12} className="md:w-3.5 md:h-3.5" />
        </Button>
      </div>
    </div>
  );
};
