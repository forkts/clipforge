import { useZipHook } from '@/hooks/useZipHook';
import { clamp, secondsToTime, timeToSeconds } from '@/lib/helpers';
import { Film } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface RightPanelActionButtonsProps {
  totalFrames: number | null;
  frameCount: number | string;
  setFrameCount: (value: number | string) => void;
  isProcessing: boolean;
  file: File;
  clipId: string;
  duration?: number;
  startTime?: number;
  handleAction: ReturnType<typeof useZipHook>['handleAction'];
}

const FPS_OPTIONS = [1, 2, 5, 10, 24, 30, 60];

export const RightPanelActionButtons = ({
  totalFrames,
  frameCount,
  setFrameCount,
  isProcessing,
  file,
  clipId,
  duration = 0,
  startTime = 0,
  handleAction,
}: RightPanelActionButtonsProps) => {
  const [fpsCount, setFpsCount] = useState<number>(1);
  const [localStart, setLocalStart] = useState(startTime);
  const [localDuration, setLocalDuration] = useState(duration);

  const handleStartChange = (time: string) => {
    const sec = timeToSeconds(time);

    const clampedStart = clamp(sec, 0, duration - 1);

    setLocalStart(clampedStart);

    if (clampedStart + localStart > duration) {
      setLocalStart(duration - localStart);
    }
  };

  const handleDurationChange = (time: string) => {
    const sec = timeToSeconds(time);

    const maxAllowed = duration - localStart;

    const clampedDuration = clamp(sec, 1, maxAllowed);

    setLocalDuration(clampedDuration);
  };

  return (
    <div className="border rounded p-3 flex flex-col gap-3 mt-2 bg-muted/20">
      {/* Frame Extraction */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium flex items-center gap-1.5">
          <Film size={14} /> Extract Frames
        </span>
        <span className="text-[10px] text-muted-foreground">{totalFrames ? `Max: ${totalFrames}` : ''}</span>
      </div>

      <div className="flex gap-2 items-center">
        <Input
          type="number"
          className="h-8 text-xs w-20"
          value={frameCount}
          min={1}
          max={totalFrames || 100}
          onChange={(e) => setFrameCount(Math.max(1, Math.min(Number(e.target.value), totalFrames || 10000)))}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFrameCount(totalFrames || 20)}
          disabled={!totalFrames || isProcessing}
        >
          All
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => handleAction(file, clipId, 'frames', undefined, Number(frameCount) || 20)}
          disabled={isProcessing}
        >
          Generate
        </Button>
      </div>

      {/* FPS Extraction */}
      <div className="flex flex-col gap-2 pt-2 border-t">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Frames Per Second</span>

        <div className="flex gap-1.5 flex-wrap">
          {FPS_OPTIONS.map((fps) => (
            <Button
              key={fps}
              variant={fpsCount === fps ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFpsCount(fps)}
              disabled={isProcessing}
            >
              {fps}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col">
            <Input type="time" value={secondsToTime(localStart)} onChange={(e) => handleStartChange(e.target.value)} />
            <span className="text-[10px] text-muted-foreground">Range: 0 → {secondsToTime(duration)}</span>
          </div>
          <div className="flex flex-col">
            <Input
              type="time"
              value={secondsToTime(localDuration)}
              onChange={(e) => handleDurationChange(e.target.value)}
            />
            <span className="text-[10px] text-muted-foreground">Max duration: {secondsToTime(duration)}</span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleAction(file, clipId, 'frames-per-second', localDuration, fpsCount, localStart)}
          disabled={isProcessing}
        >
          Generate by FPS
        </Button>
      </div>
    </div>
  );
};
