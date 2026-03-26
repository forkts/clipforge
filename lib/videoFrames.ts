import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "./ffmpeg";

export interface VideoStream {
  width: number;
  height: number;
  fps: number;
  codec: string;
  pixelFormat: string;
  colorSpace?: string;
  aspectRatio?: string;
}

export interface AudioStream {
  codec: string;
  channels: number;
  sampleRate: number;
  bitrate: number;
}

export interface Metadata {
  duration?: number;
  size?: number;
  format?: string;
  video?: VideoStream;
  audio?: AudioStream;
  bitrate?: number;
}

// export async function generateVideoFrames(
//   file: File,
//   frameCount = 20,
//   dimensions?: { width: number; height: number },
// ): Promise<{
//   frames: string[];
//   revoke: () => void;
//   actualFps?: number;
//   totalFrames?: number;
// }> {
//   const ffmpeg = await getFFmpeg();

//   const inputName = `input_${crypto.randomUUID()}_${file.name}`;
//   const outPrefix = `thumb_${crypto.randomUUID()}_`;

//   let videoUrl: string | null = null;
//   let actualFps = 30;

//   try {
//     await ffmpeg.writeFile(inputName, await fetchFile(file));

//     // Wait, FFmpeg log parsing to snag FPS
//     const onLog = ({ message }: { message: string }) => {
//       const match = message.match(/([\d.]+) fps/);
//       if (match && match[1]) {
//         const parsed = parseFloat(match[1]);
//         if (parsed > 0) actualFps = parsed;
//       }
//     };

//     ffmpeg.on("log", onLog);
//     await ffmpeg.exec(["-i", inputName]);
//     ffmpeg.off("log", onLog);

//     const duration = await new Promise<number>((resolve) => {
//       const video = document.createElement("video");
//       videoUrl = URL.createObjectURL(file);

//       video.src = videoUrl;

//       video.onloadedmetadata = () => {
//         resolve(video.duration || 10);
//         cleanup();
//       };

//       video.onerror = () => {
//         resolve(10);
//         cleanup();
//       };

//       function cleanup() {
//         video.src = "";
//         video.load();
//         video.onloadedmetadata = null;
//         video.onerror = null;

//         if (videoUrl) {
//           URL.revokeObjectURL(videoUrl);
//           videoUrl = null;
//         }
//       }
//     });

//     const totalFrames = Math.floor(duration * actualFps);
//     const dynamicFrameCount = Math.min(
//       frameCount,
//       totalFrames > 0 ? totalFrames : frameCount,
//     );
//     const fps = Math.max(0.1, dynamicFrameCount / duration);

//     await ffmpeg.exec([
//       "-i",
//       inputName,
//       "-vf",
//       dimensions
//         ? `fps=${fps.toFixed(4)},scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height}`
//         : `fps=${fps.toFixed(4)},scale='min(1280,iw)':-2`,
//       `${outPrefix}%03d.jpg`,
//     ]);

//     const files = await ffmpeg.listDir(".");
//     const thumbFiles = files
//       .filter((f) => !f.isDir && f.name.startsWith(outPrefix))
//       .map((f) => f.name)
//       .sort();

//     const frames: string[] = [];

//     for (const name of thumbFiles) {
//       const data = (await ffmpeg.readFile(name)) as Uint8Array;
//       const blob = new Blob([new Uint8Array(data)], { type: "image/jpeg" });
//       frames.push(URL.createObjectURL(blob));

//       ffmpeg.deleteFile(name).catch(() => {});
//     }

//     return {
//       frames,
//       revoke: () => {
//         for (const url of frames) {
//           URL.revokeObjectURL(url);
//         }
//       },
//       actualFps,
//       totalFrames,
//     };
//   } catch (error) {
//     console.error("Error generating video frames:", error);
//     throw error;
//   } finally {
//     ffmpeg.deleteFile(inputName).catch(() => {});
//   }
// }

// export async function getVideoMetadata(file: File) {
//   const ffmpeg = await getFFmpeg(); // FFmpeg instance
//   const input = `meta_${crypto.randomUUID()}.mp4`; // TEMPORARY FILE NAME INSIDE FFMPEG'S VIRTUAL FS

