import { getFrameAtTime } from "./generateFrameAtTime";

export async function generateThumbnail(file: File): Promise<string> {
  const video = document.createElement("video");
  const url = URL.createObjectURL(file);

  return new Promise((resolve) => {
    video.src = url;

    video.onloadedmetadata = async () => {
      const mid = video.duration / 2;
      const frame = await getFrameAtTime(file, mid);

      URL.revokeObjectURL(url);
      resolve(frame);
    };
  });
}