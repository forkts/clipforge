import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';

export async function addAudioToVideo(videoFile: File, audioFile: File): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  const videoInput = `video_${crypto.randomUUID()}.mp4`;
  const audioInput = `audio_${crypto.randomUUID()}.aac`;
  const output = `merged_${crypto.randomUUID()}.mp4`;

  try {
    await ffmpeg.writeFile(videoInput, await fetchFile(videoFile));
    await ffmpeg.writeFile(audioInput, await fetchFile(audioFile));

    await ffmpeg.exec([
      '-i',
      videoInput,
      '-i',
      audioInput,

      //  use video stream from input 0
      '-map',
      '0:v:0',

      //  use audio from input 1
      '-map',
      '1:a:0',

      '-c:v',
      'copy', // fast video

      '-c:a',
      'aac',

      '-shortest', // match shortest stream

      '-y',
      output,
    ]);

    const data = (await ffmpeg.readFile(output)) as Uint8Array;
    return new Blob([new Uint8Array(data)], { type: 'video/mp4' });
  } finally {
    await Promise.allSettled([ffmpeg.deleteFile(videoInput), ffmpeg.deleteFile(audioInput), ffmpeg.deleteFile(output)]);
  }
}
