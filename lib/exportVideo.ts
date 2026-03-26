import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';

export async function exportVideo(file: File, filters: string[]): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  const input = `export_in_${crypto.randomUUID()}.mp4`;
  const output = `export_out_${crypto.randomUUID()}.mp4`;

  try {
    await ffmpeg.writeFile(input, await fetchFile(file));

    await ffmpeg.exec([
      '-i',
      input,
      '-vf',
      filters.join(','),
      '-c:v', // Encode video using H.264
      'libx264',
      '-preset',
      'fast', // Encoding speed (fast = faster, slower = better compression) ::slow, medium, fast, fast, ultrafast
      '-crf', // Constant Rate Factor (quality control)
      // | CRF | Quality   | Size     |
      // | --- | --------- | -------- |
      // | 18  | very high | large    |
      // | 23  | default   | balanced |
      // | 28  | low       | small    |
      '23', // Quality (23 = default, lower = better quality, higher = better compression)
      '-c:a', // Audio codec for mp4
      'aac',
      '-b:a', // Audio bitrate (128kbps = good quality, 64kbps = low quality, 192kbps = high quality)
      '128k',
      '-movflags', //enables instant playback in browser
      '+faststart', // Moves metadata to the beginning of the file for faster web streaming
      output,
    ]);

    const data = (await ffmpeg.readFile(output)) as Uint8Array;

    return new Blob([new Uint8Array(data)], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error exporting video:', error);
    throw error;
  } finally {
    ffmpeg.deleteFile(input).catch(() => {});
    ffmpeg.deleteFile(output).catch(() => {});
  }
}