//   let fps = 30; // Default FPS
//   let width = 0; // Default width
//   let height = 0; // Default height
//   let hasAudio = false;

//   // FFmpeg logs metadata in real-time, so we listen for it::: Stream #0:0: Video: h264, yuv420p, 1280x720, 30 fps
//   const onLog = ({ message }: { message: string }) => {
//     if (message.includes("Audio:")) hasAudio = true;
//     const fpsMatch = message.match(/([\d.]+) fps/); // Regex to extract FPS
//     if (fpsMatch) fps = parseFloat(fpsMatch[1]);

//     const resMatch = message.match(/, (\d+)x(\d+)/); // Regex to extract resolution
//     if (resMatch) {
//       // Logs are strings → convert to numbers
//       width = parseInt(resMatch[1]);
//       height = parseInt(resMatch[2]);
//     }
//   };

//   try {
//     // Write file to FFmpeg's virtual filesystem
//     // Converts browser File → Uint8Array
//     // Stores in FFmpeg memory FS
//     // This is the same as:
//     // await ffmpeg.writeFile(input, await file.arrayBuffer());
//     await ffmpeg.writeFile(input, await fetchFile(file));

//     // Attach the log listener BEFORE running exec
//     ffmpeg.on("log", onLog);
//     await ffmpeg.exec(["-i", input]); // Run FFmpeg to process the file
//     ffmpeg.off("log", onLog); // Remove the listener after processing

//     return { fps, width, height, hasAudio };
//   } finally {
//     //Remove temporary file from FFmpeg's virtual filesystem
//     ffmpeg.deleteFile(input).catch(() => {});
//   }
// }

// export async function getFullVideoMetadata(file: File): Promise<Metadata> {
//   const ffmpeg = await getFFmpeg();
//   const input = `meta_${crypto.randomUUID()}.mp4`;

//   let fps = 0;
//   let codec = "";
//   let pixelFormat = "";
//   let colorSpace = "";
//   let bitrate = 0;

//   let audioCodec = "";
//   let channels = 0;
//   let sampleRate = 0;
//   let audioBitrate = 0;

//   const onLog = ({ message }: { message: string }) => {
//     const videoMatch = message.match(
//       /Video: (\w+).*?, (\w+).*?, (\d+)x(\d+).*?, ([\d.]+) fps/,
//     );

//     if (videoMatch) {
//       codec = videoMatch[1];
//       pixelFormat = videoMatch[2];
//       fps = parseFloat(videoMatch[5]);
//     }

//     const bitrateMatch = message.match(/bitrate: (\d+) kb\/s/);
//     if (bitrateMatch) {
//       bitrate = parseInt(bitrateMatch[1]) * 1000;
//     }

//     const colorMatch = message.match(/, (bt\d+|smpte\d+)/);
//     if (colorMatch) colorSpace = colorMatch[1];

//     const audioMatch = message.match(
//       /Audio: (\w+).*?, (\d+) Hz.*?, (stereo|mono).*?(?:, (\d+) kb\/s)?/,
//     );

//     if (audioMatch) {
//       audioCodec = audioMatch[1];
//       sampleRate = parseInt(audioMatch[2]);
//       channels = audioMatch[3] === "stereo" ? 2 : 1;

//       if (audioMatch[4]) {
//         audioBitrate = parseInt(audioMatch[4]) * 1000;
//       }
//     }
//   };

//   try {
//     await ffmpeg.writeFile(input, await fetchFile(file));

//     ffmpeg.on("log", onLog);
//     await ffmpeg.exec(["-i", input]);
//     ffmpeg.off("log", onLog);

//     const video = document.createElement("video");
//     const url = URL.createObjectURL(file);

//     const basic = await new Promise<{
//       duration: number;
//       width: number;
//       height: number;
//     }>((resolve) => {
//       video.src = url;

//       video.onloadedmetadata = () => {
//         resolve({
//           duration: video.duration,
//           width: video.videoWidth,
//           height: video.videoHeight,
//         });

//         URL.revokeObjectURL(url);
//       };
//     });

//     const aspectRatio =
//       basic.width && basic.height
//         ? (basic.width / basic.height).toFixed(4)
//         : undefined;

