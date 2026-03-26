import { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

// Instance of FFmpeg web assembly runtime, equivalent to running ffmpeg CLI in browser

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;

  if (loadPromise) return loadPromise;

  const load = async () => {
    const f = new FFmpeg();

    try {
      await f.load({
        coreURL: "/ffmpeg/ffmpeg-core.js",
        wasmURL: "/ffmpeg/ffmpeg-core.wasm",
      });
      console.log("FFmpeg loaded successfully");
    } catch (error) {
      console.error("Error loading FFmpeg:", error);
    }

    ffmpeg = f;
    return f;
  };

  loadPromise = load();
  return loadPromise;
}
