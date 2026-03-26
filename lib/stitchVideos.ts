import { TimelineClip } from '@/store/timeline.store';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';
import { getVideoMetadata } from './generateVideoMetadata';

async function canDirectConcat(clips: TimelineClip[]) {
  const metas = clips.map((c) => c.video);

  const first = metas[0];

  return metas.every(
    (m) =>
      m?.codec === first?.codec &&
      m?.width === first?.width &&
      m?.height === first?.height &&
      Math.round(m?.fps || 0) === Math.round(first?.fps || 0),
  );
}

async function fastConcat(ffmpeg: FFmpeg, clips: TimelineClip[]): Promise<string> {
  const inputNames: string[] = [];

  for (const clip of clips) {
    const name = `input_${crypto.randomUUID()}.mp4`;
    await ffmpeg.writeFile(name, await fetchFile(clip.file));
    inputNames.push(name);
  }

  const listFile = `concat_${crypto.randomUUID()}.txt`;
  const content = inputNames.map((f) => `file '${f}'`).join('\n');

  await ffmpeg.writeFile(listFile, new TextEncoder().encode(content));

  const output = `out_${crypto.randomUUID()}.mp4`;

  await ffmpeg.exec([
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listFile,
    '-c',
    'copy', // no re-encode
    '-y',
    output,
  ]);

  await ffmpeg.deleteFile(listFile).catch(() => {});
  await Promise.all(inputNames.map((f) => ffmpeg.deleteFile(f).catch(() => {})));

  return output;
}

async function normalizeClip(ffmpeg: FFmpeg, meta: TimelineClip): Promise<string> {
  const input = `input_${crypto.randomUUID()}.mp4`;
  const output = `norm_${crypto.randomUUID()}.mp4`;

  await ffmpeg.writeFile(input, await fetchFile(meta.file));

  const metaData = await getVideoMetadata(meta.file);
  const hasAudio = metaData.hasAudio;

  const args = ['-ss', `${meta.trimStart || 0}`, '-t', `${meta.duration || meta?.duration || 5}`, '-i', input];

  if (!hasAudio) {
    args.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
  }

  // ⚡ only scale if needed
  const needsResize = meta.video?.width !== 1280 || meta.video?.height !== 720;

  if (needsResize) {
    args.push('-vf', 'fps=30,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720');
  } else {
    args.push('-vf', 'fps=30');
  }

  args.push('-c:v', 'libx264', '-preset', 'superfast', '-crf', '30');

  if (hasAudio) {
    args.push('-c:a', 'aac', '-ar', '44100', '-ac', '2');
  } else {
    args.push('-c:a', 'aac', '-ar', '44100', '-ac', '2', '-shortest');
  }

  args.push('-y', output);

  await ffmpeg.exec(args);
  await ffmpeg.deleteFile(input).catch(() => {});

  return output;
}

async function normalizeAll(ffmpeg: FFmpeg, clips: TimelineClip[]): Promise<string[]> {
  const outputs: string[] = [];

  for (const clip of clips) {
    const out = await normalizeClip(ffmpeg, clip);
    outputs.push(out);
  }

  return outputs;
}

async function stitchWithTransitions(ffmpeg: FFmpeg, clips: TimelineClip[], inputs: string[]): Promise<string> {
  const output = `stitched_${crypto.randomUUID()}.mp4`;

  console.log('ADDING TRANSITIONS...');

  const inputArgs: string[] = [];
  inputs.forEach((i) => inputArgs.push('-i', i));

  let filter = '';
  let v = '[0:v]';
  let a = '[0:a]';
  let offset = 0;

  for (let i = 1; i < clips.length; i++) {
    const prev = clips[i - 1];
    const curr = clips[i];

    const dur = curr.transitionDuration || 1;
    const prevDur = prev.duration || 5;

    const effect = curr.transition || 'fade';

    const outV = `v${i}`;
    const outA = `a${i}`;

    const off = offset + prevDur - dur;

    filter += `${v}[${i}:v]xfade=transition=${effect}:duration=${dur}:offset=${off}[${outV}];`;
    filter += `${a}[${i}:a]acrossfade=d=${dur}[${outA}];`;

    v = `[${outV}]`;
    a = `[${outA}]`;
    offset = off;
    console.log('Input arguments', inputArgs);
  }

  console.log('Added input arguments');

  await ffmpeg.exec([
    ...inputArgs,
    '-filter_complex',
    filter,
    '-map',
    v,
    '-map',
    a,
    '-c:v',
    'libx264',
    '-preset',
    'superfast',
    '-crf',
    '30',
    '-c:a',
    'aac',
    '-y',
    output,
  ]);

  console.log('Added filter complex');

  return output;
}

async function normalizeInputs(
  clips: { file: File; trimStart?: number; duration?: number }[],
  ffmpeg: FFmpeg,
): Promise<string[]> {
  const normalized: string[] = [];

  for (const clip of clips) {
    const inputName = `input_${crypto.randomUUID()}.mp4`;
    const outName = `norm_${crypto.randomUUID()}.mp4`;

    await ffmpeg.writeFile(inputName, await fetchFile(clip.file));

    // Get metadata to check for audio
    const meta = await getVideoMetadata(clip.file);
    const hasAudio = meta.hasAudio;

    const args = ['-ss', `${clip.trimStart || 0}`, '-t', `${clip.duration || 10}`, '-i', inputName];

    if (!hasAudio) {
      // Add silent audio source
      args.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
    }

    args.push(
      '-vf',
      'fps=30,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,format=yuv420p',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '28',
    );

    if (hasAudio) {
      args.push('-c:a', 'aac', '-ar', '44100', '-ac', '2', '-map', '0:v:0', '-map', '0:a:0');
    } else {
      args.push('-c:a', 'aac', '-ar', '44100', '-ac', '2', '-map', '0:v:0', '-map', '1:a:0', '-shortest');
    }

    args.push('-y', outName);

    await ffmpeg.exec(args);
    normalized.push(outName);

    await ffmpeg.deleteFile(inputName);
  }

  return normalized;
}