//     return {
//       duration: basic.duration,
//       size: file.size,
//       bitrate,
//       format: file.type,

//       video: {
//         width: basic.width,
//         height: basic.height,
//         fps,
//         codec,
//         pixelFormat,
//         colorSpace,
//         aspectRatio,
//       },

//       audio: {
//         codec: audioCodec,
//         channels,
//         sampleRate,
//         bitrate: audioBitrate,
//       },
//     };
//   } finally {
//     ffmpeg.deleteFile(input).catch(() => {});
//   }
// }

// export async function trimVideo(
//   file: File, // Input video file
//   start: number, // Start time in seconds
//   end: number, // End time in seconds
// ): Promise<Blob> {
//   const ffmpeg = await getFFmpeg();

//   const input = `trim_in_${crypto.randomUUID()}.mp4`;
//   const output = `trim_out_${crypto.randomUUID()}.mp4`;

//   try {
//     await ffmpeg.writeFile(input, await fetchFile(file)); // Write file to FFmpeg's virtual filesystem

//     await ffmpeg.exec([
//       "-i", // Input file
//       input,
//       "-ss", // Seek to start time
//       `${start}`,
//       "-to", // End time
//       `${end}`,
//       "-c:v", // Video codec
//       "libx264",
//       "-c:a", // Audio codec
//       "aac",
//       output, // Output file
//     ]);

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;

//     return new Blob([new Uint8Array(data)], { type: "video/mp4" });
//   } catch (error) {
//     console.error("Error trimming video:", error);
//     throw error;
//   } finally {
//     ffmpeg.deleteFile(input).catch(() => {});
//     ffmpeg.deleteFile(output).catch(() => {});
//   }
// }

// // Seek → Decode → Grab 1 frame → Save as image
// export async function getFrameAtTime(
//   file: File,
//   time: number,
// ): Promise<string> {
//   const ffmpeg = await getFFmpeg();

//   const input = `frame_in_${crypto.randomUUID()}.mp4`;
//   const output = `frame_${crypto.randomUUID()}.jpg`;

//   try {
//     await ffmpeg.writeFile(input, await fetchFile(file));

//     await ffmpeg.exec([
//       "-ss",
//       `${time}`,
//       "-i",
//       input,
//       "-frames:v", // Extract only 1 video frame
//       "1",
//       output,
//     ]);

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;
//     const blob = new Blob([new Uint8Array(data)], { type: "image/jpeg" });

//     return URL.createObjectURL(blob);
//   } finally {
//     ffmpeg.deleteFile(input).catch(() => {});
//     ffmpeg.deleteFile(output).catch(() => {});
//   }
// }

// export async function generateThumbnail(file: File): Promise<string> {
//   const video = document.createElement("video");
//   const url = URL.createObjectURL(file);

//   return new Promise((resolve) => {
//     video.src = url;

//     video.onloadedmetadata = async () => {
//       const mid = video.duration / 2;
//       const frame = await getFrameAtTime(file, mid);

//       URL.revokeObjectURL(url);
//       resolve(frame);
//     };
//   });
// }

// /* SPRITE SHEET (TIMELINE PREVIEW) */
// // Video → sample frames → resize → pack into grid → one image
// // export async function generateSpriteSheet(
// //   file: File, //Input file
// //   fps = 1, // How many frames per second to extract
// // ): Promise<string> {
// //   const ffmpeg = await getFFmpeg();

// //   const input = `sprite_in_${crypto.randomUUID()}.mp4`;
// //   const output = `sprite_${crypto.randomUUID()}.jpg`;

// //   try {
// //     await ffmpeg.writeFile(input, await fetchFile(file));

// //     const res = await ffmpeg.exec([
// //       "-i",
// //       input,
// //       "-vf",
// //       `fps=${fps},scale=160:90:force_original_aspect_ratio=cover,tile=10x10`,
// //       // extracts one frame per second,
// //       // fps=1 → 60 frames,
// //       // fps=2 → 120 frames
// //       // resizes to 160x90,
// //       // force_original_aspect_ratio=cover ensures the aspect ratio is maintained
// //       // and tiles them in a 10x10 grid
// //       "-q:v",
// //       "2", // Quality (2 = high quality, 31 = low quality)
// //       output,
// //     ]);

