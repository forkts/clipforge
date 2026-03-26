import { DownloadableMedia } from '@/app/editor/components/EditorRightPanel';
import { extractAudio } from '@/lib/extractAudio';
import { getFramesPerSecond } from '@/lib/generateFrameAtTime';
import { generateThumbnail } from '@/lib/generateThumbnail';
import { generateVideoFrames } from '@/lib/generateVideoFrames';
import { muteVideo } from '@/lib/muteVideo';
import { FileType } from '@/lib/utils';

import JSZip from 'jszip';
import { useState } from 'react';
import { toast } from 'sonner';

export const useZipHook = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [exportedMedia, setExportedMedia] = useState<DownloadableMedia[] | null>(null);

  const handleZip = async (downloadableMedia: DownloadableMedia[]) => {
    const toastId = toast.loading('Creating ZIP archive...');
    try {
      const zip = new JSZip();
      for (const item of downloadableMedia) {
        const res = await fetch(item.url);
        const blob = await res.blob();
        zip.file(item.file.name, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      downloadUrl(zipUrl, `exported_${crypto.randomUUID()}.zip`);
      toast.success('ZIP downloaded successfully!', { id: toastId });
      setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
    } catch (err) {
      toast.error(`Error zipping: ${err}`, { id: toastId });
    } finally {
      setIsProcessing(false);
      setExportedMedia(null);
    }
  };

  const handleDownloadAll = async (exportedMedia: DownloadableMedia[]) => {
    if (!exportedMedia) return;
    const selectedItems = exportedMedia.filter((m) => m.selected);
    if (!selectedItems.length) return;

    if (selectedItems.length > 1) {
      setIsProcessing(true);
      handleZip(selectedItems);
    } else {
      const item = selectedItems[0];
      downloadUrl(item.url, item.file.name);
      toast.success('Downloading selected item!');
      setExportedMedia(null);
    }
  };

  const downloadUrl = (downloadUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.click();
  };

  const handleAction = async (
    file: File,
    id: string,
    action: 'thumbnail' | 'audio' | 'frames' | 'mute' | 'none' | 'frames-per-second',
    duration?: number,
    customFrameCount?: number,
    startTime?: number,
  ) => {
    if (!file) return;
    setIsProcessing(true);
    const toastId = toast.loading(`Processing ${action}...`);
    try {
      switch (action) {
        case 'thumbnail': {
          const resultUrl = await generateThumbnail(file);
          const res = await fetch(resultUrl);
          const blob = await res.blob();
          const resultFile = new File([blob], `thumbnail_${file.name}.jpg`, {
            type: 'image/jpeg',
          });
          setExportedMedia([
            {
              url: resultUrl,
              type: FileType.Image,
              selected: true,
              file: resultFile,
              id: id,
              duration: 5, // Default for image
            },
          ]);
          break;
        }
        case 'audio': {
          const blob = await extractAudio(file);
          const resultUrl = URL.createObjectURL(blob);
          const resultFile = new File([blob], `audio_${file.name}.mp3`, {
            type: 'audio/mpeg',
          });
          setExportedMedia([
            {
              url: resultUrl,
              type: FileType.Audio,
              selected: true,
              file: resultFile,
              id: id,
              duration,
            },
          ]);
          break;
        }
        case 'frames': {
          const result = await generateVideoFrames(file, customFrameCount ?? 20);
          const mediaItems = await Promise.all(
            result.frames.map(async (frameUrl, i) => {
              const res = await fetch(frameUrl);
              const blob = await res.blob();
              return {
                url: frameUrl,
                type: FileType.Image,
                selected: true,
                id: id,
                file: new File([blob], `frame_${i}_${file.name}.jpg`, {
                  type: 'image/jpeg',
                }),
                duration: 5,
              };
            }),
          );
          setExportedMedia(mediaItems);
          break;
        }
        case 'mute': {
          const blob = await muteVideo(file);
          const resultUrl = URL.createObjectURL(blob);
          setExportedMedia([
            {
              url: resultUrl,
              type: FileType.Video,
              selected: true,
              id: id,
              file: new File([blob], `muted_${file.name}`, {
                type: 'video/mp4',
              }),
              duration,
            },
          ]);
          break;
        }
        case 'frames-per-second': {
          const result = await getFramesPerSecond(file, startTime, duration, customFrameCount);
          const mediaItems = await Promise.all(
            result.map(async (frameUrl, i) => {
              const res = await fetch(frameUrl);
              const blob = await res.blob();
              return {
                url: frameUrl,
                type: FileType.Image,
                selected: true,
                id: id,
                file: new File([blob], `frame_${i}_${file.name}.jpg`, {
                  type: 'image/jpeg',
                }),
                duration: 5,
              };
            }),
          );
          setExportedMedia(mediaItems);
          break;
        }
        case 'none':
          setExportedMedia([
            {
              url: URL.createObjectURL(file),
              type: FileType.Video,
              selected: true,
              id: id,
              file: file,
              duration,
            },
          ]);
          break;
      }
      toast.success(`${action} generation complete!`, { id: toastId });
    } catch (error) {
      toast.error(`Error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleDownloadAll,
    isProcessing,
    exportedMedia,
    setExportedMedia,
    setIsProcessing,
    handleAction,
  };
};
