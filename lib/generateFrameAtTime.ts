import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';

export async function getFrameAtTime(file: File, time: number): Promise<string> {
  const ffmpeg = await getFFmpeg();

  const input = `frame_in_${crypto.randomUUID()}.mp4`;
  const output = `frame_${crypto.randomUUID()}.jpg`;

  try {
    await ffmpeg.writeFile(input, await fetchFile(file));

    await ffmpeg.exec([
      '-ss',
      `${time}`,
      '-i',
      input,
      '-frames:v', // Extract only 1 video frame
      '1',
      output,
    ]);

    const data = (await ffmpeg.readFile(output)) as Uint8Array;
    const blob = new Blob([new Uint8Array(data)], { type: 'image/jpeg' });

    return URL.createObjectURL(blob);
  } finally {
    ffmpeg.deleteFile(input).catch(() => {});
    ffmpeg.deleteFile(output).catch(() => {});
  }
}

export async function getFramesPerSecond(file: File, startTime = 0, duration = 60, fps = 1): Promise<string[]> {
  const ffmpeg = await getFFmpeg();

  const input = `input_${crypto.randomUUID()}.mp4`;
  const outputPattern = `frame_%03d.jpg`;

  const frames: string[] = [];

  try {
    await ffmpeg.writeFile(input, await fetchFile(file));

    await ffmpeg.exec([
      '-ss',
      `${startTime}`,
      '-t',
      `${duration}`,
      '-i',
      input,
      '-vf',
      `fps=${fps.toFixed(4)},scale='min(1280,iw)':-2`,
      outputPattern,
    ]);

    const totalFrames = Math.ceil((duration ?? 60) * fps);

    for (let i = 1; i <= totalFrames; i++) {
      const name = `frame_${String(i).padStart(3, '0')}.jpg`;

      try {
        const data = (await ffmpeg.readFile(name)) as Uint8Array;
        const blob = new Blob([new Uint8Array(data)], { type: 'image/jpeg' });
        frames.push(URL.createObjectURL(blob));

        await ffmpeg.deleteFile(name);
      } catch {
        break;
      }
    }

    return frames;
  } finally {
    await ffmpeg.deleteFile(input).catch(() => {});
  }
}