// export async function stitchVideos(
//   clips: { file: File; trimStart?: number; duration?: number; transition?: string; transitionDuration?: number }[],
// ): Promise<Blob> {
//   const ffmpeg = await getFFmpeg();
//   const output = `stitched_${crypto.randomUUID()}.mp4`;

//   let normalizedNames: string[] = [];

//   try {
//     normalizedNames = await normalizeInputs(clips, ffmpeg);

//     const hasTransitions = clips.some((c) => c.transition && c.transition !== 'none');

//     if (!hasTransitions) {
//       const listFile = `concat_${crypto.randomUUID()}.txt`;
//       const concatContent = normalizedNames.map((name) => `file '${name}'`).join('\n');

//       await ffmpeg.writeFile(listFile, new TextEncoder().encode(concatContent));

//       await ffmpeg.exec([
//         '-f',
//         'concat',
//         '-safe',
//         '0',
//         '-fflags',
//         '+genpts',
//         '-i',
//         listFile,
//         '-c',
//         'copy',
//         '-avoid_negative_ts',
//         'make_zero',
//         '-y',
//         output,
//       ]);

//       await ffmpeg.deleteFile(listFile).catch(() => {});
//     } else {
//       // Build transition filter complex
//       const inputsArgs: string[] = [];
//       for (const name of normalizedNames) {
//         inputsArgs.push('-i', name);
//       }

//       let filterStr = '';
//       let currentVLabel = '[0:v]';
//       let currentALabel = '[0:a]';
//       let currentTotalOffset = 0;

//       for (let i = 1; i < clips.length; i++) {
//         const prevClip = clips[i - 1];
//         const currClip = clips[i];
//         const effect = currClip.transition || 'none';
//         const duration = currClip.transitionDuration || 1;

//         const prevDuration = prevClip.duration || 5;

//         // Output start of transition offset relative to output timeline
//         const offset = currentTotalOffset + prevDuration - (effect !== 'none' ? duration : 0);

//         if (effect !== 'none') {
//           const nextVLabel = `v${i}`;
//           const nextALabel = `a${i}`;

//           filterStr += `${currentVLabel}[${i}:v]xfade=transition=${effect}:duration=${duration}:offset=${offset}[${nextVLabel}]; `;
//           filterStr += `${currentALabel}[${i}:a]acrossfade=d=${duration}[${nextALabel}]; `;

//           currentVLabel = `[${nextVLabel}]`;
//           currentALabel = `[${nextALabel}]`;
//           currentTotalOffset = offset;
//         } else {
//           // No transition between prev and current: concat them logically in the transition chain
//           // Using a minimal xfade/acrossfade to maintain the chain structure
//           const nextVLabel = `v${i}`;
//           const nextALabel = `a${i}`;

//           filterStr += `${currentVLabel}[${i}:v]xfade=transition=fade:duration=0.001:offset=${currentTotalOffset + prevDuration}[${nextVLabel}]; `;
//           filterStr += `${currentALabel}[${i}:a]acrossfade=d=0.001[${nextALabel}]; `;

//           currentVLabel = `[${nextVLabel}]`;
//           currentALabel = `[${nextALabel}]`;
//           currentTotalOffset += prevDuration;
//         }
//       }

//       await ffmpeg.exec([
//         ...inputsArgs,
//         '-filter_complex',
//         filterStr.trim().replace(/;$/, ''),
//         '-map',
//         currentVLabel,
//         '-map',
//         currentALabel,
//         '-c:v',
//         'libx264',
//         '-preset',
//         'ultrafast',
//         '-crf',
//         '28',
//         '-c:a',
//         'aac',
//         '-y',
//         output,
//       ]);
//     }

//     const data = (await ffmpeg.readFile(output)) as Uint8Array;
//     return new Blob([new Uint8Array(data)], { type: 'video/mp4' });
//   } finally {
//     await Promise.allSettled([
//       ...normalizedNames.map((f) => ffmpeg.deleteFile(f)),
//       ffmpeg.deleteFile(output).catch(() => {}),
//     ]);
//   }
// }

export async function stitchVideos(clips: TimelineClip[]): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  let output = '';
  let tempFiles: string[] = [];

  try {
    const hasTransitions = clips.some((c) => c.transition && c.transition !== 'none');

    // FAST PATH
    if (!hasTransitions && (await canDirectConcat(clips))) {
      output = await fastConcat(ffmpeg, clips);
    } else {
      // NORMALIZE ONLY WHEN NEEDED
      const normalized = await normalizeAll(ffmpeg, clips);
      tempFiles = normalized;

      if (!hasTransitions) {
        // still use fast concat after normalize
        const listFile = `concat_${crypto.randomUUID()}.txt`;

        const content = normalized.map((f) => `file '${f}'`).join('\n');

        await ffmpeg.writeFile(listFile, new TextEncoder().encode(content));

        output = `stitched_${crypto.randomUUID()}.mp4`;

        await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-y', output]);

        await ffmpeg.deleteFile(listFile).catch(() => {});
      } else {
        // TRANSITION PATH
        output = await stitchWithTransitions(ffmpeg, clips, normalized);
      }
    }

    const data = (await ffmpeg.readFile(output)) as Uint8Array;

    return new Blob([new Uint8Array(data)], { type: 'video/mp4' });
  } finally {
    await Promise.allSettled([
      ...tempFiles.map((f) => ffmpeg.deleteFile(f)),
      ffmpeg.deleteFile(output).catch(() => {}),
    ]);
  }
}
