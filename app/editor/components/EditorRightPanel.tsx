/* eslint-disable @next/next/no-img-element */
'use client';

import { RightPanelActionButtons } from '@/components/right-panel/RightPanelActionButtons';
import { RightPanelExportedMedia } from '@/components/right-panel/RightPanelExportedMedia';
import { Row } from '@/components/Row';
import { Section } from '@/components/Section';
import { Button } from '@/components/ui/button';
import { useTimelineHooks } from '@/hooks/useTimelineHooks';
import { useVideoControls } from '@/hooks/useVideoControls';
import { useZipHook } from '@/hooks/useZipHook';
import { format, formatBytes, getAspectLabel } from '@/lib/helpers';
import { FileType } from '@/lib/utils';
import { LibraryContents } from '@/store/library.store';
import { TimelineClip, useTimelineStore } from '@/store/timeline.store';
import { Image as ImageIcon, Loader2, Maximize2, Music, Volume2, VolumeX, X } from 'lucide-react';
import React, { useState } from 'react';

export interface DownloadableMedia extends LibraryContents {
  selected: boolean;
}

interface EditorRightPanelProps {
  onClose?: () => void;
  videoRefs: React.MutableRefObject<Map<string, HTMLVideoElement>>;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  zip: ReturnType<typeof useZipHook>;
}

