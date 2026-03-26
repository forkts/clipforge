import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';
import { Metadata } from './videoFrames';

export async function getVideoMetadata(file: File) {
  const ffmpeg = await getFFmpeg(); // FFmpeg instance
  const input = `meta_${crypto.randomUUID()}.mp4`; // TEMPORARY FILE NAME INSIDE FFMPEG'S VIRTUAL FS

  let fps = 30; // Default FPS
  let width = 0; // Default width
  let height = 0; // Default height
  let hasAudio = false;

  // FFmpeg logs metadata in real-time, so we listen for it::: Stream #0:0: Video: h264, yuv420p, 1280x720, 30 fps
  const onLog = ({ message }: { message: string }) => {
    if (message.includes('Audio:')) hasAudio = true;
    const fpsMatch = message.match(/([\d.]+) fps/); // Regex to extract FPS
    if (fpsMatch) fps = parseFloat(fpsMatch[1]);

    const resMatch = message.match(/, (\d+)x(\d+)/); // Regex to extract resolution
    if (resMatch) {
      // Logs are strings → convert to numbers
      width = parseInt(resMatch[1]);
      height = parseInt(resMatch[2]);
    }
  };

  try {
    // Write file to FFmpeg's virtual filesystem
    // Converts browser File → Uint8Array
    // Stores in FFmpeg memory FS
    // This is the same as:
    // await ffmpeg.writeFile(input, await file.arrayBuffer());
    await ffmpeg.writeFile(input, await fetchFile(file));

    // Attach the log listener BEFORE running exec
    ffmpeg.on('log', onLog);
    await ffmpeg.exec(['-i', input]); // Run FFmpeg to process the file
    ffmpeg.off('log', onLog); // Remove the listener after processing

    return { fps, width, height, hasAudio };
  } finally {
    //Remove temporary file from FFmpeg's virtual filesystem
    ffmpeg.deleteFile(input).catch(() => {});
  }
}

export async function getFullVideoMetadata(file: File): Promise<Metadata> {
  const ffmpeg = await getFFmpeg();
  const input = `meta_${crypto.randomUUID()}.mp4`;

  let fps = 0;
  let codec = '';
  let pixelFormat = '';
  let colorSpace = '';
  let bitrate = 0;

  let audioCodec = '';
  let channels = 0;
  let sampleRate = 0;
  let audioBitrate = 0;

  const onLog = ({ message }: { message: string }) => {
    const videoMatch = message.match(/Video: (\w+).*?, (\w+).*?, (\d+)x(\d+).*?, ([\d.]+) fps/);

    if (videoMatch) {
      codec = videoMatch[1];
      pixelFormat = videoMatch[2];
      fps = parseFloat(videoMatch[5]);
    }

    const bitrateMatch = message.match(/bitrate: (\d+) kb\/s/);
    if (bitrateMatch) {
      bitrate = parseInt(bitrateMatch[1]) * 1000;
    }

    const colorMatch = message.match(/, (bt\d+|smpte\d+)/);
    if (colorMatch) colorSpace = colorMatch[1];

    const audioMatch = message.match(/Audio: (\w+).*?, (\d+) Hz.*?, (stereo|mono).*?(?:, (\d+) kb\/s)?/);

    if (audioMatch) {
      audioCodec = audioMatch[1];
      sampleRate = parseInt(audioMatch[2]);
      channels = audioMatch[3] === 'stereo' ? 2 : 1;

      if (audioMatch[4]) {
        audioBitrate = parseInt(audioMatch[4]) * 1000;
      }
    }
  };

  try {
    await ffmpeg.writeFile(input, await fetchFile(file));

    ffmpeg.on('log', onLog);
    await ffmpeg.exec(['-i', input]);
    ffmpeg.off('log', onLog);

    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    const basic = await new Promise<{
      duration: number;
      width: number;
      height: number;
    }>((resolve) => {
      video.src = url;

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });

        URL.revokeObjectURL(url);
      };
    });

    const aspectRatio = basic.width && basic.height ? (basic.width / basic.height).toFixed(4) : undefined;

    return {
      duration: basic.duration,
      size: file.size,
      bitrate,
      format: file.type,

      video: {
        width: basic.width,
        height: basic.height,
        fps,
        codec,
        pixelFormat,
        colorSpace,
        aspectRatio,
      },

      audio: {
        codec: audioCodec,
        channels,
        sampleRate,
        bitrate: audioBitrate,
      },
    };
  } finally {
    ffmpeg.deleteFile(input).catch(() => {});
  }
}