// //     const data = (await ffmpeg.readFile(output)) as Uint8Array; // Raw JPEG binary
// //     const blob = new Blob([new Uint8Array(data)], { type: "image/jpeg" });

// //     console.log("Sprite sheet generated:", { res, blob, data });

// //     return URL.createObjectURL(blob);
// //   } catch (error) {
// //     console.error("Error generating sprite sheet:", error);
// //     throw error;
// //   } finally {
// //     ffmpeg.deleteFile(input).catch(() => {});
// //     ffmpeg.deleteFile(output).catch(() => {});
// //   }
// // }

// export async function generateSpriteSheet(
//   file: File,
//   fps = 1,
// ): Promise<string> {
//   const ffmpeg = await getFFmpeg();

//   const input = `sprite_in_${crypto.randomUUID()}.mp4`;
//   const output = `sprite_${crypto.randomUUID()}.jpg`;

//   try {
//     await ffmpeg.writeFile(input, await fetchFile(file));

//     // LIMIT frames to avoid OOM + tile mismatch
//     const MAX_FRAMES = 100;

//     await ffmpeg.exec([
//       "-i",
//       input,

//       // limit frames
//       "-vf",
//       `fps=${fps},scale=160:90:force_original_aspect_ratio=increase,trim=duration=${MAX_FRAMES / fps},tile=10x10`,

//       "-frames:v",
//       String(MAX_FRAMES),

//       "-q:v",
//       "3",

//       "-y", // overwrite

//       output,
//     ]);

//     // Check if file exists BEFORE reading
//     const files = await ffmpeg.listDir("/");
//     const exists = files.some((f) => f.name === output);

//     if (!exists) {
//       throw new Error("FFmpeg did not generate output file");
//     }

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;
//     const blob = new Blob([new Uint8Array(data)], { type: "image/jpeg" });

//     return URL.createObjectURL(blob);
//   } catch (error) {
//     console.error("Sprite generation failed:", error);

//     ffmpeg.on("log", ({ message }) => {
//       console.log("FFmpeg:", message);
//     });

//     throw error;
//   } finally {
//     await Promise.allSettled([
//       ffmpeg.deleteFile(input),
//       ffmpeg.deleteFile(output),
//     ]);
//   }
// }

// // Video → extract audio → convert to mono → resample → PCM → normalize → Float32
// export async function extractAudioWaveform(file: File): Promise<Float32Array> {
//   const ffmpeg = await getFFmpeg();

//   const input = `audio_in_${crypto.randomUUID()}.mp4`;

//   // WAV = raw PCM container
//   // Easy to parse (no compression like MP3/AAC)
//   const output = `audio_${crypto.randomUUID()}.wav`;

//   try {
//     // File → Uint8Array → FFmpeg FS
//     await ffmpeg.writeFile(input, await fetchFile(file));

//     await ffmpeg.exec([
//       "-i", // Input file
//       input,
//       "-ac",
//       "1", // Convert to mono audio (1 channel)
//       "-ar",
//       "44100", // Sample rate = 44.1kHz
//       "-f",
//       "s16le", // raw PCM
//       output, // Output file
//     ]);

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;

//     // Convert PCM → Float32
//     const buffer = new Int16Array(data.buffer); // Range from -32768 to 32767
//     const float32 = new Float32Array(buffer.length); // Range from -1 to 1

//     for (let i = 0; i < buffer.length; i++) {
//       float32[i] = buffer[i] / 32768; // Normalize to range -1 to 1
//     }

//     return float32;
//   } catch (error) {
//     console.error("Error extracting audio waveform:", error);
//     throw error;
//   } finally {
//     ffmpeg.deleteFile(input).catch(() => {});
//     ffmpeg.deleteFile(output).catch(() => {});
//   }
// }

// /* Example filters = ["scale=1280:720", "eq=contrast=1.2", "hue=s=0"];

//  */
// export async function exportVideo(
//   file: File,
//   filters: string[],
// ): Promise<Blob> {
//   const ffmpeg = await getFFmpeg();

