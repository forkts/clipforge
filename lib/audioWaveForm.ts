import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "./ffmpeg";

function normalizeWaveform(data: number[]): number[] {
  let max = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i] > max) max = data[i];
  }

  if (max === 0) return data;

  return data.map((v) => v / max);
}

export interface WaveformOptions {
  containerWidth: number;
  pixelsPerSample?: number;
  useStereo?: boolean;
  sampleStep?: number;
}

export async function generateWaveform(
  file: File,
  options: WaveformOptions,
): Promise<number[]> {
  const { containerWidth, pixelsPerSample = 2, sampleStep = 1 } = options;

  if (!file || containerWidth <= 0) return [];

  const ffmpeg = await getFFmpeg();

  const inputName = `in_${crypto.randomUUID()}_${file.name}`;
  const outputName = `out_${crypto.randomUUID()}.raw`;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      "-i",
      inputName,
      "-ac",
      "1",
      "-ar",
      "8000",
      "-f",
      "u8",
      "-acodec",
      "pcm_u8",
      outputName,
    ]);

    const data = (await ffmpeg.readFile(outputName)) as Uint8Array;

    const samples = Math.max(1, Math.floor(containerWidth / pixelsPerSample));
    const waveform = new Array(samples);
    const blockSize = data.length / samples;

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      let count = 0;

      const start = Math.floor(i * blockSize);
      const end = Math.floor((i + 1) * blockSize);

      for (let j = start; j < end; j += sampleStep) {
        if (j >= data.length) break;
        sum += Math.abs((data[j] ?? 128) - 128);
        count++;
      }

      waveform[i] = count ? sum / count : 0;
    }

    return normalizeWaveform(waveform);
  } finally {
    ffmpeg.deleteFile(inputName).catch(() => {});
    ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
