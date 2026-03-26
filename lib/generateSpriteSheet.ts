import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "./ffmpeg";

export async function generateSpriteSheet(
  file: File,
  fps = 1,
): Promise<string> {
  const ffmpeg = await getFFmpeg();

  const input = `sprite_in_${crypto.randomUUID()}.mp4`;
  const output = `sprite_${crypto.randomUUID()}.jpg`;

  try {
    await ffmpeg.writeFile(input, await fetchFile(file));

    // LIMIT frames to avoid OOM + tile mismatch
    const MAX_FRAMES = 100;

    await ffmpeg.exec([
      "-i",
      input,

      // limit frames
      "-vf",
      `fps=${fps},scale=160:90:force_original_aspect_ratio=increase,trim=duration=${MAX_FRAMES / fps},tile=10x10`,

      "-frames:v",
      String(MAX_FRAMES),

      "-q:v",
      "3",

      "-y", // overwrite

      output,
    ]);

    // Check if file exists BEFORE reading
    const files = await ffmpeg.listDir("/");
    const exists = files.some((f) => f.name === output);

    if (!exists) {
      throw new Error("FFmpeg did not generate output file");
    }

    const data = (await ffmpeg.readFile(output)) as Uint8Array;
    const blob = new Blob([new Uint8Array(data)], { type: "image/jpeg" });

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Sprite generation failed:", error);

    ffmpeg.on("log", ({ message }) => {
      console.log("FFmpeg:", message);
    });

    throw error;
  } finally {
    await Promise.allSettled([
      ffmpeg.deleteFile(input),
      ffmpeg.deleteFile(output),
    ]);
  }
}