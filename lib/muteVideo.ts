import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';

export async function muteVideo(file: File): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  const input = `mute_in_${crypto.randomUUID()}.mp4`;
  const output = `mute_out_${crypto.randomUUID()}.mp4`;

  try {
    await ffmpeg.writeFile(input, await fetchFile(file));

    console.log('Muting video in FFmpeg');
    console.log(input);

    await ffmpeg.exec([
      '-i',
      input,

      '-c:v',
      'copy', // no re-encode (FAST)

      '-an', // remove audio

      '-y',
      output,
    ]);

    console.log('Muted video in FFmpeg output');
    console.log(output);

    const data = (await ffmpeg.readFile(output)) as Uint8Array;
    return new Blob([new Uint8Array(data)], { type: 'video/mp4' });
  } finally {
    await Promise.allSettled([ffmpeg.deleteFile(input), ffmpeg.deleteFile(output)]);
  }
}
