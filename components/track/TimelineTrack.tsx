import { TrackType } from '@/lib/utils';
import { TimelineClip, useClipsStore } from '@/store/timeline.store';
import { Loader2 } from 'lucide-react';
import { TimelineClipView } from './TimelineClipView';

interface Props {
  clips: TimelineClip[];
  zoom: number;
  visibleStart: number;
  visibleEnd: number;
  timeToPx: (t: number) => number;
}

export function TimelineTrack({ clips, zoom, visibleStart, visibleEnd, timeToPx }: Props) {
  const { generatingTrack, stitchingVideos, stitchingAudios, addingAudioToVideo, mutingVideos } = useClipsStore();
  const isProcessing = generatingTrack || stitchingVideos || stitchingAudios || addingAudioToVideo || mutingVideos;

  const videoClips = clips.filter((c) => c.track === TrackType.Video);
  const imageClips = clips.filter((c) => c.track === TrackType.Image);
  const audioClips = clips.filter((c) => c.track === TrackType.Audio);

  return (
    <div className="relative h-full flex flex-col">
      {/* Main Track Area */}
      <div className="flex-1 relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-50 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <div className="bg-background/90 px-6 py-3 rounded-2xl border border-primary/20 flex flex-col items-center gap-3 shadow-2xl scale-110">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse rounded-full" />
                <Loader2 className="animate-spin text-primary relative" size={24} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-semibold tracking-tight">
                  {stitchingVideos ? 'Stitching Videos...' :
                   stitchingAudios ? 'Merging Audios...' :
                   addingAudioToVideo ? 'Adding Audio to Video...' :
                   mutingVideos ? 'Muting Videos...' :
                   'Processing Media...'}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest animate-pulse">Please wait</span>
              </div>
            </div>
          </div>
        )}

        {/* Audio Track Lane */}
        <div className="h-[64px] md:h-[74px] relative border-b border-neutral-700/50 group hover:bg-white/5 transition-colors">
          {audioClips.map((clip) => (
            <TimelineClipView
              key={clip.id}
              clip={clip}
              zoom={zoom}
              visibleStart={visibleStart}
              visibleEnd={visibleEnd}
              timeToPx={timeToPx}
            />
          ))}
        </div>

        {/* Video Track Lane */}
        <div className="h-[64px] md:h-[74px] relative border-b border-neutral-700/50 group hover:bg-white/5 transition-colors">
          {videoClips.map((clip) => (
            <TimelineClipView
              key={clip.id}
              clip={clip}
              zoom={zoom}
              visibleStart={visibleStart}
              visibleEnd={visibleEnd}
              timeToPx={timeToPx}
            />
          ))}
        </div>

        {/* Visuals Track Lane */}
        <div className="h-[64px] md:h-[74px] relative border-b border-neutral-700/50 group hover:bg-white/5 transition-colors">
          {imageClips.map((clip) => (
            <TimelineClipView
              key={clip.id}
              clip={clip}
              zoom={zoom}
              visibleStart={visibleStart}
              visibleEnd={visibleEnd}
              timeToPx={timeToPx}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
