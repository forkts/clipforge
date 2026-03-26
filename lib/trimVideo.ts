import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "./ffmpeg";

export async function trimVideo(
  file: File, // Input video file
  start: number, // Start time in seconds
  end: number, // End time in seconds
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  const input = `trim_in_${crypto.randomUUID()}.mp4`;
  const output = `trim_out_${crypto.randomUUID()}.mp4`;

  try {
    await ffmpeg.writeFile(input, await fetchFile(file)); // Write file to FFmpeg's virtual filesystem

    await ffmpeg.exec([
      "-i", // Input file
      input,
      "-ss", // Seek to start time
      `${start}`,
      "-to", // End time
      `${end}`,
      "-c:v", // Video codec
      "libx264",
      "-c:a", // Audio codec
      "aac",
      output, // Output file
    ]);

    const data = (await ffmpeg.readFile(output)) as Uint8Array;

    return new Blob([new Uint8Array(data)], { type: "video/mp4" });
  } catch (error) {
    console.error("Error trimming video:", error);
    throw error;
  } finally {
    ffmpeg.deleteFile(input).catch(() => {});
    ffmpeg.deleteFile(output).catch(() => {});
  }
}