//   const input = `export_in_${crypto.randomUUID()}.mp4`;
//   const output = `export_out_${crypto.randomUUID()}.mp4`;

//   try {
//     await ffmpeg.writeFile(input, await fetchFile(file));

//     await ffmpeg.exec([
//       "-i",
//       input,
//       "-vf",
//       filters.join(","),
//       "-c:v", // Encode video using H.264
//       "libx264",
//       "-preset",
//       "fast", // Encoding speed (fast = faster, slower = better compression) ::slow, medium, fast, fast, ultrafast
//       "-crf", // Constant Rate Factor (quality control)
//       // | CRF | Quality   | Size     |
//       // | --- | --------- | -------- |
//       // | 18  | very high | large    |
//       // | 23  | default   | balanced |
//       // | 28  | low       | small    |
//       "23", // Quality (23 = default, lower = better quality, higher = better compression)
//       "-c:a", // Audio codec for mp4
//       "aac",
//       "-b:a", // Audio bitrate (128kbps = good quality, 64kbps = low quality, 192kbps = high quality)
//       "128k",
//       "-movflags", //enables instant playback in browser
//       "+faststart", // Moves metadata to the beginning of the file for faster web streaming
//       output,
//     ]);

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;

//     return new Blob([new Uint8Array(data)], { type: "video/mp4" });
//   } catch (error) {
//     console.error("Error exporting video:", error);
//     throw error;
//   } finally {
//     ffmpeg.deleteFile(input).catch(() => {});
//     ffmpeg.deleteFile(output).catch(() => {});
//   }
// }

// export async function extractAudio(file: File): Promise<Blob> {
//   const ffmpeg = await getFFmpeg();
//   const input = `ext_audio_in_${crypto.randomUUID()}.${file.name.split(".").pop() || "mp4"}`;
//   const output = `ext_audio_out_${crypto.randomUUID()}.mp3`;

//   try {
//     await ffmpeg.writeFile(input, await fetchFile(file));

//     await ffmpeg.exec([
//       "-i",
//       input,
//       "-q:a",
//       "0",
//       "-map", // Select only audio streams
//       "a",
//       output,
//     ]);

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;
//     return new Blob([new Uint8Array(data)], { type: "audio/mp3" });
//   } catch (error) {
//     console.error("Error extracting audio:", error);
//     throw error;
//   } finally {
//     ffmpeg.deleteFile(input).catch(() => {});
//     ffmpeg.deleteFile(output).catch(() => {});
//   }
// }

// export async function stitchAudios(clips: { file: File; trimStart?: number; duration?: number }[]): Promise<Blob> {
//   const ffmpeg = await getFFmpeg();

//   const listFile = `concat_audio_${crypto.randomUUID()}.txt`;
//   const output = `stitched_audio_${crypto.randomUUID()}.mp3`;

//   const inputNames: string[] = [];
//   const processedNames: string[] = [];

//   try {
//     for (const clip of clips) {
//       const name = `audio_input_${crypto.randomUUID()}.mp3`;
//       inputNames.push(name);
//       await ffmpeg.writeFile(name, await fetchFile(clip.file));

//       if (clip.trimStart || clip.duration) {
//         const outName = `proc_${crypto.randomUUID()}.mp3`;
//         processedNames.push(outName);
//         await ffmpeg.exec([
//             "-ss", `${clip.trimStart || 0}`,
//             "-t", `${clip.duration || 1000}`,
//             "-i", name,
//             "-c:a", "libmp3lame",
//             "-q:a", "2",
//             "-y",
//             outName
//         ]);
//       } else {
//         processedNames.push(name);
//       }
//     }

//     const concatContent = processedNames
//       .map((name) => `file '${name}'`)
//       .join("\n");

//     await ffmpeg.writeFile(listFile, new TextEncoder().encode(concatContent));

//     await ffmpeg.exec([
//       "-f",
//       "concat",
//       "-safe",
//       "0",
//       "-i",
//       listFile,

//       "-c:a",
//       "copy", // Already encoded if needed

