import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';

export async function stitchAudios(clips: { file: File; trimStart?: number; duration?: number }[]): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  const listFile = `concat_audio_${crypto.randomUUID()}.txt`;
  const output = `stitched_audio_${crypto.randomUUID()}.mp3`;

  const inputNames: string[] = [];
  const processedNames: string[] = [];

  try {
    for (const clip of clips) {
      const name = `audio_input_${crypto.randomUUID()}.mp3`;
      inputNames.push(name);
      await ffmpeg.writeFile(name, await fetchFile(clip.file));

      if (clip.trimStart || clip.duration) {
        const outName = `proc_${crypto.randomUUID()}.mp3`;
        processedNames.push(outName);
        await ffmpeg.exec([
          '-ss',
          `${clip.trimStart || 0}`,
          '-t',
          `${clip.duration || 1000}`,
          '-i',
          name,
          '-c:a',
          'libmp3lame',
          '-q:a',
          '2',
          '-y',
          outName,
        ]);
      } else {
        processedNames.push(name);
      }
    }

    const concatContent = processedNames.map((name) => `file '${name}'`).join('\n');

    await ffmpeg.writeFile(listFile, new TextEncoder().encode(concatContent));

    await ffmpeg.exec([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listFile,

      '-c:a',
      'copy', // Already encoded if needed

      '-y',
      output,
    ]);

    const data = (await ffmpeg.readFile(output)) as Uint8Array;
    return new Blob([new Uint8Array(data)], { type: 'audio/mp3' });
  } finally {
    await Promise.allSettled([
      ...inputNames.map((f) => ffmpeg.deleteFile(f)),
      ...processedNames.map((f) => {
        if (!inputNames.includes(f)) return ffmpeg.deleteFile(f);
        return Promise.resolve();
      }),
      ffmpeg.deleteFile(listFile).catch(() => {}),
      ffmpeg.deleteFile(output).catch(() => {}),
    ]);
  }
}
