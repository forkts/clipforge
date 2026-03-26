import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';

export async function generateVideoFrames(
  file: File,
  frameCount = 20,
  dimensions?: { width: number; height: number },
): Promise<{
  frames: string[];
  revoke: () => void;
  actualFps?: number;
  totalFrames?: number;
}> {
  const ffmpeg = await getFFmpeg();

  const inputName = `input_${crypto.randomUUID()}_${file.name}`;
  const outPrefix = `thumb_${crypto.randomUUID()}_`;

  let videoUrl: string | null = null;
  let actualFps = 30;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Wait, FFmpeg log parsing to snag FPS
    const onLog = ({ message }: { message: string }) => {
      const match = message.match(/([\d.]+) fps/);
      if (match && match[1]) {
        const parsed = parseFloat(match[1]);
        if (parsed > 0) actualFps = parsed;
      }
    };

    ffmpeg.on('log', onLog);
    await ffmpeg.exec(['-i', inputName]);
    ffmpeg.off('log', onLog);

    const duration = await new Promise<number>((resolve) => {
      const video = document.createElement('video');
      videoUrl = URL.createObjectURL(file);

      video.src = videoUrl;

      video.onloadedmetadata = () => {
        resolve(video.duration || 10);
        cleanup();
      };

      video.onerror = () => {
        resolve(10);
        cleanup();
      };

      function cleanup() {
        video.src = '';
        video.load();
        video.onloadedmetadata = null;
        video.onerror = null;

        if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
          videoUrl = null;
        }
      }
    });

    const totalFrames = Math.floor(duration * actualFps);
    const dynamicFrameCount = Math.min(frameCount, totalFrames > 0 ? totalFrames : frameCount);
    const fps = Math.max(0.1, dynamicFrameCount / duration);

    console.log({ totalFrames, dynamicFrameCount, fps });

    await ffmpeg.exec([
      '-i',
      inputName,
      '-vf',
      dimensions
        ? `fps=${fps.toFixed(4)},scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height}`
        : `fps=${fps.toFixed(4)},scale='min(1280,iw)':-2`,
      `${outPrefix}%03d.jpg`,
    ]);

    const files = await ffmpeg.listDir('.');
    const thumbFiles = files
      .filter((f) => !f.isDir && f.name.startsWith(outPrefix))
      .map((f) => f.name)
      .sort();

    const frames: string[] = [];

    for (const name of thumbFiles) {
      const data = (await ffmpeg.readFile(name)) as Uint8Array;
      const blob = new Blob([new Uint8Array(data)], { type: 'image/jpeg' });
      frames.push(URL.createObjectURL(blob));

      ffmpeg.deleteFile(name).catch(() => {});
    }

    return {
      frames,
      revoke: () => {
        for (const url of frames) {
          URL.revokeObjectURL(url);
        }
      },
      actualFps,
      totalFrames,
    };
  } catch (error) {
    console.error('Error generating video frames:', error);
    throw error;
  } finally {
    ffmpeg.deleteFile(inputName).catch(() => {});
  }
}