//       "-y",
//       output,
//     ]);

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;
//     return new Blob([new Uint8Array(data)], { type: "audio/mp3" });
//   } finally {
//     await Promise.allSettled([
//       ...inputNames.map((f) => ffmpeg.deleteFile(f)),
//       ...processedNames.map((f) => {
//         if (!inputNames.includes(f)) return ffmpeg.deleteFile(f);
//         return Promise.resolve();
//       }),
//       ffmpeg.deleteFile(listFile).catch(() => {}),
//       ffmpeg.deleteFile(output).catch(() => {}),
//     ]);
//   }
// }

// async function normalizeInputs(
//   clips: { file: File; trimStart?: number; duration?: number }[],
//   ffmpeg: FFmpeg,
// ): Promise<string[]> {
//   const normalized: string[] = [];

//   for (const clip of clips) {
//     const inputName = `input_${crypto.randomUUID()}.mp4`;
//     const outName = `norm_${crypto.randomUUID()}.mp4`;

//     await ffmpeg.writeFile(inputName, await fetchFile(clip.file));

//     // Get metadata to check for audio
//     const meta = await getVideoMetadata(clip.file);
//     const hasAudio = meta.hasAudio;

//     const args = [
//       "-ss", `${clip.trimStart || 0}`,
//       "-t", `${clip.duration || 10}`,
//       "-i", inputName,
//     ];

//     if (!hasAudio) {
//       // Add silent audio source
//       args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100");
//     }

//     args.push(
//       "-vf", "fps=30,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,format=yuv420p",
//       "-c:v", "libx264",
//       "-preset", "ultrafast",
//       "-crf", "28",
//     );

//     if (hasAudio) {
//       args.push("-c:a", "aac", "-ar", "44100", "-ac", "2", "-map", "0:v:0", "-map", "0:a:0");
//     } else {
//       args.push("-c:a", "aac", "-ar", "44100", "-ac", "2", "-map", "0:v:0", "-map", "1:a:0", "-shortest");
//     }

//     args.push("-y", outName);

//     await ffmpeg.exec(args);
//     normalized.push(outName);

//     await ffmpeg.deleteFile(inputName);
//   }

//   return normalized;
// }

// export async function stitchVideos(clips: { file: File; trimStart?: number; duration?: number; transition?: string; transitionDuration?: number }[]): Promise<Blob> {
//   const ffmpeg = await getFFmpeg();
//   const output = `stitched_${crypto.randomUUID()}.mp4`;

//   let normalizedNames: string[] = [];

//   try {
//     normalizedNames = await normalizeInputs(clips, ffmpeg);

//     const hasTransitions = clips.some(c => c.transition && c.transition !== "none");

//     if (!hasTransitions) {
//       const listFile = `concat_${crypto.randomUUID()}.txt`;
//       const concatContent = normalizedNames
//         .map((name) => `file '${name}'`)
//         .join("\n");

//       await ffmpeg.writeFile(listFile, new TextEncoder().encode(concatContent));

//       await ffmpeg.exec([
//         "-f",
//         "concat",
//         "-safe",
//         "0",
//         "-fflags",
//         "+genpts",
//         "-i",
//         listFile,
//         "-c",
//         "copy",
//         "-avoid_negative_ts",
//         "make_zero",
//         "-y",
//         output,
//       ]);

//       await ffmpeg.deleteFile(listFile).catch(() => {});
//     } else {
//         // Build transition filter complex
//         const inputsArgs: string[] = [];
//         for (const name of normalizedNames) {
//             inputsArgs.push("-i", name);
//         }

//         let filterStr = "";
//         let currentVLabel = "[0:v]";
//         let currentALabel = "[0:a]";
//         let currentTotalOffset = 0;

//         for (let i = 1; i < clips.length; i++) {
//             const prevClip = clips[i - 1];
//             const currClip = clips[i];
//             const effect = currClip.transition || "none";
//             const duration = currClip.transitionDuration || 1;

//             const prevDuration = prevClip.duration || 5;

//             // Output start of transition offset relative to output timeline
//             const offset = currentTotalOffset + prevDuration - (effect !== "none" ? duration : 0);

//             if (effect !== "none") {
//               const nextVLabel = `v${i}`;
//               const nextALabel = `a${i}`;

