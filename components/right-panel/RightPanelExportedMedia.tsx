import { DownloadableMedia } from '@/app/editor/components/EditorRightPanel';
import { Modal } from '@/components/Modal';
import { useTimelineHooks } from '@/hooks/useTimelineHooks';
import { useZipHook } from '@/hooks/useZipHook';
import { handleGenerateContentInfo } from '@/lib/helpers';
import { FileType, trackMap, TrackType } from '@/lib/utils';
import { useLibraryStore } from '@/store/library.store';
import { useTimelineStore } from '@/store/timeline.store';
import { Check, Download, Music, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Carousel } from '../Carousel';
import { Button } from '../ui/button';

interface RightPanelExportedMediaProps {
  onCancel: () => unknown;
  clipId?: string;
  zip: ReturnType<typeof useZipHook>;
}

export const RightPanelExportedMedia = ({ onCancel, clipId, zip }: RightPanelExportedMediaProps) => {
  const { isProcessing, handleDownloadAll, setExportedMedia, exportedMedia } = zip;
  const { setEditedLibrary } = useLibraryStore();
  const { clips } = useTimelineStore();
  const { updateClip, addClip } = useTimelineHooks();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleUseOnTrack = async (media: DownloadableMedia) => {
    try {
      const newItem = {
        ...media,
        id: crypto.randomUUID(),
      };

      setEditedLibrary((prev) => [...prev, newItem]);

      if (clipId && clips.some((c) => c.id === clipId)) {
        updateClip(clipId, {
          file: media.file,
          url: media.url,
          type: media.type,
          track: trackMap[media.type] as TrackType,
          duration: media.duration || 0,
          frames: [], // Clear frames to re-trigger generation if needed
        });
        toast.success('Timeline updated with edited version');
      } else {
        const [edited] = await handleGenerateContentInfo([media.file]);
        addClip({
          ...edited,
          duration: media.duration || 0,
          track: trackMap[media.type] as TrackType,
          trimStart: 0,
          frames: [],
        });
        toast.success('Clip added to track');
      }

      onCancel();
    } catch (error) {
      toast.error('Failed to update track');
      console.error(error);
    }
  };

  if(!exportedMedia?.length) return null

  return (
    <Modal
      isOpen={!!exportedMedia.length}
      onClose={onCancel}
      title="Export Preview"
      description={`Selected ${exportedMedia.filter((m) => m.selected).length} items`}
      size="xl"
    >
      <div className="flex flex-col gap-6 items-center p-2">
        <Button
          size={'sm'}
          disabled={exportedMedia.filter((m) => m.selected).length === 0 || isProcessing}
          onClick={() => handleDownloadAll(exportedMedia)}
        >
          <Download size={18} />
          {exportedMedia.filter((m) => m.selected).length > 1 ? 'Download as ZIP' : 'Download'}
        </Button>
        <div className="w-full flex flex-col items-center justify-center bg-black/5 rounded-xl mb-10 overflow-hidden min-h-[300px] border border-dashed border-muted-foreground/20 relative">
          {(exportedMedia[0].type === FileType.Image || exportedMedia[0].type === FileType.Video) && (
            <div className="w-full h-[300px]">
              <Carousel
                items={exportedMedia}
                initialIndex={activeIndex}
                getKey={(item) => item.url}
                getUrl={(item) => item.url}
                getFileType={(item) => item.type}
                className="w-full h-full"
                urls={exportedMedia.map((i) => i.url)}
                onSelectId={(url) => {
                  const idx = exportedMedia.findIndex((m) => m.url === url);
                  if (idx !== -1) setActiveIndex(idx);
                }}
              />
            </div>
          )}

          {exportedMedia[0].type === FileType.Audio && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full p-4">
              {exportedMedia.map((media, i) => (
                <div
                  key={i}
                  className={`relative border rounded-xl overflow-hidden ${
                    media.selected ? 'border-primary ring-2 ring-primary/50' : 'border-muted opacity-50'
                  } bg-background flex flex-col items-center p-4 transition-all`}
                >
                  <div className="w-full flex flex-col items-center gap-4 bg-muted/20 rounded-lg p-4">
                    <Music size={32} className="text-emerald-500" />
                    <audio src={media.url} controls className="w-full h-8" />
                  </div>
                  <Button
                    variant={media.selected ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      const newArr = [...exportedMedia];
                      newArr[i].selected = !newArr[i].selected;
                      setExportedMedia(newArr);
                    }}
                    className="mt-3 w-full text-xs"
                  >
                    {media.selected ? 'Included' : 'Excluded'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 flex flex-row gap-2 left-1/2 -translate-x-1/2 z-20 p-2 mt-10">
          <Button size={'sm'} onClick={onCancel}>
            <X size={18} /> Cancel
          </Button>
          <Button size={'sm'} onClick={() => handleUseOnTrack(exportedMedia[activeIndex])}>
            <Check size={18} /> Use on Track
          </Button>
        </div>
      </div>
    </Modal>
  );
};
