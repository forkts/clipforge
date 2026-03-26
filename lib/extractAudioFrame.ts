import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';

export async function extractAudioWaveform(file: File): Promise<Float32Array> {
  const ffmpeg = await getFFmpeg();

  const input = `audio_in_${crypto.randomUUID()}.mp4`;

  // WAV = raw PCM container
  // Easy to parse (no compression like MP3/AAC)
  const output = `audio_${crypto.randomUUID()}.wav`;

  try {
    // File → Uint8Array → FFmpeg FS
    await ffmpeg.writeFile(input, await fetchFile(file));

    await ffmpeg.exec([
      '-i', // Input file
      input,
      '-ac',
      '1', // Convert to mono audio (1 channel)
      '-ar',
      '44100', // Sample rate = 44.1kHz
      '-f',
      's16le', // raw PCM
      output, // Output file
    ]);

    const data = (await ffmpeg.readFile(output)) as Uint8Array;

    // Convert PCM → Float32
    const buffer = new Int16Array(data.buffer); // Range from -32768 to 32767
    const float32 = new Float32Array(buffer.length); // Range from -1 to 1

    for (let i = 0; i < buffer.length; i++) {
      float32[i] = buffer[i] / 32768; // Normalize to range -1 to 1
    }

    return float32;
  } catch (error) {
    console.error('Error extracting audio waveform:', error);
    throw error;
  } finally {
    ffmpeg.deleteFile(input).catch(() => {});
    ffmpeg.deleteFile(output).catch(() => {});
  }
}