//               filterStr += `${currentVLabel}[${i}:v]xfade=transition=${effect}:duration=${duration}:offset=${offset}[${nextVLabel}]; `;
//               filterStr += `${currentALabel}[${i}:a]acrossfade=d=${duration}[${nextALabel}]; `;

//               currentVLabel = `[${nextVLabel}]`;
//               currentALabel = `[${nextALabel}]`;
//               currentTotalOffset = offset;
//             } else {
//               // No transition between prev and current: concat them logically in the transition chain
//               // Using a minimal xfade/acrossfade to maintain the chain structure
//               const nextVLabel = `v${i}`;
//               const nextALabel = `a${i}`;

//               filterStr += `${currentVLabel}[${i}:v]xfade=transition=fade:duration=0.001:offset=${currentTotalOffset + prevDuration}[${nextVLabel}]; `;
//               filterStr += `${currentALabel}[${i}:a]acrossfade=d=0.001[${nextALabel}]; `;

//               currentVLabel = `[${nextVLabel}]`;
//               currentALabel = `[${nextALabel}]`;
//               currentTotalOffset += prevDuration;
//             }
//         }

//         await ffmpeg.exec([
//             ...inputsArgs,
//             "-filter_complex", filterStr.trim().replace(/;$/, ""),
//             "-map", currentVLabel,
//             "-map", currentALabel,
//             "-c:v", "libx264",
//             "-preset", "ultrafast",
//             "-crf", "28",
//             "-c:a", "aac",
//             "-y",
//             output,
//         ]);
//     }

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;
//     return new Blob([new Uint8Array(data)], { type: "video/mp4" });
//   } finally {
//     await Promise.allSettled([
//       ...normalizedNames.map((f) => ffmpeg.deleteFile(f)),
//       ffmpeg.deleteFile(output).catch(() => {}),
//     ]);
//   }
// }

// export async function muteVideo(file: File): Promise<Blob> {
//   const ffmpeg = await getFFmpeg();

//   const input = `mute_in_${crypto.randomUUID()}.mp4`;
//   const output = `mute_out_${crypto.randomUUID()}.mp4`;

//   try {
//     await ffmpeg.writeFile(input, await fetchFile(file));

//     console.log("Muting video in FFmpeg");
//     console.log(input);

//     await ffmpeg.exec([
//       "-i",
//       input,

//       "-c:v",
//       "copy", // no re-encode (FAST)

//       "-an", // remove audio

//       "-y",
//       output,
//     ]);

//     console.log("Muted video in FFmpeg output");
//     console.log(output);

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;
//     return new Blob([new Uint8Array(data)], { type: "video/mp4" });
//   } finally {
//     await Promise.allSettled([
//       ffmpeg.deleteFile(input),
//       ffmpeg.deleteFile(output),
//     ]);
//   }
// }

// export async function addAudioToVideo(
//   videoFile: File,
//   audioFile: File,
// ): Promise<Blob> {
//   const ffmpeg = await getFFmpeg();

//   const videoInput = `video_${crypto.randomUUID()}.mp4`;
//   const audioInput = `audio_${crypto.randomUUID()}.aac`;
//   const output = `merged_${crypto.randomUUID()}.mp4`;

//   try {
//     await ffmpeg.writeFile(videoInput, await fetchFile(videoFile));
//     await ffmpeg.writeFile(audioInput, await fetchFile(audioFile));

//     await ffmpeg.exec([
//       "-i",
//       videoInput,
//       "-i",
//       audioInput,

//       //  use video stream from input 0
//       "-map",
//       "0:v:0",

//       //  use audio from input 1
//       "-map",
//       "1:a:0",

//       "-c:v",
//       "copy", // fast video

//       "-c:a",
//       "aac",

//       "-shortest", // match shortest stream

//       "-y",
//       output,
//     ]);

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;
//     return new Blob([new Uint8Array(data)], { type: "video/mp4" });
//   } finally {
//     await Promise.allSettled([
//       ffmpeg.deleteFile(videoInput),
//       ffmpeg.deleteFile(audioInput),
//       ffmpeg.deleteFile(output),
//     ]);
//   }
// }
