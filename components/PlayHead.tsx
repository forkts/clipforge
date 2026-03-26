import React from "react";

interface PlayHeadProps {
  playHeadPercent: number;
}

export const PlayHead: React.FC<PlayHeadProps> = ({ playHeadPercent }) => {
  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-red-500 z-30 transition-none pointer-events-none"
      style={{ left: `${playHeadPercent}%` }}
    >
      <div className="absolute -top-6 -translate-x-1/2 w-4 h-4 bg-red-500 flex items-center justify-center rounded-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
      </div>
    </div>
  );
};
