import { addAudioToVideo } from '@/lib/addAudioToVideo';
import { getFullVideoMetadata } from '@/lib/generateVideoMetadata';
import { muteVideo } from '@/lib/muteVideo';
import { stitchAudios } from '@/lib/stitchAudios';
import { stitchVideos } from '@/lib/stitchVideos';
import { FileType, trackMap, TrackType } from '@/lib/utils';

import { LibraryContents, useLibraryStore } from '@/store/library.store';
import { TimelineClip, useClipsStore, useTimelineStore } from '@/store/timeline.store';
import { Metadata } from 'next';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const recalculateV1StartTimes = (clips: TimelineClip[]): TimelineClip[] => {
  const v1Clips = clips.filter((c) => c.track === 'v1').sort((a, b) => a.startTime - b.startTime);

  const otherClips = clips.filter((c) => c.track !== 'v1');

  let currentStartTime = 0;

  const reorderedV1 = v1Clips.map((clip) => {
    const updatedClip = { ...clip, startTime: currentStartTime };
    currentStartTime += clip.duration;
    return updatedClip;
  });

  return [...otherClips, ...reorderedV1];
};

const recalculateAudioStartTimes = (clips: TimelineClip[]): TimelineClip[] => {
  const audioClips = clips.filter((c) => c.track === TrackType.Audio).sort((a, b) => a.startTime - b.startTime);

  const otherClips = clips.filter((c) => c.track !== TrackType.Audio);

  let currentStartTime = 0;

  const reorderedA1 = audioClips.map((clip) => {
    const updatedClip = { ...clip, startTime: currentStartTime };
    currentStartTime += clip.duration;
    return updatedClip;
  });

  return [...otherClips, ...reorderedA1];
};

function cleanupClipResources(clip?: TimelineClip) {
  try {
    clip?.revokeFrames?.();
  } catch {}
}