export const EditorRightPanel = React.memo(({ onClose, videoRefs, audioRefs, zip }: EditorRightPanelProps) => {
  const clipDetails = useTimelineStore((s) => s.selectedClip);
  const { clipLoading, updateClip } = useTimelineHooks();
  const { isProcessing, exportedMedia, handleAction, setExportedMedia } = zip;
  const { volume, toggleMute, handleVolumeChange } = useVideoControls({ videoRefs, audioRefs });

  const [frameCount, setFrameCount] = useState<number | string>(20);

  console.log({ clipDetails });
  console.log('right panel re-rendered');

  if (!clipDetails) {
    return (
      <div className="w-80 h-full border-l flex items-center bg-background justify-center text-sm text-muted-foreground">
        No clip selected
      </div>
    );
  }

  const { type, url, file, ...metadata } = clipDetails;
  const totalFrames =
    metadata?.duration && metadata?.video?.fps ? Math.round(metadata.duration * metadata.video.fps) : 0;

  if (clipLoading) {
    return (
      <div className="flex items-center justify-center h-full w-80 border-l bg-background">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-80 border-l bg-background">
      <div className="h-12 flex items-center justify-between px-4 border-b">
        <span className="font-semibold text-sm">Inspector</span>

        {onClose && (
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X size={16} />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="rounded-md overflow-hidden border bg-black">
          {type === FileType.Video && (
            <div className="relative group">
              <video src={url} controls className="w-full h-auto" id="inspector-video" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => document.getElementById('inspector-video')?.requestFullscreen()}
                >
                  <Maximize2 size={14} />
                </Button>
              </div>
            </div>
          )}

          {type === FileType.Image && (
            <img src={url} alt={clipDetails.file.name} className="w-full h-auto object-contain" />
          )}

          {type === FileType.Audio && (
            <div className="p-4 flex flex-col gap-2">
              <audio src={url} controls className="w-full" />
              <span className="text-xs text-muted-foreground">Audio Preview</span>
            </div>
          )}
        </div>
        <Section title="General">
          <Row label="Type" value={type} />
          <Row label="Duration" value={format(metadata?.duration, 's')} />
          <Row label="Format" value={metadata?.format} />
          <Row label="Size" value={formatBytes(metadata?.size)} />
          <Row label="Bitrate" value={format(metadata?.bitrate, 'bps')} />
        </Section>

        {(type === FileType.Video || type === FileType.Audio) && clipDetails && (
          <Section title="Audio Controls">
            <div className="flex items-center gap-3 py-1">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0"
                onClick={() => toggleMute(clipDetails)}
              >
                {clipDetails.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={clipDetails.muted ? 0 : volume}
                className="flex-1 accent-primary h-1.5 rounded-full appearance-none bg-muted cursor-pointer"
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
              />
            </div>
          </Section>
        )}

        {type === FileType.Video && (
          <Section title="Video">
            <Row label="Resolution" value={`${metadata?.video?.width} × ${metadata?.video?.height}`} />
            <Row label="FPS" value={metadata?.video?.fps?.toFixed(2)} />
            <Row label="Codec" value={metadata?.video?.codec} />
            <Row label="Pixel Format" value={metadata?.video?.pixelFormat} />
            <Row label="Color Space" value={metadata?.video?.colorSpace} />
            <Row label="Aspect Ratio" value={getAspectLabel(Number(metadata?.video?.aspectRatio ?? 0))} />
            <Row
              label="Total Frames"
              value={
                metadata?.duration && metadata?.video?.fps
                  ? Math.round(metadata.duration * metadata.video.fps).toString()
                  : '-'
              }
            />
          </Section>
        )}

        {type === FileType.Video && (
          <Section title="Transitions">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Effect</label>
                <select
                  value={clipDetails.transition || 'none'}
                  onChange={(e) =>
                    updateClip(clipDetails.id, {
                      transition: e.target.value as TimelineClip['transition'],
                    })
                  }
                  className="w-full bg-background border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="none">None</option>
                  <option value="fade">Fade</option>
                  <option value="crossfade">Crossfade</option>
                  <option value="wipeleft">Wipe Left</option>
                  <option value="wiperight">Wipe Right</option>
                  <option value="wipeup">Wipe Up</option>
                  <option value="wipedown">Wipe Down</option>
                  <option value="slideleft">Slide Left</option>
                  <option value="slideright">Slide Right</option>
                  <option value="slideup">Slide Up</option>
                  <option value="slidedown">Slide Down</option>
                  <option value="circlecrop">Circle Crop</option>
                  <option value="distance">Distance</option>
                  <option value="fadeblack">Fade to Black</option>
                  <option value="fadewhite">Fade to White</option>
                  <option value="radial">Radial</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Duration (s)
                  </label>
                  <span className="text-[10px] text-primary">{(clipDetails.transitionDuration || 1).toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={clipDetails.transitionDuration || 1}
                  onChange={(e) =>
                    updateClip(clipDetails.id, {
                      transitionDuration: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-primary h-1.5 rounded-full appearance-none bg-muted cursor-pointer"
                />
              </div>
            </div>
          </Section>
        )}

        {(type === FileType.Video || type === FileType.Audio) && metadata?.audio?.codec && (
          <Section title="Audio">
            <Row label="Codec" value={metadata?.audio?.codec} />
            <Row label="Channels" value={metadata?.audio?.channels?.toString()} />
            <Row label="Sample Rate" value={metadata?.audio?.sampleRate?.toString()} />
            <Row label="Bitrate" value={metadata?.audio?.bitrate?.toString()} />
          </Section>
        )}
        {type === FileType.Video && (
          <Section title="Media Actions">
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 min-w-32.5 text-xs flex gap-2"
                onClick={() => handleAction(file, clipDetails.id, 'thumbnail', 5)}
                disabled={isProcessing}
              >
                <ImageIcon size={14} /> Thumbnail
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="flex-1 min-w-32.5 text-xs flex gap-2"
                onClick={() => handleAction(file, clipDetails.id, 'audio', metadata?.duration)}
                disabled={isProcessing}
              >
                <Music size={14} /> Extract Audio
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="flex-1 min-w-32.5 text-xs flex gap-2"
                onClick={() => handleAction(file, clipDetails.id, 'mute', metadata?.duration)}
                disabled={isProcessing}
              >
                <VolumeX size={14} /> Remove Audio
              </Button>
            </div>

            <RightPanelActionButtons
              totalFrames={totalFrames}
              frameCount={frameCount}
              setFrameCount={setFrameCount}
              isProcessing={isProcessing}
              file={file}
              clipId={clipDetails.id}
              duration={metadata?.duration}
              startTime={clipDetails.startTime}
              handleAction={handleAction}
            />
          </Section>
        )}
      </div>

      {exportedMedia && (
        <RightPanelExportedMedia
          zip={zip}
          onCancel={() => setExportedMedia(null)}
          clipId={clipDetails.id}
        />
      )}
    </div>
  );
});

EditorRightPanel.displayName = 'EditorRightPanel';
