import { useMemo } from "react";

export function useVisibleRange(
  scrollLeft: number,
  width: number,
  pxToTime: (px: number) => number,
) {
  return useMemo(() => {
    return {
      start: pxToTime(scrollLeft),
      end: pxToTime(scrollLeft + width),
    };
  }, [scrollLeft, width, pxToTime]);
}