export const useTimelineHooks = () => {
  const { removeLibrary, removeEditedLibrary } = useLibraryStore();
  const [removeLoading, setRemoveLoading] = useState<boolean>(false);
  const [clipLoading, setClipLoading] = useState<boolean>(false);
  const clips = useTimelineStore((s) => s.clips);
  const videoClips = clips.filter((c) => c.track === TrackType.Video);
  const audioClips = clips.filter((c) => c.track === TrackType.Audio);

  // Use selectors to minimize re-renders. Only subscribe to state we actually need to return or react to.
  const setSelectedClip = useTimelineStore((s) => s.setSelectedClip);
  const {
    addingAudioToVideo,
    stitchingAudios,
    setAddingAudioToVideo,
    setStitchingAudios,
    stitchingVideos,
    setStitchingVideos,
    generatingTrack,
    mutingVideos,
    setMutingVideos,
    setGeneratingTrack,
  } = useClipsStore();

  // --- Base Actions (Defined first because they are used by other actions) ---

  const updateClip = useCallback((id: string, updates: Partial<TimelineClip>) => {
    const updatedClips = useTimelineStore.getState().clips.map((c) => {
      if (c.id !== id) return c;
      if (updates.frames && c.frames) {
        cleanupClipResources(c);
      }
      return { ...c, ...updates };
    });

    const { selectedClip } = useTimelineStore.getState();
    const updatedSelectedClip = selectedClip?.id === id ? { ...selectedClip, ...updates } : selectedClip;

    const targetClip = useTimelineStore.getState().clips.find((c) => c.id === id);
    if (targetClip?.track === 'v1' || updates.track === 'v1') {
      useTimelineStore.setState({
        clips: recalculateV1StartTimes(updatedClips),
        selectedClip: updatedSelectedClip,
      });
    } else {
      useTimelineStore.setState({
        clips: updatedClips,
        selectedClip: updatedSelectedClip,
      });
    }
  }, []);

  const addClip = useCallback(
    (
      clip: Omit<TimelineClip, 'id' | 'startTime'> & {
        id?: string;
        startTime?: number;
      },
    ) => {
      const id = clip.id || crypto.randomUUID();
      const { clips } = useTimelineStore.getState();
      let newStartTime = clip.startTime;

      if (!newStartTime) {
        const trackClips = clips.filter((c) => c.track === clip.track);
        newStartTime = trackClips.length > 0 ? Math.max(...trackClips.map((c) => c.startTime + c.duration)) : 0;
      }

      const newClip: TimelineClip = {
        ...clip,
        id,
        startTime: newStartTime,
      } as TimelineClip;

      let newClips = [...clips, newClip];

      if (clip.track === TrackType.Video) {
        newClips = recalculateV1StartTimes(newClips);
      } else if (clip.track === TrackType.Audio) {
        newClips = recalculateAudioStartTimes(newClips);
      }

      useTimelineStore.setState({ clips: newClips });
    },
    [],
  );

  const removeClip = useCallback((id: string) => {
    const { clips, selectedClip, currentTime } = useTimelineStore.getState();
    const target = clips.find((c) => c.id === id);
    cleanupClipResources(target);

    const filtered = clips.filter((c) => c.id !== id);
    const isLastClip = filtered.length === 0;

    const nextSelectedClip = selectedClip?.id === id ? null : selectedClip;

    let newClips = filtered;
    if (target?.track === TrackType.Video) {
      newClips = recalculateV1StartTimes(filtered);
    } else if (target?.track === TrackType.Audio) {
      newClips = recalculateAudioStartTimes(filtered);
    }

    const stateUpdates: Partial<ReturnType<typeof useTimelineStore.getState>> = {
      clips: newClips,
      selectedClip: nextSelectedClip,
    };

    const isActive = target && currentTime >= target.startTime && currentTime < target.startTime + target.duration;

    if (isLastClip || isActive) {
      stateUpdates.currentTime = isLastClip ? 0 : currentTime;
      stateUpdates.isPlaying = false;
    }

    useTimelineStore.setState(stateUpdates);
  }, []);

  const setStitchedVideo = useCallback((clip: TimelineClip) => {
    useTimelineStore.setState({ clips: [clip] });
  }, []);

  const setStitchedAudio = useCallback((clip: TimelineClip) => {
    useTimelineStore.setState({ clips: [clip] });
  }, []);

  const addAudioToStitchedVideo = useCallback((clip: TimelineClip) => {
    useTimelineStore.setState({ clips: [clip] });
  }, []);

  const clearTimeline = useCallback(() => {
    const { clips } = useTimelineStore.getState();
    clips.forEach(cleanupClipResources);
    useTimelineStore.setState({
      clips: [],
      selectedClip: null,
      currentTime: 0,
      isPlaying: false,
    });
  }, []);

  // --- Derived Actions ---

  const handleMuteVideos = useCallback(async () => {
    const { clips } = useTimelineStore.getState();
    const videoClips = clips.filter((c) => c.type === FileType.Video);
    if (!videoClips.length) return;
    setMutingVideos(true);
    try {
      for (const videoClip of videoClips) {
        const blob = await muteVideo(videoClip.file);
        const resultUrl = URL.createObjectURL(blob);
        updateClip(videoClip.id, {
          file: new File([blob], `muted_${videoClip.file.name}`, {
            type: 'video/mp4',
          }),
          url: resultUrl,
          frames: [], // Clear frames to trigger re-generation
        });
        toast.success('Video muted successfully', {
          description: videoClip.file.name,
        });
      }
    } catch (error) {
      toast.error('Muting failed', { description: error as string });
    } finally {
      setMutingVideos(false);
    }
  }, [updateClip, setMutingVideos]);

  const handleStitchVideos = useCallback(async () => {
    const { clips } = useTimelineStore.getState();
    const videoClips = clips.filter((c) => c.type === FileType.Video);

    console.log('Video clips length:', videoClips.length);
    if (videoClips.length < 2) {
      toast.error('Need at least 2 videos to stitch');
      return;
    }
    setStitchingVideos(true);
    console.log('Initiating concatenation of videos');
    try {
      const blob = await stitchVideos(videoClips);
      const exportFileName = `${videoClips.map((c) => c.file.name.split('.')[0]).join('_')}.mp4`;
      const file = new File([blob], exportFileName, { type: 'video/mp4' });
      const url = URL.createObjectURL(file);

      const newClip: TimelineClip = {
        id: crypto.randomUUID(),
        file,
        url,
        type: FileType.Video,
        track: TrackType.Video,
        startTime: 0,
        duration: videoClips.reduce((acc, c) => acc + c.duration, 0),
        trimStart: 0,
        frames: [],
      };

      setStitchedVideo(newClip);
      toast.success('Videos stitched successfully');
    } catch (error) {
      toast.error('Stitching failed', { description: error as string });
    } finally {
      setStitchingVideos(false);
    }
  }, [setStitchedVideo, setStitchingVideos]);

  const handleStitchAudios = useCallback(async () => {
    const { clips } = useTimelineStore.getState();
    const audioClips = clips.filter((c) => c.type === FileType.Audio);
    if (audioClips.length < 2) {
      toast.error('Need at least 2 audios to stitch');
      return;
    }
    setStitchingAudios(true);
    try {
      const blob = await stitchAudios(audioClips);
      const file = new File([blob], 'stitched.mp3', { type: 'audio/mpeg' });
      const url = URL.createObjectURL(file);

      const newClip: TimelineClip = {
        id: crypto.randomUUID(),
        file,
        url,
        type: FileType.Audio,
        track: TrackType.Audio,
        startTime: 0,
        duration: audioClips.reduce((acc, c) => acc + c.duration, 0),
        trimStart: 0,
        frames: [],
      };

      setStitchedAudio(newClip);
      toast.success('Audios stitched successfully');
    } catch (error) {
      toast.error('Stitching failed', { description: error as string });
    } finally {
      setStitchingAudios(false);
    }
  }, [setStitchedAudio, setStitchingAudios]);

  const handleAddAudioToVideo = useCallback(async () => {
    try {
      const { clips } = useTimelineStore.getState();
      const videoClips = clips.filter((c) => c.type === FileType.Video);
      const audioClips = clips.filter((c) => c.type === FileType.Audio);
      if (videoClips.length !== 1) {
        toast.error('Need exactly 1 video to add audio');
        return;
      }

      if (audioClips.length !== 1) {
        toast.error('Stitch all audios or use only one audio');
        return;
      }
      setAddingAudioToVideo(true);
      const blob = await addAudioToVideo(videoClips[0].file, audioClips[0].file);
      const file = new File([blob], 'video_with_audio.mp4', {
        type: 'video/mp4',
      });

      const url = URL.createObjectURL(file);
      const newClip: TimelineClip = {
        id: crypto.randomUUID(),
        file,
        url,
        type: FileType.Video,
        track: TrackType.Video,
        startTime: 0,
        duration: videoClips[0].duration,
        trimStart: 0,
        frames: [],
      };
      addAudioToStitchedVideo(newClip);
      toast.success('Audio added successfully');
    } catch (error) {
      toast.error('Adding audio failed', { description: error as string });
    } finally {
      setAddingAudioToVideo(false);
    }
  }, [addAudioToStitchedVideo, setAddingAudioToVideo]);

  const handleGenerateClipDetails = useCallback(
    async (item: LibraryContents) => {
      if (!item.file) {
        toast.error('File not found');
        return;
      }
      setClipLoading(true);
      try {
        const metadata = (await getFullVideoMetadata(item.file)) as Metadata;
        console.log({ metadata });

        const meta = {
          id: item.id,
          type: item.type,
          url: item.url,
          file: item.file,
          track: trackMap[item.type],
          duration: item.duration || 0,
          trimStart: 0,
          startTime: 0,
          ...metadata,
        };
        setSelectedClip(meta);
        return { meta, metadata };
      } catch (error) {
        console.error('Error getting video metadata:', error);
      } finally {
        setClipLoading(false);
      }
    },
    [setSelectedClip],
  );

  const handleSelectTrackClip = useCallback(
    async (item: LibraryContents) => {
      const { selectedClip } = useTimelineStore.getState();
      if (selectedClip?.id !== item?.id) {
        setSelectedClip({
          id: item.id,
          type: item.type,
          url: item.url,
          file: item.file,
          track: trackMap[item.type],
          duration: item.duration || 0,
          trimStart: 0,
          startTime: 0,
        });
      }
    },
    [setSelectedClip],
  );

  const handleAddToTrack = useCallback(
    async (item: LibraryContents) => {
      setGeneratingTrack(true);
      try {
        const { selectedClip } = useTimelineStore.getState();
        const newClip = {
          ...item,
          track: trackMap[item.type],
          duration: item.duration || 0,
          trimStart: 0,
          startTime: 0,
        };

        if (selectedClip?.id !== item.id) {
          setSelectedClip(newClip);
        }

        addClip({
          ...item,
          duration: item.duration || 0,
          track: trackMap[item.type],
          trimStart: 0,
          frames: [],
        });
        toast.success('Clip added to track');
      } catch (error) {
        console.error('Error adding to track:', error);
      } finally {
        setGeneratingTrack(false);
      }
    },
    [addClip, setSelectedClip, setGeneratingTrack],
  );

  const handleRemoveFromLibrary = useCallback(
    (e: React.MouseEvent, item: LibraryContents) => {
      setRemoveLoading(true);
      try {
        e.stopPropagation();
        removeLibrary(item.id);
        removeEditedLibrary(item.id);
        const { selectedClip } = useTimelineStore.getState();
        if (selectedClip?.id === item.id) {
          setSelectedClip(null);
        }
      } catch (error) {
        console.error('Error removing library:', error);
      } finally {
        setRemoveLoading(false);
      }
    },
    [removeLibrary, removeEditedLibrary, setSelectedClip],
  );

  const handleRemoveFromTrack = useCallback(
    (e: React.MouseEvent, item: LibraryContents) => {
      setRemoveLoading(true);
      try {
        e.stopPropagation();
        removeLibrary(item.id);
        const { selectedClip } = useTimelineStore.getState();
        if (selectedClip?.id === item.id) {
          setSelectedClip(null);
        }
      } catch (error) {
        console.error('Error removing library:', error);
      } finally {
        setRemoveLoading(false);
      }
    },
    [removeLibrary, setSelectedClip],
  );

  const reorderClips = useCallback((track: string, startIndex: number, endIndex: number) => {
    const { clips } = useTimelineStore.getState();
    const trackClips = clips.filter((c) => c.track === track);
    const otherClips = clips.filter((c) => c.track !== track);

    const result = Array.from(trackClips);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    if (track === TrackType.Video) {
      useTimelineStore.setState({
        clips: recalculateV1StartTimes([...otherClips, ...result]),
      });
    } else if (track === TrackType.Audio) {
      useTimelineStore.setState({
        clips: recalculateAudioStartTimes([...otherClips, ...result]),
      });
    } else {
      useTimelineStore.setState({ clips: [...otherClips, ...result] });
    }
  }, []);

  const splitClip = useCallback((id: string, playheadTime: number) => {
    const { clips } = useTimelineStore.getState();
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;

    const offset = playheadTime - clip.startTime;
    if (offset <= 0 || offset >= clip.duration) return;

    const firstPart = {
      ...clip,
      duration: offset,
    };

    const secondPart = {
      ...clip,
      id: crypto.randomUUID(),
      startTime: playheadTime,
      duration: clip.duration - offset,
      trimStart: (clip.trimStart || 0) + offset,
    };

    const newClips = clips.map((c) => (c.id === id ? firstPart : c)).concat(secondPart);

    if (clip.track === TrackType.Video) {
      useTimelineStore.setState({ clips: recalculateV1StartTimes(newClips) });
    } else if (clip.track === TrackType.Audio) {
      useTimelineStore.setState({
        clips: recalculateAudioStartTimes(newClips),
      });
    } else {
      useTimelineStore.setState({ clips: newClips });
    }
  }, []);

  return useMemo(
    () => ({
      removeLoading,
      videoClips,
      audioClips,
      trackLoading: generatingTrack,
      clipLoading,
      handleGenerateClipDetails,
      handleAddToTrack,
      handleRemoveFromLibrary,
      handleRemoveFromTrack,
      handleSelectTrackClip,
      addClip,
      updateClip,
      removeClip,
      splitClip,
      reorderClips,
      clearTimeline,
      setStitchedVideo,
      setStitchedAudio,
      addAudioToStitchedVideo,
      setGeneratingTrack,
      handleStitchVideos,
      handleStitchAudios,
      handleAddAudioToVideo,
      handleMuteVideos,
      addingAudioToVideo,
      stitchingVideos,
      stitchingAudios,
      mutingVideos,
    }),
    [
      removeLoading,
      videoClips,
      audioClips,
      generatingTrack,
      clipLoading,
      handleGenerateClipDetails,
      handleAddToTrack,
      handleRemoveFromLibrary,
      handleRemoveFromTrack,
      handleSelectTrackClip,
      addClip,
      updateClip,
      removeClip,
      splitClip,
      reorderClips,
      clearTimeline,
      setStitchedVideo,
      setStitchedAudio,
      addAudioToStitchedVideo,
      setGeneratingTrack,
      handleStitchVideos,
      handleStitchAudios,
      handleAddAudioToVideo,
      handleMuteVideos,
      addingAudioToVideo,
      stitchingVideos,
      stitchingAudios,
      mutingVideos,
    ],
  );
};
