import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';

export async function extractAudio(file: File): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const input = `ext_audio_in_${crypto.randomUUID()}.${file.name.split('.').pop() || 'mp4'}`;
  const output = `ext_audio_out_${crypto.randomUUID()}.mp3`;

  try {
    await ffmpeg.writeFile(input, await fetchFile(file));

    await ffmpeg.exec([
      '-i',
      input,
      '-q:a',
      '0',
      '-map', // Select only audio streams
      'a',
      output,
    ]);

    const data = (await ffmpeg.readFile(output)) as Uint8Array;
    return new Blob([new Uint8Array(data)], { type: 'audio/mp3' });
  } catch (error) {
    console.error('Error extracting audio:', error);
    throw error;
  } finally {
    ffmpeg.deleteFile(input).catch(() => {});
    ffmpeg.deleteFile(output).catch(() => {});
  }
}
