import React from 'react';

export function TimelineRuler({
  duration,
  timeToPx,
  pxToTime,
  onSeek,
}: {
  duration: number;
  timeToPx: (t: number) => number;
  pxToTime: (px: number) => number;
  onSeek: (time: number) => void;
}) {
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();

    const updateSeek = (clientX: number) => {
      const x = clientX - rect.left;
      onSeek(Math.max(0, pxToTime(x)));
    };

    updateSeek(e.clientX);

    const originalSelect = document.body.style.userSelect;
    const originalCursor = document.body.style.cursor;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateSeek(moveEvent.clientX);
    };

    const handlePointerUp = () => {
      document.body.style.userSelect = originalSelect;
      document.body.style.cursor = originalCursor;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      className="sticky top-0 h-6 w-full border-b border-neutral-700 bg-background z-20 text-muted-foreground select-none cursor-pointer"
      onPointerDown={handlePointerDown}
    >
      {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
        <div
          key={i}
          className="absolute bottom-0 flex flex-col justify-end pointer-events-none"
          style={{ left: timeToPx(i), transform: 'translateX(-50%)' }}
        >
          <span className="text-[10px] pb-1">{i}s</span>
          <div className="h-2 w-px bg-neutral-600 mx-auto" />
        </div>
      ))}
    </div>
  );
}
